const { Order, User, Wallet, Transaction, sequelize } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const { encrypt, decrypt, maskPickupCode } = require('../utils/encrypt');

// 生成订单编号
const generateOrderNo = () => {
  return 'ORD' + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase();
};

// 发布订单
const publishOrder = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { pickupCode, pickupAddress, deliveryAddress, amount, deadline } = req.body;
    const userId = req.userId;

    if (!pickupCode || !pickupAddress || !deliveryAddress || !amount || !deadline) {
      return res.status(400).json({ code: 400, msg: '请填写完整的订单信息' });
    }

    const amountNum = parseFloat(amount);
    if (amountNum < 0.1 || amountNum > 50) {
      return res.status(400).json({ code: 400, msg: '报酬金额需在0.1-50元之间' });
    }

    const deadlineTime = new Date(deadline);
    const minDeadline = new Date(Date.now() + 30 * 60 * 1000);
    if (deadlineTime <= minDeadline) {
      return res.status(400).json({ code: 400, msg: '截止时间至少需晚于当前时间30分钟' });
    }

    const activeOrdersCount = await Order.count({
      where: {
        publisherId: userId,
        status: { [Op.in]: ['pending', 'accepted', 'picked', 'delivered'] }
      }
    });
    if (activeOrdersCount >= 5) {
      return res.status(400).json({ code: 400, msg: '你当前进行中的订单已达上限' });
    }

    const order = await Order.create({
      orderNo: generateOrderNo(),
      publisherId: userId,
      pickupCode: pickupCode.replace(/\s/g, ''),
      pickupAddress,
      deliveryAddress,
      amount: amountNum,
      deadline: deadlineTime,
      status: 'pending'
    }, { transaction });

    await transaction.commit();
    logger.info(`订单发布成功 - 订单号: ${order.orderNo}`);
    res.json({ code: 200, msg: '订单发布成功', data: { orderNo: order.orderNo } });
  } catch (error) {
    await transaction.rollback();
    logger.error('发布订单错误:', error);
    next(error);
  }
};

// 获取订单列表（支持大厅模式 / 我的订单）
const getOrderList = async (req, res, next) => {
  try {
    const { status, page = 1, pageSize = 20, scope = 'all' } = req.query;
    const userId = req.userId;

    // 构建基础查询条件
    let whereClause = '';
    const replacements = {};

    if (scope === 'mine') {
      whereClause = `(o.publisher_id = :userId OR o.receiver_id = :userId)`;
      replacements.userId = userId;
    } else {
      whereClause = `o.status = 'pending'`;
    }

    if (status && scope !== 'mine') {
      whereClause = `o.status = :status`;
      replacements.status = status;
    }

    // 计算总数
    const countQuery = `
      SELECT COUNT(*) as total
      FROM orders o
      WHERE ${whereClause}
    `;
    const [countResult] = await sequelize.query(countQuery, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    });
    const total = countResult.total;

    // 分页查询数据
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const dataQuery = `
      SELECT 
        o.id,
        o.order_no AS orderNo,
        o.publisher_id AS publisherId,
        o.receiver_id AS receiverId,
        o.pickup_code AS pickupCode,
        o.pickup_address AS pickupAddress,
        o.delivery_address AS deliveryAddress,
        o.amount,
        o.deadline,
        o.status,
        o.picked_at AS pickedAt,
        o.delivered_at AS deliveredAt,
        o.completed_at AS completedAt,
        o.auto_confirm_at AS autoConfirmAt,
        o.complaint_reason AS complaintReason,
        o.created_at AS createdAt,
        o.updated_at AS updatedAt,
        u1.id AS 'publisher.id',
        u1.username AS 'publisher.username',
        u2.id AS 'receiver.id',
        u2.username AS 'receiver.username'
      FROM orders o
      LEFT JOIN users u1 ON o.publisher_id = u1.id
      LEFT JOIN users u2 ON o.receiver_id = u2.id
      WHERE ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT :offset, :limit
    `;

    const orders = await sequelize.query(dataQuery, {
      replacements: { ...replacements, offset, limit: parseInt(pageSize) },
      type: sequelize.QueryTypes.SELECT
    });

    // 脱敏处理
    const processedOrders = orders.map(order => {
      const plain = { ...order, publisher: { id: order['publisher.id'], username: order['publisher.username'] }, receiver: order['receiver.id'] ? { id: order['receiver.id'], username: order['receiver.username'] } : null };
      delete plain['publisher.id']; delete plain['publisher.username']; delete plain['receiver.id']; delete plain['receiver.username'];
      
      if (plain.status === 'pending') {
        plain.pickupCode = maskPickupCode(plain.pickupCode);
      }
      if (plain.receiverId !== userId && plain.publisherId !== userId) {
        plain.pickupCode = maskPickupCode(plain.pickupCode);
      }
      return plain;
    });

    res.json({
      code: 200,
      data: { list: processedOrders, total, page: parseInt(page), pageSize: parseInt(pageSize) }
    });
  } catch (error) {
    logger.error('获取订单列表错误:', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
};

// 获取订单详情
const getOrderDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const order = await Order.findByPk(id, {
      include: [
        { model: User, as: 'publisher', attributes: ['id', 'username'] },
        { model: User, as: 'receiver', attributes: ['id', 'username'] }
      ]
    });
    if (!order) return res.status(404).json({ code: 404, msg: '订单不存在' });

    const plain = order.toJSON();
    if (plain.publisherId !== userId && plain.receiverId !== userId) {
      plain.pickupCode = maskPickupCode(plain.pickupCode);
    }
    res.json({ code: 200, data: plain });
  } catch (error) {
    logger.error('获取订单详情错误:', error);
    next(error);
  }
};

// 接单
// 接单
const acceptOrder = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const userId = req.userId;
    const order = await Order.findByPk(id, { transaction });
    
    console.log('=== 接单调试信息 ===');
    console.log('订单ID:', id);
    console.log('当前用户ID:', userId);
    console.log('订单发布者ID:', order?.publisherId);
    console.log('订单状态:', order?.status);
    console.log('订单截止时间:', order?.deadline);
    console.log('当前时间:', new Date());
    
    if (!order) {
      console.log('错误: 订单不存在');
      throw new Error('订单不存在');
    }
    if (order.publisherId === userId) {
      console.log('错误: 不能接自己的订单');
      throw new Error('不能接自己的订单');
    }
    if (order.status !== 'pending') {
      console.log('错误: 订单状态不是pending，当前为', order.status);
      throw new Error('订单已被接单或已失效');
    }
    if (new Date() > new Date(order.deadline)) {
      console.log('错误: 订单已超时');
      throw new Error('订单已超时');
    }

    const activeCount = await Order.count({
      where: { receiverId: userId, status: { [Op.in]: ['accepted', 'picked'] } }
    });
    console.log('当前用户进行中订单数:', activeCount);
    
    if (activeCount >= 3) {
      console.log('错误: 接单已达上限');
      throw new Error('你当前接单已达上限');
    }

    order.receiverId = userId;
    order.status = 'accepted';
    await order.save({ transaction });
    await transaction.commit();
    
    console.log('接单成功');
    res.json({ code: 200, msg: '接单成功' });
  } catch (error) {
    await transaction.rollback();
    console.error('接单失败:', error.message);
    res.status(400).json({ code: 400, msg: error.message });
  }
};

// 确认取件
const confirmPickup = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const order = await Order.findByPk(id);
    if (!order) return res.status(404).json({ code: 404, msg: '订单不存在' });
    if (order.receiverId !== userId) return res.status(403).json({ code: 403, msg: '只有接单人可以确认取件' });
    if (order.status !== 'accepted') return res.status(400).json({ code: 400, msg: '当前状态无法确认取件' });

    order.status = 'picked';
    order.pickedAt = new Date();
    await order.save();
    logger.info(`确认取件 - 订单ID: ${id}`);
    res.json({ code: 200, msg: '确认取件成功' });
  } catch (error) {
    logger.error('确认取件错误:', error);
    next(error);
  }
};

// 确认送达
const confirmDelivery = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const order = await Order.findByPk(id);
    if (!order) return res.status(404).json({ code: 404, msg: '订单不存在' });
    if (order.receiverId !== userId) return res.status(403).json({ code: 403, msg: '只有接单人可以确认送达' });
    if (order.status !== 'picked') return res.status(400).json({ code: 400, msg: '请先确认取件' });

    order.status = 'delivered';
    order.deliveredAt = new Date();
    order.autoConfirmAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
    await order.save();
    logger.info(`确认送达 - 订单ID: ${id}`);
    res.json({ code: 200, msg: '确认送达成功' });
  } catch (error) {
    logger.error('确认送达错误:', error);
    next(error);
  }
};

// 确认收货（资金结算）
const confirmComplete = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const userId = req.userId;
    const order = await Order.findByPk(id, { transaction });
    if (!order) throw new Error('订单不存在');
    if (order.publisherId !== userId) throw new Error('只有发单人可以确认收货');
    if (order.status !== 'delivered') throw new Error('请等待接单人确认送达');

    order.status = 'completed';
    order.completedAt = new Date();
    await order.save({ transaction });

    if (order.receiverId) {
      const publisherWallet = await Wallet.findOne({ where: { userId: order.publisherId }, transaction });
      const receiverWallet = await Wallet.findOne({ where: { userId: order.receiverId }, transaction });
      if (publisherWallet && receiverWallet) {
        const amount = parseFloat(order.amount);
        if (publisherWallet.balance < amount) throw new Error('发单人余额不足');
        publisherWallet.balance -= amount;
        receiverWallet.balance += amount;
        await publisherWallet.save({ transaction });
        await receiverWallet.save({ transaction });
        await Transaction.create({
          fromUserId: order.publisherId,
          toUserId: order.receiverId,
          orderId: order.id,
          amount: amount,
          type: 'payment'
        }, { transaction });
      }
    }

    await transaction.commit();
    logger.info(`订单完成 - 订单ID: ${id}`);
    res.json({ code: 200, msg: '确认收货成功，资金已结算' });
  } catch (error) {
    await transaction.rollback();
    res.status(400).json({ code: 400, msg: error.message });
  }
};

// 发起投诉
const fileComplaint = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.userId;
    const order = await Order.findByPk(id);
    if (!order) return res.status(404).json({ code: 404, msg: '订单不存在' });
    if (order.publisherId !== userId && order.receiverId !== userId) {
      return res.status(403).json({ code: 403, msg: '无权操作此订单' });
    }
    if (order.status === 'completed' || order.status === 'cancelled') {
      return res.status(400).json({ code: 400, msg: '订单已完成或已取消，无法投诉' });
    }
    order.status = 'dispute';
    order.complaintReason = reason;
    order.autoConfirmAt = null;
    await order.save();
    logger.info(`订单投诉 - 订单ID: ${id}, 投诉人: ${userId}`);
    res.json({ code: 200, msg: '投诉已提交，平台将尽快处理' });
  } catch (error) {
    logger.error('投诉错误:', error);
    next(error);
  }
};

module.exports = {
  publishOrder,
  getOrderList,
  getOrderDetail,
  acceptOrder,
  confirmPickup,
  confirmDelivery,
  confirmComplete,
  fileComplaint
};