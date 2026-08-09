// divination-modules-loader.js
// R629: divination-core.js 拆分后的统一加载入口
// 用法：<script src="js/divination-modules-loader.js" defer></script>
// 加载顺序：先加载核心，再按需加载子模块
(function(global){
  const DIVINATION_MODULES = {
    'almanac-engine': { path: 'js/almanac-engine.js', size: '27KB', desc: '黄历计算引擎' },
    'heluo-math':     { path: 'js/heluo-math.js',     size: '12KB', desc: '河洛数理系统' },
    'lunar-utils':    { path: 'js/lunar-utils.js',    size: '13KB', desc: '农历转换工具' }
  };
  
  // 已加载模块缓存
  const loaded = {};
  
  // 模块加载队列
  const loading = [];
  
  /**
   * 按需加载指定模块
   * @param {string|string[]} modules - 模块名或模块名数组
   * @returns {Promise}
   */
  async function loadModule(modules) {
    const list = Array.isArray(modules) ? modules : [modules];
    const promises = list.map(name => {
      if (loaded[name]) return Promise.resolve();
      if (!DIVINATION_MODULES[name]) {
        return Promise.reject(new Error(`Unknown module: ${name}`));
      }
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = DIVINATION_MODULES[name].path;
        script.async = true;
        script.onload = () => { loaded[name] = true; resolve(); };
        script.onerror = () => reject(new Error(`Failed to load ${name}`));
        document.head.appendChild(script);
      });
    });
    return Promise.all(promises);
  }
  
  /**
   * 预加载所有模块（用于 PWA 缓存）
   */
  async function preloadAll() {
    return loadModule(Object.keys(DIVINATION_MODULES));
  }
  
  /**
   * 获取模块列表
   */
  function listModules() {
    return Object.keys(DIVINATION_MODULES).map(name => ({
      name, ...DIVINATION_MODULES[name]
    }));
  }
  
  // 导出 API
  global.DivinationModules = {
    load: loadModule,
    preloadAll: preloadAll,
    list: listModules,
    isLoaded: (name) => !!loaded[name],
    CONFIG: DIVINATION_MODULES
  };
  
  console.info('[divination-modules-loader] 已就绪，可用模块：', listModules());
})(typeof window !== 'undefined' ? window : globalThis);
