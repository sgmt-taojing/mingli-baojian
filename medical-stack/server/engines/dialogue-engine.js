/**
 * 命理宝鉴·医道 · 多轮辨证对话引擎 v1.0
 * 症状→追问→收窄证型
 */
const QUESTIONS = {
  // 寒热
  'aversion': {
    question: '怕冷还是怕热？',
    options: [
      { label: '怕冷', next: 'cold_or_fever' },
      { label: '怕热', next: 'fever' },
      { label: '不怕冷也不怕热', next: 'normal_temp' }
    ]
  },
  // 汗
  'sweat': {
    question: '出汗情况？',
    options: [
      { label: '自汗（不活动也出汗）', syndrome_hint: '气虚' },
      { label: '盗汗（睡中出汗）', syndrome_hint: '阴虚' },
      { label: '无汗', syndrome_hint: '表实' },
      { label: '正常', syndrome_hint: null }
    ]
  },
  // 二便
  'bowel': {
    question: '大便情况？',
    options: [
      { label: '便秘·干结', syndrome_hint: '热·阴虚·气滞' },
      { label: '溏泄·不成形', syndrome_hint: '脾虚·湿' },
      { label: '正常', syndrome_hint: null }
    ]
  },
  // 睡眠
  'sleep': {
    question: '睡眠情况？',
    options: [
      { label: '难入睡', syndrome_hint: '心肝火旺' },
      { label: '易醒', syndrome_hint: '心脾两虚' },
      { label: '多梦', syndrome_hint: '胆郁痰扰' },
      { label: '正常', syndrome_hint: null }
    ]
  },
  // 情绪
  'emotion': {
    question: '最近情绪？',
    options: [
      { label: '烦躁易怒', syndrome_hint: '肝郁化火' },
      { label: '低落抑郁', syndrome_hint: '肝郁' },
      { label: '正常', syndrome_hint: null }
    ]
  },
  // 饮食
  'diet': {
    question: '食欲和口味？',
    options: [
      { label: '纳呆·不思饮食', syndrome_hint: '脾虚' },
      { label: '口苦', syndrome_hint: '肝胆湿热' },
      { label: '口甜', syndrome_hint: '脾胃湿热' },
      { label: '正常', syndrome_hint: null }
    ]
  }
};

const DIALOGUE_TREE = {
  start: { question: '主诉是什么？', next: 'aversion' },
  cold_or_fever: { question: '哪里疼痛？', options: [
    { label: '头痛', next: 'sweat' },
    { label: '身痛', next: 'sweat' },
    { label: '关节痛', next: 'sweat' }
  ]},
  fever: { question: '是否口渴？', options: [
    { label: '口渴喜冷饮', syndrome_hint: '实热' },
    { label: '口渴不欲饮', syndrome_hint: '湿热' }
  ]},
  normal_temp: 'sleep'
};

const sessionStore = new Map();

function startDialogue(sessionId, complaint) {
  const session = {
    id: sessionId,
    complaint,
    history: [],
    syndrome_scores: {},
    step: 'aversion',
    startedAt: new Date().toISOString()
  };
  sessionStore.set(sessionId, session);
  return getCurrentQuestion(session);
}

function replyDialogue(sessionId, answer) {
  const session = sessionStore.get(sessionId);
  if (!session) return { error: '会话已过期' };
  session.history.push({ step: session.step, answer });
  
  // 累加证型分数
  const q = QUESTIONS[session.step];
  if (q) {
    const opt = (q.options || []).find(o => o.label === answer);
    if (opt && opt.syndrome_hint) {
      const syndromes = opt.syndrome_hint.split(/[·,]/).map(s=>s.trim());
      syndromes.forEach(s => { session.syndrome_scores[s] = (session.syndrome_scores[s] || 0) + 1; });
    }
  }
  
  // 下一步
  let next = null;
  if (q && q.options) {
    const opt = (q.options || []).find(o => o.label === answer);
    next = opt ? opt.next : null;
  }
  if (!next && DIALOGUE_TREE[session.step]) {
    const tree=DIALOGUE_TREE[session.step];
    if(typeof tree==='string'){next=tree;}
    else if(tree.options){const opt=tree.options.find(o=>o.label===answer);if(opt&&opt.next)next=opt.next;}
  }
  
  if (!next) {
    // 对话结束
    return concludeDialogue(session);
  }
  session.step = next;
  return getCurrentQuestion(session);
}

function getCurrentQuestion(session) {
  const q = QUESTIONS[session.step];
  if (q) return { ok: true, step: session.step, question: q.question, options: q.options || [], sessionId: session.id, history: session.history };
  const t = DIALOGUE_TREE[session.step];
  if (typeof t==='string') return getCurrentQuestion(Object.assign({},session,{step:t}));
  if (t && t.question) return { ok: true, step: session.step, question: t.question, options: t.options||[], sessionId: session.id, history: session.history };
  return concludeDialogue(session);
}

function concludeDialogue(session) {
  const sorted = Object.entries(session.syndrome_scores).sort((a,b) => b[1] - a[1]);
  return {
    ok: true,
    done: true,
    sessionId: session.id,
    final_syndromes: sorted.slice(0, 3).map(([s,c])=>({syndrome:s,score:c})),
    confidence: sorted.length ? (sorted[0][1] / session.history.length) : 0,
    total_steps: session.history.length,
    summary: sorted.length ? `主诉「${session.complaint}」+ ${session.history.length} 轮追问 → 首选证型：${sorted[0][0]}` : '信息不足'
  };
}

module.exports = { startDialogue, replyDialogue, QUESTIONS };
