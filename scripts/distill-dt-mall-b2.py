#!/usr/bin/env python3
"""dt-mall 第二批蒸馏：policies 政策库 + orders 状态机知识（匿名化）+ service_demands"""
import sqlite3, json, datetime, hashlib, os, sys

DST_DB = '/Users/tom/kimi/projects/mingli-baojian/server/database/yidao.db'
SRC_DB = '/Users/tom/kimi/projects/digital-workshop/dt-mall/backend/data/dt-mall.db'

INSERT_COLS = 'entry_id,module,title,content,src_id,category,keywords,summary,raw_metadata,status,tags,confidence,source_ids,fingerprint,created_at,updated_at'
INSERT_SQL = f'INSERT INTO kb_staging ({INSERT_COLS}) VALUES ({",".join(["?"]*16)})'

def g(row, k, dflt=''):
    try:
        v = row[k]
        return v if v is not None else dflt
    except (IndexError, KeyError):
        return dflt

def ins(dst, module, title, content, src_id, category, keywords, summary, raw_meta, tags_str, confidence, now):
    fp = hashlib.sha256(content.encode()).hexdigest()[:16]
    if dst.execute('SELECT entry_id FROM kb_staging WHERE fingerprint=?', (fp,)).fetchone():
        return False
    # R108-P2-3 修真：INSERT 必须带 entry_id（KB-STAGE-{fp} 确定性生成，冲突追加后缀重试）
    for attempt in range(5):
        eid = f'KB-STAGE-{fp}' if attempt == 0 else f'KB-STAGE-{fp}-{attempt + 1}'
        try:
            dst.execute(INSERT_SQL, (eid, module, title, content, src_id, category, keywords,
                                     (summary or '')[:200], json.dumps(raw_meta, ensure_ascii=False),
                                     'staged', tags_str, confidence, src_id, fp, now, now))
            return True
        except Exception as e:
            if attempt >= 4 or ('UNIQUE' not in str(e) and 'PRIMARY' not in str(e)):
                print(f'  ins fail: {e}')
                return False
    return False

def main():
    dst = sqlite3.connect(DST_DB)
    src = sqlite3.connect(SRC_DB)
    src.row_factory = sqlite3.Row
    now = datetime.datetime.now().isoformat()
    src_id = 'SRC-DW-MALL-B2-' + datetime.datetime.now().strftime('%Y%m%d-%H%M%S')

    dst.execute(
        'INSERT INTO source_index (src_id,src_type,title,author,url,trust_score,tags,access_level,created_at,path,format,size_bytes,module) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
        (src_id, 'SRC-DISTILL', 'dt-mall 第二批（政策/订单状态/服务需求）', 'dw', 'dt-mall', 0.85, 'digital-workshop,policy,crm', 'internal', now, SRC_DB, 'sqlite', 0, 'digital-workshop'))
    dst.commit()
    total = 0

    # 1. policies 政策库（高质量政策知识）
    for row in src.execute('SELECT * FROM policies ORDER BY id').fetchall():
        title = f"[产业政策] {g(row,'title')}"
        content = f"""# {title}

## 级别
{g(row,'level_label')}（{g(row,'level')}）

## 分类
{g(row,'category_label')}（{g(row,'category')}）

## 发布机构
{g(row,'issuing_authority')}

## 文号
{g(row,'document_no')}

## 发布日期
{g(row,'publish_date')} ｜ 生效日期：{g(row,'effective_date')} ｜ 失效日期：{g(row,'expiry_date')}

## 摘要
{g(row,'summary')}

## 正文
{g(row,'content')[:3000]}

## 关键要点
{g(row,'key_points')}

## 适用行业
{g(row,'applicable_industries')}

## 支持措施
{g(row,'support_measures')}

## 标签
{g(row,'tags')}

---
*来源: dt-mall 政策库 · trust=0.85*"""
        if ins(dst, 'digital-workshop', title, content, src_id, 'dw-policy',
               f"政策,{g(row,'category_label')},{g(row,'title')}", g(row,'summary',''),
               {'policy_id': row['id'], 'doc_no': g(row,'document_no','')}, '产业政策', 0.85, now):
            total += 1

    # 2. orders 状态机知识（匿名化：不含姓名/电话）
    status_dist = {}
    for row in src.execute('SELECT status, COUNT(*) c FROM orders GROUP BY status').fetchall():
        status_dist[g(row,'status')] = g(row,'c')
    if status_dist:
        title = '[电商订单] 订单状态机与逆向流程'
        status_desc = {
            'pending': '待支付', 'paid': '已支付', 'shipped': '已发货',
            'completed': '已完成', 'cancelled': '已取消', 'refunded': '已退款',
            'refunding': '退款中',
        }
        lines = []
        for s, c in sorted(status_dist.items(), key=lambda x: -int(x[1])):
            lines.append(f"- **{s}**（{status_desc.get(s, '其他')}）：{c} 单")
        refund_count = sum(int(v) for k, v in status_dist.items() if 'refund' in str(k))
        content = f"""# {title}

## 状态分布（{sum(int(v) for v in status_dist.values())} 单样本）
{chr(10).join(lines)}

## 正向流程
下单(pending) → 支付(paid) → 发货(shipped) → 完成(completed)

## 逆向流程
- 取消：pending/paid 状态可取消（cancelled），记录 cancel_reason
- 退款：completed 后可申请退款（refunding → refunded），记录 refund_reason + refund_requested_at
- 退款单占比：{refund_count} 单

## 业务要点
- 订单号格式：DT + 时间戳 + 随机后缀（如 DT1781924617337M0JD）
- 支持优惠：coupon_code/coupon_info/discount_amount 三字段记录营销成本
- 配送跟踪：tracking_number + tracking_company + shipped_at

---
*来源: dt-mall 订单表聚合（已匿名化） · trust=0.8*"""
        if ins(dst, 'digital-workshop', title, content, src_id, 'dw-order-flow',
               '订单,状态机,电商,逆向流程', '订单状态分布与正逆向流程', {'status_dist': status_dist}, '订单流程', 0.8, now):
            total += 1

    # 3. service_demands 服务需求
    for row in src.execute('SELECT * FROM service_demands ORDER BY id').fetchall():
        title = f"[服务需求] {g(row,'title') or ('需求#'+str(row['id']))}"
        content = f"""# {title}

## 描述
{g(row,'description','')[:1000]}

## 预算
{g(row,'budget','')}

## 状态
{g(row,'status','')}

## 截止时间
{g(row,'deadline','')}

---
*来源: dt-mall 服务需求 · trust=0.8*"""
        if ins(dst, 'digital-workshop', title, content, src_id, 'dw-service-demand',
               '服务需求,需求', '', {'demand_id': row['id']}, '服务需求', 0.8, now):
            total += 1

    src.close()
    dst.commit()
    print(f'✓ dt-mall 第二批: {total} 条 (src: {src_id})')
    dst.close()

if __name__ == '__main__':
    main()
