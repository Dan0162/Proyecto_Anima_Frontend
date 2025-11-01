import React, { useState, useEffect, useRef } from 'react';
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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  
  const flash = useFlash();
  const navigate = useNavigate();
  
  // Obtener el usuario autenticado actual
  const { user } = useCurrentUser();
  
  // Mostrar el nombre del usuario o un placeholder mientras carga
  const displayName = user?.nombre || 'Usuario';

  // Resume flow after Spotify connect if a pending photo exists
  const resumedRef = useRef(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
  }, []);

  // Check Spotify connection status for enabling camera
  useEffect(() => {
    let mounted = true;
    (async () => {
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
          if (mounted) setSpotifyConnected(false);
        }
      } catch (e) {
        if (mounted) setSpotifyConnected(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleAnalyzeImage = async (photoData) => {
    setIsAnalyzing(true);
    
    try {
      // Ensure Spotify is connected before analyzing
      try {
        // Prefer Authorization header with server-signed spotify_jwt
        const jwt = localStorage.getItem('spotify_jwt');
        if (!jwt) {
          sessionStorage.setItem('pending_analyze_photo', photoData);
          sessionStorage.setItem('return_to', '/home/analyze');
          sessionStorage.setItem('connect_reason', 'analyze');
          setIsAnalyzing(false);
          setMode(null);
          navigate('/home/spotify-connect');
          return;
        }

        const res = await fetch('http://127.0.0.1:8000/v1/auth/spotify/status', {
          headers: { 'Authorization': `Bearer ${jwt}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (!data.connected) {
            sessionStorage.setItem('pending_analyze_photo', photoData);
            sessionStorage.setItem('return_to', '/home/analyze');
            sessionStorage.setItem('connect_reason', 'analyze');
            setIsAnalyzing(false);
            setMode(null);
            navigate('/home/spotify-connect');
            return;
          }
        } else {
          // If token invalid, force reconnect
          sessionStorage.setItem('pending_analyze_photo', photoData);
          sessionStorage.setItem('return_to', '/home/analyze');
          sessionStorage.setItem('connect_reason', 'analyze');
          setIsAnalyzing(false);
          setMode(null);
          navigate('/home/spotify-connect');
          return;
        }
      } catch (_) {}

      console.log('Enviando imagen al backend para análisis...');
      
      const result = await analyzeEmotionBase64(photoData);
      
      console.log('✅ Resultado del análisis:', result);
      if (result && result.emotions_detected) {
        console.log('🎯 Porcentajes de emociones:', result.emotions_detected);
      }
  // analysis result handled via navigation state (no local state required)
      
      if (flash?.show) {  
        flash.show('¡Análisis completado con éxito!', 'success', 3000);
      }
      
      // ⭐ NUEVA LÍNEA: Navegar a página de resultados
      navigate('/home/results', { 
        state: { 
          result: result, 
          photo: photoData 
        } 
      });
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

          {/* Banner prompting Spotify connect when not connected */}
          {!spotifyConnected && (
            <div className="spotify-connect-banner">
              <div className="banner-text">Conéctate a Spotify para obtener recomendaciones personalizadas y habilitar el uso de la cámara.</div>
              <div>
                <button
                  className="connect-spotify-btn"
                  onClick={() => {
                    const state = Math.random().toString(36).substring(7);
                    try { localStorage.setItem('spotify_state', state); } catch (_) {}
                    // Redirect to backend to start OAuth flow
                    window.location.href = `http://127.0.0.1:8000/v1/auth/spotify?state=${state}`;
                  }}
                >Conectar a Spotify</button>
              </div>
            </div>
          )}

          {/* Opciones de captura - Grid 2 columnas */}
          <div className="analyzer-options">
            <GlassCard 
              variant="default"
              className={`option-card ${!spotifyConnected ? 'disabled' : ''}`}
              onClick={() => spotifyConnected ? setMode('camera') : (() => {
                // Save intention and redirect to connect
                try {
                  sessionStorage.setItem('return_to', '/home/analyze');
                } catch (_) {}
                const state = Math.random().toString(36).substring(7);
                try { localStorage.setItem('spotify_state', state); } catch (_) {}
                window.location.href = `http://127.0.0.1:8000/v1/auth/spotify?state=${state}`;
              })()}
              role={!spotifyConnected ? 'button' : undefined}
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
              {!spotifyConnected && <div className="disabled-overlay">Conecta Spotify para usar</div>}
            </GlassCard>

            <GlassCard 
              variant="default"
              className={`option-card ${!spotifyConnected ? 'disabled' : ''}`}
              onClick={() => spotifyConnected ? setMode('upload') : (() => {
                // Save intention and redirect to connect
                try {
                  sessionStorage.setItem('return_to', '/home/analyze');
                } catch (_) {}
                const state = Math.random().toString(36).substring(7);
                try { localStorage.setItem('spotify_state', state); } catch (_) {}
                window.location.href = `http://127.0.0.1:8000/v1/auth/spotify?state=${state}`;
              })()}
              role={!spotifyConnected ? 'button' : undefined}
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
              {!spotifyConnected && <div className="disabled-overlay">Conecta Spotify para usar</div>}
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