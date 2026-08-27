// TCM-Agent Service Worker — PWA离线缓存 + 消息推送
const CACHE_NAME = 'tcm-agent-v1.7-20260822'; // R763 升版（CORS 修复配套刷新） // R763 升版（诊断通道 + 跨域 fetch 修真）
const CACHE_URLS = [
  '/', '/index.html', '/login.html', '/doctor-dashboard.html',
  '/ai-diagnosis.html', '/emr.html', '/acupuncture.html', '/pharmacy.html',
  '/payment.html', '/patient-portal.html', '/report.html', '/digital-twin.html',
  '/wellness.html', '/emergency.html', '/followup.html', '/therapy.html',
  '/recommend.html', '/telemedicine.html', '/dashboard.html', '/schedule.html',
  '/call-center.html', '/messages.html', '/health-archive.html', '/hospital.html',
  '/finance.html', '/inventory.html', '/monitor.html', '/admin.html',
  '/wearable-monitor.html', '/safety-check.html', '/rbac.html',
  '/server-monitor.html',
  '/css/mobile.css', '/css/standard.css',
  '/js/nav.js', '/js/rx-loop.js', '/js/seed-loader.js', '/js/digital-twin.js',
  '/js/data-engine.js',
  '/manifest.json'
];

// 安装: 预缓存
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      /* [sanitized] */
      return cache.addAll(CACHE_URLS);
    }).catch(err => {
      /* [sanitized] */
    })
  );
  self.skipWaiting();
});

// 激活: 清理旧缓存
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => {
          /* [sanitized] */
          return caches.delete(key);
        })
      ).then(() => {
        // R735 修真——广播新版本给客户端,触发自动 reload
        return self.clients.matchAll({ includeUncontrolled: true }).then(clients => {
          clients.forEach(client => {
            client.postMessage({ type: 'SW_VERSION', version: CACHE_NAME, ts: Date.now() });
          });
        });
      });
    })
  );
  self.clients.claim();
});

// R735 修真——客户端发送 SKIP_WAITING 时跳过等待
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// 请求拦截: R727 修真——全部网络优先，缓存仅离线兜底
// 原策略 cacheFirst 导致页面更新后浏览器永远拿旧版（修真不生效的元凶）
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(networkFirst(event.request));
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    // 离线降级: HTML请求返回index.html
    if (request.headers.get('Accept')?.includes('text/html')) {
      return caches.match('/index.html');
    }
    return new Response('{ "ok": false, "offline": true }', {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ ok: false, offline: true }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 消息推送
self.addEventListener('push', event => {
  const data = event.data?.json() || {};
  const title = data.title || 'TCM-Agent';
  const options = {
    body: data.body || '',
    icon: '/img/icon-192.png',
    badge: '/img/icon-192.png',
    data: { url: data.url || '/' },
    vibrate: [200, 100, 200],
    actions: data.actions || []
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clients => {
      for (const client of clients) {
        if (client.url.includes(url)) return client.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});
