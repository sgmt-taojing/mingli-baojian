#!/usr/bin/env python3
"""
generate-combinatorial-sft.py · 组合爆炸 SFT Case 生成器 v2

将 KB 知识按多维度交叉组合，生成大规模高质量 SFT 训练数据。
组合维度：模块 × 角色 × 场景 × 深度 → 组合爆炸

用法：python3 scripts/generate-combinatorial-sft.py
输出：training-data/sft-gold-cases/0004-combinatorial.jsonl
"""

import sqlite3
import json
import random
from pathlib import Path
from datetime import datetime

PROJECT_DIR = Path(__file__).resolve().parent.parent
DB_PATH = PROJECT_DIR / 'server' / 'database' / 'yidao.db'
OUT_DIR = PROJECT_DIR / 'training-data' / 'sft-gold-cases'

random.seed(2026)

# ========== 合规红线 ==========
FORBIDDEN = [
    '一定', '绝对', '命中注定', '必死', '必灾', '必凶',
    '癌症', '肿瘤', '艾滋', '死刑', '死期',
    '你注定', '命中犯', '天煞孤星',
]

def clean(text):
    for w in FORBIDDEN:
        text = text.replace(w, {'一定':'通常','绝对':'一般','必死':'风险较高','必灾':'需注意','必凶':'需谨慎'}.get(w, ''))
    return text

# ========== 组合维度 ==========

# 场景模板（每个模块 × 多场景 = 多条 Case）
SCENE_TEMPLATES = {
    'bazi': [
        # 场景：初学者理解
        {'q': '请用通俗的语言解释一下八字中的{kw}', 'scene': '入门科普', 'depth': '浅'},
        {'q': '八字里的{kw}到底是什么？用大白话说说', 'scene': '入门科普', 'depth': '浅'},
        # 场景：深度应用
        {'q': '八字{kw}在实际排盘中怎么分析？请详细说明', 'scene': '深度应用', 'depth': '深'},
        {'q': '日主{kw}的人，在事业选择上有什么建议？', 'scene': '事业指导', 'depth': '中'},
        {'q': '女命八字带{kw}，婚姻方面需要注意什么？', 'scene': '婚姻分析', 'depth': '中'},
        {'q': '八字{kw}对流年运势有什么影响？', 'scene': '流年分析', 'depth': '中'},
        # 场景：对比辨析
        {'q': '八字中的{kw}和常见的类似概念有什么区别？', 'scene': '对比辨析', 'depth': '深'},
        # 场景：化解建议
        {'q': '如果八字中{kw}偏弱，有什么改善建议？', 'scene': '化解指导', 'depth': '中'},
    ],
    'ziwei': [
        {'q': '紫微斗数{kw}是什么？请通俗易懂地解释', 'scene': '入门科普', 'depth': '浅'},
        {'q': '紫微{kw}入命宫的人性格特点是什么？', 'scene': '性格分析', 'depth': '中'},
        {'q': '紫微{kw}在事业宫代表什么？适合什么工作？', 'scene': '事业指导', 'depth': '中'},
        {'q': '紫微盘里{kw}化忌会怎样？如何化解？', 'scene': '化解指导', 'depth': '深'},
        {'q': '请详细分析紫微{kw}的星曜组合意义', 'scene': '深度应用', 'depth': '深'},
    ],
    'qimen': [
        {'q': '奇门遁甲{kw}是什么意思？', 'scene': '入门科普', 'depth': '浅'},
        {'q': '奇门局中{kw}的吉凶如何判断？请详细说明', 'scene': '深度应用', 'depth': '深'},
        {'q': '奇门{kw}在实际预测中怎么运用？', 'scene': '实战应用', 'depth': '中'},
    ],
    'fengshui': [
        {'q': '风水中的{kw}是什么意思？', 'scene': '入门科普', 'depth': '浅'},
        {'q': '家居布置中{kw}有什么讲究？', 'scene': '居家应用', 'depth': '中'},
        {'q': '风水{kw}不好怎么化解？请给实用建议', 'scene': '化解指导', 'depth': '中'},
    ],
    'liuyao': [
        {'q': '六爻中{kw}是什么意思？请解释', 'scene': '入门科普', 'depth': '浅'},
        {'q': '六爻断卦时{kw}怎么分析？请详细讲解', 'scene': '深度应用', 'depth': '深'},
        {'q': '六爻{kw}的实际断卦要点是什么？', 'scene': '实战应用', 'depth': '中'},
    ],
    'meihua': [
        {'q': '梅花易数的{kw}怎么理解？', 'scene': '入门科普', 'depth': '浅'},
        {'q': '梅花{kw}在体用分析中起什么作用？', 'scene': '深度应用', 'depth': '深'},
    ],
    'tcm': [
        {'q': '中医说的{kw}是什么意思？用通俗话解释', 'scene': '入门科普', 'depth': '浅'},
        {'q': '{kw}的中医辨证要点是什么？请详细分析', 'scene': '辨证论治', 'depth': '深'},
        {'q': '{kw}平时怎么调理？饮食起居有什么建议？', 'scene': '养生指导', 'depth': '中'},
        {'q': '{kw}和类似证型怎么区分？', 'scene': '对比辨析', 'depth': '深'},
    ],
    'huangdi-neijing': [
        {'q': '《黄帝内经》怎么论述{kw}的？', 'scene': '经典研读', 'depth': '中'},
        {'q': '《内经》关于{kw}的理论对现代养生有什么启发？', 'scene': '养生应用', 'depth': '中'},
        {'q': '请深入讲解《黄帝内经》中{kw}的原文含义', 'scene': '经典研读', 'depth': '深'},
    ],
    'shanghan-lun': [
        {'q': '《伤寒论》中{kw}的辨证要点是什么？', 'scene': '经典研读', 'depth': '中'},
        {'q': '伤寒论{kw}方在临床怎么运用？', 'scene': '方证应用', 'depth': '深'},
        {'q': '请解释《伤寒论》{kw}的病机', 'scene': '病机分析', 'depth': '深'},
    ],
    'tcm-fangji': [
        {'q': '{kw}这个方剂的组成和功效是什么？', 'scene': '方剂学习', 'depth': '中'},
        {'q': '{kw}适用于什么症状？有什么注意事项？', 'scene': '临床应用', 'depth': '中'},
        {'q': '{kw}和类似方剂怎么区别使用？', 'scene': '方剂对比', 'depth': '深'},
    ],
    'acupuncture': [
        {'q': '针灸{kw}穴的位置和功效是什么？', 'scene': '穴位学习', 'depth': '浅'},
        {'q': '{kw}穴临床怎么配伍使用？', 'scene': '临床配穴', 'depth': '深'},
    ],
    'shennong-bencao': [
        {'q': '《神农本草经》中{kw}的药性怎么描述？', 'scene': '本草学习', 'depth': '中'},
        {'q': '{kw}在本草经中的临床应用是什么？', 'scene': '临床应用', 'depth': '中'},
    ],
    'wuxing': [
        {'q': '五行{kw}的基本特性是什么？', 'scene': '基础理论', 'depth': '浅'},
        {'q': '五行{kw}在命理分析中怎么运用？', 'scene': '实战应用', 'depth': '中'},
        {'q': '五行{kw}偏旺或偏弱会有什么表现？', 'scene': '应用分析', 'depth': '中'},
    ],
    'liuren': [
        {'q': '大六壬{kw}是什么意思？', 'scene': '入门科普', 'depth': '浅'},
        {'q': '六壬{kw}的课格分析要点是什么？', 'scene': '深度应用', 'depth': '深'},
    ],
    'yijing': [
        {'q': '《易经》{kw}的核心含义是什么？', 'scene': '经典研读', 'depth': '中'},
        {'q': '{kw}卦在实际预测中怎么运用？', 'scene': '实战应用', 'depth': '中'},
    ],
    'huajie': [
        {'q': '命理中{kw}方面有什么风险？如何化解？', 'scene': '化解指导', 'depth': '深'},
        {'q': '关于{kw}，有什么实用的改善建议？', 'scene': '化解指导', 'depth': '中'},
    ],
}

# 回复模板（按 depth 分层）
def make_reply(entry, scene, depth):
    title = entry.get('title', '')
    content = entry.get('content', '')
    module = entry.get('module', '')
    
    # 深度控制内容长度
    max_len = {'浅': 200, '中': 350, '深': 500}.get(depth, 300)
    if len(content) > max_len:
        # 找最后一个句号截断
        cut = content[:max_len]
        last_period = max(cut.rfind('。'), cut.rfind('；'), cut.rfind('，'))
        if last_period > max_len // 2:
            content = cut[:last_period + 1]
        else:
            content = cut + '...'
    
    # 按场景定制回复结构
    if scene in ('入门科普', '基础理论', '穴位学习'):
        prefix = f"简单来说，{title}可以这样理解：\n\n"
        suffix = "\n\n> 以上内容仅供学习参考。命理分析需结合个人实际排盘综合判断。"
    elif scene in ('深度应用', '实战应用', '临床配穴', '病机分析', '辨证论治'):
        prefix = f"## {title}\n\n"
        suffix = "\n\n> 以上分析基于传统理论，实际应用需结合专业医师或命理师的判断。"
    elif scene in ('化解指导', '养生指导'):
        prefix = f"关于{title}，以下几点建议供参考：\n\n"
        suffix = "\n\n> 以上建议仅供参考。如遇健康问题请及时就医，命理化解不能替代医疗。"
    elif scene in ('对比辨析', '方剂对比'):
        prefix = f"## {title}\n\n"
        suffix = "\n\n> 辨析以上异同需要结合具体情境，建议在专业指导下深入学习。"
    else:
        prefix = f"## {title}\n\n"
        suffix = "\n\n> 以上内容仅供学习参考。"
    
    body = content
    # 结构化：分点
    if depth in ('中', '深') and '。' in content:
        sentences = content.split('。')
        sentences = [s.strip() for s in sentences if s.strip()]
        if len(sentences) >= 3:
            body = '\n'.join(f'• {s}。' for s in sentences[:8])
    
    return clean(prefix + body + suffix)


def main():
    if not DB_PATH.exists():
        print(f"[ERROR] DB not found: {DB_PATH}")
        return
    
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    
    # 加载已有 Case 做 src_id 去重
    existing = set()
    for f in OUT_DIR.glob('*.jsonl'):
        for line in f.open():
            try:
                obj = json.loads(line)
                if 'src_id' in obj:
                    existing.add(obj['src_id'])
            except: pass
    
    # 按 module 从 KB 拉条目
    cases = []
    stats = {}
    
    for module, templates in SCENE_TEMPLATES.items():
        # 每个 module 拉最多 80 条 KB（截取有内容的）
        rows = cur.execute(
            "SELECT entry_id as id, title, content, module, src_id FROM kb_formal WHERE module=? AND length(content)>30 ORDER BY RANDOM() LIMIT 80",
            (module,)
        ).fetchall()
        
        if not rows:
            # 模块名可能不完全匹配，尝试 LIKE
            rows = cur.execute(
                "SELECT entry_id as id, title, content, module, src_id FROM kb_formal WHERE module LIKE ? AND length(content)>30 ORDER BY RANDOM() LIMIT 80",
                (f'%{module}%',)
            ).fetchall()
        
        module_count = 0
        for row in rows:
            for tpl in templates:
                kw = row['title'] or '此概念'
                # 截短关键词
                if len(kw) > 15:
                    kw = kw[:15]
                
                q = tpl['q'].format(kw=kw)
                scene = tpl['scene']
                depth = tpl['depth']
                
                src_id = f"{module}-{row['id']}-{scene}"
                if src_id in existing:
                    continue
                existing.add(src_id)
                
                a = make_reply(dict(row), scene, depth)
                
                # 合规检查
                violation = [w for w in FORBIDDEN if w in q or w in a]
                if violation:
                    continue
                
                cases.append({
                    'src_id': src_id,
                    'module': module,
                    'scene': scene,
                    'depth': depth,
                    'messages': [
                        {'role': 'system', 'content': '你是一个专业的命理与中医知识助手，回答基于传统理论，客观中立，不做绝对判断。'},
                        {'role': 'user', 'content': q},
                        {'role': 'assistant', 'content': a},
                    ]
                })
                module_count += 1
        
        stats[module] = module_count
    
    conn.close()
    
    # 去重已有序号
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out_file = OUT_DIR / '0004-combinatorial.jsonl'
    
    with out_file.open('w') as f:
        for c in cases:
            f.write(json.dumps(c, ensure_ascii=False) + '\n')
    
    print(f"[combinatorial] === 汇总 ===")
    print(f"[combinatorial] 总生成：{len(cases)} 条")
    print(f"[combinatorial] 输出：{out_file}")
    for m, n in sorted(stats.items(), key=lambda x: -x[1]):
        print(f"  {m}: {n} 条")


if __name__ == '__main__':
    main()
