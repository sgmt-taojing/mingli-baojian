#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
kb_ingest.py — kb_formal 统一入库新口径（R-INGEST-SPEC · 2026-09-27 定版）

所有向 kb_formal 写入命理/知识条目的脚本【必须】走本模块，禁止手写 INSERT。

新口径五要素（对比 2026-09-27 前旧口径）：
  1. fingerprint  —— SHA256(content)[:16]，幂等去重锚点（旧：无，重复入库无法识别）
  2. status       —— 一律 'formal'（旧：'active'，与审计流状态机不一致）
  3. domain       —— 必填：'mingli'（命理域）/ 'reference'（医学参考域·只读）等；
                    医学权威条目走 tcm 内化通道，不允许本模块写 domain='tcm-authoritative'
  4. trust_score  —— 古典原典 0.95 / 今人整理 0.85 / 蒸馏草案 ≤0.80
  5. 时间戳       —— 一律 datetime('now','localtime')（UTC 会让守卫增量窗口抓不到）

用法：
    from lib.kb_ingest import KBIngestor
    ing = KBIngestor(conn)                      # sqlite3 连接（yidao.db）
    ok, why = ing.insert(
        entry_id='XJB|zeri|卷01|...',           # 含全 category 路径，防截断撞键
        module='zeri', title='...', content='...',
        category='zeri', keywords='...', tags=['择日','协纪辨方书'],
        source='wikisource',                    # promoted_from 标记
    )
    # ok=False, why='duplicate' 表示指纹/entry_id 命中幂等，安全跳过
    ing.commit()                                # 批量模式：攒一批再 commit（守卫长事务教训：200-500/批）

边界（ADR-024）：诊疗链路条目不从本模块入；命理域内容不得标注为医学权威。
"""
import hashlib
import json
import sqlite3

SPEC_VERSION = 'R-INGEST-SPEC-20260927'

# 允许本模块写入的域（医学权威域走 tcm 内化通道，不在此列）
ALLOWED_DOMAINS = {'mingli', 'reference', 'folk', 'tech'}

INSERT_SQL = """INSERT INTO kb_formal
    (entry_id, module, title, content, src_id, category, keywords, summary,
     trust_score, version, promoted_at, promoted_from, status, fingerprint,
     domain, tags, access_level, created_at, updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,1,datetime('now','localtime'),?,'formal',?,?,
            ?,?,datetime('now','localtime'),datetime('now','localtime'))"""


def fingerprint_of(content: str) -> str:
    """内容指纹：SHA256 前 16 位，幂等去重锚点。"""
    return hashlib.sha256(content.encode('utf-8')).hexdigest()[:16]


class KBIngestor:
    def __init__(self, conn: sqlite3.Connection, batch_size: int = 300):
        self.conn = conn
        self.batch_size = batch_size   # kb-sync-guard 长事务教训：每 200-500 行落一批
        self._pending = 0
        self.inserted = 0
        self.duplicates = 0

    def insert(self, *, entry_id: str, module: str, title: str, content: str,
               category: str = None, keywords: str = '', summary: str = '',
               src_id: str = None, tags=None, domain: str = 'mingli',
               trust: float = 0.95, source: str = 'manual',
               access_level: str = 'public'):
        """新口径单条入库。返回 (True, 'inserted') 或 (False, 'duplicate'/'bad-domain')。"""
        if domain not in ALLOWED_DOMAINS:
            return False, f'bad-domain:{domain}'
        fp = fingerprint_of(content)
        cur = self.conn.cursor()
        # 幂等：entry_id 或 fingerprint 命中即跳过
        hit = cur.execute(
            "SELECT 1 FROM kb_formal WHERE entry_id=? OR fingerprint=? LIMIT 1",
            (entry_id, fp)).fetchone()
        if hit:
            self.duplicates += 1
            return False, 'duplicate'
        tags_json = json.dumps(tags or [], ensure_ascii=False)
        cur.execute(INSERT_SQL, (
            entry_id, module, title, content, src_id, category or module,
            keywords, summary, trust, source, fp, domain, tags_json, access_level))
        self.inserted += 1
        self._pending += 1
        if self._pending >= self.batch_size:
            self.commit()
        return True, 'inserted'

    def commit(self):
        if self._pending:
            self.conn.commit()
            self._pending = 0

    def stats(self) -> str:
        return f'入库 {self.inserted} 条 · 幂等跳过 {self.duplicates} 条 · spec={SPEC_VERSION}'
