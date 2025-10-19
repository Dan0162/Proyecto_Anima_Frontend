import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../../components/sidebar/Sidebar';
import GlassCard from '../../components/layout/GlassCard';
import Input from '../../components/ui/Input';
import PasswordInput from '../../components/ui/PasswordInput';
import { useCurrentUser } from '../../hooks/useAuth';
import { useFlash } from '../../components/flash/FlashContext';
import { updateUserProfileApi, changePasswordApi } from '../../utils/api';
import './Account.css';

export default function Account() {
  const location = useLocation();
  const flash = useFlash();
  const navigate = useNavigate();
  const { user, loading: userLoading } = useCurrentUser();
  
  // Estados para edición de perfil
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    email: ''
  });
  const [profileLoading, setProfileLoading] = useState(false);
  
  // Estados para cambio de contraseña
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});
  
  // Estado de Spotify
  const [spotifyConnected, setSpotifyConnected] = useState(false);

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

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar errores al escribir
    if (passwordErrors[name]) {
      setPasswordErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSave = async () => {
    setProfileLoading(true);
    
    try {
      const response = await updateUserProfileApi({
        nombre: formData.nombre,
        email: formData.email
      });
      
      if (flash?.show) {
        flash.show('Perfil actualizado exitosamente', 'success', 3000);
      }
      
      setIsEditing(false);
      
      // Si el email cambió, actualizar el token podría ser necesario
      // Por ahora solo actualizamos el estado local
      
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      
      if (error.message.includes('Sesión expirada')) {
        if (flash?.show) {
          flash.show('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.', 'error', 4000);
        }
        setTimeout(() => navigate('/signin'), 2000);
        return;
      }
      
      if (flash?.show) {
        flash.show(error.message || 'Error al actualizar el perfil', 'error', 4000);
      }
    } finally {
      setProfileLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      nombre: user?.nombre || '',
      email: user?.email || ''
    });
    setIsEditing(false);
  };

  const validatePasswordChange = () => {
    const errors = {};
    
    if (!passwordData.current_password) {
      errors.current_password = 'La contraseña actual es requerida';
    }
    
    if (!passwordData.new_password) {
      errors.new_password = 'La nueva contraseña es requerida';
    } else if (passwordData.new_password.length < 8) {
      errors.new_password = 'Debe tener al menos 8 caracteres';
    }
    
    if (!passwordData.confirm_password) {
      errors.confirm_password = 'Confirma la nueva contraseña';
    } else if (passwordData.new_password !== passwordData.confirm_password) {
      errors.confirm_password = 'Las contraseñas no coinciden';
    }
    
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validatePasswordChange()) return;
    
    setPasswordLoading(true);
    
    try {
      await changePasswordApi({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      });
      
      if (flash?.show) {
        flash.show('Contraseña actualizada exitosamente', 'success', 3000);
      }
      
      // Limpiar formulario y cerrar diálogo
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      setShowPasswordDialog(false);
      
    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      
      if (error.message.includes('Sesión expirada')) {
        if (flash?.show) {
          flash.show('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.', 'error', 4000);
        }
        setTimeout(() => navigate('/signin'), 2000);
        return;
      }
      
      if (flash?.show) {
        flash.show(error.message || 'Error al cambiar la contraseña', 'error', 4000);
      }
    } finally {
      setPasswordLoading(false);
    }
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
              <Input
                label="Nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                disabled={!isEditing}
                className={isEditing ? 'editing' : ''}
              />
              
              <Input
                label="Correo Electrónico"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={!isEditing}
                className={isEditing ? 'editing' : ''}
              />

              {isEditing && (
                <div className="form-actions">
                  <button 
                    className="action-btn cancel"
                    onClick={handleCancel}
                    disabled={profileLoading}
                  >
                    Cancelar
                  </button>
                  <button 
                    className="action-btn save"
                    onClick={handleSave}
                    disabled={profileLoading}
                  >
                    {profileLoading ? 'Guardando...' : 'Guardar Cambios'}
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

              <button 
                className="action-item"
                onClick={() => setShowPasswordDialog(true)}
              >
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

        {/* Dialog para cambiar contraseña */}
        {showPasswordDialog && (
          <>
            <div 
              className="dialog-backdrop" 
              onClick={() => setShowPasswordDialog(false)}
            />
            <div className="password-dialog">
              <GlassCard variant="lilac" className="dialog-card">
                <div className="dialog-header">
                  <h2>Cambiar Contraseña</h2>
                  <button 
                    className="dialog-close"
                    onClick={() => setShowPasswordDialog(false)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
                
                <div className="dialog-content">
                  <PasswordInput
                    label="Contraseña Actual"
                    name="current_password"
                    value={passwordData.current_password}
                    onChange={handlePasswordChange}
                    error={passwordErrors.current_password}
                    placeholder="Tu contraseña actual"
                  />
                  
                  <PasswordInput
                    label="Nueva Contraseña"
                    name="new_password"
                    value={passwordData.new_password}
                    onChange={handlePasswordChange}
                    error={passwordErrors.new_password}
                    placeholder="Nueva contraseña segura"
                  />
                  
                  <PasswordInput
                    label="Confirmar Nueva Contraseña"
                    name="confirm_password"
                    value={passwordData.confirm_password}
                    onChange={handlePasswordChange}
                    error={passwordErrors.confirm_password}
                    placeholder="Repite la nueva contraseña"
                  />
                </div>
                
                <div className="dialog-actions">
                  <button 
                    className="action-btn cancel"
                    onClick={() => setShowPasswordDialog(false)}
                    disabled={passwordLoading}
                  >
                    Cancelar
                  </button>
                  <button 
                    className="action-btn save"
                    onClick={handleChangePassword}
                    disabled={passwordLoading}
                  >
                    {passwordLoading ? 'Cambiando...' : 'Cambiar Contraseña'}
                  </button>
                </div>
              </GlassCard>
            </div>
          </>
        )}
      </div>
    </div>
  );
}