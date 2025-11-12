import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './landingpage.css';
import Navbar from '../components/navbar';
import PublicSidebar from '../components/sidebar/PublicSidebar';
import GlassCard from '../components/layout/GlassCard';

function Landingpage() {
  useEffect(() => {
    document.body.classList.add('with-navbar');
    return () => {
      document.body.classList.remove('with-navbar');
    };
  }, []);

  return (
    <div className="landingpage gradient-bg">
      <Navbar />
      <PublicSidebar />
      
      <div className="landingpage-content">
        {/* Hero Section */}
        <div className="landing-hero">
          <h1 className="landing-title">
            Descubre tus emociones con <span className="landing-highlight">Ánima</span>
          </h1>
          <p className="landing-subtitle">
            Analiza tu estado emocional a través de inteligencia artificial 
            y recibe recomendaciones musicales personalizadas
          </p>
          <div className="landing-cta">
            <Link to="/signup" className="cta-button primary glass-lilac">
              Comenzar ahora
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </Link>
            <Link to="/signin" className="cta-button secondary glass">
              Iniciar sesión
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="landing-features">
          <GlassCard variant="default" className="feature-card">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <h3 className="feature-title">Análisis Facial</h3>
            <p className="feature-description">
              Reconocimiento avanzado de emociones mediante IA
            </p>
          </GlassCard>

          <GlassCard variant="default" className="feature-card">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18V5l12-2v13"></path>
                <circle cx="6" cy="18" r="3"></circle>
                <circle cx="18" cy="16" r="3"></circle>
              </svg>
            </div>
            <h3 className="feature-title">Música Personalizada</h3>
            <p className="feature-description">
              Recomendaciones basadas en tu estado emocional
            </p>
          </GlassCard>

          <GlassCard variant="default" className="feature-card">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
              </svg>
            </div>
            <h3 className="feature-title">Historial</h3>
            <p className="feature-description">
              Seguimiento de tu evolución emocional en el tiempo
            </p>
          </GlassCard>
        </div>

        {/* Stats Section - Nueva sección de estadísticas */}
        <div className="landing-stats">
          <GlassCard variant="default" className="stat-card">
            <div className="stat-number">1000+</div>
            <div className="stat-label">Análisis Realizados</div>
          </GlassCard>
          <GlassCard variant="default" className="stat-card">
            <div className="stat-number">95%</div>
            <div className="stat-label">Precisión</div>
          </GlassCard>
          <GlassCard variant="default" className="stat-card">
            <div className="stat-number">24/7</div>
            <div className="stat-label">Disponibilidad</div>
          </GlassCard>
        </div>

        {/* How it works - Cómo funciona */}
        <div className="landing-how-it-works">
          <h2 className="section-title">¿Cómo funciona?</h2>
          <div className="steps-container">
            <div className="step-item">
              <div className="step-number">1</div>
              <h3>Captura tu emoción</h3>
              <p>Toma una foto o sube una imagen</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step-item">
              <div className="step-number">2</div>
              <h3>Análisis IA</h3>
              <p>Detectamos tu estado emocional</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step-item">
              <div className="step-number">3</div>
              <h3>Música perfecta</h3>
              <p>Recibe recomendaciones personalizadas</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Landingpage;