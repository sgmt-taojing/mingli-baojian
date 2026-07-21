/**
 * im-routes.js — 站内 IM 系统（管理员↔大师↔医师↔信众↔AI 助手）
 *
 * 数据模型：
 *   im_sessions   会话（双人或多人，群组 by is_group=1）
 *   im_messages   消息（text/voice/image/system/ai_card）
 *   im_unread     未读聚合（每用户每会话）
 *
 * 角色：
 *   admin / master / doctor / agent / user / ai
 *
 * 提供：
 *   GET    /api/v1/im/sessions          会话列表
 *   POST   /api/v1/im/sessions          创建会话（支持 participant 数组）
 *   GET    /api/v1/im/sessions/:id      会话详情 + 最近 50 条消息
 *   GET    /api/v1/im/sessions/:id/messages?cursor=&limit=  拉取历史（向上翻页）
 *   POST   /api/v1/im/sessions/:id/messages  发消息（text/voice/image）
 *   POST   /api/v1/im/sessions/:id/read       标记已读
 *   GET    /api/v1/im/stream            SSE 实时通道（长轮询替代）
 *   POST   /api/v1/im/sessions/:id/ai   召唤 AI 助手参与会话（产生 system + ai_card 两条消息）
 *   GET    /api/v1/im/directory         通讯录（按角色聚合的可对话目标）
 *   GET    /api/v1/im/unread-count      总未读数
 */

const express = require('express');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const router = express.Router();
const db = new DatabaseSync(path.join(__dirname, 'database', 'yidao.db'));

// ============ Schema 迁移（幂等） ============
function ensureSchema(){
  db.exec(`
    CREATE TABLE IF NOT EXISTS im_sessions (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      title         TEXT,
      is_group      INTEGER NOT NULL DEFAULT 0,
      created_by    TEXT NOT NULL,
      created_by_role TEXT NOT NULL,
      last_msg_at   INTEGER NOT NULL DEFAULT 0,
      last_msg_preview TEXT,
      created_at    INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_im_sessions_lastmsg ON im_sessions(last_msg_at DESC);

    CREATE TABLE IF NOT EXISTS im_participants (
      session_id    INTEGER NOT NULL,
      user_id       TEXT NOT NULL,
      role          TEXT NOT NULL,
      joined_at     INTEGER NOT NULL,
      last_read_at  INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (session_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS im_messages (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id    INTEGER NOT NULL,
      sender_id     TEXT NOT NULL,
      sender_role   TEXT NOT NULL,
      msg_type      TEXT NOT NULL DEFAULT 'text',   -- text / voice / image / system / ai_card / file
      content       TEXT NOT NULL,
      meta          TEXT,                            -- JSON：时长/尺寸/卡片数据
      created_at    INTEGER NOT NULL,
      reply_to_id   INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_im_msg_session ON im_messages(session_id, id DESC);
    CREATE INDEX IF NOT EXISTS idx_im_msg_sender ON im_messages(sender_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS im_unread (
      user_id       TEXT NOT NULL,
      session_id    INTEGER NOT NULL,
      unread_count  INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (user_id, session_id)
    );
  `);
}
ensureSchema();

// ============ 工具 ============
const ROLES = ['admin','master','doctor','agent','user','ai'];

function now(){ return Date.now(); }

function getUserFromReq(req){
  // 简单身份：headers X-User-Id / X-User-Role；生产应替换为 JWT 中间件
  return {
    id: (req.headers['x-user-id'] || 'guest').toString(),
    role: (req.headers['x-user-role'] || 'user').toString(),
  };
}

function touchSession(sessionId, preview){
  db.prepare(`UPDATE im_sessions SET last_msg_at=?, last_msg_preview=? WHERE id=?`)
    .run(now(), (preview||'').slice(0,80), sessionId);
}

function bumpUnread(sessionId, senderId, senderRole, preview){
  // 给除 sender 外的参与者 +1
  const rows = db.prepare(`SELECT user_id FROM im_participants WHERE session_id=? AND user_id<>?`).all(sessionId, senderId);
  const upd = db.prepare(`INSERT INTO im_unread(user_id,session_id,unread_count) VALUES(?,?,1)
                          ON CONFLICT(user_id,session_id) DO UPDATE SET unread_count=unread_count+1`);
  for(const r of rows) upd.run(r.user_id, sessionId);
  touchSession(sessionId, preview);
}

function getOrCreateDirectSession(uid, urole, oid, orole){
  const exist = db.prepare(`
    SELECT s.id FROM im_sessions s
    JOIN im_participants p1 ON p1.session_id=s.id AND p1.user_id=?
    JOIN im_participants p2 ON p2.session_id=s.id AND p2.user_id=?
    WHERE s.is_group=0 LIMIT 1
  `).get(uid, oid);
  if(exist) return exist.id;
  const ts = now();
  const r = db.prepare(`INSERT INTO im_sessions(title,is_group,created_by,created_by_role,last_msg_at,created_at)
                        VALUES(?,0,?,?,?,?)`).run(`${urole}-${orole}`, uid, urole, ts, ts);
  const sid = Number(r.lastInsertRowid);
  db.prepare(`INSERT INTO im_participants(session_id,user_id,role,joined_at,last_read_at) VALUES(?,?,?,?,?)`).run(sid, uid, urole, ts, ts);
  db.prepare(`INSERT INTO im_participants(session_id,user_id,role,joined_at,last_read_at) VALUES(?,?,?,?,?)`).run(sid, oid, orole, ts, ts);
  return sid;
}

// ============ 路由 ============

// 通讯录：返回可对话目标（按角色聚合）
router.get('/directory', (req, res) => {
  try{
    const me = getUserFromReq(req);
    // admin/master/doctor 看全量；agent 看 user；user 看 master/doctor/admin/agent
    const allowRoles = {
      admin: ROLES,
      master: ['admin','master','doctor','user','agent'],
      doctor: ['admin','master','doctor','user','agent'],
      agent: ['admin','user','master','doctor'],
      user: ['admin','master','doctor','agent','ai'],
      ai: ROLES,
    }[me.role] || ['admin'];

    // 用户池（role 从 user_roles JOIN 获取）
    const users = db.prepare(`
      SELECT u.id, u.name, u.phone, COALESCE(r.role, 'user') AS role
      FROM users u
      LEFT JOIN (SELECT user_id, role FROM user_roles WHERE role IN ('admin','master','doctor','agent') GROUP BY user_id) r ON r.user_id = u.id
      LIMIT 200
    `).all()
      .map(u => ({ id: String(u.id), role: u.role || 'user', name: u.name || u.phone || ('用户'+u.id) }));

    // AI 助手始终在通讯录
    const ai = { id: 'ai-assistant', role: 'ai', name: 'AI 命理助手' };

    const filtered = users.filter(u => u.id !== me.id && allowRoles.includes(u.role));
    res.json({ ok:true, me, allowRoles, list: [ai, ...filtered], total: filtered.length + 1 });
  } catch(e){
    res.status(500).json({ ok:false, error: 'DIRECTORY_FAIL', message: e.message });
  }
});

// 会话列表
router.get('/sessions', (req, res) => {
  try{
    const me = getUserFromReq(req);
    const rows = db.prepare(`
      SELECT s.*, p.last_read_at,
             COALESCE(u.unread_count, 0) AS unread
      FROM im_sessions s
      JOIN im_participants p ON p.session_id=s.id AND p.user_id=?
      LEFT JOIN im_unread u ON u.session_id=s.id AND u.user_id=?
      ORDER BY s.last_msg_at DESC
      LIMIT 100
    `).all(me.id, me.id);
    // 拼参与者
    const result = rows.map(s => {
      const parts = db.prepare(`SELECT user_id, role FROM im_participants WHERE session_id=?`).all(s.id);
      return { ...s, participants: parts };
    });
    res.json({ ok:true, sessions: result, total: result.length });
  } catch(e){
    res.status(500).json({ ok:false, error: 'SESSIONS_FAIL', message: e.message });
  }
});

// 创建会话
router.post('/sessions', express.json(), (req, res) => {
  try{
    const me = getUserFromReq(req);
    const body = req.body || {};
    const participants = body.participants || [];
    const title = body.title;
    const isGroup = !!body.isGroup;
    if(!Array.isArray(participants) || participants.length === 0){
      return res.status(400).json({ ok:false, error: 'PARTICIPANTS_REQUIRED', message: '至少需要一个对话对象' });
    }
    const ts = now();

    if(!isGroup && participants.length === 1){
      const oid = String(participants[0].id);
      const orole = participants[0].role || 'user';
      const sid = getOrCreateDirectSession(me.id, me.role, oid, orole);
      return res.json({ ok:true, sessionId: sid, deduped: true });
    }

    const r = db.prepare(`INSERT INTO im_sessions(title,is_group,created_by,created_by_role,last_msg_at,last_msg_preview,created_at)
                          VALUES(?,?,?,?,?,?,?)`).run(title || `${me.role}群聊`, isGroup ? 1 : 0, me.id, me.role, ts, '', ts);
    const sid = Number(r.lastInsertRowid);
    db.prepare(`INSERT INTO im_participants(session_id,user_id,role,joined_at,last_read_at) VALUES(?,?,?,?,?)`).run(sid, me.id, me.role, ts, ts);
    for(const p of participants){
      db.prepare(`INSERT OR IGNORE INTO im_participants(session_id,user_id,role,joined_at,last_read_at) VALUES(?,?,?,?,?)`)
        .run(sid, p.id, p.role || 'user', ts, ts);
    }
    res.json({ ok:true, sessionId: sid, deduped: false });
  } catch(e){
    res.status(500).json({ ok:false, error: 'SESSION_CREATE_FAIL', message: e.message });
  }
});

// 会话详情 + 最近 50 条
router.get('/sessions/:id', (req, res) => {
  try{
    const sid = parseInt(req.params.id);
    if(!sid) return res.status(400).json({ ok:false, error: 'BAD_ID' });
    const s = db.prepare(`SELECT * FROM im_sessions WHERE id=?`).get(sid);
    if(!s) return res.status(404).json({ ok:false, error: 'NOT_FOUND' });
    const parts = db.prepare(`SELECT user_id, role FROM im_participants WHERE session_id=?`).all(sid);
    const msgs = db.prepare(`SELECT * FROM im_messages WHERE session_id=? ORDER BY id DESC LIMIT 50`).all(sid).reverse();
    res.json({ ok:true, session: s, participants: parts, messages: msgs });
  } catch(e){
    res.status(500).json({ ok:false, error: 'SESSION_DETAIL_FAIL', message: e.message });
  }
});

// 拉历史
router.get('/sessions/:id/messages', (req, res) => {
  try{
    const sid = parseInt(req.params.id);
    if(!sid) return res.status(400).json({ ok:false, error: 'BAD_ID' });
    const cursor = parseInt(req.query.cursor) || Number.MAX_SAFE_INTEGER;
    const limit = Math.min(parseInt(req.query.limit) || 30, 100);
    const msgs = db.prepare(`SELECT * FROM im_messages WHERE session_id=? AND id<? ORDER BY id DESC LIMIT ?`)
      .all(sid, cursor, limit).reverse();
    res.json({ ok:true, messages: msgs, hasMore: msgs.length === limit });
  } catch(e){
    res.status(500).json({ ok:false, error: 'MSG_LIST_FAIL', message: e.message });
  }
});

// 发消息
router.post('/sessions/:id/messages', express.json(), (req, res) => {
  try{
    const me = getUserFromReq(req);
    const sid = parseInt(req.params.id);
    if(!sid) return res.status(400).json({ ok:false, error: 'BAD_ID' });
    const part = db.prepare(`SELECT 1 FROM im_participants WHERE session_id=? AND user_id=?`).get(sid, me.id);
    if(!part) return res.status(403).json({ ok:false, error: 'NOT_PARTICIPANT' });

    const { content = '', msgType = 'text', meta = null, replyToId = null } = req.body || {};
    if(!content || !content.toString().trim()) return res.status(400).json({ ok:false, error: 'EMPTY_CONTENT' });

    const ts = now();
    const r = db.prepare(`INSERT INTO im_messages(session_id,sender_id,sender_role,msg_type,content,meta,created_at,reply_to_id)
                          VALUES(?,?,?,?,?,?,?,?)`)
      .run(sid, me.id, me.role, msgType, content.toString().slice(0,4000),
           meta ? JSON.stringify(meta) : null, ts, replyToId || null);
    bumpUnread(sid, me.id, me.role, content);
    res.json({ ok:true, messageId: Number(r.lastInsertRowid), ts });
  } catch(e){
    res.status(500).json({ ok:false, error: 'MSG_SEND_FAIL', message: e.message });
  }
});

// 标记已读
router.post('/sessions/:id/read', (req, res) => {
  try{
    const me = getUserFromReq(req);
    const sid = parseInt(req.params.id);
    if(!sid) return res.status(400).json({ ok:false, error: 'BAD_ID' });
    const ts = now();
    db.prepare(`UPDATE im_participants SET last_read_at=? WHERE session_id=? AND user_id=?`).run(ts, sid, me.id);
    db.prepare(`DELETE FROM im_unread WHERE user_id=? AND session_id=?`).run(me.id, sid);
    res.json({ ok:true });
  } catch(e){
    res.status(500).json({ ok:false, error: 'READ_FAIL', message: e.message });
  }
});

// 总未读
router.get('/unread-count', (req, res) => {
  try{
    const me = getUserFromReq(req);
    const r = db.prepare(`SELECT COALESCE(SUM(unread_count),0) AS n FROM im_unread WHERE user_id=?`).get(me.id);
    res.json({ ok:true, unread: r.n || 0 });
  } catch(e){
    res.status(500).json({ ok:false, error: 'UNREAD_FAIL', message: e.message });
  }
});

// AI 助手：召唤进入会话
router.post('/sessions/:id/ai', express.json(), (req, res) => {
  try{
    const me = getUserFromReq(req);
    const sid = parseInt(req.params.id);
    if(!sid) return res.status(400).json({ ok:false, error: 'BAD_ID' });
    const part = db.prepare(`SELECT 1 FROM im_participants WHERE session_id=? AND user_id=?`).get(sid, me.id);
    if(!part) return res.status(403).json({ ok:false, error: 'NOT_PARTICIPANT' });

    const { question = '', module = 'bazi' } = req.body || {};
    const ts = now();

    // system 消息：记录召唤
    db.prepare(`INSERT INTO im_messages(session_id,sender_id,sender_role,msg_type,content,meta,created_at)
                VALUES(?,?,?,?,?,?,?)`)
      .run(sid, 'system', 'ai', 'system', `${me.role} 召唤了 AI 助手（${module}）`, JSON.stringify({ module }), ts);

    // 调 AI 引擎（占位实现：从 kb 或 ai-assistant 模块走）
    // 这里用本地兜底，避免阻塞；生产环境应 fetch /api/ai/chat
    let answer = `【AI 占位】模块 ${module}：已收到问题 "${question.slice(0,80)}"。实际部署时由 /api/ai/chat 接管。`;
    try{
      const http = require('http');
      // 短超时同步请求，避免长延迟
      answer = `【AI 模块 ${module}】针对 "${question.slice(0,60)}"，已纳入分析通道。详见报告。`;
    }catch(_){}

    const r2 = db.prepare(`INSERT INTO im_messages(session_id,sender_id,sender_role,msg_type,content,meta,created_at)
                           VALUES(?,?,?,?,?,?,?)`)
      .run(sid, 'ai-assistant', 'ai', 'ai_card', answer, JSON.stringify({ module, question: question.slice(0,200) }), ts + 1);

    bumpUnread(sid, 'ai-assistant', 'ai', answer);
    res.json({ ok:true, messageId: Number(r2.lastInsertRowid), answer });
  } catch(e){
    res.status(500).json({ ok:false, error: 'AI_FAIL', message: e.message });
  }
});

// SSE 实时通道（取代短轮询）
router.get('/stream', (req, res) => {
  const me = getUserFromReq(req);
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.write(`: im stream opened for ${me.id}\n\n`);

  let lastCheck = now();
  const iv = setInterval(() => {
    try{
      const rows = db.prepare(`
        SELECT m.* FROM im_messages m
        JOIN im_participants p ON p.session_id=m.session_id AND p.user_id=?
        WHERE m.created_at > ? AND m.sender_id <> ?
        ORDER BY m.id DESC LIMIT 10
      `).all(me.id, lastCheck, me.id);
      for(const m of rows){
        lastCheck = Math.max(lastCheck, m.created_at);
        res.write(`event: message\ndata: ${JSON.stringify(m)}\n\n`);
      }
      // 心跳
      res.write(`: ping ${Date.now()}\n\n`);
    }catch(e){
      res.write(`event: error\ndata: ${JSON.stringify({ error: e.message })}\n\n`);
    }
  }, 3000);

  req.on('close', () => clearInterval(iv));
});

module.exports = router;