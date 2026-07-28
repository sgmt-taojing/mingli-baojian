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

// R218: 数据源追踪 — 'github' | 'local' | 'mixed'
let dataSource = 'none';

// 拉取单 benchmark 单周（R218: GitHub → local 双源回退）
async function fetchWeek(week, bench){
  const ghUrl = `${GH}/eval/weekly/${week}-${bench}.json`;
  const localUrl = `eval/weekly/${week}-${bench}.json`;
  // 先尝试 GitHub
  try{
    const r = await fetch(ghUrl, { cache: 'no-cache' });
    if(r.ok){
      if (dataSource === 'none') dataSource = 'github';
      return await r.json();
    }
  }catch(e){
    console.warn('[fetch:gh]', week, bench, e);
  }
  // 回退本地
  try{
    const r = await fetch(localUrl, { cache: 'no-cache' });
    if(r.ok){
      if (dataSource === 'none') dataSource = 'local';
      else if (dataSource === 'github') dataSource = 'mixed';
      return await r.json();
    }
  }catch(e){
    console.warn('[fetch:local]', week, bench, e);
  }
  return null;
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
    const validPts = [];
    s.forEach((p, i) => {
      if (p.value == null) return;
      path.push((path.length ? 'L' : 'M') + x(i) + ' ' + y(p.value));
      validPts.push({ idx: i, value: p.value, week: WEEKS[i] });
    });
    if (!path.length) return;
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('class', 'chart-line chart-line-' + line.colorKey);
    p.setAttribute('d', path.join(' '));
    svg.appendChild(p);

    // R217: min/max 标注
    if (validPts.length >= 2 && opts.fmt) {
      const minPt = validPts.reduce((a, b) => a.value < b.value ? a : b);
      const maxPt = validPts.reduce((a, b) => a.value > b.value ? a : b);
      [{ pt: minPt, label: 'min', color: '#e74c3c' }, { pt: maxPt, label: 'max', color: '#27ae60' }].forEach(m => {
        const mx = x(m.pt.idx), my = y(m.pt.value);
        const tag = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        tag.setAttribute('x', mx);
        tag.setAttribute('y', my - 8);
        tag.setAttribute('text-anchor', 'middle');
        tag.setAttribute('font-size', '8');
        tag.setAttribute('fill', m.color);
        tag.setAttribute('opacity', '0.8');
        tag.textContent = opts.fmt(m.pt.value);
        svg.appendChild(tag);
      });
    }

    // 数据点 + hover tooltip
    s.forEach((pt, i) => {
      if (pt.value == null) return;
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('class', 'chart-point chart-line-' + line.colorKey);
      c.setAttribute('cx', x(i));
      c.setAttribute('cy', y(pt.value));
      c.setAttribute('r', 3);
      c.setAttribute('fill', '');  // use stroke color
      c.style.cursor = 'pointer';
      // R217: SVG <title> tooltip
      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      title.textContent = (WEEKS[i] || '').replace('2026-','') + ': ' + (opts.fmt ? opts.fmt(pt.value) : pt.value);
      c.appendChild(title);
      // R217: 最后一个点加大 + 数值标签
      const isLast = (i === WEEKS.length - 1) || (i === validPts[validPts.length - 1].idx);
      if (isLast) {
        c.setAttribute('r', 5);
        const lbl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        lbl.setAttribute('x', x(i) + 8);
        lbl.setAttribute('y', y(pt.value) + 3);
        lbl.setAttribute('class', 'chart-label');
        lbl.setAttribute('fill', getComputedStyle(svg).color || 'var(--paper)');
        lbl.textContent = opts.fmt ? opts.fmt(pt.value) : pt.value;
        svg.appendChild(lbl);
      }
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

// R218: 获取 alert-card（GitHub → local 双源回退）
async function fetchAlertCard(week){
  const ghUrl = `${GH}/eval/weekly/${week}-alert-card.json`;
  const localUrl = `eval/weekly/${week}-alert-card.json`;
  try{
    const r = await fetch(ghUrl, { cache: 'no-cache' });
    if(r.ok) return await r.json();
  }catch(e){
    console.warn('[alert-card fetch:gh]', week, e);
  }
  try{
    const r = await fetch(localUrl, { cache: 'no-cache' });
    if(r.ok) return await r.json();
  }catch(e){
    console.warn('[alert-card fetch:local]', week, e);
  }
  return null;
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

  // 多周模块对比矩阵（R210）
  if (weekAlerts.length > 1){
    const modCompSection = el('div', {className:'alert-mod-comp'},
      el('div', {className:'alert-mod-comp-title'}, '📊 多周模块对比矩阵'),
      el('div', {className:'alert-mod-comp-hint'}, '各模块 faithfulness 评分跨周变化 · 低分模块一目了然')
    );
    // 收集所有有 faithfulness per-case 数据的周
    const modCompWeeks = WEEKS.filter(w => {
      const f = cache.weeks[w]?.faithfulness;
      return f && f.results && f.results.length > 0;
    });
    if (modCompWeeks.length >= 2){
      // 模块中文名
      const modNames = {
        bazi:'八字', zodiac:'生肖', ziwei:'紫微', qimen:'奇门',
        liuren:'六壬', liuyao:'六爻', meihua:'梅花',
        fengshui:'风水', zeri:'择日', wuxing:'五行',
        tcm:'中医', tizhi:'体质', other:'其他'
      };
      // 按周按模块聚合
      const modData = {}; // { mod: { week: {avg, cases} } }
      modCompWeeks.forEach(w => {
        const f = cache.weeks[w].faithfulness;
        const agg = {};
        f.results.forEach(r => {
          const mod = FAITH_MODULE_MAP[r.id] || 'other';
          if (!agg[mod]) agg[mod] = { scores: [] };
          agg[mod].scores.push(r.score || 0);
        });
        Object.keys(agg).forEach(mod => {
          if (!modData[mod]) modData[mod] = {};
          const s = agg[mod].scores;
          modData[mod][w] = {
            avg: Math.round((s.reduce((a,b)=>a+b,0) / s.length) * 1000) / 1000,
            cases: s.length
          };
        });
      });
      // 排序：按最新周均分升序（低分在前）
      const latestWeek = modCompWeeks[modCompWeeks.length - 1];
      const sortedMods = Object.keys(modData).sort((a, b) => {
        const aAvg = modData[a][latestWeek]?.avg ?? 1;
        const bAvg = modData[b][latestWeek]?.avg ?? 1;
        return aAvg - bAvg;
      });
      // 表格
      const compTable = el('table', {className:'alert-mod-comp-table'});
      // 表头
      const thead = el('thead', {}, 
        el('tr', {},
          el('th', {className:'alert-mod-comp-th-mod'}, '模块'),
          ...modCompWeeks.map(w => el('th', {className:'alert-mod-comp-th-week'}, w.replace('2026-',''))),
          el('th', {className:'alert-mod-comp-th-trend'}, '趋势')
        )
      );
      compTable.appendChild(thead);
      // 表体
      const tbody = el('tbody', {});
      sortedMods.forEach(mod => {
        const wData = modData[mod];
        const tr = el('tr', {className:'alert-mod-comp-row'});
        tr.appendChild(el('td', {className:'alert-mod-comp-td-mod'}, modNames[mod] || mod));
        // 各周分数
        const weekAvgs = [];
        modCompWeeks.forEach(w => {
          const d = wData[w];
          if (d){
            const cls = d.avg >= 0.85 ? 'alert-ok' : d.avg >= 0.7 ? 'alert-warn' : 'alert-critical';
            tr.appendChild(el('td', {className:'alert-mod-comp-td-score ' + cls}, d.avg.toFixed(3)));
            weekAvgs.push(d.avg);
          } else {
            tr.appendChild(el('td', {className:'alert-mod-comp-td-score alert-mod-comp-na'}, '—'));
            weekAvgs.push(null);
          }
        });
        // 趋势箭头
        const validAvgs = weekAvgs.filter(v => v != null);
        let trendText = '—';
        let trendCls = 'alert-mod-comp-trend-flat';
        if (validAvgs.length >= 2){
          const first = validAvgs[0];
          const last = validAvgs[validAvgs.length - 1];
          const delta = last - first;
          if (delta > 0.03){ trendText = '↑+' + delta.toFixed(3); trendCls = 'alert-mod-comp-trend-up'; }
          else if (delta < -0.03){ trendText = '↓' + delta.toFixed(3); trendCls = 'alert-mod-comp-trend-down'; }
          else { trendText = '→' + (delta >= 0 ? '+' : '') + delta.toFixed(3); trendCls = 'alert-mod-comp-trend-flat'; }
        }
        tr.appendChild(el('td', {className:'alert-mod-comp-td-trend ' + trendCls}, trendText));
        tbody.appendChild(tr);
      });
      compTable.appendChild(tbody);
      modCompSection.appendChild(compTable);
      mainCard.appendChild(modCompSection);
    }
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
      el('th', {className:'ws-spark-h'}, '趋势图'),
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
    // sparkline cell
    if (r.vals.length >= 2){
      const sparkW = 80, sparkH = 24;
      const sparkSvg = document.createElementNS('http://www.w3.org/2000/svg','svg');
      sparkSvg.setAttribute('class','ws-spark-svg');
      sparkSvg.setAttribute('viewBox',`0 0 ${sparkW} ${sparkH}`);
      sparkSvg.setAttribute('width',sparkW);
      sparkSvg.setAttribute('height',sparkH);
      const vMin = Math.min(...r.vals.filter(v => v != null));
      const vMax = Math.max(...r.vals.filter(v => v != null));
      const vPad = (vMax - vMin) < 0.0001 ? 1 : (vMax - vMin) * 0.2;
      const lo = vMin - vPad, hi = vMax + vPad;
      const sx = i => 4 + (i * (sparkW - 8)) / Math.max(1, r.vals.length - 1);
      const sy = v => 4 + (sparkH - 8) - ((v - lo) / (hi - lo)) * (sparkH - 8);
      let pathD = '';
      const pts = [];
      r.vals.forEach((v, i) => {
        if (v == null) return;
        const x = sx(i), y = sy(v);
        pts.push({x, y, v});
        pathD += (pts.length === 1 ? 'M' : ' L') + ` ${x.toFixed(1)} ${y.toFixed(1)}`;
      });
      // area fill
      if (pts.length >= 2){
        const areaD = pathD + ` L ${pts[pts.length-1].x.toFixed(1)} ${sparkH-2} L ${pts[0].x.toFixed(1)} ${sparkH-2} Z`;
        const area = document.createElementNS('http://www.w3.org/2000/svg','path');
        area.setAttribute('d', areaD);
        const sparkColor = r.trend === '↑' ? (r.invert ? '#ef4444' : '#10b981')
                         : r.trend === '↓' ? (r.invert ? '#10b981' : '#ef4444')
                         : '#94a3b8';
        area.setAttribute('fill', sparkColor);
        area.setAttribute('opacity','0.12');
        sparkSvg.appendChild(area);
      }
      // line
      if (pathD){
        const path = document.createElementNS('http://www.w3.org/2000/svg','path');
        path.setAttribute('d', pathD);
        const lineColor = r.trend === '↑' ? (r.invert ? '#ef4444' : '#10b981')
                        : r.trend === '↓' ? (r.invert ? '#10b981' : '#ef4444')
                        : '#94a3b8';
        path.setAttribute('fill','none');
        path.setAttribute('stroke', lineColor);
        path.setAttribute('stroke-width','1.5');
        path.setAttribute('stroke-linejoin','round');
        path.setAttribute('stroke-linecap','round');
        sparkSvg.appendChild(path);
      }
      // last point dot
      if (pts.length){
        const last = pts[pts.length - 1];
        const dot = document.createElementNS('http://www.w3.org/2000/svg','circle');
        dot.setAttribute('cx', last.x);
        dot.setAttribute('cy', last.y);
        dot.setAttribute('r','2.5');
        const dotColor = r.trend === '↑' ? (r.invert ? '#ef4444' : '#10b981')
                       : r.trend === '↓' ? (r.invert ? '#10b981' : '#ef4444')
                       : '#94a3b8';
        dot.setAttribute('fill', dotColor);
        sparkSvg.appendChild(dot);
      }
      row.appendChild(el('td', {className:'ws-spark'}, sparkSvg));
    } else {
      row.appendChild(el('td', {className:'ws-spark ws-spark-empty'}, ''));
    }
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
  // 收集 WoW 数据供洞察 + CSV 使用
  const wowRows = [];
  metrics.forEach(m => {
    const row = { metric: m.label, key: m.key };
    pairs.forEach(p => {
      const dFrom = cache.weeks[p.from]?.[m.bench];
      const dTo = cache.weeks[p.to]?.[m.bench];
      const vFrom = dFrom ? get(dFrom, m.field) : null;
      const vTo = dTo ? get(dTo, m.field) : null;
      row[p.from + '→' + p.to] = (vFrom != null && vTo != null) ? { from: vFrom, to: vTo, delta: vTo - vFrom, pct: vFrom !== 0 ? (vTo - vFrom) / Math.abs(vFrom) : 0 } : null;
    });
    wowRows.push(row);
  });
  renderWoWInsight(wowRows, metrics, pairs);
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

// R229: WoW 摘要洞察 — 最大改善/恶化指标高亮
function renderWoWInsight(wowRows, metrics, pairs){
  const wrap = $('wowInsight');
  if (!wrap) return;
  wrap.innerHTML = '';
  // 找最大改善和最大恶化
  let bestChange = null, worstChange = null;
  wowRows.forEach(row => {
    pairs.forEach(p => {
      const key = p.from + '→' + p.to;
      const cell = row[key];
      if (!cell || Math.abs(cell.pct) < 0.02) return;
      const m = metrics.find(mm => mm.key === row.key);
      if (!m) return;
      const isImprovement = m.invert ? cell.delta < 0 : cell.delta > 0;
      const absPct = Math.abs(cell.pct);
      if (isImprovement && (!bestChange || absPct > Math.abs(bestChange.pct))){
        bestChange = { metric: row.metric, pair: key, pct: cell.pct, delta: cell.delta, isImprovement: true };
      }
      if (!isImprovement && (!worstChange || absPct > Math.abs(worstChange.pct))){
        worstChange = { metric: row.metric, pair: key, pct: cell.pct, delta: cell.delta, isImprovement: false };
      }
    });
  });
  if (!bestChange && !worstChange){
    wrap.appendChild(el('div', {className:'wow-insight-flat'}, '📋 本周期各指标波动均 < 2%，无显著变化'));
    return;
  }
  const parts = [];
  if (bestChange){
    const pctStr = (bestChange.pct >= 0 ? '+' : '') + (bestChange.pct * 100).toFixed(1) + '%';
    parts.push(el('span', {className:'wow-insight-good'}, '🟢 最大改善：' + bestChange.metric + ' (' + bestChange.pair.replace('2026-','') + ') ' + pctStr));
  }
  if (worstChange){
    const pctStr = (worstChange.pct >= 0 ? '+' : '') + (worstChange.pct * 100).toFixed(1) + '%';
    parts.push(el('span', {className:'wow-insight-bad'}, '🔴 最大恶化：' + worstChange.metric + ' (' + worstChange.pair.replace('2026-','') + ') ' + pctStr));
  }
  parts.forEach((p, i) => {
    if (i > 0) wrap.appendChild(el('span', {className:'wow-insight-sep'}, ' · '));
    wrap.appendChild(p);
  });
}

// R229: WoW CSV 导出
function exportWoWCSV(){
  const { metrics, pairs } = computeWoW();
  const header = ['指标'];
  pairs.forEach(p => header.push(p.from + '→' + p.to + ' 值', p.from + '→' + p.to + ' Δ%'));
  const rows = [header];
  metrics.forEach(m => {
    const row = [m.label];
    pairs.forEach(p => {
      const dFrom = cache.weeks[p.from]?.[m.bench];
      const dTo = cache.weeks[p.to]?.[m.bench];
      const vFrom = dFrom ? get(dFrom, m.field) : null;
      const vTo = dTo ? get(dTo, m.field) : null;
      if (vFrom == null || vTo == null){
        row.push('—', '—');
      } else {
        const pct = vFrom !== 0 ? (vTo - vFrom) / Math.abs(vFrom) : 0;
        row.push(vTo.toFixed(4), (pct >= 0 ? '+' : '') + (pct * 100).toFixed(1) + '%');
      }
    });
    rows.push(row);
  });
  downloadCSV('eval-wow-weekly.csv', rows);
  showToast('WoW 周环比 CSV 已导出');
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

// R208+R212: 导出 PDF 预览（含水印+页眉页脚）
// 在新窗口中克隆当前 dashboard DOM + 内联打印样式，自动触发 print()
function exportPDF(){
  var w = window.open('', '_blank', 'width=900,height=700');
  if (!w) { showToast('请允许弹出窗口以导出 PDF'); return; }

  var now = new Date();
  var dateStr = now.toLocaleDateString('zh-CN');
  var timeStr = now.toLocaleTimeString('zh-CN', {hour:'2-digit',minute:'2-digit'});
  var stamp = dateStr + ' ' + timeStr;

  // 构建精简打印预览页面
  w.document.open();
  w.document.write('<!DOCTYPE html>\n<html lang="zh">\n<head>\n');
  w.document.write('<meta charset="UTF-8">');
  w.document.write('<meta name="viewport" content="width=device-width, initial-scale=1.0">');
  w.document.write('<title>评估看板 PDF · ' + dateStr + '</title>');

  // 内联 CSS（含 @media print 规则）
  w.document.write('<style>');
  var styles = document.querySelectorAll('style, link[rel="stylesheet"]');
  for (var i = 0; i < styles.length; i++) {
    if (styles[i].tagName === 'LINK') {
      try {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', styles[i].href, false);
        xhr.send();
        if (xhr.status === 200) w.document.write(xhr.responseText);
      } catch(e) {}
    } else {
      w.document.write(styles[i].textContent);
    }
  }
  w.document.write('</style>');

  // R212: 打印水印 + 页眉页脚样式
  w.document.write('<style>');
  w.document.write('@page { size: A4; margin: 18mm 12mm 20mm 12mm; }');
  // 水印
  w.document.write('.pdf-watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%) rotate(-35deg); font-size: 72px; font-weight: 700; color: rgba(201,168,76,0.08); z-index: 0; pointer-events: none; white-space: nowrap; letter-spacing: 8px; }');
  // 页眉
  w.document.write('.pdf-page-header { position: fixed; top: 4mm; left: 12mm; right: 12mm; height: 10mm; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #c9a84c; font-size: 9px; color: #888; z-index: 10; }');
  w.document.write('.pdf-page-header .ph-title { font-weight: 600; color: #c9a84c; }');
  w.document.write('.pdf-page-header .ph-stamp { font-family: monospace; }');
  // 页脚
  w.document.write('.pdf-page-footer { position: fixed; bottom: 4mm; left: 12mm; right: 12mm; height: 10mm; display: flex; align-items: center; justify-content: space-between; border-top: 1px solid #c9a84c; font-size: 9px; color: #888; z-index: 10; }');
  w.document.write('.pdf-page-footer .pf-conf { color: #c0392b; font-weight: 600; }');
  w.document.write('.pdf-page-footer .pf-page { font-family: monospace; }');
  // 打印时显示水印+页眉页脚
  w.document.write('@media print { .pdf-watermark, .pdf-page-header, .pdf-page-footer { display: flex !important; } body { padding-top: 14mm; padding-bottom: 14mm; } }');
  // 屏幕预览时也显示（淡色）
  w.document.write('.pdf-watermark { display: flex; } .pdf-page-header, .pdf-page-footer { display: flex; }');
  w.document.write('body { background: #fff !important; color: #1a1a1a !important; }');
  w.document.write('</style>');
  w.document.write('</head>\n<body>');

  // R212: 水印层
  w.document.write('<div class="pdf-watermark">命理宝鉴 · 内部资料</div>');
  // R212: 页眉
  w.document.write('<div class="pdf-page-header"><span class="ph-title">📊 评估看板 · 命理宝鉴</span><span class="ph-stamp">导出时间: ' + stamp + '</span></div>');

  // 克隆 dashboard 主体内容
  var clone = document.querySelector('.dash-header').cloneNode(true);
  clone.querySelectorAll('.btn-refresh, .dash-back').forEach(function(el){ el.remove(); });
  w.document.write(clone.outerHTML);

  var main = document.querySelector('.dash-main').cloneNode(true);
  // 展开所有折叠区域
  main.querySelectorAll('[style*="display:none"], [style*="display: none"]').forEach(function(el){
    el.style.display = '';
  });
  // 移除交互控件
  main.querySelectorAll('.csv-export-btn, select, .percase-controls, .mod-percase-controls').forEach(function(el){ el.remove(); });
  w.document.write(main.outerHTML);

  var footer = document.querySelector('.dash-footer').cloneNode(true);
  w.document.write(footer.outerHTML);

  // R212: 页脚
  w.document.write('<div class="pdf-page-footer"><span class="pf-conf">🔒 内部资料 · 请勿外传</span><span class="pf-page">命理宝鉴 eval-dashboard · ' + dateStr + '</span></div>');

  w.document.write('\n</body>\n</html>');
  w.document.close();

  // 等待新窗口渲染完成后触发打印
  setTimeout(function(){
    try {
      w.focus();
      w.print();
    } catch(e) {
      console.warn('print() failed:', e);
    }
  }, 800);
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
    showToast('当前无 per-case 数据可导出');
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
    showToast('模块 ' + selectedMod + ' 暂无 per-case 数据可导出');
    return;
  }
  downloadCSV(`eval-mod-percase-${selectedMod}.csv`, rows);
}

// 导出告警历史 CSV（8 周 × 整体 + 三维度概览）
function exportAlertHistoryCSV(){
  const weekAlerts = WEEKS.map(w => ({ week: w, card: cache.weeks[w]?.['alert-card'] })).filter(x => x.card);
  if (!weekAlerts.length) return;
  const rows = [['Week','Overall_Level','Faithfulness_Level','Faithfulness_Actual','CostBudget_Level','CostBudget_Actual','Latency_Level','Latency_Actual','Generated_At']];
  weekAlerts.forEach(wa => {
    const c = wa.card;
    const j = c.judgments || {};
    function fmt(bench, isFloat){
      const v = j[bench];
      if (!v) return ['',''];
      const lv = v.level || '';
      let act = v.actual;
      if (act != null && isFloat) act = Number(act).toFixed(4);
      return [lv, act != null ? act : ''];
    }
    const [flv, fa] = fmt('faithfulness', true);
    const [clv, ca] = fmt('cost-budget', true);
    const [llv, la] = fmt('latency', false);
    rows.push([wa.week, c.overall_level || '', flv, fa, clv, ca, llv, la, (c.generated_at || '').replace(' CST','')]);
  });
  downloadCSV('eval-alert-history.csv', rows);
}

// 导出告警详情 CSV（每周 × 三维度 × 阈值 + 违规 + 低分案例数）
function exportAlertDetailCSV(){
  const weekAlerts = WEEKS.map(w => ({ week: w, card: cache.weeks[w]?.['alert-card'] })).filter(x => x.card);
  if (!weekAlerts.length) return;
  const rows = [['Week','Benchmark','Level','Metric','Actual','Threshold_Critical','Threshold_Warn','Target','Violations','Low_Cases_Count']];
  weekAlerts.forEach(wa => {
    const c = wa.card;
    const j = c.judgments || {};
    ['faithfulness','cost-budget','latency'].forEach(bench => {
      const v = j[bench];
      if (!v){ rows.push([wa.week, bench, '', '', '', '', '', '', '', '']); return; }
      const th = v.threshold || {};
      const lowCount = (v.low_cases || []).length;
      rows.push([
        wa.week, bench, v.level || '', v.metric || '',
        v.actual != null ? v.actual : '',
        th.critical != null ? th.critical : '',
        th.warn != null ? th.warn : '',
        v.target != null ? v.target : '',
        v.violations != null ? v.violations : 0,
        lowCount
      ]);
    });
  });
  downloadCSV('eval-alert-detail.csv', rows);
}

// ===== R223: 分模块详细评估 expanded 数据接入 =====
const EXPANDED_BENCHES = ['faithfulness', 'latency', 'cost-budget'];
let expandedCache = {}; // { 'W31-faithfulness': {...json}, ... }
let expandedActiveBench = 'faithfulness';

async function fetchExpanded(week, bench){
  const key = week + '-' + bench;
  if (expandedCache[key]) return expandedCache[key];
  const ghUrl = `${GH}/eval/weekly/${week}-expanded/${bench}-by-module.json`;
  const localUrl = `eval/weekly/${week}-expanded/${bench}-by-module.json`;
  try{
    const r = await fetch(ghUrl, { cache: 'no-cache' });
    if (r.ok){ const d = await r.json(); expandedCache[key] = d; return d; }
  }catch(e){}
  try{
    const r = await fetch(localUrl, { cache: 'no-cache' });
    if (r.ok){ const d = await r.json(); expandedCache[key] = d; return d; }
  }catch(e){}
  return null;
}

async function fetchAllExpanded(week){
  const results = await Promise.all(EXPANDED_BENCHES.map(b => fetchExpanded(week, b)));
  return { faithfulness: results[0], latency: results[1], 'cost-budget': results[2] };
}

const MOD_LABELS_EXP = {
  bazi:'八字', ziwei:'紫微', qimen:'奇门', liuyao:'六爻', liuren:'六壬',
  meihua:'梅花', fengshui:'风水', zodiac:'生肖', tizhi:'体质',
  tcm:'中医', wuxing:'五行', zeri:'择日', koujue:'口诀',
  general:'综合', huangli:'黄历', music:'音乐', lifeindex:'命盘',
  lifeplan:'人生规划', faith:'信仰', mantra:'真言', classics:'经典',
  nihaisha:'你好呀', shuhan:'蜀汉', acupuncture:'针灸', mobile:'移动',
  other:'其他'
};

function renderExpanded(data, bench){
  const wrap = $('expandedBody');
  if (!wrap) return;
  wrap.innerHTML = '';
  if (!data){
    wrap.appendChild(el('div', {className:'no-violations'}, '暂无 ' + bench + ' 分模块数据'));
    return;
  }

  const mods = data.modules || {};
  const modKeys = Object.keys(mods).sort((a,b) => {
    const order = ['bazi','ziwei','qimen','liuyao','liuren','meihua','fengshui','zodiac','tizhi','tcm','wuxing','zeri','koujue','general','huangli','music','lifeindex','lifeplan','faith','mantra','classics','nihaisha','shuhan','acupuncture','mobile','other'];
    return order.indexOf(a) - order.indexOf(b);
  });

  // 摘要条
  const summaryBar = el('div', {className:'expanded-summary-bar'},
    el('span', {className:'expanded-stat'}, '📊 ' + (data.total_cases || 0) + ' cases'),
    el('span', {className:'expanded-stat'}, '📚 ' + (data.module_count || modKeys.length) + ' 模块')
  );
  if (bench === 'faithfulness' && data.avg_score != null){
    summaryBar.appendChild(el('span', {className:'expanded-stat'}, '📈 均分 ' + data.avg_score.toFixed(3)));
  }
  if (bench === 'latency' && data.p50_ms != null){
    summaryBar.appendChild(el('span', {className:'expanded-stat'}, '⚡ P50 ' + data.p50_ms + 'ms'));
    summaryBar.appendChild(el('span', {className:'expanded-stat'}, '⚡ P95 ' + (data.p95_ms || 0) + 'ms'));
  }
  if (bench === 'cost-budget' && data.avg_cost_yuan != null){
    summaryBar.appendChild(el('span', {className:'expanded-stat'}, '💰 均费 ' + (data.avg_cost_yuan < 0.001 ? data.avg_cost_yuan.toExponential(1) : data.avg_cost_yuan.toFixed(4) + '元')));
  }
  wrap.appendChild(summaryBar);

  // 表格
  const table = el('table', {className:'expanded-table'});
  let theadCells;
  if (bench === 'faithfulness'){
    theadCells = ['模块', 'Cases', '均分', '延迟ms', '违规', '状态'];
  } else if (bench === 'latency'){
    theadCells = ['模块', 'Cases', 'P50', 'P95', 'Avg', 'Min', 'Max'];
  } else {
    theadCells = ['模块', 'Cases', '均费(元)', '延迟ms'];
  }
  table.appendChild(el('thead', null,
    el('tr', null, ...theadCells.map(h => el('th', {className:'exp-th'}, h)))
  ));

  const tbody = el('tbody');
  modKeys.forEach(mod => {
    const d = mods[mod];
    const label = MOD_LABELS_EXP[mod] || mod;
    let cells;
    if (bench === 'faithfulness'){
      const score = d.avg_score || 0;
      const cls = score >= 0.85 ? 'ok' : score >= 0.7 ? 'warn' : 'danger';
      cells = [
        el('td', {className:'exp-mod-name'}, label),
        el('td', {className:'exp-cell'}, String(d.total || 0)),
        el('td', {className:'exp-cell eval-' + cls}, score.toFixed(3)),
        el('td', {className:'exp-cell'}, Math.round(d.avg_latency || 0) + 'ms'),
        el('td', {className:'exp-cell ' + (d.violations > 0 ? 'eval-danger' : 'eval-ok')}, String(d.violations || 0)),
        el('td', {className:'exp-cell'}, el('span', {className:'eval-badge eval-' + cls}, cls === 'ok' ? '✅' : cls === 'warn' ? '⚠️' : '❌'))
      ];
    } else if (bench === 'latency'){
      const p95 = d.p95_ms || 0;
      const cls = p95 <= 500 ? 'ok' : p95 <= 1500 ? 'warn' : 'danger';
      cells = [
        el('td', {className:'exp-mod-name'}, label),
        el('td', {className:'exp-cell'}, String(d.total || 0)),
        el('td', {className:'exp-cell'}, (d.p50_ms || 0) + 'ms'),
        el('td', {className:'exp-cell eval-' + cls}, p95 + 'ms'),
        el('td', {className:'exp-cell'}, (d.avg_latency || 0).toFixed(1) + 'ms'),
        el('td', {className:'exp-cell'}, (d.min_ms || 0) + 'ms'),
        el('td', {className:'exp-cell'}, (d.max_ms || 0) + 'ms')
      ];
    } else {
      const cost = d.avg_cost_yuan || 0;
      const cls = cost <= 0.01 ? 'ok' : cost <= 0.05 ? 'warn' : 'danger';
      cells = [
        el('td', {className:'exp-mod-name'}, label),
        el('td', {className:'exp-cell'}, String(d.total || 0)),
        el('td', {className:'exp-cell eval-' + cls}, cost < 0.001 ? cost.toExponential(1) : cost.toFixed(4)),
        el('td', {className:'exp-cell'}, (d.avg_latency_ms || 0).toFixed(1) + 'ms')
      ];
    }
    tbody.appendChild(el('tr', {className:'exp-row'}, ...cells));
  });
  table.appendChild(tbody);
  wrap.appendChild(table);
}

async function refreshExpanded(){
  const weekSel = $('expandedWeekSel');
  const week = weekSel ? weekSel.value : '2026-W31';
  const data = await fetchAllExpanded(week);
  renderExpanded(data[expandedActiveBench], expandedActiveBench);
}

function exportExpandedCSV(){
  const weekSel = $('expandedWeekSel');
  const week = weekSel ? weekSel.value : '2026-W31';
  const key = week + '-' + expandedActiveBench;
  const data = expandedCache[key];
  if (!data) return;
  const mods = data.modules || {};
  const modKeys = Object.keys(mods).sort();
  let headers, rows = [];
  if (expandedActiveBench === 'faithfulness'){
    headers = ['module','cases','avg_score','avg_latency_ms','violations'];
  } else if (expandedActiveBench === 'latency'){
    headers = ['module','cases','p50_ms','p95_ms','avg_latency','min_ms','max_ms'];
  } else {
    headers = ['module','cases','avg_cost_yuan','avg_latency_ms'];
  }
  modKeys.forEach(mod => {
    const d = mods[mod];
    if (expandedActiveBench === 'faithfulness'){
      rows.push([mod, d.total||0, (d.avg_score||0).toFixed(3), Math.round(d.avg_latency||0), d.violations||0]);
    } else if (expandedActiveBench === 'latency'){
      rows.push([mod, d.total||0, d.p50_ms||0, d.p95_ms||0, (d.avg_latency||0).toFixed(1), d.min_ms||0, d.max_ms||0]);
    } else {
      rows.push([mod, d.total||0, (d.avg_cost_yuan||0).toExponential(2), (d.avg_latency_ms||0).toFixed(1)]);
    }
  });
  downloadCSV(`expanded-${week}-${expandedActiveBench}.csv`, [headers, ...rows]);
}

// ===== R224: 跨周分模块趋势折线图 =====
let expandedTrendSelectedMods = new Set();

function getExpandedMetricValue(modData, bench){
  if (bench === 'faithfulness') return modData.avg_score ?? null;
  if (bench === 'latency') return modData.p95_ms ?? null;
  if (bench === 'cost-budget') return modData.avg_cost_yuan ?? null;
  return null;
}

function expandedTrendFmt(v, bench){
  if (v == null) return '—';
  if (bench === 'faithfulness') return v.toFixed(2);
  if (bench === 'latency') return Math.round(v) + 'ms';
  if (bench === 'cost-budget') return v < 0.001 ? v.toExponential(1) : v.toFixed(4);
  return String(v);
}

// 收集所有周所有模块的指标值 → { mod: [{week, value}, ...] }
async function buildExpandedTrendSeries(bench){
  const modMap = {}; // mod -> [{week, value}]
  for (const w of WEEKS){
    const data = await fetchExpanded(w, bench);
    if (!data || !data.modules) continue;
    for (const [mod, d] of Object.entries(data.modules)){
      if (!modMap[mod]) modMap[mod] = [];
      modMap[mod].push({ week: w, value: getExpandedMetricValue(d, bench) });
    }
  }
  return modMap;
}

// 颜色调色板（12 色）
const TREND_COLORS = ['#e74c3c','#3498db','#2ecc71','#f39c12','#9b59b6','#1abc9c','#e67e22','#34495e','#e84393','#00cec9','#fdcb6e','#a29bfe'];

function renderExpandedTrend(modMap, bench){
  const wrap = $('expandedTrendChart');
  const legendWrap = $('expandedTrendLegend');
  if (!wrap || !legendWrap) return;
  wrap.innerHTML = '';
  legendWrap.innerHTML = '';

  const selectedMods = [...expandedTrendSelectedMods];
  if (selectedMods.length === 0){
    wrap.appendChild(el('div', {className:'no-violations'}, '请在上方选择至少一个模块')); 
    return;
  }

  const W = 520, H = 240;
  const padL = 44, padR = 16, padT = 14, padB = 32;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  // 收集所有值算 Y 轴范围
  const allVals = [];
  selectedMods.forEach(mod => {
    (modMap[mod] || []).forEach(p => { if (p.value != null) allVals.push(p.value); });
  });
  if (allVals.length === 0){
    wrap.appendChild(el('div', {className:'no-violations'}, '无数据')); 
    return;
  }

  const yMin = Math.min.apply(null, allVals);
  const yMax = Math.max.apply(null, allVals);
  const yLo = Math.max(0, yMin - (yMax - yMin) * 0.15);
  const yHi = yMax + (yMax - yMin) * 0.15;
  const yPad = (yHi - yLo) < 0.001 ? 1 : 0;

  function x(i){ return padL + (i * innerW) / Math.max(1, WEEKS.length - 1); }
  function y(v){ return padT + innerH - ((v - yLo) / (yHi - yLo + yPad)) * innerH; }

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.style.maxWidth = '100%';
  svg.style.height = 'auto';

  // 网格 + Y 轴标签
  for (let i = 0; i <= 4; i++){
    const yy = padT + (innerH * i / 4);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('class', 'chart-grid');
    line.setAttribute('x1', padL); line.setAttribute('x2', W - padR);
    line.setAttribute('y1', yy); line.setAttribute('y2', yy);
    svg.appendChild(line);
    const v = yHi - (yHi - yLo) * i / 4;
    const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    t.setAttribute('class', 'chart-axis');
    t.setAttribute('x', padL - 6); t.setAttribute('y', yy + 3);
    t.setAttribute('text-anchor', 'end');
    t.textContent = expandedTrendFmt(v, bench);
    svg.appendChild(t);
  }

  // X 轴标签
  WEEKS.forEach((wk, i) => {
    if (i % 2 !== 0 && i !== WEEKS.length - 1) return;
    const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    t.setAttribute('class', 'chart-axis');
    t.setAttribute('x', x(i)); t.setAttribute('y', H - 8);
    t.setAttribute('text-anchor', 'middle');
    t.textContent = wk.replace('2026-','');
    svg.appendChild(t);
  });

  // 每个模块一条线
  selectedMods.forEach((mod, idx) => {
    const color = TREND_COLORS[idx % TREND_COLORS.length];
    const pts = modMap[mod] || [];
    const pathPts = [];
    pts.forEach((p, i) => {
      if (p.value == null) return;
      pathPts.push({ idx: i, value: p.value, week: p.week });
    });
    if (pathPts.length === 0) return;

    const d = pathPts.map((p, i) => (i ? 'L' : 'M') + x(p.idx) + ' ' + y(p.value)).join(' ');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', color);
    path.setAttribute('stroke-width', '2');
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute('stroke-linecap', 'round');
    svg.appendChild(path);

    // 数据点 + tooltip
    pathPts.forEach(p => {
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('cx', x(p.idx));
      c.setAttribute('cy', y(p.value));
      c.setAttribute('r', 3);
      c.setAttribute('fill', color);
      c.style.cursor = 'pointer';
      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      title.textContent = (MOD_LABELS_EXP[mod] || mod) + ' ' + p.week.replace('2026-','') + ': ' + expandedTrendFmt(p.value, bench);
      c.appendChild(title);
      svg.appendChild(c);
    });

    // 图例
    const lg = el('span', {className:'expanded-trend-leg-item'},
      el('span', {className:'expanded-trend-leg-dot', style:{background:color}}),
      el('span', {className:'expanded-trend-leg-label'}, MOD_LABELS_EXP[mod] || mod)
    );
    legendWrap.appendChild(lg);
  });

  wrap.appendChild(svg);
}

// 填充模块选择器
async function initExpandedTrendModSel(){
  const sel = $('expandedTrendModSel');
  if (!sel) return;
  sel.innerHTML = '';
  // 用 W31（最新周）的模块列表作为候选
  const data = await fetchExpanded('2026-W31', expandedActiveBench);
  const mods = data && data.modules ? Object.keys(data.modules).sort((a,b) => {
    const order = ['bazi','ziwei','qimen','liuyao','liuren','meihua','fengshui','zodiac','tizhi','tcm','wuxing','zeri','koujue','general','huangli','music','lifeindex','lifeplan','faith','mantra','classics','nihaisha','shuhan','acupuncture','mobile','other'];
    return order.indexOf(a) - order.indexOf(b);
  }) : [];
  mods.forEach(mod => {
    const opt = document.createElement('option');
    opt.value = mod;
    opt.textContent = MOD_LABELS_EXP[mod] || mod;
    sel.appendChild(opt);
  });
  // 默认选 Top5（cases 最多）
  const sorted = mods.sort((a,b) => (data.modules[b].total || 0) - (data.modules[a].total || 0)).slice(0, 5);
  expandedTrendSelectedMods = new Set(sorted);
  sorted.forEach(m => {
    [...sel.options].forEach(o => { if (o.value === m) o.selected = true; });
  });
}

async function refreshExpandedTrend(){
  const hint = $('expandedTrendHint');
  if (hint){
    const benchLabel = expandedActiveBench === 'faithfulness' ? '合规均分' : expandedActiveBench === 'latency' ? 'P95 延迟' : '均费';
    hint.textContent = `· ${benchLabel} · W24→W31`;
  }
  const modMap = await buildExpandedTrendSeries(expandedActiveBench);
  renderExpandedTrend(modMap, expandedActiveBench);
}

// Top5 变化最大模块
async function selectTop5ChangeMods(modMap, bench){
  const changes = [];
  for (const [mod, pts] of Object.entries(modMap)){
    const valid = pts.filter(p => p.value != null);
    if (valid.length < 2) continue;
    const first = valid[0].value;
    const last = valid[valid.length - 1].value;
    changes.push({ mod, delta: Math.abs(last - first) });
  }
  changes.sort((a, b) => b.delta - a.delta);
  return changes.slice(0, 5).map(c => c.mod);
}

// ===== R216: 诊疗经验蒸馏（R218: GitHub → local 双源回退） =====
async function fetchDistillReport(){
  const ghUrl = `${GH}/DELIVERY/distill-report-2026-07-28.json`;
  const localUrl = `DELIVERY/distill-report-2026-07-28.json`;
  try{
    const r = await fetch(ghUrl, { cache: 'no-cache' });
    if (r.ok) return await r.json();
  }catch(e){}
  try{
    const r = await fetch(localUrl, { cache: 'no-cache' });
    if (r.ok) return await r.json();
  }catch(e){}
  return null;
}

function renderDistill(report){
  const wrap = $('distillBody');
  if (!wrap) return;
  wrap.innerHTML = '';
  if (!report){
    wrap.appendChild(el('div', {className:'distill-empty'}, '暂无蒸馏报告数据'));
    return;
  }
  const s = report.summary || {};
  const organs = report.organ_distribution || {};
  const formulas = report.formula_usage_ranking || {};
  const symptoms = report.symptom_frequency_ranking || {};
  const candidates = report.candidates || [];

  // 摘要条
  const summaryBar = el('div', {className:'distill-summary-bar'},
    el('span', {className:'distill-stat'}, '👥 ' + (s.total_patients||0) + ' 患者'),
    el('span', {className:'distill-stat'}, '📋 ' + (s.total_clinical_records||0) + ' 诊疗记录'),
    el('span', {className:'distill-stat'}, '🧪 ' + (s.candidates_generated||0) + ' 蒸馏条目'),
    el('span', {className:'distill-date'}, '📅 ' + (report.report_date||'').slice(0,10))
  );
  wrap.appendChild(summaryBar);

  // 脏腑分布 + 方剂排行 + 症状排行
  const grid = el('div', {className:'distill-grid'});

  // 脏腑分布
  const organList = Object.entries(organs).sort((a,b) => b[1]-a[1]);
  const organCard = el('div', {className:'distill-card distill-organ'},
    el('div', {className:'distill-card-title'}, '🏥 脏腑分布'),
    el('div', {className:'distill-bar-list'},
      organList.length ? organList.map(([k,v]) =>
        el('div', {className:'distill-bar-row'},
          el('span', {className:'distill-bar-label'}, k),
          el('div', {className:'distill-bar-track'},
            el('div', {className:'distill-bar-fill distill-fill-organ', style:'width:' + Math.max(10, v * 30) + 'px'})),
          el('span', {className:'distill-bar-val'}, String(v))
        )
      ) : [el('div', {}, '无数据')]
    )
  );
  grid.appendChild(organCard);

  // 方剂排行
  const formulaList = Object.entries(formulas).sort((a,b) => b[1]-a[1]);
  const formulaCard = el('div', {className:'distill-card distill-formula'},
    el('div', {className:'distill-card-title'}, '💊 方剂使用排行'),
    el('div', {className:'distill-bar-list'},
      formulaList.length ? formulaList.map(([k,v]) =>
        el('div', {className:'distill-bar-row'},
          el('span', {className:'distill-bar-label'}, k),
          el('div', {className:'distill-bar-track'},
            el('div', {className:'distill-bar-fill distill-fill-formula', style:'width:' + Math.max(10, v * 30) + 'px'})),
          el('span', {className:'distill-bar-val'}, String(v))
        )
      ) : [el('div', {}, '无数据')]
    )
  );
  grid.appendChild(formulaCard);

  // 症状频次
  const symptomList = Object.entries(symptoms).sort((a,b) => b[1]-a[1]);
  const symptomCard = el('div', {className:'distill-card distill-symptom'},
    el('div', {className:'distill-card-title'}, '🩺 症状频次'),
    el('div', {className:'distill-bar-list'},
      symptomList.length ? symptomList.map(([k,v]) =>
        el('div', {className:'distill-bar-row'},
          el('span', {className:'distill-bar-label'}, k),
          el('div', {className:'distill-bar-track'},
            el('div', {className:'distill-bar-fill distill-fill-symptom', style:'width:' + Math.max(10, v * 30) + 'px'})),
          el('span', {className:'distill-bar-val'}, String(v))
        )
      ) : [el('div', {}, '无数据')]
    )
  );
  grid.appendChild(symptomCard);
  wrap.appendChild(grid);

  // 候选条目表
  if (candidates.length){
    const table = el('table', {className:'distill-table'});
    const thead = el('thead', {},
      el('tr', {},
        el('th', {}, 'Entry ID'),
        el('th', {}, '标题'),
        el('th', {}, '类别'),
        el('th', {}, '信任度'),
        el('th', {}, '关键词')
      )
    );
    table.appendChild(thead);
    const tbody = el('tbody', {});
    candidates.forEach(c => {
      const trustCls = (c.trust||0) >= 0.8 ? 'distill-trust-high' : (c.trust||0) >= 0.7 ? 'distill-trust-mid' : 'distill-trust-low';
      tbody.appendChild(el('tr', {},
        el('td', {className:'distill-td-id'}, c.entry_id || '--'),
        el('td', {className:'distill-td-title'}, c.title || '--'),
        el('td', {className:'distill-td-cat'}, c.category || '--'),
        el('td', {className:'distill-td-trust ' + trustCls}, (c.trust || 0).toFixed(2)),
        el('td', {className:'distill-td-kw'}, esc(c.keyword || '--'))
      ));
    });
    table.appendChild(tbody);
    wrap.appendChild(el('div', {className:'distill-table-wrap'}, table));
  }
}

// R218: 数据源指示器
function updateDataSourceBadge(){
  const badge = document.querySelector('.dash-source-badge');
  if (!badge) return;
  const labels = {
    'github': '☁️ GitHub',
    'local': '💻 本地',
    'mixed': '🔀 混合',
    'none': '⚠️ 离线'
  };
  badge.textContent = labels[dataSource] || '⚠️ 未知';
  badge.title = '数据来源: ' + (labels[dataSource] || '未知');
  badge.className = 'dash-source-badge source-' + dataSource;
}

function exportDistillCSV(){
  const report = cache.distill;
  if (!report || !report.candidates){
    showToast('蒸馏数据未加载');
    return;
  }
  const rows = [['Entry_ID','Title','Category','Trust','Keyword','Module','Source_Type','Distill_Date']];
  report.candidates.forEach(c => {
    rows.push([
      c.entry_id || '', c.title || '', c.category || '',
      (c.trust || 0).toFixed(2), c.keyword || '',
      c.module || '', c.source_type || '', c.distill_date || ''
    ]);
  });
  downloadCSV('distill-candidates.csv', rows);
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
    // R216: 蒸馏报告
    cache.distill = await fetchDistillReport();
    renderDistill(cache.distill);
    // R223: expanded 分模块详细
    await refreshExpanded();
  }finally{
    $('refreshBtn').textContent = '🔄 刷新';
    $('refreshBtn').disabled = false;
  }
  // R218: 更新数据源指示器
  updateDataSourceBadge();
}

$('refreshBtn').addEventListener('click', refresh);
$('exportBtn').addEventListener('click', exportSnapshot);
var _pdf = $('pdfBtn'); if (_pdf) _pdf.addEventListener('click', exportPDF);
const _pcCSV = $('percaseCSVBtn'); if (_pcCSV) _pcCSV.addEventListener('click', exportPerCaseCSV);
const _mpCSV = $('modPercaseCSVBtn'); if (_mpCSV) _mpCSV.addEventListener('click', exportModPerCaseCSV);
const _ahCSV = $('alertHistCSVBtn'); if (_ahCSV) _ahCSV.addEventListener('click', exportAlertHistoryCSV);
const _adCSV = $('alertDetailCSVBtn'); if (_adCSV) _adCSV.addEventListener('click', exportAlertDetailCSV);
const _diCSV = $('distillCSVBtn'); if (_diCSV) _diCSV.addEventListener('click', exportDistillCSV);

// R223: expanded 分模块 tab 事件
const _expWeekSel = $('expandedWeekSel');
if (_expWeekSel){
  WEEKS.forEach(w => {
    const opt = document.createElement('option');
    opt.value = w; opt.textContent = w.replace('2026-','');
    _expWeekSel.appendChild(opt);
  });
  _expWeekSel.value = '2026-W31';
  _expWeekSel.addEventListener('change', refreshExpanded);
}
document.querySelectorAll('.expanded-tab').forEach(btn => {
  btn.addEventListener('click', async () => {
    document.querySelectorAll('.expanded-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    expandedActiveBench = btn.dataset.bench;
    const weekSel = $('expandedWeekSel');
    const week = weekSel ? weekSel.value : '2026-W31';
    const data = await fetchAllExpanded(week);
    renderExpanded(data[expandedActiveBench], expandedActiveBench);
  });
});
const _expCSV = $('expandedCSVBtn'); if (_expCSV) _expCSV.addEventListener('click', exportExpandedCSV);

// R224: 跨周模块趋势折线图事件
const _expTrendModSel = $('expandedTrendModSel');
if (_expTrendModSel){
  _expTrendModSel.addEventListener('change', () => {
    expandedTrendSelectedMods = new Set([..._expTrendModSel.selectedOptions].map(o => o.value));
    const bench = expandedActiveBench;
    buildExpandedTrendSeries(bench).then(modMap => renderExpandedTrend(modMap, bench));
  });
}
const _expTrendAllBtn = $('expandedTrendAllBtn');
if (_expTrendAllBtn){
  _expTrendAllBtn.addEventListener('click', () => {
    const sel = $('expandedTrendModSel');
    if (!sel) return;
    [...sel.options].forEach(o => o.selected = true);
    expandedTrendSelectedMods = new Set([...sel.options].map(o => o.value));
    buildExpandedTrendSeries(expandedActiveBench).then(modMap => renderExpandedTrend(modMap, expandedActiveBench));
  });
}
const _expTrendNoneBtn = $('expandedTrendNoneBtn');
if (_expTrendNoneBtn){
  _expTrendNoneBtn.addEventListener('click', () => {
    const sel = $('expandedTrendModSel');
    if (!sel) return;
    [...sel.options].forEach(o => o.selected = false);
    expandedTrendSelectedMods = new Set();
    renderExpandedTrend({}, expandedActiveBench);
  });
}
const _expTrendTop5Btn = $('expandedTrendTop5Btn');
if (_expTrendTop5Btn){
  _expTrendTop5Btn.addEventListener('click', async () => {
    const sel = $('expandedTrendModSel');
    if (!sel) return;
    const modMap = await buildExpandedTrendSeries(expandedActiveBench);
    const top5 = await selectTop5ChangeMods(modMap, expandedActiveBench);
    expandedTrendSelectedMods = new Set(top5);
    [...sel.options].forEach(o => { o.selected = top5.includes(o.value); });
    renderExpandedTrend(modMap, expandedActiveBench);
  });
}
// tab 切换时也刷新趋势图
document.querySelectorAll('.expanded-tab').forEach(btn => {
  btn.addEventListener('click', async () => {
    await initExpandedTrendModSel();
    refreshExpandedTrend();
  });
});
// 初始化
initExpandedTrendModSel().then(() => refreshExpandedTrend());

// ===== R225: 跨基准模块散点图 =====
const CROSS_BENCH_MOD_LABELS = {
  bazi: '八字', general: '综合', yunshi: '运势', ziwei: '紫微',
  fengshui: '风水', liuyao: '六爻', liuren: '六壬', meihua: '梅花',
  huangli: '黄历', wuxing: '五行', tcm: '中医', koujue: '口诀',
  faith: '信仰', classics: '经典', yijing: '易经', qimen: '奇门'
};

async function fetchCrossBenchData(week){
  const benches = ['faithfulness', 'latency', 'cost-budget'];
  const results = await Promise.all(benches.map(async b => {
    try {
      const ghUrl = `${GH}/eval/weekly/${week}-expanded/${b}-by-module.json`;
      const localUrl = `eval/weekly/${week}-expanded/${b}-by-module.json`;
      let resp = await fetch(ghUrl);
      if (!resp.ok) resp = await fetch(localUrl);
      if (!resp.ok) return null;
      return await resp.json();
    } catch(e){ return null; }
  }));
  return { faithfulness: results[0], latency: results[1], 'cost-budget': results[2] };
}

function buildCrossBenchPoints(data){
  const points = [];
  if (!data.faithfulness || !data.latency || !data['cost-budget']) return points;
  const modSet = new Set([
    ...Object.keys(data.faithfulness),
    ...Object.keys(data.latency),
    ...Object.keys(data['cost-budget'])
  ]);
  for (const mod of modSet){
    const fMod = data.faithfulness[mod];
    const lMod = data.latency[mod];
    const cMod = data['cost-budget'][mod];
    if (!fMod || !lMod || !cMod) continue;
    const faithfulness = fMod.avg_score != null ? fMod.avg_score : (fMod.score != null ? fMod.score : null);
    const latency = lMod.avg_latency != null ? lMod.avg_latency : (lMod.p95 != null ? lMod.p95 : null);
    const cost = cMod.avg_cost != null ? cMod.avg_cost : null;
    if (faithfulness == null || latency == null) continue;
    points.push({ mod, faithfulness, latency, cost: cost || 0 });
  }
  return points;
}

function renderCrossBench(points){
  const wrap = $('crossBenchChart');
  const legendWrap = $('crossBenchLegend');
  if (!wrap) return;
  wrap.innerHTML = '';
  if (!legendWrap) return;
  legendWrap.innerHTML = '';
  if (points.length === 0){
    wrap.textContent = '暂无跨基准数据';
    return;
  }
  const W = 560, H = 360, padL = 50, padR = 20, padT = 20, padB = 45;
  const innerW = W - padL - padR, innerH = H - padT - padB;
  const latencies = points.map(p => p.latency);
  const faiths = points.map(p => p.faithfulness);
  const costs = points.map(p => p.cost);
  const xMin = 0, xMax = Math.max(...latencies) * 1.1;
  const yMin = Math.min(...faiths) * 0.9, yMax = Math.max(...faiths) * 1.05;
  const yLo = Math.min(yMin, 0.5), yHi = Math.max(yMax, 1.0);
  const costMax = Math.max(...costs, 0.001);
  const COLORS = ['#10b981','#c9a84c','#3b82f6','#f59e0b','#9333ea','#ef4444','#06b6d4','#ec4899','#84cc16','#f97316','#8b5cf6','#14b8a6','#6366f1','#e11d48','#a855f7','#22c55e'];
  function x(v){ return padL + ((v - xMin) / (xMax - xMin || 1)) * innerW; }
  function y(v){ return padT + innerH - ((v - yLo) / (yHi - yLo || 1)) * innerH; }
  function r(cost){ return 6 + (cost / costMax) * 18; }
  const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('width','100%');
  svg.style.maxWidth = '100%';
  svg.style.height = 'auto';
  // grid lines (Y)
  for (let i = 0; i <= 4; i++){
    const yy = padT + (i / 4) * innerH;
    const val = yHi - (i / 4) * (yHi - yLo);
    const line = document.createElementNS('http://www.w3.org/2000/svg','line');
    line.setAttribute('x1', padL); line.setAttribute('x2', W - padR);
    line.setAttribute('y1', yy); line.setAttribute('y2', yy);
    line.setAttribute('class','chart-grid');
    svg.appendChild(line);
    const txt = document.createElementNS('http://www.w3.org/2000/svg','text');
    txt.setAttribute('x', padL - 6); txt.setAttribute('y', yy + 3);
    txt.setAttribute('text-anchor','end'); txt.setAttribute('class','chart-axis');
    txt.textContent = val.toFixed(2);
    svg.appendChild(txt);
  }
  // X axis labels
  for (let i = 0; i <= 4; i++){
    const xx = padL + (i / 4) * innerW;
    const val = xMin + (i / 4) * (xMax - xMin);
    const txt = document.createElementNS('http://www.w3.org/2000/svg','text');
    txt.setAttribute('x', xx); txt.setAttribute('y', H - padB + 14);
    txt.setAttribute('text-anchor','middle'); txt.setAttribute('class','chart-axis');
    txt.textContent = Math.round(val) + 'ms';
    svg.appendChild(txt);
  }
  // axis titles
  const xTitle = document.createElementNS('http://www.w3.org/2000/svg','text');
  xTitle.setAttribute('x', W / 2); xTitle.setAttribute('y', H - 6);
  xTitle.setAttribute('text-anchor','middle'); xTitle.setAttribute('fill','var(--paper3)'); xTitle.setAttribute('font-size','11');
  xTitle.textContent = '→ 平均延迟 (ms)';
  svg.appendChild(xTitle);
  const yTitle = document.createElementNS('http://www.w3.org/2000/svg','text');
  yTitle.setAttribute('x', -H / 2); yTitle.setAttribute('y', 12);
  yTitle.setAttribute('text-anchor','middle'); yTitle.setAttribute('fill','var(--paper3)');
  yTitle.setAttribute('font-size','11');
  yTitle.setAttribute('transform','rotate(-90)');
  yTitle.textContent = '合规均分 →';
  svg.appendChild(yTitle);
  // bubbles
  points.forEach((p, i) => {
    const color = COLORS[i % COLORS.length];
    const cx = x(p.latency), cy = y(p.faithfulness), cr = r(p.cost);
    const circle = document.createElementNS('http://www.w3.org/2000/svg','circle');
    circle.setAttribute('cx', cx); circle.setAttribute('cy', cy); circle.setAttribute('r', cr);
    circle.setAttribute('fill', color); circle.setAttribute('fill-opacity','0.35');
    circle.setAttribute('stroke', color); circle.setAttribute('stroke-width','1.5');
    circle.setAttribute('class','cross-bench-bubble');
    circle.style.cursor = 'pointer';
    const title = document.createElementNS('http://www.w3.org/2000/svg','title');
    title.textContent = `${CROSS_BENCH_MOD_LABELS[p.mod] || p.mod} | 合规: ${p.faithfulness.toFixed(3)} | 延迟: ${Math.round(p.latency)}ms | 成本: $${p.cost.toFixed(4)}`;
    circle.appendChild(title);
    // label
    const lbl = document.createElementNS('http://www.w3.org/2000/svg','text');
    lbl.setAttribute('x', cx); lbl.setAttribute('y', cy - cr - 3);
    lbl.setAttribute('text-anchor','middle'); lbl.setAttribute('fill','var(--paper)');
    lbl.setAttribute('font-size','9'); lbl.setAttribute('font-weight','600');
    lbl.textContent = CROSS_BENCH_MOD_LABELS[p.mod] || p.mod;
    svg.appendChild(circle);
    svg.appendChild(lbl);
    // legend entry
    const li = el('span', {className:'expanded-trend-leg-item'},
      el('span', {className:'expanded-trend-leg-dot', style:{background:color}}),
      el('span', {className:'expanded-trend-leg-label'}, `${CROSS_BENCH_MOD_LABELS[p.mod] || p.mod} (${p.faithfulness.toFixed(2)}/${Math.round(p.latency)}ms/$${p.cost.toFixed(4)})`)
    );
    legendWrap.appendChild(li);
  });
  wrap.appendChild(svg);
}

async function refreshCrossBench(){
  const sel = $('crossBenchWeekSel');
  const week = sel ? sel.value : '2026-W31';
  const data = await fetchCrossBenchData(week);
  const points = buildCrossBenchPoints(data);
  renderCrossBench(points);
}

function exportCrossBenchCSV(){
  const sel = $('crossBenchWeekSel');
  const week = sel ? sel.value : '2026-W31';
  // Use cached data if available; otherwise fetch synchronously
  fetchCrossBenchData(week).then(data => {
    const points = buildCrossBenchPoints(data);
    const rows = [['Module','Label','Faithfulness','Latency(ms)','Cost($)']];
    points.forEach(p => {
      rows.push([p.mod, CROSS_BENCH_MOD_LABELS[p.mod] || p.mod, p.faithfulness.toFixed(4), Math.round(p.latency), p.cost.toFixed(4)]);
    });
    downloadCSV(`eval-cross-bench-${week}.csv`, rows);
  });
}

// R225 事件绑定
const _cbWeekSel = $('crossBenchWeekSel');
if (_cbWeekSel){
  WEEKS.forEach(w => {
    const opt = document.createElement('option');
    opt.value = w; opt.textContent = w.replace('2026-','');
    _cbWeekSel.appendChild(opt);
  });
  _cbWeekSel.value = '2026-W31';
  _cbWeekSel.addEventListener('change', refreshCrossBench);
}
const _cbCSV = $('crossBenchCSVBtn');
if (_cbCSV) _cbCSV.addEventListener('click', exportCrossBenchCSV);
// 启动时加载散点图
refreshCrossBench();

// ===== R226 跨周模块热力图 =====
const HEATMAP_MOD_LABELS = {
  bazi:'八字', general:'综合', yunshi:'运势', ziwei:'紫微', fengshui:'风水',
  liuyao:'六爻', liuren:'六壬', meihua:'梅花', huangli:'黄历', wuxing:'五行',
  tcm:'中医', koujue:'口诀', qimen:'奇门', shiye:'事业', zeri:'择日', zhongyi:'中医诊断'
};

async function fetchHeatmapData(){
  const results = [];
  for (const w of WEEKS){
    try {
      const resp = await fetch(`${GITHUB_BASE}${w}-expanded/faithfulness-by-module.json`);
      if (resp.ok){ results.push({week:w, data: await resp.json()}); continue; }
    } catch(e){}
    try {
      const resp = await fetch(`${LOCAL_BASE}${w}-expanded/faithfulness-by-module.json`);
      if (resp.ok){ results.push({week:w, data: await resp.json()}); }
    } catch(e){}
  }
  return results;
}

function buildHeatmapMatrix(rawData, metric){
  const modSet = new Set();
  rawData.forEach(({data}) => {
    Object.keys(data.modules || {}).forEach(m => modSet.add(m));
  });
  const modules = Array.from(modSet).sort();
  const weeks = rawData.map(d => d.week);
  const matrix = [];
  modules.forEach(mod => {
    const row = { mod, label: HEATMAP_MOD_LABELS[mod] || mod, cells: [] };
    weeks.forEach(w => {
      const wd = rawData.find(d => d.week === w);
      const md = wd && wd.data.modules && wd.data.modules[mod];
      if (md){
        row.cells.push({
          week: w,
          value: metric === 'latency' ? md.avg_latency : md.avg_score,
          total: md.total || 0,
          violations: md.violations || 0
        });
      } else {
        row.cells.push({ week: w, value: null, total: 0, violations: 0 });
      }
    });
    matrix.push(row);
  });
  return { matrix, weeks, modules };
}

function heatmapColor(val, metric, min, max){
  if (val === null || val === undefined) return '#f0f0f0';
  if (metric === 'latency'){
    // latency: lower=green, higher=red
    const t = max > min ? (val - min) / (max - min) : 0.5;
    const r = Math.round(60 + t * 195);
    const g = Math.round(200 - t * 140);
    const b = Math.round(80 - t * 40);
    return `rgb(${r},${g},${b})`;
  } else {
    // faithfulness: higher=green, lower=red
    const t = max > min ? (val - min) / (max - min) : 0.5;
    const r = Math.round(220 - t * 160);
    const g = Math.round(80 + t * 150);
    const b = Math.round(60 + t * 40);
    return `rgb(${r},${g},${b})`;
  }
}

function renderHeatmap(matrixData, metric){
  const wrap = $('heatmapGrid');
  if (!wrap) return;
  const { matrix, weeks } = matrixData;

  // Calculate min/max for color scaling
  let vals = [];
  matrix.forEach(row => row.cells.forEach(c => { if (c.value !== null) vals.push(c.value); }));
  const min = vals.length ? Math.min(...vals) : 0;
  const max = vals.length ? Math.max(...vals) : 1;

  let html = '<table class="heatmap-table">';
  // Header row
  html += '<thead><tr><th>模块</th>';
  weeks.forEach(w => { html += `<th>${w.replace('2026-','')}</th>`; });
  html += '</tr></thead><tbody>';

  matrix.forEach(row => {
    html += `<tr><td class="heatmap-row-label">${row.label}</td>`;
    row.cells.forEach(c => {
      if (c.value === null){
        html += '<td class="heatmap-cell heatmap-empty" title="无数据"></td>';
      } else {
        const color = heatmapColor(c.value, metric, min, max);
        const display = metric === 'latency' ? `${Math.round(c.value)}ms` : c.value.toFixed(3);
        const tip = `${row.label} · ${c.week.replace('2026-','')}\n${display} · ${c.total} cases · ${c.violations} violations`;
        html += `<td class="heatmap-cell" style="background:${color}" title="${tip}">${display}</td>`;
      }
    });
    html += '</tr>';
  });
  html += '</tbody></table>';
  wrap.innerHTML = html;

  // Render legend bar
  const legendBar = $('heatmapLegendBar');
  if (legendBar){
    const steps = 10;
    let grad = 'linear-gradient(to right';
    for (let i = 0; i <= steps; i++){
      const t = i / steps;
      const v = min + (max - min) * t;
      grad += `,${heatmapColor(v, metric, min, max)}`;
    }
    grad += ')';
    legendBar.style.background = grad;
  }
}

let _heatmapCache = null;
async function refreshHeatmap(){
  const metricSel = $('heatmapMetricSel');
  const metric = metricSel ? metricSel.value : 'faithfulness';
  if (!_heatmapCache){
    _heatmapCache = await fetchHeatmapData();
  }
  if (_heatmapCache.length === 0){
    const wrap = $('heatmapGrid');
    if (wrap) wrap.innerHTML = '<p class="heatmap-empty-msg">暂无 expanded 数据</p>';
    return;
  }
  const matrixData = buildHeatmapMatrix(_heatmapCache, metric);
  renderHeatmap(matrixData, metric);
}

function exportHeatmapCSV(){
  if (!_heatmapCache || _heatmapCache.length === 0) return;
  const metricSel = $('heatmapMetricSel');
  const metric = metricSel ? metricSel.value : 'faithfulness';
  const { matrix, weeks } = buildHeatmapMatrix(_heatmapCache, metric);
  const rows = [['Module', ...weeks]];
  matrix.forEach(row => {
    const r = [row.mod];
    row.cells.forEach(c => { r.push(c.value !== null ? (metric === 'latency' ? Math.round(c.value) : c.value.toFixed(4)) : ''); });
    rows.push(r);
  });
  downloadCSV(`eval-heatmap-${metric}.csv`, rows);
}

// R226 事件绑定
const _hmMetricSel = $('heatmapMetricSel');
if (_hmMetricSel) _hmMetricSel.addEventListener('change', () => { renderHeatmap(buildHeatmapMatrix(_heatmapCache, _hmMetricSel.value), _hmMetricSel.value); });
const _hmCSV = $('heatmapCSVBtn');
if (_hmCSV) _hmCSV.addEventListener('click', exportHeatmapCSV);
// 启动时加载热力图
refreshHeatmap();

// ===== R227: 模块雷达图 =====
const RADAR_DIMS = [
  { key: 'faithfulness', label: '合规分', max: 1, fmt: v => v.toFixed(3) },
  { key: 'p95_latency', label: 'P95延迟(ms)', max: 0, invert: true, fmt: v => v.toFixed(0) + 'ms' },
  { key: 'avg_latency', label: '均延迟(ms)', max: 0, invert: true, fmt: v => v.toFixed(1) + 'ms' },
  { key: 'avg_cost', label: '成本(元)', max: 0, invert: true, fmt: v => '¥' + v.toFixed(4) },
  { key: 'kb_hit', label: 'KB命中率', max: 1, fmt: v => (v*100).toFixed(0) + '%' }
];
const RADAR_COLORS = ['#e74c3c','#3498db','#2ecc71','#f39c12','#9b59b6','#1abc9c','#e67e22','#34495e'];

async function fetchRadarData(week){
  const benches = ['faithfulness','latency','cost-budget'];
  const results = {};
  for(const b of benches){
    const ghUrl = `${GH}/eval/weekly/${week}-expanded/${b}-by-module.json`;
    const localUrl = `eval/weekly/${week}-expanded/${b}-by-module.json`;
    let data = null;
    try{
      const r = await fetch(ghUrl, { cache:'no-cache' });
      if(r.ok) data = await r.json();
    }catch(e){}
    if(!data){
      try{
        const r = await fetch(localUrl, { cache:'no-cache' });
        if(r.ok) data = await r.json();
      }catch(e){}
    }
    results[b] = data;
  }
  // Merge into per-module radar rows
  const modules = {};
  const fai = results['faithfulness'];
  if(!fai || !fai.modules) return null;
  for(const [mod, v] of Object.entries(fai.modules)){
    modules[mod] = {
      faithfulness: v.avg_score || 0,
      p95_latency: results['latency']?.modules?.[mod]?.p95_ms || 0,
      avg_latency: results['latency']?.modules?.[mod]?.avg_latency || 0,
      avg_cost: results['cost-budget']?.modules?.[mod]?.avg_cost_yuan || 0,
      kb_hit: v.kb_hit_rate || v.kb_hit || 0
    };
  }
  return { week, modules };
}

function buildRadarModuleList(data){
  if(!data) return [];
  return Object.entries(data.modules)
    .map(([mod, vals]) => ({ mod, ...vals }))
    .sort((a,b) => b.faithfulness - a.faithfulness);
}

function normalizeRadarValue(dimKey, val, allVals){
  if(dimKey === 'faithfulness' || dimKey === 'kb_hit'){
    return val; // 0-1
  }
  // For latency/cost: invert (lower is better) → normalize to 0-1
  const max = Math.max(...allVals, 0.001);
  return max > 0 ? 1 - (val / max) : 0;
}

function renderRadarChart(data, selectedMods){
  const wrap = $('radarChartWrap');
  wrap.innerHTML = '';
  if(!data || selectedMods.length === 0){
    wrap.appendChild(el('div', {className:'radar-empty'}, '请选择至少 1 个模块'));
    return;
  }
  const W = 460, H = 380, cx = W/2, cy = H/2 + 10, R = 130;
  const dims = RADAR_DIMS;
  const n = dims.length;
  const angleStep = (Math.PI * 2) / n;

  // Collect all values per dim for normalization
  const allVals = {};
  dims.forEach(d => { allVals[d.key] = []; });
  selectedMods.forEach(mod => {
    const mv = data.modules[mod];
    if(!mv) return;
    dims.forEach(d => allVals[d.key].push(mv[d.key] || 0));
  });

  const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('class','radar-svg');

  // Grid rings (4 levels)
  for(let level=1; level<=4; level++){
    const r = R * level / 4;
    const pts = [];
    for(let i=0; i<n; i++){
      const a = -Math.PI/2 + i * angleStep;
      pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
    }
    const poly = document.createElementNS('http://www.w3.org/2000/svg','polygon');
    poly.setAttribute('points', pts.join(' '));
    poly.setAttribute('class', level === 4 ? 'radar-grid-outer' : 'radar-grid');
    svg.appendChild(poly);
  }

  // Axis lines + labels
  dims.forEach((d, i) => {
    const a = -Math.PI/2 + i * angleStep;
    const x2 = cx + R * Math.cos(a);
    const y2 = cy + R * Math.sin(a);
    const line = document.createElementNS('http://www.w3.org/2000/svg','line');
    line.setAttribute('x1', cx); line.setAttribute('y1', cy);
    line.setAttribute('x2', x2); line.setAttribute('y2', y2);
    line.setAttribute('class', 'radar-axis');
    svg.appendChild(line);
    // Label
    const lx = cx + (R + 22) * Math.cos(a);
    const ly = cy + (R + 22) * Math.sin(a);
    const txt = document.createElementNS('http://www.w3.org/2000/svg','text');
    txt.setAttribute('x', lx); txt.setAttribute('y', ly);
    txt.setAttribute('class', 'radar-axis-label');
    txt.setAttribute('text-anchor', 'middle');
    txt.setAttribute('dominant-baseline', 'middle');
    txt.textContent = d.label;
    svg.appendChild(txt);
  });

  // Draw each selected module as a polygon
  const legendItems = [];
  selectedMods.forEach((mod, idx) => {
    const mv = data.modules[mod];
    if(!mv) return;
    const color = RADAR_COLORS[idx % RADAR_COLORS.length];
    const pts = [];
    dims.forEach((d, i) => {
      const raw = mv[d.key] || 0;
      const norm = normalizeRadarValue(d.key, raw, allVals[d.key]);
      const r = Math.max(0, Math.min(1, norm)) * R;
      const a = -Math.PI/2 + i * angleStep;
      pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
    });
    // Polygon
    const poly = document.createElementNS('http://www.w3.org/2000/svg','polygon');
    poly.setAttribute('points', pts.join(' '));
    poly.setAttribute('class', 'radar-shape');
    poly.setAttribute('fill', color);
    poly.setAttribute('fill-opacity', '0.12');
    poly.setAttribute('stroke', color);
    poly.setAttribute('stroke-width', '2');
    poly.setAttribute('stroke-opacity', '0.85');
    // Tooltip
    const modLabel = MODULE_NAMES[mod] || mod;
    const tipParts = dims.map(d => `${d.label}: ${d.fmt(mv[d.key]||0)}`).join('\n');
    const title = document.createElementNS('http://www.w3.org/2000/svg','title');
    title.textContent = `${modLabel}\n${tipParts}`;
    poly.appendChild(title);
    svg.appendChild(poly);
    // Vertices
    pts.forEach((pt, i) => {
      const [px, py] = pt.split(',');
      const dot = document.createElementNS('http://www.w3.org/2000/svg','circle');
      dot.setAttribute('cx', px); dot.setAttribute('cy', py);
      dot.setAttribute('r', '3');
      dot.setAttribute('fill', color);
      svg.appendChild(dot);
    });
    legendItems.push({ color, label: modLabel, mod });
  });

  wrap.appendChild(svg);

  // Legend
  const legendDiv = $('radarLegend');
  legendDiv.innerHTML = '';
  legendItems.forEach(item => {
    const chip = el('div', {className:'radar-legend-chip'},
      el('span', {className:'radar-legend-dot', style:`background:${item.color}`}),
      el('span', {className:'radar-legend-text'}, item.label)
    );
    legendDiv.appendChild(chip);
  });
}

async function refreshRadar(){
  const weekSel = $('radarWeekSel');
  const modSel = $('radarModSel');
  const week = weekSel.value || WEEKS[WEEKS.length-1];
  const data = await fetchRadarData(week);
  if(!data){
    $('radarChartWrap').innerHTML = '<div class="radar-empty">暂无 expanded 数据</div>';
    return;
  }
  // Populate module select if empty or week changed
  if(modSel.children.length === 0 || modSel.dataset.week !== week){
    modSel.innerHTML = '';
    modSel.dataset.week = week;
    const list = buildRadarModuleList(data);
    list.forEach(item => {
      const opt = document.createElement('option');
      opt.value = item.mod;
      opt.textContent = `${MODULE_NAMES[item.mod] || item.mod} (${item.faithfulness.toFixed(3)})`;
      modSel.appendChild(opt);
    });
    // Default: select top 5
    list.slice(0, 5).forEach(item => {
      const opt = modSel.querySelector(`option[value="${item.mod}"]`);
      if(opt) opt.selected = true;
    });
  }
  const selected = Array.from(modSel.selectedOptions).map(o => o.value);
  renderRadarChart(data, selected);
}

function exportRadarCSV(){
  const weekSel = $('radarWeekSel');
  const modSel = $('radarModSel');
  const week = weekSel.value || WEEKS[WEEKS.length-1];
  const selected = Array.from(modSel.selectedOptions).map(o => o.value);
  if(selected.length === 0){ alert('请先选择模块'); return; }
  const header = ['module', ...RADAR_DIMS.map(d => d.label)];
  const rows = [header];
  // Fetch synchronously from cache
  fetchRadarData(week).then(data => {
    if(!data) return;
    selected.forEach(mod => {
      const mv = data.modules[mod];
      if(!mv) return;
      rows.push([mod, ...RADAR_DIMS.map(d => mv[d.key] || 0)]);
    });
    const csv = '\uFEFF' + rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `radar-${week}.csv`;
    a.click();
  });
}

// Init radar controls
(function initRadar(){
  const weekSel = $('radarWeekSel');
  const modSel = $('radarModSel');
  WEEKS.forEach(w => {
    const opt = document.createElement('option');
    opt.value = w; opt.textContent = w;
    weekSel.appendChild(opt);
  });
  weekSel.value = WEEKS[WEEKS.length-1];
  weekSel.addEventListener('change', () => {
    modSel.innerHTML = '';
    modSel.dataset.week = '';
    refreshRadar();
  });
  modSel.addEventListener('change', refreshRadar);
  // Quick buttons
  document.querySelectorAll('.radar-mini-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const sel = btn.dataset.sel;
      const opts = Array.from(modSel.options);
      if(sel === 'all'){
        opts.forEach(o => o.selected = true);
      } else {
        // Sort by faithfulness (in text)
        opts.sort((a,b) => {
          const av = parseFloat(a.textContent.match(/\((0\.\d+)\)/)?.[1] || '0');
          const bv = parseFloat(b.textContent.match(/\((0\.\d+)\)/)?.[1] || '0');
          return sel === 'top5' ? bv - av : av - bv;
        });
        opts.forEach(o => o.selected = false);
        opts.slice(0, 5).forEach(o => o.selected = true);
      }
      refreshRadar();
    });
  });
  const csvBtn = $('radarCSVBtn');
  if(csvBtn) csvBtn.addEventListener('click', exportRadarCSV);
  // Load radar after initial data
  setTimeout(refreshRadar, 500);
})();

// 启动
refresh();

// 30 分钟自动刷新
setInterval(refresh, 30 * 60 * 1000);

})();