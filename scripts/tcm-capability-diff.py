#!/usr/bin/env python3
"""
tcm-capability-diff.py — 二阶段增量吸收·能力差集巡检（tcm-agent → mingli-baojian/medical-stack）

定位（docs/TCM-ABSORPTION-SPEC.md）：
  一阶段能力对齐已完成（2026-08-31，18 路由+R853 修真+医师档案种子）；
  本脚本服务二阶段：tcm 后续增量成果按规划吸收——每次跟随链触发时比对四层差集：
    L1 API 路由（方法+路径 双维 diff）
    L2 关键模块导出函数（auth.js / sms_adapter.js）
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
    return set(EXPORT_RE.findall(sec))


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
    for mod in ['auth.js', 'sms_adapter.js']:
        t_exp = exports(TCM / 'server' / mod)
        m_exp = exports(MS / 'server' / mod)
        miss = sorted(t_exp - m_exp)
        if miss:
            mod_diffs[mod] = miss

    seed_missing = []
    for seed in ['doctor-profiles.json']:
        if (TCM / 'data' / seed).exists() and not (MS / 'data' / seed).exists():
            seed_missing.append(seed)

    tcm_p, ms_p = pages(TCM), pages(ROOT)
    page_gap = len(tcm_p - ms_p)

    payload = {
        'missing_api': missing_api, 'module_diffs': mod_diffs,
        'seed_missing': seed_missing, 'page_gap_count': page_gap,
    }
    digest = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()[:16]

    prev = {}
    try:
        prev = json.loads(STATE.read_text(encoding='utf-8'))
    except Exception:
        pass

    changed = prev.get('digest') != digest
    clean = not missing_api and not mod_diffs and not seed_missing

    summary = {
        'ts': now, 'digest': digest, 'changed': changed, 'clean': clean,
        'missing_api_count': len(missing_api),
        'module_diffs': mod_diffs, 'seed_missing': seed_missing,
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
            f"## L3 种子数据差集：{len(seed_missing)} 项",
        ]
        lines += [f"- `{s}`" for s in seed_missing] or ["- （空）"]
        lines += [
            f"",
            f"## L4 页面层参考：tcm 比 mingli 多 {page_gap} 个页面（按三分法人工定性：真缺口/已有等价/架构定位）",
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
