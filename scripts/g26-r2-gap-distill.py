#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
G26 R2 · 差集补蒸馏（命理域，ADR-024 边界：禁医学诊疗口径）
- 差集 3 件（R1 审计 DELIVERY/g26-r1-audit-20260907-1226.json）：
  ①财帛宫星耀含义（紫微）②倪海厦地纪日记仅存8篇（堪舆）③八字基础（八字）
- 管线：切块(≈3.5K字) → AI 蒸馏(glm-5.2/g2claw) → JSON 条目 → 质量门 → kb_formal
- 幂等：fingerprint='G26|<md5>' 去重，可断点续跑；--max-chunks 控制单批量
- 质量门：content≥300字、标题非空、命理锚点词命中、医学诊疗口径剔除
"""
import json, os, re, sys, sqlite3, hashlib, time
from pathlib import Path
from datetime import datetime
from urllib import request as urlreq

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))
from yidao_safe import safe_close  # noqa: E402

DB = ROOT / 'server' / 'database' / 'yidao.db'
API_BASE = os.environ.get('AI_API_BASE', 'https://api.g2claw.com')
API_KEY = os.environ.get('G2CLAW_API_KEY', '')
MODEL = os.environ.get('AI_MODEL', 'glm-5.2')
NOW = datetime.now().isoformat()

DOCS = [
    {'path': ROOT / '.openclaw/tmp/luzong2-extract/财帛宫星耀含义.txt',
     'name': '财帛宫星耀含义', 'module': 'ziwei', 'source': '路总紫微课件'},
    {'path': ROOT / '.openclaw/tmp/pdf-extract/倪海厦地纪日记仅存8篇.txt',
     'name': '倪海厦地纪日记仅存8篇', 'module': 'fengshui', 'source': '倪师地纪日记'},
    {'path': ROOT / '.openclaw/tmp/r48-nihaisha-v4/DOC__天纪电子书及文字资料__八字基础.doc.txt',
     'name': '天纪电子书·八字基础', 'module': 'bazi', 'source': '倪师天纪电子书'},
]

MINGLI_ANCHOR = re.compile(r'五行|十神|日主|用神|格局|大运|流年|命|宫|星曜|紫微|卦|风水|堪舆|方位|太岁|生肖|干支|八字|斗数|气运|阴阳')
MEDICAL_RX = re.compile(r'处方|剂量|煎服|每日\d+次|诊断标准|治疗方案')

PROMPT_SYS = (
    '你是命理知识蒸馏器。把给定原文切块蒸馏为 1~3 条结构化命理知识条目。'
    '只输出 JSON 数组（至多 2 项），每项：{"title":"≤40字具体主题","summary":"≤120字要义",'
    '"keywords":"3~6个逗号分隔关键词","content":"≥300字白话+术语并存的完整知识"}。'
    '铁律：只取命理/风水/易学术数内容；医学诊疗内容（处方/剂量/诊断）一律丢弃；'
    '不编造原文没有的断语；条目必须能独立读懂。'
)

def chunks(text, size=5000):
    paras = re.split(r'\n\s*\n|(?=== Slide \d+ ===)', text)
    buf = ''
    for p in paras:
        # 硬切超长段（无空行的文本流）：就近标点断句
        while len(p) > size:
            cut = max(p.rfind(x, 0, size) for x in '。！？!?\n')
            if cut < size * 0.5:
                cut = size
            if buf:
                yield buf; buf = ''
            yield p[:cut + 1]
            p = p[cut + 1:]
        if len(buf) + len(p) > size and buf:
            yield buf; buf = p
        else:
            buf = (buf + '\n\n' + p) if buf else p
    if buf.strip():
        yield buf

def ai_distill(text):
    body = json.dumps({
        'model': MODEL,
        'messages': [{'role': 'system', 'content': PROMPT_SYS},
                     {'role': 'user', 'content': '原文切块：\n' + text[:5200]}],
        'temperature': 0.3, 'max_tokens': 8192,
    }).encode()
    req = urlreq.Request(API_BASE + '/v1/chat/completions', data=body,
                         headers={'Content-Type': 'application/json',
                                  'Authorization': 'Bearer ' + API_KEY})
    with urlreq.urlopen(req, timeout=150) as r:
        out = json.loads(r.read())
    content = out['choices'][0]['message']['content']
    m = re.search(r'\[.*\]', content, re.S)
    if not m:
        print('  [空结果·无JSON] 原始输出前100字:', repr(content[:100]), flush=True)
        return []
    if m and m.group(0) in ('[]', '[ ]'):
        print('  [空结果·空数组] 原始输出前100字:', repr(content[:100]), flush=True)
    raw = m.group(0)
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        # 截断修复：保留到最后一个完整对象再闭合数组
        cut = raw.rfind('}')
        if cut > 0:
            try:
                return json.loads(raw[:cut+1].rstrip().rstrip(',') + ']')
            except json.JSONDecodeError:
                print('  [空结果·修复失败] 前100字:', repr(raw[:100]), flush=True)
                return []
        return []

def main():
    max_chunks = int(sys.argv[sys.argv.index('--max-chunks') + 1]) if '--max-chunks' in sys.argv else 20
    state_path = ROOT / 'DELIVERY' / 'g26-r2-state.json'
    done_chunks = set(json.load(open(state_path))) if state_path.exists() else set()
    conn = sqlite3.connect(str(DB), timeout=10)
    conn.row_factory = sqlite3.Row
    existing = {r[0] for r in conn.execute(
        "SELECT fingerprint FROM kb_formal WHERE fingerprint LIKE 'G26|%'")}
    stat = {'chunks_done': 0, 'entries_in': 0, 'entries_dup': 0, 'entries_reject': 0, 'errors': 0}

    # ── 收集待处理块（块级幂等跳过已处理）──
    pending = []
    for doc in DOCS:
        if len(pending) >= max_chunks: break
        text = doc['path'].read_text(encoding='utf-8', errors='ignore')
        for ci, ck in enumerate(chunks(text), 1):
            if len(pending) >= max_chunks: break
            if len(ck.strip()) < 200:
                continue
            ck_id = hashlib.md5((doc['name'] + str(ci)).encode()).hexdigest()[:12]
            if ck_id not in done_chunks:
                pending.append((doc, ci, ck_id, ck))

    # ── 3 线程并发蒸馏；完成一块立即写库+落状态（被掐只损在途块）──
    from concurrent.futures import ThreadPoolExecutor, as_completed
    ckmap = {ck_id: (doc, ci) for doc, ci, ck_id, ck in pending}
    done_n = 0
    with ThreadPoolExecutor(max_workers=3) as ex:
        futs = {ex.submit(ai_distill, ck): ck_id for doc, ci, ck_id, ck in pending}
        for fut in as_completed(futs):
            ck_id = futs[fut]
            doc, ci = ckmap[ck_id]
            try:
                entries = fut.result()
            except Exception as e:
                stat['errors'] += 1
                print(f'  [AI-ERR] {doc["name"]}#{ci}: {repr(e)[:120]}', flush=True)
                continue
            stat['chunks_done'] += 1
            done_n += 1
            for ei, e in enumerate(entries):
                title = (e.get('title') or '').strip()
                content = (e.get('content') or '').strip()
                if not title or len(content) < 300:
                    stat['entries_reject'] += 1; continue
                if not MINGLI_ANCHOR.search(title + content):
                    stat['entries_reject'] += 1; continue
                if MEDICAL_RX.search(content):
                    stat['entries_reject'] += 1; continue
                fp = 'G26|' + hashlib.md5(content.encode()).hexdigest()
                if fp in existing:
                    stat['entries_dup'] += 1; continue
                eid = 'KB-G26-' + fp[4:20]
                conn.execute("""
                    INSERT INTO kb_formal (entry_id, module, title, content, summary, keywords,
                        src_id, trust_score, confidence, status, access_level, fingerprint,
                        promoted_at, created_at, updated_at, hit_count, category, audit_status)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,0,'g26-distill','approved')
                """, (eid, doc['module'], title, content, (e.get('summary') or '')[:300],
                      e.get('keywords') or '', 'SRC-G26-20260907', 0.8, 0.8, 'formal',
                      'public', fp, NOW, NOW, NOW))
                existing.add(fp)
                stat['entries_in'] += 1
            done_chunks.add(ck_id)
            state_path.parent.mkdir(parents=True, exist_ok=True)
            json.dump(sorted(done_chunks), open(state_path, 'w'))
            conn.commit()
            print(f'  [{done_n}/{len(pending)}] {doc["name"]}#段{ci} → +{len(entries)} 条', flush=True)
    conn.commit()
    safe_close(conn)
    print(json.dumps(stat, ensure_ascii=False))

if __name__ == '__main__':
    main()
