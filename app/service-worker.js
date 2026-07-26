// ================================================================
// R61 · 命理宝鉴 Service Worker（离线可用 + 缓存策略）
// ================================================================
// 策略：
//   - install:  预缓存核心 shell（首页 + 关键 CSS/JS）
//   - fetch:    cache-first（命中缓存 → 返回；否则 fetch → 缓存）
//   - activate: 清理旧版本缓存
// 升级：发布时改 CACHE_NAME → 旧缓存自动失效
// ================================================================

const CACHE_NAME = 'mingli-baojian-v3-2026-07-26';
const SHELL_ASSETS = [
  './',
  './divination-hub.html',
  './index.html',
  './manifest.json',
  './css/critical-divhub.css',
  './css/divination-hub-inline.css',
  './css/divination-hub.css',
  './css/pro-panel.css',
  './css/a11y-fix.css',
  './js/divination-hub-pwa.js',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // 容错：单文件 404 不阻塞 install（用户离线时仍可用其他文件）
      return Promise.all(
        SHELL_ASSETS.map(url =>
          cache.add(url).catch(err => console.warn('[SW] skip', url, err.message))
        )
      );
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;

  // 只处理同源 GET；POST/跨域/API 透传
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // API 请求：network-first（离线时回缓存）
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
    return;
  }

  // 静态资源：cache-first（命中缓存即返回，否则 fetch + 缓存）
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        // 只缓存 200 + basic 响应
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        return response;
      }).catch(() => {
        // 离线且无缓存 → 返回根页面（让 PWA 启动）
        if (request.mode === 'navigate') return caches.match('./divination-hub.html');
      });
    })
  );
});

// 监听消息：客户端可强制更新缓存
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});