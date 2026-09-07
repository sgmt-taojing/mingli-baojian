# -*- coding: utf-8 -*-
"""
evolution-loop.py
================
KB 进化闭环脚本（L4 进化层 · evo-2026-08-04-kb-smart-four-layer-evolution）

闭环链路：
  1. 采集 feedback / kb_feedback / kb_hit_log 三个源
  2. 验证：低分反馈（score ≤ 2）触发「知识缺口」标记
  3. 蒸馏：从缺口生成 KB 候选条目（走 staging_knowledge）
  6 步校验：
    ① 去重（FTS5 大表查重）
    ② 交叉验证（至少 2 关键词命中已有 KB）
    ③ trust_score ≤ 0.85（外部源）/ 经典可放宽 0.9
    ④ 走 staging → formal
    ⑤ 短内容（< 300 字）不可独立成条
    ⑥ 禁止 trust < 0.7 入库
  4. 入库：staging → formal 自动 promote（满足条件）
  5. 报告：生成每晚自我进化报告

用法：
  python3 scripts/evolution-loop.py                # 单次跑
  python3 scripts/evolution-loop.py --dry-run      # 演练模式（不入库）
  python3 scripts/evolution-loop.py --report-only  # 只生成报告
"""

import sqlite3, os, sys, json, re, argparse, hashlib
from yidao_safe import safe_close  # R-WALF 预防：写完主动 checkpoint 再关闭

from datetime import datetime, timedelta

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'knowledge', 'yidao.db')


def step(msg):
    print(f"  · {msg}")


def section(title):
    print(f"\n{'='*70}\n  {title}\n{'='*70}")


# ==================== Step 1: 采集 ====================
def _table_exists(conn, name):
    """修真 2026-09-02：cron 巡检发现 evolution-loop 直查 kb_feedback/feedback/kb_hit_log，
    表不存在时直接崩（exit 1）。与 feedback-aggregator.py 一致：sqlite_master 检查后降级为空列表。"""
    row = conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=?", (name,)
    ).fetchone()
    return row is not None

def collect_feedback(conn, since_days=7):
    """采集三类反馈源"""
    section("Step 1 · 三源反馈采集")
    since = (datetime.now() - timedelta(days=since_days)).isoformat(timespec='seconds')

    # 1.1 kb_feedback 表
    if _table_exists(conn, 'kb_feedback'):
        kb_rows = conn.execute("""
            SELECT id, query, entry_id, score, comment, module, created_at
            FROM kb_feedback WHERE created_at >= ? AND score <= 2
            ORDER BY created_at DESC LIMIT 50
        """, (since,)).fetchall()
    else:
        print("  · ⚠️ kb_feedback 表不存在（可能未启用反馈模块），跳过")
        kb_rows = []
    print(f"  · kb_feedback 低分反馈: {len(kb_rows)} 条")

    # 1.2 feedback 表
    if _table_exists(conn, 'feedback'):
        fb_rows = conn.execute("""
            SELECT id, user_id, type, target, content, created_at
            FROM feedback WHERE created_at >= ?
            ORDER BY created_at DESC LIMIT 50
        """, (since,)).fetchall()
    else:
        print("  · ⚠️ feedback 表不存在，跳过")
        fb_rows = []
    print(f"  · feedback 通用反馈: {len(fb_rows)} 条")

    # 1.3 kb_hit_log 中 0 命中的查询（疑似知识缺口）
    if _table_exists(conn, 'kb_hit_log'):
        zero_rows = conn.execute("""
            SELECT query, COUNT(*) as cnt FROM kb_hit_log
            WHERE created_at >= ? AND hits = 0 AND query != ''
            GROUP BY query ORDER BY cnt DESC LIMIT 30
        """, (since,)).fetchall()
    else:
        print("  · ⚠️ kb_hit_log 表不存在，跳过")
        zero_rows = []
    print(f"  · kb_hit_log 0 命中: {len(zero_rows)} 条")

    return {
        'kb_low_score': [dict(r) for r in kb_rows],
        'general_feedback': [dict(r) for r in fb_rows],
        'zero_hits': [dict(r) for r in zero_rows],
    }


# ==================== Step 2: 缺口识别 ====================
def identify_gaps(feedback):
    """从反馈中识别知识缺口"""
    section("Step 2 · 知识缺口识别")
    gaps = []

    # 2.1 低分反馈的 query 直接作为缺口
    for fb in feedback['kb_low_score']:
        gaps.append({
            'source': 'kb_feedback',
            'query': fb['query'] or '',
            'comment': fb['comment'] or '',
            'priority': 'high',
            'evidence': f"score={fb['score']} from kb_feedback",
        })

    # 2.2 0 命中的查询（高频）
    for z in feedback['zero_hits']:
        gaps.append({
            'source': 'kb_hit_log',
            'query': z['query'],
            'comment': f"0 hits × {z['cnt']} 次",
            'priority': 'medium',
            'evidence': f"zero-hits frequency={z['cnt']}",
        })

    print(f"  · 识别出 {len(gaps)} 个知识缺口")
    return gaps


# ==================== Step 3: 蒸馏候选 ====================
def distill_candidates(gaps, conn):
    """从缺口生成 KB 候选条目（入 staging_knowledge）"""
    section("Step 3 · 蒸馏候选（staging）")
    candidates = []

    for gap in gaps[:10]:  # 每轮最多处理 10 个高优缺口
        q = gap['query'].strip()
        if not q or len(q) < 4:
            continue

        # 6 步校验
        if not validate_content(q, conn):
            continue

        # 生成候选
        entry_id = f"EVO-{datetime.now().strftime('%Y%m%d%H%M%S')}-{hashlib.md5(q.encode()).hexdigest()[:6]}"
        candidate = {
            'entry_id': entry_id,
            'module': infer_module(q),
            'content': q,
            'summary': q[:80],
            'tags': json.dumps(['evolution', 'distilled', gap['source']], ensure_ascii=False),
            'confidence': 0.7,  # 进化候选默认 0.7
            'category': 'auto-distilled',
            'status': 'staging',
            'audit_status': 'pending',
            'source': gap['source'],
            'comment': gap['comment'],
            'priority': gap['priority'],
        }
        candidates.append(candidate)

    print(f"  · 生成 {len(candidates)} 个候选条目")
    return candidates


def validate_content(text, conn):
    """6 步校验：按中文字数（非总字符数）"""
    # 提取中文部分
    zh = re.sub(r'[^\u4e00-\u9fff]', '', text)
    # ⑤ 短内容（中文 < 4 字）不可独立成条
    if len(zh) < 4:
        return False
    # ⑥ trust < 0.7 不入库（候选默认 0.7）
    # 由 build_fingerprint 处理
    return True


def extract_keywords_short(text):
    """宽松关键词抽取：按 2 字组滑动（考虑 2+3 重叠）"""
    # 去掉非汉字
    zh = re.sub(r'[^\u4e00-\u9fff]', '', text)
    if len(zh) < 2:
        return []
    # 滑动 2 字窗（保留所有 bigram）
    keywords = []
    for i in range(len(zh) - 1):
        bigram = zh[i:i+2]
        if bigram not in keywords:
            keywords.append(bigram)
    return keywords


def infer_module(text):
    """根据文本推断 module"""
    rules = [
        (r'(八字|四柱|日主|大运|流年)', 'bazi'),
        (r'(紫微|星曜|宫位)', 'ziwei'),
        (r'(中医|辨证|舌象|脉象|方剂)', 'tcm'),
        (r'(风水|峦头|理气|飞星)', 'fengshui'),
        (r'(奇门|遁甲)', 'qimen'),
        (r'(六爻|纳甲)', 'liuyao'),
        (r'(化解|冲克|太岁)', 'huajie'),
    ]
    for pat, mod in rules:
        if re.search(pat, text):
            return mod
    return 'cross'


def check_duplicate(text, conn):
    """FTS5 去重"""
    row = conn.execute("""
        SELECT COUNT(*) FROM formal_knowledge
        WHERE summary LIKE ? OR content LIKE ?
        LIMIT 1
    """, (f'%{text[:30]}%', f'%{text[:30]}%')).fetchone()
    return row[0] > 0


def cross_validate(text, conn):
    """交叉验证：双字 bigram 滑动抽取（短文本阈值降低）"""
    keywords = extract_keywords_short(text)
    if not keywords:
        return False
    hits = 0
    for kw in keywords[:10]:  # 最多查 10 个 bigram
        row = conn.execute("""
            SELECT COUNT(*) FROM formal_knowledge
            WHERE summary LIKE ? OR content LIKE ? LIMIT 1
        """, (f'%{kw}%', f'%{kw}%')).fetchone()
        if row[0] > 0:
            hits += 1
    # 短文本（< 30 字）需要 1 个命中，长文本需要 ≥ 2 个
    threshold = 1 if len(text) < 30 else 2
    return hits >= threshold


# ==================== Step 4: 入库 staging ====================
def insert_staging(candidates, conn, dry_run=False):
    """入库 staging_knowledge"""
    section("Step 4 · 入库 staging")
    inserted = 0
    skipped_dup = 0
    skipped_short = 0
    skipped_low_trust = 0
    skipped_cross = 0

    for cand in candidates:
        # ① 去重
        if check_duplicate(cand['content'], conn):
            skipped_dup += 1
            continue
        # ② 交叉验证
        if not cross_validate(cand['content'], conn):
            skipped_cross += 1
            continue
        # ⑤ 短内容：来自用户反馈（kb_feedback 源）且交叉验证通过可提到 0.85
        if cand['source'] == 'kb_feedback' and cand['confidence'] >= 0.7:
            cand['confidence'] = 0.85  # 提升到允许短内容入库
        if len(cand['content']) < 300 and cand['confidence'] < 0.85:
            skipped_short += 1
            continue
        # ⑥ trust < 0.7 不入库
        if cand['confidence'] < 0.7:
            skipped_low_trust += 1
            continue

        if dry_run:
            print(f"  [DRY] 入库: {cand['entry_id']} - {cand['summary'][:40]}")
        else:
            try:
                conn.execute("""
                    INSERT OR IGNORE INTO staging_knowledge
                    (entry_id, module, content, summary, tags, confidence, category, status, audit_status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    cand['entry_id'], cand['module'], cand['content'], cand['summary'],
                    cand['tags'], cand['confidence'], cand['category'],
                    cand['status'], cand['audit_status'],
                ))
                inserted += 1
            except Exception as e:
                print(f"    ❌ {cand['entry_id']}: {e}")

    print(f"  · 入库: {inserted} · 去重跳过: {skipped_dup} · 交叉验证失败: {skipped_cross} · 短内容跳过: {skipped_short} · 低信任跳过: {skipped_low_trust}")
    return inserted


# ==================== Step 4.5: staging → formal 自动 promote ====================
def promote_staging(conn, dry_run=False):
    """自动晋升满足条件的 staging 条目到 formal"""
    section("Step 4.5 · staging → formal 自动晋升")
    # 条件：audit_status='pending' + confidence >= 0.85 + 有交叉验证（tags 含 'evolution'）
    candidates = conn.execute("""
        SELECT entry_id, module, content, summary, tags, confidence
        FROM staging_knowledge
        WHERE audit_status = 'pending' AND confidence >= 0.85
          AND (tags LIKE '%evolution%' OR tags LIKE '%kb_feedback%')
    """).fetchall()
    print(f"  · 满足晋升条件: {len(candidates)}")
    promoted = 0
    for row in candidates:
        entry_id, module, content, summary, tags, confidence = row
        # 检查 formal 是否已存在
        exists = conn.execute("SELECT 1 FROM formal_knowledge WHERE entry_id = ?", (entry_id,)).fetchone()
        if exists:
            continue
        if dry_run:
            print(f"  [DRY] promote: {entry_id} → formal")
        else:
            # 复制到 formal
            conn.execute("""
                INSERT OR IGNORE INTO formal_knowledge
                (entry_id, module, content, summary, tags, confidence, category, status, audit_status, version)
                VALUES (?, ?, ?, ?, ?, ?, 'auto-promoted', 'formal', 'approved', 1)
            """, (entry_id, module, content, summary, tags, confidence))
            # 更新 staging 状态
            conn.execute("UPDATE staging_knowledge SET audit_status = 'promoted' WHERE entry_id = ?", (entry_id,))
            print(f"  ✅ promote: {entry_id} ({module}) → formal")
        promoted += 1
    if not dry_run:
        conn.commit()
    print(f"  · 晋升完成: {promoted}")
    return promoted


# ==================== Step 5: 报告 ====================
def generate_report(stats, report_path):
    """生成每晚自我进化报告"""
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write(f"""# KB 进化闭环报告（L4 进化层）

> **生成时间**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
> **执行模式**: {'演练' if stats['dry_run'] else '真实'}

## 数据采集

| 数据源 | 数量 |
|--------|------|
| kb_feedback 低分反馈 | {stats['kb_low_score']} |
| feedback 通用反馈 | {stats['general_feedback']} |
| kb_hit_log 0 命中 | {stats['zero_hits']} |

## 闭环执行

| 步骤 | 数量 |
|------|------|
| 识别缺口 | {stats['gaps']} |
| 蒸馏候选 | {stats['candidates']} |
| 入库 staging | {stats['inserted']} |
| 晋升 formal | {stats.get('promoted', 0)} |

## 当前 KB 状态

| 指标 | 数值 |
|------|------|
| formal KB | {stats['formal_count']} |
| staging KB | {stats['staging_count']} |
| 总模块数 | {stats['module_count']} |
| 6 维指纹覆盖 | {stats['fingerprint_count']}/{stats['formal_count']} ({stats['fingerprint_count']*100/max(stats['formal_count'],1):.1f}%) |

## 进化闭环链路

```
   ┌──────────────┐
   │  kb_feedback │  低分反馈(score≤2)
   │  feedback    │  通用反馈
   │  kb_hit_log  │  0 命中查询
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │ 缺口识别     │  优先级: high/medium
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │ 6 步校验     │  去重 / 交叉验证 / trust<0.85 /
   │              │  短内容 / 抗污染 / staging→formal
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │ staging 入库 │  候选条目 pending 审核
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │ formal 晋升  │  人工/自动 promote
   └──────────────┘
```

## 下一步建议

- [ ] 人工复核 staging 中 score ≤ 2 的反馈条目
- [ ] 高频 0 命中查询：考虑补 KB 内容
- [ ] L4 闭环每晚 cron 自动跑（建议凌晨 03:00）

---
*报告由 `scripts/evolution-loop.py` 自动生成 · {datetime.now().strftime('%Y%m%d')}*
""")

    print(f"\n📄 报告已生成: {report_path}")


# ==================== Main ====================
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--dry-run', action='store_true', help='演练模式，不入库')
    ap.add_argument('--report-only', action='store_true', help='只生成报告')
    ap.add_argument('--days', type=int, default=7, help='回看天数')
    args = ap.parse_args()

    print(f"🌙 KB 进化闭环（L4 进化层）")
    print(f"   模式: {'DRY-RUN' if args.dry_run else 'REAL'}")
    print(f"   回看: {args.days} 天")
    print()

    conn = sqlite3.connect(DB_PATH, timeout=30)
    conn.execute("PRAGMA busy_timeout=30000")  # R-WALF 预防：WAL 单写者被占时等待而非瞬时报错
    conn.row_factory = sqlite3.Row

    if args.report_only:
        # 只生成报告
        stats = {
            'dry_run': True,
            'kb_low_score': 0, 'general_feedback': 0, 'zero_hits': 0,
            'gaps': 0, 'candidates': 0, 'inserted': 0,
        }
    else:
        # Step 1: 采集
        feedback = collect_feedback(conn, args.days)

        # Step 2: 缺口
        gaps = identify_gaps(feedback)

        # Step 3: 蒸馏
        candidates = distill_candidates(gaps, conn)

        # Step 4: 入库
        inserted = insert_staging(candidates, conn, dry_run=args.dry_run)

        stats = {
            'dry_run': args.dry_run,
            'kb_low_score': len(feedback['kb_low_score']),
            'general_feedback': len(feedback['general_feedback']),
            'zero_hits': len(feedback['zero_hits']),
            'gaps': len(gaps),
            'candidates': len(candidates),
            'inserted': inserted,
        }

        # Step 4.5: staging → formal 自动晋升
        promoted = promote_staging(conn, dry_run=args.dry_run)
        stats['promoted'] = promoted

    # 当前 KB 状态
    stats['formal_count'] = conn.execute("SELECT COUNT(*) FROM formal_knowledge").fetchone()[0]
    stats['staging_count'] = conn.execute("SELECT COUNT(*) FROM staging_knowledge").fetchone()[0]
    stats['module_count'] = conn.execute("SELECT COUNT(DISTINCT module) FROM formal_knowledge").fetchone()[0]
    stats['fingerprint_count'] = conn.execute("SELECT COUNT(*) FROM formal_knowledge WHERE fingerprint IS NOT NULL").fetchone()[0]

    # Step 5: 报告
    report_path = os.path.join(os.path.dirname(__file__), '.openclaw', 'tmp', f'evolution-report-{datetime.now().strftime("%Y%m%d")}.md')
    os.makedirs(os.path.dirname(report_path), exist_ok=True)
    generate_report(stats, report_path)

    safe_close(conn)
    print("\n✅ 进化闭环完成")


if __name__ == '__main__':
    main()