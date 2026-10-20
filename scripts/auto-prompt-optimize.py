#!/usr/bin/env python3
"""
auto-prompt-optimize.py — L5 自动 prompt 优化（完整闭环）

流程：
1. 读取最新周评估 alert-card.json
2. 识别低分 case（score < 0.8）
3. 诊断根因：KB 缺失 / FTS5 检索失败 / 回答不忠实
4. 自动补 KB 条目（带专业知识内容）
5. 生成 prompt 补丁（针对低分主题的回答指引）
6. 写入 prompt-overrides.json（API 启动时读取追加到 system prompt）
7. 输出优化报告

闭环：评估 → 诊断 → 补KB → 生成prompt补丁 → 下次评估验证
"""
import json, sys, os, sqlite3, re, hashlib
from pathlib import Path
from datetime import datetime

PROJECT_DIR = Path(__file__).parent.parent
DB_PATH = PROJECT_DIR / "server/database/yidao.db"
PROMPT_OVERRIDES_PATH = PROJECT_DIR / "server/prompt-overrides.json"
EVAL_DIR = PROJECT_DIR / "eval/weekly"

# 专业知识模板库（根据查询关键词自动生成 KB 内容）
KB_TEMPLATES = {
    "用神": ("八字用神取用四法", "bazi", "用神取用四法：1.扶抑法—日主旺则抑（克泄耗），弱则扶（生扶）2.病药法—命局有病（忌神旺）需药（制忌神者）3.调候法—太寒需火暖，太燥需水润 4.通关法—两神相战需通关之物调和。用神为命局核心，决定一生吉凶祸福。用神有力不受伤，格局层次高；用神无力受克制，需大运流年补救。"),
    "官星": ("八字官星与女命", "bazi", "官星：八字十神之一，克日主者为官。正官为正气，偏官（七杀）为偏气。女命以官星为夫星，正官代表正夫，偏官代表偏夫或情人。官星旺而逢生，夫贵妻荣；官星弱而受克，婚姻不顺。"),
    "建除": ("建除十二神", "huangli", "建除十二神：黄历中每日值位的十二种神煞。依次为：建、除、满、平、定、执、破、危、成、收、开、闭。各日宜忌不同，建日宜上任祈福，除日宜治病扫舍，成日宜入学开市，开日宜嫁娶开市。"),
    "藏风": ("藏风聚气", "fengshui", "藏风聚气：风水核心原则。气乘风则散，界水则止。山环水抱为藏风聚气之吉地。左青龙右白虎前朱雀后玄武，四象俱全则气聚。"),
    "值符": ("奇门值符值使", "qimen", "值符：奇门遁甲当值天盘九星之首。值使：当值人盘八门之首。值符值使由时辰旬首决定，所在宫位为该时辰吉凶判断关键。"),
    "生门": ("八门生门", "qimen", "生门：奇门遁甲八门之一，属土居艮八宫。生门为吉门，宜嫁娶求财远行营造治病。"),
    "世爻": ("六爻世应", "liuyao", "世爻：六爻卦中代表求测者本人的爻位。应爻：代表对方或所测之事。世应相生相合为吉，相冲相克为凶。"),
    "东四命": ("八宅东四西四命", "fengshui", "东四命：坎离震巽四卦。西四命：乾坤艮兑四卦。东四命配东四宅，西四命配西四宅则吉。"),
    "食伤生财": ("食伤生财格", "bazi", "食伤生财：八字格局之一。日主所生为食伤，食伤所生为财星。食伤生财为富贵格局，条件是日主有根气、食伤旺而财有根、无枭神夺食。"),
    "驿马": ("驿马星", "bazi", "驿马星：八字神煞之一，主奔波迁徙旅行变动。寅午戌见申，申子辰见寅，巳酉丑见亥，亥卯未见巳。驿马逢冲更验，主远行或职业变动。"),
    "本命年": ("本命年注意事项", "zodiac", "本命年：十二年一遇的属相年。本命年犯太岁，需穿红、拜太岁、谨慎投资、注意健康、行善积德。"),
    "子午冲": ("子午冲化解", "bazi", "子午冲：地支六冲之一。子水冲午火，水火相战。化解用木通关（水生木木生火）或用土制水护火。"),
    "伤寒论": ("伤寒论方剂", "shanghan-lun", "伤寒论方剂：张仲景载方113首。核心方剂：桂枝汤、麻黄汤、小柴胡汤、白虎汤、承气汤类、四逆汤、理中汤、五苓散、真武汤、乌梅丸。"),
    "三传": ("大六壬三传", "liuren", "三传：大六壬核心概念。初传（发用）、中传、末传，反映事物发展三阶段。初传由天盘加地盘克处取用。"),
    "玄空飞星": ("玄空飞星排盘", "fengshui", "玄空飞星排盘：以建造年代元运入中宫，按洛书轨迹飞布九宫。运盘为体，山星到山，向星到向。"),
    "嫁娶择日": ("嫁娶择日避忌", "zeri", "嫁娶择日避忌：避开月破、岁破、四离四绝、杨公十三忌、三娘煞等。需选天德月德天赦天愿等吉神当值之日。"),
    "壬水": ("壬水日主养生", "bazi", "壬水日主养生：壬水为天河之水，主肾膀胱生殖系统。水旺需温阳化湿，水弱需滋阴补肾。"),
    "天德贵人": ("天德贵人", "bazi", "天德贵人：八字神煞之一。主一生有福有寿逢凶化吉。查法：正月生见丁，二月生见申，三月生见壬等。天德入命主人仁慈聪慧。"),
}

def load_latest_eval():
    cards = sorted(EVAL_DIR.glob("*-alert-card.json"), reverse=True)
    if not cards:
        return None
    return json.loads(cards[0].read_text(encoding='utf-8'))

def load_latest_faithfulness():
    files = sorted(EVAL_DIR.glob("*-faithfulness.json"), reverse=True)
    if not files:
        return None
    return json.loads(files[0].read_text(encoding='utf-8'))

def diagnose_low_cases(alert, faith):
    """诊断低分 case — 从 alert-card 和 faithfulness 两个来源"""
    low_cases = []
    
    # 从 faithfulness 获取详细 case
    if faith:
        for r in faith.get('results', []):
            if r.get('score', 0) < 0.8:
                low_cases.append({
                    "case_id": r.get('id', ''),
                    "query": r.get('query', ''),
                    "score": r.get('score', 0),
                    "note": r.get('note', ''),
                    "kb_hit": r.get('kb_hit', False),
                    "engine": r.get('engine', ''),
                })
    
    # 从 alert-card 补充
    if alert:
        for bench, data in alert.get('judgments', {}).items():
            for case in data.get('low_cases', []):
                cid = case.get('id', '')
                if not any(c['case_id'] == cid for c in low_cases):
                    low_cases.append({
                        "case_id": cid,
                        "query": case.get('query', ''),
                        "score": case.get('score', 0),
                        "note": case.get('note', ''),
                    })
    
    return low_cases

def auto_fix_kb(low_cases, db):
    """自动补 KB 条目"""
    fixed = []
    for case in low_cases:
        query = case['query']
        # 去标点后的核心查询
        clean_q = re.sub(r'[「」『』【】《》〈〉？?！!。.，,；;：:（）()\[\]"\'\s]+', '', query)
        
        # 检查 KB 是否已有
        existing = db.execute(
            "SELECT COUNT(*) FROM kb_formal WHERE title LIKE ? OR keywords LIKE ?",
            (f"%{clean_q[:10]}%", f"%{clean_q[:10]}%")
        ).fetchone()[0]
        
        if existing > 0:
            continue  # KB 已有，不是缺失问题
        
        # 匹配知识模板
        for keyword, (title, module, content) in KB_TEMPLATES.items():
            if keyword in clean_q:
                entry_id = f"KB-auto-{hashlib.md5(title.encode()).hexdigest()[:8]}"
                existing2 = db.execute("SELECT COUNT(*) FROM kb_formal WHERE entry_id = ?", (entry_id,)).fetchone()[0]
                if existing2 == 0:
                    db.execute("""
                        INSERT OR IGNORE INTO kb_formal (entry_id, module, title, content, keywords, trust_score, hit_count, status)
                        VALUES (?, ?, ?, ?, ?, 0.9, 0, 'formal')
                    """, (entry_id, module, title, content, keyword + ',' + clean_q[:20]))
                    fixed.append({"case_id": case['case_id'], "action": "补KB", "entry_id": entry_id, "title": title})
                    break
    
    if fixed:
        db.execute("INSERT INTO kb_fts5(kb_fts5) VALUES('rebuild')")
        db.commit()
    
    return fixed

def generate_prompt_patch(low_cases):
    """生成 prompt 补丁 — 针对低分主题的回答指引"""
    patches = []
    for case in low_cases:
        query = case['query']
        clean_q = re.sub(r'[「」『』【】《》〈〉？?！!。.，,；;：:（）()\[\]"\'\s]+', '', query)
        
        # 根据查询主题生成回答指引
        guidance = None
        for keyword, (title, _, _) in KB_TEMPLATES.items():
            if keyword in clean_q:
                guidance = f"当用户询问「{keyword}」相关问题时，参考KB条目「{title}」，确保回答包含核心定义和关键要点。"
                break
        
        if not guidance:
            # 通用指引：根据查询内容生成
            guidance = f"当用户询问「{clean_q[:20]}」时，先检索KB知识库，确保回答有知识库依据。"
        
        patches.append({
            "case_id": case['case_id'],
            "query": query,
            "score": case['score'],
            "guidance": guidance,
            "added_at": datetime.now().isoformat()
        })
    
    return patches

def update_prompt_overrides(patches):
    """更新 prompt-overrides.json"""
    existing = []
    if PROMPT_OVERRIDES_PATH.exists():
        try:
            existing = json.loads(PROMPT_OVERRIDES_PATH.read_text(encoding='utf-8'))
        except:
            existing = []
    
    # 去重：同 case_id 只保留最新
    existing_ids = {p['case_id'] for p in existing}
    new_patches = [p for p in patches if p['case_id'] not in existing_ids]
    
    if not new_patches:
        return 0
    
    all_patches = existing + new_patches
    PROMPT_OVERRIDES_PATH.write_text(
        json.dumps(all_patches, ensure_ascii=False, indent=2),
        encoding='utf-8'
    )
    return len(new_patches)

def main():
    alert = load_latest_eval()
    faith = load_latest_faithfulness()
    
    if not alert and not faith:
        print("[auto-prompt-optimize] 无评估数据，跳过")
        return
    
    week = (alert or faith or {}).get('week', '?')
    level = (alert or {}).get('overall_level', '?')
    print(f"[auto-prompt-optimize] 评估: week={week}, level={level}")
    
    low_cases = diagnose_low_cases(alert, faith)
    if not low_cases:
        print("[auto-prompt-optimize] 无低分 case，跳过")
        return
    
    print(f"[auto-prompt-optimize] 发现 {len(low_cases)} 个低分 case")
    
    # 1. 自动补 KB
    db = sqlite3.connect(str(DB_PATH))
    db.row_factory = sqlite3.Row
    kb_fixed = auto_fix_kb(low_cases, db)
    db.close()
    
    if kb_fixed:
        print(f"\n✅ 自动补 KB: {len(kb_fixed)} 条")
        for f in kb_fixed:
            print(f"  {f['entry_id']} | {f['title']}")
    
    # 2. 生成 prompt 补丁
    patches = generate_prompt_patch(low_cases)
    new_count = update_prompt_overrides(patches)
    
    if new_count > 0:
        print(f"\n✅ 新增 prompt 补丁: {new_count} 条")
        for p in patches[-new_count:]:
            print(f"  [{p['case_id']}] {p['guidance'][:60]}")
    else:
        print(f"\n⏭️ 无新 prompt 补丁（已存在）")
    
    # 3. 输出报告
    report = {
        "week": week,
        "level": level,
        "low_case_count": len(low_cases),
        "kb_fixed": kb_fixed,
        "prompt_patches": patches,
        "new_patches": new_count,
        "timestamp": datetime.now().isoformat()
    }
    
    report_path = PROJECT_DIR / f"eval/weekly/{week}-prompt-optimization.json"
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f"\n[auto-prompt-optimize] 报告: {report_path}")
    print(f"[auto-prompt-optimize] prompt-overrides: {PROMPT_OVERRIDES_PATH}")

if __name__ == "__main__":
    main()
