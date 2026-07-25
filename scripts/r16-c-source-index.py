#!/usr/bin/env python3
"""R16-C source_index FK 启用 — 补登记 241 个 src_id
走 INSERT OR IGNORE 模式（src_id 是主键）
"""
import sqlite3, json
DB = '/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/server/database/yidao.db'

# 已知来源映射表（src_id → title/author/src_type/trust/tags/access_level）
SOURCE_META = {
    # LD 路氏一脉
    'SRC-LD-BZ':('路总·八字','路氏一脉','SRC-EXPERT',0.85,'["八字","子平","路氏"]','member'),
    'SRC-LD-LP':('路总·临证实践','路氏一脉','SRC-EXPERT',0.8,'["临证","中医","路氏"]','registered'),
    'SRC-LD-DIA':('路总·中医诊断','路氏一脉','SRC-EXPERT',0.75,'["中医","诊断","舌诊","脉诊"]','registered'),
    'SRC-LD-DLBZ':('路总·地理八宅','路氏一脉','SRC-EXPERT',0.8,'["地理","八宅","风水"]','member'),
    'SRC-LD-HJ':('路总·家居','路氏一脉','SRC-EXPERT',0.75,'["家居","风水","路氏"]','member'),
    'SRC-LD-HL':('路总·黄历','路氏一脉','SRC-EXPERT',0.8,'["黄历","择日","路氏"]','member'),
    'SRC-LD-LY':('路总·流年','路氏一脉','SRC-EXPERT',0.8,'["流年","八字","路氏"]','member'),
    'SRC-LD-MOB':('路总·手机','路氏一脉','SRC-EXPERT',0.7,'["手机","数字","路氏"]','registered'),
    'SRC-LD-SHJ':('路总·伤寒论','路氏一脉','SRC-EXPERT',0.85,'["伤寒论","经方","路氏"]','registered'),
    'SRC-LD-TS':('路总·太岁','路氏一脉','SRC-EXPERT',0.8,'["太岁","年运","路氏"]','member'),
    'SRC-LD-XM':('路总·姓名','路氏一脉','SRC-EXPERT',0.75,'["姓名","起名","路氏"]','registered'),
    'SRC-LD-YJ':('路总·阴宅','路氏一脉','SRC-EXPERT',0.8,'["阴宅","地理","风水"]','member'),
    'SRC-LD-YS':('路总·阳寿','路氏一脉','SRC-EXPERT',0.7,'["阳寿","寿元","路氏"]','registered'),
    'SRC-LD-ZR':('路总·择日','路氏一脉','SRC-EXPERT',0.8,'["择日","吉日","路氏"]','member'),
    'SRC-LD-FJ':('路总·方剂','路氏一脉','SRC-EXPERT',0.8,'["方剂","经方","路氏"]','registered'),
    # CLASSIC 经典
    'SRC-CLASSIC':('通用经典','佚名','SRC-BOOK',0.7,'["经典"]','public'),
    'SRC-CLASSIC-DIA':('中医诊断学','全国规划教材','SRC-BOOK',0.7,'["中医","诊断","教材"]','public'),
    'SRC-CLASSIC-JG':('金匮要略','张仲景','SRC-BOOK',0.95,'["金匮","经方","经典"]','public'),
    'SRC-CLASSIC-SHJ':('伤寒论','张仲景','SRC-BOOK',0.95,'["伤寒","经方","经典"]','public'),
    'SRC-CLASSIC-TCM':('中医基础理论','全国规划教材','SRC-BOOK',0.7,'["中医","基础","教材"]','public'),
    'SRC-CLASSIC-ZJ':('针灸学','全国规划教材','SRC-BOOK',0.75,'["针灸","经络","教材"]','public'),
    # NHS 倪海厦
    'SRC-NHS-BGBZ':('倪师·八纲辨证','倪海厦','SRC-COURSE',0.85,'["八纲","辨证","倪师"]','registered'),
    'SRC-NHS-DIA':('倪师·中医诊断','倪海厦','SRC-COURSE',0.85,'["诊断","舌诊","倪师"]','registered'),
    'SRC-NHS-DJ':('倪师·大纪','倪海厦','SRC-COURSE',0.8,'["大纪","针灸","倪师"]','registered'),
    'SRC-NHS-FY':('倪师·扶阳','倪海厦','SRC-COURSE',0.85,'["扶阳","经方","倪师"]','registered'),
    'SRC-NHS-JF':('倪师·金匮','倪海厦','SRC-COURSE',0.85,'["金匮","经方","倪师"]','registered'),
    'SRC-NHS-JK':('倪师·金匮要略','倪海厦','SRC-COURSE',0.85,'["金匮","经方","倪师"]','registered'),
    'SRC-NHS-JKY':('倪师·金匮药要','倪海厦','SRC-COURSE',0.85,'["金匮","药要","倪师"]','registered'),
    'SRC-NHS-RJJZ':('倪师·人纪针灸','倪海厦','SRC-COURSE',0.85,'["人纪","针灸","倪师"]','registered'),
    'SRC-NHS-SHL':('倪师·伤寒论','倪海厦','SRC-COURSE',0.9,'["伤寒","经方","倪师"]','registered'),
    # COURSE
    'SRC-COURSE-007':('课程·舒晗','舒晗老师','SRC-COURSE',0.8,'["舒晗","命理"]','registered'),
    'SRC-COURSE-008':('课程·路氏','路氏一脉','SRC-COURSE',0.8,'["路氏"]','registered'),
    'SRC-COURSE-009':('课程·专家','专家','SRC-COURSE',0.75,'["专家"]','registered'),
    'SRC-COURSE-CAIBO':('课程·蔡伯未','蔡伯未','SRC-COURSE',0.75,'["蔡伯未","命理"]','registered'),
    'SRC-COURSE-CHUANGYE':('课程·创业','创业课','SRC-COURSE',0.7,'["创业"]','registered'),
    'SRC-COURSE-LUZONG-LIUNIAN-2025':('路总·流年2025','路氏一脉','SRC-COURSE',0.85,'["流年","2025","路总"]','member'),
    # BOOK
    'SRC-BOOK-017':('未知典籍17','佚名','SRC-BOOK',0.7,'["古籍"]','public'),
    'SRC-BOOK-018':('未知典籍18','佚名','SRC-BOOK',0.7,'["古籍"]','public'),
    'SRC-BOOK-020':('未知典籍20','佚名','SRC-BOOK',0.7,'["古籍"]','public'),
    # SRC-EXPERT
    'SRC-EXPERT-007':('专家7','专家','SRC-EXPERT',0.7,'["专家"]','registered'),
    # USR 数据
    'SRC-USER-SUBMIT':('用户提交','用户','SRC-USER',0.5,'["用户","提交"]','registered'),
}

def register():
    conn = sqlite3.connect(DB)
    c = conn.cursor()
    # 取所有 kb_formal 用到的 src_id
    used_src_ids = [r[0] for r in c.execute("SELECT DISTINCT src_id FROM kb_formal WHERE src_id IS NOT NULL").fetchall()]
    print(f'kb_formal 用到的 src_id 去重后: {len(used_src_ids)} 个')
    # 加上 LEGACY / IMPORT / r48 / src-shiye 等未注册
    # 已经在 source_index 的 跳过
    existing = {r[0] for r in c.execute("SELECT src_id FROM source_index").fetchall()}
    print(f'source_index 已注册: {len(existing)} 个')
    
    to_register = [s for s in used_src_ids if s not in existing]
    # 补全 source_index 表对 LEGACY-001~061 等的统一处理
    print(f'待注册: {len(to_register)} 个')
    registered = 0
    src_meta_by_id = {**SOURCE_META}
    
    for sid in to_register:
        if not sid: continue
        if sid in SOURCE_META:
            title, author, src_type, trust, tags, access = SOURCE_META[sid]
        elif sid.startswith('SRC-LEGACY-'):
            n = sid.split('-')[2]
            title = f'Legacy知识库-{n}'
            author = 'Legacy'
            src_type = 'SRC-LEGACY'
            trust = 0.7
            tags = '["legacy"]'
            access = 'member'
        elif sid.startswith('SRC-IMPORT-'):
            sub = sid.replace('SRC-IMPORT-', '')
            title = f'导入资料-{sub}'
            author = 'Import'
            src_type = 'SRC-IMPORT'
            trust = 0.6
            tags = '["import"]'
            access = 'registered'
        elif sid.startswith('SRC-r48_'):
            sub = sid.replace('SRC-r48_', '')
            title = f'R48-{sub}'
            author = 'R48'
            src_type = 'SRC-RESEARCH'
            trust = 0.6
            tags = '["r48"]'
            access = 'registered'
        elif sid.startswith('src-'):
            sub = sid.replace('src-', '')
            title = f'客户源-{sub}'
            author = 'Client'
            src_type = 'SRC-CLIENT'
            trust = 0.6
            tags = '["client"]'
            access = 'registered'
        elif sid.startswith('密宗天纪') or sid.startswith('舒晗'):
            title = sid
            author = '舒晗'
            src_type = 'SRC-EXPERT'
            trust = 0.8
            tags = '["舒晗","课程"]'
            access = 'registered'
        else:
            title = sid
            author = 'Unknown'
            src_type = 'SRC-OTHER'
            trust = 0.5
            tags = '["unknown"]'
            access = 'public'
        try:
            c.execute("""INSERT OR IGNORE INTO source_index 
                (src_id, src_type, title, author, trust_score, tags, access_level) 
                VALUES (?, ?, ?, ?, ?, ?, ?)""", (sid, src_type, title, author, trust, tags, access))
            if c.rowcount > 0:
                registered += 1
        except Exception as e:
            print(f'  ✖ {sid}: {e}')
    conn.commit()
    total = c.execute("select count() from source_index").fetchone()[0]
    print(f'注册后 source_index 总条数: {total} (新增 {registered})')
    
    # 验证 FK 关系：所有 kb_formal.src_id 都在 source_index 里
    orphan = c.execute("""
        SELECT count(DISTINCT k.src_id) FROM kb_formal k 
        LEFT JOIN source_index s ON k.src_id = s.src_id
        WHERE k.src_id IS NOT NULL AND s.src_id IS NULL
    """).fetchone()[0]
    print(f'KB 中仍未注册 src_id 数（孤儿）: {orphan}')
    
    conn.close()

if __name__ == '__main__':
    register()