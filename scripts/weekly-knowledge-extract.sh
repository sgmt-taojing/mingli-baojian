#!/bin/bash
# 周知识提取 — 每周自动采集分析患者诊疗信息
# 提取有价值实践知识补充KB
cd "$(dirname "$0")/.."
python3 << 'PYEOF'
# -*- coding: utf-8 -*-
import sqlite3, json, datetime

db = sqlite3.connect('server/database/yidao.db')
c = db.cursor()

# 1. 扫描本周有治疗结果的案例
week_ago = (datetime.datetime.now() - datetime.timedelta(days=7)).strftime('%Y-%m-%d')
c.execute("""
    SELECT id, patient_id, symptoms, constitution, diagnosis, prescription,
           treatment_outcome, outcome_notes, paipan_summary, master_comment
    FROM medical_cases 
    WHERE updated_at >= ? AND treatment_outcome IS NOT NULL AND treatment_outcome != ''
      AND knowledge_extracted = 0
""", (week_ago,))
cases = c.fetchall()
print(f'[周知识提取] 本周新案例: {len(cases)}条')

extracted = 0
for case in cases:
    case_id, patient_id, symptoms, constitution, diagnosis, prescription, outcome, notes, paipan, master = case
    
    # 提取实践知识
    extracts = []
    if diagnosis and prescription and outcome:
        # 中医实践：症状→辨证→处方→疗效
        extracts.append({
            'knowledge': f'【实践案例#{case_id}】症状:{symptoms} → 辨证:{diagnosis} → 处方:{prescription} → 疗效:{outcome}({notes or ""})',
            'module': 'tcm-clinical',
            'keywords': symptoms.split('，')[0] if symptoms else '',
            'trust_score': 0.85 if outcome in ['痊愈','好转'] else 0.75
        })
    
    if paipan and outcome:
        # 周易实践：排盘预测 vs 实际结果
        extracts.append({
            'knowledge': f'【周易验证#{case_id}】排盘:{paipan} → 实际结果:{outcome}({notes or ""})',
            'module': 'yijing-clinical',
            'keywords': '周易,实践,验证',
            'trust_score': 0.8
        })
    
    if master and outcome:
        # 大师实践：批八字 vs 实际结果
        extracts.append({
            'knowledge': f'【大师复盘#{case_id}】命理分析:{master[:100]} → 实际结果:{outcome}',
            'module': 'bazi-clinical',
            'keywords': '大师,复盘,验证',
            'trust_score': 0.82
        })
    
    # 写入实践提取表
    for ext in extracts:
        c.execute("""
            INSERT INTO practice_extract (case_id, source_type, extracted_knowledge, module, keywords, trust_score)
            VALUES (?, 'weekly_auto', ?, ?, ?, ?)
        """, (case_id, ext['knowledge'], ext['module'], ext['keywords'], ext['trust_score']))
        
        # 高价值知识直接写入KB（trust>=0.82）
        if ext['trust_score'] >= 0.82:
            entry_id = f'practice-{case_id}-{ext["module"]}'
            c.execute("""
                INSERT OR IGNORE INTO kb_formal 
                (entry_id, module, title, content, src_id, category, keywords, summary, trust_score, status, hit_count, created_at, updated_at)
                VALUES (?, ?, ?, ?, 'SRC-PRACTICE-WEEKLY', 'clinical', ?, ?, ?, 'formal', 0, datetime('now'), datetime('now'))
            """, (entry_id, ext['module'], f'实践案例#{case_id}', ext['knowledge'], ext['keywords'], ext['trust_score']))
            print(f'  ✅ KB写入: {entry_id} ({ext["module"]})')
    
    # 标记已提取
    c.execute('UPDATE medical_cases SET knowledge_extracted = 1 WHERE id = ?', (case_id,))
    extracted += len(extracts)

db.commit()

# 统计
c.execute('SELECT COUNT(*) FROM practice_extract WHERE created_at >= ?', (week_ago,))
week_total = c.fetchone()[0]
c.execute('SELECT COUNT(*) FROM practice_extract')
all_total = c.fetchone()[0]
c.execute("SELECT COUNT(*) FROM kb_formal WHERE status='formal' AND src_id='SRC-PRACTICE-WEEKLY'")
kb_total = c.fetchone()[0]

print(f'\n[周知识提取] 完成:')
print(f'  本周提取: {extracted}条')
print(f'  本周写入KB: {kb_total}条')
print(f'  实践知识总库: {all_total}条')

db.close()
PYEOF
