/**
 * multimodal-fusion.js — L4 多模态融合决策模块
 *
 * 融合三路诊断信号 → 综合诊断报告：
 * 1. 面诊（AI 视觉引擎）→ 脏腑虚实 · 气色 · 面相健康指标
 * 2. 舌诊（AI 视觉引擎）→ 舌质 · 舌苔 · 寒热虚实
 * 3. 命理健康预测（八字五行）→ 先天体质 · 脏腑强弱 · 流年健康预警
 *
 * 输出：综合诊断报告（含 KB 参考 + 调养建议 + 优先级排序）
 */
(function(global) {
  'use strict';

  var API = (location.hostname === '127.0.0.1' || location.hostname === 'localhost')
    ? 'http://127.0.0.1:8920' : '';

  // 五行→脏腑映射
  var WUXING_ORGAN = {
    '木': { organ: '肝胆', emotion: '怒', taste: '酸', season: '春' },
    '火': { organ: '心小肠', emotion: '喜', taste: '苦', season: '夏' },
    '土': { organ: '脾胃', emotion: '思', taste: '甘', season: '长夏' },
    '金': { organ: '肺大肠', emotion: '悲', taste: '辛', season: '秋' },
    '水': { organ: '肾膀胱', emotion: '恐', taste: '咸', season: '冬' }
  };

  // 融合决策核心
  function fuse(faceResult, tongueResult, baziResult) {
    var signals = [];
    var organScores = {};
    var priorities = [];

    // 1. 解析面诊信号
    if (faceResult && faceResult.success) {
      var face = faceResult.analysis || faceResult;
      // 面诊脏腑映射
      if (face.organs) {
        Object.keys(face.organs).forEach(function(k) {
          var o = face.organs[k];
          if (!organScores[k]) organScores[k] = { score: 0, sources: [] };
          organScores[k].score += (o.status === 'deficient' ? -0.3 : o.status === 'excess' ? 0.3 : 0);
          organScores[k].sources.push('面诊:' + (o.status || 'normal'));
        });
        signals.push({ source: '面诊', weight: 0.35, data: face.organs });
      }
      if (face.complexion) {
        signals.push({ source: '面诊气色', weight: 0.1, data: face.complexion });
      }
    }

    // 2. 解析舌诊信号
    if (tongueResult && tongueResult.success) {
      var tongue = tongueResult.analysis || tongueResult;
      if (tongue.nature) {
        // 舌质：淡=虚寒 · 红=热 · 暗紫=瘀
        var tongueMap = { '淡': '虚寒', '红': '热证', '暗紫': '血瘀', '正常': '平' };
        var tongueDiag = tongueMap[tongue.nature] || '待辨';
        signals.push({ source: '舌诊舌质', weight: 0.2, data: tongueDiag });
        if (tongueDiag === '虚寒') {
          priorities.push({ organ: '脾胃', issue: '虚寒', advice: '温中健脾', source: '舌诊' });
        } else if (tongueDiag === '热证') {
          priorities.push({ organ: '心肝', issue: '热证', advice: '清热泻火', source: '舌诊' });
        }
      }
      if (tongue.coating) {
        // 舌苔：白=寒 · 黄=热 · 厚=湿 · 剥=阴虚
        var coatMap = { '白': '寒湿', '黄': '湿热', '厚': '痰湿', '剥': '阴虚', '薄白': '正常' };
        var coatDiag = coatMap[tongue.coating] || '待辨';
        signals.push({ source: '舌诊舌苔', weight: 0.15, data: coatDiag });
      }
    }

    // 3. 解析命理健康信号
    if (baziResult && baziResult.wuxing) {
      var wx = baziResult.wuxing;
      var scores = Object.entries(wx).sort(function(a, b) { return b[1] - a[1]; });
      var max = scores[0];
      var min = scores[scores.length - 1];

      // 最强五行 → 对应脏腑过亢
      if (max && max[1] > 0.3) {
        var organ = WUXING_ORGAN[max[0]];
        if (organ) {
          priorities.push({
            organ: organ.organ,
            issue: max[0] + '气过旺',
            advice: '泄' + max[0] + '：饮食清淡，少' + organ.taste + '味',
            source: '命理',
            wuxing: max[0]
          });
        }
      }
      // 最弱五行 → 对应脏腑偏虚
      if (min && min[1] < 0.1) {
        var organ2 = WUXING_ORGAN[min[0]];
        if (organ2) {
          priorities.push({
            organ: organ2.organ,
            issue: min[0] + '气偏虚',
            advice: '补' + min[0] + '：多接触' + min[0] + '色食物',
            source: '命理',
            wuxing: min[0]
          });
        }
      }
      signals.push({ source: '命理五行', weight: 0.2, data: wx });
    }

    // 4. 融合决策
    var confidence = Math.min(1.0, signals.reduce(function(s, sig) { return s + sig.weight; }, 0));
    var topPriority = priorities.length > 0 ? priorities[0] : null;

    return {
      success: true,
      confidence: Math.round(confidence * 100) / 100,
      signalCount: signals.length,
      signals: signals,
      organScores: organScores,
      priorities: priorities,
      topPriority: topPriority,
      summary: generateSummary(signals, priorities),
      timestamp: new Date().toISOString(),
      engine: 'multimodal-fusion-v1'
    };
  }

  function generateSummary(signals, priorities) {
    var parts = [];
    if (signals.length === 0) return '信号不足，无法融合诊断';
    parts.push('融合 ' + signals.length + ' 路信号');
    if (priorities.length > 0) {
      parts.push('首要关注：' + priorities[0].organ + ' ' + priorities[0].issue);
      if (priorities.length > 1) {
        parts.push('其次：' + priorities[1].organ + ' ' + priorities[1].issue);
      }
    }
    return parts.join('；');
  }

  // 异步融合：调 8913 OCR + 8920 KB + 排盘
  async function fuseAsync(faceImageB64, tongueImageB64, baziData) {
    var tasks = [];

    // 面诊
    if (faceImageB64 && global.OCRClient) {
      tasks.push(
        global.OCRClient.recognize(faceImageB64, 'face').catch(function(e) { return { error: e.message }; })
      );
    } else {
      tasks.push(Promise.resolve(null));
    }

    // 舌诊
    if (tongueImageB64 && global.OCRClient) {
      tasks.push(
        global.OCRClient.recognize(tongueImageB64, 'tongue').catch(function(e) { return { error: e.message }; })
      );
    } else {
      tasks.push(Promise.resolve(null));
    }

    // 命理健康预测（如果有八字数据直接用，否则跳过）
    if (baziData && baziData.wuxing) {
      tasks.push(Promise.resolve(baziData));
    } else if (baziData && baziData.birthDate) {
      // 调排盘 API 获取五行
      tasks.push(
        fetch(API + '/api/paipan/bazi', { signal: AbortSignal.timeout(15000), method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(baziData), signal:AbortSignal.timeout(15000)}).then(function(r) { return r.json(); }).catch(function() { return null; })
      );
    } else {
      tasks.push(Promise.resolve(null));
    }

    var results = await Promise.all(tasks);
    var faceResult = results[0];
    var tongueResult = results[1];
    var baziResult = results[2];

    // 提取八字五行
    var baziWuxing = null;
    if (baziResult) {
      if (baziResult.wuxing) {
        baziWuxing = baziResult;
      } else if (baziResult.data && baziResult.data.wuxing) {
        baziWuxing = baziResult.data;
      } else if (baziResult.bazi && baziResult.bazi.wuxing) {
        baziWuxing = baziResult.bazi;
      }
    }

    var fused = fuse(faceResult, tongueResult, baziWuxing);

    // 查 KB 获取参考
    if (fused.topPriority) {
      try {
        var kbQ = fused.topPriority.organ + ' ' + fused.topPriority.issue;
        var kbRes = await fetch(API + '/api/public/kb/search-fts?q=' + encodeURIComponent(kbQ) + '&limit=3', { signal: AbortSignal.timeout(15000) });
        var kbJson = await kbRes.json();
        var kbData = kbJson.data || kbJson;
        if (kbData && kbData.results && kbData.results.length > 0) {
          fused.kbReferences = kbData.results.map(function(r) {
            return { id: r.entry_id, title: r.title, snippet: (r.snippet || '').substring(0, 150) };
          });
          fused.kbEngine = kbData.engine;
        }
      } catch (e) {
        // KB 查询失败不影响融合结果
      }
    }

    return fused;
  }

  global.MultimodalFusion = {
    fuse: fuse,
    fuseAsync: fuseAsync,
    WUXING_ORGAN: WUXING_ORGAN
  };

})(typeof window !== 'undefined' ? window : this);
