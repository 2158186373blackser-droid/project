const { app, initialize } = require('./src/app');
const http = require('http');
const { startScheduler } = require('./src/services/schedulerService');

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';   // 监听所有网络接口，支持局域网访问

// 创建HTTP服务器
const server = http.createServer(app);

// 启动服务器
const startServer = async () => {
  try {
    // 初始化服务（数据库、Redis等）
    await initialize();
    
    // 启动服务器
    server.listen(PORT, HOST, () => {
      console.log('='.repeat(50));
      console.log(`🚀 服务器运行在 http://${HOST}:${PORT}`);
      console.log(`📝 环境: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 客户端地址: ${process.env.CLIENT_URL || 'http://localhost:8080'}`);
      console.log(`🕐 启动时间: ${new Date().toLocaleString()}`);
      console.log('='.repeat(50));
      
      // 启动定时任务调度器
      startScheduler();
      console.log('✅ 定时任务调度器已启动');
    });
    
    // 优雅关闭
    const gracefulShutdown = async (signal) => {
      console.log(`\n收到 ${signal} 信号，正在优雅关闭服务器...`);
      
      server.close(async () => {
        console.log('✅ HTTP服务器已关闭');
        
        try {
          // 关闭数据库连接
          const { sequelize } = require('./src/config/database');
          await sequelize.close();
          console.log('✅ 数据库连接已关闭');
          
          // 关闭Redis连接
          const redis = require('./src/config/redis');
          await redis.quit();
          console.log('✅ Redis连接已关闭');
          
          console.log('👋 应用已安全退出');
          process.exit(0);
        } catch (error) {
          console.error('❌ 关闭连接时出错:', error);
          process.exit(1);
        }
      });
      
      // 强制退出超时
      setTimeout(() => {
        console.error('❌ 优雅关闭超时，强制退出');
        process.exit(1);
      }, 10000);
    };
    
    // 监听关闭信号
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    // 处理未捕获的异常
    process.on('uncaughtException', (error) => {
      console.error('❌ 未捕获的异常:', error);
      gracefulShutdown('uncaughtException');
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ 未处理的Promise拒绝:', reason);
    });
    
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
};

// 启动应用
startServer();

module.exports = server;