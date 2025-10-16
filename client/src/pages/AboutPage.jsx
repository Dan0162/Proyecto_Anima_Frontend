import { useEffect } from 'react';
import Navbar from '../components/navbar';
import GlassCard from '../components/layout/GlassCard';
import './AboutPage.css';

function AboutPage() {
  useEffect(() => {
    document.body.classList.add('with-navbar');
    return () => {
      document.body.classList.remove('with-navbar');
    };
  }, []);

  return (
    <div className="about-page gradient-bg">
      <Navbar />
      
      <div className="about-content">
        <div className="about-hero">
          <h1 className="about-title">
            Sobre <span className="highlight">Ánima</span>
          </h1>
          <p className="about-subtitle">
            Conectando emociones con música a través de inteligencia artificial
          </p>
        </div>

        <div className="about-sections">
          <GlassCard variant="lilac" className="about-section">
            <div className="section-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                <path d="M2 17l10 5 10-5M2 12l10 5 10-5"></path>
              </svg>
            </div>
            <h2>Nuestra Misión</h2>
            <p>
              En Ánima creemos que la música tiene el poder de transformar emociones. 
              Utilizamos tecnología de reconocimiento facial avanzada para detectar tu 
              estado emocional y ofrecerte la música perfecta para cada momento.
            </p>
          </GlassCard>

          <GlassCard variant="pink" className="about-section">
            <div className="section-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <h2>Nuestro Equipo</h2>
            <p>
              Somos un equipo multidisciplinario de ingenieros, diseñadores y 
              psicólogos apasionados por la tecnología y el bienestar emocional. 
              Trabajamos para crear experiencias que conecten la IA con las emociones humanas.
            </p>
          </GlassCard>

          <GlassCard variant="lilac" className="about-section">
            <div className="section-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <h2>Nuestra Visión</h2>
            <p>
              Aspiramos a ser la plataforma líder en análisis emocional y recomendaciones 
              musicales personalizadas, ayudando a millones de personas a encontrar 
              la banda sonora perfecta para sus vidas.
            </p>
          </GlassCard>
        </div>

        <GlassCard variant="salmon" className="about-values">
          <h2>Nuestros Valores</h2>
          <div className="values-grid">
            <div className="value-item">
              <span className="value-emoji">🎯</span>
              <h3>Precisión</h3>
              <p>Tecnología de vanguardia para análisis preciso</p>
            </div>
            <div className="value-item">
              <span className="value-emoji">🔒</span>
              <h3>Privacidad</h3>
              <p>Tus datos están siempre protegidos</p>
            </div>
            <div className="value-item">
              <span className="value-emoji">💡</span>
              <h3>Innovación</h3>
              <p>Mejora continua de nuestros algoritmos</p>
            </div>
            <div className="value-item">
              <span className="value-emoji">❤️</span>
              <h3>Empatía</h3>
              <p>Entendemos tus emociones</p>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

export default AboutPage;