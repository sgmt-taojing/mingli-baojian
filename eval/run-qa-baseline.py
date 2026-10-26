#!/usr/bin/env python3
"""M4 固定 20 题实战链路采集；保留原始响应并区分传输与业务应答失败。

示例：
  python3 eval/run-qa-baseline.py --only Q03
  python3 eval/run-qa-baseline.py --only B01,B02 --timeout 60
  python3 eval/run-qa-baseline.py --output eval/qa-baseline-20261027.jsonl

评分不会由采集器自动伪造；初始为 null，须由独立评审回填。
"""
import argparse
from datetime import datetime, timezone
import json
import socket
import time
import urllib.error
import urllib.request
from pathlib import Path

EVAL = Path(__file__).resolve().parent
DEFAULT_OUTPUT = EVAL / 'qa-baseline-20261027.jsonl'
DEFAULT_ENDPOINT = 'http://127.0.0.1:8920/api/ai/orchestrate'


def parse_args():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument('--only', help='逗号分隔的题号或 1 起始序号，如 B01,Q03 或 1,3')
    parser.add_argument('--timeout', type=float, default=170.0)
    parser.add_argument('--endpoint', default=DEFAULT_ENDPOINT)
    parser.add_argument('--pause', type=float, default=1.0, help='题间暂停秒数')
    return parser.parse_args()


def load_questions():
    questions = json.loads((EVAL / 'qa-questions-20.json').read_text(encoding='utf-8'))
    ids = [q['id'] for q in questions]
    if len(questions) != 20 or len(set(ids)) != 20:
        raise ValueError('固定题库必须恰好包含 20 个唯一 ID')
    return questions


def select_questions(questions, only):
    if not only:
        return questions
    selected = []
    for token in (part.strip() for part in only.split(',')):
        if not token:
            continue
        if token.isdigit():
            index = int(token) - 1
            if not 0 <= index < len(questions):
                raise ValueError(f'序号越界：{token}')
            selected.append(questions[index])
        else:
            matches = [q for q in questions if q['id'].lower() == token.lower()]
            if not matches:
                raise ValueError(f'未知题号：{token}')
            selected.append(matches[0])
    if not selected:
        raise ValueError('--only 未选择任何题目')
    return list({q['id']: q for q in selected}.values())


def completed_ids(path):
    done = set()
    if not path.exists():
        return done
    for line_no, line in enumerate(path.read_text(encoding='utf-8').splitlines(), 1):
        if not line.strip():
            continue
        try:
            record = json.loads(line)
            done.add(record['id'])
        except (json.JSONDecodeError, KeyError) as exc:
            raise ValueError(f'{path}:{line_no} 不是有效基线记录：{exc}') from exc
    return done


def blank_scores(record):
    record.update(score_compliance=None, score_quality=None, scorer=None,
                  score_type=None, needs_human_review=True, score_notes=None)


def collect(question, endpoint, timeout):
    record = dict(question)
    record.update({
        'provider': 'orchestrator',
        'model': '多智能体编排 /api/ai/orchestrate（KB+规则，非直接生成模型评测）',
        'endpoint': endpoint,
        'collected_at': datetime.now(timezone.utc).isoformat(),
        'transport_status': 'ok',
        'response_status': 'empty',
        'http_status': None,
        'error_type': None,
        'error': None,
        'raw': '',
        'answer': '',
        'agents': [],
        'passed': None,
        'need_clarification': False,
    })
    blank_scores(record)
    payload = json.dumps({'query': question['question']}, ensure_ascii=False).encode('utf-8')
    request = urllib.request.Request(
        endpoint, data=payload,
        headers={'Content-Type': 'application/json', 'User-Agent': 'mingli-qa-baseline/2.0'})
    started = time.monotonic()
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            record['http_status'] = response.status
            record['raw'] = response.read().decode('utf-8', errors='replace')
        try:
            body = json.loads(record['raw'])
            data = body.get('data', body) if isinstance(body, dict) else None
            if not isinstance(data, dict):
                raise ValueError('响应缺少对象 data')
            final = data.get('final') or {}
            if not isinstance(final, dict):
                raise ValueError('响应 final 不是对象')
            answer = final.get('content')
            record['answer'] = answer.strip() if isinstance(answer, str) else ''
            record['agents'] = [p.get('agent') for p in data.get('plan', []) if isinstance(p, dict)]
            record['passed'] = final.get('passed')
            record['need_clarification'] = bool(data.get('needClarification') or final.get('needClarification'))
            questions = data.get('questions') or final.get('questions') or []
            if record['need_clarification']:
                record['response_status'] = 'clarification'
                if not record['answer'] and questions:
                    record['answer'] = '\n'.join(
                        str(item.get('text', '')) for item in questions if isinstance(item, dict))
            elif record['answer']:
                record['response_status'] = 'answered'
        except (json.JSONDecodeError, ValueError, TypeError) as exc:
            record['transport_status'] = 'invalid_response'
            record['response_status'] = 'unavailable'
            record['error_type'] = type(exc).__name__
            record['error'] = str(exc)
            record['answer'] = ''
    except urllib.error.HTTPError as exc:
        record.update(transport_status='http_error', response_status='unavailable',
                      http_status=exc.code, error_type=type(exc).__name__, error=str(exc))
        record['raw'] = exc.read().decode('utf-8', errors='replace')
    except (TimeoutError, socket.timeout) as exc:
        record.update(transport_status='timeout', response_status='unavailable',
                      error_type=type(exc).__name__, error=str(exc) or 'request timed out')
    except (urllib.error.URLError, OSError) as exc:
        reason = getattr(exc, 'reason', None)
        is_timeout = isinstance(reason, (TimeoutError, socket.timeout))
        record.update(transport_status='timeout' if is_timeout else 'http_error',
                      response_status='unavailable', error_type=type(exc).__name__,
                      error=str(exc) or ('request timed out' if is_timeout else 'request failed'))
    record['latency_s'] = round(time.monotonic() - started, 3)
    return record


def main():
    args = parse_args()
    if args.timeout <= 0 or args.pause < 0:
        raise ValueError('timeout 必须大于 0，pause 不得为负数')
    output = args.output if args.output.is_absolute() else (Path.cwd() / args.output).resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    questions = select_questions(load_questions(), args.only)
    done = completed_ids(output)
    for index, question in enumerate(questions):
        if question['id'] in done:
            print(f"{question['id']} 已采集跳过", flush=True)
            continue
        record = collect(question, args.endpoint, args.timeout)
        with output.open('a', encoding='utf-8') as stream:
            stream.write(json.dumps(record, ensure_ascii=False) + '\n')
            stream.flush()
        print(f"{question['id']} {record['latency_s']}s "
              f"transport={record['transport_status']} response={record['response_status']} "
              f"answer_len={len(record['answer'])}", flush=True)
        if index < len(questions) - 1 and args.pause:
            time.sleep(args.pause)
    print(f'本批完成：{output}', flush=True)


if __name__ == '__main__':
    main()
