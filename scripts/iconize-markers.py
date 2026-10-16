#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
iconize-markers.py · 单字占位标识 → 形象 SVG 图标 一次性 codemod
用法: python3 scripts/iconize-markers.py
规则: 白名单精确串替换; 任一 old 未命中即报错退出(防 typo 静默漏改)
"""
import sys, io, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def svg(body):
    return ('<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
            'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" '
            'style="vertical-align:-0.15em" aria-hidden="true">' + body + '</svg>')

ICONS = {
  'moon':     svg('<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>'),
  'taiji':    svg('<circle cx="12" cy="12" r="9"/><path d="M12 3a4.5 4.5 0 0 1 0 9 4.5 4.5 0 0 0 0 9"/><circle cx="12" cy="7.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="12" cy="16.5" r="1.1" fill="currentColor" stroke="none"/>'),
  'music':    svg('<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>'),
  'chat':     svg('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>'),
  'lock':     svg('<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>'),
  'key':      svg('<circle cx="8" cy="16" r="5"/><path d="M11.5 12.5 21 3m-4 1 3 3"/>'),
  'user':     svg('<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6"/>'),
  'coin':     svg('<circle cx="12" cy="12" r="9"/><path d="M8 8l4 5 4-5M12 13v5M9 15.5h6M9 18h6"/>'),
  'store':    svg('<path d="M4 9l1.5-5h13L20 9M4 9v11h16V9M4 9h16M9 20v-6h6v6"/>'),
  'crown':    svg('<path d="M3 8l3.5 3.5L12 4l5.5 7.5L21 8l-1.8 10H4.8z"/>'),
  'faces':    svg('<circle cx="9" cy="9" r="3.5"/><path d="M2.5 19c0-3 3-4.5 6.5-4.5 1.5 0 2.8.3 3.9.8"/><circle cx="17" cy="8" r="2.5"/><path d="M15.2 14.9c2.6.4 4.8 1.9 4.8 4.1"/>'),
  'drop':     svg('<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>'),
  'leaf':     svg('<path d="M6 18C6 9 11 4 20 4c0 9-5 14-14 14z"/><path d="M6 18c2.5-4.5 5.5-7.5 9-9"/>'),
  'hourglass':svg('<path d="M6 3h12M6 21h12M7.5 3c0 5 4.5 5 4.5 9s-4.5 4-4.5 9M16.5 3c0 5-4.5 5-4.5 9s4.5 4 4.5 9"/>'),
  'trash':    svg('<path d="M4 7h16M9 7V4h6v3M6.5 7l1 13h9l1-13M10 11v5M14 11v5"/>'),
  'empty':    svg('<circle cx="12" cy="12" r="9"/><path d="M8 12h8"/>'),
  'sun':      svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/>'),
  'book':     svg('<path d="M5 4a2 2 0 0 1 2-2h12v18H7a2 2 0 0 1-2-2z"/><path d="M5 18a2 2 0 0 1 2-2h12"/>'),
  'beads':    svg('<circle cx="12" cy="4" r="1.8"/><circle cx="17.7" cy="6.5" r="1.8"/><circle cx="20" cy="12" r="1.8"/><circle cx="17.7" cy="17.5" r="1.8"/><circle cx="12" cy="20" r="1.8"/><circle cx="6.3" cy="17.5" r="1.8"/><circle cx="4" cy="12" r="1.8"/><circle cx="6.3" cy="6.5" r="1.8"/>'),
}

def rep(icon, label):
    return '>' + ICONS[icon] + ' ' + label

# file -> [(old, new)] ; 顺序敏感: 长串在前
MAP = {
 'app/ai-assistant.html': [
   ('>夜 沉浸<', rep('moon', '沉浸<')),
   ('>珠 排八字<', rep('taiji', '排八字<')),
   ('>音 五行音乐<', rep('music', '五行音乐<')),
   ('>语 意见反馈<', rep('chat', '意见反馈<')),
   ('>语 站内消息<', rep('chat', '站内消息<')),
   ('>锁 隐私<', rep('lock', '隐私<')),
   ('>密 登录<', rep('key', '登录<')),
   ('>人 档案<', rep('user', '档案<')),
 ],
 'app/admin-notify.html': [('>空 暂无通知记录<', rep('empty', '暂无通知记录<'))],
 'app/export-guard.html': [
   ('>锁 数据安全导出 · 管理面板<', rep('lock', '数据安全导出 · 管理面板<')),
   ('>密 加密归档<', rep('key', '加密归档<')),
 ],
 'app/daily-summary.html': [('>语 智能助手<', rep('chat', '智能助手<'))],
 'app/merchant-apply.html': [('>店 商家入驻申请<', rep('store', '商家入驻申请<'))],
 'app/feedback-detail.html': [
   ('>密 登录<', rep('key', '登录<')),
   ('>语 官方回复<', rep('chat', '官方回复<')),
 ],
 'app/masters.html': [('>冠 国医大师名家介绍<', rep('crown', '国医大师名家介绍<'))],
 'app/personal-push.html': [
   ('>面 千人千面 · 居家个性化推送<', rep('faces', '千人千面 · 居家个性化推送<')),
   ('>湿 水弱体质（肾）<', rep('drop', '水弱体质（肾）<')),
 ],
 'app/wearable-hub.html': [('>人 患者端<', rep('user', '患者端<'))],
 'app/eval-dashboard.html': [
   ('>财 平均成本趋势<', rep('coin', '平均成本趋势<')),
   ('>财 成本<', rep('coin', '成本<')),
 ],
 'app/admin.html': [
   ('>语 站内消息<', rep('chat', '站内消息<')),
   ('>财 今日收入<', rep('coin', '今日收入<')),
   ('>人 性别分布<', rep('user', '性别分布<')),
   ('>财 收入统计<', rep('coin', '收入统计<')),
   ('>财 已发积分<', rep('coin', '已发积分<')),
   ('>语 智慧语录管理<', rep('chat', '智慧语录管理<')),
   ('>财 付费转化分析<', rep('coin', '付费转化分析<')),
 ],
 'app/wechat-h5.html': [  # <option> 不能含 SVG → 仅剥掉占位字
   ('>音 五行音疗<', '>五行音疗<'),
   ('>语 综合分析<', '>综合分析<'),
 ],
 'app/health-career-dashboard.html': [('>人 适用：个人自查 / 周易大师后台评估<', rep('user', '适用：个人自查 / 周易大师后台评估<'))],
 'app/divination-knowledge.html': [
   ('>珠 经典诵读 · 持诵增慧<', rep('book', '经典诵读 · 持诵增慧<')),
   ('>珠 经典诵读<', rep('book', '经典诵读<')),
   ('>音 梵音妙乐 · 以音入道<', rep('music', '梵音妙乐 · 以音入道<')),
   ('>音 梵音音乐<', rep('music', '梵音音乐<')),
   ('>音 养生静心开运音乐<', rep('music', '养生静心开运音乐<')),
   ('>音 五音疗疾 · 以音调五脏<', rep('music', '五音疗疾 · 以音调五脏<')),
   ('>语 言值<', rep('chat', '言值<')),
   ('>夜 静心养神、消业增福<', rep('moon', '静心养神、消业增福<')),
   ('>夜 安神入眠、消业护身<', rep('moon', '安神入眠、消业护身<')),
   ('>日 开慧增运、清净身心<', rep('sun', '开慧增运、清净身心<')),
   ('>日 初发心<', rep('sun', '初发心<')),
   ('>珠 文殊菩萨智慧咒<', rep('beads', '文殊菩萨智慧咒<')),
   ('>财 旺财运口诀<', rep('coin', '旺财运口诀<')),
   ('>财 财神赵公明咒<', rep('coin', '财神赵公明咒<')),
   ('>木 木行饮食（利肝胆）<', rep('leaf', '木行饮食（利肝胆）<')),
   ('>湿 水行饮食（利肾）<', rep('drop', '水行饮食（利肾）<')),
   ('>冠 打卡成就<', rep('crown', '打卡成就<')),
 ],
 'app/feedback-center.html': [
   ('>密 登录<', rep('key', '登录<')),
   ('>语 意见反馈<', rep('chat', '意见反馈<')),
   ('>语 官方已回复<', rep('chat', '官方已回复<')),
 ],
 'app/person-dashboard.html': [
   ('>人 人物档案看板<', rep('user', '人物档案看板<')),
   ('>人 李明<', rep('user', '李明<')),
   ('>人 测试用户5<', rep('user', '测试用户5<')),
   ('>人 测试用户6<', rep('user', '测试用户6<')),
   ('>人 测试用户7<', rep('user', '测试用户7<')),
 ],
 'app/health-forecast.html': [('>人 适用：个人年度健康自查 · 基于日主五行→脏腑对应·月令旺衰推演<', rep('user', '适用：个人年度健康自查 · 基于日主五行→脏腑对应·月令旺衰推演<'))],
 'app/home-care.html': [
   ('>面 千人千面<', rep('faces', '千人千面<')),
   ('>语 症状交互对话 ', rep('chat', '症状交互对话 ')),
 ],
 'app/master-disease.html': [
   ('>亡 断寿元生死<', rep('hourglass', '断寿元生死<')),
   ('>亡 寿元生死<', rep('hourglass', '寿元生死<')),
 ],
 'app/merchant-dashboard.html': [
   ('>店 商家后台<', rep('store', '商家后台<')),
   ('>财 收入明细<', rep('coin', '收入明细<')),
   ('>财 收入<', rep('coin', '收入<')),
   ('>店 商家信息<', rep('store', '商家信息<')),
 ],
 'app/privacy-center.html': [
   ('>锁 隐私中心<', rep('lock', '隐私中心<')),
   ('>亡 立即物理删除<', rep('trash', '立即物理删除<')),
 ],
 'app/divination-shop.html': [('>店 道观寺庙/大师入驻 →<', rep('store', '道观寺庙/大师入驻 →<'))],
 'app/glass-console.html': [
   ('>语 问诊 <span class="badge" id="askCount">', rep('chat', '问诊 <span class="badge" id="askCount">')),
   ('>语 问诊<', rep('chat', '问诊<')),
   ('>音 五行音乐<', rep('music', '五行音乐<')),
 ],
 'app/wechat-hub.html': [
   ('>密 登录<', rep('key', '登录<')),
   ('>珠 咒语推荐（命理匹配咒语）<', rep('beads', '咒语推荐（命理匹配咒语）<')),
 ],
 'app/lifeflow-report.html': [('>夜 流月<', rep('moon', '流月<'))],
 'app/master-zidise-illness.html': [('>夜 起居调养·12 时辰·季节·房事<', rep('moon', '起居调养·12 时辰·季节·房事<'))],
 'app/lifeflow-timeline.html': [
   ('>冠 黄金 5 年 vs ⚠️ 谨慎 5 年<', rep('crown', '黄金 5 年 vs ⚠️ 谨慎 5 年<')),
   ('>冠 黄金 5 年<', rep('crown', '黄金 5 年<')),
 ],
 'app/zhanbu.html': [('>人 盘<', rep('user', '盘<'))],
 'app/kb-hit-dashboard.html': [('>冠 模块命中排行（Top 10）<', rep('crown', '模块命中排行（Top 10）<'))],
 'app/device-test.html': [('>锁 安全上下文<', rep('lock', '安全上下文<'))],
 'app/divination-integrated.html': [
   ('>人 信众中心<', rep('user', '信众中心<')),
   ('>夜 阴虚<', rep('moon', '阴虚<')),
   ('>日 阳虚<', rep('sun', '阳虚<')),
   ('>湿 痰湿<', rep('drop', '痰湿<')),
 ],
 'app/nihaisha-learning.html': [
   ('>语 白话问答<', rep('chat', '白话问答<')),
   ('>日 太阳<', rep('sun', '太阳<')),
 ],
}

def main():
    total_files = 0
    total_repl = 0
    errors = []
    for rel, pairs in MAP.items():
        path = os.path.join(ROOT, rel)
        with io.open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        orig = content
        for old, new in pairs:
            if old not in content:
                errors.append('%s: 未命中 %r' % (rel, old[:30]))
                continue
            n = content.count(old)
            content = content.replace(old, new)
            total_repl += n
        if content != orig:
            with io.open(path, 'w', encoding='utf-8') as f:
                f.write(content)
            total_files += 1
    print('files touched: %d, replacements: %d' % (total_files, total_repl))
    if errors:
        print('ERRORS:')
        for e in errors:
            print('  ' + e)
        sys.exit(1)
    print('all whitelist entries hit ✓')

if __name__ == '__main__':
    main()
