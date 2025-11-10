import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../layout/GlassCard';
import CameraCapture from './CameraCapture';
import PhotoUpload from './PhotoUpload';
import { LOGO_SRC } from '../../constants/assets';
import { analyzeEmotionBase64 } from '../../utils/enhancedApi';
import { saveAnalysisResult } from '../../utils/analyticsApi';
import { useFlash } from '../flash/FlashContext';
import { useCurrentUser } from '../../hooks/useAuth';
import analysisSaveManager from '../../utils/analysisSaveManager'; // Nueva utilidad
import './EmotionAnalyzer.css';

const EmotionAnalyzer = () => {
  const [mode, setMode] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  
  // 🆕 Ref para evitar múltiples guardados
  const analysisProcessingRef = useRef(false);
  
  const flash = useFlash();
  const navigate = useNavigate();
  const { user } = useCurrentUser();

  // valor inicial inmediato desde localStorage
  const [displayName, setDisplayName] = useState(() => {
    return localStorage.getItem('user_name') || 'Usuario';
  });

  // cuando user se actualice desde el backend, sincroniza el valor
  useEffect(() => {
    if (user?.nombre) {
      setDisplayName(user.nombre);
      localStorage.setItem('user_name', user.nombre); // opcional: actualizar caché
    }
  }, [user]);


  const handleAnalyzeImage = useCallback(async (photoData) => {
    // 🔒 Prevenir múltiples análisis concurrentes
    if (analysisProcessingRef.current || isAnalyzing) {
      console.log('⚠️ Análisis ya en progreso, ignorando...');
      return;
    }

    setIsAnalyzing(true);
    analysisProcessingRef.current = true;
    
    try {
      // Check Spotify connection (OPTIONAL - only affects recommendations)
      let hasSpotify = false;
      try {
        const jwt = localStorage.getItem('spotify_jwt');
        if (jwt) {
          const res = await fetch('http://127.0.0.1:8000/v1/auth/spotify/status', {
            headers: { 'Authorization': `Bearer ${jwt}` }
          });
          if (res.ok) {
            const data = await res.json();
            hasSpotify = !!data.connected;
          }
        }
      } catch (_) {
        // Spotify check failed, but continue without it
        console.log('ℹ️ Spotify no disponible - continuando sin recomendaciones musicales');
      }

      console.log('Enviando imagen al backend para análisis...');
      
      const result = await analyzeEmotionBase64(photoData);
      
      console.log('✅ Resultado del análisis:', result);
      if (result && result.emotions_detected) {
        console.log('🎯 Porcentajes de emociones:', result.emotions_detected);
      }
      if (result && result.recommendations) {
        console.log('🎵 Recomendaciones obtenidas:', result.recommendations.length);
      }

      // 🆕 Guardar análisis usando el manager seguro - INCLUYENDO recomendaciones
      try {
        await analysisSaveManager.saveAnalysisSafe(
          {
            emotion: result.emotion,
            confidence: result.confidence,
            emotions_detected: result.emotions_detected,
            recommendations: result.recommendations || []  // 🆕 Incluir recomendaciones
          },
          saveAnalysisResult
        );
      } catch (saveError) {
        console.error('❌ Error guardando análisis en historial:', saveError);
        // No bloqueamos el flujo si falla el guardado
      }

      // Show success message
      if (flash?.show) {
        const message = hasSpotify 
          ? '¡Análisis completado con éxito!' 
          : '¡Análisis completado! Conecta Spotify para obtener recomendaciones musicales.';
        flash.show(message, 'success', 3000);
      }
      
      // Navigate to results page
      navigate('/home/results', { 
        state: { 
          result: result, 
          photo: photoData,
          hasSpotify: hasSpotify,
          alreadySaved: true, // 🆕 Indicar que ya fue guardado
          recommendations: result.recommendations || [] // 🆕 Pasar recomendaciones
        } 
      });
      
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
      analysisProcessingRef.current = false;
      setMode(null);
    }
  }, [flash, navigate, isAnalyzing]);

  // Resume flow after Spotify connect if a pending photo exists
  const resumedRef = useRef(false);
  useEffect(() => {
    if (resumedRef.current) return;
    try {
      const reason = sessionStorage.getItem('connect_reason');
      const pending = sessionStorage.getItem('pending_analyze_photo');
      if (reason === 'analyze' && pending) {
        resumedRef.current = true;
        // Clear markers before proceeding to avoid repeats
        sessionStorage.removeItem('connect_reason');
        sessionStorage.removeItem('return_to');
        sessionStorage.removeItem('pending_analyze_photo');
        handleAnalyzeImage(pending);
      }
    } catch (_) {}
  }, [handleAnalyzeImage]);

  // Check Spotify connection status - runs periodically to detect external disconnections
  useEffect(() => {
    let mounted = true;
    let intervalId;

    const checkSpotifyStatus = async () => {
      try {
        const jwt = localStorage.getItem('spotify_jwt');
        if (!jwt) {
          if (mounted) setSpotifyConnected(false);
          return;
        }
        const res = await fetch('http://127.0.0.1:8000/v1/auth/spotify/status', {
          headers: { 'Authorization': `Bearer ${jwt}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (mounted) setSpotifyConnected(!!data.connected);
        } else {
          // Token invalid or expired
          if (mounted) {
            setSpotifyConnected(false);
            localStorage.removeItem('spotify_jwt');
          }
        }
      } catch (e) {
        if (mounted) setSpotifyConnected(false);
      }
    };

    // Check immediately on mount
    checkSpotifyStatus();

    // Check every 30 seconds to detect external disconnections
    intervalId = setInterval(checkSpotifyStatus, 30000);

    return () => {
      mounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  const handleCameraCapture = (photoData) => {
    console.log('📸 Foto capturada desde cámara');
    // Stop camera view by leaving mode; analysis flow will redirect if needed
    setMode(null);
    handleAnalyzeImage(photoData);
  };

  const handlePhotoUpload = (photoData) => {
    console.log('📁 Foto subida desde archivo');
    handleAnalyzeImage(photoData);
  };

  const resetMode = () => {
    setMode(null);
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

          {/* Mensaje informativo de Spotify (NO bloqueante) */}
          {!spotifyConnected && (
            <div className="spotify-info-message">
              <div className="message-content">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
                <p>
                  ℹ <strong>Conecta tu cuenta de Spotify</strong> para desbloquear el análisis de emociones y recibir recomendaciones musicales personalizadas.
                </p>
              </div>
              <button
                className="connect-spotify-btn"
                onClick={() => {
                  const state = Math.random().toString(36).substring(7);
                  try {
                    localStorage.setItem('spotify_state', state);
                    sessionStorage.setItem('return_to', '/home/analyze');
                  } catch (e) {
                    console.warn('Could not save state:', e);
                  }
                  window.location.href = `http://127.0.0.1:8000/v1/auth/spotify?state=${state}`;
                }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
                Conectar
              </button>
            </div>
          )}

          {/* Opciones de captura - Grid 2 columnas */}
          <div className="analyzer-options">
            <GlassCard 
              variant="default"
              className={`option-card ${!spotifyConnected ? 'disabled' : ''}`}
              onClick={() => spotifyConnected && setMode('camera')}
              role="button"
              aria-disabled={!spotifyConnected}
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
              {!spotifyConnected && (
                <div className="disabled-overlay">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  Conecta Spotify
                </div>
              )}
            </GlassCard>

            <GlassCard 
              variant="default"
              className={`option-card ${!spotifyConnected ? 'disabled' : ''}`}
              onClick={() => spotifyConnected && setMode('upload')}
              role="button"
              aria-disabled={!spotifyConnected}
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
              {!spotifyConnected && (
                <div className="disabled-overlay">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  Conecta Spotify
                </div>
              )}
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
          spotifyConnected={spotifyConnected}
        />
      </div>
    );
  }

  return null;
};

export default EmotionAnalyzer;