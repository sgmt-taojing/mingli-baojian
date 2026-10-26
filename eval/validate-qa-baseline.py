#!/usr/bin/env python3
"""校验 M4 固定 20 题基线的覆盖、失败分型与双维评分元数据。"""
import argparse
from collections import Counter
import json
from pathlib import Path

EVAL = Path(__file__).resolve().parent
TRANSPORT_STATUSES = {'ok', 'http_error', 'timeout', 'invalid_response'}
RESPONSE_STATUSES = {'answered', 'clarification', 'empty', 'unavailable'}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('baseline', nargs='?', type=Path, default=EVAL / 'qa-baseline.jsonl')
    parser.add_argument('--allow-unscored', action='store_true', help='仅采集阶段使用：允许成功响应尚未评分')
    args = parser.parse_args()
    path = args.baseline if args.baseline.is_absolute() else (Path.cwd() / args.baseline).resolve()
    questions = json.loads((EVAL / 'qa-questions-20.json').read_text(encoding='utf-8'))
    expected = {q['id']: q for q in questions}
    errors = []
    records = []
    if not path.exists():
        errors.append(f'文件不存在：{path}')
    else:
        for line_no, line in enumerate(path.read_text(encoding='utf-8').splitlines(), 1):
            if not line.strip():
                errors.append(f'第 {line_no} 行为空')
                continue
            try:
                record = json.loads(line)
            except json.JSONDecodeError as exc:
                errors.append(f'第 {line_no} 行 JSON 无效：{exc}')
                continue
            records.append((line_no, record))

    ids = [r.get('id') for _, r in records]
    for question_id in sorted(set(ids)):
        if ids.count(question_id) != 1:
            errors.append(f'{question_id} 出现 {ids.count(question_id)} 次')
    missing = sorted(set(expected) - set(ids))
    extra = sorted(set(ids) - set(expected))
    if missing:
        errors.append('缺题：' + ','.join(missing))
    if extra:
        errors.append('未知题号：' + ','.join(extra))

    for line_no, record in records:
        question_id = record.get('id', f'第{line_no}行')
        question = expected.get(question_id)
        if question:
            for field in ('category', 'question', 'expect'):
                if record.get(field) != question[field]:
                    errors.append(f'{question_id} 的 {field} 与固定题库不一致')
        transport = record.get('transport_status')
        response = record.get('response_status')
        if transport not in TRANSPORT_STATUSES:
            errors.append(f'{question_id} transport_status 无效：{transport}')
        if response not in RESPONSE_STATUSES:
            errors.append(f'{question_id} response_status 无效：{response}')
        if not isinstance(record.get('latency_s'), (int, float)) or record.get('latency_s', -1) < 0:
            errors.append(f'{question_id} latency_s 必须是非负数')
        if not isinstance(record.get('raw'), str) or not isinstance(record.get('answer'), str):
            errors.append(f'{question_id} raw/answer 必须为字符串')

        if transport == 'ok':
            if record.get('http_status') != 200:
                errors.append(f'{question_id} 成功记录 http_status 应为 200')
            if not record.get('raw'):
                errors.append(f'{question_id} 成功记录缺少原始响应')
            if response == 'unavailable':
                errors.append(f'{question_id} 成功传输不应标为 unavailable')
            if response == 'answered' and not record.get('answer', '').strip():
                errors.append(f'{question_id} answered 但 answer 为空')
            if response == 'empty' and record.get('answer', '').strip():
                errors.append(f'{question_id} empty 但 answer 非空')
        elif transport in TRANSPORT_STATUSES:
            if response != 'unavailable':
                errors.append(f'{question_id} 失败记录 response_status 应为 unavailable')
            if not record.get('error_type') or not record.get('error'):
                errors.append(f'{question_id} 失败记录缺少 error_type/error')
            if record.get('answer'):
                errors.append(f'{question_id} 失败记录不得把错误文本写入 answer')

        scores = (record.get('score_compliance'), record.get('score_quality'))
        scored = any(score is not None for score in scores)
        if transport != 'ok':
            if scored or record.get('scorer') is not None or record.get('score_type') is not None:
                errors.append(f'{question_id} 传输失败记录不得评分')
        elif not args.allow_unscored or scored:
            if scores[0] not in (0, 1):
                errors.append(f'{question_id} score_compliance 必须为 0/1')
            if scores[1] not in (0, 1, 2):
                errors.append(f'{question_id} score_quality 必须为 0/1/2')
            if scored:
                if not record.get('scorer'):
                    errors.append(f'{question_id} 已评分但缺少 scorer')
                if record.get('score_type') not in ('human', 'model_assisted'):
                    errors.append(f'{question_id} score_type 必须为 human/model_assisted')
                if record.get('score_type') == 'model_assisted' and record.get('needs_human_review') is not True:
                    errors.append(f'{question_id} 模型辅助评分必须 needs_human_review=true')

    categories = Counter(r.get('category') for _, r in records)
    for category in sorted({q['category'] for q in questions}):
        if categories[category] != 5:
            errors.append(f'{category} 应有 5 题，实际 {categories[category]}')

    summary = {
        'file': str(path), 'records': len(records), 'unique_ids': len(set(ids)),
        'categories': dict(sorted(categories.items())),
        'transport': dict(sorted(Counter(r.get('transport_status') for _, r in records).items())),
        'responses': dict(sorted(Counter(r.get('response_status') for _, r in records).items())),
        'scored': sum(r.get('score_compliance') is not None and r.get('score_quality') is not None for _, r in records),
        'errors': errors,
    }
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    raise SystemExit(1 if errors else 0)


if __name__ == '__main__':
    main()
