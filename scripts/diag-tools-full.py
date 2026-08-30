#!/usr/bin/env python3
"""命理宝鉴 · 排盘/民俗工具及报告全面诊断（功能×知识×报告×入口）
产出结构化诊断数据，供整改清单使用。"""
import json, urllib.request, urllib.error, time, sys

API = 'http://127.0.0.1:8920'
PP = 'http://127.0.0.1:8911'
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126.0 Safari/537.36'

def call(method, url, body=None, timeout=40):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data,
        headers={'Content-Type': 'application/json', 'X-Skip-Interceptor': '1', 'User-Agent': UA}, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        try: return e.code, json.loads(e.read())
        except Exception: return e.code, {'httpError': e.code}
    except Exception as e:
        return -1, {'exception': str(e)[:150]}

R = {'functional': [], 'knowledge': [], 'reports': [], 'issues': []}
def issue(sev, where, what): R['issues'].append({'sev': sev, 'where': where, 'what': what})

# ═══ 1. 历法内核准确性（独立参照值比对 8911 排盘内核）═══
# 参照：1949-10-01 甲子日（开国大典，文献公认）；2000-01-01 戊午日（万年历）；1990-05-12 庚午年辛巳月丁丑日
REFS = [
  (1949,10,1,12, {'年':'己丑','月':'癸酉','日':'甲子'}),
  (2000,1,1,12,  {'年':'己卯','月':'丙子','日':'戊午'}),
  (1990,5,12,14, {'年':'庚午','月':'辛巳','日':'丁丑','时':'丁未'}),
  (2008,8,8,20,  {'年':'戊子','月':'庚申','日':'庚辰'}),
]
for y,m,d,h,want in REFS:
    sc, c = call('POST', PP + '/paipan', {'module':'bazi','year':y,'month':m,'day':d,'hour':h,'gender':'M'})
    got = c.get('pillars') or {}
    bad = {k: f'{want[k]}→{got.get(k)}' for k in want if got.get(k) != want[k]}
    wc = c.get('wuxing_count') or {}
    wxSum = sum(wc.values()) if wc else -1
    status = 'PASS' if not bad and wxSum == 8 else 'FAIL'
    R['knowledge'].append({'item': f'四柱 {y}-{m}-{d} {h}时', 'status': status,
        'detail': ('柱 mismatch: '+json.dumps(bad,ensure_ascii=False)) if bad else f'四柱全对，五行计数和={wxSum}'})
    if bad: issue('P0', '排盘内核', f'{y}-{m}-{d} 四柱与权威参照不符: {bad}')
    if wxSum != 8: issue('P1', '排盘内核', f'{y}-{m}-{d} 五行计数和={wxSum}（应=8）')
    time.sleep(1)

# 生肖/纳音抽查
SX = {1984:'鼠',1990:'马',1997:'牛',2008:'鼠',2026:'马'}
NAYIN = {'甲子':'海中金','庚午':'路旁土','壬申':'剑锋金','戊子':'霹雳火','丙午':'天河水'}
for y, sx in SX.items():
    sc, c = call('POST', PP + '/paipan', {'module':'bazi','year':y,'month':6,'day':15,'hour':12,'gender':'M'})
    got = (c.get('shengxiao') or c.get('zodiac') or '')
    ny = (c.get('nayin') or {}).get('年') or ''
    ok = (not got or got == sx)
    R['knowledge'].append({'item': f'生肖 {y}', 'status': 'PASS' if ok else 'FAIL', 'detail': f'应{sx} 得{got or "(未返回)"}'})
    if not ok: issue('P1', '排盘内核', f'{y} 生肖错误: {got}≠{sx}')
    time.sleep(1)

# ═══ 2. 民俗端点功能矩阵（正常参数 + 异常参数）═══
MINSU = [
  ('GET', '/api/minsu/huangli?year=2026&month=8&day=30', None, '黄历'),
  ('GET', '/api/minsu/zeri?year=2026&month=9&day=15&matter=结婚', None, '择日'),
  ('GET', '/api/minsu/taisui?year=2026', None, '太岁'),
  ('GET', '/api/minsu/jieqi?year=2026&month=8', None, '节气'),
  ('GET', '/api/minsu/holidays?year=2026', None, '假日'),
  ('GET', '/api/minsu/liunian?year=2026&birthYear=1990', None, '流年'),
  ('GET', '/api/minsu/lucky?birthYear=1990', None, '幸运数色'),
  ('GET', '/api/minsu/mobile?number=13866668888', None, '手机号'),
  ('GET', '/api/minsu/xingming?name=%E5%BC%A0%E4%BC%9F', None, '姓名'),
  ('GET', '/api/minsu/plate?number=%E7%B2%A4A6688', None, '车牌'),
  ('GET', '/api/minsu/hehun?maleYear=1990&femaleYear=1992', None, '合婚v1'),
  ('POST', '/api/minsu/hehun/v2', {'male':[1990,5,12,14],'female':[1992,9,3,10]}, '合婚v2'),
  ('POST', '/api/minsu/family', {'members':[{'name':'父','year':1960},{'name':'母','year':1963}]}, '家庭排盘'),
]
for method, path, body, name in MINSU:
    sc, d = call(method, API + path, body)
    d2 = d.get('data', d)
    ok = d2.get('ok', d.get('code') == 0)
    bh = bool(d2.get('baihua'))
    R['functional'].append({'tool': name, 'http': sc, 'ok': bool(ok), 'baihua': bh})
    if not ok: issue('P1', '民俗工具', f'{name} 正常参数调用失败 http={sc}: {str(d)[:120]}')
    time.sleep(6)

# 异常参数容错
BAD = [
  ('GET', '/api/minsu/mobile?number=abc', '手机号非数字'),
  ('GET', '/api/minsu/hehun?maleYear=abcd&femaleYear=1992', '合婚非法年份'),
  ('GET', '/api/minsu/xingming?name=', '姓名空值'),
]
for method, path, name in BAD:
    sc, d = call(method, API + path)
    graceful = sc in (200, 400) and ('error' in json.dumps(d) or 'message' in json.dumps(d) or 'hint' in json.dumps(d))
    R['functional'].append({'tool': '容错·'+name, 'http': sc, 'ok': graceful, 'baihua': None})
    if not graceful: issue('P2', '容错', f'{name}: http={sc} 响应={str(d)[:100]}')
    time.sleep(6)

# ═══ 3. 报告审计（结构/深度/白话/行动建议/占位符扫描）═══
B = {"year":1990,"month":5,"day":12,"hour":14,"gender":"M"}
REPORTS = [
  ('bazi', dict(B)), ('ziwei', dict(B, sex='M')),
  ('qimen', dict(B, query='今年事业如何', scenario='事业')),
  ('liuyao', dict(B, query='今年事业如何')), ('liuren', dict(B, query='今年事业如何')),
  ('meihua', dict(B, query='今年事业如何')),
  ('fengshui', dict(B, houseType='住宅', sittingMountain='子', facingMountain='午')),
  ('hehun', {'member1':B,'member2':dict(B,year=1992,month=9,day=3,gender='F')}),
  ('family', {'members':[{'name':'父','year':1960,'month':3,'day':8},{'name':'母','year':1963,'month':7,'day':22}]}),
  ('lifeplan', dict(B)),
]
for m, body in REPORTS:
    sc, d = call('POST', API + f'/api/paipan/{m}/report', body, timeout=60)
    d2 = d.get('data', d)
    segs = d2.get('segments') or []
    blob = json.dumps(d2, ensure_ascii=False)
    dirty = [w for w in ['undefined','NaN','[object','null，','None'] if w in blob]
    has_plain = '白话' in blob or '总览' in blob
    has_action = '建议' in blob or '行动' in blob or '化解' in blob
    has_disc = '免责' in blob or '参考' in blob
    clen = sum(len(str(s.get('content') or '')) for s in segs)
    R['reports'].append({'module': m, 'http': sc, 'ok': bool(d2.get('ok')), 'segments': len(segs),
        'content_len': clen, 'plain': has_plain, 'action': has_action, 'disclaimer': has_disc,
        'dirty_words': dirty})
    if not d2.get('ok'): issue('P0', '报告', f'{m} 报告生成失败: {str(d.get("message"))[:80]}')
    if dirty: issue('P1', '报告', f'{m} 报告含脏词: {dirty}')
    if not has_action: issue('P2', '报告', f'{m} 报告缺行动建议')
    if not has_disc: issue('P2', '报告', f'{m} 报告缺免责/参考声明')
    time.sleep(6)

print(json.dumps(R, ensure_ascii=False, indent=1))
