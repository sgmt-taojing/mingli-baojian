// admin-rbac-shared.js — R318 通用 RBAC + 三态 + token 共享模块
// 适用：admin-glass-dashboard / admin-kb-panel / admin-notify / admin-shop / yuanzhu-dashboard 等

const ADMIN_VALID_ROLES = new Set(['admin_b', 'super_admin', 'master', 'doctor']);
const ADMIN_ROLE_DISPLAY = {
  admin_b: '业务管理员',
  super_admin: '超管',
  master: '周易大师',
  doctor: '中医医生',
};

function getAdminRoles() {
  const raw = localStorage.getItem('user_roles') || localStorage.getItem('user_role') || 'admin_b';
  return raw.split(',').map(s => s.trim()).filter(Boolean);
}
function hasAdminAccess() {
  return getAdminRoles().some(r => ADMIN_VALID_ROLES.has(r));
}
function getAdminToken() {
  return localStorage.getItem('admin_token') || localStorage.getItem('token') || '';
}
function saveAdminToken(t) {
  if (t) { localStorage.setItem('admin_token', t); return true; }
  return false;
}

// 权限不足时整个 main 区域替换
function showAdminDenied() {
  const roles = getAdminRoles();
  const main = document.querySelector('main') || document.body;
  main.innerHTML = `
    <div style="max-width:600px;margin:80px auto;padding:32px;background:var(--card-bg,#1a1a1a);border:1px solid var(--gold,#daa520);border-radius:8px;text-align:center;font-family:sans-serif;color:#eee">
      <div style="font-size:48px;margin-bottom:16px">🔒</div>
      <h1 style="color:var(--gold,#daa520);margin:0 0 16px">权限不足</h1>
      <p style="color:#aaa;margin:0 0 12px">当前角色无权访问此后台页面</p>
      <p style="color:#888;font-size:13px;margin:0 0 8px">需要角色：业务管理员 / 周易大师 / 中医医生 / 超管</p>
      <p style="color:#888;font-size:13px;margin:0 0 24px">当前角色：${roles.map(r => ADMIN_ROLE_DISPLAY[r] || r).join(', ') || '匿名'}</p>
      <a href="index.html" style="display:inline-block;padding:8px 20px;background:var(--gold,#daa520);color:#000;border-radius:4px;text-decoration:none;font-weight:600">← 返回首页</a>
    </div>
  `;
}

// 三态 UI 辅助
function setElState(el, state, message) {
  if (!el) return;
  el.classList.remove('state-loading', 'state-empty', 'state-error');
  if (state === 'loading') el.classList.add('state-loading');
  else if (state === 'error') el.classList.add('state-error');
  else if (state === 'empty') el.classList.add('state-empty');
  if (message != null) el.textContent = message;
}

// 自动在 DOMContentLoaded 时检查 RBAC
document.addEventListener('DOMContentLoaded', () => {
  const need = document.body.getAttribute('data-need-admin');
  if (need === 'true' && !hasAdminAccess()) {
    showAdminDenied();
  }
});

window.ADMIN_VALID_ROLES = ADMIN_VALID_ROLES;
window.ADMIN_ROLE_DISPLAY = ADMIN_ROLE_DISPLAY;
window.getAdminRoles = getAdminRoles;
window.hasAdminAccess = hasAdminAccess;
window.getAdminToken = getAdminToken;
window.saveAdminToken = saveAdminToken;
window.showAdminDenied = showAdminDenied;
window.setElState = setElState;
