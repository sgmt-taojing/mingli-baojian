/**
 * R478-B: 超级物种交互 UI — SuperAgentUI
 * 功能：消息气泡系统 + 思维链可视化 + 工具调用可视化 + 主动建议横幅 + 全局状态栏
 * 兼容：ai-assistant-inline.js 现有逻辑（MutationObserver 非侵入式增强）
 */

// 复用 adaptive-renderer.js 的颜色/图标配置（脚本加载顺序保证可用）
const CARD_ICONS = (typeof window !== 'undefined' && window.CARD_ICONS) || {
  reminder: '⏰', suggestion: '💡', tip: '🌟', alert: '⚠️', seasonal: '🌸', health: '🌿',
};
const CARD_COLORS = (typeof window !== 'undefined' && window.CARD_COLORS) || {
  reminder: { bg: 'rgba(201,168,76,0.08)', border: 'rgba(201,168,76,0.3)', accent: '#c9a84c' },
  suggestion: { bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.3)', accent: '#a78bfa' },
  tip: { bg: 'rgba(6,182,212,0.08)', border: 'rgba(6,182,212,0.3)', accent: '#22d3ee' },
  alert: { bg: 'rgba(244,67,54,0.08)', border: 'rgba(244,67,54,0.3)', accent: '#f44336' },
  seasonal: { bg: 'rgba(236,72,153,0.08)', border: 'rgba(236,72,153,0.3)', accent: '#ec4899' },
  health: { bg: 'rgba(39,174,96,0.08)', border: 'rgba(39,174,96,0.3)', accent: '#27ae60' },
};

// ─── 消息气泡系统 ──────────────────────────────────────────────
const MSG_TYPES = {
  user:     { cls: 'sau-msg sau-user',   icon: '👤', label: '用户',  bg: 'rgba(201,168,76,0.08)',  border: 'rgba(201,168,76,0.3)',  accent: '#c9a84c' },
  ai:       { cls: 'sau-msg sau-ai',     icon: '🤖', label: 'AI助手', bg: 'rgba(255,255,255,0.03)', border: 'rgba(201,168,76,0.15)', accent: '#f0e8d8' },
  thinking: { cls: 'sau-msg sau-thinking',icon: '💭', label: '思考中', bg: 'rgba(167,139,250,0.06)', border: 'rgba(167,139,250,0.25)', accent: '#a78bfa' },
  kb_direct:{ cls: 'sau-msg sau-kb',     icon: '📚', label: 'KB直答', bg: 'rgba(39,174,96,0.06)',  border: 'rgba(39,174,96,0.25)',  accent: '#27ae60' },
  tool:     { cls: 'sau-msg sau-tool',   icon: '🔧', label: '工具调用', bg: 'rgba(6,182,212,0.06)',  border: 'rgba(6,182,212,0.25)',  accent: '#22d3ee' },
  system:   { cls: 'sau-msg sau-system', icon: '⚙️', label: '系统',  bg: 'rgba(120,120,120,0.06)',border: 'rgba(120,120,120,0.2)',accent: '#999' },
};

const TOOL_ICON_MAP = {
  kb: '📚', bazi: '🎯', ziwei: '🌟', qimen: '🔮', liuyao: '🪙',
  meihua: '🌸', liuren: '🏺', compatibility: '💑', huajie: '🛡️',
  calendar: '📅', tcm: '🌿', fengshui: '🏠', general: '⚙️', ai: '🤖',
};

/**
 * SuperAgentUI.renderBubble({type, content, metadata, animate})
 * 渲染标准消息气泡
 */
function renderBubble({ type = 'ai', content = '', metadata = {}, animate = false }) {
  try {
    const cfg = MSG_TYPES[type] || MSG_TYPES.ai;
    const id = 'sau-bub-' + Date.now() + '-' + Math.random().toString(36).slice(2, 5);
    const d = document.createElement('div');
    d.className = cfg.cls + (animate ? ' sau-animate-in' : '');
    d.setAttribute('data-msg-type', type);
    d.setAttribute('data-msg-id', id);

    const animStyle = animate ? '<div class="sau-stream-cursor" style="display:inline-block;width:2px;height:14px;background:' + cfg.accent + ';margin-left:2px;animation:sau-blink 1s step-end infinite;vertical-align:text-bottom"></div>' : '';

    d.innerHTML = `
      <div class="sau-bubble" style="background:${cfg.bg};border:1px solid ${cfg.border}">
        <div class="sau-bubble-glow" style="background:radial-gradient(ellipse at 20% 0%,${cfg.accent}10,transparent 70%)"></div>
        <div class="sau-bubble-header">
          <span class="sau-bubble-icon">${cfg.icon}</span>
          <span class="sau-bubble-label" style="color:${cfg.accent}">${cfg.label}</span>
          <span class="sau-bubble-time" style="font-size:10px;opacity:.5;margin-left:auto">${_formatTime(Date.now())}</span>
        </div>
        <div class="sau-bubble-body">${_safeHtml(content)}${animStyle}</div>
      </div>`;
    return d;
  } catch (e) {
    return _fallbackBubble(content);
  }
}

/**
 * SuperAgentUI.renderThinkingPanel({steps, collapsed, onToggle})
 * 可折叠思维链步骤面板
 */
function renderThinkingPanel({ steps = [], collapsed = false, onToggle = null }) {
  try {
    const id = 'sau-think-' + Date.now();
    const stepEls = steps.map((step, i) => {
      const statusIcon = { pending: '⏳', active: '⚡', done: '✅', error: '❌' }[step.status] || '⏳';
      const detailContent = step.details ? `<div class="sau-think-detail" style="margin-top:6px;padding:8px;background:rgba(255,255,255,0.03);border-radius:6px;font-size:11px;color:var(--paper3);line-height:1.5">${_safeHtml(step.details)}</div>` : '';
      return `<div class="sau-think-step" data-step="${i}">
        <div class="sau-think-step-header" onclick="sauToggleThinkStep(this)">
          <span class="sau-think-status">${statusIcon}</span>
          <span class="sau-think-icon">${step.icon || '•'}</span>
          <span class="sau-think-agent" style="flex:1;font-size:12px;color:var(--paper2)">${esc(step.agent || '步骤 ' + (i+1))}</span>
          <span class="sau-think-dur" style="font-size:10px;opacity:.5;font-family:monospace">${step.duration ? step.duration + 'ms' : ''}</span>
          <span class="sau-think-chevron" style="font-size:10px;opacity:.5">▸</span>
        </div>
        <div class="sau-think-step-body" style="display:none">${detailContent}</div>
      </div>`;
    }).join('');

    const panel = document.createElement('div');
    panel.className = 'sau-thinking-panel';
    panel.id = id;
    panel.innerHTML = `
      <div class="sau-thinking-header" onclick="sauToggleThinkPanel('${id}')" style="cursor:pointer;display:flex;align-items:center;gap:6px;padding:8px 10px;background:rgba(167,139,250,0.06);border:1px solid rgba(167,139,250,0.2);border-radius:8px">
        <span style="color:#a78bfa;font-size:13px">🧠</span>
        <span style="font-size:12px;color:#a78bfa;font-weight:600;flex:1">思维链</span>
        <span class="sau-think-count" style="font-size:10px;background:rgba(167,139,250,0.15);color:#a78bfa;padding:2px 8px;border-radius:10px">${steps.length} 步</span>
        <span class="sau-think-chevron-main" style="font-size:10px;color:#a78bfa;transition:transform .2s">▾</span>
      </div>
      <div class="sau-thinking-steps" style="${collapsed ? 'display:none' : ''}">
        <div style="padding:4px 0">${stepEls}</div>
      </div>`;
    return panel;
  } catch (e) {
    return _fallbackBubble('[思维链] ' + (steps.map(s => s.agent).join(' → ') || '处理中'));
  }
}

/**
 * SuperAgentUI.renderToolCallCard({tool, params, status, result, duration})
 * 工具调用可视化卡片 v2
 */
function renderToolCallCard({ tool = 'general', params = {}, status = 'calling', result = null, duration = null }) {
  try {
    const icon = TOOL_ICON_MAP[tool] || TOOL_ICON_MAP.general;
    const id = 'sau-tool-' + Date.now() + '-' + Math.random().toString(36).slice(2, 4);
    const statusLabel = { calling: '⏳ 调用中', success: '✅ 完成', error: '❌ 失败', timeout: '⏰ 超时' }[status] || '⏳ 调用中';
    const statusColor = { calling: '#a78bfa', success: '#27ae60', error: '#f44336', timeout: '#f59e0b' }[status] || '#a78bfa';

    const paramsStr = Object.entries(params).slice(0, 5).map(([k, v]) =>
      `<span style="font-size:10px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:4px;padding:1px 5px;margin:1px;display:inline-block">${esc(k)}=<span style="color:var(--paper3)">${esc(String(v).slice(0, 30))}</span></span>`
    ).join('');

    const resultHtml = result ? `<div class="sau-tool-result" style="margin-top:8px;padding:8px;background:rgba(255,255,255,0.03);border-radius:6px;font-size:12px;color:var(--paper2);max-height:120px;overflow-y:auto">${_safeHtml(String(result).slice(0, 500))}</div>` : '';

    const durHtml = duration ? `<span style="font-size:10px;opacity:.5;font-family:monospace;margin-left:auto">${duration}ms</span>` : '';

    const d = document.createElement('div');
    d.className = 'sau-msg sau-tool-card';
    d.id = id;
    d.innerHTML = `
      <div class="sau-tool-card-inner" style="background:rgba(6,182,212,0.06);border:1px solid rgba(6,182,212,0.2);border-radius:8px;overflow:hidden">
        <div class="sau-tool-card-header" style="display:flex;align-items:center;gap:6px;padding:8px 10px;cursor:pointer" onclick="sauToggleToolCard('${id}')">
          <span style="font-size:15px">${icon}</span>
          <span style="font-size:12px;color:#22d3ee;font-weight:600;flex:1">${_toolName(tool)}</span>
          <span style="font-size:11px;color:${statusColor};font-weight:500">${statusLabel}</span>
          ${durHtml}
          <span class="sau-tool-chevron" style="font-size:10px;color:#22d3ee;opacity:.6;transition:transform .2s">▸</span>
        </div>
        <div class="sau-tool-card-body" style="display:none;padding:0 10px 10px">
          <div style="font-size:11px;color:var(--paper3);margin-bottom:4px">参数</div>
          <div class="sau-tool-params">${paramsStr || '<span style="font-size:10px;opacity:.4">无参数</span>'}</div>
          ${resultHtml}
        </div>
      </div>`;
    return d;
  } catch (e) {
    return _fallbackBubble(`[${tool}] ${status}`);
  }
}

// ─── 主动建议横幅 ────────────────────────────────────────────────
const SEASONAL_SUGGESTIONS = [
  { type: 'seasonal', title: '🌸 立秋时节', body: '秋季养肺为先，可多食白色食物（银耳、百合、山药），早睡早起收敛神气。', season: 'autumn' },
  { type: 'health', title: '🌿 节气提醒', body: '当前节气交替，注意增减衣物，避免空调直吹。', season: 'any' },
  { type: 'tip', title: '💡 命理小贴士', body: '今日宜静思规划，忌冲动决策。可查阅近期运势变化。', season: 'any' },
  { type: 'suggestion', title: '🌟 推荐体验', body: '试试「八字排盘」或「中医诊疗」模块，获取个性化分析。', season: 'any' },
];

/**
 * SuperAgentUI.renderProactiveBanner({suggestion, dismissible, onAction})
 * 顶部固定横幅
 */
function renderProactiveBanner({ suggestion = null, dismissible = true, onAction = null }) {
  try {
    const id = 'sau-banner-' + Date.now();
    const sug = suggestion || SEASONAL_SUGGESTIONS[Math.floor(Math.random() * SEASONAL_SUGGESTIONS.length)];
    const cfg = CARD_COLORS[sug.type] || CARD_COLORS.tip;
    const icon = CARD_ICONS[sug.type] || CARD_ICONS.tip;

    const banner = document.createElement('div');
    banner.className = 'sau-proactive-banner';
    banner.id = id;
    banner.setAttribute('role', 'alert');
    banner.style.cssText = `position:fixed;top:42px;left:0;right:0;z-index:185;background:${cfg.bg};border-bottom:1px solid ${cfg.border};backdrop-filter:blur(12px);padding:8px 16px;display:flex;align-items:center;gap:8px;animation:sau-slide-down .3s ease;font-size:12px;max-height:44px;overflow:hidden`;

    const actionBtn = onAction ? `<button class="sau-banner-action" style="background:${cfg.accent}20;color:${cfg.accent};border:1px solid ${cfg.border};border-radius:12px;padding:2px 10px;font-size:11px;cursor:pointer;white-space:nowrap;font-family:inherit" onclick="${onAction}">查看</button>` : '';

    banner.innerHTML = `
      <span style="font-size:14px;flex-shrink:0">${icon}</span>
      <span style="color:${cfg.accent};font-weight:600;font-size:11px;flex-shrink:0">${esc(sug.title)}</span>
      <span style="color:var(--paper3);font-size:11px;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(sug.body)}</span>
      ${actionBtn}
      ${dismissible ? `<button onclick="document.getElementById('${id}').remove()" aria-label="关闭建议" style="background:none;border:none;color:var(--paper3);cursor:pointer;font-size:14px;padding:0 2px;flex-shrink:0">✕</button>` : ''}`;

    return banner;
  } catch (e) {
    return null;
  }
}

// ─── 全局状态栏 ─────────────────────────────────────────────────
const MODE_LABELS = { normal: '普通', expert: '专家', clarifying: '澄清' };

/**
 * SuperAgentUI.renderStatusBar({mode, activeAgent, networkStatus, kbHitLevel})
 * 全局状态栏
 */
function renderStatusBar({ mode = 'normal', activeAgent = 'AI助手', networkStatus = 'online', kbHitLevel = null }) {
  try {
    const id = 'sau-status-bar';
    let bar = document.getElementById(id);
    if (!bar) {
      bar = document.createElement('div');
      bar.id = id;
      bar.className = 'sau-status-bar';
      bar.setAttribute('role', 'status');
      bar.setAttribute('aria-live', 'polite');
      document.body.appendChild(bar);
    }

    const netColor = networkStatus === 'online' ? '#27ae60' : networkStatus === 'degraded' ? '#f59e0b' : '#f44336';
    const netLabel = networkStatus === 'online' ? '在线' : networkStatus === 'degraded' ? '降级' : '离线';

    const kbHtml = kbHitLevel
      ? `<span class="sau-kb-indicator" title="KB 命中等级: ${kbHitLevel}">
           <span class="sau-kb-dot" style="background:${kbHitLevel === 'direct' ? '#27ae60' : kbHitLevel === 'polish' ? '#f59e0b' : '#f44336'}"></span>
           <span style="font-size:10px;opacity:.7">KB ${kbHitLevel === 'direct' ? '直答' : kbHitLevel === 'polish' ? '润色' : '兜底'}</span>
         </span>`
      : '';

    bar.innerHTML = `
      <div style="position:fixed;bottom:8px;left:8px;z-index:186;display:flex;gap:6px;align-items:center;padding:5px 10px;background:rgba(8,8,8,0.88);backdrop-filter:blur(8px);border:1px solid rgba(201,168,76,0.15);border-radius:14px;font-size:10px;font-family:monospace">
        <span class="sau-mode-chip" style="padding:2px 8px;border-radius:8px;background:rgba(201,168,76,0.1);color:#c9a84c;border:1px solid rgba(201,168,76,0.25)">${MODE_LABELS[mode] || mode}</span>
        <span style="color:var(--paper3);opacity:.6">${esc(activeAgent)}</span>
        ${kbHtml}
        <span style="color:${netColor};display:flex;align-items:center;gap:3px">
          <span style="width:6px;height:6px;border-radius:50%;background:${netColor};display:inline-block"></span>${netLabel}
        </span>
      </div>`;
    return bar;
  } catch (e) {
    return null;
  }
}

// ─── 流式打字动画 ────────────────────────────────────────────────
/**
 * SuperAgentUI.streamText(element, text, {speed, onDone})
 * 打字机效果：逐字渲染 + cursor blink
 */
function streamText(element, text, options = {}) {
  try {
    if (!element) return;
    const speed = options.speed || 25;
    const cursorClass = options.cursorClass || 'sau-stream-cursor';
    let i = 0;
    element.innerHTML = '';
    const cursor = document.createElement('span');
    cursor.className = cursorClass;
    cursor.style.cssText = 'display:inline-block;width:2px;height:14px;background:var(--gold);margin-left:1px;animation:sau-blink 1s step-end infinite;vertical-align:text-bottom';
    element.appendChild(cursor);

    function type() {
      if (i < text.length) {
        element.insertBefore(document.createTextNode(text[i]), cursor);
        i++;
        const chat = document.getElementById('chat');
        if (chat) chat.scrollTop = chat.scrollHeight;
        setTimeout(type, speed + Math.random() * 15);
      } else {
        cursor.remove();
        if (options.onDone) { try { options.onDone(); } catch (e) {} }
      }
    }
    type();
  } catch (e) {
    if (element) element.innerHTML = _safeHtml(text);
  }
}

// ─── 消息包装（非侵入式增强）─────────────────────────────────────
/**
 * SuperAgentUI.wrapExistingBubbles()
 * 用 MutationObserver 监听 #chat 中新加入的消息，自动包装为 SuperAgentUI 气泡
 */
function wrapExistingBubbles() {
  try {
    const chat = document.getElementById('chat');
    if (!chat || chat._sauObs) return;

    const observer = new MutationObserver(function(mutations) {
      for (const mut of mutations) {
        for (const node of mut.addedNodes) {
          if (!(node instanceof HTMLElement)) continue;
          // 只处理原始 .msg 元素（非 sau- 前缀）
          if (node.classList.contains('msg') && !node.classList.contains('sau-msg')) {
            _enhanceMsg(node);
          }
          // 处理 .msg 下的 .stream-cursor（流式）
          if (node.classList.contains('stream-cursor')) {
            node.classList.add('sau-stream-cursor');
          }
        }
      }
    });

    observer.observe(chat, { childList: true, subtree: false });
    chat._sauObs = observer;

    // 首次扫描已有消息
    chat.querySelectorAll('.msg:not(.sau-msg)').forEach(_enhanceMsg);
  } catch (e) {
    console.warn('[SuperAgentUI] wrapExistingBubbles:', e.message);
  }
}

function _enhanceMsg(el) {
  try {
    if (el._sauEnhanced) return;
    el._sauEnhanced = true;

    const isUser = el.classList.contains('m-user');
    const type = isUser ? 'user' : 'ai';
    const cfg = MSG_TYPES[type];

    // 添加类型标记
    el.setAttribute('data-sau-type', type);
    el.style.animation = 'sau-in .2s ease';

    // 检测是否为 KB 直答
    const body = el.querySelector('.b');
    if (body && !isUser && body.textContent.includes('【来源：本地知识库')) {
      el.setAttribute('data-sau-type', 'kb_direct');
      const label = el.querySelector('.sau-bubble-label');
      if (!label) {
        const header = document.createElement('div');
        header.className = 'sau-bubble-header';
        header.innerHTML = '<span class="sau-bubble-icon">📚</span><span class="sau-bubble-label" style="color:#27ae60;font-size:11px">KB 直答</span>';
        el.querySelector('.b').style.borderTop = '1px dashed rgba(39,174,96,0.2)';
        el.querySelector('.b').prepend(header);
      }
    }
  } catch (e) {}
}

// ─── 主入口 ──────────────────────────────────────────────────────
const SuperAgentUI = {
  renderBubble,
  renderThinkingPanel,
  renderToolCallCard,
  renderProactiveBanner,
  renderStatusBar,
  streamText,
  wrapExistingBubbles,
  MSG_TYPES,
  TOOL_ICON_MAP,
  MODE_LABELS,
};

// ─── 工具函数 ──────────────────────────────────────────────────
function esc(s) {
  if (s == null) return '';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function _safeHtml(s) {
  if (s == null) return '';
  return esc(String(s)).replace(/\n/g, '<br>');
}

function _fallbackBubble(content) {
  const d = document.createElement('div');
  d.className = 'sau-msg sau-fallback';
  d.innerHTML = '<div class="sau-bubble" style="background:rgba(255,255,255,0.02);border:1px solid rgba(201,168,76,0.1);border-radius:8px;padding:10px 14px;font-size:13px">' + _safeHtml(content) + '</div>';
  return d;
}

function _formatTime(ts) {
  try {
    const d = new Date(ts);
    return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
  } catch (e) { return ''; }
}

function _toolName(tool) {
  const map = { kb: '知识库', bazi: '八字排盘', ziwei: '紫微斗数', qimen: '奇门遁甲', liuyao: '六爻', meihua: '梅花易数', liuren: '六壬', compatibility: '合婚', huajie: '化解', calendar: '黄历', tcm: '中医', fengshui: '风水', general: '通用', ai: 'AI推断' };
  return map[tool] || tool;
}

// ─── CSS 注入 ───────────────────────────────────────────────────
function _injectSuperAgentStyles() {
  if (document.getElementById('sau-styles')) return;
  const style = document.createElement('style');
  style.id = 'sau-styles';
  style.textContent = `
    /* SuperAgentUI 气泡系统 */
    .sau-msg{margin-bottom:10px;animation:sau-in .25s ease}
    @keyframes sau-in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
    @keyframes sau-blink{0%,100%{opacity:1}50%{opacity:0}}
    .sau-msg.sau-animate-in .sau-bubble{animation:sau-pulse 1.5s ease infinite}
    @keyframes sau-pulse{0%,100%{box-shadow:0 0 0 0 transparent}50%{box-shadow:0 0 8px 2px rgba(167,139,250,0.15)}}
    .sau-user{display:flex;justify-content:flex-end}
    .sau-user .sau-bubble{background:rgba(201,168,76,0.08) !important;border-radius:10px 10px 3px 10px !important}
    .sau-ai .sau-bubble{background:rgba(255,255,255,0.02) !important;border-radius:3px 10px 10px 10px !important}
    .sau-thinking .sau-bubble{background:rgba(167,139,250,0.06) !important;border-radius:8px !important;border-style:dashed !important}
    .sau-kb .sau-bubble{border-left:3px solid #27ae60 !important}
    .sau-tool .sau-bubble{background:rgba(6,182,212,0.04) !important;border-style:dotted !important}
    .sau-system .sau-bubble{background:rgba(120,120,120,0.04) !important;border-radius:6px !important;opacity:.8}
    .sau-bubble{position:relative;overflow:hidden;padding:10px 14px;font-size:13px;line-height:1.6;white-space:pre-wrap;word-break:break-word}
    .sau-bubble-glow{position:absolute;top:0;left:0;right:0;height:40px;pointer-events:none}
    .sau-bubble-header{display:flex;align-items:center;gap:5px;margin-bottom:4px}
    .sau-bubble-icon{font-size:12px}
    .sau-bubble-label{font-size:11px;font-weight:600}
    .sau-bubble-time{font-size:10px;opacity:.4;font-family:monospace}
    .sau-bubble-body{position:relative;z-index:1}
    .sau-stream-cursor{display:inline-block;width:2px;height:14px;background:var(--gold);margin-left:1px;vertical-align:text-bottom;animation:sau-blink 1s step-end infinite}

    /* 思维链 */
    .sau-thinking-panel{margin-bottom:8px;border-radius:8px;overflow:hidden}
    .sau-thinking-header{padding:8px 10px;display:flex;align-items:center;gap:6px;background:rgba(167,139,250,0.06);border:1px solid rgba(167,139,250,0.2);border-radius:8px;cursor:pointer;transition:background .15s}
    .sau-thinking-header:hover{background:rgba(167,139,250,0.1)}
    .sau-thinking-steps{border-left:2px solid rgba(167,139,250,0.15);margin-left:14px;padding-left:8px}
    .sau-think-step{margin:4px 0;border-radius:6px;overflow:hidden}
    .sau-think-step-header{display:flex;align-items:center;gap:5px;padding:5px 8px;background:rgba(255,255,255,0.02);border-radius:4px;cursor:pointer;font-size:12px;transition:background .15s}
    .sau-think-step-header:hover{background:rgba(255,255,255,0.04)}
    .sau-think-status{font-size:11px;width:14px;text-align:center}
    .sau-think-icon{font-size:12px}
    .sau-think-agent{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .sau-think-dur{font-size:10px;opacity:.4;font-family:monospace}
    .sau-think-chevron{transition:transform .2s}
    .sau-think-detail{border-top:1px solid rgba(255,255,255,0.05);margin-top:4px;padding-top:4px}

    /* 工具调用卡片 */
    .sau-tool-card{margin-bottom:8px}
    .sau-tool-card-inner{border-radius:8px;overflow:hidden;transition:all .15s}
    .sau-tool-card-header{padding:8px 10px;display:flex;align-items:center;gap:6px;cursor:pointer;transition:background .15s}
    .sau-tool-card-header:hover{background:rgba(6,182,212,0.08)}
    .sau-tool-card-body{border-top:1px solid rgba(6,182,212,0.1);padding:8px 10px}
    .sau-tool-params{display:flex;flex-wrap:wrap;gap:3px;margin-top:3px}
    .sau-tool-result{margin-top:6px;padding:8px;background:rgba(255,255,255,0.03);border-radius:6px;font-size:12px;max-height:120px;overflow-y:auto;white-space:pre-wrap;word-break:break-word;color:var(--paper2)}
    .sau-tool-chevron{transition:transform .2s}

    /* 主动建议横幅 */
    .sau-proactive-banner{box-shadow:0 2px 12px rgba(0,0,0,0.3)}
    .sau-banner-action{transition:all .15s}
    .sau-banner-action:hover{filter:brightness(1.3)}

    /* 全局状态栏 */
    .sau-status-bar{pointer-events:none}
    .sau-status-bar > div{pointer-events:auto}
    .sau-mode-chip{transition:all .15s}
    .sau-kb-indicator{display:flex;align-items:center;gap:3px}
    .sau-kb-dot{width:6px;height:6px;border-radius:50%;display:inline-block}

    /* 兼容原有 .msg 样式 */
    .msg.sau-ai .b{background:transparent !important;border:none !important;padding:0 !important}

    /* 响应式 */
    @media(max-width:360px){
      .sau-bubble{padding:8px 10px;font-size:12px}
      .sau-thinking-steps{margin-left:8px;padding-left:4px}
      .sau-proactive-banner{font-size:10px;padding:6px 10px}
    }

    /* 下滑动画 */
    @keyframes sau-slide-down{from{transform:translateY(-100%);opacity:0}to{transform:translateY(0);opacity:1}}
  `;
  document.head.appendChild(style);
}

// ─── 全局交互函数（HTML onclick 调用）───────────────────────────
function sauToggleThinkStep(header) {
  try {
    const body = header.nextElementSibling;
    const chevron = header.querySelector('.sau-think-chevron');
    if (!body) return;
    const isHidden = body.style.display === 'none';
    body.style.display = isHidden ? 'block' : 'none';
    if (chevron) chevron.style.transform = isHidden ? 'rotate(90deg)' : 'rotate(0deg)';
  } catch (e) {}
}

function sauToggleThinkPanel(panelId) {
  try {
    const panel = document.getElementById(panelId);
    if (!panel) return;
    const steps = panel.querySelector('.sau-thinking-steps');
    const chevron = panel.querySelector('.sau-think-chevron-main');
    if (!steps) return;
    const isHidden = steps.style.display === 'none';
    steps.style.display = isHidden ? 'block' : 'none';
    if (chevron) chevron.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
  } catch (e) {}
}

function sauToggleToolCard(cardId) {
  try {
    const card = document.getElementById(cardId);
    if (!card) return;
    const body = card.querySelector('.sau-tool-card-body');
    const chevron = card.querySelector('.sau-tool-chevron');
    if (!body) return;
    const isHidden = body.style.display === 'none';
    body.style.display = isHidden ? 'block' : 'none';
    if (chevron) chevron.style.transform = isHidden ? 'rotate(90deg)' : 'rotate(0deg)';
  } catch (e) {}
}

function sauAskGuiding(btn) {
  try {
    const text = btn.textContent.replace(/[？?]$/, '').trim();
    if (text && typeof processAnswer === 'function') {
      addUser(text);
      processAnswer(text);
    }
  } catch (e) {}
}

// ─── 导出 ──────────────────────────────────────────────────────
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SuperAgentUI,
    renderBubble,
    renderThinkingPanel,
    renderToolCallCard,
    renderProactiveBanner,
    renderStatusBar,
    streamText,
    wrapExistingBubbles,
    MSG_TYPES,
    TOOL_ICON_MAP,
    _injectSuperAgentStyles,
  };
}
