import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import tokenManager from '../utils/tokenManager';

/**
 * Enhanced route guard with proper token validation
 */
export default function RequireAuth({ children }) {
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if user has valid token
        const authenticated = tokenManager.isAuthenticated();
        
        if (authenticated) {
          // Optionally verify token with backend
          try {
            await tokenManager.getValidAccessToken();
            setIsAuthenticated(true);
          } catch (error) {
            console.error('Token validation failed:', error);
            setIsAuthenticated(false);
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, []);

  // Show loading state while checking authentication
  if (isChecking) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid rgba(195, 196, 250, 0.3)',
          borderTopColor: '#a1a2e6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ color: '#4a5568', fontWeight: 500 }}>Verificando autenticación...</p>
      </div>
    );
  }

  // Redirect to sign-in if not authenticated
  if (!isAuthenticated) {
    console.log('❌ Not authenticated, redirecting to /signin');
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  // User is authenticated, render protected content
  console.log('✅ Authenticated, rendering protected content');
  return children;
}
