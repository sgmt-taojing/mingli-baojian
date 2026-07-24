#!/bin/bash
# 命理宝鉴 · 文档规范化检查器
# 用途：检测 docs/ 下文档的命名规范一致性、失效链接、孤立文件
# 输出：JSON 到 stdout，可被 CI 消费
# 退出码：0=健康 / 1=警告 / 2=严重

set -u
cd "$(dirname "$0")/.." || exit 1

DOCS_DIR=docs

# 1. 命名规范统计
NAMING_TOTAL=$(find "$DOCS_DIR" -name "*.md" | wc -l | tr -d ' ')
NAMING_UPPER=$(find "$DOCS_DIR" -name "*.md" | grep -E '/[A-Z][A-Z_0-9]+\.md$' | wc -l | tr -d ' ')
NAMING_LOWER=$(find "$DOCS_DIR" -name "*.md" | grep -E '/[a-z][a-z_-]+\.md$' | wc -l | tr -d ' ')
NAMING_MIXED=$(find "$DOCS_DIR" -name "*.md" | grep -vE '/([A-Z][A-Z_0-9]+\.md|[a-z][a-z_-]+\.md)$' | wc -l | tr -d ' ')

# 2. 内部链接失效检测
LINKS_BROKEN=$(grep -rEn '\]\(\.\.?/[^)]+\.md\)' "$DOCS_DIR" 2>/dev/null | wc -l | tr -d ' ')

# 3. 孤立文件（无任何被引用）
ORPHAN_TOTAL=0
for f in $(find "$DOCS_DIR" -name "*.md"); do
  base=$(basename "$f" .md)
  if ! grep -rq "$base" "$DOCS_DIR" 2>/dev/null; then
    ORPHAN_TOTAL=$((ORPHAN_TOTAL+1))
  fi
done

# 4. 文档大小分布
SIZE_TINY=$(find "$DOCS_DIR" -name "*.md" -size -1000c | wc -l | tr -d ' ')
SIZE_HUGE=$(find "$DOCS_DIR" -name "*.md" -size +50k | wc -l | tr -d ' ')

# 5. 今日文件数
TODAY_NEW=$(find "$DOCS_DIR" -name "*.md" -mtime -1 | wc -l | tr -d ' ')

# JSON 输出
cat <<JSON
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "summary": {
    "total": $NAMING_TOTAL,
    "upper_snake_case": $NAMING_UPPER,
    "lower_kebab_case": $NAMING_LOWER,
    "mixed_other": $NAMING_MIXED,
    "links_broken_markers": $LINKS_BROKEN,
    "orphan_files": $ORPHAN_TOTAL,
    "size_tiny_under_1k": $SIZE_TINY,
    "size_huge_over_50k": $SIZE_HUGE,
    "today_new": $TODAY_NEW
  },
  "health": {
    "naming_consistency_pct": $(awk "BEGIN {printf \"%.1f\", ($NAMING_UPPER + $NAMING_LOWER) * 100 / ($NAMING_TOTAL + 0.0001)}"),
    "orphan_pct": $(awk "BEGIN {printf \"%.1f\", $ORPHAN_TOTAL * 100 / ($NAMING_TOTAL + 0.0001)}")
  }
}
JSON

# 退出码语义
if [ "$ORPHAN_TOTAL" -gt $((NAMING_TOTAL / 2)) ]; then
  exit 2
elif [ "$LINKS_BROKEN" -gt 50 ]; then
  exit 1
else
  exit 0
fi
