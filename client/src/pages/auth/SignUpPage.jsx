import React, { useEffect } from 'react';
import Navbar from '../../components/navbar';
import SignUpForm from '../../components/auth/SignUpForm';
import './AuthPage.css';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { registerApi } from '../../utils/enhancedApi';
import GlassCard from '../../components/layout/GlassCard';

const SignUpPage = () => {
  const navigate = useNavigate();
  const { loading, error, callApi } = useApi();

  useEffect(() => {
    // Agregar clase al body para manejar padding de navbar
    document.body.classList.add('with-navbar');
    return () => {
      document.body.classList.remove('with-navbar');
    };
  }, []);

  const handleSignUp = async (formData) => {
    try {
      // Prepare payload without confirmPassword
      const payload = { ...formData };
      if ('confirmPassword' in payload) delete payload.confirmPassword;

      // Call backend signup endpoint using our utility
      await callApi(() => registerApi(payload));

      // Redirect to signin page with success message
      navigate('/signin', { 
        state: { 
          flash: 'Registro exitoso! Por favor inicie sesión para continuar.',
          flashType: 'success'
        } 
      });
      
    } catch (err) {
      console.error('Sign up error:', err);
      // Error is already handled by useApi hook
    }
  };

  return (
    <div className="auth-page gradient-bg">
      <Navbar />
      <div className="auth-page-content">
        <div className="auth-container">
          <GlassCard variant="pink" style={{ padding: '0' }}>
            <SignUpForm 
              onSubmit={handleSignUp} 
              isLoading={loading}
              formError={error}
            />
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;