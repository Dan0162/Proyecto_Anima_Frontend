import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/sidebar/Sidebar';
import GlassCard from '../../components/layout/GlassCard';
import './HistoryPage.css';
import { getUserHistory } from '../../utils/analyticsApi';

const HistoryPage = () => {
  const [analyses, setAnalyses] = useState([]);
  const [filteredAnalyses, setFilteredAnalyses] = useState([]);
  const [selectedEmotion, setSelectedEmotion] = useState('all');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      try {
        const response = await getUserHistory();
        const historyData = response.analyses.map(analysis => {
          const recs = analysis.recommendations || [];
          // Support multiple shapes: array of tracks, or object with 'tracks' key, or object with 'total_tracks'
          let tracksCount = 0;
          if (Array.isArray(recs)) {
            tracksCount = recs.length;
          } else if (recs && typeof recs === 'object') {
            if (Array.isArray(recs.tracks)) tracksCount = recs.tracks.length;
            else if (typeof recs.total_tracks === 'number') tracksCount = recs.total_tracks;
          }

          return {
            id: analysis.id,
            emotion: analysis.emotion,
            confidence: analysis.confidence,
            date: analysis.date,
            emotions_detected: analysis.emotions_detected,
            recommendations: Array.isArray(recs) ? recs : (recs.tracks || []),
            tracksCount
          };
        });

        setAnalyses(historyData);
        setFilteredAnalyses(historyData);
      } catch (error) {
        console.error('Error loading history:', error);
        setAnalyses([]);
        setFilteredAnalyses([]);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, []);

  useEffect(() => {
    const filterAnalyses = async () => {
      if (selectedEmotion === 'all') {
        setFilteredAnalyses(analyses);
      } else {
        try {
          const response = await getUserHistory(selectedEmotion);
          const filteredData = response.analyses.map(analysis => {
            const recs = analysis.recommendations || [];
            let tracksCount = 0;
            if (Array.isArray(recs)) tracksCount = recs.length;
            else if (recs && typeof recs === 'object') {
              if (Array.isArray(recs.tracks)) tracksCount = recs.tracks.length;
              else if (typeof recs.total_tracks === 'number') tracksCount = recs.total_tracks;
            }

            return {
              id: analysis.id,
              emotion: analysis.emotion,
              confidence: analysis.confidence,
              date: analysis.date,
              emotions_detected: analysis.emotions_detected,
              recommendations: Array.isArray(recs) ? recs : (recs.tracks || []),
              tracksCount
            };
          });
          setFilteredAnalyses(filteredData);
        } catch (error) {
          console.error('Error filtering history:', error);
          setFilteredAnalyses([]);
        }
      }
    };

    filterAnalyses();
  }, [selectedEmotion, analyses]);


  const getEmotionColor = (emotion) => {
    const colors = {
      happy: { primary: '#FFF200', bg: 'rgba(255, 242, 0, 0.15)', border: 'rgba(255, 242, 0, 0.3)' },
      sad: { primary: '#0088FF', bg: 'rgba(0, 136, 255, 0.15)', border: 'rgba(0, 136, 255, 0.3)' },
      angry: { primary: '#C97676', bg: 'rgba(201, 118, 118, 0.15)', border: 'rgba(201, 118, 118, 0.3)' },
      relaxed: { primary: '#a1a2e6', bg: 'rgba(161, 162, 230, 0.15)', border: 'rgba(161, 162, 230, 0.3)' },
      energetic: { primary: '#e7a3c4', bg: 'rgba(231, 163, 196, 0.15)', border: 'rgba(231, 163, 196, 0.3)' }
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

  const getTrackPreview = (analysis) => {
    const recs = analysis.recommendations || [];
    if (!recs || recs.length === 0) return 'Sin canciones';
    const first = recs[0];
    // first may be an object with name and artists (array of {name})
    const name = first.name || first.title || first.track?.name || '';
    let artists = [];
    if (Array.isArray(first.artists)) {
      artists = first.artists.map(a => a.name).filter(Boolean);
    } else if (first.track && Array.isArray(first.track.artists)) {
      artists = first.track.artists.map(a => a.name).filter(Boolean);
    }
    const artistStr = artists.join(', ');
    if (name && artistStr) return `${name} — ${artistStr}`;
    if (name) return name;
    return 'Recomendación disponible';
  };

  const formatDate = (dateString) => {
    // Mostrar fecha y hora localizada (sin textos relativos)
    if (!dateString) return '';
    const date = new Date(dateString);
    try {
      return date.toLocaleString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return date.toLocaleDateString();
    }
  };

  const handleViewDetails = (analysisId) => {
    navigate(`/home/analysis/${analysisId}`);
  };

  const emotionFilters = [
    { value: 'all', label: 'Todas', emoji: '🎭' },
    { value: 'happy', label: 'Feliz', emoji: '😊' },
    { value: 'sad', label: 'Triste', emoji: '😢' },
    { value: 'angry', label: 'Enojado', emoji: '😠' },
    { value: 'relaxed', label: 'Relajado', emoji: '😌' },
    { value: 'energetic', label: 'Energético', emoji: '⚡' }
  ];

  return (
    <div className="history-page gradient-bg">
      <Sidebar />
      
      <div className="history-content">
        <div className="history-header">
          <div>
            <h1 className="history-title">Tu Historial</h1>
            <p className="history-subtitle">
              Revisa tus análisis emocionales anteriores
            </p>
          </div>

          <div className="emotion-filters">
            {emotionFilters.map(filter => (
              <button
                key={filter.value}
                className={`filter-btn ${selectedEmotion === filter.value ? 'active' : ''}`}
                onClick={() => setSelectedEmotion(filter.value)}
                style={
                  selectedEmotion === filter.value
                    ? {
                        background: filter.value === 'all' 
                          ? 'linear-gradient(135deg, #a1a2e6 0%, #e7a3c4 100%)'
                          : getEmotionColor(filter.value).bg,
                        borderColor: filter.value === 'all'
                          ? 'rgba(161, 162, 230, 0.3)'
                          : getEmotionColor(filter.value).border
                      }
                    : {}
                }
              >
                <span className="filter-emoji">{filter.emoji}</span>
                <span>{filter.label}</span>
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Cargando historial...</p>
          </div>
        ) : filteredAnalyses.length > 0 ? (
          <div className="history-grid">
            {filteredAnalyses.map((analysis) => {
              const colors = getEmotionColor(analysis.emotion);
              return (
                <GlassCard
                  key={analysis.id}
                  variant="default"
                  className="history-item"
                  style={{
                    background: colors.bg,
                    borderColor: colors.border
                  }}
                >
                  <div className="history-item-header">
                    <div 
                      className="emotion-badge"
                      style={{ borderColor: colors.border }}
                    >
                      <span className="badge-emoji">{getEmotionEmoji(analysis.emotion)}</span>
                      <span className="badge-label">{getEmotionLabel(analysis.emotion)}</span>
                    </div>
                    <div className="analysis-date">{formatDate(analysis.date)}</div>
                  </div>

                  <div className="history-item-body">
                    <div className="confidence-display">
                      <div className="confidence-circle">
                        <svg className="confidence-ring">
                          <circle 
                            className="confidence-ring-bg" 
                            cx="40" 
                            cy="40" 
                            r="35"
                          />
                          <circle 
                            className="confidence-ring-fill" 
                            cx="40" 
                            cy="40" 
                            r="35"
                            style={{
                              stroke: colors.primary,
                              strokeDasharray: `${analysis.confidence * 220} 220`
                            }}
                          />
                        </svg>
                        <div className="confidence-text">
                          {Math.round(analysis.confidence * 100)}%
                        </div>
                      </div>
                      <div className="confidence-label">Confianza</div>
                    </div>

                    <div className="history-stats">
                      <div className="stat-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 18V5l12-2v13"></path>
                          <circle cx="6" cy="18" r="3"></circle>
                          <circle cx="18" cy="16" r="3"></circle>
                        </svg>
                        <span className="track-preview">{getTrackPreview(analysis)}</span>
                      </div>
                    </div>
                  </div>

                  <button 
                    className="view-details-btn"
                    onClick={() => handleViewDetails(analysis.id)}
                    style={{
                      background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primary}CC 100%)`,
                      borderColor: colors.border
                    }}
                  >
                    Ver Detalles
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                  </button>
                </GlassCard>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <h3>No hay análisis</h3>
            <p>
              {selectedEmotion === 'all' 
                ? 'Aún no has realizado ningún análisis emocional'
                : `No tienes análisis con la emoción: ${getEmotionLabel(selectedEmotion)}`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;