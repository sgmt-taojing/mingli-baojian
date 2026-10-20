#!/usr/bin/env bash
# 导出 mingli-baojian 中混入的家庭生活助手内容到独立 JSON 备份
# 数据：203+203+16 = 422 条 (kb_formal + kb_staging + formal_knowledge)
# 日期：2026-08-16
# 用途：修真闭环-迁回前的安全备份 + 审计证据
set -euo pipefail

DB=server/database/yidao.db
OUT=.openclaw/tmp/mingli-outbound-20260816.json
TMPDIR=.openclaw/tmp
mkdir -p "${TMPDIR}"

echo "▶ 导出 mingli 污染数据 → ${OUT}"

# kb_formal 有 trust_score 字段
sqlite3 -batch "${DB}" "SELECT json_group_array(json_object(
  'entry_id', entry_id, 'module', module, 'category', category, 'title', title,
  'content', content, 'src_id', src_id, 'trust_score', trust_score,
  'hit_count', hit_count, 'keywords', keywords, 'tags', tags,
  'created_at', created_at, 'updated_at', updated_at
)) FROM kb_formal WHERE module IN ('family-life','smart-home-family','epb-assistant');" \
  > "${TMPDIR}/export-kb_formal.json"
echo "  ✅ kb_formal ($(wc -c < ${TMPDIR}/export-kb_formal.json | tr -d ' ') bytes)"

# kb_staging 无 trust_score，用 confidence
sqlite3 -batch "${DB}" "SELECT json_group_array(json_object(
  'entry_id', entry_id, 'module', module, 'category', category, 'title', title,
  'content', content, 'src_id', src_id, 'confidence', confidence,
  'status', status, 'created_at', created_at, 'updated_at', updated_at
)) FROM kb_staging WHERE module IN ('family-life','smart-home-family','epb-assistant');" \
  > "${TMPDIR}/export-kb_staging.json"
echo "  ✅ kb_staging ($(wc -c < ${TMPDIR}/export-kb_staging.json | tr -d ' ') bytes)"

# formal_knowledge 有 confidence 没有 trust_score
sqlite3 -batch "${DB}" "SELECT json_group_array(json_object(
  'entry_id', entry_id, 'module', module, 'category', category, 'content', content,
  'summary', summary, 'tags', tags, 'source_ids', source_ids,
  'confidence', confidence, 'access_level', access_level,
  'status', status, 'created_at', created_at, 'updated_at', updated_at,
  'hit_count', hit_count
)) FROM formal_knowledge WHERE module IN ('family-life','smart-home-family','epb-assistant');" \
  > "${TMPDIR}/export-formal_knowledge.json"
echo "  ✅ formal_knowledge ($(wc -c < ${TMPDIR}/export-formal_knowledge.json | tr -d ' ') bytes)"

# source_index 4 个污染源
sqlite3 -batch "${DB}" "SELECT json_group_array(json_object(
  'src_id', src_id, 'module', module, 'title', title, 'trust_score', trust_score,
  'created_at', created_at
)) FROM source_index WHERE src_id IN ('SRC-FAMILY-LIFE-20260810-074538','SRC-SMART-HOME-20260810-074538','SRC-EPB-20260810-074534','SRC-FLA-20260810-074036');" \
  > "${TMPDIR}/export-source_index.json"
echo "  ✅ source_index ($(wc -c < ${TMPDIR}/export-source_index.json | tr -d ' ') bytes)"

# Python 合并 + 校验
python3 - "${TMPDIR}" "${OUT}" <<'PY'
import json, sys, datetime, pathlib

tmpdir, out = sys.argv[1], sys.argv[2]

def load(name):
    p = pathlib.Path(tmpdir) / f"export-{name}.json"
    raw = p.read_text().strip()
    if not raw:
        return []
    return json.loads(raw)

kb_formal  = load('kb_formal')
kb_staging = load('kb_staging')
fk         = load('formal_knowledge')
sources    = load('source_index')

out_obj = {
    "exported_at": datetime.datetime.now().isoformat(timespec='seconds'),
    "db_path": "server/database/yidao.db",
    "total_count": len(kb_formal) + len(kb_staging) + len(fk),
    "sources": sources,
    "kb_formal": kb_formal,
    "kb_staging": kb_staging,
    "formal_knowledge": fk,
}

pathlib.Path(out).write_text(json.dumps(out_obj, ensure_ascii=False, indent=2))

print(f"✅ 合并完成: total_count={out_obj['total_count']}")
print(f"   kb_formal        = {len(kb_formal)}")
print(f"   kb_staging       = {len(kb_staging)}")
print(f"   formal_knowledge = {len(fk)}")
print(f"   sources          = {len(sources)}")
PY

# sha256
SH=$(shasum -a 256 "${OUT}" | awk '{print $1}')
SIZE=$(wc -c < "${OUT}" | tr -d ' ')
echo "${SH}  ${OUT} (${SIZE} bytes)" | tee "${TMPDIR}/mingli-outbound-20260816.sha256"
echo "✅ 备份完成"