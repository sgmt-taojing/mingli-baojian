#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""R117 统一：本文件曾是旧拷贝（与 _shared 权威版漂移）。
权威源唯一：projects/_shared/scripts/daily-patrol.py
本包装仅转发执行，防止双源知识不统一（用户核心诉求 #2）。

2026-08-18 修真（R117 路径修复）：原 `../_shared` 解析到仓库内不存在的
`projects/mingli-baojian/_shared`，导致巡检持续失败（cron consecutiveErrors=2）。
修复为候选链：projects/_shared（权威）→ 仓库内 _shared（历史布局）→ 工作区 _shared。"""
import os, sys, runpy

_HERE = os.path.dirname(os.path.abspath(__file__))
_CANDIDATES = [
    # 1) 权威源：projects/_shared（与 health-patrol.sh / cron-distill 一致）
    os.path.normpath(os.path.join(_HERE, '..', '..', '_shared', 'scripts', 'daily-patrol.py')),
    # 2) 历史布局：仓库内 _shared（兼容旧 checkout）
    os.path.normpath(os.path.join(_HERE, '..', '_shared', 'scripts', 'daily-patrol.py')),
    # 3) 工作区级 _shared（兜底）
    os.path.normpath(os.path.join(os.path.expanduser('~'), '.openclaw-autoclaw', 'workspace', '_shared', 'scripts', 'daily-patrol.py')),
]

AUTH = next((p for p in _CANDIDATES if os.path.exists(p)), None)
if not AUTH:
    print('!! 权威巡检脚本缺失（已尝试: %s）' % '; '.join(_CANDIDATES))
    sys.exit(3)

sys.argv[0] = AUTH
runpy.run_path(AUTH, run_name='__main__')
