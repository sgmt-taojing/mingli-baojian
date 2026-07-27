/**
 * R89-K · 缘主档案同步（Yuanzhu Profile Sync）
 *
 * 功能：
 * 1. 每次排盘/报告时自动捕获缘主信息（姓名/生辰/性别/模块）
 * 2. 写入 localStorage「_yuanzhu_profiles」统一管理
 * 3. 生成「最近缘主」快捷列表（最多 20 人）
 * 4. 点击缘主可一键回溯历史报告
 *
 * 纯前端，零 API，数据不离开浏览器
 */

(function () {
  'use strict';

  var MAX_PROFILES = 20;
  var STORAGE_KEY = '_yuanzhu_profiles';
  var CURRENT_KEY = '_yuanzhu_current';

  /**
   * 记录/更新一位缘主
   * @param {Object} info - { name, gender, birth, calendar, time, location, module }
   */
  function recordProfile(info) {
    if (!info || !info.name) return null;
    try {
      var profiles = loadProfiles();
      var id = info.name + '|' + (info.birth || '') + '|' + (info.gender || '');
      // 查找已有
      var existing = profiles.find(function (p) { return p.id === id; });
      if (existing) {
        // 更新最后Seen + 合并字段
        existing.lastSeen = Date.now();
        existing.visits = (existing.visits || 0) + 1;
        if (info.module) {
          existing.modules = existing.modules || [];
          if (existing.modules.indexOf(info.module) < 0) existing.modules.push(info.module);
        }
        if (info.location) existing.location = info.location;
        if (info.consultation) existing.lastConsultation = info.consultation;
      } else {
        existing = {
          id: id,
          name: info.name,
          gender: info.gender || '未知',
          birth: info.birth || '',
          calendar: info.calendar || 'solar',
          time: info.time || '',
          location: info.location || '',
          modules: info.module ? [info.module] : [],
          lastConsultation: info.consultation || '',
          visits: 1,
          createdAt: Date.now(),
          lastSeen: Date.now()
        };
        profiles.unshift(existing);
        if (profiles.length > MAX_PROFILES) profiles = profiles.slice(0, MAX_PROFILES);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
      localStorage.setItem(CURRENT_KEY, existing.id);
      return existing;
    } catch (e) {
      console.warn('[profile] save error:', e);
      return null;
    }
  }

  function loadProfiles() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      var arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function getCurrentProfile() {
    try {
      var id = localStorage.getItem(CURRENT_KEY);
      if (!id) return null;
      return loadProfiles().find(function (p) { return p.id === id; }) || null;
    } catch (e) {
      return null;
    }
  }

  function deleteProfile(id) {
    try {
      var profiles = loadProfiles().filter(function (p) { return p.id !== id; });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
      return true;
    } catch (e) {
      return false;
    }
  }

  function clearAll() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(CURRENT_KEY);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * 从当前 AI 助手 state 抽取缘主信息
   */
  function captureFromState(state) {
    if (!state) return null;
    return recordProfile({
      name: state.name || state.userName || '匿名缘主',
      gender: state.gender || '',
      birth: state.birthday || state.birth || (state.year ? (state.year + '-' + (state.month || '') + '-' + (state.day || '')) : ''),
      calendar: state.calendar || 'solar',
      time: state.birthtime || state.time || '',
      location: state.location || state.birthplace || '',
      module: state.module || '',
      consultation: state.question || state.query || ''
    });
  }

  /**
   * 渲染「最近缘主」面板（注入到 AI 助手侧栏或顶部）
   * @returns {HTMLElement}
   */
  function renderProfileList() {
    var profiles = loadProfiles();
    var container = document.createElement('div');
    container.className = 'yuanzhu-profile-list';
    container.style.cssText = 'padding:12px;background:rgba(201,168,76,.04);border:1px solid rgba(201,168,76,.2);border-radius:10px;margin:8px 0;font-size:13px';

    var header = document.createElement('div');
    header.style.cssText = 'display:flex;align-items:center;gap:6px;margin-bottom:8px;color:#c9a84c;font-weight:600';
    header.innerHTML = '<span style="font-size:15px">👥</span><span>最近缘主</span><span style="margin-left:auto;font-size:11px;opacity:.6">' + profiles.length + '/' + MAX_PROFILES + '</span>';
    container.appendChild(header);

    if (profiles.length === 0) {
      var empty = document.createElement('div');
      empty.style.cssText = 'padding:12px;text-align:center;color:var(--paper3);font-style:italic';
      empty.textContent = '尚无缘主记录（排盘后自动添加）';
      container.appendChild(empty);
      return container;
    }

    profiles.slice(0, 8).forEach(function (p) {
      var item = document.createElement('div');
      item.className = 'yuanzhu-profile-item';
      item.style.cssText = 'display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:6px;cursor:pointer;transition:background .2s';
      item.addEventListener('mouseenter', function () { item.style.background = 'rgba(201,168,76,.08)'; });
      item.addEventListener('mouseleave', function () { item.style.background = ''; });

      var avatar = document.createElement('span');
      avatar.style.cssText = 'font-size:18px;width:28px;height:28px;display:inline-flex;align-items:center;justify-content:center;background:rgba(201,168,76,.12);border-radius:50%';
      avatar.textContent = p.gender === '男' ? '♂' : (p.gender === '女' ? '♀' : '⚪');

      var info = document.createElement('div');
      info.style.cssText = 'flex:1;min-width:0';
      var name = document.createElement('div');
      name.style.cssText = 'font-weight:600;color:var(--paper);overflow:hidden;text-overflow:ellipsis;white-space:nowrap';
      name.textContent = p.name;
      var sub = document.createElement('div');
      sub.style.cssText = 'font-size:11px;color:var(--paper3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap';
      var parts = [];
      if (p.birth) parts.push(p.birth);
      if (p.modules && p.modules.length) parts.push(p.modules.join('/'));
      if (p.visits > 1) parts.push('×' + p.visits);
      sub.textContent = parts.join(' · ');

      info.appendChild(name);
      info.appendChild(sub);
      item.appendChild(avatar);
      item.appendChild(info);
      container.appendChild(item);
    });

    return container;
  }

  /**
   * 通过 id 查找单条档案（R145: 补全 getProfile/loadProfile 别名）
   */
  function getProfileById(id) {
    if (!id) return null;
    return loadProfiles().find(function (p) { return p.id === id; }) || null;
  }

  /**
   * 加载指定档案为当前缘主（R145: 补全 loadProfile）
   * 同时返回该档案的 data 快照（用于回填 AI 助手 state）
   */
  function loadProfileById(id) {
    var p = getProfileById(id);
    if (!p) return false;
    try {
      localStorage.setItem(CURRENT_KEY, p.id);
      // 构造 data 快照（兼容 ai-assistant-inline.js openProfilePanel 期望）
      p.data = {
        s1: p.name || '',
        s2: p.birth || '',
        s3: p.calendar || 'solar',
        s4: p.time || '',
        s5: p.lastConsultation || ''
      };
      return true;
    } catch (e) {
      return false;
    }
  }

  // 导出到 window
  window.YuanzhuProfile = {
    record: recordProfile,
    load: loadProfiles,
    list: loadProfiles,          // R145: 别名（ai-assistant-inline.js 用 .list()）
    current: getCurrentProfile,
    delete: deleteProfile,
    deleteProfile: deleteProfile, // R145: 别名
    clear: clearAll,
    clearAll: clearAll,           // R145: 别名
    captureFromState: captureFromState,
    renderList: renderProfileList,
    getProfile: getProfileById,   // R145: 新增
    loadProfile: loadProfileById  // R145: 新增
  };
})();