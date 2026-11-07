const Listing = require('../models/Listing');

/**
 * createListing
 * Create a new listing.
 * Protected route: host ID is extracted from req.user.id.
 */
const createListing = async (req, res, next) => {
  try {
    const { title, description, location, pricePerNight, images } = req.body;

    // 1. Validate required fields
    if (!title || !description || !location || !pricePerNight) {
      return res.status(400).json({
        message: 'Title, description, location, and pricePerNight are required.',
      });
    }

    // 2. Create new listing with the authenticated user as host
    const listing = new Listing({
      host: req.user.id,
      title,
      description,
      location,
      pricePerNight,
      images: images || [],
    });

    await listing.save();

    // 3. Return 201 with created listing
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
    const listings = await Listing.find().populate('host', 'name');
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
    const listing = await Listing.findById(req.params.id).populate('host', 'name');
    if (!listing) {
      return res.status(404).json({
        message: 'Listing not found.',
      });
    }

    return res.status(200).json({
      listing,
    });
  } catch (error) {
    // Handle invalid MongoDB ObjectId format
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

    // Filter allowed fields only to prevent modifying the host or unauthorized fields
    const { title, description, location, pricePerNight, images } = req.body;
    const allowedUpdates = {};
    if (title !== undefined) allowedUpdates.title = title;
    if (description !== undefined) allowedUpdates.description = description;
    if (location !== undefined) allowedUpdates.location = location;
    if (pricePerNight !== undefined) allowedUpdates.pricePerNight = pricePerNight;
    if (images !== undefined) allowedUpdates.images = images;

    // Update listing with filtered values
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
    // Handle invalid MongoDB ObjectId format
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
    // Handle invalid MongoDB ObjectId format
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
