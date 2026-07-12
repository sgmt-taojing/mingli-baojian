# 命理平台导航整合 & 调优

## 日期
2026-06-12

## 目标
将5个独立页面（主平台、知识库、黄历、会员、商城）导航互联，形成一条龙服务平台。

## 已完成
1. **主平台导航扩充**（divination-hub.html）
   - 顶部nav新增「会员👑」「商城🛍️」tab，链接到对应页面
   - 底部移动端more-menu新增「会员中心」「开运商城」「知识文库」按钮
   
2. **各子页面返回链接**
   - divination-membership.html：nav-links改为真实链接（排盘→hub、知识库→knowledge、商城→shop、黄历→almanac）
   - divination-shop.html：logo点击返回hub；底部新增固定导航栏（排盘/知识/商城/会员/黄历）
   - divination-knowledge.html：header顶部新增返回主平台+黄历+会员+商城链接
   - divination-almanac.html：header顶部新增返回主平台+知识库+会员+商城链接

3. **HTTP服务验证**
   - 所有5个页面在localhost:8899均可正常访问（HTTP 200）

## 当前文件清单
| 文件 | 行数 | 说明 |
|------|------|------|
| divination-hub.html | ~5990 | 主平台（八字/六爻/奇门/紫微/梅花/六壬/罗盘/化解/风水/测字/手机号/信众中心/好户型/参拜指南） |
| divination-knowledge.html | ~1997 | 知识库（儒道释+择吉+好户型参考+测字案例） |
| divination-almanac.html | ~54500 | 黄历三视角（儒道释+时辰+诞辰+每日建议） |
| divination-membership.html | ~1520 | 会员体系+支付+大师预约+公众号引流 |
| divination-shop.html | ~2180 | 开运商城+推荐引擎+购物车 |

## 待处理
- 浏览器实测渲染（需人工在手机端测试）
- PWA安装测试（manifest.json + service-worker.js已就绪）
- 支付接口对接（当前为UI占位）
- 公众号引流弹窗二维码替换为真实码
