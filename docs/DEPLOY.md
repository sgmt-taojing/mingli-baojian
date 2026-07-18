# 命理宝鉴 — 部署指南

## 一键Docker部署

### 前置要求
- Docker 20+
- Docker Compose 2+

### 步骤

```bash
# 1. 克隆仓库
git clone https://github.com/sgmt-taojing/mingli-baojian.git
cd mingli-baojian

# 2. 配置环境变量
cp .env.example .env
nano .env  # 填入G2CLAW_API_KEY

# 3. 一键启动
./deploy.sh start

# 4. 访问
# Web端: http://localhost:8080/app/divination-hub.html
# 移动端: http://localhost:8080/app/wechat-hub.html
```

### 服务架构

| 服务 | 端口 | 说明 |
|------|------|------|
| web (nginx) | 8080 | 前端静态资源 + 反向代理 |
| api-proxy | 8900 | AI API代理 (g2claw) |
| paipan | 8911 | 排盘引擎 (八字/紫微/奇门等) |
| tts | 8912 | 语音合成 (Edge-TTS) |
| daily-push | - | 每日推送 (cron定时) |

### Nginx代理路由

| 前端路径 | 转发到 | 说明 |
|----------|--------|------|
| `/v1/*` | api-proxy:8900 | AI对话API |
| `/api/paipan/*` | paipan:8911 | 排盘API |
| `/api/tts` | tts:8912 | 语音合成 |
| `/app/*` | 静态文件 | 前端页面 |
| `/knowledge/*` | 静态文件 | 知识库JS |

### 管理命令

```bash
./deploy.sh start    # 构建并启动
./deploy.sh stop     # 停止
./deploy.sh restart  # 重启
./deploy.sh status   # 状态
./deploy.sh logs web # 查看日志
```

## 本地开发模式（无需Docker）

### 启动后端服务

```bash
# 终端1: AI API代理
cd server && python3 api-proxy-server.py

# 终端2: 排盘服务
cd server && python3 paipan-server.py

# 终端3: TTS服务
cd server && python3 tts-server.py
```

### 启动前端

```bash
# 方式1: Python简单HTTP服务
cd app && python3 -m http.server 8080

# 方式2: Node.js
npx serve app -p 8080
```

访问: http://localhost:8080/divination-hub.html

## GitHub Pages部署

前端静态页面已自动部署到GitHub Pages:
- https://sgmt-taojing.github.io/mingli-baojian/app/divination-hub.html

注意: GitHub Pages仅部署前端，后端服务需另行部署。
AI对话功能在GitHub Pages模式下直连g2claw API。

## 云服务器部署

### 最低配置
- 1核 CPU
- 1GB 内存
- 20GB 磁盘
- Ubuntu 22.04 / CentOS 8+

### 部署步骤

```bash
# 1. 安装Docker
curl -fsSL https://get.docker.com | sh

# 2. 克隆仓库
git clone https://github.com/sgmt-taojing/mingli-baojian.git
cd mingli-baojian

# 3. 配置
cp .env.example .env
# 编辑.env填入API密钥

# 4. 启动
./deploy.sh start

# 5. 配置HTTPS (推荐)
# 使用Caddy或Nginx + Let's Encrypt
```

### HTTPS配置（可选）

```bash
# 安装Caddy
apt install caddy

# 配置 /etc/caddy/Caddyfile
your-domain.com {
    reverse_proxy localhost:8080
}

# 重启Caddy
systemctl restart caddy
```

## 故障排查

| 问题 | 解决方案 |
|------|----------|
| AI对话不响应 | 检查.env中G2CLAW_API_KEY |
| 排盘失败 | 检查paipan容器: `docker logs mingli-paipan` |
| 语音不工作 | 检查tts容器: `docker logs mingli-tts` |
| 页面空白 | 检查nginx: `docker logs mingli-web` |
| 跨域错误 | nginx已配置CORS，检查代理路径 |
