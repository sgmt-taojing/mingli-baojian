const express = require('express');
const { auth } = require('../middleware/auth');
const router = express.Router();
// yuanzhu 路由原在 api-server-v2.js 683-870 行
router.get('/list', auth, (req, res) => {
  // 委托给主 app 路由（用 path 兼容）
  req.url = '/api/yuanzhu/list';
  req.app._router.handle(req, res, () => {});
});
module.exports = router;
