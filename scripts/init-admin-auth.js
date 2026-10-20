#!/usr/bin/env node
// ═══════════════════════════════════════════
// 管理员邮箱认证初始化脚本
// ═══════════════════════════════════════════
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// === 配置 ===
const INIT_FILE = path.join(__dirname, '..', 'app', '.admin-init.json');
const ADMINS_FILE = path.join(__dirname, '..', 'app', 'admins.json');

// 从环境变量或命令行参数获取管理员信息
// 用法: ADMIN_EMAIL=admin@mingli.local ADMIN_PASSWORD=xxx node scripts/init-admin-auth.js
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@mingli.local';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || crypto.randomBytes(8).toString('hex');
const ADMIN_NAME = process.env.ADMIN_NAME || '管理员';

// === 密码哈希 ===
function hashPassword(password, salt) {
  const key = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512');
  return key.toString('hex');
}

// === 生成安全 token ===
function generateToken(adminId, email, secret) {
  const payload = JSON.stringify({ adminId, email, iat: Date.now() });
  return crypto.createHmac('sha256', secret).update(payload).digest('base64url');
}

function verifyToken(token, adminId, email, secret) {
  try {
    const payload = JSON.stringify({ adminId, email });
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {
    return false;
  }
}

// === 主流程 ===
async function main() {
  const secret = crypto.randomBytes(32).toString('hex');
  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(ADMIN_PASSWORD, salt);
  const adminId = crypto.randomUUID();
  const token = generateToken(adminId, ADMIN_EMAIL, secret);

  const admins = [{
    id: adminId,
    email: ADMIN_EMAIL,
    name: ADMIN_NAME,
    role: 'super_admin',
    passwordSalt: salt,
    passwordHash: passwordHash,
    createdAt: new Date().toISOString(),
    lastLogin: null
  }];

  // 写入 admins.json（不包含密码哈希，实际项目中应加密存储）
  const adminsRecord = admins.map(a => ({
    id: a.id,
    email: a.email,
    name: a.name,
    role: a.role,
    createdAt: a.createdAt,
    lastLogin: a.lastLogin
  }));

  fs.writeFileSync(ADMINS_FILE, JSON.stringify(adminsRecord, null, 2), 'utf8');
  
  // 写入初始化文件（包含密码，仅用于初始化）
  const initRecord = {
    adminId,
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    passwordHash,
    passwordSalt: salt,
    secret,
    token,
    createdAt: new Date().toISOString()
  };
  fs.writeFileSync(INIT_FILE, JSON.stringify(initRecord, null, 2), 'utf8');

  console.log('✅ 管理员认证初始化完成');
  console.log(`📧 邮箱: ${ADMIN_EMAIL}`);
  console.log(`🔑 密码: ${ADMIN_PASSWORD}`);
  console.log(`🔑 Token: ${token}`);
  console.log(`👤 角色: super_admin`);
  console.log(`💾 管理员文件: ${ADMINS_FILE}`);
  console.log(`🔒 初始化文件: ${INIT_FILE}`);
  console.log('');
  console.log('⚠️  请妥善保管以上信息！');
  console.log('⚠️  初始化完成后请删除 init-admin-auth.js 中的密码信息！');
}

main().catch(console.error);
