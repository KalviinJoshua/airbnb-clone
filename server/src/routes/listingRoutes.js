const express = require('express');
const {
  createListing,
  getListings,
  getListingById,
  updateListing,
  deleteListing,
} = require('../controllers/listingController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireHost } = require('../middleware/roleMiddleware');

const router = express.Router();

// Public routes
router.get('/', getListings);
router.get('/:id', getListingById);

// Protected routes (Host privileges required)
router.post('/', authMiddleware, requireHost, createListing);
router.put('/:id', authMiddleware, requireHost, updateListing);
router.delete('/:id', authMiddleware, requireHost, deleteListing);

module.exports = router;
