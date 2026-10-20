#!/usr/bin/env python3
"""应期专题系列蒸馏器（2026-09-24）· 用法: python3 scripts/yingqi-series.py <topic_key>
素材: kb_formal 命理域定向抽取 → MLX 8960 合成 → /tmp/yingqi-series-<key>.json 待人工校订
"""
import sqlite3, json, sys, urllib.request

TOPICS = {
  'lihun': {
    'name': '离婚/婚变应期',
    'queries': [
      "content LIKE '%离婚%' AND (content LIKE '%流年%' OR content LIKE '%大运%')",
      "content LIKE '%婚变%' OR content LIKE '%婚姻不稳%' OR content LIKE '%感情波折%'",
      "content LIKE '%夫妻宫%' AND content LIKE '%化忌%'",
    ],
    'focus': '判断离婚/分居/婚变发生年份的断法（如夫妻宫逢冲、化忌入夫妻宫、比劫夺财等流年信号）',
  },
  'zaihun': {
    'name': '再婚/二婚信号',
    'queries': [
      "content LIKE '%再婚%' OR content LIKE '%二婚%' OR content LIKE '%重婚%'",
      "content LIKE '%多婚%' OR content LIKE '%两次婚姻%' OR content LIKE '%红鸾%'",
    ],
    'focus': '判断二婚/再婚倾向与年份的断法（红鸾再临、夫妻宫双星、桃花重来等）',
  },
  'taohua': {
    'name': '桃花劫/烂桃花辨识',
    'queries': [
      "content LIKE '%桃花劫%' OR content LIKE '%烂桃花%' OR content LIKE '%桃花煞%'",
      "content LIKE '%桃花%' AND (content LIKE '%劫%' OR content LIKE '%煞%' OR content LIKE '%是非%')",
    ],
    'focus': '区分正桃花与桃花劫的断法（桃花逢煞/落陷/与凶星同宫等的辨识与应验）',
  },
  'sangou': {
    'name': '丧偶/配偶灾信号',
    'queries': [
      "content LIKE '%丧偶%' OR content LIKE '%克夫%' OR content LIKE '%克妻%'",
      "content LIKE '%配偶%' AND (content LIKE '%凶%' OR content LIKE '%灾%' OR content LIKE '%亡%')",
    ],
    'focus': '配偶健康灾祸的传统断法信号（仅作传统文化整理，含免责边界）',
  },
  'wanhun': {
    'name': '早婚/晚婚判断',
    'queries': [
      "content LIKE '%晚婚%' OR content LIKE '%早婚%' OR content LIKE '%适婚%'",
      "content LIKE '%夫妻宫%' AND (content LIKE '%迟%' OR content LIKE '%晚%' OR content LIKE '%早%')",
    ],
    'focus': '判断早婚晚婚的命局特征（夫妻宫星曜、财官位置、大运早晚等）',
  },
}

def main(key):
    t = TOPICS[key]
    db = sqlite3.connect('server/database/yidao.db', timeout=120)
    db.execute("PRAGMA busy_timeout=120000")
    c = db.cursor()
    snips = []
    for q in t['queries']:
        rows = c.execute(
            f"SELECT title, substr(content,1,400) FROM kb_formal WHERE {q} AND domain='mingli' AND trust_score>=0.75 ORDER BY RANDOM() LIMIT 12"
        ).fetchall()
        snips += [{'t': r[0][:40], 's': r[1]} for r in rows]
    print(f"{t['name']}: 素材 {len(snips)} 段")
    src = '\n\n'.join(f"◆{m['t']}\n{m['s']}" for m in snips)
    prompt = f"""你是命理知识蒸馏专家。围绕「{t['name']}」（{t['focus']}）从素材提炼 4-5 条知识条目。
每条：{{"title":"≤20字","content":"120-250字，含明确触发条件、出处线索、适用边界"}}。
铁律：只提炼素材里真实存在的断法，素材没有的不许编；条目必须可操作（什么命局/流年信号→什么事）。输出纯 JSON 数组。

素材：
{src[:9000]}"""
    body = json.dumps({'messages': [{'role': 'user', 'content': prompt}], 'max_tokens': 2200}).encode()
    req = urllib.request.Request('http://127.0.0.1:8960/v1/chat/completions', data=body,
                                 headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=280) as r:
        resp = json.loads(r.read().decode())
    txt = resp['choices'][0]['message']['content']
    open(f'/tmp/yingqi-series-{key}.txt', 'w').write(txt)
    print(f'已写 /tmp/yingqi-series-{key}.txt（{len(txt)} 字）')

if __name__ == '__main__':
    main(sys.argv[1])
