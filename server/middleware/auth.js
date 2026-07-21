const jwt = require('jsonwebtoken');
const SECRET = process.env.MINGLI_JWT_SECRET || 'dev-secret-change-me';
function auth(req, res, next) {
  const tok = (req.headers.authorization || '').replace(/^Bearer /, '') || req.query.token || req.query.t;
  if (!tok) return res.json({ error: 'AUTH_TOKEN_MISSING', message: '请先登录' });
  try {
    const u = jwt.verify(tok, SECRET);
    req.user = u;
    next();
  } catch (e) {
    return res.json({ error: 'AUTH_TOKEN_EXPIRED', message: '登录已过期' });
  }
}
function adminOnly(req, res, next) {
  auth(req, res, () => {
    if (!req.user || !(req.user.roles || []).includes('admin')) {
      return res.status(403).json({ error: 'FORBIDDEN', message: '需要管理员权限' });
    }
    next();
  });
}
module.exports = { auth, adminOnly };
