# 乾元命理宝鉴

命理占卜平台，集成八字排盘、紫微斗数、奇门遁甲、梅花易数、大六壬、风水分析等多种命理功能。

## 目录结构

```
mingli-baojian/
├── app/                    # 主应用 HTML 文件
│   ├── divination-hub.html     # 主应用 (2.1MB，含全部命理功能)
│   ├── divination-knowledge.html # 知识库页面
│   ├── divination-shop.html    # 商城页面
│   ├── divination-almanac.html # 黄历
│   ├── divination-membership.html # 会员页面
│   ├── knowledge/ -> ../knowledge/  # 符号链接到知识库目录
│   └── ... 其他页面
├── knowledge/              # 知识库 JS 文件 (65个)
│   ├── authoritative-knowledge-base.js  # 权威知识库主文件 (792KB)
│   ├── bazi-knowledge-base.js            # 八字
│   ├── ziwei-knowledge-base.js           # 紫微斗数
│   ├── qimen-knowledge-base.js           # 奇门遁甲
│   ├── liuren-knowledge-base.js          # 大六壬
│   ├── liuyao-knowledge-base.js          # 六爻
│   ├── meihua-knowledge-base.js          # 梅花易数
│   ├── fengshui-knowledge-base.js        # 风水
│   ├── zhouyi-knowledge-base.js          # 周易
│   └── ... 其他知识库
├── server/                 # 服务端
│   ├── knowledge-server.py     # 知识库 HTTP 服务
│   ├── api-proxy-server.py     # AI API 代理 (端口 8900)
│   ├── daily-recommendation.py # 每日推荐
│   ├── qianyuan-server.sh      # 静态文件服务管理 (端口 8901)
│   └── start-knowledge-server.sh
├── heige/                  # HeiGe 算命系统 (Python)
├── docs/                   # 开发文档和巡检记录
└── .gitignore
```

## 快速启动

1. 启动静态文件服务：
   ```bash
   cd server && ./qianyuan-server.sh start
   ```
   访问 http://127.0.0.1:8901/app/divination-hub.html

2. 启动 AI API 代理（可选，用于智能解读）：
   ```bash
   cd server && python3 api-proxy-server.py
   ```
   代理服务运行在端口 8900，需要 openclaw.json 配置。

## 技术栈

- 前端：纯 HTML/CSS/JS，无外部框架依赖
- 知识库：JS 数据文件，浏览器直接加载
- 服务端：Python http.server + API 代理
- AI 集成：OpenAI 兼容接口（通过 api-proxy-server.py 代理）

## 迁移记录

- 2026-06-23: 从 ~/.qclaw/workspace/ 迁移至本目录
- 路径已全部更新，符号链接 app/knowledge -> ../knowledge/ 确保引用正确
