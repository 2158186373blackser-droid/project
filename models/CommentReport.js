const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CommentReport = sequelize.define('CommentReport', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  commentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'comment_id',
    comment: '被举报评论ID'
  },
  reporterId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'reporter_id',
    comment: '举报人ID'
  },
  reason: {
    type: DataTypes.ENUM('spam', 'abuse', 'porn', 'other'),
    allowNull: false,
    comment: '举报原因'
  },
  description: {
    type: DataTypes.STRING(200),
    comment: '补充说明'
  },
  status: {
    type: DataTypes.ENUM('pending', 'processed', 'ignored'),
    defaultValue: 'pending',
    comment: '处理状态'
  }
}, {
  tableName: 'comment_reports',
  comment: '评论举报表',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['comment_id', 'reporter_id']
    }
  ]
});

module.exports = CommentReport;