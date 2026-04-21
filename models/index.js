const { sequelize } = require('../config/database');
const User = require('./User');
const Order = require('./Order');
const Goods = require('./Goods');
const Wallet = require('./Wallet');
const Transaction = require('./Transaction');
const LibrarySeat = require('./LibrarySeat');
const Booking = require('./Booking');
const News = require('./News');
const UserCredit = require('./UserCredit');
const Post = require('./Post');
const Comment = require('./Comment');
const PostLike = require('./PostLike');
const CommentReport = require('./CommentReport');
const SensitiveWord = require('./SensitiveWord');
const logger = require('../utils/logger');

// ========== 模型关联 ==========

// 订单关联
Order.belongsTo(User, { as: 'publisher', foreignKey: 'publisherId' });
Order.belongsTo(User, { as: 'receiver', foreignKey: 'receiverId' });
User.hasMany(Order, { as: 'publishedOrders', foreignKey: 'publisherId' });
User.hasMany(Order, { as: 'receivedOrders', foreignKey: 'receiverId' });

// 商品关联
Goods.belongsTo(User, { as: 'seller', foreignKey: 'sellerId' });
User.hasMany(Goods, { as: 'goods', foreignKey: 'sellerId' });

// 钱包关联
Wallet.belongsTo(User, { foreignKey: 'userId' });
User.hasOne(Wallet, { foreignKey: 'userId' });

// 预约关联
Booking.belongsTo(User, { foreignKey: 'userId' });
Booking.belongsTo(LibrarySeat, { foreignKey: 'seatId' });
User.hasMany(Booking, { foreignKey: 'userId' });
LibrarySeat.hasMany(Booking, { foreignKey: 'seatId' });

// 用户信用关联
UserCredit.belongsTo(User, { foreignKey: 'userId' });
User.hasOne(UserCredit, { foreignKey: 'userId' });

// 帖子关联
Post.belongsTo(User, { as: 'author', foreignKey: 'authorId' });
User.hasMany(Post, { as: 'posts', foreignKey: 'authorId' });

// 评论关联
Comment.belongsTo(User, { as: 'author', foreignKey: 'authorId' });
Comment.belongsTo(Post, { as: 'post', foreignKey: 'postId' });
Post.hasMany(Comment, { as: 'comments', foreignKey: 'postId' });
Comment.belongsTo(Comment, { as: 'parent', foreignKey: 'parentId' });
Comment.hasMany(Comment, { as: 'replies', foreignKey: 'parentId' });

// 点赞关联
PostLike.belongsTo(User, { foreignKey: 'userId' });
PostLike.belongsTo(Post, { foreignKey: 'postId' });
Post.hasMany(PostLike, { as: 'likes', foreignKey: 'postId' });

// 举报关联
CommentReport.belongsTo(Comment, { foreignKey: 'commentId' });
CommentReport.belongsTo(User, { as: 'reporter', foreignKey: 'reporterId' });

// ========== 同步数据库 ==========
const syncDatabase = async (force = false) => {
  try {
    // 关键修改：alter: false，避免重复创建索引导致 ER_TOO_MANY_KEYS
    await sequelize.sync({ alter: false });
    logger.info('✅ 数据库表同步成功');

    // 初始化默认座位
    await initLibrarySeats();
    // 初始化默认新闻
    await initNews();
    // 为用户创建钱包
    await initWallets();
  } catch (error) {
    logger.error('❌ 数据库表同步失败:', error);
    throw error;
  }
};

// ========== 初始化数据 ==========

// 初始化图书馆座位
const initLibrarySeats = async () => {
  const count = await LibrarySeat.count();
  if (count === 0) {
    const seats = [];
    for (let floor = 1; floor <= 3; floor++) {
      for (let i = 1; i <= 20; i++) {
        seats.push({
          seatNo: `${floor}${i.toString().padStart(2, '0')}`,
          floor: floor,
          area: floor === 1 ? 'A区' : floor === 2 ? 'B区' : 'C区',
          status: 'available'
        });
      }
    }
    await LibrarySeat.bulkCreate(seats);
    logger.info('✅ 图书馆座位初始化完成');
  }
};

// 初始化新闻
const initNews = async () => {
  const count = await News.count();
  if (count === 0) {
    await News.bulkCreate([
      { 
        title: '校园代取服务上线', 
        summary: '全新代取快递功能正式上线', 
        category: 'announcement', 
        isTop: true, 
        publishedAt: new Date() 
      },
      { 
        title: '二手市场开放通知', 
        summary: '闲置物品交易平台现已开放', 
        category: 'announcement', 
        isTop: false, 
        publishedAt: new Date() 
      },
      { 
        title: '图书馆占座功能使用指南', 
        summary: '教你如何快速预约座位', 
        category: 'notice', 
        isTop: false, 
        publishedAt: new Date() 
      }
    ]);
    logger.info('✅ 新闻初始化完成');
  }
};

// 初始化钱包
const initWallets = async () => {
  const users = await User.findAll();
  for (const user of users) {
    await Wallet.findOrCreate({
      where: { userId: user.id },
      defaults: { balance: 100 }
    });
  }
  logger.info('✅ 钱包初始化完成');
};

// ========== 导出所有模型 ==========
module.exports = {
  User,
  Order,
  Goods,
  Wallet,
  Transaction,
  LibrarySeat,
  Booking,
  News,
  UserCredit,
  Post,
  Comment,
  PostLike,
  CommentReport,
  SensitiveWord,
  sequelize,
  syncDatabase
};