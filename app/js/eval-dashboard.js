/* R89-P 评估看板 · 纯前端 SVG 折线图 */
(function(){
'use strict';

// 数据来源：eval/weekly/*.json （GitHub raw：sgmt-taojing/mingli-baojian main 分支）
const GH = 'https://raw.githubusercontent.com/sgmt-taojing/mingli-baojian/main';
const WEEKS = ['2026-W24','2026-W25','2026-W26','2026-W27','2026-W28','2026-W29','2026-W30','2026-W31'];
const BENCHES = ['faithfulness','latency','cost-budget'];

// 全局缓存
const cache = { weeks: {}, fetchedAt: 0 };

function $(id){ return document.getElementById(id); }
function el(tag, props, ...children){
  const e = document.createElement(tag);
  if (props) Object.assign(e, props);
  children.flat().forEach(c => {
    if (c == null) return;
    if (typeof c === 'string') e.appendChild(document.createTextNode(c));
    else e.appendChild(c);
  });
  return e;
}
function esc(s){
  return String(s == null ? '' : s).replace(/[<>"&]/g, c => ({'<':'&lt;','>':'&gt;','"':'&quot;','&':'&amp;'})[c]);
}

// 拉取单 benchmark 单周
async function fetchWeek(week, bench){
  const url = `${GH}/eval/weekly/${week}-${bench}.json`;
  try{
    const r = await fetch(url, { cache: 'no-cache' });
    if(!r.ok) return null;
    return await r.json();
  }catch(e){
    console.warn('[fetch]', week, bench, e);
    return null;
  }
}

// 拉取所有数据
async function fetchAll(){
  const tasks = [];
  WEEKS.forEach(w => BENCHES.forEach(b => tasks.push(fetchWeek(w, b))));
  const results = await Promise.all(tasks);
  let i = 0;
  WEEKS.forEach(w => {
    cache.weeks[w] = cache.weeks[w] || {};
    BENCHES.forEach(b => {
      cache.weeks[w][b] = results[i++];
    });
  });
  cache.fetchedAt = Date.now();
  $('updateTime').textContent = '更新于 ' + new Date().toLocaleTimeString('zh-CN', {hour:'2-digit',minute:'2-digit'});
}

// 计算 4 个总览
function computeSummary(){
  const w31 = cache.weeks['2026-W31'] || {};
  const f = w31.faithfulness;
  const l = w31.latency;
  const c = w31['cost-budget'];
  const sum = [];

  if (f){
    const score = f.avg_score || 0;
    const kbhit = f.kb_hit_rate || 0;
    sum.push({label:'合规分数', icon:'📈', value: score.toFixed(3), slo:'≥ 0.7', cls: score >= 0.85 ? 'ok' : score >= 0.7 ? 'warn' : 'danger'});
    sum.push({label:'KB 命中率', icon:'🧠', value: (kbhit * 100).toFixed(1) + '%', slo:'≥ 70%', cls: kbhit >= 0.85 ? 'ok' : kbhit >= 0.7 ? 'warn' : 'danger'});
  }
  if (l){
    const p95 = l.slo?.latency?.p95_actual_ms ?? l.p95_ms ?? 0;
    sum.push({label:'P95 延迟', icon:'⚡', value: p95 + 'ms', slo:'≤ 1500ms', cls: p95 <= 500 ? 'ok' : p95 <= 1500 ? 'warn' : 'danger'});
  }
  if (c){
    const cost = c.avg_cost_yuan ?? 0;
    sum.push({label:'平均成本', icon:'💰', value: cost < 0.001 ? '< 0.001 元' : cost.toFixed(4) + ' 元', slo:'≤ 0.05 元', cls: cost <= 0.01 ? 'ok' : cost <= 0.05 ? 'warn' : 'danger'});
  }
  return sum;
}

function renderSummary(){
  const sum = computeSummary();
  const grid = $('summaryGrid');
  grid.innerHTML = '';
  sum.forEach(s => {
    const card = el('div', {className:'summary-card'},
      el('div', {className:'summary-icon'}, s.icon),
      el('div', {className:'summary-label'}, s.label),
      el('div', {className:'summary-value ' + s.cls}, s.value),
      el('div', {className:'summary-slo'}, 'SLO ' + s.slo)
    );
    grid.appendChild(card);
  });
}

// 取时序点
function series(bench, key){
  return WEEKS.map(w => {
    const d = cache.weeks[w]?.[bench];
    if (!d) return { week: w, value: null };
    return { week: w, value: get(d, key) };
  });
}
function get(d, key){
  if (key === 'avg_score') return d.avg_score;
  if (key === 'kb_hit_rate') return d.kb_hit_rate;
  if (key === 'p95_ms') return d.slo?.latency?.p95_actual_ms ?? d.p95_ms ?? null;
  if (key === 'cost_yuan') return d.avg_cost_yuan;
  return null;
}

// SVG 折线图
function renderTrend(chartId, opts){
  const wrap = $(chartId);
  if (!wrap) return;
  wrap.innerHTML = '';
  const W = 360, H = 180;
  const padL = 36, padR = 12, padT = 12, padB = 28;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const points = opts.points || series(opts.lines[0].bench, opts.lines[0].key);
  const valid = points.filter(p => p.value != null);
  const allValues = [];
  valid.forEach(p => allValues.push(p.value));
  opts.lines.forEach(line => {
    const s = series(line.bench, line.key).filter(p => p.value != null);
    s.forEach(p => allValues.push(p.value));
  });
  if (opts.target != null) allValues.push(opts.target);

  const yMin = Math.min.apply(null, allValues);
  const yMax = Math.max.apply(null, allValues);
  const yLo = Math.max(0, yMin - (yMax - yMin) * 0.15);
  const yHi = yMax + (yMax - yMin) * 0.15;
  const yPad = (yHi - yLo) < 0.001 ? 1 : 0;

  function x(i){ return padL + (i * innerW) / Math.max(1, WEEKS.length - 1); }
  function y(v){ return padT + innerH - ((v - yLo) / (yHi - yLo + yPad)) * innerH; }

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('preserveAspectRatio', 'none');

  // 网格
  for (let i = 0; i <= 4; i++){
    const yy = padT + (innerH * i / 4);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('class', 'chart-grid');
    line.setAttribute('x1', padL);
    line.setAttribute('x2', W - padR);
    line.setAttribute('y1', yy);
    line.setAttribute('y2', yy);
    svg.appendChild(line);

    const v = yHi - (yHi - yLo) * i / 4;
    const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    t.setAttribute('class', 'chart-axis');
    t.setAttribute('x', padL - 4);
    t.setAttribute('y', yy + 3);
    t.setAttribute('text-anchor', 'end');
    t.textContent = opts.fmt ? opts.fmt(v) : v.toFixed(2);
    svg.appendChild(t);
  }

  // x 轴标签（W24 W26 W28 W30）
  WEEKS.forEach((wk, i) => {
    if (i % 2 !== 0 && i !== WEEKS.length - 1) return;
    const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    t.setAttribute('class', 'chart-axis');
    t.setAttribute('x', x(i));
    t.setAttribute('y', H - 8);
    t.setAttribute('text-anchor', 'middle');
    t.textContent = wk.replace('2026-','');
    svg.appendChild(t);
  });

  // SLO 目标线
  if (opts.target != null){
    const ty = y(opts.target);
    const tg = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    tg.setAttribute('class', 'chart-target');
    tg.setAttribute('x1', padL);
    tg.setAttribute('x2', W - padR);
    tg.setAttribute('y1', ty);
    tg.setAttribute('y2', ty);
    svg.appendChild(tg);

    const tl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    tl.setAttribute('class', 'chart-target-label');
    tl.setAttribute('x', W - padR - 4);
    tl.setAttribute('y', ty - 4);
    tl.setAttribute('text-anchor', 'end');
    tl.textContent = 'SLO ' + (opts.fmt ? opts.fmt(opts.target) : opts.target);
    svg.appendChild(tl);
  }

  // 多条线
  opts.lines.forEach(line => {
    const s = series(line.bench, line.key);
    const path = [];
    s.forEach((p, i) => {
      if (p.value == null) return;
      path.push((path.length ? 'L' : 'M') + x(i) + ' ' + y(p.value));
    });
    if (!path.length) return;
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('class', 'chart-line chart-line-' + line.colorKey);
    p.setAttribute('d', path.join(' '));
    svg.appendChild(p);

    // 末端点 + 标签
    s.forEach((pt, i) => {
      if (pt.value == null) return;
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('class', 'chart-point chart-line-' + line.colorKey);
      c.setAttribute('cx', x(i));
      c.setAttribute('cy', y(pt.value));
      c.setAttribute('r', 2.5);
      c.setAttribute('fill', 'var(--chart-line-' + line.colorKey + ')');
      svg.appendChild(c);
    });
  });

  wrap.appendChild(svg);
}

// 渲染 4 张趋势图
function renderTrends(){
  renderTrend('chart-faith', {
    lines: [
      { bench: 'faithfulness', key: 'avg_score', colorKey: 'a' },
      { bench: 'faithfulness', key: 'kb_hit_rate', colorKey: 'b' }
    ],
    target: 0.7,
    fmt: v => v.toFixed(2)
  });

  renderTrend('chart-latency', {
    lines: [{ bench: 'latency', key: 'p95_ms', colorKey: 'c' }],
    target: 1500,
    fmt: v => Math.round(v) + 'ms'
  });

  renderTrend('chart-cost', {
    lines: [{ bench: 'cost-budget', key: 'cost_yuan', colorKey: 'd' }],
    target: 0.05,
    fmt: v => v < 0.001 ? v.toExponential(0) : v.toFixed(3)
  });

  // KB 命中率用 faithfulness 数据
  renderTrend('chart-kbhit', {
    lines: [{ bench: 'faithfulness', key: 'kb_hit_rate', colorKey: 'e' }],
    target: 0.7,
    fmt: v => v.toFixed(2)
  });
}

// 违规表
function renderViolations(){
  const tbl = $('violationsTable');
  tbl.innerHTML = '';
  const violations = [];
  WEEKS.forEach(w => {
    ['latency', 'cost-budget'].forEach(bench => {
      const d = cache.weeks[w]?.[bench];
      if (!d) return;
      const ll = d.slo?.latency?.violations || 0;
      const cc = d.slo?.cost?.violations || 0;
      if (ll > 0) violations.push({week: w, bench, type: 'P95 延迟', count: ll, sev: ll > 3 ? 'high' : ll > 0 ? 'mid' : 'low'});
      if (cc > 0) violations.push({week: w, bench, type: '成本预算', count: cc, sev: cc > 2 ? 'high' : cc > 0 ? 'mid' : 'low'});
    });
  });

  if (!violations.length){
    tbl.appendChild(el('div', {className:'no-violations'}, '🎉 8 周无 SLO 违规'));
    return;
  }

  const table = el('table', {className:'violations-table'},
    el('thead', null,
      el('tr', null,
        el('th', null, '周'),
        el('th', null, '基准'),
        el('th', null, '违规类型'),
        el('th', null, '次数'),
        el('th', null, '严重度')
      )
    )
  );
  const tbody = el('tbody');
  violations.forEach(v => {
    tbody.appendChild(el('tr', null,
      el('td', null, v.week),
      el('td', null, v.bench),
      el('td', null, v.type),
      el('td', null, String(v.count)),
      el('td', {className: 'sev-' + v.sev}, v.sev === 'high' ? '🔴 高' : v.sev === 'mid' ? '🟡 中' : '🟢 低')
    ));
  });
  table.appendChild(tbody);
  tbl.appendChild(table);
}

// 模块名 → eval 模块 key 映射
const MODULE_EVAL_MAP = {
  'bazi': 'bazi', '八字': 'bazi', '八字命理': 'bazi',
  'ziwei': 'ziwei', '紫微': 'ziwei', '紫微斗数': 'ziwei',
  'qimen': 'qimen', '奇门': 'qimen', '奇门遁甲': 'qimen',
  'liuyao': 'liuyao', '六爻': 'liuyao', '六爻占卜': 'liuyao',
  'liuren': 'liuren', '六壬': 'liuren', '大六壬': 'liuren',
  'meihua': 'meihua', '梅花': 'meihua', '梅花易数': 'meihua',
  'fengshui': 'fengshui', '风水': 'fengshui',
  'zodiac': 'zodiac', '生肖': 'zodiac',
  'tizhi': 'tizhi', '体质': 'tizhi',
  'tcm': 'tcm', '中医': 'tcm', '中药': 'tcm',
  'wuxing': 'wuxing', '五行': 'wuxing',
  'zeri': 'zeri', '择日': 'zeri',
};

// faith case ID → 模块 key
const FAITH_MODULE_MAP = {
  'faith-001':'bazi','faith-002':'bazi','faith-003':'bazi','faith-005':'bazi',
  'faith-006':'bazi','faith-007':'bazi','faith-019':'bazi','faith-020':'bazi',
  'faith-025':'bazi','faith-027':'bazi',
  'faith-004':'zodiac','faith-026':'zodiac',
  'faith-009':'ziwei','faith-010':'ziwei',
  'faith-011':'qimen','faith-012':'qimen',
  'faith-013':'liuren',
  'faith-014':'liuyao','faith-030':'liuyao',
  'faith-015':'meihua',
  'faith-008':'fengshui','faith-016':'fengshui','faith-017':'fengshui',
  'faith-018':'zeri',
  'faith-021':'wuxing',
  'faith-022':'tcm','faith-023':'tcm','faith-028':'tcm',
  'faith-024':'tizhi','faith-029':'tizhi',
};

// 从 W31 faithfulness 数据中提取分模块评分
function computeModuleEval(){
  const w31 = cache.weeks['2026-W31']?.faithfulness;
  if (!w31 || !w31.results) return {};
  const modScores = {};
  w31.results.forEach(r => {
    const mod = FAITH_MODULE_MAP[r.id] || 'other';
    if (!modScores[mod]) modScores[mod] = { scores: [], kbHits: 0 };
    modScores[mod].scores.push(r.score || 0);
    if ((r.score || 0) > 0) modScores[mod].kbHits++;
  });
  const summary = {};
  Object.keys(modScores).forEach(mod => {
    const s = modScores[mod];
    const avg = s.scores.reduce((a,b)=>a+b, 0) / s.scores.length;
    summary[mod] = {
      avg_score: Math.round(avg * 1000) / 1000,
      cases: s.scores.length,
      kb_hits: s.kbHits,
      kb_rate: Math.round((s.kbHits / s.scores.length) * 1000) / 1000
    };
  });
  return summary;
}

// 模块健康速览（KB 列表 + W31 分模块 eval 评分）
async function renderModules(){
  const evalData = computeModuleEval();
  try{
    const r = await fetch('/api/ai/modules', { cache: 'no-cache' });
    if (!r.ok) {
      $('modulesGrid').innerHTML = '<div class="mod-card">KB API 未连接<br><small>本地静态展示</small></div>'.repeat(6);
      return;
    }
    const j = await r.json();
    const mods = (j.data && j.data.modules) || j.modules || [];
    if (!mods.length){
      $('modulesGrid').innerHTML = '<div class="mod-card">无模块数据</div>';
      return;
    }
    $('modulesGrid').innerHTML = '';
    mods.slice(0, 16).forEach(m => {
      const modKey = m.moduleKey || m.id || '';
      // 匹配 eval 数据
      let evalKey = MODULE_EVAL_MAP[modKey] || MODULE_EVAL_MAP[m.name] || '';
      const ev = evalKey ? (evalData[evalKey] || null) : null;
      const evalScore = ev ? ev.avg_score : null;
      const evalCases = ev ? ev.cases : 0;
      const evalRate = ev ? ev.kb_rate : null;

      // eval 评分等级
      const evalCls = evalScore == null ? 'none' : evalScore >= 0.85 ? 'ok' : evalScore >= 0.7 ? 'warn' : 'danger';
      const evalText = evalScore != null ? (evalScore * 100).toFixed(0) + ' 分' : '待评';
      const evalDetail = ev ? `${evalCases} 例 · 命中 ${(evalRate * 100).toFixed(0)}%` : '';

      const card = el('div', {className:'mod-card'},
        el('div', {className:'mod-card-header'},
          el('div', {className:'mod-card-icon'}, m.icon || '⭐'),
          el('div', {className:'mod-card-name'}, esc(m.name || m.id)),
          el('div', {className:'mod-card-score eval-' + evalCls}, evalText)
        ),
        el('div', {className:'mod-card-meta'}, esc(modKey.slice(0, 14))),
        ev ? el('div', {className:'mod-card-eval-detail'},
          el('span', {className:'eval-cases'}, '📋 ' + evalCases + ' 例'),
          el('span', {className:'eval-rate'}, '📚 ' + (evalRate * 100).toFixed(0) + '%')
        ) : null,
        ev ? renderSparkline(evalScore, evalRate) : null
      );
      card.onclick = () => location.href = 'ai-assistant.html?module=' + encodeURIComponent(m.id || m.moduleKey || '');
      $('modulesGrid').appendChild(card);
    });

    // 追加 eval-only 模块（KB 列表没有但有 eval 数据的）
    const kbModKeys = mods.map(m => MODULE_EVAL_MAP[m.moduleKey || m.id || ''] || MODULE_EVAL_MAP[m.name || ''] || '');
    Object.keys(evalData).forEach(mod => {
      if (kbModKeys.includes(mod) || mod === 'other') return;
      const ev = evalData[mod];
      const evalCls = ev.avg_score >= 0.85 ? 'ok' : ev.avg_score >= 0.7 ? 'warn' : 'danger';
      const modLabels = {
        bazi:'八字',ziwei:'紫微',qimen:'奇门',liuyao:'六爻',liuren:'六壬',
        meihua:'梅花',fengshui:'风水',zodiac:'生肖',tizhi:'体质',tcm:'中医',
        wuxing:'五行',zeri:'择日'
      };
      const card = el('div', {className:'mod-card mod-card-eval-only'},
        el('div', {className:'mod-card-header'},
          el('div', {className:'mod-card-icon'}, '📊'),
          el('div', {className:'mod-card-name'}, modLabels[mod] || mod),
          el('div', {className:'mod-card-score eval-' + evalCls}, (ev.avg_score * 100).toFixed(0) + ' 分')
        ),
        el('div', {className:'mod-card-meta'}, 'eval-only'),
        el('div', {className:'mod-card-eval-detail'},
          el('span', {className:'eval-cases'}, '📋 ' + ev.cases + ' 例'),
          el('span', {className:'eval-rate'}, '📚 ' + (ev.kb_rate * 100).toFixed(0) + '%')
        )
      );
      $('modulesGrid').appendChild(card);
    });
  }catch(e){
    $('modulesGrid').innerHTML = '<div class="mod-card">模块数据加载失败<br><small>' + esc(e.message) + '</small></div>';
  }
}

// mini sparkline —— 单点 eval 分数可视化条
function renderSparkline(score, rate){
  const wrap = el('div', {className:'mod-sparkline-wrap'});
  const bar = el('div', {className:'mod-sparkline-bar'});
  const fill = el('div', {className:'mod-sparkline-fill'});
  fill.style.width = ((score || 0) * 100).toFixed(0) + '%';
  fill.className = 'mod-sparkline-fill ' + (score >= 0.85 ? 'spark-ok' : score >= 0.7 ? 'spark-warn' : 'spark-danger');
  bar.appendChild(fill);
  wrap.appendChild(bar);
  return wrap;
}

// 跨周分模块评分趋势表
function computeModuleTrend(){
  // 找出有 per-case results 的周
  const detailWeeks = WEEKS.filter(w => {
    const f = cache.weeks[w]?.faithfulness;
    return f && f.results && f.results.length > 0;
  });
  if (!detailWeeks.length) return { weeks: [], modules: {} };

  // 按周按模块聚合
  const modByWeek = {}; // { bazi: { '2026-W31': {avg, cases, kb} } }
  detailWeeks.forEach(w => {
    const f = cache.weeks[w].faithfulness;
    const agg = {};
    f.results.forEach(r => {
      const mod = FAITH_MODULE_MAP[r.id] || 'other';
      if (!agg[mod]) agg[mod] = { scores: [], kbHits: 0 };
      agg[mod].scores.push(r.score || 0);
      if ((r.score || 0) > 0) agg[mod].kbHits++;
    });
    Object.keys(agg).forEach(mod => {
      if (!modByWeek[mod]) modByWeek[mod] = {};
      const s = agg[mod];
      const avg = s.scores.reduce((a,b)=>a+b, 0) / s.scores.length;
      modByWeek[mod][w] = {
        avg: Math.round(avg * 1000) / 1000,
        cases: s.scores.length,
        kb_rate: Math.round((s.kbHits / s.scores.length) * 1000) / 1000
      };
    });
  });
  return { weeks: detailWeeks, modules: modByWeek };
}

function renderModuleTrend(){
  const wrap = $('moduleTrendTable');
  if (!wrap) return;
  const { weeks, modules } = computeModuleTrend();
  wrap.innerHTML = '';

  if (!weeks.length){
    wrap.appendChild(el('div', {className:'no-violations'}, '暂无 per-case 数据周'));  
    return;
  }

  const modLabels = {
    bazi:'八字', ziwei:'紫微', qimen:'奇门', liuyao:'六爻', liuren:'六壬',
    meihua:'梅花', fengshui:'风水', zodiac:'生肖', tizhi:'体质',
    tcm:'中医', wuxing:'五行', zeri:'择日', other:'其他'
  };
  // 按模块名排序（bazi 先）
  const modKeys = Object.keys(modules).sort((a,b) => {
    const order = ['bazi','ziwei','qimen','liuyao','liuren','meihua','fengshui','zodiac','tizhi','tcm','wuxing','zeri','other'];
    return order.indexOf(a) - order.indexOf(b);
  });

  const table = el('table', {className:'mod-trend-table'});
  // thead
  const thead = el('thead', null,
    el('tr', null,
      el('th', {className:'mod-trend-mod'}, '模块'),
      ...weeks.map(w => el('th', {className:'mod-trend-week'}, w.replace('2026-',''))),
      el('th', {className:'mod-trend-avg'}, '均值')
    )
  );
  table.appendChild(thead);

  // tbody
  const tbody = el('tbody');
  modKeys.forEach(mod => {
    const row = el('tr', null,
      el('td', {className:'mod-trend-mod'}, modLabels[mod] || mod)
    );
    const allAvgs = [];
    weeks.forEach(w => {
      const d = modules[mod][w];
      if (d){
        allAvgs.push(d.avg);
        const cls = d.avg >= 0.85 ? 'ok' : d.avg >= 0.7 ? 'warn' : 'danger';
        row.appendChild(el('td', {className:'mod-trend-cell eval-' + cls},
          el('span', {className:'cell-score'}, d.avg.toFixed(3)),
          el('span', {className:'cell-meta'}, d.cases + '例 ' + (d.kb_rate * 100).toFixed(0) + '%')
        ));
      } else {
        row.appendChild(el('td', {className:'mod-trend-cell eval-none'}, '—'));
      }
    });
    // 均值列
    if (allAvgs.length){
      const overallAvg = allAvgs.reduce((a,b)=>a+b, 0) / allAvgs.length;
      const cls = overallAvg >= 0.85 ? 'ok' : overallAvg >= 0.7 ? 'warn' : 'danger';
      row.appendChild(el('td', {className:'mod-trend-avg eval-' + cls}, overallAvg.toFixed(3)));
    } else {
      row.appendChild(el('td', {className:'mod-trend-avg'}, '—'));
    }
    tbody.appendChild(row);
  });
  table.appendChild(tbody);
  wrap.appendChild(table);
}

// 导出当前快照
function exportSnapshot(){
  const snap = {
    generated_at: new Date().toISOString(),
    weeks: WEEKS,
    summary: computeSummary(),
    raw: cache.weeks
  };
  const blob = new Blob([JSON.stringify(snap, null, 2)], {type: 'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'eval-snapshot-' + new Date().toISOString().slice(0,10) + '.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

// 主入口
async function refresh(){
  $('refreshBtn').textContent = '⏳ 加载中…';
  $('refreshBtn').disabled = true;
  try{
    await fetchAll();
    renderSummary();
    renderTrends();
    renderViolations();
    renderModules();
    renderModuleTrend();
  }finally{
    $('refreshBtn').textContent = '🔄 刷新';
    $('refreshBtn').disabled = false;
  }
}

$('refreshBtn').addEventListener('click', refresh);
$('exportBtn').addEventListener('click', exportSnapshot);

// 启动
refresh();

// 30 分钟自动刷新
setInterval(refresh, 30 * 60 * 1000);

})();