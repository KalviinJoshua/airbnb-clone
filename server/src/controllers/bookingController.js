const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Listing = require('../models/Listing');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * createBooking
 * Create a new booking for a listing.
 * Protected route: user ID is extracted from req.user.id.
 */
const createBooking = async (req, res, next) => {
  try {
    const listingId = req.body.listing || req.body.listingId;
    const { checkIn, checkOut } = req.body;

    // 1. Validate required fields
    if (!listingId || !checkIn || !checkOut) {
      return res.status(400).json({
        message: 'Listing ID, checkIn, and checkOut are required.',
      });
    }

    if (!isValidObjectId(listingId)) {
      return res.status(404).json({
        message: 'Listing not found.',
      });
    }

    // 2. Verify that the listing exists
    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({
        message: 'Listing not found.',
      });
    }

    // 3. Validate dates and normalize to calendar dates at midnight
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      return res.status(400).json({
        message: 'Invalid check-in or check-out date format.',
      });
    }

    // Normalize checkIn and checkOut to calendar dates at midnight
    checkInDate.setHours(0, 0, 0, 0);
    checkOutDate.setHours(0, 0, 0, 0);

    // Validate that checkIn is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (checkInDate < today) {
      return res.status(400).json({
        message: 'Check-in date cannot be in the past.',
      });
    }

    // Ensure checkOut is strictly later than checkIn
    if (checkOutDate <= checkInDate) {
      return res.status(400).json({
        message: 'Check-out date must be later than check-in date.',
      });
    }

    // 4. Calculate number of nights and totalPrice using normalized dates
    const diffInMs = checkOutDate.getTime() - checkInDate.getTime();
    const nights = Math.round(diffInMs / (1000 * 60 * 60 * 24));
    const totalPrice = nights * listing.pricePerNight;

    // 5. Prevent overlapping confirmed bookings for the same listing
    const overlappingBooking = await Booking.findOne({
      listing: listingId,
      status: 'confirmed',
      checkIn: { $lt: checkOutDate },
      checkOut: { $gt: checkInDate },
    });

    if (overlappingBooking) {
      return res.status(409).json({
        message: 'The selected dates are unavailable for this listing.',
      });
    }

    // 6. Create and save the booking
    const booking = new Booking({
      listing: listingId,
      user: req.user.id,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      totalPrice,
      status: 'confirmed',
    });

    await booking.save();

    return res.status(201).json({
      message: 'Booking created successfully.',
      booking,
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
 * getBookings
 * Retrieve only bookings belonging to the authenticated user.
 * Protected route.
 */
const getBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate('listing', 'title location pricePerNight images')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      bookings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * getBookingById
 * Retrieve a single booking by ID.
 * Protected route: accessible only to the booking owner.
 */
const getBookingById = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(404).json({
        message: 'Booking not found.',
      });
    }

    const booking = await Booking.findById(req.params.id).populate(
      'listing',
      'title location pricePerNight images'
    );

    if (!booking) {
      return res.status(404).json({
        message: 'Booking not found.',
      });
    }

    // Check if the authenticated user is the booking owner
    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({
        message: 'Not authorized to view this booking.',
      });
    }

    return res.status(200).json({
      booking,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        message: 'Booking not found.',
      });
    }
    next(error);
  }
};

/**
 * updateBooking
 * Update checkIn and checkOut dates for a booking.
 * Protected route: only the booking owner can update.
 */
const updateBooking = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(404).json({
        message: 'Booking not found.',
      });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({
        message: 'Booking not found.',
      });
    }

    // Check if the authenticated user is the booking owner
    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({
        message: 'Not authorized to update this booking.',
      });
    }

    const { checkIn, checkOut } = req.body;
    if (!checkIn && !checkOut) {
      return res.status(400).json({
        message: 'Please provide checkIn or checkOut to update.',
      });
    }

    const newCheckIn = checkIn ? new Date(checkIn) : new Date(booking.checkIn);
    const newCheckOut = checkOut ? new Date(checkOut) : new Date(booking.checkOut);

    if (isNaN(newCheckIn.getTime()) || isNaN(newCheckOut.getTime())) {
      return res.status(400).json({
        message: 'Invalid check-in or check-out date format.',
      });
    }

    // Normalize checkIn and checkOut to calendar dates at midnight
    newCheckIn.setHours(0, 0, 0, 0);
    newCheckOut.setHours(0, 0, 0, 0);

    // Validate that checkIn is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (newCheckIn < today) {
      return res.status(400).json({
        message: 'Check-in date cannot be in the past.',
      });
    }

    // Ensure checkOut is strictly later than checkIn
    if (newCheckOut <= newCheckIn) {
      return res.status(400).json({
        message: 'Check-out date must be later than check-in date.',
      });
    }

    // Check for overlapping confirmed bookings excluding the current booking
    const overlappingBooking = await Booking.findOne({
      _id: { $ne: booking._id },
      listing: booking.listing,
      status: 'confirmed',
      checkIn: { $lt: newCheckOut },
      checkOut: { $gt: newCheckIn },
    });

    if (overlappingBooking) {
      return res.status(409).json({
        message: 'The selected dates are unavailable for this listing.',
      });
    }

    // Fetch listing to recalculate totalPrice using pricePerNight
    const listing = await Listing.findById(booking.listing);
    if (!listing) {
      return res.status(404).json({
        message: 'Associated listing not found.',
      });
    }

    // Calculate number of nights and totalPrice using normalized dates
    const diffInMs = newCheckOut.getTime() - newCheckIn.getTime();
    const nights = Math.round(diffInMs / (1000 * 60 * 60 * 24));
    const totalPrice = nights * listing.pricePerNight;

    // Update only the dates and recalculated totalPrice
    booking.checkIn = newCheckIn;
    booking.checkOut = newCheckOut;
    booking.totalPrice = totalPrice;

    await booking.save();

    return res.status(200).json({
      message: 'Booking updated successfully.',
      booking,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        message: 'Booking not found.',
      });
    }
    next(error);
  }
};

/**
 * deleteBooking
 * Delete a booking.
 * Protected route: only the booking owner can delete.
 */
const deleteBooking = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(404).json({
        message: 'Booking not found.',
      });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({
        message: 'Booking not found.',
      });
    }

    // Check if the authenticated user is the booking owner
    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({
        message: 'Not authorized to delete this booking.',
      });
    }

    await booking.deleteOne();

    return res.status(200).json({
      message: 'Booking deleted successfully.',
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        message: 'Booking not found.',
      });
    }
    next(error);
  }
};

module.exports = {
  createBooking,
  getBookings,
  getBookingById,
  updateBooking,
  deleteBooking,
};
