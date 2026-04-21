const { Goods, User, Wallet, Transaction, sequelize } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const sensitiveWordFilter = require('../services/sensitiveWordFilter');
const { toDecimal } = require('../utils/decimalUtils'); // 高精度计算工具

// XSS 简单过滤
const xssFilter = (text) => {
  if (!text) return text;
  return String(text)
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// 发布商品
const publishGoods = async (req, res, next) => {
  try {
    const { title, description, price, category, images } = req.body;
    const userId = req.userId;

    // 长度校验
    if (!title || title.length > 50) {
      return res.status(400).json({ code: 400, msg: '标题长度应在1-50字符之间' });
    }
    if (description && description.length > 1000) {
      return res.status(400).json({ code: 400, msg: '描述长度不能超过1000字符' });
    }
    // 金额校验
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0.01 || priceNum > 9999) {
      return res.status(400).json({ code: 400, msg: '价格需在0.01-9999元之间' });
    }
    if (!category) {
      return res.status(400).json({ code: 400, msg: '请选择分类' });
    }

    // XSS过滤
    const cleanTitle = xssFilter(title.trim());
    const cleanDesc = description ? xssFilter(description.trim()) : '';

    // 敏感词过滤（标题+描述）
    const titleCheck = await sensitiveWordFilter.filter(cleanTitle);
    const descCheck = await sensitiveWordFilter.filter(cleanDesc);
    if (titleCheck.hasBlockWord || descCheck.hasBlockWord) {
      return res.status(400).json({ code: 400, msg: '内容包含不当信息，请修改后重试' });
    }
    let status = 'active';
    if (titleCheck.needReview || descCheck.needReview) {
      status = 'inactive'; // 待审核状态，此处简化处理为下架，可由管理员审核后上架
    }

    // 图片数量限制（最多9张）
    let imageList = [];
    if (images && Array.isArray(images)) {
      imageList = images.slice(0, 9);
    }

    const goods = await Goods.create({
      sellerId: userId,
      title: cleanTitle,
      description: cleanDesc,
      price: priceNum,
      category,
      images: imageList,
      status
    });

    res.json({
      code: 200,
      msg: status === 'active' ? '发布成功' : '发布成功，等待审核',
      data: { id: goods.id }
    });
  } catch (error) {
    logger.error('发布商品错误:', error);
    next(error);
  }
};

// 获取商品列表（支持市场模式/我的商品模式）
const getGoodsList = async (req, res, next) => {
  try {
    const { keyword, category, page = 1, pageSize = 12, my } = req.query;
    const userId = req.userId;

    const where = {};

    if (my === '1') {
      // 我的商品模式：显示当前用户的所有商品（包括已下架）
      where.sellerId = userId;
    } else {
      // 公开市场模式：只显示在售商品
      where.status = 'active';
      if (keyword) {
        where[Op.or] = [
          { title: { [Op.like]: `%${keyword}%` } },
          { description: { [Op.like]: `%${keyword}%` } }
        ];
      }
      if (category) where.category = category;
    }

    const { count, rows } = await Goods.findAndCountAll({
      where,
      include: [
        { model: User, as: 'seller', attributes: ['id', 'username'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(pageSize),
      offset: (parseInt(page) - 1) * parseInt(pageSize)
    });

    res.json({
      code: 200,
      data: { list: rows, total: count, page: parseInt(page), pageSize: parseInt(pageSize) }
    });
  } catch (error) {
    logger.error('获取商品列表错误:', error);
    next(error);
  }
};

// 获取商品详情
const getGoodsDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const goods = await Goods.findByPk(id, {
      include: [{ model: User, as: 'seller', attributes: ['id', 'username'] }]
    });
    if (!goods) {
      return res.status(404).json({ code: 404, msg: '商品不存在' });
    }

    // 增加浏览次数
    goods.viewCount += 1;
    await goods.save();

    res.json({ code: 200, data: goods });
  } catch (error) {
    logger.error('获取商品详情错误:', error);
    next(error);
  }
};

// 购买商品（简化版：直接扣款，状态改为sold，实际应走订单流程）
const buyGoods = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const userId = req.userId;

    const goods = await Goods.findByPk(id, { transaction });
    if (!goods) {
      await transaction.rollback();
      return res.status(404).json({ code: 404, msg: '商品不存在' });
    }
    if (goods.status !== 'active') {
      await transaction.rollback();
      return res.status(400).json({ code: 400, msg: '商品已售出或已下架' });
    }
    if (goods.sellerId === userId) {
      await transaction.rollback();
      return res.status(400).json({ code: 400, msg: '不能购买自己的商品' });
    }

    // 获取买家钱包
    const buyerWallet = await Wallet.findOne({ where: { userId }, transaction });
    if (!buyerWallet) {
      await transaction.rollback();
      return res.status(400).json({ code: 400, msg: '买家钱包不存在' });
    }

    const amount = toDecimal(goods.price);
    if (toDecimal(buyerWallet.balance).lessThan(amount)) {
      await transaction.rollback();
      return res.status(400).json({ code: 400, msg: '余额不足' });
    }

    // 扣款并转入卖家钱包
    buyerWallet.balance = toDecimal(buyerWallet.balance).minus(amount).toFixed(2);
    await buyerWallet.save({ transaction });

    const sellerWallet = await Wallet.findOne({ where: { userId: goods.sellerId }, transaction });
    if (sellerWallet) {
      sellerWallet.balance = toDecimal(sellerWallet.balance).plus(amount).toFixed(2);
      await sellerWallet.save({ transaction });
    }

    // 创建交易记录
    await Transaction.create({
      fromUserId: userId,
      toUserId: goods.sellerId,
      amount: amount.toFixed(2),
      type: 'payment'
    }, { transaction });

    // 更新商品状态
    goods.status = 'sold';
    await goods.save({ transaction });

    await transaction.commit();
    res.json({ code: 200, msg: '购买成功' });
  } catch (error) {
    await transaction.rollback();
    logger.error('购买商品错误:', error);
    next(error);
  }
};

// 下架商品（卖家操作）
const shelveGoods = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const goods = await Goods.findByPk(id);
    if (!goods) {
      return res.status(404).json({ code: 404, msg: '商品不存在' });
    }
    if (goods.sellerId !== userId) {
      return res.status(403).json({ code: 403, msg: '无权操作此商品' });
    }
    if (goods.status === 'inactive') {
      return res.status(400).json({ code: 400, msg: '商品已下架' });
    }

    goods.status = 'inactive';
    await goods.save();

    res.json({ code: 200, msg: '下架成功' });
  } catch (error) {
    logger.error('下架商品错误:', error);
    next(error);
  }
};

module.exports = {
  publishGoods,
  getGoodsList,
  getGoodsDetail,
  buyGoods,
  shelveGoods
};