-- ═══════════════════════════════════════════════════════════════
-- 命理宝鉴 · 知识库体系表结构 (KB Management Schema)
-- 日期: 2026-07-21
-- 标准文档: docs/KB_MANAGEMENT_STANDARD.md
-- ═══════════════════════════════════════════════════════════════

-- 来源索引
CREATE TABLE IF NOT EXISTS source_index (
  src_id        TEXT PRIMARY KEY,
  src_type      TEXT NOT NULL,            -- SRC-BOOK / SRC-COURSE / SRC-CASE / SRC-EXPERT / SRC-WEB / SRC-FEEDBACK / SRC-LEGACY
  title         TEXT,
  author        TEXT,
  url           TEXT,
  publisher     TEXT,
  publish_date  TEXT,
  trust_score   REAL DEFAULT 0.5,
  tags          TEXT,                     -- JSON: ["中医","内经"]
  access_level  TEXT DEFAULT 'public',
  created_at    TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at    TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_source_type ON source_index(src_type);
CREATE INDEX IF NOT EXISTS idx_source_trust ON source_index(trust_score DESC);

-- 临时知识库（应用端不可读）
CREATE TABLE IF NOT EXISTS staging_knowledge (
  entry_id      TEXT PRIMARY KEY,
  module        TEXT NOT NULL,
  content       TEXT NOT NULL,
  summary       TEXT,
  tags          TEXT,                     -- JSON array
  source_ids    TEXT,                     -- JSON array
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

CREATE INDEX IF NOT EXISTS idx_staging_module ON staging_knowledge(module);
CREATE INDEX IF NOT EXISTS idx_staging_audit ON staging_knowledge(audit_status);
CREATE INDEX IF NOT EXISTS idx_staging_confidence ON staging_knowledge(confidence DESC);

-- 正式知识库（应用端可读）
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

CREATE INDEX IF NOT EXISTS idx_formal_module ON formal_knowledge(module);
CREATE INDEX IF NOT EXISTS idx_formal_category ON formal_knowledge(category);
CREATE INDEX IF NOT EXISTS idx_formal_confidence ON formal_knowledge(confidence DESC);
CREATE INDEX IF NOT EXISTS idx_formal_access ON formal_knowledge(access_level);

-- 知识模型索引
CREATE TABLE IF NOT EXISTS knowledge_models (
  model_id      TEXT PRIMARY KEY,
  module        TEXT NOT NULL,
  version       TEXT NOT NULL,
  description   TEXT,
  entry_count   INTEGER DEFAULT 0,
  entry_ids     TEXT,                     -- JSON array
  inverted_index TEXT,                    -- JSON object: {tag: [entry_ids]}
  categories    TEXT,                     -- JSON object: {category: [entry_ids]}
  built_at      TEXT DEFAULT CURRENT_TIMESTAMP,
  pushed_at     TEXT,
  app_endpoints TEXT,                     -- JSON array
  status        TEXT DEFAULT 'active'
);

CREATE INDEX IF NOT EXISTS idx_models_module ON knowledge_models(module);
CREATE INDEX IF NOT EXISTS idx_models_status ON knowledge_models(status);

-- 模型推送日志
CREATE TABLE IF NOT EXISTS model_push_log (
  push_id       TEXT PRIMARY KEY,
  model_id      TEXT NOT NULL,
  version       TEXT NOT NULL,
  pushed_at     TEXT DEFAULT CURRENT_TIMESTAMP,
  app_endpoints TEXT,
  trigger       TEXT DEFAULT 'scheduled',
  result        TEXT DEFAULT 'success',
  notes         TEXT
);

CREATE INDEX IF NOT EXISTS idx_push_model ON model_push_log(model_id);
CREATE INDEX IF NOT EXISTS idx_push_time ON model_push_log(pushed_at DESC);

-- 知识引用追踪（反向追溯：应用端 → 知识 → 来源）
CREATE TABLE IF NOT EXISTS knowledge_trace (
  trace_id      TEXT PRIMARY KEY,
  app_endpoint  TEXT NOT NULL,            -- divination-hub.html / ai-assistant.html
  entry_id      TEXT NOT NULL,
  model_id      TEXT,
  user_query    TEXT,
  hit_score     REAL,
  hit_at        TEXT DEFAULT CURRENT_TIMESTAMP,
  user_agent    TEXT
);

CREATE INDEX IF NOT EXISTS idx_trace_entry ON knowledge_trace(entry_id);
CREATE INDEX IF NOT EXISTS idx_trace_endpoint ON knowledge_trace(app_endpoint);

-- 蒸馏批次关联（与 distillation-engine 协同）
CREATE TABLE IF NOT EXISTS kb_distill_log (
  batch_id      TEXT PRIMARY KEY,
  source_type   TEXT NOT NULL,            -- manual / auto / scheduled
  source_count  INTEGER DEFAULT 0,
  extract_count INTEGER DEFAULT 0,
  validate_count INTEGER DEFAULT 0,
  applied_count INTEGER DEFAULT 0,
  started_at    TEXT DEFAULT CURRENT_TIMESTAMP,
  completed_at  TEXT,
  status        TEXT DEFAULT 'running',
  notes         TEXT
);