// === 佛教节日固定农历日期知识库 ===
// 佛教节日按农历固定日期，不随公历变动
// 用于校验 getLunarFestival 返回的节日名与农历日期是否匹配
const BUDDHIST_FESTIVALS = {
  '1-8':  { name: '释迦牟尼成道日', aliases: ['佛成道日','腊八节'], type: '成道日', deity: '释迦牟尼佛', importance: 'high', note: '纪念佛陀菩提树下悟道，喝腊八粥。信众主要纪念日之一' },
  '2-8':  { name: '释迦牟尼出家日', aliases: ['佛出家日'], type: '出家日', deity: '释迦牟尼佛', importance: 'medium', note: '纪念太子舍弃王位出家修行。信众纪念较少，宜静心自省' },
  '2-15': { name: '释迦牟尼涅槃日', aliases: ['佛涅槃日'], type: '涅槃日', deity: '释迦牟尼佛', importance: 'medium', note: '纪念佛陀入灭。宜诵经回向，思考无常' },
  '2-19': { name: '观世音菩萨圣诞', aliases: ['观音圣诞'], type: '圣诞', deity: '观世音菩萨', importance: 'high', note: '观音三个纪念日中最隆重，信众主要纪念日。宜到寺庙祈福供花' },
  '4-8':  { name: '释迦牟尼佛诞日', aliases: ['浴佛节','佛诞日','佛诞'], type: '圣诞', deity: '释迦牟尼佛', importance: 'highest', note: '佛陀降生纪念日，佛教最重要节日。浴佛供灯持素，信众必纪念' },
  '4-15': { name: '佛吉祥日', aliases: ['卫塞节'], type: '圣诞', deity: '释迦牟尼佛', importance: 'medium', note: '南传佛教卫塞节，纪念佛陀诞生、成道、涅槃三合一' },
  '5-13': { name: '伽蓝菩萨圣诞', aliases: ['关帝圣诞','伽蓝菩萨'], type: '圣诞', deity: '伽蓝菩萨(关公)', importance: 'medium', note: '关公被尊为佛教护法神。宜诚信经营，到寺庙祈福' },
  '6-3':  { name: '韦驮菩萨圣诞', aliases: ['韦驮圣诞'], type: '圣诞', deity: '韦驮菩萨', importance: 'low', note: '护法神将圣诞。宜护持正法，诵楞严咒' },
  '6-19': { name: '观世音菩萨成道日', aliases: ['观音成道日'], type: '成道日', deity: '观世音菩萨', importance: 'high', note: '纪念观音证得果位。信众纪念日，宜诵大悲咒供花' },
  '7-13': { name: '大势至菩萨圣诞', aliases: ['大势至圣诞'], type: '圣诞', deity: '大势至菩萨', importance: 'low', note: '智慧光菩萨圣诞。宜供花供果，诵念佛圆通章' },
  '7-15': { name: '佛欢喜日', aliases: ['盂兰盆节','中元节'], type: '圣诞', deity: '十方僧众', importance: 'high', note: '僧自恣日，佛欢喜。盂兰盆节超度先人，信众主要纪念日' },
  '7-30': { name: '地藏王菩萨圣诞', aliases: ['地藏王圣诞','地藏圣诞'], type: '圣诞', deity: '地藏王菩萨', importance: 'high', note: '地藏菩萨「地狱不空誓不成佛」。信众主要纪念日，宜超度先人孝亲感恩' },
  '8-22': { name: '燃灯佛圣诞', aliases: ['燃灯古佛圣诞'], type: '圣诞', deity: '燃灯古佛', importance: 'low', note: '过去佛圣诞。宜供灯祈福，开智慧' },
  '9-19': { name: '观世音菩萨出家日', aliases: ['观音出家日'], type: '出家日', deity: '观世音菩萨', importance: 'medium', note: '纪念观音发心出家。信众纪念日，宜放生布施诵普门品' },
  '9-30': { name: '药师琉璃光佛圣诞', aliases: ['药师佛圣诞'], type: '圣诞', deity: '药师佛', importance: 'high', note: '消灾延寿佛圣诞。信众主要纪念日，宜供灯诵药师经祈健康' },
  '10-5': { name: '达摩祖师圣诞', aliases: ['达摩圣诞'], type: '圣诞', deity: '达摩祖师', importance: 'low', note: '禅宗初祖圣诞。宜静坐冥想，诵血脉论' },
  '11-17': { name: '阿弥陀佛圣诞', aliases: ['弥陀圣诞'], type: '圣诞', deity: '阿弥陀佛', importance: 'high', note: '接引佛圣诞。信众主要纪念日，宜诵佛号回向，发愿往生' },
  '12-8': { name: '释迦牟尼成道日', aliases: ['佛成道日','腊八'], type: '成道日', deity: '释迦牟尼佛', importance: 'high', note: '腊八节，纪念佛陀悟道。喝腊八粥供灯，信众主要纪念日' },
};

// 道教节日固定农历日期
const TAOIST_FESTIVALS = {
  '1-1':  { name: '春节', aliases: ['元始天尊圣诞','新年','正月初一'], type: '圣诞', deity: '元始天尊', importance: 'high', note: '正月初一，道教认为也是元始天尊圣诞。民间最重要传统节日' },
  '1-9':  { name: '玉皇大帝圣诞', aliases: ['玉皇诞','天公生'], type: '圣诞', deity: '玉皇大帝', importance: 'high', note: '正月初九，天公生。道教最高神之一，管天地万物命运赐福。信众主要纪念日' },
  '2-2':  { name: '土地公圣诞', aliases: ['土地诞','福德正神圣诞'], type: '圣诞', deity: '土地公', importance: 'medium', note: '二月初二，土地诞。管地方平安财运。也是龙抬头' },
  '2-15': { name: '太上老君圣诞', aliases: ['老子圣诞','道德天尊圣诞'], type: '圣诞', deity: '太上老君', importance: 'high', note: '二月十五，老子圣诞。道教三清之一，管大道智慧长寿。信众主要纪念日' },
  '3-3':  { name: '王母娘娘圣诞', aliases: ['真武大帝圣诞','蟠桃会','上巳节'], type: '圣诞', deity: '西王母', importance: 'medium', note: '三月初三，西王母圣诞/蟠桃会。管女仙长寿婚姻子嗣。也是上巳节' },
  '3-15': { name: '张天师圣诞', aliases: ['张道陵圣诞'], type: '圣诞', deity: '张天师(张道陵)', importance: 'low', note: '三月十五，正一道创始人圣诞。管驱邪镇宅消灾' },
  '3-19': { name: '太阳星君圣诞', aliases: ['太阳诞','日宫天子圣诞'], type: '圣诞', deity: '太阳星君', importance: 'low', note: '三月十九，太阳诞。管光明温暖' },
  '4-14': { name: '吕祖纯阳真人圣诞', aliases: ['吕祖圣诞','吕洞宾圣诞'], type: '圣诞', deity: '吕洞宾', importance: 'medium', note: '四月十四，八仙之一/全真祖师圣诞。管修行治病度人' },
  '4-18': { name: '华佗神医先师圣诞', aliases: ['华佗圣诞'], type: '圣诞', deity: '华佗', importance: 'low', note: '四月十八，医神圣诞。管健康医药' },
  '6-24': { name: '关圣帝君圣诞', aliases: ['关公圣诞','关帝诞'], type: '圣诞', deity: '关圣帝君(关公)', importance: 'high', note: '六月二十四，武财神/忠义之神圣诞。管财运忠义驱邪官司。信众主要纪念日' },
  '7-22': { name: '财神赵公明圣诞', aliases: ['财神诞','玄坛真君圣诞'], type: '圣诞', deity: '财神赵公明', importance: 'high', note: '七月二十二，正财神圣诞。管天下财富偏财横财。信众主要求财日' },
  '8-3':  { name: '灶君诞', aliases: ['司命灶君诞','灶王爷圣诞'], type: '圣诞', deity: '灶王爷', importance: 'low', note: '八月初三，司命灶君诞。管家庭饮食平安' },
  '8-15': { name: '太阴星君圣诞', aliases: ['月娘诞','月光菩萨圣诞'], type: '圣诞', deity: '太阴星君', importance: 'low', note: '八月十五，月娘诞。管阴柔月亮。也是中秋节' },
  '9-9':  { name: '斗母星君圣诞', aliases: ['斗母诞','九皇大帝圣诞'], type: '圣诞', deity: '斗母星君', importance: 'medium', note: '九月初九，众星之母圣诞。管命运消灾延寿。也是重阳节' },
  '10-15': { name: '下元节', aliases: ['水官大帝圣诞'], type: '圣诞', deity: '水官大帝', importance: 'medium', note: '十月十五，水官大帝圣诞。三官大帝之一，管解厄消灾' },
  '11-11': { name: '太乙救苦天尊圣诞', aliases: ['太乙救苦天尊'], type: '圣诞', deity: '太乙救苦天尊', importance: 'medium', note: '十一月十一，救苦天尊圣诞。管救苦救难超度亡魂' },
  '12-16': { name: '南岳大帝圣诞', aliases: ['南岳诞'], type: '圣诞', deity: '南岳大帝', importance: 'low', note: '十二月十六，南岳大帝圣诞。管南方山水' },
  '12-23': { name: '祭灶节', aliases: ['小年','灶君上天','谢灶'], type: '民俗', deity: '灶王爷', importance: 'high', note: '十二月二十三(北方)/二十四(南方)，小年。灶王爷上天汇报，信众送灶神' },
  '12-30': { name: '除夕', aliases: ['大年夜','岁除'], type: '民俗', deity: null, importance: 'highest', note: '十二月最后一天(三十或廿九)，辞旧迎新。民间最重要节日之一' },
};

// 民间传统节日固定农历日期
const FOLK_FESTIVALS = {
  '1-15': { name: '元宵节', aliases: ['上元节','灯节','天官赐福日'] },
  '2-2':  { name: '龙抬头', aliases: ['春龙节','龙头节'] },
  '3-3':  { name: '上巳节', aliases: ['三月三'] },
  '5-5':  { name: '端午节', aliases: ['端阳节','龙舟节','五月节'] },
  '7-7':  { name: '七夕节', aliases: ['乞巧节','七巧节','中国情人节'] },
  '7-15': { name: '中元节', aliases: ['鬼节','七月半'] },
  '8-15': { name: '中秋节', aliases: ['团圆节','八月节'] },
  '9-9':  { name: '重阳节', aliases: ['登高节','敬老节'] },
  '12-8': { name: '腊八节', aliases: ['腊八'] },
};

// 孔子诞辰：农历八月廿七（公历9月28日为官方纪念日）
const CONFUCIUS_FESTIVAL = { lunar: '8-27', name: '孔子诞辰', aliases: ['至圣先师诞'], type: '诞辰', deity: '孔子', importance: 'medium', note: '农历八月廿七，万世师表诞辰。管学业考试功名师德。公历9月28日为官方教师节' };

/**
 * 校验节日名与农历日期是否匹配
 * @param {string} festName - 节日名
 * @param {string} lunarDate - 农历日期 '月-日'
 * @returns {object} { valid: bool, expected: string }
 */
function verifyFestivalDate(festName, lunarDate) {
  // 检查佛教节日
  for (var key in BUDDHIST_FESTIVALS) {
    var f = BUDDHIST_FESTIVALS[key];
    if (festName === f.name || f.aliases.indexOf(festName) >= 0) {
      if (key === lunarDate) return { valid: true, expected: key };
      // 12-8 和 1-8 都是释迦牟尼成道日（腊八），特殊处理
      if (f.name === '释迦牟尼成道日' && (lunarDate === '12-8' || lunarDate === '1-8')) {
        return { valid: true, expected: '12-8(标准) 或 1-8' };
      }
      return { valid: false, expected: key, actual: lunarDate, festName: festName };
    }
  }
  // 检查道教节日
  for (var key2 in TAOIST_FESTIVALS) {
    var t = TAOIST_FESTIVALS[key2];
    if (festName === t.name || t.aliases.indexOf(festName) >= 0) {
      if (key2 === lunarDate) return { valid: true, expected: key2 };
      return { valid: false, expected: key2, actual: lunarDate, festName: festName };
    }
  }
  // 检查民间节日
  for (var key3 in FOLK_FESTIVALS) {
    var ff = FOLK_FESTIVALS[key3];
    if (festName === ff.name || ff.aliases.indexOf(festName) >= 0) {
      if (key3 === lunarDate) return { valid: true, expected: key3 };
      return { valid: false, expected: key3, actual: lunarDate, festName: festName };
    }
  }
  // 检查孔子诞辰
  if (festName === CONFUCIUS_FESTIVAL.name || CONFUCIUS_FESTIVAL.aliases.indexOf(festName) >= 0) {
    if (CONFUCIUS_FESTIVAL.lunar === lunarDate) return { valid: true, expected: CONFUCIUS_FESTIVAL.lunar };
    return { valid: false, expected: CONFUCIUS_FESTIVAL.lunar, actual: lunarDate, festName: festName };
  }
  // 未知节日，不校验
  return { valid: true, expected: null, unknown: true };
}

// === 通胜十二建星标准宜忌数据库 ===
// 来源：《协纪辨方书》《通胜》标准宜忌
const STANDARD_JIANCHU_YIJI = {
  '建': {
    yi: ['入学','安抚','出行','上任','见贵','求职','祈福'],
    ji: ['动土','开仓','放债'],
    scene: { small: '适合短期小事(求职、见贵、出行)', large: '不宜动土开仓等长期大事' }
  },
  '除': {
    yi: ['治病','沐浴','祭祀','解除','扫舍','理发'],
    ji: ['求医疗病(除日)','出行'],
    scene: { small: '适合清除旧物、理发沐浴、治病疗伤', large: '不宜远行、不宜婚嫁' }
  },
  '满': {
    yi: ['祭祀','祈福','进人口','捕捉','畋猎','纳财'],
    ji: ['嫁娶','安葬','移徙','赴任'],
    scene: { small: '适合祈福祭祀、纳财进人', large: '不宜嫁娶安葬等终身大事' }
  },
  '平': {
    yi: ['修造','动土','平整道路','移徙'],
    ji: ['祭祀','祈福','开市','交易'],
    scene: { small: '适合修造平整等土木小事', large: '不宜开市祭祀祈福(平日本无吉凶)' }
  },
  '定': {
    yi: ['祭祀','祈福','冠笄','嫁娶','纳采','立券'],
    ji: ['诉讼','出行','词讼'],
    scene: { small: '适合签约定约、冠笄嫁娶等确定之事', large: '不宜诉讼出行' }
  },
  '执': {
    yi: ['捕捉','畋猎','祭祀','祈福','求嗣','签约'],
    ji: ['开市','移徙','出行','嫁娶'],
    scene: { small: '适合捕捉签约等执行之事', large: '不宜开市移徙嫁娶' }
  },
  '破': {
    yi: ['求医疗病','破屋坏垣','祭祀'],
    ji: ['嫁娶','开市','出行','冠笄','进人口'],
    scene: { small: '仅宜破旧(医疗、拆屋)，范围极窄', large: '不宜任何新建之事(嫁娶开市出行等)' }
  },
  '危': {
    yi: ['祭祀','祈福','安床','入殓','会友'],
    ji: ['登山','乘船','出行'],
    scene: { small: '仅宜祭祀祈福安床等小事', large: '不宜登山乘船出行等冒险之事' }
  },
  '成': {
    yi: ['入学','赴任','开市','交易','立券','纳财','嫁娶','祭祀','祈福','求嗣'],
    ji: ['诉讼','词讼','出行'],
    scene: { small: '适合开市交易立券等短期成事', large: '适合嫁娶赴任等长期大事；不宜诉讼' }
  },
  '收': {
    yi: ['祭祀','祈福','纳财','捕捉','畋猎','开市','交易','理发'],
    ji: ['出行','安葬'],
    scene: { small: '适合纳财交易理发等收束之事', large: '不宜出行安葬' }
  },
  '开': {
    yi: ['祭祀','祈福','赴任','上任','见贵','出行','入学','嫁娶','移徙','安床'],
    ji: ['安葬','伐木','畋猎','开仓','出货财'],
    scene: { small: '适合见贵出行入学等开启之事', large: '适合嫁娶赴任移徙等大事；不宜安葬伐木' }
  },
  '闭': {
    yi: ['筑堤防','补垣','塞穴','埋葬','安葬'],
    ji: ['开市','交易','出行','嫁娶','求医疗病','动土'],
    scene: { small: '仅宜筑堤塞穴等封闭之事', large: '不宜开市交易嫁娶等任何开放之事' }
  }
};

/**
 * 校验建除宜忌是否与标准库一致
 * @param {string} jianchu - 建除十二神名
 * @param {array} yi - 宜事列表
 * @param {array} ji - 忌事列表
 * @returns {object} { valid: bool, errors: [] }
 */
function verifyJianchuYiJi(jianchu, yi, ji) {
  var std = STANDARD_JIANCHU_YIJI[jianchu];
  if (!std) return { valid: true, errors: [], unknown: true };
  
  var errors = [];
  // 检查宜事是否都在标准宜里
  yi.forEach(function(item) {
    if (std.yi.indexOf(item) < 0 && std.ji.indexOf(item) >= 0) {
      errors.push('❌ "' + item + '" 在宜列表中，但标准库中属忌事');
    }
  });
  // 检查忌事是否都在标准忌里
  ji.forEach(function(item) {
    if (std.ji.indexOf(item) < 0 && std.yi.indexOf(item) >= 0) {
      errors.push('❌ "' + item + '" 在忌列表中，但标准库中属宜事');
    }
  });
  
  return { valid: errors.length === 0, errors: errors };
}

/**
 * 获取建星场景限制词
 * @param {string} jianchu - 建除十二神名
 * @returns {string} 场景描述
 */
function getJianchuScene(jianchu) {
  var std = STANDARD_JIANCHU_YIJI[jianchu];
  if (!std) return '';
  return std.scene.small + '；' + std.scene.large;
}

module.exports = {
  BUDDHIST_FESTIVALS,
  TAOIST_FESTIVALS,
  FOLK_FESTIVALS,
  CONFUCIUS_FESTIVAL,
  verifyFestivalDate,
  STANDARD_JIANCHU_YIJI,
  verifyJianchuYiJi,
  getJianchuScene
};
