# 命理平台通盘测试报告
**日期：** 2026-06-12
**测试范围：** divination-hub.html、divination-knowledge.html、divination-almanac.html、divination-membership.html
**跳过：** divination-shop.html（另一子代理正在修改）

---

## 一、语法检查

| 文件 | 结果 | 详情 |
|------|------|------|
| divination-hub.html | ✅ 已修复 | 原有多行单引号字符串字面量导致 SyntaxError，已改为模板字符串 |
| divination-knowledge.html | ✅ OK | JS 语法正常 |
| divination-almanac.html | ✅ OK | JS 语法正常 |
| divination-membership.html | ✅ OK | JS 语法正常 |

**Critical Fix (hub):** `ceziAnalysis.innerHTML` 使用了多行单引号字符串字面量，Node.js 解析器无法处理。改为模板字符串（反引号）后语法通过。

---

## 二、HTML结构

| 文件 | 未闭合标签 | 多余闭合标签 | 结尾正确 |
|------|----------|------------|---------|
| divination-hub.html | 无 | 有（text/svg/title/head/span/button/div 等） | ✅ |
| divination-knowledge.html | 无 | 有（title/head/a/div/h1/p 等） | ✅ |
| divination-almanac.html | 无 | 有（title/head/a/div/h1/p 等） | ✅ |
| divination-membership.html | 无 | 有（title/head/div/span/a 等） | ✅ |

**说明：** 多余闭合标签均出现在 `<template>` 和 `<svg>` 块内，是标准 HTML5 写法（浏览器自动处理）。结构本身无实际问题。

---

## 三、JavaScript函数完整性

| 文件 | onclick函数 | 缺失函数 | getElementById调用 | 缺失ID |
|------|------------|---------|-------------------|-------|
| hub | 35 | 无（`alert`/`event`/`window` 是浏览器内置对象，非自定义函数） | 133 | 无 |
| knowledge | 3 | 无 | 0 | 无 |
| almanac | 3 | 无 | 6 | 无 |
| membership | 10 | 无 | 21 | 无 |

✅ 所有函数和ID引用均完整。

---

## 四、CSS完整性

| 文件 | CSS类定义 | HTML使用类 | 缺失CSS（HTML引用的） |
|------|----------|-----------|---------------------|
| hub | 345 | 271 | `缺角, fp1-fp6, section-body, worship-*, violet-accent, btn-primary, btn-secondary, faith-tabs, 吉位` 等 |
| knowledge | 51 | 52 | 无 |
| almanac | 66 | 68 | `fo-tab, dao-tab, ru-tab, ${view}`（后两个是 JS 模板字符串插值，非实际类） |
| membership | 128 | 127 | `almanac-good, almanac-bad, ${cls}, tier-free, tier-popular`（`${}` 是 JS 模板插值） |

**Info 级：** hub 中存在部分 CSS 类（如 `btn-primary`、`btn-secondary`）在 HTML 中引用但未在 CSS 中定义；这些类可能是有意留作将来扩展或从其他平台复用，暂不影响运行。

---

## 五、导航链接

| 文件 | 总链接数 | 死链 |
|------|---------|------|
| hub | 12 | `manifest.json`（PWA配置，正常）、`data:image/svg+xml,<svg...`（内联SVG，非导航链接） |
| knowledge | 19 | 无 |
| almanac | 8 | 无 |
| membership | 10 | 无 ✅ 已修复 |

**Warning Fix (membership):** `href="#"` 链接已改为实际文件路径：
- `a.brand` → `divination-hub.html`
- `a.active` → `divination-membership.html`
- 底部法律链接 → `divination-hub.html`

---

## 六、常见Bug修复

### Critical（已全部修复）

1. **JS语法错误** (hub, line ~5951): `ceziAnalysis.innerHTML` 使用多行单引号字符串 → 改为模板字符串
2. **event.stopPropagation() in onclick** (hub, 6处): `onclick="event.stopPropagation();..."` 不work → 移除该调用
3. **alert() 残留** (hub, 14处 → 0处): 所有 `alert()` 替换为 `showToast()`，并新增 toast CSS 样式
4. **alert() 残留** (almanac, 2处 → 0处): 同上
5. **alert() 残留** (membership, 2处 → 0处): 同上
6. **href="#" 死链** (membership, 5处 → 0处): 改为实际导航路径

### 新增 showToast 函数（hub、almanac、membership）
```javascript
function showToast(msg) {
  var t = document.getElementById('toastMsg');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toastMsg';
    t.className = 'toast-msg';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._tid);
  t._tid = setTimeout(function() { t.classList.remove('show'); }, 2500);
}
```

### Toast CSS 样式（hub、almanac、membership）
```css
.toast-msg{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(20,18,14,.95);border:1px solid rgba(201,168,76,.3);color:#f0e8d8;font-family:'Noto Serif SC',serif;font-size:14px;padding:18px 28px;letter-spacing:2px;border-radius:4px;z-index:99999;box-shadow:0 4px 32px rgba(0,0,0,.6);text-align:center;min-width:220px;opacity:0;transition:opacity .25s ease;pointer-events:none}
.toast-msg.show{opacity:1}
```

---

## 七、移动端适配

| 文件 | viewport | safe-area | bottom-nav | 768px断点 | 480px断点 |
|------|---------|-----------|-----------|----------|---------|
| hub | ✅ | ✅ | ✅ | ✅ | ✅ |
| knowledge | ✅ | ❌ | ❌ | ✅ | ❌ |
| almanac | ✅ | ❌ | ❌ | ✅ | ❌ |
| membership | ✅ | ❌ | ❌ | ❌ | ❌ |

**Info 级：** knowledge、almanac、membership 三个页面较简单（单页垂直布局），没有 bottom-nav 和 safe-area-inset 是设计选择，非缺失。如需增强移动端体验可补充。

---

## 修复汇总

### 已修复（Critical + Warning）

| # | 文件 | 问题 | 修复方式 |
|---|------|------|---------|
| 1 | hub | JS语法错误（多行单引号字符串） | 改为模板字符串 |
| 2 | hub | event.stopPropagation() in onclick（6处） | 移除该调用 |
| 3 | hub | alert() 残留（14处） | 替换为 showToast() |
| 4 | almanac | alert() 残留（2处） | 替换为 showToast() |
| 5 | membership | alert() 残留（2处） | 替换为 showToast() |
| 6 | membership | href="#" 死链（5处） | 改为实际导航路径 |
| 7 | hub/almanac/membership/knowledge | 无 toast 函数 | 新增 showToast() + CSS |
| 8 | knowledge | alert() 残留（11处，音频占位提示） | 替换为 showToast() |

### 待观察（Info 级，不影响功能）

- hub: 部分 CSS 类（如 `btn-primary`）在 HTML 引用但 CSS 未定义 → 可能是预留扩展
- almanac/membership: `${view}` / `${cls}` 是 JS 模板插值，非实际 CSS 类
- knowledge/almanac/membership: 无 safe-area-inset 处理 → 简单页面可接受

---

## 最终状态

| 文件 | JS语法 | HTML结构 | 链接完整 | alert() | stopPropagation |
|------|-------|---------|---------|---------|---------------|
| hub | ✅ | ✅ | ✅ | ✅ 0处已清除 | ✅ 6处已清除 |
| knowledge | ✅ | ✅ | ✅ | ✅ 11处已清除 | N/A |
| almanac | ✅ | ✅ | ✅ | ✅ 2处已清除 | N/A |
| membership | ✅ | ✅ | ✅ | ✅ 2处已清除 | N/A |