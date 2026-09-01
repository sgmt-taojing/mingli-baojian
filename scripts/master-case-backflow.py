#!/usr/bin/env python3
"""命理师案例回流管线（R781）：master_cases 新完成的案例 → 自动入验证库（高权重校正样本）
用法：python3 scripts/master-case-backflow.py（可挂 cron 每日跑）
权重规则：复核通过或高质量=2.0（命理师专业背书，全库最高）；普通完成=1.5
"""
import sqlite3, json, urllib.request

DB = 'server/database/yidao.db'
API = 'http://127.0.0.1:8911/paipan'

def main():
    db = sqlite3.connect(DB)
    rows = db.execute("""SELECT case_uuid, bazi_chart, wuxing_summary, status, review_status, is_high_quality 
        FROM master_cases WHERE status='completed'""").fetchall()
    imported = new = 0
    for case_uuid, chart_j, wuxing, status, review, hq in rows:
        try:
            pid = f'master_case_{case_uuid[-8:]}'
            exists = db.execute("SELECT 1 FROM verification_corpus WHERE person_id=?", (pid,)).fetchone()
            if exists: imported += 1; continue
            b = json.loads(chart_j)
            y, m, d, h = b.get('year'), b.get('month'), b.get('day'), b.get('hour', 12)
            if not (y and m and d): continue
            body = json.dumps({"year":y,"month":m,"day":d,"hour":h if isinstance(h,int) else 12,"minute":0,"gender":b.get('gender','male')}).encode()
            req = urllib.request.Request(API, data=body, headers={'Content-Type':'application/json'})
            p = json.loads(urllib.request.urlopen(req, timeout=20).read())
            w = 2.0 if (review=='approved' or hq) else 1.5
            db.execute("""INSERT OR IGNORE INTO verification_corpus (person_id,name,source,source_detail,birth_json,facts_json,paipan_json,verify_status,weight) 
                VALUES (?,?,?,?,?,?,?,?,?)""",
                (pid, f'命理师案例_{case_uuid[-6:]}', '命理师案例', f'master_cases/{case_uuid}',
                 json.dumps({"year":y,"month":m,"day":d,"hour":h,"gender":b.get('gender','male')},ensure_ascii=False),
                 json.dumps({"master_analysis": wuxing, "review_status": review, "high_quality": bool(hq)},ensure_ascii=False),
                 json.dumps(p,ensure_ascii=False)[:50000], 'verified', w))
            new += 1
        except Exception: continue
    db.commit()
    print(f'回流完成：新增 {new}，存量 {imported}')
    db.close()

if __name__ == '__main__':
    main()
