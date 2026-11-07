const express = require('express');
const {
  createReview,
  getListingReviews,
  getReviewById,
  updateReview,
  deleteReview,
} = require('../controllers/reviewController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.get('/listing/:listingId', getListingReviews);
router.get('/:id', getReviewById);

// Protected routes (require JWT authentication)
router.post('/', authMiddleware, createReview);
router.put('/:id', authMiddleware, updateReview);
router.delete('/:id', authMiddleware, deleteReview);

module.exports = router;
