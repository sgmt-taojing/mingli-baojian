#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""命理宝鉴 全体系静态审计（2026-10-16）
扫描 app/*.html + app/js/*.js，输出五类问题：
  A. 本地资源断链（script/link/img）
  B. 页面导航断链（href=*.html）
  C. 死按钮（onclick 调用的函数在全载 JS 中无定义）
  D. 接口对账（fetch('/api/...') 与服务端路由表比对）
  E. JS 引用缺 ?v= 版本号（缓存风险）
"""
import re, os, glob, json, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APP = os.path.join(ROOT, 'app')
SRV = os.path.join(ROOT, 'server')

htmls = sorted(glob.glob(os.path.join(APP, '*.html')))
jss = {os.path.basename(p): open(p, encoding='utf-8', errors='ignore').read()
       for p in glob.glob(os.path.join(APP, 'js', '*.js'))}

report = {k: [] for k in 'ABCDE'}

# ---------- 收集服务端路由 ----------
routes = set()
# node: app.get('/api/xxx' / router.post("/api/xxx"
for p in glob.glob(os.path.join(SRV, '*.js')):
    s = open(p, encoding='utf-8', errors='ignore').read()
    for m in re.finditer(r"(?:app|router)\.(?:get|post|put|delete|patch)\s*\(\s*['\"]([^'\"]+)['\"]", s):
        routes.add(m.group(1))
# python servers: path == '/xxx' or startswith
for p in glob.glob(os.path.join(SRV, '*.py')):
    s = open(p, encoding='utf-8', errors='ignore').read()
    for m in re.finditer(r"path\s*(?:==|\.startswith\()\s*['\"]([^'\"]+)['\"]", s):
        routes.add(m.group(1))
    for m in re.finditer(r"self\.path\s*(?:==|\.startswith\()\s*['\"]([^'\"]+)['\"]", s):
        routes.add(m.group(1))

def route_exists(path):
    path = path.split('?')[0]
    if path in routes: return True
    # 参数化路由 /api/xxx/:id
    for r in routes:
        if ':' in r:
            pat = '^' + re.sub(r':[^/]+', r'[^/]+', r) + '$'
            if re.match(pat, path): return True
        elif r.endswith('/') and path.startswith(r): return True
    return False

# 已知前端拼接变量前缀
API_PREFIXES = ('/api/', '/paipan', '/kb/', '/tts')

# ---------- 全局函数定义表（全部 JS + 内联） ----------
defined = set()
for name, s in jss.items():
    for m in re.finditer(r"function\s+([A-Za-z_$][\w$]*)\s*\(", s):
        defined.add(m.group(1))
    for m in re.finditer(r"(?:var|let|const)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:function|\()", s):
        defined.add(m.group(1))
    for m in re.finditer(r"window\.([A-Za-z_$][\w$]*)\s*=", s):
        defined.add(m.group(1))
# 常见全局/内建
BUILTIN = {'alert','confirm','prompt','showToast','open','close','print','esc','encodeURIComponent',
           'switchTab','toggleTheme','location','history','switchZwCal','switchZwLunar','runFaceTongueFusion','searchKbCases'}

for hp in htmls:
    name = os.path.basename(hp)
    s = open(hp, encoding='utf-8', errors='ignore').read()

    # 页面自身加载的 JS（内联 + 本地外链）合并做函数定义分析
    page_defs = set()
    for m in re.finditer(r"function\s+([A-Za-z_$][\w$]*)\s*\(", s):
        page_defs.add(m.group(1))
    for m in re.finditer(r"(?:var|let|const)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:function|\()", s):
        page_defs.add(m.group(1))
    for m in re.finditer(r"window\.([A-Za-z_$][\w$]*)\s*=", s):
        page_defs.add(m.group(1))
    loaded_js = re.findall(r'<script[^>]+src=["\'](?:js/)?([\w./-]+\.js)', s)
    for lj in loaded_js:
        bn = os.path.basename(lj)
        if bn in jss:
            js = jss[bn]
            for m in re.finditer(r"function\s+([A-Za-z_$][\w$]*)\s*\(", js):
                page_defs.add(m.group(1))
            for m in re.finditer(r"(?:var|let|const)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:function|\()", js):
                page_defs.add(m.group(1))
            for m in re.finditer(r"window\.([A-Za-z_$][\w$]*)\s*=", js):
                page_defs.add(m.group(1))

    # A. 本地资源断链
    for m in re.finditer(r'(?:src|href)=["\']((?!https?:|//|data:|#|mailto:)([^"\']+))["\']', s):
        url = m.group(1).split('?')[0]
        if '${' in url: continue  # 模板串动态资源
        if url.endswith(('.js', '.css', '.png', '.jpg', '.svg', '.ico', '.woff2', '.json')):
            fp = os.path.join(APP, url.lstrip('/'))  # 绝对路径以 app/ 为根
            if not os.path.exists(fp):
                report['A'].append(f'{name}: 资源缺失 {m.group(1)}')

    # B. 导航断链
    for m in re.finditer(r'(?:href|action)=["\']([\w./-]+\.html)(?:\?[^"\']*)?["\']', s):
        if not os.path.exists(os.path.join(APP, m.group(1).lstrip('/'))):
            report['B'].append(f'{name}: 页面缺失 {m.group(1)}')
    for m in re.finditer(r"location\.href\s*=\s*['\"]([\w./-]+\.html)", s):
        if not os.path.exists(os.path.join(APP, m.group(1).lstrip('/'))):
            report['B'].append(f'{name}: JS跳转缺失 {m.group(1)}')

    # C. 死按钮
    for m in re.finditer(r'on(?:click|change|input|submit)=["\']\s*(?:return\s+)?([A-Za-z_$][\w$]*)\s*\(', s):
        fn = m.group(1)
        if fn in ('if','for','while','switch','return'): continue  # 内联语句关键字
        if fn not in page_defs and fn not in defined and fn not in BUILTIN:
            report['C'].append(f'{name}: 调用未定义函数 {fn}()')

    # D. 接口对账
    for m in re.finditer(r"fetch\(\s*(?:API_BASE|API|PAIPAN_API|TTS_API|KB_API)?\s*\+?\s*['\"]([^'\"]+)['\"]", s):
        path = m.group(1)
        if path.startswith('/') and path.startswith(API_PREFIXES):
            if not route_exists(path):
                report['D'].append(f'{name}: 接口疑似不存在 {path}')
    # JS 文件里的接口（只统计一次，归属 js 文件）
for jname, s in jss.items():
    for m in re.finditer(r"fetch\(\s*(?:API_BASE|API|PAIPAN_API|TTS_API|KB_API)?\s*\+?\s*['\"]([^'\"]+)['\"]", s):
        path = m.group(1)
        if path.startswith('/') and path.startswith(API_PREFIXES):
            if not route_exists(path):
                report['D'].append(f'js/{jname}: 接口疑似不存在 {path}')

# E. JS 引用缺版本号（按 HTML 逐页扫描，2026-10-16 修复变量泄漏：原误扫 JS 文件内容并记在最后一个页面名下）
for hp in htmls:
    name = os.path.basename(hp)
    s = open(hp, encoding='utf-8', errors='ignore').read()
    for m in re.finditer(r'<script[^>]+src=["\'](js/[\w./-]+\.js)["\']', s):
        report['E'].append(f'{name}: 无版本号 {m.group(1)}')

# ---------- 输出 ----------
total = 0
for k, label in [('A', '本地资源断链'), ('B', '页面导航断链'), ('C', '死按钮'), ('D', '接口对账'), ('E', 'JS缺版本号')]:
    items = sorted(set(report[k]))
    total += len(items)
    print(f'\n===== {k}. {label}（{len(items)} 项）=====')
    for it in items[:80]:
        print(' ', it)
    if len(items) > 80:
        print(f'  ... 另有 {len(items)-80} 项')
print(f'\n===== 汇总：{total} 项 =====')
print(f'（服务端路由表共 {len(routes)} 条）')
