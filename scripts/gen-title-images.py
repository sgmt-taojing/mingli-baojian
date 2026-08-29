#!/usr/bin/env python3
# 通用标题图生成器：宋体 Bold 描金 + 朱红印章，透明底 PNG（@2x）
# 覆盖：index 首页入口卡 / paipan-center 排盘中心 / divination-tools 命理工具 / ask 问事网格
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'app' / 'assets' / 'titles'
OUT.mkdir(parents=True, exist_ok=True)

SONGTI = '/System/Library/Fonts/Songti.ttc'
F_TITLE = ImageFont.truetype(SONGTI, 64, index=1)
F_SEAL = ImageFont.truetype(SONGTI, 40, index=1)

GOLD_TOP = (232, 205, 138)
GOLD_BOT = (176, 138, 62)
SEAL_RED = (158, 42, 34)
SEAL_EDGE = (120, 28, 22)

# { 输出键: (标题, 印章字) }
SETS = {
    # ── index 首页（信众区）
    'index-ask': ('问事 · 白话解读', '问'),
    'index-voice': ('一句话直达', '达'),
    'index-ai': ('AI 助手', '智'),
    'index-quick': ('命理速览', '览'),
    'index-lifeplan': ('人生规划', '规'),
    'index-lifeindex': ('命格指数', '命'),
    'index-lifeflow': ('流年报告', '运'),
    'index-timeline': ('十年走势', '势'),
    'index-youth': ('青年规划', '青'),
    'index-almanac': ('黄历', '历'),
    'index-huangli': ('每日黄历', '日'),
    'index-zhanbu': ('快速占卜', '占'),
    'index-minsu': ('民俗中心', '民'),
    # ── index（患者区）
    'index-clinic': ('综合问诊台 · 患者专有通道', '诊'),
    'index-symptom': ('症状自查', '症'),
    'index-camera': ('望诊采集', '望'),
    'index-journey': ('我的就医记录', '录'),
    'index-portal': ('患者门户', '患'),
    # ── index（医生区）
    'index-doc-room': ('智能问诊室', '问'),
    'index-doc-panel': ('医生工作台', '医'),
    'index-doc-consult': ('医生会诊', '会'),
    'index-doc-intake': ('初诊采集', '采'),
    'index-doc-master': ('名老中医', '名'),
    'index-doc-rx': ('处方开方', '方'),
    'index-doc-bianzheng': ('辨证论治', '辨'),
    'index-doc-tongue': ('舌脉图谱', '舌'),
    'index-doc-clinic': ('中医诊所', '所'),
    'index-doc-archive': ('患者档案', '档'),
    'index-doc-report': ('报告中心', '报'),
    'index-admin-ops': ('运营后台', '营'),
    # ── index（命理师区）
    'index-master-work': ('命理师工作台', '师'),
    'index-master-intake': ('命理采集', '集'),
    'index-master-cate': ('分类断事', '断'),
    'index-master-review': ('复核', '核'),
    'index-master-archive': ('命理档案', '命'),
    'index-master-famous': ('命理名家', '家'),
    'index-master-case': ('病案合参', '案'),
    'index-master-ziwei': ('紫微病象', '微'),
    'index-master-kb': ('知识库', '知'),
    'index-master-kbinsight': ('KB 洞察', '洞'),
    'index-master-tools': ('命理工具', '具'),
    'index-master-pro': ('专业排盘', '盘'),
    'index-master-yijing': ('易经起卦', '卦'),
    'index-master-qimen': ('奇门遁甲', '奇'),
    # ── index（管理员区）
    'index-admin-login': ('管理员登录', '管'),
    'index-admin-ticket': ('工单管理', '工'),
    'index-admin-monitor': ('监控总览', '监'),
    'index-admin-shop': ('商城管理', '商'),
    'index-admin-kb': ('知识洞察', '察'),
    # ── paipan-center 排盘中心
    'pp-bazi': ('八字排盘', '八'),
    'pp-ziwei': ('紫微斗数', '紫'),
    'pp-qimen': ('奇门遁甲', '奇'),
    'pp-liuyao': ('六爻占卜', '爻'),
    'pp-liuren': ('大六壬', '壬'),
    'pp-meihua': ('梅花易数', '梅'),
    'pp-fengshui': ('风水排盘', '风'),
    # ── divination-tools 命理工具
    'dt-bazi': ('八字排盘', '八'),
    'dt-fengshui': ('风水罗盘', '罗'),
    'dt-mobile': ('手机号吉凶', '机'),
    'dt-name': ('姓名评分', '名'),
    'dt-company': ('公司取名', '司'),
    'dt-gua64': ('六十四卦', '卦'),
    # ── ask 问事网格
    'ask-liuyao': ('六爻问卦', '爻'),
    'ask-meihua': ('梅花易数', '梅'),
    'ask-qimen': ('奇门遁甲', '奇'),
    'ask-liuren': ('大六壬', '壬'),
    'ask-bazi': ('八字命理', '八'),
    'ask-ziwei': ('紫微斗数', '紫'),
    'ask-liunian': ('流年运势', '年'),
    'ask-hehun': ('合婚配对', '合'),
    'ask-fengshui': ('风水堪舆', '风'),
    'ask-lifeplan': ('人生规划', '规'),
    'ask-lifeindex': ('命格指数', '命'),
    'ask-lifeflow': ('流年报告', '运'),
    'ask-lifetimeline': ('十年走势', '势'),
    'ask-huangli': ('黄历择日', '历'),
    'ask-mobile': ('手机号吉凶', '机'),
    'ask-chepai': ('车牌号吉凶', '车'),
    'ask-xingming': ('姓名评分', '名'),
    'ask-qiming': ('宝宝起名', '名'),
    'ask-gaiming': ('改名测评', '改'),
    'ask-gongsi': ('公司取名', '商'),
    'ask-lucky': ('幸运数色', '运'),
    # ── index 信众新增民俗卡
    'index-mobile': ('手机号吉凶', '机'),
    'index-xingming': ('姓名评分', '名'),
    'index-qiming': ('宝宝起名', '名'),
    'index-lucky': ('幸运数色', '运'),
    'index-chepai': ('车牌吉凶', '车'),
    # ── minsu-center 民俗中心（输出到 assets/minsu/title-*.png）
    'ms-plate': ('车牌号码', '车'),
    'ms-qiming': ('宝宝起名', '名'),
    'ms-gaiming': ('改名测评', '改'),
    'ms-gongsi': ('公司取名', '商'),
    # ── 五大服务中心 hero 标题
    'center-yuanzhu': ('缘主服务中心', '缘'),
    'center-patient': ('患者服务中心', '患'),
    'center-doctor': ('医生服务中心', '医'),
    'center-master': ('命理师服务中心', '师'),
    'center-org': ('机构服务中心', '构'),
    'center-admin': ('管理服务中心', '管'),
}

def gold_mask(text, font):
    bbox = font.getbbox(text)
    w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
    mask = Image.new('L', (w + 20, h + 20), 0)
    ImageDraw.Draw(mask).text((10 - bbox[0], 10 - bbox[1]), text, font=font, fill=255)
    return mask

def vgrad(size, top, bot):
    w, h = size
    g = Image.new('RGB', (1, h))
    for y in range(h):
        t = y / max(h - 1, 1)
        g.putpixel((0, y), tuple(int(top[i] + (bot[i] - top[i]) * t) for i in range(3)))
    return g.resize((w, h))

def render(key, title, seal_ch):
    tmask = gold_mask(title, F_TITLE)
    tw, th = tmask.size
    seal, pad = 76, 18
    W, H = tw + seal + pad * 2, max(th, seal) + 24
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
    sx, sy = pad + tw + pad // 2, (H - seal) // 2
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([sx, sy, sx + seal, sy + seal], radius=12, fill=SEAL_RED + (235,), outline=SEAL_EDGE + (255,), width=3)
    sb = F_SEAL.getbbox(seal_ch)
    d.text((sx + (seal - (sb[2] - sb[0])) / 2 - sb[0], sy + (seal - (sb[3] - sb[1])) / 2 - sb[1]),
           seal_ch, font=F_SEAL, fill=(245, 238, 220, 255))
    if key.startswith('ms-'):
        out2 = ROOT / 'app' / 'assets' / 'minsu'
        out2.mkdir(parents=True, exist_ok=True)
        img.save(out2 / f'title-{key[3:]}.png')
    else:
        img.save(OUT / f'{key}.png')

for k, (t, s) in SETS.items():
    render(k, t, s)
print(f'done {len(SETS)} -> {OUT}')
