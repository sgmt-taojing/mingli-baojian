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
    // 初始化年下拉
    var ySel = document.getElementById('np-byear');
    if(ySel && ySel.options.length <= 1){
      for(var y = 1940; y <= 2025; y++){ var o = document.createElement('option'); o.value = y; o.textContent = y; ySel.appendChild(o); }
      var mSel = document.getElementById('np-bmonth');
      for(var m = 1; m <= 12; m++){ var o2 = document.createElement('option'); o2.value = m; o2.textContent = m; mSel.appendChild(o2); }
      var dSel = document.getElementById('np-bday');
      for(var d = 1; d <= 31; d++){ var o3 = document.createElement('option'); o3.value = d; o3.textContent = d; dSel.appendChild(o3); }
      var hSel = document.getElementById('np-bhour');
      var hours = [['子时',0],['丑时',1],['寅时',3],['卯时',5],['辰时',7],['巳时',9],['午时',11],['未时',13],['申时',15],['酉时',17],['戌时',19],['亥时',21]];
      hours.forEach(function(h){ var o4 = document.createElement('option'); o4.value = h[1]; o4.textContent = h[0]; hSel.appendChild(o4); });
    }
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
    enumCameras();
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


  // ===== 步骤引导管理 =====
  var currentStep = 1;
  var completedSteps = {};

  function goStep(step){
    currentStep = step;
    updateStepper();
    // 滚动到对应区域
    var targets = { 1: '.wz-layout aside', 2: '#wz-camera-video', 3: '#wangzhen-zone-map', 4: '.wz-mingxiang-section', 5: '#wz-saved-cases' };
    var sel = targets[step];
    if(sel){
      var el = document.querySelector(sel);
      if(el){
        if(el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // 闪烁高亮
        el.style.transition = 'box-shadow .3s';
        el.style.boxShadow = '0 0 0 2px var(--wz-gold)';
        setTimeout(function(){ el.style.boxShadow = ''; }, 2000);
      }
    }
  }

  function completeStep(step){
    completedSteps[step] = true;
    updateStepper();
    // 自动跳到下一步
    if(step < 5){
      setTimeout(function(){ goStep(step + 1); }, 500);
    }
  }

  function updateStepper(){
    var steps = document.querySelectorAll('.wz-step');
    steps.forEach(function(s){
      var n = parseInt(s.dataset.step);
      s.classList.toggle('active', n === currentStep);
      s.classList.toggle('done', !!completedSteps[n]);
      if(completedSteps[n]){
        var num = s.querySelector('.wz-step-num');
        if(num) num.textContent = '✓';
      } else {
        var num2 = s.querySelector('.wz-step-num');
        if(num2) num2.textContent = n;
      }
    });
  }


  // ===== 历法切换 =====
  var calendarMode = 'solar'; // 'solar' or 'lunar'
  var baziCalendarMode = 'solar';

  function switchCalendar(mode){
    calendarMode = mode;
    var btns = document.querySelectorAll('#np-cal-switch button');
    btns.forEach(function(b){ b.classList.toggle('active', b.textContent === (mode === 'solar' ? '阳历' : '农历')); });
    var lunarExtra = document.getElementById('np-lunar-months');
    if(lunarExtra) lunarExtra.style.display = mode === 'lunar' ? 'block' : 'none';
    // 更新月选项文字
    var mSel = document.getElementById('np-bmonth');
    if(mSel){
      var months = mode === 'lunar'
        ? ['正月','二月','三月','四月','五月','六月','七月','八月','九月','十月','冬月','腊月']
        : ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
      mSel.innerHTML = '<option value="">月</option>';
      months.forEach(function(m, i){ var o = document.createElement('option'); o.value = i+1; o.textContent = m; mSel.appendChild(o); });
    }
  }

  function switchBaziCal(mode){
    baziCalendarMode = mode;
    var btns = document.querySelectorAll('#wz-bazi-cal-switch button');
    btns.forEach(function(b){ b.classList.toggle('active', b.textContent === (mode === 'solar' ? '阳历' : '农历')); });
  }

  // ===== 症状点选 =====
  function addSymptom(text){
    var textarea = document.getElementById('np-chief');
    if(!textarea) return;
    var current = textarea.value.trim();
    if(current && current.indexOf(text) < 0){
      textarea.value = current + '、' + text;
    } else if(!current){
      textarea.value = text;
    }
    // 闪一下
    textarea.style.borderColor = 'var(--wz-gold)';
    setTimeout(function(){ textarea.style.borderColor = ''; }, 500);
  }

  // ===== 语音输入（通用，可填任意字段）=====
  function startVoiceInput(targetId){
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if(!SR){ showToast('浏览器不支持语音输入，请使用 Chrome 或 Edge', 'warning'); return; }
    var rec = new SR();
    rec.lang = 'zh-CN';
    rec.continuous = false;
    rec.interimResults = true;
    var textarea = document.getElementById(targetId);
    if(!textarea) return;
    var finalText = textarea.value;

    rec.onresult = function(event){
      var interim = '';
      for(var i = event.resultIndex; i < event.results.length; i++){
        if(event.results[i].isFinal){
          finalText += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      textarea.value = finalText + interim;
    };

    rec.onerror = function(event){
      showToast('语音识别错误: ' + event.error, 'error');
    };

    rec.onend = function(){};

    rec.start();
    showToast('🎤 请说话...');
    // 视觉反馈
    textarea.style.borderColor = 'var(--wz-jade)';
    setTimeout(function(){ textarea.style.borderColor = ''; }, 3000);
  }


  // ===== 白话健康解读（将八字/紫微结果翻译成中医白话）=====
  function renderHealthSummary(paipanData, ziweiData){
    var container = document.getElementById('wz-health-summary');
    if(!container) return;
    if(!paipanData || !paipanData.day_master){
      container.innerHTML = '<div class="muted">排盘数据不完整</div>';
      return;
    }

    var dm = paipanData.day_master || '';
    var dmEle = dm.replace(/[^木火土金水]/g, '');
    var wxScore = paipanData.wuxing_score || {};
    var wxLack = paipanData.wuxing_lack || [];
    var zodiac = paipanData.input ? (paipanData.input.shengxiao || '') : '';

    // 五行→脏腑映射（白话）
    var organMap = { '木':'肝胆', '火':'心血管', '土':'脾胃消化', '金':'肺呼吸', '水':'肾泌尿生殖' };
    var weaknessMap = { '木':'容易肝郁气滞，注意情绪管理', '火':'心气不足，注意心血管', '土':'脾胃虚弱，注意饮食', '金':'肺气虚，注意呼吸系统', '水':'肾气不足，注意腰膝' };
    var excessMap = { '木':'肝火偏旺，易怒失眠', '火':'心火亢盛，口疮心烦', '土':'脾胃湿热，易长痘', '金':'肺气壅滞，咳嗽痰多', '水':'水湿泛滥，水肿痰饮' };

    var html = '<div style="padding:10px;background:rgba(16,185,129,.06);border:1px solid rgba(16,185,129,.15);border-radius:8px">';

    // 体质判断
    html += '<div style="font-size:13px;color:var(--wz-jade);font-weight:600;margin-bottom:6px">📋 体质评估</div>';
    html += '<div style="font-size:12px;line-height:1.8">';

    // 日主
    if(dmEle){
      html += '体质偏性：以<b style="color:var(--wz-gold)">' + dmEle + '</b>为核心体质';
      var organName = organMap[dmEle] || '';
      if(organName) html += '（对应脏腑：<b style="color:var(--wz-cyan)">' + organName + '</b>）';
      html += '<br>';
    }

    // 五行偏盛偏衰 → 白话
    var strongElements = [];
    var weakElements = [];
    Object.keys(wxScore).forEach(function(k){
      var score = wxScore[k];
      if(score > 3) strongElements.push(k);
      if(score < 1.5) weakElements.push(k);
    });

    if(strongElements.length > 0){
      html += '偏强：' + strongElements.map(function(e){ return organMap[e] + '(' + e + '=' + wxScore[e] + ')'; }).join('、') + '<br>';
      html += '<span style="color:#fbbf24">⚠️ ' + strongElements.map(function(e){ return excessMap[e] || ''; }).join('；') + '</span><br>';
    }
    if(weakElements.length > 0 || wxLack.length > 0){
      var allWeak = weakElements.concat(wxLack.filter(function(e){ return weakElements.indexOf(e) < 0; }));
      html += '偏弱：' + allWeak.map(function(e){ return organMap[e] + '(' + e + (wxScore[e]!==undefined?'='+wxScore[e]:'缺失') + ')'; }).join('、') + '<br>';
      html += '<span style="color:var(--wz-jade)">💡 ' + allWeak.map(function(e){ return weaknessMap[e] || ''; }).join('；') + '</span><br>';
    }

    // 生肖
    if(zodiac) html += '生肖：' + zodiac + '<br>';

    html += '</div></div>';

    // 紫微健康提示（如果有）
    if(ziweiData && ziweiData.palaces){
      var mingStar = ziweiData.palaces[0].stars[0] || '';
      var starNames = {ziwei:'紫微',tianji:'天机',taiyang:'太阳',wuqu:'武曲',lianzhen:'廉贞',tianfu:'天府',taiyin:'太阴',tanlang:'贪狼',jumen:'巨门',tianxiang:'天相',tianliang:'天梁',qisha:'七杀',pojun:'破军'};
      var starHealthMap = {
        '紫微':'体质偏热，注意心脑血管', '天机':'神经敏感，注意失眠头痛', '太阳':'阳气旺盛，注意眼部和心脏',
        '武曲':'体质偏刚，注意肺和大肠', '廉贞':'湿热体质，注意皮肤和血液', '天府':'体质稳健，注意脾胃',
        '太阴':'体质偏寒，注意妇科和肾', '贪狼':'体质偏湿，注意肝胆和泌尿', '巨门':'消化偏弱，注意脾胃口腔',
        '天相':'体质调和，注意皮肤', '天梁':'体质偏燥，注意肺和神经', '七杀':'体质刚烈，注意肝胆和外伤',
        '破军':'体质多变，注意免疫和肠胃'
      };
      var starName = starNames[mingStar] || '';
      var healthTip = starHealthMap[starName] || '';
      if(starName){
        html += '<div style="margin-top:8px;padding:8px;background:rgba(99,179,237,.06);border:1px solid rgba(99,179,237,.12);border-radius:6px">';
        html += '<div style="font-size:11px;color:var(--wz-cyan)">辅助体质参考：' + starName + '星入命 — ' + healthTip + '</div>';
        html += '</div>';
      }
    }

    container.innerHTML = html;

    // 更新排盘状态
    var status = document.getElementById('wz-paipan-status');
    if(status){ status.textContent = '✅ 已完成'; status.style.background = 'rgba(16,185,129,.15)'; }
  }

  // ===== 综合体质分析 =====
  function runComprehensiveAnalysis(){
    var westernDiag = (document.getElementById('wz-western-diag') || {}).value || '';
    var healthSummary = (document.getElementById('wz-health-summary') || {}).textContent || '';
    var diagnosisText = (document.getElementById('wangzhen-result-panel') || {}).textContent || '';
    var aiResult = (document.getElementById('wz-ai-result') || {}).textContent || '';

    var html = '<div style="padding:10px;background:rgba(201,168,76,.06);border:1px solid rgba(201,168,76,.15);border-radius:8px">';
    html += '<div style="font-size:13px;color:var(--wz-gold);font-weight:600;margin-bottom:8px">🔍 综合体质分析报告</div>';

    // 1. 望诊发现
    if(diagnosisText) html += '<div style="margin-bottom:8px"><b style="color:var(--wz-paper)">望诊发现：</b><br>' + diagnosisText.substring(0,200).replace(/\n/g,'<br>') + '</div>';

    // 2. 体质评估
    if(healthSummary) html += '<div style="margin-bottom:8px"><b style="color:var(--wz-paper)">体质评估：</b><br>' + healthSummary.substring(0,200).replace(/\n/g,'<br>') + '</div>';

    // 3. 西医诊断
    if(westernDiag) html += '<div style="margin-bottom:8px"><b style="color:var(--wz-paper)">西医诊断：</b><br>' + westernDiag + '</div>';

    // 4. 综合建议
    html += '<div style="margin-bottom:8px"><b style="color:var(--wz-jade)">综合建议：</b><br>';
    if(healthSummary.indexOf('肝') >= 0) html += '• 疏肝理气，保持情绪舒畅<br>';
    if(healthSummary.indexOf('心') >= 0) html += '• 养心安神，避免熬夜<br>';
    if(healthSummary.indexOf('脾') >= 0 || healthSummary.indexOf('胃') >= 0) html += '• 健脾和胃，饮食规律<br>';
    if(healthSummary.indexOf('肺') >= 0) html += '• 补益肺气，注意保暖<br>';
    if(healthSummary.indexOf('肾') >= 0) html += '• 补肾固本，避免过劳<br>';
    html += '</div>';

    html += '</div>';

    var container = document.getElementById('wz-health-analysis');
    if(container) container.innerHTML = html;

    // 生成治疗方案
    generateTreatmentPlan(healthSummary, westernDiag, diagnosisText);

    completeStep(4);
  }

  // ===== 治疗方案（综合知识库）=====
  function generateTreatmentPlan(health, western, diagnosis){
    var container = document.getElementById('wz-treatment-plan');
    if(!container) return;

    var html = '<div style="line-height:1.8">';

    // 从知识库推荐理疗方案
    if(window.WANGZHEN_KB && window.WANGZHEN_KB.data){
      var plans = window.WANGZHEN_KB.data.filter(function(d){ return d.category === '理疗' && d.disease; });
      // 根据诊断文字匹配
      var matched = [];
      var allText = health + western + diagnosis;
      plans.forEach(function(p){
        var disease = p.disease || '';
        if(allText.indexOf(disease.substring(0,2)) >= 0 || (p.keyword && p.keyword.split(',').some(function(k){ return allText.indexOf(k) >= 0; }))){
          matched.push(p);
        }
      });
      // 如果没匹配到，取常见3个
      if(matched.length === 0 && plans.length > 0){
        matched = plans.slice(0, 3);
      }
      if(matched.length > 0){
        html += '<div style="margin-bottom:6px"><b style="color:var(--wz-jade)">推拿理疗：</b></div>';
        matched.slice(0, 3).forEach(function(p){
          html += '<div style="margin-bottom:4px;padding:6px;background:rgba(0,0,0,.15);border-radius:4px">';
          html += '<div style="color:var(--wz-paper);font-weight:600">' + (p.disease || p.title) + '</div>';
          html += '<div style="color:var(--wz-paper3)">' + (p.content || '').substring(0, 100) + '</div>';
          html += '</div>';
        });
      }
    }

    // 方剂推荐（从经典名方库 + 证候库匹配）
    var organFormulas = {
      '肝': [{name:'逍遥散',efficacy:'疏肝解郁，养血健脾',indications:'肝郁血虚脾弱，两胁作痛头痛目眩'},{name:'柴胡疏肝散',efficacy:'疏肝行气，活血止痛',indications:'肝气郁结，胸胁胀痛'},{name:'龙胆泻肝汤',efficacy:'泻肝胆实火，清下焦湿热',indications:'肝胆实火上炎，头痛目赤口苦'}],
      '心': [{name:'归脾汤',efficacy:'益气补血，健脾养心',indications:'心脾气血两虚，心悸失眠健忘'},{name:'天王补心丹',efficacy:'滋阴养血，补心安神',indications:'阴虚血少，心神不安'},{name:'酸枣仁汤',efficacy:'养血安神，清热除烦',indications:'虚劳虚烦不得眠'}],
      '脾': [{name:'四君子汤',efficacy:'益气健脾',indications:'脾胃气虚，面色萎白气短乏力'},{name:'参苓白术散',efficacy:'益气健脾，渗湿止泻',indications:'脾虚湿盛，食少便溏'},{name:'补中益气汤',efficacy:'补中益气，升阳举陷',indications:'脾胃气虚下陷，体倦乏力'}],
      '胃': [{name:'半夏泻心汤',efficacy:'寒热平调，消痞散结',indications:'寒热互结之痞证，心下痞呕吐'},{name:'保和丸',efficacy:'消食和胃',indications:'食积停滞，脘腹胀满嗳腐'},{name:'清胃散',efficacy:'清胃凉血',indications:'胃火牙痛，口气热臭'}],
      '肺': [{name:'玉屏风散',efficacy:'益气固表止汗',indications:'表虚自汗，易感冒'},{name:'杏苏散',efficacy:'清宣温燥，润肺止咳',indications:'外感温燥，头痛身热口渴'},{name:'百合固金汤',efficacy:'滋润肺肾，止咳化痰',indications:'肺肾阴虚，咳嗽痰血'}],
      '肾': [{name:'六味地黄丸',efficacy:'滋补肝肾',indications:'肝肾阴虚，腰膝酸软头晕耳鸣'},{name:'金匮肾气丸',efficacy:'温补肾阳',indications:'肾阳不足，腰痛脚软小便不利'},{name:'左归丸',efficacy:'滋阴补肾，填精益髓',indications:'真阴不足，头晕目眩腰酸'}]
    };
    
    var recommendedFormulas = [];
    var organText = health + ' ' + diagnosis + ' ' + western + ' ' + (document.getElementById('wangzhen-result-panel')||{}).textContent + ' ' + (document.getElementById('wz-ai-result')||{}).textContent;
    Object.keys(organFormulas).forEach(function(organ){
      if(organText.indexOf(organ) >= 0){
        organFormulas[organ].forEach(function(f){
          if(recommendedFormulas.length < 6){
            recommendedFormulas.push(f);
          }
        });
      }
    });
    
    if(recommendedFormulas.length > 0){
      html += '<div style="margin-bottom:6px"><b style="color:var(--wz-gold)">方剂推荐（经典名方库）：</b></div>';
      html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:6px;margin-bottom:8px">';
      recommendedFormulas.forEach(function(f){
        html += '<div style="padding:8px;border:1px solid rgba(201,168,76,.2);border-radius:6px;background:rgba(201,168,76,.04)">';
        html += '<div style="font-size:12px;color:var(--wz-gold);font-weight:600">' + f.name + '</div>';
        html += '<div style="font-size:10px;color:var(--wz-paper3);margin-top:2px">' + f.efficacy + '</div>';
        html += '<div style="font-size:10px;color:var(--wz-paper2);margin-top:2px">主治：' + f.indications.substring(0, 30) + '</div>';
        html += '</div>';
      });
      html += '</div>';
      html += '<div style="font-size:10px;color:var(--wz-paper3);margin-bottom:8px">💡 方剂仅供参考，需医生根据患者实际情况加减化裁。点击方名可在知识库中查看完整组成/剂量/禁忌。</div>';
    }

    // 食疗建议
    html += '<div style="margin-bottom:6px"><b style="color:var(--wz-jade)">食疗调养：</b></div>';
    if(health.indexOf('肝') >= 0) html += '• 菊花枸杞茶、芹菜、菠菜疏肝<br>';
    if(health.indexOf('心') >= 0) html += '• 莲子百合粥、酸枣仁安神<br>';
    if(health.indexOf('脾') >= 0 || health.indexOf('胃') >= 0) html += '• 山药薏米粥、陈皮健脾<br>';
    if(health.indexOf('肺') >= 0) html += '• 雪梨银耳羹、百合润肺<br>';
    if(health.indexOf('肾') >= 0) html += '• 黑芝麻核桃、枸杞补肾<br>';

    // 生活建议
    html += '<div style="margin-bottom:6px"><b style="color:var(--wz-jade)">生活调养：</b></div>';
    html += '• 规律作息，子午觉养生<br>';
    html += '• 适度运动，太极拳/八段锦<br>';
    html += '• 情志调畅，避免过悲过怒<br>';

    // 西医建议
    if(western){
      html += '<div style="margin-bottom:6px"><b style="color:var(--wz-cyan)">西医建议：</b></div>';
      html += '• 遵医嘱定期复查<br>';
      html += '• 配合中药调理，不可自行停药<br>';
    }

    html += '</div>';
    html += '<div style="margin-top:8px;padding:6px;background:rgba(239,68,68,.06);border:1px solid rgba(239,68,68,.15);border-radius:4px;font-size:10px;color:#fca5a5">⚠️ 以上方案为辅助参考，需医生确认后执行。患者端仅展示经医生确认的方案。</div>';

    container.innerHTML = html;

    // 显示确认按钮
    var actions = document.getElementById('wz-treatment-actions');
    if(actions) actions.style.display = 'flex';
  }

  // ===== 推送给周易大师 =====
  function pushToMaster(){
    if(!currentPatient || !currentPatient.name){
      showToast('请先选择患者', 'warning');
      return;
    }
    // 存储推送给大师的数据
    var pushData = {
      pushId: Date.now(),
      patientName: currentPatient.name,
      patientAge: currentPatient.age || '',
      patientGender: currentPatient.gender || '',
      chief: currentPatient.chief || currentPatient.chief || '',
      bazi: currentPatient.pillars || '',
      dayMaster: currentPatient.dayMaster || '',
      wuxing: currentPatient.wuxing || '',
      wuxingLack: currentPatient.wuxingLack || '',
      diagnosis: (document.getElementById('wangzhen-result-panel')||{}).textContent || '',
      westernDiag: (document.getElementById('wz-western-diag')||{}).value || '',
      timestamp: new Date().toISOString(),
      status: 'pending',
      masterReply: ''
    };
    // 保存到 localStorage
    var key = 'master_push_queue';
    var queue = [];
    try { queue = JSON.parse(localStorage.getItem(key) || '[]'); } catch(e) {}
    queue.unshift(pushData);
    if(queue.length > 20) queue = queue.slice(0, 20);
    localStorage.setItem(key, JSON.stringify(queue));

    showToast('✅ 已推送给周易大师，等待解读中...');
    var reply = document.getElementById('wz-master-reply');
    if(reply){
      reply.innerHTML = '<div style="padding:8px;background:rgba(99,179,237,.06);border:1px solid rgba(99,179,237,.12);border-radius:6px;font-size:12px"><div style="color:var(--wz-cyan)">📤 已推送（' + new Date().toLocaleTimeString('zh-CN') + '）</div><div style="color:var(--wz-paper3);margin-top:4px">大师解读完成后将自动同步回传。也可点击「刷新大师回复」手动获取。</div></div>';
    }
  }

  // ===== 刷新大师回复 =====
  function refreshMasterReply(){
    var queue = [];
    try { queue = JSON.parse(localStorage.getItem('master_push_queue') || '[]'); } catch(e) {}
    var reply = document.getElementById('wz-master-reply');
    if(!reply) return;

    if(queue.length === 0){
      reply.innerHTML = '<div style="font-size:11px;color:var(--wz-paper3)">暂无推送记录</div>';
      return;
    }

    var latest = queue[0];
    if(latest.masterReply){
      reply.innerHTML = '<div style="padding:10px;background:rgba(16,185,129,.06);border:1px solid rgba(16,185,129,.15);border-radius:6px"><div style="color:var(--wz-jade);font-weight:600;margin-bottom:4px">📨 大师回复（' + (latest.replyTime||'') + '）</div><div style="font-size:12px;line-height:1.7">' + latest.masterReply + '</div></div>';
      showToast('✅ 大师回复已同步');
    } else {
      reply.innerHTML = '<div style="padding:8px;background:rgba(245,158,11,.06);border:1px solid rgba(245,158,11,.15);border-radius:6px;font-size:12px;color:#fbbf24">⏳ 大师尚未回复，请稍后刷新</div>';
    }
  }

  // ===== 医生确认 → 推送给患者 =====
  function confirmAndPushToPatient(){
    if(!currentPatient || !currentPatient.name){
      showToast('请先选择患者', 'warning');
      return;
    }
    var plan = (document.getElementById('wz-treatment-plan')||{}).textContent || '';
    var diagnosis = (document.getElementById('wangzhen-result-panel')||{}).textContent || '';
    var health = (document.getElementById('wz-health-analysis')||{}).textContent || '';

    // 组装患者端内容（纯中医，无周易痕迹）
    var patientContent = '═══ 诊疗方案 ═══\n\n';
    patientContent += '患者：' + currentPatient.name + '\n';
    patientContent += '日期：' + new Date().toLocaleDateString('zh-CN') + '\n\n';
    patientContent += '【体质评估】\n' + ((document.getElementById('wz-health-summary')||{}).textContent || '').substring(0,200) + '\n\n';
    patientContent += '【望诊建议】\n' + diagnosis.substring(0,200) + '\n\n';
    patientContent += '【治疗方案】\n' + plan + '\n\n';
    patientContent += '【注意事项】\n如出现持续高热、剧烈疼痛、呼吸困难等请立即就医。\n本方案为辅助调理参考，不可替代正规治疗。\n';

    // 保存到患者推送队列
    var patientPush = {
      patientName: currentPatient.name,
      content: patientContent,
      timestamp: new Date().toISOString(),
      read: false
    };
    var key = 'patient_push_queue';
    var queue = [];
    try { queue = JSON.parse(localStorage.getItem(key) || '[]'); } catch(e) {}
    queue.unshift(patientPush);
    if(queue.length > 50) queue = queue.slice(0, 50);
    localStorage.setItem(key, JSON.stringify(queue));

    showToast('✅ 治疗方案已确认并推送给患者（患者端无周易内容）');
    completeStep(5);
  }


  // ===== 患者搜索 =====
  function searchPatient(keyword){
    var list = [];
    try { list = JSON.parse(localStorage.getItem('mlbj_doctor_patients') || '[]'); } catch(e) {}
    if(!keyword){
      renderPatientList(list);
      return;
    }
    var filtered = list.filter(function(p){
      var name = (p.name || '').toLowerCase();
      var chief = (p.chief || '').toLowerCase();
      var phone = (p.phone || '').toLowerCase();
      var kw = keyword.toLowerCase();
      return name.indexOf(kw) >= 0 || chief.indexOf(kw) >= 0 || phone.indexOf(kw) >= 0;
    });
    renderPatientList(filtered);
    // 更新计数
    var countEl = document.getElementById('wz-patient-count');
    if(countEl) countEl.textContent = filtered.length;
  }

  // ===== 复诊：显示上次就诊信息 =====
  function showFollowupInfo(patientId, patientName){
    var history = [];
    try { history = JSON.parse(localStorage.getItem('wz_diagnosis_history') || '[]'); } catch(e) {}
    var patientCases = history.filter(function(h){ return h.patient_id === patientId || h.patient_name === patientName; });
    
    var followupEl = document.getElementById('wz-followup-actions');
    var infoEl = document.getElementById('wz-last-visit-info');
    if(!followupEl) return;
    
    if(patientCases.length === 0){
      followupEl.style.display = 'none';
      return;
    }
    
    followupEl.style.display = 'block';
    var lastVisit = patientCases[0];
    var lastTime = lastVisit.timestamp ? new Date(lastVisit.timestamp).toLocaleDateString('zh-CN') : '';
    var visitCount = patientCases.length;
    
    if(infoEl){
      infoEl.innerHTML = '就诊次数：' + visitCount + '次 · 上次就诊：' + lastTime + '<br>上次诊断：' + (lastVisit.diagnosis_text || '').substring(0, 60) + '...';
    }
  }

  // ===== 开始复诊 =====
  function startFollowup(){
    if(!currentPatient || !currentPatient.id){
      showToast('请先选择患者', 'warning');
      return;
    }
    // 清空当前诊断区
    var resultPanel = document.getElementById('wangzhen-result-panel');
    if(resultPanel) resultPanel.innerHTML = '<div class="muted">复诊中，请重新进行望诊诊断</div>';
    var aiResult = document.getElementById('wz-ai-result');
    if(aiResult) aiResult.innerHTML = '';
    var voiceText = document.getElementById('wz-voice-text');
    if(voiceText) voiceText.value = '';
    var healthAnalysis = document.getElementById('wz-health-analysis');
    if(healthAnalysis) healthAnalysis.innerHTML = '';
    
    // 重置步骤
    completedSteps = {};
    currentStep = 2; // 从拍照开始（患者已知）
    updateStepper();
    
    showToast('🔄 复诊已启动，请从拍照采集开始');
    // 滚动到摄像头
    var camera = document.getElementById('wz-camera-video');
    if(camera){
      if(camera.scrollIntoView) camera.scrollIntoView({behavior:'smooth', block:'center'});
      camera.style.boxShadow = '0 0 0 2px var(--wz-gold)';
      setTimeout(function(){ camera.style.boxShadow = ''; }, 2000);
    }
  }

  // ===== 查看完整病历 =====
  function viewPatientHistory(){
    if(!currentPatient || !currentPatient.id){
      showToast('请先选择患者', 'warning');
      return;
    }
    var history = [];
    try { history = JSON.parse(localStorage.getItem('wz_diagnosis_history') || '[]'); } catch(e) {}
    var patientCases = history.filter(function(h){
      return h.patient_id === currentPatient.id || h.patient_name === currentPatient.name;
    });
    
    var modal = document.getElementById('wz-patient-history-modal');
    var body = document.getElementById('wz-patient-history-body');
    if(!modal || !body) return;
    
    var html = '<div style="font-size:16px;color:var(--wz-gold);margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid rgba(201,168,76,.2)">📂 ' + currentPatient.name + ' — 完整病历</div>';
    
    // 患者基本信息
    html += '<div style="margin-bottom:12px;padding:10px;background:rgba(0,0,0,.2);border-radius:6px">';
    html += '<div style="font-size:12px;color:var(--wz-paper3)">性别：' + (currentPatient.gender === 'male' ? '男' : currentPatient.gender === 'female' ? '女' : '-') + ' · 年龄：' + (currentPatient.age || '?') + '</div>';
    if(currentPatient.chief) html += '<div style="font-size:12px;color:var(--wz-paper3)">主诉：' + currentPatient.chief + '</div>';
    if(currentPatient.dayMaster) html += '<div style="font-size:11px;color:var(--wz-paper3)">体质：' + currentPatient.dayMaster + (currentPatient.wuxingLack && currentPatient.wuxingLack.length > 0 ? ' 缺' + currentPatient.wuxingLack.join('') : '') + '</div>';
    html += '</div>';
    
    // 诊断历史时间线
    if(patientCases.length === 0){
      html += '<div class="muted">暂无诊断历史</div>';
    } else {
      html += '<div style="font-size:13px;color:var(--wz-gold);margin-bottom:8px">📋 诊断历史（' + patientCases.length + '次）</div>';
      patientCases.forEach(function(h, i){
        var time = h.timestamp ? new Date(h.timestamp).toLocaleString('zh-CN').substring(0, 16) : '';
        var isLatest = i === 0;
        html += '<div style="margin-bottom:10px;padding:10px;border:1px solid ' + (isLatest ? 'rgba(201,168,76,.3)' : 'var(--wz-border)') + ';border-radius:6px;background:' + (isLatest ? 'rgba(201,168,76,.06)' : 'rgba(0,0,0,.1)') + '">';
        if(isLatest) html += '<div style="font-size:10px;color:var(--wz-gold);margin-bottom:4px">📌 最近一次</div>';
        html += '<div style="font-size:11px;color:var(--wz-paper3);margin-bottom:4px">' + time + '</div>';
        if(h.diagnosis_text) html += '<div style="font-size:12px;margin-bottom:4px"><b style="color:var(--wz-paper)">望诊：</b>' + h.diagnosis_text.substring(0, 150).replace(/\n/g, ' ') + '</div>';
        if(h.ai_analysis) html += '<div style="font-size:11px;margin-bottom:4px;color:var(--wz-paper2)"><b>AI：</b>' + h.ai_analysis.substring(0, 100).replace(/\n/g, ' ') + '</div>';
        if(h.voice_notes) html += '<div style="font-size:11px;margin-bottom:4px;color:var(--wz-jade)"><b>医嘱：</b>' + h.voice_notes.substring(0, 100).replace(/\n/g, ' ') + '</div>';
        html += '</div>';
      });
    }
    
    // 体质趋势对比
    if(patientCases.length >= 2){
      html += '<div style="margin-top:12px;padding:10px;background:rgba(99,179,237,.06);border:1px solid rgba(99,179,237,.12);border-radius:6px">';
      html += '<div style="font-size:12px;color:var(--wz-cyan);margin-bottom:4px">📊 体质趋势对比</div>';
      html += '<div style="font-size:11px;color:var(--wz-paper3)">首次就诊：' + (patientCases[patientCases.length-1].timestamp ? new Date(patientCases[patientCases.length-1].timestamp).toLocaleDateString('zh-CN') : '') + '</div>';
      html += '<div style="font-size:11px;color:var(--wz-paper3)">最近就诊：' + (patientCases[0].timestamp ? new Date(patientCases[0].timestamp).toLocaleDateString('zh-CN') : '') + '</div>';
      html += '<div style="font-size:11px;color:var(--wz-jade);margin-top:4px">💡 建议对比两次望诊结果，观察面色变化趋势</div>';
      html += '</div>';
    }
    
    body.innerHTML = html;
    modal.style.display = 'flex';
  }

  var currentPatient = null;

  // 枚举摄像头设备
  function enumCameras(){
    if(!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
    navigator.mediaDevices.enumerateDevices().then(function(devices){
      var cameras = devices.filter(function(d){ return d.kind === 'videoinput'; });
      var sel = document.getElementById('wz-camera-select');
      if(!sel) return;
      sel.innerHTML = '<option value="">自动选择（检测到' + cameras.length + '个摄像头）</option>';
      cameras.forEach(function(cam, i){
        var label = cam.label || ('摄像头 ' + (i+1));
        var o = document.createElement('option');
        o.value = cam.deviceId;
        o.textContent = label;
        sel.appendChild(o);
      });
      if(cameras.length > 1){
        sel.style.display = 'block';
      }
      // 读取设备管理页面配置的默认设备
      var savedDevice = localStorage.getItem('default_camera_device');
      if(savedDevice && sel){
        for(var i=0; i<sel.options.length; i++){
          if(sel.options[i].value === savedDevice){ sel.selectedIndex = i; break; }
        }
      }
      // 更新信息
      var info = document.getElementById('wz-device-info');
      if(info){
        var savedLabel = localStorage.getItem('default_camera_label') || '';
        info.innerHTML = '检测到 ' + cameras.length + ' 个摄像头' + (savedLabel ? ' · 默认: ' + savedLabel : '');
      }
    }).catch(function(){});
  }

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
    showFollowupInfo(p.id, p.name);
    completeStep(1);
  }

  // ===== 摄像头采集 =====
  var cameraStream = null;

  function startCamera(){
    var video = document.getElementById('wz-camera-video');
    var canvas = document.getElementById('wz-camera-canvas');
    if(!video || !canvas) return;

    if(cameraStream){ stopCamera(); return; }

    // 获取选择的摄像头设备
    var deviceId = (document.getElementById('wz-camera-select') || {}).value || '';
    // 如果没选设备，读取设备管理页面配置的默认设备
    if(!deviceId){ deviceId = localStorage.getItem('default_camera_device') || ''; }
    
    // 先尝试精确设备，再降级到宽松约束
    var constraints = { video: true, audio: false };
    if(deviceId){
      constraints = { video: { deviceId: { exact: deviceId } }, audio: false };
    }

    navigator.mediaDevices.getUserMedia(constraints)
      .then(function(stream){
        cameraStream = stream;
        video.srcObject = stream;
        video.play().catch(function(){});
        var btn = document.getElementById('wz-btn-camera');
        if(btn) btn.textContent = '⏹ 停止摄像头';
        var captureBtn = document.getElementById('wz-btn-capture');
        if(captureBtn) captureBtn.style.display = '';
        var ma = document.getElementById('wz-multi-angle');
        if(ma) ma.style.display = 'block';
        showToast('✅ 摄像头已启动');
      })
      .catch(function(err){
        // 降级：尝试最基本的约束
        if(deviceId){
          console.warn('[camera] 精确设备失败，降级到默认:', err.message);
          navigator.mediaDevices.getUserMedia({ video: true, audio: false })
            .then(function(stream){
              cameraStream = stream;
              video.srcObject = stream;
              video.play().catch(function(){});
              var btn2 = document.getElementById('wz-btn-camera');
              if(btn2) btn2.textContent = '⏹ 停止摄像头';
              var captureBtn2 = document.getElementById('wz-btn-capture');
              if(captureBtn2) captureBtn2.style.display = '';
              showToast('✅ 摄像头已启动（默认设备）');
            })
            .catch(function(err2){
              showToast('摄像头启动失败: ' + err2.message + '。请检查：1)浏览器是否允许摄像头权限 2)摄像头是否被其他程序占用 3)是否使用Chrome/Edge浏览器', 'error');
            });
        } else {
          var hint = '摄像头启动失败: ' + err.message;
          if(err.name === 'NotAllowedError') hint += '。请在浏览器地址栏点击摄像头图标，允许权限。';
          else if(err.name === 'NotFoundError') hint += '。未检测到摄像头设备，请检查Type-C连接。';
          else if(err.name === 'NotReadableError') hint += '。摄像头被其他程序占用，请关闭后重试。';
          else if(err.name === 'OverconstrainedError') hint += '。摄像头不支持当前参数，请选择其他设备。';
          showToast(hint, 'error');
        }
      });
  }

  // ===== 多角度采集 =====
  var anglePhotos = {};

  function captureAngle(angle){
    var video = document.getElementById('wz-camera-video');
    var canvas = document.getElementById('wz-camera-canvas');
    if(!video || !canvas || !cameraStream) return;

    canvas.width = 480;
    canvas.height = 360;
    var ctx = canvas.getContext('2d');
    if(!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    var dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    anglePhotos[angle] = dataUrl;

    // 显示预览
    var previews = document.getElementById('wz-angle-previews');
    if(previews){
      var img = document.createElement('img');
      img.src = dataUrl;
      img.style.cssText = 'width:60px;height:45px;object-fit:cover;border-radius:4px;border:1px solid var(--wz-border)';
      img.title = angle;
      img.onclick = function(){ analyzeFace(dataUrl); };
      previews.appendChild(img);
    }
    showToast('✅ ' + angle + ' 已采集');

    // 如果是舌照，发送到 OCR 的 tongue 模式
    if(angle === 'tongue'){
      analyzeTongue(dataUrl);
    }
  }

  // ===== 舌照分析 =====
  function analyzeTongue(dataUrl){
    var statusEl = document.getElementById('wz-analysis-status');
    if(statusEl){
      statusEl.textContent = '👅 正在分析舌象...';
      statusEl.className = 'wz-analysis-status analyzing';
    }
    var b64 = dataUrl.split(',')[1];
    if(!window.fetch){
      if(statusEl){ statusEl.textContent = '⚠️ 舌照分析需要网络连接'; statusEl.className = 'wz-status error'; }
      return;
    }
    fetch(FACE_OCR + '/api/face/analyze', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({image: b64, mode: 'tongue'})
    }).then(function(r){ return r.json(); }).then(function(data){
      var statusEl2 = document.getElementById('wz-analysis-status');
      if(statusEl2){ statusEl2.textContent = '✅ 舌照分析完成'; statusEl2.className = 'wz-status done'; }
      renderAIAnalysis(data);
    }).catch(function(err){
      var statusEl3 = document.getElementById('wz-analysis-status');
      if(statusEl3){ statusEl3.textContent = '⚠️ 舌照分析失败: ' + err.message; statusEl3.className = 'wz-status error'; }
    });
  }

  // ===== 图片上传处理（蓝牙眼镜可通过手机拍照后上传）=====
  function handleUpload(input){
    var file = input.files[0];
    if(!file) return;
    var reader = new FileReader();
    reader.onload = function(e){
      var dataUrl = e.target.result;
      var preview = document.getElementById('wz-photo-preview');
      if(preview){ preview.src = dataUrl; preview.style.display = 'block'; }
      analyzeFace(dataUrl);
      completeStep(2);
      showToast('✅ 图片已上传并开始分析');
    };
    reader.readAsDataURL(file);
  }

  // ===== Rokid 眼镜连接 =====
  var glassConnected = false;

  function connectGlass(){
    var statusEl = document.getElementById('wz-glass-status');
    
    // 检测 Rokid bridge 是否可用
    var bridge = null;
    if(window.RokidJSBridge){ bridge = window.RokidJSBridge; }
    else if(window.Rokid && window.Rokid.bridge){ bridge = window.Rokid.bridge; }
    else if(window.KJJSBridge){ bridge = window.KJJSBridge; }
    
    if(bridge){
      glassConnected = true;
      if(statusEl){
        statusEl.textContent = '✅ 眼镜已连接';
        statusEl.style.color = 'var(--wz-jade)';
      }
      showToast('🥽 智能眼镜已连接');
    } else {
      // 尝试加载 rokid-bridge.js
      var existing = document.querySelector('script[src*="rokid-bridge"]');
      if(!existing){
        var script = document.createElement('script');
        script.src = 'js/wearable/rokid-bridge.js';
        script.onload = function(){
          // 再次检测
          if(window.RokidJSBridge || (window.Rokid && window.Rokid.bridge)){
            glassConnected = true;
            if(statusEl){ statusEl.textContent = '✅ 眼镜已连接（SDK已加载）'; statusEl.style.color = 'var(--wz-jade)'; }
            showToast('🥽 智能眼镜 SDK 已加载');
          } else {
            if(statusEl){ statusEl.textContent = '⚠️ SDK已加载但未检测到眼镜设备'; statusEl.style.color = '#fbbf24'; }
            showToast('⚠️ 未检测到眼镜设备，请确认眼镜已配对', 'warning');
          }
        };
        script.onerror = function(){
          if(statusEl){ statusEl.textContent = '❌ SDK加载失败'; statusEl.style.color = '#f87171'; }
        };
        document.head.appendChild(script);
      } else {
        if(statusEl){ statusEl.textContent = '⚠️ SDK已加载但未检测到眼镜设备'; statusEl.style.color = '#fbbf24'; }
        showToast('⚠️ 未检测到眼镜设备，请确认眼镜已配对', 'warning');
      }
    }
  }

  function glassCapture(){
    if(!glassConnected){
      showToast('请先连接眼镜', 'warning');
      return;
    }
    // 尝试通过 RokidCamera 拍照
    if(window.RokidCamera && window.RokidCamera.capture){
      window.RokidCamera.capture('face').then(function(blob){
        var reader = new FileReader();
        reader.onload = function(){
          var dataUrl = reader.result;
          var preview = document.getElementById('wz-photo-preview');
          if(preview){ preview.src = dataUrl; preview.style.display = 'block'; }
          analyzeFace(dataUrl);
          completeStep(2);
        };
        reader.readAsDataURL(blob);
      }).catch(function(err){
        showToast('眼镜拍照失败: ' + err.message, 'error');
      });
    } else {
      // 降级到桌面摄像头
      showToast('眼镜拍照不可用，使用桌面摄像头', 'warning');
      capturePhoto();
    }
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
    completeStep(2);
    // 显示多角度采集区
    var ma = document.getElementById('wz-multi-angle');
    if(ma) ma.style.display = 'block';
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
    var url = TTS_API + '/api/tts?text=' + encodeURIComponent(text.substring(0, 500)) + '&voice=zh-CN-XiaoxiaoNeural';
    var audio = new Audio(url);
    audio.play().catch(function(){});
  }

  // ===== 排盘联动 =====
  function fetchPaipan(bazi){
    if(!bazi || !bazi.year) return;
    if(!window.fetch) return; // jsdom guard
    var params = 'year='+bazi.year+'&month='+bazi.month+'&day='+bazi.day+'&hour='+bazi.hour;
    if(bazi.lunar) params += '&lunar=1';
    fetch(PAIPAN_API + '/paipan?'+params)
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
    if(d.error){ container.innerHTML = '<span class="muted" style="color:#f87171">⚠️ '+d.error+'</span>'; return; }
    
    var pillars = d.pillars || {};
    var dm = d.day_master || '';
    var wxScore = d.wuxing_score || {};
    var wxCount = d.wuxing_count || {};
    var wxLack = d.wuxing_lack || [];
    var xiao = d.input ? (d.input.shengxiao || '') : '';
    var lunar = d.input ? (d.input.lunar || '') : '';
    var nayin = d.nayin || {};
    var shensha = d.shensha || {};
    var dayun = d.dayun || [];
    var zhiRel = d.zhi_relations || {};
    var ganRel = d.gan_relations || {};
    
    var html = '';
    
    // 四柱
    html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin-bottom:8px">';
    ['年','月','日','时'].forEach(function(pos){
      var p = pillars[pos] || '--';
      var ny = nayin[pos] || '';
      html += '<div style="text-align:center;padding:6px 4px;border:1px solid var(--wz-border);border-radius:4px;background:rgba(201,168,76,.06)">';
      html += '<div style="font-size:10px;color:var(--wz-paper3)">'+pos+'柱</div>';
      html += '<div style="font-size:16px;color:var(--wz-gold);font-weight:700;margin:2px 0">'+p+'</div>';
      if(ny) html += '<div style="font-size:9px;color:var(--wz-paper3)">'+ny+'</div>';
      html += '</div>';
    });
    html += '</div>';
    
    // 日主
    if(dm){
      html += '<div class="pd-row"><span>日主</span><b style="color:var(--wz-gold);font-size:14px">'+dm+'</b></div>';
    }
    
    // 五行得分
    var wxStr = Object.keys(wxScore).map(function(k){ return k+':'+wxScore[k]; }).join(' ');
    if(wxStr) html += '<div class="pd-row"><span>五行</span><b>'+wxStr+'</b></div>';
    
    // 五行缺失
    if(wxLack.length > 0){
      html += '<div class="pd-row"><span>缺失</span><b style="color:#f87171">'+wxLack.join('、')+'</b></div>';
    }
    
    // 同异党
    if(d.tong_dang) html += '<div class="pd-row"><span>同党</span><b>'+d.tong_dang+'</b></div>';
    if(d.yi_dang) html += '<div class="pd-row"><span>异党</span><b>'+d.yi_dang+'</b></div>';
    
    // 生肖
    if(xiao) html += '<div class="pd-row"><span>生肖</span><b>'+xiao+'</b></div>';
    if(lunar) html += '<div class="pd-row"><span>农历</span><b style="font-size:11px">'+lunar+'</b></div>';
    
    // 神煞
    var ssKeys = Object.keys(shensha);
    if(ssKeys.length > 0){
      var ssStr = ssKeys.map(function(k){ return k+'('+shensha[k].join(',')+')'; }).join(' ');
      html += '<div class="pd-row"><span>神煞</span><b style="font-size:10px;color:var(--wz-jade)">'+ssStr+'</b></div>';
    }
    
    // 地支关系
    var relKeys = Object.keys(zhiRel);
    if(relKeys.length > 0){
      var relStr = relKeys.map(function(k){ return k+': '+zhiRel[k].join('; '); }).join(' ');
      html += '<div class="pd-row"><span>地支</span><b style="font-size:10px;color:var(--wz-cyan)">'+relStr+'</b></div>';
    }
    
    // 大运（前5步）
    if(dayun.length > 0){
      html += '<div style="margin-top:6px"><span style="font-size:11px;color:var(--wz-paper3)">大运</span></div>';
      html += '<div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:4px">';
      dayun.slice(0, 5).forEach(function(dy){
        var age = dy.start_age || dy.age || '';
        var ganZhi = dy.gan_zhi || dy.gz || '';
        html += '<div style="padding:3px 8px;border:1px solid var(--wz-border);border-radius:4px;font-size:10px;text-align:center">';
        html += '<div style="color:var(--wz-paper3)">'+age+'岁</div>';
        html += '<div style="color:var(--wz-gold);font-weight:600">'+ganZhi+'</div>';
        html += '</div>';
      });
      html += '</div>';
    }
    
    container.innerHTML = html;
    
    // 保存到 currentPatient
    if(currentPatient){
      currentPatient.dayMaster = dm;
      currentPatient.wuxing = wxScore;
      currentPatient.wuxingLack = wxLack;
      currentPatient.pillars = pillars;
      currentPatient.zodiac = xiao;
    }
    // 自动生成白话健康解读
    renderHealthSummary(d, null);
  }

  // ===== 保存诊断到病例 =====
  function saveDiagnosis(){
    if(!currentPatient || !currentPatient.id){
      showToast('请先选择患者', 'warning');
      return;
    }

    // 收集诊断结果
    var resultPanel = document.getElementById('wangzhen-result-panel');
    var diagnosisText = resultPanel ? resultPanel.textContent : '';
    var voiceText = (document.getElementById('wz-voice-text') || {}).value || '';
    var aiResult = (document.getElementById('wz-ai-result') || {}).textContent || '';

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
    completeStep(5);
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
    var diagnosisText = resultPanel ? resultPanel.textContent : '';
    var voiceText = (document.getElementById('wz-voice-text') || {}).value || '';
    var aiResult = (document.getElementById('wz-ai-result') || {}).textContent || '';
    var paipanText = (document.getElementById('wz-paipan-result') || {}).textContent || '';

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
    var diagnosisText = resultPanel ? resultPanel.textContent : '';
    var paipanText = (document.getElementById('wz-paipan-result') || {}).textContent || '';

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
    completeStep(4);
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

    searchPatient: searchPatient,
    startFollowup: startFollowup,
    viewPatientHistory: viewPatientHistory,
    runComprehensiveAnalysis: runComprehensiveAnalysis,
    pushToMaster: pushToMaster,
    refreshMasterReply: refreshMasterReply,
    confirmAndPushToPatient: confirmAndPushToPatient,
    switchCalendar: switchCalendar,
    switchBaziCal: switchBaziCal,
    addSymptom: addSymptom,
    startVoiceInput: startVoiceInput,
    goStep: goStep,
    completeStep: completeStep,
    toggleNewPatientForm: toggleNewPatientForm,
    saveNewPatient: saveNewPatient,
    insertTemplate: insertTemplate,
    showCaseDetail: showCaseDetail,
    exportCase: exportCase,
    selectPatient: selectPatient,
    startCamera: startCamera,
    handleUpload: handleUpload,
    enumCameras: enumCameras,
    captureAngle: captureAngle,
    connectGlass: connectGlass,
    glassCapture: glassCapture,
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
      fetchPaipan({ year: year, month: month, day: day, hour: hour || '0', lunar: baziCalendarMode === 'lunar' });
    }
  };

  // 自动初始化
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){ window.wangzhenClinical.init(); });
  } else {
    window.wangzhenClinical.init();
  }
})();
