const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Wallet = sequelize.define('Wallet', {
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
  balance: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '可用余额'
  },
  frozenAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'frozen_amount',
    comment: '冻结金额'
  }
}, {
  tableName: 'wallets',
  comment: '用户钱包表'
});

module.exports = Wallet;