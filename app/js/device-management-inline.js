
// === R46: 设备管理中心（统一设备平台）===

const CATEGORY_META = {
  vision:    { icon: '👁',   name: '看 · 视觉' },
  audio:     { icon: '👂',  name: '听 · 音频' },
  wearable: { icon: '⌚',  name: '穿戴 · 智能' },
  sensor:    { icon: '📡',  name: '传感器 · 环境' }
};

const SUBTYPE_ICONS = {
  camera: '📷', microphone: '🎙️', speaker: '🔊', headset: '🎧',
  ar_glasses: '👓', smart_watch: '⌚', smart_ring: '💍',
  fitness_band: '⌚', heart_rate: '❤️', spo2: '💧',
  motion: '🏃', sleep_tracker: '😴'
};

const SERVICES = [
  { name: '排盘 API', url: 'http://127.0.0.1:8911/health', key: 'paipan' },
  { name: 'TTS 语音', url: 'http://127.0.0.1:8912/health', key: 'tts' },
  { name: '面诊 OCR', url: 'http://127.0.0.1:8913/api/camera/health', key: 'face-ocr' },
  { name: '静态服务', url: 'http://127.0.0.1:8914/', key: 'static' },
  { name: 'API 网关', url: 'http://127.0.0.1:8920/api/health', key: 'api-v2' },
  { name: 'KB 知识库', url: 'http://127.0.0.1:8901/', key: 'kb-api' }
];

let platform = null;
let allDevices = [];
let healthStatuses = {};
let logEntries = [];
let stats = { online: 0, offline: 0, error: 0 };

function log(msg, level) {
  level = level || 'ok';
  const t = new Date().toTimeString().slice(0, 8);
  logEntries.unshift({ time: t, msg, level });
  if (logEntries.length > 100) logEntries.length = 100;
  renderLogs();
}

function renderLogs() {
  const el = document.getElementById('logList');
  if (!el) return;
  el.innerHTML = logEntries.map(e =>
    '<div class="log-entry ' + e.level + '"><span class="time">' + e.time +
    '</span><span class="msg">' + esc(e.msg) + '</span></div>'
  ).join('');
}

function esc(s) { return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

function renderDevices() {
  const grid = document.getElementById('deviceGrid');
  if (!grid) return;

  const groups = {};
  allDevices.forEach(d => {
    if (!groups[d.category]) groups[d.category] = [];
    groups[d.category].push(d);
  });

  stats.online = allDevices.filter(d => d.status === 'online').length;
  stats.error = allDevices.filter(d => d.status === 'error').length;
  stats.offline = allDevices.filter(d => ['registered', 'discovered'].includes(d.status)).length;

  document.getElementById('sumOnline').textContent = stats.online;
  document.getElementById('sumOffline').textContent = stats.offline;
  document.getElementById('sumError').textContent = stats.error;
  document.getElementById('devCountBadge').textContent = allDevices.length + ' 台';

  const cards = [];
  Object.entries(groups).forEach(([cat, devs]) => {
    const meta = CATEGORY_META[cat] || { icon: '📱', name: cat };
    cards.push('<div class="category-group">');
    cards.push('<div class="category-header">' + meta.icon + ' ' + meta.name + ' <span style="font-size:10px;opacity:.6">(' + devs.length + ')</span></div>');
    devs.forEach(d => cards.push(renderDeviceCard(d)));
    cards.push('</div>');
  });

  if (allDevices.length === 0) cards.push(renderDiscoverGuide());

  grid.innerHTML = cards.join('');
}

function renderDeviceCard(d) {
  const icon = SUBTYPE_ICONS[d.subType] || '📱';
  const statusCls = d.status === 'online' ? 'online' : d.status === 'error' ? 'error' : 'offline';
  const statusLabel = d.status === 'online' ? '在线' : d.status === 'error' ? '异常' : (d.status === 'authorized' ? '已授权' : '待接入');

  const capLabels = (d.capabilities || []).slice(0, 3).map(c => {
    const reg = DeviceCapabilityRegistry && DeviceCapabilityRegistry[c];
    return reg ? '<span style="font-size:9px;padding:2px 5px;border-radius:3px;background:rgba(201,168,76,.12);color:var(--gold);margin-right:4px">' + reg.desc + '</span>' : '';
  }).join('');

  const h = d.health || {};
  const healthRow = d.status === 'online'
    ? '<div style="font-size:10px;color:var(--paper3);margin-top:6px">' +
      (h.fps ? 'FPS ' + h.fps + ' · ' : '') +
      (h.latencyMs ? h.latencyMs + 'ms · ' : '') +
      (h.batteryPct !== null && h.batteryPct !== undefined ? '🔋' + h.batteryPct + '% · ' : '') +
      (h.errorCount ? '<span style="color:var(--danger)">错误 ' + h.errorCount + '</span>' : '') +
      '</div>'
    : '';

  const label = (platform.userProfile.labels[d.id] || d.model || d.vendor || '未知设备').slice(0, 30);

  return '<div class="device-card ' + statusCls + '">' +
    '<div class="device-head">' +
      '<div class="device-icon">' + icon + '</div>' +
      '<div class="device-name" title="' + esc(d.vendor) + ' ' + esc(d.model) + '">' + esc(label) + '</div>' +
      '<div class="device-status ' + statusCls + '">' + statusLabel + '</div>' +
    '</div>' +
    '<div style="font-size:10px;color:var(--paper3);margin-bottom:6px">' +
      (d.connection === 'bluetooth' ? '🔵 蓝牙 · ' : d.connection === 'usb' ? '🔌 Type-C · ' : '') +
      (d.subType || '未知') + ' · ID:' + (d.id || '').slice(-6) +
    '</div>' +
    (capLabels ? '<div style="margin-bottom:6px">' + capLabels + '</div>' : '') +
    healthRow +
    '<div class="device-actions">' +
      (d.status !== 'online'
        ? '<button class="dev-btn" onclick="authorizeDevice(\'' + d.id + '\')">🔓 授权激活</button>'
        : '<button class="dev-btn" onclick="openInCapture(\'' + d.category + '\')">📸 打开采集</button>') +
      '<button class="dev-btn" onclick="renameDevice(\'' + d.id + '\')">✏️ 重命名</button>' +
    '</div>' +
  '</div>';
}

function renderDiscoverGuide() {
  return '<div style="text-align:center;padding:30px;background:var(--ink3);border:1px dashed rgba(201,168,76,.3);border-radius:var(--radius)">' +
    '<div style="font-size:40px;margin-bottom:12px">🔍</div>' +
    '<div style="color:var(--gold);font-size:14px;letter-spacing:2px">未检测到设备</div>' +
    '<div style="color:var(--paper3);font-size:11px;margin-top:8px">请连接 Type-C 摄像头 / 麦克风 / AR 眼镜，或点击下方按钮扫描</div>' +
    '<div style="margin-top:16px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap">' +
      '<button class="dev-btn" onclick="discoverAll()">🔍 扫描设备</button>' +
      '<button class="dev-btn" onclick="scanBluetooth()">🔵 扫描蓝牙</button>' +
      '<button class="dev-btn" onclick="scanUSB()">🔌 扫描 Type-C</button>' +
    '</div>' +
  '</div>';
}

async function authorizeDevice(id) {
  const d = platform.get(id);
  if (!d) return;
  const needVideo = (d.capabilities || []).some(c => c.includes('capture') || c.includes('face') || c.includes('tongue') || c.includes('eye') || c.includes('document'));
  const needAudio = (d.capabilities || []).some(c => c.includes('voice') || c.includes('stt') || c.includes('audio') || c.includes('wake') || c.includes('p_record'));
  const result = await platform.authorizeWebMedia(d.metadata.deviceId, needVideo, needAudio);
  if (result.ok) {
    log('✓ ' + d.vendor + ' 已授权激活', 'ok');
    refreshAll();
  } else {
    log('✗ 授权失败：' + result.error, 'err');
  }
}

function renameDevice(id) {
  const d = platform.get(id);
  if (!d) return;
  const current = platform.userProfile.labels[id] || d.model || d.vendor;
  const newName = prompt('设备名称：', current);
  if (newName && newName.trim()) {
    platform.setLabel(id, newName.trim());
    log('✓ 已重命名：' + current + ' → ' + newName.trim(), 'ok');
    refreshAll();
  }
}

function openInCapture(cat) {
  const targets = { vision: 'camera-capture.html', audio: 'camera-capture.html', wearable: 'glass-console.html', sensor: 'camera-capture.html' };
  window.location.href = targets[cat] || 'camera-capture.html';
}

async function discoverAll() {
  log('🔍 全类别扫描中…', 'ok');
  platform.bridges.webmedia.startHotplug();
  const devices = await platform.discoverAll();
  log('✓ 发现 ' + devices.length + ' 个设备', 'ok');
  refreshAll();
}

async function scanBluetooth() {
  log('🔵 扫描蓝牙设备…', 'ok');
  try {
    const devices = await platform.pairBluetooth();
    log('✓ 发现 ' + devices.length + ' 个蓝牙设备', 'ok');
  } catch (e) {
    log('⚠ 蓝牙扫描失败：' + e.message, 'warn');
  }
  refreshAll();
}

async function scanUSB() {
  log('🔌 扫描 Type-C 设备…', 'ok');
  try {
    const devices = await platform.scanUSB();
    log('✓ 发现 ' + devices.length + ' 个 USB 设备', 'ok');
  } catch (e) {
    log('⚠ USB 扫描失败：' + e.message, 'warn');
  }
  refreshAll();
}

async function probeRokid() {
  const el = document.getElementById('sdkResult');
  el.style.display = 'block';
  el.innerHTML = '⏳ 探测中…';
  try {
    const result = await platform.bridges.ar_glasses.probeRokid();
    const badge = document.getElementById('sdkBadge');
    if (result.ready) {
      badge.textContent = 'Rokid ' + result.bridgeKind;
      badge.style.background = 'var(--ok)';
      badge.style.color = '#000';
      el.innerHTML = '✅ Rokid 原生桥已就绪（' + result.bridgeKind + '）<br>' +
        '可调用能力：camera.capture / audio.speak / motion.subscribe<br>' +
        'SDK 事件枚举：' + Object.keys(result.event || {}).slice(0, 8).join(', ') + '…';
      log('👓 Rokid 原生桥已就绪（' + result.bridgeKind + '）', 'ok');
    } else {
      badge.textContent = '未就绪';
      badge.style.background = 'var(--warn)';
      badge.style.color = '#000';
      el.innerHTML = '⚠️ 未探测到 Rokid 原生桥<br>' +
        '可能原因：1) Rokid 眼镜未接入  2) 不是 Rokid WebView 环境<br>' +
        '降级方案：使用 WebMediaBridge (getUserMedia) 访问内置摄像头';
      log('⚠ Rokid 原生桥未探测到', 'warn');
    }
    refreshAll();
  } catch (e) {
    el.innerHTML = '✗ 探测异常：' + e.message;
    log('✗ Rokid 探测异常：' + e.message, 'err');
  }
}

async function testCapture() {
  const bridge = platform.bridges.ar_glasses;
  log('📸 尝试拍照…', 'ok');
  const result = await bridge.capturePhoto('tongue');
  if (result.ok) {
    log('✓ 拍照成功：' + JSON.stringify(result.data).slice(0, 80), 'ok');
  } else {
    log('✗ 拍照失败：' + result.error + '（未连接 Rokid 或未授权）', 'warn');
  }
}

async function testSpeak() {
  const bridge = platform.bridges.ar_glasses;
  log('🔊 尝试 TTS…', 'ok');
  const result = await bridge.speak('您好，欢迎使用易道智鉴');
  if (result.ok) {
    log('✓ TTS 成功（骨传导优先）', 'ok');
  } else {
    log('✗ TTS 失败：' + result.error + '（未连接 Rokid）', 'warn');
  }
}

function refreshAll() {
  allDevices = platform.list();
  renderDevices();
}

async function checkService(svc) {
  const start = Date.now();
  try {
    const r = await fetch(svc.url, { cache: 'no-store', mode: 'cors', credentials: 'omit' });
    const elapsed = Date.now() - start;
    return { ok: r.ok, latency: elapsed, status: r.status };
  } catch (e) {
    return { ok: false, latency: -1, error: e.message };
  }
}

async function checkAllServices() {
  const checks = await Promise.all(SERVICES.map(async svc => {
    const result = await checkService(svc);
    return { ...svc, ...result };
  }));
  const passed = checks.filter(c => c.ok).length;
  healthStatuses = checks;
  const sumEl = document.getElementById('sumHealth');
  if (sumEl) {
    sumEl.textContent = passed + '/' + SERVICES.length;
    sumEl.style.color = passed === SERVICES.length ? 'var(--ok)' : passed >= SERVICES.length - 1 ? 'var(--warn)' : 'var(--danger)';
  }
  renderHealth(checks);
}

function renderHealth(checks) {
  const el = document.getElementById('healthList');
  if (!el) return;
  el.innerHTML = checks.map(c => {
    let cls = 'fast', txt = c.latency + 'ms';
    if (!c.ok || c.latency < 0) { cls = 'crit'; txt = '✗ 离线'; }
    else if (c.latency > 500) cls = 'slow';
    return '<div class="health-row">' +
      '<div><div class="service-name">' + esc(c.name) + '</div><div class="service-url">' + esc(c.url) + '</div></div>' +
      '<div class="latency ' + cls + '">' + txt + '</div>' +
      '<div style="font-size:10px;color:var(--paper3)">' + (c.ok ? 'HTTP ' + c.status : (c.error || '失败')) + '</div>' +
      '<div class="actions"><button class="dev-btn" onclick="checkOneService(\'' + c.key + '\')">🔄 重测</button></div>' +
    '</div>';
  }).join('');
}

async function checkOneService(key) {
  const svc = SERVICES.find(s => s.key === key);
  if (!svc) return;
  const result = await checkService(svc);
  const idx = healthStatuses.findIndex(s => s.key === key);
  if (idx >= 0) healthStatuses[idx] = { ...svc, ...result };
  renderHealth(healthStatuses);
  log(svc.name + ': ' + (result.ok ? '✓ ' + result.latency + 'ms' : '✗ ' + (result.error || '失败')), result.ok ? 'ok' : 'err');
}

async function init() {
  log('🚀 设备平台启动 · R46 统一设备抽象层', 'ok');

  if (!window.__devicePlatform) {
    log('⚠ DevicePlatform 未加载，重试…', 'warn');
    await new Promise(r => setTimeout(r, 500));
    if (!window.__devicePlatform) {
      log('✗ DevicePlatform 加载失败', 'err');
      return;
    }
  }
  platform = window.__devicePlatform;

  platform.bus.on('device:connected', d => log('🔌 设备接入：' + (d.vendor || d.model || d.id), 'ok'));
  platform.bus.on('device:disconnected', d => log('🔌 设备断开：' + (d.id || '').slice(-8), 'warn'));
  platform.bus.on('device:error', d => log('⚠ 设备错误：' + (d.error || d.message || ''), 'err'));
  platform.bus.on('device:authorized', d => { log('✓ 设备激活：' + (d.vendor || d.model), 'ok'); refreshAll(); });

  await discoverAll();
  platform.startMonitoring();
  log('✓ 热插拔监听已启动（devicechange + 3s 轮询 + 5s 健康采样）', 'ok');

  await checkAllServices();
  log('✓ 后端健康检查：' + (healthStatuses.filter(s => s.ok).length) + '/' + SERVICES.length + ' 服务在线', 'ok');

  setInterval(checkAllServices, 30000);

  console.log('[DevicePlatform] 总设备数：' + allDevices.length, '桥接器：', Object.keys(platform.bridges).join(','));

  // R62: 设备 ↔ KB 联动桥（拍照/采集 → 自动 recordKbHit）
  if (window.DeviceKbBridge && typeof window.DeviceKbBridge.attach === 'function') {
    window.DeviceKbBridge.attach(platform);
    // 全局事件：设备采集 → 刷新 KB 联动 badge
    window.addEventListener('device:kb:capture', function (e) {
      log('📸 [' + e.detail.icon + '] 已联动 KB · ' + e.detail.label + ' (记录到 ' + e.detail.module + ')', 'ok');
      refreshKbBadges();
    });
    // 首次渲染 KB 状态
    setTimeout(refreshKbBadges, 800);
  }
  // 提供手动触发接口（给拍照页跳过来用）
  window.onDeviceCapture = function (capability, extra) {
    if (window.DeviceKbBridge) window.DeviceKbBridge.onCapture(capability, extra);
  };
}

/**
 * R62: 设备卡 KB 联动 badge 刷新
 */
function refreshKbBadges() {
  if (!window.DeviceKbBridge) return;
  const grid = document.getElementById('deviceGrid');
  if (!grid) return;
  const cards = grid.querySelectorAll('.device-card');
  // 简化：在 grid 顶部加一条 KB 联动状态条
  let bar = document.getElementById('kb-bind-bar');
  const recent = window.DeviceKbBridge.getRecentContext();
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'kb-bind-bar';
    bar.style.cssText = 'grid-column:1/-1;padding:12px;margin-bottom:14px;background:linear-gradient(135deg,rgba(62,158,107,.08),rgba(201,168,76,.05));border:1px solid rgba(62,158,107,.3);border-radius:var(--radius);font-size:12px';
    grid.insertBefore(bar, grid.firstChild);
  }
  if (recent.length === 0) {
    bar.innerHTML = '<span style="color:var(--paper3)">⚪ KB 待联动</span> · <span style="font-size:10px;color:var(--paper3)">设备拍照/录音后将自动记录到知识库</span>';
  } else {
    const modules = {};
    recent.forEach(e => {
      if (e.module && (!modules[e.module])) modules[e.module] = e;
    });
    const tags = Object.values(modules).map(m => '<span style="display:inline-block;padding:4px 10px;margin-right:6px;border-radius:8px;background:rgba(62,158,107,.15);color:var(--ok);border:1px solid rgba(62,158,107,.3)">' + m.icon + ' ' + m.label + ' ×' + recent.filter(e => e.module === m.module).length + '</span>').join('');
    bar.innerHTML = '<span style="color:var(--gold);letter-spacing:2px">⚡ KB 实时联动</span> · ' + tags + '<span style="font-size:10px;color:var(--paper3);margin-left:8px">最近 5 分钟 · AI 助手下次查询自动加权</span>';
  }
}

// R62: API 供 AI 助手拉取
window.getDeviceContext = function () {
  if (!window.DeviceKbBridge) return [];
  return window.DeviceKbBridge.getRecentContext();
};
window.getDeviceModuleBoost = function () {
  if (!window.DeviceKbBridge) return {};
  return window.DeviceKbBridge.getModuleBoost();
};

init();
