#!/bin/bash
# 命理宝鉴 · docs-lint CI gate
# 用法：在 CI 中执行，严格模式（非零退出阻塞构建）
# 入口：scripts/docs-lint.sh
# 输出：JSON 报告到 docs/_reports/docs-lint-{timestamp}.json

set -u
cd "$(dirname "$0")/.." || exit 1

mkdir -p docs/_reports
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
REPORT="docs/_reports/docs-lint-${TIMESTAMP}.json"

bash scripts/docs-lint.sh > "$REPORT"
EXIT=$?

# 输出摘要
echo "📄 docs-lint report: $REPORT"
echo "📊 exit code: $EXIT"

if [ $EXIT -ne 0 ]; then
  echo "❌ docs-lint gate FAILED"
  cat "$REPORT"
  exit $EXIT
fi

echo "✅ docs-lint gate PASSED"
exit 0
