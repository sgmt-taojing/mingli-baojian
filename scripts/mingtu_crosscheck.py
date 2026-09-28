#!/usr/bin/env python3
# mingtu_crosscheck.py — 康节本卷四命图 JSONL 古制交叉校验
# 校验项：1) 五行局（年干+农历月+时辰→命宫干支纳音）2) 阴阳男女与年干阴阳一致性
# 用法：python3 scripts/mingtu_crosscheck.py  → 输出 training/mingtu/engine_check_report.json
import json, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
JSONL = ROOT / 'training/mingtu/mingtu.jsonl'
OUT = ROOT / 'training/mingtu/engine_check_report.json'

GAN = '甲乙丙丁戊己庚辛壬癸'
ZHI = '子丑寅卯辰巳午未申酉戌亥'
YANG_GAN = set('甲丙戊庚壬')

# 六十甲子纳音五行
NAYIN = {
 '甲子':'金','乙丑':'金','丙寅':'火','丁卯':'火','戊辰':'木','己巳':'木','庚午':'土','辛未':'土','壬申':'金','癸酉':'金',
 '甲戌':'火','乙亥':'火','丙子':'水','丁丑':'水','戊寅':'土','己卯':'土','庚辰':'金','辛巳':'金','壬午':'木','癸未':'木',
 '甲申':'水','乙酉':'水','丙戌':'土','丁亥':'土','戊子':'火','己丑':'火','庚寅':'木','辛卯':'木','壬辰':'水','癸巳':'水',
 '甲午':'金','乙未':'金','丙申':'火','丁酉':'火','戊戌':'木','己亥':'木','庚子':'土','辛丑':'土','壬寅':'金','癸卯':'金',
 '甲辰':'火','乙巳':'火','丙午':'水','丁未':'水','戊申':'土','己酉':'土','庚戌':'金','辛亥':'金','壬子':'木','癸丑':'木',
 '甲寅':'水','乙卯':'水','丙辰':'土','丁巳':'土','戊午':'火','己未':'火','庚申':'木','辛酉':'木','壬戌':'水','癸亥':'水',
}
JU_OF_WUXING = {'金':'金四局','木':'木三局','水':'水二局','火':'火六局','土':'土五局'}
# 五虎遁：年干→寅月天干
YIN_GAN = {'甲':'丙','己':'丙','乙':'戊','庚':'戊','丙':'庚','辛':'庚','丁':'壬','壬':'壬','戊':'甲','癸':'甲'}
HOUR_IDX = {'子':0,'丑':1,'寅':2,'卯':3,'辰':4,'巳':5,'午':6,'未':7,'申':8,'酉':9,'戌':10,'亥':11}

def minggong_zhi(month, hour):
    """寅起正月顺至生月，自该宫起子时逆数至生时"""
    month_palace = (2 + month - 1) % 12          # 寅=2
    return (month_palace - HOUR_IDX[hour]) % 12

def calc_mingju(gz_year, month, hour):
    yg = gz_year[0]
    mg_z = minggong_zhi(month, hour)
    yin_g = YIN_GAN[yg]
    # 命宫天干：自寅宫天干顺数
    offset = (mg_z - 2) % 12
    mg_g = GAN[(GAN.index(yin_g) + offset) % 10]
    gz = mg_g + ZHI[mg_z]
    return JU_OF_WUXING[NAYIN[gz]], gz

def main():
    total = mism_ju = mism_yy = errors = 0
    details = []
    for line in JSONL.read_text(encoding='utf-8').splitlines():
        line = line.strip()
        if not line:
            continue
        r = json.loads(line)
        if r.get('_schema'):
            continue
        total += 1
        rid = r['id']
        b = r.get('birth', {})
        note = []
        # 1) 五行局
        try:
            ju, gz = calc_mingju(b['gz_year'], b['lunar_month'], b['hour'])
            if ju != r['mingju']:
                mism_ju += 1
                note.append(f"mingju: 原书={r['mingju']} 复盘={ju}（命宫干支 {gz}）")
        except Exception as e:
            errors += 1
            note.append(f"mingju 复盘失败: {e}")
        # 2) 阴阳男女
        yy = '陽' if b['gz_year'][0] in YANG_GAN else '陰'
        if not r['gender_yinyang'].startswith(yy):
            mism_yy += 1
            note.append(f"yinyang: 原书={r['gender_yinyang']} 年干推={yy}")
        if note:
            details.append({'id': rid, 'title': r['title'], 'page': r['page'], 'notes': note})
    report = {
        'source': str(JSONL.name), 'total': total,
        'mingju_mismatch': mism_ju, 'yinyang_mismatch': mism_yy, 'calc_errors': errors,
        'match_rate': round((total - mism_ju - mism_yy) / total, 4) if total else 0,
        'mismatches': details,
    }
    OUT.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f"total={total} mingju_mismatch={mism_ju} yinyang_mismatch={mism_yy} errors={errors}")
    for d in details:
        print(' -', d['id'], d['title'], '|', '; '.join(d['notes']))

if __name__ == '__main__':
    main()
