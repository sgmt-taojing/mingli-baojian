#!/usr/bin/env python3
"""R16 智镜 28 舌象续补 — 走正确的 kb_formal schema (entry_id 主键)"""
import sqlite3, json, os
DB = '/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/server/database/yidao.db'

TONGUES = [
    # 1-7：淡白舌系（虚寒）
    {'id':1, 'color':'淡白','shape':'胖嫩','coat':'白','coat_q':'薄润','sublingual':'细短','diagnosis':'气血两虚','treat':'补气养血','acup':'足三里/气海/关元','medic':'八珍颗粒/归脾丸','food':'红枣/桂圆/阿胶','advice':'路总：忌寒凉，多温补'},
    {'id':2, 'color':'淡白','shape':'瘦薄','coat':'白','coat_q':'少苔','sublingual':'细短','diagnosis':'血虚','treat':'养血滋阴','acup':'血海/三阴交','medic':'四物颗粒/当归补血丸','food':'猪肝/菠菜/黑芝麻','advice':'路总：补血先健脾'},
    {'id':3, 'color':'淡白','shape':'胖嫩有齿痕','coat':'白','coat_q':'滑润','sublingual':'细短','diagnosis':'脾虚湿盛','treat':'健脾化湿','acup':'阴陵泉/丰隆/脾俞','medic':'参苓白术散/六君子丸','food':'薏米/茯苓/山药','advice':'路总：湿重先健脾'},
    {'id':4, 'color':'淡白','shape':'老嫩','coat':'白','coat_q':'厚腻','sublingual':'粗长','diagnosis':'阳虚水泛','treat':'温阳利水','acup':'命门/关元/复溜','medic':'真武汤/附子理中丸','food':'生姜/肉桂/羊肉','advice':'路总：温阳化气'},
    # 5-9：淡红舌系
    {'id':5, 'color':'淡红','shape':'正常','coat':'白','coat_q':'薄润','sublingual':'正常','diagnosis':'常舌/健康','treat':'无需','acup':'无','medic':'无','food':'均衡','advice':'路总：保持'},
    {'id':6, 'color':'淡红','shape':'胖嫩','coat':'白','coat_q':'厚腻','sublingual':'细短','diagnosis':'脾虚湿困','treat':'健脾燥湿','acup':'阴陵泉/足三里','medic':'平胃散/香砂六君子','food':'薏米/冬瓜/赤小豆','advice':'路总：化湿必健脾'},
    {'id':7, 'color':'淡红','shape':'有齿痕','coat':'白','coat_q':'薄','sublingual':'细短','diagnosis':'脾虚','treat':'健脾益气','acup':'脾俞/足三里/章门','medic':'六君子丸/补中益气丸','food':'山药/莲子/大枣','advice':'路总：日久伤气血'},
    # 8-14：红舌系
    {'id':8, 'color':'红','shape':'正常','coat':'黄','coat_q':'薄','sublingual':'正常','diagnosis':'实热初起','treat':'清热泻火','acup':'曲池/合谷/大椎','medic':'黄连上清丸/牛黄解毒','food':'苦瓜/绿豆/菊花','advice':'路总：清上焦热'},
    {'id':9, 'color':'红','shape':'芒刺','coat':'黄','coat_q':'厚','sublingual':'粗长','diagnosis':'实热炽盛','treat':'清热解毒','acup':'内庭/合谷/曲池','medic':'黄连解毒汤/清胃散','food':'黄连/金银花/莲子心','advice':'路总：必清热毒'},
    {'id':10, 'color':'红','shape':'裂纹','coat':'少苔','coat_q':'燥','sublingual':'细短','diagnosis':'阴虚内热','treat':'滋阴清热','acup':'太溪/照海/三阴交','medic':'知柏地黄丸/大补阴丸','food':'麦冬/石斛/玉竹','advice':'路总：滋阴降火'},
    {'id':11, 'color':'红','shape':'瘦薄','coat':'少苔','coat_q':'剥','sublingual':'细短','diagnosis':'胃阴虚','treat':'养胃阴','acup':'足三里/内庭','medic':'益胃汤/沙参麦冬','food':'石斛/麦冬/梨','advice':'路总：胃阴需滋养'},
    {'id':12, 'color':'红','shape':'正常','coat':'黄','coat_q':'腻','sublingual':'粗长','diagnosis':'湿热内蕴','treat':'清热利湿','acup':'阴陵泉/曲池/合谷','medic':'龙胆泻肝丸/茵陈蒿汤','food':'薏米/茵陈/赤小豆','advice':'路总：湿热分消'},
    {'id':13, 'color':'红','shape':'胖嫩','coat':'黄','coat_q':'厚腻','sublingual':'粗长','diagnosis':'湿热困脾','treat':'清热燥湿','acup':'阴陵泉/丰隆/曲池','medic':'三仁汤/藿香正气','food':'薏米/藿香/佩兰','advice':'路总：湿热分利'},
    {'id':14, 'color':'红','shape':'芒刺','coat':'灰','coat_q':'厚','sublingual':'迂曲','diagnosis':'热毒瘀结','treat':'清热解毒化瘀','acup':'曲池/血海/合谷','medic':'犀角地黄汤/清瘟败毒','food':'金银花/连翘/赤芍','advice':'路总：重症急治'},
    # 15-21：绛舌系
    {'id':15, 'color':'绛','shape':'正常','coat':'黄','coat_q':'燥','sublingual':'粗长','diagnosis':'热入营血','treat':'清营凉血','acup':'曲池/血海/膈俞','medic':'清营汤/犀角地黄汤','food':'生地/丹皮/赤芍','advice':'路总：热入营分'},
    {'id':16, 'color':'绛','shape':'裂纹','coat':'少苔','coat_q':'剥','sublingual':'细短','diagnosis':'阴虚火旺','treat':'滋阴降火','acup':'太溪/涌泉/三阴交','medic':'知柏地黄丸/杞菊地黄','food':'生地/枸杞/菊花','advice':'路总：虚火需滋阴'},
    {'id':17, 'color':'绛','shape':'芒刺','coat':'黄','coat_q':'厚','sublingual':'迂曲','diagnosis':'热毒瘀阻','treat':'清热化瘀','acup':'曲池/血海/合谷','medic':'清瘟败毒/血府逐瘀','food':'丹参/赤芍/金银花','advice':'路总：重症监护'},
    {'id':18, 'color':'绛','shape':'瘦薄','coat':'少苔','coat_q':'光剥','sublingual':'细短','diagnosis':'阴液枯竭','treat':'大补阴液','acup':'太溪/复溜/三阴交','medic':'大补阴丸/左归丸','food':'生地/麦冬/石斛','advice':'路总：阴液重养'},
    {'id':19, 'color':'绛','shape':'正常','coat':'灰','coat_q':'厚腻','sublingual':'粗长','diagnosis':'湿热瘀结','treat':'化湿清热祛瘀','acup':'阴陵泉/曲池/血海','medic':'茵陈蒿汤/桃红四物','food':'茵陈/桃仁/红花','advice':'路总：湿热瘀三联'},
    {'id':20, 'color':'绛','shape':'胖嫩','coat':'黄','coat_q':'厚腻','sublingual':'迂曲','diagnosis':'湿热瘀阻','treat':'清热利湿化瘀','acup':'阴陵泉/曲池/血海','medic':'四妙丸/血府逐瘀','food':'薏米/丹参/赤小豆','advice':'路总：重症缓图'},
    {'id':21, 'color':'绛','shape':'老嫩','coat':'黑','coat_q':'燥','sublingual':'迂曲','diagnosis':'热毒血瘀重症','treat':'凉血化瘀解毒','acup':'曲池/血海/十宣放血','medic':'犀角地黄汤/安宫牛黄','food':'生地/丹皮/紫草','advice':'路总：危症急处理'},
    # 22-25：紫舌系
    {'id':22, 'color':'紫','shape':'正常','coat':'白','coat_q':'薄','sublingual':'迂曲','diagnosis':'气滞血瘀','treat':'行气活血','acup':'太冲/血海/膈俞','medic':'血府逐瘀/桃红四物','food':'丹参/桃仁/红花','advice':'路总：气行血活'},
    {'id':23, 'color':'紫','shape':'胖嫩','coat':'白','coat_q':'厚腻','sublingual':'迂曲','diagnosis':'阳虚血瘀','treat':'温阳活血','acup':'命门/关元/血海','medic':'少腹逐瘀/温经汤','food':'肉桂/丹参/生姜','advice':'路总：温阳化瘀'},
    {'id':24, 'color':'紫','shape':'瘦薄','coat':'少苔','coat_q':'剥','sublingual':'瘀点','diagnosis':'阴虚血瘀','treat':'滋阴活血','acup':'太溪/血海/三阴交','medic':'通幽汤/桃红四物','food':'生地/丹参/麦冬','advice':'路总：滋阴化瘀'},
    {'id':25, 'color':'紫','shape':'有瘀斑','coat':'黄','coat_q':'腻','sublingual':'瘀点','diagnosis':'瘀热互结','treat':'化瘀清热','acup':'血海/曲池/合谷','medic':'桃红四物/犀角地黄','food':'丹参/赤芍/金银花','advice':'路总：化瘀清热'},
    # 26-27：青舌系
    {'id':26, 'color':'青','shape':'胖嫩','coat':'白','coat_q':'滑润','sublingual':'迂曲','diagnosis':'寒凝血瘀','treat':'温经散寒','acup':'命门/关元/阴陵泉','medic':'少腹逐瘀/温经汤','food':'肉桂/艾叶/红花','advice':'路总：寒重需温'},
    {'id':27, 'color':'青','shape':'正常','coat':'白','coat_q':'薄','sublingual':'迂曲','diagnosis':'气滞寒凝','treat':'行气散寒','acup':'太冲/足三里/气海','medic':'暖肝煎/天台乌药散','food':'肉桂/茴香/荔枝核','advice':'路总：温通气机'},
    # 28：蓝舌系
    {'id':28, 'color':'蓝','shape':'瘦薄','coat':'灰','coat_q':'光剥','sublingual':'瘀点','diagnosis':'气血衰败','treat':'大补气血','acup':'足三里/气海/关元','medic':'十全大补/人参养荣','food':'人参/黄芪/阿胶','advice':'路总：危重症扶正'}
]

def insert():
    conn = sqlite3.connect(DB)
    c = conn.cursor()
    before = c.execute("select count() from kb_formal where module='tcm-diagnosis' and entry_id like 'r16-28tongues-%'").fetchone()[0]
    print(f'插入前 r16-28tongues 条数: {before}')
    inserted = 0
    src_id = 'SRC-LD-DIA'
    for t in TONGUES:
        eid = f'r16-28tongues-{t["id"]:03d}'
        title = f"舌诊·{t['color']}舌·{t['shape']}·{t['coat']}苔·{t['coat_q']}·{t['diagnosis']}"
        content = (
            f"【舌象】{t['color']}舌 · {t['shape']} · {t['coat']}苔（{t['coat_q']}） · 舌下络脉{t['sublingual']}\n"
            f"【主病】{t['diagnosis']}\n"
            f"【治法】{t['treat']}\n"
            f"【选穴】{t['acup']}\n"
            f"【中成药】{t['medic']}\n"
            f"【食疗】{t['food']}\n"
            f"【路总建议】{t['advice']}"
        )
        kws = json.dumps([t['color'], t['shape'], t['coat'], t['coat_q'], t['sublingual'], t['diagnosis'], '舌诊', '28舌象', '智镜', 'R16'], ensure_ascii=False)
        sql = "INSERT OR IGNORE INTO kb_formal (entry_id, module, title, src_id, content, keywords, trust_score, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
        try:
            c.execute(sql, (eid, 'tcm-diagnosis', title, src_id, content, kws, 0.7, '舌诊·28舌象'))
            if c.rowcount > 0:
                inserted += 1
        except Exception as e:
            print(f'  ✖ {eid}: {e}')
    conn.commit()
    after = c.execute("select count() from kb_formal where module='tcm-diagnosis' and entry_id like 'r16-28tongues-%'").fetchone()[0]
    print(f'插入后 r16-28tongues 条数: {after} (新增 {after-before})')
    print(f'INSERT rowcount 累计: {inserted} (sqlite3 rowcount 不可信，SELECT COUNT 为准)')
    total = c.execute("select count() from kb_formal where module='tcm-diagnosis'").fetchone()[0]
    print(f'tcm-diagnosis 模块总条数: {total}')
    
    # 全 KB 总览
    grand = c.execute("select count() from kb_formal").fetchone()[0]
    print(f'KB 全部总条数: {grand}')
    
    # 5 条样本验证
    print('\n=== 5 条样本验证 ===')
    samples = c.execute("select entry_id, title, length(content) from kb_formal where entry_id like 'r16-28tongues-%' limit 5").fetchall()
    for s in samples:
        print(f'  {s[0]:24s} | {s[1][:40]:40s} | {s[2]} chars')
    
    conn.close()

if __name__ == '__main__':
    insert()