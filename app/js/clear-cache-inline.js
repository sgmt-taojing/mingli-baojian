
const statusDiv = document.getElementById('status');
const progressBar = document.getElementById('progressBar');
const progressDiv = document.getElementById('progress');

function addStatus(text, type = 'info') {
  const item = document.createElement('div');
  item.className = `status-item ${type}`;
  item.innerHTML = `<span>${text}</span><span>${new Date().toLocaleTimeString()}</span>`;
  statusDiv.appendChild(item);
  statusDiv.classList.add('show');
  statusDiv.scrollTop = statusDiv.scrollHeight;
}

function setProgress(percent) {
  progressDiv.classList.add('show');
  progressBar.style.width = percent + '%';
}

async function clearAllCache() {
  statusDiv.innerHTML = '';
  statusDiv.classList.remove('show');
  setProgress(0);

  addStatus('开始清理缓存...', 'info');
  setProgress(10);

  // 1. 清理 localStorage
  try {
    const lsCount = localStorage.length;
    localStorage.clear();
    addStatus(`LocalStorage 已清理 (${lsCount} 项)`, 'success');
  } catch (e) {
    addStatus('LocalStorage 清理失败: ' + e.message, 'error');
  }
  setProgress(25);

  // 2. 清理 sessionStorage
  try {
    const ssCount = sessionStorage.length;
    sessionStorage.clear();
    addStatus(`SessionStorage 已清理 (${ssCount} 项)`, 'success');
  } catch (e) {
    addStatus('SessionStorage 清理失败: ' + e.message, 'error');
  }
  setProgress(40);

  // 3. 清理 Service Worker
  if ('serviceWorker' in navigator) {
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const reg of regs) {
        await reg.unregister();
        addStatus(`Service Worker 已注销: ${reg.scope}`, 'success');
      }
      if (regs.length === 0) {
        addStatus('没有注册的 Service Worker', 'info');
      }
    } catch (e) {
      addStatus('Service Worker 清理失败: ' + e.message, 'error');
    }
  } else {
    addStatus('浏览器不支持 Service Worker', 'info');
  }
  setProgress(60);

  // 4. 清理 Cache API
  if ('caches' in window) {
    try {
      const cacheNames = await caches.keys();
      for (const name of cacheNames) {
        await caches.delete(name);
        addStatus(`Cache 已删除: ${name}`, 'success');
      }
      if (cacheNames.length === 0) {
        addStatus('没有 Cache Storage', 'info');
      }
    } catch (e) {
      addStatus('Cache API 清理失败: ' + e.message, 'error');
    }
  }
  setProgress(80);

  // 5. 清理 Cookies
  try {
    const cookies = document.cookie.split(';');
    cookies.forEach(cookie => {
      const name = cookie.split('=')[0].trim();
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });
    addStatus(`Cookies 已清理 (${cookies.length} 项)`, 'success');
  } catch (e) {
    addStatus('Cookies 清理失败: ' + e.message, 'error');
  }
  setProgress(100);

  addStatus('✅ 缓存清理完成！', 'success');
  addStatus('请刷新主页面或点击下方按钮', 'info');
}

async function clearServiceWorker() {
  statusDiv.innerHTML = '';
  statusDiv.classList.remove('show');
  setProgress(0);

  if ('serviceWorker' in navigator) {
    try {
      addStatus('注销 Service Worker...', 'info');
      const regs = await navigator.serviceWorker.getRegistrations();
      setProgress(50);

      for (const reg of regs) {
        await reg.unregister();
        addStatus(`已注销: ${reg.scope}`, 'success');
      }

      setProgress(100);
      addStatus('✅ Service Worker 已重置', 'success');
    } catch (e) {
      addStatus('错误: ' + e.message, 'error');
    }
  } else {
    addStatus('浏览器不支持 Service Worker', 'error');
  }
}

function clearLocalStorage() {
  statusDiv.innerHTML = '';
  statusDiv.classList.remove('show');

  try {
    const count = localStorage.length;
    localStorage.clear();
    addStatus(`✅ LocalStorage 已清理 (${count} 项)`, 'success');
  } catch (e) {
    addStatus('❌ 清理失败: ' + e.message, 'error');
  }
}

function clearSessionStorage() {
  statusDiv.innerHTML = '';
  statusDiv.classList.remove('show');

  try {
    const count = sessionStorage.length;
    sessionStorage.clear();
    addStatus(`✅ SessionStorage 已清理 (${count} 项)`, 'success');
  } catch (e) {
    addStatus('❌ 清理失败: ' + e.message, 'error');
  }
}

function forceReload() {
  addStatus('正在跳转到主页面...', 'info');
  setTimeout(() => {
    window.location.href = 'divination-hub.html?t=' + Date.now();
  }, 500);
}

// 页面加载时检测
window.addEventListener('load', () => {
  addStatus('工具已就绪', 'info');
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(regs => {
      addStatus(`检测到 ${regs.length} 个 Service Worker`, 'info');
    });
  }
  if ('caches' in window) {
    caches.keys().then(names => {
      addStatus(`检测到 ${names.length} 个 Cache`, 'info');
    });
  }
});
