/**
 * 长程画像引擎前端控制器
 * 数据流: localStorage 多源 → 后端 /api/tcm/longitudinal-* → 渲染
 */
(function() {
  'use strict';
  
  const API_BASE = (typeof TCM !== 'undefined' && TCM.API_BASE) || '';
  
  let currentPatientId = null;
  let currentProfile = null;
  let patternPool = [];
  
  // ═══ 数据采集 ═══
  
  function collectSources() {
    const sources = {
      emr: safeGet('tcm_emr'),
      prescription: safeGet('tcm_prescriptions'),
      followup: safeGet('tcm_followup_log'),
      tongue: safeGet('tcm_tongue_records') || [],
      constitution: safeGet('tcm_wellness_results') || []
    };
    return sources;
  }
  
  function safeGet(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }
  
  function listPatients() {
    const sources = collectSources();
    const map = new Map();
    
    for (const [src, arr] of Object.entries(sources)) {
      if (!Array.isArray(arr)) continue;
      for (const r of arr) {
        const pid = r.patient_id || r.patientId;
        if (!pid) continue;
        if (!map.has(pid)) {
          map.set(pid, {
            id: pid,
            name: r.patient_name || r.patientName || pid,
            eventCount: 0,
            lastDate: ''
          });
        }
        const p = map.get(pid);
        p.eventCount++;
        const ts = r.created_at || r.visit_date || r.time || '';
        if (ts > p.lastDate) p.lastDate = ts;
      }
    }
    
    return [...map.values()].sort((a, b) => b.eventCount - a.eventCount);
  }
  
  // ═══ 渲染 ═══
  
  function renderPatientList() {
    const sel = document.getElementById('patient-select');
    const patients = listPatients();
    if (patients.length === 0) {
      sel.innerHTML = '<option value="">暂无患者数据</option>';
      return;
    }
    
    sel.innerHTML = patients.map(p => 
      `<option value="${esc(p.id)}">${esc(p.name)} (${p.id}) · ${p.eventCount} 事件</option>`
    ).join('');
    
    // 默认选第一个 ≥ 5 事件的患者
    const rich = patients.find(p => p.eventCount >= 5) || patients[0];
    if (rich) {
      sel.value = rich.id;
      currentPatientId = rich.id;
      setTimeout(loadProfile, 100);
    }
  }
  
  function renderProfile(profile) {
    currentProfile = profile;
    
    // KPI
    setText('kpi-span', profile.timeSpan?.label || '—');
    setText('kpi-events', profile.timelineCount);
    setText('kpi-chronic', profile.summary?.chronicTrajectories || 0);
    setText('kpi-herbs', profile.summary?.totalHerbsUsed || 0);
    const top = profile.constitutionProfile?.top3?.[0];
    setText('kpi-constitution', top ? top.type : '—');
    
    // 慢病轨迹
    const tl = document.getElementById('trajectory-list');
    if (!profile.trajectories?.length) {
      tl.innerHTML = '<div class="empty"><div class="icon">📋</div>该患者暂无慢病轨迹（需 ≥ 2 次就诊）</div>';
    } else {
      tl.innerHTML = profile.trajectories.map(t => `
        <div class="trajectory ${t.isChronic ? 'chronic' : ''}">
          <h3>
            ${esc(t.diagnosis)}
            ${t.isChronic ? '<span class="badge" style="background:#e74c3c;color:white;">慢病</span>' : ''}
            <span class="badge" style="background:#ecf0f1;color:#1a2530;">${t.trend === 'improving' ? '📈 改善' : t.trend === 'declining' ? '📉 下降' : '➡️ 平稳'}</span>
          </h3>
          <div class="meta">${t.occurrences} 次就诊 · 历时 ${t.spanLabel} · 平均疗效 ${t.avgEffect}/5</div>
          <div style="font-size:11px;color:#8b8579;margin-bottom:6px;">首次 ${esc(t.firstDate)} → 末次 ${esc(t.lastDate)}</div>
          <div style="font-size:11px;color:#1a2530;margin-bottom:6px;">📊 最优诊次（疗效 ${t.bestRegimen?.effect?.toFixed(1) || '—'}）：</div>
          <div class="herbs">
            ${(t.bestRegimen?.herbs || []).map(h => `<span class="herb optimal">${esc(h)}</span>`).join('')}
          </div>
          ${t.herbFrequency?.length > 0 ? `
            <div style="font-size:11px;color:#8b8579;margin-top:8px;">📈 高频方药：</div>
            <div class="herbs">
              ${t.herbFrequency.map(h => `<span class="herb">${esc(h.name)} ×${h.count}</span>`).join('')}
            </div>
          ` : ''}
        </div>
      `).join('');
    }
    
    // 体质画像
    const cl = document.getElementById('constitution-list');
    const constitutions = profile.constitutionProfile?.all || [];
    if (!constitutions.length) {
      cl.innerHTML = '<div class="empty"><div class="icon">⚖️</div>暂无体质数据</div>';
    } else {
      cl.innerHTML = `<div class="const-grid">${constitutions.map(c => `
        <div class="const-card ${c.chronic ? 'chronic' : ''}">
          <div class="name">${esc(c.type)} ${c.chronic ? '<span style="color:#e74c3c;font-size:10px;">[慢性]</span>' : ''}</div>
          <div class="bar"><div class="bar-fill" style="width:${c.percentage}%;"></div></div>
          <div class="pct">${c.percentage}% · ${c.score} 次</div>
        </div>
      `).join('')}</div>`;
    }
    
    // 时间轴
    const tml = document.getElementById('timeline-list');
    if (!profile.timeline?.length) {
      tml.innerHTML = '<div class="empty"><div class="icon">📅</div>该患者暂无诊疗记录</div>';
    } else {
      tml.innerHTML = `<div class="timeline">${profile.timeline.slice(0, 30).map(e => {
        const chronicTraj = profile.trajectories?.find(t => t.diagnosis === (e.diagnosis || '').trim() && t.isChronic);
        const cls = chronicTraj ? 'chronic' : '';
        const herbs = (e.herbs || []).slice(0, 4).join('、') + ((e.herbs || []).length > 4 ? '...' : '');
        const effectCls = e.effect >= 4 ? 'good' : e.effect > 0 && e.effect < 2.5 ? 'bad' : '';
        return `
          <div class="tl-event ${cls}">
            <div class="tl-date">${esc(e.date)}</div>
            <div><span class="tl-type ${esc(e.source)}">${esc(e.source)}</span></div>
            <div class="tl-detail">
              <strong>${esc(e.diagnosis || '未明确')}</strong>${e.symptoms ? ' · ' + esc(e.symptoms.slice(0, 30)) : ''}
              ${herbs ? '<br><span style="color:#8b8579;font-size:11px;">方药: ' + esc(herbs) + '</span>' : ''}
            </div>
            <div class="tl-effect ${effectCls}">${e.effect > 0 ? e.effect.toFixed(1) : '—'}</div>
          </div>
        `;
      }).join('')}</div>` + 
      (profile.timeline.length > 30 ? `<div style="text-align:center;padding:10px;color:#8b8579;font-size:12px;">…还有 ${profile.timeline.length - 30} 条事件</div>` : '');
    }
  }
  
  function renderRecommendations(recs) {
    const el = document.getElementById('recommendation-list');
    if (!recs || !recs.length) {
      el.innerHTML = '<div class="empty"><div class="icon">🎯</div>暂无匹配模式（需要更多跨患者数据）</div>';
      return;
    }
    el.innerHTML = recs.map(r => `
      <div class="rec-card">
        <div class="head">
          <div class="diag">${esc(r.diagnosis)}</div>
          <div class="sim">${(r.similarity * 100).toFixed(0)}% 相似</div>
        </div>
        <div class="evidence">📊 ${esc(r.constitution)} · ${r.evidence_patients} 位相似患者证据 · 平均疗效 ${r.avgEffect}/5</div>
        <div class="rationale">💡 ${esc(r.rationale)}</div>
        <div class="herbs">
          <span style="background:#ffd700;color:#1a2530;font-weight:700;">推荐方药</span>
          ${(r.topHerbs || []).map(h => `<span class="herb-chip">${esc(h)}</span>`).join('')}
        </div>
      </div>
    `).join('');
  }
  
  // ═══ 操作 ═══
  
  window.loadProfile = function() {
    const pid = document.getElementById('patient-select').value;
    if (!pid) return;
    currentPatientId = pid;
    const sources = collectSources();
    
    // 优先调后端 API，离线时用本地计算
    if (API_BASE) {
      fetch(API_BASE + '/api/tcm/longitudinal-profile', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: pid, sources })
      }).then(r => r.json()).then(data => {
        if (data.ok) renderProfile(data.profile);
        else throw new Error(data.error);
      }).catch(() => {
        // 本地降级
        renderProfile(localBuildProfile(pid, sources));
      });
    } else {
      renderProfile(localBuildProfile(pid, sources));
    }
  };
  
  window.runDistillation = async function() {
    if (!await (window.confirmModal ? confirmModal('启动定期蒸馏：扫描所有患者长程画像 → 提取模式 → 注入 KB。\n\n需要 30 秒左右，是否继续？') : Promise.resolve(confirm('启动定期蒸馏？')))) return;
    
    const sources = collectSources();
    const patients = listPatients();
    
    // 构建所有患者的 profile
    const profiles = patients.map(p => ({
      patientId: p.id,
      profile: localBuildProfile(p.id, sources)
    })).filter(x => x.profile.timelineCount > 0);
    
    if (profiles.length === 0) {
      TCM.toast('没有可蒸馏的患者数据，请先添加患者和病历');
    } else {
      // 离线模式：本地蒸馏 + localStorage
      const patterns = localExtractPatterns(profiles);
      patternPool = patterns;
      const inject = localInjectPatterns(patterns);
      TCM.toast('✅ 本地蒸馏完成  新增: ' + inject.added + ', 更新: ' + inject.updated + ', 总数: ' + inject.total + ', 池中可用: ' + patterns.length);
    }
  };
  
  window.getRecommendations = function() {
    if (!currentProfile) {
      TCM.toast('请先选择一位患者');
    } else {
      renderRecommendations(localRecommend(currentProfile.vector, patternPool));
    }
  };
  
  // ═══ 本地降级（同构后端逻辑）═══
  
  function localBuildProfile(patientId, sources) {
    const SYNDROME_TO_CONST = {
      '咳嗽':['气虚'],'慢性咳嗽':['气虚','阴虚'],'哮喘':['气虚','肾虚'],
      '感冒':['气虚'],'反复感冒':['气虚'],
      '失眠':['阴虚','血虚'],'不寐':['阴虚','血虚'],
      '头痛':['气滞','血瘀'],'眩晕':['阴虚','肝郁'],
      '胃痛':['脾虚'],'胃胀':['气滞','脾虚'],
      '腹泻':['脾虚'],'便秘':['阴虚','血瘀'],
      '腰痛':['肾虚'],'痹证':['阳虚','血瘀'],
      '心脾两虚':['气虚','血虚'],'肝郁气滞':['肝郁','气滞'],
      '阴虚火旺':['阴虚'],'气血两虚':['气虚','血虚']
    };
    const DX_NORM = {'伤风':'感冒','不寐':'失眠','头疼':'头痛','胃疼':'胃痛'};
    
    // 聚合事件
    const events = [];
    for (const [src, arr] of Object.entries(sources)) {
      if (!Array.isArray(arr)) continue;
      for (const e of arr) {
        const eid = e.patient_id || e.patientId;
        if (eid !== patientId) continue;
        const ts = new Date(e.created_at || e.visit_date || e.time || 0).getTime();
        if (!ts || isNaN(ts)) continue;
        const herbs = (typeof e.herbs === 'string' ? e.herbs.split(/[,，、]/) : (e.herbs || [])).map(h => typeof h === 'string' ? h.trim() : (h.name || '').trim()).filter(Boolean);
        events.push({
          source: src, timestamp: ts, date: new Date(ts).toISOString().slice(0, 10),
          diagnosis: DX_NORM[(e.diagnosis || '').trim()] || (e.diagnosis || '').trim(),
          symptoms: e.chief_complaint || e.symptoms || '',
          herbs, effect: parseFloat(e.efficacy_score || e.effect || 0),
          constitution: e.constitution || ''
        });
      }
    }
    events.sort((a, b) => a.timestamp - b.timestamp);
    
    // 慢病轨迹
    const groups = {};
    for (const e of events) {
      if (!groups[e.diagnosis]) groups[e.diagnosis] = [];
      groups[e.diagnosis].push(e);
    }
    
    const trajectories = [];
    for (const [dx, eps] of Object.entries(groups)) {
      if (eps.length < 2 || !dx || dx === '未明确') continue;
      eps.sort((a, b) => a.timestamp - b.timestamp);
      const spanDays = (eps[eps.length-1].timestamp - eps[0].timestamp) / 86400000;
      const isChronic = spanDays >= 30;
      
      const herbFreq = {};
      for (const e of eps) for (const h of e.herbs) herbFreq[h] = (herbFreq[h] || 0) + 1;
      
      const effects = eps.filter(e => e.effect > 0).map(e => e.effect);
      const avgEffect = effects.length > 0 ? effects.reduce((s,e)=>s+e,0)/effects.length : 0;
      let trend = 'stable';
      if (effects.length >= 2) {
        const first = effects.slice(0, Math.ceil(effects.length/2)).reduce((s,e)=>s+e,0);
        const last = effects.slice(Math.floor(effects.length/2)).reduce((s,e)=>s+e,0);
        if (last > first * 1.2) trend = 'improving';
        else if (last < first * 0.8) trend = 'declining';
      }
      const best = eps.reduce((b, e) => e.effect > (b?.effect || 0) ? e : b, null);
      
      trajectories.push({
        diagnosis: dx, occurrences: eps.length, isChronic,
        spanDays: Math.round(spanDays),
        spanLabel: spanDays < 30 ? Math.round(spanDays) + ' 天' : (spanDays/30).toFixed(1) + ' 月',
        firstDate: eps[0].date, lastDate: eps[eps.length-1].date,
        avgEffect: Number(avgEffect.toFixed(2)), trend,
        herbFrequency: Object.entries(herbFreq).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([n,c])=>({name:n,count:c})),
        bestRegimen: best ? { herbs: best.herbs, effect: best.effect, date: best.date } : null
      });
    }
    trajectories.sort((a, b) => b.occurrences - a.occurrences);
    
    // 体质画像
    const counts = {};
    for (const e of events) {
      const cs = SYNDROME_TO_CONST[e.diagnosis] || [];
      for (const c of cs) counts[c] = (counts[c] || 0) + 1;
    }
    const total = Object.values(counts).reduce((s,n)=>s+n,0);
    const all = Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(([type,score])=>({
      type, score, percentage: total>0?Math.round(score/total*100):0, chronic: score >= 3
    }));
    
    // 向量
    const vec = new Array(50).fill(0);
    const diagCount = {};
    for (const e of events) diagCount[e.diagnosis] = (diagCount[e.diagnosis] || 0) + 1;
    const topDiag = Object.entries(diagCount).sort((a,b)=>b[1]-a[1]).slice(0,12);
    const maxDiag = Math.max(...topDiag.map(([_,n])=>n),1);
    topDiag.forEach(([_,n],i)=>{vec[i]=n/maxDiag;});
    
    return {
      patientId, timelineCount: events.length,
      timeSpan: events.length > 1 ? { from: events[0].date, to: events[events.length-1].date, days: Math.ceil((events[events.length-1].timestamp - events[0].timestamp)/86400000), label: trajectories[0]?.spanLabel || '—' } : null,
      timeline: events,
      trajectories,
      constitutionProfile: { top3: all.slice(0,3), chronicTypes: all.filter(c=>c.chronic).map(c=>c.type), all },
      summary: {
        chronicTrajectories: trajectories.filter(t=>t.isChronic).length,
        totalHerbsUsed: [...new Set(events.flatMap(e=>e.herbs))].length,
        totalDiagnoses: trajectories.length
      },
      vector: vec.map(v=>Number(v.toFixed(4)))
    };
  }
  
  function localExtractPatterns(profiles) {
    const buckets = {};
    for (const { patientId, profile } of profiles) {
      const top = profile.constitutionProfile.top3[0]?.type || 'unknown';
      for (const t of profile.trajectories || []) {
        const key = `${top}|${t.diagnosis}`;
        if (!buckets[key]) buckets[key] = { constitutionKey: top, diagnosis: t.diagnosis, patients: new Set(), totalOccurrences: 0, effects: [], herbEff: {} };
        const b = buckets[key];
        b.patients.add(patientId);
        b.totalOccurrences += t.occurrences;
        if (t.avgEffect > 0) b.effects.push(t.avgEffect);
        for (const h of (t.bestRegimen?.herbs || [])) {
          if (!b.herbEff[h]) b.herbEff[h] = { sum: 0, n: 0 };
          if (t.bestRegimen?.effect > 0) { b.herbEff[h].sum += t.bestRegimen.effect; b.herbEff[h].n += 1; }
        }
      }
    }
    
    const patterns = [];
    for (const [key, b] of Object.entries(buckets)) {
      if (b.patients.size < 2) continue;
      const avgEffect = b.effects.length > 0 ? b.effects.reduce((s,e)=>s+e,0)/b.effects.length : 0;
      const topHerbs = Object.entries(b.herbEff).filter(([_,v])=>v.n>=2).map(([n,v])=>({name:n,avgEffect:v.sum/v.n,usedIn:v.n})).sort((a,b)=>b.avgEffect-a.avgEffect).slice(0,6);
      const confidence = Math.min(b.patients.size/5, 1) * 0.5 + (avgEffect/5) * 0.4 + (topHerbs.length > 0 ? 0.1 : 0);
      if (confidence < 0.5) continue;
      patterns.push({
        key, constitutionKey: b.constitutionKey, diagnosis: b.diagnosis,
        patientCount: b.patients.size, totalOccurrences: b.totalOccurrences,
        avgEffect: Number(avgEffect.toFixed(2)), confidence: Number(confidence.toFixed(3)),
        topHerbs, kbEntry: { type: 'patient_pattern', diagnosis: b.diagnosis, constitution: b.constitutionKey, evidence_patients: b.patients.size, evidence_occurrences: b.totalOccurrences, avg_effect: avgEffect, top_herbs: topHerbs.map(h=>h.name), confidence, updated_at: new Date().toISOString() }
      });
    }
    return patterns.sort((a,b)=>b.confidence-a.confidence);
  }
  
  function localInjectPatterns(patterns) {
    const key = 'tcm_kb_patient_patterns';
    const exist = safeGet('tcm_kb_patient_patterns') || [];
    const existMap = new Map(exist.map(p => [p.key, p]));
    let added = 0, updated = 0;
    for (const p of patterns) {
      if (existMap.has(p.key)) {
        const old = existMap.get(p.key);
        old.evidence_patients = p.patientCount;
        old.evidence_occurrences = p.totalOccurrences;
        old.avg_effect = p.avgEffect;
        old.confidence = p.confidence;
        old.top_herbs = p.topHerbs.map(h => h.name);
        old.updated_at = new Date().toISOString();
        updated++;
      } else {
        exist.push(p.kbEntry);
        existMap.set(p.key, p.kbEntry);
        added++;
      }
    }
    localStorage.setItem('tcm_kb_patient_patterns', JSON.stringify(exist));
    return { added, updated, total: exist.length };
  }
  
  function localRecommend(vector, pool) {
    const minConf = 0.5;
    function cosine(a, b) {
      let dot=0,na=0,nb=0;
      for (let i=0;i<a.length;i++) { dot+=a[i]*b[i]; na+=a[i]*a[i]; nb+=b[i]*b[i]; }
      return dot/(Math.sqrt(na)*Math.sqrt(nb)+1e-10);
    }
    function buildPV(p) {
      const v = new Array(50).fill(0);
      const cs = ['气虚','血虚','阴虚','阳虚','气滞','血瘀','痰湿','湿热'];
      const c = p.constitutionKey.split('+');
      for (let i=0;i<cs.length;i++) if (c.includes(cs[i])) v[36+i]=0.5;
      v[44]=(p.avgEffect||0)/5; v[46]=0.3; v[48]=1;
      return v;
    }
    
    return pool.filter(p => p.confidence >= minConf).map(p => ({
      pattern: p, similarity: cosine(vector, buildPV(p))
    })).sort((a,b) => b.similarity - a.similarity).slice(0, 5).map(({pattern, similarity}) => ({
      diagnosis: pattern.diagnosis, constitution: pattern.constitutionKey,
      evidence_patients: pattern.patientCount, avgEffect: pattern.avgEffect,
      confidence: pattern.confidence, similarity: Number(similarity.toFixed(3)),
      topHerbs: pattern.topHerbs.map(h => h.name),
      rationale: `与 ${pattern.patientCount} 位相似患者匹配（相似度 ${(similarity*100).toFixed(0)}%），循证平均疗效 ${pattern.avgEffect}/5`
    }));
  }
  
  function esc(s) {
    return String(s || '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }
  function setText(id, v) { const el = document.getElementById(id); if (el) el.textContent = v; }
  
  // 初始化
  document.addEventListener('DOMContentLoaded', renderPatientList);
})();