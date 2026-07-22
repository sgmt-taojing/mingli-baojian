// R44-C 智能眼镜设备模拟器
// 用途: 模拟 GLASS_BASE_URL (http://127.0.0.1:8787) 的设备端 HTTP 服务
// 启动: node scripts/glass-device-simulator.js [port=8787]
// 让 glass_proxy 调用时返回真实数据, 验证全链路

const http = require('http');

const PORT = parseInt(process.argv[2] || process.env.GLASS_SIM_PORT || 8787);

let vitals = { heart_rate: 72, body_temp: 36.5, steps: 8543, timestamp: Date.now() };
let spoken = []; // 历史 TTS 记录
let yearly_pushes = []; // 历史 yearly-push 记录

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function now() { return new Date().toISOString(); }

function readBody(req) {
  return new Promise(resolve => {
    let buf = '';
    req.on('data', c => buf += c);
    req.on('end', () => { try { resolve(JSON.parse(buf||'{}')); } catch { resolve({}); } });
  });
}

function reply(res, code, body) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

const server = http.createServer(async (req, res) => {
  const url = req.url.split('?')[0];
  const method = req.method;

  console.log(`[${now()}] ${method} ${url}`);

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (method === 'OPTIONS') return reply(res, 200, { ok: true });

  if (url === '/status' && method === 'GET') {
    return reply(res, 200, {
      online: true,
      device: 'GlassSim-Mini',
      firmware: 'sim-1.0.0',
      uptime_sec: process.uptime(),
      battery_pct: rand(60, 99),
      network: 'wifi',
      ts: now()
    });
  }

  if (url === '/vitals' && method === 'GET') {
    // 模拟心率波动
    vitals.heart_rate = Math.max(60, Math.min(100, vitals.heart_rate + rand(-3, 3)));
    vitals.body_temp = 36.3 + Math.random() * 0.4;
    vitals.steps += rand(0, 5);
    vitals.timestamp = Date.now();
    return reply(res, 200, { ok: true, vitals });
  }

  if (url === '/speak' && method === 'POST') {
    const body = await readBody(req);
    const text = body.text || '';
    if (!text) return reply(res, 400, { error: 'text required' });
    spoken.push({ text, urgency: body.urgency || 'normal', ts: Date.now() });
    if (spoken.length > 100) spoken.shift();
    return reply(res, 200, { ok: true, spoken_at: Date.now(), queue_len: spoken.length });
  }

  if (url === '/face-scan' && method === 'POST') {
    const body = await readBody(req);
    return reply(res, 200, {
      ok: true,
      scan_id: 'scan-' + Date.now(),
      features: {
        face_shape: ['oval','round','square'][rand(0,2)],
        age_estimate: rand(20, 60),
        confidence: 0.7 + Math.random() * 0.3
      },
      hint: '（模拟数据，真实场景需 AI 视觉引擎）'
    });
  }

  if (url === '/yearly-push' && method === 'POST') {
    const body = await readBody(req);
    yearly_pushes.push({ userId: body.userId, year: body.year, summary: body.summary?.substring(0,50)||'', ts: Date.now() });
    return reply(res, 200, { ok: true, pushed: true, history_len: yearly_pushes.length });
  }

  if (url === '/history' && method === 'GET') {
    return reply(res, 200, { ok: true, spoken: spoken.slice(-10), yearly_pushes: yearly_pushes.slice(-10) });
  }

  reply(res, 404, { error: 'unknown endpoint', known: ['/status','/vitals','/speak','/face-scan','/yearly-push','/history'] });
});

server.listen(PORT, () => {
  console.log('========================================');
  console.log('  智能眼镜设备模拟器已启动');
  console.log(`  端口: ${PORT}`);
  console.log(`  端点: /status /vitals /speak /face-scan /yearly-push /history`);
  console.log('  启动主 API 后访问 /api/glass/* 会代理到此服务');
  console.log('========================================');
});

process.on('SIGINT', () => { console.log('\n关闭...'); server.close(); process.exit(0); });
