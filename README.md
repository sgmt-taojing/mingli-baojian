# 命理宝鉴 · AI命理服务智能体

> 知命改运 · 趋吉避凶 · 服务生活 · 养成好习惯

命理占卜平台，集成八字排盘、紫微斗数、奇门遁甲、六爻占卜、梅花易数、大六壬、风水分析等多种命理功能。

## ⏰ 持续推进机制（顶层架构）

**Agent 必读**：读取 `MECHANISM.md` 并按其走 4 角色 + 3 步闭环 + 1 总指挥。

| 路径 | 作用 |
|------|------|
| `MECHANISM.md` | **顶层机制**（必读） |
| `KANBAN.md` | 任务队列（进行中/待办/已完结） |
| `.openclaw/tmp/health-check.sh` | 健康检查脚本 |
| `.openclaw/tmp/watchdog.sh` | 失声检测脚本 |

## 你的手动指令

`推进 #X` / `看 KANBAN` / `插队 #X：描述` / `跳过 #X` / `加速` / `减速` / `暂停` / `恢复`

## 项目结构

```
mingli-baojian/
├── miniprogram/               # 微信小程序
│   ├── app.js                 # 小程序入口
│   ├── app.json               # 全局配置（6页面 + tabBar）
│   ├── app.wxss               # 全局样式（暗色+金色主题）
│   ├── sitemap.json
│   ├── utils/
│   │   └── api.js             # API 封装（登录/排盘/黄历/知识库/商城）
│   └── pages/
│       ├── index/             # 首页（功能入口网格 + 每日箴言）
│       ├── paipan/            # 排盘页（八字四柱 + 历史记录）
│       ├── almanac/           # 黄历页（干支/宜忌/方位/吉时/冲煞五行）
│       ├── knowledge/         # 知识库（八字/紫微/奇门/六爻/梅花/六壬/风水/周易）
│       ├── mine/              # 个人中心（登录/生辰信息/排盘历史/积分）
│       └── shop/              # 开运商城（分类浏览）
├── app/                       # H5 Web 端（20+ 页面）
│   ├── divination-hub.html    # 主应用（2.3MB，含全部命理功能）
│   ├── divination-almanac.html
│   ├── divination-knowledge.html
│   ├── divination-shop.html
│   └── ...
├── knowledge/                 # 命理知识库（65个JS文件）
│   ├── authoritative-knowledge-base.js  # 权威知识库（792KB）
│   ├── bazi-knowledge-base.js           # 八字
│   ├── ziwei-knowledge-base.js          # 紫微斗数
│   ├── qimen-knowledge-base.js          # 奇门遁甲
│   ├── liuren-knowledge-base.js         # 大六壬
│   ├── liuyao-knowledge-base.js         # 六爻
│   ├── meihua-knowledge-base.js         # 梅花易数
│   ├── fengshui-knowledge-base.js       # 风水
│   └── ...
├── server/                    # 服务端
│   ├── api-server.js          # Node.js API 服务（端口 8920）
│   ├── paipan.py              # 八字排盘引擎（Python, lunar_python）
│   ├── knowledge-server.py    # 知识库 HTTP 服务
│   ├── api-proxy-server.py    # AI API 代理（端口 8900）
│   ├── daily-recommendation.py
│   ├── security.js            # 安全中间件
│   └── database/              # SQLite 数据库
├── daily_push.js              # 每日推送系统
├── project.config.json        # 微信开发者工具配置
└── docs/                      # 开发文档
```

## 小程序功能

| 页面 | 功能 |
|------|------|
| 首页 | 功能入口网格、每日箴言、用户登录状态 |
| 排盘 | 八字四柱排盘（年柱/月柱/日柱/时柱）、藏干、十神、纳音、五行、神煞、大运、历史记录 |
| 黄历 | 公历农历、干支、宜忌、财神/喜神/福神方位、吉时凶时、生肖冲煞、五行、建除、星宿、值神 |
| 知识库 | 8大分类（八字/紫微/奇门/六爻/梅花/六壬/风水/周易）、搜索、热门推荐 |
| 个人中心 | 手机号登录、生辰信息管理、排盘历史、积分系统 |
| 商城 | 开运商品分类浏览（水晶/玉石/香品/法器/书籍） |

## 快速启动

### 小程序
1. 打开微信开发者工具
2. 导入项目，选择 `miniprogram/` 目录
3. AppID 填写你自己的小程序 AppID（或使用测试号）
4. 确保 `utils/api.js` 中的 `BASE_URL` 指向后端服务地址

### 后端服务
```bash
cd server
npm install node:sqlite express cors
node api-server.js    # 启动 API 服务（端口 8920）
python3 paipan.py 1990 5 15 14 30 --gender male    # 测试排盘引擎
```

### H5 Web 端
```bash
cd server
./qianyuan-server.sh start    # 启动静态文件服务（端口 8901）
# 访问 http://127.0.0.1:8901/app/divination-hub.html
```

## 技术栈

- **小程序前端**：微信小程序原生开发
- **H5 前端**：纯 HTML/CSS/JS，无框架依赖
- **后端 API**：Node.js + Express + SQLite
- **排盘引擎**：Python + lunar_python
- **知识库**：JS 数据文件，浏览器/小程序直接加载
- **AI 集成**：OpenAI 兼容接口（通过 api-proxy-server.py 代理）

## 设计风格

- 暗色主题：背景 `#1a1a2e`，卡片 `#16213e`
- 金色点缀：主色 `#e6c86e`
- 宜用绿色 `#4ade80`，忌用红色 `#f87171`
- 卡片式布局，圆角 16rpx

## 推送到 GitHub

```bash
# 方式一：HTTPS（需要 GitHub Personal Access Token）
git remote add origin https://github.com/<你的用户名>/mingli-baojian.git
git push -u origin main

# 方式二：SSH（需要配置 SSH Key）
git remote add origin git@github.com:<你的用户名>/mingli-baojian.git
git push -u origin main
```

## License

Copyright 2026 命理宝鉴. All rights reserved.
