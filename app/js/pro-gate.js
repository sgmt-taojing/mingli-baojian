/**
 * pro-gate.js — 专业排盘工具门禁（R-PRO-GATE）
 * 专业排盘页仅向 管理员 / 命理师 开放；大众信众引导至 ask.html 问事页。
 * 判定：localStorage admin_token 的 JWT payload.roles ∈ 允许角色（与 consult-workbench 同一解码法）。
 * 说明：这是 UX 层软门禁（排盘 API 本身公开），防止大众误入口专业界面；
 *       真正的权限管控在服务端 RBAC。
 */
(function () {
  'use strict';

  // 允许角色：超管 / 国学运营 / 命理大师
  var ALLOWED = ['super_admin', 'admin_a', 'master'];

  function decodeRoles(t) {
    try {
      var p = t.split('.')[1];
      p = p.replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(decodeURIComponent(escape(atob(p)))).roles || [];
    } catch (e) { return []; }
  }

  function deny() {
    var mask = document.createElement('div');
    mask.id = 'pro-gate-mask';
    mask.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(10,10,18,.96);display:flex;align-items:center;justify-content:center;padding:24px;font-family:\'PingFang SC\',system-ui,sans-serif';
    mask.innerHTML =
      '<div style="max-width:360px;text-align:center;background:#15151f;border:1px solid rgba(201,168,76,.35);border-radius:14px;padding:28px 22px">' +
      '<div style="font-size:36px;margin-bottom:10px">🔐</div>' +
      '<div style="font-size:16px;color:#e8cc7a;font-weight:600;margin-bottom:8px">专业排盘工作台</div>' +
      '<div style="font-size:13px;line-height:1.9;color:#b8b0a0;margin-bottom:18px">本页为命理师 / 管理员专用工具。<br>如果您想问事问运，无需排盘——<br>用「问事」页问答式采集，AI 自动排盘并给出白话解读。</div>' +
      '<a href="ask.html" style="display:block;padding:12px;background:linear-gradient(135deg,#c9a84c,#e8cc7a);color:#1a1408;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;margin-bottom:10px">💬 去问事（大众入口）</a>' +
      '<a href="admin-login.html" style="display:block;padding:10px;border:1px solid rgba(201,168,76,.4);color:#c9a84c;border-radius:8px;text-decoration:none;font-size:13px">命理师 / 管理员登录</a>' +
      '</div>';
    document.body.appendChild(mask);
  }

  function run() {
    var token = localStorage.getItem('admin_token') || '';
    var roles = token ? decodeRoles(token) : [];
    if (roles.some(function (r) { return ALLOWED.indexOf(r) >= 0; })) return; // 放行
    deny();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
