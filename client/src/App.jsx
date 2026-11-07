import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import ListingDetails from './pages/ListingDetails';

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
    <Router>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/listings/:id" element={<ListingDetails />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </Router>
  );
}
