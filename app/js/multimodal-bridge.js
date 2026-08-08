/**
 * R478-B: 多模态桥接器
 * 功能：统一消息格式 + 语音/文字互转 + 数据可视化 + 消息路由
 */

// ─── 统一消息格式 ──────────────────────────────────────────────
/**
 * NormalizedMessage: { id, type, content, metadata, timestamp, agent }
 * type: text|voice|image|data|chart
 */

function createMessage(type, content, metadata = {}, agent = 'assistant') {
  if (!multimodalBridge._msgSeq) multimodalBridge._msgSeq = 0;
  multimodalBridge._msgSeq++;
  try {
    return {
      id: 'msg-' + Date.now() + '-' + (multimodalBridge._msgSeq % 100000).toString(36),
      type: type || 'text',
      content: content || '',
      metadata: {
        contentType: metadata.contentType || '',
        source: metadata.source || 'user',
        duration: metadata.duration || null,
        size: metadata.size || null,
        dimensions: metadata.dimensions || null,
        chartType: metadata.chartType || null,
        dataPoints: metadata.dataPoints || null,
        language: metadata.language || 'zh-CN',
        ...metadata,
      },
      timestamp: Date.now(),
      agent: agent,
    };
  } catch (e) {
    return { id: 'msg-err', type: 'text', content: String(content), metadata: {}, timestamp: Date.now(), agent };
  }
}

// ─── 语音转文字 ─────────────────────────────────────────────────
let _recognition = null;

function voiceToText(options = {}) {
  return new Promise((resolve, reject) => {
    try {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) {
        reject(new Error('当前浏览器不支持语音识别'));
        return;
      }

      _recognition = new SR();
      _recognition.lang = options.lang || 'zh-CN';
      _recognition.interimResults = options.interimResults !== false;
      _recognition.continuous = options.continuous || false;
      _recognition.maxAlternatives = options.maxAlternatives || 1;

      let finalTranscript = '';
      let interimTranscript = '';

      _recognition.onresult = function(event) {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interim += transcript;
          }
        }
        if (options.onInterim && interim) {
          try { options.onInterim(interim); } catch (e) {}
        }
        if (finalTranscript && options.onFinal) {
          try { options.onFinal(finalTranscript); } catch (e) {}
        }
      };

      _recognition.onerror = function(event) {
        const err = new Error('语音识别错误: ' + (event.error || 'unknown'));
        err.code = event.error;
        if (options.onError) { try { options.onError(err); } catch (e) {} }
        reject(err);
      };

      _recognition.onend = function() {
        if (finalTranscript) {
          const msg = createMessage('voice', finalTranscript, { language: _recognition.lang, source: 'microphone' });
          resolve(msg);
        } else if (!finalTranscript && !interimTranscript) {
          reject(new Error('未识别到语音内容'));
        }
      };

      _recognition.start();
      if (options.timeout) {
        setTimeout(() => {
          if (_recognition) {
            try { _recognition.stop(); } catch (e) {}
          }
        }, options.timeout);
      }
    } catch (e) {
      reject(e);
    }
  });
}

function stopVoiceToText() {
  if (_recognition) {
    try { _recognition.stop(); } catch (e) {}
    _recognition = null;
  }
}

// ─── 文字转语音 ─────────────────────────────────────────────────
function textToVoice(text, options = {}) {
  try {
    if (typeof VoiceEngine !== 'undefined' && VoiceEngine && typeof VoiceEngine.speak === 'function') {
      return VoiceEngine.speak(text, {
        lang: options.lang || 'zh-CN',
        rate: options.rate || 1.0,
        pitch: options.pitch || 1.0,
        volume: options.volume || 1.0,
      });
    }
    if (typeof window.speakText === 'function') {
      return window.speakText(text, { lang: options.lang || 'zh-CN', rate: options.rate || 1.0 });
    }
    // 原生 Web Speech API 兜底
    if ('speechSynthesis' in window) {
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = options.lang || 'zh-CN';
      utter.rate = options.rate || 1.0;
      utter.pitch = options.pitch || 1.0;
      utter.volume = options.volume || 1.0;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
      return Promise.resolve();
    }
    return Promise.reject(new Error('无可用语音引擎'));
  } catch (e) {
    return Promise.reject(e);
  }
}

function stopTextToVoice() {
  try {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    if (typeof VoiceEngine !== 'undefined' && VoiceEngine && typeof VoiceEngine.stop === 'function') {
      VoiceEngine.stop();
    }
  } catch (e) {}
}

// ─── 数据可视化 ─────────────────────────────────────────────────
const CHART_COLORS = ['#c9a84c', '#a78bfa', '#22d3ee', '#27ae60', '#f44336', '#e8cc7a', '#ec4899', '#f59e0b'];

function dataToChart(canvas, data, chartType = 'line', options = {}) {
  try {
    if (!canvas || !(canvas instanceof HTMLCanvasElement)) {
      console.warn('[dataToChart] 无效的 canvas 元素');
      return null;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.warn('[dataToChart] 无法获取 canvas context');
      return null;
    }

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width || 280;
    const h = rect.height || 180;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    // 背景
    ctx.fillStyle = 'rgba(8,8,8,0.6)';
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, 8);
    ctx.fill();

    // 网格线
    ctx.strokeStyle = 'rgba(201,168,76,0.08)';
    ctx.lineWidth = 0.5;
    for (let i = 1; i < 4; i++) {
      const y = (h / 4) * i;
      ctx.beginPath();
      ctx.moveTo(20, y);
      ctx.lineTo(w - 10, y);
      ctx.stroke();
    }

    if (!data || !data.length) {
      ctx.fillStyle = '#888';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('暂无数据', w / 2, h / 2);
      return canvas;
    }

    const pad = { top: 20, right: 20, bottom: 30, left: 40 };
    const chartW = w - pad.left - pad.right;
    const chartH = h - pad.top - pad.bottom;

    const vals = data.map(d => typeof d === 'object' ? (d.value || d.y || 0) : d);
    const max = Math.max(...vals, 1);
    const min = Math.min(...vals, 0);
    const range = max - min || 1;

    const labelFn = options.labelFn || ((d, i) => typeof d === 'object' ? (d.label || d.x || '') : '');

    switch (chartType) {
      case 'pie':
      case 'donut':
        _drawPie(ctx, data, w, h, chartType === 'donut');
        break;
      case 'bar':
        _drawBar(ctx, data, vals, max, min, range, chartW, chartH, pad, labelFn);
        break;
      case 'line':
      default:
        _drawLine(ctx, data, vals, max, min, range, chartW, chartH, pad, labelFn, options);
        break;
    }

    return canvas;
  } catch (e) {
    console.warn('[dataToChart] 绘制失败:', e.message);
    return null;
  }
}

function _drawLine(ctx, data, vals, max, min, range, chartW, chartH, pad, labelFn, options) {
  const w = chartW + pad.left + pad.right;
  const h = chartH + pad.top + pad.bottom;
  const points = vals.map((v, i) => ({
    x: pad.left + (i / Math.max(vals.length - 1, 1)) * chartW,
    y: pad.top + chartH - ((v - min) / range) * chartH,
  }));

  // 渐变填充
  const gradient = ctx.createLinearGradient(0, pad.top, 0, pad.top + chartH);
  gradient.addColorStop(0, 'rgba(201,168,76,0.2)');
  gradient.addColorStop(1, 'rgba(201,168,76,0.01)');

  ctx.beginPath();
  ctx.moveTo(points[0].x, pad.top + chartH);
  points.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.lineTo(points[points.length - 1].x, pad.top + chartH);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  // 线
  ctx.beginPath();
  ctx.strokeStyle = '#c9a84c';
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.stroke();

  // 点
  points.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#c9a84c';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
    ctx.fillStyle = '#080808';
    ctx.fill();
  });

  // X 轴标签
  ctx.fillStyle = '#8a7e6a';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  data.forEach((d, i) => {
    if (vals.length <= 8 || i % Math.ceil(vals.length / 6) === 0) {
      const x = pad.left + (i / Math.max(vals.length - 1, 1)) * chartW;
      const label = labelFn(d, i);
      if (label) ctx.fillText(String(label).slice(0, 4), x, h - 8);
    }
  });
}

function _drawBar(ctx, data, vals, max, min, range, chartW, chartH, pad, labelFn) {
  const barW = Math.max(4, (chartW / vals.length) * 0.65);
  const gap = chartW / vals.length;

  vals.forEach((v, i) => {
    const barH = ((v - min) / range) * chartH;
    const x = pad.left + i * gap + (gap - barW) / 2;
    const y = pad.top + chartH - barH;

    const colorIdx = i % CHART_COLORS.length;
    ctx.fillStyle = CHART_COLORS[colorIdx];
    ctx.beginPath();
    ctx.roundRect(x, y, barW, barH, 3);
    ctx.fill();

    const label = labelFn(data[i], i);
    if (label && vals.length <= 12) {
      ctx.fillStyle = '#8a7e6a';
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(label).slice(0, 4), x + barW / 2, pad.top + chartH + 12);
    }
  });
}

function _drawPie(ctx, data, w, h, isDonut) {
  const total = data.reduce((s, d) => s + (typeof d === 'object' ? (d.value || d.y || 1) : d), 0);
  if (total === 0) return;
  const cx = w / 2;
  const cy = h / 2;
  const outerR = Math.min(w, h) / 2 - 20;
  const innerR = isDonut ? outerR * 0.55 : 0;
  let angle = -Math.PI / 2;

  data.forEach((d, i) => {
    const val = typeof d === 'object' ? (d.value || d.y || 0) : d;
    const sliceAngle = (val / total) * Math.PI * 2;
    const color = CHART_COLORS[i % CHART_COLORS.length];

    ctx.beginPath();
    ctx.moveTo(cx + innerR * Math.cos(angle), cy + innerR * Math.sin(angle));
    ctx.arc(cx, cy, outerR, angle, angle + sliceAngle);
    ctx.arc(cx, cy, innerR, angle + sliceAngle, angle, true);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    // 标签
    if (data.length <= 8 && sliceAngle > 0.3) {
      const mid = angle + sliceAngle / 2;
      const lx = cx + (outerR * 0.65) * Math.cos(mid);
      const ly = cy + (outerR * 0.65) * Math.sin(mid);
      ctx.fillStyle = '#fff';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      const label = typeof d === 'object' ? (d.label || '') : '';
      ctx.fillText(label || '', lx, ly);
    }

    angle += sliceAngle;
  });
}

// ─── 消息路由 ───────────────────────────────────────────────────
const ROUTER_RENDERERS = {
  text: 'renderTextMessage',
  voice: 'renderVoiceMessage',
  image: 'renderImageMessage',
  data: 'renderDataMessage',
  chart: 'renderChartMessage',
};

/**
 * route(message, container)
 * 根据消息类型选择渲染器并渲染到容器
 */
function route(message, container) {
  try {
    if (!message || !container) return null;
    const rendererFn = ROUTER_RENDERERS[message.type] || 'renderTextMessage';
    const el = _dispatchRender(message, rendererFn, container);
    if (el) {
      container.appendChild(el);
      container.scrollTop = container.scrollHeight;
    }
    return el;
  } catch (e) {
    console.warn('[MultimodalBridge] 路由失败:', e.message);
    return null;
  }
}

function _dispatchRender(message, rendererFn, container) {
  try {
    switch (rendererFn) {
      case 'renderTextMessage':
        return renderTextMessage(message);
      case 'renderVoiceMessage':
        return renderVoiceMessage(message);
      case 'renderImageMessage':
        return renderImageMessage(message);
      case 'renderDataMessage':
        return renderDataMessage(message);
      case 'renderChartMessage':
        return renderChartMessage(message);
      default:
        return renderTextMessage(message);
    }
  } catch (e) {
    const fallback = document.createElement('div');
    fallback.className = 'mb-msg mb-fallback';
    fallback.innerHTML = '<div class="mb-b">' + esc(message.content || '消息内容') + '</div>';
    return fallback;
  }
}

function renderTextMessage(msg) {
  const d = document.createElement('div');
  const cls = msg.agent === 'user' ? 'mb-msg mb-user' : 'mb-msg mb-ai';
  d.className = cls;
  d.innerHTML = '<div class="mb-b">' + esc(msg.content) + '</div>';
  d.setAttribute('data-msg-id', msg.id);
  d.setAttribute('data-msg-type', msg.type);
  return d;
}

function renderVoiceMessage(msg) {
  const d = document.createElement('div');
  d.className = 'mb-msg mb-user';
  const dur = msg.metadata.duration ? ` ${msg.metadata.duration.toFixed(1)}s` : '';
  d.innerHTML = `<div class="mb-b"><span class="mb-voice-icon">🎤</span> <span class="mb-voice-text">${esc(msg.content)}</span><span class="mb-voice-dur" style="font-size:10px;opacity:.6;margin-left:6px">${dur}</span></div>`;
  d.setAttribute('data-msg-id', msg.id);
  d.setAttribute('data-msg-type', 'voice');
  return d;
}

function renderImageMessage(msg) {
  const d = document.createElement('div');
  d.className = 'mb-msg mb-user';
  const src = msg.metadata.url || msg.content;
  const dims = msg.metadata.dimensions ? `<span style="font-size:10px;opacity:.5;margin-left:4px">${msg.metadata.dimensions}</span>` : '';
  d.innerHTML = `<div class="mb-b"><img src="${esc(src)}" class="mb-img" style="max-width:200px;border-radius:8px;border:1px solid rgba(201,168,76,.2)">${dims}</div>`;
  d.setAttribute('data-msg-id', msg.id);
  d.setAttribute('data-msg-type', 'image');
  return d;
}

function renderDataMessage(msg) {
  const d = document.createElement('div');
  d.className = 'mb-msg mb-ai';
  if (!multimodalBridge._chartSeq) multimodalBridge._chartSeq = 0;
  multimodalBridge._chartSeq++;
  const chartId = 'mb-chart-' + Date.now() + '-' + (multimodalBridge._chartSeq % 100000).toString(36);
  const meta = msg.metadata || {};
  d.innerHTML = `<div class="mb-b"><div class="mb-data-label">📊 数据</div>${esc(msg.content)}<canvas id="${chartId}" class="mb-chart-canvas" width="280" height="160" style="margin-top:8px;width:100%;max-width:280px;border-radius:6px"></canvas></div>`;
  d.setAttribute('data-msg-id', msg.id);
  d.setAttribute('data-msg-type', 'data');

  // 异步绘制图表
  setTimeout(() => {
    const canvas = document.getElementById(chartId);
    if (canvas && meta.dataPoints) {
      dataToChart(canvas, meta.dataPoints, meta.chartType || 'bar');
    }
  }, 50);
  return d;
}

function renderChartMessage(msg) {
  const d = document.createElement('div');
  d.className = 'mb-msg mb-ai';
  if (!multimodalBridge._chartSeq) multimodalBridge._chartSeq = 0;
  multimodalBridge._chartSeq++;
  const chartId = 'mb-chart-' + Date.now() + '-' + (multimodalBridge._chartSeq % 100000).toString(36);
  const meta = msg.metadata || {};
  d.innerHTML = `<div class="mb-b"><div class="mb-data-label">📈 可视化</div><canvas id="${chartId}" class="mb-chart-canvas" width="280" height="180" style="margin-top:8px;width:100%;max-width:280px;border-radius:6px"></canvas></div>`;
  d.setAttribute('data-msg-id', msg.id);
  d.setAttribute('data-msg-type', 'chart');

  setTimeout(() => {
    const canvas = document.getElementById(chartId);
    if (canvas && meta.dataPoints) {
      dataToChart(canvas, meta.dataPoints, meta.chartType || 'line');
    }
  }, 50);
  return d;
}

// ─── 导出 ──────────────────────────────────────────────────────
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    MultimodalBridge: { createMessage, route, voiceToText, textToVoice, dataToChart, stopVoiceToText, stopTextToVoice },
    createMessage,
    voiceToText,
    textToVoice,
    dataToChart,
    route,
    renderTextMessage,
    renderVoiceMessage,
    renderImageMessage,
    renderDataMessage,
    renderChartMessage,
    stopVoiceToText,
    stopTextToVoice,
  };
}
