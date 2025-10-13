import React, { useEffect } from 'react';
import Navbar from '../../components/navbar';
import SignInForm from '../../components/auth/SignInForm';
import './AuthPage.css';
import { useNavigate, useLocation } from 'react-router-dom';
import { useFlash } from '../../components/flash/FlashContext';
import { useApi } from '../../hooks/useApi';
import { loginApi } from '../../utils/api';

const SignInPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const flash = useFlash();
  const { loading, error, callApi } = useApi();

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
      const data = await callApi(() => loginApi(formData));
      
      // 🆕 Guardar el token de acceso
      localStorage.setItem('access_token', data.access_token);

      if (flash?.show) {
        flash.show(`¡Bienvenido de vuelta!`, 'success', 3000);
      }

      const returnTo = location?.state?.from?.pathname || '/home';
      setTimeout(() => {
        navigate(returnTo);
      }, 1000);
      
    } catch (err) {
      console.error('Sign in error:', err);
      
      let errorMessage = err.message;
      if (err.message.includes('Failed to fetch')) {
        errorMessage = 'No se puede conectar con el servidor. Por favor, intenta más tarde.';
      } else if (err.message.includes('401')) {
        errorMessage = 'Usuario o contraseña incorrectos';
      } else if (err.message.includes('500')) {
        errorMessage = 'Error interno del servidor. Por favor, intenta más tarde.';
      }
    }
  };

  return (
    <div>
      <Navbar />
      <div className="auth-page">
        <div className="auth-container">          
          <SignInForm 
            onSubmit={handleSignIn} 
            isLoading={loading}
            formError={error}
          />
        </div>
      </div>
    </div>
  );
};

export default SignInPage;