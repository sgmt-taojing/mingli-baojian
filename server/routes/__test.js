const router = require('express').Router();
router.get('/health', (req, res) => res.json({ ok: true, routes_loaded: true }));
module.exports = router;
