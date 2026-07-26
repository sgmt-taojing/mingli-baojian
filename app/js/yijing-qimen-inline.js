
// =====================================================================
//  QIMEN DUNJIA CORE ENGINE
// =====================================================================

// Heavenly Stems (天干)
const STEMS = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];

// Earthly Branches (地支)
const BRANCHES = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];

// Nine Stars (九星)
const STARS = {
  pei:  {name:'天蓬', symbol:'蓬', nature:'大凶',desc:'破财之星，主盗贼劫掠',type:'凶'},
  yin:  {name:'天芮', symbol:'芮', nature:'大凶',desc:'病符之星，主疾病灾祸',type:'凶'},
  chu:  {name:'天冲', symbol:'冲', nature:'次凶',desc:'冲击之星，主动荡不安',type:'凶'},
  fang: {name:'天辅', symbol:'辅', nature:'大吉',desc:'文曲之星，主学业功名',type:'吉'},
  jin:  {name:'天禽', symbol:'禽', nature:'大吉',desc:'中宫吉星，主诸事大顺',type:'吉'},
  zhen: {name:'天心', symbol:'心', nature:'大吉',desc:'领导之星，主领导管理',type:'吉'},
  rong: {name:'天柱', symbol:'柱', nature:'次凶',desc:'破坏之星，主破败损伤',type:'凶'},
  ying: {name:'天任', symbol:'任', nature:'次吉',desc:'生门之星，主财富积累',type:'平'},
  you:  {name:'天英', symbol:'英', nature:'小凶',desc:'桃花之星，主口舌是非',type:'凶'},
};

// Eight Doors (八门)
const DOORS = {
  sheng: {name:'生门', nature:'大吉',desc:'生机勃勃，利于求财创业',color:'green'},
  jing:  {name:'景门', nature:'小吉',desc:'光明通达，利于文书信息',color:'yellow'},
  shang: {name:'伤门', nature:'大凶',desc:'伤害破坏，利于讨债索命',color:'orange'},
  du:    {name:'杜门', nature:'小凶',desc:'阻塞隐藏，利于保密躲藏',color:'gray'},
  si:    {name:'死门', nature:'大凶',desc:'死气沉沉，利于丧葬吊孝',color:'darkgray'},
  xin:   {name:'休门', nature:'大吉',desc:'休养生息，利于休整人际',color:'red'},
  kai:   {name:'开门', nature:'大吉',desc:'开创新局，利于事业升迁',color:'blue'},
  cun:   {name:'存储', nature:'平',desc:'蓄积储备，利于长远规划',color:'teal'},
};

// Eight Gods (八神)
const GODS = {
  zhi: {name:'值符', symbol:'符', nature:'大吉',desc:'贵人之神，领兵统将',color:'blue'},
  nu:  {name:'螣蛇', symbol:'蛇', nature:'次凶',desc:'惊恐之神，主惊恐怪异',color:'violet'},
  yin: {name:'白虎', symbol:'虎', nature:'大凶',desc:'凶煞之神，主伤灾疾病',color:'red'},
  xuan:{name:'玄武', symbol:'玄', nature:'次凶',desc:'暗昧之神，主阴谋贼盗',color:'gray'},
  di:  {name:'勾陈', symbol:'陈', nature:'次凶',desc:'牵绊之神，主纠纷牵连',color:'orange'},
  tian:{name:'青龙', symbol:'龙', nature:'大吉',desc:'祥瑞之神，主喜庆吉祥',color:'gold'},
  hei: {name:'九地', symbol:'地', nature:'次吉',desc:'柔顺之神，主静守保存',color:'brown'},
  yue: {name:'九天', symbol:'天', nature:'大吉',desc:'刚健之神，主行动拓展',color:'white'},
};

// Nine Palaces (九宫)
const PALACES = {
  1: {name:'坎一宫', element:'水', direction:'正北', trigram:'☵', num:'一', stem:'壬', branch:'子', attr:'凶门'},
  2: {name:'坤二宫', element:'土', direction:'西南', trigram:'☷', num:'二', stem:'癸', branch:'未', attr:'凶门'},
  3: {name:'震三宫', element:'木', direction:'正东', trigram:'☳', num:'三', stem:'甲', branch:'卯', attr:'吉门'},
  4: {name:'巽四宫', element:'木', direction:'东南', trigram:'☴', num:'四', stem:'乙', branch:'辰', attr:'吉门'},
  5: {name:'中五宫', element:'土', direction:'中', trigram:'＋', num:'五', stem:'戊', branch:'中', attr:'吉门'},
  6: {name:'乾六宫', element:'金', direction:'西北', trigram:'☰', num:'六', stem:'己', branch:'戌', attr:'吉门'},
  7: {name:'兑七宫', element:'金', direction:'正西', trigram:'☱', num:'七', stem:'庚', branch:'酉', attr:'凶门'},
  8: {name:'艮八宫', element:'土', direction:'东北', trigram:'☶', num:'八', stem:'丙', branch:'丑', attr:'吉门'},
  9: {name:'离九宫', element:'火', direction:'正南', trigram:'☲', num:'九', stem:'丁', branch:'午', attr:'凶门'},
};

// Eight Gates (complete)
const DOORS_FULL = {
  sheng: {name:'生门', nature:'大吉',desc:'利于求财、创业、置产、谈判',color:'var(--jade)',stem:'乙'},
  jing:  {name:'景门', nature:'小吉',desc:'利于文书、告白、信息传递',color:'var(--warn)',stem:'丙'},
  shang: {name:'伤门', nature:'大凶',desc:'利于讨债、索命、博弈',color:'var(--orange)',stem:'丁'},
  du:    {name:'杜门', nature:'小凶',desc:'利于保密、躲藏、截路',color:'var(--steel)',stem:'庚'},
  si:    {name:'死门', nature:'大凶',desc:'利于丧事、捕猎、镇压',color:'var(--metal)',stem:'辛'},
  xin:   {name:'休门', nature:'大吉',desc:'利于休养、访友、人际',color:'var(--cinn)',stem:'壬'},
  kai:   {name:'开门', nature:'大吉',desc:'利于事业、升迁、远行',color:'var(--cyan)',stem:'癸'},
  cun:   {name:'杜门', nature:'小凶',desc:'利于藏匿、伏兵、陷阱',color:'var(--steel)',stem:'戊'},
};

// Door rotation order
const DOOR_ORDER = ['休','生','伤','杜','景','死','惊','开'];

// Star rotation order
const STAR_ORDER = ['任','冲','辅','英','禽','心','柱','蓬','芮'];

// God rotation order
const GOD_ORDER = ['符','龙','冲','辅','英','芮','柱','心','蓬'];

// Qimen palace order for yang/yin dun
const YANG_DUN = [1,2,3,4,5,6,7,8,9]; // yang: clockwise
const YIN_DUN  = [9,8,7,6,5,4,3,2,1]; // yin: counter-clockwise

// Door positions by palace (base)
const DOOR_POS = {
  1:['休','开','生'], // Kan
  2:['死','惊','杜'], // Kun
  3:['伤','杜','景'], // Zhen
  4:['杜','景','死'], // Xun
  5:['生','伤','惊'], // Zhong (neutral, special)
  6:['开','休','生'], // Qian
  7:['惊','开','休'], // Dui
  8:['生','伤','杜'], // Gen
  9:['景','死','惊'], // Li
};

// Key palace for each stem (甲 1, 乙 2...)
const STEM_KEY_PALACE = {1:1, 2:2, 3:3, 4:4, 5:5, 6:6, 7:7, 8:8, 9:9, 0:5}; // 0=己

// Branch hour mappings
const BRANCH_HOUR = {23:'子',1:'丑',3:'寅',5:'卯',7:'辰',9:'巳',11:'午',13:'未',15:'申',17:'酉',19:'戌',21:'亥'};

// Branch palace mappings (子1丑8寅3卯4辰4巳9午9未2申6酉7戌6亥1)
const BRANCH_PALACE = {
  '子':1, '丑':8, '寅':3, '卯':4, '辰':4, '巳':9, '午':9,
  '未':2, '申':6, '酉':7, '戌':6, '亥':1
};

// ============================================================
// QIMEN CALCULATOR
// ============================================================

function computeQimenData(year, month, day, hourNum) {
  // Derive Liuren day (cycle of 9)
  // Simplified: use zodiac day number mod 9 + 1
  // Use solar terms to determine position

  // Liuren calculation (days since winter solstice offset)
  // Simplified: use Julian day concept with Chinese cyclical system
  const jd = Date.UTC(year, month - 1, day) / 86400000;
  const liurenBase = ((Math.floor(jd) + 2440587 - 2451545) % 9 + 9) % 9;

  // Derive stem index for the day
  const stemIdx = ((Math.floor(jd) - 4) % 10 + 10) % 10;

  // Derive branch
  const branchIdx = ((Math.floor(jd) - 6) % 12 + 12) % 12;
  const dayBranch = BRANCHES[branchIdx];

  // Hour branch
  const hourKeys = Object.keys(BRANCH_HOUR).map(Number).sort((a,b)=>a-b);
  let hourBranch = '子';
  for (let i = hourKeys.length-1; i >= 0; i--) {
    if (hourNum >= hourKeys[i]) { hourBranch = BRANCH_HOUR[hourKeys[i]]; break; }
  }
  const hourIdx = BRANCHES.indexOf(hourBranch);

  // Yin/Yang Dun
  // 夏至(约180天)前阳遁，之后阴遁
  const isYang = month >= 11 || month <= 4; // Simplified: winter half year = yang
  const dun = isYang ? YANG_DUN : YIN_DUN;

  // Determine starting palace based on day+hour stem
  const keyStemIdx = stemIdx;
  const keyPalace = STEM_KEY_PALACE[keyStemIdx];

  // Derive key palace based on hour
  // 子上起甲，逆布六仪，顺布三奇
  // Simplified: key palace shifts based on hour
  const hourShift = hourIdx;
  const startPalace = ((keyPalace - 1 + hourShift) % 9) + 1;

  // Is 阳遁 or 阴遁
  const isYangDun = isYang;

  // Build palace data
  const palaces = {};
  const rotatePalace = isYangDun ? YANG_DUN : YIN_DUN; // 1-9

  for (let i = 0; i < 9; i++) {
    const p宫 = rotatePalace[i]; // the actual palace number at position i
    palaces[p宫] = {
      position: i,
      num: p宫,
      name: PALACES[p宫].name,
      element: PALACES[p宫].element,
      direction: PALACES[p宫].direction,
      trigram: PALACES[p宫].trigram,
    };
  }

  // Distribute nine stars
  // 天蓬芮任冲辅英禽心柱 (in order 1-9 starting position varies)
  const starNames = ['蓬','芮','任','冲','辅','英','禽','心','柱'];
  const starStart = (startPalace - 1 + (isYangDun ? 0 : 8)) % 9; // start index
  for (let i = 0; i < 9; i++) {
    const p宫 = rotatePalace[i];
    const sIdx = (starStart + i) % 9;
    const sKey = starNames[sIdx].charAt(0);
    palaces[p宫].star = STARS['pei']; // will be mapped below
    palaces[p宫].starKey = sKey;
  }

  // Map star keys
  const starKeyMap = {'蓬':'pei','芮':'yin','任':'ying','冲':'chu','辅':'fang','英':'you','禽':'jin','心':'zhen','柱':'rong'};
  for (let p in palaces) {
    const key = palaces[p].starKey;
    palaces[p].star = STARS[starKeyMap[key]];
  }

  // Distribute eight doors (skip center)
  const doorNames = ['休','开','生','伤','杜','景','死','惊'];
  const doorStart = (startPalace - 1 + (isYangDun ? 0 : 8)) % 8;
  let doorPos = 0;
  for (let i = 0; i < 9; i++) {
    const p宫 = rotatePalace[i];
    if (p宫 === 5) continue; // skip center
    const dIdx = (doorStart + doorPos) % 8;
    const dKey = doorNames[dIdx];
    palaces[p宫].door = {name:dKey};
    doorPos++;
  }
  // Map door names to full door objects
  const doorKeyMap = {'休':'xin','开':'kai','生':'sheng','伤':'shang','杜':'du','景':'jing','死':'si','惊':'du'};
  for (let p in palaces) {
    if (palaces[p].door) {
      const dKey = doorKeyMap[palaces[p].door.name];
      palaces[p].door = DOORS_FULL[dKey];
    }
  }

  // Distribute eight gods
  const godNames = ['符','龙','冲','辅','英','芮','柱','心'];
  const godStart = (startPalace - 1 + (isYangDun ? 0 : 8)) % 8;
  let godPos = 0;
  for (let i = 0; i < 9; i++) {
    const p宫 = rotatePalace[i];
    if (p宫 === 5) continue;
    const gIdx = (godStart + godPos) % 8;
    const gKey = godNames[gIdx];
    const godKeyMap = {'符':'zhi','龙':'tian','冲':'chu','辅':'fang','英':'ying','芮':'yin','柱':'rong','心':'zhen'};
    palaces[p宫].god = GODS[godKeyMap[gKey]];
    godPos++;
  }

  // Set key palace (值使)
  const keyPalaceName = PALACES[keyPalace].name;
  // Find which door is at key palace
  const valueDoor = palaces[keyPalace]?.door?.name || '开';
  const valueDoorKey = doorKeyMap[valueDoor] || 'kai';
  palaces[keyPalace].isKey = true;

  // Determine the main star at center (禽星)
  palaces[5] = {
    position: 4, num:5, name:'中五宫', element:'土', direction:'中',
    trigram:'＋', star: STARS.jin, door: DOORS_FULL.jin,
    god: GODS.tian, isCenter: true
  };

  return {
    year, month, day, hourBranch,
    stemIdx, dayBranch,
    keyPalace, startPalace,
    isYangDun, dun,
    palaces,
    stemSymbol: STEMS[stemIdx],
    dayStem: STEMS[stemIdx],
    dayBranchSymbol: dayBranch,
    hourStem: STEMS[(stemIdx + hourIdx) % 10],
    jiuxing: palaces[keyPalace]?.star?.name || '天心',
    bamen: palaces[keyPalace]?.door?.name || '开门',
    bashen: palaces[keyPalace]?.god?.name || '值符',
    qimenType: isYang ? '阳遁' : '阴遁',
    liurenDay: (liurenBase + 1),
  };
}

// ============================================================
// RENDER QIMEN
// ============================================================

function renderQimen(qd) {
  // Title
  document.getElementById('qmResultMeta').textContent =
    `奇门遁甲 · ${qd.qimenType} · 农历${qd.year}年${qd.month}月${qd.day}日`;
  document.getElementById('qmResultTitle').textContent = '九宫遁甲盘';
  document.getElementById('qmResultSub').textContent =
    `日干${qd.dayStem}${qd.dayBranchSymbol} · 时支${qd.hourBranch} · ${qd.jiuxing}星临宫 · ${qd.bamen}为值使`;

  // Nine palace grid
  const grid = document.getElementById('ninePalaceGrid');
  grid.innerHTML = '';

  // Order: top-left(4), top(9), top-right(2), left(3), center(5), right(7), bottom-left(8), bottom(1), bottom-right(6)
  const cellOrder = [4, 9, 2, 3, 5, 7, 8, 1, 6];

  cellOrder.forEach((p宫, idx) => {
    const p = qd.palaces[p宫];
    const cell = document.createElement('div');
    cell.className = 'palace-cell' + (p宫 === 5 || p?.isCenter ? ' gong-center' : '');

    const starClass = getStarClass(p?.star?.symbol || '');
    const doorClass = getDoorClass(p?.door?.name || '');
    const godClass = getGodClass(p?.god?.symbol || '');
    const isKey = p?.isKey;
    const starColor = p?.star?.type === '吉' ? 'var(--jade)' : (p?.star?.type === '大吉' ? 'var(--success)' : 'var(--cinn2)');
    const doorColor = p?.door?.color || 'var(--metal)';
    const godColor = 'var(--warn)';

    const qiInfo = getPalaceAnalysis(p宫, p);

    cell.innerHTML = `
      <p class="palace-num">${p宫 === 5 ? '中宫' : PALACES[p宫]?.num + '宫'}</p>
      <p class="palace-star ${starClass}" style="color:${starColor}">${p?.star?.name || ''}</p>
      <p class="palace-door" style="color:${doorColor}">${p?.door?.name || ''}</p>
      <p class="palace-god ${godClass}" style="color:${godColor}">${p?.god?.name || ''}</p>
      <p class="palace-qi" style="font-size:10px;letter-spacing:1px;margin-top:4px;opacity:.4">${qiInfo.qi}</p>
      <p class="palace-hp" style="font-size:10px;opacity:.35;line-height:1.5;margin-top:4px">${qiInfo.analysis}</p>
    `;
    if (isKey) cell.style.boxShadow = 'inset 0 0 20px rgba(201,168,76,.15)';
    grid.appendChild(cell);
  });

  // Plate info
  const kp = qd.palaces[qd.keyPalace];
  document.getElementById('tianPanSymbol').textContent = qd.palaces[qd.keyPalace]?.trigram || '＋';
  document.getElementById('tianPanName').textContent = PALACES[qd.keyPalace]?.name || '中宫';
  document.getElementById('tianPanDesc').textContent = `${qd.jiuxing}·${qd.bamen}·${qd.bashen}会聚于${PALACES[qd.keyPalace]?.name}`;

  document.getElementById('renPanSymbol').textContent = kp?.door?.name || '开';
  document.getElementById('renPanName').textContent = kp?.door?.name + '门' || '开门';
  document.getElementById('renPanDesc').textContent = kp?.door?.desc || '值使之门';

  document.getElementById('shenPanSymbol').textContent = kp?.god?.symbol || '符';
  document.getElementById('shenPanName').textContent = kp?.god?.name || '值符';
  document.getElementById('shenPanDesc').textContent = kp?.god?.desc || '诸神之首';

  // Door star matrix
  const matrix = document.getElementById('doorStarMatrix');
  matrix.innerHTML = '';
  cellOrder.forEach((p宫, idx) => {
    const p = qd.palaces[p宫];
    const mcell = document.createElement('div');
    mcell.className = 'matrix-cell';
    const posLabel = p宫 === 5 ? '中' : `${p宫}`;
    const ds = getDoorStarAnalysis(p宫, p, qd);
    mcell.innerHTML = `
      <p class="mc-pos">${posLabel}宫</p>
      <span class="mc-star ${getStarClass(p?.star?.symbol||'')}">${p?.star?.name||''}</span>
      <span class="mc-door">${p?.door?.name||''}门</span>
      <p class="mc-analysis">${ds}</p>
    `;
    matrix.appendChild(mcell);
  });

  // Interpretation
  renderQimenInterp(qd);
}

function getPalaceAnalysis(p宫, p) {
  if (!p) return { qi:'—', analysis:'—' };

  const star = p.star;
  const door = p.door;
  const god = p.god;

  let qi = '';
  if (star?.type === '大吉') qi = '★ 大吉';
  else if (star?.type === '吉') qi = '☆ 吉';
  else if (star?.type === '凶') qi = '✗ 凶';
  else if (star?.type === '次凶') qi = '△ 次凶';

  let analysis = '';
  if (star && door) {
    const combo = `${star.name}+${door.name}门`;
    analysis = getComboAnalysis(p宫, star, door);
  } else if (star) {
    analysis = star.desc;
  } else if (door) {
    analysis = door.desc;
  }

  return { qi, analysis };
}

function getComboAnalysis(p宫, star, door) {
  const key = `${star.symbol || ''}-${door.name || ''}`;
  const combos = {
    '蓬-生': '天蓬+生门：破财中求财，先破后得',
    '蓬-开': '天蓬+开门：破财+事业，凶中有吉',
    '蓬-休': '天蓬+休门：破财+休养，破耗难免',
    '蓬-景': '天蓬+景门：破财+文书，凶',
    '蓬-杜': '天蓬+杜门：破财+隐蔽，不宜张扬',
    '蓬-伤': '天蓬+伤门：大凶，破财伤身',
    '蓬-死': '天蓬+死门：极凶，必破大财',
    '蓬-惊': '天蓬+惊门：惊恐不安，损耗',
    '芮-生': '天芮+生门：病符+生门，凶中有救',
    '芮-开': '天芮+开门：病符+事业，凶',
    '芮-伤': '天芮+伤门：大凶，伤病官非',
    '芮-死': '天芮+死门：极凶，病重难愈',
    '芮-杜': '天芮+杜门：病符+隐蔽，病情不明',
    '芮-景': '天芮+景门：病符+文书，病情诊断',
    '芮-惊': '天芮+惊门：病符+惊恐，精神不安',
    '芮-休': '天芮+休门：病符+休养，久病休养',
    '冲-生': '天冲+生门：冲动+求财，劳而有得',
    '冲-开': '天冲+开门：冲动+事业，变动起伏',
    '冲-伤': '天冲+伤门：冲动+伤害，是非必起',
    '冲-杜': '天冲+杜门：冲动+隐蔽，变动受阻',
    '冲-景': '天冲+景门：冲动+文书，是非口舌',
    '冲-死': '天冲+死门：冲动+死事，大凶',
    '冲-惊': '天冲+惊门：冲动+惊恐，官非口舌',
    '冲-休': '天冲+休门：冲动+休养，先动后静',
    '辅-生': '天辅+生门：大吉，学业功名',
    '辅-开': '天辅+开门：大吉，文曲高升',
    '辅-景': '天辅+景门：大吉，文采飞扬',
    '辅-杜': '天辅+杜门：次吉，学业受阻',
    '辅-伤': '天辅+伤门：吉凶参半，变动有因',
    '辅-死': '天辅+死门：次凶，文事不利',
    '辅-惊': '天辅+惊门：次吉，口舌不安',
    '辅-休': '天辅+休门：大吉，文曲入库',
    '禽-生': '天禽+生门：大吉，诸事顺遂',
    '禽-开': '天禽+开门：大吉，功成名就',
    '禽-景': '天禽+景门：大吉，文明盛世',
    '禽-杜': '天禽+杜门：吉中带阻',
    '禽-伤': '天禽+伤门：吉凶参半',
    '禽-死': '天禽+死门：小凶',
    '禽-惊': '天禽+惊门：小凶',
    '禽-休': '天禽+休门：大吉',
    '心-生': '天心+生门：大吉，医卜求财',
    '心-开': '天心+开门：大吉，领导升迁',
    '心-景': '天心+景门：吉，求医问药',
    '心-杜': '天心+杜门：吉中带阻',
    '心-伤': '天心+伤门：次凶，变动有因',
    '心-死': '天心+死门：次凶，不利医卜',
    '心-惊': '天心+惊门：次凶，官非',
    '心-休': '天心+休门：大吉，休养得法',
    '柱-开': '天柱+开门：破败+事业，大凶',
    '柱-生': '天柱+生门：破败+求财，凶',
    '柱-伤': '天柱+伤门：破败+伤害，大凶',
    '柱-死': '天柱+死门：破败+死事，极凶',
    '柱-杜': '天柱+杜门：破败+隐蔽，凶',
    '柱-景': '天柱+景门：破败+文书，凶',
    '柱-惊': '天柱+惊门：破败+惊恐，凶',
    '柱-休': '天柱+休门：破败+休养，小凶',
    '英-景': '天英+景门：小凶，是非口舌',
    '英-开': '天英+开门：小凶，名声受损',
    '英-生': '天英+生门：小凶，财来财去',
    '英-伤': '天英+伤门：是非+伤害，大凶',
    '英-杜': '天英+杜门：是非+隐蔽，小凶',
    '英-死': '天英+死门：是非+死事，大凶',
    '英-惊': '天英+惊门：是非+惊恐，大凶',
    '英-休': '天英+休门：是非+休养，小凶',
  };
  return combos[key] || `${star?.name || ''}会${door?.name || ''}门`;
}

function getDoorStarAnalysis(p宫, p, qd) {
  if (!p || !p.star || !p.door) return '—';
  const s = p.star; const d = p.door;
  let a = '';
  if (s.type === '大吉' && (d.name === '生' || d.name === '开' || d.name === '休')) a = '大吉之局，诸事顺遂';
  else if (s.type === '大吉') a = '吉星高照，运势亨通';
  else if (s.type === '吉') a = '小吉之局，可稳步推进';
  else if (s.type === '凶' && d.name === '死') a = '凶局，不宜妄动';
  else if (s.type === '凶') a = '凶星临宫，谨慎行事';
  else a = `${s.nature}·${d.nature}`;
  return a;
}

function getStarClass(sym) {
  const m = {'蓬':'star-pei','芮':'star-yin','冲':'star-chu','辅':'star-fang','禽':'star-jin','心':'star-zhen','柱':'star-rong','英':'star-ying','任':'star-ying'};
  return m[sym] || '';
}
function getDoorClass(name) {
  const m = {'生':'door-sheng','开':'door-kai','休':'door-xin','景':'door-jing','伤':'door-shang','杜':'door-du','死':'door-si','惊':'door-jing2'};
  return m[name] || '';
}
function getGodClass(sym) {
  const m = {'符':'god-zhi','龙':'god-tian','虎':'god-hu','玄':'god-xuan','陈':'god-di','地':'god-hei','天':'god-yue','蛇':'god-nu'};
  return m[sym] || '';
}

// ============================================================
// QIMEN INTERPRETATION
// ============================================================

function renderQimenInterp(qd) {
  const container = document.getElementById('qmInterpBlocks');
  container.innerHTML = '';

  const kp = qd.keyPalace;
  const kpData = qd.palaces[kp];
  const kpPalace = PALACES[kp];

  // Overall judgment
  const overall = getQimenOverall(qd);
  addInterpCard(container, '全 局 论 断', overall.overview, 'blue-accent');

  // Key palace analysis
  const keyDesc = `${kpPalace?.name} · ${kpData?.star?.name || ''}星 · ${kpData?.door?.name || ''}门 · ${kpData?.god?.name || ''}`;
  const keyAnalysis = `${overall.keyFortune}。值使${qd.bamen}门落${kpPalace?.name}，${overall.keyAdvice}`;
  addInterpCard(container, '核 心 宫 位 分 析', `
    <p>${keyDesc}</p>
    <div class="sub-grid">
      <div class="interp-item">
        <p class="item-label">九星</p>
        <p class="item-value" style="color:${kpData?.star?.type==='吉'||kpData?.star?.type==='大吉'?'var(--success)':'var(--cinn2)'}">${kpData?.star?.name || '—'}</p>
        <p class="item-desc">${kpData?.star?.desc || ''}（${kpData?.star?.nature || ''}）</p>
      </div>
      <div class="interp-item">
        <p class="item-label">八门</p>
        <p class="item-value" style="color:${kpData?.door?.color || 'var(--metal)'}">${kpData?.door?.name || '—'}门</p>
        <p class="item-desc">${kpData?.door?.desc || ''}（${kpData?.door?.nature || ''}）</p>
      </div>
      <div class="interp-item">
        <p class="item-label">八神</p>
        <p class="item-value" style="color:var(--warn)">${kpData?.god?.name || '—'}</p>
        <p class="item-desc">${kpData?.god?.desc || ''}（${kpData?.god?.nature || ''}）</p>
      </div>
      <div class="interp-item">
        <p class="item-label">遁甲</p>
        <p class="item-value">${qd.qimenType}</p>
        <p class="item-desc">${overall.keyAdvice}</p>
      </div>
    </div>
    <p style="margin-top:20px;font-size:14px;line-height:2;letter-spacing:1px">${overall.keyFortune}</p>
  `, 'violet-accent');

  // Fortune by palace
  const fortuneHTML = Object.keys(qd.palaces).map(p宫 => {
    const p = qd.palaces[p宫];
    if (!p || p宫 == 5) return '';
    const isKey = p.isKey;
    const palInfo = PALACES[p宫];
    const isGood = p.star?.type === '大吉' || p.star?.type === '吉';
    return `
      <div class="interp-item" style="${isKey ? 'border-color:rgba(201,168,76,.3);background:rgba(201,168,76,.03)' : ''}">
        <p class="item-label">${palInfo.name} ${isKey ? '(值使)' : ''}</p>
        <p class="item-value">${p.star?.name || ''} · ${p.door?.name || ''}门</p>
        <p class="item-desc" style="color:${isGood?'var(--success)':'var(--cinn2)'}">${isGood?'吉':'凶'}</p>
      </div>
    `;
  }).join('');

  addInterpCard(container, '九 宫 吉 凶 一 览', `<div class="sub-grid">${fortuneHTML}</div>`, 'green-accent');

  // Timing
  addInterpCard(container, '时 机 与 方 位', `
    <div class="sub-grid">
      <div class="interp-item">
        <p class="item-label">最佳时辰</p>
        <p class="item-value">${overall.bestHour}</p>
        <p class="item-desc">${overall.bestHourReason}</p>
      </div>
      <div class="interp-item">
        <p class="item-label">大吉方位</p>
        <p class="item-value">${overall.goodDirection}</p>
        <p class="item-desc">${overall.goodDirReason}</p>
      </div>
      <div class="interp-item">
        <p class="item-label">凶方避忌</p>
        <p class="item-value">${overall.badDirection}</p>
        <p class="item-desc">${overall.badDirReason}</p>
      </div>
      <div class="interp-item">
        <p class="item-label">行动时间</p>
        <p class="item-value">${overall.actionTime}</p>
        <p class="item-desc">${overall.actionTimeReason}</p>
      </div>
    </div>
  `, 'red-accent');

  // Advice
  addInterpCard(container, '策 略 建 议', `
    <p>${overall.advice}</p>
    <div class="sub-grid" style="margin-top:20px">
      <div class="interp-item">
        <p class="item-label">宜</p>
        <p class="item-desc">${overall.yi}</p>
      </div>
      <div class="interp-item">
        <p class="item-label">忌</p>
        <p class="item-desc">${overall.ji}</p>
      </div>
    </div>
  `, 'blue-accent');
}

function addInterpCard(container, title, html, accent) {
  const div = document.createElement('div');
  div.className = `interp-card ${accent}`;
  div.innerHTML = `<h5>${title}</h5>${html}`;
  container.appendChild(div);
}

function getQimenOverall(qd) {
  const kp = qd.keyPalace;
  const kpData = qd.palaces[kp];
  const star = kpData?.star;
  const door = kpData?.door;
  const god = kpData?.god;
  const kpPalace = PALACES[kp];

  const isGood = star?.type === '大吉' || star?.type === '吉';
  const isBad = star?.type === '大凶' || star?.type === '凶';

  let overview = `此局为${qd.qimenType}，`;
  overview += `值${star?.name || ''}星临${kpPalace?.name || ''}，${door?.name || ''}门为值使，${god?.name || ''}神护卫。`;
  if (isGood) overview += `星门皆吉，大象有利，诸事可图。`;
  else if (isBad) overview += `星门带凶，行事宜守不宜动，当谨慎从事。`;
  else overview += `星门平中带凶，宜守成待机。`;

  let keyFortune = '';
  if (star?.symbol === '辅' || star?.symbol === '心' || star?.symbol === '禽') {
    keyFortune = '吉星高照，有贵人相助，当积极进取。';
  } else if (star?.symbol === '蓬' || star?.symbol === '柱') {
    keyFortune = '破财之星临宫，财务上需谨慎，防破耗。';
  } else if (star?.symbol === '芮') {
    keyFortune = '病符之星临宫，健康需注意，防疾病。';
  } else if (star?.symbol === '冲') {
    keyFortune = '冲动之星临宫，防变动与是非。';
  } else if (star?.symbol === '英') {
    keyFortune = '桃花之星临宫，防口舌是非。';
  } else {
    keyFortune = `${star?.name || ''}星临宫，${star?.nature || ''}。`;
  }

  let keyAdvice = '';
  if (door?.name === '生') keyAdvice = '宜求财、创业、置产，大有可为';
  else if (door?.name === '开') keyAdvice = '宜事业、升迁、远行，开创新局';
  else if (door?.name === '休') keyAdvice = '宜休养、人际、访友，以静制动';
  else if (door?.name === '景') keyAdvice = '宜文书、信息、告白，文事为佳';
  else if (door?.name === '伤') keyAdvice = '宜讨债、博弈，不宜大举进攻';
  else if (door?.name === '死') keyAdvice = '宜丧葬、捕猎，不宜轻动';
  else if (door?.name === '杜') keyAdvice = '宜保密、躲藏，不宜张扬';
  else if (door?.name === '惊') keyAdvice = '宜官非、诉讼，须防口舌';
  else keyAdvice = `${door?.name || ''}门值使`;

  const bestHour = qd.isYangDun ? '卯时、午时' : '酉时、子时';
  const bestHourReason = qd.isYangDun ? '阳遁利于阳时行动，木火相助' : '阴遁利于阴时行动，金水相生';
  const goodDirection = kpPalace?.direction || '正北';
  const goodDirReason = `${kpPalace?.trigram || ''}卦方位，利于${kpPalace?.element || ''}属性之事`;
  const badDirection = qd.isYangDun ? '正西（兑宫）' : '正东（震宫）';
  const badDirReason = '金木相克，此方向行事多阻';
  const actionTime = isGood ? '立即行动，趁势而上' : '静待时机，三至七日后再议';

  let advice = '';
  if (isGood && (door?.name === '生' || door?.name === '开')) {
    advice = `此局${kpPalace?.name || ''}${star?.name || ''}星+${door?.name || ''}门，${god?.name || ''}神护卫，大吉之象。当把握时机，积极进取，凡事可成。`;
  } else if (isBad) {
    advice = `此局星门带凶，当以静制动，不宜大动作。注意财务与健康，防小人暗害，保守为上。`;
  } else {
    advice = `此局星门平中带异，当审时度势，择善而行。进退有度，方为全身之道。`;
  }

  let yi = '';
  let ji = '';
  if (isGood) {
    yi = '求财、创业、升迁、表白、签约、出行';
    ji = '冒进、投机、争讼、妄动';
  } else if (isBad) {
    yi = '静养、守成、保密、观望';
    ji = '投资、签约、远行、开业、表白';
  } else {
    yi = '小事可成、人际往来、文书信息';
    ji = '大举行动、风险投资、重大决定';
  }

  return { overview, keyFortune, keyAdvice, bestHour, bestHourReason, goodDirection, goodDirReason, badDirection, badDirReason, actionTime, actionTimeReason: actionTime, advice, yi, ji };
}

// ============================================================
// COMPUTE WRAPPER
// ============================================================

function computeQimen() {
  const dateVal = document.getElementById('qmDateInput').value;
  const hourVal = document.getElementById('qmHourSelect').value;
  const name = document.getElementById('qmNameInput').value || '有缘人';
  const guaVal = document.getElementById('qmGuaSelect').value;

  if (!dateVal || !hourVal) {
    showToast('请选择日期和时辰');
    return;
  }

  const [year, month, day] = dateVal.split('-').map(Number);
  const hourNum = parseInt(hourVal);

  const qd = computeQimenData(year, month, day, hourNum);

  // Override if user specified
  if (guaVal === 'yang') qd.isYangDun = true;
  else if (guaVal === 'yin') qd.isYangDun = false;

  renderQimen(qd);

  document.getElementById('qmResultSection').classList.add('visible');
  document.getElementById('qmResultSection').scrollIntoView({ behavior: 'smooth' });
}

// ============================================================
// YIJING ENGINE (simplified from original)
// ============================================================

const HEXAGRAMS = [
  { num:1,  gua:[[1,1,1],[1,1,1]], name:'乾', pinyin:'Qián', symbol:'䷀', judgment:'元亨利贞', meaning:'大吉，无往不利' },
  { num:2,  gua:[[0,0,0],[0,0,0]], name:'坤', pinyin:'Kūn', symbol:'䷁', judgment:'元亨利牝马之贞', meaning:'柔顺宽厚，承载万物' },
  { num:3,  gua:[[0,0,0],[1,1,1]], name:'屯', pinyin:'Zhūn', symbol:'䷂', judgment:'元亨利贞', meaning:'初生艰难，积蓄力量' },
  { num:4,  gua:[[1,1,1],[0,0,0]], name:'蒙', pinyin:'Mēng', symbol:'䷃', judgment:'亨，匪我求童蒙', meaning:'启蒙发智，去惑求明' },
  { num:5,  gua:[[0,0,0],[0,0,1]], name:'需', pinyin:'Xū', symbol:'䷄', judgment:'有孚，光亨，贞吉', meaning:'等待时机，蓄势待发' },
  { num:6,  gua:[[1,0,0],[0,0,0]], name:'讼', pinyin:'Sòng', symbol:'䷅', judgment:'有孚，窒，惕中吉', meaning:'争讼是非，谨慎处理' },
  { num:7,  gua:[[0,0,0],[1,0,0]], name:'师', pinyin:'Shī', symbol:'䷆', judgment:'贞，丈人吉，无咎', meaning:'统众用兵，以德服人' },
  { num:8,  gua:[[1,0,0],[0,0,0]], name:'比', pinyin:'Bǐ', symbol:'䷇', judgment:'吉，原筮元永贞', meaning:'亲附比邻，众望所归' },
  { num:9,  gua:[[1,1,1],[0,0,1]], name:'小畜', pinyin:'Xiǎo Xù', symbol:'䷈', judgment:'亨，密云不雨', meaning:'小有积累，尚需等待' },
  { num:10, gua:[[1,0,0],[0,0,1]], name:'履', pinyin:'Lǚ', symbol:'䷉', judgment:'亨，履虎尾不咥人', meaning:'谨慎行事，履险如夷' },
  { num:11, gua:[[1,1,1],[0,0,0]], name:'泰', pinyin:'Tài', symbol:'䷊', judgment:'小往大来，吉亨', meaning:'天地交泰，万物通达' },
  { num:12, gua:[[0,0,0],[1,1,1]], name:'否', pinyin:'Pǐ', symbol:'䷋', judgment:'否之匪人', meaning:'闭塞不通，静待转机' },
  { num:13, gua:[[1,1,0],[1,1,1]], name:'同人', pinyin:'Tóng Rén', symbol:'䷌', judgment:'同人于野，亨', meaning:'同舟共济，广结善缘' },
  { num:14, gua:[[1,1,1],[0,1,1]], name:'大有', pinyin:'Dà Yǒu', symbol:'䷍', judgment:'元亨', meaning:'丰盛丰收，德才兼备' },
  { num:15, gua:[[0,0,1],[1,1,1]], name:'谦', pinyin:'Qiān', symbol:'䷎', judgment:'亨，君子有终', meaning:'谦受益满招损' },
  { num:16, gua:[[1,1,1],[0,0,1]], name:'豫', pinyin:'Yù', symbol:'䷏', judgment:'利建侯行师', meaning:'欢乐和悦，众心归附' },
  { num:17, gua:[[1,0,0],[1,1,1]], name:'随', pinyin:'Suí', symbol:'䷐', judgment:'元亨利贞', meaning:'随从随顺，因时制宜' },
  { num:18, gua:[[1,1,0],[0,0,1]], name:'蛊', pinyin:'Gǔ', symbol:'䷑', judgment:'元亨，利涉大川', meaning:'拨乱反正，革故鼎新' },
  { num:19, gua:[[0,0,1],[1,1,1]], name:'临', pinyin:'Lín', symbol:'䷒', judgment:'元亨利贞', meaning:'居高临下，督导有方' },
  { num:20, gua:[[1,1,0],[0,0,0]], name:'观', pinyin:'Guān', symbol:'䷓', judgment:'盥而不荐', meaning:'观察省思，静观其变' },
  { num:21, gua:[[1,0,1],[1,1,0]], name:'噬嗑', pinyin:'Shì Kē', symbol:'䷔', judgment:'亨，利用狱', meaning:'明罚勑法，除暴安良' },
  { num:22, gua:[[0,1,1],[1,0,1]], name:'贲', pinyin:'Bì', symbol:'䷕', judgment:'亨，小利有攸往', meaning:'文饰美化，外秀内慧' },
  { num:23, gua:[[0,0,0],[1,1,0]], name:'剥', pinyin:'Bō', symbol:'䷖', judgment:'不利有攸往', meaning:'剥落侵蚀，静守待机' },
  { num:24, gua:[[0,1,1],[0,0,0]], name:'复', pinyin:'Fù', symbol:'䷗', judgment:'亨，出入无疾', meaning:'复归本元，否极泰来' },
  { num:25, gua:[[1,1,1],[0,0,1]], name:'无妄', pinyin:'Wú Wàng', symbol:'䷘', judgment:'元亨利贞', meaning:'不妄为，守正而行' },
  { num:26, gua:[[1,1,1],[1,0,0]], name:'大畜', pinyin:'Dà Xù', symbol:'䷙', judgment:'利贞，不家食吉', meaning:'积蓄深厚，厚积薄发' },
  { num:27, gua:[[0,0,1],[1,0,0]], name:'颐', pinyin:'Yí', symbol:'䷚', judgment:'贞吉，观颐', meaning:'养身养德，慎言节食' },
  { num:28, gua:[[1,0,0],[0,1,1]], name:'大过', pinyin:'Dà Guò', symbol:'䷛', judgment:'栋挠，利有攸往', meaning:'大厦将倾，扶危济困' },
  { num:29, gua:[[0,0,0],[0,0,0]], name:'坎', pinyin:'Kǎn', symbol:'䷜', judgment:'习坎，有孚', meaning:'重重险难，心诚则通' },
  { num:30, gua:[[1,1,1],[1,1,1]], name:'离', pinyin:'Lí', symbol:'䷝', judgment:'利贞，亨', meaning:'光明附丽，柔和中正' },
  { num:31, gua:[[0,0,1],[1,0,0]], name:'咸', pinyin:'Xián', symbol:'䷞', judgment:'亨，利贞', meaning:'情感感应，心意相通' },
  { num:32, gua:[[1,0,0],[0,0,1]], name:'恒', pinyin:'Héng', symbol:'䷟', judgment:'亨，无咎', meaning:'持之以恒，天长地久' },
  { num:33, gua:[[1,1,0],[0,0,0]], name:'遁', pinyin:'Dùn', symbol:'䷠', judgment:'亨，小利贞', meaning:'退避三舍，以退为进' },
  { num:34, gua:[[0,0,0],[1,1,1]], name:'大壮', pinyin:'Dà Zhuàng', symbol:'䷡', judgment:'利贞', meaning:'气势强盛，守正勿躁' },
  { num:35, gua:[[0,0,0],[1,1,0]], name:'晋', pinyin:'Jìn', symbol:'䷢', judgment:'康侯用锡马蕃庶', meaning:'日出地上，晋升发达' },
  { num:36, gua:[[0,1,1],[0,0,0]], name:'明夷', pinyin:'Míng Yí', symbol:'䷣', judgment:'利艰贞', meaning:'明入地中，晦而明' },
  { num:37, gua:[[1,1,0],[1,0,1]], name:'家人', pinyin:'Jiā Rén', symbol:'䷤', judgment:'利女贞', meaning:'齐家之道，女正位内' },
  { num:38, gua:[[1,0,1],[0,1,1]], name:'睽', pinyin:'Kuí', symbol:'䷥', judgment:'小事吉', meaning:'乖离矛盾，求同存异' },
  { num:39, gua:[[0,0,1],[0,0,0]], name:'蹇', pinyin:'Jiǎn', symbol:'䷦', judgment:'利西南，不利东北', meaning:'前路艰险，见机行事' },
  { num:40, gua:[[0,0,0],[1,0,0]], name:'解', pinyin:'Xiè', symbol:'䷧', judgment:'利西南，无攸往', meaning:'解除险难，云开月明' },
  { num:41, gua:[[1,0,0],[1,1,0]], name:'损', pinyin:'Sǔn', symbol:'䷨', judgment:'有孚，元吉', meaning:'减损之道，损己利人' },
  { num:42, gua:[[0,1,1],[0,1,0]], name:'益', pinyin:'Yì', symbol:'䷩', judgment:'利有攸往', meaning:'增益利益，损上益下' },
  { num:43, gua:[[1,1,1],[0,1,0]], name:'夬', pinyin:'Guài', symbol:'䷪', judgment:'扬于王庭', meaning:'决而能和，当断则断' },
  { num:44, gua:[[0,1,0],[1,1,1]], name:'姤', pinyin:'Gòu', symbol:'䷫', judgment:'女壮，勿用取女', meaning:'邂逅相遇，阴长阳消' },
  { num:45, gua:[[0,0,1],[0,0,0]], name:'萃', pinyin:'Cuì', symbol:'䷬', judgment:'亨，王假有庙', meaning:'荟萃聚集，人和为贵' },
  { num:46, gua:[[0,0,0],[0,0,1]], name:'升', pinyin:'Shēng', symbol:'䷭', judgment:'南征吉', meaning:'步步高升，稳扎稳打' },
  { num:47, gua:[[0,0,0],[0,0,0]], name:'困', pinyin:'Kùn', symbol:'䷮', judgment:'亨，贞大人吉', meaning:'困境磨砺，穷则变通' },
  { num:48, gua:[[0,0,0],[0,0,0]], name:'井', pinyin:'Jǐng', symbol:'䷯', judgment:'改邑不改井', meaning:'养民如养井，取之不尽' },
  { num:49, gua:[[1,0,1],[1,1,0]], name:'革', pinyin:'Gé', symbol:'䷰', judgment:'己日乃孚', meaning:'变革革新，顺天应人' },
  { num:50, gua:[[0,1,1],[1,0,1]], name:'鼎', pinyin:'Dǐng', symbol:'䷱', judgment:'元吉，亨', meaning:'定鼎立业，革故鼎新' },
  { num:51, gua:[[0,0,0],[1,0,0]], name:'震', pinyin:'Zhèn', symbol:'䷲', judgment:'亨，震来虩虩', meaning:'震惊百里，惊而能惧' },
  { num:52, gua:[[1,0,0],[0,0,0]], name:'艮', pinyin:'Gèn', symbol:'䷳', judgment:'艮其背，不获其身', meaning:'止于当止，动静得宜' },
  { num:53, gua:[[0,0,1],[0,1,0]], name:'渐', pinyin:'Jiàn', symbol:'䷴', judgment:'女归吉，利贞', meaning:'循序渐进，稳扎稳打' },
  { num:54, gua:[[0,1,0],[0,0,1]], name:'归妹', pinyin:'Guī Mèi', symbol:'䷵', judgment:'征凶，无攸利', meaning:'婚嫁之道，出以正则' },
  { num:55, gua:[[1,1,0],[1,0,1]], name:'丰', pinyin:'Fēng', symbol:'䷶', judgment:'亨，日中则昃', meaning:'丰盛盛大，日盈则亏' },
  { num:56, gua:[[1,0,1],[0,1,1]], name:'旅', pinyin:'Lǚ', symbol:'䷷', judgment:'小亨，旅贞吉', meaning:'羁旅他乡，随遇而安' },
  { num:57, gua:[[0,0,0],[0,0,0]], name:'巽', pinyin:'Xùn', symbol:'䷸', judgment:'小亨，利有攸往', meaning:'谦逊入下，柔以成事' },
  { num:58, gua:[[0,0,0],[0,0,0]], name:'兑', pinyin:'Duì', symbol:'䷹', judgment:'亨，利贞', meaning:'欣喜欢悦，和颜悦色' },
  { num:59, gua:[[0,0,0],[0,0,0]], name:'涣', pinyin:'Huàn', symbol:'䷺', judgment:'亨，王假有庙', meaning:'涣散解除，人心归一' },
  { num:60, gua:[[0,0,0],[0,0,0]], name:'节', pinyin:'Jié', symbol:'䷻', judgment:'亨，苦节不可贞', meaning:'节制节约，适度为宜' },
  { num:61, gua:[[0,0,0],[0,0,0]], name:'中孚', pinyin:'Zhōng Fú', symbol:'䷼', judgment:'豚鱼吉', meaning:'心诚守信，泽及万物' },
  { num:62, gua:[[1,0,0],[0,0,1]], name:'小过', pinyin:'Xiǎo Guò', symbol:'䷽', judgment:'亨，利贞', meaning:'小有过越，谨言慎行' },
  { num:63, gua:[[1,0,0],[1,0,0]], name:'既济', pinyin:'Jì Jì', symbol:'䷾', judgment:'亨，小利贞', meaning:'大功告成，守成不易' },
  { num:64, gua:[[0,0,1],[0,0,1]], name:'未济', pinyin:'Wèi Jì', symbol:'䷿', judgment:'亨，小狐汔济', meaning:'事未成，尚需努力' },
];

const YJ_INTERP = {
  1:  {overview:'乾为天，纯阳之卦，天道刚健，自强不息。',person:'命格乾元旺盛，志向高远，领袖气质强，不甘人后。当以柔济刚，谦逊待人，方成大器。',matter:'纯阳向上之象，正值进取之时，当把握时机大胆开拓。',timing:'时机极利，宜速行动，三至五年内显著成效。',direction:'西北、正南，吉；东北，凶。',advice:'天行健，君子以自强不息。亢龙有悔，满则招损。'},
  2:  {overview:'坤为地，纯阴之卦，地道柔顺，厚德载物。',person:'坤德深厚，性格温厚仁慈，人缘极佳。当内刚外柔，培养决断之力。',matter:'以柔克刚，顺势而为，不可强求，稳扎稳打。',timing:'大器晚成，一至三年内打好基础。',direction:'西南、西北，吉；正东，凶。',advice:'地势坤，君子以厚德载物。保持仁厚，培养内在力量。'},
  3:  {overview:'水雷屯，万物初生之艰难，如种子入土，萌芽将出。',person:'早年多历磨练，三十岁后渐入佳境。艰难困苦，玉汝于成。',matter:'初起艰难，时机未熟，宜稳扎稳打，小困难是大成功的铺垫。',timing:'一至两年内有重大转机。',direction:'东南、正南，吉；正北，凶。',advice:'屯之时，习坎以学，在困境中成长。'},
  4:  {overview:'山水蒙，启蒙发智之卦，童蒙之心，需师长教导。',person:'聪慧有求知欲，有时需借他人之力方能看清方向。',matter:'先明理再决策，先调研再行动，切忌盲目冲动。',timing:'两至三年后方可大展身手。',direction:'东南、正东，吉。',advice:'匪我求童蒙，童蒙求我。主动求学，但最终靠自己的智慧。'},
  5:  {overview:'水天需，等待与蓄势之卦，如云聚天际，雨将下未下。',person:'当前处于积累与等待阶段，当充实自己，等待有利时机。',matter:'需要时间酝酿，不可强求速效，蓄积力量，择机而动。',timing:'三至六个月后有一飞冲天之机。',direction:'正北、正西，吉；正南，凶。',advice:'需于郊，利用恒，无咎。保持初心与定力。'},
  6:  {overview:'天水讼，争讼与冲突之卦。人际难免有分歧，当以和为贵。',person:'个性争强好胜，当学会以退为进，以和化争。',matter:'有争竞之象，能和解则和解，协商是正道。',timing:'三至六个月为化解关键期。',direction:'东南、正南，吉；正北，凶。',advice:'君子以作事谋始。诚实信用是化解争端的根本。'},
  7:  {overview:'地水师，统兵打仗之卦，以贞为吉，揭示领导之道。',person:'有领导和指挥天赋，善于带领团队，以德服人方能服众。',matter:'选贤任能，以德服人，赏罚分明，切忌刚愎自用。',timing:'三至六个月将领团队初见成效。',direction:'西南、正北，吉；正东，凶。',advice:'师出以律，失律凶也。领导之道在于严于律己，宽以待人。'},
  8:  {overview:'水地比，亲密比附之卦，众心归一，水润大地。',person:'人缘极佳，亲和力强，身边易聚集志同道合之人。',matter:'与各方坦诚相待，建立互信基础，人心齐泰山移。',timing:'三至六个月为关系建立关键期。',direction:'西南、正北，吉；正东，凶。',advice:'比之自内，贞吉。亲附之道在于真诚与信任。'},
  9:  {overview:'风天小畜，微有积蓄之卦，密云不雨，尚在小蓄阶段。',person:'善于积累理财，但格局偏小，常满足小成而忽大机遇。',matter:'已有初步成效，未达理想，不可止步，当继续扩大积累。',timing:'一年至两年后进入新阶段。',direction:'东南、正南，吉；正北，凶。',advice:'小畜之道，未雨绸缪，持续积累，拓宽视野。'},
  10: {overview:'天泽履，踩虎尾而不伤，谨慎行事之道。',person:'谨慎，做事有条理，但过于谨慎反易错失良机。',matter:'有一定风险，需谨慎处理，稳中求进。',timing:'近期三至六个月需特别小心。',direction:'西北、正西，吉；正北，凶。',advice:'履虎尾要有武人的胆识和智者的谨慎，胆大心细。'},
  11: {overview:'地天泰，天地交泰之卦，三阳开泰，万事亨通。',person:'泰运亨通，开朗人缘好，正处上升期，当大展宏图。',matter:'天时地利人和三者皆备，乘势而上必有收获。',timing:'两至三年内运势达高峰。',direction:'西南、西北，大吉；正东，凶。',advice:'泰，小往大来，吉亨。居安思危，好运才能持久。'},
  12: {overview:'天地否，阴阳不交之卦，闭塞不通，小人当道。',person:'近期可能感到压抑，外部环境不利，否极泰来，坚持正道。',matter:'处于逆境，不宜大动作，韬光养晦，积蓄力量。',timing:'否卦需半年至两年，转机终将到来。',direction:'西北稍安，正东大凶。',advice:'否，匪人。坚守正道，以待天时。'},
  13: {overview:'天火同人，与人同心之卦，众人同心，其利断金。',person:'善于与人合作，社交能力强，能凝聚团队。',matter:'需众人之力，广纳善言，集思广益，切忌独断。',timing:'三至六个月人脉关系明显改善。',direction:'正南、正北，吉；正东，凶。',advice:'同人于野，亨。同人之道在于明辨是非，与志同道合者同行。'},
  14: {overview:'火天大有，丰收盛大之卦，德才兼备，富有天下。',person:'财运事业运皆佳，当以谦德持盈，不可骄奢。',matter:'正处于收获季节，收获越大责任越大，当以仁德处之。',timing:'一至两年内有大收成。',direction:'正南、西北，大吉。',advice:'大有，元亨。富有之时保持谦逊，方能将大有化为长久之福。'},
  15: {overview:'地山谦，谦德之卦，六爻皆吉。谦受益，满招损。',person:'谦德性格，温和有内涵，不张扬重实际，人缘极好。',matter:'以谦道处之必吉，以退为进，以让得益。',timing:'三至六个月后必有善报。',direction:'谦德自带贵人运，方向不限。',advice:'谦，亨，君子有终。真正的强大不需要张扬，谦逊是最好的护身符。'},
};

let yjMode = 'person';
let yjLine = 0;
let yjVals = [];
let yjTossing = false;

function startYijing(mode) {
  yjMode = mode;
  yjLine = 0; yjVals = []; yjTossing = false;
  document.getElementById('yjDivSection').style.display = 'block';
  document.getElementById('yjResultSection').classList.remove('visible');
  document.getElementById('yjDivBtn').disabled = false;
  document.getElementById('yjDivBtn').textContent = '掷 钱 问 卦';
  document.getElementById('yjTossCount').textContent = '第 1 / 6 爻';
  for (let i = 0; i < 6; i++) {
    document.getElementById('yjDot' + i).className = 'line-dot';
    const c = document.getElementById('yjCoin' + i);
    c.style.opacity = '0'; c.style.transform = 'translateY(-20px) rotateY(180deg)';
    c.textContent = '背'; c.style.color = ''; c.style.borderColor = '';
  }
  document.getElementById('yjDivSection').scrollIntoView({ behavior: 'smooth' });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function yjCastCoins() {
  if (yjTossing) return;
  yjTossing = true;
  document.getElementById('yjDivBtn').disabled = true;
  const btn = document.getElementById('yjDivBtn');
  btn.textContent = '占 卦 中...';
  for (let i = 0; i < yjLine; i++) document.getElementById('yjDot' + i).className = 'line-dot done';
  document.getElementById('yjDot' + yjLine).className = 'line-dot';
  await sleep(100);
  let total = 0;
  for (let i = 0; i < 3; i++) total += (i % 2 === 0) ? 3 : 2;
  const coins = [
    document.getElementById('yjCoin0'),
    document.getElementById('yjCoin1'),
    document.getElementById('yjCoin2')
  ];
  for (let i = 0; i < 3; i++) {
    coins[i].style.opacity = '0'; coins[i].style.transform = 'translateY(-20px) rotateY(720deg)';
    coins[i].textContent = '●';
  }
  await sleep(200);
  for (let i = 0; i < 3; i++) {
    await sleep(150 + i * 40);
    const isHead = (i === 0 ? 2 : (i === 1 ? 2 : 3)) > 0; // visual only
    const val = (i % 2 === 0);
    coins[i].style.opacity = '1'; coins[i].style.transform = 'none';
    coins[i].textContent = val ? '字' : '背';
    coins[i].style.color = val ? 'var(--gold2)' : 'var(--gold)';
    coins[i].style.borderColor = val ? 'var(--gold2)' : 'var(--gold)';
  }
  await sleep(600);
  const val = total; // 6,7,8,9
  yjVals.push(val);
  for (let i = 0; i < 3; i++) {
    coins[i].style.opacity = '0'; coins[i].style.transform = 'translateY(-20px) rotateY(180deg)';
    coins[i].textContent = '背'; coins[i].style.color = ''; coins[i].style.borderColor = '';
  }
  yjLine++;
  if (yjLine < 6) {
    document.getElementById('yjTossCount').textContent = `第 ${yjLine + 1} / 6 爻`;
    document.getElementById('yjDivBtn').disabled = false;
    btn.textContent = '继 续 掷 卦';
  } else {
    document.getElementById('yjTossCount').textContent = '六 爻 皆 成';
    btn.textContent = '卦 象 已 成';
    await sleep(500);
    showYjResult();
    return;
  }
  yjTossing = false;
}

function showYjResult() {
  const gua = [[0,0,0],[0,0,0]];
  const movingLines = [];
  for (let i = 0; i < 6; i++) {
    const v = yjVals[i];
    const isYang = v % 2 === 1;
    const isMoving = v === 6 || v === 9;
    const pos = 5 - i;
    if (i < 3) gua[1][2-i] = isYang ? 1 : 0;
    else gua[0][2-(i-3)] = isYang ? 1 : 0;
    if (isMoving) movingLines.push({pos:i, val:v});
  }
  const upper = gua[0][0]*4 + gua[0][1]*2 + gua[0][2];
  const lower = gua[1][0]*4 + gua[1][1]*2 + gua[1][2];
  const hexNum = upper * 8 + lower + 1;
  const hex = HEXAGRAMS[hexNum - 1] || HEXAGRAMS[0];

  let changedNum = null, changedHex = null;
  const changedGua = JSON.parse(JSON.stringify(gua));
  if (movingLines.length > 0) {
    for (const ml of movingLines) {
      const isYang2 = gua[Math.floor((5-ml.pos)/3) ? 0 : 1][(5-ml.pos)%3];
      if (isYang2) { if (ml.pos < 3) changedGua[1][2-ml.pos] = 0; else changedGua[0][2-(ml.pos-3)] = 0; }
      else { if (ml.pos < 3) changedGua[1][2-ml.pos] = 1; else changedGua[0][2-(ml.pos-3)] = 1; }
    }
    const cu = changedGua[0][0]*4 + changedGua[0][1]*2 + changedGua[0][2];
    const cl = changedGua[1][0]*4 + changedGua[1][1]*2 + changedGua[1][2];
    changedNum = cu * 8 + cl + 1;
    changedHex = HEXAGRAMS[changedNum - 1];
  }

  const name = document.getElementById('yjNameInput').value || '有缘人';
  const modeText = yjMode === 'person' ? '人盘·命格' : '事盘·时局';
  document.getElementById('yjResultMeta').textContent = `${modeText} · ${name}`;
  document.getElementById('yjResultSymbol').textContent = hex.symbol;
  document.getElementById('yjResultTitle').textContent = hex.name + '卦';
  document.getElementById('yjResultPinyin').textContent = hex.pinyin;
  document.getElementById('yjPrimaryName').textContent = hex.name + '卦';
  document.getElementById('yjPrimaryPinyin').textContent = hex.pinyin;
  document.getElementById('yjPrimaryMeaning').textContent = hex.judgment + ' · ' + hex.meaning;

  // Lines
  const linesGua = [
    gua[1][0], gua[1][1], gua[1][2],
    gua[0][0], gua[0][1], gua[0][2]
  ];
  const pgEl = document.getElementById('yjPrimaryGua');
  pgEl.innerHTML = '';
  for (let i = 5; i >= 0; i--) {
    const div = document.createElement('div');
    div.style.cssText = 'width:70px;height:8px;position:relative;margin:2px 0';
    const isYang = linesGua[i];
    const isOld = yjVals[i] === 6 || yjVals[i] === 9;
    div.innerHTML = isYang
      ? `<div style="position:absolute;left:0;right:0;top:3px;height:3px;background:${isOld?'var(--cinn2)':'var(--gold)'};border-radius:1px"></div>`
      : `<div style="position:absolute;left:0;right:50%;top:3px;height:3px;background:${isOld?'var(--cinn2)':'var(--gold)'};border-radius:1px"></div><div style="position:absolute;left:50%;right:0;top:3px;height:3px;background:${isOld?'var(--cinn2)':'var(--gold)'};border-radius:1px"></div>`;
    pgEl.appendChild(div);
  }

  const arrow = document.getElementById('yjArrowBetween');
  const changedCard = document.getElementById('yjChangedCard');
  if (changedHex) {
    arrow.style.display = 'flex';
    changedCard.style.display = 'block';
    document.getElementById('yjChangedName').textContent = changedHex.name + '卦';
    document.getElementById('yjChangedPinyin').textContent = changedHex.pinyin;
    document.getElementById('yjChangedMeaning').textContent = changedHex.judgment + ' · ' + changedHex.meaning;
    const cgEl = document.getElementById('yjChangedGua');
    cgEl.innerHTML = '';
    const clines = [changedGua[1][0],changedGua[1][1],changedGua[1][2],changedGua[0][0],changedGua[0][1],changedGua[0][2]];
    for (let i = 5; i >= 0; i--) {
      const div = document.createElement('div');
      div.style.cssText = 'width:70px;height:8px;position:relative;margin:2px 0';
      div.innerHTML = clines[i]
        ? `<div style="position:absolute;left:0;right:0;top:3px;height:3px;background:var(--jade);border-radius:1px"></div>`
        : `<div style="position:absolute;left:0;right:50%;top:3px;height:3px;background:var(--jade);border-radius:1px"></div><div style="position:absolute;left:50%;right:0;top:3px;height:3px;background:var(--jade);border-radius:1px"></div>`;
      cgEl.appendChild(div);
    }
  } else {
    arrow.style.display = 'none';
    changedCard.style.display = 'none';
  }

  // Interp
  const interp = YJ_INTERP[hexNum] || YJ_INTERP[1];
  const container = document.getElementById('yjInterpBlocks');
  container.innerHTML = '';

  const blocks = [
    { title:'象 数 总 述', text: interp.overview, accent:'blue-accent' },
    { title: yjMode === 'person' ? '人 盘 命 格' : '事 盘 时 局', text: yjMode === 'person' ? interp.person : interp.matter, accent:'violet-accent' },
    { title:'六 爻 变 化', text: changedHex ? `本卦${hex.name}卦，${movingLines.length}爻动，化${changedHex.name}卦。阴阳转换，事态将由本卦向变卦转化。` : '六爻安静，本卦自持。此卦所示之事，当守不宜变，静待时机。', accent: changedHex ? 'red-accent' : 'green-accent' },
    { title:'时 机 推 断', text: interp.timing, accent:'blue-accent' },
    { title:'方 向 指 引', text: interp.direction, accent:'green-accent' },
    { title:'智 慧 启 示', text: interp.advice, accent:'violet-accent' },
  ];

  for (const b of blocks) {
    const div = document.createElement('div');
    div.className = `interp-card ${b.accent}`;
    div.innerHTML = `<h5>${b.title}</h5><p>${b.text}</p>`;
    container.appendChild(div);
  }

  document.getElementById('yjResultSection').classList.add('visible');
  document.getElementById('yjResultSection').scrollIntoView({ behavior: 'smooth' });
}

// ============================================================
// NAVIGATION
// ============================================================

function showYijing() {
  document.getElementById('heroSection').style.display = 'none';
  document.getElementById('qimenArea').classList.remove('active');
  document.getElementById('yijingArea').classList.add('active');
  document.getElementById('yjDivSection').style.display = 'none';
  document.getElementById('yjResultSection').classList.remove('visible');
  document.getElementById('qimenArea').scrollTop = 0;
}

function showQimen() {
  document.getElementById('heroSection').style.display = 'none';
  document.getElementById('yijingArea').classList.remove('active');
  document.getElementById('qimenArea').classList.add('active');
  document.getElementById('qmResultSection').classList.remove('visible');
  document.getElementById('qimenArea').scrollTop = 0;
}

function resetAll() {
  document.getElementById('heroSection').style.display = 'flex';
  document.getElementById('yijingArea').classList.remove('active');
  document.getElementById('qimenArea').classList.remove('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Set default date
document.addEventListener('DOMContentLoaded', () => {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth()+1).padStart(2,'0');
  const d = String(today.getDate()).padStart(2,'0');
  const todayStr = `${y}-${m}-${d}`;
  if (document.getElementById('yjBirthInput')) document.getElementById('yjBirthInput').max = todayStr;
  if (document.getElementById('qmDateInput')) document.getElementById('qmDateInput').value = todayStr;
  document.getElementById('qmDateInput').max = todayStr;
});



function r40MiniSearch(){
  var q=document.getElementById('r40MiniQuery').value.trim();
  if(!q){alert('请输入查询关键词');return;}
  if(!window.R39_DUAL_CORE_KB){document.getElementById('r40MiniResult').innerHTML='<span style="opacity:.95">KB 加载中...</span>';return;}
  var results=r39SearchKB(q);
  var html='<div style="margin-bottom:6px;opacity:.6">命中 <b style="color:var(--gold)">'+results.length+'</b> 条 / 总 '+R39_DUAL_CORE_KB.length+' 条</div>';
  results.slice(0,4).forEach(function(e){
    html+='<div style="margin:6px 0;padding:8px;background:rgba(0,0,0,.25);border-radius:6px;border-left:3px solid var(--gold)"><b style="color:var(--gold);font-size:12px">'+e.title+'</b><div style="opacity:.7;margin-top:4px;line-height:1.7">'+e.content.substring(0,120)+'...</div></div>';
  });
  document.getElementById('r40MiniResult').innerHTML=html;
}
