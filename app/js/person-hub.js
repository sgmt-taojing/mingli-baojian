/**
 * R251 PersonHub — 统一人物档案中心 SDK
 *
 * 把分散的 YuanzhuProfile + wellness_profile + person_identity 5 身份档案
 * 接入统一的"人"视角：1 个人 ↔ N 身份 ↔ M 事件
 *
 * 提供：
 *   - window.PersonHub.master(userId)         获取/初始化主档
 *   - window.PersonHub.dashboard(userId)      看板核心数据
 *   - window.PersonHub.logEvent(...)          记录事件
 *   - window.PersonHub.list()                 全员列表
 *   - window.PersonHub.bindProfile(YuanzhuProfile)  接入既有 SDK
 *   - window.PersonHub.bindWellness(profile)         接入康养人
 *   - window.PersonHub.bindIdentity(identities)      接入身份表
 */
(function(){
  var API = (typeof location !== 'undefined' && (location.hostname === '127.0.0.1' || location.hostname === 'localhost'))
    ? 'http://127.0.0.1:8920' : '';
  var LS_KEY = 'mlbj_person_hub_v1';
  var _cache = null;

  // 本地备份
  function _lsRead(){
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch(e){ return {}; }
  }
  function _lsWrite(d){
    try { localStorage.setItem(LS_KEY, JSON.stringify(d)); } catch(e){}
  }

  async function master(userId){
    var local = _lsRead();
    var r = await fetch(API + '/api/person/master/' + (userId || 4));
    var j = await r.json();
    if (j.code === 200) {
      _cache = j.data;
      local[String(userId || 4)] = j.data;
      _lsWrite(local);
      return j.data;
    }
    return local[String(userId || 4)] || null;
  }

  async function dashboard(userId){
    var r = await fetch(API + '/api/person/dashboard/' + (userId || 4));
    var j = await r.json();
    return (j.code === 200) ? j.data : null;
  }

  async function list(limit){
    var r = await fetch(API + '/api/person/list?limit=' + (limit || 50));
    var j = await r.json();
    return (j.code === 200) ? j.data.persons : [];
  }

  async function logEvent(userId, identityType, eventType, eventData, severity, summary){
    try {
      var _token = (typeof window !== 'undefined' && window.csrfToken) || '';
      await fetch(API + '/api/person/event', {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'x-csrf-token': _token},
        body: JSON.stringify({
          user_id: userId || 4,
          identity_type: identityType,
          event_type: eventType,
          event_data: eventData || {},
          severity: severity || 'normal',
          summary: summary || ''
        })
      });
      return true;
    } catch(e){ console.warn('[PersonHub] logEvent err:', e.message); return false; }
  }

  // 接入既有 SDK — 自动 bind
  function bindProfile(yuanzhuProfile){
    if (!yuanzhuProfile || !yuanzhuProfile.list) return;
    try {
      var list = yuanzhuProfile.list() || [];
      // 记录每个缘主档案的访问
      list.slice(0, 1).forEach(function(p){
        logEvent(p.id, 'yuanzhu', 'access', {name: p.name, modules: p.modules}, 'normal', 'AI助手接入档案');
      });
    } catch(e){ console.warn('[PersonHub] bindProfile err:', e.message); }
  }

  // 自检：自动适配
  function autoBind(){
    try {
      if (window.YuanzhuProfile) bindProfile(window.YuanzhuProfile);
    } catch(e){}
  }

  // 健康检查
  async function ping(){
    try {
      var r = await fetch(API + '/api/person/master/4');
      var j = await r.json();
      return j.code === 200;
    } catch(e){ return false; }
  }

  window.PersonHub = {
    master: master,
    dashboard: dashboard,
    list: list,
    logEvent: logEvent,
    bindProfile: bindProfile,
    bindWellness: function(profile){
      if (profile) {
        logEvent(profile.user_id, 'wellness', 'access', {name: profile.name, risk: profile.risk_level}, profile.risk_level === 'high' ? 'high' : 'normal', '康养人档案访问');
      }
    },
    bindIdentity: function(identities){
      if (Array.isArray(identities)) {
        identities.forEach(function(id){
          logEvent(id.user_id, id.identity_type, 'access', null, 'normal', id.identity_type + '身份激活');
        });
      }
    },
    autoBind: autoBind,
    ping: ping
  };

  // 自启绑定
  if (document.readyState === 'complete') autoBind();
  else window.addEventListener('load', autoBind);
})();
