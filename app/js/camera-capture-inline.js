
// === 摄像头管理 ===
let stream = null;
let autoTimer = null;
let devices = [];
let lastBlob = null;

const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const stage = document.getElementById('stage');
const placeholder = document.getElementById('placeholder');
const liveTag = document.getElementById('liveTag');
const deviceTag = document.getElementById('deviceTag');
const status = document.getElementById('status');
const startBtn = document.getElementById('startBtn');
const snapBtn = document.getElementById('snapBtn');
const autoBtn = document.getElementById('autoBtn');
const audioEnable = document.getElementById('audioEnable');
const micSel = document.getElementById('micSel');
let audioContext = null;
let analyser = null;
let audioCanvas = null;
let audioAnimId = null;
const stopBtn = document.getElementById('stopBtn');
const refreshDevBtn = document.getElementById('refreshDevBtn');
const deviceSel = document.getElementById('deviceSel');
const modeSel = document.getElementById('modeSel');
const analysis = document.getElementById('analysis');
const gallery = document.getElementById('gallery');
const galleryCount = document.getElementById('galleryCount');

function setStatus(text, cls='') {
  status.textContent = text;
  status.className = 'status-line ' + cls;
}

async function refreshDevices() {
  try {
    // 必须先请求权限才能枚举设备 label
    if (!stream) {
      try {
        const tmp = await navigator.mediaDevices.getUserMedia({video: true});
        tmp.getTracks().forEach(t => t.stop());
      } catch (e) { /* ignore */ }
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
    devices = await navigator.mediaDevices.enumerateDevices();
    const cams = devices.filter(d => d.kind === 'videoinput');
    deviceSel.innerHTML = '<option value="">默认（自动选择）</option>' +
      cams.map((c, i) => `<option value="${c.deviceId}">${c.label || ('Camera ' + i)}</option>`).join('');
    setStatus(`检测到 ${cams.length} 个摄像头`, 'ok');
    // 同时枚举麦克风
    const mics = devices.filter(d => d.kind === 'audioinput');
    micSel.innerHTML = '<option value="">默认（自动选择）</option>' +
      mics.map((c, i) => `<option value="${c.deviceId}">${c.label || ('Mic ' + i)}</option>`).join('');
    if (mics.length === 0) audioEnable.disabled = true;
  } catch (e) {
    setStatus('设备枚举失败：' + e.message, 'err');
  }
}

async function start() {
  try {
    const deviceId = deviceSel.value;
    const constraints = {
      video: deviceId ? {deviceId: {ideal: deviceId}} : true,
      audio: audioEnable.checked ? {deviceId: micSel.value ? {ideal: micSel.value} : undefined, echoCancellation: true, noiseSuppression: true} : false
    };
    if (!window.isSecureContext) { setStatus('需要安全上下文（HTTPS 或 localhost），请通过 http://localhost:8914 访问', 'err'); return; }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { setStatus('浏览器不支持摄像头，请使用 Chrome/Edge', 'err'); return; }
    try {
      stream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch(e1) {
      // 降级：最宽松约束
      console.warn('[camera] 约束失败，降级:', e1.message);
      stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    }
    video.srcObject = stream;
    video.style.display = 'block';
    placeholder.style.display = 'none';
    liveTag.style.display = 'flex';

    const track = stream.getVideoTracks()[0];
    deviceTag.textContent = track.label || 'Camera';
    setStatus('实时采集中… 设备：' + (track.label || 'unknown'), 'ok');

    startBtn.disabled = true;
    snapBtn.disabled = false;
    autoBtn.disabled = false;
    stopBtn.disabled = false;

    // 麦克风可视化 + KB 联动提示
    if (audioEnable.checked) {
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length > 0) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContext.createMediaStreamSource(stream);
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        startAudioVisualizer();
        setStatus('实时采集中… 设备：' + (track.label || 'unknown') + ' 🎤 麦克风：' + (audioTracks[0].label || 'active'), 'ok');
      }
    }
  } catch (e) {
    setStatus('启动失败：' + e.message, 'err');
  }
}

function stop() {
  if (stream) {
    stream.getTracks().forEach(t => t.stop());
    stream = null;
  }
  if (autoTimer) { clearInterval(autoTimer); autoTimer = null; autoBtn.textContent = '🔁 自动采集（每 3s）'; }
  if (audioAnimId) { cancelAnimationFrame(audioAnimId); audioAnimId = null; }
  if (audioContext && audioContext.state !== 'closed') audioContext.close().catch(()=>{});
  audioContext = null; analyser = null;
  video.srcObject = null;
  video.style.display = 'none';
  placeholder.style.display = 'flex';
  liveTag.style.display = 'none';
  deviceTag.textContent = '未连接';
  startBtn.disabled = false;
  snapBtn.disabled = true;
  autoBtn.disabled = true;
  stopBtn.disabled = true;
  setStatus('已停止', '');
}

function startAudioVisualizer() {
  // 在 video 上盖一个 canvas 显示音量条 + KB 能量值
  const wrap = document.querySelector('.video-wrap') || video.parentElement;
  if (!audioCanvas) {
    audioCanvas = document.createElement('canvas');
    audioCanvas.width = 320; audioCanvas.height = 48;
    audioCanvas.style.cssText = 'position:absolute;left:8px;bottom:8px;z-index:10;border-radius:6px;background:rgba(0,0,0,.5);pointer-events:none';
    wrap.appendChild(audioCanvas);
  }
  const buf = new Uint8Array(analyser.frequencyBinCount);
  function tick() {
    analyser.getByteFrequencyData(buf);
    const ctx = audioCanvas.getContext('2d');
    ctx.clearRect(0, 0, audioCanvas.width, audioCanvas.height);
    const bars = 32;
    const step = Math.floor(buf.length / bars);
    let peak = 0;
    for (let i = 0; i < bars; i++) {
      let sum = 0;
      for (let j = 0; j < step; j++) sum += buf[i * step + j];
      const v = sum / step / 255;
      if (v > peak) peak = v;
      const h = v * audioCanvas.height * 0.9;
      const g = ctx.createLinearGradient(0, audioCanvas.height - h, 0, audioCanvas.height);
      g.addColorStop(0, peak > 0.6 && i > bars * 0.7 ? '#ff6b6b' : '#c9a84c');
      g.addColorStop(1, '#8c6a30');
      ctx.fillStyle = g;
      ctx.fillRect(i * (audioCanvas.width / bars) + 1, audioCanvas.height - h, audioCanvas.width / bars - 2, h);
    }
    // 右侧能量值（KB 联动提示音）
    ctx.fillStyle = '#f5f1e8';
    ctx.font = '14px sans-serif';
    ctx.fillText('🎤 ' + Math.round(peak * 100) + '%', audioCanvas.width - 50, 18);
    if (peak > 0.7) {
      ctx.fillText('🔥 KB?', audioCanvas.width - 50, 36);
    }
    audioAnimId = requestAnimationFrame(tick);
  }
  tick();
}

async function snap() {
  if (!stream) return;
  const track = stream.getVideoTracks()[0];
  const settings = track.getSettings();
  canvas.width = settings.width || 1280;
  canvas.height = settings.height || 720;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.92));
  lastBlob = blob;

  // 显示缩略图在 stage
  const url = URL.createObjectURL(blob);
  showInStage(url);

  // R63: 拍照后立刻触发设备↔KB联动（不等上传结果）
  // 这样 智能助手下次查询时自动加权相关模块
  const mode = modeSel ? modeSel.value : 'face';
  triggerKbBridge(mode, blob);

  // 上传分析
  await analyze(blob);
  await loadGallery();
}

/**
 * R63: 拍照后触发 DeviceKbBridge.onCapture
 * 根据拍照模式自动映射 KB 模块：
 *   face  → zhongyi (中医面诊)
 *   tongue → shexiang (舌象诊断)
 *   eye   → mianxue (眼诊/面相)
 *   ocr/ocr-tcm → classics (经典文献)
 *   voice → mantra (咒语/诵经)
 */
function triggerKbBridge(mode, blob) {
  const capMap = {
    'face': 'face_capture',
    'tongue': 'tongue_capture',
    'eye': 'eye_capture',
    'ocr': 'document_ocr',
    'ocr-tcm': 'document_ocr'
  };
  const cap = capMap[mode] || 'face_capture';
  const extra = { source: 'camera-capture.html', mode, blobSize: blob.size, ts: new Date().toISOString() };

  // 优先用 DeviceKbBridge（如果加载了）
  if (window.DeviceKbBridge && typeof window.DeviceKbBridge.onCapture === 'function') {
    window.DeviceKbBridge.onCapture(cap, extra);
  }
  // 兑底：直接调 recordKbHit
  const moduleMap = { face_capture: 'zhongyi', tongue_capture: 'shexiang', eye_capture: 'mianxue', document_ocr: 'classics' };
  const module = moduleMap[cap] || 'zhongyi';
  if (typeof window.recordKbHit === 'function') {
    window.recordKbHit(module, 0.8, true);
  }
  // 顶顶 console.log 供调试
  if (window.console && console.log) console.warn(`[R63] 拍照联动KB: ${cap} → ${module}`);
}

function showInStage(url) {
  // 临时把 video 隐藏，显示 img
  let img = stage.querySelector('img.preview');
  if (!img) {
    img = document.createElement('img');
    img.className = 'preview';
    img.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:5';
    stage.insertBefore(img, video);
  }
  img.src = url;
  setTimeout(() => { if (img) img.style.display = 'none'; }, 1500);
}

async function analyze(blob) {
  const mode = modeSel.value;
  const form = new FormData();
  form.append('file', blob, `capture_${Date.now()}.jpg`);
  form.append('mode', mode);
  form.append('deviceId', stream ? stream.getVideoTracks()[0].label : '');
  form.append('timestamp', new Date().toISOString());

  setStatus('上传并分析中…', '');
  try {
    const r = await fetch('http://127.0.0.1:8913/api/camera/upload', {
      method: 'PUT', body: form
    });
    const j = await r.json();
    if (!j.ok) {
      analysis.innerHTML = `<div class="analysis-empty" style="color:var(--danger)">⚠ ${j.message || j.error || '分析失败'}</div>`;
      setStatus('分析失败', 'err');
      return;
    }
    const text = j.analysis || j.text || '(无文本结果)';
    analysis.innerHTML = `<div style="font-size:11px;color:var(--paper3);margin-bottom:8px">引擎：${j.engine} · 用时 ${j.elapsed_ms}ms · 字节 ${j.bytes}</div><div>${escape(text)}</div>`;
    setStatus('✓ 分析完成 · ' + j.engine, 'ok');
    // R100: KB 匹配结果渲染（知识库支撑卡）
    renderKbSupport(j);
    // KB 联动: 把 AI 识别结果按模式注入 _MODULE_REPORTS，供下次咨询参考
    injectKb(mode, blob, text, j.engine);
  } catch (e) {
    analysis.innerHTML = `<div class="analysis-empty" style="color:var(--danger)">✗ 网络错误：${e.message}<br>请确认 face-ocr-server 在 8913 端口运行</div>`;
    setStatus('上传失败：' + e.message, 'err');
  }
}

/* R100: KB 知识支撑渲染 — 识别结果 → 知识库匹配 → 结构化展示 */
function renderKbSupport(j) {
  const wrap = document.getElementById('kbSupport');
  const list = document.getElementById('kbSupportList');
  const meta = document.getElementById('kbSupportMeta');
  if (!wrap || !j.kb_matches || !j.kb_matches.length) {
    if (wrap) wrap.style.display = 'none';
    return;
  }
  const matches = j.kb_matches.slice(0, 5);
  list.innerHTML = matches.map(m => `
    <div class="kb-match-item">
      <div class="kb-match-head">
        <span class="kb-match-title">${escape(m.title)}</span>
        <span class="kb-match-score">${Math.round(m.score * 100)}%</span>
      </div>
      <div class="kb-match-content">${escape(m.content || '').slice(0, 120)}</div>
      <div class="kb-match-meta">模块 ${escape(m.module)} · 命中「${escape(m.matched)}」</div>
    </div>
  `).join('');
  meta.textContent = (j.kb_features && j.kb_features.length ? `特征词：${j.kb_features.join(' / ')}` : '') + ' · 本地检索 ' + (j.kb_ms ? '即时' : '') + ' · ' + matches.length + ' 条知识支撑';
  wrap.style.display = 'block';
}

/* KB 联动: 把面诊/舌诊/眼诊结果缓存到 localStorage, 供 智能助手查询 */
function injectKb(mode, blob, text, engine) {
  const key = `_kb_camera_${mode}_${Date.now()}`;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      localStorage.setItem(key, JSON.stringify({
        mode, engine, text,
        thumb: reader.result.slice(0, 512) + '...', // 截断 base64 缩略
        time: new Date().toISOString(),
        size: blob.size
      }, 0, 200)); // 只存前 200 字符避免溢出
      // 打 KB 命中计数
      const cnt = parseInt(localStorage.getItem('_kb_hit_count/camera-' + mode) || '0') + 1;
      localStorage.setItem('_kb_hit_count/camera-' + mode, String(cnt));
      // 更新 KB 就绪 badge
      const badge = document.getElementById('kbFallbackBadge');
      if (badge) badge.textContent = `✅ KB 采集 +${cnt} (camera-${mode})`;
    } catch (e) { /* localStorage 满 */ }
  };
  reader.readAsDataURL(blob);
}

function escape(s) { return (s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]); }

function toggleAuto() {
  if (autoTimer) {
    clearInterval(autoTimer); autoTimer = null;
    autoBtn.textContent = '🔁 自动采集（每 3s）';
    setStatus('自动采集已暂停', '');
    return;
  }
  autoTimer = setInterval(() => snap(), 3000);
  autoBtn.textContent = '⏸ 暂停自动采集';
  setStatus('自动采集中…（每 3 秒）', 'ok');
}

async function loadGallery() {
  try {
    const r = await fetch('http://127.0.0.1:8913/api/camera/health');
    // 健康检查，不返回列表 — 改为从 localStorage 计数
    const list = JSON.parse(localStorage.getItem('camera_archive') || '[]');
    galleryCount.textContent = list.length;
    if (list.length === 0) {
      gallery.innerHTML = '<div class="thumb" style="cursor:default;border-style:dashed;display:flex;align-items:center;justify-content:center;color:var(--paper3);font-size:11px">暂无</div>';
    } else {
      gallery.innerHTML = list.slice(-12).reverse().map(item => `
        <div class="thumb" title="${escape(item.timestamp)}">
          <img src="${item.url}" alt="">
          <div class="meta">${item.mode} · ${new Date(item.timestamp).toLocaleTimeString()}</div>
        </div>
      `).join('');
    }
  } catch (e) { /* ignore */ }
}

// 启动后保存到 localStorage 模拟
const _origSnap = snap;
window.snap = async function() {
  await _origSnap();
  if (lastBlob) {
    const list = JSON.parse(localStorage.getItem('camera_archive') || '[]');
    list.push({
      url: URL.createObjectURL(lastBlob),
      mode: modeSel.value,
      timestamp: new Date().toISOString(),
      device: stream ? stream.getVideoTracks()[0].label : ''
    });
    localStorage.setItem('camera_archive', JSON.stringify(list));
  }
};

startBtn.onclick = start;
snapBtn.onclick = () => window.snap();
autoBtn.onclick = toggleAuto;
stopBtn.onclick = stop;
refreshDevBtn.onclick = refreshDevices;

// 启动时检测设备
refreshDevices();
loadGallery();

// 键盘快捷键：空格 = 拍照
document.addEventListener('keydown', e => {
  if (e.code === 'Space' && !snapBtn.disabled) {
    e.preventDefault();
    window.snap();
  }
});



// === R44: Type-C 热插拔通用接入 + 连续语音 KB 交互 ===
const hotplugToast = document.getElementById('hotplugToast');
const camDot = document.getElementById('camDot');
const micDot = document.getElementById('micDot');
const camName = document.getElementById('camName');
const micName = document.getElementById('micName');
const continuousMode = document.getElementById('continuousMode');
const listenIndicator = document.getElementById('listenIndicator');
let knownDeviceIds = { cam: [], mic: [] };
let continuousListening = false;
let lastKbQuery = '';
let kbQueryTimer = null;

function showHotplugToast(text, isWarn) {
  hotplugToast.innerHTML = text;
  hotplugToast.className = 'hotplug-toast show' + (isWarn ? ' warn' : '');
  setTimeout(() => hotplugToast.classList.remove('show'), 3500);
}

function updateDevStatus(cams, mics) {
  // 摄像头
  if (cams.length > 0) {
    const isNew = cams.length > knownDeviceIds.cam.length;
    camDot.className = 'dev-dot ' + (isNew ? 'new' : 'online');
    camName.textContent = '摄像头：' + (cams[0]?.label || cams.length + ' 个设备');
  } else {
    camDot.className = 'dev-dot offline';
    camName.textContent = '摄像头：未检测';
  }
  // 麦克风
  if (mics.length > 0) {
    const isNew = mics.length > knownDeviceIds.mic.length;
    micDot.className = 'dev-dot ' + (isNew ? 'new' : 'online');
    micName.textContent = '麦克风：' + (mics[0]?.label || mics.length + ' 个设备');
  } else {
    micDot.className = 'dev-dot offline';
    micName.textContent = '麦克风：未检测';
  }
}

async function hotplugCheck() {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
    // 不需要权限就能 enumerate（但 label 为空）
    const all = await navigator.mediaDevices.enumerateDevices();
    const cams = all.filter(d => d.kind === 'videoinput');
    const mics = all.filter(d => d.kind === 'audioinput');

    // 检测新设备
    const camIds = cams.map(d => d.deviceId);
    const micIds = mics.map(d => d.deviceId);
    const newCam = camIds.filter(id => !knownDeviceIds.cam.includes(id));
    const newMic = micIds.filter(id => !knownDeviceIds.mic.includes(id));

    if (newCam.length > 0 && knownDeviceIds.cam.length > 0) {
      showHotplugToast('🔌 检测到新摄像头接入（Type-C 热插拔）', false);
      // 自动选到新设备
      const newDev = cams.find(d => d.deviceId === newCam[0]);
      if (newDev) {
        deviceSel.value = newDev.deviceId;
        // 如果当前在运行，自动重启流
        if (stream) { stop(); setTimeout(start, 300); }
      }
    }
    if (newMic.length > 0 && knownDeviceIds.mic.length > 0) {
      showHotplugToast('🔌 检测到新麦克风接入（Type-C 热插拔）', false);
      const newDev = mics.find(d => d.deviceId === newMic[0]);
      if (newDev) {
        micSel.value = newDev.deviceId;
        audioEnable.checked = true;
        audioEnable.disabled = false;
      }
    }

    knownDeviceIds.cam = camIds;
        knownDeviceIds.mic = micIds;

    updateDevStatus(cams, mics);

    // 更新下拉列表
    deviceSel.innerHTML = '<option value="">默认（自动选择）</option>' +
      cams.map((c, i) => `<option value="${c.deviceId}"${c.deviceId===deviceSel.value?' selected':''}>${c.label || ('Camera ' + (i+1))}</option>`).join('');
    micSel.innerHTML = '<option value="">默认（自动选择）</option>' +
      mics.map((c, i) => `<option value="${c.deviceId}"${c.deviceId===micSel.value?' selected':''}>${c.label || ('Mic ' + (i+1))}</option>`).join('');
    if (mics.length > 0) audioEnable.disabled = false;
  } catch (e) {
    console.warn('hotplug check error:', e);
  }
}

// 浏览器原生 devicechange 事件 — 热插拔核心
if (navigator.mediaDevices) {
  navigator.mediaDevices.addEventListener('devicechange', hotplugCheck);
}

// 首次初始化设备列表
if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
  hotplugCheck();
}

// 定期轮询（有些浏览器 devicechange 不触发）
if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
  setInterval(hotplugCheck, 3000);
}

// === 连续监听模式 ===
continuousMode.addEventListener('change', () => {
  if (continuousMode.checked) {
    startContinuousListen();
  } else {
    stopContinuousListen();
  }
});

function startContinuousListen() {
  if (!recognition) {
    if (!initSTT()) {
      continuousMode.checked = false;
      showToast('当前浏览器不支持语音识别，请用 Chrome/Edge');
      return;
    }
  }
  continuousListening = true;
  isRecording = true;
  voiceFinalTranscript = '';
  listenIndicator.style.display = 'inline-block';
  listenIndicator.classList.add('active');
  try { recognition.start(); } catch(e) {}
  setStatus('🎙️ 连续监听中 · 说完自动查 KB · 关闭开关停止', '');
}

function stopContinuousListen() {
  continuousListening = false;
  isRecording = false;
  if (recognition) { try { recognition.stop(); } catch(e) {} }
  listenIndicator.style.display = 'none';
  listenIndicator.classList.remove('active');
  setStatus('连续监听已关闭', '');
}

// 重写 recognition.onend — 连续模式自动续接
function _patchRecognitionEnd() {
  if (!recognition) return;
  const _origOnEnd = recognition.onend;
  recognition.onend = (e) => {
    if (continuousListening) {
      try { recognition.start(); } catch(err) { setTimeout(() => { try { recognition.start(); } catch(e){console.warn(e.message)} }, 500); }
    } else if (isRecording) {
      try { recognition.start(); } catch(err) {}
    }
  };
}

// 连续模式 STT onresult — 自动检测句子边界并查询 KB
const _origInitSTT = initSTT;
window.initSTT = function() {
  const ok = _origInitSTT();
  if (!ok) return false;
  // 增强 onresult — 句号/问号/感叹号/停顿触发自动 KB 查询
  recognition.onresult = (e) => {
    let interim = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      if (e.results[i].isFinal) {
        const chunk = e.results[i][0].transcript;
        voiceFinalTranscript += chunk;
        // 连续模式：每句结束自动查 KB
        if (continuousListening && chunk.length > 2) {
          debounceKbQuery(chunk.trim());
        }
      } else {
        interim += e.results[i][0].transcript;
      }
    }
    const vt = document.getElementById('voiceTranscript');
    if (vt) {
      vt.innerHTML = escape(voiceFinalTranscript) +
        (interim ? '<span style="color:var(--gold2);opacity:.8">' + escape(interim) + '</span>' : '');
    }
  };
  _patchRecognitionEnd();
  return true;
};

function debounceKbQuery(query) {
  // 去重：和上次查询相同就跳过
  if (query === lastKbQuery) return;
  lastKbQuery = query;
  if (kbQueryTimer) clearTimeout(kbQueryTimer);
  kbQueryTimer = setTimeout(async () => {
    await streamKbResult(query);
  }, 600);
}

async function streamKbResult(query) {
  const results = await queryKb(query);
  const vr = document.getElementById('voiceResult');
  if (!vr) return;
  if (results.length === 0) {
    // 安静地跳过（连续模式不打扰）
    return;
  }
  // 流式追加卡片（不是替换）
  const card = document.createElement('div');
  card.className = 'kb-card';
  card.innerHTML = '<div class="kb-title">🔍 ' + escape(query.slice(0,50)) + '</div>' +
    results.map(r => '<div style="margin-bottom:6px">' +
      '<strong style="color:var(--gold2)">' + escape((r.title||r.name||r.id||'').toString()) + '</strong>' +
      '<div class="kb-snippet">' + escape((r.summary||r.content||r.text||'').slice(0,120)) + '</div>' +
      '<div class="kb-meta"><span>来源: ' + escape((r.source||r.module||'KB').toString()) + '</span>' +
      '<span>信任: ' + escape((r.trust||r.level||'?').toString()) + '</span></div>' +
      '</div>').join('');
  // 插入到最前面
  vr.insertBefore(card, vr.firstChild);
  // 限制最多 8 张卡片
  while (vr.children.length > 8) vr.removeChild(vr.lastChild);
  setStatus('✓ KB 实时匹配 · "' + query.slice(0,20) + '" → ' + results.length + ' 条', 'ok');
}



// === R43: 引导框 + 新设备 badge + 语音 STT→KB + 设备更新检测 ===
const GUIDE_HINTS = {
  face: '请将面部置于圆框内 · 光线均匀',
  tongue: '请将舌头伸出并置于椭圆框内 · 自然光',
  ocr: '请将文档/卦象置于方框内 · 水平拍摄',
  'ocr-tcm': '请对准处方/舌苔 · 保持清晰'
};
const GUIDE_CLASSES = {face:'face',tongue:'tongue',ocr:'ocr','ocr-tcm':'ocr'};
const guideLayer = document.getElementById('guideLayer');
const guideLabel = document.getElementById('guideLabel');
const newDeviceBadge = document.getElementById('newDeviceBadge');
let previousDeviceCount = 0;

function updateGuideForMode() {
  const m = modeSel.value;
  guideLayer.className = 'guide-layer show ' + (GUIDE_CLASSES[m] || '');
  guideLabel.textContent = GUIDE_HINTS[m] || '';
}
function showGuide(yes) {
  guideLayer.classList.toggle('show', yes && !!stream);
}
function checkNewDevices(camList) {
  const curr = camList.map(d => d.deviceId).sort().join(',');
  const prev = localStorage.getItem('_camera_known_devices') || '';
  if (prev && curr !== prev && camList.length > (previousDeviceCount || 0)) {
    newDeviceBadge.classList.add('show');
    setTimeout(() => newDeviceBadge.classList.remove('show'), 4000);
  }
  localStorage.setItem('_camera_known_devices', curr);
  previousDeviceCount = camList.length;
}

// === R43: STT → KB 查询 ===
let recognition = null;
let isRecording = false;
let voiceFinalTranscript = '';

function initSTT() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return false;
  recognition = new SR();
  recognition.lang = 'zh-CN';
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.onresult = (e) => {
    let interim = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      if (e.results[i].isFinal) voiceFinalTranscript += e.results[i][0].transcript;
      else interim += e.results[i][0].transcript;
    }
    const vt = document.getElementById('voiceTranscript');
    if (vt) {
      vt.innerHTML = escape(voiceFinalTranscript) +
        (interim ? '<span style="color:var(--gold2);opacity:.8">' + escape(interim) + '</span>' : '');
    }
  };
  recognition.onerror = (e) => { console.warn('STT 错误:', e.error); stopVoice(); };
  recognition.onend = () => { if (isRecording) { try { recognition.start(); } catch(e){console.warn(e.message)} } };
  return true;
}

async function queryKb(query) {
  if (!query || query.length < 2) return [];
  try {
    const r = await fetch('http://127.0.0.1:8920/api/public/kb-search?limit=3&q=' + encodeURIComponent(query));
    const j = await r.json();
    return (j.results || []).slice(0, 3);
  } catch (e) { return []; }
}

function startVoice() {
  if (!recognition) {
    if (!initSTT()) { showToast('当前浏览器不支持语音识别，请用 Chrome/Edge'); return; }
  }
  isRecording = true;
  voiceFinalTranscript = '';
  try { recognition.start(); } catch(e) {}
  const vb = document.getElementById('voiceBtn');
  if (vb) vb.classList.add('recording');
  const vt = document.getElementById('voiceTranscript');
  if (vt) vt.innerHTML = '';
  setStatus('🎙️ 拾音中… 松开鼠标停止', '');
}

async function stopVoice() {
  isRecording = false;
  if (recognition) { try { recognition.stop(); } catch(e) {} }
  const vb = document.getElementById('voiceBtn');
  if (vb) vb.classList.remove('recording');
  setStatus('🔍 查询知识库…', '');
  const query = voiceFinalTranscript.trim();
  const vr = document.getElementById('voiceResult');
  if (vr) vr.innerHTML = '<div class="voice-empty">⏳ 正在从 KB 检索相关条目…</div>';
  const results = await queryKb(query);
  if (vr) {
    if (!results || results.length === 0) {
      vr.innerHTML = '<div class="voice-empty">未找到匹配的 KB 条目，请尝试更具体的描述</div>';
    } else {
      vr.innerHTML = '<h4>KB 检索结果 <span class="src">' + escape(query.slice(0,40)) + '</span></h4>' +
        '<ol>' + results.map(r => '<li><strong>' + escape(r.title||r.name||r.id) + '</strong><br>' +
          escape((r.summary||r.content||r.text||'').slice(0,140)) + '</li>').join('') + '</ol>';
    }
  }
  setStatus('✓ KB 查询完成 · ' + results.length + ' 条结果', 'ok');
}

modeSel.addEventListener('change', () => { updateGuideForMode(); showGuide(!!stream); });
const voiceBtn = document.getElementById('voiceBtn');
if (voiceBtn) {
  voiceBtn.addEventListener('mousedown', e => { e.preventDefault(); startVoice(); });
  voiceBtn.addEventListener('touchstart', e => { e.preventDefault(); startVoice(); });
  voiceBtn.addEventListener('mouseup', e => { e.preventDefault(); stopVoice(); });
  voiceBtn.addEventListener('touchend', e => { e.preventDefault(); stopVoice(); });
  voiceBtn.addEventListener('mouseleave', () => { if (isRecording) stopVoice(); });
}

// 启动流时显示引导框 + 检测新设备
const _origStart = start;
window.start = async function() {
  await _origStart();
  showGuide(true);
  if (devices.filter(d => d.kind === 'videoinput').length > 0) {
    checkNewDevices(devices.filter(d => d.kind === 'videoinput'));
  }
};
const _origStop = stop;
window.stop = function() { _origStop(); showGuide(false); };

if (initSTT()) {
  const vp = document.getElementById('voicePanel');
  if (vp) vp.style.display = 'block';
}

updateGuideForMode();
showGuide(false);
