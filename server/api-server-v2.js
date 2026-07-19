// ═══ 命理宝鉴 · 后端API服务 v2 ═══
// 修复：P0安全修复（API密钥移后端+AES加密+CORS+无认证接口+超管手机号）
const express = require('express');
const cors = require('cors');
const { DatabaseSync } = require('node:sqlite');
const sec = require('./security-v2.js');
const rbac = require('./rbac-middleware.js');
const syncRoutes = require('./sync-api');
const distillationRoutes = require('./distillation-routes.js');
const caseQuality = require('./case-quality.js');
const { KB_LEVELS } = require('./kb-config.js');
const crypto = require('crypto');

const app = express();
const PORT = parseInt(process.env.API_PORT || '8920');

// === CORS 白名单 ===
const CORS_ORIGINS = (process.env.CORS_ORIGINS || 'http://127.0.0.1:8900,http://localhost:8900,https://sgmt-taojing.github.io').split(',');
app.use(cors({
  origin(origin, callback) {
    // 允许同源请求（无Origin头）和白名单域
    if (!origin || CORS_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, false); // 静默拒绝，不暴露CORS策略
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400
}));

app.use(express.json({ limit: '10mb' }));

// === 安全HTTP头 ===
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});

// === 全局速率限制 ===
const globalRateLimit = new Map();
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    const ip = req.ip || req.connection.remoteAddress;
    const key = 'global_' + ip;
    const now = Date.now();
    if (!globalRateLimit.has(key)) {
      globalRateLimit.set(key, { count: 1, resetAt: now + 60000 });
    } else {
      const record = globalRateLimit.get(key);
      if (now > record.resetAt) {
        record.count = 1;
        record.resetAt = now + 60000;
      } else {
        record.count++;
        if (record.count > 120) { // 每分钟120次
          return res.status(429).json({ error: 'RATE_LIMITED', message: '请求过于频繁，请稍后再试' });
        }
      }
    }
  }
  next();
});

// === 数据库初始化 ===
const db = new DatabaseSync('server/database/yidao.db');

// 初始化RBAC相关表
function initRBACTables() {
  db.exec(`
    -- 角色表
    CREATE TABLE IF NOT EXISTS user_roles (
      user_id INTEGER NOT NULL,
      role TEXT NOT NULL,
      assigned_by INTEGER,
      assigned_at TEXT DEFAULT (datetime('now','localtime')),
      PRIMARY KEY (user_id, role)
    );
    
    -- 大师案例库
    CREATE TABLE IF NOT EXISTS master_cases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_uuid TEXT UNIQUE NOT NULL,
      case_number TEXT,
      master_id INTEGER NOT NULL,
      patient_id INTEGER,
      related_case_id INTEGER,
      status TEXT DEFAULT 'draft',
      
      -- 排盘数据（加密）
      bazi_chart TEXT,
      wuxing_summary TEXT,
      
      -- 症状与体质
      symptoms TEXT,
      constitution TEXT,
      
      -- 大师分析（加密）
      master_analysis TEXT,
      analysis_summary TEXT,
      medical_translation TEXT,
      
      -- 医生审核
      doctor_diagnosis TEXT,
      review_status TEXT,
      review_comment TEXT,
      reviewer_id INTEGER,
      reviewed_at TEXT,
      
      -- 最终方案
      final_plan TEXT,
      
      -- 质量标记
      quality_score INTEGER DEFAULT 0,
      is_high_quality INTEGER DEFAULT 0,
      effectiveness_rating INTEGER DEFAULT 0,
      
      created_at TEXT DEFAULT (datetime('now','localtime')),
      submitted_at TEXT,
      completed_at TEXT,
      archived_at TEXT
    );
    
    -- 案例版本历史
    CREATE TABLE IF NOT EXISTS master_case_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER NOT NULL,
      version_type TEXT NOT NULL,
      version_number INTEGER NOT NULL,
      content TEXT NOT NULL,
      content_hash TEXT NOT NULL,
      created_by INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );
    
    -- 案例讨论
    CREATE TABLE IF NOT EXISTS case_discussions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER NOT NULL,
      author_id INTEGER NOT NULL,
      author_role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );
    
    -- 病患病例（平台B）
    CREATE TABLE IF NOT EXISTS medical_cases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      symptoms TEXT NOT NULL,
      constitution TEXT,
      status TEXT DEFAULT 'pending_master',
      assigned_master_id INTEGER,
      assigned_doctor_id INTEGER,
      master_case_id INTEGER,
      
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    );
    
    -- 养生报告（推送给病患）
    CREATE TABLE IF NOT EXISTS tcm_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER NOT NULL,
      patient_id INTEGER NOT NULL,
      doctor_id INTEGER NOT NULL,
      report_text TEXT NOT NULL,
      filtered_text TEXT,
      pushed_at TEXT DEFAULT (datetime('now','localtime')),
      read_at TEXT
    );
    
    -- 审核流程日志
    CREATE TABLE IF NOT EXISTS case_review_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      actor_id INTEGER NOT NULL,
      actor_role TEXT NOT NULL,
      detail TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );
    
    -- 知识库版本管理
    CREATE TABLE IF NOT EXISTS kb_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kb_file TEXT NOT NULL,
      version TEXT NOT NULL,
      snapshot TEXT NOT NULL,
      diff_summary TEXT,
      distill_batch TEXT,
      created_by INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      activated_at TEXT
    );
    
    -- 蒸馏批次
    CREATE TABLE IF NOT EXISTS distillation_batches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batch_id TEXT UNIQUE NOT NULL,
      case_ids TEXT NOT NULL,
      extracted_patterns TEXT,
      confidence_scores TEXT,
      verified_by_master INTEGER,
      verified_by_doctor INTEGER,
      verified_by_admin INTEGER,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now','localtime')),
      completed_at TEXT
    );
  `);
  
  // 迁移旧用户：给现有用户分配free角色
  const usersWithoutRoles = db.prepare(`
    SELECT u.id FROM users u 
    WHERE NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id)
  `).all();
  
  for (const u of usersWithoutRoles) {
    db.prepare('INSERT OR IGNORE INTO user_roles (user_id, role) VALUES (?, ?)').run(u.id, 'free');
    // 超管分配super_admin
    const user = db.prepare('SELECT is_super FROM users WHERE id = ?').get(u.id);
    if (user && user.is_super) {
      db.prepare('INSERT OR IGNORE INTO user_roles (user_id, role) VALUES (?, ?)').run(u.id, 'super_admin');
    }
  }
}

initRBACTables();

// ============================
// 认证中间件（使用RBAC版）
// ============================
const auth = rbac.auth;
const adminAuth = rbac.adminAuth;
const requirePermission = rbac.requirePermission;

// ============================
// AI API 代理（密钥不再暴露在前端）
// ============================
const AI_API_BASE = process.env.AI_API_BASE || 'https://api.g2claw.com';
const AI_API_KEY = process.env.G2CLAW_API_KEY || '';

app.post('/api/ai/chat', auth, async (req, res) => {
  const messages = req.body.messages;
  const model = req.body.model || 'auto';
  
  if (!messages || !Array.isArray(messages)) {
    return res.json({ error: '参数错误' });
  }
  
  if (!AI_API_KEY) {
    return res.json({ error: 'AI服务未配置' });
  }
  
  // 速率限制
  if (!sec.rateLimit('ai_chat_' + req.userId, 20, 60000)) {
    return res.status(429).json({ error: 'RATE_LIMITED', message: '请求过于频繁' });
  }
  
  try {
    const response = await fetch(AI_API_BASE + '/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + AI_API_KEY
      },
      body: JSON.stringify({ model, messages, max_tokens: 4096 })
    });
    
    const data = await response.json();
    res.json(data);
  } catch (e) {
    console.error('AI API错误:', e.message);
    res.json({ error: 'AI服务暂时不可用' });
  }
});

// ============================
// 用户接口
// ============================

// 注册/登录（手机号）
app.post('/api/user/login', (req, res) => {
  let phone = sec.sanitizeInput(req.body.phone);
  if (!phone || phone.length < 11) return res.json({ error: '请输入正确的手机号' });
  
  if (!sec.rateLimit('login_' + phone, 5, 60000)) {
    return res.json({ error: '请求过于频繁，请稍后再试' });
  }
  
  const phoneHash = sec.hashPhone(phone);
  let user = db.prepare('SELECT * FROM users WHERE phone_hash = ?').get(phoneHash);
  
  if (!user) {
    db.prepare('INSERT INTO users (phone, phone_hash, follow_date) VALUES (?, ?, ?)')
      .run(sec.encrypt(phone), phoneHash, new Date().toISOString().slice(0,10));
    user = db.prepare('SELECT * FROM users WHERE phone_hash = ?').get(phoneHash);
    db.prepare('INSERT INTO user_points (user_id) VALUES (?)').run(user.id);
    // 分配free角色
    db.prepare('INSERT OR IGNORE INTO user_roles (user_id, role) VALUES (?, ?)').run(user.id, 'free');
  }
  
  // 获取用户角色
  const roles = db.prepare('SELECT role FROM user_roles WHERE user_id = ?').all(user.id).map(r => r.role);
  if (roles.length === 0) roles.push('free');
  
  // VIP等级映射为角色
  if (user.vip_level && rbac.VIP_LEVEL_TO_ROLE[user.vip_level]) {
    if (!roles.includes(rbac.VIP_LEVEL_TO_ROLE[user.vip_level])) {
      roles.push(rbac.VIP_LEVEL_TO_ROLE[user.vip_level]);
    }
  }
  if (user.is_super && !roles.includes('super_admin')) {
    roles.push('super_admin');
  }
  
  // Token有效期缩短为24h（原72h）
  const token = sec.generateToken(user.id, 24, roles);
  
  db.prepare('INSERT INTO audit_logs (user_id, action, detail) VALUES (?, ?, ?)')
    .run(user.id, 'login', '手机号登录');
  
  res.json({
    token: token,
    user: {
      id: user.id,
      name: user.name || '缘主',
      vipLevel: user.vip_level,
      isSuper: !!user.is_super,
      roles: roles,
      phoneMasked: sec.maskPhone(phone)
    }
  });
});

// 更新用户信息
app.post('/api/user/profile', auth, (req, res) => {
  let updates = [];
  let params = [];
  
  if (req.body.name) { updates.push('name = ?'); params.push(sec.sanitizeInput(req.body.name)); }
  if (req.body.sex) { updates.push('sex = ?'); params.push(req.body.sex); }
  if (req.body.birthDate) { updates.push('birth_date = ?'); params.push(sec.encrypt(req.body.birthDate)); }
  if (req.body.birthHour !== undefined) { updates.push('birth_hour = ?'); params.push(req.body.birthHour); }
  if (req.body.birthplace) { updates.push('birthplace = ?'); params.push(sec.sanitizeInput(req.body.birthplace)); }
  if (req.body.residence) { updates.push('residence = ?'); params.push(sec.sanitizeInput(req.body.residence)); }
  if (req.body.occupation) { updates.push('occupation = ?'); params.push(sec.sanitizeInput(req.body.occupation)); }
  if (req.body.faith) { updates.push('faith = ?'); params.push(req.body.faith); }
  
  if (updates.length === 0) return res.json({ error: '无更新内容' });
  
  params.push(req.userId);
  db.prepare('UPDATE users SET ' + updates.join(', ') + ', updated_at = datetime("now","localtime") WHERE id = ?').run(...params);
  
  res.json({ ok: true, message: '更新成功' });
});

// 获取用户信息
app.get('/api/user/profile', auth, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  if (!user) return res.json({ error: '用户不存在' });
  
  const roles = db.prepare('SELECT role FROM user_roles WHERE user_id = ?').all(user.id).map(r => r.role);
  
  res.json({
    id: user.id,
    name: user.name,
    sex: user.sex,
    birthDate: user.birth_date ? sec.decrypt(user.birth_date) : null,
    birthHour: user.birth_hour,
    birthplace: user.birthplace,
    residence: user.residence,
    occupation: user.occupation,
    zodiac: user.zodiac,
    dayStem: user.day_stem,
    xiEle: user.xi_ele,
    faith: user.faith,
    vipLevel: user.vip_level,
    isSuper: !!user.is_super,
    roles: roles,
    phoneMasked: user.phone ? (user.phone.startsWith('enc:') ? sec.maskPhone(sec.decrypt(user.phone)) : sec.maskPhone(user.phone)) : null
  });
});

// 超管手机号检查（不再硬编码在前端，通过API验证）
app.post('/api/user/check-super', (req, res) => {
  const phone = sec.sanitizeInput(req.body.phone);
  if (!phone) return res.json({ isSuper: false });
  
  if (!sec.rateLimit('super_check_' + phone, 3, 60000)) {
    return res.status(429).json({ error: 'RATE_LIMITED' });
  }
  
  const phoneHash = sec.hashPhone(phone);
  const user = db.prepare('SELECT is_super FROM users WHERE phone_hash = ?').get(phoneHash);
  res.json({ isSuper: !!(user && user.is_super) });
});

// ============================
// 排盘记录接口
// ============================
app.post('/api/paipan/save', auth, (req, res) => {
  const type = sec.sanitizeInput(req.body.type);
  const inputData = JSON.stringify(req.body.inputData || {});
  const resultData = JSON.stringify(req.body.resultData || {}).substring(0, 50000);
  
  db.prepare('INSERT INTO paipan_records (user_id, type, input_data, result_data) VALUES (?, ?, ?, ?)')
    .run(req.userId, type, inputData, resultData);
  
  res.json({ ok: true, message: '排盘记录已保存' });
});

app.get('/api/paipan/history', auth, (req, res) => {
  const records = db.prepare('SELECT id, type, input_data, created_at FROM paipan_records WHERE user_id = ? ORDER BY created_at DESC LIMIT 50').all(req.userId);
  res.json(records);
});

// ============================
// 商城接口
// ============================
app.get('/api/shop/products', (req, res) => {
  res.json({ message: '商品数据由前端shop-data.js提供' });
});

app.post('/api/order/create', auth, (req, res) => {
  const productId = sec.sanitizeInput(req.body.productId);
  const productName = sec.sanitizeInput(req.body.productName);
  const amount = parseFloat(req.body.amount) || 0;
  const merchantId = parseInt(req.body.merchantId) || 0;
  
  const config = db.prepare('SELECT value FROM system_config WHERE key = ?').get('platform_split');
  const platformSplit = config ? parseFloat(config.value) : 0.2;
  
  db.prepare('INSERT INTO orders (user_id, merchant_id, product_id, product_name, amount, merchant_amount, platform_amount, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(req.userId, merchantId, productId, productName, amount, amount * (1-platformSplit), amount * platformSplit, 'pending');
  
  res.json({ ok: true, message: '订单已创建，客服将联系您确认' });
});

// ============================
// 反馈接口
// ============================
app.post('/api/feedback/submit', auth, (req, res) => {
  const type = sec.sanitizeInput(req.body.type);
  const target = sec.sanitizeInput(req.body.target);
  const content = sec.sanitizeXSS(sec.sanitizeInput(req.body.content));
  
  const pointsMap = { like: 1, dislike: 3, suggestion: 5, correction: 10 };
  const points = pointsMap[type] || 1;
  
  db.prepare('INSERT INTO feedback (user_id, type, target, content, points_awarded) VALUES (?, ?, ?, ?, ?)')
    .run(req.userId, type, target, content, points);
  
  db.prepare('INSERT OR IGNORE INTO user_points (user_id) VALUES (?)').run(req.userId);
  db.prepare('UPDATE user_points SET total_points = total_points + ?, last_feedback_date = ? WHERE user_id = ?')
    .run(points, new Date().toISOString().slice(0,10), req.userId);
  
  const pointsData = db.prepare('SELECT * FROM user_points WHERE user_id = ?').get(req.userId);
  if (pointsData) {
    const lastDate = pointsData.last_feedback_date;
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0,10);
    const today = new Date().toISOString().slice(0,10);
    if (lastDate === yesterday) {
      db.prepare('UPDATE user_points SET streak_days = streak_days + 1 WHERE user_id = ?').run(req.userId);
    } else if (lastDate !== today) {
      db.prepare('UPDATE user_points SET streak_days = 1 WHERE user_id = ?').run(req.userId);
    }
    
    const streak = pointsData.streak_days + 1;
    if (streak === 7) {
      db.prepare('UPDATE user_points SET total_points = total_points + 20 WHERE user_id = ?').run(req.userId);
    } else if (streak === 30) {
      db.prepare('UPDATE user_points SET total_points = total_points + 100 WHERE user_id = ?').run(req.userId);
    }
  }
  
  res.json({ ok: true, points: points, message: '反馈成功，获得' + points + '积分' });
});

app.get('/api/feedback/points', auth, (req, res) => {
  const data = db.prepare('SELECT * FROM user_points WHERE user_id = ?').get(req.userId);
  res.json({
    totalPoints: data ? data.total_points : 0,
    streakDays: data ? data.streak_days : 0,
    exchangedPoints: data ? data.exchanged_points : 0
  });
});

// ============================
// 商家接口（P0修复：添加认证）
// ============================

// 商家入驻申请（添加速率限制，无需登录但有限流）
app.post('/api/merchant/apply', (req, res) => {
  const ip = req.ip || req.connection.remoteAddress;
  if (!sec.rateLimit('merchant_apply_' + ip, 3, 3600000)) {
    return res.status(429).json({ error: 'RATE_LIMITED', message: '申请过于频繁，请1小时后再试' });
  }
  
  const name = sec.sanitizeInput(req.body.name);
  const school = sec.sanitizeInput(req.body.school);
  const phone = sec.sanitizeInput(req.body.phone);
  const boss = sec.sanitizeInput(req.body.boss);
  const master = sec.sanitizeInput(req.body.master);
  const license = sec.sanitizeInput(req.body.license);
  const cert = sec.sanitizeInput(req.body.cert);
  const splitRate = parseFloat(req.body.splitRate) || 0.8;
  
  if (!name || !phone) return res.json({ error: '请填写商家名称和联系电话' });
  
  // 手机号加密存储
  const encryptedPhone = sec.encrypt(phone);
  
  db.prepare('INSERT INTO merchants (name, school, type, boss, phone, master, license, cert, split_rate, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(name, school || '', req.body.type || '寺庙', boss || '', encryptedPhone, master || '', license || '', cert || '', splitRate, 'pending');
  
  res.json({ ok: true, message: '申请已提交，请等待审核' });
});

app.get('/api/merchant/list', adminAuth, (req, res) => {
  const merchants = db.prepare('SELECT id, name, school, type, boss, master, license, cert, split_rate, status, created_at FROM merchants ORDER BY created_at DESC').all();
  res.json(merchants);
});

app.post('/api/merchant/approve', adminAuth, (req, res) => {
  const id = parseInt(req.body.id);
  const status = req.body.status;
  db.prepare('UPDATE merchants SET status = ? WHERE id = ?').run(status, id);
  res.json({ ok: true, message: status === 'approved' ? '已通过' : '已拒绝' });
});

// ============================
// 课程接口
// ============================
app.get('/api/courses', (req, res) => {
  const master = req.query.master;
  let courses;
  if (master) {
    courses = db.prepare('SELECT * FROM courses WHERE master = ? ORDER BY sort_order, created_at DESC').all(master);
  } else {
    courses = db.prepare('SELECT * FROM courses ORDER BY sort_order, created_at DESC').all();
  }
  res.json(courses);
});

app.post('/api/courses/add', adminAuth, (req, res) => {
  const master = sec.sanitizeInput(req.body.master);
  const title = sec.sanitizeInput(req.body.title);
  const type = sec.sanitizeInput(req.body.type);
  const url = sec.sanitizeInput(req.body.url);
  const duration = sec.sanitizeInput(req.body.duration);
  const category = sec.sanitizeInput(req.body.category);
  const summary = sec.sanitizeInput(req.body.summary);
  const keyPoints = JSON.stringify(req.body.keyPoints || []);
  
  db.prepare('INSERT INTO courses (master, title, type, url, duration, category, summary, key_points) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(master, title, type, url, duration, category, summary, keyPoints);
  
  res.json({ ok: true, message: '课程已添加' });
});

// ============================
// 推送日志接口（P0修复：添加认证）
// ============================
app.post('/api/push/log', auth, (req, res) => {
  const userId = req.userId; // 使用Token中的userId，不信任客户端传入
  const pushType = sec.sanitizeInput(req.body.pushType);
  const content = sec.sanitizeInput(req.body.content).substring(0, 5000);
  
  db.prepare('INSERT INTO push_logs (user_id, push_type, push_date, content, delivered) VALUES (?, ?, ?, ?, 1)')
    .run(userId, pushType, new Date().toISOString().slice(0,10), content);
  
  res.json({ ok: true });
});

// ============================
// 系统配置接口（超管）
// ============================
app.get('/api/admin/config', adminAuth, (req, res) => {
  const configs = db.prepare('SELECT * FROM system_config').all();
  res.json(configs);
});

app.post('/api/admin/config', adminAuth, (req, res) => {
  const key = sec.sanitizeInput(req.body.key);
  const value = sec.sanitizeInput(req.body.value);
  db.prepare('INSERT OR REPLACE INTO system_config (key, value, updated_at) VALUES (?, ?, datetime("now","localtime"))').run(key, value);
  res.json({ ok: true });
});

// 统计数据
app.get('/api/admin/stats', adminAuth, (req, res) => {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const orderCount = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
  const feedbackCount = db.prepare('SELECT COUNT(*) as count FROM feedback').get().count;
  const merchantCount = db.prepare('SELECT COUNT(*) as count FROM merchants').get().count;
  const pushCount = db.prepare('SELECT COUNT(*) as count FROM push_logs').get().count;
  const caseCount = db.prepare('SELECT COUNT(*) as count FROM master_cases').get().count;
  
  res.json({
    users: userCount,
    orders: orderCount,
    feedback: feedbackCount,
    merchants: merchantCount,
    pushes: pushCount,
    masterCases: caseCount
  });
});

// ============================
// RBAC 角色管理接口（管理员）
// ============================

// 分配角色
app.post('/api/admin/assign-role', adminAuth, (req, res) => {
  const userId = parseInt(req.body.userId);
  const role = sec.sanitizeInput(req.body.role);
  
  if (!Object.values(rbac.ROLES).includes(role)) {
    return res.json({ error: '无效角色' });
  }
  
  db.prepare('INSERT OR IGNORE INTO user_roles (user_id, role, assigned_by) VALUES (?, ?, ?)')
    .run(userId, role, req.userId);
  
  db.prepare('INSERT INTO audit_logs (user_id, action, detail) VALUES (?, ?, ?)')
    .run(req.userId, 'assign_role', `给用户${userId}分配角色${role}`);
  
  res.json({ ok: true, message: '角色已分配' });
});

// 移除角色
app.post('/api/admin/remove-role', adminAuth, (req, res) => {
  const userId = parseInt(req.body.userId);
  const role = sec.sanitizeInput(req.body.role);
  
  if (role === 'super_admin') {
    return res.json({ error: '不能移除超级管理员角色' });
  }
  
  db.prepare('DELETE FROM user_roles WHERE user_id = ? AND role = ?').run(userId, role);
  
  db.prepare('INSERT INTO audit_logs (user_id, action, detail) VALUES (?, ?, ?)')
    .run(req.userId, 'remove_role', `移除用户${userId}的角色${role}`);
  
  res.json({ ok: true, message: '角色已移除' });
});

// ============================
// 平台B · 周易中医诊疗接口
// ============================

// 病患提交症状
app.post('/api/clinic/submit-symptom', requirePermission('clinic:submit_symptom'), (req, res) => {
  const symptoms = sec.sanitizeXSS(sec.sanitizeInput(req.body.symptoms));
  const constitution = sec.sanitizeInput(req.body.constitution);
  
  if (!symptoms) return res.json({ error: '请描述症状' });
  
  const result = db.prepare('INSERT INTO medical_cases (patient_id, symptoms, constitution, status) VALUES (?, ?, ?, ?)')
    .run(req.userId, symptoms, constitution, 'pending_master');
  
  db.prepare('INSERT INTO case_review_logs (case_id, action, actor_id, actor_role, detail) VALUES (?, ?, ?, ?, ?)')
    .run(result.lastInsertRowid, 'created', req.userId, 'patient', '病患提交症状');
  
  res.json({ ok: true, caseId: result.lastInsertRowid, message: '症状已提交，将分配给大师分析' });
});

// 大师查看分配的病例
app.get('/api/clinic/assigned-cases', requirePermission('clinic:view_assigned_case'), (req, res) => {
  const role = req.userRoles.find(r => ['master', 'doctor', 'admin_b', 'super_admin'].includes(r));
  let cases;
  
  if (role === 'master' || role === 'super_admin') {
    // 大师查看待处理和已处理的
    cases = db.prepare(`
      SELECT mc.*, u.name as patient_name, u.sex as patient_sex
      FROM medical_cases mc
      LEFT JOIN users u ON mc.patient_id = u.id
      WHERE mc.assigned_master_id = ? OR mc.status = 'pending_master'
      ORDER BY mc.created_at DESC
    `).all(req.userId);
  } else if (role === 'doctor') {
    cases = db.prepare(`
      SELECT mc.*, u.name as patient_name, u.sex as patient_sex
      FROM medical_cases mc
      LEFT JOIN users u ON mc.patient_id = u.id
      WHERE mc.assigned_doctor_id = ? OR mc.status = 'pending_doctor'
      ORDER BY mc.created_at DESC
    `).all(req.userId);
  } else {
    cases = db.prepare(`
      SELECT mc.*, u.name as patient_name, u.sex as patient_sex
      FROM medical_cases mc
      LEFT JOIN users u ON mc.patient_id = u.id
      ORDER BY mc.created_at DESC
    `).all();
  }
  
  // 字段级脱敏
  cases.forEach(c => {
    if (role === 'master') {
      // 大师可以看到八字相关信息，但病患姓名脱敏
      if (c.patient_name && c.patient_name.length > 1) {
        c.patient_name = c.patient_name[0] + (c.patient_sex === '男' ? '先生' : '女士');
      }
    }
  });
  
  res.json(cases);
});

// 大师提交周易分析
app.post('/api/clinic/submit-analysis', requirePermission('clinic:submit_analysis'), (req, res) => {
  const caseId = parseInt(req.body.caseId);
  const analysis = sec.sanitizeInput(req.body.analysis || '');
  const baziChart = req.body.baziChart ? sec.encrypt(JSON.stringify(req.body.baziChart)) : null;
  const wuxingSummary = sec.sanitizeInput(req.body.wuxingSummary);
  
  // 检查病例归属
  const medicalCase = db.prepare('SELECT * FROM medical_cases WHERE id = ?').get(caseId);
  if (!medicalCase) return res.json({ error: '病例不存在' });
  
  // 生成医学化翻译（过滤周易术语）
  const filteredSummary = rbac.filterZhouyiTerms(analysis);
  
  // 创建大师案例
  const caseUuid = crypto.randomUUID();
  const result = db.prepare(`
    INSERT INTO master_cases 
    (case_uuid, master_id, patient_id, bazi_chart, wuxing_summary, symptoms, 
     constitution, master_analysis, analysis_summary, medical_translation, status, submitted_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted', datetime('now','localtime'))
  `).run(caseUuid, req.userId, medicalCase.patient_id, baziChart, wuxingSummary,
         medicalCase.symptoms, medicalCase.constitution, sec.encrypt(analysis), filteredSummary, filteredSummary);
  
  // 更新病例状态
  db.prepare('UPDATE medical_cases SET status = ?, assigned_master_id = ?, master_case_id = ?, updated_at = datetime("now","localtime") WHERE id = ?')
    .run('pending_doctor', req.userId, result.lastInsertRowid, caseId);
  
  // 记录版本
  db.prepare('INSERT INTO master_case_versions (case_id, version_type, version_number, content, content_hash, created_by) VALUES (?, ?, ?, ?, ?, ?)')
    .run(result.lastInsertRowid, 'master_analysis', 1, sec.encrypt(analysis), 
          crypto.createHash('sha256').update(analysis).digest('hex'), req.userId);
  
  db.prepare('INSERT INTO case_review_logs (case_id, action, actor_id, actor_role, detail) VALUES (?, ?, ?, ?, ?)')
    .run(result.lastInsertRowid, 'analysis_submitted', req.userId, 'master', '大师提交周易分析');
  
  res.json({ ok: true, caseId: result.lastInsertRowid, message: '分析已提交，等待医生审核' });
});

// 医生提交诊疗方案
app.post('/api/clinic/submit-diagnosis', requirePermission('clinic:submit_diagnosis'), (req, res) => {
  const caseId = parseInt(req.body.caseId);
  const diagnosis = sec.sanitizeXSS(sec.sanitizeInput(req.body.diagnosis));
  const prescription = sec.sanitizeXSS(sec.sanitizeInput(req.body.prescription));
  const reviewComment = sec.sanitizeInput(req.body.reviewComment);
  
  const masterCase = db.prepare('SELECT * FROM master_cases WHERE id = ?').get(caseId);
  if (!masterCase) return res.json({ error: '案例不存在' });
  
  const finalPlan = JSON.stringify({ diagnosis, prescription });
  
  db.prepare(`
    UPDATE master_cases SET 
    doctor_diagnosis = ?, review_status = 'approved', review_comment = ?, 
    reviewer_id = ?, reviewed_at = datetime('now','localtime'),
    final_plan = ?, status = 'completed', completed_at = datetime('now','localtime')
    WHERE id = ?
  `).run(sec.encrypt(diagnosis), reviewComment, req.userId, sec.encrypt(finalPlan), caseId);
  
  // 记录版本
  db.prepare('INSERT INTO master_case_versions (case_id, version_type, version_number, content, content_hash, created_by) VALUES (?, ?, ?, ?, ?, ?)')
    .run(caseId, 'doctor_diagnosis', 1, sec.encrypt(finalPlan),
          crypto.createHash('sha256').update(finalPlan).digest('hex'), req.userId);
  
  // 更新病例状态
  if (masterCase.patient_id) {
    const medicalCase = db.prepare('SELECT id FROM medical_cases WHERE master_case_id = ?').get(caseId);
    if (medicalCase) {
      db.prepare('UPDATE medical_cases SET status = ?, assigned_doctor_id = ?, updated_at = datetime("now","localtime") WHERE id = ?')
        .run('completed', req.userId, medicalCase.id);
    }
  }
  
  db.prepare('INSERT INTO case_review_logs (case_id, action, actor_id, actor_role, detail) VALUES (?, ?, ?, ?, ?)')
    .run(caseId, 'diagnosis_submitted', req.userId, 'doctor', '医生提交诊疗方案');
  
  res.json({ ok: true, message: '诊疗方案已提交' });
});

// 推送养生报告给病患
app.post('/api/clinic/push-report', requirePermission('clinic:push_report'), (req, res) => {
  const caseId = parseInt(req.body.caseId);
  const reportText = sec.sanitizeXSS(sec.sanitizeInput(req.body.reportText));
  
  const masterCase = db.prepare('SELECT * FROM master_cases WHERE id = ?').get(caseId);
  if (!masterCase) return res.json({ error: '案例不存在' });
  if (!masterCase.patient_id) return res.json({ error: '无关联病患' });
  
  // 过滤周易术语（双重保险）
  const filteredText = rbac.filterZhouyiTerms(reportText);
  
  const result = db.prepare('INSERT INTO tcm_reports (case_id, patient_id, doctor_id, report_text, filtered_text) VALUES (?, ?, ?, ?, ?)')
    .run(caseId, masterCase.patient_id, req.userId, sec.encrypt(reportText), filteredText);
  
  db.prepare('INSERT INTO case_review_logs (case_id, action, actor_id, actor_role, detail) VALUES (?, ?, ?, ?, ?)')
    .run(caseId, 'report_pushed', req.userId, req.userRoles.find(r => r === 'doctor' || r === 'admin_b'), '推送养生报告');
  
  res.json({ ok: true, reportId: result.lastInsertRowid, message: '报告已推送给病患' });
});

// 病患查看自己的报告
app.get('/api/clinic/my-reports', requirePermission('clinic:view_own_report'), (req, res) => {
  const reports = db.prepare(`
    SELECT id, case_id, filtered_text as report_text, pushed_at, read_at
    FROM tcm_reports 
    WHERE patient_id = ? 
    ORDER BY pushed_at DESC
  `).all(req.userId);
  
  // 标记已读
  if (reports.length > 0) {
    db.prepare('UPDATE tcm_reports SET read_at = datetime("now","localtime") WHERE patient_id = ? AND read_at IS NULL').run(req.userId);
  }
  
  res.json(reports);
});

// 协作讨论
app.post('/api/clinic/discuss', requirePermission('clinic:collaborate'), (req, res) => {
  const caseId = parseInt(req.body.caseId);
  const content = sec.sanitizeXSS(sec.sanitizeInput(req.body.content));
  const authorRole = req.userRoles.find(r => ['master', 'doctor', 'admin_b', 'super_admin'].includes(r));
  
  if (!content) return res.json({ error: '请输入讨论内容' });
  
  db.prepare('INSERT INTO case_discussions (case_id, author_id, author_role, content) VALUES (?, ?, ?, ?)')
    .run(caseId, req.userId, authorRole, content);
  
  res.json({ ok: true, message: '讨论已发送' });
});

app.get('/api/clinic/discussions/:caseId', requirePermission('clinic:collaborate'), (req, res) => {
  const caseId = parseInt(req.params.caseId);
  const discussions = db.prepare(`
    SELECT cd.*, u.name as author_name
    FROM case_discussions cd
    LEFT JOIN users u ON cd.author_id = u.id
    WHERE cd.case_id = ?
    ORDER BY cd.created_at ASC
  `).all(caseId);
  
  res.json(discussions);
});

// 查看大师案例详情（角色限制）
app.get('/api/clinic/case/:id', requirePermission('clinic:view_assigned_case'), (req, res) => {
  const caseId = parseInt(req.params.id);
  const masterCase = db.prepare('SELECT * FROM master_cases WHERE id = ?').get(caseId);
  if (!masterCase) return res.json({ error: '案例不存在' });
  
  const response = { id: masterCase.id, status: masterCase.status, created_at: masterCase.created_at };
  
  // 字段级权限控制
  if (req.userRoles.includes('master') || req.userRoles.includes('super_admin')) {
    response.bazi_chart = masterCase.bazi_chart ? sec.decrypt(masterCase.bazi_chart) : null;
    response.wuxing_summary = masterCase.wuxing_summary;
    response.master_analysis = masterCase.master_analysis ? sec.decrypt(masterCase.master_analysis) : null;
    response.symptoms = masterCase.symptoms;
    response.constitution = masterCase.constitution;
  }
  
  if (req.userRoles.includes('doctor') || req.userRoles.includes('super_admin')) {
    response.master_analysis = masterCase.master_analysis ? sec.decrypt(masterCase.master_analysis) : null;
    response.analysis_summary = masterCase.analysis_summary;
    response.medical_translation = masterCase.medical_translation;
    response.doctor_diagnosis = masterCase.doctor_diagnosis ? sec.decrypt(masterCase.doctor_diagnosis) : null;
    response.final_plan = masterCase.final_plan ? sec.decrypt(masterCase.final_plan) : null;
    response.symptoms = masterCase.symptoms;
  }
  
  if (req.userRoles.includes('admin_b') || req.userRoles.includes('super_admin')) {
    response.quality_score = masterCase.quality_score;
    response.is_high_quality = masterCase.is_high_quality;
    response.effectiveness_rating = masterCase.effectiveness_rating;
  }
  
  res.json(response);
});

// KB路由和分级函数已移至上方（使用kb-config.js配置）

// ============================
// KB分级访问API
// ============================

// KB文件列表（按角色过滤）
app.get('/api/kb/list', auth, (req, res) => {
  const fs = require('fs');
  const path = require('path');
  const kbDir = path.join(__dirname, '..', 'knowledge');
  
  try {
    const files = fs.readdirSync(kbDir).filter(f => f.endsWith('.js'));
    const accessibleFiles = files.filter(file => {
      const config = KB_LEVELS[file];
      const level = config ? config.level : 'public';
      return canAccessKB(req.userRoles, level);
    }).map(file => ({
      filename: file,
      level: KB_LEVELS[file] ? KB_LEVELS[file].level : 'public',
      desc: KB_LEVELS[file] ? KB_LEVELS[file].desc : ''
    }));
    
    res.json({ files: accessibleFiles });
  } catch (e) {
    res.json({ files: [] });
  }
});

// KB文件内容（角色鉴权）
app.get('/api/kb/:filename', auth, (req, res) => {
  const filename = req.params.filename;
  
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return res.status(403).json({ error: 'RBAC_FORBIDDEN' });
  }
  
  const config = KB_LEVELS[filename];
  const level = config ? config.level : 'public';
  if (!canAccessKB(req.userRoles, level)) {
    return res.status(403).json({ error: 'RBAC_FORBIDDEN', message: '无权访问此知识库' });
  }
  
  const fs = require('fs');
  const path = require('path');
  const filePath = path.join(__dirname, '..', 'knowledge', filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: '文件不存在' });
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  res.set('Cache-Control', 'public, max-age=3600');
  res.type('application/javascript').send(content);
});

// ============================
// 案例质量评分API
// ============================

app.post('/api/clinic/score-case', requirePermission('clinic:collaborate'), (req, res) => {
  const caseId = parseInt(req.body.caseId);
  const score = caseQuality.scoreCase(caseId, db);
  res.json({ ok: true, score: score });
});

app.post('/api/clinic/update-effectiveness', requirePermission('clinic:collaborate'), (req, res) => {
  const caseId = parseInt(req.body.caseId);
  const rating = parseInt(req.body.rating);
  caseQuality.updateEffectiveness(caseId, rating, db);
  res.json({ ok: true, message: '疗效评级已更新' });
});

// ============================
// 数据同步路由
// ============================
app.use('/api/sync', syncRoutes);
app.use('/api/distill', distillationRoutes);

// === 启动服务 ===
app.listen(PORT, () => {
  console.log('═══════════════════════════════════════');
  console.log('  命理宝鉴 API服务 v2 已启动');
  console.log('  端口: ' + PORT);
  console.log('  数据库: server/database/yidao.db');
  console.log('  CORS: ' + CORS_ORIGINS.join(', '));
  console.log('  安全: AES-256-GCM + JWT-HS256 + RBAC');
  console.log('═══════════════════════════════════════');
});
