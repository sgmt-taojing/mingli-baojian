#!/usr/bin/env python3

# ═══ LEGACY-INGEST-GUARD (R-INGEST-SPEC-20260927) ═══
# 本脚本为一次性历史批次脚本，入库口径已过时（无 fingerprint幂等/status='formal'/domain 新规范）。
# 新入库请使用 scripts/lib/kb_ingest.py；抓取请用改造后的 fetch-classics-kanripo.py / fetch-classics-wikisource.py。
# 确需原样重跑（极少数修复场景）：ALLOW_LEGACY_INGEST=1 python3 <本脚本>
import os as _lg_os, sys as _lg_sys
if _lg_os.environ.get('ALLOW_LEGACY_INGEST') != '1':
    _lg_sys.stderr.write('⛔ 旧口径入库脚本已禁用（R-INGEST-SPEC-20260927 防 KB 污染）。新口径见 scripts/lib/kb_ingest.py；确需重跑请设 ALLOW_LEGACY_INGEST=1\n')
    _lg_sys.exit(2)
# ═══ END GUARD ═══

"""R481 · 手诊 KB 蒸馏 + TCM 训练样本批量生成"""
import sqlite3, json, hashlib, os

DB = os.path.join(os.path.dirname(__file__), '..', 'knowledge', 'yidao.db')

# ═══ 手诊知识条目（20条） ═══
HAND_ENTRIES = [
    ("手诊·掌色红主热证","手掌颜色偏红，多见于热证、肝阳上亢。若掌心潮红伴发热，多为实热；若午后颧红手心热，多为阴虚内热。掌色鲜红可能提示高血压倾向。","手诊基础",0.85),
    ("手诊·掌色淡白主虚证","手掌颜色淡白无华，多见于血虚、气虚、阳虚。掌色苍白伴指甲苍白，多为气血两虚；掌色淡白伴畏寒，多为阳虚。常见于贫血、低血压患者。","手诊基础",0.85),
    ("手诊·掌色黄主湿证","手掌颜色发黄，多见于湿证、黄疸。若手掌黄而明亮为阳黄（湿热），黄而晦暗为阴黄（寒湿）。手掌局限于大小鱼际发红为肝掌。","手诊基础",0.83),
    ("手诊·掌色紫暗主血瘀","手掌颜色紫暗或青紫，多见于血瘀证。若伴指甲紫暗、舌紫暗，血瘀诊断更为明确。常见于心功能不全、慢性缺氧性疾病。","手诊基础",0.84),
    ("手诊·大鱼际形态诊断","大鱼际丰满有弹性为脾胃功能良好；大鱼际萎缩塌陷为脾胃虚弱；大鱼际发红为胃热；大鱼际青筋显露为胃寒或肝胃不和。","分区手诊",0.82),
    ("手诊·小鱼际形态诊断","小鱼际为肾与膀胱反射区。小鱼际饱满为肾气充足；小鱼际瘦薄为肾虚；小鱼际发红为肾阴虚内热；小鱼际发暗为肾阳虚或寒湿。","分区手诊",0.82),
    ("手诊·掌心温度诊断","掌心温度异常是重要的辨证依据。手心发热为阴虚内热或心火亢盛；手心发凉为阳虚或气血不足；手心出汗多为气虚不固或脾胃湿热。","温湿度手诊",0.83),
    ("手诊·手指形态诊断","手指修长匀称为气血调和；手指肿胀为水湿内停；手指干枯瘦削为气血亏虚；手指末端膨大（杵状指）提示慢性缺氧性心肺疾病。","形态手诊",0.81),
    ("手诊·指甲苍白主血虚","指甲颜色苍白无华，甲床淡白，多见于血虚证。若伴面色苍白、唇色淡白、舌淡白，血虚诊断明确。常见于缺铁性贫血。","指甲手诊",0.86),
    ("手诊·指甲紫暗主血瘀","指甲颜色紫暗或青紫，多见于血瘀证或寒凝。若伴舌紫暗、唇紫绀，提示瘀血内阻或心肺功能异常。","指甲手诊",0.85),
    ("手诊·指甲纵纹主肝肾亏虚","指甲表面出现明显纵行条纹，多见于肝肾亏虚、精血不足。纵纹越多越深，亏虚程度越重。常见于长期熬夜、过度劳累者。","指甲手诊",0.84),
    ("手诊·指甲横纹主气血不足","指甲出现横向凹陷条纹（博氏线），多见于气血不足或曾患重病。横纹位置可反映患病时间：甲根横纹为近期，甲尖横纹为3-4个月前。","指甲手诊",0.83),
    ("手诊·指甲凹陷主肝血不足","指甲中央凹陷呈匙状（反甲），多见于肝血不足或严重缺铁。常伴面色萎黄、头昏眼花。匙状甲是缺铁性贫血的典型体征之一。","指甲手诊",0.84),
    ("手诊·月牙痕诊断","指甲根部半月痕（月牙）反映气血盛衰。8-10个手指均有月牙为气血充足；仅拇指有月牙为气血偏虚；月牙消失为气血大亏。月牙过大（超过指甲1/5）为阳亢。","指甲手诊",0.82),
    ("手诊·手掌青筋显露","手掌青筋（静脉）显露明显，多见于寒证、痛证、血瘀。大鱼际青筋为脾胃虚寒；手指青筋为寒凝经脉。","脉络手诊",0.81),
    ("手诊·手掌水肿诊断","手掌或手指出现凹陷性水肿，按之凹陷不起，多见于水湿内停。若伴颜面浮肿为风水相搏（肾性水肿）；若以下肢为主为心性水肿。","水肿手诊",0.83),
    ("手诊·手掌温度四季变化","手掌四季温暖为阳气充足；入冬手掌冰凉为阳虚体质；盛夏手掌灼热为阴虚内热；手心时时汗出为心气虚或湿热内蕴。","温湿度手诊",0.80),
    ("手诊·手指震颤诊断","手指不自主细颤，多见于肝风内动、阴虚风动。若伴头摇、肢体震颤为颤证；若仅手指微颤伴心悸为心脾两虚。常见于甲亢、帕金森病早期。","形态手诊",0.79),
    ("手诊·手掌皮疹诊断","手掌出现红色皮疹或红斑，多见于风热、湿热。若掌心脱屑伴瘙痒为鹅掌风（手癣）；若对称性红斑为红斑狼疮体征。","皮损手诊",0.78),
    ("手诊·合谷穴压痛诊断","合谷穴（虎口处）压痛明显，多见于外感表证、头面部疾患。左侧合谷压痛多为大肠经病变，右侧合谷压痛多为肺经病变。","穴位手诊",0.81),
]

def main():
    db = sqlite3.connect(DB)
    cur = db.cursor()
    written = 0
    
    for title, content, cat, trust in HAND_ENTRIES:
        h = hashlib.md5(f"hand:{title}".encode()).hexdigest()[:12]
        eid = f"KB-HAND-{h}"
        
        cur.execute("SELECT 1 FROM kb_formal WHERE entry_id=?", (eid,))
        if cur.fetchone(): continue
        
        src_id = "SRC-DISTILL-HAND"
        cur.execute("SELECT src_id FROM source_index WHERE src_id=?", (src_id,))
        if not cur.fetchone():
            cur.execute("INSERT OR IGNORE INTO source_index(src_id,src_type,title,author,trust_score,tags) VALUES(?,'SRC-EXPERT','手诊蒸馏库','命理宝鉴蒸馏系统',0.85,?)",
                       (src_id, json.dumps(["hand","tcm","r481"])))
        
        cur.execute("""INSERT INTO kb_formal(entry_id,module,title,content,src_id,category,keywords,summary,confidence,tags,source_ids,status,created_at)
            VALUES(?,'tcm',?,?,?,?,?,?,?,?,?,'formal',datetime('now','localtime'))""",
            (eid, title[:200], content, src_id, cat, json.dumps(["手诊",cat.split('·')[0] if '·' in cat else cat]),
             content[:200], trust, json.dumps(["hand","tcm","r481"]), json.dumps([src_id])))
        written += 1
    
    db.commit()
    
    # FTS5 增量同步
    cur.execute("""INSERT INTO kb_fts5(entry_id,module,title,content,keywords,category)
        SELECT entry_id,module,title,content,keywords,category FROM kb_formal
        WHERE entry_id LIKE 'KB-HAND-%' AND entry_id NOT IN (SELECT entry_id FROM kb_fts5)""")
    
    print(f"手诊KB: written={written}, kb_formal={cur.execute('SELECT COUNT(*) FROM kb_formal').fetchone()[0]}")
    db.close()

if __name__ == "__main__":
    main()
