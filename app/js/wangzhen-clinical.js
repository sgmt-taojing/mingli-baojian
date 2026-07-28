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

  // ===== 新建患者 =====
  function toggleNewPatientForm(){
    var form = document.getElementById('wz-new-patient-form');
    if(form) form.style.display = form.style.display === 'none' ? 'block' : 'none';
    // 初始化八字下拉
    var ySel = document.getElementById('np-byear');
    if(ySel && ySel.options.length <= 1){
      for(var y = 1940; y <= 2025; y++){
        var o = document.createElement('option'); o.value = y; o.textContent = y; ySel.appendChild(o);
      }
      var mSel = document.getElementById('np-bmonth');
      for(var m = 1; m <= 12; m++){ var o = document.createElement('option'); o.value = m; o.textContent = m; mSel.appendChild(o); }
      var dSel = document.getElementById('np-bday');
      for(var d = 1; d <= 31; d++){ var o = document.createElement('option'); o.value = d; o.textContent = d; dSel.appendChild(o); }
      var hSel = document.getElementById('np-bhour');
      var hours = [['子',0],['丑',1],['寅',3],['卯',5],['辰',7],['巳',9],['午',11],['未',13],['申',15],['酉',17],['戌',19],['亥',21]];
      hours.forEach(function(h){ var o = document.createElement('option'); o.value = h[1]; o.textContent = h[0]+'时'; hSel.appendChild(o); });
    }
  }

  function saveNewPatient(){
    var name = (document.getElementById('np-name') || {}).value || '';
    if(!name){ showToast('请填写姓名', 'warning'); return; }
    var pt = {
      id: Date.now(),
      name: name,
      gender: (document.getElementById('np-gender') || {}).value || '',
      age: (document.getElementById('np-age') || {}).value || '',
      phone: (document.getElementById('np-phone') || {}).value || '',
      chief: (document.getElementById('np-chief') || {}).value || '',
      bazi: {
        y: (document.getElementById('np-byear') || {}).value || '',
        m: (document.getElementById('np-bmonth') || {}).value || '',
        d: (document.getElementById('np-bday') || {}).value || '',
        h: (document.getElementById('np-bhour') || {}).value || ''
      },
      createdAt: new Date().toISOString()
    };
    var list = [];
    try { list = JSON.parse(localStorage.getItem('mlbj_doctor_patients') || '[]'); } catch(e) {}
    list.unshift(pt);
    localStorage.setItem('mlbj_doctor_patients', JSON.stringify(list.slice(0, 100)));
    // 清空表单
    ['np-name','np-age','np-phone','np-chief'].forEach(function(id){ var el = document.getElementById(id); if(el) el.value = ''; });
    document.getElementById('wz-new-patient-form').style.display = 'none';
    // 刷新列表
    loadPatientList();
    // 自动选中
    selectPatient(pt.id, pt.name);
    showToast('✅ 患者已保存: ' + name);
  }

  // ===== 医嘱模板 =====
  function insertTemplate(type){
    var textarea = document.getElementById('wz-voice-text');
    if(!textarea) return;
    var templates = {
      prescription: '\n【处方医嘱】\n1. 方剂：________\n2. 用法：每日一剂，水煎服，早晚分服\n3. 疗程：7剂\n4. 禁忌：忌辛辣生冷\n',
      lifestyle: '\n【调养建议】\n1. 起居：早睡早起，避免熬夜\n2. 饮食：清淡为主，少油少盐\n3. 运动：适量有氧运动，每日30分钟\n4. 情志：保持心情舒畅，避免暴怒\n',
      followup: '\n【复诊安排】\n复诊时间：____年__月__日\n复诊目的：观察疗效，调整方剂\n注意事项：复诊前空腹，带上次处方\n',
      warning: '\n【注意事项】\n⚠️ 如出现以下情况请立即就医：\n1. 持续高热不退\n2. 剧烈疼痛加剧\n3. 呼吸困难\n4. 意识改变\n本方案为辅助调理，不可替代正规治疗\n'
    };
    var text = templates[type] || '';
    textarea.value += text;
    textarea.focus();
    textarea.scrollTop = textarea.scrollHeight;
  }

  // ===== 病例详情查看 =====
  function showCaseDetail(idx){
    var history = [];
    try { history = JSON.parse(localStorage.getItem('wz_diagnosis_history') || '[]'); } catch(e) {}
    if(idx < 0 || idx >= history.length) return;
    var h = history[idx];
    var modal = document.getElementById('wz-case-detail-modal');
    var body = document.getElementById('wz-case-detail-body');
    if(!modal || !body) return;
    var time = h.timestamp ? new Date(h.timestamp).toLocaleString('zh-CN') : '';
    var html = '<div style="font-size:16px;color:#c9a84c;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid rgba(201,168,76,.2)">📋 病例详情</div>';
    html += '<div style="font-size:12px;color:#a09888;margin-bottom:8px">时间：' + time + '</div>';
    if(h.patient_name) html += '<div style="font-size:12px;color:#63b3ed;margin-bottom:8px">患者：' + h.patient_name + '</div>';
    if(h.diagnosis_text) html += '<div style="font-size:12px;margin-bottom:10px"><b style="color:#e8e0d0">望诊诊断：</b><br>' + h.diagnosis_text.replace(/\n/g,'<br>') + '</div>';
    if(h.ai_analysis) html += '<div style="font-size:12px;margin-bottom:10px"><b style="color:#e8e0d0">AI分析：</b><br>' + h.ai_analysis.replace(/\n/g,'<br>') + '</div>';
    if(h.voice_notes) html += '<div style="font-size:12px;margin-bottom:10px"><b style="color:#e8e0d0">医嘱记录：</b><br>' + h.voice_notes.replace(/\n/g,'<br>') + '</div>';
    html += '<button class="btn btn-secondary" onclick="window.wangzhenClinical.exportCase(' + idx + ')" style="margin-top:8px">📥 导出此病例</button>';
    body.innerHTML = html;
    modal.style.display = 'flex';
  }

  function exportCase(idx){
    var history = [];
    try { history = JSON.parse(localStorage.getItem('wz_diagnosis_history') || '[]'); } catch(e) {}
    if(idx < 0 || idx >= history.length) return;
    var h = history[idx];
    var text = '命理宝鉴 · 望诊病例\n\n';
    text += '时间：' + (h.timestamp ? new Date(h.timestamp).toLocaleString('zh-CN') : '') + '\n';
    if(h.patient_name) text += '患者：' + h.patient_name + '\n';
    if(h.diagnosis_text) text += '\n【望诊诊断】\n' + h.diagnosis_text + '\n';
    if(h.ai_analysis) text += '\n【AI分析】\n' + h.ai_analysis + '\n';
    if(h.voice_notes) text += '\n【医嘱记录】\n' + h.voice_notes + '\n';
    text += '\n═══ 本报告仅为辅助诊断参考 ═══\n';
    var blob = new Blob([text], {type: 'text/plain;charset=utf-8'});
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = '病例_' + (h.patient_name || 'unknown') + '_' + (h.timestamp||'').substring(0,10) + '.txt';
    a.click();
    URL.revokeObjectURL(a.href);
    showToast('✅ 病例已导出');
  }

  var currentPatient = null;

  function loadPatientList(){
    // 中医端患者管理 — 使用 localStorage（与 doctor-elder 共享）
    var list = [];
    try { list = JSON.parse(localStorage.getItem('mlbj_doctor_patients') || '[]'); } catch(e) {}
    renderPatientList(list);
  }

  function renderPatientList(list){
    var container = document.getElementById('wz-patient-list');
    if(!container) return;
    if(!list || list.length === 0){
      container.innerHTML = '<div class="wz-empty">暂无患者，请先在接诊台创建</div>';
      return;
    }
    var html = '';
    list.forEach(function(p){
      var name = p.name || '未知';
      var age = p.age || '?';
      var gender = p.gender === 'male' ? '男' : p.gender === 'female' ? '女' : '·';
      var chief = p.chief || '';
      var hasBazi = (p.bazi && p.bazi.y) ? '📅' : '📝';
      html += '<div class="wz-patient-card" onclick="window.wangzhenClinical.selectPatient('+p.id+',\''+name.replace(/'/g,'')+'\')">';
      html += '<div class="wz-patient-name">'+name+' '+gender+' '+age+'岁 '+hasBazi+'</div>';
      if(chief) html += '<div class="wz-patient-tag">主诉:'+chief.substring(0,20)+'</div>';
      html += '</div>';
    });
    container.innerHTML = html;
  }

  function selectPatient(userId, name){
    // 从 localStorage 加载患者数据
    var list = [];
    try { list = JSON.parse(localStorage.getItem('mlbj_doctor_patients') || '[]'); } catch(e) {}
    var p = list.find(function(x){ return x.id === userId; });
    if(!p){
      // 新患者
      currentPatient = { id: userId, name: name };
      var el = document.getElementById('wz-current-patient');
      if(el) el.textContent = name;
      var detailEl = document.getElementById('wz-patient-detail');
      if(detailEl) detailEl.innerHTML = '<span class="muted">新患者，请填写信息</span>';
      showToast('新患者: ' + name);
      return;
    }
    currentPatient = p;
    var el = document.getElementById('wz-current-patient');
    if(el) el.textContent = p.name + ' ('+(p.age||'?')+'岁)';
    var detailEl = document.getElementById('wz-patient-detail');
    if(detailEl){
      var html = '';
      if(p.gender) html += '<div class="pd-row"><span>性别</span><b>'+(p.gender==='male'?'男':p.gender==='female'?'女':'-')+'</b></div>';
      if(p.age) html += '<div class="pd-row"><span>年龄</span><b>'+p.age+'</b></div>';
      if(p.phone) html += '<div class="pd-row"><span>电话</span><b>'+p.phone+'</b></div>';
      if(p.chief) html += '<div class="pd-row"><span>主诉</span><b>'+p.chief+'</b></div>';
      if(p.bazi && p.bazi.y) html += '<div class="pd-row"><span>八字</span><b>'+p.bazi.y+'-'+p.bazi.m+'-'+p.bazi.d+'-'+p.bazi.h+'</b></div>';
      detailEl.innerHTML = html || '<span class="muted">无详细数据</span>';
    }
    // 自动填充八字输入
    if(p.bazi && p.bazi.y){
      var ySel = document.getElementById('wz-bazi-year');
      var mSel = document.getElementById('wz-bazi-month');
      var dSel = document.getElementById('wz-bazi-day');
      var hSel = document.getElementById('wz-bazi-hour');
      if(ySel) ySel.value = p.bazi.y;
      if(mSel) mSel.value = p.bazi.m;
      if(dSel) dSel.value = p.bazi.d;
      if(hSel) hSel.value = p.bazi.h;
      // 自动排盘
      window.wangzhenClinical.fetchBazi();
    }
    showToast('已选择患者: ' + p.name);
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
    if(!window.fetch) return; // jsdom guard
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
    // 兼容多种 API 返回格式
    var dayMaster = d.day_master || d.dayMaster || d.gan_zhi_day || '';
    var wuxing = d.wuxing || d.wu_xing || d.elements || '';
    var xiYong = d.xi_yong || d.xiYong || d.favorable || '';
    var siZhu = d.siju || d.si_zhu || d.four_pillars || d.bazi || '';
    var zodiac = d.zodiac || d.sheng_xiao || '';
    
    // 如果 API 返回字符串格式
    if(typeof d === 'string') { container.innerHTML = '<pre style="font-size:11px;white-space:pre-wrap">'+d+'</pre>'; return; }
    
    var html = '';
    if(siZhu) html += '<div class="pd-row"><span>四柱</span><b>' + (typeof siZhu === 'string' ? siZhu : JSON.stringify(siZhu).replace(/[{"}]/g,' ')) + '</b></div>';
    if(dayMaster) html += '<div class="pd-row"><span>日主</span><b>' + dayMaster + '</b></div>';
    if(wuxing){
      var wstr = typeof wuxing === 'object' ? Object.keys(wuxing).map(function(k){ return k+':'+wuxing[k]; }).join(' ') : String(wuxing);
      html += '<div class="pd-row"><span>五行</span><b>' + wstr + '</b></div>';
    }
    if(xiYong) html += '<div class="pd-row"><span>喜用</span><b style="color:#10b981">' + xiYong + '</b></div>';
    if(zodiac) html += '<div class="pd-row"><span>生肖</span><b>' + zodiac + '</b></div>';
    container.innerHTML = html || '<span class="muted">排盘结果将显示在此</span>';
    
    // 保存到 currentPatient
    if(currentPatient){
      currentPatient.dayMaster = dayMaster;
      currentPatient.wuxing = wuxing;
      currentPatient.xiYong = xiYong;
    }
  }

  // ===== 保存诊断到病例 =====
  function saveDiagnosis(){
    if(!currentPatient || !currentPatient.id){
      showToast('请先选择患者', 'warning');
      return;
    }

    // 收集诊断结果
    var resultPanel = document.getElementById('wangzhen-result-panel');
    var diagnosisText = resultPanel ? resultPanel.innerText : '';
    var voiceText = (document.getElementById('wz-voice-text') || {}).value || '';
    var aiResult = (document.getElementById('wz-ai-result') || {}).innerText || '';

    var payload = {
      patient_id: currentPatient.id || currentPatient.user_id || 0,
      patient_name: currentPatient.name || '',
      diagnosis_type: 'wangzhen',
      diagnosis_text: diagnosisText,
      voice_notes: voiceText,
      ai_analysis: aiResult,
      kb_source: 'wangzhen-kb-data.json',
      timestamp: new Date().toISOString()
    };
    saveToLocal(payload);
    showToast('✅ 诊断已保存');
    renderSavedCases(payload.patient_id);
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

    var history = [];
    try { history = JSON.parse(localStorage.getItem('wz_diagnosis_history') || '[]'); } catch(e) {}
    // 过滤当前患者的诊断
    var patientCases = history.filter(function(h){ return h.patient_id === userId; });
    if(patientCases.length === 0){
      container.innerHTML = '<div class="wz-empty">暂无历史病例</div>';
      return;
    }
    var html = '';
    patientCases.forEach(function(h, i){
      var realIdx = history.indexOf(h);
      html += '<div class="wz-case-item" onclick="window.wangzhenClinical.showCaseDetail(' + realIdx + ')" style="cursor:pointer">';
      html += '<div class="wz-case-date">'+(h.timestamp||'').substring(0,16)+'</div>';
      html += '<div class="wz-case-text">'+(h.diagnosis_text||'').substring(0,80)+'...</div>';
      html += '</div>';
    });
    container.innerHTML = html;
  }

  // ===== 生成报告 =====
  function generateReport(){
    if(!currentPatient || !currentPatient.id){
      showToast('请先选择患者', 'warning');
      return;
    }

    var resultPanel = document.getElementById('wangzhen-result-panel');
    var diagnosisText = resultPanel ? resultPanel.innerText : '';
    var voiceText = (document.getElementById('wz-voice-text') || {}).value || '';
    var aiResult = (document.getElementById('wz-ai-result') || {}).innerText || '';
    var paipanText = (document.getElementById('wz-paipan-result') || {}).innerText || '';

    var report = '═══ 命理宝鉴 · 望诊报告 ═══\n\n';
    report += '患者：' + (currentPatient.name || '') + '\n';
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
      win.document.write('<div style="margin:16px 0;text-align:center"><button onclick="window.print()" style="padding:10px 30px;font-size:14px;cursor:pointer;border:1px solid #c9a84c;background:#c9a84c;color:#fff;border-radius:6px">🖨️ 打印报告</button> <button onclick="window.close()" style="padding:10px 20px;font-size:14px;cursor:pointer;border:1px solid #ddd;background:#fff;color:#333;border-radius:6px">关闭</button></div>');
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
    if(!currentPatient || !currentPatient.id){
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

    var westernDiag = (document.getElementById('wz-western-diag') || {}).value || '';
    var crossAnalysis = '═══ 综合会诊分析 ═══\n\n';
    if(westernDiag){
      crossAnalysis += '【西医诊断】\n' + westernDiag + '\n\n';
    }

    crossAnalysis += '【面相发现】\n' + diagnosisText.substring(0, 200) + '\n\n';

    if(paipanText && paipanText !== '排盘结果将显示在此'){
      crossAnalysis += '【八字格局】\n' + paipanText + '\n\n';

      // 简单交叉规则
      // 扩充命相同参规则（12条）
    var organText = diagnosisText;
    var baziText = paipanText + (paipanText.indexOf('八字格局') >= 0 ? '' : '');
    if(organText.indexOf('心') >= 0 && baziText.indexOf('火') >= 0){
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
      // 扩充规则
      if(organText.indexOf('脾') >= 0 && organText.indexOf('湿') >= 0){
        crossAnalysis += '📍 面相脾区湿象 + 脾虚 → 痰湿内蕴，健脾化湿\n';
      }
      if(organText.indexOf('肝') >= 0 && organText.indexOf('郁') >= 0){
        crossAnalysis += '📍 面相肝区郁象 + 肝郁 → 气滞血瘀，疏肝理气\n';
      }
      if(organText.indexOf('肾') >= 0 && organText.indexOf('寒') >= 0){
        crossAnalysis += '📍 面相肾区寒象 + 肾阳虚 → 命门火衰，温补肾阳\n';
      }
      if(organText.indexOf('心') >= 0 && organText.indexOf('失眠') >= 0){
        crossAnalysis += '📍 面相心区异常 + 心火扰神 → 心肾不交，交通心肾\n';
      }
      if(organText.indexOf('胃') >= 0 && organText.indexOf('热') >= 0){
        crossAnalysis += '📍 面相胃区热象 + 胃火 → 胃热炽盛，清胃泻火\n';
      }
      if(organText.indexOf('大肠') >= 0 && organText.indexOf('便秘') >= 0){
        crossAnalysis += '📍 面相大肠区异常 + 肠燥 → 津亏便秘，润肠通便\n';
      }
      if(organText.indexOf('胆') >= 0 && organText.indexOf('结') >= 0){
        crossAnalysis += '⚠️ 面相胆区结节 + 胆结石风险 → 建议B超确诊\n';
      }
    } else {
      crossAnalysis += '⚠️ 未输入八字数据，仅面相分析\n请先排盘后再做命相同参\n';
    }

    if(westernDiag){
      // 西医诊断 × 中医望诊 联动
      if(westernDiag.indexOf('结石') >= 0 && diagnosisText.indexOf('胆') >= 0){
        crossAnalysis += '\n⚠️ 西医确认结石 + 面诊胆区异常 → 胆结石确诊，建议中医疏肝利胆排石理疗';
      }
      if(westernDiag.indexOf('心电图') >= 0 || westernDiag.indexOf('冠心病') >= 0){
        crossAnalysis += '\n⚠️ 西医心血管诊断 + 面诊心区异常 → 心血管风险确认，中医温阳通脉理疗';
      }
      if(westernDiag.indexOf('胃炎') >= 0 || westernDiag.indexOf('资生素') >= 0){
        crossAnalysis += '\n⚠️ 西医胃部诊断 + 面诊脾胃区异常 → 脾胃同治，中医健脾和胃理疗';
      }
      if(westernDiag.indexOf('贫血') >= 0 || westernDiag.indexOf('贫血症') >= 0){
        crossAnalysis += '\n⚠️ 西医贫血诊断 + 面诊面色苍白 → 气血两虚，中医补益气血理疗';
      }
    }
    crossAnalysis += '\n═══ 路总理念：面相看活态，八字看格局，西医看器质，三者交叉验证最准 ═══';

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

    toggleNewPatientForm: toggleNewPatientForm,
    saveNewPatient: saveNewPatient,
    insertTemplate: insertTemplate,
    showCaseDetail: showCaseDetail,
    exportCase: exportCase,
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
