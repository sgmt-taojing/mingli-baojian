# AI 实时诊疗一体化平台 · 业务设计文档

## 一、需求与痛点

### 用户原话
"摄像头和AI算法之前有规范，按规范优化，包括在这个板块的音视频实时交互，医生，命理师审核，自动电子病历，看看怎么一起出来。"

### 现有痛点
1. **能力碎片化**：摄像头采集(camera-capture)、望诊工作台(wangzhen-clinical)、AI助手(ai-assistant)、统一诊疗(unified-diagnosis)各自独立，用户要跳 3-4 个页面才能完成一次问诊
2. **无统一会话**：摄像头拍的照片、语音问的话、KB 查的结果不关联，无法回溯同一次问诊的完整过程
3. **EMR 缺失**：medical_cases 表只有 symptoms 字段，没有完整的四诊信息、AI 诊断结果、处方、审核记录
4. **审核无入口**：master_case_versions / case_review_logs 有表但无界面，命理师审核要走后台
5. **设备与算法脱节**：device-management 是静态列表，看不到算法实时健康、参数配置

---

## 二、方案：统一实时诊疗中心 (unified-consultation.html)

### 2.1 核心架构

```
┌─────────────────────────────────────────────────────────────────┐
│                  AI 实时诊疗一体化平台                            │
│                  unified-consultation.html                       │
├──────────┬──────────┬──────────┬──────────┬──────────────────────┤
│ 摄像头   │ 语音交互  │ KB 实时  │ 电子病历 │ 医生/命理师审核       │
│ 实时采集  │ Realtime │ 检索     │ 自动生成  │ 审核 + 签字           │
│          │ Voice    │ Realtime │          │                      │
│ getUserMedia│ Web Speech│ FTS5  │ localStorage│ master_case_versions│
│ → 抽帧   │ → 转写   │ → 三级  │ → 结构化  │ → case_review_logs   │
│ → 识别   │ → 实时滚动│ → 直答  │ → 医生确认│ → 版本对比            │
│ → KB匹配 │ → 边说边查│ → AI兜底│ → 归档    │ → 签字时间戳          │
└──────────┴──────────┴──────────┴──────────┴──────────────────────┘
         ↑                                            ↑
    RealtimeVision                           RealtimeEngine 编排器
    RealtimeVoice                             voice → kb → vision
    RealtimeKB                                session_id 串联全链路
    face-ocr-server:8913
```

### 2.2 四种使用场景

| 场景 | 入口 | 核心动作 | 输出 |
|------|------|----------|------|
| **医生音视频问诊** | 医生角色 → 统一诊疗中心 | 摄像头采集 + 语音问诊 + KB辅助辨证 | 自动生成 EMR + 初步诊断 |
| **命理师审核** | 命理师角色 → 审核队列 | 查看 AI 初诊结果 + 修改辨证 + 签字确认 | 审核通过/驳回 + 版本记录 |
| **自动电子病历** | 问诊过程中自动生成 | 实时采集四诊信息 → 结构化病历 | 可打印/分享的完整病历 |
| **设备算法联动** | 运维角色 → 设备面板 | 算法选择 + 摄像头健康检查 + 参数配置 | 算法状态 + 诊断准确率统计 |

### 2.3 数据流（统一 session）

```
Session Start → session_id (UUID)
    │
    ├─→ [摄像头] getUserMedia → 抽帧(800ms) → face-ocr-server → KB匹配 → 结果上屏
    │       ↓
    │   tong-face-validator (质量检查 + 置信度0.75)
    │       ↓
    │   localStorage 存储: {session_id, timestamp, image_blob, features, matches}
    │
    ├─→ [语音] RealtimeVoice → interim(final) → RealtimeKB.search → 三级分级
    │       ↓
    │   RealtimeEngine.bindVoiceToKb() → 边说边查
    │       ↓
    │   localStorage 存储: {session_id, timestamp, transcript, kb_result}
    │
    ├─→ [KB] RealtimeKB → FTS5 检索 → 直答/润色/兜底 → 展示 + TTS朗读
    │
    ├─→ [EMR] 自动组装
    │   ├── 主诉: 语音 transcript
    │   ├── 四诊: 摄像头 features + KB matches
    │   ├── AI 诊断: RealtimeEngine 输出
    │   ├── 证型: KB 直答结果
    │   └── 处方: AI 辅助生成（待医生确认）
    │       ↓
    │   localStorage 存储: {session_id, emr: {...}}
    │
    └─→ [审核] 命理师/医生
        ├── 查看完整 EMR
        ├── 修改辨证 / 调整处方
        ├── 签字确认（时间戳 + 角色 + 哈希）
        └── 写入 master_case_versions + case_review_logs
```

### 2.4 EMR 数据结构（扩展 medical_cases 表）

```sql
-- 扩展 medical_cases 表
ALTER TABLE medical_cases ADD COLUMN session_id TEXT;
ALTER TABLE medical_cases ADD COLUMN video_frames TEXT;        -- JSON: [{ts, features, matches}]
ALTER TABLE medical_cases ADD COLUMN voice_transcript TEXT;    -- 语音转写全文
ALTER TABLE medical_cases ADD COLUMN kb_evidence TEXT;         -- KB 匹配证据
ALTER TABLE medical_cases ADD COLUMN ai_diagnosis TEXT;        -- AI 诊断结果
ALTER TABLE medical_cases ADD COLUMN syndrome_type TEXT;       -- 证型
ALTER TABLE medical_cases ADD COLUMN prescription TEXT;        -- 处方
ALTER TABLE medical_cases ADD COLUMN review_status TEXT DEFAULT 'pending'; -- pending/approved/rejected
ALTER TABLE medical_cases ADD COLUMN reviewed_by INTEGER;      -- 审核人 ID
ALTER TABLE medical_cases ADD COLUMN reviewed_at TEXT;         -- 审核时间
ALTER TABLE medical_cases ADD COLUMN review_notes TEXT;        -- 审核意见
```

### 2.5 审核签字机制

```javascript
// 审核签字数据结构
{
  case_id: 123,
  reviewer_id: 456,
  reviewer_role: "master",  // master / doctor
  action: "approve",        // approve / reject / modify
  original_text: "...",     // 原始 EMR
  modified_text: "...",     // 修改后 EMR（如有）
  signature_hash: "sha256:...",  // 内容哈希（防篡改）
  timestamp: "2026-08-19T16:30:00+08:00",
  ip_address: "optional"
}
```

---

## 三、页面结构

### 3.1 布局（四栏响应式）

```
┌──────────────────────────────────────────────────────┐
│ unified-consultation.html                            │
├──────────┬──────────┬──────────┬──────────────────────┤
│ [左]     │ [中]     │ [右]     │ [底部横贯]           │
│ 摄像头   │ 语音交互  │ KB 辅助  │ 电子病历（实时生成）   │
│ + 视觉   │ + 转写   │ + 典藏   │                      │
│ 分析     │ 滚动     │ 引用     │ 主诉 / 四诊 / 诊断    │
│          │          │          │ / 证型 / 处方         │
│ 实时视频  │ 语音按钮  │ 实时搜索  │                      │
│ 拍照采集  │ 转写显示  │ 结果卡片  │ 审核按钮（命理师可见） │
│ 质量检查  │ 边说边查  │ 三级分级  │                      │
│          │          │          │                      │
│ [底部]   │          │          │                      │
│ 采集历史  │          │          │                      │
└──────────┴──────────┴──────────┴──────────────────────┘
```

### 3.2 角色权限

| 功能 | 求测者/患者 | 医生 | 命理师 | 运维 |
|------|------------|------|--------|------|
| 摄像头采集 | ✅ | ✅ | ✅ | ✅ |
| 语音问诊 | ✅ | ✅ | ✅ | ❌ |
| KB 查询 | ✅ | ✅ | ✅ | ✅ |
| 生成 EMR | ✅ | ✅ | ✅ | ❌ |
| 修改辨证 | ❌ | ✅ | ✅ | ❌ |
| 审核签字 | ❌ | ✅ | ✅ | ❌ |
| 设备管理 | ❌ | ❌ | ❌ | ✅ |

---

## 四、技术实现

### 4.1 核心技术栈

| 层 | 技术 | 说明 |
|----|------|------|
| 前端 | RealtimeEngine + Vision + Voice + KB | 已有 v2.0 组件，零改动复用 |
| 摄像头 | getUserMedia + face-ocr-server:8913 | 已有端点，直接调用 |
| 语音 | Web Speech API (RealtimeVoice) | 已有实现 |
| KB | FTS5 /api/public/kb/search-fts | 已有实现 |
| EMR 存储 | localStorage (session级) + medical_cases (持久化) | 新增扩展字段 |
| 审核 | master_case_versions + case_review_logs | 已有表结构 |
| 音视频 | WebRTC (getUserMedia) + TTS | 已有实现 |

### 4.2 Session 管理

```javascript
// Session 数据结构
{
  session_id: "uuid-v4",
  created_at: "ISO timestamp",
  role: "patient|doctor|master",
  patient_id: null,
  frames: [{ts, features, matches, confidence}],
  transcripts: [{ts, text, interim}],
  kb_results: [{ts, query, tier, items}],
  emr: {
    主诉: "",
    四诊: {望: "", 闻: "", 问: "", 切: ""},
    AI诊断: "",
    证型: "",
    处方: "",
    备注: ""
  },
  review: null  // 审核结果
}
```

### 4.3 零延迟保证

- 摄像头抽帧 800ms（已有）
- 语音转写 interim 实时滚动（已有）
- KB 搜索 150ms 防抖（已有）
- 三引擎并行：vision + voice + kb 各自独立，不互相阻塞
- EMR 更新：每 5 秒自动保存到 localStorage，不阻塞主流程

---

## 五、业务流程（4个场景）

### 5.1 医生音视频问诊

```
1. 医生登录 → 选择患者 → 进入统一诊疗中心
2. 系统初始化 RealtimeEngine（voice + kb + vision）
3. 摄像头启动 → 实时采集 → 质量检查 → KB 匹配
4. 医生语音问诊 → 实时转写 → KB 辅助辨证
5. 系统自动生成 EMR（主诉 + 四诊 + AI 诊断 + 证型）
6. 医生确认/修改 EMR → 生成处方
7. EMR 持久化到 medical_cases + localStorage
```

### 5.2 命理师审核

```
1. 命理师登录 → 进入审核队列 → 查看待审核病例
2. 加载病例完整记录（视频帧 + 语音 + KB 证据 + AI 诊断）
3. 命理师逐项审核：
   - 查看摄像头采集的照片 + 特征
   - 听取语音问诊记录
   - 查看 KB 匹配证据
   - 审核 AI 诊断结果
4. 命理师决策：
   - 通过 → 签字确认（时间戳 + 哈希）
   - 驳回 → 填写驳回原因
   - 修改 → 修改辨证/处方 → 签字
5. 记录写入 case_review_logs + master_case_versions
```

### 5.3 自动电子病历

```
实时采集 → 结构化存储 → 自动生成
├── 语音 transcript → 主诉
├── 摄像头 features → 四诊（望诊）
├── KB matches → 辨证依据
├── RealtimeEngine → AI 诊断
└── 组装成标准 EMR 格式
    {
      主诉: "...",
      现病史: "...",
      既往史: "...",
      四诊: {望诊, 闻诊, 问诊, 切诊},
      辅助检查: "摄像头识别结果",
      辨证: "AI 辨证 + 命理师审核",
      诊断: "...",
      处方: "...",
      医师签名: "...",
      时间: "..."
    }
```

### 5.4 设备算法联动

```
1. 运维登录 → 设备管理面板
2. 摄像头健康检查 → /api/camera/health
3. 算法状态 → face-ocr-server engines 状态
4. 参数配置 → 抽帧间隔 / 置信度阈值 / KB 匹配模式
5. 实时监控 → 诊断准确率 / 响应时间 / 错误率
```

---

## 六、前端页面设计

### 6.1 页面结构

```html
<!-- unified-consultation.html -->
<div class="consultation-layout">
  <!-- 左栏：摄像头 + 视觉分析 -->
  <div class="camera-panel">
    <video id="camera-feed" autoplay playsinline></video>
    <canvas id="capture-canvas"></canvas>
    <button id="capture-btn">📸 拍摄</button>
    <div id="vision-result"><!-- KB 匹配结果 --></div>
    <div id="quality-check"><!-- 质量检查结果 --></div>
  </div>

  <!-- 中栏：语音交互 -->
  <div class="voice-panel">
    <button id="voice-btn">🎙️ 开始问诊</button>
    <div id="transcript"><!-- 实时转写滚动 --></div>
    <div id="interim-result"><!-- 部分结果（灰色滚动）--></div>
  </div>

  <!-- 右栏：KB 辅助 -->
  <div class="kb-panel">
    <div id="kb-search"><!-- 实时 KB 结果 --></div>
    <div id="kb-tier"><!-- 三级分级显示 --></div>
    <div id="kb-evidence"><!-- 典藏引用 --></div>
  </div>

  <!-- 底部：电子病历 -->
  <div class="emr-panel">
    <div class="emr-section">
      <h3>主诉</h3><div id="emr-complaint"></div>
    </div>
    <div class="emr-section">
      <h3>四诊</h3><div id="emr-examination"></div>
    </div>
    <div class="emr-section">
      <h3>AI 诊断</h3><div id="emr-diagnosis"></div>
    </div>
    <div class="emr-section">
      <h3>证型</h3><div id="emr-syndrome"></div>
    </div>
    <div class="emr-section">
      <h3>处方</h3><div id="emr-prescription"></div>
    </div>
    <!-- 审核按钮（仅命理师/医生可见） -->
    <div id="review-actions" style="display:none">
      <button id="approve-btn">✅ 审核通过</button>
      <button id="reject-btn">❌ 驳回</button>
      <button id="modify-btn">✏️ 修改</button>
    </div>
  </div>
</div>
```

### 6.2 RealtimeEngine 编排

```javascript
// 初始化统一引擎
const engine = new RealtimeEngine({
  voice: new RealtimeVoice({
    lang: 'zh-CN',
    onInterim: text => updateTranscript(text),
    onFinal: text => {
      engine.answer(text);  // 触发 KB 搜索 + AI 回答
      appendToEmr('主诉', text);
    },
    onState: s => updateVoiceUI(s)
  }),
  kb: new RealtimeKB({
    apiBase: '/api/public/kb/search-fts',
    module: 'tcm',
    onResult: r => renderKbResult(r),
    onStatus: s => updateKbUI(s)
  }),
  vision: new RealtimeVision({
    endpoint: 'http://127.0.0.1:8913/api/camera/upload',
    mode: 'face',
    intervalMs: 800,
    onResult: r => {
      renderVisionResult(r);
      appendToEmr('四诊', r.features);
    },
    onStatus: s => updateVisionUI(s)
  })
});

engine.bindVoiceToKb();  // 一行接线：语音 → KB
engine.startListening();  // 开始实时问诊
```

### 6.3 自动 EMR 生成

```javascript
class AutoEMR {
  constructor(sessionId) {
    this.sessionId = sessionId;
    this.data = {
      主诉: '',
      现病史: '',
      既往史: '',
      四诊: {望: '', 闻: '', 问: '', 切: ''},
      辅助检查: '',
      辨证: '',
      诊断: '',
      处方: '',
      医师签名: '',
      时间: ''
    };
  }

  addTranscript(text) { this.data.主诉 += text; this.save(); }
  addVisionResult(features) { this.data.四诊.望 = features; this.save(); }
  addKbResult(kbItems) { this.data.辨证 = kbItems; this.save(); }
  addAiDiagnosis(diagnosis) { this.data.诊断 = diagnosis; this.save(); }

  generate() {
    // 自动组装标准 EMR 格式
    return {
      ...this.data,
      时间: new Date().toISOString()
    };
  }

  save() {
    localStorage.setItem(`emr_${this.sessionId}`, JSON.stringify(this.data));
  }

  persist(caseId) {
    // 持久化到 medical_cases 表
    return fetch('/api/cases/emr', {
      method: 'POST',
      body: JSON.stringify({ case_id: caseId, emr: this.data })
    });
  }
}
```

---

## 七、与现有页面关系

| 现有页面 | 新方案中的角色 | 处理方式 |
|----------|---------------|----------|
| camera-capture.html | 摄像头采集子功能 | 内嵌到左栏 |
| wangzhen-clinical.html | 望诊工作台子功能 | 内嵌到左栏 |
| ai-assistant.html | AI 辅助诊断 | 内嵌到右栏 KB |
| unified-diagnosis.html | 统一诊疗框架 | 替换为实时诊疗中心 |
| collab-diagnosis.html | 四方协同 | 扩展为实时音视频 |
| doctor-elder.html | 医生端 | 角色切换入口 |
| master-workstation.html | 命理师审核 | 审核队列入口 |
| patient-archive.html | 患者档案 | 关联 session_id |
| health-monitor.html | 健康追踪 | 从 EMR 提取数据 |

---

## 八、验收标准

1. **零延迟**：摄像头抽帧 → KB 匹配 P95 < 1.5s
2. **实时交互**：语音转写 interim 实时滚动，边说边查
3. **EMR 完整性**：自动生成包含 主诉/四诊/AI诊断/证型/处方
4. **审核闭环**：命理师可查看完整记录 + 签字 + 版本对比
5. **会话回溯**：session_id 关联所有采集数据，可完整回溯
6. **离线可用**：localStorage 缓存 EMR，断网不丢数据
7. **设备健康**：摄像头健康检查 + 算法状态实时显示

---

## 九、实施步骤

### Step 1：扩展 medical_cases 表（server/database/migrate-emr-fields.sql）
### Step 2：创建 unified-consultation.html（统一实时诊疗中心）
### Step 3：集成 RealtimeEngine 编排器
### Step 4：实现 AutoEMR 类（自动电子病历生成）
### Step 5：实现审核签字机制（master_case_versions + case_review_logs）
### Step 6：角色权限控制（患者/医生/命理师/运维）
### Step 7：与现有页面关联（session_id 串联）
### Step 8：测试 + 修真
