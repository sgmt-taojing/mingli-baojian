
(function(){
  'use strict';

  // ===== 模块名映射 =====
  var MOD_NAMES = {
    'bazi': '八字命理', 'ziwei': '紫微斗数', 'qimen': '奇门遁甲',
    'liuren': '大六壬', 'liuyao': '六爻占卜', 'meihua': '梅花易数',
    'fengshui': '风水堪舆', 'tcm': '中医养生', 'acupuncture': '针灸经络',
    'tcm-fangji': '中医方剂', 'shanghan-lun': '伤寒论', 'tcm-zhongfu': '中医中妇',
    'gua': '周易卦象', 'face': '面相学', 'palm': '手相学',
    'name': '姓名学', 'divination': '综合占卜', 'lifeplan': '人生规划',
    'music': '五音疗疾', 'lifeindex': '生命指数', 'glass': '智镜',
    'ai-assistant': 'AI 助手', 'clinic': '诊室', 'shop': '商城',
    'feedback': '反馈', 'course': '课程', 'yuanzhu': '缘助',
    '_total': '总计'
  };

  var API_BASE = 'http://localhost:8920';
  var KB_ENDPOINTS = [
    { method: 'GET', path: '/api/public/stats', name: '公开统计' },
    { method: 'GET', path: '/api/kb/list', name: 'KB 文件列表' },
    { method: 'GET', path: '/api/yuanzhu/list', name: '缘助列表' },
    { method: 'GET', path: '/api/yuanzhu/profile', name: '缘主档案' },
    { method: 'GET', path: '/api/yuanzhu/yearly-pushes', name: '年度推送' },
    { method: 'GET', path: '/api/public/latest-pushes', name: '最新推送' },
    { method: 'GET', path: '/api/feedback/points', name: '积分系统' },
    { method: 'GET', path: '/api/public/stats', name: '公开统计(复)' },
    { method: 'GET', path: '/api/public/recent-cases', name: '近期案例' },
    { method: 'GET', path: '/api/shop/products', name: '商城商品' },
    { method: 'GET', path: '/api/voices', name: '语音列表' },
    { method: 'GET', path: '/api/courses', name: '课程列表' },
    { method: 'GET', path: '/api/clinic/my-reports', name: '诊室报告' }
  ];

  // ===== 读取 localStorage KB 命中数据 =====
  function getKbHitData() {
    var data = {};
    var total = 0;
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      if (!key || !key.startsWith('_kb_hit_count/')) continue;
      var mod = key.substring('_kb_hit_count/'.length);
      if (mod === '_total') { total = parseInt(localStorage.getItem(key) || '0'); continue; }
      var count = parseInt(localStorage.getItem(key) || '0');
      if (count > 0) data[mod] = count;
    }
    return { data: data, total: total };
  }

  // ===== KPI 渲染 =====
  function renderKpi(hitData) {
    var mods = Object.keys(hitData.data);
    var totalHits = hitData.total || mods.reduce(function(s,k){return s+hitData.data[k];},0);

    document.getElementById('kpiTotalHits').textContent = totalHits;
    document.getElementById('kpiModules').textContent = mods.length;

    // 命中率 = KB 命中 / (KB 命中 + 估算 AI 调用)
    // 估算：总查询 = totalHits + AI 调用（暂时用 totalHits * 1.5 估算，后续可接入后端真实数据）
    var estimatedQueries = Math.max(totalHits * 1.5, totalHits + 10);
    var hitRate = estimatedQueries > 0 ? Math.round(totalHits / estimatedQueries * 100) : 0;
    document.getElementById('kpiHitRate').textContent = hitRate + '%';
    document.getElementById('kpiHitRateDelta').textContent = '≈ ' + totalHits + ' 直答 / ~' + Math.round(estimatedQueries) + ' 查询';
    document.getElementById('kpiModulesDelta').textContent = mods.length + ' 个模块有命中';
  }

  // ===== 模块表格 =====
  function renderModTable(hitData) {
    var tbody = document.getElementById('modTableBody');
    var mods = Object.keys(hitData.data).sort(function(a,b){return hitData.data[b]-hitData.data[a];});

    if (!mods.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty-hint"><span class="icon">📭</span>暂无数据，使用 AI 助手后自动统计</td></tr>';
      document.getElementById('modCount').textContent = '0 个模块';
      return;
    }

    document.getElementById('modCount').textContent = mods.length + ' 个模块';
    var maxCount = hitData.data[mods[0]] || 1;
    var total = mods.reduce(function(s,k){return s+hitData.data[k];},0);

    var colors = ['#2ecc71','#27ae60','#f39c12','#e67e22','#c0392b','#8e44ad','#2980b9','#16a085'];
    tbody.innerHTML = mods.map(function(mod, i) {
      var count = hitData.data[mod];
      var pct = total > 0 ? Math.round(count/total*100) : 0;
      var barWidth = Math.round(count/maxCount*100);
      var cls = pct >= 15 ? 'high' : (pct >= 5 ? 'mid' : 'low');
      var name = MOD_NAMES[mod] || mod;
      var color = colors[i % colors.length];
      var trendSpark = '<svg width="60" height="20"><polyline points="0,15 10,12 20,14 30,8 40,10 50,5 60,7" fill="none" stroke="'+color+'" stroke-width="1.5"/></svg>';
      return '<tr>'
        + '<td style="font-family:monospace;color:var(--cyan)">'+mod+'</td>'
        + '<td>'+name+'</td>'
        + '<td style="font-weight:600;color:var(--gold2)">'+count+'</td>'
        + '<td>'+pct+'%</td>'
        + '<td class="bar-cell">'
        + '<div class="bar-bg"><div class="bar-fg '+cls+'" style="width:'+barWidth+'%"></div>'
        + '<span class="bar-label">'+count+' / '+pct+'%</span></div>'
        + '</td></tr>';
    }).join('');
  }

  // ===== 路径分布 =====
  function renderPaths(hitData) {
    var total = hitData.total || 0;
    if (!total) {
      document.getElementById('pathKb').textContent = '—';
      document.getElementById('pathHybrid').textContent = '—';
      document.getElementById('pathAi').textContent = '—';
      return;
    }
    // 估算：高命中 (>=0.7) 约 60%，混合约 25%，AI 主答约 15%
    // 后续接入后端真实分数后精确化
    var kbDirect = Math.round(total * 0.6);
    var hybrid = Math.round(total * 0.25);
    var ai = total - kbDirect - hybrid;

    document.getElementById('pathKb').textContent = Math.round(kbDirect/total*100) + '%';
    document.getElementById('pathHybrid').textContent = Math.round(hybrid/total*100) + '%';
    document.getElementById('pathAi').textContent = Math.round(ai/total*100) + '%';
  }

  // ===== 7 日趋势 SVG =====
  function renderTrend() {
    var svg = document.getElementById('trendSvg');
    var days = [];
    var today = new Date();
    for (var i = 6; i >= 0; i--) {
      var d = new Date(today);
      d.setDate(d.getDate() - i);
      var key = '_kb_hit_day/' + d.toISOString().slice(0,10);
      var count = parseInt(localStorage.getItem(key) || '0');
      days.push({ date: d, count: count });
    }

    var maxVal = Math.max.apply(null, days.map(function(d){return d.count;}));
    if (maxVal === 0) maxVal = 1;

    var w = 700, h = 180, pad = 30, barW = (w - pad*2) / 7;
    var parts = [];

    // 网格线
    for (var g = 0; g <= 4; g++) {
      var y = pad + (h - pad*2) * g / 4;
      parts.push('<line x1="'+pad+'" y1="'+y+'" x2="'+(w-pad)+'" y2="'+y+'" stroke="#30363d" stroke-width="0.5"/>');
      parts.push('<text x="5" y="'+(y+4)+'" fill="#8b949e" font-size="10">'+Math.round(maxVal*(1-g/4))+'</text>');
    }

    // 柱状图
    var colors = ['#c9a84c','#e6c87a','#c9a84c','#e6c87a','#c9a84c','#e6c87a','#2ecc71'];
    days.forEach(function(d, i) {
      var barH = d.count / maxVal * (h - pad*2);
      var x = pad + i * barW + barW * 0.2;
      var y = h - pad - barH;
      var bw = barW * 0.6;
      parts.push('<rect x="'+x+'" y="'+y+'" width="'+bw+'" height="'+barH+'" fill="'+colors[i]+'" rx="3" opacity="0.85"/>');
      if (d.count > 0) {
        parts.push('<text x="'+(x+bw/2)+'" y="'+(y-5)+'" fill="#e6c87a" font-size="11" text-anchor="middle">'+d.count+'</text>');
      }
      parts.push('<text x="'+(x+bw/2)+'" y="'+(h-pad+15)+'" fill="#8b949e" font-size="10" text-anchor="middle">'+
        (d.date.getMonth()+1)+'/'+d.date.getDate()+'</text>');
    });

    svg.innerHTML = parts.join('');
  }

  // ===== 饼图 =====
  function renderPie(hitData) {
    var svg = document.getElementById('pieSvg');
    var legend = document.getElementById('pieLegend');
    var mods = Object.keys(hitData.data).sort(function(a,b){return hitData.data[b]-hitData.data[a];}).slice(0, 8);

    if (!mods.length) {
      svg.innerHTML = '<text x="70" y="75" fill="#8b949e" font-size="12" text-anchor="middle">无数据</text>';
      legend.innerHTML = '<div style="color:var(--paper3);font-size:.8rem">暂无命中数据</div>';
      return;
    }

    var total = mods.reduce(function(s,k){return s+hitData.data[k];},0);
    var colors = ['#c9a84c','#2ecc71','#78c8f0','#e67e22','#c9544b','#9b59b6','#1abc9c','#34495e'];
    var cx=70, cy=70, r=60;
    var angle = -Math.PI/2;
    var slices = [];
    var legendItems = [];

    mods.forEach(function(mod, i) {
      var count = hitData.data[mod];
      var pct = count/total;
      var endAngle = angle + pct * Math.PI * 2;
      var x1 = cx + r*Math.cos(angle), y1 = cy + r*Math.sin(angle);
      var x2 = cx + r*Math.cos(endAngle), y2 = cy + r*Math.sin(endAngle);
      var large = pct > 0.5 ? 1 : 0;
      var color = colors[i % colors.length];
      slices.push('<path d="M'+cx+','+cy+' L'+x1.toFixed(1)+','+y1.toFixed(1)+' A'+r+','+r+' 0 '+large+' 1 '+x2.toFixed(1)+','+y2.toFixed(1)+' Z" fill="'+color+'" stroke="#0d1117" stroke-width="1"/>');
      legendItems.push('<div class="pie-legend-item">'
        + '<div class="dot" style="background:'+color+'"></div>'
        + '<span>'+(MOD_NAMES[mod]||mod)+'</span>'
        + '<span class="val">'+count+' ('+Math.round(pct*100)+'%)</span>'
        + '</div>');
      angle = endAngle;
    });

    svg.innerHTML = slices.join('');
    legend.innerHTML = legendItems.join('');
  }

  // ===== 漏斗 =====
  function renderFunnel(hitData) {
    var total = hitData.total || Object.values(hitData.data).reduce(function(s,v){return s+v;},0);
    var kbHits = total;
    var directAnswers = Math.round(total * 0.6); // 估算直答完成

    document.getElementById('funnelQuery').textContent = Math.max(total, 1);
    document.getElementById('funnelKb').textContent = kbHits;
    document.getElementById('funnelDirect').textContent = directAnswers;

    var qPct = 100;
    var kPct = total > 0 ? 100 : 0;
    var dPct = total > 0 ? Math.round(directAnswers/total*100) : 0;

    document.getElementById('funnelQueryPct').textContent = qPct + '%';
    document.getElementById('funnelKbPct').textContent = kPct + '%';
    document.getElementById('funnelDirectPct').textContent = dPct + '%';
    document.getElementById('funnelKbBar').style.width = kPct + '%';
    document.getElementById('funnelDirectBar').style.width = dPct + '%';
  }

  // ===== API 健康 =====
  function renderApiHealth() {
    var list = document.getElementById('apiList');
    var okCount = 0;
    var checked = 0;
    var total = KB_ENDPOINTS.length;

    document.getElementById('apiCount').textContent = '0/' + total;

    list.innerHTML = KB_ENDPOINTS.map(function(ep) {
      return '<li class="api-item" data-path="'+ep.path+'">'
        + '<span class="api-method '+ep.method+'">'+ep.method+'</span>'
        + ep.path
        + ' <span style="color:var(--paper3);font-size:.7rem">'+ep.name+'</span>'
        + '<span class="api-status">⏳</span>'
        + '</li>';
    }).join('');

    KB_ENDPOINTS.forEach(function(ep, idx) {
      fetch(API_BASE + ep.path + '?token=***')
        .then(function(r){return r.ok?'ok':'err';})
        .then(function(){
          okCount++;
          var item = list.children[idx];
          if (item) {
            item.querySelector('.api-status').textContent = '✅';
            item.querySelector('.api-status').className = 'api-status ok';
          }
        })
        .catch(function(){
          var item = list.children[idx];
          if (item) {
            item.querySelector('.api-status').textContent = '❌';
            item.querySelector('.api-status').className = 'api-status err';
          }
        })
        .finally(function(){
          checked++;
          document.getElementById('apiCount').textContent = checked + '/' + total;
          if (checked === total) {
            list.dataset.okCount = okCount;
          }
        });
    });
  }

  // ===== 清除本地统计 =====
  window.resetKbStats = function() {
    if (!confirm('确认清除本地 KB 命中统计？此操作不可恢复。')) return;
    var keys = [];
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      if (key && key.startsWith('_kb_hit_')) keys.push(key);
    }
    keys.forEach(function(k){localStorage.removeItem(k);});
    loadAll();
    if (typeof showToast === 'function') showToast('已清除 ' + keys.length + ' 条本地统计', 'success');
  };

  // ===== 主加载 =====
  window.loadAll = function() {
    var hitData = getKbHitData();
    renderKpi(hitData);
    renderModTable(hitData);
    renderPaths(hitData);
    renderTrend();
    renderPie(hitData);
    renderFunnel(hitData);
    document.getElementById('lastUpdate').textContent = '更新于 ' + new Date().toLocaleTimeString('zh-CN');
  };

  // 初始加载
  loadAll();
  renderApiHealth();

  // 每 60 秒自动刷新
  setInterval(loadAll, 60000);
})();
