#!/usr/bin/env python3
import sys

with open('app/js/divination-core.js', 'r') as f:
    content = f.read()

# 1. Update radar canvas size from 320 to 380
content = content.replace(
    "html += '<div style=\"flex:0 0 320px;max-width:320px\"><canvas id=\"lifeIndexRadar\" width=\"320\" height=\"320\" style=\"max-width:100%\"></canvas></div>'",
    "html += '<div style=\"flex:0 0 380px;max-width:380px\"><canvas id=\"lifeIndexRadar\" width=\"380\" height=\"380\" style=\"max-width:100%\"></canvas></div>'"
)

# 2. Update card padding and background
content = content.replace(
    "html += '<div class=\"analysis-card\" style=\"padding:24px\">';",
    "html += '<div class=\"analysis-card\" style=\"padding:28px;border-radius:16px;background:linear-gradient(135deg,rgba(201,168,76,0.06),rgba(201,168,76,0.02));border:1px solid rgba(201,168,76,0.2)\">';"
)

# 3. Update title font size and letter spacing
content = content.replace(
    "html += '<h3 style=\"font-family:\\'Ma Shan Zheng\\',serif;font-size:26px;letter-spacing:4px;color:var(--gold);margin-bottom:8px\">🌟 '+name+' · 命理全鉴评估</h3>'",
    "html += '<h3 style=\"font-family:\\'Ma Shan Zheng\\',serif;font-size:30px;letter-spacing:6px;color:var(--gold);margin-bottom:8px;text-shadow:0 0 20px rgba(201,168,76,0.3)\">🌟 '+name+' · 命理全鉴评估</h3>'"
)

# 4. Update total score display
content = content.replace(
    "html += '<div style=\"font-size:56px;font-weight:bold;color:'+gradeColor+';line-height:1\">'+total+'</div>'",
    "html += '<div style=\"font-size:64px;font-weight:bold;color:'+gradeColor+';line-height:1;text-shadow:0 0 30px '+gradeColor+'40\">'+total+'</div>'"
)

# 5. Update grade display to use a badge style
content = content.replace(
    "html += '<div style=\"font-size:18px;color:'+gradeColor+';margin-top:12px;letter-spacing:4px\">等级：'+grade+'</div>'",
    "html += '<div style=\"display:inline-block;margin-top:14px;padding:6px 20px;border:2px solid '+gradeColor+';border-radius:20px;font-size:16px;color:'+gradeColor+';letter-spacing:4px;font-weight:bold\">等级：'+grade+'</div>'"
)

# 6. Update gap in radar+score section
content = content.replace(
    "html += '<div style=\"display:flex;flex-wrap:wrap;gap:20px;align-items:center;justify-content:center;margin-bottom:24px\">';\n  html += '<div style=\"flex:0 0 380px",
    "html += '<div style=\"display:flex;flex-wrap:wrap;gap:24px;align-items:center;justify-content:center;margin-bottom:28px\">';\n  html += '<div style=\"flex:0 0 380px"
)

# 7. Update the 6-dimension cards to be more polished
content = content.replace(
    "html += '<div style=\"background:rgba(201,168,76,0.04);border:1px solid rgba(201,168,76,0.12);border-radius:10px;padding:16px\">';",
    "html += '<div style=\"background:rgba(201,168,76,0.05);border:1px solid rgba(201,168,76,0.15);border-radius:12px;padding:18px;transition:transform .3s ease,box-shadow .3s ease\">';"
)

# 8. Update the section header text for score
content = content.replace(
    "html += '<div style=\"font-size:14px;color:var(--paper2);letter-spacing:3px;margin-bottom:8px\">综合总分</div>'",
    "html += '<div style=\"font-size:14px;color:var(--paper2);letter-spacing:3px;margin-bottom:8px;opacity:.7\">综合总分</div>'"
)

with open('app/js/divination-core.js', 'w') as f:
    f.write(content)

print('All UI updates applied successfully')
