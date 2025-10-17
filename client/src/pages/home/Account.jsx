import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../../components/sidebar/Sidebar';
import GlassCard from '../../components/layout/GlassCard';
import { useCurrentUser } from '../../hooks/useAuth';
import { useFlash } from '../../components/flash/FlashContext';
import './Account.css';

export default function Account() {
  const location = useLocation();
  const flash = useFlash();
  const navigate = useNavigate();
  const { user, loading: userLoading } = useCurrentUser();
  const [isEditing, setIsEditing] = useState(false);
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    email: ''
  });

  useEffect(() => {
    try {
      if (location && location.state && location.state.flash && flash && flash.show) {
        flash.show(location.state.flash, 'success', 4000);
      }
    } catch (e) {
      // ignore
    }
  }, [location, flash]);

  useEffect(() => {
    if (user) {
      setFormData({
        nombre: user.nombre || '',
        email: user.email || ''
      });
    }
  }, [user]);

  // Fetch Spotify connection status
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/v1/auth/spotify/status', {
          credentials: 'include'
        });
        if (res.ok) {
          const data = await res.json();
          setSpotifyConnected(!!data.connected);
        }
      } catch (e) {
        // ignore
      }
    };
    checkStatus();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = () => {
    // TODO: Implementar actualización de perfil en backend
    console.log('Guardando cambios:', formData);
    if (flash?.show) {
      flash.show('Perfil actualizado exitosamente', 'success', 3000);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      nombre: user?.nombre || '',
      email: user?.email || ''
    });
    setIsEditing(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    navigate('/signin', {
      state: {
        flash: 'Sesión cerrada correctamente',
        flashType: 'success'
      }
    });
  };

  const handleConnectSpotify = () => {
    // Generate state and redirect directly to backend OAuth endpoint
    const state = Math.random().toString(36).substring(7);
    localStorage.setItem('spotify_state', state);
    window.location.href = `http://127.0.0.1:8000/v1/auth/spotify?state=${state}`;
  };

  const handleDisconnectSpotify = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/v1/auth/spotify/disconnect', {
        method: 'POST',
        credentials: 'include'
      });
      if (res.ok) {
        setSpotifyConnected(false);
        if (flash?.show) {
          flash.show('Desconectado de Spotify', 'success', 3000);
        }
      }
    } catch (e) {
      if (flash?.show) {
        flash.show('No se pudo desconectar de Spotify', 'error', 3000);
      }
    }
  };

  const handleRevokeSpotify = () => {
    // No hay endpoint oficial para revocar vía API; abrimos la página de apps de Spotify
    try {
      window.open('https://www.spotify.com/account/apps/', '_blank', 'noopener,noreferrer');
      if (flash?.show) {
        flash.show('Abriendo la página de Spotify para revocar acceso.', 'info', 5000);
      }
    } catch (_) {
      // fallback: navegar en la misma pestaña
      window.location.href = 'https://www.spotify.com/account/apps/';
    }
  };

  if (userLoading) {
    return (
      <div className="account-page gradient-bg">
        <Sidebar />
        <div className="account-content">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Cargando perfil...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="account-page gradient-bg">
      <Sidebar />
      
      <div className="account-content">
        <div className="account-header">
          <h1 className="account-title">Mi Perfil</h1>
          <p className="account-subtitle">Administra tu información personal</p>
        </div>

        <div className="account-grid">
          {/* Tarjeta de perfil principal */}
          <GlassCard variant="lilac" className="profile-card">
            <div className="profile-avatar">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            
            <div className="profile-name">{user?.nombre || 'Usuario'}</div>
            <div className="profile-email">{user?.email || 'email@ejemplo.com'}</div>

            <div className="profile-stats">
              <div className="profile-stat">
                <div className="stat-value">24</div>
                <div className="stat-label">Análisis</div>
              </div>
              <div className="profile-stat">
                <div className="stat-value">7</div>
                <div className="stat-label">Días activo</div>
              </div>
            </div>
          </GlassCard>

          {/* Tarjeta de información del perfil */}
          <GlassCard variant="pink" className="info-card">
            <div className="card-header">
              <h3 className="card-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                Información Personal
              </h3>
              {!isEditing && (
                <button 
                  className="edit-btn"
                  onClick={() => setIsEditing(true)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                  Editar
                </button>
              )}
            </div>

            <div className="info-form">
              <div className="form-group">
                <label className="form-label">Nombre</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`form-input ${isEditing ? 'editing' : ''}`}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Correo Electrónico</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`form-input ${isEditing ? 'editing' : ''}`}
                />
              </div>

              {isEditing && (
                <div className="form-actions">
                  <button 
                    className="action-btn cancel"
                    onClick={handleCancel}
                  >
                    Cancelar
                  </button>
                  <button 
                    className="action-btn save"
                    onClick={handleSave}
                  >
                    Guardar Cambios
                  </button>
                </div>
              )}
            </div>
          </GlassCard>

          {/* Tarjeta de configuración */}
          <GlassCard variant="blue" className="settings-card">
            <h3 className="card-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M12 1v6m0 6v6m10.66-9.5l-5.2 3m-5.2 3l-5.2 3M1.34 14.5l5.2-3m5.2-3l5.2-3"></path>
              </svg>
              Preferencias
            </h3>
            
            <div className="settings-list">
              <div className="setting-item">
                <div className="setting-info">
                  <div className="setting-name">Notificaciones</div>
                  <div className="setting-desc">Recibe actualizaciones por email</div>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" defaultChecked />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <div className="setting-name">Análisis Automático</div>
                  <div className="setting-desc">Guarda análisis automáticamente</div>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" defaultChecked />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <div className="setting-name">Modo Oscuro</div>
                  <div className="setting-desc">Activa el tema oscuro</div>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </GlassCard>

          {/* Tarjeta de acciones */}
          <GlassCard variant="salmon" className="actions-card">
            <h3 className="card-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                <path d="M2 17l10 5 10-5M2 12l10 5 10-5"></path>
              </svg>
              Acciones de Cuenta
            </h3>
            
            <div className="actions-list">
              {spotifyConnected ? (
                <button className="action-item" onClick={handleDisconnectSpotify}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"></path>
                    <path d="M7 11.5c2.5-1.5 5.5-1.5 8 0" />
                    <path d="M6.5 14.5c3-1.8 7-1.8 10 0" />
                  </svg>
                  <span>Desconectar Spotify</span>
                </button>
              ) : (
                <button className="action-item spotify" onClick={handleConnectSpotify}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"></path>
                    <path d="M7 11.5c2.5-1.5 5.5-1.5 8 0" />
                    <path d="M6.5 14.5c3-1.8 7-1.8 10 0" />
                  </svg>
                  <span>Conectar con Spotify</span>
                </button>
              )}
              <button className="action-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                <span>Descargar mis datos</span>
              </button>

              <button className="action-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                <span>Cambiar contraseña</span>
              </button>

              <button 
                className="action-item danger"
                onClick={handleLogout}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                <span>Cerrar sesión</span>
              </button>

            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}