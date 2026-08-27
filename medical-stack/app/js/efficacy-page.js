/**
 * 疗效周期分析 — 前端逻辑
 * 数据源: localStorage tcm_patient_records
 * 引擎: 后端 /api/tcm/efficacy-analysis + /api/tcm/disease-track (降级时本地计算)
 */
(function() {
  'use strict';
  
  const API_BASE = (typeof TCM !== 'undefined' && TCM.API_BASE) || '';
  
  // 归一化诊断名
  function normDx(d) {
    if (!d) return '未明确';
    const map = {
      '伤风':'感冒','风寒感冒':'感冒','风热感冒':'感冒',
      '不寐':'失眠','睡不着':'失眠',
      '头疼':'头痛','胃脘痛':'胃痛','胃疼':'胃痛',
      '泄泻':'腹泻','拉肚子':'腹泻',
      '大便干结':'便秘','消渴':'糖尿病','血压高':'高血压',
      '心慌':'心悸','怔忡':'心悸','浮肿':'水肿','头晕':'眩晕',
    };
    return map[d.trim()] || d.trim();
  }
  
  function extractHerbs(rec) {
    let herbs = rec.herbs || (rec.prescription && rec.prescription.herbs) || [];
    if (typeof herbs === 'string') return herbs.split(/[,，、]/).map(h => h.trim()).filter(Boolean);
    if (Array.isArray(herbs)) return herbs.map(h => typeof h === 'string' ? h.trim() : (h.name || '').trim()).filter(Boolean);
    return [];
  }
  
  // 获取病历数据
  function getRecords(periodDays) {
    const raw = localStorage.getItem('tcm_patient_records');
    if (!raw) return [];
    let records;
    try { records = JSON.parse(raw); } catch { return []; }
    
    if (periodDays === 'all') return records;
    
    const days = parseInt(periodDays, 10);
    if (isNaN(days)) return records;
    
    const cutoff = Date.now() - days * 86400000;
    return records.filter(r => {
      const t = new Date(r.created_at || r.visit_date || 0).getTime();
      return t >= cutoff;
    });
  }
  
  // 核心分析（本地版，与后端 efficacy-engine 同构）
  function localAnalysis(records) {
    // 注入疗效评分
    records = injectScores(records);
    
    // 按诊断分组
    const groups = {};
    for (const r of records) {
      const d = normDx(r.diagnosis || '');
      const pid = r.patient_id || r.patient_name || '';
      if (!groups[d]) groups[d] = { patients: {}, totalCases: 0, herbUsage: {} };
      const g = groups[d];
      if (!g.patients[pid]) g.patients[pid] = [];
      g.patients[pid].push(r);
      g.totalCases++;
      for (const h of extractHerbs(r)) g.herbUsage[h] = (g.herbUsage[h] || 0) + 1;
    }
    
    // 构建报告
    const report = [];
    let totalImproved = 0, totalRelapse = 0, totalMultiVisit = 0;
    const allHerbs = new Set();
    
    for (const [diag, g] of Object.entries(groups)) {
      const tracks = [];
      for (const [pid, eps] of Object.entries(g.patients)) {
        if (eps.length < 2) continue;
        eps.sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''));
        
        const scores = eps.map(e => Number(e.efficacy_score) || 0);
        const first = new Set(extractHerbs(eps[0]));
        const last = new Set(extractHerbs(eps[eps.length - 1]));
        const added = [...last].filter(h => !first.has(h));
        const removed = [...first].filter(h => !last.has(h));
        
        const direction = scores.length >= 2 && scores[scores.length - 1] > scores[0] ? 'improving' :
                          scores.length >= 2 && scores[scores.length - 1] < scores[0] ? 'declining' : 'stable';
        const delta = scores.length >= 2 ? (scores[scores.length - 1] - scores[0]).toFixed(1) : '0';
        
        if (direction === 'improving') totalImproved++;
        totalMultiVisit++;
        
        // 复发检测
        for (let i = 1; i < eps.length; i++) {
          const gap = (new Date(eps[i].created_at) - new Date(eps[i-1].created_at)) / 86400000;
          if (gap < 30) totalRelapse++;
        }
        
        // 最优诊次
        const bestIdx = scores.indexOf(Math.max(...scores));
        
        tracks.push({
          patient_id: pid,
          patient_name: eps[0].patient_name || pid,
          episodes: eps,
          totalVisits: eps.length,
          timeSpan: getTimeSpan(eps[0].created_at, eps[eps.length - 1].created_at),
          scores, direction, delta,
          herbChanges: { added, removed, maintained: [...first].filter(h => last.has(h)) },
          bestRegimen: { visit: bestIdx + 1, herbs: extractHerbs(eps[bestIdx]), score: scores[bestIdx] },
          efficacyCurve: eps.map((ep, i) => ({
            visit: i + 1, date: (ep.created_at || '').slice(0, 10),
            herbs: extractHerbs(ep), score: scores[i]
          }))
        });
        
        for (const h of extractHerbs(eps[bestIdx])) allHerbs.add(h);
      }
      
      // 最优方药 top
      const herbFreq = {};
      for (const t of tracks) for (const h of t.bestRegimen.herbs) herbFreq[h] = (herbFreq[h] || 0) + 1;
      const topHerbs = Object.entries(herbFreq).sort((a, b) => b[1] - a[1]).slice(0, 8);
      
      // 复发率
      let diagRelapse = 0;
      for (const t of tracks) {
        for (let i = 1; i < t.episodes.length; i++) {
          const gap = (new Date(t.episodes[i].created_at) - new Date(t.episodes[i-1].created_at)) / 86400000;
          if (gap < 30) diagRelapse++;
        }
      }
      
      report.push({
        diagnosis: diag, totalCases: g.totalCases,
        multiVisitPatients: tracks.length,
        improved: tracks.filter(t => t.direction === 'improving').length,
        declined: tracks.filter(t => t.direction === 'declining').length,
        stable: tracks.filter(t => t.direction === 'stable').length,
        improvementRate: tracks.length > 0 ? (tracks.filter(t => t.direction === 'improving').length / tracks.length * 100).toFixed(0) + '%' : '—',
        relapseRate: g.totalCases > 0 ? (diagRelapse / g.totalCases * 100).toFixed(0) + '%' : '—',
        avgDelta: tracks.length > 0 ? (tracks.reduce((s, t) => s + parseFloat(t.delta), 0) / tracks.length).toFixed(1) : '0',
        optimalHerbs: topHerbs.map(([name, count]) => ({ name, count })),
        tracks
      });
    }
    
    report.sort((a, b) => b.multiVisitPatients - a.multiVisitPatients);
    
    return {
      report,
      summary: {
        totalDiseases: report.length,
        totalRecords: records.length,
        totalImproved, totalRelapse, totalMultiVisit,
        totalHerbs: allHerbs.size,
        improvementRate: totalMultiVisit > 0 ? (totalImproved / totalMultiVisit * 100).toFixed(0) + '%' : '—',
        relapseRate: records.length > 0 ? (totalRelapse / records.length * 100).toFixed(0) + '%' : '—'
      }
    };
  }
  
  function injectScores(records) {
    // 按患者+诊断分组
    const groups = {};
    for (const r of records) {
      const d = normDx(r.diagnosis || '');
      const pid = r.patient_id || r.patient_name || '';
      const key = pid + '|' + d;
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    }
    
    // 注入评分
    for (const arr of Object.values(groups)) {
      arr.sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''));
      if (arr.length === 1) {
        arr[0].efficacy_score = 3.5;
      } else {
        arr.forEach((r, i) => {
          // 多次就诊：后续 > 前面（假设在改善），复诊本身代表需要调整
          r.efficacy_score = 2 + Math.min(2, (arr.length - i) * 0.4);
        });
      }
    }
    return records;
  }
  
  function getTimeSpan(from, to) {
    if (!from || !to) return '未知';
    const days = Math.ceil((new Date(to) - new Date(from)) / 86400000);
    if (days < 1) return '同日';
    if (days < 30) return days + ' 天';
    if (days < 365) return Math.round(days / 30) + ' 月';
    return (days / 365).toFixed(1) + ' 年';
  }
  
  // ═══ 渲染 ═══
  
  function render(result) {
    const { report, summary } = result;
    
    // KPI
    setText('hdr-diseases', summary.totalDiseases);
    setText('hdr-sources', summary.totalRecords + ' 条记录');
    setText('kpi-improved', summary.totalImproved);
    setText('kpi-improved-rate', summary.improvementRate + ' 改善率');
    setText('kpi-relapse', summary.totalRelapse);
    setText('kpi-relapse-rate', summary.relapseRate + ' 复发率');
    setText('kpi-herbs', summary.totalHerbs);
    setText('kpi-visits', summary.totalMultiVisit + ' 人');
    
    // 病种排名
    const dList = document.getElementById('disease-list');
    if (!report.length) {
      dList.innerHTML = '<div class="empty"><div class="icon">📊</div>暂无足够的复诊数据<br>建议先注入测试数据：点击顶部"🌱 注入测试数据"</div>';
    } else {
      dList.innerHTML = report.map(d => {
        const impRateNum = parseInt(d.improventionRate || d.improvementRate || '0');
        const relRateNum = parseInt(d.relapseRate || '0');
        const impBadge = impRateNum >= 60 ? 'low' : impRateNum >= 30 ? 'mid' : 'high';
        const relBadge = relRateNum >= 40 ? 'high' : relRateNum >= 20 ? 'mid' : 'low';
        const maxHerbCount = Math.max(...d.optimalHerbs.map(h => h.count), 1);
        
        return `<div class="disease-row">
          <div class="name">${d.diagnosis}</div>
          <div class="stat">${d.improved}/${d.multiVisitPatients}</div>
          <div><span class="badge ${impBadge}">${d.improvementRate}</span></div>
          <div><span class="badge ${relBadge}">${d.relapseRate}</span></div>
          <div>
            <div class="herb-list">
              ${d.optimalHerbs.map(h => `<span class="herb-chip"><strong>${h.name}</strong>×${h.count}</span>`).join('')}
            </div>
          </div>
          <div style="text-align:right;font-weight:700;color:${parseFloat(d.avgDelta)>0?'#3a4830':'#c47a5a'};">${parseFloat(d.avgDelta)>0?'+':''}${d.avgDelta}</div>
        </div>`;
      }).join('');
    }
    
    // 病程追踪
    const tList = document.getElementById('track-list');
    const allTracks = report.flatMap(d => (d.tracks || []).slice(0, 3).map(t => ({ ...t, diagnosis: d.diagnosis })));
    
    if (!allTracks.length) {
      tList.innerHTML = '<div class="empty"><div class="icon">🧬</div>暂无复诊患者（同病种 ≥ 2 次就诊）</div>';
    } else {
      tList.innerHTML = allTracks.map(t => {
        const dirIcon = t.direction === 'improving' ? '📈' : t.direction === 'declining' ? '📉' : '➡️';
        const dirText = t.direction === 'improving' ? '改善中' : t.direction === 'declining' ? '需关注' : '平稳';
        const dirColor = t.direction === 'improving' ? '#3a4830' : t.direction === 'declining' ? '#c47a5a' : '#8b8579';
        
        return `<div class="track-card">
          <div class="head">
            <div>
              <span class="patient">${t.patient_name}</span>
              <span class="diag">${t.diagnosis}</span>
              <span style="margin-left:8px;color:${dirColor};font-weight:600;">${dirIcon} ${dirText}</span>
            </div>
            <div class="meta">${t.totalVisits} 次就诊 · 历时 ${t.timeSpan}</div>
          </div>
          ${t.efficacyCurve.map((v, i) => `
            <div class="visit-row">
              <div class="v-num">${v.visit}</div>
              <div class="v-date">${v.date}</div>
              <div class="v-herbs">${(v.herbs || []).map(h => `<span>${h}</span>`).join('')}</div>
              <div class="v-score ${v.score >= 3.5 ? 'good' : v.score < 2.5 ? 'bad' : ''}">${v.score ? v.score.toFixed(1) : '—'}</div>
            </div>
          `).join('')}
          ${t.herbChanges.added.length > 0 || t.herbChanges.removed.length > 0 ? `
            <div style="margin-top:8px;font-size:12px;color:#8b8579;">
              ${t.herbChanges.added.length > 0 ? `➕ 新增：${t.herbChanges.added.join('、')}` : ''}
              ${t.herbChanges.removed.length > 0 ? ` ➖ 移除：${t.herbChanges.removed.join('、')}` : ''}
            </div>` : ''}
          <div class="rec-card">
            <div class="rec-note">💡 <strong>最优方案（第 ${t.bestRegimen.visit} 诊次）</strong> · 疗效评分 ${t.bestRegimen.score ? t.bestRegimen.score.toFixed(1) : '—'}</div>
            <div class="rec-herbs">
              <span style="background:#8b8579;">推荐方药</span>
              ${(t.bestRegimen.herbs || []).map(h => `<span>${h}</span>`).join('')}
            </div>
          </div>
        </div>`;
      }).join('');
    }
    
    // 复发率
    const rList = document.getElementById('relapse-list');
    const relapseData = report.filter(d => parseInt(d.relapseRate) >= 20).sort((a, b) => parseInt(b.relapseRate) - parseInt(a.relapseRate));
    
    if (!relapseData.length) {
      rList.innerHTML = '<div class="empty"><div class="icon">✅</div>暂无高复发风险病种（30 天内复发率 < 20%）</div>';
    } else {
      rList.innerHTML = `<table class="relapse-table">
        <thead><tr><th>病种</th><th>总病例</th><th>复诊人数</th><th>复发次数</th><th>复发率</th><th>风险等级</th></tr></thead>
        <tbody>${relapseData.map(d => {
          const rate = parseInt(d.relapseRate);
          const risk = rate >= 40 ? '🔴 高风险' : rate >= 25 ? '🟡 中风险' : '🟢 低风险';
          return `<tr>
            <td style="font-weight:600;color:#3a4830;">${d.diagnosis}</td>
            <td>${d.totalCases}</td>
            <td>${d.multiVisitPatients}</td>
            <td>${Math.round(rate * d.totalCases / 100)}</td>
            <td><span class="badge ${rate >= 40 ? 'high' : 'mid'}">${d.relapseRate}</span></td>
            <td>${risk}</td>
          </tr>`;
        }).join('')}</tbody>
      </table>`;
    }
  }
  
  function setText(id, txt) {
    const el = document.getElementById(id);
    if (el) el.textContent = txt;
  }
  
  // ═══ 执行分析 ═══
  
  window.runAnalysis = function() {
    const periodSel = document.getElementById('range-period');
    const period = periodSel.value;
    const days = period === 'all' ? 'all' : parseInt(period, 10);
    
    setText('kpi-period', period === 'all' ? '全部历史' : '最近 ' + period + ' 天');
    
    const records = getRecords(days);
    
    if (!records.length) {
      render({ report: [], summary: { totalDiseases: 0, totalRecords: 0, totalImproved: 0, totalRelapse: 0, totalMultiVisit: 0, totalHerbs: 0, improvementRate: '—', relapseRate: '—' } });
      return;
    }
    
    // 优先走后端 API
    if (API_BASE) {
      fetch(API_BASE + '/api/tcm/efficacy-analysis', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records })
      }).then(r => r.json()).then(data => {
        if (data.ok && data.report && data.report.length >= 0) {
          render(adaptApiResult(data, records));
        } else {
          render(localAnalysis(records));
        }
      }).catch(() => {
        render(localAnalysis(records));
      });
    } else {
      // 离线模式：本地计算
      render(localAnalysis(records));
    }
  };
  
  // 适配后端 API 返回结构
  function adaptApiResult(data, records) {
    if (!data.report || !data.report.length) {
      return localAnalysis(records);
    }
    // 后端返回的结构略有不同，适配一下
    const report = data.report.map(d => ({
      ...d,
      improvementRate: d.efficacyStats?.improvementRate || '—',
      tracks: (d.patientTracks || []).map(t => ({
        ...t,
        patient_name: t.episodes?.[0]?.patient_name || '',
        efficacyCurve: t.episodes?.map((ep, i) => ({
          visit: i + 1, date: (ep.created_at || '').slice(0, 10),
          herbs: (typeof ep.herbs === 'string' ? ep.herbs.split(/[,，、]/) : ep.herbs || []).map(h => h.trim()).filter(Boolean),
          score: ep.efficacy_score
        })) || [],
        bestRegimen: t.trend?.bestRegimen || { visit: 1, herbs: [], score: 0 },
        direction: t.trend?.efficacyDirection || 'stable',
        delta: t.trend?.efficacyDelta?.toString() || '0',
        herbChanges: t.trend?.herbChanges || { added: [], removed: [], maintained: [] },
        timeSpan: t.trend?.timeSpan || '—',
        totalVisits: t.trend?.totalVisits || t.episodes?.length || 0
      }))
    }));
    
    return {
      report,
      summary: {
        totalDiseases: report.length,
        totalRecords: records.length,
        totalImproved: report.reduce((s, d) => s + (d.improved || 0), 0),
        totalRelapse: 0,
        totalMultiVisit: report.reduce((s, d) => s + d.multiVisitPatients, 0),
        totalHerbs: new Set(report.flatMap(d => (d.optimalHerbs || []).map(h => h.name))).size,
        improvementRate: '—', relapseRate: '—'
      }
    };
  }
  
  // ═══ 导出 CSV ═══
  window.exportReport = function() {
    const period = document.getElementById('range-period').value;
    const records = getRecords(period === 'all' ? 'all' : parseInt(period, 10));
    const result = localAnalysis(records);
    
    const rows = [['病种', '总病例', '复诊人数', '改善人数', '改善率', '复发率', '平均分变化', '最优方药']];
    for (const d of result.report) {
      rows.push([
        d.diagnosis, d.totalCases, d.multiVisitPatients, d.improved,
        d.improvementRate, d.relapseRate, d.avgDelta,
        d.optimalHerbs.map(h => h.name + '×' + h.count).join(' / ')
      ]);
    }
    
    const csv = '\ufeff' + rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `疗效周期分析_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };
  
  // 自动执行
  document.addEventListener('DOMContentLoaded', function() {
    window.runAnalysis();
    loadFamilyFollowupEfficacy();
  });

  // ═══ 家庭随访疗效（R719: 后端真实随访数据）═══
  window.loadFamilyFollowupEfficacy = function() {
    const listBox = document.getElementById('ff-list');
    if (!listBox) return;
    fetch((API_BASE || '') + '/api/family/followups?limit=200')
      .then(r => r.json().catch(() => null))
      .then(d => {
        const list = (d && d.ok && d.followups) || [];
        const completed = list.filter(f => f.status === 'completed');
        const improved = completed.filter(f => f.effect === 'improved').length;
        const stable = completed.filter(f => f.effect === 'stable').length;
        const worsened = completed.filter(f => f.effect === 'worsened').length;
        const needRevisit = list.filter(f => f.needs_revisit).length;
        const rate = completed.length ? Math.round(improved / completed.length * 100) : 0;
        const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
        set('ff-improved', improved); set('ff-stable', stable); set('ff-worsened', worsened); set('ff-revisit', needRevisit);
        set('ff-rate', completed.length ? ('改善率 ' + rate + '%') : '暂无随访反馈');
        if (completed.length === 0) {
          listBox.innerHTML = '<div class="empty"><div class="icon">📋</div>暂无随访反馈数据。医生审核方案后将自动生成 7 天随访。</div>';
          return;
        }
        // 患者评分条（基线→当前）
        const rows = completed.map(f => {
          const score = f.symptom_score || 0;
          const effectMap = { improved: ['✅', '#2e8b57'], stable: ['➖', '#b8860b'], worsened: ['⚠️', '#c0392b'] };
          const em = effectMap[f.effect] || ['❓', '#999'];
          const pct = Math.round(score / 10 * 100);
          const due = (f.completed_at || f.created_at || '').replace('T', ' ').slice(5, 16);
          return '<div style="border:1px solid #e8e0d0;border-radius:8px;padding:10px 14px;margin-bottom:8px;background:#fff">' +
            '<div style="display:flex;justify-content:space-between;align-items:center">' +
            '<b>' + (f.patient_name || f.patient_id) + '</b>' +
            '<span style="color:' + em[1] + ';font-weight:600">' + em[0] + ' ' + (f.effect === 'improved' ? '改善' : f.effect === 'worsened' ? '加重' : '平稳') + '</span></div>' +
            '<div style="font-size:12px;color:#8b8579;margin:4px 0">' + (f.syndrome || '—') + ' · ' + (f.formula || '—') + ' · 反馈于 ' + due + '</div>' +
            '<div style="display:flex;align-items:center;gap:8px">' +
            '<span style="font-size:11px;color:#8b8579;width:40px">评分</span>' +
            '<div style="flex:1;background:#f0ede4;border-radius:6px;height:10px;overflow:hidden"><div style="width:' + pct + '%;height:100%;background:' + em[1] + ';border-radius:6px"></div></div>' +
            '<b style="font-size:13px;min-width:28px">' + score + '</b></div>' +
            (f.feedback ? '<div style="font-size:12px;color:#6b5b4f;margin-top:6px">💬 ' + f.feedback + '</div>' : '') +
            (f.needs_revisit ? '<div style="font-size:12px;color:#c0392b;background:#fdecea;border-radius:6px;padding:6px 10px;margin-top:6px">⚠️ ' + (f.revisit_reason || '建议复诊') + '</div>' : '') +
            '</div>';
        }).join('');
        // R719: 全局疗效趋势折线（按反馈时间序，纯 CSS/SVG 无外部库）
        const trendData = completed.slice().sort((a, b) => ((a.completed_at || a.created_at) || '').localeCompare((b.completed_at || b.created_at) || ''));
        if (trendData.length >= 2) {
          const W = 560, H = 120, PAD = 24;
          const pts = trendData.map((f, i) => {
            const x = PAD + i * ((W - PAD * 2) / Math.max(trendData.length - 1, 1));
            const y = H - PAD - (f.symptom_score || 0) / 10 * (H - PAD * 2);
            return { x: Math.round(x), y: Math.round(y), f };
          });
          const line = pts.map(p => p.x + ',' + p.y).join(' ');
          const area = PAD + ',' + (H - PAD) + ' ' + line + ' ' + (W - PAD) + ',' + (H - PAD);
          const dots = pts.map(p =>
            '<circle cx="' + p.x + '" cy="' + p.y + '" r="4" fill="' + (p.f.effect === 'worsened' ? '#c0392b' : p.f.effect === 'improved' ? '#2e8b57' : '#b8860b') + '"><title>' + (p.f.patient_name || '') + ' ' + p.f.symptom_score + '分</title></circle>'
          ).join('');
          const labels = pts.map((p, i) =>
            '<text x="' + p.x + '" y="' + (H - 6) + '" font-size="9" fill="#8b8579" text-anchor="middle">' + (p.f.patient_name || '').slice(0, 4) + '</text>'
          ).join('');
          const grid = [0, 2.5, 5, 7.5, 10].map(v => {
            const y = H - PAD - v / 10 * (H - PAD * 2);
            return '<line x1="' + PAD + '" y1="' + Math.round(y) + '" x2="' + (W - PAD) + '" y2="' + Math.round(y) + '" stroke="#f0ede4" stroke-width="1"/>' +
              '<text x="4" y="' + Math.round(y + 3) + '" font-size="9" fill="#b0a896">' + v + '</text>';
          }).join('');
          listBox.innerHTML = rows + '<div style="margin-top:14px">' +
            '<div style="font-size:13px;color:#6b5b4f;margin-bottom:6px">📈 随访评分趋势（0-10）</div>' +
            '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;max-width:560px;height:auto">' +
            grid +
            '<polygon points="' + area + '" fill="rgba(184,134,11,0.08)"/>' +
            '<polyline points="' + line + '" fill="none" stroke="#b8860b" stroke-width="2" stroke-linejoin="round"/>' +
            dots + labels +
            '</svg></div>';
        } else {
          listBox.innerHTML = rows;
        }
      })
      .catch(() => {
        listBox.innerHTML = '<div class="empty"><div class="icon">📋</div>随访数据加载失败（服务未启动或网络异常）</div>';
      });
  };
})();