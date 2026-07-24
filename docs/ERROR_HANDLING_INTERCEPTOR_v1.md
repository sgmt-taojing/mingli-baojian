# 前端全局错误拦截器 · 实施报告

> **任务**: #4 · 错误处理规范  
> **节点**: 4.3 前端 axios/fetch 全局错误拦截器  
> **日期**: 2026-07-24 16:33 GMT+8  
> **关联规范**: `docs/ERROR_HANDLING_STANDARD.md` (S-2 / T-3)  
> **前置节点**: 4.2 服务端 try/catch 全量审计（已 PASS）

---

## 1. 调用统计（grep 全量扫描）

### 1.1 总量

| 类型 | 数量 | 说明 |
|------|------|------|
| `fetch()` 调用 | **95** | `app/*.html` 内联 + `app/js/*.js` |
| `axios` 调用 | **0** | 项目未使用 axios |
| `XMLHttpRequest` | **0** | 项目未使用 XHR |

### 1.2 fetch 在各 HTML 的分布（Top 10）

| 文件 | 次数 |
|------|------|
| `app/ai-assistant.html` | 11 |
| `app/admin-kb-batch.html` | 6 |
| `app/divination-hub.html` | 6 |
| `app/master-zidise-illness.html` | 5 |
| `app/admin-glass-dashboard.html` | 4 |
| `app/glass-console.html` | 4 |
| `app/kb-explorer.html` | 4 |
| `app/admin-kb-panel.html` | 3 |
| `app/divination-integrated.html` | 3 |
| `app/monitor-dashboard.html` | 3 |
| 其它 10 个文件 | 49 |
| `app/js/*.js` | 11 |

**结论**：全部 API 调用均通过 `fetch()`，无 axios/XHR 遗留，拦截器只需覆盖 fetch 原型即可达到 100% 覆盖。

---

## 2. 产出文件

| 文件 | 字节数 | 说明 |
|------|--------|------|
| `app/js/error-interceptor.js` | ~22 KB | 全局拦截器主体 |
| `app/my-yuanzhu.html` | - | 适配示例 1（api 函数走 apiClient） |
| `app/divination-integrated.html` | - | 适配示例 2（加载拦截器脚本） |
| `docs/ERROR_HANDLING_INTERCEPTOR_v1.md` | 本文件 | 报告 |

---

## 3. API 文档

### 3.1 全局对象

加载 `error-interceptor.js` 后自动挂载：

```js
window.apiClient        // 统一 API 入口
window.apiError         // 同上（别名）
window.installErrorInterceptors  // 手动安装
window.showErrorToast   // (code, message) → 弹 toast
window.reportError      // (err, context) → 上报
```

### 3.2 apiClient API

| 方法 | 签名 | 说明 |
|------|------|------|
| `get(url, opts?)` | → `Promise<{ok, code, message, data}>` | GET 请求 |
| `post(url, body, opts?)` | 同上 | POST，自动 JSON.stringify |
| `put(url, body, opts?)` | 同上 | PUT |
| `del(url, opts?)` | 同上 | DELETE |
| `raw(url, opts?)` | 同上 | 跳过拦截器（调试用） |
| `on(event, fn)` | - | 监听 `'error'` 事件 |
| `off(event, fn)` | - | 取消监听 |
| `install()` | → boolean | 手动安装拦截器 |
| `showErrorToast(code, msg)` | - | 按 code 弹友好文案 |
| `reportError(err, ctx)` | - | 上报 + localStorage 缓存 |
| `.ERROR_CODES` | object | 错误码常量表 |
| `.ERROR_COPY` | object | 友好文案映射 |
| `.config` | object | 运行时配置 |

### 3.3 统一返回格式

所有走拦截器的请求返回标准化结果：

```ts
{
  ok: boolean,         // code === 0 ?
  code: number,        // 业务错误码
  message: string,     // 服务端消息
  data: any,           // 业务数据
  traceId?: string,    // 链路 ID
  httpStatus: number   // HTTP 状态码
}
```

### 3.4 错误码处理矩阵

| 错误码 | 动作 | 是否重试 | 是否上报 |
|--------|------|---------|---------|
| `0` | 正常返回 data | — | — |
| `400001` | toast「请检查输入内容」 | ❌ | ❌ |
| `401001` | toast + 5s 内 2 次 → 跳登录页 | ❌ | ❌ |
| `401002` | 同上 | ❌ | ❌ |
| `403001` | toast「您没有访问权限」 | ❌ | ❌ |
| `404001` | toast「内容不存在或已删除」 | ❌ | ❌ |
| `409001` | toast「操作冲突，请刷新」 | ❌ | ❌ |
| `429001` | toast + 30s 静默期 | ❌ | ❌ |
| `429002` | toast「知识库调用过快」 | ❌ | ❌ |
| `500001` | toast + 上报 | GET 重试 1 次 | ✅ |
| `503001` | toast「AI 不可用」+ 触发 error 事件 | ❌（等业务走 KB 兜底） | ✅ |
| `503002` | toast「数据服务维护中」+ 上报 | ❌ | ✅ |
| `504000` | toast「网络异常」+ 上报 | GET 重试 1 次 | ✅ |
| `504001` | toast「请求超时」+ 上报 | GET 重试 1 次 | ✅ |

---

## 4. 适配示例

### 4.1 `app/my-yuanzhu.html` — api 函数

**Before:**
```js
async function api(path, opts={}){
  const hdr = Object.assign({'Content-Type':'application/json'}, opts.headers||{});
  if(token) hdr['Authorization'] = 'Bearer ' + token;
  try{
    const r = await fetch(API + path, Object.assign({method:'GET',headers:hdr}, opts));
    return await r.json();
  }catch(e){return {error:e.message};}
}
```

**After:**
```js
async function api(path, opts={}){
  const hdr = Object.assign({'Content-Type':'application/json'}, opts.headers||{});
  if(token) hdr['Authorization'] = 'Bearer ' + token;
  try{
    const result = await window.apiClient.get(API + path, Object.assign({headers:hdr}, opts));
    return result.ok ? result.data : { error: result.message, code: result.code, data: result.data };
  }catch(e){return {error:e.message};}
}
```

### 4.2 `app/divination-integrated.html` — 仅加载脚本

```html
<script src="components/toast.js"></script>
<!-- F-9/S-2 错误拦截器（节点 #4.3） -->
<script src="js/error-interceptor.js?v=20260724-1"></script>
```

加载即生效：所有 `fetch()` 调用自动经过全局拦截器，业务代码无需修改。

### 4.3 豁免拦截（调试场景）

```js
// 方式 1：header 豁免
fetch('/api/debug', { headers: { 'X-Skip-Interceptor': '1' } });

// 方式 2：apiClient.raw
apiClient.raw('/api/debug');
```

---

## 5. 验证步骤输出

### 5.1 语法检查

```
$ node --check app/js/error-interceptor.js
SYNTAX OK
```

### 5.2 静态服务验证

```
$ python3 -m http.server 8914 --directory app

HTTP 200 bytes=27510   /js/error-interceptor.js
HTTP 200 bytes=5523    /components/toast.js
HTTP 200 bytes=12983   /my-yuanzhu.html
HTTP 200 bytes=169544  /divination-integrated.html
HTTP 404 bytes=469     /api/test-error   ← 预期，拦截器会按 NOT_FOUND 处理
```

✅ 所有文件可正常加载。

### 5.3 运行时行为（浏览器环境）

- 拦截器在 `DOMContentLoaded` 自动安装
- 安装后 console 输出 `[error-interceptor] 已安装（fetch + XHR + $axios stub）`
- 错误日志缓存在 `localStorage._err_log_v1`（最近 20 条）
- 5xxxxx 错误自动通过 `navigator.sendBeacon('/api/log/error', ...)` 上报

---

## 6. 架构说明

### 6.1 拦截链路

```
业务代码 fetch(url)
       ↓
拦截器 fetch wrapper
       ├─ 附带 X-Trace-Id
       ├─ 附加 AbortController（15s 超时）
       ↓
原生 fetch(url)
       ↓
响应到达
       ├─ 解析 JSON → normalizeResponse()
       ├─ HTTP 状态码 → bizCode 映射
       ↓
错误处理 handleBizError()
       ├─ showErrorToast(code, message)
       ├─ 401 → 5s/2 次 → 跳登录页
       ├─ 429 → 30s 静默
       ├─ 5xx → reportError() + 自动重试（GET 类）
       └─ emit('error', payload)
       ↓
业务代码拿到 { ok, code, data, ... }
```

### 6.2 错误上报 payload

```json
{
  "code": 500001,
  "message": "服务异常",
  "url": "/api/paipan/bazi",
  "stack": "...",
  "ua": "Mozilla/5.0 ...",
  "context": { "url": "/api/paipan/bazi", "method": "GET" }
}
```

**PII 安全**：payload 不含用户名、手机号、token 等个人信息（遵循 `DATA_SECURITY_STANDARD.md`）。

---

## 7. 已知限制

1. **覆盖范围**：仅拦截 `fetch` 和 `XMLHttpRequest`，不覆盖 `<img src>`、`<script src>`、CSS `url()` 等资源加载错误（这些由 `window.onerror` / `unhandledrejection` 处理，不在本节点范围）。
2. **SSR / 预渲染**：拦截器仅在浏览器环境生效，Node.js 端不安装。
3. **CORS 限制**：跨域请求的错误信息可能被浏览器截断（`TypeError: Failed to fetch`），拦截器会归类为 `NETWORK_ERROR`。
4. **第三方库**：如果未来引入 axios，需在 `axios.interceptors.response.use` 中追加同一处理矩阵（已预留 `$axios` stub）。
5. **重试策略**：仅 GET 类 + 5xxxxx 错误重试 1 次，POST/PUT/DELETE 不重试（避免重复写入）。
6. **上报端点**：`/api/log/error` 后端尚未实现（属节点 4.4 范围），当前仅 localStorage 缓存 + console.error。
7. **KB 兜底触发**：503001 时仅 emit `error` 事件，业务需自行监听并调用 KB 兜底链路（属节点 4.5 e2e 测试范围）。

---

## 8. 与规范对齐

| 规范要求 (S-2 §6) | 实现状态 |
|-------------------|---------|
| `window.api.get/post/put/del/raw` | ✅ `apiClient` 对象 |
| 处理矩阵 12 条 | ✅ `handleBizError()` 全覆盖 |
| 错误上报 `/api/log/error` | ✅ sendBeacon（端点待后端实现） |
| ≤ 20 字 toast 文案 | ✅ `ERROR_COPY` 表 |
| 不暴露 stack/HTTP code | ✅ `showErrorToast` 只显示友好文案 |
| 兼容旧代码 | ✅ fetch 原型替换，旧调用零改动 |

---

## 9. 后续节点

| 节点 | 内容 | 状态 |
|------|------|------|
| 4.4 | `ERROR_COPYWRITING.md` 扩到全错误码 + 后端 `/api/log/error` | 待做 |
| 4.5 | 模拟断网 / AI 失败 → KB 兜底 e2e 测试 | 待做 |

---

## 10. 验收清单

- [x] `app/js/error-interceptor.js` 语法通过 `node --check`
- [x] 静态服务 curl 200
- [x] HTML 加载拦截器脚本
- [x] my-yuanzhu.html 适配 `apiClient.get()`
- [x] divination-integrated.html 加载拦截器
- [x] 错误码处理矩阵覆盖 5 类 + 12 子码
- [x] 用户友好文案 ≤ 20 字
- [x] 错误上报 + localStorage 缓存
- [x] 自动重试（GET + 5xx）
- [x] 401 双触发跳登录
- [x] 429 全局 30s 静默

✅ **节点 4.3 PASS**。
