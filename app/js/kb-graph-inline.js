
(function(){
  var LEVEL_COLOR = {premium:'#e74c3c',registered:'#3498db',member:'#2ecc71',professional:'#9b59b6',admin:'#f39c12',public:'#1abc9c'};
  var LEVEL_LABEL = {premium:'Premium',registered:'Registered',member:'Member',professional:'Professional',admin:'Admin',public:'Public'};
  var ALL_NODES = [], ALL_EDGES = [], network = null, graphData = null;

  async function load(){
    // 使用 fetch（现代浏览器/移动端/Edge/Firefox/Chrome/Safari 均内置）
    // R77: 优先用 cross-ref-graph（32 nodes / 120 links），fallback → /api/kb/graph
    var r = await fetch('/api/kb/cross-ref-graph?minWeight=2&maxNodes=60', {cache:'no-cache'});
    var j = await r.json();
    // 兼容判断：旧 API 用 code，新 API 用 ok
    var apiOk = j.ok !== undefined ? j.ok : (j.code === 0);
    if (!apiOk) { document.getElementById('stat').textContent='加载失败'; return; }
    graphData = j;
    // 计算 level 分组（从 group 字段或默认 'tcm'）
    var levelCounts = {};
    j.nodes.forEach(function(n) {
      var lv = n.group || 'tcm';
      levelCounts[lv] = (levelCounts[lv]||0) + 1;
    });
    // 节点：id/label/value/group/title
    ALL_NODES = j.nodes.map(function(n){
      var lv = n.group || 'tcm';
      return {
        id: n.id,
        label: n.label || n.id,
        title: '【'+lv+'】\n条目: '+(n.count||0)+'\n模块: '+n.id,
        group: lv,
        value: n.count || 1,
        color: {background: LEVEL_COLOR[lv]||'#888', border: '#c9a84c'}
      };
    });
    // 边：source/target → from/to
    ALL_EDGES = j.links.map(function(lk){
      return {
        from: lk.source,
        to: lk.target,
        value: Math.min(lk.weight||1, 16),
        arrows: 'to',
        color: {color: 'rgba(201,168,76,.35)', highlight: '#c9a84c'}
      };
    });
    var isolatedCount = j.nodes.filter(function(n){ 
      return !j.links.some(function(lk){ return lk.source===n.id || lk.target===n.id; });
    }).length;
    document.getElementById('stat').innerHTML = '模块 <b>' + j.totalModules + '</b> · 引用边 <b>' + j.totalEdges + '</b> · 孤立 <b>' + isolatedCount + '</b>';
    renderLegend(levelCounts);
    draw(ALL_NODES, ALL_EDGES);
    fillModFilter();
    // R94: URL hash 深链 — 访问 #module=xxx 时自动聚焦节点 + 打开 modal
    var _hashM = location.hash.match(/module=([^&]+)/);
    if(_hashM){
      var _hashMid = decodeURIComponent(_hashM[1]);
      setTimeout(function(){ openNodeFromHash(_hashMid); }, 600);
    }

  }

  // R94: 从 URL hash 打开节点
  function openNodeFromHash(nodeId){
    if(!nodeId || !ALL_NODES.length) return;
    var n = ALL_NODES.find(function(x){ return x.id === nodeId; });
    if(!n) {
      // 模糊匹配：label 包含 nodeId，或 nodeId 包含 id 片段
      var fuzzy = ALL_NODES.find(function(x){
        return (x.label||'').toLowerCase() === nodeId.toLowerCase()
            || (x.id||'').indexOf(nodeId) >= 0
            || nodeId.indexOf(x.id) >= 0;
      });
      if(!fuzzy) {
        var stEl = document.getElementById('stat');
        if(stEl) stEl.innerHTML = '🔗 深链 <b>' + nodeId + '</b> 未命中节点';
        return;
      }
      n = fuzzy;
    }
    // 1) 聚焦画布
    if(network) {
      network.focus(n.id, {scale: 1.4, animation: {duration: 600, easingFunction: 'easeInOutQuad'}});
    }
    // 2) 高亮该节点（紫色 + 加粗边）
    var focusNodes = ALL_NODES.map(function(x){
      return {id: x.id, opacity: x.id === n.id ? 1 : .15,
        borderWidth: x.id === n.id ? 4 : 1,
        color: x.id === n.id ? {background: '#9333ea', border: '#c9a84c'} : {background: '#333', border: '#555'}};
    });
    var focusEdges = ALL_EDGES.map(function(e){
      var inFocus = (e.from === n.id || e.to === n.id);
      return {from: e.from, to: e.to, opacity: inFocus ? .9 : .05,
        color: inFocus ? {color: '#9333ea'} : {color: 'rgba(201,168,76,.05)'}};
    });
    draw(focusNodes, focusEdges);
    // 3) 打开 modal（复用已有 showModal 函数）
    if(typeof window.showModal === 'function'){
      setTimeout(function(){ window.showModal(n); }, 400);
    }
    var stEl2 = document.getElementById('stat');
    if(stEl2) stEl2.innerHTML = '🔗 深链命中 <b>' + n.id + '</b> · 已聚焦并打开详情';
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
    if(!hubIds.length){ showToast('无热点节点'); return; }
    var nodes = ALL_NODES.map(function(n){ return {id:n.id, opacity:n.value >= 16 ? 1 : .15}; });
    var edges = ALL_EDGES.map(function(e){ return {from:e.from, to:e.to, opacity:(hubIds.includes(e.from)||hubIds.includes(e.to)) ? 1 : .1}; });
    draw(nodes, edges);
  }

  // R77: 从 cross-ref-graph links 直接提取关联
  var _currentRecs = [];
  var _currentRecSource = null;
  function highlightRecs(){
    var mod = document.getElementById('recModFilter').value;
    if(!mod){ showToast('请先选择模块'); return; }
    _currentRecSource = mod;
    if (!graphData || !graphData.links) { showToast('图谱数据未加载'); return; }
    // 从 links 中提取与 mod 关联的节点
    var relatedNodes = {};
    graphData.links.forEach(function(lk) {
      if (lk.source === mod) {
        relatedNodes[lk.target] = (relatedNodes[lk.target]||0) + lk.weight;
      } else if (lk.target === mod) {
        relatedNodes[lk.source] = (relatedNodes[lk.source]||0) + lk.weight;
      }
    });
    _currentRecs = Object.entries(relatedNodes)
      .sort(function(a,b){ return b[1]-a[1]; })
      .slice(0,8)
      .map(function(e){ return e[0]; });
    if(!_currentRecs.length){ showToast('该模块暂无跨模块关联'); return; }
    // 高亮：source 模块 + 关联节点
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
    document.getElementById('stat').innerHTML = '模块 <b>' + mod + '</b> 跨模块关联 <b>' + _currentRecs.length + '</b> · 画布命中 <b>' + hitCount + '</b>';
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
      // R89-P2 高清 1920×1080 截图
      var hi = window.devicePixelRatio || 1;
      var canvas = network.canvasToImage({
        filter: function(node){ return true; },
        backgroundColor: '#1a1a2e',
        scale: 2   // 2x 高清
      });
      if(!canvas){ document.getElementById('stat').textContent = '截图失败: canvas 为空'; return; }
      var W = canvas.width, H = canvas.height;
      var out = document.createElement('canvas');
      // 加大画布留出标题/水印/焦点信息
      var titleH = 80, footerH = 50;
      out.width = W;
      out.height = H + titleH + footerH;
      var ctx = out.getContext('2d');
      // 背景
      ctx.fillStyle = '#0d0d1a';
      ctx.fillRect(0, 0, out.width, out.height);
      // 顶部标题条（双层渐变）
      var grad = ctx.createLinearGradient(0, 0, out.width, 0);
      grad.addColorStop(0, 'rgba(201,168,76,0.12)');
      grad.addColorStop(0.5, 'rgba(201,168,76,0.2)');
      grad.addColorStop(1, 'rgba(201,168,76,0.12)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, out.width, titleH);
      ctx.fillStyle = '#c9a84c';
      ctx.font = 'bold 24px "Noto Serif SC", serif';
      ctx.textAlign = 'left';
      ctx.fillText('🔮 命理宝鉴 · 知识图谱', 32, 38);
      ctx.fillStyle = 'rgba(243,234,208,0.6)';
      ctx.font = '13px "Noto Serif SC", serif';
      var ts = new Date().toISOString().slice(0, 19).replace('T', ' ');
      var focusInfo = '';
      try {
        var pos = network.getViewPosition();
        var scale = network.getScale();
        focusInfo = ' · 焦点 · ' + (scale || '').toFixed(2) + 'x';
      } catch(e){}
      ctx.fillText(ALL_NODES.length + ' 模块 · ' + ALL_EDGES.length + ' 关系 · 导出时间 ' + ts + focusInfo, 32, 60);
      // 粘贴图谱
      ctx.drawImage(canvas, 0, titleH);
      // 底部水印 + 版权
      ctx.fillStyle = 'rgba(201,168,76,0.18)';
      ctx.fillRect(0, out.height - footerH, out.width, 1);
      ctx.fillStyle = 'rgba(201,168,76,0.55)';
      ctx.font = '12px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('© 命理宝鉴 · sgmt-taojing.github.io/mingli-baojian', 32, out.height - 18);
      ctx.textAlign = 'right';
      var focusName = (_searchState && _searchState.q) ? ('搜: ' + _searchState.q) : '全画布';
      ctx.fillText(focusName + ' · 高清 2x', out.width - 32, out.height - 18);
      // 下载
      out.toBlob(function(blob){
        if(!blob){ return; }
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        var stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
        var tag = (_searchState && _searchState.q) ? ('-' + _searchState.q.replace(/[^\w一-龥]/g, '_').slice(0, 12)) : '';
        a.download = 'kb-graph-1920x1080' + tag + '-' + stamp + '.png';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
        document.getElementById('stat').textContent = '📷 高清截图已下载 · ' + a.download;
      }, 'image/png');
    } catch(e){
      document.getElementById('stat').textContent = '截图失败: ' + (e.message || e);
    }
  }
  window.downloadGraphImage = downloadGraphImage;

  window.closeModal = function(){ document.getElementById('modal').classList.remove('show'); };
  // R94: 保留深链 hash（不主动清除，让刷新/分享继续定位）
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

  // === R123 Mini-Map 小地图导航 ===
  var _miniVisible = false, _miniRaf = null;
  function toggleMinimap(){
    _miniVisible = !_miniVisible;
    var el = document.getElementById('minimap');
    if(el) el.style.display = _miniVisible ? 'block' : 'none';
    var btn = document.getElementById('minimapToggle');
    if(btn) btn.textContent = _miniVisible ? '🗺️ 隐藏地图' : '🗺️ Mini-Map';
    if(_miniVisible) startMinimapLoop();
  }
  function startMinimapLoop(){
    if(_miniRaf) cancelAnimationFrame(_miniRaf);
    var tick = function(){
      if(_miniVisible && network) renderMinimap();
      _miniRaf = requestAnimationFrame(tick);
    };
    _miniRaf = requestAnimationFrame(tick);
  }
  function renderMinimap(){
    var cvs = document.getElementById('minimapCanvas');
    if(!cvs || !network) return;
    var ctx = cvs.getContext('2d');
    var W = cvs.width, H = cvs.height;
    ctx.clearRect(0, 0, W, H);
    // 背景
    ctx.fillStyle = 'rgba(26,26,46,.4)';
    ctx.fillRect(0, 0, W, H);
    // 获取全画布节点的物理位置 (vis-network getPositions)
    var positions, bbox;
    try{
      var allPos = network.getPositions();
      positions = ALL_NODES.map(function(n){ return allPos[n.id] || {x:0,y:0}; });
      if(!positions.length) return;
      var xs = positions.map(function(p){return p.x;}), ys = positions.map(function(p){return p.y;});
      var xmin = Math.min.apply(null,xs), xmax = Math.max.apply(null,xs);
      var ymin = Math.min.apply(null,ys), ymax = Math.max.apply(null,ys);
      bbox = {xmin:xmin, xmax:xmax, ymin:ymin, ymax:ymax};
    }catch(e){ return; }
    var pad = 8;
    var pw = (bbox.xmax - bbox.xmin) || 1;
    var ph = (bbox.ymax - bbox.ymin) || 1;
    var scale = Math.min((W-2*pad)/pw, (H-2*pad)/ph);
    var cx = (W - pw*scale)/2 - bbox.xmin*scale;
    var cy = (H - ph*scale)/2 - bbox.ymin*scale;
    function project(p){ return { x: p.x*scale + cx, y: p.y*scale + cy }; }
    // 画边（细线）
    ctx.strokeStyle = 'rgba(201,168,76,.18)';
    ctx.lineWidth = 0.4;
    ALL_EDGES.forEach(function(e){
      var sp = positions[ALL_NODES.findIndex(function(n){return n.id===e.from;})];
      var tp = positions[ALL_NODES.findIndex(function(n){return n.id===e.to;})];
      if(!sp || !tp) return;
      var a = project(sp), b = project(tp);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    });
    // 画节点（按等级着色）
    var levelColor = {public:'#22c55e', premium:'#c9a84c', registered:'#3b82f6', professional:'#a855f7', admin:'#ef4444'};
    ALL_NODES.forEach(function(n, i){
      var p = positions[i];
      if(!p) return;
      var pt = project(p);
      ctx.fillStyle = levelColor[n.group] || '#888';
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 2.4, 0, Math.PI*2);
      ctx.fill();
    });
    // 视口框
    try{
      var viewPos = network.getViewPosition();
      var viewScale = network.getScale();
      var canvasFrame = network.canvas.body.container.clientWidth;
      var canvasHeight = network.canvas.body.container.clientHeight;
      // 视口在世界坐标中的宽高
      var vpW = canvasFrame / viewScale;
      var vpH = canvasHeight / viewScale;
      var vp = project({x: viewPos.x - vpW/2, y: viewPos.y - vpH/2});
      ctx.strokeStyle = 'rgba(255,255,255,.85)';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(vp.x, vp.y, vpW*scale, vpH*scale);
      ctx.fillStyle = 'rgba(255,255,255,.06)';
      ctx.fillRect(vp.x, vp.y, vpW*scale, vpH*scale);
      // 更新统计
      var stat = document.getElementById('minimapStat');
      if(stat) stat.textContent = (viewScale).toFixed(1) + 'x · ' + ALL_NODES.length + ' 节点';
    }catch(e){}
  }
  // 点击 mini-map 跳转视图中心
  document.getElementById('minimapCanvas')?.addEventListener('click', function(e){
    if(!network) return;
    var rect = this.getBoundingClientRect();
    var mx = e.clientX - rect.left, my = e.clientY - rect.top;
    // 反算世界坐标：需要先获取 bbox，但因为 renderMinimap 已经缓存过，直接重新计算
    var positions;
    try{ positions = network.getPositions(); }catch(_){ return; }
    var xs = [], ys = [];
    ALL_NODES.forEach(function(n){ var p = positions[n.id]; if(p){ xs.push(p.x); ys.push(p.y); } });
    var xmin = Math.min.apply(null,xs), xmax = Math.max.apply(null,xs);
    var ymin = Math.min.apply(null,ys), ymax = Math.max.apply(null,ys);
    var pad = 8, W = 180, H = 115;
    var pw = (xmax-xmin)||1, ph = (ymax-ymin)||1;
    var scale = Math.min((W-2*pad)/pw, (H-2*pad)/ph);
    var cx = (W-pw*scale)/2 - xmin*scale;
    var cy = (H-ph*scale)/2 - ymin*scale;
    var wx = (mx - cx)/scale, wy = (my - cy)/scale;
    network.moveTo({position:{x:wx,y:wy}, animation:{duration:400, easingFunction:'easeInOutQuad'}});
  });
})();
