// ===== R249: 统一报告解读引擎（仿蚂蚁健康/微信健康）=====
// 一处实现、多处调用，支持：体检报告、生化指标、CT/MRI/影像报告
// 暴露 window.ReportInterpret 模块
//
// 用法：
//   ReportInterpret.interpret({
//     source: 'ocr'|'manual'|'ct'|'mri'|'xray'|'ultrasound'|'blo***ood-routine',
//     items: [{label, value, flag, unit, ref}],
//     profile: {day_master, day_element, family_genetic, ...},
//     imaging: {type, findings, conclusion},
//     userId: 4
//   })
//   → 返回 {wesern, tcm, mingli, family, total, html}
//
// 渲染到任意位置：
//   ReportInterpret.renderTo(elementId, result)

(function(window){
  'use strict';

  // ===== 器官映射（日主五行 → 易感器官 + 关联系统） =====
  var ORGAN_MAP = {
    '木': {organ:'肝胆', system:'消化-解毒-情志', color:'green'},
    '火': {organ:'心血管/小肠', system:'循环-内分泌-精神', color:'red'},
    '土': {organ:'脾胃', system:'消化-免疫-肌肉', color:'yellow'},
    '金': {organ:'肺/大肠', system:'呼吸-皮肤-免疫', color:'white'},
    '水': {organ:'肾/膀胱', system:'泌尿-生殖-骨骼', color:'blue'}
  };

  // ===== 影像学常见发现（CT/MRI/X光/超声）=====
  var IMAGING_PATTERNS = [
    {regex:/脂肪肝|肝脂肪|肝内回声[增粗强]/i, name:'脂肪肝', tcm:'肝郁脾虚、湿热内蕴', organ:'肝', action:'建议低脂饮食+有氧运动+戒酒', flag:'mid'},
    {regex:/肝[囊囊]肿|肝[囊囊]肿[多]?/i, name:'肝囊肿', tcm:'痰湿瘀结', organ:'肝', action:'良性多见，>5cm需复查', flag:'low'},
    {regex:/胆[囊囊]息肉|胆[囊囊]壁增厚/i, name:'胆囊息肉', tcm:'肝胆气郁', organ:'胆', action:'>1cm需手术，<1cm定期复查', flag:'low'},
    {regex:/胆[囊囊]结石|胆[管]?结石/i, name:'胆结石', tcm:'肝胆湿热', organ:'胆', action:'建议肝胆外科就诊', flag:'mid'},
    {regex:/颈椎[间盘]?突出|颈椎[骨质]?增生|颈椎病/i, name:'颈椎病', tcm:'肝肾不足、筋骨失养', organ:'骨', action:'避免久坐+颈部锻炼+睡姿调整', flag:'low'},
    {regex:/腰椎[间盘]?突出|腰椎[骨质]?增生|腰椎病/i, name:'腰椎病', tcm:'肾虚、寒湿入络', organ:'骨', action:'避免久坐+核心肌群锻炼+保暖', flag:'low'},
    {regex:/肺[纹理]?增[粗多]|肺[灶]?片[状影]|肺[结]?节|肺部[阴影]?/i, name:'肺部异常', tcm:'肺气虚、痰浊阻肺', organ:'肺', action:'>8mm结节建议3个月复查CT', flag:'mid'},
    {regex:/乳腺[腺]?增[生]|乳腺[小]?结[节]|乳腺[囊性]/i, name:'乳腺增生/结节', tcm:'肝郁痰凝', organ:'乳腺', action:'建议钼靶+定期B超复查', flag:'low'},
    {regex:/子宫[肌]?瘤|子宫[内]?膜[增厚]|卵巢[囊囊]肿/i, name:'子宫/卵巢异常', tcm:'气滞血瘀、痰湿', organ:'子宫/卵巢', action:'>5cm建议专科评估', flag:'low'},
    {regex:/前列腺[增生钙化]|前列腺[肥大]/i, name:'前列腺增生', tcm:'肾气虚、膀胱气化不利', organ:'前列腺', action:'建议泌尿外科评估', flag:'low'},
    {regex:/胃[粘]?膜[糜]?烂|胃[溃]?疡|慢性胃[炎]|反流性食[管]?炎/i, name:'胃部异常', tcm:'脾胃虚弱、肝胃不和', organ:'胃', action:'建议胃镜复查+饮食调理', flag:'mid'},
    {regex:/肾[囊囊]肿|肾[结]?石|肾[钙化]|肾[积]?水/i, name:'肾脏异常', tcm:'肾虚、湿热下注', organ:'肾', action:'多饮水+定期复查', flag:'mid'},
    {regex:/甲状腺[结节]|甲状腺[肿大]|甲[状腺亢减]/i, name:'甲状腺异常', tcm:'肝郁气滞、痰瘀互结', organ:'甲状腺', action:'建议甲功+甲状腺B超复查', flag:'low'},
    {regex:/心[电图]?[示]?[偶]?发[早搏房]|房[颤]|ST[段]?改[变]|传[导]?阻[滞]/i, name:'心电图异常', tcm:'心气虚、心血瘀阻', organ:'心', action:'建议24小时动态心电图+心内科', flag:'mid'},
    {regex:/脑[血]?管[狭]?窄|脑[萎]?缩|脑[梗]?塞|颈[动]?脉[斑块]/i, name:'脑血管异常', tcm:'肝风内动、痰瘀阻络', organ:'脑', action:'建议神经内科+头颅MRA复查', flag:'high'}
  ];

  // ===== 生化指标参考 + 异常阈值 =====
  var BIOCHEM_RANGES = {
    '血压': {flag:'bp', unit:'mmHg'},
    '心率': {flag:'hr', min:60, max:100, unit:'bpm'},
    '空腹血糖': {flag:'glu', min:3.9, max:7.0, unit:'mmol/L'},
    '餐后血糖': {flag:'glu2', min:3.9, max:11.1, unit:'mmol/L'},
    '糖化血红蛋白': {flag:'hba1c', min:4.0, max:6.0, unit:'%'},
    '总胆固醇': {flag:'tc', min:2.8, max:5.2, unit:'mmol/L'},
    '甘油三酯': {flag:'tg', min:0.4, max:1.7, unit:'mmol/L'},
    'HDL-C': {flag:'hdl', min:1.0, max:1.55, unit:'mmol/L'},
    'LDL-C': {flag:'ldl', min:1.3, max:3.4, unit:'mmol/L'},
    'ALT': {flag:'alt', min:7, max:40, unit:'U/L'},
    'AST': {flag:'ast', min:13, max:35, unit:'U/L'},
    '总胆红素': {flag:'tbil', min:5, max:21, unit:'μmol/L'},
    '肌酐': {flag:'cr', min:53, max:106, unit:'μmol/L'},
    '尿素氮': {flag:'bun', min:2.9, max:8.2, unit:'mmol/L'},
    '尿酸': {flag:'ua', min:150, max:420, unit:'μmol/L', femaleMax:360},
    '血红蛋白': {flag:'hgb', min:115, max:175, unit:'g/L', femaleRange:[115,150]},
    '白细胞': {flag:'wbc', min:4, max:10, unit:'×10⁹/L'},
    '红细胞': {flag:'rbc', min:4.0, max:5.5, unit:'×10¹²/L'},
    '血小板': {flag:'plt', min:100, max:300, unit:'×10⁹/L'},
    'C反应蛋白': {flag:'crp', min:0, max:10, unit:'mg/L'},
    '甲胎蛋白': {flag:'afp', min:0, max:7, unit:'ng/mL'},
    '癌胚抗原': {flag:'cea', min:0, max:5, unit:'ng/mL'},
    'PSA': {flag:'psa', min:0, max:4, unit:'ng/mL'}
  };

  // ===== 异常判定 =====
  function judgeFlag(item){
    var label = item.label || '';
    var val = item.value || '';
    var range = BIOCHEM_RANGES[label];
    if(!range) return item.flag || null;

    // 血压特殊处理
    if(range.flag === 'bp'){
      var m = String(val).match(/(\d{2,3})\/(\d{2,3})/);
      if(m){
        var sys = parseInt(m[1]), dia = parseInt(m[2]);
        if(sys >= 140 || dia >= 90) return {label:'血压偏高', cls:'flag-high', severity: sys >= 160 || dia >= 100 ? 'high' : 'mid'};
        if(sys < 90 || dia < 60) return {label:'血压偏低', cls:'flag-low', severity:'low'};
        return {label:'血压正常', cls:'flag-normal'};
      }
      return null;
    }

    // 数值类
    var num = parseFloat(String(val).replace(/[^\d.\-]/g,''));
    if(isNaN(num)) return null;
    var min = range.min, max = range.max;
    if(num > max) return {label:'偏高', cls:'flag-high', severity: num > max * 1.5 ? 'high' : 'mid'};
    if(num < min) return {label:'偏低', cls:'flag-low', severity:'low'};
    return {label:'正常', cls:'flag-normal'};
  }

  // ===== 影像学匹配 =====
  function matchImaging(text){
    if(!text) return [];
    var matches = [];
    IMAGING_PATTERNS.forEach(function(p){
      if(p.regex.test(text)){
        matches.push({
          name: p.name,
          tcm: p.tcm,
          organ: p.organ,
          action: p.action,
          flag: p.flag
        });
      }
    });
    return matches;
  }

  // ===== 西医层 =====
  function interpretWestern(items, imaging){
    var lines = [];
    items.forEach(function(it){
      if(it.flag && it.flag.cls === 'flag-high'){
        lines.push({level:'high', text:'⚠️ '+it.label+'('+it.value+') 偏高 — 需关注'});
      } else if(it.flag && it.flag.cls === 'flag-low'){
        lines.push({level:'low', text:'↓ '+it.label+'('+it.value+') 偏低 — 需关注'});
      }
    });
    if(imaging && imaging.length){
      imaging.forEach(function(im){
        lines.push({level: im.flag, text:'🔍 '+im.name+' — '+im.action});
      });
    }
    if(lines.length === 0) lines.push({level:'normal', text:'✅ 检测项均在正常参考范围内'});
    return lines;
  }

  // ===== 中医层（基于指标+影像推断证型）=====
  function interpretTCM(items, imaging, profile){
    var hints = [];
    items.forEach(function(it){
      if(it.flag && it.flag.cls === 'flag-high'){
        if(it.label === '血压') hints.push('血压偏高 → 肝阳上亢型，建议平肝潜阳（天麻钩藤饮加减）');
        if(it.label === '空腹血糖' || it.label === '糖化血红蛋白') hints.push('血糖偏高 → 阴虚燥热型，注意养阴生津（玉女煎加减）');
        if(it.label === '甘油三酯' || it.label === '总胆固醇' || it.label === 'LDL-C') hints.push('血脂偏高 → 痰湿瘀阻，建议化痰祛瘀（温胆汤加减）');
        if(it.label === 'ALT' || it.label === 'AST') hints.push('肝酶异常 → 肝胆湿热，疏肝利胆（茵陈蒿汤加减）');
        if(it.label === '尿酸') hints.push('尿酸偏高 → 湿热痹阻，注意饮食（痛风风险）');
        if(it.label === 'C反应蛋白') hints.push('CRP升高 → 湿热内蕴，可能存在炎症');
      } else if(it.flag && it.flag.cls === 'flag-low'){
        if(it.label === '血红蛋白') hints.push('血红蛋白偏低 → 气血两虚，建议补气养血（八珍汤加减）');
        if(it.label === '白细胞') hints.push('白细胞偏低 → 卫气不固，注意正虚（玉屏风散）');
        if(it.label === '血小板') hints.push('血小板偏低 → 血虚生风，需明确病因');
      }
    });
    if(imaging){
      imaging.forEach(function(im){
        if(im.tcm) hints.push(im.name+' → '+im.tcm);
      });
    }
    if(profile && profile.symptoms){
      if(profile.symptoms.indexOf('怕热')>-1) hints.push('怕热倾向 → 阴虚体质可能');
      if(profile.symptoms.indexOf('怕冷')>-1) hints.push('怕冷倾向 → 阳虚体质可能');
      if(profile.symptoms.indexOf('黏腻')>-1) hints.push('大便黏腻 → 痰湿体质可能');
    }
    if(hints.length === 0) hints.push('当前指标未见明显中医证型倾向');
    return hints;
  }

  // ===== 命理层（日主五行 → 易感器官）=====
  function interpretMingli(items, imaging, profile){
    var hints = [];
    var dm = profile.day_master || '';
    var de = profile.day_element || '';
    if(!de) {
      hints.push('未配置日主五行，建议先完成出生信息采集');
      return hints;
    }
    var organ = ORGAN_MAP[de];
    if(organ){
      hints.push('日主 '+dm+'（'+de+'）→ 易感器官：'+organ.organ+'（'+organ.system+'）');
    }
    // 五行与异常交叉预警
    if(de === '火'){
      if(items.find(function(i){return i.label === '血压' && i.flag && i.flag.cls === 'flag-high'})){
        hints.push('⚠️ 火日主 + 血压偏高 = 心血管系统需重点关注');
      }
      if(items.find(function(i){return (i.label === '总胆固醇' || i.label === 'LDL-C') && i.flag && i.flag.cls === 'flag-high'})){
        hints.push('⚠️ 火日主 + 血脂异常 = 心血管风险叠加');
      }
    }
    if(de === '木'){
      if(items.find(function(i){return i.label === 'ALT' || i.label === 'AST'})){
        hints.push('⚠️ 木日主 + 肝酶异常 = 肝胆系统预警');
      }
    }
    if(de === '土'){
      if(items.find(function(i){return i.label === '空腹血糖' && i.flag && i.flag.cls === 'flag-high'})){
        hints.push('⚠️ 土日主 + 血糖偏高 = 脾胃代谢需调理');
      }
    }
    if(de === '金'){
      if(imaging && imaging.find(function(i){return i.name.indexOf('肺')>-1})){
        hints.push('⚠️ 金日主 + 肺部异常 = 呼吸系统需加强');
      }
    }
    if(de === '水'){
      if(items.find(function(i){return i.label === '尿酸' || i.label === '肌酐'})){
        hints.push('⚠️ 水日主 + 肾功能指标异常 = 肾/泌尿系统需关注');
      }
    }
    return hints;
  }

  // ===== 家族遗传层 =====
  function interpretFamily(items, imaging, profile){
    var hints = [];
    var fg = profile.family_genetic || '';
    if(!fg || fg === '无'){
      hints.push('未登记家族遗传史');
      return hints;
    }
    hints.push('家族遗传：'+fg);
    if(fg.indexOf('高血压')>-1 && items.find(function(i){return i.label === '血压' && i.flag && i.flag.cls === 'flag-high'})){
      hints.push('⚠️ 家族高血压 + 本人血压偏高 = 风险加倍，需立即干预');
    }
    if(fg.indexOf('糖尿病')>-1 && items.find(function(i){return i.label === '空腹血糖' && i.flag && i.flag.cls === 'flag-high'})){
      hints.push('⚠️ 家族糖尿病 + 本人血糖偏高 = 风险加倍，建议复查糖化血红蛋白');
    }
    if(fg.indexOf('肿瘤')>-1){
      hints.push('家族肿瘤史 → 建议每年专项筛查（与日主器官对应）');
    }
    if(fg.indexOf('心脏病')>-1 && items.find(function(i){return i.label === '血压' && i.flag && i.flag.cls === 'flag-high'})){
      hints.push('⚠️ 家族心脏病 + 本人血压偏高 = 心血管风险倍增');
    }
    if(fg.indexOf('脑卒中')>-1 && imaging && imaging.find(function(i){return i.name.indexOf('脑')>-1})){
      hints.push('⚠️ 家族脑卒中 + 脑血管异常 = 神经系统风险显著');
    }
    return hints;
  }

  // ===== 严重度计算 =====
  function calcSeverity(items, imaging){
    var high = 0, mid = 0, low = 0;
    items.forEach(function(it){
      if(it.flag){
        if(it.flag.cls === 'flag-high'){
          if(it.flag.severity === 'high') high++;
          else mid++;
        } else if(it.flag.cls === 'flag-low'){
          low++;
        }
      }
    });
    if(imaging) imaging.forEach(function(im){
      if(im.flag === 'high') high++;
      else if(im.flag === 'mid') mid++;
      else low++;
    });
    if(high >= 2) return 'high';
    if(high >= 1 || mid >= 2) return 'mid';
    if(mid >= 1 || low >= 2) return 'low';
    return 'normal';
  }

  // ===== 标准化输入 =====
  function normalize(opts){
    opts = opts || {};
    var items = (opts.items || []).map(function(it){
      var flag = it.flag || judgeFlag(it);
      return Object.assign({}, it, {flag: flag});
    });
    var imaging = opts.imaging || (opts.imagingText ? matchImaging(opts.imagingText) : []);
    var profile = opts.profile || {};
    return {items: items, imaging: imaging, profile: profile, source: opts.source || 'manual', userId: opts.userId || 4};
  }

  // ===== 主入口 =====
  function interpret(opts){
    var data = normalize(opts);
    var result = {
      source: data.source,
      severity: calcSeverity(data.items, data.imaging),
      western: interpretWestern(data.items, data.imaging),
      tcm: interpretTCM(data.items, data.imaging, data.profile),
      mingli: interpretMingli(data.items, data.imaging, data.profile),
      family: interpretFamily(data.items, data.imaging, data.profile),
      items: data.items,
      imaging: data.imaging,
      profile: data.profile
    };
    // 严重度颜色
    result.severityColor = result.severity === 'high' ? 'red' :
                            result.severity === 'mid' ? 'orange' :
                            result.severity === 'low' ? 'blue' : 'green';
    return result;
  }

  // ===== 渲染到指定元素 =====
  function renderTo(target, result, opts){
    opts = opts || {};
    var style = opts.style || 'card'; // card | inline
    var el = (typeof target === 'string') ? document.getElementById(target) : target;
    if(!el) return;

    var html = '';
    if(style === 'card'){
      html += '<div class="r249-title">🔮 报告解读（'+severityLabel(result.severity)+'）</div>';
      html += renderCard('① 西医指标分析', 'var(--blue)', result.western);
      html += renderCard('② 中医辨证推断', 'var(--green)', result.tcm);
      html += renderCard('③ 命理五行易感', 'var(--purple)', result.mingli);
      html += renderCard('④ 家族遗传叠加', 'var(--orange)', result.family);
    } else {
      result.western.forEach(function(l){html+='<div class="r249-line r249-'+l.level+'">'+l.text+'</div>'});
    }
    el.innerHTML = html;
  }

  // ===== 卡片渲染 =====
  function renderCard(title, color, lines){
    var html = '<div class="r249-card" style="border-left-color:'+color+'">';
    html += '<div class="r249-card-title" style="color:'+color+'">'+title+'</div>';
    if(lines.length === 0){
      html += '<div class="r249-line">（无）</div>';
    } else {
      lines.forEach(function(l){
        var level = l.level || 'normal';
        html += '<div class="r249-line r249-'+level+'">'+l.text+'</div>';
      });
    }
    html += '</div>';
    return html;
  }

  function severityLabel(sev){
    return {high:'🔴 高风险', mid:'🟡 中风险', low:'🔵 低风险', normal:'🟢 正常'}[sev] || '🟢 正常';
  }

  // ===== 暴露 API =====
  window.ReportInterpret = {
    interpret: interpret,
    renderTo: renderTo,
    judgeFlag: judgeFlag,
    matchImaging: matchImaging,
    normalize: normalize,
    calcSeverity: calcSeverity,
    // 便捷方法
    ocr: function(text, profile, userId){
      // 自动从 OCR 文本提取 items
      var items = [];
      Object.keys(BIOCHEM_RANGES).forEach(function(label){
        var range = BIOCHEM_RANGES[label];
        var re = new RegExp(label+'[^\\d]*?(\\d+(?:\\.\\d+)?(?:\\/\\d+)?)','g');
        var m = re.exec(text);
        if(m){
          items.push({label: label, value: m[1]});
        }
      });
      return interpret({source:'ocr', items:items, profile:profile, userId:userId});
    },
    imaging: function(text, profile, userId){
      return interpret({source:'imaging', imagingText:text, profile:profile, userId:userId});
    },
    manual: function(items, profile, userId){
      return interpret({source:'manual', items:items, profile:profile, userId:userId});
    },
    // 暴露内部数据
    BIOCHEM_RANGES: BIOCHEM_RANGES,
    IMAGING_PATTERNS: IMAGING_PATTERNS,
    ORGAN_MAP: ORGAN_MAP
  };

  console.log('[ReportInterpret] R249 统一报告解读引擎已加载', Object.keys(BIOCHEM_RANGES).length+'项生化指标', IMAGING_PATTERNS.length+'项影像模式');

})(window);
