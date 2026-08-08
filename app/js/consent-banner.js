/**
 * consent-banner.js
 * ====================================================================
 * 命理宝鉴 · 首次同意弹窗（GDPR/PIPL 合规）
 * --------------------------------------------------------------------
 * 首次访问时弹出同意弹窗，用户必须选择：
 *   - 「同意全部」→ 记录所有 consentType = true
 *   - 「自定义」→ 跳转 privacy-center.html
 *   - 「仅必需」→ 只记录必需项，其他 false
 * 之后 30 天内不再弹出（localStorage 记录）
 * ====================================================================
 */
(function(){
  'use strict';

  const CONSENT_VERSION = 'v1.1.0';
  const BANNER_KEY = '_consent_v';
  const BANNER_EXPIRY_DAYS = 30;

  function shouldShow(){
    try {
      const raw = localStorage.getItem(BANNER_KEY);
      if (!raw) return true;
      const data = JSON.parse(raw);
      if (data.version !== CONSENT_VERSION) return true;
      const age = Date.now() - (data.ts || 0);
      return age > BANNER_EXPIRY_DAYS * 86400000;
    } catch(e) { return true; }
  }

  function record(granted){
    try {
      localStorage.setItem(BANNER_KEY, JSON.stringify({
        version: CONSENT_VERSION,
        ts: Date.now(),
        granted,
      }));
    } catch(e) { /* 隐私模式静默 */ }
    // 后台记录
    const token = localStorage.getItem('jwt') || '';
    const api = (location.protocol==='https:'?'https://':'http://') + location.host;
    fetch(api + '/api/v1/user/consents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ consentType: 'analytics', granted, version: CONSENT_VERSION }), signal: AbortSignal.timeout(15000) }).catch(()=>{});
  }

  function injectStyles(){
    const css = `
      #consent-banner{
        position:fixed;bottom:0;left:0;right:0;z-index:99999;
        background:linear-gradient(135deg,#1a2436,#0e1726);
        border-top:2px solid #4fd1c5;
        padding:20px 24px;
        font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Helvetica Neue",sans-serif;
        color:#e6edf7;
        transform:translateY(100%);
        transition:transform .3s ease-out;
      }
      #consent-banner.show{transform:translateY(0);}
      #consent-banner .cb-inner{max-width:880px;margin:0 auto;}
      #consent-banner h3{margin:0 0 8px;font-size:16px;color:#4fd1c5;}
      #consent-banner p{margin:0 0 12px;font-size:13px;color:#8a99b5;line-height:1.5;}
      #consent-banner .cb-btns{display:flex;gap:8px;flex-wrap:wrap;}
      #consent-banner .cb-btn{
        padding:10px 20px;border:0;border-radius:6px;font-size:14px;font-weight:600;cursor:pointer;
        text-decoration:none;display:inline-block;transition:all .2s;
      }
      #consent-banner .cb-accept{background:#4fd1c5;color:#0e1726;}
      #consent-banner .cb-essential{background:#2a3953;color:#e6edf7;}
      #consent-banner .cb-custom{background:transparent;border:1px solid #4fd1c5;color:#4fd1c5;}
      #consent-banner .cb-btn:hover{opacity:.9;transform:translateY(-1px);}
      @media(max-width:768px){
        #consent-banner{padding:16px;}
        #consent-banner .cb-btns{flex-direction:column;}
        #consent-banner .cb-btn{width:100%;text-align:center;}
      }
    `;
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }

  function createBanner(){
    const div = document.createElement('div');
    div.id = 'consent-banner';
    div.innerHTML = `
      <div class="cb-inner">
        <h3>🍪 隐私偏好</h3>
        <p>
          命理宝鉴重视你的隐私。我们使用 Cookie 和本地存储来提供核心功能（排盘、知识库、智能问诊），
          并可选地收集匿名统计数据以改进产品。
          <a href="privacy-center.html" style="color:#4fd1c5;">前往隐私中心</a>
        </p>
        <div class="cb-btns">
          <button class="cb-btn cb-accept" id="cb-accept">✅ 同意全部</button>
          <button class="cb-btn cb-essential" id="cb-essential">🔒 仅必需</button>
          <a class="cb-btn cb-custom" href="privacy-center.html">⚙️ 自定义设置</a>
        </div>
      </div>
    `;
    document.body.appendChild(div);

    requestAnimationFrame(()=>div.classList.add('show'));

    document.getElementById('cb-accept').onclick = () => {
      record(true);
      div.classList.remove('show');
      setTimeout(()=>div.remove(), 300);
    };
    document.getElementById('cb-essential').onclick = () => {
      record(false);
      div.classList.remove('show');
      setTimeout(()=>div.remove(), 300);
    };
  }

  if (shouldShow()){
    if (document.readyState === 'loading'){
      document.addEventListener('DOMContentLoaded', ()=>{
        injectStyles();
        createBanner();
      });
    } else {
      injectStyles();
      createBanner();
    }
  }
})();