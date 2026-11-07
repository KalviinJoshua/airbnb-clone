const mongoose = require('mongoose');
const Listing = require('../models/Listing');

/**
 * Helper to validate MongoDB ObjectId
 */
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * createListing
 * Create a new listing.
 * Protected route: requires host role.
 */
const createListing = async (req, res, next) => {
  try {
    // 1. Role verification
    if (req.user?.role !== 'host') {
      return res.status(403).json({
        message: 'Forbidden: Only accounts with Host privileges can create listings.',
      });
    }

    const { title, description, location, pricePerNight, images } = req.body;

    // 2. Validate required string fields
    if (
      !title ||
      typeof title !== 'string' ||
      !title.trim() ||
      !description ||
      typeof description !== 'string' ||
      !description.trim() ||
      !location ||
      typeof location !== 'string' ||
      !location.trim()
    ) {
      return res.status(400).json({
        message: 'Title, description, and location must be non-empty strings.',
      });
    }

    // 3. Validate price
    const numericPrice = Number(pricePerNight);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      return res.status(400).json({
        message: 'Price per night must be a valid positive number.',
      });
    }

    // 4. Validate images array
    let sanitizedImages = [];
    if (Array.isArray(images)) {
      sanitizedImages = images
        .filter((img) => typeof img === 'string' && img.trim().length > 0)
        .map((img) => img.trim());
    }

    // 5. Create new listing with the authenticated user as host
    const listing = new Listing({
      host: req.user.id,
      title: title.trim(),
      description: description.trim(),
      location: location.trim(),
      pricePerNight: numericPrice,
      images: sanitizedImages,
    });

    await listing.save();

    return res.status(201).json({
      message: 'Listing created successfully.',
      listing,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * getListings
 * Retrieve all listings.
 * Public route.
 */
const getListings = async (req, res, next) => {
  try {
    const listings = await Listing.find()
      .populate('host', 'name email role')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      listings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * getListingById
 * Retrieve a single listing by its ID.
 * Public route.
 */
const getListingById = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(404).json({
        message: 'Listing not found.',
      });
    }

    const listing = await Listing.findById(req.params.id).populate('host', 'name email role');
    if (!listing) {
      return res.status(404).json({
        message: 'Listing not found.',
      });
    }

    return res.status(200).json({
      listing,
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
 * updateListing
 * Update an existing listing.
 * Protected route: Only the host who created the listing can update it.
 */
const updateListing = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(404).json({
        message: 'Listing not found.',
      });
    }

    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({
        message: 'Listing not found.',
      });
    }

    // Check if authenticated user is the host
    if (listing.host.toString() !== req.user.id) {
      return res.status(403).json({
        message: 'Not authorized to update this listing.',
      });
    }

    const { title, description, location, pricePerNight, images } = req.body;
    const allowedUpdates = {};

    if (title !== undefined) {
      if (typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({ message: 'Title must be a non-empty string.' });
      }
      allowedUpdates.title = title.trim();
    }

    if (description !== undefined) {
      if (typeof description !== 'string' || !description.trim()) {
        return res.status(400).json({ message: 'Description must be a non-empty string.' });
      }
      allowedUpdates.description = description.trim();
    }

    if (location !== undefined) {
      if (typeof location !== 'string' || !location.trim()) {
        return res.status(400).json({ message: 'Location must be a non-empty string.' });
      }
      allowedUpdates.location = location.trim();
    }

    if (pricePerNight !== undefined) {
      const numericPrice = Number(pricePerNight);
      if (isNaN(numericPrice) || numericPrice <= 0) {
        return res.status(400).json({ message: 'Price per night must be a valid positive number.' });
      }
      allowedUpdates.pricePerNight = numericPrice;
    }

    if (images !== undefined) {
      if (!Array.isArray(images)) {
        return res.status(400).json({ message: 'Images must be an array of image URLs.' });
      }
      allowedUpdates.images = images
        .filter((img) => typeof img === 'string' && img.trim().length > 0)
        .map((img) => img.trim());
    }

    const updatedListing = await Listing.findByIdAndUpdate(
      req.params.id,
      allowedUpdates,
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      message: 'Listing updated successfully.',
      listing: updatedListing,
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
 * deleteListing
 * Delete an existing listing.
 * Protected route: Only the host who created the listing can delete it.
 */
const deleteListing = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(404).json({
        message: 'Listing not found.',
      });
    }

    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({
        message: 'Listing not found.',
      });
    }

    // Check if authenticated user is the host
    if (listing.host.toString() !== req.user.id) {
      return res.status(403).json({
        message: 'Not authorized to delete this listing.',
      });
    }

    await listing.deleteOne();

    return res.status(200).json({
      message: 'Listing deleted successfully.',
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

module.exports = {
  createListing,
  getListings,
  getListingById,
  updateListing,
  deleteListing,
};
