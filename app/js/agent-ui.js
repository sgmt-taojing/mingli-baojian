/**
 * ═══════════════════════════════════════════════════════════════
 *  命理宝鉴 · 智能体 UI 组件（思维链 + 工具调用 + KB 命中）
 *  版本: v1.0 (2026-08-08 R477)
 *  组件:
 *    1. ThinkingPanel — 思维链可视化
 *    2. ToolCallCard — 工具调用卡片
 *    3. KbHitBadge — KB 命中指示器
 *    4. StreamRenderer — 流式 Markdown 渲染器
 * ═══════════════════════════════════════════════════════════════
 */

(function (global) {
  'use strict';
  
  // ── 工具函数 ──────────────────────────────────
  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  
  function esc(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
  }
  
  // ═══ 1. ThinkingPanel ═══════════════════════
  class ThinkingPanel {
    constructor(container) {
      this.container = typeof container === 'string' 
        ? document.querySelector(container) : container;
      if (!this.container) return;
      this.steps = [];
      this.render();
    }
    
    addStep(agent, status, detail) {
      this.steps.push({ agent, status, detail, ts: Date.now() });
      this.render();
    }
    
    updateStep(index, status, detail) {
      if (this.steps[index]) {
        this.steps[index].status = status;
        if (detail) this.steps[index].detail = detail;
        this.render();
      }
    }
    
    render() {
      if (!this.container) return;
      const icons = { pending: '⏳', running: '⚡', done: '✅', error: '❌' };
      const colors = { pending: '#636e72', running: '#0984e3', done: '#00b894', error: '#d63031' };
      
      this.container.innerHTML = '';
      const panel = el('div', 'agent-thinking-panel');
      panel.style.cssText = 'background:rgba(0,0,0,0.03);border-radius:8px;padding:10px;margin:8px 0;font-size:12px;';
      
      const title = el('div', '', '🧠 智能体协作');
      title.style.cssText = 'font-weight:600;color:#2d3436;margin-bottom:6px;';
      panel.appendChild(title);
      
      this.steps.forEach((step, i) => {
        const row = el('div', 'agent-step');
        row.style.cssText = `display:flex;align-items:center;gap:6px;padding:3px 0;color:${colors[step.status]||'#636e72'};`;
        row.innerHTML = `<span>${icons[step.status]||'⏳'}</span><span style="font-weight:500;">${esc(step.agent)}</span>${step.detail ? `<span style="opacity:0.6;">— ${esc(step.detail)}</span>` : ''}`;
        panel.appendChild(row);
      });
      
      this.container.appendChild(panel);
    }
    
    clear() { this.steps = []; this.render(); }
  }
  
  // ═══ 2. ToolCallCard ════════════════════════
  class ToolCallCard {
    static create(toolName, params, result) {
      const card = el('div', 'tool-call-card');
      card.style.cssText = 'background:linear-gradient(135deg,#f5f7fa,#e8ecf1);border:1px solid #dfe6e9;border-radius:10px;padding:12px;margin:8px 0;';
      
      const icons = {
        kb_search: '📚', bazi_paipan: '🎯', ziwei_paipan: '🌟',
        qimen_paipan: '🔮', liuyao_divination: '🪙', meihua_divination: '🌸',
        liuren_divination: '🏺', compatibility_check: '💑',
        huajie_suggestion: '🛡️', calendar_lookup: '📅',
      };
      
      const header = el('div', '', 
        `<span style="font-size:16px;">${icons[toolName]||'🔧'}</span> <strong>${esc(toolName)}</strong>`
      );
      header.style.cssText = 'display:flex;align-items:center;gap:6px;margin-bottom:6px;';
      card.appendChild(header);
      
      if (params) {
        const paramStr = Object.entries(params).map(([k,v]) => `${k}: ${esc(String(v))}`).join(', ');
        const p = el('div', '', `<span style="opacity:0.6;">参数:</span> ${paramStr}`);
        p.style.cssText = 'font-size:11px;color:#636e72;';
        card.appendChild(p);
      }
      
      if (result) {
        const r = el('div', '', `<span style="opacity:0.6;">结果:</span> ${esc(result.message || JSON.stringify(result).slice(0,100))}`);
        r.style.cssText = 'font-size:11px;color:#2d3436;margin-top:4px;';
        card.appendChild(r);
      }
      
      return card;
    }
  }
  
  // ═══ 3. KbHitBadge ══════════════════════════
  class KbHitBadge {
    static create(tier, score, source) {
      const badge = el('span', 'kb-hit-badge');
      const config = {
        DIRECT: { label: 'KB 直答', color: '#00b894', icon: '✅' },
        POLISH: { label: 'KB 增强', color: '#0984e3', icon: '✨' },
        FALLBACK: { label: 'AI 生成', color: '#6c5ce7', icon: '🤖' },
      };
      const c = config[tier] || config.FALLBACK;
      badge.style.cssText = `display:inline-flex;align-items:center;gap:3px;background:${c.color}15;color:${c.color};border:1px solid ${c.color}30;border-radius:12px;padding:2px 8px;font-size:10px;font-weight:600;`;
      badge.innerHTML = `${c.icon} ${c.label} · ${score ? (score * 100).toFixed(0) + '%' : ''}${source ? ' · ' + esc(source) : ''}`;
      return badge;
    }
  }
  
  // ═══ 4. StreamRenderer ══════════════════════
  class StreamRenderer {
    constructor(container) {
      this.container = typeof container === 'string'
        ? document.querySelector(container) : container;
      this.buffer = '';
      this.cursor = null;
    }
    
    start() {
      if (!this.container) return;
      this.buffer = '';
      this.container.innerHTML = '';
      const cursor = el('span', 'stream-cursor', '▊');
      cursor.style.cssText = 'animation:blink 0.8s infinite;color:#0984e3;';
      this.container.appendChild(cursor);
      this.cursor = cursor;
    }
    
    append(text) {
      if (!this.container || !text) return;
      this.buffer += text;
      
      // 简单 Markdown 渲染
      const html = this._renderMarkdown(this.buffer);
      
      // 保留 cursor
      if (this.cursor) {
        this.container.innerHTML = html;
        this.cursor = el('span', 'stream-cursor', '▊');
        this.cursor.style.cssText = 'animation:blink 0.8s infinite;color:#0984e3;';
        this.container.appendChild(this.cursor);
      } else {
        this.container.innerHTML = html;
      }
      
      // 自动滚动
      this.container.scrollTop = this.container.scrollHeight;
    }
    
    finish() {
      if (this.cursor) {
        this.cursor.remove();
        this.cursor = null;
      }
    }
    
    _renderMarkdown(text) {
      return esc(text)
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/`(.+?)`/g, '<code style="background:#f0f0f0;padding:1px 4px;border-radius:3px;">$1</code>')
        .replace(/\n/g, '<br>');
    }
    
    clear() {
      this.buffer = '';
      if (this.container) this.container.innerHTML = '';
    }
  }
  
  // ── 导出 ─────────────────────────────────────
  global.AgentUI = { ThinkingPanel, ToolCallCard, KbHitBadge, StreamRenderer };
  
})(typeof window !== 'undefined' ? window : globalThis);
