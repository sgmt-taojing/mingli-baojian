  try {
    if (!year || !month || !day) return;
    var bazi = getBaziCalcData(year, month, day, hour || 12, sex || 'male');
    var hj = {
      name: name || '有缘人',
      year: year, month: month, day: day, hour: hour || 12, sex: sex || 'male',
      dayStem: bazi.dayStem, dayBranch: bazi.dayBranch,
      dayStemIdx: bazi.dayStemIdx, dayBranchIdx: bazi.dayBranchIdx,
      pillars: bazi.pillars, eleCount: bazi.eleCount, total: bazi.total,
      weakestEle: bazi.weakestEle, strongestEle: bazi.strongestEle,
      xiEle: bazi.xiEle, mingGua: bazi.mingGua, shishen: bazi.shishen,
      qiyong: bazi.qiyong, tenGods: bazi.tenGods, shensha: bazi.shensha,
      isStrong: bazi.isStrong, currentYear: new Date().getFullYear()
    };
    var el = document.getElementById(resultElId);
    if (!el) return;
    var html = '<div class="huajie-injected" style="margin-top:24px;padding-top:20px;border-top:2px solid rgba(201,168,76,0.15)">';
    html += '<div style="text-align:center;font-size:12px;color:var(--paper3);margin-bottom:16px;letter-spacing:3px">知命 · 改运 · 修心持善守静</div>';
    html += '<h4 style="text-align:center;color:var(--gold);letter-spacing:6px;margin-bottom:16px;font-family:\'Ma Shan Zheng\',serif">🛡️ 化解方案 · 因人制宜</h4>';
    html += '<div class="huajie-block"><h5>🎯 年龄段化解方案</h5>' + getAgeBasedHuajie(hj) + '</div>';
    html += '<div class="huajie-block"><h5>🔮 十神缺失分析与化解</h5>' + getTenGodMissingHuajie(hj) + '</div>';
    html += '<div class="huajie-block"><h5>💸 漏财相分析与堵漏方案</h5>' + getLoucaiHuajie(hj) + '</div>';
    html += '<div class="huajie-block"><h5>🔥 个性化催旺方案</h5>' + getCuiwangPersonalized(hj) + '</div>';
    // 三元九运方位调整
    var hjYY = getCurrentYuanYun(hj.currentYear);
    var hjDmFull = _getDayMasterFull(hj.dayStem);
    var hjDmEle = ELE[hj.dayStem] || '木';
    var hjRel = _sanyuanWxRelation(hjDmEle, hjYY.wuxing);
    var hjRelDesc = '';
    if (hjRel === '生我') hjRelDesc = '运星生扶日主，顺势发展，贵人运旺';
    else if (hjRel === '我生') hjRelDesc = '日主泄于运星，注意精力管理，补水养身';
    else if (hjRel === '克我') hjRelDesc = '运星克日主，压力较大，宜守不宜攻';
    else if (hjRel === '我克') hjRelDesc = '日主克运星为财，财运旺，把握机遇';
    else hjRelDesc = '比和稳固，顺势而为';
    html += '<div class="huajie-block"><h5>🧭 三元九运方位调整（' + hjYY.name + '）</h5>';
    html += '<div style="padding:12px;background:rgba(231,76,60,0.04);border-radius:8px;margin-bottom:10px">';
    html += '<p style="font-size:13px;color:#e74c3c;font-weight:bold;margin-bottom:6px">当前运星：' + hjYY.name + '（' + hjYY.yuan + ' · ' + hjYY.star + ' · ' + hjYY.wuxing + '行）</p>';
    html += '<p style="font-size:12px;opacity:.7;line-height:1.8">对' + hjDmFull + '日主：' + hjRelDesc + '</p>';
    html += '</div>';
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">';
    html += '<div style="padding:10px;background:rgba(231,76,60,0.06);border-radius:8px;border-left:3px solid #e74c3c">';
    html += '<p style="font-size:12px;color:#e74c3c;font-weight:bold;margin-bottom:4px">🔼 正神位（宜催旺）</p>';
    html += '<p style="font-size:12px;opacity:.7;line-height:1.6">正南方为九紫正神位，宜放置红色/紫色饰品、紫水晶、红玛瑙。保持明亮整洁，催旺事业与人气。</p>';
    html += '</div>';
    html += '<div style="padding:10px;background:rgba(41,128,185,0.06);border-radius:8px;border-left:3px solid #2980b9">';
    html += '<p style="font-size:12px;color:#2980b9;font-weight:bold;margin-bottom:4px">🔽 零神位（宜化解）</p>';
    html += '<p style="font-size:12px;opacity:.7;line-height:1.6">正北方为零神位，宜放置黑曜石、金属饰品化煞。避免在此方位安床或设灶。</p>';
    html += '</div>';
    html += '</div>';
    html += '<p style="font-size:12px;opacity:.6;line-height:1.8">💡 流年飞星与运星叠加：每年流年九紫星飞临之方位为当年最旺位，可在此方位催旺。流年五黄星飞临之方位需化解，避免动土。</p>';
    html += '</div>';
    html += '</div>';
    el.innerHTML += html;
  } catch(e) {
    console.warn('[化解模块注入失败]', e.message);
  }
}

function getDimensionAdvice(hj) {
  const dayStem = hj.dayStem;