# 易道智鉴平台 · 末级菜单功能自检报告

**检查日期：** 2026-06-30  
**检查范围：** divination-hub.html、wechat-hub.html、admin.html  
**项目路径：** /Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/

---

## 一、检查方法

1. 提取 `divination-hub.html` 中所有 `onclick` 事件（共 555 处）
2. 逐一检查函数定义（内联 + 外部 JS 文件，共 906 个函数）
3. 检查目标元素 ID 是否存在
4. 检查目标区域是否有实际内容（文本长度 > 20 字符）
5. 检查 H5 页面工具入口映射是否正确
6. 检查管理后台模块是否完整

---

## 二、主平台菜单检查结果

### 2.1 顶部导航栏 (nav-tab)

| 菜单项 | 函数 | 目标ID | 函数定义 | 元素存在 | 有内容 | 状态 |
|--------|------|--------|---------|---------|--------|------|
| 首页 | showSection('hero') | section-hero | ✅divination-core.js | ✅ | ✅ | ✅正常 |
| 八字排盘 | showSection('bazi') | section-bazi | ✅ | ✅ | ✅ | ✅正常 |
| 占卜 | showSection('zhanbu') | section-zhanbu | ✅ | ✅ | ✅ | ✅正常 |
| 风水 | showSection('fengshui') | section-fengshui | ✅ | ✅ | ✅ | ✅正常 |
| 姓名 | showSection('xingming') | section-xingming | ✅ | ✅ | ✅ | ✅正常 |
| 言值 | showSection('yanzhi') | section-yanzhi | ✅ | ✅ | ✅ | ✅正常 |
| 吉日 | showSection('jiuri') | section-jiuri | ✅ | ✅ | ✅ | ✅正常 |
| 更多 | toggleMore() | moreDropdown | ✅ | ✅ | ✅ | ✅正常 |

### 2.2 更多下拉菜单

| 菜单项 | 函数 | 目标ID | 函数定义 | 元素存在 | 有内容 | 状态 |
|--------|------|--------|---------|---------|--------|------|
| 言值 | showSection('yanzhi') | section-yanzhi | ✅ | ✅ | ✅ | ✅正常 |
| 知识库 | showMoreModule('knowledge') | morePanel-knowledge | ✅ | ✅ | ✅ | ✅正常 |
| 体质 | showMoreModule('tizhi') | morePanel-tizhi | ✅ | ✅ | ✅ | ✅正常 |
| 信众 | showMoreModule('faith') | morePanel-faith | ✅ | ✅ | ✅ | ✅正常 |
| 信众中心 | showSection('user') | section-user | ✅ | ✅ | ✅ | ✅正常 |
| 口诀 | showMoreModule('koujue') | morePanel-koujue | ✅ | ✅ | ✅ | ✅正常 |
| 吉日 | showSection('jiuri') | section-jiuri | ✅ | ✅ | ✅ | ✅正常 |
| 会员 | showMoreModule('vip') | morePanel-vip | ✅ | ✅ | ✅ | ✅正常 |
| 商城 | showMoreModule('shop') | morePanel-shop | ✅ | ✅ | ✅ | ✅正常 |
| 名师解惑 | showSection('masters') | section-masters | ✅ | ✅ | ✅ | ✅正常 |

### 2.3 首页 cat-card 卡片

| 菜单项 | 函数 | 目标ID | 函数定义 | 元素存在 | 有内容 | 状态 |
|--------|------|--------|---------|---------|--------|------|
| 八字排盘 | showSection('bazi') | section-bazi | ✅ | ✅ | ✅ | ✅正常 |
| 易经六爻 | showSection('zhanbu');showZhanbuSub('yijing') | section-zhanbu, zhanbuSub-yijing | ✅ | ✅ | ✅ | ✅正常 |
| 奇门遁甲 | showSection('zhanbu');showZhanbuSub('qimen') | section-zhanbu, zhanbuSub-qimen | ✅ | ✅ | ✅ | ✅正常 |
| 紫微斗数 | showSection('zhanbu');showZhanbuSub('ziwei') | section-zhanbu, zhanbuSub-ziwei | ✅ | ✅ | ✅ | ✅正常 |
| 梅花易数 | showSection('zhanbu');showZhanbuSub('meihua') | section-zhanbu, zhanbuSub-meihua | ✅ | ✅ | ✅ | ✅正常 |
| 大六壬 | showSection('zhanbu');showZhanbuSub('liuren') | section-zhanbu, zhanbuSub-liuren | ✅ | ✅ | ✅ | ✅正常 |
| 风水 | showSection('fengshui') | section-fengshui | ✅ | ✅ | ✅ | ✅正常 |
| 言值 | showSection('yanzhi') | section-yanzhi | ✅ | ✅ | ✅ | ✅正常 |
| 名师解惑 | showSection('masters') | section-masters | ✅ | ✅ | ✅ | ✅正常 |

### 2.4 更多区域 jinang-tab

| 菜单项 | 函数 | 目标ID | 函数定义 | 元素存在 | 有内容 | 状态 |
|--------|------|--------|---------|---------|--------|------|
| 知识库 | showMoreModule('knowledge') | morePanel-knowledge | ✅ | ✅ | ✅ | ✅正常 |
| 黄历 | showMoreModule('almanac') | morePanel-almanac | ✅ | ✅ | ✅(JS动态填充) | ✅正常 |
| 体质 | showMoreModule('tizhi') | morePanel-tizhi | ✅ | ✅ | ✅ | ✅正常 |
| 信众 | showMoreModule('faith') | morePanel-faith | ✅ | ✅ | ✅ | ✅正常 |
| 口诀 | showMoreModule('koujue') | morePanel-koujue | ✅ | ✅ | ✅(JS动态填充) | ✅正常 |
| 会员 | showMoreModule('vip') | morePanel-vip | ✅ | ✅ | ✅ | ✅正常 |
| 商城 | showMoreModule('shop') | morePanel-shop | ✅ | ✅ | ✅(JS动态填充) | ✅正常 |

### 2.5 占卜子tab

| 菜单项 | 函数 | 目标ID | 函数定义 | 元素存在 | 有内容 | 状态 |
|--------|------|--------|---------|---------|--------|------|
| 易经六爻 | showZhanbuSub('yijing') | zhanbuSub-yijing | ✅ | ✅ | ✅ | ✅正常 |
| 梅花易数 | showZhanbuSub('meihua') | zhanbuSub-meihua | ✅ | ✅ | ✅ | ✅正常 |
| 奇门遁甲 | showZhanbuSub('qimen') | zhanbuSub-qimen | ✅ | ✅ | ✅ | ✅正常 |
| 大六壬 | showZhanbuSub('liuren') | zhanbuSub-liuren | ✅ | ✅ | ✅ | ✅正常 |
| 紫微斗数 | showZhanbuSub('ziwei') | zhanbuSub-ziwei | ✅ | ✅ | ✅ | ✅正常 |
| 测字 | showZhanbuSub('cezi') | zhanbuSub-cezi | ✅ | ✅ | ✅ | ✅正常 |

### 2.6 风水子tab

| 菜单项 | 函数 | 目标ID | 函数定义 | 元素存在 | 有内容 | 状态 |
|--------|------|--------|---------|---------|--------|------|
| 宅子风水 | showFengshuiSub('fengshui-content') | fengshui-content | ✅ | ✅ | ✅(33471字) | ✅正常 |
| 电子罗盘 | showFengshuiSub('luopan-content') | luopan-content | ✅ | ✅ | ✅(JS懒加载) | ✅正常 |

### 2.7 姓名子tab

| 菜单项 | 函数 | 目标ID | 函数定义 | 元素存在 | 有内容 | 状态 |
|--------|------|--------|---------|---------|--------|------|
| 改名 | showXingmingSub('rename') | xingmingSub-rename | ✅ | ✅ | ✅ | ✅正常 |
| 公司取名 | showXingmingSub('company') | xingmingSub-company | ✅ | ✅ | ✅ | ✅正常 |
| 手机号分析 | showXingmingSub('mobile') | xingmingSub-mobile | ✅ | ✅ | ✅ | ✅正常 |

### 2.8 名师解惑子tab

| 菜单项 | 函数 | 目标ID | 函数定义 | 元素存在 | 有内容 | 状态 |
|--------|------|--------|---------|---------|--------|------|
| 道家名师 | showMastersTab('taoist') | mastersPanel-taoist | ✅calc-engine-lib.js | ✅ | ✅ | ✅正常 |
| 佛家名师 | showMastersTab('buddhist') | mastersPanel-buddhist | ✅ | ✅ | ✅ | ✅正常 |
| 非遗中医 | showMastersTab('tcm') | mastersPanel-tcm | ✅ | ✅ | ✅ | ✅正常 |
| 清规戒律 | showMastersTab('precepts') | mastersPanel-precepts | ✅ | ✅ | ✅ | ✅正常 |
| 我要提问 | openAskModal() | askModal | ✅ | ✅ | ✅ | ✅正常 |

### 2.9 底部导航栏

| 菜单项 | 函数 | 目标ID | 函数定义 | 元素存在 | 有内容 | 状态 |
|--------|------|--------|---------|---------|--------|------|
| 首页 | showSection('hero') | section-hero | ✅ | ✅ | ✅ | ✅正常 |
| 八字 | showSection('bazi') | section-bazi | ✅ | ✅ | ✅ | ✅正常 |
| 占卜 | showSection('zhanbu') | section-zhanbu | ✅ | ✅ | ✅ | ✅正常 |
| 风水 | showSection('fengshui') | section-fengshui | ✅ | ✅ | ✅ | ✅正常 |
| 言值 | showSection('yanzhi') | section-yanzhi | ✅ | ✅ | ✅ | ✅正常 |
| 姓名 | showSection('xingming') | section-xingming | ✅ | ✅ | ✅ | ✅正常 |
| 吉日 | showSection('jiuri') | section-jiuri | ✅ | ✅ | ✅ | ✅正常 |
| 更多 | toggleMore() | moreDropdown | ✅ | ✅ | ✅ | ✅正常 |

### 2.10 知识库卡片（37张）

| 菜单项 | 函数 | 数据源 | 函数定义 | 数据存在 | 状态 |
|--------|------|--------|---------|---------|------|
| 易经八卦 | showKnowledgeDetail('bagua') | kd-bagua(内联) + KNOWLEDGE_DETAILS | ✅ | ✅ | ✅正常 |
| 六十四卦 | showKnowledgeDetail('liushisigua') | kd-liushisigua(内联) + KNOWLEDGE_DETAILS | ✅ | ✅ | ✅正常 |
| 八字四柱 | showKnowledgeDetail('bazi') | kd-bazi(内联) + KNOWLEDGE_DETAILS | ✅ | ✅ | ✅正常 |
| 奇门遁甲 | showKnowledgeDetail('qimen') | kd-qimen(内联) + KNOWLEDGE_DETAILS | ✅ | ✅ | ✅正常 |
| 五行体系 | showKnowledgeDetail('wuxing') | kd-wuxing(内联) + KNOWLEDGE_DETAILS | ✅ | ✅ | ✅正常 |
| 风水堪舆 | showKnowledgeDetail('fengshui') | kd-fengshui(内联) + KNOWLEDGE_DETAILS | ✅ | ✅ | ✅正常 |
| 十神详解 | showKnowledgeDetail('shishen') | kd-shishen(内联) + KNOWLEDGE_DETAILS | ✅ | ✅ | ✅正常 |
| 纳音五行 | showKnowledgeDetail('nayin') | kd-nayin(内联) + KNOWLEDGE_DETAILS | ✅ | ✅ | ✅正常 |
| 神煞体系 | showKnowledgeDetail('shensha') | kd-shensha(内联) + KNOWLEDGE_DETAILS | ✅ | ✅ | ✅正常 |
| 合冲刑害 | showKnowledgeDetail('hechong') | kd-hechong(内联) + KNOWLEDGE_DETAILS | ✅ | ✅ | ✅正常 |
| 六爻基础 | showKnowledgeDetail('liuyao') | kd-liuyao(内联) + KNOWLEDGE_DETAILS | ✅ | ✅ | ✅正常 |
| 姓名学基础 | showKnowledgeDetail('xingming') | kd-xingming(内联) + KNOWLEDGE_DETAILS | ✅ | ✅ | ✅正常 |
| 十二生肖 | showKnowledgeDetail('shengxiao') | KNOWLEDGE_DETAILS['shengxiao'] | ✅ | ✅ | ✅正常 |
| 西方星座 | showKnowledgeDetail('constellation') | KNOWLEDGE_DETAILS['constellation'] | ✅ | ✅ | ✅正常 |
| 阳宅风水 | showKnowledgeDetail('yangzhai') | KNOWLEDGE_DETAILS['yangzhai'] | ✅ | ✅ | ✅正常 |
| 紫微斗数 | showKnowledgeDetail('ziwei') | KNOWLEDGE_DETAILS['ziwei'] | ✅ | ✅ | ✅正常 |
| 梅花易数 | showKnowledgeDetail('meihua') | KNOWLEDGE_DETAILS['meihua'] | ✅ | ✅ | ✅正常 |
| 大六壬 | showKnowledgeDetail('liuren') | KNOWLEDGE_DETAILS['daliuren'] (keyMap映射) | ✅ | ✅ | ✅正常 |
| 中医体质 | showKnowledgeDetail('tizhi') | KNOWLEDGE_DETAILS['tizhi'] | ✅ | ✅ | ✅正常 |
| 儒家 | showKnowledgeDetail('rujia') | KNOWLEDGE_DETAILS['rujia'] | ✅ | ✅ | ✅正常 |
| 道家 | showKnowledgeDetail('daojia') | KNOWLEDGE_DETAILS['daojia'] | ✅ | ✅ | ✅正常 |
| 佛家 | showKnowledgeDetail('fojia') | KNOWLEDGE_DETAILS['fojia'] | ✅ | ✅ | ✅正常 |
| 择吉 | showKnowledgeDetail('zeji') | KNOWLEDGE_DETAILS['zeji'] | ✅ | ✅ | ✅正常 |
| 好户型 | showKnowledgeDetail('huxing') | KNOWLEDGE_DETAILS['huxing'] | ✅ | ✅ | ✅正常 |
| 测字 | showKnowledgeDetail('cezi') | KNOWLEDGE_DETAILS['cezi'] | ✅ | ✅ | ✅正常 |
| 经典朗读 | showKnowledgeDetail('jingdian') | KNOWLEDGE_DETAILS['jingdian'] | ✅ | ✅ | ✅正常 |
| 梵音音乐 | showKnowledgeDetail('fanyin') | KNOWLEDGE_DETAILS['fanyin'] | ✅ | ✅ | ✅正常 |
| 每日口诀 | showKnowledgeDetail('meirikoujue') | KNOWLEDGE_DETAILS['meirikoujue'] | ✅ | ✅ | ✅正常 |
| 功德 | showKnowledgeDetail('gongde') | KNOWLEDGE_DETAILS['gongde'] | ✅ | ✅ | ✅正常 |
| 知识图谱 | showKnowledgeDetail('zhishitupu') | KNOWLEDGE_DETAILS['zhishitupu'] | ✅ | ✅ | ✅正常 |
| 养生调理 | showKnowledgeDetail('yangsheng') | KNOWLEDGE_DETAILS['yangsheng'] | ✅ | ✅ | ✅正常 |
| 道场导航 | showKnowledgeDetail('daochang') | KNOWLEDGE_DETAILS['daochang'] | ✅ | ✅ | ✅正常 |
| 甲子纳音 | showKnowledgeDetail('jiazinayin') | KNOWLEDGE_DETAILS['jiazinayin'] | ✅ | ✅ | ✅正常 |
| 节气 | showKnowledgeDetail('jieqi') | KNOWLEDGE_DETAILS['jieqi'] | ✅ | ✅ | ✅正常 |
| 周易 | showKnowledgeDetail('zhouyi') | KNOWLEDGE_DETAILS['zhouyi'] | ✅ | ✅ | ✅正常 |
| 言值 | showKnowledgeDetail('yanzhi') | KNOWLEDGE_DETAILS['yanzhi'] | ✅ | ✅ | ✅正常 |
| 命理宗师 | showMastersKB() | MASTERS_KNOWLEDGE | ✅ | ✅ | ✅正常 |

### 2.11 工具卡片 (tool-card)

| 菜单项 | 函数 | 目标ID | 函数定义 | 元素存在 | 有内容 | 状态 |
|--------|------|--------|---------|---------|--------|------|
| 六爻占卜 | showSection('zhanbu');showZhanbuSub('yijing') | zhanbuSub-yijing | ✅ | ✅ | ✅ | ✅正常 |
| 梅花易数 | showSection('zhanbu');showZhanbuSub('meihua') | zhanbuSub-meihua | ✅ | ✅ | ✅ | ✅正常 |
| 奇门遁甲 | showSection('zhanbu');showZhanbuSub('qimen') | zhanbuSub-qimen | ✅ | ✅ | ✅ | ✅正常 |
| 大六壬 | showSection('zhanbu');showZhanbuSub('liuren') | zhanbuSub-liuren | ✅ | ✅ | ✅ | ✅正常 |
| 阳宅户型 | showSection('fengshui');showFengshuiSub('fengshui-content') | fengshui-content | ✅ | ✅ | ✅ | ✅正常 |
| 姓名学 | showSection('xingming');showXingmingSub('rename') | xingmingSub-rename | ✅ | ✅ | ✅ | ✅正常 |
| 中医体质 | ~~showSection('tizhi')~~ → showSection('more');showMoreModule('tizhi') | morePanel-tizhi | ✅ | ✅ | ✅ | ✅已修复 |
| 紫微斗数 | showSection('zhanbu');showZhanbuSub('ziwei') | zhanbuSub-ziwei | ✅ | ✅ | ✅ | ✅正常 |
| 户型图展示 | showPlanGallery() | - | ✅ | ✅ | ✅ | ✅正常 |
| 电子罗盘 | showFengshuiSub('luopan-content') | luopan-content | ✅ | ✅ | ✅(JS懒加载) | ✅正常 |
| 风水理论 | toggleFengshuiTheory() | fs-theory-block | ✅ | ✅ | ✅ | ✅正常 |

---

## 三、H5页面 (wechat-hub.html) 检查结果

### 3.1 工具入口

| 菜单项 | 函数 | 跳转目标 | 函数定义 | 映射正确 | 状态 |
|--------|------|---------|---------|---------|------|
| 八字排盘 | openTool('bazi') | #section-bazi | ✅ | ✅ | ✅正常 |
| 手机号测算 | openTool('yanzhi') | ~~#section-yanzhi~~ → #section-xingming?sub=mobile | ✅ | ✅已修复 | ✅正常 |
| 姓名/公司取名 | openTool('xingming') | #section-xingming | ✅ | ✅ | ✅正常 |
| 阳宅户型 | openTool('fengshui') | #section-fengshui | ✅ | ✅ | ✅正常 |
| 六爻占卜 | openTool('zhanbu-yijing') | #section-zhanbu?sub=yijing | ✅ | ✅ | ✅正常 |
| 梅花易数 | openTool('zhanbu-meihua') | #section-zhanbu?sub=meihua | ✅ | ✅ | ✅正常 |
| 吉日查询 | openTool('jiuri') | #section-jiuri | ✅ | ✅ | ✅正常 |
| 黄历 | openTool('huangli') | #section-jiuri | ✅ | ✅ | ✅正常 |
| 测字 | openTool('cezi') | #section-cezi | ✅ | ✅ | ✅正常 |
| 奇门遁甲 | openTool('zhanbu-qimen') | #section-zhanbu?sub=qimen | ✅ | ✅ | ✅正常 |
| 紫微斗数 | openTool('zhanbu-ziwei') | #section-zhanbu?sub=ziwei | ✅ | ✅ | ✅正常 |
| 六壬神课 | openTool('zhanbu-liuren') | #section-zhanbu?sub=liuren | ✅ | ✅ | ✅正常 |

### 3.2 知识入口

| 菜单项 | 函数 | 跳转目标 | 函数定义 | 映射正确 | 状态 |
|--------|------|---------|---------|---------|------|
| 知识库 | openKnowledge('knowledge') | #section-more?sub=knowledge | ✅ | ✅ | ✅正常 |
| 口诀宝库 | openKnowledge('koujue') | #section-more?sub=koujue | ✅ | ✅ | ✅正常 |
| 智慧语录 | openKnowledge('quotes') | #section-more?sub=knowledge | ✅ | ✅ | ✅正常 |
| 经典朗读 | openKnowledge('scripture') | #section-more?sub=faith | ✅ | ✅ | ✅正常 |
| 梵音音乐 | openKnowledge('music') | #section-more?sub=faith | ✅ | ✅ | ✅正常 |

### 3.3 其他H5入口

| 菜单项 | 函数 | 函数定义 | 状态 |
|--------|------|---------|------|
| 签到 | doCheckin() | ✅ | ✅正常 |
| 信众日常 | openPractice('faith') | ✅ | ✅正常 |
| 功德修行 | openPractice('merit') | ✅ | ✅正常 |
| 指导中心 | openPractice('guide') | ✅ | ✅正常 |
| 体质自测 | openHealth('tizhi') | ✅ | ✅正常 |
| 食疗药膳 | openHealth('shiliao') | ✅ | ✅正常 |
| 功法锻炼 | openHealth('gongfa') | ✅ | ✅正常 |
| 节气养生 | openHealth('jieqi') | ✅ | ✅正常 |
| 名医名方 | openHealth('mingfang') | ✅ | ✅正常 |
| 时辰养生 | openHealth('shichen') | ✅ | ✅正常 |
| 商城入口 | openShop() | ✅ | ✅正常 |
| 底部Tab切换 | switchTab() | ✅ | ✅正常 |
| 开通会员 | showVipModal() | ✅ | ✅正常 |
| 历史记录 | showHistory() | ✅ | ✅正常 |
| 我的功德 | showMyMerit() | ✅ | ✅正常 |
| 意见反馈 | showFeedback() | ✅ | ✅正常 |
| 联系客服 | contactService() | ✅ | ✅正常 |
| 分享好友 | shareToFriend() | ✅ | ✅正常 |
| 年度预测 | openAnnualForecast() | ✅ | ✅正常 |

---

## 四、管理后台 (admin.html) 检查结果

| 菜单项 | data-section | 目标ID | 初始化函数 | 函数定义 | 状态 |
|--------|-------------|--------|-----------|---------|------|
| 运营大屏 | dashboard | section-dashboard | loadDashboard() | ✅ | ✅正常 |
| 用户管理 | users | section-users | loadUsers() | ✅ | ✅正常 |
| 建议反馈 | feedback | section-feedback | loadFeedbackAdmin() | ✅ | ✅正常 |
| 引擎测试台 | engine | section-engine | - | ✅ | ✅正常 |
| 知识库管理 | knowledge | section-knowledge | loadKnowledgeStats() | ✅ | ✅正常 |
| 信众指导中心 | guide | section-guide | loadGuideCenter() | ✅ | ✅正常 |
| 内容管理 | content | section-content | loadContent() | ✅ | ✅正常 |
| 数据统计 | stats | section-stats | loadStats() | ✅ | ✅正常 |
| 系统监控 | monitor | section-monitor | loadMonitor() | ✅ | ✅正常 |
| 公众号采集 | gzh | section-gzh | renderGzhPanel() | ✅ | ✅正常 |

---

## 五、发现的问题及修复

### 问题1：首页工具卡片「中医体质」点击无效

- **位置：** `divination-hub.html` 第 4003 行
- **问题：** `onclick="showSection('tizhi')"` — 不存在 `section-tizhi` 元素，点击无任何反应
- **原因：** 体质内容在 `morePanel-tizhi` 面板中，需先显示 more 区域再激活 tizhi 模块
- **修复：** 改为 `onclick="showSection('more');showMoreModule('tizhi')"`
- **状态：** ✅已修复

### 问题2：H5页面「手机号测算」跳转到错误的section

- **位置：** `wechat-hub.html` TOOL_CONFIG
- **问题：** `'yanzhi': { section:'yanzhi' }` — H5跳转到 `#section-yanzhi`（言值·沟通技巧），但用户期望的是「手机号测算」
- **原因：** `section-yanzhi` 是言值（沟通技巧），手机号分析在 `section-xingming` 的 `mobile` 子tab下
- **修复：** 改为 `'yanzhi': { section:'xingming', subTab:'mobile', type:'paid' }`
- **状态：** ✅已修复

---

## 六、总结

| 检查项 | 总数 | 正常 | 已修复 | 失效 |
|--------|------|------|--------|------|
| 顶部导航栏 | 8 | 8 | 0 | 0 |
| 更多下拉菜单 | 10 | 10 | 0 | 0 |
| 首页cat-card | 9 | 9 | 0 | 0 |
| 更多区域jinang-tab | 7 | 7 | 0 | 0 |
| 占卜子tab | 6 | 6 | 0 | 0 |
| 风水子tab | 2 | 2 | 0 | 0 |
| 姓名子tab | 3 | 3 | 0 | 0 |
| 名师子tab | 5 | 5 | 0 | 0 |
| 底部导航栏 | 8 | 8 | 0 | 0 |
| 知识库卡片 | 37 | 37 | 0 | 0 |
| 工具卡片 | 11 | 10 | 1 | 0 |
| H5工具入口 | 12 | 11 | 1 | 0 |
| H5知识入口 | 5 | 5 | 0 | 0 |
| H5其他入口 | 18 | 18 | 0 | 0 |
| 管理后台 | 10 | 10 | 0 | 0 |
| **合计** | **151** | **149** | **2** | **0** |

### 检查结论

- ✅ **149项正常** — 所有末级菜单函数定义存在、目标元素存在、有实际内容
- ✅ **2项已修复** — 发现2个问题并已直接修复
- ❌ **0项失效** — 无点不开、无内容、功能失效的菜单项

### 函数定义完整性

- 共扫描 555 处 `onclick` 事件
- 共检查 906 个函数定义（内联 + 外部JS）
- 所有被调用的函数均已定义，无未定义函数
- 外部JS文件正常加载（divination-core.js、guide-features.js、calc-engine-lib.js 等 46 个文件）

### 数据源完整性

- 12 个知识详情有内联 `kd-xxx` div
- 24 个知识详情通过 `window.KNOWLEDGE_DETAILS` 动态加载
- 所有 37 个知识卡片点击后均有内容展示

---

*报告生成时间：2026-06-30 09:30 CST*
