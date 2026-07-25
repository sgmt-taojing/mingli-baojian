#!/usr/bin/env python3
"""
R15 5 路 KB 补强执行脚本 · 命理宝鉴
目标: acupuncture 162→300 / tcm-fangji 82→200 / tcm-diagnosis 0→100 / tcm-zhongfu 新建 50 / shuhan-TCM 新建 80
"""
import sqlite3
import json
import sys
import os

DB_PATH = 'server/database/yidao.db'

def insert_kb(conn, entry_id, module, title, content, src_id, category,
              keywords, summary, trust=0.7, confidence=0.7):
    """INSERT OR IGNORE 模式（kb_formal 无 updated_at）"""
    c = conn.cursor()
    c.execute("""
        INSERT OR IGNORE INTO kb_formal
        (entry_id, module, title, content, src_id, category, keywords, summary,
         trust_score, version, promoted_at, promoted_from, reviewed_by,
         hit_count, last_hit, tags, source_ids, confidence,
         access_level, difficulty, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'v1', CURRENT_TIMESTAMP,
                'audit-auto', 'audit-auto', 0, NULL, '[]', ?, ?, 'registered',
                'intermediate', 'formal')
    """, (entry_id, module, title, content, src_id, category,
          json.dumps(keywords, ensure_ascii=False), summary,
          trust, f"[{src_id}]", confidence))
    return c.rowcount

def commit_and_check(conn, label, target_module, target_count):
    conn.commit()
    c = conn.cursor()
    c.execute("SELECT COUNT(*) FROM kb_formal WHERE module=?", (target_module,))
    actual = c.fetchone()[0]
    return actual, actual >= target_count

# ============================
# Worker 1 · acupuncture 162→300+（需 +138 条）
# 方向：十二正经井荥输经合 60 穴（5 经 × 12 经）+ 五输穴主治 30 条 + 八纲取穴 30 条 + 灵龟八法 + 飞腾八法 18 条
# ============================

ACUPUNCTURE_FIVE_SHU = [
    # 12 经 × 5 穴 = 60 条
    ('手太阴肺经', '少商', '井', '木', '咽喉肿痛、咳嗽、气喘', 'SRC-NHS-RJJZ'),
    ('手太阴肺经', '鱼际', '荥', '火', '咽喉肿痛、发热、咳嗽', 'SRC-NHS-RJJZ'),
    ('手太阴肺经', '太渊', '输', '土', '咳嗽、气喘、腕臂痛', 'SRC-NHS-RJJZ'),
    ('手太阴肺经', '经渠', '经', '金', '咳嗽、气喘、咽喉肿痛', 'SRC-NHS-RJJZ'),
    ('手太阴肺经', '尺泽', '合', '水', '咳嗽、气喘、咽喉肿痛、肘臂痛', 'SRC-NHS-RJJZ'),
    ('手阳明大肠经', '商阳', '井', '金', '咽喉肿痛、齿痛、耳聋', 'SRC-NHS-RJJZ'),
    ('手阳明大肠经', '二间', '荥', '水', '咽喉肿痛、齿痛、鼻衄', 'SRC-NHS-RJJZ'),
    ('手阳明大肠经', '三间', '输', '木', '齿痛、咽喉肿痛、嗜睡', 'SRC-NHS-RJJZ'),
    ('手阳明大肠经', '阳溪', '经', '火', '头痛、齿痛、目赤肿痛', 'SRC-NHS-RJJZ'),
    ('手阳明大肠经', '曲池', '合', '土', '热病、咽喉肿痛、齿痛、上肢不遂', 'SRC-NHS-RJJZ'),
    ('足阳明胃经', '厉兑', '井', '金', '齿痛、面肿、咽喉肿痛、热病', 'SRC-NHS-RJJZ'),
    ('足阳明胃经', '内庭', '荥', '水', '齿痛、口歪、咽喉肿痛、胃痛', 'SRC-NHS-RJJZ'),
    ('足阳明胃经', '陷谷', '输', '木', '面肿、目赤肿痛、胃痛', 'SRC-NHS-RJJZ'),
    ('足阳明胃经', '解溪', '经', '火', '头痛、踝关节痛、目赤肿痛', 'SRC-NHS-RJJZ'),
    ('足阳明胃经', '足三里', '合', '土', '胃痛、呕吐、腹泻、虚劳、健忘', 'SRC-NHS-RJJZ'),
    ('足太阴脾经', '隐白', '井', '木', '腹胀、便血、月经过多、崩漏', 'SRC-NHS-RJJZ'),
    ('足太阴脾经', '大都', '荥', '火', '腹胀、胃痛、呕吐、泄泻', 'SRC-NHS-RJJZ'),
    ('足太阴脾经', '太白', '输', '土', '胃痛、腹胀、呕吐、泄泻', 'SRC-NHS-RJJZ'),
    ('足太阴脾经', '商丘', '经', '金', '腹胀、便秘、泄泻、足踝痛', 'SRC-NHS-RJJZ'),
    ('足太阴脾经', '阴陵泉', '合', '水', '腹胀、泄泻、水肿、小便不利', 'SRC-NHS-RJJZ'),
    ('手少阴心经', '少冲', '井', '木', '心悸、心痛、癫狂、热病', 'SRC-NHS-RJJZ'),
    ('手少阴心经', '少府', '荥', '火', '心悸、心痛、小便不利、阴痒', 'SRC-NHS-RJJZ'),
    ('手少阴心经', '神门', '输', '土', '心悸、心痛、失眠、健忘', 'SRC-NHS-RJJZ'),
    ('手少阴心经', '灵道', '经', '金', '心悸、心痛、暴喑、舌强不语', 'SRC-NHS-RJJZ'),
    ('手少阴心经', '少海', '合', '水', '心痛、心悸、肘臂痛、腋胁痛', 'SRC-NHS-RJJZ'),
    ('手太阳小肠经', '少泽', '井', '金', '咽喉肿痛、目赤肿痛、乳少', 'SRC-NHS-RJJZ'),
    ('手太阳小肠经', '前谷', '荥', '水', '咽喉肿痛、目赤肿痛、热病', 'SRC-NHS-RJJZ'),
    ('手太阳小肠经', '后溪', '输', '木', '头项强痛、目赤肿痛、耳聋、癫痫', 'SRC-NHS-RJJZ'),
    ('手太阳小肠经', '阳谷', '经', '火', '头痛、目赤肿痛、耳鸣、腕痛', 'SRC-NHS-RJJZ'),
    ('手太阳小肠经', '小海', '合', '土', '肘臂痛、头痛、目赤肿痛', 'SRC-NHS-RJJZ'),
    ('足太阳膀胱经', '至阴', '井', '金', '头痛、目赤肿痛、鼻塞、胎位不正', 'SRC-NHS-RJJZ'),
    ('足太阳膀胱经', '通谷', '荥', '水', '头痛、目赤肿痛、鼻衄', 'SRC-NHS-RJJZ'),
    ('足太阳膀胱经', '束骨', '输', '木', '头痛、目赤肿痛、腰背痛', 'SRC-NHS-RJJZ'),
    ('足太阳膀胱经', '昆仑', '经', '火', '头痛、目赤肿痛、颈项强痛', 'SRC-NHS-RJJZ'),
    ('足太阳膀胱经', '委中', '合', '土', '腰背痛、下肢痿痹、腹痛、吐泻', 'SRC-NHS-RJJZ'),
    ('足少阴肾经', '涌泉', '井', '木', '头痛、眩晕、咽喉肿痛、小便不利', 'SRC-NHS-RJJZ'),
    ('足少阴肾经', '然谷', '荥', '火', '咽喉肿痛、遗精、阳痿、月经不调', 'SRC-NHS-RJJZ'),
    ('足少阴肾经', '太溪', '输', '土', '遗精、阳痿、月经不调、咽喉肿痛', 'SRC-NHS-RJJZ'),
    ('足少阴肾经', '复溜', '经', '金', '水肿、汗证、泄泻、足痿', 'SRC-NHS-RJJZ'),
    ('足少阴肾经', '阴谷', '合', '水', '阳痿、遗精、月经不调、小便不利', 'SRC-NHS-RJJZ'),
    ('手厥阴心包经', '中冲', '井', '木', '心悸、心痛、咽喉肿痛、热病', 'SRC-NHS-RJJZ'),
    ('手厥阴心包经', '劳宫', '荥', '火', '心悸、心痛、口疮、癫狂', 'SRC-NHS-RJJZ'),
    ('手厥阴心包经', '大陵', '输', '土', '心悸、心痛、呕吐、胃痛', 'SRC-NHS-RJJZ'),
    ('手厥阴心包经', '间使', '经', '金', '心悸、心痛、呕吐、热病', 'SRC-NHS-RJJZ'),
    ('手厥阴心包经', '曲泽', '合', '水', '心悸、心痛、呕吐、胃痛', 'SRC-NHS-RJJZ'),
    ('手少阳三焦经', '关冲', '井', '金', '头痛、目赤肿痛、咽喉肿痛', 'SRC-NHS-RJJZ'),
    ('手少阳三焦经', '液门', '荥', '水', '头痛、目赤肿痛、耳鸣、耳聋', 'SRC-NHS-RJJZ'),
    ('手少阳三焦经', '中渚', '输', '木', '头痛、目赤肿痛、耳鸣、耳聋', 'SRC-NHS-RJJZ'),
    ('手少阳三焦经', '支沟', '经', '火', '耳鸣、耳聋、便秘、热病', 'SRC-NHS-RJJZ'),
    ('手少阳三焦经', '天井', '合', '土', '头痛、耳鸣、瘰疬、肘臂痛', 'SRC-NHS-RJJZ'),
    ('足少阳胆经', '足窍阴', '井', '金', '头痛、目赤肿痛、耳鸣、咽喉肿痛', 'SRC-NHS-RJJZ'),
    ('足少阳胆经', '侠溪', '荥', '水', '头痛、目赤肿痛、耳鸣', 'SRC-NHS-RJJZ'),
    ('足少阳胆经', '足临泣', '输', '木', '头痛、目赤肿痛、月经不调', 'SRC-NHS-RJJZ'),
    ('足少阳胆经', '阳辅', '经', '火', '头痛、目赤肿痛、胁痛、下肢痿痹', 'SRC-NHS-RJJZ'),
    ('足少阳胆经', '阳陵泉', '合', '土', '胁痛、下肢痿痹、口苦、呕吐', 'SRC-NHS-RJJZ'),
    ('足厥阴肝经', '大敦', '井', '木', '疝气、遗尿、月经过多、癫痫', 'SRC-NHS-RJJZ'),
    ('足厥阴肝经', '行间', '荥', '火', '头痛、目赤肿痛、月经过多、癫痫', 'SRC-NHS-RJJZ'),
    ('足厥阴肝经', '太冲', '输', '土', '头痛、目赤肿痛、月经不调、胁痛', 'SRC-NHS-RJJZ'),
    ('足厥阴肝经', '中封', '经', '金', '疝气、遗精、小便不利、胁痛', 'SRC-NHS-RJJZ'),
    ('足厥阴肝经', '曲泉', '合', '水', '月经不调、遗精、疝气、小便不利', 'SRC-NHS-RJJZ'),
]

ACUPUNCTURE_EIGHT_GUIDE = [
    # 灵龟八法 + 飞腾八法 + 八纲取穴 = 18 条
    ('公孙', '灵龟八法', '冲脉', '胃心胸病证', 'SRC-LD-BZ'),
    ('内关', '灵龟八法', '阴维脉', '胃心胸病证', 'SRC-LD-BZ'),
    ('临泣', '灵龟八法', '带脉', '头目病证', 'SRC-LD-BZ'),
    ('外关', '灵龟八法', '阳维脉', '头目病证', 'SRC-LD-BZ'),
    ('后溪', '灵龟八法', '督脉', '头项病证', 'SRC-LD-BZ'),
    ('申脉', '灵龟八法', '阳跷脉', '头项病证', 'SRC-LD-BZ'),
    ('列缺', '灵龟八法', '任脉', '肺系病证', 'SRC-LD-BZ'),
    ('照海', '灵龟八法', '阴跷脉', '肺系病证', 'SRC-LD-BZ'),
    ('公孙-内关', '八脉交会', '胃心胸', '胃痛、心悸、胸闷', 'SRC-LD-BZ'),
    ('临泣-外关', '八脉交会', '头目', '偏头痛、目赤肿痛', 'SRC-LD-BZ'),
    ('后溪-申脉', '八脉交会', '头项颈肩', '颈项强痛、头痛', 'SRC-LD-BZ'),
    ('列缺-照海', '八脉交会', '肺系咽喉', '咳嗽、咽喉肿痛', 'SRC-LD-BZ'),
    ('阴陵泉', '八纲取穴', '湿证', '泄泻、水肿、带下', 'SRC-LD-BZ'),
    ('曲池', '八纲取穴', '热证', '发热、咽喉肿痛', 'SRC-LD-BZ'),
    ('合谷', '八纲取穴', '表证', '外感表证、头痛', 'SRC-LD-BZ'),
    ('太溪', '八纲取穴', '虚证', '肾虚、遗精、阳痿', 'SRC-LD-BZ'),
    ('太冲', '八纲取穴', '肝郁', '胁痛、月经不调、眩晕', 'SRC-LD-BZ'),
    ('足三里', '八纲取穴', '补虚', '胃虚、虚劳、健忘', 'SRC-LD-BZ'),
]

def run_acupuncture(conn):
    n = 0
    for i, (jing, xue, shu, xing, zhu, src) in enumerate(ACUPUNCTURE_FIVE_SHU, 1):
        entry_id = f'r15-acu-fiveshu-{i:03d}'
        title = f'{jing}{xue}穴（五输穴·{shu}·{xing}）'
        content = f'{jing}{xue}穴为五输穴之一，属{shu}穴，五行属{xing}。主{zhu}。针灸治疗时常配合{shu}穴按时取穴、子午流注开穴法使用。'
        keywords = [jing, xue, '五输穴', shu, xing, '针灸', '子午流注']
        summary = f'{jing}{xue}穴，{shu}穴五行{xing}，主{zhu}'
        if insert_kb(conn, entry_id, 'acupuncture', title, content, src,
                     '五输穴', keywords, summary, trust=0.85, confidence=0.85) > 0:
            n += 1
    for i, (xue, fangfa, mai, bingzheng, src) in enumerate(ACUPUNCTURE_EIGHT_GUIDE, 1):
        entry_id = f'r15-acu-extra-{i:03d}'
        title = f'{xue}穴（{fangfa}·{mai}）'
        content = f'{xue}穴是{fangfa}要穴，通{mai}，临床常用于治疗{bingzheng}。按时取穴效果更佳。'
        keywords = [xue, fangfa, mai, '奇穴', '针灸', '按时取穴']
        summary = f'{xue}穴，{fangfa}，通{mai}，治{bingzheng}'
        if insert_kb(conn, entry_id, 'acupuncture', title, content, src,
                     fangfa, keywords, summary, trust=0.8, confidence=0.8) > 0:
            n += 1
    return n

if __name__ == '__main__':
    if not os.path.exists(DB_PATH):
        print(f'数据库不存在: {DB_PATH}')
        sys.exit(1)
    conn = sqlite3.connect(DB_PATH)
    print('===Worker 1·acupuncture 162→300===')
    n = run_acupuncture(conn)
    conn.commit()
    actual, ok = commit_and_check(conn, 'acupuncture', 'acupuncture', 300)
    print(f'新增 {n} 条 / 当前 {actual} / {"✅" if ok else "❌"} 目标 300')
    conn.close()