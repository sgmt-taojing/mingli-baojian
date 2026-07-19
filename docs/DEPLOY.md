# 命理宝鉴 · 生产部署指南 v2

## 快速开始

### 1. 环境准备

```bash
# 克隆代码
git clone https://github.com/sgmt-taojing/mingli-baojian.git
cd mingli-baojian

# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，填写以下必需项：
# MINGLI_ENCRYPT_KEY  — 至少32字符的加密密钥（openssl rand -hex 32）
# MINGLI_JWT_SECRET   — 至少32字符的JWT密钥（openssl rand -hex 32）
# G2CLAW_API_KEY      — AI API密钥
```

### 2. Docker部署（推荐）

```bash
# 一键启动全部服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f api-server
```

服务端口：
| 服务 | 端口 | 说明 |
|------|------|------|
| Web前端 | 8080 | Nginx静态服务 |
| API服务 | 8920 | Node.js后端API |
| 排盘服务 | 8911 | Python排盘 |
| TTS语音 | 8912 | Python TTS |

### 3. 本地开发

```bash
# 安装Node.js依赖
npm install

# 初始化数据库
node -e "const {DatabaseSync}=require('node:sqlite');const db=new DatabaseSync('server/database/yidao.db');db.exec(require('fs').readFileSync('server/database/init-schema.sql','utf8'));db.close();"

# 启动后端API
MINGLI_ENCRYPT_KEY=your_key MINGLI_JWT_SECRET=your_secret node server/api-server-v2.js

# 启动前端（另一个终端）
python3 -m http.server 8900
```

## 安全配置

### 必需的环境变量

| 变量名 | 说明 | 示例 |
|--------|------|------|
| MINGLI_ENCRYPT_KEY | AES-256加密密钥 | openssl rand -hex 32 |
| MINGLI_JWT_SECRET | JWT签名密钥 | openssl rand -hex 32 |
| G2CLAW_API_KEY | AI API密钥 | 从g2claw.com获取 |
| CORS_ORIGINS | 允许的前端域名 | https://your-domain.com |

### 安全检查清单

- [ ] API密钥不在前端代码中（已通过后端代理解决）
- [ ] AES加密使用GCM模式+随机IV（已升级）
- [ ] CORS配置为白名单（已限制）
- [ ] JWT有效期24小时（已缩短）
- [ ] /api/push/log需要认证（已修复）
- [ ] /api/merchant/apply有速率限制（已修复）
- [ ] 超管手机号不在前端（已移除）
- [ ] localStorage加密存储（已实现）
- [ ] HTTPS配置（需在Nginx层配置SSL证书）

### Nginx SSL配置示例

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    # 前端静态文件
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }
    
    # API代理
    location /api/ {
        proxy_pass http://api-server:8920;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # KB文件鉴权
    location /knowledge/ {
        auth_request /api/kb/auth;
        root /usr/share/nginx/html;
    }
}
```

## 架构概览

```
┌─────────────────────────────────────────┐
│           用户浏览器 / 微信              │
│  ┌──────────┐  ┌──────────┐            │
│  │ 前端页面  │  │ 登录页面  │            │
│  │ (8900)   │  │ login.html│            │
│  └─────┬────┘  └─────┬────┘            │
│        │              │                  │
│  ┌─────┴──────────────┴──────────┐     │
│  │  secure-storage.js (加密存储)  │     │
│  │  rbac-client.js (权限控制)     │     │
│  └─────────────┬─────────────────┘     │
└────────────────┼───────────────────────┘
                 │ HTTPS
┌────────────────┼───────────────────────┐
│        Nginx反向代理                   │
│  ┌─────┴─────┐                         │
│  │ /api/ →   │                         │
│  │ api-server│                         │
│  └─────┬─────┘                         │
└────────┼────────────────────────────────┘
         │
┌────────┼────────────────────────────────┐
│  API Server v2 (Node.js:8920)          │
│  ┌─────┴─────────────────────────┐     │
│  │  Express + RBAC + JWT         │     │
│  ├───────────────────────────────┤     │
│  │  auth/adminAuth中间件          │     │
│  │  requirePermission()           │     │
│  │  filterZhouyiTerms()           │     │
│  ├───────────────────────────────┤     │
│  │  路由:                         │     │
│  │  /api/user/*    用户认证       │     │
│  │  /api/ai/chat   AI代理         │     │
│  │  /api/kb/*      KB分级访问     │     │
│  │  /api/clinic/*  诊疗服务       │     │
│  │  /api/distill/* 知识蒸馏       │     │
│  │  /api/admin/*   管理接口       │     │
│  ├───────────────────────────────┤     │
│  │  SQLite (yidao.db)            │     │
│  │  21个表 + 索引                 │     │
│  └───────────────────────────────┘     │
└─────────────────────────────────────────┘
```

## 双平台权限体系

### 平台A · 国学体系（会员等级制）
| 角色 | 权限 |
|------|------|
| guest | 访客，仅看公开内容 |
| free | 注册用户，基础排盘+公开KB |
| mingdao | 明道会员，进阶排盘+会员KB |
| advanced | 精进会员，高级排盘+精进KB |
| vip | VIP终身会员，全部平台A功能 |
| admin_a | 平台A管理员 |

### 平台B · 诊疗体系（角色制）
| 角色 | 权限 |
|------|------|
| patient | 病患：提交症状、查看报告 |
| master | 大师：查看病例、提交周易分析 |
| doctor | 医生：诊疗方案、推送报告、协作讨论 |
| admin_b | 平台B管理员：蒸馏审核+案例管理 |
| super_admin | 超级管理员：全部权限 |

## 故障排查

### 后端无法启动
```bash
# 检查环境变量
echo $MINGLI_ENCRYPT_KEY
echo $MINGLI_JWT_SECRET

# 检查端口占用
lsof -i :8920

# 查看日志
docker-compose logs api-server
```

### 数据库问题
```bash
# 重新初始化数据库
rm server/database/yidao.db
node -e "const {DatabaseSync}=require('node:sqlite');const db=new DatabaseSync('server/database/yidao.db');db.exec(require('fs').readFileSync('server/database/init-schema.sql','utf8'));db.close();"
```

### CORS错误
检查 `.env` 中的 `CORS_ORIGINS` 是否包含前端域名。

## 备份

```bash
# 备份数据库
cp server/database/yidao.db server/database/yidao.db.bak.$(date +%Y%m%d)

# 备份大师案例（加密存储，可直接备份）
docker-compose exec api-server node -e "
const {DatabaseSync}=require('node:sqlite');
const db=new DatabaseSync('server/database/yidao.db');
const cases=db.prepare('SELECT * FROM master_cases').all();
console.log(JSON.stringify(cases));
" > backup_cases_$(date +%Y%m%d).json
```
