#!/usr/bin/env python3
"""
R117 跨项目内容混入扫描器
========================
规则：
  - 在 mingli-baojian 项目内严禁出现 smart-home-family 的页面级 href / JS / 模板片段
  - 排除合理场景：注释、文档、知识库元数据、监控面板进程信息、共享 KB 文件名
  - 命中即上报，输出 JSON 报告

用法：
  python3 scripts/cross-project-scan.py
退出码：0=清洁 1=命中阈值内 2=严重
"""
import json, re, sys, os
from pathlib import Path
from collections import defaultdict

ROOT = Path(__file__).resolve().parent.parent  # mingli-baojian/
# 智能体专属命名空间（项目自己同名的 dashboard/activate 等不算）
SMART_HOME_OWNED_PAGES = {
    # 仅限"smart-home-family 独有 / 命理宝鉴没有的页面名"
    'family-hub.html',
    'family-dec.html', 'family-dashboard.html',
    'elderly/index.html', 'elderly.html',
    'kid/index.html', 'kid.html', 'kid-mode.html',
    'sleep.html', 'commute.html', 'dinner.html',
    'carousel.html', 'iot.html', 'pet.html',
    'kb-north-star.html',
    'realtime-assistant.html', 'training-dashboard.html',
    'preferences.html', 'security.html',
    'voice-reader.html',  # 朗读入口
}
SMART_HOME_OWNED_JS = {
    'voice-reader.js', 'voice-input.js', 'hci-track.js',
    'realtime/realtime-kb.js', 'realtime-kb.js',
}
SMART_HOME_OWNED_API = {
    'shf_age_mode', 'shf_theme', 'shf_api_base',
}
EXCLUDE_PATHS = (
    'monitor-data.json',  # 进程元数据（合理）
    'monitor-portal.html',
    'knowledge/',
    'training-data/',
    'data/',
    'logs/',
    '.git/',
    'node_modules/',
    'docs/',
)
EXCLUDE_LINE_PATTERNS = (
    r'^\s*(//|<!--)',
    r'smart-home-family.+共享',
    r'供 mingli-baojian',
    r'monitor-data',
    r'共享组件',
    r'\bsmart-home-family\b',  # 文字提及不算
)
# 命理宝鉴自己已存在的同名页/共享组件（白名单）
MINGLI_OWNED_PAGES = {
    'dashboard.html', 'activate.html', 'bazi.html', 'profile.html',
    'prediction.html', 'notify.html', 'privacy.html', 'doctor.html',
    'home-care.html', 'wellness-weekly.html', 'master-annotations',
    'realtime-assistant.html',  # mingli 自己的实时语音KB页
}
# 共享组件名（两项目各有一份，不算混入）
SHARED_COMPONENTS = {
    'voice-reader.js',  # mingli 版=轻量stub / shf版=完整版，各自独立
    'voice-input.js',
    'realtime-kb.js',   # 两项目各自独立实现
    'realtime/realtime-kb.js',
    'js/realtime/realtime-kb.js',
}

def is_excluded(path: Path) -> bool:
    s = str(path)
    for ex in EXCLUDE_PATHS:
        if ex in s:
            return True
    return False

def is_excluded_line(line: str) -> bool:
    for p in EXCLUDE_LINE_PATTERNS:
        if re.search(p, line):
            return True
    return False

def scan_file(path: Path):
    hits = []
    try:
        text = path.read_text(encoding='utf-8', errors='ignore')
    except Exception:
        return hits
    for i, line in enumerate(text.splitlines(), 1):
        if is_excluded_line(line):
            continue
        # 1. smart-home-family 独有页面（href 链接）
        for m in re.finditer(r'href=["\x27]([^"\x27]+)', line):
            href = m.group(1)
            # 去 query/fragment
            target = re.split(r'[?#]', href)[0].strip()
            # 取最后一段文件路径
            target_file = target.split('/')[-1] if '/' in target else target
            # 白名单跳过
            if target_file in MINGLI_OWNED_PAGES:
                continue
            if target_file in SMART_HOME_OWNED_PAGES or target in SMART_HOME_OWNED_PAGES:
                hits.append({
                    'file': str(path.relative_to(ROOT)),
                    'line': i,
                    'pattern': 'SMART_HOME_PAGE_HREF',
                    'snippet': f'href={href[:100]}',
                })
        # 2. 独有 JS 引用
        for m in re.finditer(r'src=["\x27]([^"\x27]+\.js)', line):
            js_path = m.group(1)
            js_file = js_path.split('/')[-1]
            if js_file in SMART_HOME_OWNED_JS or js_path in SMART_HOME_OWNED_JS:
                # 共享组件名需要进一步验证：mingli 自己有该文件不算
                if js_file in SHARED_COMPONENTS or js_path in SHARED_COMPONENTS:
                    # 只在 mingli 自己的 app/ 下不报（拼可能的实际路径都查一遍）
                    app = ROOT / 'app'
                    candidates = [app / js_path, app / js_file, app / 'js' / js_file]
                    if any(c.exists() for c in candidates):
                        continue
                hits.append({
                    'file': str(path.relative_to(ROOT)),
                    'line': i,
                    'pattern': 'SMART_HOME_JS_SRC',
                    'snippet': f'src={js_path[:100]}',
                })
        # 3. 独有 API 常量
        for tok in SMART_HOME_OWNED_API:
            if tok in line:
                hits.append({
                    'file': str(path.relative_to(ROOT)),
                    'line': i,
                    'pattern': 'SMART_HOME_API_TOKEN',
                    'snippet': line.strip()[:120],
                })
                break
    return hits

def main():
    all_hits = []
    app_dir = ROOT / 'app'
    for path in app_dir.rglob('*'):
        if not path.is_file():
            continue
        if path.suffix not in ('.html', '.js'):
            continue
        if is_excluded(path):
            continue
        all_hits.extend(scan_file(path))

    # 分类汇总
    by_pattern = defaultdict(int)
    for h in all_hits:
        by_pattern[h['pattern']] += 1

    report = {
        'ts': __import__('time').strftime('%Y-%m-%d %H:%M:%S'),
        'root': str(ROOT),
        'total_hits': len(all_hits),
        'by_pattern': dict(by_pattern),
        'hits': all_hits[:50],
    }

    out = ROOT / 'logs' / 'cross-project-scan.json'
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')

    print(f"=== 跨项目混入扫描（R117 · 智能体专属命名空间） === {report['ts']}")
    print(f"扫描根: {ROOT}")
    print(f"命中: {report['total_hits']}")
    for k, v in by_pattern.items():
        print(f"  - {k}: {v}")
    if all_hits:
        print("\n命中明细（前 10）:")
        for h in all_hits[:10]:
            print(f"  [{h['pattern']}] {h['file']}:{h['line']}  {h['snippet'][:80]}")
    print(f"\n报告: {out}")

    # 退出码
    if report['total_hits'] == 0:
        sys.exit(0)
    elif report['total_hits'] <= 5:
        sys.exit(1)
    else:
        sys.exit(2)

if __name__ == '__main__':
    main()