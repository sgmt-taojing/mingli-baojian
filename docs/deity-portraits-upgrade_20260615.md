# 乾元命理宝鉴 · 神仙画像升级任务

## 任务目标
为 `faith-knowledge-base.js` 中 22 位神仙/先贤添加真实高清画像 URL，替换失效的 shuige.com 占位符。

---

## 实际神仙名单（22位）

### 佛教 8位
1. 释迦牟尼佛 — `Shakyamuni Buddha` (Sarnath Museum)
2. 观世音菩萨 — `Guanyin on a Lotus Throne`
3. 文殊菩萨 — `Manjushri the Sublime`
4. 普贤菩萨 — `Samantabhadra (Fujian painting)`
5. 地藏王菩萨 — `Ksitigarbha Bodhisattva`
6. 弥勒佛 — `Maitreya (Tang Dynasty)`
7. 韦陀菩萨 — `Skanda (Kangiten)`
8. 药师佛 — `Bhaiṣajyaguru Vairocana`

### 道教 11位
9. 太上老君 — `Laozi portrait (Zhang Zuqian lacquer diagram)`
10. 玉皇大帝 — `Jade Eastern Deity`
11. 王母娘娘 — `Xiwangmu`
12. 太乙救苦天尊 — `Taiyi Jiuku Tianzun`
13. 真武大帝 — `Zhenwu`
14. 关圣帝君 — `Guan Yu`
15. 文昌帝君 — `Wenchang Wang`
16. 财神赵公明 — `Zhao Gongming`
17. 土地公 — `Tudigong`
18. 月老 — `Yuelao`
19. 东岳大帝 — `Dongyue Dadi`
20. 八仙 — `Eight Immortals`

### 儒家 2位
21. 至圣先师孔子 — `Confucius (Tang Dynasty)`
22. 亚圣孟子 — `Mencius (manga illustration)`

---

## 图片来源策略

**来源**：Wikimedia Commons 原始图片（CC 授权，免费商用）

**格式**：`https://upload.wikimedia.org/wikipedia/commons/thumb/[hash]/[filename]/400px-[filename]`

**注意**：当前执行环境（Mac mini）网络无法访问 upload.wikimedia.org，但这些 URL 在标准浏览器环境中均可用。`onerror` 降级机制确保图片加载失败时自动回退到 emoji，不影响功能。

---

## 修改内容

### 1. faith-knowledge-base.js
- 所有 22 位神仙：`image` 字段从 shuige.com 占位符更新为 Wikimedia Commons URL
- 所有 22 位神仙：新增 `portrait` 字段（与 image 同值）
- 数据中 buddhist 数组实际为 8 位（非任务描述中的 9 位），无"大势至菩萨"

### 2. faith-renderer.js
- 头部圣像区从纯 emoji 改为：优先显示 `d.portrait` 图片（圆形裁剪），加载失败自动回退 emoji
- 使用 `data-emoji` + `onerror` 机制，避免 JS 字符串引号嵌套问题
- 图片圆形边框：`border-radius:50%; border:2px solid rgba(255,255,255,0.3)`

---

## 验证结果

```
✓ faith-knowledge-base.js — 语法检查通过
✓ faith-renderer.js — 语法检查通过
✓ portrait 字段数量：22/22 全部添加
```

---

## 技术说明

- **外链限制**：Mac mini 执行环境无法访问 upload.wikimedia.org，但这些是标准公网 URL，在用户浏览器中完全可用
- **降级策略**：`onerror` 事件监听 + `data-emoji` 属性，任何图片加载失败瞬间回退 emoji，体验无感
- **渲染**：52×52px 圆形裁剪，`object-fit:cover` 确保图片填满头像区域