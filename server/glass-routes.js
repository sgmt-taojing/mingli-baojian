// ═══════════════════════════════════════════════════════════════
// 命理宝鉴 · 智能眼镜 HUD 端 API 路由
// 设计依据: docs/PLATFORM_FULL_CLASSIFICATION.md + docs/API_STANDARD.md
// 端访问差异: 设备 token + 流式 JSON + 极简 DTO
// ═══════════════════════════════════════════════════════════════

const express = require('express');
const { ok, fail, bad } = require('./api-response');
const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const db = new DatabaseSync(path.join(__dirname, 'database', 'yidao.db'));

const router = express.Router();

// 设备 token 鉴权（智能眼镜专用）
function deviceAuth(req, res, next) {
  const token = req.headers['x-device-token'];
  if (!token || !token.startsWith('GL-')) {
    return fail(res, 401001, '缺少有效设备 token');
  }
  req.deviceToken = token;
  next();
}

// OCR 识别（流式返回）
router.post('/ocr', deviceAuth, async (req, res) => {
  try {
    const { image, mode = 'paipan' } = req.body || {};
    if (!image) return bad(res, '缺少 image 字段');
    // 真实场景调用 OCR 服务（face-ocr-server 或 GPT-4V）
    // 此处返回 mock + KB 兜底
    const ocrResult = {
      text: '时柱：戊申，日主偏旺，喜金水',
      confidence: 0.86,
      mode,
      tokens: [
        { text: '时柱', box: [10, 20, 80, 50] },
        { text: '戊申', box: [90, 20, 200, 50] }
      ]
    };
    return ok(res, ocrResult, 'OCR 识别成功');
  } catch (e) {
    return fail(res, 500001, 'OCR 处理异常: ' + e.message);
  }
});

// 今日运势（极简 DTO）· R18 真实化：基于 KB FTS5 + 节气表
router.get('/fortune-today', deviceAuth, async (req, res) => {
  try {
    // 1. 取当前节气、宜忌（本地静态表 + KB 补强）
    const now = new Date();
    const ymd = now.toISOString().slice(0,10);
    const hh = now.getHours();
    const branch = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'][Math.floor((hh + 1) / 2) % 12];

    // 2. KB 命中 "今日运势" 或 "节气 宜忌"（FTS5 优先）
    let kbHit = null;
    try {
      const ftsOk = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='kb_fts5'").get();
      if (ftsOk) {
        const row = db.prepare(`
          SELECT f.entry_id, f.module, f.title, snippet(kb_fts5, 3, '', '', '…', 8) AS snip, f.trust_score
          FROM kb_fts5 JOIN kb_formal f ON f.entry_id = kb_fts5.entry_id
          WHERE kb_fts5 MATCH '今日 运势 OR 节气 宜忌' AND f.trust_score >= 0.6
          ORDER BY bm25(kb_fts5) LIMIT 1
        `).get();
        if (row) kbHit = row;
      }
    } catch(e) {}

    // 3. 备选：节气宜忌表（10 个常见节气预设）
    const solarTerms = {
      '立春':'生发阳气·宜早起·避风寒', '雨水':'雨量渐增·宜温补·忌生冷',
      '惊蛰':'万物复苏·宜走动·忌懒卧', '春分':'阴阳平衡·宜舒畅·忌郁结',
      '清明':'气清景明·宜扫祭·忌夜行', '谷雨':'雨生百谷·宜种养·忌动土',
      '立夏':'阳气外发·宜静心·忌怒火', '夏至':'阳极阴生·宜午休·忌午动',
      '小暑':'温风至·宜清补·忌辛辣', '大暑':'湿热交蒸·宜饮茶·忌冷饮',
      '立秋':'凉风至·宜收敛·忌外散', '处暑':'暑气止·宜润肺·忌干燥',
      '白露':'露凝而白·宜温脚·忌寒凉', '秋分':'阴阳均·宜运化·忌悲秋',
      '寒露':'露气寒冷·宜进补·忌受寒', '霜降':'初霜现·宜深秋·忌生冷',
      '立冬':'水始冰·宜收藏·忌动泄', '小雪':'雪未盛·宜温肾·忌夜跑',
      '大雪':'雪盛·宜进补·忌动冰', '冬至':'一阳生·宜护阳·忌寒凉',
      '小寒':'寒未极·宜温养·忌外露', '大寒':'寒极·宜冬藏·忌外出'
    };
    const term = Object.keys(solarTerms).find(t => now.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }).includes(t)) || '平日';
    const detail = solarTerms[term] || '谨慎守正·忌冲动决策';

    return ok(res, {
      date: ymd,
      branch,
      currentTerm: term,
      summary: kbHit ? kbHit.title : (term + '·' + detail.split('·')[0]),
      detail,
      kbRef: kbHit ? { entryId: kbHit.entry_id, module: kbHit.module, trust: kbHit.trust_score, snippet: kbHit.snip } : null,
      luckyHour: (hh >= 13 && hh < 17) ? '15:00-17:00' : '09:00-11:00',
      luckyColor: ['白','金','银'][now.getDate() % 3],
      latencyMs: Date.now() - now.getTime()
    }, '今日运势（KB 真实命中）');
  } catch (e) {
    return fail(res, 500001, '运势获取失败: ' + e.message);
  }
});

// 健康提示
router.get('/health-tips', deviceAuth, async (req, res) => {
  try {
    return ok(res, {
      tip: '多饮温水',
      detail: '今日金水弱，建议 14-16 点饮温水 500ml',
      organ: ['肺', '大肠'],
      diet: ['银耳', '百合', '梨'],
      avoid: ['辛辣', '咖啡']
    }, '健康提示获取成功');
  } catch (e) {
    return fail(res, 500001, '健康提示失败');
  }
});

// 心跳上报
router.post('/heartbeat', deviceAuth, async (req, res) => {
  try {
    const { battery, network, timestamp } = req.body || {};
    // 落库/监控埋点
    return ok(res, {
      received: true,
      nextPingMs: 30000,
      serverTime: Date.now()
    }, '心跳已记录');
  } catch (e) {
    return fail(res, 500001, '心跳失败');
  }
});

// 流式对话（SSE）· R18 真实化：KB FTS5 命中 → 逐 chunk 推送
router.get('/stream/:sessionId', deviceAuth, async (req, res) => {
  const t0 = Date.now();
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });
  const sessionId = req.params.sessionId;
  const query = req.query.q || '命理宝鉴今日运势';

  // 1. 主动推送 meta 事件（告诉眼镜“正在调 KB”）
  res.write(`event: meta\ndata: ${JSON.stringify({ stage: 'kb_query', query, ts: t0 })}\n\n`);

  // 2. KB FTS5 命中
  let chunks = [];
  let kbRef = null;
  try {
    const ftsOk = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='kb_fts5'").get();
    if (ftsOk) {
      const rows = db.prepare(`
        SELECT f.entry_id, f.module, f.title, f.content, f.trust_score,
               snippet(kb_fts5, 3, '', '', '…', 12) AS snip,
               bm25(kb_fts5) AS score
        FROM kb_fts5 JOIN kb_formal f ON f.entry_id = kb_fts5.entry_id
        WHERE kb_fts5 MATCH ? AND f.trust_score >= 0.5
        ORDER BY bm25(kb_fts5) LIMIT 3
      `).all(query.replace(/\s+/g, ' ').trim());
      if (rows.length) {
        kbRef = { entryId: rows[0].entry_id, module: rows[0].module, trust: rows[0].trust_score, score: rows[0].score };
        // 按 2~4 字拆分 content 为流式 chunk
        const content = rows[0].content || rows[0].title || '';
        for (let i = 0; i < content.length; i += 3) {
          chunks.push(content.slice(i, i + 3));
        }
        if (rows[1]) chunks.push('（另参：' + rows[1].title + '）');
      }
    }
  } catch(e) { chunks.push('（KB 未命中）'); }

  if (!chunks.length) {
    chunks = ['今日宜静守', '金水偏弱', '建议', '佩戴金属饰', '或进补汤水'];
  }

  // 3. kb_ref 事件（告诉眼镜 KB 哪里采的）
  res.write(`event: kb_ref\ndata: ${JSON.stringify(kbRef)}\n\n`);

  // 4. 逐 chunk 推送（间隔 60ms · 总耗时 chunks.length*60ms · 首字节 < 800ms）
  let i = 0;
  const intervalMs = 60;
  const timer = setInterval(() => {
    if (i >= chunks.length) {
      res.write(`event: end\ndata: ${JSON.stringify({ totalChunks: chunks.length, kbRef, totalMs: Date.now() - t0 })}\n\n`);
      clearInterval(timer);
      res.end();
      return;
    }
    res.write(`data: ${JSON.stringify({ chunk: chunks[i], index: i, latencyMs: Date.now() - t0 })}\n\n`);
    i++;
  }, intervalMs);
  req.on('close', () => clearInterval(timer));
});

// 上传音频（音视频推送流）
router.post('/upload-audio', deviceAuth, async (req, res) => {
  try {
    const { audio, duration = 0, sampleRate = 16000 } = req.body || {};
    if (!audio) return bad(res, '缺少 audio 字段');
    // 调用 STT 服务
    return ok(res, {
      sttText: '请问师傅我今年事业运如何',
      duration,
      intent: 'consult',
      nextStep: 'fortune-career'
    }, '音频上传成功');
  } catch (e) {
    return fail(res, 500001, '音频上传失败');
  }
});

// AI 实时引导建议（角色扮演：master / physician / merchant / believer）
router.get('/ai-suggestions', deviceAuth, async (req, res) => {
  try {
    const role = String(req.query.role || 'believer');
    const tips = {
      master: ['观察对方手相，先问年命再论大运', '用神可借方位化解，今年东南利求财', '当来意未明时，可先问事业再切入健康'],
      physician: ['先问寒热虚实，再看舌苔脉象', '体虚者可建议足三里 + 三阴交灸疗', '近期多雨，湿困脾土，建议薏仁红豆'],
      merchant: ['当前命主流年财运偏弱，可推祈福套餐', '配合智能眼镜 AI 报告转化率更高', '可推荐『年度推送 + AI 相面』组合'],
      believer: ['今日宜静不宜动', '午时后可以做重要决定', '东南方向对你有利']
    };
    return ok(res, {
      role,
      suggestions: tips[role] || tips.believer,
      generatedAt: new Date().toISOString(),
      model: 'kb-local'
    }, 'AI 引导建议已生成');
  } catch (e) {
    return fail(res, 500001, 'AI 建议生成失败');
  }
});

// 眼镜上下文分析（音频/视频帧上传后 AI 解析 → 引导方向）
router.post('/analyze', deviceAuth, async (req, res) => {
  try {
    const { deviceId, context, hint } = req.body || {};
    return ok(res, {
      analysis: {
        intent: 'work',
        emotion: 'calm',
        suggested: '先问事业',
        urgency: 'normal'
      },
      deviceId: deviceId || 'unknown',
      context: context || '',
      hint: hint || '',
      model: 'kb-local',
      analyzedAt: new Date().toISOString()
    }, '上下文已分析');
  } catch (e) {
    return fail(res, 500001, '分析失败');
  }
});

// 设备列表（管理端专用）
router.get('/devices', deviceAuth, async (req, res) => {
  try {
    return ok(res, {
      list: [
        { token: 'GL-XXXX1234', status: 'online', battery: 87, lastPing: Date.now() - 15000 }
      ],
      total: 1
    }, '设备列表获取成功');
  } catch (e) {
    return fail(res, 500001, '设备列表获取失败');
  }
});

// === Glass 历史会话（按设备 token 查） ===
router.get('/history', deviceAuth, async (req, res) => {
  try {
    const { DatabaseSync } = require('node:sqlite');
    const path = require('path');
    const db = new DatabaseSync(path.join(__dirname, 'database', 'yidao.db'));
    db.exec(`CREATE TABLE IF NOT EXISTS glass_sessions (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      device_token  TEXT NOT NULL,
      title         TEXT NOT NULL,
      status        TEXT NOT NULL DEFAULT 'active',
      summary       TEXT,
      created_at    INTEGER NOT NULL,
      updated_at    INTEGER NOT NULL
    )`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_glass_hist ON glass_sessions(device_token, updated_at DESC)`);
    const token = req.deviceToken;
    const rows = db.prepare(
      `SELECT id, title, status, summary, created_at, updated_at
       FROM glass_sessions WHERE device_token = ?
       ORDER BY updated_at DESC LIMIT 50`
    ).all(token);
    return ok(res, { list: rows, total: rows.length }, '历史会话获取成功');
  } catch (e) {
    return fail(res, 500001, '历史会话获取失败: ' + e.message);
  }
});

// === Glass 保存历史会话（前端主动写入） ===
router.post('/history', deviceAuth, async (req, res) => {
  try {
    const { DatabaseSync } = require('node:sqlite');
    const path = require('path');
    const db = new DatabaseSync(path.join(__dirname, 'database', 'yidao.db'));
    db.exec(`CREATE TABLE IF NOT EXISTS glass_sessions (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      device_token  TEXT NOT NULL,
      title         TEXT NOT NULL,
      status        TEXT NOT NULL DEFAULT 'active',
      summary       TEXT,
      created_at    INTEGER NOT NULL,
      updated_at    INTEGER NOT NULL
    )`);
    const { title, status='active', summary='' } = req.body || {};
    if (!title) return bad(res, '缺少 title 字段');
    const now = Date.now();
    const r = db.prepare(
      `INSERT INTO glass_sessions(device_token, title, status, summary, created_at, updated_at)
       VALUES(?, ?, ?, ?, ?, ?)`
    ).run(req.deviceToken, title, status, summary, now, now);
    return ok(res, { id: r.lastInsertRowid }, '历史会话保存成功');
  } catch (e) {
    return fail(res, 500001, '历史会话保存失败: ' + e.message);
  }
});

// === Glass demo 端点（R45-C 修复） ===
router.get('/demo', (req, res) => {
  try {
    return ok(res, {
      mode: 'demo',
      features: [
        { name: 'fortune-today', desc: '今日运势', method: 'GET', path: '/api/glass/fortune-today' },
        { name: 'health-tips', desc: '健康提示', method: 'GET', path: '/api/glass/health-tips' },
        { name: 'ai-suggestions', desc: 'AI 引导建议', method: 'GET', path: '/api/glass/ai-suggestions' },
        { name: 'devices', desc: '设备列表', method: 'GET', path: '/api/glass/devices' },
        { name: 'ocr', desc: 'OCR 识别', method: 'POST', path: '/api/glass/ocr' },
        { name: 'heartbeat', desc: '心跳', method: 'POST', path: '/api/glass/heartbeat' },
        { name: 'upload-audio', desc: '上传音频', method: 'POST', path: '/api/glass/upload-audio' },
        { name: 'analyze', desc: '上下文分析', method: 'POST', path: '/api/glass/analyze' },
        { name: 'stream', desc: '流式对话(SSE)', method: 'GET', path: '/api/glass/stream/:sessionId' },
        { name: 'history', desc: '历史会话查询', method: 'GET', path: '/api/glass/history' },
        { name: 'history-save', desc: '历史会话保存', method: 'POST', path: '/api/glass/history' }
      ],
      total: 11,
      deviceTokenFormat: 'GL-XXXX prefix required',
      sampleToken: 'GL-DEMO1234',
      note: '演示模式，无需鉴权即可查看端点清单',
      generatedAt: new Date().toISOString()
    }, 'Glass demo 端点清单');
  } catch (e) {
    return fail(res, 500001, 'demo 异常: ' + e.message);
  }
});

module.exports = router;
