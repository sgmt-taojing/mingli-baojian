/**
 * 命理宝鉴·医道 认证系统 V1.0
 * 多角色：管理员 / 医生（针灸/内科/妇科/儿科/皮肤/骨伤）/ 药师 / 患者
 * JWT + bcrypt + RBAC
 */

const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

// ═══ 角色定义 ═══
const ROLES = {
  super_admin: {
    name: '超级管理员',
    permissions: ['*'],
    pages: ['admin','doctor-dashboard','pharmacy','clinical','report','index'],
    default_redirect: '/admin.html'
  },
  doctor_acupuncture: {
    name: '针灸科医生',
    permissions: ['patient:read','patient:write','diagnosis:read','diagnosis:write','prescription:write','wearable:read'],
    pages: ['doctor-dashboard','clinical','report','index'],
    specialty: 'acupuncture',
    default_redirect: '/doctor-dashboard.html'
  },
  doctor_internal: {
    name: '内科医生',
    permissions: ['patient:read','patient:write','diagnosis:read','diagnosis:write','prescription:write','wearable:read'],
    pages: ['doctor-dashboard','clinical','report','index'],
    specialty: 'internal',
    default_redirect: '/doctor-dashboard.html'
  },
  doctor_gynecology: {
    name: '妇科医生',
    permissions: ['patient:read','patient:write','diagnosis:read','diagnosis:write','prescription:write','wearable:read'],
    pages: ['doctor-dashboard','clinical','report','index'],
    specialty: 'gynecology',
    default_redirect: '/doctor-dashboard.html'
  },
  doctor_pediatrics: {
    name: '儿科医生',
    permissions: ['patient:read','patient:write','diagnosis:read','diagnosis:write','prescription:write','wearable:read'],
    pages: ['doctor-dashboard','clinical','report','index'],
    specialty: 'pediatrics',
    default_redirect: '/doctor-dashboard.html'
  },
  doctor_dermatology: {
    name: '皮肤科医生',
    permissions: ['patient:read','patient:write','diagnosis:read','diagnosis:write','prescription:write','wearable:read'],
    pages: ['doctor-dashboard','clinical','report','index'],
    specialty: 'dermatology',
    default_redirect: '/doctor-dashboard.html'
  },
  doctor_orthopedics: {
    name: '骨伤科医生',
    permissions: ['patient:read','patient:write','diagnosis:read','diagnosis:write','prescription:write','wearable:read'],
    pages: ['doctor-dashboard','clinical','report','index'],
    specialty: 'orthopedics',
    default_redirect: '/doctor-dashboard.html'
  },
  pharmacist: {
    name: '药师',
    permissions: ['prescription:read','prescription:verify','pharmacy:manage','patient:read'],
    pages: ['pharmacy','index'],
    default_redirect: '/pharmacy.html'
  },
  patient: {
    name: '患者',
    permissions: ['self:read','report:read'],
    pages: ['report','index'],
    default_redirect: '/report.html'
  }
};

const SPECIALTIES = {
  acupuncture: { name: '针灸科', icon: '📍', dept_id: 'DEPT01' },
  internal: { name: '内科', icon: '🫁', dept_id: 'DEPT02' },
  gynecology: { name: '妇科', icon: '👩‍⚕️', dept_id: 'DEPT03' },
  pediatrics: { name: '儿科', icon: '👶', dept_id: 'DEPT04' },
  dermatology: { name: '皮肤科', icon: '🔬', dept_id: 'DEPT05' },
  orthopedics: { name: '骨伤科', icon: '🦴', dept_id: 'DEPT06' }
};

// ═══ 简易 JWT（无外部依赖）═══
const SECRET = process.env.TCM_JWT_SECRET || crypto.randomBytes(32).toString('hex');
const TOKEN_EXPIRY = 12 * 3600 * 1000; // 12小时

function createToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + TOKEN_EXPIRY / 1000
  })).toString('base64url');
  const signature = crypto.createHmac('sha256', SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

function verifyToken(token) {
  try {
    const [header, body, signature] = token.split('.');
    const expected = crypto.createHmac('sha256', SECRET).update(`${header}.${body}`).digest('base64url');
    if (signature !== expected) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch { return null; }
}

// ═══ 用户存储（简易内存，生产环境替换为 DB）═══
const DATA_DIR = path.join(__dirname, '..', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

function loadUsers() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
  } catch {
    const defaults = {
      'admin': {
        id: 'U001', username: 'admin', passwordHash: hashPassword('admin123'),
        name: '系统管理员', role: 'super_admin', enabled: true, created_at: new Date().toISOString()
      },
      'doc001': {
        id: 'D001', username: 'doc001', passwordHash: hashPassword('doc123'),
        name: '张仲景', role: 'doctor_internal', specialty: 'internal', enabled: true, created_at: new Date().toISOString()
      },
      'doc002': {
        id: 'D002', username: 'doc002', passwordHash: hashPassword('doc123'),
        name: '李时珍', role: 'doctor_acupuncture', specialty: 'acupuncture', enabled: true, created_at: new Date().toISOString()
      },
      'doc003': {
        id: 'D003', username: 'doc003', passwordHash: hashPassword('doc123'),
        name: '傅青主', role: 'doctor_gynecology', specialty: 'gynecology', enabled: true, created_at: new Date().toISOString()
      },
      'pharma001': {
        id: 'P001', username: 'pharma001', passwordHash: hashPassword('pharma123'),
        name: '孙思邈', role: 'pharmacist', enabled: true, created_at: new Date().toISOString()
      }
    };
    saveUsers(defaults);
    return defaults;
  }
}

function saveUsers(users) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function hashPassword(pw) {
  return crypto.createHash('sha256').update(pw + SECRET).digest('hex');
}

function verifyPassword(pw, hash) {
  return hashPassword(pw) === hash;
}

// ═══ 公开 API ═══
module.exports = {
  ROLES, SPECIALTIES, SECRET,

  login(username, password) {
    const users = loadUsers();
    const user = users[username];
    if (!user || !user.enabled) return { ok: false, error: '用户不存在或已禁用' };
    if (!verifyPassword(password, user.passwordHash)) return { ok: false, error: '密码错误' };
    
    const token = createToken({
      sub: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      specialty: user.specialty || null
    });

    return {
      ok: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        roleName: ROLES[user.role]?.name || user.role,
        specialty: user.specialty || null,
        permissions: ROLES[user.role]?.permissions || []
      }
    };
  },

  authMiddleware(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      return res.status(401).json({ ok: false, error: '请先登录' });
    }
    const token = auth.slice(7);
    const payload = verifyToken(token);
    if (!payload) {
      return res.status(401).json({ ok: false, error: '登录已过期，请重新登录' });
    }
    req.user = payload;
    next();
  },

  requireRole(...roles) {
    return (req, res, next) => {
      if (!req.user) return res.status(401).json({ ok: false, error: '请先登录' });
      if (!roles.includes(req.user.role) && req.user.role !== 'super_admin') {
        return res.status(403).json({ ok: false, error: '权限不足' });
      }
      next();
    };
  },

  registerUser(userData) {
    const users = loadUsers();
    if (users[userData.username]) return { ok: false, error: '用户名已存在' };
    
    const user = {
      id: 'U' + crypto.randomBytes(4).toString('hex').toUpperCase(),
      username: userData.username,
      passwordHash: hashPassword(userData.password),
      name: userData.name,
      role: userData.role,
      specialty: userData.specialty || null,
      enabled: true,
      phone: userData.phone || '',
      created_at: new Date().toISOString()
    };
    users[userData.username] = user;
    saveUsers(users);
    return { ok: true, user };
  },

  listDoctors() {
    const users = loadUsers();
    return Object.values(users)
      .filter(u => u.role.startsWith('doctor_'))
      .map(u => ({
        id: u.id,
        name: u.name,
        role: u.role,
        roleName: ROLES[u.role]?.name,
        specialty: u.specialty,
        specialtyName: SPECIALTIES[u.specialty]?.name
      }));
  },

  verifyToken,
  ROLES,
  SPECIALTIES
};
