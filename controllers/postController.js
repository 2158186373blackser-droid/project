const { Post, PostLike, User, Comment, sequelize } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const sensitiveWordFilter = require('../services/sensitiveWordFilter');

// XSS 简单过滤
const xssFilter = (text) => {
  if (!text) return text;
  return String(text)
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// 发布帖子
const createPost = async (req, res, next) => {
  try {
    const { title, content } = req.body;
    const userId = req.userId;

    if (!title || title.length > 100) {
      return res.status(400).json({ code: 400, msg: '标题长度应在1-100字符之间' });
    }
    if (!content || content.length > 5000) {
      return res.status(400).json({ code: 400, msg: '内容长度应在1-5000字符之间' });
    }

    const cleanTitle = xssFilter(title.trim());
    const cleanContent = xssFilter(content.trim());

    const titleCheck = await sensitiveWordFilter.filter(cleanTitle);
    const contentCheck = await sensitiveWordFilter.filter(cleanContent);

    let status = 'published';
    if (titleCheck.hasBlockWord || contentCheck.hasBlockWord) {
      return res.status(400).json({ code: 400, msg: '内容包含不当信息，请修改后重试' });
    } else if (titleCheck.needReview || contentCheck.needReview) {
      status = 'pending';
    }

    const canEditUntil = new Date(Date.now() + 60 * 60 * 1000);

    const post = await Post.create({
      authorId: userId,
      title: cleanTitle,
      content: cleanContent,
      status,
      canEditUntil
    });

    res.json({
      code: 200,
      msg: status === 'published' ? '发布成功' : '发布成功，等待审核',
      data: { id: post.id, status }
    });
  } catch (error) {
    logger.error('发布帖子错误:', error);
    next(error);
  }
};

// 获取帖子列表
const getPostList = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20, keyword } = req.query;
    const userId = req.userId;

    const where = { isDeleted: false };
    if (keyword) {
      where[Op.or] = [
        { title: { [Op.like]: `%${keyword}%` } },
        { content: { [Op.like]: `%${keyword}%` } }
      ];
    }

    const { count, rows } = await Post.findAndCountAll({
      where,
      include: [{ model: User, as: 'author', attributes: ['id', 'username'] }],
      order: [['created_at', 'DESC']],
      limit: parseInt(pageSize),
      offset: (parseInt(page) - 1) * parseInt(pageSize)
    });

    // 过滤掉非作者不可见的帖子（待审核/已拒绝）
    const filteredRows = rows.filter(post => {
      if (post.status === 'pending' && post.authorId !== userId) return false;
      if (post.status === 'rejected') return false;
      return true;
    });

    res.json({
      code: 200,
      data: {
        list: filteredRows,
        total: count,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    logger.error('获取帖子列表错误:', error);
    next(error);
  }
};

// 获取帖子详情
const getPostDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const post = await Post.findByPk(id, {
      include: [{ model: User, as: 'author', attributes: ['id', 'username'] }]
    });

    if (!post || post.isDeleted) {
      return res.status(404).json({ code: 404, msg: '帖子不存在' });
    }

    if (post.status === 'pending' && post.authorId !== userId) {
      return res.status(403).json({ code: 403, msg: '帖子正在审核中' });
    }

    post.viewCount += 1;
    await post.save();

    const like = await PostLike.findOne({ where: { postId: id, userId } });

    res.json({
      code: 200,
      data: {
        ...post.toJSON(),
        isLiked: !!like,
        canEdit: post.authorId === userId && new Date() < post.canEditUntil,
        canDelete: post.authorId === userId
      }
    });
  } catch (error) {
    logger.error('获取帖子详情错误:', error);
    next(error);
  }
};

// 编辑帖子
const updatePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    const userId = req.userId;

    const post = await Post.findByPk(id);
    if (!post || post.isDeleted) {
      return res.status(404).json({ code: 404, msg: '帖子不存在' });
    }
    if (post.authorId !== userId) {
      return res.status(403).json({ code: 403, msg: '无权编辑此帖子' });
    }
    if (new Date() > post.canEditUntil) {
      return res.status(400).json({ code: 400, msg: '编辑时间已过，无法编辑' });
    }

    if (title) {
      if (title.length > 100) return res.status(400).json({ code: 400, msg: '标题长度不能超过100字符' });
      post.title = xssFilter(title.trim());
    }
    if (content) {
      if (content.length > 5000) return res.status(400).json({ code: 400, msg: '内容长度不能超过5000字符' });
      post.content = xssFilter(content.trim());
    }

    const titleCheck = await sensitiveWordFilter.filter(post.title);
    const contentCheck = await sensitiveWordFilter.filter(post.content);
    if (titleCheck.hasBlockWord || contentCheck.hasBlockWord) {
      return res.status(400).json({ code: 400, msg: '内容包含不当信息，请修改后重试' });
    }

    await post.save();
    res.json({ code: 200, msg: '编辑成功' });
  } catch (error) {
    logger.error('编辑帖子错误:', error);
    next(error);
  }
};

// 删除帖子
const deletePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const post = await Post.findByPk(id);
    if (!post || post.isDeleted) {
      return res.status(404).json({ code: 404, msg: '帖子不存在' });
    }
    if (post.authorId !== userId) {
      return res.status(403).json({ code: 403, msg: '无权删除此帖子' });
    }
    if (post.commentCount >= 10) {
      return res.status(400).json({ code: 400, msg: '该帖子评论较多，请联系管理员删除' });
    }

    post.isDeleted = true;
    post.deletedAt = new Date();
    await post.save();

    res.json({ code: 200, msg: '删除成功' });
  } catch (error) {
    logger.error('删除帖子错误:', error);
    next(error);
  }
};

// 点赞/取消点赞
const toggleLike = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const userId = req.userId;

    const post = await Post.findByPk(id, { transaction });
    if (!post || post.isDeleted) {
      await transaction.rollback();
      return res.status(404).json({ code: 404, msg: '帖子不存在' });
    }

    const existingLike = await PostLike.findOne({ where: { postId: id, userId }, transaction });
    if (existingLike) {
      await existingLike.destroy({ transaction });
      post.likeCount = Math.max(0, post.likeCount - 1);
      await post.save({ transaction });
      await transaction.commit();
      return res.json({ code: 200, msg: '取消点赞', data: { liked: false, likeCount: post.likeCount } });
    } else {
      await PostLike.create({ postId: id, userId }, { transaction });
      post.likeCount += 1;
      await post.save({ transaction });
      await transaction.commit();
      return res.json({ code: 200, msg: '点赞成功', data: { liked: true, likeCount: post.likeCount } });
    }
  } catch (error) {
    await transaction.rollback();
    logger.error('点赞操作错误:', error);
    next(error);
  }
};

module.exports = {
  createPost,
  getPostList,
  getPostDetail,
  updatePost,
  deletePost,
  toggleLike
};