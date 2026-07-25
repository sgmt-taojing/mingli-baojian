// Lighthouse CI 配置：a11y 与性能预算门槛（与 #9-a11y-page-layer 收尾呼应）
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'node scripts/lh-static-server.js',
      startServerReadyPattern: 'listening on',
      url: [
        'http://127.0.0.1:8914/divination-hub.html',
        'http://127.0.0.1:8914/tcm-clinic.html',
        'http://127.0.0.1:8914/ai-assistant.html',
        'http://127.0.0.1:8914/yijing-oracle.html',
        'http://127.0.0.1:8914/fengshui.html',
      ],
      numberOfRuns: 3,
      settings: {
        skipAudits: ['uses-http2'], // GitHub Pages 不上 HTTP/2 跳过
        emulatedFormFactor: 'mobile',
        throttlingMethod: 'simulate',
      },
    },
    assert: {
      // 主线：a11y ≥ 90 + performance ≥ 70（首页），best-practices/seo ≥ 80
      assertions: {
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:performance': ['warn', { minScore: 0.7 }],
        'categories:best-practices': ['warn', { minScore: 0.8 }],
        'categories:seo': ['warn', { minScore: 0.8 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};