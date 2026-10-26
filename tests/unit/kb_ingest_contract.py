#!/usr/bin/env python3
"""KBIngestor 临时 SQLite 契约测试；由 Jest 调用，不接触项目数据库。"""
import json
import sqlite3
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'scripts'))
from lib.kb_ingest import KBIngestor, fingerprint_of


SCHEMA = """
CREATE TABLE kb_formal (
  entry_id TEXT PRIMARY KEY, module TEXT, title TEXT, content TEXT,
  src_id TEXT, category TEXT, keywords TEXT, summary TEXT,
  trust_score REAL, version INTEGER, promoted_at TEXT, promoted_from TEXT,
  status TEXT, fingerprint TEXT, domain TEXT, tags TEXT,
  access_level TEXT, created_at TEXT, updated_at TEXT
)
"""


def row_for(entry_id='KB-T1', content='原文一', tags=None, domain='mingli'):
    return dict(entry_id=entry_id, module='test', title='题名', content=content,
                category='校勘', keywords='关键词', tags=tags or ['古籍', '测试'],
                trust=0.95, source='contract-test', domain=domain)


class KBIngestorContractTest(unittest.TestCase):
    def setUp(self):
        self.db = sqlite3.connect(':memory:')
        self.db.execute(SCHEMA)
        self.ing = KBIngestor(self.db, batch_size=100)

    def tearDown(self):
        self.db.close()

    def test_insert_uses_formal_fields_and_json_tags(self):
        self.assertEqual(self.ing.upsert(**row_for()), (True, 'inserted'))
        self.ing.commit()
        row = self.db.execute(
            'SELECT status,domain,fingerprint,tags,promoted_from,created_at,updated_at '
            'FROM kb_formal WHERE entry_id="KB-T1"').fetchone()
        self.assertEqual(row[0:2], ('formal', 'mingli'))
        self.assertEqual(row[2], fingerprint_of('原文一'))
        self.assertEqual(json.loads(row[3]), ['古籍', '测试'])
        self.assertEqual(row[4], 'contract-test')
        self.assertTrue(row[5] and row[6])
        self.assertIn('入库 1 条 · 更新 0 条', self.ing.stats())

    def test_same_id_is_reentrant_update_and_preserves_created_at(self):
        self.ing.upsert(**row_for(tags='原标签'))
        self.ing.commit()
        created = self.db.execute('SELECT created_at FROM kb_formal').fetchone()[0]
        updated = row_for(content='原文一校订', tags='校订标签')
        updated['title'] = '题名校订'
        self.assertEqual(self.ing.upsert(**updated), (True, 'updated'))
        self.ing.commit()
        row = self.db.execute(
            'SELECT title,content,tags,fingerprint,created_at FROM kb_formal').fetchone()
        self.assertEqual(row[0:3], ('题名校订', '原文一校订', '校订标签'))
        self.assertEqual(row[3], fingerprint_of('原文一校订'))
        self.assertEqual(row[4], created)
        self.assertEqual(self.db.execute('SELECT COUNT(*) FROM kb_formal').fetchone()[0], 1)
        self.assertIn('入库 1 条 · 更新 1 条', self.ing.stats())

    def test_same_content_on_other_id_is_rejected(self):
        self.ing.upsert(**row_for())
        with self.assertRaisesRegex(ValueError, '同文重复'):
            self.ing.upsert(**row_for(entry_id='KB-T2'))
        self.assertEqual(self.db.execute('SELECT COUNT(*) FROM kb_formal').fetchone()[0], 1)

    def test_same_content_in_other_module_is_also_rejected(self):
        self.ing.upsert(**row_for())
        other = row_for(entry_id='KB-T2')
        other['module'] = 'other'
        with self.assertRaisesRegex(ValueError, '同文重复'):
            self.ing.upsert(**other)

    def test_bad_domain_does_not_write(self):
        self.assertEqual(self.ing.upsert(**row_for(domain='tcm-authoritative')),
                         (False, 'bad-domain:tcm-authoritative'))
        self.assertEqual(self.db.execute('SELECT COUNT(*) FROM kb_formal').fetchone()[0], 0)


if __name__ == '__main__':
    unittest.main(verbosity=2)
