const express = require('express');
const router = express.Router();
const { getNewsList, getNewsDetail } = require('../controllers/newsController');

// 公开访问，不需要认证
router.get('/list', getNewsList);
router.get('/:id', getNewsDetail);

module.exports = router;