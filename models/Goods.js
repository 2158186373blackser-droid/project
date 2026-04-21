const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Goods = sequelize.define('Goods', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  sellerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'seller_id',
    comment: '卖家ID'
  },
  title: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '商品标题'
  },
  description: {
    type: DataTypes.TEXT,
    comment: '商品描述'
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: '价格',
    validate: {
      min: 0.01,
      max: 9999
    }
  },
  category: {
    type: DataTypes.ENUM('books', 'electronics', 'daily', 'clothing', 'other'),
    allowNull: false,
    comment: '分类'
  },
  images: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: '图片列表'
  },
  status: {
    type: DataTypes.ENUM('active', 'sold', 'inactive'),
    defaultValue: 'active',
    comment: '商品状态'
  },
  viewCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'view_count',
    comment: '浏览次数'
  }
}, {
  tableName: 'goods',
  comment: '二手商品表'
});

module.exports = Goods;