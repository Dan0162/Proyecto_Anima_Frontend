import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Input from '../ui/Input';
import PasswordInput from '../ui/PasswordInput';
import AuthForm from './AuthForm';
import './SignInForm.css';

const SignInForm = ({ 
  onSubmit, 
  isLoading = false,
  formError,
}) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [triedSubmit, setTriedSubmit] = useState(false);
  
  // 🆕 Verificar si el formulario está completo
  const isFormComplete = useMemo(() => {
    return formData.email.trim() !== '' && formData.password !== '';
  }, [formData.email, formData.password]);
  
  // Validación en tiempo real cuando el campo pierde el foco
  const validateField = (name, value) => {
    const newErrors = { ...errors };
    
    switch (name) {
      case 'email':
        if (!value.trim()) {
          newErrors.email = 'El correo electrónico es requerido';
        } else if (!/\S+@\S+\.\S+/.test(value)) {
          newErrors.email = 'Por favor ingresa un correo electrónico válido';
        } else {
          delete newErrors.email;
        }
        break;
      
      case 'password':
        if (!value) {
          newErrors.password = 'La contraseña es requerida';
        } else if (value.length < 6) {
          newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
        } else {
          delete newErrors.password;
        }
        break;
      
      default:
        break;
    }
    
    setErrors(newErrors);
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Validación en tiempo real después de que el campo fue tocado
    if (touched[name] || triedSubmit) {
      validateField(name, value);
    }
  };
  
  // Manejar cuando un campo pierde el foco
  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, value);
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email.trim()) {
      newErrors.email = 'El correo electrónico es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Por favor ingresa un correo electrónico válido';
    }
    
    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    setTriedSubmit(true);
    setTouched({ email: true, password: true });
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };
  
  return (
    <AuthForm
      title="Iniciar Sesión"
      onSubmit={handleSubmit}
      isLoading={isLoading}
      formError={formError}
      submitLabel={isLoading ? "Iniciando Sesión..." : "Iniciar Sesión"}
      submitDisabled={!isFormComplete || isLoading}
      isFormComplete={isFormComplete}
      alternateText="¿No tienes una cuenta?"
      alternateLinkTo="/signup"
      alternateLinkText="Regístrate"
      className="signin-form"
    >
      <Input
        id="email"
        type="email"
        name="email"
        label="Correo Electrónico"
        value={formData.email}
        onChange={handleChange}
        onBlur={handleBlur}
        error={(touched.email || triedSubmit) ? errors.email : ''}
        placeholder="tu@ejemplo.com"
        required
      />
      
      <PasswordInput
        id="password"
        name="password"
        label="Contraseña"
        value={formData.password}
        onChange={handleChange}
        onBlur={handleBlur}
        error={(touched.password || triedSubmit) ? errors.password : ''}
        placeholder="Tu contraseña"
        required
      />
      
      {/* 🆕 Enlace de olvidé mi contraseña */}
      <div className="forgot-password-link">
        <Link to="/forgot-password">¿Olvidaste tu contraseña?</Link>
      </div>
    </AuthForm>
  );
};

export default SignInForm;