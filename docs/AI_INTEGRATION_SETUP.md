# AI 真模型接入指南

## 当前状态
- 后端已完整写好 GLM 调用逻辑（proxy → g2claw.com/v1/chat/completions）
- 当前 `.env` 里 `G2CLAW_API_KEY=***` 是脱敏占位符
- 系统自动 fallback `_local: true`（离线命理助手，非真实 AI）

## 解锁真模型（2 分钟）

1. 打开 https://g2claw.com 注册获取 API Key
2. 填入 `.env`：
   ```bash
   G2CLAW_API_KEY=sk-xxxx（你的真实 key）
   ```
3. 重启：
   ```bash
   pkill -f "node server/api-server-v2.js"
   node server/api-server-v2.js
   ```

## 验证
```bash
curl -s http://127.0.0.1:8920/api/ai/public-chat \
  -X POST -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"你好"}]}'
# 预期：_local: false（真 GLM 回复）
```

## 文件清单
- `server/api-server-v2.js` — AI 调用逻辑
- `.env` — 配置（git ignore）
- `docs/DEPLOY.md` — 部署文档

## 备注
ZAI_API_KEY 是其他服务（智谱）的，不能替代 G2CLAW_API_KEY。
