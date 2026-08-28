
/* ===================================================================
 * 核心知识库：14 主星 × 宫位 × 疾病 × 脏腑 映射表
 * 来源：传统紫微古籍 + 路总实战心法 + 倪海厦中医基础 + 八字五行
 * =================================================================== */
const ZIWEI_DISEASE = {
  '紫微': {
    organ: '心脏·脑',
    direction: '头部正中',
    severity: '中',
    disease: [
      { name: '心脏肥大', probability: '中' },
      { name: '脑部肿瘤（罕见）', probability: '极低' },
      { name: '高血压', probability: '中高' },
      { name: '眩晕', probability: '中' }
    ],
    risk_signals: ['化忌+火星/铃星', '与七杀同宫', '行至疾厄宫大限'],
    early_signs: ['头痛', '眩晕', '心悸', '失眠', '面部潮红'],
    fruit: '心脑血管系统',
    tcm: '天王补心丹 / 安神补心丸',
    rule: '紫微主贵不主富，主心脑系统。化忌+煞忌冲疾厄，需防心梗。'
  },
  '天机': {
    organ: '肝胆·神经系统',
    direction: '身体左侧',
    severity: '高',
    disease: [
      { name: '肝胆结石/炎症', probability: '高' },
      { name: '神经衰弱', probability: '高' },
      { name: '肝气郁结', probability: '极高' },
      { name: '偏头痛', probability: '高' },
      { name: '颈椎病', probability: '中' }
    ],
    risk_signals: ['化忌', '+擎羊（肝胆重伤）', '陷地', '+火星/铃星', '行至疾厄宫'],
    early_signs: ['胁肋胀痛', '头晕眼花', '易怒', '口苦', '指甲异常', '抽筋'],
    fruit: '肝胆经+神经系统',
    tcm: '逍遥散 / 柴胡疏肝散 / 龙胆泻肝汤',
    rule: '★KEY：天机化忌+擎羊=肝胆系统危重，44岁行至疾厄宫大限需高度重视——路总实战核心案例',
    keyCase: 'KB-shuhan-00627'
  },
  '太阳': {
    organ: '心脏·眼',
    direction: '头部',
    severity: '中',
    disease: [
      { name: '心脏病', probability: '中' },
      { name: '眼部疾病', probability: '高' },
      { name: '高血压', probability: '高' },
      { name: '中风先兆', probability: '中' },
      { name: '头疼', probability: '中' }
    ],
    risk_signals: ['落陷', '+陀罗（眼疾/中风）', '化忌+火星'],
    early_signs: ['头痛', '眼红', '面赤', '烦躁', '失眠'],
    fruit: '心血管+眼睛',
    tcm: '天麻钩藤饮 / 杞菊地黄丸',
    rule: '太阳主心火+目。陷地太阳+煞，必防心脑卒中。'
  },
  '武曲': {
    organ: '肺·大肠·呼吸',
    direction: '胸部',
    severity: '高',
    disease: [
      { name: '肺病', probability: '高' },
      { name: '大肠癌', probability: '中' },
      { name: '哮喘', probability: '中' },
      { name: '金属利器伤', probability: '中' },
      { name: '牙周病', probability: '中' }
    ],
    risk_signals: ['化忌', '+擎羊+火星（金刃煞）', '陷地'],
    early_signs: ['咳嗽', '胸闷', '气短', '便秘', '牙痛', '咯血'],
    fruit: '肺+大肠+骨骼',
    tcm: '百合固金汤 / 麦冬汤',
    rule: '武曲主金，主肺+大肠+骨骼。化忌+煞+陷地，肺部重症。'
  },
  '天同': {
    organ: '脾胃·消化',
    direction: '腹部',
    severity: '中低',
    disease: [
      { name: '脾胃虚弱', probability: '高' },
      { name: '糖尿病倾向', probability: '中' },
      { name: '水肿', probability: '中' },
      { name: '湿气重', probability: '高' }
    ],
    risk_signals: ['化忌+煞', '陷地'],
    early_signs: ['腹胀', '纳差', '倦怠', '便溏', '面色萎黄'],
    fruit: '脾胃+消化',
    tcm: '参苓白术散 / 补中益气汤',
    rule: '天同为福星，主脾胃。化忌则消化系统弱，但寿元较长（福星本质）。'
  },
  '廉贞': {
    organ: '心脏·血液',
    direction: '胸部正中',
    severity: '极高',
    disease: [
      { name: '血癌/白血病', probability: '中' },
      { name: '心肌梗塞', probability: '高' },
      { name: '中风', probability: '高' },
      { name: '心律失常', probability: '高' },
      { name: '桃花症（性传播）', probability: '中' }
    ],
    risk_signals: ['陷地', '+擎羊', '+火星（廉贞化忌）', '化忌+煞同宫', '与七杀同宫=「廉杀」格'],
    early_signs: ['胸痛', '心悸', '头晕', '肢体麻木', '皮下出血', '尿血'],
    fruit: '心脏+血液+免疫',
    tcm: '血府逐瘀汤 / 天王补心丹 / 犀角地黄汤',
    rule: '★KEY：廉贞为"血"，化忌+煞直断重症。与七杀同宫「廉杀」需防心梗/血癌。'
  },
  '天府': {
    organ: '脾胃·胆',
    direction: '右上腹',
    severity: '低',
    disease: [
      { name: '糖尿病', probability: '中' },
      { name: '胆囊疾病', probability: '中' },
      { name: '胃肠功能紊乱', probability: '中' }
    ],
    risk_signals: ['化忌+煞'],
    early_signs: ['口苦', '腹胀', '便溏', '体倦'],
    fruit: '脾胃+胆',
    tcm: '香砂六君子汤 / 温胆汤',
    rule: '天府为库，主脾胃胆。庙旺寿元稳定；陷地+化忌则糖尿病风险。'
  },
  '太阴': {
    organ: '肾·泌尿·生殖',
    direction: '腰部',
    severity: '中',
    disease: [
      { name: '肾虚', probability: '高' },
      { name: '泌尿系统感染', probability: '中' },
      { name: '生殖系统', probability: '中' },
      { name: '糖尿病', probability: '中' },
      { name: '妇科病', probability: '中' }
    ],
    risk_signals: ['落陷', '+擎羊+铃星', '化忌'],
    early_signs: ['腰膝酸软', '尿频', '耳鸣', '白带异常', '畏寒'],
    fruit: '肾+泌尿+生殖',
    tcm: '六味地黄丸 / 金匮肾气丸 / 左归丸',
    rule: '太阴主阴水，主肾+泌尿+生殖。陷地则有妇科/男科问题。'
  },
  '贪狼': {
    organ: '肝·性腺',
    direction: '胁下',
    severity: '中',
    disease: [
      { name: '肝火旺', probability: '高' },
      { name: '性功能障碍', probability: '中' },
      { name: '酒精肝', probability: '中' },
      { name: '肝硬化', probability: '低' }
    ],
    risk_signals: ['化忌+煞', '+羊陀'],
    early_signs: ['易怒', '口苦', '面红', '眼赤', '酒量变化'],
    fruit: '肝+性腺',
    tcm: '龙胆泻肝汤 / 柴胡清肝散',
    rule: '贪狼主桃花+肝。化忌+煞多应肝火旺或性功能障碍。'
  },
  '巨门': {
    organ: '口腔·消化',
    direction: '口咽',
    severity: '中',
    disease: [
      { name: '口腔溃疡', probability: '极高' },
      { name: '食道炎', probability: '中' },
      { name: '慢性胃炎', probability: '中' },
      { name: '鼻咽癌（罕见）', probability: '极低' },
      { name: '情志病/忧郁症', probability: '高' }
    ],
    risk_signals: ['化忌+煞', '+火星（口舌是非）'],
    early_signs: ['反复口腔溃疡', '口苦', '纳差', '情绪低落', '失眠'],
    fruit: '口腔+食道+情志',
    tcm: '导赤散 / 泻黄散 / 逍遥散',
    rule: '巨门主口舌，主消化上段+情志。化忌+火星必有慢性口腔问题；陷地需防情志病。'
  },
  '天相': {
    organ: '脾胃·肝',
    direction: '上腹',
    severity: '低中',
    disease: [
      { name: '肝胆失调', probability: '中' },
      { name: '消化问题', probability: '中' },
      { name: '脂肪肝', probability: '中' }
    ],
    risk_signals: ['化忌+煞'],
    early_signs: ['胁痛', '腹胀', '纳差'],
    fruit: '肝胆+脾胃',
    tcm: '柴胡疏肝散 / 逍遥散',
    rule: '天相主协调+印星，与天梁同多被动。化忌+煞主肝胆失调。'
  },
  '天梁': {
    organ: '脾胃·免疫',
    direction: '腹部',
    severity: '低（寿星）',
    disease: [
      { name: '脾胃虚', probability: '中' },
      { name: '老年慢性病', probability: '中' },
      { name: '免疫低下', probability: '中' }
    ],
    risk_signals: ['虽有化解之力，但老衰不可免'],
    early_signs: ['倦怠', '易感冒', '消化不良'],
    fruit: '脾胃+免疫',
    tcm: '补中益气汤 / 四君子汤',
    rule: '★天梁为寿星，主化解。与杀破狼组合多受冲击。在寅申为庙，能化解七杀。独坐命宫易孤独。'
  },
  '七杀': {
    organ: '肺·心脏·手术',
    direction: '胸背',
    severity: '高',
    disease: [
      { name: '肺病', probability: '高' },
      { name: '心脏病', probability: '高' },
      { name: '手术', probability: '极高' },
      { name: '意外血光', probability: '高' },
      { name: '中风先兆', probability: '中' }
    ],
    risk_signals: ['陷地', '+擎羊', '+火星铃星', '化忌', '行至疾厄宫'],
    early_signs: ['胸痛', '气短', '咯血', '肢体麻木'],
    fruit: '肺+心脏+外伤',
    tcm: '血府逐瘀汤 / 防风通圣散',
    rule: '★七杀为将星，主肃杀独断。子午卯酉仰斗为庙，入庙大将之材；陷地孤克。化忌+煞直断外科手术。'
  },
  '破军': {
    organ: '肾·泌尿·生殖',
    direction: '腰腹',
    severity: '中',
    disease: [
      { name: '肾虚', probability: '高' },
      { name: '泌尿感染', probability: '中' },
      { name: '生殖系统', probability: '中' },
      { name: '手术', probability: '中' }
    ],
    risk_signals: ['化忌+煞', '夫妻/子女宫化忌'],
    early_signs: ['腰膝酸软', '尿频', '性功能下降', '乏力'],
    fruit: '肾+泌尿+生殖',
    tcm: '六味地黄丸 / 五子衍宗丸',
    rule: '破军为耗星，主破坏重建。居寅申卯酉开榜为先天化格。夫妻、子女宫位不宜，配偶子女易离散或病。'
  }
};

/* 八字五行 × 中医五脏 */
const BAZI_ORGAN = {
  '木': { organ: '肝胆', emotion: '怒', season: '春', open: '目', tastes: '酸', color: '青' },
  '火': { organ: '心脏·小肠', emotion: '喜', season: '夏', open: '舌', tastes: '苦', color: '赤' },
  '土': { organ: '脾胃', emotion: '思', season: '长夏', open: '口', tastes: '甘', color: '黄' },
  '金': { organ: '肺·大肠', emotion: '悲', season: '秋', open: '鼻', tastes: '辛', color: '白' },
  '水': { organ: '肾·膀胱', emotion: '恐', season: '冬', open: '耳', tastes: '咸', color: '黑' }
};

/* 危重急救信号库 */
const EMERGENCY_SIGNALS = [
  {
    name: '★ 廉杀化忌·心梗血癌征兆',
    palace: '廉贞+七杀 同宫/对照',
    signals: ['胸痛+臂麻', '心悸+晕厥', '不明出血', '皮下瘀斑'],
    detail: '廉贞化忌+火星/铃星，与七杀同宫构「廉杀」格局，主心梗、血癌、白血病、严重外伤。倪师言"血癌非一日之寒，乃心火+瘀血日积"。',
    action: '院外立即拨打 120 / 院内启动急诊流程，做心电图+心肌酶+血常规+骨髓穿刺（疑似血癌）',
    level: '极高'
  },
  {
    name: '★ 天机化忌+擎羊·肝胆重症',
    palace: '天机+擎羊 疾厄宫/迁移宫',
    signals: ['胁痛拒按', '黄疸', '肝掌', '腹水'],
    detail: '天机化忌+擎羊为肝胆重伤信号。路总实战核心案例（KB-shuhan-00627）：七杀坐命+疾厄天机擎羊，44岁入疾厄宫大限化忌=肝胆系统重症。',
    action: '立即做肝胆B超+甲胎蛋白+肝功能+HBV-DNA，必要时CT/MRI',
    level: '极高'
  },
  {
    name: '★ 武曲化忌+火星·肺部重症',
    palace: '武曲+火星/铃星',
    signals: ['咳血', '胸痛', '呼吸困难', '消瘦'],
    detail: '武曲主金+肺，化忌+火星铃星直断肺部重症（肺癌、肺结核、哮喘重症）。倪师："金刃外伤、肺痨、咯血"皆武曲忌煞。',
    action: '立即肺部CT+痰检+支气管镜，禁烟禁酒',
    level: '极高'
  },
  {
    name: '★ 太阳化忌+陀罗·中风先兆',
    palace: '太阳落陷+陀罗',
    signals: ['突发头痛', '一侧无力', '口角歪斜', '言语不清'],
    detail: '太阳主心火+目，落陷+陀罗=中风先兆高危族群。倪师："火日飞霜，太阳见陀罗，主人中风、眼疾"。',
    action: '立即头CT/MRI，量血压，服降压药+阿司匹林',
    level: '极高'
  },
  {
    name: '紫微化忌+火星铃星·心脑卒中',
    palace: '紫微陷地+火铃',
    signals: ['剧烈头痛', '喷射性呕吐', '偏瘫', '失语'],
    detail: '紫微主心脑，陷地+火铃=心梗/脑卒中风险。',
    action: 'CT+心电图+颈动脉B超，三高药物控制',
    level: '高'
  },
  {
    name: '天同陷地化忌·糖尿病危象',
    palace: '天同陷地+化忌',
    signals: ['多饮多尿', '消瘦乏力', '酮症酸中毒', '糖尿病足'],
    detail: '天同主脾胃，陷地化忌主糖尿病+酮症酸中毒。',
    action: '测血糖+糖化血红蛋白+血酮，胰岛素治疗',
    level: '高'
  },
  {
    name: '太阴陷地+擎羊·肾衰竭',
    palace: '太阴+擎羊 疾厄宫',
    signals: ['尿少水肿', '腰痛', '泡沫尿', '高血压'],
    detail: '太阴主肾+泌尿，陷地+擎羊=肾结石、尿毒症、肾癌风险。',
    action: '肾功能+肾脏B超+尿检',
    level: '高'
  }
];

/* 大限·流年·行运风险叠加判定 */
const DAHAI_RISK = {
  '廉贞化忌': '心梗/血癌/中风',
  '武曲化忌': '肺部重症/外伤',
  '天同化忌': '糖尿病/消化重症',
  '太阳化忌': '心脑卒中',
  '太阴化忌': '肾虚/泌尿/妇科重症',
  '天机化忌': '肝胆重症/脑血管',
  '破军化忌': '肾/泌尿/外伤手术',
  '贪狼化忌': '肝/性腺',
  '紫微化忌': '心脑卒中',
  '天府化忌': '糖尿病',
  '巨门化忌': '口腔癌/食道癌',
  '天相化忌': '肝胆',
  '七杀化忌': '外伤/手术/中风',
  '天梁化忌': '脾胃/免疫'
};

/* 速选样本案例 */
const SAMPLE_CASES = [
  {
    name: '【案例 1】路总实战：肝胆重症',
    y: 1960, mo: 4, d: 8, h: 14,
    ming: '七杀', shen: '天机', jiyi: '天机+擎羊',
    symptoms: '胁痛拒按，黄疸',
    text: '44岁行至疾厄宫大限化忌，主肝胆重症。KB-shuhan-00627'
  },
  {
    name: '【案例 2】倪师断证：心脑血管',
    y: 1955, mo: 6, d: 12, h: 10,
    ming: '太阳', shen: '武曲', jiyi: '太阳+陀罗',
    symptoms: '胸闷心悸，头晕肢麻',
    text: '太阳陷地+陀罗，中风先兆高危'
  },
  {
    name: '【案例 3】肺部重症警示',
    y: 1948, mo: 11, d: 22, h: 18,
    ming: '武曲', shen: '廉贞', jiyi: '武曲+火星',
    symptoms: '咳血胸痛，消瘦',
    text: '武曲化忌+火星，肺部重症'
  },
  {
    name: '【案例 4】典型健康盘',
    y: 1985, mo: 8, d: 18, h: 12,
    ming: '天梁', shen: '天同', jiyi: '天府',
    symptoms: '（健康）',
    text: '天梁寿星+天同福星，健康平稳'
  },
  {
    name: '【案例 5】肾虚水液代谢',
    y: 1972, mo: 1, d: 5, h: 0,
    ming: '太阴', shen: '破军', jiyi: '太阴+铃星',
    symptoms: '腰酸尿频，水肿',
    text: '太阴陷地+铃星，肾虚泌尿'
  },
  {
    name: '【案例 6】糖尿病警讯',
    y: 1965, mo: 9, d: 28, h: 22,
    ming: '天同', shen: '天府', jiyi: '天同+化忌',
    symptoms: '多饮多尿，消瘦',
    text: '天同陷地化忌，糖尿病危象'
  }
];

/* ===================================================================
 * 工具函数
 * =================================================================== */
const STEM_WUXING = { '甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水' };
const BRANCH_WUXING = { '子':'水','丑':'土','寅':'木','卯':'木','辰':'土','巳':'火','午':'火','未':'土','申':'金','酉':'金','戌':'土','亥':'水' };
const STEM_LIST = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
const BRANCH_LIST = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];

function $(s){return document.querySelector(s);}
function $$(s){return document.querySelectorAll(s);}
function toast(msg, ms=2400){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(()=>t.classList.remove('show'), ms);
}

function computeBazi(year, month, day, hour){
  const y=+year, m=+month, d=+day, h=+hour;
  const yearStem = STEM_LIST[((y-4)%10+10)%10];
  const yearBranch = BRANCH_LIST[((y-4)%12+12)%12];
  const monthStem = STEM_LIST[((y-4)%5*2 + (m-1) + 1 + 10)%10];
  const monthBranch = BRANCH_LIST[(m+1)%12];
  const baseDate = new Date(1900,0,1);
  const targetDate = new Date(y, m-1, d);
  const diffDays = Math.floor((targetDate - baseDate)/86400000);
  const dayIdx = (10 + diffDays + 6000)%60;
  const dayStem = STEM_LIST[dayIdx%10];
  const dayBranch = BRANCH_LIST[dayIdx%12];
  const hBranch = BRANCH_LIST[Math.floor(((h+1)%24)/2)];
  const hStem = STEM_LIST[(((dayIdx%5)*2 + Math.floor(h/2) + 1)+10)%10];
  return {year:{stem:yearStem,branch:yearBranch}, month:{stem:monthStem,branch:monthBranch}, day:{stem:dayStem,branch:dayBranch}, hour:{stem:hStem,branch:hBranch}};
}
function computeWuxingScore(bazi){
  const score={木:0,火:0,土:0,金:0,水:0};
  ['year','month','day','hour'].forEach(p=>{
    score[STEM_WUXING[bazi[p].stem]]++;
    score[BRANCH_WUXING[bazi[p].branch]]++;
  });
  return score;
}

/* ===================================================================
 * 初始化下拉框
 * =================================================================== */
function initPalaceOptions(){
  const stars = Object.keys(ZIWEI_DISEASE);
  const mingSel = $('#ming-palace');
  const shenSel = $('#shen-palace');
  const jiyiSel = $('#jiyi-palace');
  stars.forEach(s=>{
    [mingSel, shenSel, jiyiSel].forEach(sel=>{
      const o = document.createElement('option');
      o.value = s;
      o.textContent = s + '（' + ZIWEI_DISEASE[s].organ + '）';
      sel.appendChild(o);
    });
  });
}
initPalaceOptions();

/* ===================================================================
 * 渲染样本案例
 * =================================================================== */
function renderSampleCases(){
  const el = $('#quickCases');
  el.innerHTML = SAMPLE_CASES.map((c, i)=>`
    <button class="btn-big btn-secondary" style="font-size:16px;text-align:left;padding:14px;line-height:1.5" onclick="loadCase(${i})">
      <div style="font-weight:900;color:var(--gold2);font-size:18px">${c.name}</div>
      <div style="font-size:14px;color:var(--paper3);margin-top:4px">${c.text}</div>
    </button>
  `).join('');
}
function loadCase(i){
  const c = SAMPLE_CASES[i];
  $('#pt-name').value = c.name;
  $('#b-year').value = c.y;
  $('#b-month').value = c.mo;
  $('#b-day').value = c.d;
  $('#b-hour').value = c.h;
  $('#ming-palace').value = c.ming;
  $('#shen-palace').value = c.shen;
  $('#jiyi-palace').value = c.jiyi;
  $('#symptoms').value = c.symptoms;
  toast(`已载入${c.name}`, 2000);
}
renderSampleCases();

/* ===================================================================
 * 渲染急救信号
 * =================================================================== */
function renderEmergencyList(){
  $('#emergency-list').innerHTML = EMERGENCY_SIGNALS.map((e,i)=>`
    <div style="background:rgba(127,29,29,0.15);border:2px solid rgba(220,38,38,0.5);border-radius:12px;padding:16px;margin:12px 0">
      <div style="font-size:22px;color:var(--cinn2);font-weight:900;letter-spacing:3px;margin-bottom:8px">${e.name}</div>
      <div style="font-size:16px;color:var(--gold);font-weight:700;margin:6px 0">📍 宫位：${e.palace}</div>
      <div style="font-size:17px;margin:8px 0;line-height:1.7"><b>信号：</b>${e.signals.map(s=>`<span class="pill cinn" style="margin:2px">${s}</span>`).join('')}</div>
      <div style="font-size:16px;line-height:1.7;margin-top:8px;color:var(--paper2)">${e.detail}</div>
      <div style="font-size:18px;background:rgba(220,38,38,0.2);padding:12px;border-radius:8px;margin-top:12px;border:1px solid var(--cinn2)">
        🚨 <b>应对：</b>${e.action}
      </div>
      <div style="text-align:right;margin-top:8px">
        <span class="pill cinn">⚠ 等级：${e.level}</span>
      </div>
    </div>
  `).join('');
}
renderEmergencyList();

/* ===================================================================
 * 渲染 14 主星 × 疾病 知识库
 * =================================================================== */
function renderKb(search){
  const q = (search || '').trim();
  const stars = Object.entries(ZIWEI_DISEASE);
  const filtered = q ? stars.filter(([s, info])=>{
    return s.includes(q) || info.organ.includes(q) || info.fruit.includes(q) ||
      info.disease.some(d=>d.name.includes(q)) || info.tcm.includes(q) ||
      info.risk_signals.some(r=>r.includes(q)) || info.rule.includes(q);
  }) : stars;

  $('#kb-results').innerHTML = filtered.length ? filtered.map(([s, info])=>`
    <div style="background:rgba(0,0,0,0.3);border:1px solid var(--gold);border-radius:12px;padding:16px;margin:12px 0">
      <div style="font-size:24px;color:var(--gold2);font-weight:900;letter-spacing:4px">${s} <span style="font-size:14px;color:var(--paper3)">${info.organ}</span></div>
      <div style="font-size:15px;color:var(--paper3);margin:6px 0">${info.fruit} · 严重度：<b style="color:${info.severity==='极高'||info.severity==='高'?'var(--cinn2)':info.severity==='中'?'var(--warn)':'var(--ok)'}">${info.severity}</b></div>
      <div style="font-size:16px;margin-top:8px;line-height:1.7">
        <b style="color:var(--gold)">易患病：</b>
        ${info.disease.map(d=>`<span class="pill" style="margin:2px">${d.name}${d.province==='极高'?'★':''} (${d.probability})</span>`).join('')}
      </div>
      <div style="font-size:16px;margin-top:8px"><b style="color:var(--cinn2)">危险信号：</b>${info.risk_signals.map(r=>`<span class="pill cinn" style="margin:2px">${r}</span>`).join('')}</div>
      <div style="font-size:16px;margin-top:8px"><b style="color:var(--warn)">早期征：</b>${info.early_signs.map(r=>`<span class="pill" style="margin:2px;background:rgba(217,119,6,0.2);border-color:var(--warn);color:var(--warn)">${r}</span>`).join('')}</div>
      <div style="font-size:16px;margin-top:8px;color:var(--paper2)"><b>中医推荐：</b>${info.tcm}</div>
      <div style="font-size:16px;margin-top:8px;color:var(--gold2);font-weight:700">📜 ${info.rule}</div>
    </div>
  `).join('') : '<div style="text-align:center;color:var(--paper3);padding:24px">未匹配</div>';
}
renderKb();
$('#kb-search').addEventListener('input', e=>renderKb(e.target.value));

/* ===================================================================
 * Tab 切换
 * =================================================================== */
$$('.tab').forEach(tab=>{
  tab.addEventListener('click', ()=>{
    $$('.tab').forEach(t=>t.classList.remove('active'));
    $$('.tab-panel').forEach(p=>p.classList.remove('active'));
    tab.classList.add('active');
    document.querySelector(`[data-tab="${tab.dataset.tab}"].tab-panel`).classList.add('active');
    window.scrollTo({top:0,behavior:'smooth'});
  });
});

/* ===================================================================
 * 疾病预测分析（核心算法）
 * =================================================================== */
function analyzeDisease(){
  const ming = $('#ming-palace').value;
  const jiyi = $('#jiyi-palace').value || ming;
  if(!ming){ toast('请选择命宫主星'); return; }
  const y = +$('#b-year').value, mo=+$('#b-month').value, d=+$('#b-day').value, h=+$('#b-hour').value;

  let html = '';

  // ① 命宫主星疾病分析
  const mingInfo = ZIWEI_DISEASE[ming];
  html += `<div class="report"><h3>① 命宫【${ming}】疾病倾向</h3>`;
  html += `<div class="row-flex">
    <span class="pill">${mingInfo.organ}</span>
    <span class="pill">${mingInfo.fruit}</span>
    <span class="pill" style="background:${mingInfo.severity==='极高'||mingInfo.severity==='高'?'var(--cinn2)':mingInfo.severity==='中'?'var(--warn)':'var(--ok)'}">严重度：${mingInfo.severity}</span>
  </div>`;
  html += `<p style="margin-top:12px"><b>易患疾病（含概率）：</b></p>`;
  html += `<table><tr><th>疾病</th><th>概率</th><th>中医病机</th></tr>`;
  mingInfo.disease.forEach(d=>{
    const prob = d.probability;
    const color = prob==='极高'||prob==='高'?'var(--cinn2)':prob==='中'?'var(--warn)':'var(--ok)';
    html += `<tr><td><b>${d.name}</b></td><td style="color:${color};font-weight:700">${prob}</td><td>${mingInfo.organ}失调所致</td></tr>`;
  });
  html += `</table>`;
  html += `<p style="margin-top:12px"><b style="color:var(--cinn2)">⚠ 危重信号：</b>${mingInfo.risk_signals.join('、')}</p>`;
  html += `<p style="margin-top:8px"><b style="color:var(--warn)">早期征兆：</b>${mingInfo.early_signs.join('、')}</p>`;
  html += `<p style="margin-top:12px;background:rgba(201,168,76,0.1);padding:12px;border-radius:8px"><b>中医方案：</b>${mingInfo.tcm}</p>`;
  html += `<p style="margin-top:8px;font-style:italic;color:var(--gold)">"${mingInfo.rule}"</p>`;
  html += `</div>`;

  // ② 疾厄宫交叉验证
  if(jiyi !== ming) {
    const jiyiInfo = ZIWEI_DISEASE[jiyi];
    html += `<div class="report"><h3>② 疾厄宫【${jiyi}】交叉验证</h3>`;
    html += `<p>疾厄宫为疾病本位，<b>${jiyi}</b>主${jiyiInfo.organ}，与命宫<b>${ming}</b>主${mingInfo.organ}系统：</p>`;
    if(mingInfo.organ.includes(jiyiInfo.organ.split('·')[0]) || jiyiInfo.organ.includes(mingInfo.organ.split('·')[0])){
      html += `<p style="color:var(--cinn2);font-weight:700">★ 同系统共振：命宫+疾厄宫同主${mingInfo.organ.split('·')[0]}系统，疾病风险显著上升（叠加效应）。</p>`;
    } else {
      html += `<p style="color:var(--ok)">✓ 不同系统：命宫主${mingInfo.organ}，疾厄宫主${jiyiInfo.organ}，但仍需关注元神（大限、流年）触发。</p>`;
    }
    html += `<p><b>疾厄宫易患：</b>${jiyiInfo.disease.slice(0,3).map(d=>d.name).join('、')}</p>`;
    html += `<p><b>疾厄危重信号：</b>${jiyiInfo.risk_signals.join('、')}</p>`;
    html += `</div>`;
  }

  // ③ 八字五行分析
  if(y && mo && d && h !== '' && h !== null) {
    try {
      const bazi = computeBazi(y, mo, d, h);
      const ws = computeWuxingScore(bazi);
      const dayMaster = bazi.day.stem;
      const dmWX = STEM_WUXING[dayMaster];

      html += `<div class="report"><h3>③ 八字五行交叉验证</h3>`;
      html += `<p style="text-align:center;font-size:22px;color:var(--gold);font-weight:900;letter-spacing:4px">${bazi.year.stem}${bazi.year.branch} · ${bazi.month.stem}${bazi.month.branch} · ${bazi.day.stem}${bazi.day.branch} · ${bazi.hour.stem}${bazi.hour.branch}</p>`;
      html += `<p style="text-align:center">日主：<b style="color:var(--gold2);font-size:20px">${dayMaster}</b>（${BAZI_ORGAN[dmWX].organ}之命，${BAZI_ORGAN[dmWX].open}开窍于${BAZI_ORGAN[dmWX].emotion=='怒'?'肝':'/' }）</p>`;

      // 五行分布
      html += `<h3 style="font-size:20px;margin-top:16px">五行分布：</h3>`;
      html += `<table><tr><th>五行</th><th>脏腑</th><th>开窍</th><th>情志</th><th>季</th><th>色</th><th>味</th><th>分数</th></tr>`;
      ['木','火','土','金','水'].forEach(wx=>{
        const o = BAZI_ORGAN[wx];
        const s = ws[wx];
        const color = s >= 3 ? 'var(--cinn2)' : s <= 0 ? 'var(--warn)' : 'var(--paper2)';
        html += `<tr><td style="color:${wxColor(wx)};font-weight:900;font-size:18px">${wx}</td><td>${o.organ}</td><td>${o.open}</td><td>${o.emotion}</td><td>${o.season}</td><td>${o.color}</td><td>${o.tastes}</td><td style="color:${color};font-weight:700">${s}</td></tr>`;
      });
      html += `</table>`;

      // 五行失衡分析
      const max = Math.max(...Object.values(ws));
      const min = Math.min(...Object.values(ws));
      const avg = (max+min)/2;
      const imbalances = [];
      for(const wx in ws){
        if(ws[wx] > avg+1) imbalances.push({wx, type:'过旺', s:ws[wx], organ:BAZI_ORGAN[wx].organ});
        if(ws[wx] < avg-1) imbalances.push({wx, type:'偏弱', s:ws[wx], organ:BAZI_ORGAN[wx].organ});
      }
      if(imbalances.length){
        html += `<h3 style="font-size:20px;margin-top:16px">五行失衡：</h3>`;
        imbalances.forEach(im=>{
          const dir = im.type==='过旺'?'泄该五行以平衡':'补该五行以增强';
          const color = im.type==='过旺'?'var(--warn)':'var(--cinn2)';
          html += `<p style="color:${color};font-weight:700">${im.type==='过旺'?'⬆':'⬇'} <b>${im.wx}</b>（${im.organ}）${im.type}（分数 ${im.s}）—— 建议${dir}</p>`;
        });
      } else {
        html += `<p style="color:var(--ok)">✓ 五行基本平衡，健康风险较低。</p>`;
      }

      // 与紫微联动
      html += `<h3 style="font-size:20px;margin-top:16px">★ 紫微×八字 双校验：</h3>`;
      const mingOrgan = mingInfo.organ.split('·')[0];
      const dmOrgan = BAZI_ORGAN[dmWX].organ.split('·')[0];
      html += `<table><tr><th>维度</th><th>主星/日主</th><th>对应系统</th></tr>`;
      html += `<tr><td>紫微（命宫）</td><td>${ming}</td><td>${mingOrgan}系统</td></tr>`;
      html += `<tr><td>八字（日主）</td><td>${dayMaster}（${dmWX}）</td><td>${dmOrgan}系统</td></tr>`;
      const matched = mingOrgan.includes(dmOrgan) || dmOrgan.includes(mingOrgan);
      if(matched){
        html += `<tr><td colspan="3" style="background:rgba(220,38,38,0.2);text-align:center;color:var(--cinn2);font-weight:900">★ 两系统共振！${dmOrgan}系统为重点观察对象。</td></tr>`;
      } else {
        html += `<tr><td colspan="3" style="color:var(--ok)">✓ 两系统分别指向，需双线预防</td></tr>`;
      }
      html += `</table>`;
      html += `</div>`;
    } catch(e){
      html += `<div class="report"><p style="color:var(--cinn2)">八字计算异常：${e.message}</p></div>`;
    }
  }

  // ④ 急救预警
  html += `<div class="emergency"><div class="icon">🚨</div><b style="font-size:24px">危重信号预警</b><br><span style="font-size:18px">若患者同时出现本模块"急救信号 Tab"中任意两项以上征兆，应立即就医。</span></div>`;

  // ⑤ 综合建议
  const symp = $('#symptoms').value;
  if(symp){
    html += `<div class="report"><h3>⑤ 当前症状关联</h3>`;
    html += `<p><b>主诉：</b>${symp}</p>`;
    html += `<p style="color:var(--warn);font-weight:700">★ 若主诉涉及：${mingInfo.disease.filter(d=>symp.includes(d.name.split('·')[0])).map(d=>d.name).join('、') || '请咨询专业医师'}</p>`;
    html += `<p>建议专科：<b style="color:var(--cinn2)">${mingInfo.organ.split('·')[0]}科</b> + 中医${mingInfo.organ.split('·')[0]}辨证</p>`;
    html += `</div>`;
  }

  $('#disease-result').innerHTML = html;
  // 切到疾病 Tab
  $$('.tab')[1].click();
  toast('疾病分析完成', 2000);
}

function wxColor(wx){
  return {木:'#16a34a',火:'#dc2626',土:'#d97706',金:'#94a3b8',水:'#2563eb'}[wx] || '#fff';
}

/* ===================================================================
 * 寿元生死预测
 * =================================================================== */
function analyzeLifeDeath(){
  const ming = $('#ming-palace').value;
  if(!ming){ toast('请选择命宫主星'); return; }
  const y = +$('#b-year').value, mo=+$('#b-month').value, d=+$('#b-day').value, h=+$('#b-hour').value;

  let html = '';
  const info = ZIWEI_DISEASE[ming];

  // ① 寿元基础格局
  html += `<div class="report"><h3>① ${ming} 寿元基础格局</h3>`;
  const is寿星 = ming === '天梁' || ming === '天同' || ming === '天府';
  const is耗星 = ming === '廉贞' || ming === '七杀' || ming === '破军';
  const baseLevel = is寿星 ? '中高' : is耗星 ? '中' : '中';

  html += `<p style="font-size:20px;color:${is寿星?'var(--ok)':is耗星?'var(--cinn2)':'var(--warn)'};font-weight:700">基础寿元等级：${baseLevel}</p>`;
  html += `<p>${mingInfo.rule}</p>`;
  html += `<table style="margin-top:12px"><tr><th>主星特性</th><th>主寿系统</th><th>主危方向</th></tr>`;
  html += `<tr><td>${ming}为${is寿星?'寿星/福德':is耗星?'杀星/耗星':'中性'}</td><td>${mingInfo.organ}</td><td>${info.disease.filter(d=>d.probability==='极高'||d.probability==='高').map(d=>d.name).join('、')||'需评估'}</td></tr>`;
  html += `</table>`;
  html += `</div>`;

  // ② 大限风险时间轴
  html += `<div class="report"><h3>② 大限流年风险时间轴</h3>`;
  html += `<p style="color:var(--paper3);font-size:16px">基于${ming}命宫，叠加十大化忌信号，推算 40-90 岁关键风险窗口：</p>`;
  const ages = [
    { age: 40, risk: '低', text: '步入中年，劳逸结合，定期体检' },
    { age: 45, risk: '中', text: '女命注意妇科/男命注意肝胆；天机化忌窗口' },
    { age: 50, risk: '中', text: '更年期前后，五脏波动；廉贞陷地有血光' },
    { age: 55, risk: '中', text: '心脑血管初显；如有化忌需高度重视' },
    { age: 60, risk: '中', text: '退休转换，气血变化；肾脏功能开始衰退' },
    { age: 65, risk: '高', text: '心脑卒中、糖尿病危象高发期；务必每半年体检' },
    { age: 70, risk: '高', text: '脏腑衰退明显，需长期中药调理；廉杀化忌者特别警惕' },
    { age: 75, risk: '中高', text: '认知衰退、骨质疏松风险；天梁寿星可化解' },
    { age: 80, risk: '中', text: '整体进入末限；天同/天梁寿星仍可享高龄' },
    { age: 90, risk: '?', text: '突破 90 需大运+流年皆吉，并配合养生' }
  ];
  html += `<div class="timeline">`;
  ages.forEach(a=>{
    const risk = a.risk==='高'?'risk-h':a.risk==='中'||a.risk==='中高'?'risk-m':'risk-l';
    html += `<div class="timeline-item">
      <span class="age">${a.age}岁</span>
      <span class="risk ${risk}">${a.risk}</span>
      <div class="event">${a.text}</div>
    </div>`;
  });
  html += `</div>`;
  html += `</div>`;

  // ③ 急救生死信号汇总
  const signals = [];
  Object.entries(DAHAI_RISK).forEach(([key, disease])=>{
    signals.push({key, disease});
  });
  html += `<div class="report"><h3>③ 十四主星化忌生死信号对照</h3>`;
  html += `<table><tr><th>化忌</th><th>主危方向</th><th>严重度</th></tr>`;
  signals.forEach(s=>{
    const sev = s.key.includes('廉贞')||s.key.includes('武曲')||s.key.includes('七杀') ? '极高' :
                s.key.includes('太阳')||s.key.includes('天机')||s.key.includes('太阴') ? '高' : '中';
    const color = sev==='极高'||sev==='高'?'var(--cinn2)':'var(--warn)';
    html += `<tr><td><b>${s.key}</b></td><td>${s.disease}</td><td style="color:${color};font-weight:700">${sev}</td></tr>`;
  });
  html += `</table></div>`;

  // ④ 综合寿元预测
  if(y && mo && d && h !== '' && h !== null){
    try{
      const bazi = computeBazi(y, mo, d, h);
      const ws = computeWuxingScore(bazi);
      const dmWX = STEM_WUXING[bazi.day.stem];

      html += `<div class="report"><h3>④ 八字日主寿元辅助</h3>`;
      html += `<p style="font-size:20px">日主 <b style="color:var(--gold2)">${bazi.day.stem}</b>（${dmWX}）—— ${BAZI_ORGAN[dmWX].organ}</p>`;
      html += `<p>${BAZI_ORGAN[dmWX].emotion}伤${BAZI_ORGAN[dmWX].organ}，故<b style="color:var(--warn)">慎${BAZI_ORGAN[dmWX].emotion}</b>。</p>`;
      // 五行生克大运
      const dayBranch = bazi.day.branch;
      const monthBranch = bazi.month.branch;
      const drWX = BRANCH_WUXING[dayBranch];
      const mrWX = BRANCH_WUXING[monthBranch];
      html += `<p>日支 ${dayBranch}（${drWX}） vs 月支 ${monthBranch}（${mrWX}）：日月经纬关系决定基础寿元。</p>`;

      // 大运推算
      const startAge = 8; // 默认起运 8 岁
      for(let i = 0; i < 8; i++){
        const age = startAge + i*10;
        const branch = BRANCH_LIST[((BRANCH_LIST.indexOf(monthBranch) + i + 1) % 12)];
        const stem = STEM_LIST[((y - 4) % 5 * 2 + i + 2 + 10) % 10];
        const risk = i >= 4 ? 'risk-h' : 'risk-m';
        html += `<div class="timeline-item">
          <span class="age">${age}-${age+9}岁</span>
          <span class="risk ${risk}">${i >= 4 ? '高' : '中'}</span>
          <div class="event">${stem}${branch}大运（${BRANCH_WUXING[branch]}）—— ${i >= 4 ? '老年期需高度重视' : '中年期注意调养'}</div>
        </div>`;
      }
      html += `</div>`;
    } catch(e){
      html += `<p style="color:var(--cinn2)">八字异常：${e.message}</p>`;
    }
  }

  // ⑤ 终极吉凶总结
  html += `<div class="emergency"><div class="icon">☯</div><b style="font-size:24px">终极吉凶总判</b><br><span style="font-size:18px">${mingInfo.rule}</span><br><br><b style="color:var(--warn)">⚠ 注意：</b>${mingInfo.risk_signals.join('、')}<br><br><b>建议就医：</b>${mingInfo.tcm}</div>`;

  $('#life-death-result').innerHTML = html;
  // 切到生死 Tab
  $$('.tab')[2].click();
  toast('寿元分析完成', 2000);
}

/* 启动 */
window.addEventListener('DOMContentLoaded', ()=>{
  toast('紫微断疾病生死·大师专用已就绪', 2000);
});


setTimeout(function(){var el=document.getElementById("r40DiseaseDashboard");if(el && typeof renderDiseaseHealthCareerR40==='function')el.innerHTML=renderDiseaseHealthCareerR40();},500);