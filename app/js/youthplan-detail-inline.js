
const GRADE_MAP = {kindergarten:'学龄前',primary:'小学',junior:'初中',senior:'高中',college:'大学'};
const GRADE_AGE = {kindergarten:'3-6岁',primary:'7-12岁',junior:'13-15岁',senior:'16-18岁',college:'19-22岁'};
const GRADE_ORDER = ['kindergarten','primary','junior','senior','college'];
const GRADE_FOCUS = {
  kindergarten:['体能开发','感官刺激','亲子陪伴','社交启蒙'],
  primary:['学科基础','阅读习惯','兴趣培养','学习方法'],
  junior:['学科深化','青春期心理','学习方法','自我认知'],
  senior:['选科决策','目标院校','压力管理','专业启蒙'],
  college:['专业方向','社会实践','人际网络','职业规划']
};
const SCORE_MAP = {excellent:['优秀',92],good:['良好',80],average:['一般',68],needImprove:['待提高',55]};

function generate(){
  const btn = document.getElementById('genBtn');
  btn.disabled = true; btn.textContent = '⏳ 生成中...';
  setTimeout(() => {
    try {
      const name = document.getElementById('yName').value.trim() || '孩子';
      const grade = document.getElementById('yGrade').value;
      const scoreKey = document.getElementById('yScore').value;
      const birthplace = document.getElementById('yBirthplace').value.trim();
      const residence = document.getElementById('yResidence').value.trim();
      const expect = document.getElementById('yExpect').value.trim();
      render(name, grade, scoreKey, birthplace, residence, expect);
      btn.disabled = false; btn.textContent = '🔄 重新生成';
    } catch(e) {
      alert('生成失败：' + e.message);
      btn.disabled = false; btn.textContent = '✨ 生成专属规划';
    }
  }, 250);
}

function render(name, grade, scoreKey, birthplace, residence, expect){
  const curIdx = GRADE_ORDER.indexOf(grade);
  const curGrade = GRADE_MAP[grade];
  const curAge = GRADE_AGE[grade];
  const curFocus = GRADE_FOCUS[grade];
  const [scoreLabel, scoreNum] = SCORE_MAP[scoreKey];
  const domains = [
    {name:'学科',icon:'📖',score:Math.min(95, scoreNum + 5)},
    {name:'兴趣',icon:'🎨',score:Math.max(50, scoreNum - 3)},
    {name:'性格',icon:'💡',score:Math.min(95, scoreNum + 2)},
    {name:'健康',icon:'🏃',score:Math.min(95, scoreNum + 8)}
  ];
  const actions = [
    `【${curGrade}首要】${curFocus[0]}`,
    `每周 ${curFocus[1]} 至少 3 次`,
    `每周 ${curFocus[2]} 计划执行`,
    `建立 ${curFocus[3]} 机制`,
    expect ? `家长跟进：${expect}` : `与家长每周沟通学习进展`,
    `规律作息，确保 ${curAge} 充足睡眠`,
    `每周 ${curFocus[0]} 打卡记录`,
    `每 3 个月回顾一次进展`,
    `若 ${curAge} 期成绩波动，及时寻求帮助`,
    `保持积极心态，建立成长型思维`
  ];

  let h = '<div class="banner"><div class="name">🧒 '+name+' 青少年专属规划</div><div class="meta">当前阶段：<b>'+curGrade+'</b>（'+curAge+'）· 学业：<b>'+scoreLabel+'</b> · 评估：<b>'+scoreNum+'</b> 分</div></div>';

  // 当前重点
  h += '<div class="card"><h2>📌 当前阶段重点</h2><div class="tags">';
  curFocus.forEach(f => h += '<span class="tag">'+f+'</span>');
  h += '</div>';
  if (expect) h += '<p style="font-size:12px;opacity:.7;margin-top:8px">💬 家长期望：'+expect+'</p>';
  h += '</div>';

  // 时间轴
  h += '<div class="card"><h2>📊 人生时间轴</h2><div class="timeline">';
  GRADE_ORDER.forEach((g, i) => {
    if (i < curIdx) return;  // 跳过早于当前的
    const isActive = i === curIdx;
    h += '<div class="tl-node'+(isActive?' active':'')+'">'+GRADE_MAP[g]+'<small>'+GRADE_AGE[g]+'</small></div>';
    if (i < GRADE_ORDER.length - 1) h += '<span class="tl-arrow">→</span>';
  });
  h += '</div></div>';

  // 领域评分
  h += '<div class="card"><h2>🏅 发展领域评分</h2><div class="domains">';
  domains.forEach(d => {
    h += '<div class="dom"><div class="ico">'+d.icon+'</div><div class="nm">'+d.name+'</div><div class="num">'+d.score+'</div><div class="bar"><div class="bar-fill" style="width:'+d.score+'%"></div></div></div>';
  });
  h += '</div></div>';

  // 行动清单
  h += '<div class="card"><h2>✅ '+curGrade+'阶段行动清单</h2><ol class="ol">';
  actions.forEach(a => h += '<li>'+a+'</li>');
  h += '</ol></div>';

  // 地域
  if (birthplace || residence) {
    h += '<div class="card"><h2>🏙️ 地域提示</h2><div class="loc">';
    h += '出生地 <b>'+birthplace+'</b> · 现居 <b>'+residence+'</b>';
    if (birthplace && residence) {
      h += '<br>'+(birthplace===residence ? '✅ 就近教育、熟悉环境' : '⚡ 迁移需适应期、也可能带来新机会');
    }
    h += '</div></div>';
  }

  // 工具
  h += '<div class="tools" id="tools">';
  h += '<button onclick="shareUrl()">🔗 分享链接</button>';
  h += '<button onclick="window.print()">🖨️ 打印/保存 PDF</button>';
  h += '<button onclick="copyTxt()">📋 复制文本</button>';
  h += '</div>';

  document.getElementById('report').innerHTML = h;
  document.getElementById('report').classList.add('show');
  document.getElementById('input').style.display = 'none';
  buildShareUrl({n:name, g:grade, s:scoreKey, b:birthplace, r:residence, e:expect});
  location.hash = '#'+btoa(unescape(encodeURIComponent(JSON.stringify({n:name, g:grade, s:scoreKey, b:birthplace, r:residence, e:expect}))));
}

function buildShareUrl(d){
  const hash = location.hash || '#'+btoa(unescape(encodeURIComponent(JSON.stringify(d))));
  if (!location.hash) history.replaceState(null,'','#'+btoa(unescape(encodeURIComponent(JSON.stringify(d)))));
}

function restoreFromHash(){
  const h = location.hash.slice(1);
  if (!h) return;
  try {
    const d = JSON.parse(decodeURIComponent(escape(atob(h))));
    if (d.n) document.getElementById('yName').value = d.n;
    if (d.g) document.getElementById('yGrade').value = d.g;
    if (d.s) document.getElementById('yScore').value = d.s;
    if (d.b) document.getElementById('yBirthplace').value = d.b;
    if (d.r) document.getElementById('yResidence').value = d.r;
    if (d.e) document.getElementById('yExpect').value = d.e;
    generate();
  } catch(e) { console.warn('hash parse fail', e); }
}

function shareUrl(){
  const url = location.href;
  if (navigator.share) {
    navigator.share({title:'青少年专属规划',url:url}).catch(()=>{});
  } else if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(()=>{showToast('链接已复制')});
  } else {
    prompt('复制此链接分享：', url);
  }
}

function copyTxt(){
  const r = document.getElementById('report');
  let txt = r.innerText;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(txt).then(()=>showToast('报告已复制'));
  }
}

function showToast(msg){
  const t = document.createElement('div');
  t.textContent = msg;
  t.style.cssText='position:fixed;bottom:30px;left:50%;transform:translateX(-50%);background:rgba(201,168,76,.9);color:#0a0a0a;padding:10px 24px;border-radius:8px;font-size:14px;z-index:1000;box-shadow:0 4px 12px rgba(0,0,0,.3)';
  document.body.appendChild(t);
  setTimeout(()=>t.remove(), 1800);
}

// 加载时尝试恢复 hash
window.addEventListener('DOMContentLoaded', restoreFromHash);
