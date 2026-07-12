# 易道智鉴 · 早晚推送 Cron 配置

## 推送时间
- **早6:00**: 推送当天运势+黄历+智慧+化解
- **晚18:00**: 推送次日内容+重大节日提前提醒

## 推送渠道
- openclaw-weixin
- target: `o9cq806By5E5wR-Z-C1Yp3YaUNn8@im.wechat`

## Cron 任务配置

### 任务1: 早6点推送 (当天)
```json
{
  "name": "mingli-morning-push",
  "scheduleMode": "cron",
  "cron": "0 6 * * *",
  "timezone": "Asia/Shanghai",
  "executionMode": "agent_task",
  "content": "执行命令: cd /Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian && node daily_push.js im\n将输出结果通过 message 工具发送到 openclaw-weixin 频道，target 为 o9cq806By5E5wR-Z-C1Yp3YaUNn8@im.wechat。\n这是每天早上6点的自动推送，内容包含当天运势、黄历宜忌、智慧语录、化解建议。",
  "channel": "openclaw-weixin",
  "to": "o9cq806By5E5wR-Z-C1Yp3YaUNn8@im.wechat"
}
```

### 任务2: 晚6点推送 (次日)
```json
{
  "name": "mingli-evening-push",
  "scheduleMode": "cron",
  "cron": "0 18 * * *",
  "timezone": "Asia/Shanghai",
  "executionMode": "agent_task",
  "content": "执行命令: cd /Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian && node daily_push.js tomorrow\n将输出结果通过 message 工具发送到 openclaw-weixin 频道，target 为 o9cq806By5E5wR-Z-C1Yp3YaUNn8@im.wechat。\n这是每天晚上6点的自动推送，内容包含明日运势、黄历宜忌、智慧语录、化解建议。如果明天是重大节日，会包含提前提醒。",
  "channel": "openclaw-weixin",
  "to": "o9cq806By5E5wR-Z-C1Yp3YaUNn8@im.wechat"
}
```

## 设置方式

在主会话中执行以下命令创建 cron 任务:

1. 早6点推送:
```
im_remind:
  action: add
  name: mingli-morning-push
  scheduleMode: cron
  cron: "0 6 * * *"
  timezone: Asia/Shanghai
  executionMode: agent_task
  content: "执行命令 cd /Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian && node daily_push.js im，将输出结果发送到微信用户 o9cq806By5E5wR-Z-C1Yp3YaUNn8@im.wechat"
```

2. 晚6点推送:
```
im_remind:
  action: add
  name: mingli-evening-push
  scheduleMode: cron
  cron: "0 18 * * *"
  timezone: Asia/Shanghai
  executionMode: agent_task
  content: "执行命令 cd /Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian && node daily_push.js tomorrow，将输出结果发送到微信用户 o9cq806By5E5wR-Z-C1Yp3YaUNn8@im.wechat"
```

注意: im_remind 需要在微信会话中执行。如果当前不在微信会话中，请在微信中发送指令或使用 openclaw cron 命令手动配置。
