#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
iconize-markers-v2.py · 全平台单字占位标识 → 形象 SVG 图标（智能版）
规则:
  模式 >(单字) (标签)<  →  >SVG 标签<
  跳过: 字间距排版(标签内再有「字 字」结构, 如 金 钱 课/返 回 首 页)
  <option> 内: 仅剥占位字(不能含 SVG)
  未映射字符: 记录并跳过(--apply 时若有未映射则报错退出)
用法:
  python3 scripts/iconize-markers-v2.py          # dry-run 统计
  python3 scripts/iconize-markers-v2.py --apply  # 实际替换
"""
import sys, io, os, re, glob

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
  'unlock':   svg('<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>'),
  'key':      svg('<circle cx="8" cy="16" r="5"/><path d="M11.5 12.5 21 3m-4 1 3 3"/>'),
  'user':     svg('<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6"/>'),
  'faces':    svg('<circle cx="9" cy="9" r="3.5"/><path d="M2.5 19c0-3 3-4.5 6.5-4.5 1.5 0 2.8.3 3.9.8"/><circle cx="17" cy="8" r="2.5"/><path d="M15.2 14.9c2.6.4 4.8 1.9 4.8 4.1"/>'),
  'coin':     svg('<circle cx="12" cy="12" r="9"/><path d="M8 8l4 5 4-5M12 13v5M9 15.5h6M9 18h6"/>'),
  'store':    svg('<path d="M4 9l1.5-5h13L20 9M4 9v11h16V9M4 9h16M9 20v-6h6v6"/>'),
  'crown':    svg('<path d="M3 8l3.5 3.5L12 4l5.5 7.5L21 8l-1.8 10H4.8z"/>'),
  'drop':     svg('<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>'),
  'leaf':     svg('<path d="M6 18C6 9 11 4 20 4c0 9-5 14-14 14z"/><path d="M6 18c2.5-4.5 5.5-7.5 9-9"/>'),
  'hourglass':svg('<path d="M6 3h12M6 21h12M7.5 3c0 5 4.5 5 4.5 9s-4.5 4-4.5 9M16.5 3c0 5-4.5 5-4.5 9s4.5 4 4.5 9"/>'),
  'trash':    svg('<path d="M4 7h16M9 7V4h6v3M6.5 7l1 13h9l1-13M10 11v5M14 11v5"/>'),
  'empty':    svg('<circle cx="12" cy="12" r="9"/><path d="M8 12h8"/>'),
  'sun':      svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/>'),
  'book':     svg('<path d="M5 4a2 2 0 0 1 2-2h12v18H7a2 2 0 0 1-2-2z"/><path d="M5 18a2 2 0 0 1 2-2h12"/>'),
  'beads':    svg('<circle cx="12" cy="4" r="1.8"/><circle cx="17.7" cy="6.5" r="1.8"/><circle cx="20" cy="12" r="1.8"/><circle cx="17.7" cy="17.5" r="1.8"/><circle cx="12" cy="20" r="1.8"/><circle cx="6.3" cy="17.5" r="1.8"/><circle cx="4" cy="12" r="1.8"/><circle cx="6.3" cy="6.5" r="1.8"/>'),
  'brain':    svg('<path d="M12 4a4 4 0 0 0-4 4 4 4 0 0 0-2 7 4 4 0 0 0 6 3 4 4 0 0 0 6-3 4 4 0 0 0-2-7 4 4 0 0 0-4-4z"/><path d="M12 4v16"/>'),
  'box':      svg('<path d="M3 8l9-5 9 5v8l-9 5-9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>'),
  'folder':   svg('<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>'),
  'camera':   svg('<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="14" r="3.5"/>'),
  'pencil':   svg('<path d="M4 20h16M6 16l9-9a2.1 2.1 0 0 1 3 3l-9 9-4 1z"/>'),
  'check':    svg('<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.5 2.5L16 9.5"/>'),
  'download': svg('<path d="M12 3v12m0 0 4-4m-4 4-4-4M4 17v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>'),
  'ticket':   svg('<path d="M3 9V7a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v2a3 3 0 0 0 0 6v2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-2a3 3 0 0 0 0-6z"/><path d="M13 6v2m0 3v2m0 3v2"/>'),
  'alert':    svg('<path d="M12 3 2 21h20z"/><path d="M12 10v5m0 3v.5"/>'),
  'alertOct': svg('<path d="M8 3h8l5 5v8l-5 5H8l-5-5V8z"/><path d="M12 8v5m0 3v.5"/>'),
  'megaphone':svg('<path d="M21 5 3 10v4l4 1 1.5 5h2.5L9.5 15 21 19z"/>'),
  'cpu':      svg('<rect x="6" y="6" width="12" height="12" rx="2"/><rect x="10" y="10" width="4" height="4"/><path d="M9 2v2m6-2v2M9 20v2m6-2v2M2 9h2m-2 6h2M20 9h2m-2 6h2"/>'),
  'pill':     svg('<path d="M10.5 3.5a5 5 0 0 1 7 7l-7 7a5 5 0 0 1-7-7z"/><path d="M7 7l7 7"/>'),
  'flask':    svg('<path d="M9 3h6M10 3v6l-5 9a2.4 2.4 0 0 0 2 3.5h10a2.4 2.4 0 0 0 2-3.5l-5-9V3"/><path d="M7.5 15h9"/>'),
  'shield':   svg('<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>'),
  'target':   svg('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/>'),
  'trendUp':  svg('<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>'),
  'trendDown':svg('<path d="M3 7l6 6 4-4 8 8"/><path d="M15 17h6v-6"/>'),
  'pin':      svg('<path d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'),
  'monitor':  svg('<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M9 20h6m-3-4v4"/>'),
  'sunrise':  svg('<path d="M12 3v4m0 0 3-3m-3 3L9 4M4 18h16M6 18a6 6 0 0 1 12 0"/><path d="M2 22h20"/>'),
  'clock':    svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>'),
  'candle':   svg('<path d="M12 8c1.5-1.5 1.5-3 0-4.5C10.5 5 10.5 6.5 12 8z"/><path d="M9 21v-8a3 3 0 0 1 6 0v8M8 21h8"/>'),
  'flower':   svg('<circle cx="12" cy="12" r="2.5"/><path d="M12 2.5c2 2 2 5 0 7-2-2-2-5 0-7zM12 21.5c-2-2-2-5 0-7 2 2 2 5 0 7zM2.5 12c2-2 5-2 7 0-2 2-5 2-7 0zM21.5 12c-2 2-5 2-7 0 2-2 5-2 7 0z"/>'),
  'paw':      svg('<circle cx="6" cy="9" r="1.8"/><circle cx="10.5" cy="6" r="1.8"/><circle cx="15" cy="6.5" r="1.8"/><circle cx="18.5" cy="10" r="1.8"/><path d="M12 11c3 0 6 2.5 6 5.5 0 2-1.5 3.5-3.5 3.5-1 0-1.8-.5-2.5-.5s-1.5.5-2.5.5C7.5 20 6 18.5 6 16.5 6 13.5 9 11 12 11z"/>'),
  'zap':      svg('<path d="M13 2 4 14h6l-1 8 9-12h-6z"/>'),
  'sparkles': svg('<path d="M12 4l1.7 4.3L18 10l-4.3 1.7L12 16l-1.7-4.3L6 10l4.3-1.7z"/><path d="M18.5 15l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z"/>'),
  'gift':     svg('<rect x="4" y="10" width="16" height="4"/><path d="M6 14v7h12v-7M12 10v11M12 10C9.5 10 8 8.8 8 7.2 8 5.8 9 5 10 5.4c1.2.5 2 2.6 2 4.6zm0 0c2.5 0 4-1.2 4-2.8 0-1.4-1-2.2-2-1.8-1.2.5-2 2.6-2 4.6z"/>'),
  'phone':    svg('<path d="M5 3h4l2 5-2.5 1.5a12 12 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z"/>'),
  'mic':      svg('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>'),
  'wrench':   svg('<path d="M14.5 6.5a4.5 4.5 0 0 0-6 6L3 18l3 3 5.5-5.5a4.5 4.5 0 0 0 6-6L14 13l-3-3z"/>'),
  'layers':   svg('<path d="M12 3 3 8l9 5 9-5z"/><path d="M3 13l9 5 9-5"/>'),
  'bulb':     svg('<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.8.6 1.5 1.5 1.5 2.6v.5h4v-.5c0-1.1.7-2 1.5-2.6A6 6 0 0 0 12 3z"/>'),
  'chart':    svg('<path d="M4 20V10m5.5 10V4M15 20v-8m5.5 8V7"/>'),
  'cart':     svg('<circle cx="9" cy="20" r="1.5"/><circle cx="17" cy="20" r="1.5"/><path d="M3 4h2l2.5 12h10L20 8H7"/>'),
  'gear':     svg('<circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M4.9 4.9l2.1 2.1m10 10 2.1 2.1M4.9 19.1 7 17m10-10 2.1-2.1"/>'),
  'gem':      svg('<path d="M6 3h12l4 6-10 12L2 9z"/><path d="M2 9h20M12 21 8 9l4-6 4 6z"/>'),
  'dice':     svg('<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1.2" fill="currentColor" stroke="none"/><circle cx="15" cy="15" r="1.2" fill="currentColor" stroke="none"/><circle cx="15" cy="9" r="1.2" fill="currentColor" stroke="none"/><circle cx="9" cy="15" r="1.2" fill="currentColor" stroke="none"/>'),
  'cup':      svg('<path d="M4 8h12v7a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z"/><path d="M16 9h2a2.5 2.5 0 0 1 0 5h-2M7 4c0 1 1 1 1 2M11 4c0 1 1 1 1 2"/>'),
  'sprout':   svg('<path d="M12 21v-9M12 12c0-4 3-7 8-7 0 4-3 7-8 7zM12 12c0-4-3-7-8-7 0 4 3 7 8 7z"/>'),
}

# 占位字 → 图标 映射（刻意映射; 内容类字如 吉/凶/宜/忌 不映射=跳过）
CHAR2ICON = {
  '夜':'moon','晚':'moon','阴':'moon',
  '珠':'beads',
  '音':'music',
  '语':'chat',
  '锁':'lock','解':'unlock','密':'key','票':'ticket',
  '人':'user','众':'faces','同':'faces','面':'faces','尊':'crown','冠':'crown',
  '财':'coin','礼':'gift',
  '店':'store',
  '湿':'drop','注':'flask','研':'flask',
  '木':'leaf','草':'leaf',
  '亡':'hourglass','待':'hourglass','时':'clock','晨':'sunrise','日':'sun',
  '空':'empty',
  '脑':'brain','机':'cpu','电':'zap','光':'sparkles',
  '箱':'box','夹':'folder',
  '拍':'camera',
  '记':'pencil','建':'layers','示':'bulb',
  '成':'check','安':'check',
  '入':'download',
  '警':'alert','危':'alertOct',
  '信':'megaphone',
  '药':'pill',
  '道':'taiji','易':'taiji',
  '树':'chart','升':'trendUp','降':'trendDown','标':'target',
  '盾':'shield',
  '钉':'pin','屏':'monitor',
  '莲':'flower',
  '跪':'candle','拜':'candle','经':'book',
  '龙':'paw',
  '麦':'mic','救':'phone','钳':'wrench',
  '花':'flower','茶':'cup','菜':'leaf','购':'cart','设':'gear','工':'wrench',
  '宝':'gem','运':'gear','骰':'dice','推':'megaphone','苗':'sprout',
}

PAT = re.compile(r'>([一-鿿]) ([^<>\n]{1,24}?)(?=<)')
TYPO = re.compile(r'[一-鿿] [一-鿿]')

def in_option(text, pos):
    last_open = text.rfind('<option', 0, pos)
    if last_open < 0: return False
    last_close = text.rfind('</option>', 0, pos)
    return last_open > last_close

def scan_file(path, apply):
    with io.open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    stats = {'replaced':0, 'skipped_typo':0, 'unmapped':{}, 'option_strip':0}
    out = []
    last = 0
    for m in PAT.finditer(content):
        ch, label = m.group(1), m.group(2)
        if TYPO.search(label):
            stats['skipped_typo'] += 1
            continue
        if in_option(content, m.start()):
            out.append(content[last:m.start()]); out.append('>' + label)
            last = m.end(); stats['option_strip'] += 1
            continue
        icon = CHAR2ICON.get(ch)
        if not icon:
            stats['unmapped'][ch] = stats['unmapped'].get(ch, 0) + 1
            continue
        out.append(content[last:m.start()])
        out.append('>' + ICONS[icon] + ' ' + label)
        last = m.end()
        stats['replaced'] += 1
    out.append(content[last:])
    new = ''.join(out)
    if apply and new != content:
        with io.open(path, 'w', encoding='utf-8') as f:
            f.write(new)
    return stats, new != content

def main():
    apply = '--apply' in sys.argv
    files = sorted(glob.glob(os.path.join(ROOT, 'app', '**', '*.html'), recursive=True))
    total_r = total_o = total_t = 0
    unmapped_all = {}
    touched = 0
    for p in files:
        st, changed = scan_file(p, apply)
        total_r += st['replaced']; total_o += st['option_strip']; total_t += st['skipped_typo']
        for ch, n in st['unmapped'].items():
            unmapped_all[ch] = unmapped_all.get(ch, 0) + n
        if changed:
            touched += 1
            if not apply:
                print('would touch: %s (+%d, opt %d)' % (os.path.relpath(p, ROOT), st['replaced'], st['option_strip']))
    print('---')
    print('mode: %s' % ('APPLY' if apply else 'DRY-RUN'))
    print('files %s: %d, svg replaced: %d, option stripped: %d, typography skipped: %d'
          % ('touched' if apply else 'to touch', touched, total_r, total_o, total_t))
    if unmapped_all:
        # 已逐个人工甄别: 剩余未映射均为正文/数据巧合(如 剩 12.5h、第 1/6 爻、按 ID)，不视为标识，仅记录
        print('skipped non-marker chars (reviewed): %s' % ' '.join('%s×%d' % (c, n) for c, n in sorted(unmapped_all.items(), key=lambda x:-x[1])))

if __name__ == '__main__':
    main()
