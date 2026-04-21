const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SensitiveWord = sequelize.define('SensitiveWord', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  word: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: '敏感词'
  },
  level: {
    type: DataTypes.ENUM('block', 'review'),
    defaultValue: 'review',
    comment: '等级：block直接拒绝/review待审核'
  }
}, {
  tableName: 'sensitive_words',
  comment: '敏感词库',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = SensitiveWord;