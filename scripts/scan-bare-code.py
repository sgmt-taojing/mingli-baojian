#!/usr/bin/env python3
"""全站扫描裸 CSS/裸 JS 泄漏：head 区 CSS 无 <style> 包裹、body 区 JS 无 <script> 包裹"""
import re, os, sys

APP_DIR = '/Users/tom/kimi/projects/mingli-baojian/app'

# CSS 特征：注释 + 选择器（{ } 带 CSS 属性）
CSS_PATTERN = re.compile(r'^\s*/\*.*?\*/\s*$', re.M)
# 裸 JS 特征：行首 function/const/let/var/(function/})();
JS_PATTERN = re.compile(r'^\s*(?:\(function\s*\(|function\s+\w+\s*\(|const\s+\w+\s*=|let\s+\w+\s*=|window\.\w+\s*=\s*(?:function|\{))', re.M)

def scan_file(path):
    with open(path, 'r', encoding='utf-8', errors='ignore') as f:
        html = f.read()
    issues = []

    # 1. 计算 head 区裸 CSS：在 </head> 之前，不在 <style>...</style> 内，且以 /* 开头
    head_end = html.find('</head>')
    if head_end == -1:
        head_end = len(html)
    head = html[:head_end]
    # 移除 head 内所有 <style>...</style> 块
    head_no_style = re.sub(r'<style[^>]*>.*?</style>', '', head, flags=re.S)
    # 找裸 CSS 注释
    for m in re.finditer(r'/\*.*?\*/', head_no_style, re.S):
        line_no = html[:head_end][:m.start()].count('\n') + 1
        issues.append(('head-bare-css', path, line_no, m.group(0)[:60]))

    # 2. 计算裸 JS：不在 <script>...</script> 内的 (function(){ / window.X = 
    # 先移除所有 script 块 + pre/code 块（示例代码不算泄漏），然后按行匹配
    body = html
    body_no_script = re.sub(r'<script[^>]*>.*?</script>', '', body, flags=re.S)
    body_no_code = re.sub(r'<pre[^>]*>.*?</pre>', '', body_no_script, flags=re.S)
    body_no_code = re.sub(r'<code[^>]*>.*?</code>', '', body_no_code, flags=re.S)
    for i, line in enumerate(body_no_code.split('\n'), 1):
        s = line.strip()
        if not s:
            continue
        # 排除 HTML 注释和标签行
        if s.startswith('<!--') or s.startswith('<') or s.endswith('>'):
            continue
        if JS_PATTERN.match(s):
            issues.append(('bare-js', path, i, s[:60]))

    return issues

def main():
    total_issues = 0
    for root, dirs, files in os.walk(APP_DIR):
        if 'node_modules' in root or '.git' in root:
            continue
        for f in sorted(files):
            if not f.endswith('.html'):
                continue
            p = os.path.join(root, f)
            rel = os.path.relpath(p, APP_DIR)
            try:
                issues = scan_file(p)
            except Exception as e:
                print(f'ERR {rel}: {e}')
                continue
            if issues:
                total_issues += len(issues)
                print(f'⚠️ {rel}:')
                for typ, _, ln, snippet in issues:
                    print(f'   [{typ}] L{ln}: {snippet}')
    print(f'\n总计: {total_issues} 处问题')
    return total_issues

if __name__ == '__main__':
    sys.exit(1 if main() else 0)
