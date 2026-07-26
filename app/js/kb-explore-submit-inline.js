
const API = (location.hostname === '127.0.0.1' || location.hostname === 'localhost') ? 'http://127.0.0.1:8920' : location.origin;
let currentModule = 'bazi';
let selectedFile = null;
let currentPath = null;

// 路径切换
document.querySelectorAll('.path-card').forEach(card => {
  card.addEventListener('click', () => {
    const path = card.dataset.path;
    currentPath = path;
    document.querySelectorAll('.path-card').forEach(c => c.classList.remove('active'));
    card.classList.add('active');
    document.querySelectorAll('.form-panel').forEach(p => p.classList.remove('active'));
    document.getElementById('path-' + path).classList.add('active');
    document.getElementById('submitResult').classList.remove('show');
    if (path === 'file' || path === 'discover') {
      document.getElementById(path === 'file' ? 'f-module' : 'd-module').value = currentModule;
    }
  });
});

// 模块切换
document.querySelectorAll('#moduleTabs .tab-btn').forEach(tab => {
  tab.addEventListener('click', () => {
    currentModule = tab.dataset.module;
    document.querySelectorAll('#moduleTabs .tab-btn').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    if (currentPath === 'file') document.getElementById('f-module').value = currentModule;
    if (currentPath === 'discover') document.getElementById('d-module').value = currentModule;
  });
});

// 文件拖拽
const fileDrop = document.getElementById('fileDrop');
const fileInput = document.getElementById('fileInput');
fileDrop.addEventListener('click', () => fileInput.click());
fileDrop.addEventListener('dragover', e => { e.preventDefault(); fileDrop.classList.add('dragover'); });
fileDrop.addEventListener('dragleave', () => fileDrop.classList.remove('dragover'));
fileDrop.addEventListener('drop', e => {
  e.preventDefault(); fileDrop.classList.remove('dragover');
  if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener('change', e => {
  if (e.target.files.length) handleFile(e.target.files[0]);
});

function handleFile(f) {
  selectedFile = f;
  if (f.size > 30 * 1024 * 1024) { alert('文件过大（' + (f.size/1024/1024).toFixed(1) + ' MB），请 ≤ 30 MB'); return; }
  document.getElementById('fileName').textContent = f.name;
  document.getElementById('fileSize').textContent = (f.size/1024).toFixed(1) + ' KB';
  document.getElementById('fileInfo').style.display = 'block';
  document.getElementById('uploadBtn').disabled = false;
  if (!document.getElementById('f-title').value) {
    document.getElementById('f-title').value = f.name.replace(/\.[^.]+$/, '');
  }
}

function fileToB64(f) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result.split(',')[1]);
    r.onerror = reject;
    r.readAsDataURL(f);
  });
}

async function submitManual() {
  const title = document.getElementById('m-title').value.trim();
  const content = document.getElementById('m-content').value.trim();
  const notes = document.getElementById('m-notes').value.trim();
  if (!title) return alert('请填写标题');
  if (!content || content.length < 50) return alert('内容至少 50 字（当前 ' + content.length + ' 字）');
  await submit({ source_type: 'manual', title, content, module: currentModule, notes });
}

async function submitFile() {
  if (!selectedFile) return alert('请先选择文件');
  const title = document.getElementById('f-title').value.trim();
  if (!title) return alert('请填写标题');
  const b64 = await fileToB64(selectedFile);
  await submit({
    source_type: 'file', title, module: currentModule,
    file_b64: b64, file_name: selectedFile.name,
    notes: '文件类型: ' + selectedFile.name.split('.').pop()
  });
}

async function submitUrl() {
  const title = document.getElementById('u-title').value.trim();
  const url = document.getElementById('u-url').value.trim();
  const notes = document.getElementById('u-notes').value.trim();
  if (!title || !url) return alert('请填写标题和 URL');
  if (!url.match(/^https?:\/\//)) return alert('URL 必须以 http:// 或 https:// 开头');
  await submit({ source_type: 'url', title, url, module: currentModule, notes });
}

async function submit(payload) {
  const btns = document.querySelectorAll('.btn-primary');
  btns.forEach(b => { b.disabled = true; b.innerHTML = '<span class="spinner"></span>处理中...'; });
  try {
    const r = await fetch(API + '/api/kb/submit-material', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      credentials: 'include', body: JSON.stringify(payload)
    });
    const d = await r.json();
    showResult(d);
  } catch (e) {
    alert('提交失败：' + e.message);
  } finally {
    btns.forEach(b => { b.disabled = false; b.innerHTML = b.innerHTML.replace(/<[^>]+>/g, '').trim(); });
  }
}

function showResult(d) {
  if (!d || !d.ok) {
    alert('提交失败：' + (d?.error || '未知错误'));
    return;
  }
  const panel = document.getElementById('submitResult');
  panel.classList.add('show');
  panel.scrollIntoView({ behavior: 'smooth' });

  const score = d.audit?.trust_score || 0;
  document.getElementById('scoreCircle').textContent = score.toFixed(2);
  const cls = score >= 0.85 ? 'score-hi' : (score >= 0.5 ? 'score-mid' : 'score-lo');
  document.getElementById('scoreCircle').className = 'score-circle ' + cls;
  document.getElementById('progressBar').style.width = (score * 100) + '%';

  document.getElementById('entryId').textContent = 'Entry: ' + d.entry_id;
  document.getElementById('statusText').textContent = d.message;

  // 5 维审计明细
  const checks = d.audit?.checks || {};
  document.getElementById('checksList').innerHTML = Object.entries(checks).map(([k, v]) => {
    const cls = v.safe ? '' : 'warn';
    return `<div class="check-item ${cls}">
      <strong>${dimLabel(k)}：</strong>${v.safe ? '✅ 通过' : '⚠️ 警告'}<br>
      <span style="color: #888;">${v.notes || ''} · 分数 ${v.score.toFixed(2)}</span>
    </div>`;
  }).join('');

  // 最终消息
  const msg = document.getElementById('finalMessage');
  msg.style.display = 'block';
  msg.className = 'message-box ' + (d.auto_approved ? 'success' : (d.final_status === 'rejected' ? 'warning' : 'info'));
  msg.innerHTML = d.message + (d.promoted_to_formal ? '（已写入 kb_formal）' : '（已写入 kb_staging ' + d.final_status + '）');
}

function dimLabel(k) {
  return ({factual:'事实准确性',sensitive:'敏感词检测',completeness:'内容完整性',sources:'来源可信度',consistency:'一致性'})[k] || k;
}

function resetForm() {
  document.getElementById('submitResult').classList.remove('show');
  ['m-title','m-content','m-notes','f-title','u-title','u-url','u-notes'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  selectedFile = null;
  document.getElementById('fileInfo').style.display = 'none';
  document.getElementById('uploadBtn').disabled = true;
}

async function discoverOnline() {
  const query = document.getElementById('d-query').value.trim();
  if (!query) return alert('请填写寻找主题');
  const btn = event.target;
  btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>分析中...';
  try {
    const r = await fetch(API + '/api/kb/discover-online', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      credentials: 'include', body: JSON.stringify({ module: currentModule, query })
    });
    const d = await r.json();
    showDiscover(d);
  } catch (e) {
    alert('分析失败：' + e.message);
  } finally {
    btn.disabled = false; btn.innerHTML = '🔍 分析 KB 缺口 + 建议方向';
  }
}

function showDiscover(d) {
  if (!d.ok) { alert('失败：' + d.error); return; }
  const panel = document.getElementById('discoverResult');
  const content = document.getElementById('discoverContent');
  panel.classList.add('show');
  let html = '<div class="message-box info">' + (d.hint || '') + '</div>';
  if (d.kb_already_has?.length) {
    html += '<h5 style="color: #c9a84c; margin: 12px 0 8px;">📚 KB 已有相关条目（建议先查阅）</h5>';
    html += '<div class="kb-list">' + d.kb_already_has.map(x =>
      `<div class="kb-item"><div class="title">${x.title}</div><div class="snippet">${x.snippet}</div></div>`
    ).join('') + '</div>';
  } else {
    html += '<div class="message-box success">✅ KB 内无重复，可放心寻找新材料</div>';
  }
  if (d.suggestions?.length) {
    html += '<h5 style="color: #c9a84c; margin: 16px 0 8px;">💡 建议寻找方向</h5>';
    html += d.suggestions.map(s =>
      `<div class="discover-suggestion"><strong>${s.keyword}</strong><br><span style="color: #888; font-size: 12px;">${s.reason}</span></div>`
    ).join('');
  }
  html += '<div class="message-box warning" style="margin-top: 16px;">⚠️ 找到内容后，请通过「手动文本 / URL / 文件」三个路径提交，系统会自动审计真伪并入库。</div>';
  content.innerHTML = html;
}
