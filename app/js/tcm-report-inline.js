
// ===== 数据状态 =====
const report = {
  media: { tongue: null, face: null, eye: null, hand: null },
  inquiry: {},
  diagnosis: null,
  constitution: null,
  prescribe: null,
  lifestyle: null,
  formula: null,
};

// ===== 初始化 =====
document.getElementById('pt-date').value = new Date().toISOString().slice(0,10);
updateMeridianClock();
setInterval(updateMeridianClock, 60000);
loadTongue28Quick();
loadFace36Quick();
detectGlass();

// ===== 影像 =====
window.handleMedia = function(input, role) {
  const file = input.files[0]; if (!file) return;
  const slot = document.getElementById('slot-' + role);
  const reader = new FileReader();
  reader.onload = (e) => {
    report.media[role] = { dataUrl: e.target.result, name: file.name, size: file.size, time: Date.now() };
    slot.innerHTML = `<img src="${e.target.result}" alt="${role}影像"><input type="file" accept="image/*" onchange="window.handleMedia(this,'${role}')" aria-label="更换${role}"><span class="slot-label">${role}影像</span>`;
    slot.classList.add('filled');
  };
  reader.readAsDataURL(file);
};

// ===== 问诊 =====
document.querySelectorAll('.q-input').forEach(input => {
  input.addEventListener('change', () => { report.inquiry[input.dataset.q] = input.value; });
});

// ===== 语音录入（Web Speech fallback） =====
let recognition = null;
const voiceStatus = document.getElementById('voice-status');

window.startRecording = async function() {
  const btn = document.getElementById('btn-voice');
  if (recognition) { recognition.stop(); return; }
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) { voiceStatus.textContent = '⚠️ 当前浏览器不支持语音识别'; return; }
  recognition = new SpeechRecognition(); recognition.lang = 'zh-CN'; recognition.continuous = true; recognition.interimResults = true;
  recognition.onresult = (e) => {
    const text = Array.from(e.results).map(r => r[0].transcript).join('');
    voiceStatus.textContent = '🎤 识别中: ' + text;
    // 自动填充问诊
    if (e.results[e.results.length-1].isFinal) fillInquiry(text);
  };
  recognition.onerror = (e) => { voiceStatus.textContent = '⚠️ 识别出错: ' + e.error; };
  recognition.onend = () => { btn.textContent = '🎤 语音录入'; btn.classList.remove('primary'); voiceStatus.classList.remove('recording'); };
  btn.textContent = '⏹ 停止'; btn.classList.add('primary'); voiceStatus.classList.add('recording');
  recognition.start();
};

function fillInquiry(text) {
  const map = { 怕冷:'coldHeat', 怕热:'coldHeat', 睡眠:'sleep', 失眠:'sleep', 饮食:'appetite', 大便:'bowel', 小便:'bowel', 二便:'bowel', 情绪:'emotion', 经期:'menstrual', 出汗:'sweat', 汗:'sweat' };
  for (const [kw, q] of Object.entries(map)) {
    if (text.includes(kw) && !report.inquiry[q]) { report.inquiry[q] = text; }
  }
}

// ===== AI辨证 =====
window.runDiagnosis = async function() {
  const result = document.getElementById('diagnosis-result');
  result.innerHTML = '<div class="empty-state">🧠 AI 辨证推演中，请稍候...</div>';
  try {
    // 收集问诊数据
    document.querySelectorAll('.q-input').forEach(i => { if (i.value) report.inquiry[i.dataset.q] = i.value; });
    const resp = await fetch('/api/ai/lifeplan-report', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ module:'tcm-diagnosis', data: { inquiry: report.inquiry, media: Object.keys(report.media).filter(k=>report.media[k]) } }) });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || '辨证失败');
    report.diagnosis = data.diagnosis || data;
    renderDiagnosis(data);
    renderConstitution(data.constitution || data.tizhi);
    if (data.prescribe || data.acupoints) renderPrescribe(data.prescribe || data.acupoints);
    if (data.lifestyle) renderLifestyle(data.lifestyle);
    if (data.formula) renderFormula(data.formula);
  } catch (err) {
    result.innerHTML = `<div class="diagnosis-box"><p class="remark">⚠️ 辨证请求失败: ${err.message}</p><p class="remark">请检查后端服务是否运行 (端口 8920)</p></div>`;
  }
};

function renderDiagnosis(data) {
  const el = document.getElementById('diagnosis-result');
  const tags = [];
  if (data.bagang) data.bagang.forEach(b => { const cls = b.includes('热')?'tag-hot':b.includes('寒')?'tag-cold':b.includes('虚')?'tag-xu':b.includes('实')?'tag-shi':'tag-neutral'; tags.push(`<span class="tag ${cls}">${b}</span>`); });
  if (data.zangfu) data.zangfu.forEach(z => tags.push(`<span class="tag tag-neutral">${z}</span>`));
  el.innerHTML = `
    <div class="diagnosis-box">
      <h3 style="margin:0 0 .4rem">八纲辨证</h3>
      <div>${tags.join('') || '—'}</div>
      ${data.summary ? `<p class="remark"><strong>辨证概要:</strong> ${data.summary}</p>` : ''}
      ${data.remark ? `<p class="remark"><strong>备注:</strong> ${data.remark}</p>` : ''}
    </div>
    ${(data.images && data.images.length) ? '<h3>影像结果</h3>' + data.images.map(i => '<img src="' + (i.url||i) + '" style="max-width:100%;border-radius:4px;margin:.3rem 0">').join('') : ''}
  `;
  // 语音播报辨证概要
  if (data.summary) speakText(data.summary);
}

function renderConstitution(tizhi) {
  const el = document.getElementById('constitution-result');
  if (!tizhi) { el.innerHTML = '<div class="empty-state">未判定</div>'; return; }
  const cls = tizhi.includes('虚') ? 'tag-xu' : tizhi.includes('热') ? 'tag-hot' : 'tag-neutral';
  el.innerHTML = `<span class="tag ${cls}" style="font-size:.85rem">${tizhi}</span><p class="remark" style="margin-top:.4rem">${constitutionDesc(tizhi)}</p>`;
}
function constitutionDesc(t) {
  const d = { '平和质':'阴阳气血调和，体态适中', '气虚质':'元气不足，疲乏气短', '阳虚质':'阳气不足，畏寒肢冷', '阴虚质':'阴液亏少，口燥咽干', '痰湿质':'痰湿凝聚，体肥痰多', '湿热质':'湿热内蕴，面垢油光', '血瘀质':'血行不畅，肤色晦暗', '气郁质':'气机郁滞，神情抑郁', '特禀质':'先天失常，过敏体质' };
  return d[t] || '需结合辨证判定';
}

function renderPrescribe(pts) {
  const el = document.getElementById('prescribe-result');
  if (!pts || !pts.length) { el.innerHTML = '<div class="empty-state">无取穴推荐</div>'; return; }
  el.innerHTML = '<div class="acupoint-list">' + pts.map(p => {
    const ap = ACUPUNCTURE_KB.points[p] || {}; const m = ACUPUNCTURE_KB.twelveMeridians ? '' : ''; // KB 已挂 global
    return `<div class="acupoint-item"><span class="ap-name">${p}</span><span class="ap-meridian">${ap.经||'—'}</span><span class="ap-fn">${ap.主治||''}</span></div>`;
  }).join('') + '</div>';
}

function renderLifestyle(lf) {
  const el = document.getElementById('lifestyle-result');
  if (!lf) { el.innerHTML = '<div class="empty-state">未生成</div>'; return; }
  const cards = lf.map(item => `<div class="lifestyle-card"><h4>${item.title||'调养'}</h4><ul>${(item.items||[item.text]).map(i=>`<li>${i}</li>`).join('')}</ul></div>`).join('');
  el.innerHTML = `<div class="lifestyle-grid">${cards}</div>`;
}

function renderFormula(fml) {
  const el = document.getElementById('formula-result');
  if (!fml) { el.innerHTML = '<div class="empty-state">无处方推荐</div>'; return; }
  el.innerHTML = `<div class="diagnosis-box"><strong>建议方剂:</strong> ${fml.name || '—'}<p class="remark">${fml.summary || ''}</p><p class="remark"><strong>组成:</strong> ${fml.ingredients ? fml.ingredients.join('、') : '需医师开方'}</p></div>`;
}

// ===== 一键抓拍 =====
window.captureAll = async function() {
  const btn = document.getElementById('btn-capture');
  btn.disabled = true; btn.textContent = '📷 抓拍中...';
  try {
    // 优先走 wearable SDK
    if (window.RokidGlass && RokidGlass.camera) {
      const stream = await RokidGlass.camera.openCamera('tongue');
      const track = stream.getVideoTracks()[0];
      const imageCapture = new ImageCapture(track);
      const blob = await imageCapture.takePhoto();
      handleMedia({ files: [new File([blob], 'tongue-' + Date.now() + '.jpg', { type: 'image/jpeg' })] }, 'tongue');
    }
    // 尝试调用后端 glass/upload
    const slots = ['tongue','face','eye','hand'];
    for (const slot of slots) { if (!report.media[slot]) captureSlot(slot); }
  } catch (e) { voiceStatus.textContent = '⚠️ 抓拍失败: ' + e.message; }
  btn.disabled = false; btn.textContent = '📷 一键抓拍';
};

async function captureSlot(role) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    const video = document.createElement('video'); video.srcObject = stream; await video.play();
    const canvas = document.createElement('canvas'); canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    canvas.toBlob(blob => { if (blob) handleMedia({ files: [new File([blob], role + '-' + Date.now() + '.jpg', { type: 'image/jpeg' })] }, role); });
    stream.getTracks().forEach(t => t.stop());
  } catch (e) { console.warn('[抓拍]', role, e.message); }
}

// ===== 打印 PDF =====
window.printPDF = () => window.print();

// ===== 清空 =====
window.clearReport = () => {
  if (!confirm('确认清空全部病历内容？')) return;
  Object.values(report.media).forEach((_,k) => { delete report.media[k]; });
  report.inquiry = {}; report.diagnosis = null; report.constitution = null;
  ['tongue','face','eye','hand'].forEach(r => {
    const slot = document.getElementById('slot-'+r); slot.innerHTML = `<input type="file" accept="image/*" onchange="window.handleMedia(this,'${r}')" aria-label="${r}影像"><span class="slot-icon">${{tongue:'👅',face:'😐',eye:'👁',hand:'✋'}[r]}</span><span class="slot-label">${r==='eye'?'目诊':r==='face'?'面诊':r==='hand'?'手诊':r==='tongue'?'舌象':r}</span>`;
    slot.classList.remove('filled');
  });
  document.querySelectorAll('.q-input').forEach(i => i.value = '');
  document.getElementById('diagnosis-result').innerHTML = '<div class="empty-state">点击「AI辨证」推演八纲辨证 + 五脏辨证 + 体质分型</div>';
  document.getElementById('constitution-result').innerHTML = '<div class="empty-state">辨证后自动判定</div>';
  document.getElementById('prescribe-result').innerHTML = '<div class="empty-state">辨证完成后自动推荐取穴</div>';
  document.getElementById('lifestyle-result').innerHTML = '<div class="empty-state">辨证完成后生成调养方案</div>';
  document.getElementById('formula-result').innerHTML = '<div class="empty-state">辨证完成后推荐经方</div>';
};

// ===== 子午流注时钟 =====
function updateMeridianClock() {
  const h = new Date().getHours();
  const m = new Date().getMinutes();
  const t = h + m / 60;
  const meridian = ({ 23:'胆经',1:'胆经',3:'肝经',5:'肺经',7:'大肠经',9:'脾经',11:'心经',13:'小肠经',15:'膀胱经',17:'肾经',19:'心包经',21:'三焦经' });
  // 匹配时辰（23/1,3,5,7,9,11,13,15,17,19,21）
  const periods = [{s:23,e:1.5,m:'胆经'},{s:1.5,e:3.5,m:'肝经'},{s:3.5,e:5.5,m:'肺经'},{s:5.5,e:7.5,m:'大肠经'},{s:7.5,e:9.5,m:'脾经'},{s:9.5,e:11.5,m:'心经'},{s:11.5,e:13.5,m:'小肠经'},{s:13.5,e:15.5,m:'膀胱经'},{s:15.5,e:17.5,m:'肾经'},{s:17.5,e:19.5,m:'心包经'},{s:19.5,e:21.5,m:'三焦经'},{s:21.5,e:23.5,m:'胆经'}];
  let cur = periods[0];
  for (const p of periods) { if ((t >= p.s && t < p.e) || (p.s > p.e && (t >= p.s || t < p.e))) { cur = p; break; } }
  document.getElementById('meridian-now').textContent = `${cur.m} (${hourLabel(t)})`;
}
function hourLabel(t) {
  const l = {23:'子时',1:'丑时',3:'寅时',5:'卯时',7:'辰时',9:'巳时',11:'午时',13:'未时',15:'申时',17:'酉时',19:'戌时',21:'亥时'};
  const k = Math.floor(t); return l[k] || `${k}:00`;
}

// ===== 舌面诊速查 =====
function loadTongue28Quick() {
  const kb = window.TCM_DIAGNOSIS_KB.tongue28; if (!kb) return;
  const el = document.getElementById('tongue28-quick');
  const items = [];
  for (const [cat, dict] of Object.entries(kb)) {
    items.push('<strong>' + cat + ':</strong> ' + Object.entries(dict).slice(0,4).map(([k,v])=>k+'='+v).join('；'));
  }
  el.innerHTML = items.join('<br>');
}
function loadFace36Quick() {
  const kb = window.TCM_DIAGNOSIS_KB.face36; if (!kb) return;
  const el = document.getElementById('face36-quick');
  const items = Object.entries(kb).filter(([cat])=>['五色','五部','五志'].includes(cat)).map(([cat,dict])=>'<strong>'+cat+':</strong> '+Object.entries(dict).map(([k,v])=>k+'→'+v).join('、'));
  el.innerHTML = items.join('<br>');
}

// ===== 眼镜状态 =====
async function detectGlass() {
  const el = document.getElementById('glass-status');
  try {
    if (window.RokidGlass) {
      const cap = await RokidGlass.probe();
      el.innerHTML = '✅ <strong>先知智镜已连接</strong><br>摄像头: ' + (cap.cameras||[]).length + '路<br>骨传导: ' + (cap.boneConduction?'✅':'❌') + '<br>唤醒词: ' + (cap.voiceWakeup?'✅':'❌');
    } else {
      el.innerHTML = '🔧 <strong>PC浏览器模式</strong><br>使用本地摄像头 + 扬声器<br>眼镜端功能需配合Rokid眼镜使用';
    }
  } catch (e) { el.innerHTML = '❌ 眼镜检测失败: ' + e.message; }
}

// ===== 语音播报 =====
function speakText(text) {
  fetch('/api/tts', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ text: text.substring(0,200), voice: 'female-mandarin' }) })
    .then(r => r.blob()).then(blob => { const url = URL.createObjectURL(blob); const a = new Audio(url); a.play().catch(()=>{}); }).catch(()=>{});
}

// ===== 键盘快捷键 =====
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'p') { e.preventDefault(); printPDF(); }
  if (e.ctrlKey && e.key === 'd') { e.preventDefault(); runDiagnosis(); }
});
