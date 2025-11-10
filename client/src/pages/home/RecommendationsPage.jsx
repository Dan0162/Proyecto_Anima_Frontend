
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from '../../components/sidebar/Sidebar';
import GlassCard from '../../components/layout/GlassCard';
import './RecommendationsPage.css';
import { useFlash } from '../../components/flash/FlashContext';

// Preload album cover images for tracks
const preloadImages = async (tracks) => {
  const imagePromises = tracks
    .map(track => track.album?.images?.[0]?.url)
    .filter(Boolean)
    .map(src => new Promise((resolve) => {
      const img = new window.Image();
      img.src = src;
      img.onload = resolve;
      img.onerror = resolve; // avoid blocking
    }));
  await Promise.all(imagePromises);
};

const RecommendationsPage = () => {
  const [selectedEmotion, setSelectedEmotion] = useState('happy');
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(10);
  const [activeEmbedIndex, setActiveEmbedIndex] = useState(null);
  const gridRef = useRef(null);
  const hasShownFlashRef = useRef(false);

  const flash = useFlash();

  const emotions = [
    { value: 'happy', label: 'Feliz', emoji: '😊', description: 'Música alegre y positiva' },
    { value: 'sad', label: 'Triste', emoji: '😢', description: 'Melodías melancólicas' },
    { value: 'angry', label: 'Enojado', emoji: '😠', description: 'Energía intensa y liberadora' },
    { value: 'relaxed', label: 'Relajado', emoji: '😌', description: 'Sonidos tranquilos y suaves' },
    { value: 'energetic', label: 'Energético', emoji: '⚡', description: 'Ritmos vibrantes y dinámicos' }
  ];

  const fetchRecommendations = useCallback(async () => {
    const jwt = localStorage.getItem('spotify_jwt');
    if (!jwt) {
      // No Spotify token - don't attempt to fetch
      setLoading(false);
      if (!hasShownFlashRef.current) {
        hasShownFlashRef.current = true;
        try { 
          flash?.show('Conecta tu cuenta de Spotify para ver esta página y obtener recomendaciones personalizadas.', 'info', 6000); 
        } catch(_) {}
      }
      return;
    }

    setLoading(true);
    const MIN_LOADING_TIME = 2000; // ms
    const start = Date.now();
    try {
      const protectedUrl = `http://127.0.0.1:8000/recommend?emotion=${selectedEmotion}`;
      const response = await fetch(protectedUrl, { headers: { 'Authorization': `Bearer ${jwt}` } });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('spotify_jwt');
          if (!hasShownFlashRef.current) {
            hasShownFlashRef.current = true;
            try { 
              flash?.show('Conecta tu cuenta de Spotify para ver esta página y obtener recomendaciones personalizadas.', 'info', 6000); 
            } catch(_) {}
          }
          return;
        }
      }

      if (response.ok) {
        const data = await response.json();
        const tracks = data.tracks ? data.tracks.slice(0, 30) : [];
        await preloadImages(tracks);
        setRecommendations(tracks);
        setVisibleCount(10);
        setActiveEmbedIndex(null); // Reset embed when recommendations change
        console.log('✅ Recomendaciones cargadas:', tracks.length);
      }
    } catch (error) {
      console.error('❌ Error:', error);
    } finally {
      const elapsed = Date.now() - start;
      if (elapsed < MIN_LOADING_TIME) {
        setTimeout(() => setLoading(false), MIN_LOADING_TIME - elapsed);
      } else {
        setLoading(false);
      }
    }
  }, [selectedEmotion, flash]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  // Lazy load more songs on scroll
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const handleScroll = () => {
      if (grid.scrollTop + grid.clientHeight >= grid.scrollHeight - 10) {
        setVisibleCount((prev) => Math.min(prev + 10, 30, recommendations.length));
      }
    };
    grid.addEventListener('scroll', handleScroll);
    return () => grid.removeEventListener('scroll', handleScroll);
  }, [recommendations]);

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
            <div
              className="tracks-grid"
              ref={gridRef}
              style={{ maxHeight: '60vh', overflowY: 'auto' }}
            >
              {recommendations.slice(0, visibleCount).map((track, index) => (
                <div 
                  key={index}
                  className="track-item"
                >
                  <div className="track-cover-container">
                    {activeEmbedIndex === index ? (
                      // Spotify embed only for active song
                      <iframe
                        key={track.uri || index}
                        loading="lazy"
                        src={`https://open.spotify.com/embed/track/${track.uri?.split(":").pop()}`}
                        width="100%"
                        height="80"
                        frameBorder="0"
                        allow="encrypted-media"
                        title={track.name}
                        style={{ borderRadius: '8px', minHeight: 80, background: '#181818' }}
                      ></iframe>
                    ) : track.album?.images?.[0]?.url ? (
                      <img 
                        src={track.album.images[0].url} 
                        alt={track.name}
                        className="track-cover"
                        style={{ cursor: 'pointer' }}
                        onClick={() => setActiveEmbedIndex(index)}
                      />
                    ) : (
                      <div className="track-cover-placeholder" onClick={() => setActiveEmbedIndex(index)} style={{ cursor: 'pointer' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 18V5l12-2v13"></path>
                          <circle cx="6" cy="18" r="3"></circle>
                          <circle cx="18" cy="16" r="3"></circle>
                        </svg>
                      </div>
                    )}
                    {activeEmbedIndex !== index && (
                      <div 
                        className="track-play-overlay"
                        style={{ background: currentColors.gradient, cursor: 'pointer' }}
                        onClick={() => setActiveEmbedIndex(index)}
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="track-details">
                    <div className="track-title">{track.name}</div>
                    <div className="track-artist">
                      {track.artists?.map(a => a.name).join(', ') || 'Artista Desconocido'}
                    </div>
                    <div style={{ marginTop: 4 }}>
                      <button
                        className="spotify-link-btn"
                        style={{ background: currentColors.gradient, color: '#fff', border: 'none', borderRadius: 4, padding: '2px 8px', cursor: 'pointer', fontSize: 12 }}
                        onClick={() => window.open(track.external_urls?.spotify, '_blank')}
                      >
                        Ver en Spotify
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {visibleCount < recommendations.length && (
                <div className="loading-more" style={{ textAlign: 'center', padding: '1rem', color: currentColors.primary }}>
                  Cargando más canciones...
                </div>
              )}
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