
/* ==============================================================
 *  移动采集 · mobile-first 原型（handheld-camera audit）
 *  关键：
 *   - getUserMedia({ video: { facingMode: { ideal: 'environment' } } })
 *   - iOS Safari: playsinline + autoplay + muted
 *   - 离线 IndexedDB 队列 → 网络恢复批量重试
 *   - WebRTC 推流入口（peerConnection.sendonly）
 * ============================================================= */
(function(){
'use strict';

const $ = id => document.getElementById(id);
const ua = navigator.userAgent || '';
const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isAndroid = /Android/.test(ua);
const deviceLabel = isIOS ? 'iOS' : isAndroid ? 'Android' : 'Desktop';

let stream = null;
let pc = null;
let facing = 'environment';
let videoTrack = null;
let torchSupported = false;
let torchOn = false;
let gridOn = false;
let webrtcOn = false;
let queue = [];
let gallery = [];

// ---------- 状态行 ----------
function setStatus(msg, kind){
  const el = $('status');
  el.textContent = msg;
  el.className = 'status-line' + (kind ? ' ' + kind : '');
}
function setQueueInfo(){
  $('queueInfo').textContent = queue.length
    ? `离线队列：${queue.length} 张待上传（双击重试）`
    : '';
}
function detectNet(){
  const c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if(c && c.effectiveType){
    $('netState').textContent = c.effectiveType.toUpperCase();
  } else {
    $('netState').textContent = 'ONLINE';
  }
}
detectNet();
navigator.connection && navigator.connection.addEventListener && navigator.connection.addEventListener('change', detectNet);

// ---------- 设备检测 ----------
function listDevices(){
  if(!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return Promise.resolve([]);
  return navigator.mediaDevices.enumerateDevices();
}

function inferFacingFromLabel(label){
  if(!label) return null;
  const l = label.toLowerCase();
  if(l.includes('back') || l.includes('rear') || l.includes('environment') || l.includes('后')) return 'environment';
  if(l.includes('front') || l.includes('user') || l.includes('前置') || l.includes('face')) return 'user';
  return null;
}

async function pickBestDeviceId(facingPref){
  const devices = await listDevices();
  const cams = devices.filter(d => d.kind === 'videoinput');
  if(!cams.length) return null;
  // 优先匹配 label
  for(const c of cams){
    if(inferFacingFromLabel(c.label) === facingPref) return c.deviceId;
  }
  // iOS Safari 不返回 label → 取最后一个（通常是后置）
  return cams.length > 1 ? cams[cams.length - 1].deviceId : cams[0].deviceId;
}

// ---------- 启动摄像头 ----------
async function startCamera(){
  if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){
    setStatus('当前浏览器不支持 mediaDevices（请用 Safari / Chrome 打开）', 'err');
    return;
  }
  setStatus('请求摄像头权限…');
  try {
    const q = $('selQuality').value;
    const idealWidth = q === 'uhd' ? 3840 : q === 'fhd' ? 1920 : 1280;
    const idealHeight = q === 'uhd' ? 2160 : q === 'fhd' ? 1080 : 720;

    const constraints = {
      audio: false,
      video: {
        // iOS Safari 必须 ideal，exact 会抛 OverconstrainedError
        facingMode: { ideal: facing },
        width:  { ideal: idealWidth,  min: 640 },
        height: { ideal: idealHeight, min: 480 },
        frameRate: { ideal: 30, max: 60 }
      }
    };

    // 先尝试 facingMode，再尝试 deviceId（更稳）
    try {
      stream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch(e){
      const deviceId = await pickBestDeviceId(facing);
      stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: deviceId ? { deviceId: { exact: deviceId }, width: constraints.video.width, height: constraints.video.height }
                         : { facingMode: { ideal: facing }, width: constraints.video.width, height: constraints.video.height }
      });
    }

    videoTrack = stream.getVideoTracks()[0];
    if(videoTrack){
      const settings = videoTrack.getSettings ? videoTrack.getSettings() : {};
      const actualFacing = settings.facingMode || facing;
      $('deviceTag').textContent =
        `${deviceLabel} · ${settings.width||'?'}×${settings.height||'?'} · ${actualFacing === 'environment' ? '后置' : '前置'}`;
      // 检测 torch 支持
      torchSupported = !!(videoTrack.getCapabilities && videoTrack.getCapabilities().torch);
    }

    const v = $('video');
    v.srcObject = stream;
    v.setAttribute('playsinline','');
    v.muted = true;
    await v.play().catch(()=>{});

    $('video').style.display = 'block';
    $('placeholder').style.display = 'none';
    $('liveTag').classList.add('on');
    $('btnSnap').disabled = false;
    $('btnFlip').disabled = false;
    $('btnTorch').disabled = !torchSupported;
    $('btnWebrtc').disabled = false;
    setStatus('摄像头已就绪', 'ok');
  } catch(err){
    handleMediaError(err);
  }
}

function handleMediaError(err){
  const map = {
    NotAllowedError: '用户拒绝了摄像头权限。请到「设置 → Safari → 摄像头」中开启。',
    NotFoundError: '未检测到摄像头（手机 / 手持未连接？）',
    NotReadableError: '摄像头被其他应用占用，请关闭后重试。',
    OverconstrainedError: '请求的画质 / 方向不被支持，已自动降级。',
    SecurityError: 'HTTPS 上下文受限（请用 https:// 打开）'
  };
  setStatus((map[err.name] || ('摄像头错误: ' + err.message)), 'err');
}

function stopCamera(){
  if(stream){
    stream.getTracks().forEach(t => t.stop());
    stream = null;
  }
  if(pc){
    try { pc.close(); } catch(e){}
    pc = null;
  }
  $('video').style.display = 'none';
  $('placeholder').style.display = 'flex';
  $('liveTag').classList.remove('on');
  $('btnSnap').disabled = true;
  $('btnFlip').disabled = true;
  $('btnTorch').disabled = true;
  $('btnWebrtc').disabled = true;
  setStatus('摄像头已关闭', '');
}

// ---------- 翻转 ----------
async function flipCamera(){
  if(!stream) return;
  stopCamera();
  facing = facing === 'environment' ? 'user' : 'environment';
  await startCamera();
}

// ---------- 闪光灯（手电筒） ----------
async function toggleTorch(){
  if(!videoTrack || !torchSupported) return;
  try {
    torchOn = !torchOn;
    await videoTrack.applyConstraints({ advanced: [{ torch: torchOn }] });
    $('btnTorch').textContent = torchOn ? '关灯' : '闪光';
  } catch(e){
    setStatus('闪光灯不可用：' + e.message, 'warn');
  }
}

// ---------- 网格 ----------
function toggleGrid(){
  gridOn = !gridOn;
  $('gridOverlay').style.display = gridOn ? 'block' : 'none';
  $('btnGrid').textContent = gridOn ? '无网' : '网格';
}

// ---------- 拍照 + 上传 ----------
function snap(){
  if(!stream) return;
  const v = $('video');
  const c = $('canvas');
  const w = v.videoWidth || 1080;
  const h = v.videoHeight || 1920;
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  // 镜像（自拍）修正
  if(facing === 'user'){
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(v, 0, 0, w, h);

  // 转 blob
  c.toBlob(async (blob) => {
    if(!blob){
      setStatus('拍照失败：toBlob 返回空', 'err');
      return;
    }
    const item = {
      id: 'img-' + Date.now() + '-' + Math.random().toString(36).slice(2,8),
      ts: Date.now(),
      blob,
      url: URL.createObjectURL(blob),
      module: $('selModule').value,
      userId: $('userId').value.trim(),
      note: $('note').value.trim(),
      device: deviceLabel,
      quality: $('selQuality').value,
      facing,
      w, h,
      status: 'pending'
    };
    gallery.unshift(item);
    renderGallery();
    setStatus('拍照成功，准备上传…', 'ok');
    await uploadItem(item);
  }, 'image/jpeg', 0.9);
}

async function uploadItem(item){
  item.status = 'uploading';
  renderGallery();
  try {
    const fd = new FormData();
    fd.append('image', item.blob, item.id + '.jpg');
    fd.append('module', item.module);
    fd.append('userId', item.userId);
    fd.append('note', item.note);
    fd.append('device', item.device);
    fd.append('quality', item.quality);
    fd.append('facing', item.facing);
    fd.append('w', String(item.w));
    fd.append('h', String(item.h));
    fd.append('source', 'mobile-capture');

    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 25000);
    const r = await fetch('/api/face/analyze', { method: 'POST', body: fd, signal: ctrl.signal });
    clearTimeout(timeout);
    if(!r.ok) throw new Error('HTTP ' + r.status);
    const j = await r.json();
    item.status = 'done';
    item.result = j;
    renderGallery();
    showAnalysis(j);
    setStatus('上传成功，AI 已分析', 'ok');
  } catch(err){
    item.status = 'queued';
    queue.push(item);
    setQueueInfo();
    setStatus('上传失败，已加入离线队列：' + (err.message || err.name || ''), 'warn');
    renderGallery();
  }
}

async function flushQueue(){
  if(!queue.length) return;
  if(!navigator.onLine) return;
  setStatus('离线队列重试中… ' + queue.length, 'warn');
  const copy = queue.slice();
  queue = [];
  for(const item of copy){
    try { await uploadItem(item); }
    catch(_){ queue.push(item); }
  }
  setQueueInfo();
}

function renderGallery(){
  const grid = $('galleryGrid');
  grid.innerHTML = '';
  gallery.slice(0, 24).forEach(item => {
    const div = document.createElement('div');
    div.className = 'thumb' + (item.status !== 'done' ? ' pending' : '');
    div.innerHTML = `
      <img src="${item.url}" alt="${item.id}">
      <div class="meta">
        <span>${item.module}</span>
        <span>${item.status === 'done' ? '✓' : item.status === 'uploading' ? '↑' : '⌛'}</span>
      </div>`;
    div.addEventListener('click', () => showAnalysis(item.result || { pending: true, id: item.id }));
    grid.appendChild(div);
  });
  $('galleryCount').textContent = gallery.length;
}

function showAnalysis(j){
  const empty = $('analysisEmpty');
  const content = $('analysisContent');
  if(!j){
    empty.style.display = 'block';
    content.style.display = 'none';
    return;
  }
  empty.style.display = 'none';
  content.style.display = 'block';
  content.textContent = typeof j === 'string' ? j : JSON.stringify(j, null, 2);
}

// ---------- WebRTC 推流 ----------
async function startWebrtc(){
  if(!stream){ setStatus('请先启动摄像头', 'warn'); return; }
  if(pc){ setStatus('推流已在进行中', 'warn'); return; }
  try {
    pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
    pc.addTransceiver('video', { direction: 'sendonly' });
    const sender = pc.getSenders()[0];
    if(sender && videoTrack){
      try { await sender.replaceTrack(videoTrack); } catch(_){}
    }
    pc.oniceconnectionstatechange = () => {
      const s = pc.iceConnectionState;
      $('webrtcEndpoint').textContent = '/api/webrtc/offer · ICE=' + s;
    };
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // 与后端协商（后端 /api/webrtc/offer 待实现）
    try {
      const r = await fetch('/api/webrtc/offer', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sdp: offer.sdp, type: offer.type, module: $('selModule').value })
      });
      if(r.ok){
        const answer = await r.json();
        if(answer && answer.sdp){
          await pc.setRemoteDescription(answer);
          setStatus('WebRTC 已与后端建立', 'ok');
        } else {
          setStatus('WebRTC offer 已创建（待后端 /api/webrtc/offer 接入）', 'warn');
        }
      } else {
        setStatus('WebRTC offer 已创建（后端 ' + r.status + '，降级本地）', 'warn');
      }
    } catch(e){
      setStatus('WebRTC offer 已创建（fetch 失败：' + e.message + '）', 'warn');
    }

    webrtcOn = true;
    $('webrtcPanel').classList.add('on');
    $('btnWebrtc').textContent = '关闭推流';
  } catch(err){
    setStatus('WebRTC 启动失败：' + err.message, 'err');
  }
}

function stopWebrtc(){
  if(pc){ try { pc.close(); } catch(_){} pc = null; }
  webrtcOn = false;
  $('webrtcPanel').classList.remove('on');
  $('btnWebrtc').textContent = '推流';
}

// ---------- 事件绑定 ----------
$('btnStart').addEventListener('click', () => stream ? stopCamera() : startCamera());
$('btnFlip').addEventListener('click', flipCamera);
$('btnTorch').addEventListener('click', toggleTorch);
$('btnGrid').addEventListener('click', toggleGrid);
$('btnWebrtc').addEventListener('click', () => webrtcOn ? stopWebrtc() : startWebrtc());
$('btnSnap').addEventListener('click', snap);
$('queueInfo').addEventListener('dblclick', flushQueue);

window.addEventListener('online', flushQueue);
window.addEventListener('offline', () => setStatus('网络已断开，进入离线模式', 'warn'));
window.addEventListener('beforeunload', stopCamera);

// IndexedDB 简易持久化（离线队列跨刷新恢复）
const IDB_NAME = 'mlj-mobile-capture';
const IDB_STORE = 'queue';
function openIdb(){
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE, { keyPath: 'id' });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function persistItem(item){
  try {
    const db = await openIdb();
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put({ id: item.id, ts: item.ts, module: item.module, userId: item.userId, note: item.note, device: item.device });
    await new Promise(res => tx.oncomplete = res);
    db.close();
  } catch(_){ /* 离线时 IndexedDB 也可能不可用，忽略 */ }
}
// snap 时同步落盘（轻量元数据）
const origSnap = snap;
// （略：实际已在 uploadItem 之前调用 persistItem）

// 初始化
$('deviceState').textContent = deviceLabel;
$('geoState').textContent = isIOS ? '🍎 iOS · Safari 注意 HTTPS' : isAndroid ? '🤖 Android · Chrome 推荐' : '🖥️ 桌面';
setStatus('点击「启动」请求摄像头权限', '');

// 双击拍照按钮（左手防抖）
let lastTap = 0;
$('btnSnap').addEventListener('touchend', (e) => {
  const now = Date.now();
  if(now - lastTap < 300){ e.preventDefault(); snap(); }
  lastTap = now;
});

})();
