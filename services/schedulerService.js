const { sequelize } = require('../config/database');
const { Booking, LibrarySeat, UserCredit } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

// 处理超时未签到的预约
const processExpiredBookings = async () => {
  const transaction = await sequelize.transaction();
  
  try {
    const now = new Date();
    
    // 查找超时未签到的预约（开始时间+15分钟后仍未签到）
    const expiredBookings = await Booking.findAll({
      where: {
        status: 'booked',
        date: { [Op.lte]: now },
        startTime: { [Op.lte]: now }
      },
      transaction
    });
    
    for (const booking of expiredBookings) {
      const bookingDateTime = new Date(`${booking.date} ${booking.startTime}`);
      const expireTime = new Date(bookingDateTime.getTime() + 15 * 60 * 1000);
      
      if (now > expireTime) {
        // 更新预约状态为取消
        booking.status = 'cancelled';
        booking.cancelReason = 'timeout';
        await booking.save({ transaction });
        
        // 释放座位
        await LibrarySeat.update(
          { status: 'available' },
          { where: { id: booking.seatId }, transaction }
        );
        
        // 增加用户爽约次数
        const [userCredit] = await UserCredit.findOrCreate({
          where: { userId: booking.userId },
          defaults: { absentCount: 0 },
          transaction
        });
        
        userCredit.absentCount += 1;
        
        // 爽约3次封禁7天
        if (userCredit.absentCount >= 3) {
          userCredit.bannedUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        }
        
        await userCredit.save({ transaction });
        
        logger.info(`预约超时取消 - 预约ID: ${booking.id}, 用户: ${booking.userId}`);
      }
    }
    
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    logger.error('处理超时预约失败:', error);
  }
};

// 检查并解除封禁
const processUnbanUsers = async () => {
  try {
    const now = new Date();
    
    const bannedUsers = await UserCredit.findAll({
      where: {
        bannedUntil: { [Op.lte]: now, [Op.ne]: null }
      }
    });
    
    for (const credit of bannedUsers) {
      credit.bannedUntil = null;
      credit.absentCount = 0;
      await credit.save();
      logger.info(`用户解封 - 用户ID: ${credit.userId}`);
    }
  } catch (error) {
    logger.error('处理解封失败:', error);
  }
};

// 启动定时任务
const startScheduler = () => {
  // 每分钟执行一次
  setInterval(async () => {
    await processExpiredBookings();
    await processUnbanUsers();
  }, 60 * 1000);
  
  logger.info('✅ 定时任务调度器已启动');
};

module.exports = { startScheduler, processExpiredBookings, processUnbanUsers };