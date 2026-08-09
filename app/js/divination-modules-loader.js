// divination-modules-loader.js
// R629: divination-core.js 拆分后的统一加载入口
// 用法：<script src="js/divination-modules-loader.js" defer></script>
// 加载顺序：先加载核心，再按需加载子模块
(function(global){
  const DIVINATION_MODULES = {
    // Phase 1: 独立无耦合
    'almanac-engine': { path: 'js/almanac-engine.js', size: '27KB', desc: '黄历计算引擎', phase: 1 },
    'heluo-math':     { path: 'js/heluo-math.js',     size: '12KB', desc: '河洛数理系统', phase: 1 },
    'lunar-utils':    { path: 'js/lunar-utils.js',    size: '13KB', desc: '农历转换工具', phase: 1 },
    // Phase 2: 八字核心
    'bazi-core':      { path: 'js/bazi-core.js',      size: '32KB', desc: '八字核心引擎', phase: 2 },
    'bazi-liunian':   { path: 'js/bazi-liunian.js',   size: '14KB', desc: '流年逐月运势', phase: 2 },
    // Phase 3: 术数引擎
    'qimen-engine':   { path: 'js/qimen-engine.js',   size: '49KB', desc: '奇门遁甲引擎', phase: 3 },
    'yijing-engine':  { path: 'js/yijing-engine.js',  size: '14KB', desc: '易经解读引擎', phase: 3 },
    // Phase 4: 渲染增强
    'bazi-renderer':  { path: 'js/bazi-renderer.js',  size: '21KB', desc: '八字V2渲染器', phase: 4 }
  };
  
  const loaded = new Set();
  const loading = new Map();
  const callbacks = [];
  
  // 从 URL hash 推断需要的模块（轻量级预判）
  function inferFromHash() {
    const hash = global.location?.hash || '';
    const needed = [];
    if (hash.includes('qimen') || hash.includes('奇门')) needed.push('qimen-engine');
    if (hash.includes('yijing') || hash.includes('易经')) needed.push('yijing-engine');
    if (hash.includes('bazi') || hash.includes('八字')) {
      needed.push('bazi-renderer', 'bazi-liunian');
    }
    if (hash.includes('almanac') || hash.includes('黄历')) needed.push('almanac-engine');
    return needed;
  }
  
  async function loadModule(modules) {
    const list = Array.isArray(modules) ? modules : [modules];
    const promises = list.map(name => {
      if (loaded.has(name)) return Promise.resolve();
      if (loading.has(name)) return loading.get(name);
      if (!DIVINATION_MODULES[name]) {
        return Promise.reject(new Error('Unknown module: ' + name));
      }
      const p = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = DIVINATION_MODULES[name].path;
        script.async = true;
        script.onload = () => { loaded.add(name); loading.delete(name); resolve(); };
        script.onerror = () => { loading.delete(name); reject(new Error('Failed: ' + name)); };
        document.head.appendChild(script);
      });
      loading.set(name, p);
      return p;
    });
    return Promise.all(promises);
  }
  
  async function preloadAll() {
    return loadModule(Object.keys(DIVINATION_MODULES));
  }
  
  function listModules() {
    return Object.keys(DIVINATION_MODULES).map(name => ({ name, ...DIVINATION_MODULES[name] }));
  }
  
  function isLoaded(name) { return loaded.has(name); }
  
  // 导出 API
  global.DivinationModules = {
    load: loadModule,
    preloadAll: preloadAll,
    list: listModules,
    isLoaded,
    CONFIG: DIVINATION_MODULES
  };
  
  console.info('[divination-modules-loader] ready:', listModules().length, 'modules');
})(typeof window !== 'undefined' ? window : globalThis);
