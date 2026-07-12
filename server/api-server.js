// ═══ 易道智鉴 · 后端API服务 ═══
const express = require('express');
const cors = require('cors');
const { DatabaseSync } = require('node:sqlite');
const sec = require('./security.js');
const syncRoutes = require('./sync-api');

const app = express();
const PORT = 8920;

// 中间件
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// 数据库连接
const db = new DatabaseSync('server/database/yidao.db');

// === 认证中间件 ===
function auth(req, res, next) {
  var token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: '未登录' });
  var payload = sec.verifyToken(token);
  if (!payload) return res.status(401).json({ error: '登录已过期' });
  req.userId = payload.uid;
  next();
}

// === 超管中间件 ===
function adminAuth(req, res, next) {
  auth(req, res, function() {
    var user = db.prepare('SELECT is_super FROM users WHERE id = ?').get(req.userId);
    if (!user || !user.is_super) return res.status(403).json({ error: '无权限' });
    next();
  });
}

// ============================
// 用户接口
// ============================

// 注册/登录（手机号）
app.post('/api/user/login', (req, res) => {
  var phone = sec.sanitizeInput(req.body.phone);
  if (!phone) return res.json({ error: '请输入手机号' });
  
  // 速率限制
  if (!sec.rateLimit('login_' + phone, 5, 60000)) {
    return res.json({ error: '请求过于频繁，请稍后再试' });
  }
  
  var phoneHash = sec.hashPhone(phone);
  var user = db.prepare('SELECT * FROM users WHERE phone_hash = ?').get(phoneHash);
  
  if (!user) {
    // 新用户注册
    db.prepare('INSERT INTO users (phone, phone_hash, follow_date) VALUES (?, ?, ?)')
      .run(sec.encrypt(phone), phoneHash, new Date().toISOString().slice(0,10));
    user = db.prepare('SELECT * FROM users WHERE phone_hash = ?').get(phoneHash);
    db.prepare('INSERT INTO user_points (user_id) VALUES (?)').run(user.id);
  }
  
  var token = sec.generateToken(user.id, 72);
  
  // 审计日志
  db.prepare('INSERT INTO audit_logs (user_id, action, detail) VALUES (?, ?, ?)')
    .run(user.id, 'login', '手机号登录');
  
  res.json({
    token: token,
    user: {
      id: user.id,
      name: user.name || '缘主',
      vipLevel: user.vip_level,
      isSuper: !!user.is_super,
      phoneMasked: sec.maskPhone(phone)
    }
  });
});

// 更新用户信息（生辰八字等）
app.post('/api/user/profile', auth, (req, res) => {
  var updates = [];
  var params = [];
  
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
  var user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  if (!user) return res.json({ error: '用户不存在' });
  
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
    phoneMasked: user.phone ? (user.phone.startsWith('encrypted:') ? sec.maskPhone(sec.decrypt(user.phone)) : sec.maskPhone(user.phone)) : null
  });
});

// ============================
// 排盘记录接口
// ============================

// 保存排盘记录
app.post('/api/paipan/save', auth, (req, res) => {
  var type = sec.sanitizeInput(req.body.type);
  var inputData = JSON.stringify(req.body.inputData || {});
  var resultData = JSON.stringify(req.body.resultData || {}).substring(0, 50000); // 限制大小
  
  db.prepare('INSERT INTO paipan_records (user_id, type, input_data, result_data) VALUES (?, ?, ?, ?)')
    .run(req.userId, type, inputData, resultData);
  
  res.json({ ok: true, message: '排盘记录已保存' });
});

// 获取排盘历史
app.get('/api/paipan/history', auth, (req, res) => {
  var records = db.prepare('SELECT id, type, input_data, created_at FROM paipan_records WHERE user_id = ? ORDER BY created_at DESC LIMIT 50').all(req.userId);
  res.json(records);
});

// ============================
// 商城接口
// ============================

// 获取商品列表
app.get('/api/shop/products', (req, res) => {
  res.json({ message: '商品数据由前端shop-data.js提供' });
});

// 创建订单
app.post('/api/order/create', auth, (req, res) => {
  var productId = sec.sanitizeInput(req.body.productId);
  var productName = sec.sanitizeInput(req.body.productName);
  var amount = parseFloat(req.body.amount) || 0;
  var merchantId = parseInt(req.body.merchantId) || 0;
  
  // 获取分成比例
  var config = db.prepare('SELECT value FROM system_config WHERE key = ?').get('platform_split');
  var platformSplit = config ? parseFloat(config.value) : 0.2;
  
  db.prepare('INSERT INTO orders (user_id, merchant_id, product_id, product_name, amount, merchant_amount, platform_amount, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(req.userId, merchantId, productId, productName, amount, amount * (1-platformSplit), amount * platformSplit, 'pending');
  
  res.json({ ok: true, message: '订单已创建，客服将联系您确认' });
});

// ============================
// 反馈接口
// ============================

// 提交反馈
app.post('/api/feedback/submit', auth, (req, res) => {
  var type = sec.sanitizeInput(req.body.type);
  var target = sec.sanitizeInput(req.body.target);
  var content = sec.sanitizeXSS(sec.sanitizeInput(req.body.content));
  
  // 积分奖励
  var pointsMap = { like: 1, dislike: 3, suggestion: 5, correction: 10 };
  var points = pointsMap[type] || 1;
  
  db.prepare('INSERT INTO feedback (user_id, type, target, content, points_awarded) VALUES (?, ?, ?, ?, ?)')
    .run(req.userId, type, target, content, points);
  
  // 更新积分
  db.prepare('INSERT OR IGNORE INTO user_points (user_id) VALUES (?)').run(req.userId);
  db.prepare('UPDATE user_points SET total_points = total_points + ?, last_feedback_date = ? WHERE user_id = ?')
    .run(points, new Date().toISOString().slice(0,10), req.userId);
  
  // 连续反馈天数
  var pointsData = db.prepare('SELECT * FROM user_points WHERE user_id = ?').get(req.userId);
  if (pointsData) {
    var lastDate = pointsData.last_feedback_date;
    var yesterday = new Date(Date.now() - 86400000).toISOString().slice(0,10);
    var today = new Date().toISOString().slice(0,10);
    if (lastDate === yesterday) {
      db.prepare('UPDATE user_points SET streak_days = streak_days + 1 WHERE user_id = ?').run(req.userId);
    } else if (lastDate !== today) {
      db.prepare('UPDATE user_points SET streak_days = 1 WHERE user_id = ?').run(req.userId);
    }
    
    // 连续奖励
    var streak = pointsData.streak_days + 1;
    if (streak === 7) {
      db.prepare('UPDATE user_points SET total_points = total_points + 20 WHERE user_id = ?').run(req.userId);
    } else if (streak === 30) {
      db.prepare('UPDATE user_points SET total_points = total_points + 100 WHERE user_id = ?').run(req.userId);
    }
  }
  
  res.json({ ok: true, points: points, message: '反馈成功，获得' + points + '积分' });
});

// 获取积分
app.get('/api/feedback/points', auth, (req, res) => {
  var data = db.prepare('SELECT * FROM user_points WHERE user_id = ?').get(req.userId);
  res.json({
    totalPoints: data ? data.total_points : 0,
    streakDays: data ? data.streak_days : 0,
    exchangedPoints: data ? data.exchanged_points : 0
  });
});

// ============================
// 商家接口
// ============================

// 商家入驻申请
app.post('/api/merchant/apply', (req, res) => {
  var name = sec.sanitizeInput(req.body.name);
  var school = sec.sanitizeInput(req.body.school);
  var phone = sec.sanitizeInput(req.body.phone);
  var boss = sec.sanitizeInput(req.body.boss);
  var master = sec.sanitizeInput(req.body.master);
  var license = sec.sanitizeInput(req.body.license);
  var cert = sec.sanitizeInput(req.body.cert);
  var splitRate = parseFloat(req.body.splitRate) || 0.8;
  
  if (!name || !phone) return res.json({ error: '请填写商家名称和联系电话' });
  
  db.prepare('INSERT INTO merchants (name, school, type, boss, phone, master, license, cert, split_rate, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(name, school || '', req.body.type || '寺庙', boss || '', phone, master || '', license || '', cert || '', splitRate, 'pending');
  
  res.json({ ok: true, message: '申请已提交，请等待审核' });
});

// 获取商家列表（超管）
app.get('/api/merchant/list', adminAuth, (req, res) => {
  var merchants = db.prepare('SELECT * FROM merchants ORDER BY created_at DESC').all();
  res.json(merchants);
});

// 审核商家（超管）
app.post('/api/merchant/approve', adminAuth, (req, res) => {
  var id = parseInt(req.body.id);
  var status = req.body.status; // approved/rejected
  db.prepare('UPDATE merchants SET status = ? WHERE id = ?').run(status, id);
  res.json({ ok: true, message: status === 'approved' ? '已通过' : '已拒绝' });
});

// ============================
// 课程接口
// ============================

// 获取课程列表
app.get('/api/courses', (req, res) => {
  var master = req.query.master;
  var courses;
  if (master) {
    courses = db.prepare('SELECT * FROM courses WHERE master = ? ORDER BY sort_order, created_at DESC').all(master);
  } else {
    courses = db.prepare('SELECT * FROM courses ORDER BY sort_order, created_at DESC').all();
  }
  res.json(courses);
});

// 添加课程（超管）
app.post('/api/courses/add', adminAuth, (req, res) => {
  var master = sec.sanitizeInput(req.body.master);
  var title = sec.sanitizeInput(req.body.title);
  var type = sec.sanitizeInput(req.body.type);
  var url = sec.sanitizeInput(req.body.url);
  var duration = sec.sanitizeInput(req.body.duration);
  var category = sec.sanitizeInput(req.body.category);
  var summary = sec.sanitizeInput(req.body.summary);
  var keyPoints = JSON.stringify(req.body.keyPoints || []);
  
  db.prepare('INSERT INTO courses (master, title, type, url, duration, category, summary, key_points) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(master, title, type, url, duration, category, summary, keyPoints);
  
  res.json({ ok: true, message: '课程已添加' });
});

// ============================
// 推送日志接口
// ============================

app.post('/api/push/log', (req, res) => {
  var userId = parseInt(req.body.userId);
  var pushType = sec.sanitizeInput(req.body.pushType);
  var content = sec.sanitizeInput(req.body.content).substring(0, 5000);
  
  db.prepare('INSERT INTO push_logs (user_id, push_type, push_date, content, delivered) VALUES (?, ?, ?, ?, 1)')
    .run(userId, pushType, new Date().toISOString().slice(0,10), content);
  
  res.json({ ok: true });
});

// ============================
// 系统配置接口（超管）
// ============================

app.get('/api/admin/config', adminAuth, (req, res) => {
  var configs = db.prepare('SELECT * FROM system_config').all();
  res.json(configs);
});

app.post('/api/admin/config', adminAuth, (req, res) => {
  var key = sec.sanitizeInput(req.body.key);
  var value = sec.sanitizeInput(req.body.value);
  db.prepare('INSERT OR REPLACE INTO system_config (key, value, updated_at) VALUES (?, ?, datetime("now","localtime"))').run(key, value);
  res.json({ ok: true });
});

// 统计数据（超管）
app.get('/api/admin/stats', adminAuth, (req, res) => {
  var userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  var orderCount = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
  var feedbackCount = db.prepare('SELECT COUNT(*) as count FROM feedback').get().count;
  var merchantCount = db.prepare('SELECT COUNT(*) as count FROM merchants').get().count;
  var pushCount = db.prepare('SELECT COUNT(*) as count FROM push_logs').get().count;
  
  res.json({
    users: userCount,
    orders: orderCount,
    feedback: feedbackCount,
    merchants: merchantCount,
    pushes: pushCount
  });
});

// === 数据同步路由 ===
app.use('/api/sync', syncRoutes);

// === 启动服务 ===
app.listen(PORT, () => {
  console.log('═══════════════════════════════════════');
  console.log('  易道智鉴 API服务已启动');
  console.log('  端口: ' + PORT);
  console.log('  数据库: server/database/yidao.db');
  console.log('  接口数量: 15个');
  console.log('═══════════════════════════════════════');
});
