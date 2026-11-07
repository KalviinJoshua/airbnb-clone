import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser } from '../services/api';

const AuthContext = createContext(null);

/**
 * Helper to safely parse user from localStorage
 */
function getInitialUser() {
  try {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  } catch (err) {
    localStorage.removeItem('user');
    return null;
  }
}

/**
 * AuthProvider Component
 * Manages global authentication state, token storage, and user sessions.
 */
export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [user, setUser] = useState(getInitialUser);
  const [loading, setLoading] = useState(true);

  // Sync authentication state across tabs and verify initial state
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = getInitialUser();

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(storedUser);
    } else {
      setToken(null);
      setUser(null);
    }
    setLoading(false);
  }, []);

  /**
   * Log in user with credentials, save JWT and user profile
   */
  const login = async (email, password) => {
    const data = await loginUser({ email, password });
    if (data.token && data.user) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
    }
    return data;
  };

  /**
   * Register a new account and automatically log in
   */
  const register = async (name, email, password, role = 'user') => {
    const regData = await registerUser({ name, email, password, role });
    // After registration, authenticate immediately to obtain JWT token
    const loginData = await login(email, password);
    return { ...regData, ...loginData };
  };

  /**
   * Log out user and clear stored authentication information
   */
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token && user),
    isHost: user?.role === 'host',
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Custom hook to access authentication context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
