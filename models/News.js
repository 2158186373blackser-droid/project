const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const News = sequelize.define('News', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '新闻标题'
  },
  summary: {
    type: DataTypes.STRING(200),
    comment: '摘要'
  },
  content: {
    type: DataTypes.TEXT,
    comment: '内容'
  },
  coverImage: {
    type: DataTypes.STRING(255),
    field: 'cover_image',
    comment: '封面图'
  },
  category: {
    type: DataTypes.ENUM('announcement', 'activity', 'notice'),
    defaultValue: 'notice',
    comment: '分类'
  },
  viewCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'view_count'
  },
  isTop: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_top'
  },
  publishedAt: {
    type: DataTypes.DATE,
    field: 'published_at'
  }
}, {
  tableName: 'news',
  comment: '新闻表'
});

module.exports = News;