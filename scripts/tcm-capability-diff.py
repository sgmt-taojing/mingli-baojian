#!/usr/bin/env python3
"""
tcm-capability-diff.py — 二阶段增量吸收·能力差集巡检（tcm-agent → mingli-baojian/medical-stack）

定位（docs/TCM-ABSORPTION-SPEC.md）：
  一阶段能力对齐已完成（2026-08-31，18 路由+R853 修真+医师档案种子）；
  本脚本服务二阶段：tcm 后续增量成果按规划吸收——每次跟随链触发时比对四层差集：
    L1 API 路由（方法+路径 双维 diff）
    L2 关键模块导出函数（auth.js / sms_adapter.js）
    L2.5 检索处理器特征哈希（search/formula-recall 函数体规范化 sha256；
         防 L2 级排序逻辑漂移盲区——G17R L2 教训：路由/导出级 diff 看不见处理器内部漂移）
    L3 种子数据文件（doctor-profiles.json 等）
    L4 页面层（信息量参考，按「真缺口/已有等价/架构定位」三分法人工定性）
  差集内容 hash 不变则不重写报告（防噪音）；有变化才落 DELIVERY/tcm-capability-diff-latest.md。

纪律：医学能力只移植适配，禁止二次训练；命理合流仅限 8974 批注环节（R745/R756/R757）。
"""
import hashlib
import json
import re
import subprocess
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PROJECTS = ROOT.parent
TCM = PROJECTS / 'tcm-agent'
MS = ROOT / 'medical-stack'
OUT_MD = ROOT / 'DELIVERY' / 'tcm-capability-diff-latest.md'
STATE = MS / 'capability-diff-state.json'
TZ = timezone(timedelta(hours=8))

# 已知等价（名字不同、能力等价，勿重复建设；新增等价须在此登记并注明 mingli 侧落点）
KNOWN_EQUIV = {
    'get /manifest.json': 'mingli 8900 静态直挂 app/manifest.json',
    'get /pwa-inject.js': 'mingli 等价物 /pwa/pwa-inject.js（8900 静态）',
    'get /sw.js': 'mingli 等价物 /service-worker.js（8900 静态直挂 app/service-worker.js）',
    # 2026-09-14 定性：visual-observation-proxy 动态路由注册的静态前缀（app.post('/api/tcm/'+route)），
    # 并非真实独立端点。ms 侧已自有等价观察端点（tongue/face/eye/hand/lip-analyze，家庭端 AI 初判
    # optionalAuth+启发式兑底）；tcm 严格代理（requireAuth+fail-closed）为院内形态，按 ADR-007
    # 架构定位豁免不移植——移植会遮蔽家庭端行为，属回归风险。
    'post /api/tcm/': 'visual-observation-proxy 动态路由前缀（非独立端点）；ms 已有等价观察端点，严格代理按 ADR-007 架构定位豁免',
}

ROUTE_RE = re.compile(r"(?:app|router)\.(get|post|put|delete|patch)\(['\"]([^'\"]+)")
EXPORT_RE = re.compile(r"^\s{2}(\w+)\(", re.M)


def routes(base: Path) -> set:
    out = set()
    for f in base.rglob('*.js'):
        if 'node_modules' in f.parts:
            continue
        try:
            text = f.read_text(encoding='utf-8', errors='ignore')
        except Exception:
            continue
        for m in ROUTE_RE.finditer(text):
            out.add(f"{m.group(1)} {m.group(2)}")
    return out


def exports(path: Path) -> set:
    try:
        text = path.read_text(encoding='utf-8', errors='ignore')
    except Exception:
        return set()
    sec = text.split('module.exports')[-1]
    out = set(EXPORT_RE.findall(sec))
    # 盲区修复（2026-09-03）：module.exports = { a, b: fn, c() {} } 三种形式都要抓——
    # 原 EXPORT_RE 只抓两空格缩进的方法简写，漏掉裸标识符列表（twin-engine snapshotFromHomeLab 漏报实证）
    if '{' in sec and '}' in sec:
        inner = sec[sec.find('{') + 1: sec.rfind('}')]
        for seg in inner.split(','):
            m = re.match(r"\s*([A-Za-z_$][\w$]*)\s*([:(]|$)", seg)
            if m:
                out.add(m.group(1))
    return out


# L2.5：检索处理器特征哈希（裁判 G17R 撤销令采纳项——把 search handler 特征哈希纳入差集巡检）
# 锚点 = 路由注册行；抽取整段 handler（花括号配平，忽略字符串/注释内的花括号），
# 规范化（去注释/去空白）后 sha256。双侧哈希不一致即「处理器漂移」。
PROCESSORS = ['/api/tcm/kb/search', '/api/tcm/kb/formula-recall']
PROC_RE = {p: re.compile(r"app\.get\('" + re.escape(p) + r"'\s*,\s*(?:async\s*)?\(") for p in PROCESSORS}
IDENT_RE = re.compile(r'[A-Za-z_$\u4e00-\u9fff0-9]+')


def _extract_handler(text: str, start: int) -> str:
    """从 handler 开括号位置起做花括号配平抽取（跳过字符串/模板串/注释）。"""
    n, i = len(text), start
    depth, state, quote = 0, 'code', ''
    out = []
    while i < n:
        ch = text[i]
        nxt = text[i + 1] if i + 1 < n else ''
        if state == 'code':
            if ch == '/' and nxt == '/':
                state = 'line'; i += 2; continue
            if ch == '/' and nxt == '*':
                state = 'block'; i += 2; continue
            if ch in ('"', "'", '`'):
                state = 'str'; quote = ch; i += 1; continue
            if ch == '{':
                depth += 1
            elif ch == '}':
                depth -= 1
                if depth == 0:
                    i += 1
                    break
            out.append(ch)
        elif state == 'line':
            if ch == '\n':
                state = 'code'
                out.append(ch)
        elif state == 'block':
            if ch == '*' and nxt == '/':
                state = 'code'; i += 2; continue
        else:  # str
            if ch == '\\':
                i += 2; continue
            if ch == quote:
                state = 'code'
        i += 1
    return ''.join(out)


def processor_hash(path: Path, route: str):  # 返回 str 或 None（3.9 兼容：链条以 /usr/bin/python3 运行，禁 str|None）
    try:
        text = path.read_text(encoding='utf-8', errors='ignore')
    except Exception:
        return None
    m = PROC_RE[route].search(text)
    if not m:
        return None
    body = _extract_handler(text, m.end() - 1)
    if not body:
        return None
    # 规范化：去注释（单行的 handler 内残留），只留标识符序列 + 运算符骨架
    tokens = IDENT_RE.findall(body)
    ops = re.sub(r'[A-Za-z_$\u4e00-\u9fff0-9\s]+', ' ', body)
    ops = re.sub(r'\s+', '', ops)
    norm = ' '.join(tokens) + '|' + ops
    return hashlib.sha256(norm.encode('utf-8')).hexdigest()[:16]


def pages(base: Path) -> set:
    app = base / 'app'
    if not app.is_dir():
        return set()
    return {f.name for f in app.glob('*.html')}


def git_head(repo: Path) -> str:
    try:
        return subprocess.run(['git', 'log', '--oneline', '-1'], cwd=repo,
                              capture_output=True, text=True, timeout=10).stdout.strip()
    except Exception:
        return 'unknown'


def main() -> int:
    now = datetime.now(TZ).strftime('%Y-%m-%d %H:%M')
    tcm_r, ms_r = routes(TCM / 'server'), routes(MS)
    equiv_hit = sorted((tcm_r - ms_r) & set(KNOWN_EQUIV))
    missing_api = sorted((tcm_r - ms_r) - set(KNOWN_EQUIV))
    extra_api = sorted(ms_r - tcm_r)

    mod_diffs = {}
    for mod in ['auth.js', 'sms_adapter.js', 'twin-engine.js']:
        t_exp = exports(TCM / 'server' / mod)
        m_exp = exports(MS / 'server' / mod)
        miss = sorted(t_exp - m_exp)
        if miss:
            mod_diffs[mod] = miss

    seed_missing = []
    for seed in ['doctor-profiles.json', 'teaching-cases.json']:
        if (TCM / 'data' / seed).exists() and not (MS / 'data' / seed).exists():
            seed_missing.append(seed)

    tcm_p, ms_p = pages(TCM), pages(ROOT)
    page_gap = len(tcm_p - ms_p)

    # L4.5 共享 js 哈希比对（盲区封堵：页面同名不代表同源——common.js 缺 authFetch
    # 曾致召回面板静默失效，代理隔离修复后才暴露）。登记 KNOWN_JS_ADAPT 豁免有意适配。
    # 2026-09-03：登记册外置 medical-stack/patches/js-adapt-registry.json（单一真源，
    # capability-diff 与 check-tcm-page-drift 共读）；扫描范围扩到 vendor/ 子目录；
    # ms 自有 js（tcm 无此文件）须登记 ms_own，否则列 UNREGISTERED 提示登记。
    _reg_path = MS / 'patches' / 'js-adapt-registry.json'
    try:
        _reg = json.loads(_reg_path.read_text(encoding='utf-8'))
        KNOWN_JS_ADAPT = dict(_reg.get('known_adapt', {}))
        MS_OWN_JS = dict(_reg.get('ms_own', {}))
    except Exception:
        KNOWN_JS_ADAPT = {
            'nav.js': 'ms 导航为 curated 子集 + 命理宝鉴品牌适配（fhub/consult/insur 已对齐 tcm 增量）',
            'config-engine.js': '仅系统品牌名适配（SEC-001）；逻辑同源',
            'i18n.js': '仅 app.name 品牌串适配（SEC-001）；逻辑同源',
            'seed-loader.js': 'R864 V2.0 已对齐（生产不自动注入假数据）；头部品牌标注差异',
        }
        MS_OWN_JS = {}
    js_rows = []
    js_drift = []
    tcm_js_dir, ms_js_dir = TCM / 'app' / 'js', MS / 'app' / 'js'
    tcm_js_files = {str(f.relative_to(tcm_js_dir)) for f in tcm_js_dir.rglob('*.js')}
    ms_js_files = {str(f.relative_to(ms_js_dir)) for f in ms_js_dir.rglob('*.js')}
    for rel in sorted(tcm_js_files):
        f = tcm_js_dir / rel
        m = ms_js_dir / rel
        if not m.exists():
            js_rows.append((rel, 'MISSING'))
            js_drift.append({'file': rel, 'status': 'MISSING'})
            continue
        th = hashlib.sha256(f.read_bytes()).hexdigest()[:12]
        mh = hashlib.sha256(m.read_bytes()).hexdigest()[:12]
        if th != mh:
            st = 'ADAPT' if rel in KNOWN_JS_ADAPT else 'DRIFT'
            js_rows.append((rel, st))
            if st == 'DRIFT':
                js_drift.append({'file': rel, 'status': 'DRIFT'})
    # ms 自有 js：登记 ms_own → ⚪ 自有；未登记 → ⚠ UNREGISTERED（不破 clean，提示登记防误判）
    for rel in sorted(ms_js_files - tcm_js_files):
        if rel in MS_OWN_JS:
            js_rows.append((rel, 'OWN'))
        else:
            js_rows.append((rel, 'UNREGISTERED'))

    # L2.5 处理器特征哈希比对
    proc_rows = []
    proc_drift = []
    for p in PROCESSORS:
        th = processor_hash(TCM / 'server' / 'api-server.js', p)
        mh = processor_hash(MS / 'server' / 'api-server.js', p)
        if th is None or mh is None:
            proc_rows.append((p, th or 'MISSING', mh or 'MISSING', 'MISSING'))
            proc_drift.append({'route': p, 'tcm': th, 'ms': mh, 'status': 'MISSING'})
        elif th != mh:
            proc_rows.append((p, th, mh, 'DRIFT'))
            proc_drift.append({'route': p, 'tcm': th, 'ms': mh, 'status': 'DRIFT'})
        else:
            proc_rows.append((p, th, mh, 'OK'))

    # L2.6 KB 数据资产哈希比对（2026-09-07 新增：症状通道索引/别名词典/驳回降级名单
    # 等数据资产漂移曾致检索双侧系统性分叉——处理器哈希相同但结果不同，「痈 疽」案在案）
    try:  # 单一真源 medical-stack/patches/kb-assets.json（sync-kb-assets.py 同读）
        _kb_reg = json.loads((MS / 'patches' / 'kb-assets.json').read_text(encoding='utf-8'))
        KB_ASSETS = [a['file'] for a in _kb_reg.get('assets', [])]
    except Exception:
        KB_ASSETS = ['formula-symptom-index.json', 'symptom-aliases.json', 'recall-demotions.json',
                     't2s-map.js', 'symptom-index.js', 'tcm-classics.json', 'syndrome-supplement.json']
    asset_rows = []
    asset_drift = []
    for a in KB_ASSETS:
        tf, mf = TCM / 'server' / 'kb' / a, MS / 'server' / 'kb' / a
        if not tf.exists():
            continue
        if not mf.exists():
            asset_rows.append((a, '-', '-', 'MISSING'))
            asset_drift.append({'file': a, 'status': 'MISSING'})
            continue
        th = hashlib.sha256(tf.read_bytes()).hexdigest()[:12]
        mh = hashlib.sha256(mf.read_bytes()).hexdigest()[:12]
        if th != mh:
            asset_rows.append((a, th, mh, 'DRIFT'))
            asset_drift.append({'file': a, 'status': 'DRIFT'})
        else:
            asset_rows.append((a, th, mh, 'OK'))

    payload = {
        'missing_api': missing_api, 'module_diffs': mod_diffs,
        'seed_missing': seed_missing, 'page_gap_count': page_gap,
        'processor_hashes': [[r, th, mh, st] for r, th, mh, st in proc_rows],
        'js_drift': js_drift,
        'asset_hashes': [[a, th, mh, st] for a, th, mh, st in asset_rows],
    }
    digest = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()[:16]

    prev = {}
    try:
        prev = json.loads(STATE.read_text(encoding='utf-8'))
    except Exception:
        pass

    changed = prev.get('digest') != digest
    clean = not missing_api and not mod_diffs and not seed_missing and not proc_drift and not js_drift and not asset_drift

    summary = {
        'ts': now, 'digest': digest, 'changed': changed, 'clean': clean,
        'missing_api_count': len(missing_api),
        'missing_api': missing_api,  # R-DIFF-SLA：72h SLA 追踪需要条目级键
        'module_diffs': mod_diffs, 'seed_missing': seed_missing,
        'processor_drift': proc_drift, 'js_drift': js_drift,
        'asset_drift': asset_drift,
        'page_gap_count': page_gap,
        'extra_api_count': len(extra_api),
        'tcm_head': git_head(TCM),
    }
    STATE.write_text(json.dumps({'digest': digest, 'last': summary}, ensure_ascii=False, indent=2), encoding='utf-8')

    if changed or not OUT_MD.exists():
        lines = [
            f"# tcm → mingli 能力差集巡检（二阶段增量吸收）",
            f"",
            f"- 生成：{now} ｜ 差集指纹 `{digest}`",
            f"- tcm 侧 HEAD：`{summary['tcm_head']}`",
            f"- 结论：**{'✅ 全对齐（无待吸收增量）' if clean else '⚠ 有待吸收增量'}**",
            f"",
            f"## L1 API 路由差集（tcm 有 · medical-stack 无）：{len(missing_api)} 条",
        ]
        lines += [f"- `{r}`" for r in missing_api] or ["- （空）"]
        lines += [
            f"",
            f"## 已知等价登记（勿重复建设）：{len(equiv_hit)} 条",
        ]
        lines += [f"- `{r}` → {KNOWN_EQUIV[r]}" for r in equiv_hit] or ["- （空）"]
        lines += [
            f"",
            f"## L2 关键模块导出函数差集",
        ]
        if mod_diffs:
            lines += [f"- `{k}` 缺：{', '.join(v)}" for k, v in mod_diffs.items()]
        else:
            lines += ["- （空）"]
        lines += [
            f"",
            f"## L2.5 检索处理器特征哈希（排序逻辑漂移监控，G17R 采纳项）",
            f"",
            f"| 处理器 | tcm 哈希 | ms 哈希 | 状态 |",
            f"|---|---|---|---|",
        ]
        lines += [f"| `{r}` | `{th}` | `{mh}` | {'✅ 一致' if st == 'OK' else ('🔴 漂移 DRIFT' if st == 'DRIFT' else '🔴 缺失 MISSING')} |"
                  for r, th, mh, st in proc_rows]
        lines += [
            f"",
            f"漂移处置：哈希不一致即排序/打分逻辑单侧变更——按 ADR-016 流程移植对齐或登记豁免，禁止静默放过。",
            f"",
            f"## L2.6 KB 数据资产哈希（症状通道/词典/降级名单漂移监控，2026-09-07 新增）",
            f"",
            f"| 资产 | tcm 哈希 | ms 哈希 | 状态 |",
            f"|---|---|---|---|",
        ]
        lines += [f"| `{a}` | `{th}` | `{mh}` | {'✅ 一致' if st == 'OK' else ('🔴 漂移 DRIFT' if st == 'DRIFT' else '🔴 缺失 MISSING')} |"
                  for a, th, mh, st in asset_rows]
        lines += [
            f"",
            f"漂移处置：数据资产不一致即检索行为分叉（处理器同哈希也可能结果不同），直接同步文件对齐。",
        ]
        lines += [
            f"",
            f"## L3 种子数据差集：{len(seed_missing)} 项",
        ]
        lines += [f"- `{s}`" for s in seed_missing] or ["- （空）"]
        lines += [
            f"",
            f"## L4 页面层参考：tcm 比 mingli 多 {page_gap} 个页面（按三分法人工定性：真缺口/已有等价/架构定位）",
            f"",
            f"## L4.5 共享 js 哈希比对（页面同源监控）",
        ]
        if js_rows:
            def _js_line(n, st):
                if st == 'DRIFT':
                    return f"- `{n}`：🔴 漂移"
                if st == 'MISSING':
                    return f"- `{n}`：🔴 缺失"
                if st == 'OWN':
                    return f"- `{n}`：⚪ ms 自有（{MS_OWN_JS.get(n, '')}）"
                if st == 'UNREGISTERED':
                    return f"- `{n}`：⚠ 未登记 ms 侧文件（请登记 js-adapt-registry.json ms_own 或确认删除）"
                return f"- `{n}`：⚪ 有意适配（{KNOWN_JS_ADAPT.get(n, '')}）"
            lines += [_js_line(n, st) for n, st in js_rows]
        else:
            lines += ["- （空 · 全部同源）"]
        lines += [
            f"",
            f"## medical-stack 独有（命理增量层，勿回流 tcm）：{len(extra_api)} 条",
            f"（批注/预约自建/reflux/短信校验等，属 mingli 特有边界，详见 ADR-007）",
            f"",
            f"---",
            f"处置流程见 docs/TCM-ABSORPTION-SPEC.md：移植→适配→冒烟→KANBAN 留证。禁止二次训练；R745/R756/R757 守卫不可绕过。",
        ]
        OUT_MD.parent.mkdir(parents=True, exist_ok=True)
        OUT_MD.write_text('\n'.join(lines) + '\n', encoding='utf-8')

    print(json.dumps(summary, ensure_ascii=False))
    return 0


if __name__ == '__main__':
    sys.exit(main())
