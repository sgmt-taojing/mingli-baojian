/**
 * 易道智鉴 · 知识库统一索引
 * 版本: 1.0 - 2026.06.23
 * 功能: 汇总所有知识库文件的索引，提供全局搜索和分类查询
 * 
 * 使用方式:
 *   1. 在divination-hub.html中引入此文件
 *   2. 调用 KnowledgeIndex.search('关键词') 全文搜索
 *   3. 调用 KnowledgeIndex.getKnowledge('category', 'topic') 分类查询
 *   4. 调用 KnowledgeIndex.getCategories() 获取所有分类
 *   5. 调用 KnowledgeIndex.fetchFromAPI('/api/daily') 从服务器获取数据
 */

const KnowledgeIndex = (function() {
  
  // === 知识库文件索引 ===
  const MODULES = [
    { file: 'authoritative-knowledge-base.js', var: 'AUTHORITATIVE_KNOWLEDGE', category: 'authoritative', label: '权威知识库', desc: '八字、风水、奇门等全量命理知识' },
    { file: 'faith-knowledge-base.js', var: 'FAITH_KNOWLEDGE', category: 'faith', label: '信众知识库', desc: '神仙数据库、经典经文、参拜指导' },
    { file: 'koujue-database-full.js', var: 'KOUJUE_DATABASE', category: 'koujue', label: '口诀数据库', desc: '道教八大神咒、佛教咒语、养生导引' },
    { file: 'bazi-knowledge-base.js', var: 'BAZI_KB', category: 'bazi', label: '八字命理', desc: '排盘方法、天干地支、十神、格局' },
    { file: 'zhouyi-knowledge-base.js', var: 'ZHOUYI_KB', category: 'zhouyi', label: '周易知识', desc: '易经八卦、六十四卦详解' },
    { file: 'ziwei-knowledge-base.js', var: 'ZIWEI_KB', category: 'ziwei', label: '紫微斗数', desc: '十四正曜、十二宫、流年推断' },
    { file: 'qimen-knowledge-base.js', var: 'QIMEN_KB', category: 'qimen', label: '奇门遁甲', desc: '八门九星、三奇六仪、格局判断' },
    { file: 'meihua-knowledge-base.js', var: 'MEIHUA_KB', category: 'meihua', label: '梅花易数', desc: '体用关系、外应取象、卦象推断' },
    { file: 'liuren-knowledge-base.js', var: 'LIUREN_KB', category: 'liuren', label: '大六壬', desc: '四课三传、天将盘、九宗门' },
    { file: 'liuyao-knowledge-base.js', var: 'LIUYAO_KB', category: 'liuyao', label: '六爻知识', desc: '装卦方法、六亲六神、断卦步骤' },
    { file: 'fengshui-knowledge-base.js', var: 'FENGSHUI_KB', category: 'fengshui', label: '风水知识', desc: '峦头理气、罗盘使用、风水布局' },
    { file: 'yangzhai-knowledge-base.js', var: 'YANGZHAI_KB', category: 'yangzhai', label: '阳宅风水', desc: '家居办公风水、方位布局' },
    { file: 'zodiac-knowledge-base.js', var: 'ZODIAC_KNOWLEDGE', category: 'zodiac', label: '生肖知识', desc: '十二生肖详解、运势、配对' },
    { file: 'masters-knowledge.js', var: 'MASTERS_KNOWLEDGE', category: 'masters', label: '名家典籍', desc: '历代命理大师、经典著作' },
    { file: 'knowledge-details.js', var: 'KNOWLEDGE_DETAILS', category: 'details', label: '知识详情', desc: '各分类知识详细HTML内容' },
    { file: 'knowledge-details-extra.js', var: 'KNOWLEDGE_DETAILS_EXTRA', category: 'details_extra', label: '知识扩展', desc: '知识详情补充内容' },
    { file: 'classics-highlights.js', var: 'CLASSICS_HIGHLIGHTS', category: 'classics', label: '经典精选', desc: '经典命理古籍精华摘录' },
    { file: 'knowledge-deep-supplement.js', var: 'KNOWLEDGE_DEEP_SUPPLEMENT', category: 'deep_supplement', label: '深度补充', desc: '知识库深度扩充内容' },
    { file: 'faith-content.js', var: 'FAITH_CONTENT', category: 'faith_content', label: '信众内容', desc: '每日修行指导、经文音频' },
    { file: 'faith-deities-detail.js', var: 'DEITIES_DETAIL', category: 'deities_detail', label: '神仙详解', desc: '22位神仙传记、感应故事' },
    { file: 'knowledge-supplement.js', var: 'KNOWLEDGE_SUPPLEMENT', category: 'supplement', label: '综合补充', desc: '各领域补充知识' },
    { file: 'knowledge-supplement-1.js', var: 'KNOWLEDGE_SUPPLEMENT_XINGMING', category: 'supplement_xingming', label: '姓名学补充', desc: '五格数理、姓名学详解' },
    { file: 'knowledge-supplement-2.js', var: 'KNOWLEDGE_SUPPLEMENT_2', category: 'supplement_2', label: '补充知识二', desc: '扩展命理知识' },
    { file: 'knowledge-supplement-3.js', var: 'KNOWLEDGE_SUPPLEMENT_3', category: 'supplement_3', label: '补充知识三', desc: '扩展命理知识' },
    { file: 'knowledge-supplement-4.js', var: 'KNOWLEDGE_SUPPLEMENT_4', category: 'supplement_4', label: '补充知识四', desc: '扩展命理知识' },
    { file: 'knowledge-supplement-5.js', var: 'KNOWLEDGE_SUPPLEMENT_5', category: 'supplement_5', label: '补充知识五', desc: '扩展命理知识' },
    { file: 'knowledge-supplement-6.js', var: 'KNOWLEDGE_SUPPLEMENT_6', category: 'supplement_6', label: '补充知识六', desc: '扩展命理知识' },
  ];
  
  // === API配置 ===
  const API_BASE = (location.hostname === '127.0.0.1' || location.hostname === 'localhost') ? 'http://127.0.0.1:8901/api' : '';
  let apiAvailable = null; // null=未检测, true/false
  
  // === 缓存 ===
  let _searchCache = {};
  let _categoryCache = {};
  
  // === 获取全局变量引用 ===
  function getGlobalVar(name) {
    // 尝试直接访问
    try {
      if (typeof window[name] !== 'undefined') return window[name];
    } catch(e) {}
    // 尝试 eval
    try {
      return eval(name);
    } catch(e) {
      return null;
    }
  }
  
  // === 获取所有分类 ===
  function getCategories() {
    const cats = {};
    MODULES.forEach(m => {
      const data = getGlobalVar(m.var);
      let entryCount = 0;
      if (data) {
        if (typeof data === 'object') {
          entryCount = Object.keys(data).length;
        }
      }
      cats[m.category] = {
        label: m.label,
        desc: m.desc,
        file: m.file,
        entries: entryCount,
        loaded: !!data
      };
    });
    return cats;
  }
  
  // === 分类查询 ===
  function getKnowledge(category, topic) {
    // 找到对应模块
    const mod = MODULES.find(m => m.category === category);
    if (!mod) return null;
    
    const data = getGlobalVar(mod.var);
    if (!data) return null;
    
    if (topic) {
      // 精确查询
      if (data[topic]) return data[topic];
      // 模糊查询
      for (let k in data) {
        if (k.toLowerCase().includes(topic.toLowerCase())) {
          return { key: k, content: data[k] };
        }
      }
      return null;
    }
    
    return data;
  }
  
  // === 全文搜索 ===
  function searchKnowledge(keyword, options) {
    options = options || {};
    const maxResults = options.maxResults || 50;
    const results = [];
    const kw = keyword.toLowerCase();
    
    MODULES.forEach(m => {
      const data = getGlobalVar(m.var);
      if (!data || typeof data !== 'object') return;
      
      _searchInObj(data, kw, '', m, results, 0, options.maxDepth || 4);
    });
    
    // 按相关度排序
    results.sort((a, b) => (b.relevance || 0) - (a.relevance || 0));
    
    return results.slice(0, maxResults);
  }
  
  function _searchInObj(obj, keyword, path, module, results, depth, maxDepth) {
    if (depth > maxDepth || results.length >= 100) return;
    
    for (let key in obj) {
      if (!obj.hasOwnProperty(key)) continue;
      const val = obj[key];
      const curPath = path ? path + '.' + key : key;
      
      // 检查key
      if (key.toLowerCase().includes(keyword)) {
        results.push({
          category: module.category,
          categoryLabel: module.label,
          path: curPath,
          key: key,
          preview: _preview(val, 200),
          relevance: 10
        });
      }
      
      if (typeof val === 'string') {
        if (val.toLowerCase().includes(keyword)) {
          const idx = val.toLowerCase().indexOf(keyword);
          const start = Math.max(0, idx - 40);
          const end = Math.min(val.length, idx + keyword.length + 80);
          results.push({
            category: module.category,
            categoryLabel: module.label,
            path: curPath,
            key: key,
            preview: (start > 0 ? '...' : '') + val.substring(start, end) + (end < val.length ? '...' : ''),
            match: keyword,
            relevance: 5
          });
        }
      } else if (Array.isArray(val)) {
        val.forEach((item, i) => {
          if (typeof item === 'string' && item.toLowerCase().includes(keyword)) {
            results.push({
              category: module.category,
              categoryLabel: module.label,
              path: curPath + '[' + i + ']',
              key: key,
              preview: _preview(item, 200),
              relevance: 3
            });
          } else if (typeof item === 'object' && item !== null) {
            _searchInObj(item, keyword, curPath + '[' + i + ']', module, results, depth + 1, maxDepth);
          }
        });
      } else if (typeof val === 'object' && val !== null) {
        _searchInObj(val, keyword, curPath, module, results, depth + 1, maxDepth);
      }
    }
  }
  
  function _preview(val, maxLen) {
    if (typeof val === 'string') return val.substring(0, maxLen);
    try {
      return JSON.stringify(val).substring(0, maxLen);
    } catch(e) {
      return String(val).substring(0, maxLen);
    }
  }
  
  // === 从API获取数据 (异步) ===
  async function fetchFromAPI(endpoint) {
    try {
      const resp = await fetch(API_BASE + endpoint);
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const data = await resp.json();
      apiAvailable = true;
      return data;
    } catch(e) {
      apiAvailable = false;
      console.warn('[知识库索引] API不可用，使用本地数据:', e.message);
      return null;
    }
  }
  
  // === 异步搜索 (优先API，回退本地) ===
  async function searchAsync(keyword, maxResults) {
    maxResults = maxResults || 50;
    
    // 尝试API
    const apiResult = await fetchFromAPI('/search?q=' + encodeURIComponent(keyword) + '&limit=' + maxResults);
    if (apiResult && apiResult.results) {
      return apiResult.results;
    }
    
    // 回退到本地搜索
    return searchKnowledge(keyword, { maxResults: maxResults });
  }
  
  // === 异步获取分类 (优先API) ===
  async function getCategoriesAsync() {
    const apiResult = await fetchFromAPI('/knowledge/categories');
    if (apiResult) return apiResult;
    return getCategories();
  }
  
  // === 检测API是否可用 ===
  async function checkAPI() {
    try {
      const resp = await fetch(API_BASE + '/stats', { signal: AbortSignal.timeout ? AbortSignal.timeout(2000) : null });
      apiAvailable = resp.ok;
    } catch(e) {
      apiAvailable = false;
    }
    return apiAvailable;
  }
  
  // === 获取统计信息 ===
  function getStats() {
    const stats = {
      totalModules: MODULES.length,
      totalEntries: 0,
      modules: []
    };
    
    MODULES.forEach(m => {
      const data = getGlobalVar(m.var);
      const entries = data ? (typeof data === 'object' ? Object.keys(data).length : 0) : 0;
      stats.totalEntries += entries;
      stats.modules.push({
        category: m.category,
        label: m.label,
        file: m.file,
        entries: entries,
        loaded: !!data
      });
    });
    
    return stats;
  }
  
  // === 高亮关键词 ===
  function highlight(text, keyword) {
    if (!keyword) return text;
    const regex = new RegExp('(' + keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
    return text.replace(regex, '<mark style="background:rgba(201,168,76,0.3);color:var(--gold2);padding:1px 3px;border-radius:2px">$1</mark>');
  }
  
  // === 每日知识推送 ===
  function getDailyKnowledge(date) {
    // 委托给 divination-hub.html 中的全局函数
    if (typeof window.getDailyKnowledge === 'function') {
      return window.getDailyKnowledge(date);
    }
    return null;
  }
  
  // === 获取分类下的所有子条目 ===
  function getCategoryEntries(category) {
    const mod = MODULES.find(m => m.category === category);
    if (!mod) return [];
    const data = getGlobalVar(mod.var);
    if (!data || typeof data !== 'object') return [];
    const entries = [];
    function collectKeys(obj, prefix, depth) {
      if (depth > 2) return;
      for (let key in obj) {
        const val = obj[key];
        const path = prefix ? prefix + '.' + key : key;
        if (typeof val === 'string') {
          entries.push({ key: key, path: path, type: 'string', preview: val.substring(0, 100) });
        } else if (Array.isArray(val)) {
          entries.push({ key: key, path: path, type: 'array', count: val.length });
        } else if (typeof val === 'object' && val !== null) {
          entries.push({ key: key, path: path, type: 'object', count: Object.keys(val).length });
          collectKeys(val, path, depth + 1);
        }
      }
    }
    collectKeys(data, '', 0);
    return entries;
  }
  
  // === 完整分类索引 ===
  function getFullIndex() {
    const index = {};
    MODULES.forEach(m => {
      const data = getGlobalVar(m.var);
      if (!data || typeof data !== 'object') return;
      index[m.category] = {
        label: m.label,
        desc: m.desc,
        file: m.file,
        entries: getCategoryEntries(m.category)
      };
    });
    return index;
  }
  
  // === Public API ===
  return {
    MODULES: MODULES,
    getCategories: getCategories,
    getCategoriesAsync: getCategoriesAsync,
    getKnowledge: getKnowledge,
    search: searchKnowledge,
    searchAsync: searchAsync,
    fetchFromAPI: fetchFromAPI,
    checkAPI: checkAPI,
    getStats: getStats,
    highlight: highlight,
    getCategoryEntries: getCategoryEntries,
    getFullIndex: getFullIndex,
    getDailyKnowledge: getDailyKnowledge,
    get apiAvailable() { return apiAvailable; }
  };
})();

// 导出到全局
if (typeof window !== 'undefined') {
  window.KnowledgeIndex = KnowledgeIndex;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = KnowledgeIndex;
}

// 全局快捷函数
function searchKnowledge(keyword) {
  return KnowledgeIndex.search(keyword);
}

function getKnowledge(category, topic) {
  return KnowledgeIndex.getKnowledge(category, topic);
}
