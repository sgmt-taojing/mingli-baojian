/**
 * graph-service.js — 知识图谱只读 API（愿景 2026 · 切片 1）
 * 依据 DELIVERY/vision-2026/详细设计.md
 * 数据源 server/kb/graph-store.json（graph-build-pass1.js 构建），mtime 变更自动重载
 * 端点：GET /api/graph/{stats,entity/:id,query,neighbors/:id,path}
 * 纪律：只读、无证据不入图、命理内容天然不在图中（R745 数据源已过滤）
 */
'use strict';
const fs = require('fs');
const path = require('path');

const GRAPH_PATH = path.join(__dirname, 'kb', 'graph-store.json');

let G = null;            // 原始图谱
let byName = null;       // name/alias(lower) → id
let byCode = null;       // GB/T 码 → id
let adjOut = null;       // id → [rel]
let adjIn = null;        // id → [rel]
let mtime = 0;

function loadGraph() {
  try {
    const st = fs.statSync(GRAPH_PATH);
    if (G && st.mtimeMs === mtime) return true;
    const raw = JSON.parse(fs.readFileSync(GRAPH_PATH, 'utf-8'));
    const _byName = new Map(), _byCode = new Map(), _out = new Map(), _in = new Map();
    // 两遍建索引：先正名后别名，别名不得覆盖正名（「小柴胡汤」必须指向本方而非加减法的别名）
    for (const [id, e] of Object.entries(raw.entities || {})) {
      _byName.set(e.name.toLowerCase(), id);
      if (e.attrs && e.attrs.code) _byCode.set(e.attrs.code, id);
    }
    for (const [id, e] of Object.entries(raw.entities || {})) {
      for (const a of e.aliases || []) {
        const k = String(a).toLowerCase();
        if (!_byName.has(k)) _byName.set(k, id);
      }
    }
    for (const r of raw.relations || []) {
      if (!_out.has(r.s)) _out.set(r.s, []);
      _out.get(r.s).push(r);
      if (!_in.has(r.o)) _in.set(r.o, []);
      _in.get(r.o).push(r);
    }
    G = raw; byName = _byName; byCode = _byCode; adjOut = _out; adjIn = _in; mtime = st.mtimeMs;
    console.log(`[graph] 已加载：实体 ${raw._meta.entities}，关系 ${raw._meta.relations}`);
    return true;
  } catch (e) {
    console.error('[graph] 加载失败:', e.message);
    return false;
  }
}

function notBuilt(res) {
  return res.status(503).json({ ok: false, error: 'graph_not_built', hint: '请先运行 node scripts/graph-build-pass1.js' });
}

function neighborList(id, relFilter, limit) {
  const cap = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 500);
  const out = (adjOut.get(id) || []).map(r => ({ dir: 'out', r: r.r, target: r.o, attrs: r.attrs || null, confidence: r.evidence.confidence }));
  const inc = (adjIn.get(id) || []).map(r => ({ dir: 'in', r: r.r, target: r.s, attrs: r.attrs || null, confidence: r.evidence.confidence }));
  let all = out.concat(inc);
  if (relFilter) all = all.filter(x => x.r === relFilter);
  all.sort((a, b) => (b.confidence - a.confidence) || (((b.attrs && b.attrs.hit_entries) || 0) - ((a.attrs && a.attrs.hit_entries) || 0)));
  return all.slice(0, cap).map(x => {
    const t = G.entities[x.target];
    return { ...x, target_name: t ? t.name : x.target, target_type: t ? t.type : null };
  });
}

function registerGraph(app) {
  loadGraph();
  // mtime 轮询重载（30s，轻量）
  setInterval(loadGraph, 30000).unref();

  app.get('/api/graph/stats', (req, res) => {
    if (!loadGraph()) return notBuilt(res);
    res.json({ ok: true, meta: G._meta });
  });

  app.get('/api/graph/query', (req, res) => {
    if (!loadGraph()) return notBuilt(res);
    const q = String(req.query.q || '').trim();
    if (!q) return res.status(400).json({ ok: false, error: 'q 必填' });
    const lq = q.toLowerCase();
    const hits = [];
    const seen = new Set();
    // ① 编码直查
    if (byCode.has(q)) { hits.push({ id: byCode.get(q), match_kind: 'code' }); seen.add(byCode.get(q)); }
    // ② 名称/别名精确
    if (byName.has(lq) && !seen.has(byName.get(lq))) { hits.push({ id: byName.get(lq), match_kind: 'exact' }); seen.add(byName.get(lq)); }
    // ③ 前缀
    for (const [name, id] of byName) {
      if (hits.length >= 20) break;
      if (!seen.has(id) && name.startsWith(lq)) { hits.push({ id, match_kind: 'prefix' }); seen.add(id); }
    }
    // ④ 包含
    for (const [name, id] of byName) {
      if (hits.length >= 20) break;
      if (!seen.has(id) && name.includes(lq)) { hits.push({ id, match_kind: 'contains' }); seen.add(id); }
    }
    res.json({
      ok: true, query: q, count: hits.length,
      hits: hits.map(h => {
        const e = G.entities[h.id];
        return { id: h.id, match_kind: h.match_kind, type: e.type, name: e.name, aliases: e.aliases.slice(0, 5), code: (e.attrs && e.attrs.code) || null };
      })
    });
  });

  app.get('/api/graph/entity/:id', (req, res) => {
    if (!loadGraph()) return notBuilt(res);
    const id = decodeURIComponent(req.params.id);
    const e = G.entities[id];
    if (!e) return res.status(404).json({ ok: false, error: 'entity_not_found', id });
    res.json({ ok: true, id, entity: e, neighbors: neighborList(id, null) });
  });

  app.get('/api/graph/neighbors/:id', (req, res) => {
    if (!loadGraph()) return notBuilt(res);
    const id = decodeURIComponent(req.params.id);
    if (!G.entities[id]) return res.status(404).json({ ok: false, error: 'entity_not_found', id });
    const rel = req.query.rel ? String(req.query.rel) : null;
    res.json({ ok: true, id, rel: rel || 'all', neighbors: neighborList(id, rel, req.query.limit) });
  });

  app.get('/api/graph/path', (req, res) => {
    if (!loadGraph()) return notBuilt(res);
    let { from, to } = req.query;
    from = String(from || '').trim(); to = String(to || '').trim();
    if (!from || !to) return res.status(400).json({ ok: false, error: 'from 与 to 必填' });
    // 允许传名称或 ID
    const fromId = G.entities[from] ? from : byName.get(from.toLowerCase());
    const toId = G.entities[to] ? to : byName.get(to.toLowerCase());
    if (!fromId || !G.entities[fromId]) return res.status(404).json({ ok: false, error: 'entity_not_found', id: from });
    if (!toId || !G.entities[toId]) return res.status(404).json({ ok: false, error: 'entity_not_found', id: to });
    // BFS 深度 ≤4（无向）
    const prev = new Map([[fromId, null]]);
    const queue = [fromId];
    let found = false;
    while (queue.length && !found) {
      const cur = queue.shift();
      let depth = 0; let p = cur; while (prev.get(p)) { p = prev.get(p); depth++; }
      if (depth >= 4) continue;
      const edges = (adjOut.get(cur) || []).concat((adjIn.get(cur) || []).map(r => ({ s: r.o, r: r.r, o: r.s })));
      for (const e of edges) {
        const nxt = e.o;
        if (!prev.has(nxt)) {
          prev.set(nxt, { id: cur, rel: e.r });
          if (nxt === toId) { found = true; break; }
          queue.push(nxt);
        }
      }
    }
    if (!found) return res.json({ ok: true, from: fromId, to: toId, path: [], note: '4 跳内无路径' });
    const chain = [];
    let cur = toId;
    while (cur) {
      const e = G.entities[cur];
      const pr = prev.get(cur);
      chain.unshift({ id: cur, name: e.name, type: e.type, via_rel: pr ? pr.rel : null });
      cur = pr ? pr.id : null;
    }
    res.json({ ok: true, from: fromId, to: toId, depth: chain.length - 1, path: chain });
  });

  // ── 切片4：辨证推理链 v1（证→鉴别→方→药，全部取自证据图谱，不生成新内容）──
  // GET /api/graph/reason?pattern=肝郁气滞证（或编码/ID）
  app.get('/api/graph/reason', (req, res) => {
    if (!loadGraph()) return notBuilt(res);
    const q = String(req.query.pattern || req.query.q || '').trim();
    if (!q) return res.status(400).json({ ok: false, error: 'pattern 必填' });
    const pid = G.entities[q] ? q : (byCode.get(q) || byName.get(q.toLowerCase()));
    if (!pid || !G.entities[pid]) return res.status(404).json({ ok: false, error: 'entity_not_found', id: q });
    const ent = G.entities[pid];
    if (ent.type !== 'pattern' && ent.type !== 'disease') {
      return res.status(400).json({ ok: false, error: 'reason 仅支持证/病实体', got_type: ent.type });
    }
    const code = (ent.attrs && ent.attrs.code) || '';

    // ① 鉴别：GB/T 编码层级的父链与同层兄弟（结构化证据，非共现猜测）
    const parentChain = [];
    const siblings = [];
    if (code && /^(A|B)/.test(code)) {
      const parts = code.replace(/\.$/, '').split('.').filter(Boolean); // ['B','04','02',...]
      for (let i = parts.length - 1; i >= 1; i--) {
        const prefix = parts.slice(0, i).join('.') + '.';
        const pe = G.entities[(code.startsWith('B') ? 'pattern:' : 'disease:') + prefix];
        if (pe) parentChain.unshift({ id: pe.attrs.code ? `pattern:${pe.attrs.code}` : prefix, name: pe.name, code: pe.attrs.code });
      }
      if (parts.length >= 2) {
        const parentPrefix = parts.slice(0, -1).join('.') + '.';
        for (const [id, e] of Object.entries(G.entities)) {
          if (e.type !== ent.type || id === pid) continue;
          const c = (e.attrs && e.attrs.code) || '';
          if (c.startsWith(parentPrefix) && c !== code && siblings.length < 12) {
            siblings.push({ id, name: e.name, code: c });
          }
        }
      }
    }

    // ② 方：treats 入边（主治本证/病的方），每方带组成药与主治症状
    const treatIn = (adjIn.get(pid) || []).filter(r => r.r === 'treats');
    const formulas = treatIn.slice(0, 8).map(r => {
      const f = G.entities[r.s];
      const herbs = (adjOut.get(r.s) || []).filter(x => x.r === 'composed_of')
        .map(x => (G.entities[x.o] || {}).name).filter(Boolean).slice(0, 10);
      const syms = (adjOut.get(r.s) || []).filter(x => x.r === 'indicated_symptom')
        .map(x => (G.entities[x.o] || {}).name).filter(Boolean).slice(0, 8);
      const caseCount = (adjIn.get(r.s) || []).filter(x => x.r === 'treated_by').length;
      return { id: r.s, name: f.name, confidence: r.evidence.confidence, herbs, symptoms: syms, case_count: caseCount,
        effect: (f.attrs && f.attrs.effect) || '', source_book: (f.attrs && f.attrs.source_book) || '' };
    });

    // ③ 医案：treated_by 链路（本证相关方被哪些医案用过，取前 5）
    const cases = [];
    for (const f of formulas) {
      for (const x of (adjIn.get(f.id) || [])) {
        if (x.r === 'treated_by' && cases.length < 5) {
          const c = G.entities[x.s];
          if (c) cases.push({ id: x.s, name: c.name, formula: f.name });
        }
      }
    }

    res.json({
      ok: true,
      pattern: { id: pid, name: ent.name, code, is_category: !!(ent.attrs && ent.attrs.is_category) },
      hierarchy: { parent_chain: parentChain, siblings },
      formulas,
      cases,
      disclaimer: '推理链由证据图谱装配（GB/T 层级/方证主治/医案用方），供医师参考，临证裁定权在执业医师'
    });
  });

  console.log('   知识图谱: /api/graph/{stats,query,entity/:id,neighbors/:id,path,reason}');
}

module.exports = { registerGraph };
