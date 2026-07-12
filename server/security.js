// ═══ 易道智鉴 · 安全工具模块 ═══
const crypto = require('crypto');

// AES-256加密密钥（生产环境应从环境变量读取）
const ENCRYPT_KEY = process.env.YIDAO_ENCRYPT_KEY || 'yidao-zhijian-2026-security-key-32b!';

// === AES-256加密 ===
function encrypt(text) {
  if (!text) return null;
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPT_KEY.padEnd(32).slice(0,32)), Buffer.alloc(16, 0));
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return 'encrypted:' + encrypted;
}

// === AES-256解密 ===
function decrypt(encryptedText) {
  if (!encryptedText || !encryptedText.startsWith('encrypted:')) return encryptedText;
  const encrypted = encryptedText.replace('encrypted:', '');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPT_KEY.padEnd(32).slice(0,32)), Buffer.alloc(16, 0));
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
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

// === 手机号哈希（用于查询，不暴露明文） ===
function hashPhone(phone) {
  return 'hash_' + crypto.createHash('sha256').update(phone).digest('hex').substring(0, 16);
}

// === JWT生成（简化版） ===
function generateToken(userId, expiryHours) {
  expiryHours = expiryHours || 24;
  const payload = {
    uid: userId,
    exp: Date.now() + expiryHours * 3600000
  };
  const token = Buffer.from(JSON.stringify(payload)).toString('base64');
  const signature = crypto.createHmac('sha256', ENCRYPT_KEY).update(token).digest('hex').substring(0, 16);
  return token + '.' + signature;
}

// === JWT验证 ===
function verifyToken(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payloadB64, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', ENCRYPT_KEY).update(payloadB64).digest('hex').substring(0, 16);
  if (signature !== expectedSig) return null;
  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString('utf8'));
    if (payload.exp < Date.now()) return null; // 过期
    return payload;
  } catch(e) {
    return null;
  }
}

// === 防SQL注入 ===
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

// === 速率限制（防暴力破解） ===
const rateLimitMap = new Map();
function rateLimit(key, maxRequests, windowMs) {
  maxRequests = maxRequests || 10;
  windowMs = windowMs || 60000; // 默认1分钟10次
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

module.exports = {
  encrypt, decrypt,
  maskPhone, maskBirthDate, hashPhone,
  generateToken, verifyToken,
  sanitizeInput, sanitizeXSS,
  rateLimit
};
