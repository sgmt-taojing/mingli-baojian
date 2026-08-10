/**
 * RBAC Client — 命理宝鉴前端权限控制
 * 
 * 功能：
 *   - 从localStorage读取authToken和userRoles
 *   - JWT过期检测（解析payload.exp）
 *   - hasRole / hasPermission / getRoles
 *   - requireAuth / requireRole 路由守卫
 *   - 菜单可见性控制
 *   - logout（清除localStorage + 跳转登录页）
 *
 * 依赖：无（纯原生JS，可直接<script>引入）
 */
(function (global) {
  'use strict';

  // ═══ 常量 ═══
  const TOKEN_KEY = 'authToken';
  const ROLES_KEY = 'userRoles';
  const USER_KEY = 'mlbj_user';
  const LOGIN_PAGE = 'login.html';
  const HOME_PAGE = 'divination-hub.html';

  // 旧版会员等级 → 新版角色映射（兼容）
  const VIP_LEVEL_TO_ROLE = {
    'free': 'free',
    'monthly': 'mingdao',
    'yearly': 'advanced',
    'lifetime': 'vip'
  };

  // 角色等级权重（数字越大权限越高）
  const ROLE_WEIGHT = {
    'guest': 0,
    'anonymous': 0,
    'free': 1,
    'patient': 1,
    'mingdao': 2,
    'advanced': 3,
    'vip': 4,
    'master': 4,        // 周易大师（R314）
    'doctor': 4,        // 中医医生（R314）
    'admin_a': 8,
    'admin_b': 8,       // 业务管理员（R314）
    'super_admin': 10   // 超管（R314）
  };

  // R314：角色 × 知识输出类型权限矩阵（5 角色 × 7 输出类型 = 35 单元）
  const KB_OUTPUT_TYPES = [
    'cultural_reference',   // L1 文化参考话术
    'knowledge_summary',    // L2 知识条目摘要（典籍原文 + 多流派并列）
    'knowledge_full',       // L3 完整知识检索（含 src_id/置信度/版本）
    'divination_conclude',  // 解卦结论（所有角色禁）
    'tcm_diagnose',         // 辨证诊断（所有角色禁）
    'theory_create',        // 自主创作（所有角色禁）
    'debug_trace'           // 调试追溯（仅 L3）
  ];

  const KB_OUTPUT_MATRIX = {
    free:        { cultural_reference: 'L1', knowledge_summary: 'NONE', knowledge_full: 'NONE', divination_conclude: 'NONE', tcm_diagnose: 'NONE', theory_create: 'NONE', debug_trace: 'NONE' },
    vip:         { cultural_reference: 'L1', knowledge_summary: 'NONE', knowledge_full: 'NONE', divination_conclude: 'NONE', tcm_diagnose: 'NONE', theory_create: 'NONE', debug_trace: 'NONE' },
    anonymous:   { cultural_reference: 'L1', knowledge_summary: 'NONE', knowledge_full: 'NONE', divination_conclude: 'NONE', tcm_diagnose: 'NONE', theory_create: 'NONE', debug_trace: 'NONE' },
    master:      { cultural_reference: 'L1', knowledge_summary: 'L2',  knowledge_full: 'NONE', divination_conclude: 'NONE', tcm_diagnose: 'NONE', theory_create: 'NONE', debug_trace: 'NONE' },
    doctor:      { cultural_reference: 'L1', knowledge_summary: 'L2',  knowledge_full: 'NONE', divination_conclude: 'NONE', tcm_diagnose: 'NONE', theory_create: 'NONE', debug_trace: 'NONE' },
    admin_b:     { cultural_reference: 'L1', knowledge_summary: 'NONE', knowledge_full: 'NONE', divination_conclude: 'NONE', tcm_diagnose: 'NONE', theory_create: 'NONE', debug_trace: 'NONE' },
    super_admin: { cultural_reference: 'L1', knowledge_summary: 'L2',  knowledge_full: 'L3',  divination_conclude: 'NONE', tcm_diagnose: 'NONE', theory_create: 'NONE', debug_trace: 'L3'  }
  };

  function getEffectiveRole(roles) {
    const order = ['super_admin', 'master', 'doctor', 'admin_b', 'admin_a', 'vip', 'advanced', 'mingdao', 'free', 'patient', 'anonymous', 'guest'];
    for (let i = 0; i < order.length; i++) {
      if (roles.indexOf(order[i]) >= 0) return order[i];
    }
    return 'anonymous';
  }

  function canAccessOutputType(outputType) {
    const eff = getEffectiveRole(getRoles());
    const m = KB_OUTPUT_MATRIX[eff];
    return m && m[outputType] && m[outputType] !== 'NONE';
  }

  function canAccessKnowledge() {
    return canAccessOutputType('knowledge_summary');
  }

  function canAccessDebug() {
    return canAccessOutputType('debug_trace');
  }

  function getOutputLevel(outputType) {
    const eff = getEffectiveRole(getRoles());
    const m = KB_OUTPUT_MATRIX[eff];
    return (m && m[outputType]) || 'NONE';
  }

  // ═══ 内部工具 ═══

  /**
   * 安全解析JWT payload（不验证签名，仅前端过期检查用）
   * @param {string} token
   * @returns {object|null}
   */
  function decodeJwtPayload(token) {
    if (!token || typeof token !== 'string') return null;
    let parts = token.split('.');
    if (parts.length !== 3) return null;
    try {
      // base64url → base64
      let b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      // padding
      let pad = b64.length % 4;
      if (pad) b64 += new Array(5 - pad).join('=');
      let json = decodeURIComponent(
        atob(b64).split('').map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join('')
      );
      return JSON.parse(json);
    } catch (e) {
      return null;
    }
  }

  /**
   * 安全JSON.parse from localStorage
   */
  function safeGetJSON(key, fallback) {
    try {
      let raw = localStorage.getItem(key);
      if (!raw) return fallback || {};
      return JSON.parse(raw);
    } catch (e) {
      return fallback || {};
    }
  }

  /**
   * 显示toast（兼容toast-helper.js）
   */
  function toast(msg, type) {
    if (typeof global.showToast === 'function') {
      global.showToast(msg, type || 'info');
    } else {
      console.warn('[rbac-toast]', msg);
    }
  }

  // ═══ Token & Roles ═══

  /**
   * 获取localStorage中的token
   * @returns {string|null}
   */
  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  /**
   * 获取用户角色数组
   * 优先读取localStorage('userRoles')，兼容旧版memberInfo
   * @returns {string[]}
   */
  function getRoles() {
    // 优先读RBAC角色
    let rolesRaw = localStorage.getItem(ROLES_KEY);
    if (rolesRaw) {
      try {
        let roles = JSON.parse(rolesRaw);
        if (Array.isArray(roles) && roles.length > 0) return roles;
      } catch (e) {}
    }

    // 兼容旧版：从memberInfo推导
    let member = safeGetJSON('memberInfo', {});
    let user = safeGetJSON(USER_KEY, {});
    let fallbackRoles = ['free'];

    if (member.level && member.level !== 'free') {
      let mapped = VIP_LEVEL_TO_ROLE[member.level];
      if (mapped) fallbackRoles.push(mapped);
    }
    if (member.level === '明道') {
      if (fallbackRoles.indexOf('vip') < 0) fallbackRoles.push('vip');
    }
    if (user.isSuper) {
      if (fallbackRoles.indexOf('super_admin') < 0) fallbackRoles.push('super_admin');
    }
    if (user.vipLevel && VIP_LEVEL_TO_ROLE[user.vipLevel]) {
      let r = VIP_LEVEL_TO_ROLE[user.vipLevel];
      if (fallbackRoles.indexOf(r) < 0) fallbackRoles.push(r);
    }

    return fallbackRoles;
  }

  /**
   * 获取用户信息对象
   * @returns {object}
   */
  function getUser() {
    return safeGetJSON(USER_KEY, {});
  }

  /**
   * 检查token是否过期
   * @returns {boolean} true=有效, false=过期或不存在
   */
  function isTokenValid() {
    let token = getToken();
    if (!token) return false;
    let payload = decodeJwtPayload(token);
    if (!payload) return false;
    if (!payload.exp) return true; // 无exp字段视为不过期
    let now = Math.floor(Date.now() / 1000);
    return payload.exp > now;
  }

  /**
   * 是否已登录
   */
  function isLoggedIn() {
    return !!getToken() && isTokenValid();
  }

  // ═══ 权限检查 ═══

  /**
   * 检查是否拥有某角色
   * @param {string} role
   * @returns {boolean}
   */
  function hasRole(role) {
    let roles = getRoles();
    return roles.indexOf(role) >= 0;
  }

  /**
   * 检查是否拥有任一角色
   * @param {string[]} roleList
   * @returns {boolean}
   */
  function hasAnyRole(roleList) {
    if (!roleList || roleList.length === 0) return true;
    let roles = getRoles();
    for (var i = 0; i < roleList.length; i++) {
      if (roles.indexOf(roleList[i]) >= 0) return true;
    }
    return false;
  }

  /**
   * 检查是否拥有某权限
   * 前端权限矩阵（与后端rbac-middleware.js对齐，仅做粗粒度控制）
   * @param {string} permission
   * @returns {boolean}
   */
  function hasPermission(permission) {
    let roles = getRoles();

    // 权限→角色映射（与后端PERMISSIONS矩阵一致）
    const PERM_MAP = {
      'paipan:basic': ['guest', 'free', 'mingdao', 'advanced', 'vip'],
      'paipan:advanced': ['mingdao', 'advanced', 'vip'],
      'paipan:premium': ['advanced', 'vip'],
      'kb:public': ['guest', 'free', 'mingdao', 'advanced', 'vip'],
      'kb:registered': ['free', 'mingdao', 'advanced', 'vip'],
      'kb:member': ['mingdao', 'advanced', 'vip'],
      'kb:premium': ['advanced', 'vip'],
      'shop:buy': ['guest', 'free', 'mingdao', 'advanced', 'vip'],
      'shop:manage': ['admin_a', 'super_admin'],
      'course:view': ['free', 'mingdao', 'advanced', 'vip'],
      'course:manage': ['admin_a', 'super_admin'],
      'clinic:submit_symptom': ['patient', 'super_admin'],
      'clinic:view_assigned_case': ['master', 'doctor', 'admin_b', 'super_admin'],
      'clinic:submit_analysis': ['master', 'super_admin'],
      'clinic:submit_diagnosis': ['doctor', 'super_admin'],
      'clinic:push_report': ['doctor', 'admin_b', 'super_admin'],
      'clinic:view_own_report': ['patient', 'super_admin'],
      'clinic:collaborate': ['master', 'doctor', 'admin_b', 'super_admin'],
      'clinic:manage': ['admin_b', 'super_admin'],
      'system:admin': ['admin_a', 'admin_b', 'super_admin'],
      'system:super': ['super_admin']
    };

    let allowed = PERM_MAP[permission];
    if (!allowed) return false;

    for (var i = 0; i < allowed.length; i++) {
      if (roles.indexOf(allowed[i]) >= 0) return true;
    }
    return false;
  }

  /**
   * 获取角色权重（用于等级比较）
   * @param {string} role
   * @returns {number}
   */
  function getRoleWeight(role) {
    return ROLE_WEIGHT[role] || 0;
  }

  /**
   * 获取用户最高角色权重
   * @returns {number}
   */
  function getMaxWeight() {
    let roles = getRoles();
    let max = 0;
    for (var i = 0; i < roles.length; i++) {
      let w = getRoleWeight(roles[i]);
      if (w > max) max = w;
    }
    return max;
  }

  // ═══ 路由守卫 ═══

  /**
   * 要求登录 — 未登录则跳转登录页
   * @param {string} [redirectBack] - 登录后跳回的URL
   * @returns {boolean} 是否通过
   */
  function requireAuth(redirectBack) {
    if (isLoggedIn()) return true;

    let currentUrl = redirectBack || (global.location ? global.location.pathname.split('/').pop() : '');
    if (global.location) {
      global.location.href = LOGIN_PAGE + '?redirect=' + encodeURIComponent(currentUrl);
    }
    return false;
  }

  /**
   * 要求特定角色 — 不满足则跳转提示
   * @param {string} role
   * @returns {boolean} 是否通过
   */
  function requireRole(role) {
    if (!requireAuth()) return false;
    if (hasRole(role)) return true;

    toast('权限不足，需要更高等级', 'warn');
    return false;
  }

  /**
   * 要求任一角色 — 不满足则提示
   * @param {string[]} roleList
   * @returns {boolean}
   */
  function requireAnyRole(roleList) {
    if (!requireAuth()) return false;
    if (hasAnyRole(roleList)) return true;

    toast('权限不足，需要更高等级', 'warn');
    return false;
  }

  // ═══ 菜单可见性 ═══

  /**
   * 菜单项配置
   * key → 所需角色（空数组=所有人可见）
   */
  const MENU_VISIBILITY = {
    'home': [],
    'paipan': [],
    'paipan-advanced': ['mingdao', 'advanced', 'vip'],
    'paipan-premium': ['advanced', 'vip'],
    'knowledge': [],
    'knowledge-member': ['mingdao', 'advanced', 'vip'],
    'knowledge-premium': ['advanced', 'vip'],
    'shop': [],
    'shop-manage': ['admin_a', 'super_admin'],
    'course': ['free', 'mingdao', 'advanced', 'vip'],
    'course-manage': ['admin_a', 'super_admin'],
    'clinic-patient': ['patient', 'super_admin'],
    'clinic-master': ['master', 'doctor', 'admin_b', 'super_admin'],
    'admin': ['admin_a', 'admin_b', 'super_admin'],
    'super-admin': ['super_admin']
  };

  /**
   * 检查菜单项是否可见
   * @param {string} menuKey - MENU_VISIBILITY中的key
   * @returns {boolean}
   */
  function isMenuVisible(menuKey) {
    let required = MENU_VISIBILITY[menuKey];
    if (!required || required.length === 0) return true;
    return hasAnyRole(required);
  }

  /**
   * 根据权限批量控制DOM元素显隐
   * 扫描带有 data-rbac-menu 属性的元素
   * 用法: <div data-rbac-menu="paipan-advanced">...</div>
   */
  function applyMenuVisibility() {
    let elements = document.querySelectorAll('[data-rbac-menu]');
    for (var i = 0; i < elements.length; i++) {
      let key = elements[i].getAttribute('data-rbac-menu');
      if (isMenuVisible(key)) {
        elements[i].style.display = '';
      } else {
        elements[i].style.display = 'none';
      }
    }
  }

  // ═══ 登录/登出 ═══

  /**
   * 保存登录信息
   * @param {string} token - JWT token
   * @param {string[]} roles - 角色数组
   * @param {object} [user] - 用户信息
   */
  function saveLogin(token, roles, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(ROLES_KEY, JSON.stringify(roles || ['free']));
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  }

  /**
   * 退出登录
   * 清除localStorage + 跳转登录页
   */
  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLES_KEY);
    localStorage.removeItem(USER_KEY);
    // 同时清除旧版存储
    localStorage.removeItem('memberInfo');
    localStorage.removeItem('mlbj_data');

    toast('已退出登录', 'info');

    if (global.location) {
      setTimeout(function () {
        global.location.href = LOGIN_PAGE;
      }, 500);
    }
  }

  // ═══ API请求封装 ═══

  /**
   * 带认证的fetch封装
   * 自动附加Authorization头，token过期自动跳转登录
   * @param {string} url
   * @param {object} [options] - fetch options
   * @returns {Promise}
   */
  function authFetch(url, options) {
    options = options || {};
    let token = getToken();

    if (!token || !isTokenValid()) {
      // token无效，尝试刷新或跳转登录
      if (!token) {
        toast('请先登录', 'warn');
        setTimeout(function () {
          if (global.location) global.location.href = LOGIN_PAGE;
        }, 800);
        return Promise.reject(new Error('AUTH_TOKEN_MISSING'));
      }
      // token过期
      toast('登录已过期，请重新登录', 'warn');
      setTimeout(function () {
        logout();
      }, 800);
      return Promise.reject(new Error('AUTH_TOKEN_EXPIRED'));
    }

    options.headers = options.headers || {};
    options.headers['Authorization'] = 'Bearer ' + token;

    return fetch(url, options,{signal:AbortSignal.timeout(15000)}).then(function (res) {
      if (res.status === 401) {
        toast('登录已过期，请重新登录', 'warn');
        setTimeout(function () {
          logout();
        }, 800);
        return Promise.reject(new Error('AUTH_TOKEN_EXPIRED'));
      }
      return res;
    });
  }

  // ═══ 初始化 ═══

  /**
   * 页面加载时自动执行
   * - 应用菜单可见性
   * - 检查token过期（如果存在）
   */
  function init() {
    // 应用菜单可见性
    if (typeof document !== 'undefined') {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyMenuVisibility);
      } else {
        applyMenuVisibility();
      }
    }

    // 检查token过期
    let token = getToken();
    if (token && !isTokenValid()) {
      // 静默清除过期token
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(ROLES_KEY);
      console.info('[RBAC] Token已过期，已清除');
    }
  }

  // ═══ 导出 ═══
  global.RBAC = {
    // 常量
    TOKEN_KEY: TOKEN_KEY,
    ROLES_KEY: ROLES_KEY,
    USER_KEY: USER_KEY,
    LOGIN_PAGE: LOGIN_PAGE,
    HOME_PAGE: HOME_PAGE,
    VIP_LEVEL_TO_ROLE: VIP_LEVEL_TO_ROLE,
    ROLE_WEIGHT: ROLE_WEIGHT,
    MENU_VISIBILITY: MENU_VISIBILITY,

    // Token & Roles
    getToken: getToken,
    getRoles: getRoles,
    getUser: getUser,
    isTokenValid: isTokenValid,
    isLoggedIn: isLoggedIn,

    // 权限检查
    hasRole: hasRole,
    hasAnyRole: hasAnyRole,
    hasPermission: hasPermission,
    getRoleWeight: getRoleWeight,
    getMaxWeight: getMaxWeight,

    // R314：角色 × 知识输出权限
    KB_OUTPUT_TYPES: KB_OUTPUT_TYPES,
    KB_OUTPUT_MATRIX: KB_OUTPUT_MATRIX,
    getEffectiveRole: getEffectiveRole,
    canAccessKnowledge: canAccessKnowledge,
    canAccessDebug: canAccessDebug,
    canAccessOutputType: canAccessOutputType,
    getOutputLevel: getOutputLevel,

    // 路由守卫
    requireAuth: requireAuth,
    requireRole: requireRole,
    requireAnyRole: requireAnyRole,

    // 菜单
    isMenuVisible: isMenuVisible,
    applyMenuVisibility: applyMenuVisibility,

    // 登录/登出
    saveLogin: saveLogin,
    logout: logout,
    authFetch: authFetch,

    // 初始化
    init: init
  };

  // 自动初始化
  init();


  // 暴露函数到全局
  if (typeof window !== 'undefined') {
    window.decodeJwtPayload = decodeJwtPayload;
    window.safeGetJSON = safeGetJSON;
    window.toast = toast;
    window.getToken = getToken;
    window.getRoles = getRoles;
    window.getUser = getUser;
    window.isTokenValid = isTokenValid;
    window.isLoggedIn = isLoggedIn;
    window.hasRole = hasRole;
    window.hasAnyRole = hasAnyRole;
    window.hasPermission = hasPermission;
    window.getRoleWeight = getRoleWeight;
    window.getMaxWeight = getMaxWeight;
    window.KB_OUTPUT_TYPES = KB_OUTPUT_TYPES;
    window.KB_OUTPUT_MATRIX = KB_OUTPUT_MATRIX;
    window.canAccessKnowledge = canAccessKnowledge;
    window.canAccessDebug = canAccessDebug;
    window.canAccessOutputType = canAccessOutputType;
    window.getOutputLevel = getOutputLevel;
    window.getEffectiveRole = getEffectiveRole;
    window.requireAuth = requireAuth;
    window.requireRole = requireRole;
    window.requireAnyRole = requireAnyRole;
    window.isMenuVisible = isMenuVisible;
    window.applyMenuVisibility = applyMenuVisibility;
    window.saveLogin = saveLogin;
    window.logout = logout;
    window.authFetch = authFetch;
    window.init = init;
  }
})(typeof window !== 'undefined' ? window : this);
