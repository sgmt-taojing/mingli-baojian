/**
 * 设备热插拔监听器
 * 当 USB 摄像头/麦克风插入时自动检测并通知用户
 */
(function() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.addEventListener) return;

  let knownDevices = [];
  
  async function refreshDevices() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cams = devices.filter(d => d.kind === 'videoinput');
      const mics = devices.filter(d => d.kind === 'audioinput');
      
      // 检测新设备
      const newCams = cams.filter(d => !knownDevices.some(k => k.deviceId === d.deviceId));
      const newMics = mics.filter(d => !knownDevices.some(k => k.deviceId === d.deviceId));
      
      if (newCams.length > 0 || newMics.length > 0) {
        // 通知用户
        showDeviceToast(newCams, newMics);
      }
      
      knownDevices = devices;
      
      // 更新全局设备状态
      window.__deviceStatus = {
        cameras: cams.length,
        microphones: mics.length,
        devices: devices,
        updated: Date.now()
      };
    } catch(e) {
      console.warn('[device-hotplug] enumerate failed:', e.message);
    }
  }

  function showDeviceToast(newCams, newMics) {
    var msgs = [];
    if (newCams.length > 0) msgs.push('📷 摄像头已接入 (' + newCams.length + ' 个)');
    if (newMics.length > 0) msgs.push('🎤 麦克风已接入 (' + newMics.length + ' 个)');
    
    if (msgs.length === 0) return;
    
    var toast = document.createElement('div');
    toast.style.cssText = 'position:fixed;top:60px;right:20px;background:rgba(10,10,12,0.95);border:1px solid rgba(74,222,128,0.4);border-radius:12px;padding:16px 20px;color:#4ade80;font-size:14px;z-index:9999;backdrop-filter:blur(12px);box-shadow:0 4px 20px rgba(0,0,0,0.4);max-width:320px;transition:opacity 0.3s';
    toast.innerHTML = '<div style="font-weight:600;margin-bottom:4px">🔌 设备已接入</div>' + 
      msgs.map(m => '<div style="padding:2px 0">' + m + '</div>').join('') +
      '<div style="margin-top:8px;font-size:12px;color:var(--paper2)"><a href="device-test.html" style="color:var(--gold)">前往测试 →</a></div>';
    document.body.appendChild(toast);
    
    setTimeout(function() {
      toast.style.opacity = '0';
      setTimeout(function() { toast.remove(); }, 300);
    }, 6000);
  }

  // 监听设备变化
  navigator.mediaDevices.addEventListener('devicechange', refreshDevices);
  
  // 初始扫描
  refreshDevices();
  
  // 暴露 API
  window.__deviceHotplug = {
    refresh: refreshDevices,
    getStatus: function() { return window.__deviceStatus; }
  };
})();
