import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchListingById } from '../services/api';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80';

const SECONDARY_FALLBACKS = [
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=80',
];

/**
 * ListingDetails Page Component
 * Shows complete information for a single accommodation listing.
 */
export default function ListingDetails() {
  const { id } = useParams();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  // Handle Loading
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

  // Handle Error / Not Found
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

  // Determine images to display
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
              alt={listing.title}
              className="gallery-primary-image"
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
                  alt={`${listing.title} preview 2`}
                  className="gallery-secondary-image"
                  onError={(e) => {
                    e.target.src = SECONDARY_FALLBACKS[0];
                  }}
                />
              </div>
              <div className="gallery-secondary-image-wrapper">
                <img
                  src={secondaryImage2}
                  alt={`${listing.title} preview 3`}
                  className="gallery-secondary-image"
                  onError={(e) => {
                    e.target.src = SECONDARY_FALLBACKS[1];
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Main Content Grid: Information + Sticky Booking Card */}
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
          </div>

          {/* Right Column: Sticky Booking Widget */}
          <aside>
            <div className="booking-widget-card">
              <div className="widget-price-header">
                <div>
                  <span className="widget-price-large">${listing.pricePerNight}</span>
                  <span className="widget-price-unit"> / night</span>
                </div>
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>★ 4.98</span>
              </div>

              {/* Date selection mockup */}
              <div className="widget-dates-box">
                <div className="widget-date-field">
                  <div className="widget-date-label">Check-in</div>
                  <div className="widget-date-val">Select date</div>
                </div>
                <div className="widget-date-field">
                  <div className="widget-date-label">Check-out</div>
                  <div className="widget-date-val">Select date</div>
                </div>
              </div>

              {/* Book Now button */}
              <button
                type="button"
                className="btn-book-placeholder"
                onClick={() =>
                  alert(
                    'Booking functionality is coming in Module 3 (Authentication & Bookings)!'
                  )
                }
              >
                <span>Reserve</span>
              </button>

              <p className="widget-notice">You won't be charged yet</p>

              {/* Price Calculation breakdown mockup */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                  <span style={{ textDecoration: 'underline' }}>${listing.pricePerNight} × 5 nights</span>
                  <span>${listing.pricePerNight * 5}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                  <span style={{ textDecoration: 'underline' }}>Cleaning fee</span>
                  <span>$60</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                  <span style={{ textDecoration: 'underline' }}>Airbnb service fee</span>
                  <span>$45</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.05rem', borderTop: '1px solid var(--border-light)', paddingTop: '12px', marginTop: '4px' }}>
                  <span>Total before taxes</span>
                  <span>${listing.pricePerNight * 5 + 105}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
