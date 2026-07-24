# 命理宝鉴 · 智能眼镜接入方案

> 2026-07-24 · Rokid 及其他 AR 眼镜通用接入

## 一、接入目标

眼镜到货后直接测试，实现：
1. **语音对话**：说一句话 → 语音识别 → KB/AI 回答 → TTS 朗读
2. **排盘播报**：语音报八字 → 自动排盘 → 语音播报结果
3. **知识查询**：语音提问 → KB 直答 → 语音播报
4. **推送通知**：晨推/暮推/节气推送 → 眼镜端弹窗
5. **AR 投屏**：命理报告/命盘/时间轴 → 眼镜投屏显示

## 二、现有接口审计

| 功能 | 端点 | 方法 | 状态 | 眼镜适配 |
|------|------|------|------|---------|
| AI 对话 | `/api/ai/public-chat` | POST | ✅ | 语音输入 → 文字回复 → TTS |
| KB 搜索 | `/api/public/kb-search` | GET | ✅ | 语音关键词 → KB 直答 |
| KB 查询 | `/api/public/kb-query` | GET | ✅ | 按模块查询 |
| KB 统计 | `/api/public/kb-stats` | GET | ✅ | 眼镜显示总条数 |
| 排盘 | `http://127.0.0.1:8911/paipan` | POST | ✅ | 语音报八字 → 排盘 |
| 排盘健康 | `http://127.0.0.1:8911/health` | GET | ✅ | — |
| TTS 朗读 | `http://127.0.0.1:8912` | POST | ✅ | 文字 → 语音输出 |
| 静态页面 | `http://127.0.0.1:8914/` | GET | ✅ | 眼镜浏览器加载 |
| API 网关 | `http://127.0.0.1:8920` | — | ✅ | 统一入口 |
| 语音识别(ASR) | **缺失** | — | ❌ | 需新增 |
| 语音闭环对话 | **缺失** | — | ❌ | 需新增 |
| 眼镜推送通知 | **缺失** | — | ❌ | 需新增（Rokid SDK） |

## 三、需新增接口

### 3.1 语音识别（ASR）
```
POST /api/voice/asr
Content-Type: multipart/form-data

请求：音频文件（wav/mp3/m4a）
响应：{ "text": "识别文字", "confidence": 0.95 }
```

实现方案（按优先级）：
1. 讯飞语音识别 API（中文最准，免费额度够用）
2. Whisper API（OpenAI，多语言但中文略逊）
3. 本端 Whisper.cpp（离线，需 GPU）

### 3.2 语音闭环对话
```
POST /api/voice/dialog
Content-Type: application/json

请求：{ "audio": "base64编码音频", "context": "可选上下文" }
响应：{
  "text": "AI 回复文字",
  "audio": "base64编码TTS音频",
  "source": "kb|ai",
  "kbHit": true
}
```

流程：ASR → KB 优先匹配 → AI 兜底 → TTS 朗读 → 返回

### 3.3 眼镜推送通知
```
POST /api/glass/notify
Content-Type: application/json

请求：{
  "deviceId": "rokid-xxx",
  "title": "晨推",
  "content": "今日宜忌...",
  "type": "daily|festival|alert"
}
```

Rokid SDK 对接：
- Rokid OpenDay SDK（Android-based）
- 或 Rokid Webhook（HTTP 推送）
- 通用方案：WebSocket 长连接 + JSON 消息

## 四、通用眼镜适配（不绑死 Rokid）

设计原则：**HTTP + WebSocket 标准协议**，任何眼镜都能接入。

### 4.1 通用眼镜协议
```javascript
// 眼镜端 → 服务端
{ "type": "voice", "audio": "base64..." }    // 语音输入
{ "type": "query", "text": "今天运势如何" }   // 文字查询
{ "type": "subscribe", "channel": "daily" }  // 订阅推送

// 服务端 → 眼镜端
{ "type": "answer", "text": "...", "audio": "base64..." }
{ "type": "notify", "title": "...", "content": "..." }
{ "type": "display", "url": "http://..." }    // 投屏 URL
```

### 4.2 支持的眼镜品牌
| 品牌 | 型号 | 适配方式 | 优先级 |
|------|------|---------|--------|
| Rokid | Max Pro / Air | Android SDK / WebRTC | P0（用户已购） |
| XREAL | Air 2 Ultra | Nebula OS / Web | P1 |
| INMO | Air2 / Go | Android SDK | P2 |
| 雷鸟 | X2 | Android SDK | P2 |
| Meta | Ray-Ban | WhatsApp API | P3 |

## 五、测试计划

### 到货当日测试清单
1. [ ] 眼镜连 WiFi → 访问 `http://192.168.1.222:8914/` → 页面加载
2. [ ] 眼镜浏览器 → 打开 AI 助手页面 → 输入文字 → 收到回复
3. [ ] 语音输入测试（需 ASR 端点就绪）
4. [ ] TTS 朗读测试 → 眼镜扬声器播放
5. [ ] 排盘页面 → AR 投屏 → 命盘显示
6. [ ] 推送通知测试 → 眼镜弹窗

### 性能基线
- 语音闭环延迟（说一句话到听到回答）：< 3s
- 页面加载（divination-hub 1.8MB）：< 5s（需做移动端精简版）
- KB 直答延迟：< 1.5s
- 排盘计算延迟：< 0.5s

## 六、待开发项

- [ ] `/api/voice/asr` 端点（讯飞/Whisper）
- [ ] `/api/voice/dialog` 端点（ASR+KB+AI+TTS 闭环）
- [ ] `/api/glass/notify` 端点（推送通知）
- [ ] WebSocket 长连接（实时对话）
- [ ] 移动端精简版页面（< 500KB，眼镜加载快）
- [ ] Rokid SDK 集成文档
- [ ] 离线模式（眼镜端缓存 KB 摘要）

## 七、安全考虑

- 语音数据不上传第三方（除非用户授权）
- 眼镜端 token 鉴权（与现有 JWT 体系兼容）
- 推送频率限制（避免打扰）
- 隐私模式（关闭语音上传，仅文字交互）
