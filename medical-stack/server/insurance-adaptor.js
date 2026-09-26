/**
 * insurance-adaptor.js — 医保局人脸核对对接适配层（R735 医学身份核验）
 * 场景：医保局系统人脸核对（医疗身份确认）
 * 协议：医保标准接口规范（interfacenumber 风格，可配置对接方）
 * 安全：数据脱敏（日志不存照片/特征明文）+ 全量审计（traceId 可追溯）
 * 依赖：face-embed-server（:8958）算法
 * 端点：
 *   POST /api/insurance/face-check   医保人脸核对（医保局调用）
 *   GET  /api/insurance/audit        审计日志（脱敏）
 *   GET  /api/insurance/status       适配层状态
 */
const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const http = require('http');

const FACE_SVC = 'http://127.0.0.1:8958';
const LOG_DB = path.join(__dirname, '..', 'data', 'insurance-check-log.json');
const HERB_MAP = path.join(__dirname, 'kb', 'herb-insurance-code-map.json');
const TCD_MAP = path.join(__dirname, 'kb', 'tcd-code-map.json');
const DEIDENT = (v) => (v ? String(v).slice(0, 2) + '***' + String(v).slice(-2) : ''); // 脱敏：前后各留 2 位

function loadHerbMap() { try { return JSON.parse(fs.readFileSync(HERB_MAP, 'utf8')); } catch (e) { return null; } }
let _tcd = null;
function loadTcdMap() {
  if (_tcd) return _tcd;
  try { _tcd = JSON.parse(fs.readFileSync(TCD_MAP, 'utf8')); } catch (e) { _tcd = null; }
  return _tcd;
}
const FZ_MAP = path.join(__dirname, 'kb', 'fangzheng-map.json');
let _fz = null;
function loadFangzhengMap() {
  if (_fz) return _fz;
  try { _fz = JSON.parse(fs.readFileSync(FZ_MAP, 'utf8')); } catch (e) { _fz = null; }
  return _fz;
}

function loadLog() { try { return JSON.parse(fs.readFileSync(LOG_DB, 'utf8')); } catch (e) { return []; } }
function saveLog(log) { fs.mkdirSync(path.dirname(LOG_DB), { recursive: true }); fs.writeFileSync(LOG_DB, JSON.stringify(log, null, 2)); }

function callFaceSvc(endpoint, payload) {
  return new Promise((resolve) => {
    const body = JSON.stringify(payload);
    const req = http.request(FACE_SVC + endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }, timeout: 15000 }, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch (e) { resolve({ ok: false, error: 'parse fail' }); } });
    });
    req.on('error', () => resolve({ ok: false, error: 'face-service unavailable' }));
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, error: 'face-service timeout' }); });
    req.write(body); req.end();
  });
}

function build_explain(code, v, patient_id) {
  const sim = typeof v.similarity === 'number' ? v.similarity : (v.best && v.best.similarity) || null;
  const simTxt = sim === null ? '' : '（相似度 ' + Math.round(sim * 1000) / 1000 + '）';
  const base = '参保人 ' + (patient_id || '未知') + ' ' + simTxt;
  switch (code) {
    case 'MATCH':
      return { verdict: '通过', text: base + '：人脸一致，可以继续办理医保业务。', next: ['放行进入后续流程', '如需开药/报销直接走正常通道'], safe: true };
    case 'MISMATCH':
      return { verdict: '不通过', text: base + '：人脸不一致。请人工复核参保人身份与现场照片，必要时要求补充证件。', next: ['人工比对证件照与现场人像', '仍无法确认时拒绝办理并上报'], safe: false };
    case 'NOT_REGISTERED':
      return { verdict: '未建档', text: '该参保人尚未录入人脸档案，无法自动核对。', next: ['引导参保人到建档窗口补录人脸', '补录后重新核验'], safe: false };
    case 'SVC_ERR':
      return { verdict: '服务异常', text: '核验服务暂时不可用，请稍后重试或走人工通道。', next: ['稍后重试', '人工核验兜底（证件+签名）'], safe: false };
    default:
      return { verdict: '未知', text: '核验返回异常结果，请人工确认。', next: ['人工复核'], safe: false };
  }
}

function registerRoutes(app) {
  // 医保人脸核对（医保局对接）
  app.post('/api/insurance/face-check', async (req, res) => {
    try {
      const { patient_id, photo_base64, operator, channel } = req.body || {};
      if (!photo_base64) {
        return res.status(400).json({ code: 'PARAM_MISSING', message: 'photo_base64 必填',
          explain: { verdict: '参数缺失', text: '请先拍摄/上传参保人现场照片，再点核验。', next: ['拍摄现场人像', '重新核验'], safe: false } });
      }
      const traceId = 'MBS-' + Date.now().toString(36).toUpperCase() + '-' + crypto.randomBytes(2).toString('hex').toUpperCase();
      // 调人脸算法核验
      const vPayload = { image: photo_base64 };
      if (patient_id) vPayload.person_id = String(patient_id);  // 有 ID：1:1；无 ID：1:N 全库检索
      const v = await callFaceSvc('/api/face/verify', vPayload);
      let code, message;
      if (!v.ok) {
        if (v.error && v.error.includes('not registered')) { code = 'NOT_REGISTERED'; message = '参保人未注册人脸'; }
        else { code = 'SVC_ERR'; message = v.error || '核验服务异常'; }
      } else {
        code = v.match ? 'MATCH' : 'MISMATCH';
        message = v.match ? '人脸核对一致' : '人脸核对不一致，请人工复核';
      }
      // R735-g10：核验结果智能解读（医保窗口 AI 辅助）
      const explain = build_explain(code, v, patient_id);
      // 审计日志（脱敏：不存照片/特征，患者 ID 脱敏，相似度取 3 位）
      const log = loadLog();
      log.unshift({
        traceId, code, message,
        patient_id: DEIDENT(patient_id || (v.best && v.best.person_id) || ''), operator: DEIDENT(operator || 'system'),
        channel: String(channel || 'insurance').slice(0, 30),
        similarity: typeof v.similarity === 'number' ? Math.round(v.similarity * 1000) / 1000 : (v.best && v.best.similarity) || null,
        face_ms: v.ms || null, hint: v.hint || '',
        ts: new Date().toISOString(),
      });
      saveLog(log.slice(0, 500)); // 保留最近 500 条
      // 医保标准响应
      res.json({
        interfacenumber: 'MZRH_0101', bizType: 'medicalFaceCheck', traceId,
        code, message, match: code === 'MATCH', explain,
        similarity: typeof v.similarity === 'number' ? Math.round(v.similarity * 1000) / 1000 : null,
        patient_id: DEIDENT(patient_id || (v.best && v.best.person_id) || ''),
        ts: new Date().toISOString(),
      });
    } catch (e) { res.status(500).json({ code: 'SYS_ERR', message: String(e).slice(0, 200) }); }
  });

  // 审计日志（脱敏查询）
  app.get('/api/insurance/audit', (req, res) => {
    const log = loadLog();
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '20', 10)));
    res.json({ ok: true, total: log.length, records: log.slice(0, limit) });
  });

  // WO-004：单味药医保映射查询
  app.get('/api/insurance/herb-map', (req, res) => {
    const m = loadHerbMap();
    if (!m) return res.status(503).json({ ok: false, error: 'herb-insurance-code-map.json 未构建，请先运行 scripts/build-herb-insurance-map.py' });
    const name = String(req.query.name || '').trim();
    if (!name) return res.status(400).json({ ok: false, error: 'name 必填' });
    const e = m.herbs[name];
    if (!e) return res.json({ ok: true, found: false, name, hint: '未入映射表（映射表覆盖方剂在册药名+目录品种），可入人工核对队列' });
    res.json({ ok: true, found: true, entry: e, meta: { code_rule: m._meta.code_rule, red_line: m._meta.red_line } });
  });

  // WO-004：处方饮片医保合规预检（签发前调用）
  app.post('/api/insurance/rx-check', (req, res) => {
    const m = loadHerbMap();
    if (!m) return res.status(503).json({ ok: false, error: 'herb-insurance-code-map.json 未构建' });
    const herbs = Array.isArray((req.body || {}).herbs) ? req.body.herbs : [];
    if (!herbs.length) return res.status(400).json({ ok: false, error: 'herbs 数组必填（药名字符串）' });
    const items = herbs.map((raw) => {
      const name = String(raw).trim();
      const e = m.herbs[name];
      if (!e) return { name, status: 'unknown', reimbursable: null, warn: '未入映射表，建议人工核对' };
      if (e.exclusion_rule && !e.reimbursable) return { name, status: 'excluded', reimbursable: false, warn: `负面清单：${e.exclusion_rule}（不得纳入基金支付）`, catalog_match: e.catalog_match };
      if (e.payment_conflict) return { name, status: 'conflict', reimbursable: null, warn: e.payment_conflict, catalog_match: e.catalog_match };
      if (!e.catalog_match.length) return { name, status: 'not_in_catalog', reimbursable: false, warn: '不在医保目录889品种内，按自费处理', code_status: e.code_status };
      return { name, status: 'payable', reimbursable: true, catalog_match: e.catalog_match,
        insurance_code: e.insurance_code, granule_code: e.granule_code,
        code_status: e.code_status, code_source: e.code_source };
    });
    const sum = {
      total: items.length,
      payable: items.filter((i) => i.status === 'payable').length,
      excluded: items.filter((i) => i.status === 'excluded').length,
      not_in_catalog: items.filter((i) => i.status === 'not_in_catalog').length,
      conflict: items.filter((i) => i.status === 'conflict').length,
      unknown: items.filter((i) => i.status === 'unknown').length,
      codes_verified: items.filter((i) => i.insurance_code).length,
      codes_pending: items.filter((i) => i.status === 'payable' && !i.insurance_code).length,
    };
    res.json({ ok: true, summary: sum, items, exclusion_note: m.exclusion_note,
      disclaimer: '预检依据医保发〔2023〕5号目录+负面清单；编码回填中（code_status=pending_official_db 者待国家动态维护库核对），最终以参保地医保局结算口径为准' });
  });

  // WO-005：TCD 病证代码查询（GB/T 15657-2021）
  app.get('/api/insurance/tcd-code', (req, res) => {
    const m = loadTcdMap();
    if (!m) return res.status(503).json({ ok: false, error: 'tcd-code-map.json 未构建，请先运行 scripts/build-tcd-code-map.py' });
    const name = String(req.query.name || '').trim();
    if (!name) return res.status(400).json({ ok: false, error: 'name 必填' });
    const kind = String(req.query.type || '').toUpperCase(); // A=疾病 B=证候 空=全部
    let hits = (m.index[name] || []).filter((h) => !kind || h.kind === kind);
    let normalized = null;
    if (!hits.length && name.endsWith('证')) {
      // 归一：去「证」再查（如 肝郁气滞 → 肝郁气滞证不在索引但去证后可能有别名）
      normalized = name;
    }
    if (hits.length) {
      return res.json({ ok: true, found: true, query: name, hits: hits.map((h) => ({
        code: h.code, standard_name: h.name, kind: h.kind === 'A' ? '中医疾病' : '中医证候',
        matched_via: h.via, is_category: h.is_category,
        usage_note: h.is_category ? '类目词，不宜直接作临床诊断，请细化到下位术语' : null,
      })) });
    }

    // 方证通道（2026-09-23 WO-011 续：以方名证传统——柴胡证≈小柴胡汤证；方证非 GB/T 编码对象，给对应参考不赋码）
    let fangzhengSuggestion = null;
    if (/证$/.test(name)) {
      const fz = loadFangzhengMap();
      if (fz) {
        const core = name.replace(/证$/, '');
        let fnames = fz.abbr_index[core] || [];
        if (!fnames.length) {
          // 互含兜底（柴胡→小柴胡汤；大青龙→大青龙汤/大青龙加附子汤），短名优先
          fnames = Object.keys(fz.abbr_index).filter((k) => k.includes(core) || core.includes(k))
            .sort((a, b) => a.length - b.length).slice(0, 3)
            .reduce((acc, k) => acc.concat(fz.abbr_index[k]), []);
        }
        // suspect_backlink 复核名单优先（WO-005 裁决包 88 条在册）
        const backed = (fz.suspect_backlink && fz.suspect_backlink[name]) || [];
        const merged = [...new Set([...backed, ...fnames])].filter((f) => fz.details[f]).slice(0, 3);
        if (merged.length) {
          fangzhengSuggestion = {
            formulas: merged.map((f) => Object.assign({ name: f }, fz.details[f])),
            adjudicated: backed.length > 0,
            note: '方证对应（伤寒论以方名证传统）：证从方名，非 GB/T 证候编码对象；按方剂主治参用，不赋 B 码',
          };
        }
      }
    }
    // 组合证拆解建议（2026-09-23：组分全部命中标准 B 码非类目才给出，零编造，不创设新码）
    const compVocab = {};
    for (const e of (m.patterns_B || [])) {
      const core = e.name.replace(/证$/, '');
      if (core.length >= 2 && core.length <= 7 && !compVocab[core]) compVocab[core] = e;
      for (const syn of (e.synonyms || [])) {
        const sc = syn.replace(/证$/, '');
        if (sc.length >= 2 && sc.length <= 7 && !compVocab[sc]) compVocab[sc] = e;
      }
    }
    const decompose = (core, depth) => {
      if ((depth || 0) > 2 || core.length < 4) return null;
      for (let i = Math.min(7, core.length - 2); i >= 2; i--) {
        const head = core.slice(0, i);
        if (!compVocab[head]) continue;
        const tail = core.slice(i);
        if (compVocab[tail]) return [head, tail];
        const sub = decompose(tail, (depth || 0) + 1);
        if (sub) return [head].concat(sub);
      }
      return null;
    };
    let comboSuggestion = null;
    const core0 = name.replace(/证候?$/, '');
    let parts = null;
    for (const sep of ['兼夹', '兼', '夹']) {
      const seg = core0.split(sep).filter((x) => x.length >= 2);
      if (seg.length >= 2 && seg.length <= 3) {
        // 段内继续 DP 拆解（气虚血瘀兼痰湿 → 气虚+血瘀+痰湿）
        const expanded = [];
        let ok = true;
        for (const x of seg) {
          if (compVocab[x]) { expanded.push(x); continue; }
          const sub = decompose(x, 0);
          if (sub) { expanded.push.apply(expanded, sub); continue; }
          ok = false; break;
        }
        if (ok && expanded.length >= 2 && expanded.length <= 4) { parts = expanded; break; }
      }
    }
    if (!parts) parts = decompose(core0, 0);
    if (parts) {
      const comps = parts.map((p) => ({ via_name: p, code: compVocab[p].code, standard_name: compVocab[p].name,
        is_category: compVocab[p].code.endsWith('.') }));
      const hasCat = comps.some((c) => c.is_category);
      comboSuggestion = {
        components: comps,
        note: '组合证拆解建议：组分均为 GB/T 15657-2021 标准证候' + (hasCat ? '（含类目词，临床诊断请细化到下位证）' : '码') + '，供临床录入参考；组合本身不创设新码，医保结算以参保地口径为准',
      };
    }
    // 否定形态提示（无/有×证 → 基准证名，不作独立编码）
    let negationNote = null;
    const nm = name.match(/^(无|有|未|不)(.+?证)$/);
    if (nm && m.index[nm[2]]) {
      negationNote = { base: nm[2], base_hits: m.index[nm[2]].map((h) => ({ code: h.code, standard_name: h.name })),
        note: '否定形态不作独立编码，所示为基准证名（' + nm[2] + '）的标准码，供阅读参考' };
    }
    // 模糊建议：前缀/包含（最多 5 条，供医生点选，不自动赋码）
    const sugg = Object.keys(m.index).filter((k) => k.includes(name) || name.includes(k)).slice(0, 5)
      .map((k) => ({ name: k, hits: m.index[k].map((h) => ({ code: h.code, standard_name: h.name, kind: h.kind })) }));
    res.json({ ok: true, found: false, query: name, suggestions: sugg,
      combo_suggestion: comboSuggestion, negation_note: negationNote, fangzheng_suggestion: fangzhengSuggestion,
      hint: '未命中 GB/T 15657-2021 标准名称；可点选建议项' + (comboSuggestion ? '，或参考组合拆解（组分均为标准码）' : '') + (fangzhengSuggestion ? '，或按方证对应参考方剂主治（不赋码）' : '') + '，或按古籍异名/组合证入人工裁决队列（禁止自动赋码）' });
  });

  // 适配层状态
  app.get('/api/insurance/status', async (req, res) => {
    const log = loadLog();
    const matchCount = log.filter((r) => r.code === 'MATCH').length;
    res.json({
      ok: true, service: 'insurance-adaptor', scene: 'medical-insurance-face-check',
      face_service: FACE_SVC, total_checks: log.length, match_count: matchCount,
      last_check: log[0] ? log[0].ts : null,
      deidentification: 'ON（日志不存照片/特征明文，ID 脱敏）',
    });
  });
}

module.exports = { registerRoutes };
