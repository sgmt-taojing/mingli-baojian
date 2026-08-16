#!/usr/bin/env python3
"""
R119-W1 医学物理迁移（2026-08-16）
mingli kb_formal (authority='tcm-agent-pending-migration', 26,604 条)
→ tcm-agent 权威库 tcm-synced-kb.json（18,243 条）双源合并去重

流程：
1. mingli 只读导出（mode=ro，不动源库）
2. fingerprint（content sha1）去重：与权威库现有条目比对
3. 合并写入新权威库（原子替换 + 备份）
4. 输出迁移报告 JSON
"""
import sqlite3, json, hashlib, os, shutil, sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

MINGLI_DB = '/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/server/database/yidao.db'
AUTH_KB = '/Users/tom/.openclaw-autoclaw/workspace/projects/tcm-agent/server/kb-store/tcm-synced-kb.json'
REPORT = '/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/.openclaw/tmp/r119-migration-report.json'
MODULE_MAP = {
    'tcm': 'tcm', 'tcm-classical': 'tcm-classical', 'nihaisha-tcm': 'nihaisha-tcm',
    'tcm-clinical': 'tcm-clinical', 'tcm-fangji': 'tcm-fangji', 'tcm-syndrome': 'tcm-syndrome',
    'tcm-acupuncture': 'tcm-acupuncture', 'tcm-diagnosis': 'tcm-diagnosis',
    'tcm-herb': 'tcm-herb', 'tcm-zhongfu': 'tcm-zhongfu', 'shuhan-tcm': 'shuhan-tcm',
    'tcm-wangzhen': 'tcm-wangzhen', 'tcm-basic': 'tcm-basic', 'tcm-device': 'tcm-device',
    'tcm-agent': 'tcm-misc', 'huangdi-neijing': 'tcm-classical',
    'shanghan-lun': 'shanghan-lun', 'shennong-bencao': 'tcm-herb',
    'nihaisha': 'nihaisha', 'nihaisha_pcs': 'nihaisha-tcm', 'nihaixia': 'nihaisha',
    'acupuncture': 'tcm-acupuncture', 'wangzhen': 'tcm-diagnosis',
    'jinkui-yaolue': 'shanghan-lun', 'general': 'tcm-misc',
    'r45_tcm': 'tcm-misc', 'tcm,fengshui': 'tcm-misc', 'tcm,shanghan-lun,jinkui': 'tcm-classical',
    'qimen/shuihan-tcm': 'tcm-misc',
}

def fp(text):
    return hashlib.sha1((text or '').encode('utf-8', errors='ignore')).hexdigest()

def main():
    report = {'ts': datetime.now(timezone(timedelta(hours=8))).isoformat(), 'steps': []}

    # 1) 读权威库现状
    with open(AUTH_KB) as f:
        auth = json.load(f)
    existing = {}  # fp -> (module, id)
    for mod, items in auth.items():
        for it in items:
            existing[fp(it.get('content', ''))] = (mod, it.get('id', ''))
    report['steps'].append({'step': 'read_auth', 'modules': len(auth), 'entries': len(existing)})
    print(f"权威库现状: {len(auth)} 模块 / {len(existing)} 条(去重后)")

    # 2) mingli 只读导出
    conn = sqlite3.connect(f'file:{MINGLI_DB}?mode=ro', uri=True)
    conn.row_factory = sqlite3.Row
    rows = conn.execute(
        "SELECT entry_id, module, title, content, keywords, confidence, src_id, category, created_at "
        "FROM kb_formal WHERE authority='tcm-agent-pending-migration'"
    ).fetchall()
    conn.close()
    print(f"mingli 待迁移: {len(rows)} 条")
    report['steps'].append({'step': 'export_mingli', 'entries': len(rows)})

    # 3) 去重合并
    added = {}   # module -> [items]
    dup = 0
    for r in rows:
        f = fp(r['content'])
        if f in existing:
            dup += 1
            continue
        mod = MODULE_MAP.get(r['module'], 'tcm-misc')
        # keywords 容错解析：JSON 数组 / 逗号串 / 单值
        kw_raw = (r['keywords'] or '').strip()
        kw = []
        if kw_raw:
            if kw_raw.startswith('['):
                try:
                    kw = json.loads(kw_raw)
                except Exception:
                    kw = [kw_raw]
            elif ',' in kw_raw:
                kw = [x.strip() for x in kw_raw.split(',') if x.strip()]
            else:
                kw = [kw_raw]
        item = {
            'id': r['entry_id'],
            'title': r['title'] or '',
            'content': r['content'] or '',
            'keywords': kw[:20],
            'confidence': float(r['confidence'] or 0.8),
            'src_id': r['src_id'] or f"SRC-MIGRATION-{r['module']}",
            'category': r['category'] or 'r119-migration',
            'module': mod,
            'synced_at': datetime.now(timezone(timedelta(hours=8))).isoformat(),
        }
        added.setdefault(mod, []).append(item)
        existing[f] = (mod, item['id'])

    total_added = sum(len(v) for v in added.values())
    print(f"去重后新增: {total_added} 条（重复 {dup} 条）")
    report['steps'].append({'step': 'merge', 'added': total_added, 'dup': dup})

    # 4) 原子合并写回
    backup = AUTH_KB + '.bak-pre-r119-migration'
    shutil.copy(AUTH_KB, backup)
    for mod, items in added.items():
        auth.setdefault(mod, [])
        # 按 fingerprint 二次防重（同模块内）
        seen = {fp(i.get('content','')) for i in auth[mod]}
        for it in items:
            if fp(it['content']) not in seen:
                auth[mod].append(it)
                seen.add(fp(it['content']))
    tmp = AUTH_KB + '.tmp'
    with open(tmp, 'w') as f:
        json.dump(auth, f, ensure_ascii=False, indent=1)
    os.replace(tmp, AUTH_KB)
    final_total = sum(len(v) for v in auth.values())
    print(f"写入完成: {len(auth)} 模块 / {final_total} 条（备份 {os.path.basename(backup)}）")
    report['steps'].append({'step': 'write', 'modules': len(auth), 'entries': final_total})
    report['summary'] = {'auth_before': len(existing), 'added': total_added, 'dup': dup, 'auth_after': final_total}

    with open(REPORT, 'w') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    print(f"报告: {REPORT}")
    print(json.dumps(report['summary'], ensure_ascii=False))

if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        import traceback
        print(json.dumps({'status': 'error', 'reason': str(e), 'trace': traceback.format_exc()[:500]}), file=sys.stderr)
        sys.exit(1)
