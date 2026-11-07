/**
 * API Service for communicating with the Airbnb Clone backend.
 *
 * Production Readiness:
 * - Uses VITE_API_URL for the deployed backend URL.
 * - In production builds, removes hardcoded localhost fallback assumptions.
 * - In development mode, falls back to http://localhost:5000/api for developer ergonomics.
 */

const rawApiUrl = import.meta.env.VITE_API_URL;
const isDev = Boolean(import.meta.env.DEV);

// Clean trailing slashes if present
export const API_BASE_URL = rawApiUrl
  ? rawApiUrl.replace(/\/+$/, '')
  : isDev
  ? 'http://localhost:5000/api'
  : '';

if (!API_BASE_URL && !isDev) {
  console.warn(
    '[CONFIG WARNING] VITE_API_URL environment variable is not defined in production build. Please configure VITE_API_URL in your Vercel project settings.'
  );
}

/**
 * Helper to retrieve the stored JWT authentication token.
 * @returns {string|null}
 */
export function getStoredToken() {
  return localStorage.getItem('token');
}

/**
 * Generic request helper with error handling for both network and HTTP errors.
 * Attaches the JWT Bearer token only when requiresAuth is true.
 *
 * @param {string} endpoint - Path relative to API_BASE_URL (e.g. '/listings')
 * @param {RequestInit} [options={}] - Standard fetch options
 * @param {boolean} [requiresAuth=false] - Whether to include the Authorization header
 * @returns {Promise<any>}
 */
async function request(endpoint, options = {}, requiresAuth = false) {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (requiresAuth) {
    const token = getStoredToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
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
    // If the browser fails to connect (server sleeping, network down, or wrong URL)
    if (error.name === 'TypeError' && error.message.toLowerCase().includes('fetch')) {
      const target = API_BASE_URL || 'the backend API';
      const networkError = new Error(
        `Unable to reach the backend server (${target}). If the backend is hosted on a free tier (e.g. Render), it may take 30–60 seconds to wake up from spin-down. Please retry momentarily.`
      );
      networkError.isNetworkError = true;
      throw networkError;
    }
    throw error;
  }
}

/* ==========================================================================
   Authentication Endpoints
   ========================================================================== */

/**
 * Authenticate user with email and password. (Public)
 * @param {Object} credentials - { email, password }
 * @returns {Promise<{ message: string, token: string, user: Object }>}
 */
export async function loginUser(credentials) {
  return request(
    '/auth/login',
    {
      method: 'POST',
      body: JSON.stringify(credentials),
    },
    false
  );
}

/**
 * Register a new user account. (Public)
 * Note: By default, accounts are created with the 'user' role.
 * Optional hostSecretCode can be supplied to request host privileges.
 * @param {Object} userData - { name, email, password, role, hostSecretCode }
 * @returns {Promise<{ message: string, user: Object }>}
 */
export async function registerUser(userData) {
  return request(
    '/auth/register',
    {
      method: 'POST',
      body: JSON.stringify(userData),
    },
    false
  );
}

/**
 * Upgrade authenticated user to the Host role. (Protected - Requires JWT)
 * @param {string} hostSecretCode - Host authorization passcode
 * @returns {Promise<{ message: string, token: string, user: Object }>}
 */
export async function upgradeToHost(hostSecretCode) {
  return request(
    '/auth/upgrade-to-host',
    {
      method: 'POST',
      body: JSON.stringify({ hostSecretCode }),
    },
    true
  );
}

/* ==========================================================================
   Listings Endpoints
   ========================================================================== */

/**
 * Fetch all property listings. (Public)
 * @returns {Promise<Array>} Array of listing objects
 */
export async function fetchListings() {
  const data = await request('/listings', {}, false);
  return data.listings || [];
}

/**
 * Fetch a single property listing by its ID. (Public)
 * @param {string} id - Listing MongoDB ObjectId
 * @returns {Promise<Object>} Listing document
 */
export async function fetchListingById(id) {
  const data = await request(`/listings/${id}`, {}, false);
  return data.listing;
}

/**
 * Create a new property listing. (Protected - Host role required)
 * @param {Object} listingData - { title, description, location, pricePerNight, images }
 * @returns {Promise<{ message: string, listing: Object }>}
 */
export async function createListing(listingData) {
  return request(
    '/listings',
    {
      method: 'POST',
      body: JSON.stringify(listingData),
    },
    true
  );
}

/**
 * Update an existing property listing. (Protected - Host owner required)
 * @param {string} id - Listing ObjectId
 * @param {Object} listingData - { title, description, location, pricePerNight, images }
 * @returns {Promise<{ message: string, listing: Object }>}
 */
export async function updateListing(id, listingData) {
  return request(
    `/listings/${id}`,
    {
      method: 'PUT',
      body: JSON.stringify(listingData),
    },
    true
  );
}

/**
 * Delete a property listing. (Protected - Host owner required)
 * @param {string} id - Listing ObjectId
 * @returns {Promise<{ message: string }>}
 */
export async function deleteListing(id) {
  return request(
    `/listings/${id}`,
    {
      method: 'DELETE',
    },
    true
  );
}

/* ==========================================================================
   Booking Endpoints (Protected - Require JWT)
   ========================================================================== */

/**
 * Create a new booking for a listing.
 * @param {Object} bookingData - { listing, checkIn, checkOut }
 * @returns {Promise<{ message: string, booking: Object }>}
 */
export async function createBooking(bookingData) {
  return request(
    '/bookings',
    {
      method: 'POST',
      body: JSON.stringify(bookingData),
    },
    true
  );
}

/**
 * Fetch all bookings belonging to the authenticated user.
 * @returns {Promise<Array>} Array of booking objects
 */
export async function fetchMyBookings() {
  const data = await request('/bookings', {}, true);
  return data.bookings || [];
}

/**
 * Fetch a single booking by ID.
 * @param {string} id - Booking ObjectId
 * @returns {Promise<Object>} Booking document
 */
export async function fetchBookingById(id) {
  const data = await request(`/bookings/${id}`, {}, true);
  return data.booking;
}

/**
 * Update checkIn and checkOut dates for a booking.
 * @param {string} id - Booking ObjectId
 * @param {Object} updateData - { checkIn, checkOut }
 * @returns {Promise<{ message: string, booking: Object }>}
 */
export async function updateBooking(id, updateData) {
  return request(
    `/bookings/${id}`,
    {
      method: 'PUT',
      body: JSON.stringify(updateData),
    },
    true
  );
}

/**
 * Cancel/delete a booking.
 * @param {string} id - Booking ObjectId
 * @returns {Promise<{ message: string }>}
 */
export async function cancelBooking(id) {
  return request(
    `/bookings/${id}`,
    {
      method: 'DELETE',
    },
    true
  );
}

/* ==========================================================================
   Reviews Endpoints
   ========================================================================== */

/**
 * Fetch all reviews for a listing. (Public)
 * @param {string} listingId - Listing ObjectId
 * @returns {Promise<Array>} Array of review objects
 */
export async function fetchListingReviews(listingId) {
  const data = await request(`/reviews/listing/${listingId}`, {}, false);
  return data.reviews || [];
}

/**
 * Submit a new review for a listing. (Protected - Completed stay required)
 * @param {Object} reviewData - { listing, rating, comment }
 * @returns {Promise<{ message: string, review: Object }>}
 */
export async function createReview(reviewData) {
  return request(
    '/reviews',
    {
      method: 'POST',
      body: JSON.stringify(reviewData),
    },
    true
  );
}

/**
 * Update an existing review. (Protected - Review author only)
 * @param {string} id - Review ObjectId
 * @param {Object} updateData - { rating, comment }
 * @returns {Promise<{ message: string, review: Object }>}
 */
export async function updateReview(id, updateData) {
  return request(
    `/reviews/${id}`,
    {
      method: 'PUT',
      body: JSON.stringify(updateData),
    },
    true
  );
}

/**
 * Delete an existing review. (Protected - Review author only)
 * @param {string} id - Review ObjectId
 * @returns {Promise<{ message: string }>}
 */
export async function deleteReview(id) {
  return request(
    `/reviews/${id}`,
    {
      method: 'DELETE',
    },
    true
  );
}
