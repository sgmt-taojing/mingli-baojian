#!/usr/bin/env python3
"""全项目蒸馏脚本 — 从所有子项目提取知识入库到命理宝鉴主 KB"""
import sqlite3, json, datetime, hashlib, os, sys

DST_DB = '/Users/tom/kimi/projects/mingli-baojian/server/database/yidao.db'
PROJECTS_DIR = '/Users/tom/kimi/projects'

INSERT_COLS = 'entry_id,module,title,content,src_id,category,keywords,summary,raw_metadata,status,tags,confidence,source_ids,fingerprint,created_at,updated_at'
INSERT_SQL = f'INSERT INTO kb_staging ({INSERT_COLS}) VALUES ({",".join(["?"]*16)})'

def g(row, k, dflt=''):
    """Safe getter for sqlite3.Row"""
    try:
        v = row[k]
        return v if v is not None else dflt
    except (IndexError, KeyError):
        return dflt

def fp(text):
    return hashlib.sha256(text.encode()).hexdigest()[:16]

def reg_source(dst, src_id, title, path, module, trust=0.85, tags='distill'):
    now = datetime.datetime.now().isoformat()
    dst.execute(
        'INSERT INTO source_index (src_id,src_type,title,author,url,trust_score,tags,access_level,created_at,path,format,size_bytes,module) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
        (src_id, 'SRC-DISTILL', title, 'distill-agent', path, trust, tags, 'internal', now, path, 'mixed', 0, module)
    )
    dst.commit()
    return now

def ins(dst, module, title, content, src_id, category, keywords, summary, raw_meta, tags_str, confidence, now):
    # R118 修真：模块白名单拦截，防止跨项目 module 被写入 mingli 主 KB
    _assert_module_allowed(module)
    f = fp(content)
    if dst.execute('SELECT entry_id FROM kb_staging WHERE fingerprint=?', (f,)).fetchone():
        return False
    # R108-P2-3 修真：INSERT 必须带 entry_id（KB-STAGE-{f} 确定性生成，冲突追加后缀重试）
    for attempt in range(5):
        eid = f'KB-STAGE-{f}' if attempt == 0 else f'KB-STAGE-{f}-{attempt + 1}'
        try:
            dst.execute(INSERT_SQL, (eid, module, title, content, src_id, category, keywords,
                                     (summary or '')[:200], json.dumps(raw_meta, ensure_ascii=False),
                                     'staged', tags_str, confidence, src_id, f, now, now))
            return True
        except Exception as e:
            if attempt >= 4 or ('UNIQUE' not in str(e) and 'PRIMARY' not in str(e)):
                print(f'  ins fail: {e}')
                return False
    return False

def distill_dt_mall(dst):
    """digital-workshop dt-mall: products + articles + clients + reviews + CRM KB + FAQs"""
    db_path = os.path.join(PROJECTS_DIR, 'digital-workshop/dt-mall/backend/data/dt-mall.db')
    if not os.path.exists(db_path):
        print('  dt-mall.db not found, skip')
        return
    src = sqlite3.connect(db_path)
    src.row_factory = sqlite3.Row
    src_id = 'SRC-DW-MALL-' + datetime.datetime.now().strftime('%Y%m%d-%H%M%S')
    now = reg_source(dst, src_id, 'digital-workshop dt-mall 全量蒸馏', db_path, 'digital-workshop', 0.85, 'digital-workshop,crm,mall')
    total = 0

    # products
    for row in src.execute('SELECT * FROM products ORDER BY id').fetchall():
        title = f"[电商产品] {g(row,'title')}"
        highlights = json.loads(g(row,'highlights','[]')) if g(row,'highlights','[]') else []
        tags = json.loads(g(row,'tags','[]')) if g(row,'tags','[]') else []
        content = f"# {title}\n\n## 副标题\n{g(row,'subtitle','')}\n\n## 分类\n{g(row,'category','')}\n\n## 价格\n¥{g(row,'price','')} {g(row,'price_unit','')}\n\n## 亮点\n{'· '.join(highlights)}\n\n## 标签\n{', '.join(tags)}\n\n## 描述\n{g(row,'description','')[:500]}\n\n---\n*来源: dt-mall 商城 · trust=0.85*"
        if ins(dst, 'digital-workshop', title, content, src_id, 'dw-product', f"产品,电商,{g(row,'title','')}", g(row,'description',''), {'prod_id': row['id'], 'name': g(row,'title','')}, '电商产品', 0.85, now):
            total += 1

    # articles
    for row in src.execute('SELECT * FROM articles ORDER BY id').fetchall():
        title = f"[电商文章] {g(row,'title')}"
        body = g(row,'content','')
        content = f"# {title}\n\n## 作者\n{g(row,'author','')}\n\n## 摘要\n{g(row,'summary','') or body[:300]}\n\n## 正文\n{body[:2000]}\n\n---\n*来源: dt-mall 内容 · trust=0.85*"
        if ins(dst, 'digital-workshop', title, content, src_id, 'dw-article', '文章,电商,内容', g(row,'summary','') or body[:200], {'art_id': row['id']}, '电商文章', 0.85, now):
            total += 1

    # clients
    for row in src.execute('SELECT * FROM clients ORDER BY id LIMIT 80').fetchall():
        name = g(row,'name') or g(row,'short_name') or f"客户#{row['id']}"
        title = f"[CRM客户] {name}"
        content = f"# {title}\n\n## 简称\n{g(row,'short_name','')}\n\n## 行业\n{g(row,'industry','')}\n\n## 描述\n{g(row,'description','')[:500]}\n\n## 规模\n{g(row,'team_size','')}\n\n## 成立\n{g(row,'founded','')}\n\n## 电话\n{g(row,'contact_phone','')}\n\n## 邮箱\n{g(row,'contact_email','')}\n\n## 地址\n{g(row,'address','')}\n\n## 网站\n{g(row,'website','')}\n\n## 联系人\n{g(row,'contact_person','')}\n\n## 业务范围\n{g(row,'business_scope','')}\n\n---\n*来源: dt-mall CRM · trust=0.85*"
        if ins(dst, 'digital-workshop', title, content, src_id, 'dw-crm-client', f"客户,CRM,{g(row,'industry','')}", g(row,'description',''), {'client_id': row['id'], 'name': name, 'industry': g(row,'industry','')}, 'CRM客户', 0.85, now):
            total += 1

    # reviews
    for row in src.execute('SELECT * FROM reviews ORDER BY id LIMIT 50').fetchall():
        title = f"[电商评价] 商品#{g(row,'product_id','')} 评分{g(row,'rating','')}"
        content = f"# {title}\n\n## 评分\n{g(row,'rating','')}⭐\n\n## 评价\n{g(row,'content','')}\n\n---\n*来源: dt-mall 评价 · trust=0.8*"
        if ins(dst, 'digital-workshop', title, content, src_id, 'dw-review', '评价,电商', g(row,'content',''), {'rev_id': row['id'], 'product_id': g(row,'product_id','')}, '电商评价', 0.8, now):
            total += 1

    # FAQs
    try:
        for row in src.execute('SELECT * FROM faqs ORDER BY id LIMIT 50').fetchall():
            title = f"[FAQ] {g(row,'question','')[:60]}"
            content = f"# {title}\n\n## 问题\n{g(row,'question','')}\n\n## 回答\n{g(row,'answer','')[:2000]}\n\n---\n*来源: dt-mall FAQ · trust=0.85*"
            if ins(dst, 'digital-workshop', title, content, src_id, 'dw-faq', 'FAQ,问答', g(row,'question',''), {'faq_id': row['id']}, 'FAQ', 0.85, now):
                total += 1
    except: pass

    # CRM knowledge base
    try:
        for row in src.execute('SELECT * FROM crm_knowledge_base ORDER BY id LIMIT 50').fetchall():
            title = f"[CRM知识] {g(row,'title','') or '知识#'+str(row['id'])}"
            body = g(row,'content','') or g(row,'body','')
            content = f"# {title}\n\n{body[:3000]}\n\n---\n*来源: dt-mall CRM 知识库 · trust=0.85*"
            if ins(dst, 'digital-workshop', title, content, src_id, 'dw-crm-kb', '知识,CRM', body[:200], {'kb_id': row['id']}, 'CRM知识', 0.85, now):
                total += 1
    except: pass

    # case studies
    try:
        for row in src.execute('SELECT * FROM case_studies ORDER BY id LIMIT 30').fetchall():
            title = f"[案例研究] {g(row,'title','')[:60]}"
            content = f"# {title}\n\n## 客户\n{g(row,'client_name','') or g(row,'client','')}\n\n## 行业\n{g(row,'industry','')}\n\n## 挑战\n{g(row,'challenge','')[:500]}\n\n## 方案\n{g(row,'solution','')[:1000]}\n\n## 成果\n{g(row,'result','')[:500]}\n\n---\n*来源: dt-mall 案例 · trust=0.85*"
            if ins(dst, 'digital-workshop', title, content, src_id, 'dw-case', '案例,研究', g(row,'title',''), {'case_id': row['id']}, '案例研究', 0.85, now):
                total += 1
    except: pass

    src.close()
    dst.commit()
    print(f'✓ digital-workshop dt-mall: {total} 条')

def distill_markdown_dir(dst, dir_path, module, src_prefix, trust=0.85, tags='distill'):
    """蒸馏一个目录下的所有 markdown 文件"""
    full_path = os.path.join(PROJECTS_DIR, dir_path)
    if not os.path.exists(full_path):
        print(f'  {dir_path} not found, skip')
        return
    src_id = f'{src_prefix}-{datetime.datetime.now().strftime("%Y%m%d-%H%M%S")}'
    now = reg_source(dst, src_id, f'{dir_path} 文档蒸馏', dir_path, module, trust, tags)
    total = 0
    for root, dirs, files in os.walk(full_path):
        # 跳过隐藏目录 + 垃圾目录（R660 修真：node_modules/venv 等禁止入库）
        dirs[:] = [d for d in dirs if not d.startswith('.') and d not in (
            'node_modules', 'venv', '.venv', '__pycache__', 'dist', 'build',
            'coverage', '.next', '.nuxt', 'target', 'Pods', '.git',
        )]
        for f in files:
            if not f.endswith('.md'): continue
            fp_path = os.path.join(root, f)
            # 文件级垃圾过滤（lockfile/包配置/编译产物）
            if f in ('package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'package.json', 'tsconfig.json') or f.endswith(('.d.ts', '.map')):
                continue
            try:
                with open(fp_path, 'r') as fh:
                    txt = fh.read()
                if len(txt) < 100: continue
                title = f'[{module}] {f}'
                if ins(dst, module, title, txt[:5000], src_id, 'document',
                       f'{module},文档', txt[:200], {'file': f, 'size': len(txt)},
                       f'{module},文档', trust, now):
                    total += 1
            except: pass
    dst.commit()
    print(f'✓ {dir_path}: {total} 条')

def distill_epb(dst):
    """epb-assistant: 移动源监管法规蒸馏"""
    epb_dir = os.path.join(PROJECTS_DIR, 'epb-assistant')
    if not os.path.exists(epb_dir):
        print('  epb-assistant not found, skip')
        return
    src_id = 'SRC-EPB-' + datetime.datetime.now().strftime('%Y%m%d-%H%M%S')
    now = reg_source(dst, src_id, '移动源监管知识蒸馏', 'epb-assistant', 'epb-assistant', 0.85, 'epb,环保,监管')
    total = 0
    JUNK_DIRS = {'node_modules', 'venv', '.venv', '__pycache__', 'dist', 'build', 'coverage', '.git', 'target', 'Pods'}
    # Walk all files
    for root, dirs, files in os.walk(epb_dir):
        dirs[:] = [d for d in dirs if not d.startswith('.') and d not in JUNK_DIRS]
        for f in files:
            fp_path = os.path.join(root, f)
            rel_path = os.path.relpath(fp_path, epb_dir)
            # 文件级垃圾过滤
            if f in ('package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'package.json', 'tsconfig.json') or f.endswith(('.d.ts', '.map')):
                continue
            try:
                if f.endswith('.md'):
                    with open(fp_path, 'r') as fh: txt = fh.read()
                    if len(txt) < 100: continue
                    title = f'[环保监管] {f}'
                    if ins(dst, 'epb-assistant', title, txt[:5000], src_id, 'epb-doc', '环保,监管,法规', txt[:200], {'file': rel_path}, '环保监管', 0.85, now):
                        total += 1
                elif f.endswith('.py') or f.endswith('.js'):
                    with open(fp_path, 'r') as fh: txt = fh.read()
                    if len(txt) < 200: continue
                    # Extract API routes and key functions
                    title = f'[环保监管-代码] {rel_path}'
                    if ins(dst, 'epb-assistant', title, txt[:3000], src_id, 'epb-code', '环保,代码', rel_path, {'file': rel_path, 'lang': f.split('.')[-1]}, '环保监管代码', 0.8, now):
                        total += 1
            except: pass
    dst.commit()
    print(f'✓ epb-assistant: {total} 条')

def distill_wechat(dst):
    """wechat-platform: 微信平台代码+文档蒸馏"""
    wx_dir = os.path.join(PROJECTS_DIR, 'wechat-platform')
    if not os.path.exists(wx_dir):
        print('  wechat-platform not found, skip')
        return
    src_id = 'SRC-WECHAT-' + datetime.datetime.now().strftime('%Y%m%d-%H%M%S')
    now = reg_source(dst, src_id, '微信平台知识蒸馏', 'wechat-platform', 'wechat-platform', 0.8, 'wechat,微信')
    total = 0
    JUNK_DIRS = {'node_modules', 'venv', '.venv', '__pycache__', 'dist', 'build', 'coverage', '.git', 'target', 'Pods'}
    for root, dirs, files in os.walk(wx_dir):
        dirs[:] = [d for d in dirs if not d.startswith('.') and d not in JUNK_DIRS]
        for f in files:
            fp_path = os.path.join(root, f)
            rel_path = os.path.relpath(fp_path, wx_dir)
            if f in ('package-lock.json', 'package.json', 'tsconfig.json') or f.endswith(('.d.ts', '.map')):
                continue
            try:
                if f.endswith(('.md', '.py', '.js', '.html')):
                    with open(fp_path, 'r') as fh: txt = fh.read()
                    if len(txt) < 200: continue
                    title = f'[微信平台] {rel_path}'
                    if ins(dst, 'wechat-platform', title, txt[:4000], src_id, 'wx-doc', '微信,平台', rel_path, {'file': rel_path}, '微信平台', 0.8, now):
                        total += 1
            except: pass
    dst.commit()
    print(f'✓ wechat-platform: {total} 条')

def distill_smart_home(dst):
    """smart-home-family: 4模块后端引擎蒸馏"""
    sh_dir = os.path.join(PROJECTS_DIR, 'smart-home-family')
    if not os.path.exists(sh_dir):
        print('  smart-home-family not found, skip')
        return
    src_id = 'SRC-SMART-HOME-' + datetime.datetime.now().strftime('%Y%m%d-%H%M%S')
    now = reg_source(dst, src_id, '智慧家庭 4模块引擎蒸馏', 'smart-home-family', 'smart-home-family', 0.85, 'smart-home,family')
    total = 0
    JUNK_DIRS = {'node_modules', 'venv', '.venv', '__pycache__', 'dist', 'build', 'coverage', '.git', 'target', 'Pods', 'data'}
    # server engines
    for root, dirs, files in os.walk(os.path.join(sh_dir, 'server')):
        dirs[:] = [d for d in dirs if not d.startswith('.') and d not in JUNK_DIRS]
        for f in files:
            if not f.endswith(('.js', '.py')): continue
            fp_path = os.path.join(root, f)
            rel_path = os.path.relpath(fp_path, sh_dir)
            if f in ('package-lock.json', 'package.json', 'tsconfig.json') or f.endswith(('.d.ts', '.map')):
                continue
            try:
                with open(fp_path, 'r') as fh: txt = fh.read()
                if len(txt) < 200: continue
                title = f'[智慧家庭] {rel_path}'
                if ins(dst, 'smart-home-family', title, txt[:4000], src_id, 'sh-engine', '智慧家庭,引擎', rel_path, {'file': rel_path}, '智慧家庭', 0.85, now):
                    total += 1
            except: pass
    # skill_service python modules
    skill_path = os.path.join(sh_dir, 'skill_service')
    if os.path.exists(skill_path):
        for root, dirs, files in os.walk(skill_path):
            for f in files:
                if not f.endswith('.py'): continue
                fp_path = os.path.join(root, f)
                rel_path = os.path.relpath(fp_path, sh_dir)
                try:
                    with open(fp_path, 'r') as fh: txt = fh.read()
                    if len(txt) < 200: continue
                    title = f'[智慧家庭-Python] {rel_path}'
                    if ins(dst, 'smart-home-family', title, txt[:4000], src_id, 'sh-python', '智慧家庭,Python', rel_path, {'file': rel_path}, '智慧家庭', 0.85, now):
                        total += 1
                except: pass
    dst.commit()
    print(f'✓ smart-home-family: {total} 条')

# 跨项目模块白名单（R118 修真 · 2026-08-16）：
# mingli 主 KB 仅接收 mingli 自有体系（nihaisha/tcm/digital-workshop）。
# 其它项目（smart-home-family / epb-assistant / family-life / wechat-platform / digital-ecosystem）
# 的蒸馏必须各自进入自己的项目 KB，不得跨项目写入 mingli 主 KB。
# 历史背景：原脚本会把 6 个跨项目源码蒸馏进 mingli，导致 422 条污染条目。
# mingli 主 KB 仅接收 mingli 自有体系。digital-workshop / smart-home-family / epb-assistant /
# family-life / wechat-platform / digital-ecosystem 都是独立项目，各自蒸馏到自己的项目 KB。
ALLOWED_MODULES = {'nihaisha', 'tcm', 'tcm-agent', 'general'}

def _assert_module_allowed(module):
    if module not in ALLOWED_MODULES:
        raise PermissionError(
            f'R118 KB 隔离拦截：模块 "{module}" 不在 mingli 主 KB 白名单 {sorted(ALLOWED_MODULES)} 中。'
            '请将跨项目蒸馏写入对应项目的自有 KB（每个项目独立 KB，互不混用）。'
        )


def main():
    dst = sqlite3.connect(DST_DB)
    print('=== 全项目蒸馏开始 (R118 KB 隔离已启用) ===\n')

    # 1. digital-workshop dt-mall — 修真：独立项目，蒸馏到 projects/digital-workshop/dt-mall/backend/data/dt-mall.db
    print('[1/7] digital-workshop dt-mall...')
    print('  ⏭ 跳过：digital-workshop 是独立项目，应蒸馏到自己的项目 KB')

    # 2. epb-assistant — 修真：跨项目，禁止写入 mingli 主 KB
    print('[2/7] epb-assistant...')
    print('  ⏭ 跳过：epb-assistant 是独立项目，应蒸馏到 projects/epb-assistant/db/epb.db')

    # 3. nihaisha docs — 白名单内（mingli 倪师中医资料）
    print('[3/7] nihaisha-nishi-tcm...')
    distill_markdown_dir(dst, 'nihaisha-nishi-tcm', 'nihaisha', 'SRC-NIHAISHA', 0.9, 'tcm,nihaisha,中医')

    # 4. digital-ecosystem — 修真：跨项目，禁止写入 mingli 主 KB
    print('[4/7] digital-ecosystem-platform...')
    print('  ⏭ 跳过：digital-ecosystem-platform 是独立项目')

    # 5. wechat-platform — 修真：跨项目，禁止写入 mingli 主 KB
    print('[5/7] wechat-platform...')
    print('  ⏭ 跳过：wechat-platform 是独立项目')

    # 6. smart-home-family — 修真：跨项目，禁止写入 mingli 主 KB
    print('[6/7] smart-home-family...')
    print('  ⏭ 跳过：smart-home-family 是独立项目，应蒸馏到 projects/smart-home-family/knowledge/yidao.db')

    # 7. family-life-assistant — 修真：跨项目，禁止写入 mingli 主 KB
    print('[7/7] family-life-assistant...')
    print('  ⏭ 跳过：family-life-assistant 是独立项目')

    # Summary
    total_stg = dst.execute('SELECT COUNT(*) FROM kb_staging').fetchone()[0]
    total_src = dst.execute('SELECT COUNT(*) FROM source_index').fetchone()[0]
    dst.close()
    print(f'\n=== 蒸馏完成 ===')
    print(f'kb_staging 总数: {total_stg}')
    print(f'source_index 总数: {total_src}')

if __name__ == '__main__':
    main()
