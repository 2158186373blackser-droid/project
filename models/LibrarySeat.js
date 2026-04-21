const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const LibrarySeat = sequelize.define('LibrarySeat', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  seatNo: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'seat_no',
    comment: '座位号'
  },
  floor: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '楼层'
  },
  area: {
    type: DataTypes.STRING(50),
    comment: '区域'
  },
  status: {
    type: DataTypes.ENUM('available', 'booked', 'maintenance'),
    defaultValue: 'available',
    comment: '座位状态'
  }
}, {
  tableName: 'library_seats',
  comment: '图书馆座位表'
});

module.exports = LibrarySeat;