// ═══════════════════════════════════════════════════════════════
// 命理宝鉴 · 知识库分发API (KB Distribution API)
// ═══════════════════════════════════════════════════════════════
// 提供知识库文件的列表、内容、元信息查询接口。
// 基于RBAC中间件实现角色鉴权，按级别控制访问。
//
// 路由列表：
//   GET /api/kb/list              — 列出当前用户可访问的KB文件
//   GET /api/kb/:filename         — 获取KB文件内容（带角色鉴权）
//   GET /api/kb/meta/:filename    — 获取KB文件元信息
// ═══════════════════════════════════════════════════════════════

const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const { KB_LEVELS, LEVEL_TO_DIR, LEVEL_TO_PERMISSION, LEVEL_PRIORITY } = require('./kb-config');
const { auth, ROLES } = require('./rbac-middleware');

const router = express.Router();

// ═══════════════════════════════════════════════════════════════
// 常量
// ═══════════════════════════════════════════════════════════════
const KB_STORE = path.join(__dirname, 'kb-store');
const CACHE_MAX_AGE = 3600; // 1小时缓存

// ═══════════════════════════════════════════════════════════════
// 辅助函数
// ═══════════════════════════════════════════════════════════════

/**
 * 安全文件名验证 — 防止路径遍历攻击
 * 仅允许: 字母、数字、下划线、连字符、点，且必须以 .js 结尾
 */
function isSafeFilename(filename) {
  if (!filename || typeof filename !== 'string') return false;
  // 禁止路径分隔符和 ..
  if (filename.includes('/') || filename.includes('\\') || filename.includes('..')) return false;
  // 仅允许合法字符
  if (!/^[a-zA-Z0-9_\-.]+\.js$/.test(filename)) return false;
  return true;
}

/**
 * 获取用户可访问的最高级别
 * 根据用户角色列表，判断可访问哪些级别的KB
 */
function getUserMaxLevel(userRoles) {
  if (!userRoles || !Array.isArray(userRoles)) return 'public';

  // super_admin 拥有所有权限
  if (userRoles.includes(ROLES.SUPER_ADMIN)) return 'admin';

  // 管理员
  if (userRoles.includes(ROLES.ADMIN_A) || userRoles.includes(ROLES.ADMIN_B)) {
    return 'admin';
  }

  // 专业级别：master / doctor
  if (userRoles.includes(ROLES.MASTER) || userRoles.includes(ROLES.DOCTOR)) {
    return 'professional';
  }

  // 精进级别：advanced (VIP)
  if (userRoles.includes(ROLES.ADVANCED)) {
    return 'premium';
  }

  // 会员级别：mingdao
  if (userRoles.includes(ROLES.MINGDAO)) {
    return 'member';
  }

  // 注册级别：free
  if (userRoles.includes(ROLES.FREE)) {
    return 'registered';
  }

  // 访客：仅公开
  return 'public';
}

/**
 * 判断用户是否可访问指定级别
 */
function canAccessLevel(userMaxLevel, requiredLevel) {
  const userPriority = LEVEL_PRIORITY[userMaxLevel] || 0;
  const requiredPriority = LEVEL_PRIORITY[requiredLevel] || 99;
  return userPriority >= requiredPriority;
}

/**
 * 获取KB文件的物理路径
 */
function getKbFilePath(filename, level) {
  const subdir = LEVEL_TO_DIR[level];
  if (!subdir) return null;
  return path.join(KB_STORE, subdir, filename);
}

/**
 * 计算文件MD5（用于ETag）
 */
function fileMd5(filepath) {
  try {
    const content = fs.readFileSync(filepath);
    return crypto.createHash('md5').update(content).digest('hex');
  } catch (e) {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// 路由：GET /api/kb/list
// 列出当前用户可访问的KB文件
// ═══════════════════════════════════════════════════════════════
router.get('/list', auth, (req, res) => {
  const userMaxLevel = getUserMaxLevel(req.userRoles);

  const accessibleFiles = [];

  for (const [filename, info] of Object.entries(KB_LEVELS)) {
    if (canAccessLevel(userMaxLevel, info.level)) {
      accessibleFiles.push({
        filename,
        level: info.level,
        desc: info.desc,
        accessible: true,
      });
    }
  }

  // 按级别排序
  accessibleFiles.sort((a, b) => {
    const pa = LEVEL_PRIORITY[a.level] || 0;
    const pb = LEVEL_PRIORITY[b.level] || 0;
    if (pa !== pb) return pa - pb;
    return a.filename.localeCompare(b.filename);
  });

  res.set('Cache-Control', 'private, max-age=300'); // 列表缓存5分钟
  res.json({
    total: accessibleFiles.length,
    userMaxLevel,
    files: accessibleFiles,
  });
});

// ═══════════════════════════════════════════════════════════════
// 路由：GET /api/kb/meta/:filename
// 获取KB文件元信息（无需鉴权即可查看元信息，但不返回内容）
// ═══════════════════════════════════════════════════════════════
router.get('/meta/:filename', auth, (req, res) => {
  const filename = req.params.filename;

  // 安全校验
  if (!isSafeFilename(filename)) {
    return res.status(400).json({ error: 'INVALID_FILENAME', message: '非法文件名' });
  }

  const kbInfo = KB_LEVELS[filename];
  if (!kbInfo) {
    return res.status(404).json({ error: 'KB_NOT_FOUND', message: '知识库文件不存在' });
  }

  const userMaxLevel = getUserMaxLevel(req.userRoles);
  const accessible = canAccessLevel(userMaxLevel, kbInfo.level);

  // 构建元信息
  const meta = {
    filename,
    level: kbInfo.level,
    desc: kbInfo.desc,
    accessible,
    userMaxLevel,
  };

  // 如果可访问，附加文件大小和MD5
  if (accessible) {
    const filePath = getKbFilePath(filename, kbInfo.level);
    if (filePath && fs.existsSync(filePath)) {
      const stat = fs.statSync(filePath);
      meta.size = stat.size;
      meta.mtime = stat.mtime.toISOString();
      meta.md5 = fileMd5(filePath);
    } else {
      // 回退到原始 knowledge 目录
      const legacyPath = path.join(__dirname, '..', 'knowledge', filename);
      if (fs.existsSync(legacyPath)) {
        const stat = fs.statSync(legacyPath);
        meta.size = stat.size;
        meta.mtime = stat.mtime.toISOString();
        meta.md5 = fileMd5(legacyPath);
        meta.source = 'legacy';
      }
    }
  } else {
    // 不可访问时提示所需级别
    meta.requiredLevel = kbInfo.level;
    meta.message = `需要 ${kbInfo.level} 级别权限才能访问此内容`;
  }

  res.set('Cache-Control', 'private, max-age=300');
  res.json(meta);
});

// ═══════════════════════════════════════════════════════════════
// 路由：GET /api/kb/:filename
// 获取KB文件内容（带角色鉴权）
// ═══════════════════════════════════════════════════════════════
router.get('/:filename', auth, (req, res) => {
  const filename = req.params.filename;

  // 安全校验：路径遍历防护
  if (!isSafeFilename(filename)) {
    return res.status(400).json({ error: 'INVALID_FILENAME', message: '非法文件名' });
  }

  // 查找KB配置
  const kbInfo = KB_LEVELS[filename];
  if (!kbInfo) {
    return res.status(404).json({ error: 'KB_NOT_FOUND', message: '知识库文件不存在' });
  }

  // 权限检查
  const userMaxLevel = getUserMaxLevel(req.userRoles);
  if (!canAccessLevel(userMaxLevel, kbInfo.level)) {
    return res.status(403).json({
      error: 'KB_FORBIDDEN',
      message: `您的会员等级不足以访问此内容`,
      requiredLevel: kbInfo.level,
      userLevel: userMaxLevel,
      desc: kbInfo.desc,
    });
  }

  // 定位文件
  let filePath = getKbFilePath(filename, kbInfo.level);
  let source = 'kb-store';

  // 优先从 kb-store 读取，回退到原始 knowledge 目录
  if (!filePath || !fs.existsSync(filePath)) {
    filePath = path.join(__dirname, '..', 'knowledge', filename);
    source = 'legacy';
  }

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'KB_FILE_MISSING', message: '知识库文件未部署' });
  }

  // 读取文件内容
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf-8');
  } catch (e) {
    console.error(`[KB-API] 读取文件失败: ${filename}`, e);
    return res.status(500).json({ error: 'KB_READ_ERROR', message: '读取知识库文件失败' });
  }

  // 计算ETag
  const etag = fileMd5(filePath);
  if (etag && req.headers['if-none-match'] === etag) {
    return res.status(304).end();
  }

  // 设置响应头
  res.set('Content-Type', 'application/javascript; charset=utf-8');
  res.set('Cache-Control', `private, max-age=${CACHE_MAX_AGE}`);
  if (etag) {
    res.set('ETag', etag);
  }
  res.set('X-KB-Level', kbInfo.level);
  res.set('X-KB-Source', source);

  res.send(content);
});

// ═══════════════════════════════════════════════════════════════
// 错误处理
// ═══════════════════════════════════════════════════════════════
router.use((err, req, res, next) => {
  console.error('[KB-API] 未捕获错误:', err);
  res.status(500).json({ error: 'KB_INTERNAL_ERROR', message: '知识库服务内部错误' });
});

module.exports = router;
