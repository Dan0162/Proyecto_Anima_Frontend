import React, { useState } from 'react';
import Input from '../ui/Input';
import PasswordInput from '../ui/PasswordInput';
import PasswordRequirements from '../ui/PasswordRequirements';
import AuthForm from './AuthForm';
import usePasswordValidation from '../../hooks/usePasswordValidation';
import './SignUpForm.css';

const SignUpForm = ({ 
  onSubmit, 
  isLoading = false,
  formError,
}) => {
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  // Form validation state
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [triedSubmit, setTriedSubmit] = useState(false);
  
  // Use password validation hook
  const { validations, isValid: passwordValid } = usePasswordValidation({
    password: formData.password,
    confirmPassword: formData.confirmPassword,
  });
  
  // Validación en tiempo real por campo
  const validateField = (name, value) => {
    const newErrors = { ...errors };
    
    switch (name) {
      case 'name':
        if (!value.trim()) {
          newErrors.name = 'El nombre de usuario es requerido';
        } else {
          delete newErrors.name;
        }
        break;
      
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
        } else {
          delete newErrors.password;
        }
        break;
      
      case 'confirmPassword':
        if (!value) {
          newErrors.confirmPassword = 'Por favor confirma tu contraseña';
        } else if (formData.password !== value) {
          newErrors.confirmPassword = 'Las contraseñas no coinciden';
        } else {
          delete newErrors.confirmPassword;
        }
        break;
      
      default:
        break;
    }
    
    setErrors(newErrors);
  };
  
  // Handle input changes
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
  
  // Validate form completo
  const validateForm = () => {
    const newErrors = {};
    
    // Validar nombre
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre de usuario es requerido';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'El nombre debe tener al menos 2 caracteres';
    }
    
    // Validar email
    if (!formData.email.trim()) {
      newErrors.email = 'El correo electrónico es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Por favor ingresa un correo electrónico válido';
    }
    
    // Validar contraseña
    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (!passwordValid) {
      newErrors.password = 'La contraseña no cumple con los requisitos';
    }
    
    // Validar confirmación de contraseña
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Por favor confirma tu contraseña';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    setTriedSubmit(true);
    setTouched({ 
      name: true, 
      email: true, 
      password: true, 
      confirmPassword: true 
    });
    
    if (validateForm()) {
      const { name, email, password } = formData;
      const payload = { name, email, password };
      onSubmit(payload);
    }
  };
  
  // Verificar si el formulario puede ser enviado
  const isFormValid = () => {
    return formData.name.trim() && 
           formData.email && 
           formData.password && 
           formData.confirmPassword &&
           passwordValid &&
           formData.password === formData.confirmPassword;
  };
  
  return (
    <AuthForm
      title="Crear una Cuenta"
      onSubmit={handleSubmit}
      isLoading={isLoading}
      formError={formError}
      submitDisabled={!isFormValid() || isLoading}
      isFormComplete={isFormValid()}
      submitLabel={isLoading ? "Creando Cuenta..." : "Registrarse"}
      alternateText="¿Ya tienes una cuenta?"
      alternateLinkTo="/signin"
      alternateLinkText="Iniciar Sesión"
      className="signup-form"
    >
      <Input
        id="name"
        name="name"
        label="Usuario"
        value={formData.name}
        onChange={handleChange}
        onBlur={handleBlur}
        error={(touched.name || triedSubmit) ? errors.name : ''}
        placeholder="Tu nombre de usuario"
        required
      />
      
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
      
      <div className="password-fields-container">
        <PasswordInput
          id="password"
          name="password"
          label="Contraseña"
          value={formData.password}
          onChange={handleChange}
          onBlur={handleBlur}
          error={(touched.password || triedSubmit) ? errors.password : ''}
          placeholder="Crea una contraseña segura"
          required
          showingRequirements={formData.password || triedSubmit}
        />
        
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          label="Confirmar Contraseña"
          value={formData.confirmPassword}
          onChange={handleChange}
          onBlur={handleBlur}
          error={(touched.confirmPassword || triedSubmit) ? errors.confirmPassword : ''}
          placeholder="Repite tu contraseña"
          required
        />
        
        {/* Mostrar requisitos de contraseña cuando sea relevante */}
        {(formData.password || triedSubmit) && (
          <PasswordRequirements 
            validations={validations} 
            visible={true}
          />
        )}
      </div>
    </AuthForm>
  );
};

export default SignUpForm;