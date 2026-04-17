const User = require('./User');
const { sequelize } = require('../config/database');
const logger = require('../utils/logger');

// 定义模型关联（如有需要）
// User.associate = (models) => {
//   // 在这里定义关联关系
// };

// 同步数据库表
const syncDatabase = async (force = false) => {
  try {
    // 开发环境可以使用 alter: true 自动更新表结构
    // 生产环境建议手动管理数据库迁移
    const syncOptions = {
      force: force, // 强制重建表（会删除现有数据！）
      alter: process.env.NODE_ENV === 'development', // 开发环境自动修改表结构
      logging: (msg) => logger.debug(msg)
    };
    
    await sequelize.sync(syncOptions);
    logger.info('数据库表同步成功');
    
    // 创建默认管理员账号（可选）
    await createDefaultAdmin();
  } catch (error) {
    logger.error('数据库表同步失败:', error);
    throw error;
  }
};

// 创建默认管理员
const createDefaultAdmin = async () => {
  try {
    const adminExists = await User.findOne({ where: { username: 'admin' } });
    
    if (!adminExists) {
      await User.create({
        username: 'admin',
        email: 'admin@university.edu.cn',
        password: 'Admin123456',
        status: 'active'
      });
      logger.info('默认管理员账号已创建: admin / Admin123456');
    }
  } catch (error) {
    logger.warn('创建默认管理员失败:', error.message);
  }
};

module.exports = {
  User,
  sequelize,
  syncDatabase
};