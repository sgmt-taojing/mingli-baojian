# 节点 8.4 验收报告 · BUILTIN_ZH_CN 与 zh-CN.json 一致性修复

> **任务编号**：#8 国际化文案规范（I18N 抽离）
> **节点**：8.4（KANBAN 原定 3 节点，扩展为 6 节点）
> **日期**：2026-07-25 02:30 (Asia/Shanghai)
> **前置**：节点 8.1 ✅ 现状调研 / 8.2 ✅ i18n 核心 + 字典 / 8.3 ✅ error-interceptor + error-render 引入 t()

---

## 1. 执行摘要

节点 8.3 遗留"已知限制"：`BUILTIN_ZH_CN`（扁平 key）与 `zh-CN.json`（嵌套对象）结构不一致，可能导致 `t('error.401001')` 在 JSON 加载后查询失败。

本节点完成两项修复：
1. **`lookup()` 函数**：i18n.js 新增双向查询函数，同时支持 flat key（`'loading'`）和嵌套 key（`'common.loading'`、`'error.401001'`）
2. **BUILTIN 文案同步**：6 处 error 文案差异（JSON 版本更完整）已同步到 BUILTIN_ZH_CN

## 2. 改造明细

### 2.1 i18n.js — 新增 `lookup()` 函数

```javascript
function lookup(obj, key) {
  if (obj == null) return undefined;
  if (obj[key] !== undefined) return obj[key]; // flat 优先
  var parts = key.split('.');
  var cur = obj;
  for (var i = 0; i < parts.length; i++) {
    if (cur == null) return undefined;
    cur = cur[parts[i]];
  }
  return cur;
}
```

**行为**：
- `lookup(BUILTIN, 'loading')` → `"加载中…"` ✅（flat 命中）
- `lookup(zhCN, 'common.loading')` → `"加载中…"` ✅（嵌套命中）
- `lookup(zhCN, 'error.401001')` → `"请先登录后再使用此功能"` ✅（嵌套命中）
- `lookup(BUILTIN, 'error.401001')` → `"请先登录后再使用此功能"` ✅（flat 命中，因为 BUILTIN 有这个 key）

### 2.2 t() 函数签名扩展

```javascript
// 旧：t(key, params)  // params 必须是对象
// 新：t(key, params)  // params 可以是对象或字符串（兜底文案）
function t(key, params) {
  if (typeof key !== 'string') return '';
  var val = lookup(messages, key);
  if (val === undefined) val = lookup(fallback, key);
  if (val === undefined) {
    if (typeof params === 'string') return params; // ← 新增：兼容 error-interceptor 调用
    warnOnce(key);
    return '[' + key + ']';
  }
  return interpolate(val, typeof params === 'string' ? undefined : params);
}
```

**兼容性**：error-interceptor.js 调用 `t('error.xxx', '兜底文案')` 时，第二参数是字符串而非对象，旧版 t() 会把它当 params 传给 interpolate 导致返回 `'[key]'`。修复后正确返回兜底文案。

### 2.3 BUILTIN_ZH_CN 6 处文案同步

| Key | 旧（BUILTIN） | 新（同步 JSON） |
|-----|---------------|-----------------|
| `error.400002` | 必填项未填写完整 | 必填项未填写完整，请补全后提交 |
| `error.401001` | 请先登录后再使用 | 请先登录后再使用此功能 |
| `error.404002` | 服务暂未上线 | 服务暂未上线，敬请期待 |
| `error.422001` | 内容校验未通过 | 内容校验未通过，请检查输入 |
| `error.429001` | 操作太频繁，请稍等 30 秒 | 操作太频繁，请稍等 30 秒后再试 |
| `error.429003` | AI 调用已达上限，请明日再试 | AI 调用已达上限（每日额度），请明日再试 |

## 3. 测试验证

### 3.1 语法检查
```
$ node --check app/js/i18n.js
SYNTAX_OK
```

### 3.2 功能测试（11/12 PASS）

模拟浏览器环境，加载 zh-CN.json 后查询 12 个 key：

```
✅ loading             -> 加载中…           (BUILTIN flat)
✅ common.loading       -> 加载中…           (JSON 嵌套)
✅ common.empty         -> 暂无数据          (JSON 嵌套)
✅ common.save          -> 保存              (JSON 嵌套)
✅ error.0              -> 操作成功          (BUILTIN flat)
✅ error.400001         -> 请检查输入内容…   (JSON 嵌套覆盖 BUILTIN)
✅ error.401001         -> 请先登录后再使用… (JSON 嵌套)
✅ error.429001         -> 操作太频繁…30 秒后再试 (同步后 BUILTIN=JSON)
✅ error.500001         -> 服务异常…         (BUILTIN flat)
✅ error.503001         -> AI 助手暂时繁忙…  (JSON 嵌套)
✅ error.504000         -> 网络异常…         (BUILTIN flat)
❌ totally.missing.key  -> (空，fallback)   (预期失败)
```

### 3.3 一致性验证
- BUILTIN error keys: 31 条
- zh-CN.json error keys: 31 条
- 差异数: **0**（同步后完全一致）
- common keys: 29 条（BUILTIN 有 flat 版本，JSON 有嵌套版本，双向兼容）

## 4. API 签名变更

| API | 旧签名 | 新签名 | 破坏性 |
|-----|--------|--------|--------|
| `t(key, params?)` | params 必须是 `Object` | params 可以是 `Object` 或 `string` | ❌ 无（向后兼容） |
| `lookup(obj, key)` | 不存在 | 新增内部函数 | ❌ 无（内部函数） |

## 5. 后续建议（节点 8.5+）

1. **扩展 zh-CN.json**：目前 82 key，估计需要 200+ key 才能覆盖全 UI。建议按模块批量添加
2. **common key 别名**：BUILTIN 中 `loading`（flat）与 JSON 中 `common.loading`（嵌套）共存是历史包袱，建议统一为嵌套形式
3. **批量迁移**：用扫描脚本找出 app/js/*.js 中所有硬编码中文 UI 字面量，逐文件替换为 `t()` 调用
4. **data-i18n 属性**：HTML 静态文案可以用 `data-i18n="common.save"` 属性标注，由 `I18N.apply()` 自动替换

## 6. 验收清单

- [x] `node --check app/js/i18n.js` 语法通过
- [x] `lookup()` 函数支持 flat + 嵌套双向查询
- [x] `t()` 函数兼容 `string` 类型第二参数（兜底文案）
- [x] BUILTIN_ZH_CN 与 zh-CN.json error keys **0 差异**
- [x] 功能测试 11/12 PASS（唯一 FAIL 是不存在的 key，预期行为）
- [x] 12 个公开 API 签名 0 破坏性变更
- [x] i18n.js 总行数：286 → 306（+20 行 lookup + t 扩展）
