import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/sidebar/Sidebar';
import GlassCard from '../../components/layout/GlassCard';
import './HistoryPage.css';

const HistoryPage = () => {
  const [analyses, setAnalyses] = useState([]);
  const [filteredAnalyses, setFilteredAnalyses] = useState([]);
  const [selectedEmotion, setSelectedEmotion] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Obtener historial real del backend
    // Por ahora usamos datos mockup
    const mockData = generateMockHistory();
    setAnalyses(mockData);
    setFilteredAnalyses(mockData);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (selectedEmotion === 'all') {
      setFilteredAnalyses(analyses);
    } else {
      setFilteredAnalyses(analyses.filter(a => a.emotion === selectedEmotion));
    }
  }, [selectedEmotion, analyses]);

  const generateMockHistory = () => {
    const emotions = ['happy', 'sad', 'angry', 'relaxed', 'energetic'];
    const history = [];
    
    for (let i = 0; i < 12; i++) {
      const emotion = emotions[Math.floor(Math.random() * emotions.length)];
      const date = new Date();
      date.setDate(date.getDate() - i * 2);
      
      history.push({
        id: i + 1,
        emotion: emotion,
        confidence: 0.75 + Math.random() * 0.2,
        date: date.toISOString(),
        tracksCount: Math.floor(Math.random() * 10) + 5
      });
    }
    
    return history;
  };

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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
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
                        <span>{analysis.tracksCount} canciones</span>
                      </div>
                    </div>
                  </div>

                  <button 
                    className="view-details-btn"
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