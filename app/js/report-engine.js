/**
 * report-engine.js — 统一报告生成引擎（纯函数版）
 *
 * 各端共享同一套报告生成逻辑，渲染由调用方自行决定。
 * 用法：
 *   const result = await ReportEngine.generateText({ module: 'bazi', data: {...}, apiBase: 'http://127.0.0.1:8920' });
 *   renderReport(result.text, result.meta);
 */
const ReportEngine = (function () {
  'use strict';

  // ─── KB 源定义（与 ai-assistant-inline.js 同步）───
  const KB_SOURCES = [
    { name: 'NIHAISHA_KB', entryId: 'nihaisha-model-v1', modelEntryCount: 385, obj: () => window.NIHAISHA_KB, mods: ['zhongyi', 'lifeindex', 'lifeplan', 'music'], weight: 1.0 },
    { name: 'SHUHAN_KB', entryId: 'shuhan-model-v1', modelEntryCount: 289, obj: () => window.SHUHAN_KB, mods: ['bazi', 'qimen', 'fengshui', 'yunshi', 'caiyun', 'shiye', 'ganqing', 'wuxing', 'xingming'], weight: 1.0 },
    { name: 'YANZHI_KB', entryId: 'yanzhi-model-v1', modelEntryCount: 39, obj: () => window.YANZHI_KB, mods: ['yanzhi'], weight: 1.0 },
    { name: 'TCM_KB', entryId: 'tcm-model-v1', modelEntryCount: 51, obj: () => window.TCM_KB, mods: ['zhongyi'], weight: 0.8 },
    { name: 'ZIWEI_KB', entryId: 'ziwei-model-v1', modelEntryCount: 174, obj: () => window.ZIWEI_KB, mods: ['ziwei', 'paipan'], weight: 1.0 },
    { name: 'BAZI_KB', entryId: 'bazi-model-v1', modelEntryCount: 110, obj: () => window.BAZI_KB, mods: ['bazi'], weight: 0.95 },
    { name: 'QIMEN_KB', entryId: 'qimen-model-v1', modelEntryCount: 133, obj: () => window.QIMEN_KB, mods: ['qimen', 'qimendunjia'], weight: 0.95 },
    { name: 'MEIHUA_KB', entryId: 'meihua-model-v1', modelEntryCount: 42, obj: () => window.MEIHUA_KB, mods: ['meihua', 'liuyao'], weight: 0.9 },
    { name: 'LIUYAOO_KB', entryId: 'liuyao-model-v1', modelEntryCount: 20, obj: () => window.LIUYAO_KB, mods: ['liuyao', 'yijing'], weight: 0.9 },
    { name: 'LIUREN_KB', entryId: 'liuren-model-v1', modelEntryCount: 30, obj: () => window.LIUREN_KB, mods: ['liuren'], weight: 0.9 },
    { name: 'YIJING_KB', entryId: 'yijing-model-v1', modelEntryCount: 8, obj: () => window.YIJING_KB, mods: ['yijing', 'zhouyi'], weight: 0.9 },
    { name: 'FENGSHUI_KB', entryId: 'fengshui-model-v1', modelEntryCount: 44, obj: () => window.FENGSHUI_KB, mods: ['fengshui', 'zeri', 'huangli'], weight: 0.9 },
    { name: 'ZODIAC_KB', entryId: 'zodiac-model-v1', modelEntryCount: 94, obj: () => window.ZODIAC_KB, mods: ['zodiac', 'shengxiao', 'taisui', 'mobile'], weight: 0.85 },
    { name: 'MANTRA_KB', entryId: 'mantra-model-v1', modelEntryCount: 121, obj: () => window.MANTRA_KB, mods: ['mantra', 'jingdian'], weight: 0.85 },
    { name: 'HUAJIE_KB', entryId: 'huajie-model-v1', modelEntryCount: 13, obj: () => window.HUAJIE_KB, mods: ['huajie'], weight: 0.85 },
    { name: 'CLASSICS_KB', entryId: 'classics-model-v1', modelEntryCount: 106, obj: () => window.CLASSICS_KB, mods: ['classics', 'jingdian'], weight: 0.8 },
    { name: 'NIHAISHA_STRUCTURED_KB', entryId: 'nihaisha-structured-v1', modelEntryCount: 118, obj: () => window.NIHAISHA_STRUCTURED_KB, mods: ['zhongyi', 'qimen', 'fengshui', 'jingdian'], weight: 1.2 },
    { name: 'FAITH_KB', entryId: 'faith-model-v1', modelEntryCount: 167, obj: () => window.FAITH_KB, mods: ['faith', 'mingshi'], weight: 0.8 },
    { name: 'HUANGLI_KB', entryId: 'huangli-model-v1', modelEntryCount: 32, obj: () => window.HUANGLI_KB, mods: ['huangli', 'zeri'], weight: 0.85 },
    { name: 'MOBILE_KB', entryId: 'mobile-model-v1', modelEntryCount: 40, obj: () => window.MOBILE_KB, mods: ['mobile', 'shouji'], weight: 0.85 },
    { name: 'TAISUI_KB', entryId: 'taisui-model-v1', modelEntryCount: 42, obj: () => window.TAISUI_KB, mods: ['taisui', 'sui', 'taisui-shuhan'], weight: 0.85 },
    { name: 'WUXING_KB', entryId: 'wuxing-model-v1', modelEntryCount: 19, obj: () => window.WUXING_KB, mods: ['wuxing', 'wuxingpeilian', 'bazi'], weight: 0.9 },
    { name: 'XINGMING_KB', entryId: 'xingming-model-v1', modelEntryCount: 31, obj: () => window.XINGMING_KB, mods: ['xingming', 'sancai', 'wuge'], weight: 0.85 },
    { name: 'ZERI_KB', entryId: 'zeri-model-v1', modelEntryCount: 42, obj: () => window.ZERI_KB, mods: ['zeri', 'zeri-zeri', 'huangli'], weight: 0.85 },
  ];

  // ─── KB 命中分计算 ───────────────────────────────────
  function kbScore(moduleId, data) {
    let best = { source: null, score: 0, snippet: '', fallback: false, entryId: '', engine: 'local' };
    const userInput = Object.values(data || {}).join(' ').toLowerCase();
    if (!userInput) return best;
    const keywords = userInput.split(/[\s,，。、；;：:（）()\[\]\-]+/).filter(s => s.length >= 2);

    for (const src of KB_SOURCES) {
      if (!src.mods.includes(moduleId)) continue;
      const kb = src.obj();
      if (!kb) continue;

      function walk(obj, path) {
        if (typeof obj === 'string') {
          let matched = 0;
          for (const kw of keywords) {
            if (obj.toLowerCase().includes(kw)) matched++;
          }
          if (matched > 0 && matched > best.score) {
            best = {
              source: src.name,
              score: Math.min(1.0, matched / keywords.length * src.weight),
              snippet: obj.substring(0, 4000),
              fallback: false,
              entryId: src.entryId,
              engine: 'local-kb'
            };
          }
        } else if (typeof obj === 'object' && obj !== null) {
          for (const k of Object.keys(obj)) walk(obj[k], path + '.' + k);
        }
      }
      walk(kb, src.name);
    }
    return best;
  }

  // ─── 本地报告兜底 ───────────────────────────────────
  function localReport(module, data) {
    const collected = Object.values(data || {}).join('；');
    return '【' + (module || '综合') + '分析报告】\n\n基于您提供的信息：' + collected + '。\n\n综合分析：当前知识库匹配度一般，已为您整理基础分析框架。建议补充更多信息以获得精准分析。\n\n如需深度报告，请：\n1. 提供完整出生信息\n2. 选择具体咨询方向\n3. 上传相关照片（可选）';
  }

  // ─── 主入口：纯函数生成报告文本 ──────────────────────
  async function generateText(opts) {
    const module = opts.module || 'general';
    const data = opts.data || {};
    const apiBase = (opts.apiBase || '').replace(/\/$/, '');
    const moduleReports = opts.moduleReports || window._MODULE_REPORTS || null;

    // 1) KB 优先双路径
    let kbHit = kbScore(module, data);

    // 2) KB 兜底（模块级诊断）
    if (kbHit.score < 0.4 && moduleReports && moduleReports[module]) {
      try {
        const mr = moduleReports[module];
        const rep = mr.diagnose(data);
        if (rep) {
          let fb = '\n\n【本地引擎诊断参考（' + mr.name + ' KB 兜底）】\n' + (rep.summary || '');
          if (rep.element) fb += '\n主导元素：' + rep.element;
          if (rep.total) fb += '\n综合指数：' + rep.total + ' 分';
          if (rep.nextSteps) fb += '\n建议：' + rep.nextSteps.slice(0, 5).join('；');
          kbHit.snippet = (kbHit.snippet || '') + fb;
          kbHit.fallback = true;
        }
      } catch (e) { /* 静默 */ }
    }

    // 3) KB 直答（≥ 0.7）
    if (kbHit.score >= 0.7) {
      return {
        text: '【来源：本地知识库（' + kbHit.source + ' · ' + kbHit.entryId + '，命中分 ' + kbHit.score.toFixed(2) + '）】\n\n' + kbHit.snippet.substring(0, 4000),
        meta: { score: kbHit.score, source: kbHit.source, engine: kbHit.engine, fallback: !!kbHit.fallback }
      };
    }

    // 4) 后端 AI（0.4+ 走 KB+AI；< 0.4 纯 AI）
    if (kbHit.score >= 0.4 || true) { // 始终尝试后端 AI
      try {
        const collected = Object.values(data).join('；');
        const promptExtra = kbHit.score >= 0.4
          ? '\n\n【本地知识库参考材料（' + kbHit.source + '）】\n' + kbHit.snippet.substring(0, 1500)
          : '';
        const prompt = '用户选择了「' + module + '」模块，通过对话收集了以下信息：' + collected + '。请基于以上信息给出专业、丰富、详实的分析评估报告，报告要拿来即用，包含具体建议。' + promptExtra;
        const r = await fetch(apiBase + '/api/ai/public-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] })
        });
        const d = await r.json();
        const reply = (d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content) || '';
        if (reply.length > 50) {
          const tagged = kbHit.score >= 0.4
            ? '【来源：KB+AI 润色（' + kbHit.source + '）】\n\n' + reply
            : reply;
          return {
            text: tagged,
            meta: { score: kbHit.score, source: kbHit.source || 'AI', engine: kbHit.engine || 'ai-backend', fallback: !!kbHit.fallback }
          };
        }
      } catch (e) { /* 静默降级 */ }
    }

    // 5) 纯本地兜底
    const local = localReport(module, data);
    return {
      text: '【来源：本地引擎】\n\n' + local,
      meta: { score: 0, source: 'local-engine', engine: 'local', fallback: true }
    };
  }

  return { generateText, kbScore, localReport };
})();

if (typeof globalThis !== 'undefined') globalThis.ReportEngine = ReportEngine;
