const Review = require('../models/Review');
const Booking = require('../models/Booking');
const Listing = require('../models/Listing');

/**
 * createReview
 * Create a new review for a listing.
 * Protected route: user ID is extracted from req.user.id.
 * Requirements:
 * - Listing must exist.
 * - User must have a completed stay (confirmed booking with checkOut <= now).
 * - User cannot review the same listing more than once.
 */
const createReview = async (req, res, next) => {
  try {
    const listingId = req.body.listing || req.body.listingId;
    const { rating, comment } = req.body;

    // 1. Validate required fields
    if (!listingId || rating === undefined || rating === null || !comment) {
      return res.status(400).json({
        message: 'Listing ID, rating, and comment are required.',
      });
    }

    // 2. Validate rating range (1 to 5)
    const numericRating = Number(rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({
        message: 'Rating must be a number between 1 and 5.',
      });
    }

    // 3. Verify that the listing exists
    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({
        message: 'Listing not found.',
      });
    }

    // 4. Verify that the authenticated user has a completed stay for this listing
    const completedBooking = await Booking.findOne({
      listing: listingId,
      user: req.user.id,
      status: 'confirmed',
      checkOut: { $lte: new Date() },
    });

    if (!completedBooking) {
      return res.status(403).json({
        message: 'You can only review a listing after completing a confirmed stay.',
      });
    }

    // 5. Prevent duplicate reviews by the same user for the same listing
    const existingReview = await Review.findOne({
      listing: listingId,
      user: req.user.id,
    });

    if (existingReview) {
      return res.status(409).json({
        message: 'You have already reviewed this listing.',
      });
    }

    // 6. Create and save the new review
    const review = new Review({
      listing: listingId,
      user: req.user.id,
      rating: numericRating,
      comment: typeof comment === 'string' ? comment.trim() : comment,
    });

    await review.save();

    return res.status(201).json({
      message: 'Review created successfully.',
      review,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        message: 'Listing not found.',
      });
    }
    next(error);
  }
};

/**
 * getListingReviews
 * Retrieve all reviews for a particular listing.
 * Public route.
 */
const getListingReviews = async (req, res, next) => {
  try {
    const { listingId } = req.params;

    const reviews = await Review.find({ listing: listingId }).populate(
      'user',
      'name'
    );

    return res.status(200).json({
      reviews,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        message: 'Listing not found.',
      });
    }
    next(error);
  }
};

/**
 * getReviewById
 * Retrieve a single review by its ID.
 * Public route.
 */
const getReviewById = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id).populate('user', 'name');
    if (!review) {
      return res.status(404).json({
        message: 'Review not found.',
      });
    }

    return res.status(200).json({
      review,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        message: 'Review not found.',
      });
    }
    next(error);
  }
};

/**
 * updateReview
 * Update an existing review.
 * Protected route: only the review owner can update.
 * Allows modifying only rating and comment.
 */
const updateReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({
        message: 'Review not found.',
      });
    }

    // Verify ownership
    if (review.user.toString() !== req.user.id) {
      return res.status(403).json({
        message: 'Not authorized to update this review.',
      });
    }

    const { rating, comment } = req.body;

    if (rating === undefined && comment === undefined) {
      return res.status(400).json({
        message: 'Please provide rating or comment to update.',
      });
    }

    // Validate rating if provided
    if (rating !== undefined) {
      const numericRating = Number(rating);
      if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
        return res.status(400).json({
          message: 'Rating must be a number between 1 and 5.',
        });
      }
      review.rating = numericRating;
    }

    // Validate comment if provided
    if (comment !== undefined) {
      if (!comment || (typeof comment === 'string' && !comment.trim())) {
        return res.status(400).json({
          message: 'Comment cannot be empty.',
        });
      }
      review.comment = typeof comment === 'string' ? comment.trim() : comment;
    }

    await review.save();

    return res.status(200).json({
      message: 'Review updated successfully.',
      review,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        message: 'Review not found.',
      });
    }
    next(error);
  }
};

/**
 * deleteReview
 * Delete an existing review.
 * Protected route: only the review owner can delete.
 */
const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({
        message: 'Review not found.',
      });
    }

    // Verify ownership
    if (review.user.toString() !== req.user.id) {
      return res.status(403).json({
        message: 'Not authorized to delete this review.',
      });
    }

    await review.deleteOne();

    return res.status(200).json({
      message: 'Review deleted successfully.',
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        message: 'Review not found.',
      });
    }
    next(error);
  }
};

module.exports = {
  createReview,
  getListingReviews,
  getReviewById,
  updateReview,
  deleteReview,
};
