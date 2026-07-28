/* R89-P 评估看板 · 纯前端 SVG 折线图 */
(function(){
'use strict';

// 数据来源：eval/weekly/*.json （GitHub raw：sgmt-taojing/mingli-baojian main 分支）
const GH = 'https://raw.githubusercontent.com/sgmt-taojing/mingli-baojian/main';
const WEEKS = ['2026-W24','2026-W25','2026-W26','2026-W27','2026-W28','2026-W29','2026-W30','2026-W31'];
const BENCHES = ['faithfulness','latency','cost-budget','alert-card'];

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

// 获取 alert-card
async function fetchAlertCard(week){
  const url = `${GH}/eval/weekly/${week}-alert-card.json`;
  try{
    const r = await fetch(url, { cache: 'no-cache' });
    if(!r.ok) return null;
    return await r.json();
  }catch(e){
    console.warn('[alert-card fetch]', week, e);
    return null;
  }
}

// 渲染 alert-card
function renderAlertCard(){
  const wrap = $('alertCardBody');
  if (!wrap) return;
  wrap.innerHTML = '';

  // 收集所有周的 alert-card
  const weekAlerts = WEEKS.map(w => ({ week: w, card: cache.weeks[w]?.['alert-card'] })).filter(x => x.card);

  if (!weekAlerts.length){
    wrap.appendChild(el('div', {className:'alert-empty'}, '暂无 alert-card 数据'));
    return;
  }

  // 最新周作为主卡片
  const latest = weekAlerts[weekAlerts.length - 1];
  const card = latest.card;
  const levelCls = card.overall_level === 'CRITICAL' ? 'alert-critical' :
                   card.overall_level === 'WARN' ? 'alert-warn' : 'alert-ok';
  const levelIcon = card.overall_level === 'CRITICAL' ? '🔴' :
                    card.overall_level === 'WARN' ? '🟡' : '🟢';

  // 主卡
  const mainCard = el('div', {className:'alert-main ' + levelCls},
    el('div', {className:'alert-main-header'},
      el('span', {className:'alert-level-icon'}, levelIcon),
      el('span', {className:'alert-level-text'}, card.overall_level || 'UNKNOWN'),
      el('span', {className:'alert-week'}, latest.week)
    ),
    el('div', {className:'alert-generated'}, '生成于 ' + (card.generated_at || '--'))
  );

  // 三维度分解
  const judgments = card.judgments || {};
  const benchLabels = {
    'faithfulness': '合规分数',
    'cost-budget': '成本预算',
    'latency': 'P95 延迟'
  };
  const benchIcons = {
    'faithfulness': '📈',
    'cost-budget': '💰',
    'latency': '⚡'
  };

  const benchGrid = el('div', {className:'alert-bench-grid'});
  Object.keys(judgments).forEach(bench => {
    const j = judgments[bench];
    const jLevelCls = j.level === 'CRITICAL' ? 'alert-critical' :
                      j.level === 'WARN' ? 'alert-warn' : 'alert-ok';
    const jIcon = j.level === 'CRITICAL' ? '🔴' :
                  j.level === 'WARN' ? '🟡' : '🟢';

    // 格式化 actual 值
    let actualText = '';
    if (j.metric === 'avg_score') actualText = (j.actual || 0).toFixed(3);
    else if (j.metric === 'avg_yuan') actualText = j.actual < 0.001 ? '< 0.001 元' : (j.actual || 0).toFixed(4) + ' 元';
    else if (j.metric === 'p95_ms') actualText = (j.actual || 0) + 'ms';
    else actualText = String(j.actual ?? '--');

    // 阈值/目标
    let thresholdText = '';
    if (j.threshold){
      thresholdText = `临界 ${j.threshold.critical} / 警告 ${j.threshold.warn}`;
    } else if (j.target != null){
      thresholdText = `目标 ${j.metric === 'avg_yuan' ? j.target + ' 元' : j.metric === 'p95_ms' ? j.target + 'ms' : j.target}`;
    }

    const benchCard = el('div', {className:'alert-bench-card ' + jLevelCls},
      el('div', {className:'alert-bench-header'},
        el('span', {className:'alert-bench-icon'}, benchIcons[bench] || '📊'),
        el('span', {className:'alert-bench-name'}, benchLabels[bench] || bench),
        el('span', {className:'alert-bench-level'}, jIcon + ' ' + j.level)
      ),
      el('div', {className:'alert-bench-actual'}, actualText),
      el('div', {className:'alert-bench-threshold'}, thresholdText || ''),
      el('div', {className:'alert-bench-violations'}, '违规 ' + (j.violations || 0) + ' 次')
    );

    // 低分案例
    if (j.low_cases && j.low_cases.length){
      const casesWrap = el('div', {className:'alert-low-cases'},
        el('div', {className:'alert-low-cases-title'}, '⚠ 低分案例')
      );
      j.low_cases.forEach(c => {
        casesWrap.appendChild(el('div', {className:'alert-low-case'},
          el('span', {className:'low-case-id'}, c.id || c.case_id || '--'),
          el('span', {className:'low-case-score'}, (c.score != null ? c.score : c.actual ?? '--').toString()),
          c.module ? el('span', {className:'low-case-mod'}, c.module) : null
        ));
      });
      benchCard.appendChild(casesWrap);
    }

    // 模块维度钻取（仅 faithfulness）
    if (bench === 'faithfulness'){
      const modDrill = el('div', {className:'alert-mod-drill'},
        el('div', {className:'alert-mod-drill-toggle', onclick:(e)=>{
          e.stopPropagation();
          const body = benchCard.querySelector('.alert-mod-drill-body');
          if (body){
            const isOpen = body.style.display !== 'none';
            body.style.display = isOpen ? 'none' : 'block';
            toggle.textContent = isOpen ? '▸ 按模块钻取' : '▾ 收起模块';
          }
        }}, (toggle = el('span', {className:'alert-mod-drill-label'}, '▸ 按模块钻取'))
        )
      );
      var toggle;
      // 从当前周 faithfulness results 按模块聚合
      const fData = cache.weeks[latest.week]?.faithfulness;
      if (fData && fData.results && fData.results.length){
        const modAgg = {};
        fData.results.forEach(r => {
          const mod = FAITH_MODULE_MAP[r.id] || 'other';
          if (!modAgg[mod]) modAgg[mod] = { scores: [], kbHits: 0 };
          modAgg[mod].scores.push(r.score || 0);
          if ((r.score || 0) > 0) modAgg[mod].kbHits++;
        });
        // 模块中文名
        const modNames = {
          bazi:'八字', zodiac:'生肖', ziwei:'紫微', qimen:'奇门',
          liuren:'六壬', liuyao:'六爻', meihua:'梅花',
          fengshui:'风水', zeri:'择日', wuxing:'五行',
          tcm:'中医', tizhi:'体质', other:'其他'
        };
        // 按均分升序排列（低分在前）
        const modList = Object.keys(modAgg).map(mod => {
          const s = modAgg[mod];
          const avg = s.scores.reduce((a,b)=>a+b, 0) / s.scores.length;
          return {
            mod, name: modNames[mod] || mod,
            avg: Math.round(avg * 1000) / 1000,
            cases: s.scores.length,
            kbRate: Math.round((s.kbHits / s.scores.length) * 100),
            min: Math.min(...s.scores),
            max: Math.max(...s.scores)
          };
        }).sort((a, b) => a.avg - b.avg);

        const drillBody = el('div', {className:'alert-mod-drill-body', style:'display:none'});
        modList.forEach(m => {
          const mCls = m.avg >= 0.85 ? 'alert-ok' : m.avg >= 0.7 ? 'alert-warn' : 'alert-critical';
          const barWidth = Math.round(m.avg * 100);
          drillBody.appendChild(el('div', {className:'alert-mod-row ' + mCls},
            el('span', {className:'alert-mod-name'}, m.name),
            el('span', {className:'alert-mod-score'}, m.avg.toFixed(3)),
            el('div', {className:'alert-mod-bar'},
              el('div', {className:'alert-mod-bar-fill ' + mCls, style:`width:${barWidth}%`})
            ),
            el('span', {className:'alert-mod-meta'}, `${m.cases}例 · KB ${m.kbRate}% · ${m.min.toFixed(2)}~${m.max.toFixed(2)}`)
          ));
        });
        modDrill.appendChild(drillBody);
      } else {
        modDrill.appendChild(el('div', {className:'alert-mod-drill-empty', style:'display:none'}, '暂无 per-case 数据'));
      }
      benchCard.appendChild(modDrill);
    }

    benchGrid.appendChild(benchCard);
  });

  mainCard.appendChild(benchGrid);

  // 历史周告警等级 mini-strip
  if (weekAlerts.length > 1){
    const histStrip = el('div', {className:'alert-hist-strip'},
      el('span', {className:'alert-hist-label'}, '历史告警:')
    );
    weekAlerts.forEach(wa => {
      const hLevel = wa.card.overall_level || 'UNKNOWN';
      const hCls = hLevel === 'CRITICAL' ? 'alert-critical' :
                   hLevel === 'WARN' ? 'alert-warn' : 'alert-ok';
      const hIcon = hLevel === 'CRITICAL' ? '🔴' :
                    hLevel === 'WARN' ? '🟡' : '🟢';
      histStrip.appendChild(el('span', {className:'alert-hist-item ' + hCls},
        hIcon + ' ' + wa.week.replace('2026-','')
      ));
    });
    mainCard.appendChild(histStrip);
  }

  wrap.appendChild(mainCard);
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

// 跨周汇总统计表
function computeWeeklyStats(){
  const metrics = [
    { key: 'faith_score', label: '合规分数', bench: 'faithfulness', field: 'avg_score', fmt: v => v.toFixed(3), slo: 0.7, invert: false },
    { key: 'faith_kb', label: 'KB 命中率', bench: 'faithfulness', field: 'kb_hit_rate', fmt: v => (v * 100).toFixed(1) + '%', slo: 0.7, invert: false },
    { key: 'latency_p95', label: 'P95 延迟', bench: 'latency', field: 'p95_ms', fmt: v => Math.round(v) + 'ms', slo: 1500, invert: true },
    { key: 'cost_avg', label: '平均成本', bench: 'cost-budget', field: 'cost_yuan', fmt: v => v < 0.001 ? v.toExponential(1) : v.toFixed(4) + '元', slo: 0.05, invert: true }
  ];
  const rows = metrics.map(m => {
    const vals = WEEKS.map(w => {
      const d = cache.weeks[w]?.[m.bench];
      if (!d) return null;
      return get(d, m.field);
    }).filter(v => v != null);
    if (!vals.length) return { ...m, vals: [], avg: null, min: null, max: null, trend: null };
    const avg = vals.reduce((a,b) => a+b, 0) / vals.length;
    const min = Math.min.apply(null, vals);
    const max = Math.max.apply(null, vals);
    // trend: compare last 2 vs first 2
    let trend = '→';
    if (vals.length >= 4){
      const early = vals.slice(0, 2).reduce((a,b)=>a+b,0) / 2;
      const recent = vals.slice(-2).reduce((a,b)=>a+b,0) / 2;
      const diff = (recent - early) / Math.abs(early || 1);
      if (m.invert){
        if (diff < -0.05) trend = '↓';
        else if (diff > 0.05) trend = '↑';
      } else {
        if (diff > 0.05) trend = '↑';
        else if (diff < -0.05) trend = '↓';
      }
    } else if (vals.length >= 2){
      const diff = (vals[vals.length-1] - vals[0]) / Math.abs(vals[0] || 1);
      if (m.invert){
        if (diff < -0.05) trend = '↓';
        else if (diff > 0.05) trend = '↑';
      } else {
        if (diff > 0.05) trend = '↑';
        else if (diff < -0.05) trend = '↓';
      }
    }
    return { ...m, vals, avg, min, max, trend };
  });
  return rows;
}

function renderWeeklyStats(){
  const wrap = $('weeklyStatsTable');
  if (!wrap) return;
  const rows = computeWeeklyStats();
  wrap.innerHTML = '';

  if (!rows.length || !rows[0].vals.length){
    wrap.appendChild(el('div', {className:'no-violations'}, '暂无数据'));
    return;
  }

  const table = el('table', {className:'weekly-stats-table'});
  // thead
  const thead = el('thead', null,
    el('tr', null,
      el('th', {className:'ws-metric'}, '指标'),
      ...WEEKS.map(w => el('th', {className:'ws-week'}, w.replace('2026-',''))),
      el('th', {className:'ws-avg'}, '均值'),
      el('th', {className:'ws-min'}, '最低'),
      el('th', {className:'ws-max'}, '最高'),
      el('th', {className:'ws-trend'}, '趋势')
    )
  );
  table.appendChild(thead);

  const tbody = el('tbody');
  rows.forEach(r => {
    if (!r.vals.length) return;
    const row = el('tr', null,
      el('td', {className:'ws-metric'}, r.label)
    );
    // per-week values
    WEEKS.forEach(w => {
      const d = cache.weeks[w]?.[r.bench];
      const v = d ? get(d, r.field) : null;
      if (v != null){
        const cls = r.invert
          ? (v <= r.slo * 0.5 ? 'ok' : v <= r.slo ? 'warn' : 'danger')
          : (v >= r.slo * 1.2 ? 'ok' : v >= r.slo ? 'warn' : 'danger');
        row.appendChild(el('td', {className:'ws-cell eval-' + cls}, r.fmt(v)));
      } else {
        row.appendChild(el('td', {className:'ws-cell eval-none'}, '—'));
      }
    });
    // avg / min / max
    row.appendChild(el('td', {className:'ws-avg'}, r.fmt(r.avg)));
    row.appendChild(el('td', {className:'ws-min'}, r.fmt(r.min)));
    row.appendChild(el('td', {className:'ws-max'}, r.fmt(r.max)));
    // trend with color
    const trendCls = r.trend === '↑' ? (r.invert ? 'trend-bad' : 'trend-good')
                   : r.trend === '↓' ? (r.invert ? 'trend-good' : 'trend-bad')
                   : 'trend-flat';
    row.appendChild(el('td', {className:'ws-trend ' + trendCls}, r.trend));
    tbody.appendChild(row);
  });
  table.appendChild(tbody);
  wrap.appendChild(table);
}

// 周环比 WoW 计算
function computeWoW(){
  const metrics = [
    { key: 'faith_score', label: '合规分数', bench: 'faithfulness', field: 'avg_score', fmt: v => v.toFixed(3), invert: false },
    { key: 'faith_kb', label: 'KB 命中率', bench: 'faithfulness', field: 'kb_hit_rate', fmt: v => (v*100).toFixed(1)+'%', invert: false },
    { key: 'latency_p95', label: 'P95 延迟', bench: 'latency', field: 'p95_ms', fmt: v => Math.round(v)+'ms', invert: true },
    { key: 'cost_avg', label: '平均成本', bench: 'cost-budget', field: 'avg_cost_yuan', fmt: v => v<0.001 ? v.toExponential(1) : v.toFixed(4)+'元', invert: true }
  ];
  // 构造 7 个周对
  const pairs = [];
  for (let i = 0; i < WEEKS.length - 1; i++){
    pairs.push({ from: WEEKS[i], to: WEEKS[i+1] });
  }
  return { metrics, pairs };
}

function renderWoW(){
  const wrap = $('wowTable');
  if (!wrap) return;
  const { metrics, pairs } = computeWoW();
  wrap.innerHTML = '';

  // 检查是否有数据
  const hasData = metrics.some(m =>
    pairs.some(p => {
      const dFrom = cache.weeks[p.from]?.[m.bench];
      const dTo = cache.weeks[p.to]?.[m.bench];
      return dFrom && dTo && get(dFrom, m.field) != null && get(dTo, m.field) != null;
    })
  );
  if (!hasData){
    wrap.appendChild(el('div', {className:'no-violations'}, '暂无数据'));
    return;
  }

  const table = el('table', {className:'wow-table'});
  // thead
  const thead = el('thead', null,
    el('tr', null,
      el('th', {className:'wow-metric'}, '指标'),
      ...pairs.map(p => el('th', {className:'wow-pair'}, p.from.replace('2026-','') + '→' + p.to.replace('2026-','')))
    )
  );
  table.appendChild(thead);

  const tbody = el('tbody');
  metrics.forEach(m => {
    const row = el('tr', null,
      el('td', {className:'wow-metric'}, m.label)
    );
    pairs.forEach(p => {
      const dFrom = cache.weeks[p.from]?.[m.bench];
      const dTo = cache.weeks[p.to]?.[m.bench];
      const vFrom = dFrom ? get(dFrom, m.field) : null;
      const vTo = dTo ? get(dTo, m.field) : null;

      if (vFrom == null || vTo == null){
        row.appendChild(el('td', {className:'wow-cell wow-none'}, '—'));
        return;
      }

      const delta = vTo - vFrom;
      const pct = vFrom !== 0 ? (delta / Math.abs(vFrom)) : 0;
      const pctStr = (pct >= 0 ? '+' : '') + (pct * 100).toFixed(1) + '%';

      // 判断改善/恶化
      let cls;
      if (Math.abs(pct) < 0.02){
        cls = 'wow-flat';
      } else if (m.invert){
        // 延迟/成本：下降=改善
        cls = delta < 0 ? 'wow-good' : 'wow-bad';
      } else {
        // 分数/命中率：上升=改善
        cls = delta > 0 ? 'wow-good' : 'wow-bad';
      }

      const arrow = pct > 0.02 ? '↑' : pct < -0.02 ? '↓' : '→';
      const cell = el('td', {className:'wow-cell ' + cls},
        m.fmt(vTo) + ' ',
        el('span', {className:'wow-delta'}, arrow + ' ' + pctStr)
      );
      row.appendChild(cell);
    });
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

// 告警历史趋势
function renderAlertHistory(){
  const wrap = $('alertHistoryBody');
  if (!wrap) return;
  wrap.innerHTML = '';

  // 收集所有周的 alert-card
  const weekAlerts = WEEKS.map(w => ({ week: w, card: cache.weeks[w]?.['alert-card'] })).filter(x => x.card);

  if (!weekAlerts.length){
    wrap.appendChild(el('div', {className:'alert-empty'}, '暂无告警历史数据'));
    return;
  }

  // 统计
  const stats = { CRITICAL: 0, WARN: 0, OK: 0 };
  weekAlerts.forEach(wa => {
    const lv = wa.card.overall_level || 'UNKNOWN';
    if (stats[lv] != null) stats[lv]++;
  });
  const totalWeeks = weekAlerts.length;

  // 顶部统计条
  const statBar = el('div', {className:'alert-hist-statbar'},
    el('span', {className:'alert-hist-stat'}, `共 ${totalWeeks} 周`),
    el('span', {className:'alert-hist-stat alert-critical'}, `🔴 CRITICAL ${stats.CRITICAL}`),
    el('span', {className:'alert-hist-stat alert-warn'}, `🟡 WARN ${stats.WARN}`),
    el('span', {className:'alert-hist-stat alert-ok'}, `🟢 OK ${stats.OK}`)
  );

  // 趋势判断
  const firstLv = weekAlerts[0].card.overall_level || 'UNKNOWN';
  const lastLv = weekAlerts[weekAlerts.length - 1].card.overall_level || 'UNKNOWN';
  const lvOrder = { 'CRITICAL': 0, 'WARN': 1, 'OK': 2 };
  const trend = (lvOrder[lastLv] ?? 1) - (lvOrder[firstLv] ?? 1);
  const trendText = trend > 0 ? '↑ 改善' : trend < 0 ? '↓ 恶化' : '→ 持平';
  const trendCls = trend > 0 ? 'alert-ok' : trend < 0 ? 'alert-critical' : '';
  statBar.appendChild(el('span', {className:'alert-hist-stat ' + trendCls}, `趋势 ${trendText}（${firstLv}→${lastLv}）`));

  wrap.appendChild(statBar);

  // 历史趋势表
  const table = el('table', {className:'alert-hist-table'});

  // 表头
  const thead = el('thead', {},
    el('tr', {},
      el('th', {}, '周'),
      el('th', {}, '整体'),
      el('th', {}, '合规分数'),
      el('th', {}, '成本预算'),
      el('th', {}, 'P95 延迟'),
      el('th', {}, '生成时间')
    )
  );
  table.appendChild(thead);

  // 表体（最新周在顶部）· 行可点击展开/收起
  const tbody = el('tbody');
  [...weekAlerts].reverse().forEach(wa => {
    const card = wa.card;
    const lv = card.overall_level || 'UNKNOWN';
    const lvCls = lv === 'CRITICAL' ? 'alert-critical' : lv === 'WARN' ? 'alert-warn' : 'alert-ok';
    const lvIcon = lv === 'CRITICAL' ? '🔴' : lv === 'WARN' ? '🟡' : '🟢';

    const judgments = card.judgments || {};
    function benchCell(bench){
      const j = judgments[bench];
      if (!j) return el('td', {className:'alert-cell-none'}, '—');
      const jLv = j.level || 'UNKNOWN';
      const jCls = jLv === 'CRITICAL' ? 'alert-critical' : jLv === 'WARN' ? 'alert-warn' : 'alert-ok';
      const jIcon = jLv === 'CRITICAL' ? '🔴' : jLv === 'WARN' ? '🟡' : '🟢';
      let val = '';
      if (j.metric === 'avg_score') val = (j.actual || 0).toFixed(3);
      else if (j.metric === 'avg_yuan') val = j.actual < 0.001 ? '<0.001' : (j.actual || 0).toFixed(4);
      else if (j.metric === 'p95_ms') val = (j.actual || 0) + 'ms';
      else val = String(j.actual ?? '--');
      return el('td', {className:'alert-cell ' + jCls}, jIcon + ' ' + val);
    }

    const genTime = (card.generated_at || '--').replace(' CST','');
    const tr = el('tr', {className:'alert-hist-row ' + lvCls},
      el('td', {className:'alert-cell-week'},
        el('span', {className:'alert-expand-icon'}, '▸'),
        wa.week.replace('2026-','')
      ),
      el('td', {className:'alert-cell ' + lvCls}, lvIcon + ' ' + lv),
      benchCell('faithfulness'),
      benchCell('cost-budget'),
      benchCell('latency'),
      el('td', {className:'alert-cell-time'}, genTime)
    );

    // 展开行（默认隐藏）
    const detailRow = el('tr', {className:'alert-hist-detail-row', style:'display:none'});
    const detailCell = el('td', {colSpan: 6, className:'alert-hist-detail-cell'});

    // 构建详情内容
    const detailWrap = el('div', {className:'alert-hist-detail-wrap'});

    // 三维度分解网格
    const benchLabels = { 'faithfulness':'合规分数', 'cost-budget':'成本预算', 'latency':'P95 延迟' };
    const benchIcons = { 'faithfulness':'📈', 'cost-budget':'💰', 'latency':'⚡' };
    const detailGrid = el('div', {className:'alert-detail-grid'});
    Object.keys(judgments).forEach(bench => {
      const j = judgments[bench];
      const jLv = j.level || 'UNKNOWN';
      const jCls = jLv === 'CRITICAL' ? 'alert-critical' : jLv === 'WARN' ? 'alert-warn' : 'alert-ok';
      const jIcon = jLv === 'CRITICAL' ? '🔴' : jLv === 'WARN' ? '🟡' : '🟢';

      let actualText = '';
      if (j.metric === 'avg_score') actualText = (j.actual || 0).toFixed(3);
      else if (j.metric === 'avg_yuan') actualText = j.actual < 0.001 ? '< 0.001 元' : (j.actual || 0).toFixed(4) + ' 元';
      else if (j.metric === 'p95_ms') actualText = (j.actual || 0) + 'ms';
      else actualText = String(j.actual ?? '--');

      let thresholdText = '';
      if (j.threshold) thresholdText = `临界 ${j.threshold.critical} / 警告 ${j.threshold.warn}`;
      else if (j.target != null) thresholdText = `目标 ${j.metric === 'avg_yuan' ? j.target + ' 元' : j.metric === 'p95_ms' ? j.target + 'ms' : j.target}`;

      const detailCard = el('div', {className:'alert-detail-card ' + jCls},
        el('div', {className:'alert-detail-header'},
          el('span', {className:'alert-detail-icon'}, benchIcons[bench] || '📊'),
          el('span', {className:'alert-detail-name'}, benchLabels[bench] || bench),
          el('span', {className:'alert-detail-level'}, jIcon + ' ' + jLv)
        ),
        el('div', {className:'alert-detail-actual'}, actualText),
        el('div', {className:'alert-detail-threshold'}, thresholdText || ''),
        el('div', {className:'alert-detail-violations'}, '违规 ' + (j.violations || 0) + ' 次')
      );

      // 低分案例
      if (j.low_cases && j.low_cases.length){
        const casesWrap = el('div', {className:'alert-detail-cases'},
          el('div', {className:'alert-detail-cases-title'}, '⚠ 低分案例')
        );
        j.low_cases.forEach(c => {
          casesWrap.appendChild(el('div', {className:'alert-detail-case'},
            el('span', {className:'alert-detail-case-id'}, c.id || c.case_id || '--'),
            el('span', {className:'alert-detail-case-score'}, (c.score != null ? c.score : c.actual ?? '--').toString()),
            c.module ? el('span', {className:'alert-detail-case-mod'}, c.module) : null
          ));
        });
        detailCard.appendChild(casesWrap);
      }
      detailGrid.appendChild(detailCard);
    });
    detailWrap.appendChild(detailGrid);

    // 额外信息：该周 faithfulness per-case 低分（从 cache 补充）
    const faithData = cache.weeks[wa.week]?.faithfulness;
    if (faithData && faithData.results && faithData.results.length){
      const lowFaith = faithData.results.filter(r => (r.score || 0) < 0.7);
      if (lowFaith.length){
        const lowWrap = el('div', {className:'alert-detail-extra'},
          el('div', {className:'alert-detail-extra-title'}, `📋 ${wa.week} faithfulness 低分案例（${lowFaith.length} 条 < 0.7）`)
        );
        lowFaith.forEach(r => {
          const score = r.score || 0;
          const cls = score >= 0.7 ? 'ok' : score >= 0.4 ? 'warn' : 'danger';
          lowWrap.appendChild(el('div', {className:'alert-detail-extra-case eval-' + cls},
            el('span', {className:'alert-detail-case-id'}, r.id || '--'),
            el('span', {className:'alert-detail-case-score'}, score.toFixed(3)),
            el('span', {className:'alert-detail-case-query'}, (r.query || r.note || '').slice(0, 50))
          ));
        });
        detailWrap.appendChild(lowWrap);
      }
    }

    detailCell.appendChild(detailWrap);
    detailRow.appendChild(detailCell);

    // 点击展开/收起
    tr.addEventListener('click', () => {
      const isHidden = detailRow.style.display === 'none';
      detailRow.style.display = isHidden ? '' : 'none';
      tr.classList.toggle('alert-hist-row-expanded', isHidden);
      const icon = tr.querySelector('.alert-expand-icon');
      if (icon) icon.textContent = isHidden ? '▾' : '▸';
    });
    tr.style.cursor = 'pointer';

    tbody.appendChild(tr);
    tbody.appendChild(detailRow);
  });
  table.appendChild(tbody);
  wrap.appendChild(table);

  // SVG 轨迹条带
  const svgW = Math.max(weekAlerts.length * 80 + 40, 320);
  const svgH = 60;
  const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('class','alert-hist-svg');
  svg.setAttribute('viewBox',`0 0 ${svgW} ${svgH}`);
  svg.setAttribute('width', svgW);
  svg.setAttribute('height', svgH);

  const colors = { 'CRITICAL': '#e74c3c', 'WARN': '#f39c12', 'OK': '#27ae60' };
  const yMap = { 'CRITICAL': 15, 'WARN': 30, 'OK': 45 };
  const stepX = (svgW - 40) / Math.max(weekAlerts.length - 1, 1);

  // 背景参考线
  [15, 30, 45].forEach(y => {
    const line = document.createElementNS('http://www.w3.org/2000/svg','line');
    line.setAttribute('x1', 20); line.setAttribute('x2', svgW - 20);
    line.setAttribute('y1', y); line.setAttribute('y2', y);
    line.setAttribute('stroke', '#444'); line.setAttribute('stroke-width', '0.5');
    line.setAttribute('stroke-dasharray', '2,3');
    svg.appendChild(line);
  });

  // 折线
  let pathD = '';
  weekAlerts.forEach((wa, i) => {
    const lv = wa.card.overall_level || 'WARN';
    const x = 20 + i * stepX;
    const y = yMap[lv] ?? 30;
    pathD += (i === 0 ? 'M' : ' L') + ` ${x} ${y}`;
  });
  if (pathD){
    const path = document.createElementNS('http://www.w3.org/2000/svg','path');
    path.setAttribute('d', pathD);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', '#888');
    path.setAttribute('stroke-width', '2');
    svg.appendChild(path);
  }

  // 圆点 + 标签
  weekAlerts.forEach((wa, i) => {
    const lv = wa.card.overall_level || 'WARN';
    const x = 20 + i * stepX;
    const y = yMap[lv] ?? 30;
    const circle = document.createElementNS('http://www.w3.org/2000/svg','circle');
    circle.setAttribute('cx', x); circle.setAttribute('cy', y); circle.setAttribute('r', 6);
    circle.setAttribute('fill', colors[lv] || '#888');
    svg.appendChild(circle);

    const label = document.createElementNS('http://www.w3.org/2000/svg','text');
    label.setAttribute('x', x); label.setAttribute('y', y - 12);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('font-size', '9');
    label.setAttribute('fill', '#aaa');
    label.textContent = wa.week.replace('2026-','');
    svg.appendChild(label);
  });

  // 关键事件标注（等级转换点）
  const transitions = [];
  for (let i = 1; i < weekAlerts.length; i++){
    const prevLv = weekAlerts[i-1].card.overall_level || 'WARN';
    const currLv = weekAlerts[i].card.overall_level || 'WARN';
    if (prevLv !== currLv){
      transitions.push({
        weekIdx: i,
        week: weekAlerts[i].week,
        from: prevLv,
        to: currLv,
        x: 20 + i * stepX,
        y: yMap[currLv] ?? 30,
        improved: (lvOrder[currLv] ?? 1) > (lvOrder[prevLv] ?? 1)
      });
    }
  }

  // 转换点：虚线竖线 + 箭头 + 标注文字
  transitions.forEach(t => {
    // 竖虚线
    const vline = document.createElementNS('http://www.w3.org/2000/svg','line');
    vline.setAttribute('x1', t.x); vline.setAttribute('x2', t.x);
    vline.setAttribute('y1', 8); vline.setAttribute('y2', 52);
    vline.setAttribute('stroke', t.improved ? '#27ae60' : '#e74c3c');
    vline.setAttribute('stroke-width', '1');
    vline.setAttribute('stroke-dasharray', '3,2');
    vline.setAttribute('opacity', '0.6');
    svg.appendChild(vline);

    // 箭头（上→下表示改善，下→上表示恶化）
    const arrowY = t.improved ? t.y - 10 : t.y + 10;
    const arrow = document.createElementNS('http://www.w3.org/2000/svg','text');
    arrow.setAttribute('x', t.x);
    arrow.setAttribute('y', arrowY);
    arrow.setAttribute('text-anchor', 'middle');
    arrow.setAttribute('font-size', '10');
    arrow.setAttribute('fill', t.improved ? '#27ae60' : '#e74c3c');
    arrow.textContent = t.improved ? '↑' : '↓';
    svg.appendChild(arrow);

    // 转换标签
    const tag = document.createElementNS('http://www.w3.org/2000/svg','text');
    tag.setAttribute('x', t.x);
    tag.setAttribute('y', 56);
    tag.setAttribute('text-anchor', 'middle');
    tag.setAttribute('font-size', '7');
    tag.setAttribute('fill', t.improved ? '#27ae60' : '#e74c3c');
    tag.textContent = `${t.from.slice(0,3)}→${t.to.slice(0,3)}`;
    svg.appendChild(tag);
  });

  wrap.appendChild(svg);

  // 关键事件清单
  if (transitions.length){
    const eventList = el('div', {className:'alert-milestone-list'});
    eventList.appendChild(el('div', {className:'alert-milestone-title'}, `🎯 关键事件（${transitions.length} 次等级转换）`));
    transitions.forEach(t => {
      const cls = t.improved ? 'alert-ok' : 'alert-critical';
      const icon = t.improved ? '📈' : '📉';
      const weekShort = t.week.replace('2026-','');
      eventList.appendChild(el('div', {className:'alert-milestone-item ' + cls},
        el('span', {className:'milestone-week'}, weekShort),
        el('span', {className:'milestone-icon'}, icon),
        el('span', {className:'milestone-desc'}, `${t.from} → ${t.to}`)
      ));
    });
    wrap.appendChild(eventList);
  }
}

// Per-Case 明细表
function renderPerCase(){
  const wrap = $('percaseBody');
  if (!wrap) return;

  // 填充周选择器
  const weekSel = $('percaseWeekSel');
  const benchSel = $('percaseBenchSel');
  if (!weekSel.options.length){
    WEEKS.slice().reverse().forEach(w => {
      const opt = document.createElement('option');
      opt.value = w; opt.textContent = w.replace('2026-','');
      if (w === WEEKS[WEEKS.length-1]) opt.selected = true;
      weekSel.appendChild(opt);
    });
    weekSel.addEventListener('change', () => renderPerCase());
    benchSel.addEventListener('change', () => renderPerCase());
  }

  const week = weekSel.value || WEEKS[WEEKS.length-1];
  const bench = benchSel.value || 'cost-budget';
  const data = cache.weeks[week]?.[bench];

  wrap.innerHTML = '';

  if (!data || !data.results || !data.results.length){
    wrap.appendChild(el('div', {className:'no-violations'}, `该周无 ${bench} per-case 数据`));
    return;
  }

  const results = data.results;
  const okCount = results.filter(r => r.ok).length;
  const failCount = results.length - okCount;
  const latencies = results.map(r => r.latency_ms || 0).sort((a,b) => a - b);
  const p50 = latencies[Math.floor(latencies.length * 0.5)] || 0;
  const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
  const maxLat = Math.max(...latencies, 1);
  const avgLat = (latencies.reduce((s,v) => s + v, 0) / latencies.length).toFixed(1);

  // 统计条
  const statBar = el('div', {className:'percase-statbar'},
    el('span', {className:'percase-stat'}, `共 ${results.length} cases`),
    el('span', {className:'percase-stat alert-ok'}, `✅ 通过 ${okCount}`),
    failCount > 0 ? el('span', {className:'percase-stat alert-critical'}, `❌ 失败 ${failCount}`) : null,
    el('span', {className:'percase-stat'}, `P50 ${p50}ms`),
    el('span', {className:'percase-stat'}, `P95 ${p95}ms`),
    el('span', {className:'percase-stat'}, `avg ${avgLat}ms`)
  );
  wrap.appendChild(statBar);

  // 逐 case 表
  const table = el('table', {className:'percase-table'});
  const thead = el('thead', {},
    el('tr', {},
      el('th', {}, '#'),
      el('th', {}, 'ID'),
      el('th', {}, '查询'),
      el('th', {}, '延迟'),
      el('th', {}, '状态'),
      el('th', {}, '延迟分布'),
    )
  );
  table.appendChild(thead);

  const tbody = el('tbody');
  results.forEach((r, i) => {
    const lat = r.latency_ms || 0;
    const latPct = Math.max(2, (lat / maxLat) * 100);
    const latCls = lat <= p50 ? 'lat-ok' : lat <= p95 ? 'lat-warn' : 'lat-danger';
    const okCls = r.ok ? 'alert-ok' : 'alert-critical';
    const okIcon = r.ok ? '✅' : '❌';
    // 截断 query 显示
    const query = r.query || '';
    const queryShort = query.length > 40 ? query.slice(0, 38) + '…' : query;

    const bar = el('div', {className:'lat-bar ' + latCls, style:`width:${latPct}%`});

    const tr = el('tr', {},
      el('td', {className:'percase-idx'}, String(i + 1)),
      el('td', {className:'percase-id'}, r.id || '--'),
      el('td', {className:'percase-query', title: query}, queryShort),
      el('td', {className:'percase-lat'}, lat + 'ms'),
      el('td', {className:'percase-ok ' + okCls}, okIcon),
      el('td', {className:'percase-bar-cell'}, bar)
    );
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  wrap.appendChild(table);
}

// 模块 Per-Case 评分视图
function renderModPerCase(){
  const wrap = $('modPercaseBody');
  if (!wrap) return;

  // 填充模块选择器
  const sel = $('modPercaseSel');
  if (!sel.options.length){
    const modLabels = {
      bazi:'八字', ziwei:'紫微', qimen:'奇门', liuyao:'六爻', liuren:'六壬',
      meihua:'梅花', fengshui:'风水', zodiac:'生肖', tizhi:'体质',
      tcm:'中医', wuxing:'五行', zeri:'择日', other:'其他'
    };
    const modOrder = ['bazi','ziwei','qimen','liuyao','liuren','meihua','fengshui','zodiac','tizhi','tcm','wuxing','zeri','other'];
    // 收集有数据的模块
    const availMods = new Set();
    WEEKS.forEach(w => {
      const f = cache.weeks[w]?.faithfulness;
      if (f && f.results){
        f.results.forEach(r => {
          const mod = FAITH_MODULE_MAP[r.id] || 'other';
          availMods.add(mod);
        });
      }
    });
    modOrder.filter(m => availMods.has(m)).forEach(m => {
      const opt = document.createElement('option');
      opt.value = m; opt.textContent = modLabels[m] || m;
      sel.appendChild(opt);
    });
    sel.addEventListener('change', () => renderModPerCase());
  }

  const selectedMod = sel.value || 'bazi';
  wrap.innerHTML = '';

  // 收集该模块所有周的 per-case 数据
  const weekData = []; // [{week, results:[]}]
  WEEKS.forEach(w => {
    const f = cache.weeks[w]?.faithfulness;
    if (f && f.results){
      const modResults = f.results.filter(r => (FAITH_MODULE_MAP[r.id] || 'other') === selectedMod);
      if (modResults.length) weekData.push({ week: w, results: modResults });
    }
  });

  if (!weekData.length){
    wrap.appendChild(el('div', {className:'no-violations'}, `模块「${selectedMod}」暂无 per-case 数据`));
    return;
  }

  // 统计条
  const allScores = weekData.flatMap(d => d.results.map(r => r.score || 0));
  const avgScore = (allScores.reduce((a,b)=>a+b,0) / allScores.length).toFixed(3);
  const lowCases = allScores.filter(s => s < 0.7).length;
  const okCases = allScores.filter(s => s >= 0.85).length;
  const warnCases = allScores.filter(s => s >= 0.7 && s < 0.85).length;
  const totalCases = allScores.length;

  const statBar = el('div', {className:'mod-percase-statbar'},
    el('span', {className:'percase-stat'}, `模块：${selectedMod}`),
    el('span', {className:'percase-stat'}, `共 ${totalCases} case·周`),
    el('span', {className:'percase-stat alert-ok'}, `✅ ≥0.85：${okCases}`),
    warnCases > 0 ? el('span', {className:'percase-stat alert-warn'}, `⚠️ 0.7-0.85：${warnCases}`) : null,
    lowCases > 0 ? el('span', {className:'percase-stat alert-critical'}, `🔴 <0.7：${lowCases}`) : null,
    el('span', {className:'percase-stat'}, `均值 ${avgScore}`)
  );
  wrap.appendChild(statBar);

  // 按周分组表
  const table = el('table', {className:'mod-percase-table'});
  const thead = el('thead', {},
    el('tr', {},
      el('th', {className:'mp-th-week'}, '周'),
      el('th', {className:'mp-th-id'}, 'Case ID'),
      el('th', {className:'mp-th-query'}, '查询'),
      el('th', {className:'mp-th-score'}, '评分'),
      el('th', {className:'mp-th-level'}, '等级'),
      el('th', {className:'mp-th-bar'}, '评分分布')
    )
  );
  table.appendChild(thead);

  const tbody = el('tbody');
  weekData.forEach(d => {
    d.results.forEach((r, i) => {
      const score = r.score || 0;
      const cls = score >= 0.85 ? 'ok' : score >= 0.7 ? 'warn' : 'danger';
      const level = score >= 0.85 ? '✅ OK' : score >= 0.7 ? '⚠️ WARN' : '🔴 DANGER';
      const barPct = Math.max(2, score * 100);
      const query = r.query || r.note || '';
      const queryShort = query.length > 40 ? query.slice(0, 38) + '…' : query;
      const weekShort = d.week.replace('2026-', '');

      const tr = el('tr', {className:'mp-row' + (i === 0 ? ' mp-row-first' : '')},
        i === 0
          ? el('td', {className:'mp-td-week', rowSpan: d.results.length}, weekShort)
          : null,
        el('td', {className:'mp-td-id'}, r.id || '--'),
        el('td', {className:'mp-td-query', title: query}, queryShort),
        el('td', {className:'mp-td-score eval-' + cls}, score.toFixed(3)),
        el('td', {className:'mp-td-level eval-' + cls}, level),
        el('td', {className:'mp-td-bar'}, el('div', {className:'mp-score-bar eval-' + cls, style:`width:${barPct}%`}))
      );
      tbody.appendChild(tr);
    });
  });
  table.appendChild(tbody);
  wrap.appendChild(table);
}

// CSV 导出工具
function downloadCSV(filename, rows){
  // rows: array of arrays (first row = headers)
  const csv = rows.map(r =>
    r.map(cell => {
      const s = String(cell == null ? '' : cell);
      // RFC 4180: quote if contains comma, quote, newline
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    }).join(',')
  ).join('\n');
  const blob = new Blob(['\uFEFF' + csv], {type: 'text/csv;charset=utf-8'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

// 导出 per-case 明细 CSV
function exportPerCaseCSV(){
  const weekSel = $('percaseWeekSel');
  const benchSel = $('percaseBenchSel');
  if (!weekSel) return;
  const week = weekSel.value || WEEKS[WEEKS.length-1];
  const bench = benchSel.value || 'cost-budget';
  const data = cache.weeks[week]?.[bench];
  if (!data || !data.results || !data.results.length){
    alert('当前无 per-case 数据可导出');
    return;
  }
  const rows = [
    ['Week', 'Benchmark', 'CaseID', 'Query', 'Latency_ms', 'OK']
  ];
  data.results.forEach(r => {
    rows.push([week, bench, r.id || '', r.query || '', r.latency_ms || '', r.ok ? 'true' : 'false']);
  });
  downloadCSV(`eval-percase-${week}-${bench}.csv`, rows);
}

// 导出模块 per-case 评分 CSV
function exportModPerCaseCSV(){
  const sel = $('modPercaseSel');
  if (!sel) return;
  const selectedMod = sel.value || 'bazi';
  const rows = [
    ['Week', 'Module', 'CaseID', 'Query', 'Score', 'Level', 'Note']
  ];
  WEEKS.forEach(w => {
    const f = cache.weeks[w]?.faithfulness;
    if (f && f.results){
      f.results.filter(r => (FAITH_MODULE_MAP[r.id] || 'other') === selectedMod)
        .forEach(r => {
          const score = r.score || 0;
          const level = score >= 0.85 ? 'OK' : score >= 0.7 ? 'WARN' : 'DANGER';
          rows.push([w, selectedMod, r.id || '', r.query || r.note || '', score.toFixed(3), level, r.note || '']);
        });
    }
  });
  if (rows.length <= 1){
    alert('模块 ' + selectedMod + ' 暂无 per-case 数据可导出');
    return;
  }
  downloadCSV(`eval-mod-percase-${selectedMod}.csv`, rows);
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
    renderAlertCard();
    renderModuleTrend();
    renderWeeklyStats();
    renderWoW();
    renderAlertHistory();
    renderPerCase();
    renderModPerCase();
  }finally{
    $('refreshBtn').textContent = '🔄 刷新';
    $('refreshBtn').disabled = false;
  }
}

$('refreshBtn').addEventListener('click', refresh);
$('exportBtn').addEventListener('click', exportSnapshot);
const _pcCSV = $('percaseCSVBtn'); if (_pcCSV) _pcCSV.addEventListener('click', exportPerCaseCSV);
const _mpCSV = $('modPercaseCSVBtn'); if (_mpCSV) _mpCSV.addEventListener('click', exportModPerCaseCSV);

// 启动
refresh();

// 30 分钟自动刷新
setInterval(refresh, 30 * 60 * 1000);

})();