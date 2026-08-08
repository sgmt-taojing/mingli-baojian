
/* ============ 全局态 ============ */
const API_BASE = (location.hostname === '127.0.0.1' || location.hostname === 'localhost')
  ? 'http://127.0.0.1:8920/api/v1' : '/api/v1';

// ME 用户身份：优先从 localStorage 读 token 解码，否则从 userInfo 同步
function getCurrentMe() {
  // 优先尝试 JWT 解码
  try {
    const tk = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (tk && tk.split('.').length === 3) {
      const payload = JSON.parse(atob(tk.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (payload.uid || payload.userId || payload.id) {
        return {
          id: String(payload.uid || payload.userId || payload.id),
          role: payload.role || 'user',
          name: payload.name || payload.username || '访客'
        };
      }
    }
  } catch(e) {}
  // 否则用持久化的访客 ID（首次访问写入）
  let gid = localStorage.getItem('im_user_id');
  if (!gid) {
    // 用稳定的 nonce（基于日期的非随机值）
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    gid = 'guest_' + today;
    localStorage.setItem('im_user_id', gid);
  }
  return {
    id: gid,
    role: localStorage.getItem('im_user_role') || 'user',
    name: localStorage.getItem('im_user_name') || '访客'
  };
}
const ME = getCurrentMe();
localStorage.setItem('im_user_role', ME.role);
localStorage.setItem('im_user_id', ME.id);
localStorage.setItem('im_user_role', ME.role);

let currentChatId = null;
let sseSource = null;

/* ============ API 封装 ============ */
async function api(path, options = {}){
  const r = await fetch(API_BASE + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': ME.id,
      'X-User-Role': ME.role,
      ...(options.headers || {})
    }, signal: AbortSignal.timeout(15000) });
  const data = await r.json().catch(() => ({ ok:false, error:'PARSE_FAIL' }));
  if(!data.ok){
    toast(data.message || data.error || '请求失败', 'err');
    throw new Error(data.message || data.error);
  }
  return data;
}

/* ============ 视图切换 ============ */
document.querySelectorAll('.tab').forEach(t => {
  t.onclick = () => {
    document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
    document.querySelectorAll('.view').forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    document.getElementById('view-' + t.dataset.view).classList.add('active');
    if(t.dataset.view === 'sessions') loadSessions();
    else loadDirectory();
  };
});

/* ============ 加载会话列表 ============ */
async function loadSessions(){
  const box = document.getElementById('sessionList');
  box.innerHTML = '<div class="loading"><span class="spinner"></span>加载会话中...</div>';
  try{
    const { sessions } = await api('/im/sessions');
    if(!sessions.length){
      box.innerHTML = `
        <div class="empty">
          <div class="empty-icon">💬</div>
          <div class="empty-title">还没有会话</div>
          <div class="empty-desc">从通讯录发起对话<br>或召唤 智能助手解惑</div>
          <ml-tap class="empty-btn" role="button" tabindex="0" onclick="document.querySelector('.tab[data-view=directory]').click()">打开通讯录</ml-tap>
        </div>`;
      return;
    }
    box.innerHTML = sessions.map(s => {
      const otherParts = s.participants.filter(p => p.user_id !== ME.id);
      const otherName = s.is_group ? (s.title || '群聊') :
        (otherParts[0]?.role === 'ai' ? 'AI 命理助手' :
         otherParts.map(p => roleLabel(p.role)).join('/') || '会话');
      const avatarClass = s.is_group ? 'group' : (otherParts[0]?.role === 'ai' ? 'ai' : '');
      const avatarChar = s.is_group ? '群' : (otherParts[0]?.role === 'ai' ? 'AI' :
        (otherParts[0]?.user_id || '?').toString().slice(0,2));
      return `
        <ml-tap class="session-item" onclick="openChat(${s.id}, '${escAttr(otherName)}')" variant="card" role="button" tabindex="0">
          <div class="avatar ${avatarClass}">${escHtml(avatarChar)}</div>
          <div class="session-info">
            <div class="session-title">
              <div class="session-name">${escHtml(otherName)}</div>
              <div class="session-time">${formatTime(s.last_msg_at)}</div>
            </div>
            <div class="session-preview">
              <div class="preview-text">${escHtml(s.last_msg_preview || '暂无消息')}</div>
              ${s.unread > 0 ? `<div class="preview-unread">${s.unread}</div>` : ''}
            </div>
          </div>
        </ml-tap>`;
    }).join('');
  }catch(e){
    box.innerHTML = `<div class="empty"><div class="empty-icon">⚠️</div><div class="empty-title">查阅失败</div><div class="empty-desc">${escHtml(e.message)}</div></div>`;
  }
}

/* ============ 加载通讯录 ============ */
async function loadDirectory(){
  const box = document.getElementById('directoryList');
  box.innerHTML = '<div class="loading"><span class="spinner"></span>加载通讯录中...</div>';
  try{
    const { list, allowRoles } = await api('/im/directory');
    const grouped = {};
    for(const r of allowRoles) grouped[r] = [];
    for(const u of list){
      const r = u.role || 'user';
      if(!grouped[r]) grouped[r] = [];
      grouped[r].push(u);
    }
    const order = ['ai','admin','master','doctor','agent','user'];
    let html = '';
    for(const r of order){
      const arr = grouped[r];
      if(!arr || !arr.length) continue;
      html += `<div class="role-section"><div class="role-label">${roleLabel(r)} · ${arr.length}</div></div><div class="contact-list">`;
      for(const u of arr){
        html += `
          <ml-tap class="contact-item" onclick="startDirectChat('${escAttr(u.id)}','${escAttr(u.role)}','${escAttr(u.name)}')" variant="card" role="button" tabindex="0">
            <div class="avatar ${u.role==='ai'?'ai':''}">${u.role==='ai'?'AI':escHtml(u.name.slice(0,2))}</div>
            <div class="contact-info">
              <div class="contact-name">${escHtml(u.name)}<span class="role-tag ${u.role}">${roleLabel(u.role)}</span></div>
              <div class="contact-role">${u.role==='ai'?'可召唤进入任意会话':'点击发起对话'}</div>
            </div>
          </ml-tap>`;
      }
      html += '</div>';
    }
    box.innerHTML = html || '<div class="empty"><div class="empty-icon">📭</div><div class="empty-title">通讯录为空</div></div>';
  }catch(e){
    box.innerHTML = `<div class="empty"><div class="empty-icon">⚠️</div><div class="empty-title">查阅失败</div><div class="empty-desc">${escHtml(e.message)}</div></div>`;
  }
}

/* ============ 新建会话按钮 ============ */
document.getElementById('newBtn').onclick = () => {
  document.querySelector('.tab[data-view=directory]').click();
};

/* ============ 发起一对一对话 ============ */
async function startDirectChat(oid, orole, oname){
  try{
    const { sessionId } = await api('/im/sessions', {
      method: 'POST',
      body: JSON.stringify({ participants: [{ id: oid, role: orole }], isGroup: false })
    });
    openChat(sessionId, orole === 'ai' ? 'AI 命理助手' : oname);
  }catch(e){
    toast('创建会话失败：' + e.message, 'err');
  }
}

/* ============ 打开聊天面板 ============ */
async function openChat(sid, title){
  currentChatId = sid;
  document.getElementById('chatTitle').textContent = title;
  document.getElementById('chatPanel').classList.add('active');
  document.getElementById('aiBtn').style.display = title.includes('AI') ? 'none' : 'inline-block';
  await loadMessages(sid);
  // 标记已读
  api('/im/sessions/' + sid + '/read', { method: 'POST' }).catch(()=>{});
}

document.getElementById('chatBack').onclick = () => {
  document.getElementById('chatPanel').classList.remove('active');
  currentChatId = null;
  loadSessions();
};

/* ============ 加载历史消息 ============ */
async function loadMessages(sid){
  const body = document.getElementById('chatBody');
  body.innerHTML = '<div class="loading"><span class="spinner"></span>加载消息...</div>';
  try{
    const { messages } = await api('/im/sessions/' + sid + '/messages?limit=50');
    renderMessages(messages);
  }catch(e){
    body.innerHTML = `<div class="empty"><div class="empty-icon">⚠️</div><div class="empty-title">查阅失败</div></div>`;
  }
}

function renderMessages(msgs){
  const body = document.getElementById('chatBody');
  if(!msgs.length){
    body.innerHTML = '<div class="empty"><div class="empty-icon">👋</div><div class="empty-title">开始对话吧</div></div>';
    return;
  }
  let html = '';
  let lastDate = '';
  for(const m of msgs){
    const dt = new Date(m.created_at);
    const dateStr = dt.toLocaleDateString('zh-CN');
    if(dateStr !== lastDate){
      html += `<div class="msg-time">${dateStr}</div>`;
      lastDate = dateStr;
    }
    const isMe = m.sender_id === ME.id;
    const isSystem = m.msg_type === 'system';
    const isAi = m.sender_role === 'ai';
    html += `<div class="msg ${isMe?'me':(isSystem?'system':(isAi?'ai':'other'))}">`;
    if(!isMe && !isSystem){
      html += `<div class="avatar ${isAi?'ai':''}">${isAi?'AI':escHtml(m.sender_id.slice(0,2))}</div>`;
    }
    html += `<div>
      <div class="msg-bubble">${escHtml(m.content)}</div>
      <div class="msg-meta">${dt.toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})}</div>
    </div></div>`;
  }
  body.innerHTML = html;
  body.scrollTop = body.scrollHeight;
}

/* ============ 发送消息 ============ */
async function sendMessage(){
  const input = document.getElementById('msgInput');
  const text = input.value.trim();
  if(!text || !currentChatId) return;
  const btn = document.getElementById('sendBtn');
  btn.disabled = true;
  input.value = '';
  try{
    await api('/im/sessions/' + currentChatId + '/messages', {
      method: 'POST',
      body: JSON.stringify({ content: text, msgType: 'text' })
    });
    // 重新加载（也可乐观更新）
    await loadMessages(currentChatId);
  }catch(e){
    toast('发送失败：' + e.message, 'err');
  }finally{
    btn.disabled = false;
    input.focus();
  }
}

document.getElementById('sendBtn').onclick = sendMessage;
document.getElementById('msgInput').addEventListener('keydown', e => {
  if(e.key === 'Enter' && !e.shiftKey){
    e.preventDefault();
    sendMessage();
  }
});

/* ============ 智能助手召唤 ============ */
document.getElementById('aiBtn').onclick = async () => {
  if(!currentChatId) return;
  const input = document.getElementById('msgInput');
  const question = input.value.trim() || '请基于本次对话上下文给出整体建议';
  try{
    const { answer } = await api('/im/sessions/' + currentChatId + '/ai', {
      method: 'POST',
      body: JSON.stringify({ question, module: 'bazi' })
    });
    toast('AI 已回应', 'ok');
    await loadMessages(currentChatId);
  }catch(e){
    toast('召唤失败：' + e.message, 'err');
  }
};

/* ============ 工具函数 ============ */
function escHtml(s){ return String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function escAttr(s){ return escHtml(s).replace(/"/g,'&quot;'); }
function roleLabel(r){
  return ({admin:'管理员',master:'大师',doctor:'医师',agent:'代理',user:'信众',ai:'智能助手'})[r] || r;
}
function formatTime(ts){
  if(!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const diff = (now - d) / 1000;
  if(diff < 60) return '刚刚';
  if(diff < 3600) return Math.floor(diff/60) + '分钟前';
  if(diff < 86400) return Math.floor(diff/3600) + '小时前';
  if(diff < 86400*7) return Math.floor(diff/86400) + '天前';
  return d.toLocaleDateString('zh-CN').slice(5);
}

/* ============ 启动 ============ */
loadSessions();
loadUnread();
setInterval(loadUnread, 30000);

// === SSE 实时消息推送 ===
let sseRetry = 0;
function connectSSE() {
  try {
    if (sseSource) sseSource.close();
    const url = API_BASE + '/im/stream?' + (ME.id ? 'token=' + encodeURIComponent(localStorage.getItem('token')||'') : '');
    sseSource = new EventSource(url);
    sseSource.addEventListener('message', e => {
      try {
        const m = JSON.parse(e.data);
        // 当前打开该会话 → 追加；否则刷新未读
        if (currentChatId && m.session_id == currentChatId) {
          appendIncomingMessage(m);
        } else {
          loadUnread();
          // 非当前会话：会话列表顶部加一条提示
          toast('新消息：' + (m.content || '').slice(0, 20), 'info');
        }
      } catch(_){}
    });
    sseSource.onerror = () => {
      sseSource.close();
      // 指数退避重连：3s, 6s, 12s, 30s 上限
      sseRetry = Math.min(sseRetry + 1, 5);
      const wait = Math.min(3000 * Math.pow(2, sseRetry - 1), 30000);
      setTimeout(connectSSE, wait);
    };
    sseSource.onopen = () => { sseRetry = 0; };
  } catch(e) {
    console.warn('SSE connect failed:', e);
  }
}
connectSSE();

function appendIncomingMessage(m) {
  const body = document.getElementById('chatBody');
  // 移除空态
  const empty = body.querySelector('.empty');
  if (empty) empty.remove();
  const isMe = m.sender_id === ME.id;
  const isAi = m.sender_role === 'ai';
  const isSystem = m.msg_type === 'system';
  const dt = new Date(m.created_at || Date.now());
  const wrap = document.createElement('div');
  wrap.className = 'msg ' + (isMe ? 'me' : (isSystem ? 'system' : (isAi ? 'ai' : 'other')));
  wrap.innerHTML = `
    ${(!isMe && !isSystem) ? `<div class="avatar ${isAi?'ai':''}">${isAi?'AI':escHtml(String(m.sender_id).slice(0,2))}</div>` : ''}
    <div>
      <div class="msg-bubble">${escHtml(m.content || '')}</div>
      <div class="msg-meta">${dt.toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})}</div>
    </div>`;
  body.appendChild(wrap);
  body.scrollTop = body.scrollHeight;
}

// 离开页面前关闭 SSE
window.addEventListener('beforeunload', () => { try { sseSource && sseSource.close(); } catch(_){} });

async function loadUnread(){
  try{
    const { unread } = await api('/im/unread-count');
    const badge = document.getElementById('topBadge');
    if(unread > 0){
      badge.textContent = unread;
      badge.style.display = 'block';
    }else{
      badge.style.display = 'none';
    }
  }catch(_){}
}
