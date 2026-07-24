# P0-任务2 验收报告：补齐 4 个 API 调用

**日期**：2026-07-25  
**任务**：P0-任务2 — 暴露后台 API 给 H5（≥12 个）  
**目标文件**：`app/my-yuanzhu.html`  
**指标**：12/12 后台能力在 H5 端可见 ✅

---

## 一、补齐的 4 个 API

| # | API 端点 | 后端位置 | H5 展示位置 | 渲染策略 |
|---|---------|---------|------------|---------|
| 9 | `GET /api/public/stats` | `server/api-server-v2.js:2099` | "积分"Tab 底部 "📊 平台总览" | 8 项核心指标 stat-grid |
| 10 | `GET /api/public/recent-cases` | `server/api-server-v2.js:2651` | "助手"Tab 底部 "📜 近期案例" | 脱敏症状+大师+日期 |
| 11 | `GET /api/courses` | `server/api-server-v2.js:1624` | "知识"Tab 底部 "🎓 推荐课程" | 大师+标题+分类+时长 |
| 12 | `GET /api/voices` | `server/api-server-v2.js:2766` | "推送"Tab 底部 "🎤 语音选择" | 11 个 Edge-TTS 音色卡片 |

---

## 二、12/12 完整 API 清单

| # | API | H5 调用点 | 用途 |
|---|-----|----------|------|
| 1 | `/api/yuanzhu/profile` | `renderProfile()` | 个人中心 |
| 2 | `/api/yuanzhu/list` | `renderYuanzhu()` | 我的助手列表 |
| 3 | `/api/yuanzhu/yearly-pushes` | `renderPush()` | 我的年度推送 |
| 4 | `/api/public/latest-pushes` | `renderPush()` 兜底 | 公开最新推送 |
| 5 | `/api/feedback/points` | `renderPoints()` | 我的积分 |
| 6 | `/api/clinic/my-reports` | `renderReports()` | 病历报告 |
| 7 | `/api/shop/products` | `renderShop()` | 商品列表 |
| 8 | `/api/kb/list` | `renderKb()` | 知识库 |
| 9 | `/api/public/stats` ✅ NEW | `renderPoints()` 底部 | 平台总览 |
| 10 | `/api/public/recent-cases` ✅ NEW | `renderYuanzhu()` 底部 | 近期案例 |
| 11 | `/api/courses` ✅ NEW | `renderKb()` 底部 | 课程列表 |
| 12 | `/api/voices` ✅ NEW | `renderPush()` 底部 | 语音选择 |

---

## 三、UI 设计要点

1. **暗墨主题一致**：复用现有 `.card` / `.row` / `.stat-grid` / `.empty` 样式，零新 CSS
2. **图标语义化**：📊 总览 / 📜 案例 / 🎓 课程 / 🎤 语音 — 与现有 emoji 体系一致
3. **静默兜底**：4 个新 API 全部 try/catch 包裹，失败时不阻塞 Tab 已有内容
4. **辅助而非替代**：新内容放在 Tab 已有内容**之后**，不破坏原有 Tab 切换逻辑
5. **响应式**：`.stat-grid` 已是 2 列响应式布局，移动端无需调整

---

## 四、代码改动摘要

```diff
- 4 处空白 Tab 渲染（仅有原内容）
+ 4 处底部追加卡片（保留原内容 + 新辅助模块）
+ 4 个 try/catch 块（每个新 API 独立兜底）
+ 0 个新 CSS/JS 依赖
+ 0 个后端修改
```

---

## 五、验收清单

- [x] `node .openclaw/tmp/scan-all-html.js` 全量扫描 → 0 错误
- [x] `node --check` 提取脚本 → JS OK
- [x] 4 个新 API 均有 try/catch
- [x] 12/12 后台 API 全部 H5 可见
- [x] 现有 Tab 切换逻辑不变
- [x] 暗墨主题 ml-* 组件风格一致
- [x] 无新 CSS/JS 依赖
- [x] 无后端代码修改

---

## 六、提交记录

- **Commit**：`feat(h5): P0-任务2 补齐 4 个 API 调用 → 12/12 后台能力 H5 可见`
- **影响范围**：仅 `app/my-yuanzhu.html`（+1 文件验收报告）
- **风险评估**：低（H5 单文件，前端兜底充分）