
(function(){
  var LEVEL_COLOR = {premium:'#e74c3c',registered:'#3498db',member:'#2ecc71',professional:'#9b59b6',admin:'#f39c12',public:'#1abc9c'};
  var LEVEL_LABEL = {premium:'Premium',registered:'Registered',member:'Member',professional:'Professional',admin:'Admin',public:'Public'};
  var ALL_NODES = [], ALL_EDGES = [], network = null;

  async function load(){
    // 使用 fetch（现代浏览器/移动端/Edge/Firefox/Chrome/Safari 均内置）
    var r = await fetch('/api/kb/graph', {cache:'no-cache'});
    var j = await r.json();
    if(j.code !== 0){ document.getElementById('stat').textContent='加载失败'; return; }
    var d = j.data;
    ALL_NODES = d.nodes.map(function(n){
      return {id:n.id, label:n.name||n.id, title:'【'+LEVEL_LABEL[n.level]||n.level+'】\nxref:'+(n.xref_count||0)+'  被引用:'+(n.referenced||0)+'  命中:'+(n.hit_count||0)+'\n'+n.id, group:n.level, value:n.xref_count||1, color:{background:LEVEL_COLOR[n.level]||'#888',border:'#c9a84c'}};
    });
    ALL_EDGES = d.edges.map(function(e){ return {from:e.source, to:e.target, value:Math.min(e.weight,16), arrows:'to', color:{color:'rgba(201,168,76,.35)',highlight:'#c9a84c'}}; });
    document.getElementById('stat').innerHTML = '模块 <b>' + d.stats.total_modules + '</b> · 引用边 <b>' + d.stats.total_xrefs + '</b> · 孤立 <b>' + (d.stats.isolated||[]).length + '</b>';
    renderLegend(d.stats.by_level);
    draw(ALL_NODES, ALL_EDGES);
    fillModFilter();
  }

  function draw(nodes, edges){
    var container = document.getElementById('graph');
    var data = {nodes: new vis.DataSet(nodes), edges: new vis.DataSet(edges)};
    var opts = {
      physics:{barnesHut:{gravitationalConstant:-4200,springLength:140,springConstant:.04},stabilization:{iterations:120}},
      layout:{improvedLayout:true},
      interaction:{hover:true,tooltipDelay:200,navigationButtons:true,keyboard:{enabled:true}},
      nodes:{shape:'dot',font:{face:'Noto Serif SC',color:'#f0e6d3',size:13},borderWidth:2,shadow:{enabled:true,color:'rgba(0,0,0,.6)',size:8}},
      edges:{smooth:{type:'continuous'},width:.6,font:{face:'Noto Serif SC',color:'#f0e6d3',size:10,strokeWidth:3,align:'top'}},
    };
    if(network){ network.destroy(); }
    network = new vis.Network(container, data, opts);
    network.on('click', function(p){
      if(p.nodes.length){
        var n = ALL_NODES.find(function(x){return x.id===p.nodes[0];});
        if(n){ showModal(n); }
      }
    });
    network.fit({animation:{duration:600,easingFunction:'easeInOutQuad'}});
  }

  function renderLegend(byLevel){
    var el = document.getElementById('legend');
    el.innerHTML = '';
    Object.keys(LEVEL_LABEL).forEach(function(k){
      var count = (byLevel && byLevel[k]) || 0;
      if(count === 0 && k !== 'public') return;
      var item = document.createElement('div');
      item.className = 'legend-item';
      item.innerHTML = '<span class="legend-dot" style="background:'+(LEVEL_COLOR[k]||'#888')+'"></span><span>'+LEVEL_LABEL[k]+' ('+count+')</span>';
      el.appendChild(item);
    });
  }

  function highlightHubs(){
    var hubIds = [];
    ALL_NODES.forEach(function(n){ if(n.value >= 16) hubIds.push(n.id); });
    if(!hubIds.length){ alert('无热点节点'); return; }
    var nodes = ALL_NODES.map(function(n){ return {id:n.id, opacity:n.value >= 16 ? 1 : .15}; });
    var edges = ALL_EDGES.map(function(e){ return {from:e.from, to:e.to, opacity:(hubIds.includes(e.from)||hubIds.includes(e.to)) ? 1 : .1}; });
    draw(nodes, edges);
  }

  // R37: 调用 /api/kb/recommend 高亮关联图谱节点
  var _currentRecs = [];
  var _currentRecSource = null;
  async function highlightRecs(){
    var mod = document.getElementById('recModFilter').value;
    if(!mod){ alert('请先选择模块'); return; }
    _currentRecSource = mod;
    try {
      var r = await fetch('/api/kb/recommend?module=' + encodeURIComponent(mod) + '&limit=8', {cache:'no-cache'});
      var j = await r.json();
      var d = j.data || j;
      _currentRecs = (d.recommendations || []).map(function(x){ return x.id; });
      if(!_currentRecs.length){ alert('该模块暂无推荐'); return; }
      // 高亮：source 模块 + 推荐图谱 id 在画布中已存在则高亮
      var focus = new Set([mod].concat(_currentRecs));
      var hitCount = 0;
      var nodes = ALL_NODES.map(function(n){
        var inFocus = focus.has(n.id);
        if(inFocus) hitCount++;
        return {id:n.id, opacity:inFocus ? 1 : .12, borderWidth:inFocus?3:1, color:inFocus ? {background:'#9333ea',border:'#c9a84c'} : {background:'#444',border:'#666'}};
      });
      var edges = ALL_EDGES.map(function(e){
        var inFocus = focus.has(e.from) || focus.has(e.to);
        return {from:e.from, to:e.to, opacity:inFocus ? .9 : .05, color:inFocus ? {color:'#9333ea'} : {color:'rgba(201,168,76,.1)'}};
      });
      draw(nodes, edges);
      document.getElementById('stat').innerHTML = '模块 <b>' + mod + '</b> 推荐 <b>' + _currentRecs.length + '</b> · 画布命中 <b>' + hitCount + '</b>';
    } catch(e){ console.warn('[R37] recommend err', e); alert('推荐接口调用失败'); }
  }

  // 把模块下拉填充（从 ALL_NODES 取，排除图谱节点）
  function fillModFilter(){
    var sel = document.getElementById('recModFilter');
    if(!sel || !ALL_NODES.length) return;
    var seen = new Set();
    var mods = [];
    ALL_NODES.forEach(function(n){
      if(n.group === 'premium' || n.group === 'registered' || n.group === 'admin'){
        var modId = n.id.replace(/-knowledge-base$|-kb$|-database.*$/,'');
        if(!seen.has(modId) && modId.length > 1){
          seen.add(modId);
          mods.push({id: modId, name: n.label});
        }
      }
    });
    // 静态补几个常见模块
    ['bazi','ziwei','qimen','liuyao','meihua','liuren','fengshui','zhongyi','tcm','xingming','wuxing','shihan','yongshi','mobile','ganqing','shiye','caiyun','music','lifeindex','lifeplan','zeri','huangli','taisui','yanzhi','mingxiang','nihaisha','shuhan','faith'].forEach(function(m){
      if(!seen.has(m)){ seen.add(m); mods.push({id:m, name:m}); }
    });
    mods.forEach(function(m){
      var op = document.createElement('option');
      op.value = m.id;
      op.textContent = '🔮 ' + m.name;
      sel.appendChild(op);
    });
  }

  function resetView(){
    draw(ALL_NODES.slice(), ALL_EDGES.slice());
  }
  function fitGraph(){ if(network) network.fit({animation:{duration:500}}); }

  // R48 拼音首字母映射表（覆盖常用模块关键词）
  var PINYIN_MAP = {
    '八字':'bz','bazi':'bz','六壬':'lr','liuren':'lr','紫微':'zw','ziwei':'zw',
    '奇门':'qm','qimen':'qm','六爻':'ly','liuyao':'ly','梅花':'mh','meihua':'mh',
    '风水':'fs','fengshui':'fs','中医':'zy','zhongyi':'zy','tcm':'zy','五行':'wx','wuxing':'wx',
    '命理':'ml','mingli':'ml','占卜':'zb','占卜':'zb','择日':'zr','zeri':'zr',
    '黄历':'hl','huangli':'hl','太岁':'ts','taisui':'ts','面相':'mx','mianxiang':'mx',
    '手相':'sx','shouxiang':'sx','姓名':'xm','xingming':'xm','运势':'ys','财运':'cy',
    '事业':'sy','感情':'gq','婚姻':'hy','学业':'xy','健康':'jk','胎元':'ty',
    '流年':'ln','大运':'dy','神煞':'ss','十神':'ss','格局':'gj','用神':'ys',
    '纳音':'ny','节气':'jq','时辰':'sc','生肖':'sx','星座':'xz','塔罗':'tl',
    '生命':'sm','数字':'sz','姓名学':'xmx','起名':'qm','改名':'gm',
    '周易':'zy','易经':'yj','yijing':'yj','卦象':'gx','爻辞':'yc','象数':'xs',
    '飞星':'fx','飞星':'fx','星盘':'xp','宫位':'gw','星曜':'xy','四化':'sh',
    '三式':'ss','太乙':'ty','奇门':'qm','六壬':'lr','遁甲':'dj',
    '梅花易数':'mhys','金锁玉关':'jsyg','玄空':'xk','八宅':'bz',
    '杨公':'yg','赖公':'lg','天星':'tx','罗盘':'lp','龙穴':'lx','砂水':'ss',
    '藏历':'zl','傣历':'dl','回历':'hl','彝历':'yl','苗历':'ml',
    '时家奇门':'sjqm','日家奇门':'rjqm','月家奇门':'yjqm','年家奇门':'njqm',
    '拆补法':'cbf','置闰法':'zrf','超神':'cs','接气':'jq','遁甲':'dj',
    '鬼门':'gm','开门':'km','休门':'xm','生门':'sm','伤门':'sm','杜门':'dm','景门':'jm','死门':'sm','惊门':'jm',
    '青龙':'ql','白虎':'bh','朱雀':'zq','玄武':'xw','勾陈':'gc','螣蛇':'ts',
    '天干':'tg','地支':'dz','六十甲子':'lsjz','旬空':'xk','空亡':'kw',
    '命盘':'mp','盘面':'pm','宫位':'gw','十二宫':'seg','命宫':'mg','身宫':'sg',
    '福财':'fc','官禄':'gl','迁移':'qy','疾厄':'je','父母':'fm','兄弟':'xd',
    '夫妻':'fq','子女':'zn','奴仆':'np','田宅':'tz','福德':'fd','官禄':'gl',
    '预测':'yc','推断':'td','分析':'fx','解读':'jd','咨询':'zx','服务':'fw',
    '宝鉴':'bj','知识':'zs','图谱':'tp','模块':'mk','推荐':'tj','关联':'gl'
  };
  // 反向映射：pinyin -> 中文关键词
  var PINYIN_REVERSE = {};
  Object.keys(PINYIN_MAP).forEach(function(k){
    var v = PINYIN_MAP[k];
    if(!PINYIN_REVERSE[v]) PINYIN_REVERSE[v] = [];
    PINYIN_REVERSE[v].push(k);
  });

  // R48 搜索历史管理
  var SEARCH_HISTORY_KEY = 'kb_graph_search_history';
  function getSearchHistory(){
    try {
      var s = localStorage.getItem(SEARCH_HISTORY_KEY);
      return s ? JSON.parse(s) : [];
    } catch(e){ return []; }
  }
  function addSearchHistory(q){
    if(!q || q.length < 2) return;
    var hist = getSearchHistory();
    // 移除已存在的相同项
    hist = hist.filter(function(h){ return h !== q; });
    // 添加到开头
    hist.unshift(q);
    // 保留最近 10 条
    hist = hist.slice(0, 10);
    try { localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(hist)); } catch(e){}
  }
  function clearCurrentSearchHistory(){
    var inp = document.getElementById('searchInput');
    var q = (inp && inp.value || '').trim().toLowerCase();
    if(!q) return;
    var hist = getSearchHistory();
    hist = hist.filter(function(h){ return h !== q; });
    try { localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(hist)); } catch(e){}
    renderSearchHistory();
  }

  function renderSearchHistory(){
    var el = document.getElementById('searchHistory');
    if(!el) return;
    var hist = getSearchHistory();
    if(!hist.length){
      el.style.display = 'none';
      return;
    }
    var html = '<div style="padding:6px 10px;font-size:11px;color:var(--paper);opacity:.5;border-bottom:1px solid var(--line)">🕐 搜索历史</div>';
    hist.forEach(function(h){
      html += '<div class="search-hist-item" data-q="' + h.replace(/"/g,'&quot;') + '" style="padding:8px 12px;cursor:pointer;font-size:12px;border-bottom:1px solid rgba(201,168,76,.1);transition:background .15s">' + h + '</div>';
    });
    html += '<div id="clearSearchHist" style="padding:8px 12px;cursor:pointer;font-size:11px;color:var(--gold);opacity:.7;text-align:center">清空历史</div>';
    el.innerHTML = html;
    el.style.display = 'block';
  }

  // R48 拼音首字母模糊匹配函数
  function matchPinyin(q, node){
    var label = (node.label || '').toLowerCase();
    var id = (node.id || '').toLowerCase();
    // 直接检查拼音映射表
    for(var key in PINYIN_MAP){
      if(key.toLowerCase() === q || PINYIN_MAP[key] === q){
        // 检查节点是否包含该中文关键词或英文id
        if(label.indexOf(key.toLowerCase()) >= 0 || id.indexOf(key.toLowerCase()) >= 0 || id.indexOf(PINYIN_MAP[key]) >= 0){
          return true;
        }
      }
    }
    // 检查拼音首字母是否匹配节点label首字母
    if(q.length <= 3 && /^[a-z]+$/.test(q)){
      // 尝试从拼音反向映射查找
      var keywords = PINYIN_REVERSE[q] || [];
      for(var i = 0; i < keywords.length; i++){
        var kw = keywords[i].toLowerCase();
        if(label.indexOf(kw) >= 0 || id.indexOf(kw) >= 0) return true;
      }
    }
    return false;
  }

  // R38 图谱搜索：客户端筛选 + 高亮 + focus
  var _searchState = {q:'', ids:[]};
  function searchGraph(){
    var q = (document.getElementById('searchInput').value || '').trim().toLowerCase();
    _searchState.q = q;
    var statsEl = document.getElementById('searchStats');
    if(!q){
      // 恢复全画布
      draw(ALL_NODES.slice(), ALL_EDGES.slice());
      document.getElementById('stat').textContent = '全画布 · ' + ALL_NODES.length + ' 节点';
      if(statsEl){ statsEl.style.display = 'none'; }
      return;
    }
    // 增强模糊匹配：id / label / level / 拼音首字母
    var matched = ALL_NODES.filter(function(n){
      var idMatch = n.id.toLowerCase().indexOf(q) >= 0;
      var labelMatch = (n.label||'').toLowerCase().indexOf(q) >= 0;
      var groupMatch = (n.group||'').toLowerCase().indexOf(q) >= 0;
      var pinyinMatch = matchPinyin(q, n);
      return idMatch || labelMatch || groupMatch || pinyinMatch;
    });
    var matchedIds = new Set(matched.map(function(n){return n.id;}));
    _searchState.ids = Array.from(matchedIds);
    var nodes = ALL_NODES.map(function(n){
      var hit = matchedIds.has(n.id);
      return {id:n.id, label:n.label, group:n.group, value:n.value, title:n.title,
        color: hit ? {background:'#9333ea', border:'#c9a84c'} : {background:'#333', border:'#555'},
        borderWidth: hit ? 3 : 1, opacity: hit ? 1 : .08};
    });
    var edges = ALL_EDGES.map(function(e){
      var hit = matchedIds.has(e.from) || matchedIds.has(e.to);
      return {from:e.from, to:e.to, value:e.value, arrows:e.arrows,
        color: hit ? {color:'#9333ea'} : {color:'rgba(201,168,76,.05)'},
        opacity: hit ? .9 : .03};
    });
    draw(nodes, edges);
    // focus 到第一个匹配节点
    if(matched.length && network){
      setTimeout(function(){
        network.focus(matched[0].id, {scale: 1.2, animation:{duration: 400}});
      }, 100);
    }
    document.getElementById('stat').innerHTML = '搜索 <b>' + q + '</b> · 命中 <b>' + matched.length + '</b> / ' + ALL_NODES.length;
    // R48 搜索结果统计显示
    if(statsEl){
      if(matched.length > 0){
        statsEl.innerHTML = '命中 <b style="color:var(--gold)">' + matched.length + '</b> 个节点 / 共 ' + ALL_NODES.length + ' 个';
        // 有结果时加入搜索历史
        addSearchHistory(q);
      } else {
        statsEl.innerHTML = '未命中 — 试试热门节点 🔥';
      }
      statsEl.style.display = 'block';
    }
  }
  // 暴露到 window供 button onkey 触发
  window.searchGraph = searchGraph;
  // 随输入实时搜索（debounce 150ms）+ R48 搜索历史下拉
  var _searchTimer = null;
  document.addEventListener('DOMContentLoaded', function(){
    var inp = document.getElementById('searchInput');
    var histEl = document.getElementById('searchHistory');
    if(!inp) return;
    inp.addEventListener('input', function(){
      clearTimeout(_searchTimer);
      _searchTimer = setTimeout(searchGraph, 150);
      // 隐藏历史下拉
      if(histEl) histEl.style.display = 'none';
    });
    inp.addEventListener('keydown', function(e){
      if(e.key === 'Escape'){
        inp.value='';
        searchGraph();
        if(histEl) histEl.style.display = 'none';
      }
      else if(e.key === 'Enter' && _searchState.ids.length){
        // Enter 跳到下一个匹配
        var cur = _searchState._idx || 0;
        cur = (cur + 1) % _searchState.ids.length;
        _searchState._idx = cur;
        if(network) network.focus(_searchState.ids[cur], {scale:1.4, animation:{duration:300}});
      }
    });
    // R48 点击搜索框显示历史
    inp.addEventListener('focus', function(){
      if(!inp.value.trim()){
        renderSearchHistory();
      }
    });
    // 点击其他地方隐藏历史
    document.addEventListener('click', function(e){
      if(histEl && !inp.contains(e.target) && !histEl.contains(e.target)){
        histEl.style.display = 'none';
      }
    });
    // R48 历史项点击
    if(histEl){
      histEl.addEventListener('click', function(e){
        var item = e.target.closest('.search-hist-item');
        if(item){
          var q = item.getAttribute('data-q');
          if(q){
            inp.value = q;
            histEl.style.display = 'none';
            searchGraph();
          }
        }
        var clearBtn = e.target.closest('#clearSearchHist');
        if(clearBtn){
          try { localStorage.removeItem(SEARCH_HISTORY_KEY); } catch(e){}
          histEl.style.display = 'none';
        }
      });
    }
  });

  window.showModal = function(n){
    document.getElementById('m-title').textContent = n.label;
    var detailHtml =
      '<div class="row"><span class="k">模块 ID</span><span class="v">' + n.id + '</span></div>' +
      '<div class="row"><span class="k">等级</span><span class="v">' + (n.group||'—') + '</span></div>' +
      '<div class="row"><span class="k">引用次数</span><span class="v">' + (n.xref_count||0) + '</span></div>' +
      '<div class="row"><span class="k">被引用</span><span class="v">' + (n.referenced||0) + '</span></div>' +
      '<div class="row"><span class="k">KB 命中</span><span class="v">' + (n.hit_count||0) + '</span></div>' +
      '<div id="m-kb" class="m-kb-box"><div class="m-kb-loading">📚 KB 条目预览加载中…</div></div>' +
      '<div id="m-rec" class="m-rec-box"><div class="m-rec-loading">🧠 AI 推荐关联加载中…</div></div>' +
      '<div class="row row-link">' +
        '<a class="m-link" href="kb-explorer.html#module=' + encodeURIComponent(n.id) + '" target="_blank">🔍 在 KB 中检索</a>' +
        '<a class="m-link" href="ai-assistant.html?mod=' + encodeURIComponent(n.id) + '" target="_blank">🤖 AI 解读</a>' +
      '</div>';
    document.getElementById('m-body').innerHTML = detailHtml;
    document.getElementById('modal').classList.add('show');
    // R42 异步加载 KB 条目预览 Top 3
    fetch('/api/public/kb-query?module=' + encodeURIComponent(n.id) + '&limit=3', {cache:'no-cache'})
      .then(function(r){return r.json();}).then(function(j){
        var results = (j.data || j.results || []);
        var kbBox = document.getElementById('m-kb');
        if(!kbBox) return;
        if(!results.length){ kbBox.innerHTML = '<div class="m-kb-empty">该模块暂无 KB 条目</div>'; return; }
        var html = '<div class="m-kb-title">📚 KB 条目预览 (Top ' + results.length + ')</div>';
        html += '<div class="m-kb-list">';
        results.forEach(function(r, i){
          var title = (r.title||r.name||r.entry_id||'').slice(0,40);
          var trust = (r.trust_score||0).toFixed(2);
          html += '<a class="m-kb-row" href="kb-explorer.html#module=' + encodeURIComponent(n.id) + '" target="_blank">' +
            '<span class="m-kb-rank">' + (i+1) + '</span>' +
            '<span class="m-kb-name">' + title + '</span>' +
            '<span class="m-kb-trust">' + trust + '</span>' +
          '</a>';
        });
        html += '</div>';
        kbBox.innerHTML = html;
      }).catch(function(){ var b=document.getElementById('m-kb'); if(b) b.innerHTML='<div class="m-kb-empty">KB 预览加载失败</div>'; });
    // R33-节点5 异步加载 AI 推荐探索路径（彩色点 + 可点击跳转 kb-explorer）
    fetch('/api/kb/recommend?module=' + encodeURIComponent(n.id) + '&limit=6', {cache:'no-cache'})
      .then(function(r){return r.json();}).then(function(j){
        var d = j.data || j;
        var recs = d.recommendations || [];
        var recBox = document.getElementById('m-rec');
        if(!recBox) return;
        if(!recs.length){ recBox.innerHTML = '<div class="m-rec-empty">暂无图谱推荐关联</div>'; return; }
        var html = '<div class="m-rec-title">🧭 AI 推荐探索路径（Top ' + recs.length + '）</div>';
        html += '<div class="m-rec-list">';
        recs.forEach(function(r, i){
          var color = LEVEL_COLOR[r.level] || '#888';
          var label = LEVEL_LABEL[r.level] || r.level || '';
          html += '<div class="m-rec-item" data-fb-target="' + (r.id||'').replace(/"/g,'&quot;') + '" data-fb-source="' + (n.id||'').replace(/"/g,'&quot;') + '" data-fb-score="' + (r.score||0).toFixed(2) + '">' +
            '<span class="m-rec-rank">' + (i+1) + '</span>' +
            '<span class="m-rec-dot" style="background:' + color + '" title="' + label + '"></span>' +
            '<span class="m-rec-name">' + (r.name||r.id) + '</span>' +
            '<span class="m-rec-score">' + (r.score||0).toFixed(2) + '</span>' +
            '<button class="m-rec-fly" type="button" title="在画布上定位到该节点" aria-label="飞到 ' + (r.name||r.id) + '">🔭</button>' +
            '<a class="m-rec-go" href="kb-explorer.html#module=' + encodeURIComponent(r.id) + '" target="_blank" title="在 KB 中检索" aria-label="检索 ' + (r.name||r.id) + '">↗</a>' +
          '</div>';
        });
        html += '</div>';
        html += '<div class="m-rec-foot">总关联 ' + (d.total_related||0) + ' · ' + (d.algorithm||'graph-recommend').slice(0, 28) + '</div>';
        recBox.innerHTML = html;
      }).then(function(){
        // R38: 推荐列表渲染后绑定 feedback 监听（js/kb-recommend-feedback.js）
        if(typeof window.autoBindFb === 'function'){
          window.autoBindFb(document.getElementById('modal'));
        }
      }).catch(function(){ var b=document.getElementById('m-rec'); if(b) b.innerHTML='<div class="m-rec-empty">推荐接口调用失败</div>'; });
  };
  window.highlightRecs = highlightRecs;

  // R40 按等级折叠 / 展开
  function clusterByLevel(){
    if(!network) return;
    var levels = ['premium','registered','professional','admin','public','member'];
    levels.forEach(function(lv){
      var nodeIds = ALL_NODES.filter(function(n){return n.group === lv;}).map(function(n){return n.id;});
      if(nodeIds.length < 2) return; // 单节点不折叠
      try {
        network.cluster({
          joinCondition: function(node){ return node.group === lv; },
          clusterNodeProperties: {
            id: 'cluster_' + lv,
            label: lv.toUpperCase() + ' (' + nodeIds.length + ')',
            color: {background: LEVEL_COLOR[lv] || '#888', border: '#c9a84c'},
            shape: 'database',
            size: 35,
            font: {size: 14, color: '#fff', face: 'Noto Serif SC', strokeWidth: 2, strokeColor: '#000'},
            borderWidth: 3
          },
          processProperties: function(opts, childNodes, childEdges){
            opts.value = childNodes.length;
            return opts;
          }
        });
      } catch(_){}
    });
    network.fit({animation:{duration:600}});
    document.getElementById('stat').innerHTML = '📦 按等级折叠 · ' + levels.filter(function(lv){return ALL_NODES.filter(function(n){return n.group===lv;}).length >= 2;}).length + ' clusters';
  }
  function unclusterAll(){
    if(!network) return;
    // 多次调用确保嵌套 cluster 全展开
    for(var i=0;i<5;i++){
      var clusters = network.body.nodeIndices.filter(function(id){return id.indexOf('cluster_')===0;});
      if(!clusters.length) break;
      clusters.forEach(function(cid){
        try { network.openCluster(cid, {releaseFunction: function(){return {};}}); } catch(_){}
      });
    }
    network.fit({animation:{duration:600}});
    document.getElementById('stat').textContent = '展开全画布 · ' + ALL_NODES.length + ' 节点';
  }
  window.clusterByLevel = clusterByLevel;
  window.unclusterAll = unclusterAll;

  // R41 PNG 截图导出
  function downloadGraphImage(){
    if(!network) return;
    try {
      var canvas = network.canvasToImage({
        filter: function(node){ return true; },
        backgroundColor: '#1a1a2e'
      });
      if(!canvas){ document.getElementById('stat').textContent = '截图失败: canvas 为空'; return; }
      // 合成带标题的图片
      var W = canvas.width, H = canvas.height;
      var out = document.createElement('canvas');
      out.width = W; out.height = H + 60;
      var ctx = out.getContext('2d');
      // 背景
      ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, 0, out.width, out.height);
      // 标题条
      ctx.fillStyle = '#c9a84c';
      ctx.font = 'bold 18px "Noto Serif SC", serif';
      ctx.textAlign = 'center';
      ctx.fillText('命理宝鉴 · 知识图谱 (' + ALL_NODES.length + ' 模块)', W/2, 30);
      // 底部水印
      ctx.fillStyle = 'rgba(201,168,76,.4)';
      ctx.font = '11px monospace';
      ctx.fillText('sgmt-taojing.github.io/mingli-baojian', W/2, H + 50);
      // 粘贴图谱
      ctx.drawImage(canvas, 0, 50);
      // 下载
      out.toBlob(function(blob){
        if(!blob){ return; }
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'kb-graph-' + new Date().toISOString().slice(0,10) + '.png';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
        document.getElementById('stat').textContent = '📷 截图已下载 · ' + a.download;
      }, 'image/png');
    } catch(e){
      document.getElementById('stat').textContent = '截图失败: ' + (e.message || e);
    }
  }
  window.downloadGraphImage = downloadGraphImage;

  window.closeModal = function(){ document.getElementById('modal').classList.remove('show'); };
  // R39 推荐 fly-to 画布聚焦
  document.getElementById('modal').addEventListener('click', function(e){
    var flyBtn = e.target.closest('.m-rec-fly');
    if(!flyBtn) return;
    var item = flyBtn.closest('.m-rec-item');
    if(!item) return;
    var targetId = item.getAttribute('data-fb-target');
    if(!targetId || !network) return;
    // 关 modal + 聚焦画布节点
    closeModal();
    // 确保节点在当前画布（如果被搜索筛掉了，先 reset）
    var exists = ALL_NODES.some(function(n){return n.id === targetId;});
    if(!exists){
      // 尝试模糊匹配（id 可能被 kebab 截断）
      var fuzzy = ALL_NODES.find(function(n){return n.id.indexOf(targetId) >= 0 || targetId.indexOf(n.id) >= 0;});
      if(fuzzy) targetId = fuzzy.id; else return;
    }
    network.focus(targetId, {scale:1.5, animation:{duration:600, easingFunction:'easeInOutQuad'}});
    // 闪一下边框高亮
    try {
      network.setOptions({nodes:{color:{background:'#9333ea',border:'#c9a84c'},borderWidthSelected:4}});
      setTimeout(function(){ network.setOptions({nodes:{color:{background:undefined,border:undefined},borderWidthSelected:undefined}}); }, 2000);
    } catch(_){}
  });
  document.getElementById('modal').addEventListener('click', function(e){ if(e.target===this) closeModal(); });
  document.getElementById('recModFilter').addEventListener('change', function(){
    if(this.value) highlightRecs();
  });
  document.getElementById('levelFilter').addEventListener('change', function(e){
    var v = e.target.value;
    if(v === 'all'){ draw(ALL_NODES.slice(), ALL_EDGES.slice()); return; }
    var ids = new Set(ALL_NODES.filter(function(n){return n.group===v;}).map(function(n){return n.id;}));
    var nodes = ALL_NODES.map(function(n){ return {id:n.id, opacity:ids.has(n.id)?1:.12}; });
    var edges = ALL_EDGES.map(function(e){ return {from:e.from,to:e.to,opacity:(ids.has(e.from)&&ids.has(e.to))?1:.08}; });
    draw(nodes, edges);
  });
  load();
})();
