const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Booking = sequelize.define('Booking', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    comment: '预约人ID'
  },
  seatId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'seat_id',
    comment: '座位ID'
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: '预约日期'
  },
  startTime: {
    type: DataTypes.TIME,
    allowNull: false,
    field: 'start_time',
    comment: '开始时间'
  },
  endTime: {
    type: DataTypes.TIME,
    allowNull: false,
    field: 'end_time',
    comment: '结束时间'
  },
  status: {
    type: DataTypes.ENUM('booked', 'checked_in', 'completed', 'cancelled', 'absent'),
    defaultValue: 'booked',
    comment: '预约状态'
  },
  cancelReason: {
    type: DataTypes.ENUM('user', 'timeout', 'admin'),
    field: 'cancel_reason',
    comment: '取消原因'
  },
  checkInTime: {
    type: DataTypes.DATE,
    field: 'check_in_time',
    comment: '签到时间'
  }
}, {
  tableName: 'bookings',
  comment: '座位预约表'
});

module.exports = Booking;