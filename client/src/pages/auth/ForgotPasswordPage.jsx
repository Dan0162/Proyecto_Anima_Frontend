import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/navbar';
import PublicSidebar from '../../components/sidebar/PublicSidebar';
import GlassCard from '../../components/layout/GlassCard';
import Input from '../../components/ui/Input';
import PasswordInput from '../../components/ui/PasswordInput';
import Button from '../../components/ui/Button';
import { useFlash } from '../../components/flash/FlashContext';
import tokenManager from '../../utils/tokenManager';
import usePasswordValidation from '../../hooks/usePasswordValidation';
import PasswordRequirements from '../../components/ui/PasswordRequirements';
import './ForgotPasswordPage.css';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const flash = useFlash();
  const [step, setStep] = useState(1); // 1: email, 2: code, 3: new password
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const { validations, isValid: passwordValid } = usePasswordValidation({
    password: newPassword,
    confirmPassword: confirmPassword,
  });

  useEffect(() => {
    document.body.classList.add('with-navbar');
    return () => {
      document.body.classList.remove('with-navbar');
    };
  }, []);

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  // STEP 1: Solicitar código
  const handleRequestCode = async (e) => {
    e.preventDefault();
    
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setErrors({ email: 'Por favor ingresa un correo válido' });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
  const response = await fetch(`${tokenManager.getBaseUrl()}/v1/password-recovery/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        flash?.show('Código enviado a tu correo electrónico', 'success', 4000);
        setStep(2);
      } else {
        flash?.show(data.detail || 'Error al enviar el código', 'error', 4000);
      }
    } catch (error) {
      console.error('Error:', error);
      flash?.show('Error de conexión. Por favor intenta de nuevo.', 'error', 4000);
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Verificar código
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    
    if (!code || code.length !== 6) {
      setErrors({ code: 'El código debe tener 6 dígitos' });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
  const response = await fetch(`${tokenManager.getBaseUrl()}/v1/password-recovery/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });

      const data = await response.json();

      if (response.ok) {
        flash?.show('Código verificado correctamente', 'success', 3000);
        setStep(3);
      } else {
        setErrors({ code: data.detail || 'Código inválido o expirado' });
      }
    } catch (error) {
      console.error('Error:', error);
      flash?.show('Error de conexión. Por favor intenta de nuevo.', 'error', 4000);
    } finally {
      setLoading(false);
    }
  };

  // STEP 3: Cambiar contraseña
  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!passwordValid) {
      setErrors({ password: 'La contraseña no cumple con los requisitos' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrors({ confirmPassword: 'Las contraseñas no coinciden' });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
  const response = await fetch(`${tokenManager.getBaseUrl()}/v1/password-recovery/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          code,
          new_password: newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        flash?.show('Contraseña actualizada exitosamente', 'success', 4000);
        setTimeout(() => navigate('/signin'), 2000);
      } else {
        flash?.show(data.detail || 'Error al actualizar contraseña', 'error', 4000);
      }
    } catch (error) {
      console.error('Error:', error);
      flash?.show('Error de conexión. Por favor intenta de nuevo.', 'error', 4000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-page gradient-bg">
      <Navbar />
      <PublicSidebar />
      <div className="forgot-password-content">
        <div className="forgot-password-container">
          <GlassCard variant="lilac" className="forgot-password-card">
            
            {/* Progress Steps */}
            <div className="progress-steps">
              <div className={`step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
                <div className="step-circle">1</div>
                <span className="step-label">Email</span>
              </div>
              <div className="step-line"></div>
              <div className={`step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
                <div className="step-circle">2</div>
                <span className="step-label">Código</span>
              </div>
              <div className="step-line"></div>
              <div className={`step ${step >= 3 ? 'active' : ''}`}>
                <div className="step-circle">3</div>
                <span className="step-label">Nueva contraseña</span>
              </div>
            </div>

            {/* Step 1: Email */}
            {step === 1 && (
              <>
                <div className="forgot-header">
                  <h1 className="forgot-title">¿Olvidaste tu contraseña?</h1>
                  <p className="forgot-subtitle">
                    Ingresa tu correo electrónico y te enviaremos un código de verificación
                  </p>
                </div>

                <form onSubmit={handleRequestCode} className="forgot-form">
                  <Input
                    id="email"
                    type="email"
                    name="email"
                    label="Correo Electrónico"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => handleBlur('email')}
                    error={touched.email && errors.email}
                    placeholder="tu@ejemplo.com"
                    required
                  />

                  <div className="forgot-actions">
                    <Button 
                      type="submit" 
                      disabled={loading}
                      variant="primary"
                      size="large"
                      className="submit-button"
                    >
                      {loading ? 'Enviando...' : 'Enviar código'}
                    </Button>
                    
                    <button 
                      type="button"
                      className="back-link"
                      onClick={() => navigate('/signin')}
                    >
                      Volver al inicio de sesión
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* Step 2: Verify Code */}
            {step === 2 && (
              <>
                <div className="forgot-header">
                  <h1 className="forgot-title">Verifica tu código</h1>
                  <p className="forgot-subtitle">
                    Ingresa el código de 6 dígitos que enviamos a <strong>{email}</strong>
                  </p>
                </div>

                <form onSubmit={handleVerifyCode} className="forgot-form">
                  <Input
                    id="code"
                    type="text"
                    name="code"
                    label="Código de verificación"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    onBlur={() => handleBlur('code')}
                    error={touched.code && errors.code}
                    placeholder="000000"
                    maxLength={6}
                    className="code-input"
                    required
                  />

                  <div className="forgot-actions">
                    <Button 
                      type="submit" 
                      disabled={loading}
                      variant="primary"
                      size="large"
                      className="submit-button"
                    >
                      {loading ? 'Verificando...' : 'Verificar código'}
                    </Button>
                    
                    <button 
                      type="button"
                      className="back-link"
                      onClick={() => setStep(1)}
                    >
                      Volver atrás
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* Step 3: New Password */}
            {step === 3 && (
              <>
                <div className="forgot-header">
                  <h1 className="forgot-title">Nueva contraseña</h1>
                  <p className="forgot-subtitle">
                    Crea una contraseña segura para tu cuenta
                  </p>
                </div>

                <form onSubmit={handleResetPassword} className="forgot-form">
                  <PasswordInput
                    id="newPassword"
                    name="newPassword"
                    label="Nueva contraseña"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    onBlur={() => handleBlur('newPassword')}
                    error={touched.newPassword && errors.password}
                    placeholder="Tu nueva contraseña"
                    required
                    showingRequirements={newPassword}
                  />

                  <PasswordInput
                    id="confirmPassword"
                    name="confirmPassword"
                    label="Confirmar contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onBlur={() => handleBlur('confirmPassword')}
                    error={touched.confirmPassword && errors.confirmPassword}
                    placeholder="Repite tu contraseña"
                    required
                  />

                  {newPassword && (
                    <PasswordRequirements 
                      validations={validations} 
                      visible={true}
                    />
                  )}

                  <div className="forgot-actions">
                    <Button 
                      type="submit" 
                      disabled={loading || !passwordValid}
                      variant="primary"
                      size="large"
                      className="submit-button"
                    >
                      {loading ? 'Actualizando...' : 'Cambiar contraseña'}
                    </Button>
                  </div>
                </form>
              </>
            )}

          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;