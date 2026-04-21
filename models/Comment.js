const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Comment = sequelize.define('Comment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  postId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'post_id',
    comment: '所属帖子ID'
  },
  authorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'author_id',
    comment: '评论者ID'
  },
  parentId: {
    type: DataTypes.INTEGER,
    field: 'parent_id',
    comment: '父评论ID（用于嵌套回复）'
  },
  content: {
    type: DataTypes.STRING(500),
    allowNull: false,
    comment: '评论内容'
  },
  status: {
    type: DataTypes.ENUM('pending', 'published', 'rejected', 'deleted'),
    defaultValue: 'pending',
    comment: '状态'
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_deleted',
    comment: '软删除标记'
  },
  deletedAt: {
    type: DataTypes.DATE,
    field: 'deleted_at',
    comment: '删除时间'
  },
  reportCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'report_count',
    comment: '被举报次数'
  }
}, {
  tableName: 'comments',
  comment: '评论表',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Comment;