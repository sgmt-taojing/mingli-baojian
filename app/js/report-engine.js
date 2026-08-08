/* eslint-disable */
/**
 * 命理宝鉴 · 统一报告引擎 (report-engine.js)
 *
 * 设计原则：
 *  1. KB 优先双路径（命中分 ≥ 0.7 直答；0.4-0.7 KB+AI 润色；< 0.4 AI+KB 兜底）
 *  2. 三大模块断网兜底（music/lifeindex/lifeplan → _MODULE_REPORTS）
 *  3. 三模块后端结构化增强（lifeplan/lifeindex/music → /api/ai/*-report）
 *  4. 渲染层完全解耦 — 调用方传入 renderAdapter('chatBubble'|'drawer'|'inline'|'wechat')
 *  5. 操作按钮（保存/复制/复制 MD/👍/👎）与图谱智能推荐 — 引擎自动附加
 *
 * 用法：
 *   await ReportEngine.generate({
 *     module: 'bazi',
 *     data: { ... 问卷收集的数据 ... },
 *     hist: [], // 历史对话（可选）
 *     apiBase: 'http://127.0.0.1:8920',
 *     adapter: 'chatBubble', // 渲染目标
 *     container: chatEl,    // 渲染容器
 *     hooks: {
 *       onReportStart: () => {},
 *       onTyping: () => {},
 *       onReportEnd: (text, meta) => {}
 *     }
 *   });
 *
 * 依赖：
 *   - window._MODULE_REPORTS（来自 module-reports-kb.js，可选）
 *   - window._kbScore / _kbQueryFallback（来自前端 KB 检测，可选）
 *   - window.recordKbHit（来自 kb-hit-counter.js，可选）
 *   - window.TodoBus（可选，自动提取 TODO）
 *   - window.esc（HTML 转义工具）
 */

(function (global) {
  'use strict';

  const DEFAULT_API = (location.hostname === '127.0.0.1' || location.hostname === 'localhost')
    ? 'http://127.0.0.1:8920' : '';

  /**
   * 工具：HTML 转义
   */
  function escHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * 工具：行级打分（如 ≥85 ✅ / ≥75 🟢 / ≥60 🟡 / <60 🔴）
   */
  function scoreMark(score) {
    if (score >= 85) return '✅';
    if (score >= 75) return '🟢';
    if (score >= 60) return '🟡';
    return '🔴';
  }

  /**
   * 工具：从对象扁平化为用户输入文本（用于 KB 关键词提取）
   */
  function flattenData(data) {
    if (!data || typeof data !== 'object') return '';
    return Object.values(data).filter(v => v != null).map(v => String(v)).join(' ');
  }

  /**
   * 工具：JieqiEngine 节气增强 — 从排盘数据中提取节气信息
   * 如果 JieqiEngine 可用且排盘数据包含日期，补充精确节气边界
   */
  function jieqiEnhance(data) {
    if (typeof global.JieqiEngine === 'undefined' || !data) return '';
    try {
      var y = parseInt(data.year || data.birthYear, 10);
      var m = parseInt(data.month || data.birthMonth, 10);
      var d = parseInt(data.day || data.birthDay, 10);
      var h = parseInt(data.hour || data.birthHour, 10);
      if (!y || !m || !d) return '';
      var r = global.JieqiEngine.getFourPillars(y, m, d, h || 12);
      var parts = [];
      parts.push('节气: ' + r.jieqi);
      if (r.monthJie) parts.push('月支节: ' + r.monthJie);
      parts.push('年柱: ' + r.yearGZ + ' / 月柱: ' + r.monthGZ + ' / 日柱: ' + r.dayGZ + ' / 时柱: ' + r.hourGZ);
      parts.push('日主: ' + r.dayGan);
      if (r.nayin) parts.push('纳音: ' + r.nayin);
      
      // 日主强弱判断 → 精确口诀推送关键词
      var dayGan = r.dayGan;
      var dayElement = '';
      if ('甲乙'.indexOf(dayGan) >= 0) dayElement = '木';
      else if ('丙丁'.indexOf(dayGan) >= 0) dayElement = '火';
      else if ('戊己'.indexOf(dayGan) >= 0) dayElement = '土';
      else if ('庚辛'.indexOf(dayGan) >= 0) dayElement = '金';
      else if ('壬癸'.indexOf(dayGan) >= 0) dayElement = '水';
      
      // 月支生克判断日主强弱（简化版）
      var monthZhi = r.monthZhi || r.monthGZ.charAt(1);
      var strongWeak = '';
      var shengMei = {'木':['亥子'],'火':['寅卯'],'土':['巳午'],'金':['辰戌丑未申酉'],'水':['申酉金']}[dayElement] || [];
      var keMei = {'木':['申酉'],'火':['亥子'],'土':['寅卯'],'金':['巳午'],'水':['辰戌丑未']}[dayElement] || [];
      if (shengMei.some(function(z){return monthZhi.indexOf(z) >= 0;})) {
        strongWeak = '偏强';
      } else if (keMei.some(function(z){return monthZhi.indexOf(z) >= 0;})) {
        strongWeak = '偏弱';
      } else {
        strongWeak = '中和';
      }
      
      if (dayElement && strongWeak !== '中和') {
        parts.push('日主强弱推断: ' + dayGan + dayElement + strongWeak);
        parts.push('口诀推送关键词: 日主' + dayGan + dayElement + strongWeak);
      }
      
      return '\n【天文节气引擎（紫金山天文台历表）】\n' + parts.join('\n') + '\n';
    } catch (e) { return ''; }
  }

  /**
   * 步骤 0：模块 KB 兜底（断网可用）
   * 返回 { html, used: true/false }
   */
  function tryModuleReportsFallback(moduleId, data) {
    try {
      const MR = global._MODULE_REPORTS;
      if (!MR || !MR[moduleId]) return { used: false };
      const mr = MR[moduleId];
      const rep = mr.diagnose(data);
      if (!rep) return { used: false };

      let html = '【模块KB兜底 · ' + mr.name + '】\n\n';

      if (rep.ttsText) html += '🔊 朗读：' + rep.ttsText + '\n\n';
      if (rep.total !== undefined) html += '综合指数：' + rep.total + ' 分\n\n';
      if (rep.element) html += '主导五行：' + rep.element + ' 行\n';
      if (rep.summary) html += '📊 ' + rep.summary + '\n\n';

      if (rep.fiveElement) {
        html += '推荐五行：' + rep.fiveElement + '\n';
        if (rep.recommend) html += '特质：' + rep.recommend.feel + '\n\n';
      }

      if (Array.isArray(rep.dimensions)) {
        html += '【十维度评分卡】\n';
        rep.dimensions.forEach(d => {
          const mark = scoreMark(d.score);
          html += '  ' + mark + ' ' + (d.icon || '•') + ' ' + d.name + '：' + d.score + ' 分（' + (d.status || '') + '）· ' + (d.focus || '') + '\n';
        });
        html += '\n';
      }

      if (Array.isArray(rep.next5Years)) {
        html += '【未来 5 年节奏建议】\n';
        rep.next5Years.forEach((y, i) => html += '  第' + (i + 1) + '年：' + y.text + '\n');
        html += '\n';
      }

      if (Array.isArray(rep.actions)) {
        html += '【十条行动清单】\n';
        rep.actions.slice(0, 10).forEach((s, i) => html += '  ' + (i + 1) + '.' + s + '\n');
        html += '\n';
      }

      if (rep.stage) {
        html += '人生阶段：' + rep.stage.name + '（' + rep.stage.range + '）\n';
        html += '重点：' + (rep.stage.focus || []).join('、') + '\n\n';
      }

      if (rep.stageTemplate) {
        html += '【本阶段 12 领域细化 48 子项】\n';
        Object.entries(rep.stageTemplate).forEach(([k, v]) => {
          const dom = rep.domains && rep.domains.find(d => d.key === k);
          html += '  · ' + (dom ? dom.icon : '•') + ' ' + (dom ? dom.name : k) + '：' + v + '\n';
        });
        html += '\n';
      }

      if (Array.isArray(rep.domainScores)) {
        html += '【十二领域评分卡】\n';
        rep.domainScores.forEach(d => {
          const mark = scoreMark(d.score);
          html += '  ' + mark + ' ' + d.icon + ' ' + d.name + '：' + d.score + ' 分（' + d.status + '）\n';
        });
        html += '\n';
      }

      if (Array.isArray(rep.timeline)) {
        html += '人生时间轴：\n';
        rep.timeline.forEach(t => html += '  ' + t.age + '岁：' + t.text + '\n');
        html += '\n';
      }

      if (rep.sixDims) {
        html += '【六维度评分卡】\n';
        Object.entries(rep.sixDims).forEach(([k, v]) => {
          const mark = scoreMark(v);
          html += '  ' + mark + ' ' + k + '：' + v + ' 分\n';
        });
        html += '\n';
      }

      if (Array.isArray(rep.nextSteps)) {
        html += '【十条行动清单】\n';
        rep.nextSteps.forEach((s, i) => html += '  ' + (i + 1) + '.' + s + '\n');
        html += '\n';
      }

      if (Array.isArray(rep.playList)) {
        html += '🎵 推荐播放列表：\n';
        rep.playList.forEach((p, i) => html += '  ' + (i + 1) + '. ' + p.name + '（' + p.duration + ' 秒）' + (p.ttsText ? ' \n     ↳ ' + p.ttsText : '') + '\n');
        html += '\n';
      }

      if (rep.intro) html += '📝 ' + rep.intro + '\n\n';
      if (rep.cycleText) html += rep.cycleText + '\n\n';
      if (rep.compatible) html += rep.compatible + '\n\n';

      return { used: true, html };
    } catch (e) {
      if (global.console && console.warn) console.warn('[ReportEngine] _MODULE_REPORTS 失败', e);
      return { used: false };
    }
  }

  /**
   * 步骤 1：KB 命中检测（优先本地 _kbScore，否则服务端 /api/public/kb-query fallback）
   */
  async function kbScore(moduleId, data, apiBase) {
    let kbHit = null;
    try {
      if (typeof global._kbScore === 'function') {
        kbHit = global._kbScore(moduleId, data);
      }
    } catch (e) {
      if (global.console && console.warn) console.warn('[ReportEngine] _kbScore 失败', e);
    }

    if (!kbHit) {
      kbHit = { score: 0, snippet: '', source: '', entryId: '', engine: 'none', fallback: false };
    }

    if (kbHit.fallback && typeof global._kbQueryFallback === 'function') {
      try {
        kbHit = await global._kbQueryFallback(kbHit);
      } catch (e) {
        if (global.console && console.warn) console.warn('[ReportEngine] _kbQueryFallback 失败', e);
      }
    }

    // 服务端 FTS5 fallback（当本地无 _kbScore 或本地 score=0）
    if (!kbHit.score && apiBase) {
      try {
        const r = await fetch(apiBase + '/api/public/kb-query', { signal: AbortSignal.timeout(15000), method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ module: moduleId, query: flattenData(data).substring(0, 200), limit: 1 }), signal:AbortSignal.timeout(15000)});
        const j = await r.json();
        if (j && j.data && j.data.results && j.data.results.length) {
          const top = j.data.results[0];
          kbHit = {
            score: Math.min(top.score || 0.5, 0.7),
            snippet: top.snippet || top.content || '',
            source: top.source || 'server-fts5',
            entryId: top.id || top.entryId || '',
            engine: 'fts5',
            fallback: true
          };
        }
      } catch (e) {
        if (global.console && console.warn) console.warn('[ReportEngine] 服务端 kb-query 失败', e);
      }
    }

    return kbHit;
  }

  /**
   * 步骤 2：后端 AI 润色
   */
  async function callBackendAI({ apiBase, moduleId, data, hist, promptExtra }) {
    try {
      const collected = flattenData(data);
      const prompt = '用户选择了「' + (data && data.moduleName || moduleId) + '」模块，通过对话收集了以下信息：' + collected + '。请基于以上信息给出专业、丰富、详实的分析评估报告，报告要拿来即用，包含具体建议。' + (promptExtra || '');

      const baziData = (moduleId === 'bazi' || moduleId === 'name' || moduleId === 'number' || moduleId === 'face') ? data : null;

      const r = await fetch(apiBase + '/api/ai/public-chat', { signal: AbortSignal.timeout(15000), method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...((hist || []).slice(-8)), { role: 'user', content: prompt }],
          baziData
        }), signal:AbortSignal.timeout(15000)});
      const d = await r.json();
      return (d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content) || '';
    } catch (e) {
      if (global.console && console.warn) console.warn('[ReportEngine] 后端 AI 失败', e);
      return '';
    }
  }

  /**
   * 步骤 3：后端结构化报告（lifeplan/lifeindex/music）
   */
  async function callBackendStructured(apiBase, moduleId, data) {
    try {
      const userText = flattenData(data);
      const ageMatch = userText.match(/(\d{2,3})岁/) || userText.match(/年龄\s*(\d{2,3})/);
      const feMatch = userText.match(/([金木水火土])行/) || (data.fe || '');
      const liveM = userText.match(/(北京|上海|广州|深圳|杭州|成都|武汉|西安|南京|重庆|天津|苏州)/);
      const concerns = (userText.match(/(事业|工作|财运|金钱|健康|身体|婚姻|感情|学业|学习|家庭|人际|朋友|精神|禅修|享福|福气|寿元|寿命|长命)/g) || []).slice(0, 4);
      const gender = userText.match(/[男女]/) ? userText.match(/[男女]/)[0] : '';

      let endpoint = '';
      let payload = {};

      if (moduleId === 'lifeindex') {
        endpoint = '/api/ai/lifeindex-report';
        payload = {
          age: ageMatch ? parseInt(ageMatch[1]) : 30,
          gender,
          concerns,
          fiveElement: feMatch || '',
          withTTS: true
        };
      } else if (moduleId === 'music') {
        endpoint = '/api/ai/music-report';
        const moodMatch = userText.match(/(焦虑|失眠|悲伤|愤怒|疲劳|烦闷|抑郁)/);
        const moodMap = { '焦虑': 'anxiety', '失眠': 'insomnia', '悲伤': 'sadness', '愤怒': 'anger', '疲劳': 'fatigue', '烦闷': 'anxiety', '抑郁': 'sadness' };
        payload = {
          age: ageMatch ? parseInt(ageMatch[1]) : 30,
          mood: moodMatch ? moodMap[moodMatch[0]] : 'fatigue',
          fiveElement: feMatch || '',
          withTTS: true
        };
      } else if (moduleId === 'lifeplan') {
        endpoint = '/api/ai/lifeplan-report';
        const ageFromState = data && (data.age || parseInt(String(data.s1 || '').match(/\d{4}/)?.[0]) || '');
        const lpConcerns = (userText.match(/(学业|职业|工作|事业|财运|感情|婚姻|健康|城市|风物|修养|人脉|创业|养老|传承|学习|睡眠|财务|退休|孩子)/g) || []).slice(0, 4);
        payload = {
          age: ageFromState || 30,
          gender: (data.s1 || '').includes('男') ? '男' : (data.s1 || '').includes('女') ? '女' : '',
          concerns: lpConcerns,
          livePlace: liveM ? liveM[0] : '',
          withTTS: true
        };
      } else {
        return null;
      }

      const r = await fetch(apiBase + endpoint, { signal: AbortSignal.timeout(15000), method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload), signal:AbortSignal.timeout(15000)});
      const j = await r.json();
      if (j && j.code === 0 && j.data) return j.data;
      return null;
    } catch (e) {
      if (global.console && console.warn) console.warn('[ReportEngine] 后端结构化报告失败', e);
      return null;
    }
  }

  /**
   * 步骤 4：组装后端结构化报告为可展示 Markdown
   */
  function buildStructuredMarkdown(moduleId, report, kbSource, aiReply) {
    if (moduleId === 'lifeplan') {
      const lp = report.report || report;
      const tbl = (lp.domains || []).map(d => '| ' + d.icon + ' ' + d.name + ' | ' + d.score + ' | ' + d.status + ' |').join('\n');
      const yr = (lp.next5Years || []).map(y => '| ' + y.year + ' 岁 | ' + y.text + ' |').join('\n');
      const act = (lp.actions || []).slice(0, 10).map((a, i) => (i + 1) + '. ' + a).join('\n');
      return '【来源：lifeplan-report 后端结构化报告 + KB+AI 润色（' + kbSource + '）】\n\n' +
        '## ' + lp.title + '\n' +
        lp.summary + '\n\n' +
        '### 12 领域评分\n| 领域 | 分 | 等级 |\n|---|---|---|\n' + tbl + '\n\n' +
        '### 未来 5 年规划\n| 年龄 | 阶段 |\n|---|---|\n' + yr + '\n\n' +
        '### 10 条行动清单\n' + act + '\n\n' +
        '### AI 润色建议\n' + aiReply + '\n\n' +
        '— KB 命中 ' + lp.kbHitCount + ' 条参考材料\n— TTS 朗读：' + (report.ttsText || '').substring(0, 200) + '…';
    }
    if (moduleId === 'lifeindex') {
      const li = report.report || report;
      const tbl = (li.dimensions || []).map(d => '| ' + d.icon + ' ' + d.name + ' | ' + d.score + ' | ' + d.status + ' |').join('\n');
      const rec = (li.recommendations || []).slice(0, 10).map((r, i) => (i + 1) + '. ' + r).join('\n');
      return '【来源：lifeindex-report 后端结构化报告 + KB+AI 润色（' + kbSource + '）】\n\n' +
        '## ' + li.title + '\n' +
        li.summary + '\n\n' +
        '### 10 维度五行权重评分\n| 维度 | 分 | 等级 |\n|---|---|---|\n' + tbl + '\n\n' +
        '### 10 条调养建议\n' + rec + '\n\n' +
        '### AI 润色建议\n' + aiReply + '\n\n' +
        '— KB 命中 ' + li.kbHitCount + ' 条参考材料\n— TTS 朗读：' + (report.ttsText || '').substring(0, 200) + '…';
    }
    if (moduleId === 'music') {
      const m = report.report || report;
      const tracks = (m.tracks || []).map(t => '| **' + t.name + '** | ' + t.tag + ' | ' + t.scene + ' | ' + t.desc + ' |').join('\n');
      const guide = (m.playGuide || []).slice(0, 10).map((g, i) => (i + 1) + '. ' + g).join('\n');
      return '【来源：music-report 后端结构化报告 + KB+AI 润色（' + kbSource + '）】\n\n' +
        '## ' + m.title + '\n' +
        m.summary + '\n\n' +
        '### 五行音疗曲目推荐\n| 曲名 | 形制 | 场景 | 说明 |\n|---|---|---|---|\n' + tracks + '\n\n' +
        '### 听赏指南（10 条）\n' + guide + '\n\n' +
        '### AI 润色建议\n' + aiReply + '\n\n' +
        '— KB 命中 ' + m.kbHitCount + ' 条参考材料\n— TTS 朗读：' + (report.ttsText || '').substring(0, 200) + '…';
    }
    return aiReply || '';
  }

  /**
   * 步骤 5：图谱智能推荐（异步 fetch /api/kb/recommend）
   */
  async function fetchRecommendations(apiBase, moduleId) {
    try {
      const r = await fetch(apiBase + '/api/kb/recommend?module=' + encodeURIComponent(moduleId) + '&limit=5', { signal: AbortSignal.timeout(15000) });
      const j = await r.json();
      return (j && j.data && j.data.recommendations) || (j && j.recommendations) || [];
    } catch (e) {
      return [];
    }
  }

  /**
   * 渲染：KB 命中信息条
   */
  function renderMetaBadge(meta) {
    if (!meta || typeof meta !== 'object') return '';
    const score = typeof meta.score === 'number' ? meta.score : 0;
    const scorePct = Math.round(score * 100);
    const scoreColor = score >= 0.7 ? '#10b981' : score >= 0.4 ? '#c9a84c' : '#f59e0b';
    const srcLabel = meta.engine || meta.source || '本地知识库';
    const srcFallback = meta.fallback ? ' · 回退' : '';
    return '<div class="kb-hit-badge" style="display:inline-flex;align-items:center;gap:8px;padding:5px 10px;margin-bottom:8px;background:rgba(201,168,76,.08);border:1px solid rgba(201,168,76,.25);border-radius:6px;font-size:11px;color:var(--paper2)">' +
      '<span style="color:var(--paper3)">🎯 KB 命中</span>' +
      '<span style="color:' + scoreColor + ';font-weight:600">' + scorePct + '%</span>' +
      '<span style="color:var(--paper3)">·</span>' +
      '<span>引擎：' + srcLabel + srcFallback + '</span>' +
      '</div>';
  }

  /**
   * 渲染：图谱推荐块（HTML）
   */
  function renderRecommendBlock(recs) {
    if (!recs || !recs.length) {
      return '<div style="display:flex;align-items:center;gap:8px;color:#9333ea;font-weight:600;margin-bottom:8px"><span style="font-size:16px">🧠</span><span>图谱智能推荐</span></div><div style="opacity:.6;font-size:12px">本次报告暂无图谱关联推荐</div>';
    }
    let h = '<div style="display:flex;align-items:center;gap:8px;color:#9333ea;font-weight:600;margin-bottom:8px"><span style="font-size:16px">🧠</span><span>图谱智能推荐</span><span style="margin-left:auto;font-size:11px;color:var(--paper3);font-weight:normal">为你发现 ' + recs.length + ' 个关联领域</span></div>';
    h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:6px">';
    recs.forEach(r => {
      const pct = Math.round((r.score || 0) * 100);
      const color = pct >= 60 ? '#10b981' : pct >= 30 ? '#c9a84c' : 'rgba(255,255,255,.4)';
      h += '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:6px">';
      h += '<div style="display:flex;flex-direction:column;flex:1;min-width:0"><span style="font-size:12px;color:var(--paper);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + escHtml(r.name || r.id) + '</span><span style="font-size:10px;color:var(--paper3);margin-top:2px">' + escHtml(r.id) + '</span></div>';
      h += '<span style="margin-left:8px;font-size:11px;font-weight:600;color:' + color + '">' + pct + '%</span>';
      h += '</div>';
    });
    h += '</div>';
    h += '<div style="margin-top:10px;padding-top:8px;border-top:1px dashed rgba(147,51,234,.2);font-size:11px;color:var(--paper3);text-align:center">⛕ 点 <a href="kb-explorer.html" style="color:#9333ea;text-decoration:underline">知识浏览器</a> 查看详情 · 点 <a href="kb-graph.html" style="color:#9333ea;text-decoration:underline">知识图谱</a> 看关系</div>';
    return h;
  }

  /**
   * 渲染：报告操作按钮（保存/复制/复制 MD/👍/👎）
   */
  function renderOps(text) {
    const _repEsc = escHtml(text).replace(/"/g, '&quot;');
    return '<button class="btn-save" data-report="' + _repEsc + '" onclick="window.ReportEngine_ops_save(this)">💾 保存报告</button>' +
      '<button class="btn-copy" data-report="' + _repEsc + '" onclick="window.ReportEngine_ops_copy(this)">📋 复制</button>' +
      '<button class="btn-copy-md" data-report="' + _repEsc + '" onclick="window.ReportEngine_ops_copyMD(this)">📝 复制 Markdown</button>' +
      '<button class="btn-fb-up" onclick="window.ReportEngine_ops_fb(this,1)" title="这条回答对你有帮助">👍 有帮助</button>' +
      '<button class="btn-fb-dn" onclick="window.ReportEngine_ops_fb(this,-1)" title="这条回答不准确">👎 没帮助</button>';
  }

  /**
   * 渲染适配器 — 各端各自实现
   *  Adapter 接口：{ renderText(html), renderRecommend(html), renderOps(html), finish() }
   *  内置默认实现：直接 innerHTML 到 container
   */
  function buildAdapter(name, container) {
    if (!container) return null;

    const inner = {
      container,
      headerEl: null,
      bodyEl: null,
      recEl: null,
      opsEl: null,
      renderHeader(html) {
        if (!this.headerEl) {
          this.headerEl = document.createElement('div');
          this.headerEl.className = 'report-engine-header';
          this.container.appendChild(this.headerEl);
        }
        this.headerEl.innerHTML = html;
      },
      renderBody(html) {
        if (!this.bodyEl) {
          this.bodyEl = document.createElement('div');
          this.bodyEl.className = 'report-engine-body';
          this.bodyEl.style.cssText = 'white-space:pre-wrap;font-size:13px;line-height:1.7';
          this.container.appendChild(this.bodyEl);
        }
        this.bodyEl.innerHTML = html;
      },
      renderRecommend(html) {
        if (!this.recEl) {
          this.recEl = document.createElement('div');
          this.recEl.className = 'report-engine-rec';
          this.recEl.style.cssText = 'margin-top:14px;padding:14px;background:linear-gradient(135deg,rgba(147,51,234,.06),rgba(201,168,76,.06));border:1px solid rgba(147,51,234,.25);border-radius:10px;font-size:13px;line-height:1.7';
          this.container.appendChild(this.recEl);
        }
        this.recEl.innerHTML = html;
      },
      renderOps(html) {
        if (!this.opsEl) {
          this.opsEl = document.createElement('div');
          this.opsEl.className = 'report-engine-ops report-ops';
          this.opsEl.style.cssText = 'margin-top:10px;display:flex;gap:6px;flex-wrap:wrap;';
          this.container.appendChild(this.opsEl);
        }
        this.opsEl.innerHTML = html;
      },
      finish() {
        if (this.bodyEl && typeof this.container.scrollIntoView === 'function') {
          try { this.container.scrollIntoView({ behavior: 'smooth', block: 'end' }); } catch (e) {}
        }
      }
    };

    // 微信端精简版（去掉推荐/操作按钮）
    if (name === 'wechat') {
      inner.renderRecommend = function () { /* 微信端隐藏推荐 */ };
      inner.renderOps = function () { /* 微信端隐藏操作 */ };
    }

    return inner;
  }

  /**
   * 主入口：生成报告
   *
   * opts:
   *   - module (string): 模块 ID（必填）
   *   - data (object): 用户数据（必填）
   *   - hist (array): 历史对话（可选）
   *   - apiBase (string): API 根路径（默认自动探测）
   *   - adapter (string): 渲染适配器名（chatBubble | drawer | inline | wechat，默认 inline）
   *   - container (HTMLElement): 渲染容器（必填）
   *   - hooks (object): 钩子函数
   *       onReportStart() → onKbHit(kb) → onBackendStructured(be) → onReportEnd(text, meta)
   */
  async function generate(opts) {
    if (!opts || !opts.module) throw new Error('[ReportEngine] opts.module 必填');
    if (!opts.container) throw new Error('[ReportEngine] opts.container 必填');

    const moduleId = opts.module;
    const data = opts.data || {};
    const hist = opts.hist || [];
    const apiBase = opts.apiBase || DEFAULT_API;
    const adapter = buildAdapter(opts.adapter || 'inline', opts.container);
    const hooks = opts.hooks || {};

    if (hooks.onReportStart) try { hooks.onReportStart(); } catch (e) {}

    // 步骤 0：模块 KB 兜底（music/lifeindex/lifeplan 断网可用）
    const fallback = tryModuleReportsFallback(moduleId, data);
    if (fallback.used) {
      adapter.renderBody(escHtml(fallback.html));
      adapter.finish();
      if (hooks.onReportEnd) try { hooks.onReportEnd(fallback.html, { score: 0, source: 'local-module-reports', engine: 'local', fallback: true }); } catch (e) {}
      // 异步打点 + 推荐（不阻塞主流程）
      fireAsync(apiBase, moduleId, data, adapter);
      return { text: fallback.html, source: 'local-module-reports' };
    }

    // 步骤 1：KB 命中检测
    const kbHit = await kbScore(moduleId, data, apiBase);
    if (hooks.onKbHit) try { hooks.onKbHit(kbHit); } catch (e) {}

    // 步骤 2：KB 直答（≥ 0.7）
    if (kbHit.score >= 0.7) {
      const text = '【来源：本地知识库（' + kbHit.source + ' · ' + kbHit.entryId + '，命中分 ' + kbHit.score + '）】\n\n' + (kbHit.snippet || '').substring(0, 4000);
      adapter.renderHeader(renderMetaBadge({ score: kbHit.score, source: kbHit.source, engine: kbHit.engine || 'fts5', fallback: !!kbHit.fallback }));
      adapter.renderBody(escHtml(text));
      adapter.renderOps(renderOps(text));
      adapter.finish();
      try { if (typeof global.recordKbHit === 'function') global.recordKbHit(moduleId, kbHit.score, true); } catch (e) {}
      if (hooks.onReportEnd) try { hooks.onReportEnd(text, { score: kbHit.score, source: kbHit.source }); } catch (e) {}
      fireAsync(apiBase, moduleId, data, adapter, kbHit);
      return { text, source: 'kb-direct' };
    }

    // 步骤 3：KB+AI 润色 或 AI+KB 兜底
    let promptExtra = '';
    if (kbHit.score >= 0.4) {
      promptExtra = '\n\n【本地知识库参考材料（' + kbHit.source + '）】\n' + (kbHit.snippet || '').substring(0, 1500);
      try { if (typeof global.recordKbHit === 'function') global.recordKbHit(moduleId, kbHit.score, false); } catch (e) {}
    } else {
      try { if (typeof global.recordKbHit === 'function') global.recordKbHit(moduleId, kbHit.score || 0, false); } catch (e) {}
    }

    // R51：KB 命中分 < 0.4 时，调 module-reports 断网兜底诊断 → 让 AI 有真实数据可润色
    if (kbHit.score < 0.4) {
      const fb = tryModuleReportsFallback(moduleId, data);
      if (fb.used) {
        promptExtra += '\n\n【本地引擎诊断参考】\n' + fb.html.substring(0, 800);
      }
    }

    // 步骤 3b：后端结构化报告（lifeplan/lifeindex/music）
    // 补充节气引擎数据到 promptExtra
    var jieqiInfo = jieqiEnhance(data);
    if (jieqiInfo) promptExtra += jieqiInfo;
    let backendStructured = null;
    if (moduleId === 'lifeplan' || moduleId === 'lifeindex' || moduleId === 'music') {
      backendStructured = await callBackendStructured(apiBase, moduleId, data);
      if (hooks.onBackendStructured) try { hooks.onBackendStructured(backendStructured); } catch (e) {}
    }

    // 步骤 4：调用后端 AI
    const aiReply = await callBackendAI({ apiBase, moduleId, data, hist, promptExtra });

    let finalText = '';
    if (aiReply.length > 50) {
      if (backendStructured) {
        finalText = buildStructuredMarkdown(moduleId, backendStructured, kbHit.source || 'ai', aiReply);
      } else if (kbHit.score >= 0.4) {
        finalText = '【来源：KB+AI 润色（' + kbHit.source + '）】\n\n' + aiReply;
      } else {
        finalText = aiReply;
      }
      adapter.renderHeader(renderMetaBadge({
        score: kbHit.score,
        source: kbHit.source || 'AI',
        engine: kbHit.engine || 'ai-backend',
        fallback: !!kbHit.fallback
      }));
      adapter.renderBody(escHtml(finalText));
      adapter.renderOps(renderOps(finalText));
      adapter.finish();
      if (hooks.onReportEnd) try { hooks.onReportEnd(finalText, { score: kbHit.score, source: kbHit.source || 'AI' }); } catch (e) {}
      fireAsync(apiBase, moduleId, data, adapter, kbHit);
      return { text: finalText, source: 'ai-polished' };
    }

    // 步骤 5：降级 — 本地引擎
    if (typeof global.localReport === 'function') {
      try {
        const local = global.localReport(moduleId, data);
        finalText = '【来源：本地引擎】\n\n' + local;
        adapter.renderHeader(renderMetaBadge({ score: 0, source: 'local-engine', engine: 'local', fallback: true }));
        adapter.renderBody(escHtml(finalText));
        adapter.renderOps(renderOps(finalText));
        adapter.finish();
        if (hooks.onReportEnd) try { hooks.onReportEnd(finalText, { score: 0, source: 'local-engine' }); } catch (e) {}
        return { text: finalText, source: 'local' };
      } catch (e) {}
    }

    // 兜底兜底
    finalText = '【来源：无可用引擎】\n\n抱歉，本次未能生成报告。请稍后重试，或换个模块试试。';
    adapter.renderBody(escHtml(finalText));
    adapter.finish();
    if (hooks.onReportEnd) try { hooks.onReportEnd(finalText, { score: 0 }); } catch (e) {}
    return { text: finalText, source: 'none' };
  }

  /**
   * 异步打点 + 推荐加载（不阻塞主流程）
   */
  function fireAsync(apiBase, moduleId, data, adapter, kbHit) {
    // 1) 图谱推荐
    fetchRecommendations(apiBase, moduleId).then(recs => {
      try { adapter.renderRecommend(renderRecommendBlock(recs)); } catch (e) {}
    });

    // 2) 问卷落库
    try {
      const tok = localStorage.getItem('mlbj_token') || '';
      const hdr = tok ? { 'Authorization': '***' + tok, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
      const isBaziLike = (moduleId === 'bazi' || moduleId === 'name' || moduleId === 'number' || moduleId === 'face');
      fetch(apiBase + '/api/paipan/save', { signal: AbortSignal.timeout(15000), method: 'POST',
        headers: hdr,
        body: JSON.stringify({
          type: moduleId,
          inputData: data,
          resultData: { report: (kbHit && kbHit.snippet ? kbHit.snippet.substring(0, 2000) : '') },
          rawQuery: flattenData(data).substring(0, 500)
        }), signal:AbortSignal.timeout(15000)}).catch(() => {});
    } catch (e) {}
  }

  /**
   * 操作按钮的全局回调（供 inline onclick 使用）
   */
  global.ReportEngine_ops_save = function (el) {
    const text = el.getAttribute('data-report') || '';
    try {
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = '命理报告-' + Date.now() + '.txt';
      a.click();
      URL.revokeObjectURL(url);
      toast('报告已下载');
    } catch (e) {
      toast('保存失败：' + e.message);
    }
  };

  global.ReportEngine_ops_copy = function (el) {
    const text = el.getAttribute('data-report') || '';
    try {
      navigator.clipboard.writeText(text).then(() => toast('已复制到剪贴板'), () => fallbackCopy(text));
    } catch (e) {
      fallbackCopy(text);
    }
  };

  global.ReportEngine_ops_copyMD = function (el) {
    const text = el.getAttribute('data-report') || '';
    try {
      navigator.clipboard.writeText(text).then(() => toast('已复制 Markdown'), () => fallbackCopy(text));
    } catch (e) {
      fallbackCopy(text);
    }
  };

  global.ReportEngine_ops_fb = function (btn, val) {
    try {
      const moduleId = (global.state && global.state.module) || 'unknown';
      const tok = localStorage.getItem('mlbj_token') || '';
      const hdr = tok ? { 'Authorization': '***' + tok, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
      fetch((global.API || DEFAULT_API) + '/api/feedback/report', { signal: AbortSignal.timeout(15000),
        method: 'POST',
        headers: hdr,
        body: JSON.stringify({ module: moduleId, value: val, ts: Date.now() }), signal: AbortSignal.timeout(15000) }).catch(() => {});
      btn.style.background = val > 0 ? 'rgba(16,185,129,.2)' : 'rgba(239,68,68,.2)';
      btn.disabled = true;
      toast(val > 0 ? '感谢反馈 👍' : '已记录，将持续优化 👎');
    } catch (e) {}
  };

  function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;top:-9999px';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); toast('已复制'); } catch (e) { toast('复制失败'); }
    document.body.removeChild(ta);
  }

  function toast(msg) {
    try {
      if (typeof global.toast === 'function') { global.toast(msg); return; }
      if (typeof global.showToast === 'function') { global.showToast(msg); return; }
    } catch (e) {}
    console.warn('[ReportEngine]', msg);
  }

  /**
   * 暴露 API
   */
  global.ReportEngine = {
    version: '1.0.0',
    generate,
    // 工具方法（供高级用户使用）
    tools: { escHtml, flattenData, kbScore, callBackendAI, fetchRecommendations, tryModuleReportsFallback }
  };
})(typeof window !== 'undefined' ? window : globalThis);