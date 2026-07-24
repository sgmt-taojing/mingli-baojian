# 错误文案规范 (Error Copywriting)

> 让用户**看得懂、能行动、不焦虑**。
> 原则：技术错误归服务端，用户只看到结果。

## 三段式模板

```
【发生了什么】 + 【影响范围】 + 【现在怎么做】
```

## 一、全错误码矩阵（与 server/api-response.js 对齐）

### 1. 业务级（4xx）

| 错误码 | 名称 | 用户文案 | toast type | 可重试 | 自动动作 |
|--------|------|---------|-----------|--------|---------|
| 0 | SUCCESS | 操作成功 | success | - | - |
| 400001 | PARAM_INVALID | 请检查输入内容 | warn | ❌ | 高亮字段 |
| 400002 | PARAM_MISSING | 必填项未填写完整 | warn | ❌ | 高亮字段 |
| 400003 | PARAM_TOO_LONG | 输入内容过长，请精简 | warn | ❌ | - |
| 401001 | UNAUTHORIZED | 请先登录后再使用 | warn | ❌ | 弹登录框 |
| 401002 | TOKEN_EXPIRED | 登录已过期，正在为您重新登录… | info | ✅ | 自动跳登录 |
| 401003 | INVALID_TOKEN | 登录信息异常，请重新登录 | warn | ❌ | 清 token |
| 403001 | FORBIDDEN | 您没有访问权限 | error | ❌ | - |
| 403002 | RBAC_FORBIDDEN | 您当前没有该操作权限 | error | ❌ | - |
| 403003 | REGION_FORBIDDEN | 此功能仅在特定地区开放 | warn | ❌ | - |
| 404001 | NOT_FOUND | 内容不存在或已被删除 | warn | ❌ | 引导回首页 |
| 404002 | API_NOT_FOUND | 服务暂未上线 | warn | ❌ | - |
| 409001 | CONFLICT | 操作冲突，请刷新页面后重试 | warn | ✅ | 提示刷新 |
| 409002 | DUPLICATE_REQUEST | 请勿重复操作 | warn | ❌ | - |
| 422001 | VALIDATION_FAILED | 内容校验未通过 | warn | ❌ | - |
| 429001 | RATE_LIMIT_GLOBAL | 操作太频繁，请稍等 30 秒 | warn | ✅ | 静默 30s |
| 429002 | RATE_LIMIT_KB | 知识库调用过快，请稍后再试 | warn | ✅ | 静默 30s |
| 429003 | RATE_LIMIT_AI | AI 调用已达上限（每日额度） | warn | ❌ | 引导次日再试 |

### 2. 服务级（5xx）

| 错误码 | 名称 | 用户文案 | toast type | 可重试 | 自动动作 |
|--------|------|---------|-----------|--------|---------|
| 500001 | SERVER_ERROR | 服务异常，我们已记录（编号 xxx） | error | ✅ | 上报 |
| 500002 | UNHANDLED_REJECTION | 服务繁忙，已自动切换备用方案 | warn | ✅ | 上报 |
| 500003 | TIMEOUT_INTERNAL | 后端处理超时，请稍后再试 | warn | ✅ | - |
| 503001 | AI_UNAVAILABLE | AI 助手暂时繁忙，已切换知识库为您解答 | info | ✅ | KB 兜底 |
| 503002 | DB_UNAVAILABLE | 数据服务升级中，请稍后再试 | error | ✅ | 上报 |
| 503003 | TTS_UNAVAILABLE | 语音服务暂不可用 | warn | ❌ | 文字回退 |
| 503004 | VISION_UNAVAILABLE | 视觉识别暂不可用 | warn | ❌ | 文字输入回退 |
| 503005 | PAIPAN_TIMEOUT | 排盘超时，请稍后再试 | warn | ✅ | KB 兜底 |
| 504000 | NETWORK_ERROR | 网络异常，请检查连接 | error | ✅ | - |
| 504001 | TIMEOUT | 请求超时，请稍后再试 | warn | ✅ | - |
| 504002 | ABORTED | 请求已取消 | info | ❌ | - |
| 504003 | PARSE_ERROR | 数据解析失败，请刷新页面 | error | ❌ | 引导刷新 |

### 3. 业务领域（6xxxxx · 项目扩展）

| 错误码 | 名称 | 用户文案 | toast type | 可重试 |
|--------|------|---------|-----------|--------|
| 600001 | KB_NOT_FOUND | 知识库中暂无相关内容 | warn | ❌ |
| 600002 | KB_EMPTY_RESULT | 没有找到匹配的内容 | info | ❌ |
| 600003 | KB_TOO_SPECIFIC | 知识库过于细化，建议换个问法 | warn | ✅ |
| 601001 | FACE_OCR_FAIL | 人脸识别失败，请换张清晰照片 | warn | ❌ |
| 601002 | FACE_NO_DETECTED | 未检测到人脸，请对准镜头 | warn | ❌ |
| 602001 | TTS_SYNTHESIS_FAIL | 语音合成失败 | warn | ✅ |
| 603001 | PAIPAN_INVALID_DATE | 出生日期不合法 | warn | ❌ |
| 603002 | PAIPAN_INVALID_TIME | 出生时辰不合法 | warn | ❌ |
| 604001 | PAYMENT_FAIL | 支付失败，请重试或换支付方式 | error | ✅ |
| 604002 | PAYMENT_CANCELLED | 支付已取消 | info | ❌ |
| 604003 | ORDER_NOT_FOUND | 订单不存在或已关闭 | warn | ❌ |
| 605001 | MEMBERSHIP_EXPIRED | 会员已到期，部分功能受限 | warn | ❌ |
| 605002 | POINTS_NOT_ENOUGH | 积分不足，请充值或完成任务获取积分 | info | ❌ |

## 二、禁用文案

```javascript
// ❌ 严禁以下文案
const FORBIDDEN_PHRASES = [
  'Internal Server Error',
  'undefined',
  'null',
  '[object Object]',
  'Stack: at processTicksAndRejections',
  '请检查网络',       // 除非确实是网络问题
  '请稍后再试',       // 必须有具体下一步动作
  '出了点问题',       // 太口语，无具体行动
  'undefined is not',
  'TypeError',
  'ReferenceError',
  'SyntaxError',
  '乱码',             // 应统一展示错误码
  '系统升级中',       // 太模糊
];
```

## 三、推荐文案

```javascript
// ✅ 必须包含的元素
const REQUIRED_ELEMENTS = {
  hasOutcome: true,       // 用户能看出发生了什么
  hasAction: true,        // 给出具体下一步
  noAnxiety: true,        // 不引起焦虑
  length: '≤ 20字',       // 短文案
  includesTraceId: true   // 5xxxxx 必须带编号
};

// ✅ 推荐文案
const RECOMMENDED_PHRASES = {
  loginExpired: '登录已过期，请重新登录',
  notFound: '内容不存在或已被删除',
  serverBusy: '服务繁忙，已自动切换备用方案',
  rateLimit: '操作太频繁，请稍等 30 秒',
  aiFallback: 'AI 暂时不可用，已切换知识库为您解答',
  paramInvalid: '请检查输入内容',
  networkError: '网络异常，请检查连接',
  serverError: '服务异常，我们已记录（编号 #{traceId}）',
  forbidden: '您没有访问权限',
  success: '操作成功'
};
```

## 四、文案模板（前端可注入）

每个错误码对应：
- `text`：用户可见文案（≤ 20 字）
- `type`：`success|info|warn|error`（控制 toast 颜色）
- `action`：`login|refresh|retry|contact|none`（前端可触发对应动作）
- `retryable`：boolean（前端可决定是否自动重试）

### 模板结构

```javascript
// 对应 app/js/error-interceptor.js 的 ERROR_COPY 对象
const ERROR_COPY = {
  '[CODE]': {
    text: '...',
    type: 'success|info|warn|error',
    action: 'login|refresh|retry|contact|none',
    retryable: true|false,
    traceIdRequired: true|false  // 5xxxxx 类自动加 traceId
  }
};
```

### 使用规则

1. **文案**必须是中文，≤ 20 字，无技术词，无品牌名
2. **type** 决定 toast 颜色：success(绿) / info(蓝) / warn(黄) / error(红)
3. **action** 在 toast 显示时自动触发：
   - `login`：跳登录页
   - `refresh`：刷新页面
   - `retry`：自动重试一次
   - `contact`：弹客服浮窗
   - `none`：仅 toast
4. **retryable**：true 时前端拦截器会自动重试一次
5. **traceIdRequired**：true 时文案末尾加 `（编号 xxx）`，仅 traceId 不为空时

## 五、错误码-文案同步机制

### 5.1 同源原则
- **后端**：server/api-response.js 的 ERROR_CODES 定义权威
- **前端**：app/js/error-interceptor.js 的 ERROR_CODES 镜像同步（自动 vscode diff 校验）
- **文案**：本文件为唯一文案源

### 5.2 校验脚本（CI 必跑）
```bash
# 检查前后端错误码是否完全对齐
diff <(grep -oE '[A-Z_]+:' server/api-response.js | sort -u) \
     <(grep -oE '[A-Z_]+:' app/js/error-interceptor.js | sort -u)
# 退出码 0 = 一致，1 = 存在漏配
```

### 5.3 新增错误码流程
1. 在 server/api-response.js 加 ERROR_CODES entry
2. 在 app/js/error-interceptor.js 加 ERROR_CODES entry
3. 在本文件加文案 entry
4. 跑 5.2 校验脚本（CI 阻断）
5. 提交 PR（标题前缀 `error:`）

## 六、与 Sentry / 自建错误上报的关系

| 渠道 | 何时上报 | 上报内容 |
|------|---------|---------|
| **前端 console.error** | 所有错误 | 完整 entry（code/message/url/stack/ua/context） |
| **localStorage 缓存** | 所有错误 | 最近 20 条，刷新前可查 |
| **/api/log/error** | 5xxxxx 自动上报 | code/message/url/stack/ua/context，含 traceId |
| **Sentry（未来）** | 5xxxxx + 4xxxxx 关键 | 全量，含 breadcrumb |
| **服务端日志** | 所有错误 | 服务器日志同步记录（Winston/Pino） |
| **运维告警** | 连续 3 个 5xxxxx | 触发钉钉/飞书告警 |

## 七、A/B 测试（可选）

新文案上线前可在 `< 5%` 用户灰度：
- 创建 `app/js/error-copy-ab.js` 注入
- key: `error_copy_variant`（localStorage）
- 默认 A 版本（当前），B 版本开发中

---

**最后更新**：2026-07-24（节点 4.4 完成）
**对应代码**：server/api-response.js + app/js/error-interceptor.js
**配套端点**：`POST /api/log/error`（前端 5xxxxx 自动上报）