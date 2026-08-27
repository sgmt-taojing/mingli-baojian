/**
 * TCM-Agent 全局导航 + 认证 V1.0
 * 所有页面统一引用此脚本，自动注入导航栏和认证状态
 * 使用方式: <script src="js/nav.js"></script>
 */
(function() {
  if (typeof window === 'undefined') return;

  // ─── 页面路由映射 ───
  var PAGES = {
    login:    { name: '登录',     icon: '🔑', roles: ['*'] },
    index:    { name: '辨证论治', icon: '🔍', roles: ['*'] },
    clinical: { name: '四诊采集', icon: '🔬', roles: ['doctor'] },
    doctor:   { name: '医生工作台',icon:'🩺', roles: ['doctor'] },
    admin:    { name: '患者管理', icon: '📊', roles: ['admin'] },
    pharmacy: { name: '药房管理', icon: '💊', roles: ['pharmacist'] },
    payment:  { name: '收银台',   icon: '💳', roles: ['patient'] },
    patient:  { name: '自助服务', icon: '👤', roles: ['patient','*'] },
    schedule: { name: '排班管理', icon: '📅', roles: ['admin'] },
    dashboard:{ name: '数据看板', icon: '📈', roles: ['admin'] },
    followup: { name: '随访管理', icon: '📞', roles: ['doctor'] },
    report:   { name: '诊断报告', icon: '📋', roles: ['patient','doctor'] },
    emr:      { name: '电子病历', icon: '📝', roles: ['doctor'] },
    acupuncture:{ name: '针灸治疗', icon:'📍', roles: ['doctor'] },
    twin:     { name: '数字孪生', icon: '🔄', roles: ['doctor','patient'] },
    wearable: { name: '设备监控', icon: '⌚', roles: ['admin','doctor'] },
    monitor:  { name: '分析预警', icon: '📈', roles: ['admin'] },
    flows:    { name: '流程图',   icon: '🔀', roles: ['*'] },
    rbac:     { name: '权限管理', icon: '🛡️', roles: ['admin'] },
    settings: { name: '隐私·升级', icon: '⚙️', roles: ['*'] },
    aidx:     { name: 'AI快速辨证', icon: '🤖', roles: ['doctor','admin'] },
    emerg:    { name: '紧急救助', icon: '🚨', roles: ['*'] },
    rec:      { name: '智能推荐', icon: '🎯', roles: ['*'] },
    therapy:  { name: '中医理疗', icon: '💆', roles: ['*'] },
    inv:      { name: '药房库存', icon: '📦', roles: ['pharmacist','admin'] },
    fin:      { name: '运营财务', icon: '💰', roles: ['admin'] },
    tele:     { name: '远程会诊', icon: '📹', roles: ['doctor','patient'] },
    well:     { name: '治未病', icon: '🌿', roles: ['*'] },
    call:     { name: '叫号中心', icon: '📢', roles: ['*'] },
    msg:      { name: '消息中心', icon: '🔔', roles: ['*'] },
    archive:  { name: '健康档案', icon: '📁', roles: ['patient','doctor'] },
    hospital: { name: '医院门户', icon: '🏥', roles: ['*'] },
    doctors:  { name: '医生团队', icon: '👨‍⚕️', roles: ['*'] },
    dskb:     { name: '病种知识库', icon: '📚', roles: ['*'] },
    safety:   { name: '用药安全检测', icon: '🧪', roles: ['pharmacist','doctor','admin'] },
    sysmon:   { name: '系统监控', icon: '🖥', roles: ['admin'] },
    efficacy: { name: '精准治疗分析', icon: '🎯', roles: ['doctor','admin'] },
    longitudinal: { name: '长程画像', icon: '🧬', roles: ['doctor','admin'] },
    kb_evolution: { name: 'KB进化仪表盘', icon: '🧠', roles: ['doctor','admin'] },
    home: { name: '居家中医助手', icon: '🏠', roles: ['*'] },
    family: { name: '家庭成员管理', icon: '👨‍👩‍👧', roles: ['*'] }
  };

  // ─── 读取用户 ───
  var user = null;
  try { user = JSON.parse(localStorage.getItem('tcm_user')); } catch(e) {}

  // ─── 角色页面权限 ───
  var rolePages = {
    super_admin: ['admin','dashboard','schedule','doctor','pharmacy','clinical','index','followup','emr','acupuncture','twin','wearable','monitor','flows','rbac','aidx','emerg','mobile','summary','rec','therapy','inv','fin','tele','well','call','msg','archive','hospital','safety','sysmon','efficacy','longitudinal','kb_evolution','home','family','clinic-desk','monitor-dashboard','wuzhen','fconsult','chronic','doctors','dskb','settings'],
    doctor_internal: ['doctor','clinical','index','followup','report','emr','acupuncture','twin','wearable','flows','aidx','emerg','rec','therapy','tele','well','call','msg','archive','hospital','safety','longitudinal','kb_evolution','clinic-desk','wuzhen','fconsult','chronic','doctors','dskb','settings'],
    doctor_acupuncture: ['doctor','clinical','index','followup','report','emr','acupuncture','twin','wearable','flows','aidx','emerg','rec','therapy','tele','well','call','msg','archive','hospital','safety','longitudinal','kb_evolution','wuzhen','fconsult','chronic','doctors','dskb','settings'],
    doctor_gynecology: ['doctor','clinical','index','followup','report','emr','acupuncture','twin','flows','aidx','emerg','rec','therapy','tele','well','call','msg','archive','hospital','safety','longitudinal','kb_evolution','wuzhen','fconsult','chronic','doctors','dskb','settings'],
    pharmacist: ['pharmacy','index','flows','emerg','rec','wuzhen','fconsult','chronic','doctors','dskb','settings'],
    patient: ['patient','payment','report','index','twin','flows','emerg','rec','therapy','tele','well','call','msg','archive','hospital','wuzhen','fconsult','chronic','doctors','dskb','settings']
  };
  var allowedPages = user ? (rolePages[user.role] || []) : ['index','login','settings'];
  if (user && user.role === 'super_admin') allowedPages = rolePages.super_admin;

  // ─── 注入导航栏 ───
  function injectNav() {
    var currentPage = getCurrentPageId();
    
    if (currentPage === 'login') return;  // 登录页不需要导航

    // 未登录跳转（家庭问诊作为访客引流口，允许未登录访问；疗效/随访分析页供家庭端查看）
    // 注意: getCurrentPageId 会把 efficacy-analysis→efficacy, health-archive→archive，白名单需同时含原名与映射名
    if (!user && !['index','report','treatment-center','home-tcm','chronic-disease','wuzhen-diagnosis','clinic-desk','family-consult','family-portal','health-archive','archive','efficacy','efficacy-analysis','longitudinal','followup','safety','safety-check','kb-evolution','kb_evolution','doctors','disease-kb','dskb','patient','patient-portal','hospital'].includes(currentPage)) {
      if (currentPage !== 'login') { window.location.href = 'login.html'; return; }
    }

    var navHTML = '<nav id="tcm-nav" style="background:linear-gradient(135deg,#1a1008,#4a2810);color:#fff;padding:6px 12px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px;font-size:12px;position:sticky;top:0;z-index:100">';
    navHTML += '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">';
    navHTML += '<a href="index.html" style="color:#fff;text-decoration:none;font-weight:700;font-size:14px;letter-spacing:2px">🏥 TCM-Agent</a>';

    // 导航链接
    var navPages = [
      { id: 'index', href: 'index.html' },
      { id: 'tc', href: 'treatment-center.html', icon: '🤖', name: 'AI诊疗中心' },
      { id: 'wuzhen', href: 'wuzhen-diagnosis.html', icon: '🎥', name: '五诊联动' },
      { id: 'flows', href: 'flows.html' },
      { id: 'patient', href: 'patient-portal.html' },
      { id: 'doctor', href: 'doctor-dashboard.html' },
      { id: 'efficacy', href: 'efficacy-analysis.html' },
      { id: 'longitudinal', href: 'longitudinal.html', icon: '🧬', name: '长程画像' },
      { id: 'kb_evolution', href: 'kb-evolution.html', icon: '🧠', name: 'KB进化仪表盘' },
      { id: 'home', href: 'home-tcm.html', icon: '🏠', name: '居家助手' },
      { id: 'family', href: 'family-portal.html', icon: '👨‍👩‍👧', name: '家庭成员' },
      { id: 'fconsult', href: 'family-consult.html', icon: '🩺', name: '在线问诊' },
      { id: 'voice', href: 'voice-diagnosis.html', icon: '🎙️', name: '语音问诊' },
      { id: 'med', href: 'med-tracker.html', icon: '💊', name: '服药追踪' },
      { id: 'chronic', href: 'chronic-disease.html', icon: '🩺', name: '慢病管理' },
      { id: 'clinical', href: 'clinical.html' },
      { id: 'emr', href: 'emr.html' },
      { id: 'acupuncture', href: 'acupuncture.html' },
      { id: 'twin', href: 'digital-twin.html' },
      { id: 'pharmacy', href: 'pharmacy.html' },
      { id: 'payment', href: 'payment.html' },
      { id: 'admin', href: 'admin.html' },
      { id: 'dashboard', href: 'dashboard.html' },
      { id: 'schedule', href: 'schedule.html' },
      { id: 'followup', href: 'followup.html' },
      { id: 'aidx', href: 'ai-diagnosis.html' },
      { id: 'emerg', href: 'emergency.html' },
      { id: 'rec', href: 'recommend.html' },
      { id: 'therapy', href: 'therapy.html' },
      { id: 'tele', href: 'telemedicine.html' },
      { id: 'well', href: 'wellness.html' },
      { id: 'inv', href: 'inventory.html' },
      { id: 'fin', href: 'finance.html' },
      { id: 'call', href: 'call-center.html' },
      { id: 'msg', href: 'messages.html' },
      { id: 'archive', href: 'health-archive.html' },
      { id: 'hospital', href: 'hospital.html' },
      { id: 'doctors', href: 'doctors.html' },
      { id: 'dskb', href: 'disease-kb.html' },
      { id: 'safety', href: 'safety-check.html' },
      { id: 'sysmon', href: 'server-monitor.html' },
      { id: 'efficacy', href: 'efficacy-analysis.html' },
      { id: 'wearable', href: 'wearable-monitor.html' },
      { id: 'monitor', href: 'monitor.html' },
      { id: 'rbac', href: 'rbac.html' },
      { id: 'settings', href: 'privacy-settings.html', icon: '⚙️', name: '隐私·升级' }
    ];

    for (var i = 0; i < navPages.length; i++) {
      var np = navPages[i];
      if (allowedPages.indexOf(np.id) === -1) continue;
      var isActive = currentPage === np.id;
      navHTML += '<a href="' + np.href + '" style="color:' + (isActive ? '#fff' : 'rgba(255,255,255,.5)') + 
        ';text-decoration:none;padding:3px 8px;border-radius:4px;font-size:11px;' +
        (isActive ? 'background:rgba(255,255,255,.15);' : '') + '">' + (PAGES[np.id] ? PAGES[np.id].icon + ' ' : '') + (PAGES[np.id] ? PAGES[np.id].name : np.id) + '</a>';
    }

    navHTML += '</div>';
    navHTML += '<div style="display:flex;align-items:center;gap:8px;font-size:11px">';
    if (user) {
      navHTML += '<span style="opacity:.7">👨‍⚕️ ' + user.name + '</span>';
      navHTML += '<a href="login.html" onclick="localStorage.removeItem(\'tcm_user\');localStorage.removeItem(\'tcm_token\')" style="color:rgba(255,255,255,.4);text-decoration:none;font-size:10px">退出</a>';
    } else {
      navHTML += '<a href="login.html" style="color:rgba(255,255,255,.6);text-decoration:none">登录</a>';
    }
    navHTML += '</div></nav>';

    // 注入到 body 最前面
    var body = document.body;
    var tmp = document.createElement('div');
    tmp.innerHTML = navHTML;
    var navEl = tmp.firstChild;
    if (body.firstChild) {
      body.insertBefore(navEl, body.firstChild);
    } else {
      body.appendChild(navEl);
    }
  }

  function getCurrentPageId() {
    var path = window.location.pathname;
    var name = path.split('/').pop().replace('.html','');
    
    var map = {
      'doctor-dashboard': 'doctor',
      'privacy-settings': 'settings',
      'treatment-center': 'tc',
      'efficacy-analysis': 'efficacy',
      'patient-portal': 'patient',
      'digital-twin': 'twin',
      'wearable-monitor': 'wearable',
      'ai-diagnosis': 'aidx',
      'emergency': 'emerg',
      'recommend': 'rec',
      'therapy': 'therapy',
      'telemedicine': 'tele',
      'wellness': 'well',
      'inventory': 'inv',
      'finance': 'fin',
      'call-center': 'call',
      'messages': 'msg',
      'health-archive': 'archive',
      'hospital': 'hospital',
      'doctors': 'doctors',
      'disease-kb': 'dskb',
      'safety-check': 'safety',
      'server-monitor': 'sysmon',
      'efficacy-analysis': 'efficacy',
      'longitudinal': 'longitudinal',
      'kb-evolution': 'kb_evolution',
      'kb_evolution': 'kb_evolution',
      '': 'index',
      'index': 'index'
    };
    return map[name] || name;
  }

  // ─── 全局工具函数 ───
  window.TCM = window.TCM || {};
  window.TCM.user = user;
  window.TCM.toast = function(msg) {
    var t = document.createElement('div');
    t.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#6b3a1f;color:#fff;padding:10px 24px;border-radius:20px;font-size:13px;z-index:9999;animation:tcmToast .3s';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function(){ t.remove(); }, 2500);
  };

  window.TCM.esc = function(s) {
    if (!s) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  };

  window.TCM.formatDate = function(d) {
    try { return new Date(d).toLocaleDateString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}); }
    catch { return d; }
  };

  window.TCM.API_BASE = (location.hostname === '127.0.0.1' || location.hostname === 'localhost') ? 'http://127.0.0.1:8932' : '';

  // ─── 共享 localStorage 命名空间 ───
  window.TCM.store = {
    get: function(key) { try { return JSON.parse(localStorage.getItem('tcm_' + key)); } catch { return null; } },
    set: function(key, val) { localStorage.setItem('tcm_' + key, JSON.stringify(val)); },
    push: function(key, val) {
      var arr = this.get(key) || [];
      arr.unshift(val);
      if (arr.length > 500) arr = arr.slice(0, 500);
      this.set(key, arr);
      return arr;
    }
  };

  // ─── DOM Ready ───
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectNav);
  } else {
    injectNav();
  }

  // 添加全局动画
  var style = document.createElement('style');
  style.textContent = '@keyframes tcmToast{from{opacity:0;transform:translateX(-50%) translateY(20px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}';
  document.head.appendChild(style);
})();
