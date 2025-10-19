import { useEffect, useState } from 'react';
import Navbar from '../components/navbar';
import GlassCard from '../components/layout/GlassCard';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useFlash } from '../components/flash/FlashContext';
import './ContactPage.css';

function ContactPage() {
  const flash = useFlash();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    document.body.classList.add('with-navbar');
    return () => {
      document.body.classList.remove('with-navbar');
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    // Limpiar error del campo al escribir
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'El correo es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Correo electrónico inválido';
    }
    
    if (!formData.subject.trim()) {
      newErrors.subject = 'El asunto es requerido';
    }
    
    if (!formData.message.trim()) {
      newErrors.message = 'El mensaje es requerido';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'El mensaje debe tener al menos 10 caracteres';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('http://127.0.0.1:8000/v1/contact/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        flash?.show(data.message || 'Mensaje enviado exitosamente', 'success', 4000);
        // Limpiar formulario
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: ''
        });
      } else {
        flash?.show(data.detail || 'Error al enviar el mensaje', 'error', 4000);
      }
    } catch (error) {
      console.error('Error:', error);
      flash?.show('Error de conexión. Por favor intenta de nuevo.', 'error', 4000);
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppClick = () => {
    // Formato internacional: +502 3003 9839
    const phoneNumber = '50230039839';
    const message = encodeURIComponent('Hola, me gustaría obtener más información sobre Ánima.');
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  };

  return (
    <div className="contact-page gradient-bg">
      <Navbar />
      
      <div className="contact-content">
        <div className="contact-hero">
          <h1 className="contact-title">
            <span className="highlight">Contáctanos</span>
          </h1>
          <p className="contact-subtitle">
            ¿Tienes preguntas? Estamos aquí para ayudarte
          </p>
        </div>

        <div className="contact-container">
          {/* Formulario de contacto */}
          <GlassCard variant="lilac" className="contact-form-card">
            <h2>Envíanos un mensaje</h2>
            <form onSubmit={handleSubmit} className="contact-form">
              <Input
                id="name"
                name="name"
                label="Nombre"
                value={formData.name}
                onChange={handleChange}
                placeholder="Tu nombre completo"
                error={errors.name}
                required
              />
              
              <Input
                id="email"
                name="email"
                type="email"
                label="Correo Electrónico"
                value={formData.email}
                onChange={handleChange}
                placeholder="tu@ejemplo.com"
                error={errors.email}
                required
              />
              
              <Input
                id="subject"
                name="subject"
                label="Asunto"
                value={formData.subject}
                onChange={handleChange}
                placeholder="¿En qué podemos ayudarte?"
                error={errors.subject}
                required
              />
              
              <div className="input-wrapper">
                <label htmlFor="message" className="input-label">
                  Mensaje <span className="input-required">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Escribe tu mensaje aquí..."
                  required
                  rows="6"
                  className={`input textarea ${errors.message ? 'input--error' : ''}`}
                />
                {errors.message && (
                  <div className="input-error" role="alert">
                    {errors.message}
                  </div>
                )}
              </div>

              <Button 
                type="submit" 
                variant="primary" 
                size="large"
                className="submit-button"
                disabled={loading}
              >
                {loading ? 'Enviando...' : 'Enviar Mensaje'}
              </Button>
            </form>
          </GlassCard>

          {/* Información de contacto */}
          <div className="contact-info-cards">
            <GlassCard 
              variant="pink" 
              className="info-card clickable"
              onClick={handleWhatsAppClick}
              style={{ cursor: 'pointer' }}
            >
              <div className="info-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
              </div>
              <h3>WhatsApp</h3>
              <p>+502 3003 9839</p>
              <p style={{ fontSize: '0.85rem', color: '#4a5568', marginTop: '0.5rem' }}>
                Click para chatear
              </p>
            </GlassCard>

            <GlassCard variant="blue" className="info-card">
              <div className="info-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
              </div>
              <h3>Email</h3>
              <p>equipo.soporte.anima@gmail.com</p>
            </GlassCard>

            <GlassCard variant="salmon" className="info-card">
              <div className="info-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
              </div>
              <h3>Ubicación</h3>
              <p>Guatemala City, Guatemala</p>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContactPage;