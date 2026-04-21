const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { encrypt, decrypt } = require('../utils/encrypt');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  orderNo: {
    type: DataTypes.STRING(32),
    allowNull: false,
    unique: true,
    comment: '订单编号'
  },
  publisherId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'publisher_id',
    comment: '发单人ID'
  },
  receiverId: {
    type: DataTypes.INTEGER,
    field: 'receiver_id',
    comment: '接单人ID'
  },
  pickupCode: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'pickup_code',
    comment: '取件码（加密存储）',
    set(value) {
      this.setDataValue('pickupCode', encrypt(value));
    },
    get() {
      const raw = this.getDataValue('pickupCode');
      return raw ? decrypt(raw) : null;
    }
  },
  pickupAddress: {
    type: DataTypes.STRING(200),
    allowNull: false,
    field: 'pickup_address',
    comment: '快递站地址'
  },
  deliveryAddress: {
    type: DataTypes.STRING(200),
    allowNull: false,
    field: 'delivery_address',
    comment: '送达地址'
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: '报酬金额',
    validate: {
      min: 0.1,
      max: 50
    }
  },
  deadline: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: '截止接单时间'
  },
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'picked', 'delivered', 'completed', 'cancelled', 'dispute'),
    defaultValue: 'pending',
    comment: '订单状态'
  },
  pickedAt: {
    type: DataTypes.DATE,
    field: 'picked_at',
    comment: '取件时间'
  },
  deliveredAt: {
    type: DataTypes.DATE,
    field: 'delivered_at',
    comment: '送达时间'
  },
  completedAt: {
    type: DataTypes.DATE,
    field: 'completed_at',
    comment: '完成时间'
  },
  autoConfirmAt: {
    type: DataTypes.DATE,
    field: 'auto_confirm_at',
    comment: '自动确认时间'
  },
  complaintReason: {
    type: DataTypes.TEXT,
    field: 'complaint_reason',
    comment: '投诉原因'
  },
  // 软删除字段
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_deleted',       // ← 必须指定数据库列名
    comment: '软删除标记'
  },
  deletedAt: {
    type: DataTypes.DATE,
    field: 'deleted_at',
    comment: '删除时间'
  }
}, {
  tableName: 'orders',
  comment: '代取订单表',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Order;