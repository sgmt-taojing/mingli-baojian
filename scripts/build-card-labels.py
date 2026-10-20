#!/usr/bin/env python3
"""build-card-labels.py — 全平台卡片标识图片化（静态替换）

规则：导航卡（<a class="*card*" href>）内的文字标题一律替换为描金印章 PNG。
渲染器与 gen-title-images.py 同款（宋体Bold描金+朱红印章+透明底）。
用法：python3 scripts/build-card-labels.py
"""
import hashlib, re
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
APP = ROOT / 'app'
OUT = APP / 'assets' / 'titles'
OUT.mkdir(parents=True, exist_ok=True)

SONGTI = '/System/Library/Fonts/Songti.ttc'
F_TITLE = ImageFont.truetype(SONGTI, 60, index=1)
F_SEAL = ImageFont.truetype(SONGTI, 38, index=1)
GOLD_TOP = (232, 205, 138)
GOLD_BOT = (176, 138, 62)
SEAL_RED = (158, 42, 34)
SEAL_EDGE = (120, 28, 22)


def gold_mask(text, font):
    bbox = font.getbbox(text)
    w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
    mask = Image.new('L', (w + 20, h + 20), 0)
    ImageDraw.Draw(mask).text((10 - bbox[0], 10 - bbox[1]), text, font=font, fill=255)
    return mask


def vgrad(size, top, bot):
    g = Image.new('RGB', (1, size[1]))
    for y in range(size[1]):
        t = y / max(size[1] - 1, 1)
        g.putpixel((0, y), tuple(int(top[i] + (bot[i] - top[i]) * t) for i in range(3)))
    return g.resize(size)


def render_label(key, title):
    """无印章小尺寸版：卡内标识用（紧凑）"""
    tmask = gold_mask(title, F_TITLE)
    tw, th = tmask.size
    pad = 14
    W, H = tw + pad * 2, th + 20
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    shadow = Image.new('RGBA', img.size, (0, 0, 0, 0))
    shadow.paste((60, 40, 10, 160), (pad + 2, (H - th) // 2 + 3), tmask.filter(ImageFilter.GaussianBlur(3)))
    img = Image.alpha_composite(img, shadow)
    edge = tmask.filter(ImageFilter.MaxFilter(3))
    outline = Image.new('RGBA', img.size, (0, 0, 0, 0))
    outline.paste((90, 66, 24, 200), (pad, (H - th) // 2), edge)
    img = Image.alpha_composite(outline, img)
    gold = vgrad((tw, th), GOLD_TOP, GOLD_BOT).convert('RGBA')
    img.paste(gold, (pad, (H - th) // 2), tmask)
    img.save(OUT / f'{key}.png')


# ── 扫描导航卡文字标识 ──
SEL = re.compile(r'<a\s+class="[^"]*(?:card|tile|grid-item)[^"]*"[^>]*href="[^"]+"[^>]*>(.*?)</a>', re.S)
TITLE = re.compile(r'<(div|span|h3|h4)\s+class="([^"]*(?:title|name|label)[^"]*)"[^>]*>([^<$]{1,15})</\1>')

SKIP_PREFIXES = ('center-',)  # 中心页由生成器直出图片标
SKIP_FILES = {'index.html', 'ask.html', 'minsu-center.html', 'divination-tools.html', 'paipan-center.html'}

CSS_SNIPPET = '.card-label-img{height:24px;width:auto;display:block;margin:2px auto}'


def sweep_file(path: Path):
    s = path.read_text(encoding='utf-8', errors='ignore')
    labels = []
    for m in SEL.finditer(s):
        t = TITLE.search(m.group(1))
        if t and t.group(3).strip():
            labels.append((t.group(1), t.group(2), t.group(3).strip()))
    if not labels:
        return 0
    n = 0
    for tag, cls, text in labels:
        key = 'cl-' + hashlib.md5(text.encode('utf-8')).hexdigest()[:8]
        render_label(key, text)
        old = f'<{tag} class="{cls}">{text}</{tag}>'
        new = f'<img class="card-label-img" src="assets/titles/{key}.png" alt="{text}">'
        if old in s:
            s = s.replace(old, new, 1)
            n += 1
    if n and CSS_SNIPPET not in s:
        s = s.replace('</style>', CSS_SNIPPET + '\n</style>', 1)
    path.write_text(s, encoding='utf-8')
    return n


def main():
    total_pages, total_labels = 0, 0
    for f in sorted(APP.glob('*.html')):
        if f.name in SKIP_FILES or f.name.startswith(SKIP_PREFIXES):
            continue
        n = sweep_file(f)
        if n:
            total_pages += 1
            total_labels += n
            print(f'{f.name}: {n} 卡标图片化')
    print(f'完成：{total_pages} 页 {total_labels} 个卡标')


if __name__ == '__main__':
    main()
