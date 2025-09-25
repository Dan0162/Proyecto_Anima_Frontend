import React from 'react';
import Navbar from '../../components/navbar';
import SignUpForm from '../../components/auth/SignUpForm';
import './AuthPage.css';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { registerApi } from '../../utils/api';
import { useFlash } from '../../components/flash/FlashContext';

const SignUpPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const flash = useFlash();
  const { loading, error, callApi } = useApi();

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
      
      // Mensaje más específico según el tipo de error
      let errorMessage = err.message;
      if (err.message.includes('Failed to fetch')) {
        errorMessage = 'No se puede conectar con el servidor, por favor intenta más tarde.';
      } else if (err.message.includes('409')) {
        errorMessage = 'El usuario ya existe. Por favor, intente con otro email.';
      } else if (err.message.includes('400')) {
        errorMessage = 'Datos inválidos. Por favor, verifique la información ingresada.';
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
          <SignUpForm 
            onSubmit={handleSignUp} 
            isLoading={loading}
            formError={error}
          />
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;