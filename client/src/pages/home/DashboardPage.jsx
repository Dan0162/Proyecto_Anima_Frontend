import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/sidebar/Sidebar';
import GlassCard from '../../components/layout/GlassCard';
import { useCurrentUser } from '../../hooks/useAuth';
import './DashboardPage.css';
import { getUserStats } from '../../utils/analyticsApi';

const DashboardPage = () => {
  const { user } = useCurrentUser();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // DevTools: print timezone and offset to help debug hour-based aggregations
  useEffect(() => {
    // kept intentionally empty for production — debug logging removed
  }, []);

useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      try {
        const response = await getUserStats();
        setStats(response);
      } catch (error) {
        console.error('Error loading stats:', error);
        // Fallback a datos vacíos en caso de error
        setStats({
          total_analyses: 0,
          most_frequent_emotion: null,
          average_confidence: 0,
          streak: 0,
          emotions_distribution: [],
          weekly_activity: [
            { day: 'Lun', analyses_count: 0 },
            { day: 'Mar', analyses_count: 0 },
            { day: 'Mié', analyses_count: 0 },
            { day: 'Jue', analyses_count: 0 },
            { day: 'Vie', analyses_count: 0 },
            { day: 'Sáb', analyses_count: 0 },
            { day: 'Dom', analyses_count: 0 }
          ],
          hourly_activity: new Array(24).fill(0),
          weekly_emotions: [],
          positive_negative_balance: { positive: 0, negative: 0 }
        });
      } finally {
        setLoading(false);
      }
    };

    loadStats();

    // Actualizar estadísticas cada 30 segundos
    const interval = setInterval(() => {
      loadStats();
    }, 30000);

    // Limpiar el intervalo cuando el componente se desmonte
    return () => clearInterval(interval);
  }, []); // carga inicial de estadísticas

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

  // Normalize weekly activity: support different shapes from the API
  const getWeeklyData = (weekly_activity) => {
    const raw = Array.isArray(weekly_activity) ? weekly_activity : [];
    return raw.map(item => {
      if (typeof item === 'number') return { day: '', count: item };
      const count = item?.analyses_count ?? item?.count ?? item?.value ?? 0;
      const day = item?.day ?? item?.label ?? '';
      return { day, count };
    });
  };
  // ===========================================================
  // Normaliza la actividad por hora considerando la zona horaria local
  // ===========================================================
  const getHourlyData = (hourly_activity) => {
    if (!hourly_activity) {
      return Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 }));
    }

    // Caso simple: arreglo de 24 números
    if (Array.isArray(hourly_activity) && hourly_activity.length === 24 && typeof hourly_activity[0] === 'number') {
      // Asumimos que el backend puede estar enviando counts indexados por HORA UTC.
      // Para mostrarlos en la hora local del cliente, rotamos la matriz según el timezone offset.
      const offsetMinutes = new Date().getTimezoneOffset(); // minutos que hay que sumar a la hora local para obtener UTC
      const shift = Math.round(offsetMinutes / 60); // horas de diferencia (puede ser negativa)
      // Si shift === 0 no necesitamos rotar
      if (shift === 0) {
        return hourly_activity.map((c, i) => ({ hour: i, count: Number(c) || 0 }));
      }

      const rotated = Array.from({ length: 24 }, (_, localHour) => {
        // Queremos: local[localHour] = source[(localHour + shift) % 24]
        const src = ((localHour + shift) % 24 + 24) % 24;
        return { hour: localHour, count: Number(hourly_activity[src]) || 0 };
      });

      // rotation applied silently in production; debug log removed
      return rotated;
    }

    // Caso más complejo: arreglo de objetos
    if (Array.isArray(hourly_activity) && hourly_activity.length > 0 && typeof hourly_activity[0] === 'object') {
      const looksLikeHourCount = hourly_activity.every(it =>
        ('hour' in it) || ('h' in it) || ('hora' in it) || ('count' in it) || ('analyses_count' in it)
      );

      const looksLikeEventsWithTimestamps = hourly_activity.some(it =>
        it && (it.timestamp || it.created_at || it.analyzed_at || it.date)
      );

      // Si ya son objetos con hora y conteo directo
      if (looksLikeHourCount && !looksLikeEventsWithTimestamps) {
        const map = {};
        hourly_activity.forEach(it => {
          const hour = Number(it?.hour ?? it?.h ?? it?.hora ?? 0);
          const count = Number(it?.count ?? it?.value ?? it?.analyses_count ?? 0) || 0;
          if (Number.isFinite(hour) && hour >= 0 && hour < 24) {
            map[hour] = (map[hour] || 0) + count;
          }
        });
        return Array.from({ length: 24 }, (_, i) => ({ hour: i, count: map[i] || 0 }));
      }

      // ✅ Caso de eventos con timestamp o fecha
      if (looksLikeEventsWithTimestamps) {
        const map = {};

        hourly_activity.forEach(ev => {
          const dateStr = ev?.timestamp ?? ev?.created_at ?? ev?.analyzed_at ?? ev?.date;
          let d = null;

          // Normalizar y parsear según formato
          if (typeof dateStr === 'number') {
            d = new Date(dateStr);
          } else if (typeof dateStr === 'string') {
            const s = dateStr.trim();

            // Si incluye Z o un offset explícito (+hh:mm o -hh:mm), usar directamente (UTC→local automático)
            if (/[Zz]|[+-]\d{2}:?\d{2}$/.test(s)) {
              d = new Date(s);
            }
            // Formato común sin zona "YYYY-MM-DD HH:mm:ss" → interpretar como local
            else if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(s)) {
              const [datePart, timePart] = s.split(' ');
              const [Y, M, D] = datePart.split('-').map(Number);
              const [h, m, sec] = timePart.split(':').map(Number);
              d = new Date(Y, M - 1, D, h, m, sec);
            }
            // Formato ISO sin zona "YYYY-MM-DDTHH:mm:ss" → interpretar como local
            else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(s)) {
              const [datePart, timePart] = s.split('T');
              const [Y, M, D] = datePart.split('-').map(Number);
              const [h, m, sec] = timePart.split(':').map(Number);
              d = new Date(Y, M - 1, D, h, m, sec);
            } else {
              // fallback: dejar que Date() intente interpretarlo (puede variar entre navegadores)
              d = new Date(s);
            }
          } else if (ev?.date instanceof Date) {
            d = ev.date;
          }

          if (d && !isNaN(d.getTime())) {
            const localHour = d.getHours();

            // Per-event debug removed in production

            if (Number.isFinite(localHour) && localHour >= 0 && localHour < 24) {
              map[localHour] = (map[localHour] || 0) + 1;
            }
          } else {
            // fallback: si no hay fecha válida pero hay campo de hora explícito
            const hour = Number(ev?.hour ?? ev?.h ?? ev?.hora ?? -1);
            if (Number.isFinite(hour) && hour >= 0 && hour < 24) {
              map[hour] = (map[hour] || 0) + 1;
            }
          }
        });

        return Array.from({ length: 24 }, (_, i) => ({ hour: i, count: map[i] || 0 }));
      }
    }

    // Caso de objeto simple tipo {0:2, 1:0, ...}
    if (typeof hourly_activity === 'object') {
      return Array.from({ length: 24 }, (_, i) => ({ hour: i, count: Number(hourly_activity[i]) || 0 }));
    }

    // Fallback vacío
    return Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 }));
  };

    // debug logging removed — production build should not log hourly internals
  
  const formatWeekLabel = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now - date;
    const diffWeeks = Math.floor(diffTime / (7 * 24 * 60 * 60 * 1000));
    
    if (diffWeeks === 0) return 'Esta semana';
    if (diffWeeks === 1) return 'Semana pasada';
    return `Hace ${diffWeeks} semanas`;
  };

  const calculatePositivePercentage = () => {
    if (!stats) return 0;
    const total = stats.positive_negative_balance.positive + stats.positive_negative_balance.negative;
    if (total === 0) return 50; // Neutral cuando no hay datos
    return Math.round((stats.positive_negative_balance.positive / total) * 100);
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

  const mostFrequentColors = getEmotionColor(stats.most_frequent_emotion);

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
            <div className="stat-value">{stats.total_analyses}</div>
            <div className="stat-label">Análisis Totales</div>
          </GlassCard>

          {stats.most_frequent_emotion && (
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
                  {getEmotionEmoji(stats.most_frequent_emotion)}
                </span>
              </div>
              <div className="stat-value">{getEmotionLabel(stats.most_frequent_emotion)}</div>
              <div className="stat-label">Emoción Más Frecuente</div>
            </GlassCard>
          )}

          <GlassCard variant="blue" className="stat-card">
            <div className="stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
              </svg>
            </div>
            <div className="stat-value">{Math.round(stats.average_confidence * 100)}%</div>
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
              {stats.emotions_distribution
                .sort((a, b) => b.count - a.count)
                .map((emotionStat) => {
                  const colors = getEmotionColor(emotionStat.emotion);
                  
                  return (
                    <div key={emotionStat.emotion} className="emotion-bar-item">
                      <div className="emotion-bar-header">
                        <div className="emotion-bar-label">
                          <span className="emotion-bar-emoji">{getEmotionEmoji(emotionStat.emotion)}</span>
                          <span className="emotion-bar-name">{getEmotionLabel(emotionStat.emotion)}</span>
                        </div>
                        <div className="emotion-bar-count">{emotionStat.count}</div>
                      </div>
                      <div className="emotion-bar-container">
                        <div 
                          className="emotion-bar-fill"
                          style={{
                            width: `${emotionStat.percentage}%`,
                            background: colors.gradient
                          }}
                        >
                          <span className="bar-percentage">{Math.round(emotionStat.percentage)}%</span>
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
              {(() => {
                const weekly = getWeeklyData(stats.weekly_activity);
                const counts = weekly.map(d => d.count || 0);
                const maxCount = counts.length > 0 ? Math.max(...counts) : 0;

                return weekly.map((dayData, index) => {
                  const count = dayData.count || 0;
                  const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
                  // If count is zero, give a slightly larger default so the "0" fits inside the bar
                  const displayPct = count === 0 ? 12 : Math.max(height, 5);

                  return (
                    <div key={index} className="day-column">
                      <div 
                        className="day-bar"
                        style={{ height: `${displayPct}%` }}
                        data-count={count}
                        title={`${count} análisis`}
                      >
                        <span className="bar-value">{count}</span>
                      </div>
                      <div className="day-label">{dayData.day || `Día ${index + 1}`}</div>
                    </div>
                  );
                });
              })()}
            </div>
          </GlassCard>

          {/* Análisis por hora del día */}
          <GlassCard variant="default" className="hourly-analysis-card">
            <h3 className="card-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              Análisis a la Semana por Hora del Día 
            </h3>
            
            <div className="hourly-chart">
              {(() => {
                const hourly = getHourlyData(stats.hourly_activity);
                const counts = hourly.map(h => h.count || 0);
                const maxCount = counts.length > 0 ? Math.max(...counts) : 0;

                return hourly.map((hourData, index) => {
                  const count = hourData.count || 0;
                  const hour = hourData.hour ?? index;
                  const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
                  // show a slightly larger default for zero values so the "0" label fits
                  const displayPct = count === 0 ? 12 : Math.max(height, 5);

                  return (
                    <div key={index} className="hour-column">
                      <div 
                        className="hour-bar"
                        style={{ height: `${displayPct}%` }}
                        data-count={count}
                        title={`${count} análisis a las ${hour.toString().padStart(2,'0')}:00`}
                      >
                        <span className="bar-value">{count}</span>
                      </div>
                      <div className="hour-label">
                        {hour.toString().padStart(2, '0')}:00
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </GlassCard>

          {/* NUEVA: Emociones positivas vs negativas */}
          <GlassCard variant="default" className="positive-negative-card">
            <h3 className="card-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
              </svg>
              Balance Emocional
            </h3>
            
            <div className="balance-chart">
              <div className="balance-item">
                <div className="balance-circle positive-circle">
                  <div className="balance-count">{stats.positive_negative_balance.positive}</div>
                  <div className="balance-label">Positivas</div>
                </div>
              </div>
              
              <div className="balance-vs">VS</div>
              
              <div className="balance-item">
                <div className="balance-circle negative-circle">
                  <div className="balance-count">{stats.positive_negative_balance.negative}</div>
                  <div className="balance-label">Negativas</div>
                </div>
              </div>
            </div>
            
            <div className="balance-summary">
              <div className="balance-percentage">
                {calculatePositivePercentage()}% emociones positivas
              </div>
            </div>
          </GlassCard>

          {/* NUEVA: Emociones por semana */}
          <GlassCard variant="default" className="weekly-emotions-card">
            <h3 className="card-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
                <path d="m9 11 2 2 4-4"></path>
              </svg>
              Emociones por Semana
            </h3>
            
            <div className="weekly-emotions-chart">
              {stats.weekly_emotions.length > 0 ? (
                stats.weekly_emotions.map((weekData, index) => (
                  <div key={index} className="week-row">
                    <div className="week-label">
                      {formatWeekLabel(weekData.week_start)}
                    </div>
                    <div className="week-emotions">
                      {Object.entries(weekData.emotions).map(([emotion, count]) => {
                        const colors = getEmotionColor(emotion);
                        const size = Math.min(Math.max(count * 4 + 8, 8), 24); // Min 8px, max 24px
                        
                        return (
                          <div
                            key={emotion}
                            className="emotion-dot"
                            style={{
                              backgroundColor: colors.primary,
                              width: `${size}px`,
                              height: `${size}px`
                            }}
                            title={`${getEmotionLabel(emotion)}: ${count}`}
                          >
                            <div className="emotion-tooltip">
                              {getEmotionEmoji(emotion)} {getEmotionLabel(emotion)}: {count}
                            </div>
                          </div>
                        );
                      })}
                      {Object.keys(weekData.emotions).length === 0 && (
                        <span style={{ color: '#999', fontStyle: 'italic' }}>
                          Sin análisis esta semana
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', color: '#999', padding: '2rem' }}>
                  No hay datos suficientes para mostrar la evolución semanal
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;