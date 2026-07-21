// ═══════════════════════════════════════════════════════════════
// 命理宝鉴 · 智能眼镜 HUD 端 API 路由
// 设计依据: docs/PLATFORM_FULL_CLASSIFICATION.md + docs/API_STANDARD.md
// 端访问差异: 设备 token + 流式 JSON + 极简 DTO
// ═══════════════════════════════════════════════════════════════

const express = require('express');
const { ok, fail, bad } = require('./api-response');

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

// 今日运势（极简 DTO）
router.get('/fortune-today', deviceAuth, async (req, res) => {
  try {
    return ok(res, {
      summary: '宜静守',
      detail: '木旺金缺，忌冲动决策',
      wuxing: { wood: 4, fire: 1, earth: 2, metal: 0, water: 1 },
      luckyHour: '15:00-17:00',
      luckyColor: '白色'
    }, '今日运势获取成功');
  } catch (e) {
    return fail(res, 500001, '运势获取失败');
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

// 流式对话（SSE）
router.get('/stream/:sessionId', deviceAuth, async (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });
  const sessionId = req.params.sessionId;
  // 模拟流式输出
  const chunks = [
    '【排盘】', ' ', '戊申', '年', '甲寅', '月', '...', '日主偏旺', '喜金水',
    '【化解】', ' ', '佩戴金属饰', '...', '白/银色为主'
  ];
  let i = 0;
  const timer = setInterval(() => {
    if (i >= chunks.length) {
      res.write('event: end\ndata: {}\n\n');
      clearInterval(timer);
      res.end();
      return;
    }
    res.write(`data: ${JSON.stringify({ chunk: chunks[i], index: i })}\n\n`);
    i++;
  }, 200);
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

module.exports = router;