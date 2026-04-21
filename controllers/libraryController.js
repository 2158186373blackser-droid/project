const { LibrarySeat, Booking, UserCredit } = require('../models');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

// 获取可用座位
const getSeats = async (req, res, next) => {
  try {
    const { floor, date } = req.query;
    
    const where = {};
    if (floor) where.floor = floor;
    
    const seats = await LibrarySeat.findAll({ where });
    
    // 查询已预约的座位
    if (date) {
      const bookings = await Booking.findAll({
        where: {
          date,
          status: { [Op.in]: ['booked', 'checked_in'] }
        }
      });
      
      const bookedSeatIds = bookings.map(b => b.seatId);
      seats.forEach(seat => {
        if (bookedSeatIds.includes(seat.id)) {
          seat.status = 'booked';
        }
      });
    }
    
    res.json({ code: 200, data: seats });
  } catch (error) {
    logger.error('获取座位失败:', error);
    next(error);
  }
};

// 预约座位
const bookSeat = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { seatId, date, startTime, endTime } = req.body;
    const userId = req.userId;
    
    // 检查是否被封禁
    const userCredit = await UserCredit.findOne({ where: { userId }, transaction });
    if (userCredit && userCredit.bannedUntil && new Date() < userCredit.bannedUntil) {
      return res.status(403).json({ code: 403, msg: '你因累计爽约三次已被限制预约，请在七天后重试' });
    }
    
    // 检查当天是否已有预约
    const todayBooking = await Booking.findOne({
      where: {
        userId,
        date,
        status: { [Op.in]: ['booked', 'checked_in'] }
      },
      transaction
    });
    
    if (todayBooking) {
      return res.status(400).json({ code: 400, msg: '你今天已有预约记录，每人每日仅限预约一次' });
    }
    
    // 检查是否有进行中的预约
    const activeBooking = await Booking.findOne({
      where: {
        userId,
        status: { [Op.in]: ['booked', 'checked_in'] }
      },
      transaction
    });
    
    if (activeBooking) {
      return res.status(400).json({ code: 400, msg: '你当前已有一笔进行中的预约，请先使用或取消现有预约后再预约新时段' });
    }
    
    // 校验预约时长（1-8小时）
    const start = new Date(`${date} ${startTime}`);
    const end = new Date(`${date} ${endTime}`);
    const hours = (end - start) / (1000 * 60 * 60);
    
    if (hours < 1 || hours > 8) {
      return res.status(400).json({ code: 400, msg: '预约时长必须在1-8小时之间' });
    }
    
    // 检查日期（只能预约今天和明天）
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    if (date !== today && date !== tomorrow) {
      return res.status(400).json({ code: 400, msg: '只能预约今天或明天的座位' });
    }
    
    // 检查座位是否可用
    const existingBooking = await Booking.findOne({
      where: {
        seatId,
        date,
        status: { [Op.in]: ['booked', 'checked_in'] },
        [Op.or]: [
          { startTime: { [Op.between]: [startTime, endTime] } },
          { endTime: { [Op.between]: [startTime, endTime] } }
        ]
      },
      transaction
    });
    
    if (existingBooking) {
      return res.status(400).json({ code: 400, msg: '该时段座位已被预约' });
    }
    
    // 创建预约
    const booking = await Booking.create({
      userId,
      seatId,
      date,
      startTime,
      endTime,
      status: 'booked'
    }, { transaction });
    
    await transaction.commit();
    
    res.json({ code: 200, msg: '预约成功', data: booking });
  } catch (error) {
    await transaction.rollback();
    logger.error('预约座位失败:', error);
    next(error);
  }
};

// 签到
const checkIn = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    
    const booking = await Booking.findOne({
      where: { id, userId, status: 'booked' }
    });
    
    if (!booking) {
      return res.status(404).json({ code: 404, msg: '预约不存在或状态异常' });
    }
    
    const now = new Date();
    const bookingDateTime = new Date(`${booking.date} ${booking.startTime}`);
    const deadline = new Date(bookingDateTime.getTime() + 15 * 60 * 1000);
    
    if (now > deadline) {
      return res.status(400).json({ code: 400, msg: '签到时间已过，预约已失效' });
    }
    
    booking.status = 'checked_in';
    booking.checkInTime = now;
    await booking.save();
    
    res.json({ code: 200, msg: '签到成功' });
  } catch (error) {
    logger.error('签到失败:', error);
    next(error);
  }
};

// 取消预约
const cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    
    const booking = await Booking.findOne({
      where: { id, userId, status: { [Op.in]: ['booked', 'checked_in'] } }
    });
    
    if (!booking) {
      return res.status(404).json({ code: 404, msg: '预约不存在或无法取消' });
    }
    
    booking.status = 'cancelled';
    booking.cancelReason = 'user';
    await booking.save();
    
    res.json({ code: 200, msg: '取消成功' });
  } catch (error) {
    logger.error('取消预约失败:', error);
    next(error);
  }
};

// 获取我的预约
const getMyBookings = async (req, res, next) => {
  try {
    const userId = req.userId;
    
    const bookings = await Booking.findAll({
      where: { userId },
      include: [{ model: LibrarySeat, attributes: ['seatNo', 'floor', 'area'] }],
      order: [['date', 'DESC'], ['startTime', 'DESC']]
    });
    
    res.json({ code: 200, data: bookings });
  } catch (error) {
    logger.error('获取预约列表失败:', error);
    next(error);
  }
};

// 获取用户信用信息
const getCredit = async (req, res, next) => {
  try {
    const userId = req.userId;
    
    const [credit] = await UserCredit.findOrCreate({
      where: { userId },
      defaults: { absentCount: 0 }
    });
    
    res.json({ code: 200, data: credit });
  } catch (error) {
    logger.error('获取信用信息失败:', error);
    next(error);
  }
};

// 提交申诉
const submitAppeal = async (req, res, next) => {
  try {
    const { bookingId, reason } = req.body;
    const userId = req.userId;
    
    const credit = await UserCredit.findOne({ where: { userId } });
    if (!credit) {
      return res.status(404).json({ code: 404, msg: '信用记录不存在' });
    }
    
    credit.appealReason = reason;
    credit.appealStatus = 'pending';
    await credit.save();
    
    res.json({ code: 200, msg: '申诉已提交，请等待审核' });
  } catch (error) {
    logger.error('提交申诉失败:', error);
    next(error);
  }
};

module.exports = {
  getSeats,
  bookSeat,
  checkIn,
  cancelBooking,
  getMyBookings,
  getCredit,
  submitAppeal
};