const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Post = sequelize.define('Post', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  authorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'author_id',
    comment: '作者ID'
  },
  title: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '帖子标题'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '帖子内容'
  },
  likeCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'like_count',
    comment: '点赞数'
  },
  commentCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'comment_count',
    comment: '评论数'
  },
  viewCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'view_count',
    comment: '浏览次数'
  },
  status: {
    type: DataTypes.ENUM('pending', 'published', 'rejected', 'deleted'),
    defaultValue: 'pending',
    comment: '帖子状态：pending待审核/published已发布/rejected已拒绝/deleted已删除'
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
  canEditUntil: {
    type: DataTypes.DATE,
    field: 'can_edit_until',
    comment: '允许编辑的截止时间'
  }
}, {
  tableName: 'posts',
  comment: '论坛帖子表',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Post;