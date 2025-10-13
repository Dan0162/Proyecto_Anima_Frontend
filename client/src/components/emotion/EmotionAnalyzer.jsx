import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../layout/GlassCard';
import CameraCapture from './CameraCapture';
import PhotoUpload from './PhotoUpload';
import { LOGO_SRC } from '../../constants/assets';
import { analyzeEmotionBase64 } from '../../utils/api';
import { useFlash } from '../flash/FlashContext';
import { useCurrentUser } from '../../hooks/useAuth';
import './EmotionAnalyzer.css';

const EmotionAnalyzer = () => {
  const [mode, setMode] = useState(null);
  const [analyzedPhoto, setAnalyzedPhoto] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  
  const flash = useFlash();
  const navigate = useNavigate();
  
  // Obtener el usuario autenticado actual
  const { user, loading: userLoading, error: userError } = useCurrentUser();
  
  // Mostrar el nombre del usuario o un placeholder mientras carga
  const displayName = user?.nombre || 'Usuario';

  const handleAnalyzeImage = async (photoData) => {
    setIsAnalyzing(true);
    
    try {
      console.log('Enviando imagen al backend para análisis...');
      
      const result = await analyzeEmotionBase64(photoData);
      
      console.log('✅ Resultado del análisis:', result);
      setAnalysisResult(result);
      setAnalyzedPhoto(photoData);
      
      if (flash?.show) {
        flash.show('¡Análisis completado con éxito!', 'success', 3000);
      }
      
      // TODO: Navegar a página de resultados
      // navigate('/home/results', { state: { result, photo: photoData } });
      
    } catch (error) {
      console.error('❌ Error al analizar imagen:', error);
      
      if (error.message.includes('Sesión expirada')) {
        if (flash?.show) {
          flash.show('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.', 'error', 4000);
        }
        setTimeout(() => {
          navigate('/signin');
        }, 2000);
        return;
      }
      
      if (flash?.show) {
        flash.show(
          error.message || 'Error al analizar la imagen. Por favor, intenta de nuevo.',
          'error',
          4000
        );
      }
    } finally {
      setIsAnalyzing(false);
      setMode(null);
    }
  };

  const handleCameraCapture = (photoData) => {
    console.log('📸 Foto capturada desde cámara');
    handleAnalyzeImage(photoData);
  };

  const handlePhotoUpload = (photoData) => {
    console.log('📁 Foto subida desde archivo');
    handleAnalyzeImage(photoData);
  };

  const resetMode = () => {
    setMode(null);
    setAnalyzedPhoto(null);
    setAnalysisResult(null);
  };

  // Vista inicial - Selección de modo
  if (!mode && !isAnalyzing) {
    return (
      <div className="emotion-analyzer">
        <div className="analyzer-container">
          
          {/* Logo compacto con efectos dinámicos */}
          <div className="logo-wrapper">
            {/* Círculos de fondo adicionales */}
            <div className="background-circle circle-1"></div>
            <div className="background-circle circle-2"></div>
            <div className="background-circle circle-3"></div>
            
            <GlassCard 
              variant="lilac" 
              className="logo-container" 
              floating={true}  /* Desactivamos el floating original */
              glow
            >
              <img 
                src={LOGO_SRC} 
                alt="Ánima Logo" 
                className="anima-logo"
              />
            </GlassCard>
          </div>

          {/* Sección de bienvenida */}
          <div className="welcome-section">
            <h1 className="welcome-text">
              Bienvenido, <span className="username-highlight">{displayName}</span>
            </h1>
            <p className="analyzer-description">
              Comencemos el análisis de tu emoción. 
              Permítenos entender cómo te sientes hoy.
            </p>
          </div>

          {/* Opciones de captura - Grid 2 columnas */}
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

  // Vista de loading durante análisis
  if (isAnalyzing) {
    return (
      <div className="emotion-analyzer">
        <div className="analyzer-container">
          <GlassCard variant="lilac" className="loading-card">
            <div className="loading-content">
              <div className="loading-spinner"></div>
              <h2>Analizando tu emoción...</h2>
              <p>Por favor espera mientras procesamos tu imagen</p>
            </div>
          </GlassCard>
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