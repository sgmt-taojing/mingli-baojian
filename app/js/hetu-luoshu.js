// 河洛数理完整高级应用模块
// 基于河图洛书、九星飞星理论
// 典籍依据：周易系辞传、河图括地象、洛书甄曜度

let HETU_LUOSHU_SYSTEM = {
  hetu: {
    layout: '北方一六水/南方二七火/东方三八木/西方四九金/中央五十土',
    formula: '天一生水地六成之；天二生火地七成之；天三生木地八成之；天四生金地九成之；天五生土地十成之',
    shengShu: {1:'水',2:'火',3:'木',4:'金',5:'土'},
    chengShu: {6:'水',7:'火',8:'木',9:'金',10:'土'},
    wuxingJu: {
      '水局':{sheng:1,cheng:6,characteristics:'智慧、流动、变化',applies:'适合从事传播、物流、咨询行业者'},
      '火局':{sheng:2,cheng:7,characteristics:'热情、光明、变革',applies:'适合从事科技、传媒、餐饮行业者'},
      '木局':{sheng:3,cheng:8,characteristics:'生发、仁慈、文化',applies:'适合从事教育、文化、农业行业者'},
      '金局':{sheng:4,cheng:9,characteristics:'刚毅、果断、收敛',applies:'适合从事金融、法律、制造行业者'},
      '土局':{sheng:5,cheng:10,characteristics:'厚重、包容、积累',applies:'适合从事地产、建筑、保险行业者'}
    },
    bagua: {
      '一六':{gua:'坎',element:'水',direction:'北方',meaning:'险陷、智慧'},
      '二七':{gua:'离',element:'火',direction:'南方',meaning:'光明、文明'},
      '三八':{gua:'震巽',element:'木',direction:'东方',meaning:'震动、生长'},
      '四九':{gua:'兑乾',element:'金',direction:'西方',meaning:'喜悦、刚健'},
      '五十':{gua:'坤艮',element:'土',direction:'中央',meaning:'包容、止定'}
    }
  },
  luoshu: {
    layout: '戴九履一，左三右七，二四为肩，六八为足，五居中央',
    grid: [[4,9,2],[3,5,7],[8,1,6]],
    palace: {
      1:{name:'坎宫',direction:'北方',element:'水',body:'肾/膀胱/耳朵'},
      2:{name:'坤宫',direction:'西南',element:'土',body:'脾/胃/腹部'},
      3:{name:'震宫',direction:'东方',element:'木',body:'肝/胆/神经'},
      4:{name:'巽宫',direction:'东南',element:'木',body:'胆/股/神经'},
      5:{name:'中宫',direction:'中央',element:'土',body:'脾胃全身'},
      6:{name:'乾宫',direction:'西北',element:'金',body:'肺/头部/骨骼'},
      7:{name:'兑宫',direction:'西方',element:'金',body:'肺/口/咽喉'},
      8:{name:'艮宫',direction:'东北',element:'土',body:'胃/关节/背部'},
      9:{name:'离宫',direction:'南方',element:'火',body:'心/眼/血液'}
    },
    nineStars: {
      1:{name:'一白贪狼星',element:'水',luck:'吉',domain:'桃花/人缘/智慧',color:'var(--cyan2)',whenProsperous:'才华横溢，人缘极佳，姻缘美满，学业有成',whenDecline:'桃花劫，感情纠纷，肾脏问题',enhanceMethod:'养水生植物/放鱼缸/蓝色黑色物品'},
      2:{name:'二黑巨门星',element:'土',luck:'凶',domain:'病符/健康',color:'var(--wood)',whenProsperous:'地产兴旺，积累财富',whenDecline:'疾病缠身，脾胃问题，妇科问题',resolveMethod:'挂铜葫芦/六帝铜钱/金属风铃'},
      3:{name:'三碧禄存星',element:'木',luck:'凶',domain:'是非/口舌/官非',color:'var(--jade)',whenProsperous:'事业有成，竞争获胜',whenDecline:'口舌是非，官非诉讼，肝胆问题',resolveMethod:'放红色物品/火属性化解(木生火泄气)'},
      4:{name:'四绿文曲星',element:'木',luck:'吉',domain:'文昌/学业/姻缘',color:'var(--success)',whenProsperous:'学业优异，文采斐然，姻缘和谐',whenDecline:'抑郁寡欢，风湿骨痛',enhanceMethod:'放四支毛笔/绿色植物/文昌塔'},
      5:{name:'五黄廉贞星',element:'土',luck:'大凶',domain:'灾煞/意外/瘟疫',color:'var(--cinn)',whenProsperous:'权威显赫(极少)',whenDecline:'意外灾害，破财破家，重病',resolveMethod:'挂铜铃/六帝钱/金属物品(金泄土)'},
      6:{name:'六白武曲星',element:'金',luck:'吉',domain:'贵人/权力/武功',color:'var(--metal)',whenProsperous:'升官发财，贵人扶持，权威提升',whenDecline:'头部问题，骨骼问题',enhanceMethod:'放金属物品/黄色水晶/铜器'},
      7:{name:'七赤破军星',element:'金',luck:'凶',domain:'贼盗/破财/口舌',color:'var(--cinn2)',whenProsperous:'口才出众，交际能力强',whenDecline:'盗贼破财，口腔问题，肺病',resolveMethod:'放蓝色黑色物品(水泄金)'},
      8:{name:'八白左辅星',element:'土',luck:'吉(当旺)',domain:'财运/置业',color:'var(--gold)',whenProsperous:'财运亨通，置产置业，投资获利',whenDecline:'关节问题，背部问题',enhanceMethod:'放黄色水晶/陶瓷/玉石/八白玉'},
      9:{name:'九紫右弼星',element:'火',luck:'吉(当旺)',domain:'喜庆/姻缘/名声',color:'var(--cinn2)',whenProsperous:'喜庆临门，姻缘美满，名声远扬',whenDecline:'心脏问题，眼疾，血光',enhanceMethod:'放红色物品/紫色物品/鲜花/红灯'}
    }
  }
};

// ── 河洛会员分级工具 ──
function _hlGetMemberLevel() {
  let member = safeGetJSON('memberInfo', {});
  let level = (member.level || 'free').toLowerCase();
  const superUsers = [];
  try { superUsers = JSON.parse(localStorage.getItem('superUsers') || '[]'); } catch(e) {}
  let userPhone = member.phone || '';
  if (superUsers.indexOf(userPhone) >= 0 || level === 'super') return 'super';
  return level;
}

function _hlGetAccessPercent() {
  let lv = _hlGetMemberLevel();
  if (lv === 'super' || lv === 'lifetime' || lv === 'yearly') return 100;
  if (lv === 'monthly') return 60;
  return 30;
}

function _hlNumToWuxing(num) {
  let n = parseInt(num);
  if (n === 0) n = 10;
  const map = {1:'水',6:'水',2:'火',7:'火',3:'木',8:'木',4:'金',9:'金',5:'土',10:'土'};
  return map[n] || '土';
}

function _hlNumShengCheng(num) {
  let n = parseInt(num);
  if (n === 0) n = 10;
  if (n >= 1 && n <= 5) return '生数';
  return '成数';
}

function _hlDetermineWuxingJu(wuxingCount) {
  let max = 0, maxWx = '';
  let keys = Object.keys(wuxingCount);
  for (let i = 0; i < keys.length; i++) {
    if (wuxingCount[keys[i]] > max) { max = wuxingCount[keys[i]]; maxWx = keys[i]; }
  }
  const juMap = {'水':'水局','火':'火局','木':'木局','金':'金局','土':'土局'};
  return juMap[maxWx] || '土局';
}

function _hlFlyStars(year) {
  const baseYear = 1864;
  let offset = (year - baseYear) % 9;
  if (offset < 0) offset += 9;
  let centerStar = ((1 - offset - 1) % 9 + 9) % 9 + 1;
  const flyOrder = [5,6,7,8,9,1,2,3,4];
  const stars = {};
  let cur = centerStar;
  for (let i = 0; i < 9; i++) {
    stars[flyOrder[i]] = cur;
    cur--;
    if (cur < 1) cur = 9;
  }
  return stars;
}

function _hlNameToStrokes(name) {
  let strokeMap = {
    '一':1,'二':2,'三':3,'四':5,'五':4,'六':4,'七':2,'八':2,'九':2,'十':2,
    '人':2,'大':3,'小':3,'中':4,'国':8,'天':4,'地':6,'日':4,'月':4,'水':4,
    '火':4,'木':4,'金':8,'土':3,'山':3,'河':8,'林':8,'森':12,'明':8,'光':6,
    '华':10,'美':9,'好':6,'心':4,'言':7,'语':14,'文':4,'武':8,'道':12,'德':15,
    '仁':4,'义':13,'礼':5,'智':12,'信':9,'福':13,'禄':12,'寿':7,'喜':12,'财':7,
    '安':6,'平':5,'顺':12,'利':7,'吉':6,'祥':10,'瑞':13,'康':11,'宁':5,'和':8,
    '张':7,'王':4,'李':7,'刘':6,'陈':7,'杨':7,'赵':7,'黄':11,'周':8,'吴':7,
    '郑':8,'孙':6,'马':3,'朱':6,'胡':9,'郭':10,'何':7,'高':10,'林':8,'罗':8
  };
  const strokes = [];
  for (let i = 0; i < name.length; i++) {
    let ch = name[i];
    if (strokeMap[ch]) {
      strokes.push(strokeMap[ch]);
    } else {
      let code = name.charCodeAt(i);
      strokes.push((code % 9) + 1);
    }
  }
  return strokes;
}

function analyzeByHetuLuoshu(input, type) {
  let result = {
    type: type, input: input,
    hetu: { numbers: [], wuxingCount: {水:0,火:0,木:0,金:0,土:0}, shengCount: 0, chengCount: 0, wuxingJu: '', bagua: '' },
    luoshu: { palaceCount: {}, stars: {}, luckyStars: [], unluckyStars: [], prosperousStar: null, declineStar: null },
    conclusion: '', advice: '', resolveMethods: [], enhanceMethods: []
  };
  const nums = [];
  if (type === 'mobile') {
    let s = String(input).replace(/\D/g, '');
    for (let i = 0; i < s.length; i++) nums.push(parseInt(s[i]));
  } else if (type === 'name') {
    nums = _hlNameToStrokes(input);
  } else if (type === 'birthday' || type === 'date') {
    let parts = String(input).split(/[-\/\s:]+/);
    for (let p = 0; p < parts.length; p++) {
      let ps = String(parts[p]);
      for (let c = 0; c < ps.length; c++) {
        let d = parseInt(ps[c]);
        if (!isNaN(d)) nums.push(d);
      }
    }
  }
  // 河图五行分析
  for (let ni = 0; ni < nums.length; ni++) {
    let wx = _hlNumToWuxing(nums[ni]);
    let sc = _hlNumShengCheng(nums[ni]);
    result.hetu.numbers.push({num: nums[ni], wuxing: wx, type: sc});
    result.hetu.wuxingCount[wx]++;
    if (sc === '生数') result.hetu.shengCount++; else result.hetu.chengCount++;
  }
  result.hetu.wuxingJu = _hlDetermineWuxingJu(result.hetu.wuxingCount);
  let juInfo = HETU_LUOSHU_SYSTEM.hetu.wuxingJu[result.hetu.wuxingJu];
  if (juInfo) result.hetu.juInfo = juInfo;
  let maxWx = result.hetu.wuxingJu.replace('局','');
  let bkeys = Object.keys(HETU_LUOSHU_SYSTEM.hetu.bagua);
  for (let bk = 0; bk < bkeys.length; bk++) {
    if (HETU_LUOSHU_SYSTEM.hetu.bagua[bkeys[bk]].element === maxWx) {
      result.hetu.bagua = bkeys[bk] + ' -> ' + HETU_LUOSHU_SYSTEM.hetu.bagua[bkeys[bk]].gua + '卦';
      break;
    }
  }
  // 洛书九宫分析
  result.luoshu.palaceCount = {1:0,2:0,3:0,4:0,5:0,6:0,7:0,8:0,9:0};
  for (let pi = 0; pi < nums.length; pi++) {
    let pn = nums[pi] === 0 ? 1 : nums[pi];
    if (pn >= 1 && pn <= 9) result.luoshu.palaceCount[pn]++;
  }
  const prosperous = [], decline = [];
  for (let pk = 1; pk <= 9; pk++) {
    if (result.luoshu.palaceCount[pk] >= 2) prosperous.push(pk);
    if (result.luoshu.palaceCount[pk] === 0) decline.push(pk);
  }
  result.luoshu.prosperousPalaces = prosperous;
  result.luoshu.declinePalaces = decline;
  // 九星分析
  let currentYear = new Date().getFullYear();
  let flyStars = _hlFlyStars(currentYear);
  result.luoshu.flyStars = flyStars;
  let luckyCount = 0, unluckyCount = 0;
  for (let sk = 1; sk <= 9; sk++) {
    let starNum = flyStars[sk];
    let starInfo = HETU_LUOSHU_SYSTEM.luoshu.nineStars[starNum];
    if (starInfo) {
      result.luoshu.stars[sk] = {star: starInfo.name, luck: starInfo.luck, domain: starInfo.domain, count: result.luoshu.palaceCount[sk] || 0};
      if (starInfo.luck.indexOf('吉') >= 0) { luckyCount++; result.luoshu.luckyStars.push({palace: sk, star: starInfo}); }
      else { unluckyCount++; result.luoshu.unluckyStars.push({palace: sk, star: starInfo}); }
    }
  }
  result.luoshu.luckyRatio = Math.round(luckyCount / 9 * 100);
  result.luoshu.unluckyRatio = Math.round(unluckyCount / 9 * 100);
  let maxStar = 0, maxStarPalace = 0;
  for (let ms = 1; ms <= 9; ms++) {
    if ((result.luoshu.palaceCount[ms] || 0) > maxStar) { maxStar = result.luoshu.palaceCount[ms] || 0; maxStarPalace = ms; }
  }
  if (maxStarPalace > 0) {
    let pStar = flyStars[maxStarPalace];
    result.luoshu.prosperousStar = HETU_LUOSHU_SYSTEM.luoshu.nineStars[pStar];
    result.luoshu.prosperousStarPalace = maxStarPalace;
  }
  // 综合结论
  let juName = result.hetu.wuxingJu;
  let juDetail = HETU_LUOSHU_SYSTEM.hetu.wuxingJu[juName];
  const conclusions = [];
  if (juDetail) conclusions.push('五行局为' + juName + '，特质：' + juDetail.characteristics + '。' + juDetail.applies + '。');
  let total = result.hetu.shengCount + result.hetu.chengCount;
  if (total > 0) {
    let shengPct = Math.round(result.hetu.shengCount / total * 100);
    let chengPct = Math.round(result.hetu.chengCount / total * 100);
    if (shengPct > chengPct) conclusions.push('生数占比' + shengPct + '%，先天之数偏旺，主天赋禀赋佳，适合开创性事业。');
    else if (chengPct > shengPct) conclusions.push('成数占比' + chengPct + '%，后天之数偏旺，主后天努力得力，靠勤奋获成功。');
    else conclusions.push('生数与成数均衡，先天后天兼备，稳步发展之象。');
  }
  if (result.luoshu.prosperousStar) {
    let ps2 = result.luoshu.prosperousStar;
    if (ps2.luck.indexOf('吉') >= 0) conclusions.push('当旺九星为' + ps2.name + '（' + ps2.domain + '），' + ps2.whenProsperous + '。');
    else conclusions.push('当旺九星为' + ps2.name + '（' + ps2.domain + '），需注意：' + ps2.whenDecline + '。');
  }
  let wxSorted = Object.keys(result.hetu.wuxingCount).sort(function(a,b){return result.hetu.wuxingCount[b]-result.hetu.wuxingCount[a];});
  if (wxSorted[0] && result.hetu.wuxingCount[wxSorted[0]] > 0) {
    const wxDesc = {水:'智慧灵动但多变',火:'热情积极但易躁',木:'仁慈生发但易优柔',金:'刚毅果断但易固执',土:'厚重包容但易保守'};
    conclusions.push('五行偏向「' + wxSorted[0] + '」，' + (wxDesc[wxSorted[0]]||'') + '。');
  }
  result.conclusion = conclusions.join(' ');
  // 化解与催旺
  const advices = [];
  if (juDetail) advices.push('基于' + juName + '特质，' + juDetail.applies + '。');
  for (let ui = 0; ui < result.luoshu.unluckyStars.length; ui++) {
    let us = result.luoshu.unluckyStars[ui];
    if (us.star.resolveMethod) {
      result.resolveMethods.push({star: us.star.name, palace: us.palace, method: us.star.resolveMethod, domain: us.star.domain});
      advices.push(us.star.name + '（' + us.star.domain + '）化解：' + us.star.resolveMethod + '。');
    }
  }
  for (let li = 0; li < result.luoshu.luckyStars.length; li++) {
    let ls = result.luoshu.luckyStars[li];
    if (ls.star.enhanceMethod) result.enhanceMethods.push({star: ls.star.name, palace: ls.palace, method: ls.star.enhanceMethod, domain: ls.star.domain});
  }
  result.advice = advices.join(' ');
  return result;
}

function getHetuDailyData(year, month, day) {
  const stems = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
  const branches = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
  let dayStemIdx = 0, dayBranchIdx = 0;
  try { dayStemIdx = getDayStemIndex(year, month, day); } catch(e) {}
  try { dayBranchIdx = getDayBranchIndex(year, month, day); } catch(e) {}
  let dayStem = stems[dayStemIdx];
  let dayBranch = branches[dayBranchIdx];
  const stemWuxing = {甲:'木',乙:'木',丙:'火',丁:'火',戊:'土',己:'土',庚:'金',辛:'金',壬:'水',癸:'水'};
  const hetuShengMap = {木:3,火:2,土:5,金:4,水:1};
  const hetuChengMap = {木:8,火:7,土:10,金:9,水:6};
  let stemEle = stemWuxing[dayStem];
  let hetuSheng = hetuShengMap[stemEle];
  let hetuCheng = hetuChengMap[stemEle];
  const zhiToPalace = {子:1,丑:8,寅:8,卯:3,辰:4,巳:4,午:9,未:2,申:2,酉:7,戌:6,亥:6};
  let luoshuPalace = zhiToPalace[dayBranch] || 5;
  let palaceInfo = HETU_LUOSHU_SYSTEM.luoshu.palace[luoshuPalace];
  let flyStars = _hlFlyStars(year);
  let todayStarNum = flyStars[luoshuPalace];
  let todayStarInfo = HETU_LUOSHU_SYSTEM.luoshu.nineStars[todayStarNum];
  const yiList = [], jiList = [];
  if (stemEle === '水') { yiList.push('学习','规划','沟通'); jiList.push('冲动决策'); }
  else if (stemEle === '火') { yiList.push('创新','表达','社交'); jiList.push('暴躁','争执'); }
  else if (stemEle === '木') { yiList.push('种植','教育','慈善'); jiList.push('过度消耗'); }
  else if (stemEle === '金') { yiList.push('决断','理财','法律'); jiList.push('过度刚硬'); }
  else { yiList.push('积累','置业','守成'); jiList.push('冒进','变动'); }
  if (todayStarInfo) {
    if (todayStarInfo.luck.indexOf('吉') >= 0) yiList.push(todayStarInfo.domain.split('/')[0]);
    else jiList.push(todayStarInfo.domain.split('/')[0]);
  }
  return {
    dayStem: dayStem, dayBranch: dayBranch, stemEle: stemEle,
    hetuSheng: hetuSheng, hetuCheng: hetuCheng,
    hetuDesc: '天' + hetuSheng + '生' + stemEle + '，地' + (hetuCheng === 10 ? '十' : hetuCheng) + '成之',
    luoshuPalace: luoshuPalace, palaceInfo: palaceInfo,
    todayStarNum: todayStarNum, todayStarInfo: todayStarInfo,
    flyStars: flyStars, yiList: yiList, jiList: jiList
  };
}

function renderHetuLuoshuDaily() {
  let now = new Date();
  let Y = now.getFullYear(), M = now.getMonth() + 1, D = now.getDate();
  let data = getHetuDailyData(Y, M, D);
  let el = document.getElementById('almanacHetuLuoshu');
  if (!el) return;
  let accessPct = _hlGetAccessPercent();
  const html = '';
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px">';
  html += '<div style="background:rgba(52,152,219,0.06);border:1px solid rgba(52,152,219,0.15);border-radius:8px;padding:12px;text-align:center">';
  html += '<div style="font-size:11px;color:var(--paper2);margin-bottom:6px">🌀 今日河图数</div>';
  html += '<div style="font-size:18px;color:var(--cyan2);font-weight:bold">' + data.hetuSheng + ' · ' + (data.hetuCheng === 10 ? '十' : data.hetuCheng) + '</div>';
  html += '<div style="font-size:11px;color:var(--gold);margin-top:4px">' + data.hetuDesc + '</div>';
  html += '<div style="font-size:10px;opacity:.5;margin-top:2px">五行属' + data.stemEle + '</div>';
  html += '</div>';
  html += '<div style="background:rgba(231,76,60,0.06);border:1px solid rgba(231,76,60,0.15);border-radius:8px;padding:12px;text-align:center">';
  html += '<div style="font-size:11px;color:var(--paper2);margin-bottom:6px">🔮 今日洛书数</div>';
  html += '<div style="font-size:18px;color:var(--cinn2);font-weight:bold">' + data.luoshuPalace + ' · ' + (data.palaceInfo ? data.palaceInfo.name : '') + '</div>';
  html += '<div style="font-size:10px;opacity:.5;margin-top:2px">' + (data.palaceInfo ? data.palaceInfo.direction + ' · ' + data.palaceInfo.element : '') + '</div>';
  html += '</div></div>';
  if (data.todayStarInfo) {
    let s = data.todayStarInfo;
    html += '<div style="background:rgba(201,168,76,0.06);border:1px solid rgba(201,168,76,0.15);border-radius:8px;padding:12px;margin-bottom:12px">';
    html += '<div style="font-size:11px;color:var(--paper2);margin-bottom:6px">⭐ 今日当值九星</div>';
    html += '<div style="font-size:14px;color:' + (s.color||'var(--gold)') + ';font-weight:bold">' + s.name + '</div>';
    html += '<div style="font-size:11px;opacity:.7;margin-top:4px">属性：' + s.element + ' | 吉凶：' + s.luck + ' | 主：' + s.domain + '</div>';
    if (accessPct >= 60) {
      if (s.luck.indexOf('吉') >= 0) html += '<div style="font-size:11px;color:var(--success);margin-top:4px">✅ 旺时：' + s.whenProsperous + '</div>';
      else html += '<div style="font-size:11px;color:var(--cinn2);margin-top:4px">⚠️ 衰时：' + s.whenDecline + '</div>';
    }
    html += '</div>';
  }
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">';
  html += '<div style="background:rgba(46,204,113,0.06);border:1px solid rgba(46,204,113,0.15);border-radius:8px;padding:10px">';
  html += '<div style="font-size:11px;color:var(--success);margin-bottom:4px">✅ 河洛宜</div>';
  html += '<div style="font-size:12px;color:var(--paper)">' + data.yiList.join('、') + '</div></div>';
  html += '<div style="background:rgba(231,76,60,0.06);border:1px solid rgba(231,76,60,0.15);border-radius:8px;padding:10px">';
  html += '<div style="font-size:11px;color:var(--cinn2);margin-bottom:4px">⚠️ 河洛忌</div>';
  html += '<div style="font-size:12px;color:var(--paper)">' + data.jiList.join('、') + '</div></div></div>';
  if (accessPct >= 30) {
    html += '<div style="background:rgba(201,168,76,0.04);border:1px solid rgba(201,168,76,0.1);border-radius:8px;padding:12px;margin-bottom:12px">';
    html += '<div style="font-size:11px;color:var(--gold);margin-bottom:8px;text-align:center">🔮 今日九宫飞星图</div>';
    html += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px;max-width:280px;margin:0 auto">';
    const gridOrder = [4,9,2,3,5,7,8,1,6];
    for (let gi = 0; gi < 9; gi++) {
      let palaceNum = gridOrder[gi];
      let starAtPalace = data.flyStars[palaceNum];
      let starData = HETU_LUOSHU_SYSTEM.luoshu.nineStars[starAtPalace];
      let isToday = palaceNum === data.luoshuPalace;
      html += '<div style="background:' + (isToday?'rgba(201,168,76,0.2)':'rgba(255,255,255,0.03)') + ';border:1px solid ' + (isToday?'var(--gold)':'rgba(201,168,76,0.1)') + ';border-radius:6px;padding:6px;text-align:center">';
      html += '<div style="font-size:9px;opacity:.5">' + palaceNum + '宫</div>';
      if (starData) { html += '<div style="font-size:11px;color:' + (starData.color||'var(--gold)') + ';font-weight:bold">' + starData.name.substring(0,3) + '</div>'; html += '<div style="font-size:8px;opacity:.5">' + starData.luck + '</div>'; }
      html += '</div>';
    }
    html += '</div>';
    if (accessPct < 60) html += '<div style="text-align:center;margin-top:8px"><button onclick="showVipModal()" style="background:linear-gradient(135deg,var(--gold),var(--gold2));color:var(--ink2);border:none;padding:6px 16px;border-radius:16px;font-size:11px;cursor:pointer">👑 升级会员查看详解</button></div>';
    html += '</div>';
  }
  if (accessPct < 60) {
    html += '<div style="text-align:center;padding:10px;background:rgba(201,168,76,0.05);border-radius:8px;margin-top:8px">';
    html += '<div style="font-size:11px;color:var(--paper2);margin-bottom:4px">🔒 完整河洛分析为会员专享</div>';
    html += '<button onclick="showVipModal()" style="background:linear-gradient(135deg,var(--gold),var(--gold2));color:var(--ink2);border:none;padding:6px 16px;border-radius:16px;font-size:11px;cursor:pointer;font-weight:bold">👑 升级会员</button>';
    html += '</div>';
  }
  el.innerHTML = html;
}
