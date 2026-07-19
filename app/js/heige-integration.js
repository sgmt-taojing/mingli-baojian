// ═══════════════════════════════════════════════════════════════
// HeiGe-SuanMing 精确排盘引擎集成模块 v1.0
// 基于 paipan.py v1.2 — 立春定年柱、节气定月柱、真太阳时校正
// 方法论：排盘→旺衰→用神→格局→岁运→十神六亲→分维度断语→调候趋避
// ═══════════════════════════════════════════════════════════════

let HEIGE_API = (typeof HEIGE_API_BASE !== 'undefined') ? HEIGE_API_BASE : 'http://127.0.0.1:8911';

// HeiGe 方法论 11 步流程标签
let HEIGE_STEPS = [
  { id: 'read', name: '读盘定盘面', desc: '提取日主、月令、刑冲合会关键要素' },
  { id: 'wangshuai', name: '判定日主旺衰', desc: '月令得失→通根→生扶→党众→定档' },
  { id: 'yongshen', name: '取用神定喜忌', desc: '调候≥扶抑>通关>病药；从格顺势' },
  { id: 'geju', name: '判定格局成败', desc: '月令取格，看相神护卫，定层次' },
  { id: 'dayun', name: '大运流年分析', desc: '引动用神/忌神，冲提纲，应期' },
  { id: 'shishen', name: '十神六亲落宫', desc: '各十神所在宫位→人生阶段领域' },
  { id: 'dimensions', name: '分维度详断', desc: '性格/事业/财运/婚姻/健康/学业/六亲' },
  { id: 'tiaohou', name: '调候趋避调养', desc: '方位·色彩·行业·作息·饮食·情志' },
  { id: 'summary', name: '综合总评', desc: '3-5句收束：核心结构·大势·优劣' }
];

// 调候用神速查表（穷通宝鉴摘要）— 用于前端快速参考
let TIAOHOU_TABLE = {
  '甲寅': '丙火温照，癸水润泽', '甲卯': '丙火温照，癸水润泽',
  '甲辰': '庚金伐木，丁火照暖', '甲巳': '癸水优先，丁火辅助',
  '甲午': '癸水为急，丁火为佐', '甲未': '癸水润土，丁火明局',
  '甲申': '丙火照暖，癸水润泽', '甲酉': '丙火照暖，癸水润泽',
  '甲戌': '癸水润泽，丁火照暖', '甲亥': '丙火为尊，戊土治水',
  '甲子': '丙火为尊，戊土治水', '甲丑': '丙火照暖，丁火辅助',
  '乙寅': '丙火温照，癸水润泽', '乙卯': '丙火温照，癸水润泽',
  '乙辰': '癸水润泽，丙火照暖', '乙巳': '癸水为急，丙火辅助',
  '乙午': '癸水为急，丙火辅助', '乙未': '癸水润土，丙火照暖',
  '乙申': '丙火照暖，癸水润泽', '乙酉': '丙火照暖，癸水润泽',
  '乙戌': '癸水润泽，丙火照暖', '乙亥': '丙火为尊，戊土治水',
  '乙子': '丙火为尊，戊土治水', '乙丑': '丙火照暖，丁火辅助',
  '丙寅': '壬水为尊，庚金发源', '丙卯': '壬水为尊，庚金发源',
  '丙辰': '壬水为尊，甲木疏土', '丙巳': '壬水为急，庚金发源',
  '丙午': '壬水为急，庚金为佐', '丙未': '壬水润土，甲木疏土',
  '丙申': '壬水为尊，甲木辅助', '丙酉': '壬水为尊，甲木辅助',
  '丙戌': '壬水润泽，甲木疏土', '丙亥': '壬水为尊，甲木辅助',
  '丙子': '壬水为尊，甲木辅助', '丙丑': '壬水润泽，甲木疏土',
  '丁寅': '甲木为尊，庚金伐木', '丁卯': '甲木为尊，庚金伐木',
  '丁辰': '甲木疏土，庚金发源', '丁巳': '甲木为尊，庚金为佐',
  '丁午': '甲木为尊，壬水为佐', '丁未': '甲木疏土，壬水润泽',
  '丁申': '甲木为尊，庚金发源', '丁酉': '甲木为尊，庚金发源',
  '丁戌': '甲木疏土，庚金发源', '丁亥': '甲木为尊，庚金为佐',
  '丁子': '甲木为尊，庚金为佐', '丁丑': '甲木疏土，庚金发源',
  '戊寅': '丙火照暖，癸水润泽', '戊卯': '丙火照暖，癸水润泽',
  '戊辰': '甲木疏土，癸水润泽', '戊巳': '癸水为急，丙火辅助',
  '戊午': '癸水为急，丙火为佐', '戊未': '癸水润土，甲木疏土',
  '戊申': '丙火照暖，癸水润泽', '戊酉': '丙火照暖，癸水润泽',
  '戊戌': '癸水润泽，甲木疏土', '戊亥': '丙火为尊，甲木辅助',
  '戊子': '丙火为尊，甲木辅助', '戊丑': '丙火照暖，甲木疏土',
  '己寅': '丙火照暖，癸水润泽', '己卯': '丙火照暖，癸水润泽',
  '己辰': '甲木疏土，癸水润泽', '己巳': '癸水为急，丙火辅助',
  '己午': '癸水为急，丙火为佐', '己未': '癸水润土，甲木疏土',
  '己申': '丙火照暖，癸水润泽', '己酉': '丙火照暖，癸水润泽',
  '己戌': '癸水润泽，甲木疏土', '己亥': '丙火为尊，甲木辅助',
  '己子': '丙火为尊，甲木辅助', '己丑': '丙火照暖，甲木疏土',
  '庚寅': '丁火炼金，甲木引丁', '庚卯': '丁火炼金，甲木引丁',
  '庚辰': '甲木疏土，丁火炼金', '庚巳': '壬水洗淘，丁火炼金',
  '庚午': '壬水洗淘，丁火炼金', '庚未': '甲木疏土，丁火炼金',
  '庚申': '丁火炼金，甲木引丁', '庚酉': '丁火炼金，甲木引丁',
  '庚戌': '甲木疏土，丁火炼金', '庚亥': '丁火照暖，甲木辅助',
  '庚子': '丁火照暖，甲木辅助', '庚丑': '丁火照暖，甲木辅助',
  '辛寅': '壬水洗淘，丙火照暖', '辛卯': '壬水洗淘，丙火照暖',
  '辛辰': '壬水洗淘，甲木疏土', '辛巳': '壬水洗淘，丙火照暖',
  '辛午': '壬水洗淘，丙火照暖', '辛未': '壬水洗淘，甲木疏土',
  '辛申': '壬水洗淘，丙火照暖', '辛酉': '壬水洗淘，丙火照暖',
  '辛戌': '壬水洗淘，甲木疏土', '辛亥': '壬水洗陶，丙火照暖',
  '辛子': '壬水洗陶，丙火照暖', '辛丑': '壬水洗陶，丙火照暖',
  '壬寅': '庚金发源，戊土治水', '壬卯': '庚金发源，戊土治水',
  '壬辰': '甲木疏土，庚金发源', '壬巳': '壬水为急，辛金发源',
  '壬午': '壬水为急，辛金发源', '壬未': '甲木疏土，庚金发源',
  '壬申': '戊土治水，甲木辅助', '壬酉': '戊土治水，甲木辅助',
  '壬戌': '甲木疏土，庚金发源', '壬亥': '戊土治水，丙火照暖',
  '壬子': '戊土治水，丙火照暖', '壬丑': '戊土治水，丙火照暖',
  '癸寅': '辛金发源，丙火照暖', '癸卯': '辛金发源，丙火照暖',
  '癸辰': '甲木疏土，辛金发源', '癸巳': '辛金发源，丙火照暖',
  '癸午': '辛金发源，丙火照暖', '癸未': '甲木疏土，辛金发源',
  '癸申': '戊土治水，辛金发源', '癸酉': '戊土治水，辛金发源',
  '癸戌': '甲木疏土，辛金发源', '癸亥': '戊土治水，丙火照暖',
  '癸子': '戊土治水，丙火照暖', '癸丑': '戊土治水，丙火照暖'
};

// 五行养生调养表（摘自 references/15）
let WUXING_YANGSHENG = {
  '木': {
    organs: '肝胆',
    diet: '绿色蔬菜、酸味食物、枸杞、菊花茶',
    exercise: '导引、太极、森林漫步',
    emotion: '制怒、疏达、勿郁',
    routine: '早起丑寅时（1-5点）深睡养肝，忌熬夜'
  },
  '火': {
    organs: '心血小肠',
    diet: '红色食物、苦味、莲子心茶、红枣',
    exercise: '八段锦、冥想、日光浴',
    emotion: '制喜养心、勿过度兴奋',
    routine: '午时（11-13点）小憩养心，忌过劳'
  },
  '土': {
    organs: '脾胃',
    diet: '黄色食物、甘味、山药、小米粥',
    exercise: '散步、揉腹、站桩',
    emotion: '制思、勿过度忧虑',
    routine: '辰巳时（7-11点）进食养胃，忌生冷'
  },
  '金': {
    organs: '肺大肠',
    diet: '白色食物、辛味、百合、银耳',
    exercise: '深呼吸、六字诀、慢跑',
    emotion: '制悲、勿过度悲伤',
    routine: '寅卯时（3-7点）深呼吸养肺，忌悲泣'
  },
  '水': {
    organs: '肾膀胱',
    diet: '黑色食物、咸味、黑芝麻、核桃',
    exercise: '搓腰、泡脚、瑜伽',
    emotion: '制恐、勿惊慌',
    routine: '酉亥时（17-23点）早睡养肾，忌惊恐'
  }
};

// 色彩服饰调候表（摘自 references/16）
let WUXING_SECAI = {
  '木': { colors: '青绿碧翠', materials: '木质、竹质、棉麻', direction: '东方', industries: '教育、文化、出版、设计、园艺' },
  '火': { colors: '红紫橙粉', materials: '琉璃、红绳、电子', direction: '南方', industries: '传媒、餐饮、能源、演艺、IT' },
  '土': { colors: '黄棕咖褐', materials: '陶瓷、玉石、水晶', direction: '中央/本地', industries: '地产、建筑、农业、金融、仓储' },
  '金': { colors: '白银金灰', materials: '金属、金银饰', direction: '西方', industries: '机械、五金、法律、军警、银行' },
  '水': { colors: '黑蓝深灰', materials: '水晶、玻璃、珍珠', direction: '北方', industries: '物流、旅游、水产、贸易、咨询' }
};

/**
 * 调用 HeiGe Python 引擎精确排盘
 * @param {Object} params - {year, month, day, hour, minute, sex, lunar, lng, tz, zi_sect, years}
 * @returns {Promise<Object>} 排盘结果JSON
 */
async function heigePaipan(params) {
  try {
    let resp = await fetch(HEIGE_API + '/paipan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!resp.ok) {
      let err = await resp.json();
      return { error: err.error || '排盘失败' };
    }
    return await resp.json();
  } catch (e) {
    // 降级：如果排盘服务不可用，返回提示
    return { error: '排盘服务不可用（端口8911），将使用内置JS引擎。请确保 paipan-server.py 已启动。' };
  }
}

/**
 * 调用 HeiGe 分析API（排盘+方法论框架）
 */
async function heigeAnalyze(params) {
  try {
    let resp = await fetch(HEIGE_API + '/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!resp.ok) return { error: '分析服务不可用' };
    return await resp.json();
  } catch (e) {
    return { error: '分析服务不可用（端口8911），将使用内置JS引擎。' };
  }
}

/**
 * 查调候用神
 * @param {string} dayGan - 天干（甲-癸）
 * @param {string} monthZhi - 地支（子-亥）
 * @returns {string} 调候建议
 */
function getTiaohou(dayGan, monthZhi) {
  let key = dayGan + monthZhi;
  return TIAOHOU_TABLE[key] || '查穷通宝鉴';
}

/**
 * 获取五行养生调养建议
 * @param {string} wuxing - 五行（木火土金水）
 * @returns {Object} 调养建议
 */
function getYangsheng(wuxing) {
  return WUXING_YANGSHENG[wuxing] || null;
}

/**
 * 获取色彩服饰调候建议
 * @param {string} wuxing - 用神五行
 * @returns {Object} 色彩建议
 */
function getSecai(wuxing) {
  return WUXING_SECAI[wuxing] || null;
}

/**
 * 生成 HeiGe 方法论引导的分析框架 HTML
 * @param {Object} chart - paipan.py 返回的命盘JSON
 * @returns {string} HTML
 */
function renderHeigeFramework(chart) {
  if (!chart || chart.error) return '<div style="padding:20px;color:var(--cinn2)">' + (chart && chart.error ? chart.error : '排盘失败') + '</div>';

  let pillars = chart.pillars || {};
  let dayMaster = chart.day_master || '';
  let wuxingPower = chart.wuxing_power || {};
  let samePct = chart.same_party_pct || 0;
  let relations = chart.relations || {};
  let geju = chart.geju || [];
  let shensha = chart.shensha || {};
  let dayun = chart.dayun || [];
  const html = '';

  // 方法论标签
  html += '<div style="background:linear-gradient(135deg,var(--ink3),var(--cyan));border-radius:12px;padding:20px;margin:16px 0;border:1px solid var(--gold)">';
  html += '<div style="color:var(--gold);font-size:14px;font-weight:bold;letter-spacing:2px;margin-bottom:12px">🔬 HeiGe 方法论 · 11步系统推演</div>';
  html += '<div style="display:flex;flex-wrap:wrap;gap:6px">';
  for (let i = 0; i < HEIGE_STEPS.length; i++) {
    let s = HEIGE_STEPS[i];
    html += '<span style="background:rgba(255,215,0,0.1);border:1px solid rgba(255,215,0,0.3);border-radius:6px;padding:4px 10px;font-size:11px;color:var(--gold)" title="' + s.desc + '">' + (i+1) + '. ' + s.name + '</span>';
  }
  html += '</div></div>';

  // 命盘展示
  html += '<div style="background:var(--paper);border-radius:8px;padding:16px;margin:12px 0">';
  html += '<div style="color:var(--ink);font-weight:bold;margin-bottom:10px">【命盘】' + (chart.input && chart.input.solar || '') + ' ' + (chart.input && chart.input.gender || '') + '</div>';
  if (chart.input && chart.input.jieqi) html += '<div style="font-size:12px;color:var(--paper2);margin-bottom:8px">' + chart.input.jieqi + '</div>';
  html += '<table style="width:100%;font-size:12px;border-collapse:collapse">';
  html += '<tr style="border-bottom:1px solid rgba(0,0,0,0.1)"><td></td><td>年柱</td><td>月柱</td><td>日柱</td><td>时柱</td></tr>';
  html += '<tr><td style="color:var(--paper2)">天干</td>';
  ['年','月','日','时'].forEach(function(k) {
    let p = pillars[k] || '--';
    html += '<td style="text-align:center;font-weight:bold;color:var(--ink)">' + p.charAt(0) + '</td>';
  });
  html += '</tr><tr><td style="color:var(--paper2)">地支</td>';
  ['年','月','日','时'].forEach(function(k) {
    let p = pillars[k] || '--';
    html += '<td style="text-align:center;font-weight:bold;color:var(--ink)">' + p.charAt(1) + '</td>';
  });
  html += '</tr></table>';

  // 旺衰量化
  if (wuxingPower && Object.keys(wuxingPower).length > 0) {
    html += '<div style="margin-top:12px;font-size:12px"><b>五行力量：</b>';
    Object.keys(wuxingPower).forEach(function(wx) {
      html += '<span style="margin-right:8px">' + wx + ':' + wuxingPower[wx] + '</span>';
    });
    html += '<br><span style="color:var(--paper2)">同党占比 ' + samePct + '% → ';
    if (samePct > 55) html += '偏强';
    else if (samePct < 45) html += '偏弱';
    else html += '均衡（需结合月令细辨）';
    html += '</span></div>';
  }

  // 刑冲合会
  if (relations && Object.keys(relations).length > 0) {
    html += '<div style="margin-top:8px;font-size:12px"><b>刑冲合会：</b>';
    Object.keys(relations).forEach(function(k) {
      let arr = relations[k];
      if (arr && arr.length > 0) {
        html += '<span style="margin-right:8px;color:var(--cinn)">' + k + ': ' + (Array.isArray(arr) ? arr.join(', ') : arr) + '</span>';
      }
    });
    html += '</div>';
  }

  // 神煞
  if (shensha && Object.keys(shensha).length > 0) {
    html += '<div style="margin-top:8px;font-size:12px"><b>神煞：</b>';
    Object.keys(shensha).forEach(function(k) {
      html += '<span style="margin-right:6px;background:rgba(255,215,0,0.1);padding:2px 6px;border-radius:3px">' + k + '(' + shensha[k].join(',') + ')</span>';
    });
    html += '</div>';
  }

  html += '</div>';

  // 调候提示
  let dayGan = dayMaster.charAt(0);
  let monthZhi = pillars.month ? pillars.month.charAt(1) : '';
  let th = getTiaohou(dayGan, monthZhi);
  if (th) {
    html += '<div style="background:rgba(46,204,113,0.05);border-left:3px solid var(--jade);padding:10px 14px;margin:8px 0;border-radius:0 6px 6px 0">';
    html += '<div style="font-size:12px;color:var(--jade)"><b>调候用神：</b>' + th + '</div>';
    html += '<div style="font-size:11px;color:var(--paper2);margin-top:4px">出处：穷通宝鉴 · ' + dayGan + '木生于' + monthZhi + '月</div>';
    html += '</div>';
  }

  // 大运
  if (dayun && dayun.length > 0) {
    html += '<div style="margin-top:12px;font-size:12px"><b>大运：</b></div>';
    html += '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px">';
    dayun.slice(0, 8).forEach(function(d) {
      let isCurrent = d.current;
      html += '<div style="background:' + (isCurrent ? 'rgba(231,76,60,0.1)' : 'rgba(0,0,0,0.03)') + ';border:1px solid ' + (isCurrent ? 'var(--cinn2)' : 'rgba(0,0,0,0.1)') + ';border-radius:4px;padding:4px 8px;text-align:center;min-width:70px">';
      html += '<div style="font-weight:bold;color:var(--ink)">' + d.gan + d.zhi + '</div>';
      html += '<div style="font-size:10px;color:var(--paper2)">' + d.start_age + '-' + d.end_age + '岁</div>';
      if (d.gan_shen) html += '<div style="font-size:10px;color:var(--paper2)">' + d.gan_shen + '</div>';
      html += '</div>';
    });
    html += '</div>';
  }

  // 方法论提示
  html += '<div style="background:rgba(52,152,219,0.05);border-left:3px solid var(--cyan2);padding:10px 14px;margin:12px 0;border-radius:0 6px 6px 0;font-size:12px">';
  html += '<b style="color:var(--cyan2)">推演指引：</b>先定旺衰用神（月令权重最高），再判格局成败，后看大运引动用神/忌神。';
  html += '每条断语需注明依据（星+宫/原局+岁运），孤证不立。趋势化表达，不铁口直断。';
  html += '</div>';

  return html;
}

// 导出模块
if (typeof window !== 'undefined') {
  window.HeiGeEngine = {
    paipan: heigePaipan,
    analyze: heigeAnalyze,
    getTiaohou: getTiaohou,
    getYangsheng: getYangsheng,
    getSecai: getSecai,
    renderFramework: renderHeigeFramework,
    STEPS: HEIGE_STEPS,
    TIAOHOU: TIAOHOU_TABLE,
    YANGSHENG: WUXING_YANGSHENG,
    SECAI: WUXING_SECAI
  };
}
