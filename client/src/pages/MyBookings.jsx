import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchMyBookings, updateBooking, cancelBooking } from '../services/api';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80';

/**
 * Format a Date object or string into a readable string (e.g. "15 Nov 2026")
 */
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format date to YYYY-MM-DD for date inputs
 */
function toInputDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toISOString().split('T')[0];
}

/**
 * Calculate the number of nights between two date strings
 */
function calculateNights(checkInStr, checkOutStr) {
  if (!checkInStr || !checkOutStr) return 0;
  const start = new Date(checkInStr);
  const end = new Date(checkOutStr);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  const diffInMs = end.getTime() - start.getTime();
  return diffInMs > 0 ? Math.round(diffInMs / (1000 * 60 * 60 * 24)) : 0;
}

/**
 * MyBookings Page Component
 * Displays the authenticated user's confirmed reservations with date modification and cancellation.
 */
export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  // Editing state for updating a booking
  const [editingBooking, setEditingBooking] = useState(null);
  const [editCheckIn, setEditCheckIn] = useState('');
  const [editCheckOut, setEditCheckOut] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Cancellation state
  const [cancellingBookingId, setCancellingBookingId] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchMyBookings();
      setBookings(data);
    } catch (err) {
      setError(err.message || 'Failed to load your reservations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  // Open the edit modal/inline form
  const handleStartEdit = (booking) => {
    setActionError('');
    setActionSuccess('');
    setEditingBooking(booking);
    setEditCheckIn(toInputDate(booking.checkIn));
    setEditCheckOut(toInputDate(booking.checkOut));
  };

  const handleCancelEdit = () => {
    setEditingBooking(null);
    setEditCheckIn('');
    setEditCheckOut('');
    setActionError('');
  };

  // Submit date update
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!editingBooking) return;
    setActionError('');
    setActionSuccess('');

    const start = new Date(editCheckIn);
    const end = new Date(editCheckOut);
    if (end <= start) {
      setActionError('Check-out date must be later than check-in date.');
      return;
    }

    try {
      setIsUpdating(true);
      const result = await updateBooking(editingBooking._id, {
        checkIn: editCheckIn,
        checkOut: editCheckOut,
      });

      setActionSuccess(result.message || 'Booking updated successfully!');
      setEditingBooking(null);
      await loadBookings();
    } catch (err) {
      if (err.status === 409) {
        setActionError(
          'The selected dates are unavailable for this listing. Please select other dates.'
        );
      } else {
        setActionError(err.message || 'Failed to update booking.');
      }
    } finally {
      setIsUpdating(false);
    }
  };

  // Submit cancellation
  const handleConfirmCancel = async () => {
    if (!cancellingBookingId) return;
    setActionError('');
    setActionSuccess('');

    try {
      setIsCancelling(true);
      const result = await cancelBooking(cancellingBookingId);
      setActionSuccess(result.message || 'Booking was cancelled successfully.');
      setCancellingBookingId(null);
      await loadBookings();
    } catch (err) {
      setActionError(err.message || 'Failed to cancel the booking.');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="bookings-page">
      <div className="container">
        <div className="bookings-header">
          <h1 className="bookings-title">My Bookings</h1>
          <p className="bookings-subtitle">
            Manage your trips, change reservation dates, or cancel upcoming stays
          </p>
        </div>

        {/* Success Alert */}
        {actionSuccess && (
          <div className="booking-success-alert" role="status" style={{ marginBottom: '24px' }}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Global Action Error Alert */}
        {actionError && (
          <div className="auth-error-alert" role="alert" style={{ marginBottom: '24px' }}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{actionError}</span>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="state-container">
            <div className="spinner" aria-label="Loading your bookings" />
            <p className="state-title">Retrieving your reservations...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="state-container">
            <svg className="state-icon" viewBox="0 0 24 24" fill="none" stroke="#ff385c" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <h2 className="state-title">Unable to load reservations</h2>
            <p className="state-description">{error}</p>
            <button type="button" className="state-btn" onClick={loadBookings}>
              Try again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && bookings.length === 0 && (
          <div className="state-container">
            <svg className="state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            <h2 className="state-title">No trips booked... yet!</h2>
            <p className="state-description">
              Time to dust off your bags and start planning your next great adventure.
            </p>
            <Link to="/" className="state-btn">
              Explore stays
            </Link>
          </div>
        )}

        {/* Bookings List */}
        {!loading && !error && bookings.length > 0 && (
          <div className="bookings-grid">
            {bookings.map((booking) => {
              const listing = booking.listing || {};
              const images = listing.images || [];
              const imageSrc = images.length > 0 ? images[0] : FALLBACK_IMAGE;
              const nights = calculateNights(booking.checkIn, booking.checkOut);

              return (
                <div key={booking._id} className="booking-card">
                  {/* Listing Image */}
                  <div className="booking-card-media">
                    <img
                      src={imageSrc}
                      alt={`Reserved accommodation: ${listing.title || 'stay'}`}
                      className="booking-card-image"
                      loading="lazy"
                      decoding="async"
                      width="400"
                      height="200"
                      onError={(e) => {
                        e.target.src = FALLBACK_IMAGE;
                      }}
                    />
                    <span className={`booking-status-tag status-${booking.status || 'confirmed'}`}>
                      {booking.status || 'confirmed'}
                    </span>
                  </div>

                  {/* Booking Details */}
                  <div className="booking-card-body">
                    <div className="booking-card-header">
                      <Link
                        to={`/listings/${listing._id || ''}`}
                        className="booking-listing-title"
                        title={listing.title}
                      >
                        {listing.title || 'Accommodation stay'}
                      </Link>
                      <p className="booking-listing-location">{listing.location || 'Location unavailable'}</p>
                    </div>

                    <div className="booking-dates-row">
                      <div className="booking-date-block">
                        <span className="booking-date-label">Check-in</span>
                        <span className="booking-date-value">{formatDate(booking.checkIn)}</span>
                      </div>
                      <div className="booking-date-arrow">→</div>
                      <div className="booking-date-block">
                        <span className="booking-date-label">Check-out</span>
                        <span className="booking-date-value">{formatDate(booking.checkOut)}</span>
                      </div>
                      <div className="booking-nights-badge">
                        {nights} {nights === 1 ? 'night' : 'nights'}
                      </div>
                    </div>

                    <div className="booking-card-footer">
                      <div className="booking-total-price">
                        <span className="booking-price-label">Total paid</span>
                        <span className="booking-price-amount">
                          ₹{booking.totalPrice?.toLocaleString('en-IN') || booking.totalPrice}
                        </span>
                      </div>

                      <div className="booking-card-actions">
                        <button
                          type="button"
                          className="btn-booking-action btn-booking-edit"
                          onClick={() => handleStartEdit(booking)}
                        >
                          Change dates
                        </button>
                        <button
                          type="button"
                          className="btn-booking-action btn-booking-cancel"
                          onClick={() => setCancellingBookingId(booking._id)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal: Edit Booking Dates */}
        {editingBooking && (
          <div className="modal-overlay" role="dialog" aria-modal="true">
            <div className="modal-card">
              <div className="modal-header">
                <h2 className="modal-title">Modify Reservation Dates</h2>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={handleCancelEdit}
                  aria-label="Close dialog"
                >
                  ✕
                </button>
              </div>

              <p className="modal-subtitle">
                {editingBooking.listing?.title || 'Selected property'}
              </p>

              {actionError && (
                <div className="auth-error-alert" role="alert" style={{ marginBottom: '16px' }}>
                  <span>{actionError}</span>
                </div>
              )}

              <form onSubmit={handleUpdateSubmit}>
                <div className="modal-form-grid">
                  <div className="form-group">
                    <label htmlFor="edit-checkin" className="form-label">
                      New Check-in
                    </label>
                    <input
                      id="edit-checkin"
                      type="date"
                      className="form-input"
                      value={editCheckIn}
                      onChange={(e) => setEditCheckIn(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="edit-checkout" className="form-label">
                      New Check-out
                    </label>
                    <input
                      id="edit-checkout"
                      type="date"
                      className="form-input"
                      min={editCheckIn}
                      value={editCheckOut}
                      onChange={(e) => setEditCheckOut(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="state-btn state-btn-secondary"
                    onClick={handleCancelEdit}
                    disabled={isUpdating}
                  >
                    Keep current dates
                  </button>
                  <button
                    type="submit"
                    className="btn-auth-submit"
                    style={{ width: 'auto', padding: '12px 24px' }}
                    disabled={isUpdating}
                  >
                    {isUpdating ? 'Updating...' : 'Save new dates'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Cancel Booking Confirmation */}
        {cancellingBookingId && (
          <div className="modal-overlay" role="dialog" aria-modal="true">
            <div className="modal-card">
              <div className="modal-header">
                <h2 className="modal-title">Cancel Reservation?</h2>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setCancellingBookingId(null)}
                  aria-label="Close dialog"
                >
                  ✕
                </button>
              </div>

              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', margin: '16px 0 24px' }}>
                Are you sure you want to cancel this booking? This action will release the reserved dates back to the host and cannot be undone.
              </p>

              <div className="modal-actions">
                <button
                  type="button"
                  className="state-btn state-btn-secondary"
                  onClick={() => setCancellingBookingId(null)}
                  disabled={isCancelling}
                >
                  Never mind
                </button>
                <button
                  type="button"
                  className="btn-booking-cancel-confirm"
                  onClick={handleConfirmCancel}
                  disabled={isCancelling}
                >
                  {isCancelling ? 'Cancelling...' : 'Yes, cancel booking'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
