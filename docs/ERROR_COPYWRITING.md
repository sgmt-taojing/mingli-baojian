# 错误文案规范 (Error Copywriting)

> 让用户**看得懂、能行动、不焦虑**。
> 原则：技术错误归服务端，用户只看到结果。

## 三段式模板

```
【发生了什么】 + 【影响范围】 + 【现在怎么做】
```

### 示例

| 错误码 | 技术信息 | 用户文案 |
|--------|---------|---------|
| 400001 | validation: missing field 'birth_date' | 请填写完整出生信息 |
| 401001 | no Authorization header | 请先登录后再使用 |
| 401002 | jwt expired | 登录已过期，正在为您重新登录… |
| 403001 | RBAC_FORBIDDEN: need 'case:create' | 您当前没有该操作权限 |
| 404001 | case not found: case-xxx | 内容不存在或已被删除 |
| 429001 | rate limit: 121/120 | 操作太频繁，请稍等 30 秒 |
| 500001 | TypeError: cannot read prop... | 服务异常，我们已记录（编号 xxx） |
| 503001 | AI timeout | AI 助手暂时繁忙，已切换知识库为您解答 |
| 503002 | database locked | 数据服务升级中，请稍后再试 |

## 禁用文案

- ❌ `Internal Server Error`
- ❌ `undefined` `null` `[object Object]`
- ❌ `Stack: at processTicksAndRejections...`
- ❌ `请检查网络`（如果不是网络问题）

## 推荐文案

- ✅ `登录已过期，请重新登录`
- ✅ `内容不存在或已被删除`
- ✅ `服务繁忙，已自动切换备用方案`
- ✅ `我们已记录此问题（编号xxx），请稍后再试`
