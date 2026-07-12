#!/usr/bin/env python3
"""
批量给易道智鉴的6个HTML文件添加统一的跨文件导航栏
在每个文件的<body>标签后添加 .file-nav-bar，并调整样式
"""

import re
import os

FILES = [
    "divination-hub.html",
    "divination-knowledge.html",
    "divination-almanac.html",
    "divination-shop.html",
    "divination-membership.html",
    "divination-integrated.html",
]

# 暗色主题文件的 CSS 变量（hub, knowledge, almanac）
DARK_CSS = """
/* 跨文件导航栏 */
.file-nav-bar{position:fixed;top:0;left:0;right:0;z-index:300;background:rgba(8,8,8,0.98);backdrop-filter:blur(8px);border-bottom:1px solid rgba(201,168,76,0.15);padding:8px 0;display:flex;justify-content:center;gap:6px;flex-wrap:wrap}
.file-nav-btn{color:var(--paper3, #a09080);text-decoration:none;font-size:12px;padding:5px 14px;border:1px solid rgba(201,168,76,0.12);border-radius:16px;transition:all .25s;font-family:'Noto Serif SC',serif;letter-spacing:1px;white-space:nowrap}
.file-nav-btn:hover{background:rgba(201,168,76,0.1);color:var(--gold, #c9a84c);border-color:rgba(201,168,76,0.3)}
.file-nav-btn.active{background:rgba(201,168,76,0.12);color:var(--gold, #c9a84c);border-color:rgba(201,168,76,0.35)}
"""

# 浅色主题文件的 CSS 变量（integrated, almanac已有, shop, membership）
LIGHT_CSS = """
/* 跨文件导航栏 */
.file-nav-bar{position:fixed;top:0;left:0;right:0;z-index:300;background:rgba(250,248,244,0.98);backdrop-filter:blur(8px);border-bottom:1px solid rgba(201,168,76,0.2);padding:8px 0;display:flex;justify-content:center;gap:6px;flex-wrap:wrap}
.file-nav-btn{color:#6b5c4a;text-decoration:none;font-size:12px;padding:5px 14px;border:1px solid rgba(201,168,76,0.2);border-radius:16px;transition:all .25s;font-family:'Noto Serif SC',serif;letter-spacing:1px;white-space:nowrap}
.file-nav-btn:hover{background:rgba(201,168,76,0.1);color:#8B4513;border-color:rgba(201,168,76,0.4)}
.file-nav-btn.active{background:rgba(201,168,76,0.15);color:#8B4513;border-color:rgba(201,168,76,0.5)}
"""

# 导航栏 HTML（每个文件自己的链接加 active 类）
NAV_HTML = """<div class="file-nav-bar">
  <a href="divination-hub.html" class="file-nav-btn{0}">🏠 主平台</a>
  <a href="divination-integrated.html" class="file-nav-btn{1}">🧬 体质调理</a>
  <a href="divination-almanac.html" class="file-nav-btn{2}">📅 黄历</a>
  <a href="divination-knowledge.html" class="file-nav-btn{3}">📚 知识库</a>
  <a href="divination-shop.html" class="file-nav-btn{4}">🛍️ 商城</a>
  <a href="divination-membership.html" class="file-nav-btn{5}">👑 会员</a>
</div>
"""

def detect_theme(html: str) -> str:
    """检测文件是暗色还是浅色主题"""
    if "--bg:#f5f0e8" in html or "--bg: #f5f0e8" in html:
        return "light"
    if "var(--ink)" in html and "--ink:#080808" in html:
        return "dark"
    return "dark"  # 默认暗色

def get_active_index(filename: str) -> int:
    """根据文件名返回哪个导航按钮应该是 active 的"""
    mapping = {
        "divination-hub.html": 0,
        "divination-integrated.html": 1,
        "divination-almanac.html": 2,
        "divination-knowledge.html": 3,
        "divination-shop.html": 4,
        "divination-membership.html": 5,
    }
    return mapping.get(filename, -1)

def add_nav_to_file(filepath: str):
    with open(filepath, "r", encoding="utf-8") as f:
        html = f.read()

    filename = os.path.basename(filepath)
    theme = detect_theme(html)
    active_idx = get_active_index(filename)

    # 构建导航 HTML（给当前文件加 active 类）
    nav_classes = [""] * 6
    if active_idx >= 0:
        nav_classes[active_idx] = " active"
    nav_html = NAV_HTML.format(*nav_classes)

    # 1. 在 </head> 前插入 CSS
    if theme == "dark":
        css_block = DARK_CSS
    else:
        css_block = LIGHT_CSS

    if ".file-nav-bar" not in html:
        html = html.replace("</head>", css_block + "\n</head>")

    # 2. 在 <body> 后插入导航 HTML（如果还没有）
    if "file-nav-bar" not in html:
        html = html.replace("<body>", "<body>\n" + nav_html)

    # 3. 调整主内容区的上边距（给固定导航栏留空间 ~44px）
    #    查找第一个有 padding-top 或 margin-top 的大容器，增加 44px
    if theme == "dark":
        # 暗色主题：给 .main 或 .container 加 padding-top
        html = re.sub(
            r"(\.main|\.container)\{[^}]*?padding:\s*(\d+)px",
            lambda m: m.group(0).replace(
                f"padding: {m.group(2)}px",
                f"padding: {int(m.group(2)) + 44}px"
            ),
            html,
            count=1
        )
    else:
        # 浅色主题：给 .header 或 body 加 padding-top
        pass  # integrated.html 已有处理，其他文件手动调整

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(html)

    print(f"✅ {filename} ({theme}主题) 已添加导航栏")

if __name__ == "__main__":
    base = "/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian"
    for f in FILES:
        path = os.path.join(base, f)
        if os.path.exists(path):
            add_nav_to_file(path)
        else:
            print(f"⚠️  文件不存在: {path}")
