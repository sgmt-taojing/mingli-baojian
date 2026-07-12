# 命盘逐月化解功能增强记录

## 需求
用户要求命盘报告能具体到月做分析，并给出化解之法。

## 实现方案

### 一、每月风险提示
根据月支与日主、喜用神的关系判断风险等级：

| 条件 | 风险等级 | 说明 |
|------|----------|------|
| 月支冲日支 | 凶 | 变动大，防口舌是非 |
| 月支害日支 | 小凶 | 小人暗箭，需谨慎 |
| 月令克喜用神 | 小凶 | 诸事不顺，宜守不宜攻 |
| 月令助喜用神 | 吉 | 贵人运旺，可积极进取 |
| 其他 | 平 | 运势平稳 |

### 二、针对性化解之法

#### 冲煞/害煞化解
- 佩戴喜用神属性水晶（木:绿幽灵/火:红玛瑙/土:黄玉/金:白水晶/水:黑曜石）
- 多往吉方活动
- 避免重大决策或签约
- 家中吉方摆放对应五行物品

#### 克喜用神化解
- 多穿喜用神颜色衣物
- 饮食多摄入对应五行食物
- 佩戴喜用神属性开运物
- 宜静不宜动，多读书学习

#### 助喜用神月份
- 把握机会积极进取
- 多与贵人来往拓展人脉
- 适合重要决策或签约

### 三、吉凶日提示
- **吉日**：初一、十五、节气日
- **凶日**：冲害月份提示初五、十四、廿三慎出行

## 代码修改

### 函数增强
`renderLiuYueModule()` 新增：
- `zhiChong`/`zhiHai` 地支冲害映射表
- `chongDay`/`haiDay`/`harmXiEle`/`helpXiEle` 判断变量
- `riskLevel`/`riskText` 风险等级和提示
- `huajieAdvice` 针对性化解建议
- `jiriList`/`xiongriHint` 吉凶日提示

### CSS新增
```css
.liu-yue-card.luck-month { border-color: rgba(39,174,96,.3); }
.liu-yue-card.risk-month { border-color: rgba(231,76,60,.3); }
.lyc-risk-box { border-left: 2px solid rgba(231,76,60,.4); }
.lyc-huajie-box { border-left: 2px solid rgba(39,174,96,.4); }
.lyc-jiri-box { border-left: 2px solid rgba(201,168,76,.4); }
```

## 验证结果
- ✅ 语法检查：4个script block全部通过
- ✅ 逻辑完整：冲害判断、化解建议、吉凶日提示全部实现

## 修改文件
- `/Users/tom/.qclaw/workspace/divination-hub.html`
