/**
 * ════════════════════════════════════════════════════════════
 *  命理宝鉴 · 通用数据同步客户端
 *  sync-client.js
 *
 *  功能：
 *    - 在 H5 端和小程序端之间同步用户数据
 *    - 通过后端 API 进行 push/pull 操作
 *    - 支持自动定时同步
 *
 *  用法：
 *    H5 (script 标签引入):
 *      <script src="server/sync-client.js"></script>
 *      SyncClient.init();
 *      SyncClient.autoSync();
 *
 *    小程序 (require):
 *      const SyncClient = require('../../server/sync-client.js');
 *      SyncClient.init();
 *      SyncClient.autoSync();
 *
 *  依赖：无（纯 JS，兼容浏览器和微信小程序）
 * ════════════════════════════════════════════════════════════
 */

(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) {
    // CommonJS (微信小程序 / Node)
    module.exports = factory();
  } else if (typeof define === 'function' && define.amd) {
    // AMD
    define([], factory);
  } else {
    // 浏览器全局
    root.SyncClient = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ──────────────────────────────────────
  //  环境检测
  // ──────────────────────────────────────
  let isWx = (typeof wx !== 'undefined') && (typeof wx.getStorageSync === 'function');
  let isBrowser = (typeof window !== 'undefined') && (typeof localStorage !== 'undefined');

  // ──────────────────────────────────────
  //  Storage 适配层
  // ──────────────────────────────────────
  let storage = {
    /**
     * 读取本地存储
     * @param {string} key
     * @returns {string|null}
     */
    get: function (key) {
      try {
        if (isWx) {
          let val = wx.getStorageSync(key);
          if (val === '' || val === undefined || val === null) return null;
          return typeof val === 'string' ? val : JSON.stringify(val);
        }
        if (isBrowser) {
          return localStorage.getItem(key);
        }
        return null;
      } catch (e) {
        console.warn('[SyncClient] storage.get failed:', key, e);
        return null;
      }
    },

    /**
     * 写入本地存储
     * @param {string} key
     * @param {string} value
     */
    set: function (key, value) {
      try {
        if (isWx) {
          // 小程序可以存对象，但为统一行为统一存字符串
          wx.setStorageSync(key, value);
        } else if (isBrowser) {
          localStorage.setItem(key, value);
        }
      } catch (e) {
        console.warn('[SyncClient] storage.set failed:', key, e);
      }
    },

    /**
     * 移除本地存储项
     * @param {string} key
     */
    remove: function (key) {
      try {
        if (isWx) {
          wx.removeStorageSync(key);
        } else if (isBrowser) {
          localStorage.removeItem(key);
        }
      } catch (e) {
        console.warn('[SyncClient] storage.remove failed:', key, e);
      }
    },

    /**
     * 读取并解析 JSON
     * @param {string} key
     * @param {*} fallback
     * @returns {*}
     */
    getJSON: function (key, fallback) {
      let raw = this.get(key);
      if (raw === null || raw === undefined) return fallback;
      try {
        return JSON.parse(raw);
      } catch (e) {
        return fallback;
      }
    },

    /**
     * 序列化并写入 JSON
     * @param {string} key
     * @param {*} value
     */
    setJSON: function (key, value) {
      try {
        this.set(key, JSON.stringify(value));
      } catch (e) {
        console.warn('[SyncClient] storage.setJSON failed:', key, e);
      }
    }
  };

  // ──────────────────────────────────────
  //  网络请求适配层
  // ──────────────────────────────────────

  /**
   * 发起网络请求（统一接口）
   * @param {Object} options - { method, url, header, data }
   * @returns {Promise<Object>} - 解析后的响应 JSON
   */
  function request(options) {
    let method = (options.method || 'GET').toUpperCase();
    let url = options.url;
    let header = options.header || {};
    let data = options.data || null;

    return new Promise(function (resolve, reject) {
      if (isWx) {
        // 微信小程序 wx.request
        wx.request({
          url: url,
          method: method,
          header: header,
          data: data,
          timeout: 15000,
          success: function (res) {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(res.data);
            } else {
              let err = new Error('HTTP ' + res.statusCode);
              err.statusCode = res.statusCode;
              err.response = res.data;
              reject(err);
            }
          },
          fail: function (err) {
            reject(new Error(err.errMsg || 'wx.request failed'));
          }
        });
      } else if (isBrowser && typeof fetch === 'function') {
        // 浏览器 fetch
        let fetchOptions = {
          method: method,
          headers: header
        };
        if (data && method !== 'GET') {
          fetchOptions.headers = Object.assign(
            { 'Content-Type': 'application/json' },
            header
          );
          fetchOptions.body = JSON.stringify(data);
        }
        fetch(url, fetchOptions)
          .then(function (res) {
            if (res.ok) {
              return res.json();
            }
            throw new Error('HTTP ' + res.status);
          })
          .then(function (json) {
            resolve(json);
          })
          .catch(function (err) {
            reject(err);
          });
      } else if (isBrowser) {
        // 降级到 XMLHttpRequest（老浏览器）
        let xhr = new XMLHttpRequest();
        xhr.open(method, url, true);
        for (var k in header) {
          if (header.hasOwnProperty(k)) {
            xhr.setRequestHeader(k, header[k]);
          }
        }
        if (data && method !== 'GET') {
          xhr.setRequestHeader('Content-Type', 'application/json');
        }
        xhr.timeout = 15000;
        xhr.onreadystatechange = function () {
          if (xhr.readyState === 4) {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                resolve(JSON.parse(xhr.responseText));
              } catch (e) {
                reject(new Error('Invalid JSON response'));
              }
            } else {
              reject(new Error('HTTP ' + xhr.status));
            }
          }
        };
        xhr.ontimeout = function () {
          reject(new Error('Request timeout'));
        };
        xhr.onerror = function () {
          reject(new Error('Network error'));
        };
        xhr.send(data && method !== 'GET' ? JSON.stringify(data) : null);
      } else {
        reject(new Error('No HTTP client available'));
      }
    });
  }

  // ──────────────────────────────────────
  //  需要同步的数据项定义
  // ──────────────────────────────────────
  const SYNC_KEYS = [
    'userBazi',      // 八字排盘数据
    'userFaith',     // 信仰选择
    'memberInfo',    // 会员信息
    'paipanHistory', // 排盘历史
    'favorites',     // 收藏列表
    'preferences'    // 用户偏好
  ];

  const LAST_SYNC_KEY = 'lastSyncTime';

  // ──────────────────────────────────────
  //  SyncClient 主对象
  // ──────────────────────────────────────
  let SyncClient = {
    // ── 配置 ──
    apiBase: 'http://127.0.0.1:8920',
    token: null,
    _timerId: null,
    _retryCount: 0,
    _maxRetries: 3,
    _retryDelay: 5000, // 5秒后重试

    // ── 初始化 ──
    /**
     * 初始化同步客户端
     * 从本地存储读取 token，设置 API 地址
     * @param {Object} [opts] - 可选配置 { apiBase, token }
     */
    init: function (opts) {
      opts = opts || {};
      if (opts.apiBase) this.apiBase = opts.apiBase;
      if (opts.token) {
        this.token = opts.token;
      } else {
        // 尝试从本地存储读取 token（兼容多种 key）
        this.token =
          storage.get('authToken') ||
          storage.get('token') ||
          storage.get('userToken') ||
          null;
      }
      console.log('[SyncClient] 初始化完成, apiBase=' + this.apiBase +
        ', token=' + (this.token ? '已设置' : '未设置') +
        ', 环境=' + (isWx ? '小程序' : '浏览器'));
      return this;
    },

    /**
     * 设置/更新 token（登录后调用）
     * @param {string} token
     */
    setToken: function (token) {
      this.token = token;
      if (token) {
        storage.set('authToken', token);
      }
    },

    // ── 获取认证请求头 ──
    _authHeader: function () {
      let header = {};
      if (this.token) {
        header['Authorization'] = 'Bearer ' + this.token;
      }
      return header;
    },

    // ── 收集本地数据 ──
    /**
     * 收集本地需要同步的数据
     * @returns {Object} 包含所有同步项的对象
     */
    _collectLocalData: function () {
      let data = {};
      for (var i = 0; i < SYNC_KEYS.length; i++) {
        let key = SYNC_KEYS[i];
        let raw = storage.get(key);
        if (raw !== null && raw !== undefined && raw !== '') {
          // 尝试解析 JSON，如果不是 JSON 就保持原值
          try {
            data[key] = JSON.parse(raw);
          } catch (e) {
            data[key] = raw;
          }
        }
      }
      data._deviceTime = Date.now();
      return data;
    },

    /**
     * 将服务端数据写回本地存储
     * @param {Object} serverData
     */
    _applyRemoteData: function (serverData) {
      if (!serverData || typeof serverData !== 'object') return;
      for (var i = 0; i < SYNC_KEYS.length; i++) {
        let key = SYNC_KEYS[i];
        if (serverData.hasOwnProperty(key) && serverData[key] !== undefined && serverData[key] !== null) {
          // 对象类型用 JSON 存储，字符串类型直接存
          if (typeof serverData[key] === 'object') {
            storage.setJSON(key, serverData[key]);
          } else {
            storage.set(key, String(serverData[key]));
          }
        }
      }
    },

    // ──────────────────────────────────────
    //  核心同步方法
    // ──────────────────────────────────────

    /**
     * 上传本地数据到服务端
     * POST /api/sync/push
     * @returns {Promise<Object>} 服务端响应
     */
    push: function () {
      if (!this.token) {
        console.warn('[SyncClient] push 跳过: 无 token');
        return Promise.resolve({ skipped: true, reason: 'no-token' });
      }

      let localData = this._collectLocalData();
      let self = this;

      console.log('[SyncClient] 开始上传数据, keys=' + Object.keys(localData).join(','));

      return request({
        method: 'POST',
        url: this.apiBase + '/api/sync/push',
        header: this._authHeader(),
        data: { data: localData }
      }).then(function (res) {
        console.log('[SyncClient] push 成功:', res);
        // 记录同步时间
        storage.set(LAST_SYNC_KEY, String(Date.now()));
        self._retryCount = 0;
        return res;
      }).catch(function (err) {
        console.error('[SyncClient] push 失败:', err.message);
        throw err;
      });
    },

    /**
     * 拉取服务端数据到本地
     * GET /api/sync/pull
     * @returns {Promise<Object>} 服务端数据
     */
    pull: function () {
      if (!this.token) {
        console.warn('[SyncClient] pull 跳过: 无 token');
        return Promise.resolve({ skipped: true, reason: 'no-token' });
      }

      let self = this;

      console.log('[SyncClient] 开始拉取数据');

      return request({
        method: 'GET',
        url: this.apiBase + '/api/sync/pull',
        header: this._authHeader()
      }).then(function (res) {
        console.log('[SyncClient] pull 成功');
        if (res && res.data) {
          self._applyRemoteData(res.data);
        } else if (res && typeof res === 'object') {
          // 兼容直接返回数据对象的格式
          self._applyRemoteData(res);
        }
        // 记录同步时间
        storage.set(LAST_SYNC_KEY, String(Date.now()));
        self._retryCount = 0;
        return res;
      }).catch(function (err) {
        console.error('[SyncClient] pull 失败:', err.message);
        throw err;
      });
    },

    /**
     * 检查是否需要同步
     * GET /api/sync/status
     * @returns {Promise<string>} 'push' | 'pull' | 'in-sync' | 'conflict' | 'no-token'
     */
    checkSync: function () {
      if (!this.token) {
        return Promise.resolve('no-token');
      }

      let localLastSync = parseInt(storage.get(LAST_SYNC_KEY) || '0', 10);
      let localData = this._collectLocalData();
      // 本地数据的最新时间戳
      let localTimestamp = localData._deviceTime || 0;
      // 尝试从各项数据中找最新修改时间
      for (var i = 0; i < SYNC_KEYS.length; i++) {
        let key = SYNC_KEYS[i];
        let parsed = storage.getJSON(key, null);
        if (parsed && typeof parsed === 'object' && parsed.timestamp) {
          if (parsed.timestamp > localTimestamp) {
            localTimestamp = parsed.timestamp;
          }
        }
      }

      let self = this;

      return request({
        method: 'GET',
        url: this.apiBase + '/api/sync/status',
        header: this._authHeader()
      }).then(function (res) {
        if (!res) return 'in-sync';

        let serverTimestamp = res.serverTimestamp || res.serverTime || 0;
        let serverLastSync = res.lastSyncTime || 0;

        // 如果服务端没有数据，需要 push
        if (!serverLastSync && !serverTimestamp) {
          return 'push';
        }

        // 如果本地没有同步过，需要 pull
        if (!localLastSync) {
          return 'pull';
        }

        // 对比时间戳
        if (localTimestamp > serverLastSync && serverTimestamp > localLastSync) {
          // 两端都有更新 → 冲突
          return 'conflict';
        }

        if (localTimestamp > serverLastSync) {
          // 本地更新 → push
          return 'push';
        }

        if (serverTimestamp > localLastSync) {
          // 服务端更新 → pull
          return 'pull';
        }

        return 'in-sync';
      }).catch(function (err) {
        console.error('[SyncClient] checkSync 失败:', err.message);
        // 检查失败时不阻断流程，返回 in-sync 跳过本次
        return 'in-sync';
      });
    },

    /**
     * 自动同步（登录后调用）
     * 1. checkSync → 2. push/pull → 3. 保存同步时间
     * @returns {Promise<string>} 同步结果描述
     */
    autoSync: function () {
      if (!this.token) {
        console.log('[SyncClient] autoSync 跳过: 无 token');
        return Promise.resolve('skipped:no-token');
      }

      let self = this;

      return this.checkSync().then(function (status) {
        console.log('[SyncClient] 同步状态:', status);

        switch (status) {
          case 'push':
            return self.push().then(function () {
              return 'pushed';
            }).catch(function (err) {
              self._handleRetry('push');
              return 'push-failed:' + err.message;
            });

          case 'pull':
            return self.pull().then(function () {
              return 'pulled';
            }).catch(function (err) {
              self._handleRetry('pull');
              return 'pull-failed:' + err.message;
            });

          case 'conflict':
            // 冲突策略：以本地为准 push（可扩展为合并策略）
            console.warn('[SyncClient] 检测到冲突，以本地数据为准上传');
            return self.push().then(function () {
              return 'conflict-resolved:push';
            }).catch(function (err) {
              self._handleRetry('push');
              return 'conflict-failed:' + err.message;
            });

          case 'in-sync':
            return 'in-sync';

          default:
            return 'unknown:' + status;
        }
      }).catch(function (err) {
        console.error('[SyncClient] autoSync 异常:', err.message);
        return 'error:' + err.message;
      });
    },

    /**
     * 失败重试逻辑（静默重试，不阻塞用户）
     * @param {string} operation - 'push' | 'pull'
     */
    _handleRetry: function (operation) {
      let self = this;
      if (this._retryCount >= this._maxRetries) {
        console.warn('[SyncClient] ' + operation + ' 重试次数已达上限 (' + this._maxRetries + ')，停止重试');
        this._retryCount = 0;
        return;
      }

      this._retryCount++;
      console.log('[SyncClient] ' + operation + ' 将在 ' + (this._retryDelay / 1000) + 's 后重试 (第 ' + this._retryCount + ' 次)');

      setTimeout(function () {
        self.autoSync().then(function (result) {
          if (result.indexOf('failed') >= 0 || result.indexOf('error') >= 0) {
            self._handleRetry(operation); // 继续重试
          }
        });
      }, this._retryDelay);
    },

    // ──────────────────────────────────────
    //  定时同步
    // ──────────────────────────────────────

    /**
     * 启动定时自动同步（每5分钟）
     */
    startAutoSync: function () {
      if (this._timerId) {
        console.log('[SyncClient] 定时同步已在运行');
        return;
      }

      let self = this;
      let interval = 5 * 60 * 1000; // 5分钟

      // 小程序用 setInterval，浏览器也用
      this._timerId = setInterval(function () {
        self.autoSync().then(function (result) {
          if (result !== 'in-sync' && result !== 'skipped:no-token') {
            console.log('[SyncClient] 定时同步完成:', result);
          }
        });
      }, interval);

      console.log('[SyncClient] 定时同步已启动, 间隔=' + (interval / 1000 / 60) + '分钟');
    },

    /**
     * 停止定时自动同步
     */
    stopAutoSync: function () {
      if (this._timerId) {
        clearInterval(this._timerId);
        this._timerId = null;
        console.log('[SyncClient] 定时同步已停止');
      }
    },

    // ──────────────────────────────────────
    //  手动同步（用户触发）
    // ──────────────────────────────────────

    /**
     * 强制上传（忽略服务端状态）
     * @returns {Promise}
     */
    forcePush: function () {
      return this.push();
    },

    /**
     * 强制拉取（覆盖本地）
     * @returns {Promise}
     */
    forcePull: function () {
      return this.pull();
    },

    /**
     * 双向同步：先 pull 再 push
     * @returns {Promise<string>}
     */
    fullSync: function () {
      let self = this;
      return this.pull().then(function () {
        return self.push();
      }).then(function () {
        return 'full-sync-done';
      });
    },

    // ──────────────────────────────────────
    //  工具方法
    // ──────────────────────────────────────

    /**
     * 获取上次同步时间
     * @returns {number} 时间戳（毫秒），0 表示从未同步
     */
    getLastSyncTime: function () {
      return parseInt(storage.get(LAST_SYNC_KEY) || '0', 10);
    },

    /**
     * 获取上次同步时间的可读格式
     * @returns {string}
     */
    getLastSyncText: function () {
      let ts = this.getLastSyncTime();
      if (!ts) return '从未同步';

      let now = Date.now();
      let diff = now - ts;
      let minutes = Math.floor(diff / 60000);
      let hours = Math.floor(minutes / 60);
      let days = Math.floor(hours / 24);

      if (days > 0) return days + '天前同步';
      if (hours > 0) return hours + '小时前同步';
      if (minutes > 0) return minutes + '分钟前同步';
      return '刚刚同步';
    },

    /**
     * 检查是否已登录（有 token）
     * @returns {boolean}
     */
    isLoggedIn: function () {
      return !!this.token;
    },

    /**
     * 登出时清理同步状态
     */
    logout: function () {
      this.stopAutoSync();
      this.token = null;
      storage.remove('authToken');
      storage.remove(LAST_SYNC_KEY);
      console.log('[SyncClient] 已登出, 同步状态已清理');
    },

    /**
     * 获取当前环境信息
     * @returns {Object}
     */
    getEnvInfo: function () {
      return {
        platform: isWx ? 'wechat-miniprogram' : 'browser',
        hasToken: !!this.token,
        apiBase: this.apiBase,
        lastSyncTime: this.getLastSyncTime(),
        autoSyncRunning: !!this._timerId
      };
    }
  };

  // ──────────────────────────────────────
  //  暴露 storage 适配层（供外部使用）
  // ──────────────────────────────────────
  SyncClient.storage = storage;

  // ──────────────────────────────────────
  //  暴露 SYNC_KEYS（供外部参考）
  // ──────────────────────────────────────
  SyncClient.SYNC_KEYS = SYNC_KEYS;

  return SyncClient;
});
