const express = require('express');
const {
  createListing,
  getListings,
  getListingById,
  updateListing,
  deleteListing,
} = require('../controllers/listingController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.get('/', getListings);
router.get('/:id', getListingById);

// Protected routes (require valid JWT)
router.post('/', authMiddleware, createListing);
router.put('/:id', authMiddleware, updateListing);
router.delete('/:id', authMiddleware, deleteListing);

module.exports = router;
