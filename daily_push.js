#!/usr/bin/env node
/**
 * 乾元命理宝鉴 · 每日晨间推送生成器 (2026-08-11 重建)
 *
 * 用法：node daily_push.js <full|public|simple>
 *   - full   ：完整版（数据源 server/daily-recommendation.py 原文，含化解咒语全文+拼音注解）
 *   - public ：公开版（数据源 server/daily-push-bridge.py JSON，精简得体，可公开转发）
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

/** 运行 python 脚本并取回 stdout（去尾部空白） */
function runPython(script, env) {
  try {
    return execFileSync('python3', [script], {
      encoding: 'utf8',
      timeout: 60000,
      maxBuffer: 10 * 1024 * 1024,
      env: env ? Object.assign({}, process.env, env) : undefined,
    }).trim();
  } catch (e) {
    const stderr = (e.stderr || '').toString().trim();
    console.error(`[daily_push] python3 ${script} 执行失败: ${stderr || e.message}`);
    process.exit(1);
  }
}

/** 获取桥接层 JSON 数据
 * 修真 P0-4（2026-08-15 R730）：可选 HTTP 模式
 *   - 修真 DAILY_PUSH_HTTP_BASE=http://127.0.0.1:8920 → 走 /api/daily-almanac 端点（推送+移动端+站内共用同源）
 *   - 不修真 → 兜底 execFile python3 BRIDGE（向后兼容，不影响 launchd 调用）
 */
function getBridgeData(isTomorrow) {
  const httpBase = process.env.DAILY_PUSH_HTTP_BASE;
  // R119：--tomorrow 目标日期计算
  let targetDate = null;
  if (isTomorrow) {
    const t = new Date();
    t.setDate(t.getDate() + 1);
    targetDate = t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0');
  }
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

/** 完整版：直接复用 daily-recommendation.py 的原文（含化解全文+拼音注解） */
function buildFull() {
  return runPython(FULL_SCRIPT);
}

/** 修行建议（与 daily-recommendation.py 保持一致，拼音注解完整保留） */
const KOUJUE_TIPS = [
  '今日宜诵「净心神咒(zhòu)」三遍：太上台星，应变无停。驱邪缚魅(mèi)，保命护身。',
  '今日宜诵「心经」一遍：色不异空，空不异色。色即是空，空即是色。',
  '今日宜诵「清净经」：大道无形，生育天地；大道无名，长养万物。',
  '今日宜静坐冥想15分钟，观呼吸，放杂念，养心神。',
  '今日宜诵读《论语》一章，温故知新，涵养正气。',
];

/** 公开版：完整但不含个性化提点，适合公开转发 */
function buildPublic(d) {
  const gz = d.gz;
  const yiJi = d.yi_ji;
  const shichenLine = d.shichen.map(([s, j]) => `${s}:${j}`).join('  ');
  const chong = `冲${d.chong_zhi}（${d.chong_shengxiao}）`;
  const sha = `煞${d.sha}`;
  const koujue = KOUJUE_TIPS[d.day % KOUJUE_TIPS.length];

  let msg = `📅 乾元命理宝鉴 · 每日推荐
${SEP}

⏰ ${d.year}年${d.month}月${d.day}日 ${d.weekday}
🌍 阳历：${d.year}年${d.month}月${d.day}日 | ${d.lunar}
🏮 ${gz.year}年（${gz.year_shengxiao}年）
🌙 ${gz.month}月 · ${gz.day}日

${LINE}

━━━ 📋 今日黄历 ━━━

✅ 宜：${yiJi.yi}
🚫 忌：${yiJi.ji}

📌 建除十二神：${yiJi.jianchu}
⭐ 值日星宿：${yiJi.xingxiu}宿
☀️ 黄道黑道：${d.huanghei}
⚔️ 冲煞：${chong} · ${sha}
📜 彭祖百忌：${d.pengzu}
✨ 今日神煞：${d.shensha}

🧭 喜神：${d.xishen}
💰 财神：${d.caishen}
🙏 福神：${d.fushen}

⏰ 时辰吉凶：
${shichenLine}
`;

  if (d.jieqi_info) {
    msg += `
━━━ 🌿 ${d.jieqi} ━━━
${d.jieqi_info}
`;
  }

  if (d.holiday) {
    msg += `
━━━ 🎉 今日节日：${d.holiday} ━━━
祝${d.holiday}快乐！
`;
  }

  if (d.deities && d.deities.length) {
    msg += `\n━━━ 🙏 今日神仙吉日 ━━━\n`;
    for (const de of d.deities) {
      msg += `\n✨ ${de.name}诞辰（${de.type}教）\n`;
      msg += `   ${de.intro}\n`;
      msg += `   🎁 供奉建议：香花灯水果\n`;
    }
  }

  msg += `
━━━ 🌤️ 天气与穿搭 ━━━

天气：${d.weather.condition} 气温：${d.weather.temp}° 湿度：${d.weather.humidity}% 风速：${d.weather.wind}（${d.weather.city || '本地'}）
${d.clothing_temp}

━━━ 📖 今日${d.wisdom.type}家智慧 ━━━

「${d.wisdom.text}」
—— ${d.wisdom.source}

💡 白话：${d.wisdom.meaning}

━━━ 🧘 今日修行建议 ━━━

${koujue}
`;

  if (d.daily_knowledge) {
    msg += `
━━━ 📖 今日命理知识 ━━━

🔖 分类：${d.daily_knowledge.tag}

${d.daily_knowledge.title}

${d.daily_knowledge.summary}
`;
  }

  msg += `
${LINE}

⚠️ 以上内容仅供文化交流与生活参考，不构成任何决策依据。

🙏 祝缘主今日吉祥如意，平安喜顺！`;

  return msg;
}

/** 极简版：一句话速览 */
function buildSimple(d) {
  const gz = d.gz;
  const yiJi = d.yi_ji;
  const chong = `冲${d.chong_zhi}（${d.chong_shengxiao}）· 煞${d.sha}`;
  const koujue = KOUJUE_TIPS[d.day % KOUJUE_TIPS.length];

  return `📅 乾元命理宝鉴 · ${d.year}年${d.month}月${d.day}日 ${d.weekday}
${SEP}

🏮 ${gz.year}年（${gz.year_shengxiao}年）· ${gz.month}月 · ${gz.day}日
📆 ${d.lunar}

✅ 宜：${yiJi.yi}
🚫 忌：${yiJi.ji}
⚔️ 冲煞：${chong}
💰 财神：${d.caishen} · 🧭 喜神：${d.xishen}
☀️ 黄道：${d.huanghei} · ✨ ${d.shensha}

━━━ 📖 今日${d.wisdom.type}家智慧 ━━━

「${d.wisdom.text}」—— ${d.wisdom.source}

${koujue}

⚠️ 内容仅供文化参考，不构成决策依据。
🙏 愿缘主今日顺遂安康！`;
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
    const full = buildFull();
    const pub = buildPublic(getBridgeData(isTomorrow));
    const sim = buildSimple(getBridgeData(isTomorrow));
    const checks = [
      ['full 非空', !!(full && full.trim())],
      ['public 非空', !!(pub && pub.trim())],
      ['simple 非空', !!(sim && sim.trim())],
      ['full 含宜忌', /宜：/.test(full) && /忌：/.test(full)],
      ['public 含干支', /丙午|乙巳|甲辰|癸卯|壬寅|辛丑|庚子|己亥|戊戌|丁酉|丙申|乙未|甲午|癸巳|壬辰|辛卯|庚寅|己丑|戊子|丁亥|丙戌|乙酉|甲申|癸未|壬午|辛巳|庚辰|己卯|戊寅|丁丑|丙子|乙亥|甲戌|癸酉|壬申|辛未|庚午|己巳|戊辰|丁卯|丙寅|乙丑|甲子/.test(pub)],
      ['public 含黄历', /宜：/.test(pub) && /忌：/.test(pub)],
      ['含建除/神煞', /建除|满日|司命|冲煞/.test(pub)],
      ['含免责', /仅供.*参考|不构成.*依据/.test(pub)],
    ];
    const fails = checks.filter(c => !c[1]);
    console.log('═══ daily_push --verify ═══');
    checks.forEach(c => console.log((c[1] ? '✅' : '❌') + ' ' + c[0]));
    console.log('校验结果: ' + (checks.length - fails.length) + ' 通过 / ' + fails.length + ' 失败');
    process.exit(fails.length ? 1 : 0);
  } else if (mode === 'full') {
    output = buildFull();
  } else if (mode === 'public') {
    output = buildPublic(getBridgeData(isTomorrow));
  } else if (mode === 'simple') {
    output = buildSimple(getBridgeData(isTomorrow));
  } else {
    console.error('用法: node daily_push.js <full|public|simple|verify> [--tomorrow]');
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
