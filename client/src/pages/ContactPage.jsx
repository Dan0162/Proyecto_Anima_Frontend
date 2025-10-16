import { useEffect, useState } from 'react';
import Navbar from '../components/navbar';
import GlassCard from '../components/layout/GlassCard';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import './ContactPage.css';

function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  useEffect(() => {
    document.body.classList.add('with-navbar');
    return () => {
      document.body.classList.remove('with-navbar');
    };
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Implementar envío de formulario
    console.log('Form data:', formData);
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
                required
              />
              
              <Input
                id="subject"
                name="subject"
                label="Asunto"
                value={formData.subject}
                onChange={handleChange}
                placeholder="¿En qué podemos ayudarte?"
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
                  className="input textarea"
                />
              </div>

              <Button 
                type="submit" 
                variant="primary" 
                size="large"
                className="submit-button"
              >
                Enviar Mensaje
              </Button>
            </form>
          </GlassCard>

          {/* Información de contacto */}
          <div className="contact-info-cards">
            <GlassCard variant="pink" className="info-card">
              <div className="info-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
              </div>
              <h3>Teléfono</h3>
              <p>+502 3003 9839</p>
            </GlassCard>

            <GlassCard variant="blue" className="info-card">
              <div className="info-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
              </div>
              <h3>Email</h3>
              <p>info@anima.gt</p>
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