#!/usr/bin/env python3
# meta-only 2,637 条删除（ADR-020 批准）第一步：备份+基线
import sqlite3, json, os, datetime, urllib.request

DB = '/Users/tom/kimi/projects/mingli-baojian/server/database/yidao.db'
TS = datetime.datetime.now().strftime('%Y%m%d-%H%M%S')
COLD = '/Volumes/模型训练数据/cold-storage'
os.makedirs(COLD, exist_ok=True)

con = sqlite3.connect(f'file:{DB}?mode=ro', uri=True)
SEL = "tags LIKE '%meta-only%' AND tags NOT LIKE '%toc-page%'"
rows = con.execute(f"SELECT * FROM kb_formal WHERE {SEL}").fetchall()
cols = [d[0] for d in con.execute("SELECT * FROM kb_formal LIMIT 0").description]
backup = {'asof': TS, 'criteria': SEL, 'count': len(rows),
          'columns': cols, 'rows': [list(r) for r in rows]}
bp = f'{COLD}/kb-meta-only-backup-{TS}.json'
with open(bp, 'w', encoding='utf-8') as f:
    json.dump(backup, f, ensure_ascii=False)
size = os.path.getsize(bp)

counts = dict(
    kb_formal=con.execute("SELECT COUNT(*) FROM kb_formal").fetchone()[0],
    kb_fts5=con.execute("SELECT COUNT(*) FROM kb_fts5").fetchone()[0],
    kb_formal_fts=con.execute("SELECT COUNT(*) FROM kb_formal_fts").fetchone()[0],
    meta_only_total=con.execute(f"SELECT COUNT(*) FROM kb_formal WHERE tags LIKE '%meta-only%'").fetchone()[0],
)
con.close()

# Recall 基线：20 个固定命理查询词，经线上 API 记录命中数（FTS + 普通双通道）
QS = ['日主','十神','大运','流年','格局','用神','神煞','纳音','太岁','合婚',
      '紫微','六爻','奇门','风水','桃花','贵人','伤官','正官','七杀','食神']
def hits(path):
    try:
        req = urllib.request.Request('http://localhost:8920' + path,
                                     headers={'X-Skip-Interceptor': '1',
                                              'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as r:
            d = json.loads(r.read().decode('utf-8'))
            for k in ('total', 'totalHits', 'count'):
                if isinstance(d, dict) and k in d: return d[k]
            if isinstance(d, dict) and isinstance(d.get('data'), dict):
                return d['data'].get('total', len(d['data'].get('list', [])))
            if isinstance(d, dict) and isinstance(d.get('list'), list): return len(d['list'])
            if isinstance(d, dict) and isinstance(d.get('results'), list): return len(d['results'])
            return None
    except Exception as e:
        return f'ERR:{e}'
base = {'asof': TS, 'counts': counts, 'queries': {}}
import urllib.parse
for q in QS:
    e = urllib.parse.quote(q)
    base['queries'][q] = {
        'fts': hits(f'/api/public/kb/search-fts?q={e}&limit=20'),
        'plain': hits(f'/api/public/kb/search?q={e}&size=20'),
    }
bl = f'/Users/tom/kimi/projects/mingli-baojian/DELIVERY/kb-recall-baseline-{TS}.json'
with open(bl, 'w', encoding='utf-8') as f:
    json.dump(base, f, ensure_ascii=False, indent=1)
print(json.dumps({'backup': bp, 'backup_bytes': size, 'backup_rows': len(rows),
                  'baseline': bl, 'counts': counts,
                  'sample_queries': {k: base['queries'][k] for k in QS[:4]}}, ensure_ascii=False, indent=1))
