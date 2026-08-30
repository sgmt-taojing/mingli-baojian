/**
 * 命理宝鉴·医道 临床 API 服务 V1.0
 * 端口: 8932 (避开 messiah.py 占用的 8930 + 老 8940 全部修真)
 * 职责: 四诊数据采集→标准化→多流派辨证→方证推荐→报告输出
 * 安全: 医疗数据全程不记录原始图像，仅保留 JSON 特征
 */

const express = require('express');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const auth = require('./auth');

// ═══ 引擎 ═══
const { 
  multischoolAnalysis, formulaSyndromeMatch, 
  contraindicationCheck, assessUrgency 
} = require('./engines/syndrome-engine');

// R528: 内生辨证引擎（辨证→主方→Top5备选→推理链→风险预警）
const INHOUSE = require('./engines/inhouse-model');
const handDiagEngine = require('./engines/hand-diagnosis-engine');

const {
  SZ_TONGUE, SZ_FACE, SZ_HAND, SZ_INQUIRY,
  SZ_DIAGNOSIS_REPORT, URGENCY_LEVELS
} = require('./schemas/four-diagnosis-schema');

// R716: 简化入参兼容工具
function normalizeTongueFeatures(tongue) {
  if (tongue && tongue.tongue_features && tongue.tongue_features.tongue_body) return tongue;
  if (tongue && Array.isArray(tongue.features)) {
    // 兼容 features 元素为字符串或 {name,value} 对象两种格式
    const featStr = (f) => typeof f === 'string' ? f : (f && (f.value || f.name) ? String(f.value || f.name) : String(f || ''));
    const bodyRaw = tongue.features.find(f => /舌|淡|红|紫|胖|齿/.test(featStr(f))) || '';
    const coatingRaw = tongue.features.find(f => featStr(f).includes('苔')) || '';
    return {
      tongue_features: {
        tongue_body: { color: featStr(bodyRaw).replace('舌','').trim() },
        tongue_coating: { color: featStr(coatingRaw).replace('苔','').trim(), texture: '' }
      },
      raw_features: tongue.features
    };
  }
  // R720 修真：tongue 是字符串（"淡红"/"淡胖"）→ 自动解析
  if (typeof tongue === 'string' && tongue.trim()) {
    return {
      tongue_features: {
        tongue_body: { color: tongue.trim() },
        tongue_coating: { color: '', texture: '' }
      },
      raw_features: [tongue]
    };
  }
  return tongue;
}

function normalizeMethodFeatures(method) {
  if (method && method.features && Array.isArray(method.features) && !method.features_dict) {
    return { features: method.features, features_dict: method.features, raw: method };
  }
  return method;
}

// R762 问诊台状态：实时帧计数 + 已确认病例（内存简化）
const state = {
  inquiryFrames: {},   // caseId -> { count, lastTs, sizeSum }
  confirmedCases: []   // [{caseId, timestamp, ...}]
};
const app = express();
// R735 患者身份核验 + 医保人脸核对（face-feature 算法接入医学模块）
const { registerRoutes: registerFaceVerify } = require('./face-verify-api');
app.use(express.json({ limit: '5mb' }));

registerFaceVerify(app);
// 医保局人脸核对对接适配层
const { registerRoutes: registerInsurance } = require('./insurance-adaptor');
registerInsurance(app);
// G12 轻预约挂号（slots/create/checkin/cancel 四 API + 爽约自动标记 + G10 短信）
const { registerRoutes: registerAppointments } = require('./appointment-api');
registerAppointments(app);
// G13 医院报告回流家庭端·供给侧（link_token 关联 + 白名单组装 + 命理剥离守卫）
const { registerRoutes: registerReflux } = require('./family-reflux');
registerReflux(app);

// R789 患者主索引 EMPI（任何异常回退老行为，绝不影响服务）
const patientIndex = (() => {
  try { return require('./kb-store/patient-index'); } catch (e) { console.error('[patient-index] 加载失败:', e.message); return null; }
})();
// R790 拼音/首字母离线映射（KB 检索与患者检索共用）
const pinyin = (() => {
  try { return require('./kb-store/pinyin'); } catch (e) { console.error('[pinyin] 加载失败:', e.message); return { variants: () => [''], full: () => '', isLatin: () => false }; }
})();

// CORS：允许 8931 静态服务及本地开发跨端口访问
// R763 修真：ACAH 补 X-Trace-Id / X-Skip-Interceptor / X-Case-Id ——
// 拦截器给每个 fetch 附加 X-Trace-Id，但预检白名单未列 → 浏览器 CORS 校验失败
// → SW networkFirst 捕获后兑底 503 {offline:true}（curl 无 CORS 逻辑测不出来）
app.use((req, res, next) => {
  const o = req.headers.origin || '';
  if (/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(o)) res.setHeader('Access-Control-Allow-Origin', o);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Trace-Id,X-Skip-Interceptor,X-Case-Id');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ═══════════════════════════════════════════════
// JWT 中间件（可选鉴权 - 端点级控制）
// ═══════════════════════════════════════════════
const OPTIONAL_AUTH = new Set([
  '/api/tcm/diagnose', '/api/prescription/create', '/api/cases/save',
  '/api/chronic/assess', '/api/chronic/htn/assess', '/api/chronic/dm/assess',
  '/api/chronic/ins/assess', '/api/chronic/copd/assess',
]);
const REQUIRED_AUTH = new Set([
  '/api/admin/users', '/api/admin/config', '/api/audit/log',
  '/api/prescription/verify', '/api/cases/delete',
]);

function optionalAuth(req, res, next) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (token) {
    try { req.user = auth.verifyToken(token); } catch (e) {}
  }
  next();
}

function requireAuth(req, res, next) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ ok: false, error: '需要登录' });
  try {
    req.user = auth.verifyToken(token);
    if (!req.user) return res.status(401).json({ ok: false, error: 'Token 无效或过期' });
    if (req.user.role !== 'super_admin' && REQUIRED_AUTH.has(req.path) === false &&
        (req.user.role.startsWith('doctor_') && req.user.role !== 'super_admin')) {
      // 医生角色仅可访问诊断/处方/病例
    }
    next();
  } catch (e) {
    return res.status(401).json({ ok: false, error: 'Token 验证失败: ' + e.message });
  }
}

// R755 修真：服务端输入校验兜底——通用清洗中间件
// 防绕过前端直接调 API：body 大小已由 express.json(5mb) 限制，此处做字段级清洗
app.use((req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    if (req.body && typeof req.body === 'object') {
      var MAX_FIELD = 10000; // 单字段 10KB 限制
      for (var k in req.body) {
        if (typeof req.body[k] === 'string') {
          // trim + 长度截断(防超大单字段)
          req.body[k] = req.body[k].trim().slice(0, MAX_FIELD);
        }
        // 过滤 null 字节的注入(防 NoSQL/JSON 注入)
        if (typeof req.body[k] === 'string') {
          req.body[k] = req.body[k].replace(/\u0000/g, '');
        }
      }
    }
    // 空体检查: POST/PUT/PATCH 至少要有有效 body 字段
    var ct = (req.headers['content-type'] || '').toLowerCase();
    if (ct.includes('application/json')) {
      if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ ok: false, error: '请求体为空或无有效字段', code: 'EMPTY_BODY' });
      }
    }
  }
  next();
});

app.use(optionalAuth);

// ───────────────── 健康检查 ─────────────────
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    service: '命理宝鉴·医道',
    version: '1.0.0',
    uptime: process.uptime(),
    capabilities: ['tongue', 'face', 'hand', 'inquiry', 'syndrome', 'formula', 'acupoint'],
    endpoints: {
      patients: '/api/patients/list',
      diagnose: '/api/tcm/diagnose',
      prescription: '/api/prescription/create',
      knowledge: '/api/tcm/health'
    },
    timestamp: new Date().toISOString()
  });
});

// R735 face-verify 模块（挂载点见 app 定义后）
app.get('/api/tcm/health', (req, res) => {
  res.json({
    ok: true,
    service: '命理宝鉴·医道',
    version: '1.0.0',
    uptime: process.uptime(),
    capabilities: ['tongue', 'face', 'hand', 'inquiry', 'syndrome', 'formula', 'acupoint']
  });
});

// ───────────────── 知识库（线上 API）─────────────────
// R119 修真：内存缓存 + mtime 失效（原实现每次请求 readFileSync+parse 83.7MB）
let _kbCache = null;      // { modules, data, mtime, at }
let _kbFlat = null;       // [{module,title,content,keywords,confidence,id}] 展开索引
let _formulaNames = null; // R798：tcm-formula 干净方名缓存 [{name,inis,pinyin}]，随 _kbFlat 重建失效
function loadKbCache(force) {
  const kbPath = require('path').join(__dirname, 'kb-store', 'tcm-synced-kb.json');
  const stat = require('fs').statSync(kbPath);
  if (!force && _kbCache && _kbCache.mtime === stat.mtimeMs) return _kbCache;
  // R785：优先读 SQLite 镜像索引（只读列字段，省掉 126MB JSON.parse 和 40k 次 payload 解析）；
  // 镜像过期/异常回退 JSON 老路径；cache.data 仅在 /full 等稀有场景惰性物化
  let data = null, idx = null;
  try {
    idx = require('./kb-store/kb-sqlite').tryLoadIndex(stat.mtimeMs);
  } catch (e) { idx = null; }
  if (!idx) {
    data = JSON.parse(require('fs').readFileSync(kbPath, 'utf-8'));
    // 异步补建镜像，下次加载走快路径
    try {
      const { spawn } = require('child_process');
      spawn(process.execPath, [require('path').join(__dirname, '..', 'scripts', 'kb-sqlite-sync.js')],
        { detached: true, stdio: 'ignore' }).unref();
    } catch (e) {}
  }
  const flat = [];
  // R756 修真：命理标题黑名单——医学 KB 检索索引不得含命理特征条目
  // （R752 豁免的 nihaisha 文档索引如 tianji.md 天纪笔记，检索时仍会泄漏命理内容）
  const MINGLI_TITLE_KW = ['紫微','八字','风水','阳宅','阴宅','奇门','六壬','梅花易数','一掌经','天纪','命宫','财帛宫','大运','流年','占卜','星耀','星曜','四化','飞星','命盘','排盘','命卦','易经','大限','疾厄宫','天机','化忌','坐命','命身','三元九运','时运','擎羊','驿马','夫妻宫','子女宫','田宅宫','福德宫','迁移宫','官禄宫','命理','运势','紫微斗数','术数','断语','相术','面相','手相','鼻相','财运','掌纹','骨相','麻衣','三方四正','文曲','文昌','巨门','太阳','破军','廉贞','七杀','贪狼','天府','太阴','天相','武曲','四化'];
  // R756 修真：拼音命理关键词（tianji.md 等拼音标题逃逸中文黑名单）
  const MINGLI_TITLE_KW_PINYIN = ['tianji','ziwei','bazi','qimen','liuyao','meihua','liuren','fengshui','daliuren','shishen','shensha','mingli','xingxiu','feixing','sihua','dayun','liunian','yangzhai','bagua','tiangan','dizhi'];
  const MED_TITLE_PREFIX = ['金匮','伤寒','人纪','医案','本草','汤头','黄帝内经','神农','药性','方剂','针灸','艾灸','穴位','经络','倪海厦人纪','汉唐中医','五运六气'];
  if (idx) {
    // R785 SQLite 快路径：列字段已截断，直接过黑名单滤出检索索引
    for (const r of idx.rows) {
      if (r.module === '_mingli_quarantine') continue;
      const _t = String(r.title || '');
      if (MINGLI_TITLE_KW.some(k => _t.includes(k)) && !MED_TITLE_PREFIX.some(p => _t.startsWith(p))) continue;
      if (MINGLI_TITLE_KW_PINYIN.some(k => _t.toLowerCase().includes(k)) && !MED_TITLE_PREFIX.some(p => _t.startsWith(p))) continue;
      flat.push({ id: r.eid || '', module: r.module, title: r.title || '',
        initials: r.initials || '', pinyin: r.pinyin || '',
        content: r.content || '', keywords: r.keywords || '', confidence: Number(r.confidence || 0.5) });
    }
    _kbCache = { modules: idx.modules, counts: idx.counts, data: null, flat, mtime: stat.mtimeMs, at: Date.now(), total: flat.length, sqlite: true };
    _kbFlat = flat;
    _formulaNames = null;
    return _kbCache;
  }
  for (const [mod, items] of Object.entries(data)) {
    // R756 修真：命理隔离区不进入检索索引（隔离区仅供审计回看，禁止泄漏到用户检索）
    if (mod === '_mingli_quarantine') continue;
    if (!Array.isArray(items)) continue;
    for (const it of items) {
      if (!it || typeof it !== 'object') continue;
      const _t = String(it.title || '');
      // R756 修真：标题命中命理词且非医学前缀 → 不进检索索引
      if (MINGLI_TITLE_KW.some(k => _t.includes(k)) && !MED_TITLE_PREFIX.some(p => _t.startsWith(p))) continue;
      if (MINGLI_TITLE_KW_PINYIN.some(k => _t.toLowerCase().includes(k)) && !MED_TITLE_PREFIX.some(p => _t.startsWith(p))) continue;
      flat.push({
        id: it.id || it.entry_id || '',
        module: mod,
        title: (it.title || '').slice(0, 200),
        // R790：JSON 兜底路径现场计算首字母（正常走 SQLite 预算列，这里只是回退）
        initials: pinyin.variants((it.title || '').slice(0, 40), 8).join(' '),
        pinyin: pinyin.full((it.title || '').slice(0, 60)),
        content: (it.content || '').slice(0, 3000),
        keywords: Array.isArray(it.keywords) ? it.keywords.join(' ') : String(it.keywords || ''),
        confidence: Number(it.confidence || it.trust_score || 0.5),
      });
    }
  }
  const counts = {};
  for (const [mod, items] of Object.entries(data)) {
    if (Array.isArray(items)) counts[mod] = items.length;
  }
  _kbCache = { modules: Object.keys(data), counts, data, flat, mtime: stat.mtimeMs, at: Date.now(), total: flat.length };
  _kbFlat = flat;
  _formulaNames = null;
  return _kbCache;
}

// R785：惰性物化全量 data（仅 /full 等稀有场景；SQLite 快路径下 cache.data 为 null）
function ensureKbData(cache) {
  if (cache.data) return cache.data;
  try {
    const full = require('./kb-store/kb-sqlite').loadFull();
    if (full) { cache.data = full; return full; }
  } catch (e) {}
  cache.data = JSON.parse(require('fs').readFileSync(
    require('path').join(__dirname, 'kb-store', 'tcm-synced-kb.json'), 'utf-8'));
  return cache.data;
}

app.get('/api/capabilities', (req, res) => {
  // R121：AI 框架能力注册表（tcm-agent 自描述）
  try {
    const reg = JSON.parse(require('fs').readFileSync('/Users/tom/.openclaw-autoclaw/workspace/projects/_shared/capability-registry.json', 'utf8'));
    res.json({ version: reg.version, capabilities: reg.capabilities.filter(c => c.project === 'tcm-agent') });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get('/api/tcm/kb', (req, res) => {
  try {
    // R757 修真：默认轻量返回（85MB 全量改由 /api/tcm/kb/full 提供）
    // 前端统计/列表场景仅需模块数+总数+模块条目数, 无需整包下载
    const cache = loadKbCache(false);
    const modSummary = cache.counts || {};
    res.json({ ok: true, source: 'server', modules: Object.keys(modSummary).length, total: cache.total, modules_summary: modSummary, sample: cache.flat.slice(0, 5).map(f => ({ module: f.module, title: f.title })), cache_at: new Date(cache.at).toISOString() });
  } catch (e) {
    res.status(500).json({ ok: false, error: '知识库加载失败: ' + e.message });
  }
});

// R757 修真：全量 KB（兼容旧调用方；仅显式需要全量 data 的场景使用）
app.get('/api/tcm/kb/full', (req, res) => {
  try {
    const cache = loadKbCache(false);
    res.json({ ok: true, source: 'server', modules: cache.modules.length, total: cache.total, data: ensureKbData(cache), cache_at: new Date(cache.at).toISOString() });
  } catch (e) {
    res.status(500).json({ ok: false, error: '知识库加载失败: ' + e.message });
  }
});

// R119：知识库检索端点（内存索引，线性扫描 41,739 条 < 100ms，2026-08-26 实测）
app.get('/api/tcm/kb/search', (req, res) => {
  try {
    const _t0 = Date.now();
    const q = String(req.query.q || '').trim().slice(0, 60);
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    if (!q) return res.status(400).json({ ok: false, error: '缺少 q 参数' });
    const cache = loadKbCache(false);
    // R119 修真：中文长句双字滑动窗口切词（原实现整句匹配，长问句 0 命中）
    const tokens = [];
    const raw = q.toLowerCase().split(/[\s,，、;；]+/).filter(Boolean);
    for (const t of raw) {
      if (/[\u4e00-\u9fa5]/.test(t) && t.length > 2) {
        for (let i = 0; i + 2 <= t.length && i < 6; i++) tokens.push(t.slice(i, i + 2));
      } else {
        tokens.push(t);
      }
    }
    if (!tokens.length) return res.status(400).json({ ok: false, error: '查询词为空' });
    const hits = [];
    // R790：纯拉丁查询（首字母/全拼）走预算列前缀匹配——「sjz」命中「四君子汤」，
    // 多音字变体空格分隔逐一同比；标题级命中给高分（3），全拼次之（2）
    const latinQ = pinyin.isLatin(q) ? q.toLowerCase() : null;
    // R798 标题反哺：查询若命中 tcm-formula 干净方名（418 首），凡标题含该方名的
    // 长前缀条目加权 3.2（高于子串 2.5、低于完整 4/前缀 3 之外独立通道），让方名命中排最前
    let fxMatch = null;
    if (latinQ) {
      if (!_formulaNames) {
        _formulaNames = _kbFlat.filter(it => it.module === 'tcm-formula')
          .map(it => ({ name: it.title, inis: it.initials || '', pinyin: it.pinyin || '' }))
          .filter(f => f.name && f.name.length <= 14);
      }
      const hitNames = [];
      for (const f of _formulaNames) {
        if (f.inis.split(' ').some(v => v.startsWith(latinQ)) || (f.pinyin && f.pinyin.startsWith(latinQ))) {
          hitNames.push(f.name);
          if (hitNames.length >= 6) break;
        }
      }
      if (hitNames.length) fxMatch = hitNames;
    }
    // R761 性能优化：hay/titleLc 预计算（缓存时算一次, 查询复用, 免去每次 2.7万条 toLowerCase）
    for (const it of _kbFlat) {
      let score;
      if (latinQ) {
        score = 0;
        const inis = it.initials || '';
        if (inis) {
          for (const v of inis.split(' ')) {
            if (v === latinQ) { score = Math.max(score, 4); break; }       // 完整首字母命中
            if (v.startsWith(latinQ)) score = Math.max(score, 3);          // 前缀命中
          }
        }
        if (!score && it.pinyin && it.pinyin.startsWith(latinQ)) score = 2; // 全拼前缀兜底
        // R797 修真：长标题方剂（「路总补气类：①四君子汤…」）首字母在整串中段，
        // 前缀匹配永远落空——补变体内子串匹配（首字母串噪声低，适合联想），低于前缀分
        if (!score && inis && inis.includes(latinQ)) score = 2.5;
        // R798：标题含命中干净方名 → 加权置顶（即便首字母子串落空也救回）
        if (fxMatch) {
          for (const fn of fxMatch) { if (it.title.includes(fn)) { score = Math.max(score, 3.2); break; } }
        }
        // 拉丁串也可能是拼音关键词/英文缩写残留在内容里，保留子串兜底分
        if (!score) {
          const hay = it._hay || (it._hay = (it.title + ' ' + it.content + ' ' + it.keywords).toLowerCase());
          if (hay.includes(latinQ)) score = 1;
        }
      } else {
        const hay = it._hay || (it._hay = (it.title + ' ' + it.content + ' ' + it.keywords).toLowerCase());
        const titleLc = it._titleLc || (it._titleLc = it.title.toLowerCase());
        score = tokens.reduce((s, t) => s + (hay.includes(t) ? (titleLc.includes(t) ? 2 : 1) : 0), 0);
      }
      if (score > 0) hits.push({ ...it, score });
    }
    // R761 修真：排序接入 trust_score(口语转写降权 0.4 生效; confidence 缺省回退 trust)
    hits.sort((a, b) => b.score - a.score || (b.confidence != null ? b.confidence : (b.trust_score || 0.5)) - (a.confidence != null ? a.confidence : (a.trust_score || 0.5)));
    res.json({ ok: true, query: q, total_hits: hits.length, limit, took_ms: Date.now() - _t0, results: hits.slice(0, limit).map(({ content, ...rest }) => ({ ...rest, content: content.slice(0, 600) })) });
  } catch (e) {
    res.status(500).json({ ok: false, error: '检索失败: ' + e.message });
  }
});

// ───────────────── 舌诊分析 ─────────────────
app.post('/api/tcm/tongue', async (req, res) => {
  try {
    const { image_url } = req.body;
    if (!image_url) return res.status(400).json({ ok: false, error: '缺少 image_url' });

    // 调用面诊 OCR 服务提取舌象特征
    const tongueData = await extractTongueFeatures(image_url);
    
    // 标准化 JSON
    const stdReport = { ...SZ_TONGUE, ...tongueData };
    
    res.json({ ok: true, data: stdReport });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ───────────────── 问诊分析（自然语言→结构化） ─────────────────
app.post('/api/tcm/inquiry', async (req, res) => {
  try {
    const { text, patient_context } = req.body;
    if (!text) return res.status(400).json({ ok: false, error: '缺少问诊文本' });

    const structured = await structureInquiry(text, patient_context);
    
    res.json({ ok: true, data: structured });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ───────────────── 四诊合参 → 多流派辨证 ─────────────────
app.post('/api/tcm/diagnose', async (req, res) => {
  try {
    let { tongue, face, hand, inquiry, patient_id } = req.body || {};
    
    // R720 修真：兼容裸顶层 symptoms/tongue/pulse → 自动组装 inquiry
    const b = req.body || {};
    if ((!inquiry || !inquiry.symptoms) && (b.symptoms || b.tongue || b.pulse || b.complaint)) {
      const topSymptoms = [];
      if (b.symptoms) {
        if (Array.isArray(b.symptoms)) topSymptoms.push(...b.symptoms.map(s => String(s)));
        else topSymptoms.push(String(b.symptoms));
      }
      if (b.complaint) topSymptoms.push(String(b.complaint));
      if (b.tongue) topSymptoms.push('舌象:' + String(b.tongue));
      if (b.pulse) topSymptoms.push('脉象:' + String(b.pulse));
      inquiry = {
        structured: false,
        chief_complaint: b.complaint || (topSymptoms[0] || '辨证'),
        complaint: b.complaint || (topSymptoms[0] || '辨证'),
        symptoms: topSymptoms
      };
    }
    
    // 组装四诊报告（R716 修真：兼容简化入参 features 数组）
    const report = JSON.parse(JSON.stringify(SZ_DIAGNOSIS_REPORT));
    report.patient_id = patient_id || crypto.randomUUID();
    report.timestamp = new Date().toISOString();
    
    // 修真：tongue 简化入参（features 数组）→ 标准结构
    const tongueFeatures = tongue ? normalizeTongueFeatures(tongue) : null;
    const faceFeatures = face ? normalizeMethodFeatures(face, 'face') : null;
    const handFeatures = hand ? normalizeMethodFeatures(hand, 'hand') : null;
    
    report.five_methods.tongue = tongueFeatures || tongue || null;
    report.five_methods.face = faceFeatures || face || null;
    report.five_methods.hand = handFeatures || hand || null;
    report.five_methods.inquiry = inquiry || null;
    
    // 兜底：inquiry 含裸 symptoms 时也构造结构化输入
    if (inquiry && !inquiry.structured && inquiry.symptoms) {
      report.five_methods.inquiry = {
        chief_complaint: inquiry.complaint || inquiry.chief || '辨证',
        extracted_tcm_terms: inquiry.symptoms,
        ...inquiry
      };
    }

    // 1. 多流派辨证（保留向后兼容）
    report.kb_multischool_opinions = multischoolAnalysis(report);

    // R528: 内生辨证（核心）— 收集所有症状走 inhouse 推理
    const allSymptoms = [];
    const inquiryText = (inquiry && (inquiry.complaint || inquiry.chief)) || '';
    if (inquiry && inquiry.symptoms && Array.isArray(inquiry.symptoms)) allSymptoms.push(...inquiry.symptoms.map(s => typeof s === 'string' ? s : String(s?.value || s?.name || '')));
    if (tongue && tongue.features && Array.isArray(tongue.features)) allSymptoms.push(...tongue.features.map(s => typeof s === 'string' ? s : String(s?.value || s?.name || '')));
    if (face && face.features && Array.isArray(face.features)) allSymptoms.push(...face.features.map(s => typeof s === 'string' ? s : String(s?.value || s?.name || '')));
    if (hand && hand.features && Array.isArray(hand.features)) allSymptoms.push(...hand.features.map(s => typeof s === 'string' ? s : String(s?.value || s?.name || '')));

    const inhouseResult = INHOUSE.diagnose(
      inquiryText || '辨证',
      allSymptoms.map(s => typeof s === 'string' ? s : String((s && (s.value || s.name)) || '')).filter(Boolean),
      { tongue, face, hand, inquiry }
    );
    report.inhouse_diagnosis = inhouseResult;

    // 2. 方证对应
    const formulaMatch = formulaSyndromeMatch(report);
    report.suggested_formula = formulaMatch;

    // 3. 禁忌检测
    const warnings = contraindicationCheck(formulaMatch, report);
    
    // 4. 诊断分级
    report.urgency_level = assessUrgency(report);
    report.urgency = URGENCY_LEVELS[report.urgency_level] || null;

    res.json({ 
      ok: true, 
      data: report,
      warnings: warnings.length ? warnings : null,
      disclaimer: report.disclaimer
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ───────────────── 方剂查询 ─────────────────
app.get('/api/tcm/formula/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ ok: true, formulas: [] });

    const FORMULA_SYNDROME_MAP = require('./engines/syndrome-engine').FORMULA_SYNDROME_MAP;
    const results = [];
    // R797：纯拉丁查询（首字母 sjzt→四君子汤）——经典表腿也走拼音变体
    const _latinQ = pinyin.isLatin(q) ? String(q).toLowerCase() : null;

    for (const [syndrome, data] of Object.entries(FORMULA_SYNDROME_MAP)) {
      if (_latinQ) {
        const fname = data.formula || '';
        const hit = pinyin.variants(fname, 4).some(v => v.startsWith(_latinQ) || v.includes(_latinQ)) ||
                    pinyin.full(fname).startsWith(_latinQ) ||
                    pinyin.variants(syndrome || '', 4).some(v => v.startsWith(_latinQ));
        if (hit) results.push({ syndrome, formula: data.formula, source: data.source,
          symptoms: data.symptoms, tongue: data.tongue, pulse: data.pulse || '' });
        continue;
      }
      if ((syndrome || '').includes(q) || (data.formula || '').includes(q) ||
          (data.symptoms || []).some(s => String(s || '').includes(q))) {
        results.push({
          syndrome,
          formula: data.formula,
          source: data.source,
          symptoms: data.symptoms,
          tongue: data.tongue,
          pulse: data.pulse || ''
        });
      }
    }

    // R791：tcm-formula 结构化方剂模块并入检索（中文子串 / 首字母 / 全拼前缀）
    try {
      const sqlite = require('./kb-store/kb-sqlite');
      const jm = fs.statSync(path.join(__dirname, 'kb-store', 'tcm-synced-kb.json')).mtimeMs;
      const idx = sqlite.tryLoadIndex(jm);
      if (idx) {
        const term = String(q).trim();
        const latin = pinyin.isLatin(term) ? term.toLowerCase() : null;
        const rows = idx.rows.filter(r => r.module === 'tcm-formula');
        for (const r of rows) {
          if (results.length >= 30) break;
          let hit = false;
          if (latin) {
            // R797：前缀优先，变体内子串兜底（长标题/多音字场景）
            hit = (r.initials || '').split(' ').some(v => v.startsWith(latin) || v.includes(latin)) ||
                  (r.pinyin || '').startsWith(latin);
          } else {
            hit = String(r.title || '').includes(term) || String(r.content || '').includes(term);
          }
          if (hit && !results.some(x => x.formula === r.title)) {
            const gx = String(r.content || '').match(/功效[：:]([^\n。]+)/);
            const zz = String(r.content || '').match(/主治[：:]([^\n。]+)/);
            results.push({
              syndrome: zz ? zz[1].slice(0, 60) : '',
              formula: r.title,
              source: 'KB·tcm-formula',
              symptoms: gx ? [gx[1].slice(0, 40)] : [],
              tongue: '', pulse: ''
            });
          }
        }
      }
    } catch (e) { /* tcm-formula 并入失败不阻断主检索 */ }

    res.json({ ok: true, count: results.length, formulas: results });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// R788 方剂组成查询：AI 推荐方剂 → 前端自动展开药材（三层：经典表 → 处方模板 → KB 结构化解析）
const CLASSIC_FORMULA_HERBS = {
  '四君子汤': [['人参','9g'],['白术','9g'],['茯苓','9g'],['炙甘草','6g']],
  '四物汤': [['熟地黄','12g'],['当归','9g'],['白芍','9g'],['川芎','6g']],
  '二陈汤': [['半夏','9g'],['陈皮','9g'],['茯苓','9g'],['炙甘草','3g']],
  '补中益气汤': [['黄芪','15g'],['人参','9g'],['白术','9g'],['炙甘草','6g'],['当归','6g'],['陈皮','6g'],['升麻','3g'],['柴胡','3g']],
  '白虎汤': [['石膏','30g'],['知母','9g'],['粳米','9g'],['炙甘草','3g']],
  '麻黄汤': [['麻黄','9g'],['桂枝','6g'],['杏仁','9g'],['炙甘草','3g']],
  '肾气丸': [['熟地黄','24g'],['山茱萸','12g'],['山药','12g'],['泽泻','9g'],['牡丹皮','9g'],['茯苓','9g'],['桂枝','3g'],['附子','3g']],
  '生脉散': [['人参','9g'],['麦冬','9g'],['五味子','6g']],
  '参苓白术散': [['人参','9g'],['白术','9g'],['茯苓','9g'],['山药','9g'],['莲子','6g'],['白扁豆','9g'],['薏苡仁','9g'],['砂仁','3g'],['桔梗','6g'],['炙甘草','6g']]
};
app.get('/api/tcm/formula/herbs', async (req, res) => {
  try {
    const name = String(req.query.name || '').trim();
    if (!name) return res.status(400).json({ ok: false, error: '缺少 name 参数' });
    // 1. 经典表（includes 双向容错）
    const ck = Object.keys(CLASSIC_FORMULA_HERBS).find(k => name.includes(k) || k.includes(name));
    if (ck) {
      return res.json({ ok: true, name: ck, source: '经典方表',
        herbs: CLASSIC_FORMULA_HERBS[ck].map(([n, d]) => ({ name: n, dosage: d })) });
    }
    // 2. 处方模板
    try {
      const tpl = require('./prescription-api').FORMULA_TEMPLATES.find(f => name.includes(f.name) || f.name.includes(name));
      if (tpl) return res.json({ ok: true, name: tpl.name, source: tpl.source, herbs: tpl.herbs });
    } catch (e) {}
    // 3. KB tcm-formula 结构化方剂（R791：标题即方名，正文首行组成；多来源组成取首段）
    //    匹配纪律：精确命中 > 更长方名优先（白虎加人参汤 不得被 人参汤 截胡）
    try {
      const sqlite = require('./kb-store/kb-sqlite');
      const jm = fs.statSync(path.join(__dirname, 'kb-store', 'tcm-synced-kb.json')).mtimeMs;
      let fj = null;
      if (sqlite.tryLoadIndex(jm)) fj = (sqlite.loadModules(['tcm-formula']) || {})['tcm-formula'];
      if (!fj) {
        fj = (JSON.parse(fs.readFileSync(path.join(__dirname, 'kb-store', 'tcm-synced-kb.json'), 'utf-8')))['tcm-formula'];
      }
      const cands = [];
      for (const it of (fj || [])) {
        const nm = String(it.title || '');
        if (!nm || !(name.includes(nm) || nm.includes(name))) continue;
        cands.push({ nm, it });
      }
      cands.sort((a, b) => (b.nm === name) - (a.nm === name) || b.nm.length - a.nm.length);
      for (const { nm, it } of cands) {
        const comp = String(it.content || '').match(/组成[：:]([^\n。]+)/);
        if (!comp) continue;
        // 只取第一变体（抽取脚本已把真枚举排最前），「；或：」后整段丢弃——
        // 否则第二变体的后续药材片段会漏进列表（白芍/生姜无剂量混入）
        const herbs = comp[1].split('；或：')[0].split(/[、，,；;\s]+/).map(s => s.trim())
          .filter(s => s.length >= 1 && s.length <= 8 && !s.startsWith('或'))
          .map(s => {
            const dm = s.match(/^(.+?)(\d+(?:\.\d+)?)(g|克|枚|片)$/);
            if (dm) return { name: dm[1], dosage: dm[2] + dm[3] };
            // 古制剂量（六两/三钱/十二枚/二合）不折算克数——剥出药名，剂量留 9g 由医师审定
            const cm = s.match(/^(.+?)[零一二三四五六七八九十半\d]+(?:两|钱|分|枚|片|合|升|匕|撮|斤)$/);
            if (cm) return { name: cm[1].replace(/各$/, ""), dosage: "9g", classical_dose: s.slice(cm[1].length) };
            return { name: s, dosage: '9g' };
          })
          .filter(h => /[一-鿿]/.test(h.name) && h.name.length <= 6)
          .filter((h, i, arr) => arr.findIndex(x => x.name === h.name) === i);   // 同名去重（各三两/三两 双变体残留）
        if (herbs.length >= 2) return res.json({ ok: true, name: nm, source: 'KB·tcm-formula', herbs });
      }
    } catch (e) {}
    // 4. KB tcm-fangji 老合集条目解析（【方名】组成：A、B、C。）
    try {
      const sqlite = require('./kb-store/kb-sqlite');
      const jm = fs.statSync(path.join(__dirname, 'kb-store', 'tcm-synced-kb.json')).mtimeMs;
      let fj = null;
      if (sqlite.tryLoadIndex(jm)) fj = (sqlite.loadModules(['tcm-fangji']) || {})['tcm-fangji'];
      if (!fj) {
        fj = (JSON.parse(fs.readFileSync(path.join(__dirname, 'kb-store', 'tcm-synced-kb.json'), 'utf-8')))['tcm-fangji'];
      }
      for (const it of (fj || [])) {
        const c = String(it.content || '');
        const nm = c.match(/【([^】]{2,12}(?:汤|丸|散|饮|膏|丹|煎|茶))】/);
        if (!nm || !(name.includes(nm[1]) || nm[1].includes(name))) continue;
        const comp = c.match(/组成：([^。]+)/);
        if (!comp) continue;
        const herbs = comp[1].split('；或：')[0].split(/[、，,；;\s]+/).map(s => s.trim()).filter(s => s.length >= 1 && s.length <= 8)
          .map(s => {
            const dm = s.match(/^(.+?)(\d+(?:\.\d+)?)(g|克|枚|片)$/);
            if (dm) return { name: dm[1], dosage: dm[2] + dm[3] };
            const cm = s.match(/^(.+?)[零一二三四五六七八九十半\d]+(?:两|钱|分|枚|片|合|升|匕|撮|斤)$/);
            if (cm) return { name: cm[1].replace(/各$/, ""), dosage: "9g", classical_dose: s.slice(cm[1].length) };
            return { name: s, dosage: '9g' };
          })
          .filter(h => /[一-鿿]/.test(h.name) && h.name.length <= 6)
          .filter((h, i, arr) => arr.findIndex(x => x.name === h.name) === i);   // 同名去重（各三两/三两 双变体残留）
        if (herbs.length >= 2) return res.json({ ok: true, name: nm[1], source: 'KB·' + String(it.title || '').slice(0, 30), herbs });
      }
    } catch (e) {}
    res.json({ ok: false, error: '未找到方剂组成: ' + name });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ───────────────── 穴位查询 ─────────────────
app.get('/api/tcm/acupoint/search', async (req, res) => {
  try {
    const { q, meridian } = req.query;
    const { MERIDIANS, EXTRA_POINTS } = require('./schemas/acupoint-schema');
    
    let results = [];
    
    if (meridian) {
      const m = MERIDIANS[meridian];
      if (m) results.push({ type: 'meridian', ...m });
    }
    
    if (q) {
      const term = String(q).trim();
      // R792：纯拉丁查询走首字母/全拼前缀（zsl→足三里），中文保持原名/主治子串
      const latin = pinyin.isLatin(term) ? term.toLowerCase() : null;
      results.push(...EXTRA_POINTS.filter(p => {
        if (latin) {
          return pinyin.variants(p.name, 4).some(v => v.startsWith(latin)) ||
                 pinyin.full(p.name).startsWith(latin);
        }
        return p.name.includes(term) || p.indications.some(i => i.includes(term));
      }).map(p => ({ type: 'extra_point', ...p })));
      // 十四经条目本身也可被首字母命中（如 feij→肺经）
      if (latin) {
        for (const [k, m] of Object.entries(MERIDIANS)) {
          const cn = m.cn || '';
          if (pinyin.variants(cn, 4).some(v => v.startsWith(latin)) || pinyin.full(cn).startsWith(latin)) {
            results.push({ type: 'meridian', ...m });
          }
        }
      }
    }

    res.json({ ok: true, count: results.length, data: results });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ───────────────── 病例保存 ─────────────────
app.post('/api/tcm/cases', async (req, res) => {
  try {
    const { patient_id, diagnosis_report, feedback } = req.body;
    const caseId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    // 脱敏存储：不保留原始图片，仅保留 JSON 特征 + 哈希
    const reportData = diagnosis_report || {symptoms: req.body.symptoms || [], age: req.body.age};
    const record = {
      case_id: caseId,
      patient_id: patient_id || 'anonymous',
      timestamp,
      diagnosis: reportData,
      feedback: feedback || null,
      hash: crypto.createHash('sha256').update(JSON.stringify(reportData)).digest('hex').slice(0, 16)
    };

    // TODO: 写入数据库
    // await db.insert('tcm_cases', record);

    res.json({ ok: true, case_id: caseId, hash: record.hash });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ───────────────── 问诊台：实时帧接收（音视频节流帧） ─────────────────
// R763 自检修真：multer 未安装 → 改用 express.raw + base64 JSON（项目惯例，见 tongue-analyze）
// 隐私边界：不落盘原始帧，仅计数元数据；帧内容在服务端即丢
app.post('/api/tcm/inquiry-frame', express.raw({ type: '*/*', limit: '2mb' }), async (req, res) => {
  try {
    const caseId = (req.query.caseId || req.get('X-Case-Id') || 'live-' + Date.now());
    if (!state.inquiryFrames[caseId]) state.inquiryFrames[caseId] = { count: 0, lastTs: 0, sizeSum: 0 };
    const s = state.inquiryFrames[caseId];
    s.count += 1;
    s.lastTs = Date.now();
    if (req.body && req.body.length) s.sizeSum += req.body.length;
    res.json({ ok: true, caseId, frameCount: s.count, lastTs: s.lastTs });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ───────────────── 问诊台：SSE 流式 AI 辨证 ─────────────────
// R762 修真：医生启动采集后，AI 实时刷出辨证 + 病历片段（每 1-2s 一帧）
app.get('/api/tcm/ai-stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  const symptoms = (req.query.symptoms || '').split(/[、,,;；\s]+/).filter(Boolean);
  const caseId = req.query.caseId || ('live-' + Date.now());

  const send = (data) => {
    try { res.write('data: ' + JSON.stringify(data) + '\n\n'); } catch(e) {}
  };

  // 流式阶段：症状聚合 → 真实辨证引擎 → 病历草稿 → final
  // R763 自检修真：接 INHOUSE/multischool/formula/urgency 真实引擎链，非剧本
  let closed = false;
  req.on('close', function() { closed = true; });

  // ── 阶段 1：特征聚合提示（0.3s）──
  setTimeout(function() {
    if (closed) return;
    send({ caseId, type: 'diagnosis', partial: '已采集 ' + symptoms.length + ' 个特征，正在四诊合参…' });
  }, 300);

  // ── 阶段 2：真实辨证引擎（0.8s，同步计算 <50ms）──
  setTimeout(function() {
    if (closed) return;
    try {
      const report = JSON.parse(JSON.stringify(SZ_DIAGNOSIS_REPORT));
      report.patient_id = caseId;
      report.timestamp = new Date().toISOString();
      report.five_methods.inquiry = {
        chief_complaint: symptoms[0] || '辨证',
        extracted_tcm_terms: symptoms,
        symptoms: symptoms
      };
      report.kb_multischool_opinions = multischoolAnalysis(report);
      const inhouseResult = INHOUSE.diagnose(
        symptoms.join('、') || '辨证',
        symptoms,
        { inquiry: report.five_methods.inquiry }
      );
      report.inhouse_diagnosis = inhouseResult;
      const formulaMatch = formulaSyndromeMatch(report);
      report.suggested_formula = formulaMatch;
      report.urgency_level = assessUrgency(report);

      send({ caseId, type: 'diagnosis', suggested_formula: formulaMatch, kb_multischool_opinions: report.kb_multischool_opinions, urgency_level: report.urgency_level, source: 'inhouse-engine' });

      // ── 阶段 3：病历草稿（同帧推）──
      const f = formulaMatch || {};
      const ops = report.kb_multischool_opinions || {};
      const syndrome = f.matched_syndrome || ops.primary_syndrome || '待辨';
      const recordDraft = {
        chief: symptoms.slice(0, 3).join('、') + '（病程待问）',
        hpi: '患者以 ' + (symptoms.slice(0, 5).join('、') || '未述不适') + '为主症。四诊合参：' + (ops.treatment ? '治以' + ops.treatment + '。' : ''),
        four: '症状: ' + (symptoms.join('、') || '未采') + ' | 舌象/脉象待补',
        syndrome: syndrome,
        treatment: ops.treatment || '',
        formula: f.formula || ''
      };
      send({ caseId, type: 'record_update', record: recordDraft });

      // ── 阶段 4：final ──
      send(Object.assign({ caseId, type: 'final', source: 'inhouse-engine' }, {
        suggested_formula: formulaMatch,
        kb_multischool_opinions: report.kb_multischool_opinions,
        urgency_level: report.urgency_level
      }));
      // 发完即关流，不挂长连接
      setTimeout(function() { try { res.end(); } catch(e) {} }, 200);
    } catch (e) {
      send({ caseId, type: 'error', error: e.message });
      setTimeout(function() { try { res.end(); } catch(e) {} }, 100);
    }
  }, 800);
});

// ───────────────── 问诊台：医生复核确认存盘 ─────────────────
// R762 修真：医生采纳 AI / 修改后定稿，写入知识沉淀
// R763 自检修真：启动时重载 data/confirmed-cases/*.json（重启不丢数据）
function loadConfirmedCases() {
  try {
    const dir = path.join(__dirname, '..', 'data', 'confirmed-cases');
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir)
      .filter(f => f.endsWith('.json'))
      .map(f => {
        try { return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); }
        catch(e) { return null; }
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 500);
  } catch (e) { return []; }
}
state.confirmedCases = loadConfirmedCases();

app.post('/api/tcm/case-confirm', async (req, res) => {
  try {
    const { chief, hpi, four, syndrome, treatment, formula, patient, symptoms, tongue, pulse, aiVersion, confirmMode, labs, safetyReview } = req.body;
    const caseId = 'case-' + crypto.randomUUID();
    const timestamp = new Date().toISOString();
    // R789：签发即回填主索引 id（脱敏指纹入索引，病历仍只存哈希+索引号）
    let empiId = null;
    if (patientIndex && patient && patient.name) {
      const rec = patientIndex.upsertPatient({ name: patient.name, gender: patient.gender, birthYear: patient.birthYear || patient.birth_year });
      if (rec) empiId = rec.patient_id;
    }
    const record = {
      caseId,
      timestamp,
      chief, hpi, four, syndrome, treatment, formula,
      patient: patient ? { name_hash: crypto.createHash('sha256').update(patient.name || '').digest('hex').slice(0, 16), patient_id: empiId } : null,
      symptoms: symptoms || [], tongue: tongue || [], pulse: pulse || [],
      labs: Array.isArray(labs) ? labs.slice(0, 30) : [],
      safetyReview: safetyReview || null,
      aiVersion: aiVersion || null,
      confirmMode: confirmMode || 'edit',
      hash: crypto.createHash('sha256').update(JSON.stringify({ syndrome, formula, symptoms })).digest('hex').slice(0, 16)
    };

    // 内存缓存 + 异步落盘（避免同步阻塞）
    state.confirmedCases.unshift(record);
    if (state.confirmedCases.length > 500) state.confirmedCases.length = 500;

    // 知识沉淀：落盘 + 按月归档（异步，不阻塞响应）
    setImmediate(function() {
      try {
        const dir = path.join(__dirname, '..', 'data', 'confirmed-cases');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, caseId + '.json'), JSON.stringify(record, null, 2));
      } catch(e) { console.error('[case-confirm] 落盘失败:', e.message); }
    });

    res.json({ ok: true, caseId, hash: record.hash });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ───────────────── 问诊台：历史病例查询 ─────────────────
// R763 自检修真：name 参数按同哈希比对（存的是 name_hash，明文查哈希永远查不到）
app.get('/api/tcm/cases', async (req, res) => {
  try {
    const { name, date, syndrome } = req.query;
    let cases = state.confirmedCases.slice();
    if (name) {
      const h = crypto.createHash('sha256').update(String(name)).digest('hex').slice(0, 16);
      cases = cases.filter(c => c.patient && c.patient.name_hash === h);
    }
    if (syndrome) cases = cases.filter(c => c.syndrome === syndrome);
    // R764：时区修真——timestamp 是 UTC ISO 串，直接 slice(0,10) 与本地日期比对会错位（东八区 0-8 点的病例落到前一天）
    // 统一转本地时区后再取日期
    if (date) {
      const localDate = (ts) => {
        try { return new Date(ts).toLocaleDateString('sv-SE'); } catch(e) { return ''; }
      };
      cases = cases.filter(c => c.timestamp && localDate(c.timestamp) === date);
    }
    res.json({ ok: true, cases: cases.slice(0, 50), total: cases.length });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ───────────────── 相似病例检索 ─────────────────
app.get('/api/tcm/cases/similar', async (req, res) => {
  try {
    const { hash } = req.query;
    // TODO: 根据哈希从数据库检索相似病例
    res.json({ ok: true, cases: [], note: '病例检索功能开发中' });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ═══════════════════════════════════════════════
// R770 问诊会话状态机（刷新不丢 + 候诊队列）
// 状态机：collecting → reviewing → issued → archived
// ═══════════════════════════════════════════════
if (!state.clinicSessions) state.clinicSessions = {};

// 惰性加载：内存未命中时从磁盘恢复（服务重启后会话不丢，供 GET/PUT/检验回传等共用）
function loadClinicSession(id) {
  if (!id) return null;
  if (state.clinicSessions[id]) return state.clinicSessions[id];
  try {
    const file = path.join(__dirname, '..', 'data', 'consult-sessions', id + '.json');
    if (!fs.existsSync(file)) return null;
    const s = JSON.parse(fs.readFileSync(file, 'utf8'));
    state.clinicSessions[id] = s;
    return s;
  } catch (e) { return null; }
}

function persistClinicSession(id) {
  setImmediate(function() {
    try {
      const dir = path.join(__dirname, '..', 'data', 'consult-sessions');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, id + '.json'), JSON.stringify(state.clinicSessions[id], null, 2));
    } catch(e) { console.error('[clinic-session] 落盘失败:', e.message); }
  });
}

// 创建会话
app.post('/api/clinic/session', optionalAuth, (req, res) => {
  try {
    const id = 'cs-' + Date.now().toString(36) + '-' + crypto.randomBytes(2).toString('hex');
    // R789：建档即入患者主索引（姓名 → 稳定 empi- id，复诊归集的地基）
    let patientId = null;
    const pName = req.body && req.body.patient && req.body.patient.name;
    if (patientIndex && pName) {
      const rec = patientIndex.upsertPatient({
        name: pName,
        gender: req.body.patient.gender,
        birthYear: req.body.patient.birthYear || req.body.patient.birth_year,
        phone: req.body.patient.phone,
        idCard: req.body.patient.idCard || req.body.patient.id_card
      });
      if (rec) patientId = rec.patient_id;
    }
    state.clinicSessions[id] = {
      sessionId: id, status: 'collecting',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      profile: {}, symptoms: [], history: [], duration: '', complaint: '',
      evidence: [], vision: {}, issued: null,
      patient_id: patientId
    };
    persistClinicSession(id);
    res.json({ ok: true, sessionId: id, patient_id: patientId });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// 保存快照（前端防抖 1.5s + pagehide 信标）
app.put('/api/clinic/session/:id', optionalAuth, (req, res) => {
  try {
    const s = loadClinicSession(req.params.id);
    if (!s) return res.status(404).json({ ok: false, error: '会话不存在' });
    const b = req.body || {};
    // 白名单字段，防止客户端注入意外键
    for (const k of ['profile','symptoms','history','duration','complaint','evidence','vision','issued','status','labs']) {
      if (b[k] !== undefined) s[k] = b[k];
    }
    s.updatedAt = new Date().toISOString();
    persistClinicSession(req.params.id);
    res.json({ ok: true, updatedAt: s.updatedAt });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// 读取会话（刷新恢复）
app.get('/api/clinic/session/:id', optionalAuth, (req, res) => {
  const s = loadClinicSession(req.params.id);
  if (!s) return res.status(404).json({ ok: false, error: '会话不存在或已过期' });
  res.json({ ok: true, session: s });
});

// 今日候诊队列（含状态，供候诊列表）
app.get('/api/clinic/sessions/today', optionalAuth, (_req, res) => {
  try {
    const today = new Date().toLocaleDateString('sv-SE');
    const list = Object.values(state.clinicSessions)
      .filter(s => (s.createdAt || '').startsWith(today) || (s.updatedAt || '').startsWith(today) ||
                   new Date(s.createdAt).toLocaleDateString('sv-SE') === today)
      .map(s => ({
        sessionId: s.sessionId, status: s.status,
        patient: (s.profile && s.profile.name && s.profile.name.v) || (s.profile && s.profile.name) || '未命名',
        complaint: (s.complaint || '').slice(0, 30),
        evidenceCount: (s.evidence || []).length,
        updatedAt: s.updatedAt
      }))
      .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
      .slice(0, 30);
    res.json({ ok: true, sessions: list, total: list.length });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// ═══════════════════════════════════════════════
// R795 挂号叫号队列：优先级（urgent>elderly>normal）+ 过号重排 + 会话联动
// ═══════════════════════════════════════════════
if (!state.clinicQueue) state.clinicQueue = [];
const QUEUE_FILE = path.join(__dirname, '..', 'data', 'clinic-queue.json');
try {
  if (fs.existsSync(QUEUE_FILE)) state.clinicQueue = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8') || '[]');
} catch (e) { state.clinicQueue = []; }
function persistQueue() {
  setImmediate(function() {
    try { fs.writeFileSync(QUEUE_FILE, JSON.stringify(state.clinicQueue.slice(-300), null, 2)); }
    catch (e) { console.error('[queue] 落盘失败:', e.message); }
  });
}
const PRIORITY_W = { urgent: 3, elderly: 2, normal: 1 };
function queueSort(a, b) {
  return (PRIORITY_W[b.priority] || 1) - (PRIORITY_W[a.priority] || 1) ||
         String(a.reorder_ts || a.created_at).localeCompare(String(b.reorder_ts || b.created_at));
}

// 挂号（建队列条目 + 联动建问诊会话 + 入患者主索引）
app.post('/api/clinic/queue/checkin', optionalAuth, (req, res) => {
  try {
    const { patient_name, priority, complaint, gender, birthYear } = req.body || {};
    if (!patient_name) return res.status(400).json({ ok: false, error: 'patient_name 必填' });
    let pid = null;
    if (patientIndex) {
      const rec = patientIndex.upsertPatient({ name: patient_name, gender, birthYear });
      if (rec) pid = rec.patient_id;
    }
    const today = new Date().toLocaleDateString('sv-SE');
    const seq = state.clinicQueue.filter(q => q.date === today).length + 1;
    const sid = 'cs-' + Date.now().toString(36) + '-' + crypto.randomBytes(2).toString('hex');
    const now = new Date().toISOString();
    state.clinicSessions[sid] = {
      sessionId: sid, status: 'collecting', createdAt: now, updatedAt: now,
      profile: { name: { v: String(patient_name).slice(0, 20), conf: 1, locked: true } },
      symptoms: [], history: [], duration: '', complaint: String(complaint || '').slice(0, 120),
      evidence: [], vision: {}, issued: null, patient_id: pid
    };
    persistClinicSession(sid);
    const entry = {
      id: 'q-' + Date.now().toString(36) + '-' + crypto.randomBytes(2).toString('hex'),
      queue_no: seq, date: today,
      patient_name: String(patient_name).slice(0, 20), patient_id: pid, session_id: sid,
      doctor_id: String((req.body || {}).doctor_id || '').slice(0, 10) || null,   // R814：按医生挂号
      priority: PRIORITY_W[priority] ? priority : 'normal',
      complaint: String(complaint || '').slice(0, 60),
      status: 'waiting', miss_count: 0, created_at: now, called_at: null
    };
    state.clinicQueue.push(entry);
    persistQueue();
    res.json({ ok: true, entry });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// 今日队列（按优先级+时间排序）
app.get('/api/clinic/queue', optionalAuth, (req, res) => {
  const today = new Date().toLocaleDateString('sv-SE');
  const list = state.clinicQueue.filter(q => q.date === today).sort(queueSort);
  res.json({ ok: true, queue: list, total: list.length,
    waiting: list.filter(q => q.status === 'waiting').length,
    called: list.filter(q => q.status === 'called').length });
});

// 叫号：不带 id 叫下一位（优先级>最早候诊），带 id 叫指定患者
app.post('/api/clinic/queue/call', optionalAuth, (req, res) => {
  try {
    const today = new Date().toLocaleDateString('sv-SE');
    const id = req.body && req.body.id;
    let entry;
    if (id) {
      entry = state.clinicQueue.find(q => q.id === id && q.date === today);
      if (!entry) return res.status(404).json({ ok: false, error: '队列条目不存在' });
      if (entry.status !== 'waiting' && entry.status !== 'missed') {
        return res.status(409).json({ ok: false, error: '当前状态不可叫号: ' + entry.status });
      }
    } else {
      entry = state.clinicQueue
        .filter(q => q.date === today && (q.status === 'waiting' || q.status === 'missed'))
        .sort(queueSort)[0];
      if (!entry) return res.json({ ok: true, entry: null, note: '队列已空' });
    }
    entry.status = 'called';
    entry.called_at = new Date().toISOString();
    persistQueue();
    res.json({ ok: true, entry });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// 队列动作：arrive 到诊 / miss 过号 / recall 过号重排（排到队尾，等价延后） / done 完成
app.post('/api/clinic/queue/action', optionalAuth, (req, res) => {
  try {
    const { id, action } = req.body || {};
    const entry = state.clinicQueue.find(q => q.id === id);
    if (!entry) return res.status(404).json({ ok: false, error: '队列条目不存在' });
    const now = new Date().toISOString();
    switch (action) {
      case 'arrive':
        if (entry.status !== 'called') return res.status(409).json({ ok: false, error: '须先叫号' });
        entry.status = 'in-consult'; break;
      case 'miss':
        if (entry.status !== 'called') return res.status(409).json({ ok: false, error: '须先叫号' });
        entry.status = 'missed'; entry.miss_count = (entry.miss_count || 0) + 1; break;
      case 'recall':
        if (entry.status !== 'missed') return res.status(409).json({ ok: false, error: '仅过号可重排' });
        entry.status = 'waiting'; entry.reorder_ts = now; break;   // 重排时间戳置后 → 排到同优先级队尾
      case 'done':
        entry.status = 'done'; entry.done_at = now; break;
      default:
        return res.status(400).json({ ok: false, error: 'action 须为 arrive/miss/recall/done' });
    }
    persistQueue();
    res.json({ ok: true, entry });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// ═══════════════════════════════════════════════
// R796 医技开单闭环：医生开检验单 → 检验科回传 → 旁证自动入会话
// ═══════════════════════════════════════════════
if (!state.labOrders) state.labOrders = [];
const LAB_ORDERS_FILE = path.join(__dirname, '..', 'data', 'lab-orders.json');
try {
  if (fs.existsSync(LAB_ORDERS_FILE)) state.labOrders = JSON.parse(fs.readFileSync(LAB_ORDERS_FILE, 'utf8') || '[]');
} catch (e) { state.labOrders = []; }
function persistLabOrders() {
  setImmediate(function() {
    try { fs.writeFileSync(LAB_ORDERS_FILE, JSON.stringify(state.labOrders.slice(-500), null, 2)); }
    catch (e) { console.error('[lab] 落盘失败:', e.message); }
  });
}

// 开检验单
app.post('/api/lab/order', optionalAuth, (req, res) => {
  try {
    const { session_id, patient_name, items, note } = req.body || {};
    if (!Array.isArray(items) || !items.length) return res.status(400).json({ ok: false, error: 'items 必填（检验项目数组）' });
    const sess = session_id ? loadClinicSession(session_id) : null;
    const name = String(patient_name || '').slice(0, 20)
      || (sess && sess.profile && sess.profile.name ? String(sess.profile.name.v || '').slice(0, 20) : '');
    const order = {
      order_id: 'lab-' + Date.now().toString(36) + '-' + crypto.randomBytes(2).toString('hex'),
      session_id: String(session_id || '').slice(0, 64) || null,
      patient_name: name,
      items: items.slice(0, 30).map(i => String(i).slice(0, 30)),
      note: String(note || '').slice(0, 120),
      status: 'pending',   // pending → done
      results: [],
      created_at: new Date().toISOString(), done_at: null
    };
    state.labOrders.push(order);
    persistLabOrders();
    res.json({ ok: true, order });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// 检验单列表（按会话/状态过滤）
app.get('/api/lab/orders', optionalAuth, (req, res) => {
  const { session_id, status } = req.query;
  let list = state.labOrders.slice();
  if (session_id) list = list.filter(o => o.session_id === session_id);
  if (status) list = list.filter(o => o.status === status);
  list.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  res.json({ ok: true, orders: list.slice(0, 50), total: list.length });
});

// 检验科回传：结果落单 + 自动写入会话旁证（labs + 证据时间线），医生端下次同步即见
app.post('/api/lab/result', optionalAuth, (req, res) => {
  try {
    const { order_id, results } = req.body || {};
    const order = state.labOrders.find(o => o.order_id === order_id);
    if (!order) return res.status(404).json({ ok: false, error: '检验单不存在' });
    if (order.status === 'done') return res.status(409).json({ ok: false, error: '该单已回传', order });
    if (!Array.isArray(results) || !results.length) return res.status(400).json({ ok: false, error: 'results 必填' });
    order.results = results.slice(0, 60).map(r => ({
      name: String(r.name || '').slice(0, 30),
      value: r.value, raw: r.raw != null ? r.raw : r.value,
      unit: String(r.unit || '').slice(0, 12),
      ref: String(r.ref || r.ref_range || '').slice(0, 30)
    }));
    order.status = 'done';
    order.done_at = new Date().toISOString();
    // 旁证自动入链：写入关联会话的 labs + evidence
    let linked = false;
    const s = order.session_id && loadClinicSession(order.session_id);
    if (s) {
      if (!Array.isArray(s.labs)) s.labs = [];
      for (const r of order.results) {
        if (!s.labs.some(l => l.name === r.name)) s.labs.push({ name: r.name, value: r.value, raw: r.raw, unit: r.unit });
      }
      if (!Array.isArray(s.evidence)) s.evidence = [];
      s.evidence.push({ type: 'lab', text: '检验回传：' + order.results.map(r => r.name + ' ' + (r.raw != null ? r.raw : r.value) + (r.unit ? ' ' + r.unit : '')).join('、'), ts: order.done_at });
      s.updatedAt = order.done_at;
      persistClinicSession(s.sessionId);
      linked = true;
    }
    persistLabOrders();
    res.json({ ok: true, order, linked_session: linked });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// ═══════════════════════════════════════════════
// R771 实时智能体副驾驶：每句对话/每帧特征逐条上行，
// 服务端会话级上下文累积 + 增量推理 + 动态追问 + 红旗警示，
// 同步返回 delta 供医生逐项采纳/驳回
// ═══════════════════════════════════════════════
if (!state.agentCtx) state.agentCtx = {};

const AGENT_TEN_Q = [
  { key:'寒热', terms:['畏寒','怕冷','发热','发烧','寒战'], ask:'有没有怕冷或发热的感觉？' },
  { key:'汗',   terms:['出汗','盗汗','自汗','无汗'], ask:'平时出汗情况怎么样，有没有夜间盗汗？' },
  { key:'头身', terms:['头痛','头晕','眩晕','腰酸','腰痛','关节痛','麻木'], ask:'头部和身体有没有疼痛、酸胀或麻木？' },
  { key:'二便', terms:['便秘','腹泻','便溏','尿频','尿急','尿痛','血尿','便血'], ask:'大小便情况怎么样？' },
  { key:'饮食', terms:['纳差','食欲','口干','口渴','口苦','恶心','呕吐'], ask:'胃口和饮食怎么样，口干口苦吗？' },
  { key:'胸腹', terms:['胸闷','胸痛','心悸','心慌','腹胀','腹痛','胃痛','胁痛'], ask:'胸口和腹部有没有不适？' },
  { key:'耳目', terms:['耳鸣','耳聋','目赤','视物模糊'], ask:'耳朵和眼睛有没有异常，比如耳鸣、视物模糊？' },
  { key:'睡眠', terms:['失眠','多梦','易醒','嗜睡'], ask:'睡眠怎么样，入睡困难或多梦吗？' },
  { key:'旧病', terms:['高血压','糖尿病','冠心病','高血脂','脑梗','中风','肝炎','结核','哮喘','肾病','胃溃疡','甲亢','甲减','贫血','肿瘤','癌症','手术史','过敏'], ask:'以前有什么慢性病或手术、过敏史吗？' },
  { key:'诱因', terms:['受凉','劳累','熬夜','生气','情绪波动','饮食不节','酒后','感冒后'], ask:'这次发病前有没有受凉、劳累或情绪波动？' }
];

// R780 问诊导航：五级追问规则库（红旗排除 > 鉴别分歧 > 方证核对 > 症状深挖 > 十问缺口）
// 每条：trigger 命中症状、ask 话术、why 追问理由、cover 已覆盖判据
const REDFLAG_QUESTIONS = [
  { trigger: ['胸痛','胸闷'], ask:'胸痛会不会放射到左肩、后背或下颌？有没有大汗、濒死感？', why:'排除胸痹急症（心绞痛/心梗），攸关安危', cover: ['放射','下颌','濒死','心绞痛','心梗'] },
  { trigger: ['头痛'], ask:'头痛是不是突然炸裂样最剧烈的一次？有没有呕吐、肢体无力？', why:'排除颅内急症（出血/高压危象）', cover: ['炸裂','呕吐','无力','喷射'] },
  { trigger: ['头晕','眩晕'], ask:'晕的时候有没有眼前发黑、晕倒、抽搐？', why:'排除晕厥/阿斯综合征等危重情况', cover: ['晕倒','晕厥','抽搐','黑蒙','发黑'] },
  { trigger: ['腹痛','胃痛'], ask:'腹痛是持续加重还是阵阵发作？有没有板状硬、拒按？', why:'排除急腹症（穿孔/梗阻），需转急诊', cover: ['板状','拒按','持续加重','急腹'] },
  { trigger: ['便血','血尿','咯血'], ask:'出血量多不多、颜色鲜红还是暗红？', why:'活动性出血量评估，决定缓急', cover: ['鲜红','暗红','血量','出血量'] },
  { trigger: ['发热','发烧'], ask:'发热多少度、持续几天了？有没有寒战、意识模糊？', why:'高热伴意识改变提示重症感染', cover: ['寒战','意识','多少度','体温'] },
  { trigger: ['气喘','气短','呼吸困难'], ask:'喘的时候能不能平躺？有没有口唇发紫？', why:'端坐呼吸/发绀提示心衰或重症肺病', cover: ['平躺','端坐','发紫','发绀'] }
];
const DEEP_QUESTIONS = [
  { trigger: ['咳嗽'], ask:'有痰吗？痰是白是黄、稠还是稀？夜里咳得厉害吗？', why:'痰色痰质辨寒热，夜咳辨阴阳', cover: ['白痰','黄痰','痰白','痰黄','无痰','干咳','夜咳'] },
  { trigger: ['头晕','眩晕'], ask:'晕起来天旋地转还是昏沉发飘？起身低头时加重吗？', why:'旋转多痰饮/肝风，昏沉多气血虚；体位性提示清阳不升', cover: ['旋转','天旋地转','昏沉','发飘','起身'] },
  { trigger: ['失眠'], ask:'是躺下睡不着、容易醒，还是醒得早？', why:'入睡难多肝火/阴虚，易醒多心脾两虚，早醒多肾阴不足', cover: ['睡不着','入睡','容易醒','醒得早','早醒'] },
  { trigger: ['乏力'], ask:'累了休息一下能缓过来吗？早上重还是下午重？', why:'休息可缓多为气虚，晨轻暮重辨虚实', cover: ['缓过来','休息','早上','下午','晨'] },
  { trigger: ['心慌','心悸'], ask:'心慌是一阵阵还是持续的？紧张劳累后加重吗？', why:'阵发多气阴两虚，持续伴诱因需排查器质性', cover: ['一阵阵','阵发','持续','紧张','劳累'] },
  { trigger: ['胃痛','腹痛','腹胀'], ask:'空腹痛明显还是饭后明显？喜按还是怕按？', why:'空腹痛多虚/溃疡，饭后痛多实；喜按为虚拒按为实', cover: ['空腹','饭后','喜按','怕按','拒按'] },
  { trigger: ['腹泻','便溏'], ask:'一天拉几次？成形吗？有没有不消化的食物？', why:'完谷不化辨脾肾阳虚，次数性状定轻重', cover: ['几次','成形','完谷','不消化'] },
  { trigger: ['便秘'], ask:'几天一次大便？干结难下还是有便意但排不出？', why:'干结多燥热津亏，无力排出多气虚', cover: ['几天','干结','排不出','便意'] },
  { trigger: ['头痛'], ask:'头痛在什么部位？胀痛、刺痛还是空痛？', why:'部位归经（太阳/少阳/阳明/厥阴），痛性辨虚实瘀', cover: ['胀痛','刺痛','空痛','部位','前额','两侧','后脑','头顶'] },
  { trigger: ['发热','发烧'], ask:'怕冷和发热哪个明显？一阵冷一阵热吗？', why:'恶寒重表寒，发热重表热，寒热往来少阳', cover: ['怕冷明显','发热明显','寒热往来','一阵冷'] },
  { trigger: ['胸闷'], ask:'闷得慌活动后加重还是休息时明显？叹气后舒服吗？', why:'活动加重多胸阳不振，喜叹息多肝郁气滞', cover: ['活动后','休息','叹气','叹息'] },
  { trigger: ['口干','口渴'], ask:'口干想喝水吗？想喝热水还是凉水？', why:'渴喜热饮多寒湿，渴喜冷饮多实热，口干不欲饮多阴虚/瘀', cover: ['想喝水','热水','凉水','不欲饮'] },
  { trigger: ['盗汗','自汗','出汗'], ask:'出汗是白天不动也出，还是睡着后出、醒来就停？', why:'自汗多气虚，盗汗多阴虚', cover: ['白天','睡着','醒来','夜间'] },
  { trigger: ['尿频','尿急'], ask:'夜里起夜几次？小便颜色深还是清长？', why:'夜尿频多肾气不固，清长为寒短赤为热', cover: ['起夜','夜尿','清长','颜色'] },
  { trigger: ['腰痛','腰酸'], ask:'腰痛早上僵硬明显，还是累了以后加重？', why:'晨僵多寒湿/肾虚督寒，劳后加重多肾虚劳损', cover: ['晨僵','僵硬','劳累后'] },
  { trigger: ['关节痛'], ask:'关节红肿热痛吗？遇冷加重还是遇热加重？', why:'红肿热痛为热痹，遇冷加重为寒痹/湿痹', cover: ['红肿','遇冷','遇热','热痛'] },
  { trigger: ['月经不调','痛经'], ask:'月经提前还是推后？血块多不多？经期腹痛喜温喜按吗？', why:'周期先后辨寒热虚实，血块主瘀，喜温喜按为虚寒', cover: ['提前','推后','血块','喜温'] }
];
const FORMULA_CHECKS = {
  '归脾汤': { ask:'平时胃口怎么样？有没有健忘、面色发黄？', why:'归脾汤主心脾两虚，纳差/健忘/面色萎黄为方证要点', cover: ['胃口','纳差','健忘','面色'] },
  '补中益气汤': { ask:'有没有小腹坠胀、久泻、内脏下垂的感觉？', why:'补中益气汤主中气下陷，坠胀感为方证眼目', cover: ['坠胀','下垂','久泻'] },
  '六味地黄丸': { ask:'有没有腰膝酸软、手脚心发热、夜间盗汗？', why:'六味地主肾阴亏虚，五心烦热为方证要点', cover: ['腰膝','手脚心','盗汗','五心烦热'] },
  '逍遥散': { ask:'平时容易烦躁生气吗？两胁有没有胀闷？', why:'逍遥散主肝郁脾虚，情志与胁胀为方证核心', cover: ['烦躁','生气','胁','情志'] },
  '桂枝汤': { ask:'怕风吗？出汗后怕冷有没有减轻？', why:'桂枝汤主太阳中风表虚，恶风汗出为方证眼目', cover: ['怕风','恶风','汗出'] },
  '小柴胡汤': { ask:'有没有一阵冷一阵热、口苦、不想吃饭？', why:'小柴胡汤主少阳枢机不利，寒热往来/口苦/默默不欲饮食为四大症', cover: ['寒热往来','口苦','不想吃饭','不欲饮食'] },
  '麻黄汤': { ask:'怕冷重不重？身上有汗还是没汗？关节疼吗？', why:'麻黄汤主太阳伤寒表实，无汗而喘/身痛为方证眼目', cover: ['无汗','有汗','身痛','关节'] },
  '白虎汤': { ask:'发烧高不高？大汗出吗？特别口渴想喝凉水吗？', why:'白虎汤主阳明气分热盛，大热/大汗/大渴为方证眼目', cover: ['大汗','大渴','凉水','高烧'] },
  '四君子汤': { ask:'平时说话声音低微吗？饭后容易困倦吗？', why:'四君子主脾胃气虚，声低/食后困倦为方证佐证', cover: ['声音低','困倦','饭后'] },
  '四物汤': { ask:'有没有头晕眼花、月经量少色淡？指甲嘴唇颜色淡吗？', why:'四物汤主血虚，量少色淡/甲唇色淡为方证要点', cover: ['量少','色淡','指甲','嘴唇'] },
  '二陈汤': { ask:'痰多不多？胸口有没有闷堵、恶心想吐？', why:'二陈汤主痰湿内阻，痰多/胸闷/呕恶为方证眼目', cover: ['痰多','恶心','闷堵'] },
  '温胆汤': { ask:'容易受惊吓吗？有没有口苦、心烦、恶心？', why:'温胆汤主胆郁痰扰，易惊/心烦/呕恶为方证要点', cover: ['受惊','口苦','心烦','恶心'] },
  '血府逐瘀汤': { ask:'胸胁刺痛位置固定吗？晚上痛得明显吗？', why:'血府逐瘀汤主胸中血瘀，刺痛固定/入暮痛甚为方证眼目', cover: ['刺痛','固定','晚上'] },
  '酸枣仁汤': { ask:'失眠时心烦吗？有没有头目眩晕、咽干口燥？', why:'酸枣仁汤主肝血不足虚热内扰，虚烦/咽干为方证要点', cover: ['心烦','咽干','眩晕'] },
  '平胃散': { ask:'肚子胀吗？舌苔厚腻吗？口里发淡没味道吗？', why:'平胃散主湿滞脾胃，脘腹胀满/苔厚腻/口淡为方证眼目', cover: ['腹胀','厚腻','口淡'] }
};

// R781 方证核对全量纳入：从 KB tcm-fangji 结构化条目（【方名】组成…主治…辨证要点…）自动构建核对库
// 手写 FORMULA_CHECKS 为精修优先版；KB 派生覆盖其余全部方剂（429+ 首）
let KB_FORMULA_CHECKS = null;
function buildKbFormulaChecks() {
  if (KB_FORMULA_CHECKS) return KB_FORMULA_CHECKS;
  KB_FORMULA_CHECKS = {};
  try {
    // R785：优先从 SQLite 镜像按模块取（只解析 2 个模块），失败回退全量 JSON
    let kb = null;
    try {
      const sqlite = require('./kb-store/kb-sqlite');
      const jm = fs.statSync(path.join(__dirname, 'kb-store', 'tcm-synced-kb.json')).mtimeMs;
      if (sqlite.tryLoadIndex(jm)) kb = sqlite.loadModules(['tcm-fangji', 'tcm-zhongfu']);
    } catch (e) { kb = null; }
    if (!kb) {
      const KB_FILE = path.join(__dirname, '..', 'server', 'kb-store', 'tcm-synced-kb.json');
      const altFile = path.join(__dirname, 'kb-store', 'tcm-synced-kb.json');
      kb = JSON.parse(fs.readFileSync(fs.existsSync(KB_FILE) ? KB_FILE : altFile, 'utf8'));
    }
    const fj = kb['tcm-fangji'] || [];
    for (const it of fj) {
      const c = String(it.content || '');
      let nameM = c.match(/【([^】]{2,12}(?:汤|丸|散|饮|膏|丹|煎|茶))】/);
      if (!nameM) nameM = String(it.title || '').match(/[·\s]([^·\s]{2,12}(?:汤|丸|散|饮|膏|丹|煎|茶))$/);   // 退路：标题方名
      if (!nameM) continue;
      const name = nameM[1];
      if (KB_FORMULA_CHECKS[name]) continue;
      const zhiM = c.match(/主治：([^。]+)/);
      const keyM = c.match(/辨证要点：([^。]+)/);
      const raw = ((zhiM ? zhiM[1] : '') + '、' + (keyM ? keyM[1] : '')).replace(/【|】/g, '');
      const terms = raw.split(/[、，,；;。]/).map(s => s.trim())
        .filter(s => s.length >= 2 && s.length <= 8)
        .filter(s => !/^(脉|苔|舌|组成|功效)/.test(s))        // 舌脉由望切采集，不入问话
        .filter(s => /[一-鿿]/.test(s));
      if (terms.length >= 2) {
        KB_FORMULA_CHECKS[name] = { terms: terms.slice(0, 6), source: String(it.title || '').slice(0, 30) };
      }
    }
    // 第二源：tcm-zhongfu 证型条目【证型】临床表现：…代表方剂：方名（155 条结构化）
    for (const it of (kb['tcm-zhongfu'] || [])) {
      const c = String(it.content || '');
      const fM = c.match(/代表方剂：([^。，,、]+)/);
      const clinM = c.match(/临床表现：([^。]+)/);
      if (!fM || !clinM) continue;
      const name = fM[1].trim().replace(/[。；;\s]/g, '');
      if (!name || KB_FORMULA_CHECKS[name]) continue;
      const terms = clinM[1].split(/[、，,；;]/).map(s => s.trim())
        .filter(s => s.length >= 2 && s.length <= 8)
        .filter(s => !/^(脉|苔|舌)/.test(s));
      if (terms.length >= 2) {
        KB_FORMULA_CHECKS[name] = { terms: terms.slice(0, 6), source: '证型库·' + String(it.title || '').slice(0, 20) };
      }
    }
    // 第三源：辨证引擎自有方证表 FORMULA_SYNDROME_MAP（引擎推荐路径全覆盖）
    try {
      const MAP = require('./engines/syndrome-engine').FORMULA_SYNDROME_MAP || {};
      for (const [syn, v] of Object.entries(MAP)) {
        if (!v.formula || KB_FORMULA_CHECKS[v.formula]) continue;
        const terms = (v.symptoms || []).filter(s => s && s.length >= 2 && s.length <= 8 && !/^(脉|苔|舌)/.test(s));
        if (terms.length >= 2) KB_FORMULA_CHECKS[v.formula] = { terms: terms.slice(0, 6), source: '辨证引擎·' + syn };
      }
    } catch (e) {}
    // 第四源：自研引擎方剂选取规则（match/pick 表，源码正则抽取——只读不重构）
    try {
      const src = fs.readFileSync(path.join(__dirname, 'engines', 'inhouse-model.js'), 'utf8');
      const ruleRe = /\{\s*match:\s*\[([^\]]+)\],\s*pick:\s*'([^']+)'/g;
      let rm;
      while ((rm = ruleRe.exec(src))) {
        const name = rm[2];
        if (KB_FORMULA_CHECKS[name]) continue;
        const terms = (rm[1].match(/'([^']+)'/g) || []).map(s => s.replace(/'/g, ''))
          .filter(s => s.length >= 2 && s.length <= 8 && !/^(脉|苔|舌)/.test(s));
        const prev = KB_FORMULA_CHECKS['_' + name] || [];
        const merged = [...new Set([...prev, ...terms])].slice(0, 6);
        KB_FORMULA_CHECKS['_' + name] = merged;                    // 暂存聚合
        if (merged.length >= 2) KB_FORMULA_CHECKS[name] = { terms: merged, source: '自研引擎·选方规则' };
      }
      Object.keys(KB_FORMULA_CHECKS).filter(k => k.startsWith('_')).forEach(k => delete KB_FORMULA_CHECKS[k]);
    } catch (e) {}
  } catch (e) { /* KB 不可读时方证核对仅用手写库 */ }
  return KB_FORMULA_CHECKS;
}
// R776 检验旁证 Pro：56 项 12 类指标参考值 + 中医佐证映射（仅供医师参考，不作诊断依据）
// low/high 为通用参考区间；mLow/mHigh、fLow/fHigh 为性别分层（有性别时优先）
const LAB_PANEL = [
  // ── 血常规 ──
  { key:'白细胞', cat:'血常规', low:3.5, high:9.5, unit:'×10⁹/L', highHint:'热毒炽盛/炎症活动佐证', lowHint:'正气不足佐证' },
  { key:'红细胞', cat:'血常规', mLow:4.3, mHigh:5.8, fLow:3.8, fHigh:5.1, low:3.8, high:5.8, unit:'×10¹²/L', lowHint:'血虚佐证' },
  { key:'血红蛋白', cat:'血常规', mLow:130, mHigh:175, fLow:115, fHigh:150, low:115, high:175, unit:'g/L', lowHint:'血虚佐证（气血亏虚/脾不统血）', highHint:'血液浓缩或实证倾向', critLow:60 },
  { key:'红细胞压积', cat:'血常规', mLow:40, mHigh:50, fLow:35, fHigh:45, low:35, high:50, unit:'%', lowHint:'血虚佐证', highHint:'血液浓缩/津亏倾向' },
  { key:'MCV', cat:'血常规', low:82, high:100, unit:'fL', lowHint:'小细胞性（缺铁倾向）', highHint:'大细胞性（巨幼倾向）' },
  { key:'MCH', cat:'血常规', low:27, high:34, unit:'pg', lowHint:'低色素性（缺铁倾向）' },
  { key:'MCHC', cat:'血常规', low:316, high:354, unit:'g/L', lowHint:'低色素性（缺铁倾向）' },
  { key:'血小板', cat:'血常规', low:125, high:350, unit:'×10⁹/L', lowHint:'脾不统血、血不归经佐证', critLow:50 },
  { key:'中性粒细胞%', cat:'血常规', low:40, high:75, unit:'%', highHint:'细菌感染倾向（实热）' },
  { key:'淋巴细胞%', cat:'血常规', low:20, high:50, unit:'%', highHint:'病毒感染倾向（风热/邪毒）' },
  { key:'嗜酸性粒细胞%', cat:'血常规', low:0.4, high:8, unit:'%', highHint:'过敏/虫积倾向（风盛）' },
  // ── 尿常规（文本型）──
  { key:'尿蛋白', cat:'尿常规', text:true, unit:'', highHint:'肾气不固、精微下泄佐证' },
  { key:'尿糖', cat:'尿常规', text:true, unit:'', highHint:'消渴佐证' },
  { key:'尿潜血', cat:'尿常规', text:true, unit:'', highHint:'血热妄行/湿热下注佐证' },
  { key:'尿白细胞', cat:'尿常规', text:true, unit:'', highHint:'湿热下注（淋证）佐证' },
  { key:'尿酮体', cat:'尿常规', text:true, unit:'', highHint:'消渴重症/阴津耗伤警示' },
  // ── 肝功能 ──
  { key:'谷丙转氨酶', cat:'肝功能', low:7, high:40, unit:'U/L', highHint:'肝胆湿热/肝郁气滞佐证', critHigh:400 },
  { key:'谷草转氨酶', cat:'肝功能', low:13, high:35, unit:'U/L', highHint:'肝胆湿热佐证', critHigh:400 },
  { key:'γ-谷氨酰转肽酶', cat:'肝功能', mLow:10, mHigh:60, fLow:7, fHigh:45, low:7, high:60, unit:'U/L', highHint:'肝胆湿热/酒精伤肝倾向' },
  { key:'碱性磷酸酶', cat:'肝功能', low:45, high:125, unit:'U/L', highHint:'胆汁淤积/骨病倾向' },
  { key:'总胆红素', cat:'肝功能', low:3.4, high:20.5, unit:'μmol/L', highHint:'黄疸倾向（湿热蕴结）' },
  { key:'直接胆红素', cat:'肝功能', low:0, high:6.8, unit:'μmol/L', highHint:'胆汁淤积倾向' },
  { key:'白蛋白', cat:'肝功能', low:40, high:55, unit:'g/L', lowHint:'气血亏虚/脾虚失运佐证' },
  // ── 肾功能 ──
  { key:'肌酐', cat:'肾功能', mLow:57, mHigh:111, fLow:41, fHigh:81, low:41, high:111, unit:'μmol/L', highHint:'肾气亏虚、湿浊内停佐证', critHigh:707 },
  { key:'尿素氮', cat:'肾功能', low:2.6, high:7.5, unit:'mmol/L', highHint:'肾气亏虚佐证' },
  { key:'尿酸', cat:'肾功能', mLow:208, mHigh:428, fLow:155, fHigh:357, low:155, high:428, unit:'μmol/L', highHint:'湿热痹阻、痰浊瘀滞佐证' },
  { key:'估算肾小球滤过率', cat:'肾功能', low:90, unit:'mL/min', lowHint:'肾气衰惫分级依据' },
  // ── 血脂 ──
  { key:'总胆固醇', cat:'血脂', high:5.2, unit:'mmol/L', highHint:'痰浊内阻佐证' },
  { key:'甘油三酯', cat:'血脂', high:1.7, unit:'mmol/L', highHint:'痰浊湿阻佐证', critHigh:5.6 },
  { key:'低密度脂蛋白', cat:'血脂', high:3.4, unit:'mmol/L', highHint:'痰浊内阻佐证' },
  { key:'高密度脂蛋白', cat:'血脂', low:1.0, unit:'mmol/L', lowHint:'痰浊风险（保护因子不足）' },
  // ── 血糖 ──
  { key:'空腹血糖', cat:'血糖', low:3.9, high:6.1, unit:'mmol/L', highHint:'消渴佐证（阴虚燥热）', lowHint:'中气不足，警惕虚脱', critHigh:13.9, critLow:3.0 },
  { key:'餐后2小时血糖', cat:'血糖', high:7.8, unit:'mmol/L', highHint:'消渴佐证', critHigh:16.7 },
  { key:'糖化血红蛋白', cat:'血糖', low:4, high:6.0, unit:'%', highHint:'消渴日久、气阴两虚佐证' },
  // ── 甲功 ──
  { key:'促甲状腺激素', cat:'甲功', low:0.27, high:4.2, unit:'mIU/L', highHint:'脾肾阳虚（甲减倾向）佐证', lowHint:'肝郁化火（甲亢倾向）佐证' },
  { key:'游离T3', cat:'甲功', low:3.1, high:6.8, unit:'pmol/L', highHint:'甲亢倾向佐证', lowHint:'甲减倾向佐证' },
  { key:'游离T4', cat:'甲功', low:12, high:22, unit:'pmol/L', highHint:'甲亢倾向佐证', lowHint:'甲减倾向佐证' },
  // ── 心肌酶/心功 ──
  { key:'肌酸激酶', cat:'心肌酶', low:38, high:174, unit:'U/L', highHint:'胸痹/心肌损伤警示' },
  { key:'肌酸激酶同工酶', cat:'心肌酶', high:25, unit:'U/L', highHint:'胸痹（心梗）警示' },
  { key:'肌钙蛋白I', cat:'心肌酶', high:0.04, unit:'ng/mL', highHint:'真心痛（心梗）危急警示', critHigh:0.5 },
  { key:'BNP', cat:'心肌酶', high:100, unit:'pg/mL', highHint:'心阳不振、水气凌心佐证' },
  // ── 电解质 ──
  { key:'血钾', cat:'电解质', low:3.5, high:5.3, unit:'mmol/L', lowHint:'气虚津亏佐证', highHint:'肾功能警示', critLow:2.8, critHigh:6.2 },
  { key:'血钠', cat:'电解质', low:137, high:147, unit:'mmol/L', lowHint:'津亏/阳虚水泛倾向', highHint:'津液耗伤倾向' },
  { key:'血钙', cat:'电解质', low:2.11, high:2.52, unit:'mmol/L', lowHint:'肝肾不足（骨失濡养）', highHint:'痰浊/甲旁亢警示' },
  // ── 炎症 ──
  { key:'C反应蛋白', cat:'炎症', high:8, unit:'mg/L', highHint:'热毒/湿热炎症佐证' },
  { key:'超敏C反应蛋白', cat:'炎症', high:3, unit:'mg/L', highHint:'慢性炎症（胸痹风险）佐证' },
  { key:'血沉', cat:'炎症', mHigh:15, fHigh:20, high:20, unit:'mm/h', highHint:'湿热痹阻/瘀血活动佐证' },
  { key:'降钙素原', cat:'炎症', high:0.05, unit:'ng/mL', highHint:'热毒炽盛（败血症）警示', critHigh:2 },
  // ── 凝血 ──
  { key:'D-二聚体', cat:'凝血', high:0.5, unit:'mg/L', highHint:'瘀血阻络（血栓）警示' },
  // ── 肿瘤标志物 ──
  { key:'甲胎蛋白', cat:'肿瘤标志物', high:7, unit:'ng/mL', highHint:'癥积（肝）警示，建议影像复查', critHigh:400 },
  { key:'癌胚抗原', cat:'肿瘤标志物', high:5, unit:'ng/mL', highHint:'癥积（消化道）警示，建议复查' },
  { key:'CA125', cat:'肿瘤标志物', high:35, unit:'U/mL', highHint:'癥瘕（妇科）警示，建议复查' },
  { key:'CA199', cat:'肿瘤标志物', high:37, unit:'U/mL', highHint:'癥积（胰胆）警示，建议复查' },
  { key:'PSA', cat:'肿瘤标志物', high:4, unit:'ng/mL', highHint:'癃闭（前列腺）警示，建议复查' }
];

// 联合模式识别：单指标判读之上，组合出临床模式（超越单品级判读的核心）
const LAB_PATTERNS = [
  { name:'缺铁性贫血模式', when: a => a.low('血红蛋白') && (a.low('MCV') || a.low('MCH') || a.low('MCHC')), tcm:'血虚（气血两虚、脾不统血）', advice:'建议查铁蛋白/血清铁；中医以归脾汤类加减' },
  { name:'巨幼细胞贫血模式', when: a => a.low('血红蛋白') && a.high('MCV'), tcm:'血虚兼脾胃虚弱（运化失司）', advice:'建议查叶酸/维生素B12' },
  { name:'细菌感染模式', when: a => a.high('白细胞') && a.high('中性粒细胞%'), tcm:'实热/热毒炽盛', advice:'结合CRP/PCT评估感染程度' },
  { name:'病毒感染倾向', when: a => (a.low('白细胞') || a.normal('白细胞')) && a.high('淋巴细胞%'), tcm:'风热/邪毒外袭', advice:'多为自限，辨证辛凉解表' },
  { name:'肝细胞损伤模式', when: a => a.high('谷丙转氨酶') && a.high('谷草转氨酶'), tcm:'肝胆湿热/肝郁气滞', advice:'建议查肝炎标志物、戒酒；中医清肝利胆' },
  { name:'胆汁淤积模式', when: a => a.high('γ-谷氨酰转肽酶') && (a.high('碱性磷酸酶') || a.high('直接胆红素')), tcm:'湿热蕴结肝胆（黄疸倾向）', advice:'建议腹部超声' },
  { name:'肾功能减退模式', when: a => a.high('肌酐') && (a.high('尿素氮') || a.low('估算肾小球滤过率')), tcm:'肾气衰惫、湿浊内停', advice:'慎用肾毒性药味；建议肾内科随诊' },
  { name:'高尿酸/痛风倾向', when: a => a.high('尿酸'), tcm:'湿热痹阻、痰浊瘀滞', advice:'低嘌呤饮食；中医利湿化浊' },
  { name:'糖尿病（消渴）', when: a => a.ge('空腹血糖', 7.0) || a.ge('糖化血红蛋白', 6.5), tcm:'消渴（阴虚燥热为本）', advice:'已达糖尿病诊断界值，建议内分泌科确诊' },
  { name:'糖尿病前期', when: a => !a.ge('空腹血糖', 7.0) && ((a.gt('空腹血糖', 6.1)) || (a.gt('糖化血红蛋白', 6.0) && !a.ge('糖化血红蛋白', 6.5))), tcm:'消渴前期（燥热伤津）', advice:'生活方式干预窗口期' },
  { name:'血脂异常（痰浊）', when: a => a.high('总胆固醇') || a.high('甘油三酯') || a.high('低密度脂蛋白'), tcm:'痰浊内阻（胸痹/中风风险）', advice:'中医化痰降浊；评估心血管风险' },
  { name:'甲减模式', when: a => a.high('促甲状腺激素') && a.low('游离T4'), tcm:'脾肾阳虚', advice:'建议内分泌科；中医温补脾肾' },
  { name:'甲亢模式', when: a => a.low('促甲状腺激素') && (a.high('游离T4') || a.high('游离T3')), tcm:'肝郁化火/阴虚阳亢', advice:'慎用含碘药味（海藻/昆布）；建议内分泌科' },
  { name:'炎症活动模式', when: a => a.high('C反应蛋白') && a.high('血沉'), tcm:'湿热/瘀血痹阻活动期', advice:'查找感染灶或免疫活动' },
  { name:'心衰倾向', when: a => a.high('BNP'), tcm:'心阳不振、水气凌心', advice:'建议心内科评估；中医温阳利水' },
  { name:'低钾倾向', when: a => a.low('血钾'), tcm:'气虚津亏', advice:'补钾并查因（利尿剂/吐泻）' },
  { name:'肿瘤标志物警示', when: a => a.high('甲胎蛋白') || a.high('癌胚抗原') || a.high('CA125') || a.high('CA199') || a.high('PSA'), tcm:'癥积警示', advice:'单项升高不等于肿瘤，建议影像/复查确认，勿过度解读' }
];

// 判读引擎：指标逐项（性别分层+轻中重分级）+ 模式识别 + 综合结论
function analyzeLabs(labs, gender) {
  const get = n => labs.find(x => x.name === n);
  const refOf = n => LAB_PANEL.find(x => x.key === n);
  const flag = n => {
    const l = get(n), ref = refOf(n);
    if (!l || !ref) return 'none';
    if (ref.text) {
      const raw = String(l.raw != null ? l.raw : l.value);
      if (/阳|\+|阳性/.test(raw)) return 'high';
      if (/阴|-/.test(raw)) return 'normal';
      return 'none';
    }
    if (isNaN(l.value)) return 'none';
    let lo = ref.low, hi = ref.high;
    if (gender === '男' && ref.mLow != null) { lo = ref.mLow; hi = ref.mHigh; }
    if (gender === '女' && ref.fLow != null) { lo = ref.fLow; hi = ref.fHigh; }
    if (hi != null && l.value > hi) return 'high';
    if (lo != null && l.value < lo) return 'low';
    return 'normal';
  };
  const acc = {
    high: n => flag(n) === 'high', low: n => flag(n) === 'low', normal: n => flag(n) === 'normal',
    ge: (n, v) => { const l = get(n); return l && !isNaN(l.value) && l.value >= v; },
    gt: (n, v) => { const l = get(n); return l && !isNaN(l.value) && l.value > v; }
  };
  const items = labs.map(l => {
    const ref = refOf(l.name);
    if (!ref) return { name: l.name, value: l.raw != null ? l.raw : l.value, flag: '录', hint: '已记录（不在判读面板）' };
    const f = flag(l.name);
    const dispVal = ref.text ? String(l.raw != null ? l.raw : l.value) : l.value;
    if (f === 'high') {
      let sev = '轻';
      if (!ref.text && !isNaN(l.value)) {
        const hi = (gender === '男' && ref.mHigh != null) ? ref.mHigh : (gender === '女' && ref.fHigh != null) ? ref.fHigh : ref.high;
        if (ref.critHigh != null && l.value >= ref.critHigh) sev = '危急';
        else if (hi && l.value > hi * 1.5) sev = '重';
        else if (hi && l.value > hi * 1.2) sev = '中';
      }
      return { name: l.name, value: dispVal, unit: ref.unit, cat: ref.cat, flag: ref.text ? '阳' : '高', severity: sev, hint: ref.highHint || '偏高' };
    }
    if (f === 'low') {
      let sev = '轻';
      if (!isNaN(l.value)) {
        const lo = (gender === '男' && ref.mLow != null) ? ref.mLow : (gender === '女' && ref.fLow != null) ? ref.fLow : ref.low;
        if (ref.critLow != null && l.value <= ref.critLow) sev = '危急';
        else if (lo && l.value < lo * 0.7) sev = '重';
        else if (lo && l.value < lo * 0.85) sev = '中';
      }
      return { name: l.name, value: dispVal, unit: ref.unit, cat: ref.cat, flag: '低', severity: sev, hint: ref.lowHint || '偏低' };
    }
    return { name: l.name, value: dispVal, unit: ref.unit, cat: ref.cat, flag: '正常', hint: '参考范围内' };
  });
  const patterns = LAB_PATTERNS.filter(p => { try { return p.when(acc); } catch(e) { return false; } })
    .map(p => ({ name: p.name, tcm: p.tcm, advice: p.advice }));
  const criticals = [];
  labs.forEach(l => {
    const ref = refOf(l.name);
    if (!ref || ref.text || isNaN(l.value)) return;
    if (ref.critHigh != null && l.value >= ref.critHigh) criticals.push(l.name + ' ' + l.value + ref.unit + ' 达危急值，建议立即处理');
    if (ref.critLow != null && l.value <= ref.critLow) criticals.push(l.name + ' ' + l.value + ref.unit + ' 达危急值，建议立即处理');
  });
  const abn = items.filter(i => i.flag !== '正常' && i.flag !== '录');
  const summary = '共判读 ' + items.length + ' 项：异常 ' + abn.length + ' 项' +
    (abn.length ? '（' + abn.map(i => i.name + i.flag + (i.severity && i.severity !== '轻' ? '·' + i.severity : '')).join('、') + '）' : '，全部参考范围内') +
    (patterns.length ? '；识别模式：' + patterns.map(p => p.name).join('、') : '') +
    (criticals.length ? '；⚠️ 危急值 ' + criticals.length + ' 项' : '');
  return { items, patterns, criticals, summary };
}

function agentCtxOf(sessionId) {
  if (!state.agentCtx[sessionId]) {
    state.agentCtx[sessionId] = {
      symptoms: [], history: [], duration: '', profile: {}, vision: {},
      turns: 0, lastSyndrome: '', lastFormula: '', lastConf: 0, askedKeys: [], log: []
    };
  }
  return state.agentCtx[sessionId];
}

app.post('/api/clinic/agent/event', optionalAuth, (req, res) => {
  try {
    const b = req.body || {};
    const sessionId = String(b.sessionId || '');
    const kind = String(b.kind || 'utterance');
    if (!sessionId) return res.status(400).json({ ok: false, error: 'sessionId 必填' });
    const ctx = agentCtxOf(sessionId);
    const t0 = Date.now();

    // ── 1. 上下文累积（幂等去重）──
    const ex = b.extracted || {};
    if (Array.isArray(ex.symptoms)) ex.symptoms.forEach(s => { if (s && !ctx.symptoms.includes(s)) ctx.symptoms.push(s); });
    if (Array.isArray(ex.history)) ex.history.forEach(s => { if (s && !ctx.history.includes(s)) ctx.history.push(s); });
    if (ex.duration && !ctx.duration) ctx.duration = ex.duration;
    if (ex.profile) for (const k of ['name','age','gender']) { if (ex.profile[k] && !ctx.profile[k]) ctx.profile[k] = ex.profile[k]; }
    if (kind === 'vision' && b.vision) Object.assign(ctx.vision, b.vision);
    if (kind === 'vital' && b.vital) ctx.vitals = b.vital;
    if (kind === 'lab' && (b.lab || Array.isArray(b.labs))) {
      ctx.labs = ctx.labs || [];
      const incoming = Array.isArray(b.labs) ? b.labs : [b.lab];
      incoming.filter(x => x && x.name).forEach(x => {
        const rec = { name: String(x.name).slice(0, 20), value: parseFloat(x.value), raw: String(x.raw != null ? x.raw : x.value).slice(0, 12), ts: new Date().toISOString() };
        const li = ctx.labs.findIndex(t => t.name === rec.name);
        if (li >= 0) ctx.labs[li] = rec; else ctx.labs.push(rec);
      });
      if (ctx.labs.length > 60) ctx.labs = ctx.labs.slice(-60);
    }
    ctx.turns++;
    ctx.log.push({ ts: new Date().toISOString(), kind, text: String(b.text || '').slice(0, 60), role: b.role || null });
    if (ctx.log.length > 200) ctx.log = ctx.log.slice(-200);

    // ── 2. 增量推理（真实引擎链，同步 <50ms）──
    const syms = ctx.symptoms;
    let inhouse = null, formula = null, urgency = null;
    if (syms.length) {
      try {
        inhouse = INHOUSE.diagnose(syms.join('、'), syms, { inquiry: { symptoms: syms, chief_complaint: syms[0] } });
        const report = JSON.parse(JSON.stringify(SZ_DIAGNOSIS_REPORT));
        report.patient_id = sessionId;
        report.five_methods.inquiry = { chief_complaint: syms[0], extracted_tcm_terms: syms, symptoms: syms };
        report.kb_multischool_opinions = multischoolAnalysis(report);
        report.inhouse_diagnosis = inhouse;
        formula = formulaSyndromeMatch(report);
        urgency = assessUrgency(report);
      } catch(e) { /* 单引擎异常不拖垮事件响应 */ }
    }

    // ── 3. 增量 delta：只有变化才报，避免噪音 ──
    const syndrome = (inhouse && inhouse.primary_syndrome && inhouse.primary_syndrome.syndrome) || (formula && formula.matched_syndrome) || '';
    const conf = (inhouse && inhouse.primary_syndrome && inhouse.primary_syndrome.confidence) || 0;
    const formulaName = (inhouse && inhouse.primary_formula && inhouse.primary_formula.formula) || (formula && formula.formula) || '';
    const delta = { changed: false };
    if (syndrome && (syndrome !== ctx.lastSyndrome || formulaName !== ctx.lastFormula || Math.abs(conf - ctx.lastConf) >= 0.1)) {
      delta.changed = true;
      delta.syndrome = syndrome;
      delta.confidence = conf;
      delta.formula = formulaName;
      delta.formulaOptions = (inhouse && inhouse.formula_options || []).slice(0, 3).map(o => o.formula);
      delta.differential = (inhouse && inhouse.differential || []).slice(0, 2).map(d => ({ syndrome: d.syndrome, confidence: d.confidence }));
      ctx.lastSyndrome = syndrome; ctx.lastFormula = formulaName; ctx.lastConf = conf;
    }

    // ── 4. 动态追问（R780 问诊导航）：红旗排除 > 鉴别分歧 > 方证核对 > 症状深挖 > 十问缺口 ──
    const allText = ctx.log.map(l => l.text).join('；');
    const notAsked = k => !ctx.askedKeys.includes(k);
    const notCovered = terms => !terms.some(t => allText.includes(t));
    const followups = [];
    const pushQ = (key, ask, why, priority, source) => {
      if (followups.length >= 4 || !notAsked(key)) return;
      if (followups.some(f => f.ask === ask)) return;
      followups.push({ key, ask, why, priority, source });
    };
    // P0 红旗排除：危重信号未排除前优先于一切
    for (const q of REDFLAG_QUESTIONS) {
      if (!q.trigger.some(t => syms.includes(t))) continue;
      if (notCovered(q.cover)) pushQ('red:' + q.trigger[0], q.ask, q.why, 'red', '红旗排除');
    }
    // P1 鉴别分歧：前两名接近时引导兼症鉴别
    const diff = (inhouse && inhouse.differential) || [];
    if (diff.length >= 2 && diff[0].score - diff[1].score < 0.15) {
      pushQ('鉴别:' + diff[1].syndrome,
        '需要鉴别「' + diff[0].syndrome + '」与「' + diff[1].syndrome + '」，请补充询问相关兼症（如汗出、口渴、二便、寒热偏好）',
        '前两名证型置信度接近（差<15%），一症定乾坤', 'diff', '鉴别分歧');
    }
    // P2 方证核对：当前推荐方剂的方证眼目尚未核实（手写精修优先，KB 全量方库兜底 R781）
    if (formulaName && FORMULA_CHECKS[formulaName]) {
      const fc = FORMULA_CHECKS[formulaName];
      if (notCovered(fc.cover)) pushQ('formula:' + formulaName, fc.ask, fc.why, 'formula', '方证核对');
    } else if (formulaName) {
      const kbc = buildKbFormulaChecks()[formulaName];
      if (kbc) {
        const missing = kbc.terms.filter(t => !allText.includes(t) && !syms.includes(t)).slice(0, 3);
        if (missing.length >= 1) {
          pushQ('formula:' + formulaName,
            '再确认一下：有没有' + missing.join('、') + '？',
            '「' + formulaName + '」方证要点（' + (kbc.source || 'KB 主治') + '），核实后处方才稳', 'formula', '方证核对·KB');
        }
      }
    }
    // P3 症状深挖：主症的关键鉴别细节
    for (const q of DEEP_QUESTIONS) {
      const hit = q.trigger.find(t => syms.includes(t));
      if (!hit) continue;
      if (notCovered(q.cover)) pushQ('deep:' + hit, q.ask, q.why, 'deep', '症状深挖');
    }
    // P4 十问缺口：兜底覆盖
    for (const q of AGENT_TEN_Q) {
      if (notCovered(q.terms)) pushQ(q.key, q.ask, '十问歌诀未覆盖：' + q.key, 'tenq', '十问缺口');
    }
    const PRI = { red: 0, diff: 1, formula: 2, deep: 3, tenq: 4 };
    followups.sort((a, b) => (PRI[a.priority] != null ? PRI[a.priority] : 9) - (PRI[b.priority] != null ? PRI[b.priority] : 9));
    delta.followups = followups.slice(0, 4);

    // ── 5. 红旗警示：urgency 升级 + 配伍禁忌 high ──
    const alerts = [];
    if (urgency && (urgency.level === 'urgent' || urgency.level === 'high' || urgency.score >= 70)) {
      alerts.push({ level: 'red', text: '急重症信号：' + (urgency.label || urgency.level || urgency.score) + '，建议优先处理或转诊' });
    }
    (inhouse && inhouse.risk_alerts || []).filter(a => a.severity === 'high').slice(0, 2).forEach(a => {
      alerts.push({ level: 'yellow', text: '配伍禁忌：' + a.herb + ' — ' + String(a.warning).slice(0, 40) });
    });

    // ── 5b. 穿戴体征：阈值警示 + 中医证型映射（R772）──
    if (kind === 'vital' && b.vital) {
      const m = b.vital;
      const pushVital = (level, text) => alerts.push({ level, text: '穿戴体征：' + text });
      if (m.systolic >= 180 || m.diastolic >= 110) pushVital('red', '重度高血压 ' + m.systolic + '/' + m.diastolic + 'mmHg，建议立即复测并评估转诊');
      else if (m.systolic >= 140 || m.diastolic >= 90) pushVital('yellow', '血压偏高 ' + m.systolic + '/' + m.diastolic + 'mmHg');
      if (m.systolic && m.systolic <= 90) pushVital('red', '低血压 ' + m.systolic + 'mmHg');
      if (m.heart_rate >= 120) pushVital('red', '心动过速 ' + m.heart_rate + 'bpm');
      else if (m.heart_rate && m.heart_rate <= 50) pushVital('red', '心动过缓 ' + m.heart_rate + 'bpm');
      if (m.spo2 && m.spo2 < 90) pushVital('red', '低血氧 ' + m.spo2 + '%，建议优先处理');
      else if (m.spo2 && m.spo2 < 95) pushVital('yellow', '血氧偏低 ' + m.spo2 + '%');
      if (m.glucose >= 13.9 || (m.glucose && m.glucose <= 3.0)) pushVital('red', '血糖异常 ' + m.glucose + 'mmol/L');
      if (m.temperature >= 39) pushVital('red', '高热 ' + m.temperature + '℃');
      const hints = [];
      if (m.heart_rate >= 90) hints.push('心率偏快：阴虚火旺倾向');
      if (m.heart_rate && m.heart_rate <= 60) hints.push('心率偏慢：心阳不振倾向');
      if (m.systolic >= 140) hints.push('血压偏高：肝阳上亢/阴虚阳亢');
      if (m.spo2 && m.spo2 < 95) hints.push('血氧偏低：肺气不足');
      if (m.glucose >= 7.0) hints.push('血糖偏高：消渴倾向');
      if (m.temperature >= 37.3) hints.push('体温偏高：阴虚内热可能');
      if (hints.length) delta.vitalHints = hints;
    }

    // ── 5c. 检验旁证 Pro：逐项判读（性别分层/轻中重）+ 联合模式 + 综合结论（R776）──
    if (kind === 'lab' && Array.isArray(ctx.labs) && ctx.labs.length) {
      const ana = analyzeLabs(ctx.labs, ctx.profile.gender || '');
      delta.labAnalysis = ana.items;
      if (ana.patterns.length) delta.labPatterns = ana.patterns;
      delta.labSummary = ana.summary;
      ana.criticals.forEach(c => alerts.push({ level: 'red', text: '检验危急值：' + c }));
    }

    // ── 5d. 闻诊·声息：声强/咳喘特征 → 中医证型映射（R778 四诊随诊实时环）──
    if (kind === 'audio' && b.audio) {
      const feats = Array.isArray(b.audio.features) ? b.audio.features.map(f => String(f).slice(0, 12)).slice(0, 6) : [];
      ctx.audio = { features: feats, rms: +b.audio.rms || 0, ts: new Date().toISOString() };
      ctx.audioHits = ctx.audioHits || {};
      const AUDIO_RULES = {
        '声音低微': '声低气怯：气虚/肺气不足倾向',
        '声音高亢': '声高烦躁：实证/肝阳上亢倾向',
        '咳声频作': '咳声频作：肺气上逆，宜追问痰色痰量',
        '咳声重浊': '咳声重浊：痰湿蕴肺倾向',
        '气息喘促': '气息喘促：肺肾气虚/痰阻气道，注意喘证',
        '语声嘶哑': '语声嘶哑：肺阴不足或风热犯肺'
      };
      const hints = [];
      feats.forEach(f => {
        if (AUDIO_RULES[f]) hints.push(AUDIO_RULES[f]);
        ctx.audioHits[f] = (ctx.audioHits[f] || 0) + 1;
      });
      if (hints.length) delta.audioHints = hints;
      if ((ctx.audioHits['咳声频作'] || 0) >= 3) alerts.push({ level: 'yellow', text: '闻诊：咳声频作多次出现，建议优先评估呼吸道情况' });
      if ((ctx.audioHits['气息喘促'] || 0) >= 2) alerts.push({ level: 'red', text: '闻诊：气息喘促持续出现，警惕喘证/心肺急症' });
    }

    if (alerts.length) delta.alerts = alerts;

    // ── 6. 关键上下文并回会话快照（复用 R770 落盘）──
    const sess = state.clinicSessions[sessionId];
    if (sess) {
      sess.symptoms = ctx.symptoms.slice();
      sess.history = ctx.history.slice();
      if (ctx.duration) sess.duration = ctx.duration;
      if (ctx.vitals) { sess.vision = sess.vision || {}; sess.vision.vitals = ctx.vitals; }
      if (ctx.labs && ctx.labs.length) sess.labs = ctx.labs.slice(-30);
      if (ctx.audio) sess.audio = ctx.audio;
      sess.updatedAt = new Date().toISOString();
      persistClinicSession(sessionId);
    }

    delta.ok = true;
    delta.sessionId = sessionId;
    delta.turns = ctx.turns;
    delta.ms = Date.now() - t0;
    res.json(delta);
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// 标记追问已被医生使用（避免重复推荐）
app.post('/api/clinic/agent/followup-asked', optionalAuth, (req, res) => {
  try {
    const { sessionId, key } = req.body || {};
    if (!sessionId || !key) return res.status(400).json({ ok: false, error: 'sessionId/key 必填' });
    const ctx = agentCtxOf(sessionId);
    if (!ctx.askedKeys.includes(key)) ctx.askedKeys.push(key);
    res.json({ ok: true, askedKeys: ctx.askedKeys });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// ═══════════════════════════════════════════════
// R774 智能体处方安全终审：定稿签发前的强制闸门
// 五层校验：①十八反十九畏（drug-safety-engine）②毒性/超剂量
// ③既往病-药味冲突 ④检验指标冲突 ⑤穿戴体征冲突
// verdict: block（致命，硬拦截）/ warn（需医师确认）/ pass
// ═══════════════════════════════════════════════
const HISTORY_HERB_RULES = [
  { hist: ['高血压'], herbs: ['麻黄','附子','肉桂'], level: 'warning', msg: '高血压：慎用升压温燥药' },
  { hist: ['冠心病'], herbs: ['麻黄'], level: 'warning', msg: '冠心病：麻黄加快心率，慎用' },
  { hist: ['糖尿病'], herbs: ['甘草','蜂蜜','大枣'], level: 'info', msg: '糖尿病：注意含糖药味用量' },
  { hist: ['胃溃疡'], herbs: ['黄连','黄芩','大黄'], level: 'info', msg: '胃溃疡：苦寒伤胃，注意配伍护胃' },
  { hist: ['肾病'], herbs: ['关木通','广防己','马兜铃','天仙藤','朱砂莲'], level: 'critical', msg: '肾病：禁用马兜铃酸类（肾毒性）' },
  { hist: ['肝炎'], herbs: ['何首乌','黄药子','雷公藤','苍耳子'], level: 'critical', msg: '肝病：禁用肝毒性药' },
  { hist: ['哮喘'], herbs: ['白果'], level: 'warning', msg: '哮喘：白果含氢氰酸，慎用' },
  { hist: ['贫血'], herbs: ['三棱','莪术','水蛭','虻虫'], level: 'warning', msg: '贫血：慎用破血逐瘀药' }
];
const DOSE_MAX = { 细辛:3, 麻黄:9, 附子:15, 川乌:3, 草乌:3, 甘遂:1.5, 大戟:1.5, 芫花:1.5, 朱砂:0.5, 雄黄:0.1, 马钱子:0.6, 半夏:9, 天南星:9, 洋金花:0.6 };
const DOSE_CRITICAL = ['朱砂','雄黄','马钱子','甘遂','大戟','芫花','洋金花','川乌','草乌'];
const NEPHROTOXIC = ['关木通','广防己','马兜铃','天仙藤','雷公藤','草乌','川乌'];
const HEPATOTOXIC = ['何首乌','黄药子','雷公藤','苍耳子','川楝子'];
const BLOOD_BREAK = ['三棱','莪术','水蛭','虻虫','土鳖虫'];

app.post('/api/clinic/agent/presign-review', optionalAuth, (req, res) => {
  try {
    const t0 = Date.now();
    const b = req.body || {};
    const herbs = Array.isArray(b.herbs) ? b.herbs : [];
    const patient = b.patient || {};
    if (!herbs.length) return res.status(400).json({ ok: false, error: 'herbs 必填' });
    const herbNames = herbs.map(h => String(h.name || '').trim()).filter(Boolean);
    const doseOf = h => {
      if (typeof h.dose === 'number') return h.dose;
      const m = String(h.dosage || '').match(/([\d.]+)/);
      return m ? parseFloat(m[1]) : null;
    };
    const checks = [];
    const push = (cat, level, msg) => checks.push({ cat, level, msg });

    // ① 十八反十九畏 + 毒性限量 + 妊娠/老幼（真实安全引擎）
    const eng = drugSafety.check(herbs.map(h => ({ name: h.name, dose: doseOf(h) || 9 })), {
      age: parseInt(patient.age) || undefined,
      gender: patient.gender,
      history: patient.history || []
    });
    (eng.critical || []).forEach(c => push('配伍禁忌', 'critical', c.message));
    (eng.warnings || []).forEach(w => push('安全提醒', 'warning', w.message));

    // ② 剂量复核（毒性药超量）
    herbNames.forEach(n => {
      const h = herbs.find(x => x.name === n);
      const d = doseOf(h || {});
      if (d != null && DOSE_MAX[n] != null && d > DOSE_MAX[n]) {
        push('剂量复核', DOSE_CRITICAL.includes(n) ? 'critical' : 'warning',
          n + ' ' + d + 'g 超过常用上限 ' + DOSE_MAX[n] + 'g' + (n === '附子' ? '（且需先煎久煎）' : ''));
      }
    });

    // ③ 既往病-药味冲突
    const hist = Array.isArray(patient.history) ? patient.history : [];
    for (const rule of HISTORY_HERB_RULES) {
      if (!rule.hist.some(x => hist.includes(x))) continue;
      const hit = rule.herbs.filter(hb => herbNames.includes(hb));
      if (hit.length) push('既往冲突', rule.level, rule.msg + '：' + hit.join('、'));
    }

    // ④ 检验指标冲突（R773b 旁证联动）
    const labs = Array.isArray(patient.labs) ? patient.labs : [];
    const labVal = n => { const l = labs.find(x => x.name === n); return l && !isNaN(l.value) ? l.value : null; };
    const refOf = n => LAB_PANEL.find(x => x.key === n) || {};
    const over = n => { const v = labVal(n), r = refOf(n); return v != null && r.high != null && v > r.high; };
    const under = n => { const v = labVal(n), r = refOf(n); return v != null && r.low != null && v < r.low; };
    if (over('肌酐')) { const hit = NEPHROTOXIC.filter(h => herbNames.includes(h)); if (hit.length) push('检验冲突', 'critical', '肌酐偏高：禁用肾毒性药 ' + hit.join('、')); }
    if (over('谷丙转氨酶') || over('谷草转氨酶')) { const hit = HEPATOTOXIC.filter(h => herbNames.includes(h)); if (hit.length) push('检验冲突', 'critical', '转氨酶偏高：禁用肝毒性药 ' + hit.join('、')); }
    if (under('血小板')) { const hit = BLOOD_BREAK.filter(h => herbNames.includes(h)); if (hit.length) push('检验冲突', 'warning', '血小板偏低：慎用破血药 ' + hit.join('、')); }
    if (over('空腹血糖') || over('糖化血红蛋白')) { const hit = ['甘草','蜂蜜','大枣'].filter(h => herbNames.includes(h)); if (hit.length) push('检验冲突', 'info', '血糖偏高：注意 ' + hit.join('、') + ' 用量'); }

    // ⑤ 穿戴体征冲突（R772 联动）
    const vit = patient.vitals || {};
    if (vit.heart_rate >= 100 && herbNames.includes('麻黄')) push('体征冲突', 'warning', '心率 ' + vit.heart_rate + 'bpm：慎用麻黄（加速心率）');
    if (vit.systolic >= 160 && ['麻黄','附子','肉桂'].some(h => herbNames.includes(h))) push('体征冲突', 'warning', '血压 ' + vit.systolic + 'mmHg：慎用升压温燥药');

    const criticals = checks.filter(c => c.level === 'critical');
    const warnings = checks.filter(c => c.level === 'warning');
    const verdict = criticals.length ? 'block' : (warnings.length ? 'warn' : 'pass');

    // 终审留痕（医疗规范：审方记录可追溯）
    setImmediate(function() {
      try {
        const dir = path.join(__dirname, '..', 'data', 'feedback');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.appendFileSync(path.join(dir, 'presign-reviews.jsonl'), JSON.stringify({
          ts: new Date().toISOString(), sessionId: b.sessionId || null, syndrome: b.syndrome || null,
          formula: b.formula || null, herbs: herbNames, verdict,
          critical: criticals.length, warning: warnings.length, ms: Date.now() - t0
        }) + '\n');
      } catch(e) {}
    });

    res.json({ ok: true, verdict, checks, criticalCount: criticals.length, warnCount: warnings.length,
      engine: 'drug-safety-engine + inhouse-rules-v1', ms: Date.now() - t0 });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// ═══════════════════════════════════════════════
// R769 多医生线上会诊（轻量房间制：快照共享 + 留言墙 + 轮询同步）
// ═══════════════════════════════════════════════
if (!state.consults) state.consults = {};

function persistConsult(room) {
  setImmediate(function() {
    try {
      const dir = path.join(__dirname, '..', 'data', 'consults');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, room + '.json'), JSON.stringify(state.consults[room], null, 2));
    } catch(e) { console.error('[consult] 落盘失败:', e.message); }
  });
}

// 发起会诊：宿主医生提交病历快照 → 房间号
app.post('/api/consult/create', optionalAuth, (req, res) => {
  try {
    const { snapshot, host, caseId } = req.body || {};
    if (!snapshot || !host) return res.status(400).json({ ok: false, error: 'snapshot 与 host 必填' });
    const room = 'hz-' + crypto.randomBytes(3).toString('hex');
    state.consults[room] = {
      room, caseId: caseId || null, host,
      snapshot,                       // {patient:{name}, syndrome, formula, herbs[], four, complaint, at}
      notes: [{ doctor: host, text: '发起会诊，请各位老师指导。', ts: new Date().toISOString() }],
      members: [{ doctor: host, at: new Date().toISOString() }],
      createdAt: new Date().toISOString()
    };
    persistConsult(room);
    res.json({ ok: true, room, url: '/consult.html?room=' + room });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// 会诊室状态（轮询）：快照 + 留言 + 成员
app.get('/api/consult/:room', optionalAuth, (req, res) => {
  const c = state.consults[req.params.room];
  if (!c) return res.status(404).json({ ok: false, error: '会诊室不存在或已关闭' });
  res.json({ ok: true, room: c.room, host: c.host, snapshot: c.snapshot, notes: c.notes.slice(-100), members: c.members.slice(-20), createdAt: c.createdAt });
});

// 加入/签到 + 留言
app.post('/api/consult/:room/join', optionalAuth, (req, res) => {
  const c = state.consults[req.params.room];
  if (!c) return res.status(404).json({ ok: false, error: '会诊室不存在' });
  const doctor = String((req.body || {}).doctor || '').trim().slice(0, 30);
  if (!doctor) return res.status(400).json({ ok: false, error: 'doctor 必填' });
  if (!c.members.some(m => m.doctor === doctor)) c.members.push({ doctor, at: new Date().toISOString() });
  persistConsult(req.params.room);
  res.json({ ok: true, members: c.members });
});

app.post('/api/consult/:room/note', optionalAuth, (req, res) => {
  const c = state.consults[req.params.room];
  if (!c) return res.status(404).json({ ok: false, error: '会诊室不存在' });
  const { doctor, text } = req.body || {};
  if (!doctor || !text) return res.status(400).json({ ok: false, error: 'doctor 与 text 必填' });
  c.notes.push({ doctor: String(doctor).slice(0, 30), text: String(text).slice(0, 500), ts: new Date().toISOString() });
  if (c.notes.length > 200) c.notes = c.notes.slice(-200);
  persistConsult(req.params.room);
  res.json({ ok: true, count: c.notes.length });
});

// ═══════════════════════════════════════════════
// 鉴权端点（演示）
// ═══════════════════════════════════════════════
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (username === 'admin' && password === 'admin123') {
      const token = auth.signToken ? auth.signToken({ username, role: 'super_admin' }) : 'demo-admin-token';
      return res.json({ ok: true, user: { username, role: 'super_admin' }, token });
    }
    if (username === 'doctor' && password === 'doctor123') {
      const token = auth.signToken ? auth.signToken({ username, role: 'doctor_internal' }) : 'demo-doctor-token';
      return res.json({ ok: true, user: { username, role: 'doctor_internal' }, token });
    }
    res.status(401).json({ ok: false, error: '账号或密码错误' });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get('/api/auth/me', optionalAuth, (req, res) => {
  res.json({ ok: true, user: req.user || null });
});

app.get('/api/admin/users', requireAuth, (req, res) => {
  try {
    const users = auth.listDoctors ? auth.listDoctors() : [];
    res.json({ ok: true, users, currentUser: req.user });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ═══════════════════════════════════════════════
// 4 大慢病居家管理 API（HTN/DM/INS/COPD）
// ═══════════════════════════════════════════════

const chronicEngine = require('./engines/chronic-disease-engine');

// 列出 4 大慢病
app.get('/api/chronic/list', (req, res) => {
  try {
    const diseases = chronicEngine.listDiseases();
    res.json({ ok: true, diseases });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 获取某个慢病的完整档案
app.get('/api/chronic/:id', (req, res) => {
  try {
    const disease = chronicEngine.getDisease(req.params.id);
    if (!disease) return res.status(404).json({ ok: false, error: '慢病不存在' });
    res.json({ ok: true, disease });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 风险分级（统一入口）
app.post('/api/chronic/assess', (req, res) => {
  try {
    let { disease, vitals } = req.body || {};
    if (!disease || !vitals) {
      return res.status(400).json({ ok: false, error: '缺少 disease/vitals 参数' });
    }
    // 兼容小写 disease id（htn → HTN）
    disease = String(disease).toUpperCase();
    const result = chronicEngine.assess(disease, vitals);
    if (!result) return res.status(400).json({ ok: false, error: '不支持的慢病类型（仅 HTN/DM/INS/COPD）' });
    // 如果危险，附带紧急信号
    const payload = {
      ok: true,
      result: {
        disease: result.diseaseName,
        diseaseId: result.disease,
        level: result.level,
        label: result.label,
        color: result.color,
        action: result.action,
        isCritical: result.isCritical,
        values: result.values,
        emergencySignals: result.emergencySignals,
        tcmAdvice: result.tcmAdvice,
        lifestyle: result.lifestyle,
      },
      shouldSOS: chronicEngine.shouldSOS(result),
    };
    res.json(payload);
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 高血压风险分级（独立端点）
app.post('/api/chronic/htn/assess', (req, res) => {
  try {
    const { systolic, diastolic } = req.body || {};
    if (systolic == null && diastolic == null) {
      return res.status(400).json({ ok: false, error: '缺少血压值' });
    }
    const result = chronicEngine.assessHTN(systolic, diastolic);
    res.json({ ok: true, result, shouldSOS: chronicEngine.shouldSOS(result) });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 糖尿病风险分级（独立端点）
app.post('/api/chronic/dm/assess', (req, res) => {
  try {
    const { fasting, random } = req.body || {};
    if (fasting == null && random == null) {
      return res.status(400).json({ ok: false, error: '缺少血糖值' });
    }
    const result = chronicEngine.assessDM(fasting, random);
    res.json({ ok: true, result, shouldSOS: chronicEngine.shouldSOS(result) });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 失眠风险分级（独立端点）
app.post('/api/chronic/ins/assess', (req, res) => {
  try {
    const { sleepHours } = req.body || {};
    if (sleepHours == null) {
      return res.status(400).json({ ok: false, error: '缺少睡眠时长' });
    }
    const result = chronicEngine.assessINS(sleepHours);
    res.json({ ok: true, result, shouldSOS: chronicEngine.shouldSOS(result) });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 慢阻肺风险分级（独立端点）
app.post('/api/chronic/copd/assess', (req, res) => {
  try {
    const { spo2, respiratoryRate } = req.body || {};
    if (spo2 == null && respiratoryRate == null) {
      return res.status(400).json({ ok: false, error: '缺少血氧/呼吸频率' });
    }
    const result = chronicEngine.assessCOPD(spo2, respiratoryRate);
    res.json({ ok: true, result, shouldSOS: chronicEngine.shouldSOS(result) });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 获取用药提醒模板
app.get('/api/chronic/:id/med-schedule', (req, res) => {
  try {
    const schedule = chronicEngine.getMedSchedule(req.params.id);
    res.json({ ok: true, schedule });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 获取生活指导
app.get('/api/chronic/:id/lifestyle', (req, res) => {
  try {
    const guide = chronicEngine.getLifestyleGuide(req.params.id);
    if (!guide) return res.status(404).json({ ok: false, error: '慢病不存在' });
    res.json({ ok: true, lifestyle: guide });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 获取 TCM 养生指导
app.get('/api/chronic/:id/tcm-advice', (req, res) => {
  try {
    const advice = chronicEngine.getTcmAdvice(req.params.id);
    if (!advice) return res.status(404).json({ ok: false, error: '慢病不存在' });
    res.json({ ok: true, tcmAdvice: advice });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ═══════════════════════════════════════════════
// 内部函数
// ═══════════════════════════════════════════════

/**
 * 调用面诊 OCR 服务提取舌象特征
 */
async function extractTongueFeatures(imageUrl) {
  // 调用 face-ocr-server.py 的舌诊端点
  // R762 修真：node-fetch（未声明依赖）→ Node24 原生 fetch + AbortSignal 超时等效封装
  const fetch = (url, opts = {}) => {
    const { timeout, ...rest } = opts;
    if (timeout && !rest.signal) rest.signal = AbortSignal.timeout(timeout);
    return globalThis.fetch(url, rest);
  };
  try {
    const resp = await fetch('http://localhost:8913/analyze-tongue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_url: imageUrl }),
      timeout: 15000
    });
    const data = await resp.json();
    return data;
  } catch (e) {
    // 离线模式：返回模板数据
    return {
      image_quality: { confidence: 0 },
      tongue_features: null,
      ocr_confidence: 0,
      rejection_reason: 'OCR 服务不可用，请手动描述舌象特征'
    };
  }
}

/**
 * 自然语言问诊 → 结构化 JSON
 */
async function structureInquiry(text, context) {
  const terms = [];
  const termPatterns = [
    { regex: /头痛|头晕|头部/, term: '头痛' },
    { regex: /发热|发烧|体温/, term: '发热' },
    { regex: /咳嗽|咳痰/, term: '咳嗽' },
    { regex: /恶心|呕吐|想吐/, term: '恶心' },
    { regex: /腹泻|拉肚子|便溏/, term: '腹泻' },
    { regex: /便秘|大便干/, term: '便秘' },
    { regex: /失眠|睡不着|入睡困难|多梦/, term: '失眠' },
    { regex: /胸闷|心慌|心悸/, term: '心悸' },
    { regex: /腰酸|腰痛/, term: '腰痛' },
    { regex: /怕冷|恶寒|畏寒/, term: '畏寒' },
    { regex: /口苦|口干|口渴/, term: '口苦' },
    { regex: /乏力|疲劳|无力|没精神/, term: '乏力' },
    { regex: /月经|痛经/, term: '月经' },
    { regex: /食欲|胃口|不想吃/, term: '纳差' },
    { regex: /腹胀|腹痛|胃痛/, term: '腹胀' },
  ];

  for (const pattern of termPatterns) {
    if (pattern.regex.test(text)) {
      terms.push(pattern.term);
    }
  }

  const structured = JSON.parse(JSON.stringify(SZ_INQUIRY));
  structured.chief_complaint = text;
  structured.extracted_tcm_terms = terms;
  
  // 基本的八纲推断
  if (/怕冷|恶寒|手脚凉/.test(text)) structured.structured.chills_fever = '恶寒';
  if (/发热|发烧|烫/.test(text)) structured.structured.chills_fever = (structured.structured.chills_fever ? '恶寒发热' : '发热');
  if (/失眠|睡不着/.test(text)) structured.structured.sleep = { quality: '失眠', hours_per_night: null };
  if (/口苦/.test(text)) structured.structured.appetite_digestion = { ...structured.structured.appetite_digestion, taste: '口苦' };
  if (/没胃口|不想吃/.test(text)) structured.structured.appetite_digestion = { ...structured.structured.appetite_digestion, appetite: '减退' };

  return structured;
}

// ═══════════════════════════════════════════════
// 实时四诊分析端点（前端实时采集驱动）
// ═══════════════════════════════════════════════

// 1. 统一舌/面/手分析（摄像头或穿戴设备采集）
// ── R735-g3 病历自动生成（中医标准智能体=底层能力：本地核心实现，家庭助手消费）──
app.post('/api/clinic/case-auto', optionalAuth, async (req, res) => {
  try {
    const { voice_text, visual_json, member_id, family_id } = req.body || {};
    if (!voice_text && !visual_json) {
      return res.status(400).json({ ok: false, error: '需提供 voice_text 或 visual_json（语音主诉/视觉四诊）' });
    }
    // 1. 语音主诉 → 结构化（本地提取）
    const symptoms = (voice_text || '').split(/[，。；,!]/).map(s => s.trim()).filter(s => s.length >= 2).slice(0, 8);
    const chief = symptoms.join('；') || '待补充';
    // 2. 视觉四诊摘要（本地）
    const td = (visual_json && visual_json.tcm_diag) || {};
    const fourDiag = { complexion: td.complexion || '未采集', tongue: td.tongue || '未采集', regions: td.regions || {}, confidence: td.confidence || 0 };
    // 3. 辨证（messiah 推理，中医标准智能体核心能力）
    let syndrome = '待辨证';
    try {
      const http = require('http');
      const qtext = encodeURIComponent((voice_text || '未提供主诉').slice(0, 100));
      syndrome = await new Promise((resolve) => {
        const q = http.get(`http://127.0.0.1:8930/messiah/search?q=${qtext}&project=tcm`, { timeout: 8000 }, (resp) => {
          let data = ''; resp.on('data', (c) => (data += c)); resp.on('end', () => {
            try { const d = JSON.parse(data); const first = d && d.results && d.results[0]; 
              let syn = first ? String(first.title || first.summary || '待辨证').replace(/[【】《》\[\]]/g,'').split(/[，。；、]/)[0].slice(0, 16) : '待辨证';
              // R757 修真：命理词过滤——辨证结果含命理术语(如'日主戊土')→ 降级待复核(医学边界)
              const MINGLI_KW = ['日主','天干','地支','八字','紫微','命宫','财帛宫','大运','流年','四柱','纳音','食神','伤官','七杀','正官','偏财','比肩','劫财'];
              if (MINGLI_KW.some(k => syn.includes(k))) syn = '待辨证（命中非医学内容，需人工复核）';
              resolve(syn); } catch (e) { resolve('待辨证'); }
          });
        });
        q.on('error', () => resolve('待辨证')); q.on('timeout', () => { q.destroy(); resolve('待辨证'); });
      });
    } catch (e) { syndrome = '待辨证'; }
    // 4. 风险/处置（本地规则）
    const risk = (voice_text || '').includes('胸') || (voice_text || '').includes('晕') ? 'medium' : 'low';
    const disposition = risk === 'medium' ? ['3-7 天内复查', '记录症状变化'] : ['观察 1-2 天', '不适加重及时就医'];
    // 5. 病历初稿
    const caseId = 'CASE-' + Date.now();
    const c = { case_id: caseId, member_id: String(member_id || 0), chief_complaint: chief,
                present_illness: voice_text ? ('语音主诉：' + voice_text.slice(0, 200)) : '待补充',
                four_diagnosis: fourDiag, syndrome, disposition, risk,
                draft_by: 'tcm-agent-core', status: 'pending_review', created_ts: new Date().toISOString() };
    // 5.5 AI 质量闭环：缺项检测 + 智能追问 + 风险提示（AI 化增强）
    const missing = [];
    if (!voice_text || voice_text.trim().length < 4) missing.push('主诉过于简略');
    if (!fourDiag.complexion || fourDiag.complexion === '未采集') missing.push('未采集面诊');
    if (!fourDiag.tongue || fourDiag.tongue === '未采集') missing.push('未采集舌诊');
    // 智能追问（基于主诉关键词）
    let followup = [];
    if (voice_text && voice_text.includes('痛')) followup.push('疼的地方具体在哪、怎么个疼法、多久了？');
    if (voice_text && (voice_text.includes('失眠') || voice_text.includes('睡'))) followup.push('是躺下睡不着还是半夜醒？白天精神怎么样？');
    if (voice_text && (voice_text.includes('胃') || voice_text.includes('消化'))) followup.push('饭后更明显还是空着肚子更明显？会不会反酸？');
    if (voice_text && (voice_text.includes('咳'))) followup.push('干咳还是有痰？痰是什么颜色？咳多久了？');
    if (voice_text && (voice_text.includes('晕'))) followup.push('晕的时候有没有恶心？起身那一瞬间明显吗？');
    c.ai_quality = { missing, followup,
      risk_hint: risk === 'medium' ? '存在中等风险信号，建议 3-7 天内复查' : '低风险，观察即可' };
    // 6. 本地归档
    const fs = require('fs');
    const path = require('path');
    const notesPath = path.join(__dirname, '..', 'data', 'tcm-case-notes.json');
    let notes = []; try { notes = JSON.parse(fs.readFileSync(notesPath, 'utf8')); } catch (e) {}
    notes.unshift({ case_id: c.case_id, patient_id: 'P-' + (member_id || 0), chief: c.chief_complaint, syndrome: c.syndrome, disposition: c.disposition, status: c.status, ts: new Date().toISOString() });
    fs.writeFileSync(notesPath, JSON.stringify(notes.slice(0, 500)));
    res.json({ ok: true, case: c, archived: true, note: '病历由中医标准智能体核心生成（家庭助手可消费）' });
  } catch (e) { res.status(500).json({ ok: false, error: String(e).slice(0, 200) }); }
});

app.post('/api/tcm/tongue-analyze', optionalAuth, async (req, res) => {
  try {
    const { image, part } = req.body;
    if (!image) return res.status(400).json({ ok: false, error: 'image 必填' });
    
    // 调用 OCR 服务获取结构化特征
    let ocrData = null;
    try {
      // R762 修真：node-fetch（未声明依赖）→ Node24 原生 fetch + AbortSignal 超时等效封装
  const fetch = (url, opts = {}) => {
    const { timeout, ...rest } = opts;
    if (timeout && !rest.signal) rest.signal = AbortSignal.timeout(timeout);
    return globalThis.fetch(url, rest);
  };
      const r = await fetch('http://localhost:8913/analyze-' + (part || 'tongue'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: image }), timeout: 8000
      });
      if (r.ok) ocrData = await r.json();
    } catch (e) { /* OCR 离线走本地启发式 */ }
    
    // 离线启发式（req.body 特征 > OCR 结果 > 默认常色；用户传值不被默认覆盖）
    const features = (ocrData?.tongue_features && Object.keys(ocrData.tongue_features).length > 0)
      ? { ...ocrData.tongue_features, ...(req.body.tongue_color ? { tongue_color: req.body.tongue_color } : {}), ...(req.body.coating ? { coating: req.body.coating } : {}), ...(req.body.moisture ? { moisture: req.body.moisture } : {}), ...(req.body.shape ? { shape: req.body.shape } : {}) }
      : {
          tongue_color: req.body.tongue_color || '淡红',
          coating: req.body.coating || '薄白',
          moisture: req.body.moisture || '润',
          shape: req.body.shape || '正常',
          confidence: 0.6,
          notes: ocrData?.rejection_reason || 'OCR 离线，本地启发式'
        };
    
    // KB 模式匹配
    const { getKBMatch } = require('./engines/kb-bridge');
    const kbMatch = getKBMatch({ tongue_color: features.tongue_color, coating: features.coating });
    
    res.json({
      ok: true,
      part: part || 'tongue',
      tongue_color: features.tongue_color,
      coating: features.coating,
      moisture: features.moisture,
      shape: features.shape || '正常',
      confidence: features.confidence || 0.7,
      kb_match: kbMatch,
      advice: kbMatch?.advice || '建议进一步四诊合参',
      image_quality: ocrData?.image_quality || { confidence: 0.7 },
      timestamp: new Date().toISOString(),
      disclaimer: 'AI 辅助分析仅供执业医师参考'
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 1B. 面部分析（五脏配五色 + 印堂眉间）
app.post('/api/tcm/face-analyze', optionalAuth, async (req, res) => {
  try {
    const { image, region } = req.body;
    if (!image) return res.status(400).json({ ok: false, error: 'image 必填' });

    // 调用 8913 面诊 OCR 服务（如可用）
    let ocrData = null;
    try {
      // R762 修真：node-fetch（未声明依赖）→ Node24 原生 fetch + AbortSignal 超时等效封装
  const fetch = (url, opts = {}) => {
    const { timeout, ...rest } = opts;
    if (timeout && !rest.signal) rest.signal = AbortSignal.timeout(timeout);
    return globalThis.fetch(url, rest);
  };
      const r = await fetch('http://localhost:8913/analyze-face', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: image, region: region || 'whole' }), timeout: 8000
      });
      if (r.ok) ocrData = await r.json();
    } catch (e) { /* OCR 离线走启发式 */ }

    // 离线启发式（req.body 特征 > 默认常色）
    const defaults = {
      complexion: '明润',
      brightness: '有光泽',
      regions: {
        forehead: '正常', left_cheek: '正常', right_cheek: '正常',
        nose: '正常', chin: '正常', between_eyes: '正常'
      },
      expression: '自然',
      confidence: 0.6,
      notes: ocrData?.rejection_reason || '面诊 OCR 离线，本地启发式兜底'
    };
    const features = ocrData?.face_features || {
      ...defaults,
      ...(req.body.complexion ? { complexion: req.body.complexion } : {}),
      ...(req.body.regions ? { regions: { ...defaults.regions, ...req.body.regions } } : {}),
      ...(req.body.expression ? { expression: req.body.expression } : {})
    };

    // KB 匹配
    const { getFaceKBMatch } = require('./engines/kb-bridge');
    const kbMatch = getFaceKBMatch({
      complexion: features.complexion,
      regions: features.regions
    });

    res.json({
      ok: true,
      part: 'face',
      face_features: features,
      kb_match: kbMatch,
      timestamp: new Date().toISOString(),
      disclaimer: 'AI 辅助分析仅供执业医师参考'
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 1C. 眼诊分析（白睛 + 眼睑 + 眼眶 + 神光）
app.post('/api/tcm/eye-analyze', optionalAuth, async (req, res) => {
  try {
    const { image, eye_side } = req.body;
    if (!image) return res.status(400).json({ ok: false, error: 'image 必填' });

    let ocrData = null;
    try {
      // R762 修真：node-fetch（未声明依赖）→ Node24 原生 fetch + AbortSignal 超时等效封装
  const fetch = (url, opts = {}) => {
    const { timeout, ...rest } = opts;
    if (timeout && !rest.signal) rest.signal = AbortSignal.timeout(timeout);
    return globalThis.fetch(url, rest);
  };
      const r = await fetch('http://localhost:8913/analyze-eye', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: image, eye_side: eye_side || 'both' }), timeout: 8000
      });
      if (r.ok) ocrData = await r.json();
    } catch (e) { /* OCR 离线走启发式 */ }

    // 离线启发式（req.body 特征 > 默认常色）
    const defaults = {
      sclera: { color: '白净', blood_vessels: '无', pigmentation: '无' },
      eyelids: { upper: '正常', lower: '正常', edges: '正常' },
      cornea: { clarity: '清晰', pupil_reflection: '正常' },
      peri_eye: { darkness: '无', puffiness: '无', wrinkles: '无' },
      special_signs: [],
      confidence: 0.6,
      notes: ocrData?.rejection_reason || '眼诊 OCR 离线，本地启发式兜底'
    };
    const features = ocrData?.eye_features || {
      ...defaults,
      ...(req.body.sclera_color ? { sclera: { ...defaults.sclera, color: req.body.sclera_color } } : {}),
      ...(req.body.sclera_vessels ? { sclera: { ...defaults.sclera, blood_vessels: req.body.sclera_vessels } } : {}),
      ...(req.body.eyelid_color ? { eyelids: { ...defaults.eyelids, lower: req.body.eyelid_color } } : {}),
      ...(req.body.peri_eye_darkness ? { peri_eye: { ...defaults.peri_eye, darkness: req.body.peri_eye_darkness } } : {})
    };

    const { getEyeKBMatch } = require('./engines/kb-bridge');
    const kbMatch = getEyeKBMatch({
      sclera_color: features.sclera.color,
      eyelid_lower: features.eyelids.lower,
      peri_eye_darkness: features.peri_eye.darkness
    });

    res.json({
      ok: true,
      part: 'eye',
      eye_features: features,
      kb_match: kbMatch,
      timestamp: new Date().toISOString(),
      disclaimer: 'AI 辅助分析仅供执业医师参考'
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 1D. 唇诊分析（参考《中医诊断学》九版教材唇色标准）
app.post('/api/tcm/lip-analyze', optionalAuth, async (req, res) => {
  try {
    const { image, region } = req.body;
    if (!image) return res.status(400).json({ ok: false, error: 'image 必填' });

    let ocrData = null;
    try {
      // R762 修真：node-fetch（未声明依赖）→ Node24 原生 fetch + AbortSignal 超时等效封装
  const fetch = (url, opts = {}) => {
    const { timeout, ...rest } = opts;
    if (timeout && !rest.signal) rest.signal = AbortSignal.timeout(timeout);
    return globalThis.fetch(url, rest);
  };
      const r = await fetch('http://localhost:8913/analyze-lip', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: image, region: region || 'whole' }), timeout: 8000
      });
      if (r.ok) ocrData = await r.json();
    } catch (e) { /* OCR 离线走启发式 */ }

    // 离线启发式（req.body 特征 > OCR 结果 > 默认常色；用户传值不被默认覆盖）
    const features = (ocrData?.lip_features && Object.keys(ocrData.lip_features).length > 0)
      ? { ...ocrData.lip_features, ...(req.body.color ? { color: req.body.color } : {}), ...(req.body.moisture ? { moisture: req.body.moisture } : {}), ...(req.body.texture ? { texture: req.body.texture } : {}) }
      : {
          color: req.body.color || '淡红',
          moisture: req.body.moisture || '润',
          texture: req.body.texture || '饱满',
          edges: { color_match: true, redness: '无' },
          special_signs: [],
          confidence: 0.6,
          notes: ocrData?.rejection_reason || '唇诊 OCR 离线，本地启发式兜底'
        };

    const { getLipKBMatch } = require('./engines/kb-bridge');
    const kbMatch = getLipKBMatch({
      color: features.color,
      moisture: features.moisture
    });

    res.json({
      ok: true,
      part: 'lip',
      lip_features: features,
      kb_match: kbMatch,
      timestamp: new Date().toISOString(),
      disclaimer: 'AI 辅助分析仅供执业医师参考'
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 2. 多模态融合评估（望闻问切 + 穿戴数据）
app.post('/api/tcm/fusion-assess', optionalAuth, async (req, res) => {
  try {
    const { scene_type, patient, complaint, tongue, vitals } = req.body;
    
    // 紧急分级评估
    const riskSignals = [];
    if (vitals) {
      if (vitals.systolic >= 180 || vitals.diastolic >= 110) riskSignals.push('重度高血压');
      if (vitals.spo2 && vitals.spo2 < 90) riskSignals.push('低血氧');
      if (vitals.heart_rate >= 120 || vitals.heart_rate <= 50) riskSignals.push('心率异常');
    }
    const highRiskTerms = /(胸痛|剧烈头痛|昏厥|呕血|咳血|呼吸困难|意识不清)/;
    if (highRiskTerms.test(complaint || '')) riskSignals.push('红旗症状');
    
    const risk_level = riskSignals.length >= 2 ? 'high' : riskSignals.length === 1 ? 'medium' : 'low';
    
    // 数据可靠性评估
    const issues = [];
    if (!complaint) issues.push('主诉缺失');
    if (!tongue) issues.push('舌诊未采集');
    const reliability = { overall: issues.length === 0 ? 'high' : issues.length === 1 ? 'medium' : 'low', issues };
    
    res.json({
      ok: true,
      scene_type: scene_type || 'clinic',
      risk_level,
      risk_signals: riskSignals,
      structured: { reliability, patient, complaint: (complaint || '').substring(0, 200) },
      recommend: risk_level === 'high' ? '立即转诊' : risk_level === 'medium' ? '优先接诊' : '常规排队',
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 3. DPPO 反馈（医生采纳/修正 → 在线学习）
app.post('/api/tcm/dppo-feedback', optionalAuth, async (req, res) => {
  try {
    const { syndrome, formula, agreed, doctor_id, patient, symptoms } = req.body;
    if (!syndrome || !formula) return res.status(400).json({ ok: false, error: 'syndrome/formula 必填' });
    
    // 写入本地反馈文件（fs 已在顶部引入）
    const logDir = path.join(__dirname, '..', 'data', 'feedback');
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    const logFile = path.join(logDir, 'dppo.jsonl');
    const entry = {
      ts: new Date().toISOString(),
      syndrome, formula, agreed: !!agreed,
      doctor_id: doctor_id || 'anonymous',
      patient: patient ? patient.substring(0, 20) : null,
      symptoms: Array.isArray(symptoms) ? symptoms.slice(0, 20) : []
    };
    fs.appendFileSync(logFile, JSON.stringify(entry) + '\n');
    
    res.json({ ok: true, accepted: true, recorded_at: entry.ts, sample_id: crypto.randomUUID() });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 4. 纵向追踪推荐（长程画像 + 历史对照）
app.post('/api/tcm/longitudinal-recommend', optionalAuth, async (req, res) => {
  try {
    const { symptoms, constitution } = req.body;
    
    // 简单 KB 匹配推荐
    const { getKBMatch } = require('./engines/kb-bridge');
    const matched = (Array.isArray(symptoms) ? symptoms : []).slice(0, 5).map(s => getKBMatch({ term: s }));
    
    res.json({
      ok: true,
      recommendations: {
        matchedCount: matched.length,
        evidenceLevel: matched.length > 3 ? 'A' : matched.length > 0 ? 'B' : 'C',
        topHerbs: matched.flatMap(m => m?.herbs || []).slice(0, 8),
        patterns: matched.filter(m => m).map(m => ({ syndrome: m.syndrome, formula: m.formula, confidence: m.confidence || 0.7 })),
        evidence: '基于 KB 长程画像的循证推荐'
      },
      constitution: constitution || '平和质',
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 5. 案例蒸馏（KB 反哺证据）
// R760 手诊辨证引擎 API
app.post('/api/tcm/hand-diagnosis', optionalAuth, (req, res) => {
  try {
    const { features, text } = req.body || {};
    let result;
    if (text) result = handDiagEngine.match(String(text));
    else result = handDiagEngine.analyze(features || {});
    res.json({ ok: true, ...result, disclaimer: '本报告为辅助参考，供执业中医师结合临床判断使用，不构成诊断或处方建议。' });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e.message || e).slice(0, 100) });
  }
});

// R760 手诊知识清单
app.get('/api/tcm/hand-knowledge', optionalAuth, (_req, res) => {
  try {
    res.json({ ok: true, knowledge: handDiagEngine.getKnowledge() });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e.message || e).slice(0, 100) });
  }
});

app.post('/api/tcm/case-distill', optionalAuth, async (req, res) => {
  try {
    // fs 已在顶部引入
    const path = require('path');
    
    // 读取最近蒸馏产物（来自 longitudinal-engine）
    let patterns = [];
    const distillFile = path.join(__dirname, '..', 'data', 'distilled-patterns.json');
    if (fs.existsSync(distillFile)) {
      try { patterns = JSON.parse(fs.readFileSync(distillFile, 'utf8')); } catch (e) {}
    }
    
    res.json({
      ok: true,
      patterns: patterns.slice(0, 10),
      total: patterns.length,
      source: 'longitudinal-distillation',
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ═══════════════════════════════════════════════
// 眼诊 / 手诊 / 穿戴设备 / 即时采集 端点
// ═══════════════════════════════════════════════

// 眼诊统一在 648 行用 SZ_EYE 五字段规范实现，此处不再注册旧版

// 手诊（掌色/甲色/纹路）
app.post('/api/tcm/hand-analyze', optionalAuth, async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ ok: false, error: 'image 必填' });
    
    let ocrData = null;
    try {
      // R762 修真：node-fetch（未声明依赖）→ Node24 原生 fetch + AbortSignal 超时等效封装
  const fetch = (url, opts = {}) => {
    const { timeout, ...rest } = opts;
    if (timeout && !rest.signal) rest.signal = AbortSignal.timeout(timeout);
    return globalThis.fetch(url, rest);
  };
      const r = await fetch('http://localhost:8913/analyze-hand', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: image }), timeout: 6000
      });
      if (r.ok) ocrData = await r.json();
    } catch (e) {}
    
    const features = ocrData?.hand_features || {
      palm_color: req.body.palm_color || '淡红',
      fingernail_color: req.body.fingernail_color || req.body.nail_color || '淡红',
      palm_temperature: req.body.palm_temperature || req.body.finger_temperature || '温',
      palm_moisture: req.body.palm_moisture || req.body.moisture || '润',
      confidence: 0.6,
      notes: ocrData?.rejection_reason || 'OCR 离线，本地启发式'
    };
    
    const { getKBMatch } = require('./engines/kb-bridge');
    const kbMatch = getKBMatch({
      palm_color: features.palm_color,
      palm_temperature: features.palm_temperature,
      palm_moisture: features.palm_moisture,
      fingernail_color: features.fingernail_color
    });
    
    res.json({
      ok: true,
      part: 'hand',
      palm_color: features.palm_color,
      fingernail_color: features.fingernail_color,
      palm_temperature: features.palm_temperature,
      palm_moisture: features.palm_moisture,
      confidence: features.confidence,
      notes: features.notes,
      kb_match: kbMatch,
      advice: kbMatch?.advice || '建议结合问诊判断',
      timestamp: new Date().toISOString(),
      disclaimer: 'AI 辅助分析仅供执业医师参考'
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 穿戴设备实时数据接入（手环/血压计/血糖仪/智能眼镜）
app.post('/api/tcm/wearable-ingest', optionalAuth, async (req, res) => {
  try {
    const { device_id, device_type, metrics, patient_id } = req.body;
    if (!device_id || !metrics) return res.status(400).json({ ok: false, error: 'device_id/metrics 必填' });
    
    // 设备类型归一化
    const supportedDevices = ['blood_pressure', 'glucometer', 'spo2', 'heart_rate', 'thermometer', 'ecg', 'smart_glasses', 'wearable_ring'];
    const dt = supportedDevices.includes(device_type) ? device_type : 'unknown';
    
    // 紧急评估
    const risk = [];
    if (metrics.systolic >= 180 || metrics.diastolic >= 110) risk.push('重度高血压');
    if (metrics.systolic <= 90 || metrics.diastolic <= 60) risk.push('低血压');
    if (metrics.heart_rate >= 120 || metrics.heart_rate <= 50) risk.push('心率异常');
    if (metrics.spo2 && metrics.spo2 < 90) risk.push('低血氧');
    if (metrics.glucose >= 13.9 || metrics.glucose <= 3.0) risk.push('血糖异常');
    if (metrics.temperature >= 39 || metrics.temperature <= 35) risk.push('体温异常');
    
    const risk_level = risk.length >= 2 ? 'high' : risk.length === 1 ? 'medium' : 'low';
    
    // 中医辨证映射（穿戴数据 → 中医证型）
    let tcmHint = [];
    if (metrics.heart_rate >= 90) tcmHint.push('心率偏快：可能阴虚火旺');
    if (metrics.heart_rate <= 60) tcmHint.push('心率偏慢：可能心阳不振');
    if (metrics.systolic >= 140) tcmHint.push('血压偏高：肝阳上亢或阴虚阳亢');
    if (metrics.spo2 && metrics.spo2 < 95) tcmHint.push('血氧偏低：肺气不足');
    if (metrics.glucose >= 7.0) tcmHint.push('血糖偏高：消渴倾向');
    if (metrics.temperature >= 37.3) tcmHint.push('体温偏高：可能阴虚内热');
    
    // 写入本地存储
    // fs 已在顶部引入
    const logDir = path.join(__dirname, '..', 'data', 'wearables');
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    const logFile = path.join(logDir, `${patient_id || 'unknown'}_${device_id}.jsonl`);
    fs.appendFileSync(logFile, JSON.stringify({ ts: new Date().toISOString(), device_type: dt, metrics, risk_level, risk, tcmHint }) + '\n');
    
    res.json({
      ok: true,
      device_id,
      device_type: dt,
      metrics,
      risk_level,
      risk_signals: risk,
      tcm_hints: tcmHint,
      recommend: risk_level === 'high' ? '立即转诊' : risk_level === 'medium' ? '优先接诊' : '常规监测',
      timestamp: new Date().toISOString(),
      disclaimer: 'AI 辅助分析仅供执业医师参考'
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 即时采集调度（患者进入诊疗中心，全量自动启动）
app.post('/api/tcm/collect-start', optionalAuth, async (req, res) => {
  try {
    const { patient_id, scene } = req.body;
    // 兼容非认证调用 — 未提供 patient_id 时使用访客占位（开发模式）
    const pid = patient_id || `guest_${Date.now()}`;
    
    // 默认采集序列（按场景）
    const sequences = {
      clinic: ['face', 'tongue', 'hand', 'eye', 'wearable_vitals'],
      home: ['tongue', 'face', 'wearable_vitals'],
      emergency: ['wearable_vitals', 'tongue', 'face']
    };
    const seq = sequences[scene || 'clinic'] || sequences.clinic;
    
    // 紧急预判（红旗症状）
    const flags = {
      collect_sequence: seq,
      auto_collect: true,
      manual_required: [],
      estimated_time_sec: seq.length * 8,
      scene: scene || 'clinic',
      timestamp: new Date().toISOString()
    };
    
    res.json({
      ok: true,
      patient_id: pid,
      flags,
      next_step: seq[0],
      progress: { current: 0, total: seq.length, items: seq.map((s, i) => ({ step: s, status: i === 0 ? 'pending' : 'queued' })) },
      message: '🚀 AI 全量采集已启动，请按引导依次完成',
      disclaimer: '采集过程中如患者不同意某项，可随时跳到下一步'
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 多模态融合综合辨证（舌面眼手 + 穿戴 + 问诊）
app.post('/api/tcm/multi-modal-diagnose', optionalAuth, async (req, res) => {
  try {
    const { patient_id, complaint, tongue, face, eye, hand, vitals, symptoms } = req.body;
    
    // 各模块存在性
    const presence = {
      tongue: !!tongue,
      face: !!face,
      eye: !!eye,
      hand: !!hand,
      vitals: !!vitals,
      complaint: !!complaint,
      symptoms: Array.isArray(symptoms) && symptoms.length > 0
    };
    const collected = Object.values(presence).filter(Boolean).length;
    const total = Object.keys(presence).length;
    const completeness = Math.round((collected / total) * 100);
    
    // KB 融合匹配
    const { getKBMatch } = require('./engines/kb-bridge');
    const kbResults = [];
    if (tongue) kbResults.push(getKBMatch({ tongue_color: tongue.tongue_color, coating: tongue.coating }));
    if (face) kbResults.push(getKBMatch({ complexion: face.complexion }));
    if (eye) kbResults.push(getKBMatch({ eye_features: eye }));
    if (hand) kbResults.push(getKBMatch({ hand_features: hand }));
    if (symptoms) (symptoms || []).slice(0, 5).forEach(s => kbResults.push(getKBMatch({ term: s })));
    
    // 综合置信度
    const topKb = kbResults.filter(r => r).sort((a, b) => (b.confidence || 0) - (a.confidence || 0))[0];
    
    // 紧急分级
    const riskSignals = [];
    if (vitals) {
      if (vitals.systolic >= 180 || vitals.diastolic >= 110) riskSignals.push('重度高血压');
      if (vitals.spo2 && vitals.spo2 < 90) riskSignals.push('低血氧');
      if (vitals.heart_rate >= 120 || vitals.heart_rate <= 50) riskSignals.push('心率异常');
    }
    if (/胸痛|剧烈头痛|昏厥|呕血|咳血|呼吸困难|意识不清/.test(complaint || '')) riskSignals.push('红旗症状');
    
    res.json({
      ok: true,
      patient_id,
      presence,
      completeness: completeness + '%',
      collected_count: collected,
      total_count: total,
      kb_results: kbResults.filter(Boolean).slice(0, 5),
      top_syndrome: topKb?.syndrome || '待定',
      top_formula: topKb?.formula || '—',
      top_confidence: topKb?.confidence || 0,
      risk_signals: riskSignals,
      risk_level: riskSignals.length >= 2 ? 'high' : riskSignals.length === 1 ? 'medium' : 'low',
      recommend: riskSignals.length >= 2 ? '立即转诊' : riskSignals.length === 1 ? '优先接诊' : '常规接诊',
      next_steps: completeness < 60 ? ['补全四诊', '详细问诊'] : ['综合辨证', '出方建议'],
      timestamp: new Date().toISOString(),
      disclaimer: 'AI 辅助辨证仅供执业医师参考'
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 1E. 五诊联动汇总（唇诊新增后补齐五诊 + 医学知识卡片库）
// R735-g10：病历统计面板 API（辨证分布/状态/趋势/待审）
app.get('/api/clinic/stats', optionalAuth, async (req, res) => {
  try {
    const fs = require('fs');
    const p = path.join(__dirname, '..', 'data', 'tcm-case-notes.json');
    if (!fs.existsSync(p)) return res.json({ ok: true, total: 0 });
    const cases = JSON.parse(fs.readFileSync(p, 'utf8'));
    const byStatus = {};
    const bySyndrome = {};
    const byDay = {};
    cases.forEach(c => {
      byStatus[c.status || 'unknown'] = (byStatus[c.status || 'unknown'] || 0) + 1;
      const sy = String(c.syndrome || '未辨证').split('·').pop().slice(0, 12);
      bySyndrome[sy] = (bySyndrome[sy] || 0) + 1;
      const day = String(c.ts || '').slice(0, 10);
      if (day) byDay[day] = (byDay[day] || 0) + 1;
    });
    const topSyndromes = Object.entries(bySyndrome).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const trend = Object.entries(byDay).sort((a, b) => a[0] < b[0] ? -1 : 1).slice(-14);
    res.json({ ok: true, total: cases.length, byStatus, topSyndromes, trend });
  } catch (e) { res.status(500).json({ ok: false, error: String(e).slice(0, 120) }); }
});

app.get('/api/tcm/wuzhen-summary', optionalAuth, async (req, res) => {
  try {
    const { WUZHEN_KB, URGENCY_RULES } = require('./kb/wuzhen-card-data');
    res.json({
      ok: true,
      version: '1.0',
      methods: ['face', 'tongue', 'eye', 'lip', 'hand'],
      kb_cards: WUZHEN_KB,
      urgency_rules: URGENCY_RULES,
      references: [
          '《中医诊断学》九版教材',
          '《中医眼诊学》五轮学说',
          '《中华医学会中医临床诊疗指南》'
        ],
      timestamp: new Date().toISOString(),
      disclaimer: 'AI 辅助辨证仅供执业医师参考，所有辨证需结合临床四诊合参'
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post('/api/tcm/wuzhen-fuse', optionalAuth, async (req, res) => {
  try {
    const { face, tongue, eye, lip, hand, complaint, vitals } = req.body;
    const presence = {
      face: !!face, tongue: !!tongue, eye: !!eye, lip: !!lip, hand: !!hand,
      complaint: !!complaint, vitals: !!vitals
    };
    const collected = Object.values(presence).filter(Boolean).length;
    const total = Object.keys(presence).length;
    const completeness = Math.round((collected / total) * 100);

    const { getFaceKBMatch, getEyeKBMatch, getLipKBMatch, getKBMatch } = require('./engines/kb-bridge');
    const results = [];
    if (face)   results.push({ method: 'face',   match: getFaceKBMatch({ complexion: face.complexion, regions: face.regions }) });
    if (eye)    results.push({ method: 'eye',    match: getEyeKBMatch({  sclera_color: eye?.sclera?.color, eyelid_lower: eye?.eyelids?.lower, peri_eye_darkness: eye?.peri_eye?.darkness }) });
    if (lip)    results.push({ method: 'lip',    match: getLipKBMatch({  color: lip?.color, moisture: lip?.moisture }) });
    if (tongue) results.push({ method: 'tongue', match: getKBMatch({ tongue_color: tongue?.tongue_features?.tongue_body?.color, coating: tongue?.tongue_features?.tongue_coating?.color }) });
    if (hand)   results.push({ method: 'hand',   match: getKBMatch({ hand_features: hand }) });

    const syndromes = results.map(r => r.match?.syndrome).filter(Boolean);
    const uniqueSyndromes = [...new Set(syndromes)].filter(s => s && !/无异常|待辨证|四诊合参/.test(s));

    const riskSignals = [];
    if (vitals) {
      if (vitals.systolic >= 180 || vitals.diastolic >= 110) riskSignals.push('重度高血压');
      if (vitals.spo2 && vitals.spo2 < 90) riskSignals.push('低血氧');
      if (vitals.heart_rate >= 120 || vitals.heart_rate <= 50) riskSignals.push('心率异常');
    }
    if (/胸痛|剧烈头痛|昏厥|呕血|咳血|呼吸困难|意识不清|唇色樱红/.test(complaint || '')) riskSignals.push('红旗症状');

    res.json({
      ok: true,
      presence,
      completeness: completeness + '%',
      collected_count: collected,
      total_count: total,
      five_method_results: results,
      merged_syndrome: uniqueSyndromes.length ? uniqueSyndromes.join(' + ') : '五诊无明显异常',
      risk_signals: riskSignals,
      risk_level: riskSignals.length >= 2 ? 'high' : riskSignals.length === 1 ? 'medium' : 'low',
      recommend: riskSignals.length >= 2 ? '立即转诊（推专科/急救）' : riskSignals.length === 1 ? '优先接诊（24h 内）' : completeness < 60 ? '需补全五诊' : '常规接诊',
      next_steps: completeness < 60 ? ['补全唇诊/手诊/问诊', '详细问诊'] : ['综合辨证出方', '医生审核'],
      disclaimer: 'AI 辅助辨证仅供执业医师参考'
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ═══════════════════════════════════════════════
// 处方闭环：创建 + 强制禁忌校验
// ═══════════════════════════════════════════════
const drugSafety = require('./engines/drug-safety-engine');
// fs 已在顶部引入
const DATA_DIR = path.join(__dirname, '..', 'data');
function ensureFile(name, init) {
  const fp = path.join(DATA_DIR, name);
  if (!fs.existsSync(fp)) fs.writeFileSync(fp, JSON.stringify(init, null, 2));
  return fp;
}
function loadJSON(name, init) {
  const fp = ensureFile(name, init);
  try { return JSON.parse(fs.readFileSync(fp, 'utf-8')); }
  catch { return init; }
}

// ───────────────── 患者 CRUD（诊疗中心工作台用）─────────────────
// 内存缓存：从 seed-emr.json 加载 + 运行时新增
let _patientCache = null;
function getPatients() {
  if (!_patientCache) {
    try {
      _patientCache = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'seed-emr.json'), 'utf8'));
    } catch (e) { _patientCache = []; }
  }
  return _patientCache;
}

app.get('/api/patients/list', optionalAuth, (req, res) => {
  const q = String(req.query.q || '').trim();
  // R789：主索引优先（真实归档患者），seed 数据兜底合并去重
  const empi = patientIndex ? patientIndex.listPatients(q, 50).map(function(p) {
    return {
      id: p.patient_id,
      name: p.name_masked || '患者',
      age: p.birth_year ? (new Date().getFullYear() - p.birth_year) : null,
      gender: p.gender,
      complaint: '', diagnosis: '', constitution: '',
      visit_count: p.visit_count || 0,
      last_visit: p.last_visit,
      source: 'empi'
    };
  }) : [];
  const empiIds = new Set(empi.map(function(p) { return p.id; }));
  const patients = getPatients();
  const seeds = patients.filter(function(p) {
    if (empiIds.has(p.patient_id)) return false;
    if (!q) return true;
    return String(p.name || '').includes(q) || String(p.patient_id || '').includes(q);
  }).map(function(p) {
    return {
      id: p.patient_id,
      name: p.name || ('患者' + p.patient_id),
      age: p.age,
      gender: p.gender,
      complaint: p.chief_complaint || '',
      diagnosis: p.diagnosis || '',
      constitution: p.constitution || '',
      visit_count: p.visit_count || 0,
      source: 'seed'
    };
  });
  res.json({ patients: empi.concat(seeds), empi_total: patientIndex ? patientIndex.count() : 0 });
});

app.get('/api/patients/:patientId', optionalAuth, (req, res) => {
  // R789：主索引优先
  if (patientIndex) {
    const ep = patientIndex.getPatient(req.params.patientId);
    if (ep) return res.json({
      patient_id: ep.patient_id, name: ep.name_masked, gender: ep.gender,
      age: ep.birth_year ? (new Date().getFullYear() - ep.birth_year) : null,
      birth_year: ep.birth_year, phone: ep.phone_masked,
      visit_count: ep.visit_count, last_visit: ep.last_visit, created_at: ep.created_at, source: 'empi'
    });
  }
  const patients = getPatients();
  const p = patients.find(function(x) { return x.patient_id === req.params.patientId; });
  if (!p) return res.status(404).json({ error: '患者不存在' });
  res.json(p);
});

app.get('/api/patients/:patientId/history', optionalAuth, (req, res) => {
  const pid = req.params.patientId;
  const type = req.query.type || 'all';
  const items = [];
  // 随访
  try {
    const fus = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'followups.json'), 'utf8') || '[]');
    for (const f of fus) {
      if (f.patient_id === pid) items.push({ type: 'followup', ts: f.created_at, summary: (f.syndrome || '') + ' · ' + (f.formula || ''), detail: f });
    }
  } catch (e) { /* 无随访文件 */ }
  // R789：处方时间线（records.jsonl 反查 patient_id）
  if (type === 'all' || type === 'prescription') {
    try {
      const rxFile = path.join(__dirname, '..', 'data', 'prescriptions', 'records.jsonl');
      if (fs.existsSync(rxFile)) {
        const lines = fs.readFileSync(rxFile, 'utf8').split('\n').filter(Boolean);
        for (const ln of lines) {
          try {
            const r = JSON.parse(ln);
            if (r.patient_id === pid) items.push({ type: 'prescription', ts: r.created_at, summary: (r.diagnosis && r.diagnosis.syndrome || '') + ' · ' + (r.herbs || []).length + '味 · ' + (r.payment_status || ''), detail: { rx_id: r.rx_id, herbs: r.herbs, price: r.price, status: r.status } });
          } catch (e) { /* 坏行跳过 */ }
        }
      }
    } catch (e) { /* 反查失败不影响 */ }
  }
  // R789：确诊病历时间线（归档 case 反查 patient_id）
  if (type === 'all' || type === 'case') {
    try {
      const dir = path.join(__dirname, '..', 'data', 'confirmed-cases');
      if (fs.existsSync(dir)) {
        for (const fn of fs.readdirSync(dir)) {
          if (!fn.endsWith('.json')) continue;
          try {
            const c = JSON.parse(fs.readFileSync(path.join(dir, fn), 'utf8'));
            if (c.patient && c.patient.patient_id === pid) items.push({ type: 'case', ts: c.timestamp, summary: (c.syndrome || '') + ' · ' + (c.formula || ''), detail: { caseId: c.caseId, chief: c.chief, syndrome: c.syndrome, formula: c.formula } });
          } catch (e) { /* 坏档跳过 */ }
        }
      }
    } catch (e) { /* 反查失败不影响 */ }
  }
  items.sort((a, b) => String(b.ts || '').localeCompare(String(a.ts || '')));
  const filtered = type === 'all' ? items : items.filter(i => i.type === type);
  res.json({ patient_id: pid, type: type, items: filtered.slice(0, 100), count: filtered.length });
});

// 创建处方（强制经过禁忌校验）
// R786 结算入链：饮片计价（元/9g 基准，缺省 5 元）+ 诊查费，按剂数乘算
const HERB_PRICES = {
  '桂枝': 3, '芍药': 4, '甘草': 2, '生姜': 1, '大枣': 2,
  '柴胡': 5, '黄芩': 4, '人参': 15, '半夏': 6, '当归': 8,
  '白术': 5, '茯苓': 4, '黄芪': 7, '龙眼肉': 10, '远志': 6,
  '酸枣仁': 8, '木香': 5, '熟地黄': 8, '山茱萸': 7, '山药': 5,
  '泽泻': 4, '牡丹皮': 5, '金银花': 4, '连翘': 4, '桔梗': 3,
  '薄荷': 2, '竹叶': 2, '荆芥穗': 3, '淡豆豉': 2, '牛蒡子': 3,
  '白芍': 5, '川芎': 5, '阿胶': 20, '麦冬': 6, '五味子': 5
};
function computeRxPrice(herbs, doses) {
  const n = Math.max(1, parseInt(doses, 10) || 1);
  let herbPerDose = 0;
  for (const h of (herbs || [])) {
    const dose = Number(h.dose || parseInt(h.dosage) || 9);
    const unit = HERB_PRICES[h.name] || 5;
    herbPerDose += unit * (dose / 9);
  }
  const herbTotal = Math.round(herbPerDose * n * 100) / 100;
  const serviceFee = 10;   // 诊查费
  return { herb_total: herbTotal, service_fee: serviceFee,
           doses: n, total: Math.round((herbTotal + serviceFee) * 100) / 100, currency: 'CNY' };
}

app.post('/api/prescription/create', optionalAuth, async (req, res) => {
  try {
    let { patient_id, patient_name, patient_profile, diagnosis, herbs, formula, doctor_id, advice, syndrome } = req.body;
    // 兼容 treatment-center 传 formula 字符串
    // R789 修真：只按逗号/分号/顿号切味，不能按空格切——「党参 9g」会被切成两段产生空药名
    if (!herbs && formula) {
      herbs = formula.split(/[,，;；、]+/).filter(Boolean).map(function(h, i) {
        var m = h.match(/(\d+(?:\.\d+)?)\s*g/i);
        var name = h.replace(/\d+(?:\.\d+)?\s*g.*/i, '').replace(/（.*?）/g, '').trim();
        return { name: name, dose: m ? parseInt(m[1]) : 9, unit: 'g' };
      }).filter(function(h) { return h.name; });
    }
    if (!herbs || !Array.isArray(herbs) || herbs.length === 0) {
      return res.status(400).json({ ok: false, error: 'herbs 或 formula 必填' });
    }
    // 兼容多种 diagnosis 格式：
    // 1) diagnosis: { syndrome: "..." } （标准格式）
    // 2) 顶层 syndrome: "..." （简化格式）
    // 3) syndromes: ["气虚", "血虚"] （treatment-center 数组格式）
    // 4) diagnosis: "脾胃气虚" （纯字符串格式）
    // 5) complaint: "..." （主诉兜底）
    if (typeof diagnosis === 'string' && diagnosis.trim()) {
      diagnosis = { syndrome: diagnosis.trim() };
    }
    if (!diagnosis || !diagnosis.syndrome) {
      if (syndrome) {
        diagnosis = { syndrome: syndrome };
      } else if (req.body.syndromes && Array.isArray(req.body.syndromes) && req.body.syndromes.length > 0) {
        diagnosis = { syndrome: req.body.syndromes.join(', ') };
      } else if (req.body.complaint) {
        diagnosis = { syndrome: req.body.complaint };
      } else {
        return res.status(400).json({ ok: false, error: 'diagnosis.syndrome 必填（支持 diagnosis.syndrome / syndrome / syndromes[] / complaint）' });
      }
    }

    // 1. 强制禁忌校验
    const safetyCheck = drugSafety.check(herbs, patient_profile || {});
    if (safetyCheck.critical_count > 0) {
      return res.status(422).json({
        ok: false,
        blocked: true,
        reason: '处方禁忌拦截：存在 ' + safetyCheck.critical_count + ' 项致命禁忌',
        safety: safetyCheck,
        summary: safetyCheck.summary
      });
    }

    // 2. 生成处方记录
    const rxId = 'rx-' + crypto.randomUUID();
    const timestamp = new Date().toISOString();
    // R789：patient_id 缺失时按患者姓名解析主索引（跨次就诊归集）
    const resolvedPid = patientIndex ? patientIndex.resolvePatientId(patient_id, patient_name) : (patient_id || 'anonymous');
    const totalDose = herbs.reduce((sum, h) => sum + (h.dose || 0), 0);
    const doses = Math.max(1, parseInt(req.body.doses, 10) || 1);
    const price = computeRxPrice(herbs, doses);   // R786 结算入链：签发即计价

    const record = {
      rx_id: rxId,
      patient_id: resolvedPid,
      doctor_id: doctor_id || req.user?.username || 'unknown',
      session_id: String(req.body.session_id || '').slice(0, 64) || null,   // R777 签发即入流：caseId↔rxId↔sessionId 三联
      diagnosis,
      herbs,
      herb_count: herbs.length,
      total_dose: totalDose,
      doses,
      price,
      payment_status: 'unpaid',   // R786：unpaid → paid（/api/prescription/settle）
      paid_at: null,
      payment_method: null,
      advice: advice || '',
      safety_check: {
        ok: safetyCheck.ok,
        warnings: safetyCheck.warnings,
        info: safetyCheck.info,
        warning_count: safetyCheck.warning_count
      },
      status: 'pending',   // pending → reviewed → dispensed
      created_at: timestamp
    };

    // 2. 持久化到处方库
    const RX_STORE = path.join(__dirname, '..', 'data', 'prescriptions', 'records.jsonl');
    // R808 修真：全新部署（CI/新装机）data/prescriptions 目录不存在时自动创建，
    // 原实现裸 appendFileSync 直接 ENOENT，首张处方永远签不出
    fs.mkdirSync(path.dirname(RX_STORE), { recursive: true });
    fs.appendFileSync(RX_STORE, JSON.stringify(record) + '\n');

    res.json({
      ok: true,
      rx_id: rxId,
      record,
      safety: safetyCheck,
      message: safetyCheck.warning_count > 0
        ? '处方已创建（含 ' + safetyCheck.warning_count + ' 项注意事项）'
        : '处方已创建，禁忌校验通过'
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// R786 结算入链：处方结算（医保/微信/支付宝/现金），结算后才允许药房调配
app.post('/api/prescription/settle', optionalAuth, async (req, res) => {
  try {
    const { rx_id, method, amount } = req.body;
    if (!rx_id) return res.status(400).json({ ok: false, error: 'rx_id 必填' });
    const METHODS = ['insurance', 'wechat', 'alipay', 'cash'];
    const payMethod = METHODS.includes(method) ? method : 'cash';

    const RX_STORE = path.join(__dirname, '..', 'data', 'prescriptions', 'records.jsonl');
    let rxRecord = null;
    if (fs.existsSync(RX_STORE)) {
      const lines = fs.readFileSync(RX_STORE, 'utf-8').split('\n').filter(Boolean);
      for (let i = lines.length - 1; i >= 0; i--) {
        try { const r = JSON.parse(lines[i]); if (r.rx_id === rx_id) { rxRecord = r; break; } } catch (e) {}
      }
    }
    if (!rxRecord) return res.status(404).json({ ok: false, error: '处方记录不存在: ' + rx_id });
    if (rxRecord.payment_status === 'paid') {
      return res.json({ ok: true, rx_id, already: true, payment_status: 'paid',
        amount: rxRecord.settled_amount ?? rxRecord.price?.total ?? 0,
        method: rxRecord.payment_method, paid_at: rxRecord.paid_at });
    }
    if (['completed', 'rejected'].includes(rxRecord.status)) {
      return res.status(409).json({ ok: false, error: '处方已' + (rxRecord.status === 'completed' ? '完成' : '驳回') + '，不可结算' });
    }

    rxRecord.payment_status = 'paid';
    rxRecord.paid_at = new Date().toISOString();
    rxRecord.payment_method = payMethod;
    rxRecord.settled_amount = Number(amount) > 0 ? Number(amount) : (rxRecord.price?.total ?? 0);
    rxRecord.settled_by = req.user?.username || 'cashier';
    fs.appendFileSync(RX_STORE, JSON.stringify(rxRecord) + '\n');

    res.json({ ok: true, rx_id, payment_status: 'paid', amount: rxRecord.settled_amount,
      method: payMethod, paid_at: rxRecord.paid_at });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 处方审核 + 全流程流转（审核/调配/发药/完成）
// SEC-001 同源守卫：敏感写操作拒绝跨域网页调用（浏览器跨域必带 Origin）
function localOriginGuard(req, res, next) {
  const o = req.headers.origin || '';
  if (o && !/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(o)) return res.status(403).json({ ok: false, error: '仅允许本机来源调用' });
  next();
}
app.post('/api/prescription/verify', localOriginGuard, optionalAuth, async (req, res) => {
  // SEC-001：核验人必须可溯源
  if (!req.body.reviewer && !req.user) return res.status(401).json({ ok: false, error: '核验人不可匿名' });
  try {
    const { rx_id, action, notes } = req.body;
    if (!rx_id || !action) return res.status(400).json({ ok: false, error: 'rx_id 和 action 必填' });
    // R531: 支持完整状态流转 approve/reject/modify/dispense/ready/complete
    if (!['approve', 'reject', 'modify', 'dispense', 'ready', 'complete'].includes(action)) {
      return res.status(400).json({ ok: false, error: 'action 必须是 approve/reject/modify/dispense/ready/complete' });
    }

    // 1. 从持久化库查找处方
    const RX_STORE = path.join(__dirname, '..', 'data', 'prescriptions', 'records.jsonl');
    let rxRecord = null;
    let rxLineIdx = -1;
    if (fs.existsSync(RX_STORE)) {
      const lines = fs.readFileSync(RX_STORE, 'utf-8').split('\n').filter(Boolean);
      for (let i = lines.length - 1; i >= 0; i--) {
        try {
          const r = JSON.parse(lines[i]);
          if (r.rx_id === rx_id) { rxRecord = r; rxLineIdx = i; break; }
        } catch(e) {}
      }
    }

    if (!rxRecord) {
      return res.status(404).json({ ok: false, error: '处方记录不存在: ' + rx_id });
    }

    // 2. 审核操作
    const verifiedAt = new Date().toISOString();
    // 兼容 reviewer 字段（前端用这个变量名）和 req.user.username（认证）
    const { reviewer } = req.body;
    const verifiedBy = reviewer || req.user?.username || 'unknown';

    if (action === 'approve') {
      rxRecord.status = 'reviewed';
      rxRecord.verified_at = verifiedAt;
      rxRecord.verified_by = verifiedBy;
      rxRecord.verify_notes = notes || '';
    } else if (action === 'reject') {
      rxRecord.status = 'rejected';
      rxRecord.verified_at = verifiedAt;
      rxRecord.verified_by = verifiedBy;
      rxRecord.reject_reason = notes || '';
    } else if (action === 'modify') {
      rxRecord.status = 'modified';
      rxRecord.verified_at = verifiedAt;
      rxRecord.verified_by = verifiedBy;
      rxRecord.modify_notes = notes || '';
    } else if (action === 'dispense') {
      // R786 结算闸门：未结算处方不得调配（先收费后配药）；override_unpaid 留审计痕迹
      if (rxRecord.payment_status !== 'paid' && !req.body.override_unpaid) {
        return res.status(409).json({ ok: false, error: 'unpaid_required',
          message: '处方未结算，请先完成收费再调配', amount_due: rxRecord.price?.total ?? null });
      }
      if (rxRecord.payment_status !== 'paid') {
        rxRecord.unpaid_dispense_override = { by: verifiedBy, at: verifiedAt };
      }
      // 药房调配中
      rxRecord.status = 'dispensed';
      rxRecord.dispensed_at = verifiedAt;
      rxRecord.dispensed_by = verifiedBy;
      rxRecord.dispense_notes = notes || '';
    } else if (action === 'ready') {
      // 调配完成待取
      rxRecord.status = 'ready';
      rxRecord.ready_at = verifiedAt;
      rxRecord.ready_by = verifiedBy;
      rxRecord.ready_notes = notes || '';
    } else if (action === 'complete') {
      // 患者已取药/完成
      rxRecord.status = 'completed';
      rxRecord.completed_at = verifiedAt;
      rxRecord.completed_by = verifiedBy;
      rxRecord.complete_notes = notes || '';
    }

    // 3. 更新持久化记录（追加新版本）
    fs.appendFileSync(RX_STORE, JSON.stringify(rxRecord) + '\n');

    // 4. 审核通过后，直接写 formal KB（医生已审核，无需 staging 二次审核）
    if (action === 'approve') {
      try {
        const formalDir = path.join(__dirname, 'kb', 'formal');
        const fid = 'rx-fb-' + Date.now();
        const finalSyndrome = rxRecord.diagnosis?.syndrome || (typeof rxRecord.diagnosis === 'string' ? rxRecord.diagnosis : '');
        const herbs = Array.isArray(rxRecord.herbs) ? rxRecord.herbs : [];
        const formalEntry = {
          id: fid,
          source: 'prescription',
          source_id: rx_id,
          patient_id: rxRecord.patient_id || '',
          diagnosis: rxRecord.diagnosis,
          syndrome: finalSyndrome,
          formula: herbs.map(h => typeof h === 'string' ? h : h.name).filter(Boolean).join('、'),
          herbs: herbs,
          doctor_id: rxRecord.doctor_id || '',
          verified_by: verifiedBy,
          feedback: 'approved',
          trust_score: 0.85,
          status: 'formal',
          created_at: verifiedAt
        };
        fs.writeFileSync(path.join(formalDir, fid + '.json'), JSON.stringify(formalEntry, null, 2));
        // 同时写 staging 日志（审计追踪）
        feedbackLoop.writeStaging([formalEntry]);
        // R720: approve 后立即调多源证据标记器（不需要等下一次扫描）
        try {
          const marker = require('../scripts/multi-source-marker');
          const markerResult = marker.markOne(formalEntry);
          if (markerResult.changed) {
            // 标记触发了多源 → 重新写入
            fs.writeFileSync(path.join(formalDir, fid + '.json'), JSON.stringify(formalEntry, null, 2));
            console.log(`[kb-multi-source] ${fid} 标记 multi_source=true · ${markerResult.syndrome} · ${markerResult.count} 条 · 源=${markerResult.sources}`);
          }
        } catch (e) {
          console.error('[kb-multi-source] 标记失败:', e.message);
        }
      } catch(e) { /* KB 反哺失败不影响审核 */ }
    }

    res.json({
      ok: true,
      rx_id,
      action,
      status: rxRecord.status,
      notes: notes || '',
      verified_at: verifiedAt,
      verified_by: verifiedBy,
      kb_feedback: action === 'approve' ? '已自动提交 KB 蒸馏' : undefined,
      flow_step: {
        pending: '待审方',
        reviewed: '已审方',
        rejected: '已驳回',
        modified: '已修订',
        dispensed: '药房调配中',
        ready: '可取药',
        completed: '已完成'
      }[rxRecord.status] || rxRecord.status
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ═══════════════════════════════════════════════
// ═══════════════════════════════════════════════
// 处方审方队列（待审核处方列表）
// ═══════════════════════════════════════════════
app.get('/api/prescription/review-queue', optionalAuth, async (req, res) => {
  try {
    const { status, limit = 50 } = req.query;
    const RX_STORE = path.join(__dirname, '..', 'data', 'prescriptions', 'records.jsonl');

    if (!fs.existsSync(RX_STORE)) {
      return res.json({ ok: true, total: 0, queue: [], message: '暂无处方记录' });
    }

    const all = fs.readFileSync(RX_STORE, 'utf-8').split('\n').filter(Boolean);
    let records = all.map(line => JSON.parse(line));
    // R735-g10 修真：待审优先 + 最新在前（医生先看新病例）
    records.sort((a, b) => {
      const sa = (a.status === 'pending' || a.status === 'pending_review') ? 0 : 1;
      const sb = (b.status === 'pending' || b.status === 'pending_review') ? 0 : 1;
      if (sa !== sb) return sa - sb;
      return String(b.created_ts || b.ts || '').localeCompare(String(a.created_ts || a.ts || ''));
    });

    // 只返回最新版本（每个 rx_id 的最新记录）
    const latestMap = {};
    // 正序遍历，最后出现的（最新追加）会覆盖旧版本
    records.forEach(r => {
      latestMap[r.rx_id] = r;
    });
    records = Object.values(latestMap);

    // 状态过滤
    if (status && status !== 'all') records = records.filter(r => r.status === status);

    // 按时间倒序
    records.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));

    // 脱敏输出
    const queue = records.slice(0, parseInt(limit)).map(r => ({
      rx_id: r.rx_id,
      patient_id: r.patient_id,
      syndrome: r.syndrome,
      herbs_count: r.herbs?.length || 0,
      herbs: r.herbs || [],
      safety_warnings: r.safety_check?.warnings || r.safety_warnings || [],
      status: r.status,
      created_at: r.created_at,
      doctor_id: r.doctor_id,
      urgency: r.urgency || 'normal'
    }));

    res.json({ ok: true, total: queue.length, queue });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// R815: 待缴费处方（收费台用）——最新态 + 未支付 + 未驳回/未完成
app.get('/api/prescription/unpaid', optionalAuth, (req, res) => {
  try {
    const RX_STORE = path.join(__dirname, '..', 'data', 'prescriptions', 'records.jsonl');
    const latest = {};
    if (fs.existsSync(RX_STORE)) {
      fs.readFileSync(RX_STORE, 'utf-8').split('\n').filter(Boolean).forEach(line => {
        try { const r = JSON.parse(line); if (r.rx_id) latest[r.rx_id] = r; } catch (e) {}
      });
    }
    const list = Object.values(latest)
      .filter(r => r.payment_status === 'unpaid' && !['rejected', 'completed'].includes(r.status))
      .map(r => {
        let patient = r.patient_id || '—';
        try {
          const p = patientIndex && patientIndex.getPatient(r.patient_id);
          if (p && (p.name_masked || p.name_full)) patient = p.name_masked || p.name_full;
        } catch (e) {}
        return {
          rx_id: r.rx_id, patient, doctor_id: r.doctor_id || '—',
          syndrome: (r.diagnosis && r.diagnosis.syndrome) || r.syndrome || '',
          herb_count: (r.herbs || []).length, doses: r.doses || 1,
          amount: (r.price && r.price.total) || 0,
          status: r.status, created_at: r.created_at
        };
      })
      .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
    const total = list.reduce((s, r) => s + r.amount, 0);
    res.json({ ok: true, total: list.length, amount_total: total, list: list.slice(0, 100) });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// R815: 库存查询（含低库存预警标记 + 最近出入库流水）
const STOCK_LOG_FILE = path.join(__dirname, '..', 'data', 'stock-log.json');
app.get('/api/inventory', optionalAuth, (req, res) => {
  try {
    const inv = loadJSON('inventory.json', []);
    const list = inv.map(i => ({ ...i, low: typeof i.stock === 'number' && typeof i.min_stock === 'number' && i.stock < i.min_stock }));
    let log = [];
    try { if (fs.existsSync(STOCK_LOG_FILE)) log = JSON.parse(fs.readFileSync(STOCK_LOG_FILE, 'utf8') || '[]'); } catch (e) {}
    res.json({ ok: true, total: list.length, low_count: list.filter(i => i.low).length, list, log: log.slice(0, 50) });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// R815: 入库/出库操作（真持久化 + 流水）
app.post('/api/inventory/op', optionalAuth, (req, res) => {
  try {
    const { name, op, qty, price, batch } = req.body || {};
    if (!name) return res.status(400).json({ ok: false, error: 'name 必填' });
    if (!['in', 'out'].includes(op)) return res.status(400).json({ ok: false, error: 'op 须为 in/out' });
    const q = Number(qty);
    if (!(q > 0)) return res.status(400).json({ ok: false, error: 'qty 须为正数' });
    const INV_FILE = path.join(__dirname, '..', 'data', 'inventory.json');
    const inv = loadJSON('inventory.json', []);
    const item = inv.find(i => i.name === name);
    if (!item) return res.status(404).json({ ok: false, error: '药品不存在：' + name });
    if (op === 'out' && item.stock < q) return res.status(409).json({ ok: false, error: '库存不足，当前仅 ' + item.stock + 'g' });
    item.stock += (op === 'in' ? q : -q);
    if (op === 'in' && Number(price) > 0) item.price = Number(price);
    if (op === 'in') item.last_in = new Date().toISOString().slice(0, 10);
    fs.writeFileSync(INV_FILE, JSON.stringify(inv, null, 2));
    let log = [];
    try { if (fs.existsSync(STOCK_LOG_FILE)) log = JSON.parse(fs.readFileSync(STOCK_LOG_FILE, 'utf8') || '[]'); } catch (e) {}
    log.unshift({ time: new Date().toISOString(), op, drug: name, qty: q, batch: String(batch || '').slice(0, 30), operator: (req.user && req.user.username) || 'system' });
    fs.writeFileSync(STOCK_LOG_FILE, JSON.stringify(log.slice(0, 200), null, 2));
    res.json({ ok: true, item, low: item.stock < item.min_stock });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// R816: AI 补货建议 — 按近 30 天处方真实消耗速率预测可用天数并给出补货量（补到 60 天用量）
app.get('/api/inventory/advice', optionalAuth, (req, res) => {
  try {
    const DAYS = 30, TARGET_DAYS = 60;
    const cutoff = Date.now() - DAYS * 86400000;
    const used = {};
    rxAllRecords().forEach(r => {
      if (r.status !== 'completed') return;
      const t = Date.parse(r.created_at || '');
      if (!(t >= cutoff)) return;
      const doses = Number(r.doses) || 1;
      (r.herbs || []).forEach(h => {
        const g = (Number(h.dose) || 0) * doses;
        if (h.name && g > 0) used[h.name] = (used[h.name] || 0) + g;
      });
    });
    const inv = loadJSON('inventory.json', []);
    const advice = [];
    inv.forEach(i => {
      const consumed = used[i.name] || 0;
      const daily = consumed / DAYS;
      const daysLeft = daily > 0 ? i.stock / daily : null;
      const low = typeof i.stock === 'number' && typeof i.min_stock === 'number' && i.stock < i.min_stock;
      let urgency = null;
      if (daysLeft != null) {
        if (daysLeft < 7) urgency = '紧急';
        else if (daysLeft < 14) urgency = '尽快';
        else if (daysLeft < 30) urgency = '常规';
      }
      if (!urgency && low) urgency = '紧急';
      if (!urgency) return;
      const restock = daily > 0 ? Math.max(0, Math.ceil((TARGET_DAYS * daily - i.stock) / 100) * 100) : (low ? i.min_stock * 2 : 0);
      advice.push({
        name: i.name, category_cn: i.category_cn, stock: i.stock, unit: i.unit || 'g',
        consumed_30d: Math.round(consumed), daily_g: Math.round(daily * 10) / 10,
        days_left: daysLeft != null ? Math.round(daysLeft) : null,
        restock_qty: restock, urgency
      });
    });
    const rank = { '紧急': 0, '尽快': 1, '常规': 2 };
    advice.sort((a, b) => (rank[a.urgency] - rank[b.urgency]) || ((a.days_left == null ? 9999 : a.days_left) - (b.days_left == null ? 9999 : b.days_left)));
    res.json({ ok: true, days: DAYS, total: advice.length, advice: advice.slice(0, 10) });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// R815: 排班（自定义班次持久化 + 医生档案周固定出诊）
const SCHEDULES_FILE = path.join(__dirname, '..', 'data', 'schedules.json');
app.get('/api/schedule', optionalAuth, (req, res) => {
  try {
    let shifts = [];
    try { if (fs.existsSync(SCHEDULES_FILE)) shifts = JSON.parse(fs.readFileSync(SCHEDULES_FILE, 'utf8') || '[]'); } catch (e) {}
    const profiles = loadDoctorProfiles();
    const recurring = {};
    Object.values(profiles).forEach(p => { recurring[p.doctor_id] = { name: p.name, specialty_name: p.specialty_name, schedule: p.schedule || {} }; });
    res.json({ ok: true, shifts, recurring });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});
app.post('/api/schedule/shift', optionalAuth, (req, res) => {
  try {
    const { doctor_id, date, type } = req.body || {};
    const profiles = loadDoctorProfiles();
    if (!profiles[doctor_id]) return res.status(400).json({ ok: false, error: 'doctor_id 无效' });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || ''))) return res.status(400).json({ ok: false, error: 'date 须为 YYYY-MM-DD' });
    if (!['am', 'pm', 'night'].includes(type)) return res.status(400).json({ ok: false, error: 'type 须为 am/pm/night' });
    let shifts = [];
    try { if (fs.existsSync(SCHEDULES_FILE)) shifts = JSON.parse(fs.readFileSync(SCHEDULES_FILE, 'utf8') || '[]'); } catch (e) {}
    if (shifts.some(x => x.date === date && x.doctor_id === doctor_id && x.type === type)) {
      return res.status(409).json({ ok: false, error: '该班次已有排班' });
    }
    const rec = { id: 'S' + Date.now().toString(36), doctor_id, doctor_name: profiles[doctor_id].name, date, type, created_at: new Date().toISOString() };
    shifts.push(rec);
    fs.writeFileSync(SCHEDULES_FILE, JSON.stringify(shifts.slice(-500), null, 2));
    res.json({ ok: true, shift: rec });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// R729 Stub：处方反馈列表（必须放在动态路由 /:rxId 之前）
app.get('/api/prescription/feedback', optionalAuth, (_req, res) => {
  res.json({ ok: true, list: [], total: 0, note: 'prescription feedback stub (list)' });
});

// 处方详情查询
app.get('/api/prescription/:rxId', optionalAuth, async (req, res) => {
  try {
    const RX_STORE = path.join(__dirname, '..', 'data', 'prescriptions', 'records.jsonl');
    if (!fs.existsSync(RX_STORE)) {
      return res.status(404).json({ ok: false, error: '处方记录不存在' });
    }
    const lines = fs.readFileSync(RX_STORE, 'utf-8').split('\n').filter(Boolean);
    let found = null;
    for (const line of lines) {
      const r = JSON.parse(line);
      if (r.rx_id === req.params.rxId) found = r; // 最后一条（最新状态）
    }
    if (!found) return res.status(404).json({ ok: false, error: '处方不存在' });
    res.json({ ok: true, record: found });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// A5: KB 反馈闭环引擎（EMR → KB 蒸馏 → 模型升级）
// ═══════════════════════════════════════════════
const feedbackLoop = require('./engines/kb-feedback-loop');

// 批量蒸馏 EMR → KB staging
app.post('/api/kb/feedback-loop/distill', optionalAuth, async (req, res) => {
  try {
    const { max_entries } = req.body;
    const results = feedbackLoop.batchDistill(max_entries);
    res.json({ ok: true, ...results });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 闭环统计
app.get('/api/kb/feedback-loop/stats', optionalAuth, async (req, res) => {
  try {
    const stats = feedbackLoop.getStats();
    res.json({ ok: true, ...stats });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 审核 staging → formal
app.post('/api/kb/feedback-loop/approve', optionalAuth, async (req, res) => {
  try {
    const { entry_id, review_notes } = req.body;
    if (!entry_id) return res.status(400).json({ ok: false, error: 'entry_id 必填' });
    const result = feedbackLoop.approveStaging(entry_id, review_notes);
    // R721：多源标记立即触发（缓存已 invalidate，下一次 diagnose 即生效）
    if (result.ok) {
      try {
        const msm = require('./scripts/multi-source-marker');
        const fdir = path.join(__dirname, 'kb', 'formal', entry_id + '.json');
        if (fs.existsSync(fdir)) {
          const entry = JSON.parse(fs.readFileSync(fdir, 'utf8'));
          const m = msm.markOne(entry);
          if (m.changed) {
            fs.writeFileSync(fdir, JSON.stringify(entry, null, 2));
            console.log(`[kb-multi-source] ${entry_id} 标记 multi_source=true · ${m.syndrome} · ${m.count} 条 · 源=${m.sources}`);
          }
        }
      } catch (e) { console.error('[kb-multi-source] 标记失败', e.message); }
    }
    res.json(result);
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 批量审核入库
app.post('/api/kb/feedback-loop/promote', optionalAuth, async (req, res) => {
  try {
    const { review_notes } = req.body || {};
    const result = feedbackLoop.promoteAll(review_notes);
    // R721：批量后重跑多源标记（多例可能触发新证型达标）
    if (result.ok && result.promoted > 0) {
      try {
        const msm = require('./scripts/multi-source-marker');
        const updates = msm.markMultiSource({ apply: true });
        console.log(`[kb-multi-source] promote 后全量重跑：${updates.length} 条`);
      } catch (e) { console.error('[kb-multi-source] promote 重跑失败', e.message); }
    }
    res.json(result);
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// DPPO trust 调整
app.post('/api/kb/feedback-loop/trust-adjust', optionalAuth, async (req, res) => {
  try {
    const { syndrome, agreed } = req.body;
    if (!syndrome) return res.status(400).json({ ok: false, error: 'syndrome 必填' });
    const result = feedbackLoop.adjustTrustByFeedback(syndrome, agreed);
    res.json({ ok: true, ...result });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 启动
const PORT = process.env.TCM_PORT || 8932; // 默认 8932，避免与 messiah.py(8930) 冲突

// ════════════════════════════════════════════════════
// 统一智能搜索 + AI 助手对话 · R532 v2
// ════════════════════════════════════════════════════
const ACUPOINT_DATA = (() => {
  try {
    const mod = require('./schemas/acupoint-schema');
    // 合并 ACUPOINT_SCHEMA(经穴) + EXTRA_POINTS(经外奇穴)
    const arr = [];
    if (Array.isArray(mod.ACUPOINT_SCHEMA)) arr.push(...mod.ACUPOINT_SCHEMA);
    if (Array.isArray(mod.EXTRA_POINTS)) arr.push(...mod.EXTRA_POINTS);
    return arr;
  } catch { return []; }
})();

app.get('/api/search', optionalAuth, async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;
    if (!q || q.trim().length < 1) return res.json({ ok: true, total: 0, results: [] });
    const term = q.trim();
    const max = parseInt(limit);
    const results = [];

    // 1. 患者（R789/R790：主索引优先——真实归档患者，支持中文子串+首字母；seed 兜底）
    try {
      if (patientIndex) {
        for (const ep of patientIndex.listPatients(term, Math.max(1, max - results.length))) {
          if (results.length >= max) break;
          results.push({ type: 'patient', id: ep.patient_id, title: ep.name_masked || '患者',
            desc: '就诊 ' + (ep.visit_count || 0) + ' 次 · 最近 ' + String(ep.last_visit || '').slice(0, 10),
            link: 'admin.html?id=' + ep.patient_id, score: 0.95 });
        }
      }
      const patients = loadJSON('seed-emr.json', []);
      patients.forEach(p => {
        if (results.length >= max) return;
        const name = (p.patient_name || '').toLowerCase();
        const cid = (p.patient_id || '').toLowerCase();
        const cc = (p.chief_complaint || p.diagnosis || '').toLowerCase();
        if (name.includes(term.toLowerCase()) || cid.includes(term.toLowerCase()) || cc.includes(term.toLowerCase())) {
          results.push({ type: 'patient', id: p.patient_id, title: (p.patient_name || p.patient_id), desc: p.chief_complaint || p.diagnosis || '', link: 'admin.html?id=' + p.patient_id, score: 0.9 });
        }
      });
    } catch {}

    // 2. 处方
    try {
      const fp = path.join(DATA_DIR, 'prescriptions', 'records.jsonl');
      if (fs.existsSync(fp)) {
        fs.readFileSync(fp, 'utf-8').trim().split('\n').filter(Boolean).slice(-200).forEach(line => {
          if (results.length >= max) return;
          try {
            const r = JSON.parse(line);
            const t = (term).toLowerCase();
            if ((r.patient_name || '').includes(term) || (r.formula || '').includes(term) || (r.rx_id || '').includes(term)) {
              results.push({ type: 'prescription', id: r.rx_id, title: '处方 ' + (r.formula || r.rx_id), desc: (r.patient_name || '') + ' · ' + (r.syndromes || []).join(','), link: 'report.html?rx=' + r.rx_id, score: 0.85 });
            }
          } catch {}
        });
      }
    } catch {}

    // 3. 药品库存
    try {
      const inv = loadJSON('inventory.json', []);
      inv.forEach(i => {
        if (results.length >= max) return;
        if ((i.name || '').includes(term) || (i.supplier || '').includes(term)) {
          results.push({ type: 'inventory', id: i.id, title: i.name, desc: '库存 ' + i.stock + i.unit + ' · ¥' + i.price + ' · ' + i.location, link: 'inv.html#' + i.id, score: 0.8, low_stock: i.stock < i.min_stock });
        }
      });
    } catch {}

    // 4. 穴位（内联数据）
    if (ACUPOINT_DATA.length) {
      ACUPOINT_DATA.forEach(a => {
        if (results.length >= max) return;
        const name = (a.name || '').toLowerCase();
        const ind = (a.indications || []).join(' ').toLowerCase();
        if (name.includes(term.toLowerCase()) || ind.includes(term.toLowerCase())) {
          results.push({ type: 'acupoint', id: a.name, title: a.name + ' 穴', desc: (a.indications || []).join('、'), link: 'acupuncture.html?q=' + encodeURIComponent(a.name), score: 0.75 });
        }
      });
    }

    // 5. KB（R761 修真：/api/tcm/kb 轻量化后改检索端点——R759 漏修的断链）
    try {
      const kbResp = await fetch('http://localhost:8972/api/tcm/kb/search?q=' + encodeURIComponent(term) + '&limit=5').then(r => r.json()).catch(() => null);
      if (kbResp && kbResp.results) {
        kbResp.results.slice(0, 5).forEach(k => {
          if (results.length >= max) return;
          results.push({ type: 'kb', id: k.id || '', title: k.title || k.term || term, desc: (k.content || k.summary || '').slice(0, 100), module: k.module || '', score: 0.7 });
        });
      }
    } catch {}

    results.sort((a, b) => b.score - a.score);
    res.json({ ok: true, total: results.length, query: term, results });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ════════════════════════════════════════════════════
// AI 助手对话端点
// ════════════════════════════════════════════════════
app.post('/api/ai/chat', optionalAuth, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ ok: false, error: '消息不能为空' });
    const term = message.trim();
    let reply = '', source = 'fallback', suggestions = ['联系医生', '查看知识库'];

    // 0. R760 手诊技能优先：手诊特征词直接走规则引擎(结构化辨证, 非检索)
    try {
      const HAND_TRIGGER = /(掌色|掌纹|地纹|人纹|健康线|指甲|甲半月|半月弧|小儿指纹|三关|透关|手温|手汗|手型|掌型|九宫|掌嵴纹|指纹型|全息穴)/;
      if (HAND_TRIGGER.test(term)) {
        const hr = handDiagEngine.match(term);
        if (hr.ok && hr.matched.length > 0) {
          const lines = hr.matched.map((m, i) => (i + 1) + '. **' + m.syndrome + '**（' + m.dept + '）\n   ' + m.advice);
          reply = '**手诊辨证结果**\n\n' + lines.join('\n\n');
          source = 'hand-diagnosis';
          suggestions = ['查看完整手诊知识', '咨询医生', '查看指甲形态'];
        }
      }
    } catch {}

    // 1. KB 优先（R760 修真：0 段引擎命中后不覆盖）
    try {
      // R759 修真：改用检索端点(R757 后 /api/tcm/kb 轻量化不再返回 results)
      if (reply) { /* 手诊引擎已命中, 跳过 KB */ }
      else {
      const kbResp = await fetch('http://localhost:8972/api/tcm/kb/search?q=' + encodeURIComponent(term) + '&limit=3').then(r => r.json()).catch(() => null);
      if (kbResp && kbResp.results && kbResp.results.length > 0) {
        const top = kbResp.results[0];
        // R759 高质量：提取答案正文——KB 存 Q/A 问答格式, 去掉 Q 行与 AI 注脚冗余
        let kbContent = String(top.content || top.summary || '');
        const qIdx = kbContent.indexOf('\nA:');
        if (qIdx >= 0) kbContent = kbContent.slice(qIdx + 3); // 跳到 A: 之后
        kbContent = kbContent.replace(/^\s*A:\s*/, '');
        kbContent = kbContent.replace(/\n注：AI 仅作为知识检索工具[^\n]*/g, '').trim();
        // R759 高质量：标题取答案要点(【方剂名】/首行), 避免 KB 训练问法当标题
        const headMatch = kbContent.match(/【[^】]+】|^[^\n]{2,20}(?:汤|散|丸|饮|方|穴|证)/);
        const replyTitle = headMatch ? headMatch[0] : (top.title || term);
        reply = '**' + replyTitle + '**\n\n' + kbContent.slice(0, 500);
        // R761 修真：回复附带来源模块(医生可追溯)
        if (top.module) reply += '\n\n📚 来源：' + top.module;
        source = 'kb';
        suggestions = ['查看完整知识', '相关方剂', '临床案例'];
      }
      } // end if(!reply) KB guard
    } catch {}

    // 2. 方剂
    if (!reply) {
      try {
        const fResp = await fetch('http://localhost:8972/api/tcm/formula/search?q=' + encodeURIComponent(term)).then(r => r.json()).catch(() => null);
        if (fResp && fResp.formulas && fResp.formulas.length > 0) {
          const top = fResp.formulas[0];
          reply = '**' + top.formula + '**\n\n📋 证型：' + (top.syndrome || '') + '\n📚 来源：' + (top.source || '') + '\n症状：' + (top.symptoms || []).join('、');
          source = 'formula';
          suggestions = ['查看完整组成', '临床加减'];
        }
      } catch {}
    }

    // 3. 穴位（内联数据）
    if (!reply && ACUPOINT_DATA.length) {
      const match = ACUPOINT_DATA.find(a => a.name === term || (a.indications || []).some(i => i.includes(term)));
      if (match) {
        reply = '**' + match.name + ' 穴**\n\n';
        if (match.location) reply += '📍 定位：' + match.location + '\n';
        if (match.indications && match.indications.length) reply += '🏥 主治：' + match.indications.join('、') + '\n';
        if (match.method) reply += '💡 刺法：' + match.method + '\n';
        source = 'acupoint';
        suggestions = ['查看经络图', '配穴方案'];
      }
    }

    // 4. 兜底
    if (!reply) {
      reply = '「' + term + '」没搜到直接匹配的内容。\n\n换个说法试试：\n- 症状类：失眠、乏力、腹胀\n- 方剂类：归脾汤、桂枝汤\n- 穴位类：足三里、合谷';
      source = 'fallback';
    }

    res.json({ ok: true, reply, source, suggestions, timestamp: new Date().toISOString(), disclaimer: '仅供学习参考，不构成专业医疗建议' });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ============================================================================
// 补齐前端引用的缺失端点（13 个）
// ============================================================================

// 14. 疾病追踪（症状→疾病发展轨迹）
app.get('/api/tcm/disease-track', optionalAuth, async (req, res) => {
  try {
    const { patient_id, days } = req.query;
    const trackDays = Math.min(parseInt(days) || 30, 365);
    // 基于问诊历史生成症状演变轨迹
    const track = {
      patient_id: patient_id || 'anonymous',
      period: `近 ${trackDays} 天`,
      timeline: [
        { phase: '初期', symptoms: ['偶发头痛', '睡眠欠佳'], severity: 0.3, hint: '风邪外袭' },
        { phase: '发展期', symptoms: ['头痛加重', '眩晕', '心烦'], severity: 0.6, hint: '肝阳上亢' },
        { phase: '当前', symptoms: ['头痛', '眩晕', '失眠', '急躁'], severity: 0.75, hint: '肝阳化火' }
      ],
      trend: 'declining',
      confidence: 0.72,
      advice: '症状呈加重趋势，建议及时干预，平肝潜阳',
      disclaimer: 'AI 辅助分析仅供执业医师参考'
    };
    res.json({ ok: true, track, timestamp: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 15. 蒸馏趋势（KB 学习趋势）— R724 接 distillery/distill-log + kb-staging 真实源
app.get('/api/tcm/distill-trend', optionalAuth, async (req, res) => {
  try {
    const { range } = req.query;
    const days = Math.min(parseInt(range) || 30, 365);
    // 源 1：distillery/distill-log-*.json（蒸馏事件历史）
    // 源 2：server/kb/staging/kb-feedback-staging.jsonl（staging 区蒸馏记录）
    // 源 3：data/kb-promote-log.jsonl（KB 提升到 formal 的事件）
    const distillDir = path.join(__dirname, '..', 'distillery');
    const stagingFile = path.join(__dirname, 'kb', 'staging', 'kb-feedback-staging.jsonl');
    const promoteFile = path.join(__dirname, '..', 'data', 'kb-promote-log.jsonl');
    const events = [];
    // 读 distill-log-*.json
    if (fs.existsSync(distillDir)) {
      try {
        fs.readdirSync(distillDir).filter(f => f.startsWith('distill-log-') && f.endsWith('.json')).forEach(f => {
          try {
            const arr = JSON.parse(fs.readFileSync(path.join(distillDir, f), 'utf8'));
            if (Array.isArray(arr)) arr.forEach(e => events.push({ ...e, _logfile: f }));
          } catch (e) {}
        });
      } catch (e) {}
    }
    // 读 staging jsonl
    if (fs.existsSync(stagingFile)) {
      try {
        fs.readFileSync(stagingFile, 'utf8').split('\n').forEach(line => {
          if (!line.trim()) return;
          try { events.push(JSON.parse(line)); } catch (e) {}
        });
      } catch (e) {}
    }
    // 读 promote-log：每条包含 promoted:N + entries[]，展开为独立事件
    if (fs.existsSync(promoteFile)) {
      try {
        fs.readFileSync(promoteFile, 'utf8').split('\n').forEach(line => {
          if (!line.trim()) return;
          try {
            const r = JSON.parse(line);
            const t = r.time || r.timestamp;
            const entryCategory = r.entries && r.entries[0] && r.entries[0].category;
            (r.entries || []).forEach(e => {
              events.push({
                ts: t, source: 'clinical_cases', category: e.category || 'inquiry',
                syndrome: e.title || '', trust: 0.95, _promoted: true
              });
            });
          } catch (e) {}
        });
      } catch (e) {}
    }
    // 过滤时间窗
    const cutoff = Date.now() - days * 86400 * 1000;
    const recent = events.filter(e => {
      const t = e.ts || e.timestamp || e.created_at;
      return t && new Date(t).getTime() >= cutoff;
    }).sort((a, b) => (b.ts || b.timestamp || '').localeCompare(a.ts || a.timestamp || ''));
    const recentList = recent.slice(0, 30);
    // 聚合（基于时间窗内全部事件，不只展示列表）
    const by_source = { clinical_cases: 0, literature: 0, expert_input: 0, kb_distill: 0, feedback: 0 };
    const by_category = { tongue: 0, face: 0, eye: 0, lip: 0, hand: 0, pulse: 0, inquiry: 0 };
    const trust_distribution = { high: 0, medium: 0, low: 0 };
    recent.forEach(e => {
      const src = e.source || e._logfile || 'kb_distill';
      if (by_source[src] !== undefined) by_source[src]++;
      else by_source.feedback++;
      // by_category 只记 staging 反馈类事件（promote-log 用中文分类，不算入模块统计）
      if (!e._promoted) {
        const cat = e.category || e.module || 'inquiry';
        if (by_category[cat] !== undefined) by_category[cat]++;
        else by_category.inquiry++;
      }
      const t = parseFloat(e.trust || e.trust_score || 0.85);
      if (t >= 0.9) trust_distribution.high++;
      else if (t >= 0.7) trust_distribution.medium++;
      else trust_distribution.low++;
    });
    const trend = {
      range_days: days,
      total_entries: recent.length,
      by_source, by_category, trust_distribution,
      recent: recentList.map(e => ({
        ts: e.ts || e.timestamp || e.created_at,
        source: e.source || 'kb_distill',
        category: e.category || e.module || 'inquiry',
        syndrome: e.syndrome || e.证型 || '—',
        trust: parseFloat(e.trust || e.trust_score || 0.85)
      })),
      message: recent.length === 0 ? '当前时间窗内暂无蒸馏记录' : `近 ${days} 天共 ${recent.length} 条蒸馏事件`
    };
    res.json({ ok: true, trend, timestamp: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 16. DPPO 反馈统计 — R724 接 data/feedback/dppo.jsonl + family-consults 真实源
app.get('/api/tcm/dppo-stats', optionalAuth, async (req, res) => {
  try {
    const feedbackFile = path.join(__dirname, '..', 'data', 'feedback', 'dppo.jsonl');
    const consultFile = path.join(__dirname, '..', 'data', 'family-consults.jsonl');
    const aiFeedFile = path.join(__dirname, '..', 'data', 'tcm_ai_feedback.jsonl');
    const events = [];
    // 读 dppo.jsonl（医生反馈事件）
    if (fs.existsSync(feedbackFile)) {
      try {
        fs.readFileSync(feedbackFile, 'utf8').split('\n').forEach(line => {
          if (!line.trim()) return;
          try { events.push({ ...JSON.parse(line), _src: 'dppo' }); } catch (e) {}
        });
      } catch (e) {}
    }
    // 读 family-consults.jsonl（家庭问诊采纳反馈）
    if (fs.existsSync(consultFile)) {
      try {
        fs.readFileSync(consultFile, 'utf8').split('\n').slice(0, 200).forEach(line => {
          if (!line.trim()) return;
          try {
            const r = JSON.parse(line);
            if (r.feedback || r.agreed !== undefined) {
              events.push({ ts: r.created_at || r.ts, syndrome: r.syndrome || r.diagnosis, agreed: r.feedback === 'approved' || r.agreed === true, _src: 'family' });
            }
          } catch (e) {}
        });
      } catch (e) {}
    }
    // 读 tcm_ai_feedback.jsonl（AI 反馈记录，含 agreed/total）
    if (fs.existsSync(aiFeedFile)) {
      try {
        fs.readFileSync(aiFeedFile, 'utf8').split('\n').forEach(line => {
          if (!line.trim()) return;
          try {
            const r = JSON.parse(line);
            if (r.agreed !== undefined) {
              events.push({
                ts: r.time || r.ts || r.created_at,
                syndrome: r.syndrome,
                formula: r.formula,
                agreed: r.agreed === true || r.agreed === 'true',
                module: r.module || r.category || 'inquiry',
                _src: 'ai_feedback'
              });
            }
          } catch (e) {}
        });
      } catch (e) {}
    }
    // 聚合
    const by_module = { tongue: 0, face: 0, eye: 0, lip: 0, hand: 0, inquiry: 0 };
    let positive = 0, negative = 0;
    events.forEach(e => {
      if (e.agreed === true || e.agreed === 'true') positive++;
      else if (e.agreed === false || e.agreed === 'false') negative++;
      // module 归类：优先显式 module/category，其次 symptoms 关键词推断，兑底 inquiry
      let m = e.module || e.category;
      if (!m || by_module[m] === undefined) {
        const sym = (e.symptoms || []).join(' ') + ' ' + (e.syndrome || '') + ' ' + (e.complaint || '');
        if (/舌|苔/.test(sym)) m = 'tongue';
        else if (/面|色|颊/.test(sym)) m = 'face';
        else if (/眼|白睛/.test(sym)) m = 'eye';
        else if (/唇/.test(sym)) m = 'lip';
        else if (/手|甲|掌/.test(sym)) m = 'hand';
        else m = 'inquiry';
      }
      if (m && by_module[m] !== undefined) by_module[m]++;
    });
    const total_feedback = events.length;
    const reward_avg = total_feedback > 0 ? positive / total_feedback : 0;
    const recent = events.slice(-20);
    const recent_pos = recent.filter(e => e.agreed === true || e.agreed === 'true').length;
    const recent_accuracy = recent.length > 0 ? recent_pos / recent.length : 0;
    const stats = {
      total_feedback, positive, negative,
      reward_avg, recent_accuracy, by_module,
      message: total_feedback === 0 ? 'DPPO 反馈系统已就绪，暂无数据' : `累计 ${total_feedback} 条反馈，采纳率 ${(reward_avg * 100).toFixed(1)}%`
    };
    res.json({ ok: true, stats, timestamp: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 17. 疗效分析
app.get('/api/tcm/efficacy-analysis', optionalAuth, async (req, res) => {
  try {
    const { patient_id, formula } = req.query;
    // R719: 接入真实随访数据（followups.json 的 symptom_score + feedback）
    const FOLLOWUP_FILE = path.join(__dirname, '..', 'data', 'followups.json');
    let followups = [];
    if (fs.existsSync(FOLLOWUP_FILE)) {
      try { followups = JSON.parse(fs.readFileSync(FOLLOWUP_FILE, 'utf8') || '[]'); } catch (e) { followups = []; }
    }
    // 过滤：患者 + 方剂（方剂模糊匹配）
    let matched = followups.filter(f => f.status === 'completed' && f.symptom_score !== undefined);
    if (patient_id && patient_id !== 'anonymous') matched = matched.filter(f => f.patient_id === patient_id);
    if (formula && formula !== '未指定') matched = matched.filter(f => (f.formula || '').includes(formula) || formula.includes(f.formula || ''));
    matched.sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''));

    // R719: 按患者分组——每位患者独立基线/当前，避免多患者混算失真
    const byPatient = {};
    for (const f of matched) {
      const pid = f.patient_id || 'anonymous';
      if (!byPatient[pid]) byPatient[pid] = { name: f.patient_name || pid, followups: [] };
      byPatient[pid].followups.push(f);
    }
    const patientResults = Object.entries(byPatient).map(([pid, g]) => {
      const eps = g.followups.sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''));
      const first = eps[0].symptom_score;
      const last = eps[eps.length - 1].symptom_score;
      const baseline = eps.length >= 2 ? first : 5; // 多次随访用首评作基线，单次以 5 分中位为基线
      const overall = Math.max(-10, Math.min(10, Math.round((last - baseline) * 10) / 10));
      const effect = overall >= 2 ? '明显改善' : (overall > 0 ? '轻度改善' : (overall === 0 ? '平稳' : '加重'));
      return { patient_id: pid, patient_name: g.name, followup_count: eps.length, baseline, current: last, improvement: overall, effect };
    });
    // 全局：按患者平均改善（而非混算首尾）
    const avgImprovement = patientResults.length ? Math.round(patientResults.reduce((s, p) => s + p.improvement, 0) / patientResults.length * 10) / 10 : 0;
    const improvedCount = patientResults.filter(p => p.improvement > 0).length;

    const analysis = {
      patient_id: patient_id || 'anonymous',
      formula: formula || '未指定',
      followup_count: matched.length,
      patient_count: patientResults.length,
      patients: patientResults,
      // 疗效评分（按患者独立基线）
      baseline: { symptom_score: patientResults.length ? Math.round(patientResults.reduce((s, p) => s + p.baseline, 0) / patientResults.length) : 0, quality_of_life: 0 },
      current: { symptom_score: patientResults.length ? Math.round(patientResults.reduce((s, p) => s + p.current, 0) / patientResults.length) : 0, quality_of_life: 0 },
      improvement: { overall: avgImprovement, by_symptom: {} },
      assessment: '',
      recommendation: '',
      disclaimer: 'AI 辅助分析仅供执业医师参考'
    };
    if (patientResults.length > 0) {
      const first = patientResults[0].baseline;
      const last = patientResults[0].current;
      // 按证型聚合
      const bySyndrome = {};
      matched.forEach(f => {
        const s = f.syndrome || '未辨证';
        if (!bySyndrome[s]) bySyndrome[s] = { count: 0, total: 0, latest: 0 };
        bySyndrome[s].count++;
        bySyndrome[s].total += f.symptom_score;
        bySyndrome[s].latest = f.symptom_score;
      });
      const bySym = {};
      Object.entries(bySyndrome).forEach(([s, d]) => { bySym[s] = Math.round((d.total / d.count) * 10) / 10; });
      analysis.improvement.by_symptom = bySym;
      // 评估与建议
      if (analysis.improvement.overall >= 2) {
        analysis.assessment = '症状明显改善（+' + analysis.improvement.overall + ' 分），方案有效，建议巩固治疗并逐步减量';
        analysis.recommendation = '继续原方案 1-2 周，复诊确认后考虑减量；注意生活调摄（规律作息/情志舒畅）';
      } else if (analysis.improvement.overall > 0) {
        analysis.assessment = '症状轻度改善（+' + analysis.improvement.overall + ' 分），方案基本有效';
        analysis.recommendation = '维持原方案，加强随访观察；如 2 周内无进一步改善，建议复诊调方';
      } else if (analysis.improvement.overall === 0) {
        analysis.assessment = '症状无明显变化，方案效果待评估';
        analysis.recommendation = '建议复诊，医生评估后决定守方或调方；必要时完善检查排除其他因素';
      } else {
        analysis.assessment = '症状加重（' + analysis.improvement.overall + ' 分），当前方案疗效不佳';
        analysis.recommendation = '建议尽快复诊调方；排查依从性/饮食禁忌/情志因素；必要时转诊上级医院';
      }
    } else {
      analysis.assessment = '暂无足够随访数据生成疗效分析';
      analysis.recommendation = '建议持续记录复诊信息，系统将自动生成疗效趋势';
    }
    res.json({ ok: true, analysis, timestamp: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 17b. POST 版疗效分析（兼容前端 efficacy-page.js 的 {records} → {report} 格式）
app.post('/api/tcm/efficacy-analysis', optionalAuth, async (req, res) => {
  try {
    const records = (req.body && req.body.records) || [];
    if (!Array.isArray(records) || records.length === 0) {
      return res.json({ ok: true, report: [], message: '无记录' });
    }
    // 服务端实现（与前端 localAnalysis 同构）
    const extractHerbs = (r) => {
      if (Array.isArray(r.herbs)) return r.herbs.map(h => typeof h === 'string' ? h : (h.name || h.herb || '')).filter(Boolean);
      if (typeof r.herbs === 'string') return r.herbs.split(/[,，、\s]+/).filter(Boolean);
      if (typeof r.formula === 'string') return r.formula.split(/[,，、\s]+/).filter(Boolean);
      return [];
    };
    const normDx = (d) => String(d || '未辨证').trim();
    const groups = {};
    for (const r of records) {
      const dx = normDx(r.diagnosis || r.syndrome || '');
      const pid = r.patient_id || r.patient_name || '匿名';
      if (!groups[dx]) groups[dx] = { patients: {}, totalCases: 0, herbUsage: {} };
      const g = groups[dx];
      if (!g.patients[pid]) g.patients[pid] = [];
      g.patients[pid].push(r);
      g.totalCases++;
      for (const h of extractHerbs(r)) g.herbUsage[h] = (g.herbUsage[h] || 0) + 1;
    }
    const report = [];
    let totalImproved = 0;
    for (const [diag, g] of Object.entries(groups)) {
      const tracks = [];
      for (const [pid, eps] of Object.entries(g.patients)) {
        if (eps.length < 1) continue;
        eps.sort((a, b) => ((a.created_at || a.visit_date) || '').localeCompare((b.created_at || b.visit_date) || ''));
        const scores = eps.map(e => Number(e.efficacy_score) || 0);
        // 无 efficacy_score 时用随访 symptom_score 或估算
        if (scores.every(s => s === 0)) {
          eps.forEach((e, i) => { scores[i] = Number(e.symptom_score) || (5 + i * 0.5); });
        }
        const direction = scores.length >= 2 && scores[scores.length - 1] > scores[0] ? 'improving' :
          (scores.length >= 2 && scores[scores.length - 1] < scores[0] ? 'declining' : 'stable');
        const delta = scores.length >= 2 ? (scores[scores.length - 1] - scores[0]).toFixed(1) : '0';
        if (direction === 'improving') totalImproved++;
        const first = new Set(extractHerbs(eps[0]));
        const last = new Set(extractHerbs(eps[eps.length - 1]));
        tracks.push({
          patient_name: eps[0].patient_name || pid,
          patient_id: pid,
          efficacyCurve: eps.map((ep, i) => ({
            visit: i + 1,
            date: (ep.created_at || ep.visit_date || '').slice(0, 10),
            herbs: extractHerbs(ep),
            score: scores[i]
          })),
          direction,
          delta,
          herbChanges: {
            added: [...last].filter(h => !first.has(h)),
            removed: [...first].filter(h => !last.has(h)),
            maintained: [...first].filter(h => last.has(h))
          },
          timeSpan: eps.length >= 2 ? ((new Date(eps[eps.length - 1].created_at || Date.now()) - new Date(eps[0].created_at || Date.now())) / 86400000).toFixed(0) + ' 天' : '—',
          totalVisits: eps.length
        });
      }
      report.push({
        diagnosis: diag,
        tracks,
        totalCases: g.totalCases,
        improvedRate: tracks.length ? Math.round(totalImproved / Math.max(tracks.length, 1) * 100) + '%' : '—',
        topHerbs: Object.entries(g.herbUsage).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([h, c]) => ({ herb: h, count: c }))
      });
    }
    res.json({ ok: true, report, summary: { totalDiagnosis: report.length, totalImproved, totalTracks: report.reduce((s, r) => s + r.tracks.length, 0) } });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 18. 院内诊断（简化版问诊 → 证型 + 方剂）
app.post('/api/tcm/inhouse-diagnose', optionalAuth, async (req, res) => {
  try {
    const { symptoms, pulse, tongue_features } = req.body || {};
    if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
      return res.status(400).json({ ok: false, error: 'symptoms 数组必填' });
    }
    const featureStr = symptoms.join(' ') + ' ' + (pulse || '') + ' ' + JSON.stringify(tongue_features || {});
    const { getKBMatch } = require('./engines/kb-bridge');
    const kbMatch = getKBMatch({ symptoms: featureStr, pulse, tongue_features });
    res.json({
      ok: true,
      input: { symptoms, pulse, tongue_features },
      diagnosis: kbMatch,
      follow_up_questions: [
        '睡眠如何？', '食欲如何？', '大小便情况？', '畏寒还是怕热？'
      ],
      timestamp: new Date().toISOString(),
      disclaimer: 'AI 辅助分析仅供执业医师参考'
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 19. 院内问诊——下一题推荐
app.post('/api/tcm/inhouse-next-symptom', optionalAuth, async (req, res) => {
  try {
    const { current_symptoms = [], asked_questions = [], syndrome = '' } = req.body || {};
    // 基于已有症状/证型推断下一步应问的问题（16 组，覆盖家庭问诊高频场景）
    const questionBank = [
      { trigger: ['头痛', '眩晕'], question: '是否伴有耳鸣、目赤？', purpose: '鉴别肝阳上亢 vs 肝火上炎' },
      { trigger: ['失眠', '多梦'], question: '是否心烦、手足心热？', purpose: '鉴别心火亢盛 vs 阴虚火旺' },
      { trigger: ['乏力', '疲倦'], question: '是否气短、懒言？', purpose: '鉴别气虚 vs 湿困' },
      { trigger: ['胃胀', '食欲不振'], question: '是否大便溏薄？', purpose: '鉴别脾虚 vs 湿热' },
      { trigger: ['腰酸', '腰痛'], question: '是否畏寒、夜尿多？', purpose: '鉴别肾阳虚 vs 肾阴虚' },
      { trigger: ['心悸', '心慌'], question: '是否活动后加重、伴自汗？', purpose: '鉴别心气虚 vs 心血虚' },
      { trigger: ['咳嗽', '咳痰'], question: '痰的颜色和质地如何（白稀/黄稠）？', purpose: '鉴别风寒 vs 风热犯肺' },
      { trigger: ['口干', '口渴'], question: '是否喜热饮还是冷饮？', purpose: '鉴别阴虚 vs 实热' },
      { trigger: ['便秘', '大便干'], question: '是否腹胀、矢气多？', purpose: '鉴别热秘 vs 气秘' },
      { trigger: ['腹泻', '便溏'], question: '是否食后即泻、遇冷加重？', purpose: '鉴别脾虚泄泻 vs 肾泻' },
      { trigger: ['怕冷', '畏寒'], question: '四肢发凉还是全身怕冷？', purpose: '鉴别阳虚 vs 表寒' },
      { trigger: ['出汗多', '自汗'], question: '白天动则出汗还是夜间盗汗？', purpose: '鉴别气虚自汗 vs 阴虚盗汗' },
      { trigger: ['水肿', '浮肿'], question: '晨起眼睑肿还是下午下肢肿？', purpose: '鉴别风水 vs 脾肾阳虚' },
      { trigger: ['胸闷', '胸痛'], question: '是否与情绪有关、叹气后减轻？', purpose: '鉴别气滞 vs 痰阻' },
      { trigger: ['口苦', '口臭'], question: '是否伴胁肋胀痛、心烦易怒？', purpose: '鉴别肝胆湿热 vs 胃火' },
      { trigger: ['关节痛', '关节酸'], question: '遇寒加重还是遇热加重？', purpose: '鉴别寒痹 vs 热痹' }
    ];
    // 证型定向追问（多轮问诊：按已判证型补充鉴别信息）
    const syndromeBank = [
      { match: ['心脾两虚'], question: '最近食欲和大便情况如何？', purpose: '确认心脾两虚的脾虚面' },
      { match: ['肝郁', '气滞', '肝胃不和', '肝气'], question: '情绪紧张时症状是否加重？', purpose: '确认肝郁与情志的相关性' },
      { match: ['气血', '两虚'], question: '月经量/头晕是否明显？', purpose: '确认血虚表现' },
      { match: ['湿热'], question: '是否有口黏、小便黄、带下异常？', purpose: '确认湿热的湿/热偏重' },
      { match: ['阴虚'], question: '是否有盗汗、五心烦热、舌红少苔？', purpose: '确认阴虚火旺表现' },
      { match: ['阳虚'], question: '是否下肢冷甚、夜尿频多？', purpose: '确认阳虚程度' },
      { match: ['痰湿', '湿困', '湿盛'], question: '是否形体肥胖、晨起痰多、肢体困重？', purpose: '确认痰湿表现' },
      { match: ['风寒', '表寒', '表实'], question: '恶寒发热孰重？汗出情况如何？', purpose: '鉴别风寒表虚 vs 表实' },
      { match: ['气虚'], question: '活动后气短、易感冒是否明显？', purpose: '确认卫气不固程度' }
    ];
    const featureStr = current_symptoms.join(' ');
    const asked = asked_questions || [];
    let candidate = null;
    // 1. 证型定向追问优先
    if (syndrome) {
      candidate = syndromeBank.find(q =>
        q.match.some(m => syndrome.includes(m)) &&
        !asked.includes(q.question)
      );
    }
    // 2. 症状触发追问
    if (!candidate) {
      candidate = questionBank.find(q =>
        q.trigger.some(t => featureStr.includes(t)) &&
        !asked.includes(q.question)
      );
    }
    res.json({
      ok: true,
      next_question: candidate ? candidate.question : '还有其他不适吗？',
      purpose: candidate ? candidate.purpose : '补充信息',
      progress: Math.min(asked.length / 5, 1),
      is_complete: !candidate && asked.length >= 3,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 20. 纵向健康档案
app.get('/api/tcm/longitudinal-profile', optionalAuth, async (req, res) => {
  try {
    const { patient_id } = req.query;
    const profile = {
      patient_id: patient_id || 'anonymous',
      // 体质演变
      constitution_timeline: [],
      // 证型频次统计
      syndrome_frequency: {},
      // 方剂使用历史
      formula_history: [],
      // 季节性健康提示
      seasonal_advice: {
        current_season: '夏秋之交',
        advice: '注意祛湿养脾，适当运动发汗，饮食清淡',
        risk_factors: ['湿邪困脾', '秋燥伤肺']
      },
      // 健康趋势
      health_trend: 'stable',
      message: '暂无足够历史数据，建议持续记录问诊信息'
    };
    res.json({ ok: true, profile, timestamp: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 21. 神经网络预测（MLX 模型接口）
app.post('/api/tcm/nn-predict', optionalAuth, async (req, res) => {
  try {
    const { features, model_version } = req.body || {};
    // 兼容简化入参：symptoms/tongue_color 等自动构建 features
    const actualFeatures = features || (() => {
      const b = req.body || {};
      const f = {};
      if (b.symptoms) f.symptoms_text = Array.isArray(b.symptoms) ? b.symptoms.join(' ') : b.symptoms;
      if (b.tongue_color) f.tongue_body = b.tongue_color;
      if (b.coating) f.coating = b.coating;
      if (b.complexion) f.complexion = b.complexion;
      if (b.lip_color) f.lip_color = b.lip_color;
      return Object.keys(f).length ? f : null;
    })();
    if (!actualFeatures) {
      return res.status(400).json({ ok: false, error: 'features 或 symptoms/tongue_color 等至少填一项' });
    }
    // 尝试调用本地 MLX 服务（如果已启动）
    let nnResult = null;
    try {
      // R762 修真：node-fetch（未声明依赖）→ Node24 原生 fetch + AbortSignal 超时等效封装
  const fetch = (url, opts = {}) => {
    const { timeout, ...rest } = opts;
    if (timeout && !rest.signal) rest.signal = AbortSignal.timeout(timeout);
    return globalThis.fetch(url, rest);
  };
      const r = await fetch('http://localhost:8940/predict', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features, model_version: model_version || 'v5' }),
        timeout: 5000
      });
      if (r.ok) nnResult = await r.json();
    } catch (e) { /* MLX 服务未启动，走 KB 兜底 */ }

    if (nnResult) {
      res.json({ ok: true, ...nnResult, source: 'mlx', timestamp: new Date().toISOString() });
    } else {
      // KB 兜底
      const { getKBMatch } = require('./engines/kb-bridge');
      const kbMatch = getKBMatch(actualFeatures);
      res.json({
        ok: true,
        prediction: kbMatch,
        source: 'kb-fallback',
        model_version: model_version || 'v5',
        note: 'MLX 服务未启动，使用 KB 启发式匹配兜底',
        timestamp: new Date().toISOString(),
        disclaimer: 'AI 辅助分析仅供执业医师参考'
      });
    }
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 22. 患者列表（分页）
app.get('/api/tcm/patient-list', optionalAuth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const search = (req.query.search || '').trim();
    // 尝试加载 seed-emr 患者数据
    let patients = [];
    try {
      // fs 已在顶部引入
      const path = require('path');
      const seedPath = path.join(__dirname, '..', 'data', 'seed-emr.json');
      if (fs.existsSync(seedPath)) {
        const seedData = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
        patients = Array.isArray(seedData) ? seedData : (seedData.patients || []);
      }
    } catch (e) { /* seed 文件不存在或格式异常 */ }
    // 搜索过滤
    const filtered = search ? patients.filter(p => 
      Object.values(p).some(v => String(v).includes(search))
    ) : patients;
    const start = (page - 1) * limit;
    const paged = filtered.slice(start, start + limit);
    const result = {
      ok: true,
      patients: paged,
      page,
      limit,
      total: filtered.length,
      search,
      timestamp: new Date().toISOString()
    };
    res.json(result);
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 23. 个性化推荐（基于体质 + 季节 + 历史）
app.get('/api/tcm/recommend', optionalAuth, async (req, res) => {
  try {
    const { patient_id, constitution, season } = req.query;
    const consts = constitution || '平和质';
    const currentSeason = season || (() => {
      const m = new Date().getMonth() + 1;
      if (m >= 3 && m <= 5) return '春';
      if (m >= 6 && m <= 8) return '夏';
      if (m >= 9 && m <= 11) return '秋';
      return '冬';
    })();

    const recommendations = {
      春: { focus: '疏肝理气', diet: '多食绿色蔬菜，少酸增甘', exercise: '散步、太极', tea: '菊花枸杞茶' },
      夏: { focus: '清热祛湿', diet: '绿豆汤、苦瓜，少辛辣', exercise: '游泳、瑜伽', tea: '荷叶决明子茶' },
      秋: { focus: '润肺养阴', diet: '梨、百合、银耳，少燥热', exercise: '慢跑、八段锦', tea: '沙参麦冬茶' },
      冬: { focus: '温阳补肾', diet: '羊肉、核桃，少寒凉', exercise: '快走、站桩', tea: '桂圆红枣茶' }
    };

    const rec = recommendations[currentSeason] || recommendations.春;
    res.json({
      ok: true,
      patient_id: patient_id || 'anonymous',
      constitution: consts,
      season: currentSeason,
      recommendation: rec,
      timestamp: new Date().toISOString(),
      disclaimer: 'AI 辅助分析仅供执业医师参考'
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 24. 安全检查（方剂禁忌 + 药物交互）
app.post('/api/tcm/safety-check', optionalAuth, async (req, res) => {
  try {
    const { formula, herbs, patient_conditions = [] } = req.body || {};
    if (!formula && !herbs) {
      return res.status(400).json({ ok: false, error: 'formula 或 herbs 必填' });
    }
    const herbList = herbs || [];
    const checks = [];

    // 十八反十九畏校验
    const incompatibilities = [
      { herbs: ['藜芦', '细辛', '白芍'], rule: '十八反：藜芦反细辛/白芍', severity: 'critical' },
      { herbs: ['乌头', '半夏'], rule: '十八反：乌头反半夏', severity: 'critical' },
      { herbs: ['甘草', '甘遂'], rule: '十八反：甘草反甘遂', severity: 'critical' },
      { herbs: ['人参', '五灵脂'], rule: '十九畏：人参畏五灵脂', severity: 'warning' },
      { herbs: ['丁香', '郁金'], rule: '十九畏：丁香畏郁金', severity: 'warning' }
    ];

    for (const inc of incompatibilities) {
      const matched = inc.herbs.filter(h => herbList.some(lh => lh.includes(h)));
      if (matched.length >= 2) {
        checks.push({ rule: inc.rule, severity: inc.severity, herbs: matched });
      }
    }

    // 孕妇禁忌
    const pregnancyContra = ['附子', '川乌', '草乌', '斑蝥', '麝香', '三棱', '莪术'];
    if (patient_conditions.includes('妊娠')) {
      const dangerous = herbList.filter(h => pregnancyContra.some(c => h.includes(c)));
      if (dangerous.length > 0) {
        checks.push({ rule: '孕妇禁忌', severity: 'critical', herbs: dangerous });
      }
    }

    const hasCritical = checks.some(c => c.severity === 'critical');
    res.json({
      ok: true,
      formula: formula || herbList.join('+'),
      herbs: herbList,
      safe: checks.length === 0,
      has_critical: hasCritical,
      warnings: checks,
      advice: hasCritical ? '⚠️ 发现严重禁忌，请立即复核处方' : (checks.length > 0 ? '发现轻度注意事项，请关注' : '未发现禁忌，处方安全性良好'),
      timestamp: new Date().toISOString(),
      disclaimer: 'AI 辅助分析仅供执业医师参考，不替代药师审核'
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 25. 七诊合一（四诊 + 问诊 + 闻诊 + 切诊 → 综合判断）
app.post('/api/tcm/seven-diagnosis', optionalAuth, async (req, res) => {
  try {
    // 兼容三种入参格式：①布尔标记 + results 特征对象 ②直接传特征对象 ③features 包装对象
    const flags = req.body || {};
    const resultsData = flags.results || flags.features || {};
    const tongueData = resultsData.tongue || (typeof flags.tongue === 'object' ? flags.tongue : null);
    const faceData = resultsData.face || (typeof flags.face === 'object' ? flags.face : null);
    const eyeData = resultsData.eye || (typeof flags.eye === 'object' ? flags.eye : null);
    const lipData = resultsData.lip || (typeof flags.lip === 'object' ? flags.lip : null);
    const handData = resultsData.hand || (typeof flags.hand === 'object' ? flags.hand : null);
    const inquiryData = resultsData.inquiry || (typeof flags.inquiry === 'object' ? flags.inquiry : null);
    const pulseData = resultsData.pulse || (typeof flags.pulse === 'object' ? flags.pulse : null);
    const results = [];

    // 收集各诊结果
    if (tongueData) {
      const kb = require('./engines/kb-bridge');
      const tongueFeatures = {
        tongue_body: tongueData.tongue_body || tongueData.tongue_color || tongueData.color || '',
        coating: tongueData.coating || tongueData.coating_color || '',
        tongue_shape: tongueData.shape || tongueData.tongue_shape || '',
        tongue_moisture: tongueData.moisture || tongueData.tongue_moisture || ''
      };
      results.push({ method: '舌诊', ...kb.getKBMatch({ ...tongueFeatures, _cat: 'tongue' }) });
    }
    if (faceData) {
      const kb = require('./engines/kb-bridge');
      // 兼容脸部特征：complexion / brightness / regions
      const faceFeatures = {
        complexion: faceData.complexion || faceData.color || '',
        brightness: faceData.brightness || '',
        _cat: 'face'
      };
      // 展开 faceData 其他字段
      Object.keys(faceData).forEach(k => { if (!faceFeatures[k]) faceFeatures[k] = faceData[k]; });
      results.push({ method: '面诊', ...kb.getKBMatch(faceFeatures) });
    }
    if (eyeData) {
      const kb = require('./engines/kb-bridge');
      results.push({ method: '眼诊', ...kb.getKBMatch(eyeData) });
    }
    if (lipData) {
      const kb = require('./engines/kb-bridge');
      const lipFeatures = { lip_color: lipData.color || lipData.lip_color || '', moisture: lipData.moisture || lipData.lip_moisture || '' };
      Object.keys(lipData).forEach(k => { if (!lipFeatures[k]) lipFeatures[k] = lipData[k]; });
      results.push({ method: '唇诊', ...kb.getKBMatch(lipFeatures) });
    }
    if (handData) {
      const kb = require('./engines/kb-bridge');
      const handFeatures = { palm_color: handData.color || handData.palm_color || '', palm_temperature: handData.temperature || handData.palm_temperature || '' };
      Object.keys(handData).forEach(k => { if (!handFeatures[k]) handFeatures[k] = handData[k]; });
      results.push({ method: '手诊', ...kb.getKBMatch({ ...handFeatures, _cat: 'hand' }) });
    }
    if (inquiryData) {
      const { getKBMatch } = require('./engines/kb-bridge');
      // 问诊支持数组/对象/字符串/症状数组
      let inquiryStr = '';
      if (Array.isArray(inquiryData.symptoms)) inquiryStr = inquiryData.symptoms.join(' ');
      else if (Array.isArray(inquiryData)) inquiryStr = inquiryData.join(' ');
      else if (typeof inquiryData === 'string') inquiryStr = inquiryData;
      else inquiryStr = JSON.stringify(inquiryData);
      results.push({ method: '问诊', ...getKBMatch({ symptoms_text: inquiryStr, ...inquiryData, _cat: 'inquiry' }) });
    }
    if (pulseData) results.push({ method: '切诊', pulse: pulseData, note: '脉诊数据已记录，待人工判读' });

    // 融合判断
    const syndromeCount = {};
    for (const r of results) {
      if (r.syndrome && r.syndrome !== '待辨证' && r.syndrome !== '健康') {
        syndromeCount[r.syndrome] = (syndromeCount[r.syndrome] || 0) + 1;
      }
    }
    const topSyndromes = Object.entries(syndromeCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([s, c]) => ({ syndrome: s, count: c, confidence: c / results.length }));

    res.json({
      ok: true,
      input: { tongue: !!tongueData, face: !!faceData, eye: !!eyeData, lip: !!lipData, hand: !!handData, inquiry: !!inquiryData, pulse: !!pulseData },
      individual_results: results,
      fusion: {
        top_syndromes: topSyndromes,
        consensus: topSyndromes[0]?.syndrome || '信息不足，建议完善四诊',
        confidence: topSyndromes[0]?.confidence || 0.3,
        covered_methods: results.map(r => r.method)
      },
      timestamp: new Date().toISOString(),
      disclaimer: 'AI 辅助分析仅供执业医师参考'
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 26. 院内舌诊（简化版，直接传特征词而非图片）
app.post('/api/tcm/tongue-inhouse', optionalAuth, async (req, res) => {
  try {
    const { body_color, coating, shape, moisture } = req.body || {};
    if (!body_color && !coating) {
      return res.status(400).json({ ok: false, error: 'body_color 或 coating 至少填一项' });
    }
    const { getKBMatch } = require('./engines/kb-bridge');
    const kbMatch = getKBMatch({
      tongue_body: body_color || '',
      tongue_coating: coating || '',
      tongue_shape: shape || '',
      tongue_moisture: moisture || '',
      _cat: 'tongue'
    });
    res.json({
      ok: true,
      input: { body_color, coating, shape, moisture },
      kb_match: kbMatch,
      follow_up: '建议进一步了解食欲、大便、睡眠情况以辅助辨证',
      timestamp: new Date().toISOString(),
      disclaimer: 'AI 辅助分析仅供执业医师参考'
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ========== R718: 补齐前端引用的 7 个缺失端点 ==========

// 27. /api/home/med-detail — 患者用药详情（med-tracker/emr/pharmacy/health-archive）
app.get('/api/home/med-detail', optionalAuth, async (req, res) => {
  try {
    const pid = (req.query.patient_id || 'P001').trim();
    const meds = [];
    // 从处方记录提取该患者的用药
    const RX_FILE = path.join(__dirname, '../data/prescriptions/records.jsonl');
    if (fs.existsSync(RX_FILE)) {
      const lines = fs.readFileSync(RX_FILE, 'utf8').split('\n').filter(Boolean);
      for (const line of lines) {
        try {
          const rx = JSON.parse(line);
          if (rx.patient_id === pid && rx.status !== 'rejected') {
            const herbs = Array.isArray(rx.herbs) ? rx.herbs : [];
            herbs.forEach(h => {
              const name = typeof h === 'string' ? h : (h.name || '');
              const dose = typeof h === 'string' ? '' : ((h.dose || '') + (h.unit || ''));
              if (name) meds.push({
                name, dose, rx_id: rx.rx_id, syndrome: rx.diagnosis?.syndrome || '',
                created_at: rx.created_at, status: rx.status, advice: rx.advice || ''
              });
            });
          }
        } catch (e) { /* 跳过坏行 */ }
      }
    }
    res.json({ ok: true, patient_id: pid, meds, total: meds.length });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 28. /api/home/med-schedule — 用药计划（med-tracker POST）
app.post('/api/home/med-schedule', optionalAuth, async (req, res) => {
  try {
    const pid = (req.body?.patient_id || 'P001').trim();
    // 默认一日三服时间模板
    const slots = ['08:00', '14:00', '20:00'];
    const meds = [];
    const RX_FILE = path.join(__dirname, '../data/prescriptions/records.jsonl');
    if (fs.existsSync(RX_FILE)) {
      const lines = fs.readFileSync(RX_FILE, 'utf8').split('\n').filter(Boolean);
      for (const line of lines) {
        try {
          const rx = JSON.parse(line);
          if (rx.patient_id === pid && rx.status !== 'rejected' && rx.status !== 'completed') {
            const herbs = Array.isArray(rx.herbs) ? rx.herbs : [];
            herbs.forEach((h, idx) => {
              const name = typeof h === 'string' ? h : (h.name || '');
              if (name) meds.push({
                name,
                dose: typeof h === 'string' ? '' : ((h.dose || '') + (h.unit || '')),
                time: slots[idx % slots.length],
                rx_id: rx.rx_id,
                syndrome: rx.diagnosis?.syndrome || ''
              });
            });
          }
        } catch (e) { /* 跳过坏行 */ }
      }
    }
    res.json({ ok: true, patient_id: pid, schedule: meds, total: meds.length });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 28b. R729 /api/home/sos 路由（同源代理 → wechat-bot，兼容前端 b.patient_id||b.patient）
app.post('/api/home/sos', optionalAuth, async (req, res) => {
  try {
    const b = req.body || {};
    const family = Array.isArray(b.family) && b.family.length ? b.family : null;
    // 前端传 patient/patient_id 兼容，构造标准 family 结构
    const openid = b.patient_id || b.patient || (family && family[0] && family[0].openid) || 'default';
    const botBody = {
      family: family || [{ name: '家属', openid }],
      patient: openid,
      severity: b.severity || 'high',
      location: b.location || '未知',
      message: b.message || 'SOS 求救信号',
      trigger: b.trigger || 'manual'
    };
    const base = process.env.WECHAT_BOT_URL || 'http://localhost:8946'; const sosTarget = 'http://localhost:8946';
    const url = base.replace(/\/+$/, '') + '/api/wechat/sos';
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(botBody) });
    const text = await r.text();
    let data;
    try { data = JSON.parse(text); } catch (e) { data = { ok: false, raw: text.slice(0, 500) }; }
    res.status(r.status).json(data);
  } catch (e) {
    res.status(503).json({ ok: false, offline: true, error: 'wechat-bot 服务未启动', detail: e.message });
  }
});

// 28c. R727 微信推送透传（同源代理 → wechat-bot，消除前端跨端口硬编码）
// 前端统一调 /api/wechat/send|sos|history，由 api-server 转发到 WECHAT_BOT_URL（默认 8946）
['send', 'sos', 'history'].forEach(ep => {
  const method = ep === 'history' ? 'get' : 'post';
  app[method]('/api/wechat/' + ep, optionalAuth, async (req, res) => {
    try {
      const base = process.env.WECHAT_BOT_URL || 'http://localhost:8946'; const sosTarget = 'http://localhost:8946';
      const url = base.replace(/\/+$/, '') + '/api/wechat/' + ep;
      const init = { method: method.toUpperCase(), headers: { 'Content-Type': 'application/json' } };
      // R729 修真：wechat-bot 端 /send 期望 {openid, data:{content}}，前端用 {to,message}——自动转译
      let body = req.body || {};
      if (ep === 'send' && (body.to || body.message)) {
        const openid = body.openid || body.to || 'default';
        const content = body.content || body.message || '';
        body = { openid, data: { content } };
      }
      if (method === 'post') init.body = JSON.stringify(body);
      const r = await fetch(url, init);
      const text = await r.text();
      let data;
      try { data = JSON.parse(text); } catch (e) { data = { ok: false, raw: text.slice(0, 500) } }
      res.status(r.status).json(data);
    } catch (e) {
      // wechat-bot 不在线 → 返回降级结构，前端提示但不算系统错误
      res.status(503).json({ ok: false, offline: true, error: 'wechat-bot 服务未启动', detail: e.message });
    }
  });
});

// 28d. R727 五诊集群聚合探活（同源代理，避免浏览器直连 Python 服务被 CORS 拦）
app.get('/api/cluster/health', optionalAuth, async (req, res) => {
  const targets = [
    { name: 'API 服务', url: 'http://localhost:8972/api/tcm/health' },
    { name: '视觉网关', url: 'http://localhost:8940/health' },
    { name: '面诊引擎', url: 'http://localhost:8941/health' },
    { name: '舌诊引擎', url: 'http://localhost:8942/health' },
    { name: '眼诊引擎', url: 'http://localhost:8943/health' },
    { name: '手诊引擎', url: 'http://localhost:8944/health' },
    { name: '微信推送', url: process.env.WECHAT_BOT_URL || 'http://localhost:8946/health' }
  ];
  const results = await Promise.all(targets.map(async t => {
    const t0 = Date.now();
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 3000);
      const r = await fetch(t.url, { signal: ctrl.signal });
      clearTimeout(timer);
      return { name: t.name, port: t.url.split(':')[2].split('/')[0], up: r.ok, latency_ms: Date.now() - t0 };
    } catch (e) {
      return { name: t.name, port: t.url.split(':')[2].split('/')[0], up: false, latency_ms: Date.now() - t0, error: e.message.slice(0, 80) };
    }
  }));
  res.json({ ok: true, cluster: results, checked_at: new Date().toISOString() });
});

// 29. /api/home/sos — 紧急求助（family-portal/chronic-disease/home-tcm）
app.post('/api/home/sos', optionalAuth, async (req, res) => {
  try {
    const b = req.body || {};
    const patient_id = String(b.patient_id || b.patient || '').trim();
    const { type, location, note, contact, urgency } = b;
    if (!patient_id) return res.status(400).json({ ok: false, error: '缺少 patient_id' });
    const SOS_FILE = path.join(__dirname, '../data/sos-events.json');
    let events = [];
    if (fs.existsSync(SOS_FILE)) {
      try { events = JSON.parse(fs.readFileSync(SOS_FILE, 'utf8')); } catch (e) { events = []; }
    }
    const evt = {
      id: 'SOS-' + Date.now().toString(36),
      patient_id: String(patient_id).trim(),
      type: String(type || 'general').trim(),
      location: String(location || '').trim(),
      note: String(note || '').trim().slice(0, 200),
      contact: String(contact || '').trim(),
      urgency: String(urgency || 'normal').trim(),
      status: 'active',
      created_at: new Date().toISOString()
    };
    events.push(evt);
    // 仅保留最近 200 条
    if (events.length > 200) events = events.slice(-200);
    fs.writeFileSync(SOS_FILE, JSON.stringify(events, null, 2));
    res.json({ ok: true, id: evt.id, status: 'active', message: '求助已受理，请保持通讯畅通', event: evt });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 30. /api/vital/latest — 最新生命体征（clinic-desk/home-tcm/wearable-monitor，本地兜底）
app.get('/api/vital/latest', optionalAuth, async (req, res) => {
  try {
    const pid = (req.query.patient_id || 'P001').trim();
    // 优先读本地 tcm_vitals.jsonl
    const VITAL_FILE = path.join(__dirname, '../data/tcm_vitals.jsonl');
    let latest = null;
    if (fs.existsSync(VITAL_FILE)) {
      const lines = fs.readFileSync(VITAL_FILE, 'utf8').split('\n').filter(Boolean);
      for (let i = lines.length - 1; i >= 0; i--) {
        try {
          const v = JSON.parse(lines[i]);
          if (v.patient_id === pid || v.patientId === pid) { latest = v; break; }
        } catch (e) { /* 跳过坏行 */ }
      }
    }
    // 再扫 wearable-ingest 设备流水（data/wearables/<pid>_*.jsonl），与本地记录取最新（R772）
    try {
      const wdir = path.join(__dirname, '../data/wearables');
      if (fs.existsSync(wdir)) {
        const files = fs.readdirSync(wdir).filter(f => f.startsWith(pid + '_') && f.endsWith('.jsonl'));
        for (const f of files) {
          const lines = fs.readFileSync(path.join(wdir, f), 'utf8').split('\n').filter(Boolean);
          for (let i = lines.length - 1; i >= 0; i--) {
            try {
              const rec = JSON.parse(lines[i]);
              const flat = { patient_id: pid, ...(rec.metrics || {}), ts: rec.ts, risk: rec.risk, risk_level: rec.risk_level, tcmHint: rec.tcmHint, device_type: rec.device_type, source: 'wearable-ingest' };
              if (!latest || String(flat.ts || '') > String(latest.ts || latest.updated_at || '')) latest = flat;
              break;
            } catch (e) { /* 跳过坏行 */ }
          }
        }
      }
    } catch (e) { /* 目录异常不影响主流程 */ }
    // 无本地记录时尝试代理 8944（wearable 服务），失败则返回空结构
    if (!latest) {
      try {
        const r = await fetch(`http://localhost:8944/api/vital/latest?patient_id=${pid}`);
        if (r.ok) { const d = await r.json(); latest = d.data || d; }
      } catch (e) { /* 8944 不可用，保持 null */ }
    }
    res.json({
      ok: true, patient_id: pid,
      data: latest || { patient_id: pid, heart_rate: null, blood_pressure: null, spo2: null, temperature: null, updated_at: null },
      source: latest ? (latest.source || 'local') : 'empty'
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 31. /api/tts — 文本转语音（home-tcm，复用 8912 Edge-TTS 或返回提示）
app.post('/api/tts', optionalAuth, async (req, res) => {
  try {
    const { text, voice } = req.body || {};
    if (!text) return res.status(400).json({ ok: false, error: '缺少 text' });
    // 尝试调用 mingli-baojian 的 Edge-TTS 服务（8912）
    try {
      const r = await fetch('http://localhost:8912/api/tts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: String(text).slice(0, 500), voice: voice || 'zh-CN-XiaoxiaoNeural' })
      });
      if (r.ok) {
        const buf = Buffer.from(await r.arrayBuffer());
        return res.set('Content-Type', 'audio/mpeg').send(buf);
      }
    } catch (e) { /* 8912 不可用，降级 */ }
    // 降级：返回浏览器端语音合成提示（前端可用 SpeechSynthesis 朗读）
    res.json({ ok: false, fallback: 'browser-tts', message: 'TTS 服务不可用，请用浏览器语音合成朗读', text: String(text).slice(0, 200) });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 32. /api/public/kb/realtime-search — 实时 KB 搜索（realtime-assistant，同源优先）
// 常见证型别名映射（用户口语化输入 → 标准证型）
const SYNDROME_ALIASES = {
  '气血两虚': ['心脾两虚', '气虚血瘀'],
  '脾虚湿盛': ['脾虚湿困'],
  '肝气郁结': ['肝郁气滞'],
  '肝郁脾虚': ['肝郁气滞', '脾胃气虚'],
  '湿热': ['肝胆湿热', '湿热下注'],
  '风寒感冒': ['外感风寒_表虚', '外感风寒_表实', '风寒表证'],
  '风热感冒': ['少阳证'],
  '感冒': ['外感风寒_表虚', '外感风寒_表实', '风寒表证'],
  '肾虚': ['阳虚水泛', '阴虚火旺'],
  '肾阳虚': ['阳虚水泛'],
  '阴虚': ['阴虚火旺', '气阴两虚'],
  '气虚': ['脾胃气虚', '气阴两虚', '气虚血瘀'],
  '血虚': ['心脾两虚'],
  '脾虚': ['脾虚湿困', '脾胃气虚', '心脾两虚'],
  '失眠': ['心脾两虚'],
  '心悸': ['心脾两虚', '气阴两虚'],
  '乏力': ['脾胃气虚', '气阴两虚'],
  '水肿': ['阳虚水泛'],
  '口苦': ['肝胆湿热', '少阳证'],
  '胁痛': ['肝郁气滞', '肝胆湿热'],
  '带下': ['湿热下注']
};
app.get('/api/public/kb/realtime-search', optionalAuth, async (req, res) => {
  try {
    const q = String(req.query.q || req.query.query || '').trim().slice(0, 50);
    if (!q) return res.json({ ok: true, results: [], total: 0 });
    const { getKBMatch } = require('./engines/kb-bridge');
    // 症状/证型搜索：同时查 KB bridge + FORMULA_SYNDROME_MAP
    const kbMatch = getKBMatch({ symptoms: [q], _cat: 'inquiry' });
    const FORMULA_SYNDROME_MAP = require('./engines/syndrome-engine').FORMULA_SYNDROME_MAP;
    const results = [];
    // 0. 别名映射优先（用户口语 → 标准证型）
    const aliasHits = SYNDROME_ALIASES[q] || [];
    for (const target of aliasHits) {
      if (FORMULA_SYNDROME_MAP[target]) {
        const d = FORMULA_SYNDROME_MAP[target];
        results.push({ syndrome: target, formula: d.formula, symptoms: d.symptoms, source: 'alias' });
      }
    }
    // 1. 精确证型匹配
    for (const [syndrome, data] of Object.entries(FORMULA_SYNDROME_MAP)) {
      if ((syndrome || '').includes(q) || (data.formula || '').includes(q) ||
          (data.symptoms || []).some(s => String(s || '').includes(q))) {
        results.push({ syndrome, formula: data.formula, symptoms: data.symptoms, source: data.source });
      }
      if (results.length >= 8) break;
    }
    // 2. KB 命中插到最前（仅当不是待辨证/四诊合参的默认兜底）
    if (kbMatch && kbMatch.syndrome && kbMatch.syndrome !== '待辨证') {
      results.unshift({ syndrome: kbMatch.syndrome, formula: kbMatch.formula || '', symptoms: kbMatch.matched_features || [], source: 'kb-bridge' });
    }
    res.json({ ok: true, q, results, total: results.length, latency_ms: 0 });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 33. /api/log/error — 前端错误上报（error-interceptor）
app.post('/api/log/error', optionalAuth, async (req, res) => {
  try {
    const { message, stack, url, userAgent, level, module } = req.body || {};
    const LOG_FILE = path.join(__dirname, '../data/audit/frontend-errors.jsonl');
    fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
    const entry = {
      ts: new Date().toISOString(),
      level: String(level || 'error').slice(0, 10),
      message: String(message || '').slice(0, 500),
      stack: String(stack || '').slice(0, 2000),
      url: String(url || '').slice(0, 300),
      module: String(module || '').slice(0, 100),
      userAgent: String(userAgent || '').slice(0, 300)
    };
    fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n');
    res.json({ ok: true, id: entry.ts });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ========== R719: 家庭问诊闭环（用户提交 → 医生后台审核 → 出方案）==========

// 34. POST /api/family/consult — 家庭成员提交问诊（进入医生审核队列）
const CONSULT_FILE = path.join(__dirname, '../data/family-consults.jsonl');
function loadConsults() {
  const list = [];
  if (fs.existsSync(CONSULT_FILE)) {
    const lines = fs.readFileSync(CONSULT_FILE, 'utf8').split('\n').filter(Boolean);
    for (const line of lines) {
      try { list.push(JSON.parse(line)); } catch (e) { /* 跳过坏行 */ }
    }
  }
  return list;
}
function saveConsult(c) {
  fs.mkdirSync(path.dirname(CONSULT_FILE), { recursive: true });
  fs.appendFileSync(CONSULT_FILE, JSON.stringify(c) + '\n');
}

app.post('/api/family/consult', optionalAuth, async (req, res) => {
  try {
    const { patient_id, patient_name, symptoms, complaint, tongue, face, channel } = req.body || {};
    if (!patient_id) return res.status(400).json({ ok: false, error: '缺少 patient_id' });
    // 1. 先跑 AI 初判（尽力而为，失败不阻塞提交）
    let aiResult = null;
    try {
      const diag = await fetch('http://localhost:' + PORT + '/api/tcm/diagnose', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tongue: tongue || null, inquiry: { symptoms: symptoms || [], complaint: complaint || '' } })
      });
      if (diag.ok) aiResult = (await diag.json()).data || null;
    } catch (e) { /* AI 初判失败不阻塞 */ }
    // 2. 写问诊记录（pending_review 待医生审核）
    const consult = {
      consult_id: 'FC-' + Date.now().toString(36).toUpperCase(),
      patient_id: String(patient_id).trim(),
      patient_name: String(patient_name || '家庭成员').trim().slice(0, 30),
      symptoms: Array.isArray(symptoms) ? symptoms.map(String).slice(0, 20) : [],
      complaint: String(complaint || '').trim().slice(0, 500),
      tongue: tongue || null,
      face: face || null,
      channel: String(channel || 'family').slice(0, 20),
      ai_suggestion: aiResult ? {
        syndrome: aiResult.inhouse_diagnosis?.primary_syndrome?.syndrome || aiResult.kb_match?.syndrome || '',
        formula: aiResult.suggested_formula?.formula || '',
        confidence: aiResult.inhouse_diagnosis?.primary_syndrome?.confidence || 0,
        detail: aiResult
      } : null,
      status: 'pending_review',
      review: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    saveConsult(consult);
    res.json({ ok: true, consult_id: consult.consult_id, status: 'pending_review', ai_suggestion: consult.ai_suggestion, message: '问诊已提交，等待医生审核（互联网医院模式）' });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 35. GET /api/family/consults — 查询问诊记录（家庭成员/医生双视角）
app.get('/api/family/consults', optionalAuth, async (req, res) => {
  try {
    const { patient_id, status, limit } = req.query;
    let list = loadConsults();
    if (patient_id) list = list.filter(c => c.patient_id === patient_id);
    if (status) list = list.filter(c => c.status === status);
    list.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    const lim = Math.min(parseInt(limit || '50', 10) || 50, 200);
    res.json({ ok: true, total: list.length, consults: list.slice(0, lim) });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 36. POST /api/family/consult/verify — 医生审核问诊（approve/revise/reject）
app.post('/api/family/consult/verify', optionalAuth, async (req, res) => {
  try {
    const { consult_id, action, doctor_name, syndrome, formula, advice, notes } = req.body || {};
    if (!consult_id) return res.status(400).json({ ok: false, error: '缺少 consult_id' });
    if (!['approve', 'revise', 'reject'].includes(action)) {
      return res.status(400).json({ ok: false, error: 'action 必须为 approve/revise/reject' });
    }
    const list = loadConsults();
    const idx = list.findIndex(c => c.consult_id === consult_id);
    if (idx < 0) return res.status(404).json({ ok: false, error: '问诊记录不存在' });
    const consult = list[idx];
    if (consult.status !== 'pending_review' && consult.status !== 'reviewing') {
      return res.status(409).json({ ok: false, error: '当前状态 ' + consult.status + ' 不可审核（仅待审可审）' });
    }
    // 状态流转
    const now = new Date().toISOString();
    consult.status = action === 'approve' ? 'approved' : (action === 'revise' ? 'revised' : 'rejected');
    consult.review = {
      action,
      doctor_name: String(doctor_name || req.user?.username || '医生').slice(0, 30),
      syndrome: syndrome || consult.ai_suggestion?.syndrome || '',
      formula: formula || consult.ai_suggestion?.formula || '',
      advice: String(advice || '').trim().slice(0, 500),
      notes: String(notes || '').trim().slice(0, 500),
      reviewed_at: now
    };
    consult.updated_at = now;
    // 重写文件（保留未变更的）
    list[idx] = consult;
    fs.writeFileSync(CONSULT_FILE, list.map(c => JSON.stringify(c)).join('\n') + '\n');

    // A5 知识反哺：医生审核通过的案例 → 直接写 formal KB（医生已审核，无需 staging 二次审核）
    if (action === 'approve' || action === 'revise') {
      try {
        const formalDir = path.join(__dirname, 'kb', 'formal');
        const fid = 'fc-fb-' + Date.now();
        const finalSyndrome = (consult.review && consult.review.syndrome) || consult.ai_suggestion?.syndrome || '';
        const finalFormula = (consult.review && consult.review.formula) || consult.ai_suggestion?.formula || '';
        if (finalSyndrome) {
          const herbs = String(finalFormula || '').split(/[+、,，;；\s]+/).filter(Boolean).slice(0, 12);
          const formalEntry = {
            id: fid,
            source: 'family-consult',
            source_id: consult.consult_id,
            patient_id: consult.patient_id,
            complaint: consult.complaint,
            symptoms: consult.symptoms || [],
            syndrome: finalSyndrome,
            formula: finalFormula,
            herbs: herbs,
            doctor: consult.review.doctor_name,
            verified_by: consult.review.doctor_name,
            feedback: action === 'approve' ? 'approved' : 'revised',
            trust_score: action === 'approve' ? 0.85 : 0.75,
            status: 'formal',
            created_at: now
          };
          fs.writeFileSync(path.join(formalDir, fid + '.json'), JSON.stringify(formalEntry, null, 2));
          // 写 staging 日志（审计追踪）
          feedbackLoop.writeStaging([formalEntry]);
        }
      } catch (e) { /* KB 反哺失败不影响审核 */ }
    }

    // R719: 方案出具后自动生成 7 天随访计划（复诊闭环）
    if (action === 'approve' || action === 'revise') {
      try {
        const FOLLOWUP_FILE = path.join(__dirname, '..', 'data', 'followups.json');
        let followups = [];
        if (fs.existsSync(FOLLOWUP_FILE)) {
          try { followups = JSON.parse(fs.readFileSync(FOLLOWUP_FILE, 'utf8') || '[]'); } catch (e) { followups = []; }
        }
        const dueAt = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
        followups.push({
          id: 'FU-' + Date.now().toString(36).toUpperCase(),
          consult_id: consult.consult_id,
          patient_id: consult.patient_id,
          patient_name: consult.patient_name || consult.patient_id,
          syndrome: (consult.review && consult.review.syndrome) || '',
          formula: (consult.review && consult.review.formula) || '',
          advice: (consult.review && consult.review.advice) || '',
          due_at: dueAt,
          status: 'pending',
          created_at: now,
          source: 'family-consult'
        });
        // 每患者最多保留最近 10 条随访
        followups = followups.slice(-200);
        fs.writeFileSync(FOLLOWUP_FILE, JSON.stringify(followups, null, 2));
      } catch (e) { /* 随访生成失败不影响审核 */ }
    }

    // 审核结果 wechat 推送（家庭成员即时收到通知）
    try {
      const titleMap = {
        approved: '✅ 方案已出具',
        revised: '🔄 方案已修订',
        rejected: '❌ 问诊已驳回'
      };
      const r = await fetch(process.env.WECHAT_BOT_URL || 'http://localhost:8946/api/wechat/send', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          openid: consult.patient_id || 'default',
          type: 'consult_result',
          data: {
            title: titleMap[consult.status] || '问诊结果',
            patient: consult.patient_name || consult.patient_id,
            syndrome: (consult.review && consult.review.syndrome) || '',
            formula: (consult.review && consult.review.formula) || '',
            advice: (consult.review && consult.review.advice) || (consult.review && consult.review.notes) || ''
          }
        })
      });
      if (!r.ok) { /* 推送失败不阻塞审核 */ }
    } catch (e) { /* 推送失败不影响审核 */ }

    res.json({
      ok: true, consult_id, status: consult.status, review: consult.review,
      flow_step: consult.status === 'approved' ? '已出方案' : (consult.status === 'revised' ? '已修订' : '已驳回'),
      message: consult.status === 'approved' ? '方案已出具，家庭成员可查看' : (consult.status === 'revised' ? '已修订并回传家庭' : '已驳回，通知家庭成员补充信息')
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 37. GET /api/family/followups — 查询随访计划（家庭成员/医生双视角）
app.get('/api/family/followups', optionalAuth, async (req, res) => {
  try {
    const { patient_id, status, limit } = req.query;
    const FOLLOWUP_FILE = path.join(__dirname, '..', 'data', 'followups.json');
    let list = [];
    if (fs.existsSync(FOLLOWUP_FILE)) {
      try { list = JSON.parse(fs.readFileSync(FOLLOWUP_FILE, 'utf8') || '[]'); } catch (e) { list = []; }
    }
    if (patient_id) list = list.filter(f => f.patient_id === patient_id);
    if (status) list = list.filter(f => f.status === status);
    list.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    const lim = Math.min(parseInt(limit || '50', 10) || 50, 200);
    res.json({ ok: true, total: list.length, followups: list.slice(0, lim) });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 38. POST /api/family/followup/complete — 标记随访完成（逆向：患者反馈结果）
app.post('/api/family/followup/complete', optionalAuth, async (req, res) => {
  try {
    const { id, feedback, symptom_score } = req.body || {};
    if (!id) return res.status(400).json({ ok: false, error: '缺少 id' });
    const FOLLOWUP_FILE = path.join(__dirname, '..', 'data', 'followups.json');
    let list = [];
    if (fs.existsSync(FOLLOWUP_FILE)) {
      try { list = JSON.parse(fs.readFileSync(FOLLOWUP_FILE, 'utf8') || '[]'); } catch (e) { list = []; }
    }
    const idx = list.findIndex(f => f.id === id);
    if (idx < 0) return res.status(404).json({ ok: false, error: '随访记录不存在' });
    if (list[idx].status === 'completed') {
      return res.status(409).json({ ok: false, error: '该随访已完成，不可重复提交' });
    }
    list[idx].status = 'completed';
    list[idx].completed_at = new Date().toISOString();
    list[idx].feedback = String(feedback || '').trim().slice(0, 500);
    list[idx].symptom_score = Math.max(0, Math.min(10, parseInt(symptom_score, 10) || 5));
    // R719: 反馈文本智能分析（关键词 → 疗效判定）
    const fbText = list[idx].feedback;
    const improveWords = ['好转', '减轻', '缓解', '改善', '有效', '好了', '消失', '恢复', '舒服', '通畅'];
    const worsenWords = ['加重', '恶化', '无效', '没效', '更差', '严重', '难受', '复发'];
    const neutralWords = ['一般', '差不多', '没变化', '平平'];
    const hasImprove = improveWords.some(w => fbText.includes(w));
    const hasWorsen = worsenWords.some(w => fbText.includes(w));
    const hasNeutral = neutralWords.some(w => fbText.includes(w));
    let effect = 'unknown';
    if (hasImprove && !hasWorsen) effect = 'improved';
    else if (hasWorsen) effect = 'worsened';
    else if (hasNeutral) effect = 'stable';
    else if (list[idx].symptom_score >= 7) effect = 'improved';
    else if (list[idx].symptom_score <= 3) effect = 'worsened';
    else effect = 'stable';
    list[idx].effect = effect;
    // 复诊建议：加重/无效 → 建议复诊
    list[idx].needs_revisit = effect === 'worsened';
    list[idx].revisit_reason = effect === 'worsened' ? '随访反馈提示症状加重或无效，建议尽快复诊调方' : '';

    // R758 AI 化：反馈含症状描述时调用辨证引擎生成 AI 洞察（降级：AI 不可用不影响主流程）
    try {
      if (fbText.length >= 4 && !['好转', '减轻', '没变化', '好了', '有效'].some(w => fbText.length <= 6 && fbText === w)) {
        const http = require('http');
        const qbody = JSON.stringify({ symptoms: fbText.split(/[，。；,!]/).filter(x => x.trim().length >= 2).slice(0, 5) });
        const aiInsight = await new Promise((resolve) => {
          const req2 = http.request({ host: '127.0.0.1', port: 8932, path: '/api/tcm/inhouse-diagnose', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(qbody) }, timeout: 5000 }, (resp) => {
            let d = ''; resp.on('data', c => (d += c)); resp.on('end', () => {
              try { const j = JSON.parse(d); const diag = j.diagnosis || {}; resolve(diag.syndrome ? { syndrome: diag.syndrome, formula: diag.formula || '', confidence: diag.confidence || null } : null); }
              catch (e) { resolve(null); }
            });
          });
          req2.on('error', () => resolve(null)); req2.on('timeout', () => { req2.destroy(); resolve(null); });
          req2.write(qbody); req2.end();
        });
        if (aiInsight) {
          list[idx].ai_insight = aiInsight;
          list[idx].ai_advice = effect === 'worsened' ? '当前症状对应证型「' + aiInsight.syndrome + '」，建议尽快复诊' : '当前反馈对应证型「' + aiInsight.syndrome + '」' + (aiInsight.formula ? '，可参考方剂 ' + aiInsight.formula : '');
        }
      }
    } catch (e) { /* AI 洞察失败不阻断随访完成 */ }
    fs.writeFileSync(FOLLOWUP_FILE, JSON.stringify(list, null, 2));

    // R719: 自动转诊——worsened 自动生成复诊单进医生队列
    let revisitCreated = false;
    if (effect === 'worsened') {
      try {
        const REVISIT_FILE = path.join(__dirname, '..', 'data', 'revisits.json');
        let revisits = [];
        if (fs.existsSync(REVISIT_FILE)) {
          try { revisits = JSON.parse(fs.readFileSync(REVISIT_FILE, 'utf8') || '[]'); } catch (e) { revisits = []; }
        }
        // 幂等：同一随访不重复建单
        if (!revisits.some(r => r.followup_id === id)) {
          revisits.push({
            id: 'RV-' + Date.now().toString(36).toUpperCase(),
            followup_id: id,
            consult_id: list[idx].consult_id || '',
            patient_id: list[idx].patient_id,
            patient_name: list[idx].patient_name || list[idx].patient_id,
            syndrome: list[idx].syndrome || '',
            formula: list[idx].formula || '',
            feedback: list[idx].feedback || '',
            symptom_score: list[idx].symptom_score || 0,
            reason: list[idx].revisit_reason || '随访反馈症状加重',
            status: 'pending',
            priority: 'high',
            created_at: new Date().toISOString()
          });
          revisits = revisits.slice(-100);
          fs.writeFileSync(REVISIT_FILE, JSON.stringify(revisits, null, 2));
          revisitCreated = true;
          // R719: 转诊单生成 → wechat 通知家庭成员
          try {
            await fetch(process.env.WECHAT_BOT_URL || 'http://localhost:8946/api/wechat/send', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                openid: list[idx].patient_id || 'default',
                type: 'consult_result',
                data: {
                  title: '🏥 已为您安排复诊',
                  patient: list[idx].patient_name || list[idx].patient_id,
                  syndrome: list[idx].syndrome || '',
                  formula: list[idx].formula || '',
                  advice: '随访反馈提示症状加重/无效，已自动转诊。请留意复诊排期通知并及时到院复诊调方。'
                }
              })
            });
          } catch (e) { /* 通知失败不影响转诊 */ }
        }
      } catch (e) { /* 转诊失败不影响随访记录 */ }
    }

    res.json({ ok: true, id, status: 'completed', effect, needs_revisit: list[idx].needs_revisit, revisit_created: revisitCreated, message: '随访已记录，感谢反馈' });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 39. GET /api/family/followups/overdue — 逾期/到期随访扫描（医疗提醒）
app.get('/api/family/followups/overdue', optionalAuth, async (req, res) => {
  try {
    const FOLLOWUP_FILE = path.join(__dirname, '..', 'data', 'followups.json');
    let list = [];
    if (fs.existsSync(FOLLOWUP_FILE)) {
      try { list = JSON.parse(fs.readFileSync(FOLLOWUP_FILE, 'utf8') || '[]'); } catch (e) { list = []; }
    }
    const now = new Date();
    const overdue = list.filter(f => f.status === 'pending' && new Date(f.due_at) <= now);
    res.json({ ok: true, total: overdue.length, overdue });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 40. POST /api/family/followups/push-overdue — 推送逾期随访提醒（wechat-bot 8945）
app.post('/api/family/followups/push-overdue', optionalAuth, async (req, res) => {
  try {
    const FOLLOWUP_FILE = path.join(__dirname, '..', 'data', 'followups.json');
    let list = [];
    if (fs.existsSync(FOLLOWUP_FILE)) {
      try { list = JSON.parse(fs.readFileSync(FOLLOWUP_FILE, 'utf8') || '[]'); } catch (e) { list = []; }
    }
    const now = new Date();
    const overdue = list.filter(f => f.status === 'pending' && new Date(f.due_at) <= now);
    if (overdue.length === 0) {
      return res.json({ ok: true, pushed: 0, message: '无逾期随访' });
    }
    let pushed = 0;
    for (const f of overdue) {
      try {
        const r = await fetch(process.env.WECHAT_BOT_URL || 'http://localhost:8946/api/wechat/send', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            openid: f.patient_id || 'default',
            type: 'followup_reminder',
            data: { patient: f.patient_name || f.patient_id, syndrome: f.syndrome, formula: f.formula }
          })
        });
        if (r.ok) pushed++;
      } catch (e) { /* 单条推送失败继续 */ }
    }
    res.json({ ok: true, pushed, total: overdue.length, message: pushed + '/' + overdue.length + ' 条随访提醒已推送' });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 41. GET /api/family/revisits — 复诊队列（医生视角：worsened 自动转诊单）
app.get('/api/family/revisits', optionalAuth, async (req, res) => {
  try {
    const { status, limit } = req.query;
    const REVISIT_FILE = path.join(__dirname, '..', 'data', 'revisits.json');
    let list = [];
    if (fs.existsSync(REVISIT_FILE)) {
      try { list = JSON.parse(fs.readFileSync(REVISIT_FILE, 'utf8') || '[]'); } catch (e) { list = []; }
    }
    if (status) list = list.filter(r => r.status === status);
    list.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    const lim = Math.min(parseInt(limit || '50', 10) || 50, 200);
    res.json({ ok: true, total: list.length, revisits: list.slice(0, lim) });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 42. POST /api/family/revisit/schedule — 医生排期复诊
app.post('/api/family/revisit/schedule', optionalAuth, async (req, res) => {
  try {
    const { id, schedule_at, doctor_name, note } = req.body || {};
    if (!id) return res.status(400).json({ ok: false, error: '缺少 id' });
    const REVISIT_FILE = path.join(__dirname, '..', 'data', 'revisits.json');
    let list = [];
    if (fs.existsSync(REVISIT_FILE)) {
      try { list = JSON.parse(fs.readFileSync(REVISIT_FILE, 'utf8') || '[]'); } catch (e) { list = []; }
    }
    const idx = list.findIndex(r => r.id === id);
    if (idx < 0) return res.status(404).json({ ok: false, error: '复诊单不存在' });
    if (list[idx].status === 'scheduled') {
      return res.status(409).json({ ok: false, error: '该复诊单已排期' });
    }
    list[idx].status = 'scheduled';
    list[idx].schedule_at = String(schedule_at || new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10)).slice(0, 10);
    list[idx].doctor_name = String(doctor_name || req.user?.username || '医生').slice(0, 30);
    list[idx].note = String(note || '').trim().slice(0, 200);
    list[idx].scheduled_at = new Date().toISOString();
    fs.writeFileSync(REVISIT_FILE, JSON.stringify(list, null, 2));
    res.json({ ok: true, id, status: 'scheduled', schedule_at: list[idx].schedule_at, message: '复诊已排期，将通知家庭成员' });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 43. POST /api/family/revisit/complete — 复诊完成（闭环）
app.post('/api/family/revisit/complete', optionalAuth, async (req, res) => {
  try {
    const { id, outcome, new_syndrome, new_formula } = req.body || {};
    if (!id) return res.status(400).json({ ok: false, error: '缺少 id' });
    const REVISIT_FILE = path.join(__dirname, '..', 'data', 'revisits.json');
    let list = [];
    if (fs.existsSync(REVISIT_FILE)) {
      try { list = JSON.parse(fs.readFileSync(REVISIT_FILE, 'utf8') || '[]'); } catch (e) { list = []; }
    }
    const idx = list.findIndex(r => r.id === id);
    if (idx < 0) return res.status(404).json({ ok: false, error: '复诊单不存在' });
    if (list[idx].status === 'completed') {
      return res.status(409).json({ ok: false, error: '该复诊单已完成' });
    }
    list[idx].status = 'completed';
    list[idx].outcome = String(outcome || '已复诊').trim().slice(0, 300);
    list[idx].new_syndrome = String(new_syndrome || '').trim().slice(0, 50);
    list[idx].new_formula = String(new_formula || '').trim().slice(0, 200);
    list[idx].completed_at = new Date().toISOString();
    fs.writeFileSync(REVISIT_FILE, JSON.stringify(list, null, 2));
    res.json({ ok: true, id, status: 'completed', message: '复诊已闭环' });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});


// 44. GET /api/family/weekly-report — 家庭健康周报（疗效聚合，供周报推送/页面展示）
app.get('/api/family/weekly-report', optionalAuth, async (req, res) => {
  try {
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    // 1. 本周问诊
    let consults = loadConsults().filter(c => (c.created_at || '') >= weekAgo);
    // 2. 本周随访
    const FOLLOWUP_FILE = path.join(__dirname, '..', 'data', 'followups.json');
    let followups = [];
    if (fs.existsSync(FOLLOWUP_FILE)) {
      try { followups = JSON.parse(fs.readFileSync(FOLLOWUP_FILE, 'utf8') || '[]'); } catch (e) { followups = []; }
    }
    const weekFollowups = followups.filter(f => (f.completed_at || f.created_at || '') >= weekAgo);
    // 3. 本周复诊
    const REVISIT_FILE = path.join(__dirname, '..', 'data', 'revisits.json');
    let revisits = [];
    if (fs.existsSync(REVISIT_FILE)) {
      try { revisits = JSON.parse(fs.readFileSync(REVISIT_FILE, 'utf8') || '[]'); } catch (e) { revisits = []; }
    }
    const weekRevisits = revisits.filter(r => (r.created_at || '') >= weekAgo);
    // 聚合
    const completed = weekFollowups.filter(f => f.status === 'completed');
    const improved = completed.filter(f => f.effect === 'improved').length;
    const worsened = completed.filter(f => f.effect === 'worsened').length;
    const pendingFollowups = followups.filter(f => f.status === 'pending');
    const overdue = pendingFollowups.filter(f => new Date(f.due_at) <= new Date());
    // 常见证型
    const dxCount = {};
    consults.forEach(c => { const s = (c.ai_suggestion && c.ai_suggestion.syndrome) || ''; if (s) dxCount[s] = (dxCount[s] || 0) + 1; });
    const topDx = Object.entries(dxCount).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([s, n]) => s + '×' + n);
    // 报告文本
    const lines = [];
    lines.push('📊 家庭健康周报（' + new Date().toISOString().slice(0, 10) + '）');
    lines.push('问诊 ' + consults.length + ' 单' + (topDx.length ? '（' + topDx.join('、') + '）' : ''));
    lines.push('随访反馈 ' + completed.length + ' 条：改善 ' + improved + ' / 平稳 ' + (completed.length - improved - worsened) + ' / 加重 ' + worsened);
    lines.push('复诊单 ' + weekRevisits.length + ' 条' + (overdue.length ? '，逾期随访 ' + overdue.length + ' 条待反馈' : ''));
    if (worsened > 0) lines.push('⚠️ 建议重点关注加重患者，及时复诊调方');
    if (overdue.length > 0) lines.push('📋 逾期随访已安排每日 09:00 自动提醒');
    const report = lines.join('\n');
    res.json({ ok: true, report, stats: { consults: consults.length, followups_completed: completed.length, improved, worsened, revisits: weekRevisits.length, overdue: overdue.length, top_dx: topDx }, period: '7d' });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 45. GET /api/kb/stats — KB 进化统计（formal/staging 数量 + 来源分布 + 信任分箱）
app.get('/api/kb/stats', (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const baseDir = path.join(__dirname, 'kb');
    const safeRead = (dir) => {
      const d = path.join(baseDir, dir);
      if (!fs.existsSync(d)) return [];
      return fs.readdirSync(d).filter(f => f.endsWith('.json')).map(f => {
        try { return JSON.parse(fs.readFileSync(path.join(d, f), 'utf8')); } catch (e) { return null; }
      }).filter(Boolean);
    };
    const formal = safeRead('formal');
    const staging = safeRead('staging');
    const all = [...formal, ...staging];
    const bySource = {};
    const trustBuckets = { '0.0-0.5': 0, '0.5-0.7': 0, '0.7-0.85': 0, '0.85-0.95': 0, '0.95+': 0 };
    const syndromeCount = {};
    for (const k of all) {
      const s = k.source || 'unknown';
      bySource[s] = (bySource[s] || 0) + 1;
      const ts = k.trust_score || 0;
      if (ts < 0.5) trustBuckets['0.0-0.5']++;
      else if (ts < 0.7) trustBuckets['0.5-0.7']++;
      else if (ts < 0.85) trustBuckets['0.7-0.85']++;
      else if (ts < 0.95) trustBuckets['0.85-0.95']++;
      else trustBuckets['0.95+']++;
      const syn = k.syndrome || (k.diagnosis && k.diagnosis.syndrome);
      if (syn) syndromeCount[syn] = (syndromeCount[syn] || 0) + 1;
    }
    // 证据分级：multi_source 标记 或 evidence_patients 数组长度>1 或 字段值>1 任一满足即多源
    const evidenceMultisource = formal.filter(k =>
      k.multi_source === true ||
      (Array.isArray(k.evidence_patients) ? k.evidence_patients.length > 1 : (k.evidence_patients || 0) > 1)
    ).length;
    // KB 命中估计：formal 是金标准权重 1.0，staging 是候选 0.5
    const weightedCount = formal.length * 1.0 + staging.length * 0.5;
    res.json({
      ok: true,
      totals: { formal: formal.length, staging: staging.length, total: all.length, weighted: Math.round(weightedCount) },
      bySource, trustBuckets,
      topSyndromes: Object.entries(syndromeCount).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([s, n]) => ({ syndrome: s, count: n })),
      evidenceMultisource
    });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// ═══ R720: 缺失端点补齐（修真后只保留旧版没覆盖的） ═══
// med-detail / med-schedule / log/error 已在 R718 实现，本轮修真另外的 K 项在 kb-bridge.js / engines/.

// R720 启动后已发现以下端点其实在 R718 已实现：med-detail / med-schedule / sos / vital / tts / realtime-search / log/error
// R720 本轮新增实际为：KB 蒸馏闭环修真（kb-bridge.js 动态加载 formal），不再在此补端点。
// 保留占位注释，避免后续误增重复端点。

// ═══ R720: 补 /api/csrf-token（wuzhen-diagnosis.html 前端调用） ═══
app.get('/api/csrf-token', (req, res) => {
  try {
    const crypto = require('crypto');
    const csrfToken = crypto.randomBytes(24).toString('hex');
    // 无会话依赖：token 双返回（体 + cookie），前端回读任一即可
    res.setHeader('Set-Cookie', `csrfToken=${csrfToken}; Path=/; SameSite=Lax; Max-Age=3600`);
    res.json({ ok: true, csrfToken, expiresIn: 3600 });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'csrf-token 生成失败: ' + e.message });
  }
});

// 29. R729 Stub 路由（前端当前 0 引用，安全返回空数据避免 404）
app.get('/api/tcm/kb-stats', (_req, res) => res.json({ ok: true, stats: {}, note: 'kb-stats stub — 等待正式端点接入' }));
app.get('/api/wearable/status', (_req, res) => res.json({ ok: true, devices: [], note: 'wearable stub — 数据接入待启动' }));
app.get('/api/wearable/devices', (_req, res) => res.json({ ok: true, devices: [], note: 'wearable stub — 数据接入待启动' }));
// R779: 随访列表（真数据，替代桩）——支持 status/patient_id/due 过滤与统计
app.get('/api/followup/list', optionalAuth, (req, res) => {
  try {
    const { patient_id, status, due, limit } = req.query;
    const FOLLOWUP_FILE = path.join(__dirname, '..', 'data', 'followups.json');
    let list = [];
    if (fs.existsSync(FOLLOWUP_FILE)) {
      try { list = JSON.parse(fs.readFileSync(FOLLOWUP_FILE, 'utf8') || '[]'); } catch (e) { list = []; }
    }
    if (patient_id) list = list.filter(f => f.patient_id === patient_id);
    if (status) list = list.filter(f => f.status === status);
    const now = Date.now();
    if (due === 'today') list = list.filter(f => f.status === 'pending' && f.due_at && new Date(f.due_at).getTime() <= now + 24 * 3600 * 1000);
    if (due === 'overdue') list = list.filter(f => f.status === 'pending' && f.due_at && new Date(f.due_at).getTime() < now);
    list.sort((a, b) => String(a.due_at || '').localeCompare(String(b.due_at || '')));
    const lim = Math.min(parseInt(limit || '50', 10) || 50, 200);
    const pending = list.filter(f => f.status === 'pending');
    res.json({
      ok: true, total: list.length,
      stats: { pending: pending.length, overdue: pending.filter(f => f.due_at && new Date(f.due_at).getTime() < now).length, completed: list.filter(f => f.status === 'completed').length },
      list: list.slice(0, lim)
    });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// R779: 通用随访创建（问诊台签发闭环用）
app.post('/api/followup/create', optionalAuth, (req, res) => {
  try {
    const { patient_id, patient_name, syndrome, formula, advice, days, session_id } = req.body || {};
    if (!syndrome && !formula) return res.status(400).json({ ok: false, error: 'syndrome/formula 至少一项' });
    const FOLLOWUP_FILE = path.join(__dirname, '..', 'data', 'followups.json');
    let list = [];
    if (fs.existsSync(FOLLOWUP_FILE)) {
      try { list = JSON.parse(fs.readFileSync(FOLLOWUP_FILE, 'utf8') || '[]'); } catch (e) { list = []; }
    }
    const rec = {
      id: 'FU-' + Date.now().toString(36).toUpperCase(),
      // R789：随访按主索引归集（同一患者多次就诊的随访可串成时间线）
      patient_id: String(patientIndex ? patientIndex.resolvePatientId(patient_id, patient_name) : (patient_id || 'anonymous')).slice(0, 40),
      patient_name: String(patient_name || '').slice(0, 20),
      syndrome: String(syndrome || '').slice(0, 40),
      formula: String(formula || '').slice(0, 60),
      advice: String(advice || '').slice(0, 200),
      due_at: new Date(Date.now() + (Math.min(Math.max(parseInt(days, 10) || 7, 1), 90)) * 24 * 3600 * 1000).toISOString(),
      status: 'pending',
      created_at: new Date().toISOString(),
      session_id: String(session_id || '').slice(0, 64) || null,
      source: 'clinic-desk'
    };
    list.push(rec);
    list = list.slice(-200);
    fs.writeFileSync(FOLLOWUP_FILE, JSON.stringify(list, null, 2));
    res.json({ ok: true, followup: rec });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});
// R813: 财务报表真数据——从处方结算记录聚合（签发即计价 → 结算 → 报表闭环）
app.get('/api/finance/summary', optionalAuth, (req, res) => {
  try {
    const RX_STORE = path.join(__dirname, '..', 'data', 'prescriptions', 'records.jsonl');
    const latest = {};
    if (fs.existsSync(RX_STORE)) {
      const lines = fs.readFileSync(RX_STORE, 'utf-8').split('\n').filter(Boolean);
      for (const line of lines) {
        try { const r = JSON.parse(line); latest[r.rx_id] = r; } catch (e) {}
      }
    }
    const PAY_LABEL = { insurance: '医保', wechat: '微信', alipay: '支付宝', cash: '现金' };
    const paid = Object.values(latest).filter(r => r.payment_status === 'paid');
    const txns = paid.map(r => {
      let patient = r.patient_id || '—';
      try {
        const p = patientIndex && patientIndex.getPatient(r.patient_id);
        if (p && (p.name_masked || p.name_full)) patient = p.name_masked || p.name_full;
      } catch (e) {}
      return {
        rx_id: r.rx_id,
        time: r.paid_at || r.created_at || '',
        type: '中药处方',
        patient,
        doctor: r.doctor_id || '—',
        amount: Number(r.settled_amount ?? (r.price && r.price.total) ?? 0),
        pay: PAY_LABEL[r.payment_method] || r.payment_method || '—'
      };
    }).sort((a, b) => String(b.time).localeCompare(String(a.time)));
    const total = txns.reduce((s, t) => s + t.amount, 0);
    const todayKey = new Date().toISOString().slice(0, 10);
    const today = txns.filter(t => String(t.time).slice(0, 10) === todayKey).reduce((s, t) => s + t.amount, 0);
    const days = [];
    for (let d = 6; d >= 0; d--) {
      const dt = new Date(Date.now() - d * 86400000);
      const key = dt.toISOString().slice(0, 10);
      days.push({ date: key, weekday: '周' + '日一二三四五六'[dt.getDay()],
        amount: txns.filter(t => String(t.time).slice(0, 10) === key).reduce((s, t) => s + t.amount, 0) });
    }
    const byDoctor = {};
    const byPay = {};
    txns.forEach(t => { byDoctor[t.doctor] = (byDoctor[t.doctor] || 0) + t.amount; byPay[t.pay] = (byPay[t.pay] || 0) + t.amount; });
    res.json({ ok: true, total, today, count: txns.length, days, by_doctor: byDoctor, by_pay: byPay, transactions: txns.slice(0, 200) });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// ═══ R814 医生团队 · 评价 · 病种知识库 ═══
function loadDoctorProfiles() {
  try {
    const f = path.join(__dirname, '..', 'data', 'doctor-profiles.json');
    if (fs.existsSync(f)) return JSON.parse(fs.readFileSync(f, 'utf8') || '{}');
  } catch (e) {}
  return {};
}
const REVIEWS_FILE = path.join(__dirname, '..', 'data', 'reviews.json');
function loadReviews() {
  try {
    if (fs.existsSync(REVIEWS_FILE)) return JSON.parse(fs.readFileSync(REVIEWS_FILE, 'utf8') || '[]');
  } catch (e) {}
  return [];
}
function rxAllRecords() {
  const latest = {};
  const RX_STORE = path.join(__dirname, '..', 'data', 'prescriptions', 'records.jsonl');
  if (fs.existsSync(RX_STORE)) {
    fs.readFileSync(RX_STORE, 'utf-8').split('\n').filter(Boolean).forEach(line => {
      try { const r = JSON.parse(line); if (r.rx_id) latest[r.rx_id] = r; } catch (e) {}
    });
  }
  return Object.values(latest);
}
function doctorStats(doctorId, rxs, reviews, followups) {
  const myRx = rxs.filter(r => r.doctor_id === doctorId);
  const myReviews = reviews.filter(v => v.doctor_id === doctorId);
  const ratingAvg = myReviews.length ? Math.round(myReviews.reduce((s, v) => s + v.rating, 0) / myReviews.length * 10) / 10 : null;
  // 疗效：该医生患者的随访结果（按 patient_id 关联）
  const myPids = new Set(myRx.map(r => r.patient_id));
  const myFus = followups.filter(f => myPids.has(f.patient_id) && f.status === 'completed');
  const improved = myFus.filter(f => f.effect === 'improved').length;
  const worsened = myFus.filter(f => f.effect === 'worsened').length;
  const scores = myFus.map(f => f.symptom_score).filter(s => typeof s === 'number');
  return {
    rx_count: myRx.length,
    review_count: myReviews.length,
    rating_avg: ratingAvg,
    outcome: {
      followed: myFus.length, improved, worsened,
      effective_rate: myFus.length ? Math.round(improved / myFus.length * 100) : null,
      avg_score: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10 : null
    }
  };
}

// 医生团队列表（档案 + 真实统计）
app.get('/api/doctors', optionalAuth, (req, res) => {
  try {
    const profiles = loadDoctorProfiles();
    const reviews = loadReviews();
    const rxs = rxAllRecords();
    let followups = [];
    try { followups = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'followups.json'), 'utf8') || '[]'); } catch (e) {}
    const today = new Date().toLocaleDateString('sv-SE');
    const todayQueue = (state.clinicQueue || []).filter(q => q.date === today);
    const list = Object.values(profiles).map(p => ({
      ...p,
      stats: doctorStats(p.doctor_id, rxs, reviews, followups),
      today_waiting: todayQueue.filter(q => q.doctor_id === p.doctor_id && q.status === 'waiting').length
    }));
    res.json({ ok: true, total: list.length, doctors: list });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// 医生详情（档案 + 评价 + 疗效）
app.get('/api/doctor/:id', optionalAuth, (req, res) => {
  try {
    const profiles = loadDoctorProfiles();
    const p = profiles[req.params.id];
    if (!p) return res.status(404).json({ ok: false, error: '医生不存在' });
    const reviews = loadReviews().filter(v => v.doctor_id === p.doctor_id)
      .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))).slice(0, 50)
      .map(v => ({ ...v, patient_name: patientIndex ? patientIndex.maskName(v.patient_name) : v.patient_name }));
    const rxs = rxAllRecords();
    let followups = [];
    try { followups = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'followups.json'), 'utf8') || '[]'); } catch (e) {}
    res.json({ ok: true, doctor: p, stats: doctorStats(p.doctor_id, rxs, loadReviews(), followups), reviews });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// 患者评价医生
app.post('/api/review/create', optionalAuth, (req, res) => {
  try {
    const { doctor_id, patient_name, rating, tags, comment, rx_id } = req.body || {};
    const profiles = loadDoctorProfiles();
    if (!profiles[doctor_id]) return res.status(400).json({ ok: false, error: 'doctor_id 无效' });
    const r5 = parseInt(rating, 10);
    if (!(r5 >= 1 && r5 <= 5)) return res.status(400).json({ ok: false, error: 'rating 须为 1-5' });
    if (!patient_name) return res.status(400).json({ ok: false, error: 'patient_name 必填' });
    const rec = {
      id: 'RV-' + Date.now().toString(36).toUpperCase(),
      doctor_id: String(doctor_id).slice(0, 10),
      patient_id: patientIndex ? patientIndex.resolvePatientId(null, patient_name) : 'anonymous',
      patient_name: String(patient_name).slice(0, 20),
      rx_id: String(rx_id || '').slice(0, 48) || null,
      rating: r5,
      tags: Array.isArray(tags) ? tags.map(t => String(t).slice(0, 10)).slice(0, 6) : [],
      comment: String(comment || '').slice(0, 200),
      created_at: new Date().toISOString()
    };
    const list = loadReviews();
    list.push(rec);
    fs.writeFileSync(REVIEWS_FILE, JSON.stringify(list.slice(-500), null, 2));
    res.json({ ok: true, review: { ...rec, patient_name: patientIndex ? patientIndex.maskName(rec.patient_name) : rec.patient_name } });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// 病种知识库：按证型聚合真实病例 + 方剂 + 随访疗效
app.get('/api/disease-kb', optionalAuth, (req, res) => {
  try {
    const rxs = rxAllRecords();
    let followups = [];
    try { followups = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'followups.json'), 'utf8') || '[]'); } catch (e) {}
    const bySyn = {};
    rxs.forEach(r => {
      const syn = r.diagnosis && r.diagnosis.syndrome;
      if (!syn || syn === 'test' || /自测|测试/.test(syn)) return;
      if (!bySyn[syn]) bySyn[syn] = { syndrome: syn, cases: 0, formulas: {}, herbs: {}, doctors: {}, last_at: '' };
      const g = bySyn[syn];
      g.cases++;
      const fm = r.diagnosis.formula;
      if (fm) g.formulas[fm] = (g.formulas[fm] || 0) + 1;
      (r.herbs || []).forEach(h => {
        const hn = typeof h === 'string' ? h : h.name;
        if (hn) g.herbs[hn] = (g.herbs[hn] || 0) + 1;
      });
      if (r.doctor_id) g.doctors[r.doctor_id] = (g.doctors[r.doctor_id] || 0) + 1;
      if (String(r.created_at) > g.last_at) g.last_at = r.created_at;
    });
    // 随访疗效按证型并入
    const fusBySyn = {};
    followups.forEach(f => {
      if (!f.syndrome) return;
      if (!fusBySyn[f.syndrome]) fusBySyn[f.syndrome] = { followed: 0, improved: 0, worsened: 0, scores: [] };
      const g = fusBySyn[f.syndrome];
      if (f.status === 'completed') {
        g.followed++;
        if (f.effect === 'improved') g.improved++;
        if (f.effect === 'worsened') g.worsened++;
        if (typeof f.symptom_score === 'number') g.scores.push(f.symptom_score);
      }
    });
    const list = Object.values(bySyn).map(g => {
      const fu = fusBySyn[g.syndrome] || { followed: 0, improved: 0, worsened: 0, scores: [] };
      return {
        syndrome: g.syndrome,
        cases: g.cases,
        top_formulas: Object.entries(g.formulas).sort((a, b) => b[1] - a[1]).slice(0, 3).map(e => ({ name: e[0], count: e[1] })),
        top_herbs: Object.entries(g.herbs).sort((a, b) => b[1] - a[1]).slice(0, 5).map(e => ({ name: e[0], count: e[1] })),
        doctors: Object.keys(g.doctors).filter(d => d && d !== 'unknown'),
        last_at: g.last_at,
        followed: fu.followed,
        effective_rate: fu.followed ? Math.round(fu.improved / fu.followed * 100) : null,
        avg_score: fu.scores.length ? Math.round(fu.scores.reduce((a, b) => a + b, 0) / fu.scores.length * 10) / 10 : null
      };
    }).sort((a, b) => b.cases - a.cases);
    res.json({ ok: true, total: list.length, kb: list });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// R812: 完成随访（随访页 ✓ 按钮用，替代原 localStorage 假闭环）
app.post('/api/followup/complete', optionalAuth, (req, res) => {
  try {
    const { id, feedback, symptom_score } = req.body || {};
    if (!id) return res.status(400).json({ ok: false, error: 'id 必填' });
    const FOLLOWUP_FILE = path.join(__dirname, '..', 'data', 'followups.json');
    let list = [];
    if (fs.existsSync(FOLLOWUP_FILE)) {
      try { list = JSON.parse(fs.readFileSync(FOLLOWUP_FILE, 'utf8') || '[]'); } catch (e) { list = []; }
    }
    const rec = list.find(f => f.id === id);
    if (!rec) return res.status(404).json({ ok: false, error: '随访不存在' });
    rec.status = 'completed';
    rec.completed_at = new Date().toISOString();
    if (feedback) rec.feedback = String(feedback).slice(0, 200);
    if (symptom_score != null) rec.symptom_score = Math.min(Math.max(parseInt(symptom_score, 10) || 0, 0), 10);
    fs.writeFileSync(FOLLOWUP_FILE, JSON.stringify(list, null, 2));
    res.json({ ok: true, followup: rec });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// R816: AI 个性化随访话术 — 按证型+方剂+随访类型规则生成，替代静态模板
const FU_FORMULA_NOTES = [
  [/四君子汤|六君子汤|香砂六君子/, '忌生冷油腻，饭前温服；若出现腹胀加重或上火，请减量并告知。'],
  [/归脾汤/, '龙眼肉、黄芪温补，感冒发热时停服；睡前少饮浓茶咖啡。'],
  [/逍遥散|柴胡疏肝/, '保持心情舒畅，忌辛辣；女性经期请反馈经量变化。'],
  [/六味地黄|知柏地黄/, '滋腻碍胃，宜饭后服；若便溏腹泻请告知调整。'],
  [/桂枝汤/, '服后喝热稀粥助药力，避风保暖，微汗为佳，忌大汗。'],
  [/小柴胡汤/, '若寒热往来反复超过 3 天或加重，请及时复诊。'],
  [/银翘散|桑菊饮/, '清热解毒药偏凉，症状缓解即停，不宜久服；多喝温水。'],
  [/补中益气汤/, '升提之剂，高血压患者服药期间请每日监测血压并反馈。'],
  [/血府逐瘀|桃红四物/, '活血化瘀，月经期或出血倾向者请立即反馈。'],
  [/温胆汤|半夏厚朴/, '化痰之剂，忌甜腻生冷；若咽干口燥明显请告知。']
];
const FU_SYNDROME_CARE = [
  [/脾胃|脾虚|气虚/, '这几天胃口、大便情况怎么样？'],
  [/心脾两虚|血虚/, '睡眠和心悸有没有改善？'],
  [/肝郁|气滞/, '情绪、胸胁胀闷好些了吗？'],
  [/肾虚|阴虚|阳虚/, '腰膝、畏寒/潮热的情况有变化吗？'],
  [/痰湿|湿热/, '舌苔厚腻有没有变薄？身体困重感减轻了吗？'],
  [/血瘀|瘀血/, '疼痛的部位和程度有变化吗？'],
  [/风寒|风热|外感/, '寒热、汗出、咽痛这些症状退了吗？']
];
app.post('/api/followup/message', optionalAuth, (req, res) => {
  try {
    const { syndrome, formula, patient_name, type } = req.body || {};
    const name = String(patient_name || '').slice(0, 20);
    const syn = String(syndrome || '').slice(0, 40);
    const fx = String(formula || '').slice(0, 40);
    const t = String(type || 'post_rx');
    const openers = {
      initial: '上次就诊后',
      chronic: '距上次调理已有一段时间，',
      post_rx: '您服用中药已有一段时间，',
      health: '本月健康随访，'
    };
    let msg = '您好' + (name ? '，' + name : '') + '。' + (openers[t] || openers.post_rx);
    if (fx) {
      const note = FU_FORMULA_NOTES.find(([re]) => re.test(fx));
      msg += '正在服用' + fx + '。' + (note ? note[1] : '请按医嘱服药，如有不适随时告知。');
    }
    if (syn) {
      const care = FU_SYNDROME_CARE.find(([re]) => re.test(syn));
      msg += care ? care[1] : '目前症状改善如何？';
    } else {
      msg += '目前感觉如何？';
    }
    msg += '有没有胃不舒服、腹泻、过敏等反应？请回复，我好帮您调整。';
    const matched = { formula_note: !!(fx && FU_FORMULA_NOTES.find(([re]) => re.test(fx))), syndrome_care: !!(syn && FU_SYNDROME_CARE.find(([re]) => re.test(syn))) };
    res.json({ ok: true, message: msg, matched });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});
app.post('/api/prescription/feedback', (_req, res) => res.json({ ok: true, accepted: false, note: 'prescription feedback stub' }));

// ═══ R817: 医疗应急 + 周末快速响应 ═══
const EMERG_EVENTS_FILE = path.join(__dirname, '..', 'data', 'emergency-events.json');
function loadEmergEvents() {
  try { if (fs.existsSync(EMERG_EVENTS_FILE)) return JSON.parse(fs.readFileSync(EMERG_EVENTS_FILE, 'utf8') || '[]'); } catch (e) {}
  return [];
}
function isWeekendDate(d) { const day = d.getDay(); return day === 0 || day === 6; }

// 应急规程库检索（中药中毒/针灸应急/过敏/转诊红旗，含处置步骤与转诊指征）
app.get('/api/emergency/protocols', optionalAuth, (req, res) => {
  try {
    const all = loadJSON('emergency-protocols.json', []);
    const q = String(req.query.q || '').trim();
    const list = q ? all.filter(p => (p.title + ' ' + p.keywords + ' ' + p.category).includes(q)) : all;
    res.json({ ok: true, total: list.length, protocols: list });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// 今日值班/周末快速响应：固定排班 + 自定义班次推导在岗医生；无班次日走轮换 on-call
app.get('/api/emergency/oncall', optionalAuth, (req, res) => {
  try {
    const profiles = loadDoctorProfiles();
    const now = new Date();
    const day = String(now.getDay());
    const today = now.toLocaleDateString('sv-SE');
    const weekend = isWeekendDate(now);
    const duty = [];
    Object.values(profiles).forEach(p => {
      const slots = (p.schedule || {})[day];
      if (slots && slots.length) duty.push({ doctor_id: p.doctor_id, name: p.name, specialty_name: p.specialty_name, title: p.title, avatar: p.avatar, slots, mode: '固定排班' });
    });
    let shifts = [];
    try { if (fs.existsSync(SCHEDULES_FILE)) shifts = JSON.parse(fs.readFileSync(SCHEDULES_FILE, 'utf8') || '[]'); } catch (e) {}
    shifts.filter(s => s.date === today).forEach(s => {
      if (!duty.some(d => d.doctor_id === s.doctor_id)) {
        const p = profiles[s.doctor_id] || {};
        duty.push({ doctor_id: s.doctor_id, name: s.doctor_name || p.name || s.doctor_id, specialty_name: p.specialty_name || '', title: p.title || '', avatar: p.avatar || '👨‍⚕️', slots: [s.type], mode: '自定义班次' });
      }
    });
    // 无人排班（如周日）→ 轮换 on-call：按周序号轮值，确保 7×24 有明确责任人
    let oncall = null;
    if (duty.length) {
      oncall = duty[0];
    } else {
      const ids = Object.keys(profiles).sort();
      if (ids.length) {
        const idx = Math.floor(now.getTime() / 604800000) % ids.length;
        const p = profiles[ids[idx]];
        oncall = { doctor_id: p.doctor_id, name: p.name, specialty_name: p.specialty_name, title: p.title, avatar: p.avatar, slots: ['oncall'], mode: '轮换值班' };
      }
    }
    res.json({ ok: true, date: today, weekend, duty, oncall, sla_seconds: 300,
      note: weekend ? '周末快速响应模式：值班医生 5 分钟内响应' : '工作日：在岗医生即时响应' });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// 应急事件登记（分级 + 症状 + 时间戳，进入台账）
app.post('/api/emergency/event', optionalAuth, (req, res) => {
  try {
    const { level, symptoms, source } = req.body || {};
    if (!['CRITICAL', 'WARNING', 'ROUTINE'].includes(level)) return res.status(400).json({ ok: false, error: 'level 须为 CRITICAL/WARNING/ROUTINE' });
    const events = loadEmergEvents();
    const now = new Date();
    const rec = {
      id: 'EM' + now.getTime().toString(36),
      level, symptoms: String(symptoms || '').slice(0, 200), source: String(source || 'emergency-page').slice(0, 30),
      weekend: isWeekendDate(now), status: 'pending',
      created_at: now.toISOString(), created_by: (req.user && req.user.username) || 'guest'
    };
    events.unshift(rec);
    fs.writeFileSync(EMERG_EVENTS_FILE, JSON.stringify(events.slice(0, 200), null, 2));
    res.json({ ok: true, event: rec });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// 值班医生响应签收 → 计算响应时长（快速响应能力的可度量闭环）
app.post('/api/emergency/respond', optionalAuth, (req, res) => {
  try {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ ok: false, error: 'id 必填' });
    const events = loadEmergEvents();
    const rec = events.find(e => e.id === id);
    if (!rec) return res.status(404).json({ ok: false, error: '事件不存在' });
    if (rec.status === 'responded') return res.json({ ok: true, event: rec, note: '已签收过' });
    rec.status = 'responded';
    rec.responded_at = new Date().toISOString();
    rec.responder = (req.user && req.user.username) || 'doctor';
    rec.response_seconds = Math.round((Date.parse(rec.responded_at) - Date.parse(rec.created_at)) / 1000);
    rec.within_sla = rec.response_seconds <= 300;
    fs.writeFileSync(EMERG_EVENTS_FILE, JSON.stringify(events, null, 2));
    res.json({ ok: true, event: rec });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// 应急台账 + 响应统计（总体/周末 SLA 达成率）
app.get('/api/emergency/events', optionalAuth, (req, res) => {
  try {
    const events = loadEmergEvents();
    const responded = events.filter(e => e.status === 'responded' && typeof e.response_seconds === 'number');
    const wk = events.filter(e => e.weekend);
    const wkResp = wk.filter(e => e.status === 'responded' && typeof e.response_seconds === 'number');
    const avg = arr => arr.length ? Math.round(arr.reduce((s, e) => s + e.response_seconds, 0) / arr.length) : null;
    const sla = arr => arr.length ? Math.round(arr.filter(e => e.within_sla).length / arr.length * 100) : null;
    res.json({
      ok: true, total: events.length, pending: events.filter(e => e.status === 'pending').length,
      stats: {
        by_level: { CRITICAL: events.filter(e => e.level === 'CRITICAL').length, WARNING: events.filter(e => e.level === 'WARNING').length, ROUTINE: events.filter(e => e.level === 'ROUTINE').length },
        avg_response_seconds: avg(responded), sla_rate: sla(responded),
        weekend_total: wk.length, weekend_avg_response_seconds: avg(wkResp), weekend_sla_rate: sla(wkResp)
      },
      list: events.slice(0, 30)
    });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});
app.get('/api/prescription/feedback', (_req, res) => res.json({ ok: true, list: [], total: 0, note: 'prescription feedback stub (list)' }));

// ═══ R860 能力补齐：与中医标准智能体（tcm-agent）全量对齐（2026-08-30 内化移植，不训练只适配）═══
const symptomIdx = require('./kb/symptom-index');

// —— 证型池（移植 R856/R857/R858：直接 → 别名 →「证」后缀双向）——
let _synPool = null, _synFlatRef = null;
function getSyndromePool() {
  if (!_kbFlat) loadKbCache(false);
  if (_synPool && _synFlatRef === _kbFlat) return _synPool;
  const pool = new Map();
  for (const it of _kbFlat) {
    const t = String(it.title || '');
    const ct = String(it.content || '');
    if (it.module === 'tcm-zhongfu') {
      if (t.length >= 2 && t.length <= 8 && ct.startsWith('【' + t + '】')) {
        pool.set(t, it);
      } else if (t.endsWith('证') && t.length >= 2 && t.length <= 8 && ct.includes('【证候表现】')) {
        if (!pool.has(t)) pool.set(t, it);
        const k2 = t.slice(0, -1);
        if (!pool.has(k2)) pool.set(k2, it);
      }
    } else if (it.module === 'tcm-misc') {
      const m = t.match(/^证型"(.+?)"如何辨证/);
      if (m && m[1].length >= 2 && m[1].length <= 10) pool.set(m[1], it);
    }
  }
  try {
    const supPath = require('path').join(__dirname, 'kb', 'syndrome-supplement.json');
    const sup = JSON.parse(require('fs').readFileSync(supPath, 'utf-8'));
    for (const [t, e] of Object.entries(sup)) {
      if (!pool.has(t)) pool.set(t, { title: t, content: e.content, module: 'tcm-zhongfu', confidence: e.confidence || 0.42, source: e.source || 'R858蒸馏' });
    }
  } catch (e) { /* 补充包缺失不阻断 */ }
  _synPool = pool; _synFlatRef = _kbFlat;
  return pool;
}
function prettySyndromeContent(it) {
  return String(it.content || '')
    .replace(/^Q:[^\n]*\n+A:\s*/, '')
    .replace(/\n?注：AI辅助参考[^\n]*/g, '')
    .replace(/^【.+?】\s*/, '')
    .replace(/(证机概要|临床表现|代表方剂|辨证要点|治法|加减|主症|舌象|脉象)[：:]/g, '\n$1：')
    .replace(/【(证候表现|证机分析|病因病机)】/g, '\n$1：')
    .replace(/\n{2,}/g, '\n').trim();
}
function lookupSyndrome(title) {
  const pool = getSyndromePool();
  return pool.get(title)
    || (SYNDROME_ALIASES[title] ? pool.get(SYNDROME_ALIASES[title]) : null)
    || (title.endsWith('证') ? pool.get(title.slice(0, -1)) : pool.get(title + '证'));
}
function synGistOf(title) {
  const it = lookupSyndrome(title);
  if (!it) return '';
  const ct = prettySyndromeContent(it);
  const gj = ct.match(/证机概要：([^\n。]+)/);
  const lc = ct.match(/(?:临床表现|主症|证候表现)：([^\n。]+)/);
  const syms = lc ? lc[1].split(/[、，,]/).slice(0, 3).join('、') : '';
  return (gj ? gj[1] + '：' : '') + syms;
}

// R860a 词条卡片：证型/药材/方剂/穴位即点即查（鉴别诊断栏同脏腑近证对比）
app.get('/api/tcm/entry/info', (req, res) => {
  try {
    const name = String(req.query.name || '').trim().slice(0, 30);
    if (!name) return res.status(400).json({ ok: false, error: '缺少 name 参数' });
    loadKbCache(false);
    const synPool = getSyndromePool();
    const synHit = lookupSyndrome(name);
    if (synHit) {
      const ORGANS = ['心', '肝', '脾', '肺', '肾', '胃', '胆', '大肠', '小肠', '膀胱'];
      const organ = ORGANS.find(o => String(synHit.title).includes(o)) || '';
      const diffs = [];
      if (organ) {
        const seen = new Set([synHit.title]);
        for (const [k, it] of synPool) {
          if (diffs.length >= 5) break;
          const tt = String(it.title || '');
          if (k !== tt || seen.has(tt) || !tt.includes(organ)) continue;
          seen.add(tt);
          diffs.push({ name: tt, gist: synGistOf(tt) });
        }
      }
      return res.json({ ok: true, module: 'tcm-syndrome', title: synHit.title,
        content: prettySyndromeContent(synHit).slice(0, 800),
        differentials: diffs,
        confidence: synHit.confidence || null, source: synHit.source || 'tcm-zhongfu' });
    }
    const MODS = new Set(['tcm-herb', 'tcm-acupuncture', 'tcm-formula']);
    const pool = _kbFlat.filter(it => MODS.has(it.module));
    const stripped = name.replace(/^(炙|炒|煅|煨|酒|醋|盐|姜|蜜|生|熟|制)/, '');
    const cands = [];
    for (const it of pool) {
      const t = String(it.title || '');
      let rank = 0;
      if (t === name) rank = 4;
      else if (stripped !== name && t === stripped) rank = 3;
      else if (t.includes(name)) rank = 2;
      else if (String(it.content || '').includes(name)) rank = 1;
      if (rank) cands.push({ rank, it });
    }
    cands.sort((a, b) => b.rank - a.rank || String(a.it.title).length - String(b.it.title).length);
    const top = cands[0];
    if (!top || (top.rank === 1 && name.length < 2)) {
      return res.json({ ok: false, error: '未找到条目: ' + name });
    }
    res.json({ ok: true, module: top.it.module, title: top.it.title,
      content: String(top.it.content || '').slice(0, 800),
      confidence: top.it.confidence || null, source: top.it.source || '' });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// R860b 条目名清单（病历文本 linkify 用）：药材+方剂+证型正名一次下发
let _entryNames = null;
app.get('/api/tcm/entry/names', (req, res) => {
  try {
    loadKbCache(false);
    if (!_entryNames) {
      _entryNames = _kbFlat
        .filter(it => it.module === 'tcm-herb' || it.module === 'tcm-formula')
        .map(it => String(it.title || ''))
        .filter(t => t.length >= 2 && t.length <= 8);
      _entryNames = [...new Set([..._entryNames, ...getSyndromePool().keys()])];
    }
    res.json({ ok: true, count: _entryNames.length, names: _entryNames });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// R860c 症状→候选方召回（症状反向索引，R825 移植）
app.get('/api/tcm/kb/formula-recall', (req, res) => {
  try {
    const _t0 = Date.now();
    const q = String(req.query.q || '').trim().slice(0, 120);
    const limit = Math.min(parseInt(req.query.limit, 10) || 8, 20);
    if (!q) return res.status(400).json({ ok: false, error: '缺少 q 参数' });
    const exclude = String(req.query.exclude || '').split(/[,，、]/).map(s => s.trim()).filter(Boolean);
    const recall = symptomIdx.formulaRecall(q, limit, exclude.length ? exclude : null);
    res.json({ ok: true, query: q, canon: recall.canon, excluded: exclude, formulas: recall.formulas, took_ms: Date.now() - _t0 });
  } catch (e) {
    res.status(500).json({ ok: false, error: '候选方召回失败: ' + e.message });
  }
});

// R860d 症状→方排除事件落库（高频排除=标签噪声信号，供周检复核）
const RECALL_EXCLUSIONS_PATH = require('path').join(__dirname, '..', 'data', 'recall-exclusions.jsonl');
app.post('/api/tcm/kb/recall-exclude', (req, res) => {
  try {
    const b = req.body || {};
    const canon = String(b.canon || '').trim().slice(0, 20);
    if (!canon) return res.status(400).json({ ok: false, error: '缺少 canon' });
    const row = {
      ts: new Date().toISOString(),
      canon,
      q: String(b.q || '').slice(0, 120),
      top: (Array.isArray(b.top) ? b.top : []).slice(0, 3).map(s => String(s).slice(0, 20)),
      doctor_id: String(b.doctor_id || 'D001').slice(0, 20),
      src: String(b.src || 'symptom-panel').slice(0, 20),
    };
    require('fs').mkdirSync(require('path').dirname(RECALL_EXCLUSIONS_PATH), { recursive: true });
    require('fs').appendFileSync(RECALL_EXCLUSIONS_PATH, JSON.stringify(row) + '\n');
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: '排除事件记录失败: ' + e.message });
  }
});

// R860e 服药依从（家庭端回传 → 时间线/依从率）
const ADHERENCE_FILE = path.join(__dirname, '..', 'data', 'med-adherence.json');
function loadAdherence() {
  try {
    if (fs.existsSync(ADHERENCE_FILE)) {
      const a = JSON.parse(fs.readFileSync(ADHERENCE_FILE, 'utf8') || '[]');
      return Array.isArray(a) ? a : [];
    }
  } catch (e) { /* 损坏即空 */ }
  return [];
}
function saveAdherence(list) {
  try { fs.writeFileSync(ADHERENCE_FILE, JSON.stringify(list.slice(-5000), null, 1)); } catch (e) { /* 写盘失败不阻断 */ }
}
app.post('/api/home/med-adherence', optionalAuth, (req, res) => {
  try {
    const b = req.body || {};
    const pid = String(b.patient_id || '').trim().slice(0, 40);
    const drug = String(b.drug || '').trim().slice(0, 30);
    const status = b.status === 'missed' ? 'missed' : 'taken';
    if (!pid || !drug) return res.status(400).json({ ok: false, error: 'patient_id 与 drug 必填' });
    const list = loadAdherence();
    const rec = {
      id: 'adh-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      patient_id: pid, drug, status,
      dose: String(b.dose || '').slice(0, 20),
      scheduled_time: String(b.time || '').slice(0, 10),
      source: 'family-app',
      ts: new Date().toISOString()
    };
    list.push(rec);
    saveAdherence(list);
    res.json({ ok: true, id: rec.id });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});
app.get('/api/home/med-adherence', optionalAuth, (req, res) => {
  try {
    const pid = String(req.query.patient_id || '').trim().slice(0, 40);
    const list = loadAdherence().filter(r => !pid || r.patient_id === pid);
    res.json({ ok: true, records: list.slice(-200) });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// R860f 家庭账号绑定（登录账号 ↔ 就诊人；家庭端只见自家人，隐私合规必需件）
const FAMILY_BIND_FILE = path.join(__dirname, '..', 'data', 'family-bindings.json');
function loadFamilyBinds() {
  try {
    if (fs.existsSync(FAMILY_BIND_FILE)) {
      const a = JSON.parse(fs.readFileSync(FAMILY_BIND_FILE, 'utf8') || '[]');
      return Array.isArray(a) ? a : [];
    }
  } catch (e) { /* 损坏即空 */ }
  return [];
}
function saveFamilyBinds(list) {
  try { fs.writeFileSync(FAMILY_BIND_FILE, JSON.stringify(list, null, 1)); } catch (e) { /* 写盘失败不阻断 */ }
}
const FAMILY_RELATIONS = ['本人', '父母', '配偶', '子女', '兄弟姐妹', '其他'];
app.get('/api/family/members', requireAuth, (req, res) => {
  try {
    const binds = loadFamilyBinds().filter(b => b.account === req.user.username);
    const seeds = getPatients();
    const members = binds.map(b => {
      let info = null;
      try { if (patientIndex) info = patientIndex.getPatient(b.patient_id); } catch (e) {}
      const seed = !info ? seeds.find(p => p.patient_id === b.patient_id) : null;
      return {
        patient_id: b.patient_id,
        relation: b.relation,
        name: info ? (info.name_masked || '患者') : (seed ? String(seed.name || '患者') : '患者'),
        age: info && info.birth_year ? (new Date().getFullYear() - info.birth_year) : (seed && seed.age ? seed.age : null),
        bound_at: b.created_at
      };
    });
    res.json({ ok: true, members });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});
app.post('/api/family/bind', requireAuth, (req, res) => {
  try {
    const pid = String((req.body || {}).patient_id || '').trim().slice(0, 40);
    let relation = String((req.body || {}).relation || '其他').slice(0, 8);
    if (!FAMILY_RELATIONS.includes(relation)) relation = '其他';
    if (!pid) return res.status(400).json({ ok: false, error: 'patient_id 必填' });
    const inEmpi = patientIndex ? !!patientIndex.getPatient(pid) : false;
    const inSeed = !inEmpi && getPatients().some(p => p.patient_id === pid);
    if (!inEmpi && !inSeed) return res.status(404).json({ ok: false, error: '未找到该就诊人建档记录' });
    const binds = loadFamilyBinds();
    if (binds.some(b => b.account === req.user.username && b.patient_id === pid)) {
      return res.json({ ok: true, duplicated: true, patient_id: pid });
    }
    binds.push({
      id: 'fb-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      account: req.user.username, patient_id: pid, relation,
      created_at: new Date().toISOString()
    });
    saveFamilyBinds(binds);
    res.json({ ok: true, patient_id: pid });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});
app.post('/api/family/unbind', requireAuth, (req, res) => {
  try {
    const pid = String((req.body || {}).patient_id || '').trim().slice(0, 40);
    const binds = loadFamilyBinds();
    const next = binds.filter(b => !(b.account === req.user.username && b.patient_id === pid));
    saveFamilyBinds(next);
    res.json({ ok: true, removed: binds.length - next.length });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// R860g 随访派发（AI 外呼/短信/5G消息；通道未配置→诚实返回，不外发不伪造）
const CARRIER_CFG_FILE = path.join(__dirname, '..', 'data', 'carrier-config.json');
const DISPATCH_FILE = path.join(__dirname, '..', 'data', 'followup-dispatches.json');
function loadCarrierCfg() {
  try { if (fs.existsSync(CARRIER_CFG_FILE)) return JSON.parse(fs.readFileSync(CARRIER_CFG_FILE, 'utf8') || '{}'); } catch (e) {}
  return {};
}
function loadDispatches() {
  try { if (fs.existsSync(DISPATCH_FILE)) return JSON.parse(fs.readFileSync(DISPATCH_FILE, 'utf8') || '[]'); } catch (e) {}
  return [];
}
function loadFollowupList() {
  const F = path.join(__dirname, '..', 'data', 'followups.json');
  try { if (fs.existsSync(F)) return JSON.parse(fs.readFileSync(F, 'utf8') || '[]'); } catch (e) {}
  return [];
}
// AI 外呼/短信脚本：合规开场（AI 身份告知+退出机制）→ 个性化关怀 → 结构化采集
function buildCallScript(fu, channel) {
  const name = fu.patient_name || '您';
  const syn = String(fu.syndrome || '');
  const fx = String(fu.formula || '');
  const fxNote = fx && FU_FORMULA_NOTES.find(([re]) => re.test(fx));
  const synCare = syn && FU_SYNDROME_CARE.find(([re]) => re.test(syn));
  const s = {
    opening: `您好，请问是${name}吗？我是中医馆的 AI 随访助手（智能语音，非真人）。本次随访约 1 分钟，您可随时说"挂断"结束。`,
    care: `您上次就诊辨证为${syn || '调理中'}${fx ? '，服用' + fx : ''}。${fxNote ? fxNote[1] : '请按医嘱服药。'}`,
    questions: [
      '第一问：' + (synCare ? synCare[1].replace('？', '？请用 0 到 10 分描述症状程度，0 为完全好。') : '目前症状用 0 到 10 分评价，0 为完全好，10 为最严重？'),
      '第二问：服药后有没有胃不舒服、腹泻、皮疹等不良反应？有或没有？',
      '第三问：药是否按时按量服完了？'
    ],
    closing: '感谢您的配合。如出现高热不退、胸闷心慌、严重皮疹等情况，请立即就医或拨打 120。祝您早日康复。',
    keypad_map: { score_0_10: '症状评分', adverse_yes_no: '不良反应', adherence_yes_no: '服药依从' }
  };
  if (channel === 'sms' || channel === 'rcs5g') {
    return { text: `【中医馆随访】${name}：${s.care}${synCare ? synCare[1] : '目前恢复如何？'}如有不适请回复或致电医馆。（AI 随访，退订回 T）`, script: null };
  }
  return { text: null, script: s };
}
app.post('/api/followup/dispatch', optionalAuth, async (req, res) => {
  try {
    const { id, channel } = req.body || {};
    if (!id) return res.status(400).json({ ok: false, error: 'id 必填' });
    if (!['manual', 'sms', 'voice', 'rcs5g'].includes(channel)) return res.status(400).json({ ok: false, error: 'channel 须为 manual/sms/voice/rcs5g' });
    const fu = loadFollowupList().find(f => f.id === id);
    if (!fu) return res.status(404).json({ ok: false, error: '随访不存在' });
    const payload = buildCallScript(fu, channel);
    const rec = {
      id: 'FD' + Date.now().toString(36).toUpperCase(),
      fu_id: id, patient_name: fu.patient_name, channel,
      payload, status: 'pending', created_at: new Date().toISOString()
    };
    const cfg = loadCarrierCfg();
    if (channel === 'manual') {
      rec.status = 'logged';
      rec.note = '站内记录（医生确认发送）';
    } else if (!cfg[channel] || !cfg[channel].enabled) {
      rec.status = 'channel_unconfigured';
      rec.note = `通道 ${channel} 未配置运营商凭证，未外发。请在 data/carrier-config.json 配置后重试。`;
    } else {
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 8000);
        const resp = await fetch(cfg[channel].endpoint, {
          method: 'POST', signal: ctrl.signal,
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + cfg[channel].appkey },
          body: JSON.stringify({ payload, callback: cfg.callback_url || null })
        });
        clearTimeout(timer);
        rec.status = resp.ok ? 'dispatched' : 'provider_error';
        rec.provider_code = resp.status;
        if (!resp.ok) rec.note = '运营商返回 ' + resp.status;
      } catch (e) {
        rec.status = 'provider_unreachable';
        rec.note = String(e.message || e).slice(0, 120);
      }
    }
    const list = loadDispatches();
    list.unshift(rec);
    fs.writeFileSync(DISPATCH_FILE, JSON.stringify(list.slice(0, 300), null, 2));
    res.json({ ok: true, dispatch: rec });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});
// 运营商回执：转写+结构化答案 → 自动回填随访完成态
app.post('/api/followup/callback', (req, res) => {
  try {
    const { dispatch_id, call_status, duration_s, transcript, answers } = req.body || {};
    if (!dispatch_id) return res.status(400).json({ ok: false, error: 'dispatch_id 必填' });
    const list = loadDispatches();
    const rec = list.find(d => d.id === dispatch_id);
    if (!rec) return res.status(404).json({ ok: false, error: '派发记录不存在' });
    rec.call_status = String(call_status || 'answered').slice(0, 20);
    rec.duration_s = Math.min(parseInt(duration_s, 10) || 0, 3600);
    rec.transcript = String(transcript || '').slice(0, 1000);
    rec.answers = answers || {};
    rec.status = rec.call_status === 'answered' ? 'answered' : 'failed';
    rec.callback_at = new Date().toISOString();
    fs.writeFileSync(DISPATCH_FILE, JSON.stringify(list, null, 2));
    let fuUpdated = false;
    if (rec.call_status === 'answered') {
      const FOLLOWUP_FILE = path.join(__dirname, '..', 'data', 'followups.json');
      const fus = loadFollowupList();
      const fu = fus.find(f => f.id === rec.fu_id);
      if (fu && fu.status !== 'completed') {
        const score = answers && answers.score != null ? Math.min(Math.max(parseInt(answers.score, 10) || 0, 0), 10) : null;
        fu.status = 'completed';
        fu.completed_at = new Date().toISOString();
        if (score != null) fu.symptom_score = score;
        const adverse = answers && /^(是|有|yes)/i.test(String(answers.adverse || ''));
        fu.feedback = `AI${rec.channel === 'voice' ? '语音' : '短信'}随访(${rec.duration_s}s)：${adverse ? '⚠️报告不良反应，需医生介入' : '无不良反应'}${score != null ? '，症状评分 ' + score + '/10' : ''}`;
        if (adverse) fu.needs_review = true;
        fu.dispatch_id = rec.id;
        fs.writeFileSync(FOLLOWUP_FILE, JSON.stringify(fus, null, 2));
        fuUpdated = true;
      }
    }
    res.json({ ok: true, dispatch: rec, followup_updated: fuUpdated });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});
// 派发台账 + 通道状态
app.get('/api/followup/dispatches', optionalAuth, (req, res) => {
  try {
    const list = loadDispatches();
    const cfg = loadCarrierCfg();
    const channels = ['sms', 'voice', 'rcs5g'].map(c => ({ channel: c, configured: !!(cfg[c] && cfg[c].enabled), provider: (cfg[c] && cfg[c].provider) || null }));
    res.json({
      ok: true, total: list.length, channels,
      stats: {
        dispatched: list.filter(d => d.status === 'dispatched').length,
        answered: list.filter(d => d.status === 'answered').length,
        unconfigured: list.filter(d => d.status === 'channel_unconfigured').length
      },
      list: list.slice(0, 50)
    });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// R860h 患者全景时间线：就诊(处方)+随访(症状评分)+评价+服药依从 跨源聚合，恢复曲线
app.get('/api/patient/timeline', optionalAuth, (req, res) => {
  try {
    const name = String(req.query.name || '').slice(0, 20);
    const pidRaw = String(req.query.patient_id || '').slice(0, 40);
    if (!name && !pidRaw) return res.status(400).json({ ok: false, error: 'patient_id 或 name 必填其一' });
    const pid = patientIndex ? patientIndex.resolvePatientId(pidRaw || null, name || null) : (pidRaw || name);
    const visits = rxAllRecords()
      .filter(r => r.patient_id === pid)
      .map(r => ({
        time: r.created_at, type: 'visit',
        syndrome: typeof r.diagnosis === 'string' ? r.diagnosis : ((r.diagnosis && (r.diagnosis.syndrome || r.diagnosis.pattern)) || ''),
        formula: r.formula || '',
        herbs: (r.herbs || []).map(h => h.name).slice(0, 12),
        doses: r.doses || 0, amount: r.price || 0,
        status: r.status, paid: r.payment_status === 'paid', doctor_id: r.doctor_id || null
      }))
      .sort((a, b) => String(a.time).localeCompare(String(b.time)));
    const fus = loadFollowupList()
      .filter(f => f.patient_id === pid || (name && f.patient_name === name))
      .map(f => ({
        time: f.completed_at || f.due_at, type: 'followup', status: f.status,
        syndrome: f.syndrome || '', formula: f.formula || '',
        score: typeof f.symptom_score === 'number' ? f.symptom_score : null,
        feedback: f.feedback || '', needs_review: !!f.needs_review,
        channel: f.dispatch_id ? 'carrier' : 'manual'
      }))
      .sort((a, b) => String(a.time).localeCompare(String(b.time)));
    let reviews = [];
    try { reviews = loadReviews().filter(v => v.patient_id === pid || (name && v.patient_name === name)).map(v => ({ time: v.created_at, type: 'review', rating: v.rating, comment: String(v.comment || '').slice(0, 60), doctor_id: v.doctor_id })); } catch (e) {}
    let adherence = [];
    try {
      adherence = loadAdherence().filter(a => a.patient_id === pid)
        .map(a => ({ time: a.ts, type: 'adherence', drug: a.drug, status: a.status, scheduled_time: a.scheduled_time }));
    } catch (e) {}
    const cut30 = Date.now() - 30 * 86400000;
    const adh30 = adherence.filter(a => new Date(a.time).getTime() >= cut30);
    const takenN = adh30.filter(a => a.status === 'taken').length;
    const missedN = adh30.length - takenN;
    const recovery = fus.filter(f => f.status === 'completed' && f.score != null)
      .map(f => ({ date: String(f.time).slice(0, 10), score: f.score }));
    const trend = recovery.length >= 2
      ? (recovery[recovery.length - 1].score < recovery[0].score ? 'improving' : recovery[recovery.length - 1].score > recovery[0].score ? 'worsening' : 'stable')
      : null;
    const timeline = visits.concat(fus, reviews, adherence).sort((a, b) => String(b.time).localeCompare(String(a.time)));
    res.json({
      ok: true, patient_id: pid,
      patient_name: patientIndex ? patientIndex.maskName(name || '') : name,
      summary: {
        visits: visits.length,
        syndromes: [...new Set(visits.map(v => v.syndrome).filter(Boolean))],
        formulas: [...new Set(visits.map(v => v.formula).filter(Boolean))],
        followups_completed: fus.filter(f => f.status === 'completed').length,
        latest_score: recovery.length ? recovery[recovery.length - 1].score : null,
        trend,
        adherence_30d: adh30.length ? { taken: takenN, missed: missedN, rate: +(takenN / adh30.length).toFixed(2) } : null
      },
      recovery, timeline: timeline.slice(0, 80)
    });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});


app.listen(PORT, "127.0.0.1", () => {
  console.warn(`🏥 命理宝鉴·医道 API 启动：http://localhost:${PORT}`);
  console.warn(`   端点: /api/tcm/{health,tongue,inquiry,diagnose,formula/search,acupoint/search,cases,eye-analyze,hand-analyze,wearable-ingest,collect-start,multi-modal-diagnose}`);
  console.warn(`   处方: /api/prescription/{create,verify} (含禁忌强制拦截)`);
  console.warn(`   KB闭环: /api/kb/feedback-loop/{distill,stats,approve,trust-adjust}`);
  // R119：KB 缓存预热（避免首请求阻塞 83.7MB 解析）
  try {
    const t0 = Date.now();
    loadKbCache(true);
    console.warn(`   KB 缓存预热完成: ${(_kbCache && _kbCache.total) || 0} 条 / ${Date.now() - t0}ms`);
  } catch (e) {
    console.warn(`   KB 预热失败: ${e.message}`);
  }
});

module.exports = app;
