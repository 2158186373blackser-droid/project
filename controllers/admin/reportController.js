const { Report, Post, Comment, Goods, User, OperationLog, sequelize } = require('../../models');
const { Op } = require('sequelize');
const logger = require('../../utils/logger');
const notificationService = require('../../services/notificationService');

// 获取举报列表（支持筛选）
const getReportList = async (req, res, next) => {
  try {
    const { status, targetType, page = 1, pageSize = 20 } = req.query;
    const where = {};
    if (status) where.status = status;
    if (targetType) where.targetType = targetType;
    
    const { count, rows } = await Report.findAndCountAll({
      where,
      include: [
        { model: User, as: 'reporter', attributes: ['id', 'username'] },
        { model: User, as: 'reportedUser', attributes: ['id', 'username'] }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(pageSize),
      offset: (parseInt(page) - 1) * parseInt(pageSize)
    });
    
    res.json({ code: 200, data: { list: rows, total: count } });
  } catch (error) { next(error); }
};

// 获取举报详情（含上下文）
const getReportDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const report = await Report.findByPk(id, {
      include: [
        { model: User, as: 'reporter', attributes: ['id', 'username'] },
        { model: User, as: 'reportedUser', attributes: ['id', 'username'] }
      ]
    });
    if (!report) return res.status(404).json({ code: 404, msg: '举报不存在' });
    
    // 根据类型获取完整内容
    let targetContent = null;
    if (report.targetType === 'post') targetContent = await Post.findByPk(report.targetId);
    else if (report.targetType === 'comment') targetContent = await Comment.findByPk(report.targetId);
    else if (report.targetType === 'goods') targetContent = await Goods.findByPk(report.targetId);
    
    res.json({ code: 200, data: { report, targetContent } });
  } catch (error) { next(error); }
};

// 处理举报（内容删除/下架 + 用户处罚 + 通知 + 日志）
const handleReport = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { action, reason, banDays } = req.body; // action: delete_content, ban_user, both, ignore
    const adminId = req.userId;
    const adminUsername = req.username;
    
    const report = await Report.findByPk(id, { transaction });
    if (!report || report.status !== 'pending') {
      await transaction.rollback();
      return res.status(400).json({ code: 400, msg: '举报不存在或已处理' });
    }
    
    // 内容级操作
    if (action === 'delete_content' || action === 'both') {
      if (report.targetType === 'post') {
        await Post.update({ isDeleted: true, deletedAt: new Date() }, { where: { id: report.targetId }, transaction });
      } else if (report.targetType === 'comment') {
        await Comment.update({ isDeleted: true, deletedAt: new Date() }, { where: { id: report.targetId }, transaction });
      } else if (report.targetType === 'goods') {
        await Goods.update({ status: 'inactive' }, { where: { id: report.targetId }, transaction });
      }
    }
    
    // 用户级操作
    if (action === 'ban_user' || action === 'both') {
      const banUntil = new Date(Date.now() + (banDays || 7) * 24 * 60 * 60 * 1000);
      await User.update({ status: 'locked' }, { where: { id: report.reportedUserId }, transaction });
      // 记录封禁信息到 user_credits
      await sequelize.models.UserCredit.upsert(
        { userId: report.reportedUserId, bannedUntil: banUntil },
        { transaction }
      );
    }
    
    // 更新举报状态
    report.status = (action === 'ignore') ? 'processed_invalid' : 'processed_valid';
    report.handlerId = adminId;
    report.handleResult = reason || '已处理';
    report.handledAt = new Date();
    await report.save({ transaction });
    
    // 记录操作日志
    await OperationLog.create({
      adminId, adminUsername,
      operationType: 'handle_report',
      targetType: 'report',
      targetId: report.id,
      beforeSnapshot: { status: 'pending' },
      afterSnapshot: { status: report.status, action },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    }, { transaction });
    
    await transaction.commit();
    
    // 发送站内通知
    await notificationService.sendSystemNotification(
      report.reportedUserId,
      `关于你发布的${getTargetTypeName(report.targetType)}的处理通知`,
      `你的内容因“${report.reason}”被举报，经审核已进行处理。如有疑问可申诉。`
    );
    
    res.json({ code: 200, msg: '处理成功' });
  } catch (error) {
    await transaction.rollback();
    logger.error('处理举报失败:', error);
    next(error);
  }
};

const getTargetTypeName = (type) => ({ post: '帖子', comment: '评论', goods: '商品' }[type] || '内容');

module.exports = { getReportList, getReportDetail, handleReport };