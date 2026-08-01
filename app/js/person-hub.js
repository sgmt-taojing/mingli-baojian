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
  // R252: 当前激活 user_id（可运行时切换）
  var _currentUid = null;

  // 本地备份
  function _lsRead(){
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch(e){ return {}; }
  }
  function _lsWrite(d){
    try { localStorage.setItem(LS_KEY, JSON.stringify(d)); } catch(e){}
  }

  async function master(userId){
    var local = _lsRead();
    var r = await fetch(API + '/api/person/master/' + (userId || 4)).catch(function(e){void 0});
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
    var r = await fetch(API + '/api/person/dashboard/' + (userId || 4)).catch(function(e){void 0});
    var j = await r.json();
    return (j.code === 200) ? j.data : null;
  }

  async function list(limit){
    var r = await fetch(API + '/api/person/list?limit=' + (limit || 50)).catch(function(e){void 0});
    var j = await r.json();
    return (j.code === 200) ? j.data.persons : [];
  }

  // R252: 事件去重表 — 同 (uid+identity+event_type) 60 秒内不重复入库
  var _evDedup = {};
  function _evKey(uid, ident, type){ return uid+'|'+(ident||'')+'|'+(type||''); }
  async function logEvent(userId, identityType, eventType, eventData, severity, summary){
    try {
      var uid = userId || _currentUid || 4;
      var key = _evKey(uid, identityType, eventType);
      var now = Date.now();
      if(_evDedup[key] && (now - _evDedup[key]) < 60000) return false;
      _evDedup[key] = now;
      // R252: 启动时若不存在该 user_id，自动创建 person_master
      if(!_currentUid) _currentUid = uid;
      var _token = (typeof window !== 'undefined' && window.csrfToken) || '';
      // 1. 确保 person_master 存在
      try {
        await fetch(API + '/api/person/master', {
          method: 'POST',
          headers: {'Content-Type': 'application/json', 'x-csrf-token': _token},
          body: JSON.stringify({user_id: uid, metadata: {source: 'auto_bind', module: identityType}})
        });
      } catch(_){}
      // 2. 写 event
      var r = await fetch(API + '/api/person/event', {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'x-csrf-token': _token},
        body: JSON.stringify({
          user_id: uid,
          identity_type: identityType,
          event_type: eventType,
          event_data: eventData || {},
          severity: severity || 'normal',
          summary: summary || ''
        })
      });
      var j = await r.json();
      return j.code === 200;
    } catch(e){ console.warn('[PersonHub] logEvent err:', e.message); return false; }
  }

  // 接入既有 SDK — 自动 bind
  function bindProfile(yuanzhuProfile){
    if (!yuanzhuProfile || !yuanzhuProfile.list) return;
    try {
      var list = yuanzhuProfile.list() || [];
      // 记录每个缘主档案的访问
      list.slice(0, 1).forEach(function(p){
        logEvent(p.id, 'yuanzhu', 'access', {name: p.name, modules: p.modules}, 'normal', '智能助手接入档案');
      });
    } catch(e){ console.warn('[PersonHub] bindProfile err:', e.message); }
  }

  // R252: 自检 — 自动适配 + 主动访问多个页面 + 写入事件
  async function autoBind(){
    try {
      // 1. 优先从后端拉真实 list（即便 localStorage 空也能拿到 user 4/11/13）
      var persons = [];
      try {
        var r = await fetch(API + '/api/person/list?limit=10');
        var j = await r.json();
        if(j.code === 200 && j.data && Array.isArray(j.data.persons)){
          persons = j.data.persons;
        }
      } catch(_){}
      // 2. 取第一个有 person_master 的人作为激活 uid
      if(persons.length){
        _currentUid = persons[0].user_id;
      } else {
        _currentUid = 4;  // 默认兜底
      }
      // 3. 写 access 事件到 person_event_log
      var _page = (typeof location !== 'undefined' && location.pathname) || '/';
      await logEvent(_currentUid, 'general', 'page_view', {
        url: _page, ua: (typeof navigator !== 'undefined' && navigator.userAgent || '').slice(0, 80)
      }, 'normal', '页面访问: ' + _page.replace('/app/','').replace('.html',''));
      // 4. 接 YuanzhuProfile SDK
      if (window.YuanzhuProfile) bindProfile(window.YuanzhuProfile);
      // 5. 如果 URL 带 ?uid= 优先用
      try {
        var _qs = new URLSearchParams(location.search);
        var _u = _qs.get('uid');
        if(_u) _currentUid = parseInt(_u, 10) || _currentUid;
      } catch(_){}
      console.warn('[PersonHub] autoBind uid=' + _currentUid + ' persons=' + persons.length);
      return _currentUid;
    } catch(e){ console.warn('[PersonHub] autoBind err:', e.message); return null; }
  }

  // 健康检查
  async function ping(){
    try {
      var r = await fetch(API + '/api/person/master/4');
      var j = await r.json();
      return j.code === 200;
    } catch(e){ return false; }
  }

  // R252: 切换当前 user_id
  function setCurrentUid(uid){ _currentUid = uid; }
  // R252: 一键记事件（带自动 severity 推断）
  function eventFor(identityType, eventType, eventData, summary){
    var sev = 'normal';
    if(eventType && eventType.indexOf('risk_') === 0) sev = 'high';
    if(eventType && eventType.indexOf('warn_') === 0) sev = 'mid';
    return logEvent(_currentUid, identityType, eventType, eventData, sev, summary);
  }
  window.PersonHub = {
    master: master,
    dashboard: dashboard,
    list: list,
    logEvent: logEvent,
    eventFor: eventFor,
    setCurrentUid: setCurrentUid,
    currentUid: function(){ return _currentUid; },
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
