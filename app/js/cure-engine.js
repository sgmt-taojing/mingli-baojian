/**
 * cure-engine.js — 化解方案引擎 v1.0
 * 
 * 功能：
 * 1. 各排盘引擎的化解方案（紫微/奇门/六壬/梅花/六爻/风水）
 * 2. 化解物品数据库 getCureItemCatalog()
 * 3. 年度变化化解方案 getAnnualCurePlan()
 * 4. 家庭成员化解方案 getFamilyCurePlan()
 * 5. 会员分级化解
 * 
 * 引用古籍：《协纪辨方书》《选择通德类情》《永宁通书》《钦定授时通考》《阳宅集成》《八宅明镜》《玄空秘旨》
 */

// ================================================================
// 一、紫微斗数化解方案
// ================================================================

/**
 * 紫微斗数排盘后化解方案
 * @param {object} panData - ziweiPaiPan() 返回的排盘数据
 * @param {object} analyzeData - ziweiAnalysis() 返回的分析数据
 * @returns {string} HTML 化解方案
 */
function getZiweiResolution(panData, analyzeData) {
  if (!panData) return '<p style="opacity:.5">排盘数据缺失，无法生成化解方案</p>';

  let mingZhi = panData.mingZhi || '未知';
  let ju = panData.ju || '未知';
  let sihua = analyzeData ? analyzeData.sihuaText : '';
  let geju = analyzeData ? analyzeData.geju : '';

  const html = '<div class="cure-resolution-block" style="margin-top:20px;padding:20px;background:linear-gradient(135deg,rgba(201,168,76,0.06),rgba(0,0,0,0.3));border:1px solid rgba(201,168,76,0.25);border-radius:12px">';
  html += '<h4 style="color:var(--gold);letter-spacing:3px;margin-bottom:16px">🛡️ 紫微斗数化解方案</h4>';
  html += '<p style="font-size:12px;opacity:.5;margin-bottom:16px">命宫：' + mingZhi + ' · 五行局：' + ju + ' · 格局：' + geju + '</p>';

  // 1. 命宫主星化解
  html += '<div style="margin-bottom:20px">';
  html += '<h5 style="font-size:13px;color:var(--gold);letter-spacing:2px;margin-bottom:10px">⭐ 命宫主星化解</h5>';
  html += _getZiweiMainStarCure(panData);
  html += '</div>';

  // 2. 煞星化解
  html += '<div style="margin-bottom:20px">';
  html += '<h5 style="font-size:13px;color:var(--gold);letter-spacing:2px;margin-bottom:10px">⚔️ 煞星化解</h5>';
  html += _getZiweiShaCure(panData);
  html += '</div>';

  // 3. 四化应对
  html += '<div style="margin-bottom:20px">';
  html += '<h5 style="font-size:13px;color:var(--gold);letter-spacing:2px;margin-bottom:10px">🔄 四化应对</h5>';
  html += _getZiweiSihuaCure(panData, analyzeData);
  html += '</div>';

  // 4. 大运十年化解重点
  html += '<div style="margin-bottom:20px">';
  html += '<h5 style="font-size:13px;color:var(--gold);letter-spacing:2px;margin-bottom:10px">📅 大运十年化解重点</h5>';
  html += _getZiweiDayunCure(panData);
  html += '</div>';

  // 5. 流年化解方案
  html += '<div style="margin-bottom:8px">';
  html += '<h5 style="font-size:13px;color:var(--gold);letter-spacing:2px;margin-bottom:10px">🌠 流年化解方案</h5>';
  html += _getZiweiLiunianCure(panData);
  html += '</div>';

  html += '<p style="font-size:11px;opacity:.4;margin-top:16px;line-height:1.8">《紫微斗数全书》云：「星曜吉凶非定数，化解有道可转机。」以上方案结合命宫主星、煞星、四化及大运流年综合制定，缘主可据实际情况选取执行。</p>';
  html += '</div>';
  return html;
}

function _getZiweiMainStarCure(panData) {
  // 十四主星化解方案数据库
  let starCureDB = {
    '紫微': {
      summary: '紫微为帝星，主尊贵领导，但帝星孤高，需辅弼相助',
      advice: '1. 佩戴黄水晶增强帝王之气；2. 办公室正北方位放置龙形摆件；3. 多穿金色、黄色衣物增强气场；4. 家中客厅悬挂山水画，寓意「靠山稳固」',
      item: '黄水晶球、铜龙摆件、金色锦囊',
      direction: '正北、西北',
      timing: '冬季(子月)安奉效果最佳'
    },
    '天机': {
      summary: '天机主智慧谋略，但多思多虑易神经紧张',
      advice: '1. 佩戴白水晶或紫水晶安定心神；2. 书房东南方放文昌塔；3. 多穿蓝色、绿色衣物；4. 每日卯时(5-7点)冥想15分钟',
      item: '白水晶柱、文昌塔、绿幽灵手串',
      direction: '东南、正东',
      timing: '春季(卯月)启动学业或智慧提升'
    },
    '太阳': {
      summary: '太阳主光明博爱，男命主自身，女命主夫星',
      advice: '1. 佩戴琥珀或红玛瑙增强阳气；2. 客厅正南方放红色花瓶；3. 多穿红色、橙色衣物；4. 早晨面向东方晒太阳15分钟',
      item: '琥珀手串、红色花瓶、红玛瑙',
      direction: '正南、正东',
      timing: '夏季(午月)阳气最旺时调整'
    },
    '武曲': {
      summary: '武曲主财星，刚毅果断，但过刚易折',
      advice: '1. 佩戴金饰或白水晶增强金气；2. 财位(正西或西北)放铜葫芦或聚宝盆；3. 多穿白色、金色衣物；4. 避免过度固执，学柔和之道',
      item: '铜葫芦、聚宝盆、金银手镯',
      direction: '正西、西北',
      timing: '秋季(酉月)金旺时布局财位'
    },
    '天同': {
      summary: '天同主福乐安逸，但易懒散缺乏动力',
      advice: '1. 佩戴绿幽灵或翡翠增强木气生发；2. 办公室东方放绿色植物；3. 多穿绿色、青色衣物；4. 设定明确目标，避免过度安逸',
      item: '绿幽灵水晶、翡翠手串、绿色盆栽',
      direction: '正东、东南',
      timing: '春季(寅月)启动新计划'
    },
    '廉贞': {
      summary: '廉贞主囚星，次桃花，易有官非感情纠纷',
      advice: '1. 佩戴黑曜石化解桃花煞；2. 家中正北放黑曜石葫芦；3. 多穿黑色、深蓝色衣物；4. 避免去声色场所，修身养性',
      item: '黑曜石葫芦、黑曜石手串、深蓝水晶',
      direction: '正北',
      timing: '冬季(子月)化解官非效果佳'
    },
    '天府': {
      summary: '天府主财库，稳重保守，但缺乏冲劲',
      advice: '1. 佩戴黄水晶或和田玉增强财库；2. 家中西南方放陶瓷聚宝盆；3. 多穿黄色、棕色衣物；4. 适当投资理财，勿过度保守',
      item: '黄水晶聚宝盆、和田玉、陶瓷存钱罐',
      direction: '西南、中央',
      timing: '四季月(辰未戌丑月)稳固财库'
    },
    '太阴': {
      summary: '太阴主月亮，温柔细腻，女命主自身，男命主妻',
      advice: '1. 佩戴月光石或白水晶增强阴柔之力；2. 卧室西方放白色花瓶插鲜花；3. 多穿白色、银色衣物；4. 农历十五赏月纳气',
      item: '月光石手串、白色花瓶、白水晶',
      direction: '正西、西北',
      timing: '农历十五(月圆)纳阴气'
    },
    '贪狼': {
      summary: '贪狼主桃花欲望，多才多艺但易沉迷',
      advice: '1. 佩戴粉晶或草莓晶化解桃花过旺；2. 家中正南放粉色水晶球；3. 多穿粉色、紫色衣物；4. 培养正当爱好，避免沉迷酒色',
      item: '粉水晶球、草莓晶手串、紫色摆件',
      direction: '正南、东南',
      timing: '春季(卯月)桃花位布局'
    },
    '巨门': {
      summary: '巨门主口舌暗曜，易有是非争议',
      advice: '1. 佩戴蓝水晶或海蓝宝化解口舌；2. 家中正北放蓝色水晶簇；3. 多穿蓝色、黑色衣物；4. 慎言慎行，避免背后议论他人',
      item: '蓝水晶簇、海蓝宝手串、蓝色花瓶',
      direction: '正北',
      timing: '冬季(亥月)化解口舌'
    },
    '天相': {
      summary: '天相主印星辅佐，但易受制于人',
      advice: '1. 佩戴虎眼石或黄水晶增强决断；2. 办公室中央放黄色水晶柱；3. 多穿黄色、金色衣物；4. 培养独立判断，避免盲从',
      item: '虎眼石手串、黄水晶柱、金色印章',
      direction: '中央、西南',
      timing: '四季月稳固印星'
    },
    '天梁': {
      summary: '天梁主荫星，逢凶化吉，但易有孤克',
      advice: '1. 佩戴檀木手串或翡翠增强木气；2. 家中东方放绿色植物；3. 多穿绿色、青色衣物；4. 多行善积德，发挥荫星庇佑之力',
      item: '檀木手串、翡翠挂件、绿色盆栽',
      direction: '正东、东南',
      timing: '春季(寅月)增强荫星'
    },
    '七杀': {
      summary: '七杀主将星，刚猛冲动，易有意外',
      advice: '1. 佩戴黑曜石或茶晶化解煞气；2. 家中正北放黑曜石麒麟；3. 多穿黑色、深灰衣物；4. 避免冲动决策，三思而后行',
      item: '黑曜石麒麟、茶晶手串、黑色摆件',
      direction: '正北',
      timing: '冬季(子月)化解煞气'
    },
    '破军': {
      summary: '破军主耗星，破旧立新，但易破财破感情',
      advice: '1. 佩戴黄水晶或金发晶守住财运；2. 家中西方放黄水晶簇；3. 多穿黄色、白色衣物；4. 变动前做好充分准备，避免盲目行动',
      item: '黄水晶簇、金发晶手串、白色摆件',
      direction: '正西、西北',
      timing: '秋季(申月)稳固财运'
    }
  };

  // 尝试获取命宫主星
  const mainStar = '';
  if (panData.palaces) {
    for (let i = 0; i < panData.palaces.length; i++) {
      if (panData.palaces[i].name === '命宫' || panData.palaces[i].zhi === panData.mingZhi) {
        mainStar = panData.palaces[i].stars ? panData.palaces[i].stars.join('') : '';
        break;
      }
    }
  }
  if (!mainStar && analyzeData && analyzeData.mainStar) mainStar = analyzeData.mainStar;
  if (!mainStar) mainStar = '紫微'; // 默认

  // 匹配主星
  const matchedKey = null;
  for (let key in starCureDB) {
    if (mainStar.indexOf(key) >= 0) { matchedKey = key; break; }
  }
  if (!matchedKey) matchedKey = '紫微';

  let d = starCureDB[matchedKey];
  const html = '<div style="background:rgba(255,255,255,0.02);padding:14px;border-radius:8px;border:1px solid rgba(201,168,76,0.1)">';
  html += '<p style="margin-bottom:8px"><strong>主星：</strong>' + matchedKey + ' — ' + d.summary + '</p>';
  html += '<div style="margin-top:10px;padding:10px;background:rgba(201,168,76,0.04);border-radius:6px">';
  html += '<p style="font-size:12px;line-height:2">' + d.advice + '</p>';
  html += '</div>';
  html += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px;font-size:12px">';
  html += '<div><span style="opacity:.5">推荐物品</span><br><span style="color:var(--gold)">' + d.item + '</span></div>';
  html += '<div><span style="opacity:.5">摆放方位</span><br><span>' + d.direction + '</span></div>';
  html += '<div><span style="opacity:.5">最佳时辰</span><br><span>' + d.timing + '</span></div>';
  html += '</div>';
  html += '</div>';
  return html;
}

function _getZiweiShaCure(panData) {
  let shaCureDB = {
    '擎羊': { cure: '佩戴白水晶或银饰化解刀刃之煞；家中正西放铜麒麟一对', item: '白水晶、铜麒麟', direction: '正西', classic: '《紫微斗数全书》：「擎羊主刀刃血光，宜以金化之。」' },
    '陀罗': { cure: '佩戴茶晶或黑曜石化解拖延之煞；家中东北方放黑曜石葫芦', item: '茶晶、黑曜石葫芦', direction: '东北', classic: '《紫微斗数全书》：「陀罗主拖延暗损，宜以土化之。」' },
    '火星': { cure: '佩戴海蓝宝或蓝水晶化解火燥之煞；家中正北放蓝色水晶簇', item: '海蓝宝、蓝水晶簇', direction: '正北', classic: '《紫微斗数全书》：「火星主暴败，宜以水制之。」' },
    '铃星': { cure: '佩戴黑曜石或墨玉化解阴火之煞；家中西北放黑色摆件', item: '黑曜石、墨玉摆件', direction: '西北', classic: '《紫微斗数全书》：「铃星主暗耗，宜以水泄之。」' },
    '地空': { cure: '佩戴黄水晶或金发晶填补空亡；家中中央放黄水晶球', item: '黄水晶球、金发晶', direction: '中央', classic: '《紫微斗数全书》：「地空主空虚破财，宜以土填之。」' },
    '地劫': { cure: '佩戴和田玉或翡翠化解劫夺之煞；家中西南放陶瓷葫芦', item: '和田玉、陶瓷葫芦', direction: '西南', classic: '《紫微斗数全书》：「地劫主劫失，宜以土固之。」' }
  };

  const html = '<div style="background:rgba(255,255,255,0.02);padding:14px;border-radius:8px;border:1px solid rgba(201,168,76,0.1)">';
  const hasSha = false;
  for (let sha in shaCureDB) {
    // 检查排盘中是否有此煞星
    const found = false;
    if (panData.palaces) {
      for (let i = 0; i < panData.palaces.length; i++) {
        let stars = panData.palaces[i].stars || [];
        let allStars = stars.join('');
        if (allStars.indexOf(sha) >= 0) { found = true; break; }
      }
    }
    if (found) {
      hasSha = true;
      let d = shaCureDB[sha];
      html += '<div style="margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid rgba(201,168,76,0.06)">';
      html += '<p><strong style="color:var(--orange)">' + sha + '</strong></p>';
      html += '<p style="font-size:12px;line-height:1.8;margin-top:4px">' + d.cure + '</p>';
      html += '<div style="display:flex;gap:16px;margin-top:6px;font-size:11px;opacity:.7">';
      html += '<span>📦 物品：' + d.item + '</span>';
      html += '<span>🧭 方位：' + d.direction + '</span>';
      html += '</div>';
      html += '<p style="font-size:10px;opacity:.4;margin-top:4px">' + d.classic + '</p>';
      html += '</div>';
    }
  }
  if (!hasSha) {
    html += '<p style="opacity:.6;font-size:12px">命盘中六煞星不明显，无需特别化解。日常注意修身养性即可。</p>';
  }
  html += '</div>';
  return html;
}

function _getZiweiSihuaCure(panData, analyzeData) {
  let sihuaCureDB = {
    '化禄': { desc: '化禄主财运亨通，为吉化', cure: '宜在财位(根据命主日干定)放聚宝盆或黄水晶，增强化禄之财气。多行布施积累福报，使禄星更旺。', item: '聚宝盆、黄水晶', classic: '化禄为财，宜守不宜散' },
    '化权': { desc: '化权主权势提升，为吉化', cure: '宜在事业位(西北)放铜马或龙印，增强化权之权势。但权大势大需以德服人，避免专横。', item: '铜马、龙印', classic: '化权为威，宜德不宜暴' },
    '化科': { desc: '化科主名声学业，为吉化', cure: '宜在文昌位(东南)放文昌塔或毛笔架，增强化科之名声。多读书学习，参加考试比赛。', item: '文昌塔、毛笔架', classic: '化科为名，宜学不宜怠' },
    '化忌': { desc: '化忌主阻滞困扰，为凶化', cure: '化忌是最需化解的四化。1. 佩戴黑曜石化解忌星之煞；2. 根据化忌所在宫位调整方位；3. 多行善事积累功德；4. 避免在化忌所主事项上强求。', item: '黑曜石手串、五行化解符', classic: '化忌为困，宜忍不宜争' }
  };

  const html = '<div style="background:rgba(255,255,255,0.02);padding:14px;border-radius:8px;border:1px solid rgba(201,168,76,0.1)">';
  let sihuaText = (analyzeData && analyzeData.sihuaText) ? analyzeData.sihuaText : '';
  for (let hua in sihuaCureDB) {
    if (sihuaText.indexOf(hua) >= 0 ) {
      let d = sihuaCureDB[hua];
      let isJi = (hua === '化忌');
      html += '<div style="margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid rgba(201,168,76,0.06)';
      if (isJi) html += ';background:rgba(231,76,60,0.03);padding:10px;border-radius:6px';
      html += '">';
      html += '<p><strong style="color:' + (isJi ? 'var(--orange)' : 'var(--gold)') + '">' + hua + '</strong> — ' + d.desc + '</p>';
      html += '<p style="font-size:12px;line-height:1.8;margin-top:4px">' + d.cure + '</p>';
      html += '<div style="display:flex;gap:16px;margin-top:6px;font-size:11px;opacity:.7">';
      html += '<span>📦 物品：' + d.item + '</span>';
      html += '<span>📖 ' + d.classic + '</span>';
      html += '</div>';
      html += '</div>';
    }
  }
  html += '</div>';
  return html;
}

function _getZiweiDayunCure(panData) {
  const html = '<div style="background:rgba(255,255,255,0.02);padding:14px;border-radius:8px;border:1px solid rgba(201,168,76,0.1)">';
  html += '<p style="font-size:12px;line-height:2">大运十年一转，需根据当前大运宫位星曜调整化解方案：</p>';
  html += '<ul style="font-size:12px;line-height:2;padding-left:20px;opacity:.85">';
  html += '<li><strong>大运遇紫微、天府：</strong>此运事业财运俱佳，宜在西北放铜龙增强帝星之力，把握机遇大胆发展</li>';
  html += '<li><strong>大运遇七杀、破军：</strong>此运变动大，宜佩戴黑曜石化解煞气，避免冲动决策，以守代攻</li>';
  html += '<li><strong>大运遇太阳、太阴：</strong>此运阴阳调和，宜在正南放红色花瓶、正北放蓝色水晶，平衡阴阳</li>';
  html += '<li><strong>大运遇贪狼、廉贞：</strong>此运桃花官非并存，宜佩戴粉晶化解桃花，佩戴黑曜石防官非</li>';
  html += '<li><strong>大运遇化忌星：</strong>此运多阻滞，宜根据化忌所在宫位针对性化解，多行善积德</li>';
  html += '<li><strong>大运交接口：</strong>大运交接年份(每十年一次)需特别注意，建议年初拜太岁，调整居家布局</li>';
  html += '</ul>';
  html += '<p style="font-size:11px;opacity:.4;margin-top:8px">《紫微斗数全书》云：「大运十年一变，吉凶随星而转。知星之吉凶，方知化解之道。」</p>';
  html += '</div>';
  return html;
}

function _getZiweiLiunianCure(panData) {
  let currentYear = new Date().getFullYear();
  const html = '<div style="background:rgba(255,255,255,0.02);padding:14px;border-radius:8px;border:1px solid rgba(201,168,76,0.1)">';
  html += '<p style="font-size:12px;line-height:2">' + currentYear + '年 丙午流年化解方案：</p>';
  html += '<ul style="font-size:12px;line-height:2;padding-left:20px;opacity:.85">';
  html += '<li><strong>流年太岁：</strong>丙午年太岁在午(正南方)，不宜在正南方动土修造，可在此方位安放太岁符</li>';
  html += '<li><strong>流年三煞：</strong>丙午年三煞在正北(亥子丑方)，正北不宜动土，可放黑曜石麒麟化解</li>';
  html += '<li><strong>流年五黄：</strong>' + currentYear + '年五黄大煞在正北，宜挂铜铃或放铜葫芦化解五黄之煞</li>';
  html += '<li><strong>流年二黑：</strong>' + currentYear + '年二黑病符在西南，宜放铜葫芦或六帝钱化解病符</li>';
  html += '<li><strong>流年文昌：</strong>丙午年文昌在东南，宜在东南放文昌塔或四支毛笔，利考试学业</li>';
  html += '<li><strong>流年桃花：</strong>丙午年桃花在卯(正东)，单身者宜在正东放粉色水晶球催桃花</li>';
  html += '</ul>';

  html += '</div>';
  return html;
}

// ================================================================
// 二、奇门遁甲化解方案
// ================================================================

function getQimenResolution(panData, analyzeData) {
  if (!panData) return '<p style="opacity:.5">排盘数据缺失，无法生成化解方案</p>';

  const html = '<div class="cure-resolution-block" style="margin-top:20px;padding:20px;background:linear-gradient(135deg,rgba(201,168,76,0.06),rgba(0,0,0,0.3));border:1px solid rgba(201,168,76,0.25);border-radius:12px">';
  html += '<h4 style="color:var(--gold);letter-spacing:3px;margin-bottom:16px">🛡️ 奇门遁甲化解方案</h4>';
  html += '<p style="font-size:12px;opacity:.5;margin-bottom:16px">遁局：' + (panData.dun === 'yang' ? '阳' : '阴') + '遁' + panData.ju + '局</p>';

  // 1. 八门吉凶化解
  html += '<div style="margin-bottom:20px">';
  html += '<h5 style="font-size:13px;color:var(--gold);letter-spacing:2px;margin-bottom:10px">🚪 八门吉凶化解</h5>';
  html += _getQimenMenCure(analyzeData);
  html += '</div>';

  // 2. 九星化解
  html += '<div style="margin-bottom:20px">';
  html += '<h5 style="font-size:13px;color:var(--gold);letter-spacing:2px;margin-bottom:10px">⭐ 九星化解</h5>';
  html += _getQimenXingCure(analyzeData);
  html += '</div>';

  // 3. 八神化解
  html += '<div style="margin-bottom:20px">';
  html += '<h5 style="font-size:13px;color:var(--gold);letter-spacing:2px;margin-bottom:10px">👻 八神化解</h5>';
  html += _getQimenShenCure(analyzeData);
  html += '</div>';

  // 4. 伏吟反吟处理
  html += '<div style="margin-bottom:8px">';
  html += '<h5 style="font-size:13px;color:var(--gold);letter-spacing:2px;margin-bottom:10px">🔄 伏吟/反吟处理</h5>';
  html += _getQimenFuFanCure(panData, analyzeData);
  html += '</div>';

  html += '<p style="font-size:11px;opacity:.4;margin-top:16px;line-height:1.8">《奇门遁甲秘笈大全》云：「门星神三盘各有吉凶，善用者趋吉避凶，不善用者凶上加凶。」以上方案据三盘综合制定。</p>';
  html += '</div>';
  return html;
}

function _getQimenMenCure(analyzeData) {
  // [舒晗课程校正] 八门象意与化解 — 依据密训班11-12课八门九星八神象意
  let menCureDB = {
    '开门': { nature: '吉门', desc: '开门主通达开拓，利求职见贵、升迁调动、开创事业', cure: '[舒晗课程校正] 开门为金，利西北方行事。开门临宫百事可为，佩戴白水晶增强开门之吉。开门受克（火克金）则权力受损，需用土通关（放黄色陶瓷物）', item: '白水晶、金属摆件、铜龙' },
    '休门': { nature: '吉门', desc: '休门主安养休息，利求财安养、婚恋和合、暗中谋划', cure: '[舒晗课程校正] 休门为水，利正北方休养。休门临宫宜守不宜攻，佩戴海蓝宝增强休门之吉。休门受克（土克水）则安养不成，需用金通关（放白色金属物）', item: '海蓝宝、蓝色摆件、水晶球' },
    '生门': { nature: '吉门', desc: '生门主生发财运，利经营求财、置业搬家、种植养殖', cure: '[舒晗课程校正] 生门为土，利东北方求财。生门临宫财源广进，佩戴黄水晶增强生门之吉。生门催财四维实操：1.定位（以家中经济支柱命盘找生门落宫）；2.选物（聚宝盆内置铜钱、大米、五帝钱/水晶）；3.择时（早上7-11点辰巳时阳气上升期）；4.定向（聚宝盆下垫红纸，书写该人生辰八字）。正财看戊土，偏财看丁奇', item: '黄水晶、聚宝盆、五帝钱' },
    '伤门': { nature: '凶门', desc: '伤门主伤害争斗，利讨债捕捉（古法），现代主口舌争执', cure: '[舒晗课程校正] 伤门为木，主伤害。化解用通关法（木克土用火通关，放红色物品）。1.佩戴黑曜石化解伤门之煞；2.避免东方行事；3.家中正东放黑曜石麒麟。伤门临中宫/坤宫主外伤', item: '黑曜石麒麟、黑曜石手串、红色装饰' },
    '杜门': { nature: '凶门', desc: '杜门主闭塞不通，利躲灾避难（古法），现代主技术钻研', cure: '[舒晗课程校正] 杜门为木，主闭塞。化解用五行调和法（补宫位之不足）。1.佩戴绿幽灵化解杜门之塞；2.东南方放绿色植物疏通；3.多与人沟通，避免封闭。杜门临乾宫主事业受阻，宜主动突破', item: '绿幽灵水晶、绿色盆栽、文昌塔' },
    '景门': { nature: '平门', desc: '景门主文书信息，利考试面试、文书合同、文化传播', cure: '[舒晗课程校正] 景门为火，主文书考试。宜在南方放红色花瓶增强文书运，考试面试可向南方。景门临吉宫则金榜题名，临凶宫则文书不利。兼看丁奇（文书用神）', item: '红色花瓶、红玛瑙、紫水晶' },
    '死门': { nature: '凶门', desc: '死门主死亡凶险，不利吉事，古法利狩猎丧葬', cure: '[舒晗课程校正] 死门为土，主死气。化解用通关法（土克水用金通关，放白色金属物）。1.佩戴黑曜石或墨玉化解死门之煞；2.绝对避免西南方行事；3.家中西南放铜葫芦化解。死门临坎宫（土克水）最凶，须用金通关', item: '黑曜石、铜葫芦、墨玉、白色金属物' },
    '惊门': { nature: '凶门', desc: '惊门主惊恐口舌，利诉讼（古法），现代主口舌是非', cure: '[舒晗课程校正] 惊门为金，主口舌惊恐。化解用通关法（金克木用水通关，放黑色/蓝色物品）。1.佩戴蓝水晶化解惊门之煞；2.避免正西方行事；3.家中正西放蓝色水晶簇。惊门临震宫（金克木）主口舌伤人', item: '蓝水晶、蓝色水晶簇、黑色摆件' }
  };

  let men = analyzeData ? analyzeData.men : '';
  const html = '<div style="background:rgba(255,255,255,0.02);padding:14px;border-radius:8px;border:1px solid rgba(201,168,76,0.1)">';

  for (let m in menCureDB) {
    if (men.indexOf(m) >= 0 ) {
      let d = menCureDB[m];
      let isJi = (d.nature === '凶门');
      html += '<div style="margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid rgba(201,168,76,0.04)';
      if (isJi) html += ';background:rgba(231,76,60,0.02);padding:8px;border-radius:4px';
      html += '">';
      html += '<p><strong style="color:' + (isJi ? 'var(--orange)' : 'var(--gold)') + '">' + m + '</strong> <span style="font-size:11px;opacity:.5">(' + d.nature + ')</span> — ' + d.desc + '</p>';
      html += '<p style="font-size:12px;line-height:1.8;margin-top:4px">' + d.cure + '</p>';
      html += '<p style="font-size:11px;opacity:.6;margin-top:2px">📦 推荐物品：' + d.item + '</p>';
      html += '</div>';
    }
  }
  html += '</div>';
  return html;
}

function _getQimenXingCure(analyzeData) {
  // [舒晗课程校正] 九星象意与化解 — 依据密训班11-12课八门九星八神象意
  let xingCureDB = {
    '天蓬': { nature: '凶星', desc: '天蓬主盗贼水灾，为大凶之星，主胆大妄为', cure: '[舒晗课程校正] 天蓬为水，主盗贼水灾。佩戴黑曜石化解，家中正北放黑曜石玄武。天蓬落坎宫（比和）则盗贼猖獗，落离宫（水克火）则水灾血光' },
    '天芮': { nature: '凶星', desc: '天芮主疾病缠身，为大凶之星，病星所在即为病位', cure: '[舒晗课程校正] 天芮为土，主疾病。佩戴和田玉化解，家中西南放铜葫芦祛病。天芮落宫五行断病：落坎（土克水）主肾病泌尿，落震（木克土）主肝胆脾胃，落离（火生土）主心脏血液' },
    '天冲': { nature: '凶星', desc: '天冲主冲动伤损，为中凶星，主急躁冲动', cure: '[舒晗课程校正] 天冲为木，主冲动伤损。佩戴茶晶化解，家中正东放黑曜石麒麟。天冲临震宫（比和）则冲动更甚，宜静守勿动' },
    '天辅': { nature: '吉星', desc: '天辅主文教辅佐，为大吉星，文昌星，利考试学业', cure: '[舒晗课程校正] 天辅为木，主文教。佩戴文昌石增强，东南方放文昌塔。天辅临巽宫（比和）则文运大旺，利考试升学。天辅为学业用神之首' },
    '天禽': { nature: '吉星', desc: '天禽主稳重权威，为吉星，寄中宫，属土', cure: '[舒晗课程校正] 天禽为土，主稳重。佩戴黄水晶增强，中央放黄水晶球。天禽寄中宫，阳遁随艮8土宫，阴遁随坤2土宫，同气相求' },
    '天心': { nature: '吉星', desc: '天心主医疗延寿，为大吉星，主治病救人', cure: '[舒晗课程校正] 天心为金，主医药。佩戴白水晶增强，西北方放白色水晶簇。天心临乾宫（比和）则医术精湛，临离宫（火克金）则医道受阻' },
    '天柱': { nature: '凶星', desc: '天柱主破败惊恐，为凶星，主破财惊恐', cure: '[舒晗课程校正] 天柱为金，主破败。佩戴蓝水晶化解，正西方放蓝色摆件。天柱临兑宫（比和）则破败更甚，宜守不宜动' },
    '天任': { nature: '吉星', desc: '天任主富厚安泰，为吉星，主稳健积累', cure: '[舒晗课程校正] 天任为土，主富厚。佩戴翡翠增强，东北方放陶瓷聚宝盆。天任临艮宫（比和）则财厚福稳，利置业投资' },
    '天英': { nature: '凶星', desc: '天英主火炎血光，为中平偏凶，主暴躁血光', cure: '[舒晗课程校正] 天英为火，主血光。佩戴海蓝宝化解（水克火），正南方放蓝色水晶簇。天英临离宫（比和）则火炎更甚，防血光火灾' }
  };

  let star = analyzeData ? analyzeData.star : '';
  const html = '<div style="background:rgba(255,255,255,0.02);padding:14px;border-radius:8px;border:1px solid rgba(201,168,76,0.1)">';
  for (let x in xingCureDB) {
    if (star.indexOf(x) >= 0 ) {
      let d = xingCureDB[x];
      let isJi = (d.nature === '凶星');
      html += '<div style="margin-bottom:8px;padding:6px 0;';
      if (isJi) html += 'background:rgba(231,76,60,0.02);padding:8px;border-radius:4px';
      html += '">';
      html += '<p><strong style="color:' + (isJi ? 'var(--orange)' : 'var(--gold)') + '">' + x + '</strong> <span style="font-size:11px;opacity:.5">(' + d.nature + ')</span> — ' + d.desc + '</p>';
      html += '<p style="font-size:12px;line-height:1.8;margin-top:2px">' + d.cure + '</p>';
      html += '</div>';
    }
  }
  html += '</div>';
  return html;
}

function _getQimenShenCure(analyzeData) {
  // [舒晗课程校正] 八神象意与化解 — 依据密训班11-12课八门九星八神象意
  // 舒晗八神排列：值符→腾蛇→太阴→六合→白虎→玄武→九地→九天
  let shenCureDB = {
    '值符': { desc: '值符主贵人统领，为八神之首，最吉之神。主领导、贵人、正道', cure: '[舒晗课程校正] 值符为木，主贵人。佩戴黄水晶增强贵人运，西北方放铜龙。值符所落之宫百事可为，为当前主导力量，事态发展总纲' },
    '腾蛇': { desc: '腾蛇主虚惊怪异，为凶神。主虚惊、神经性、缠绕反复', cure: '[舒晗课程校正] 腾蛇为火，主虚惊怪异。佩戴黑曜石化解虚惊，家中放黑曜石葫芦。腾蛇临宫防神经衰弱、虚惊之事。测病主神经性疾患' },
    '太阴': { desc: '太阴主暗助荫庇，为吉神。主阴私暗助、女性贵人', cure: '[舒晗课程校正] 太阴为金，主暗助。佩戴月光石增强阴助，西方放白色花瓶。太阴临宫宜暗中谋划，女性贵人相助' },
    '六合': { desc: '六合主婚姻和合，为吉神。主合作、婚姻、中介', cure: '[舒晗课程校正] 六合为木，主和合。佩戴粉晶增强姻缘，东南方放粉色水晶球。六合为婚姻用神，临吉宫则姻缘可成。亦主合作顺利' },
    '白虎': { desc: '白虎主凶险血光，为大凶神。主刑伤、血光、口舌', cure: '[舒晗课程校正] 白虎为金，主凶险。佩戴黑曜石或铜麒麟化解白虎之煞，西方放铜麒麟。白虎临宫防血光刑伤，测事主争执强硬' },
    '玄武': { desc: '玄武主盗贼暗昧，为凶神。主暗昧、盗贼、欺骗', cure: '[舒晗课程校正] 玄武为水，主暗昧。佩戴黑曜石化解暗昧，正北放黑曜石玄武。玄武临宫防暗中小人、盗贼欺骗。测财主偏财/暗财' },
    '九地': { desc: '九地主稳固厚重，为吉神。主保守、稳定、埋伏', cure: '[舒晗课程校正] 九地为土，主稳固。佩戴和田玉增强稳固，西南放陶瓷摆件。九地临宫宜守不宜攻，利于稳固根基、保守经营' },
    '九天': { desc: '九天主高远威武，为吉神。主高远、出征、威武', cure: '[舒晗课程校正] 九天为金，主高远。佩戴白水晶增强气势，西北放金属鹰摆件。九天临宫宜主动出击、远行谋事，利武职公关' }
  };

  let shen = analyzeData ? analyzeData.shen : '';
  const html = '<div style="background:rgba(255,255,255,0.02);padding:14px;border-radius:8px;border:1px solid rgba(201,168,76,0.1)">';
  for (let s in shenCureDB) {
    if (shen.indexOf(s) >= 0 ) {
      let d = shenCureDB[s];
      html += '<div style="margin-bottom:6px;padding:4px 0">';
      html += '<p><strong style="color:var(--gold)">' + s + '</strong> — ' + d.desc + '</p>';
      html += '<p style="font-size:12px;line-height:1.8;margin-top:2px;opacity:.8">' + d.cure + '</p>';
      html += '</div>';
    }
  }
  html += '</div>';
  return html;
}

function _getQimenFuFanCure(panData, analyzeData) {
  // [舒晗课程校正] 伏吟反吟化解 — 依据密训笔记第2课
  // 核心总则：伏吟用冲（以动制静），反吟用合（以静制动）
  // 禁忌：四土之地不取四土之时（巽坤乾艮四角宫位化解不可用辰戌丑未四土之时）
  const html = '<div style="background:rgba(255,255,255,0.02);padding:14px;border-radius:8px;border:1px solid rgba(201,168,76,0.1)">';
  // [舒晗课程校正] 伏吟化解总则：用冲（以动制静）
  html += '<p style="font-size:12px;line-height:2"><strong>伏吟化解：</strong>[舒晗密训笔记第2课] 伏吟主静止、慢、痛、呻吟反复，宜守不宜攻，主旧事重来、疾病缠绵。化解总则：<strong>伏吟用冲（以动制静）</strong>。</p>';
  html += '<p style="font-size:12px;line-height:2;margin-top:6px;padding-left:12px">1. 佩戴开光白水晶或黑曜石疏通气场（黑曜石为动石，冲伏吟之静）；</p>';
  html += '<p style="font-size:12px;line-height:2;padding-left:12px">2. 家中中央放铜铃，每日摇晃三下破除伏吟之气（金声破静）；</p>';
  html += '<p style="font-size:12px;line-height:2;padding-left:12px">3. 多外出活动，避免久坐一处（以动态冲破静止）；</p>';
  html += '<p style="font-size:12px;line-height:2;padding-left:12px">4. 伏吟调理实操：选申月申日申时，属猴之人执行，透明水晶或黑曜石摆件置于西南方，摆件下方放置用红布书写的本人生辰八字。</p>';
  html += '<p style="font-size:11px;opacity:.5;margin-top:4px;padding-left:12px">伏吟分类：九星伏吟（动作太慢，坐失良机）、八门伏吟（人际关系慢热，测婚恋主冷暴力）、天干伏吟（性格缓慢，拖延症）</p>';
  // [舒晗课程校正] 反吟化解总则：用合（以静制动）
  html += '<p style="font-size:12px;line-height:2;margin-top:12px"><strong>反吟化解：</strong>[舒晗密训笔记第2课] 反吟主快而反复、波动变幻，欲速则不达。化解总则：<strong>反吟用合（以静制动）</strong>。</p>';
  html += '<p style="font-size:12px;line-height:2;margin-top:6px;padding-left:12px">1. 佩戴黑曜石稳定气场（黑曜石镇宅安神，合住反吟之动）；</p>';
  html += '<p style="font-size:12px;line-height:2;padding-left:12px">2. 家中正北放黑曜石麒麟一对（麒麟为瑞兽，合化凶气）；</p>';
  html += '<p style="font-size:12px;line-height:2;padding-left:12px">3. 做事反复确认，避免冲动决策（以静制动，不随反吟起伏）；</p>';
  html += '<p style="font-size:12px;line-height:2;padding-left:12px">4. 重要事项择吉日吉时进行（用时间之合化解空间之冲）；</p>';
  html += '<p style="font-size:12px;line-height:2;padding-left:12px">5. 反吟调理实操：选寅月寅日寅时，属虎之人执行，泰山石摆件置于东北方，摆件下方放置用红布书写的本人生辰八字。</p>';
  html += '<p style="font-size:11px;opacity:.5;margin-top:4px;padding-left:12px">反吟分类：九星反吟（机会稍纵即逝）、八门反吟（人际关系忽冷忽热）、天干反吟（急脾气，易冲动）</p>';
  // [舒晗课程校正] 重要说明
  html += '<p style="font-size:11px;line-height:2;margin-top:12px;padding:8px;background:rgba(231,76,60,0.04);border-radius:4px"><strong>⚠️ 重要说明：</strong>不论星伏吟、门伏吟、天干伏吟，只要出现任一伏吟或反吟，即视为该局为伏吟/反吟，调理方法相同。调理一律围绕本宫进行，调理的是整个盘的伏吟/反吟。禁忌：四土之地（巽坤乾艮四角宫位）不取四土之时（辰戌丑未）。</p>';
  html += '<p style="font-size:11px;opacity:.4;margin-top:8px">[舒晗密训] 「伏吟宜静不宜动，反吟宜缓不宜急。伏吟用冲以动制静，反吟用合以静制动。」</p>';
  html += '</div>';
  return html;
}

// ================================================================
// 三、大六壬化解方案
// ================================================================

function getLiurenResolution(panData, analyzeData) {
  if (!panData) return '<p style="opacity:.5">排盘数据缺失，无法生成化解方案</p>';

  const html = '<div class="cure-resolution-block" style="margin-top:20px;padding:20px;background:linear-gradient(135deg,rgba(201,168,76,0.06),rgba(0,0,0,0.3));border:1px solid rgba(201,168,76,0.25);border-radius:12px">';
  html += '<h4 style="color:var(--gold);letter-spacing:3px;margin-bottom:16px">🛡️ 大六壬化解方案</h4>';
  html += '<p style="font-size:12px;opacity:.5;margin-bottom:16px">日干支：' + (panData.dayGan || '') + (panData.dayZhi || '') + ' · 占时：' + (panData.shiZhi || '') + '</p>';

  // 1. 四课三传化解
  html += '<div style="margin-bottom:20px">';
  html += '<h5 style="font-size:13px;color:var(--gold);letter-spacing:2px;margin-bottom:10px">📜 四课三传化解</h5>';
  html += _getLiurenSanChuanCure(panData, analyzeData);
  html += '</div>';

  // 2. 天将化解
  html += '<div style="margin-bottom:20px">';
  html += '<h5 style="font-size:13px;color:var(--gold);letter-spacing:2px;margin-bottom:10px">👼 天将化解</h5>';
  html += _getLiurenTianJiangCure(panData, analyzeData);
  html += '</div>';

  // 3. 神煞化解
  html += '<div style="margin-bottom:8px">';
  html += '<h5 style="font-size:13px;color:var(--gold);letter-spacing:2px;margin-bottom:10px">⚡ 神煞化解</h5>';
  html += _getLiurenShenShaCure(panData, analyzeData);
  html += '</div>';

  html += '<p style="font-size:11px;opacity:.4;margin-top:16px;line-height:1.8">《大六壬大全》云：「壬通万物之灵，课演天地之机。知机者善化解，不明者随流转。」</p>';
  html += '</div>';
  return html;
}

function _getLiurenSanChuanCure(panData, analyzeData) {
  let sanChuan = panData.sanChuan || [];
  const html = '<div style="background:rgba(255,255,255,0.02);padding:14px;border-radius:8px;border:1px solid rgba(201,168,76,0.1)">';
  html += '<p style="font-size:12px;line-height:2">三传：' + (sanChuan.join(' → ') || '未知') + '</p>';
  html += '<ul style="font-size:12px;line-height:2;padding-left:20px;opacity:.85">';
  html += '<li><strong>初传化解：</strong>初传主事之始，若初传逢凶神，宜佩戴黑曜石化解。初传逢吉神则顺其自然，佩戴白水晶增强吉气</li>';
  html += '<li><strong>中传化解：</strong>中传主事之中，若中传逢刑冲破害，宜在家中中央放铜葫芦化解。中传逢生旺则佩戴黄水晶增强</li>';
  html += '<li><strong>末传化解：</strong>末传主事之终，若末传逢凶，宜在末传方位放黑曜石麒麟。末传逢吉则佩戴和田玉稳固结局</li>';
  html += '<li><strong>四课克处：</strong>四课中克多则煞重，宜佩戴五行对应水晶平衡。上克下宜以铜器化解，下克上宜以水晶化解</li>';
  html += '</ul>';
  html += '<p style="font-size:11px;opacity:.4;margin-top:8px">《六壬大全》：「三传定吉凶，四课明生克。化解之道，在于扶弱抑强。」</p>';
  html += '</div>';
  return html;
}

function _getLiurenTianJiangCure(panData, analyzeData) {
  let tianJiangCureDB = {
    '贵人': { cure: '佩戴黄水晶增强贵人助力', item: '黄水晶' },
    '腾蛇': { cure: '佩戴黑曜石化解虚惊怪异', item: '黑曜石' },
    '朱雀': { cure: '佩戴蓝水晶化解口舌是非', item: '蓝水晶' },
    '六合': { cure: '佩戴粉晶增强婚姻和合', item: '粉水晶' },
    '勾陈': { cure: '佩戴茶晶化解纠缠争讼', item: '茶晶' },
    '青龙': { cure: '佩戴翡翠增强财禄喜庆', item: '翡翠' },
    '天空': { cure: '佩戴白水晶化解空虚欺诈', item: '白水晶' },
    '白虎': { cure: '佩戴黑曜石化解凶险血光', item: '黑曜石' },
    '太常': { cure: '佩戴和田玉增强衣食福禄', item: '和田玉' },
    '玄武': { cure: '佩戴黑曜石化解盗贼暗昧', item: '黑曜石' },
    '太阴': { cure: '佩戴月光石增强阴助荫庇', item: '月光石' },
    '天后': { cure: '佩戴粉晶增强姻缘喜庆', item: '粉水晶' }
  };

  const html = '<div style="background:rgba(255,255,255,0.02);padding:14px;border-radius:8px;border:1px solid rgba(201,168,76,0.1)">';
  let chuanShen = (analyzeData && analyzeData.chuanShen) ? analyzeData.chuanShen : [];
  for (let i = 0; i < chuanShen.length; i++) {
    let shen = chuanShen[i];
    for (let key in tianJiangCureDB) {
      if (shen.indexOf(key) >= 0) {
        let d = tianJiangCureDB[key];
        html += '<div style="margin-bottom:8px;padding:4px 0">';
        html += '<p><strong style="color:var(--gold)">' + key + '</strong> — ' + d.cure + '</p>';
        html += '<p style="font-size:11px;opacity:.6">📦 ' + d.item + '</p>';
        html += '</div>';
      }
    }
  }
  if (chuanShen.length === 0) {
    html += '<p style="font-size:12px;opacity:.6">天将信息不足，建议结合完整排盘数据解读。</p>';
  }
  html += '</div>';
  return html;
}

function _getLiurenShenShaCure(panData, analyzeData) {
  const html = '<div style="background:rgba(255,255,255,0.02);padding:14px;border-radius:8px;border:1px solid rgba(201,168,76,0.1)">';
  html += '<ul style="font-size:12px;line-height:2;padding-left:20px;opacity:.85">';
  html += '<li><strong>桃花煞：</strong>佩戴粉晶或草莓晶化解，家中桃花位放粉色水晶球</li>';
  html += '<li><strong>华盖煞：</strong>佩戴紫水晶化解孤寂，多参加社交活动</li>';
  html += '<li><strong>驿马煞：</strong>佩戴白水晶稳定气场，避免频繁出行</li>';
  html += '<li><strong>亡神煞：</strong>佩戴黑曜石化解暗损，家中正北放黑曜石葫芦</li>';
  html += '<li><strong>劫煞：</strong>佩戴铜麒麟或金饰化解劫夺，家中放铜麒麟一对</li>';
  html += '<li><strong>灾煞：</strong>佩戴黑曜石或墨玉化解灾厄，多行善积德</li>';
  html += '</ul>';
  html += '<p style="font-size:11px;opacity:.4;margin-top:8px">《六壬大全》：「神煞之化解，以物制煞，以德化凶。」</p>';
  html += '</div>';
  return html;
}

// ================================================================
// 四、梅花易数化解方案
// ================================================================

function getMeihuaResolution(guaData, analyzeData) {
  if (!guaData) return '<p style="opacity:.5">排盘数据缺失，无法生成化解方案</p>';

  const html = '<div class="cure-resolution-block" style="margin-top:20px;padding:20px;background:linear-gradient(135deg,rgba(201,168,76,0.06),rgba(0,0,0,0.3));border:1px solid rgba(201,168,76,0.25);border-radius:12px">';
  html += '<h4 style="color:var(--gold);letter-spacing:3px;margin-bottom:16px">🛡️ 梅花易数化解方案</h4>';

  let tiGua = analyzeData ? analyzeData.tiGua : '';
  let yongGua = analyzeData ? analyzeData.yongGua : '';
  let relation = analyzeData ? analyzeData.relation : '';

  html += '<p style="font-size:12px;opacity:.5;margin-bottom:16px">体卦：' + tiGua + ' · 用卦：' + yongGua + ' · 关系：' + relation + '</p>';

  // 1. 体用生克化解
  html += '<div style="margin-bottom:20px">';
  html += '<h5 style="font-size:13px;color:var(--gold);letter-spacing:2px;margin-bottom:10px">⚖️ 体用生克化解</h5>';
  html += _getMeihuaTiYongCure(analyzeData);
  html += '</div>';

  // 2. 互卦变卦化解
  html += '<div style="margin-bottom:8px">';
  html += '<h5 style="font-size:13px;color:var(--gold);letter-spacing:2px;margin-bottom:10px">🔄 互卦变卦化解</h5>';
  html += _getMeihuaHuBianCure(guaData, analyzeData);
  html += '</div>';

  html += '<p style="font-size:11px;opacity:.4;margin-top:16px;line-height:1.8">《梅花易数》云：「体为己，用为事。体生用为耗，用生体为益。用克体为凶，体克用为得。」</p>';
  html += '</div>';
  return html;
}

function _getMeihuaTiYongCure(analyzeData) {
  let relation = analyzeData ? analyzeData.relation : '';
  const html = '<div style="background:rgba(255,255,255,0.02);padding:14px;border-radius:8px;border:1px solid rgba(201,168,76,0.1)">';

  if (relation.indexOf('用克体') >= 0 || relation.indexOf('克') >= 0) {
    html += '<p style="color:var(--orange);margin-bottom:8px"><strong>用克体 — 凶象</strong></p>';
    html += '<p style="font-size:12px;line-height:2">用卦克体卦，主事多阻碍。化解之法：</p>';
    html += '<ul style="font-size:12px;line-height:2;padding-left:20px;opacity:.85">';
    html += '<li>佩戴体卦五行对应的水晶增强体卦力量</li>';
    html += '<li>在体卦对应方位放置五行化解物品</li>';
    html += '<li>选择体卦五行旺相的时辰行事</li>';
    html += '<li>避免在用卦五行旺相的时辰做重要决策</li>';
    html += '</ul>';
  } else if (relation.indexOf('用生体') >= 0 || relation.indexOf('生体') >= 0) {
    html += '<p style="color:var(--gold);margin-bottom:8px"><strong>用生体 — 吉象</strong></p>';
    html += '<p style="font-size:12px;line-height:2">用卦生体卦，主事多顺利。宜顺势而为，佩戴体卦五行对应水晶增强吉气。</p>';
  } else if (relation.indexOf('体生用') >= 0) {
    html += '<p style="color:var(--gold);margin-bottom:8px"><strong>体生用 — 耗象</strong></p>';
    html += '<p style="font-size:12px;line-height:2">体卦生用卦，主付出多收获少。化解之法：佩戴体卦五行对应水晶，减少不必要的付出，量力而行。</p>';
  } else if (relation.indexOf('体克用') >= 0) {
    html += '<p style="color:var(--gold);margin-bottom:8px"><strong>体克用 — 得象</strong></p>';
    html += '<p style="font-size:12px;line-height:2">体卦克用卦，主可掌控局面。宜主动出击，佩戴白水晶增强决断力。</p>';
  } else {
    html += '<p style="font-size:12px;line-height:2">体用关系平和，宜保持现状，顺其自然。可佩戴白水晶稳定气场。</p>';
  }

  // 五行对应水晶
  html += '<div style="margin-top:12px;padding:10px;background:rgba(201,168,76,0.04);border-radius:6px">';
  html += '<p style="font-size:11px;opacity:.7;margin-bottom:4px">五行对应水晶速查：</p>';
  html += '<p style="font-size:11px;opacity:.7">木→绿幽灵/翡翠 · 火→红玛瑙/紫水晶 · 土→黄水晶/和田玉 · 金→白水晶/金银 · 水→海蓝宝/黑曜石</p>';
  html += '</div>';

  html += '</div>';
  return html;
}

function _getMeihuaHuBianCure(guaData, analyzeData) {
  const html = '<div style="background:rgba(255,255,255,0.02);padding:14px;border-radius:8px;border:1px solid rgba(201,168,76,0.1)">';
  html += '<p style="font-size:12px;line-height:2"><strong>互卦化解：</strong>互卦主事物发展过程，若互卦五行克体卦，宜在过程中佩戴体卦五行水晶化解。互卦生体卦则过程顺利。</p>';
  html += '<p style="font-size:12px;line-height:2;margin-top:10px"><strong>变卦化解：</strong>变卦主事物结局，若变卦克体卦，结局多不顺。宜佩戴体卦五行水晶，并在变卦对应方位放化解物品。变卦生体卦则结局圆满。</p>';
  html += '<p style="font-size:12px;line-height:2;margin-top:10px"><strong>具体建议：</strong></p>';
  html += '<ul style="font-size:12px;line-height:2;padding-left:20px;opacity:.85">';
  html += '<li>体卦属木：佩戴绿幽灵或翡翠，东方放绿色植物</li>';
  html += '<li>体卦属火：佩戴红玛瑙或紫水晶，南方放红色花瓶</li>';
  html += '<li>体卦属土：佩戴黄水晶或和田玉，中央放陶瓷摆件</li>';
  html += '<li>体卦属金：佩戴白水晶或金银，西方放金属摆件</li>';
  html += '<li>体卦属水：佩戴海蓝宝或黑曜石，北方放鱼缸或蓝色摆件</li>';
  html += '</ul>';
  html += '</div>';
  return html;
}

// ================================================================
// 五、六爻化解方案
// ================================================================

function getLiuyaoResolution(guaData, duanData) {
  if (!guaData) return '<p style="opacity:.5">排盘数据缺失，无法生成化解方案</p>';

  const html = '<div class="cure-resolution-block" style="margin-top:20px;padding:20px;background:linear-gradient(135deg,rgba(201,168,76,0.06),rgba(0,0,0,0.3));border:1px solid rgba(201,168,76,0.25);border-radius:12px">';
  html += '<h4 style="color:var(--gold);letter-spacing:3px;margin-bottom:16px">🛡️ 六爻化解方案</h4>';

  const ben = '';
  const bian = '';
  if (guaData.benGua && _GUA_XIANG) {
    ben = _GUA_XIANG[guaData.benGua.lower].name + _GUA_XIANG[guaData.benGua.upper].name;
  }
  if (guaData.bianGua && _GUA_XIANG) {
    bian = _GUA_XIANG[guaData.bianGua.lower].name + _GUA_XIANG[guaData.bianGua.upper].name;
  }

  html += '<p style="font-size:12px;opacity:.5;margin-bottom:16px">本卦：' + ben + ' · 变卦：' + bian + '</p>';

  // 1. 六亲旺衰化解
  html += '<div style="margin-bottom:20px">';
  html += '<h5 style="font-size:13px;color:var(--gold);letter-spacing:2px;margin-bottom:10px">👨‍👩‍👧‍👦 六亲旺衰化解</h5>';
  html += _getLiuyaoLiuqinCure(guaData, duanData);
  html += '</div>';

  // 2. 世应关系化解
  html += '<div style="margin-bottom:8px">';
  html += '<h5 style="font-size:13px;color:var(--gold);letter-spacing:2px;margin-bottom:10px">⚖️ 世应关系化解</h5>';
  html += _getLiuyaoShiYingCure(guaData, duanData);
  html += '</div>';

  html += '<p style="font-size:11px;opacity:.4;margin-top:16px;line-height:1.8">《增删卜易》云：「六亲旺衰定吉凶，世应生克明事体。化解之道，在于扶弱抑强，趋吉避凶。」</p>';
  html += '</div>';
  return html;
}

function _getLiuyaoLiuqinCure(guaData, duanData) {
  let liuqinCureDB = {
    '父母': { weak: '父母爻弱主辛苦，宜佩戴白水晶或和田玉增强印星', strong: '父母爻过旺主劳碌，宜佩戴红玛瑙泄印星之力', item: '白水晶、和田玉' },
    '兄弟': { weak: '兄弟爻弱主人缘差，宜佩戴粉晶增强比劫之力', strong: '兄弟爻过旺主破财，宜佩戴黄水晶守住财运', item: '粉水晶、黄水晶' },
    '妻财': { weak: '妻财爻弱主财运差，宜佩戴黄水晶或金发晶增强财星', strong: '妻财爻过旺主妻夺夫权，宜佩戴黑曜石平衡', item: '黄水晶、金发晶' },
    '子孙': { weak: '子孙爻弱主无靠，宜佩戴绿幽灵或翡翠增强食伤之力', strong: '子孙爻过旺主懒散，宜佩戴白水晶增强克制', item: '绿幽灵、翡翠' },
    '官鬼': { weak: '官鬼爻弱主无地位，宜佩戴黄水晶或虎眼石增强官星', strong: '官鬼爻过旺主压力，宜佩戴黑曜石化解官鬼之煞', item: '虎眼石、黑曜石' }
  };

  const html = '<div style="background:rgba(255,255,255,0.02);padding:14px;border-radius:8px;border:1px solid rgba(201,168,76,0.1)">';
  let zg = guaData.zhuangGua;
  let liuqin = zg ? zg.liuqin : [];
  let yongshen = duanData ? duanData.yongshen : '';

  for (let i = 0; i < liuqin.length; i++) {
    let lq = liuqin[i];
    if (liuqinCureDB[lq]) {
      let d = liuqinCureDB[lq];
      let isYong = (yongshen.indexOf(lq) >= 0);
      html += '<div style="margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid rgba(201,168,76,0.04)';
      if (isYong) html += ';background:rgba(201,168,76,0.04);padding:8px;border-radius:4px';
      html += '">';
      html += '<p><strong style="color:var(--gold)">' + lq + '</strong>' + (isYong ? ' <span style="font-size:10px;color:var(--cyan)">(用神)</span>' : '') + ' — 第' + (i+1) + '爻</p>';
      html += '<p style="font-size:12px;line-height:1.8;margin-top:4px;opacity:.85">' + d.weak + '</p>';
      html += '<p style="font-size:11px;opacity:.6;margin-top:2px">📦 ' + d.item + '</p>';
      html += '</div>';
    }
  }
  html += '</div>';
  return html;
}

function _getLiuyaoShiYingCure(guaData, duanData) {
  const html = '<div style="background:rgba(255,255,255,0.02);padding:14px;border-radius:8px;border:1px solid rgba(201,168,76,0.1)">';
  let zg = guaData.zhuangGua;
  if (!zg || !zg.shiying) {
    html += '<p style="font-size:12px;opacity:.6">世应信息不足。</p>';
    html += '</div>';
    return html;
  }

  let shi = zg.shiying.shi;
  let ying = zg.shiying.ying;
  html += '<p style="font-size:12px;line-height:2">世爻在第' + (shi+1) + '爻，应爻在第' + (ying+1) + '爻。</p>';

  if (duanData) {
    if (duanData.shiAnalysis) html += '<p style="font-size:12px;line-height:1.8;opacity:.8"><strong>世爻：</strong>' + duanData.shiAnalysis + '</p>';
    if (duanData.yingAnalysis) html += '<p style="font-size:12px;line-height:1.8;opacity:.8"><strong>应爻：</strong>' + duanData.yingAnalysis + '</p>';
  }

  html += '<ul style="font-size:12px;line-height:2;padding-left:20px;opacity:.85">';
  html += '<li><strong>世爻旺：</strong>主自身力量强，宜主动出击。佩戴白水晶增强决断力</li>';
  html += '<li><strong>世爻衰：</strong>主自身力量弱，宜守不宜攻。佩戴黄水晶增强自身力量</li>';
  html += '<li><strong>应爻生世：</strong>主他人助我，宜多与人合作。佩戴粉晶增强人缘</li>';
  html += '<li><strong>应爻克世：</strong>主他人阻我，需防小人。佩戴黑曜石化解小人</li>';
  html += '<li><strong>世应相冲：</strong>主事多反复，宜佩戴白水晶稳定气场，避免冲动决策</li>';
  html += '<li><strong>世应相合：</strong>主事多顺利，宜把握机遇。佩戴黄水晶增强吉气</li>';
  html += '</ul>';
  html += '</div>';
  return html;
}

// ================================================================
// 六、风水化解方案
// ================================================================

function getFengshuiResolution(fsData) {
  if (!fsData) return '<p style="opacity:.5">排盘数据缺失，无法生成化解方案</p>';

  const html = '<div class="cure-resolution-block" style="margin-top:20px;padding:20px;background:linear-gradient(135deg,rgba(201,168,76,0.06),rgba(0,0,0,0.3));border:1px solid rgba(201,168,76,0.25);border-radius:12px">';
  html += '<h4 style="color:var(--gold);letter-spacing:3px;margin-bottom:16px">🛡️ 风水化解方案</h4>';
  html += '<p style="font-size:12px;opacity:.5;margin-bottom:16px">宅型：' + (fsData.houseType || '') + ' · 坐向：' + (fsData.direction || '') + ' · 宅命：' + (fsData.zhaiMing || '') + '</p>';

  // 1. 八宅煞气化解
  html += '<div style="margin-bottom:20px">';
  html += '<h5 style="font-size:13px;color:var(--gold);letter-spacing:2px;margin-bottom:10px">🏠 八宅煞气化解</h5>';
  html += _getFengshuiBazhaiCure(fsData);
  html += '</div>';

  // 2. 玄空飞星化解
  html += '<div style="margin-bottom:8px">';
  html += '<h5 style="font-size:13px;color:var(--gold);letter-spacing:2px;margin-bottom:10px">⭐ 玄空飞星化解</h5>';
  html += _getFengshuiXuankongCure(fsData);
  html += '</div>';

  html += '<p style="font-size:11px;opacity:.4;margin-top:16px;line-height:1.8">《八宅明镜》云：「宅之吉凶在方位，人之吉凶在命卦。宅命相配则吉，不配则凶。」《玄空秘旨》云：「星曜吉凶随时转，化解有道可转机。」</p>';
  html += '</div>';
  return html;
}

function _getFengshuiBazhaiCure(fsData) {
  let shaCureDB = {
    '绝命': { desc: '绝命煞主破财伤丁', cure: '1.在大门挂铜葫芦化解绝命之气；2.门垫下放六帝钱；3.门上挂八卦镜反射煞气', item: '铜葫芦、六帝钱、八卦镜' },
    '五鬼': { desc: '五鬼煞主火灾盗贼', cure: '1.在五鬼位放铜铃或铜葫芦；2.避免在此方位设厨房或卧室；3.此方位保持整洁，不宜堆放杂物', item: '铜铃、铜葫芦' },
    '六煞': { desc: '六煞主口舌是非', cure: '1.在六煞位放蓝色水晶簇化解；2.此方位不宜安床；3.可在此放水缸或鱼缸化煞', item: '蓝水晶簇、水缸' },
    '祸害': { desc: '祸害主病痛官非', cure: '1.在祸害位放铜葫芦或五帝钱；2.此方位保持明亮；3.避免在此方位长期逗留', item: '铜葫芦、五帝钱' }
  };

  const html = '<div style="background:rgba(255,255,255,0.02);padding:14px;border-radius:8px;border:1px solid rgba(201,168,76,0.1)">';
  html += '<p style="font-size:12px;line-height:2;opacity:.8">宅命：' + (fsData.zhaiMing || '未知') + ' · 宅主命卦：' + (fsData.yaoMing || '未知') + ' · 配合：' + (fsData.matching ? '相配' : '不配') + '</p>';

  if (fsData.matching === false) {
    html += '<div style="margin:10px 0;padding:10px;background:rgba(231,76,60,0.04);border-radius:6px">';
    html += '<p style="font-size:12px;color:var(--orange)">⚠️ 宅命不配，需化解</p>';
    html += '<p style="font-size:12px;line-height:1.8;margin-top:4px">化解之法：1.大门颜色按命卦五行选择(东四命用绿色/蓝色，西四命用黄色/白色)；2.门垫下放六帝钱；3.宅主卧室选吉位安床</p>';
    html += '</div>';
  }

  for (let sha in shaCureDB) {
    let d = shaCureDB[sha];
    html += '<div style="margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid rgba(201,168,76,0.04)">';
    html += '<p><strong style="color:var(--orange)">' + sha + '</strong> — ' + d.desc + '</p>';
    html += '<p style="font-size:12px;line-height:1.8;margin-top:4px">' + d.cure + '</p>';
    html += '<p style="font-size:11px;opacity:.6;margin-top:2px">📦 ' + d.item + '</p>';
    html += '</div>';
  }
  html += '</div>';
  return html;
}

function _getFengshuiXuankongCure(fsData) {
  let flyingStarCure = {
    '一白': { nature: '吉', desc: '一白桃花主姻缘人缘', cure: '一白位放水缸或鱼缸增强桃花人缘' },
    '二黑': { nature: '凶', desc: '二黑病符主疾病', cure: '二黑位放铜葫芦或六帝钱化解病符，保持此方位整洁', item: '铜葫芦、六帝钱' },
    '三碧': { nature: '凶', desc: '三碧禄存主口舌官非', cure: '三碧位放红色地毯或红色物品化解三碧之木煞', item: '红色地毯' },
    '四绿': { nature: '吉', desc: '四绿文曲主学业文昌', cure: '四绿位放文昌塔或四支毛笔增强学业', item: '文昌塔、毛笔' },
    '五黄': { nature: '大凶', desc: '五黄廉贞主灾祸死亡', cure: '五黄位挂铜铃或放铜葫芦化解，绝对不可在此方位动土', item: '铜铃、铜葫芦' },
    '六白': { nature: '吉', desc: '六白武曲主权威事业', cure: '六白位放金属摆件或白水晶增强事业运', item: '金属摆件、白水晶' },
    '七赤': { nature: '凶', desc: '七赤破军主盗贼口舌', cure: '七赤位放蓝色水晶簇或水缸化解七赤之金煞', item: '蓝水晶簇、水缸' },
    '八白': { nature: '吉', desc: '八白左辅主财运置业', cure: '八白位放聚宝盆或黄水晶增强财运', item: '聚宝盆、黄水晶' },
    '九紫': { nature: '吉', desc: '九紫右弼主喜庆姻缘', cure: '九紫位放红色花瓶或紫水晶增强喜庆之气', item: '红色花瓶、紫水晶' }
  };

  const html = '<div style="background:rgba(255,255,255,0.02);padding:14px;border-radius:8px;border:1px solid rgba(201,168,76,0.1)">';
  html += '<p style="font-size:12px;line-height:2;opacity:.8">元运：' + (fsData.period || '九') + '运 · ' + (fsData.wangShan ? '当运' : '非当运') + '</p>';
  html += '<p style="font-size:12px;line-height:1.8;opacity:.7;margin-top:4px">玄空评语：' + (fsData.xuankong || '') + '</p>';

  // 当前九运(2024-2043年)飞星化解重点
  html += '<div style="margin-top:12px;padding:10px;background:rgba(201,168,76,0.04);border-radius:6px">';
  html += '<p style="font-size:12px;color:var(--gold);margin-bottom:6px">九运(2024-2043年)飞星化解重点：</p>';
  html += '<ul style="font-size:12px;line-height:2;padding-left:20px;opacity:.85">';
  html += '<li><strong>五黄大煞：</strong>每年五黄飞临方位不可动土，宜挂铜铃化解</li>';
  html += '<li><strong>二黑病符：</strong>每年二黑飞临方位宜放铜葫芦，保持通风</li>';
  html += '<li><strong>三碧是非：</strong>每年三碧飞临方位宜放红色物品化解</li>';
  html += '<li><strong>七赤盗贼：</strong>每年七赤飞临方位宜放蓝色水晶或水缸化解</li>';
  html += '</ul>';
  html += '</div>';

  for (let star in flyingStarCure) {
    let d = flyingStarCure[star];
    let isJi = (d.nature === '凶' || d.nature === '大凶');
    html += '<div style="margin-bottom:8px;padding:6px 0;';
    if (isJi) html += 'background:rgba(231,76,60,0.02);padding:8px;border-radius:4px';
    html += '">';
    html += '<p><strong style="color:' + (isJi ? 'var(--orange)' : 'var(--gold)') + '">' + star + '</strong> <span style="font-size:11px;opacity:.5">(' + d.nature + ')</span> — ' + d.desc + '</p>';
    html += '<p style="font-size:12px;line-height:1.8;margin-top:2px">' + d.cure + '</p>';
    if (d.item) html += '<p style="font-size:11px;opacity:.6;margin-top:2px">📦 ' + d.item + '</p>';
    html += '</div>';
  }
  html += '</div>';
  return html;
}

// ================================================================
// 七、化解物品数据库
// ================================================================

function getCureItemCatalog() {
  let catalog = {
    // 五行水晶类
    crystals: [
      { name: '白水晶', element: '金', color: '白色透明', price: '20-200元', use: '增强金气、净化气场、提升决断力', placement: '西方/西北', care: '每月月光净化一次', source: '东海水晶市场、珠宝店' },
      { name: '黄水晶', element: '土', color: '黄色至橙黄', price: '50-500元', use: '增强财运、补土、提升自信', placement: '中央/西南/财位', care: '避免暴晒', source: '巴西进口、东海水晶市场' },
      { name: '绿幽灵', element: '木', color: '绿色内含物', price: '80-800元', use: '增强木气、招财、助事业', placement: '东方/东南', care: '定期消磁', source: '东海水晶市场、网购' },
      { name: '红玛瑙', element: '火', color: '红色', price: '30-300元', use: '增强火气、活血、提升热情', placement: '南方', care: '避免碰撞', source: '珠宝店、网购' },
      { name: '海蓝宝', element: '水', color: '蓝色至浅蓝', price: '100-1000元', use: '增强水气、安抚情绪、利沟通', placement: '北方', care: '避免高温', source: '珠宝店、进口商' },
      { name: '黑曜石', element: '水', color: '黑色', price: '20-200元', use: '化解煞气、防小人、净化负能量', placement: '北方/煞方', care: '每月日光净化', source: '珠宝店、网购' },
      { name: '紫水晶', element: '火', color: '紫色', price: '50-500元', use: '安定心神、提升智慧、助睡眠', placement: '南方/床头', care: '避免暴晒褪色', source: '巴西进口、珠宝店' },
      { name: '粉水晶', element: '火', color: '粉色', price: '30-300元', use: '催桃花、增人缘、促感情', placement: '桃花位/东南', care: '定期消磁', source: '珠宝店、网购' },
      { name: '茶晶', element: '土', color: '棕色至深棕', price: '40-400元', use: '稳定情绪、化解煞气、助接地', placement: '东北/中央', care: '定期消磁', source: '东海水晶市场' },
      { name: '金发晶', element: '金', color: '透明含金丝', price: '200-2000元', use: '招财、增强决断、提升气势', placement: '西方/西北', care: '避免碰撞', source: '珠宝店、进口商' }
    ],
    // 金属类
    metals: [
      { name: '铜葫芦', element: '金', color: '铜色', price: '50-300元', use: '化解病符、化煞、收妖', placement: '病符方/煞方', care: '保持干燥', source: '风水用品店、网购' },
      { name: '六帝钱', element: '金', color: '铜色', price: '100-500元', use: '化煞、镇宅、化五黄二黑', placement: '门下/煞方', care: '保持清洁', source: '古玩店、风水用品店' },
      { name: '铜铃', element: '金', color: '铜色', price: '30-150元', use: '化解五黄、化煞、净化', placement: '五黄方/门上', care: '定期摇晃', source: '风水用品店' },
      { name: '铜麒麟', element: '金', color: '铜色', price: '100-600元', use: '化煞、招财、送子', placement: '煞方/财位', care: '保持清洁', source: '风水用品店' },
      { name: '聚宝盆', element: '土/金', color: '多色', price: '80-800元', use: '招财聚财、守财', placement: '财位', care: '内放硬币珠宝', source: '风水用品店、陶瓷店' }
    ],
    // 木器类
    woods: [
      { name: '檀木手串', element: '木', color: '棕色', price: '50-500元', use: '增强木气、安神、辟邪', placement: '佩戴', care: '避免沾水', source: '佛具店、网购' },
      { name: '文昌塔', element: '木', color: '木色/铜色', price: '80-600元', use: '催文昌、助学业考试', placement: '文昌位/书桌', care: '保持清洁', source: '风水用品店' },
      { name: '绿色盆栽', element: '木', color: '绿色', price: '20-200元', use: '增强木气、净化空气、生机', placement: '东方/东南', care: '定期浇水修剪', source: '花店、苗圃' }
    ],
    // 土器类
    earth: [
      { name: '和田玉', element: '土', color: '白色/青色', price: '200-20000元', use: '增强土气、养生、辟邪', placement: '佩戴', care: '避免碰撞', source: '玉器店、拍卖' },
      { name: '陶瓷花瓶', element: '土', color: '多色', price: '50-500元', use: '增强土气、插花催运', placement: '土位/桃花位', care: '保持清洁', source: '陶瓷店、网购' },
      { name: '虎眼石', element: '土', color: '棕黄', price: '50-400元', use: '增强决断、辟邪、助事业', placement: '佩戴', care: '定期消磁', source: '珠宝店' }
    ],
    // 水器类
    water: [
      { name: '鱼缸', element: '水', color: '透明', price: '100-2000元', use: '增强水气、催财、化煞', placement: '财位/煞方', care: '定期换水喂鱼', source: '水族店、网购' },
      { name: '蓝色花瓶', element: '水', color: '蓝色', price: '50-300元', use: '增强水气、插花催运', placement: '北方', care: '保持清洁', source: '花店、网购' }
    ],
    // 火器类
    fire: [
      { name: '红色花瓶', element: '火', color: '红色', price: '50-400元', use: '增强火气、插花催运', placement: '南方', care: '保持清洁', source: '花店、网购' },
      { name: '琥珀', element: '火', color: '金黄至棕', price: '100-2000元', use: '增强火气、安神、辟邪', placement: '佩戴', care: '避免高温', source: '珠宝店、网购' },
      { name: '红色地毯', element: '火', color: '红色', price: '50-300元', use: '化解三碧、增强火气', placement: '三碧方/南方', care: '定期清洗', source: '家居店、网购' }
    ],
    // 符咒类
    talismans: [
      { name: '太岁符', element: '通用', color: '金色/红色', price: '100-500元', use: '化解太岁、保平安', placement: '佩戴/安奉', care: '每年更换', source: '道观、寺庙' },
      { name: '五行化解符', element: '通用', color: '金色', price: '100-300元', use: '化解五行冲克', placement: '佩戴', care: '每年更换', source: '道观' },
      { name: '八卦镜', element: '通用', color: '铜色', price: '50-200元', use: '反射煞气、镇宅', placement: '门外/窗外', care: '保持清洁', source: '风水用品店' }
    ]
  };

  return catalog;
}

/**
 * 获取化解物品推荐HTML
 * @param {string} elementType - 需要补的五行
 * @returns {string} HTML
 */
function getCureItemRecommendation(elementType) {
  let catalog = getCureItemCatalog();
  const html = '<div style="background:rgba(255,255,255,0.02);padding:14px;border-radius:8px;border:1px solid rgba(201,168,76,0.1)">';

  const items = [];
  if (elementType === '木') items = items.concat(catalog.crystals.filter(function(x){return x.element==='木';}), catalog.woods);
  else if (elementType === '火') items = items.concat(catalog.crystals.filter(function(x){return x.element==='火';}), catalog.fire);
  else if (elementType === '土') items = items.concat(catalog.crystals.filter(function(x){return x.element==='土';}), catalog.earth);
  else if (elementType === '金') items = items.concat(catalog.crystals.filter(function(x){return x.element==='金';}), catalog.metals);
  else if (elementType === '水') items = items.concat(catalog.crystals.filter(function(x){return x.element==='水';}), catalog.water);
  else items = catalog.crystals.concat(catalog.metals).concat(catalog.woods);

  for (let i = 0; i < items.length && i < 8; i++) {
    let item = items[i];
    html += '<div style="margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid rgba(201,168,76,0.04)">';
    html += '<p><strong style="color:var(--gold)">' + item.name + '</strong> <span style="font-size:11px;opacity:.5">(' + item.element + ')</span></p>';
    html += '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:4px;font-size:11px;opacity:.7;margin-top:4px">';
    html += '<div>💰 ' + item.price + '</div>';
    html += '<div>🎨 ' + item.color + '</div>';
    html += '<div>🧭 ' + item.placement + '</div>';
    html += '<div>🔄 ' + item.care + '</div>';
    html += '</div>';
    html += '<p style="font-size:11px;opacity:.7;margin-top:4px">用途：' + item.use + '</p>';
    html += '<p style="font-size:11px;opacity:.5;margin-top:2px">购买：' + item.source + '</p>';
    html += '</div>';
  }

  html += '</div>';
  return html;
}

// ================================================================
// 八、年度变化化解方案
// ================================================================

/**
 * 根据流年变化生成化解方案
 * @param {object} baziData - 八字数据
 * @param {number} currentYear - 当前年份
 * @returns {string} HTML
 */
function getAnnualCurePlan(baziData, currentYear) {
  if (!currentYear) currentYear = new Date().getFullYear();

  // 流年干支计算 (2026=丙午)
  let yearGanZhi = _getYearGanZhi(currentYear);
  let yearGan = yearGanZhi.gan;
  let yearZhi = yearGanZhi.zhi;
  let yearGanEle = _GAN_ELE[yearGan] || '火';
  let yearZhiEle = _ZHI_ELE[yearZhi] || '火';

  const html = '<div class="cure-resolution-block" style="margin-top:20px;padding:20px;background:linear-gradient(135deg,rgba(201,168,76,0.06),rgba(0,0,0,0.3));border:1px solid rgba(201,168,76,0.25);border-radius:12px">';
  html += '<h4 style="color:var(--gold);letter-spacing:3px;margin-bottom:16px">📅 ' + currentYear + '年 ' + yearGan + yearZhi + ' 年度化解方案</h4>';

  // 1. 流年天干地支对日主的影响
  html += '<div style="margin-bottom:20px">';
  html += '<h5 style="font-size:13px;color:var(--gold);letter-spacing:2px;margin-bottom:10px">🔮 流年干支对日主影响</h5>';
  html += _getAnnualGanZhiCure(baziData, yearGan, yearZhi, yearGanEle, yearZhiEle);
  html += '</div>';

  // 2. 流年飞星对家居的影响
  html += '<div style="margin-bottom:20px">';
  html += '<h5 style="font-size:13px;color:var(--gold);letter-spacing:2px;margin-bottom:10px">⭐ 流年飞星化解</h5>';
  html += _getAnnualFlyingStarCure(currentYear);
  html += '</div>';

  // 3. 流年太岁方位化解
  html += '<div style="margin-bottom:20px">';
  html += '<h5 style="font-size:13px;color:var(--gold);letter-spacing:2px;margin-bottom:10px">🛡️ 流年太岁方位化解</h5>';
  html += _getAnnualTaishuiCure(yearZhi);
  html += '</div>';

  // 4. 流年三煞方位化解
  html += '<div style="margin-bottom:20px">';
  html += '<h5 style="font-size:13px;color:var(--gold);letter-spacing:2px;margin-bottom:10px">⚔️ 流年三煞方位化解</h5>';
  html += _getAnnualSanshaCure(yearZhi);
  html += '</div>';

  // 5. 流年五黄二黑化解
  html += '<div style="margin-bottom:8px">';
  html += '<h5 style="font-size:13px;color:var(--gold);letter-spacing:2px;margin-bottom:10px">☣️ 五黄二黑化解</h5>';
  html += _getAnnualWuhuangErheiCure(currentYear);
  html += '</div>';

  html += '<p style="font-size:11px;opacity:.4;margin-top:16px;line-height:1.8">《协纪辨方书》云：「流年吉凶随时而转，太岁三煞五黄二黑，皆为年内大煞，需及时化解。」《选择通德类情》云：「择日择方，以避煞为先，化煞为辅。」</p>';
  html += '</div>';
  return html;
}

function _getAnnualGanZhiCure(baziData, yearGan, yearZhi, yearGanEle, yearZhiEle) {
  const html = '<div style="background:rgba(255,255,255,0.02);padding:14px;border-radius:8px;border:1px solid rgba(201,168,76,0.1)">';
  let dayStem = baziData ? baziData.dayStem : '甲';
  let dayEle = _GAN_ELE ? (_GAN_ELE[dayStem] || '木') : '木';

  html += '<p style="font-size:12px;line-height:2">日主：<strong>' + dayStem + '(' + dayEle + ')</strong> · 流年：<strong>' + yearGan + yearZhi + '(' + yearGanEle + '/' + yearZhiEle + ')</strong></p>';

  const relation = '';
  const cure = '';
  if (dayEle === yearGanEle) {
    relation = '比劫 — 同气相助';
    cure = '今年运势平稳但易竞争。宜佩戴黄水晶稳固财运，避免与人争执。多行善积德以化比劫之争。';
  } else if (_eleSheng(dayEle, yearGanEle)) {
    relation = '日主生流年 — 食伤泄秀';
    cure = '今年付出较多但才能得以发挥。宜佩戴体卦五行水晶补充能量，注意劳逸结合。';
  } else if (_eleSheng(yearGanEle, dayEle)) {
    relation = '流年生日主 — 印星相助';
    cure = '今年得贵人相助，运势较好。宜佩戴白水晶增强印星之力，把握机遇。';
  } else if (_eleKe(dayEle, yearGanEle)) {
    relation = '日主克流年 — 财星当头';
    cure = '今年财运较好但需努力。宜佩戴黄水晶增强财运，在财位放聚宝盆。';
  } else if (_eleKe(yearGanEle, dayEle)) {
    relation = '流年克日主 — 官杀压力';
    cure = '今年压力较大需谨慎。宜佩戴黑曜石化解官杀之煞，避免冲动决策。多行善积德。';
  }

  html += '<p style="font-size:12px;line-height:2;margin-top:8px"><strong>关系：</strong>' + relation + '</p>';
  html += '<p style="font-size:12px;line-height:2;margin-top:4px"><strong>化解：</strong>' + cure + '</p>';
  html += '</div>';
  return html;
}

function _getAnnualFlyingStarCure(currentYear) {
  // 2026年九紫入中宫的飞星图
  let starPositions = _getAnnualFlyingStarPositions(currentYear);
  const html = '<div style="background:rgba(255,255,255,0.02);padding:14px;border-radius:8px;border:1px solid rgba(201,168,76,0.1)">';

  // 飞星图表格
  html += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px;margin-bottom:16px;font-size:11px;text-align:center">';
  const positions = ['东南', '正南', '西南', '正东', '中宫', '正西', '东北', '正北', '西北'];
  for (let i = 0; i < 9; i++) {
    let star = starPositions[positions[i]] || '?';
    let isJi = (star === '一白' || star === '四绿' || star === '六白' || star === '八白' || star === '九紫');
    let isXiong = (star === '二黑' || star === '三碧' || star === '五黄' || star === '七赤');
    let bg = isJi ? 'rgba(46,204,113,0.06)' : isXiong ? 'rgba(231,76,60,0.06)' : 'rgba(201,168,76,0.04)';
    html += '<div style="padding:8px 4px;background:' + bg + ';border-radius:4px">';
    html += '<div style="opacity:.5">' + positions[i] + '</div>';
    html += '<div style="color:' + (isJi ? 'var(--gold)' : isXiong ? 'var(--orange)' : 'var(--paper)') + ';font-weight:bold;margin-top:2px">' + star + '</div>';
    html += '</div>';
  }
  html += '</div>';

  // 化解重点
  html += '<ul style="font-size:12px;line-height:2;padding-left:20px;opacity:.85">';
  for (let pos in starPositions) {
    let s = starPositions[pos];
    if (s === '五黄') html += '<li><strong>五黄(' + pos + ')：</strong>大凶之位，挂铜铃，放铜葫芦，不可动土</li>';
    else if (s === '二黑') html += '<li><strong>二黑(' + pos + ')：</strong>病符之位，放铜葫芦或六帝钱，保持通风</li>';
    else if (s === '三碧') html += '<li><strong>三碧(' + pos + ')：</strong>是非之位，放红色地毯或红色物品化解</li>';
    else if (s === '七赤') html += '<li><strong>七赤(' + pos + ')：</strong>盗贼之位，放蓝色水晶或水缸化解</li>';
    else if (s === '一白') html += '<li><strong>一白(' + pos + ')：</strong>桃花人缘之位，放水缸或鱼缸催运</li>';
    else if (s === '四绿') html += '<li><strong>四绿(' + pos + ')：</strong>文昌之位，放文昌塔或四支毛笔催学业</li>';
    else if (s === '六白') html += '<li><strong>六白(' + pos + ')：</strong>事业之位，放金属摆件或白水晶催事业</li>';
    else if (s === '八白') html += '<li><strong>八白(' + pos + ')：</strong>财运之位，放聚宝盆或黄水晶催财</li>';
    else if (s === '九紫') html += '<li><strong>九紫(' + pos + ')：</strong>喜庆之位，放红色花瓶或紫水晶催喜庆</li>';
  }
  html += '</ul>';
  html += '</div>';
  return html;
}

function _getAnnualFlyingStarPositions(year) {
  // 计算流年飞星入中宫
  // 2024年三碧入中, 2025年二黑入中, 2026年一白入中, 2027年九紫入中...
  // 飞星顺序：入中宫后按洛书顺序飞布
  let baseStar = 3; // 2024年三碧入中
  let diff = year - 2024;
  let centerStar = ((baseStar - diff - 1) % 9 + 9) % 9 + 1;

  const starNames = {1:'一白', 2:'二黑', 3:'三碧', 4:'四绿', 5:'五黄', 6:'六白', 7:'七赤', 8:'八白', 9:'九紫'};

  // 洛书飞布顺序：中宫→西北→正西→东北→正南→正北→西南→正东→东南
  const flyOrder = ['中宫', '西北', '正西', '东北', '正南', '正北', '西南', '正东', '东南'];
  const positions = {};
  for (let i = 0; i < 9; i++) {
    let starNum = ((centerStar - 1 + i) % 9) + 1;
    positions[flyOrder[i]] = starNames[starNum];
  }
  return positions;
}

function _getAnnualTaishuiCure(yearZhi) {
  let taishuiFang = {
    '子': '正北(太岁方)/正南(岁破方)',
    '丑': '东北/西南',
    '寅': '东北/西南',
    '卯': '正东/正西',
    '辰': '东南/西北',
    '巳': '东南/西北',
    '午': '正南/正北',
    '未': '西南/东北',
    '申': '西南/东北',
    '酉': '正西/正东',
    '戌': '西北/东南',
    '亥': '西北/东南'
  };

  let fang = taishuiFang[yearZhi] || '正南/正北';
  const html = '<div style="background:rgba(255,255,255,0.02);padding:14px;border-radius:8px;border:1px solid rgba(201,168,76,0.1)">';
  html += '<p style="font-size:12px;line-height:2"><strong>太岁方位：</strong>' + fang + '</p>';
  html += '<ul style="font-size:12px;line-height:2;padding-left:20px;opacity:.85">';
  html += '<li>太岁方不可动土修造，宜静不宜动</li>';
  html += '<li>太岁方可安奉太岁符或太岁像</li>';
  html += '<li>岁破方(太岁对宫)亦不宜动土</li>';
  html += '<li>岁破方可放黑曜石麒麟或铜葫芦化解</li>';
  html += '<li>年初(正月初一至十五)拜太岁祈福</li>';
  html += '<li>年底谢太岁，感谢一年庇佑</li>';
  html += '</ul>';
  html += '<p style="font-size:11px;opacity:.4;margin-top:8px">《协纪辨方书》：「太岁如君，不可冒犯。坐太岁方则吉，向太岁方则凶。」</p>';
  html += '</div>';
  return html;
}

function _getAnnualSanshaCure(yearZhi) {
  let sanshaFang = {
    '申子辰': '正南(巳午未)',
    '寅午戌': '正北(亥子丑)',
    '亥卯未': '正西(申酉戌)',
    '巳酉丑': '正东(寅卯辰)'
  };

  // 确定三煞
  const sansha = '';
  let zhiGroup = yearZhi;
  if (['申','子','辰'].indexOf(yearZhi) >= 0) sansha = '正南(巳午未方)';
  else if (['寅','午','戌'].indexOf(yearZhi) >= 0) sansha = '正北(亥子丑方)';
  else if (['亥','卯','未'].indexOf(yearZhi) >= 0) sansha = '正西(申酉戌方)';
  else if (['巳','酉','丑'].indexOf(yearZhi) >= 0) sansha = '正东(寅卯辰方)';

  const html = '<div style="background:rgba(255,255,255,0.02);padding:14px;border-radius:8px;border:1px solid rgba(201,168,76,0.1)">';
  html += '<p style="font-size:12px;line-height:2"><strong>三煞方位：</strong>' + sansha + '</p>';
  html += '<ul style="font-size:12px;line-height:2;padding-left:20px;opacity:.85">';
  html += '<li>三煞方绝对不可动土修造</li>';
  html += '<li>三煞方可放铜麒麟一对或铜葫芦化解</li>';
  html += '<li>三煞方宜静不宜动，不宜安床安灶</li>';
  html += '<li>若必须使用三煞方，需择吉日吉时并安放化解物品</li>';
  html += '<li>三煞方保持整洁明亮，不宜堆放杂物</li>';
  html += '</ul>';
  html += '<p style="font-size:11px;opacity:.4;margin-top:8px">《永宁通书》：「三煞之方，犹如刀刃。犯之则伤，避之则安。」</p>';
  html += '</div>';
  return html;
}

function _getAnnualWuhuangErheiCure(currentYear) {
  let positions = _getAnnualFlyingStarPositions(currentYear);
  const wuhuangFang = '';
  const erheiFang = '';
  for (let pos in positions) {
    if (positions[pos] === '五黄') wuhuangFang = pos;
    if (positions[pos] === '二黑') erheiFang = pos;
  }

  const html = '<div style="background:rgba(255,255,255,0.02);padding:14px;border-radius:8px;border:1px solid rgba(201,168,76,0.1)">';
  html += '<div style="margin-bottom:12px;padding:10px;background:rgba(231,76,60,0.04);border-radius:6px">';
  html += '<p style="color:var(--orange);font-size:13px"><strong>五黄大煞 — ' + wuhuangFang + '</strong></p>';
  html += '<p style="font-size:12px;line-height:1.8;margin-top:4px">五黄为流年最大凶星，主灾祸死亡。化解方法：</p>';
  html += '<ul style="font-size:12px;line-height:2;padding-left:20px;opacity:.85">';
  html += '<li>在' + wuhuangFang + '方挂铜铃，每日摇晃三下化解五黄之土煞</li>';
  html += '<li>在' + wuhuangFang + '方放铜葫芦，吸收五黄之毒气</li>';
  html += '<li>绝对不可在' + wuhuangFang + '方动土、钻孔、钉钉子</li>';
  html += '<li>' + wuhuangFang + '方保持安静，不宜放电视、音响等嘈杂物品</li>';
  html += '<li>可放六帝钱或铜麒麟增强化解之力</li>';
  html += '</ul>';
  html += '</div>';

  html += '<div style="padding:10px;background:rgba(231,76,60,0.03);border-radius:6px">';
  html += '<p style="color:var(--orange);font-size:13px"><strong>二黑病符 — ' + erheiFang + '</strong></p>';
  html += '<p style="font-size:12px;line-height:1.8;margin-top:4px">二黑主疾病缠身，需化解病符之气：</p>';
  html += '<ul style="font-size:12px;line-height:2;padding-left:20px;opacity:.85">';
  html += '<li>在' + erheiFang + '方放铜葫芦化解病符</li>';
  html += '<li>在' + erheiFang + '方放六帝钱化泄二黑之土气</li>';
  html += '<li>' + erheiFang + '方保持通风明亮，不宜阴暗潮湿</li>';
  html += '<li>不宜在' + erheiFang + '方安床或长期逗留</li>';
  html += '<li>可在' + erheiFang + '方放金属风铃，金泄土气</li>';
  html += '</ul>';
  html += '</div>';
  html += '</div>';
  return html;
}

// ================================================================
// 九、家庭成员化解方案
// ================================================================

function getFamilyCurePlan(familyData, currentYear) {
  if (!familyData || !familyData.members || familyData.members.length === 0) {
    return '<p style="opacity:.5">家庭成员数据缺失</p>';
  }
  if (!currentYear) currentYear = new Date().getFullYear();

  const html = '<div class="cure-resolution-block" style="margin-top:20px;padding:20px;background:linear-gradient(135deg,rgba(201,168,76,0.06),rgba(0,0,0,0.3));border:1px solid rgba(201,168,76,0.25);border-radius:12px">';
  html += '<h4 style="color:var(--gold);letter-spacing:3px;margin-bottom:16px">👨‍👩‍👧‍👦 家庭成员化解方案</h4>';

  // 每位成员的个性化化解
  html += '<div style="margin-bottom:20px">';
  html += '<h5 style="font-size:13px;color:var(--gold);letter-spacing:2px;margin-bottom:10px">👤 各成员个性化化解</h5>';
  for (let i = 0; i < familyData.members.length; i++) {
    let m = familyData.members[i];
    html += '<div style="margin-bottom:16px;padding:14px;background:rgba(255,255,255,0.02);border-radius:8px;border:1px solid rgba(201,168,76,0.1)">';
    html += '<p style="color:var(--gold);font-size:13px;margin-bottom:8px"><strong>' + (m.name || '成员' + (i+1)) + '</strong> (' + (m.relation || '') + ')</p>';
    if (m.bazi) {
      html += '<p style="font-size:12px;opacity:.7;margin-bottom:6px">日主：' + (m.bazi.dayStem || '') + ' · 五行缺：' + (m.bazi.weakestEle || '') + ' · 喜用：' + (m.bazi.xiEle || '') + '</p>';
      html += '<p style="font-size:12px;line-height:1.8;opacity:.8">' + _getMemberCureText(m.bazi, currentYear) + '</p>';
    }
    html += '</div>';
  }
  html += '</div>';

  // 家庭整体化解
  html += '<div style="margin-bottom:20px">';
  html += '<h5 style="font-size:13px;color:var(--gold);letter-spacing:2px;margin-bottom:10px">🏠 家庭整体化解</h5>';
  html += '<div style="background:rgba(255,255,255,0.02);padding:14px;border-radius:8px;border:1px solid rgba(201,168,76,0.1)">';
  html += _getFamilyOverallCure(familyData, currentYear);
  html += '</div>';
  html += '</div>';

  // 化解物品协同效应检查
  html += '<div style="margin-bottom:8px">';
  html += '<h5 style="font-size:13px;color:var(--gold);letter-spacing:2px;margin-bottom:10px">🔍 化解物品协同检查</h5>';
  html += '<div style="background:rgba(255,255,255,0.02);padding:14px;border-radius:8px;border:1px solid rgba(201,168,76,0.1)">';
  html += _getCureItemSynergyCheck(familyData);
  html += '</div>';
  html += '</div>';

  html += '</div>';
  return html;
}

function _getMemberCureText(bazi, currentYear) {
  let dayEle = _GAN_ELE ? (_GAN_ELE[bazi.dayStem] || '木') : '木';
  let weak = bazi.weakestEle || '木';
  let xi = bazi.xiEle || '木';
  const text = '';
  text += '1. 补' + weak + '：佩戴' + _getElementCrystal(weak) + '，多穿' + _getElementColor(weak) + '色衣物；';
  text += '2. 催' + xi + '：在' + _getElementDirection(xi) + '方位布局，增强喜用神之力；';
  text += '3. ' + currentYear + '年需注意流年太岁关系，如有犯太岁需请太岁符；';
  text += '4. 根据个人命盘，选择有利的方位和时辰行事。';
  return text;
}

function _getFamilyOverallCure(familyData, currentYear) {
  const html = '<ul style="font-size:12px;line-height:2;padding-left:20px;opacity:.85">';
  html += '<li><strong>客厅布局：</strong>根据家主命卦选择吉位安放沙发，背靠实墙，面朝吉方</li>';
  html += '<li><strong>卧室分配：</strong>各成员卧室选个人命卦吉位，床头朝吉方</li>';
  html += '<li><strong>厨房位置：</strong>厨房宜在凶方(以凶制凶)，灶台朝吉方</li>';
  html += '<li><strong>太岁化解：</strong>年初全家拜太岁，家中安奉太岁符</li>';
  html += '<li><strong>五黄二黑：</strong>每年根据飞星图，在五黄二黑方位放铜葫芦化解</li>';
  html += '<li><strong>家庭和谐：</strong>客厅放粉晶球或紫晶洞，增强家庭和睦之气</li>';
  html += '<li><strong>财位布局：</strong>客厅财位放聚宝盆或黄水晶，增强全家财运</li>';
  html += '<li><strong>子女学业：</strong>子女书桌放文昌塔，面朝文昌位</li>';
  html += '</ul>';
  html += '<p style="font-size:11px;opacity:.4;margin-top:8px">《阳宅集成》：「宅以人为本，人以宅为家。宅命相配，家道兴旺。」</p>';
  return html;
}

function _getCureItemSynergyCheck(familyData) {
  const html = '<ul style="font-size:12px;line-height:2;padding-left:20px;opacity:.85">';
  html += '<li><strong>水晶协同：</strong>不同成员佩戴不同五行水晶时，检查是否相克。如一人补金(白水晶)、一人补火(红玛瑙)，火克金需注意</li>';
  html += '<li><strong>方位冲突：</strong>不同成员的吉方可能不同，卧室方位以个人命卦为准，客厅以家主命卦为准</li>';
  html += '<li><strong>物品冲突：</strong>避免在同一方位放相克物品(如火方放水缸、水方放红色物品)</li>';
  html += '<li><strong>化解物品更换：</strong>太岁符每年更换，水晶每月消磁，铜器保持清洁</li>';
  html += '<li><strong>整体平衡：</strong>家庭化解方案以和谐为主，避免一人的化解物品影响他人</li>';
  html += '</ul>';
  html += '<p style="font-size:11px;opacity:.4;margin-top:8px">化解物品协同效应需定期检查，建议每年初更新方案。</p>';
  return html;
}

// ================================================================
// 十、会员分级化解
// ================================================================

function getMembershipCurePlan(baziData, membershipLevel, currentYear) {
  if (!membershipLevel) membershipLevel = 'free';
  if (!currentYear) currentYear = new Date().getFullYear();

  const html = '<div class="cure-resolution-block" style="margin-top:20px;padding:20px;background:linear-gradient(135deg,rgba(201,168,76,0.06),rgba(0,0,0,0.3));border:1px solid rgba(201,168,76,0.25);border-radius:12px">';

  if (membershipLevel === 'free') {
    html += '<h4 style="color:var(--gold);letter-spacing:3px;margin-bottom:16px">🆓 免费用户化解方案概要</h4>';
    html += '<div style="background:rgba(255,255,255,0.02);padding:14px;border-radius:8px;border:1px solid rgba(201,168,76,0.1)">';
    html += '<p style="font-size:13px;line-height:2">以下为化解方案概要，升级会员可查看完整方案：</p>';
    html += '<ul style="font-size:12px;line-height:2;padding-left:20px;opacity:.85">';
    html += '<li>五行补缺方案（显示前2条）</li>';
    html += '<li>太岁化解方案（显示前2条）</li>';
    html += '</ul>';
    html += '<div style="margin-top:12px;padding:12px;background:rgba(201,168,76,0.06);border-radius:8px;text-align:center">';
    html += '<p style="color:var(--gold);font-size:13px;margin-bottom:8px">👑 升级年度会员，解锁完整化解方案</p>';
    html += '<p style="font-size:11px;opacity:.6">年度会员：完整化解方案 + 年度更新</p>';
    html += '<p style="font-size:11px;opacity:.6">终身会员：完整化解方案 + 家庭成员 + 跨年衔接 + 专属物品定制</p>';
    html += '<button class="compute-btn" style="margin-top:8px" onclick="showSection(\'more\');showMoreModule(\'vip\')">升 级 会 员</button>';
    html += '</div>';
    html += '</div>';
  } else if (membershipLevel === 'annual') {
    html += '<h4 style="color:var(--gold);letter-spacing:3px;margin-bottom:16px">👑 年度会员完整化解方案</h4>';
    html += '<div style="background:rgba(255,255,255,0.02);padding:14px;border-radius:8px;border:1px solid rgba(201,168,76,0.1)">';
    html += '<p style="font-size:13px;line-height:2">✅ 完整五行补缺方案</p>';
    html += '<p style="font-size:13px;line-height:2">✅ 完整太岁化解方案</p>';
    html += '<p style="font-size:13px;line-height:2">✅ 完整催旺专项方案</p>';
    html += '<p style="font-size:13px;line-height:2">✅ 完整年度运程提醒</p>';
    html += '<p style="font-size:13px;line-height:2">✅ 完整居家风水调整</p>';
    html += '<p style="font-size:13px;line-height:2">✅ 完整开运锦囊</p>';
    html += '<p style="font-size:13px;line-height:2">✅ 逐月运程详解</p>';
    html += '<p style="font-size:13px;line-height:2">✅ 五维度化解建议</p>';
    html += '<p style="font-size:13px;line-height:2">✅ 化煞道观寺庙推荐</p>';
    html += '<p style="font-size:13px;line-height:2">✅ 年度自动更新</p>';
    html += '<div style="margin-top:12px;padding:12px;background:rgba(201,168,76,0.06);border-radius:8px;text-align:center">';
    html += '<p style="color:var(--gold);font-size:13px;margin-bottom:8px">💎 升级终身会员，解锁更多权益</p>';
    html += '<p style="font-size:11px;opacity:.6">终身会员：家庭成员化解 + 跨年衔接 + 专属物品定制</p>';
    html += '</div>';
    html += '</div>';
  } else if (membershipLevel === 'lifetime') {
    html += '<h4 style="color:var(--gold);letter-spacing:3px;margin-bottom:16px">💎 终身会员尊享化解方案</h4>';
    html += '<div style="background:rgba(255,255,255,0.02);padding:14px;border-radius:8px;border:1px solid rgba(201,168,76,0.1)">';
    html += '<p style="font-size:13px;line-height:2">✅ 年度会员所有权益</p>';
    html += '<p style="font-size:13px;line-height:2">✅ 家庭成员个性化化解方案</p>';
    html += '<p style="font-size:13px;line-height:2">✅ 家庭整体化解（避免冲突）</p>';
    html += '<p style="font-size:13px;line-height:2">✅ 化解物品协同效应检查</p>';
    html += '<p style="font-size:13px;line-height:2">✅ 跨年衔接方案（每年自动更新）</p>';
    html += '<p style="font-size:13px;line-height:2">✅ 专属物品定制推荐</p>';
    html += '<p style="font-size:13px;line-height:2">✅ 化解物品购买指南（价格/渠道/辨别真伪）</p>';
    html += '<p style="font-size:13px;line-height:2">✅ 化解物品更换周期提醒</p>';
    html += '<p style="font-size:13px;line-height:2">✅ 专属顾问答疑</p>';
    html += '<div style="margin-top:12px;padding:12px;background:rgba(201,168,76,0.06);border-radius:8px;text-align:center">';
    html += '<p style="color:var(--gold);font-size:13px">💎 终身会员尊享，持续为您守护</p>';
    html += '</div>';
    html += '</div>';
  }

  html += '</div>';
  return html;
}

// ================================================================
// 十一、辅助函数
// ================================================================

const _GAN_ELE = { '甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水' };
const _ZHI_ELE = { '子':'水','丑':'土','寅':'木','卯':'木','辰':'土','巳':'火','午':'火','未':'土','申':'金','酉':'金','戌':'土','亥':'水' };

function _eleSheng(a, b) {
  const sheng = { '木':'火','火':'土','土':'金','金':'水','水':'木' };
  return sheng[a] === b;
}

function _eleKe(a, b) {
  const ke = { '木':'土','土':'水','水':'火','火':'金','金':'木' };
  return ke[a] === b;
}

function _getElementCrystal(ele) {
  const map = { '木':'绿幽灵或翡翠', '火':'红玛瑙或紫水晶', '土':'黄水晶或和田玉', '金':'白水晶或金银', '水':'海蓝宝或黑曜石' };
  return map[ele] || '白水晶';
}

function _getElementColor(ele) {
  const map = { '木':'绿色、青色', '火':'红色、紫色', '土':'黄色、棕色', '金':'白色、金色', '水':'蓝色、黑色' };
  return map[ele] || '白色';
}

function _getElementDirection(ele) {
  const map = { '木':'东方、东南', '火':'南方', '土':'中央、西南', '金':'西方、西北', '水':'北方' };
  return map[ele] || '东方';
}

function _getYearGanZhi(year) {
  // 2024=甲子...不对,2024=甲辰
  // 2024年=甲辰, 2025=乙巳, 2026=丙午, 2027=丁未
  const ganList = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
  const zhiList = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
  const baseYear = 2024;
  let baseGanIdx = 0; // 甲
  let baseZhiIdx = 4; // 辰
  let diff = year - baseYear;
  let ganIdx = ((baseGanIdx + diff) % 10 + 10) % 10;
  let zhiIdx = ((baseZhiIdx + diff) % 12 + 12) % 12;
  return { gan: ganList[ganIdx], zhi: zhiList[zhiIdx] };
}

// ================================================================
// 十二、化解中心渲染函数
// ================================================================

function renderCureCenter() {
  let out = document.getElementById('cureCenterOutput');
  if (!out) return;

  const html = '';

  // 化解中心标题
  html += '<div class="result-banner">';
  html += '<h2 class="rb-name">化解中心 · 全面开运方案</h2>';
  html += '<p class="rb-meta">融合八字、紫微、奇门、六壬、风水之化解智慧</p>';
  html += '<div class="rb-tags">';
  html += '<span class="rb-tag">五行补缺</span>';
  html += '<span class="rb-tag">流年化解</span>';
  html += '<span class="rb-tag">物品推荐</span>';
  html += '<span class="rb-tag">家庭化解</span>';
  html += '</div>';
  html += '</div>';

  // 化解方案分类
  html += '<div class="cure-category-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-top:20px">';

  let categories = [
    { id: 'cure-bazi', icon: '🌟', title: '八字化解', desc: '五行补缺·太岁化解·催旺专项' },
    { id: 'cure-ziwei', icon: '🔮', title: '紫微化解', desc: '主星化解·煞星化解·四化应对' },
    { id: 'cure-qimen', icon: '☰', title: '奇门化解', desc: '八门九星·八神化解·伏吟反吟' },
    { id: 'cure-liuren', icon: '⬡', title: '六壬化解', desc: '三传化解·天将化解·神煞化解' },
    { id: 'cure-meihua', icon: '🌸', title: '梅花化解', desc: '体用生克·互卦变卦' },
    { id: 'cure-liuyao', icon: '䷀', title: '六爻化解', desc: '六亲旺衰·世应关系' },
    { id: 'cure-fengshui', icon: '🏔️', title: '风水化解', desc: '八宅煞气·玄空飞星' },
    { id: 'cure-annual', icon: '📅', title: '年度化解', desc: '流年飞星·太岁三煞·五黄二黑' },
    { id: 'cure-family', icon: '👨‍👩‍👧‍👦', title: '家庭化解', desc: '成员化解·协同检查' },
    { id: 'cure-items', icon: '💎', title: '物品大全', desc: '50+种物品·购买指南·摆放规则' }
  ];

  for (let i = 0; i < categories.length; i++) {
    let c = categories[i];
    html += '<div class="cure-category-card" style="padding:16px;background:rgba(201,168,76,0.04);border:1px solid rgba(201,168,76,0.15);border-radius:10px;cursor:pointer;transition:all .3s" onclick="showCureCategory(\'' + c.id + '\')">';
    html += '<div style="font-size:24px;margin-bottom:8px">' + c.icon + '</div>';
    html += '<div style="font-size:14px;color:var(--gold);letter-spacing:2px;margin-bottom:4px">' + c.title + '</div>';
    html += '<div style="font-size:11px;opacity:.6;line-height:1.6">' + c.desc + '</div>';
    html += '</div>';
  }

  html += '</div>';

  // 化解方案输出区
  html += '<div id="cureCategoryOutput" style="margin-top:20px"></div>';

  out.innerHTML = html;
  out.style.display = 'block';
  out.classList.add('visible');
}

function showCureCategory(catId) {
  let out = document.getElementById('cureCategoryOutput');
  if (!out) return;
  const html = '';

  if (catId === 'cure-bazi') {
    html += '<h4 style="color:var(--gold);margin-bottom:12px">🌟 八字化解方案</h4>';
    html += '<p style="opacity:.6;font-size:12px;margin-bottom:16px">请前往「开运化解」板块，输入生辰八字生成个性化化解方案。</p>';
    html += '<button class="compute-btn" onclick="showSection(\'huajie\')">前 往 化 解 板 块</button>';
  } else if (catId === 'cure-ziwei') {
    html += '<h4 style="color:var(--gold);margin-bottom:12px">🔮 紫微斗数化解方案</h4>';
    html += '<p style="opacity:.6;font-size:12px;margin-bottom:16px">请前往「紫微斗数」排盘，排盘后自动生成紫微化解方案。</p>';
    html += '<button class="compute-btn" onclick="showSection(\'ziwei\')">前 往 紫 微 排 盘</button>';
  } else if (catId === 'cure-qimen') {
    html += '<h4 style="color:var(--gold);margin-bottom:12px">☰ 奇门遁甲化解方案</h4>';
    html += '<p style="opacity:.6;font-size:12px;margin-bottom:16px">请前往「奇门遁甲」排盘，排盘后自动生成奇门化解方案。</p>';
    html += '<button class="compute-btn" onclick="showSection(\'qimen\')">前 往 奇 门 排 盘</button>';
  } else if (catId === 'cure-liuren') {
    html += '<h4 style="color:var(--gold);margin-bottom:12px">⬡ 大六壬化解方案</h4>';
    html += '<p style="opacity:.6;font-size:12px;margin-bottom:16px">请前往「大六壬」排盘，排盘后自动生成六壬化解方案。</p>';
    html += '<button class="compute-btn" onclick="showSection(\'liuren\')">前 往 六 壬 排 盘</button>';
  } else if (catId === 'cure-meihua') {
    html += '<h4 style="color:var(--gold);margin-bottom:12px">🌸 梅花易数化解方案</h4>';
    html += '<p style="opacity:.6;font-size:12px;margin-bottom:16px">请前往「梅花易数」起卦，起卦后自动生成梅花化解方案。</p>';
    html += '<button class="compute-btn" onclick="showSection(\'meihua\')">前 往 梅 花 起 卦</button>';
  } else if (catId === 'cure-liuyao') {
    html += '<h4 style="color:var(--gold);margin-bottom:12px">䷀ 六爻化解方案</h4>';
    html += '<p style="opacity:.6;font-size:12px;margin-bottom:16px">请前往「六爻占卜」起卦，起卦后自动生成六爻化解方案。</p>';
    html += '<button class="compute-btn" onclick="showSection(\'yijing\')">前 往 六 爻 起 卦</button>';
  } else if (catId === 'cure-fengshui') {
    html += '<h4 style="color:var(--gold);margin-bottom:12px">🏔️ 风水化解方案</h4>';
    html += '<p style="opacity:.6;font-size:12px;margin-bottom:16px">请前往「风水分析」排盘，排盘后自动生成风水化解方案。</p>';
    html += '<button class="compute-btn" onclick="showSection(\'fengshui\')">前 往 风 水 分 析</button>';
  } else if (catId === 'cure-annual') {
    html += getAnnualCurePlan(null, new Date().getFullYear());
  } else if (catId === 'cure-family') {
    html += '<h4 style="color:var(--gold);margin-bottom:12px">👨‍👩‍👧‍👦 家庭成员化解方案</h4>';
    html += '<p style="opacity:.6;font-size:12px;margin-bottom:16px">请前往「家庭排盘」录入家庭成员信息，系统将自动生成家庭化解方案。</p>';
    html += '<button class="compute-btn" onclick="showSection(\'family\')">前 往 家 庭 排 盘</button>';
  } else if (catId === 'cure-items') {
    html += '<h4 style="color:var(--gold);margin-bottom:12px">💎 化解物品大全</h4>';
    let catalog = getCureItemCatalog();
    for (let category in catalog) {
      let items = catalog[category];
      let catName = {crystals:'💎 水晶类', metals:'🪙 金属类', woods:'🪵 木器类', earth:'🏺 土器类', water:'💧 水器类', fire:'🔥 火器类', talismans:'📜 符咒类'}[category] || category;
      html += '<div style="margin-bottom:16px">';
      html += '<h5 style="font-size:13px;color:var(--gold);letter-spacing:2px;margin-bottom:8px">' + catName + '</h5>';
      for (let i = 0; i < items.length; i++) {
        let item = items[i];
        html += '<div style="margin-bottom:8px;padding:10px;background:rgba(255,255,255,0.02);border-radius:6px;border:1px solid rgba(201,168,76,0.06)">';
        html += '<div style="display:flex;justify-content:space-between;align-items:center">';
        html += '<span style="color:var(--gold);font-size:13px">' + item.name + '</span>';
        html += '<span style="font-size:11px;opacity:.5">' + item.price + '</span>';
        html += '</div>';
        html += '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:2px;font-size:11px;opacity:.7;margin-top:4px">';
        html += '<div>五行：' + item.element + ' · 颜色：' + item.color + '</div>';
        html += '<div>方位：' + item.placement + ' · 保养：' + item.care + '</div>';
        html += '</div>';
        html += '<div style="font-size:11px;opacity:.7;margin-top:2px">用途：' + item.use + '</div>';
        html += '<div style="font-size:11px;opacity:.5;margin-top:2px">购买：' + item.source + '</div>';
        html += '</div>';
      }
      html += '</div>';
    }
  }

  out.innerHTML = html;
  out.scrollIntoView({behavior:'smooth',block:'nearest'});
}

//console.log('[cure-engine.js] 化解方案引擎 v1.0 加载完成');