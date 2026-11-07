import React from 'react';
import ListingCard from './ListingCard';

/**
 * ListingGrid Component
 * Renders the responsive grid of ListingCards or appropriate empty/no-result states.
 */
export default function ListingGrid({
  listings,
  totalCount,
  hasActiveFilters,
  onClearFilters,
}) {
  // Case 1: Backend has no listings at all
  if (totalCount === 0) {
    return (
      <div className="state-container">
        <svg
          className="state-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        <h2 className="state-title">No listings available</h2>
        <p className="state-description">
          There are currently no accommodations published in the system. Check
          back later or add a new listing to get started!
        </p>
      </div>
    );
  }

  // Case 2: Listings exist, but search filters yielded 0 matches
  if (listings.length === 0) {
    return (
      <div className="state-container">
        <svg
          className="state-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
          <line x1="8" y1="11" x2="14" y2="11" />
        </svg>
        <h2 className="state-title">No matches found</h2>
        <p className="state-description">
          Try adjusting your search criteria, clearing price boundaries, or
          searching for a broader location.
        </p>
        {hasActiveFilters && (
          <button
            type="button"
            className="state-btn state-btn-secondary"
            onClick={onClearFilters}
          >
            Clear all filters
          </button>
        )}
      </div>
    );
  }

  // Case 3: Listings found
  return (
    <div className="listing-grid-container">
      <div className="search-summary-bar">
        <span>
          Showing <strong className="search-results-count">{listings.length}</strong>{' '}
          {listings.length === 1 ? 'stay' : 'stays'}
          {hasActiveFilters ? ` (filtered from ${totalCount})` : ''}
        </span>
      </div>

      <div className="listing-grid">
        {listings.map((listing) => (
          <ListingCard key={listing._id} listing={listing} />
        ))}
      </div>
    </div>
  );
}
