#!/usr/bin/env node
/**
 * 易道智鉴 · 命理宝鉴 · 每日推送生成器 (2026-08-11 重建 / 2026-09-26 MB-M1 v2 校正)
 *
 * 内容规范：docs/PUSH-SPEC.md（MB-M1 v2 固化：E1 日柱闸口 / E2 三级矛盾裁决 /
 *   E3 分数定调 / E5 落款唯一 / E6 五行口径 / 早推七板块·暮推五板块 / ━━━SPLIT━━━ 分段标记）
 *
 * 用法：node daily_push.js <full|public|simple|verify|monthly|yearly> [--tomorrow]
 *   - full   ：完整版（数据源 server/daily-recommendation.py 原文，含化解咒语全文+拼音注解）
 *   - public ：公开版（数据源 server/daily-push-bridge.py JSON；--tomorrow=暮推明日预告）
 *   - simple ：极简版（数据源同上，一句话速览）
 *
 * 依赖：python3 + server/daily-push-bridge.py + server/daily-recommendation.py
 * 拼音注解（如 净心神咒(zhòu)、缚魅(mèi)）为硬性保留内容，任何版本不得剥离。
 */
'use strict';

const { execFileSync } = require('child_process');
const path = require('path');

const ROOT = __dirname;
const BRIDGE = path.join(ROOT, 'server', 'daily-push-bridge.py');
const FULL_SCRIPT = path.join(ROOT, 'server', 'daily-recommendation.py');

const LINE = '━━━━━━━━━━━━━━━━━━';
const SEP = '════════════════════════';

/** 运行 python 脚本并取回 stdout（去尾部空白）
 *  R-PUSH-PY：钉死 /usr/bin/python3（系统 Python 才有 lunar_python），
 *  防止不同 shell 下裸 `python3` 解析到无 lunar_python 的解释器导致推送哑炮 */
function runPython(script, env) {
  try {
    return execFileSync('/usr/bin/python3', [script], {
      encoding: 'utf8',
      timeout: 60000,
      maxBuffer: 10 * 1024 * 1024,
      env: env ? Object.assign({}, process.env, env) : undefined,
    }).trim();
  } catch (e) {
    const stderr = (e.stderr || '').toString().trim();
    console.error(`[daily_push] /usr/bin/python3 ${script} 执行失败: ${stderr || e.message}`);
    process.exit(1);
  }
}

/** R119 修真补丁（2026-08-17）：计算 --tomorrow 目标日期 YYYY-MM-DD，供 bridge 与 full 共用 */
function getTargetDate(isTomorrow) {
  if (!isTomorrow) return null;
  const t = new Date();
  t.setDate(t.getDate() + 1);
  return t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0');
}

/** 获取桥接层 JSON 数据
 * 修真 P0-4（2026-08-15 R730）：可选 HTTP 模式
 *   - 修真 DAILY_PUSH_HTTP_BASE=http://127.0.0.1:8920 → 走 /api/daily-almanac 端点（推送+移动端+站内共用同源）
 *   - 不修真 → 兜底 execFile python3 BRIDGE（向后兼容，不影响 launchd 调用）
 */
function getBridgeData(isTomorrow) {
  const httpBase = process.env.DAILY_PUSH_HTTP_BASE;
  // R119：--tomorrow 目标日期计算（与 full 版共用同一 helper，保证三版日期一致）
  const targetDate = getTargetDate(isTomorrow);
  if (httpBase) {
    try {
      const http = require('http');
      const url = new URL(httpBase.replace(/\/$/, '') + '/api/daily-almanac' + (targetDate ? ('?year=' + targetDate.split('-')[0] + '&month=' + targetDate.split('-')[1] + '&day=' + targetDate.split('-')[2]) : ''));
      const payload = JSON.parse(require('child_process').execFileSync('curl', ['-s', '-m', '8', `http://${url.hostname}:${url.port}${url.pathname}`], { encoding: 'utf8', timeout: 10000 }));
      if (payload && payload.ok) {
        // 修真 P0-4 字段名归一化：/api/daily-almanac 字段名 → bridge 形状，供 buildPublic/buildSimple 复用
        const gz = payload.ganzhi || {};
        // 修真：HTTP 端点不提供 shichen[]/weather/wisdom/chong_zhi/sha/pengzu/shensha/deities/huanghei/jieqi_info/holiday 等私域字段。
        // public/simple 版本需要这些 → 标记需要补全，execFile bridge 补齐缺失字段以保证推送全量。
        const needsBridge = !payload.shichen || !payload.weather || !payload.wisdom;
        if (needsBridge) {
          // execFile 兜底取 bridge 全文，与 HTTP 端点字段合并（HTTP 优先）
          const raw = runPython(BRIDGE, targetDate ? { DAILY_PUSH_OVERRIDE_DATE: targetDate } : {});
          const lines = raw.split('\n').filter(Boolean);
          try {
            const bridgeData = JSON.parse(lines[lines.length - 1]);
            return {
              ...bridgeData,
              gz: {
                ...bridgeData.gz,
                ...gz,
              },
              yi_ji: bridgeData.yi_ji || { yi: payload.yi || [], ji: payload.ji || [] },
            };
          } catch (e) {
            console.error(`[daily_push] HTTP+bridge 合并失败，纯 HTTP 回填字段：${e.message}`);
          }
        }
        return {
          ...payload,
          gz: {
            year_gz: gz.year_gz, year_gan: gz.year_gan, year_zhi: gz.year_zhi, year_nayin: gz.year_nayin,
            month_gz: gz.month_gz, month_gan: gz.month_gan, month_zhi: gz.month_zhi,
            day_gz: gz.day_gz, day_gan: gz.day_gan, day_zhi: gz.day_zhi, day_nayin: gz.day_nayin,
          },
          yi_ji: payload.yi_ji || { yi: payload.yi || [], ji: payload.ji || [] },
        };
      }
      console.error(`[daily_push] HTTP 端点返回 ok=false：${JSON.stringify(payload).slice(0, 200)}`);
      // fall through to execFile
    } catch (e) {
      console.error(`[daily_push] HTTP 模式失败，回退 execFile：${e.message}`);
      // fall through to execFile
    }
  }
  const raw = runPython(BRIDGE, targetDate ? { DAILY_PUSH_OVERRIDE_DATE: targetDate } : {});
  // 取最后一个 JSON 行（兼容 python 侧误打印其他内容）
  const lines = raw.split('\n').filter(Boolean);
  const jsonLine = lines[lines.length - 1];
  try {
    return JSON.parse(jsonLine);
  } catch (e) {
    console.error(`[daily_push] 桥接层 JSON 解析失败: ${e.message}`);
    process.exit(1);
  }
}

/** 完整版：直接复用 daily-recommendation.py 的原文（含化解全文+拼音注解）
 * 修真补丁（2026-08-17）：--tomorrow 时透传 DAILY_PUSH_OVERRIDE_DATE，修复 full 版日期不随 --tomorrow 的问题 */
function buildFull(isTomorrow) {
  const targetDate = getTargetDate(isTomorrow);
  return runPython(FULL_SCRIPT, targetDate ? { DAILY_PUSH_OVERRIDE_DATE: targetDate } : undefined);
}

/** 修行建议（与 daily-recommendation.py 保持一致，拼音注解完整保留） */
const KOUJUE_TIPS = [
  '今日宜诵「净心神咒(zhòu)」三遍：太上台星，应变无停。驱邪缚魅(mèi)，保命护身。',
  '今日宜诵「心经」一遍：色不异空，空不异色。色即是空，空即是色。',
  '今日宜诵「清净经」：大道无形，生育天地；大道无名，长养万物。',
  '今日宜静坐冥想15分钟，观呼吸，放杂念，养心神。',
  '今日宜诵读《论语》一章，温故知新，涵养正气。',
  '今日宜散步30分钟，观花看树，让眼睛离开屏幕休息。',
  '今日宜写三行感恩日记，记下今天值得感谢的人和事。',
  '今日宜整理一件拖延的旧事，清掉一个心结。',
  '今日宜给一位久未联系的朋友发条问候，暖人即暖己。',
  '今日宜睡前放下手机，读10页书，再安稳入睡。',
];

/** MB-M1 E5 落款唯一（早/暮/简三版同一落款，禁止重复 slogan） */
const SIGN_OFF = `—— 🪷 易道智鉴 · 节气养生 ——
⚠️ 本内容仅命局趋势参考，重大决策由本人自行负责；医疗、投资、法律问题请咨询专业人士。`;

/** MB-M1 E3 分数定调：<60「守」/60-80「稳进」/>80「进取」；E2：吉神数<凶神数压档 */
function toneOf(d) {
  const score = d.score || 0;
  let tone = score > 80 ? '进取' : score >= 60 ? '稳进' : '守';
  if ((d.js_count || 0) < (d.xs_count || 0) && tone !== '守') tone = '守';
  return tone;
}

/** MB-M1 E2 三级矛盾裁决：黄道黑道 > 建除十二神 > 古籍口诀 */
function verdictLine(d) {
  const hh = d.huanghei || '';
  const isHuang = hh.includes('黄道');
  const jcName = (((d.yi_ji || {}).jianchu || '').match(/^(.日)/) || [])[1] || '';
  const JC_LUCK = { 建: '吉', 除: '吉', 满: '吉', 平: '平', 定: '吉', 执: '吉', 破: '凶', 危: '凶', 成: '吉', 收: '吉', 开: '吉', 闭: '凶' };
  const jl = JC_LUCK[jcName.replace('日', '')] || '平';
  if (isHuang && jl === '凶') return `虽逢${jcName}（建除凶），总体从黄道之吉，可做但留余量`;
  if (!isHuang && jl === '吉') return `虽逢${jcName}（建除吉），总体从黑道，宜守不宜攻`;
  if (isHuang && jl === '吉') return `黄道${jcName}同参为吉，可放手推进`;
  if (!isHuang && jl === '凶') return `黑道${jcName}同参为凶，今日以守为主`;
  return isHuang ? `黄道日，${jcName}平稳，日常事务皆宜` : `黑道日，${jcName}平平，宜处理日常事务`;
}

/** MB-M1 时辰剧本：起手（05-11)/开展（11-17)/收尾（17-23) 三段 */
function buildTimeScript(d, tone) {
  const jishi = d.jishi_plain || [];
  const yi0raw = ((d.yi_ji || {}).yi || '').split('、')[0] || '要事';
  // 动作白话化：破旧类宜事转「除旧布新」，避免「利破屋」这类生硬表述
  const yi0 = /破屋|坏垣|拆卸/.test(yi0raw) ? '除旧布新' : yi0raw;
  const SEGS = [
    ['🌅 起手', '05-11点', '卯辰巳'],
    ['☀️ 开展', '11-17点', '午未申'],
    ['🌙 收尾', '17-23点', '酉戌亥'],
  ];
  return SEGS.map(([name, span, zhis]) => {
    const hits = jishi.filter(s => zhis.includes(s[0]));
    if (!hits.length) return `${name}（${span}）：无吉时，收整复盘，不启新事`;
    const act = tone === '守' ? `${yi0}可小步试，不大动` : `利${yi0}`;
    return `${name}（${span}）：黄金段 ${hits.map(s => s.slice(2)).join('、')}｜${act}`;
  }).join('\n');
}

/** 公开版：MB-M1 v2 新结构（2026-09-26）
 *  早推七板块：今日三要→时辰剧本｜运势量化→命主联动｜速查→修身→落款（━━━SPLIT━━━ 三段）
 *  暮推五板块：明日三要→明日黄金窗口→今夜收整→修身一句→落款 */
function buildPublic(d, isTomorrow) {
  if (isTomorrow) return buildEvening(d);
  const gz = d.gz;
  const yiJi = d.yi_ji;
  const tone = toneOf(d);
  const koujue = d.koujue || KOUJUE_TIPS[d.day % KOUJUE_TIPS.length];
  const jianchu = (yiJi.jianchu || '').replace(/^(.日)\(\1/, '$1（').replace(')', '）');
  const chongPlain = `属${d.chong_shengxiao}的朋友今日大事缓一缓；煞在${d.sha}方，${d.sha}方不宜动土修造`;
  const jishiList = d.jishi_plain || [];
  const dayJishi = jishiList.filter(s => /辰|巳|午|未|申|酉|戌/.test(s[0]));
  const nightJishi = jishiList.filter(s => !/辰|巳|午|未|申|酉|戌/.test(s[0]));
  const jishiLine = [...dayJishi, ...nightJishi].join('、');
  const yiTop = (yiJi.yi_plain || yiJi.yi).split('、').slice(0, 3).join('、');
  const jiTop = (yiJi.ji_plain || yiJi.ji).split('、').slice(0, 2).join('、');
  const gold = dayJishi[0] || jishiList[0] || '全天平和';
  const TONE_LINE = { 守: '今日主守：稳住基本盘，不开新局', 稳进: '今日稳进：按节奏推进，不冒进', 进取: '今日进取：窗口难得，主动出击' }[tone];

  let msg = `📅 易道智鉴 · 晨推 ${d.year}年${d.month}月${d.day}日 ${d.weekday}
🌙 ${d.lunar}｜${gz.year}年（${gz.year_shengxiao}年）·${gz.month}月·${gz.day}日

━━━ ① 今日三要 ━━━
✅ 宜：${yiTop}
🚫 忌：${jiTop}
⏰ 黄金窗口：${gold}（${tone === '守' ? '做熟不做生' : '要事排这里'}）

━━━ ② 时辰剧本 ━━━
${buildTimeScript(d, tone)}
━━━SPLIT━━━
━━━ ③ 运势量化 ━━━
📊 ${d.score}分 ${d.score_stars}（${d.score_desc}）｜基调「${tone}」：${TONE_LINE}

━━━ ④ 命主联动 ━━━
👤 今日${gz.day}日：日干${gz.day_gan}对缘主癸水为${d.day_gan_ss.ss}（${d.day_gan_ss.plain}），日支${gz.day_zhi}本气为${d.day_zhi_ss.ss}（${d.day_zhi_ss.plain}）。
📈 流年丙午（正财透干·火为你的喜用，求财窗口）｜流月${gz.month}同参。
🌀 大运乙丑（乙木食神高透，才华变现正当时）——${d.day_gan_ss.xi_ji === '喜' ? '今日天干助喜，该出手就出手' : d.day_gan_ss.xi_ji === '忌' ? '今日天干为忌，守成为上、少做大决定' : '今日天干中平，照计划推进即可'}。
━━━SPLIT━━━
━━━ ⑤ 速查区 ━━━
📌 ${jianchu}｜⭐ ${yiJi.xingxiu}｜☀️ ${d.huanghei}
⚖️ 裁决：${verdictLine(d)}
⚔️ 冲${d.chong_zhi}（${d.chong_shengxiao}）·煞${d.sha}：${chongPlain}
✨ ${d.shensha_plain || d.shensha}
🧭 喜神${d.xishen}·财神${d.caishen}·福神${d.fushen}｜🌤️ ${d.weather.condition} ${d.weather.temp}°C（${d.weather.city || '本地'}）
⏰ 吉时：${jishiLine}
`;

  if (d.jieqi_info) msg += `\n🌿 ${d.jieqi}｜${d.jieqi_info}\n`;
  if (d.holiday) msg += `\n🎉 ${d.holiday}${d.festival_lore ? '\n📜 ' + d.festival_lore : ''}${d.festival_guide ? '\n🎯 ' + d.festival_guide : ''}\n`;
  if (d.deities && d.deities.length) {
    msg += `\n🙏 ${d.deities.map(de => de.name + '诞辰').join('·')}\n`;
    (d.deity_guides || []).forEach(g => { msg += `   ${g}\n`; });
  }
  if (d.daily_knowledge) msg += `\n📚 ${d.daily_knowledge.title}\n${d.daily_knowledge.summary}\n`;

  msg += `
━━━ ⑥ 修身一句 ━━━
🧘 ${koujue}

${SIGN_OFF}`;
  return msg;
}

/** MB-M1 暮推（--tomorrow）：明日预告 + 今夜收整，五板块 */
function buildEvening(d) {
  const gz = d.gz;
  const yiJi = d.yi_ji;
  const tone = toneOf(d);
  const jianchu = (yiJi.jianchu || '').replace(/^(.日)\(\1/, '$1（').replace(')', '）');
  const jishiList = d.jishi_plain || [];
  const dayJishi = jishiList.filter(s => /辰|巳|午|未|申|酉|戌/.test(s[0]));
  const yiTop = (yiJi.yi_plain || yiJi.yi).split('、').slice(0, 3).join('、');
  const jiTop = (yiJi.ji_plain || yiJi.ji).split('、').slice(0, 2).join('、');

  let msg = `🌙 易道智鉴 · 暮推（明日预告）
📅 ${d.year}年${d.month}月${d.day}日 ${d.weekday}｜${d.lunar}
🏮 ${gz.year}年（${gz.year_shengxiao}年）·${gz.month}月·${gz.day}日

━━━ ① 明日三要 ━━━
✅ 宜：${yiTop}
🚫 忌：${jiTop}
📌 ${jianchu}｜☀️ ${d.huanghei}｜基调「${tone}」（${d.score}分 ${d.score_stars}）
⚖️ 裁决：${verdictLine(d)}

━━━ ② 明日黄金窗口 ━━━
⏰ ${dayJishi.length ? dayJishi.join('、') : (jishiList.join('、') || '全天平和，按节奏即可')}
⚔️ 冲${d.chong_zhi}（${d.chong_shengxiao}）·煞${d.sha}｜✨ ${d.shensha_plain || d.shensha}

━━━ ③ 今夜收整三件事 ━━━
1️⃣ 复盘今日一件做成的事，给自己记一功
2️⃣ 列好明日三件要事，对齐上面的宜忌与黄金窗口
3️⃣ 23点前放下手机，安稳入睡养气

━━━ ④ 修身一句 ━━━
📖 「${d.wisdom.text}」—— ${d.wisdom.source}
${d.wisdom.meaning ? '💡 ' + d.wisdom.meaning : ''}

${SIGN_OFF}`;
  return msg;
}

/** 极简版：一句话速览（R125：砍一签长文，纯核心） */
function buildSimple(d) {
  const gz = d.gz;
  const yiJi = d.yi_ji;
  const chong = `冲${d.chong_zhi}（${d.chong_shengxiao}）·煞${d.sha}`;
  const koujue = d.koujue || KOUJUE_TIPS[d.day % KOUJUE_TIPS.length];
  // 吉时提取（白天 7-19 点实用时段，带钟点）
  let jishi = '';
  try {
    const gt = (d.jishi_plain || []).filter(s => /^[辰巳午未申酉]/.test(s));
    if (gt.length) jishi = '⏰ 吉时 ' + gt.map(s => s.replace(/(\d{2}:\d{2})-(\d{2}:\d{2})/, '$1-$2')).join('/');
  } catch (e) { /* ignore */ }

  return `📅 ${d.year}年${d.month}月${d.day}日 ${d.weekday}｜${d.lunar}
🏮 ${gz.year}（${gz.year_shengxiao}）·${gz.month}·${gz.day}

✅ 宜 ${yiJi.yi.slice(0, 30)}${yiJi.yi.length > 30 ? '…' : ''}
🚫 忌 ${yiJi.ji.slice(0, 20)}${yiJi.ji.length > 20 ? '…' : ''}
⚔️ ${chong}｜☀️ ${d.huanghei}${jishi ? '｜' + jishi : ''}
💰 财${d.caishen}·喜${d.xishen}

📖 「${d.wisdom.text}」——${d.wisdom.source}

${koujue}

${SIGN_OFF}`;
}

// === 入口 ===
const args = process.argv.slice(2).map(a => a.toLowerCase());
const mode = args[0] || '';
const isTomorrow = args.includes('--tomorrow');
const isVerify = args.includes('--verify');
let output;
try {
  if (mode === 'verify' || isVerify) {
    // R119：全量校验模式（三模式 + 数据一致性）
    const targetDate = getTargetDate(isTomorrow);
    const full = buildFull(isTomorrow);
    const pub = buildPublic(getBridgeData(isTomorrow), isTomorrow);
    const sim = buildSimple(getBridgeData(isTomorrow));
    // 修真补丁（2026-08-17）：--tomorrow 时三版必须含目标日期（防止 full 版漏透传日期覆盖）
    let dateStr = '';
    if (targetDate) {
      const m = targetDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (m) dateStr = `${m[1]}年${parseInt(m[2], 10)}月${parseInt(m[3], 10)}日`;
    }
    const checks = [
      ['full 非空', !!(full && full.trim())],
      ['public 非空', !!(pub && pub.trim())],
      ['simple 非空', !!(sim && sim.trim())],
      ['full 日期=目标日', !targetDate || full.includes(dateStr)],
      ['public 日期=目标日', !targetDate || pub.includes(dateStr)],
      ['simple 日期=目标日', !targetDate || sim.includes(dateStr)],
      // 修真补丁（2026-08-21）：旧白名单正则（忌[：无嫁娶入宅开市交易斋醮作灶开仓]）覆盖不全
      // lunar_python 忌字全集，导致「忌：掘井、理发…」这类真实黄历被误判为校验失败。
      // 新逻辑：锚定 buildFull 的黄历结论行模板「📌 宜X（…）；忌Y…」（daily-recommendation.py
      // L1507），宜侧匹配五类归目/「无特别适宜」，忌侧仅要求非空词（开放字符集，
      // 兼容 lunar_python getDayJi() 全部词条，不再枚举白名单）。
      ['full 含宜忌', /📌 宜(白事|基建|婚嫁|日常|财事)（[^）]+）(，兼宜[^；]*)?；忌(无|[^\s；]{1,12})|📌 无特别适宜事项[，,]宜[^；]{0,20}；忌[^\s；]{1,12}/.test(full)],
      ['public 含干支', /丙午|乙巳|甲辰|癸卯|壬寅|辛丑|庚子|己亥|戊戌|丁酉|丙申|乙未|甲午|癸巳|壬辰|辛卯|庚寅|己丑|戊子|丁亥|丙戌|乙酉|甲申|癸未|壬午|辛巳|庚辰|己卯|戊寅|丁丑|丙子|乙亥|甲戌|癸酉|壬申|辛未|庚午|己巳|戊辰|丁卯|丙寅|乙丑|甲子/.test(pub)],
      ['public 含黄历', /宜：/.test(pub) && /忌：/.test(pub)],
      ['含建除/神煞', /定日|满日|司命|冲戊|冲己|冲庚|冲辛|冲壬|冲癸|冲甲|冲乙|冲丙|冲丁|冲.{1,2}（|吉神|凶煞/.test(pub)],
      ['含免责', /仅供.*参考|不构成.*依据|趋势参考.*自行负责/.test(pub)],
    ];
    const fails = checks.filter(c => !c[1]);
    console.log('═══ daily_push --verify ═══');
    checks.forEach(c => console.log((c[1] ? '✅' : '❌') + ' ' + c[0]));
    console.log('校验结果: ' + (checks.length - fails.length) + ' 通过 / ' + fails.length + ' 失败');
    process.exit(fails.length ? 1 : 0);
  } else if (mode === 'full') {
    output = buildFull(isTomorrow);
  } else if (mode === 'public') {
    output = buildPublic(getBridgeData(isTomorrow), isTomorrow);
  } else if (mode === 'simple') {
    output = buildSimple(getBridgeData(isTomorrow));
  } else if (mode === 'monthly') {
    // R808 月度指导（真实月干支+节气+命盘推演）
    output = require('child_process').execSync(
      'python3 -c "import importlib.util; spec=importlib.util.spec_from_file_location(\'dr\', \'server/daily-recommendation.py\'); m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m); print(m.build_monthly_guide())"',
      { encoding: 'utf8', timeout: 30000, cwd: ROOT });
  } else if (mode === 'yearly') {
    // R808 年度指导（流年+大运+命局三层推演）
    output = require('child_process').execSync(
      'python3 -c "import importlib.util; spec=importlib.util.spec_from_file_location(\'dr\', \'server/daily-recommendation.py\'); m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m); print(m.build_yearly_guide())"',
      { encoding: 'utf8', timeout: 30000, cwd: ROOT });
  } else {
    console.error('用法: node daily_push.js <full|public|simple|verify|monthly|yearly> [--tomorrow]');
    process.exit(1);
  }
} catch (e) {
  console.error(`[daily_push] 生成失败: ${e.message}`);
  process.exit(1);
}

if (!output || !output.trim()) {
  console.error('[daily_push] 输出为空，终止');
  process.exit(1);
}
console.log(output);
