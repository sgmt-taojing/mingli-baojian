// ═══ 命理宝鉴 · 缘主画像与年度推送 ═══
// 每次排盘自动合并画像；按画像生成年度个性化推送
const sec = require('./security-v2.js');

// 五行 → 颜色/方位/数字/品性
const WUXING_META = {
  金:{色:'白/银/金',方:'西',数:'4/9',品:'刚毅、果断、收敛',业:'金融/机械/法务/管理'},
  木:{色:'青/绿',方:'东',数:'3/8',品:'仁慈、上进、生长',业:'教育/文化/医药/农林'},
  水:{色:'黑/蓝',方:'北',数:'1/6',品:'智慧、灵活、流动',业:'科研/物流/通信/策划'},
  火:{色:'红/紫/橙',方:'南',数:'2/7',品:'热情、光明、向上',业:'传媒/电子/能源/艺术'},
  土:{色:'黄/棕/咖',方:'中央',数:'5/0',品:'稳重、包容、承载',业:'房产/建筑/政务/农业'}
};

// 模块 → 关注领域映射（决定画像 focus_areas）
const MOD_FOCUS = {
  bazi:'命格', yunshi:'运势', fengshui:'环境', zhongyi:'健康',
  caiyun:'财运', shiye:'事业', ganqing:'感情', wuxing:'五行',
  xingming:'姓名', qimen:'问事', ziwei:'命格', liuyao:'问事',
  meihua:'问事', liuren:'问事', zeri:'择日', huangli:'择日',
  taisui:'运势', yanzhi:'相貌', music:'健康', lifeindex:'综合',
  mobile:'号码'
};

// 模块 → 关心关键词种子（用于提取用户输入中的关键词）
const MOD_KEYWORDS = {
  shiye:['工作','事业','创业','跳槽','升职','求职','面试','同事','老板'],
  caiyun:['财运','收入','投资','理财','股票','副业','欠债','发财'],
  ganqing:['感情','婚姻','恋爱','桃花','分手','复合','相亲','对象'],
  zhongyi:['身体','失眠','脾胃','头痛','月经','血压','糖尿病','养生'],
  fengshui:['房子','装修','搬家','办公室','户型','床位','大门'],
  yunshi:['今年','明年','运气','流年','太岁','本命年'],
  xingming:['改名','名字','姓名','起名','宝宝']
};

// 已知日主 → 五行速查表（按天干常见五行归类）
const DAY_MASTER_ELE = {
  甲:'木',乙:'木',丙:'火',丁:'火',戊:'土',己:'土',庚:'金',辛:'金',壬:'水',癸:'水'
};

// ═══════ 核心：合并画像（每次排盘触发） ═══════
function mergeProfile(db, userId, type, inputData, resultData, rawQuery){
  try {
    // 1) 读取现有画像
    const existing = db.prepare('SELECT * FROM yuanzhu_profile WHERE user_id=?').get(userId) || {};

    // 2) 从 resultData 中提取关键信号
    let dayMaster='', xiEle='', jiEle='', lack='', zodiac='';
    if(resultData && typeof resultData === 'object'){
      dayMaster = resultData.dayMaster || resultData.day_master || resultData.日主 || '';
      const dm = String(dayMaster).trim().charAt(0);
      if(DAY_MASTER_ELE[dm]) xiEle = DAY_MASTER_ELE[dm];
      // 喜用/忌神 兼容多种字段名
      xiEle = xiEle || resultData.xiYong || resultData.xi || resultData.喜用 || '';
      jiEle = jiEle || resultData.ji || resultData.忌神 || '';
      // 缺行 常见于五行分析报告
      lack = resultData.lack || resultData.queXing || resultData.missing || resultData.缺行 || '';
      if(!lack && resultData.wuXing){
        const wx = resultData.wuXing;
        lack = Object.keys(wx).filter(k=>wx[k]===0).join('');
      }
      // 生肖
      zodiac = resultData.shengXiao || resultData.zodiac || resultData.生肖 || '';
    }

    // 3) 解析关注领域
    const focusSet = new Set();
    try{
      const old = JSON.parse(existing.focus_areas || '[]');
      old.forEach(f=>focusSet.add(f));
    }catch(_){}
    const focus = MOD_FOCUS[type];
    if(focus) focusSet.add(focus);
    // 从用户 query 推断领域（增强）
    if(rawQuery){
      const t = String(rawQuery).toLowerCase();
      for(const[mod,kws] of Object.entries(MOD_KEYWORDS)){
        if(kws.some(k=>t.includes(k))){
          const f = MOD_FOCUS[mod];
          if(f) focusSet.add(f);
        }
      }
    }

    // 4) 解析关心关键词
    const kwSet = new Set();
    try{
      const old = JSON.parse(existing.concern_keywords || '[]');
      old.forEach(k=>kwSet.add(k));
    }catch(_){}
    if(rawQuery){
      for(const[mod,kws] of Object.entries(MOD_KEYWORDS)){
        for(const k of kws){
          if(String(rawQuery).includes(k)) kwSet.add(k);
        }
      }
    }

    // 5) 解析模块使用统计
    const modStats = (()=>{
      try{return JSON.parse(existing.mod_stats || '{}');}catch(_){return {};}
    })();
    modStats[type] = (modStats[type] || 0) + 1;
    // 找出最常用模块（决定推送口吻）
    let topMod = type;
    let topCount = 0;
    for(const[m,c] of Object.entries(modStats)){
      if(c>topCount){topCount=c;topMod=m;}
    }

    // 6) 推送优先级：问事类高频 + 关注领域 ≥3 → 升级
    let priority = existing.push_priority || 'normal';
    const focusArr = Array.from(focusSet);
    const askCount = ['qimen','liuyao','meihua','liuren','ziwei'].reduce((s,m)=>s+(modStats[m]||0),0);
    if(askCount >= 3) priority = 'high';
    else if(focusArr.length >= 4) priority = 'high';
    else if(focusArr.length >= 2) priority = 'normal';

    // 7) 写回（UPSERT）
    const now = new Date().toISOString();
    const exists = !!existing.user_id;
    if(exists){
      db.prepare(`UPDATE yuanzhu_profile SET
        day_master=COALESCE(NULLIF(?,''), day_master),
        xi_ele=COALESCE(NULLIF(?,''), xi_ele),
        ji_ele=COALESCE(NULLIF(?,''), ji_ele),
        lack_wuxing=COALESCE(NULLIF(?,''), lack_wuxing),
        zodiac=COALESCE(NULLIF(?,''), zodiac),
        focus_areas=?, concern_keywords=?, mod_stats=?,
        paipan_count=paipan_count+1, last_paipan_at=?,
        push_priority=?, updated_at=?
        WHERE user_id=?`).run(
          dayMaster, xiEle, jiEle, lack, zodiac,
          JSON.stringify(focusArr), JSON.stringify(Array.from(kwSet)), JSON.stringify(modStats),
          now, priority, now, userId
        );
    }else{
      db.prepare(`INSERT INTO yuanzhu_profile
        (user_id, day_master, xi_ele, ji_ele, lack_wuxing, zodiac, focus_areas, concern_keywords, mod_stats, paipan_count, first_paipan_at, last_paipan_at, push_priority, created_at, updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
          userId, dayMaster, xiEle, jiEle, lack, zodiac,
          JSON.stringify(focusArr), JSON.stringify(Array.from(kwSet)), JSON.stringify(modStats),
          1, now, now, priority, now, now
        );
    }

    return {ok:true, focus: focusArr, topMod, priority};
  } catch(e) {
    return {ok:false, error: e.message};
  }
}

// ═══════ 核心：生成年度推送文案 ═══════
function generateYearlyPush(profile, year){
  const ele = (profile.xi_ele || profile.day_master_char || '').toString().charAt(0);
  const eleMeta = WUXING_META[profile.xi_ele] || WUXING_META[ele] || WUXING_META['木'];
  const zodiac = profile.zodiac || '未知';
  const lack = profile.lack_wuxing || '无明显缺行';
  const focus = (()=>{try{return JSON.parse(profile.focus_areas||'[]');}catch(_){return [];}})();
  const keywords = (()=>{try{return JSON.parse(profile.concern_keywords||'[]');}catch(_){return [];}})();
  const modStats = (()=>{try{return JSON.parse(profile.mod_stats||'{}');}catch(_){return {};}})();
  const topMod = Object.entries(modStats).sort((a,b)=>b[1]-a[1])[0];
  const topModName = topMod ? ({bazi:'八字',yunshi:'运势',shiye:'事业',caiyun:'财运',ganqing:'感情',zhongyi:'中医养生',fengshui:'风水',xingming:'姓名',mobile:'手机号'})[topMod[0]] || topMod[0] : '综合';

  // 一、开篇定调（按日主 + 五行）
  let opening = '';
  if(profile.xi_ele==='金') opening = `${year}年，金气主导，收敛与决断并行。`;
  else if(profile.xi_ele==='木') opening = `${year}年，木气生发，宜学习、成长与拓展。`;
  else if(profile.xi_ele==='水') opening = `${year}年，水气流通，宜智慧、变通、规划。`;
  else if(profile.xi_ele==='火') opening = `${year}年，火气旺盛，宜展示、表达、行动。`;
  else if(profile.xi_ele==='土') opening = `${year}年，土气沉稳，宜积蓄、稳成、落地。`;
  else opening = `${year}年，宜顺势而行，稳中求进。`;

  // 二、缺行补救开篇（给一个可立即做的动作）
  let lackAction = '';
  if(lack && lack!=='无明显缺行'){
    const lacks = lack.split('');
    const first = WUXING_META[lacks[0]];
    if(first) lackAction = `\n【开年补救】命局缺${lacks.join('、')}，建议新年前往${first.方}方，佩戴${first.色}系饰物，日常多用数字${first.数}。`;
  }

  // 三、关注领域定制（按 focus_areas 决定侧写哪几个领域）
  const sections = [];
  if(focus.includes('事业')||focus.includes('财运')||focus.includes('问事')){
    sections.push(`【事业/财运】日主${profile.day_master||'未排盘'}，${year}年适宜${eleMeta.业}相关方向。开春（农历正月）多穿${eleMeta.色}系，定事业位${eleMeta.方}方。可考虑${eleMeta.数}作为工位/电话尾号。`);
  }
  if(focus.includes('感情')){
    sections.push(`【感情桃花】${profile.xi_ele||'木'}命之人，${year}年桃花位${eleMeta.方}方。农历三四月为旺桃花期，可赴${eleMeta.方}方参加社交。单身者留意属相为${getLikes(zodiac)}之人。`);
  }
  if(focus.includes('健康')){
    sections.push(`【健康养生】${profile.xi_ele||'木'}主${eleMeta.品}，${year}年重点养${eleMeta==='木'?'肝':'金'===eleMeta?'肺':'水'===eleMeta?'肾':'火'===eleMeta?'心':'脾胃'}。季节变换时多食白色/绿色/应季菜，避免${profile.ji_ele||'燥热'}之物。`);
  }
  if(focus.includes('环境')||focus.includes('风水')){
    sections.push(`【家居风水】${year}年家中${eleMeta.方}方为吉位，可放置${eleMeta.色}系摆件。卧室床头宜靠实墙，避免横梁压顶。`);
  }
  if(focus.length===0){
    sections.push(`【综合建议】今年建议每季度做一次排盘，及时调整方向。`);
  }

  // 四、历史偏好挂钩（用 topMod 引导）
  let historyHint = '';
  if(topMod && topMod[1]>=3){
    historyHint = `\n（参考您过去常用「${topModName}」分析，今期特别加注此领域。）`;
  }

  // 五、关键字呼应（关键词提取）
  let keywordEcho = '';
  if(keywords.length>0){
    const top = keywords.slice(0,3).join('、');
    keywordEcho = `\n【关注点呼应】您过去常提到"${top}"，${year}年这些议题将进入显化期，建议主动规划而非被动等待。`;
  }

  // 六、闭环提醒
  const closing = `\n【定期推送】本系统将按年自动推送您的个人运势简报。如需关闭，进入"我的→推送设置"即可。`;

  return `${opening}${lackAction}\n${sections.join('\n\n')}${historyHint}${keywordEcho}${closing}\n\n═══ ${year}年个人推送 · ${profile.display_name||'缘主'}专属 ═══`;
}

// 简易合生肖速查（按六合/三合）
function getLikes(myZodiac){
  const map={'鼠':'牛、龙、猴','牛':'鼠、蛇、鸡','虎':'马、狗','兔':'羊、猪、龙','龙':'鸡、鼠、猴','蛇':'牛、鸡','马':'虎、狗、羊','羊':'兔、马、猪','猴':'鼠、龙','鸡':'蛇、龙、牛','狗':'虎、马','猪':'兔、羊'};
  return map[myZodiac] || '相合生肖';
}

// ═══════ 核心：检查是否已推 ═══════
function hasPushed(db, userId, year){
  const r = db.prepare(`SELECT id, status, content, sent_at, profile_snapshot FROM yuanzhu_yearly_push WHERE user_id=? AND push_year=? AND push_type='yearly'`).get(userId, year);
  return r;
}

// ═══════ 写入推送记录 ═══════
function savePush(db, userId, year, content, profileSnapshot){
  try {
    const existing = hasPushed(db, userId, year);
    if(existing){
      db.prepare(`UPDATE yuanzhu_yearly_push SET content=?, profile_snapshot=?, status='sent', sent_at=datetime('now','localtime') WHERE id=?`).run(content, profileSnapshot, existing.id);
      return {ok:true, id: existing.id, updated:true};
    }else{
      const r = db.prepare(`INSERT INTO yuanzhu_yearly_push (user_id, push_year, push_type, content, profile_snapshot, status, sent_at) VALUES (?,?,?,?,?, 'sent', datetime('now','localtime'))`).run(userId, year, 'yearly', content, profileSnapshot);
      return {ok:true, id: r.lastInsertRowid, updated:false};
    }
  } catch(e) {
    return {ok:false, error: e.message};
  }
}

module.exports = { mergeProfile, generateYearlyPush, hasPushed, savePush, WUXING_META, DAY_MASTER_ELE };