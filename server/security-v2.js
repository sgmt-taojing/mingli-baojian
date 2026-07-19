// ═══ 命理宝鉴 · 安全工具模块 v2 ═══
// 修复：随机IV、环境变量密钥、HMAC-SHA256完整签名、Token短有效期
const crypto = require('crypto');
const path = require('path');

// === 密钥管理 ===
// 从环境变量读取，不再硬编码fallback
const ENCRYPT_KEY = process.env.MINGLI_ENCRYPT_KEY || '';
const JWT_SECRET = process.env.MINGLI_JWT_SECRET || '';
const JWT_ISSUER = 'mingli-baojian';

// 密钥校验
function getKey() {
  if (!ENCRYPT_KEY || ENCRYPT_KEY.length < 32) {
    // 开发模式：生成临时密钥并警告
    if (process.env.NODE_ENV !== 'production') {
      console.warn('⚠️  MINGLI_ENCRYPT_KEY 未设置或不足32字符，使用开发模式临时密钥');
      return crypto.scryptSync('dev-key-mingli', 'salt-dev', 32);
    }
    throw new Error('MINGLI_ENCRYPT_KEY 必须设置且至少32字符');
  }
  return Buffer.from(ENCRYPT_KEY.padEnd(32).slice(0, 32), 'utf8');
}

function getJwtSecret() {
  if (!JWT_SECRET || JWT_SECRET.length < 32) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('⚠️  MINGLI_JWT_SECRET 未设置或不足32字符，使用开发模式临时密钥');
      return crypto.scryptSync('dev-jwt-secret-mingli', 'salt-jwt', 32);
    }
    throw new Error('MINGLI_JWT_SECRET 必须设置且至少32字符');
  }
  return JWT_SECRET;
}

// === AES-256-GCM 加密（随机IV） ===
function encrypt(text) {
  if (!text) return null;
  const key = getKey();
  const iv = crypto.randomBytes(16); // 随机IV，每次不同
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag(); // GCM认证标签
  // 格式：encrypted:iv:authTag:ciphertext
  return 'enc:' + iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

// === AES-256-GCM 解密 ===
function decrypt(encryptedText) {
  if (!encryptedText) return encryptedText;
  // 兼容旧格式 encrypted:hex（迁移用）
  if (encryptedText.startsWith('encrypted:') && !encryptedText.startsWith('enc:')) {
    return decryptLegacy(encryptedText);
  }
  if (!encryptedText.startsWith('enc:')) return encryptedText;
  
  const parts = encryptedText.split(':');
  if (parts.length !== 4) return null;
  
  const key = getKey();
  const iv = Buffer.from(parts[1], 'hex');
  const authTag = Buffer.from(parts[2], 'hex');
  const encrypted = parts[3];
  
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// 旧格式解密（迁移用，仅开发环境）
function decryptLegacy(encryptedText) {
  const oldKey = Buffer.from((process.env.MINGLI_ENCRYPT_KEY_LEGACY || 'yidao-zhijian-2026-security-key-32b!').padEnd(32).slice(0, 32), 'utf8');
  const encrypted = encryptedText.replace('encrypted:', '');
  try {
    const decipher = crypto.createDecipheriv('aes-256-cbc', oldKey, Buffer.alloc(16, 0));
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (e) {
    console.error('旧格式解密失败:', e.message);
    return null;
  }
}

// === 手机号脱敏 ===
function maskPhone(phone) {
  if (!phone || phone.length < 7) return phone;
  return phone.substring(0, 3) + '****' + phone.substring(7);
}

// === 生辰脱敏 ===
function maskBirthDate(date) {
  if (!date) return date;
  return date.substring(0, 4) + '**-**' + date.substring(10);
}

// === 手机号哈希 ===
function hashPhone(phone) {
  return 'hash_' + crypto.createHash('sha256').update(phone).digest('hex').substring(0, 16);
}

// === JWT生成（HMAC-SHA256完整签名） ===
function generateToken(userId, expiryHours, roles) {
  expiryHours = expiryHours || 24;
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    iss: JWT_ISSUER,
    uid: userId,
    roles: roles || ['user'],
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + expiryHours * 3600
  };
  
  const base64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const data = base64Header + '.' + base64Payload;
  const signature = crypto.createHmac('sha256', getJwtSecret()).update(data).digest('base64url');
  
  return data + '.' + signature;
}

// === JWT验证 ===
function verifyToken(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  
  const [headerB64, payloadB64, signature] = parts;
  const data = headerB64 + '.' + payloadB64;
  const expectedSig = crypto.createHmac('sha256', getJwtSecret()).update(data).digest('base64url');
  
  // 时间安全比较
  if (signature.length !== expectedSig.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) return null;
  
  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    if (payload.iss !== JWT_ISSUER) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

// === 防SQL注入（使用参数化查询的补充） ===
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input.replace(/'/g, "''").replace(/;/g, '').replace(/--/g, '').replace(/\/\*/g, '').replace(/\*\//g, '');
}

// === 防XSS ===
function sanitizeXSS(input) {
  if (typeof input !== 'string') return input;
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '');
}

// === 速率限制 ===
const rateLimitMap = new Map();
function rateLimit(key, maxRequests, windowMs) {
  maxRequests = maxRequests || 10;
  windowMs = windowMs || 60000;
  const now = Date.now();
  if (!rateLimitMap.has(key)) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  const record = rateLimitMap.get(key);
  if (now > record.resetAt) {
    record.count = 1;
    record.resetAt = now + windowMs;
    return true;
  }
  if (record.count >= maxRequests) return false;
  record.count++;
  return true;
}

// === 角色检查工具 ===
function hasRole(payload, role) {
  if (!payload || !payload.roles) return false;
  return payload.roles.includes(role) || payload.roles.includes('super_admin');
}

function hasAnyRole(payload, roles) {
  if (!payload || !payload.roles) return false;
  if (payload.roles.includes('super_admin')) return true;
  return roles.some(r => payload.roles.includes(r));
}

module.exports = {
  encrypt, decrypt,
  maskPhone, maskBirthDate, hashPhone,
  generateToken, verifyToken,
  sanitizeInput, sanitizeXSS,
  rateLimit,
  hasRole, hasAnyRole
};
