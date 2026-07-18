# 命理宝鉴 · 架构重构计划与进度

**日期**：2026-07-13
**状态**：Phase 1-3 完成，持续优化中

---

## 一、问题诊断

### 根因分析
1. **core.js 覆盖 hub.html 中的 292 个函数** → 已修复
2. **2.39MB 单体 HTML** → 已拆分懒加载（1.88MB → 首屏 + 按需加载）
3. **loading-overlay 遮罩层** → 已修复
4. **63 处 const 重复声明** → 已修复
5. **无微信适配** → 已完成

### Phase 1 修复（✅ 完成）

| 修复项 | 修复前 | 修复后 |
|---|---|---|
| loading-overlay 遮罩 | display:flex 阻挡所有点击 | display:none + 5秒超时保底 |
| const 重复声明 | 63处 SyntaxError | 改为 var |
| core.js 函数覆盖 | 18个UI函数被core.js覆盖 | 从core.js删除，hub.html版本生效 |
| core.js 体积 | 2.26MB | 1.59MB（减少 30%） |

### Phase 2 拆分多页面（✅ 完成）

| 页面 | 功能 | 状态 | 实际体积 |
|---|---|---|---|
| divination-hub.html | 主平台（含懒加载占位） | ✅ | 1.88MB（首屏 ~400KB） |
| more-functions.html | 更多功能（懒加载） | ✅ | 259KB |
| fengshui.html | 风水分析（懒加载） | ✅ | 241KB |

懒加载机制：`data-lazy` 属性 + 统一 `showSection` 包装器，用户点击时 fetch 对应 HTML 文件并注入。

### Phase 3 微信 H5 适配（✅ 完成）

1. ✅ 微信环境检测：`navigator.userAgent.includes('MicroMessenger')`
2. ✅ 微信内嵌样式适配：禁用 hover、增大触摸区域
3. ✅ 微信返回按钮：监听 `popstate` 事件
4. ✅ 禁用 iOS 双击缩放：`touch-action: manipulation`
5. ⏳ 微信 JSSDK 集成（需公众号 AppID，暂搁置）

---

## 二、引擎重写进度

| 引擎 | 原准确度 | 新准确度 | 状态 | 古法依据 |
|---|---|---|---|---|
| 八字排盘 | 7/10 | 8/10 | ✅ 稳定 | 《渊海子平》《三命通会》《滴天髓》 |
| 紫微斗数 | 2/10 | 7/10 | ✅ 已重写 | 《紫微斗数全书》古法命宫/身宫/五行局/十四主星 |
| 奇门遁甲 | 3/10 | 7/10 | ✅ 已优化 | 《烟波钓叟歌》《奇门遁甲秘笈》 |
| 大六壬 | 3/10 | 8/10 | ✅ 已重写 | 《六壬大全》《六壬指南》月将加占时/贼克法 |
| 六爻占卜 | 7/10 | 8/10 | ✅ 已修复 | 《黄金策》《周易》时间种子伪物理模拟 |
| 梅花易数 | 6/10 | 7/10 | ✅ 稳定 | 《梅花易数》体用生克 |
| 风水分析 | 3/10 | 7/10 | ✅ 已优化 | 《葬书》《青囊经》《沈氏玄空学》《八宅明镜》 |

---

## 三、Bug 修复记录（2026-07-13）

| # | Bug | 根因 | 修复 |
|---|---|---|---|
| 1 | 懒加载器正则失效 | 字符串拼接错误关闭正则 | 改用 RegExp 构造 |
| 2 | fengshuiLoaded 重复包装 | showSection 三重包装 | 删除重复包装器 |
| 3 | more.html 外网 404 | GitHub Pages 对 more.html 特殊处理 + 实际发布目录是 main:docs/ | 重命名 more-functions.html + 同步 docs/ |
| 4 | 六爻功能失效 | yjStart/_yjStartImpl 被误删 | 从 bak 恢复 |
| 5 | hub.html 旧版 CDN | gh-pages 推送无效，实际发布目录是 main:docs/ | 同步到 docs/ 目录 |

---

## 四、外网 URL

| 页面 | 地址 | 状态 |
|---|---|---|
| H5 主应用 | https://sgmt-taojing.github.io/mingli-baojian/divination-hub.html | ✅ 200 |
| 入口页 | https://sgmt-taojing.github.io/mingli-baojian/ | ✅ 200 |
| 更多功能 | https://sgmt-taojing.github.io/mingli-baojian/more-functions.html | ⏳ CDN 更新中 |
| 风水分析 | https://sgmt-taojing.github.io/mingli-baojian/fengshui.html | ✅ 200 |
| 黄历 | https://sgmt-taojing.github.io/mingli-baojian/divination-almanac.html | ✅ 200 |
| 知识库 | https://sgmt-taojing.github.io/mingli-baojian/divination-knowledge.html | ✅ 200 |
| 商城 | https://sgmt-taojing.github.io/mingli-baojian/divination-shop.html | ✅ 200 |
| 会员 | https://sgmt-taojing.github.io/mingli-baojian/divination-membership.html | ✅ 200 |

---

## 五、待办事项

### 高优先级
- [x] more-functions.html 外网 CDN 验证（2026-07-18 HTTP 200 ✅）
- [x] divination-hub.html 外网最新版验证（2026-07-18 HTTP 200 ✅）

### 中优先级
- [x] 小程序占位页实装（phone/louceng/master/merit/yunshi/hehun 全部有真实逻辑 ✅）
- [x] 商城详情页/购物车/订单/收藏 R-5 完成（16文件 ✅）
- [ ] 微信 JSSDK 集成（需 AppID）

### 低优先级
- [ ] 紫微斗数准确度提升至 8/10（需更多实测案例）
- [ ] 奇门遁甲准确度提升至 8/10（需更多实测案例）

---

## 六、清理记录（2026-07-14）

| 清理项 | 数量 | 备份位置 |
|--------|------|---------|
| app/js/*.bak* | 10 个 | backups/2026-07-13/js-baks/ |
| docs/js/*.bak* | 10 个 | backups/2026-07-13/docs-js-baks/ |
| 测试文件 | 2 个 | backups/2026-07-13/test-files/ |
| 临时文件 | 4 个 | backups/2026-07-13/test-files/ |
| liuren-upgrade.js.bak | 2 个 | 已包含在上述备份中 |
| **合计** | **28 个** | **backups/2026-07-13/** |

### CDN 状态
- divination-hub.html: ✅ 200（2MB，最新版已上线）
- more-functions.html: ⏳ GitHub Pages CDN 缓存延迟（git 仓库已确认正确，raw 200）
- fengshui.html: ✅ 200（241KB，古书引用正常）
- 两个分支（main + gh-pages）均已同步最新文件
