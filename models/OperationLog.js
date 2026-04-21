const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const OperationLog = sequelize.define('OperationLog', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  adminId: { type: DataTypes.INTEGER, allowNull: false, field: 'admin_id', comment: '操作管理员ID' },
  adminUsername: { type: DataTypes.STRING(50), allowNull: false, field: 'admin_username', comment: '操作管理员用户名' },
  operationType: { type: DataTypes.ENUM('delete_post', 'delete_comment', 'ban_user', 'unban_user', 'handle_report', 'shelve_goods'), allowNull: false, field: 'operation_type' },
  targetType: { type: DataTypes.STRING(50), field: 'target_type', comment: '目标类型' },
  targetId: { type: DataTypes.INTEGER, field: 'target_id', comment: '目标ID' },
  beforeSnapshot: { type: DataTypes.JSON, field: 'before_snapshot', comment: '操作前快照' },
  afterSnapshot: { type: DataTypes.JSON, field: 'after_snapshot', comment: '操作后快照' },
  ipAddress: { type: DataTypes.STRING(45), field: 'ip_address', comment: '操作IP' },
  userAgent: { type: DataTypes.STRING(255), field: 'user_agent', comment: 'User-Agent' }
}, { tableName: 'operation_logs', timestamps: true, createdAt: 'created_at', updatedAt: false });

module.exports = OperationLog;