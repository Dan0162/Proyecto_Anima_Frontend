import React, { useEffect } from 'react';
import GlassCard from '../../components/layout/GlassCard';
import Navbar from '../../components/navbar';
import SignInForm from '../../components/auth/SignInForm';
import './AuthPage.css';
import { useNavigate, useLocation } from 'react-router-dom';
import { useFlash } from '../../components/flash/FlashContext';
import { useApi } from '../../hooks/useApi';
import { loginApi } from '../../utils/enhancedApi';

const SignInPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const flash = useFlash();
  const { loading, error, callApi } = useApi();

  useEffect(() => {
  // Agregar clase al body para manejar padding de navbar
  document.body.classList.add('with-navbar');
  return () => {
    document.body.classList.remove('with-navbar');
    };
  }, []);

  useEffect(() => {
    try {
      if (location && location.state && location.state.flash && flash && flash.show) {
        const flashType = location.state.flashType || 'success';
        flash.show(location.state.flash, flashType, 4000);
        
        const cleanState = { ...location.state };
        delete cleanState.flash;
        delete cleanState.flashType;
        navigate(location.pathname, { state: cleanState, replace: true });
      }
    } catch (e) {
      console.error('Error showing flash message:', e);
    }
  }, [location, flash, navigate]);

  const handleSignIn = async (formData) => {
    try {
      // loginApi now automatically stores tokens using tokenManager
      await callApi(() => loginApi(formData));

      if (flash?.show) {
        flash.show(`¡Bienvenido de vuelta!`, 'success', 3000);
      }

      const returnTo = location?.state?.from?.pathname || '/home';
      setTimeout(() => {
        navigate(returnTo);
      }, 1000);
      
    } catch (err) {
      console.error('Sign in error:', err);
      // Error is already handled by useApi hook
    }
  };

  return (
    <div className="auth-page gradient-bg">
      <Navbar />
      <div className="auth-page-content">
        <div className="auth-container">
          <GlassCard variant="lilac" style={{ padding: '0' }}>
            <SignInForm 
              onSubmit={handleSignIn} 
              isLoading={loading}
              formError={error}
            />
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;