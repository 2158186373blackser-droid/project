const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcrypt');
const logger = require('../utils/logger');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '用户ID'
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      len: {
        args: [3, 20],
        msg: '用户名长度必须在3-20个字符之间'
      },
      is: {
        args: /^[a-zA-Z0-9_]+$/,
        msg: '用户名只能包含字母、数字和下划线'
      }
    },
    comment: '用户名'
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: {
        msg: '邮箱格式不正确'
      },
      isEduEmail(value) {
        if (!value.endsWith('.edu.cn')) {
          throw new Error('邮箱必须是.edu.cn后缀');
        }
      }
    },
    comment: '邮箱'
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '密码（加密存储）'
  },
  status: {
    type: DataTypes.ENUM('active', 'locked', 'inactive'),
    defaultValue: 'active',
    comment: '账号状态'
  },
  lastLoginAt: {
    type: DataTypes.DATE,
    field: 'last_login_at',
    comment: '最后登录时间'
  },
  lastLoginIp: {
    type: DataTypes.STRING(45),
    field: 'last_login_ip',
    comment: '最后登录IP'
  },
  loginAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'login_attempts',
    comment: '登录失败次数'
  }
}, {
  tableName: 'users',
  comment: '用户表',
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
        user.password = await bcrypt.hash(user.password, rounds);
        logger.debug(`用户密码已加密: ${user.username}`);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
        user.password = await bcrypt.hash(user.password, rounds);
        logger.debug(`用户密码已更新: ${user.username}`);
      }
    },
    afterCreate: (user) => {
      logger.info(`新用户注册: ${user.username} (${user.email})`);
    }
  }
});

// 实例方法：验证密码
User.prototype.validatePassword = async function(password) {
  try {
    return await bcrypt.compare(password, this.password);
  } catch (error) {
    logger.error('密码验证失败:', error);
    return false;
  }
};

// 实例方法：转换为JSON（隐藏敏感信息）
User.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  delete values.password;
  return values;
};

// 类方法：根据账号查找用户
User.findByAccount = async function(account) {
  const isEmail = account.includes('@');
  const where = isEmail ? { email: account } : { username: account };
  return this.findOne({ where });
};

module.exports = User;