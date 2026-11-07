import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Register Page Component
 * Allows new users to create an account.
 *
 * Security Fix:
 * Public registrations default to the Guest role ('user').
 * Users registering with Host privileges must provide an authorized Host Passcode.
 */
export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isHostRegistration, setIsHostRegistration] = useState(false);
  const [hostSecretCode, setHostSecretCode] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || location.state?.from || '/';

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validations
    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (isHostRegistration && !hostSecretCode.trim()) {
      setError('Please provide your Host invitation passcode or uncheck the Host option.');
      return;
    }

    try {
      setIsSubmitting(true);
      const role = isHostRegistration ? 'host' : 'user';
      await register(name.trim(), email.trim(), password, role, hostSecretCode.trim());
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Create an account</h1>
          <p className="auth-subtitle">Join Airbnb to discover and book stays worldwide</p>
        </div>

        {error && (
          <div className="auth-error-alert" role="alert">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="form-group">
            <label htmlFor="name" className="form-label">
              Full name
            </label>
            <input
              id="name"
              type="text"
              className="form-input"
              placeholder="e.g. Alex Johnson"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email address
            </label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password (min. 8 characters)
            </label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="Create a strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>

          {/* Controlled Host Privilege Option */}
          <div className="host-invitation-box">
            <label className="host-checkbox-label">
              <input
                type="checkbox"
                checked={isHostRegistration}
                onChange={(e) => setIsHostRegistration(e.target.checked)}
                className="host-checkbox"
              />
              <span className="host-checkbox-text">
                Register as a Property Host (requires authorized passcode)
              </span>
            </label>

            {isHostRegistration && (
              <div className="form-group" style={{ marginTop: '12px' }}>
                <label htmlFor="hostSecret" className="form-label">
                  Host Passcode
                </label>
                <input
                  id="hostSecret"
                  type="password"
                  className="form-input"
                  placeholder="Enter administrator host passcode"
                  value={hostSecretCode}
                  onChange={(e) => setHostSecretCode(e.target.value)}
                  autoComplete="off"
                  required={isHostRegistration}
                />
                <span className="host-invitation-hint">
                  Host access allows listing homes and managing property reservations. Standard accounts can upgrade anytime.
                </span>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn-auth-submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating account...' : 'Sign up'}
          </button>
        </form>

        <div className="auth-footer">
          <span>Already have an account? </span>
          <Link
            to="/login"
            state={{ from }}
            className="auth-switch-link"
          >
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
