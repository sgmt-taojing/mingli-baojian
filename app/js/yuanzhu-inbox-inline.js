
(function(){
'use strict';

const token = localStorage.getItem('mlbj_token') || '';
const user = JSON.parse(localStorage.getItem('mlbj_user') || '{}');
const userTagEl = document.getElementById('userTag');

if (!token) {
  // 访客模式：提示登录
  userTagEl.textContent = '未登录 · 访客模式';
} else {
  userTagEl.textContent = (user.name || '缘主') + ' · ' + (user.isSuper ? '管理员' : (user.vipLevel || 'free'));
}

let allItems = [];
let currentFilter = 'all';

async function loadInbox() {
  const content = document.getElementById('content');
  content.innerHTML = '<div class="loading">正在为您查阅典籍...</div>';
  if (!token) {
    content.innerHTML = '<div class="empty-state"><div class="icon">🔒</div><h3>请先登录</h3><p>登录后查看您的年度推送</p><p style="margin-top:14px;"><a href="login.html" style="color:var(--c-primary);">前往登录</a></p></div>';
    return;
  }
  try {
    const r = await fetch('/api/yuanzhu/yearly-pushes?limit=50', { signal: AbortSignal.timeout(15000),
      headers: { 'Authorization': 'Bearer ' + token }, signal: AbortSignal.timeout(15000) });
    const d = await r.json();
    if (!d.ok) {
      content.innerHTML = '<div class="empty-state"><div class="icon">⚠️</div><h3>查阅失败</h3><p>' + (d.message || '未知错误') + '</p></div>';
      return;
    }
    allItems = d.items || [];
    render();
  } catch (e) {
    content.innerHTML = '<div class="empty-state"><div class="icon">❌</div><h3>网络错误</h3><p>' + e.message + '</p></div>';
  }
}

function render() {
  const currentYear = new Date().getFullYear();
  let filtered = allItems;
  if (currentFilter === 'unread') filtered = allItems.filter(it => !it.is_read);
  else if (currentFilter === 'year') filtered = allItems.filter(it => it.year === currentYear);

  // stats
  const years = [...new Set(allItems.map(it => it.year))];
  document.getElementById('statTotal').textContent = allItems.length;
  document.getElementById('statYears').textContent = years.length;
  document.getElementById('statUnread').textContent = allItems.filter(it => !it.is_read).length;

  const content = document.getElementById('content');
  if (filtered.length === 0) {
    content.innerHTML = '<div class="empty-state"><div class="icon">📭</div><h3>暂无推送</h3><p>' + (currentFilter === 'unread' ? '没有未读推送' : (currentFilter === 'year' ? '本年度还未推送' : '请先完成一次排盘，将自动累积年度推送')) + '</p></div>';
    return;
  }
  content.innerHTML = filtered.map(it => {
    const yearLabel = it.year + ' 年';
    const readClass = it.is_read ? 'read' : '';
    const readBadge = it.is_read ? '<span class="read-flag is-read">已读</span>' : '<span class="read-flag">未读</span>';
    const sentAt = it.sent_at || it.created_at || '';
    return `
      <div class="inbox-card ${readClass}" data-id="${it.id}">
        <div>
          <span class="year-tag">${yearLabel}</span>
          ${readBadge}
          <span style="color:var(--c-muted);font-size:12px;">${sentAt}</span>
        </div>
        <div class="push-content">${escapeHtml(it.content)}</div>
      </div>
    `;
  }).join('');
}

function escapeHtml(s) {
  if (!s) return '';
  return String(s).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

// filter pills
document.querySelectorAll('.filter-row .pill').forEach(p => {
  p.addEventListener('click', () => {
    document.querySelectorAll('.filter-row .pill').forEach(x => x.classList.remove('active'));
    p.classList.add('active');
    currentFilter = p.dataset.filter;
    render();
  });
});

loadInbox();
})();
