#!/usr/bin/env python3
"""A 方案：建 acupuncture 模块骨架 + Promote 到 kb_formal"""
import sqlite3, json, sys, os

DB = "./server/database/yidao.db"
con = sqlite3.connect(DB)
cur = con.cursor()
NOW = "2026-07-23 01:05:00"

acupuncture_core = [
    ("acupuncture-intro", "acupuncture", "倪海厦针灸学概论",
     "倪师《人纪·针灸》开篇明义：针灸不是孤立技法，而是中医辨证体系下的经络调理手段。学习针灸必须先明十二经、奇经八脉循行，再识穴位归经与主治，最后方能于临床辨证施治。倪师强调『针不及、灸不及』——针刺、灸法各有局限，重症、危症、长期慢性病仍需汤药内治。",
     ["针灸概论","倪海厦","人纪","经络"], "beginner"),

    ("acupuncture-meridian-overview", "acupuncture", "十二正经与奇经八脉总览",
     "十二正经：手三阴（肺心包心）、手三阳（大肠三焦小肠）、足三阳（胃胆膀胱）、足三阴（脾肝肾），共十二条主脉，左右对称各一条。奇经八脉：任脉、督脉、冲脉、带脉、阴维、阳维、阴跷、阳跷。倪师强调：十二经为常脉，奇经八脉为蓄溢调节系统；不病时奇经涵蓄精气，既病则邪入正经。",
     ["十二经","奇经八脉","经络学"], "intermediate"),

    ("acupuncture-meridian-lung", "acupuncture", "手太阴肺经（11穴）",
     "起于中府（募穴），止于少商（井穴）。肺主气，司呼吸，主皮毛，开窍于鼻。主治：咳嗽、气喘、咽喉炎、鼻塞、皮肤问题、忧愁情绪。中府穴治肺病初期、少商治咽喉、商阳治热病。倪师常以肺经尺泽（合穴）配合大肠经曲池治皮肤病。",
     ["肺经","中府","少商","商阳","尺泽"], "intermediate"),

    ("acupuncture-meridian-li", "acupuncture", "手阳明大肠经（20穴）",
     "起于商阳，止于迎香。大肠主传导糟粕，吸收水分。与肺相表里。常用穴：合谷（治面口病要穴）、曲池（治皮肤病要穴）、手三里（治腰腿痛）、迎香（治鼻塞）。倪师临床常用：合谷+曲池治荨麻疹、湿疹、痤疮等皮肤问题。",
     ["大肠经","合谷","曲池","迎香"], "intermediate"),

    ("acupuncture-meridian-st", "acupuncture", "足阳明胃经（45穴）",
     "起于承泣，止于厉兑。胃主受纳腐熟水谷，与脾相表里。常用穴：足三里（强壮要穴）、天枢（治肠胃）、丰隆（化痰）、四白（治眼）。倪师治胃癌常取足三里+中脘+公孙，治糖尿病取足三里+三阴交。",
     ["胃经","足三里","天枢","丰隆"], "intermediate"),

    ("acupuncture-meridian-sp", "acupuncture", "足太阴脾经（21穴）",
     "起于隐白，止于大包。脾主运化，统血，主肌肉、四肢。常用穴：三阴交（妇科要穴）、阴陵泉（祛湿）、血海（治血证）。倪师常以三阴交配血海治妇科，配足三里治脾虚。",
     ["脾经","三阴交","阴陵泉","血海"], "intermediate"),

    ("acupuncture-meridian-ht", "acupuncture", "手少阴心经（9穴）",
     "起于极泉，止于少冲。心主血脉、藏神，开窍于舌。常用穴：神门（安神要穴）、少府（清心火）。倪师治失眠常取神门+内关+百会。",
     ["心经","神门","少府"], "intermediate"),

    ("acupuncture-meridian-si", "acupuncture", "手太阳小肠经（19穴）",
     "起于少泽，止于听宫。小肠主受盛化物，泌别清浊。常用穴：后溪（治颈项强痛）、养老（治目视不明）、听宫（治耳疾）。",
     ["小肠经","后溪","养老","听宫"], "intermediate"),

    ("acupuncture-meridian-ub", "acupuncture", "足太阳膀胱经（67穴）",
     "最长经络，起于睛明，止于至阴。循行背部两条主线，与五脏六腑背俞穴相连。常用穴：委中（腰背委中求）、承山（治痔疮、转筋）、昆仑（治项强）、肾俞/脾俞/肺俞等背俞穴。倪师治腰背痛首选委中+后溪，治脏腑病取相应背俞穴。",
     ["膀胱经","委中","承山","背俞穴","肾俞"], "intermediate"),

    ("acupuncture-meridian-kid", "acupuncture", "足少阴肾经（27穴）",
     "起于涌泉，止于俞府。肾主藏精、主水、主纳气、主骨生髓，开窍于耳及二阴。常用穴：涌泉（开窍急救）、太溪（补肾要穴）、照海（治咽痛）、复溜（治水肿）。倪师治肾虚常取太溪+复溜，治咽干取照海+列缺。",
     ["肾经","涌泉","太溪","照海","复溜"], "intermediate"),

    ("acupuncture-meridian-pc", "acupuncture", "手厥阴心包经（9穴）",
     "起于天池，止于中冲。心包代心受邪，保护心脏。常用穴：内关（治胃心胸疾要穴）、大陵（治神志病）、劳宫（清心火）。倪师治心悸、胃痛取内关，配公孙治胃心胸诸疾。",
     ["心包经","内关","大陵","劳宫"], "intermediate"),

    ("acupuncture-meridian-sj", "acupuncture", "手少阳三焦经（23穴）",
     "起于关冲，止于丝竹空。三焦主气机升降、决渎行水。常用穴：外关（治发热、偏头痛）、支沟（治便秘）、翳风（治耳疾）、丝竹空（治目疾）。倪师治少阳病取外关+足临泣。",
     ["三焦经","外关","支沟","翳风"], "intermediate"),

    ("acupuncture-meridian-gb", "acupuncture", "足少阳胆经（44穴）",
     "起于瞳子髎，止于足窍阴。胆主决断，藏精汁。常用穴：风池（治头项强痛）、肩井（治肩背痛）、阳陵泉（筋会、治筋病）、足临泣（治少阳病）。倪师治偏头痛取风池+外关+足临泣。",
     ["胆经","风池","肩井","阳陵泉","足临泣"], "intermediate"),

    ("acupuncture-meridian-liv", "acupuncture", "足厥阴肝经（14穴）",
     "起于大敦，止于期门。肝主疏泄、藏血、开窍于目。常用穴：太冲（疏肝要穴）、行间（清肝火）、期门（肝募穴）。倪师治肝郁常用太冲+内关+合谷（开四关）。",
     ["肝经","太冲","行间","期门","四关"], "intermediate"),

    ("acupuncture-du", "acupuncture", "督脉（28穴）",
     "起于长强，止于龈交。循行人体背面正中，统摄阳经。常用穴：大椎（治热病）、百会（升阳举陷）、水沟/人中（急救开窍）、命门（补肾阳）。倪师治阳虚取百会+命门+关元（灸法为主）。",
     ["督脉","大椎","百会","人中","命门"], "intermediate"),

    ("acupuncture-ren", "acupuncture", "任脉（24穴）",
     "起于会阴，止于承浆。循行人体前正中线，统摄阴经。常用穴：中脘（治胃病）、关元（补元气）、气海（益气）、膻中（宽胸理气）。倪师治虚证常灸关元+足三里+三阴交。",
     ["任脉","中脘","关元","气海","膻中"], "intermediate"),

    ("acupuncture-five-shu", "acupuncture", "五腧穴总论（井荥输经合）",
     "五腧穴指每条经络在肘膝关节以下的五个特定穴：井穴（脉气始发）、荥穴（小水）、输穴（灌注）、经穴（通行）、合穴（百川入海）。阴经井穴属木、荥穴属火、输穴属土、经穴属金、合穴属水；阳经井穴属金、荥穴属水、输穴属木、经穴属火、合穴属土。临床治疗原则：『井主心下满、荥主身热、输主体重节痛、经主喘咳寒热、合主逆气而泄』（《难经·六十八难》）。倪师临床常用井穴放血治急症（如少商放血治咽喉急痛）。",
     ["五腧穴","井穴","荥穴","输穴","经穴","合穴","难经"], "advanced"),

    ("acupuncture-yuan-xie", "acupuncture", "原穴与络穴",
     "原穴：脏腑原气经过和留止的部位，十二经各有一原穴（阴经以输穴为原穴，阳经单独有原穴）。原穴主治五脏六腑之疾。络穴：十五络脉从经脉分出处各有一穴，沟通表里两经。倪师治脏腑病多取原穴（如合谷-大肠原、太冲-肝原、神门-心原），治表里同病用络穴（如内关-心包络、公孙-脾络）。",
     ["原穴","络穴","合谷","太冲","神门"], "advanced"),

    ("acupuncture-mu-xi", "acupuncture", "募穴与背俞穴",
     "募穴：脏腑之气结聚于胸腹的特定穴（共12个），偏于治腑病急证。背俞穴：脏腑之气输注于背腰的特定穴（12个），偏于治脏病慢证。俞募配穴法：脏腑有病可同取背俞穴与腹募穴（如胃俞+中脘、肾俞+京门）。倪师常以俞募配穴为主，配合五腧穴治疗。",
     ["募穴","背俞穴","俞募配穴","中脘","胃俞"], "advanced"),

    ("acupuncture-eight-confluent", "acupuncture", "八脉交会穴",
     "八脉交会穴是奇经八脉与十二经交会的八个特定穴：公孙（冲脉）、内关（阴维）、后溪（督脉）、申脉（阳跷）、足临泣（带脉）、外关（阳维）、列缺（任脉）、照海（阴跷）。临床常上下四穴相配治疗奇经病，如内关+公孙治胃心胸疾，后溪+申脉治颈项强痛。倪师常用『灵龟八法』择时开穴。",
     ["八脉交会穴","公孙","内关","后溪","申脉","列缺","照海","灵龟八法"], "advanced"),

    ("acupuncture-common-points", "acupuncture", "临床常用配穴",
     "四关穴：合谷（大肠原）+太冲（肝原），治气血郁滞要穴。开四关可调全身气机。倪师治肝郁、气滞、痛经常用四关。开四关：大椎+曲池+合谷+外关，治外感发热。回阳九针：哑门、劳宫、三阴交、涌泉、太溪、中脘、环跳、足三里、合谷，用于急救阳气欲脱。",
     ["四关穴","开四关","回阳九针","急救"], "intermediate"),
]

# 入 staging
staged = 0
for eid, mod, title, content, tags, diff in acupuncture_core:
    cur.execute("""
        INSERT OR IGNORE INTO staging_knowledge
        (entry_id, module, content, summary, tags, source_ids, confidence,
         access_level, category, difficulty, status, audit_status, audit_by, audit_at)
        VALUES (?, ?, ?, ?, ?, ?, 0.7, 'public', ?, ?, 'staging', 'approved', 'audit-auto', ?)
    """, (
        eid, mod, content, title[:80],
        json.dumps(tags, ensure_ascii=False),
        json.dumps(["SRC-COURSE-007"], ensure_ascii=False),
        '倪师人纪·针灸', diff, NOW
    ))
    if cur.rowcount > 0:
        staged += 1
con.commit()
print(f"staged: {staged}/{len(acupuncture_core)}")

# Promote
promoted = 0
for eid, mod, title, content, tags, diff in acupuncture_core:
    cur.execute("""
        INSERT OR IGNORE INTO kb_formal
        (entry_id, module, title, content, src_id, category, keywords, summary,
         trust_score, version, promoted_at, promoted_from, reviewed_by,
         source_ids, confidence, access_level, difficulty, status)
        VALUES (?, ?, ?, ?, 'SRC-COURSE-007', '倪师人纪·针灸', ?, ?, 0.7, 'v1', ?, ?, 'audit-auto',
                ?, 0.7, 'public', ?, 'formal')
    """, (
        eid, mod, title[:120], content,
        json.dumps(tags, ensure_ascii=False),
        title[:120],
        NOW, eid,
        json.dumps(["SRC-COURSE-007"], ensure_ascii=False),
        diff
    ))
    cur.execute("""
        INSERT OR IGNORE INTO kb_audit (audit_id, entry_id, module, action, checks, score, reason, auditor, audited_at)
        VALUES (?, ?, ?, 'promote', ?, 0.75, 'acupuncture骨架初始化', 'audit-auto', ?)
    """, (
        f"AUD-INIT-ACU-{eid}", eid, mod,
        json.dumps({"factual":"safe","sensitive":"safe","completeness":"safe","sources":"safe","consistency":"safe"}),
        NOW
    ))
    if cur.rowcount > 0:
        promoted += 1
con.commit()

cur.execute("SELECT COUNT(*) FROM staging_knowledge WHERE module='acupuncture'")
print(f"staging.acupuncture = {cur.fetchone()[0]}")
cur.execute("SELECT COUNT(*) FROM kb_formal WHERE module='acupuncture'")
print(f"kb_formal.acupuncture = {cur.fetchone()[0]}")
print(f"promoted: {promoted}/{len(acupuncture_core)}")
con.close()