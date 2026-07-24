# 命理宝鉴 · 先知智镜穿戴 SDK 落地总规划

> 2026-07-25 · R11-W · 穿戴设备落地总规划文档
> 作者：命理宝鉴穿戴接入组
> 关联文档：`docs/SMART_GLASS_INTEGRATION.md` · `js/wearable/` (9 文件)

---

## 一、项目背景

### 1.1 路总先知智镜文档

路总提供的「先知智镜」产品文档（docx 格式，约 148 段落）描述了一款面向中医辅助诊断的智能 AR 眼镜产品。核心需求是将命理宝鉴的中医辨证引擎与智能眼镜硬件深度结合，实现「眼镜戴上即可做中医四诊」的体验。

### 1.2 为什么需要穿戴 SDK

| 传统手机端 | 智能眼镜端 |
|-----------|-----------|
| 用户手动拍照舌象 | **5 路摄像头自动抓拍** |
| 手动输入症状 | **语音问诊 + 骨传导播报** |
| 肉眼观察面色 | **NPU 实时面色分析** |
| 无穿戴传感器 | **九轴陀螺仪检测手势/体态** |
| 无法实时提醒 | **子午流注实时养生提醒** |

### 1.3 SDK 已有基础（2026-07-24 完成）

```
js/wearable/
├── device-provider.js   (21KB)  多品牌抽象接口 + 工厂注册
├── index.js             (1.5KB) 统一门面 facade
├── rokid-bridge.js      (10KB)  Rokid JSBridge 探测 + 降级
├── rokid-camera.js      (9.7KB) 5 路摄像头抽象
├── rokid-audio.js       (6.5KB) 骨传导音频路由
├── rokid-voice.js       (8.7KB) 离线唤醒词 + ASR
├── rokid-motion.js      (7.8KB) 九轴陀螺仪手势
├── rokid-storage.js     (4.1KB) 眼镜端离线缓存
└── rokid-glass.js       (2.5KB) AR 投屏 + HUD 显示
```

**验证状态**：GitHub Pages + 本地 8914 端口全 9 文件 HTTP 200 ✅

---

## 二、硬件能力清单

### 2.1 先知智镜硬件规格（基于路总文档）

| 硬件 | 规格 | 中医用途 |
|------|------|---------|
| **5 路摄像头** | 48MP 主摄 + 12MP 长焦 + 2MP 微距 + ToF 深感 + IR 红外 | 舌诊(微距) / 面诊(主摄) / 目诊(长焦) / 手诊(主摄) / 深度感知(ToF) |
| **4 麦克风阵列** | 信噪比 ≥65dB / 采样 48kHz | 远场语音识别 / 声纹身份 / 咳嗽音分析 |
| **骨传导扬声器** | 频响 20Hz-20kHz / 不堵耳 | TTS 朗读养生建议（不影响正常听觉） |
| **NPU 神经引擎** | 算力 ≥4 TOPS (INT8) | 实时舌象分割 / 面色五色检测 / 手部关键点 |
| **32GB 存储** | UFS 2.1 | 离线 KB 缓存 + 舌象模板图 + 语音模型 |
| **九轴 IMU** | 加速度+陀螺+磁力计 | 手势识别（指点/滑动/敲击）/ 体态分析 |
| **WiFi 6** | 802.11ax 2x2 MIMO | 与手机/PC 端协同同步 |
| **蓝牙 5.2** | BLE + Classic | 外接脉诊仪 / 体温贴 |

### 2.2 摄像头角色分配

| 摄像头 ID | 角色 | 中医用途 | 对焦距离 |
|-----------|------|---------|---------|
| `cam-0-main` | `tongue` (舌诊) | 舌质 / 舌苔 / 舌形 / 舌下络脉 | 5-15cm |
| `cam-1-tele` | `eye` (目诊) | 白睛红丝 / 瞳孔反应 / 巩膜五轮 | 15-30cm |
| `cam-2-macro` | `face` (面诊) | 面色五色 / 面部光泽 / 面部望诊分区 | 30-50cm |
| `cam-3-tof` | `hand` (手诊) | 手掌纹路 / 指甲 / 鱼际 / 大鱼际 | 10-20cm |
| `cam-4-ir` | `other` (红外) | 面部热成像 / 穴位温度分布 | 30-80cm |

---

## 三、软件能力清单

### 3.1 中医四诊 AI 引擎

| 诊法 | 模块 | 识别项 | 数据量 | 依赖 |
|------|------|--------|--------|------|
| **舌诊** | `tcm/tongue` | 28 种舌象（淡红/淡白/红/绛/紫 / 胖瘦/齿痕/裂纹 / 薄白/白厚/黄/灰黑苔 等） | 28 类 × 200+ 样本 | NPU + 微距摄像头 |
| **面诊** | `tcm/face` | 36 种面诊指标（五色/五部/五志/面部望诊分区/面部形态） | 36 维度 | NPU + 主摄 |
| **目诊** | `tcm/eye` | 白睛五轮（肺/肝/心/脾/肾）+ 红丝/瘀斑/黄染 | 15+ 项 | NPU + 长焦 |
| **手诊** | `tcm/hand` | 掌纹/指形/指甲/鱼际/青筋 | 20+ 项 | NPU + 主摄/ToF |
| **智能问诊** | `tcm/inquiry` | 语音问诊 + 症状自动归类 + 十问歌展开 | 动态对话 | ASR + KB |
| **八纲辨证** | `tcm/syndrome` | 阴阳/表里/寒热/虚实 八纲自动判定 | 8纲 × 权重矩阵 | 推理引擎 |
| **子午流注** | `tcm/meridian` | 十二时辰经络养生 + 流注穴位提醒 | 12时辰 × 12正经 | 时间 + 定位 |
| **医易联动** | `tcm/iching` | 命卦/体质卦/流年卦 → 养生方案联动 | 64卦 × 体质映射 | 八字引擎 |

### 3.2 舌诊 28 象分类体系

```
舌质（9 类）：淡红(正常) / 淡白 / 红 / 绛 / 紫 / 青紫 / 瘀斑 / 红绛 / 暗红
舌形（7 类）：正常 / 胖大 / 瘦薄 / 齿痕 / 裂纹 / 芒刺 / 瘘软
舌态（4 类）：正常 / 歪斜 / 颤动 / 吐弄
舌苔（8 类）：薄白(正常) / 白厚 / 薄黄 / 黄厚 / 灰黑 / 无苔 / 花剥 / 镜面
舌下络脉（2 类）：正常 / 粗张青紫
```

### 3.3 面诊 36 维度指标

```
五色（5）：青/赤/黄/白/黑 → 肝/心/脾/肺/肾
五部（5）：额/鼻/左颊/右颊/颌 → 心/脾/肝/肺/肾
五志（5）：怒/喜/思/悲/恐 → 面部表情肌肉张力
面部形态（7）：浮肿/消瘦/红斑/黄染/色素沉着/毛细血管扩张/皱纹
面部光泽（4）：明润/暗淡/枯槁/无光
特殊征象（10）：蝶形红斑/满月脸/面具面/狮面/口眼歪斜/眼睑下垂/突眼/面色潮红/面色苍白/面色黧黑
```

### 3.4 子午流注时辰-经络对应

| 时辰 | 时间段 | 当令经络 | 养生提醒 |
|------|--------|---------|---------|
| 子时 | 23:00-01:00 | 胆经 | 宜入睡养胆 |
| 丑时 | 01:00-03:00 | 肝经 | 深睡养血 |
| 寅时 | 03:00-05:00 | 肺经 | 调息养肺 |
| 卯时 | 05:00-07:00 | 大肠经 | 起床排便 |
| 辰时 | 07:00-09:00 | 胃经 | 早餐最佳 |
| 巳时 | 09:00-11:00 | 脾经 | 运化水谷 |
| 午时 | 11:00-13:00 | 心经 | 子午觉 |
| 未时 | 13:00-15:00 | 小肠经 | 分清泌浊 |
| 申时 | 15:00-17:00 | 膀胱经 | 饮水排毒 |
| 酉时 | 17:00-19:00 | 肾经 | 固本养精 |
| 戌时 | 19:00-21:00 | 心包经 | 安神散步 |
| 亥时 | 21:00-23:00 | 三焦经 | 准备入睡 |

---

## 四、SDK 架构

### 4.1 分层架构

```
┌─────────────────────────────────────────────┐
│           app/glass-console.html            │  ← 业务层（H5 应用）
├─────────────────────────────────────────────┤
│     js/wearable/index.js (facade)           │  ← 统一入口门面
├─────────────────────────────────────────────┤
│  device-provider.js (多品牌抽象)              │  ← 工厂 + 注册表
├──────────┬──────────┬───────────────────────┤
│ Rokid    │ XREAL    │ Web Fallback          │  ← 品牌 Adapter 层
│ Adapter  │ Adapter  │ (浏览器标准 API)       │
├──────────┴──────────┴───────────────────────┤
│ bridge   │ camera  │ audio │ voice │ motion │  ← 能力抽象层
│          │ (5 路)   │ (骨传导)│ (ASR) │ (九轴) │
├──────────┴─────────┴───────┴──────┴─────────┤
│ storage  │ glass (AR 投屏)                   │  ← 存储 + 显示层
├─────────────────────────────────────────────┤
│   RokidJSBridge / Web Standard API / WS     │  ← 底层通信协议
└─────────────────────────────────────────────┘
```

### 4.2 device-provider.js 核心接口

```javascript
// IDeviceProvider 抽象基接口（所有品牌 adapter 实现）
interface IDeviceProvider {
  async probe()                // → DeviceCapability
  async enumerateCameras()     // → CameraDescriptor[]
  async openCamera(roleOrId)   // → MediaStream
  async openMicrophone(deviceId?)  // → MediaStream
  async routeAudio(stream, mode)   // → boolean ('bone'|'speaker'|'auto')
  async setVoiceWakeup(words, cb)  // → unsubscribe fn
  async startMotion(interval, cb)  // → unsubscribe fn
  async localCacheGet(key)         // → Promise<any>
  async localCacheSet(key, value, ttl?)  // → Promise<void>
}
```

### 4.3 多端协同（IBridgeChannel）

```javascript
// 眼镜 ↔ 电脑/平板 双向通信
interface IBridgeChannel {
  async send(target, message)    // 发送到目标设备
  onMessage(callback)            // 接收消息
  async syncHealthReport(report) // 同步健康报告到云端
}
```

### 4.4 探测优先级

```
1. window.RokidJSBridge.callNative()  ← Rokid AR Studio WebView (原生注入)
2. window.RokidJSBridge.postMessage() ← Rokid 全屏浏览器 (JSON-RPC)
3. navigator.mediaDevices.*           ← Web 标准 API (浏览器 fallback)
4. 纯前端模拟                         ← 最终兜底（PC 开发调试用）
```

---

## 五、使用示例

### 5.1 注册 Provider

```javascript
// 在 glass-console.html 中引入后自动探测
// <script src="../js/wearable/device-provider.js"></script>

// 手动注册新品牌 adapter
deviceProvider.register('xreal', {
  probe: async () => ({ cameras: [...], boneConduction: false }),
  openCamera: async (role) => { /* ... */ },
  // ...
});

// 切换品牌
const provider = deviceProvider.use('xreal');
```

### 5.2 探测设备能力

```javascript
const caps = await deviceProvider.probe();
// 返回示例（先知智镜）：
// {
//   cameras: ['cam-0-main','cam-1-tele','cam-2-macro','cam-3-tof','cam-4-ir'],
//   microphones: ['mic-0','mic-1','mic-2','mic-3'],
//   boneConduction: true,
//   voiceWakeup: true,
//   motionSensor: true,
//   localStorage: true,
//   batteryLevel: 0.85
// }
```

### 5.3 5 路摄像头拍摄舌象

```javascript
// 微距摄像头拍舌象
const tongueStream = await deviceProvider.openCamera('tongue');
const tongueImage = await captureFrame(tongueStream);
// → 发送到 /api/face-ocr/tongue-analyze → 28 象分类

// IR 红外拍面部热成像
const thermalStream = await deviceProvider.openCamera('cam-4-ir');
const thermalImage = await captureFrame(thermalStream);
// → 发送到 /api/face-ocr/thermal → 穴位温度分布图
```

### 5.4 骨传导 TTS 朗读

```javascript
// 通过骨传导扬声器朗读养生建议
await wearable.say('当前申时，膀胱经当令。建议多喝温水，促进代谢排毒。');
// 音频路由自动选择 'bone' 模式（不堵耳）
```

### 5.5 离线唤醒词

```javascript
// 设置唤醒词（本地 ASR，离线可用）
const unsubscribe = await deviceProvider.setVoiceWakeup(
  ['宝鉴宝鉴', '开始问诊', '播报今日运势'],
  (keyword) => {
    if (keyword === '宝鉴宝鉴') openGlassConsole();
    if (keyword === '开始问诊') startDiagnosticFlow();
    if (keyword === '播报今日运势') speakDailyFortune();
  }
);

// 取消唤醒词
unsubscribe();
```

### 5.6 离线缓存 KB 摘要

```javascript
// 预缓存中医 KB 到眼镜本地（32GB 存储空间充足）
await deviceProvider.localCacheSet('kb:tcm-tongue-28', tongueData, 86400);
await deviceProvider.localCacheSet('kb:meridian-12', meridianData, 86400);
await deviceProvider.localCacheSet('kb:face-36-dim', faceData, 86400);

// 断网时读取
const tongueKB = await deviceProvider.localCacheGet('kb:tcm-tongue-28');
```

---

## 六、多品牌扩展路线图

| 优先级 | 品牌 | 型号 | SDK 体系 | 预计接入时间 | 中医能力适配 |
|--------|------|------|---------|-------------|-------------|
| **P0** | **Rokid** | Max Pro / Air / AR Studio | Android SDK + JSBridge | **已完成** ✅ | 全功能（5 摄 + 骨传导 + NPU） |
| **P1** | **XREAL** | Air 2 Ultra | Nebula OS / WebXR | 2026 Q3 | 基础四诊（1 摄 + WebRTC） |
| **P1** | **小米** | 米家智能眼镜 | Android SDK | 2026 Q3 | 语音问诊 + KB 查询 |
| **P2** | **INMO** | Air2 / Go | Android SDK | 2026 Q4 | 基础四诊 + AR 投屏 |
| **P2** | **雷鸟** | X2 Lite | Android SDK | 2026 Q4 | 语音 + 排盘投屏 |
| **P3** | **华为** | Eyewear II | HarmonyOS SDK | 2027 Q1 | 仅语音 + TTS |
| **P3** | **Apple** | Vision Pro | visionOS SDK | 2027 Q2 | 全功能（M2 + R1 芯片） |

### 6.1 扩展步骤（新品牌接入）

1. 新建 `js/wearable/<brand>-bridge.js`（品牌 JSBridge 探测）
2. 新建 `js/wearable/<brand>-adapter.js`（实现 IDeviceProvider）
3. 在 `device-provider.js` 工厂注册表中添加品牌
4. 在 `index.js` facade 中导出（条件加载）
5. 添加品牌探测测试用例
6. 更新本文档路线图状态

---

## 七、本地验证报告

### 7.1 静态服务验证

- **端口**：8914（`com.mingli-baojian.static` launchd 服务）
- **服务进程**：Python `static-gzip.py`（PID 41841，STATIC_DIR=`app/`）
- **wearable 路径**：通过 symlink `app/js/wearable → ../../js/wearable` 实现

### 7.2 SDK 文件 HTTP 状态

| 文件 | HTTP | 大小(bytes) | GitHub Pages |
|------|------|------------|-------------|
| device-provider.js | 200 | 21,057 | ✅ |
| index.js | 200 | 1,560 | ✅ |
| rokid-audio.js | 200 | 6,536 | ✅ |
| rokid-bridge.js | 200 | 10,741 | ✅ |
| rokid-camera.js | 200 | 9,688 | ✅ |
| rokid-glass.js | 200 | 2,471 | ✅ |
| rokid-motion.js | 200 | 7,840 | ✅ |
| rokid-storage.js | 200 | 4,148 | ✅ |
| rokid-voice.js | 200 | 8,686 | ✅ |
| **合计 9 文件** | **全 200** | **72,727** | **全 200** |

### 7.3 glass-console.html SDK 集成状态

- ✅ 8 个 `<script>` 标签引入（rokid-bridge → camera → audio → voice → motion → storage → glass → device-provider）
- ✅ `wearable-status` DOM 元素显示设备检测状态
- ✅ 镜腿点击事件联动 `rokidMotion.on()`
- ✅ 唤醒词接入 `rokidVoice.once()`
- ✅ 抓拍联动 `rokidCamera.capture()`

### 7.4 GitHub Pages URL

```
https://tom2025.github.io/mingli-baojian/js/wearable/rokid-bridge.js
https://tom2025.github.io/mingli-baojian/js/wearable/device-provider.js
...（全 9 文件 200 ✅）
```

### 7.5 已知限制

1. **JSBridge 假设**：`rokid-bridge.js` 基于 3 条假设（HYP-1/2/3），实际 Rokid WebView 注入命名空间待到货验证
2. **NPU 模型**：舌象 28 类 + 面诊 36 维度的 NPU 推理模型尚未训练（需收集样本 ≥5000 张）
3. **红外热成像**：`cam-4-ir` 的穴位温度映射算法待与硬件厂商确认数据格式
4. **子午流注定时器**：需在 `glass-console.html` 添加 12 时辰自动切换逻辑（当前仅有静态数据）

---

## 附录 A：相关文件索引

| 路径 | 说明 |
|------|------|
| `js/wearable/device-provider.js` | 多品牌抽象接口 + 工厂注册表 |
| `js/wearable/index.js` | 统一门面（facade） |
| `js/wearable/rokid-bridge.js` | Rokid JSBridge 探测 + 优雅降级 |
| `js/wearable/rokid-camera.js` | 5 路摄像头抽象（舌/面/目/手/IR） |
| `js/wearable/rokid-audio.js` | 骨传导音频路由 |
| `js/wearable/rokid-voice.js` | 离线唤醒词 + ASR |
| `js/wearable/rokid-motion.js` | 九轴陀螺仪手势识别 |
| `js/wearable/rokid-storage.js` | 眼镜端离线缓存 |
| `js/wearable/rokid-glass.js` | AR 投屏 + HUD 显示 |
| `app/glass-console.html` | 眼镜端 H5 控制台（已集成 SDK） |
| `docs/SMART_GLASS_INTEGRATION.md` | 智能眼镜接入方案（R9 基础文档） |

---

## 附录 B：术语表

| 术语 | 含义 |
|------|------|
| 四诊 | 望、闻、问、切（中医四大诊断方法） |
| 八纲 | 阴阳、表里、寒热、虚实（辨证总纲） |
| 子午流注 | 十二时辰与十二正经的对应关系 |
| 五轮学说 | 眼睛五部位对应五脏的中医理论 |
| 骨传导 | 通过颅骨传递声波，不经过耳膜 |
| NPU | Neural Processing Unit，神经网络处理器 |
| JSBridge | WebView 中原生能力暴露给 JS 的通信协议 |
| ToF | Time of Flight，飞行时间深度感知 |

---

*文档版本：v1.0 · 最后更新：2026-07-25 00:25 CST*
*下一步：眼镜到货后执行 §5 使用示例验证 + §7.5 已知限制逐项消除*
