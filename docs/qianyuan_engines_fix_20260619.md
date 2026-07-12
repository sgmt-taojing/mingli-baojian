# 乾元命理宝鉴 · 推演引擎交互补全 2026-06-19

## 问题诊断

**8套引擎函数已定义**，但4个推演区域（紫微/奇门/梅花/六壬）缺少交互入口：
- section-ziwei、section-qimen、section-meihua、section-liuren 只有标题描述
- 无输入框、无按钮、无结果容器
- 引擎函数存在但无法触发

## 修复内容

### 1. 补全4个区域的HTML结构

**奇门遁甲**（line 7664）：
- 输入：年/月/日/时/局（5个字段）
- 按钮：`排 盘 演 局` → `runQimen()`
- 结果容器：`#qimenResult`

**紫微斗数**（line 7685）：
- 输入：年/月/日/时/性别（5个字段）
- 按钮：`排 盘 演 命` → `runZiwei()`
- 结果容器：`#ziweiResult`

**梅花易数**（line 7706）：
- 输入：起卦方式/上卦数/下卦数/动爻（4个字段）
- 按钮：`起 卦 演 易` → `runMeihua()`
- 结果容器：`#meihuaResult`

**大六壬**（line 7726）：
- 输入：年/月/日/时（4个字段）
- 按钮：`排 盘 演 三 传` → `runLiuren()`
- 结果容器：`#liurenResult`

### 2. 添加wrapper调用函数（line 25461+）

```javascript
function runQimen()   // 从 #qimen-year 等取值，调用 qimenPaiPan()
function runZiwei()   // 从 #ziwei-year 等取值，调用 ziweiPaiPan()
function runMeihua()  // 从 #meihua-method 等取值，调用 meihuaQiGua()
function runLiuren()  // 从 #liuren-year 等取值，调用 liurenPaiPan()
```

### 3. 占卜区原有交互确认

**六爻**（section-zhanbu）：
- 人盘/事盘切换
- 掷金钱起卦（6次点击）
- `runLiuyaoEngine()` 调用引擎

**梅花/奇门/六壬/紫微子模块**：
- 已有 `runXxxEngine()` 按钮在占卜区子导航内
- 新增独立section作为备用入口

## 验证结果

- 花括号平衡：4326/4326 ✅
- 4个wrapper函数已定义 ✅
- HTTP服务重启，200 OK ✅
- 文件大小：1659782 字节（+15KB）

## 当前功能状态

**已完整可用：**
- 八字排盘（人生解读/流年/化解）
- 64卦解读
- 改名/公司取名/手机号吉凶
- 吉日查询
- 口诀库（226条）
- 十二生肖
- 言值沟通

**新增可测试：**
- 六爻起卦（占卜区+引擎双入口）
- 紫微斗数排盘
- 奇门遁甲排盘
- 梅花易数起卦
- 大六壬起课
- 姓名学分析
- 风水分析
- 择日计算

## 待验证

用户需在浏览器中测试8套引擎的完整交互流程（输入→点击→结果展示）。
