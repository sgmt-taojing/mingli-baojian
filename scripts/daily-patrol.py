#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""R117 统一：本文件曾是旧拷贝（与 _shared 权威版漂移）。
权威源唯一：projects/_shared/scripts/daily-patrol.py
本包装仅转发执行，防止双源知识不统一（用户核心诉求 #2）。"""
import os, sys, runpy
AUTH = os.path.join(os.path.dirname(__file__), '..', '_shared', 'scripts', 'daily-patrol.py')
AUTH = os.path.abspath(AUTH)
if not os.path.exists(AUTH):
    print('!! 权威巡检脚本缺失:', AUTH); sys.exit(3)
sys.argv[0] = AUTH
runpy.run_path(AUTH, run_name='__main__')
