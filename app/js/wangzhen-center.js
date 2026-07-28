/**
 * 望诊中心 — 交互式诊断面板 JS
 * 依赖: wangzhen-kb-loader.js (window.WANGZHEN_KB)
 */
(function(){
  'use strict';

  // ===== A-K 分区数据（从 KB 文档提取，硬编码作为 fallback）=====
  var ZONE_MAP = [
    { id:'A', name:'天庭（额上1/3）', organ:'心/精神压力/脑血管', color:'#ef4444' },
    { id:'B', name:'阙上（两眉之上）', organ:'咽喉/上呼吸道', color:'#f59e0b' },
    { id:'C', name:'印堂（两眉之间）', organ:'肺/胸腔/气管', color:'#63b3ed' },
    { id:'D', name:'山根（两眼之间）', organ:'心/冠脉/循环系统', color:'#ec4899' },
    { id:'E', name:'鼻梁中段（肝）/两侧（胆）', organ:'肝/胆', color:'#10b981' },
    { id:'F', name:'鼻头（准头）', organ:'脾/消化系统', color:'#fbbf24' },
    { id:'G', name:'鼻翼', organ:'胃', color:'#f97316' },
    { id:'H', name:'颧骨偏外下方', organ:'大肠', color:'#a78bfa' },
    { id:'I', name:'眼外角至下颌', organ:'肾/腰下肢', color:'#6366f1' },
    { id:'J', name:'鼻准上方', organ:'小肠', color:'#34d399' },
    { id:'K', name:'人中/唇周', organ:'膀胱/生殖系统', color:'#8b5cf6' }
  ];

  // ===== 特征选项 =====
  var FEATURE_OPTIONS = [
    { id:'red', label:'泛红/丘疹/痘痘', icon:'🔴' },
    { id:'spot_brown', label:'黄褐色/青黑色斑', icon:'🟤' },
    { id:'mole', label:'先天黑痣/凹陷', icon:'⚫' },
    { id:'dull', label:'大面积晦暗/发灰', icon:'⬜' },
    { id:'pale', label:'苍白无光泽', icon:'⚪' },
    { id:'blue', label:'发青/竖纹密集', icon:'🔵' },
    { id:'wrinkle', label:'深横纹/竖纹', icon:'〰️' },
    { id:'vein_purple', label:'青紫色脉络', icon:'🟣' },
    { id:'sunken', label:'塌陷低矮', icon:'⬇️' },
    { id:'acne_recurrent', label:'反复痤疮', icon:'🔴' },
    { id:'red_vein', label:'红血丝', icon:'🔴' },
    { id:'spot_dot', label:'点状斑/褶皱', icon:'📍' },
    { id:'yellow', label:'萎黄发白', icon:'🟡' },
    { id:'white_cold', label:'青白/冰凉', icon:'🧊' },
    { id:'thin_groove', label:'薄/深沟', icon:'📉' },
    { id:'dark_patch', label:'黑斑/暗沉', icon:'⬛' },
    { id:'nodule', label:'凸起结节', icon:'⬆️' },
    { id:'wrinkles_fine', label:'深鱼尾纹', icon:'👁️' },
    { id:'shallow_flat', label:'浅平/窄细', icon:'▬' },
    { id:'rash', label:'唇周丘疹/青黑', icon:'💊' },
    { id:'red_streak', label:'泛红血丝', icon:'🔴' }
  ];

  // ===== 诊断规则映射（区域+特征→病机）=====
  var DIAG_RULES = {
    'A_red':    { organ:'心', pathology:'长期焦虑、高压、心火亢盛', severity:'轻度亚健康', advice:'清心降火，可按揉少府穴、神门穴' },
    'A_spot_brown': { organ:'心/心血管', pathology:'心肌供血不足、慢性心气虚', severity:'中度功能紊乱', advice:'温通心阳，按揉内关穴、膻中穴' },
    'A_mole':   { organ:'心', pathology:'心脏先天功能偏弱', severity:'先天禀赋偏弱', advice:'注意心血管养护，定期体检' },
    'A_dull':   { organ:'心/脑', pathology:'长期失眠、脑循环障碍', severity:'中度功能紊乱', advice:'宁心安神，按揉神门穴、四神聪' },
    'C_pale':   { organ:'肺', pathology:'肺气虚、慢性支气管炎', severity:'中度功能紊乱', advice:'补益肺气，按揉太渊穴、肺俞穴' },
    'C_blue':   { organ:'肺', pathology:'肺气壅滞、胸闷气短', severity:'中度功能紊乱', advice:'宣肺理气，按揉膻中穴、列缺穴' },
    'C_red':    { organ:'肺', pathology:'近期感冒、扁桃体炎症', severity:'轻度', advice:'疏风清热，按揉合谷穴、风池穴' },
    'D_wrinkle': { organ:'心/冠脉', pathology:'心律不齐、冠心病风险', severity:'重度高危预警', advice:'⚠️ 建议心电图检查，按揉内关穴' },
    'D_vein_purple': { organ:'心/循环', pathology:'心肌缺血、血瘀', severity:'重度高危预警', advice:'⚠️ 建议心脏彩超，按揉心俞穴' },
    'D_sunken': { organ:'心', pathology:'心气亏虚、易心慌气短', severity:'先天禀赋偏弱', advice:'温补心阳，按揉神门穴、内关穴' },
    'E_spot_brown': { organ:'肝', pathology:'脂肪肝、长期肝郁', severity:'中度功能紊乱', advice:'疏肝解郁，按揉太冲穴、期门穴' },
    'E_acne_recurrent': { organ:'肝', pathology:'肝火旺盛、易怒失眠', severity:'轻度亚健康', advice:'清肝泻火，按揉行间穴、阳陵泉' },
    'E_red_vein': { organ:'胆', pathology:'慢性胆囊炎', severity:'中度功能紊乱', advice:'清利肝胆，按揉阳陵泉、胆俞穴' },
    'E_spot_dot': { organ:'胆', pathology:'胆结石预警', severity:'重度高危预警', advice:'⚠️ 建议B超检查胆结石' },
    'F_red':    { organ:'脾', pathology:'脾胃湿热', severity:'中度功能紊乱', advice:'清热化湿，按揉阴陵泉、足三里' },
    'F_yellow': { organ:'脾', pathology:'脾虚、乏力多汗、食欲差', severity:'中度功能紊乱', advice:'健脾益气，按揉足三里、脾俞穴' },
    'G_red':    { organ:'胃', pathology:'胃火、胃炎', severity:'中度功能紊乱', advice:'清胃泻火，按揉内庭穴、中脘穴' },
    'G_white_cold': { organ:'胃', pathology:'胃寒、腹痛腹泻', severity:'中度功能紊乱', advice:'温胃散寒，按揉中脘穴、关元穴' },
    'G_thin_groove': { organ:'胃', pathology:'萎缩性胃炎高危', severity:'重度高危预警', advice:'⚠️ 建议胃镜检查' },
    'H_spot_brown': { organ:'大肠', pathology:'长期便秘、痔疮', severity:'轻度亚健康', advice:'润肠通便，按揉天枢穴、合谷穴' },
    'J_pale':   { organ:'小肠', pathology:'营养吸收差、形体消瘦', severity:'轻度亚健康', advice:'健脾消食，按揉足三里、中脘穴' },
    'I_dark_patch': { organ:'肾', pathology:'肾虚、腰背酸痛', severity:'中度功能紊乱', advice:'补肾强腰，按揉肾俞穴、太溪穴' },
    'I_nodule': { organ:'肾', pathology:'肾结石风险', severity:'重度高危预警', advice:'⚠️ 建议B超检查肾结石' },
    'I_wrinkles_fine': { organ:'肾', pathology:'肾精耗损', severity:'中度功能紊乱', advice:'益肾填精，按揉太溪穴、命门穴' },
    'K_shallow_flat': { organ:'膀胱/生殖', pathology:'生殖功能偏弱', severity:'先天禀赋偏弱', advice:'温补肾阳，按揉关元穴、气海穴' },
    'K_rash':   { organ:'膀胱/生殖', pathology:'妇科炎症/前列腺问题', severity:'中度功能紊乱', advice:'清利湿热，按揉三阴交、阴陵泉' },
    'K_red_streak': { organ:'膀胱', pathology:'膀胱炎、尿频尿急', severity:'轻度亚健康', advice:'清利膀胱，按揉中极穴、三阴交' }
  };

  // ===== 五色辨证 =====
  var FIVE_COLORS = [
    { color:'青', organ:'肝', pathology:'寒、痛、气滞、血瘀、肝郁', examples:'山根青(小儿惊风)、鼻头青(腹剧痛)、两颧青(肝郁血瘀)' },
    { color:'赤', organ:'心', pathology:'实热、虚火、血热', examples:'全脸红(实火)、两颧午后潮红(阴虚虚火)' },
    { color:'黄', organ:'脾', pathology:'脾虚、湿热、黄疸', examples:'萎黄(脾虚)、鲜黄(肝胆黄疸)' },
    { color:'白', organ:'肺', pathology:'气虚、血虚、阳虚寒证', examples:'眼白蓝、面苍白(重度贫血)' },
    { color:'黑', organ:'肾', pathology:'肾精亏虚、水饮、劳损、重症', examples:'黑眼圈、全脸焦黑(脏器衰竭)' }
  ];

  // ===== 色诊六维 =====
  var SIX_DIMS = [
    { dim:'浮沉', float:'病在表（轻症新病）', sink:'病入里（久病重症）' },
    { dim:'清浊', clear:'阳证热证', turbid:'阴证寒证' },
    { dim:'微甚', slight:'虚证', severe:'实证' },
    { dim:'散抟', scatter:'新病、邪气浅、易愈', cluster:'久病、邪气固结' },
    { dim:'泽夭', moist:'正气尚存', withered:'精气枯竭，危重' },
    { dim:'转化', toward_bad:'色由散转聚、由泽变夭→加重', toward_good:'反向→好转' }
  ];

  // ===== 风险分级 =====
  function getSeverityLevel(severity){
    if(severity.indexOf('重度') >= 0 || severity.indexOf('危') >= 0) return 3;
    if(severity.indexOf('中度') >= 0) return 2;
    if(severity.indexOf('轻度') >= 0 || severity.indexOf('先天') >= 0) return 1;
    return 0;
  }

  var SEVERITY_LABELS = ['正常', '轻度亚健康', '中度功能紊乱', '重度高危预警'];
  var SEVERITY_COLORS = ['#10b981', '#f59e0b', '#f97316', '#ef4444'];

  // ===== 渲染函数 =====
  function renderZoneMap(container){
    var html = '<div class="wangzhen-zone-grid">';
    ZONE_MAP.forEach(function(z){
      html += '<div class="wangzhen-zone-card" data-zone="'+z.id+'" onclick="window.wangzhenCenter.selectZone(\''+z.id+'\')">';
      html += '<div class="wangzhen-zone-badge" style="border-color:'+z.color+';color:'+z.color+'">'+z.id+'</div>';
      html += '<div class="wangzhen-zone-name">'+z.name+'</div>';
      html += '<div class="wangzhen-zone-organ">'+z.organ+'</div>';
      html += '</div>';
    });
    html += '</div>';
    container.innerHTML = html;
  }

  function renderFeaturePanel(container, zoneId){
    var zone = ZONE_MAP.find(function(z){ return z.id === zoneId; });
    if(!zone){ container.innerHTML = '<p class="muted">请先选择分区</p>'; return; }

    var html = '<div class="wangzhen-feature-header">';
    html += '<span class="wangzhen-zone-badge-lg" style="border-color:'+zone.color+';color:'+zone.color+'">区域 '+zone.id+'</span>';
    html += '<span class="wangzhen-zone-title">'+zone.name+'</span>';
    html += '<span class="wangzhen-zone-organ-tag">'+zone.organ+'</span>';
    html += '</div>';
    html += '<div class="wangzhen-feature-list">';
    FEATURE_OPTIONS.forEach(function(f){
      html += '<label class="wangzhen-feature-chip" data-feature="'+f.id+'">';
      html += '<input type="checkbox" value="'+f.id+'" onchange="window.wangzhenCenter.onFeatureChange()">';
      html += '<span class="feature-icon">'+f.icon+'</span>';
      html += '<span class="feature-label">'+f.label+'</span>';
      html += '</label>';
    });
    html += '</div>';
    html += '<div class="wangzhen-diagnose-btn-wrap">';
    html += '<button class="btn btn-primary" onclick="window.wangzhenCenter.runDiagnose(\''+zoneId+'\')">🔍 诊断此区域</button>';
    html += '<button class="btn btn-ghost" onclick="window.wangzhenCenter.clearFeatures()">清除</button>';
    html += '</div>';
    container.innerHTML = html;
  }

  function runZoneDiagnose(zoneId, selectedFeatures){
    var results = [];
    selectedFeatures.forEach(function(featId){
      var key = zoneId + '_' + featId;
      var rule = DIAG_RULES[key];
      if(rule){
        results.push({
          zone: zoneId,
          feature: featId,
          organ: rule.organ,
          pathology: rule.pathology,
          severity: rule.severity,
          advice: rule.advice,
          level: getSeverityLevel(rule.severity)
        });
      }
    });

    // 如果没有精确匹配，给通用提示
    if(results.length === 0){
      var zone = ZONE_MAP.find(function(z){ return z.id === zoneId; });
      results.push({
        zone: zoneId,
        feature: 'unknown',
        organ: zone ? zone.organ.split('/')[0] : '未知',
        pathology: '该区域有异常特征，建议结合其他诊断综合判断',
        severity: '轻度亚健康',
        advice: '建议观察变化，必要时咨询专业医师',
        level: 1
      });
    }

    return results;
  }

  function renderResults(container, results){
    if(!results || results.length === 0){
      container.innerHTML = '<p class="muted">请选择分区和特征后进行诊断</p>';
      return;
    }

    var maxLevel = Math.max.apply(null, results.map(function(r){ return r.level; }));
    var overallLabel = SEVERITY_LABELS[maxLevel];
    var overallColor = SEVERITY_COLORS[maxLevel];

    var html = '<div class="wangzhen-result-summary" style="border-left:4px solid '+overallColor+'">';
    html += '<div class="result-severity-badge" style="background:'+overallColor+'20;color:'+overallColor+';border:1px solid '+overallColor+'">'+overallLabel+'</div>';
    html += '<div class="result-count">共 '+results.length+' 条诊断结果</div>';
    html += '</div>';

    results.forEach(function(r, i){
      var sc = SEVERITY_COLORS[r.level];
      html += '<div class="wangzhen-result-item" style="border-left:3px solid '+sc+'">';
      html += '<div class="result-item-header">';
      html += '<span class="result-zone">区域 '+r.zone+'</span>';
      html += '<span class="result-severity" style="color:'+sc+'">'+r.severity+'</span>';
      html += '</div>';
      html += '<div class="result-organ">对应脏腑：'+r.organ+'</div>';
      html += '<div class="result-pathology">病机：'+r.pathology+'</div>';
      html += '<div class="result-advice">建议：'+r.advice+'</div>';
      html += '</div>';
    });

    // 强制兜底提示
    html += '<div class="wangzhen-disclaimer">⚠️ 本结果仅为中医面诊筛查参考，不替代医院专业检查。高危信号请及时就医。</div>';

    container.innerHTML = html;
  }

  // ===== 五色辨证渲染 =====
  function renderFiveColors(container){
    var html = '<div class="wangzhen-five-colors">';
    FIVE_COLORS.forEach(function(c){
      var colorMap = { '青':'#10b981', '赤':'#ef4444', '黄':'#fbbf24', '白':'#e5e7eb', '黑':'#374151' };
      var bg = colorMap[c.color] || '#999';
      html += '<div class="five-color-card" style="border-top:3px solid '+bg+'">';
      html += '<div class="five-color-badge" style="background:'+bg+';color:'+(c.color==='白'?'#333':'#fff')+'">'+c.color+'</div>';
      html += '<div class="five-color-organ">'+c.organ+'</div>';
      html += '<div class="five-color-pathology">'+c.pathology+'</div>';
      html += '<div class="five-color-examples">'+c.examples+'</div>';
      html += '</div>';
    });
    html += '</div>';

    // 六维判断
    html += '<div class="wangzhen-six-dims">';
    html += '<div class="six-dims-title">色诊六维判断规则</div>';
    SIX_DIMS.forEach(function(d){
      html += '<div class="six-dim-row">';
      html += '<span class="six-dim-label">'+d.dim+'</span>';
      html += '<span class="six-dim-pair"><b>正</b> '+d.float+'</span>';
      html += '<span class="six-dim-pair"><b>反</b> '+(d.sink||d.turbid||d.severe||d.cluster||d.withered||d.toward_bad)+'</span>';
      html += '</div>';
    });
    html += '</div>';

    container.innerHTML = html;
  }

  // ===== 五官模块渲染 =====
  function renderOrganModules(container){
    var modules = [
      { id:'eye', name:'眼部诊法', icon:'👁️', desc:'五轮八廓 + 白睛彭氏眼诊 + 眼睑/瞳孔' },
      { id:'ear', name:'耳廓诊法', icon:'👂', desc:'倒置胎儿全息 + 色泽/形态/阳性反应物' },
      { id:'nose', name:'鼻部明堂诊', icon:'👃', desc:'山根/鼻梁/鼻头/鼻翼 脏腑对应' },
      { id:'philtrum', name:'人中诊', icon:'💭', desc:'膀胱/生殖系统' },
      { id:'lip', name:'口唇诊', icon:'👄', desc:'脾开窍于口' },
      { id:'tongue', name:'舌诊', icon:'👅', desc:'舌质/舌苔/舌形 精简标准' },
      { id:'teeth', name:'齿龈诊', icon:'🦷', desc:'牙齿/牙龈 肾/胃' },
      { id:'head', name:'头颅毛发诊', icon:'🧠', desc:'头颅形态/囟门/毛发/眉毛' }
    ];

    var html = '<div class="wangzhen-organ-grid">';
    modules.forEach(function(m){
      var kbData = window.WANGZHEN_KB && window.WANGZHEN_KB.organs ? window.WANGZHEN_KB.organs[m.id] : null;
      var count = kbData ? kbData.length : 0;
      html += '<div class="organ-card" onclick="window.wangzhenCenter.showOrganDetail(\''+m.id+'\')">';
      html += '<div class="organ-icon">'+m.icon+'</div>';
      html += '<div class="organ-name">'+m.name+'</div>';
      html += '<div class="organ-desc">'+m.desc+'</div>';
      html += '<div class="organ-kb-count">'+(count>0?'KB '+count+'条':'KB 待加载')+'</div>';
      html += '</div>';
    });
    html += '</div>';
    container.innerHTML = html;
  }

  function showOrganDetail(modId){
    var modal = document.getElementById('wangzhen-organ-modal');
    var body = document.getElementById('wangzhen-organ-modal-body');
    if(!modal || !body) return;

    var kbData = window.WANGZHEN_KB && window.WANGZHEN_KB.organs ? window.WANGZHEN_KB.organs[modId] : null;
    var modNames = { eye:'眼部诊法', ear:'耳廓诊法', nose:'鼻部明堂诊', philtrum:'人中诊', lip:'口唇诊', tongue:'舌诊', teeth:'齿龈诊', head:'头颅毛发诊' };

    var html = '<div class="organ-modal-title">'+(modNames[modId]||modId)+'</div>';
    if(kbData && kbData.length > 0){
      kbData.forEach(function(item){
        html += '<div class="organ-modal-item">';
        html += '<div class="organ-modal-item-title">'+item.title+'</div>';
        html += '<div class="organ-modal-item-content">'+(item.content||'').replace(/\n/g,'<br>')+'</div>';
        if(item.keyword) html += '<div class="organ-modal-item-kw">关键词: '+item.keyword+'</div>';
        html += '</div>';
      });
    } else {
      html += '<p class="muted">该模块 KB 数据未加载，请确认 wangzhen-kb-data.json 可访问。</p>';
    }
    body.innerHTML = html;
    modal.style.display = 'flex';
  }

  // ===== 理疗方案渲染 =====
  function renderTherapy(container){
    var kb = window.WANGZHEN_KB;
    if(!kb || !kb.loaded || !kb.data){
      container.innerHTML = '<p class="muted">理疗方案 KB 加载中...</p>';
      return;
    }
    var plans = kb.data.filter(function(d){ return d.category === '理疗' && d.disease; });
    var libs = kb.data.filter(function(d){ return d.category === '理疗' && !d.disease; });
    var html = '';
    html += '<div style="margin-bottom:10px"><input type="text" id="therapy-search" placeholder="搜索病种...(如：失眠、头痛、感冒)" oninput="window.wangzhenCenter.filterTherapy(this.value)" style="width:100%;padding:8px 12px;background:rgba(255,255,255,.05);border:1px solid var(--wz-border);border-radius:6px;color:var(--wz-paper);font-size:13px"></div>';
    if(libs.length > 0){
      html += '<div class="section-title" style="margin-top:12px">📚 穴位理疗库</div>';
      html += '<div class="therapy-lib-grid">';
      libs.forEach(function(item){
        html += '<div class="therapy-lib-card" onclick="window.wangzhenCenter.showTherapyDetail(\''+item.entry_id+'\')">';
        html += '<div class="therapy-lib-title">'+item.title+'</div>';
        html += '<div class="therapy-lib-desc">'+(item.content||'').substring(0,60)+'...</div>';
        html += '</div>';
      });
      html += '</div>';
    }
    if(plans.length > 0){
      html += '<div class="section-title" style="margin-top:16px">💨 常见病理疗方案（'+plans.length+'种）</div>';
      html += '<div class="therapy-plan-grid" id="therapy-plan-grid">';
      plans.forEach(function(item){
        html += '<div class="therapy-plan-card" data-disease="'+(item.disease||'')+'" onclick="window.wangzhenCenter.showTherapyDetail(\''+item.entry_id+'\')">';
        html += '<div class="therapy-plan-name">'+(item.disease||item.title)+'</div>';
        var pts = (item.content||'').match(/核心穴位：(.+?)[\n\r]/);
        if(pts) html += '<div class="therapy-plan-pts">'+pts[1].substring(0,40)+'</div>';
        html += '</div>';
      });
      html += '</div>';
    }
    container.innerHTML = html;
  }

  function showTherapyDetail(entryId){
    var kb = window.WANGZHEN_KB;
    if(!kb || !kb.data) return;
    var item = kb.data.find(function(d){ return d.entry_id === entryId; });
    if(!item) return;
    var modal = document.getElementById('wangzhen-organ-modal');
    var body = document.getElementById('wangzhen-organ-modal-body');
    if(!modal || !body) return;
    body.innerHTML = '<div class="organ-modal-title">'+item.title+'</div>';
    body.innerHTML += '<div class="organ-modal-item-content">'+(item.content||'').replace(/\n/g,'<br>')+'</div>';
    if(item.keyword) body.innerHTML += '<div class="organ-modal-item-kw">关键词: '+item.keyword+'</div>';
    modal.style.display = 'flex';
  }

  // ===== AI 7步流程 =====
  function renderAISteps(container){
    var steps = [
      { n:1, name:'全局特征提取', desc:'采集人脸整体神态、整体肤色，判断有神/失神（基础预后判定）' },
      { n:2, name:'区域分割匹配', desc:'按A-K标准分区，识别斑、痘、皱纹、痣、凹陷、凸起' },
      { n:3, name:'色彩量化识别', desc:'提取各区域RGB色值，匹配青/赤/黄/白/黑五色病机' },
      { n:4, name:'五官细分校验', desc:'眼、耳、鼻、毛发、颅形交叉验证，减少单一区域误判' },
      { n:5, name:'表里联动推理', desc:'按脏腑表里规则（肺-大肠/心-小肠/肝-胆/脾-胃/肾-膀胱），联动推导关联脏器问题' },
      { n:6, name:'风险分级标注', desc:'分轻度亚健康、中度功能紊乱、重度高危疾病预警三级' },
      { n:7, name:'输出理疗方案', desc:'配套穴位按摩方案 + 强制兜底提示就医' }
    ];

    var html = '<div class="wangzhen-ai-steps">';
    steps.forEach(function(s){
      html += '<div class="ai-step" data-step="'+s.n+'">';
      html += '<div class="ai-step-num">'+s.n+'</div>';
      html += '<div class="ai-step-body">';
      html += '<div class="ai-step-name">'+s.name+'</div>';
      html += '<div class="ai-step-desc">'+s.desc+'</div>';
      html += '</div>';
      html += '</div>';
    });
    html += '</div>';
    html += '<div class="wangzhen-ai-disclaimer">🔒 知识边界：禁止仅凭面部特征直接确诊癌症/心梗/脑溢血/肿瘤等重症，仅输出"预警提示"。理疗仅作辅助调理，不可替代药物/手术。儿科头颅/眼底"猫眼"等高危特征必须强制提示立刻前往三甲医院就诊。</div>';
    container.innerHTML = html;
  }

  // ===== 主控制器 =====
  var selectedZone = null;
  var selectedFeatures = [];

  window.wangzhenCenter = {
    init: function(){
      var zoneMap = document.getElementById('wangzhen-zone-map');
      var featurePanel = document.getElementById('wangzhen-feature-panel');
      var resultPanel = document.getElementById('wangzhen-result-panel');
      var colorPanel = document.getElementById('wangzhen-five-colors');
      var organPanel = document.getElementById('wangzhen-organs');
      var aiStepsPanel = document.getElementById('wangzhen-ai-steps');
      var therapyPanel = document.getElementById('wangzhen-therapy');

      if(zoneMap) renderZoneMap(zoneMap);
      if(featurePanel) featurePanel.innerHTML = '<p class="muted">👆 请先选择一个面部分区</p>';
      if(resultPanel) resultPanel.innerHTML = '<p class="muted">诊断结果将显示在此</p>';
      if(colorPanel) renderFiveColors(colorPanel);
      if(organPanel) renderOrganModules(organPanel);
      if(aiStepsPanel) renderAISteps(aiStepsPanel);
      if(therapyPanel) renderTherapy(therapyPanel);

      // KB 加载状态
      if(window.WANGZHEN_KB && window.WANGZHEN_KB.loaded){
        this.updateKBStatus();
      } else {
        var self = this;
        window.addEventListener('wangzhen-kb-loaded', function(){ self.updateKBStatus(); });
      }
    },

    updateKBStatus: function(){
      var el = document.getElementById('wangzhen-kb-status');
      if(el && window.WANGZHEN_KB && window.WANGZHEN_KB.loaded){
        var s = window.WANGZHEN_KB.stats;
        el.innerHTML = '✅ WANGZHEN_KB 已加载 · '+s.total+'条 · 分区'+Object.keys(window.WANGZHEN_KB.zones).length+' · 五色'+Object.keys(window.WANGZHEN_KB.colors).length;
        el.className = 'kb-status loaded';
      }
    },

    selectZone: function(zoneId){
      selectedZone = zoneId;
      selectedFeatures = [];
      // 更新 UI 高亮
      var cards = document.querySelectorAll('.wangzhen-zone-card');
      cards.forEach(function(c){
        c.classList.toggle('active', c.dataset.zone === zoneId);
      });
      // 渲染特征面板
      var panel = document.getElementById('wangzhen-feature-panel');
      if(panel) renderFeaturePanel(panel, zoneId);
    },

    onFeatureChange: function(){
      var checkboxes = document.querySelectorAll('#wangzhen-feature-panel input[type=checkbox]');
      selectedFeatures = [];
      checkboxes.forEach(function(cb){
        if(cb.checked) selectedFeatures.push(cb.value);
      });
    },

    clearFeatures: function(){
      var checkboxes = document.querySelectorAll('#wangzhen-feature-panel input[type=checkbox]');
      checkboxes.forEach(function(cb){ cb.checked = false; });
      selectedFeatures = [];
    },

    runDiagnose: function(zoneId){
      if(selectedFeatures.length === 0){
        var panel = document.getElementById('wangzhen-result-panel');
        if(panel) panel.innerHTML = '<p class="muted">请至少选择一个面部特征</p>';
        return;
      }
      var results = runZoneDiagnose(zoneId, selectedFeatures);
      var panel = document.getElementById('wangzhen-result-panel');
      if(panel) renderResults(panel, results);
    },

    showOrganDetail: showOrganDetail,
    showTherapyDetail: showTherapyDetail,
    filterTherapy: function(keyword){
      var cards = document.querySelectorAll('#therapy-plan-grid .therapy-plan-card');
      if(!cards) return;
      cards.forEach(function(c){
        var disease = (c.dataset.disease || '').toLowerCase();
        c.style.display = (!keyword || disease.indexOf(keyword.toLowerCase()) >= 0) ? '' : 'none';
      });
    },

    closeOrganModal: function(){
      var modal = document.getElementById('wangzhen-organ-modal');
      if(modal) modal.style.display = 'none';
    },

    switchTab: function(tabName){
      var tabs = document.querySelectorAll('.wangzhen-tab');
      var panels = document.querySelectorAll('.wangzhen-tab-panel');
      tabs.forEach(function(t){ t.classList.toggle('active', t.dataset.tab === tabName); });
      panels.forEach(function(p){ p.style.display = p.dataset.tab === tabName ? 'block' : 'none'; });
    }
  };

  // DOMContentLoaded 初始化
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){ window.wangzhenCenter.init(); });
  } else {
    window.wangzhenCenter.init();
  }
})();
