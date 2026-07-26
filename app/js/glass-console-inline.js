
const API_BASE = location.origin.includes(':8920') ? '' : 'http://localhost:8920';
const DEVICE_TOKEN = localStorage.getItem('glass-device-token') || generateDeviceToken();

function generateDeviceToken() {
  const t = 'GL-' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  localStorage.setItem('glass-device-token', t);
  return t;
}

document.getElementById('device-id').textContent = DEVICE_TOKEN.slice(0, 12);

let currentMode = 'paipan';
let mediaStream = null;
let history = [];

// 模式选择
document.querySelectorAll('.mode-card').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('active'));
    card.classList.add('active');
    currentMode = card.dataset.mode;
    showToast(`已切换到${card.querySelector('.name').textContent}模式`);
  });
});

// 拍照分析
document.getElementById('btn-capture').addEventListener('click', async () => {
  const preview = document.getElementById('camera-preview');
  if (!mediaStream) {
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 1280, height: 720 }
      });
      const video = document.createElement('video');
      video.autoplay = true;
      video.muted = true;
      video.srcObject = mediaStream;
      preview.innerHTML = '';
      preview.appendChild(video);
      const reticle = document.createElement('div');
      reticle.className = 'reticle';
      preview.appendChild(reticle);
    } catch (e) {
      showToast('摄像头启动失败: ' + e.message);
      return;
    }
  }
  preview.classList.add('capturing');

  // 截取当前帧
  const video = preview.querySelector('video');
  if (!video) return;
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  canvas.getContext('2d').drawImage(video, 0, 0);
  const imageData = canvas.toDataURL('image/jpeg', 0.7);

  // 上传 OCR
  try {
    const resp = await fetch(`${API_BASE}/api/v1/glass/ocr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': DEVICE_TOKEN,
        'X-Stream-Mode': 'json'
      },
      body: JSON.stringify({
        image: imageData,
        mode: currentMode,
        timestamp: Date.now()
      })
    });
    const json = await resp.json();
    if (json.code === 0) {
      const data = json.data || {};
      const ocrEl = document.getElementById('ocr-result');
      document.getElementById('ocr-text').textContent = data.text || '(无文字)';
      document.getElementById('ocr-confidence').textContent = `置信度: ${(data.confidence || 0).toFixed(2)}`;
      ocrEl.classList.add('show');
      addHistory('OCR', data.text);
      // TTS 播报
      if (data.text) speakText(data.text.slice(0, 60));
    } else {
      showToast('识别失败: ' + json.message);
    }
  } catch (e) {
    showToast('网络错误: ' + e.message);
  } finally {
    setTimeout(() => preview.classList.remove('capturing'), 1200);
  }
});

// 停止
document.getElementById('btn-stop').addEventListener('click', () => {
  if (mediaStream) {
    mediaStream.getTracks().forEach(t => t.stop());
    mediaStream = null;
    const preview = document.getElementById('camera-preview');
    preview.innerHTML = '<div class="placeholder"><div class="icon-big">📷</div><div>点击"拍照分析"启动摄像头</div></div>';
  }
  window.speechSynthesis?.cancel();
  document.getElementById('tts-indicator').classList.remove('show');
  showToast('已停止');
});

// 历史记录
document.getElementById('btn-history').addEventListener('click', () => {
  const list = document.getElementById('history-list');
  list.scrollIntoView({ behavior: 'smooth' });
});

function addHistory(type, content) {
  history.unshift({
    type, content,
    time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  });
  if (history.length > 5) history = history.slice(0, 5);
  const list = document.getElementById('history-list');
  list.innerHTML = history.map(h => `
    <div class="history-item">
      <div class="h-time">${h.time} · ${h.type}</div>
      <div class="h-content">${(h.content || '').slice(0, 80)}</div>
    </div>
  `).join('');
}

// TTS 播放
function speakText(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'zh-CN';
  utter.rate = 1.1;
  utter.onstart = () => document.getElementById('tts-indicator').classList.add('show');
  utter.onend = () => document.getElementById('tts-indicator').classList.remove('show');
  window.speechSynthesis.speak(utter);
}

// Toast
let toastTimer;
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2000);
}

// 启动加载运势 + 健康
async function loadDaily() {
  try {
    const [fortune, health] = await Promise.all([
      fetch(`${API_BASE}/api/v1/glass/fortune-today`, {
        headers: { 'X-Device-Token': DEVICE_TOKEN }
      }).then(r => r.json()),
      fetch(`${API_BASE}/api/v1/glass/health-tips`, {
        headers: { 'X-Device-Token': DEVICE_TOKEN }
      }).then(r => r.json())
    ]);
    if (fortune.code === 0) {
      document.getElementById('fortune-value').textContent = fortune.data?.summary || '宜静待';
      document.getElementById('fortune-meta').textContent = fortune.data?.detail || '点击刷新获取详情';
    }
    if (health.code === 0) {
      document.getElementById('health-value').textContent = health.data?.tip || '注意作息';
      document.getElementById('health-meta').textContent = health.data?.detail || '点击刷新获取详情';
    }
  } catch (e) {
    document.getElementById('fortune-value').textContent = '离线';
    document.getElementById('health-meta').textContent = '网络异常';
  }
}
loadDaily();

// 心跳上报（每 30 秒）
setInterval(async () => {
  try {
    await fetch(`${API_BASE}/api/v1/glass/heartbeat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Token': DEVICE_TOKEN },
      body: JSON.stringify({ battery: 87, network: '5G', timestamp: Date.now() })
    });
  } catch {}
}, 30000);



(function(){
  const el = document.getElementById('wearable-status');
  if (!window.deviceProvider) {
    el.textContent = '📱 PC浏览器模式'; el.style.color = 'var(--hud-muted)';
    return;
  }
  const brand = deviceProvider.detect();
  const caps  = deviceProvider.capabilities;
  const isGlass = deviceProvider.isGlass();
  el.textContent = isGlass
    ? '🥽 ' + brand + ' · ' + (caps.hasCamera?'舌诊':'') + (caps.hasAudio?'/音频':'') + (caps.hasMotion?'/姿态':'')
    : '💻 PC浏览器 / ' + brand + ' 桥接';
  el.style.color = isGlass ? 'var(--hud-good)' : 'var(--hud-warn)';

  // 镜腿点击 → 触发 OCR 抓拍
  if (window.rokidMotion) {
    rokidMotion.on?.((evt) => {
      if (evt.type === 'tap') {
        if (window.rokidCamera?.capture) {
          rokidCamera.capture().then(blob => {
            const r = new FileReader();
            r.onload = () => window.dispatchEvent(new CustomEvent('wearable-capture', { detail: r.result }));
            r.readAsDataURL(blob);
          }).catch(() => {});
        }
      }
    });
  }
  // 唤醒词联动 AI 助手
  if (window.rokidVoice?.once) {
    // 静默接入：语音可启动，触发同一窗口内的 askAI
    window.__wearableVoice = rokidVoice;
  }
})();



/* R26-A3:28 舌象饼图(实时拉 KB · 4 大组×7 子型 = 28) */
(function(){
  // 离线 fallback(API 不可达时,保证饼图不崩溃)
  const FALLBACK_ITEMS = [
    {id:'r16-28tongues-001',group:'white',hex:'#fafafa',label:'淡白·薄润·气血'},
    {id:'r16-28tongues-002',group:'white',hex:'#e0e0e0',label:'淡白·少苔·血虚'},
    {id:'r16-28tongues-003',group:'white',hex:'#c0c0c0',label:'淡白·滑润·脾湿'},
    {id:'r16-28tongues-004',group:'white',hex:'#a8a8a8',label:'淡白·厚腻·阳虚'},
    {id:'r16-28tongues-005',group:'white',hex:'#909090',label:'淡红·薄润·常舌'},
    {id:'r16-28tongues-006',group:'white',hex:'#787878',label:'淡红·厚腻·脾困'},
    {id:'r16-28tongues-007',group:'white',hex:'#606060',label:'淡红·齿痕·脾虚'},
    {id:'r16-28tongues-008',group:'yellow',hex:'#fef3c7',label:'红·薄苔·实热'},
    {id:'r16-28tongues-009',group:'yellow',hex:'#fde68a',label:'红·芒刺·炽热'},
    {id:'r16-28tongues-010',group:'yellow',hex:'#fcd34d',label:'红·裂纹·阴虚'},
    {id:'r16-28tongues-011',group:'yellow',hex:'#fbbf24',label:'红·少苔·胃阴'},
    {id:'r16-28tongues-012',group:'yellow',hex:'#f59e0b',label:'红·黄腻·湿热'},
    {id:'r16-28tongues-013',group:'yellow',hex:'#d97706',label:'红·黄厚·湿困'},
    {id:'r16-28tongues-014',group:'yellow',hex:'#b45309',label:'红·灰苔·热毒'},
    {id:'r16-28tongues-015',group:'black',hex:'#9ca3af',label:'绛·黄燥·营血'},
    {id:'r16-28tongues-016',group:'black',hex:'#6b7280',label:'绛·裂纹·阴旺'},
    {id:'r16-28tongues-017',group:'black',hex:'#4b5563',label:'绛·芒刺·热毒'},
    {id:'r16-28tongues-018',group:'black',hex:'#374151',label:'绛·光剥·阴枯'},
    {id:'r16-28tongues-019',group:'black',hex:'#1f2937',label:'绛·灰腻·湿热'},
    {id:'r16-28tongues-020',group:'black',hex:'#111827',label:'绛·黄厚·瘀阻'},
    {id:'r16-28tongues-021',group:'black',hex:'#030712',label:'绛·黑燥·重症'},
    {id:'r16-28tongues-022',group:'none',hex:'#a5f3fc',label:'紫·薄苔·气滞'},
    {id:'r16-28tongues-023',group:'none',hex:'#67e8f9',label:'紫·厚腻·阳瘀'},
    {id:'r16-28tongues-024',group:'none',hex:'#22d3ee',label:'紫·少苔·阴瘀'},
    {id:'r16-28tongues-025',group:'none',hex:'#06b6d4',label:'紫·瘀斑·瘀热'},
    {id:'r16-28tongues-026',group:'none',hex:'#0891b2',label:'青·滑润·寒瘀'},
    {id:'r16-28tongues-027',group:'none',hex:'#0e7490',label:'青·薄苔·寒凝'},
    {id:'r16-28tongues-028',group:'none',hex:'#155e75',label:'蓝·光剥·衰败'}
  ];
  const GROUP_LABELS = { white:'淡白/淡红组', yellow:'红色组', black:'绛色组', none:'紫青蓝危重组' };
  const DATA = FALLBACK_ITEMS; // 初始值,API 成功后覆盖

  function drawPie(){
    const cv = document.getElementById('tongue-pie');
    if(!cv) return;
    const ctx = cv.getContext('2d');
    const cx = cv.width/2, cy = cv.height/2, r = 88;
    ctx.clearRect(0, 0, cv.width, cv.height);
    const total = DATA.length || 28;
    const slice = (Math.PI*2)/total;
    let angle = -Math.PI/2;
    DATA.forEach((d, idx) => {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, angle, angle + slice);
      ctx.closePath();
      ctx.fillStyle = d.hex || '#888';
      ctx.fill();
      ctx.strokeStyle = '#0e1726';
      ctx.lineWidth = 0.6;
      ctx.stroke();
      angle += slice;
    });
    ctx.beginPath();
    ctx.arc(cx, cy, r*0.42, 0, Math.PI*2);
    ctx.fillStyle = 'rgba(14,23,38,0.92)';
    ctx.fill();
    ctx.fillStyle = '#4fd1c5';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign='center';
    ctx.fillText('28', cx, cy-2);
    ctx.fillStyle = '#8a99b5';
    ctx.font = '9px sans-serif';
    ctx.fillText('4组×7舌', cx, cy+12);
  }

  function renderLegend(){
    const el = document.getElementById('tongue-legend');
    if(!el) return;
    const byGroup = { white:[], yellow:[], black:[], none:[] };
    DATA.forEach(d => { if(byGroup[d.group]) byGroup[d.group].push(d); });
    let html = '';
    for (const g of ['white','yellow','black','none']) {
      const items = byGroup[g];
      if(!items.length) continue;
      html += `<div class="lg-group" style="margin-bottom:6px;padding:4px 0;border-top:1px solid #2a3a52;">`;
      html += `<div style="font-size:11px;font-weight:600;color:#4fd1c5;margin-bottom:3px;">▍${GROUP_LABELS[g]} · ${items.length} 舌</div>`;
      html += items.map(d =>
        `<div class="lg-item" title="${d.id}"><span class="lg-dot" style="background:${d.hex}"></span>${d.label}</div>`
      ).join('');
      html += `</div>`;
    }
    el.innerHTML = html;
  }

  async function loadFromKB(){
    try {
      const r = await fetch(`${API_BASE}/api/v1/glass/tongue28`, {
        headers: { 'x-device-token': 'GL-DEMO1234' }
      });
      if(!r.ok) throw new Error('HTTP ' + r.status);
      const j = await r.json();
      if(j && j.code === 0 && j.data && j.data.items && j.data.items.length === 28) {
        DATA.length = 0;
        j.data.items.forEach(it => DATA.push(it));
        console.log('[tongue28] KB 实时聚合:', DATA.length, '条 · 4 组', JSON.stringify(j.data.groupCount));
      } else {
        console.warn('[tongue28] API 返回异常,使用 fallback', j);
      }
    } catch(e) {
      console.warn('[tongue28] API 离线,使用 fallback:', e.message);
    }
    drawPie();
    renderLegend();
  }

  loadFromKB();
})();



  /* ═══════════════════════════════════════════════════════════
   * R18: 流式问诊（KB FTS5 → 逐 chunk 推送 → 眼镜侧 TTS）
   * 首字节延迟：服务端 KB FTS5 2ms + SSE 推送 ≤ 100ms
   * ═══════════════════════════════════════════════════════════ */
  (function(){
    const $q = document.getElementById('r18-q');
    const $btn = document.getElementById('r18-ask');
    const $stop = document.getElementById('r18-stop');
    const $meta = document.getElementById('r18-meta');
    const $out = document.getElementById('r18-stream-out');
    const $kbref = document.getElementById('r18-kbref');
    const API = (location.port === '8914') ? 'http://127.0.0.1:8920' : '';

    let es = null, tts = null, firstByteAt = null;

    function speak(text) {
      if (!('speechSynthesis' in window)) return;
      if (tts) speechSynthesis.cancel();
      tts = new SpeechSynthesisUtterance(text);
      tts.lang = 'zh-CN';
      tts.rate = 1.1;
      speechSynthesis.speak(tts);
    }

    async function ask() {
      const q = ($q.value || '').trim();
      if (!q) return;
      if (es) { es.close(); es = null; }
      if (tts) { speechSynthesis.cancel(); tts = null; }
      $out.textContent = '';
      $kbref.textContent = '';
      $meta.textContent = '⏳ 调 KB...';
      firstByteAt = null;
      let buf = '';

      const url = API + '/api/glass/stream/' + Date.now() + '?q=' + encodeURIComponent(q);
      // 浏览器 SSE 不支持自定义 header，使用 URL token 或后端改 bypass。
      // glass/stream 需 x-device-token，此处用 XHR + 流式手卷模拟：
      try {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.setRequestHeader('X-Device-Token', 'GL-browser-r18');
        xhr.responseType = '';
        let lastIdx = 0;
        let kbShown = false;
        let endShown = false;
        xhr.onprogress = function() {
          const text = xhr.responseText;
          const chunk = text.slice(lastIdx);
          lastIdx = text.length;
          // 逐行解析 SSE
          chunk.split('\n\n').forEach(block => {
            if (!block.trim()) return;
            const [evLine, ...dataLines] = block.split('\n');
            const ev = (evLine || '').replace('event: ', '').trim();
            const dataStr = dataLines.join('\n').replace(/^data: /gm, '');
            if (!dataStr) return;
            try {
              const data = JSON.parse(dataStr);
              if (ev === 'meta') {
                $meta.textContent = '🔎 KB 查询：' + data.query;
              } else if (ev === 'kb_ref') {
                $kbref.innerHTML = '📚 ' + (data.entryId || '-') + ' / ' + (data.module || '-') + ' / trust=' + (data.trust || '?');
                kbShown = true;
              } else if (data.chunk !== undefined) {
                if (firstByteAt === null) {
                  firstByteAt = performance.now();
                  $meta.textContent = '⚡ 首字节 ' + (firstByteAt - t0).toFixed(0) + 'ms';
                }
                buf += data.chunk;
                $out.textContent = buf;
                // 每 3 个 chunk 触发一次 TTS（8 字 ≈ 语阅一拍）
                if (data.index % 3 === 0) speak(buf);
              } else if (ev === 'end' && !endShown) {
                endShown = true;
                $meta.textContent = '✅ 流式完成：' + (data.totalChunks || '?') + ' chunk / 总耗时 ' + (data.totalMs || '?') + 'ms';
                speak(buf);  // 最后一段补上
              }
            } catch(e){}
          });
        };
        xhr.onerror = () => { $meta.textContent = '❌ 推接失败'; };
        const t0 = performance.now();
        xhr.send();
        window.__r18_xhr = xhr;
      } catch(e) {
        $meta.textContent = '❌ 异常：' + e.message;
      }
    }

    function stop() {
      if (window.__r18_xhr) { window.__r18_xhr.abort(); window.__r18_xhr = null; }
      if (es) { es.close(); es = null; }
      if (tts) { speechSynthesis.cancel(); tts = null; }
      $meta.textContent = '⏹ 已停';
    }

    $btn.addEventListener('click', ask);
    $stop.addEventListener('click', stop);
    $q.addEventListener('keydown', e => { if (e.key === 'Enter') ask(); });
  })();

  /* ═══════════════════════════════════════════════════════════
   * R19: 中医病历图像 OCR 上传 + KB 补强
   * 链路：文件选 → /api/glass/upload-image → 8913 /api/ocr/tcm
   *       → KB FTS5 bm25 命中 (≤5ms) → 返回 top5 + offline fallback
   * ═══════════════════════════════════════════════════════════ */
  (function() {
    const $file = document.getElementById('r19-file');
    const $mode = document.getElementById('r19-mode');
    const $btn = document.getElementById('r19-upload');
    const $meta = document.getElementById('r19-meta');
    const $out = document.getElementById('r19-ocr-out');
    const $kb = document.getElementById('r19-kbref');

    async function toBase64(file) {
      return new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result).split(',')[1]);
        r.onerror = reject;
        r.readAsDataURL(file);
      });
    }

    $btn.addEventListener('click', async () => {
      const f = $file.files[0];
      if (!f) { $meta.textContent = '❌ 请先选择文件'; return; }
      const mode = $mode.value;
      $btn.disabled = true;
      $meta.textContent = '⏳ 上传中…';
      $out.textContent = ''; $kb.innerHTML = '';
      try {
        const image = await toBase64(f);
        const t0 = Date.now();
        const r = await fetch(API + '/api/glass/upload-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Device-Token': 'GL-DEMO1234' },
          body: JSON.stringify({ image, mode })
        }).then(r => r.json());
        const elapsed = Date.now() - t0;
        const offline = r.data && r.data.offline;
        const lat = r.data && r.data.latencyMs;
        const refs = (r.data && r.data.kbRefs) || [];
        $meta.innerHTML =
          (offline ? '📡 8913 离线·KB 兜底已激活' : '✅ OCR 识别完成') +
          ' · 总耗时 ' + elapsed + 'ms' +
          (lat ? '（upstream ' + lat + 'ms）' : '') +
          (r.data && r.data.upstream ? ' · ' + r.data.upstream : '');
        // 输出 OCR 文本 + 兜底
        const ocrText = (r.data && r.data.ocrResult && (r.data.ocrResult.text || r.data.ocrResult.rawText)) || '';
        const fallbackText = r.data && r.data.offlineFallback;
        $out.textContent = ocrText || fallbackText || '(无 OCR 文本)';
        // KB 命中
        if (refs.length > 0) {
          $kb.innerHTML = '📚 <strong>KB 补强 ' + refs.length + ' 条</strong>（按 bm25 排序）：<br>' +
            refs.map(x => '· <span style="color:#fbbf24">' + x.entryId + '</span> / ' +
              x.module + ' / trust=' + x.trust.toFixed(2) + ' · ' + x.title).join('<br>');
        } else if (r.data && r.data.kbSummary) {
          $kb.innerHTML = '<span style="color:#fb923c">' + r.data.kbSummary + '</span>';
        }
        // TTS 朗读
        const speech = fallbackText || ocrText;
        if (speech && 'speechSynthesis' in window) {
          speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(speech.slice(0, 240));
          u.lang = 'zh-CN'; u.rate = 1.0;
          speechSynthesis.speak(u);
        }
      } catch (e) {
        $meta.textContent = '❌ 上传失败: ' + (e.message || e);
      } finally {
        $btn.disabled = false;
      }
    });
  })();

  /* ═══════════════════════════════════════════════════════════
   * R20: 浏览器端 Web Speech STT + upload-audio
   * 链路：麦克风 → webkitSpeechRecognition → POST /api/glass/upload-audio
   *       → KB FTS5 prefix* bm25 → intent + nextStep
   * 实现：直接在浏览器调用 SpeechRecognition API（Safari/Chrome 都有）
   * 补充：上传纯音频流时调用 MediaRecorder
   * ═══════════════════════════════════════════════════════════ */
  (function() {
    const $start = document.getElementById('r20-start');
    const $stop = document.getElementById('r20-stop');
    const $hint = document.getElementById('r20-hint');
    const $upload = document.getElementById('r20-upload');
    const $status = document.getElementById('r20-rec-status');
    const $stt = document.getElementById('r20-stt-out');
    const $intent = document.getElementById('r20-intent');
    const $kb = document.getElementById('r20-kbref');

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    let rec = null;
    let finalText = '';

    function setStatus(s) { $status.textContent = s; }

    if (!SR) {
      $start.disabled = true;
      $start.title = '浏览器不支持 SpeechRecognition（需要 Safari 14+/Chrome 88+）';
      setStatus('❌ 浏览器不支持 Web Speech API。可仍上传音频文件 (POST blob)。');
    } else {
      rec = new SR();
      rec.lang = 'zh-CN';
      rec.continuous = true;
      rec.interimResults = true;

      rec.onstart = () => { $start.disabled = true; $stop.disabled = false; setStatus('🟢 录音中…'); };
      rec.onresult = (e) => {
        let interim = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const t = e.results[i][0].transcript;
          if (e.results[i].isFinal) finalText += t;
          else interim += t;
        }
        $stt.textContent = (finalText + (interim ? '【' + interim + '】' : '')).trim() || '(等待识别…)';
        // intent 预提示
        $intent.textContent = (finalText || interim).slice(0, 20)
          ? '🔮 推测 intent: ' + (finalText || interim).slice(0, 8) + '…'
          : '';
      };
      rec.onerror = (e) => setStatus('⚠️ 错误: ' + (e.error || 'unknown') + '，' + (e.message || ''));
      rec.onend = () => {
        $start.disabled = false; $stop.disabled = true;
        setStatus(finalText ? '🔴 已停止（可上传）' : '🔴 已停止（无识别文本）');
      };

      $start.addEventListener('click', () => { finalText = ''; $stt.textContent = ''; rec.start(); });
      $stop.addEventListener('click', () => { try { rec.stop(); } catch(_){} });
    }

    // 上传：纯文本 → service-side KB intent
    async function uploadAudio() {
      const text = (finalText || $stt.textContent).trim();
      if (!text) { setStatus('❌ 没有识别文本可上传'); return; }
      const hint = $hint.value.trim() || null;
      $upload.disabled = true;
      setStatus('⏳ 上传中…');
      try {
        const t0 = Date.now();
        const r = await fetch(API + '/api/glass/upload-audio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Device-Token': 'GL-DEMO1234' },
          body: JSON.stringify({ audio: text, duration: 0, sampleRate: 16000, hint })
        }).then(r => r.json());
        const elapsed = Date.now() - t0;
        const d = r.data || {};
        const refs = d.kbRefs || [];
        setStatus(
          '✅ ' + r.message + ' · 总耗时 ' + elapsed + 'ms' +
          (d.latencyMs != null ? '（server ' + d.latencyMs + 'ms）' : '') +
          (d.sttEngine ? ' · engine=' + d.sttEngine : '')
        );
        $intent.innerHTML = '🎯 intent: <strong>' + d.intent + '</strong> → nextStep: <strong>' + d.nextStep + '</strong>';
        if (refs.length > 0) {
          $kb.innerHTML = '📚 KB 命中 ' + refs.length + ' 条：<br>' +
            refs.map(x => '· <span style="color:#a78bfa">' + x.entryId + '</span> / ' +
              x.module + ' / trust=' + (x.trust || 0).toFixed(2) + ' · ' + x.title).join('<br>');
        } else {
          $kb.innerHTML = '<span style="color:#fb923c">KB 未命中，仅使用意图分类 fallback</span>';
        }
        // TTS 朗读 STT 文本
        if ('speechSynthesis' in window && d.sttText) {
          speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(d.sttText.slice(0, 240));
          u.lang = 'zh-CN'; u.rate = 1.0;
          speechSynthesis.speak(u);
        }
      } catch (e) {
        setStatus('❌ 上传失败: ' + (e.message || e));
      } finally {
        $upload.disabled = false;
      }
    }
    $upload.addEventListener('click', uploadAudio);
  })();
  


    // R17-A: 页面加载完自动执行 SDK 自检
    window.addEventListener('load', () => {
      setTimeout(() => {
        if (window.sdkReadinessCheck) {
          sdkReadinessCheck.runAll().then(r => {
            const el = document.getElementById('wearable-status');
            if (el) {
              const ready = r.overallReady;
              const detected = r.threeStates.device.detected;
              el.textContent = ready ? '✅ SDK 就绪' : (detected ? '🎯 真机模式' : '📱 浏览器模式');
              el.style.color = ready ? 'var(--hud-ok, #34d399)' : 'var(--hud-warn, #fbbf24)';
            }
          }).catch(() => {});
        }
      }, 600);
    });

    // R43: Mock 开关控制
    const $mockToggle = document.getElementById('mock-toggle');
    if ($mockToggle && window.rokidMock) {
      $mockToggle.addEventListener('click', () => {
        const current = window.rokidMock.isEnabled();
        window.rokidMock.toggle(!current);
        $mockToggle.textContent = `🛠️ Mock: ${!current ? '开' : '关'}`;
        $mockToggle.style.color = !current ? 'var(--hud-ok, #34d399)' : 'var(--hud-muted, #9ca3af)';
        // 重新触发 SDK 自检
        if (window.sdkReadinessCheck) {
          setTimeout(() => sdkReadinessCheck.runAll().catch(() => {}), 200);
        }
      });
      // 初始状态同步
      $mockToggle.textContent = '🛠️ Mock: 关';
    }
  