/**
 * 命理宝鉴·医道 · 脉诊引擎 v1.0
 * 28 脉分类 + KB 模式匹配 + 寸关尺定位
 */
const PULSE_KB = {
  // 28 脉
  pulses: {
    '浮':{pos:'浅',force:'轻取即得·重按反减',scene:'表证',tongue:'薄白苔',related:['风寒','风热','表虚']},
    '沉':{pos:'深',force:'重按始得·轻取不得',scene:'里证',tongue:'厚苔',related:['里实','里虚','阳虚']},
    '迟':{rate:1,rateText:'一息四至以下',scene:'寒证',related:['寒湿','阳虚','阴盛']},
    '数':{rate:1,rateText:'一息五至以上',scene:'热证',related:['实热','虚热','阴虚']},
    '虚':{force:'举按无力',scene:'气血两虚',related:['气虚','血虚','脏腑虚']},
    '实':{force:'举按皆有力',scene:'邪盛',related:['实热','瘀血','痰饮']},
    '滑':{shape:'圆滑·如珠走盘',scene:'痰·食·孕',related:['痰湿','食积','妊娠']},
    '涩':{shape:'如刀刮竹',scene:'血瘀·精伤',related:['血瘀','血虚','气滞']},
    '弦':{shape:'如按琴弦',scene:'肝胆病·痛·痰饮',related:['肝郁','肝阳上亢','痛证']},
    '紧':{shape:'如绳转索',scene:'寒·痛',related:['寒邪','痛证']},
    '缓':{rate:1,rateText:'一息四至·从容和缓',scene:'常人·湿病',related:['常人','湿困']},
    '洪':{shape:'如波涛汹涌',scene:'热盛',related:['实热','阳明经热']},
    '细':{shape:'如线·应指明显',scene:'气血两虚·诸虚劳损',related:['血虚','阴虚','气虚']},
    '微':{shape:'极细极软',scene:'阴阳气血诸虚',related:['阳脱','阴脱']},
    '弱':{shape:'极软·沉细',scene:'气血不足',related:['气虚','血虚']},
    '濡':{shape:'浮细软',scene:'虚证·湿证',related:['虚证','湿困']},
    '散':{shape:'浮散无根',scene:'元气离散',related:['脱证']},
    '芤':{shape:'浮大中空',scene:'失血·伤津',related:['失血','伤阴']},
    '革':{shape:'浮而搏指·中空外坚',scene:'亡血·失精',related:['失血']},
    '牢':{shape:'沉·实·大·弦·长',scene:'阴寒内实',related:['寒实','癥瘕']},
    '伏':{pos:'更深·重按推筋着骨始得',scene:'厥证·邪闭',related:['厥证','痛极']},
    '动':{shape:'滑数·仅见于关部',scene:'痛·惊',related:['痛证','惊恐','妊娠']},
    '促':{rate:1,rateText:'数而时一止·止无定数',scene:'阳盛实热·气血瘀滞',related:['热盛','瘀滞']},
    '结':{rate:1,rateText:'缓而时一止·止无定数',scene:'阴盛气结',related:['气结','寒痰']},
    '代':{rate:1,rateText:'止有定数',scene:'脏气衰微',related:['脏衰','心悸']},
    '疾':{rate:1,rateText:'一息七至以上',scene:'阳极阴竭',related:['亡阳','亡阴']},
    '长':{shape:'首尾端直·超过本位',scene:'阳证·热证·实证',related:['实热']},
    '短':{shape:'首尾俱短·不及本位',scene:'气病',related:['气虚','气郁']}
  },
  // 寸关尺定位
  positions: {
    '寸':{organ:'心·肺',left:'心·心包',right:'肺·胸中'},
    '关':{organ:'肝·胆·脾·胃',left:'肝·胆',right:'脾·胃'},
    '尺':{organ:'肾·膀胱·大小肠',left:'肾·膀胱',right:'肾·命门·大肠'}
  }
};

/**
 * 分析脉象
 * @param {object} input { pulses: ['弦','细'], cun:弦, guan:细, chi:弱, ... }
 */
function analyzePulse(input) {
  const pulses = Array.isArray(input.pulses) ? input.pulses : (input.pulses ? [input.pulses] : []);
  const positions = input.positions || {};
  const findings = [];
  const syndromes = new Set();
  const herbs = new Set();
  
  for (const p of pulses) {
    const data = PULSE_KB.pulses[p];
    if (!data) continue;
    findings.push({ pulse: p, ...data });
    if (data.related) data.related.forEach(s => syndromes.add(s));
  }
  
  // 寸关尺分析
  const posAnalysis = {};
  for (const [pos, pulse] of Object.entries(positions)) {
    const data = PULSE_KB.pulses[pulse];
    if (data) posAnalysis[pos] = { pulse, organ: PULSE_KB.positions[pos]?.organ || '?', related: data.related || [] };
  }
  
  // 推断证型
  const syndromeList = [...syndromes];
  const recommendedHerbs = recommendHerbsByPulse(pulses);
  
  return {
    ok: true,
    pulses: findings,
    positions: posAnalysis,
    likely_syndromes: syndromeList.slice(0, 5),
    recommended_herbs: recommendedHerbs,
    summary: summarize(pulses, syndromeList),
    timestamp: new Date().toISOString()
  };
}

function recommendHerbsByPulse(pulses) {
  const map = {
    '浮':['麻黄','桂枝','荆芥'],'沉':['附子','干姜','肉桂'],
    '迟':['附子','干姜','肉桂'],'数':['黄连','黄芩','栀子'],
    '虚':['人参','黄芪','党参'],'实':['大黄','芒硝','枳实'],
    '滑':['半夏','茯苓','陈皮'],'涩':['丹参','桃仁','红花'],
    '弦':['柴胡','白芍','香附'],'紧':['麻黄','桂枝','细辛'],
    '细':['当归','熟地','白芍'],'弱':['人参','黄芪','白术'],
    '洪':['石膏','知母','栀子'],'微':['人参','附子','麦冬']
  };
  const set = new Set();
  pulses.forEach(p => { (map[p] || []).forEach(h => set.add(h)); });
  return [...set].slice(0, 6);
}

function summarize(pulses, syndromes) {
  if (!pulses.length) return '脉象输入为空';
  const ps = pulses.join('·');
  const ss = syndromes.slice(0, 3).join('/');
  return `脉${ps}，考虑${ss}`;
}

module.exports = { PULSE_KB, analyzePulse };
