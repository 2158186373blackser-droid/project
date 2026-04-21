const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const {
  createPost,
  getPostList,
  getPostDetail,
  updatePost,
  deletePost,
  toggleLike
} = require('../controllers/postController');

router.post('/', authMiddleware, createPost);
router.get('/list', authMiddleware, getPostList);
router.get('/:id', authMiddleware, getPostDetail);
router.put('/:id', authMiddleware, updatePost);
router.delete('/:id', authMiddleware, deletePost);
router.post('/:id/like', authMiddleware, toggleLike);

module.exports = router;