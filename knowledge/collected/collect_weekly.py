#!/usr/bin/env python3
"""
易道智鉴公众号内容采集系统 - 周采集脚本
使用 AutoGLM WebSearch API 搜索各公众号最新文章
"""
import json
import os
import subprocess
import sys
import time
from datetime import datetime

WEBSEARCH_SCRIPT = os.path.expanduser("~/.openclaw-autoclaw/skills/autoglm-websearch/websearch.py")
COLLECT_DIR = os.path.expanduser("~/.openclaw-autoclaw/workspace/projects/mingli-baojian/knowledge/collected/2026-07-06")

# 公众号采集清单
COLLECT_TARGETS = {
    "佛教": [
        {"name": "普陀山", "queries": ["普陀山 法会 2026", "普陀山 佛教 最新", "普陀山 观音 祈福"]},
        {"name": "九华山", "queries": ["九华山 佛教 法会 2026", "九华山 地藏 最新消息", "九华山 寺院 新闻"]},
        {"name": "五台山", "queries": ["五台山 佛教 法会 2026", "五台山 文殊 最新", "五台山 寺院 新闻"]},
        {"name": "峨眉山", "queries": ["峨眉山 佛教 法会 2026", "峨眉山 普贤 最新", "峨眉山 寺院 开放"]},
        {"name": "灵隐寺", "queries": ["灵隐寺 法会 2026", "杭州灵隐寺 最新消息", "灵隐寺 佛学 开示"]},
        {"name": "少林寺", "queries": ["少林寺 法会 2026", "少林寺 禅修 最新", "少林寺 新闻 动态"]},
    ],
    "道教": [
        {"name": "武当山", "queries": ["武当山 道教 法会 2026", "武当山 道教文化 最新", "武当山 宫观 新闻"]},
        {"name": "龙虎山", "queries": ["龙虎山 道教 法会 2026", "龙虎山 天师道 最新", "龙虎山 符箓 文化"]},
        {"name": "青城山", "queries": ["青城山 道教 法会 2026", "青城山 道观 最新", "青城山 养生 功法"]},
        {"name": "白云观", "queries": ["北京白云观 道教 法会 2026", "白云观 全真道 最新", "白云观 道教活动"]},
        {"name": "道教之音", "queries": ["道教之音 最新文章 2026", "道教之音 道法讲座", "道教之音 道教新闻"]},
    ],
    "儒家": [
        {"name": "曲阜孔庙", "queries": ["曲阜孔庙 祭孔 2026", "曲阜孔庙 儒学 最新", "孔庙 活动 新闻"]},
        {"name": "岳麓书院", "queries": ["岳麓书院 儒学讲座 2026", "岳麓书院 书院文化 最新", "岳麓书院 活动 新闻"]},
        {"name": "国学精粹", "queries": ["国学精粹 论语解读 2026", "国学精粹 儒家文化 最新", "国学精粹 经典解读"]},
    ],
    "术数": [
        {"name": "周易研究", "queries": ["周易研究 易经讲解 2026", "周易研究 易学 最新", "周易 六爻 卦例 2026"]},
        {"name": "奇门遁甲研究", "queries": ["奇门遁甲研究 排盘 2026", "奇门遁甲 案例 最新", "奇门遁甲 化解 运筹"]},
        {"name": "风水文化", "queries": ["风水文化 风水布局 2026", "风水文化 玄空飞星 最新", "风水 阳宅 阴宅 2026"]},
        {"name": "八字命理", "queries": ["八字命理 排盘 2026", "八字命理 大运流年 最新", "八字命理 命理案例 2026"]},
        {"name": "老黄历", "queries": ["老黄历 每日宜忌 2026年7月", "老黄历 节气养生 2026", "老黄历 吉时方位 今日"]},
    ],
    "综合": [
        {"name": "中医养生", "queries": ["中医养生 节气养生 2026", "中医养生 黄帝内经 最新", "中医养生 药膳食疗 2026"]},
        {"name": "佛教在线", "queries": ["佛教在线 佛学讲座 2026", "佛教在线 法会通知 最新", "佛教在线 高僧开示"]},
        {"name": "传统文化", "queries": ["传统文化 二十四节气 2026", "传统文化 民俗节日 最新", "传统文化 非遗 文化传承"]},
    ],
}

# 重点关键词（用于活动日历筛选）
ACTIVITY_KEYWORDS = [
    "法会", "法事", "普渡", "超度", "祈福", "祭祖", "祭孔", "开光",
    "讲座", "开示", "禅修", "内观", "道场", "法讯", "通启", "通知",
    "活动", "典礼", "仪式", "节庆", "庆典", "论坛", "研讨",
    "开班", "招生", "报名", "法讯", "通知公告"
]

def run_websearch(query):
    """执行一次 web 搜索，返回 JSON 结果"""
    try:
        result = subprocess.run(
            ["python3", WEBSEARCH_SCRIPT, query],
            capture_output=True, text=True, timeout=60
        )
        if result.returncode == 0:
            return json.loads(result.stdout)
        else:
            print(f"  ⚠ 搜索失败: {result.stderr[:200]}", file=sys.stderr)
            return None
    except Exception as e:
        print(f"  ⚠ 搜索异常: {query} - {e}", file=sys.stderr)
        return None

def extract_results(data):
    """从 API 返回中提取搜索结果列表"""
    if not data or data.get("code") != 0:
        return []
    results = []
    try:
        for r in data["data"]["results"]:
            if "webPages" in r:
                results.extend(r["webPages"].get("value", []))
    except (KeyError, TypeError):
        pass
    return results

def is_activity_related(text):
    """判断文本是否与活动/法会相关"""
    text_lower = text.lower()
    return any(kw in text_lower for kw in ACTIVITY_KEYWORDS)

def collect_category(category_name, targets):
    """采集一个类别下所有公众号的内容"""
    category_results = {
        "category": category_name,
        "date": "2026-07-06",
        "accounts": {},
        "total_articles": 0,
        "activity_count": 0
    }
    
    for target in targets:
        name = target["name"]
        all_articles = []
        seen_urls = set()
        
        print(f"\n📡 正在采集: {category_name}/{name} ...")
        
        for query in target["queries"]:
            data = run_websearch(query)
            articles = extract_results(data)
            
            for art in articles:
                url = art.get("url", "")
                if url and url not in seen_urls:
                    seen_urls.add(url)
                    article = {
                        "title": art.get("name", ""),
                        "url": url,
                        "snippet": art.get("snippet", ""),
                        "source": art.get("media", ""),
                        "query": query,
                        "is_activity": is_activity_related(art.get("name", "") + art.get("snippet", ""))
                    }
                    all_articles.append(article)
            time.sleep(0.5)  # 避免请求过快
        
        # 保存单公众号 JSON
        json_path = os.path.join(COLLECT_DIR, f"{category_name}_{name}.json")
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump({
                "account": name,
                "category": category_name,
                "date": "2026-07-06",
                "article_count": len(all_articles),
                "articles": all_articles
            }, f, ensure_ascii=False, indent=2)
        
        activity_articles = [a for a in all_articles if a["is_activity"]]
        
        category_results["accounts"][name] = {
            "count": len(all_articles),
            "activity_count": len(activity_articles),
            "articles": all_articles[:10]  # 保留前10条用于报告
        }
        category_results["total_articles"] += len(all_articles)
        category_results["activity_count"] += len(activity_articles)
        
        print(f"  ✅ {name}: {len(all_articles)} 篇 (活动通知 {len(activity_articles)})")
    
    return category_results

def generate_category_md(category_name, category_data):
    """生成类别 Markdown 报告"""
    md = f"# {category_name}类公众号内容采集\n\n"
    md += f"**采集日期:** 2026-07-06\n"
    md += f"**采集公众号数:** {len(category_data['accounts'])}\n"
    md += f"**采集文章总数:** {category_data['total_articles']}\n"
    md += f"**活动通知数:** {category_data['activity_count']}\n\n"
    md += "---\n\n"
    
    for name, info in category_data["accounts"].items():
        md += f"## {name}\n\n"
        md += f"采集文章: {info['count']} 篇 | 活动通知: {info['activity_count']} 条\n\n"
        
        for i, art in enumerate(info["articles"][:10], 1):
            activity_tag = " 🔔[活动]" if art["is_activity"] else ""
            md += f"### {i}. {art['title']}{activity_tag}\n\n"
            md += f"- **摘要:** {art['snippet'][:200]}\n"
            md += f"- **链接:** {art['url']}\n"
            md += f"- **来源:** {art.get('source', '网络')}\n\n"
        
        md += "---\n\n"
    
    return md

def generate_activity_calendar(all_categories):
    """生成活动日历"""
    md = "# 佛道活动日历 - 2026年7月\n\n"
    md += "**更新日期:** 2026-07-06\n\n"
    md += "---\n\n"
    
    all_activities = []
    for cat_name, cat_data in all_categories.items():
        for acc_name, acc_info in cat_data["accounts"].items():
            for art in acc_info["articles"]:
                if art["is_activity"]:
                    all_activities.append({
                        "category": cat_name,
                        "account": acc_name,
                        "title": art["title"],
                        "snippet": art["snippet"],
                        "url": art["url"]
                    })
    
    md += f"本周共筛选出 **{len(all_activities)}** 条活动/法会/讲座相关通知。\n\n"
    
    # 按类别分组
    for cat in ["佛教", "道教", "儒家", "术数", "综合"]:
        cat_activities = [a for a in all_activities if a["category"] == cat]
        if not cat_activities:
            continue
        
        md += f"## {cat}活动\n\n"
        for i, act in enumerate(cat_activities[:15], 1):
            md += f"{i}. **{act['title']}** ({act['account']})\n"
            md += f"   - {act['snippet'][:150]}\n"
            md += f"   - [查看详情]({act['url']})\n\n"
        
        if len(cat_activities) > 15:
            md += f"... 及其他 {len(cat_activities) - 15} 条\n\n"
        
        md += "---\n\n"
    
    return md

def generate_weekly_report(all_categories, total_accounts, total_articles, total_activities):
    """生成周报"""
    md = "# 易道智鉴公众号内容采集周报\n\n"
    md += f"**采集日期:** 2026-07-06\n"
    md += f"**采集时间:** {datetime.now().strftime('%Y-%m-%d %H:%M')}\n"
    md += "**采集方式:** AutoGLM WebSearch API\n\n"
    md += "---\n\n"
    
    md += "## 📊 采集统计\n\n"
    md += "| 类别 | 公众号数 | 采集文章数 | 活动通知数 |\n"
    md += "|------|---------|------------|------------|\n"
    
    for cat in ["佛教", "道教", "儒家", "术数", "综合"]:
        if cat in all_categories:
            cat_data = all_categories[cat]
            acc_count = len(cat_data["accounts"])
            md += f"| {cat} | {acc_count} | {cat_data['total_articles']} | {cat_data['activity_count']} |\n"
    
    md += f"| **合计** | **{total_accounts}** | **{total_articles}** | **{total_activities}** |\n\n"
    
    md += "## 📋 采集公众号清单\n\n"
    for cat in ["佛教", "道教", "儒家", "术数", "综合"]:
        if cat in all_categories:
            cat_data = all_categories[cat]
            md += f"### {cat}\n"
            for name, info in cat_data["accounts"].items():
                md += f"- {name} ({info['count']} 条"
                if info["activity_count"] > 0:
                    md += f", 活动 {info['activity_count']} 条"
                md += ")\n"
            md += "\n"
    
    md += "## 🗓️ 活动通知摘要\n\n"
    md += f"本周共筛选出 **{total_activities}** 条活动/法会/讲座相关通知。\n\n"
    
    # 重点活动
    md += "### 重点活动\n\n"
    highlight_count = 0
    for cat in ["佛教", "道教", "儒家", "术数", "综合"]:
        if cat not in all_categories:
            continue
        for acc_name, acc_info in all_categories[cat]["accounts"].items():
            for art in acc_info["articles"][:5]:
                if art["is_activity"] and highlight_count < 15:
                    highlight_count += 1
                    md += f"{highlight_count}. **{art['title']}** ({cat}/{acc_name})\n"
                    md += f"   - {art['snippet'][:200]}\n\n"
    
    md += "## 📁 文件输出\n\n"
    md += "所有采集结果已存储至:\n"
    md += f"`{COLLECT_DIR}/`\n\n"
    md += "文件结构:\n"
    md += "- `{类别}_{公众号}.json` - 原始搜索结果\n"
    md += "- `2026-07-06_{类别}.md` - 分类整理文档\n"
    md += "- `2026-07-06_活动日历.md` - 活动通知汇总\n"
    md += "- `2026-07-06_周报.md` - 本周报\n\n"
    
    md += "## 📝 重点内容摘要\n\n"
    for cat in ["佛教", "道教", "儒家", "术数", "综合"]:
        if cat not in all_categories:
            continue
        cat_data = all_categories[cat]
        md += f"### {cat}\n\n"
        for acc_name, acc_info in cat_data["accounts"].items():
            md += f"- **{acc_info['articles'][0]['title']}** ({acc_name})\n" if acc_info["articles"] else f"- (无数据) ({acc_name})\n"
            if acc_info["articles"]:
                md += f"  {acc_info['articles'][0]['snippet'][:150]}\n"
        md += "\n"
    
    md += "---\n\n"
    md += "## ⚠️ 采集说明\n\n"
    md += "1. 本次采集使用 AutoGLM WebSearch API 进行网络搜索,非微信公众号直连采集\n"
    md += "2. 搜索结果为公开网络内容,可能包含非公众号来源的相关文章\n"
    md += "3. 如需精确采集微信公众号原文,需配置 autoglm-browser-agent 浏览器自动化\n"
    md += "4. 建议后续配置浏览器代理后,进行深度公众号文章采集\n"
    
    return md

def main():
    os.makedirs(COLLECT_DIR, exist_ok=True)
    
    print("=" * 60)
    print("易道智鉴公众号内容采集系统")
    print(f"采集日期: 2026-07-06")
    print(f"采集时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    all_categories = {}
    total_accounts = 0
    total_articles = 0
    total_activities = 0
    
    for category_name, targets in COLLECT_TARGETS.items():
        print(f"\n{'='*40}")
        print(f"开始采集: {category_name} ({len(targets)} 个公众号)")
        print(f"{'='*40}")
        
        category_data = collect_category(category_name, targets)
        all_categories[category_name] = category_data
        
        total_accounts += len(category_data["accounts"])
        total_articles += category_data["total_articles"]
        total_activities += category_data["activity_count"]
        
        # 保存类别 MD
        md_path = os.path.join(COLLECT_DIR, f"2026-07-06_{category_name}.md")
        with open(md_path, "w", encoding="utf-8") as f:
            f.write(generate_category_md(category_name, category_data))
        print(f"\n✅ {category_name} 完成: {category_data['total_articles']} 篇")
    
    # 生成活动日历
    calendar_path = os.path.join(COLLECT_DIR, "2026-07-06_活动日历.md")
    with open(calendar_path, "w", encoding="utf-8") as f:
        f.write(generate_activity_calendar(all_categories))
    
    # 生成周报
    report_path = os.path.join(COLLECT_DIR, "2026-07-06_周报.md")
    with open(report_path, "w", encoding="utf-8") as f:
        f.write(generate_weekly_report(all_categories, total_accounts, total_articles, total_activities))
    
    print(f"\n{'='*60}")
    print(f"🎉 采集完成!")
    print(f"📊 统计:")
    print(f"   - 公众号: {total_accounts} 个")
    print(f"   - 文章: {total_articles} 篇")
    print(f"   - 活动通知: {total_activities} 条")
    print(f"📁 输出目录: {COLLECT_DIR}")
    print(f"{'='*60}")

if __name__ == "__main__":
    main()
