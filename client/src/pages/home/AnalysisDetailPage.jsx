import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/sidebar/Sidebar';
import GlassCard from '../../components/layout/GlassCard';
import { useFlash } from '../../components/flash/FlashContext';
import './AnalysisDetailPage.css';

const AnalysisDetailPage = () => {
  const { analysisId } = useParams();
  const navigate = useNavigate();
  const flash = useFlash();
  
  const [analysis, setAnalysis] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingPlaylist, setSavingPlaylist] = useState(false);
  const [playlistSaved, setPlaylistSaved] = useState(false);

  // Cargar detalles del análisis al montar o cuando cambia el ID
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);

        // Obtener detalles del análisis
        const analysisResponse = await fetch(`http://127.0.0.1:8000/v1/analytics/analysis/${analysisId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        });

        if (!analysisResponse.ok) {
          throw new Error('Error al cargar detalles del análisis');
        }

        const analysisData = await analysisResponse.json();
        setAnalysis(analysisData);

        // Obtener recomendaciones basadas en la emoción del análisis
        await loadRecommendations(analysisData.emotion);

      } catch (error) {
        console.error('Error cargando análisis:', error);
        if (flash?.show) {
          flash.show('Error al cargar los detalles del análisis', 'error');
        }
        navigate('/home/history');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [analysisId, flash, navigate]);

  const loadRecommendations = async (emotion) => {
    try {
      const jwt = localStorage.getItem('spotify_jwt');
      const url = `http://127.0.0.1:8000/recommend?emotion=${emotion}`;
      
      let response;
      if (jwt) {
        response = await fetch(url, {
          headers: { 'Authorization': `Bearer ${jwt}` }
        });
      } else {
        // Fallback a mockup si no hay Spotify conectado
        const fallbackUrl = `http://127.0.0.1:8000/recommend/mockup?emotion=${emotion}`;
        response = await fetch(fallbackUrl);
      }

      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.tracks || []);
      }
    } catch (error) {
      console.error('Error cargando recomendaciones:', error);
    }
  };

  const handleSavePlaylist = async () => {
    if (!analysis || !recommendations.length) return;

    try {
      setSavingPlaylist(true);
      
      const jwt = localStorage.getItem('spotify_jwt');
      if (!jwt) {
        if (flash?.show) {
          flash.show('Conecta tu cuenta de Spotify para guardar playlists', 'error');
        }
        return;
      }

      // Crear playlist en Spotify
      const playlistData = {
        analysis_id: analysisId,
        emotion: analysis.emotion,
        confidence: analysis.confidence,
        tracks: recommendations.slice(0, 20).map(track => track.uri).filter(Boolean)
      };

      const response = await fetch('http://127.0.0.1:8000/v1/spotify/create-playlist', {
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

      const result = await response.json();
      
      setPlaylistSaved(true);
      if (flash?.show) {
        flash.show(`✅ Playlist "${result.playlist_name}" creada exitosamente en Spotify`, 'success', 5000);
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

  // Obtener color según emoción
  const getEmotionColor = (emotion) => {
    const colors = {
      happy: {
        primary: '#FFF200',
        gradient: 'linear-gradient(135deg, #FFF200 0%, #FFD700 100%)',
        glassBg: 'rgba(255, 242, 0, 0.15)',
        glassBorder: 'rgba(255, 242, 0, 0.3)'
      },
      sad: {
        primary: '#0088FF',
        gradient: 'linear-gradient(135deg, #0088FF 0%, #0066CC 100%)',
        glassBg: 'rgba(0, 136, 255, 0.15)',
        glassBorder: 'rgba(0, 136, 255, 0.3)'
      },
      angry: {
        primary: '#C97676',
        gradient: 'linear-gradient(135deg, #C97676 0%, #d89898 100%)',
        glassBg: 'rgba(201, 118, 118, 0.15)',
        glassBorder: 'rgba(201, 118, 118, 0.3)'
      },
      relaxed: {
        primary: '#a1a2e6',
        gradient: 'linear-gradient(135deg, #a1a2e6 0%, #8B8CF5 100%)',
        glassBg: 'rgba(161, 162, 230, 0.15)',
        glassBorder: 'rgba(161, 162, 230, 0.3)'
      },
      energetic: {
        primary: '#e7a3c4',
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="analysis-detail-page gradient-bg">
        <Sidebar />
        <div className="detail-content">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Cargando detalles del análisis...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="analysis-detail-page gradient-bg">
        <Sidebar />
        <div className="detail-content">
          <div className="error-container">
            <h2>Análisis no encontrado</h2>
            <button onClick={() => navigate('/home/history')}>
              Volver al historial
            </button>
          </div>
        </div>
      </div>
    );
  }

  const emotionColors = getEmotionColor(analysis.emotion);

  return (
    <div className="analysis-detail-page gradient-bg">
      <Sidebar />
      
      <div className="detail-content">
        {/* Header con navegación */}
        <div className="detail-header">
          <button 
            className="back-button"
            onClick={() => navigate('/home/history')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            Volver al historial
          </button>
          
          <div className="detail-title-section">
            <h1 className="detail-title">Detalles del Análisis</h1>
            <p className="detail-subtitle">{formatDate(analysis.date)}</p>
          </div>
        </div>

        <div className="detail-grid">
          {/* Información del análisis */}
          <div className="analysis-info-section">
            <GlassCard 
              variant="default"
              className="emotion-summary-card"
              style={{
                background: emotionColors.glassBg,
                borderColor: emotionColors.glassBorder
              }}
            >
              <div className="emotion-summary-content">
                <div className="emotion-icon-large">
                  {getEmotionEmoji(analysis.emotion)}
                </div>
                <div className="emotion-details">
                  <h2 className="emotion-name">{getEmotionLabel(analysis.emotion)}</h2>
                  <div 
                    className="confidence-score"
                    style={{
                      background: emotionColors.gradient,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}
                  >
                    {(analysis.confidence * 100).toFixed(1)}%
                  </div>
                  <p className="confidence-label">Confianza</p>
                </div>
              </div>
            </GlassCard>

            {/* Desglose emocional */}
            {analysis.emotions_detected && (
              <GlassCard 
                variant="default"
                className="emotions-breakdown-detail"
                style={{
                  background: emotionColors.glassBg,
                  borderColor: emotionColors.glassBorder
                }}
              >
                <h3 className="section-subtitle">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 11H5a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h4l3 3h13V8l-7-3-13 13z"></path>
                  </svg>
                  Desglose Emocional
                </h3>
                <div className="emotions-breakdown">
                  {Object.entries(analysis.emotions_detected)
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
                            style={{ color: barColor.primary }}
                          >
                            {(value * 100).toFixed(1)}%
                          </span>
                        </div>
                      );
                    })}
                </div>
              </GlassCard>
            )}
          </div>

          {/* Playlist recomendada */}
          <div className="playlist-section">
            <GlassCard 
              variant="default"
              className="playlist-card"
              style={{
                background: emotionColors.glassBg,
                borderColor: emotionColors.glassBorder
              }}
            >
              <div className="playlist-header">
                <div className="playlist-title-section">
                  <h2 className="playlist-title">
                    🎵 Playlist Recomendada
                  </h2>
                  <p className="playlist-subtitle">
                    Canciones seleccionadas para tu estado de ánimo: <strong>{getEmotionLabel(analysis.emotion)}</strong>
                  </p>
                </div>
                
                {/* Botón para guardar playlist */}
                <button
                  className={`save-playlist-btn ${playlistSaved ? 'saved' : ''}`}
                  onClick={handleSavePlaylist}
                  disabled={savingPlaylist || playlistSaved || !recommendations.length}
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
              </div>

              {recommendations.length > 0 ? (
                <div className="tracks-list">
                  {recommendations.slice(0, 20).map((track, index) => (
                    <div key={index} className="track-card">
                      {track.uri && (
                        <iframe
                          title={`Spotify Player ${track.name}`}
                          src={`https://open.spotify.com/embed/track/${track.uri.split(":").pop()}?utm_source=generator&theme=0`}
                          width="100%"
                          height="80"
                          frameBorder="0"
                          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                          style={{ borderRadius: 8 }}
                        ></iframe>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-tracks">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  <p>No se pudieron cargar las recomendaciones</p>
                </div>
              )}
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisDetailPage;