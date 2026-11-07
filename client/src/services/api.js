/**
 * API Service for communicating with the Airbnb Clone backend.
 * Base URL defaults to http://localhost:5000/api or reads from VITE_API_URL.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Generic request helper with error handling for both network and HTTP errors.
 *
 * @param {string} endpoint - Path relative to API_BASE_URL (e.g. '/listings')
 * @param {RequestInit} [options={}] - Standard fetch options
 * @returns {Promise<any>}
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMessage =
        data?.message || `Request failed with status ${response.status}`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    // If the browser fails to connect (e.g. server is down or CORS blocked)
    if (error.name === 'TypeError' && error.message.toLowerCase().includes('fetch')) {
      const networkError = new Error(
        'Unable to reach the backend server. Please ensure the server is running on ' +
          API_BASE_URL
      );
      networkError.isNetworkError = true;
      throw networkError;
    }
    throw error;
  }
}

/**
 * Fetch all property listings.
 * @returns {Promise<Array>} Array of listing objects
 */
export async function fetchListings() {
  const data = await request('/listings');
  // Backend returns { listings: [...] }
  return data.listings || [];
}

/**
 * Fetch a single property listing by its ID.
 * @param {string} id - Listing MongoDB ObjectId
 * @returns {Promise<Object>} Listing document
 */
export async function fetchListingById(id) {
  const data = await request(`/listings/${id}`);
  // Backend returns { listing: {...} }
  return data.listing;
}
