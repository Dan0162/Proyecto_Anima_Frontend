import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * Simple route guard that checks for an `access_token` in localStorage.
 * If not present, redirect to /signin; otherwise render the children.
 */
export default function RequireAuth({ children }) {
  const token = localStorage.getItem('access_token');
  const location = useLocation();

  console.log('RequireAuth - Token found:', token); // Para debugging

  if (!token) {
    // Redirect to sign-in, preserve current location in state so we can return after login
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  return children;
}
