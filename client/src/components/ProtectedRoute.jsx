import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute Component
 * Guards private pages from unauthenticated access and enforces role requirements when specified.
 */
export default function ProtectedRoute({ children, requiredRole }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="container">
        <div className="state-container">
          <div className="spinner" aria-label="Checking authentication..." />
        </div>
      </div>
    );
  }

  // Not logged in -> redirect to login preserving destination
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role check: If requiredRole is 'host' but current user is not a host
  if (requiredRole && user?.role !== requiredRole) {
    return (
      <div className="container">
        <div className="state-container">
          <svg className="state-icon" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <h2 className="state-title">Host Access Required</h2>
          <p className="state-description">
            The Host Dashboard is only available to accounts registered with the <strong>Host</strong> role.
            Your current account role is <strong>{user?.role || 'user'}</strong>.
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Link to="/" className="state-btn">
              Back to Home
            </Link>
            <Link to="/my-bookings" className="state-btn state-btn-secondary">
              View My Bookings
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
