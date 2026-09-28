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

// R-YQ-PUSH（2026-09-27）：五运六气段接入推送渲染层（暮推主挂载，晨推一行点缀）
// 引擎 server/yunqi-engine.js 已挂报告侧（norm-report-engine），推送侧同源复用。
// 缘主年柱己未=1979（server/daily-recommendation.py YONGHU.bazhi_year，与推送命盘同源）。
const YQ_ENGINE = require('./server/yunqi-engine.js');
const YUAN_BIRTH_YEAR = 1979; // 缺省回退（信众画像缺 birth 时用）

/** 暮推运气段（三行：出生年禀赋 / 流年互动 / 边界说明）；birthYear 缺省回退缘主 */
function buildYunqiBlock(targetYear, birthYear) {
  try {
    const lines = YQ_ENGINE.buildSection({ year: birthYear || YUAN_BIRTH_YEAR, targetYear });
    if (!lines.length) return '';
    const birth = lines[0].replace(/^【出生年运气】/, '');
    const base = (lines[1] || '').replace(/^先天底色：/, '');
    const flow = (lines[2] || '').replace(/^【\d+ 流年运气】/, '');
    const interact = (lines[3] || '').replace(/^今年与您：/, '');
    let s = `🌱 先天 ${birth}\n    ${base}\n`;
    if (flow && interact) s += `🔄 流年 ${flow}\n    ${interact}\n`;
    s += `ℹ️ 五运六气是天时五行背景，以上为体质倾向参考、非医学诊断；调养请咨询医师。`;
    return s;
  } catch (e) {
    console.error(`[daily_push] 五运六气段生成失败（降级跳过）: ${e.message}`);
    return '';
  }
}

/** 晨推运气一行（挂 ② 跟您有关）；birthYear 缺省回退缘主 */
function buildYunqiLine(targetYear, birthYear) {
  try {
    const b = YQ_ENGINE.yunqiOfYear(birthYear || YUAN_BIRTH_YEAR);
    const f = YQ_ENGINE.yunqiOfYear(targetYear);
    return `☸ 运气底色：先天${b.yun}运${b.guo} × ${targetYear}流年${f.yun}运${f.guo}——${YQ_ENGINE.interact(b.yun, f.yun)}`;
  } catch (e) {
    return '';
  }
}

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

// R-SLIM（2026-09-27）：推送精简改版——轻重缓急排序、只留缘主/信众相关内容、
// 分析判断全白话。砍掉：时辰剧本三行（折进黄金窗口）、运势量化独立板块（并入定调）、
// 速查区（星宿/方位/天气与命理决策无关）、神煞长串（只留 2 吉 2 凶带注解）。
const YUAN_ZODIAC = '羊'; // 缘主 1979 己未

/** 凶煞白话注解（常见煞的通俗影响，推送只用一档提醒） */
const XIONGSHA_GLOSS = {
  朱雀: '慎言语，防口舌争执', 重日: '事易反复，重要决定缓一天', 白虎: '防磕碰外伤，出行当心',
  天牢: '易生纠葛，签约谨慎', 玄武: '防失窃破财，看管财物', 勾陈: '事多拖延，预留余量',
  天刑: '慎防官非纠纷', 五虚: '忌开仓出货', 九空: '求财不宜', 大耗: '防大笔破财',
  劫煞: '防意外损失', 灾煞: '防灾祸，平安为上', 月煞: '小事不顺，心态放平',
  河魁: '防口舌', 死神: '宜静不宜动', 月刑: '防小人是非', 小耗: '小额破费，无伤大雅',
  天罡: '忌词讼争执', 大时: '大事缓行，宜守常', 五离: '忌签约结盟', 八风: '防财物散失',
  九坎: '求财谨慎', 九焦: '防焦灼误事', 复日: '事易重来，一次做对', 招摇: '防口舌招摇',
  厌对: '忌嫁娶争辩', 血忌: '防见血，远离利器', 天吏: '忌与官方争执', 致死: '宜静养忌冒险',
};

/** 神煞精选：吉神取前 2（沿用 bridge 自带注解），凶煞取前 2 配白话 */function plainShensha(d) {
  const raw = d.shensha_plain || d.shensha || '';
  const m = raw.match(/吉神[:：]([^;；]+)[;；]\s*凶煞[:：](.+)/);
  if (!m) return raw ? `✨ ${raw.slice(0, 60)}` : '';
  const js = m[1].split('、').map(s => s.trim()).filter(Boolean).slice(0, 2).join('、');
  const xs = m[2].split('、').map(s => s.trim()).filter(Boolean).slice(0, 2)
    .map(x => XIONGSHA_GLOSS[x] ? `${x}（${XIONGSHA_GLOSS[x]}）` : x).join('、');
  return `✨ 吉神眷顾：${js}\n⚠️ 凶煞提醒：${xs}`;
}

/** 冲煞分级提醒：正冲受众生肖→重提醒；否则一句带过 */
function chongLine(d) {
  const zodiac = (ACTIVE_PROFILE && ACTIVE_PROFILE.zodiac) || YUAN_ZODIAC;
  if (d.chong_shengxiao === zodiac) {
    return `🔔 冲${d.chong_zhi}（${d.chong_shengxiao}）——正冲您的生肖：大事缓办、重要决定改期，平安即是赢`;
  }
  return `⚔️ 冲${d.chong_zhi}（属${d.chong_shengxiao}的亲友大事缓一缓）；煞${d.sha}方不宜动土`;
}

// ─── R-PUSH-PLUS（2026-09-28）：调性红线 + 化解行动 ───
/** 修身一句调性红线：恐吓/低俗/丧气词一律不入推送，命中即换后备口诀 */
const KOUJUE_BLACKLIST = ['淫欲', '八专', '桃花劫', '孤鸾', '克夫', '克妻', '夭亡', '绝命', '横死', '短寿', '守寡', '鳏居'];
function safeKoujue(d) {
  const k = d.koujue || '';
  if (k && !KOUJUE_BLACKLIST.some(w => k.includes(w))) return k;
  return KOUJUE_TIPS[d.day % KOUJUE_TIPS.length];
}

/** 五行→穿衣色（民俗五行配色，通俗易懂） */
const WUXING_COLOR = { 木: '青、绿色系', 火: '红、紫色系', 土: '黄、咖色系', 金: '白、金色系', 水: '黑、蓝色系' };

/** 今日一招：幸运色 + 吉方位 + 黑道化解（只给跟缘主有关、可执行的建议） */
function buildActionLine(d, label) {
  const dayWord = label || '今日';
  const ele = d.day_gan_ele;
  const color = WUXING_COLOR[ele];
  const lines = [];
  if (color) {
    const lucky = d.day_gan_ss && d.day_gan_ss.xi_ji === '喜';
    lines.push(`🎨 ${dayWord}${ele}气当令${lucky ? '，正是您的幸运色' : ''}：穿衣搭配选${color}，应景助运`);
  }
  if (d.xishen || d.caishen) {
    const dirs = [d.xishen && `喜神${d.xishen}`, d.caishen && `财神${d.caishen}`].filter(Boolean).join('·');
    lines.push(`🧭 ${dirs}（洽谈办事面向此方更顺）；${d.sha}方为煞位，少去少动`);
  }
  if ((d.huanghei || '').includes('黑道')) {
    lines.push(`🍵 黑道日化解：要事不取消，挪进黄金窗口里办；说话留三分，合同多看一遍`);
  }
  return lines.join('\n');
}

/** 定调收口语：与裁决结论同向，杜绝「可放手推进+稳住不开新局」式打架 */
function toneLineFrom(verdict, tone) {
  const positive = verdict.includes('为吉') || verdict.includes('皆宜');
  if (tone === '进取') return '窗口难得，主动出击';
  if (tone === '稳进') return '按节奏推进，不冒进';
  return positive ? '吉日可成小事，大局面不铺开' : '稳住基本盘，不开新局';
}

// ═══ R-PUSH-P2（2026-09-28）信众个性化：画像 / 十神 / 三件事·短板·化解 ═══
const SUBS_PATH = path.join(ROOT, 'data', 'subscribers.json');
const LIFESTAGE_PATH = path.join(ROOT, 'data', 'lifestage-model.json');
const DEFAULT_PROFILE = { chatid: 'LiuTao', name: '缘主', birth: '1979-08-16', day_gan: '癸', zodiac: '羊', stage: '守成期', themes: ['健康', '财富', '家庭'] };
// 当前受众画像（入口按 --profile 赋值，缺省缘主向后兼容）
let ACTIVE_PROFILE = DEFAULT_PROFILE;

function loadProfile(chatid) {
  try {
    const subs = JSON.parse(require('fs').readFileSync(SUBS_PATH, 'utf8')).subscribers || [];
    return subs.find(s => s.chatid === chatid) || DEFAULT_PROFILE;
  } catch (e) { return DEFAULT_PROFILE; }
}
function loadLifestage() {
  try { return JSON.parse(require('fs').readFileSync(LIFESTAGE_PATH, 'utf8')); }
  catch (e) { return { stages: [], theme_meta: {} }; }
}
function stageOf(profile) {
  const m = loadLifestage();
  if (profile.stage) {
    const hit = m.stages.find(s => s.id === profile.stage);
    if (hit) return hit;
  }
  const age = new Date().getFullYear() - parseInt((profile.birth || '1979').slice(0, 4), 10);
  return m.stages.find(s => {
    const [lo, hi] = s.age.replace('+', '-99').split('-').map(x => parseInt(x, 10));
    return age >= lo && age <= (isNaN(hi) ? 200 : hi);
  }) || m.stages[3] || { id: '守成期', themes: ['健康', '财富', '家庭'], tone: '', focus: '' };
}

// 十神本地推算（非缘主信众无服务端喜忌，用本地十神+白话，喜忌缺省不判）
const GAN_WX = { 甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水' };
const GAN_YANG = '甲丙戊庚壬';
const WX_SHENG = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
const WX_KE = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };
function shishenOf(me, other) {
  const a = GAN_WX[me], b = GAN_WX[other];
  if (!a || !b) return null;
  const same = GAN_YANG.includes(me) === GAN_YANG.includes(other);
  if (a === b) return same ? ['比肩', '平辈助力，利合作共事'] : ['劫财', '有竞争分财之象，守财为上'];
  if (WX_SHENG[a] === b) return same ? ['食神', '温和泄秀，利作品产出'] : ['伤官', '才华外露，慎言防口舌'];
  if (WX_KE[a] === b) return same ? ['偏财', '偏财机缘，利意外进账'] : ['正财', '我克为财，利求财谈价'];
  if (WX_KE[b] === a) return same ? ['七杀', '压力挑战，宜稳不宜冲'] : ['正官', '规则护身，利按部就班'];
  return same ? ['偏印', '灵感独辟，利研究学习'] : ['正印', '贵人滋养，利学习充电'];
}
// 十神 → 主题（用于三件事排序）
const SS_THEME = { 正财: '财富', 偏财: '财富', 正官: '事业', 七杀: '事业', 正印: '学业', 偏印: '学业', 食神: '事业', 伤官: '人际', 比肩: '人际', 劫财: '财富' };

/** 三件事/短板共用的主题工具 */
function themeMeta() { return loadLifestage().theme_meta || {}; }
function themeEmoji(t) { return ((themeMeta()[t] || {}).emoji) || '•'; }
/** 宜事词条 → 主题（命中 lifestage 模型的 yi_keys 前缀） */
function themeOfYi(yiWord) {
  const meta = themeMeta();
  for (const [theme, cfg] of Object.entries(meta)) {
    if ((cfg.yi_keys || []).some(k => yiWord.startsWith(k))) return theme;
  }
  return null;
}
function themeOfSha(shaName) {
  const meta = themeMeta();
  for (const [theme, cfg] of Object.entries(meta)) {
    if ((cfg.sha_themes || []).includes(shaName)) return theme;
  }
  return '心境';
}

/** ③ 今日最有利三件事：十神联动 + 宜事（按人生阶段主题优先）+ 黄金窗口 */
function buildThreeWins(d, prof, label) {
  const dayWord = label || '今日';
  const stage = stageOf(prof);
  const stageThemes = stage.themes || [];
  const out = [];
  // 1. 十神联动（缘主用服务端喜忌，其他信众本地十神白话）
  const gz = d.gz;
  let ssLine = '';
  if (prof.chatid === 'LiuTao' && d.day_gan_ss) {
    const ss = d.day_gan_ss;
    ssLine = `${themeEmoji(SS_THEME[ss.ss])} ${ss.ss}日：${ss.plain}——${ss.xi_ji === '喜' ? `这类事${dayWord}放心做` : ss.xi_ji === '忌' ? `这类事${dayWord}缓一缓` : '正常推进即可'}`;
  } else {
    const r = shishenOf(prof.day_gan, gz.day_gan);
    if (r) ssLine = `${themeEmoji(SS_THEME[r[0]])} ${r[0]}日：${r[1]}`;
  }
  if (ssLine) out.push(ssLine);
  // 2. 宜事按阶段主题优先挑 2 条
  const yiList = (d.yi_ji.yi_plain || d.yi_ji.yi || '').split('、').map(s => s.trim()).filter(Boolean);
  const scored = yiList.map(w => {
    const t = themeOfYi(w.replace(/（.*$/, ''));
    return { w, t, rank: t ? (stageThemes.indexOf(t) === -1 ? 9 : stageThemes.indexOf(t)) : 9 };
  }).filter(x => x.t).sort((a, b) => a.rank - b.rank);
  scored.slice(0, 2).forEach(x => out.push(`${themeEmoji(x.t)} 宜${x.w}——正合您${stage.id}「${x.t}」头等大事`));
  // 3. 黄金窗口
  const jishiList = d.jishi_plain || [];
  const dayJishi = jishiList.filter(s => /辰|巳|午|未|申|酉|戌/.test(s[0]));
  const gold = dayJishi.slice(0, 2).join('、');
  if (gold) out.push(`⏰ 把最重要的一件事排进 ${gold}，借吉时成事`);
  return out.slice(0, 3).map((l, i) => `${['1️⃣', '2️⃣', '3️⃣'][i]} ${l}`).join('\n');
}

/** ④ 三个短板提醒：凶煞×2（挂主题）+ 忌事/冲煞 */
function buildThreeRisks(d, prof, label) {
  const dayWord = label || '今日';
  const out = [];
  const raw = d.shensha_plain || d.shensha || '';
  const m = raw.match(/凶煞[:：](.+)/);
  const xsList = m ? m[1].split('、').map(s => s.trim()).filter(Boolean) : [];
  xsList.slice(0, 2).forEach(x => {
    const gloss = XIONGSHA_GLOSS[x] || '多加留心';
    out.push(`${themeEmoji(themeOfSha(x))} ${x}（${gloss}）——${themeOfSha(x)}上别硬扛`);
  });
  const jiTop = (d.yi_ji.ji_plain || d.yi_ji.ji || '').split('、')[0];
  if (jiTop) out.push(`🚫 忌${jiTop}——逆黄历行事，事倍功半`);
  if (d.chong_shengxiao === prof.zodiac) out.push(`🔔 正冲您的生肖（${prof.zodiac}）：${dayWord}低调是最大的化解`);
  return out.slice(0, 3).map((l, i) => `${['⚠️', '⚠️', '⚠️'][i]} ${l}`).join('\n');
}

/** ⑤ 化解三招：穿衣色 + 方位 + 时辰行为（全部白话可执行） */
function buildRemedies(d, prof, label) {
  const dayWord = label || '今日';
  const out = [];
  const color = WUXING_COLOR[d.day_gan_ele];
  if (color) out.push(`穿衣选${color}（${dayWord}${d.day_gan_ele}气当令，顺气则顺事）`);
  if (d.xishen || d.caishen) {
    const dirs = [d.xishen && `喜神${d.xishen}`, d.caishen && `财神${d.caishen}`].filter(Boolean).join('、');
    out.push(`办事洽谈面向 ${dirs} 方；${d.sha}方煞位少去少动`);
  }
  if (d.chong_shengxiao === prof.zodiac) {
    out.push(`正冲日大事改期到后天，非改不可就排在黄金窗口内办`);
  } else if ((d.huanghei || '').includes('黑道')) {
    out.push(`黑道日要事挪进黄金窗口办，说话留三分、合同多看一遍`);
  } else {
    out.push(`黄道吉日无需避讳，放手但要稳——成事后记得复盘记一功`);
  }
  return out.map((l, i) => `${['🌿', '🧭', '⏳'][i]} ${l}`).join('\n');
}

/** 生僻字注音（硬性规范：推送里出现的生僻字必须带拼音） */
const PINYIN_MAP = { 罥: 'juàn', 薏: 'yì', 苡: 'yǐ', 莼: 'chún', 鲈: 'lú', 裀: 'yīn', 彀: 'gòu', 蓍: 'shī', 筮: 'shì', 爻: 'yáo', 禳: 'ráng', 醮: 'jiào', 偈: 'jì', 诃: 'hē', 敕: 'chì', 罡: 'gāng', 鸾: 'luán', 蛰: 'zhé', 刍: 'chú', 飧: 'sūn' };
function annotatePinyin(text) {
  if (!text) return text;
  let out = text;
  for (const [c, p] of Object.entries(PINYIN_MAP)) {
    if (out.includes(c) && !out.includes(`${c}(${p})`)) out = out.replace(c, `${c}(${p})`);
  }
  return out;
}

/** 公开版：R-SLIM 精简结构（2026-09-27）
 *  晨推五板块：今日定调→跟您有关｜宜忌速办→节气节日（有则出）→修身一句→落款（━━━SPLIT━━━ 两段）
 *  暮推五板块：明日定调（含宜忌窗口）→跟您有关→五运六气→今夜收整→修身一句→落款 */
/** 日主联动行：缘主用服务端喜忌精算；其他信众本地十神白话（喜忌缺省不判） */
function dayGanLine(d, prof, label) {
  const dayWord = label || '今日';
  const gz = d.gz;
  if (prof.chatid === 'LiuTao' && d.day_gan_ss) {
    const ss = d.day_gan_ss;
    const act = ss.xi_ji === '喜' ? `${dayWord}天干助喜，该出手就出手` : ss.xi_ji === '忌' ? `${dayWord}天干为忌，守成为上、少做大决定` : `${dayWord}天干中平，照计划推进即可`;
    return `👤 ${dayWord}${gz.day}日：日干${gz.day_gan}对您的${prof.day_gan}水为${ss.ss}（${ss.plain}）——${act}。`;
  }
  const r = shishenOf(prof.day_gan, gz.day_gan);
  if (!r) return '';
  return `👤 ${dayWord}${gz.day}日：日干${gz.day_gan}对您的${prof.day_gan}为${r[0]}（${r[1]}）。`;
}

function buildPublic(d, isTomorrow) {
  if (isTomorrow) return buildEvening(d);
  const prof = ACTIVE_PROFILE;
  const gz = d.gz;
  const yiJi = d.yi_ji;
  const tone = toneOf(d);
  const koujue = safeKoujue(d);
  const jianchu = (yiJi.jianchu || '').replace(/^(.日)\(\1/, '$1（').replace(')', '）');
  const jishiList = d.jishi_plain || [];
  const dayJishi = jishiList.filter(s => /辰|巳|午|未|申|酉|戌/.test(s[0]));
  const yiTop = (yiJi.yi_plain || yiJi.yi).split('、').slice(0, 3).join('、');
  const jiTop = (yiJi.ji_plain || yiJi.ji).split('、').slice(0, 2).join('、');
  const gold = dayJishi.slice(0, 3).join('、') || jishiList[0] || '全天平和';
  const verdict = verdictLine(d);
  const TONE_LINE = toneLineFrom(verdict, tone);

  let msg = `📅 易道智鉴 · 晨推 ${d.year}年${d.month}月${d.day}日 ${d.weekday}
🌙 ${d.lunar}｜${gz.year}年（${gz.year_shengxiao}年）·${gz.month}月·${gz.day}日

━━━ ① 今日定调 ━━━
🎯 ${tone}（${d.score}分 ${d.score_stars}）：${verdict}——${TONE_LINE}。
⏰ 黄金窗口：${gold}（要事排这里）

━━━ ② 跟您有关 ━━━
${dayGanLine(d, prof)}
${chongLine(d)}
${buildYunqiLine(d.year, parseInt((prof.birth || '').slice(0, 4), 10))}

━━━ ③ 今日最有利三件事 ━━━
${buildThreeWins(d, prof)}

━━━ ④ 三个短板提醒 ━━━
${buildThreeRisks(d, prof)}

━━━ ⑤ 化解三招 ━━━
${buildRemedies(d, prof)}
━━━SPLIT━━━
━━━ ⑥ 宜忌速办 ━━━
✅ 宜：${yiTop}
🚫 忌：${jiTop}
📌 ${jianchu}｜☀️ ${d.huanghei}
${plainShensha(d)}
`;

  if (d.jieqi_info) msg += `\n🌿 ${d.jieqi}｜${d.jieqi_info}\n`;
  if (d.holiday) msg += `\n🎉 ${d.holiday}${d.festival_lore ? '\n📜 ' + d.festival_lore : ''}${d.festival_guide ? '\n🎯 ' + d.festival_guide : ''}\n`;
  if (d.deities && d.deities.length) {
    msg += `\n🙏 ${d.deities.map(de => de.name + '诞辰').join('·')}\n`;
    (d.deity_guides || []).forEach(g => { msg += `   ${g}\n`; });
  }
  if (d.daily_knowledge) msg += `\n📚 ${d.daily_knowledge.title}\n${annotatePinyin(d.daily_knowledge.summary)}\n`;

  msg += `
━━━ ⑦ 修身一句 ━━━
🧘 ${annotatePinyin(koujue)}

${SIGN_OFF}`;
  return msg;
}

/** R-PUSH-P2 暮推（--tomorrow）：①明日定调 ②跟您有关 ③明日最有利三件事 ④短板 ⑤化解 ⑥五运六气 ⑦今夜收整 ⑧修身一句 */
function buildEvening(d) {
  const prof = ACTIVE_PROFILE;
  const gz = d.gz;
  const yiJi = d.yi_ji;
  const tone = toneOf(d);
  const jianchu = (yiJi.jianchu || '').replace(/^(.日)\(\1/, '$1（').replace(')', '）');
  const jishiList = d.jishi_plain || [];
  const dayJishi = jishiList.filter(s => /辰|巳|午|未|申|酉|戌/.test(s[0]));
  const yiTop = (yiJi.yi_plain || yiJi.yi).split('、').slice(0, 3).join('、');
  const jiTop = (yiJi.ji_plain || yiJi.ji).split('、').slice(0, 2).join('、');
  const verdict = verdictLine(d);
  const TONE_LINE = toneLineFrom(verdict, tone);
  const birthYear = parseInt((prof.birth || '').slice(0, 4), 10);

  const yunqiBlock = buildYunqiBlock(d.year, birthYear);

  let msg = `🌙 易道智鉴 · 暮推（明日预告）
📅 ${d.year}年${d.month}月${d.day}日 ${d.weekday}｜${d.lunar}
🏮 ${gz.year}年（${gz.year_shengxiao}年）·${gz.month}月·${gz.day}日

━━━ ① 明日定调 ━━━
🎯 ${tone}（${d.score}分 ${d.score_stars}）：${verdict}——${TONE_LINE}。
✅ 宜：${yiTop}
🚫 忌：${jiTop}
⏰ 黄金窗口：${dayJishi.slice(0, 3).join('、') || jishiList[0] || '全天平和，按节奏即可'}
📌 ${jianchu}｜☀️ ${d.huanghei}

━━━ ② 跟您有关 ━━━
${dayGanLine(d, prof, '明日')}
${chongLine(d)}
${plainShensha(d)}
━━━SPLIT━━━
━━━ ③ 明日最有利三件事 ━━━
${buildThreeWins(d, prof, '明日')}

━━━ ④ 三个短板提醒 ━━━
${buildThreeRisks(d, prof, '明日')}

━━━ ⑤ 化解三招 ━━━
${buildRemedies(d, prof, '明日')}
${yunqiBlock ? `
━━━ ⑥ 五运六气 · 天赋底色 ━━━
${yunqiBlock}
` : ''}
━━━ ${yunqiBlock ? '⑦' : '⑥'} 今夜收整三件事 ━━━
1️⃣ 复盘今日一件做成的事，给自己记一功
2️⃣ 列好明日三件要事，对齐上面的宜忌与黄金窗口
3️⃣ 23点前放下手机，安稳入睡养气

━━━ ${yunqiBlock ? '⑧' : '⑦'} 修身一句 ━━━
📖 「${annotatePinyin(d.wisdom.text)}」—— ${d.wisdom.source}
${d.wisdom.meaning ? '💡 ' + annotatePinyin(d.wisdom.meaning) : ''}

${SIGN_OFF}`;
  return msg;
}

/** 极简版：一句话速览（R125：砍一签长文，纯核心） */
function buildSimple(d) {
  const gz = d.gz;
  const yiJi = d.yi_ji;
  const chong = `冲${d.chong_zhi}（${d.chong_shengxiao}）·煞${d.sha}`;
  const koujue = safeKoujue(d);
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
const rawArgs = process.argv.slice(2);
// --profile <chatid>：按信众画像生成个性化推送（缺省缘主，向后兼容）
const pIdx = rawArgs.findIndex(a => a.toLowerCase() === '--profile');
if (pIdx !== -1 && rawArgs[pIdx + 1]) {
  ACTIVE_PROFILE = loadProfile(rawArgs[pIdx + 1]);
}
const args = rawArgs.map(a => a.toLowerCase());
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
