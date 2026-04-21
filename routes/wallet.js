const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');

router.get('/', authMiddleware, (req, res) => {
  res.json({ code: 200, data: { balance: 100, frozenAmount: 0 } });
});

router.get('/transactions', authMiddleware, (req, res) => {
  res.json({ code: 200, data: [] });
});

module.exports = router;