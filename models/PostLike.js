const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PostLike = sequelize.define('PostLike', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    comment: '用户ID'
  },
  postId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'post_id',
    comment: '帖子ID'
  }
}, {
  tableName: 'post_likes',
  comment: '用户点赞关联表',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'post_id']
    }
  ]
});

module.exports = PostLike;