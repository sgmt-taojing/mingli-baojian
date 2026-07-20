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
const requirePermission = rbac.requirePermission;

// ============================
// AI API 代理（密钥不再暴露在前端）
// ============================
const AI_API_BASE = process.env.AI_API_BASE || 'https://api.g2claw.com';
const AI_API_KEY = process.env.G2CLAW_API_KEY || '';

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

// === AI本地降级响应（关键词匹配+排盘数据）===
function _aiLocalResponse(userText, baziData) {
  if (!userText) return '您好，我是易道智鉴AI助手。请告诉我您的出生年月日时，我可以为您排盘分析。';
  const text = userText.toLowerCase();
  
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
  
  // 关键词匹配（按优先级）
  if (/八字|排盘|命理|算命|算卦|占卜/.test(text)) return '我可以为您做八字排盘分析。请提供您的出生年月日时（公历或农历）和性别。\n\n例如：1985年3月22日8时 女\n\n排盘后可分析：日主五行、四柱关系、五行强弱、用神取向、大运走势等。';
  if (/运势|运气|今年|流年/.test(text)) return '运势分析需要您的生辰八字。请提供出生年月日时，我为您排盘后分析今年流年运势。\n\n流年分析包括：事业运、财运、感情运、健康运等方面。';
  if (/五行|缺什么|属什么/.test(text)) return '五行分析需要您的生辰信息。请提供出生年月日时，我可以排盘后告诉您：\n1. 日主五行属性\n2. 五行强弱分布\n3. 缺什么五行\n4. 补救建议（方位/颜色/饮食/行业）';
  if (/风水|布局|方位|房子|家居/.test(text)) return '风水布局建议：\n\n1. 【大门】纳气之口，宜在吉位（生气/天医/延年）\n2. 【卧室】安神休养，床头宜靠实墙，忌横梁压顶\n3. 【厨房】火气之源，宜在凶位以压制煞气\n4. 【卫生间】排污之所，宜在凶位，忌正对大门\n5. 【客厅】明堂聚气，宜宽敞明亮\n\n如需个性化分析，请提供房屋朝向和户型图。';
  if (/中医|养生|健康/.test(text)) return '中医养生建议：\n\n1. 【起居】子时（23:00）前入睡，养肝胆\n2. 【饮食】七分饱，少生冷，多温热\n3. 【运动】适度运动，气血流通，忌大汗\n4. 【情志】少怒少虑，心态平和\n5. 【四季】春养肝、夏养心、秋养肺、冬养肾\n\n如需针对性建议，请描述您的具体症状或体质。也可使用「症状分析」功能获取周易+中医联合方案。';
  if (/失眠|睡不着|睡眠/.test(text)) return '失眠调理方案：\n\n【中医辨证】多属心脾两虚或肝郁化火\n【食疗】酸枣仁粥、百合莲子汤、小米粥\n【穴位】神门、三阴交、安眠穴（耳后）\n【起居】子时前入睡，睡前忌手机\n【运动】傍晚散步，忌剧烈运动\n\n如持续失眠，建议就诊。您也可以使用「症状分析」功能获取个性化方案。';
  if (/头痛|头晕/.test(text)) return '头痛调理建议：\n\n【分型】\n- 胀痛→肝阳上亢，宜平肝潜阳\n- 隐痛→气血不足，宜益气养血\n- 刺痛→瘀血阻络，宜活血化瘀\n- 重痛→痰湿内阻，宜化痰祛湿\n\n【穴位】太阳穴、风池、合谷\n【建议】如持续头痛请就医，可使用「中医诊疗」功能获取专业方案。';
  if (/倪海厦|倪师/.test(text)) return '倪海厦老师知识库涵盖46个模块：\n\n【经方】伤寒论、金匮要略\n【针灸】针灸大成\n【本草】神农本草经\n【经典】黄帝内经\n【命理】天纪、人纪\n\n您可以在「倪师知识库」页面浏览详细内容，或告诉我具体想了解哪个方面。';
  if (/舒晗/.test(text)) return '舒晗老师知识库包含：命理秘笈、实战心法、进阶课程等。您可以在「舒晗知识库」页面浏览，或告诉我具体想了解的内容。';
  if (/奇门|遁甲/.test(text)) return '奇门遁甲是中国古代最高层预测学，被誉为「帝王之学」。\n\n【构成】天盘九星+地盘八门+八神+三奇六仪\n【用途】预测吉凶、择日择吉、战略决策\n\n您可以在排盘页面使用奇门遁甲引擎排盘，或告诉我具体问题。';
  if (/紫微|斗数/.test(text)) return '紫微斗数以出生年月日时排盘，用十二宫位分析人生各维度。\n\n【十二宫】命宫、兄弟、夫妻、子女、财帛、疾厄、迁移、奴仆、官禄、田宅、福德、父母\n\n您可以在排盘页面使用紫微引擎排盘。';
  if (/六爻|占卜|起卦/.test(text)) return '六爻占卜通过起卦预测吉凶。\n\n【方法】三枚铜钱摇六次，得六爻卦象\n【分析】世应关系、六亲配六神、动爻变爻\n\n您可以在排盘页面使用六爻引擎起卦。';
  if (/梅花|易数/.test(text)) return '梅花易数以时间或数字起卦，简便快捷。\n\n【起卦法】时间起卦、数字起卦、方位起卦\n【分析】体用关系、互卦变卦、五行生克\n\n您可以在排盘页面使用梅花引擎分析。';
  if (/六壬/.test(text)) return '大六壬与奇门遁甲、太乙神数并称三式。\n\n【构成】四课三传+天将+神煞\n【用途】预测失物、行人、婚姻、事业等\n\n您可以在排盘页面使用六壬引擎起课。';
  if (/择日|择吉|吉日/.test(text)) return '择日择吉是根据黄历选择吉日的方法。\n\n【原则】避开岁破、月破、日破；选择天德、月德、三合、六合\n【用途】婚嫁、搬家、开业、动土等\n\n您可以在排盘页面使用择日引擎查询，或查看黄历页面获取每日宜忌。';
  if (/黄历|宜忌|老黄历/.test(text)) return '黄历包含每日宜忌、吉时方位、节气信息等。\n\n请访问「黄历」页面查看今日详情，包括：\n1. 每日宜忌\n2. 吉时方位\n3. 节气养生\n4. 三视角（儒/道/佛）养生功法\n5. 今日命理知识';
  if (/体质|调理/.test(text)) return '体质调理根据个人五行体质定制养生方案。\n\n【五型体质】\n- 木型：疏肝理气\n- 火型：养心安神\n- 土型：健脾祛湿\n- 金型：补肺益气\n- 水型：温补肾阳\n\n请访问「体质调理」页面做体质测试。';
  if (/婚姻|感情|桃花|恋爱|对象|单身/.test(text)) return '感情婚姻分析：\n\n【桃花星】子午卯酉为桃花，日支带桃花者异性缘佳\n【正缘】男看正财、女看正官，流年引动则姻缘至\n【合婚】双方八字五行互补、日柱相生为佳\n\n请提供双方生辰，可做深度合婚分析。';
  if (/子女|孩子|怀孕|生育/.test(text)) return '子女分析：\n\n【子女星】男以官杀为子女、女以食伤为子女\n【子女宫】时柱为子女宫，时柱逢冲则子女缘薄\n【备孕】择吉年吉月生养，子女八字与父母相生为佳\n\n请提供您的生辰，可分析子女缘深浅。';
  if (/事业|工作|职场|创业|跳槽/.test(text)) return '事业分析：\n\n【官运】正官为正职、七杀为偏职/创业\n【适合行业】以日主五行喜用选行业\n【创业时机】大运行喜用神运时创业易成\n\n请提供生辰，可分析您的事业方向和创业时机。';
  if (/财运|投资|理财|赚钱|破财/.test(text)) return '财运分析：\n\n【正财】正财为工薪、偏财为投资/意外之财\n【财库】辰戌丑未为四库，有库则能存财\n【破财】比劫旺则破财，宜低调守财\n\n请提供生辰，可分析您的财运走势和理财方向。';
  if (/健康|疾病|体检|长寿/.test(text)) return '健康分析：\n\n【五行对应】金→肺、木→肝胆、水→肾、火→心、土→脾/胃\n【缺行预警】缺某五行→对应脏腑偏弱\n【大运健康】行忌神运时注意对应脏腑\n\n请提供生辰，可分析您的健康弱点和养护建议。';
  if (/搬家|出行|迁徙|出差/.test(text)) return '出行搬家建议：\n\n【搬家择日】宜天德/月德/三合/六合日\n【出行方位】向喜用神方位出行大吉\n【迁徙方向】迁向喜用方发展更佳\n\n请在排盘页面使用择日引擎。';
  if (/学业|考试|升学|考研/.test(text)) return '学业考试分析：\n\n【印星】正印/偏印代表学习，印星为喜用则学业有成\n【文昌】日干见文昌星者聪慧好学\n【考试运】流年行印星运时考试顺利\n\n请提供生辰，可分析学业潜力和考试运势。';
  if (/人际|社交|贵人|小人/.test(text)) return '人际关系分析：\n\n【贵人】天乙贵人/天德贵人，命中带贵人者遇难呈祥\n【小人】七杀/伤官旺易招小人\n【社交】比肩/劫财多者朋友多但易破财\n\n请提供生辰，可分析您的贵人和人际运。';
  if (/开运|吉祥物|佩戴|转运/.test(text)) return '开运吉祥物建议：\n\n【五行补缺】缺金戴金属、缺木戴木质、缺水戴水晶、缺火戴红玛瑙、缺土戴玉石\n【生肖】本命佛/三合贵人\n【方位】朝喜用神方位\n\n请提供生辰，可知您的开运方向。商城有相应吉祥物。';
  if (/合婚|配对|匹配/.test(text)) return '合婚分析：\n\n【五行互补】双方八字五行互补为佳\n【日柱】天合地合为上婚、相生为中婚、相克为下婚\n【生肖】三合/六合为佳，六冲/三刑为忌\n\n请提供双方生辰，可做深度合婚配对分析。';
  if (/本命年|犯太岁|太岁/.test(text)) return '本命年/犯太岁化解：\n\n【太岁】值太岁、冲太岁、刑太岁、害太岁均需化解\n【化解】1.佩戴太岁符 2.拜太岁 3.避免大额投资 4.多做善事\n\n2026年丙午年：马/鼠/牛/兔犯太岁，需提前化解。';
  if (/梦境|做梦|梦到/.test(text)) return '梦境解读：\n\n【水梦】→智慧/财运 【火梦】→事业/名声\n【动物】梦龙→贵人、梦蛇→财运、梦虎→权力\n\n请描述您的梦境内容，我为您解读。';
  if (/性格|心理|脾气/.test(text)) return '性格心理分析：\n\n【日主】金刚毅/木直爽/水聪明/火热情/土稳重\n【十神】正官守规/七杀果断/正印善良/偏印敏感/食神乐观/伤官叛逆\n\n请提供生辰，可做深度性格分析。';
  if (/公司起名|品牌起名|店铺起名/.test(text)) return '公司/品牌起名：\n\n【五行】补法人八字喜用神\n【数理】总格宜吉祥（24/31/35）\n【行业】行业五行与名称五行相生\n\n请提供法人生辰和行业类型。';
  if (/每日运势|今日运势|今天运势/.test(text)) return '每日运势请查看「黄历」页面。如需个性化运势，请先排盘，AI可根据日主五行分析当日运势。';
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
app.post('/api/ai/public-chat', async (req, res) => {
  let messages = req.body.messages;
  const model = req.body.model || 'auto';
  const baziData = req.body.baziData || null;
  if (!messages || !Array.isArray(messages)) return res.json({ error: '参数错误' });
  
  if (!AI_API_KEY) {
    const lastMsg = messages.filter(m => m.role === 'user').pop();
    return res.json({ choices: [{ message: { content: _aiLocalResponse(lastMsg ? lastMsg.content : '', baziData) } }], _local: true });
  }
  
  const ip = req.ip || req.connection.remoteAddress;
  if (!sec.rateLimit('ai_public_' + ip, 20, 60000)) return res.status(429).json({ error: 'RATE_LIMITED', message: '请求过于频繁，请稍后再试' });
  
  let sysContent = AI_SYSTEM_PROMPT;
  if (baziData) {
    sysContent += '\n\n【用户排盘数据】\n' + JSON.stringify(baziData, null, 2) + '\n请基于以上排盘数据回答用户问题。';
  }
  
  try {
    const response = await fetch(AI_API_BASE + '/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': '***' + AI_API_KEY },
      body: JSON.stringify({ model, messages: [{ role: 'system', content: sysContent }, ...messages], max_tokens: 2048, temperature: 0.7 })
    });
    const data = await response.json();
    if (data.error) {
      const lastMsg = messages.filter(m => m.role === 'user').pop();
      return res.json({ choices: [{ message: { content: _aiLocalResponse(lastMsg ? lastMsg.content : '', baziData) } }], _local: true });
    }
    res.json(data);
  } catch (e) {
    console.error('AI API错误:', e.message);
    const lastMsg = messages.filter(m => m.role === 'user').pop();
    res.json({ choices: [{ message: { content: _aiLocalResponse(lastMsg ? lastMsg.content : '', baziData) } }], _local: true });
  }
});

// === AI引导提问 ===
app.get('/api/ai/guide', (req, res) => {
  const idx = parseInt(req.query.idx) || 0;
  res.json({ guide: AI_GUIDE_PROMPTS[idx % AI_GUIDE_PROMPTS.length], all: AI_GUIDE_PROMPTS });
});

// ============================
// 用户接口
// ============================

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
// 排盘记录接口
// ============================
app.post('/api/paipan/save', auth, (req, res) => {
  const type = sec.sanitizeInput(req.body.type);
  const inputData = JSON.stringify(req.body.inputData || {});
  const resultData = JSON.stringify(req.body.resultData || {}).substring(0, 50000);
  
  db.prepare('INSERT INTO paipan_records (user_id, type, input_data, result_data) VALUES (?, ?, ?, ?)')
    .run(req.userId, type, inputData, resultData);
  
  res.json({ ok: true, message: '排盘记录已保存' });
});

app.get('/api/paipan/history', auth, (req, res) => {
  const records = db.prepare('SELECT id, type, input_data, created_at FROM paipan_records WHERE user_id = ? ORDER BY created_at DESC LIMIT 50').all(req.userId);
  res.json(records);
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

// ============================
// 数据同步路由
// ============================
app.use('/api/sync', syncRoutes);
app.use('/api/distill', distillationRoutes);

// === 启动服务 ===
app.listen(PORT, () => {
  console.log('═══════════════════════════════════════');
  console.log('  命理宝鉴 API服务 v2 已启动');
  console.log('  端口: ' + PORT);
  console.log('  数据库: server/database/yidao.db');
  console.log('  CORS: ' + CORS_ORIGINS.join(', '));
  console.log('  安全: AES-256-GCM + JWT-HS256 + RBAC');
  console.log('═══════════════════════════════════════');
});
