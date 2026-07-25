#!/usr/bin/env python3
"""R16-B 命名空间合并 — 在 tcm-zhongfu 模块建 r16-zhongfu-* 系列 60 条
基于 r15-tcm-zhongfu 已有 50 条基础，加上 60 条路氏临证案例细节补强
"""
import sqlite3, json
DB = '/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/server/database/yidao.db'

# 路氏临证案例 60 条（10 个脏腑 × 6 经典临证组合）
CASES = [
    # 心系 (6 条)
    {'id':1,'organ':'心','case':'心气虚兼血瘀','main':'心悸气短+胸痛固定','treat':'益气活血','acup':'内关/膻中/心俞/膈俞','medic':'养心汤合桃红四物','food':'红景天/丹参/黄芪','note':'路总：胸痛固定加血海/膈俞'},
    {'id':2,'organ':'心','case':'心阴虚兼肝郁','main':'心烦失眠+胁胀','treat':'滋阴疏肝','acup':'神门/太冲/三阴交/肝俞','medic':'天王补心丹合一贯煎','food':'百合/麦冬/玫瑰花','note':'路总：先安神后疏肝'},
    {'id':3,'organ':'心','case':'心阳虚兼水泛','main':'心悸怔忡+浮肿','treat':'温阳利水','acup':'心俞/命门/阴陵泉/复溜','medic':'真武汤合苓桂术甘汤','food':'肉桂/生姜/茯苓','note':'路总：心肾同治'},
    {'id':4,'organ':'心','case':'痰火扰心兼腑气不通','main':'心烦狂躁+大便秘','treat':'清火化痰通腑','acup':'内庭/曲池/合谷/天枢','medic':'礞石滚痰丸合大承气','food':'竹沥/大黄/瓜蒌','note':'路总：通腑即泻火'},
    {'id':5,'organ':'心','case':'心血虚兼脾虚','main':'心悸失眠+纳差','treat':'补益心脾','acup':'心俞/脾俞/足三里/神门','medic':'归脾汤','food':'龙眼肉/大枣/酸枣仁','note':'路总：归脾汤一箭双雕'},
    {'id':6,'organ':'心','case':'心火亢盛兼湿热下注','main':'心烦口疮+小便赤','treat':'清心利湿','acup':'少府/通里/中极/阴陵泉','medic':'导赤散合八正散','food':'竹叶/灯心草/车前草','note':'路总：心与小肠相表里'},
    # 肝系 (6 条)
    {'id':7,'organ':'肝','case':'肝郁兼脾虚（肝木克土）','main':'胁胀+纳呆便溏','treat':'疏肝健脾','acup':'太冲/足三里/期门/章门','medic':'逍遥散','food':'佛手/香橼/白扁豆','note':'路总：见肝之病，知肝传脾'},
    {'id':8,'organ':'肝','case':'肝阳上亢兼肝肾阴虚','main':'头晕目眩+腰膝酸软','treat':'平肝滋肾','acup':'太冲/太溪/百会/三阴交','medic':'天麻钩藤饮合杞菊地黄丸','food':'天麻/枸杞/菊花','note':'路总：水不涵木'},
    {'id':9,'organ':'肝','case':'肝胆湿热兼腑实','main':'胁痛口苦+便秘','treat':'清肝利胆通腑','acup':'阳陵泉/太冲/支沟/天枢','medic':'龙胆泻肝汤合大柴胡汤','food':'茵陈/金钱草/大黄','note':'路总：肝胆湿热需通腑'},
    {'id':10,'organ':'肝','case':'肝风内动兼痰瘀','main':'眩晕震颤+舌暗','treat':'化痰熄风活血','acup':'百会/风池/太冲/血海','medic':'半夏白术天麻汤合通窍活血','food':'天麻/钩藤/丹参','note':'路总：风痰瘀同治'},
    {'id':11,'organ':'肝','case':'肝血虚兼筋失所养','main':'头晕目涩+肢体麻木','treat':'养血柔肝','acup':'肝俞/血海/三阴交/阳陵泉','medic':'补肝汤','food':'当归/白芍/鸡血藤','note':'路总：肝主筋'},
    {'id':12,'organ':'肝','case':'肝寒兼胃寒','main':'巅顶头痛+呕吐清涎','treat':'暖肝温胃','acup':'百会/太冲/中脘/足三里','medic':'吴茱萸汤','food':'吴茱萸/生姜/小茴香','note':'路总：肝寒上逆'},
    # 脾系 (6 条)
    {'id':13,'organ':'脾','case':'脾虚湿困兼痰浊','main':'纳呆腹胀+痰多','treat':'健脾化痰','acup':'足三里/阴陵泉/丰隆/中脘','medic':'六君子汤合二陈汤','food':'陈皮/半夏/茯苓','note':'路总：脾为生痰之源'},
    {'id':14,'organ':'脾','case':'脾阳虚兼肾阳虚','main':'五更泄泻+畏寒肢冷','treat':'温补脾肾','acup':'脾俞/肾俞/命门/关元','medic':'四神丸合理中汤','food':'补骨脂/肉豆蔻/吴茱萸','note':'路总：肾阳为根'},
    {'id':15,'organ':'脾','case':'脾阴虚兼胃阴虚','main':'饥不欲食+口干','treat':'养阴益胃','acup':'足三里/内庭/三阴交/章门','medic':'益胃汤合沙参麦冬','food':'石斛/麦冬/玉竹','note':'路总：脾胃阴虚'},
    {'id':16,'organ':'脾','case':'心脾两虚','main':'心悸失眠+纳差便溏','treat':'补益心脾','acup':'心俞/脾俞/神门/足三里','medic':'归脾汤','food':'龙眼肉/大枣/酸枣仁','note':'路总：心脾同治'},
    {'id':17,'organ':'脾','case':'脾虚气陷兼肾不纳气','main':'气短乏力+久喘','treat':'补中益气纳肾','acup':'百会/关元/足三里/气海','medic':'补中益气汤合金匮肾气丸','food':'黄芪/人参/补骨脂','note':'路总：宗气下陷'},
    {'id':18,'organ':'脾','case':'脾不统血兼血虚','main':'皮下瘀斑+月经量多','treat':'补脾摄血','acup':'脾俞/血海/足三里/三阴交','medic':'归脾汤合黄土汤','food':'黄芪/阿胶/当归','note':'路总：气为血帅'},
    # 肺系 (6 条)
    {'id':19,'organ':'肺','case':'肺气虚兼表虚','main':'自汗易感','treat':'补肺固表','acup':'肺俞/足三里/合谷/气海','medic':'玉屏风散合补肺汤','food':'黄芪/白术/防风','note':'路总：培土生金'},
    {'id':20,'organ':'肺','case':'肺阴虚兼肾阴虚','main':'干咳少痰+腰酸','treat':'滋肺养肾','acup':'肺俞/肾俞/太溪/膏肓','medic':'百合固金汤合六味地黄丸','food':'百合/麦冬/熟地','note':'路总：金水相生'},
    {'id':21,'organ':'肺','case':'痰热壅肺兼腑实','main':'咳喘黄痰+便秘','treat':'清热化痰通腑','acup':'肺俞/曲池/合谷/天枢','medic':'清金化痰汤合宣白承气汤','food':'瓜蒌/黄芩/桑白皮','note':'路总：肺合大肠'},
    {'id':22,'organ':'肺','case':'风寒束肺兼表实','main':'咳嗽痰白+恶寒','treat':'疏风散寒','acup':'肺俞/风门/列缺/合谷','medic':'三拗汤合止嗽散','food':'生姜/紫苏/陈皮','note':'路总：宣肺解表'},
    {'id':23,'organ':'肺','case':'肺痨兼阴虚火旺','main':'干咳+潮热盗汗','treat':'滋阴降火抗痨','acup':'肺俞/膏肓/太溪/三阴交','medic':'百合固金汤合秦艽鳖甲散','food':'百部/白及/百合','note':'路总：杀虫+补虚'},
    {'id':24,'organ':'肺','case':'肺气郁痹兼肝郁','main':'胸闷叹息+胁胀','treat':'宣肺解郁','acup':'膻中/内关/太冲/肺俞','medic':'柴胡疏肝散合半夏厚朴汤','food':'玫瑰花/合欢花/陈皮','note':'路总：诸气膹郁皆属于肺'},
    # 肾系 (6 条)
    {'id':25,'organ':'肾','case':'肾阳虚兼水泛','main':'腰膝冷痛+浮肿','treat':'温阳利水','acup':'肾俞/命门/关元/阴陵泉','medic':'真武汤合金匮肾气丸','food':'肉桂/附子/茯苓','note':'路总：肾主水'},
    {'id':26,'organ':'肾','case':'肾阴虚兼心火旺','main':'腰酸+心烦失眠','treat':'滋肾清心','acup':'太溪/神门/涌泉/心俞','medic':'黄连阿胶汤合知柏地黄丸','food':'黄连/阿胶/生地','note':'路总：心肾不交'},
    {'id':27,'organ':'肾','case':'肾精亏兼髓海不足','main':'眩晕健忘+腰膝酸软','treat':'补肾填精','acup':'肾俞/太溪/百会/悬钟','medic':'左归丸合河车大造丸','food':'熟地/紫河车/龟板','note':'路总：填补肾精'},
    {'id':28,'organ':'肾','case':'肾不纳气兼肺气虚','main':'久喘+动则汗出','treat':'补肾纳气','acup':'肾俞/肺俞/关元/气海','medic':'金匮肾气丸合人参蛤蚧散','food':'补骨脂/核桃/蛤蚧','note':'路总：肾为气之根'},
    {'id':29,'organ':'肾','case':'肾虚兼膀胱湿热','main':'腰酸+小便赤涩','treat':'补肾清热利湿','acup':'肾俞/膀胱俞/中极/阴陵泉','medic':'知柏地黄丸合八正散','food':'知母/黄柏/车前草','note':'路总：补泻兼施'},
    {'id':30,'organ':'肾','case':'肾阳虚兼脾阳虚','main':'五更泄+畏寒','treat':'温补脾肾','acup':'脾俞/肾俞/命门/关元','medic':'四神丸合附子理中丸','food':'补骨脂/吴茱萸/干姜','note':'路总：先后天同调'},
    # 胆 (6 条)
    {'id':31,'organ':'胆','case':'胆郁痰扰兼心悸','main':'心悸易惊+口苦','treat':'清胆化痰宁心','acup':'阳陵泉/丘墟/胆俞/神门','medic':'黄连温胆汤','food':'竹茹/半夏/茯苓','note':'路总：胆心同治'},
    {'id':32,'organ':'胆','case':'胆热兼胃热','main':'胁痛+烧心','treat':'清胆和胃','acup':'阳陵泉/中脘/内庭/足三里','medic':'蒿芩清胆汤合左金丸','food':'黄芩/竹茹/黄连','note':'路总：胆胃同降'},
    {'id':33,'organ':'胆','case':'胆气虚兼心气虚','main':'易惊善恐+心悸','treat':'温胆宁心','acup':'胆俞/心俞/神门/阳陵泉','medic':'安神定志丸','food':'酸枣仁/远志/茯神','note':'路总：胆主决断'},
    {'id':34,'organ':'胆','case':'肝胆湿热兼结石','main':'胁痛+黄疸','treat':'清肝利胆排石','acup':'阳陵泉/胆囊穴/期门/日月','medic':'茵陈蒿汤合排石颗粒','food':'茵陈/金钱草/海金沙','note':'路总：排石必通腑'},
    {'id':35,'organ':'胆','case':'胆寒兼胃寒','main':'胁痛喜温+呕吐清涎','treat':'温胆和胃','acup':'阳陵泉/中脘/梁丘/胃俞','medic':'吴茱萸汤合理中汤','food':'肉桂/吴茱萸/生姜','note':'路总：寒热错杂'},
    {'id':36,'organ':'胆','case':'胆火亢盛兼痰火','main':'胁痛+烦躁失眠','treat':'清胆泻火','acup':'阳陵泉/丘墟/行间/侠溪','medic':'龙胆泻肝汤合礞石滚痰丸','food':'龙胆草/黄芩/栀子','note':'路总：实火当泻'},
    # 胃 (6 条)
    {'id':37,'organ':'胃','case':'胃热兼阴虚','main':'胃脘灼热+口干','treat':'清胃养阴','acup':'内庭/足三里/中脘/三阴交','medic':'清胃散合益胃汤','food':'黄连/生地/石斛','note':'路总：清润并施'},
    {'id':38,'organ':'胃','case':'胃寒兼脾阳虚','main':'胃冷痛+喜温','treat':'温胃健脾','acup':'中脘/足三里/胃俞/脾俞','medic':'黄芪建中汤','food':'黄芪/桂枝/饴糖','note':'路总：建中即温胃'},
    {'id':39,'organ':'胃','case':'胃气上逆兼肝气犯胃','main':'嗳气反酸+胁胀','treat':'疏肝和胃降逆','acup':'中脘/内关/太冲/足三里','medic':'旋覆代赭汤合左金丸','food':'旋覆花/代赭石/黄连','note':'路总：肝胃同降'},
    {'id':40,'organ':'胃','case':'胃阴虚兼肾阴虚','main':'饥不欲食+腰酸','treat':'养胃滋肾','acup':'足三里/三阴交/太溪/中脘','medic':'益胃汤合左归丸','food':'石斛/麦冬/熟地','note':'路总：先天后天互滋'},
    {'id':41,'organ':'胃','case':'食积胃脘兼脾虚','main':'脘腹胀满+便溏','treat':'消食健脾','acup':'中脘/足三里/梁门/章门','medic':'保和丸合四君子汤','food':'山楂/神曲/白术','note':'路总：消补兼施'},
    {'id':42,'organ':'胃','case':'胃络瘀阻兼血虚','main':'胃脘刺痛+面色晦暗','treat':'化瘀养血','acup':'中脘/血海/膈俞/足三里','medic':'失笑散合四物汤','food':'蒲黄/五灵脂/当归','note':'路总：久痛入络'},
    # 大肠 (6 条)
    {'id':43,'organ':'大肠','case':'大肠湿热兼腑气不通','main':'痢下赤白+里急后重','treat':'清热燥湿通腑','acup':'天枢/上巨虚/曲池/合谷','medic':'芍药汤合大承气汤','food':'黄连/木香/槟榔','note':'路总：通因通用'},
    {'id':44,'organ':'大肠','case':'大肠津亏兼血虚','main':'便秘+面色苍白','treat':'润肠通便养血','acup':'天枢/支沟/上巨虚/血海','medic':'润肠丸合五仁丸','food':'当归/桃仁/麻仁','note':'路总：增液行舟'},
    {'id':45,'organ':'大肠','case':'大肠虚寒兼脾阳虚','main':'冷秘+腹冷痛','treat':'温阳通便','acup':'天枢/关元/足三里/肾俞','medic':'温脾汤合半硫丸','food':'肉苁蓉/附子/干姜','note':'路总：冷秘需温'},
    {'id':46,'organ':'大肠','case':'大肠热结兼肺热','main':'便秘+咳喘','treat':'清肺通腑','acup':'天枢/上巨虚/肺俞/曲池','medic':'宣白承气汤','food':'瓜蒌/桑白皮/大黄','note':'路总：肺合大肠'},
    {'id':47,'organ':'大肠','case':'湿热下注兼脾虚','main':'腹泻黏液+纳呆','treat':'清热燥湿健脾','acup':'天枢/阴陵泉/足三里/上巨虚','medic':'香连丸合参苓白术散','food':'黄连/木香/白术','note':'路总：清涩并用'},
    {'id':48,'organ':'大肠','case':'大肠气滞兼血瘀','main':'腹胀+便下不畅','treat':'行气化瘀','acup':'天枢/气海/血海/上巨虚','medic':'六磨汤合桃红四物','food':'木香/沉香/桃仁','note':'路总：气行瘀散'},
    # 小肠 (6 条)
    {'id':49,'organ':'小肠','case':'小肠实热兼心火亢盛','main':'小便赤涩+心烦口疮','treat':'清心利尿','acup':'少府/通里/中极/阴陵泉','medic':'导赤散','food':'竹叶/灯心草/车前草','note':'路总：小肠主液'},
    {'id':50,'organ':'小肠','case':'小肠气滞兼寒凝','main':'小腹胀痛+疝气','treat':'行气散寒','acup':'气海/关元/归来/太冲','medic':'天台乌药散','food':'小茴香/荔枝核/乌药','note':'路总：寒凝肝脉'},
    {'id':51,'organ':'小肠','case':'小肠虚寒兼肾阳虚','main':'小腹冷痛+腰酸','treat':'温阳散寒','acup':'关元/气海/肾俞/小肠俞','medic':'附子理中汤合金匮肾气丸','food':'附子/肉桂/干姜','note':'路总：先后天同调'},
    {'id':52,'organ':'小肠','case':'小肠湿热兼膀胱湿热','main':'小便赤涩+小腹胀','treat':'清热利湿通淋','acup':'中极/膀胱俞/阴陵泉/三阴交','medic':'八正散','food':'车前草/木通/栀子','note':'路总：二腑同治'},
    {'id':53,'organ':'小肠','case':'小肠气结兼腑气不通','main':'腹胀+矢气少','treat':'行气导滞','acup':'天枢/气海/上巨虚/足三里','medic':'厚朴三物汤','food':'厚朴/枳实/大黄','note':'路总：通降腑气'},
    {'id':54,'organ':'小肠','case':'小肠虫积','main':'腹痛时作+异嗜','treat':'驱虫安蛔','acup':'中脘/足三里/百虫窝/天枢','medic':'乌梅丸','food':'乌梅/使君子/苦楝皮','note':'路总：蛔得酸则伏'},
    # 膀胱 (6 条)
    {'id':55,'organ':'膀胱','case':'膀胱湿热兼肾阴虚','main':'尿频涩痛+腰酸','treat':'清热利湿滋肾','acup':'中极/膀胱俞/肾俞/阴陵泉','medic':'八正散合知柏地黄丸','food':'知母/黄柏/车前草','note':'路总：清补并用'},
    {'id':56,'organ':'膀胱','case':'膀胱气闭兼肺气郁','main':'小便不通+胸闷','treat':'宣肺利水','acup':'中极/肺俞/三焦俞/阴陵泉','medic':'五苓散合越婢汤','food':'茯苓/猪苓/麻黄','note':'路总：提壶揭盖'},
    {'id':57,'organ':'膀胱','case':'膀胱虚寒兼肾阳虚','main':'小便清长+腰冷','treat':'温肾利尿','acup':'肾俞/膀胱俞/关元/中极','medic':'缩泉丸合金匮肾气丸','food':'益智仁/乌药/肉桂','note':'路总：温肾固摄'},
    {'id':58,'organ':'膀胱','case':'膀胱结石兼湿热','main':'尿石+小腹急痛','treat':'清热利湿排石','acup':'中极/膀胱俞/肾俞/阴陵泉','medic':'三金排石汤','food':'金钱草/海金沙/鸡内金','note':'路总：三金排石'},
    {'id':59,'organ':'膀胱','case':'膀胱失约兼肾气虚','main':'遗尿+腰膝酸软','treat':'补肾固摄','acup':'肾俞/膀胱俞/中极/关元','medic':'桑螵蛸散合金匮肾气丸','food':'桑螵蛸/益智仁/山药','note':'路总：固肾缩泉'},
    {'id':60,'organ':'膀胱','case':'膀胱蓄血','main':'小便不利+如狂','main2':'少腹硬满','treat':'活血化瘀通淋','acup':'中极/血海/膀胱俞/三阴交','medic':'桃核承气汤','food':'桃仁/大黄/桂枝','note':'路总：下焦蓄血'}
]

def insert():
    conn = sqlite3.connect(DB)
    c = conn.cursor()
    before = c.execute("select count() from kb_formal where entry_id like 'r16-zhongfu-%'").fetchone()[0]
    print(f'插入前 r16-zhongfu 条数: {before}')
    inserted = 0
    src_id = 'SRC-LD-LP'  # 路氏临证实践
    for case in CASES:
        eid = f'r16-zhongfu-{case["id"]:03d}'
        title = f"{case['organ']}系·{case['case']}·路氏临证案例"
        content = (
            f"【脏腑】{case['organ']}\n"
            f"【案例】{case['case']}\n"
            f"【主证】{case['main']}{(' · ' + case.get('main2','')) if case.get('main2') else ''}\n"
            f"【治法】{case['treat']}\n"
            f"【选穴】{case['acup']}\n"
            f"【方剂】{case['medic']}\n"
            f"【食疗】{case['food']}\n"
            f"【路总临证】{case['note']}"
        )
        kws = json.dumps([case['organ'], case['case'].split('兼')[0] if '兼' in case['case'] else case['case'], case['treat'], '脏腑辨证', '路氏临证', '智镜', 'R16', 'zhongfu'], ensure_ascii=False)
        sql = "INSERT OR IGNORE INTO kb_formal (entry_id, module, title, src_id, content, keywords, trust_score, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
        try:
            c.execute(sql, (eid, 'tcm-zhongfu', title, src_id, content, kws, 0.8, '脏腑辨证·路氏临证'))
            if c.rowcount > 0:
                inserted += 1
        except Exception as e:
            print(f'  ✖ {eid}: {e}')
    conn.commit()
    after = c.execute("select count() from kb_formal where entry_id like 'r16-zhongfu-%'").fetchone()[0]
    print(f'插入后 r16-zhongfu 条数: {after} (新增 {after-before})')
    print(f'INSERT rowcount 累计: {inserted} (sqlite3 rowcount 不可信，SELECT COUNT 为准)')
    total = c.execute("select count() from kb_formal where module='tcm-zhongfu'").fetchone()[0]
    print(f'tcm-zhongfu 模块总条数: {total}')
    grand = c.execute("select count() from kb_formal").fetchone()[0]
    print(f'KB 全部总条数: {grand}')
    
    print('\n=== 3 条样本验证 ===')
    samples = c.execute("select entry_id, title, length(content) from kb_formal where entry_id like 'r16-zhongfu-%' limit 3").fetchall()
    for s in samples:
        print(f'  {s[0]:24s} | {s[1][:50]:50s} | {s[2]} chars')
    
    conn.close()

if __name__ == '__main__':
    insert()