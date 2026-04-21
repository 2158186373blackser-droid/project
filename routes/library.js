const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const {
  getSeats,
  bookSeat,
  checkIn,
  cancelBooking,
  getMyBookings,
  getCredit,
  submitAppeal
} = require('../controllers/libraryController');

router.get('/seats', authMiddleware, getSeats);
router.post('/book', authMiddleware, bookSeat);
router.post('/checkin/:id', authMiddleware, checkIn);
router.post('/cancel/:id', authMiddleware, cancelBooking);
router.get('/my', authMiddleware, getMyBookings);
router.get('/credit', authMiddleware, getCredit);
router.post('/appeal', authMiddleware, submitAppeal);

module.exports = router;