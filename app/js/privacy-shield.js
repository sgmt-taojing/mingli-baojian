/**
 * privacy-shield.js — 前端个人信息保护模块
 * 
 * 1. 敏感数据加密存储（localStorage 不存明文）
 * 2. 用户知情同意管理
 * 3. 数据最小化采集
 * 4. 一键清除个人数据
 */

(function(global) {
  'use strict';

  // 敏感数据 key 白名单
  var SENSITIVE_KEYS = ['_birthDate', '_phone', '_userName', '_userGender', '_userBazi'];
  
  // 简单加密（XOR + Base64，非 AES 但比明文强）
  var SECRET = 'MLBJ-2026-Privacy';
  function encrypt(value) {
    if (!value) return '';
    var result = '';
    for (var i = 0; i < value.length; i++) {
      result += String.fromCharCode(value.charCodeAt(i) ^ SECRET.charCodeAt(i % SECRET.length));
    }
    return 'enc:' + btoa(result);
  }
  function decrypt(value) {
    if (!value || !value.startsWith('enc:')) return value;
    try {
      var decoded = atob(value.substring(4));
      var result = '';
      for (var i = 0; i < decoded.length; i++) {
        result += String.fromCharCode(decoded.charCodeAt(i) ^ SECRET.charCodeAt(i % SECRET.length));
      }
      return result;
    } catch(e) { return ''; }
  }

  // 安全存储
  function setItem(key, value) {
    if (SENSITIVE_KEYS.indexOf(key) >= 0) {
      localStorage.setItem(key, encrypt(value));
    } else {
      localStorage.setItem(key, value);
    }
  }

  function getItem(key) {
    var value = localStorage.getItem(key);
    if (SENSITIVE_KEYS.indexOf(key) >= 0 && value) {
      return decrypt(value);
    }
    return value;
  }

  // 一键清除所有个人数据
  function clearAllPersonalData() {
    var cleared = 0;
    for (var i = localStorage.length - 1; i >= 0; i--) {
      var key = localStorage.key(i);
      if (!key) continue;
      // 清除用户数据（保留 KB 命中统计等匿名数据）
      if (key.startsWith('_') || key.includes('user') || key.includes('birth') || 
          key.includes('phone') || key.includes('name') || key.includes('gender') ||
          key.includes('bazi') || key.includes('patient') || key.includes('profile')) {
        localStorage.removeItem(key);
        cleared++;
      }
    }
    return cleared;
  }

  // 获取个人数据摘要（用于"我的数据"页面展示）
  function getDataSummary() {
    var items = [];
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      if (!key) continue;
      var value = localStorage.getItem(key);
      var isSensitive = SENSITIVE_KEYS.indexOf(key) >= 0;
      var displayValue = isSensitive ? decrypt(value) : value;
      // 脱敏展示
      if (isSensitive && displayValue) {
        displayValue = displayValue.substring(0, 2) + '****' + displayValue.slice(-2);
      }
      items.push({ key: key, value: displayValue, sensitive: isSensitive });
    }
    return items;
  }

  // 同意管理
  function checkConsent() {
    return localStorage.getItem('_consent_v1') === 'accepted';
  }
  function acceptConsent() {
    localStorage.setItem('_consent_v1', 'accepted');
    localStorage.setItem('_consent_date', new Date().toISOString());
  }
  function revokeConsent() {
    clearAllPersonalData();
    localStorage.removeItem('_consent_v1');
    localStorage.removeItem('_consent_date');
  }

  global.PrivacyShield = {
    setItem: setItem,
    getItem: getItem,
    clearAllPersonalData: clearAllPersonalData,
    getDataSummary: getDataSummary,
    checkConsent: checkConsent,
    acceptConsent: acceptConsent,
    revokeConsent: revokeConsent,
    SENSITIVE_KEYS: SENSITIVE_KEYS
  };

})(typeof window !== 'undefined' ? window : this);
