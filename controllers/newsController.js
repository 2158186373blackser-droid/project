const { News } = require('../models');
const logger = require('../utils/logger');

const getNewsList = async (req, res, next) => {
  try {
    const { category, page = 1, pageSize = 10 } = req.query;
    const where = {};
    if (category) where.category = category;

    const { count, rows } = await News.findAndCountAll({
      where,
      attributes: ['id', 'title', 'summary', 'coverImage', 'category', 'viewCount', 'isTop', 'publishedAt'],
      order: [['isTop', 'DESC'], ['publishedAt', 'DESC']],
      limit: parseInt(pageSize),
      offset: (parseInt(page) - 1) * parseInt(pageSize)
    });

    res.json({
      code: 200,
      data: { list: rows, total: count, page: parseInt(page), pageSize: parseInt(pageSize) }
    });
  } catch (error) {
    logger.error('获取新闻列表错误:', error);
    res.status(500).json({ code: 500, msg: '获取新闻失败' });
  }
};

const getNewsDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const news = await News.findByPk(id);
    if (!news) return res.status(404).json({ code: 404, msg: '新闻不存在' });
    news.viewCount += 1;
    await news.save();
    res.json({ code: 200, data: news });
  } catch (error) {
    logger.error('获取新闻详情错误:', error);
    res.status(500).json({ code: 500, msg: '获取新闻详情失败' });
  }
};

module.exports = { getNewsList, getNewsDetail };