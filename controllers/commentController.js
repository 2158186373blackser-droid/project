const { Comment, Post, User, CommentReport, sequelize } = require('../models');
const logger = require('../utils/logger');
const sensitiveWordFilter = require('../services/sensitiveWordFilter');

const xssFilter = (text) => {
  if (!text) return text;
  return String(text)
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
};

// 发表评论
const createComment = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { postId } = req.params;
    const { content, parentId } = req.body;
    const userId = req.userId;

    if (!content || content.length > 500) {
      await transaction.rollback();
      return res.status(400).json({ code: 400, msg: '评论内容应在1-500字符之间' });
    }

    const post = await Post.findByPk(postId, { transaction });
    if (!post || post.isDeleted) {
      await transaction.rollback();
      return res.status(404).json({ code: 404, msg: '帖子不存在' });
    }

    const cleanContent = xssFilter(content.trim());
    const filterResult = await sensitiveWordFilter.filter(cleanContent);
    let status = 'published';
    if (filterResult.hasBlockWord) {
      await transaction.rollback();
      return res.status(400).json({ code: 400, msg: '内容包含不当信息，请修改后重试' });
    } else if (filterResult.needReview) {
      status = 'pending';
    }

    const comment = await Comment.create({
      postId,
      authorId: userId,
      parentId: parentId || null,
      content: cleanContent,
      status
    }, { transaction });

    post.commentCount += 1;
    await post.save({ transaction });

    await transaction.commit();

    res.json({
      code: 200,
      msg: status === 'published' ? '评论成功' : '评论成功，等待审核',
      data: comment
    });
  } catch (error) {
    await transaction.rollback();
    logger.error('发表评论错误:', error);
    next(error);
  }
};

// 获取评论列表
const getCommentList = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { page = 1, pageSize = 20 } = req.query;
    const userId = req.userId;

    const post = await Post.findByPk(postId);
    if (!post || post.isDeleted) {
      return res.status(404).json({ code: 404, msg: '帖子不存在' });
    }

    const where = {
      postId,
      parentId: null,
      isDeleted: false
    };

    const { count, rows } = await Comment.findAndCountAll({
      where,
      include: [{ model: User, as: 'author', attributes: ['id', 'username'] }],
      order: [['created_at', 'ASC']],
      limit: parseInt(pageSize),
      offset: (parseInt(page) - 1) * parseInt(pageSize)
    });

    const filteredRows = rows.filter(comment => {
      if (comment.status === 'pending' && comment.authorId !== userId) return false;
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
    logger.error('获取评论列表错误:', error);
    next(error);
  }
};

// 删除评论
const deleteComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const comment = await Comment.findByPk(id);
    if (!comment || comment.isDeleted) {
      return res.status(404).json({ code: 404, msg: '评论不存在' });
    }

    const post = await Post.findByPk(comment.postId);
    const isCommentAuthor = comment.authorId === userId;
    const isPostAuthor = post && post.authorId === userId;

    if (!isCommentAuthor && !isPostAuthor) {
      return res.status(403).json({ code: 403, msg: '无权删除此评论' });
    }

    comment.isDeleted = true;
    comment.deletedAt = new Date();
    await comment.save();

    await Comment.update(
      { isDeleted: true, deletedAt: new Date() },
      { where: { parentId: id } }
    );

    post.commentCount = Math.max(0, post.commentCount - 1);
    await post.save();

    res.json({ code: 200, msg: '删除成功' });
  } catch (error) {
    logger.error('删除评论错误:', error);
    next(error);
  }
};

// 举报评论
const reportComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason, description } = req.body;
    const userId = req.userId;

    const comment = await Comment.findByPk(id);
    if (!comment || comment.isDeleted) {
      return res.status(404).json({ code: 404, msg: '评论不存在' });
    }

    const existingReport = await CommentReport.findOne({
      where: { commentId: id, reporterId: userId }
    });
    if (existingReport) {
      return res.status(400).json({ code: 400, msg: '您已举报过该评论' });
    }

    await CommentReport.create({
      commentId: id,
      reporterId: userId,
      reason,
      description
    });

    comment.reportCount += 1;
    if (comment.reportCount >= 3) {
      comment.status = 'pending';
    }
    await comment.save();

    res.json({ code: 200, msg: '举报成功' });
  } catch (error) {
    logger.error('举报评论错误:', error);
    next(error);
  }
};

module.exports = {
  createComment,
  getCommentList,
  deleteComment,
  reportComment
};