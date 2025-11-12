import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../../components/sidebar/Sidebar';
import GlassCard from '../../components/layout/GlassCard';
import Input from '../../components/ui/Input';
import PasswordInput from '../../components/ui/PasswordInput';
import { useCurrentUser } from '../../hooks/useAuth';
import { useFlash } from '../../components/flash/FlashContext';
import { updateUserProfileApi, changePasswordApi, logoutApi } from '../../utils/enhancedApi';
import './Account.css';
import { getUserProfileStats } from '../../utils/analyticsApi';

export default function Account() {
  // Maneja cambios en los inputs del perfil
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // Maneja cambios en los inputs de la contraseña
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value
    }));
  };
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
  const [profileErrors, setProfileErrors] = useState({});
  const [profileStats, setProfileStats] = useState({
  totalAnalyses: 0,
  streak: 0,
  mostFrequentEmotion: null
});
  
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
        const flashType = location.state.flashType || 'success';
        flash.show(location.state.flash, flashType, 4000);
        // Clear the flash from location state to prevent re-show on refresh
        const cleanState = { ...location.state };
        delete cleanState.flash;
        delete cleanState.flashType;
        navigate(location.pathname, { state: cleanState, replace: true });
      }
    } catch (e) {
      // ignore
    }
  }, [location, flash, navigate]);

  useEffect(() => {
    if (user) {
      setFormData({
        nombre: user.nombre || '',
        email: user.email || ''
      });
    }
  }, [user]);

  // Fetch Spotify connection status - check periodically to detect external changes
  useEffect(() => {
    let mounted = true;
    let intervalId;

    const checkStatus = async () => {
      try {
        const jwt = localStorage.getItem('spotify_jwt');
        if (!jwt) {
          if (mounted) setSpotifyConnected(false);
          return;
        }
        const res = await fetch('http://127.0.0.1:8000/v1/auth/spotify/status', {
          headers: { 'Authorization': `Bearer ${jwt}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (mounted) setSpotifyConnected(!!data.connected);
        } else if (res.status === 401) {
          // Invalid token: remove and force re-connect
          if (mounted) {
            localStorage.removeItem('spotify_jwt');
            setSpotifyConnected(false);
          }
        }
      } catch (e) {
        // ignore
      }
    };

    

    // Check immediately on mount
    // If we just returned from Spotify callback with state
    if (location?.state?.spotifyConnected) {
      setSpotifyConnected(true);
      checkStatus();
    } else {
      checkStatus();
    }

    // Check every 30 seconds to detect external disconnections
    intervalId = setInterval(checkStatus, 30000);

    return () => {
      mounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [location?.state?.spotifyConnected]);

  // Cargar estadísticas del perfil
    useEffect(() => {
      const loadProfileStats = async () => {
        try {
          const stats = await getUserProfileStats();
          setProfileStats(stats);
        } catch (error) {
          console.error('Error loading profile stats:', error);
          // Keep default values on error
        }
      };
      
      if (user) {
        loadProfileStats();
      }
    }, [user]);

  const validateProfile = () => {
    const errors = {};
    if (!formData.nombre || formData.nombre.trim().length === 0) {
      errors.nombre = 'El nombre es obligatorio';
    }
    if (!formData.email || formData.email.trim().length === 0) {
      errors.email = 'El correo es obligatorio';
    } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(formData.email)) {
      errors.email = 'Correo electrónico inválido';
    }
    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateProfile()) return;
    setProfileLoading(true);
    setProfileErrors({});
    try {
      const prevEmail = user?.email;
      await updateUserProfileApi({
        nombre: formData.nombre,
        email: formData.email
      });
      if (flash?.show) {
        flash.show('Perfil actualizado exitosamente', 'success', 3000);
      }
      setIsEditing(false);
      // Si el email cambió, forzar logout y redirigir a login
      if (prevEmail && prevEmail !== formData.email) {
        localStorage.removeItem('access_token');
        setTimeout(() => {
          navigate('/signin', {
            state: {
              flash: 'Tu correo ha sido actualizado. Por favor, inicia sesión nuevamente.',
              flashType: 'success'
            }
          });
        }, 1000);
        return;
      }
      // Si no cambió el email, recargar usuario si hook lo permite
      if (typeof window !== 'undefined') window.location.reload();
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
      // Show backend errors inline
      if (error.message && error.message.includes('email')) {
        setProfileErrors(prev => ({ ...prev, email: error.message }));
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

  const handleLogout = async () => {
    try {
      await logoutApi();
      // session_id is cleared in logoutApi
      navigate('/signin', {
        state: {
          flash: 'Sesión cerrada correctamente',
          flashType: 'success'
        }
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Navigate anyway even if API call fails
      navigate('/signin');
    }
  }

  const handleConnectSpotify = () => {
    const state = Math.random().toString(36).substring(7);
    localStorage.setItem('spotify_state', state);
    
    // Save current location to return here after Spotify auth
    try {
      sessionStorage.setItem('return_to', '/home/account');
    } catch (e) {
      console.warn('Could not save return path:', e);
    }
    
    window.location.href = `http://127.0.0.1:8000/v1/auth/spotify?state=${state}`;
  };

  const handleDisconnectSpotify = async () => {
    try {
      const jwt = localStorage.getItem('spotify_jwt');
      const res = await fetch('http://127.0.0.1:8000/v1/auth/spotify/disconnect', {
        method: 'POST',
        headers: jwt ? { 'Authorization': `Bearer ${jwt}` } : {}
      });
      if (res.ok) {
        // Remove client-side stored JWT
        localStorage.removeItem('spotify_jwt');
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
                <div className="stat-value">{profileStats.totalAnalyses || profileStats.total_analyses || 0}</div>
                <div className="stat-label">Análisis</div>
              </div>
              <div className="profile-stat">
                <div className="stat-value">{profileStats.streak || 0}</div>
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
                error={profileErrors.nombre}
              />
              <Input
                label="Correo Electrónico"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={!isEditing}
                className={isEditing ? 'editing' : ''}
                error={profileErrors.email}
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
