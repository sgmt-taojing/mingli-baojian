#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
celebrity-ingest.py — 名人八字校正库每日采集·确定性环节脚本化（2026-09-06）

定位：cron agent 只负责「搜索筛选 + 写 candidates.json」，本脚本承接全部确定性环节：
  1. 结构校验（name/source/birth.year 必填，缺则跳过并说明）
  2. 重名查重（扫库内全部 json，同名跳过）
  3. 本地排盘（8911 /paipan，生辰缺时辰按 12:00 近似并标注）
  4. 反向校验上下文预计算：逐事件年 → 年龄/所在大运干支十神/流年干支十神（vs 日主），
     命中判定留给 agent/命理师（脚本不给断语，只给盘面事实）
  5. 合并写入 staging-batch-YYYYMMDD.json（按 person_id 去重）+ <slug>-paipan.json
  6. 输出 JSON 汇报 + 中文摘要行

用法：python3 scripts/celebrity-ingest.py <candidates.json> [--dry-run]
candidates.json 结构：[{person_id, slug?, name, source, source_url?, gender?,
  birth:{year,month?,day?,hour?,place?,approximate?}, facts:{...}}]
"""

import json
import sys
import urllib.request
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CORPUS = ROOT / 'training' / 'celebrity-corpus'
PAIPAN_API = 'http://127.0.0.1:8911/paipan'

GANS = '甲乙丙丁戊己庚辛壬癸'
ZHIS = '子丑寅卯辰巳午未申酉戌亥'
ELEM = {'木': '甲乙', '火': '丙丁', '土': '戊己', '金': '庚辛', '水': '壬癸'}
GAN_ELEM = {g: e for e, gs in ELEM.items() for g in gs}
SHENG = {'木': '火', '火': '土', '土': '金', '金': '水', '水': '木'}   # 我生
KE = {'木': '土', '土': '水', '水': '火', '火': '金', '金': '木'}       # 我克
SHENG_ME = {v: k for k, v in SHENG.items()}                            # 生我
KE_ME = {v: k for k, v in KE.items()}                                  # 克我


def year_ganzhi(y):
    return GANS[(y - 4) % 10] + ZHIS[(y - 4) % 12]


def ten_god(day_gan, other_gan):
    """other_gan 相对 day_gan 的十神。"""
    if not day_gan or not other_gan or day_gan not in GAN_ELEM or other_gan not in GAN_ELEM:
        return ''
    de, oe = GAN_ELEM[day_gan], GAN_ELEM[other_gan]
    same_polarity = (GANS.index(day_gan) % 2) == (GANS.index(other_gan) % 2)
    if oe == de:
        return '比肩' if same_polarity else '劫财'
    if SHENG[de] == oe:      # 我生者为食伤
        return '食神' if same_polarity else '伤官'
    if KE[de] == oe:         # 我克者为财
        return '偏财' if same_polarity else '正财'
    if KE_ME[de] == oe:      # 克我者为官杀
        return '七杀' if same_polarity else '正官'
    if SHENG_ME[de] == oe:   # 生我者为印
        return '偏印' if same_polarity else '正印'
    return ''


def iter_events(facts):
    """展开 facts 里的全部事件：(category, year, event_text)。"""
    if not isinstance(facts, dict):
        return
    for cat, items in facts.items():
        if not isinstance(items, list):
            continue
        for it in items:
            if isinstance(it, dict) and isinstance(it.get('year'), int):
                yield cat, it['year'], str(it.get('event', ''))[:60]


def existing_names():
    names = set()
    for f in CORPUS.glob('*.json'):
        try:
            d = json.loads(f.read_text(encoding='utf-8'))
            items = d if isinstance(d, list) else [d]
            for it in items:
                if isinstance(it, dict) and it.get('name'):
                    names.add(it['name'])
        except Exception:
            pass
    return names


def paipan(birth, gender):
    payload = {
        'year': birth['year'], 'month': birth.get('month') or 6,
        'day': birth.get('day') or 15,
        'hour': birth.get('hour') if birth.get('hour') is not None else 12,
        'gender': gender or '男',
    }
    req = urllib.request.Request(
        PAIPAN_API, data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'}, method='POST')
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read().decode('utf-8')), payload


def reverse_context(pp, birth_year, facts):
    """逐事件年预排盘面事实：年龄/大运/流年干支+十神。"""
    day_gan = (pp.get('day_master') or '')[:1]
    dayuns = pp.get('dayun') or []
    out = []
    for cat, year, text in iter_events(facts):
        age = year - birth_year
        dy = next((d for d in dayuns
                   if isinstance(d.get('start_age'), int) and isinstance(d.get('end_age'), int)
                   and d['start_age'] <= age <= d['end_age']), None)
        ln_gz = year_ganzhi(year)
        out.append({
            'category': cat, 'year': year, 'age': age, 'event': text,
            'liunian': ln_gz, 'liunian_gan_shen': ten_god(day_gan, ln_gz[0]),
            'dayun': (dy or {}).get('ganzhi') or '幼运',
            'dayun_gan_shen': (dy or {}).get('gan_shen', ''),
            'verdict': None,  # 命中判定留给 agent/命理师
        })
    return out


def main():
    if len(sys.argv) < 2:
        print('用法: python3 scripts/celebrity-ingest.py <candidates.json> [--dry-run]')
        return 2
    dry = '--dry-run' in sys.argv
    cands = json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
    if isinstance(cands, dict):
        cands = [cands]

    names = existing_names()
    today = datetime.now().strftime('%Y%m%d')
    batch_path = CORPUS / f'staging-batch-{today}.json'
    batch = []
    if batch_path.exists():
        try:
            batch = json.loads(batch_path.read_text(encoding='utf-8'))
        except Exception:
            batch = []
    batch_ids = {c.get('person_id') for c in batch if isinstance(c, dict)}

    report = {'ts': datetime.now().isoformat(timespec='seconds'), 'dry_run': dry,
              'ingested': [], 'skipped': [], 'reverse_checks': {}}

    for c in cands:
        name, src = c.get('name'), c.get('source')
        birth = c.get('birth') or {}
        pid = c.get('person_id') or f"person_{birth.get('year', 'x')}"
        if not name or not src or not isinstance(birth.get('year'), int):
            report['skipped'].append({'name': name or '?', 'reason': '缺 name/source/birth.year'})
            continue
        if name in names:
            report['skipped'].append({'name': name, 'reason': '库内已存在同名样本'})
            continue
        if pid in batch_ids:
            report['skipped'].append({'name': name, 'reason': '今日批次已含此 person_id'})
            continue

        entry = dict(c)
        entry.setdefault('person_id', pid)
        entry['verified'] = False
        has_ymd = all(birth.get(k) for k in ('year', 'month', 'day'))
        if has_ymd:
            try:
                pp, used = paipan(birth, c.get('gender'))
                if birth.get('hour') is None:
                    pp.setdefault('input', {})['hour_note'] = '时辰未知，按 12:00 近似'
                slug = c.get('slug') or pid
                if not dry:
                    (CORPUS / f'{slug}-paipan.json').write_text(
                        json.dumps(pp, ensure_ascii=False, indent=1), encoding='utf-8')
                entry['paipan'] = f'{slug}-paipan.json'
                report['reverse_checks'][name] = reverse_context(pp, birth['year'], c.get('facts'))
            except Exception as e:
                entry['paipan'] = {}
                report['skipped'].append({'name': name, 'reason': f'排盘失败: {str(e)[:80]}（已入库待补盘）'})
        else:
            entry['paipan'] = {}
            report['skipped'].append({'name': name, 'reason': '生辰不全（仅年），未排盘'})

        batch.append(entry)
        batch_ids.add(pid)
        report['ingested'].append(name)

    if not dry:
        batch_path.write_text(json.dumps(batch, ensure_ascii=False, indent=1), encoding='utf-8')

    # 中文摘要（cron 汇报直接用）
    n_rc = sum(len(v) for v in report['reverse_checks'].values())
    print(f"[celebrity-ingest] 入库 {len(report['ingested'])} 人（{','.join(report['ingested']) or '无'}）"
          f"｜跳过 {len(report['skipped'])}｜反校上下文 {n_rc} 条"
          f"｜批次 staging-batch-{today}.json{'（DRY-RUN 未写入）' if dry else ''}")
    for s in report['skipped']:
        print(f"  · 跳过 {s['name']}: {s['reason']}")
    print(json.dumps(report, ensure_ascii=False))
    return 0


if __name__ == '__main__':
    sys.exit(main())
