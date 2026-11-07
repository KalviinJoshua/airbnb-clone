import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ListingDetails from './pages/ListingDetails';
import MyBookings from './pages/MyBookings';
import HostDashboard from './pages/HostDashboard';

/**
 * 404 NotFound Page Component
 */
function NotFound() {
  return (
    <div className="container">
      <div className="state-container">
        <h1 className="state-title" style={{ fontSize: '3rem', color: 'var(--primary)' }}>
          404
        </h1>
        <h2 className="state-title">We can't seem to find the page you're looking for</h2>
        <p className="state-description">
          Here are some helpful links instead:
        </p>
        <Link to="/" className="state-btn">
          Go to Home
        </Link>
      </div>
    </div>
  );
}

/**
 * Footer Component
 */
function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-container">
          <div>
            © {new Date().getFullYear()} Airbnb Clone, Inc. · Sapphire IQ Internship Project
          </div>
          <div className="footer-links">
            <span className="footer-link">Privacy</span>
            <span>·</span>
            <span className="footer-link">Terms</span>
            <span>·</span>
            <span className="footer-link">Sitemap</span>
            <span>·</span>
            <span className="footer-link">Company details</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

/**
 * Root Application Component
 */
export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <main>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/listings/:id" element={<ListingDetails />} />

            {/* Protected Routes */}
            <Route
              path="/my-bookings"
              element={
                <ProtectedRoute>
                  <MyBookings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/host/dashboard"
              element={
                <ProtectedRoute requiredRole="host">
                  <HostDashboard />
                </ProtectedRoute>
              }
            />

            {/* Fallback Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </Router>
    </AuthProvider>
  );
}
