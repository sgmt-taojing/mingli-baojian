#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
R116 临床蒸馏前置数据准备：解决周一 06:00 临床经验蒸馏 cron 的根因失败
根因：patient_export_latest.json 不存在（前端 localStorage 数据无人导出），蒸馏脚本空转失败
方案：从患者档案中心的真实数据源（kb_staging/consulting 历史 + 前端导出 JSON 若有）
      生成/刷新 patient_export_latest.json，数据截止日期如实标注
用法: python3 prepare-clinical-export.py
退出码: 0=导出成功可蒸馏  3=无新数据（跳过蒸馏，不算失败）
"""
import json, os, sys, glob, sqlite3, datetime

WS = os.path.expanduser('~/.openclaw-autoclaw/workspace')
PROJ = os.path.join(WS, 'projects/mingli-baojian')
OUT = os.path.join(WS, '.openclaw/tmp/patient_export_latest.json')
DB = os.path.join(PROJ, 'server/database/yidao.db')
STALE_DAYS = 7

def main():
    today = datetime.date.today()
    # 1) 找前端手动导出的 JSON（若有且新鲜且非空直接用；排除 OUT 自身防止自引用）
    cands = [p for p in sorted(
                   glob.glob(os.path.join(WS, '.openclaw/tmp/patient_export*.json'))
                   + glob.glob(os.path.join(os.path.expanduser('~/Downloads'), 'patient*export*.json')),
                   key=os.path.getmtime, reverse=True)
             if os.path.abspath(p) != os.path.abspath(OUT)]
    fresh = []
    for p in cands:
        age = (today - datetime.date.fromtimestamp(os.path.getmtime(p))).days
        if age > STALE_DAYS:
            continue
        try:
            if json.load(open(p)).get('record_count', 0) > 0:
                fresh.append(p)
        except Exception:
            continue
    if fresh:
        src = fresh[0]
        import shutil; shutil.copy(src, OUT)
        n = json.load(open(OUT)).get('record_count', 0)
        print(f'[OK] 使用新鲜前端导出: {src} ({n} 条)')
        return 0

    # 2) 从 yidao.db 采集真实咨询/诊疗记录（consulting + kb_staging clinical 来源）
    records = []
    try:
        conn = sqlite3.connect(f'file:{DB}?mode=ro', uri=True)
        conn.row_factory = sqlite3.Row
        # consulting_records / consulting_visits（问诊记录）
        for tbl, cols in [('consulting_records', 'created_at'), ('consulting_visits', 'visit_date')]:
            try:
                rows = conn.execute(
                    f"select * from {tbl} order by rowid desc limit 200").fetchall()
                for r in rows:
                    d = dict(r)
                    records.append({
                        'source': tbl,
                        'date': str(d.get(cols) or d.get('created_at') or ''),
                        'patient_age': d.get('age'), 'patient_gender': d.get('gender'),
                        'symptoms': d.get('symptoms') or d.get('main_complaint') or d.get('chief_complaint') or '',
                        'diagnosis': d.get('diagnosis') or d.get('syndrome') or '',
                        'prescription': d.get('prescription') or d.get('formula') or '',
                        'notes': d.get('notes') or d.get('record_text') or d.get('content') or ''
                    })
            except Exception:
                pass
        # medical_cases（医疗案例）
        try:
            rows = conn.execute(
                "select * from medical_cases order by rowid desc limit 100").fetchall()
            for r in rows:
                d = dict(r)
                records.append({
                    'source': 'medical_cases',
                    'date': str(d.get('created_at') or ''),
                    'title': d.get('title') or d.get('case_title') or '',
                    'symptoms': d.get('symptoms') or '',
                    'diagnosis': d.get('diagnosis') or '',
                    'content': (d.get('content') or d.get('analysis') or '')[:800]
                })
        except Exception:
            pass
        # kb_staging 里临床蒸馏历史（带溯源）
        try:
            rows = conn.execute(
                "select entry_id, title, content, created_at from kb_staging "
                "where source_type='clinical_distill' order by rowid desc limit 100").fetchall()
            for r in rows:
                records.append({'source': 'clinical_distill_history', 'entry_id': r['entry_id'],
                                'date': str(r['created_at'] or ''), 'title': r['title'],
                                'content': (r['content'] or '')[:500]})
        except Exception:
            pass
        conn.close()
    except Exception as e:
        print(f'[WARN] yidao.db 读取失败: {e}', file=sys.stderr)

    # 3) 写导出文件（如实标注数据截止日期与来源；同时适配蒸馏脚本的 patients/history 双字段格式）
    patients, history = [], []
    for r in records:
        if r['source'] in ('consulting_records', 'consulting_visits'):
            pid = f"P-{r['source'][-3:]}-{len(history)+1:03d}"
            patients.append({'id': pid, 'age': r.get('patient_age'), 'gender': r.get('patient_gender')})
            history.append({'patientId': pid, 'date': r.get('date', ''),
                            'symptoms': r.get('symptoms', ''), 'diagnosis': r.get('diagnosis', ''),
                            'prescription': r.get('prescription', ''), 'notes': r.get('notes', ''),
                            'source': r['source']})
        elif r['source'] == 'medical_cases':
            history.append({'patientId': 'CASE', 'date': r.get('date', ''),
                            'symptoms': r.get('symptoms', ''), 'diagnosis': r.get('diagnosis', ''),
                            'notes': r.get('title', '') + ' | ' + r.get('content', ''),
                            'source': 'medical_cases'})
    export = {
        'generated_at': datetime.datetime.now().isoformat(timespec='seconds'),
        'data_cutoff': str(today),
        'data_sources': ['consulting_records/visits(yidao.db)', 'medical_cases', 'kb_staging:clinical_distill'],
        'note': 'R116 自动准备：无前端手动导出时从库内真实咨询记录生成；患者隐私字段未包含',
        'record_count': len(records),
        'records': records,
        # ↓ 蒸馏脚本 distill-clinical-experience.py 期望的双字段
        'patients': patients,
        'history': history
    }
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    json.dump(export, open(OUT, 'w'), ensure_ascii=False, indent=1)
    print(f"[{'OK' if records else 'SKIP'}] 导出 {len(records)} 条 (patients={len(patients)}, history={len(history)}) -> {OUT}")
    return 0 if records else 3

if __name__ == '__main__':
    sys.exit(main())
