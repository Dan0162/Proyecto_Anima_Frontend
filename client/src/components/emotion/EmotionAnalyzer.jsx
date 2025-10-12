import React, { useState } from 'react';
import GlassCard from '../layout/GlassCard';
import CameraCapture from './CameraCapture';
import PhotoUpload from './PhotoUpload';
import { LOGO_SRC } from '../../constants/assets';
import './EmotionAnalyzer.css';

const EmotionAnalyzer = ({ userName = 'Usuario' }) => {
  const [mode, setMode] = useState(null); // null | 'camera' | 'upload'
  const [analyzedPhoto, setAnalyzedPhoto] = useState(null);

  const handleCameraCapture = (photoData) => {
    console.log('Foto capturada:', photoData);
    setAnalyzedPhoto(photoData);
    // TODO: Enviar al backend para análisis
  };

  const handlePhotoUpload = (photoData) => {
    console.log('Foto subida:', photoData);
    setAnalyzedPhoto(photoData);
    // TODO: Enviar al backend para análisis
  };

  const resetMode = () => {
    setMode(null);
    setAnalyzedPhoto(null);
  };

  // Vista inicial - Selección de modo
  if (!mode) {
    return (
      <div className="emotion-analyzer">
        <div className="analyzer-container">
          
          {/* Logo flotante con efecto glass */}
          <GlassCard 
            variant="lilac" 
            className="logo-container" 
            floating 
            glow
          >
            <img 
              src={LOGO_SRC} 
              alt="Ánima Logo" 
              className="anima-logo"
            />
          </GlassCard>

          {/* Saludo personalizado */}
          <h1 className="welcome-text">
            Bienvenido, <span className="username-highlight">{userName}</span>
          </h1>

          {/* Descripción motivacional */}
          <p className="analyzer-description">
            Comencemos el análisis de tu emoción. 
            <br />
            Permítenos entender cómo te sientes hoy.
          </p>

          {/* Opciones de captura */}
          <div className="analyzer-options">
            <GlassCard 
              variant="pink"
              className="option-card"
              onClick={() => setMode('camera')}
            >
              <div className="option-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                  <circle cx="12" cy="13" r="4"></circle>
                </svg>
              </div>
              <h3 className="option-title">Tomate una foto</h3>
              <p className="option-description">
                Usa tu cámara para capturar cómo te sientes ahora
              </p>
            </GlassCard>

            <GlassCard 
              variant="blue"
              className="option-card"
              onClick={() => setMode('upload')}
            >
              <div className="option-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
              </div>
              <h3 className="option-title">Sube una foto</h3>
              <p className="option-description">
                Selecciona una imagen desde tu dispositivo
              </p>
            </GlassCard>
          </div>
        </div>
      </div>
    );
  }

  // Vista de cámara
  if (mode === 'camera') {
    return (
      <div className="emotion-analyzer">
        <CameraCapture 
          onCapture={handleCameraCapture}
          onCancel={resetMode}
        />
      </div>
    );
  }

  // Vista de upload
  if (mode === 'upload') {
    return (
      <div className="emotion-analyzer">
        <PhotoUpload 
          onUpload={handlePhotoUpload}
          onCancel={resetMode}
        />
      </div>
    );
  }

  return null;
};

export default EmotionAnalyzer;