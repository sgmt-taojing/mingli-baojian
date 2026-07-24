# 错误处理与降级规范（ERROR_HANDLING_STANDARD）

> **规范代号**：S-2 / T-3
> **版本**：v1.0
> **生效日**：2026-07-24
> **维护**：命理宝鉴架构组
> **配套文档**：`ERROR_CODE_TABLE.md`、`ERROR_CODES_GOVERNANCE.md`、`ERROR_COPYWRITING.md`、`API_STANDARD.md`

---

## 1. 目的

统一前后端的错误处理、降级、用户提示文案，杜绝：

- 原始 stack trace 暴露给用户
- AI 死循环（之前 `AI 助手死循环` bug 的根因）
- 401 只在 `/api/login` 特殊处理，其它接口静默失效
- 网络断时页面无降级
- 服务端 try/catch 漏掉，进程崩溃

## 2. 适用范围

- 所有后端路由（`server/api-server-v2.js`、`server/kb-routes.js`、`server/distillation-routes.js` 等）
- 所有前端 fetch 调用（`app/*.html` + `app/js/*`）
- 所有 AI 兜底链路（AI 助手、AI 解读、塔罗解读等）

## 3. 错误码分级

错误码定义见 `ERROR_CODE_TABLE.md`，本规范引用其语义，不重复定义。

| 段位 | 含义 | 处理策略 |
|------|------|---------|
| `0` | 成功 | 不进错误流 |
| `4xxxxx` | 客户端错误（参数/鉴权/资源） | 拦截器弹出友好提示，不重试 |
| `5xxxxx` | 服务端错误（DB/AI/未知异常） | 拦截器走兜底，必要时重试 1 次 |

5 段细分：

```
5xx001 服务端异常（兜底，未归类）
503001 AI 不可用
503002 DB 不可用
429001 全局限流
429002 KB 限流
```

## 4. 降级链（AI 类接口）

```
优先级从高到低：
┌─────────────────────────────────────────────────────────┐
│ 1. KB 命中 ≥ 0.7  →  直答 + 标注「来源: KB」           │ ← 最快、最低成本
│ 2. KB 0.4 - 0.7   →  KB 摘要 + 后端 AI 润色           │
│ 3. KB < 0.4       →  后端 AI + KB 兜底片段            │
│ 4. 全失败          →  兜底文案（兜底表查表）           │ ← 最末兜底
└─────────────────────────────────────────────────────────┘
```

每一步必须 **限时**（默认 1500ms）+ **捕获异常**，任何一步超时就跳到下一步。

命中分阈值定义：

| 范围 | 行为 |
|------|------|
| ≥ 0.7 | KB 直答，不调用后端 AI |
| 0.4 ≤ x < 0.7 | KB 摘要 + AI 润色（节省 token） |
| < 0.4 | AI 全量生成 + KB 摘要作 fallback |

命中率统计写入 `localStorage._kb_hit_count/{module}`，showWelcome 显示「今日 KB 直答 N 次」。

## 5. 服务端 try/catch 兜底

**强制要求**：每个业务路由 handler 必须包 try/catch，错误统一走 `apiResp(5xxxxx, null, e.message)`。

### 5.1 模板

```js
app.post('/api/xxx', auth, async (req, res) => {
  try {
    // 业务逻辑
    return apiResp(res, 0, data);
  } catch (e) {
    console.error('[xxx]', e);
    return apiResp(res, 500001, null, e.message || '服务异常');
  }
});
```

### 5.2 错误码映射

| catch 到 | 抛 |
|---------|-----|
| `e.code === 'AI_TIMEOUT'` 或 `e.message.includes('AI')` | `503001` |
| `e.code === 'DB_UNAVAILABLE'` 或 `pool` 错 | `503002` |
| 其它 | `500001`（兜底） |

### 5.3 覆盖率指标

- 必须 100%（`grep -c "} catch" server/*.js` ≥ 路由数）
- 全量扫描脚本：`.openclaw/tmp/scan-errors.js`

## 6. 客户端拦截器

实现位置：`app/js/api-client.js`（本次新增，全局 fetch wrapper）。

### 6.1 API

```js
window.api = {
  get(url, opts),
  post(url, body, opts),
  put(url, body, opts),
  del(url, opts),
  raw(url, opts) // 不走拦截器，调试用
};
```

### 6.2 处理矩阵

| 错误码 | 动作 |
|--------|------|
| `0` | 正常返回 data |
| `400001` | toast「请检查输入内容」+ 高亮字段 |
| `401001` | 跳登录页 + 保留 `returnTo` |
| `401002` | 自动 refresh token；失败 → 跳登录页 |
| `403001` | toast「您没有访问权限」 |
| `404001` | toast「内容不存在或已被删除」 |
| `409001` | toast「操作冲突，请刷新后重试」 |
| `429001` | 全局 toast「请求过于频繁」+ 30s 倒计时静默 |
| `429002` | toast「知识库调用过快」 |
| `500001` | toast「服务异常，请稍后再试」+ 错误上报 |
| `503001` | 走 KB 兜底 + toast「AI 暂时不可用，已为您切换知识库模式」 |
| `503002` | toast「数据服务维护中」+ 禁用相关按钮 |

### 6.3 错误上报

5xxxxx 类自动上报到 `/api/log/error`（payload：code、message、url、stack、userAgent），用于监控大盘。

## 7. 用户友好文案

所有文案集中维护在 `docs/ERROR_COPYWRITING.md`。

每条文案必须：

- ≤ 20 字（toast 单行）
- 不带技术词（stack / exception / 500 / null）
- 含动词或安抚语

新错误码上线前必须先加文案，否则拦截器无字可弹。

## 8. 验收标准

- [ ] 本规范文档发布（本文）
- [ ] `app/js/api-client.js` 全局 fetch wrapper 上线
- [ ] 服务端所有路由 try/catch 覆盖率 = 100%
- [ ] `docs/ERROR_COPYWRITING.md` 全错误码文案齐
- [ ] 模拟断网 → KB 兜底链路 100% 生效
- [ ] 模拟 AI 失败 → 503001 → KB 兜底 100% 生效
- [ ] 401001 / 401002 拦截动作通过 e2e 测试

## 9. 落地节奏（已迁 KANBAN.md #4）

| 节点 | 内容 | 状态 |
|------|------|------|
| 4.1 | 写 `ERROR_HANDLING_STANDARD.md` | ✅ |
| 4.2 | 服务端 try/catch 全量审计 + 补齐 | ⏳ |
| 4.3 | 前端 `api-client.js` 全局拦截器 | ⏳ |
| 4.4 | `ERROR_COPYWRITING.md` 扩到全错误码 | ⏳ |
| 4.5 | 模拟断网 / AI 失败 → KB 兜底 e2e 测试 + 报告 | ⏳ |

## 10. 反模式（禁止）

- ❌ 前端直接 `try { ... } catch { alert(e.message) }`
- ❌ 服务端 `throw new Error(...)` 不接住
- ❌ `console.log(e)` 后返回 200
- ❌ toast 显示 `undefined` / `null` / `Error: xxx`
- ❌ 错误文案里出现 stack 或 HTTP code
- ❌ 把 AI 兜底文案当作成功文案返回

## 11. 相关规范引用

- `API_STANDARD.md` B-1/B-2（错误码定义、apiResp 封装）
- `API_V1_KB_STANDARD.md`（KB 路由错误约定）
- `COMPONENTS.md`（toast 组件复用）
- `KB_MANAGEMENT_STANDARD.md`（KB 命中分阈值）
- `DATA_SECURITY_STANDARD.md`（错误上报 payload 不含 PII）