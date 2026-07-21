# API v1 迁移对照表

> 生成日期：2026-07-21
> 总端点数：62
> 迁移策略：双路径共存 6 个月，旧路径响应头加 `Deprecation: true`

| 旧路径 | 新路径 | 改造说明 |
|--------|--------|----------|
| `/api/admin/assign-role` | `/api/v1/admins/assign-role` | 复数化 + v1 前缀 |
| `/api/admin/config` | `/api/v1/admins/configs` | 复数化 + v1 前缀 |
| `/api/admin/cron/yearly-push` | `/api/v1/admins/cron/yearly-push` | 复数化 + v1 前缀 |
| `/api/admin/remove-role` | `/api/v1/admins/remove-role` | 复数化 + v1 前缀 |
| `/api/admin/stats` | `/api/v1/admins/stats` | 复数化 + v1 前缀 |
| `/api/admin/yuanzhu/:user` | `/api/v1/admins/yuanzhus/:user` | 复数化 + v1 前缀 |
| `/api/admin/yuanzhu/push-stats` | `/api/v1/admins/yuanzhus/push-stats` | 复数化 + v1 前缀 |
| `/api/admin/yuanzhu/push-yearly` | `/api/v1/admins/yuanzhus/push-yearly` | 动作子路径保留 |
| `/api/ai/chat` | `/api/v1/ai/chats` | 复数化 + v1 前缀 |
| `/api/ai/guide` | `/api/v1/ai/guides` | 复数化 + v1 前缀 |
| `/api/ai/public-chat` | `/api/v1/ai/public-chat` | 复数化 + v1 前缀 |
| `/api/clinic/assigned-cases` | `/api/v1/clinic/assigned-cases` | 复数化 + v1 前缀 |
| `/api/clinic/case/:id` | `/api/v1/clinic/cases/:id` | 复数化 + v1 前缀 |
| `/api/clinic/discuss` | `/api/v1/clinic/discuss` | 复数化 + v1 前缀 |
| `/api/clinic/discussions/:case` | `/api/v1/clinic/discussions/:case` | 复数化 + v1 前缀 |
| `/api/clinic/my-reports` | `/api/v1/clinic/my-reports` | 复数化 + v1 前缀 |
| `/api/clinic/push-report` | `/api/v1/clinic/push-report` | 复数化 + v1 前缀 |
| `/api/clinic/score-case` | `/api/v1/clinic/score-case` | 复数化 + v1 前缀 |
| `/api/clinic/submit-analysis` | `/api/v1/clinic/submit-analysis` | 复数化 + v1 前缀 |
| `/api/clinic/submit-diagnosis` | `/api/v1/clinic/submit-diagnosis` | 复数化 + v1 前缀 |
| `/api/clinic/submit-symptom` | `/api/v1/clinic/submit-symptom` | 复数化 + v1 前缀 |
| `/api/clinic/update-effectiveness` | `/api/v1/clinic/update-effectiveness` | 复数化 + v1 前缀 |
| `/api/courses` | `/api/v1/courses` | 复数化 + v1 前缀 |
| `/api/courses/add` | `/api/v1/courses/add` | 改用 POST /resource |
| `/api/daily` | `/api/v1/daily` | 复数化 + v1 前缀 |
| `/api/distill` | `/api/v1/distill` | 复数化 + v1 前缀 |
| `/api/export` | `/api/v1/exports` | 复数化 + v1 前缀 |
| `/api/face/analyze` | `/api/v1/face/analyze` | 复数化 + v1 前缀 |
| `/api/face/health` | `/api/v1/face/health` | 复数化 + v1 前缀 |
| `/api/feedback/points` | `/api/v1/feedback/points` | 复数化 + v1 前缀 |
| `/api/feedback/submit` | `/api/v1/feedback/submit` | 复数化 + v1 前缀 |
| `/api/kb` | `/api/v1/knowledge-bases` | 复数化 + v1 前缀 |
| `/api/kb/:filename` | `/api/v1/knowledge-bases/:filename` | 复数化 + v1 前缀 |
| `/api/kb/list` | `/api/v1/knowledge-bases` | 合并到资源根路径 |
| `/api/merchant/apply` | `/api/v1/merchants/apply` | 复数化 + v1 前缀 |
| `/api/merchant/approve` | `/api/v1/merchants/approve` | 复数化 + v1 前缀 |
| `/api/merchant/list` | `/api/v1/merchants` | 合并到资源根路径 |
| `/api/ocr/recognize` | `/api/v1/ocr/recognize` | 复数化 + v1 前缀 |
| `/api/ocr/tcm` | `/api/v1/ocr/tcm` | 复数化 + v1 前缀 |
| `/api/order/create` | `/api/v1/orders/create` | 复数化 + v1 前缀 |
| `/api/paipan/history` | `/api/v1/paipans/history` | 复数化 + v1 前缀 |
| `/api/paipan/save` | `/api/v1/paipans/save` | 复数化 + v1 前缀 |
| `/api/public/latest-pushes` | `/api/v1/public/latest-pushes` | 复数化 + v1 前缀 |
| `/api/public/recent-cases` | `/api/v1/public/recent-cases` | 复数化 + v1 前缀 |
| `/api/public/stats` | `/api/v1/public/stats` | 复数化 + v1 前缀 |
| `/api/push/log` | `/api/v1/pushes/log` | 复数化 + v1 前缀 |
| `/api/shop/products` | `/api/v1/shops/products` | 复数化 + v1 前缀 |
| `/api/sync` | `/api/v1/sync` | 复数化 + v1 前缀 |
| `/api/sync/pull` | `/api/v1/sync/pull` | 复数化 + v1 前缀 |
| `/api/sync/push` | `/api/v1/sync/pushes` | 复数化 + v1 前缀 |
| `/api/sync/status` | `/api/v1/sync/status` | 复数化 + v1 前缀 |
| `/api/tts` | `/api/v1/tts` | 复数化 + v1 前缀 |
| `/api/user/check-super` | `/api/v1/users/check-super` | 复数化 + v1 前缀 |
| `/api/user/login` | `/api/v1/users/login` | 复数化 + v1 前缀 |
| `/api/user/profile` | `/api/v1/users/profile` | 复数化 + v1 前缀 |
| `/api/voices` | `/api/v1/voices` | 复数化 + v1 前缀 |
| `/api/yuanzhu/list` | `/api/v1/yuanzhus` | 合并到资源根路径 |
| `/api/yuanzhu/preference` | `/api/v1/yuanzhus/preference` | 复数化 + v1 前缀 |
| `/api/yuanzhu/preview-push` | `/api/v1/yuanzhus/preview-push` | 复数化 + v1 前缀 |
| `/api/yuanzhu/profile` | `/api/v1/yuanzhus/profile` | 复数化 + v1 前缀 |
| `/api/yuanzhu/send-push` | `/api/v1/yuanzhus/send-push` | 动作子路径保留 |
| `/api/yuanzhu/yearly-pushes` | `/api/v1/yuanzhus/yearly-pushes` | 复数化 + v1 前缀 |

---

## 改造统计

- 总计 **62** 个端点
- 需复数化：**62** 个
- 完全不变：**0** 个

## 落地步骤

1. server/api-server-v2.js 启动时输出新旧映射到 `GET /api/v1/migration-map`
2. 前端 API 调用全部切换到 `/api/v1/...`
3. 旧路径加 Deprecation 响应头 + 日志计数
4. 6 个月后旧路径调用量 < 1% 时下线
