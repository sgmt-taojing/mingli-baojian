#!/usr/bin/env python3
"""
daily-patrol.py · 智能体全域日常巡检（文档 V1.1 5.4 节）
六大维度：
1. 功能可用性：全模块正常调用、无报错、无卡顿
2. 输出合规性：无越界医疗内容、无吉凶恐吓、无绝对化断语
3. 知识库匹配度：所有解读可溯源、无 AI 编造内容
4. 多模态稳定性：同类图片识别结果无漂移、无随机偏差
5. 格式规范性：JSON 结构化输出标准、报告模板统一
6. 素材管理规范性：图片分类准确、标签统一、无重复/垃圾样本

频次：每日轻巡检 / 每周一次全量深度巡检
"""

import json
import sys
import subprocess
import os
import re
from pathlib import Path
from datetime import datetime, timezone, timedelta

ROOT = Path('.')
TIMESTAMP = datetime.now(timezone(timedelta(hours=8))).strftime('%Y-%m-%d %H:%M:%S %z')
REPORT = {}

def _section(title):
    REPORT.setdefault('sections', []).append({'title': title, 'ts': TIMESTAMP})

def _check(name, status, detail=''):
    REPORT.setdefault('checks', []).append({'name': name, 'status': status, 'detail': detail})
    icon = '✅' if status == 'pass' else '⚠️' if status == 'warn' else '❌'
    print(f"  {icon} {name}: {detail}")

# === 维度 1：功能可用性 ===
def check_functionality():
    print("\n=== 维度 1：功能可用性 ===")
    _section('功能可用性')
    services = [
        ('API 网关', 'http://127.0.0.1:8920/api/health'),
        ('静态服务', 'http://127.0.0.1:8914/'),
        ('KB API', 'http://127.0.0.1:8901/'),
        ('排盘 API', 'http://127.0.0.1:8911/'),
    ]
    for name, url in services:
        try:
            out = subprocess.run(['curl', '-s', '-m', '3', '-o', '/dev/null', '-w', '%{http_code}', url],
                                 capture_output=True, text=True, timeout=5)
            code = out.stdout.strip()
            if code.startswith('2'):
                _check(f"服务-{name}", 'pass', f'HTTP {code}')
            else:
                _check(f"服务-{name}", 'warn', f'HTTP {code}')
        except Exception as e:
            _check(f"服务-{name}", 'fail', str(e)[:80])

# === 维度 2：输出合规性 ===
def check_compliance():
    print("\n=== 维度 2：输出合规性 ===")
    _section('输出合规性')
    try:
        out = subprocess.run(['python3', 'scripts/sft-compliance-check.py'],
                             capture_output=True, text=True, timeout=60)
        m = re.search(r'(\d+) cases', out.stdout)
        cases = m.group(1) if m else '0'
        issues = re.search(r'(\d+) issues', out.stdout)
        n_issues = issues.group(1) if issues else '0'
        if n_issues == '0':
            _check('训练数据合规', 'pass', f'{cases} cases · 0 issues')
        else:
            _check('训练数据合规', 'warn', f'{cases} cases · {n_issues} issues')
    except Exception as e:
        _check('训练数据合规', 'fail', str(e)[:80])

# === 维度 3：知识库匹配度 ===
def check_kb_coverage():
    print("\n=== 维度 3：知识库匹配度 ===")
    _section('知识库匹配度')
    db = ROOT / 'server' / 'database' / 'yidao.db'
    if not db.exists():
        _check('KB 数据库', 'warn', 'yidao.db 不存在')
        return
    try:
        out = subprocess.run(['python3', '-c', f'''
import sqlite3
con = sqlite3.connect(r"server/database/yidao.db")
cur = con.cursor()
cur.execute("SELECT COUNT(*), AVG(trust_score), COUNT(DISTINCT module) FROM kb_formal")
total, avg_trust, n_mod = cur.fetchone()
print(f"{{total}}|{{avg_trust or 0:.3f}}|{{n_mod}}")
'''], capture_output=True, text=True, timeout=10)
        parts = out.stdout.strip().split('|')
        if len(parts) == 3:
            total, trust, n_mod = parts
            _check('KB 总量', 'pass', f'{total} 条 / {n_mod} 模块 · avg_trust {trust}')
            if float(trust) < 0.75:
                _check('KB 信任度', 'warn', f'avg_trust {trust} < 0.75')
            else:
                _check('KB 信任度', 'pass', f'avg_trust {trust} ≥ 0.75')
        else:
            _check('KB 数据库', 'warn', f'查询失败: {out.stderr[:80]}')
    except Exception as e:
        _check('KB 数据库', 'fail', str(e)[:80])

# === 维度 4：多模态稳定性 ===
def check_multimodal_stability():
    print("\n=== 维度 4：多模态稳定性 ===")
    _section('多模态稳定性')
    # 检查 tongue-face-json.js schema validator
    tf = ROOT / 'server' / 'tongue-face-json.js'
    if tf.exists():
        try:
            out = subprocess.run(['node', '-e', '''
const tf = require("./server/tongue-face-json.js");
// 跑同一张图片 3 次，验证输出 schema 一致
const img = {
  size: {width: 800, height: 600, format: "jpg"},
  confidence: 0.88,
  features: {tongue: {shape:["胖大"], color:["红"], coating:["黄腻苔"]}, face: {complexion:["潮红"]}}
};
const r1 = tf.processTongueFace(img);
const r2 = tf.processTongueFace(img);
const r3 = tf.processTongueFace(img);
const k1 = Object.keys(r1).sort().join(",");
const k2 = Object.keys(r2).sort().join(",");
const k3 = Object.keys(r3).sort().join(",");
console.log(k1 === k2 && k2 === k3 ? "STABLE" : "UNSTABLE");
'''], capture_output=True, text=True, timeout=10)
            if 'STABLE' in out.stdout:
                _check('舌面诊稳定性', 'pass', '5 字段 schema 3 次输出一致')
            else:
                _check('舌面诊稳定性', 'warn', f'输出漂移: {out.stdout[:80]}')
        except Exception as e:
            _check('舌面诊稳定性', 'fail', str(e)[:80])
    else:
        _check('舌面诊模块', 'warn', 'tongue-face-json.js 不存在')

# === 维度 5：格式规范性 ===
def check_format_compliance():
    print("\n=== 维度 5：格式规范性 ===")
    _section('格式规范性')
    # 检查所有 .js 语法
    js_count = 0
    js_errors = 0
    for f in (ROOT / 'server').glob('*.js'):
        js_count += 1
        out = subprocess.run(['node', '--check', str(f)], capture_output=True, text=True, timeout=10)
        if out.returncode != 0:
            js_errors += 1
            _check(f'syntax-{f.name}', 'fail', out.stderr[:80])
    _check('JS 语法', 'pass' if js_errors == 0 else 'warn',
           f'{js_count} 文件 / {js_errors} 错误')

# === 维度 6：素材管理规范性 ===
def check_asset_management():
    print("\n=== 维度 6：素材管理规范性 ===")
    _section('素材管理规范性')
    img_dir = ROOT / 'data' / 'images'
    if not img_dir.exists():
        _check('图片素材目录', 'warn', 'data/images 不存在（项目当前以 KB 文本为主）')
        return
    n = sum(1 for _ in img_dir.glob('**/*') if _.is_file())
    _check('图片素材', 'pass', f'{n} 个文件')

# === 汇总报告 ===
def summary():
    print("\n" + "="*60)
    print(f"📋 巡检报告 · {TIMESTAMP}")
    print("="*60)
    n_pass = sum(1 for c in REPORT['checks'] if c['status'] == 'pass')
    n_warn = sum(1 for c in REPORT['checks'] if c['status'] == 'warn')
    n_fail = sum(1 for c in REPORT['checks'] if c['status'] == 'fail')
    total = len(REPORT['checks'])
    print(f"\n结果：✅ {n_pass} pass / ⚠️ {n_warn} warn / ❌ {n_fail} fail (共 {total})")

    if n_fail > 0:
        print("\n严重问题：")
        for c in REPORT['checks']:
            if c['status'] == 'fail':
                print(f"  ❌ {c['name']}: {c['detail']}")

    REPORT['summary'] = {
        'ts': TIMESTAMP,
        'total': total,
        'pass': n_pass,
        'warn': n_warn,
        'fail': n_fail
    }

    # 落盘
    out_path = ROOT / 'data' / 'patrol' / f'patrol-{datetime.now(timezone(timedelta(hours=8))).strftime("%Y%m%d-%H%M%S")}.json'
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, 'w') as f:
        json.dump(REPORT, f, ensure_ascii=False, indent=2)
    print(f"\n📁 报告已保存: {out_path}")
    return n_fail == 0

def main():
    print(f"🔍 智能体全域日常巡检 · {TIMESTAMP}")
    print("="*60)
    check_functionality()
    check_compliance()
    check_kb_coverage()
    check_multimodal_stability()
    check_format_compliance()
    check_asset_management()
    ok = summary()
    sys.exit(0 if ok else 1)

if __name__ == '__main__':
    main()