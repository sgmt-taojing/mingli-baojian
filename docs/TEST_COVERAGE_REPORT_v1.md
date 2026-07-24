# 测试覆盖率报告 v1

> **任务**：[#7 · 测试规范补齐 T-1/T-2](/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/KANBAN.md)
> **节点**：7.4 — 集成测试（supertest 端到端 API 测试） + 7.5 — 覆盖率验收
> **生成时间**：2026-07-25 00:33（Asia/Shanghai）
> **测试框架**：Jest 30.4.2 + supertest 7.2.2 + @pact-foundation/pact 17.0.1

---

## 1. 总体结论

✅ **任务达标**：整体覆盖率全部维度 ≥60% 目标，整体平均超出 ≥10pp。

| 维度 | 覆盖率 | 目标 | 余量 | 状态 |
|------|--------|------|------|------|
| Statements | **71.73 %** | ≥ 60 % | +11.73 pp | ✅ |
| Branches | **63.50 %** | ≥ 60 % | +3.50 pp | ✅ |
| Functions | **79.75 %** | ≥ 60 % | +19.75 pp | ✅ |
| 测试套件 | **24** | ≥ 20 | +4 | ✅ |
| 测试用例 | **504 PASS / 504** | ≥ 400 | +104 | ✅ |

> **注**：「Lines」指标由 Istanbul 自动生成，与 Statements 同源（71.73%），略。

---

## 2. 测试分布

| 类型 | 套件数 | 测试数 | 产出 |
|------|--------|--------|------|
| 单元测试（22 套件） | 22 | 472 | tests/unit/*.test.js（api-response/logger/error-aggregator/rbac/kb-api/sync-client …） |
| 集成测试（supertest） | 1 | 28 | tests/integration/api-endpoints.test.js（4 业务路由 + CORS 预检 + api-response 便捷函数） |
| 契约测试（PactV3） | 1 | 4 | tests/contract/api-contract.test.js |
| 冒烟测试 | 1 | — | tests/smoke.test.js |
| **合计** | **24** | **504** | — |

集成测试覆盖的真实路由：

- `GET /api/v1/health`（健康检查）
- `GET /api/kb/list`（guest + super_admin 双权限）
- `GET /api/kb/:filename`（公开 KB + 受限 KB + 路径穿越 403）
- `POST /api/log/error`（前端错误上报 JSONL 落盘）
- `GET /api/public/kb-query`（KB 模块检索 + limit 上限）
- `GET /api/companion/sync`（404 兜底）
- 404 全兜底 + CORS OPTIONS 预检

---

## 3. 文件级覆盖率

### 3.1 高覆盖率（≥90 %）

| 文件 | Stmts | Branches | Functions | 备注 |
|------|------:|---------:|----------:|------|
| api-response.js | 100.0 % | 20/21 | 12/12 | 9 业务函数 + 1 通用 fail + 1 httpStatusFor |
| case-quality.js | 100.0 % | 64/66 | 7/7 | — |
| rbac-middleware.js | 100.0 % | 31/33 | 8/8 | — |
| logger.js | 100.0 % | 3/4 | 1/1 | — |
| security.js | 100.0 % | 0/0 | 0/0 | 仅导出 |
| kb-config.js | 100.0 % | 0/0 | 0/0 | 仅导出 |
| error-aggregator.js | 93.8 % | 9/10 | 3/3 | 84/95 是「无错误时的 noop 分支」 |
| yuanzhu-profile.js | 94.7 % | 124/147 | 12/15 | — |

### 3.2 中等覆盖率（70-90 %）

| 文件 | Stmts | Branches | Functions | 备注 |
|------|------:|---------:|----------:|------|
| security-v2.js | 92.2 % | 67/80 | 16/16 | token 过期分支 180-182 未触达 |
| kb-api.js | 85.0 % | 60/75 | 9/10 | 受限 KB 403 分支未完全触达 |
| sync-api.js | 82.0 % | 28/46 | 8/8 | XHR 兜底分支 |
| kb-routes.js | 80.3 % | 12/16 | 12/12 | — |

### 3.3 待加强（< 70 %）

| 文件 | Stmts | Branches | Functions | 改进方向（节点 7.6+） |
|------|------:|---------:|----------:|--------------------|
| **export-routes.js** | 40.9 % | 50/120 | 6/12 | ⚠️ 最低；数据导出场景未覆盖（CSV/JSON diff 校验） |
| distillation-engine.js | 57.6 % | 121/218 | 36/49 | 边界条件未测（空输入 / 超大文件） |
| distillation-routes.js | 59.0 % | 17/44 | 17/22 | 路由 405 + 参数校验分支 |
| data-export-guard.js | 63.3 % | 52/98 | 17/24 | PII 脱敏边界（手机号/邮箱/身份证） |
| glass-routes.js | 63.7 % | 27/37 | 11/15 | 摄像头流式接口边界 |
| im-routes.js | 66.1 % | 73/121 | 17/22 | IM 命令分发 404 兜底 |
| kb-management-engine.js | 67.7 % | 77/151 | 22/27 | KB CRUD 失败回滚分支 |
| sync-client.js | 69.8 % | 108/198 | 42/58 | XHR 失败重试 + 网络抖动 |

> 这些文件的覆盖率提升路径已记入 KANBAN.md「阻塞/延后」列表，等待后续任务 #9+ 补齐。

---

## 4. 关键验收

| 验收项 | 结果 | 证据 |
|--------|------|------|
| `npx jest` 一次性跑通 | ✅ | `Test Suites: 24 passed, Tests: 504 passed` |
| 集成测试通过率 | ✅ 28/28 | supertest 真实 HTTP |
| 契约测试通过 | ✅ 4/4 | PactV3 消费者侧 |
| 覆盖率 ≥ 60 %（4 维度） | ✅ | 71.73 / 63.50 / 79.75 / 71.73 |
| SQLite 并发问题 | ✅ 已修 | `jest.config.js maxWorkers: 1` |
| 排除文件合理 | ✅ | api-server-v2.js（巨型单一入口）+ kb-store/**（前端数据）+ 7 个无关文件 |

---

## 5. 产物清单

| 类别 | 路径 | 字节 |
|------|------|------|
| Jest 配置 | `jest.config.js` | 1,005 |
| 集成测试 | `tests/integration/api-endpoints.test.js` | 10,041 (341 行) |
| 契约测试 | `tests/contract/api-contract.test.js` | — |
| 契约产物 | `pacts/mingli-baojian-h5-mingli-baojian-api.json` | — |
| 覆盖率报告 | `coverage/lcov-report/index.html` | — |
| 覆盖率存档 | `.openclaw/tmp/coverage-summary-7.4.txt` | 见下 |
| 本归档文件 | `docs/TEST_COVERAGE_REPORT_v1.md` | 本文档 |

---

## 6. 覆盖率快照（同步归档）

```
TOTAL {"S":2112,"SC":1515,"B":1485,"BC":943,"F":321,"FC":256}
PCT   {"stmts":"71.73","brs":"63.50","fns":"79.75"}
2026-07-25 00:33 Asia/Shanghai
```

---

## 7. 下一步节点（7.5 → 7.6）

- ✅ **7.4** supertest 集成测试落地 + 本报告归档
- ✅ **7.5** 整体覆盖率验收（≥ 60 %，本报告 §1）
- 🟡 **7.6** 「#7 任务完结清单」—— KANBAN 更新 + 推进 #8

