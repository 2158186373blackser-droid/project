const express = require('express');
const router = express.Router({ mergeParams: true });
const { authMiddleware } = require('../middleware/auth');
const {
  createComment,
  getCommentList,
  deleteComment,
  reportComment
} = require('../controllers/commentController');

router.post('/', authMiddleware, createComment);
router.get('/', authMiddleware, getCommentList);
router.delete('/:id', authMiddleware, deleteComment);
router.post('/:id/report', authMiddleware, reportComment);

module.exports = router;