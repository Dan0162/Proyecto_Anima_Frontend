import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/sidebar/Sidebar';
import GlassCard from '../../components/layout/GlassCard';
import { useCurrentUser } from '../../hooks/useAuth';
import './DashboardPage.css';

const DashboardPage = () => {
  const { user } = useCurrentUser();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Obtener estadísticas reales del backend
    const mockStats = generateMockStats();
    setStats(mockStats);
    setLoading(false);
  }, []);

  const generateMockStats = () => {
    return {
      totalAnalyses: 24,
      mostFrequentEmotion: 'happy',
      averageConfidence: 0.85,
      lastAnalysisDate: new Date().toISOString(),
      emotionDistribution: {
        happy: 10,
        sad: 4,
        angry: 2,
        relaxed: 6,
        energetic: 2
      },
      weeklyActivity: [3, 5, 2, 8, 4, 6, 5],
      topGenres: ['pop', 'rock', 'indie', 'electronic'],
      streak: 7
    };
  };

  const getEmotionColor = (emotion) => {
    const colors = {
      happy: { primary: '#FFF200', gradient: 'linear-gradient(135deg, #FFF200 0%, #FFD700 100%)' },
      sad: { primary: '#0088FF', gradient: 'linear-gradient(135deg, #0088FF 0%, #0066CC 100%)' },
      angry: { primary: '#C97676', gradient: 'linear-gradient(135deg, #C97676 0%, #d89898 100%)' },
      relaxed: { primary: '#a1a2e6', gradient: 'linear-gradient(135deg, #a1a2e6 0%, #8B8CF5 100%)' },
      energetic: { primary: '#e7a3c4', gradient: 'linear-gradient(135deg, #e7a3c4 0%, #FF9EC7 100%)' }
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

  if (loading || !stats) {
    return (
      <div className="dashboard-page gradient-bg">
        <Sidebar />
        <div className="dashboard-content">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Cargando estadísticas...</p>
          </div>
        </div>
      </div>
    );
  }

  const mostFrequentColors = getEmotionColor(stats.mostFrequentEmotion);

  return (
    <div className="dashboard-page gradient-bg">
      <Sidebar />
      
      <div className="dashboard-content">
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Dashboard</h1>
            <p className="dashboard-subtitle">
              Hola <strong>{user?.nombre || 'Usuario'}</strong>, aquí están tus estadísticas
            </p>
          </div>
        </div>

        {/* Tarjetas de estadísticas principales */}
        <div className="stats-overview">
          <GlassCard variant="lilac" className="stat-card">
            <div className="stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <div className="stat-value">{stats.totalAnalyses}</div>
            <div className="stat-label">Análisis Totales</div>
          </GlassCard>

          <GlassCard 
            variant="default" 
            className="stat-card"
            style={{
              background: mostFrequentColors.gradient.replace(/linear-gradient\([^,]+,/, 'linear-gradient(135deg,').replace(/\)/g, '15)') + ', ' + mostFrequentColors.gradient.replace(/linear-gradient\([^,]+,/, 'linear-gradient(135deg,').replace(/\)/g, '05)'),
              borderColor: `${mostFrequentColors.primary}4D`
            }}
          >
            <div className="stat-icon">
              <span style={{ fontSize: '2.5rem' }}>
                {getEmotionEmoji(stats.mostFrequentEmotion)}
              </span>
            </div>
            <div className="stat-value">{getEmotionLabel(stats.mostFrequentEmotion)}</div>
            <div className="stat-label">Emoción Más Frecuente</div>
          </GlassCard>

          <GlassCard variant="blue" className="stat-card">
            <div className="stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
              </svg>
            </div>
            <div className="stat-value">{Math.round(stats.averageConfidence * 100)}%</div>
            <div className="stat-label">Confianza Promedio</div>
          </GlassCard>

          <GlassCard variant="pink" className="stat-card">
            <div className="stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M2 12h20"></path>
              </svg>
            </div>
            <div className="stat-value">{stats.streak}</div>
            <div className="stat-label">Días Consecutivos</div>
          </GlassCard>
        </div>

        <div className="dashboard-grid">
          {/* Distribución de emociones */}
          <GlassCard variant="default" className="emotion-distribution-card">
            <h3 className="card-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="20" x2="18" y2="10"></line>
                <line x1="12" y1="20" x2="12" y2="4"></line>
                <line x1="6" y1="20" x2="6" y2="14"></line>
              </svg>
              Distribución de Emociones
            </h3>
            
            <div className="emotion-bars">
              {Object.entries(stats.emotionDistribution)
                .sort(([, a], [, b]) => b - a)
                .map(([emotion, count]) => {
                  const colors = getEmotionColor(emotion);
                  const percentage = (count / stats.totalAnalyses) * 100;
                  
                  return (
                    <div key={emotion} className="emotion-bar-item">
                      <div className="emotion-bar-header">
                        <div className="emotion-bar-label">
                          <span className="emotion-bar-emoji">{getEmotionEmoji(emotion)}</span>
                          <span className="emotion-bar-name">{getEmotionLabel(emotion)}</span>
                        </div>
                        <div className="emotion-bar-count">{count}</div>
                      </div>
                      <div className="emotion-bar-container">
                        <div 
                          className="emotion-bar-fill"
                          style={{
                            width: `${percentage}%`,
                            background: colors.gradient
                          }}
                        >
                          <span className="bar-percentage">{Math.round(percentage)}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </GlassCard>

          {/* Actividad semanal */}
          <GlassCard variant="default" className="weekly-activity-card">
            <h3 className="card-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              Actividad de la Semana
            </h3>
            
            <div className="weekly-chart">
              {stats.weeklyActivity.map((count, index) => {
                const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
                const maxCount = Math.max(...stats.weeklyActivity);
                const height = (count / maxCount) * 100;
                
                return (
                  <div key={index} className="day-column">
                    <div 
                      className="day-bar"
                      style={{ height: `${height}%` }}
                      data-count={count}
                    >
                      <span className="bar-value">{count}</span>
                    </div>
                    <div className="day-label">{days[index]}</div>
                  </div>
                );
              })}
            </div>
          </GlassCard>

          {/* Géneros favoritos */}
          <GlassCard variant="default" className="top-genres-card">
            <h3 className="card-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18V5l12-2v13"></path>
                <circle cx="6" cy="18" r="3"></circle>
                <circle cx="18" cy="16" r="3"></circle>
              </svg>
              Géneros Más Escuchados
            </h3>
            
            <div className="genres-list">
              {stats.topGenres.map((genre, index) => (
                <div key={index} className="genre-item">
                  <div className="genre-rank">#{index + 1}</div>
                  <div className="genre-name">{genre.charAt(0).toUpperCase() + genre.slice(1)}</div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
