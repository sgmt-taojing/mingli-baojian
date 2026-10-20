#!/usr/bin/env python3
"""gen-service-centers.py — 生成五大服务中心枢纽页（缘主/患者/医生/命理师/管理员）

统一模板：首页同款设计语言（玄底描金）+ 标题图 + 分组 icon-card 网格。
每组按用户旅程组织，不再平铺工具。输出到 app/center-*.html。
R-LABEL-IMG：卡片标识直出描金 PNG（全平台禁文字卡标）。
"""
import hashlib
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
APP = ROOT / 'app'
TITLES = APP / 'assets' / 'titles'
TITLES.mkdir(parents=True, exist_ok=True)

_SONGTI = '/System/Library/Fonts/Songti.ttc'
_F = ImageFont.truetype(_SONGTI, 60, index=1)
_GOLD_TOP = (232, 205, 138)
_GOLD_BOT = (176, 138, 62)


def _label_img(key, text):
    """卡内标识小图（描金无印章）"""
    bbox = _F.getbbox(text)
    bw, bh = bbox[2] - bbox[0], bbox[3] - bbox[1]
    mask = Image.new('L', (bw + 20, bh + 20), 0)
    ImageDraw.Draw(mask).text((10 - bbox[0], 10 - bbox[1]), text, font=_F, fill=255)
    tw, th = mask.size  # 含 padding 的完整尺寸，粘贴源须与之同尺寸
    pad = 14
    W, H = tw + pad * 2, th + 20
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    shadow = Image.new('RGBA', img.size, (0, 0, 0, 0))
    shadow.paste((60, 40, 10, 160), (pad + 2, (H - th) // 2 + 3), mask.filter(ImageFilter.GaussianBlur(3)))
    img = Image.alpha_composite(img, shadow)
    edge = mask.filter(ImageFilter.MaxFilter(3))
    outline = Image.new('RGBA', img.size, (0, 0, 0, 0))
    outline.paste((90, 66, 24, 200), (pad, (H - th) // 2), edge)
    img = Image.alpha_composite(outline, img)
    g = Image.new('RGB', (1, th))
    for y in range(th):
        t = y / max(th - 1, 1)
        g.putpixel((0, y), tuple(int(_GOLD_TOP[i] + (_GOLD_BOT[i] - _GOLD_TOP[i]) * t) for i in range(3)))
    img.paste(g.resize((tw, th)).convert('RGBA'), (pad, (H - th) // 2), mask)
    img.save(TITLES / f'{key}.png')

# 角色配置：key, 名称, 印章字, 主题色, 副题, 分组[(组名, 说明, [(名, 链接, 图标, 描述, hot?)])]
CENTERS = {
    'yuanzhu': {
        'name': '缘主服务中心', 'seal': '缘', 'accent': '#c9a84c',
        'sub': '大众 · 信众 · 缘主 —— 问事知运，一站全览',
        'groups': [
            ('问事起卦', '说事就能看 · 支持语音拍照', [
                ('问事 · 白话解读', 'ask.html', '🔮', '19 件工具 · 选工具说事情得解读', True),
                ('一句话直达', 'voice-portal.html', '⚡', '说出需求 AI 自动识别', True),
                ('快速占卜', 'zhanbu.html', '🪙', '一事一占 · 即时解卦', False),
                ('AI 助手', 'ai-assistant.html', '🤖', '24+ 模块智能对话', False),
            ]),
            ('看命知运', '输入生辰 · 白话报告', [
                ('命理速览', 'paipan-quick.html', '☯️', '输入生辰 · 快速看命', True),
                ('流年报告', 'lifeflow-report.html', '🌊', '本月大运 · 明年预览', False),
                ('十年走势', 'lifeflow-timeline.html', '📈', '黄金五年 · 转折提醒', False),
                ('命格指数', 'lifeindex-detail.html', '📊', '十二维评分 · 优势短板', False),
            ]),
            ('人生规划', '阶段定位 · 路径建议', [
                ('人生规划', 'lifeplan-detail.html', '🧭', '阶段定位 · 五年路径', False),
                ('青年规划', 'youthplan-detail.html', '🌱', '学业职业 · 成长路线', False),
            ]),
            ('民俗日用', '日历择吉 · 号码姓名', [
                ('民俗工具中心', 'minsu-center.html', '🏮', '14 件民俗工具合集', True),
                ('每日黄历', 'huangli-daily.html', '📅', '宜忌 · 吉时 · 节气', False),
                ('黄历择日', 'ask.html?tool=huangli', '📖', '今日宜忌 · 选好日子', False),
                ('手机号吉凶', 'ask.html?tool=mobile', '📱', '号码数理 · 改进建议', False),
                ('车牌吉凶', 'ask.html?tool=chepai', '🚗', '选号参考 · 尾数调整', False),
                ('姓名评分', 'ask.html?tool=xingming', '✍️', '五格三才 · 改名方向', False),
                ('宝宝起名', 'ask.html?tool=qiming', '👶', '古籍取名 · 五行补益', False),
                ('幸运数色', 'ask.html?tool=lucky', '🍀', '幸运数字 · 颜色方位', False),
            ]),
            ('我的缘档', '报告历史 · 会员消息', [
                ('我的缘主档', 'my-yuanzhu.html', '👤', '个人信息 · 历史记录', False),
                ('报告中心', 'reports-hub.html', '📑', '全部报告 · 随时回看', False),
                ('会员服务', 'divination-membership.html', '💎', '会员权益 · 专属服务', False),
                ('缘主信箱', 'yuanzhu-inbox.html', '✉️', '消息通知 · 师回', False),
            ]),
        ],
    },
    'patient': {
        'name': '患者服务中心', 'seal': '患', 'accent': '#2980b9',
        'sub': '患者专有通道 —— 就诊康养，全程闭环',
        'groups': [
            ('就诊通道', '从登记到问诊 · AI 全程辅助', [
                ('综合问诊台', 'integrated-clinic.html', '🩺', '取号问诊 · AI 初诊 · 电子病历', True),
                ('初诊登记', 'patient-intake.html', '📝', '首次就诊 · 建档登记', False),
                ('望诊采集', 'camera-capture.html', '📷', '面舌拍照 · AI 望诊', False),
                ('症状自查', 'tcm-symptom.html', '🔍', '不舒服先自查 · 导诊建议', False),
            ]),
            ('就诊记录', '病历报告 · 随时可查', [
                ('我的就医记录', 'patient-journey.html', '🗂️', '历次就诊 · 全程时间线', True),
                ('患者档案', 'patient-archive.html', '📁', '健康档案 · 病史汇总', False),
                ('我的报告', 'patient-report.html', '📄', '诊断报告 · 检验旁证', False),
            ]),
            ('康养管理', '诊后调理 · 日常养生', [
                ('养生指导', 'wellness-guide.html', '🌿', '体质调理 · 时令养生', False),
                ('健康打卡', 'wellness-track.html', '✅', '每日打卡 · 习惯养成', False),
                ('居家护理', 'home-care.html', '🏠', '在家护理 · 康复指导', False),
                ('健康监测', 'health-monitor.html', '💓', '指标记录 · 趋势提醒', False),
            ]),
            ('紧急帮助', '突发情况 · 一键直达', [
                ('一键求救', 'sos.html', '🆘', '紧急情况 · 即时求助', True),
                ('紧急联系人', 'emergency-contacts.html', '☎️', '亲友联络 · 快速拨号', False),
            ]),
        ],
    },
    'doctor': {
        'name': '医生服务中心', 'seal': '医', 'accent': '#27ae60',
        'sub': '医院医生工作台 —— AI 减负，流程合规',
        'groups': [
            ('门诊工作台', '叫号到签名 · 一站完成', [
                ('综合问诊台', 'unified-consultation.html', '🩺', '叫号采集 · AI 草稿 · 审核签名', True),
                ('智能问诊室', 'clinic-live-room.html', '🎥', '音视频问诊 · 实时记录', False),
                ('医生工作台', 'doctor-panel.html', '💼', '今日门诊 · 待办一览', False),
                ('初诊采集', 'doctor-intake.html', '📋', '首诊信息 · 结构化采集', False),
            ]),
            ('处方与辨证', '方剂古籍 · 医技开单', [
                ('处方开方', 'doctor-response.html', '💊', '经方加减 · 签名流转', True),
                ('辨证论治', 'tcm-syndromes.html', '⚖️', '证型库 · 辨证思路', False),
                ('舌脉图谱', 'tcm-visual-reference.html', '👅', '舌象脉象 · 图谱对照', False),
                ('中医诊所', 'tcm-clinic.html', '🏥', '诊所流程 · 综合管理', False),
            ]),
            ('会诊与学习', '名医经验 · 疑难协作', [
                ('医生会诊', 'doctor-consult.html', '🤝', '疑难病例 · 多人会诊', False),
                ('名老中医', 'doctor-elder.html', '👴', '名医经验 · 医案学习', False),
                ('命理合参', 'unified-consultation.html', '☯️', '命理师同页审核 · 医命合参', False),
            ]),
            ('病案管理', '档案报告 · 全程可溯', [
                ('患者档案', 'patient-archive.html', '📁', '全部患者 · 档案检索', False),
                ('报告中心', 'tcm-report.html', '📑', '诊断报告 · 出具归档', False),
                ('就医全流程', 'patient-journey.html', '🔄', '患者旅程 · 环节追踪', False),
            ]),
        ],
    },
    'master': {
        'name': '命理师服务中心', 'seal': '师', 'accent': '#8e44ad',
        'sub': '命理师工作台 —— 专业排盘，断事研习',
        'groups': [
            ('断事流程', '采集到复核 · 签名出具', [
                ('命理师工作台', 'master-workstation.html', '⚡', '今日断事 · 待办总览', True),
                ('命理采集', 'master-intake.html', '📥', '缘主信息 · 事项采集', False),
                ('分类断事', 'master-class.html', '🏷️', '婚恋事业财运 · 分类专断', False),
                ('复核签发', 'review-studio.html', '✅', '双师审核 · 签名出具', False),
                ('命理档案', 'master-archive.html', '📁', '断事档案 · 案例检索', False),
            ]),
            ('专业排盘', '古制排盘 · 仅对命理师开放', [
                ('专业排盘中心', 'paipan-center.html', '🌀', '七模块古制排盘', True),
                ('易经起卦', 'yijing-oracle.html', '☰', '大衍筮法 · 专业起卦', False),
                ('奇门专业局', 'yijing-qimen.html', '🧭', '转盘奇门 · 专业排局', False),
                ('命理工具', 'divination-tools.html', '🛠️', '推演工具 · 经典依据', False),
            ]),
            ('研习知识', '知识图谱 · 名家医案', [
                ('知识库', 'divination-knowledge.html', '📚', '命理典籍 · 知识检索', False),
                ('KB 洞察', 'kb-insights.html', '💡', '知识图谱 · 覆盖分析', False),
                ('命理名家', 'master-elder.html', '🎓', '名家流派 · 断法传承', False),
                ('病案合参', 'master-disease.html', '📖', '命理断病 · 案例合参', False),
                ('紫微病象', 'master-zidise-illness.html', '🌌', '紫微星曜 · 病象参断', False),
            ]),
            ('医命合参', '医疗平台协同', [
                ('综合问诊台', 'unified-consultation.html', '🩺', '命理批注 · 与医生同页审核', True),
            ]),
        ],
    },
    'org': {
        'name': '机构服务中心', 'seal': '构', 'accent': '#16a085',
        'sub': '医院 · 诊所 · 商户 —— 入驻即用，全程运营',
        'groups': [
            ('入驻与经营', '开店上线 · 订单套餐', [
                ('商家入驻', 'merchant-apply.html', '🏪', '机构申请 · 开通上线', True),
                ('商家后台', 'merchant-dashboard.html', '📊', '经营数据 · 门店管理', False),
                ('订单中心', 'order-center.html', '🧾', '服务订单 · 履约跟进', False),
                ('服务套餐', 'shop.html', '🎁', '套餐上架 · 定价售卖', False),
            ]),
            ('门诊运营', '诊所流程 · 即开即用', [
                ('中医诊所', 'tcm-clinic.html', '🏥', '诊所流程 · 综合管理', True),
                ('综合门诊', 'integrated-clinic.html', '🩺', '取号问诊 · 流程驱动', False),
                ('诊疗中心', 'clinic-consultation.html', '🏷️', '科室分诊 · 叫号流转', False),
                ('医护问诊台', 'unified-consultation.html', '⚕️', 'AI 初诊 · 双师审核', False),
            ]),
            ('设备物联', '穿戴采集 · 运维诊断', [
                ('设备运维', 'device-management.html', '🛠️', '设备台账 · 在线状态', True),
                ('穿戴采集', 'wearable-hub.html', '⌚', '穿戴设备 · 医患数据采集', False),
                ('交互诊断', 'device-diagnostic.html', '🔧', '设备联调 · 交互自检', False),
                ('三轮审计', 'device-audit-rounds.html', '🔁', '设备健康 · 三轮巡检', False),
            ]),
            ('医技检验', '望诊检验 · 报告旁证', [
                ('望诊中心', 'wangzhen-center.html', '👁️', '面舌手目 · AI 望诊', True),
                ('体检 OCR', 'report-ocr.html', '📷', '体检报告 · 拍照识别', False),
                ('报告解读', 'report-interpret.html', '📄', '生化指标 · 白话解读', False),
                ('多源诊断', 'multi-source-diagnosis.html', '🔗', '四诊合参 · 多源汇聚', False),
                ('识别历史', 'ocr-history.html', '🗂️', 'OCR 记录 · 随时回看', False),
            ]),
        ],
    },
    'admin': {
        'name': '管理服务中心', 'seal': '管', 'accent': '#e67e22',
        'sub': '平台管理员 —— 运营监控，配置安全',
        'groups': [
            ('运营总览', '平台大盘 · 工单商城', [
                ('运营后台', 'admin.html', '📊', '平台运营 · 数据总览', True),
                ('监控总览', 'monitor-hub.html', '📡', '服务健康 · 实时监控', False),
                ('工单管理', 'admin-tickets.html', '🎫', '用户工单 · 处理跟进', False),
                ('商城管理', 'admin-shop.html', '🛒', '商品订单 · 商城运营', False),
            ]),
            ('系统配置', '引擎参数 · 运行健康', [
                ('配置中心', 'config-center.html', '⚙️', '系统参数 · 集中配置', False),
                ('AI 引擎配置', 'ai-engine-config.html', '🧠', '模型引擎 · 参数调优', False),
                ('引擎健康', 'vision-engine-health.html', '💚', '视觉引擎 · 健康巡检', False),
            ]),
            ('知识运营', '知识库建设与审计', [
                ('KB 洞察', 'kb-insights.html', '💡', '知识图谱 · 覆盖洞察', False),
                ('知识库浏览', 'kb-browser.html', '📚', '知识条目 · 浏览检索', False),
                ('KB 审计', 'kb-audit.html', '🔍', '知识质量 · 审计校核', False),
            ]),
            ('安全合规', '权限隐私 · 数据边界', [
                ('管理员登录', 'admin-login.html', '🔐', '身份认证 · 权限分级', False),
                ('隐私中心', 'privacy-center.html', '🛡️', '隐私合规 · 数据保护', False),
                ('导出管控', 'export-guard.html', '🚧', '数据导出 · 边界管控', False),
                ('免责声明', 'disclaimer.html', '📜', '平台免责 · 合规文本', False),
            ]),
        ],
    },
}

# 中心间互链顺序
NAV_ORDER = ['yuanzhu', 'patient', 'doctor', 'master', 'org', 'admin']

TEMPLATE = '''<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<title>{name} · 命理宝鉴</title>
<style>
:root{{--ink:#080808;--paper:#f0e8d8;--paper2:#d4c9b0;--paper3:#a09080;--gold:#c9a84c;--gold2:#e8cc7a;--cinn2:#e74c3c;--accent:{accent};--border:rgba(201,168,76,.15)}}
*{{margin:0;padding:0;box-sizing:border-box}}
body{{background:#080808;color:var(--paper);font-family:'Noto Serif SC','Songti SC',serif;font-size:13px;min-height:100vh}}
.wrap{{max-width:1080px;margin:0 auto;padding:20px 20px 90px;display:flex;flex-direction:column;gap:20px}}
.back{{color:var(--paper3);text-decoration:none;font-size:12px}}
.back:hover{{color:var(--gold2)}}
.hero{{display:flex;align-items:center;gap:16px;padding:20px 22px;border-radius:14px;background:linear-gradient(135deg,{accent}22,{accent}08);border:1px solid {accent}44}}
.hero img{{height:34px;width:auto}}
.hero-sub{{font-size:12px;color:var(--paper3);margin-top:6px;letter-spacing:.5px}}
.hero-seal{{margin-left:auto;width:52px;height:52px;border-radius:12px;background:{accent};color:#fff;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700;box-shadow:0 4px 16px {accent}66}}
.group-title{{display:flex;align-items:center;gap:10px;margin-top:6px}}
.group-badge{{font-size:11px;color:{accent};border:1px solid {accent}66;border-radius:4px;padding:2px 8px;letter-spacing:1px}}
.group-desc{{font-size:11px;color:var(--paper3)}}
.icon-grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px}}
@media(max-width:640px){{.icon-grid{{grid-template-columns:repeat(2,1fr);gap:10px}}}}
.icon-card{{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:20px 12px;border-radius:12px;background:rgba(255,255,255,.025);border:1px solid rgba(201,168,76,.10);text-decoration:none;color:inherit;transition:all .25s;position:relative;min-height:128px;text-align:center}}
.icon-card:hover{{transform:translateY(-3px);background:{accent}14;border-color:{accent}66;box-shadow:0 8px 24px rgba(0,0,0,.4)}}
.icon-card[data-hot="true"]::before{{content:"";position:absolute;top:8px;right:8px;width:6px;height:6px;border-radius:50%;background:var(--cinn2);box-shadow:0 0 8px var(--cinn2)}}
.icon-glyph{{font-size:26px;line-height:1}}
.icon-name{{font-size:14px;color:var(--paper);letter-spacing:1px}}
.icon-name-img{{height:24px;width:auto;display:block;margin:0 auto}}
.icon-sub{{font-size:11px;color:var(--paper3)}}
.center-nav{{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:14px;padding-top:18px;border-top:1px solid rgba(201,168,76,.12)}}
.center-nav a{{font-size:12px;color:var(--paper3);text-decoration:none;border:1px solid rgba(201,168,76,.18);border-radius:16px;padding:6px 14px;transition:all .2s}}
.center-nav a:hover{{color:var(--gold2);border-color:var(--gold)}}
.foot{{text-align:center;font-size:11px;color:rgba(255,255,255,.28);margin-top:8px}}
</style>
</head>
<body>
<div class="wrap">
  <a class="back" href="index.html">← 返回入口大厅</a>
  <div class="hero">
    <div>
      <img src="assets/titles/center-{key}.png" alt="{name}">
      <div class="hero-sub">{sub}</div>
    </div>
    <div class="hero-seal">{seal}</div>
  </div>
{sections}
  <div class="center-nav">
{navlinks}
  </div>
  <div class="foot">命理宝鉴 · {name} · 各角色服务中心互链互通</div>
</div>
<script src="js/mobile-nav.js" defer></script>
</body>
</html>
'''

def build():
    for key, cfg in CENTERS.items():
        sections = []
        for gname, gdesc, cards in cfg['groups']:
            card_html_list = []
            for nm, href, ico, ds, hot in cards:
                lkey = 'c-{}-{}'.format(key, hashlib.md5(nm.encode('utf-8')).hexdigest()[:8])
                _label_img(lkey, nm)
                card_html_list.append(
                    '    <a class="icon-card" href="{href}"{hot}>\n'
                    '      <div class="icon-glyph">{ico}</div>\n'
                    '      <img class="icon-name-img" src="assets/titles/{lkey}.png" alt="{nm}">\n'
                    '      <div class="icon-sub">{ds}</div>\n'
                    '    </a>'.format(href=href, ico=ico, nm=nm, ds=ds, lkey=lkey,
                                   hot=' data-hot="true"' if hot else ''))
            cards_html = '\n'.join(card_html_list)
            sections.append(
                '  <section>\n'
                '    <div class="group-title">\n'
                '      <span class="group-badge">{gname}</span>\n'
                '      <span class="group-desc">{gdesc}</span>\n'
                '    </div>\n'
                '    <div class="icon-grid">\n{cards}\n    </div>\n'
                '  </section>'.format(gname=gname, gdesc=gdesc, cards=cards_html))
        navlinks = '\n'.join(
            '    <a href="center-{k}.html">{n}</a>'.format(k=k, n=CENTERS[k]['name'])
            for k in NAV_ORDER if k != key)
        html = TEMPLATE.format(
            key=key, name=cfg['name'], seal=cfg['seal'],
            accent=cfg['accent'], sub=cfg['sub'],
            sections='\n'.join(sections), navlinks=navlinks)
        out = APP / f'center-{key}.html'
        out.write_text(html)
        total = sum(len(g[2]) for g in cfg['groups'])
        print(f'{out.name}: {len(cfg["groups"])} 组 {total} 卡')

if __name__ == '__main__':
    build()
