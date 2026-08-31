/**
 * TCM-Agent Service Worker（G11 PWA · 模板源自 smart-home-family pwa-standard v1.0）
 * 三缓存策略（医疗场景调整）：
 * - HTML（app shell）：stale-while-revalidate —— 断网开壳
 * - /api/ 请求：network-only + 离线 JSON 兜底 —— 【患者数据一律不入缓存】（G11 铁律）
 * - 静态资源（js/css/png）：cache-first
 */
const VERSION = 'v1.0.0-g11';
const CACHE_SHELL = `tcm-shell-${VERSION}`;
const CACHE_STATIC = `tcm-static-${VERSION}`;

const SHELL_URLS = [
  '/mobile-interact.html',
  '/home-tcm.html',
  '/my-reports.html',
  '/patient-portal.html',
  '/emergency.html',
  '/pwa/manifest.json',
  '/pwa/icon-192.png',
  '/pwa/icon-512.png',
  '/pwa/pwa-inject.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_SHELL)
      .then(cache => cache.addAll(SHELL_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => !k.endsWith(VERSION))
          .map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // API → network-only（患者数据不入缓存）；断网回离线 JSON 兜底，不伪造成功
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => new Response(
        JSON.stringify({ ok: false, offline: true, error: '离线模式：无法连接服务端，操作未执行' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      ))
    );
    return;
  }

  // HTML shell → stale-while-revalidate
  if (event.request.mode === 'navigate' || url.pathname.endsWith('.html')) {
    event.respondWith(
      caches.match(event.request, { ignoreSearch: true }).then(cached => {
        const fetchPromise = fetch(event.request).then(resp => {
          if (resp.ok) {
            const clone = resp.clone();
            caches.open(CACHE_SHELL).then(c => c.put(event.request, clone));
          }
          return resp;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }

  // 静态资源 → cache-first
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(resp => {
        if (resp.ok && resp.type === 'basic') {
          const clone = resp.clone();
          caches.open(CACHE_STATIC).then(c => c.put(event.request, clone));
        }
        return resp;
      });
    })
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
