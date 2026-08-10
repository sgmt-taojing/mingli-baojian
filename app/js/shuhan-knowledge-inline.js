
let BASIC = window.SHUHAN_KB || {};
let MIXUN = window.SHUHAN_MIXUN_TIANJI_KB || {};
let OCRKB = window.ShuhanBasicKB || {};
// 合并 OCR 全量内容到 BASIC
if (OCRKB.content) {
  BASIC.ocrContent = OCRKB.content;
  BASIC.ocrMixun = OCRKB.mixun;
  BASIC.ocrQuickRef = OCRKB.quickRef;
  BASIC.searchOcr = function(kw) { return OCRKB.search ? OCRKB.search(kw) : []; };
  BASIC.getOcrLesson = function(n) { return OCRKB.getLesson ? OCRKB.getLesson(n) : null; };
  BASIC.getOcrContext = function(kw, maxLen) { return OCRKB.getContext ? OCRKB.getContext(kw, maxLen) : []; };
}
let KB = {
  basic: BASIC,
  mixun: MIXUN,
  ocr: OCRKB
};

function escapeHTML(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

function renderLessonsGrid(){
  let html = '<div class="lesson-grid">';
  let lessons = (KB.basic && KB.basic.lessons) || {};
  Object.keys(lessons).forEach(function(k){
    if(!/^\d+$/.test(k))return;
    let n = parseInt(k);
    let title = lessons[k];
    html += '<ml-tap class="lesson-card" onclick="showLesson('+n+')" variant="card" role="button" tabindex="0">';
    html += '<div class="lesson-num">第 '+n+' 课</div>';
    html += '<div class="lesson-title">'+escapeHTML(title)+'</div>';
    html += '<div class="lesson-desc">点击查看详情</div>';
    html += '</ml-tap>';
  });
  html += '</div>';
  return html;
}

function renderLessonDetail(n){
  let c = (KB.basic && KB.basic.content && KB.basic.content['lesson_'+n]) || {};
  if(Object.keys(c).length===0){
    return '<div class="detail-panel"><div class="detail-title">第 '+n+' 课</div><div class="detail-body"><p>课程详细内容整理中...</p></div></div>';
  }
  let title = (KB.basic.lessons && KB.basic.lessons[n]) || ('第'+n+'课');
  let html = '<div class="detail-panel">';
  html += '<div class="detail-title">第 '+n+' 课 · '+escapeHTML(title)+'</div>';
  html += '<div class="detail-body">';
  Object.keys(c).forEach(function(k){
    let v = c[k];
    let keyLabel = k.replace(/_/g,' ');
    html += '<span class="sub-title">◆ '+escapeHTML(keyLabel)+'</span>';
    if(typeof v === 'string'){
      html += '<p>'+escapeHTML(v)+'</p>';
    }else if(Array.isArray(v)){
      html += '<ul>';
      v.forEach(function(it){
        if(typeof it === 'string'){
          html += '<li>'+escapeHTML(it)+'</li>';
        }else if(typeof it === 'object' && it){
          let parts = [];
          Object.keys(it).forEach(function(kk){
            parts.push('<b>'+kk+'：</b>'+escapeHTML(String(it[kk])));
          });
          html += '<li>'+parts.join(' · ')+'</li>';
        }
      });
      html += '</ul>';
    }else if(typeof v === 'object' && v){
      Object.keys(v).forEach(function(sk){
        let sv = v[sk];
        if(typeof sv === 'string'){
          html += '<p><b>'+escapeHTML(sk)+'：</b>'+escapeHTML(sv)+'</p>';
        }
      });
    }
  });
  html += '</div></div>';
  return html;
}

function showLesson(n){
  document.getElementById('content').innerHTML = renderLessonDetail(n);
  window.scrollTo({top:200,behavior:'smooth'});
}

function showMixun(){
  let html = '<div class="detail-panel"><div class="detail-title">密训班内容</div><div class="detail-body">';
  if(KB.mixun && KB.mixun.content){
    Object.keys(KB.mixun.content).forEach(function(k){
      let v = KB.mixun.content[k];
      html += '<span class="sub-title">◆ '+escapeHTML(k)+'</span>';
      if(typeof v === 'string'){
        html += '<p>'+escapeHTML(v)+'</p>';
      }else if(Array.isArray(v)){
        html += '<ul>';
        v.forEach(function(it){
          html += '<li>'+escapeHTML(typeof it==='string'?it:JSON.stringify(it))+'</li>';
        });
        html += '</ul>';
      }else if(typeof v === 'object' && v){
        Object.keys(v).forEach(function(sk){
          html += '<p><b>'+escapeHTML(sk)+'：</b>'+escapeHTML(typeof v[sk]==='string'?v[sk]:JSON.stringify(v[sk]))+'</p>';
        });
      }
    });
  }else{
    html += '<p>密训班内容整理中...</p>';
  }
  html += '</div></div>';
  document.getElementById('content').innerHTML = html;
}

function showTianji(){
  let html = '<div class="detail-panel"><div class="detail-title">天纪系列</div><div class="detail-body">';
  if(KB.mixun && KB.mixun.tianji){
    Object.keys(KB.mixun.tianji).forEach(function(k){
      let v = KB.mixun.tianji[k];
      html += '<span class="sub-title">◆ '+escapeHTML(k)+'</span>';
      if(typeof v === 'string'){
        html += '<p>'+escapeHTML(v)+'</p>';
      }else if(Array.isArray(v)){
        html += '<ul>';
        v.forEach(function(it){
          html += '<li>'+escapeHTML(typeof it==='string'?it:JSON.stringify(it))+'</li>';
        });
        html += '</ul>';
      }else if(typeof v === 'object' && v){
        Object.keys(v).forEach(function(sk){
          html += '<p><b>'+escapeHTML(sk)+'：</b>'+escapeHTML(typeof v[sk]==='string'?v[sk]:JSON.stringify(v[sk]))+'</p>';
        });
      }
    });
  }else{
    html += '<p>天纪内容整理中...</p>';
  }
  html += '</div></div>';
  document.getElementById('content').innerHTML = html;
}

function showQuickRef(){
  let q = (KB.basic && KB.basic.quickRef) || {};
  let html = '<div class="detail-panel"><div class="detail-title">速查表 · 经典术数体系</div><div class="detail-body">';
  Object.keys(q).forEach(function(k){
    let v = q[k];
    html += '<span class="sub-title">◆ '+escapeHTML(k)+'</span>';
    if(typeof v === 'string'){
      html += '<p>'+escapeHTML(v)+'</p>';
    }else if(Array.isArray(v)){
      html += '<ul>';
      v.forEach(function(it){
        html += '<li>'+escapeHTML(typeof it==='string'?it:JSON.stringify(it))+'</li>';
      });
      html += '</ul>';
    }else if(typeof v === 'object' && v){
      Object.keys(v).forEach(function(sk){
        html += '<p><b>'+escapeHTML(sk)+'：</b>'+escapeHTML(typeof v[sk]==='string'?v[sk]:JSON.stringify(v[sk]))+'</p>';
      });
    }
  });
  html += '</div></div>';
  document.getElementById('content').innerHTML = html;
}

function showOverview(){
  let lessonCount = (KB.basic && KB.basic.lessons) ? Object.keys(KB.basic.lessons).filter(function(k){return /^\d+$/.test(k);}).length : 0;
  let mixunKeys = KB.mixun ? Object.keys(KB.mixun.content || {}).length : 0;
  let tianjiKeys = KB.mixun ? Object.keys(KB.mixun.tianji || {}).length : 0;
  document.getElementById('content').innerHTML = 
    '<div class="detail-panel"><div class="detail-title">📚 舒晗奇门遁甲知识库</div><div class="detail-body">'+
    '<p>本知识库整合 <b style="color:var(--gold2)">舒晗奇门遁甲基础课</b> 32 节课程内容 + <b style="color:var(--gold2)">密训班</b>专项内容 + <b style="color:var(--gold2)">天纪系列</b>。</p>'+
    '<span class="sub-title">◆ 内容来源</span>'+
    '<ul>'+
    '<li>基础课 32 节 PPT 标题（已完整提取）</li>'+
    '<li>导图 PDF 13 份（提取文字 19,091 字）</li>'+
    '<li>密训班 PDF 8 份</li>'+
    '<li>天纪相关 PDF（部分）</li>'+
    '</ul>'+
    '<span class="sub-title">◆ 学习路径</span>'+
    '<ul>'+
    '<li>第一步：基础课 → 32 节系统学习</li>'+
    '<li>第二步：密训班 → 实战应用</li>'+
    '<li>第三步：天纪 → 高级拓展</li>'+
    '<li>速查表 → 随时查阅六维模型与五行生克</li>'+
    '</ul>'+
    '<span class="sub-title">◆ 核心术数体系</span>'+
    '<p>六维模型：天时(九星)+地利(九宫)+人和(八门)+神助(八神)+格局(天干)+周期(十二长生)</p>'+
    '</div></div>';
}

function doSearch(){
  let q = document.getElementById('globalSearch').value.trim().toLowerCase();
  if(!q){showOverview();return;}
  let results = [];
  function searchIn(obj, path){
    if(typeof obj === 'string'){
      if(obj.toLowerCase().indexOf(q)>-1){
        results.push({title:path,body:obj.substring(0,200)});
      }
    }else if(Array.isArray(obj)){
      obj.forEach(function(it,i){searchIn(it,path+'['+i+']');});
    }else if(typeof obj === 'object' && obj){
      Object.keys(obj).forEach(function(k){searchIn(obj[k],path+'.'+k);});
    }
  }
  searchIn(KB,'');
  let html = '<div class="detail-panel"><div class="detail-title">搜索 "'+escapeHTML(q)+'" — '+results.length+' 条结果</div><div class="detail-body">';
  if(results.length === 0){
    html += '<p>未找到匹配内容</p>';
  }else{
    results.slice(0,50).forEach(function(r){
      html += '<p style="margin-top:10px"><b>'+escapeHTML(r.title)+'</b></p>';
      html += '<p style="color:var(--paper3);font-size:12px">'+escapeHTML(r.body)+'</p>';
    });
  }
  html += '</div></div>';
  document.getElementById('content').innerHTML = html;
}

// 初始化统计
(function(){
  let lessonCount = (KB.basic && KB.basic.lessons) ? Object.keys(KB.basic.lessons).filter(function(k){return /^\d+$/.test(k);}).length : 0;
  document.getElementById('statRow').innerHTML = 
    '<div class="stat-card"><div class="stat-num">'+lessonCount+'</div><div class="stat-label">基础课节数</div></div>'+
    '<div class="stat-card"><div class="stat-num">'+(KB.basic && KB.basic.lessons && KB.basic.lessons.lessons || '—')+'</div><div class="stat-label">总课次</div></div>'+
    '<div class="stat-card"><div class="stat-num">'+(KB.mixun ? '✓' : '—')+'</div><div class="stat-label">密训班</div></div>'+
    '<div class="stat-card"><div class="stat-num">'+(KB.mixun && KB.mixun.tianji ? '✓' : '—')+'</div><div class="stat-label">天纪系列</div></div>';
})();

// 初始化主tabs
(function(){
  let tabs = [
    {id:'overview',name:'📋 总览',fn:showOverview},
    {id:'basic',name:'📚 32节基础课',fn:function(){
      document.getElementById('content').innerHTML = renderLessonsGrid();
    }},
    {id:'mixun',name:'🎓 密训班',fn:showMixun},
    {id:'tianji',name:'🌟 天纪系列',fn:showTianji},
    {id:'quickref',name:'🔖 速查表',fn:showQuickRef}
  ];
  let tabBar = document.getElementById('mainTabs');
  tabs.forEach(function(t){
    let btn = document.createElement('button');
    btn.className = 'tab';
    btn.textContent = t.name;
    btn.onclick = function(){
      document.querySelectorAll('.tab').forEach(function(b){b.classList.remove('active');});
      btn.classList.add('active');
      t.fn();
    };
    tabBar.appendChild(btn);
  });
  // 默认显示总览
  document.querySelector('.tab').classList.add('active');
  showOverview();
})();

document.getElementById('globalSearch').addEventListener('keydown',function(e){if(e.key==='Enter')doSearch();});


(function(){
  if (window.__r41_d_kb) return; window.__r41_d_kb = true;
  var sections = [
    {id:'rd-knowledge-h', title:'🩺 健康速查', score:'78分', color:'#4a9a6e', desc:'气血·脾胃·心肾·肝胆·睡眠·情绪·体质·寿元', tip:'八维均衡：少熬夜多运动；偏弱维度及时调理'},
    {id:'rd-knowledge-c', title:'💼 事业速查', score:'82分', color:'#4a8aa8', desc:'正财·偏财·官运·学业·创业·升迁·同事·合作', tip:'八维共进：抓住升迁窗口，偏财慎行'}
  ];
  var html = '';
  sections.forEach(function(s){
    html += '<div class="bazi-module"><ml-tap class="bazi-module-title collapsed" onclick="toggleBaziModule(this)" style="border-left:4px solid '+s.color+'" variant="card" role="button" tabindex="0">'+s.title+' <span class="toggle-icon">▼</span></ml-tap>';
    html += '<div class="bazi-module-content"><div style="padding:12px"><span style="font-size:1.4em;font-weight:bold;color:'+s.color+'">'+s.score+'</span><p>'+s.desc+'</p><p><b>建议：</b>'+s.tip+'</p></div></div></div>';
  });
  var anchor = document.querySelector('.container, .content, main, body');
  if (anchor) {
    var div = document.createElement('div');
    div.id = 'r41-d-knowledge-core';
    div.innerHTML = html;
    anchor.insertBefore(div, anchor.firstChild);
  }
})();
