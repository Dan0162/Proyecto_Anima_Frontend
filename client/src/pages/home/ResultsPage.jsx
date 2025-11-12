import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../../components/sidebar/Sidebar';
import GlassCard from '../../components/layout/GlassCard';
import { useFlash } from '../../components/flash/FlashContext';
import { saveAnalysisResult } from '../../utils/analyticsApi';
import tokenManager from '../../utils/tokenManager';
import './ResultsPage.css';

const ResultsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const flash = useFlash();
  
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [savingPlaylist, setSavingPlaylist] = useState(false);
  const [playlistSaved, setPlaylistSaved] = useState(false);
  
  const { result, photo, recommendations: analysisRecommendations } = location.state || {};

  const fetchRecommendations = useCallback(async () => {
    setLoading(true);
    try {
  const protectedUrl = `${tokenManager.getBaseUrl()}/recommend?emotion=${result.emotion}`;
      const jwt = localStorage.getItem('spotify_jwt');
      let response;
      if (jwt) {
        response = await fetch(protectedUrl, { headers: { 'Authorization': `Bearer ${jwt}` } });
      } else {
        response = { ok: false, status: 401 };
      }

      if (!response.ok) {
        if (response.status === 401) {
          // Invalid or missing token -> send user to homepage with banner
          localStorage.removeItem('spotify_jwt');
          navigate('/', {
            state: {
              flash: 'Tu sesión de Spotify expiró o es inválida. Por favor, vuelve a conectar para ver recomendaciones.',
              flashType: 'error'
            }
          });
          return;
        }
        // No mocks available — inform the user and stop
        console.error('❌ Recomendaciones no disponibles (sin mocks).');
        if (flash?.show) flash.show('No se pudieron obtener recomendaciones. Conecta Spotify para obtener música personalizada.', 'error');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.tracks || []);
        console.log('✅ Recomendaciones cargadas:', data.tracks?.length || 0);
      } else {
        console.error('❌ Error al cargar recomendaciones:', response.status);
      }
    } catch (error) {
      console.error('❌ Error:', error);
    } finally {
      setLoading(false);
    }
  }, [result?.emotion, navigate, flash]);

  // 🆕 Usar recomendaciones del análisis o hacer fallback si no las hay
  useEffect(() => {
    if (!result || !photo) {
      navigate('/home/analyze');
      return;
    }

    // Usar recomendaciones del análisis si están disponibles
    if (analysisRecommendations && analysisRecommendations.length > 0) {
      console.log('✅ Usando recomendaciones del análisis:', analysisRecommendations.length);
      setRecommendations(analysisRecommendations);
    } else {
      // Fallback: hacer fetch de recomendaciones si no vienen del análisis
      console.log('⚠️ No hay recomendaciones en el análisis, haciendo fetch...');
      fetchRecommendations();
    }
  }, [result, photo, analysisRecommendations, navigate, fetchRecommendations]);

  // 🆕 Función para guardar playlist en Spotify (copiada de AnalysisDetailPage)
  const handleSavePlaylist = async () => {
    if (!result || !recommendations.length) return;

    try {
      setSavingPlaylist(true);
      
      const jwt = localStorage.getItem('spotify_jwt');
      if (!jwt) {
        if (flash?.show) {
          flash.show('Conecta tu cuenta de Spotify para guardar playlists', 'error');
        }
        return;
      }

      // Crear playlist en Spotify — usar analysis_id provisto por el flujo de análisis si existe
      let providedAnalysisId = location.state?.analysis_id || null;
      // Si no hay analysis_id, intentar guardar el análisis primero para obtener uno
      if (!providedAnalysisId) {
        try {
          const saveData = {
            emotion: result.emotion,
            confidence: result.confidence,
            emotions_detected: result.emotions_detected || {},
            recommendations: recommendations || []
          };
          const saveResp = await saveAnalysisResult(saveData);
          if (saveResp && saveResp.analysis_id) {
            providedAnalysisId = saveResp.analysis_id;
          }
        } catch (e) {
          console.error('Error guardando análisis antes de crear playlist:', e);
        }
      }
      const playlistData = {
        analysis_id: providedAnalysisId !== null ? providedAnalysisId : 0,
        emotion: result.emotion,
        confidence: result.confidence,
        tracks: recommendations.slice(0, 20).map(track => track.uri).filter(Boolean)
      };

  const response = await fetch(`${tokenManager.getBaseUrl()}/v1/spotify/create-playlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`
        },
        body: JSON.stringify(playlistData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al crear playlist');
      }

      const playlistResult = await response.json();
      
      setPlaylistSaved(true);
      if (flash?.show) {
        flash.show(`✅ Playlist "${playlistResult.playlist_name}" creada exitosamente en Spotify`, 'success', 5000);
      }
      
    } catch (error) {
      console.error('Error guardando playlist:', error);
      if (flash?.show) {
        flash.show(error.message || 'Error al guardar playlist en Spotify', 'error');
      }
    } finally {
      setSavingPlaylist(false);
    }
  };

  // 🎨 Obtener color según emoción
  const getEmotionColor = (emotion) => {
    const colors = {
      happy: {
        primary: '#FFF200',
        secondary: '#FFD700',
        gradient: 'linear-gradient(135deg, #FFF200 0%, #FFD700 100%)',
        glassBg: 'rgba(255, 242, 0, 0.15)',
        glassBorder: 'rgba(255, 242, 0, 0.3)'
      },
      sad: {
        primary: '#0088FF',
        secondary: '#0066CC',
        gradient: 'linear-gradient(135deg, #0088FF 0%, #0066CC 100%)',
        glassBg: 'rgba(0, 136, 255, 0.15)',
        glassBorder: 'rgba(0, 136, 255, 0.3)'
      },
      angry: {
        primary: '#C97676',
        secondary: '#d89898',
        gradient: 'linear-gradient(135deg, #C97676 0%, #d89898 100%)',
        glassBg: 'rgba(201, 118, 118, 0.15)',
        glassBorder: 'rgba(201, 118, 118, 0.3)'
      },
      relaxed: {
        primary: '#a1a2e6',
        secondary: '#8B8CF5',
        gradient: 'linear-gradient(135deg, #a1a2e6 0%, #8B8CF5 100%)',
        glassBg: 'rgba(161, 162, 230, 0.15)',
        glassBorder: 'rgba(161, 162, 230, 0.3)'
      },
      energetic: {
        primary: '#e7a3c4',
        secondary: '#FF9EC7',
        gradient: 'linear-gradient(135deg, #e7a3c4 0%, #FF9EC7 100%)',
        glassBg: 'rgba(231, 163, 196, 0.15)',
        glassBorder: 'rgba(231, 163, 196, 0.3)'
      }
    };
    return colors[emotion] || colors.happy;
  };

  const getEmotionEmoji = (emotion) => {
    const emojis = {
      happy: '😊',
      sad: '😢',
      angry: '😠',
      relaxed: '😌',
      energetic: '⚡'
    };
    return emojis[emotion] || '🎭';
  };

  const getEmotionLabel = (emotion) => {
    const labels = {
      happy: 'Feliz',
      sad: 'Triste',
      angry: 'Enojado',
      relaxed: 'Relajado',
      energetic: 'Energético'
    };
    return labels[emotion] || emotion;
  };

  if (!result) {
    return (
      <div className="results-page gradient-bg">
        <div className="results-content">Cargando...</div>
      </div>
    );
  }

  const emotionColors = getEmotionColor(result.emotion);

  return (
    <div className="results-page gradient-bg">
      <Sidebar />
      
      <div className="results-content">
        {/* Header con botón de Nuevo Análisis */}
        <div className="results-header-section">
          <div className="results-header">
            <h1 className="results-title">Resultados del Análisis</h1>
            <p className="results-subtitle">Tu emoción dominante y música personalizada</p>
          </div>
          
          <button 
            className="action-button new-analysis"
            onClick={() => navigate('/home/analyze')}
            style={{
              background: emotionColors.gradient,
              borderColor: emotionColors.glassBorder
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="1 4 1 10 7 10"></polyline>
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
            </svg>
            Nuevo Análisis
          </button>
        </div>

        <div className="results-grid">
          {/* Sección Izquierda - Foto y Emociones */}
          <div className="photo-section">
            <GlassCard 
              variant="default" 
              className="photo-container"
              style={{
                background: emotionColors.glassBg,
                borderColor: emotionColors.glassBorder
              }}
            >
              <img src={photo} alt="Tu foto" className="result-photo" />
            </GlassCard>
            
            <GlassCard 
              variant="default" 
              className="emotion-card"
              style={{
                background: emotionColors.glassBg,
                borderColor: emotionColors.glassBorder
              }}
            >
              <div className="emotion-icon">{getEmotionEmoji(result.emotion)}</div>
              <div className="emotion-label">{getEmotionLabel(result.emotion)}</div>
              <div 
                className="confidence"
                style={{
                  background: emotionColors.gradient,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                {(result.confidence * 100).toFixed(1)}%
              </div>
              <div className="confidence-label">Confianza</div>
            </GlassCard>

            <GlassCard 
              variant="default" 
              className="emotions-breakdown-card"
              style={{
                background: emotionColors.glassBg,
                borderColor: emotionColors.glassBorder
              }}
            >
              <h3 className="section-subtitle">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
                Desglose Emocional
              </h3>
              <div className="emotions-breakdown">
                {Object.entries(result.emotions_detected)
                  .sort(([, a], [, b]) => b - a)
                  .map(([emotion, value]) => {
                    const barColor = getEmotionColor(emotion);
                    return (
                      <div key={emotion} className="emotion-bar">
                        <span className="emotion-name">{getEmotionLabel(emotion)}</span>
                        <div className="progress-container">
                          <div 
                            className="progress-fill" 
                            style={{
                              width: `${value * 100}%`,
                              background: barColor.gradient
                            }} 
                          />
                        </div>
                        <span 
                          className="emotion-value"
                          style={{ color: barColor.secondary }}
                        >
                          {(value * 100).toFixed(1)}%
                        </span>
                      </div>
                    );
                  })}
              </div>
            </GlassCard>
          </div>

          {/* Sección Derecha - Música */}
          <div className="music-section">
            <GlassCard 
              variant="default" 
              className="music-container"
              style={{
                background: emotionColors.glassBg,
                borderColor: emotionColors.glassBorder
              }}
            >
              <div className="music-header">
                <div className="playlist-header">
                  <div className="playlist-title-section">
                    <h2 className="section-title">
                      🎵 Recomendaciones Musicales
                    </h2>
                    <p className="music-subtitle">
                      Canciones seleccionadas para tu estado de ánimo: <strong>{getEmotionLabel(result.emotion)}</strong>
                    </p>
                  </div>
                  
                  {/* 🆕 Botón para guardar playlist en Spotify */}
                  {recommendations.length > 0 && (
                    <button
                      className={`save-playlist-btn ${playlistSaved ? 'saved' : ''}`}
                      onClick={handleSavePlaylist}
                      disabled={savingPlaylist || playlistSaved}
                      style={{
                        background: playlistSaved 
                          ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                          : emotionColors.gradient,
                        borderColor: emotionColors.glassBorder
                      }}
                    >
                      {savingPlaylist ? (
                        <>
                          <div className="btn-spinner"></div>
                          Guardando...
                        </>
                      ) : playlistSaved ? (
                        <>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                          Guardado en Spotify
                        </>
                      ) : (
                        <>
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                          </svg>
                          Guardar en Spotify
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
              
              {loading ? (
                <div className="loading-state">
                  <div 
                    className="loading-spinner"
                    style={{ borderTopColor: emotionColors.primary }}
                  ></div>
                  <p>Cargando tus recomendaciones...</p>
                </div>
              ) : recommendations.length > 0 ? (
                <div className="tracks-list">
                  {recommendations.slice(0, 30).map((track, index) => (
                    <div key={index} className="track-card">
                      {/* Reproductor de Spotify */}
                      {track.uri && (
                        <div className="track-player">
                          <iframe
                            title={`Spotify Player ${track.name}`}
                            src={`https://open.spotify.com/embed/track/${track.uri.split(":").pop()}?utm_source=generator&theme=0`}
                            width="100%"
                            height="120"
                            frameBorder="0"
                            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                          ></iframe>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-music">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  <p>No se pudieron cargar recomendaciones</p>
                  <button 
                    className="retry-button"
                    onClick={fetchRecommendations}
                    style={{
                      background: emotionColors.gradient,
                      borderColor: emotionColors.glassBorder
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="1 4 1 10 7 10"></polyline>
                      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                    </svg>
                    Reintentar
                  </button>
                </div>
              )}
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;