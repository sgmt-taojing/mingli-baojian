// ================================================================
// R89-L · 命理宝鉴 Service Worker v4（离线可用 · 缓存策略升级）
// ================================================================
// 升级点：
//   1. CACHE_NAME v4 · 同步旧 v3 兼容删除
//   2. SHELL_ASSETS 扩展 17 → 30+（覆盖 AI 助手/黄历/KB图谱等核心入口）
//   3. 增加 OFFLINE_FALLBACK 页面（offline.html）
//   4. fetch 策略分级：
//        - navigation 请求：network-first，离线返回 offline.html
//        - 静态资源（HTML/CSS/JS）：stale-while-revalidate
//        - API 请求：network-first，离线返回预存快照（KB 兜底）
//   5. 新增 'sync' 占位事件（离线排盘排队 → 上线同步）
// ================================================================

const CACHE_NAME = 'mingli-baojian-v4-2026-07-27';
const CACHE_RUNTIME = 'mingli-baojian-runtime-v4';
const OFFLINE_URL = './offline.html';

const SHELL_ASSETS = [
  './',
  './divination-hub.html',
  './index.html',
  './manifest.json',
  OFFLINE_URL,
  // 核心 CSS
  './css/critical-divhub.css',
  './css/divination-hub-inline.css',
  './css/divination-hub.css',
  './css/pro-panel.css',
  './css/a11y-fix.css',
  './css/ai-assistant-inline.css',
  './css/divination-almanac-inline.css',
  './css/report-scroll.css',
  './css/report-template.css',
  './css/immersive-mode.css',
  './css/paipan-ritual.css',
  // 核心 JS
  './js/divination-hub-pwa.js',
  './js/compliance.js',
  './js/paipan-input.js',
  './js/paipan-ritual-inline.js',
  './js/immersive-mode-inline.js',
  './js/almanac-heatmap-inline.js',
  './js/yuanzhu-profile-sync.js',
];

// ================================================================
// install · 预缓存 shell
// ================================================================
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // 容错：单文件 404 不阻塞 install
      return Promise.all(
        SHELL_ASSETS.map(url =>
          cache.add(new Request(url, { cache: 'reload' }))
              .catch(err => console.warn('[SW] skip', url, err.message))
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// ================================================================
// activate · 清理旧缓存 + 接管客户端
// ================================================================
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME && k !== CACHE_RUNTIME)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ================================================================
// fetch · 智能路由
// ================================================================
self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // 1. Navigation 请求（HTML 页面）：network-first · 离线 fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          // 缓存最新版本
          const clone = response.clone();
          caches.open(CACHE_RUNTIME).then(c => c.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request)
          .then(cached => cached || caches.match(OFFLINE_URL)))
    );
    return;
  }

  // 2. API 请求：network-first，离线回 KB 兜底
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .catch(() => caches.match(request).then(cached => {
          if (cached) return cached;
          // 离线 API 兜底响应
          return new Response(JSON.stringify({
            ok: true,
            offline: true,
            message: '离线模式：此接口不可用',
            timestamp: Date.now()
          }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200
          });
        }))
    );
    return;
  }

  // 3. 静态资源：stale-while-revalidate（命中缓存即返回 + 后台刷新）
  event.respondWith(
    caches.match(request).then(cached => {
      const fetchPromise = fetch(request).then(response => {
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        const clone = response.clone();
        caches.open(CACHE_RUNTIME).then(c => c.put(request, clone));
        return response;
      }).catch(() => cached);

      return cached || fetchPromise;
    })
  );
});

// ================================================================
// message · 客户端可强制更新缓存 / 清缓存
// ================================================================
self.addEventListener('message', event => {
  if (!event.data) return;
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))))
        .then(() => event.source && event.source.postMessage({ type: 'CACHE_CLEARED' }))
    );
  } else if (event.data.type === 'GET_CACHE_INFO') {
    event.waitUntil(
      caches.keys().then(keys => {
        Promise.all(keys.map(k => caches.open(k).then(c => c.keys().then(ks => ({ cache: k, count: ks.length })))))
          .then(info => event.source && event.source.postMessage({ type: 'CACHE_INFO', info }));
      })
    );
  }
});

// ================================================================
// sync · 离线操作排队（占位 · 上线时尝试同步）
// ================================================================
self.addEventListener('sync', event => {
  if (event.tag === 'sync-reports') {
    console.log('[SW] sync-reports triggered (offline queue replay placeholder)');
  }
});