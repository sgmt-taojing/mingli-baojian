# 乾元命理宝鉴 - HTML/JS 语法修复 (2026-06-14 18:40)

## 修复目标
解决首页尾部乱码 + JS 语法错误导致页面无法正常加载的问题。

## 根因定位

### 问题1：多余 `<script>` 标签（核心 bug）
**位置**：`<!-- /main -->` 注释后  
**现象**：连续两个 `<script><script>`  
**影响**：
- 错误将 Script 3 起始位置计算为 555117（应为 555125）
- 语法检查误报 Script 3/4/5 全部失败
- 所有 HTML 注释内的 `<script` 标签（`__COMMENT__` 后）被错误匹配

```
修复前：</div><!-- /main --><script><script>
修复后：</div><!-- /main --><script>
```

### 问题2：API 代理 model 名称错误
- 前端发送 `model: 'openclaw/main'` → 网关拒绝（无效 model）
- 修复后代理强制使用 `model: 'openclaw'`

## 最终验证结果

| 脚本块 | 类型 | 字符数 | 状态 |
|--------|------|--------|------|
| Script 1 | 内联 | 1,059 | ✅ |
| Script 2 | 外部 | - | 📦 authoritative-knowledge-base.js |
| Script 3 | 内联 | 409,507 | ✅ |
| Script 4 | 内联 | 9,356 | ✅ |
| Script 5 | 内联 | 126,842 | ✅ |

## 文件状态
- **文件**：`/Users/tom/.qclaw/workspace/divination-hub.html`
- **大小**：1,103,864 字节 (1.05 MB)
- **行数**：21,693 行
- **HTML 结构**：✅ 完整（最后 `</html>` 在 1,103,856 位置）
- **本地服务器**：`http://127.0.0.1:8899/divination-hub.html` ✅ 运行中

## 待浏览器验证
- [ ] 首页 hero cat-grid 区域显示是否正常
- [ ] 信众面板深层点击逻辑
- [ ] toggleGuide() 展开/收起
- [ ] 底部导航栏"更多"入口
- [ ] 移动端快捷方式二维码
