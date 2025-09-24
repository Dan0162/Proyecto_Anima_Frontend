import React, { useState, useEffect } from 'react';
import Navbar from '../../components/navbar';
import SignInForm from '../../components/auth/SignInForm';
import './AuthPage.css';
import { useNavigate, useLocation } from 'react-router-dom';
import { useFlash } from '../../components/flash/FlashContext'; // Ajusta la ruta según tu estructura

const SignInPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const flash = useFlash();

  // Mostrar flash message si viene de un registro exitoso o logout
  useEffect(() => {
    try {
      if (location && location.state && location.state.flash && flash && flash.show) {
        const flashType = location.state.flashType || 'success';
        flash.show(location.state.flash, flashType, 4000);
        
        // Limpiar el estado de navegación
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
    setLoading(true);
    setError('');
    
    try {
      // Call backend login endpoint
      let base = process.env.REACT_APP_API_URL || '';
      try {
        if (!base && typeof window !== 'undefined' && window.location && window.location.hostname && window.location.hostname.includes('localhost')) {
          base = 'http://127.0.0.1:8000';
        }
      } catch (e) {
        // ignore
      }
      const url = base + '/v1/auth/login';
      
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Login failed');
      }

      const data = await res.json();

      // Store the token in localStorage
      localStorage.setItem('access_token', data.access_token);


      // Mostrar mensaje de éxito
      if (flash && flash.show) {
        flash.show('Inicio de sesión exitoso! Bienvenido de vuelta.', 'success', 3000);
      }

      // success — redirect to original page (if present) or to protected homepage
      const returnTo = (location && location.state && location.state.from && location.state.from.pathname) 
        ? location.state.from.pathname 
        : '/home';
      
      // Pequeño delay para mostrar el mensaje antes de redirigir
      setTimeout(() => {
        navigate(returnTo);
      }, 1000);
      
      console.log('Login successful:', data); 
      
    } catch (err) {
      console.error('Sign in error:', err);
      setError(err.message || 'An error occurred during login');
      
      // Mostrar error como flash message también si quieres
      if (flash && flash.show) {
        flash.show(err.message || 'An error occurred during login', 'error', 5000);
      }
    } finally {
      setLoading(false);
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