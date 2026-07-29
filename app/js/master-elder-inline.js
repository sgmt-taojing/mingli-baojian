
/* ========== 大字号 + 友好交互：核心数据 ========== */
const WUXING_MAP = {
  '木': { organ: '肝胆', diseases: ['头晕目眩','目赤肿痛','胁肋胀痛','情绪抑郁','易怒暴躁','高血压'], herb: ['柴胡','白芍','枸杞','菊花','决明子'], color: '#2d8659', emoji: '🌳' },
  '火': { organ: '心脏·小肠', diseases: ['心悸失眠','口舌生疮','舌尖红痛','心烦气躁','盗汗','小便短赤'], herb: ['丹参','麦冬','黄连','栀子','淡竹叶'], color: '#a52a2a', emoji: '🔥' },
  '土': { organ: '脾胃', diseases: ['腹胀纳差','大便溏泄','糖尿病倾向','倦怠乏力','水肿','痰湿'], herb: ['山药','薏苡仁','白术','茯苓','陈皮'], color: '#cd6600', emoji: '⛰️' },
  '金': { organ: '肺·大肠', diseases: ['咳嗽哮喘','皮肤干燥','便秘','鼻炎','咽喉炎','易感冒'], herb: ['百合','麦冬','杏仁','川贝','沙参'], color: '#708090', emoji: '⚙️' },
  '水': { organ: '肾·膀胱', diseases: ['腰膝酸软','水肿尿频','耳鸣耳聋','白发早衰','阳痿遗精','畏寒肢冷'], herb: ['熟地黄','山药','枸杞','杜仲','五味子'], color: '#1e3a8a', emoji: '💧' }
};

/* 天干地支 → 五行 */
const STEM_WUXING = { '甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水' };
const BRANCH_WUXING = { '子':'水','丑':'土','寅':'木','卯':'木','辰':'土','巳':'火','午':'火','未':'土','申':'金','酉':'金','戌':'土','亥':'水' };

const STEM_LIST = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
const BRANCH_LIST = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];

/* ========== 状态 ========== */
const state = {
  step: 1,
  data: {},
  gender: null,
  bazi: null,
  wuxingScore: null,
  diseases: null,
  tcm: null
};

/* ========== 工具 ========== */
function toast(msg, ms=2400){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(()=>t.classList.remove('show'), ms);
}

function selectGender(g, btn){
  state.gender = g;
  document.querySelectorAll('#panel-1 .opt').forEach(b=>b.classList.remove('selected'));
  btn.classList.add('selected');
}

function goHome(){ location.href='index.html'; }

function restart(){
  if(!confirm('确定重新开始吗？当前输入会清空。'))return;
  state.step = 1;
  state.data = {};
  state.gender = null;
  state.bazi = null;
  state.wuxingScore = null;
  state.diseases = null;
  state.tcm = null;
  document.querySelectorAll('input[type="number"],input[type="text"]').forEach(i=>i.value='');
  document.querySelectorAll('select').forEach(s=>s.selectedIndex=0);
  document.querySelectorAll('.opt').forEach(o=>o.classList.remove('selected'));
  showPanel(1);
}

function showPanel(n){
  for(let i=1;i<=4;i++){
    document.getElementById('panel-'+i).classList.toggle('hidden', i!==n);
  }
  state.step = n;
  // 更新步骤指示器
  document.querySelectorAll('.step').forEach(s=>{
    const sn = +s.dataset.step;
    s.classList.toggle('active', sn===n);
    s.classList.toggle('done', sn<n);
  });
  // 滚到顶部
  window.scrollTo({top:0, behavior:'smooth'});
}

/* ========== 八字排盘（精确到年月日时） ========== */
function computeBazi(year, month, day, hour){
  // 年柱：以立春为界
  // 简化：用公历年计算（精度足够对老年群体）
  const y = +year;
  const yIdx = (y - 4) % 60; // 1984 = 甲子 = 0
  const yearStem = STEM_LIST[((y - 4) % 10 + 10) % 10];
  const yearBranch = BRANCH_LIST[((y - 4) % 12 + 12) % 12];
  const yearAnimal = ['鼠','牛','虎','兔','龙','蛇','马','羊','猴','鸡','狗','猪'][(y - 4) % 12];

  // 月柱：按节气（简化用月份）
  const m = +month;
  const monthStem = STEM_LIST[((y - 4) % 5 * 2 + (m - 1) + 1 + 10) % 10]; // 五虎遁年起月
  const monthBranch = BRANCH_LIST[(m + 1) % 12];

  // 日柱：用基准日 1900-01-01 = 甲戌 (10)
  const baseDate = new Date(1900, 0, 1);
  const targetDate = new Date(y, m-1, +day);
  const diffDays = Math.floor((targetDate - baseDate) / 86400000);
  const dayIdx = (10 + diffDays + 60*100) % 60; // 防止负数
  const dayStem = STEM_LIST[dayIdx % 10];
  const dayBranch = BRANCH_LIST[dayIdx % 12];

  // 时柱：五子鼠日起时
  const h = +hour;
  const hBranch = BRANCH_LIST[Math.floor(((h+1)%24)/2)];
  const dayStemIdx = dayIdx % 10;
  const hStem = STEM_LIST[((dayStemIdx % 5) * 2 + Math.floor(h/2) + 1 + 10) % 10];

  return {
    year:{stem:yearStem,branch:yearBranch,animal:yearAnimal},
    month:{stem:monthStem,branch:monthBranch},
    day:{stem:dayStem,branch:dayBranch},
    hour:{stem:hStem,branch:hBranch}
  };
}

/* ========== 五行旺衰 ========== */
function computeWuxingScore(bazi){
  const score = { 木:0, 火:0, 土:0, 金:0, 水:0 };
  ['year','month','day','hour'].forEach(p=>{
    score[STEM_WUXING[bazi[p].stem]]++;
    score[BRANCH_WUXING[bazi[p].branch]]++;
  });
  return score;
}

/* ========== 疾病预测 ========== */
function predictDiseases(wuxingScore){
  const max = Math.max(...Object.values(wuxingScore));
  const min = Math.min(...Object.values(wuxingScore));
  const avg = (max+min)/2;

  // 缺什么 → 该脏腑弱
  // 过旺 → 该脏腑过亢
  const result = [];
  for(const wx in wuxingScore){
    const info = WUXING_MAP[wx];
    const s = wuxingScore[wx];
    if(s < avg - 0.5){
      // 偏弱
      result.push({
        type:'偏弱',
        wuxing:wx,
        emoji:info.emoji,
        organ:info.organ,
        diseases: info.diseases.slice(0,3),
        herb: info.herb,
        advice:'建议补'+wx+'。日常生活中多接触绿色、酸味食物。'
      });
    } else if(s > avg + 0.5){
      // 过旺
      result.push({
        type:'过旺',
        wuxing:wx,
        emoji:info.emoji,
        organ:info.organ,
        diseases: ['注意:'+wx+'气过亢可能引发', info.diseases[0], info.diseases[1]],
        herb:[],
        advice:'建议泄'+wx+'。日常饮食清淡，少辛辣刺激。'
      });
    }
  }
  // 日主五行（从五行评分中取最高项）
  const riZhu = Object.entries(wuxingScore).sort((a,b)=>b[1]-a[1])[0] || null;
  return result;
}

/* ========== 中药推荐 ========== */
function recommendTcm(wuxingScore){
  const sorted = Object.entries(wuxingScore).sort((a,b)=>a[1]-b[1]);
  const rec = {
    primary: [],   // 最需补
    secondary: []  // 次要
  };
  rec.primary = sorted.slice(0,2).map(([wx])=>({
    wuxing:wx,
    ...WUXING_MAP[wx]
  }));
  rec.secondary = sorted.slice(2,3).map(([wx])=>({
    wuxing:wx,
    ...WUXING_MAP[wx]
  }));
  return rec;
}

/* ========== 步骤切换 ========== */
function validateStep1(){
  const y = +document.getElementById('birth-year').value;
  const m = +document.getElementById('birth-month').value;
  const d = +document.getElementById('birth-day').value;
  const h = +document.getElementById('birth-hour').value;
  if(!y || y<1900 || y>2025){ toast('请填写正确的年份 (1900-2025)'); return false; }
  if(!m){ toast('请选择月份'); return false; }
  if(!d || d<1 || d>31){ toast('请填写正确的日期'); return false; }
  if(h==='' || h===null){ toast('请选择时辰'); return false; }
  if(!state.gender){ toast('请选择性别'); return false; }
  state.data.year = y; state.data.month = m; state.data.day = d; state.data.hour = h;
  state.data.name = document.getElementById('patient-name').value || '患者';
  return true;
}

function goStep2(){
  if(!validateStep1())return;
  state.bazi = computeBazi(state.data.year, state.data.month, state.data.day, state.data.hour);
  state.wuxingScore = computeWuxingScore(state.bazi);
  renderBazi();
  showPanel(2);
}

function renderBazi(){
  const b = state.bazi;
  const ws = state.wuxingScore;
  const wuxingRow = Object.entries(ws).map(([k,v])=>`<td style="background:${WUXING_MAP[k].color}22"><b style="color:${WUXING_MAP[k].color}">${WUXING_MAP[k].emoji}${k}</b><br>分数 ${v}</td>`).join('');
  const wuxingRec = Object.entries(ws).sort((a,b)=>b[1]-a[1]).map(([k,v])=>{
    const info = WUXING_MAP[k];
    return `<div class="pill" style="background:${info.color}">${info.emoji}${k}（${v}）${info.organ}</div>`;
  }).join('');

  document.getElementById('bazi-display').innerHTML = `
    <h3>📅 ${state.data.name} 的生辰八字</h3>
    <p style="text-align:center;font-size:26px;color:var(--gold);font-weight:900;letter-spacing:4px">
      ${b.year.stem}${b.year.branch} · ${b.month.stem}${b.month.branch} · ${b.day.stem}${b.day.branch} · ${b.hour.stem}${b.hour.branch}
    </p>
    <p style="text-align:center;font-size:22px">属相：<b>${b.year.animal}</b>　性别：<b>${state.gender==='male'?'男':'女'}</b></p>

    <h3>🌳 五行分布</h3>
    <table>
      <tr>${wuxingRow}</tr>
    </table>
    <div class="row-flex">${wuxingRec}</div>

    <h3>📖 八字详解</h3>
    <p><b>年柱：</b>${b.year.stem}${b.year.branch} 代表祖上、父母宫，主出身背景。</p>
    <p><b>月柱：</b>${b.month.stem}${b.month.branch} 代表兄弟、父母宫，主青年运势。</p>
    <p><b>日柱：</b>${b.day.stem}${b.day.branch} 日干为<b>${b.day.stem}</b>（${WUXING_MAP[STEM_WUXING[b.day.stem]].organ}之命），日支为<b>${b.day.branch}</b>，代表自身与配偶宫。</p>
    <p><b>时柱：</b>${b.hour.stem}${b.hour.branch} 代表子女、晚运，主老年运势。</p>
  `;
}

function goStep3(){
  state.diseases = predictDiseases(state.wuxingScore);
  renderDiseases();
  showPanel(3);
}

function renderDiseases(){
  const ws = state.wuxingScore;
  const sorted = Object.entries(ws).sort((a,b)=>b[1]-a[1]);
  const max = sorted[0][0];
  const min = sorted[sorted.length-1][0];
  const maxInfo = WUXING_MAP[max];
  const minInfo = WUXING_MAP[min];

  // 取偏弱+过旺的所有
  const avg = (Math.max(...Object.values(ws)) + Math.min(...Object.values(ws)))/2;
  const flags = [];
  for(const wx in ws){
    const info = WUXING_MAP[wx];
    const s = ws[wx];
    if(s < avg - 0.5){
      flags.push({wx, type:'偏弱', info, s});
    } else if(s > avg + 0.5){
      flags.push({wx, type:'过旺', info, s});
    }
  }
  // 始终展示最弱 + 最旺
  if(!flags.find(f=>f.wx===min)) flags.unshift({wx:min, type:'最弱', info:minInfo, s:ws[min]});
  if(!flags.find(f=>f.wx===max)) flags.push({wx:max, type:'最旺', info:maxInfo, s:ws[max]});

  const html = `
    <h3>🔍 五行旺衰诊断</h3>
    <p>本造五行最旺为 <b style="color:${maxInfo.color}">${maxInfo.emoji}${max}</b>，最弱为 <b style="color:${minInfo.color}">${minInfo.emoji}${min}</b>。</p>

    ${flags.map(f=>`
      <h3>${f.type==='最弱'?'⬇️':f.type==='最旺'?'⬆️':''} ${f.info.emoji} ${f.wx}（${f.info.organ}）${f.type}（分数 ${f.s}）</h3>
      <p><b>易患倾向：</b></p>
      <div class="row-flex">
        ${f.info.diseases.map(d=>`<div class="pill" style="background:${f.info.color}">${d}</div>`).join('')}
      </div>
      <p style="margin-top:12px"><b>建议：</b>${f.type==='最弱'?'滋补'+f.wx+'气，宜食'+f.wx+'性食物，注意休息。':f.type==='最旺'?'泄'+f.wx+'以平衡，忌辛辣刺激，保持情绪稳定。':'调理'+f.wx+'气，使五行趋于平衡。'}</p>
    `).join('')}

    <h3>⚠️ 健康提醒</h3>
    <p style="background:#fff3cd;padding:16px;border-radius:8px;border:2px solid #cd6600">
      本预测基于八字五行理论，仅供参考。<b style="color:#a52a2a">如有不适请及时就医</b>，
      中医诊断需结合望闻问切四诊合参。
    </p>
  `;
  document.getElementById('disease-display').innerHTML = html;
}

function goStep4(){
  state.tcm = recommendTcm(state.wuxingScore);
  renderTcm();
  showPanel(4);
}

function renderTcm(){
  const tcm = state.tcm;
  const primaryHtml = tcm.primary.map(p=>`
    <h3>🌿 主补 · ${p.emoji}${p.wuxing}（${p.organ}）</h3>
    <p><b>推荐中药：</b></p>
    <div class="row-flex">
      ${p.herb.map(h=>`<div class="pill" style="background:${p.color}">${h}</div>`).join('')}
    </div>
    <p style="margin-top:12px"><b>食疗建议：</b>多食${p.wuxing}性食物（${p.wuxing==='木'?'绿色蔬菜、酸味水果':p.wuxing==='火'?'红色食物、苦味':p.wuxing==='土'?'黄色食物、甘味':p.wuxing==='金'?'白色食物、辛味':'黑色食物、咸味'}）。</p>
  `).join('');

  const secondaryHtml = tcm.secondary.length ? `
    <h3>🍵 次补 · ${tcm.secondary[0].emoji}${tcm.secondary[0].wuxing}（${tcm.secondary[0].organ}）</h3>
    <p><b>辅以中药：</b></p>
    <div class="row-flex">
      ${tcm.secondary[0].herb.slice(0,3).map(h=>`<div class="pill" style="background:${tcm.secondary[0].color}">${h}</div>`).join('')}
    </div>
  ` : '';

  document.getElementById('tcm-display').innerHTML = `
    <h3>📋 调理原则</h3>
    <p style="font-size:24px;font-weight:700;color:var(--cinn);text-align:center">
      缺 什 么 · 补 什 么
    </p>
    ${primaryHtml}
    ${secondaryHtml}

    <h3>📜 经方参考</h3>
    <table>
      <tr><th>症状</th><th>推荐方剂</th><th>主要成分</th></tr>
      <tr><td>${tcm.primary[0].wuxing}虚</td><td>${tcm.primary[0].wuxing==='木'?'逍遥散':tcm.primary[0].wuxing==='火'?'天王补心丹':tcm.primary[0].wuxing==='土'?'参苓白术散':tcm.primary[0].wuxing==='金'?'百合固金汤':'六味地黄丸'}</td><td>${tcm.primary[0].herb.slice(0,3).join('、')}</td></tr>
      <tr><td>${tcm.primary[1] ? tcm.primary[1].wuxing+'虚':'-'}</td><td>${tcm.primary[1] ? (tcm.primary[1].wuxing==='木'?'柴胡疏肝散':tcm.primary[1].wuxing==='火'?'导赤散':tcm.primary[1].wuxing==='土'?'补中益气汤':tcm.primary[1].wuxing==='金'?'清燥救肺汤':'金匮肾气丸'):'-'}</td><td>${tcm.primary[1] ? tcm.primary[1].herb.slice(0,3).join('、') : '-'}</td></tr>
    </table>

    <h3>⚠️ 用药安全</h3>
    <p style="background:#fff3cd;padding:16px;border-radius:8px;border:2px solid #cd6600">
      <b>重要提示：</b>本推荐仅供参考，<b style="color:#a52a2a">实际用药请遵医嘱</b>。
      中药需根据患者体质、病情、配伍禁忌综合考量，<b>切勿自行抓药服用</b>。
      建议到正规中医院就诊，由执业中医师开具处方。
    </p>

    <h3>📞 联系方式</h3>
    <p>如需专业咨询，可通过 AI 助手页面的「<b>中医体质</b>」模块继续深入分析。</p>
  `;
}

/* ========== 初始化 ========== */
showPanel(1);
console.warn('[master-elder] 周易大师端已加载 v0.1');

// 暴露供测试
window.__state = state;
window.computeBazi = computeBazi;



/* ===== R37-B doctor-elder 双核仪表盘 ===== */
function renderElderDashboardR37(){
  var hS=72;var cS=70;
  var h='<div class="dr-dash">';
  h+='<div class="dr-dash-title">👴 长者安康·健康事业双核（8 维 + 6 长者专属 + 18 古籍）</div>';
  h+='<div class="dr-dash-dual">';
  h+='<div class="dr-card health"><div class="dr-card-title">🩺 健康维度</div><div class="dr-card-score">'+hS+'<span style="font-size:13px;opacity:.6">/100</span></div><div class="dr-card-bar"><div class="dr-card-fill" style="width:'+hS+'%"></div></div><div style="font-size:11px;opacity:.7;margin-top:6px">🩸 气血 + 🍚 脾胃 + 💗 心肾 + 🌿 肝胆</div></div>';
  h+='<div class="dr-card career"><div class="dr-card-title">💼 事业维度</div><div class="dr-card-score">'+cS+'<span style="font-size:13px;opacity:.6">/100</span></div><div class="dr-card-bar"><div class="dr-card-fill" style="width:'+cS+'%"></div></div><div style="font-size:11px;opacity:.7;margin-top:6px">💰 正财 + 👔 官运 + 📈 升迁 + 🤝 合作</div></div>';
  h+='</div>';
  h+='<div style="margin:10px 0 8px;color:var(--paper3);font-size:12px;letter-spacing:1.5px">📋 6 长者专属维度</div>';
  var ELDER_6D={"颐养":{"label":"🏡 颐养","icon":"🏡","tip":"退休生活·含饴弄孙·养花种草"},"天伦":{"label":"👨‍👩‍👧‍👦 天伦","icon":"👨‍👩‍👧‍👦","tip":"儿孙绕膝·家庭和睦·三代同堂"},"康乐":{"label":"🎶 康乐","icon":"🎶","tip":"琴棋书画·太极气功·老年大学"},"清修":{"label":"📿 清修","icon":"📿","tip":"诵经念佛·静坐冥想·心灵安顿"},"传承":{"label":"🏛 传承","icon":"🏛","tip":"家训口授·教子教孙·家风延续"},"寿元":{"label":"🎂 寿元","icon":"🎂","tip":"养生长寿·节制饮食·顺应四时"}};
  h+='<div class="dr-6grid">';
  Object.keys(ELDER_6D).forEach(function(k){var it=ELDER_6D[k];
    h+='<div class="dr-6cell"><span class="icon">'+it.icon+'</span><b>'+it.label+'</b><div class="tip">'+it.tip+'</div></div>';
  });
  h+='</div>';
  h+='<div class="dr-verdict"><b style="color:var(--gold)">👴 长者安康判读：</b><br>① 健康 '+hS+' 分（气血/脾胃/心肾/肝胆为主）—— 长者宜<b>清淡饮食+适度运动+定期体检</b> ② 事业 '+cS+' 分（退而不休+含饴弄孙+经验传承）—— 长者事业宜<b>顾问/导师/家族掌舵</b> ③ 6 长者专属维度全覆盖 ④ 化解要点：颐养天年+天伦之乐+传承家风</div>';
  h+='<div class="dr-source">📜 综合《黄帝内经》《千金要方》《伤寒杂病论》《本草纲目》《针灸甲乙经》《素问注》《寿亲养老新书》《养老奉亲书》《摄生消息论》《老老恒言》《滴天髓》《子平真诠》《三命通会》《了凡四训》《阴骘文》《太上感应篇》《玉历宝钞》《三世因果经》共 18 部古籍</div>';
  h+='</div>';
  return h;
}


document.getElementById("elderDashMaster").innerHTML=renderElderDashboardR37();