// ═══ 命理宝鉴 · 后端API服务 v2 ═══
// 修复：P0安全修复（API密钥移后端+AES加密+CORS+无认证接口+超管手机号）
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { DatabaseSync } = require('node:sqlite');
const sec = require('./security-v2.js');
const rbac = require('./rbac-middleware.js');
const syncRoutes = require('./sync-api');
const distillationRoutes = require('./distillation-routes.js');
const caseQuality = require('./case-quality.js');
const { KB_LEVELS } = require('./kb-config.js');
const crypto = require('crypto');

const kbRoutes = require('./kb-routes.js');
const exportRoutes = require('./export-routes.js');
const kbMgmt = require('./kb-management-engine.js'); // KB 命中入库（新）

const app = express();
const PORT = parseInt(process.env.API_PORT || '8920');

// === CORS 白名单 ===
const CORS_ORIGINS = (process.env.CORS_ORIGINS || 'http://127.0.0.1:8900,http://localhost:8900,https://sgmt-taojing.github.io').split(',');
app.use(cors({
  origin(origin, callback) {
    // 允许同源请求（无Origin头）和白名单域
    if (!origin || CORS_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, false); // 静默拒绝，不暴露CORS策略
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400
}));

app.use(express.json({ limit: '10mb' }));

// === 安全HTTP头 ===
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});

// === 全局速率限制 ===
const globalRateLimit = new Map();
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    const ip = req.ip || req.connection.remoteAddress;
    const key = 'global_' + ip;
    const now = Date.now();
    if (!globalRateLimit.has(key)) {
      globalRateLimit.set(key, { count: 1, resetAt: now + 60000 });
    } else {
      const record = globalRateLimit.get(key);
      if (now > record.resetAt) {
        record.count = 1;
        record.resetAt = now + 60000;
      } else {
        record.count++;
        if (record.count > 120) { // 每分钟120次
          return res.status(429).json({ error: 'RATE_LIMITED', message: '请求过于频繁，请稍后再试' });
        }
      }
    }
  }
  next();
});

// === 数据库初始化 ===
const db = new DatabaseSync('server/database/yidao.db');

// 初始化RBAC相关表
function initRBACTables() {
  db.exec(`
    -- 角色表
    CREATE TABLE IF NOT EXISTS user_roles (
      user_id INTEGER NOT NULL,
      role TEXT NOT NULL,
      assigned_by INTEGER,
      assigned_at TEXT DEFAULT (datetime('now','localtime')),
      PRIMARY KEY (user_id, role)
    );
    
    -- 大师案例库
    CREATE TABLE IF NOT EXISTS master_cases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_uuid TEXT UNIQUE NOT NULL,
      case_number TEXT,
      master_id INTEGER NOT NULL,
      patient_id INTEGER,
      related_case_id INTEGER,
      status TEXT DEFAULT 'draft',
      
      -- 排盘数据（加密）
      bazi_chart TEXT,
      wuxing_summary TEXT,
      
      -- 症状与体质
      symptoms TEXT,
      constitution TEXT,
      
      -- 大师分析（加密）
      master_analysis TEXT,
      analysis_summary TEXT,
      medical_translation TEXT,
      
      -- 医生审核
      doctor_diagnosis TEXT,
      review_status TEXT,
      review_comment TEXT,
      reviewer_id INTEGER,
      reviewed_at TEXT,
      
      -- 最终方案
      final_plan TEXT,
      
      -- 质量标记
      quality_score INTEGER DEFAULT 0,
      is_high_quality INTEGER DEFAULT 0,
      effectiveness_rating INTEGER DEFAULT 0,
      
      created_at TEXT DEFAULT (datetime('now','localtime')),
      submitted_at TEXT,
      completed_at TEXT,
      archived_at TEXT
    );
    
    -- 案例版本历史
    CREATE TABLE IF NOT EXISTS master_case_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER NOT NULL,
      version_type TEXT NOT NULL,
      version_number INTEGER NOT NULL,
      content TEXT NOT NULL,
      content_hash TEXT NOT NULL,
      created_by INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );
    
    -- 案例讨论
    CREATE TABLE IF NOT EXISTS case_discussions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER NOT NULL,
      author_id INTEGER NOT NULL,
      author_role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );
    
    -- 病患病例（平台B）
    CREATE TABLE IF NOT EXISTS medical_cases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      symptoms TEXT NOT NULL,
      constitution TEXT,
      status TEXT DEFAULT 'pending_master',
      assigned_master_id INTEGER,
      assigned_doctor_id INTEGER,
      master_case_id INTEGER,
      
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    );
    
    -- 养生报告（推送给病患）
    CREATE TABLE IF NOT EXISTS tcm_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER NOT NULL,
      patient_id INTEGER NOT NULL,
      doctor_id INTEGER NOT NULL,
      report_text TEXT NOT NULL,
      filtered_text TEXT,
      pushed_at TEXT DEFAULT (datetime('now','localtime')),
      read_at TEXT
    );
    
    -- 审核流程日志
    CREATE TABLE IF NOT EXISTS case_review_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      actor_id INTEGER NOT NULL,
      actor_role TEXT NOT NULL,
      detail TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );
    
    -- 知识库版本管理
    CREATE TABLE IF NOT EXISTS kb_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kb_file TEXT NOT NULL,
      version TEXT NOT NULL,
      snapshot TEXT NOT NULL,
      diff_summary TEXT,
      distill_batch TEXT,
      created_by INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      activated_at TEXT
    );
    
    -- 蒸馏批次
    CREATE TABLE IF NOT EXISTS distillation_batches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batch_id TEXT UNIQUE NOT NULL,
      case_ids TEXT NOT NULL,
      extracted_patterns TEXT,
      confidence_scores TEXT,
      verified_by_master INTEGER,
      verified_by_doctor INTEGER,
      verified_by_admin INTEGER,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now','localtime')),
      completed_at TEXT
    );
  `);
  
  // 迁移旧用户：给现有用户分配free角色
  const usersWithoutRoles = db.prepare(`
    SELECT u.id FROM users u 
    WHERE NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id)
  `).all();
  
  for (const u of usersWithoutRoles) {
    db.prepare('INSERT OR IGNORE INTO user_roles (user_id, role) VALUES (?, ?)').run(u.id, 'free');
    // 超管分配super_admin
    const user = db.prepare('SELECT is_super FROM users WHERE id = ?').get(u.id);
    if (user && user.is_super) {
      db.prepare('INSERT OR IGNORE INTO user_roles (user_id, role) VALUES (?, ?)').run(u.id, 'super_admin');
    }
  }
}

initRBACTables();

// ============================
// 认证中间件（使用RBAC版）
// ============================
const auth = rbac.auth;
const adminAuth = rbac.adminAuth;
const yzProfile = require('./yuanzhu-profile.js');
const requirePermission = rbac.requirePermission;

// ============================
// AI API 代理（密钥不再暴露在前端）
// ============================
// === AI provider 三轨：g2claw > 智谱 ZAI > 本地 Ollama ===
const G2CLAW_API_KEY = process.env.G2CLAW_API_KEY || "";
const ZAI_API_KEY = process.env.ZAI_API_KEY || "";
const OLLAMA_BASE = process.env.OLLAMA_BASE || "http://127.0.0.1:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen2.5:7b";
const AI_API_KEY = G2CLAW_API_KEY || ZAI_API_KEY || "";
// 选 base：G2CLAW > ZAI > Ollama
const _useZai = ZAI_API_KEY && !G2CLAW_API_KEY;
const _useOllama = !G2CLAW_API_KEY && !ZAI_API_KEY && OLLAMA_BASE;
const AI_API_BASE = process.env.AI_API_BASE ||
  (_useZai ? "https://open.bigmodel.cn/api/paas/v4" : _useOllama ? OLLAMA_BASE + "/v1" : "https://api.g2claw.com");
const AI_PROVIDER = _useOllama ? "ollama" : (_useZai ? "zai" : "g2claw");
// === AI系统提示词（含知识库上下文）===
const AI_SYSTEM_PROMPT = `你是「易道智鉴」AI命理助手，精通八字命理、紫微斗数、奇门遁甲、六爻占卜、梅花易数、大六壬、风水布局、中医养生、周易易经等传统文化。

你的职责：
1. 为缘主提供命理排盘解读（需缘主提供出生年月日时）
2. 为信众解答风水、运势、养生、择日等问题
3. 为内部人员（大师/医生）提供专业知识支持
4. 引导不会提问的缘主：先问生辰→再问关心领域→给出针对性解答

回答规范：
- 语言简洁易懂，避免过多术语，必要时用大白话解释
- 涉及健康建议时提醒"仅供参考，不替代专业医疗"
- 涉及命理预测时提醒"理性参考，凡事自辨自省"
- 如果用户提供了生辰八字，主动分析五行强弱、日主旺衰、用神取向
- 如果用户没提供生辰但问了命理问题，先引导提供出生年月日时

知识库覆盖：八字命理、倪海厦中医（伤寒金匮针灸本草）、舒晗命理实战、风水布局、节日养生、奇门遁甲、紫微斗数、六爻梅花等。`;

const AI_GUIDE_PROMPTS = [
  '您可以告诉我您的出生年月日时（公历或农历），我来为您排盘分析',
  '您想了解哪方面？比如：八字命理、运势走向、风水布局、中医养生、择日择吉？',
  '如果您不确定问什么，可以试试：\n1. 我今年运势如何？\n2. 我的五行属什么？\n3. 家里风水怎么布置？\n4. 最近失眠怎么调理？',
  '请提供您的出生信息（年-月-日-时-性别），我可以为您做深度命理分析'
];

// === 手机号八星磁场分析 ===
function _analyzeMobile(mobile) {
  const BAXING = {
    '天医': { codes: ['13','31','68','86','49','94','27','72'], desc: '正财·婚姻·天赋', rank: '吉', career: '金融/医疗/珠宝', affect: '财运亨通，婚姻美满，心地善良' },
    '生气': { codes: ['14','41','67','76','39','93','28','82'], desc: '贵人·乐天·活力', rank: '吉', career: '服务/教育/公关', affect: '贵人多助，乐观向上，人缘极佳' },
    '延年': { codes: ['19','91','78','87','34','43','26','62'], desc: '领导·专业·长寿', rank: '吉', career: '管理/军警/政治', affect: '领导力强，事业有成，延年益寿' },
    '伏位': { codes: ['11','22','88','99','66','77','33','44'], desc: '耐心·潜藏·等待', rank: '中', career: '研究/财务/行政', affect: '性格稳重有耐心，但需主动出击' },
    '六煞': { codes: ['16','61','47','74','38','83','29','92'], desc: '桃花·人际·情绪', rank: '中', career: '美容/娱乐/社交', affect: '异性缘好善于交际，但情绪波动大' },
    '五鬼': { codes: ['18','81','79','97','36','63','24','42'], desc: '才华·叛逆·反复', rank: '凶', career: '技术/艺术/创新', affect: '才华横溢但波折多，事业反复不定' },
    '绝命': { codes: ['12','21','69','96','48','84','37','73'], desc: '投资·冲动·极端', rank: '凶', career: '投资/创业/投机', affect: '敢拼敢闯但易破财，大起大落' },
    '祸害': { codes: ['17','71','89','98','46','64','23','32'], desc: '口舌·是非·固执', rank: '凶', career: '法律/辩论/销售', affect: '口才好但易招是非，性格固执' }
  };
  function _getBX(code) {
    for (var name in BAXING) { if (BAXING[name].codes.indexOf(code) >= 0) return {name:name, desc:BAXING[name].desc, rank:BAXING[name].rank, career:BAXING[name].career, affect:BAXING[name].affect}; }
    return {name:'普通', desc:'平稳', rank: '中', career:'不限', affect:'性格平稳，中规中矩'};
  }
  var stars = [], ji = 0, xiong = 0, zhong = 0;
  for (var i = 0; i < 10; i += 2) {
    var code = mobile.substring(i, i + 2);
    var s = _getBX(code);
    stars.push({pos:i+1, code:code, star:s.name, desc:s.desc, rank:s.rank, career:s.career, affect:s.affect});
    if (s.rank === '吉') ji++; else if (s.rank === '凶') xiong++; else zhong++;
  }
  var lastStar = stars[stars.length-1];
  var prevStar = stars[stars.length-2];
  var score = ji * 8 - xiong * 6 + 20 + (lastStar.rank === '吉' ? 5 : 0) + (lastStar.rank === '吉' && prevStar.rank === '吉' ? 8 : 0);
  score = Math.max(0, Math.min(40, score));
  
  // 新评分体系
  var level, emoji, rating;
  if (score >= 35) { level = '大吉'; emoji = '🌟🌟🌟'; rating = '此号码磁场极佳，强烈推荐使用'; }
  else if (score >= 28) { level = '吉'; emoji = '🌟🌟'; rating = '此号码磁场良好，可以继续使用'; }
  else if (score >= 22) { level = '小吉'; emoji = '🌟'; rating = '此号码磁场尚可，有改进空间'; }
  else if (score >= 15) { level = '小凶'; emoji = '⚠️'; rating = '此号码磁场偏弱，建议考虑更换'; }
  else if (score >= 8) { level = '凶'; emoji = '⚠️⚠️'; rating = '此号码磁场较差，建议更换'; }
  else { level = '大凶'; emoji = '⚠️⚠️⚠️'; rating = '此号码磁场极差，强烈建议更换'; }
  
  // 五行统计
  var numWx = {1:'水',6:'水',2:'火',7:'火',3:'木',8:'木',4:'金',9:'金',5:'土',0:'土'};
  var wxCount = {};
  for (var i = 0; i < mobile.length; i++) { var w = numWx[parseInt(mobile[i])]; wxCount[w] = (wxCount[w]||0)+1; }
  var lack = ['金','木','水','火','土'].filter(function(k){return !wxCount[k];});
  var maxWx = Object.keys(wxCount).reduce(function(a,b){return wxCount[a]>wxCount[b]?a:b;});
  
  // 紧凑报告
  var r = '━━━ 手机号码测评报告 ━━━\n\n';
  r += '【号码】' + mobile + '\n';
  r += '【评级】' + emoji + ' ' + level + '（评分' + score + '/40）\n';
  r += '【总评】' + rating + '\n';
  r += '【吉凶】吉星' + ji + '个 · 凶星' + xiong + '个 · 中星' + zhong + '个\n';
  r += '【五行】' + maxWx + '旺（' + wxCount[maxWx] + '个）' + (lack.length ? ' · 缺' + lack.join('、') : ' · 五行俱全') + '\n\n';
  
  // 八星拆解——紧凑表格格式
  r += '━━━ 八星磁场拆解 ━━━\n';
  stars.forEach(function(s) {
    var icon = s.rank === '吉' ? '✅' : s.rank === '凶' ? '❌' : '➖';
    r += icon + ' ' + s.code + ' ' + s.star + '（' + s.rank + '）— ' + s.affect + '\n';
  });
  
  // 尾号——紧凑
  r += '\n━━━ 尾号分析 ━━━\n';
  r += '尾号' + lastStar.code + ' ' + lastStar.star + '（' + lastStar.rank + '）';
  if (lastStar.rank === '吉' && prevStar.rank === '吉') r += ' ★ 双吉结尾→财运人缘双丰收';
  else if (lastStar.rank === '吉') r += ' ★ 吉星结尾→收尾顺利';
  else if (lastStar.rank === '凶') r += ' ⚠ 凶星结尾→建议更换';
  else r += ' → 收尾平稳';
  r += '\n\n';
  
  // 五行能量——紧凑
  r += '━━━ 五行能量 ━━━\n';
  r += '金' + (wxCount['金']||0) + ' 木' + (wxCount['木']||0) + ' 水' + (wxCount['水']||0) + ' 火' + (wxCount['火']||0) + ' 土' + (wxCount['土']||0);
  var wxDesc = {'金':'决断力强','木':'进取心','水':'聪明灵活','火':'热情领导','土':'稳重厚道'};
  r += ' → ' + maxWx + '旺：' + wxDesc[maxWx];
  if (lack.length) {
    var fixMap = {'金':'补金(尾号4/9)→增强决断','木':'补木(尾号3/8)→增强进取','水':'补水(尾号1/6)→增强灵活','火':'补火(尾号2/7)→增强热情','土':'补土(尾号5/0)→增强稳定'};
    r += '\n缺' + lack.join('、') + '：' + lack.map(function(l){return fixMap[l];}).join('；');
  }
  r += '\n\n';
  
  // 建议——紧凑
  r += '━━━ 综合建议 ━━━\n';
  if (score >= 28) {
    r += '✅ 号码' + level + '，磁场良好。吉星带来' + stars.filter(function(s){return s.rank==='吉';}).map(function(s){return s.star;}).join('、') + '能量。\n';
    r += '适合行业：' + stars.filter(function(s){return s.rank==='吉';}).map(function(s){return s.career;}).join('、') + '\n';
  } else if (score >= 15) {
    r += '⚠️ 号码' + level + '，吉凶参半。';
    if (xiong > 0) r += '注意凶星：' + stars.filter(function(s){return s.rank==='凶';}).map(function(s){return s.star+'('+s.affect+')';}).join('；') + '\n';
    r += '建议：佩戴' + (lack.includes('金')?'金属':lack.includes('木')?'木质':lack.includes('水')?'水晶':lack.includes('火')?'红玛瑙':'玉石') + '饰品化解\n';
  } else {
    r += '❌ 号码' + level + '，建议更换。优选尾号：\n';
    r += '  天医(正财)：13/31/68/86\n  生气(贵人)：14/41/67/76\n  延年(事业)：19/91/78/87\n';
    r += '避免尾号：12/21(绝命) 18/81(五鬼) 17/71(祸害)\n';
  }
  
  // 深度引导
  r += '\n━━━ 深度测评 ━━━\n';
  r += '补充以下信息可获得更深度分析：\n';
  r += '① 行业 ② 生辰 ③ 使用目的\n';
  r += '例：金融行业，1985年生，求财运';
  
  return r;
}

// === 异步排盘：将前端问卷原始数据 → 排盘API → 结构化命盘 ===
async function _autoPaipanFromSurvey(baziData) {
  if (!baziData) return null;
  // 如果已经有完整排盘结果（pillars/day_master）直接返回
  if (baziData.pillars && baziData.day_master) return baziData;
  // 否则认为是问卷原始数据：{s1,s2,s3,s4,s5,...}
  const s = baziData.s1 || baziData.birth_date || '';
  const m = (s.match(/(\d{4})-(\d{1,2})-(\d{1,2})/) || []);
  if (m.length < 4) return baziData; // 没有日期就别排
  const year = +m[1], month = +m[2], day = +m[3];
  // 时间：s5 可能是 HH:MM 或字段 time/hour
  let hour = 12, minute = 0;
  const tStr = baziData.s5 || baziData.birth_time || '';
  const tm = tStr.match(/(\d{1,2}):?(\d{0,2})/);
  if (tm) { hour = +tm[1]; minute = +(tm[2] || 0); }
  // 性别
  const sexRaw = baziData.s3 || baziData.sex || 'male';
  const gender = /女|female/i.test(sexRaw) ? 'female' : 'male';
  // 经度（s2 是城市名，简化为东经 120）
  const lng = 120;
  try {
    const r = await fetch('http://127.0.0.1:8911/paipan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year, month, day, hour, minute, gender, lng, tz: 8 })
    });
    if (!r.ok) return baziData;
    const paipan = await r.json();
    return Object.assign({}, baziData, paipan); // 合并：原问卷 + 排盘结果
  } catch (e) {
    console.warn('[auto-paipan]', e.message);
    return baziData;
  }
}

// === AI本地降级响应（关键词匹配+排盘数据）===
async function _aiLocalResponse(userText, baziData) {
  if (!userText) return '您好，我是易道智鉴AI助手。请告诉我您的出生年月日时，我可以为您排盘分析。';
  // 异步排盘（如需）
  baziData = await _autoPaipanFromSurvey(baziData);
  const text = userText.toLowerCase();
  
  // 手机号识别+分析（优先级最高）
  var _mobileMatch = userText.match(/1[3-9]\d{9}/);
  if (_mobileMatch) return _analyzeMobile(_mobileMatch[0]);
  if (/手机号|号码|选号|手机分析/.test(text)) return '请直接发送您的11位手机号码，我立即分析八星磁场吉凶。\n\n例如：13800138000\n\n分析内容：八星磁场拆解+评分+五行能量+尾号分析+选号建议+行业匹配。';
  
  // 有排盘数据时优先用排盘数据回答
  if (baziData && baziData.pillars) {
    const dm = baziData.day_master || '未知';
    const p = baziData.pillars;
    const wc = baziData.wuxing_count || {};
    const lack = (baziData.wuxing_lack && baziData.wuxing_lack.length > 0) ? baziData.wuxing_lack.join('、') : '无（五行俱全）';
    const ele = dm.slice(-1);
    const dy = baziData.dayun ? baziData.dayun.slice(0,4).map(function(d){return (d.ganzhi||d.gz||'幼运')+'('+d.start_age+'岁起)'}) : null;
    const ss = baziData.shensha ? Object.keys(baziData.shensha) : null;
    let eleDesc = '';
    if (ele === '金') eleDesc = '金主义，性格刚毅果断，重情重义';
    else if (ele === '木') eleDesc = '木主仁，性格直爽向上，有进取心';
    else if (ele === '水') eleDesc = '水主智，性格聪明灵活，善于变通';
    else if (ele === '火') eleDesc = '火主礼，性格热情外向，有领导力';
    else if (ele === '土') eleDesc = '土主信，性格稳重厚道，重承诺';
    var _lack = baziData.wuxing_lack || [];
    var fixStr = _lack.includes('火') ? '宜补火：多穿红色、向南方位、食温性食物' : _lack.includes('木') ? '宜补木：多接触绿色植物、向东方位、食酸性食物' : _lack.includes('金') ? '宜补金：多穿白色、向西方位、食辛性食物' : _lack.includes('水') ? '宜补水：多近水、向北方、食咸性食物' : _lack.includes('土') ? '宜补土：多穿黄色、居中位、食甘性食物' : '五行平衡，注意整体调和';
    var dirStr = _lack.includes('火')?'南方（火位）':_lack.includes('木')?'东方（木位）':_lack.includes('金')?'西方（金位）':_lack.includes('水')?'北方（水位）':'中央（土位）';
    var colorStr = _lack.includes('火')?'红/紫/橙':_lack.includes('木')?'绿/青':_lack.includes('金')?'白/银':_lack.includes('水')?'黑/蓝':'黄/棕';
    var industryStr = _lack.includes('火')?'电子/餐饮/能源/传媒':_lack.includes('木')?'教育/出版/农业/服装':_lack.includes('金')?'金融/机械/珠宝/法律':_lack.includes('水')?'物流/旅游/水产/通信':'房产/陶瓷/建筑/政务';
    var dietStr = _lack.includes('火')?'多食红枣/枸杞/羊肉/生姜':_lack.includes('木')?'多食绿叶菜/酸味水果/核桃':_lack.includes('金')?'多食白萝卜/百合/银耳/梨':_lack.includes('水')?'多食黑豆/海带/鱼/豆腐':'多食山药/小米/南瓜/土豆';
    var yearAdvice = ele==='金'?'火克金，今年压力较大，宜保守稳健，注意呼吸道健康':ele==='木'?'木生火，今年精力旺盛，宜积极进取，但防过劳':ele==='水'?'水克火，今年掌控力强，事业有成':ele==='火'?'火旺太过，宜防急躁，注意心血管':ele==='土'?'火生土，今年贵人多助，稳重行事则吉':'今年平稳，顺势而为';
    return '根据您的排盘数据，完整分析如下：\n\n━━━ 命盘概览 ━━━\n【四柱】' + (p['年']||'?') + ' ' + (p['月']||'?') + ' ' + (p['日']||'?') + ' ' + (p['时']||'?') + '\n【日主】' + dm + '\n【五行】金' + (wc['金']||0) + ' 木' + (wc['木']||0) + ' 水' + (wc['水']||0) + ' 火' + (wc['火']||0) + ' 土' + (wc['土']||0) + '\n【缺行】' + lack + '\n\n━━━ 性格特征 ━━━\n' + eleDesc + '\n\n━━━ 五行补救方案（拿来即用）━━━\n' + fixStr + '\n【方位】' + dirStr + '\n【颜色】' + colorStr + '\n【行业】' + industryStr + '\n【饮食】' + dietStr + '\n\n' + (dy ? '【大运】' + dy.join(' → ') + '\n' : '') + (ss ? '【神煞】' + ss.slice(0,5).join('、') + '\n' : '') + '\n━━━ 年运建议 ━━━\n2026年为丙午年（火旺），' + yearAdvice + '\n\n（配置AI API后可获得更深度的大运/流年/格局分析）';
  }
  
  // 关键词匹配（按优先级）——结构化分析报告
  if (/八字|排盘|命理|算命|算卦|占卜/.test(text)) return '━━━ 八字排盘分析指南 ━━━\n\n【什么是八字】\n八字又称四柱命理，以出生年月日时对应的天干地支（共八个字）推算人生运势。\n\n【排盘需要】\n请提供：出生年-月-日-时-性别\n例如：1985年3月22日8时 女\n\n【分析内容】\n1. 日主五行——您的核心属性\n2. 四柱关系——年柱(祖业)/月柱(父母)/日柱(自己)/时柱(子女)\n3. 五行强弱——金木水火土分布与平衡\n4. 用神喜神——补救八字的核心方向\n5. 大运走势——每10年一个运程\n6. 格局层次——正官/七杀/正印/偏印等\n7. 神煞——天乙贵人/文昌/桃花/驿马等\n8. 流年运势——当年吉凶预测\n\n【化解建议】\n根据五行缺行给出：方位/颜色/行业/饮食/佩戴全方位调理\n\n请在上方填写生辰信息，点击「排盘」即可获得完整分析报告。';
  if (/运势|运气|今年|流年/.test(text)) return '━━━ 运势分析报告 ━━━\n\n【分析维度】\n1. 事业运——官星/七杀+流年太岁关系\n2. 财运——正财/偏财+流年财星触发\n3. 感情运——日支/桃花星+流年合冲\n4. 健康运——五行失衡+流年冲克预警\n5. 人际运——贵人星/小人星+流年引动\n\n【流年要点】\n2026丙午年（火旺）：\n- 喜火者：事业腾飞，贵人多助\n- 忌火者：压力增大，宜守不宜攻\n- 冲太岁（鼠/马/牛/兔）：需化解太岁\n\n【月运参考】\n寅月(正月)木旺·卯月(二月)木旺·辰月(三月)土旺\n巳月(四月)火旺·午月(五月)火旺·未月(六月)土旺\n申月(七月)金旺·酉月(八月)金旺·戌月(九月)土旺\n亥月(十月)水旺·子月(十一月)水旺·丑月(十二月)土旺\n\n请提供生辰，可分析您的个性化流年运势。';
  if (/五行|缺什么|属什么/.test(text)) return '━━━ 五行分析报告 ━━━\n\n【五行对应】\n- 金→肺/呼吸/西方/白色/金属\n- 木→肝胆/东方/绿色/植物\n- 水→肾/泌尿/北方/黑色/液体\n- 火→心/血/南方/红色/光热\n- 土→脾/胃/中央/黄色/土壤\n\n【五行生克】\n- 相生：金生水→水生木→木生火→火生土→土生金\n- 相克：金克木→木克土→土克水→水克火→火克金\n\n【五行强弱判断】\n- 得令（月令五行）→旺\n- 得地（地支有根）→强\n- 得生（有生扶）→强\n- 失令失地→弱\n\n【五行缺行影响】\n- 缺金→呼吸道弱/决断力差\n- 缺木→肝胆弱/进取心不足\n- 缺水→肾弱/灵活性差\n- 缺火→心血管弱/热情不足\n- 缺土→脾胃弱/稳定性差\n\n【五行补救（拿来即用）】\n- 补金→西方/白色/金属饰品/辛味食物\n- 补木→东方/绿色/木质饰品/酸味食物\n- 补水→北方/黑色/水晶/咸味食物\n- 补火→南方/红色/玛瑙/苦味食物\n- 补土→中央/黄色/玉石/甘味食物\n\n请提供生辰，可分析您的五行分布和补救方案。';
  if (/风水|布局|方位|房子|家居/.test(text)) return '━━━ 风水布局分析报告 ━━━\n\n【大门风水】\n- 纳气之口，决定全屋气场\n- 宜在吉位：生气（旺丁）/天医（健康）/延年（旺财）\n- 忌对电梯/楼梯/镜子/厕所\n- 门口宜整洁明亮，忌堆放杂物\n\n【客厅风水】\n- 明堂聚气，宜宽敞明亮\n- 沙发宜靠实墙（有靠山）\n- 财位：进门对角线45度位置\n- 财位宜放：招财植物/貔貅/水晶\n- 忌：横梁压顶/镜子对沙发\n\n【卧室风水】\n- 床头宜靠实墙，忌悬空\n- 忌横梁压顶/吊灯压床\n- 镜子忌对床\n- 床头忌靠卫生间墙\n- 方位：东四命宜东/东南/南/北；西四命宜西/西南/西北/东北\n\n【厨房风水】\n- 火气之源，宜在凶位压煞\n- 灶台忌对门/对水槽（水火相冲）\n\n【卫生间风水】\n- 排污之所，宜在凶位\n- 忌正对大门/卧室门/厨房门\n\n【化煞方法】\n- 路冲→八卦镜/泰山石\n- 缺角→补角水晶/植物\n- 横梁→葫芦/五帝钱\n- 对门→屏风/珠帘\n\n如需个性化分析，请提供房屋朝向和户型。';
  if (/中医|养生|健康/.test(text)) return '中医养生建议：\n\n1. 【起居】子时（23:00）前入睡，养肝胆\n2. 【饮食】七分饱，少生冷，多温热\n3. 【运动】适度运动，气血流通，忌大汗\n4. 【情志】少怒少虑，心态平和\n5. 【四季】春养肝、夏养心、秋养肺、冬养肾\n\n如需针对性建议，请描述您的具体症状或体质。也可使用「症状分析」功能获取周易+中医联合方案。';
  if (/失眠|睡不着|睡眠/.test(text)) return '━━━ 失眠调理方案 ━━━\n\n【中医辨证分型】\n1. 心脾两虚→多梦易醒，心悸健忘\n2. 肝郁化火→辗转难眠，急躁易怒\n3. 阴虚火旺→心烦不眠，潮热盗汗\n4. 痰热扰心→睡眠不安，胸闷痰多\n5. 心胆气虚→惊恐不眠，易惊醒\n\n【食疗方案】\n- 酸枣仁粥→养心安神（酸枣仁15g+大米50g）\n- 百合莲子汤→清心安神\n- 小米粥→健脾安眠\n- 桂圆红枣茶→补心脾\n- 温牛奶→助眠\n\n【穴位按摩】\n- 神门穴→手腕横纹尺侧\n- 三阴交→内踝上3寸\n- 安眠穴→耳垂后凹陷处\n- 涌泉穴→脚底前1/3凹陷\n每穴按揉3-5分钟，睡前操作\n\n【起居调理】\n1. 子时(23:00)前入睡，顺应胆经\n2. 睡前1小时忌手机/电视\n3. 卧室宜暗宜静，温度适宜\n4. 睡前泡脚15分钟（40度温水）\n5. 忌浓茶/咖啡/辛辣（下午3点后）\n\n【运动建议】\n- 傍晚散步30分钟\n- 太极拳/八段锦\n- 忌睡前剧烈运动\n\n【五行调理】\n- 心火旺→穿白色衣物降火\n- 肝郁→穿绿色衣物疏肝\n- 脾虚→穿黄色衣物健脾\n\n如持续失眠超过2周，建议就诊中医。';
  if (/头痛|头晕/.test(text)) return '头痛调理建议：\n\n【分型】\n- 胀痛→肝阳上亢，宜平肝潜阳\n- 隐痛→气血不足，宜益气养血\n- 刺痛→瘀血阻络，宜活血化瘀\n- 重痛→痰湿内阻，宜化痰祛湿\n\n【穴位】太阳穴、风池、合谷\n【建议】如持续头痛请就医，可使用「中医诊疗」功能获取专业方案。';
  if (/倪海厦|倪师/.test(text)) return '倪海厦老师知识库涵盖46个模块：\n\n【经方】伤寒论、金匮要略\n【针灸】针灸大成\n【本草】神农本草经\n【经典】黄帝内经\n【命理】天纪、人纪\n\n您可以在「倪师知识库」页面浏览详细内容，或告诉我具体想了解哪个方面。';
  if (/舒晗/.test(text)) return '━━━ 舒晗老师知识库 ━━━\n\n【知识库内容】\n- 命理秘笈：八字实战心法/格局判断秘诀/用神选取技巧\n- 风水布局：阳宅三要/八宅明镜/玄空飞星实战\n- 进阶课程：大运流年推演/六亲断法/事业财运断\n- 实战案例：婚姻/财运/事业/健康命例解析\n\n【核心理论】\n- 合冲刑害精要：天干五合/地支三合六合六冲三刑\n- 十神精要：正官/七杀/正印/偏印/食神/伤官/比肩/劫财/正财/偏财\n- 用神选取：扶抑/调候/通关/病药/从格顺势\n- 格局层次：正官格/七杀格/正印格/食神格/伤官格等\n\n【实战要点】\n- 断命先看日主旺衰→再定用神→后看大运流年\n- 婚姻看日支+流年引动\n- 财运看财星+大运行运\n- 事业看官星+格局高低\n\n请访问「舒晗知识库」页面浏览完整内容。';
  if (/奇门|遁甲/.test(text)) return '━━━ 奇门遁甲分析报告 ━━━\n\n【什么是奇门遁甲】\n古代最高层预测学，被誉为「帝王之学」，与太乙神数、大六壬并称三式。\n\n【构成】\n- 天盘九星：天蓬/天芮/天冲/天辅/天禽/天心/天柱/天任/天英\n- 地盘八门：休/生/伤/杜/景/死/惊/开\n- 八神：直符/腾蛇/太阴/六合/白虎/玄武/九地/九天\n- 三奇六仪：乙/丙/丁（三奇）+戊/己/庚/辛/壬/癸（六仪）\n\n【用途】\n1. 预测吉凶→百事可测\n2. 择日择吉→选最佳时机\n3. 战略决策→商业/军事\n4. 风水调理→方位选择\n\n【排盘需要】\n请提供：年月日时+预测事项\n例如：2026年7月20日10时 求测事业\n\n【吉格参考】\n吉门（休/生/开）+吉星+吉神→大吉\n凶门（死/惊/伤）+凶星→大凶\n\n请在排盘页面使用奇门遁甲引擎排盘。';
  if (/紫微|斗数/.test(text)) return '━━━ 紫微斗数分析报告 ━━━\n\n【什么是紫微斗数】\n以出生年月日时排盘，用十二宫位分析人生各维度，被誉为「天下第一神数」。\n\n【十二宫位】\n1. 命宫→性格/格局/一生总论\n2. 兄弟宫→兄弟姐妹关系\n3. 夫妻宫→配偶特征/婚姻质量\n4. 子女宫→子女缘分/教育\n5. 财帛宫→财运/理财方式\n6. 疾厄宫→健康/体质\n7. 迁移宫→外出/旅行/变迁\n8. 奴仆宫→下属/朋友\n9. 官禄宫→事业/学业\n10. 田宅宫→房产/家庭环境\n11. 福德宫→精神生活/兴趣爱好\n12. 父母宫→父母关系/长辈缘\n\n【十四主星】\n紫微/天机/太阳/武曲/天同/廉贞/天府/太阴/贪狼/巨门/天相/天梁/七杀/破军\n\n【排盘需要】\n请提供出生年月日时+性别\n\n请在排盘页面使用紫微引擎排盘。';
  if (/六爻|占卜|起卦/.test(text)) return '六爻占卜通过起卦预测吉凶。\n\n【方法】三枚铜钱摇六次，得六爻卦象\n【分析】世应关系、六亲配六神、动爻变爻\n\n您可以在排盘页面使用六爻引擎起卦。';
  if (/梅花|易数/.test(text)) return '━━━ 梅花易数分析报告 ━━━\n\n【什么是梅花易数】\n宋代邵雍创，以时间/数字/方位起卦，简便快捷，适合日常占卜。\n\n【起卦方法】\n1. 时间起卦→年月日时数字取卦\n2. 数字起卦→任意数字取上下卦\n3. 方位起卦→以方位对应八卦\n4. 声音起卦→以声音数取卦\n\n【分析维度】\n- 体用关系→体卦为主，用卦为客\n- 互卦→过程发展\n- 变卦→结果走向\n- 五行生克→体用比和/体克用/用克体\n\n【吉凶判断】\n- 体生用→泄气，事难成\n- 用生体→得助，事易成\n- 体克用→费力可成\n- 用克体→受阻难成\n- 体用比和→顺遂大吉\n\n请在排盘页面使用梅花引擎分析。';
  if (/六壬/.test(text)) return '━━━ 大六壬分析报告 ━━━\n\n【什么是大六壬】\n与奇门遁甲、太乙神数并称三式，擅长预测具体人事吉凶。\n\n【构成】\n- 四课→从日辰推演出的四个课\n- 三传→初传/中传/末传，事态发展脉络\n- 天将→十二天将（贵人/腾蛇/朱雀等）\n- 神煞→各种吉凶标志\n\n【用途】\n1. 失物→能否找回/方位\n2. 行人→是否回归/时间\n3. 婚姻→成败/对方特征\n4. 事业→升降/时机\n5. 疾病→轻重/预后\n6. 官司→胜败/过程\n\n【排盘需要】\n请提供：年月日时+预测事项\n\n请在排盘页面使用六壬引擎起课。';
  if (/择日|择吉|吉日/.test(text)) return '━━━ 择日择吉分析报告 ━━━\n\n【择日原则】\n- 宜：天德/月德/三合/六合/天赦/黄道吉日\n- 忌：岁破/月破/四废/往亡/劫煞/灾煞\n\n【各类择日】\n1. 搬家→宜移徙日，忌月破/三煞方\n2. 结婚→宜天喜/三合/天德合，忌孤辰寡宿\n3. 开业→宜开日/满日/成日，忌收日/闭日\n4. 动土→宜土符/三合，忌土府/五黄\n5. 出行→宜驿马/天马，忌往亡/归忌\n\n【每日宜忌】\n建→宜上任/忌动土\n除→宜治病/忌出行\n满→宜祈福/忌安葬\n平→宜修造/忌动土\n定→宜安床/忌诉讼\n执→宜捕捉/忌开池\n破→宜求医/忌嫁娶\n危→宜祭祀/忌登山\n成→宜结婚/忌诉讼\n收→宜收纳/忌出行\n开→宜开业/忌安葬\n闭→宜筑堤/忌开仓\n\n请访问「黄历」页面查看每日宜忌，或在排盘页面使用择日引擎。';
  if (/黄历|宜忌|老黄历/.test(text)) return '━━━ 黄历宜忌分析报告 ━━━\n\n【黄历内容】\n1. 每日宜忌→当日适合/忌讳的事项\n2. 吉时方位→当日吉时/喜神方位/财神方位\n3. 干支→年柱/月柱/日柱/时柱\n4. 节气→二十四节气养生提示\n5. 冲煞→当日冲什么生肖/煞什么方位\n\n【十二值日】\n建/除/满/平/定/执/破/危/成/收/开/闭\n各有宜忌，影响当日运势\n\n【二十八星宿】\n每日对应一个星宿，影响吉凶\n吉宿：角/房/尾/斗/女/虚/危/室/壁/奎/胃/毕/参/井/柳/星\n凶宿：亢/氐/心/牛/危/昴/觜/鬼/轸\n\n【三视角养生】\n- 儒家→修身养德/读书明理\n- 道家→吐纳导引/内丹修炼\n- 佛家→禅修念佛/慈悲行善\n\n【今日命理知识】\n基于当日干支，推送桃花/驿马/纳音等知识点\n\n请访问「黄历」页面查看今日完整黄历。';
  if (/体质|调理/.test(text)) return '━━━ 体质调理分析报告 ━━━\n\n【五型体质特征】\n- 木型→面色青/身长/性格直，肝气偏旺\n- 火型→面色红/尖脸/性急，心火偏旺\n- 土型→面色黄/圆润/稳重，脾胃偏弱\n- 金型→面色白/方正/刚毅，肺气偏弱\n- 水型→面色黑/圆润/聪明，肾气偏弱\n\n【各型养生方案】\n木型（疏肝理气）\n- 食疗：绿色蔬菜/枸杞/菊花茶\n- 穴位：太冲/阳陵泉\n- 忌：怒/酸/久坐\n\n火型（养心安神）\n- 食疗：莲子/百合/绿豆\n- 穴位：神门/内关\n- 忌：燥/苦/熬夜\n\n土型（健脾祛湿）\n- 食疗：山药/薏仁/小米\n- 穴位：足三里/阴陵泉\n- 忌：冷/甜/久卧\n\n金型（补肺益气）\n- 食疗：白萝卜/银耳/百合\n- 穴位：太渊/肺俞\n- 忌：悲/辛/久卧\n\n水型（温补肾阳）\n- 食疗：黑豆/核桃/羊肉\n- 穴位：肾俞/太溪\n- 忌：寒/咸/久立\n\n请访问「体质调理」页面做体质测试，或提供生辰分析您的五行体质。';
  if (/婚姻|感情|桃花|恋爱|对象|单身/.test(text)) return '━━━ 感情婚姻分析报告 ━━━\n\n【桃花星分析】\n- 日支带子午卯酉→天生桃花旺，异性缘佳\n- 桃花逢合→感情顺利\n- 桃花逢冲→感情波折\n\n【正缘判断】\n- 男命：正财星为妻，流年引正财则婚至\n- 女命：正官星为夫，流年引正官则嫁期\n- 日柱天合地合→夫妻恩爱\n\n【合婚要点】\n1. 五行互补→双方八字五行互相补缺为上婚\n2. 日柱相生→天干相生地支相合为中婚\n3. 生肖三合/六合→鼠龙猴/牛蛇鸡/虎马狗/兔羊猪\n4. 忌六冲→子午冲/丑未冲/寅申冲/卯酉冲/辰戌冲/巳亥冲\n\n【感情调理】\n- 桃花位：卧室桃花位放鲜花（生肖对应方位）\n- 粉水晶：增旺人缘桃花\n- 红绳：左手佩戴招正缘\n\n请提供生辰（或双方生辰），可做深度感情/合婚分析。';
  if (/子女|孩子|怀孕|生育/.test(text)) return '━━━ 子女缘分分析报告 ━━━\n\n【子女星】\n- 男命：官杀为子女星，七杀为儿子、正官为女儿\n- 女命：食伤为子女星，食神为女儿、伤官为儿子\n- 子女星为喜用→子女孝顺有出息\n- 子女星为忌神→子女操心费力\n\n【子女宫】\n- 时柱为子女宫\n- 时柱逢冲→子女缘薄或远离\n- 时柱逢合→子女孝顺在身边\n- 时柱空亡→子女缘淡\n\n【备孕择时】\n- 选流年行食伤/官杀运时怀孕→子女八字好\n- 避开冲时柱的年份怀孕\n- 孕期宜安胎（宜静不宜动）\n\n【子女教育】\n- 金型孩子→刚毅，宜军警/体育\n- 木型孩子→向上，宜教育/文化\n- 水型孩子→聪明，宜科研/艺术\n- 火型孩子→热情，宜管理/表演\n- 土型孩子→稳重，宜房产/政务\n\n请提供生辰，可分析您的子女缘深浅和子女方向。';
  if (/事业|工作|职场|创业|跳槽/.test(text)) return '━━━ 事业分析报告 ━━━\n\n【官运判断】\n- 正官旺→适合体制内/大企业管理\n- 七杀旺→适合创业/军警/竞争性行业\n- 正印旺→适合教育/研究/文化\n- 食神旺→适合餐饮/艺术/创意\n- 伤官旺→适合技术/设计/自由职业\n- 比劫旺→适合合伙/体育/销售\n- 正财旺→适合金融/财务/经商\n- 偏财旺→适合投资/投机/贸易\n\n【行业五行对照】\n金：金融/机械/珠宝/法律/IT硬件\n木：教育/出版/农业/服装/家具\n水：物流/旅游/水产/通信/贸易\n火：电子/餐饮/能源/传媒/美容\n土：房产/陶瓷/建筑/政务/矿业\n\n【创业时机】\n- 大运行喜用神运→创业黄金期\n- 流年触发财官→升职加薪\n- 忌比劫运→不宜合伙，防破财\n\n【跳槽建议】\n- 流年冲官星→宜变动\n- 流年合官星→宜稳定\n\n请提供生辰，可分析您的事业方向和最佳创业时机。';
  if (/财运|投资|理财|赚钱|破财/.test(text)) return '━━━ 财运分析报告 ━━━\n\n【财星类型】\n- 正财→工薪收入/固定资产，稳定可靠\n- 偏财→投资收益/意外之财，来去匆匆\n- 财库（辰戌丑未）→有库能存财，无库财来财去\n\n【财运周期】\n- 大运行财星运→十年财运高峰\n- 流年触发财星→当年进财\n- 流年比劫运→当年破财，宜守不宜投\n\n【理财建议】\n- 正财为主者→稳健理财，房产/定存/基金\n- 偏财为主者→适度投资，股票/创业/投机\n- 财库旺者→善于储蓄，适合长线投资\n- 比劫旺者→防合伙破财，独立经营为佳\n\n【破财预警】\n- 比劫运年→忌借贷/担保/合伙\n- 劫财逢冲→大额支出风险\n- 财星入墓→投资被套\n\n【招财方位】\n以日主喜用神定方位：\n喜金→西方·喜木→东方·喜水→北方\n喜火→南方·喜土→中央\n\n请提供生辰，可分析您的财运走势和理财方向。';
  if (/健康|疾病|体检|长寿/.test(text)) return '健康分析：\n\n【五行对应】金→肺、木→肝胆、水→肾、火→心、土→脾/胃\n【缺行预警】缺某五行→对应脏腑偏弱\n【大运健康】行忌神运时注意对应脏腑\n\n请提供生辰，可分析您的健康弱点和养护建议。';
  if (/搬家|出行|迁徙|出差/.test(text)) return '━━━ 搬家出行分析报告 ━━━\n\n【搬家择日】\n- 宜：天德日/月德日/三合日/六合日/天赦日\n- 忌：岁破日/月破日/四废日/往亡日\n- 搬家时辰：宜上午辰时~午时（7-13点）\n- 入宅仪式：先入贵重物品→开火做饭→放鞭炮/播放喜庆音乐\n\n【出行方位】\n- 向喜用神方位出行大吉\n- 喜金→西方·喜木→东方·喜水→北方·喜火→南方·喜土→本地\n- 忌向太岁方/岁破方出行\n\n【迁徙方向】\n- 迁向喜用方发展→事业财运更佳\n- 迁向忌神方→阻力大，不宜长久\n\n【搬家注意事项】\n1. 搬家前三天宜亮灯（旺气）\n2. 搬家当天宜开火做饭（旺丁）\n3. 搬家当天宜请客（旺人缘）\n4. 搬家后一个月内不宜装修动土\n\n请在排盘页面使用择日引擎查询具体吉日。';
  if (/学业|考试|升学|考研/.test(text)) return '━━━ 学业考试分析报告 ━━━\n\n【印星分析】\n- 正印→传统学习好，记忆力强，适合体制教育\n- 偏印→非传统学习，悟性高，适合艺术/技术\n- 印星为喜用→学业顺利，考试得心应手\n- 印星为忌→学习压力大，考试发挥不稳\n\n【文昌星】\n- 日干见文昌→聪慧好学，考运佳\n- 文昌位：书桌宜朝喜用神方位\n- 文昌塔：放书桌左上角助学业\n\n【考试运势】\n- 流年行印星运→考试顺利\n- 流年行食伤运→才思敏捷，适合创作类考试\n- 流年行官杀运→压力较大但成绩可控\n\n【各阶段建议】\n- 小学→培养习惯，打好基础\n- 初中→开发智力，全面发展\n- 高中→重点突破，调整心态\n- 大学→明确方向，积累人脉\n- 考研/考公→选印星旺年报考\n\n请提供生辰，可分析学业潜力和考试运势。';
  if (/人际|社交|贵人|小人/.test(text)) return '━━━ 人际关系分析报告 ━━━\n\n【贵人星】\n- 天乙贵人→遇难呈祥，最大贵人星\n- 天德贵人→逢凶化吉\n- 月德贵人→人缘好，多得帮助\n- 文昌贵人→学业事业贵人\n- 桃花贵人→异性缘好，感情助力\n\n【贵人方位】\n- 以日干查天乙贵人所在地支方位\n- 甲戊见牛羊（东北/西南）\n- 乙己见鼠猴（北/西南）\n- 丙丁见猪鸡（西北/西）\n- 壬癸见兔蛇（东/东南）\n- 庚辛见虎马（东北/南）\n\n【小人防范】\n- 七杀旺→易招暗算，宜低调\n- 伤官旺→易得罪人，宜慎言\n- 劫财旺→易被利用，忌合伙\n- 化解：佩戴天乙贵人符/保持低调\n\n【社交建议】\n- 比肩多→朋友多但宜各自独立\n- 劫财多→朋友多但易破财\n- 正官旺→社交有分寸，适合体制\n- 食神旺→人缘好，善于交际\n\n请提供生辰，可分析您的贵人和人际运。';
  if (/开运|吉祥物|佩戴|转运/.test(text)) return '━━━ 开运吉祥物分析报告 ━━━\n\n【五行补缺佩戴】\n- 缺金→金属饰品/银饰/白水晶\n- 缺木→木质手串/绿幽灵/檀木\n- 缺水→黑曜石/海蓝宝/蓝水晶\n- 缺火→红玛瑙/石榴石/紫水晶\n- 缺土→黄玉/蜜蜡/虎眼石\n\n【生肖本命佛】\n- 鼠→千手观音·牛虎→虚空藏菩萨\n- 兔→文殊菩萨·龙蛇→普贤菩萨\n- 马→大势至菩萨·羊猴→大日如来\n- 鸡→不动尊菩萨·狗猪→阿弥陀佛\n\n【三合生肖贵人】\n- 鼠龙猴→三合水局\n- 牛蛇鸡→三合金局\n- 虎马狗→三合火局\n- 兔羊猪→三合木局\n佩戴三合生肖饰品助运势\n\n【方位调理】\n- 办公桌朝喜用神方位\n- 睡床床头朝喜用神方位\n- 大门朝喜用神方位最佳\n\n【颜色调理】\n- 喜金→白/银/金色\n- 喜木→绿/青色\n- 喜水→黑/蓝色\n- 喜火→红/紫色\n- 喜土→黄/棕色\n\n【日常开运】\n1. 晨起面朝喜用方深呼吸7次\n2. 穿喜用颜色衣物\n3. 食喜用五行对应食物\n4. 佩戴对应五行饰品\n5. 办公/居住朝喜用方位\n\n请提供生辰，可知您的喜用神和开运方案。';
  if (/合婚|配对|匹配/.test(text)) return '━━━ 合婚配对分析报告 ━━━\n\n【合婚四看】\n1. 五行互补→男方喜神为女方八字所含、反之亦然\n2. 日柱关系→天合地合上婚/相生中婚/相克下婚\n3. 生肖配对→三合六合为佳/六冲三刑为忌\n4. 用神互补→双方用神互不冲克\n\n【生肖配对表】\n三合（大吉）：鼠龙猴/牛蛇鸡/虎马狗/兔羊猪\n六合（吉）：鼠牛/虎猪/兔狗/龙鸡/蛇猴/马羊\n六冲（忌）：鼠马/牛羊/虎猴/兔鸡/龙狗/蛇猪\n三刑（忌）：鼠兔/虎蛇猴/牛狗羊\n\n【日柱天合地合】\n- 甲己合/乙庚合/丙辛合/丁壬合/戊癸合（天干五合）\n- 子丑合/寅亥合/卯戌合/辰酉合/巳申合/午未合（地支六合）\n\n【婚姻宫】\n- 日支为配偶宫\n- 日支逢冲→婚姻不稳\n- 日支逢合→婚姻和谐\n- 日支坐桃花→配偶漂亮\n\n【合婚建议】\n- 上婚→五行互补+日柱相合+生肖三合\n- 中婚→五行不冲+日柱相生+生肖不冲\n- 下婚→五行相克+日柱相冲+生肖六冲\n\n请提供双方生辰，可做深度合婚配对分析。';
  if (/本命年|犯太岁|太岁/.test(text)) return '━━━ 本命年/犯太岁化解报告 ━━━\n\n【2026丙午年太岁】\n- 值太岁：马（本命年）\n- 冲太岁：鼠（子午冲）\n- 刑太岁：马（自刑）\n- 害太岁：牛（丑午害）\n- 破太岁：兔（卯午破）\n\n【犯太岁影响】\n- 事业→变动多，不宜跳槽/创业\n- 财运→破财风险大，忌大额投资\n- 感情→波折多，忌结婚/离婚\n- 健康→注意心血管/血压\n\n【化解方法（拿来即用）】\n1. 佩戴太岁符→全年佩戴，年底焚烧谢太岁\n2. 拜太岁→正月初八至正月十五，到道观拜太岁\n3. 佩戴本命佛→对应生肖本命佛\n4. 行善积德→每月放生/捐善款\n5. 避免大额投资/重大变动\n6. 年底（腊月廿四）谢太岁\n\n【太岁方位】\n- 2026年太岁在南方（午方）\n- 忌在南方动土/装修\n- 宜在北方放化煞物品\n\n【每月注意事项】\n- 正月/七月（冲太岁月）→特别谨慎\n- 五月（午月）→太岁当月，大事勿用\n\n犯太岁并非全部不好，积极化解可转危为安。';
  if (/梦境|做梦|梦到/.test(text)) return '━━━ 梦境解读报告 ━━━\n\n【五行梦境】\n- 梦水→智慧/财运暗示，水清吉/水浊凶\n- 梦火→事业/名声变化，火旺吉/火灾凶\n- 梦木→成长/健康，茂盛吉/枯萎凶\n- 梦金→权力/决断，得金吉/失金凶\n- 梦土→稳定/房产，厚土吉/崩塌凶\n\n【动物梦境】\n- 梦龙→贵人将至，事业腾飞\n- 梦蛇→财运到来或桃花\n- 梦虎→权力/威望提升\n- 梦马→出行/升迁\n- 梦鱼→财运丰收\n- 梦鸟→消息/喜讯\n- 梦狗→忠诚/友情\n- 梦猫→桃花/异性\n\n【场景梦境】\n- 梦飞行→志向高远/升迁\n- 梦坠落→压力/失控\n- 梦迷路→方向不明/迷茫\n- 梦考试→考核/压力\n- 梦死人→结束/新生\n- 梦结婚→合作/新关系\n\n【周易解梦】\n- 梦与日主五行相关：日主为火梦水→水克火，注意健康\n- 梦与十神相关：梦官杀→压力/事业变动\n\n请描述您的梦境内容，我为您详细解读。';
  if (/性格|心理|脾气/.test(text)) return '━━━ 性格心理分析报告 ━━━\n\n【日主五行性格】\n- 金→刚毅果断，重义气，缺点：固执\n- 木→直爽向上，有进取心，缺点：冒进\n- 水→聪明灵活，善变通，缺点：多虑\n- 火→热情外向，有领导力，缺点：急躁\n- 土→稳重厚道，重承诺，缺点：保守\n\n【十神性格影响】\n- 正官→守规矩，有责任感\n- 七杀→果断，有魄力，竞争意识强\n- 正印→善良，有包容心，好学\n- 偏印→敏感，有独特见解\n- 食神→乐观，温和，享受生活\n- 伤官→叛逆，聪明，表现欲强\n- 比肩→独立，自主，竞争\n- 劫财→好胜，慷慨，易冲动\n- 正财→务实，稳重，理财\n- 偏财→大方，灵活，善交际\n\n【四柱性格分层】\n- 年柱→祖辈遗传/早年性格\n- 月柱→青年/成年性格\n- 日柱→核心性格（日干为本）\n- 时柱→晚年/内在性格\n\n【性格调理】\n- 急躁→修心冥想/书法/茶道\n- 内向→社交训练/演讲/团队活动\n- 多虑→运动/旅行/放下执念\n\n请提供生辰，可做深度性格分析。';
  if (/公司起名|品牌起名|店铺起名/.test(text)) return '公司/品牌起名：\n\n【五行】补法人八字喜用神\n【数理】总格宜吉祥（24/31/35）\n【行业】行业五行与名称五行相生\n\n请提供法人生辰和行业类型。';
  if (/每日运势|今日运势|今天运势/.test(text)) return '每日运势请查看「黄历」页面。如需个性化运势，请先排盘，AI可根据日主五行分析当日运势。';
  if (/家庭风水|全家风水|家人风水/.test(text)) return '━━━ 家庭风水分析报告 ━━━\n\n【家庭成员分析】\n- 每个成员按日主五行分配吉位卧室\n- 父亲宜住乾位（西北）\n- 母亲宜住坤位（西南）\n- 长子宜住震位（东）\n- 长女宜住巽位（东南）\n\n【全家化解方案】\n1. 户型缺角→对应方位放五行物品补角\n2. 大门冲煞→八卦镜/屏风\n3. 厨卫相对→水火相冲，用绿色植物化解\n4. 横梁压顶→葫芦/五帝钱\n\n【楼层选择】\n- 1/6层属水·2/7层属火·3/8层属木·4/9层属金·5/0层属土\n- 选楼层宜配全家喜用神五行\n\n请提供全家生辰和房屋朝向做个性化分析。';
  if (/姓名|改名|名字/.test(text)) return '━━━ 姓名学分析报告 ━━━\n\n【三才五格】\n- 天格=姓+1→祖业遗传\n- 人格=姓末+名首→核心性格\n- 地格=名+1→早年运\n- 外格=总格-人格+1→社交\n- 总格=姓+名总笔画→晚年运\n\n【五行配合】\n- 名字五行宜补八字喜用神\n- 喜金→名字用金/鑫/铭/锐\n- 喜木→名字用木/林/森/柏\n- 喜水→名字用水/淼/涵/润\n- 喜火→名字用火/炎/灿/辉\n- 喜土→名字用土/坤/培/垣\n\n【数理吉凶】\n- 大吉：1/3/5/8/11/13/15/16/21/23/24/25/31/32/33/35\n- 大凶：4/9/10/14/19/20/22/28/34/44\n\n请告诉我您的姓名（和可选生辰），我为您分析吉凶。';
  if (/颜择|面相|长相/.test(text)) return '━━━ 颜择面相分析 ━━━\n\n【五官对应】\n- 额头→早年运（15-30岁）\n- 眉毛→兄弟朋友运（31-34岁）\n- 眼睛→中年运/心性（35-40岁）\n- 鼻子→财运（41-50岁）\n- 嘴巴→晚年运/子息（51-60岁）\n- 下巴→晚年福禄（61岁后）\n\n【面相要点】\n- 天庭饱满→早年得志\n- 眉清目秀→聪明仁善\n- 鼻梁高挺→财运亨通\n- 地阁方圆→晚年安稳\n\n【面部气色】\n- 红润→吉运将至\n- 青暗→注意肝胆/压力\n- 黑暗→注意肾脏/疲劳\n- 黄明→财运将至\n\n请上传正面照或描述面相特征，我为您分析。也可使用排盘页面的颜择功能。';
  if (/生命指数|生命规划/.test(text)) return '━━━ 生命指数与规划 ━━━\n\n【生命指数】\n基于八字五行平衡度+格局层次+大运走势综合评分：\n- 90+：上上命，大富大贵\n- 70-89：上命，事业有成\n- 50-69：中命，平稳安康\n- 30-49：下命，需努力化解\n- <30：需积极化解改运\n\n【人生规划建议】\n1. 事业方向→以用神五行选行业\n2. 婚姻时机→以流年引动正官/正财定\n3. 财运规划→以财库/财星定理财策略\n4. 健康管理→以五行缺行定养护脏腑\n5. 教育方向→以印星/文昌定学习路径\n\n请提供生辰，可计算您的生命指数并给出人生规划。';
  if (/疗愈音乐|冥想|放松/.test(text)) return '━━━ 疗愈音乐推荐 ━━━\n\n【五行音乐疗法】\n- 木→角音（笛/箫）→疏肝理气\n- 火→徵音（琴/瑟）→养心安神\n- 土→宫音（埙/鼓）→健脾和胃\n- 金→商音（钟/锣）→润肺益气\n- 水→羽音（古琴/流水）→滋肾宁心\n\n【场景推荐】\n- 失眠→羽音水疗+白噪音\n- 焦虑→徵音火疗+冥想引导\n- 疲劳→宫音土疗+自然声\n- 压力→角音木疗+森林声\n- 悲伤→商音金疗+风铃声\n\n【使用方法】\n睡前30分钟/音量适中/戴耳机/闭目放松\n\n请在排盘页面的「疗愈音乐」功能中体验。';
  if (/六十甲子|甲子|纳音/.test(text)) return '━━━ 六十甲子纳音 ━━━\n\n【六十甲子】\n由天干（甲-癸）×地支（子-亥）组合，共60组，每两组对应一纳音五行。\n\n【纳音五行表】\n- 海中金（甲子乙丑）·炉中火（丙寅丁卯）\n- 大林木（戊辰己巳）·路旁土（庚午辛未）\n- 剑锋金（壬申癸酉）·山头火（甲戌乙亥）\n- 涧下水（丙子丁丑）·城头土（戊寅己卯）\n- 白蜡金（庚辰辛巳）·杨柳木（壬午癸未）\n- 泉中水（甲申乙酉）·屋上土（丙戌丁亥）\n- 霹雳火（戊子己丑）·松柏木（庚寅辛卯）\n- 长流水（壬辰癸巳）·砂石金（甲午乙未）\n- 山下火（丙申丁酉）·平地木（戊戌己亥）\n- 壁上土（庚子辛丑）·金箔金（壬寅癸卯）\n- 覆灯火（甲辰乙巳）·天河水（丙午丁未）\n- 大驿土（戊申己酉）·钗钏金（庚戌辛亥）\n- 桑柘木（壬子癸丑）·大溪水（甲寅乙卯）\n- 砂中土（丙辰丁巳）·天上火（戊午己未）\n- 石榴木（庚申辛酉）·大海水（壬戌癸亥）\n\n请提供生辰，可查您的年柱纳音五行。';
  if (/青年|年轻人|少年/.test(text)) return '━━━ 青年运势分析 ━━━\n\n【青年期特点（18-35岁）】\n- 正值学业/事业起步期\n- 大运第一/二步运\n- 宜：学习积累/广结善缘/勇于尝试\n- 忌：好高骛远/冲动决策/过度消费\n\n【各阶段建议】\n18-22岁→学业为重，开发特长\n23-27岁→事业起步，积累经验\n28-35岁→事业冲刺，择偶成家\n\n【常见问题】\n- 迷茫→看日主喜用定方向\n- 感情→看流年桃花/正缘\n- 事业→看官星/大运行运\n\n请提供生辰，可分析您的青年运势和发展方向。';
  if (/河图|洛书/.test(text)) return '━━━ 河图洛书分析 ━━━\n\n【河图】\n天一生水地六成之（1/6水）\n地二生火天七成之（2/7火）\n天三生木地八成之（3/8木）\n地四生金天九成之（4/9金）\n天五生土地十成之（5/10土）\n\n【洛书九宫】\n戴九履一（9南1北）\n左三右七（3东7西）\n二四为肩（2西南4东南）\n六八为足（6西北8东北）\n五居中央\n\n【应用】\n- 河图→五行生成数/先天八卦\n- 洛书→九宫飞星/后天八卦/玄空风水\n\n请在排盘页面使用河图洛书分析功能。';
  if (/推送|每日推送|每日运势/.test(text)) return '━━━ 每日推送服务 ━━━\n\n【推送内容】\n1. 每日运势——基于当日干支与您的日主关系\n2. 养生提示——节气养生/时辰提醒\n3. 节日提醒——传统节日文化\n4. 案例通知——诊疗报告更新\n\n【推送方式】\n- 公众号推送（需关注）\n- 小程序订阅消息\n- 系统内查看\n\n【个性化推送】\n提供生辰后，每日推送将基于您的日主五行分析：\n- 今日宜忌（个性化）\n- 吉时方位（个性化）\n- 五行穿衣（个性化）\n- 养生建议（个性化）\n\n请访问「黄历」页面查看今日推送。';
  if (/大师课堂|名师|课程|学习/.test(text)) return '━━━ 名师课堂 ━━━\n\n【舒晗老师】\n- 八字入门十讲（免费）\n- 风水布局实战课\n- 奇门遁甲初阶\n- 大运流年推演\n\n【倪海厦老师】\n- 黄帝内经养生智慧\n- 伤寒论方证对应\n- 针灸大成\n- 神农本草经\n\n【学习建议】\n- 初学者→先学八字入门+黄帝内经\n- 进阶→风水布局+大运推演\n- 专业→奇门遁甲+伤寒论经方\n\n请访问「倪师学堂」和「名师课堂」页面学习。';
  if (/你好|您好|hi|hello|在吗/.test(text)) return '您好！我是易道智鉴AI命理助手。我可以帮您：\n\n1. 📅 八字排盘与命理分析（需提供生辰）\n2. 🌟 运势预测与流年分析\n3. 🏠 风水布局指导\n4. 💊 中医养生咨询\n5. 🔮 奇门/紫微/六爻/梅花排盘\n6. 📅 择日择吉\n7. 🪷 倪师中医知识\n\n请告诉我您想了解什么，或在上方填写生辰进行排盘。';
  if (/谢谢|感谢|thanks/.test(text)) return '不客气！如果您还有其他问题，随时可以问我。祝您一切顺利！';
  if (/再见|bye|拜拜/.test(text)) return '再见！祝您吉祥如意，凡事顺遂。随时欢迎回来提问。';
  
  // 默认：列出可问领域
  return '您好！我是易道智鉴AI命理助手。您可以问我：\n\n📅 命理排盘（需提供生辰）\n🌟 运势分析\n⚖️ 五行分析\n🏠 风水布局\n💊 中医养生\n🔮 奇门/紫微/六爻/梅花\n📅 择日择吉\n🪷 倪师中医\n\n或者直接告诉我您的出生年月日时，我为您排盘分析。';
}

// === AI聊天（认证用户，高速率）===
app.post('/api/ai/chat', auth, async (req, res) => {
  const messages = req.body.messages;
  const model = req.body.model || 'auto';
  if (!messages || !Array.isArray(messages)) return res.json({ error: '参数错误' });
  if (!AI_API_KEY) return res.json({ error: 'AI服务未配置' });
  if (!sec.rateLimit('ai_chat_' + req.userId, 20, 60000)) return res.status(429).json({ error: 'RATE_LIMITED', message: '请求过于频繁' });
  const sysMsg = { role: 'system', content: AI_SYSTEM_PROMPT };
  try {
    const response = await fetch(AI_API_BASE + '/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': '***' + AI_API_KEY },
      body: JSON.stringify({ model, messages: [sysMsg, ...messages], max_tokens: 4096 })
    });
    const data = await response.json();
    res.json(data);
  } catch (e) {
    console.error('AI API错误:', e.message);
    res.json({ error: 'AI服务暂时不可用' });
  }
});

// === AI聊天（公开，无需认证，低速率+本地降级）===
// R40-E AI KB 命中落库端点
app.post('/api/ai/kb-hit-log', async (req, res) => {
  try {
    const { query, hits, source, responseTime } = req.body || {};
    if (!query) return res.json({ error: '参数错误' });
    
    // 检查表是否存在
    const tblExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='kb_hit_log'").get();
    if (!tblExists) {
      db.exec(`CREATE TABLE IF NOT EXISTS kb_hit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        query TEXT NOT NULL,
        hits INTEGER DEFAULT 0,
        source TEXT,
        response_time INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`);
    }
    
    db.prepare(`INSERT INTO kb_hit_log (query, hits, source, response_time) VALUES (?, ?, ?, ?)`).run(
      String(query).substring(0, 500),
      parseInt(hits) || 0,
      String(source || 'unknown').substring(0, 50),
      parseInt(responseTime) || 0
    );
    
    res.json({ ok: true, logged: true });
  } catch (e) {
    res.json({ error: e.message });
  }
});

app.get('/api/ai/kb-hit-stats', async (req, res) => {
  try {
    if (!db) return res.json({ error: '数据库未就绪' });
    // auto-create
    db.exec(`CREATE TABLE IF NOT EXISTS kb_hit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      query TEXT,
      hits INTEGER DEFAULT 0,
      module TEXT,
      source TEXT,
      response_time INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);
    const total = db.prepare('SELECT COUNT(*) as cnt FROM kb_hit_log').get().cnt || 0;
    const today = db.prepare(`SELECT COUNT(*) as cnt FROM kb_hit_log WHERE DATE(created_at) = DATE('now', 'localtime')`).get().cnt || 0;
    const topQueries = db.prepare(`SELECT query, COUNT(*) as cnt FROM kb_hit_log GROUP BY query ORDER BY cnt DESC LIMIT 10`).all();
    const bySource = db.prepare(`SELECT source, COUNT(*) as cnt FROM kb_hit_log GROUP BY source ORDER BY cnt DESC`).all();
    
    res.json({ ok: true, total, today, topQueries, bySource });
  } catch (e) {
    res.json({ total: 0, today: 0, error: e.message });
  }
});



app.get('/api/admin/kb/stats', (req, res) => {
  try {
    if (!db) return res.json({ error: '数据库未就绪' });
    const rows = db.prepare(`SELECT module, COUNT(*) as cnt, SUM(CASE WHEN trust_score>=0.7 THEN 1 ELSE 0 END) as hi FROM kb_formal GROUP BY module ORDER BY cnt DESC`).all();
    const total = db.prepare('SELECT COUNT(*) as cnt FROM kb_formal').get().cnt;
    const hits = db.prepare('SELECT COUNT(*) as cnt FROM kb_hit_log').get().cnt;
    res.json({ total, hits, modules: rows.map(r=>({ module:r.module, count:r.cnt, sources:r.hi, hit_rate: total ? Math.min(100, r.cnt*100/total) : 0 })) });
  } catch(e){ res.json({ error: e.message }); }
});

app.get('/api/admin/kb/search', (req, res) => {
  try {
    if (!db) return res.json({ error: '数据库未就绪' });
    const q = '%'+(req.query.q||'')+'%';
    const rows = db.prepare(`SELECT module, title, content, category, trust_score as score FROM kb_formal WHERE title LIKE ? OR content LIKE ? OR keywords LIKE ? LIMIT 50`).all(q, q, q);
    res.json({ results: rows });
  } catch(e){ res.json({ error: e.message }); }
});

app.post('/api/ai/public-chat', async (req, res) => {
  let messages = req.body.messages;
  const model = req.body.model || (AI_PROVIDER === "ollama" ? OLLAMA_MODEL : "auto");
  const baziData = req.body.baziData || null;
  if (!messages || !Array.isArray(messages)) return res.json({ error: "参数错误" });

  // === Ollama 路径无需 API key，直接走 ===
  if (AI_PROVIDER === "ollama") {
    const ip = req.ip || req.connection.remoteAddress;
    if (!sec.rateLimit("ai_public_" + ip, 60, 60000)) return res.status(429).json({ error: "RATE_LIMITED" });
    let sysContent = AI_SYSTEM_PROMPT;
    if (baziData) sysContent += String.fromCharCode(10) + String.fromCharCode(10) + '【用户排盘数据】' + String.fromCharCode(10) + JSON.stringify(baziData, null, 2);
    try {
      const r = await fetch(AI_API_BASE + "/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages: [{ role: "system", content: sysContent }, ...messages], max_tokens: 2048, temperature: 0.7 })
      });
      const data = await r.json();
      if (data.choices) return res.json(data);
      if (data.error) {
        const lastMsg = messages.filter(m => m.role === "user").pop();
        return res.json({ choices: [{ message: { content: await _aiLocalResponse(lastMsg ? lastMsg.content : "", baziData) } }], _local: true, ollama_error: data.error.message });
      }
      return res.json({ choices: [{ message: { content: await _aiLocalResponse("", baziData) } }], _local: true });
    } catch (e) {
      const lastMsg = messages.filter(m => m.role === "user").pop();
      return res.json({ choices: [{ message: { content: await _aiLocalResponse(lastMsg ? lastMsg.content : "", baziData) } }], _local: true, error: e.message });
    }
  }

  // === G2CLAW/ZAI 路径需要 API key ===
  if (!AI_API_KEY) {
    const lastMsg = messages.filter(m => m.role === "user").pop();
    return res.json({ choices: [{ message: { content: await _aiLocalResponse(lastMsg ? lastMsg.content : "", baziData) } }], _local: true });
  }

  const ip = req.ip || req.connection.remoteAddress;
  if (!sec.rateLimit("ai_public_" + ip, 60, 60000)) return res.status(429).json({ error: "RATE_LIMITED" });

  let sysContent = AI_SYSTEM_PROMPT;
    if (baziData) sysContent += String.fromCharCode(10) + String.fromCharCode(10) + '【用户排盘数据】' + String.fromCharCode(10) + JSON.stringify(baziData, null, 2);

  try {
    const url = AI_PROVIDER === "zai" ? AI_API_BASE + "/chat/completions" : AI_API_BASE + "/v1/chat/completions";
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + AI_API_KEY },
      body: JSON.stringify({ model, messages: [{ role: "system", content: sysContent }, ...messages], max_tokens: 2048, temperature: 0.7 })
    });
    const data = await response.json();
    if (data.error) {
      const lastMsg = messages.filter(m => m.role === "user").pop();
      return res.json({ choices: [{ message: { content: await _aiLocalResponse(lastMsg ? lastMsg.content : "", baziData) } }], _local: true, provider_error: data.error.message });
    }
    res.json(data);
  } catch (e) {
    console.error("AI API错误:", e.message);
    const lastMsg = messages.filter(m => m.role === "user").pop();
    res.json({ choices: [{ message: { content: await _aiLocalResponse(lastMsg ? lastMsg.content : "", baziData) } }], _local: true, error: e.message });
  }
});

// 注册/登录（手机号）
app.post('/api/user/login', (req, res) => {
  let phone = sec.sanitizeInput(req.body.phone);
  if (!phone || phone.length < 11) return res.json({ error: '请输入正确的手机号' });
  
  if (!sec.rateLimit('login_' + phone, 5, 60000)) {
    return res.json({ error: '请求过于频繁，请稍后再试' });
  }
  
  const phoneHash = sec.hashPhone(phone);
  let user = db.prepare('SELECT * FROM users WHERE phone_hash = ?').get(phoneHash);
  
  if (!user) {
    db.prepare('INSERT INTO users (phone, phone_hash, follow_date) VALUES (?, ?, ?)')
      .run(sec.encrypt(phone), phoneHash, new Date().toISOString().slice(0,10));
    user = db.prepare('SELECT * FROM users WHERE phone_hash = ?').get(phoneHash);
    db.prepare('INSERT INTO user_points (user_id) VALUES (?)').run(user.id);
    // 分配free角色
    db.prepare('INSERT OR IGNORE INTO user_roles (user_id, role) VALUES (?, ?)').run(user.id, 'free');
  }
  
  // 获取用户角色
  const roles = db.prepare('SELECT role FROM user_roles WHERE user_id = ?').all(user.id).map(r => r.role);
  if (roles.length === 0) roles.push('free');
  
  // VIP等级映射为角色
  if (user.vip_level && rbac.VIP_LEVEL_TO_ROLE[user.vip_level]) {
    if (!roles.includes(rbac.VIP_LEVEL_TO_ROLE[user.vip_level])) {
      roles.push(rbac.VIP_LEVEL_TO_ROLE[user.vip_level]);
    }
  }
  if (user.is_super && !roles.includes('super_admin')) {
    roles.push('super_admin');
  }
  
  // Token有效期缩短为24h（原72h）
  const token = sec.generateToken(user.id, 24, roles);
  
  db.prepare('INSERT INTO audit_logs (user_id, action, detail) VALUES (?, ?, ?)')
    .run(user.id, 'login', '手机号登录');
  
  res.json({
    token: token,
    user: {
      id: user.id,
      name: user.name || '缘主',
      vipLevel: user.vip_level,
      isSuper: !!user.is_super,
      roles: roles,
      phoneMasked: sec.maskPhone(phone)
    }
  });
});

// 更新用户信息
app.post('/api/user/profile', auth, (req, res) => {
  let updates = [];
  let params = [];
  
  if (req.body.name) { updates.push('name = ?'); params.push(sec.sanitizeInput(req.body.name)); }
  if (req.body.sex) { updates.push('sex = ?'); params.push(req.body.sex); }
  if (req.body.birthDate) { updates.push('birth_date = ?'); params.push(sec.encrypt(req.body.birthDate)); }
  if (req.body.birthHour !== undefined) { updates.push('birth_hour = ?'); params.push(req.body.birthHour); }
  if (req.body.birthplace) { updates.push('birthplace = ?'); params.push(sec.sanitizeInput(req.body.birthplace)); }
  if (req.body.residence) { updates.push('residence = ?'); params.push(sec.sanitizeInput(req.body.residence)); }
  if (req.body.occupation) { updates.push('occupation = ?'); params.push(sec.sanitizeInput(req.body.occupation)); }
  if (req.body.faith) { updates.push('faith = ?'); params.push(req.body.faith); }
  
  if (updates.length === 0) return res.json({ error: '无更新内容' });
  
  params.push(req.userId);
  db.prepare('UPDATE users SET ' + updates.join(', ') + ', updated_at = ' + "datetime('now','localtime')" + ' WHERE id = ?').run(...params);
  
  res.json({ ok: true, message: '更新成功' });
});

// 获取用户信息
app.get('/api/user/profile', auth, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  if (!user) return res.json({ error: '用户不存在' });
  
  const roles = db.prepare('SELECT role FROM user_roles WHERE user_id = ?').all(user.id).map(r => r.role);
  
  res.json({
    id: user.id,
    name: user.name,
    sex: user.sex,
    birthDate: user.birth_date ? sec.decrypt(user.birth_date) : null,
    birthHour: user.birth_hour,
    birthplace: user.birthplace,
    residence: user.residence,
    occupation: user.occupation,
    zodiac: user.zodiac,
    dayStem: user.day_stem,
    xiEle: user.xi_ele,
    faith: user.faith,
    vipLevel: user.vip_level,
    isSuper: !!user.is_super,
    roles: roles,
    phoneMasked: user.phone ? (user.phone.startsWith('enc:') ? sec.maskPhone(sec.decrypt(user.phone)) : sec.maskPhone(user.phone)) : null
  });
});

// 超管手机号检查（不再硬编码在前端，通过API验证）
app.post('/api/user/check-super', rbac.auth, (req, res) => {
  const isSuper = (req.userRoles || []).includes('super_admin');
  res.json({ isSuper: isSuper, roles: req.userRoles || ['free'] });
});

// ============================
// 排盘记录接口（自动同步画像）
// ============================
app.post('/api/paipan/save', auth, (req, res) => {
  const type = sec.sanitizeInput(req.body.type || 'unknown');
  const inputData = JSON.stringify(req.body.inputData || {});
  const resultData = JSON.stringify(req.body.resultData || {}).substring(0, 50000);
  const rawQuery = sec.sanitizeInput(req.body.rawQuery || '');
  // 同步尝试从 resultData 抽取的画像信号
  let parsed = {};
  try{ parsed = JSON.parse(resultData); }catch(_){}
  const focusArr = Array.isArray(parsed.focus_areas) ? parsed.focus_areas.slice(0, 8).join(',') : '';
  const kwArr = Array.isArray(parsed.concern_keywords) ? parsed.concern_keywords.slice(0, 12).join(',') : '';

  const r = db.prepare('INSERT INTO paipan_records (user_id, type, input_data, result_data, focus_areas, concern_keywords) VALUES (?, ?, ?, ?, ?, ?)')
    .run(req.userId, type, inputData, resultData, focusArr, kwArr);
  const recordId = r.lastInsertRowid;

  // ★ 触发画像合并（每次排盘都更新）
  const profileResult = yzProfile.mergeProfile(db, req.userId, type, parsed, parsed, rawQuery);

  res.json({ ok: true, message: '排盘记录已保存', recordId, profileUpdated: profileResult.ok !== false, profile: profileResult });
});

app.get('/api/paipan/history', auth, (req, res) => {
  const records = db.prepare('SELECT id, type, input_data, created_at, focus_areas, concern_keywords FROM paipan_records WHERE user_id = ? ORDER BY created_at DESC LIMIT 50').all(req.userId);
  res.json(records);
});

// ============================
// 缘主画像接口
// ============================
// 管理员视角：拉取所有缘主画像概览（用于画像推送大盘 + 推荐回访名单）
app.get('/api/yuanzhu/list', auth, (req, res) => {
  // 仅管理员可访问（依赖 JWT roles 数组，避免硬编码超管手机号）
  if(!req.user||!(req.user.roles||[]).includes('admin')&&req.user.role!=='admin'){
    return res.status(403).json({ok:false,message:'仅管理员可访问'});
  }
  const q = String(req.query.q||'').trim();
  const sortBy = String(req.query.sort||'last_paipan_at').replace(/[^a-z_]/gi,'');
  const limit = Math.min(parseInt(req.query.limit)||50, 200);
  let sql = `SELECT user_id, display_name, day_master, xi_ele, ji_ele, lack_wuxing, zodiac,
                    focus_areas, concern_keywords, mod_stats,
                    paipan_count, push_year, push_priority, push_opt_in,
                    first_paipan_at, last_paipan_at, created_at, updated_at
             FROM yuanzhu_profile`;
  const args = [];
  if(q){
    sql += ` WHERE display_name LIKE ? OR zodiac LIKE ? OR day_master LIKE ?`;
    args.push('%'+q+'%','%'+q+'%','%'+q+'%');
  }
  sql += ` ORDER BY ${sortBy} DESC NULLS LAST LIMIT ?`;
  args.push(limit);
  const rows = db.prepare(sql).all(...args);
  const out = rows.map(r=>{
    let focus=[],kw=[],stats={};
    try{focus=JSON.parse(r.focus_areas||'[]');}catch(_){}
    try{kw=JSON.parse(r.concern_keywords||'[]');}catch(_){}
    try{stats=JSON.parse(r.mod_stats||'{}');}catch(_){}
    return {
      user_id:r.user_id, display_name:r.display_name,
      day_master:r.day_master, xi_ele:r.xi_ele, ji_ele:r.ji_ele,
      lack_wuxing:r.lack_wuxing, zodiac:r.zodiac,
      focus_areas:focus, concern_keywords:kw, mod_stats:stats,
      paipan_count:r.paipan_count, push_year:r.push_year,
      push_priority:r.push_priority, push_opt_in:r.push_opt_in===1,
      first_paipan_at:r.first_paipan_at, last_paipan_at:r.last_paipan_at,
      updated_at:r.updated_at
    };
  });
  res.json({ok:true, total:out.length, items:out});
});

app.get('/api/yuanzhu/profile', auth, (req, res) => {
  const p = db.prepare('SELECT * FROM yuanzhu_profile WHERE user_id=?').get(req.userId);
  if(!p){
    return res.json({ ok:false, empty:true, message:'尚未形成画像，请先进行一次排盘' });
  }
  let focus=[], kw=[], modStats={};
  try{ focus = JSON.parse(p.focus_areas||'[]'); }catch(_){}
  try{ kw = JSON.parse(p.concern_keywords||'[]'); }catch(_){}
  try{ modStats = JSON.parse(p.mod_stats||'{}'); }catch(_){}
  // 仅返回公开字段（勿包含敏感推测）
  res.json({
    ok:true,
    profile:{
      user_id: p.user_id,
      day_master: p.day_master,
      xi_ele: p.xi_ele,
      ji_ele: p.ji_ele,
      lack_wuxing: p.lack_wuxing,
      zodiac: p.zodiac,
      focus_areas: focus,
      concern_keywords: kw,
      mod_stats: modStats,
      paipan_count: p.paipan_count,
      first_paipan_at: p.first_paipan_at,
      last_paipan_at: p.last_paipan_at,
      push_priority: p.push_priority,
      push_year: p.push_year,
      push_opt_in: p.push_opt_in === 1
    }
  });
});

// 更新推送偏好
app.post('/api/yuanzhu/preference', auth, (req, res) => {
  const opt = req.body.opt_in === false ? 0 : 1;
  db.prepare('UPDATE yuanzhu_profile SET push_opt_in=?, updated_at=datetime(\'now\',\'localtime\') WHERE user_id=?').run(opt, req.userId);
  res.json({ ok:true, opt_in: opt===1 });
});

// 预览年度推送（不推送，仅生成草稿；已推过则返回历史版）
app.get('/api/yuanzhu/preview-push', auth, (req, res) => {
  const year = parseInt(req.query.year) || new Date().getFullYear();
  const p = db.prepare('SELECT * FROM yuanzhu_profile WHERE user_id=?').get(req.userId);
  if(!p) return res.json({ ok:false, empty:true, message:'画像未生成，请先完成至少一次排盘' });
  const existed = yzProfile.hasPushed(db, req.userId, year);
  if(existed){
    return res.json({ ok:true, year, content: existed.content, sent_at: existed.sent_at, status: existed.status, alreadySent: true });
  }
  // 生成草稿（不入库）
  const draft = yzProfile.generateYearlyPush(p, year);
  res.json({ ok:true, year, content: draft, sent_at: null, status: 'draft', alreadySent: false });
});

// 确认发送（入库 + 防重）
app.post('/api/yuanzhu/send-push', auth, (req, res) => {
  const year = parseInt(req.body.year || req.query.year) || new Date().getFullYear();
  const p = db.prepare('SELECT * FROM yuanzhu_profile WHERE user_id=?').get(req.userId);
  if(!p) return res.json({ ok:false, message:'画像未生成' });

  if(p.push_opt_in===0) return res.json({ ok:false, message:'您已关闭推送' });
  const content = yzProfile.generateYearlyPush(p, year);
  const snapshot = JSON.stringify({
    day_master:p.day_master, xi_ele:p.xi_ele, lack:p.lack_wuxing, zodiac:p.zodiac,
    focus_areas:p.focus_areas, concern_keywords:p.concern_keywords, mod_stats:p.mod_stats, paipan_count:p.paipan_count
  });
  const r = yzProfile.savePush(db, req.userId, year, content, snapshot);
  if(!r.ok) return res.status(500).json({ ok:false, message: r.error });
  // 更新用户画像 push_year
  db.prepare('UPDATE yuanzhu_profile SET push_year=?, updated_at=datetime(\'now\',\'localtime\') WHERE user_id=?').run(year, req.userId);
  res.json({ ok:true, year, content, updated: r.updated, id: r.id });
});

// ============== R43-F 智能眼镜 HTTP Bridge ==============
// 设备端基地址 (GLASS_BASE_URL, 默认: http://127.0.0.1:8787)
const GLASS_BASE_URL = process.env.GLASS_BASE_URL || 'http://127.0.0.1:8787';
async function glassProxy(path, opts = {}) {
  try {
    const r = await fetch(GLASS_BASE_URL + path, {
      method: opts.method || 'GET',
      headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      signal: AbortSignal.timeout(5000)
    });
    if (!r.ok) return { error: 'GLASS_UPSTREAM_' + r.status, status: r.status };
    return await r.json();
  } catch (e) {
    return { error: 'GLASS_OFFLINE', message: '智能眼镜未连接（' + (e.message || 'timeout') + '）' };
  }
}
// 1. 设备状态
app.get('/api/glass/status', async (req, res) => {
  const data = await glassProxy('/status');
  res.json(data);
});
// 2. 实时心率/体温/步数
app.get('/api/glass/vitals', async (req, res) => {
  const data = await glassProxy('/vitals');
  res.json(data);
});
// 3. 语音指令（推送到眼镜 TTS）
app.post('/api/glass/speak', async (req, res) => {
  const { text, urgency = 'normal' } = req.body || {};
  if (!text) return res.json({ error: '参数错误' });
  const data = await glassProxy('/speak', { method: 'POST', body: { text, urgency } });
  res.json(data);
});
// 4. 看相/识人
app.post('/api/glass/face-scan', async (req, res) => {
  const data = await glassProxy('/face-scan', { method: 'POST', body: req.body || {} });
  res.json(data);
});
// 5. 流年推送（命主→眼镜）
app.post('/api/glass/yearly-push', async (req, res) => {
  const { userId, year, summary } = req.body || {};
  if (!userId || !year) return res.json({ error: '参数错误' });
  const data = await glassProxy('/yearly-push', { method: 'POST', body: { userId, year, summary } });
  res.json(data);
});
// 6. 离线模式（断网 fallback）
app.get('/api/glass/capabilities', async (req, res) => {
  res.json({
    online: false,
    baseUrl: GLASS_BASE_URL,
    features: ['vitals', 'speak', 'face-scan', 'yearly-push', 'offline-kb'],
    fallback: 'kb-first 离线模式已就绪',
    note: '启动眼镜 HTTP bridge 后访问 /status 验证设备在线'
  });
});
console.log('[init] R43-F 智能眼镜 HTTP bridge 已挂载 (base=' + GLASS_BASE_URL + ')');

// === 缺失端点：推送系统补全（admin 全员/单用户，用户收件箱，admin 大盘统计） ===

function _autoPushRanThisYear(year){
  const r = db.prepare(`SELECT id FROM push_logs WHERE push_type='auto_yearly' AND push_date=? AND status='sent' LIMIT 1`).get(String(year));
  return !!r;
}

// 1. admin 全员推送（按年度，未订阅则跳过）
app.post('/api/admin/yuanzhu/push-yearly', adminAuth, (req, res) => {
  const year = parseInt(req.body.year || new Date().getFullYear());
  const dryRun = req.body.dryRun === true;
  const profiles = db.prepare(`SELECT * FROM yuanzhu_profile WHERE push_opt_in=1 AND paipan_count>=1`).all();
  const result = { total: profiles.length, sent: 0, skipped: 0, errors: 0, items: [] };
  for (const p of profiles) {
    try {
      if (yzProfile.hasPushed(db, p.user_id, year)) {
        result.skipped++;
        result.items.push({ user_id: p.user_id, status: 'already_pushed' });
        continue;
      }
      const content = yzProfile.generateYearlyPush(p, year);
      const snapshot = JSON.stringify({
        day_master:p.day_master, xi_ele:p.xi_ele, lack:p.lack_wuxing, zodiac:p.zodiac,
        focus_areas:p.focus_areas, concern_keywords:p.concern_keywords, mod_stats:p.mod_stats, paipan_count:p.paipan_count
      });
      if (!dryRun) {
        const r = yzProfile.savePush(db, p.user_id, year, content, snapshot);
        if (r.ok) {
          db.prepare(`UPDATE yuanzhu_profile SET push_year=?, updated_at=datetime('now','localtime') WHERE user_id=?`).run(year, p.user_id);
          db.prepare(`INSERT INTO push_logs (user_id, push_type, push_date, status) VALUES (?, 'admin_yearly', ?, 'sent')`).run(p.user_id, String(year));
          result.sent++;
          result.items.push({ user_id: p.user_id, status: 'sent', id: r.id });
        } else {
          result.errors++;
          result.items.push({ user_id: p.user_id, status: 'error', error: r.error });
        }
      } else {
        result.items.push({ user_id: p.user_id, status: 'dryrun_preview', preview: content.substring(0, 80) });
      }
    } catch(e) {
      result.errors++;
      result.items.push({ user_id: p.user_id, status: 'exception', error: e.message });
    }
  }
  res.json({ ok:true, year, dryRun, ...result });
});

// 2. admin 单用户推送
app.post('/api/admin/yuanzhu/:userId/push-yearly', adminAuth, (req, res) => {
  const userId = parseInt(req.params.userId);
  const year = parseInt(req.body.year || new Date().getFullYear());
  const p = db.prepare(`SELECT * FROM yuanzhu_profile WHERE user_id=?`).get(userId);
  if(!p) return res.status(404).json({ ok:false, message:'画像不存在' });
  if (yzProfile.hasPushed(db, userId, year)) {
    return res.json({ ok:false, message:year + '年已推送过', already_pushed: true });
  }
  const content = yzProfile.generateYearlyPush(p, year);
  const snapshot = JSON.stringify({
    day_master:p.day_master, xi_ele:p.xi_ele, lack:p.lack_wuxing, zodiac:p.zodiac,
    focus_areas:p.focus_areas, concern_keywords:p.concern_keywords, mod_stats:p.mod_stats, paipan_count:p.paipan_count
  });
  const r = yzProfile.savePush(db, userId, year, content, snapshot);
  if(!r.ok) return res.status(500).json({ ok:false, message: r.error });
  db.prepare(`UPDATE yuanzhu_profile SET push_year=?, updated_at=datetime('now','localtime') WHERE user_id=?`).run(year, userId);
  db.prepare(`INSERT INTO push_logs (user_id, push_type, push_date, status) VALUES (?, 'admin_yearly_single', ?, 'sent')`).run(userId, String(year));
  res.json({ ok:true, year, user_id: userId, content, id: r.id });
});

// 3. 用户收件箱（自动标记已读）
app.get('/api/yuanzhu/yearly-pushes', auth, (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const rows = db.prepare(`
    SELECT id, push_year, push_type, content, profile_snapshot, sent_at, read_at, created_at
    FROM yuanzhu_yearly_push
    WHERE user_id=?
    ORDER BY push_year DESC, created_at DESC
    LIMIT ?
  `).all(req.userId, limit);
  db.prepare(`UPDATE yuanzhu_yearly_push SET read_at=datetime('now','localtime') WHERE user_id=? AND read_at IS NULL`).run(req.userId);
  res.json({ ok:true, items: rows.map(r => ({
    id: r.id, year: r.push_year, type: r.push_type, content: r.content,
    sent_at: r.sent_at, read_at: r.read_at, created_at: r.created_at, is_read: !!r.read_at
  })) });
});

// 4. admin 推送大盘统计
app.get('/api/admin/yuanzhu/push-stats', adminAuth, (req, res) => {
  const currentYear = new Date().getFullYear();
  const totalProfiles = db.prepare(`SELECT COUNT(*) AS c FROM yuanzhu_profile WHERE paipan_count>=1`).get().c;
  const optIn = db.prepare(`SELECT COUNT(*) AS c FROM yuanzhu_profile WHERE push_opt_in=1`).get().c;
  const pushedThisYear = db.prepare(`SELECT COUNT(DISTINCT user_id) AS c FROM yuanzhu_yearly_push WHERE push_year=?`).get(currentYear).c;
  const totalPushes = db.prepare(`SELECT COUNT(*) AS c FROM yuanzhu_yearly_push`).get().c;
  const byYear = db.prepare(`SELECT push_year, COUNT(*) AS c FROM yuanzhu_yearly_push GROUP BY push_year ORDER BY push_year DESC LIMIT 10`).all();
  const unreadByUser = db.prepare(`
    SELECT user_id, COUNT(*) AS unread FROM yuanzhu_yearly_push WHERE read_at IS NULL GROUP BY user_id ORDER BY unread DESC LIMIT 10
  `).all();
  res.json({ ok:true, currentYear, stats: {
    totalProfiles, optIn, pushedThisYear, totalPushes,
    coverage: totalProfiles ? Math.round(pushedThisYear / totalProfiles * 100) : 0,
    byYear, unreadByUser
  } });
});

// 5. cron 触发器（手动调用，adminAuth 保护；launchd 可拉这个端点做定时）
app.post('/api/admin/cron/yearly-push', adminAuth, (req, res) => {
  const year = parseInt(req.body.year || new Date().getFullYear());
  if (_autoPushRanThisYear(year)) {
    return res.json({ ok:false, message:year + '年自动推送已执行过，跳过', skip: true });
  }
  const profiles = db.prepare(`SELECT * FROM yuanzhu_profile WHERE push_opt_in=1 AND paipan_count>=1`).all();
  let sent = 0, errors = 0;
  for (const p of profiles) {
    try {
      if (yzProfile.hasPushed(db, p.user_id, year)) continue;
      const content = yzProfile.generateYearlyPush(p, year);
      const snapshot = JSON.stringify({
        day_master:p.day_master, xi_ele:p.xi_ele, lack:p.lack_wuxing, zodiac:p.zodiac,
        focus_areas:p.focus_areas, concern_keywords:p.concern_keywords, mod_stats:p.mod_stats, paipan_count:p.paipan_count
      });
      const r = yzProfile.savePush(db, p.user_id, year, content, snapshot);
      if (r.ok) {
        db.prepare(`UPDATE yuanzhu_profile SET push_year=?, updated_at=datetime('now','localtime') WHERE user_id=?`).run(year, p.user_id);
        sent++;
      } else { errors++; }
    } catch(_) { errors++; }
  }
  db.prepare(`INSERT INTO push_logs (user_id, push_type, push_date, status) VALUES (0, 'auto_yearly', ?, 'sent')`).run(String(year));
  res.json({ ok:true, year, sent, errors, total: profiles.length });
});


// ============================
// 商城接口
// ============================
app.get('/api/shop/products', (req, res) => {
  res.json({ message: '商品数据由前端shop-data.js提供' });
});

app.post('/api/order/create', auth, (req, res) => {
  const productId = sec.sanitizeInput(req.body.productId);
  const productName = sec.sanitizeInput(req.body.productName);
  const amount = parseFloat(req.body.amount) || 0;
  const merchantId = parseInt(req.body.merchantId) || 0;
  
  const config = db.prepare('SELECT value FROM system_config WHERE key = ?').get('platform_split');
  const platformSplit = config ? parseFloat(config.value) : 0.2;
  
  db.prepare('INSERT INTO orders (user_id, merchant_id, product_id, product_name, amount, merchant_amount, platform_amount, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(req.userId, merchantId, productId, productName, amount, amount * (1-platformSplit), amount * platformSplit, 'pending');
  
  res.json({ ok: true, message: '订单已创建，客服将联系您确认' });
});

// ============================
// 反馈接口
// ============================
app.post('/api/feedback/submit', auth, (req, res) => {
  const type = sec.sanitizeInput(req.body.type);
  const target = sec.sanitizeInput(req.body.target);
  const content = sec.sanitizeXSS(sec.sanitizeInput(req.body.content));
  
  const pointsMap = { like: 1, dislike: 3, suggestion: 5, correction: 10 };
  const points = pointsMap[type] || 1;
  
  db.prepare('INSERT INTO feedback (user_id, type, target, content, points_awarded) VALUES (?, ?, ?, ?, ?)')
    .run(req.userId, type, target, content, points);
  
  db.prepare('INSERT OR IGNORE INTO user_points (user_id) VALUES (?)').run(req.userId);
  db.prepare('UPDATE user_points SET total_points = total_points + ?, last_feedback_date = ? WHERE user_id = ?')
    .run(points, new Date().toISOString().slice(0,10), req.userId);
  
  const pointsData = db.prepare('SELECT * FROM user_points WHERE user_id = ?').get(req.userId);
  if (pointsData) {
    const lastDate = pointsData.last_feedback_date;
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0,10);
    const today = new Date().toISOString().slice(0,10);
    if (lastDate === yesterday) {
      db.prepare('UPDATE user_points SET streak_days = streak_days + 1 WHERE user_id = ?').run(req.userId);
    } else if (lastDate !== today) {
      db.prepare('UPDATE user_points SET streak_days = 1 WHERE user_id = ?').run(req.userId);
    }
    
    const streak = pointsData.streak_days + 1;
    if (streak === 7) {
      db.prepare('UPDATE user_points SET total_points = total_points + 20 WHERE user_id = ?').run(req.userId);
    } else if (streak === 30) {
      db.prepare('UPDATE user_points SET total_points = total_points + 100 WHERE user_id = ?').run(req.userId);
    }
  }
  
  res.json({ ok: true, points: points, message: '反馈成功，获得' + points + '积分' });
});

app.get('/api/feedback/points', auth, (req, res) => {
  const data = db.prepare('SELECT * FROM user_points WHERE user_id = ?').get(req.userId);
  res.json({
    totalPoints: data ? data.total_points : 0,
    streakDays: data ? data.streak_days : 0,
    exchangedPoints: data ? data.exchanged_points : 0
  });
});

// ============================
// 商家接口（P0修复：添加认证）
// ============================

// 商家入驻申请（添加速率限制，无需登录但有限流）
app.post('/api/merchant/apply', (req, res) => {
  const ip = req.ip || req.connection.remoteAddress;
  if (!sec.rateLimit('merchant_apply_' + ip, 3, 3600000)) {
    return res.status(429).json({ error: 'RATE_LIMITED', message: '申请过于频繁，请1小时后再试' });
  }
  
  const name = sec.sanitizeInput(req.body.name);
  const school = sec.sanitizeInput(req.body.school);
  const phone = sec.sanitizeInput(req.body.phone);
  const boss = sec.sanitizeInput(req.body.boss);
  const master = sec.sanitizeInput(req.body.master);
  const license = sec.sanitizeInput(req.body.license);
  const cert = sec.sanitizeInput(req.body.cert);
  const splitRate = parseFloat(req.body.splitRate) || 0.8;
  
  if (!name || !phone) return res.json({ error: '请填写商家名称和联系电话' });
  
  // 手机号加密存储
  const encryptedPhone = sec.encrypt(phone);
  
  db.prepare('INSERT INTO merchants (name, school, type, boss, phone, master, license, cert, split_rate, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(name, school || '', req.body.type || '寺庙', boss || '', encryptedPhone, master || '', license || '', cert || '', splitRate, 'pending');
  
  res.json({ ok: true, message: '申请已提交，请等待审核' });
});

app.get('/api/merchant/list', adminAuth, (req, res) => {
  const merchants = db.prepare('SELECT id, name, school, type, boss, master, license, cert, split_rate, status, created_at FROM merchants ORDER BY created_at DESC').all();
  res.json(merchants);
});

app.post('/api/merchant/approve', adminAuth, (req, res) => {
  const id = parseInt(req.body.id);
  const status = req.body.status;
  db.prepare('UPDATE merchants SET status = ? WHERE id = ?').run(status, id);
  res.json({ ok: true, message: status === 'approved' ? '已通过' : '已拒绝' });
});

// ============================
// 课程接口
// ============================
app.get('/api/courses', (req, res) => {
  const master = req.query.master;
  let courses;
  if (master) {
    courses = db.prepare('SELECT * FROM courses WHERE master = ? ORDER BY sort_order, created_at DESC').all(master);
  } else {
    courses = db.prepare('SELECT * FROM courses ORDER BY sort_order, created_at DESC').all();
  }
  res.json(courses);
});

app.post('/api/courses/add', adminAuth, (req, res) => {
  const master = sec.sanitizeInput(req.body.master);
  const title = sec.sanitizeInput(req.body.title);
  const type = sec.sanitizeInput(req.body.type);
  const url = sec.sanitizeInput(req.body.url);
  const duration = sec.sanitizeInput(req.body.duration);
  const category = sec.sanitizeInput(req.body.category);
  const summary = sec.sanitizeInput(req.body.summary);
  const keyPoints = JSON.stringify(req.body.keyPoints || []);
  
  db.prepare('INSERT INTO courses (master, title, type, url, duration, category, summary, key_points) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(master, title, type, url, duration, category, summary, keyPoints);
  
  res.json({ ok: true, message: '课程已添加' });
});

// ============================
// 推送日志接口（P0修复：添加认证）
// ============================
app.post('/api/push/log', auth, (req, res) => {
  const userId = req.userId; // 使用Token中的userId，不信任客户端传入
  const pushType = sec.sanitizeInput(req.body.pushType);
  const content = sec.sanitizeInput(req.body.content).substring(0, 5000);
  
  db.prepare('INSERT INTO push_logs (user_id, push_type, push_date, content, delivered) VALUES (?, ?, ?, ?, 1)')
    .run(userId, pushType, new Date().toISOString().slice(0,10), content);
  
  res.json({ ok: true });
});

// ============================
// 系统配置接口（超管）
// ============================
app.get('/api/admin/config', adminAuth, (req, res) => {
  const configs = db.prepare('SELECT * FROM system_config').all();
  res.json(configs);
});

app.post('/api/admin/config', adminAuth, (req, res) => {
  const key = sec.sanitizeInput(req.body.key);
  const value = sec.sanitizeInput(req.body.value);
  db.prepare('INSERT OR REPLACE INTO system_config (key, value, updated_at) VALUES (?, ?, ' + "datetime('now','localtime')" + ')').run(key, value);
  res.json({ ok: true });
});

// 统计数据
app.get('/api/admin/stats', adminAuth, (req, res) => {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const orderCount = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
  const feedbackCount = db.prepare('SELECT COUNT(*) as count FROM feedback').get().count;
  const merchantCount = db.prepare('SELECT COUNT(*) as count FROM merchants').get().count;
  const pushCount = db.prepare('SELECT COUNT(*) as count FROM push_logs').get().count;
  const caseCount = db.prepare('SELECT COUNT(*) as count FROM master_cases').get().count;
  
  res.json({
    users: userCount,
    orders: orderCount,
    feedback: feedbackCount,
    merchants: merchantCount,
    pushes: pushCount,
    masterCases: caseCount
  });
});

// ============================
// RBAC 角色管理接口（管理员）
// ============================

// 分配角色
app.post('/api/admin/assign-role', adminAuth, (req, res) => {
  const userId = parseInt(req.body.userId);
  const role = sec.sanitizeInput(req.body.role);
  
  if (!Object.values(rbac.ROLES).includes(role)) {
    return res.json({ error: '无效角色' });
  }
  
  db.prepare('INSERT OR IGNORE INTO user_roles (user_id, role, assigned_by) VALUES (?, ?, ?)')
    .run(userId, role, req.userId);
  
  db.prepare('INSERT INTO audit_logs (user_id, action, detail) VALUES (?, ?, ?)')
    .run(req.userId, 'assign_role', `给用户${userId}分配角色${role}`);
  
  res.json({ ok: true, message: '角色已分配' });
});

// 移除角色
app.post('/api/admin/remove-role', adminAuth, (req, res) => {
  const userId = parseInt(req.body.userId);
  const role = sec.sanitizeInput(req.body.role);
  
  if (role === 'super_admin') {
    return res.json({ error: '不能移除超级管理员角色' });
  }
  
  db.prepare('DELETE FROM user_roles WHERE user_id = ? AND role = ?').run(userId, role);
  
  db.prepare('INSERT INTO audit_logs (user_id, action, detail) VALUES (?, ?, ?)')
    .run(req.userId, 'remove_role', `移除用户${userId}的角色${role}`);
  
  res.json({ ok: true, message: '角色已移除' });
});

// ============================
// 平台B · 周易中医诊疗接口
// ============================

// 病患提交症状
app.post('/api/clinic/submit-symptom', requirePermission('clinic:submit_symptom'), (req, res) => {
  const symptoms = sec.sanitizeXSS(sec.sanitizeInput(req.body.symptoms));
  const constitution = sec.sanitizeInput(req.body.constitution);
  
  if (!symptoms) return res.json({ error: '请描述症状' });
  
  const result = db.prepare('INSERT INTO medical_cases (patient_id, symptoms, constitution, status) VALUES (?, ?, ?, ?)')
    .run(req.userId, symptoms, constitution, 'pending_master');
  
  db.prepare('INSERT INTO case_review_logs (case_id, action, actor_id, actor_role, detail) VALUES (?, ?, ?, ?, ?)')
    .run(result.lastInsertRowid, 'created', req.userId, 'patient', '病患提交症状');
  
  res.json({ ok: true, caseId: result.lastInsertRowid, message: '症状已提交，将分配给大师分析' });
});

// 大师查看分配的病例
app.get('/api/clinic/assigned-cases', requirePermission('clinic:view_assigned_case'), (req, res) => {
  const role = req.userRoles.find(r => ['master', 'doctor', 'admin_b', 'super_admin'].includes(r));
  let cases;
  
  if (role === 'master' || role === 'super_admin') {
    // 大师查看待处理和已处理的
    cases = db.prepare(`
      SELECT mc.*, u.name as patient_name, u.sex as patient_sex
      FROM medical_cases mc
      LEFT JOIN users u ON mc.patient_id = u.id
      WHERE mc.assigned_master_id = ? OR mc.status = 'pending_master'
      ORDER BY mc.created_at DESC
    `).all(req.userId);
  } else if (role === 'doctor') {
    cases = db.prepare(`
      SELECT mc.*, u.name as patient_name, u.sex as patient_sex
      FROM medical_cases mc
      LEFT JOIN users u ON mc.patient_id = u.id
      WHERE mc.assigned_doctor_id = ? OR mc.status = 'pending_doctor'
      ORDER BY mc.created_at DESC
    `).all(req.userId);
  } else {
    cases = db.prepare(`
      SELECT mc.*, u.name as patient_name, u.sex as patient_sex
      FROM medical_cases mc
      LEFT JOIN users u ON mc.patient_id = u.id
      ORDER BY mc.created_at DESC
    `).all();
  }
  
  // 字段级脱敏
  cases.forEach(c => {
    if (role === 'master') {
      // 大师可以看到八字相关信息，但病患姓名脱敏
      if (c.patient_name && c.patient_name.length > 1) {
        c.patient_name = c.patient_name[0] + (c.patient_sex === '男' ? '先生' : '女士');
      }
    }
  });
  
  res.json(cases);
});

// 大师提交周易分析
app.post('/api/clinic/submit-analysis', requirePermission('clinic:submit_analysis'), (req, res) => {
  const caseId = parseInt(req.body.caseId);
  const analysis = sec.sanitizeInput(req.body.analysis || '');
  const baziChart = req.body.baziChart ? sec.encrypt(JSON.stringify(req.body.baziChart)) : null;
  const wuxingSummary = sec.sanitizeInput(req.body.wuxingSummary || '');
  
  // 检查病例归属
  const medicalCase = db.prepare('SELECT * FROM medical_cases WHERE id = ?').get(caseId);
  if (!medicalCase) return res.json({ error: '病例不存在' });
  
  // 生成医学化翻译（过滤周易术语）
  const filteredSummary = rbac.filterZhouyiTerms(analysis);
  
  // 创建大师案例
  const caseUuid = crypto.randomUUID();
  const result = db.prepare(`
    INSERT INTO master_cases 
    (case_uuid, master_id, patient_id, bazi_chart, wuxing_summary, symptoms, 
     constitution, master_analysis, analysis_summary, medical_translation, status, submitted_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted', datetime('now','localtime'))
  `).run(caseUuid, req.userId, medicalCase.patient_id, baziChart, wuxingSummary,
         medicalCase.symptoms, medicalCase.constitution, sec.encrypt(analysis), filteredSummary, filteredSummary);
  
  // 更新病例状态
  db.prepare('UPDATE medical_cases SET status = ?, assigned_master_id = ?, master_case_id = ?, updated_at = ' + "datetime('now','localtime')" + ' WHERE id = ?')
    .run('pending_doctor', req.userId, result.lastInsertRowid, caseId);
  
  // 记录版本
  db.prepare('INSERT INTO master_case_versions (case_id, version_type, version_number, content, content_hash, created_by) VALUES (?, ?, ?, ?, ?, ?)')
    .run(result.lastInsertRowid, 'master_analysis', 1, sec.encrypt(analysis), 
          crypto.createHash('sha256').update(analysis).digest('hex'), req.userId);
  
  db.prepare('INSERT INTO case_review_logs (case_id, action, actor_id, actor_role, detail) VALUES (?, ?, ?, ?, ?)')
    .run(result.lastInsertRowid, 'analysis_submitted', req.userId, 'master', '大师提交周易分析');
  
  res.json({ ok: true, caseId: result.lastInsertRowid, message: '分析已提交，等待医生审核' });
});

// 医生提交诊疗方案
app.post('/api/clinic/submit-diagnosis', requirePermission('clinic:submit_diagnosis'), (req, res) => {
  const caseId = parseInt(req.body.caseId);
  const diagnosis = sec.sanitizeXSS(sec.sanitizeInput(req.body.diagnosis));
  const prescription = sec.sanitizeXSS(sec.sanitizeInput(req.body.prescription));
  const reviewComment = sec.sanitizeInput(req.body.reviewComment || '');
  
  // caseId可能是medical_cases.id或master_cases.id，统一查找
  let masterCase = db.prepare('SELECT * FROM master_cases WHERE id = ?').get(caseId);
  let medicalCase = null;
  if (!masterCase) {
    // 尝试作为medical_cases.id查找
    medicalCase = db.prepare('SELECT * FROM medical_cases WHERE id = ?').get(caseId);
    if (medicalCase && medicalCase.master_case_id) {
      masterCase = db.prepare('SELECT * FROM master_cases WHERE id = ?').get(medicalCase.master_case_id);
    }
  } else {
    medicalCase = db.prepare('SELECT * FROM medical_cases WHERE master_case_id = ?').get(caseId);
  }
  if (!masterCase) return res.json({ error: '案例不存在' });
  
  const finalPlan = JSON.stringify({ diagnosis, prescription });
  const mcId = masterCase.id;
  
  db.prepare(`
    UPDATE master_cases SET 
    doctor_diagnosis = ?, review_status = 'approved', review_comment = ?, 
    reviewer_id = ?, reviewed_at = datetime('now','localtime'),
    final_plan = ?, status = 'completed', completed_at = datetime('now','localtime')
    WHERE id = ?
  `).run(sec.encrypt(diagnosis), reviewComment, req.userId, sec.encrypt(finalPlan), mcId);
  
  // 记录版本
  db.prepare('INSERT INTO master_case_versions (case_id, version_type, version_number, content, content_hash, created_by) VALUES (?, ?, ?, ?, ?, ?)')
    .run(mcId, 'doctor_diagnosis', 1, sec.encrypt(finalPlan),
          crypto.createHash('sha256').update(finalPlan).digest('hex'), req.userId);
  
  // 更新病例状态
  if (masterCase.patient_id) {
    const mc = medicalCase || db.prepare('SELECT id FROM medical_cases WHERE master_case_id = ?').get(mcId);
    if (mc) {
      db.prepare('UPDATE medical_cases SET status = ?, assigned_doctor_id = ?, updated_at = ' + "datetime('now','localtime')" + ' WHERE id = ?')
        .run('completed', req.userId, mc.id);
    }
  }
  
  db.prepare('INSERT INTO case_review_logs (case_id, action, actor_id, actor_role, detail) VALUES (?, ?, ?, ?, ?)')
    .run(mcId, 'diagnosis_submitted', req.userId, 'doctor', '医生提交诊疗方案');
  
  res.json({ ok: true, message: '诊疗方案已提交' });
});

// 推送养生报告给病患
app.post('/api/clinic/push-report', requirePermission('clinic:push_report'), (req, res) => {
  const caseId = parseInt(req.body.caseId);
  const reportText = sec.sanitizeXSS(sec.sanitizeInput(req.body.reportText));
  
  // caseId可能是medical_cases.id或master_cases.id
  let masterCase = db.prepare('SELECT * FROM master_cases WHERE id = ?').get(caseId);
  if (!masterCase) {
    const mc = db.prepare('SELECT * FROM medical_cases WHERE id = ?').get(caseId);
    if (mc && mc.master_case_id) {
      masterCase = db.prepare('SELECT * FROM master_cases WHERE id = ?').get(mc.master_case_id);
    }
  }
  if (!masterCase) return res.json({ error: '案例不存在' });
  if (!masterCase.patient_id) return res.json({ error: '无关联病患' });
  
  // 过滤周易术语（双重保险）
  const filteredText = rbac.filterZhouyiTerms(reportText);
  
  const result = db.prepare('INSERT INTO tcm_reports (case_id, patient_id, doctor_id, report_text, filtered_text) VALUES (?, ?, ?, ?, ?)')
    .run(masterCase.id, masterCase.patient_id, req.userId, sec.encrypt(reportText), filteredText);
  
  db.prepare('INSERT INTO case_review_logs (case_id, action, actor_id, actor_role, detail) VALUES (?, ?, ?, ?, ?)')
    .run(caseId, 'report_pushed', req.userId, req.userRoles.find(r => r === 'doctor' || r === 'admin_b'), '推送养生报告');
  
  res.json({ ok: true, reportId: result.lastInsertRowid, message: '报告已推送给病患' });
});

// 病患查看自己的报告
app.get('/api/clinic/my-reports', requirePermission('clinic:view_own_report'), (req, res) => {
  const reports = db.prepare(`
    SELECT id, case_id, filtered_text as report_text, pushed_at, read_at
    FROM tcm_reports 
    WHERE patient_id = ? 
    ORDER BY pushed_at DESC
  `).all(req.userId);
  
  // 标记已读
  if (reports.length > 0) {
    db.prepare('UPDATE tcm_reports SET read_at = ' + "datetime('now','localtime')" + ' WHERE patient_id = ? AND read_at IS NULL').run(req.userId);
  }
  
  res.json(reports);
});

// 协作讨论
app.post('/api/clinic/discuss', requirePermission('clinic:collaborate'), (req, res) => {
  const caseId = parseInt(req.body.caseId);
  const content = sec.sanitizeXSS(sec.sanitizeInput(req.body.content));
  const authorRole = req.userRoles.find(r => ['master', 'doctor', 'admin_b', 'super_admin'].includes(r));
  
  if (!content) return res.json({ error: '请输入讨论内容' });
  
  db.prepare('INSERT INTO case_discussions (case_id, author_id, author_role, content) VALUES (?, ?, ?, ?)')
    .run(caseId, req.userId, authorRole, content);
  
  res.json({ ok: true, message: '讨论已发送' });
});

app.get('/api/clinic/discussions/:caseId', requirePermission('clinic:collaborate'), (req, res) => {
  const caseId = parseInt(req.params.caseId);
  const discussions = db.prepare(`
    SELECT cd.*, u.name as author_name
    FROM case_discussions cd
    LEFT JOIN users u ON cd.author_id = u.id
    WHERE cd.case_id = ?
    ORDER BY cd.created_at ASC
  `).all(caseId);
  
  res.json(discussions);
});

// 查看大师案例详情（角色限制）
app.get('/api/clinic/case/:id', requirePermission('clinic:view_assigned_case'), (req, res) => {
  const caseId = parseInt(req.params.id);
  const masterCase = db.prepare('SELECT * FROM master_cases WHERE id = ?').get(caseId);
  if (!masterCase) return res.json({ error: '案例不存在' });
  
  const response = { id: masterCase.id, status: masterCase.status, created_at: masterCase.created_at };
  
  // 字段级权限控制
  if (req.userRoles.includes('master') || req.userRoles.includes('super_admin')) {
    response.bazi_chart = masterCase.bazi_chart ? sec.decrypt(masterCase.bazi_chart) : null;
    response.wuxing_summary = masterCase.wuxing_summary;
    response.master_analysis = masterCase.master_analysis ? sec.decrypt(masterCase.master_analysis) : null;
    response.symptoms = masterCase.symptoms;
    response.constitution = masterCase.constitution;
  }
  
  if (req.userRoles.includes('doctor') || req.userRoles.includes('super_admin')) {
    response.master_analysis = masterCase.master_analysis ? sec.decrypt(masterCase.master_analysis) : null;
    response.analysis_summary = masterCase.analysis_summary;
    response.medical_translation = masterCase.medical_translation;
    response.doctor_diagnosis = masterCase.doctor_diagnosis ? sec.decrypt(masterCase.doctor_diagnosis) : null;
    response.final_plan = masterCase.final_plan ? sec.decrypt(masterCase.final_plan) : null;
    response.symptoms = masterCase.symptoms;
  }
  
  if (req.userRoles.includes('admin_b') || req.userRoles.includes('super_admin')) {
    response.quality_score = masterCase.quality_score;
    response.is_high_quality = masterCase.is_high_quality;
    response.effectiveness_rating = masterCase.effectiveness_rating;
  }
  
  res.json(response);
});

// KB分级访问辅助函数
function canAccessKB(roles, level) {
  if (roles.includes('super_admin')) return true;
  switch (level) {
    case 'public': return true;
    case 'registered': return roles.some(r => ['free','mingdao','advanced','vip','admin_a','admin_b','master','doctor'].includes(r));
    case 'member': return roles.some(r => ['mingdao','advanced','vip','admin_a','admin_b','master','doctor'].includes(r));
    case 'premium': return roles.some(r => ['advanced','vip','admin_a','admin_b','master','doctor'].includes(r));
    case 'professional': return roles.some(r => ['master','admin_b','super_admin'].includes(r));
    case 'admin': return roles.some(r => ['admin_a','admin_b','super_admin'].includes(r));
    default: return false;
  }
}

// ============================
// KB分级访问API
// ============================

// KB文件列表（按角色过滤）
app.get('/api/kb/list', auth, (req, res) => {
  const fs = require('fs');
  const path = require('path');
  const kbDir = path.join(__dirname, '..', 'knowledge');
  
  try {
    const files = fs.readdirSync(kbDir).filter(f => f.endsWith('.js'));
    const accessibleFiles = files.filter(file => {
      const config = KB_LEVELS[file];
      const level = config ? config.level : 'public';
      return canAccessKB(req.userRoles, level);
    }).map(file => ({
      filename: file,
      level: KB_LEVELS[file] ? KB_LEVELS[file].level : 'public',
      desc: KB_LEVELS[file] ? KB_LEVELS[file].desc : ''
    }));
    
    res.json({ files: accessibleFiles });
  } catch (e) {
    res.json({ files: [] });
  }
});

// KB文件内容（角色鉴权）
app.get('/api/kb/:filename', auth, (req, res) => {
  const filename = req.params.filename;
  
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return res.status(403).json({ error: 'RBAC_FORBIDDEN' });
  }
  
  const config = KB_LEVELS[filename];
  const level = config ? config.level : 'public';
  if (!canAccessKB(req.userRoles, level)) {
    return res.status(403).json({ error: 'RBAC_FORBIDDEN', message: '无权访问此知识库' });
  }
  
  const fs = require('fs');
  const path = require('path');
  const filePath = path.join(__dirname, '..', 'knowledge', filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: '文件不存在' });
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  res.set('Cache-Control', 'public, max-age=3600');
  res.type('application/javascript').send(content);
});

// ============================
// 案例质量评分API
// ============================

app.post('/api/clinic/score-case', requirePermission('clinic:collaborate'), (req, res) => {
  const caseId = parseInt(req.body.caseId);
  const score = caseQuality.scoreCase(caseId, db);
  res.json({ ok: true, score: score });
});

app.post('/api/clinic/update-effectiveness', requirePermission('clinic:collaborate'), (req, res) => {
  const caseId = parseInt(req.body.caseId);
  const rating = parseInt(req.body.rating);
  caseQuality.updateEffectiveness(caseId, rating, db);
  res.json({ ok: true, message: '疗效评级已更新' });
});

// ============================
// 公开统计API（首页活数据）
// ============================
app.get('/api/public/stats', (req, res) => {
  try {
    const stats = {};
    // 用户统计
    stats.users = db.prepare('SELECT count(*) as c FROM users').get().c;
    stats.vipUsers = db.prepare("SELECT count(DISTINCT user_id) as c FROM user_roles WHERE role='vip'").get().c;
    stats.masterUsers = db.prepare("SELECT count(DISTINCT user_id) as c FROM user_roles WHERE role='master'").get().c;
    stats.doctorUsers = db.prepare("SELECT count(DISTINCT user_id) as c FROM user_roles WHERE role='doctor'").get().c;
    // 排盘统计
    stats.paipanCount = db.prepare('SELECT count(*) as c FROM paipan_records').get().c;
    // 案例统计
    stats.totalCases = db.prepare('SELECT count(*) as c FROM master_cases').get().c;
    stats.completedCases = db.prepare("SELECT count(*) as c FROM master_cases WHERE status='completed'").get().c;
    stats.pendingCases = db.prepare("SELECT count(*) as c FROM master_cases WHERE status IN ('draft','submitted')").get().c;
    // 报告统计
    stats.totalReports = db.prepare('SELECT count(*) as c FROM tcm_reports').get().c;
    stats.readReports = db.prepare('SELECT count(*) as c FROM tcm_reports WHERE read_at IS NOT NULL').get().c;
    // 商品
    stats.totalProducts = db.prepare("SELECT count(*) as c FROM merchants WHERE status='approved'").get().c;
    // 订单
    stats.totalOrders = db.prepare('SELECT count(*) as c FROM orders').get().c;
    stats.completedOrders = db.prepare("SELECT count(*) as c FROM orders WHERE status='completed'").get().c;
    // 课程
    stats.totalCourses = db.prepare('SELECT count(*) as c FROM courses').get().c;
    // 反馈
    stats.totalFeedback = db.prepare('SELECT count(*) as c FROM feedback').get().c;
    // 推送
    stats.totalPushes = db.prepare('SELECT count(*) as c FROM push_logs').get().c;
    // 积分
    stats.totalPoints = db.prepare('SELECT COALESCE(SUM(total_points),0) as c FROM user_points').get().c;
    // 今日日期
    stats.date = new Date().toLocaleDateString('zh-CN', { year:'numeric', month:'long', day:'numeric', weekday:'long' });
    // 近7天排盘趋势
    stats.paipanTrend = db.prepare(`SELECT date(created_at) as d, count(*) as c FROM paipan_records GROUP BY date(created_at) ORDER BY d DESC LIMIT 7`).all();
    // 近7天案例趋势
    stats.caseTrend = db.prepare(`SELECT date(created_at) as d, count(*) as c FROM master_cases GROUP BY date(created_at) ORDER BY d DESC LIMIT 7`).all();
    // 热门排盘类型
    stats.paipanTypes = db.prepare(`SELECT type, count(*) as c FROM paipan_records GROUP BY type ORDER BY c DESC`).all();
    res.json(stats);
  } catch (e) {
    res.json({ error: e.message });
  }
});

// === KB 命中上报（公开，无需认证，前端 _kbHitCount 上报用）===
// === KB 模型统计公开别名（追溯链状态，H5 用）===
app.get('/api/public/kb-stats', (req, res) => {
  try {
    const sources = db.prepare('SELECT COUNT(*) as cnt FROM source_index').get().cnt;
    const staging = db.prepare('SELECT COUNT(*) as cnt FROM kb_staging').get().cnt;
    const formal = db.prepare('SELECT COUNT(*) as cnt FROM kb_formal').get().cnt;
    const audit = db.prepare('SELECT COUNT(*) as cnt FROM kb_audit').get().cnt;
    const versions = db.prepare('SELECT COUNT(*) as cnt FROM kb_versions').get().cnt;
    const models = db.prepare("SELECT COUNT(*) as cnt FROM knowledge_models WHERE status='active'").get().cnt;
    const hits = db.prepare('SELECT COUNT(*) as cnt FROM knowledge_trace').get().cnt;
    const pushes = db.prepare('SELECT COUNT(*) as cnt FROM model_push_log').get().cnt;
    const formalWithSrc = db.prepare("SELECT COUNT(*) as cnt FROM kb_formal WHERE source_ids != '[]' AND source_ids IS NOT NULL AND source_ids != ''").get().cnt;
    res.json({
      sources, staging, formal, audit, versions, models, hits, pushes,
      trace_rate: formal ? Math.round(formalWithSrc * 1000 / formal) / 10 : 0,
      aligned: formalWithSrc === formal,
      public: true
    });
  } catch (e) {
    res.json({ error: e.message });
  }
});

// === KB 列表公开别名（无需认证，H5 公开页面用）===
app.get('/api/public/kb-list', (req, res) => {
  const fs = require('fs');
  const path = require('path');
  const kbDir = path.join(__dirname, '..', 'knowledge');
  try {
    const files = fs.readdirSync(kbDir).filter(f => f.endsWith('.js')).map(file => ({
      filename: file,
      level: KB_LEVELS[file] ? KB_LEVELS[file].level : 'public',
      desc: KB_LEVELS[file] ? KB_LEVELS[file].desc : ''
    }));
    res.json({ files, public: true });
  } catch (e) {
    res.json({ files: [] });
  }
});

// === 反馈积分公开别名（无需认证，只读 demo 数据）===
app.get('/api/public/feedback-points', (req, res) => {
  try {
    const data = db.prepare('SELECT AVG(total_points) as avgPoints, MAX(total_points) as maxPoints, MAX(streak_days) as maxStreak, COUNT(*) as userCount FROM user_points').get();
    res.json({
      public: true,
      avgPoints: Math.round(data.avgPoints || 510),
      maxPoints: data.maxPoints || 1200,
      maxStreak: data.maxStreak || 7,
      userCount: data.userCount || 14
    });
  } catch (e) {
    res.json({ public: true, avgPoints: 510, maxPoints: 1200, maxStreak: 7, userCount: 14 });
  }
});

// KB topic group 检索（公开 · 免认证）
// 用于支持 ai-assistant 中 `?[caibo]` `?[chuangye]` 等 topic 触发
// 实现方式：从 kb_formal 按 tags LIKE 检索，限制 module='ziwei' 与分组
const KB_TOPIC_GROUPS = {
  caibo:    { tag: '财帛宫', desc: '财帛宫×星耀含义矩阵', title: '💰 财帛宫·星耀含义', matchField: 'tags', priorityPrefix: 'KB-zixing-caibo' },
  chuangye: { tag: '创业',   desc: '创业副业专题',           title: '🚀 创业副业专题',     matchField: 'tags', priorityPrefix: 'KB-ziwei-chuangye' },
  flow:     { tag: '飞星',   desc: '路总飞星 1616 四层结构', title: '🌊 飞星 1616 专题',    matchField: 'content', priorityPrefix: 'KB-ZIWEI-COURSE' },
  sandaida: { tag: '路总独创', desc: '三代四化方法论',         title: '🌀 三代四化专题',    matchField: 'tags', priorityPrefix: 'KB-ZIWEI-COURSE' },
};

// KB 通用检索（公开 · 免认证）
// 用于前端 KB_SOURCES fallback：当 window.XXX_KB 缺失时调用
// 参数: ?module=ziwei&q=武曲&limit=3
app.get('/api/public/kb-query', (req, res) => {
  try {
    const moduleId = String(req.query.module || '').trim();
    const q = String(req.query.q || '').trim();
    const limit = Math.min(parseInt(req.query.limit) || 5, 20);
    if (!moduleId) {
      return res.json({ error: 'MISSING_MODULE', results: [] });
    }
    // 纯 SQL 检索（不用 trace 表）
    let rows;
    if (q) {
      const like = '%' + q + '%';
      rows = db.prepare(`SELECT entry_id, title, substr(content,1,400) AS snippet, tags, trust_score
        FROM kb_formal
        WHERE module=? AND status='formal'
          AND (title LIKE ? OR content LIKE ? OR tags LIKE ?)
        ORDER BY trust_score DESC, hit_count DESC
        LIMIT ?`).all(moduleId, like, like, like, limit);
    } else {
      rows = db.prepare(`SELECT entry_id, title, substr(content,1,400) AS snippet, tags, trust_score
        FROM kb_formal
        WHERE module=? AND status='formal'
        ORDER BY trust_score DESC, hit_count DESC
        LIMIT ?`).all(moduleId, limit);
    }
    res.json({ module: moduleId, q, count: rows.length, results: rows, public: true, fallback: true });
  } catch (e) {
    res.json({ error: e.message, results: [] });
  }
});

app.get('/api/public/kb-search', (req, res) => {
  try {
    const query = String(req.query.q || '').trim();
    const limit = Math.min(parseInt(req.query.limit || '20'), 50);
    if (!query || query.length < 2) {
      return res.json({ error: '查询字符串至少 2 字', results: [], count: 0 });
    }
    // 全文检索（无 module 限定）—— 跨模块知识库检索，供 AI 助手 v2 chat 兜底
    // const db = getDb(); -- use module-level `db`
    const likeQ = `%${query}%`;
    const sql = `SELECT entry_id, module, source_ids, title, content
      FROM kb_formal WHERE (title LIKE ? OR content LIKE ?)
      LIMIT ?`;
    const stmt = db.prepare(sql);
    const rows = stmt.all(likeQ, likeQ, limit);
    // 计算匹配得分：标题命中 10 分 + 内容命中 1 分 / 出现次数
    const results = rows.map(r => {
      const titleHit = (r.title || '').includes(query) ? 10 : 0;
      const contentCount = ((r.content || '').match(new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
      return {
        entry_id: r.entry_id,
        module: r.module,
        source_ids: r.source_ids,
        title: r.title,
        snippet: (r.content || '').slice(0, 200),
        score: titleHit + contentCount
      };
    });
    results.sort((a,b) => b.score - a.score);
    res.json({ error: null, query, count: results.length, results });
  } catch (e) {
    res.json({ error: e.message, results: [], count: 0 });
  }
});

/* ===== 咨询档案：自动给每个人建档 ===== */
// POST /api/public/consulting-save
//   body: { birth:{year,month,day,hour}, gender, focus, guest_name?, analysis } 
//   effect: upsert consulting_records + insert consulting_visits snapshot
// GET /api/public/consulting-list?limit=&risk=&q=
//   list recent guests, optional filter by risk or birth search
// GET /api/public/consulting-detail?guest_id=
//   full record + visit history (master archive page)
app.post('/api/public/consulting-save', (req, res) => {
  try {
    const b = req.body || {};
    const birth = b.birth || {};
    const year = parseInt(birth.year)||0;
    const month = parseInt(birth.month)||0;
    const day = parseInt(birth.day)||0;
    const hour = parseInt(birth.hour)||0;
    if(!year || !month || !day){
      return res.json({ ok:false, error:'生辰不完整' });
    }
    // guest_id = 生辰唯一定位（千万人不重复）
    const guest_id = b.guest_id || `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}-${String(hour).padStart(2,'0')}-${b.gender||'M'}`;
    const hits = b.hits || [];
    const actions = b.actions || [];
    const snapshot = b.snapshot || {};
    // 计算风险分
    const score = hits.reduce((s,h)=>s+(h.severity==='high'?3:h.severity==='mid'?2:1),0);
    const level = score>=6?'极高':score>=3?'较高':score>=1?'中等':'较低';

    // 查重访
    const existing = db.prepare('SELECT id, visit_count FROM consulting_records WHERE guest_id=?').get(guest_id);
    if(existing){
      db.prepare(`UPDATE consulting_records SET
        last_visit=datetime('now','localtime'),
        visit_count=visit_count+1,
        risk_level=?, risk_score=?, hua_ji_star=?, focus_area=?,
        hits_json=?, actions_json=?, snapshot_json=?,
        guest_name=COALESCE(NULLIF(?,''),guest_name)
        WHERE guest_id=?`).run(
          level, score, snapshot.huaJiStar||'', b.focus||'',
          JSON.stringify(hits), JSON.stringify(actions), JSON.stringify(snapshot),
          b.guest_name||'', guest_id);
      db.prepare(`INSERT INTO consulting_visits(guest_id, source, risk_level, risk_score, summary, snapshot_json)
        VALUES(?,?,?,?,?,?)`).run(
          guest_id, b.source||'master-zidise', level, score,
          `复访：${level}风险 / 命中 ${hits.length} 条 / 化忌 ${snapshot.huaJiStar||''}`,
          JSON.stringify(snapshot));
      return res.json({ ok:true, action:'updated', guest_id, visit_count: existing.visit_count+1, risk_level: level });
    } else {
      db.prepare(`INSERT INTO consulting_records(
        guest_id, guest_name, birth_year, birth_month, birth_day, birth_hour,
        gender, focus_area, risk_level, risk_score, hua_ji_star,
        hits_json, actions_json, snapshot_json)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
        guest_id, b.guest_name||`访客${year}年${month}月${day}日`,
        year, month, day, hour,
        b.gender||'M', b.focus||'', level, score, snapshot.huaJiStar||'',
        JSON.stringify(hits), JSON.stringify(actions), JSON.stringify(snapshot));
      db.prepare(`INSERT INTO consulting_visits(guest_id, source, risk_level, risk_score, summary, snapshot_json)
        VALUES(?,?,?,?,?,?)`).run(
        guest_id, b.source||'master-zidise', level, score,
        `首访：${level}风险 / 命中 ${hits.length} 条 / 化忌 ${snapshot.huaJiStar||''}`,
        JSON.stringify(snapshot));
      return res.json({ ok:true, action:'created', guest_id, visit_count: 1, risk_level: level });
    }
  } catch(e){
    console.error('[consulting-save]', e.message);
    res.status(500).json({ ok:false, error:e.message });
  }
});

app.get('/api/public/consulting-list', (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit)||50, 200);
    const risk = String(req.query.risk||'').trim();
    const q = String(req.query.q||'').trim();
    let sql = `SELECT id, guest_id, guest_name, birth_year, birth_month, birth_day, birth_hour,
        gender, focus_area, risk_level, risk_score, hua_ji_star, visit_count,
        last_visit FROM consulting_records WHERE 1=1`;
    const args=[];
    if(risk){ sql += ' AND risk_level=?'; args.push(risk); }
    if(q){
      sql += ' AND (guest_name LIKE ? OR CAST(birth_year AS TEXT)||\'-\'||printf(\'%02d\',birth_month)||\'-\'||printf(\'%02d\',birth_day) LIKE ? OR guest_id LIKE ?)';
      const qq = '%'+q+'%'; args.push(qq,qq,qq);
    }
    sql += ' ORDER BY last_visit DESC LIMIT ?';
    args.push(limit);
    const rows = db.prepare(sql).all(...args);
    const stats = db.prepare(`SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN risk_level='极高' THEN 1 ELSE 0 END) AS extreme,
      SUM(CASE WHEN risk_level='较高' THEN 1 ELSE 0 END) AS high,
      SUM(CASE WHEN risk_level='中等' THEN 1 ELSE 0 END) AS mid,
      SUM(CASE WHEN risk_level='较低' THEN 1 ELSE 0 END) AS low,
      SUM(visit_count) AS total_visits
      FROM consulting_records`).get();
    res.json({ ok:true, error:null, count: rows.length, results: rows, stats });
  } catch(e){
    res.json({ ok:false, error:e.message, results: [] });
  }
});

app.get('/api/public/consulting-detail', (req, res) => {
  try {
    const guest_id = String(req.query.guest_id||'').trim();
    if(!guest_id) return res.json({ ok:false, error:'guest_id 必填' });
    const row = db.prepare('SELECT * FROM consulting_records WHERE guest_id=?').get(guest_id);
    if(!row) return res.json({ ok:false, error:'访客档案不存在' });
    const visits = db.prepare('SELECT id, visit_time, source, risk_level, risk_score, summary FROM consulting_visits WHERE guest_id=? ORDER BY visit_time DESC LIMIT 20').all(guest_id);
    try { row.hits = JSON.parse(row.hits_json||'[]'); row.actions = JSON.parse(row.actions_json||'[]'); row.snapshot = JSON.parse(row.snapshot_json||'{}'); } catch(e){ row.hits=[]; row.actions=[]; row.snapshot={}; }
    delete row.hits_json; delete row.actions_json; delete row.snapshot_json;
    res.json({ ok:true, error:null, record: row, visits });
  } catch(e){
    res.json({ ok:false, error:e.message });
  }
});

app.get('/api/public/kb-topic-search', (req, res) => {
  try {
    const group = String(req.query.group || '').trim();
    const query = String(req.query.query || '').trim();
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const cfg = KB_TOPIC_GROUPS[group];
    if (!cfg) return res.json({ error: 'unknown group', available: Object.keys(KB_TOPIC_GROUPS) });

    // 构造检索 SQL：按 tags LIKE 命中或 content LIKE 命中，AND module='ziwei'
    let sql, params;
    if (cfg.matchField === 'tags') {
      // tags 是 JSON 数组字符串，LIKE '%"财帛宫"%' 最稳
      // 用 CASE 优先排序 priorityPrefix 开头的 entry
      sql = `SELECT entry_id, title, substr(content, 1, 320) AS snippet, tags, src_id, trust_score, hit_count,
             (CASE WHEN entry_id LIKE ? THEN 10 ELSE 0 END) AS priority
             FROM kb_formal
             WHERE module='ziwei' AND status='formal'
               AND (tags LIKE ? OR title LIKE ? OR content LIKE ?)
             ORDER BY priority DESC, trust_score DESC, hit_count DESC
             LIMIT ?`;
      const like = '%' + cfg.tag + '%';
      const pre = (cfg.priorityPrefix || '') + '%';
      params = [pre, like, like, like, limit];
    } else {
      // content
      sql = `SELECT entry_id, title, substr(content, 1, 320) AS snippet, tags, src_id, trust_score, hit_count,
             (CASE WHEN entry_id LIKE ? THEN 10 ELSE 0 END) AS priority
             FROM kb_formal
             WHERE module='ziwei' AND status='formal'
               AND content LIKE ?
             ORDER BY priority DESC, trust_score DESC, hit_count DESC
             LIMIT ?`;
      const pre = (cfg.priorityPrefix || '') + '%';
      params = [pre, '%' + cfg.tag + '%', limit];
    }

    // 如果带 query 参数，进一步按 query LIKE 精排
    if (query) {
      sql = `SELECT entry_id, title, substr(content, 1, 320) AS snippet, tags, src_id, trust_score, hit_count,
             (CASE WHEN entry_id LIKE ? THEN 10 ELSE 0 END) +
             (CASE WHEN title LIKE ? THEN 3 WHEN content LIKE ? THEN 2 WHEN tags LIKE ? THEN 1 ELSE 0 END) AS priority
             FROM kb_formal
             WHERE module='ziwei' AND status='formal'
               AND (title LIKE ? OR content LIKE ? OR tags LIKE ?)
             ORDER BY priority DESC, trust_score DESC, hit_count DESC
             LIMIT ?`;
      const ql = '%' + query + '%';
      const pre = (cfg.priorityPrefix || '') + '%';
      params = [pre, ql, ql, ql, ql, ql, ql, limit];
    }

    const rows = db.prepare(sql).all(...params);
    res.json({
      group, query, title: cfg.title, desc: cfg.desc,
      count: rows.length, entries: rows,
      public: true,
    });
  } catch (e) {
    res.json({ error: e.message, public: false });
  }
});

app.post('/api/public/kb-hit', (req, res) => {
  try {
    const { entry_id, app_endpoint, user_query } = req.body || {};
    if (!entry_id) return res.json({ error: 'entry_id required' });
    if (typeof kbMgmt.recordHit === 'function') {
      kbMgmt.recordHit(String(entry_id), app_endpoint || 'ai-assistant', user_query || '');
    } else {
      // 兜底：直接 +1 hit_count
      try {
        db.prepare(`UPDATE kb_formal SET hit_count = hit_count + 1, last_hit = CURRENT_TIMESTAMP WHERE entry_id = ?`).run(String(entry_id));
      } catch (e) {}
    }
    res.json({ ok: true, entry_id });
  } catch (e) {
    res.json({ error: e.message });
  }
});

// === 问卷/档案自动落库（公开，无需认证）===
app.post('/api/public/save-survey', (req, res) => {
  try {
    const { module, data, baziData, source } = req.body || {};
    if (!module) return res.json({ error: 'module required' });
    const id = 'SUR-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    db.prepare(`INSERT INTO ai_survey_logs (id, module, data_json, has_paipan, source, created_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`).run(
      id, module, JSON.stringify(data || {}), baziData ? 1 : 0, source || 'ai-assistant'
    );
    res.json({ ok: true, id });
  } catch (e) {
    // 表不存在时建表兜底
    if (e.message.includes('no such table')) {
      try {
        db.exec(`CREATE TABLE IF NOT EXISTS ai_survey_logs (
          id TEXT PRIMARY KEY, module TEXT, data_json TEXT,
          has_paipan INTEGER DEFAULT 0, source TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
        const id = 'SUR-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
        db.prepare(`INSERT INTO ai_survey_logs (id, module, data_json, has_paipan, source) VALUES (?, ?, ?, ?, ?)`).run(
          id, module, JSON.stringify(data || {}), baziData ? 1 : 0, source || 'ai-assistant');
        return res.json({ ok: true, id, _tableCreated: true });
      } catch (e2) {
        return res.json({ error: e2.message });
      }
    }
    res.json({ error: e.message });
  }
});

// 公开最新案例列表（脱敏）
app.get('/api/public/recent-cases', (req, res) => {
  try {
    const cases = db.prepare(`SELECT mc.id, mc.case_number, mc.status, mc.symptoms, mc.constitution, 
      mc.created_at, mc.submitted_at, mc.completed_at, mc.quality_score,
      u.name as master_name
      FROM master_cases mc LEFT JOIN users u ON mc.master_id = u.id
      ORDER BY mc.created_at DESC LIMIT 10`).all();
    res.json(cases);
  } catch (e) {
    res.json({ error: e.message });
  }
});

// 公开最新推送内容
app.get('/api/public/latest-pushes', (req, res) => {
  try {
    const pushes = db.prepare(`SELECT content, push_type, push_date FROM push_logs ORDER BY created_at DESC LIMIT 5`).all();
    res.json(pushes);
  } catch (e) {
    res.json({ error: e.message });
  }
});

// 公开课程列表（脱敏，去除 url 字段）
app.get('/api/public/courses', (req, res) => {
  try {
    const courses = db.prepare(`SELECT id, master, title, type, duration, category, summary, sort_order FROM courses ORDER BY sort_order ASC, id ASC`).all();
    // 解码 summary 中的转义
    const safe = courses.map(c => ({
      ...c,
      summary: c.summary ? c.summary.replace(/\\n/g, ' ').slice(0, 120) : ''
    }));
    res.json({ count: safe.length, courses: safe, public: true });
  } catch (e) {
    res.json({ error: e.message });
  }
});

// 公开中医诊室报告（filtered_text 已脱敏）
app.get('/api/public/clinic-reports', (req, res) => {
  try {
    const reports = db.prepare(`SELECT id, case_id, patient_id, doctor_id, filtered_text, pushed_at, read_at FROM tcm_reports ORDER BY pushed_at DESC LIMIT 10`).all();
    res.json({ count: reports.length, reports, public: true });
  } catch (e) {
    res.json({ error: e.message });
  }
});

// 公开 TTS 音色列表（从 tts-server.py 配置中静态枚举，避免硬编码 8912 端口）
app.get('/api/public/voices', (req, res) => {
  res.json({
    count: 11,
    voices: [
      { id: 'zh-CN-XiaoxiaoNeural', name: '晓晓', gender: 'female', lang: 'zh-CN', style: '温柔' },
      { id: 'zh-CN-YunxiNeural', name: '云希', gender: 'male', lang: 'zh-CN', style: '青年' },
      { id: 'zh-CN-YunjianNeural', name: '云健', gender: 'male', lang: 'zh-CN', style: '主播' },
      { id: 'zh-CN-XiaoyiNeural', name: '晓伊', gender: 'female', lang: 'zh-CN', style: '情感' },
      { id: 'zh-CN-YunyangNeural', name: '云扬', gender: 'male', lang: 'zh-CN', style: '新闻' },
      { id: 'zh-CN-XiaomengNeural', name: '晓梦', gender: 'female', lang: 'zh-CN', style: '儿童' },
      { id: 'zh-CN-XiaomoNeural', name: '晓墨', gender: 'female', lang: 'zh-CN', style: '文学' },
      { id: 'zh-CN-XiaoxuanNeural', name: '晓萱', gender: 'female', lang: 'zh-CN', style: '甜美' },
      { id: 'zh-CN-XiaoruiNeural', name: '晓睿', gender: 'female', lang: 'zh-CN', style: '客服' },
      { id: 'zh-CN-YunfengNeural', name: '云枫', gender: 'male', lang: 'zh-CN', style: '温暖' },
      { id: 'zh-CN-YunzeNeural', name: '云泽', gender: 'male', lang: 'zh-CN', style: '稳重' }
    ],
    public: true,
    source: 'edge-tts'
  });
});

// ============================
// TTS 语音合成代理（转发到 8912 Python TTS 服务）
// ============================
const http = require('http');
const TTS_PROXY_HOST = '127.0.0.1';
const TTS_PROXY_PORT = 8912;

app.get('/api/tts', (req, res) => {
  const qs = req.url.split('?')[1] || '';
  const opts = {
    hostname: TTS_PROXY_HOST,
    port: TTS_PROXY_PORT,
    path: '/api/tts?' + qs,
    method: 'GET',
    headers: { 'Accept': 'audio/mpeg' },
    timeout: 15000
  };
  const proxyReq = http.request(opts, proxyRes => {
    res.writeHead(proxyRes.statusCode, {
      'Content-Type': proxyRes.headers['content-type'] || 'audio/mpeg',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*'
    });
    proxyRes.pipe(res);
  });
  proxyReq.on('error', e => {
    console.error('[TTS Proxy] 后端不可用:', e.message);
    if (!res.headersSent) {
      res.status(503).json({ error: 'TTS服务暂不可用', detail: e.message });
    }
  });
  proxyReq.on('timeout', () => {
    proxyReq.destroy();
    if (!res.headersSent) {
      res.status(504).json({ error: 'TTS合成超时' });
    }
  });
  proxyReq.end();
});

app.get('/api/voices', (req, res) => {
  const opts = {
    hostname: TTS_PROXY_HOST,
    port: TTS_PROXY_PORT,
    path: '/api/voices',
    method: 'GET',
    timeout: 5000
  };
  const proxyReq = http.request(opts, proxyRes => {
    res.writeHead(proxyRes.statusCode, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    proxyRes.pipe(res);
  });
  proxyReq.on('error', e => {
    if (!res.headersSent) {
      res.status(503).json({ error: '语音列表暂不可用', voices: [] });
    }
  });
  proxyReq.end();
});

// ============================
// 数据同步路由
// ============================
app.use('/api/sync', syncRoutes);
app.use('/api/distill', distillationRoutes);

// ============================
// Face / OCR 视觉代理（转发到 face-ocr-server.py 8913）
// ============================
const FACE_OCR_BASE = process.env.FACE_OCR_BASE || 'http://127.0.0.1:8913';

async function _proxyFaceOCR(path, body) {
  try {
    const r = await fetch(FACE_OCR_BASE + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60000)
    });
    return await r.json();
  } catch (e) {
    return { ok: false, error: 'face_ocr_unreachable', detail: e.message };
  }
}

// AI 相貌分析（拍照上传后调用）
app.post('/api/face/analyze', async (req, res) => {
  if (!req.body || !req.body.image) return res.json({ ok: false, error: 'missing_image' });
  const out = await _proxyFaceOCR('/api/face/analyze', {
    image: req.body.image,
    prompt: req.body.prompt || null
  });
  res.json(out);
});

// 通用 OCR
app.post('/api/ocr/recognize', async (req, res) => {
  if (!req.body || !req.body.image) return res.json({ ok: false, error: 'missing_image' });
  const out = await _proxyFaceOCR('/api/ocr/recognize', { image: req.body.image });
  res.json(out);
});

// 中医病历 OCR（拍照识别报告）
app.post('/api/ocr/tcm', async (req, res) => {
  if (!req.body || !req.body.image) return res.json({ ok: false, error: 'missing_image' });
  const out = await _proxyFaceOCR('/api/ocr/tcm', { image: req.body.image });
  res.json(out);
});

// Face/OCR 服务健康检查
app.get('/api/face/health', async (req, res) => {
  try {
    const r = await fetch(FACE_OCR_BASE + '/health', { signal: AbortSignal.timeout(3000) });
    const data = await r.json();
    res.json({ ok: true, proxy: 'face-ocr-server', ...data });
  } catch (e) {
    res.json({ ok: false, error: 'face_ocr_unreachable', detail: e.message, base: FACE_OCR_BASE });
  }
});

// === KB 管理路由 ===
app.use('/api/kb', kbRoutes);
app.use('/api/export', exportRoutes);

// === 启动服务 ===

// === 智能眼镜 HUD 路由（PLATFORM_FULL_CLASSIFICATION：7 子路由） ===
const glassRoutes = require('./glass-routes');

const imRoutes = require('./im-routes');
app.use('/api/v1/im', imRoutes);
app.use('/api/im', imRoutes);  // legacy 兼容
app.use('/api/v1/glass', glassRoutes);
app.use('/api/glass', glassRoutes);  // legacy 兼容

// === v1 标准别名（API_V1_MIGRATION：与 legacy 双轨运行） ===
// 思路：把 legacy 路径的所有现有路由，挂在同一个 Router 上，再用同一份 Router 注册到 /api/v1/...
// 为了零侵入：使用 Express "redirect" 重定向 v1 → legacy，保持逻辑单一来源。
const _v1Redir = (legacy) => (req, res) => {
  // 把 params 拼回原路径
  let target = legacy;
  for (const k of Object.keys(req.params||{})) target = target.replace(':'+k, encodeURIComponent(req.params[k]));
  // query 透传
  const qs = require('querystring').stringify(req.query||{});
  res.redirect(307, target + (qs ? ('?'+qs) : ''));
};
const _v1 = (legacy, method='get') => app[method](legacy.replace('/api/', '/api/v1/'), _v1Redir(legacy));
const _v1p = (legacy) => _v1(legacy, 'post');

// 主要业务路径 v1 别名（按当前 legacy 全量）
[
  '/api/yuanzhu/list','/api/yuanzhu/profile','/api/yuanzhu/preview-push','/api/yuanzhu/yearly-pushes',
  '/api/paipan/history','/api/shop/products','/api/courses','/api/voices','/api/tts',
  '/api/kb/list','/api/feedback/points','/api/clinic/my-reports','/api/clinic/assigned-cases',
  '/api/merchant/list','/api/user/profile','/api/face/health','/api/ai/guide'
].forEach(p=>_v1(p));
[
  '/api/yuanzhu/preference','/api/yuanzhu/send-push','/api/paipan/save','/api/courses/add',
  '/api/feedback/submit','/api/merchant/apply','/api/merchant/approve','/api/user/login',
  '/api/user/check-super','/api/user/profile','/api/face/analyze','/api/ocr/recognize',
  '/api/ocr/tcm','/api/order/create','/api/push/log','/api/ai/chat','/api/ai/public-chat',
  '/api/clinic/discuss','/api/clinic/push-report','/api/clinic/score-case',
  '/api/clinic/submit-analysis','/api/clinic/submit-diagnosis','/api/clinic/submit-symptom',
  '/api/clinic/update-effectiveness'
].forEach(p=>_v1p(p));
// 带参数路由
app.get('/api/v1/clinic/case/:id', _v1Redir('/api/clinic/case/:id'));
app.get('/api/v1/clinic/discussions/:caseId', _v1Redir('/api/clinic/discussions/:caseId'));
app.get('/api/v1/kb/:filename', _v1Redir('/api/kb/:filename'));

const _v1Pub = (legacy) => app.get('/api/v1/public'+legacy, _v1Redir('/api/public'+legacy));
['/stats','/latest-pushes','/recent-cases','/courses','/clinic-reports','/voices','/kb-query'].forEach(s=>_v1Pub(s));
// 顶层公共端点
app.get('/api/v1/health', (req,res)=>res.json({ok:true,ts:Date.now(),v1:true}));
app.get('/api/v1/distill', _v1Redir('/api/distill'));
app.get('/api/v1/export', _v1Redir('/api/export'));
app.get('/api/v1/admin/stats', _v1Redir('/api/admin/stats'));
app.post('/api/v1/sync', _v1Redir('/api/sync'));
console.log('[v1] 公共端点别名 +10 条');

console.log('[v1] 标准别名已注册（共 44 条，与 legacy 双轨运行）');

/* ===== 全局错误兜底（Express error middleware） ===== */
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const code = err.code || ('INTERNAL_' + status);
  console.error('[unhandled]', req.method, req.path, '->', err.message);
  if (res.headersSent) return next(err);
  res.status(status).json({
    ok: false,
    error: code,
    message: status === 500 ? '服务器内部错误' : err.message,
    path: req.path,
    ts: Date.now()
  });
});
/* ===== 404 兜底（任何未匹配路由） ===== */
app.use((req, res) => {
  res.status(404).json({
    ok: false,
    error: 'NOT_FOUND',
    message: req.method + ' ' + req.path,
    ts: Date.now()
  });
});

app.listen(PORT, () => {
  console.log('═══════════════════════════════════════');
  console.log('  命理宝鉴 API服务 v2 已启动');
  console.log('  端口: ' + PORT);
  console.log('  数据库: server/database/yidao.db');
  console.log('  CORS: ' + CORS_ORIGINS.join(', '));
  console.log('  安全: AES-256-GCM + JWT-HS256 + RBAC');
  console.log('═══════════════════════════════════════');
});
