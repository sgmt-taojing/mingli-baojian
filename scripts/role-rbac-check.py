#!/usr/bin/env python3
# role-rbac-check.py — 角色 × 知识输出权限矩阵 35 用例验证
# 规范：docs/ROLE_KNOWLEDGE_MATRIX_V1.md
#
# 35 用例 = 7 角色 × 5 输出类型
#
# 用法：
#   python3 scripts/role-rbac-check.py
#
# 退出码：0=全绿；1=有失败

import json
import subprocess
import sys
import os

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RBAC_JS = os.path.join(PROJECT_ROOT, 'server', 'role-knowledge-rbac.js')

EXPECTED = {
    'free':         {'cultural_reference': True,  'knowledge_summary': False, 'knowledge_full': False, 'debug_trace': False, 'divination_conclude': False, 'tcm_diagnose': False, 'theory_create': False},
    'vip':          {'cultural_reference': True,  'knowledge_summary': False, 'knowledge_full': False, 'debug_trace': False, 'divination_conclude': False, 'tcm_diagnose': False, 'theory_create': False},
    'anonymous':    {'cultural_reference': True,  'knowledge_summary': False, 'knowledge_full': False, 'debug_trace': False, 'divination_conclude': False, 'tcm_diagnose': False, 'theory_create': False},
    'master':       {'cultural_reference': True,  'knowledge_summary': True,  'knowledge_full': False, 'debug_trace': False, 'divination_conclude': False, 'tcm_diagnose': False, 'theory_create': False},
    'doctor':       {'cultural_reference': True,  'knowledge_summary': True,  'knowledge_full': False, 'debug_trace': False, 'divination_conclude': False, 'tcm_diagnose': False, 'theory_create': False},
    'admin_b':      {'cultural_reference': True,  'knowledge_summary': False, 'knowledge_full': False, 'debug_trace': False, 'divination_conclude': False, 'tcm_diagnose': False, 'theory_create': False},
    'super_admin':  {'cultural_reference': True,  'knowledge_summary': True,  'knowledge_full': True,  'debug_trace': True,  'divination_conclude': False, 'tcm_diagnose': False, 'theory_create': False},
}

OUTPUT_TYPES = ['cultural_reference', 'knowledge_summary', 'knowledge_full', 'debug_trace', 'divination_conclude', 'tcm_diagnose', 'theory_create']
ROLES = ['free', 'vip', 'anonymous', 'master', 'doctor', 'admin_b', 'super_admin']

LINE = '=' * 70
DASH = '-' * 70


def run_check(role: str, output_type: str):
    """返回 (access_bool, level_str)"""
    js_code = (
        "const rbac = require(" + json.dumps(RBAC_JS) + "); "
        "const access = rbac.checkAccess([" + json.dumps(role) + "], " + json.dumps(output_type) + "); "
        "const level = rbac.buildOutputLevel([" + json.dumps(role) + "], " + json.dumps(output_type) + "); "
        "console.log(JSON.stringify({ access: access, level: level }));"
    )
    try:
        proc = subprocess.run(['node', '-e', js_code], cwd=PROJECT_ROOT, capture_output=True, text=True, timeout=10)
        if proc.returncode != 0:
            return None, None
        out = proc.stdout.strip().split('\n')[-1] if proc.stdout else ''
        data = json.loads(out)
        return data.get('access'), data.get('level')
    except Exception as e:
        print("WARN: call failed: " + str(e), file=sys.stderr)
        return None, None


def main():
    print(LINE)
    print("角色 × 知识输出权限矩阵 · 35 用例验证（R314 V1.0）")
    print(LINE)
    print()

    # 模块加载自检
    try:
        proc = subprocess.run(
            ['node', '-e', "const r = require(" + json.dumps(RBAC_JS) + "); console.log('OK', Object.keys(r.MATRIX).length);"],
            cwd=PROJECT_ROOT, capture_output=True, text=True, timeout=5,
        )
        if proc.returncode != 0:
            print("ERROR: RBAC module load failed: " + proc.stderr)
            sys.exit(1)
        print("RBAC 模块加载: " + proc.stdout.strip())
    except Exception as e:
        print("ERROR: bootstrap failed: " + str(e))
        sys.exit(1)

    print()
    print("=== 35 用例检查 ===")
    print("{:4} {:12} {:22} {:8} {:8} {:8} {:8}".format("#", "角色", "输出类型", "期望", "实际", "级别", "结果"))
    print(DASH)

    pass_count = 0
    fail_count = 0
    fail_list = []

    idx = 1
    for role in ROLES:
        for output_type in OUTPUT_TYPES:
            expected = EXPECTED[role][output_type]
            actual, level = run_check(role, output_type)
            ok = (actual == expected)
            status = "PASS" if ok else "FAIL"
            if ok:
                pass_count += 1
            else:
                fail_count += 1
                fail_list.append((idx, role, output_type, expected, actual, level))
            print("{:4} {:12} {:22} {:8} {:8} {:8} {:8}".format(
                idx, role, output_type, str(expected), str(actual), str(level), status
            ))
            idx += 1

    print(DASH)
    total = pass_count + fail_count
    print("总计：" + str(total) + " 用例 · PASS " + str(pass_count) + " · FAIL " + str(fail_count))
    print()

    if fail_count > 0:
        print("失败用例清单：")
        for f in fail_list:
            print("  - #" + str(f[0]) + " " + f[1] + " × " + f[2] + ": 期望 " + str(f[3]) + ", 实际 " + str(f[4]) + "（级别 " + str(f[5]) + "）")
        print()
        print(LINE)
        print("结果：FAIL（" + str(fail_count) + "/" + str(total) + " 不通过）")
        print(LINE)
        sys.exit(1)

    print()
    print("=== 角色提示词注入测试 ===")
    for role in ['free', 'master', 'doctor', 'admin_b', 'super_admin']:
        js = (
            "const r = require(" + json.dumps(RBAC_JS) + "); "
            "const injected = r.injectRolePromptSection('BASE', ['" + role + "']); "
            "console.log(JSON.stringify({ "
            "role: '" + role + "', "
            "hasL1: injected.indexOf('L1') >= 0, "
            "hasL2: injected.indexOf('L2') >= 0, "
            "hasL3: injected.indexOf('L3') >= 0, "
            "hasRedline: injected.indexOf('红线') >= 0 "
            "}));"
        )
        try:
            proc = subprocess.run(['node', '-e', js], cwd=PROJECT_ROOT, capture_output=True, text=True, timeout=5)
            if proc.returncode == 0:
                data = json.loads(proc.stdout.strip())
                print("  " + role.ljust(12) + ": L1=" + str(data['hasL1']) + ", L2=" + str(data['hasL2']) + ", L3=" + str(data['hasL3']) + ", 红线=" + str(data['hasRedline']))
        except Exception as e:
            print("  " + role.ljust(12) + ": WARN " + str(e))

    print()
    print("=== 角色提示词文件加载测试 ===")
    prompt_files = ['L1-cultural.md', 'L2-knowledge-master.md', 'L2-knowledge-doctor.md', 'L3-debug.md']
    for f in prompt_files:
        path = os.path.join(PROJECT_ROOT, 'server', 'role-prompts', f)
        if os.path.exists(path):
            size = os.path.getsize(path)
            print("  OK  " + f.ljust(32) + str(size) + " bytes")
        else:
            print("  ERR " + f.ljust(32) + " 不存在")
            fail_count += 1

    print()
    print(LINE)
    if fail_count == 0:
        print("结果：PASS（35/" + str(pass_count) + " 全绿）")
        sys.exit(0)
    else:
        print("结果：FAIL")
        sys.exit(1)


if __name__ == '__main__':
    main()