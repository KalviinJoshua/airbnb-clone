import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Navbar Component
 * Displays the Airbnb brand logo, role-aware navigation links, and dynamic user authentication state.
 */
export default function Navbar() {
  const { user, isAuthenticated, isHost, upgradeToHost, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [hostPasscode, setHostPasscode] = useState('');
  const [upgradeError, setUpgradeError] = useState('');
  const [upgradeSuccess, setUpgradeSuccess] = useState('');
  const [isUpgrading, setIsUpgrading] = useState(false);

  const menuRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate('/');
  };

  const handleOpenUpgrade = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setHostPasscode('');
    setUpgradeError('');
    setUpgradeSuccess('');
    setIsUpgradeModalOpen(true);
  };

  const handleUpgradeSubmit = async (e) => {
    e.preventDefault();
    setUpgradeError('');
    setUpgradeSuccess('');

    if (!hostPasscode.trim()) {
      setUpgradeError('Please enter the host authorization passcode.');
      return;
    }

    try {
      setIsUpgrading(true);
      const res = await upgradeToHost(hostPasscode.trim());
      setUpgradeSuccess(res.message || 'Host privileges successfully activated!');
      setTimeout(() => {
        setIsUpgradeModalOpen(false);
        navigate('/host/dashboard');
      }, 1200);
    } catch (err) {
      setUpgradeError(err.message || 'Failed to activate host role. Check passcode.');
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <header className="navbar">
      <div className="navbar-container">
        {/* Brand / Logo */}
        <Link to="/" className="navbar-brand" aria-label="Airbnb Home">
          <svg
            viewBox="0 0 32 32"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            role="presentation"
            focusable="false"
          >
            <path d="M16 1c2.008 0 3.463.963 4.751 3.269l.533 1.025c1.954 3.83 6.114 12.54 7.1 14.836l.145.353c.667 1.591.91 2.472.96 3.396l.011.315c0 4.502-3.328 7.806-7.79 7.806-3.213 0-5.698-1.748-6.71-4.475-1.012 2.727-3.497 4.475-6.71 4.475C3.808 32 .48 28.696.48 24.194c0-.986.257-1.92.793-3.228l.178-.423c.986-2.296 5.146-11.006 7.1-14.836l.533-1.025C10.377 2.373 11.992 1 16 1zm0 2c-1.528 0-2.61.64-3.61 2.428l-.515.99c-1.94 3.801-6.079 12.463-7.054 14.737l-.156.37c-.503 1.229-.725 1.99-.765 2.669C3.856 27.818 6.425 30 9.71 30c2.81 0 4.965-1.637 5.61-4.053l.115-.499.565-2.023.565 2.023c.56 2.003 2.502 3.857 5.176 4.472l.434.08c3.285 0 5.854-2.182 5.81-5.806-.04-.679-.262-1.44-.765-2.669l-.156-.37c-.975-2.274-5.114-10.936-7.054-14.737l-.515-.99C17.61 3.64 16.528 3 16 3zm0 13c2.761 0 5 2.239 5 5 0 2.296-1.554 4.228-3.666 4.823L17 26h-2l-.334-.177C12.554 25.228 11 23.296 11 21c0-2.761 2.239-5 5-5zm0 2c-1.657 0-3 1.343-3 3 0 1.304.834 2.413 2 2.83V23h2v-1.17c1.166-.417 2-1.526 2-2.83 0-1.657-1.343-3-3-3z" />
          </svg>
          <span>airbnb</span>
        </Link>

        {/* Navigation & User Menu */}
        <div className="navbar-menu">
          <Link to="/" className="nav-link">
            Explore
          </Link>

          {/* Role-based Host link */}
          {isAuthenticated && isHost && (
            <Link to="/host/dashboard" className="nav-link nav-link-highlight">
              Host Dashboard
            </Link>
          )}

          {isAuthenticated && (
            <Link to="/my-bookings" className="nav-link">
              My Bookings
            </Link>
          )}

          {!isHost && (
            <button
              type="button"
              className="nav-link"
              onClick={handleOpenUpgrade}
              title="Publish and host property accommodations"
            >
              Airbnb your home
            </button>
          )}

          {/* User profile dropdown pill */}
          <div className="user-menu-wrapper" ref={menuRef}>
            <button
              type="button"
              className="user-menu-btn"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label="User navigation menu"
              aria-expanded={menuOpen}
            >
              <svg viewBox="0 0 32 32" width="16" height="16" fill="currentColor">
                <path d="M4 8h24v2H4zm0 7h24v2H4zm0 7h24v2H4z" />
              </svg>
              {isAuthenticated && user?.name ? (
                <div className="user-avatar-initial" title={user.name}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
              ) : (
                <div className="user-avatar-placeholder">
                  <svg viewBox="0 0 32 32" width="16" height="16" fill="currentColor">
                    <path d="M16 2a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm0 18c-7.33 0-14 3.67-14 11v1h28v-1c0-7.33-6.67-11-14-11z" />
                  </svg>
                </div>
              )}
            </button>

            {/* Dropdown Menu */}
            {menuOpen && (
              <div className="navbar-dropdown-menu" role="menu">
                {isAuthenticated ? (
                  <>
                    <div className="dropdown-user-info">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span className="dropdown-user-name">{user?.name}</span>
                        <span className={`user-role-badge role-${user?.role || 'user'}`}>
                          {user?.role || 'user'}
                        </span>
                      </div>
                      <span className="dropdown-user-email">{user?.email}</span>
                    </div>
                    <div className="dropdown-divider" />

                    {isHost ? (
                      <Link
                        to="/host/dashboard"
                        className="dropdown-item dropdown-item-bold"
                        onClick={() => setMenuOpen(false)}
                        role="menuitem"
                      >
                        Host Dashboard
                      </Link>
                    ) : (
                      <button
                        type="button"
                        className="dropdown-item dropdown-item-bold"
                        onClick={() => {
                          setMenuOpen(false);
                          handleOpenUpgrade();
                        }}
                        role="menuitem"
                      >
                        Become a Host
                      </button>
                    )}

                    <Link
                      to="/my-bookings"
                      className="dropdown-item"
                      onClick={() => setMenuOpen(false)}
                      role="menuitem"
                    >
                      My Bookings
                    </Link>

                    <Link
                      to="/"
                      className="dropdown-item"
                      onClick={() => setMenuOpen(false)}
                      role="menuitem"
                    >
                      Explore stays
                    </Link>
                    <div className="dropdown-divider" />
                    <button
                      type="button"
                      className="dropdown-item dropdown-item-danger"
                      onClick={handleLogout}
                      role="menuitem"
                    >
                      Log out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="dropdown-item dropdown-item-bold"
                      onClick={() => setMenuOpen(false)}
                      role="menuitem"
                    >
                      Log in
                    </Link>
                    <Link
                      to="/register"
                      className="dropdown-item"
                      onClick={() => setMenuOpen(false)}
                      role="menuitem"
                    >
                      Sign up
                    </Link>
                    <div className="dropdown-divider" />
                    <Link
                      to="/"
                      className="dropdown-item"
                      onClick={() => setMenuOpen(false)}
                      role="menuitem"
                    >
                      Explore stays
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Become a Host Elevation Modal */}
      {isUpgradeModalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-header">
              <h2 className="modal-title">Become an Airbnb Host</h2>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsUpgradeModalOpen(false)}
                disabled={isUpgrading}
              >
                ✕
              </button>
            </div>

            <p style={{ color: 'var(--text-secondary)', margin: '12px 0 20px', lineHeight: '1.5' }}>
              Hosting privileges allow you to publish properties and manage reservations on the Airbnb Clone platform. Please enter your host authorization passcode.
            </p>

            {upgradeSuccess && (
              <div className="booking-success-alert" style={{ marginBottom: '16px' }}>
                <span>{upgradeSuccess}</span>
              </div>
            )}

            {upgradeError && (
              <div className="auth-error-alert" style={{ marginBottom: '16px' }}>
                <span>{upgradeError}</span>
              </div>
            )}

            <form onSubmit={handleUpgradeSubmit}>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label htmlFor="modalHostPasscode" className="form-label">
                  Host Passcode
                </label>
                <input
                  id="modalHostPasscode"
                  type="password"
                  className="form-input"
                  placeholder="Enter administrator host passcode"
                  value={hostPasscode}
                  onChange={(e) => setHostPasscode(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="state-btn state-btn-secondary"
                  onClick={() => setIsUpgradeModalOpen(false)}
                  disabled={isUpgrading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-auth-submit"
                  style={{ width: 'auto', padding: '12px 24px' }}
                  disabled={isUpgrading}
                >
                  {isUpgrading ? 'Activating Host...' : 'Activate Host Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
