#!/usr/bin/env python3
"""R-KB-CLASSICS · 命理古籍原典全网采集入库（维基文库源头，公有领域）

铁律：只收原典全文（一手源头），二手网文一律不收。
流程：search API 解析准确页名 → action=raw 拉 wikitext → 子页面（卷）爬取
     → 清洗模板/标签 → 按章节切段 → 去重写入 kb_formal（trust 0.95）

用法：python3 scripts/fetch-classics-wikisource.py [--dry]
"""
import json, re, sqlite3, hashlib, sys, time, urllib.parse, urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from lib.kb_ingest import KBIngestor, fingerprint_of  # R-INGEST-SPEC-20260927 新口径

DB = Path(__file__).parent.parent / 'server' / 'database' / 'yidao.db'
INGESTOR = None  # main() 中初始化
DRY = '--dry' in sys.argv
UA = {'User-Agent': 'mingli-baojian-classics-collector/1.0 (local knowledge base; contact: admin@localhost)'}
API = 'https://zh.wikisource.org/w/api.php'
RAW = 'https://zh.wikisource.org/w/index.php?action=raw&title='

# (搜索词, KB module, 书名标准写, 主题关键词)
BOOKS = [
    # ── 奇门遁甲 ──
    ('煙波釣叟歌', 'qimen', '烟波钓叟歌', '奇门遁甲,总纲,阴阳遁,超接气'),
    ('遁甲演義', 'qimen', '遁甲演义', '奇门遁甲,符使,格局'),
    ('奇門遁甲秘笈大全', 'qimen', '奇门遁甲秘笈大全', '奇门遁甲,烟波钓叟,占验'),
    # ── 六爻 ──
    ('黄金策', 'liuyao', '黄金策', '六爻,刘伯温,总断,用神'),
    ('卜筮正宗', 'liuyao', '卜筮正宗', '六爻,王洪绪,十八论,辟谬'),
    ('易隱', 'liuyao', '易隐', '六爻,曹九锡,身命占'),
    ('斷易天機', 'liuyao', '断易天机', '六爻,鬼谷,六神,卦身'),
    ('卜筮全書', 'liuyao', '卜筮全书', '六爻,易卜,启蒙节要'),
    # ── 八字 ──
    ('玉照定真經', 'bazi', '玉照定真经', '八字,纳音,四柱,郭璞'),
    ('珞琭子三命消息賦', 'bazi', '珞琭子三命消息赋', '八字,消息赋,阴阳,徐子平注'),
    ('李虛中命書', 'bazi', '李虚中命书', '八字,三命,纳音,鬼谷子'),
    ('五行精紀', 'bazi', '五行精纪', '八字,廖中,纳音,神煞'),
    ('淵海子平', 'bazi', '渊海子平', '八字,子平,格局,用神'),
    ('神峰通考', 'bazi', '神峰通考', '八字,张楠,病药,动静'),
    # ── 紫微 ──
    ('紫微斗數全書', 'ziwei', '紫微斗数全书', '紫微斗数,太微赋,形性赋,星曜'),
    ('太微賦', 'ziwei', '太微赋', '紫微斗数,赋文,格局'),
    # ── 风水 ──
    ('青囊序', 'fengshui', '青囊序', '风水,曾求己,玄空,二十四山'),
    ('青囊奧語', 'fengshui', '青囊奥语', '风水,杨筠松,玄空,挨星'),
    ('天玉經', 'fengshui', '天玉经', '风水,杨筠松,三般卦,玄空'),
    ('都天寶照經', 'fengshui', '都天宝照经', '风水,杨筠松,玄空,城门'),
    ('玄空秘旨', 'fengshui', '玄空秘旨', '风水,玄空,飞星,章仲山'),
    ('紫白訣', 'fengshui', '紫白诀', '风水,紫白,九星,调候'),
    ('飛星賦', 'fengshui', '飞星赋', '风水,九星,飞星,吉凶'),
    ('入地眼全書', 'fengshui', '入地眼全书', '风水,辜托长老,龙穴砂水'),
    ('陽宅十書', 'fengshui', '阳宅十书', '风水,阳宅,王君荣,宅法'),
    ('地理五訣', 'fengshui', '地理五诀', '风水,赵九峰,龙穴砂水向'),
    ('金鎖玉關', 'fengshui', '金锁玉关', '风水,过路阴阳,砂水'),
    # ── 择日 ──
    ('玉匣記', 'zeri', '玉匣记', '择日,许真君,吉凶日,民俗'),
    ('協紀辨方書', 'zeri', '协纪辨方书', '择日,钦定,神煞,用事宜忌'),
    ('象吉通書', 'zeri', '象吉通书', '择日,魏明远,嫁娶,修造'),
    # ── 六壬 ──
    ('大六壬指南', 'liuren', '大六壬指南', '六壬,陈公献,五变,毕法'),
    ('大六壬大全', 'liuren', '大六壬大全', '六壬,郭载騋,课经,毕法赋'),
    # ── 相术 ──
    ('麻衣相法', 'xiangshu', '麻衣相法', '相术,麻衣道者,面相,五官'),
    ('神相全編', 'xiangshu', '神相全编', '相术,袁忠彻,面相,体相'),
    ('太清神鑑', 'xiangshu', '太清神鉴', '相术,王朴,形神,气色的'),
    ('柳莊相法', 'xiangshu', '柳庄相法', '相术,袁珙,永乐百问'),
    # ── 星命 ──
    ('果老星宗', 'xingming', '果老星宗', '七政四余,星命,果老'),
    ('星學大成', 'xingming', '星学大成', '七政四余,万民英,星曜'),
    # ── 易占 ──
    ('焦氏易林', 'yizhan', '焦氏易林', '易林,焦延寿,繇辞,占验'),
    ('皇極經世', 'yizhan', '皇极经世', '邵雍,元会运世,先天易'),
]

# ═══ wikitext 清洗 ═══
def clean_wikitext(wt):
    wt = re.sub(r'<!--.*?-->', '', wt, flags=re.S)
    wt = re.sub(r'\{\{[Hh]eader.*?\}\}', '', wt, flags=re.S)
    wt = re.sub(r'\{\{[Ff]ooter.*?\}\}', '', wt, flags=re.S)
    wt = re.sub(r'<(onlyinclude|includeonly|noinclude)>', '', wt)
    wt = re.sub(r'</(onlyinclude|includeonly|noinclude)>', '', wt)
    wt = wt.replace('<poem>', '').replace('</poem>', '')
    # {{另|正字|异文}} → 取正字
    wt = re.sub(r'\{\{另\|([^|}]+)\|[^}]*\}\}', r'\1', wt)
    # 其余双参模板取首参；无名模板删除
    for _ in range(4):
        wt = re.sub(r'\{\{[^{}]*\|([^{}|]+)(?:\|[^{}]*)?\}\}', r'\1', wt)
        wt = re.sub(r'\{\{[^{}|]*\}\}', '', wt)
    # [[链接|文字]] → 文字；[[文字]] → 文字
    wt = re.sub(r'\[\[[^\]|]*\|([^\]]+)\]\]', r'\1', wt)
    wt = re.sub(r'\[\[([^\]]+)\]\]', r'\1', wt)
    wt = re.sub(r"'''?", '', wt)
    wt = re.sub(r'<ref[^>]*>.*?</ref>', '', wt, flags=re.S)
    wt = re.sub(r'<[^>]+>', '', wt)
    wt = re.sub(r'\n{3,}', '\n\n', wt)
    return wt.strip()

def fetch(url, retry=3):
    import subprocess
    last = ''
    for i in range(retry):
        r = subprocess.run(['curl', '-s', '-m', '30', '-A', UA['User-Agent'], url],
                           capture_output=True, timeout=45)
        last = r.stdout.decode('utf-8', 'replace')
        head = last[:500]
        if last.strip() and 'Wikimedia Error' not in head and not last.lstrip().startswith(('<!DOCTYPE', '<html')):
            return last
        time.sleep(1.5 * (i + 1))
    return last

def fetch_json(url):
    txt = fetch(url)
    if not txt.strip():
        raise RuntimeError('empty response')
    return json.loads(txt)

def search_title(term):
    q = urllib.parse.quote(term)
    d = fetch_json(f'{API}?action=query&list=search&format=json&srlimit=8&srsearch={q}')
    hits = [h['title'] for h in d.get('query', {}).get('search', [])
            if not h['title'].startswith(('作者:', '維基文庫:', 'Wikisource:'))]
    if not hits:
        return None
    # 优先与搜索词同名（繁简一致时直接命中）
    for t in hits:
        if t == term:
            return t
    # 次优：页名包含搜索词（允许带校本/版本后缀）
    for t in hits:
        if term in t:
            return t
    # 拒绝完全不相干的误配（如「易隱」配到「閙隱集」）
    return None

def filter_existing(titles):
    """API 批量校验页面存在性，过滤红链（缺失页 action=raw 会触发 Wikimedia Error 重试风暴）"""
    existing = []
    for i in range(0, len(titles), 40):
        chunk = titles[i:i + 40]
        q = urllib.parse.quote('|'.join(chunk))
        try:
            d = fetch_json(f'{API}?action=query&format=json&titles={q}')
            pages = d.get('query', {}).get('pages', {})
            ok_titles = {p['title'] for p in pages.values() if 'missing' not in p}
            # 保留原顺序；标题可能被规范化（繁简/空格），用集合匹配原串
            norm = {p.get('title'): t for p, t in zip(pages.values(), chunk)}
            for t in chunk:
                if t in ok_titles:
                    existing.append(t)
        except Exception:
            existing.extend(chunk)  # 校验失败时放行，由抓取层兜底
    return existing

def fetch_raw(title, retry=1):
    for i in range(retry + 1):
        try:
            txt = fetch(RAW + urllib.parse.quote(title))
            if txt.strip():
                return txt
            # action=raw 空响应（部分四库本页面会挂死），回退 parse API 取 wikitext
            q = urllib.parse.quote(title)
            d = fetch_json(f'{API}?action=parse&format=json&prop=wikitext&page={q}')
            wt = d.get('parse', {}).get('wikitext', {}).get('*', '')
            if wt.strip():
                return wt
        except Exception:
            if i >= retry:
                raise
            time.sleep(2)
    return ''

def subpage_links(title, wt):
    """从索引页 wikitext 提取子页面链接（卷/章），含 /卷01 相对写法"""
    links = []
    for m in re.finditer(r'\[\[([^\]|]+)(?:\|[^\]]*)?\]\]', wt):
        link = m.group(1)
        if link.startswith(('作者:', 'File:', 'Image:', 'Category:', '維基文庫:')):
            continue
        if link.startswith('/'):
            full = title + link
        elif link.startswith(title + '/'):
            full = link
        elif '/' not in link and re.search(r'[卷篇章節赋賦經诀訣歌][一二三四五六七八九十百〇零\d]*$', link):
            full = f'{title}/{link}'
        else:
            continue
        if full not in links:
            links.append(full)
    return links

def split_sections(text):
    """按 ==节名== 切段；无节名则整体一段"""
    parts = re.split(r'^(==+)\s*(.+?)\s*\1\s*$', text, flags=re.M)
    if len(parts) <= 1:
        return [(None, text)]
    out = []
    pre = parts[0].strip()
    i = 1
    while i < len(parts) - 2:
        out.append((parts[i + 1].strip(), parts[i + 2].strip()))
        i += 3
    if pre and len(pre) > 100:
        out.insert(0, ('卷首', pre))
    return out

def ingest(c, conn, book, module, kw, sec, body):
    """单段入库：过滤+查重+插入+立即提交。返回 (ins, skip)"""
    body = (body or '').strip()
    if len(body) < 60:
        return 0, 0
    # 铁律：今人前言/出版说明等二手文字不入库
    if sec in ('前言', '出版说明', '出版前言', '整理说明', '序（现代）'):
        return 0, 0
    # 内容守卫：开头 300 字内出现 2 个以上今人文字特征（公元/本书/出版/ISBN/整理/简介），判为书评前言拒收
    head = body[:300]
    modern_hits = sum(1 for w in ('公元', '本书', '出版', 'ISBN', '整理', '简介', '作者介绍') if w in head)
    if modern_hits >= 2:
        return 0, 0
    sec_name = sec or '全录'
    kt = f'原典·{book}·{sec_name}'
    content = f'【{book}·{sec_name}】（公有领域原典·维基文库）\n\n{body}\n\n关键词：{book} {sec_name} {kw.replace(",", " ")}'
    # entry_id 含全 category 路径防截断撞键；指纹幂等替代旧 title 查重
    eid = f"WS|{module}|{book}|{sec_name}|{fingerprint_of(content)[:8]}"
    if not DRY:
        ok, why = INGESTOR.insert(
            entry_id=eid, module=module, title=kt, content=content,
            category=module, keywords=f'{book},{sec_name},{kw}',
            tags=[book, sec_name, '原典', 'wikisource'],
            domain='mingli', trust=0.95, source='wikisource')
        if not ok:
            return (0, 1) if why == 'duplicate' else (_ for _ in ()).throw(RuntimeError(why))
    return 1, 0

def main():
    global INGESTOR
    # 分批：--from=N --to=M（避免单次运行超时）
    lo = hi = 0, 0
    for a in sys.argv:
        if a.startswith('--from='): lo = int(a[7:])
        if a.startswith('--to='): hi = int(a[5:])
    books = BOOKS[lo:hi or None]
    print(f'批次 {lo}-{hi or len(BOOKS)}：{len(books)} 部')
    conn = sqlite3.connect(str(DB))
    c = conn.cursor()
    INGESTOR = KBIngestor(conn)
    total_new, total_skip = 0, 0
    report = []
    for term, module, book, kw in books:
        try:
            title = search_title(term)
            if not title:
                report.append(f'{book}: ✗ 未找到')
                continue
            wt = fetch_raw(title)
            time.sleep(0.4)
            sections = []
            subs = subpage_links(title, wt)
            if subs:
                subs = filter_existing(subs[:80])
                # 有子页面（卷/章）一律爬子页面；逐卷即时入库提交，超时只丢未抓部分
                ins = skip = 0
                todo = []
                for sp in subs:
                    sec_guess = sp.split('/')[-1]
                    # 已入库的卷直接跳过，避免重跑时重复抓取
                    if c.execute('SELECT COUNT(*) FROM kb_formal WHERE title=?', (f'原典·{book}·{sec_guess}',)).fetchone()[0]:
                        skip += 1
                        continue
                    todo.append((sp, sec_guess))
                # 4 线程并发抓取，完成一卷立即入库（超时只丢在飞的几卷）
                from concurrent.futures import ThreadPoolExecutor, as_completed
                def _grab(sp):
                    try:
                        return clean_wikitext(fetch_raw(sp))
                    except Exception:
                        return ''
                sec_of = dict(todo)
                with ThreadPoolExecutor(max_workers=4) as ex:
                    futs = {ex.submit(_grab, sp): sp for sp, _ in todo}
                    for fut in as_completed(futs):
                        sp = futs[fut]
                        swt = fut.result()
                        if len(swt) <= 80:
                            continue
                        r_ins, r_skip = ingest(c, conn, book, module, kw, sec_of[sp], swt)
                        ins += r_ins; skip += r_skip
                total_new += ins; total_skip += skip
                report.append(f'{book} [{title}]: +{ins} 段（跳过 {skip}）')
                continue
            else:
                sections = split_sections(clean_wikitext(wt))
            ins = skip = 0
            for sec, body in sections:
                r_ins, r_skip = ingest(c, conn, book, module, kw, sec, body)
                ins += r_ins; skip += r_skip
            total_new += ins
            total_skip += skip
            report.append(f'{book} [{title}]: +{ins} 段（跳过 {skip}）')
        except Exception as e:
            report.append(f'{book}: ✗ {e}')
    if not DRY:
        INGESTOR.commit()
        try:
            c.execute("INSERT INTO kb_formal_fts(kb_formal_fts) VALUES('rebuild')")
            conn.commit()
        except Exception as e:
            print('FTS rebuild 失败:', e)
    conn.close()
    print('\n'.join(report))
    print(f'═══ 合计：新增 {total_new} 段，跳过 {total_skip} 段{"（DRY）" if DRY else ""}')
    if not DRY:
        print(f'═══ 口径：{INGESTOR.stats()}')

if __name__ == '__main__':
    main()
