const { User, UserCredit, OperationLog } = require('../../models');
const { Op } = require('sequelize');
const logger = require('../../utils/logger');

// 获取用户列表（支持封禁状态筛选）
const getUserList = async (req, res, next) => {
  try {
    const { keyword, status, page = 1, pageSize = 20 } = req.query;
    const where = {};
    if (keyword) where[Op.or] = [{ username: { [Op.like]: `%${keyword}%` } }, { email: { [Op.like]: `%${keyword}%` } }];
    if (status) where.status = status;
    
    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      include: [{ model: UserCredit, attributes: ['absentCount', 'bannedUntil'] }],
      limit: parseInt(pageSize),
      offset: (parseInt(page) - 1) * parseInt(pageSize)
    });
    res.json({ code: 200, data: { list: rows, total: count } });
  } catch (error) { next(error); }
};

// 封禁/解封用户
const toggleUserBan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, banDays } = req.body; // action: 'ban' 或 'unban'
    const adminId = req.userId;
    const adminUsername = req.username;
    
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ code: 404, msg: '用户不存在' });
    
    const beforeStatus = user.status;
    if (action === 'ban') {
      user.status = 'locked';
      await user.save();
      const banUntil = new Date(Date.now() + (banDays || 7) * 24 * 60 * 60 * 1000);
      await UserCredit.upsert({ userId: user.id, bannedUntil: banUntil });
    } else {
      user.status = 'active';
      await user.save();
      await UserCredit.update({ bannedUntil: null }, { where: { userId: user.id } });
    }
    
    // 操作日志
    await OperationLog.create({
      adminId, adminUsername,
      operationType: action === 'ban' ? 'ban_user' : 'unban_user',
      targetType: 'user', targetId: user.id,
      beforeSnapshot: { status: beforeStatus },
      afterSnapshot: { status: user.status },
      ipAddress: req.ip, userAgent: req.headers['user-agent']
    });
    
    res.json({ code: 200, msg: action === 'ban' ? '封禁成功' : '解封成功' });
  } catch (error) { next(error); }
};

module.exports = { getUserList, toggleUserBan };