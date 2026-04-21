const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Report = sequelize.define('Report', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  targetType: { type: DataTypes.ENUM('post', 'comment', 'goods', 'user'), allowNull: false, field: 'target_type', comment: '举报目标类型' },
  targetId: { type: DataTypes.INTEGER, allowNull: false, field: 'target_id', comment: '目标ID' },
  reporterId: { type: DataTypes.INTEGER, allowNull: false, field: 'reporter_id', comment: '举报人ID' },
  reportedUserId: { type: DataTypes.INTEGER, allowNull: false, field: 'reported_user_id', comment: '被举报人ID' },
  reason: { type: DataTypes.ENUM('spam', 'abuse', 'porn', 'fraud', 'other'), allowNull: false, comment: '举报原因' },
  description: { type: DataTypes.STRING(200), comment: '补充说明' },
  status: { type: DataTypes.ENUM('pending', 'processed_valid', 'processed_invalid'), defaultValue: 'pending', comment: '处理状态' },
  handlerId: { type: DataTypes.INTEGER, field: 'handler_id', comment: '处理人ID' },
  handleResult: { type: DataTypes.STRING(500), field: 'handle_result', comment: '处理结果说明' },
  handledAt: { type: DataTypes.DATE, field: 'handled_at', comment: '处理时间' },
  contentSnapshot: { type: DataTypes.TEXT, field: 'content_snapshot', comment: '被举报内容快照' }
}, { tableName: 'reports', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });

module.exports = Report;