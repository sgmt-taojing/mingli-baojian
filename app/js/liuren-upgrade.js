// ═══ 大六壬排盘入口 ═══
function computeLiuRen() {
 try {
  playDivinationSound();
  let name = document.getElementById('lrName').value || '有缘人';
  let dateStr = document.getElementById('lrDate').value;
  let hourVal = document.getElementById('lrHour').value;
  if (!dateStr || !hourVal) { showToast('请输入日期和时辰'); return; }

  let parts = dateStr.split('-').map(Number);
  let year = parts[0], month = parts[1], day = parts[2];
  let hourNum = parseInt(hourVal);

  // 计算基础数据
  let dayStemIdx = getDayStemIndex(year, month, day);
  let dayBranchIdx = getDayBranchIndex(year, month, day);
  let dayStem = STEMS[dayStemIdx];
  let dayBranch = BRANCHES[dayBranchIdx];
  let hourBranchIdx = Math.floor(hourNum / 2) % 12;
  let hourBranch = BRANCHES[hourBranchIdx];
  
  // 月将（中气后以当月月将为准）
  let yueJiangIdx = (month + 1) % 12;
  let yueJiang = BRANCHES[yueJiangIdx];

  // 构建完整的课式数据
  let keShi = buildLiuRenKeShi(dayStemIdx, dayBranchIdx, hourBranchIdx, month);
  
  // 生成专业解读
  let interpretation = buildLiuRenProfessionalInterpretation(keShi, name, year, month, day, hourBranch, yueJiang);

  // 渲染UI
  document.getElementById('lrMeta').textContent = '大六壬 · ' + name + ' · ' + year + '年' + month + '月' + day + '日 ' + hourBranch + '时';
  document.getElementById('lrSub').textContent = '日干' + dayStem + ' · 日支' + dayBranch + ' · 月将' + yueJiang + ' · ' + interpretation.tiGuan.name + '课';

  let ctr = document.getElementById('lrInterp');
  ctr.innerHTML = '';

  // 渲染七个专业板块
  let sections = [
    {title:'🔮 课体总断', body: interpretation.keTiPan, accent:'orange'},
    {title:'📜 四课分析', body: interpretation.siKePan, accent:'gold-accent'},
    {title:'🔄 三传详解', body: interpretation.sanChuanPan, accent:'violet-accent'},
    {title:'👥 天将分布', body: interpretation.tianJiangPan, accent:'cyan-accent'},
    {title:'⭐ 神煞影响', body: interpretation.shenShaPan, accent:'jade-accent'},
    {title:'💡 大白话结论', body: interpretation.baihuaJielun, accent:'cinn-accent'},
    {title:'📅 流年推演', body: interpretation.liunianTuiyan, accent:'gold-accent'}
  ];

  for (let i = 0; i < sections.length; i++) {
    let s = sections[i];
    let block = document.createElement('div');
    block.className = 'interp-block';
    block.innerHTML = '<div class="interp-block-header" style="color:var(--' + s.accent + ')">' + s.title + '</div>'
      + '<div class="interp-block-body" style="font-size:14px;line-height:2;white-space:pre-wrap">' + s.body + '</div>';
    ctr.appendChild(block);
  }

  // 保留原有的六壬断语卡片
  let lrReadBox = document.getElementById('lrReadingBox');
  if (lrReadBox) lrReadBox.innerHTML = getLiurenReadingHTML(dayStem);

  document.getElementById('lrResult').classList.add('visible');
  document.getElementById('lrResult').scrollIntoView({ behavior: 'smooth' });
 } catch(e) {
  console.error('[大六壬排盘错误]', e.message, e.stack);
  let _r = document.getElementById('lrResult');
  if(_r) {
    _r.innerHTML = '<div style="padding:20px;margin:16px 0;background:rgba(231,76,60,.08);border:1px solid rgba(231,76,60,.2);border-radius:8px"><h5 style="color:#e74c3c">❌ 大六壬排盘出错</h5><p style="font-size:13px;opacity:.8;margin-top:8px">' + e.message + '</p><p style="font-size:11px;opacity:.5;margin-top:4px">' + (e.stack||'').split("\n").slice(0,3).join("<br>") + '</p></div>';
    _r.classList.add('visible');
    _r.scrollIntoView({behavior:'smooth'});
  }
  showToast('大六壬排盘出错: ' + e.message);
 }
}

// ═══ 构建完整六壬课式 ═══
function buildLiuRenKeShi(dayStemIdx, dayBranchIdx, hourBranchIdx, month) {
  let dayStem = STEMS[dayStemIdx];
  let dayBranch = BRANCHES[dayBranchIdx];
  let hourBranch = BRANCHES[hourBranchIdx];

  let siKe = _buildSiKe(dayStemIdx, dayBranchIdx, hourBranchIdx);
  let sanChuan = _buildSanChuan(siKe, dayStemIdx, dayBranchIdx);
  let tianJiangFenbu = _buildTianJiangFenbu(dayStemIdx, hourBranchIdx);
  let shenSha = _buildLiuRenShenSha(dayStemIdx, dayBranchIdx, month);
  let tiGuan = _buildLiuRenTiGuan(sanChuan, siKe, dayStemIdx, dayBranchIdx);
  let chuanKe = _getSanChuanShengKe(sanChuan);
  let chuanTianJiang = _getChuanTianJiang(tianJiangFenbu, sanChuan);

  return {
    dayStem: dayStem, dayStemIdx: dayStemIdx,
    dayBranch: dayBranch, dayBranchIdx: dayBranchIdx,
    hourBranch: hourBranch, hourBranchIdx: hourBranchIdx,
    month: month,
    siKe: siKe,
    sanChuan: sanChuan,
    tianJiangFenbu: tianJiangFenbu,
    shenSha: shenSha,
    tiGuan: tiGuan,
    chuanKe: chuanKe,
    chuanTianJiang: chuanTianJiang
  };
}

// 四课构建
function _buildSiKe(dayStemIdx, dayBranchIdx, hourBranchIdx) {
  let dayStem = STEMS[dayStemIdx];
  let dayBranch = BRANCHES[dayBranchIdx];
  let ganJiGong = _ganJiGong(dayStem);
  let tianPanBase = hourBranchIdx;
  
  let ke1 = ganJiGong;
  let ke2 = BRANCHES[(BRANCHES.indexOf(ke1) + 1) % 12];
  let ke3 = dayBranch;
  let ke4 = BRANCHES[(dayBranchIdx + 1) % 12];

  return {
    ke1: ke1, ke1Gan: (LR_ZHI_GAN[ke1]?.gan || dayStem).charAt(0),
    ke2: ke2, ke2Gan: (LR_ZHI_GAN[ke2]?.gan || dayStem).charAt(0),
    ke3: ke3, ke3Gan: (LR_ZHI_GAN[ke3]?.gan || dayStem).charAt(0),
    ke4: ke4, ke4Gan: (LR_ZHI_GAN[ke4]?.gan || dayStem).charAt(0)
  };
}

// 日干寄宫
function _ganJiGong(stem) {
  const map = {甲:'寅',乙:'辰',丙:'巳',丁:'未',戊:'巳',己:'未',庚:'申',辛:'戌',壬:'亥',癸:'丑'};
  return map[stem] || '寅';
}

// 三传构建（基于四课贼克）
function _buildSanChuan(siKe, dayStemIdx, dayBranchIdx) {
  let dayStem = STEMS[dayStemIdx];
  let kes = [
    {zhi: siKe.ke1, shang: siKe.ke1Gan},
    {zhi: siKe.ke2, shang: siKe.ke2Gan},
    {zhi: siKe.ke3, shang: siKe.ke3Gan},
    {zhi: siKe.ke4, shang: siKe.ke4Gan}
  ];

  const zeKe = [], keZe = [];
  for (let i = 0; i < kes.length; i++) {
    let shangWx = _getGanWx(kes[i].shang);
    let zhiWx = LR_ZHI_WX[kes[i].zhi];
    if (_wxKe(zhiWx, shangWx)) zeKe.push({zhi:kes[i].zhi, shang:kes[i].shang, idx:i, type:'下克上(贼)'});
    if (_wxKe(shangWx, zhiWx)) keZe.push({zhi:kes[i].zhi, shang:kes[i].shang, idx:i, type:'上克下(克)'});
  }

  let faYong, faType;
  let candidates = zeKe.length > 0 ? zeKe : keZe;
  
  if (candidates.length === 0) {
    faYong = _ganJiGong(STEMS[dayStemIdx]);
    faType = '无贼无克';
  } else if (candidates.length === 1) {
    faYong = candidates[0].zhi;
    faType = candidates[0].type;
  } else {
    faYong = candidates[0].zhi;
    faType = candidates[0].type + '(多课)';
  }

  let faIdx = BRANCHES.indexOf(faYong);
  let zhongIdx = (faIdx + 4) % 12;
  let moIdx = (faIdx + 8) % 12;
  
  return {
    faYong: faYong, faIdx: faIdx, faType: faType,
    zhongChuan: BRANCHES[zhongIdx], zhongIdx: zhongIdx,
    moChuan: BRANCHES[moIdx], moIdx: moIdx
  };
}

function _getGanWx(gan) {
  const wx = {甲:'木',乙:'木',丙:'火',丁:'火',戊:'土',己:'土',庚:'金',辛:'金',壬:'水',癸:'水'};
  return wx[gan] || '土';
}

function _wxKe(a, b) { return LR_WX_KE[a] === b; }
function _wxSheng(a, b) { return LR_WX_SHENG[a] === b; }

// 天将分布（基于贵人诀）
function _buildTianJiangFenbu(dayStemIdx, hourBranchIdx) {
  let guirenZhi = LR_GUIREN_DAY[dayStemIdx];
  let guirenIdx = BRANCHES.indexOf(guirenZhi);
  let shunPai = (guirenIdx >= 4 && guirenIdx <= 9);
  
  const fenbu = {};
  for (let i = 0; i < 12; i++) {
    let zhi = BRANCHES[i];
    let offset;
    if (shunPai) {
      offset = (i - guirenIdx + 12) % 12;
    } else {
      offset = (guirenIdx - i + 12) % 12;
    }
    let godKey = LR_TIANG_ORDER[offset % 12];
    fenbu[zhi] = {
      key: godKey,
      name: LR_TIANJIANG[godKey] ? LR_TIANJIANG[godKey].name : godKey,
      nature: LR_TIANJIANG[godKey] ? LR_TIANJIANG[godKey].nature : '平',
      desc: LR_TIANJIANG[godKey] ? LR_TIANJIANG[godKey].desc : ''
    };
  }
  return { fenbu: fenbu, guirenZhi: guirenZhi, shunPai: shunPai };
}

// 大六壬神煞收集
function _buildLiuRenShenSha(dayStemIdx, dayBranchIdx, month) {
  let dayBranch = BRANCHES[dayBranchIdx];
  let dayStem = STEMS[dayStemIdx];
  const result = [];

  const zhiSha = ['yima','taohua','huagai','jiangxing','wangshen','jiesha','zaisha'];
  for (let i = 0; i < zhiSha.length; i++) {
    let ts = _lrshen(zhiSha[i], dayBranch);
    if (ts) {
      let info = LR_SHENSHA[zhiSha[i]];
      result.push({name: info.name, nature: info.nature, desc: info.desc, zhi: ts});
    }
  }

  let tiandeZhi = _getTianDe(month);
  if (tiandeZhi) {
    result.push({name:'天德', nature:'大吉', desc:'福德之星，逢凶化吉，贵人相助', zhi: tiandeZhi});
  }

  let yuedeZhi = _getYueDe(month);
  if (yuedeZhi) {
    result.push({name:'月德', nature:'大吉', desc:'月德临照，万事顺利。月内行事皆利，大事可成。', zhi: yuedeZhi});
  }

  let tianxiZhi = _getTianXi(month);
  if (tianxiZhi) {
    result.push({name:'天喜', nature:'吉', desc:'喜庆之星在课，主有喜事临门，婚姻可成。', zhi: tianxiZhi});
  }

  let tianyiZhi = _getTianYi(month);
  if (tianyiZhi) {
    result.push({name:'天医', nature:'吉', desc:'医药之星，得病可愈，有良医相助。', zhi: tianyiZhi});
  }

  let wenchangZhi = _getWenChang(dayStemIdx);
  if (wenchangZhi) {
    result.push({name:'文昌贵人', nature:'吉', desc:'文星闪耀，利考试升学、文书事宜。', zhi: wenchangZhi});
  }

  return result;
}

function _getTianDe(month) {
  const map = {1:'亥',2:'申',3:'亥',4:'戌',5:'亥',6:'寅',7:'丑',8:'寅',9:'巳',10:'辰',11:'巳',12:'申'};
  return map[month] || null;
}
function _getYueDe(month) {
  const map = {1:'巳',2:'寅',3:'亥',4:'申',5:'巳',6:'寅',7:'亥',8:'申',9:'巳',10:'寅',11:'亥',12:'申'};
  return map[month] || null;
}
function _getTianXi(month) {
  const map = {1:'戌',2:'亥',3:'子',4:'丑',5:'寅',6:'卯',7:'辰',8:'巳',9:'午',10:'未',11:'申',12:'酉'};
  return map[month] || null;
}
function _getTianYi(month) {
  const map = {1:'辰',2:'巳',3:'午',4:'未',5:'申',6:'酉',7:'戌',8:'亥',9:'子',10:'丑',11:'寅',12:'卯'};
  return map[month] || null;
}
function _getWenChang(stemIdx) {
  const map = {0:'巳',1:'午',2:'申',3:'酉',4:'申',5:'酉',6:'亥',7:'子',8:'寅',9:'卯'};
  return map[stemIdx] || null;
}

// 三传生克关系
function _getSanChuanShengKe(sanChuan) {
  let faWx = LR_ZHI_WX[sanChuan.faYong];
  let zhongWx = LR_ZHI_WX[sanChuan.zhongChuan];
  let moWx = LR_ZHI_WX[sanChuan.moChuan];
  
  const relations = [];
  
  if (_wxSheng(faWx, zhongWx)) relations.push('初传生中传→事有推动力，进展顺利');
  else if (_wxSheng(zhongWx, faWx)) relations.push('中传生初传→事有回护之力，后续助力');
  else if (_wxKe(faWx, zhongWx)) relations.push('初传克中传→中途遇阻，需克服困难');
  else if (_wxKe(zhongWx, faWx)) relations.push('中传克初传→发端受阻，开端不顺');
  else relations.push('初中比和→平稳推进，无起伏');
  
  if (_wxSheng(zhongWx, moWx)) relations.push('中传生末传→传至末传得助，结局向好');
  else if (_wxSheng(moWx, zhongWx)) relations.push('末传生中传→结果有回环之力');
  else if (_wxKe(zhongWx, moWx)) relations.push('中传克末传→传至末传受制，结局有阻');
  else if (_wxKe(moWx, zhongWx)) relations.push('末传克中传→末传改变中期态势');
  else relations.push('中末比和→结局平稳');
  
  if (_wxSheng(faWx, moWx)) relations.push('初传生末传→从头到尾顺利推进，大吉');
  else if (_wxSheng(moWx, faWx)) relations.push('末传生初传→循环往复之象，事情可能反复');
  else if (_wxKe(faWx, moWx)) relations.push('初传克末传→发端即克结局，事虽起难善终');
  else if (_wxKe(moWx, faWx)) relations.push('末传克初传→结局推翻起因，结果与初衷相反');
  
  return relations;
}

// 天将在三传上的位置
function _getChuanTianJiang(tianJiangFenbu, sanChuan) {
  return {
    fa: tianJiangFenbu.fenbu[sanChuan.faYong],
    zhong: tianJiangFenbu.fenbu[sanChuan.zhongChuan],
    mo: tianJiangFenbu.fenbu[sanChuan.moChuan]
  };
}

// ═══ 课体判定 ═══
function _buildLiuRenTiGuan(sanChuan, siKe, dayStemIdx, dayBranchIdx) {
  let faIdx = sanChuan.faIdx;
  let zhongIdx = sanChuan.zhongIdx;
  let moIdx = sanChuan.moIdx;
  let dayBranchIdxLocal = dayBranchIdx;
  let dayStem = STEMS[dayStemIdx];
  
  let isFuYin = (faIdx === zhongIdx && zhongIdx === moIdx);
  let isFanYin = (Math.abs(faIdx - moIdx) === 6 && Math.abs(faIdx - zhongIdx) === 6);
  
  if (isFuYin) {
    return {
      name: '伏吟', jiXiong: '中平',
      desc: '伏吟课——天地不动，万物皆静。此课主诸事停滞不前，宜守不宜攻，宜静不宜动。',
      advice: '当前不宜做重大改变。保守为主，适合内部整顿、学习充电。时机未到，急于求成反受其害。',
      detail: '《大六壬大全》云:「伏吟者，天地盘同位，如人伏地，不能行动之象。」'
    };
  }
  
  if (isFanYin) {
    return {
      name: '反吟', jiXiong: '凶',
      desc: '反吟课——天地对冲，变动不居。此课主反复无常，好事多磨，事情来回折腾。',
      advice: '事情多有波折反复，需灵活应对。若出行则去而复返，若办事则一波三折。',
      detail: '《六壬指南》曰:「反吟者，天地对冲，如人转身回顾之象。」'
    };
  }
  
  if (sanChuan.faType && sanChuan.faType.indexOf('多课') >= 0) {
    return {
      name: '知一', jiXiong: '小吉',
      desc: '知一课——两课相争，择一而定。事有多条路径，需要明智选择。',
      advice: '眼前有多个选择，建议选择最熟悉的那条路。不要贪多求全，专一而行反而容易成功。',
      detail: '知一课主选择明确，忌贪多务得。宜择善固执，一以贯之。'
    };
  }
  
  let idxDiff = (moIdx - faIdx + 12) % 12;
  if (idxDiff === 1 || idxDiff === 11) {
    return {
      name: '连茹', jiXiong: '吉',
      desc: '连茹课——三传相连如茹草，一气呵成。为六壬中最顺遂之课体之一。',
      advice: '事情会顺理成章地推进，每个阶段都紧密衔接。把握好开头，后面自然水到渠成。',
      detail: '连茹课三传如连珠，事有头绪，发展顺畅。'
    };
  }
  
  if (idxDiff === 2 || idxDiff === 10) {
    return {
      name: '间传', jiXiong: '中平',
      desc: '间传课——三传间隔一位而传。主事情发展有间隙，需跨越一些步骤。',
      advice: '事情不会按部就班，可能跳过某些环节直接进入下一阶段。灵活应对即可。',
      detail: '间传课主事情发展不连续，但能跃过障碍。宜顺势而为。'
    };
  }

  if (sanChuan.faType === '无贼无克') {
    return {
      name: '昴星', jiXiong: '凶',
      desc: '昴星课——四课无贼无克，用昴星法取初传。主事有惊恐，暗中有变数。',
      advice: '表面平静实则暗流涌动。做事要多个心眼，防止被人暗算。大事不宜，小事尚可。',
      detail: '《大六壬大全》:昴星者，无贼无克，望西昴星而取之。主惊恐不定。'
    };
  }
  
  let isYuanShou = (sanChuan.faType && sanChuan.faType.indexOf('上克下') >= 0);
  if (isYuanShou && sanChuan.faType.indexOf('多课') < 0) {
    return {
      name: '元首', jiXiong: '大吉',
      desc: '元首课——上克下发用，为六壬第一吉课。如君主临朝，令行禁止。万事亨通。',
      advice: '此为六壬中最吉利课体。大胆行动，积极进取。事业上利求官求名。',
      detail: '《大六壬大全》以元首课为第一课体:元首者，万事之始也。'
    };
  }
  
  let isChongShen = (sanChuan.faType && sanChuan.faType.indexOf('下克上') >= 0);
  if (isChongShen && sanChuan.faType.indexOf('多课') < 0) {
    return {
      name: '重审', jiXiong: '吉',
      desc: '重审课——下克上发用，以下制上之象。主事情需要再三审查确认。',
      advice: '建议三思而行，反复确认细节。此课利于民间事务、申诉复议。',
      detail: '重审课虽以下克上，但以正御邪，故能有成。宜谨慎行事，步步为营。'
    };
  }

  return {
    name: '别责', jiXiong: '中平',
    desc: '别责课——无贼无克，取日干五合之神为用。主事需借助外力、另寻出路。',
    advice: '单打独斗难成事，需要借助外力或合作。找对人、找对方向比努力更重要。',
    detail: '别责者，别求他方也。事有转机在于外求。'
  };
}
// ═══ END LIUREN ENGINE CORE ═══
