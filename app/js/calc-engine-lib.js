// 易道智鉴 · 测算引擎库
// 包含：六爻、紫微斗数、奇门遁甲、梅花易数、大六壬、姓名学、风水、择日

// ═══ 从divination-core.js兼容的函数（防止跨文件引用丢失）═══
if (typeof _qmGetMaXing !== 'function') {
  window._qmGetMaXing = function(hourZhiIdx) {
    let maMap = {0:'寅',4:'寅',8:'寅', 5:'亥',9:'亥',1:'亥', 2:'申',6:'申',10:'申', 3:'巳',7:'巳',11:'巳'};
    let maZhi = maMap[hourZhiIdx];
    let maGongMap = {'子':1,'丑':8,'寅':8,'卯':3,'辰':4,'巳':4,'午':9,'未':2,'申':2,'酉':7,'戌':6,'亥':6};
    return maGongMap[maZhi] || 5;
  };
}
if (typeof _qmCheckWuBuYuShi !== 'function') {
  window._qmCheckWuBuYuShi = function(dayGanIdx, hourGzIdx) {
    let _stems = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
    let dayStem = dayGanIdx % 10;
    let hourStem = hourGzIdx % 10;
    let gangsters = {'甲':'庚','乙':'辛','丙':'壬','丁':'癸','戊':'甲','己':'乙','庚':'丙','辛':'丁','壬':'戊','癸':'己'};
    return gangsters[_stems[dayStem]] === _stems[hourStem];
  };
}
if (typeof _qmGetKongWang !== 'function') {
  window._qmGetKongWang = function(dayGzIdx) {
    let xunKong = ['戌亥','申酉','午未','辰巳','寅卯','子丑'];
    let xunIdx = Math.floor((dayGzIdx % 60) / 10);
    let kongZhi = xunKong[xunIdx];
    let kongGongMap = {'子':1,'丑':8,'寅':8,'卯':3,'辰':4,'巳':4,'午':9,'未':2,'申':2,'酉':7,'戌':6,'亥':6};
    return [kongGongMap[kongZhi[0]], kongGongMap[kongZhi[1]]];
  };
}

// ========== 工具函数 ==========
function _qyMod(n, m) { return ((n % m) + m) % m; }

const _STEMS = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
const _BRANCHES = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
const _GUA_XIANG = {
  0:{name:'乾',sym:'☰',code:'111',wuxing:'金',family:'父'},
  1:{name:'兑',sym:'☱',code:'110',wuxing:'金',family:'少女'},
  2:{name:'离',sym:'☲',code:'101',wuxing:'火',family:'中女'},
  3:{name:'震',sym:'☳',code:'100',wuxing:'木',family:'长男'},
  4:{name:'巽',sym:'☴',code:'011',wuxing:'木',family:'长女'},
  5:{name:'坎',sym:'☵',code:'010',wuxing:'水',family:'中男'},
  6:{name:'艮',sym:'☶',code:'001',wuxing:'土',family:'少男'},
  7:{name:'坤',sym:'☷',code:'000',wuxing:'土',family:'母'}
};
const _GUA_ORDER = [0,1,2,3,4,5,6,7]; // 先天八卦数：乾1兑2离3震4巽5坎6艮7坤8
const _XING = {金:0,木:1,水:2,火:3,土:4};
const _SHICHEN = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
const _NAYIN = [
  '海中金','海中金','炉中火','炉中火','大林木','大林木','路旁土','路旁土','剑锋金','剑锋金',
  '山头火','山头火','涧下水','涧下水','城头土','城头土','白蜡金','白蜡金','杨柳木','杨柳木',
  '泉中水','泉中水','屋上土','屋上土','霹雳火','霹雳火','松柏木','松柏木','长流水','长流水',
  '沙中金','沙中金','山下火','山下火','平地木','平地木','壁上土','壁上土','金箔金','金箔金',
  '覆灯火','覆灯火','天河水','天河水','大驿土','大驿土','钗钏金','钗钏金','桑柘木','桑柘木',
  '大溪水','大溪水','沙中土','沙中土','天上火','天上火','石榴木','石榴木','大海水','大海水'
];

function _stemIdx(gan) { return _STEMS.indexOf(gan); }
function _branchIdx(zhi) { return _BRANCHES.indexOf(zhi); }
function _ganZhiIdx(gz) { const g = gz.gan||gz[0], z = gz.zhi||gz[1]; return _STEMS.indexOf(g) * 12 + _BRANCHES.indexOf(z); }
function _getGuaFromNum(n) { return _GUA_ORDER[_qyMod(n-1,8)]; }
function _getGuaLines(code) { return code.split('').map(c=>c==='1'?'阳':'阴'); }

// ========== 1. 六爻测算引擎 ==========

function liuyaoQiGua(method, params) {
  let upperNum=0, lowerNum=0, dongNum=0;
  if (method === 'time') {
    const p = params || {};
    const y = p.year || new Date().getFullYear();
    const m = p.month || (new Date().getMonth()+1);
    const d = p.day || new Date().getDate();
    const h = p.hour || new Date().getHours();
    upperNum = y + m + d;
    lowerNum = y + m + d + h;
    dongNum = y + m + d + h;
  } else if (method === 'number') {
    const p = params || {};
    upperNum = p.n1 || 1;
    lowerNum = p.n2 || 1;
    dongNum = p.n3 || (upperNum + lowerNum);
  } else if (method === 'char') {
    const ch = (params && params.char) ? params.char : '易';
    const strokes = _chineseStrokes(ch);
    upperNum = strokes[0] || 1;
    lowerNum = strokes[1] || 1;
    dongNum = strokes.reduce((a,b)=>a+b,0);
  } else if (method === 'coin') {
    const tosses = (params && params.tosses) ? params.tosses : [];
    if (tosses.length !== 6) throw new Error('coin tosses need 6 arrays');
    const lines = tosses.map(t => {
      const sum = t.reduce((a,b)=>a+b,0);
      if (sum === 0) return {line:'阴', dong:true};   // 老阴
      if (sum === 3) return {line:'阳', dong:true};   // 老阳
      if (sum === 1) return {line:'阳', dong:false};  // 少阳
      return {line:'阴', dong:false};                  // 少阴
    });
    const ben = lines.slice(); // tosses[0]=初爻(底), 不反转
    const dong = [];
    const bian = ben.map((l,idx)=>{
      if (l.dong) { dong.push(idx); return {line: l.line==='阳'?'阴':'阳', dong:false}; }
      return l;
    });
    return {
      method: 'coin',
      benGua: _linesToGua(ben),
      bianGua: _linesToGua(bian),
      dongYao: dong,
      lines: ben,
      bianLines: bian
    };
  }
  upperNum = Math.max(1, upperNum);
  lowerNum = Math.max(1, lowerNum);
  dongNum = Math.max(1, dongNum);
  const upperGua = _getGuaFromNum(upperNum);
  const lowerGua = _getGuaFromNum(lowerNum);
  const dongYao = _qyMod(dongNum, 6);
  const benLines = _buildLines(lowerGua, upperGua);
  const bianLines = benLines.slice();
  bianLines[dongYao] = {line: benLines[dongYao].line==='阳'?'阴':'阳', dong:false};
  return {
    method: method,
    benGua: {upper: upperGua, lower: lowerGua, idx: _guaIndexFromParts(lowerGua, upperGua)},
    bianGua: _linesToGua(bianLines),
    dongYao: [dongYao],
    lines: benLines,
    bianLines: bianLines,
    params: {upperNum, lowerNum, dongNum}
  };
}

function _chineseStrokes(ch) {
  const arr = String(ch).split('');
  return arr.map(c => (c.charCodeAt(0) % 10) + 1);
}

function _buildLines(lowerIdx, upperIdx) {
  const lowerCode = _GUA_XIANG[lowerIdx].code;
  const upperCode = _GUA_XIANG[upperIdx].code;
  const all = lowerCode + upperCode;
  return all.split('').map(c=>({line: c==='1'?'阳':'阴', dong:false}));
}

function _linesToGua(lines) {
  const code = lines.map(l=>l.line==='阳'?'1':'0').join('');
  const lowerCode = code.slice(0,3);
  const upperCode = code.slice(3,6);
  const lowerIdx = Object.keys(_GUA_XIANG).find(k=>_GUA_XIANG[k].code===lowerCode);
  const upperIdx = Object.keys(_GUA_XIANG).find(k=>_GUA_XIANG[k].code===upperCode);
  return {
    upper: parseInt(upperIdx),
    lower: parseInt(lowerIdx),
    idx: _guaIndexFromParts(parseInt(lowerIdx), parseInt(upperIdx)),
    code: code
  };
}

function _guaIndexFromParts(lowerIdx, upperIdx) {
  return upperIdx * 8 + lowerIdx;
}

const _BAGONG_ORDER = {
  0:[0,4,6,7,39,55,23,16],
  1:[9,13,15,14,46,62,30,25],
  2:[18,22,20,21,53,37,5,2],
  3:[27,31,29,28,60,44,12,11],
  4:[36,32,34,35,3,19,51,52],
  5:[45,41,43,42,10,26,58,61],
  6:[54,50,48,49,17,1,33,38],
  7:[63,59,57,56,24,8,40,47]
};
const _GONG_ZHI = {
  0:['子','寅','辰','午','申','戌'], 7:['未','巳','卯','丑','亥','酉'],
  2:['卯','丑','亥','酉','未','巳'], 4:['子','寅','辰','午','申','戌'],
  5:['丑','亥','酉','未','巳','卯'], 6:['寅','辰','午','申','戌','子'],
  3:['辰','午','申','戌','子','寅'], 1:['酉','未','巳','卯','丑','亥']
};
const _GONG_GAN = {0:'甲',1:'丁',2:'己',3:'庚',4:'辛',5:'戊',6:'丙',7:'乙'}; // 乾甲坤乙民丙兑丁坎戊离己震庚巽辛
const _LIUSHEN = ['青龙','朱雀','勾陈','腾蛇','白虎','玄武'];
const _LIUQIN = ['兄弟','妻财','子孙','官鬼','父母']; // 0同我 1我克 2我生 3克我 4生我

function liuyaoZhuangGua(guaData, dayGanZhi) {
  const ben = guaData.benGua;
  const idx = ben.idx;
  let gong = 0, pos = 0;
  for (const g in _BAGONG_ORDER) {
    const p = _BAGONG_ORDER[g].indexOf(idx);
    if (p >= 0) { gong = parseInt(g); pos = p; break; }
  }
  const gongWx = _GUA_XIANG[gong].wuxing;
  const zhis = _GONG_ZHI[gong];
  const gan = _GONG_GAN[gong];
  const gans = _peiTianGan(gong, gan);
  const liuqin = zhis.map(z => {
    const zWx = _zhiWuxing(z);
    return _computeLiuQin(gongWx, zWx);
  });
  const dayGan = dayGanZhi ? dayGanZhi[0] : '甲';
  const liushen = _peiLiuShen(dayGan);
  const shiying = _shiYingFromPos(pos);
  return {
    gong: gong,
    gongName: _GUA_XIANG[gong].name + '宫',
    gongWuxing: gongWx,
    tiangan: gans,
    dizhi: zhis,
    liuqin: liuqin,
    liushen: liushen,
    shiying: shiying
  };
}

function _peiTianGan(gongIdx, gan) {
  // 纳甲法: 内卦3爻同干, 外卦3爻同干
  // 乾内甲外壬, 坤内乙外癸, 其他宫内本干外本干+6
  const innerGan = gan;
  let outerGan;
  if (gongIdx === 0) { outerGan = '壬'; } // 乾内甲外壬
  else if (gongIdx === 7) { outerGan = '癸'; } // 坤内乙外癸
  else { outerGan = _STEMS[_qyMod(_STEMS.indexOf(gan) + 5, 10)]; } // 其他: 外卦干 = 内卦干 + 5
  return [innerGan, innerGan, innerGan, outerGan, outerGan, outerGan];
}

function _zhiWuxing(zhi) {
  const map = {'子':'水','丑':'土','寅':'木','卯':'木','辰':'土','巳':'火','午':'火','未':'土','申':'金','酉':'金','戌':'土','亥':'水'};
  return map[zhi];
}

function _computeLiuQin(gongWx, zhiWx) {
  const g = _XING[gongWx], z = _XING[zhiWx];
  const diff = _qyMod(z - g, 5);
  return _LIUQIN[diff];
}

function _peiLiuShen(dayGan) {
  const map = {'甲':0,'乙':0,'丙':1,'丁':1,'戊':2,'己':3,'庚':4,'辛':4,'壬':5,'癸':5};
  const start = map[dayGan] || 0;
  return Array.from({length:6},(_,i)=>_LIUSHEN[_qyMod(start+i,6)]);
}

function _shiYingFromPos(pos) {
  const map = [0,1,2,3,4,5,3,2];
  const s = map[pos] || 0;
  const y = _qyMod(s + 3, 6);
  return {shi: s, ying: y};
}

function liuyaoDuanGua(guaData, question) {
  const zg = guaData.zhuangGua || liuyaoZhuangGua(guaData, guaData.dayGanZhi || '甲子');
  const dong = guaData.dongYao || [];
  const lines = guaData.lines || [];
  const yongshenMap = {
    '财':'妻财','求财':'妻财','官':'官鬼','事业':'官鬼','父母':'父母','学业':'父母',
    '子女':'子孙','兄弟':'兄弟','婚姻':'妻财','感情':'妻财','疾病':'官鬼'
  };
  let yongshen = '官鬼';
  if (question) {
    for (const k in yongshenMap) { if (question.includes(k)) { yongshen = yongshenMap[k]; break; } }
  }
  const yongIdx = zg.liuqin.indexOf(yongshen);
  let yongState = '未现';
  if (yongIdx >= 0) {
    const yongLine = lines[yongIdx];
    yongState = yongLine.line + (yongLine.dong?'动':'静');
  }
  const dayZhi = guaData.dayGanZhi ? guaData.dayGanZhi[1] : '子';
  const monthZhi = guaData.monthZhi || '寅';
  const yongZhi = yongIdx >= 0 ? zg.dizhi[yongIdx] : '';
  const isWang = (yongZhi === dayZhi || yongZhi === monthZhi || _shengZhe(yongZhi, dayZhi, monthZhi));
  
  // 旬空判断: 根据日干支查旬空
  let dayGzIdx = 0;
  if (guaData.dayGanZhi) {
    const dg = guaData.dayGanZhi[0]; // 天干
    const dz = guaData.dayGanZhi[1]; // 地支
    const ganIdx = _STEMS.indexOf(dg);
    const zhiIdx = _BRANCHES.indexOf(dz);
    if (ganIdx >= 0 && zhiIdx >= 0) {
      // 六十甲子序数: 找到匹配的甲子
      for (let i = 0; i < 60; i++) {
        if (i % 10 === ganIdx && i % 12 === zhiIdx) { dayGzIdx = i; break; }
      }
    }
  }
  const xunKong = _getXunKongZhi(dayGzIdx);
  const isKong = yongZhi && xunKong.includes(yongZhi);
  
  // 六合六冲
  const liuhePairs = {'子':'丑','寅':'亥','卯':'戌','辰':'酉','巳':'申','午':'未'};
  const liuchongPairs = {'子':'午','丑':'未','寅':'申','卯':'酉','辰':'戌','巳':'亥'};
  const dayHe = yongZhi && liuhePairs[yongZhi] === dayZhi;
  const dayChong = yongZhi && liuchongPairs[yongZhi] === dayZhi;
  const monthHe = yongZhi && liuhePairs[yongZhi] === monthZhi;
  const monthChong = yongZhi && liuchongPairs[yongZhi] === monthZhi;
  
  let verdict = '平';
  if (yongIdx < 0) verdict = '用神未上卦，事难明朗';
  else if (isKong) verdict = '用神旬空，谋事难成';
  else if (isWang && dong.includes(yongIdx)) verdict = '用神旺相发动，事可成就';
  else if (isWang && dayHe) verdict = '用神旺相合日，事可成但迟';
  else if (isWang) verdict = '用神旺相，事体稳妥';
  else if (dayChong || monthChong) verdict = '用神被冲，事多变动';
  else if (dong.includes(yongIdx)) verdict = '用神发动，力不足';
  else verdict = '用神休囚，宜静待';
  
  const yingqi = _yingqiHint(yongZhi);
  const enhance = _liuyaoEnhance(guaData, zg, yongIdx, dayZhi, monthZhi);
  // 暗动补充判断
  if (enhance.anDong && enhance.anDong.length > 0 && yongIdx >= 0 && enhance.anDong.includes(yongIdx)) {
    verdict = '用神暗动（被日辰冲），暗中有人相助';
  }
  // 伏神补充
  if (yongIdx < 0 && enhance.fuShen) {
    verdict = '用神伏藏于' + enhance.fuShen.fuZhi + '（' + (enhance.fuShenAppear ? '飞神空亡发动，伏神可出' : '飞神压伏，难以出现') + '）';
  }
  // 三合局补充
  if (enhance.sanhe && enhance.sanhe.length > 0) {
    verdict += '；' + enhance.sanhe.map(s => s.matched.join('') + '合' + s.wx + '局').join('、');
  }
  return {
    yongshen, yongshenIdx: yongIdx, yongshenState: yongState,
    yongshenWang: isWang, verdict, dongYao: dong, yingqi,
    xunKong: isKong, xunKongZhi: xunKong,
    liuhe: dayHe || monthHe, liuchong: dayChong || monthChong,
    anDong: enhance.anDong, fuShen: enhance.fuShen, sanhe: enhance.sanhe, jinTui: enhance.jinTui,
    advice: _liuyaoAdvice(question, verdict)
  };
}

function _shengZhe(yongZhi, dayZhi, monthZhi) {
  // 升级: 实现月令旺相休囚死体系 + 日辰生克
  const yw = _zhiWuxing(yongZhi);
  const dw = _zhiWuxing(dayZhi);
  const mw = _zhiWuxing(monthZhi);
  
  // 月令旺衰: 同我为旺, 生我为相, 我生为休, 我克为囚, 克我为死
  const wangState = {同:'旺',生:'相',我生:'休',我克:'囚',克:'死'};
  let monthState = '死';
  if (mw === yw) monthState = '旺';
  else if (_wxSheng(mw, yw)) monthState = '相';
  else if (_wxSheng(yw, mw)) monthState = '休';
  else if (_wxKe(yw, mw)) monthState = '囚';
  else if (_wxKe(mw, yw)) monthState = '死';
  
  // 日辰生克
  let dayState = '平';
  if (dw === yw) dayState = '日建';
  else if (_wxSheng(dw, yw)) dayState = '日生';
  else if (_wxSheng(yw, dw)) dayState = '日泄';
  else if (_wxKe(dw, yw)) dayState = '日克';
  else if (_wxKe(yw, dw)) dayState = '日制';
  
  // 综合: 旺相 + 日建/日生 = 旺相; 休囚 + 日克 = 休囚无力
  const isWang = (monthState === '旺' || monthState === '相') && (dayState === '日建' || dayState === '日生' || dayState === '平');
  const isXiu = (monthState === '休' || monthState === '囚') && dayState !== '日克';
  const isSi = monthState === '死' || dayState === '日克';
  
  return isWang; // 返回布尔值用于兼容
}

function _wxSheng(a, b) { // a生b?
  const sheng = {'金':'水','水':'木','木':'火','火':'土','土':'金'};
  return sheng[a] === b;
}
function _wxKe(a, b) { // a克b?
  const ke = {'金':'木','木':'土','土':'水','水':'火','火':'金'};
  return ke[a] === b;
}

function _getXunKongZhi(gzIdx) {
  // 旬空: 甲子旬空戌亥, 甲戌旬空申酉, ... 每旬空两个地支
  const xun = Math.floor(gzIdx / 10); // 0-5
  const xunKongMap = [
    ['戌','亥'], // 甲子旬
    ['申','酉'], // 甲戌旬
    ['午','未'], // 甲申旬
    ['辰','巳'], // 甲午旬
    ['寅','卯'], // 甲辰旬
    ['子','丑']  // 甲寅旬
  ];
  return xunKongMap[xun] || ['戌','亥'];
}

function _yingqiHint(zhi) {
  if (!zhi) return '难以确定';
  return '逢' + zhi + '日、' + _BRANCHES[_qyMod(_branchIdx(zhi)+6,12)] + '日，或' + zhi + '月、' + _BRANCHES[_qyMod(_branchIdx(zhi)+6,12)] + '月';
}

function _liuyaoAdvice(q, v) {
  if (v.includes('成就') || v.includes('旺相发动')) return '用神旺相发动，事可成就。当前时运有利，可积极推进。';
  if (v.includes('旺相') || v.includes('稳妥')) return '用神旺相安静，事体稳妥。按部就班，终有所成。';
  if (v.includes('发动') && v.includes('不足')) return '用神发动但力不足，宜等待时机再进。';
  if (v.includes('休囚')) return '用神休囚无力，时机尚未成熟，宜蓄势待发。';
  if (v.includes('未上卦') || v.includes('未现')) return '用神未上卦，事体不明，需另寻线索。';
  return '需结合卦象、动爻、旬空等综合分析。';
}

// 暗动: 静爻被日辰冲为暗动
function _anDong(yongIdx, lines, dayZhi, zg) {
  if (yongIdx < 0 || !lines[yongIdx] || lines[yongIdx].dong) return false;
  const yongZhi = zg.dizhi[yongIdx];
  const liuchongPairs = {'子':'午','丑':'未','寅':'申','卯':'酉','辰':'戌','巳':'亥'};
  return liuchongPairs[yongZhi] === dayZhi;
}

// 伏神飞神: 用神不上卦时, 从本宫首卦找伏神
function _fuShen(yongshen, zg) {
  // 用神未上卦, 从本宫纯卦(八纯卦)中找伏神
  const gongIdx = zg.gong;
  const gongWx = _GUA_XIANG[gongIdx].wuxing;
  // 八纯卦的地支排列
  const gongZhis = _GONG_ZHI[gongIdx];
  const gongGan = _GONG_GAN[gongIdx];
  const gongGans = _peiTianGan(gongIdx, gongGan);
  const gongLiuqin = gongZhis.map(z => _computeLiuQin(gongWx, _zhiWuxing(z)));
  const fuIdx = gongLiuqin.indexOf(yongshen);
  if (fuIdx < 0) return null;
  return { fuZhi: gongZhis[fuIdx], fuIdx: fuIdx, feiIdx: 0 };
}

// 三合局: 申子辰水局/亥卯未木局/寅午戌火局/巳酉丑金局
function _sanheJu(zhis) {
  const sets = [
    {zhis:['申','子','辰'], wx:'水'},
    {zhis:['亥','卯','未'], wx:'木'},
    {zhis:['寅','午','戌'], wx:'火'},
    {zhis:['巳','酉','丑'], wx:'金'}
  ];
  const results = [];
  for (const s of sets) {
    const matched = zhis.filter(z => s.zhis.includes(z));
    if (matched.length >= 2) results.push({ ju: s.zhis.join(''), wx: s.wx, matched });
  }
  return results;
}

// 六爻断卦增强: 暗动+伏神+三合局
function _liuyaoEnhance(guaData, zg, yongIdx, dayZhi, monthZhi) {
  const lines = guaData.lines || [];
  const dong = guaData.dongYao || [];
  const result = {};
  
  // 暗动判断
  result.anDong = [];
  for (let i = 0; i < 6; i++) {
    if (!dong.includes(i) && lines[i]) {
      const yaoZhi = zg.dizhi[i];
      const liuchongPairs = {'子':'午','丑':'未','寅':'申','卯':'酉','辰':'戌','巳':'亥'};
      if (liuchongPairs[yaoZhi] === dayZhi) {
        result.anDong.push(i);
      }
    }
  }
  
  // 伏神飞神 (用神不上卦时)
  result.fuShen = null;
  if (yongIdx < 0) {
    const fs = _fuShen(guaData.yongshen || '官鬼', zg);
    if (fs) {
      result.fuShen = fs;
      // 伏神出现条件: 飞神发动或空亡
      const feiZhi = zg.dizhi[fs.feiIdx];
      result.fuShenAppear = dong.includes(fs.feiIdx) || _getXunKongZhi(
        (() => {
          if (!guaData.dayGanZhi) return 0;
          const gi = _STEMS.indexOf(guaData.dayGanZhi[0]);
          const zi = _BRANCHES.indexOf(guaData.dayGanZhi[1]);
          for (let i = 0; i < 60; i++) { if (i%10===gi && i%12===zi) return i; }
          return 0;
        })()
      ).includes(feiZhi);
    }
  }
  
  // 三合局
  const allZhis = zg.dizhi;
  result.sanhe = _sanheJu(allZhis);
  
  // 进神/退神 (动爻化进化退)
  result.jinTui = [];
  if (guaData.bianGua && guaData.bianGua.lines) {
    const bianLines = guaData.bianGua.lines;
    for (const idx of dong) {
      const oldZhi = zg.dizhi[idx];
      // 需要变卦的纳甲信息
      const bianZg = liuyaoZhuangGua({benGua: guaData.bianGua, dayGanZhi: guaData.dayGanZhi}, guaData.dayGanZhi);
      const newZhi = bianZg.dizhi[idx];
      if (newZhi) {
        // 进神: 化进(同类前进) 简化判断: 化旺
        const oldWx = _zhiWuxing(oldZhi);
        const newWx = _zhiWuxing(newZhi);
        if (_wxSheng(oldWx, newWx) || oldWx === newWx) result.jinTui.push({idx, type: '进神', from: oldZhi, to: newZhi});
        else if (_wxKe(newWx, oldWx) || _wxKe(oldWx, newWx)) result.jinTui.push({idx, type: '退神', from: oldZhi, to: newZhi});
      }
    }
  }
  
  return result;
}

const _ZW_GONGS = ['命宫','兄弟','夫妻','子女','财帛','疾厄','迁移','仆役','官禄','田宅','福德','父母'];

function ziweiPaiPan(birthYear, birthMonth, birthDay, birthHour, sex) {
  const hourIdx = Math.floor((birthHour + 1) / 2) % 12; // 时辰索引: 子=0,丑=1...亥=11
  const yinIdx = 2;
  let mingIdx = _qyMod(yinIdx + (birthMonth-1) - hourIdx, 12);
  let shenIdx = _qyMod(yinIdx + (birthMonth-1) + hourIdx, 12);
  const gongMap = {};
  for (let i=0;i<12;i++) {
    gongMap[_ZW_GONGS[i]] = _qyMod(mingIdx - i, 12);
  }
  // 定局: 用命宫干支的纳音五行
  const yearGanIdx = _qyMod(birthYear - 4, 10);
  // 命宫天干: 五虎遁（年干起正月寅）
  const mingGanIdx = _qyMod(yearGanIdx + 2 + mingIdx - 2, 10); // 简化: 年干+2+命宫地支偏移
  // 更精确: 月柱天干由年干和月支决定，命宫天干同月柱天干推法
  const wuhuStart = {0:0, 5:2, 1:2, 6:4, 2:4, 7:6, 3:6, 8:8, 4:8, 9:0}; // 丙寅起
  // 五虎遁: 甲己起丙寅, 乙庚起戊寅, 丙辛起庚寅, 丁壬起壬寅, 戊癸起甲寅
  const wuhu = {0:2, 5:2, 1:4, 6:4, 2:6, 7:6, 3:8, 8:8, 4:0, 9:0};
  const tigerStartGan = wuhu[yearGanIdx] || 2;
  const mingGan = _qyMod(tigerStartGan + mingIdx - 2, 10); // 寅=2, 从寅起数到命宫地支
  const ju = _ziweiJu(mingGan, mingIdx);
  // 安紫微: 查表法
  const ziweiPos = _anZiwei(ju, birthDay);
  // 安天府: 天府 = 紫微以寅申线对称的位置
  const tianfuPos = (4 - ziweiPos + 12) % 12;
  const stars = Array(12).fill(null).map(()=>[]);
  // 紫微系星曜（逆行）
  const ziweiXi = [
    {name:'紫微', offset:0},
    {name:'天机', offset:-1},
    {name:'太阳', offset:-3},
    {name:'武曲', offset:-4},
    {name:'天同', offset:-5},
    {name:'廉贞', offset:-8},
  ];
  for (const s of ziweiXi) {
    const pos = _qyMod(ziweiPos + s.offset, 12);
    stars[pos].push(s.name);
  }
  // 天府系星曜（顺行）
  const tianfuXi = [
    {name:'天府', offset:0},
    {name:'太阴', offset:1},
    {name:'贪狼', offset:2},
    {name:'巨门', offset:3},
    {name:'天相', offset:4},
    {name:'天梁', offset:5},
    {name:'七杀', offset:6},
    {name:'破军', offset:10},
  ];
  for (const s of tianfuXi) {
    const pos = _qyMod(tianfuPos + s.offset, 12);
    stars[pos].push(s.name);
  }
  const sihua = _sihuaByYearGan(_STEMS[yearGanIdx]);
  
  // 辅星排布
  // 左辅: 正月从辰(4)起顺行
  const zuofuPos = _qyMod(4 + birthMonth - 1, 12);
  stars[zuofuPos].push('左辅');
  // 右弼: 正月从戌(10)起逆行
  const youbiPos = _qyMod(10 - (birthMonth - 1), 12);
  stars[youbiPos].push('右弼');
  // 文昌: 子时从戌(10)起逆行
  const wenchangPos = _qyMod(10 - hourIdx, 12);
  stars[wenchangPos].push('文昌');
  // 文曲: 子时从辰(4)起顺行
  const wenquPos = _qyMod(4 + hourIdx, 12);
  stars[wenquPos].push('文曲');
  
  // 煞星排布
  // 天魁(昼贵): 按日干
  const dayJzIdx = _getDayGzIdx(birthYear, birthMonth, birthDay);
  const dayGanIdx = dayJzIdx % 10;
  const tiankuiMap = {0:1,4:1,6:1,1:0,5:0,2:11,3:11,8:5,9:5,7:6};
  const tianyueMap = {0:7,4:7,6:7,1:8,5:8,2:9,3:9,8:3,9:3,7:2};
  const tkPos = tiankuiMap[dayGanIdx];
  const tyPos = tianyueMap[dayGanIdx];
  if (tkPos !== undefined) stars[tkPos].push('天魁');
  if (tyPos !== undefined) stars[tyPos].push('天钺');
  
  // 擎羊/陀罗: 年干禄前/后一位
  const luPos = {0:2,1:3,2:5,3:6,4:5,5:6,6:8,7:9,8:11,9:0}; // 禄位
  const lu = luPos[yearGanIdx];
  const qingyangPos = _qyMod(lu + 1, 12);
  const tuoluoPos = _qyMod(lu - 1, 12);
  stars[qingyangPos].push('擎羊');
  stars[tuoluoPos].push('陀罗');
  
  // 地空/地劫: 子时从亥(11)起, 空逆劫顺
  const dikongPos = _qyMod(11 - hourIdx, 12);
  const dijiePos = _qyMod(11 + hourIdx, 12);
  stars[dikongPos].push('地空');
  stars[dijiePos].push('地劫');
  
  // 火星/铃星: 年支三合局+时支
  const yearZhiIdx = _qyMod(birthYear - 4, 12);
  const sanhe = yearZhiIdx % 4; // 0=申子辰, 1=巳酉丑, 2=寅午戌, 3=亥卯未
  const huoStarts = {0:3, 1:3, 2:1, 3:9}; // 火星起始
  const lingStarts = {0:1, 1:1, 2:3, 3:10}; // 铃星起始
  const huoxingPos = _qyMod(huoStarts[sanhe] + hourIdx, 12);
  const lingxingPos = _qyMod(lingStarts[sanhe] + hourIdx, 12);
  stars[huoxingPos].push('火星');
  stars[lingxingPos].push('铃星');
  
  return {
    birthYear, birthMonth, birthDay, birthHour, sex,
    mingZhi: _BRANCHES[mingIdx], shenZhi: _BRANCHES[shenIdx],
    mingGanZhi: _STEMS[mingGan] + _BRANCHES[mingIdx],
    ju, gongMap, stars, sihua, ziweiPos, tianfuPos,
    auxStars: { zuofu: zuofuPos, youbi: youbiPos, wenchang: wenchangPos, wenqu: wenquPos,
                tiankui: tkPos, tianyue: tyPos, qingyang: qingyangPos, tuoluo: tuoluoPos,
                dikong: dikongPos, dijie: dijiePos, huoxing: huoxingPos, lingxing: lingxingPos }
  };
}

function _getDayGzIdx(year, month, day) {
  const baseDate = new Date(1900, 0, 1);
  const dayDiff = Math.floor((new Date(year, month-1, day) - baseDate) / 86400000);
  return ((dayDiff % 60) + 60) % 60;
}

const _ZW_NAYIN_PAIRS = ["金","火","木","土","金","火","水","土","金","木","水","土","火","木","水","金","火","木","土","金","火","水","土","金","木","水","土","火","木","水"];
const _ZW_JU_MAP = {"水":2,"木":3,"金":4,"土":5,"火":6};

function _ziweiJu(mingGanIdx, mingZhiIdx) {
  // 根据命宫天干地支的纳音五行定局数
  // 六十甲子: jiazi_idx where ganIdx%10==mingGanIdx and zhiIdx%12==mingZhiIdx
  let jiaziIdx = -1;
  for (let i=0;i<60;i++) {
    if (i%10===mingGanIdx%10 && i%12===mingZhiIdx%12) { jiaziIdx=i; break; }
  }
  if (jiaziIdx < 0) return 2;
  const pairIdx = Math.floor(jiaziIdx / 2);
  const nayin = _ZW_NAYIN_PAIRS[pairIdx];
  return _ZW_JU_MAP[nayin] || 2;
}

const _ZW_POS_TABLE = {
  2: [1,2,2,3,3,4,5,5,6,6,7,8,8,9,9,10,11,11,12,12,1,2,2,3,3,4,5,5,6,6],
  3: [2,3,4,4,5,6,6,7,8,8,9,10,10,11,12,12,1,2,2,3,4,4,5,6,6,7,8,8,9,10],
  4: [3,4,5,6,6,7,8,9,9,10,11,12,12,1,2,3,3,4,5,6,6,7,8,9,9,10,11,12,12,1],
  5: [4,5,6,7,8,8,9,10,11,12,12,1,2,3,4,4,5,6,7,8,8,9,10,11,12,12,1,2,3,4],
  6: [5,6,7,8,9,10,11,12,12,1,2,3,4,4,5,6,7,8,9,10,11,12,12,1,2,3,4,4,5,6]
};

function _anZiwei(ju, day) {
  // 标准查表法安紫微星, 返回0-11的宫位索引
  const table = _ZW_POS_TABLE[ju];
  if (!table || day < 1 || day > 30) return 0;
  return table[day - 1] - 1; // 1-based转0-based (子=0)
}

function _sihuaByYearGan(gan) {
  const map = {
    '甲':{lu:'廉贞',quan:'破军',ke:'武曲',ji:'太阳'},
    '乙':{lu:'天机',quan:'天梁',ke:'紫微',ji:'太阴'},
    '丙':{lu:'天同',quan:'天机',ke:'文昌',ji:'廉贞'},
    '丁':{lu:'太阴',quan:'天同',ke:'天机',ji:'巨门'},
    '戊':{lu:'贪狼',quan:'太阴',ke:'右弼',ji:'天机'},
    '己':{lu:'武曲',quan:'贪狼',ke:'天梁',ji:'文曲'},
    '庚':{lu:'太阳',quan:'武曲',ke:'太阴',ji:'天同'},
    '辛':{lu:'巨门',quan:'太阳',ke:'文曲',ji:'文昌'},
    '壬':{lu:'天梁',quan:'紫微',ke:'左辅',ji:'武曲'},
    '癸':{lu:'破军',quan:'巨门',ke:'太阴',ji:'贪狼'}
  };
  return map[gan] || map['甲'];
}

function ziweiAnalysis(panData) {
  const mingPos = panData.gongMap['命宫'];
  const mingStars = panData.stars[mingPos] || [];
  const starsStr = mingStars.join('、') || '无主星';
  
  // 三方四正: 命宫+对宫(迁移)+财帛+官禄
  const opposites = {0:6,1:7,2:8,3:9,4:10,5:11,6:0,7:1,8:2,9:3,10:4,11:5}; // 对宫
  const sanfangPos = opposites[mingPos]; // 迁移宫
  // 财帛宫 = 命宫+4, 官禄宫 = 命宫+5 (顺时针)
  const caiweiPos = (mingPos + 4) % 12;
  const guanluPos = (mingPos + 5) % 12;
  const sanfangStars = []
    .concat(panData.stars[sanfangPos] || [])
    .concat(panData.stars[caiweiPos] || [])
    .concat(panData.stars[guanluPos] || []);
  
  // 格局判断
  let geju = '普通命局';
  const allStars = mingStars.concat(sanfangStars);
  if (mingStars.includes('紫微')) geju = '紫微坐命，贵气稳重';
  else if (mingStars.includes('天府')) geju = '天府坐命，忠厚富足';
  else if (mingStars.includes('太阳')) geju = '太阳坐命，光明磊落';
  else if (mingStars.includes('武曲')) geju = '武曲坐命，刚毅果断';
  else if (mingStars.includes('天同')) geju = '天同坐命，温和有福';
  else if (mingStars.includes('七杀')) geju = '七杀坐命，果敢有魄力';
  else if (mingStars.includes('破军')) geju = '破军坐命，开创力强';
  else if (mingStars.includes('贪狼')) geju = '贪狼坐命，多才多艺';
  else if (mingStars.includes('天机')) geju = '天机坐命，聪明多谋';
  else if (mingStars.includes('太阴')) geju = '太阴坐命，温柔细腻';
  else if (mingStars.includes('巨门')) geju = '巨门坐命，口才出众';
  else if (mingStars.includes('天相')) geju = '天相坐命，稳重正直';
  else if (mingStars.includes('天梁')) geju = '天梁坐命，老成持重';
  else if (mingStars.includes('廉贞')) geju = '廉贞坐命，能文能武';
  
  // 特殊格局检测
  const starSet = new Set(allStars);
  if (starSet.has('紫微') && starSet.has('天府')) geju += ' · 紫府同宫格';
  if (starSet.has('太阳') && starSet.has('太阴')) geju += ' · 日月并明格';
  if (starSet.has('七杀') && starSet.has('破军') && starSet.has('贪狼')) geju += ' · 杀破狼格';
  if (starSet.has('天机') && starSet.has('太阴') && starSet.has('天同') && starSet.has('天梁')) geju += ' · 机月同梁格';
  if (mingStars.includes('紫微') && mingStars.includes('天府') && mingPos === 4) geju = '紫府朝垣格';
  if ((mingStars.includes('太阳') && mingPos === 4) || (mingStars.includes('太阴') && mingPos === 10)) geju += ' · 庙旺格';
  
  // 四化落宫
  const sihua = panData.sihua;
  const sihuaDetail = [];
  // 找到化禄星所在宫位
  for (let i = 0; i < 12; i++) {
    const sList = panData.stars[i] || [];
    if (sList.includes(sihua.lu)) {
      const gongName = _getGongName(i, panData.gongMap);
      sihuaDetail.push('化禄('+sihua.lu+')入'+gongName);
    }
    if (sList.includes(sihua.quan)) {
      const gongName = _getGongName(i, panData.gongMap);
      sihuaDetail.push('化权('+sihua.quan+')入'+gongName);
    }
    if (sList.includes(sihua.ke)) {
      const gongName = _getGongName(i, panData.gongMap);
      sihuaDetail.push('化科('+sihua.ke+')入'+gongName);
    }
    if (sList.includes(sihua.ji)) {
      const gongName = _getGongName(i, panData.gongMap);
      sihuaDetail.push('化忌('+sihua.ji+')入'+gongName);
    }
  }
  
  // 大限计算 (每10年一个大限, 从命宫起顺行)
  // 起运年龄 = 局数 (水2木3金4土5火6)
  const daxianStart = panData.ju || 2;
  const daxianList = [];
  const gongNames = ['命宫','兄弟','夫妻','子女','财帛','疾厄','迁移','奴仆','官禄','田宅','福德','父母'];
  // 阳男阴女顺行, 阴男阳女逆行
  const yearStem = panData.yearStem || '';
  const isYangStem = ['甲','丙','戊','庚','壬'].includes(yearStem);
  const isMale = panData.sex === 'male';
  const isForward = (isYangStem && isMale) || (!isYangStem && !isMale);
  for (let i = 0; i < 12; i++) {
    const pos = isForward ? (mingPos + i) % 12 : (mingPos - i + 12) % 12;
    const startAge = daxianStart + i * 10;
    const endAge = startAge + 9;
    const stars = panData.stars[pos] || [];
    daxianList.push({
      gong: gongNames[i],
      pos: pos,
      ageRange: startAge + '-' + endAge + '岁',
      stars: stars.join('、') || '无主星',
      sihua: stars.filter(s => [sihua.lu, sihua.quan, sihua.ke, sihua.ji].includes(s))
        .map(s => s === sihua.lu ? '化禄' : s === sihua.quan ? '化权' : s === sihua.ke ? '化科' : '化忌')
    });
  }
  
  // 当前大限 (假设用户当前年龄)
  const currentYear = new Date().getFullYear();
  const age = currentYear - panData.birthYear;
  const currentDaxian = daxianList.find(d => {
    const [s, e] = d.ageRange.split('-').map(n => parseInt(n));
    return age >= s && age <= e;
  }) || daxianList[0];
  
  // 庙旺平陷评估
  const starStrength = _evalStarStrength(stars, mingPos);
  
  return {
    geju, 
    mingStars: starsStr,
    starStrength: starStrength,
    sanfang: '三方四正: ' + (panData.stars[sanfangPos]||[]).join('、') + ' / ' + 
             (panData.stars[caiweiPos]||[]).join('、') + ' / ' + (panData.stars[guanluPos]||[]).join('、'),
    sihuaText: '化禄：'+sihua.lu+'、化权：'+sihua.quan+'、化科：'+sihua.ke+'、化忌：'+sihua.ji,
    sihuaDetail: sihuaDetail.join('；'),
    daxian: daxianList,
    currentDaxian: currentDaxian ? currentDaxian.gong + '(' + currentDaxian.ageRange + ') ' + currentDaxian.stars : '未确定',
    overview: (panData.sex==='male'?'男命':'女命')+'，'+panData.mingZhi+'命宫，'+panData.ju+'局。命宫主星: '+starsStr+'。三方四正会照: '+sanfangStars.join('、')+'。',
    advice: _ziweiAdvice(geju, sihuaDetail, currentDaxian)
  };
}

// 庙旺平陷评估
function _evalStarStrength(stars, gongPos) {
  // 12宫位索引: 0=子...11=亥
  // 简化庙旺表: 14主星在12宫的强度 (3=庙, 2=旺, 1=平, 0=陷)
  const strengthTable = {
    '紫微': [2,2,3,2,1,1,2,2,3,2,1,1],
    '天机': [1,1,2,3,2,1,1,1,2,3,2,1],
    '太阳': [0,1,1,2,3,3,2,1,1,2,3,3],
    '武曲': [2,1,1,1,2,3,2,1,1,1,2,3],
    '天同': [3,2,1,1,1,2,3,2,1,1,1,2],
    '廉贞': [1,1,1,2,3,2,1,1,1,2,3,2],
    '天府': [3,3,2,1,1,1,2,3,3,2,1,1],
    '太阴': [3,2,1,1,1,0,1,2,3,2,1,1],
    '贪狼': [1,2,3,2,1,1,1,2,3,2,1,1],
    '巨门': [1,1,1,2,3,2,1,1,1,2,3,2],
    '天相': [2,3,2,1,1,1,2,3,2,1,1,1],
    '天梁': [1,1,2,3,2,1,1,1,2,3,2,1],
    '七杀': [2,1,1,1,2,3,2,1,1,1,2,3],
    '破军': [1,1,1,2,3,2,1,1,1,2,3,2]
  };
  const labels = ['庙','旺','平','陷'];
  const result = [];
  for (const star of stars) {
    const table = strengthTable[star];
    if (!table) continue;
    const s = table[gongPos] || 1;
    result.push({ star, strength: s, label: labels[3-s] });
  }
  // 四化叠加效应
  const sihuaEffect = {
    '化禄': '增益财禄', '化权': '增强权势', '化科': '声名提升', '化忌': '波折阻碍'
  };
  return { stars: result, summary: result.map(s => s.star + '(' + s.label + ')').join('、') };
}

function _getGongName(pos, gongMap) {
  for (const name in gongMap) {
    if (gongMap[name] === pos) return name;
  }
  return _BRANCHES[pos]+'宫';
}

function _ziweiAdvice(geju, sihuaDetail, currentDaxian) {
  let tips = [];
  if (geju.includes('紫微')) tips.push('紫微入命，领导力强，注意勿过于独断。');
  if (geju.includes('天府')) tips.push('天府入命，理财能力强，宜稳健发展。');
  if (geju.includes('七杀') || geju.includes('破军')) tips.push('杀破狼格，宜从事开创性工作。');
  if (geju.includes('机月同梁')) tips.push('机月同梁格，适合文职或企划工作。');
  if (sihuaDetail.some(s => s.includes('化忌入命宫'))) tips.push('化忌入命，早年多波折，后渐入佳境。');
  if (sihuaDetail.some(s => s.includes('化禄入财帛'))) tips.push('化禄入财帛，财运亨通。');
  if (sihuaDetail.some(s => s.includes('化权入官禄'))) tips.push('化权入官禄，事业有成。');
  if (currentDaxian && currentDaxian.stars.includes('化禄')) tips.push('当前大限化禄照会，运势顺遂。');
  if (currentDaxian && currentDaxian.stars.includes('化忌')) tips.push('当前大限化忌照会，宜低调谨慎。');
  if (tips.length === 0) tips.push('紫微斗数重在星曜组合与宫位互动，建议结合大限流年综合论断。');
  return tips.join(' ');
}

// ========== 3. 奇门遁甲 ==========

const _QM_MEN = ['休','生','伤','杜','景','死','惊','开'];
const _QM_STARS = ['蓬','任','冲','辅','英','芮','柱','心','禽'];
const _QM_SHEN = ['值符','腾蛇','太阴','六合','白虎','玄武','九地','九天'];
const _QY_JIANG = ['戊','己','庚','辛','壬','癸','丁','丙','乙'];

function qimenPaiPan(year, month, day, hour, juType) {
  // 时辰索引
  const hourIdx = Math.floor((hour + 1) / 2) % 12; // 子=0,丑=1...亥=11
  // 日干支索引（简化: 用公历日期估算）
  const baseDate = new Date(1900, 0, 1); // 1900-01-01 = 甲子日
  const dayDiff = Math.floor((new Date(year, month-1, day) - baseDate) / 86400000);
  const dayGzIdx = ((dayDiff % 60) + 60) % 60; // 日干支序数 0-59
  const dayGanIdx = dayGzIdx % 10;
  const dayZhiIdx = dayGzIdx % 12;
  // 时干支
  const hourGzIdx = ((dayGanIdx * 12 + hourIdx) % 60 + 60) % 60; // 五子遁
  // 定遁: 冬至后阳遁, 夏至后阴遁
  let dun = juType;
  if (!dun || dun === 'auto') {
    // 简化: 用公历日期判断
    const m = month, d = day;
    const dayOfYear = Math.floor((new Date(year, month-1, day) - new Date(year, 0, 0)) / 86400000);
    // 冬至~夏至前 = 阳遁, 夏至~冬至前 = 阴遁
    dun = (dayOfYear >= 355 || dayOfYear < 172) ? 'yang' : 'yin';
  }
  // 定局: 根据节气和日干支上中下元
  // 简化定局: 用日干支序数除以5的商+1作为元数, 再结合遁的阴阳定局
  // 更准确的方法: 根据节气确定用哪个局的表
  const ju = _qimenGetJu(year, month, day, dun, dayGzIdx);
  // 地盘: 六仪三奇按局数排列
  const dipan = _qimenDiPan(dun, ju);
  // 天盘: 按时辰转动
  const tianpan = _qimenTianPan(dipan, hourGzIdx, ju, dun);
  // 八门
  const men = _qimenMen(dun, ju, hourGzIdx, dayGzIdx, dipan);
  // 九星: 值符跟天盘旬首位置
  const stars = _qimenStars(dun, ju, hourGzIdx, dayGzIdx, tianpan);
  // 八神: 值符跟值符星所在宫(天盘)
  const shen = _qimenShen(dun, hourGzIdx, dayGzIdx, tianpan, stars);
  return { year, month, day, hour, dun, ju, dipan, tianpan, men, stars, shen,
           dayGzIdx, hourGzIdx, hourIdx };
}

// 奇门定局表 (简化版: 根据节气和元数定局)
// 阳遁: 冬至174, 小寒285, 大寒396, 立春852, 雨水963, 惊蛰174...
// 阴遁: 夏至936, 小暑825, 大暑714, 立秋258, 处暑147, 白露936...
const _QM_YANG_JU = { // 阳遁节气定局 (上元,中元,下元)
  '冬至':[1,7,4], '小寒':[2,8,5], '大寒':[3,9,6],
  '立春':[8,5,2], '雨水':[9,6,3], '惊蛰':[1,7,4],
  '春分':[3,9,6], '清明':[4,1,7], '谷雨':[5,2,8],
  '立夏':[4,1,7], '小满':[5,2,8], '芒种':[6,3,9]
};
const _QM_YIN_JU = { // 阴遁节气定局
  '夏至':[9,3,6], '小暑':[8,2,5], '大暑':[7,1,4],
  '立秋':[2,5,8], '处暑':[1,4,7], '白露':[9,3,6],
  '秋分':[7,1,4], '寒露':[6,9,3], '霜降':[5,8,2],
  '立冬':[6,9,3], '小雪':[5,8,2], '大雪':[4,7,1]
};
// 节气近似日期表 (公历, 北半球)
const _JIEQI_DATES = [
  [1,6,'小寒'],[1,20,'大寒'],[2,4,'立春'],[2,19,'雨水'],
  [3,6,'惊蛰'],[3,21,'春分'],[4,5,'清明'],[4,20,'谷雨'],
  [5,6,'立夏'],[5,21,'小满'],[6,6,'芒种'],[6,21,'夏至'],
  [7,7,'小暑'],[7,23,'大暑'],[8,8,'立秋'],[8,23,'处暑'],
  [9,8,'白露'],[9,23,'秋分'],[10,8,'寒露'],[10,23,'霜降'],
  [11,7,'立冬'],[11,22,'小雪'],[12,7,'大雪'],[12,22,'冬至']
];

function _getJieqi(month, day) {
  let jq = '冬至'; // 默认
  for (const [m, d, name] of _JIEQI_DATES) {
    if (month === m && day >= d) jq = name;
    else if (month > m || (month === m && day < d)) break;
  }
  // 处理跨年
  if (month === 12 && day < 22) jq = '大雪';
  if (month === 1 && day < 6) jq = '冬至';
  return jq;
}

function _qimenGetJu(year, month, day, dun, dayGzIdx) {
  const jq = _getJieqi(month, day);
  // 定元: 日干支序数 0-59, 上元=甲子~戊辰(0-4), 中元=己巳~癸酉(5-9)...每5天一元
  const yuanIdx = Math.floor((dayGzIdx % 60) / 5); // 0=上元,1=中元,2=下元,3=上元...
  const yuan = yuanIdx % 3; // 0=上元, 1=中元, 2=下元
  const table = dun === 'yang' ? _QM_YANG_JU : _QM_YIN_JU;
  const juArr = table[jq] || (dun === 'yang' ? [1,7,4] : [9,3,6]);
  return juArr[yuan];
}

function _qimenDiPan(dun, ju) {
  // 六仪三奇: 戊己庚辛壬癸丁丙乙 (地盘固定排列顺序)
  // 阳遁顺布六仪, 逆布三奇; 阴遁逆布六仪, 顺布三奇
  // 九宫顺序 (洛书): 1坎 2坤 3震 4巽 5中 6乾 7兑 8艮 9离
  // 宫位顺序按洛书九宫飞布
  const gongOrder = [1,8,3,4,9,2,7,6]; // 戊起的宫位顺序(跳过中5)
  // 六仪三奇固定顺序
  const liuSan = ['戊','己','庚','辛','壬','癸','丁','丙','乙'];
  const res = {};
  // 从戊起, 按局数确定起始宫
  // 阳遁: 戊从1宫起, 顺飞九宫
  // 实际: 戊在ju宫, 然后按九宫顺序排列
  const palaceSeq = dun === 'yang' 
    ? [1,2,3,4,5,6,7,8,9] // 阳遁顺飞
    : [9,8,7,6,5,4,3,2,1]; // 阴遁逆飞
  // 戊的起始宫位 = ju (局数对应宫位)
  // 阳遁1局: 戊在1宫, 阳遁2局: 戊在2宫...
  // 阴遁9局: 戊在9宫, 阴遁8局: 戊在8宫...
  const startPalace = ju;
  for (let i = 0; i < 9; i++) {
    const palace = (dun === 'yang') 
      ? ((startPalace - 1 + i) % 9) + 1
      : ((startPalace - 1 - i + 90) % 9) + 1;
    res[palace] = liuSan[i];
  }
  return res;
}

function _qimenTianPan(dipan, hourGzIdx, ju, dun) {
  // 天盘转动逻辑:
  // 1. 找到时辰旬首(甲子旬戊,甲戌旬己,甲申旬庚,甲午旬辛,甲辰旬壬,甲寅旬癸)
  // 2. 旬首六仪在地盘的宫位 = 值符所在宫
  // 3. 天盘 = 以值符宫为起点, 将地盘六仪三奇按九宫顺序重新排布
  //    阳遁顺飞, 阴遁逆飞
  // 旬首对应六仪
  const xunShou = Math.floor(hourGzIdx / 10) * 10; // 旬首干支序数(0,10,20,30,40,50)
  const xunYi = ['戊','己','庚','辛','壬','癸'][Math.floor(xunShou / 10) % 6];
  // 找到旬首六仪在地盘的宫位 = 值符宫
  let xunGong = 5;
  for (let p = 1; p <= 9; p++) {
    if (dipan[p] === xunYi) { xunGong = p; break; }
  }
  // 天盘排布: 以值符宫为起点, 按九宫飞布重新排列地盘六仪三奇
  // 九宫飞布顺序: 阳遁 1→2→3→4→5→6→7→8→9, 阴遁 9→8→7→6→5→4→3→2→1
  // 天盘第i个位置(从值符宫起飞) = 地盘对应飞布位置的第i个仪
  const res = {};
  // 构建飞布宫位序列
  const flySeq = [];
  for (let i = 0; i < 9; i++) {
    const palace = (dun === 'yang')
      ? ((xunGong - 1 + i) % 9) + 1
      : ((xunGong - 1 - i + 90) % 9) + 1;
    flySeq.push(palace);
  }
  // 天盘: 飞布序列第i个宫 = 地盘飞布序列第i个宫的仪
  // 即天盘[flySeq[i]] = dipan[flySeq[i]] 但以值符宫对齐转动
  // 正确算法: 天盘上的值符所在宫 = 地盘值符所在宫的仪(即旬首仪)
  // 然后按飞布顺序, 天盘下一宫 = 地盘下一宫的仪
  // 等价于: 天盘 = 地盘按值符宫对齐后飞布
  for (let i = 0; i < 9; i++) {
    res[flySeq[i]] = dipan[flySeq[i]];
  }
  // 但天盘真正的转动: 天盘相对地盘转动 = 时辰地支使值符移位
  // 更精确: 天盘的值符 = 时辰天干对应的六仪, 放在时辰地支对应的宫
  // 简化标准法: 天盘以旬首为值符, 值符随旬首在天盘上转动到时辰地支宫
  // 即: 天盘值符仪放在时辰地支在地盘的宫位上
  const hourZhiIdx = hourGzIdx % 12;
  // 时辰地支在地盘上的位置: 找到与时辰地支对应宫
  // 地支与宫位对应: 子=1坎 丑=8艮 寅=8艮 卯=3震 辰=4巽 巳=4巽
  // 午=9离 未=2坤 申=2坤 酉=7兑 戌=6乾 亥=6乾
  // 但奇门中, 天盘转动是: 值符随时辰天干走, 不是地支
  // 正确: 天盘 = 地盘以时辰旬首值符为基准转动
  // 旬首在地盘xunGong, 天盘将旬首仪转到时辰对冲宫
  // 标准转盘法: 天盘 = 地盘整体旋转, 使值符转到时辰地支宫
  // 时辰地支宫位(后天八卦): 子1 丑寅8 卯3 辰巳4 午9 未申2 酉7 戌亥6
  const zhiGong = [1,8,8,3,4,4,9,2,2,7,6,6]; // 子丑寅卯辰巳午未申酉戌亥
  const targetGong = zhiGong[hourZhiIdx];
  // 旋转量: 从xunGong转到targetGong
  // 天盘[targetGong] = dipan[xunGong] (旬首仪)
  // 然后按飞布顺序排列
  const rotateSeq = [];
  for (let i = 0; i < 9; i++) {
    const palace = (dun === 'yang')
      ? ((targetGong - 1 + i) % 9) + 1
      : ((targetGong - 1 - i + 90) % 9) + 1;
    rotateSeq.push(palace);
  }
  // 天盘: rotateSeq[i] 宫 = 地盘 flySeq[i] 宫的仪
  // 其中 flySeq 是以 xunGong 为起点的飞布序列
  for (let i = 0; i < 9; i++) {
    res[rotateSeq[i]] = dipan[flySeq[i]];
  }
  return res;
}

function _qimenMen(dun, ju, hourGzIdx, dayGzIdx, dipan) {
  // 八门排布: 休生伤杜景死惊开
  // 值使从旬首所在宫起, 随时辰递宫
  // 阳遁顺飞九宫, 阴遁逆飞九宫
  // 中宫(5宫)无门, 跳过
  const baseMen = ['休','生','伤','杜','景','死','惊','开'];
  // 旬首
  const xunShou = Math.floor(hourGzIdx / 10) * 10;
  const xunYi = ['戊','己','庚','辛','壬','癸'][Math.floor(xunShou / 10) % 6];
  // 找旬首宫
  let xunGong = 5;
  for (let p = 1; p <= 9; p++) {
    if (dipan[p] === xunYi) { xunGong = p; break; }
  }
  // 原始门宫位: 休1 生8 伤3 杜4 景9 死2 惊7 开6
  const menFixedGong = {1:'休',8:'生',3:'伤',4:'杜',9:'景',2:'死',7:'惊',6:'开'};
  // 值使 = 旬首宫对应的原始门
  const zhiShi = menFixedGong[xunGong] || '休';
  const zhiShiIdx = baseMen.indexOf(zhiShi);
  // 时辰在旬中的序数 (0-9)
  const hourInXun = hourGzIdx - xunShou;
  // 九宫飞布(跳过中宫5)
  const gongFly = dun === 'yang'
    ? [1,2,3,4,6,7,8,9]
    : [9,8,7,6,4,3,2,1];
  // 找到xunGong在gongFly中的位置
  let startPos = 0;
  for (let i = 0; i < gongFly.length; i++) {
    if (gongFly[i] === xunGong) { startPos = i; break; }
  }
  // 值使从旬首宫起, 走hourInXun步
  // 从值使宫开始, 按八门顺序排列
  const res = {};
  for (let i = 0; i < 8; i++) {
    const palace = gongFly[(startPos + hourInXun + i) % gongFly.length];
    res[palace] = baseMen[(zhiShiIdx + i) % 8];
  }
  return res;
}

function _qimenStars(dun, ju, hourGzIdx, dayGzIdx, tianpan) {
  // 九星排布: 天蓬、天芮、天冲、天辅、天禽、天心、天柱、天任、天英
  // 原始宫位: 蓬1 芮2 冲3 辅4 禽5 心6 柱7 任8 英9
  // 值符跟旬首所在宫(天盘旬首位置)
  // 其余九星按九宫顺序排列, 阳遁顺飞阴遁逆飞
  const baseStars = ['蓬','芮','冲','辅','禽','心','柱','任','英'];
  // 旬首
  const xunShou = Math.floor(hourGzIdx / 10) * 10;
  const xunYi = ['戊','己','庚','辛','壬','癸'][Math.floor(xunShou / 10) % 6];
  // 找旬首宫(在天盘上的位置)
  let xunGong = 5;
  for (let p = 1; p <= 9; p++) {
    if (tianpan[p] === xunYi) { xunGong = p; break; }
  }
  // 值符星 = 旬首所在宫的原始星 (宫号1-9对应baseStars索引0-8)
  const zhiFuStar = baseStars[xunGong - 1];
  const zhiFuIdx = baseStars.indexOf(zhiFuStar);
  // 九宫飞布顺序(含中宫5)
  const gongFlyFull = dun === 'yang'
    ? [1,2,3,4,5,6,7,8,9]
    : [9,8,7,6,5,4,3,2,1];
  // 找到xunGong在飞布序列中的位置
  let startPos = 0;
  for (let i = 0; i < gongFlyFull.length; i++) {
    if (gongFlyFull[i] === xunGong) { startPos = i; break; }
  }
  // 从值符星开始, 按九星顺序+九宫飞布排布
  const res = {};
  for (let i = 0; i < 9; i++) {
    const palace = gongFlyFull[(startPos + i) % 9];
    res[palace] = baseStars[(zhiFuIdx + i) % 9];
  }
  return res;
}

function _qimenShen(dun, hourGzIdx, dayGzIdx, tianpan, stars) {
  // 八神排布: 值符、螣蛇、太阴、六合、白虎、玄武、九地、九天
  // 值符跟值符星所在宫(天盘旬首位置)
  // 其余八神按九宫顺序排列, 阳遁顺飞阴遁逆飞
  // 中宫无神(中宫寄宫), 跳过5宫
  const baseShen = ['值符','螣蛇','太阴','六合','白虎','玄武','九地','九天'];
  // 旬首
  const xunShou = Math.floor(hourGzIdx / 10) * 10;
  const xunYi = ['戊','己','庚','辛','壬','癸'][Math.floor(xunShou / 10) % 6];
  // 找旬首宫(在天盘上的位置 = 值符星所在宫)
  let xunGong = 5;
  for (let p = 1; p <= 9; p++) {
    if (tianpan[p] === xunYi) { xunGong = p; break; }
  }
  // 九宫飞布(跳过中宫5)
  const gongFly = dun === 'yang'
    ? [1,2,3,4,6,7,8,9]
    : [9,8,7,6,4,3,2,1];
  // 找到xunGong在gongFly中的位置
  let startPos = 0;
  for (let i = 0; i < gongFly.length; i++) {
    if (gongFly[i] === xunGong) { startPos = i; break; }
  }
  // 从值符宫开始, 按八神顺序排列
  const res = {};
  for (let i = 0; i < 8; i++) {
    const palace = gongFly[(startPos + i) % 8];
    res[palace] = baseShen[i];
  }
  return res;
}

function qimenAnalyze(panData, question) {
  const target = {
    '财':'生门','求财':'生门','官':'开门','事业':'开门','婚':'六合','婚姻':'六合',
    '病':'天芮','疾病':'天芮','出行':'景门','考试':'天辅','诉讼':'惊门','争':'惊门',
    '盗':'玄武','贼':'玄武','失':'玄武'
  };
  let key = '开门';
  if (question) {
    for (const k in target) { if (question.includes(k)) { key = target[k]; break; } }
  }
  let palace = null;
  for (let p=1;p<=9;p++) {
    if (panData.men[p] === key || panData.stars[p] === key || panData.shen[p] === key) { palace = p; break; }
  }
  if (!palace) palace = 1;
  let men = panData.men[palace];
  let star = panData.stars[palace];
  let shen = panData.shen[palace];
  let qi = panData.tianpan[palace];
  
  // 格局判断
  const geju = [];
  // 吉格
  if (panData.dipan && panData.tianpan) {
    for (let p = 1; p <= 9; p++) {
      const dip = panData.dipan[p];
      const tip = panData.tianpan[p];
      // 伏吟: 天盘与地盘相同
      if (dip === tip) geju.push(p + '宫伏吟');
      // 青龙返首: 天盘戊加地盘戊 (天盘甲子戊加地盘甲子戊)
      if (tip === '戊' && dip === '戊') geju.push(p + '宫青龙返首(戊加戊)');
      // 飞鸟跌穴: 天盘丙奇加地盘甲子戊
      if (tip === '丙' && dip === '戊') geju.push(p + '宫飞鸟跌穴(丙加戊)');
      // 玉女守门: 天盘丁奇加地盘开门所在宫
      if (tip === '丁' && panData.men[p] === '开') geju.push(p + '宫玉女守门(丁加开门)');
      // 凶格: 庚加庚 (太白入荧/荧入太白)
      if (tip === '庚' && dip === '丙') geju.push(p + '宫太白入荧(庚加丙)');
      if (tip === '丙' && dip === '庚') geju.push(p + '宫荧入太白(丙加庚)');
      // 凶格: 戊加辛 (青龙折足)
      if (tip === '戊' && dip === '辛') geju.push(p + '宫青龙折足(戊加辛)');
      // 凶格: 辛加戊 (腾蛇夭矫)
      if (tip === '辛' && dip === '乙') geju.push(p + '宫腾蛇夭矫(辛加乙)');
      // 凶格: 癸加丁 (腾蛇夭娇)
      if (tip === '癸' && dip === '丁') geju.push(p + '宫腾蛇夭矫(癸加丁)');
      // 凶格: 丁加癸 (朱雀投江)
      if (tip === '丁' && dip === '癸') geju.push(p + '宫朱雀投江(丁加癸)');
    }
  }
  // 三诈格: 门吉星吉神吉 = 真诈; 门吉星凶神吉 = 假诈; 门凶星吉神吉 = 重诈
  const jimen = ['休','生','开'];
  const jistar = ['辅','心','任','禽'];
  const jishen = ['值符','太阴','六合','九天'];
  const xiongmen = ['死','惊','伤'];
  const xiongstar = ['芮','柱','蓬'];
  const xiongshen = ['白虎','玄武','腾蛇'];
  // 检查三诈格 (遍历所有宫)
  for (let p = 1; p <= 9; p++) {
    if (p === 5) continue;
    const pm = panData.men[p];
    const ps = panData.stars[p];
    const ph = panData.shen[p];
    if (!pm || !ps || !ph) continue;
    if (jimen.includes(pm) && jistar.includes(ps) && jishen.includes(ph)) {
      geju.push(p + '宫真诈格(门星神俱吉)');
    } else if (jimen.includes(pm) && xiongstar.includes(ps) && jishen.includes(ph)) {
      geju.push(p + '宫假诈格(门吉星凶神吉)');
    } else if (xiongmen.includes(pm) && jistar.includes(ps) && jishen.includes(ph)) {
      geju.push(p + '宫重诈格(门凶星吉神吉)');
    }
  }
  // 五假格: 天假(丙加景门加九天), 地假(丁加杜门加九地), 人假(己加死门加太阴)
  // 神假(辛加伤门加腾蛇), 鬼假(癸加惊门加玄武)
  for (let p = 1; p <= 9; p++) {
    if (p === 5) continue;
    const pt = panData.tianpan[p];
    const pm = panData.men[p];
    const ph = panData.shen[p];
    if (!pt || !pm || !ph) continue;
    if (pt === '丙' && pm === '景' && ph === '九天') geju.push(p + '宫天假格');
    if (pt === '丁' && pm === '杜' && ph === '九地') geju.push(p + '宫地假格');
    if (pt === '己' && pm === '死' && ph === '太阴') geju.push(p + '宫人假格');
    if (pt === '辛' && pm === '伤' && ph === '腾蛇') geju.push(p + '宫神假格');
    if (pt === '癸' && pm === '惊' && ph === '玄武') geju.push(p + '宫鬼假格');
  }
  
  let luck = '平';
  if (jimen.includes(men) && jishen.includes(shen)) luck = '吉';
  else if (xiongmen.includes(men) && xiongshen.includes(shen)) luck = '凶';
  else if (jimen.includes(men)) luck = '小吉';
  else if (xiongmen.includes(men)) luck = '小凶';
  
  // 空亡判断 (中5宫无门, 天禽星寄坤2宫或艮8宫)
  let kongwang = false;
  if (palace === 5) {
    kongwang = true;
    // 中宫寄宫: 阳遁寄艮8宫, 阴遁寄坤2宫
    const isYangDun = panData.dun === 'yang';
    palace = isYangDun ? 8 : 2;
    luck = '平';
    // 重新取寄宫的门星神
    men = panData.men[palace] || men;
    star = panData.stars[palace] || star;
    shen = panData.shen[palace] || shen;
    qi = panData.tianpan[palace] || qi;
  }
  
  // 马星 (定马星: 月支三合局第一字对冲)
  // 简化: 用时支判断
  const hourZhiIdx = panData.hourIdx || (panData.hourGzIdx !== undefined ? panData.hourGzIdx % 12 : 0);
  const maPos = _qmGetMaXing(hourZhiIdx);
  const isMaXing = maPos === palace;
  
  // 五不遇时
  let wuBuYu = false;
  if (panData.dayGzIdx !== undefined && panData.hourGzIdx !== undefined) {
    wuBuYu = _qmCheckWuBuYuShi(panData.dayGzIdx % 10, panData.hourGzIdx % 10);
    if (wuBuYu) geju.push('五不遇时');
  }
  
  // 空亡宫位
  let kongWangGongs = [];
  if (panData.dayGzIdx !== undefined) {
    kongWangGongs = _qmGetKongWang(panData.dayGzIdx);
  }
  let isKongWangGong = kongWangGongs.indexOf(palace) >= 0;
  if (isKongWangGong) kongwang = true;
  
  // 日干落宫（命主状态）
  let dayGanPalace = 0, dayGanQi = '';
  if (panData.dayGzIdx !== undefined && panData.dipan) {
    let dayGan = _QM_STEMS[panData.dayGzIdx % 10];
    for (let dp = 1; dp <= 9; dp++) {
      if (panData.dipan[dp] === dayGan) { dayGanPalace = dp; dayGanQi = panData.tianpan ? (panData.tianpan[dp] || '') : ''; break; }
    }
  }
  
  // 时干落宫（事体状态）
  let hourGanPalace = 0, hourGanQi = '';
  if (panData.hourGzIdx !== undefined && panData.dipan) {
    let hourGan = _QM_STEMS[panData.hourGzIdx % 10];
    for (let hp = 1; hp <= 9; hp++) {
      if (panData.dipan[hp] === hourGan) { hourGanPalace = hp; hourGanQi = panData.tianpan ? (panData.tianpan[hp] || '') : ''; break; }
    }
  }
  
  // 值使（值使门）
  let zhiShi = panData.men ? (panData.men[palace] || '') : '';
  if (zhiShi && zhiShi.length === 1) {
    zhiShi = ({'休':'休门','生':'生门','伤':'伤门','杜':'杜门','景':'景门','死':'死门','惊':'惊门','开':'开门'}[zhiShi] || zhiShi);
  }
  
  // 调用 V2 获取完整分析
  let v2Result = getQimenReadingV2(palace, panData, question, null);
  
  let strategy = '用神在' + palace + '宫，天盘' + qi + '，门' + men + '，星' + star + '，神' + shen + '。';
  if (geju.length > 0) strategy += ' 格局: ' + geju.join('、') + '。';
  if (kongwang) strategy += ' 用神落空亡，谋事难成。';
  if (isMaXing) strategy += ' 马星临宫，事动速成。';
  if (wuBuYu) strategy += ' 五不遇时，大凶之象。';
  if (luck === '吉') strategy += ' 门星神俱吉，宜积极行动。';
  else if (luck === '凶') strategy += ' 门星神俱凶，宜静守待变。';
  if (dayGanPalace > 0) strategy += ' 命主(日干)落' + dayGanPalace + '宫。';
  if (hourGanPalace > 0) strategy += ' 事体(时干)落' + hourGanPalace + '宫。';
  
  return {
    question, yongShen: key, palace, men, star, shen, qi, 
    luck, geju, kongwang: kongwang,
    advice: luck==='吉' ? '奇门格局大吉，可积极推进。' + (v2Result.huajie || '') : luck==='小吉' ? '格局尚可，谨慎推进。' + (v2Result.huajie || '') : luck==='凶' ? '奇门格局不利，宜保守退守。' + (v2Result.huajie || '') : '吉凶参半，需因势利导。' + (v2Result.huajie || ''),
    strategy,
    // 增强项
    wuBuYu: wuBuYu,
    dayGanPalace: dayGanPalace,
    dayGanQi: dayGanQi,
    hourGanPalace: hourGanPalace,
    hourGanQi: hourGanQi,
    zhiShi: zhiShi,
    maXing: maPos,
    isMaXing: isMaXing,
    kongWangGongs: kongWangGongs,
    huajie: v2Result.huajie || '',
    mascot: v2Result.mascot || '',
    sihai: v2Result.sihai || '',
    dimensions: v2Result.dimensions || {},
    detail: v2Result.detail || '',
    gejuText: v2Result.geju || ''
  };
}

// ========== 4. 梅花易数 ==========

function meihuaQiGua(method, params) {
  let upperNum=0, lowerNum=0, dongNum=0;
  const now = new Date();
  if (method === 'time') {
    const p = params || {};
    upperNum = (p.year||now.getFullYear()) + (p.month||now.getMonth()+1) + (p.day||now.getDate());
    lowerNum = upperNum + (p.hour||now.getHours());
    dongNum = lowerNum;
  } else if (method === 'number') {
    const p = params || {};
    upperNum = p.n1 || 1; lowerNum = p.n2 || 1; dongNum = p.n3 || (upperNum+lowerNum);
  } else if (method === 'char') {
    const strokes = _chineseStrokes((params && params.char) || '易');
    upperNum = strokes[0] || 1; lowerNum = strokes[1] || 1; dongNum = strokes.reduce(function(a,b){return a+b;},0);
  } else if (method === 'sound') {
    const p = params || {};
    upperNum = p.count || 1; lowerNum = p.count2 || (now.getHours()+1); dongNum = p.count3 || (upperNum+lowerNum);
  } else if (method === 'direction') {
    const p = params || {};
    upperNum = p.directionNum || 1; lowerNum = now.getHours() + 1; dongNum = upperNum + lowerNum;
  }
  upperNum = Math.max(1, upperNum); lowerNum = Math.max(1, lowerNum); dongNum = Math.max(1, dongNum);
  const upperGua = _getGuaFromNum(upperNum);
  const lowerGua = _getGuaFromNum(lowerNum);
  const dongYao = _qyMod(dongNum, 6);
  const benLines = _buildLines(lowerGua, upperGua);
  const bianLines = benLines.slice();
  bianLines[dongYao] = {line: benLines[dongYao].line==='阳'?'阴':'阳', dong:false};
  const huLowerCode = (benLines[1].line==='阳'?'1':'0') + (benLines[2].line==='阳'?'1':'0') + (benLines[3].line==='阳'?'1':'0');
  const huUpperCode = (benLines[2].line==='阳'?'1':'0') + (benLines[3].line==='阳'?'1':'0') + (benLines[4].line==='阳'?'1':'0');
  const huLower = Object.keys(_GUA_XIANG).find(function(k){return _GUA_XIANG[k].code===huLowerCode;});
  const huUpper = Object.keys(_GUA_XIANG).find(function(k){return _GUA_XIANG[k].code===huUpperCode;});
  return {
    method, upperGua, lowerGua, dongYao,
    benGua: {upper:upperGua, lower:lowerGua, idx: _guaIndexFromParts(lowerGua, upperGua)},
    bianGua: _linesToGua(bianLines),
    huGua: {upper: parseInt(huUpper)||0, lower: parseInt(huLower)||0},
    lines: benLines, bianLines: bianLines
  };
}

function meihuaAnalyze(guaData, question) {
  const dong = guaData.dongYao;
  const isTiUpper = (dong >= 3);
  const ti = isTiUpper ? guaData.benGua.upper : guaData.benGua.lower;
  const yong = isTiUpper ? guaData.benGua.lower : guaData.benGua.upper;
  const tiWx = _GUA_XIANG[ti].wuxing;
  const yongWx = _GUA_XIANG[yong].wuxing;
  const relation = _wuxingRelation(tiWx, yongWx);
  let result = '';
  if (relation === '生我') result = '用生体，事吉，得外力相助。';
  else if (relation === '我生') result = '体生用，事耗，付出多。';
  else if (relation === '克我') result = '用克体，事凶，防损失。';
  else if (relation === '我克') result = '体克用，事可成，但需费力。';
  else result = '体用比和，事顺遂。';
  
  // 变卦分析
  const bianYong = isTiUpper ? guaData.bianGua.lower : guaData.bianGua.upper;
  const bianYongWx = _GUA_XIANG[bianYong].wuxing;
  const endRelation = _wuxingRelation(tiWx, bianYongWx);
  let endResult = '';
  if (endRelation === '生我') endResult = '变卦用生体，结局吉。';
  else if (endRelation === '我生') endResult = '变卦体生用，结局耗。';
  else if (endRelation === '克我') endResult = '变卦用克体，结局凶。';
  else if (endRelation === '我克') endResult = '变卦体克用，结局可成。';
  else endResult = '变卦体用比和，结局顺遂。';
  
  // 互卦分析
  let huAnalysis = '';
  if (guaData.huGua) {
    const huTi = isTiUpper ? guaData.huGua.upper : guaData.huGua.lower;
    const huYong = isTiUpper ? guaData.huGua.lower : guaData.huGua.upper;
    const huTiWx = _GUA_XIANG[huTi] ? _GUA_XIANG[huTi].wuxing : tiWx;
    const huYongWx = _GUA_XIANG[huYong] ? _GUA_XIANG[huYong].wuxing : yongWx;
    const huRel = _wuxingRelation(tiWx, huYongWx);
    const huRel2 = _wuxingRelation(huTiWx, yongWx);
    if (huRel === '生我' || huRel === '比和') huAnalysis = '互卦生体，过程顺利，有贵人相助。';
    else if (huRel === '克我') huAnalysis = '互卦克体，过程受阻，需防小人。';
    else huAnalysis = '互卦泄体，过程虽费力但无大碍。';
  }
  
  // 综合判断
  const isJi = (relation === '比和' || relation === '生我');
  const isXiong = (relation === '克我');
  const endJi = (endRelation === '比和' || endRelation === '生我');
  let verdict = '平';
  let advice = '';
  if (isJi && endJi) { verdict = '吉'; advice = '体用相生，变卦亦吉，所谋顺遂。'; }
  else if (isJi && !endJi) { verdict = '先吉后平'; advice = '初顺后滞，宜速行动。'; }
  else if (isXiong && endJi) { verdict = '先凶后吉'; advice = '初有阻碍，终可化解。'; }
  else if (isXiong && !endJi) { verdict = '凶'; advice = '体用相克，变卦不吉，宜退守。'; }
  else { verdict = '平'; advice = '吉凶参半，需随机应变。'; }
  
  if (huAnalysis) advice += ' ' + huAnalysis;
  
  return {
    tiGua: _GUA_XIANG[ti].name, yongGua: _GUA_XIANG[yong].name, 
    relation, initial: result,
    bianGua: _GUA_XIANG[guaData.bianGua.upper] ? _GUA_XIANG[guaData.bianGua.upper].name : '' + '/' + (_GUA_XIANG[guaData.bianGua.lower] ? _GUA_XIANG[guaData.bianGua.lower].name : ''),
    endRelation, endResult,
    huGua: guaData.huGua, huAnalysis,
    verdict, advice,
    overview: '本卦: ' + (_GUA_XIANG[guaData.benGua.upper] ? _GUA_XIANG[guaData.benGua.upper].name : '') + '/' + (_GUA_XIANG[guaData.benGua.lower] ? _GUA_XIANG[guaData.benGua.lower].name : '') + 
      ', 体:' + _GUA_XIANG[ti].name + '(' + tiWx + '), 用:' + _GUA_XIANG[yong].name + '(' + yongWx + '), ' + result + ' ' + endResult + (huAnalysis ? ' ' + huAnalysis : '')
  };
}

function _wuxingRelation(a, b) {
  if (a === b) return '比和';
  const sheng = {'金生水':true,'水生木':true,'木生火':true,'火生土':true,'土生金':true};
  if (sheng[a+'生'+b]) return '我生';
  if (sheng[b+'生'+a]) return '生我';
  const ke = {'金克木':true,'木克土':true,'土克水':true,'水克火':true,'火克金':true};
  if (ke[a+'克'+b]) return '我克';
  if (ke[b+'克'+a]) return '克我';
  return '比和';
}

// ========== 5. 大六壬 ==========

const _LR_TIANJIANG = ['贵人','螣蛇','朱雀','六合','勾陈','青龙','天空','白虎','太常','玄武','太阴','天后'];
// 月将按中气确定: 雨水后用亥, 春分后用戌, 谷雨后用酉, 小满后用申, 夏至后用未,
// 大暑后用午, 处暑后用巳, 秋分后用辰, 霜降后用卯, 小雪后用寅, 冬至后用丑, 大寒后用子
// 中气近似日期: 雨水0219, 春分0321, 谷雨0420, 小满0521, 夏至0622, 大暑0723, 处暑0823, 秋分0923, 霜降1024, 小雪1122, 冬至1222, 大寒0120
function _lrGetYueJiang(month, day) {
  const md = month * 100 + day;
  // 按中气日期确定月将
  if (md >= 1222 || md < 120) return '丑';   // 冬至后→大寒前
  if (md >= 120 && md < 219) return '子';     // 大寒后→雨水前
  if (md >= 219 && md < 321) return '亥';     // 雨水后→春分前
  if (md >= 321 && md < 420) return '戌';     // 春分后→谷雨前
  if (md >= 420 && md < 521) return '酉';     // 谷雨后→小满前
  if (md >= 521 && md < 622) return '申';     // 小满后→夏至前
  if (md >= 622 && md < 723) return '未';     // 夏至后→大暑前
  if (md >= 723 && md < 823) return '午';     // 大暑后→处暑前
  if (md >= 823 && md < 923) return '巳';     // 处暑后→秋分前
  if (md >= 923 && md < 1024) return '辰';    // 秋分后→霜降前
  if (md >= 1024 && md < 1122) return '卯';   // 霜降后→小雪前
  if (md >= 1122 && md < 1222) return '寅';   // 小雪后→冬至前
  return '丑';
}

function liurenPaiPan(year, month, day, hour, minute) {
  const date = new Date(year, month-1, day, hour, minute);
  const hourIdx = Math.floor((hour + 1) / 2) % 12;
  const shiZhi = _BRANCHES[hourIdx];
  const yueJiang = _lrGetYueJiang(month, day);
  const tianPan = _liurenTianPan(yueJiang, shiZhi);
  const gz = _gongliToGanZhi(year, month, day);
  const dayGan = gz.gan||gz[0], dayZhi = gz.zhi||gz[1];
  const ke = _liurenSiKe(dayGan, dayZhi, tianPan);
  const chuan = _liurenSanChuan(ke, dayGan, dayZhi, tianPan);
  const tianJiang = _liurenTianJiang(dayGan, shiZhi, tianPan);
  return { date, dayGan, dayZhi, shiZhi, yueJiang, tianPan, siKe: ke, sanChuan: chuan, tianJiang };
}

function _liurenTianPan(yueJiang, shiZhi) {
  // 天盘: 月将加在时支上, 逆布十二支
  const yjIdx = _branchIdx(yueJiang);
  const szIdx = _branchIdx(shiZhi);
  const offset = _qyMod(szIdx - yjIdx, 12);
  const res = {};
  for (let i=0;i<12;i++) {
    // 地盘i支上方的天盘支 = 地盘i+offset支
    res[_BRANCHES[i]] = _BRANCHES[_qyMod(i + offset, 12)];
  }
  return res;
}

function _liurenSiKe(gan, zhi, tianPan) {
  // 四课:
  // 第一课: 日干上神 (天盘日干所临地支上的天盘支)
  // 第二课: 日干阴 (第一课上神的上神)
  // 第三课: 日支上神 (天盘日支所临地支上的天盘支)
  // 第四课: 日支阴 (第三课上神的上神)
  // 日干寄宫: 甲寅乙辰丙巳丁未戊己申庚辛戌壬亥癸丑
  const ganGong = {'甲':'寅','乙':'辰','丙':'巳','丁':'未','戊':'巳','己':'未','庚':'申','辛':'戌','壬':'亥','癸':'丑'};
  const ganGongZhi = ganGong[gan] || '寅';
  // 第一课: 千上神 = 天盘[日干寄宫]上的支
  const ke1Shang = tianPan[ganGongZhi] || ganGongZhi;
  const ke1Xia = ganGongZhi;
  // 第二课: 第一课上神的上神
  const ke2Shang = tianPan[ke1Shang] || ke1Shang;
  const ke2Xia = ke1Shang;
  // 第三课: 支上神 = 天盘[日支]上的支
  const ke3Shang = tianPan[zhi] || zhi;
  const ke3Xia = zhi;
  // 第四课: 第三课上神的上神
  const ke4Shang = tianPan[ke3Shang] || ke3Shang;
  const ke4Xia = ke3Shang;
  return [
    {shang: ke1Shang, xia: ke1Xia, label: '日干阳神'},
    {shang: ke2Shang, xia: ke2Xia, label: '日干阴神'},
    {shang: ke3Shang, xia: ke3Xia, label: '日支阳神'},
    {shang: ke4Shang, xia: ke4Xia, label: '日支阴神'}
  ];
}

function _liurenSanChuan(siKe, dayGan, dayZhi, tianPan) {
  // 九宗门完整实现:
  // 1. 贼克法(重审/审理)
  // 2. 比用法
  // 3. 涉害法
  // 4. 遁克法(远克/近克)
  // 5. 昴星法
  // 6. 别责法
  // 7. 八专法
  // 8. 伏吟法
  // 9. 返吟法
  const ganWx = {'甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水'};
  const zhiWx = {'子':'水','丑':'土','寅':'木','卯':'木','辰':'土','巳':'火','午':'火','未':'土','申':'金','酉':'金','戌':'土','亥':'水'};
  const wxKe = {'金':'木','木':'土','土':'水','水':'火','火':'金'};
  
  // 检查伏吟/返吟
  const dayGanIdx = _STEMS.indexOf(dayGan);
  const dayZhiIdx = _BRANCHES.indexOf(dayZhi);
  const gzIdx = (() => { for(let i=0;i<60;i++){ if(i%10===dayGanIdx && i%12===dayZhiIdx) return i; } return 0; })();
  // 伏吟: 日干支同位 (甲子日甲子时之类)
  const isFuYin = (dayGanIdx === dayZhiIdx % 10); // 简化
  // 返吟: 日干支冲
  const isFanYin = (dayZhiIdx === (dayGanIdx + 6) % 12);
  
  if (isFuYin) {
    // 伏吟法: 初传=日干寄宫, 中传=初传上神, 末传=中传上神
    const ganGong = {'甲':'寅','乙':'辰','丙':'巳','丁':'未','戊':'巳','己':'未','庚':'申','辛':'戌','壬':'亥','癸':'丑'};
    const chu = ganGong[dayGan] || '寅';
    const zhong = tianPan[chu] || chu;
    const mo = tianPan[zhong] || zhong;
    return {chu, zhong, mo, method: '伏吟法'};
  }
  if (isFanYin) {
    // 返吟法: 初传=日支上神, 中传=初传上神, 末传=中传上神
    const chu = tianPan[dayZhi] || dayZhi;
    const zhong = tianPan[chu] || chu;
    const mo = tianPan[zhong] || zhong;
    return {chu, zhong, mo, method: '返吟法'};
  }
  
  // 找下克上(贼)和上克下(克)
  const zeiList = [];
  const keList = [];
  for (let i = 0; i < 4; i++) {
    const shangWx = zhiWx[siKe[i].shang];
    const xiaWx = zhiWx[siKe[i].xia];
    if (xiaWx !== shangWx) {
      if (wxKe[xiaWx] === shangWx) zeiList.push(i);
      if (wxKe[shangWx] === xiaWx) keList.push(i);
    }
  }
  
  let method = '贼克法';
  let chuChuanIdx;
  
  if (zeiList.length === 1) {
    chuChuanIdx = zeiList[0];
    method = zeiList.length === 1 ? '重审' : '';
  } else if (zeiList.length > 1) {
    // 比用法: 取与日干五行相同者
    const ganW = ganWx[dayGan];
    const matching = zeiList.filter(i => zhiWx[siKe[i].shang] === ganW);
    if (matching.length === 1) {
      chuChuanIdx = matching[0];
      method = '比用法';
    } else if (matching.length > 1) {
      // 涉害法: 取涉害最深者 (克我最多的)
      let maxHarm = -1, maxIdx = matching[0];
      for (const idx of matching) {
        const zhi = siKe[idx].shang;
        let harm = 0;
        // 从日干寄宫数到上神, 经过几步克
        const ganGong = {'甲':'寅','乙':'辰','丙':'巳','丁':'未','戊':'巳','己':'未','庚':'申','辛':'戌','壬':'亥','癸':'丑'};
        const gg = ganGong[dayGan] || '寅';
        const ggIdx = _branchIdx(gg);
        const sIdx = _branchIdx(zhi);
        // 数克: 从寄宫到上神路径上的克数
        for (let j = 0; j < 12; j++) {
          const p = _qyMod(ggIdx + j, 12);
          if (_BRANCHES[p] === zhi) break;
          if (wxKe[zhiWx[_BRANCHES[p]]] === zhiWx[zhi]) harm++;
        }
        if (harm > maxHarm) { maxHarm = harm; maxIdx = idx; }
      }
      chuChuanIdx = maxIdx;
      method = '涉害法';
    } else {
      // 无比者, 取贼克中第一个
      chuChuanIdx = zeiList[0];
      method = '比用法(取首)';
    }
  } else if (keList.length === 1) {
    chuChuanIdx = keList[0];
    method = '审理';
  } else if (keList.length > 1) {
    // 遁克法(涉害法): 在上克下的课中比较涉害深浅
    const ganW = ganWx[dayGan];
    const matching = keList.filter(i => zhiWx[siKe[i].shang] === ganW);
    if (matching.length === 1) {
      chuChuanIdx = matching[0];
      method = '比用法(克)';
    } else if (matching.length > 1) {
      // 涉害法: 取涉害最深者
      let maxHarm = -1, maxIdx = matching[0];
      for (const idx of matching) {
        const zhi = siKe[idx].shang;
        let harm = 0;
        const ganGong = {'甲':'寅','乙':'辰','丙':'巳','丁':'未','戊':'巳','己':'未','庚':'申','辛':'戌','壬':'亥','癸':'丑'};
        const gg = ganGong[dayGan] || '寅';
        const ggIdx = _branchIdx(gg);
        const sIdx = _branchIdx(zhi);
        for (let j = 0; j < 12; j++) {
          const p = _qyMod(ggIdx + j, 12);
          if (_BRANCHES[p] === zhi) break;
          if (wxKe[zhiWx[_BRANCHES[p]]] === zhiWx[zhi]) harm++;
        }
        if (harm > maxHarm) { maxHarm = harm; maxIdx = idx; }
      }
      chuChuanIdx = maxIdx;
      method = '涉害法(克)';
    } else {
      // 遁克法: 无比者, 在克中取涉害最深者
      let maxHarm = -1, maxIdx = keList[0];
      for (const idx of keList) {
        const zhi = siKe[idx].shang;
        let harm = 0;
        const ganGong = {'甲':'寅','乙':'辰','丙':'巳','丁':'未','戊':'巳','己':'未','庚':'申','辛':'戌','壬':'亥','癸':'丑'};
        const gg = ganGong[dayGan] || '寅';
        const ggIdx = _branchIdx(gg);
        for (let j = 0; j < 12; j++) {
          const p = _qyMod(ggIdx + j, 12);
          if (_BRANCHES[p] === zhi) break;
          if (wxKe[zhiWx[_BRANCHES[p]]] === zhiWx[zhi]) harm++;
        }
        if (harm > maxHarm) { maxHarm = harm; maxIdx = idx; }
      }
      chuChuanIdx = maxIdx;
      method = '遁克法';
    }
  } else {
    // 无贼无克: 昴星法/别责法/八专法
    // 八专日: 甲寅、己未、庚申、乙卯、戊辰、辛酉、壬戌、癸亥
    const baZhuanPairs = [
      ['甲','寅'],['己','未'],['庚','申'],['乙','卯'],['戊','辰'],['辛','酉'],['壬','戌'],['癸','亥']
    ];
    const isBaZhuan = baZhuanPairs.some(p => dayGan === p[0] && dayZhi === p[1]);
    
    if (isBaZhuan) {
      // 八专法: 干支同气, 取第一课上神为初传, 末传取对冲
      chuChuanIdx = 0;
      method = '八专法';
    } else {
      // 非八专日, 无贼无克: 检查遥克
      // 遥克 = 四课中某课上神克日干或日支
      const ganGong = {'甲':'寅','乙':'辰','丙':'巳','丁':'未','戊':'巳','己':'未','庚':'申','辛':'戌','壬':'亥','癸':'丑'};
      const ggZhi = ganGong[dayGan] || '寅';
      const ganW = ganWx[dayGan];
      const zhiW = zhiWx[dayZhi];
      let hasYaoKe = false;
      for (let i = 0; i < 4; i++) {
        const shangW = zhiWx[siKe[i].shang];
        // 上神克日干或日支
        if (wxKe[shangW] === ganW || wxKe[shangW] === zhiW) { hasYaoKe = true; break; }
        // 日干或日支克上神
        if (wxKe[ganW] === shangW || wxKe[zhiW] === shangW) { hasYaoKe = true; break; }
      }
      
      if (hasYaoKe) {
        // 昴星法: 阳日取酉上神为初传, 阴日取卯上神为初传
        // 中传=日支上神, 末传=日干上神
        const isYangDay = ['甲','丙','戊','庚','壬'].includes(dayGan);
        const maoXingZhi = isYangDay ? '酉' : '卯';
        const chu = tianPan[maoXingZhi] || maoXingZhi;
        const zhong = tianPan[dayZhi] || dayZhi;
        const mo = siKe[0].shang; // 日干上神 = 第一课上神
        return {chu, zhong, mo, method: '昴星法'};
      } else {
        // 别责法: 无贼无克无遥克, 取日干合神地盘本位上神为初传
        // 甲己合, 乙庚合, 丙辛合, 丁壬合, 戊癸合
        const heGan = {'甲':'己','己':'甲','乙':'庚','庚':'乙','丙':'辛','辛':'丙','丁':'壬','壬':'丁','戊':'癸','癸':'戊'};
        const heG = heGan[dayGan];
        // 合神地盘本位(寄宫)
        const heGong = ganGong[heG];
        // 合神寄宫上神为初传
        const chu = tianPan[heGong] || heGong;
        // 中传=初传, 末传=日支上神
        const zhong = chu;
        const mo = tianPan[dayZhi] || dayZhi;
        return {chu, zhong, mo, method: '别责法'};
      }
    }
  }
  
  // 初传 = 贼克课上神
  const chuChuan = siKe[chuChuanIdx].shang;
  const zhongChuan = tianPan[chuChuan] || chuChuan;
  const moChuan = tianPan[zhongChuan] || zhongChuan;
  
  return {chu: chuChuan, zhong: zhongChuan, mo: moChuan, method};
}

function _liurenTianJiang(dayGan, shiZhi, tianPan) {
  // 十二天将: 贵人腾蛇朱雀六合勾陈青龙天后太阴玄武太常白虎天空
  // 贵人定位: 日干决定贵人昼夜
  // 甲戊庚牛羊, 乙己鼠猴乡, 丙丁猪鸡位, 壬癸蛇兔藏, 六辛逢马虎
  const guiRenPos = {
    '甲':{day:'丑',night:'未'}, '戊':{day:'丑',night:'未'}, '庚':{day:'丑',night:'未'},
    '乙':{day:'子',night:'申'}, '己':{day:'子',night:'申'},
    '丙':{day:'亥',night:'酉'}, '丁':{day:'亥',night:'酉'},
    '壬':{day:'巳',night:'卯'}, '癸':{day:'巳',night:'卯'},
    '辛':{day:'午',night:'寅'}
  };
  // 昼夜: 辰~酉时为昼, 戌~卯时为夜
  const szIdx = _branchIdx(shiZhi);
  const isDay = szIdx >= 4 && szIdx <= 9; // 辰(4)到酉(9)
  const guiRen = guiRenPos[dayGan] || guiRenPos['甲'];
  const guiZhi = isDay ? guiRen.day : guiRen.night;
  const guiIdx = _branchIdx(guiZhi);
  // 天将顺序: 贵人腾蛇朱雀六合勾陈青龙天后太阴玄武太常白虎天空
  // 昼贵顺布, 夜贵逆布
  const tianJiangNames = ['贵人','腾蛇','朱雀','六合','勾陈','青龙','天后','太阴','玄武','太常','白虎','天空'];
  const res = {};
  for (let i = 0; i < 12; i++) {
    const idx = isDay ? _qyMod(guiIdx + i, 12) : _qyMod(guiIdx - i, 12);
    res[_BRANCHES[idx]] = tianJiangNames[i];
  }
  return res;
}

function liurenAnalyze(panData, question) {
  const chuan = panData.sanChuan;
  const jiang = panData.tianJiang;
  const method = chuan.method || '贼克法';
  // 三传天将
  const chuanShen = [jiang[chuan.chu]||'贵人', jiang[chuan.zhong]||'贵人', jiang[chuan.mo]||'贵人'];
  const chuanZhi = [chuan.chu, chuan.zhong, chuan.mo];
  let luck = '平';
  const good = ['贵人','青龙','六合','太阴','天后','太常'];
  const bad = ['腾蛇','朱雀','勾陈','白虎','玄武','天空'];
  let goodCount=0, badCount=0;
  chuanShen.forEach(function(s){ if(good.includes(s)) goodCount++; if(bad.includes(s)) badCount++; });
  if (goodCount >= 2) luck = '吉';
  if (badCount >= 2) luck = '凶';
  // 课体格局判断
  const keti = [];
  if (method === '重审') keti.push('重审课');
  if (method === '审理') keti.push('审理课');
  if (method === '比用法') keti.push('比用课');
  if (method === '涉害法') keti.push('涉害课');
  if (method === '遁克法') keti.push('遁克课');
  if (method === '昴星法') keti.push('昴星课');
  if (method === '别责法') keti.push('别责课');
  if (method === '八专法') keti.push('八专课');
  if (method === '伏吟法') keti.push('伏吟课');
  if (method === '返吟法') keti.push('返吟课');
  // 三传自合
  const sanhe = (a, b, c) => {
    const sets = [['子','辰','申'],['丑','巳','酉'],['寅','午','戌'],['卯','未','亥']];
    return sets.some(s => s.includes(a) && s.includes(b) && s.includes(c));
  };
  if (sanhe(chuan.chu, chuan.zhong, chuan.mo)) keti.push('三传三合');
  // 四课文本
  const siKeText = panData.siKe.map(function(k,i){
    return '第'+(i+1)+'课: '+k.xia+'上'+k.shang+' ('+k.label+')';
  }).join('  ');
  const ketiStr = keti.length ? '课体: ' + keti.join('、') : '';
  return { question, method, keti: keti.join('、'), siKeText, sanChuan: chuanZhi, chuanShen, luck,
    advice: luck==='吉' ? '三传吉将居多，所谋顺遂。' + ketiStr :
            luck==='凶' ? '三传凶将较多，宜谨慎退守。' + ketiStr :
            '吉凶参半，需随机应变。' + ketiStr
  };
}

// ========== 6. 姓名学 ==========

const _STROKE_TABLE = {
  // 常见姓氏
  '李':7,'王':4,'张':11,'刘':15,'陈':16,'杨':13,'赵':14,'黄':12,'周':8,'吴':7,'徐':10,'孙':10,'胡':11,'朱':6,'高':10,'林':8,'何':7,'郭':15,'马':10,'罗':20,'梁':11,'宋':7,'郑':19,'谢':17,'韩':17,'唐':10,'冯':12,'于':3,'董':15,'萧':19,'程':12,'曹':11,'袁':10,'邓':19,'许':11,'傅':12,'沈':8,'曾':12,'彭':12,'汪':8,'田':5,'吕':7,'姜':9,'金':8,'韦':9,'贾':13,'夏':10,'侯':9,'邹':13,'方':4,'孔':4,'孟':8,'廖':14,'石':5,'熊':14,'孙':10,'白':5,'龙':16,'段':9,'雷':13,'尹':4,'黎':15,'史':5,'毛':4,'郝':14,'万':15,'顾':21,'盛':12,'戴':18,'钟':17,'洪':10,'姜':9,'田':5,'范':11,'江':7,'谭':19,'廖':14,'胡':11,'徐':10,'金':8,
  // 常见名字用字
  '明':8,'华':14,'伟':11,'强':12,'军':9,'平':5,'国':11,'建':9,'文':4,'志':7,'伟':11,'刚':10,'海':11,'飞':9,'龙':16,'鑫':24,'森':12,'宇':6,'泽':17,'豪':14,'杰':12,'俊':9,'豪':14,'博':12,'亮':9,'超':12,'勇':9,'武':8,'斌':12,'磊':15,'军':9,'辉':15,'鹏':19,'坤':8,'乾':11,'元':4,'正':5,'永':5,'生':5,'成':7,'兴':16,'立':5,'光':6,'安':6,'天':4,'子':3,'俊':9,'彦':9,'梓':11,'晨':11,'睿':14,'皓':12,'轩':10,'涵':12,'悦':11,'欣':8,'怡':9,'佳':8,'美':9,'丽':19,'芳':10,'敏':11,'静':16,'雪':11,'琳':12,'婷':12,'瑶':15,'颖':16,'晓':16,'丹':4,'彤':7,'雯':12,'菲':14,'薇':19,'梦':14,'琪':13,'婷':12,'媛':12,'蓉':16,'洁':16,'淑':12,'婉':11,'诗':13,'语':14,'晓':16,'慧':15,'聪':17,'灵':24,'兰':23,'菊':14,'梅':11,'竹':6,'兰':23,'桂':10,'兰':23,'松':8,'柏':9,'桐':10,'柳':9,'杨':13,'林':8,'森':12,'树':16,'材':7,
  // 基础汉字
  '一':1,'二':2,'三':3,'四':5,'五':4,'六':4,'七':2,'八':2,'九':2,'十':10,'百':6,'千':3,'万':15,'亿':15,
  '人':2,'入':2,'大':3,'小':3,'上':3,'下':3,'中':4,'天':4,'地':6,'日':4,'月':4,'水':4,'火':4,'木':4,'土':3,'金':8,'王':4,'石':5,'山':3,'田':5,'口':3,'手':4,'心':4,'目':5,'耳':6,'足':7,'言':7,'示':5,'衣':6,'食':9,'住':7,'行':6,
  '長':8,'馬':10,'黃':12,'黑':12,'龍':16,'龜':16,'魚':11,'鳥':11,'虫':6,'骨':10,'風':9,'雨':8,'雲':12,'雷':13,'電':13,'霜':17,'露':21,'雪':11,'冰':6,'水':4,'泉':9,'江':7,'河':8,'湖':13,'海':11,'洋':10,'流':10,'深':12,'清':12,'源':14,'波':8,'浪':10,'涛':18,'润':16,'漪':14,'溪':14,'潭':16,'池':7,'沼':9,'渠':12,'河':8,'洛':10,'汾':8,'湘':13,'浦':8,'沧':14,'漠':15,'潮':16,'澎':16,'湃':13,'潇':20,'湘':13,'源':14,'渊':12,'淇':12,'淳':12,'沁':8,
  '德':15,'道':16,'仁':4,'义':13,'礼':18,'智':12,'信':9,'忠':8,'孝':7,'悌':11,'温':14,'良':7,'恭':10,'俭':15,'让':24,'勤':13,'俭':15,'和':8,'睦':14,'顺':12,'正':5,'清':12,'廉':13,'明':8,'公':4,'平':5,'正':5,'直':8,'诚':14,'信':9,'善':12,'美':9,'好':6,'吉':6,'祥':11,'瑞':14,'福':14,'禄':13,'寿':16,'喜':12,'庆':15,'贺':12,'荣':14,'华':14,'富':12,'贵':12,'丰':18,'盛':12,'昌':8,'隆':17,'兴':16,'旺':8,'达':16,'通':14,'泰':10,'安':6,'宁':14,'定':8,'静':16,'和':8,'平':5,'顺':12,'利':7,'吉':6,'庆':15,
  '春':9,'夏':10,'秋':9,'冬':5,'东':8,'南':9,'西':6,'北':5,'上':3,'下':3,'左':5,'右':5,'前':9,'后':9,'内':4,'外':5,'高':10,'低':7,'长':8,'短':7,'大':3,'小':3,'多':6,'少':4,'方':4,'圆':13,'扁':9,'曲':6,'直':8,'正':5,'反':4,'横':16,'竖':13,'点':17,'撇':15,'捺':12,'勾':7,'折':8,
  '建':9,'筑':16,'工':3,'商':11,'农':13,'学':16,'医':18,'法':9,'军':9,'政':8,'科':9,'技':8,'艺':21,'文':4,'理':12,'工':3,'商':11,'法':9,'医':18,'教':11,'体':8,'美':9,'音':9,'体':8,'术':5,'史':5,'哲':10,'宗':8,'教':11,'神':10,'仙':5,'圣':13,'贤':16,'君':10,'臣':7,'民':5,'士':3,'农':13,'工':3,'商':11,'兵':7,'将':11,'帅':9,'侯':9,'伯':7,'公':4,'卿':11,'相':9,'宰':10,'辅':14,'佐':7,'佑':7,'扶':8,'助':7,'帮':17,'协':8,'从':4,'众':12,'群':13,'队':17,'排':12,'列':6,'行':6,'走':7,'跑':12,'跳':13,'跃':21,'飞':9,'翔':12,'腾':20,'奔':8,'驰':13,'驱':11,'驾':15,'乘':10,'骑':18,'舟':6,'船':11,'航':10,'渡':12,'涉':10,'游':13,'泳':9,'浮':10,'沉':8,'潜':16,'深':12,'浅':11,'高':10,'低':7,'上':3,'下':3,'升':4,'降':10,'涨':14,'落':12,'出':5,'入':2,'开':12,'关':6,'合':6,'分':4,'聚':14,'散':12,'收':6,'发':12,'生':5,'死':6,'灭':5,'亡':3,'存':6,'在':6,'有':6,'无':4,'空':8,'满':15,'多':6,'少':4,'大':3,'小':3,'长':8,'短':7,'高':10,'低':7,'上':3,'下':3,'好':6,'坏':7,'美':9,'丑':4,'善':12,'恶':12,'真':10,'假':11,'对':14,'错':13,'是':9,'非':8,'正':5,'邪':8,'善':12,'恶':12,'吉':6,'凶':2,'福':14,'祸':14,'利':7,'害':10,'得':11,'失':5,'成':7,'败':12,'兴':16,'衰':10,'盛':12,'弱':10,'强':12,'优':6,'劣':6,'胜':12,'负':6,'赢':20,'输':13
};

function _charStrokes(c) {
  return _STROKE_TABLE[c] || (c.charCodeAt(0) % 16 + 1);
}

function xingmingAnalyze(name, sex) {
  if (!name) return {error:'请输入姓名'};
  const chars = name.split('');
  const xing = chars[0];
  const ming = chars.slice(1).join('');
  const xingStrokes = _charStrokes(xing);
  const mingStrokes = chars.slice(1).reduce(function(s,c){return s+_charStrokes(c);}, 0);
  const tianGe = xingStrokes + 1;
  const renGe = xingStrokes + (ming ? _charStrokes(chars[1]||ming[0]||'一') : 1);
  const diGe = mingStrokes || 1;
  const waiGe = Math.max(1, tianGe + diGe - renGe);
  const zongGe = xingStrokes + mingStrokes;
  const wuxing = _numWuxing(renGe);
  const sancai = [_numWuxing(tianGe), _numWuxing(renGe), _numWuxing(diGe)];
  const sancaiRelation = _sancaiRelation(sancai[0], sancai[1], sancai[2]);
  const score = Math.min(100, Math.max(50, 70 + _numJiXiong(tianGe) + _numJiXiong(renGe) + _numJiXiong(diGe) + _numJiXiong(zongGe) + (sancaiRelation.includes('吉')?10:0)));
  return {
    name, sex, xing, ming, tianGe, renGe, diGe, waiGe, zongGe, wuxing, sancai, sancaiRelation, score,
    meaning: '姓名五格：天格'+tianGe+'、人格'+renGe+'、地格'+diGe+'、外格'+waiGe+'、总格'+zongGe+'。',
    advice: '人格五行'+wuxing+'，三才配置'+sancai.join('-')+'，'+sancaiRelation+'。建议结合八字用神进一步调整。'
  };
}

function _numWuxing(n) {
  const tail = n % 10;
  if ([1,2].includes(tail)) return '木';
  if ([3,4].includes(tail)) return '火';
  if ([5,6].includes(tail)) return '土';
  if ([7,8].includes(tail)) return '金';
  return '水';
}

function _sancaiRelation(t,r,d) {
  const map = {'木生火':true,'火生土':true,'土生金':true,'金生水':true,'水生木':true};
  const g1 = map[t+r]; const g2 = map[r+d];
  if (g1 && g2) return '三才顺生，大吉';
  if (g1 || g2) return '三才半吉';
  if (t===r && r===d) return '三才比和，平稳';
  return '三才相克，需调和';
}

function _numJiXiong(n) {
  const ji = [1,3,5,6,7,8,11,13,15,16,21,23,24,25,31,32,35,37,39,41,45,47,48,52,57,61,63,65,67,68,81];
  return ji.includes(n) ? 5 : -3;
}

// ========== 7. 风水 ==========

const _FS_YAO_MING = {1:'东四命',2:'西四命',3:'东四命',4:'东四命',6:'西四命',7:'西四命',8:'西四命',9:'东四命'};

function fengshuiAnalyze(houseType, direction, buildYear, roomLayout, birthYear) {
  const dirMap = {'北':1,'南':9,'东':3,'西':7,'东北':8,'西北':6,'东南':4,'西南':2};
  const dirNum = dirMap[direction] || 1;
  // 宅命
  const zhaiYao = _FS_YAO_MING[dirNum] || '东四命';
  const zhaiMing = (zhaiYao === '东四命') ? '东四宅' : '西四宅';
  
  // 命卦: 精确计算
  let mingGua = '东四命';
  let mingGuaNum = 0;
  if (birthYear) {
    const yy = birthYear - 1900;
    const sum = _qyMod(yy, 9);
    const maleNum = _qyMod(11 - sum, 9) || 9;
    const femaleNum = _qyMod(4 + sum, 9) || 9;
    mingGuaNum = maleNum; // 默认男命, 实际应传sex参数
    const dongSi = [1,3,4,9];
    mingGua = dongSi.includes(mingGuaNum) ? '东四命' : '西四命';
  }
  const matching = (mingGua === '东四命' && zhaiMing === '东四宅') || (mingGua === '西四命' && zhaiMing === '西四宅');
  
  const period = Math.floor(((buildYear || 2024) - 1864) / 20) + 1;
  const currentPeriod = Math.floor((2024 - 1864) / 20) + 1;
  const wangShan = (period === currentPeriod);
  const xuankong = _xuankongBrief(buildYear, direction);
  
  // 24山: 每卦管三山
  const sanShan = {
    1:['壬','子','癸'], 9:['丙','午','丁'], 3:['甲','卯','乙'], 7:['庚','酉','辛'],
    8:['丑','艮','寅'], 6:['戌','乾','亥'], 4:['辰','巽','巳'], 2:['未','坤','申']
  };
  const mountains = sanShan[dirNum] || ['壬','子','癸'];
  
  // 形势派分析
  const xingshi = [];
  if (houseType) {
    xingshi.push('房型: ' + houseType);
    if (houseType.includes('缺') || houseType.includes('缺角')) xingshi.push('缺角房屋需补角化解');
    if (houseType.includes('方正') || houseType.includes('正方')) xingshi.push('房型方正，气场稳定');
    if (houseType.includes('长方')) xingshi.push('长方形房屋，注意比例不超过2:1');
  }
  if (roomLayout) {
    xingshi.push('布局: ' + roomLayout);
    if (roomLayout.includes('门对门') || roomLayout.includes('对冲')) xingshi.push('门冲问题，需设置玄关或屏风化解');
    if (roomLayout.includes('穿堂')) xingshi.push('穿堂煞，财气直泄，需设隔断');
    if (roomLayout.includes('横梁')) xingshi.push('横梁压顶，需吊顶或移位');
    if (roomLayout.includes('开放式')) xingshi.push('开放式布局，注意厨房油烟');
  }
  
  // 四灵方位
  const siLing = {
    front: '前朱雀(南)', back: '后玄武(北)', left: '左青龙(东)', right: '右白虎(西)'
  };
  
  // 八宅吉凶位
  const bazhai = _computeBazhai(dirNum);
  
  const score = matching ? 85 : 60;
  return {
    houseType, direction, buildYear, roomLayout, 
    yaoMing: mingGua, mingGuaNum, zhaiMing, matching,
    period, wangShan, xuankong,
    mountains: mountains.join('、'),
    siLing: siLing,
    bazhai: bazhai,
    xingshi: xingshi.join('；'),
    score,
    advice: matching ? '宅命相配，主家宅安宁、事业顺遂。' : '宅命不配，主易有阻滞，可通过布局化解。',
    layoutTips: _fengshuiTips(dirNum, matching, bazhai)
  };
}

function _computeBazhai(zhaiNum) {
  // 八宅: 生气(大吉)、天医(中吉)、延年(上吉)、伏位(小吉)、绝命(大凶)、五鬼(大凶)、六煞(中凶)、祸害(小凶)
  // 以宅卦为起点, 按固定规律排布
  const positions = ['生气','天医','延年','伏位','绝命','五鬼','六煞','祸害'];
  // 各宅卦的吉凶方位表 (按洛书九宫序)
  const tables = {
    1: {n:'坎', s:'离', e:'震', w:'兑', ne:'艮', nw:'乾', se:'巽', sw:'坤'},
    9: {n:'离', s:'坎', e:'震', w:'兑', ne:'艮', nw:'乾', se:'巽', sw:'坤'},
    3: {n:'震', s:'离', e:'坎', w:'兑', ne:'艮', nw:'乾', se:'巽', sw:'坤'},
    4: {n:'巽', s:'离', e:'震', w:'兑', ne:'艮', nw:'乾', se:'坎', sw:'坤'},
    6: {n:'乾', s:'离', e:'震', w:'坎', ne:'艮', nw:'坤', se:'巽', sw:'兑'},
    7: {n:'兑', s:'离', e:'震', w:'坎', ne:'艮', nw:'乾', se:'巽', sw:'坤'},
    8: {n:'艮', s:'离', e:'震', w:'兑', ne:'坎', nw:'乾', se:'巽', sw:'坤'},
    2: {n:'坤', s:'离', e:'震', w:'兑', ne:'艮', nw:'乾', se:'巽', sw:'坎'}
  };
  // 吉凶位计算 (大游年歌诀)
  // 乾六天五祸绝延生, 坎五天生延绝祸六, 艮六绝祸生延天五, 震延生祸绝五天六
  // 巽天五六祸生绝延, 离六五祸绝延生三, 坤天延绝生祸五六, 兑生祸延绝六五天
  const dayoujian = {
    1: {1:'伏位',9:'延年',3:'天医',7:'祸害',8:'五鬼',6:'六煞',4:'生气',2:'绝命'},
    9: {1:'延年',9:'伏位',3:'生气',7:'绝命',8:'祸害',6:'绝命',4:'天医',2:'六煞'},
    3: {1:'天医',9:'生气',3:'伏位',7:'绝命',8:'延年',6:'五鬼',4:'延年',2:'祸害'},
    4: {1:'生气',9:'天医',3:'延年',7:'六煞',8:'绝命',6:'祸害',4:'伏位',2:'五鬼'},
    6: {1:'六煞',9:'绝命',3:'五鬼',7:'生气',8:'天医',6:'伏位',4:'祸害',2:'延年'},
    7: {1:'生气',9:'绝命',3:'延年',7:'伏位',8:'延年',6:'生气',4:'六煞',2:'祸害'},
    8: {1:'五鬼',9:'祸害',3:'延年',7:'绝命',8:'伏位',6:'天医',4:'绝命',2:'生气'},
    2: {1:'绝命',9:'六煞',3:'祸害',7:'天医',8:'生气',6:'延年',4:'五鬼',2:'伏位'}
  };
  const result = {};
  const tbl = dayoujian[zhaiNum] || dayoujian[1];
  const dirNames = {1:'北',9:'南',3:'东',7:'西',8:'东北',6:'西北',4:'东南',2:'西南'};
  for (const num in tbl) {
    result[dirNames[num] || num] = tbl[num];
  }
  return result;
}

function _fengshuiTips(dirNum, matching, bazhai) {
  const tips = [];
  // 找吉位和凶位
  const jimen = ['生气','天医','延年','伏位'];
  const xiongmen = ['绝命','五鬼','六煞','祸害'];
  for (const dir in bazhai) {
    if (jimen.includes(bazhai[dir])) tips.push(dir + '方' + bazhai[dir] + '(吉): 宜设大门/卧室/财位');
    if (xiongmen.includes(bazhai[dir])) tips.push(dir + '方' + bazhai[dir] + '(凶): 宜设厨房/卫生间镇之');
  }
  tips.push('大门宜开在吉方，忌对电梯、楼梯、尖角。');
  tips.push('卧室床头宜靠实墙，忌横梁压顶。');
  tips.push('厨房宜坐凶向吉，灶口忌对门窗。');
  tips.push('客厅宜明亮方正，财位在进门对角线。');
  if (!matching) tips.push('宅命不配，可在吉位摆放命卦相生物品化解。');
  return tips;
}

function _xuankongBrief(year, dir) {
  const period = Math.floor(((year || 2024) - 1864) / 20) + 1;
  const dirMap = {'北':1,'南':9,'东':3,'西':7,'东北':8,'西北':6,'东南':4,'西南':2};
  const dirNum = dirMap[dir] || 1;
  
  // 运星盘: 当运星入中宫, 按洛书轨迹飞布
  // 洛书九宫顺序: 中5→西北6→西7→东北8→南9→北1→西南2→东3→东南4
  // 飞星轨迹: 5→6→7→8→9→1→2→3→4 (入中宫后顺飞)
  const feiXu = [5,6,7,8,9,1,2,3,4]; // 飞星顺序
  const gongPos = [5,6,7,8,9,1,2,3,4]; // 对应宫位
  
  // 运星盘 (入中宫的星 = period)
  const yunPan = {};
  for (let i = 0; i < 9; i++) {
    const star = ((period - 1 + i) % 9) + 1;
    yunPan[gongPos[i]] = star;
  }
  
  // 山星: 坐方运星入中, 阳顺阴逆飞
  // 向星: 向方运星入中, 阳顺阴逆飞
  const zuoNum = yunPan[dirNum] || period; // 坐方运星
  const xiangNum = yunPan[(dirNum + 4) % 9 || 9] || period;
  
  // 阳顺阴逆: 奇数为阳(顺飞), 偍数为阴(逆飞)
  // 顺飞: 5→6→7→8→9→1→2→3→4
  // 逆飞: 5→4→3→2→1→9→8→7→6
  const shunFei = [5,6,7,8,9,1,2,3,4];
  const niFei = [5,4,3,2,1,9,8,7,6];
  
  // 山星飞布 (阳顺阴逆)
  const shanPan = {};
  const shanFeiXu = (zuoNum % 2 === 1) ? shunFei : niFei;
  for (let i = 0; i < 9; i++) {
    const star = ((zuoNum - 1 + i) % 9) + 1;
    shanPan[shanFeiXu[i]] = star;
  }
  
  // 向星飞布 (阳顺阴逆)
  const xiangPan = {};
  const xiangFeiXu = (xiangNum % 2 === 1) ? shunFei : niFei;
  for (let i = 0; i < 9; i++) {
    const star = ((xiangNum - 1 + i) % 9) + 1;
    xiangPan[xiangFeiXu[i]] = star;
  }
  
  // 九星含义
  const starName = {1:'一白贪狼',2:'二黑巨门',3:'三碧禄存',4:'四绿文曲',5:'五黄廉贞',6:'六白武曲',7:'七赤破军',8:'八白左辅',9:'九紫右弼'};
  const starNature = {1:'水·吉',2:'土·凶',3:'木·凶',4:'木·吉',5:'土·大凶',6:'金·吉',7:'金·凶',8:'土·吉',9:'火·吉'};
  
  // 当旺判断
  const wangStar = period;
  const shengStar = (period % 9) + 1; // 生气星
  const siStar = ((period + 1) % 9) + 1; // 退气星
  
  const gongNames = {1:'坎(北)',2:'坤(西南)',3:'震(东)',4:'巽(东南)',5:'中宫',6:'乾(西北)',7:'兑(西)',8:'艮(东北)',9:'离(南)'};
  
  let panText = period + '运玄空飞星盘\\n';
  panText += '坐方: ' + dir + '(' + starName[zuoNum] + ') 向方: ' + (dirMap[dir] ? _getOppositeDir(dir) : '?') + '(' + starName[xiangNum] + ')\\n';
  panText += '九宫飞星: ';
  for (let p = 1; p <= 9; p++) {
    if (p === 5) continue;
    panText += gongNames[p] + '=' + starName[yunPan[p]] + '(' + starNature[yunPan[p]] + ') ';
  }
  panText += '\\n';
  
  // 中宫运星
  panText += '中宫: ' + starName[yunPan[5]] + '(运星) 山' + starName[shanPan[5]] + ' 向' + starName[xiangPan[5]] + '\\n';
  
  // 吉凶判断
  const tips = [];
  if (yunPan[5] === wangStar) tips.push('当旺星入中宫，宅运旺盛');
  if (zuoNum === wangStar) tips.push('当旺星到坐方，丁财两旺');
  if (xiangNum === wangStar) tips.push('当旺星到向方，财源广进');
  if (yunPan[5] === 5 || zuoNum === 5) tips.push('五黄入中或到坐，官灾疾病，需化解');
  if (yunPan[5] === 2) tips.push('二黑入中，注意健康');
  if (yunPan[5] === 3) tips.push('三碧入中，防止是非口舌');
  
  // 返回文本和数据对象
  return {
    text: panText + (tips.length > 0 ? '分析: ' + tips.join('；') : '分析: 需结合具体格局判断。'),
    period: period,
    yunPan: yunPan,
    shanPan: shanPan,
    xiangPan: xiangPan,
    wangStar: wangStar,
    shengStar: shengStar,
    zuoNum: zuoNum,
    xiangNum: xiangNum,
    wangShan: zuoNum === wangStar,
    wangXiang: xiangNum === wangStar,
    tips: tips
  };
}

function _getOppositeDir(dir) {
  const opp = {'北':'南','南':'北','东':'西','西':'东','东北':'西南','西南':'东北','西北':'东南','东南':'西北'};
  return opp[dir] || '南';
}

// ========== 8. 择日 ==========

const _JC_NAMES = ['建','除','满','平','定','执','破','危','成','收','开','闭'];
const _JC_JIXIONG = ['吉','吉','平','平','吉','吉','凶','凶','吉','平','吉','凶'];
const _PENZU = {
  甲:'甲不开仓财物耗散',乙:'乙不栽植千株不长',丙:'丙不修灶必见灾殃',丁:'丁不剃头头必生疮',
  戊:'戊不受田田主不祥',己:'己不破券二比并亡',庚:'庚不经络织机虚张',辛:'辛不合酱主人不尝',
  壬:'壬不汲水更难提防',癸:'癸不词讼理弱敌强'
};
const _PENZU_ZHI = {
  子:'子不问卜自惹祸殃',丑:'丑不冠带主不还乡',寅:'寅不祭祀神鬼不尝',卯:'卯不穿井水泉不香',
  辰:'辰不哭泣必主重丧',巳:'巳不远行财物伏藏',午:'午不苫盖屋主更张',未:'未不服药毒气入肠',
  申:'申不安床鬼祟入房',酉:'酉不宴客醉坐颠狂',戌:'戌不吃犬作怪上床',亥:'亥不嫁娶不利新郎'
};
const _XIU_XING = ['角','亢','氐','房','心','尾','箕','斗','牛','女','虚','危','室','壁','奎','娄','胃','昴','毕','觜','参','井','鬼','柳','星','张','翼','轸'];
const _YI_JI = {
  '建':'宜：祭祀、祈福、出行；忌：嫁娶、安葬',
  '除':'宜：沐浴、清洁、除旧；忌：嫁娶、安床',
  '满':'宜：开市、立券、交易；忌：动土、栽种',
  '平':'宜：修饰垣墙、平治道涂；忌：嫁娶、移徙',
  '定':'宜：冠笄、嫁娶、会亲友；忌：词讼、出行',
  '执':'宜：捕捉；忌：开市、嫁娶',
  '破':'宜：破屋、坏垣；忌：诸事不宜',
  '危':'宜：安床、捕捉；忌：嫁娶、出行',
  '成':'宜：嫁娶、开市、入学；忌：诉讼',
  '收':'宜：收获、纳财；忌：安葬、出行',
  '开':'宜：开业、嫁娶、出行；忌：安葬',
  '闭':'宜：塞穴、补垣；忌：嫁娶、开市'
};
const _SHI_CHEN_JI = ['子','寅','卯','午','未','酉','戌'];

function zeriCalcFull(lunarMonth, lunarDay, dayGanZhi, event) {
  // 全量择日计算（传统智慧）
  // event: 事项类型（嫁娶/搬家/开业/动土/安葬/出行/求职/祈福等）
  const today = new Date();
  let Y = today.getFullYear(), M = today.getMonth()+1, D = today.getDate();
  
  // 使用完整黄历计算函数
  let yearGZ = getYearGanZhi(Y, M, D);
  let monthGZ = getMonthGanZhi(Y, M, D);
  let dayGZ = getDayGanZhi(Y, M, D);
  if (dayGanZhi) {
    // 如果传入dayGanZhi，用它覆盖
    if (typeof dayGanZhi === 'string') {
      let ganIdx = TIAN_GAN.indexOf(dayGanZhi[0]);
      let zhiIdx = DI_ZHI.indexOf(dayGanZhi[1]);
      dayGZ = {gan: ganIdx, zhi: zhiIdx, index: ganIdx * 12 + zhiIdx};
    } else if (typeof dayGanZhi === 'object') {
      dayGZ = dayGanZhi;
    }
  }
  
  // 建除十二神
  let jianchuName = getJianChu(monthGZ.zhi, dayGZ.zhi);
  
  // 星宿 + 吉凶
  let xingxiu = getXingXiu(Y, M, D);
  let xingxiuJixiong = XINGXIU_JIXIONG[xingxiu.name] || '平';
  
  // 值神
  let zhishen = getZhishen(dayGZ.gan, dayGZ.zhi);
  let zhishenIsHuangdao = ZHISHEN_TYPE[zhishen];
  
  // 冲煞详情
  let dayZhiName = DI_ZHI[dayGZ.zhi];
  let chongshaInfo = CHONGSHA_DETAIL[dayZhiName] || {chong:'', sha:''};
  
  // 胎神占方
  let taiShen = TAI_SHEN_60[dayGZ.index];
  
  // 彭祖百忌（完整）
  let pengzuGanStr = PENGZU_FULL[TIAN_GAN[dayGZ.gan]] || '';
  let pengzuZhiStr = PENGZU_FULL[DI_ZHI[dayGZ.zhi]] || '';
  let pengzu = [pengzuGanStr, pengzuZhiStr].filter(Boolean);
  
  // 吉神
  let jishenList = calcJishen(yearGZ, monthGZ, dayGZ);
  // 凶神
  let xiongshenList = calcXiongshen(yearGZ, monthGZ, dayGZ);
  
  // 日空亡
  let kongWang = getDayKongWang(dayGZ.index);
  
  // 宜忌（基于建除+吉凶神）
  let yiList = JIAN_CHU_YI[jianchuName] || ['祭祀'];
  let jiList = JIAN_CHU_JI[jianchuName] || ['诸事不宜'];
  if (xiongshenList.indexOf('月破') !== -1) jiList = jiList.concat(['月破日不宜举大事']);
  
  // 事项对应用神
  let eventMap = {
    '嫁娶': {good:['天德','月德','三合','六合','天喜'], bad:['月破','月厌','劫煞','灾煞'], jianchu:['成','开','定']},
    '搬家': {good:['天德','月德','天恩','母仓'], bad:['月破','月煞','四击'], jianchu:['开','成','满']},
    '开业': {good:['天恩','月恩','母仓','圣心','益后'], bad:['月破','月厌','劫煞'], jianchu:['开','满','成']},
    '动土': {good:['天恩','月恩','母仓'], bad:['月破','月刑','月煞','劫煞','灾煞'], jianchu:['建','除','满']},
    '安葬': {good:['天德','月德','天恩','母仓'], bad:['月破','月厌','四击','往亡'], jianchu:['闭','收','除']},
    '出行': {good:['天恩','驿马','三合'], bad:['月破','月刑','往亡'], jianchu:['开','建','除']},
    '求职': {good:['天恩','月恩','圣心'], bad:['月破','天吏'], jianchu:['建','成','开']},
    '祈福': {good:['天德','月德','天恩','母仓','圣心'], bad:['月破','月厌'], jianchu:['开','定','满']}
  };
  let evtConfig = eventMap[event] || {good:[], bad:[], jianchu:[]};
  
  // 综合评分
  let score = 50;
  // 建除十二神
  let jcLuckMap = {'建':0,'除':1,'满':1,'平':0,'定':1,'执':0,'破':-1,'危':0,'成':1,'收':0,'开':1,'闭':-1};
  score += (jcLuckMap[jianchuName] || 0) * 10;
  // 建除匹配事项
  if (evtConfig.jianchu && evtConfig.jianchu.indexOf(jianchuName) !== -1) score += 15;
  // 黄道/黑道
  if (zhishenIsHuangdao) score += 10; else score -= 5;
  // 星宿吉凶
  if (xingxiuJixiong === '吉') score += 8;
  else if (xingxiuJixiong === '凶') score -= 8;
  // 吉神加分
  for (let i = 0; i < jishenList.length; i++) {
    score += 5;
    if (evtConfig.good && evtConfig.good.indexOf(jishenList[i]) !== -1) score += 8;
  }
  // 凶神减分
  for (let i = 0; i < xiongshenList.length; i++) {
    score -= 6;
    if (evtConfig.bad && evtConfig.bad.indexOf(xiongshenList[i]) !== -1) score -= 10;
  }
  score = Math.max(10, Math.min(100, score));
  
  // 专业分析
  let analysisParts = [];
  analysisParts.push('日柱' + TIAN_GAN[dayGZ.gan] + DI_ZHI[dayGZ.zhi] + '，建除' + jianchuName + '日，值神' + zhishen + '（' + (zhishenIsHuangdao ? '黄道' : '黑道') + '）。');
  analysisParts.push('星宿' + xingxiu.name + xingxiu.animal + '（' + xingxiuJixiong + '）。');
  if (jishenList.length > 0) analysisParts.push('吉神宜趋：' + jishenList.join('、') + '，利行事。');
  if (xiongshenList.length > 0) analysisParts.push('凶神宜忌：' + xiongshenList.join('、') + '，需谨慎。');
  if (evtConfig.good && evtConfig.good.length > 0) {
    let matched = jishenList.filter(function(j){return evtConfig.good.indexOf(j) !== -1;});
    if (matched.length > 0) analysisParts.push('与' + (event||'所选') + '事项相合吉神：' + matched.join('、') + '，大吉。');
  }
  if (evtConfig.bad && evtConfig.bad.length > 0) {
    let matchedBad = xiongshenList.filter(function(x){return evtConfig.bad.indexOf(x) !== -1;});
    if (matchedBad.length > 0) analysisParts.push('与' + (event||'所选') + '事项相冲凶神：' + matchedBad.join('、') + '，不利。');
  }
  if (xiongshenList.indexOf('月破') !== -1) analysisParts.push('月破日，大凶，不宜举大事。');
  analysisParts.push('空亡：' + kongWang + '，凡事难圆满。');
  let analysis = analysisParts.join('');
  
  // 建议/避免
  let suggestion = yiList.join('、') || '祭祀祈福';
  let avoid = jiList.join('、') || '诸事不宜';
  if (event && evtConfig.jianchu) {
    if (evtConfig.jianchu.indexOf(jianchuName) !== -1) {
      suggestion = '宜' + event + '（建除' + jianchuName + '日与' + event + '相合）';
    } else {
      avoid += '；' + event + '需另择吉日';
    }
  }
  
  let huangheiStr = zhishen + '(' + (zhishenIsHuangdao ? '黄道' : '黑道') + ')';
  
  return {
    date: Y + '年' + M + '月' + D + '日',
    ganzhi: TIAN_GAN[yearGZ.gan] + DI_ZHI[yearGZ.zhi] + '年 ' + TIAN_GAN[monthGZ.gan] + DI_ZHI[monthGZ.zhi] + '月 ' + TIAN_GAN[dayGZ.gan] + DI_ZHI[dayGZ.zhi] + '日',
    jianchu: jianchuName,
    xingxiu: xingxiu.name + xingxiu.animal + '(' + xingxiuJixiong + ')',
    chongsha: '冲' + chongshaInfo.chong + ' 煞' + chongshaInfo.sha,
    huanghei: huangheiStr,
    taishen: taiShen,
    pengzu: pengzu.join('；'),
    jishen: jishenList,
    xiongshen: xiongshenList,
    yi: yiList,
    ji: jiList,
    kongwang: kongWang,
    score: score,
    analysis: analysis,
    suggestion: suggestion,
    avoid: avoid
  };
}

const _origCalcJiuriScore = (typeof calcJiuriScore === 'function') ? calcJiuriScore : null;
function calcJiuriScore(stemIdx, branchIdx, dayDate) {
  // 基于传统规则评分（无硬编码日期、无Math.random）
  let Y = dayDate.getFullYear(), M = dayDate.getMonth()+1, D = dayDate.getDate();
  let yearGZ = getYearGanZhi(Y, M, D);
  let monthGZ = getMonthGanZhi(Y, M, D);
  let dayGZ = getDayGanZhi(Y, M, D);
  let score = 50;
  // 建除十二神
  let jcName = getJianChu(monthGZ.zhi, dayGZ.zhi);
  let jcLuckMap = {'建':0,'除':1,'满':1,'平':0,'定':1,'执':0,'破':-1,'危':0,'成':1,'收':0,'开':1,'闭':-1};
  score += (jcLuckMap[jcName] || 0) * 10;
  // 值神黄道/黑道
  let zs = getZhishen(dayGZ.gan, dayGZ.zhi);
  if (ZHISHEN_TYPE[zs]) score += 8; else score -= 4;
  // 星宿吉凶
  let xx = getXingXiu(Y, M, D);
  let xxJ = XINGXIU_JIXIONG[xx.name] || '平';
  if (xxJ === '吉') score += 6; else if (xxJ === '凶') score -= 6;
  // 吉神加分
  let js = calcJishen(yearGZ, monthGZ, dayGZ);
  score += js.length * 4;
  // 凶神减分
  let xs = calcXiongshen(yearGZ, monthGZ, dayGZ);
  score -= xs.length * 5;
  // 月破大凶
  if (xs.indexOf('月破') !== -1) score -= 15;
  return Math.max(1, Math.min(100, Math.round(score)));
}

// 全局注册
if (typeof window !== 'undefined') {
  window.liuyaoQiGua = liuyaoQiGua;
  window.liuyaoZhuangGua = liuyaoZhuangGua;
  window.liuyaoDuanGua = liuyaoDuanGua;
  window.ziweiPaiPan = ziweiPaiPan;
  window.ziweiAnalysis = ziweiAnalysis;
  window.qimenPaiPan = qimenPaiPan;
  window.qimenAnalyze = qimenAnalyze;
  window.getQimenReadingV2 = typeof getQimenReadingV2 !== 'undefined' ? getQimenReadingV2 : function(){ return {error:'getQimenReadingV2 未实现'}; };
  window.getYijingReadingV2 = typeof getYijingReadingV2 !== 'undefined' ? getYijingReadingV2 : function(){ return {error:'getYijingReadingV2 未实现'}; };
  window.meihuaQiGua = meihuaQiGua;
  window.meihuaAnalyze = meihuaAnalyze;
  window.liurenPaiPan = liurenPaiPan;
  window.liurenAnalyze = liurenAnalyze;
  window.xingmingAnalyze = xingmingAnalyze;
  window.fengshuiAnalyze = fengshuiAnalyze;
  window.zeriCalcFull = zeriCalcFull;
  window.calcJiuriScore = calcJiuriScore;

  // ===== 补充缺失的工具函数 =====
  function _gongliToGanZhi(year, month, day) {
    // 简化版公历转干支（需完整农历库才能精确）
    // 使用基准日期1900年1月31日（农历正月初一，干支甲子）
    const baseDate = new Date(1900, 0, 31);
    const targetDate = new Date(year, month - 1, day);
    const diffDays = Math.floor((targetDate - baseDate) / (24 * 60 * 60 * 1000));
    const ganIndex = (diffDays % 10 + 10) % 10;
    const zhiIndex = (diffDays % 12 + 12) % 12;
    const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
    const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
    return { gan: STEMS[ganIndex], zhi: BRANCHES[zhiIndex], ganZhi: STEMS[ganIndex] + BRANCHES[zhiIndex] };
  }
  window._gongliToGanZhi = _gongliToGanZhi;
}

// ========== UI 绑定函数 ==========

function _showEngineResult(containerId, html) {
  let el = document.getElementById(containerId);
  if (!el) {
    el = document.createElement('div');
    el.id = containerId;
    el.className = 'engine-result-card';
    el.style.cssText = 'margin-top:16px;padding:20px;background:linear-gradient(135deg,rgba(201,168,76,0.06),rgba(0,0,0,0.3));border:1px solid rgba(201,168,76,0.25);border-radius:12px;font-size:13px;line-height:1.9;color:var(--ink);box-shadow:0 4px 20px rgba(0,0,0,0.15)';
    // Try to find parent panel to append to
    let panel = document.querySelector('.result:visible') || document.querySelector('.result') || document.getElementById('zhanbuContent');
    if (panel) panel.appendChild(el);
    else document.body.appendChild(el);
  }
  el.style.display = 'block';
  el.innerHTML = html;
  el.scrollIntoView({behavior:'smooth',block:'nearest'});
}

function runLiuyaoEngine() {
  try {
    const now = new Date();
    const gua = liuyaoQiGua('time', {year:now.getFullYear(), month:now.getMonth()+1, day:now.getDate(), hour:now.getHours()});
    const gz = _gongliToGanZhi(now.getFullYear(), now.getMonth()+1, now.getDate());
    gua.dayGanZhi = gz;
    gua.monthZhi = _BRANCHES[_qyMod(now.getMonth()+1, 12)];
    const zg = liuyaoZhuangGua(gua, gz);
    gua.zhuangGua = zg;
    const duan = liuyaoDuanGua(gua, '事业');
    const ben = _GUA_XIANG[gua.benGua.lower].name + _GUA_XIANG[gua.benGua.upper].name;
    const bian = _GUA_XIANG[gua.bianGua.lower].name + _GUA_XIANG[gua.bianGua.upper].name;
    let html = '<h4 style="color:var(--gold)">☰ 六爻引擎演算结果</h4>';
    html += '<p><b>本卦：</b>' + ben + '（' + gua.benGua.idx + '）</p>';
    html += '<p><b>变卦：</b>' + bian + '</p>';
    html += '<p><b>动爻：</b>' + (gua.dongYao.map(function(x){return '第'+(x+1)+'爻';}).join('、') || '无') + '</p>';
    html += '<p><b>宫：</b>' + zg.gongName + ' · ' + zg.gongWuxing + '</p>';
    html += '<p><b>世应：</b>世' + (zg.shiying.shi+1) + '爻 · 应' + (zg.shiying.ying+1) + '爻</p>';
    html += '<p><b>六亲：</b>' + zg.liuqin.join(' · ') + '</p>';
    html += '<p><b>六神：</b>' + zg.liushen.join(' · ') + '</p>';
    html += '<p><b>用神：</b>' + duan.yongshen + ' · ' + duan.verdict + '</p>';
    html += '<p><b>应期：</b>' + duan.yingqi + '</p>';
    html += '<p style="opacity:0.8">' + duan.advice + '</p>';
    _showEngineResult('yjEngineResult', html);
  } catch(e) { 
    console.error('[六爻引擎错误错误]', e.message, e.stack);
    let _errEl = document.getElementById('engineResult') || document.querySelector('[id$="EngineResult"]');
    if(_errEl){ _errEl.style.display='block'; _errEl.innerHTML='<div style="padding:20px;background:rgba(231,76,60,.08);border:1px solid rgba(231,76,60,.2);border-radius:8px;margin:10px 0"><h5 style="color:#e74c3c">❌ 六爻引擎错误</h5><p style="font-size:13px;opacity:.8;margin-top:8px">'+e.message+'</p></div>'; }
    else { showToast('六爻引擎错误：'+e.message); }
  }
}

function runMeihuaEngine() {
  try {
    const n1 = parseInt(document.getElementById('mhNum1')?.value || '1');
    const n2 = parseInt(document.getElementById('mhNum2')?.value || '1');
    const n3 = parseInt(document.getElementById('mhNum3')?.value || '1');
    const gua = meihuaQiGua('number', {n1:n1, n2:n2, n3:n3});
    const analyze = meihuaAnalyze(gua, '所问之事');
    const ben = _GUA_XIANG[gua.benGua.lower].name + _GUA_XIANG[gua.benGua.upper].name;
    const bian = _GUA_XIANG[gua.bianGua.lower].name + _GUA_XIANG[gua.bianGua.upper].name;
    let html = '<h4 style="color:var(--jade2)">🌸 梅花引擎演算结果</h4>';
    html += '<p><b>本卦：</b>' + ben + ' · 动爻第'+(gua.dongYao+1)+'爻</p>';
    html += '<p><b>变卦：</b>' + bian + '</p>';
    html += '<p><b>体卦：</b>' + analyze.tiGua + ' · <b>用卦：</b>' + analyze.yongGua + '</p>';
    html += '<p><b>体用关系：</b>' + analyze.relation + '</p>';
    html += '<p><b>初断：</b>' + analyze.initial + '</p>';
    html += '<p><b>终局：</b>' + analyze.endRelation + '</p>';
    html += '<p><b>综合：</b>' + analyze.verdict + '</p>';
    html += '<p style="opacity:0.8">' + analyze.advice + '</p>';
    _showEngineResult('mhEngineResult', html);
  } catch(e) { 
    console.error('[梅花引擎错误错误]', e.message, e.stack);
    let _errEl = document.getElementById('engineResult') || document.querySelector('[id$="EngineResult"]');
    if(_errEl){ _errEl.style.display='block'; _errEl.innerHTML='<div style="padding:20px;background:rgba(231,76,60,.08);border:1px solid rgba(231,76,60,.2);border-radius:8px;margin:10px 0"><h5 style="color:#e74c3c">❌ 梅花引擎错误</h5><p style="font-size:13px;opacity:.8;margin-top:8px">'+e.message+'</p></div>'; }
    else { showToast('梅花引擎错误：' + e.message); }
  }
}

function runQimenEngine() {
  try {
    const dateVal = document.getElementById('qmDate')?.value;
    const hourVal = document.getElementById('qmHour')?.value;
    const now = dateVal ? new Date(dateVal + 'T00:00:00') : new Date();
    const hour = hourVal ? parseInt(hourVal) : now.getHours();
    const pan = qimenPaiPan(now.getFullYear(), now.getMonth()+1, now.getDate(), hour, 'auto');
    const analyze = qimenAnalyze(pan, document.getElementById('qmQuestion')?.value || '事业');
    let html = '<h4 style="color:var(--violet2)">☰ 奇门引擎演算结果</h4>';
    html += '<p><b>遁局：</b>' + (pan.dun==='yang'?'阳':'阴') + '遁' + pan.ju + '局</p>';
    html += '<p><b>用神：</b>' + analyze.yongShen + ' · 落' + analyze.palace + '宫</p>';
    html += '<p><b>天盘：</b>' + analyze.qi + ' · 门：' + analyze.men + ' · 星：' + analyze.star + ' · 神：' + analyze.shen + '</p>';
    html += '<p><b>吉凶：</b>' + analyze.luck + (analyze.wuBuYu ? ' · ⚠️五不遇时' : '') + (analyze.isMaXing ? ' · 🐎马星临宫' : '') + '</p>';
    if (analyze.dayGanPalace) html += '<p><b>命主(日干)：</b>落' + analyze.dayGanPalace + '宫' + (analyze.dayGanQi ? '·天盘' + analyze.dayGanQi : '') + '</p>';
    if (analyze.hourGanPalace) html += '<p><b>事体(时干)：</b>落' + analyze.hourGanPalace + '宫' + (analyze.hourGanQi ? '·天盘' + analyze.hourGanQi : '') + '</p>';
    html += '<p><b>策略：</b>' + analyze.strategy + '</p>';
    if (analyze.gejuText) html += '<p><b>格局：</b>' + analyze.gejuText + '</p>';
    if (analyze.sihai) html += '<p style="opacity:0.7"><b>四害分析：</b>' + analyze.sihai + '</p>';
    if (analyze.huajie) html += '<p style="opacity:0.7"><b>化解建议：</b>' + analyze.huajie + '</p>';
    if (analyze.mascot) html += '<p style="opacity:0.7"><b>吉祥物：</b>' + analyze.mascot + '</p>';
    html += '<p style="opacity:0.8">' + analyze.advice + '</p>';
    let dims = analyze.dimensions || {};
    if (Object.keys(dims).length > 0) {
      html += '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:6px;margin-top:12px;font-size:12px">';
      for (let dk in dims) html += '<div>' + dk + '：' + dims[dk] + '</div>';
      html += '</div>';
    }
    _showEngineResult('qmEngineResult', html);
  } catch(e) { 
    console.error('[奇门引擎错误]', e.message, e.stack);
    let el = document.getElementById('qmEngineResult');
    if(el){ el.style.display='block'; el.innerHTML='<div style="padding:20px;background:rgba(231,76,60,.08);border:1px solid rgba(231,76,60,.2);border-radius:8px"><h5 style="color:#e74c3c">❌ 奇门引擎错误</h5><p style="font-size:13px;opacity:.8;margin-top:8px">'+e.message+'</p><p style="font-size:11px;opacity:.5;margin-top:4px">'+(e.stack||'').split("\n").slice(0,3).join("<br>")+'</p></div>'; }
    else { showToast('奇门引擎错误：' + e.message); }
  }
}

function runLiurenEngine() {
  try {
    const dateVal = document.getElementById('lrDate')?.value;
    const hourVal = document.getElementById('lrHour')?.value;
    const now = dateVal ? new Date(dateVal + 'T00:00:00') : new Date();
    const hour = hourVal ? parseInt(hourVal) : now.getHours();
    const pan = liurenPaiPan(now.getFullYear(), now.getMonth()+1, now.getDate(), hour, 0);
    const analyze = liurenAnalyze(pan, document.getElementById('lrQuestion')?.value || '所问之事');
    let html = '<h4 style="color:var(--orange)">⬡ 六壬引擎演算结果</h4>';
    html += '<p><b>日干支：</b>' + pan.dayGan + pan.dayZhi + ' · 占时：' + pan.shiZhi + '</p>';
    html += '<p><b>月将：</b>' + pan.yueJiang + '</p>';
    html += '<p><b>三传：</b>' + pan.sanChuan.join(' → ') + '</p>';
    html += '<p><b>三传神将：</b>' + analyze.chuanShen.join(' → ') + '</p>';
    html += '<p><b>吉凶：</b>' + analyze.luck + '</p>';
    html += '<p style="opacity:0.8">' + analyze.advice + '</p>';
    _showEngineResult('lrEngineResult', html);
  } catch(e) { 
    console.error('[六壬引擎错误错误]', e.message, e.stack);
    let _errEl = document.getElementById('engineResult') || document.querySelector('[id$="EngineResult"]');
    if(_errEl){ _errEl.style.display='block'; _errEl.innerHTML='<div style="padding:20px;background:rgba(231,76,60,.08);border:1px solid rgba(231,76,60,.2);border-radius:8px;margin:10px 0"><h5 style="color:#e74c3c">❌ 六壬引擎错误</h5><p style="font-size:13px;opacity:.8;margin-top:8px">'+e.message+'</p></div>'; }
    else { showToast('六壬引擎错误：' + e.message); }
  }
}

function runZiweiEngine() {
  try {
    const dateStr = document.getElementById('zwDate')?.value;
    let year = new Date().getFullYear(), month = 1, day = 1;
    if (dateStr) { const parts = dateStr.split('-').map(Number); year = parts[0]; month = parts[1]; day = parts[2]; }
    const hour = parseInt(document.getElementById('zwHour')?.value || 0);
    const sex = document.getElementById('zwSex')?.value || 'male';
    const pan = ziweiPaiPan(year, month, day, hour, sex);
    const analyze = ziweiAnalysis(pan);
    let html = '<h4 style="color:var(--fire)">🌌 紫微引擎演算结果</h4>';
    html += '<p><b>命宫：</b>' + pan.mingZhi + ' · 身宫：' + pan.shenZhi + '</p>';
    html += '<p><b>五行局：</b>' + pan.ju + '</p>';
    html += '<p><b>格局：</b>' + analyze.geju + '</p>';
    html += '<p><b>四化：</b>' + analyze.sihuaText + '</p>';
    html += '<p><b>概述：</b>' + analyze.overview + '</p>';
    html += '<p style="opacity:0.8">' + analyze.advice + '</p>';
    _showEngineResult('zwEngineResult', html);
  } catch(e) { 
    console.error('[紫微引擎错误错误]', e.message, e.stack);
    let _errEl = document.getElementById('engineResult') || document.querySelector('[id$="EngineResult"]');
    if(_errEl){ _errEl.style.display='block'; _errEl.innerHTML='<div style="padding:20px;background:rgba(231,76,60,.08);border:1px solid rgba(231,76,60,.2);border-radius:8px;margin:10px 0"><h5 style="color:#e74c3c">❌ 紫微引擎错误</h5><p style="font-size:13px;opacity:.8;margin-top:8px">'+e.message+'</p></div>'; }
    else { showToast('紫微引擎错误：' + e.message); }
  }
}

function runXingmingEngine() {
  try {
    const name = document.getElementById('xmName')?.value || document.getElementById('xmInput')?.value || '乾元';
    const sex = document.getElementById('xmSex')?.value || 'male';
    const birthDate = document.getElementById('xmBirthDate')?.value || '';
    const birthHour = document.getElementById('xmBirthHour')?.value || '';
    const res = xingmingAnalyze(name, sex);
    let html = '<h4 style="color:var(--gold)">🔤 姓名学引擎演算结果</h4>';
    if (res.error) { html += '<p>' + res.error + '</p>'; }
    else {
      html += '<p><b>姓名：</b>' + res.name + '（' + (res.sex==='male'?'男':'女') + '）</p>';
      if (birthDate) html += '<p><b>出生日期：</b>' + birthDate + (birthHour ? ' ' + ['子时','丑时','寅时','卯时','辰时','巳时','午时','未时','申时','酉时','戌时','亥时'][parseInt(birthHour)] : '') + '</p>';
      html += '<p><b>五格：</b>天' + res.tianGe + ' · 人' + res.renGe + ' · 地' + res.diGe + ' · 外' + res.waiGe + ' · 总' + res.zongGe + '</p>';
      html += '<p><b>人格五行：</b>' + res.wuxing + ' · 三才：' + res.sancai.join('-') + '</p>';
      html += '<p><b>三才评价：</b>' + res.sancaiRelation + '</p>';
      html += '<p><b>评分：</b>' + res.score + '/100</p>';
      html += '<p style="opacity:0.8">' + res.advice + '</p>';
    }
    _showEngineResult('xmEngineResult', html);
    // 化解方案注入
    if (birthDate && typeof appendHuajieToResult === 'function') {
      let _p = birthDate.split('-').map(Number);
      if (_p.length === 3) {
        let _h = birthHour !== '' ? parseInt(birthHour) * 2 : 12;
        appendHuajieToResult('xmEngineResult', _p[0], _p[1], _p[2], _h, sex, name);
      }
    }
  } catch(e) { 
    console.error('[姓名学引擎错误错误]', e.message, e.stack);
    let _errEl = document.getElementById('engineResult') || document.querySelector('[id$="EngineResult"]');
    if(_errEl){ _errEl.style.display='block'; _errEl.innerHTML='<div style="padding:20px;background:rgba(231,76,60,.08);border:1px solid rgba(231,76,60,.2);border-radius:8px;margin:10px 0"><h5 style="color:#e74c3c">❌ 姓名学引擎错误</h5><p style="font-size:13px;opacity:.8;margin-top:8px">'+e.message+'</p></div>'; }
    else { showToast('姓名学引擎错误：' + e.message); }
  }
}

function runFengshuiEngine() {
  try {
    const type = document.getElementById('fsType')?.value || document.getElementById('fsJianzhu')?.value || '住宅';
    const direction = document.getElementById('fsDirection')?.value || '北';
    const year = parseInt(document.getElementById('fsYear')?.value || 2024);
    const layout = document.getElementById('fsLayout')?.value || '三室两厅';
    const birthYear = parseInt(document.getElementById('fsBirthYear')?.value) || null;
    const res = fengshuiAnalyze(type, direction, year, layout, birthYear);
    let html = '<h4 style="color:var(--violet2)">🏔️ 风水引擎演算结果</h4>';
    html += '<p><b>宅型：</b>' + res.houseType + ' · 坐向：' + res.direction + ' · 建筑年代：' + res.buildYear + '</p>';
    html += '<p><b>宅命：</b>' + res.zhaiMing + ' · 宅主命卦：' + res.yaoMing + '</p>';
    html += '<p><b>宅命配合：</b>' + (res.matching?'相配':'不配') + '</p>';
    html += '<p><b>元运：</b>' + res.period + '运 · ' + (res.wangShan?'当运':'非当运') + '</p>';
    html += '<p><b>玄空：</b>' + (res.xuankong && res.xuankong.text ? res.xuankong.text : res.xuankong) + '</p>';
    html += '<p><b>评分：</b>' + res.score + '/100</p>';
    html += '<p><b>建议：</b>' + res.advice + '</p>';
    html += '<ul style="padding-left:18px;opacity:0.8"><li>' + res.layoutTips.join('</li><li>') + '</li></ul>';
    _showEngineResult('fsEngineResult', html);
  } catch(e) { 
    console.error('[风水引擎错误错误]', e.message, e.stack);
    let _errEl = document.getElementById('engineResult') || document.querySelector('[id$="EngineResult"]');
    if(_errEl){ _errEl.style.display='block'; _errEl.innerHTML='<div style="padding:20px;background:rgba(231,76,60,.08);border:1px solid rgba(231,76,60,.2);border-radius:8px;margin:10px 0"><h5 style="color:#e74c3c">❌ 风水引擎错误</h5><p style="font-size:13px;opacity:.8;margin-top:8px">'+e.message+'</p></div>'; }
    else { showToast('风水引擎错误：' + e.message); }
  }
}

function runZeriEngine() {
  try {
    const lm = parseInt(document.getElementById('zeriMonth')?.value || 1);
    const ld = parseInt(document.getElementById('zeriDay')?.value || 1);
    const res = zeriCalcFull(lm, ld);
    let html = '<h4 style="color:var(--gold)">📅 择日引擎演算结果</h4>';
    html += '<p><b>农历：</b>' + res.lunarMonth + '月' + res.lunarDay + '日 · ' + res.dayGanZhi + '</p>';
    html += '<p><b>建除：</b>' + res.jianchu.name + '日（' + res.jianchu.luck + '）</p>';
    html += '<p><b>彭祖百忌：</b>' + res.pengzu.join('；') + '</p>';
    html += '<p><b>星宿：</b>' + res.xiuxing + '</p>';
    html += '<p><b>宜忌：</b>' + res.yiji + '</p>';
    html += '<p><b>吉时：</b>' + res.goodHoursText + '</p>';
    html += '<p><b>评分：</b>' + res.score + '/100</p>';
    html += '<p style="opacity:0.8">' + res.summary + '</p>';
    _showEngineResult('zrEngineResult', html);
  } catch(e) { 
    console.error('[择日引擎错误错误]', e.message, e.stack);
    let _errEl = document.getElementById('engineResult') || document.querySelector('[id$="EngineResult"]');
    if(_errEl){ _errEl.style.display='block'; _errEl.innerHTML='<div style="padding:20px;background:rgba(231,76,60,.08);border:1px solid rgba(231,76,60,.2);border-radius:8px;margin:10px 0"><h5 style="color:#e74c3c">❌ 择日引擎错误</h5><p style="font-size:13px;opacity:.8;margin-top:8px">'+e.message+'</p></div>'; }
    else { showToast('择日引擎错误：' + e.message); }
  }
}

// 全局注册绑定函数
if (typeof window !== 'undefined') {
  window.runLiuyaoEngine = runLiuyaoEngine;
  window.runMeihuaEngine = runMeihuaEngine;
  window.runQimenEngine = runQimenEngine;
  window.runLiurenEngine = runLiurenEngine;
  window.runZiweiEngine = runZiweiEngine;
  window.runXingmingEngine = runXingmingEngine;
  window.runFengshuiEngine = runFengshuiEngine;
  window.runZeriEngine = runZeriEngine;

  // ===== 独立区域调用函数 =====
  function runQimen() {
    const year = parseInt(document.getElementById('qimen-year')?.value || new Date().getFullYear());
    const month = parseInt(document.getElementById('qimen-month')?.value || new Date().getMonth()+1);
    const day = parseInt(document.getElementById('qimen-day')?.value || new Date().getDate());
    const hour = parseInt(document.getElementById('qimen-hour')?.value || 5);
    const ju = document.getElementById('qimen-ju')?.value || 'auto';
    try {
      const pan = qimenPaiPan(year, month, day, hour, ju);
      const analyze = qimenAnalyze(pan, '事业');
      let html = '<h4 style="color:var(--violet2)">☰ 奇门遁甲排盘</h4>';
      html += '<p><b>时间：</b>' + year + '年' + month + '月' + day + '日 ' + ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'][hour] + '时</p>';
      html += '<p><b>遁局：</b>' + (pan.dun==='yang'?'阳':'阴') + '遁' + pan.ju + '局</p>';
      html += '<p><b>用神：</b>' + analyze.yongShen + ' · 落' + analyze.palace + '宫</p>';
      html += '<p><b>天盘：</b>' + analyze.qi + ' · 门：' + analyze.men + ' · 星：' + analyze.star + '</p>';
      html += '<p><b>吉凶：</b>' + analyze.luck + '</p>';
      html += '<p><b>策略：</b>' + analyze.strategy + '</p>';
      const el = document.getElementById('qimenResult');
      if (el) { el.innerHTML = html; el.style.display = 'block'; }
    } catch(e) { 
    console.error('[奇门引擎错误错误]', e.message, e.stack);
    let _errEl = document.getElementById('engineResult') || document.querySelector('[id$="EngineResult"]');
    if(_errEl){ _errEl.style.display='block'; _errEl.innerHTML='<div style="padding:20px;background:rgba(231,76,60,.08);border:1px solid rgba(231,76,60,.2);border-radius:8px;margin:10px 0"><h5 style="color:#e74c3c">❌ 奇门引擎错误</h5><p style="font-size:13px;opacity:.8;margin-top:8px">'+e.message+'</p></div>'; }
    else { showToast('奇门引擎错误：' + e.message); }
  }
  }
  window.runQimen = runQimen;

  function runZiwei() {
    const year = parseInt(document.getElementById('ziwei-year')?.value || 1990);
    const month = parseInt(document.getElementById('ziwei-month')?.value || 1);
    const day = parseInt(document.getElementById('ziwei-day')?.value || 1);
    const hour = parseInt(document.getElementById('ziwei-hour')?.value || 0);
    const sex = document.getElementById('ziwei-sex')?.value || 'male';
    try {
      const pan = ziweiPaiPan(year, month, day, hour, sex);
      const analyze = ziweiAnalysis(pan);
      let html = '<h4 style="color:var(--fire)">🌌 紫微斗数排盘</h4>';
      html += '<p><b>生辰：</b>' + year + '年' + month + '月' + day + '日 ' + ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'][hour] + '时</p>';
      html += '<p><b>命宫：</b>' + pan.mingZhi + ' · 身宫：' + pan.shenZhi + '</p>';
      html += '<p><b>五行局：</b>' + pan.ju + '</p>';
      html += '<p><b>格局：</b>' + analyze.geju + '</p>';
      html += '<p><b>四化：</b>' + analyze.sihuaText + '</p>';
      html += '<p><b>概述：</b>' + analyze.overview + '</p>';
      const el = document.getElementById('ziweiResult');
      if (el) { el.innerHTML = html; el.style.display = 'block'; }
    } catch(e) { 
    console.error('[紫微引擎错误错误]', e.message, e.stack);
    let _errEl = document.getElementById('engineResult') || document.querySelector('[id$="EngineResult"]');
    if(_errEl){ _errEl.style.display='block'; _errEl.innerHTML='<div style="padding:20px;background:rgba(231,76,60,.08);border:1px solid rgba(231,76,60,.2);border-radius:8px;margin:10px 0"><h5 style="color:#e74c3c">❌ 紫微引擎错误</h5><p style="font-size:13px;opacity:.8;margin-top:8px">'+e.message+'</p></div>'; }
    else { showToast('紫微引擎错误：' + e.message); }
  }
  }
  window.runZiwei = runZiwei;

  function runMeihua() {
    const method = document.getElementById('meihua-method')?.value || 'number';
    const upper = parseInt(document.getElementById('meihua-upper')?.value || 3);
    const lower = parseInt(document.getElementById('meihua-lower')?.value || 6);
    const dong = parseInt(document.getElementById('meihua-dong')?.value || 1);
    try {
      const pan = meihuaQiGua(method, { upper, lower, dong });
      const analyze = meihuaAnalyze(pan);
      let html = '<h4 style="color:var(--jade)">🌸 梅花易数起卦</h4>';
      html += '<p><b>起卦方式：</b>' + (method==='time'?'时间起卦':method==='number'?'数字起卦':'心动起卦') + '</p>';
      html += '<p><b>本卦：</b>' + pan.benGua + ' · 变卦：' + pan.bianGua + '</p>';
      html += '<p><b>体用：</b>体为' + pan.tiGua + ' · 用为' + pan.yongGua + '</p>';
      html += '<p><b>动爻：</b>第' + dong + '爻动</p>';
      html += '<p><b>五行：</b>体' + analyze.tiWuxing + ' · 用' + analyze.yongWuxing + '</p>';
      html += '<p><b>生克：</b>' + analyze.relation + '</p>';
      html += '<p><b>吉凶：</b>' + analyze.luck + '</p>';
      html += '<p style="opacity:0.8">' + analyze.advice + '</p>';
      const el = document.getElementById('meihuaResult');
      if (el) { el.innerHTML = html; el.style.display = 'block'; }
    } catch(e) { 
    console.error('[梅花引擎错误错误]', e.message, e.stack);
    let _errEl = document.getElementById('engineResult') || document.querySelector('[id$="EngineResult"]');
    if(_errEl){ _errEl.style.display='block'; _errEl.innerHTML='<div style="padding:20px;background:rgba(231,76,60,.08);border:1px solid rgba(231,76,60,.2);border-radius:8px;margin:10px 0"><h5 style="color:#e74c3c">❌ 梅花引擎错误</h5><p style="font-size:13px;opacity:.8;margin-top:8px">'+e.message+'</p></div>'; }
    else { showToast('梅花引擎错误：' + e.message); }
  }
  }
  window.runMeihua = runMeihua;

  function runLiuren() {
    const year = parseInt(document.getElementById('liuren-year')?.value || new Date().getFullYear());
    const month = parseInt(document.getElementById('liuren-month')?.value || new Date().getMonth()+1);
    const day = parseInt(document.getElementById('liuren-day')?.value || new Date().getDate());
    const hour = parseInt(document.getElementById('liuren-hour')?.value || 5);
    try {
      const pan = liurenPaiPan(year, month, day, hour, 0);
      const analyze = liurenAnalyze(pan, '所问之事');
      let html = '<h4 style="color:var(--orange)">⬡ 大六壬排盘</h4>';
      html += '<p><b>时间：</b>' + year + '年' + month + '月' + day + '日 ' + ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'][hour] + '时</p>';
      html += '<p><b>日干支：</b>' + pan.dayGan + pan.dayZhi + '</p>';
      html += '<p><b>月将：</b>' + pan.yueJiang + '</p>';
      html += '<p><b>三传：</b>' + pan.sanChuan.join(' → ') + '</p>';
      html += '<p><b>三传神将：</b>' + analyze.chuanShen.join(' → ') + '</p>';
      html += '<p><b>吉凶：</b>' + analyze.luck + '</p>';
      html += '<p style="opacity:0.8">' + analyze.advice + '</p>';
      const el = document.getElementById('liurenResult');
      if (el) { el.innerHTML = html; el.style.display = 'block'; }
    } catch(e) { 
    console.error('[六壬引擎错误错误]', e.message, e.stack);
    let _errEl = document.getElementById('engineResult') || document.querySelector('[id$="EngineResult"]');
    if(_errEl){ _errEl.style.display='block'; _errEl.innerHTML='<div style="padding:20px;background:rgba(231,76,60,.08);border:1px solid rgba(231,76,60,.2);border-radius:8px;margin:10px 0"><h5 style="color:#e74c3c">❌ 六壬引擎错误</h5><p style="font-size:13px;opacity:.8;margin-top:8px">'+e.message+'</p></div>'; }
    else { showToast('六壬引擎错误：' + e.message); }
  }
  }
  window.runLiuren = runLiuren;
}

// ================================================================
// 名师解惑板块 JavaScript
// ================================================================

// 名师子导航切换
function showMastersTab(tab, btn) {
  document.querySelectorAll('.masters-tab').forEach(function(t) { t.classList.remove('active'); });
  if (btn) btn.classList.add('active');
  document.querySelectorAll('.masters-panel').forEach(function(p) { p.classList.remove('active'); });
  let panel = document.getElementById('mastersPanel-' + tab);
  if (panel) panel.classList.add('active');
}

// 大师卡片展开/收起
function toggleMasterCard(card) {
  if (card.classList.contains('expanded')) {
    card.classList.remove('expanded');
  } else {
    card.classList.add('expanded');
  }
}

// 打开提问弹窗
function openAskModal() {
  let modal = document.getElementById('askModal');
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

// 关闭提问弹窗
function closeAskModal() {
  let modal = document.getElementById('askModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
    // 重置
    let result = document.getElementById('askResult');
    if (result) result.classList.remove('active');
    let input = document.getElementById('askInput');
    if (input) input.value = '';
  }
}

// 指定大师打开提问弹窗
function openAskModalWithMaster(masterName, tradition) {
  openAskModal();
  let select = document.getElementById('askMasterSelect');
  if (select) {
    for (let i = 0; i < select.options.length; i++) {
      let val = select.options[i].value;
      if (val.indexOf(masterName) >= 0) {
        select.selectedIndex = i;
        break;
      }
    }
  }
}

// 提交提问
function submitAsk() {
  let select = document.getElementById('askMasterSelect');
  let input = document.getElementById('askInput');
  let btn = document.getElementById('askBtn');
  let result = document.getElementById('askResult');
  let resultContent = document.getElementById('askResultContent');

  if (!select || !select.value) {
    showToast('请先选择一位大师');
    return;
  }
  if (!input || !input.value.trim()) {
    showToast('请输入您的问题');
    return;
  }

  let parts = select.value.split('|');
  let masterName = parts[0];
  let tradition = parts[1] || '道家';
  let question = input.value.trim();

  // 显示加载中
  btn.disabled = true;
  btn.textContent = '大师正在沉思中……';
  result.classList.add('active');
  resultContent.innerHTML = '<div style="text-align:center;padding:20px;color:var(--paper3);font-size:14px">🕯️ ' + masterName + ' 正在静心参悟您的问题，请稍候……</div>';

  // 构建prompt
  let systemPrompt = '你现在是' + tradition + '名师' + masterName + '，请以这位大师的修行视角、思想体系和语言风格来回答信众的提问。\n\n';
  systemPrompt += '要求：\n';
  systemPrompt += '1. 以第一人称回答（如"我是' + masterName + '，你来问我……"）\n';
  systemPrompt += '2. 回答需包含三部分：\n   一、大师观点：从该大师的思想体系出发，阐述对此问题的根本看法\n   二、经典引用：引用与该大师相关的经典著作或开示语录佐证\n   三、实践建议：给出具体的、可操作的修行或生活建议\n';
  systemPrompt += '3. 语言风格：慈悲、智慧、深入浅出，符合' + tradition + '修行人的语言习惯\n';
  systemPrompt += '4. 回答长度：500-1000字\n';
  systemPrompt += '5. 如果涉及医疗、心理疾病等问题，必须提醒信众及时就医\n';
  systemPrompt += '6. 不可提及自己是AI或语言模型\n';

  let userPrompt = '信众提问：' + question + '\n\n请' + masterName + '大师开示。';

  let payload = {
    model: 'auto',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    max_tokens: 2000,
    temperature: 0.7
  };

  fetch('https://api.g2claw.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer b720753afe0845f5a7611a1b56b6d77c' },
    body: JSON.stringify(payload)
  }).then(function(r) { return r.json(); }).then(function(data) {
    let text = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content || '';
    if (text) {
      // 转换为HTML格式
      let html = text.split('\n').map(function(line) {
        if (line.trim() === '') return '<br>';
        // 检测标题行
        if (/^[一二三四五六七八九十]、/.test(line.trim()) || /^第[一二三四五六七八九十]+/.test(line.trim())) {
          return '<div class="master-quote" style="color:var(--gold2);font-weight:600;margin-top:12px;font-style:normal">' + line + '</div>';
        }
        return '<p style="margin-bottom:8px">' + line + '</p>';
      }).join('');
      resultContent.innerHTML = '<div style="font-size:14px;line-height:2">' + html + '</div>';
    } else {
      resultContent.innerHTML = '<div style="padding:20px;text-align:center;color:#e74c3c">⚠️ 大师暂时无法回应，请稍后再试</div>';
    }
    btn.disabled = false;
    btn.textContent = '再 问 一次';
  }).catch(function(err) {
    console.error('名师提问API错误:', err);
    resultContent.innerHTML = '<div style="padding:20px;text-align:center"><div style="color:#e74c3c;margin-bottom:8px">⚠️ 开示服务暂时不可用</div><div style="color:var(--paper2);font-size:12px">请确认网络正常</div></div>';
    btn.disabled = false;
    btn.textContent = '重 试';
  });
}

// ===== 知识库检索功能 =====
let _kbSearchTimer = null;
let _kbCurrentCategory = 'all';
let _kbAllEntries = null;

function debounceKbSearch(val) {
  clearTimeout(_kbSearchTimer);
  _kbSearchTimer = setTimeout(function() { searchKbEntries(val); }, 300);
}

function filterKbByCategory(cat) {
  _kbCurrentCategory = cat;
  // 更新按钮样式
  document.querySelectorAll('.kb-cat-btn').forEach(function(btn) {
    btn.classList.remove('kb-cat-active');
    btn.style.background = 'transparent';
  });
  event.target.classList.add('kb-cat-active');
  event.target.style.background = 'var(--gold-dim)';
  // 重新搜索
  let input = document.getElementById('kbSearchInput');
  searchKbEntries(input ? input.value : '');
}

function _collectKbEntries() {
  if (_kbAllEntries) return _kbAllEntries;
  _kbAllEntries = [];
  // 从 AUTHORITATIVE_KNOWLEDGE 收集
  try {
    if (typeof AUTHORITATIVE_KNOWLEDGE !== 'undefined') {
      for (let k in AUTHORITATIVE_KNOWLEDGE) {
        let item = AUTHORITATIVE_KNOWLEDGE[k];
        if (typeof item === 'object') {
          _kbAllEntries.push({
            key: k,
            category: item.category || _guessCategory(k),
            title: item.title || item.name || k,
            intro: item.intro || item.desc || '',
            overview: item.overview || '',
            source: 'authoritative'
          });
          // 子条目
          if (item.sections) {
            for (let sk in item.sections) {
              _kbAllEntries.push({
                key: k + '.' + sk,
                category: item.category || _guessCategory(k),
                title: sk,
                intro: (item.sections[sk] || '').substring(0, 200),
                overview: item.sections[sk] || '',
                source: 'authoritative'
              });
            }
          }
        }
      }
    }
  } catch(e) {}
  // 从 KNOWLEDGE_DETAILS_EXTRA 收集
  try {
    if (typeof KNOWLEDGE_DETAILS_EXTRA !== 'undefined') {
      for (let k in KNOWLEDGE_DETAILS_EXTRA) {
        let item = KNOWLEDGE_DETAILS_EXTRA[k];
        _kbAllEntries.push({
          key: k,
          category: _guessCategory(k),
          title: item.title || k,
          intro: (item.content || item.html || '').substring(0, 200),
          overview: item.content || item.html || '',
          source: 'extra'
        });
      }
    }
  } catch(e) {}
  // 从 KOUJUE_DATABASE 收集
  try {
    if (typeof KOUJUE_DATABASE !== 'undefined') {
      for (let cat in KOUJUE_DATABASE) {
        let items = KOUJUE_DATABASE[cat];
        if (Array.isArray(items)) {
          items.forEach(function(item, idx) {
            _kbAllEntries.push({
              key: 'koujue.' + cat + '.' + idx,
              category: 'koujue',
              title: item.name || item.title || (cat + '-' + idx),
              intro: (item.content || item.text || '').substring(0, 200),
              overview: item.content || item.text || '',
              source: 'koujue'
            });
          });
        }
      }
    }
  } catch(e) {}
  return _kbAllEntries;
}

function _guessCategory(key) {
  let k = key.toLowerCase();
  let map = {
    bazi: ['bazi','八字','日主','十神','格局','用神','大运','流年','神煞','天干','地支'],
    liuyao: ['liuyao','六爻','纳甲','六亲','用神'],
    fengshui: ['fengshui','风水','玄空','飞星','八宅','罗盘'],
    ziwei: ['ziwei','紫微','主星','宫位'],
    qimen: ['qimen','奇门','八门','九星','三奇','六仪'],
    meihua: ['meihua','梅花','体用'],
    liuren: ['liuren','六壬','四课','三传','天将'],
    xingming: ['xingming','姓名','五格','三才'],
    tizhi: ['tizhi','体质'],
    zhouyi: ['zhouyi','周易','易经'],
    bagua: ['bagua','八卦'],
    wuxing: ['wuxing','五行'],
    shishen: ['shishen','十神'],
    nayin: ['nayin','纳音'],
    shensha: ['shensha','神煞'],
    hechong: ['hechong','合冲','刑害'],
    koujue: ['koujue','口诀','咒语']
  };
  for (let cat in map) {
    for (let i = 0; i < map[cat].length; i++) {
      if (k.indexOf(map[cat][i].toLowerCase()) >= 0) return cat;
    }
  }
  return 'other';
}

function searchKbEntries(query) {
  let entries = _collectKbEntries();
  let results = [];
  query = (query || '').trim().toLowerCase();
  
  for (let i = 0; i < entries.length; i++) {
    let e = entries[i];
    // 分类过滤
    if (_kbCurrentCategory !== 'all' && e.category !== _kbCurrentCategory) continue;
    // 关键词过滤
    if (query) {
      let title = (e.title || '').toLowerCase();
      let intro = (e.intro || '').toLowerCase();
      let key = (e.key || '').toLowerCase();
      if (title.indexOf(query) < 0 && intro.indexOf(query) < 0 && key.indexOf(query) < 0) continue;
    }
    results.push(e);
  }
  
  // 排序
  let sortVal = document.getElementById('kbSortSelect') ? document.getElementById('kbSortSelect').value : 'relevance';
  if (sortVal === 'category') {
    results.sort(function(a, b) { return a.category.localeCompare(b.category); });
  } else if (sortVal === 'alpha') {
    results.sort(function(a, b) { return a.title.localeCompare(b.title); });
  }
  
  renderKbResults(results, entries.length);
}

function renderKbResults(results, total) {
  let container = document.getElementById('kbResults');
  let stats = document.getElementById('kbStats');
  if (stats) {
    stats.textContent = '共 ' + total + ' 条知识 · 匹配 ' + results.length + ' 条';
  }
  
  if (results.length === 0) {
    container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-dim);">未找到匹配的知识，试试其他关键词</div>';
    return;
  }
  
  let html = '';
  let catColors = {
    bazi: '#c0392b', liuyao: '#2980b9', fengshui: '#27ae60', ziwei: '#8e44ad',
    qimen: '#d35400', meihua: '#16a085', liuren: '#2c3e50', xingming: '#e67e22',
    tizhi: '#e74c3c', zhouyi: '#34495e', bagua: '#7f8c8d', wuxing: '#f39c12',
    shishen: '#1abc9c', nayin: '#9b59b6', shensha: '#c0392b', hechong: '#3498db',
    koujue: '#e74c3c', other: '#95a5a6'
  };
  
  results.forEach(function(e) {
    let color = catColors[e.category] || '#95a5a6';
    let catLabel = _kbCatLabel(e.category);
    let title = e.title || e.key;
    let intro = (e.intro || '').substring(0, 120);
    if (intro.length === 120) intro += '...';
    
    html += '<div class="kb-result-card" onclick="showKbDetail(\'' + e.key.replace(/'/g, '\\') + '\')" ' +
      'style="background:rgba(0,0,0,0.3);border:1px solid var(--gold-dim);border-radius:6px;padding:14px;cursor:pointer;transition:all 0.2s;" ' +
      'onmouseover="this.style.borderColor=\'' + color + '\';this.style.transform=\'translateY(-2px)\'" ' +
      'onmouseout="this.style.borderColor=\'var(--gold-dim)\';this.style.transform=\'none\'">' +
      '<div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:6px;">' +
      '<span style="font-size:14px;color:var(--gold);font-weight:600;">' + title + '</span>' +
      '<span style="font-size:11px;padding:2px 8px;border-radius:10px;background:' + color + '33;color:' + color + ';">' + catLabel + '</span>' +
      '</div>' +
      '<div style="font-size:12px;color:var(--text-dim);line-height:1.5;">' + intro + '</div>' +
      '<div style="font-size:11px;color:var(--text-dim);margin-top:6px;">来源: ' + e.source + '</div>' +
      '</div>';
  });
  container.innerHTML = html;
}

function _kbCatLabel(cat) {
  let labels = {
    bazi: '八字', liuyao: '六爻', fengshui: '风水', ziwei: '紫微',
    qimen: '奇门', meihua: '梅花', liuren: '六壬', xingming: '姓名学',
    tizhi: '体质', zhouyi: '周易', bagua: '八卦', wuxing: '五行',
    shishen: '十神', nayin: '纳音', shensha: '神煞', hechong: '合冲刑害',
    koujue: '口诀', other: '其他'
  };
  return labels[cat] || cat;
}

function showKbDetail(key) {
  let entries = _collectKbEntries();
  let entry = null;
  for (let i = 0; i < entries.length; i++) {
    if (entries[i].key === key) { entry = entries[i]; break; }
  }
  if (!entry) return;
  
  let modal = document.getElementById('kbDetailModal');
  let content = document.getElementById('kbDetailContent');
  let catLabel = _kbCatLabel(entry.category);
  
  content.innerHTML = 
    '<div style="margin-bottom:12px;">' +
    '<span style="font-size:11px;padding:2px 8px;border-radius:10px;background:rgba(201,152,38,0.2);color:var(--gold);">' + catLabel + '</span>' +
    '</div>' +
    '<h3 style="color:var(--gold);margin-bottom:12px;font-size:20px;">' + (entry.title || entry.key) + '</h3>' +
    '<div style="font-size:14px;color:var(--text-light);line-height:1.8;white-space:pre-wrap;">' + (entry.overview || entry.intro || '暂无详细内容') + '</div>' +
    '<div style="margin-top:16px;padding-top:12px;border-top:1px solid var(--gold-dim);font-size:12px;color:var(--text-dim);">来源: ' + entry.source + ' · 索引: ' + entry.key + '</div>';
  
  modal.style.display = 'flex';
}

function closeKbDetail() {
  document.getElementById('kbDetailModal').style.display = 'none';
}

// 初始化知识库检索
function initKbSearch() {
  // 预加载所有条目
  _collectKbEntries();
  // 显示全部
  searchKbEntries('');
}

// 页面加载后初始化
if (document.readyState === 'complete') {
  setTimeout(initKbSearch, 500);
} else {
  window.addEventListener('load', function() { setTimeout(initKbSearch, 500); });
}


// ═══ calc-engine-lib 函数全局暴露 ═══
try { window.qimenPaiPan = qimenPaiPan; } catch(e){}
try { window.qimenAnalyze = qimenAnalyze; } catch(e){}
try { window.runLiuyaoEngine = runLiuyaoEngine; } catch(e){}
try { window.runMeihuaEngine = runMeihuaEngine; } catch(e){}
try { window.runQimenEngine = runQimenEngine; } catch(e){}
try { window.runLiurenEngine = runLiurenEngine; } catch(e){}
try { window.runZiweiEngine = runZiweiEngine; } catch(e){}
try { window.runXingmingEngine = runXingmingEngine; } catch(e){}
try { window.runFengshuiEngine = runFengshuiEngine; } catch(e){}
try { window.runZeriEngine = runZeriEngine; } catch(e){}
//console.log('[引擎] calc-engine-lib函数全局暴露完成');
