/**
 * 望诊临床工作台 — 连接摄像头/语音/排盘/患者/病例/AI
 * 依赖: wangzhen-kb-loader.js, wangzhen-center.js (基础诊断)
 * 扩展 window.wangzhenCenter 增加临床模式
 */
(function(){
  'use strict';

  var API_BASE = '';  // 同源
  var FACE_OCR = 'http://127.0.0.1:8913';
  var PAIPAN_API = 'http://127.0.0.1:8911';
  var TTS_API = 'http://127.0.0.1:8912';

  // ===== 患者管理 =====
  var currentPatient = null;

  function loadPatientList(){
    if(!window.fetch){
      renderPatientList([]);
      return;
    }
    fetch(API_BASE + '/api/yuanzhu/list?token=***')
      .then(function(r){ return r.json(); })
      .then(function(data){
        var list = data.data || data.list || [];
        renderPatientList(list);
      })
      .catch(function(err){
        console.warn('[wangzhen-clinical] 患者列表加载失败:', err.message);
        renderPatientList([]);
      });
  }

  function renderPatientList(list){
    var container = document.getElementById('wz-patient-list');
    if(!container) return;
    if(!list || list.length === 0){
      container.innerHTML = '<div class="wz-empty">暂无缘主数据，可手动输入新患者</div>';
      return;
    }
    var html = '';
    list.forEach(function(p){
      var name = p.display_name || p.user_id || '未知';
      var dm = p.day_master || '';
      var zodiac = p.zodiac || '';
      html += '<div class="wz-patient-card" onclick="window.wangzhenClinical.selectPatient('+p.user_id+',\''+name.replace(/'/g,'')+'\')">';
      html += '<div class="wz-patient-name">'+name+'</div>';
      if(dm) html += '<span class="wz-patient-tag">日主:'+dm+'</span>';
      if(zodiac) html += '<span class="wz-patient-tag">生肖:'+zodiac+'</span>';
      html += '</div>';
    });
    container.innerHTML = html;
  }

  function selectPatient(userId, name){
    currentPatient = { user_id: userId, name: name };
    // 更新 UI
    var el = document.getElementById('wz-current-patient');
    if(el) el.textContent = name + ' (#'+userId+')';
    // 加载详细 profile
    fetch(API_BASE + '/api/yuanzhu/profile?user_id='+userId+'&token=***')
      .then(function(r){ return r.json(); })
      .then(function(data){
        var p = data.data || data;
        currentPatient = p;
        var detailEl = document.getElementById('wz-patient-detail');
        if(detailEl){
          var html = '';
          if(p.day_master) html += '<div class="pd-row"><span>日主</span><b>'+p.day_master+'</b></div>';
          if(p.xi_ele) html += '<div class="pd-row"><span>喜用</span><b>'+p.xi_ele+'</b></div>';
          if(p.ji_ele) html += '<div class="pd-row"><span>忌</span><b>'+p.ji_ele+'</b></div>';
          if(p.lack_wuxing) html += '<div class="pd-row"><span>缺</span><b>'+p.lack_wuxing+'</b></div>';
          if(p.zodiac) html += '<div class="pd-row"><span>生肖</span><b>'+p.zodiac+'</b></div>';
          if(p.focus_areas) html += '<div class="pd-row"><span>关注</span><b>'+p.focus_areas+'</b></div>';
          detailEl.innerHTML = html || '<span class="muted">无详细数据</span>';
        }
      })
      .catch(function(){});
    showToast('已选择患者: ' + name);
  }

  // ===== 摄像头采集 =====
  var cameraStream = null;

  function startCamera(){
    var video = document.getElementById('wz-camera-video');
    var canvas = document.getElementById('wz-camera-canvas');
    if(!video || !canvas) return;

    if(cameraStream){ stopCamera(); return; }

    navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' }, audio: false })
      .then(function(stream){
        cameraStream = stream;
        video.srcObject = stream;
        video.play();
        var btn = document.getElementById('wz-btn-camera');
        if(btn) btn.textContent = '⏹ 停止摄像头';
        var captureBtn = document.getElementById('wz-btn-capture');
        if(captureBtn) captureBtn.style.display = '';
      })
      .catch(function(err){
        showToast('摄像头启动失败: ' + err.message, 'error');
      });
  }

  function stopCamera(){
    if(cameraStream){
      cameraStream.getTracks().forEach(function(t){ t.stop(); });
      cameraStream = null;
      var btn = document.getElementById('wz-btn-camera');
      if(btn) btn.textContent = '📷 启动摄像头';
      var captureBtn = document.getElementById('wz-btn-capture');
      if(captureBtn) captureBtn.style.display = 'none';
    }
  }

  function capturePhoto(){
    var video = document.getElementById('wz-camera-video');
    var canvas = document.getElementById('wz-camera-canvas');
    if(!video || !canvas || !cameraStream) return;

    canvas.width = 480;
    canvas.height = 360;
    var ctx = canvas.getContext('2d');
    if(!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    var dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    var preview = document.getElementById('wz-photo-preview');
    if(preview){
      preview.src = dataUrl;
      preview.style.display = 'block';
    }

    // 发送到 face-ocr-server 分析
    analyzeFace(dataUrl);
  }

  function analyzeFace(dataUrl){
    var statusEl = document.getElementById('wz-analysis-status');
    if(statusEl) statusEl.textContent = '🔍 正在分析面部特征...';
    if(statusEl) statusEl.className = 'wz-status analyzing';

    var b64 = dataUrl.split(',')[1];

    fetch(FACE_OCR + '/api/face/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: b64, mode: 'wangzhen' })
    })
      .then(function(r){ return r.json(); })
      .then(function(data){
        var statusEl2 = document.getElementById('wz-analysis-status');
        if(statusEl2){
          statusEl2.textContent = '✅ 分析完成';
          statusEl2.className = 'wz-status done';
        }
        renderAIAnalysis(data);
        // 自动填充诊断特征
        autoFillFeatures(data);
      })
      .catch(function(err){
        var statusEl3 = document.getElementById('wz-analysis-status');
        if(statusEl3){
          statusEl3.textContent = '⚠️ 分析失败: ' + err.message + '（可手动选择特征）';
          statusEl3.className = 'wz-status error';
        }
      });
  }

  function renderAIAnalysis(data){
    var container = document.getElementById('wz-ai-result');
    if(!container) return;
    var html = '';
    if(data.ok === false){
      html = '<div class="wz-warning">⚠️ '+(data.detail||data.error||'分析失败')+'</div>';
    } else if(data.result){
      html = '<div class="wz-ai-output">'+(data.result || '').replace(/\n/g,'<br>')+'</div>';
    } else if(data.analysis){
      html = '<div class="wz-ai-output">'+data.analysis.replace(/\n/g,'<br>')+'</div>';
    } else {
      html = '<div class="wz-info">分析完成，请手动选择区域特征进行诊断</div>';
    }
    container.innerHTML = html;
  }

  function autoFillFeatures(data){
    // 从 AI 分析结果中提取关键词，自动勾选特征
    var text = (data.result || data.analysis || '').toLowerCase();
    var featureMap = {
      '红': 'red', '泛红': 'red', '痤疮': 'acne_recurrent', '痘痘': 'acne_recurrent',
      '斑': 'spot_brown', '褐斑': 'spot_brown', '黑斑': 'dark_patch', '暗沉': 'dull',
      '苍白': 'pale', '青': 'blue', '青紫': 'vein_purple',
      '横纹': 'wrinkle', '皱纹': 'wrinkle', '竖纹': 'wrinkle',
      '青丝': 'red_vein', '红血丝': 'red_vein',
      '凹陷': 'sunken', '低陷': 'sunken',
      '结节': 'nodule', '凸起': 'nodule'
    };
    Object.keys(featureMap).forEach(function(kw){
      if(text.indexOf(kw) >= 0){
        var cb = document.querySelector('#wangzhen-feature-panel input[value="'+featureMap[kw]+'"]');
        if(cb && !cb.checked){
          cb.checked = true;
        }
      }
    });
    // 触发 onChange
    if(window.wangzhenCenter && window.wangzhenCenter.onFeatureChange){
      window.wangzhenCenter.onFeatureChange();
    }
    // 切换到分区诊断 Tab
    if(window.wangzhenCenter && window.wangzhenCenter.switchTab){
      window.wangzhenCenter.switchTab('zones');
    }
  }

  // ===== 语音输入 =====
  var isRecording = false;
  var recognition = null;

  function toggleVoiceInput(){
    if(isRecording){ stopVoiceInput(); return; }
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if(!SR){
      showToast('浏览器不支持语音输入，请使用 Chrome 或 Edge', 'warning');
      return;
    }
    recognition = new SR();
    recognition.lang = 'zh-CN';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = function(event){
      var finalText = '';
      var interimText = '';
      for(var i = event.resultIndex; i < event.results.length; i++){
        var t = event.results[i][0].transcript;
        if(event.results[i].isFinal) finalText += t;
        else interimText += t;
      }
      var textarea = document.getElementById('wz-voice-text');
      if(textarea){
        var existing = textarea.dataset.finalText || '';
        if(finalText) existing += finalText;
        textarea.dataset.finalText = existing;
        textarea.value = existing + interimText;
      }
    };

    recognition.onerror = function(event){
      showToast('语音识别错误: ' + event.error, 'error');
      stopVoiceInput();
    };

    recognition.onend = function(){
      if(isRecording) recognition.start(); // 自动重启
    };

    recognition.start();
    isRecording = true;
    var btn = document.getElementById('wz-btn-voice');
    if(btn){
      btn.textContent = '⏹ 停止录音';
      btn.classList.add('recording');
    }
    showToast('🎤 语音输入已开启，请说话...');
  }

  function stopVoiceInput(){
    if(recognition){
      isRecording = false;
      recognition.stop();
      recognition = null;
    }
    var btn = document.getElementById('wz-btn-voice');
    if(btn){
      btn.textContent = '🎤 语音输入';
      btn.classList.remove('recording');
    }
  }

  // ===== TTS 语音播报 =====
  function speakText(text){
    if(!text) return;
    var url = TTS_API + '?text=' + encodeURIComponent(text.substring(0, 500)) + '&voice=zh-CN-XiaoxiaoNeural';
    var audio = new Audio(url);
    audio.play().catch(function(){});
  }

  // ===== 排盘联动 =====
  function fetchPaipan(bazi){
    if(!bazi || !bazi.year) return;
    var params = 'year='+bazi.year+'&month='+bazi.month+'&day='+bazi.day+'&hour='+bazi.hour;
    fetch(PAIPAN_API + '/paipan/bazi?'+params)
      .then(function(r){ return r.json(); })
      .then(function(data){
        renderPaipan(data);
      })
      .catch(function(err){
        console.warn('[wangzhen-clinical] 排盘失败:', err.message);
      });
  }

  function renderPaipan(data){
    var container = document.getElementById('wz-paipan-result');
    if(!container) return;
    var d = data.data || data;
    var html = '';
    if(d.day_master){
      html += '<div class="pd-row"><span>日主</span><b>'+d.day_master+'</b></div>';
    }
    if(d.wuxing){
      html += '<div class="pd-row"><span>五行</span><b>'+JSON.stringify(d.wuxing).replace(/[{}"]/g,' ')+'</b></div>';
    }
    if(d.xi_yong){
      html += '<div class="pd-row"><span>喜用</span><b>'+d.xi_yong+'</b></div>';
    }
    if(d.siju){
      html += '<div class="pd-row"><span>四柱</span><b>'+d.siju+'</b></div>';
    }
    container.innerHTML = html || '<span class="muted">排盘结果将显示在此</span>';
  }

  // ===== 保存诊断到病例 =====
  function saveDiagnosis(){
    if(!currentPatient){
      showToast('请先选择患者', 'warning');
      return;
    }

    // 收集诊断结果
    var resultPanel = document.getElementById('wangzhen-result-panel');
    var diagnosisText = resultPanel ? resultPanel.innerText : '';
    var voiceText = (document.getElementById('wz-voice-text') || {}).value || '';
    var aiResult = (document.getElementById('wz-ai-result') || {}).innerText || '';

    var payload = {
      patient_id: currentPatient.user_id,
      patient_name: currentPatient.display_name || currentPatient.name,
      diagnosis_type: 'wangzhen',
      diagnosis_text: diagnosisText,
      voice_notes: voiceText,
      ai_analysis: aiResult,
      kb_source: 'wangzhen-kb-data.json',
      timestamp: new Date().toISOString()
    };

    fetch(API_BASE + '/api/clinic/submit-diagnosis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function(r){ return r.json(); })
      .then(function(data){
        showToast('✅ 诊断已保存到病例系统');
        renderSavedCases(currentPatient.user_id);
      })
      .catch(function(err){
        // API 可能需要鉴权，降级到 localStorage
        saveToLocal(payload);
        showToast('⚠️ 服务器保存失败，已存本地（需登录后同步）');
      });
  }

  function saveToLocal(payload){
    var key = 'wz_diagnosis_history';
    var history = JSON.parse(localStorage.getItem(key) || '[]');
    history.unshift(payload);
    if(history.length > 50) history = history.slice(0, 50);
    localStorage.setItem(key, JSON.stringify(history));
  }

  function renderSavedCases(userId){
    var container = document.getElementById('wz-saved-cases');
    if(!container) return;

    // 尝试从 API 加载
    fetch(API_BASE + '/api/clinic/assigned-cases?patient_id='+userId+'&token=***')
      .then(function(r){ return r.json(); })
      .then(function(data){
        var cases = data.data || data.cases || [];
        if(cases.length === 0){
          container.innerHTML = '<div class="wz-empty">暂无历史病例</div>';
          return;
        }
        var html = '';
        cases.forEach(function(c){
          html += '<div class="wz-case-item">';
          html += '<div class="wz-case-date">'+(c.created_at||c.submitted_at||'')+'</div>';
          html += '<div class="wz-case-text">'+((c.diagnosis_text||c.master_analysis||'').substring(0,80))+'...</div>';
          html += '</div>';
        });
        container.innerHTML = html;
      })
      .catch(function(){
        // 降级到 localStorage
        var history = JSON.parse(localStorage.getItem('wz_diagnosis_history') || '[]');
        if(history.length === 0){
          container.innerHTML = '<div class="wz-empty">暂无历史病例</div>';
          return;
        }
        var html = '';
        history.forEach(function(h){
          html += '<div class="wz-case-item">';
          html += '<div class="wz-case-date">'+(h.timestamp||'').substring(0,16)+'</div>';
          html += '<div class="wz-case-text">'+(h.diagnosis_text||'').substring(0,80)+'...</div>';
          html += '</div>';
        });
        container.innerHTML = html;
      });
  }

  // ===== 生成报告 =====
  function generateReport(){
    if(!currentPatient){
      showToast('请先选择患者', 'warning');
      return;
    }

    var resultPanel = document.getElementById('wangzhen-result-panel');
    var diagnosisText = resultPanel ? resultPanel.innerText : '';
    var voiceText = (document.getElementById('wz-voice-text') || {}).value || '';
    var aiResult = (document.getElementById('wz-ai-result') || {}).innerText || '';
    var paipanText = (document.getElementById('wz-paipan-result') || {}).innerText || '';

    var report = '═══ 命理宝鉴 · 望诊报告 ═══\n\n';
    report += '患者：' + (currentPatient.display_name || currentPatient.name || '') + '\n';
    report += '日期：' + new Date().toLocaleDateString('zh-CN') + '\n\n';

    if(paipanText){
      report += '【命理排盘】\n' + paipanText + '\n\n';
    }
    if(aiResult){
      report += '【AI 面部分析】\n' + aiResult + '\n\n';
    }
    report += '【望诊诊断】\n' + diagnosisText + '\n\n';
    if(voiceText){
      report += '【医嘱语音记录】\n' + voiceText + '\n\n';
    }
    report += '═══ 本报告仅为中医面诊辅助筛查参考，不替代医院专业检查 ═══\n';

    // 用新窗口打开可打印报告
    var win = window.open('', '_blank');
    if(win){
      win.document.write('<html><head><meta charset="UTF-8"><title>望诊报告 - '+(currentPatient.display_name||currentPatient.name||'')+'</title>');
      win.document.write('<style>body{font-family:"PingFang SC",serif;max-width:680px;margin:40px auto;padding:20px;line-height:1.8;color:#333}h1{color:#c9a84c;text-align:center}.section{margin:16px 0;padding:12px;border:1px solid #ddd;border-radius:8px}.section-title{font-weight:bold;color:#c9a84c;margin-bottom:8px}.disclaimer{color:#999;font-size:12px;text-align:center;margin-top:20px}@media print{.no-print{display:none}}</style>');
      win.document.write('</head><body>');
      win.document.write('<h1>🔍 望诊报告</h1>');
      win.document.write('<div class="section"><div class="section-title">患者信息</div>'+(currentPatient.display_name||currentPatient.name||'')+' · '+new Date().toLocaleDateString('zh-CN')+'</div>');
      if(paipanText) win.document.write('<div class="section"><div class="section-title">命理排盘</div>'+paipanText.replace(/\n/g,'<br>')+'</div>');
      if(aiResult) win.document.write('<div class="section"><div class="section-title">AI 面部分析</div>'+aiResult.replace(/\n/g,'<br>')+'</div>');
      if(diagnosisText) win.document.write('<div class="section"><div class="section-title">望诊诊断</div>'+diagnosisText.replace(/\n/g,'<br>')+'</div>');
      if(voiceText) win.document.write('<div class="section"><div class="section-title">医嘱记录</div>'+voiceText.replace(/\n/g,'<br>')+'</div>');
      win.document.write('<div class="disclaimer">⚠️ 本报告仅为中医面诊辅助筛查参考，不替代医院专业检查。高危信号请及时就医。</div>');
      win.document.write('<button class="no-print" onclick="window.print()" style="margin:20px auto;display:block;padding:10px 30px;font-size:14px;cursor:pointer">🖨️ 打印</button>');
      win.document.write('</body></html>');
      win.document.close();
    } else {
      showToast('请允许弹出窗口以查看报告', 'warning');
    }
  }

  // ===== Toast =====
  function showToast(msg, type){
    var toast = document.createElement('div');
    toast.className = 'wz-toast ' + (type || 'info');
    toast.textContent = msg;
    toast.style.cssText = 'position:fixed;top:20px;right:20px;padding:10px 20px;border-radius:8px;font-size:13px;z-index:9999;transition:.3s;max-width:320px';
    var colors = { info:'rgba(201,168,76,.9)', error:'rgba(239,68,68,.9)', warning:'rgba(245,158,11,.9)', success:'rgba(16,185,129,.9)' };
    toast.style.background = colors[type] || colors.info;
    toast.style.color = '#fff';
    document.body.appendChild(toast);
    setTimeout(function(){ toast.style.opacity = '0'; setTimeout(function(){ toast.remove(); }, 300); }, 3000);
  }

  // ===== 命相同参：面相×八字交叉 =====
  function runMingxiang(){
    if(!currentPatient){
      showToast('请先选择患者', 'warning');
      return;
    }
    var resultPanel = document.getElementById('wangzhen-result-panel');
    var diagnosisText = resultPanel ? resultPanel.innerText : '';
    var paipanText = (document.getElementById('wz-paipan-result') || {}).innerText || '';

    if(!diagnosisText || diagnosisText.indexOf('请选择') >= 0){
      showToast('请先完成面诊', 'warning');
      return;
    }

    var crossAnalysis = '═══ 命相同参交叉分析 ═══\n\n';
    crossAnalysis += '【面相发现】\n' + diagnosisText.substring(0, 200) + '\n\n';

    if(paipanText && paipanText !== '排盘结果将显示在此'){
      crossAnalysis += '【八字格局】\n' + paipanText + '\n\n';

      // 简单交叉规则
      if(diagnosisText.indexOf('心') >= 0 && paipanText.indexOf('火') >= 0){
        crossAnalysis += '⚠️ 面相心区异常 + 八字火旺 → 心血管风险倍增，建议心电图\n';
      }
      if(diagnosisText.indexOf('肝') >= 0 && paipanText.indexOf('木') >= 0){
        crossAnalysis += '⚠️ 面相肝区异常 + 八字木旺 → 肝郁化火，建议疏肝理气\n';
      }
      if(diagnosisText.indexOf('脾') >= 0 && paipanText.indexOf('土') >= 0){
        crossAnalysis += '📍 面相脾区异常 + 八字土旺 → 脾胃湿热，注意饮食\n';
      }
      if(diagnosisText.indexOf('肾') >= 0 && paipanText.indexOf('水') >= 0){
        crossAnalysis += '📍 面相肾区异常 + 八字水旺 → 肾虚水泛，注意腰膝\n';
      }
      if(diagnosisText.indexOf('肺') >= 0 && paipanText.indexOf('金') >= 0){
        crossAnalysis += '📍 面相肺区异常 + 八字金旺 → 肺气壅滞，注意呼吸\n';
      }
    } else {
      crossAnalysis += '⚠️ 未输入八字数据，仅面相分析\n请先排盘后再做命相同参\n';
    }

    crossAnalysis += '\n═══ 路总理念：面相看活态，八字看格局，交叉验证最准 ═══';

    var crossEl = document.getElementById('wz-mingxiang-result');
    if(crossEl){
      crossEl.innerHTML = '<pre style="white-space:pre-wrap;font-size:12px;line-height:1.7">'+crossAnalysis+'</pre>';
      crossEl.style.display = 'block';
    }

    // TTS 播报关键发现
    speakText('命相同参分析完成，请查看结果');
  }

  // ===== 暴露 API =====
  window.wangzhenClinical = {
    init: function(){
      loadPatientList();
      // 检查浏览器能力
      var caps = [];
      if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) caps.push('📷摄像头');
      if(window.SpeechRecognition || window.webkitSpeechRecognition) caps.push('🎤语音');
      if(window.fetch) caps.push('🔗API');
      var capEl = document.getElementById('wz-capabilities');
      if(capEl) capEl.textContent = caps.length > 0 ? '✅ 已启用: ' + caps.join(' ') : '⚠️ 浏览器能力受限';
    },

    selectPatient: selectPatient,
    startCamera: startCamera,
    stopCamera: stopCamera,
    capturePhoto: capturePhoto,
    toggleVoiceInput: toggleVoiceInput,
    saveDiagnosis: saveDiagnosis,
    generateReport: generateReport,
    runMingxiang: runMingxiang,
    speakText: speakText,
    fetchPaipan: fetchPaipan,

    fetchBazi: function(){
      var year = document.getElementById('wz-bazi-year') ? document.getElementById('wz-bazi-year').value : '';
      var month = document.getElementById('wz-bazi-month') ? document.getElementById('wz-bazi-month').value : '';
      var day = document.getElementById('wz-bazi-day') ? document.getElementById('wz-bazi-day').value : '';
      var hour = document.getElementById('wz-bazi-hour') ? document.getElementById('wz-bazi-hour').value : '';
      if(!year || !month || !day){
        showToast('请输入完整的出生年月日', 'warning');
        return;
      }
      fetchPaipan({ year: year, month: month, day: day, hour: hour || '0' });
    }
  };

  // 自动初始化
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){ window.wangzhenClinical.init(); });
  } else {
    window.wangzhenClinical.init();
  }
})();
