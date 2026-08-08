/**
 * R478-B: 自适应渲染引擎
 * 功能：专业度适配 + 多模态输出格式化 + 主动建议卡 + 对话流控制
 */

// ─── 专业度适配 ──────────────────────────────────────────────
const EXPERTISE_STYLE = {
  novice: {
    label: '入门',
    prefix: '📖 通俗版',
    explanations: true,
    terminology: 'minimal',
    tone: 'friendly',
    steps: true,
    askGuidingQuestions: true,
  },
  intermediate: {
    label: '进阶',
    prefix: '📘 标准版',
    explanations: true,
    terminology: 'standard',
    tone: 'neutral',
    steps: false,
    askGuidingQuestions: false,
  },
  expert: {
    label: '专业',
    prefix: '📕 专业版',
    explanations: false,
    terminology: 'full',
    tone: 'academic',
    steps: false,
    askGuidingQuestions: false,
  },
};

/**
 * renderByExpertise({content, userExpertise, maxDepth})
 * 根据用户专业度水平返回适配后的 HTML 内容
 */
function renderByExpertise({ content, userExpertise = 'intermediate', maxDepth = 3 }) {
  try {
    if (!content || typeof content !== 'string') return '<div class="ar-empty">暂无内容</div>';

    const style = EXPERTISE_STYLE[userExpertise] || EXPERTISE_STYLE.intermediate;
    const lines = content.split('\n').filter(l => l.trim());
    let html = '';
    let depth = 0;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      // 标题层级
      if (line.startsWith('### ')) {
        depth = Math.min(depth + 1, maxDepth);
        const title = line.slice(4);
        if (userExpertise === 'novice' && style.explanations) {
          html += `<div class="ar-section"><div class="ar-section-title">${esc(title)}</div>`;
          html += `<div class="ar-hint" style="font-size:12px;color:var(--paper3);opacity:.8">← 本节内容已为您简化说明</div></div>`;
        } else if (userExpertise === 'expert') {
          html += `<div class="ar-section"><div class="ar-section-title ar-expert">${esc(title)}</div>`;
        } else {
          html += `<div class="ar-section"><div class="ar-section-title">${esc(title)}</div>`;
        }
        continue;
      }

      // 列表项
      if (line.startsWith('- ') || line.startsWith('· ')) {
        const item = line.slice(2);
        if (userExpertise === 'novice') {
          html += `<div class="ar-item"><span class="ar-bullet">○</span><span class="ar-text">${_simplifyText(item, userExpertise)}</span></div>`;
        } else {
          html += `<div class="ar-item"><span class="ar-bullet">·</span><span class="ar-text">${esc(item)}</span></div>`;
        }
        continue;
      }

      // 普通段落
      if (userExpertise === 'novice') {
        html += `<div class="ar-paragraph ar-novice">${_simplifyText(line, userExpertise)}</div>`;
      } else if (userExpertise === 'expert') {
        html += `<div class="ar-paragraph ar-expert">${esc(line)}</div>`;
      } else {
        html += `<div class="ar-paragraph">${esc(line)}</div>`;
      }
    }

    // 专业度标签
    html = `<div class="ar-header"><span class="ar-expertise-badge">${style.prefix}</span><span class="ar-expertise-label">${style.label}</span></div>` + html;

    // 新手模式添加引导问题
    if (userExpertise === 'novice' && style.askGuidingQuestions) {
      html += _renderGuidingQuestions(content);
    }

    return html;
  } catch (e) {
    return '<div class="ar-fallback">' + esc(content || '内容加载失败') + '</div>';
  }
}

function _simplifyText(text, level) {
  try {
    let t = esc(text);
    // 术语注释映射（可扩展）
    const glossary = {
      '五行': '五行（金木水火土，古人用来理解世界的基本元素）',
      '八字': '八字（根据出生时间排出的四柱干支，共八个字）',
      '十神': '十神（八字中分析人际关系与性格的十个角色）',
      '纳音': '纳音（六十甲子配属的音律属性，用于五行细化）',
      '大运': '大运（人生不同阶段的运势周期，通常每十年一换）',
      '流年': '流年（当年运势，随年份变化）',
      '藏干': '藏干（地支中隐藏的天干，如同冰山一角）',
      '天干': '天干（甲乙丙丁戊己庚辛壬癸，共十个）',
      '地支': '地支（子丑寅卯辰巳午未申酉戌亥，共十二个）',
      '食神': '食神（十神之一，代表才华、表达与福气）',
      '伤官': '伤官（十神之一，代表创造力与叛逆）',
      '正财': '正财（十神之一，代表正当收入与稳定财富）',
      '偏财': '偏财（十神之一，代表意外之财与风险收益）',
      '正官': '正官（十神之一，代表事业、规则与社会地位）',
      '七杀': '七杀（十神之一，代表魄力、竞争与压力）',
      '正印': '正印（十神之一，代表学识、证书与贵人）',
      '偏印': '偏印（十神之一，代表偏门学识与独特才华）',
      '比肩': '比肩（十神之一，代表同辈、朋友与竞争）',
      '劫财': '劫财（十神之一，代表争夺、损耗与冲动）',
      '食伤': '食伤（食神+伤官的合称）',
      '财星': '财星（正财+偏财的合称）',
      '官杀': '官杀（正官+七杀的合称）',
      '印星': '印星（正印+偏印的合称）',
      '比劫': '比劫（比肩+劫财的合称）',
      '身强': '身强（日主能量充足）',
      '身弱': '身弱（日主能量不足）',
      '格局': '格局（八字的整体结构特征）',
      '用神': '用神（对命局最有利的五行）',
      '喜神': '喜神（辅助用神、锦上添花的五行）',
      '忌神': '忌神（对命局不利的五行）',
      '仇神': '仇神（克制用神的五行）',
      '闲神': '闲神（对命局影响较小的五行）',
      '日主': '日主（八字中的"我"，代表命主本人）',
      '日干': '日干（与日主相同，出生日的天干）',
      '时柱': '时柱（出生时间的天干地支，共两个字）',
      '年柱': '年柱（出生年份的天干地支，共两个字）',
      '月柱': '月柱（出生月份的天干地支，共两个字）',
      '日柱': '日柱（出生日期的天干地支，共两个字）',
      '子平': '子平（徐子平，八字学派的代表人物）',
      '四柱': '四柱（年柱、月柱、日柱、时柱，共四组干支）',
    };

    for (const [term, explain] of Object.entries(glossary)) {
      if (t.includes(term)) {
        t = t.replace(new RegExp(escRegExp(term), 'g'), `<abbr title="${esc(explain)}" class="ar-term">${esc(term)}</abbr>`);
      }
    }
    return t;
  } catch (e) {
    return esc(text);
  }
}

function _renderGuidingQuestions(content) {
  const questions = [
    '能再解释一下这个概念吗？',
    '这对我意味着什么？',
    '我该注意什么？',
  ];
  const btns = questions.map(q =>
    `<button class="ar-guide-btn" onclick="sauAskGuiding(this)">${esc(q)}</button>`
  ).join('');
  return `<div class="ar-guiding"><div class="ar-guiding-title">💡 您可能想问：</div><div class="ar-guiding-btns">${btns}</div></div>`;
}

function escRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ─── 多模态输出格式化 ──────────────────────────────────────────
const FORMAT_PRESETS = {
  text: { name: '纯文本', style: 'plain', wrap: false },
  markdown: { name: 'Markdown', style: 'md', wrap: true },
  rich: { name: '富文本卡片', style: 'card', wrap: true },
  visual: { name: '可视化', style: 'visual', wrap: true },
};

const CONTENT_TYPE_HINT = {
  bazi: 'visual',
  qimen: 'visual',
  ziwei: 'visual',
  fengshui: 'rich',
  tcm: 'rich',
  zhongyi: 'rich',
  calendar: 'rich',
  meihua: 'rich',
  liuyao: 'rich',
  liuren: 'rich',
  wuxing: 'visual',
  default: 'rich',
};

/**
 * formatOutput({content, format, contentType, userExpertise})
 * 自动或手动选择输出格式
 */
function formatOutput({ content, format, contentType = 'default', userExpertise = 'intermediate' }) {
  try {
    if (!content) return '';

    const targetFormat = format || CONTENT_TYPE_HINT[contentType] || CONTENT_TYPE_HINT.default || 'rich';
    const preset = FORMAT_PRESETS[targetFormat] || FORMAT_PRESETS.rich;

    switch (preset.style) {
      case 'plain':
        return String(content);
      case 'md':
        return _formatMarkdown(content);
      case 'card':
        return _formatRichCard(content, userExpertise);
      case 'visual':
        return _formatVisual(content, contentType, userExpertise);
      default:
        return _formatRichCard(content, userExpertise);
    }
  } catch (e) {
    return esc(content || '');
  }
}

function _formatMarkdown(text) {
  let md = esc(text);
  // 简易 markdown → HTML
  md = md.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  md = md.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  md = md.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  md = md.replace(/^\- (.+)$/gm, '<li>$1</li>');
  md = md.replace(/^\* (.+)$/gm, '<li>$1</li>');
  md = md.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  md = md.replace(/\*(.+?)\*/g, '<em>$1</em>');
  md = md.replace(/`(.+?)`/g, '<code>$1</code>');
  // 连续 li → ul
  md = md.replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`);
  return `<div class="ar-md-output">${md}</div>`;
}

function _formatRichCard(text, expertise) {
  const rendered = renderByExpertise({ content: text, userExpertise: expertise });
  return `<div class="ar-rich-card"><div class="ar-rich-header"><span class="ar-rich-icon">📜</span><span class="ar-rich-title">命理解读</span></div><div class="ar-rich-body">${rendered}</div></div>`;
}

function _formatVisual(text, contentType, expertise) {
  const id = 'ar-visual-' + Date.now();
  const rendered = renderByExpertise({ content: text, userExpertise: expertise });
  return `<div class="ar-visual-card" id="${id}">
    <div class="ar-visual-header"><span class="ar-visual-icon">📊</span><span class="ar-visual-title">可视化分析</span></div>
    <div class="ar-visual-body">
      <div class="ar-visual-text">${rendered}</div>
      <canvas class="ar-visual-canvas" width="280" height="180"></canvas>
    </div>
  </div>`;
}

// ─── 主动建议卡 ────────────────────────────────────────────────
const CARD_ICONS = {
  reminder: '⏰',
  suggestion: '💡',
  tip: '🌟',
  alert: '⚠️',
  seasonal: '🌸',
  health: '🌿',
};

const CARD_COLORS = {
  reminder: { bg: 'rgba(201,168,76,0.08)', border: 'rgba(201,168,76,0.3)', accent: '#c9a84c' },
  suggestion: { bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.3)', accent: '#a78bfa' },
  tip: { bg: 'rgba(6,182,212,0.08)', border: 'rgba(6,182,212,0.3)', accent: '#22d3ee' },
  alert: { bg: 'rgba(244,67,54,0.08)', border: 'rgba(244,67,54,0.3)', accent: '#f44336' },
  seasonal: { bg: 'rgba(236,72,153,0.08)', border: 'rgba(236,72,153,0.3)', accent: '#ec4899' },
  health: { bg: 'rgba(39,174,96,0.08)', border: 'rgba(39,174,96,0.3)', accent: '#27ae60' },
};

/**
 * renderProactiveCard({type, title, body, action, dismissible})
 * 渲染玻璃拟态主动建议卡
 */
function renderProactiveCard({ type = 'tip', title = '', body = '', action = null, dismissible = true }) {
  try {
    const icon = CARD_ICONS[type] || CARD_ICONS.tip;
    const colors = CARD_COLORS[type] || CARD_COLORS.tip;
    const id = 'ar-card-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);

    let html = `<div class="ar-proactive-card" id="${id}" style="background:${colors.bg};border:1px solid ${colors.border}">`;
    html += `<div class="ar-card-glow" style="background:radial-gradient(ellipse at 30% 20%,${colors.accent}15,transparent 70%)"></div>`;
    html += `<div class="ar-card-content">`;
    html += `<div class="ar-card-row">`;
    html += `<span class="ar-card-icon">${icon}</span>`;
    html += `<span class="ar-card-title" style="color:${colors.accent}">${esc(title)}</span>`;
    if (dismissible) {
      html += `<button class="ar-card-dismiss" onclick="document.getElementById('${id}').remove()" aria-label="关闭建议">✕</button>`;
    }
    html += `</div>`;
    if (body) {
      html += `<div class="ar-card-body">${esc(body)}</div>`;
    }
    if (action) {
      html += `<button class="ar-card-action" style="background:${colors.accent}20;color:${colors.accent};border:1px solid ${colors.border}" onclick="${action.onClick || ''}">${esc(action.label || '查看')}</button>`;
    }
    html += `</div></div>`;
    return html;
  } catch (e) {
    return `<div class="ar-card-fallback">${esc(title)}: ${esc(body)}</div>`;
  }
}

// ─── 对话流控制 ─────────────────────────────────────────────────
const FLOW_STATES = {
  idle: { label: '空闲', icon: '💤', color: '#888' },
  listening: { label: '聆听中', icon: '🎤', color: '#22d3ee' },
  thinking: { label: '思考中', icon: '💭', color: '#a78bfa' },
  responding: { label: '回复中', icon: '✍️', color: '#c9a84c' },
  awaiting_input: { label: '等待回复', icon: '⏳', color: '#e8cc7a' },
  clarifying: { label: '澄清中', icon: '🤔', color: '#f59e0b' },
};

const FLOW_TRANSITIONS = {
  idle: ['listening', 'clarifying'],
  listening: ['thinking'],
  thinking: ['responding', 'clarifying'],
  responding: ['awaiting_input', 'idle'],
  awaiting_input: ['listening', 'idle'],
  clarifying: ['listening', 'thinking', 'idle'],
};

class ConversationFlow {
  constructor() {
    this._state = 'idle';
    this._listeners = [];
    this._history = [];
    this._timestamp = Date.now();
  }

  get state() { return this._state; }

  transition(target) {
    const allowed = FLOW_TRANSITIONS[this._state] || [];
    if (!allowed.includes(target)) {
      console.warn(`[ConversationFlow] 非法转换: ${this._state} → ${target}，允许: ${allowed.join(',')}`);
      return false;
    }
    const prev = this._state;
    this._state = target;
    this._timestamp = Date.now();
    this._history.push({ from: prev, to: target, ts: this._timestamp });
    if (this._history.length > 50) this._history.shift();
    this._listeners.forEach(fn => { try { fn(target, prev); } catch (e) {} });
    return true;
  }

  forceState(target) {
    const prev = this._state;
    this._state = target;
    this._timestamp = Date.now();
    this._listeners.forEach(fn => { try { fn(target, prev); } catch (e) {} });
    return true;
  }

  subscribe(fn) {
    this._listeners.push(fn);
    return () => { this._listeners = this._listeners.filter(f => f !== fn); };
  }

  getInfo() {
    const s = FLOW_STATES[this._state] || FLOW_STATES.idle;
    return { state: this._state, label: s.label, icon: s.icon, color: s.color, timestamp: this._timestamp };
  }

  reset() {
    this.forceState('idle');
    this._history = [];
  }
}

// ─── 工具函数 ──────────────────────────────────────────────────
function esc(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// 全局导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    AdaptiveRenderer: { renderByExpertise, formatOutput, renderProactiveCard },
    ConversationFlow,
    FORMAT_PRESETS,
    FLOW_STATES,
    EXPERTISE_STYLE,
  };
}
