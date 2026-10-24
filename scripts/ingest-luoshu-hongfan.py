#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""P7 兼容入口。

原实现直写 kb_fts5，已废止。现转交 P8 可重入入库器：只维护 kb_formal，
再调用 kb-sync-guard.py 同步 FTS；同时保留洪范卷二校勘台账与蔡沈本扩充。
"""
from pathlib import Path
import runpy

ROOT = Path(__file__).resolve().parent.parent
runpy.run_path(str(ROOT / 'scripts/ingest-hongfan-huangji.py'), run_name='__main__')
