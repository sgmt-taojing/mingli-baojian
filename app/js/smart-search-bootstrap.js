
/**
 * ═══════════════════════════════════════════════════════════════
 *  命理宝鉴 · SmartSearchV2 全局接线补丁 (R480)
 *  注入到任意页面后自动接管 #globalSearchInput / #searchInput 搜索
 *  优先级：SmartSearchV2.search > 原有 fetch
 *  版本: v1.0 (2026-08-09)
 * ═══════════════════════════════════════════════════════════════
 */

(function (global) {
  'use strict';

  // ── 检测页面是否已有原生搜索 ─────────────────────
  function detectExistingSearch() {
    const inputs = ['#globalSearchInput', '#searchInput', '#smartSearch', '#query', '.search-input input', '.search-box input'];
    for (const sel of inputs) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    return null;
  }

  // ── 创建搜索结果面板 ─────────────────────────────
  function createPanel() {
    if (document.getElementById('ssv2-panel')) return document.getElementById('ssv2-panel');
    const panel = document.createElement('div');
    panel.id = 'ssv2-panel';
    panel.style.cssText = [
      'position:absolute', 'top:100%', 'left:0', 'right:0',
      'background:#fff', 'border:1px solid #e0e0e0', 'border-radius:8px',
      'box-shadow:0 4px 20px rgba(0,0,0,.15)', 'z-index:9999',
      'max-height:60vh', 'overflow-y:auto', 'display:none',
      'margin-top:4px', 'font-family:system-ui,sans-serif'
    ].join(';');

    // 注入样式
    const style = document.createElement('style');
    style.textContent = `
      #ssv2-panel .ssv2-section { padding:8px 12px; border-bottom:1px solid #f0f0f0; }
      #ssv2-panel .ssv2-section-title { font-size:11px; color:#888; margin-bottom:4px; font-weight:600; }
      #ssv2-panel .ssv2-item { padding:6px 8px; cursor:pointer; border-radius:4px; font-size:13px; line-height:1.4; }
      #ssv2-panel .ssv2-item:hover { background:#f5f5f5; }
      #ssv2-panel .ssv2-item-meta { font-size:11px; color:#999; margin-top:2px; }
      #ssv2-panel .ssv2-kb { padding:8px 12px; border-top:2px solid #c9a84c; }
      #ssv2-panel .ssv2-kb-title { font-size:12px; color:#c9a84c; font-weight:600; margin-bottom:6px; }
      #ssv2-panel .ssv2-kb-row { padding:8px; background:#fffbe6; border-radius:6px; margin-bottom:6px; font-size:12px; }
      #ssv2-panel .ssv2-kb-trust { display:inline-block; padding:1px 6px; background:#c9a84c; color:#fff; border-radius:3px; font-size:10px; margin-left:6px; }
      #ssv2-panel .ssv2-empty { padding:20px; text-align:center; color:#999; font-size:13px; }
    `;
    document.head.appendChild(style);
    document.body.appendChild(panel);
    return panel;
  }

  // ── 渲染搜索结果 ────────────────────────────────
  function renderPanel(panel, data) {
    let html = '';

    // 语义联想
    if (data.suggestions && data.suggestions.length > 0) {
      html += '<div class="ssv2-section"><div class="ssv2-section-title">💡 联想搜索</div>';
      data.suggestions.slice(0, 6).forEach(s => {
        const label = s.label || s.text || s;
        const meta = s.type === 'pinyin' ? '🔤' : s.type === 'semantic' ? '🧠' : s.type === 'history' ? '🕐' : '🔗';
        html += `<div class="ssv2-item" data-query="${label}">${meta} ${label}`;
        if (s.mods) html += `<div class="ssv2-item-meta">模块: ${s.mods.join(' / ')}</div>`;
        html += '</div>';
      });
      html += '</div>';
    }

    // KB 命中
    if (data.kbResults && data.kbResults.length > 0) {
      html += '<div class="ssv2-section ssv2-kb"><div class="ssv2-kb-title">📚 知识库命中</div>';
      data.kbResults.slice(0, 5).forEach(r => {
        const trust = r.trust ? `<span class="ssv2-kb-trust">${(r.trust * 100).toFixed(0)}%</span>` : '';
        html += `<div class="ssv2-kb-row"><b>${r.title || r.module || ''}</b>${trust}<br>${(r.content || r.summary || '').substring(0, 100)}...</div>`;
      });
      html += '</div>';
    }

    // 空结果
    if (!html) {
      html = '<div class="ssv2-empty">暂无结果，试试其他关键词</div>';
    }

    panel.innerHTML = html;
    panel.style.display = 'block';

    // 点击联想词 → 填入搜索框
    panel.querySelectorAll('.ssv2-item').forEach(item => {
      item.addEventListener('click', function () {
        const q = this.getAttribute('data-query');
        const input = document.getElementById('ssv2-input');
        if (input) {
          input.value = q;
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
        panel.style.display = 'none';
      });
    });
  }

  // ── 初始化入口 ───────────────────────────────────
  function init(opts = {}) {
    const input = detectExistingSearch();
    if (!input) return false;
    if (typeof SmartSearchV2 === 'undefined') return false;

    const panel = createPanel();

    // 包装 input
    input.id = 'ssv2-input';
    input.setAttribute('autocomplete', 'off');
    input.parentElement.style.position = 'relative';

    // 输入处理
    let lastQuery = '';
    input.addEventListener('input', async function (e) {
      const q = e.target.value.trim();
      if (!q || q === lastQuery) return;
      lastQuery = q;

      try {
        const data = await SmartSearchV2.search(q, { limit: 8 });
        renderPanel(panel, data);
      } catch (err) {
        console.warn('[SSV2 init] search failed:', err.message);
      }
    });

    // 关闭面板
    input.addEventListener('blur', function () {
      setTimeout(() => { panel.style.display = 'none'; }, 200);
    });
    input.addEventListener('focus', function () {
      if (input.value.trim()) panel.style.display = 'block';
    });

    return true;
  }

  // ── 导出 ─────────────────────────────────────────
  global.SmartSearchBootstrap = { init, version: '1.0' };

  // ── 自动初始化 ───────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { init(); });
  } else {
    init();
  }
})(typeof window !== 'undefined' ? window : globalThis);
