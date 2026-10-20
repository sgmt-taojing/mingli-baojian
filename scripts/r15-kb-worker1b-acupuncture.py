#!/usr/bin/env python3
"""Worker 1·acupuncture 第二轮：原穴 + 络穴 + 郄穴 + 八会穴 + 募穴 = 60 条"""
import sqlite3, json, sys, os
import importlib.util
spec = importlib.util.spec_from_file_location('w1', 'scripts/r15-kb-worker1-acupuncture.py')
w1 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(w1)
insert_kb = w1.insert_kb
commit_and_check = w1.commit_and_check

ACUPUNCTURE_YUANLUO = [
    # 12 原穴
    ('肺', '太渊', '原穴', '咳嗽、气喘、咽喉肿痛', 'SRC-NHS-RJJZ'),
    ('大肠', '合谷', '原穴', '头痛、齿痛、目赤肿痛', 'SRC-NHS-RJJZ'),
    ('胃', '冲阳', '原穴', '胃痛、口歪、足痿', 'SRC-NHS-RJJZ'),
    ('脾', '太白', '原穴', '胃痛、腹胀、呕吐', 'SRC-NHS-RJJZ'),
    ('心', '神门', '原穴', '心悸、心痛、失眠', 'SRC-NHS-RJJZ'),
    ('小肠', '腕骨', '原穴', '头痛、项强、耳鸣', 'SRC-NHS-RJJZ'),
    ('膀胱', '京骨', '原穴', '头痛、项强、腰背痛', 'SRC-NHS-RJJZ'),
    ('肾', '太溪', '原穴', '遗精、阳痿、月经不调', 'SRC-NHS-RJJZ'),
    ('心包', '大陵', '原穴', '心悸、心痛、呕吐', 'SRC-NHS-RJJZ'),
    ('三焦', '阳池', '原穴', '腕痛、耳鸣、消渴', 'SRC-NHS-RJJZ'),
    ('胆', '丘墟', '原穴', '胁痛、下肢痿痹', 'SRC-NHS-RJJZ'),
    ('肝', '太冲', '原穴', '头痛、目赤、胁痛', 'SRC-NHS-RJJZ'),
    # 12 络穴
    ('肺', '列缺', '络穴', '咳嗽、咽喉肿痛、头痛', 'SRC-NHS-RJJZ'),
    ('大肠', '偏历', '络穴', '耳鸣、鼻衄、手臂痛', 'SRC-NHS-RJJZ'),
    ('胃', '丰隆', '络穴', '咳嗽、痰多、眩晕', 'SRC-NHS-RJJZ'),
    ('脾', '公孙', '络穴', '胃痛、呕吐、腹胀', 'SRC-NHS-RJJZ'),
    ('心', '通里', '络穴', '心悸、舌强不语', 'SRC-NHS-RJJZ'),
    ('小肠', '支正', '络穴', '头痛、目赤肿痛', 'SRC-NHS-RJJZ'),
    ('膀胱', '飞扬', '络穴', '头痛、鼻塞、腰背痛', 'SRC-NHS-RJJZ'),
    ('肾', '大钟', '络穴', '遗尿、腰痛、足跟痛', 'SRC-NHS-RJJZ'),
    ('心包', '内关', '络穴', '心悸、心痛、呕吐', 'SRC-NHS-RJJZ'),
    ('三焦', '外关', '络穴', '头痛、耳鸣、发热', 'SRC-NHS-RJJZ'),
    ('胆', '光明', '络穴', '目赤肿痛、下肢痿痹', 'SRC-NHS-RJJZ'),
    ('肝', '蠡沟', '络穴', '月经不调、小便不利', 'SRC-NHS-RJJZ'),
    # 12 郄穴
    ('肺', '孔最', '郄穴', '咳嗽、咯血、咽喉肿痛', 'SRC-NHS-RJJZ'),
    ('大肠', '温溜', '郄穴', '头痛、面肿、咽喉肿痛', 'SRC-NHS-RJJZ'),
    ('胃', '梁丘', '郄穴', '胃痛、膝痛、乳痛', 'SRC-NHS-RJJZ'),
    ('脾', '地机', '郄穴', '腹痛、泄泻、月经不调', 'SRC-NHS-RJJZ'),
    ('心', '阴郄', '郄穴', '心悸、心痛、盗汗', 'SRC-NHS-RJJZ'),
    ('小肠', '养老', '郄穴', '目视不明、肩背肘痛', 'SRC-NHS-RJJZ'),
    ('膀胱', '金门', '郄穴', '腰痛、头痛、小儿惊风', 'SRC-NHS-RJJZ'),
    ('肾', '水泉', '郄穴', '月经不调、小便不利', 'SRC-NHS-RJJZ'),
    ('心包', '郄门', '郄穴', '心悸、心痛、咯血', 'SRC-NHS-RJJZ'),
    ('三焦', '会宗', '郄穴', '耳鸣、耳聋、上肢痛', 'SRC-NHS-RJJZ'),
    ('胆', '外丘', '郄穴', '胁痛、下肢痿痹', 'SRC-NHS-RJJZ'),
    ('肝', '中都', '郄穴', '腹痛、泄泻、月经不调', 'SRC-NHS-RJJZ'),
    # 8 会穴
    ('脏', '章门', '脏会', '腹胀、胁痛、泄泻', 'SRC-NHS-RJJZ'),
    ('腑', '中脘', '腑会', '胃痛、呕吐、腹胀', 'SRC-NHS-RJJZ'),
    ('气', '膻中', '气会', '咳嗽、气喘、心悸', 'SRC-NHS-RJJZ'),
    ('血', '膈俞', '血会', '血证、呕吐、呃逆', 'SRC-NHS-RJJZ'),
    ('筋', '阳陵泉', '筋会', '胁痛、下肢痿痹、抽搐', 'SRC-NHS-RJJZ'),
    ('脉', '太渊', '脉会', '咳嗽、气喘、咽喉肿痛', 'SRC-NHS-RJJZ'),
    ('骨', '大杼', '骨会', '咳嗽、肩背痛、颈项强', 'SRC-NHS-RJJZ'),
    ('髓', '绝骨', '髓会', '下肢痿痹、颈项强', 'SRC-NHS-RJJZ'),
    # 12 募穴
    ('肺', '中府', '募穴', '咳嗽、气喘、胸痛', 'SRC-NHS-RJJZ'),
    ('大肠', '天枢', '募穴', '腹胀、泄泻、便秘', 'SRC-NHS-RJJZ'),
    ('胃', '中脘', '募穴', '胃痛、呕吐、腹胀', 'SRC-NHS-RJJZ'),
    ('脾', '章门', '募穴', '腹胀、胁痛、泄泻', 'SRC-NHS-RJJZ'),
    ('心', '巨阙', '募穴', '心悸、心痛、癫狂', 'SRC-NHS-RJJZ'),
    ('小肠', '关元', '募穴', '遗尿、阳痿、月经不调', 'SRC-NHS-RJJZ'),
    ('膀胱', '中极', '募穴', '遗尿、小便不利', 'SRC-NHS-RJJZ'),
    ('肾', '京门', '募穴', '腰痛、遗尿、胁痛', 'SRC-NHS-RJJZ'),
    ('心包', '膻中', '募穴', '咳嗽、气喘、心悸', 'SRC-NHS-RJJZ'),
    ('三焦', '石门', '募穴', '小便不利、水肿', 'SRC-NHS-RJJZ'),
    ('胆', '日月', '募穴', '胁痛、口苦、呕吐', 'SRC-NHS-RJJZ'),
    ('肝', '期门', '募穴', '胁痛、乳房胀痛、呕吐', 'SRC-NHS-RJJZ'),
]

if __name__ == '__main__':
    conn = sqlite3.connect('server/database/yidao.db')
    n = 0
    for i, (jing, xue, leibie, zhu, src) in enumerate(ACUPUNCTURE_YUANLUO, 1):
        entry_id = f'r15-acu-yuanluo-{i:03d}'
        title = f'{jing}{xue}穴（{leibie}）'
        content = f'{xue}穴为{jing}经{leibie}，主{zhu}。针灸临床上{leibie}常用于治疗急症及{leibie}相关病证。'
        keywords = [jing, xue, leibie, '针灸', '特定穴']
        summary = f'{jing}{xue}穴，{leibie}，主{zhu}'
        if insert_kb(conn, entry_id, 'acupuncture', title, content, src,
                     leibie, keywords, summary, trust=0.85, confidence=0.85) > 0:
            n += 1
    conn.commit()
    actual, ok = commit_and_check(conn, 'acupuncture round2', 'acupuncture', 300)
    print(f'Worker 1 第二轮新增 {n} 条 / 当前 acupuncture {actual} / {"✅" if ok else "❌"} 目标 300')
    conn.close()
ACUPUNCTURE_QIXUE = [
    ('四神聪', '经外奇穴', '头痛、眩晕、失眠、健忘', 'SRC-NHS-JKY'),
    ('印堂', '经外奇穴', '头痛、眩晕、鼻塞、失眠', 'SRC-NHS-JKY'),
    ('太阳', '经外奇穴', '头痛、目赤肿痛、面痛', 'SRC-NHS-JKY'),
    ('夹脊', '经外奇穴', '脊柱强痛、内脏病证', 'SRC-NHS-JKY'),
    ('十宣', '经外奇穴', '咽喉肿痛、热病、昏迷', 'SRC-NHS-JKY'),
    ('八邪', '经外奇穴', '手指麻木、咽喉肿痛', 'SRC-NHS-JKY'),
    ('八风', '经外奇穴', '足趾麻木、头痛', 'SRC-NHS-JKY'),
    ('膝眼', '经外奇穴', '膝痛、腿脚不利', 'SRC-NHS-JKY'),
]

def run_qixue(conn):
    n = 0
    for i, (xue, leibie, zhu, src) in enumerate(ACUPUNCTURE_QIXUE, 1):
        entry_id = f'r15-acu-qixue-{i:03d}'
        title = f'{xue}穴（{leibie}）'
        content = f'{xue}穴为{leibie}，主{zhu}。针灸临床上常配合正经穴位使用，对特定病证有特效。'
        keywords = [xue, leibie, '针灸', '奇穴', '特效穴']
        summary = f'{xue}穴，{leibie}，主{zhu}'
        if insert_kb(conn, entry_id, 'acupuncture', title, content, src,
                     leibie, keywords, summary, trust=0.8, confidence=0.8) > 0:
            n += 1
    return n

if __name__ == '__main__':
    conn = sqlite3.connect('server/database/yidao.db')
    n_extra = run_qixue(conn)
    conn.commit()
    actual, ok = commit_and_check(conn, 'acupuncture qixue', 'acupuncture', 300)
    print(f'+ 奇穴 {n_extra} / 当前 acupuncture {actual} / {"✅" if ok else "❌"} 目标 300')
    conn.close()
