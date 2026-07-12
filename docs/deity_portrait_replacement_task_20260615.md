# 乾元命理宝鉴 · 神仙本尊高清画像替换任务 - 进度报告

## 任务目标
为 `/Users/tom/.qclaw/workspace/faith-knowledge-base.js` 中 22 位神仙找到真正的本尊高清画像，替换当前有问题的 Wikimedia 占位图。

---

## 已完成工作

### 1. 更新了 `faith-knowledge-base.js`
- 将所有神仙的 `portrait` 和 `image` 字段从 Wikimedia URL 改为本地相对路径
- 新路径格式：`images/deities/{神仙拼音}.jpg`
- 文件已保存并经过语法检查

### 2. 本地路径映射表

| 神仙 | 本地路径 | 原 Wikimedia 问题 |
|------|---------|---------------|
| 释迦牟尼佛 | `images/deities/shijiamouni.jpg` | 雕塑照片，非传统画像 |
| 观世音菩萨 | `images/deities/guanyin.jpg` | 需要验证是否为传统画像 |
| 文殊菩萨 | `images/deities/wenshu.jpg` | 需要验证 |
| 普贤菩萨 | `images/deities/puxian.jpg` | 需要验证 |
| 地藏王菩萨 | `images/deities/dizang.jpg` | 需要验证 |
| 弥勒佛 | `images/deities/milefo.jpg` | **原图是唐代雕塑照片** |
| 韦陀菩萨 | `images/deities/weituo.jpg` | **原图是日本欢喜天（Kangiten）** |
| 药师佛 | `images/deities/yaoshi.jpg` | 需要验证 |
| 太上老君 | `images/deities/taishanglaojun.jpg` | **原图是漆器图（Zhang_Zuqian_Lacquer_Diagram）** |
| 玉皇大帝 | `images/deities/yuhuangdadi.jpg` | 需要验证 |
| 王母娘娘 | `images/deities/wangmuniangniang.jpg` | 需要验证 |
| 太乙救苦天尊 | `images/deities/taiyi.jpg` | 需要验证 |
| 真武大帝 | `images/deities/zhenwu.jpg` | 需要验证 |
| 关圣帝君 | `images/deities/guansheng.jpg` | **原图是现代照片（Guan_Yu_1998）** |
| 文昌帝君 | `images/deities/wenchang.jpg` | 需要验证 |
| 财神赵公明 | `images/deities/zhaogongming.jpg` | 需要验证 |
| 土地公 | `images/deities/tudigong.jpg` | 需要验证 |
| 月老 | `images/deities/yuelao.jpg` | 需要验证 |
| 东岳大帝 | `images/deities/dongyue.jpg` | 需要验证 |
| 八仙 | `images/deities/baxian.jpg` | 需要验证 |
| 至圣先师孔子 | `images/deities/kongzi.jpg` | 需要验证 |
| 亚圣孟子 | `images/deities/mengzi.jpg` | **原图是漫画风格（manga_illustration）** |

---

## 遇到的问题

### 无法访问 Wikimedia Commons
- **问题**：当前环境访问 Wikimedia Commons 和 Wikipedia API 持续超时
- **尝试方法**：
  1. `web_fetch` 工具 - 失败（fetch failed）
  2. `curl` 命令 - 失败（connection timeout after 30s）
  3. `browser` 工具 - 被 SSRF 策略阻止
  4. 百度搜索 - 搜索结果不返回真正的 Commons 文件页面

### 根本原因
可能是网络配置问题，百度可以正常访问（HTTP 200），但 Wikimedia 系列网站无法连接。

---

## 待完成工作

### 1. 下载神仙画像到本地
需要手动从 Wikimedia Commons 下载以下**中国传统画像**到 `/Users/tom/.qclaw/workspace/images/deities/`：

#### 优先级最高（原图完全错误）：
1. **韦陀菩萨** - 需要中国韦陀天将像（持降魔杵，甲胄武将），非日本 Kangiten
2. **太上老君** - 需要老子骑牛图或老子传统画像，非漆器图
3. **亚圣孟子** - 需要正式传统画像，非漫画
4. **弥勒佛** - 需要布袋和尚像或弥勒佛像，非雕塑照片
5. **关圣帝君** - 需要关公传统画像（读春秋或武像），非现代照片

#### 建议的 Wikimedia Commons 搜索关键词：
- 韦陀菩萨：`Skanda Chinese painting` 或 `韦陀菩萨 水陆画`
- 太上老君：`Laozi riding ox painting` 或 `老子骑牛图`
- 亚圣孟子：`Mencius portrait painting` 或 `孟子画像`
- 弥勒佛：`Maitreya Buddha Chinese painting` 或 `弥勒佛画像`
- 关圣帝君：`Guanyu painting` 或 `关公画像`

### 2. 验证现有图片
以下神仙的当前 Wikimedia 图片需要验证是否为真正的本尊传统画像：
- 释迦牟尼佛、观世音菩萨、文殊菩萨、普贤菩萨、地藏王菩萨、药师佛
- 玉皇大帝、王母娘娘、太乙救苦天尊、真武大帝、文昌帝君、财神赵公明、土地公、月老、东岳大帝、八仙
- 至圣先师孔子

---

## 建议下一步

1. **手动下载图片**：在能访问 Wikimedia Commons 的环境中，逐一搜索并下载各位神仙的中国传统画像
2. **验证图片质量**：确保图片为纵向半身/全身像，面部清晰，分辨率 400px 以上
3. **放置图片到正确路径**：将下载的图片放到 `/Users/tom/.qclaw/workspace/images/deities/` 目录
4. **验证 JS 文件**：运行 `node --check /Users/tom/.qclaw/workspace/faith-knowledge-base.js` 确认无语法错误

---

## 文件清单

- **已更新**：`/Users/tom/.qclaw/workspace/faith-knowledge-base.js`
- **待创建**：`/Users/tom/.qclaw/workspace/images/deities/` 目录中的 22 个图片文件
