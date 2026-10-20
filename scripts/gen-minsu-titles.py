#!/usr/bin/env python3
# 生成民俗工具中心卡片标题图：宋体 Bold 描金 + 朱红印章，透明背景 PNG（@2x）
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / 'app' / 'assets' / 'minsu'
OUT.mkdir(parents=True, exist_ok=True)

SONGTI = '/System/Library/Fonts/Songti.ttc'
F_TITLE = ImageFont.truetype(SONGTI, 64, index=1)   # Songti SC Bold
F_SEAL  = ImageFont.truetype(SONGTI, 40, index=1)

GOLD_TOP = (232, 205, 138)   # 亮金
GOLD_BOT = (176, 138, 62)    # 沉金
SEAL_RED = (158, 42, 34)     # 朱砂
SEAL_EDGE = (120, 28, 22)

# (文件键, 标题, 印章字)
CARDS = [
    ('huangli',  '黄历查询', '历'),
    ('zeri',     '择日建议', '择'),
    ('taisui',   '太岁查询', '岁'),
    ('jieqi',    '24节气',  '节'),
    ('mobile',   '手机号码', '机'),
    ('xingming', '姓名学',   '名'),
    ('liunian',  '流年运程', '运'),
    ('lucky',    '幸运数色', '吉'),
    ('hehun',    '合婚分析', '合'),
    ('family',   '家庭排盘', '家'),
    ('holidays', '节日查询', '庆'),
    ('lifeplan', '人生规划', '规'),
    ('paipan',   '排盘中心', '盘'),
]

def gold_text_mask(text, font):
    bbox = font.getbbox(text)
    w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
    mask = Image.new('L', (w + 20, h + 20), 0)
    d = ImageDraw.Draw(mask)
    d.text((10 - bbox[0], 10 - bbox[1]), text, font=font, fill=255)
    return mask

def vertical_gradient(size, top, bot):
    w, h = size
    grad = Image.new('RGB', (1, h))
    for y in range(h):
        t = y / max(h - 1, 1)
        grad.putpixel((0, y), tuple(int(top[i] + (bot[i] - top[i]) * t) for i in range(3)))
    return grad.resize((w, h))

def render(key, title, seal_ch):
    tmask = gold_text_mask(title, F_TITLE)
    tw, th = tmask.size
    seal = 76
    pad = 18
    W, H = tw + seal + pad * 2, max(th, seal) + 24
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))

    # 金字：纵向金渐变贴到文字蒙版，加柔光阴影
    shadow = Image.new('RGBA', img.size, (0, 0, 0, 0))
    smask = tmask.filter(ImageFilter.GaussianBlur(3))
    shadow.paste((60, 40, 10, 160), (pad + 2, (H - th) // 2 + 3), smask)
    img = Image.alpha_composite(img, shadow)
    gold = vertical_gradient((tw, th), GOLD_TOP, GOLD_BOT).convert('RGBA')
    img.paste(gold, (pad, (H - th) // 2), tmask)
    # 描边：细暗金轮廓提升对比
    edge = tmask.filter(ImageFilter.MaxFilter(3))
    outline = Image.new('RGBA', img.size, (0, 0, 0, 0))
    outline.paste((90, 66, 24, 200), (pad, (H - th) // 2), edge)
    img = Image.alpha_composite(outline, img)
    img.paste(gold, (pad, (H - th) // 2), tmask)

    # 印章：朱红圆角方印 + 白字
    sx, sy = pad + tw + pad // 2, (H - seal) // 2
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([sx, sy, sx + seal, sy + seal], radius=12, fill=SEAL_RED + (235,), outline=SEAL_EDGE + (255,), width=3)
    sb = F_SEAL.getbbox(seal_ch)
    d.text((sx + (seal - (sb[2] - sb[0])) / 2 - sb[0], sy + (seal - (sb[3] - sb[1])) / 2 - sb[1]),
           seal_ch, font=F_SEAL, fill=(245, 238, 220, 255))

    img.save(OUT / f'title-{key}.png')
    print(f'title-{key}.png  {img.size[0]}x{img.size[1]}')

for k, t, s in CARDS:
    render(k, t, s)
print('done ->', OUT)
