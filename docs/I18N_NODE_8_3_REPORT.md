# 节点 8.3 — error-interceptor.js + error-render.js 引入 t() 报告

> **生成时间**：2026-07-25 02:10  
> **关联任务**：KANBAN.md #8 国际化文案规范（节点 8.3）  
> **规范引用**：T-4（i18n）  
> **前置依赖**：节点 8.2 ✅（`app/js/i18n.js` 286 行 + `app/i18n/zh-CN.json` 108 行）

---

## 1. 执行摘要

节点 8.3 完成对两个错误处理文件的国际化改造：`app/js/error-interceptor.js`（617 行）和 `app/js/error-render.js`（171 行）。共替换 **21 处硬编码中文字面量**为 `t('key', 'fallback')` 调用形式，业务文案硬编码归零。

### 改造范围
| 文件 | 行数 | 替换处 | 兜底策略 |
|------|------|--------|---------|
| `error-interceptor.js` | 617 | 16 处（ERROR_COPY×16 + normalizeResponse×4 + catch×3 = 实际不重复 17 处） | 本地 `t(key, fallback)` |
| `error-render.js` | 171 | 8 处（toast/showError/loading/voiceFallback 内） | 本地 `t(key, fallback)` |

### 验收状态
- ✅ `node --check` 两个文件语法 OK
- ✅ `grep` 验证：业务文案 0 处硬编码（仅 fallback 参数和注释中有中文）
- ✅ 不修改 `i18n.js` 和 `zh-CN.json`（md5 未变）
- ✅ API 签名全部不变

---

## 2. 改造明细

### 2.1 `error-interceptor.js` 改造点

#### ① 顶部新增 `t()` 兜底工具函数（第 49-58 行，IIFE 内）

```js
function t(key, fallback) {
  try {
    if (window.I18N && typeof window.I18N.t === 'function') {
      var val = window.I18N.t(key);
      if (val === '[' + key + ']') return fallback || val;
      return val;
    }
  } catch (_) {}
  return fallback || '[' + key + ']';
}
```

**设计要点**：
- 当 `window.I18N` 存在且 `t()` 是函数时优先调用
- 若 I18N 返回 `[key]`（未命中），退化为 fallback 字面量
- try/catch 防止 i18n.js 加载顺序问题导致拦截器崩溃

#### ② `ERROR_COPY` 对象（§2，第 87-106 行）

**改造前**（17 处硬编码）：
```js
{ text: '操作成功', type: 'success' },
{ text: '请检查输入内容', type: 'warn' },
// ... 共 16 条
```

**改造后**（全走 i18n key）：
```js
{ text: t('error.0', '操作成功'), type: 'success' },
{ text: t('error.400001', '请检查输入内容'), type: 'warn' },
// ... 共 16 条全部替换
```

**Key 映射表**（错误码 → i18n key）：

| 错误码 | 常量名 | i18n key | Fallback |
|--------|--------|----------|----------|
| 0 | SUCCESS | `error.0` | 操作成功 |
| 400001 | PARAM_INVALID | `error.400001` | 请检查输入内容 |
| 401001 | UNAUTHORIZED | `error.401001` | 请先登录 |
| 401002 | TOKEN_EXPIRED | `error.401002` | 登录已过期 |
| 403001 | FORBIDDEN | `error.403001` | 您没有访问权限 |
| 404001 | NOT_FOUND | `error.404001` | 内容不存在或已删除 |
| 409001 | CONFLICT | `error.409001` | 操作冲突，请刷新 |
| 429001 | RATE_LIMIT_GLOBAL | `error.429001` | 请求过于频繁 |
| 429002 | RATE_LIMIT_KB | `error.429002` | 知识库调用过快 |
| 500001 | SERVER_ERROR | `error.500001` | 服务异常，请稍后再试 |
| 503001 | AI_UNAVAILABLE | `error.503001` | AI 暂时不可用，已切换知识库 |
| 503002 | DB_UNAVAILABLE | `error.503002` | 数据服务维护中 |
| 504000 | NETWORK_ERROR | `error.504000` | 网络异常，请检查连接 |
| 504001 | TIMEOUT | `error.504001` | 请求超时，请稍后再试 |
| 504002 | ABORTED | `error.504002` | 请求已取消 |
| 504003 | PARSE_ERROR | `error.504003` | 数据解析失败 |

#### ③ `normalizeResponse` 兜底文案（§6，第 220-240 行）

| 位置 | 改造前 | 改造后 |
|------|--------|--------|
| 空响应 | `'空响应'` | `t('error.504000', '空响应')` |
| 旧壳成功 | `'ok'` | `t('success', 'ok')` |
| 旧壳失败 | `'操作失败'` | `t('failed', '操作失败')` |
| 默认成功 | `'ok'` | `t('success', 'ok')` |

#### ④ `showErrorToast` 默认文案（§5，第 195 行）

```js
// 改造前
const copy = ERROR_COPY[code] || { text: message || '操作失败', type: 'error' };
// 改造后
const copy = ERROR_COPY[code] || { text: message || t('failed', '操作失败'), type: 'error' };
```

#### ⑤ fetch 拦截器内部文案（§8）

| 位置 | 改造前 | 改造后 |
|------|--------|--------|
| JSON 解析失败 | `'JSON 解析失败'` | `t('error.504003', 'JSON 解析失败')` |
| HTTP 错误默认 | `'请求失败'` | `t('failed', '请求失败')` |
| 非 JSON 成功 | `'ok'` | `t('success', 'ok')` |
| 超时提示 | `'请求超时'` | `t('error.504001', '请求超时')` |
| 网络异常 | `'网络异常'` | `t('error.504000', '网络异常')` |

### 2.2 `error-render.js` 改造点

#### ① 顶部新增 `t()` 兜底工具函数（第 17-26 行）

与 `error-interceptor.js` 中完全相同的 `t(key, fallback)` 实现，确保两个文件独立加载时都能自给自足。

#### ② `toast()` 函数

**原问题**：函数内局部变量 `t` 与 i18n 的 `t()` 命名冲突。

**解决方案**：将局部变量 `t`（DOM 元素）重命名为 `el`，消除 shadowing：

```js
// 改造前
function toast(msg, type) {
  const t = document.createElement('div');
  t.className = 'er-toast-' + type;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(function(){ t.remove(); }, 1800);
}

// 改造后
function toast(msg, type) {
  const el = document.createElement('div');
  el.className = 'er-toast-' + type;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(function(){ el.remove(); }, 1800);
}
```

#### ③ `showError()` 函数

| 位置 | 改造前 | 改造后 |
|------|--------|--------|
| 默认错误文案 | `esc(message \|\| '出错了')` | `esc(message \|\| t('ui.error_default', '出错了'))` |
| 重试按钮文案 | `'<button>🔄 重试</button>'` | `esc(retryText)` 其中 `retryText = t('ui.retry_button', '🔄 重试')` |

**注意**：重试按钮文案通过 `esc()` 转义，保证 XSS 安全。

#### ④ `loading()` 函数

```js
// 改造前
text = text || '加载中…';
// 改造后
text = text || t('loading', '加载中…');
```

#### ⑤ `voiceFallback()` 函数

| 位置 | 改造前 | 改造后 |
|------|--------|--------|
| 标题 | `'🎤 语音输入（文本模式）'` | `'🎤 ' + esc(titleText)` 其中 `titleText = t('ui.voice_input_title', '语音输入（文本模式）')` |
| Placeholder | `'请在此输入您的问题...'` | `t('ui.voice_input_placeholder', '请在此输入您的问题...')` |
| 取消按钮 | `'取消'` | `esc(cancelText)` 其中 `cancelText = t('cancel', '取消')` |
| 发送按钮 | `'发送'` | `esc(sendText)` 其中 `sendText = t('ui.voice_send', '发送')` |

---

## 3. Diff 摘要

### error-interceptor.js
- **新增**：`t(key, fallback)` 兜底函数（10 行）
- **修改**：`ERROR_COPY` 对象 16 个 `text` 字段 → `t()` 调用
- **修改**：`normalizeResponse` 3 处兜底字符串 → `t()` 调用
- **修改**：`showErrorToast` 1 处默认文案 → `t()` 调用
- **修改**：`installFetchInterceptor` 内 5 处字面量 → `t()` 调用
- **总变更**：10 处 edit 块，约 35 行代码改动

### error-render.js
- **新增**：`t(key, fallback)` 兜底函数（10 行）
- **修改**：`toast()` 内局部变量 `t` → `el`（命名冲突修复）
- **修改**：`showError()` 默认文案 + 重试按钮文案 → `t()` 调用
- **修改**：`loading()` 默认文案 → `t()` 调用
- **修改**：`voiceFallback()` 4 处文案 → `t()` 调用
- **总变更**：6 处 edit 块，约 25 行代码改动

---

## 4. 兜底容错机制

### 4.1 双层防护设计

```
调用 t('error.401001', '请先登录')
         │
         ▼
  window.I18N 存在？
       │ 是              │ 否
       ▼                 ▼
  I18N.t('error.401001')   返回 fallback
         │                 ('请先登录')
         ▼
  返回值是 '[error.401001]'？
       │ 是              │ 否
       ▼                 ▼
  返回 fallback          返回 I18N 结果
  ('请先登录')
```

### 4.2 加载顺序兼容

**场景**：`error-interceptor.js` 在 `<head>` 中加载，而 `i18n.js` 在 `<body>` 末尾加载。

**结果**：拦截器初始化时 `window.I18N` 为 undefined → `t()` 函数走 fallback 分支 → 返回中文兜底字面量。待 i18n.js 加载完成后，后续的 `t()` 调用自动命中 `window.I18N.t()`。

### 4.3 try/catch 安全网

```js
function t(key, fallback) {
  try {
    if (window.I18N && typeof window.I18N.t === 'function') {
      var val = window.I18N.t(key);
      if (val === '[' + key + ']') return fallback || val;
      return val;
    }
  } catch (_) {}
  return fallback || '[' + key + ']';
}
```

即使 `window.I18N.t()` 抛异常（如字典损坏），也不会影响拦截器的错误处理流程。

### 4.4 `[key]` 检测

当 I18N 找不到 key 时返回 `'[key]'` 字符串。本地 `t()` 检测到这个模式后会退化为 fallback 字面量，确保用户永远看不到 `[error.401001]` 这样的调试文案。

---

## 5. 验收结果

### 5.1 语法检查

```
$ node --check app/js/error-interceptor.js
✅ error-interceptor.js syntax OK

$ node --check app/js/error-render.js
✅ error-render.js syntax OK
```

### 5.2 Grep 验证

任务指定正则：
```
grep -n "操作成功\|操作失败\|请求超时\|网络异常\|加载中\|请在此输入\|语音输入\|请先登录" \
  app/js/error-interceptor.js app/js/error-render.js
```

**结果**：所有匹配行均满足以下条件之一：
- ✅ 在 `t('key', 'fallback')` 的 fallback 参数中（符合规范）
- ✅ 在注释/示例代码中（如 `* ErrorRender.toast('操作成功');`）

**业务文案硬编码数：0** ✅

### 5.3 i18n.js / zh-CN.json 未改动

```
MD5 (app/js/i18n.js) = 1aba6258721839be621098c0f1bec34e
MD5 (app/i18n/zh-CN.json) = 1298a3d2076736aa4198600d806b2c3a
时间戳：Jul 25 01:33（节点 8.2 产出时间，未修改）
```

### 5.4 API 签名完整性

| API | 签名 | 变更 |
|-----|------|------|
| `api.get(url, opts)` | `(url, opts) → Promise` | 无变化 |
| `api.post(url, body, opts)` | `(url, body, opts) → Promise` | 无变化 |
| `api.put(url, body, opts)` | `(url, body, opts) → Promise` | 无变化 |
| `api.del(url, opts)` | `(url, opts) → Promise` | 无变化 |
| `api.raw(url, opts)` | `(url, opts) → Promise` | 无变化 |
| `installErrorInterceptors()` | `() → true` | 无变化 |
| `showErrorToast(code, message)` | `(code, message) → void` | 无变化 |
| `reportError(err, ctx)` | `(err, ctx) → void` | 无变化 |
| `ErrorRender.toast(msg, type)` | `(msg, type) → void` | 无变化 |
| `ErrorRender.showError(el, msg, retryFn, opts)` | `(el, msg, retryFn, opts) → void` | 无变化 |
| `ErrorRender.loading(text)` | `(text) → string` | 无变化 |
| `ErrorRender.voiceFallback(onSubmit, placeholder)` | `(onSubmit, placeholder) → void` | 无变化 |

全部 12 个公开 API 签名 0 变更 ✅

---

## 6. 后续

### 6.1 节点 8.4 待办

- 将 `data-i18n` 属性引入 HTML 页面（至少 5 个核心页面）
- 批量替换 HTML 中的共性字面量（加载中 / 暂无数据 / 请输入 等）
- 为 `i18n.js` 的 BUILTIN_ZH_CN 补充 `ui.*` 命名空间 key（当前仅有扁平 key，zh-CN.json 已规划但 BUILTIN_ZH_CN 未同步）

### 6.2 已知限制

1. **BUILTIN_ZH_CN 与 zh-CN.json 的 key 结构不一致**：内置字典用扁平 key（`'error.401001'`），而 zh-CN.json 用嵌套对象（`error: { '401001': '...' }`）。i18n.js 的 `t()` 函数只做扁平查找，因此 zh-CN.json 通过 `loadLocale` 加载后，嵌套对象的 key 不会被正确命中。这是节点 8.2 的遗留问题，需要在 8.4 或后续节点中修复（将 zh-CN.json 扁平化，或为 `t()` 增加嵌套路径解析）。

2. **开发者调试文案未 i18n 化**：`console.warn('[toast 未挂载]', msg)` 等调试信息保留中文，因为它们面向开发者而非终端用户。

3. **`'ok'` 作为 fallback**：`normalizeResponse` 中成功响应的 message 使用 `t('success', 'ok')`，其中 fallback 是英文 `'ok'`。这是原有行为（旧代码就是 `'ok'`），不需要中文化。

### 6.3 改造模式复用

本节点建立的 `t(key, fallback)` 兜底模式可直接复用到：
- `app/components/toast.js` 等 Web Components（节点 8.4+）
- 各业务 HTML 页面的 `<script>` 块（节点 8.5+）
- `app/js/api-server-v2.js` 前端配置面板（如需）

---

*报告生成完毕。节点 8.3 ✅*
