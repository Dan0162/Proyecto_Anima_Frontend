import React, { useState } from 'react';
import Navbar from '../../components/navbar';
import SignUpForm from '../../components/auth/SignUpForm';
import './AuthPage.css';
import { useNavigate, useLocation } from 'react-router-dom';

const SignUpPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignUp = async (formData) => {
    setLoading(true);
    setError('');
    
    try {
      // Prepare payload without confirmPassword (defensive)
      const payload = { ...formData };
      if ('confirmPassword' in payload) delete payload.confirmPassword;

      // Call backend signup endpoint (send raw password; ensure HTTPS in prod)
      let base = process.env.REACT_APP_API_URL || '';
      // If no env var and we're running on localhost, default to 127.0.0.1:8000
      try {
        if (!base && typeof window !== 'undefined' && window.location && window.location.hostname && window.location.hostname.includes('localhost')) {
          base = 'http://127.0.0.1:8000';
        }
      } catch (e) {
        // ignore
      }
      const url = base + '/v1/auth/register';
      
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

    if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || 'Registration failed');
        }

      const data = await res.json();

        // success — redirect to SIGN IN page with flash message
      navigate('/signin', { 
        state: { 
          flash: 'Registro exitoso! Por favor inicie sesion para continuar.',
          flashType: 'success'
        } 
      });
      console.log('Registration successful:', data); 
      
      } catch (err) {
        console.error('Sign up error:', err);
        setError(err.message || 'An error occurred during registration');
      } finally {
        setLoading(false);
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