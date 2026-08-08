/**
 * ═══════════════════════════════════════════════════════════════
 *  命理宝鉴 · 智能搜索 v2（语义理解 + 实时联想 + 历史 + 模糊匹配）
 *  版本: v2.0 (2026-08-08 R477)
 *  特性:
 *    1. 语义关键词匹配（中医/八字/紫微等多领域）
 *    2. 实时联想（输入即查，debounce 200ms）
 *    3. 历史记录（localStorage 缓存 50 条）
 *    4. 模糊匹配（拼音/缩写/容错）
 *    5. 跨模块搜索（页面 + KB + 功能）
 * ═══════════════════════════════════════════════════════════════
 */

(function (global) {
  'use strict';
  
  const API = (location.hostname === '127.0.0.1' || location.hostname === 'localhost')
    ? 'http://127.0.0.1:8920' : '';
  
  const STORAGE_KEY = 'mbj_smart_search_v2';
  const MAX_HISTORY = 50;
  const DEBOUNCE_MS = 200;
  
  // ── 语义索引（中文 → 多义词映射） ─────────────
  const SEMANTIC_INDEX = {
    '命理': { mods: ['bazi', 'ziwei', 'qimen', 'liuyao'], pages: ['bazi.html', 'ziwei.html'], keywords: ['命运', '命盘', '运势'] },
    '八字': { mods: ['bazi'], pages: ['bazi.html'], keywords: ['四柱', '天干', '地支', '十神', '大运', '流年'] },
    '紫微': { mods: ['ziwei'], pages: ['ziwei.html'], keywords: ['斗数', '命宫', '身宫', '化禄', '化权', '化科', '化忌'] },
    '奇门': { mods: ['qimen'], pages: ['qimen-chart.html'], keywords: ['遁甲', '九星', '八门', '三奇'] },
    '六爻': { mods: ['liuyao'], pages: ['liuyao-chart.html'], keywords: ['铜钱卦', '摇卦', '世爻', '应爻'] },
    '中医': { mods: ['tcm'], pages: ['tcm.html', 'clinic.html'], keywords: ['辨证', '中药', '针灸', '穴位', '方剂'] },
    '调理': { mods: ['tcm'], pages: ['tcm.html'], keywords: ['养生', '体质', '气血', '阴阳'] },
    '健康': { mods: ['tcm'], pages: ['wellness-weekly.html'], keywords: ['养生', '保健', '作息'] },
    '化解': { mods: ['huajie'], pages: ['huajie.html'], keywords: ['转运', '改运', '风水', '化煞'] },
    '风水': { mods: ['fengshui'], pages: ['fengshui-chart.html'], keywords: ['堪舆', '峦头', '理气', '飞星'] },
    '黄历': { mods: ['huangli', 'zeri'], pages: ['huangli.html'], keywords: ['择日', '吉日', '宜忌'] },
    '起名': { mods: ['xingming'], pages: ['naming.html'], keywords: ['姓名', '八字起名', '三才', '五格'] },
    '合婚': { mods: ['compatibility'], pages: ['marriage.html'], keywords: ['配对', '合盘', '婚配'] },
    '音乐': { mods: ['music'], pages: ['music.html'], keywords: ['五音', '宫商角徵羽'] },
  };
  
  // ── 拼音模糊映射 ─────────────────────────────
  const PINYIN_INDEX = {
    'bz': '八字', 'zw': '紫微', 'qm': '奇门', 'ly': '六爻', 
    'mhsj': '梅花', 'lr': '六壬', 'fs': '风水', 'zy': '中医',
    'hl': '黄历', 'qm': '起名', 'hh': '合婚', 'yl': '音乐',
  };
  
  const state = {
    history: [],
    suggestions: [],
    currentQuery: '',
    callbacks: {},
  };
  
  // ── 加载历史 ─────────────────────────────────
  function loadHistory() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      state.history = stored ? JSON.parse(stored) : [];
    } catch (_) {
      state.history = [];
    }
  }
  
  function saveHistory() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.history.slice(0, MAX_HISTORY)));
    } catch (_) {}
  }
  
  // ── 智能补全 ─────────────────────────────────
  function expandQuery(text) {
    if (!text || text.length < 2) return [];
    
    const lower = text.toLowerCase().trim();
    const expanded = [];
    
    // 1. 直接命中语义索引
    for (const [keyword, info] of Object.entries(SEMANTIC_INDEX)) {
      if (keyword.startsWith(text) || keyword.includes(text)) {
        expanded.push({
          keyword,
          type: 'semantic',
          score: text.length / keyword.length,
          pages: info.pages,
          mods: info.mods,
        });
      }
    }
    
    // 2. 拼音缩写匹配
    if (lower.length <= 4 && PINYIN_INDEX[lower]) {
      expanded.push({
        keyword: PINYIN_INDEX[lower],
        type: 'pinyin',
        score: 0.85,
      });
    }
    
    // 3. 关联关键词展开
    for (const [keyword, info] of Object.entries(SEMANTIC_INDEX)) {
      if (info.keywords && info.keywords.some(k => k.includes(text))) {
        expanded.push({
          keyword,
          type: 'related',
          score: 0.7,
        });
      }
    }
    
    // 4. 历史联想
    state.history
      .filter(h => h.includes(text) && h !== text)
      .slice(0, 5)
      .forEach(h => expanded.push({ keyword: h, type: 'history', score: 0.6 }));
    
    return expanded
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }
  
  // ── KB 实时搜索 ─────────────────────────────
  async function searchKb(query, module = null) {
    try {
      const params = new URLSearchParams({ q: query, limit: '8' });
      if (module) params.set('module', module);
      const res = await fetch(`${API}/api/kb-search?${params}`, {
        signal: AbortSignal.timeout(3000),
      });
      const data = await res.json();
      if (data.code === 0 && data.data) {
        return Array.isArray(data.data) ? data.data : (data.data.results || []);
      }
      return [];
    } catch (_) {
      return [];
    }
  }
  
  // ── 完整搜索（联想 + KB + 历史） ──────────────
  async function search(query, opts = {}) {
    if (!query || query.trim().length === 0) {
      return { suggestions: [], kbResults: [], total: 0 };
    }
    
    const q = query.trim();
    state.currentQuery = q;
    
    // 记录历史
    if (!opts.skipHistory) {
      state.history = [q, ...state.history.filter(h => h !== q)].slice(0, MAX_HISTORY);
      saveHistory();
    }
    
    // 并行：联想 + KB 搜索
    const [suggestions, kbResults] = await Promise.all([
      Promise.resolve(expandQuery(q)),
      searchKb(q),
    ]);
    
    return {
      query: q,
      suggestions,
      kbResults,
      total: suggestions.length + kbResults.length,
      history: state.history.slice(0, 10),
    };
  }
  
  // ── Debounce 搜索 ────────────────────────────
  let debounceTimer = null;
  function debounceSearch(query, fn, delay = DEBOUNCE_MS) {
    if (debounceTimer) clearTimeout(timer);
    debounceTimer = setTimeout(() => fn(query), delay);
  }
  
  // ── 清除历史 ─────────────────────────────────
  function clearHistory() {
    state.history = [];
    saveHistory();
  }
  
  function getHistory() {
    return state.history;
  }
  
  // ── 初始化 ───────────────────────────────────
  loadHistory();
  
  // ── 导出 ─────────────────────────────────────
  global.SmartSearchV2 = {
    search,
    expandQuery,
    debounceSearch,
    clearHistory,
    getHistory,
    SEMANTIC_INDEX,
    PINYIN_INDEX,
  };
  
})(typeof window !== 'undefined' ? window : globalThis);
