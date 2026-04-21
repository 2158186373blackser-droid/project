const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const {
  publishGoods,
  getGoodsList,
  getGoodsDetail,
  buyGoods,
  shelveGoods
} = require('../controllers/goodsController');

// 获取商品列表（支持市场 / 我的商品）
router.get('/list', authMiddleware, getGoodsList);

// 获取商品详情
router.get('/:id', authMiddleware, getGoodsDetail);

// 发布商品
router.post('/publish', authMiddleware, publishGoods);

// 购买商品
router.post('/:id/buy', authMiddleware, buyGoods);

// 下架商品（卖家操作）
router.post('/:id/shelve', authMiddleware, shelveGoods);

module.exports = router;