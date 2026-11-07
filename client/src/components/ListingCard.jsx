import React, { useState } from 'react';
import { Link } from 'react-router-dom';

/**
 * Fallback image placeholder URL (Unsplash travel/architecture photo with neutral styling)
 */
const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80';

/**
 * ListingCard Component
 * Displays a summary card for a single listing linked to its details page.
 */
export default function ListingCard({ listing }) {
  const [imgSrc, setImgSrc] = useState(
    listing.images && listing.images.length > 0 ? listing.images[0] : FALLBACK_IMAGE
  );

  const hostName = listing.host?.name || 'Verified Host';

  return (
    <Link
      to={`/listings/${listing._id}`}
      className="listing-card"
      aria-label={`View details for ${listing.title}`}
    >
      <div className="listing-card-image-wrapper">
        <img
          src={imgSrc}
          alt={listing.title}
          className="listing-card-image"
          loading="lazy"
          onError={() => setImgSrc(FALLBACK_IMAGE)}
        />
        <div className="listing-card-badge">Guest favourite</div>
      </div>

      <div className="listing-card-content">
        <div className="listing-card-location-row">
          <span className="listing-card-location" title={listing.location}>
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z" />
            </svg>
            {listing.location}
          </span>
        </div>

        <h3 className="listing-card-title" title={listing.title}>
          {listing.title}
        </h3>

        <p className="listing-card-host">Hosted by {hostName}</p>

        <div className="listing-card-price-row">
          <span className="listing-card-price">
            ₹{listing.pricePerNight?.toLocaleString('en-IN') || listing.pricePerNight}
          </span>
          <span className="listing-card-unit">/ night</span>
        </div>
      </div>
    </Link>
  );
}
