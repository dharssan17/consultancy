import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../services/authService';

const PrivateRoute = ({ children }) => {
  const [isValidating, setIsValidating] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const validateAuth = async () => {
      try {
        const authenticated = authService.isAuthenticated();
        setIsAuthenticated(authenticated);

        // If authenticated, verify token and update user info
        if (authenticated) {
          try {
            await authService.getMe();
          } catch (error) {
            console.error('[PRIVATE ROUTE] Token validation failed:', error);
            // Token might be invalid, clear auth
            authService.logout();
            setIsAuthenticated(false);
          }
        }
      } catch (error) {
        console.error('[PRIVATE ROUTE] Auth validation error:', error);
        setIsAuthenticated(false);
      } finally {
        setIsValidating(false);
      }
    };

    validateAuth();
  }, []);

  if (isValidating) {
    return <div className="text-center p-4">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default PrivateRoute;

