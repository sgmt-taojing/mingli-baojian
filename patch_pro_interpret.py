#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Patch generateInterpretation function for professional bazi analysis"""

filepath = '/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/app/js/divination-core.js'

# Find the start and end of generateInterpretation
with open(filepath, 'r') as f:
    content = f.read()

# Find the function boundaries
start = content.find('function generateInterpretation(data) {')
if start < 0:
    print("ERROR: Cannot find generateInterpretation")
    exit(1)

# Find the matching closing brace
# Scan forward to find "function computeBazi()"
end = content.find('\nfunction computeBazi()', start)
if end < 0:
    print("ERROR: Cannot find computeBazi after generateInterpretation")
    exit(1)

before = content[:start]
after = content[end:]

new_func = r'''function generateInterpretation(data) {
  var html = '';
  var dayMaster = data.dayMaster || '甲木';
  var dayWuxing = data.dayWuxing || '木';
  var isStrong = data.isStrong;
  var mingType = data.mingType || {};
  var shensha = data.shensha || {};
  var tenGods = data.tenGods || [];
  var geju = data.geju || {};
  var strengthLevel = mingType.strengthLevel || (isStrong ? '偏旺' : '偏弱');
  var yongshenEle = mingType.yongshenEle || (isStrong ? '火' : '水');
  var yongshen = mingType.yongshen || yongshenEle;
  var jishenEle = mingType.jishenEle || (isStrong ? '水' : '火');
  var xiJi = mingType.xiJi || [];

  // ═══════ 壹·命盘总览 ═══════
  var strengthNotes = {
    '极旺': '日主极旺，如参天巨木。您天生能量充沛，自信心强，做事有魄力。但木过旺则刚易折，需金来修剪、火来疏泄，方能成材。处事切忌一意孤行，多听他人意见。',
    '偏旺': '日主偏旺，根基扎实。您有很强的自我驱动力，不轻易向困难低头。但有时过于固执，需学会灵活变通。用神取克泄耗（官杀/食伤/财星）为宜。',
    '中和': '日主中和，五行相对平衡。您是难得的平和之命，适应力强，能进能退。这是最好的命局状态——既不会太弱扛不住事，也不会太旺难以收敛。保持现状，顺势而为即可。',
    '偏弱': '日主偏弱，如小树需要扶持。您心地善良、为人谦和，但有时信心不足、容易被人影响。需印星生扶、比劫帮身。建议多结交志同道合的朋友，借助团队力量。',
    '极弱': '日主极弱，如嫩苗需要精心呵护。您心思细腻、敏感多思，有艺术气质。但抗压能力有限，不适合单打独斗。需大量印比来扶助，适合在稳定环境中发展。'
  };
  var strengthDesc = strengthNotes[strengthLevel] || strengthNotes['中和'];

  html += '<div style="background:linear-gradient(135deg,rgba(201,168,76,.08),rgba(155,89,182,.04));border:1px solid rgba(201,168,76,.2);border-radius:10px;padding:16px;margin-bottom:14px">';
  html += '<div style="font-size:14px;font-weight:bold;color:var(--gold);margin-bottom:8px;letter-spacing:2px">壹 · 命盘总览</div>';
  html += '<div style="font-size:13px;color:var(--paper);line-height:2">';
  html += '<b>日主旺衰：</b><span style="color:'+(isStrong?'#e74c3c':'#3498db')+'">' + strengthLevel + '</span> · ';
  html += '<b>喜用神：</b><span style="color:#2ecc71">' + yongshen + '</span> · ';
  html += '<b>忌神：</b><span style="color:#e74c3c">' + jishenEle + '</span>';
  html += '</div>';
  html += '<div style="font-size:12px;color:var(--paper2);line-height:1.8;margin-top:8px">' + strengthDesc + '</div>';
  if (xiJi.length > 0) {
    html += '<div style="font-size:11px;color:#888;margin-top:6px">💡 喜忌指引：' + xiJi.join('；') + '</div>';
  }
  html += '</div>';

  // ═══════ 贰·十神格局分析 ═══════
  var tenGodCount = {};
  var tgNames = [];
  if (Array.isArray(tenGods)) {
    for (var i = 0; i < tenGods.length; i++) {
      var tg = tenGods[i];
      if (tg) {
        tenGodCount[tg] = (tenGodCount[tg] || 0) + 1;
        tgNames.push(tg);
      }
    }
  }

  var tgAnalysisMap = {};
  if (tenGodCount['正官'] >= 2 || tenGodCount['七杀'] >= 2) {
    tgAnalysisMap['官杀旺'] = '官杀星旺盛，您天生有强烈的责任心和事业心，适合管理、公职、法律等需要权威和纪律的工作。但官杀过旺也会带来巨大压力——建议培养兴趣爱好来减压，学会把工作与生活分开。女命官杀旺者异性缘佳，但要注意分辨正缘与烂桃花。';
  }
  if (tenGodCount['正印'] >= 2 || tenGodCount['偏印'] >= 2) {
    tgAnalysisMap['印星旺'] = '印星旺盛，您天生好学、聪慧，贵人运佳。适合学术、教育、文化等行业。但印星过旺也容易依赖心重、行动力不足——建议多实践、知行合一，把知识转化为行动。印星旺者心地善良，适合慈善和助人行业。';
  }
  if (tenGodCount['正财'] >= 2 || tenGodCount['偏财'] >= 2) {
    tgAnalysisMap['财星旺'] = '财星旺盛，您对金钱有敏锐的嗅觉，理财能力出众。适合经商、金融、贸易等与钱打交道的行业。但财星过旺者容易为钱所困——提醒您：钱是工具不是目的，适度即可。男命财旺者桃花多，需注意处理感情关系。';
  }
  if (tenGodCount['食神'] >= 2 || tenGodCount['伤官'] >= 2) {
    tgAnalysisMap['食伤旺'] = '食伤星旺盛，您才华横溢、创意十足，有艺术天赋。适合设计、艺术、演艺、写作等需要创造力的工作。食伤星也代表表达和输出——您天生善于表达，口才出众。但有时过于情绪化，需学会控制脾气。';
  }
  if (tenGodCount['比肩'] >= 2 || tenGodCount['劫财'] >= 2) {
    tgAnalysisMap['比劫旺'] = '比劫星旺盛，您朋友多、人脉广，团队协作能力强。适合创业、销售、体育等需要体力和团队的工作。但比劫过旺也容易与人争执、破财——建议学会分享，不要在小事上计较。';
  }

  html += '<div style="background:rgba(52,152,219,.04);border-left:3px solid #3498db;padding:14px 16px;margin-bottom:14px;border-radius:0 8px 8px 0">';
  html += '<div style="font-size:14px;font-weight:bold;color:#3498db;margin-bottom:8px;letter-spacing:2px">贰 · 十神格局</div>';
  html += '<div style="font-size:12px;color:var(--paper);line-height:1.8">';

  if (Object.keys(tgAnalysisMap).length > 0) {
    for (var ka in tgAnalysisMap) {
      html += '<p style="margin-bottom:6px">🔹 <b>' + ka.replace('旺','') + '格：</b>' + tgAnalysisMap[ka] + '</p>';
    }
  } else {
    html += '<p>十神分布均衡，各项能力发展相对平均。建议在现有基础上重点培养一两个领域的专长。</p>';
  }

  // Specific balance warnings
  var warnings = [];
  if ((tenGodCount['七杀'] || 0) >= 2 && (tenGodCount['食神'] || 0) === 0 && (tenGodCount['正印'] || 0) === 0) {
    warnings.push('⚠️ <b>七杀无制：</b>七杀旺而无食神制或印星化，容易压力过大、脾气暴躁，建议多运动释放压力，避免高风险决策。');
  }
  if ((tenGodCount['伤官'] || 0) >= 2 && (tenGodCount['正印'] || 0) === 0) {
    warnings.push('⚠️ <b>伤官无制：</b>伤官旺而无印制，才华外露但易得罪人，建议学会收敛锋芒，多阅读修身养性。');
  }
  if ((tenGodCount['正财'] || 0) >= 2 && (tenGodCount['比肩'] || 0) + (tenGodCount['劫财'] || 0) >= 2) {
    warnings.push('⚠️ <b>财星被劫：</b>财星与比劫同旺，容易财来财去、为朋友破财，建议谨慎理财，不宜与人合伙。');
  }
  for (var wi = 0; wi < warnings.length; wi++) {
    html += '<p style="color:#e67e22;margin-top:4px">' + warnings[wi] + '</p>';
  }

  html += '</div></div>';

  // ═══════ 叁·神煞点睛 ═══════
  if (shensha && Object.keys(shensha).length > 0) {
    html += '<div style="background:rgba(155,89,182,.04);border-left:3px solid #9b59b6;padding:14px 16px;margin-bottom:14px;border-radius:0 8px 8px 0">';
    html += '<div style="font-size:14px;font-weight:bold;color:#9b59b6;margin-bottom:8px;letter-spacing:2px">叁 · 神煞点睛</div>';
    html += '<div style="font-size:12px;color:var(--paper);line-height:1.8">';

    var shenshaMeanings = {
      '天乙贵人': {good:true, txt:'命带天乙贵人，一生有贵人相助，逢凶化吉。这是最吉之神煞，主遇难呈祥，危难时有高人指点。'},
      '天德贵人': {good:true, txt:'命带天德贵人，心地善良，福报深厚。纵遇灾祸也能化解，一生少有大难。'},
      '太极贵人': {good:true, txt:'命带太极贵人，天生对玄学、哲学、易学有缘。适合学习命理、中医、气功等传统文化。'},
      '文昌贵人': {good:true, txt:'命带文昌贵人，学业运佳，聪明好学。考试、考证运势较强，读书事半功倍。'},
      '将星': {good:true, txt:'命带将星，有领导才能和决断力。适合管理岗位或自主创业，能在团队中脱颖而出。'},
      '桃花': {good:false, txt:'命带桃花星，异性缘分佳，人缘好。但需警惕烂桃花和感情纠葛，适度的桃花是魅力，过旺则成困扰。'},
      '驿马': {good:false, txt:'命带驿马星，一生奔波走动多，适合经常出差、旅行的工作。驿马旺者宜动不宜静，坐不住是常态。'},
      '羊刃': {good:false, txt:'命带羊刃，性格刚烈果敢，但也容易冲动。需要注意控制脾气，避免与人发生肢体冲突。'},
      '孤辰': {good:false, txt:'命带孤辰，性格偏内向，喜欢独处。晚年可能较孤独，建议多培养兴趣爱好和社交圈。'},
      '寡宿': {good:false, txt:'命带寡宿，感情路上波折较多。但此类人专注力强，往往在专业领域有出色成就。'},
      '华盖': {good:false, txt:'命带华盖，聪慧过人但性情孤傲。华盖是艺术和玄学之星——您可能对命理、哲学有天生的兴趣。'}
    };

    var goodStars = [], neutralStars = [];
    for (var sk in shensha) {
      if (shensha[sk]) {
        var meaning = shenshaMeanings[sk];
        if (meaning) {
          if (meaning.good) goodStars.push({name: sk, txt: meaning.txt});
          else neutralStars.push({name: sk, txt: meaning.txt});
        }
      }
    }

    if (goodStars.length > 0) {
      html += '<p style="color:#27ae60;margin-bottom:4px"><b>⭐ 吉神：</b></p>';
      for (var gs = 0; gs < goodStars.length; gs++) {
        html += '<p style="margin-bottom:4px">• <b>' + goodStars[gs].name + '</b>：' + goodStars[gs].txt + '</p>';
      }
    }
    if (neutralStars.length > 0) {
      html += '<p style="color:#e67e22;margin-bottom:4px;margin-top:8px"><b>⚡ 需注意：</b></p>';
      for (var ns = 0; ns < neutralStars.length; ns++) {
        html += '<p style="margin-bottom:4px">• <b>' + neutralStars[ns].name + '</b>：' + neutralStars[ns].txt + '</p>';
      }
    }

    html += '</div></div>';
  }

  // ═══════ 肆·运程指导 ═══════
  var currentYear = new Date().getFullYear();
  var yearGanZhi = '';
  try {
    var yearStems = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
    var yearBranches = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
    yearGanZhi = yearStems[(currentYear-4)%10] + yearBranches[(currentYear-4)%12];
  } catch(e) { yearGanZhi = '未知'; }

  var dayunPhases = {
    '极旺': '您现在正处于能量充沛的阶段，但需警惕过度自信。未来5年宜「收」不宜「放」，稳扎稳打比冒进更安全。',
    '偏旺': '运势稳中有升，当前是发展的好时机。建议抓住未来2-3年的机会，但不要all in——留三分余地。',
    '中和': '运势平稳，进退自如。这种状态最难得——保持节奏，按部就班推进计划，细水长流是您最好的策略。',
    '偏弱': '当前需要积蓄力量，不宜做重大决策。建议未来1-2年先学习充电，等运势转旺时再出击。多借助团队和贵人的力量。',
    '极弱': '运势偏低谷期，但低谷是蓄力的最佳时机。建议在此期间静心学习、韬光养晦，运势会在2-3年后逐步回升。'
  };
  var dayunPhase = dayunPhases[strengthLevel] || dayunPhases['中和'];

  html += '<div style="background:rgba(39,174,96,.04);border-left:3px solid #27ae60;padding:14px 16px;margin-bottom:14px;border-radius:0 8px 8px 0">';
  html += '<div style="font-size:14px;font-weight:bold;color:#27ae60;margin-bottom:8px;letter-spacing:2px">肆 · 运程指导</div>';
  html += '<div style="font-size:12px;color:var(--paper);line-height:1.8">';
  html += '<b>' + currentYear + '年（' + yearGanZhi + '年）运势基调：</b>' + dayunPhase + '<br><br>';

  // Specific year advice based on element interaction
  var yearEle = '';
  try {
    var yearStemIdx = (currentYear-4)%10;
    var stemEle = {'甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水'};
    yearEle = stemEle[yearStems[yearStemIdx]];
  } catch(e) {}

  var yearInteraction = '';
  if (yearEle) {
    var xi = yongshenEle;
    if (yearEle === xi) {
      yearInteraction = '今年' + yearEle + '年为您的喜用神年，运势偏吉，适合积极进取。';
    } else if (yearEle === jishenEle) {
      yearInteraction = '今年' + yearEle + '年为您的忌神年，宜低调行事，稳守为主。';
    } else {
      yearInteraction = '今年' + yearEle + '年与您五行相对中性，运势平稳，可按计划推进。';
    }
  }
  html += yearInteraction + '</div></div>';

  // ═══════ 伍·具体行事指导 ═══════
  var careerTips = {
    '木': {best:'教育培训、文化传媒、设计创意、农林园艺、公益慈善', reason:'木主仁爱，适合需要爱心和创造力的行业。木日主的人天生有感染力，做教育或文化传播事半功倍。', avoid:'过分机械重复的工作，会压抑木的生机', peak:'春季（农历1-3月）运势最强'},
    '火': {best:'互联网科技、餐饮娱乐、演艺传媒、市场营销、能源电力', reason:'火主礼乐，适合需要热情和表现力的行业。火日主的人天生是焦点，做与人打交道的工作如鱼得水。', avoid:'冰冷沉闷的后台工作，火需要发光发热', peak:'夏季（农历4-6月）运势最强'},
    '土': {best:'房地产建筑、金融投资、农业种植、仓储物流、咨询服务', reason:'土主诚信，适合需要稳重和耐心的行业。土日主的人踏实可靠，做长线投资和实体产业最稳妥。', avoid:'频繁变动的快节奏行业，土需要沉淀', peak:'长夏（农历6月末）和四季末运势最强'},
    '金': {best:'金融法律、机械制造、军警安全、医疗外科、精密工艺', reason:'金主义气，适合需要果断和精准的行业。金日主的人执行力强，做需要专业技能的行业最佳。', avoid:'含糊不清的灰色地带工作，金需要清晰边界', peak:'秋季（农历7-9月）运势最强'},
    '水': {best:'贸易物流、旅游咨询、心理咨询、水利环保、学术研究', reason:'水主智慧，适合需要灵活和深度的行业。水日主的人思维敏捷，做需要洞察力的工作最有优势。', avoid:'固化死板的工作环境，水需要流动', peak:'冬季（农历10-12月）运势最强'}
  };
  var career = careerTips[dayWuxing] || careerTips['木'];

  var caishen = tenGodCount['正财'] || 0;
  var piancai = tenGodCount['偏财'] || 0;
  var totalCai = caishen + piancai; // "财" -> "cai"
  var caiAdvice = '';
  if (totalCai >= 2) {
    caiAdvice = '命带财星' + totalCai + '重，财运基础好。正财主稳定收入（工资），偏财主意外之财（投资、副业）。您适合多渠道开源，但要控制风险——正财为主，偏财为辅。';
  } else if (totalCai === 1) {
    caiAdvice = '命带财星1重，财运稳定但需要主动经营。建议：①深耕主业确保稳定收入；②有余力可发展一项副业；③学习基础理财知识。';
  } else {
    caiAdvice = '命局财星不显，并非无财——而是需要创造才能得财。建议：①提升专业技能增加收入能力；②培养储蓄习惯；③不求快财，稳中求富。';
  }

  html += '<div style="background:rgba(230,126,34,.04);border-left:3px solid #e67e22;padding:14px 16px;margin-bottom:14px;border-radius:0 8px 8px 0">';
  html += '<div style="font-size:14px;font-weight:bold;color:#e67e22;margin-bottom:8px;letter-spacing:2px">伍 · 行事指导</div>';
  html += '<div style="font-size:12px;color:var(--paper);line-height:1.8">';
  html += '<b>💼 事业方向：</b>' + career.reason + '<br>';
  html += '→ 推荐行业：' + career.best + '<br>';
  html += '→ 避开行业：' + career.avoid + '<br>';
  html += '→ ' + career.peak + '<br><br>';
  html += '<b>💰 财运分析：</b>' + caiAdvice + '</div></div>';

  // ═══════ 陆·缘分感情 ═══════
  var guanCount = (tenGodCount['正官'] || 0) + (tenGodCount['七杀'] || 0);
  var caiCount2 = (tenGodCount['正财'] || 0) + (tenGodCount['偏财'] || 0);
  var taohua = shensha && shensha['桃花'];

  var loveAdvice = '';
  if (guanCount >= 2) {
    loveAdvice = '官杀星' + guanCount + '重，异性缘分佳但也容易选择困难。建议：①先明确自己的核心需求再选择伴侣；②注意辨别烂桃花；③晚婚反而更稳定。';
  } else if (guanCount === 1) {
    loveAdvice = '官杀星1重，正缘运正常。建议：①多参加社交活动扩大交际圈；②不急于求成，缘分到了自然来。';
  } else {
    loveAdvice = '官杀星不显，缘分需要主动寻找。建议：①多参加朋友介绍；②培养共同爱好的社交圈；③缘分来时主动把握。';
  }
  if (taohua) {
    loveAdvice += ' <span style="color:#e67e22">★ 命带桃花，特别提醒：桃花旺人缘好，但需注意感情专一，避免陷入多角关系。</span>';
  }

  html += '<div style="background:rgba(192,57,43,.04);border-left:3px solid #c0392b;padding:14px 16px;margin-bottom:14px;border-radius:0 8px 8px 0">';
  html += '<div style="font-size:14px;font-weight:bold;color:#c0392b;margin-bottom:8px;letter-spacing:2px">陆 · 缘分感情</div>';
  html += '<div style="font-size:12px;color:var(--paper);line-height:1.8">';
  html += loveAdvice + '</div></div>';

  // ═══════ 柒·健康养生 ═══════
  var healthWarnings = {
    '木': {organs:'肝胆、眼睛、筋骨、甲状腺', detail:'木主肝胆，木日主者需特别注意肝火和肝气郁结。肝脏是人体最大的解毒器官——少熬夜是最好的保肝。春季多踏青、多看绿色可养肝明目。', food:'枸杞菊花茶、柠檬水、绿叶蔬菜、绿豆', avoid:'过量饮酒、油炸食物、生冷夜宵'},
    '火': {organs:'心脏、小肠、血管、血压', detail:'火主心脏和血脉，火日主者需注意心脑血管健康。心脏是生命的发动机——规律作息和情绪稳定是养心的关键。夏季多出汗有益，但避免在烈日下暴晒。', food:'莲子心茶、苦瓜、红枣、百合', avoid:'过咸食物、咖啡过量、暴怒激动'},
    '土': {organs:'脾胃、胰脏、肌肉、消化系统', detail:'土主脾胃，土日主者需特别注意消化系统。脾胃是人体的能量工厂——三餐规律比吃什么更重要。细嚼慢咽，七分饱即可。', food:'山药小米粥、南瓜、陈皮普洱茶、薏米', avoid:'生冷瓜果、冰镇饮料、甜食过量'},
    '金': {organs:'肺、大肠、皮肤、呼吸道', detail:'金主肺气，金日主者需注意呼吸系统和皮肤健康。肺部是人体的空气净化器——深呼吸和新鲜空气是最好的养肺方法。秋天多食白色食物润肺。', food:'雪梨银耳羹、白萝卜、杏仁、蜂蜜柠檬水', avoid:'烟熏食品、辛辣烧烤、过度熬夜'},
    '水': {organs:'肾脏、膀胱、骨骼、听觉', detail:'水主肾脏，水日主者需特别注意肾气和泌尿系统。肾是人体的根基——不憋尿、多喝水、注意腰腹保暖是养肾三宝。冬天是养肾的黄金季节。', food:'黑芝麻核桃糊、桑葚、黑豆、枸杞杜仲茶', avoid:'过咸食物、冷饮、过度消耗精气'}
  };
  var health = healthWarnings[dayWuxing] || healthWarnings['木'];

  html += '<div style="background:rgba(46,204,113,.04);border-left:3px solid #2ecc71;padding:14px 16px;margin-bottom:14px;border-radius:0 8px 8px 0">';
  html += '<div style="font-size:14px;font-weight:bold;color:#2ecc71;margin-bottom:8px;letter-spacing:2px">柒 · 健康养生</div>';
  html += '<div style="font-size:12px;color:var(--paper);line-height:1.8">';
  html += '<b>重点关注：</b>' + health.organs + '<br>';
  html += '<b>养生要点：</b>' + health.detail + '<br>';
  html += '<b>🍵 推荐饮食：</b>' + health.food + '<br>';
  html += '<b>⚠️ 避忌：</b>' + health.avoid;
  html += '</div></div>';

  // ═══════ 捌·五行化解 ═══════
  var huajieMap = {
    '木':{action:'①办公桌/家中东侧放绿植（文竹/发财树） ②每周户外运动1-2次 ③佩戴木质手串 ④用青绿色系的手机壳/钱包/笔 ⑤社交账号名加木偏旁字', color:'青绿色、翠绿色', num:'3、8', dir:'东方、东南方', season:'春季（农历1-3月）'},
    '火':{action:'①每天晒朝阳10-15分钟 ②家中南侧保持明亮 ③用红色/紫色系物品 ④多参加聚会社交活动 ⑤练书法/绘画培养静气', color:'红色、紫色、橙色', num:'2、7', dir:'南方', season:'夏季（农历4-6月）'},
    '土':{action:'①多走土路赤脚接地气 ②家中摆放陶瓷器 ③穿黄/棕色系衣物 ④种花种草接触土 ⑤每天练习站桩15分钟', color:'黄色、棕色、咖啡色', num:'5、10', dir:'中央、西南方', season:'长夏（农历6月末）'},
    '金':{action:'①佩戴金银饰品 ②桌面保持整洁有序 ③听钢琴/编钟等金属乐器 ④挂圆形金属装饰物 ⑤每天练习深呼吸30次', color:'白色、金色、银色', num:'4、9', dir:'西方、西北方', season:'秋季（农历7-9月）'},
    '水':{action:'①家里设小鱼缸/加湿器 ②多去水边散步 ③穿黑/蓝/深色衣服 ④每天喝8杯水 ⑤睡前泡脚15分钟', color:'黑色、蓝色、深灰色', num:'1、6', dir:'北方', season:'冬季（农历10-12月）'}
  };

  // Use 喜用神 element for huajie, not just dayWuxing
  // Prioritize 喜用神 → dayWuxing
  var hjEle = yongshenEle || dayWuxing;
  var hj = huajieMap[hjEle] || huajieMap['木'];

  html += '<div style="background:rgba(231,76,60,.06);border:1px solid rgba(231,76,60,.2);padding:14px 16px;margin-bottom:14px;border-radius:10px">';
  html += '<div style="font-size:14px;font-weight:bold;color:#e74c3c;margin-bottom:8px;letter-spacing:2px">捌 · 五行化解</div>';
  html += '<div style="font-size:12px;color:var(--paper);line-height:1.8">';
  html += '<b>您的喜用神为「' + yongshen + '」，建议多用以下方式补益：</b><br><br>';
  html += '<b>🔮 行动清单：</b><br>' + hj.action.split('  ').map(function(a){ return '　' + a; }).join('<br>') + '<br><br>';
  html += '<b>🎨 幸运色：</b>' + hj.color + '&nbsp;&nbsp;&nbsp;';
  html += '<b>🔢 幸运数字：</b>' + hj.num + '&nbsp;&nbsp;&nbsp;';
  html += '<b>🧭 吉利方位：</b>' + hj.dir + '&nbsp;&nbsp;&nbsp;';
  html += '<b>🌿 最强季节：</b>' + hj.season;
  html += '</div></div>';

  // ═══════ 玖·古籍参鉴 ═══════
  var classics = [
    '"道有体用，不可一端论也，务要审其得失、察其进退。" —— 《滴天髓》',
    '"命之理微，天机深藏。非至诚不能通其变，非至精不能穷其数。" —— 《三命通会》',
    '"鬼谷遗文，传于后人。观象玩辞，吉凶可论。" —— 《鬼谷子·命理篇》',
    '"知命者不怨天，自知者不怨人。" —— 《了凡四训》引老子语',
    '"命由我作，福自己求。" —— 《了凡四训》',
    '"积善之家，必有余庆。" —— 《易经·坤卦》',
    '"天行健，君子以自强不息。地势坤，君子以厚德载物。" —— 《易经》',
    '"夫大人者，与天地合其德，与日月合其明，与四时合其序，与鬼神合其吉凶。" —— 《易经·乾卦》'
  ];
  var classic = classics[new Date().getDate() % classics.length];

  html += '<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(201,168,76,.1);padding:14px 16px;margin-bottom:14px;border-radius:8px">';
  html += '<div style="font-size:14px;font-weight:bold;color:var(--gold);margin-bottom:8px;letter-spacing:2px">玖 · 古籍参鉴</div>';
  html += '<div style="font-size:12px;color:var(--paper2);line-height:1.8;font-style:italic">' + classic + '</div>';
  html += '</div>';

  // ═══════ 拾·底部免责 ═══════
  html += '<div style="margin-top:8px;padding:8px 12px;background:#fff8e1;border-left:3px solid #ffc107;border-radius:4px;font-size:10px;color:#888;line-height:1.6">';
  html += '⚠️ 以上命理分析基于传统八字命理学算法生成，仅供文化交流与生活参考，不构成任何决策依据。命运掌握在自己手中——知命是为了更好地努力，而非消极等待。';
  html += '</div>';

  return html;
}
'''

new_content = before + new_func + after
with open(filepath, 'w') as f:
    f.write(new_content)

print("✅ generateInterpretation 已替换为专业版")
print("   新函数: 玖章结构（命盘总览/十神格局/神煞点睛/运程指导/行事指导/缘分感情/健康养生/五行化解/古籍参鉴）")
