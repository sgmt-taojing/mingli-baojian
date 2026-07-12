// ═══ 易道智鉴 · 数据同步接口模块 ═══
//
// 挂载方式：在 api-server.js 中添加
//   const syncRoutes = require('./sync-api');
//   app.use('/api/sync', syncRoutes);
//
// 提供接口：
//   POST /api/sync/push   — 上传本地数据到服务端
//   GET  /api/sync/pull   — 拉取服务端最新数据
//   GET  /api/sync/status — 检查数据版本
//   POST /api/sync/merge  — 合并数据（带冲突检测）
// ═══════════════════════════════════════════

const express = require('express');
const cors = require('cors');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const sec = require('./security.js');

const router = express.Router();
router.use(cors());
router.use(express.json({ limit: '10mb' }));

// 数据库连接（与 api-server.js 共用同一个 yidao.db）
const db = new DatabaseSync(path.join(__dirname, 'database/yidao.db'));

// === 初始化 user_data 表 ===
db.exec(`
  CREATE TABLE IF NOT EXISTS user_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    data_key TEXT NOT NULL,
    data_value TEXT,
    updated_at TEXT DEFAULT (datetime('now','localtime')),
    UNIQUE(user_id, data_key)
  );
`);

// === 认证中间件（与 api-server.js 一致） ===
function auth(req, res, next) {
  var token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: '未登录' });
  var payload = sec.verifyToken(token);
  if (!payload) return res.status(401).json({ error: '登录已过期' });
  req.userId = payload.uid;
  next();
}

// === 工具函数：读取用户全部同步数据 ===
function getUserData(userId) {
  var rows = db.prepare('SELECT data_key, data_value, updated_at FROM user_data WHERE user_id = ?').all(userId);
  var result = {};
  var lastSync = null;
  var version = 0;
  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    try {
      result[row.data_key] = JSON.parse(row.data_value);
    } catch (e) {
      result[row.data_key] = row.data_value;
    }
    // 取最新的 updated_at 作为 lastSync
    if (!lastSync || row.updated_at > lastSync) {
      lastSync = row.updated_at;
    }
    version++;
  }
  return { data: result, lastSync: lastSync, version: version };
}

// === 工具函数：写入单条用户数据 ===
function setUserData(userId, key, value) {
  var jsonStr = JSON.stringify(value);
  db.prepare(`
    INSERT INTO user_data (user_id, data_key, data_value, updated_at)
    VALUES (?, ?, ?, datetime('now','localtime'))
    ON CONFLICT(user_id, data_key)
    DO UPDATE SET data_value = excluded.data_value, updated_at = datetime('now','localtime')
  `).run(userId, key, jsonStr);
}

// === 工具函数：获取用户数据的更新时间戳 ===
function getDataTimestamps(userId) {
  var rows = db.prepare('SELECT data_key, updated_at FROM user_data WHERE user_id = ?').all(userId);
  var timestamps = {};
  var lastSync = null;
  for (var i = 0; i < rows.length; i++) {
    timestamps[rows[i].data_key] = rows[i].updated_at;
    if (!lastSync || rows[i].updated_at > lastSync) {
      lastSync = rows[i].updated_at;
    }
  }
  return { timestamps: timestamps, lastSync: lastSync, version: rows.length };
}

// ═══════════════════════════════════════════
// POST /api/sync/push — 上传本地数据到服务端
// ═══════════════════════════════════════════
router.post('/push', auth, (req, res) => {
  var body = req.body;
  var userId = req.userId;

  // 速率限制：防止滥用
  if (!sec.rateLimit('sync_push_' + userId, 30, 60000)) {
    return res.status(429).json({ error: '同步请求过于频繁，请稍后再试' });
  }

  var savedKeys = [];

  // 逐个存储各数据字段
  var fields = ['bazi', 'faith', 'preferences', 'favorites', 'deviceType'];
  for (var i = 0; i < fields.length; i++) {
    var key = fields[i];
    if (body[key] !== undefined) {
      setUserData(userId, key, body[key]);
      savedKeys.push(key);
    }
  }

  // 如果客户端传了额外的自定义数据字段，也一并存储
  var knownKeys = { bazi: 1, faith: 1, preferences: 1, favorites: 1, deviceType: 1 };
  for (var k in body) {
    if (!knownKeys[k] && body[k] !== undefined) {
      setUserData(userId, k, body[k]);
      savedKeys.push(k);
    }
  }

  // 审计日志
  db.prepare('INSERT INTO audit_logs (user_id, action, detail) VALUES (?, ?, ?)')
    .run(userId, 'sync_push', '推送数据: ' + savedKeys.join(', '));

  var status = getDataTimestamps(userId);

  res.json({
    ok: true,
    message: '数据已同步到服务端',
    savedKeys: savedKeys,
    lastSync: status.lastSync,
    version: status.version
  });
});

// ═══════════════════════════════════════════
// GET /api/sync/pull — 拉取服务端最新数据
// ═══════════════════════════════════════════
router.get('/pull', auth, (req, res) => {
  var userId = req.userId;

  var result = getUserData(userId);

  // 同时拉取 users 表中的基本资料
  var user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  var profile = null;
  if (user) {
    profile = {
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
      isSuper: !!user.is_super
    };
  }

  res.json({
    ok: true,
    profile: profile,
    data: result.data,
    lastSync: result.lastSync,
    version: result.version
  });
});

// ═══════════════════════════════════════════
// GET /api/sync/status — 检查数据版本
// ═══════════════════════════════════════════
router.get('/status', auth, (req, res) => {
  var userId = req.userId;

  var status = getDataTimestamps(userId);

  res.json({
    ok: true,
    lastSync: status.lastSync,
    version: status.version,
    timestamps: status.timestamps
  });
});

// ═══════════════════════════════════════════
// POST /api/sync/merge — 合并数据（带冲突检测）
// ═══════════════════════════════════════════
router.post('/merge', auth, (req, res) => {
  var userId = req.userId;
  var localData = req.body.data || {};
  var localTimestamps = req.body.timestamps || {};  // 客户端各字段的本地更新时间

  var serverStatus = getDataTimestamps(userId);
  var serverTimestamps = serverStatus.timestamps;
  var serverData = getUserData(userId).data;

  var serverNewer = [];    // 服务端更新的字段
  var clientNewer = [];    // 客户端更新的字段
  var conflicts = [];      // 时间戳相同但数据不同

  // 遍历客户端发来的数据
  for (var key in localData) {
    var localTime = localTimestamps[key];
    var serverTime = serverTimestamps[key];

    if (!serverTime) {
      // 服务端没有这个字段，客户端是新的
      setUserData(userId, key, localData[key]);
      clientNewer.push(key);
    } else if (!localTime) {
      // 客户端没有时间戳，服务端有数据
      serverNewer.push(key);
    } else if (localTime > serverTime) {
      // 客户端更新，保存到服务端
      setUserData(userId, key, localData[key]);
      clientNewer.push(key);
    } else if (localTime < serverTime) {
      // 服务端更新
      serverNewer.push(key);
    } else {
      // 时间戳相同，比较数据
      var serverValue = serverData[key];
      if (JSON.stringify(serverValue) !== JSON.stringify(localData[key])) {
        conflicts.push(key);
      }
    }
  }

  // 遍历服务端有但客户端没传的字段
  for (var sk in serverTimestamps) {
    if (localData[sk] === undefined) {
      serverNewer.push(sk);
    }
  }

  // 审计日志
  var detail = '合并: 服务端更新[' + serverNewer.join(',') + '] 客户端更新[' + clientNewer.join(',') + '] 冲突[' + conflicts.join(',') + ']';
  db.prepare('INSERT INTO audit_logs (user_id, action, detail) VALUES (?, ?, ?)')
    .run(userId, 'sync_merge', detail);

  // 构建响应
  var response = {
    ok: true,
    serverNewer: serverNewer,
    clientNewer: clientNewer,
    conflicts: conflicts
  };

  // 如果有冲突，返回两边的冲突数据让客户端选择
  if (conflicts.length > 0) {
    response.conflictData = {};
    for (var ci = 0; ci < conflicts.length; ci++) {
      var ck = conflicts[ci];
      response.conflictData[ck] = {
        server: serverData[ck],
        client: localData[ck]
      };
    }
    response.message = '存在数据冲突，请选择保留哪个版本';
  } else if (serverNewer.length > 0) {
    // 返回服务端更新的数据
    response.serverData = {};
    for (var si = 0; si < serverNewer.length; si++) {
      response.serverData[serverNewer[si]] = serverData[serverNewer[si]];
    }
    response.message = '服务端有更新数据，请更新本地';
  } else if (clientNewer.length > 0) {
    response.message = '本地数据已同步到服务端';
  } else {
    response.message = '数据已是最新，无需同步';
  }

  // 更新 lastSync
  var latestStatus = getDataTimestamps(userId);
  response.lastSync = latestStatus.lastSync;
  response.version = latestStatus.version;

  res.json(response);
});

module.exports = router;
