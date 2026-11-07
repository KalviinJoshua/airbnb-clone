import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { fetchListingById, createBooking } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PropertyMap from '../components/PropertyMap';
import ListingReviews from '../components/ListingReviews';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80';

const SECONDARY_FALLBACKS = [
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=80',
];

/**
 * Format today's date as YYYY-MM-DD for HTML input min attributes
 */
function getTodayString() {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

/**
 * Get date string incremented by 1 day
 */
function getNextDayString(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  date.setDate(date.getDate() + 1);
  return date.toISOString().split('T')[0];
}

/**
 * ListingDetails Page Component
 * Shows complete information for an accommodation and enables authenticated reservations.
 */
export default function ListingDetails() {
  const { id } = useParams();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Booking form state
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const loadListing = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchListingById(id);
      if (!data) {
        throw new Error('Listing not found.');
      }
      setListing(data);
    } catch (err) {
      setError(err.message || 'Failed to load listing details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadListing();
  }, [id]);

  // Calculate nights and estimated total whenever dates change
  const { nights, estimatedTotal } = useMemo(() => {
    if (!checkIn || !checkOut || !listing?.pricePerNight) {
      return { nights: 0, estimatedTotal: 0 };
    }

    const start = new Date(checkIn);
    const end = new Date(checkOut);

    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const diffInMs = end.getTime() - start.getTime();
    if (diffInMs <= 0) {
      return { nights: 0, estimatedTotal: 0 };
    }

    const calculatedNights = Math.round(diffInMs / (1000 * 60 * 60 * 24));
    const total = calculatedNights * listing.pricePerNight;

    return { nights: calculatedNights, estimatedTotal: total };
  }, [checkIn, checkOut, listing]);

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setBookingError('');
    setBookingSuccess(null);

    // Require authentication
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
      return;
    }

    // Validation
    if (!checkIn || !checkOut) {
      setBookingError('Please select both check-in and check-out dates.');
      return;
    }

    const start = new Date(checkIn);
    const end = new Date(checkOut);
    if (end <= start) {
      setBookingError('Check-out date must be later than check-in date.');
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await createBooking({
        listing: listing._id,
        checkIn,
        checkOut,
      });

      setBookingSuccess(result.message || 'Reservation confirmed successfully!');
      // Reset dates after successful booking
      setCheckIn('');
      setCheckOut('');
    } catch (err) {
      if (err.status === 409) {
        setBookingError(
          'The selected dates are unavailable for this listing. Please choose different dates.'
        );
      } else {
        setBookingError(err.message || 'Failed to complete booking. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Loading State
  if (loading) {
    return (
      <div className="container">
        <div className="state-container">
          <div className="spinner" aria-label="Loading listing details" />
          <p className="state-title">Loading property details...</p>
        </div>
      </div>
    );
  }

  // Handle Error / Not Found State
  if (error || !listing) {
    return (
      <div className="container">
        <div className="state-container">
          <svg
            className="state-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ff385c"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <h2 className="state-title">
            {error?.includes('not found') || error?.includes('404')
              ? 'Listing not found'
              : 'Error loading listing'}
          </h2>
          <p className="state-description">
            {error || 'The listing you are looking for does not exist or may have been removed.'}
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Link to="/" className="state-btn">
              Back to all listings
            </Link>
            <button
              type="button"
              className="state-btn state-btn-secondary"
              onClick={loadListing}
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const images = listing.images && listing.images.length > 0 ? listing.images : [FALLBACK_IMAGE];
  const primaryImage = images[0] || FALLBACK_IMAGE;
  const secondaryImage1 = images[1] || SECONDARY_FALLBACKS[0];
  const secondaryImage2 = images[2] || SECONDARY_FALLBACKS[1];
  const hostName = listing.host?.name || 'Verified Host';

  return (
    <div className="details-page">
      <div className="container">
        {/* Back navigation */}
        <div className="back-nav">
          <Link to="/" className="back-nav-btn">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span>Back to listings</span>
          </Link>
        </div>

        {/* Title & Location Header */}
        <div className="details-header">
          <h1 className="details-title">{listing.title}</h1>
          <div className="details-meta-row">
            <span className="details-location">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z" />
              </svg>
              {listing.location}
            </span>
            <span>★ 4.98 · Superhost · Verified stay</span>
          </div>
        </div>

        {/* Image Gallery */}
        <div className={`details-gallery ${images.length === 1 ? 'details-gallery-single' : ''}`}>
          <div className="gallery-primary-image-wrapper">
            <img
              src={primaryImage}
              alt={`Main photo of ${listing.title} in ${listing.location}`}
              className="gallery-primary-image"
              loading="eager"
              decoding="async"
              width="800"
              height="500"
              onError={(e) => {
                e.target.src = FALLBACK_IMAGE;
              }}
            />
          </div>

          {images.length > 1 && (
            <div className="gallery-secondary-grid">
              <div className="gallery-secondary-image-wrapper">
                <img
                  src={secondaryImage1}
                  alt={`Interior view of ${listing.title}`}
                  className="gallery-secondary-image"
                  loading="lazy"
                  decoding="async"
                  width="400"
                  height="250"
                  onError={(e) => {
                    e.target.src = SECONDARY_FALLBACKS[0];
                  }}
                />
              </div>
              <div className="gallery-secondary-image-wrapper">
                <img
                  src={secondaryImage2}
                  alt={`Living space of ${listing.title}`}
                  className="gallery-secondary-image"
                  loading="lazy"
                  decoding="async"
                  width="400"
                  height="250"
                  onError={(e) => {
                    e.target.src = SECONDARY_FALLBACKS[1];
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Main Content Grid: Information + Functional Booking Card */}
        <div className="details-content-grid">
          {/* Left Column: Details & Amenities */}
          <div className="details-main-info">
            {/* Host Section */}
            <div className="details-host-section">
              <div>
                <h2 className="details-section-title" style={{ marginBottom: '4px' }}>
                  Entire home hosted by {hostName}
                </h2>
                <p style={{ color: 'var(--text-secondary)' }}>
                  4 guests · 2 bedrooms · 2 beds · 1 private bath
                </p>
              </div>
              <div className="host-avatar-large" title={hostName}>
                {hostName.charAt(0).toUpperCase()}
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="details-section-title">About this place</h3>
              <p className="details-description-text">{listing.description}</p>
            </div>

            {/* Amenities Preview */}
            <div>
              <h3 className="details-section-title">What this place offers</h3>
              <div className="amenities-grid">
                <div className="amenity-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01" />
                  </svg>
                  <span>Fast wifi (150 Mbps)</span>
                </div>
                <div className="amenity-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="7" width="20" height="15" rx="2" ry="2" />
                    <polyline points="17 2 12 7 7 2" />
                  </svg>
                  <span>Dedicated workspace</span>
                </div>
                <div className="amenity-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  <span>Self check-in with keypad</span>
                </div>
                <div className="amenity-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  <span>Smoke alarm & carbon monoxide alarm</span>
                </div>
              </div>
            </div>

            {/* Map Integration (OpenStreetMap + Leaflet) */}
            <PropertyMap location={listing.location} title={listing.title} />

            {/* Reviews & Ratings Section */}
            <ListingReviews listingId={listing._id} />
          </div>

          {/* Right Column: Functional Sticky Booking Widget */}
          <aside>
            <div className="booking-widget-card">
              <div className="widget-price-header">
                <div>
                  <span className="widget-price-large">
                    ₹{listing.pricePerNight?.toLocaleString('en-IN') || listing.pricePerNight}
                  </span>
                  <span className="widget-price-unit"> / night</span>
                </div>
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>★ 4.98</span>
              </div>

              {/* Success Notification */}
              {bookingSuccess && (
                <div className="booking-success-alert" role="status">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <div>
                    <strong>{bookingSuccess}</strong>
                    <div style={{ marginTop: '4px' }}>
                      <Link to="/my-bookings" className="alert-action-link">
                        View in My Bookings →
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Notification */}
              {bookingError && (
                <div className="auth-error-alert" role="alert">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{bookingError}</span>
                </div>
              )}

              {/* Booking Form */}
              <form onSubmit={handleBookingSubmit}>
                <div className="widget-dates-box">
                  <div className="widget-date-field">
                    <label htmlFor="check-in-date" className="widget-date-label">
                      Check-in
                    </label>
                    <input
                      id="check-in-date"
                      type="date"
                      className="widget-date-input"
                      min={getTodayString()}
                      value={checkIn}
                      onChange={(e) => {
                        setCheckIn(e.target.value);
                        if (checkOut && e.target.value >= checkOut) {
                          setCheckOut('');
                        }
                      }}
                      required
                    />
                  </div>

                  <div className="widget-date-field">
                    <label htmlFor="check-out-date" className="widget-date-label">
                      Check-out
                    </label>
                    <input
                      id="check-out-date"
                      type="date"
                      className="widget-date-input"
                      min={getNextDayString(checkIn) || getTodayString()}
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      disabled={!checkIn}
                      required
                    />
                  </div>
                </div>

                {/* Reserve Button */}
                <button
                  type="submit"
                  className="btn-book-placeholder"
                  disabled={isSubmitting}
                  style={{ marginTop: '16px' }}
                >
                  {isSubmitting ? (
                    'Confirming reservation...'
                  ) : !isAuthenticated ? (
                    'Log in to Reserve'
                  ) : (
                    'Reserve'
                  )}
                </button>
              </form>

              <p className="widget-notice">
                {isAuthenticated
                  ? "You won't be charged until confirmed"
                  : 'You will be redirected to log in'}
              </p>

              {/* Price Calculation breakdown (dynamically updated) */}
              {nights > 0 && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    borderTop: '1px solid var(--border-light)',
                    paddingTop: '16px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <span style={{ textDecoration: 'underline' }}>
                      ₹{listing.pricePerNight?.toLocaleString('en-IN')} × {nights}{' '}
                      {nights === 1 ? 'night' : 'nights'}
                    </span>
                    <span>₹{estimatedTotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontWeight: 700,
                      fontSize: '1.05rem',
                      borderTop: '1px solid var(--border-light)',
                      paddingTop: '12px',
                      marginTop: '4px',
                    }}
                  >
                    <span>Total (before taxes)</span>
                    <span>₹{estimatedTotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
