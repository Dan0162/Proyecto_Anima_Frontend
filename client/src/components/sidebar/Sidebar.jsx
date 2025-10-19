import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCurrentUser } from '../../hooks/useAuth';
import './Sidebar.css';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Obtener el usuario autenticado actual
  const { user, loading: userLoading, error: userError } = useCurrentUser();
  
  // Mostrar el nombre del usuario o un placeholder mientras carga
  const displayName = user?.nombre || 'Usuario';

  const toggleSidebar = () => setIsOpen(!isOpen);

  const handleLogout = () => {
    // Limpiar localStorage y redirigir al login
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_name'); // Por si acaso también existe esto
    navigate('/signin');
  };

  const menuItems = [
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
           <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
           <circle cx="12" cy="13" r="4"></circle>
        </svg>
      ),
      label: 'Analizar',
      path: '/home/analyze'
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
    ),
      label: 'Perfil',
      path: '/home/account'
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
      ),
      label: 'Historial',
      path: '/home/history'
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 18V5l12-2v13"></path>
          <circle cx="6" cy="18" r="3"></circle>
          <circle cx="18" cy="16" r="3"></circle>
        </svg>
      ),
      label: 'Recomendaciones',
      path: '/home/recommendations'
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
        </svg>
      ),
      label: 'Dashboard',
      path: '/home/dashboard'
    }
  ];

  return (
    <>
      {/* Toggle Button - Hamburguesa */}
      <button 
        className={`sidebar-toggle glass ${isOpen ? 'open' : ''}`}
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
      >
        <span className="bar"></span>
        <span className="bar"></span>
        <span className="bar"></span>
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="sidebar-backdrop" 
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar glass-lilac ${isOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-avatar glass-pink">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <h3 className="sidebar-username">{displayName}</h3>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {menuItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={index}
                to={item.path}
                className={`sidebar-item glass ${isActive ? 'active' : ''}`}
                onClick={() => setIsOpen(false)}
              >
                <span className="sidebar-icon">{item.icon}</span>
                <span className="sidebar-label">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer - Cerrar sesión */}
        <div className="sidebar-footer">
          <button className="sidebar-logout glass" onClick={handleLogout}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;