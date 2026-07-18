# 命理宝鉴 — 交付报告 (2026-07-18)

## 本轮交付物

### ✅ 一键Docker部署基建
- `docker-compose.yml` — 5服务编排 (web/api-proxy/paipan/tts/daily-push)
- `nginx.conf` — 反向代理路由（统一入口）
- `deploy.sh` — 一键启停脚本
- 4个 `Dockerfile.{api,paipan,tts,push}` 服务镜像
- `.env.example` — 环境变量模板
- `requirements.txt` — Python依赖
- `docs/DEPLOY.md` — 完整部署指南（Docker/本地/GitHub Pages/云服务器）
- `server/api-proxy-server.py` — AI API代理（支持环境变量+本地配置双模式）

### ✅ 前端API路径统一化
所有硬编码地址从 `127.0.0.1:89xx` 改为nginx相对路径：
- `/v1/chat/completions` → AI对话（6处）
- `/api/face-analyze` → 面相分析（1处）
- `/api/tts` → 语音合成（3处）

### ✅ 倪海厦知识库全量移植（43模块/15791行/100.3%覆盖）
- `knowledge/nihaisha-batch1.js` — 截图证据类（5个大文件，6858行）
- `knowledge/nihaisha-batch2.js` — 核心课程类（6个中大文件，3713行）
- `knowledge/nihaisha-batch3.js` — 课程+笔记类（14个中等文件，3101行）
- `knowledge/nihaisha-batch4.js` — 小文件类（18个，2331行）

数据来源：GitHub仓库 nihaisha-nishi-tcm 全部43个reference MD文件（15748行）
每个模块的 `rawContent` 字段包含源MD文件的**完整原文**

### ✅ P1问题修复（kb-audit-correction 子agent建议）
- 移动3个KB文件到 `app/knowledge/` 统一位置：
  - `nihaisha-tcm-kb.js` (3.0MB)
  - `shuhan-mixun-tianji.js` (146KB)
  - `kb-missing-sections.js` (135KB)
- 更新HTML引用路径（4个HTML文件）
- 删除临时脚本 `.generate-batch2.js`
- 删除自引用符号链接 `knowledge/knowledge`（用户授权后）

## 部署流程

```bash
git clone https://github.com/sgmt-taojing/mingli-baojian.git
cd mingli-baojian
cp .env.example .env
nano .env  # 填入G2CLAW_API_KEY
./deploy.sh start
```

## 访问地址

| 端 | URL |
|---|---|
| Web端 | http://localhost:8080/app/divination-hub.html |
| 移动端 | http://localhost:8080/app/wechat-hub.html |
| GitHub Pages | https://sgmt-taojing.github.io/mingli-baojian/app/divination-hub.html |

## 服务架构

| 服务 | 端口 | 说明 |
|---|---|---|
| web (nginx) | 8080 | 前端静态资源 + 反向代理 |
| api-proxy | 8900 | AI API代理 (g2claw) |
| paipan | 8911 | 排盘引擎 (八字/紫微/奇门等) |
| tts | 8912 | 语音合成 (Edge-TTS) |
| daily-push | - | 每日推送 (cron定时) |

## GitHub提交历史

```
ea07a5f refactor: 整合KB文件位置 + 清理临时脚本
bab1f58 feat: 倪海厦知识库全量移植完成 — 43模块/15791行/100.3%覆盖
8f36a95 feat: 一键Docker部署 — 完整部署基建
e5a191b feat: 全Tab场景化AI助手 — 7个角色入口全覆盖
5f150d5 fix(P0): ZODIAC_KB变量名不匹配
60a8897 feat: 移动端新增AI命理助手tab
d97ed41 feat: G2移动端语音交互模块
2d053ab refactor: 知识库统一前缀 window.NIHAISHA_TCM_KB
424e37c fix: 修复知识库模块名映射
414dc65 fix: 模块名映射更正
8e17a10 feat: G2语音交互模块
beb08b6 feat: 倪师+舒晗知识库大扩充
```

全部已推送到 main + gh-pages。CI自动部署到GitHub Pages。

## 验证结果

| 验证项 | 结果 |
|---|---|
| 4个batch JS语法 | ✅ 通过 |
| 43个模块行数对比 | ✅ 100.3%覆盖 |
| 3个KB文件JS语法 | ✅ 通过 |
| 前端JS文件语法 | ✅ 通过 |
| API代理Python语法 | ✅ 通过 |
| HTML引用路径 | ✅ 全部匹配 |

## 系统功能覆盖

### 7大排盘引擎
- 八字、紫微斗数、奇门遁甲、六爻、梅花易数、大六壬、风水

### 知识库系统
- 倪海厦：43模块全量移植（15791行）
- 舒晗：10模块 + 32课基础课程 + 9份补充资料
- 其他：八字/生肖/命理经典/中医养生/福祉/历代名医等

### AI助手系统
- 移动端AI tab：8个快速问题 + 4个声线 + 历史追踪
- 7-tab场景化AI卡片（每个tab底部独立AI入口）
- 角色化system prompt

### 语音交互系统
- Web端：浮动🎤按钮 + ASR/TTS/导航命令
- Mobile端：微信检测 + iframe postMessage + 语音日期解析

### 部署系统
- Docker一键部署
- nginx反向代理
- 一键启停脚本

## 后续可扩展方向

1. **HTML页面接入batch文件** — 让信众能在页面中浏览43个模块的全文内容
2. **云服务器部署** — 购买服务器+域名后 `./deploy.sh start` 即可上线
3. **HTTPS配置** — Caddy自动证书
4. **移动端独立PWA** — 离线使用
5. **小程序版本** — 基于已有的miniprogram目录继续开发