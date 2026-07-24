// ═══ 命理宝鉴 · RBAC权限中间件 ═══
// 双平台角色权限控制
const sec = require('./security-v2.js');

// === 角色定义 ===
const ROLES = {
  // 平台A · 国学体系
  GUEST: 'guest',
  FREE: 'free',
  MINGDAO: 'mingdao',
  ADVANCED: 'advanced',
  VIP: 'vip',
  ADMIN_A: 'admin_a',
  // 平台B · 周易中医诊疗
  PATIENT: 'patient',
  MASTER: 'master',
  DOCTOR: 'doctor',
  ADMIN_B: 'admin_b',
  // 跨平台
  SUPER_ADMIN: 'super_admin'
};

// === 会员等级映射 ===
const VIP_LEVEL_TO_ROLE = {
  'free': ROLES.FREE,
  'monthly': ROLES.MINGDAO,
  'yearly': ROLES.ADVANCED,
  'lifetime': ROLES.VIP
};

// === 权限矩阵 ===
const PERMISSIONS = {
  // 平台A
  'paipan:basic': [ROLES.GUEST, ROLES.FREE, ROLES.MINGDAO, ROLES.ADVANCED, ROLES.VIP],
  'paipan:advanced': [ROLES.MINGDAO, ROLES.ADVANCED, ROLES.VIP],
  'paipan:premium': [ROLES.ADVANCED, ROLES.VIP],
  'kb:public': [ROLES.GUEST, ROLES.FREE, ROLES.MINGDAO, ROLES.ADVANCED, ROLES.VIP],
  'kb:registered': [ROLES.FREE, ROLES.MINGDAO, ROLES.ADVANCED, ROLES.VIP],
  'kb:member': [ROLES.MINGDAO, ROLES.ADVANCED, ROLES.VIP],
  'kb:premium': [ROLES.ADVANCED, ROLES.VIP],
  'shop:buy': [ROLES.GUEST, ROLES.FREE, ROLES.MINGDAO, ROLES.ADVANCED, ROLES.VIP],
  'shop:manage': [ROLES.ADMIN_A, ROLES.SUPER_ADMIN],
  'course:view': [ROLES.FREE, ROLES.MINGDAO, ROLES.ADVANCED, ROLES.VIP],
  'course:manage': [ROLES.ADMIN_A, ROLES.SUPER_ADMIN],
  
  // 平台B
  'clinic:submit_symptom': [ROLES.PATIENT, ROLES.SUPER_ADMIN],
  'clinic:view_assigned_case': [ROLES.MASTER, ROLES.DOCTOR, ROLES.ADMIN_B, ROLES.SUPER_ADMIN],
  'clinic:submit_analysis': [ROLES.MASTER, ROLES.SUPER_ADMIN],
  'clinic:submit_diagnosis': [ROLES.DOCTOR, ROLES.SUPER_ADMIN],
  'clinic:push_report': [ROLES.DOCTOR, ROLES.ADMIN_B, ROLES.SUPER_ADMIN],
  'clinic:view_own_report': [ROLES.PATIENT, ROLES.SUPER_ADMIN],
  'clinic:collaborate': [ROLES.MASTER, ROLES.DOCTOR, ROLES.ADMIN_B, ROLES.SUPER_ADMIN],
  'clinic:manage': [ROLES.ADMIN_B, ROLES.SUPER_ADMIN],
  
  // 大师专用KB（含周易术语）
  'kb:professional': [ROLES.MASTER, ROLES.ADMIN_B, ROLES.SUPER_ADMIN],
  // 病患安全KB（过滤后）
  'kb:patient_safe': [ROLES.PATIENT, ROLES.MASTER, ROLES.DOCTOR, ROLES.ADMIN_B, ROLES.SUPER_ADMIN],
  
  // 大师案例库
  'case:create': [ROLES.MASTER, ROLES.SUPER_ADMIN],
  'case:view': [ROLES.MASTER, ROLES.DOCTOR, ROLES.ADMIN_B, ROLES.SUPER_ADMIN],
  'case:review': [ROLES.DOCTOR, ROLES.SUPER_ADMIN],
  'case:distill': [ROLES.ADMIN_B, ROLES.SUPER_ADMIN],
  
  // 系统管理
  'system:admin': [ROLES.ADMIN_A, ROLES.ADMIN_B, ROLES.SUPER_ADMIN],
  'system:super': [ROLES.SUPER_ADMIN]
};

// === RBAC中间件工厂 ===
function requirePermission(permission) {
  return function(req, res, next) {
    // 先走auth
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'AUTH_TOKEN_MISSING', message: '请先登录' });
    
    const payload = sec.verifyToken(token);
    if (!payload) return res.status(401).json({ error: 'AUTH_TOKEN_INVALID', message: '登录已过期' });
    
    req.userId = payload.uid;
    req.userRoles = payload.roles || ['free'];
    req.userPayload = payload;
    
    // 检查权限
    const allowedRoles = PERMISSIONS[permission];
    if (!allowedRoles) {
      console.error('未知权限:', permission);
      return res.status(500).json({ error: 'SERVER_ERROR' });
    }
    
    // super_admin 拥有所有权限
    if (req.userRoles.includes(ROLES.SUPER_ADMIN)) {
      return next();
    }
    
    // 检查角色是否在允许列表中
    const hasPermission = req.userRoles.some(role => allowedRoles.includes(role));
    if (!hasPermission) {
      return res.status(403).json({ 
        error: 'RBAC_FORBIDDEN', 
        message: '无权限执行此操作',
        required: permission
      });
    }
    
    next();
  };
}

// === 可选鉴权中间件（无 token 当 GUEST；用于 KB 列表等公开浏览接口） ===
function optionalAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) {
    const payload = sec.verifyToken(token);
    if (payload) {
      req.userId = payload.uid;
      req.userRoles = payload.roles || ['guest'];
      req.userPayload = payload;
      return next();
    }
  }
  req.userId = null;
  req.userRoles = ['guest'];
  req.userPayload = null;
  next();
}

// === 兼容旧版auth中间件 ===
function auth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: '请先登录' });
  
  const payload = sec.verifyToken(token);
  if (!payload) return res.status(401).json({ error: 'AUTH_TOKEN_EXPIRED', message: '登录已过期' });
  
  req.userId = payload.uid;
  req.userRoles = payload.roles || ['free'];
  req.userPayload = payload;
  next();
}

// === 兼容旧版adminAuth中间件 ===
function adminAuth(req, res, next) {
  auth(req, res, function() {
    const isAdmin = req.userRoles.includes(ROLES.SUPER_ADMIN) 
      || req.userRoles.includes(ROLES.ADMIN_A)
      || req.userRoles.includes(ROLES.ADMIN_B);
    if (!isAdmin) return res.status(403).json({ error: 'RBAC_FORBIDDEN', message: '无管理员权限' });
    next();
  });
}

// === 周易术语过滤 ===
const ZHOUYI_TERMS = [
  // 天干地支
  '甲木', '乙木', '丙火', '丁火', '戊土', '己土', '庚金', '辛金', '壬水', '癸水',
  '天干', '地支', '十神', '七杀', '正官', '偏财', '正财', '食神', '伤官', '比肩', '劫财',
  // 八字术语
  '日主', '八字', '四柱', '大运', '流年', '命宫', '胎元', '纳音',
  '建禄', '羊刃', '驿马', '桃花', '华盖', '空亡',
  // 月令地支
  '寅月', '卯月', '辰月', '巳月', '午月', '未月', '申月', '酉月', '戌月', '亥月', '子月', '丑月',
  // 五行术语
  '五行', '木旺', '火旺', '土旺', '金旺', '水旺', '木弱', '火弱', '土弱', '金弱', '水弱',
  '缺木', '缺火', '缺土', '缺金', '缺水',
  // 大运干支组合
  '甲子', '乙丑', '丙寅', '丁卯', '戊辰', '己巳', '庚午', '辛未', '壬申', '癸酉',
  '甲戌', '乙亥', '丙子', '丁丑', '戊寅', '己卯', '庚辰', '辛巳', '壬午', '癸未',
  '甲申', '乙酉', '丙戌', '丁亥', '戊子', '己丑', '庚寅', '辛卯', '壬辰', '癸巳',
  '甲午', '乙未', '丙申', '丁酉', '戊戌', '己亥', '庚子', '辛丑', '壬寅', '癸卯',
  '甲辰', '乙巳', '丙午', '丁未', '戊申', '己酉', '庚戌', '辛亥', '壬子', '癸丑',
  '甲寅', '乙卯', '丙辰', '丁巳', '戊午', '己未', '庚申', '辛酉', '壬戌', '癸亥',
  // 卦象术语
  '乾卦', '坤卦', '震卦', '巽卦', '坎卦', '离卦', '艮卦', '兑卦',
  '六爻', '动爻', '世爻', '应爻', '变卦', '互卦',
  // 风水术语
  '青龙', '白虎', '朱雀', '玄武', '明堂', '水口',
  // 命理格局
  '格局', '用神', '喜神', '忌神', '调候', '通关'
];

const TERM_REPLACEMENTS = {
  '八字木旺克土': '体质偏木型，需注意脾胃调理',
  '八字火旺': '体质偏热型，注意清热降火',
  '五行火旺': '体质偏热型，注意清热降火',
  '五行土弱': '体质偏土虚型，注意脾胃养护',
  '五行金旺': '体质偏金型，注意润肺',
  '五行水旺': '体质偏水型，注意肾气调理',
  '五行木旺': '体质偏木型，注意疏肝',
  '大运庚辛金': '近期金气较重时段',
  '大运壬癸水': '近期水气较重时段',
  '大运甲乙木': '近期木气较重时段',
  '大运丙丁火': '近期火气较重时段',
  '大运戊己土': '近期土气较重时段',
  '日主甲木': '个人体质属木型',
  '日主乙木': '个人体质属木型',
  '日主丙火': '个人体质属火型',
  '日主丁火': '个人体质属火型',
  '日主戊土': '个人体质属土型',
  '日主己土': '个人体质属土型',
  '日主庚金': '个人体质属金型',
  '日主辛金': '个人体质属金型',
  '日主壬水': '个人体质属水型',
  '日主癸水': '个人体质属水型',
  '七杀格': '体质中有较强约束力，需注意压力调节',
  '正官格': '体质中有秩序性特征',
  '偏财格': '体质偏燥型',
  '正财格': '体质偏稳型',
  '食神格': '体质偏温和型',
  '伤官格': '体质偏活跃型',
  '建禄格': '体质偏刚健型',
  '羊刃格': '体质偏刚烈型，注意情绪管理',
  // 五行短语替换
  '五行缺木': '体质中木元素不足',
  '五行缺火': '体质中火元素不足',
  '五行缺土': '体质中土元素不足',
  '五行缺金': '体质中金元素不足',
  '五行缺水': '体质中水元素不足',
  '火旺水弱': '体质偏热，需滋阴降火',
  '水弱火旺': '体质偏热，需滋阴降火',
  '土旺克水': '体质偏燥，需润燥养阴',
  '木旺克土': '体质偏木，需调理脾胃',
  '肝气郁结': '情绪压力导致肝气不舒',
  // 大运短语
  '乙丑期间': '特定时段',
  '土旺克水影响': '体质失衡影响',
  // 月令替换
  '生于午月': '生于夏季',
  '生于子月': '生于冬季',
  '生于卯月': '生于春季',
  '生于酉月': '生于秋季'
};

function filterZhouyiTerms(text) {
  if (!text || typeof text !== 'string') return text;
  let result = text;
  
  // 先替换短语
  for (const [term, replacement] of Object.entries(TERM_REPLACEMENTS)) {
    result = result.replace(new RegExp(term, 'g'), replacement);
  }
  
  // 再清除剩余术语
  for (const term of ZHOUYI_TERMS) {
    result = result.replace(new RegExp(term, 'g'), '');
  }
  
  // 清理多余空格和标点
  result = result.replace(/\s{2,}/g, ' ').replace(/，\s*，/g, '，').trim();
  
  return result;
}

module.exports = {
  ROLES,
  VIP_LEVEL_TO_ROLE,
  PERMISSIONS,
  requirePermission,
  auth,
  optionalAuth,
  adminAuth,
  filterZhouyiTerms,
  // 重新导出security-v2的工具
  ...sec
};
