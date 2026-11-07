import React from 'react';

/**
 * SearchBar Component
 * Provides real-time filtering for title/keyword, location, and min/max price.
 */
export default function SearchBar({
  searchTerm,
  setSearchTerm,
  location,
  setLocation,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  onClearFilters,
  hasActiveFilters,
}) {
  return (
    <section className="search-section">
      <div className="container">
        <div className="search-bar-wrapper">
          {/* Keyword / Title search */}
          <div className="search-input-group">
            <label htmlFor="search-title" className="search-label">
              Where to?
            </label>
            <input
              id="search-title"
              type="text"
              className="search-input"
              placeholder="Search by title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Location filter */}
          <div className="search-input-group">
            <label htmlFor="search-location" className="search-label">
              Destination
            </label>
            <input
              id="search-location"
              type="text"
              className="search-input"
              placeholder="City, country or region..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          {/* Price Range Filter */}
          <div className="search-input-group">
            <label className="search-label">Price per night (₹)</label>
            <div className="price-inputs">
              <input
                type="number"
                min="0"
                className="price-mini-input"
                placeholder="Min ₹"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                aria-label="Minimum price per night in INR"
              />
              <span className="price-separator">–</span>
              <input
                type="number"
                min="0"
                className="price-mini-input"
                placeholder="Max ₹"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                aria-label="Maximum price per night in INR"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="search-actions">
            {hasActiveFilters && (
              <button
                type="button"
                className="btn-clear-filters"
                onClick={onClearFilters}
              >
                Clear filters
              </button>
            )}

            <button
              type="button"
              className="btn-search-submit"
              aria-label="Search listings"
              title="Filter listings"
            >
              <svg
                viewBox="0 0 32 32"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
              >
                <circle cx="14" cy="14" r="9" />
                <path d="M21 21l8 8" />
              </svg>
              <span>Search</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
