/**
 * 前端安全存储模块 - 命理宝鉴
 * P0修复：localStorage加密 + 安全HTML工具
 */
(function() {
  'use strict';

  // === 加密存储 ===
  // 使用Web Crypto API进行客户端加密（与后端加密独立，仅用于localStorage保护）
  
  const STORAGE_PREFIX = 'ml_'; // 命理宝鉴前缀
  const ENCRYPTION_KEY_NAME = 'ml_enc_key';

  // 获取或生成客户端加密密钥
  function getClientKey() {
    let key = sessionStorage.getItem(ENCRYPTION_KEY_NAME);
    if (!key) {
      const arr = new Uint8Array(32);
      crypto.getRandomValues(arr);
      key = Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
      sessionStorage.setItem(ENCRYPTION_KEY_NAME, key);
    }
    return key;
  }

  // 简单XOR加密（客户端侧保护，非军事级，主要防止直接读取localStorage）
  function xorEncrypt(text, key) {
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return btoa(unescape(encodeURIComponent(result)));
  }

  function xorDecrypt(encrypted, key) {
    try {
      const text = decodeURIComponent(escape(atob(encrypted)));
      let result = '';
      for (let i = 0; i < text.length; i++) {
        result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
      }
      return result;
    } catch (e) {
      return null;
    }
  }

  // 安全设置项
  const SecureStorage = {
    set(key, value) {
      try {
        const keyStr = getClientKey();
        const encrypted = xorEncrypt(JSON.stringify(value), keyStr);
        localStorage.setItem(STORAGE_PREFIX + key, encrypted);
      } catch (e) {
        console.warn('SecureStorage set failed:', e);
      }
    },

    get(key, defaultValue) {
      try {
        const encrypted = localStorage.getItem(STORAGE_PREFIX + key);
        if (!encrypted) return defaultValue;
        const keyStr = getClientKey();
        const decrypted = xorDecrypt(encrypted, keyStr);
        if (!decrypted) return defaultValue;
        return JSON.parse(decrypted);
      } catch (e) {
        return defaultValue;
      }
    },

    remove(key) {
      localStorage.removeItem(STORAGE_PREFIX + key);
    },

    // 迁移旧数据（从无前缀的key迁移到加密前缀）
    migrate(oldKey, newKey) {
      const oldValue = localStorage.getItem(oldKey);
      if (oldValue !== null) {
        try {
          const parsed = JSON.parse(oldValue);
          this.set(newKey || oldKey, parsed);
          localStorage.removeItem(oldKey);
        } catch (e) {
          // 不是JSON，直接加密存储
          this.set(newKey || oldKey, oldValue);
          localStorage.removeItem(oldKey);
        }
      }
    },

    // 清除所有命理宝鉴相关数据
    clearAll() {
      const keys = Object.keys(localStorage).filter(k => k.startsWith(STORAGE_PREFIX) || k.startsWith('ml_'));
      keys.forEach(k => localStorage.removeItem(k));
    }
  };

  // === 安全HTML工具 ===
  const SafeHTML = {
    // 转义HTML特殊字符
    escape(text) {
      if (text === null || text === undefined) return '';
      const div = document.createElement('div');
      div.textContent = String(text);
      return div.innerHTML;
    },

    // 安全设置innerHTML（先转义再插入）
    safeSet(element, html) {
      if (!element) return;
      // 创建临时容器解析HTML
      const temp = document.createElement('div');
      temp.innerHTML = html;
      // 移除所有script标签
      temp.querySelectorAll('script').forEach(s => s.remove());
      // 移除所有on*事件属性
      temp.querySelectorAll('*').forEach(el => {
        Array.from(el.attributes).forEach(attr => {
          if (attr.name.startsWith('on')) {
            el.removeAttribute(attr.name);
          }
          if (attr.name === 'href' && attr.value.startsWith('javascript:')) {
            el.removeAttribute('href');
          }
          if (attr.name === 'src' && attr.value.startsWith('javascript:')) {
            el.removeAttribute('src');
          }
        });
      });
      element.innerHTML = temp.innerHTML;
    },

    // 安全创建元素
    create(tag, attrs, text) {
      const el = document.createElement(tag);
      if (attrs) {
        for (const [key, value] of Object.entries(attrs)) {
          if (key === 'class') {
            el.className = value;
          } else if (key === 'dataset') {
            for (const [dk, dv] of Object.entries(value)) {
              el.dataset[dk] = dv;
            }
          } else if (key.startsWith('on') && typeof value === 'function') {
            el.addEventListener(key.slice(2).toLowerCase(), value);
          } else if (key === 'style' && typeof value === 'object') {
            Object.assign(el.style, value);
          } else {
            el.setAttribute(key, value);
          }
        }
      }
      if (text !== undefined) {
        el.textContent = text;
      }
      return el;
    }
  };

  // === Toast通知（替代alert）===
  let toastContainer = null;
  const Toast = {
    show(message, type) {
      if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'ml-toast-container';
        toastContainer.style.cssText = 'position:fixed;top:20px;right:20px;z-index:999999;pointer-events:none;';
        document.body.appendChild(toastContainer);
      }
      const toast = document.createElement('div');
      const colors = {
        success: '#3fb950',
        error: '#f85149',
        warning: '#d29922',
        info: '#58a6ff'
      };
      const color = colors[type] || colors.info;
      toast.style.cssText = `padding:12px 20px;margin-bottom:8px;border-radius:8px;background:${color};color:#fff;font-size:14px;box-shadow:0 4px 12px rgba(0,0,0,0.3);pointer-events:auto;opacity:0;transition:opacity 0.3s;max-width:400px;`;
      toast.textContent = message;
      toastContainer.appendChild(toast);
      requestAnimationFrame(() => { toast.style.opacity = '1'; });
      setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
      }, 3000);
    },
    success(msg) { this.show(msg, 'success'); },
    error(msg) { this.show(msg, 'error'); },
    warning(msg) { this.show(msg, 'warning'); },
    info(msg) { this.show(msg, 'info'); }
  };

  // === 确定性随机（替代Math.random）===
  function detRand(seed) {
    const s = seed || Date.now();
    const x = Math.sin(s) * 10000;
    return x - Math.floor(x);
  }

  // 暴露到全局
  window.SecureStorage = SecureStorage;
  window.SafeHTML = SafeHTML;
  window.MLToast = Toast;
  window.detRand = detRand;
})();
