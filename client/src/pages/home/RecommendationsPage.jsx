import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../../components/sidebar/Sidebar';
import GlassCard from '../../components/layout/GlassCard';
import './RecommendationsPage.css';

const RecommendationsPage = () => {
  const [selectedEmotion, setSelectedEmotion] = useState('happy');
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);

  const emotions = [
    { value: 'happy', label: 'Feliz', emoji: '😊', description: 'Música alegre y positiva' },
    { value: 'sad', label: 'Triste', emoji: '😢', description: 'Melodías melancólicas' },
    { value: 'angry', label: 'Enojado', emoji: '😠', description: 'Energía intensa y liberadora' },
    { value: 'relaxed', label: 'Relajado', emoji: '😌', description: 'Sonidos tranquilos y suaves' },
    { value: 'energetic', label: 'Energético', emoji: '⚡', description: 'Ritmos vibrantes y dinámicos' }
  ];

   const fetchRecommendations = useCallback(async () => {
    setLoading(true);
    try {
      const url = `http://127.0.0.1:8000/recommend/mockup?emotion=${selectedEmotion}`;
      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.tracks || []);
        console.log('✅ Recomendaciones cargadas:', data.tracks?.length || 0);
        console.log('📊 Datos recibidos del backend:', data); // ← Agrega esto
        console.log('🎵 Número de tracks recibidos:', data.tracks?.length); // ← Y esto
      }
    } catch (error) {
      console.error('❌ Error:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedEmotion]); // Dependencias de useCallback

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]); // Ahora fetchRecommendations es estable


  const getEmotionColor = (emotion) => {
    const colors = {
      happy: { primary: '#FFF200', gradient: 'linear-gradient(135deg, #FFF200 0%, #FFD700 100%)', bg: 'rgba(255, 242, 0, 0.15)', border: 'rgba(255, 242, 0, 0.3)' },
      sad: { primary: '#0088FF', gradient: 'linear-gradient(135deg, #0088FF 0%, #0066CC 100%)', bg: 'rgba(0, 136, 255, 0.15)', border: 'rgba(0, 136, 255, 0.3)' },
      angry: { primary: '#C97676', gradient: 'linear-gradient(135deg, #C97676 0%, #d89898 100%)', bg: 'rgba(201, 118, 118, 0.15)', border: 'rgba(201, 118, 118, 0.3)' },
      relaxed: { primary: '#a1a2e6', gradient: 'linear-gradient(135deg, #a1a2e6 0%, #8B8CF5 100%)', bg: 'rgba(161, 162, 230, 0.15)', border: 'rgba(161, 162, 230, 0.3)' },
      energetic: { primary: '#e7a3c4', gradient: 'linear-gradient(135deg, #e7a3c4 0%, #FF9EC7 100%)', bg: 'rgba(231, 163, 196, 0.15)', border: 'rgba(231, 163, 196, 0.3)' }
    };
    return colors[emotion] || colors.happy;
  };

  const currentEmotion = emotions.find(e => e.value === selectedEmotion);
  const currentColors = getEmotionColor(selectedEmotion);

  return (
    <div className="recommendations-page gradient-bg">
      <Sidebar />
      
      <div className="recommendations-content">
        <div className="recommendations-header">
          <div>
            <h1 className="recommendations-title">Explora Música</h1>
            <p className="recommendations-subtitle">
              Descubre playlists personalizadas para cada estado de ánimo
            </p>
          </div>
        </div>

        {/* Selector de emociones */}
        <div className="emotions-selector">
          {emotions.map((emotion) => {
            const colors = getEmotionColor(emotion.value);
            const isSelected = selectedEmotion === emotion.value;
            
            return (
              <GlassCard
                key={emotion.value}
                variant="default"
                className={`emotion-option ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedEmotion(emotion.value)}
                style={
                  isSelected
                    ? {
                        background: colors.bg,
                        borderColor: colors.border,
                        borderWidth: '3px'
                      }
                    : {}
                }
              >
                <div 
                  className="emotion-option-emoji"
                  style={isSelected ? { transform: 'scale(1.2)' } : {}}
                >
                  {emotion.emoji}
                </div>
                <div className="emotion-option-label">{emotion.label}</div>
                <div className="emotion-option-desc">{emotion.description}</div>
              </GlassCard>
            );
          })}
        </div>

        {/* Recomendaciones actuales */}
        <GlassCard 
          variant="default" 
          className="current-recommendations"
          style={{
            background: currentColors.bg,
            borderColor: currentColors.border,
            borderWidth: '2px'
          }}
        >
          <div className="recommendations-info">
            <div className="info-header">
              <div className="info-emotion">
                <span className="info-emoji">{currentEmotion?.emoji}</span>
                <div>
                  <h2 className="info-title">Música para sentirte {currentEmotion?.label}</h2>
                  <p className="info-description">{currentEmotion?.description}</p>
                </div>
              </div>
              
              <button 
                className="refresh-btn"
                onClick={fetchRecommendations}
                disabled={loading}
                style={{
                  background: currentColors.gradient,
                  borderColor: currentColors.border
                }}
              >
                <svg 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                  className={loading ? 'spinning' : ''}
                >
                  <polyline points="1 4 1 10 7 10"></polyline>
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                </svg>
                {loading ? 'Actualizando...' : 'Actualizar'}
              </button>
            </div>
          </div>

          {loading ? (
            <div className="loading-state">
              <div 
                className="loading-spinner"
                style={{ borderTopColor: currentColors.primary }}
              ></div>
              <p>Cargando recomendaciones...</p>
            </div>
          ) : recommendations.length > 0 ? (
            <div className="tracks-grid">
              {recommendations.slice(0, 30).map((track, index) => (
                <div 
                  key={index}
                  className="track-item"
                  onClick={() => window.open(track.external_urls?.spotify, '_blank')}
                >
                  <div className="track-cover-container">
                    {track.album?.images?.[0]?.url ? (
                      <img 
                        src={track.album.images[0].url} 
                        alt={track.name}
                        className="track-cover"
                      />
                    ) : (
                      <div className="track-cover-placeholder">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 18V5l12-2v13"></path>
                          <circle cx="6" cy="18" r="3"></circle>
                          <circle cx="18" cy="16" r="3"></circle>
                        </svg>
                      </div>
                    )}
                    <div 
                      className="track-play-overlay"
                      style={{ background: currentColors.gradient }}
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                  </div>
                  <div className="track-details">
                    <div className="track-title">{track.name}</div>
                    <div className="track-artist">
                      {track.artists?.map(a => a.name).join(', ') || 'Artista Desconocido'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-recommendations">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <p>No se pudieron cargar recomendaciones</p>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
};

export default RecommendationsPage;