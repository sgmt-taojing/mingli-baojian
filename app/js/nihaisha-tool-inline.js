
// 加载知识库
let KB = window.NIHAISHA_KB || {};
// 蒸馏版KB已内置全部模块

window.NIHAISHA_KB = KB;
var _ld=document.getElementById('kbLoading');if(_ld)_ld.style.display='none';

// 模块定义（按分类）
let MODULES = [
  // 课程模块
  {id:'index',cat:'course',icon:'📋',title:'总览',desc:'知识库总览与索引',meta:'6 keys'},
  {id:'tianji',cat:'course',icon:'🌟',title:'天纪',desc:'易经八卦、紫微斗数、阳宅风水、命运与术数',meta:'18.7KB'},
  {id:'shanghanlun',cat:'course',icon:'📖',title:'伤寒论',desc:'六经辨证、方证对应、症状索引、逐课学习地图',meta:'6.4KB'},
  {id:'jingui',cat:'course',icon:'📜',title:'金匮要略',desc:'杂病、妇科、痰饮、水气、黄疸、胸痹、虚劳',meta:'16.3KB'},
  {id:'huangdi',cat:'course',icon:'🏺',title:'黄帝内经',desc:'五行养生、脏腑理论、经络系统',meta:'17.9KB'},
  {id:'bencao',cat:'course',icon:'🌱',title:'神农本草',desc:'药性理论、剂型、配伍、单味药线索',meta:'13.7KB'},
  {id:'acupuncture',cat:'course',icon:'📌',title:'针灸大成',desc:'经络穴位、配穴思路、针灸大成',meta:'29.3KB'},
  {id:'bagang',cat:'course',icon:'⚖️',title:'八纲辨证',desc:'阴阳表里寒热虚实的辨证体系',meta:'24.3KB'},
  {id:'zhongjing-xinfa',cat:'course',icon:'🔮',title:'仲景心法',desc:'经方心法、病机推演、眼诊、癌症/重症观点',meta:'6.8KB'},
  {id:'fuyang',cat:'course',icon:'☀️',title:'扶阳论坛',desc:'扶阳理论、附子/硫磺、重症/癌症/尿毒症',meta:'6.1KB'},
  {id:'yijinjing',cat:'course',icon:'🧘',title:'易筋经',desc:'五脏逼毒法、文式/武式易筋经、呼吸心法',meta:'5.0KB'},
  {id:'liangdong',cat:'course',icon:'📺',title:'梁冬对话',desc:'梁冬与倪师对话、国学堂访谈',meta:'7.8KB'},
  {id:'stanford',cat:'course',icon:'🎓',title:'斯坦福演讲',desc:'倪师斯坦福大学演讲、中医传播',meta:'3.5KB'},
  // 临床与方证
  {id:'clinical-cases',cat:'clinical',icon:'📋',title:'临床案例',desc:'倪师医案、诊疗日志、辨证思路',meta:'33.8KB'},
  {id:'formula-patterns',cat:'clinical',icon:'💊',title:'方证对应',desc:'方剂与证候的对应关系、经方运用',meta:'4.0KB'},
  {id:'symptom-index',cat:'clinical',icon:'🩺',title:'症状索引',desc:'按症状反查方剂与课程',meta:'2.9KB'},
  {id:'six-channel',cat:'clinical',icon:'☯️',title:'六经辨证',desc:'太阳阳明少阳太阴少阴厥阴辨证体系',meta:'2.9KB'},
  // 学习入口
  {id:'lesson-map',cat:'course',icon:'🗺️',title:'课次地图',desc:'逐课学习路线图、课程索引',meta:'8.8KB'},
  {id:'learning-entry',cat:'course',icon:'📚',title:'学习入口',desc:'学习路径、入门指引',meta:'4.2KB'},
  {id:'beginner-questions',cat:'course',icon:'💬',title:'初学问答',desc:'中医入门常见问题解答',meta:'3.4KB'},
  {id:'usage-scenarios',cat:'course',icon:'🎯',title:'使用场景',desc:'知识库应用场景与检索指南',meta:'2.4KB'},
  {id:'ebooks',cat:'course',icon:'📖',title:'电子书',desc:'倪师推荐书目、电子书资源',meta:'4.0KB'},
  {id:'audio-collection',cat:'course',icon:'🎧',title:'音频合集',desc:'倪师课程音频资源汇总',meta:'9.5KB'},
  // 笔记模块
  {id:'notes-shanghan',cat:'notes',icon:'📝',title:'伤寒笔记',desc:'伤寒论学习笔记精华',meta:'2.9KB'},
  {id:'notes-jingui',cat:'notes',icon:'📝',title:'金匮笔记',desc:'金匮要略学习笔记精华',meta:'2.6KB'},
  {id:'notes-huangdi',cat:'notes',icon:'📝',title:'内经笔记',desc:'黄帝内经学习笔记精华',meta:'3.8KB'},
  {id:'notes-bencao',cat:'notes',icon:'📝',title:'本草笔记',desc:'神农本草学习笔记精华',meta:'4.7KB'},
  {id:'notes-acupuncture-dacheng',cat:'notes',icon:'📝',title:'针灸笔记',desc:'针灸大成学习笔记精华',meta:'2.3KB'},
  {id:'notes-shanghan-scan-essence',cat:'notes',icon:'🔍',title:'伤寒扫描精华',desc:'伤寒论板书扫描精华',meta:'2.5KB'},
  {id:'notes-bencao-scan-essence',cat:'notes',icon:'🔍',title:'本草扫描精华',desc:'本草板书扫描精华',meta:'64.2KB'},
  {id:'notes-huangdi-scan-essence',cat:'notes',icon:'🔍',title:'内经扫描精华',desc:'内经板书扫描精华',meta:'4.4KB'},
  {id:'notes-acupuncture-dacheng-scan-essence',cat:'notes',icon:'🔍',title:'针灸扫描精华',desc:'针灸大成板书扫描精华',meta:'4.5KB'},
  // 截图证据
  // 其他
  {id:'crossModuleThemes',cat:'other',icon:'🔗',title:'跨模块主题',desc:'胃气、阳气、同症同治、治未病等主题',meta:'0.3KB'},
  {id:'mingliCorrelation',cat:'other',icon:'🔮',title:'命理关联',desc:'命理五行与中医肝心脾肺肾关联',meta:'0.4KB'}
];

// 搜索关键词映射（用于模块快速检索）
let MOD_KEYWORDS = {
  'shanghanlun':['伤寒论','六经','太阳','阳明','少阳','太阴','少阴','厥阴','麻黄汤','桂枝汤','青龙汤','柴胡汤'],
  'jingui':['金匮','杂病','妇科','痰饮','水气','黄疸','胸痹','虚劳'],
  'tianji':['天纪','紫微','风水','易经','八卦','阳宅','斗数'],
  'huangdi':['黄帝内经','五行','脏腑','经络','养生'],
  'bencao':['本草','药性','剂型','配伍'],
  'acupuncture':['针灸','穴位','经络','合谷','足三里','曲池'],
  'clinical-cases':['临床','医案','案例','诊疗'],
  'bagang':['八纲','阴阳','表里','寒热','虚实'],
  'zhongjing-xinfa':['仲景','心法','眼诊','癌症','重症'],
  'fuyang':['扶阳','附子','硫磺','阳气','尿毒症'],
  'yijinjing':['易筋经','逼毒','呼吸','五脏','导引'],
  'liangdong':['梁冬','对话','国学','访谈'],
  'stanford':['斯坦福','演讲','中医传播'],
  'six-channel':['六经','太阳','阳明','少阳','太阴','少阴','厥阴'],
  'formula-patterns':['方证','方剂','证候','经方'],
  'symptom-index':['症状','发热','头痛','失眠','便秘','咳嗽'],
  'lesson-map':['课次','课程','地图','学习路线'],
  'learning-entry':['学习','入口','入门','路径'],
  'beginner-questions':['初学','问答','入门','常见问题'],
  'usage-scenarios':['使用','场景','检索','指南'],
  'ebooks':['电子书','书目','资源','推荐'],
  'audio-collection':['音频','录音','合集','MP3'],
  'crossModuleThemes':['胃气','阳气','同症同治','治未病'],
  'mingliCorrelation':['命理','五行','肝心脾肺肾','关联']
};

let currentCategory = 'all';
let grid = document.getElementById('modulesGrid');
let searchResults = document.getElementById('searchResults');
let detailArea = document.getElementById('detailArea');

// 渲染模块卡片
function renderModules(cat) {
  grid.innerHTML = '';
  detailArea.innerHTML = '';
  searchResults.innerHTML = '';
  let filtered = cat === 'all' ? MODULES : MODULES.filter(function(m){return m.cat === cat;});
  filtered.forEach(function(m) {
    let card = document.createElement('div');
    card.className = 'module-card';
    card.innerHTML = '<div class="module-icon">' + m.icon + '</div>' +
      '<div class="module-title">' + m.title + '</div>' +
      '<div class="module-desc">' + m.desc + '</div>' +
      '<div class="module-meta">' + m.meta + '</div>';
    card.onclick = function() { openModule(m.id); };
    grid.appendChild(card);
  });
  grid.style.display = 'grid';
}

// 分类切换
document.querySelectorAll('.cat-tab').forEach(function(btn) {
  btn.onclick = function() {
    document.querySelectorAll('.cat-tab').forEach(function(b){b.classList.remove('active');});
    btn.classList.add('active');
    currentCategory = btn.dataset.cat;
    renderModules(currentCategory);
    document.getElementById('searchInput').value = '';
  };
});

// 打开模块
function openModule(modId) {
  let mod = MODULES.find(function(m){return m.id === modId;});
  if (!mod) return;
  let keywords = MOD_KEYWORDS[modId] || [];
  if (keywords.length > 0) {
    document.getElementById('searchInput').value = keywords[0];
    doSearch();
  } else {
    showModuleDetail(modId);
  }
}

// 显示模块详情
function showModuleDetail(modId) {
  grid.style.display = 'none';
  searchResults.innerHTML = '';
  detailArea.innerHTML = '';
  
  let data = KB[modId];
  let mod = MODULES.find(function(m){return m.id === modId;});
  
  let html = '<div class="detail-back"><button onclick="backToGrid()">← 返回模块列表</button></div>';
  
  if (!data) {
    html += '<div class="detail-panel"><div class="detail-title">' + (mod ? mod.icon + ' ' + mod.title : modId) + '</div><div class="detail-body"><p>该模块内容正在整理中...</p></div></div>';
  } else {
    html += '<div class="detail-panel"><div class="detail-title">' + (mod ? mod.icon + ' ' + mod.title : modId) + '</div><div class="detail-body">';
    html += renderValue(data, 0);
    html += '</div></div>';
  }
  
  detailArea.innerHTML = html;
  detailArea.scrollIntoView({behavior:'smooth'});
}

// 返回网格
function backToGrid() {
  detailArea.innerHTML = '';
  grid.style.display = 'grid';
}

// HTML转义
function escapeHTML(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// 渲染值
function renderValue(v, depth) {
  if (v === null || v === undefined) return '<p>—</p>';
  let html = '';
  if (typeof v === 'string') {
    html += '<p>' + escapeHTML(v) + '</p>';
  } else if (Array.isArray(v)) {
    html += '<ul>';
    v.forEach(function(it) {
      if (typeof it === 'string') {
        html += '<li>' + escapeHTML(it) + '</li>';
      } else if (typeof it === 'object' && it) {
        let parts = [];
        if (it.title) parts.push('<b>' + escapeHTML(it.title) + '</b>');
        if (it.name) parts.push('<b>' + escapeHTML(it.name) + '</b>');
        if (it.desc) parts.push(escapeHTML(it.desc));
        if (it.content) parts.push(escapeHTML(it.content));
        if (it.theory) parts.push(escapeHTML(it.theory));
        if (it.fang) parts.push('方剂：<b>' + escapeHTML(it.fang) + '</b>');
        if (it.zheng) parts.push('证候：' + escapeHTML(it.zheng));
        if (it.jiaoji) parts.push('禁忌：' + escapeHTML(it.jiaoji));
        if (it.source) parts.push('<i style="color:var(--paper3)">来源：' + escapeHTML(it.source) + '</i>');
        for (var k in it) {
          if (['title','name','desc','content','theory','fang','zheng','jiaoji','source','tip'].indexOf(k) < 0) {
            parts.push('<b>' + k + '：</b>' + escapeHTML(typeof it[k] === 'string' ? it[k] : JSON.stringify(it[k])));
          }
        }
        html += '<li>' + parts.join(' · ') + '</li>';
      } else {
        html += '<li>' + escapeHTML(String(it)) + '</li>';
      }
    });
    html += '</ul>';
  } else if (typeof v === 'object' && v) {
    Object.keys(v).forEach(function(key) {
      let sv = v[key];
      html += '<span class="sub-title">◆ ' + escapeHTML(key) + '</span>';
      if (typeof sv === 'string') {
        html += '<p>' + escapeHTML(sv) + '</p>';
      } else if (Array.isArray(sv)) {
        html += '<ul>';
        sv.forEach(function(it) {
          if (typeof it === 'string') {html += '<li>' + escapeHTML(it) + '</li>';}
          else if (typeof it === 'object' && it) {
            let parts = [];
            for (var k in it) {
              if (typeof it[k] === 'string') {parts.push('<b>' + k + '：</b>' + escapeHTML(it[k]));}
            }
            html += '<li>' + parts.join(' · ') + '</li>';
          } else {html += '<li>' + escapeHTML(String(it)) + '</li>';}
        });
        html += '</ul>';
      } else if (typeof sv === 'object' && sv) {
        html += '<div style="margin-left:12px;padding-left:12px;border-left:2px solid var(--border)">';
        html += renderValue(sv, depth + 1);
        html += '</div>';
      } else {
        html += '<p>' + escapeHTML(String(sv)) + '</p>';
      }
    });
  } else {
    html += '<p>' + escapeHTML(String(v)) + '</p>';
  }
  return html;
}

// 搜索
function doSearch() {
  let q = document.getElementById('searchInput').value.trim().toLowerCase();
  if (!q) {backToGrid(); return;}
  
  grid.style.display = 'none';
  detailArea.innerHTML = '';
  
  let results = [];
  let searchIn = function(obj, path) {
    if (typeof obj === 'string') {
      if (obj.toLowerCase().indexOf(q) > -1) {
        results.push({title: path, body: obj.substring(0, 200), source: path});
      }
    } else if (Array.isArray(obj)) {
      obj.forEach(function(it, i) {searchIn(it, path + '[' + i + ']');});
    } else if (typeof obj === 'object' && obj) {
      Object.keys(obj).forEach(function(k) {searchIn(obj[k], path + '.' + k);});
    }
  };
  searchIn(KB, '');
  
  let html = '<div class="detail-back"><button onclick="backToGrid()">← 返回模块列表</button></div>';
  
  if (results.length === 0) {
    html += '<div class="result-panel visible"><div class="result-empty">未找到包含"' + escapeHTML(q) + '"的内容。请尝试其他关键词。</div></div>';
  } else {
    html += '<div class="detail-panel"><div class="detail-title">搜索"' + escapeHTML(q) + '"（' + results.length + '条结果）</div></div>';
    results.slice(0, 50).forEach(function(r) {
      html += '<div class="search-result-item">';
      html += '<div class="sr-title">' + escapeHTML(r.title) + '</div>';
      html += '<div class="sr-body">' + escapeHTML(r.body) + '</div>';
      html += '<div class="sr-source">来源：' + escapeHTML(r.source) + '</div>';
      html += '</div>';
    });
    if (results.length > 50) {
      html += '<p style="text-align:center;color:var(--paper3);font-size:12px;padding:12px">还有 ' + (results.length - 50) + ' 条结果未显示，请细化搜索关键词</p>';
    }
  }
  
  searchResults.innerHTML = html;
  searchResults.scrollIntoView({behavior:'smooth'});
}

// 回车搜索
document.getElementById('searchInput').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') doSearch();
});

// 初始渲染
renderModules('all');
