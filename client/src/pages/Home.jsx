import React, { useState, useEffect, useMemo } from 'react';
import SearchBar from '../components/SearchBar';
import ListingGrid from '../components/ListingGrid';
import { fetchListings } from '../services/api';

/**
 * Home Page Component
 * Fetches and displays all listings, with client-side search and price filtering.
 */
export default function Home() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // Fetch listings on component mount
  const loadListings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchListings();
      setListings(data);
    } catch (err) {
      setError(err.message || 'Failed to load listings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadListings();
  }, []);

  // Filter listings based on active filters
  const filteredListings = useMemo(() => {
    return listings.filter((listing) => {
      // 1. Title search
      if (
        searchTerm.trim() &&
        !listing.title.toLowerCase().includes(searchTerm.trim().toLowerCase())
      ) {
        return false;
      }

      // 2. Location search
      if (
        location.trim() &&
        !listing.location.toLowerCase().includes(location.trim().toLowerCase())
      ) {
        return false;
      }

      // 3. Minimum price
      if (minPrice !== '' && !isNaN(Number(minPrice))) {
        if (listing.pricePerNight < Number(minPrice)) {
          return false;
        }
      }

      // 4. Maximum price
      if (maxPrice !== '' && !isNaN(Number(maxPrice))) {
        if (listing.pricePerNight > Number(maxPrice)) {
          return false;
        }
      }

      return true;
    });
  }, [listings, searchTerm, location, minPrice, maxPrice]);

  const hasActiveFilters = Boolean(
    searchTerm.trim() || location.trim() || minPrice !== '' || maxPrice !== ''
  );

  const handleClearFilters = () => {
    setSearchTerm('');
    setLocation('');
    setMinPrice('');
    setMaxPrice('');
  };

  return (
    <div>
      {/* Search and Filter Bar */}
      <SearchBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        location={location}
        setLocation={setLocation}
        minPrice={minPrice}
        setMinPrice={setMinPrice}
        maxPrice={maxPrice}
        setMaxPrice={setMaxPrice}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      <div className="container">
        {/* Loading State */}
        {loading && (
          <div className="state-container">
            <div className="spinner" aria-label="Loading listings" />
            <p className="state-title">Discovering amazing places to stay...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="state-container">
            <svg
              className="state-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ff385c"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <h2 className="state-title">Something went wrong</h2>
            <p className="state-description">{error}</p>
            <button
              type="button"
              className="state-btn"
              onClick={loadListings}
            >
              Try again
            </button>
          </div>
        )}

        {/* Success State */}
        {!loading && !error && (
          <ListingGrid
            listings={filteredListings}
            totalCount={listings.length}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={handleClearFilters}
          />
        )}
      </div>
    </div>
  );
}
