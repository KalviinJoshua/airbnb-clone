import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  fetchListingReviews,
  createReview,
  updateReview,
  deleteReview,
} from '../services/api';
import { useAuth } from '../context/AuthContext';

/**
 * Format date to Month Year (e.g. "November 2026")
 */
function formatReviewDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Render visual star icons
 */
function StarRating({ rating }) {
  return (
    <div className="star-rating-display" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`star-icon ${star <= rating ? 'star-filled' : 'star-empty'}`}
        >
          ★
        </span>
      ))}
    </div>
  );
}

/**
 * ListingReviews Component
 * Renders the reviews section on the Listing Details page, including review submission, editing, and deletion.
 */
export default function ListingReviews({ listingId }) {
  const { user, isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New review form state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit review state
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete review state
  const [deletingReviewId, setDeletingReviewId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchListingReviews(listingId);
      setReviews(data);
    } catch (err) {
      setError(err.message || 'Failed to load reviews.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (listingId) {
      loadReviews();
    }
  }, [listingId]);

  // Compute average rating
  const averageRating = useMemo(() => {
    if (!reviews || reviews.length === 0) return null;
    const sum = reviews.reduce((acc, curr) => acc + (curr.rating || 0), 0);
    return (sum / reviews.length).toFixed(1);
  }, [reviews]);

  // Handle Review Submission
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');

    if (!comment.trim()) {
      setSubmitError('Please enter a review comment.');
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await createReview({
        listing: listingId,
        rating,
        comment: comment.trim(),
      });

      setSubmitSuccess(result.message || 'Review submitted successfully!');
      setComment('');
      setRating(5);
      await loadReviews();
    } catch (err) {
      if (err.status === 403) {
        setSubmitError(
          'Eligibility Notice: You can only submit a review after completing a confirmed stay at this property.'
        );
      } else if (err.status === 409) {
        setSubmitError('You have already submitted a review for this property.');
      } else {
        setSubmitError(err.message || 'Failed to post review. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Start Editing Review
  const handleStartEdit = (review) => {
    setEditingReviewId(review._id);
    setEditRating(review.rating);
    setEditComment(review.comment);
    setSubmitError('');
  };

  // Submit Review Update
  const handleUpdateReview = async (e) => {
    e.preventDefault();
    if (!editingReviewId) return;

    try {
      setIsUpdating(true);
      await updateReview(editingReviewId, {
        rating: editRating,
        comment: editComment.trim(),
      });
      setEditingReviewId(null);
      await loadReviews();
    } catch (err) {
      alert(err.message || 'Failed to update review.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Confirm and Delete Review
  const handleDeleteReview = async (id) => {
    try {
      setIsDeleting(true);
      await deleteReview(id);
      setDeletingReviewId(null);
      await loadReviews();
    } catch (err) {
      alert(err.message || 'Failed to delete review.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section className="listing-reviews-section">
      {/* Reviews Header with Aggregated Score */}
      <div className="reviews-header-row">
        <h3 className="details-section-title" style={{ margin: 0 }}>
          {averageRating ? (
            <>
              ★ {averageRating} · {reviews.length}{' '}
              {reviews.length === 1 ? 'review' : 'reviews'}
            </>
          ) : (
            'Guest Reviews'
          )}
        </h3>
      </div>

      {/* Review Loading State */}
      {loading && (
        <div style={{ padding: '24px 0', color: 'var(--text-secondary)' }}>
          Loading guest reviews...
        </div>
      )}

      {/* Review Error State */}
      {!loading && error && (
        <div className="auth-error-alert" style={{ margin: '16px 0' }}>
          <span>{error}</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && reviews.length === 0 && (
        <div className="reviews-empty-box">
          <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1.05rem' }}>
            No reviews yet
          </p>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
            Be one of the first guests to review this home after your stay!
          </p>
        </div>
      )}

      {/* Reviews List */}
      {!loading && reviews.length > 0 && (
        <div className="reviews-grid">
          {reviews.map((rev) => {
            const isAuthor =
              isAuthenticated &&
              user &&
              ((rev.user?._id && rev.user._id === user._id) ||
                rev.user === user._id);

            return (
              <div key={rev._id} className="review-card">
                <div className="review-card-top">
                  <div className="reviewer-avatar">
                    {(rev.user?.name || 'G').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="reviewer-name">{rev.user?.name || 'Verified Guest'}</h4>
                    <span className="review-date">{formatReviewDate(rev.createdAt)}</span>
                  </div>
                </div>

                <div className="review-stars-row">
                  <StarRating rating={rev.rating} />
                </div>

                <p className="review-comment-text">{rev.comment}</p>

                {/* Author Controls */}
                {isAuthor && (
                  <div className="review-author-actions">
                    <button
                      type="button"
                      className="btn-review-link"
                      onClick={() => handleStartEdit(rev)}
                    >
                      Edit
                    </button>
                    <span>·</span>
                    <button
                      type="button"
                      className="btn-review-link btn-review-danger"
                      onClick={() => setDeletingReviewId(rev._id)}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Submission Form Section */}
      <div className="review-submission-box">
        <h4 className="review-form-title">Leave a Review</h4>

        {isAuthenticated ? (
          <form onSubmit={handleSubmitReview} className="review-form">
            {submitSuccess && (
              <div className="booking-success-alert" style={{ marginBottom: '16px' }}>
                <span>{submitSuccess}</span>
              </div>
            )}

            {submitError && (
              <div className="auth-error-alert" style={{ marginBottom: '16px' }}>
                <span>{submitError}</span>
              </div>
            )}

            {/* Star Rating Picker */}
            <div className="form-group">
              <label className="form-label">Rating</label>
              <div className="rating-picker">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`star-pick-btn ${star <= rating ? 'active' : ''}`}
                    onClick={() => setRating(star)}
                    aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                  >
                    ★
                  </button>
                ))}
                <span className="rating-picker-label">{rating} of 5 Stars</span>
              </div>
            </div>

            {/* Comment Textarea */}
            <div className="form-group">
              <label htmlFor="review-comment" className="form-label">
                Your Feedback
              </label>
              <textarea
                id="review-comment"
                className="form-input"
                rows={4}
                placeholder="Share your stay experience, the host's hospitality, and property amenities..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn-auth-submit"
              style={{ width: 'auto', padding: '12px 28px' }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Post Review'}
            </button>
          </form>
        ) : (
          <div className="review-auth-prompt">
            <p>
              Completed a stay at this place?{' '}
              <Link to="/login" className="auth-switch-link">
                Log in
              </Link>{' '}
              to submit your verified guest review.
            </p>
          </div>
        )}
      </div>

      {/* Edit Review Modal */}
      {editingReviewId && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-header">
              <h2 className="modal-title">Edit Your Review</h2>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setEditingReviewId(null)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateReview} style={{ marginTop: '16px' }}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Rating</label>
                <div className="rating-picker">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`star-pick-btn ${star <= editRating ? 'active' : ''}`}
                      onClick={() => setEditRating(star)}
                    >
                      ★
                    </button>
                  ))}
                  <span className="rating-picker-label">{editRating} of 5</span>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">Feedback</label>
                <textarea
                  className="form-input"
                  rows={4}
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  required
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="state-btn state-btn-secondary"
                  onClick={() => setEditingReviewId(null)}
                  disabled={isUpdating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-auth-submit"
                  style={{ width: 'auto', padding: '12px 24px' }}
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Review Confirmation Modal */}
      {deletingReviewId && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-header">
              <h2 className="modal-title">Delete Review?</h2>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setDeletingReviewId(null)}
              >
                ✕
              </button>
            </div>
            <p style={{ color: 'var(--text-secondary)', margin: '16px 0 24px' }}>
              Are you sure you want to delete this review? This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="state-btn state-btn-secondary"
                onClick={() => setDeletingReviewId(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-booking-cancel-confirm"
                onClick={() => handleDeleteReview(deletingReviewId)}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
