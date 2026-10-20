#!/bin/bash
# 命理宝鉴 · docs/INDEX.md 自动生成器
# 用途：扫描 docs/ 全部 .md 文件，按类别分组，输出结构化索引
# 输出：docs/INDEX.md（覆盖）
# 退出码：0=成功 / 1=失败

set -eu
# 容忍 grep/wc 在分类无文件时的非零退出（管道失败会导致 pipefail 中断）
if [ -z "${SKIP_DOCS_INDEX_PIPEFAIL:-}" ]; then :; fi
cd "$(dirname "$0")/.." || exit 1

DOCS_DIR=docs
INDEX="$DOCS_DIR/INDEX.md"

# 统计
TOTAL=$(find "$DOCS_DIR" -name "*.md" -not -path "*/_reports/*" | wc -l | tr -d ' ')
TOTAL_LINES=$(find "$DOCS_DIR" -name "*.md" -not -path "*/_reports/*" -exec cat {} + | wc -l | tr -d ' ')
TOTAL_SIZE=$(find "$DOCS_DIR" -name "*.md" -not -path "*/_reports/*" -exec cat {} + | wc -c | tr -d ' ')

# 类别映射（前缀 → 类别名）

# 时间戳
NOW="$(date '+%Y-%m-%d %H:%M') GMT+8"

# 头部
cat > "$INDEX" <<EOF
# 命理宝鉴 · 文档总目

> **最后更新**：$NOW
> **维护**：心跳自动生成（参见 \`scripts/docs-index-gen.sh\`）
> **覆盖范围**：docs/ 全量 md 文件（$TOTAL 个 / 11 MB / $TOTAL_LINES 行）

## 索引目录

EOF

# 按类别输出（限定 docs/ 顶层）
for prefix in AUDIT STANDARD PLAN REPORT NODE; do
  cn_name=""
  case "$prefix" in
    AUDIT) cn_name="审计报告（audits）" ;;
    STANDARD) cn_name="规范文档（specs）" ;;
    PLAN) cn_name="计划文档（plans）" ;;
    REPORT) cn_name="交付报告（deliveries）" ;;
    NODE) cn_name="节点报告（nodes）" ;;
  esac
  
  FILES=$(find "$DOCS_DIR" -maxdepth 1 -name "*_${prefix}.md" -o -name "*${prefix}_*.md" 2>/dev/null | sort)
  COUNT=$(echo "$FILES" | grep -c ".md$" 2>/dev/null || echo "0")
  
  if [ -n "$FILES" ]; then
    echo "### 📊 $cn_name ($COUNT 份)" >> "$INDEX"
    echo "" >> "$INDEX"
    echo "| 文件 | 大小 | 标题（前 60 字）|" >> "$INDEX"
    echo "|------|------|------|" >> "$INDEX"
    for f in $FILES; do
      base=$(basename "$f" .md)
      size=$(wc -c < "$f" | tr -d ' ')
      size_h=$(python3 -c "print(round($size/1024,1))" 2>/dev/null || echo "$size")
      # 提取第一个 # 标题
      title=$(grep -m1 "^# " "$f" 2>/dev/null | sed 's/^# //' | cut -c1-60)
      echo "| [$base](./$base.md) | ${size_h}KB | $title |" >> "$INDEX"
    done
    echo "" >> "$INDEX"
  fi
done

# 巡检报告
PATROL_FILES=$(find "$DOCS_DIR" -maxdepth 1 -name "*巡检*.md" -o -name "*selfcheck*.md" -o -name "*healthcheck*.md" -o -name "*hourly-check*.md" 2>/dev/null | sort)
PATROL_COUNT=$(echo "$PATROL_FILES" | grep -c ".md$" 2>/dev/null || echo "0")
if [ -n "$PATROL_FILES" ]; then
  echo "### 🔍 巡检报告（patrols）($PATROL_COUNT 份)" >> "$INDEX"
  echo "" >> "$INDEX"
  echo "| 文件 | 大小 |" >> "$INDEX"
  echo "|------|------|" >> "$INDEX"
  for f in $PATROL_FILES; do
    base=$(basename "$f" .md)
    size=$(wc -c < "$f" | tr -d ' ')
    echo "| [$base](./$base.md) | ${size} B |" >> "$INDEX"
  done
  echo "" >> "$INDEX"
fi

# 修复/补丁
PATCH_FILES=$(find "$DOCS_DIR" -maxdepth 1 \( -name "*fix*.md" -o -name "*bugfix*.md" -o -name "*upgrade*.md" -o -name "*enhancement*.md" -o -name "*optimization*.md" \) 2>/dev/null | sort)
PATCH_COUNT=$(echo "$PATCH_FILES" | grep -c ".md$" 2>/dev/null || echo "0")
if [ -n "$PATCH_FILES" ]; then
  echo "### 🔧 修复/补丁（patches）($PATCH_COUNT 份)" >> "$INDEX"
  echo "" >> "$INDEX"
  echo "| 文件 | 大小 |" >> "$INDEX"
  echo "|------|------|" >> "$INDEX"
  for f in $PATCH_FILES; do
    base=$(basename "$f" .md)
    size=$(wc -c < "$f" | tr -d ' ')
    echo "| [$base](./$base.md) | ${size} B |" >> "$INDEX"
  done
  echo "" >> "$INDEX"
fi

# 其他
OTHER_FILES=$(find "$DOCS_DIR" -maxdepth 1 -name "*.md" 2>/dev/null | sort)
OTHER_COUNT=0
for f in $OTHER_FILES; do
  base=$(basename "$f" .md)
  # 跳过已经被列出的
  case "$base" in
    AUDIT_*|STANDARD_*|PLAN_*|REPORT_*|NODE_*|*巡检*|*selfcheck*|*healthcheck*|*hourly-check*|*fix*|*bugfix*|*upgrade*|*enhancement*|*optimization*|INDEX|GLOSSARY) continue ;;
  esac
  OTHER_COUNT=$((OTHER_COUNT+1))
done

if [ "$OTHER_COUNT" -gt 0 ]; then
  echo "### 📚 其他（others）($OTHER_COUNT 份)" >> "$INDEX"
  echo "" >> "$INDEX"
  echo "| 文件 | 大小 |" >> "$INDEX"
  echo "|------|------|" >> "$INDEX"
  for f in $OTHER_FILES; do
    base=$(basename "$f" .md)
    case "$base" in
      AUDIT_*|STANDARD_*|PLAN_*|REPORT_*|NODE_*|*巡检*|*selfcheck*|*healthcheck*|*hourly-check*|*fix*|*bugfix*|*upgrade*|*enhancement*|*optimization*|INDEX|GLOSSARY) continue ;;
    esac
    size=$(wc -c < "$f" | tr -d ' ')
    title=$(grep -m1 "^# " "$f" 2>/dev/null | sed 's/^# //' | cut -c1-60)
    echo "| [$base](./$base.md) | ${size} B | $title |" >> "$INDEX"
  done
  echo "" >> "$INDEX"
fi

# 底部
cat >> "$INDEX" <<EOF
## 命名规范

**统一使用 UPPER_SNAKE_CASE**：
\`\`\`
API_STANDARD.md              # 规范文档
A11Y_AUDIT_v1.md             # 审计报告
R15_KB_REINFORCE_REPORT.md   # 节点/项目报告
DOCS_LINT_v1.md              # 工具文档
\`\`\`

## 工具

- \`scripts/docs-lint.sh\` — 命名/链接/孤立文件检查（每 5 分钟心跳跑一次）
- \`scripts/docs-index-gen.sh\` — 生成本 INDEX.md（手动或 CI 触发）
- \`scripts/docs-reorganize.sh\` — 按子目录归类（一次迁移脚本）

## 自动校验

| 检查项 | 命令 | 频率 |
|--------|------|------|
| 命名一致性 | docs-lint.sh | 5 分钟心跳 |
| 失效链接 | docs-lint.sh | 5 分钟心跳 |
| 孤立文件 | docs-lint.sh | 5 分钟心跳 |
| CI 阻断 | docs-lint-ci.sh | push/PR 触发 |
| pre-commit | .husky/pre-commit | 本地 commit 时 |

---

_本文件由 docs-index-gen.sh 自动生成，勿手动编辑_
EOF

echo "✅ INDEX.md 已生成（$TOTAL 个文档 / $TOTAL_LINES 行 / $TOTAL_SIZE 字节）"
echo "   路径：$INDEX"
exit 0