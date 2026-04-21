const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserCredit = sequelize.define('UserCredit', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    field: 'user_id',
    comment: '用户ID'
  },
  absentCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'absent_count',
    comment: '爽约次数'
  },
  bannedUntil: {
    type: DataTypes.DATE,
    field: 'banned_until',
    comment: '封禁截止时间'
  },
  appealReason: {
    type: DataTypes.TEXT,
    field: 'appeal_reason',
    comment: '申诉理由'
  },
  appealStatus: {
    type: DataTypes.ENUM('none', 'pending', 'approved', 'rejected'),
    defaultValue: 'none',
    field: 'appeal_status',
    comment: '申诉状态'
  }
}, {
  tableName: 'user_credits',
  comment: '用户信用表'
});

module.exports = UserCredit;