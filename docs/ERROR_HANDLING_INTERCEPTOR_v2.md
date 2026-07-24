# 前端错误拦截器使用手册 v2

> **版本**：v2（节点 4.4 完成）  
> **更新日期**：2026-07-24  
> **完整规范**：docs/ERROR_COPYWRITING.md（错误码 × 文案矩阵）

---

## 1. 三层错误处理流水线

```
HTTP 请求 → [1. fetch 拦截器] → [2. 响应归一化] → [3. toast + 上报]
```

### 第 1 层：fetch prototype 拦截

```javascript
// 自动覆盖所有 fetch 调用，无需手动接入
// 命中后自动：附加 X-Trace-Id、判断可重试、统一错误码转换
const res = await fetch('/api/divination', { method: 'POST', body: JSON.stringify(data) });
// 上面的 res 已经被拦截器处理：throw 出来的 err.code 已经是标准化错误码
```

### 第 2 层：响应归一化

| 输入响应壳 | 标准化字段 |
|-----------|-----------|
| **新壳** `{ code, message, data, traceId, timestamp }` | 直接使用 |
| **旧壳** `{ success, data, error }` | success=true → code:0 / success=false → code:500001 |
| **仅 HTTP 状态码 4xx/5xx** | 用 `httpCodeToBiz()` 推断 code |
| **空响应 / 网络错误** | code = 504000（NETWORK_ERROR） |

### 第 3 层：toast + 上报

| 错误码 | toast 类型 | 自动动作 | 上报 |
|--------|----------|---------|------|
| 4xxxxx | warn | 高亮字段/跳登录/静默 30s | ❌（除 429） |
| 5xxxxx | error/info | 上报 + 兜底（AI→KB）| ✅ beacon 自动 |
| 504xxx | error/warn | 重试 1 次 | ✅ 上报 |

---

## 2. 使用方式

### 2.1 简单调用（推荐）

```javascript
// HTML 末尾加载拦截器后，业务代码无需改动
// 原本: const res = await fetch('/api/xxx')
//      现在: const res = await fetch('/api/xxx')
//            await res.json()     // 已经过归一化
// 错误:  try/catch 即可捕获标准化错误
try {
  const data = await fetch('/api/divination', { 
    method: 'POST',
    body: JSON.stringify({ birth_date: '1990-01-01' })
  }).then(r => r.json());
  // data.code === 0 表示成功
} catch (err) {
  // err.code 已经是标准错误码（如 400001）
  console.error(err.code, err.message);
}
```

### 2.2 工具 API：apiCall

```javascript
// 拦截器提供的工具函数，统一处理 + 自动 toast
const result = await window.apiCall('/api/ai/chat', {
  method: 'POST',
  body: { question: '我的八字' }
});
if (result.code === 0) {
  console.log('AI 回答:', result.data);
} else {
  // 已经自动 toast，无需再处理
}
```

### 2.3 手动上报（非 fetch 错误）

```javascript
// 用于捕获 try/catch 外的异步错误
window.addEventListener('unhandledrejection', (e) => {
  window.reportError({
    code: 500002,
    message: e.reason && e.reason.message || String(e.reason),
    stack: e.reason && e.reason.stack || ''
  });
});

// 也可业务内主动上报
window.reportError({
  code: 600001,
  message: '特定业务失败',
  context: { feature: 'paipan', user_input: {...} }
});
```

### 2.4 事件订阅（高级用法）

```javascript
// 监听全局错误事件
window.addErrorListener((err) => {
  console.log('收到错误事件:', err);
  // err: { code, message, raw }
  // 业务可以：自动跳登录、显示联系客服、根据 code 切兜底
});

// 取消监听
const fn = (err) => console.log(err);
window.addErrorListener(fn);
window.removeErrorListener(fn);
```

### 2.5 单次豁免（高级用法）

```javascript
// 不想被拦截的请求（极少数）
fetch('/api/xxx', {
  headers: { 'X-Skip-Interceptor': '1' }
});
```

---

## 3. 错误文案矩阵（节选）

完整版见 [ERROR_COPYWRITING.md](ERROR_COPYWRITING.md)。

| 错误码 | 用户文案 | toast | 自动动作 |
|--------|---------|-------|---------|
| 0 | 操作成功 | success(绿) | - |
| 400001 | 请检查输入内容 | warn(黄) | 高亮字段 |
| 401001 | 请先登录后再使用 | warn | 弹登录框 |
| 401002 | 登录已过期，正在为您重新登录… | info(蓝) | 自动跳登录 |
| 403001 | 您没有访问权限 | error(红) | - |
| 404001 | 内容不存在或已被删除 | warn | 引导回首页 |
| 409001 | 操作冲突，请刷新页面后重试 | warn | 提示刷新 |
| 429001 | 操作太频繁，请稍等 30 秒 | warn | 静默 30s |
| 500001 | 服务异常，我们已记录（编号 xxx） | error | 上报 |
| 503001 | AI 助手暂时繁忙，已切换知识库为您解答 | info | KB 兜底 |
| 503002 | 数据服务升级中，请稍后再试 | error | 上报 |
| 504000 | 网络异常，请检查连接 | error | - |
| 504001 | 请求超时，请稍后再试 | warn | - |

---

## 4. 自定义错误码（业务领域）

错误码 6xxxxx 预留给业务：

| 错误码 | 场景 |
|--------|------|
| 600001 | KB_NOT_FOUND - 知识库无结果 |
| 601001 | FACE_OCR_FAIL - 人脸识别失败 |
| 602001 | TTS_SYNTHESIS_FAIL - 语音失败 |
| 603001 | PAIPAN_INVALID - 排盘参数错 |
| 604001 | PAYMENT_FAIL - 支付失败 |
| 605001 | MEMBERSHIP_EXPIRED - 会员到期 |

新增业务错误码流程：
1. 在 server/api-response.js 加 ERROR_CODES entry
2. 在 app/js/error-interceptor.js 同步加
3. 在 ERROR_COPYWRITING.md 加文案 + type + action
4. CI 校验 `diff` 一致性

---

## 5. 与后端 `/api/log/error` 端点联动

### 5.1 上报协议

```http
POST /api/log/error HTTP/1.1
Host: 127.0.0.1:8920
Content-Type: application/json

{
  "code": 500001,
  "message": "TypeError: Cannot read property 'xxx' of undefined",
  "url": "/api/divination/bazi",
  "stack": "TypeError ...\n  at handleBaziRequest ...",
  "ua": "Mozilla/5.0 ...",
  "context": {
    "birth_date": "1990-01-01",
    "feature": "bazi-paipan"
  },
  "ts": 1721822400000
}
```

### 5.2 后端响应

```json
{
  "code": 0,
  "message": "错误已记录",
  "data": {
    "received": true,
    "traceId": "500001-1721822400123"
  },
  "traceId": "t-...",
  "timestamp": "2026-07-24T12:00:00.000Z"
}
```

### 5.3 服务端存储

- 立即输出 `[client-error]` 到服务器日志
- 追加到 `data/error-reports/YYYY-MM-DD.jsonl`（一行一条 JSON）
- **无认证**（前端可能还没有 token）
- 限额：单条 message ≤ 500 字符 / stack ≤ 2000 字符（防止滥用）

---

## 6. 错误日志查询（运维）

### 6.1 实时监控

```bash
# 服务端日志
tail -f /var/log/mingli-baojian/api-v2.log | grep "client-error"

# 当日 JSONL
tail -f data/error-reports/$(date +%F).jsonl | jq .
```

### 6.2 错误聚合分析

```bash
# 当日错误码分布
cat data/error-reports/$(date +%F).jsonl | \
  jq -r '.code' | sort | uniq -c | sort -rn

# 错误最多的 URL TOP10
cat data/error-reports/$(date +%F).jsonl | \
  jq -r '.url' | sort | uniq -c | sort -rn | head 10
```

### 6.3 告警阈值（建议）

- **5xxxxx 连续 3 个不同用户** → 飞书告警
- **503001 占比 > 20%**（AI 全挂） → 飞书告警
- **504000 占比 > 5%**（网络层异常） → 飞书告警
- **单 URL 错误 > 100次/小时** → 飞书告警

---

## 7. 验收清单

- [x] 拦截器加载：`window.installErrorInterceptors()` 调用一次
- [x] 拦截 fetch 全覆盖：95 处业务 fetch 自动接管
- [x] 拦截 XHR 兜底：jQuery/老 AJAX 也能归一化
- [x] 错误码收敛：4 类用户码 + 6 类服务码 + 4 类网络码
- [x] toast 显示：toast 组件加载后自动显示
- [x] 401 自动跳登录：双触发（res.code + http.status）
- [x] 429 静默 30s：全局不弹 toast
- [x] 5xxxxx 自动上报：beacon 优先，失败 fallback fetch
- [x] localStorage 缓存：最近 20 条，开发者可调
- [x] 与后端 ERROR_CODES 对齐：CI diff 通过
- [x] 后端 `/api/log/error` 端点：JSONL 落盘
- [x] 错误文案矩阵：25 个错误码完整文案

---

## 8. 后续演进

| 阶段 | 任务 |
|------|------|
| **v2.1** | Sentry 集成（5xxxxx 全量上报） |
| **v2.2** | 错误聚类分析（按 code+message 自动分组） |
| **v2.3** | 用户反馈入口（一键"上报并反馈"） |
| **v2.4** | 智能重试（基于错误码模式学习） |
| **v2.5** | 错误码自适应文案（A/B 测试） |

---

**最后更新**：2026-07-24（节点 4.4 完成）
**对应代码**：
- 前端：[app/js/error-interceptor.js](../app/js/error-interceptor.js)
- 后端：[server/api-server-v2.js](../server/api-server-v2.js)（`POST /api/log/error`）
- 文案：[docs/ERROR_COPYWRITING.md](ERROR_COPYWRITING.md)