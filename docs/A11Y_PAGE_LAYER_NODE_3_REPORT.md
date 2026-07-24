# #9-a11y-page-layer 节点 3 验收报告

> **commit**: `a1bb77a` · **日期**: 2026-07-25 07:28 · **覆盖率**: 100% (57/57)

## 1. 执行摘要

节点 3 对缺 `<main id="main-content">` 锚点的 49 个 HTML 页面批量包裹 `<main>` 标签，让节点 2 注入的 skip-link `href="#main-content"` 真正可达。

### 关键数据
| 维度 | 数值 |
|------|------|
| 总 HTML 文件 | 57 |
| 已有 `<main>` (节点 1) | 7 |
| 新增包裹 (节点 3) | 49 |
| 跳过 (HTML 片段) | 1 |
| **覆盖率** | **100.0% (57/57)** |
| `<main>` 开闭平衡 | 58/58 (0 BAD) |
| JS 语法回归 | 0 错误 (scan-all.js 验证) |
| Jest 测试回归 | 504/504 全绿 |

## 2. 改造明细

### 新增脚本
- `scripts/a11y-wrap-main.js`（5,255B / 175 行 / 零依赖纯 Node）
- 支持 `--dry-run` + `--verbose` 双模式
- 幂等：已有 `<main>` 自动跳过
- 退出码 0=成功 1=有失败

### 注入逻辑
1. 找到 `<body>` 标签
2. 如 body 后紧接 skip-link，则在 skip-link 后插入 `<main id="main-content" role="main">`
3. 否则直接 body 后插入
4. 在 `</body>` 前插入 `</main>`

### 包裹的 49 页（全量）
admin-glass-dashboard / admin-kb-batch / admin-kb-panel / admin-shop / admin / ai-assistant / clear-cache / components-demo / disclaimer / divination-almanac / divination-knowledge / divination-shop / divination-tools / doctor-elder / export-guard / fengshui / glass-console / glass-history / health-career-dashboard / im / index / kb-explore-submit / koujue-gallery / lifeindex-detail / lifeplan-detail / login / master-archive / master-disease / master-elder / master-zidise-illness / merchant-apply / merit-system / monitor-dashboard / more-functions / nihaisha-knowledge / nihaisha-learning / nihaisha-tool / report-config / report-sample-bazi / shuhan-knowledge / tcm-clinic / tcm-symptom / test-parse-natural / wechat-disclaimer / wechat-h5 / yijing-oracle / yijing-qimen / youthplan-detail / yuanzhu-inbox

## 3. WCAG 意义

- **ARIA Landmark**: `<main role="main">` 是 WCAG 2.4.1 Bypass Blocks 的核心实现
- **Skip-link 锚点生效**: 之前 49 页 skip-link href="#main-content" 但无锚点 → 锚点失效（键盘用户 Tab 1 次跳到空位）
- **读屏器支持**: JAWS/NVDA/VoiceOver 可用 `M` 快捷键跳到 main landmark

## 4. 验证结果

### 4.1 main 标签开闭平衡（58 HTML 含 knowledge-panel）
```
OK: 58 BAD: 0
```

### 4.2 JS 语法层 scan-all.js
```
总计: 0 个语法错误（56 HTML / 280 script blocks）
```

### 4.3 Jest 测试回归
```
Test Suites: 24 passed, 24 total
Tests:       504 passed, 504 total
```

### 4.4 GitHub Pages 外网验证
| URL | 状态 |
|-----|------|
| divination-hub.html | 200 ✅ |
| tcm-clinic.html | 200 ✅ |
| tcm-symptom.html | 200 ✅ |
| fengshui.html | 200 ✅ |
| ai-assistant.html | 200 ✅ |

## 5. 后续建议

### 5.1 Lighthouse CI 集成（P2）
- `npx lighthouse` 跑 a11y 分数基线
- CI workflow 阈值 ≥80

### 5.2 div→button 化（P3）
- 474 处 `<div onclick>` 假按钮仍需逐页改造（高风险，需逐页 PoC）

### 5.3 颜色对比度实测
- `<a>` / `<button>` / `<input>` 三类元素色对比 WCAG AA ≥4.5:1
