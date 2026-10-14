#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Kanripo(漢籍リポジトリ)四库本原典采集器
源头铁律：仅收公有领域原典全文（文渊阁四库全书本 WYG），不收今人注释/网文。
用法：python3 fetch-classics-kanripo.py [--only=书名,书名] [--dry]
"""
import json, re, sys, time, hashlib, sqlite3, urllib.parse, subprocess
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from lib.kb_ingest import KBIngestor, fingerprint_of  # R-INGEST-SPEC-20260927 新口径

DB = Path(__file__).parent.parent / 'server' / 'database' / 'yidao.db'
INGESTOR = None  # main() 中初始化
UA = 'mingli-baojian-classics-collector/1.0 (local knowledge base)'
DRY = '--dry' in sys.argv

# (书名, KB module, 主题关键词)
BOOKS = [
    ('遁甲演義', 'qimen', '奇门遁甲,符使,格局,遁甲源流'),
    ('六壬大全', 'liuren', '六壬,课经,毕法赋,十二课'),
    ('焦氏易林', 'yizhan', '易林,焦延寿,繇辞,占验'),
    ('協紀辨方書', 'zeri', '择日,钦定,神煞,用事宜忌'),
    ('五行精紀', 'bazi', '八字,廖中,纳音,神煞'),
    ('京氏易傳', 'yizhan', '京房,纳甲,飞伏,世应'),
    ('靈棋經', 'yizhan', '灵棋经,占卜,象数'),
    ('皇極經世書', 'yizhan', '邵雍,元会运世,先天易'),
    ('宅經', 'fengshui', '风水,黄帝宅经,阴阳宅'),
    ('撼龍經', 'fengshui', '风水,杨筠松,龙脉,寻龙'),
    ('疑龍經', 'fengshui', '风水,杨筠松,龙脉'),
    ('葬書', 'fengshui', '风水,郭璞,生气,藏风聚气'),
    ('青囊序', 'fengshui', '风水,曾求己,玄空,二十四山'),
    # ── 2026-10-14 净源二梯队（章程书单缺口）──
    ('周易本義', 'yijing', '朱熹,本义,卦爻辞,易学'),
    ('河洛理數', 'shuzi', '河图洛书,陈抟,邵雍,数术'),
    ('星平會海', 'bazi', '星平会海,子平,七政,命理'),
    ('陽宅十書', 'fengshui', '阳宅,王君荣,宅法,形法'),
    ('擇吉彙要', 'zeri', '择吉,汇要,宜忌'),
    ('赤松子章曆', 'keyi', '赤松子,章历,天师道,上章'),
    ('元辰章醮立成曆', 'keyi', '元辰,拜太岁,醮仪,章醮'),
    ('麻衣神相', 'xiangshu', '麻衣,相法,面相'),
    ('水鏡相法', 'xiangshu', '水镜,相法,面相'),
]

def fetch(url, retry=3, timeout=30):
    last = ''
    for i in range(retry):
        try:
            r = subprocess.run(['curl', '-s', '-m', str(timeout), '-A', UA, url],
                               capture_output=True, timeout=timeout + 15)
            last = r.stdout.decode('utf-8', 'replace')
            if last.strip():
                return last
        except Exception:
            pass
        time.sleep(1.5 * (i + 1))
    return last

def find_repo(book):
    """kanripo titlesearch 找仓库号（如 KR3g0048）
    2026-10-14：kanripo.org 被 Cloudflare 拦截，改 GitHub 仓库搜索 API + 人工定档覆盖表"""
    if book in REPO_OVERRIDE:
        return REPO_OVERRIDE[book]
    q = urllib.parse.quote(book)
    d = fetch(f'https://api.github.com/search/repositories?q={q}+org:kanripo&per_page=5')
    try:
        items = json.loads(d).get('items', [])
    except Exception:
        items = []
    # 精确匹配「书名-朝代-」描述，防「周易本義」命中「周易本義通釋」
    for it in items:
        if (it.get('description') or '').startswith(book + '-'):
            return it['name']
    return items[0]['name'] if items else None

# 2026-10-14 净源二梯队定档（GitHub org:kanripo 搜索实证）
REPO_OVERRIDE = {
    '周易本義': 'KR1a0031',      # 原本周易本義（宋·朱熹）
    '京氏易傳': 'KR3g0030',      # 京氏易傳（漢·京房）
    '葬書': 'KR3g0020',          # 葬書（晉·郭璞）
    '赤松子章曆': 'KR5b0320',    # 赤松子章曆（六朝，道藏）
    '元辰章醮立成曆': 'KR5g0097', # 元辰章醮立成曆（六朝，道藏；拜太岁源头）
}

def list_texts(repo):
    """GitHub API 列仓库内 _NNN.txt 文件"""
    d = fetch(f'https://api.github.com/repos/kanripo/{repo}/contents/')
    try:
        files = json.loads(d)
    except Exception:
        return []
    names = [f['name'] for f in files if re.match(rf'{repo}_\d{{3}}\.txt$', f.get('name', ''))]
    return sorted(names)

def clean_kanripo(txt):
    # 去 emacs mandoku 头
    txt = re.sub(r'^#.*\n', '', txt, flags=re.M)
    # 去页码标记 <pb:...>¶ 与 ¶
    txt = re.sub(r'<[^>]+>', '', txt)
    txt = txt.replace('¶', '')
    # 去 JUAN 目录行残留的纯空白
    txt = re.sub(r'\n{3,}', '\n\n', txt)
    return txt.strip()

def ingest(c, conn, book, module, kw, sec_name, body):
    body = body.strip()
    if len(body) < 100:
        return 0, 0
    kt = f'原典·{book}·{sec_name}'
    content = f'【{book}·{sec_name}】（公有领域原典·Kanripo 漢籍全文）\n\n{body}\n\n关键词：{book} {sec_name} {kw.replace(",", " ")}'
    # entry_id 含全 category 路径防截断撞键；指纹幂等替代旧 title 查重
    eid = f"KR|{module}|{book}|{sec_name}|{fingerprint_of(content)[:8]}"
    if not DRY:
        ok, why = INGESTOR.insert(
            entry_id=eid, module=module, title=kt, content=content,
            category=module, keywords=f'{book},{sec_name},{kw}',
            tags=[book, sec_name, '原典', 'kanripo'],
            domain='mingli', trust=0.95, source='kanripo')
        if not ok:
            return (0, 1) if why == 'duplicate' else (_ for _ in ()).throw(RuntimeError(why))
    return 1, 0

def main():
    global INGESTOR
    only = None
    for a in sys.argv:
        if a.startswith('--only='):
            only = a[7:].split(',')
    books = [b for b in BOOKS if not only or b[0] in only]
    conn = sqlite3.connect(str(DB))
    c = conn.cursor()
    INGESTOR = KBIngestor(conn)
    total_new = total_skip = 0
    report = []
    for book, module, kw in books:
        try:
            repo = find_repo(book)
            if not repo:
                report.append(f'{book}: ✗ Kanripo 未收录')
                continue
            names = list_texts(repo)
            if not names:
                report.append(f'{book} [{repo}]: ✗ 无文本文件')
                continue
            ins = skip = 0
            for name in names:  # _000 是目录/序，跳过大部头目录但保留序
                vol = name.replace('.txt', '').split('_')[1]
                if vol == '000':
                    continue
                txt = clean_kanripo(fetch(f'https://raw.githubusercontent.com/kanripo/{repo}/master/{name}'))
                if len(txt) < 100:
                    continue
                # 卷名：从文本内 JUAN 行或首行提取
                m = re.search(rf'{re.escape(book)}(?:卷[一二三四五六七八九十百〇零\d]+)?', txt[:200])
                sec = m.group(0) if m else f'卷{int(vol):02d}'
                sec = f'{sec}'
                r_ins, r_skip = ingest(c, conn, book, module, kw, f'{sec}', txt)
                ins += r_ins; skip += r_skip
            total_new += ins; total_skip += skip
            report.append(f'{book} [{repo}]: +{ins} 卷（跳过 {skip}）')
        except Exception as e:
            report.append(f'{book}: ✗ {e}')
    if not DRY:
        INGESTOR.commit()
        # 2026-10-14 R827 口径：fts5 唯一合法写入口是 kb-sync-guard（影子索引秒级同步），
        # 旧 kb_formal_fts rebuild 路径已废，改调守卫
        subprocess.run(['/usr/bin/python3', str(Path(__file__).parent / 'kb-sync-guard.py'), '--sync', '600'], timeout=600)
    conn.close()
    print('\n'.join(report))
    print(f'═══ 合计：新增 {total_new} 卷，跳过 {total_skip} 卷{"（DRY）" if DRY else ""}')
    if not DRY:
        print(f'═══ 口径：{INGESTOR.stats()}')

if __name__ == '__main__':
    main()
