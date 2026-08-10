// ================================================================
//  PWA SERVICE WORKER & INSTALL BANNER
// ================================================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch(() => {});
  });
}
