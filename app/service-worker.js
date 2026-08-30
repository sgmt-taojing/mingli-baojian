// ================================================================
// G11 · 命理宝鉴 Service Worker v6（PWA 规范化 · 隐私红线版）
// ================================================================
// v6 变更（管理体系 G11 验收口径）：
//   1. 隐私红线：患者/批注/预约/回流/短信 数据一律 network-only，
//      SW 不拦截、不读缓存、不写缓存（SENSITIVE_RE 命中即放行）。
//   2. 离线壳扩展：mobile-capture / mobile-interact / report 三端入壳。
//   3. API 依然不落缓存（v5 已如此，v6 显式固化）。
//   4. 静态资源 stale-while-revalidate 维持不变。
// ================================================================

const CACHE_NAME = 'mingli-baojian-v6-2026-08-30';
const CACHE_RUNTIME = 'mingli-baojian-runtime-v5';
const OFFLINE_URL = './offline.html';

// 隐私红线：命中以下特征一律放行（不经 SW 缓存）
const SENSITIVE_RE = /emr|annotation|appoint|reflux|sms|patient|clinic|case|inbox/i;

const SHELL_ASSETS = [
  './',
  './divination-hub.html',
  './index.html',
  './manifest.json',
  './robots.txt',
  './sitemap.xml',
  OFFLINE_URL,
  // G11 双移动端 + 报告端（壳可离线打开，数据不缓存）
  './mobile-capture.html',
  './mobile-interact.html',
  './report.html',
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
  // PWA 注入与图标
  './pwa/pwa-inject.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
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
// fetch · 智能路由（隐私红线优先）
// ================================================================
self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // 0. 隐私红线：患者/批注/预约/回流/短信 相关一律放行，绝不落缓存
  if (SENSITIVE_RE.test(url.pathname) || SENSITIVE_RE.test(url.search)) return;

  // 1. Navigation 请求（HTML 页面）：network-first · 离线 fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_RUNTIME).then(c => c.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request)
          .then(cached => cached || caches.match(OFFLINE_URL)))
    );
    return;
  }

  // 2. API 请求：network-only + 离线兜底，永不读写缓存
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .catch(() => new Response(JSON.stringify({
          ok: true,
          offline: true,
          message: '离线模式：此接口不可用',
          timestamp: Date.now()
        }), {
          headers: { 'Content-Type': 'application/json' },
          status: 200
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
    console.warn('[SW] sync-reports triggered (offline queue replay placeholder)');
  }
});
