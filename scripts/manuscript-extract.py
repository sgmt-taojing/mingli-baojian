#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
manuscript-extract.py — MB-K1 老板稿件全量提取管线（2026-09-26）
按《知识原始材料/使用说明.md》协议：增量提取任务.json → 逐份提取 → 五红线质量门
→ kb_staging(pending) → 审核晋升 kb_formal；蒸馏产物落 knowledge/collected/manuscript-<sid8>.jsonl；
验收后写《管理/提取回执.json》（六字段）+《knowledge/collected/稿件提取台账》。

管线复用 G26 范式：文本提取(pypdf/textutil/pptx-xml) → 切块(≈5K字)
→ AI 蒸馏(G2CLAW glm-5.2) → 质量门(content≥300/命理锚点/医学诊疗剔除/指纹幂等 MS|<md5>)
→ kb_staging + 产物 jsonl + 回执 + 台账。

用法：
  python3 manuscript-extract.py --list                      # 列出 67 份队列与状态
  python3 manuscript-extract.py --names 人间道听课笔记 地脉道  # 按名片段提取（空格分隔）
  python3 manuscript-extract.py --group 1                    # 按优先级组 1..6
  选项：--max-chunks N（每份最多蒸馏块数，控成本） --dry（只提取文本不落库）
环境：G2CLAW_API_KEY 可选（缺省用项目已存 key）；AI_API_BASE/AI_MODEL 可覆盖。
"""
import json, os, re, sys, sqlite3, hashlib, time, subprocess, zipfile, argparse
from pathlib import Path
from datetime import datetime
from urllib import request as urlreq

ROOT = Path(__file__).resolve().parent.parent
MATLIB = Path('/Volumes/模型训练数据/知识原始材料')
QUEUE = MATLIB / '命理宝鉴' / '增量提取任务.json'
RECEIPTS = MATLIB / '管理' / '提取回执.json'
LEDGER = ROOT / 'knowledge' / 'collected' / '稿件提取台账.md'
OUTDIR = ROOT / 'knowledge' / 'collected'
DB = ROOT / 'server' / 'database' / 'yidao.db'

# R-T2（2026-10-15）：私有化路线——云端 g2 后端默认关闭，硬编码退役 key 已移除。
# 恢复云端需 AI_CLOUD_ENABLE=1 且 G2CLAW_API_KEY 有效；缺省走 rules 规则抽取（零外部依赖）。
_CLOUD = os.environ.get('AI_CLOUD_ENABLE') == '1'
API_BASE = (os.environ.get('AI_API_BASE', '') or '') if _CLOUD else ''
API_KEY = (os.environ.get('G2CLAW_API_KEY', '') or '') if _CLOUD else ''
MODEL = os.environ.get('AI_MODEL', 'glm-5.2')
PIPELINE_VERSION = 'v1'

# 优先级组（任务书 P0 顺序）：按名片段归类
GROUPS = {
    1: ['人间道听课笔记', '地脉道听课笔记', '天机道听课笔记', '天纪系列之人间道', '天纪系列之地脉道', '天纪系列之天机道', '天纪人间道', '天纪 地脉道', '天纪天机道', '2010年简化五行命运诊断'],
    2: ['图解道教天文历算学：紫微斗数', '紫微斗数案例资料', '紫微斗数基础教程'],
    3: ['术数全书', '御定六壬', '秘藏大六壬', '玉匣记', '看命一掌经', '相术'],
    4: ['流年班', '财帛宫星耀含义'],
    5: ['葬书', '撼龙经'],
    6: ['岐轩遁甲'],
}
MP4_PAT = re.compile(r'天纪\d+\.mp4$', re.I)

# 模块/域映射（按名片段；默认 mingli）
MODULE_MAP = [
    ('紫微', 'ziwei', 'mingli'), ('斗数', 'ziwei', 'mingli'), ('财帛宫', 'ziwei', 'mingli'), ('流年班', 'ziwei', 'mingli'),
    ('六壬', 'liuren', 'mingli'), ('玉匣记', 'huangli', 'mingli'), ('一掌经', 'bazi', 'mingli'),
    ('相术', 'xiangshu', 'mingli'), ('术数全书', 'shushu', 'mingli'),
    ('葬书', 'fengshui', 'mingli'), ('撼龙经', 'fengshui', 'mingli'),
    ('地脉道', 'fengshui', 'mingli'), ('岐轩遁甲', 'qimen-med', ''),  # 医学域→空域
    ('人间道', 'tianji', 'mingli'), ('天机道', 'tianji', 'mingli'), ('天纪', 'tianji', 'mingli'),
    ('五行命运诊断', 'bazi', 'mingli'),
]

MINGLI_ANCHOR = re.compile(r'五行|十神|日主|用神|格局|大运|流年|命|宫|星曜|紫微|卦|风水|堪舆|方位|太岁|生肖|干支|八字|斗数|气运|阴阳|六壬|奇门|遁甲|黄历|择日|相|龙脉|砂|穴|罗经|天纪|易经|周易')
MEDICAL_RX = re.compile(r'处方|剂量|煎服|每日\d+次|诊断标准|治疗方案|mg|克，|毫升')

PROMPT_SYS = (
    '你是命理知识蒸馏器。把给定原文切块蒸馏为 1~3 条结构化命理知识条目。'
    '只输出 JSON 数组（至多 2 项），每项：{"title":"≤40字具体主题","summary":"≤120字要义",'
    '"keywords":"3~6个逗号分隔关键词","content":"≥300字白话+术语并存的完整知识"}。'
    '铁律：只取命理/风水/易学术数内容；医学诊疗内容（处方/剂量/诊断）一律丢弃；'
    '不编造原文没有的断语；条目必须能独立读懂。'
)

# MLX 7B 专用：单对象范式 + few-shot（2026-09-26 实证：多字段 schema 会拆对象/乱格式）
PROMPT_SYS_MLX = (
    '你是命理知识蒸馏器。把原文蒸馏为1条命理知识条目。\n'
    '输出格式（严格照此JSON，不要输出任何其他文字）：\n'
    '{"title":"五行命运诊断法","content":"五行命运诊断法是以出生年干支为主的简化诊断体系。甲乙属木主肝胆，丙丁属火主心小肠，戊己属土主脾胃，庚辛属金主肺大肠，壬癸属水主肾膀胱。天干相克者相应脏腑易有宿疾。此法出自倪海厦临床经验总结，用于判断先天体质与命运走势……（此处写满300字以上的完整知识，白话与术语并存，忠实原文，不编造）"}\n'
    '要求：title不超过40字；content必须300字以上；只取命理/风水/术数内容；医学诊疗内容丢弃。'
)


def parse_entries_loose(txt):
    """宽容解析：修 7B 常见 JSON 病灶（拆对象/尾逗号/中文引号/截断）"""
    candidates = []
    m = re.search(r'\[.*\]', txt, re.S)
    if m:
        candidates.append(m.group(0))
    candidates.append(txt)
    fixed = []
    for c in candidates:
        c2 = re.sub(r',\s*([\]}])', r'\1', c)  # 尾逗号
        fixed.append(c2)
    for c in fixed:
        try:
            arr = json.loads(c)
            if isinstance(arr, dict):
                arr = [arr]
            if not isinstance(arr, list):
                continue
            # 合并被拆散的 {title..}{content..} 相邻对象
            merged = []
            for o in arr:
                if isinstance(o, dict) and set(o) <= {'content'} and merged and 'content' not in merged[-1]:
                    merged[-1]['content'] = o['content']
                else:
                    merged.append(o)
            out = [e for e in merged if isinstance(e, dict) and e.get('title') and e.get('content')]
            if out:
                return out
        except Exception:
            continue
    return []


def log(*a):
    print(f"[{datetime.now().strftime('%H:%M:%S')}]", *a, flush=True)


def extract_text(item, workdir):
    """按格式提取全文，返回 (text, note)。MP4 走配对字幕。"""
    fmt = item['format'].lower()
    src = item['archive_path']
    name = item['name']
    if fmt == '.mp4':
        sub = Path('/Volumes/模型训练数据/training-corpus/nishi-materials/subs') / (Path(name).stem + '.txt')
        if sub.exists():
            return sub.read_text(encoding='utf-8', errors='ignore'), f'配对字幕 {sub.name}'
        return None, '无配对字幕（转写缺口）'
    if fmt == '.txt':
        return Path(src).read_text(encoding='utf-8', errors='ignore'), '直读'
    if fmt == '.doc':
        out = workdir / (Path(name).stem + '.txt')
        r = subprocess.run(['textutil', '-convert', 'txt', '-output', str(out), src],
                           capture_output=True, text=True, timeout=300)
        if r.returncode != 0 or not out.exists():
            return None, f'textutil 失败: {r.stderr[:100]}'
        return out.read_text(encoding='utf-8', errors='ignore'), 'textutil'
    if fmt == '.pptx':
        with zipfile.ZipFile(src) as z:
            slides = sorted(n for n in z.namelist() if re.match(r'ppt/slides/slide\d+\.xml$', n))
            parts = []
            for sn in slides:
                xml = z.read(sn).decode('utf-8', errors='ignore')
                texts = re.findall(r'<a:t>([^<]*)</a:t>', xml)
                parts.append(f"=== {Path(sn).stem} ===\n" + '\n'.join(t for t in texts if t.strip()))
        return '\n\n'.join(parts), f'pptx-xml {len(slides)}页'
    if fmt == '.pdf':
        import pypdf  # 托管运行时提供
        reader = pypdf.PdfReader(src)
        n = len(reader.pages)
        parts = []
        for i, pg in enumerate(reader.pages):
            try:
                t = pg.extract_text() or ''
            except Exception:
                t = ''
            parts.append(t)
            if (i + 1) % 200 == 0:
                log(f'  …pdf {i+1}/{n} 页')
        text = '\n'.join(parts)
        if len(text.strip()) < 500:
            return text, f'⚠ 文本层过薄({len(text.strip())}字)，疑扫描件需OCR'
        return text, f'pypdf {n}页'
    return None, f'未支持格式 {fmt}'


def chunks(text, size=5000):
    paras = re.split(r'\n\s*\n|(?=== Slide \d+ ===)', text)
    buf = ''
    for p in paras:
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
    if buf:
        yield buf


def rules_distill(chunk_text, src_name, module):
    """规则抽取（无 LLM）：机械语义卡片，零幻觉，忠实原文（R-K1 纯净纪律）。
    输入块按 ≤1500 字段落边界切为多卡；标题取标题样行/首句。"""
    text = chunk_text.strip()
    if len(text) < 300:
        return []
    # 二级切分：段落边界 ≤1500 字
    segs, buf = [], ''
    for p in re.split(r'\n\s*\n', text):
        while len(p) > 1500:
            cut = max(p.rfind(x, 0, 1500) for x in '。！？!?\n')
            if cut < 700:
                cut = 1500
            if buf:
                segs.append(buf); buf = ''
            segs.append(p[:cut + 1]); p = p[cut + 1:]
        if len(buf) + len(p) > 1500 and buf:
            segs.append(buf); buf = p
        else:
            buf = (buf + '\n\n' + p) if buf else p
    if buf:
        segs.append(buf)
    stem = Path(src_name).stem[:20]
    KW = ('五行', '十神', '日主', '用神', '格局', '大运', '流年', '命宫', '星曜', '紫微',
          '卦', '风水', '堪舆', '太岁', '生肖', '干支', '八字', '斗数', '阴阳', '六壬',
          '奇门', '遁甲', '黄历', '择日', '龙脉', '罗经', '易经', '周易', '命理', '排盘')
    out = []
    for si, seg in enumerate(segs):
        seg = seg.strip()
        if len(seg) < 300:
            continue
        lines = [l.strip() for l in seg.split('\n') if l.strip()]
        title = ''
        for l in lines[:5]:
            if len(l) <= 40 and (re.search(r'第[一二三四五六七八九十百千\d]+[章节讲课卷]|^【.*】$', l) or len(l) <= 20):
                title = l.strip('、：:')
                break
        if not title:
            first = re.split(r'[。！？!?\n]', seg)[0]
            title = first[:30] + ('…' if len(first) > 30 else '')
        suffix = f'·{si+1}' if len(segs) > 1 else ''
        kws = sorted(set(k for k in KW if k in seg))[:6]
        out.append({'title': f'{stem}·{title}{suffix}'[:60], 'summary': seg[:120],
                    'keywords': '、'.join(kws), 'content': seg[:1800]})
    return out


def ai_distill(chunk_text, src_name, backend='auto', module=''):
    """backend: g2 | mlx | rules | auto（g2 有额度走 g2；失败/额度尽自动降级 rules 规则抽取；
    mlx 7B schema 保真度三连败已弃用为缺省，仅显式 --backend mlx 启用）"""
    if backend == 'rules':
        return rules_distill(chunk_text, src_name, module), 'rules'
    backends = (['g2', 'rules'] if API_KEY else ['rules']) if backend == 'auto' else [backend]
    # G2 熔断：本轮连续失败 3 次后全局停用（额度耗尽期省 2×10s/块）
    if backend == 'auto' and getattr(ai_distill, '_g2_dead', 0) >= 3:
        backends = ['rules']
    for be in backends:
        if be == 'rules':
            return rules_distill(chunk_text, src_name, module), 'rules'
        url = (API_BASE + '/v1/chat/completions') if be == 'g2' else 'http://127.0.0.1:8960/v1/chat/completions'
        model = MODEL if be == 'g2' else 'mingli-sft-v9.2-7b'
        headers = {'Content-Type': 'application/json'}
        if be == 'g2':
            headers['Authorization'] = f'Bearer {API_KEY}'
        payload = json.dumps({
            'model': model,
            'messages': [{'role': 'system', 'content': PROMPT_SYS if be == 'g2' else PROMPT_SYS_MLX},
                         {'role': 'user', 'content': f'原文（{src_name}）：\n{chunk_text}'}],
            'max_tokens': 2000, 'temperature': 0.2}).encode()
        quota_dead = False
        for att in range(2):
            try:
                req = urlreq.Request(url, data=payload, headers=headers)
                with urlreq.urlopen(req, timeout=280) as r:
                    d = json.loads(r.read().decode())
                if 'choices' not in d:
                    msg = str(d)[:120]
                    if '额度' in msg or '1003' in msg:
                        log(f'  ⚠ {be} 额度耗尽，降级') ; quota_dead = True
                        break
                    raise ValueError(msg)
                txt = d['choices'][0]['message']['content']
                out = parse_entries_loose(txt)
                if not out:
                    raise ValueError('json 不可解析')
                if be == 'g2':
                    ai_distill._g2_dead = 0  # 成功即复位
                return out, be
            except Exception as e:
                if att == 1:
                    log(f'  ⚠ {be} 蒸馏失败×2: {str(e)[:80]}')
                else:
                    time.sleep(3)
        if be == 'g2':
            ai_distill._g2_dead = getattr(ai_distill, '_g2_dead', 0) + 1
            if ai_distill._g2_dead == 3:
                log('  ⛔ g2 连续失败×3，本轮熔断，后续块直连 rules')
        if quota_dead:
            continue
    return [], None


def mod_of(name):
    for pat, mod, dom in MODULE_MAP:
        if pat in name:
            return mod, dom
    return 'mingli-misc', 'mingli'


def sha256_file(p):
    h = hashlib.sha256()
    with open(p, 'rb') as f:
        for b in iter(lambda: f.read(1 << 20), b''):
            h.update(b)
    return h.hexdigest()


def write_receipt(item, out_path):
    receipts = []
    if RECEIPTS.exists():
        try:
            receipts = json.loads(RECEIPTS.read_text(encoding='utf-8'))
        except Exception:
            receipts = []
    receipts = [r for r in receipts if r.get('source_id') != item['source_id']]
    receipts.append({
        'project': '命理宝鉴',
        'source_id': item['source_id'],
        'pipeline_version': PIPELINE_VERSION,
        'output_path': str(out_path),
        'output_sha256': sha256_file(out_path),
        'accepted': True,
    })
    RECEIPTS.write_text(json.dumps(receipts, ensure_ascii=False, indent=1), encoding='utf-8')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--list', action='store_true')
    ap.add_argument('--names', nargs='*', default=[])
    ap.add_argument('--group', type=int, default=0)
    ap.add_argument('--max-chunks', type=int, default=0)
    ap.add_argument('--dry', action='store_true')
    ap.add_argument('--backend', choices=['auto', 'g2', 'mlx'], default='auto')
    args = ap.parse_args()

    items = json.loads(QUEUE.read_text(encoding='utf-8'))
    done_ids = set()
    if RECEIPTS.exists():
        try:
            done_ids = {r['source_id'] for r in json.loads(RECEIPTS.read_text(encoding='utf-8')) if r.get('accepted')}
        except Exception:
            pass

    if args.list:
        for i, it in enumerate(items):
            g = next((k for k, v in GROUPS.items() if any(p in it['name'] for p in v)), ('MP4' if MP4_PAT.search(it['name']) else '?'))
            mark = '✅' if it['source_id'] in done_ids else '  '
            print(f"{mark} {i+1:2d} [G{g}] {it['format']:6s} {it['bytes']//1024:>8d}KB {it['name']}")
        return

    sel = []
    for it in items:
        if it['source_id'] in done_ids:
            continue
        if args.names and not any(n in it['name'] for n in args.names):
            continue
        if args.group:
            if args.group == 7:
                if not MP4_PAT.search(it['name']):
                    continue
            else:
                pats = GROUPS.get(args.group, [])
                if not any(p in it['name'] for p in pats):
                    continue
        sel.append(it)
    if not sel:
        log('无匹配待提材料'); return

    conn = None if args.dry else sqlite3.connect(str(DB))
    if conn:
        conn.execute('PRAGMA busy_timeout=30000')
        lib_fps = {r[0] for r in conn.execute("SELECT fingerprint FROM kb_formal WHERE fingerprint LIKE 'MS|%'")}
        lib_fps |= {r[0] for r in conn.execute("SELECT fingerprint FROM kb_staging WHERE fingerprint LIKE 'MS|%'") if r[0]}
    workdir = ROOT / '.openclaw' / 'tmp' / 'manuscript-extract'
    workdir.mkdir(parents=True, exist_ok=True)
    OUTDIR.mkdir(parents=True, exist_ok=True)
    if not LEDGER.exists():
        LEDGER.write_text('# 稿件提取台账（MB-K1）\n\n| 时间 | 材料 | 提取方式 | 页/块 | 蒸馏条数 | 过门入库 | 拦截 | 产物 | 回执 |\n|---|---|---|---|---|---|---|---|---|\n', encoding='utf-8')

    for it in sel:
        name = it['name']
        sid8 = it['sha256'][:8]
        module, domain = mod_of(name)
        log(f'━━ 提取 {name}（{it["bytes"]//1024}KB → {module}/{domain or "空域"}）')
        text, note = extract_text(it, workdir)
        if text is None:
            log(f'  ✗ {note}')
            with LEDGER.open('a', encoding='utf-8') as f:
                f.write(f"| {datetime.now():%m-%d %H:%M} | {name} | {note} | - | - | - | 提取失败 | - | ✗ |\n")
            continue
        n_chars = len(text)
        log(f'  文本 {n_chars} 字（{note}）')
        if args.dry:
            continue
        entries, blocked, api_fail = [], 0, 0
        chs = list(chunks(text))
        if args.max_chunks:
            chs = chs[:args.max_chunks]
        used_backend = None
        for ci, ch in enumerate(chs):
            got, be = ai_distill(ch, name, args.backend, module)
            if be:
                used_backend = be
            elif not got:
                api_fail += 1
            for e in got:
                content = (e.get('content') or '').strip()
                title = (e.get('title') or '').strip()[:60]
                if len(content) < 300 or not title:
                    blocked += 1; continue
                if not MINGLI_ANCHOR.search(title + content):
                    blocked += 1; continue
                if MEDICAL_RX.search(content):
                    blocked += 1; continue
                fp = 'MS|' + hashlib.md5((module + content).encode()).hexdigest()
                if fp in lib_fps:
                    blocked += 1; continue
                lib_fps.add(fp)
                entries.append({'title': title, 'summary': (e.get('summary') or '')[:200],
                                'keywords': e.get('keywords') or '', 'content': content, 'fingerprint': fp})
            if (ci + 1) % 10 == 0:
                log(f'  …块 {ci+1}/{len(chs)} 累计 {len(entries)} 条')
        out_path = OUTDIR / f'manuscript-{sid8}.jsonl'
        with out_path.open('w', encoding='utf-8') as f:
            for e in entries:
                f.write(json.dumps({'ts': datetime.now().isoformat(), 'source': name, 'module': module,
                                    'domain': domain, **e}, ensure_ascii=False) + '\n')
        # 入 kb_staging（pending，待审核晋升）
        for e in entries:
            eid = 'KB-MS-' + hashlib.md5((module + e['content']).encode()).hexdigest()[:12]
            kw = e['keywords'] if isinstance(e['keywords'], list) else [k.strip() for k in str(e['keywords']).split(',') if k.strip()]
            conn.execute(
                "INSERT OR IGNORE INTO kb_staging (entry_id, module, title, content, summary, keywords, tags, status, src_id, raw_metadata, fingerprint, created_at, updated_at) "
                "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
                (eid, module, e['title'], e['content'], e['summary'], json.dumps(kw, ensure_ascii=False),
                 json.dumps([domain] if domain else [], ensure_ascii=False), 'pending', 'SRC-BOSS-MANUSCRIPT',
                 json.dumps({'source_doc': name, 'source_id': it['source_id'], 'domain': domain}, ensure_ascii=False),
                 e['fingerprint'], datetime.now().strftime('%Y-%m-%d %H:%M:%S'), datetime.now().strftime('%Y-%m-%d %H:%M:%S')))
        conn.commit()
        # 回执纪律两条：
        # ①蒸馏全灭（API 失败且零条目）不写回执，留队重提；
        # ②零条目零拦截（扫描件无文本层/文本过薄）不写回执，登记 OCR 缺口（v2 管线处理）
        if not entries and api_fail >= len(chs) and len(chs) > 0:
            log(f'  ✗ 蒸馏全线失败（{api_fail}/{len(chs)} 块 API 失败），不写回执，留队重提')
            with LEDGER.open('a', encoding='utf-8') as f:
                f.write(f"| {datetime.now():%m-%d %H:%M} | {name} | {note} | {n_chars}字/{len(chs)}块 | 0 | 0 | API失败{api_fail} | - | ✗ 留队 |\n")
            continue
        if not entries and blocked == 0:
            log(f'  ⚠ 零条目（{note}）→ 登记 OCR 缺口，不写回执')
            gap = ROOT / 'knowledge' / 'collected' / 'ocr-gap-list.md'
            need = f"| {datetime.now():%m-%d %H:%M} | {name} | {it['archive_path']} | {n_chars}字 | {note} |\n"
            with gap.open('a', encoding='utf-8') as f:
                if not gap.exists() or os.path.getsize(str(gap)) == 0:
                    f.write('# OCR 缺口清单（MB-K1：扫描件无文本层，待 v2 OCR 管线）\n\n| 时间 | 材料 | 路径 | 文本层 | 备注 |\n|---|---|---|---|---|\n')
                f.write(need)
            with LEDGER.open('a', encoding='utf-8') as f:
                f.write(f"| {datetime.now():%m-%d %H:%M} | {name} | {note} | {n_chars}字/0块 | 0 | 0 | 需OCR | - | ⚠ 缺口 |\n")
            continue
        write_receipt(it, out_path)
        log(f'  ✅ 蒸馏 {len(entries)} 条入 staging（拦 {blocked}，backend={used_backend}）→ {out_path.name}，回执已写')
        with LEDGER.open('a', encoding='utf-8') as f:
            f.write(f"| {datetime.now():%m-%d %H:%M} | {name} | {note} | {n_chars}字/{len(chs)}块 | {len(entries)+blocked} | {len(entries)} | {blocked} | {out_path.name} | ✅({used_backend}) |\n")
    if conn:
        conn.close()
    log('全部完成')


if __name__ == '__main__':
    main()
