/**
 * ai-diagnosis-engine.js — AI 面诊舌诊诊断匹配引擎
 * 
 * 流程：采集 → 特征提取 → KB规则匹配 → 诊断结论 → 置信度评估 → 处置方案
 * 
 * 支持三种输入：
 * 1. 面部图像（RGB分析 → 面色 → 五行体质 → 脏腑强弱）
 * 2. 舌象图像（颜色分析 → 舌质/舌苔 → 寒热虚实 → 辨证）
 * 3. 穿戴数据（心率/血氧/体温 → 脉诊/气血/寒热 → 体质状态）
 */
(function(global) {
  'use strict';

  var API = (location.hostname === '127.0.0.1' || location.hostname === 'localhost')
    ? 'http://127.0.0.1:8920' : '';

  // ========== 面诊特征提取 ==========
  function extractFaceFeatures(canvas) {
    var ctx = canvas.getContext('2d');
    var w = canvas.width, h = canvas.height;
    var data = ctx.getImageData(0, 0, w, h).data;
    
    var rSum = 0, gSum = 0, bSum = 0, brightSum = 0, count = 0;
    // 采样中心区域（面部）
    var startX = Math.floor(w * 0.2), endX = Math.floor(w * 0.8);
    var startY = Math.floor(h * 0.15), endY = Math.floor(h * 0.85);
    
    for (var y = startY; y < endY; y++) {
      for (var x = startX; x < endX; x++) {
        var i = (y * w + x) * 4;
        var r = data[i], g = data[i+1], b = data[i+2];
        rSum += r; gSum += g; bSum += b;
        brightSum += (r + g + b) / 3;
        count++;
      }
    }
    
    var avgR = rSum / count, avgG = gSum / count, avgB = bSum / count;
    var brightness = brightSum / count;
    
    // 三停比例
    var upperH = (h * 0.30 - h * 0.15);
    var middleH = (h * 0.60 - h * 0.30);
    var lowerH = (h * 0.85 - h * 0.60);
    var total = upperH + middleH + lowerH;
    
    return {
      avgR: Math.round(avgR), avgG: Math.round(avgG), avgB: Math.round(avgB),
      brightness: Math.round(brightness),
      upperRatio: Math.round(upperH / total * 100),
      middleRatio: Math.round(middleH / total * 100),
      lowerRatio: Math.round(lowerH / total * 100),
      dominantColor: avgR > avgG && avgR > avgB ? 'red' : (avgG > avgR && avgG > avgB ? 'green' : (avgB > avgR && avgB > avgG ? 'blue' : 'neutral'))
    };
  }

  // ========== 面诊 KB 规则匹配 ==========
  function matchFaceRules(features) {
    var b = features.brightness;
    var complexion, constitution, organ, advice, confidence;
    
    if (b >= 180) {
      complexion = '白润';
      constitution = 'metal'; // 金弱（肺）
      organ = '肺·大肠';
      advice = '补肺固表：百合雪梨饮 · 慢跑深呼吸 · 注意保暖';
      confidence = 75;
    } else if (b >= 140) {
      complexion = '红润';
      constitution = 'fire'; // 火旺（心）
      organ = '心·小肠';
      advice = '清心降火：莲子心茶 · 冥想午休 · 少熬夜';
      confidence = 80;
    } else if (b >= 100) {
      complexion = '黄明';
      constitution = 'earth'; // 土弱（脾）
      organ = '脾·胃';
      advice = '健脾益气：山药粥 · 散步揉腹 · 饮食有节';
      confidence = 78;
    } else if (b >= 60) {
      complexion = '青暗';
      constitution = 'wood'; // 木旺（肝）
      organ = '肝·胆';
      advice = '疏肝理气：玫瑰花茶 · 太极晨练 · 少动怒';
      confidence = 72;
    } else {
      complexion = '灰暗';
      constitution = 'water'; // 水弱（肾）
      organ = '肾·膀胱';
      advice = '温肾助阳：核桃黑芝麻 · 泡脚早睡 · 避免劳累';
      confidence = 68;
    }
    
    return {
      type: 'face',
      complexion: complexion,
      constitution: constitution,
      organ: organ,
      advice: advice,
      confidence: confidence,
      features: features,
      raw: '面色' + complexion + '（亮度' + b + '）→ ' + organ + ' → ' + advice
    };
  }

  // ========== 舌诊特征提取 ==========
  function extractTongueFeatures(canvas) {
    var ctx = canvas.getContext('2d');
    var w = canvas.width, h = canvas.height;
    var data = ctx.getImageData(0, 0, w, h).data;
    
    // 舌象分析：中心区域采样
    var startX = Math.floor(w * 0.25), endX = Math.floor(w * 0.75);
    var startY = Math.floor(h * 0.25), endY = Math.floor(h * 0.75);
    
    var rSum = 0, gSum = 0, bSum = 0, count = 0;
    var redPixels = 0, whitePixels = 0, darkPixels = 0;
    
    for (var y = startY; y < endY; y++) {
      for (var x = startX; x < endX; x++) {
        var i = (y * w + x) * 4;
        var r = data[i], g = data[i+1], b = data[i+2];
        rSum += r; gSum += g; bSum += b; count++;
        
        if (r > 180 && g < 150) redPixels++;
        else if (r > 200 && g > 200 && b > 200) whitePixels++;
        else if (r < 100 && g < 100) darkPixels++;
      }
    }
    
    var avgR = rSum / count, avgG = gSum / count, avgB = bSum / count;
    var redRatio = redPixels / count;
    var whiteRatio = whitePixels / count;
    var darkRatio = darkPixels / count;
    
    return {
      avgR: Math.round(avgR), avgG: Math.round(avgG), avgB: Math.round(avgB),
      redRatio: Math.round(redRatio * 100),
      whiteRatio: Math.round(whiteRatio * 100),
      darkRatio: Math.round(darkRatio * 100),
      brightness: Math.round((avgR + avgG + avgB) / 3)
    };
  }

  // ========== 舌诊 KB 规则匹配 ==========
  function matchTongueRules(features) {
    var nature, coating, syndrome, formula, confidence;
    
    // 舌质判断
    if (features.avgR > 180 && features.avgG < 140) {
      nature = '红舌';
      syndrome = '热证';
      formula = '白虎汤/清营汤';
      confidence = 82;
    } else if (features.avgR > 160 && features.avgG < 120) {
      nature = '绛舌';
      syndrome = '热入营血';
      formula = '清营汤/犀角地黄汤';
      confidence = 78;
    } else if (features.darkRatio > 20 || (features.avgR < 100 && features.avgG < 80)) {
      nature = '紫舌';
      syndrome = '血瘀';
      formula = '血府逐瘀汤/桃红四物汤';
      confidence = 75;
    } else if (features.avgR > 200 && features.avgG > 190 && features.avgB > 180) {
      nature = '淡白舌';
      syndrome = '气血两虚/阳虚';
      formula = '八珍汤/归脾汤';
      confidence = 76;
    } else {
      nature = '淡红舌';
      syndrome = '正常/轻度失调';
      formula = '日常调理（四君子汤/逍遥散）';
      confidence = 85;
    }
    
    // 舌苔判断
    if (features.whiteRatio > 15) {
      coating = '白苔';
    } else if (features.redRatio > 20) {
      coating = '黄苔（偏红）';
    } else {
      coating = '薄白苔';
    }
    
    return {
      type: 'tongue',
      nature: nature,
      coating: coating,
      syndrome: syndrome,
      formula: formula,
      confidence: confidence,
      features: features,
      raw: '舌质' + nature + '+' + coating + ' → ' + syndrome + ' → 推荐：' + formula
    };
  }

  // ========== 穿戴数据匹配 ==========
  function matchWearableData(hr, spo2, temp, bp, sleep, steps) {
    var findings = [];
    var confidence = 70;
    
    // 心率→脉诊
    if (hr > 100) { findings.push({key:'脉',value:'数脉',meaning:'热证/心率过快',advice:'清热泻火'}); confidence += 5; }
    else if (hr < 60) { findings.push({key:'脉',value:'迟脉',meaning:'寒证/心率过缓',advice:'温阳散寒'}); confidence += 5; }
    else { findings.push({key:'脉',value:'平脉',meaning:'正常',advice:'保持'}); }
    
    // 血氧→气血
    if (spo2 < 90) { findings.push({key:'气',value:'气脱',meaning:'血氧严重不足',advice:'立即就医'}); confidence = Math.min(confidence + 10, 95); }
    else if (spo2 < 95) { findings.push({key:'气',value:'气虚',meaning:'血氧偏低',advice:'补气养血'}); }
    else { findings.push({key:'气',value:'正常',meaning:'气血充足',advice:'保持'}); }
    
    // 体温→寒热
    if (temp > 38) { findings.push({key:'热',value:'高热',meaning:'感染/炎症',advice:'清热解毒+就医'}); confidence = Math.min(confidence + 15, 95); }
    else if (temp > 37.3) { findings.push({key:'热',value:'低热',meaning:'阴虚/慢性炎症',advice:'滋阴清热'}); }
    else if (temp < 36) { findings.push({key:'寒',value:'阳虚',meaning:'体温偏低',advice:'温阳助火'}); }
    else { findings.push({key:'寒热',value:'正常',meaning:'体温正常',advice:'保持'}); }
    
    // 步数→气力
    if (steps < 3000) { findings.push({key:'力',value:'气虚',meaning:'活动量不足',advice:'适度运动'}); }
    else if (steps > 6000) { findings.push({key:'力',value:'气血通畅',meaning:'活动量充足',advice:'保持'}); }
    
    return {
      type: 'wearable',
      findings: findings,
      confidence: Math.min(confidence, 95),
      raw: findings.map(function(f){return f.key+':'+f.value+'('+f.meaning+')'}).join(' · ')
    };
  }

  // ========== 综合诊断（面诊+舌诊+穿戴 合参）==========
  function diagnose(faceResult, tongueResult, wearableResult) {
    var signals = [];
    var totalConfidence = 0;
    var weightSum = 0;
    
    if (faceResult) { signals.push({type:'面诊', data:faceResult, weight:0.35}); weightSum += 0.35; }
    if (tongueResult) { signals.push({type:'舌诊', data:tongueResult, weight:0.40}); weightSum += 0.40; }
    if (wearableResult) { signals.push({type:'穿戴', data:wearableResult, weight:0.25}); weightSum += 0.25; }
    
    if (signals.length === 0) return null;
    
    // 加权置信度
    signals.forEach(function(s) {
      totalConfidence += s.data.confidence * s.weight;
    });
    var confidence = Math.round(totalConfidence / weightSum);
    
    // 综合辨证
    var syndromes = [];
    if (faceResult) syndromes.push(faceResult.constitution + '体质(' + faceResult.organ + ')');
    if (tongueResult) syndromes.push(tongueResult.syndrome + '(' + tongueResult.nature + ')');
    if (wearableResult) syndromes.push(wearableResult.raw);
    
    // 处置方案
    var disposition = '观察';
    if (confidence >= 90) disposition = '直接推送方案';
    else if (confidence >= 70) disposition = '推送方案+建议医师确认';
    else if (confidence >= 50) disposition = '初步建议+预约医师';
    else disposition = '建议面诊';
    
    return {
      confidence: confidence,
      signals: signals.map(function(s){return s.type + ':' + s.data.confidence + '%'}),
      syndromes: syndromes,
      disposition: disposition,
      summary: '综合辨证(' + confidence + '%)：' + syndromes.join(' + '),
      timestamp: new Date().toISOString(),
      engine: 'ai-diagnosis-engine-v1'
    };
  }

  // ========== KB 查询（异步获取匹配案例）==========
  async function queryKbCases(query, limit) {
    try {
      var resp = await fetch(API + '/api/public/kb/search-fts?q=' + encodeURIComponent(query) + '&limit=' + (limit || 3),{signal:AbortSignal.timeout(15000)});
      var d = await resp.json();
      var data = d.data || d;
      return data.results || [];
    } catch(e) { return []; }
  }

  // ========== 完整诊断流程 ==========
  async function fullDiagnosis(faceCanvas, tongueCanvas, wearableData) {
    var faceResult = null, tongueResult = null, wearableResult = null;
    
    // 1. 面诊
    if (faceCanvas) {
      var faceFeatures = extractFaceFeatures(faceCanvas);
      faceResult = matchFaceRules(faceFeatures);
    }
    
    // 2. 舌诊
    if (tongueCanvas) {
      var tongueFeatures = extractTongueFeatures(tongueCanvas);
      tongueResult = matchTongueRules(tongueFeatures);
    }
    
    // 3. 穿戴
    if (wearableData) {
      wearableResult = matchWearableData(
        wearableData.hr || 72, wearableData.spo2 || 98,
        wearableData.temp || 36.5, wearableData.bp || '120/80',
        wearableData.sleep || 7, wearableData.steps || 5000
      );
    }
    
    // 4. 综合诊断
    var diagnosis = diagnose(faceResult, tongueResult, wearableResult);
    if (!diagnosis) return null;
    
    // 5. KB 案例查询
    var query = '';
    if (faceResult) query = faceResult.constitution + '体质';
    else if (tongueResult) query = tongueResult.syndrome;
    if (query) {
      var cases = await queryKbCases(query, 3);
      diagnosis.kbCases = cases;
      diagnosis.kbWatermark = cases.length > 0 ? cases[0]._watermark : null;
    }
    
    return {
      face: faceResult,
      tongue: tongueResult,
      wearable: wearableResult,
      diagnosis: diagnosis
    };
  }

  global.AIDiagnosisEngine = {
    extractFaceFeatures: extractFaceFeatures,
    matchFaceRules: matchFaceRules,
    extractTongueFeatures: extractTongueFeatures,
    matchTongueRules: matchTongueRules,
    matchWearableData: matchWearableData,
    diagnose: diagnose,
    fullDiagnosis: fullDiagnosis,
    queryKbCases: queryKbCases
  };

})(typeof window !== 'undefined' ? window : this);

// ========== 闻诊（音频模态）==========
// 通过 Web Audio API 提取声纹特征
function extractVoiceFeatures(audioBuffer, sampleRate) {
  var length = audioBuffer.length;
  var sum = 0, peak = 0;
  for (var i = 0; i < length; i++) {
    var abs = Math.abs(audioBuffer[i]);
    sum += abs;
    if (abs > peak) peak = abs;
  }
  var volume = sum / length; // 平均音量
  var peakVolume = peak; // 峰值音量
  
  // 简单频率估计（零交叉率 → 音调）
  var zeroCrossings = 0;
  for (var i = 1; i < length; i++) {
    if ((audioBuffer[i] >= 0) !== (audioBuffer[i-1] >= 0)) zeroCrossings++;
  }
  var pitch = (zeroCrossings / 2) * (sampleRate / length); // 估计基频
  
  return {
    pitch: Math.round(pitch),
    volume: Math.round(volume * 100) / 100,
    peakVolume: Math.round(peakVolume * 100) / 100,
    zeroCrossings: zeroCrossings,
    duration: Math.round(length / sampleRate * 1000) // ms
  };
}

// 闻诊 KB 规则匹配
function matchVoiceRules(features) {
  var pitch = features.pitch;
  var volume = features.volume;
  var tone, syndrome, confidence;
  
  if (pitch > 300) { tone = '高尖'; syndrome = '热证/肝火'; confidence = 70; }
  else if (pitch < 100) { tone = '低沉'; syndrome = '寒证/气虚'; confidence = 72; }
  else if (volume < 0.1) { tone = '低微'; syndrome = '气虚'; confidence = 75; }
  else if (volume > 0.5) { tone = '洪亮'; syndrome = '实证'; confidence = 73; }
  else { tone = '正常'; syndrome = '平'; confidence = 80; }
  
  return {
    type: 'voice',
    tone: tone,
    syndrome: syndrome,
    confidence: confidence,
    features: features,
    raw: '声纹:' + tone + '(pitch=' + pitch + ',vol=' + volume + ')→' + syndrome
  };
}

// ========== 问诊（文本模态）==========
async function matchSymptomRules(symptoms) {
  if (!symptoms || symptoms.length === 0) return null;
  var query = Array.isArray(symptoms) ? symptoms.join(' ') : symptoms;
  var cases = await queryKbCases(query, 3);
  
  var syndrome = '待辨';
  var confidence = 60;
  if (cases.length > 0) {
    confidence = Math.min(85, 60 + cases.length * 10);
    syndrome = cases[0].title || '参考: ' + query.substring(0, 20);
  }
  
  return {
    type: 'symptoms',
    query: query,
    syndrome: syndrome,
    confidence: confidence,
    kbCases: cases,
    raw: '问诊:' + query.substring(0, 30) + '→' + cases.length + '条KB匹配(' + syndrome + ')'
  };
}

// ========== 完整四诊合参（商用标准）==========
// 望诊35% + 闻诊15% + 问诊25% + 切诊25%
async function fullTetraDiagnosis(faceCanvas, tongueCanvas, audioData, symptoms, wearableData) {
  var results = {};
  var totalConfidence = 0;
  var weightSum = 0;
  var findings = [];
  
  // 1. 望诊（面诊+舌诊）35%
  var faceResult = null, tongueResult = null;
  if (faceCanvas) {
    var faceFeatures = extractFaceFeatures(faceCanvas);
    faceResult = matchFaceRules(faceFeatures);
    results.face = faceResult;
    findings.push(faceResult.raw);
  }
  if (tongueCanvas) {
    var tongueFeatures = extractTongueFeatures(tongueCanvas);
    tongueResult = matchTongueRules(tongueFeatures);
    results.tongue = tongueResult;
    findings.push(tongueResult.raw);
  }
  if (faceResult || tongueResult) {
    var wangConf = (faceResult ? faceResult.confidence * 0.15 : 0) + (tongueResult ? tongueResult.confidence * 0.20 : 0);
    totalConfidence += wangConf;
    weightSum += 0.35;
  }
  
  // 2. 闻诊（声纹）15%
  if (audioData) {
    var voiceResult = matchVoiceRules(audioData);
    results.voice = voiceResult;
    totalConfidence += voiceResult.confidence * 0.15;
    weightSum += 0.15;
    findings.push(voiceResult.raw);
  }
  
  // 3. 问诊（症状文本）25%
  if (symptoms) {
    var symptomResult = await matchSymptomRules(symptoms);
    if (symptomResult) {
      results.symptoms = symptomResult;
      totalConfidence += symptomResult.confidence * 0.25;
      weightSum += 0.25;
      findings.push(symptomResult.raw);
    }
  }
  
  // 4. 切诊（穿戴数据）25%
  if (wearableData) {
    var wearableResult = matchWearableData(
      wearableData.hr || 72, wearableData.spo2 || 98,
      wearableData.temp || 36.5, wearableData.bp || '120/80',
      wearableData.sleep || 7, wearableData.steps || 5000
    );
    results.wearable = wearableResult;
    totalConfidence += wearableResult.confidence * 0.25;
    weightSum += 0.25;
    findings.push(wearableResult.raw);
  }
  
  // 融合诊断
  var confidence = weightSum > 0 ? Math.round(totalConfidence / weightSum) : 0;
  var missingModality = weightSum < 1.0; // 模态不全
  if (missingModality) confidence = Math.round(confidence * 0.8); // 缺一降20%
  
  var disposition = '建议面诊';
  if (confidence >= 90) disposition = '直接推送方案';
  else if (confidence >= 70) disposition = '推送方案+建议医师确认';
  else if (confidence >= 50) disposition = '初步建议+预约医师';
  
  // 高危检测
  var urgent = findings.some(function(f){ return f.includes('危重') || f.includes('气脱') || (wearableData && (wearableData.hr > 120 || wearableData.spo2 < 90)); });
  if (urgent) disposition = '🚨 紧急：立即120+通知家属';
  
  return {
    diagnosis: {
      confidence: confidence,
      findings: findings,
      disposition: disposition,
      urgent: urgent,
      missingModality: missingModality,
      summary: '四诊合参(' + confidence + '%)：' + findings.join(' + '),
      timestamp: new Date().toISOString(),
      engine: 'tetra-diagnosis-v1'
    },
    details: results
  };
}

// 导出到全局
global.AIDiagnosisEngine.extractVoiceFeatures = extractVoiceFeatures;
global.AIDiagnosisEngine.matchVoiceRules = matchVoiceRules;
global.AIDiagnosisEngine.matchSymptomRules = matchSymptomRules;
global.AIDiagnosisEngine.fullTetraDiagnosis = fullTetraDiagnosis;
