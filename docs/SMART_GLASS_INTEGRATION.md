# 命理宝鉴 · 智能眼镜接入方案

> 2026-07-25 · R11-W 更新 · Rokid 及其他 AR 眼镜通用接入
> 关联文档：`docs/WEARABLE_XIANZHI_PLAN.md`（先知智镜落地总规划）

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

### 3.2 语音闭环对话
```
POST /api/voice/dialog
Content-Type: multipart/form-data

请求：音频文件（wav/mp3/m4a）
响应：音频流（TTS 合成的回答语音）
```

### 3.3 眼镜推送通知
```
POST /api/glass/notify
Content-Type: application/json

请求：{ "title": "节气提醒", "body": "今日大暑...", "priority": "normal" }
响应：{ "success": true }
```

## 四、眼镜品牌适配

| 品牌 | 型号 | SDK/接入方式 | 优先级 |
|------|------|---------|--------|
| Rokid | Max Pro / Air | Android SDK / WebRTC | P0（用户已购） |
| XREAL | Air 2 Ultra | Nebula OS / Web | P1 |
| INMO | Air2 / Go | Android SDK | P2 |
| 雷鸟 | X2 | Android SDK | P2 |
| Meta | Ray-Ban | WhatsApp API | P3 |
| 小米 | 米家眼镜 | Android SDK | P1 |
| 华为 | Eyewear II | HarmonyOS | P3 |
| Apple | Vision Pro | visionOS SDK | P3 |

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

---

## 八、先知智镜中医专属能力（R11-W 增强）

> 2026-07-25 新增 · 基于「路总先知智镜」产品文档
> 完整规划见 `docs/WEARABLE_XIANZHI_PLAN.md`

### 8.1 中医四诊 AI 引擎

先知智镜区别于普通 AR 眼镜的核心在于内置中医辅助诊断能力：

| 诊法 | SDK 模块 | 识别项 | 摄像头依赖 |
|------|---------|--------|-----------|
| **舌诊** | `rokid-camera` (tongue) | **28 种舌象**：舌质(淡红/淡白/红/绛/紫/青紫/瘀斑) + 舌形(胖大/瘦薄/齿痕/裂纹/芒刺) + 舌态(歪斜/颤动/吐弄) + 舌苔(薄白/白厚/薄黄/黄厚/灰黑/无苔/花剥/镜面) + 舌下络脉 | 微距 48MP (5-15cm) |
| **面诊** | `rokid-camera` (face) | **36 维度指标**：五色(青赤黄白黑→肝心脾肺肾) + 五部(额鼻左右颊颌→心脾肝肺肾) + 五志(怒喜思悲恐) + 面部形态(7项) + 光泽(4级) + 特殊征象(10项) | 主摄 + ToF |
| **目诊** | `rokid-camera` (eye) | 白睛五轮学说（肺/肝/心/脾/肾五轮）+ 红丝/瘀斑/黄染 | 长焦 12MP |
| **手诊** | `rokid-camera` (hand) | 掌纹/指形/指甲/鱼际/青筋（20+ 项） | 主摄/ToF |

### 8.2 子午流注实时提醒

眼镜端根据当前时辰自动激活对应经络养生提醒，通过骨传导 TTS 语音播报：

```javascript
// js/wearable/rokid-voice.js + rokid-audio.js 联动
// 当前申时（15:00-17:00）→ 膀胱经当令
await wearable.say('当前申时，膀胱经当令。建议多喝温水，促进代谢排毒。');
```

12 时辰经络对应表详见 `WEARABLE_XIANZHI_PLAN.md` §3.4。

### 8.3 医易联动

命理宝鉴独创的「医易联动」能力：
- 根据用户**八字命卦**推导体质倾向（如坎卦体质→肾系统偏弱）
- 结合**流年卦象**给出年度养生重点（如流年逢坎→冬季重点养肾）
- **64 卦 × 体质映射表**驱动个性化养生方案
- 眼镜端通过 `device-provider.js` 统一调用八字引擎 + 中医 KB

### 8.4 SDK 文件清单（已验证全 200）

| 文件 | 大小 | 职责 |
|------|------|------|
| `js/wearable/device-provider.js` | 21KB | 多品牌抽象接口 + 工厂注册 |
| `js/wearable/rokid-bridge.js` | 10KB | JSBridge 探测 + 优雅降级 |
| `js/wearable/rokid-camera.js` | 9.7KB | 5 路摄像头（舌/面/目/手/IR） |
| `js/wearable/rokid-audio.js` | 6.5KB | 骨传导音频路由 |
| `js/wearable/rokid-voice.js` | 8.7KB | 离线唤醒词 + ASR |
| `js/wearable/rokid-motion.js` | 7.8KB | 九轴陀螺仪手势识别 |
| `js/wearable/rokid-storage.js` | 4.1KB | 眼镜端离线缓存 |
| `js/wearable/rokid-glass.js` | 2.5KB | AR 投屏 + HUD |
| `js/wearable/index.js` | 1.5KB | 统一门面 facade |

**验证状态**：本地 8914 端口 + GitHub Pages 全 9 文件 HTTP 200 ✅

---

*文档版本：v2.0（R11-W 增强）· 最后更新：2026-07-25 00:25 CST*
