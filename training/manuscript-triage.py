#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""手稿预审分级（S3.4 · 2026-10-14）
对待审手稿（promoted_from='manuscript-staging', audit_status='pending'）做机器预审：
  suggest_approve / needs_human / suggest_reject
红线：不写库、不改 audit_status——审核权在命理师，本脚本只出「建议」。
产物：
  reports/manuscript-triage-20261014.md   人类可读台账
  app/data/manuscript-triage.json         面板侧车（只存非默认建议，面板默认其余为建议通过）
"""
import sqlite3, re, json, sys
from collections import Counter, defaultdict

DB = 'server/database/yidao.db'
DAY = '20261014'

# 强营销信号：联系/交易/课程变现类才算；「代理商/加盟星」属命理正文不误伤
STRONG_MKT = re.compile(r'加微信|微信号|威信|扫码|课程费|学费|优惠价|报名|QQ群|客服微信|公众号|购买链接|https?://|咨询电话|诚招代理|招代理')
OCR_BAD = re.compile(r'[□■▯◆◇]')
def punct_ratio(s):
    if not s: return 1.0
    bad = sum(1 for ch in s if not ('一' <= ch <= '鿿') and not ch.isalnum())
    return bad / len(s)

def triage(cat, title, content):
    c = content or ''
    reasons = []
    mkt = sorted(set(STRONG_MKT.findall(c)))
    if mkt: reasons.append('强营销词:' + '/'.join(mkt[:3]))
    bad = len(OCR_BAD.findall(c))
    if bad > 5: reasons.append('OCR乱码x%d' % bad)
    if len(c) < 400: reasons.append('碎片(%d字)' % len(c))
    pr = punct_ratio(c)
    if pr > 0.45: reasons.append('标符号占比%.0f%%(疑OCR表格残骸)' % (pr*100))
    if '针法' in (cat or '') or '岐轩' in (cat or ''): reasons.append('医疗域混入待甄(针法类)')
    if not reasons: return 'suggest_approve', ''
    if mkt or bad > 20 or pr > 0.75: return 'suggest_reject', ';'.join(reasons)
    return 'needs_human', ';'.join(reasons)

def main():
    con = sqlite3.connect('file:%s?mode=ro' % DB, uri=True)
    rows = con.execute("SELECT entry_id, module, category, title, content FROM kb_formal WHERE promoted_from='manuscript-staging' AND audit_status='pending'").fetchall()
    con.close()
    verdicts = Counter(); by_cat = defaultdict(Counter); sidecar = {'reject': {}, 'human': {}}
    lines = []
    for eid, mod, cat, title, c in rows:
        v, why = triage(cat, title, c)
        verdicts[v] += 1; by_cat[cat][v] += 1
        if v == 'suggest_reject': sidecar['reject'][eid] = why
        elif v == 'needs_human': sidecar['human'][eid] = why
        if v != 'suggest_approve':
            lines.append('| %s | %s | %s | %s |' % (v, (cat or '')[:24], (title or '')[:40], why))
    md = ['# 手稿预审分级台账 · 2026-10-14', '',
          '机器预审建议（不写库，审核权在命理师）：规则=强营销词/OCR乱码/碎片/标点占比/医疗域混入。', '',
          '## 总览', '',
          '| 建议 | 条数 |', '|---|---|',
          '| ✅ 建议通过 | %d |' % verdicts['suggest_approve'],
          '| 👁 需人工细甄 | %d |' % verdicts['needs_human'],
          '| ❌ 建议拒绝 | %d |' % verdicts['suggest_reject'], '',
          '## 分门类', '', '| 门类 | 通过 | 细甄 | 拒绝 |', '|---|---|---|---|']
    for cat, cc in sorted(by_cat.items(), key=lambda kv: -sum(kv[1].values())):
        md.append('| %s | %d | %d | %d |' % ((cat or '')[:30], cc['suggest_approve'], cc['needs_human'], cc['suggest_reject']))
    md += ['', '## 非默认建议明细', '', '| 建议 | 门类 | 标题 | 触发原因 |', '|---|---|---|---|'] + lines
    open('reports/manuscript-triage-%s.md' % DAY, 'w', encoding='utf-8').write('\n'.join(md))
    json.dump(sidecar, open('app/data/manuscript-triage.json', 'w', encoding='utf-8'), ensure_ascii=False)
    print(json.dumps({'total': len(rows), **verdicts}, ensure_ascii=False))

if __name__ == '__main__':
    main()
