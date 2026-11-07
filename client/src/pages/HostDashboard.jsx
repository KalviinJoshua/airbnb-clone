import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  fetchListings,
  createListing,
  updateListing,
  deleteListing,
} from '../services/api';
import { useAuth } from '../context/AuthContext';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80';

/**
 * HostDashboard Page Component
 * Allows hosts to view, create, edit, and delete their published listings.
 */
export default function HostDashboard() {
  const { user } = useAuth();
  const [myListings, setMyListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  // Modal State for Create / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingListingId, setEditingListingId] = useState(null); // null = create mode
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    pricePerNight: '',
    imagesInput: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Deletion Confirmation State
  const [deletingId, setDeletingId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load and filter listings authored by the logged-in host
  const loadHostListings = async () => {
    try {
      setLoading(true);
      setError(null);
      const allListings = await fetchListings();
      // Filter listings where host matches authenticated host's ID
      const filtered = allListings.filter((item) => {
        const hostId = item.host?._id || item.host;
        return hostId && user?._id && hostId.toString() === user._id.toString();
      });
      setMyListings(filtered);
    } catch (err) {
      setError(err.message || 'Failed to load your listings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHostListings();
  }, [user]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingListingId(null);
    setFormData({
      title: '',
      description: '',
      location: '',
      pricePerNight: '',
      imagesInput: '',
    });
    setActionError('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (listing) => {
    setEditingListingId(listing._id);
    setFormData({
      title: listing.title || '',
      description: listing.description || '',
      location: listing.location || '',
      pricePerNight: listing.pricePerNight || '',
      imagesInput: (listing.images || []).join('\n'),
    });
    setActionError('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingListingId(null);
    setActionError('');
  };

  // Submit Listing (Create or Update)
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');

    // Validations
    if (
      !formData.title.trim() ||
      !formData.description.trim() ||
      !formData.location.trim() ||
      !formData.pricePerNight
    ) {
      setActionError('Title, description, location, and price per night are required.');
      return;
    }

    const price = Number(formData.pricePerNight);
    if (isNaN(price) || price < 1) {
      setActionError('Price per night must be a valid number of at least ₹1.');
      return;
    }

    // Split image URLs by comma or newlines and clean whitespace
    const parsedImages = formData.imagesInput
      .split(/[\n,]/)
      .map((url) => url.trim())
      .filter((url) => url.length > 0);

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      location: formData.location.trim(),
      pricePerNight: price,
      images: parsedImages,
    };

    try {
      setIsSubmitting(true);
      if (editingListingId) {
        // Update existing listing
        const res = await updateListing(editingListingId, payload);
        setActionSuccess(res.message || 'Listing updated successfully!');
      } else {
        // Create new listing
        const res = await createListing(payload);
        setActionSuccess(res.message || 'Listing created and published successfully!');
      }

      handleCloseModal();
      await loadHostListings();
    } catch (err) {
      setActionError(err.message || 'Failed to save listing. Please check the inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Deletion
  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    setActionError('');
    setActionSuccess('');

    try {
      setIsDeleting(true);
      const res = await deleteListing(deletingId);
      setActionSuccess(res.message || 'Listing deleted successfully.');
      setDeletingId(null);
      await loadHostListings();
    } catch (err) {
      setActionError(err.message || 'Failed to delete listing.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="host-dashboard-page">
      <div className="container">
        {/* Header Section */}
        <div className="dashboard-header-row">
          <div>
            <h1 className="bookings-title">Host Dashboard</h1>
            <p className="bookings-subtitle">
              Manage your published listings, update property details, or host a new home
            </p>
          </div>
          <button
            type="button"
            className="btn-search-submit"
            onClick={handleOpenCreate}
            style={{ borderRadius: 'var(--radius-sm)' }}
          >
            <span>+ Create New Listing</span>
          </button>
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

        {/* Error Alert */}
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
            <div className="spinner" aria-label="Loading your listings" />
            <p className="state-title">Loading your host dashboard...</p>
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
            <h2 className="state-title">Error loading listings</h2>
            <p className="state-description">{error}</p>
            <button type="button" className="state-btn" onClick={loadHostListings}>
              Try again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && myListings.length === 0 && (
          <div className="state-container">
            <svg className="state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <h2 className="state-title">You don't have any listings yet</h2>
            <p className="state-description">
              Earn by hosting travellers from around the world. Publish your first property listing today!
            </p>
            <button
              type="button"
              className="state-btn"
              onClick={handleOpenCreate}
            >
              + Create your first listing
            </button>
          </div>
        )}

        {/* Listings Grid */}
        {!loading && !error && myListings.length > 0 && (
          <div className="dashboard-listings-grid">
            {myListings.map((listing) => {
              const imageSrc =
                listing.images && listing.images.length > 0
                  ? listing.images[0]
                  : FALLBACK_IMAGE;

              return (
                <div key={listing._id} className="host-listing-card">
                  <div className="host-listing-media">
                    <img
                      src={imageSrc}
                      alt={listing.title}
                      className="host-listing-image"
                      onError={(e) => {
                        e.target.src = FALLBACK_IMAGE;
                      }}
                    />
                  </div>

                  <div className="host-listing-body">
                    <div className="host-listing-info">
                      <h3 className="host-listing-title" title={listing.title}>
                        <Link to={`/listings/${listing._id}`}>
                          {listing.title}
                        </Link>
                      </h3>
                      <p className="host-listing-location">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z" />
                        </svg>
                        <span>{listing.location}</span>
                      </p>
                      <div className="host-listing-price">
                        <strong>₹{listing.pricePerNight?.toLocaleString('en-IN')}</strong> / night
                      </div>
                    </div>

                    <div className="host-listing-actions">
                      <Link
                        to={`/listings/${listing._id}`}
                        className="btn-booking-action btn-booking-edit"
                        style={{ textAlign: 'center' }}
                      >
                        View
                      </Link>
                      <button
                        type="button"
                        className="btn-booking-action btn-booking-edit"
                        onClick={() => handleOpenEdit(listing)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn-booking-action btn-booking-cancel"
                        onClick={() => setDeletingId(listing._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal: Create / Edit Listing Form */}
        {isModalOpen && (
          <div className="modal-overlay" role="dialog" aria-modal="true">
            <div className="modal-card" style={{ maxWidth: '600px' }}>
              <div className="modal-header">
                <h2 className="modal-title">
                  {editingListingId ? 'Edit Listing Details' : 'Create a New Listing'}
                </h2>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={handleCloseModal}
                >
                  ✕
                </button>
              </div>

              {actionError && (
                <div className="auth-error-alert" style={{ margin: '16px 0' }}>
                  <span>{actionError}</span>
                </div>
              )}

              <form onSubmit={handleFormSubmit} style={{ marginTop: '16px' }}>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label htmlFor="listing-title" className="form-label">
                    Property Title
                  </label>
                  <input
                    id="listing-title"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Luxurious Villa with Sea View"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label htmlFor="listing-location" className="form-label">
                    Location
                  </label>
                  <input
                    id="listing-location"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Goa, India"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label htmlFor="listing-price" className="form-label">
                    Price per Night (₹)
                  </label>
                  <input
                    id="listing-price"
                    type="number"
                    min="1"
                    className="form-input"
                    placeholder="e.g. 4500"
                    value={formData.pricePerNight}
                    onChange={(e) =>
                      setFormData({ ...formData, pricePerNight: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label htmlFor="listing-desc" className="form-label">
                    Description
                  </label>
                  <textarea
                    id="listing-desc"
                    className="form-input"
                    rows={4}
                    placeholder="Describe your accommodation, bedrooms, amenities, and surroundings..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '24px' }}>
                  <label htmlFor="listing-images" className="form-label">
                    Image URLs (separate with newlines or commas)
                  </label>
                  <textarea
                    id="listing-images"
                    className="form-input"
                    rows={3}
                    placeholder="https://example.com/photo1.jpg&#10;https://example.com/photo2.jpg"
                    value={formData.imagesInput}
                    onChange={(e) =>
                      setFormData({ ...formData, imagesInput: e.target.value })
                    }
                  />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Optional: If left blank, a high-quality placeholder image will be used.
                  </span>
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="state-btn state-btn-secondary"
                    onClick={handleCloseModal}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-auth-submit"
                    style={{ width: 'auto', padding: '12px 28px' }}
                    disabled={isSubmitting}
                  >
                    {isSubmitting
                      ? 'Saving...'
                      : editingListingId
                      ? 'Save Changes'
                      : 'Publish Listing'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Delete Listing Confirmation */}
        {deletingId && (
          <div className="modal-overlay" role="dialog" aria-modal="true">
            <div className="modal-card">
              <div className="modal-header">
                <h2 className="modal-title">Delete Listing?</h2>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setDeletingId(null)}
                >
                  ✕
                </button>
              </div>

              <p style={{ color: 'var(--text-secondary)', margin: '16px 0 24px', lineHeight: '1.6' }}>
                Are you sure you want to permanently delete this listing? All property information will be removed. This action cannot be undone.
              </p>

              <div className="modal-actions">
                <button
                  type="button"
                  className="state-btn state-btn-secondary"
                  onClick={() => setDeletingId(null)}
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-booking-cancel-confirm"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Yes, Delete Listing'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
