# 命理宝鉴 · 知识库建设标准 (v1.0)

> 日期：2026-07-21 | 范围：全部 54 个 KB 文件 + 来源数据 + 蒸馏引擎 + 应用端点
> 目标：建立「来源 → 索引 → 标注 → 蒸馏 → 模型 → 推送 → 应用 → 追溯」的闭环知识体系

---

## 一、核心原则

### 1.1 知识溯源链（必须可追溯）

<div class="rich-timeline">
<div class="rich-step">
<span class="rich-step-marker">1</span>
<div class="rich-step-body">
<div class="rich-step-title">数据源 (Source)</div>
<div class="rich-step-text">原始出处：典籍（如《黄帝内经》）、课程（倪师视频）、临床案例、专家经验（舒晗）、网络资源、用户反馈</div>
</div>
</div>
<div class="rich-step">
<span class="rich-step-marker">2</span>
<div class="rich-step-body">
<div class="rich-step-title">来源索引 (Source Index)</div>
<div class="rich-step-text">每条来源唯一 ID：`SRC-{TYPE}-{SEQ}`，如 SRC-BOOK-001、SRC-COURSE-012、SRC-CASE-045</div>
</div>
</div>
<div class="rich-step">
<span class="rich-step-marker">3</span>
<div class="rich-step-body">
<div class="rich-step-title">知识条目 (Knowledge Entry)</div>
<div class="rich-step-text">提炼后的知识：`{id, content, tags, source_ids[], confidence, created_at, status}`</div>
</div>
</div>
<div class="rich-step">
<span class="rich-step-marker">4</span>
<div class="rich-step-body">
<div class="rich-step-title">临时库 (Staging KB)</div>
<div class="rich-step-text">`staging_knowledge` 表：新蒸馏/新标注的知识暂存，未推送应用</div>
</div>
</div>
<div class="rich-step">
<span class="rich-step-marker">5</span>
<div class="rich-step-body">
<div class="rich-step-title">正式库 (Formal KB)</div>
<div class="rich-step-text">`formal_knowledge` 表：审计通过的知识，已推送应用</div>
</div>
</div>
<div class="rich-step">
<span class="rich-step-marker">6</span>
<div class="rich-step-body">
<div class="rich-step-title">知识模型 (Knowledge Model)</div>
<div class="rich-step-text">小模型：按模块分组（如 bazi-model / tcm-model），为引用端提供快速检索 API</div>
</div>
</div>
<div class="rich-step">
<span class="rich-step-marker">7</span>
<div class="rich-step-body">
<div class="rich-step-title">应用端 (Application)</div>
<div class="rich-step-text">divination-hub / ai-assistant / tcm-clinic → 调用 model API → 获取知识</div>
</div>
</div>
</div>

**追溯路径**：应用端 → model_id → formal_knowledge.entry_id → source_ids[] → source_index.src_id → 原始出处

---

## 二、知识来源分类

### 2.1 来源类型（SOURCE_TYPE）

| 类型代码 | 名称 | 示例 | 可信度基线 |
|----------|------|------|----------|
| SRC-BOOK | 典籍 | 《黄帝内经》《三命通会》《子平真诠》 | 高 |
| SRC-COURSE | 课程 | 倪海厦视频课程、舒晗直播回放 | 中-高 |
| SRC-CASE | 临床案例 | master_cases 表中的高评分案例 | 中 |
| SRC-EXPERT | 专家经验 | 舒晗老师笔记、倪师口述整理 | 高 |
| SRC-WEB | 网络资源 | 权威网站、论文摘要 | 中 |
| SRC-FEEDBACK | 用户反馈 | 诊疗效果回访、用户报告 | 低-中 |
| SRC-LEGACY | 历史知识 | 已有 KB 文件（54个） | 中 |

### 2.2 来源索引表 (source_index)

```sql
CREATE TABLE IF NOT EXISTS source_index (
  src_id        TEXT PRIMARY KEY,        -- SRC-BOOK-001
  src_type      TEXT NOT NULL,            -- SRC-BOOK / SRC-COURSE / ...
  title         TEXT,                     -- 《黄帝内经·素问》
  author        TEXT,                     -- 黄帝 / 岐伯
  url           TEXT,                     -- 原始 URL（如有）
  publisher     TEXT,                     -- 出版社 / 出品方
  publish_date  TEXT,                     -- 出版日期
  trust_score   REAL DEFAULT 0.5,         -- 可信度 0-1
  tags          TEXT,                     -- JSON: ["中医","内经","养生"]
  access_level  TEXT DEFAULT 'public',    -- public / registered / member / professional
  created_at    TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at    TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### 2.3 知识来源清单（当前已知）

| src_id | 类型 | 标题 | 可信度 | 当前 KB 文件 |
|--------|------|------|--------|-------------|
| SRC-BOOK-001 | SRC-BOOK | 黄帝内经·素问 | 0.95 | tcm-knowledge.js |
| SRC-BOOK-002 | SRC-BOOK | 三命通会 | 0.90 | bazi-knowledge-base.js |
| SRC-BOOK-003 | SRC-BOOK | 子平真诠 | 0.90 | bazi-knowledge-base.js |
| SRC-BOOK-004 | SRC-BOOK | 滴天髓 | 0.90 | bazi-knowledge-base.js |
| SRC-COURSE-001 | SRC-COURSE | 倪师人纪系列·针灸 | 0.85 | nihaisha-knowledge.js |
| SRC-COURSE-002 | SRC-COURSE | 倪师人纪系列·伤寒论 | 0.85 | tcm-nihaixia.js |
| SRC-EXPERT-001 | SRC-EXPERT | 舒晗老师命理笔记 | 0.85 | shuhan-knowledge.js |
| SRC-CASE-001 | SRC-CASE | 高评分诊疗案例 | 0.70 | master_cases |
| ... | ... | ... | ... | ... |

---

## 三、知识条目模型

### 3.1 标准条目结构

```javascript
{
  // === 核心标识 ===
  entry_id:    "KB-{TYPE}-{SEQ}",       // KB-BAZI-001, KB-TCM-045
  module:      "bazi",                   // 所属模块：bazi / tcm / fengshui / ...
  
  // === 知识内容 ===
  content:     "日主癸水生于午月，火旺水弱，需...",  // 核心知识内容
  summary:     "癸水日主夏季调理解读",               // 一句话摘要
  tags:        ["癸水","午月","火旺","调养"],        // 标签
  
  // === 来源追溯 ===
  source_ids:  ["SRC-BOOK-002","SRC-EXPERT-001"],  // 来源 ID 列表
  
  // === 质量属性 ===
  confidence:  0.85,                    // 置信度 0-1（来源可信度 × 提取准确度）
  access_level: "registered",           // public / registered / member / professional
  category:    "格局用神",               // 子分类
  difficulty:  "intermediate",          // beginner / intermediate / advanced
  
  // === 审计状态 ===
  status:      "formal",               // staging / formal / deprecated / archived
  audit_status: "approved",            // pending / approved / rejected
  audit_by:    "admin",                // 审核人
  audit_at:    "2026-07-21T10:00:00Z", // 审核时间
  audit_notes: "内容准确，来源可信",     // 审核备注
  
  // === 生命周期 ===
  version:     1,                      // 版本号
  created_at:  "2026-07-21T10:00:00Z",
  updated_at:  "2026-07-21T10:00:00Z",
  deprecated_at: null,
  
  // === 模型绑定 ===
  model_id:    "bazi-model-v1",        // 所属知识模型
  embedding:   null,                   // 向量 embedding（可选）
  
  // === 使用统计 ===
  hit_count:   0,                      // 被引用次数
  last_hit:    null                    // 最后被引用时间
}
```

### 3.2 状态流转

```
staging → [审计通过] → formal → [推送应用] → active
    ↓               ↓              ↓
pending → [审计拒绝] → rejected   deprecated → archived
```

- **staging**：蒸馏/新增后暂存，不可被应用引用
- **formal**：审计通过，可被应用引用
- **deprecated**：内容过时，保留但标记
- **archived**：彻底废弃，不再引用

---

## 四、知识模型构建

### 4.1 模型设计原则

> **以引用端快速获取知识为小模型**
> - 按模块分组：bazi-model / tcm-model / fengshui-model / liuren-model / ...
> - 每个模型是一个结构化 JS 对象，内含该模块所有 knowledge entry 的索引
> - 应用端按 `module + query` 检索模型，模型返回匹配的 entry
> - 模型定期从 formal KB 蒸馏更新（每日/每周）

### 4.2 模型结构

```javascript
// knowledge-models/bazi-model.js
const BAZI_MODEL = {
  version: "v1.0",
  updated_at: "2026-07-21",
  entries: {
    "bazi-001": { tags: ["癸水","午月","火旺"], confidence: 0.85, content: "..." },
    "bazi-002": { tags: ["甲木","亥月","水旺"], confidence: 0.90, content: "..." },
    // ... 按 entry_id 索引
  },
  // 倒排索引：标签 → entry_id[]
  inverted_index: {
    "癸水": ["bazi-001", "bazi-015", ...],
    "午月": ["bazi-001", "bazi-023", ...],
    "火旺": ["bazi-001", "bazi-007", ...],
  },
  // 分类索引
  categories: {
    "格局用神": ["bazi-001", "bazi-002", ...],
    "十神分析": ["bazi-010", "bazi-011", ...],
  }
};
```

### 4.3 模型检索 API

```javascript
// 应用端调用
const result = BAZI_MODEL.search("癸水 午月 火旺");
// → 返回匹配的 entry 列表（按 confidence 排序）

const result = BAZI_MODEL.byCategory("格局用神");
// → 返回该分类下所有 entry

const result = BAZI_MODEL.byTag("癸水");
// → 返回所有带"癸水"标签的 entry
```

---

## 五、数据流闭环

```
┌──────────────────────────────────────────────────────────────────┐
│  数据源管理                                                      │
│  SRC-BOOK / SRC-COURSE / SRC-CASE / SRC-EXPERT / SRC-WEB        │
│         ↓ 建立来源索引 (source_index)                            │
│  src_id + 元数据 + 可信度                                        │
└──────────────────────────────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────────────────────────────┐
│  提取 (Extract)                                                  │
│  从来源中提炼知识条目 → {content, tags, source_ids[]}           │
│         ↓                                                        │
│  → 进入临时库 (staging_knowledge)                                │
└──────────────────────────────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────────────────────────────┐
│  蒸馏 (Distill)                                                  │
│  扫描高质量案例 → 提取模式 → 验证 → 生成 KB diff                │
│  （复用现有 distillation-engine.js）                             │
│         ↓                                                        │
│  → 更新临时库 (staging_knowledge)                                │
└──────────────────────────────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────────────────────────────┐
│  标注 (Annotate)                                                 │
│  每个 entry 标注：                                               │
│  - source_ids[]（追溯来源）                                      │
│  - confidence（置信度）                                          │
│  - tags / category / difficulty                                  │
│  - access_level                                                  │
│         ↓                                                        │
│  → 审计检查 (audit_logs)                                         │
└──────────────────────────────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────────────────────────────┐
│  审计与安全检查 (Audit)                                          │
│  - 内容准确性：对照来源验证                                       │
│  - 安全性：去除敏感信息、医疗建议需标注"仅供参考"               │
│  - 重复检测：避免同一知识多份存储                                 │
│  - 一致性：tags/category 与标准分类对齐                          │
│         ↓                                                        │
│  ✅ 通过 → 正式库 (formal_knowledge)                             │
│  ❌ 拒绝 → 返回标注补充 → 重新审计                               │
└──────────────────────────────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────────────────────────────┐
│  构建模型 (Build Model)                                          │
│  按模块分组 → 构建倒排索引 → 生成 knowledge-model.js            │
│         ↓                                                        │
│  → 进入模型仓库 (knowledge-models/)                              │
└──────────────────────────────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────────────────────────────┐
│  推送模型 (Push Model)                                           │
│  应用端注册模型 → 更新版本 → 热加载（无需重启）                   │
│         ↓                                                        │
│  → 应用端可用                                                    │
└──────────────────────────────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────────────────────────────┐
│  应用 (Application)                                              │
│  divination-hub → model.search() → 返回知识                     │
│  ai-assistant → model.byCategory() → 引导推荐                    │
│  tcm-clinic → model.byTag() → 诊疗参考                           │
└──────────────────────────────────────────────────────────────────┘
         ↓ (追溯)
┌──────────────────────────────────────────────────────────────────┐
│  反向追溯                                                        │
│  app引用 → model_id → entry_id → source_ids[] → src_id          │
│         → 原始出处（典籍/课程/案例）                              │
└──────────────────────────────────────────────────────────────────┘
```

---

## 六、数据库设计

### 6.1 核心表

| 表名 | 用途 | 核心字段 |
|------|------|----------|
| `source_index` | 来源索引 | src_id, src_type, title, author, trust_score |
| `staging_knowledge` | 临时库 | entry_id, module, content, source_ids[], status=staging |
| `formal_knowledge` | 正式库 | entry_id, module, content, source_ids[], status=formal |
| `knowledge_models` | 知识模型 | model_id, version, module, entry_ids[], inverted_index |
| `audit_logs` | 审计日志 | audit_id, entry_id, action, result, notes, auditor |
| `model_push_log` | 模型推送 | push_id, model_id, version, pushed_at, app_endpoints[] |

### 6.2 已有表复用

| 已有表 | 新用途 |
|--------|--------|
| `master_cases` | SRC-CASE 来源 + 蒸馏输入 |
| `master_case_versions` | 案例版本管理（蒸馏历史） |
| `system_config` | KB 模型版本 + 推送配置 |
| `audit_logs` | 已有审计表，扩展示例 |

### 6.3 新增表 SQL

```sql
-- 来源索引
CREATE TABLE IF NOT EXISTS source_index (
  src_id        TEXT PRIMARY KEY,
  src_type      TEXT NOT NULL,
  title         TEXT,
  author        TEXT,
  url           TEXT,
  publisher     TEXT,
  publish_date  TEXT,
  trust_score   REAL DEFAULT 0.5,
  tags          TEXT,
  access_level  TEXT DEFAULT 'public',
  created_at    TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at    TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 临时知识库
CREATE TABLE IF NOT EXISTS staging_knowledge (
  entry_id      TEXT PRIMARY KEY,
  module        TEXT NOT NULL,
  content       TEXT NOT NULL,
  summary       TEXT,
  tags          TEXT,
  source_ids    TEXT,              -- JSON array
  confidence    REAL DEFAULT 0.5,
  access_level  TEXT DEFAULT 'registered',
  category      TEXT,
  difficulty    TEXT DEFAULT 'intermediate',
  status        TEXT DEFAULT 'staging',
  audit_status  TEXT DEFAULT 'pending',
  audit_by      TEXT,
  audit_at      TEXT,
  audit_notes   TEXT,
  version       INTEGER DEFAULT 1,
  created_at    TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at    TEXT DEFAULT CURRENT_TIMESTAMP,
  deprecated_at TEXT,
  model_id      TEXT,
  embedding     TEXT,
  hit_count     INTEGER DEFAULT 0,
  last_hit      TEXT
);

-- 正式知识库
CREATE TABLE IF NOT EXISTS formal_knowledge (
  entry_id      TEXT PRIMARY KEY,
  module        TEXT NOT NULL,
  content       TEXT NOT NULL,
  summary       TEXT,
  tags          TEXT,
  source_ids    TEXT,
  confidence    REAL DEFAULT 0.5,
  access_level  TEXT DEFAULT 'registered',
  category      TEXT,
  difficulty    TEXT DEFAULT 'intermediate',
  status        TEXT DEFAULT 'formal',
  audit_status  TEXT DEFAULT 'approved',
  audit_by      TEXT,
  audit_at      TEXT,
  audit_notes   TEXT,
  version       INTEGER DEFAULT 1,
  created_at    TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at    TEXT DEFAULT CURRENT_TIMESTAMP,
  deprecated_at TEXT,
  model_id      TEXT,
  embedding     TEXT,
  hit_count     INTEGER DEFAULT 0,
  last_hit      TEXT
);

-- 知识模型
CREATE TABLE IF NOT EXISTS knowledge_models (
  model_id      TEXT PRIMARY KEY,
  module        TEXT NOT NULL,
  version       TEXT NOT NULL,
  description   TEXT,
  entry_count   INTEGER DEFAULT 0,
  entry_ids     TEXT,              -- JSON array
  inverted_index TEXT,             -- JSON object
  categories    TEXT,              -- JSON object
  built_at      TEXT DEFAULT CURRENT_TIMESTAMP,
  pushed_at     TEXT,
  app_endpoints TEXT,              -- JSON array
  status        TEXT DEFAULT 'active'
);

-- 模型推送日志
CREATE TABLE IF NOT EXISTS model_push_log (
  push_id       TEXT PRIMARY KEY,
  model_id      TEXT NOT NULL,
  version       TEXT NOT NULL,
  pushed_at     TEXT DEFAULT CURRENT_TIMESTAMP,
  app_endpoints TEXT,
  trigger       TEXT DEFAULT 'scheduled',  -- scheduled / manual / auto
  result        TEXT DEFAULT 'success'
);
```

---

## 七、蒸馏与更新机制

### 7.1 定期蒸馏（每日/每周自动）

```
cron: 每天 03:00（低峰期）
  → distillation-engine.js 自动执行：
    1. 扫描新增/更新的 source_index 条目
    2. 扫描 master_cases 中 quality_score≥8 的新案例
    3. 提取知识模式 → 生成 staging_knowledge 条目
    4. 自动标注 source_ids + confidence
    5. 进入 staging_knowledge 表
  → 等待人工/自动审计
```

### 7.2 审计触发

```
1. 每日 06:00 自动审计（规则检查）
   - 内容非空
   - source_ids[] 非空
   - confidence ≥ 0.3
   - 无敏感医疗建议（需加"仅供参考"标注）
   - 无重复内容（对比 formal_knowledge）
   
2. 规则检查通过 → 自动移至 formal_knowledge

3. 规则检查失败 → 标记 pending → 人工审核
```

### 7.3 模型重建

```
cron: 每周日 04:00
  → knowledge-model-builder.js：
    1. 读取 formal_knowledge 中 status=formal 的全部条目
    2. 按 module 分组
    3. 构建倒排索引（tags → entry_ids）
    4. 生成 knowledge-models/{module}-model.js
    5. 更新 knowledge_models 表
    6. 自动推送（可选）
```

---

## 八、应用端集成

### 8.1 知识模型调用

```javascript
// divination-hub.html / ai-assistant.html 中
// 方式 1：直接引入模型文件
<script src="knowledge-models/bazi-model.js"></script>
<script>
  const result = BAZI_MODEL.search("癸水 午月");
  // → [{entry_id, content, confidence, source_ids[]}]
</script>

// 方式 2：通过 API 获取（动态）
async function queryKB(module, query) {
  const res = await fetch(`/api/kb/model-search?module=${module}&q=${encodeURIComponent(query)}`);
  return res.json();
}
```

### 8.2 追溯展示

```javascript
// 在报告/对话中展示知识来源
function showKnowledgeSource(entry_id) {
  const entry = formal_knowledge[entry_id];
  const sources = entry.source_ids.map(id => source_index[id]);
  // → 展示："本段解读参考：《三命通会》（0.90）、舒晗老师笔记（0.85）"
}
```

---

## 九、安全与审计

### 9.1 审计检查清单

| 检查项 | 规则 | 拒绝条件 |
|--------|------|----------|
| 内容准确性 | 对照来源验证 | 内容与来源不符 |
| 医疗安全 | 医疗建议需标注"仅供参考" | 直接诊断/开方未加标注 |
| 敏感信息 | 去除个人隐私 | 含身份证/手机号/地址 |
| 重复检测 | 对比 formal_knowledge | 相似度 > 0.8 |
| 分类一致性 | tags 与标准分类对齐 | 未分类或分类错误 |
| 可信度 | confidence ≥ 0.3 | 置信度过低 |
| 来源完整性 | source_ids[] 非空 | 无来源追溯 |

### 9.2 审计日志

```sql
-- 审计日志已存在，新增 KB 专项审计
INSERT INTO audit_logs (action, target_type, target_id, result, notes, auditor)
VALUES ('kb-audit', 'knowledge', 'KB-BAZI-001', 'approved', '内容准确，来源可信', 'system');
```

---

## 十、实施计划

### Phase 1：基础设施（本周）
1. 新建 `source_index` 表 + 来源注册脚本
2. 新建 `staging_knowledge` + `formal_knowledge` 表
3. 新建 `knowledge_models` + `model_push_log` 表
4. 扩展现有蒸馏引擎，增加 staging → formal 流转

### Phase 2：来源索引与标注（下周）
1. 梳理全部 54 个 KB 文件，提取来源 → 注册 source_index
2. 为现有知识条目补充 source_ids + confidence
3. 建立 tags / category / difficulty 标准分类

### Phase 3：模型构建（2 周内）
1. 新建 `knowledge-models/` 目录
2. 实现 knowledge-model-builder.js
3. 生成首批 5 个模块模型：bazi / tcm / fengshui / liuren / liuyao

### Phase 4：应用集成（2 周内）
1. divination-hub.html 接入 model.search()
2. ai-assistant.html 接入 model.byCategory()
3. 报告生成时展示知识来源追溯

### Phase 5：自动化蒸馏（1 个月内）
1. cron 每日蒸馏 → staging
2. cron 每周模型重建
3. cron 每日自动审计
4. 模型热推送

---

## 十一、验收标准

- [ ] 全部 54 个 KB 文件可追溯到 source_index
- [ ] source_index 覆盖 ≥ 10 个来源类型
- [ ] staging → formal 流转有审计日志
- [ ] 知识模型检索响应 < 500ms
- [ ] 应用端可展示"本段参考：XXX典籍"
- [ ] 每日自动蒸馏 + 审计 + 模型重建
- [ ] 审计拒绝率 < 5%（大部分知识一次通过）

---

## 十二、铁律

**【铁律】知识库双库隔离**
- staging_knowledge 和 formal_knowledge 物理隔离，应用端只能读取 formal
- 不允许 staging 直接推送到应用端
- 必须经过审计（自动或人工）才能进入 formal

**【铁律】知识必须可追溯**
- 每个知识条目必须有 source_ids[]（至少一个来源）
- 不允许无来源的知识进入正式库
- 应用端展示知识时自动附带来源追溯

**【铁律】模型优先于全量 KB**
- 应用端优先查询 knowledge-model（小模型，快速）
- 小模型未命中 → 再查 formal_knowledge 全量
- 全量 KB 作为兜底，不直接暴露给应用端

**【铁律】蒸馏必须留痕**
- 每次蒸馏记录 batch_id、来源、时间、影响条目
- 支持回滚（rollbackVersion）
- 蒸馏日志保留 90 天
