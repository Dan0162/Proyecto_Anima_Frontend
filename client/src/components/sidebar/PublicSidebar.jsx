import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { LOGO_SRC } from '../../constants/assets';
import './PublicSidebar.css';

const PublicSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { isDarkMode, toggleTheme } = useTheme();

  const toggleSidebar = () => setIsOpen(!isOpen);

  const menuItems = [
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      ),
      label: 'Inicio',
      path: '/'
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"></path>
        </svg>
      ),
      label: 'Sobre Nosotros',
      path: '/about'
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
          <polyline points="22 6 12 13 2 6"></polyline>
        </svg>
      ),
      label: 'Contacto',
      path: '/contact'
    }
  ];

  const authItems = [
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
          <polyline points="10 17 15 12 10 7"></polyline>
          <line x1="15" y1="12" x2="3" y2="12"></line>
        </svg>
      ),
      label: 'Iniciar Sesión',
      path: '/signin',
      variant: 'signin'
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="8.5" cy="7" r="4"></circle>
          <line x1="20" y1="8" x2="20" y2="14"></line>
          <line x1="23" y1="11" x2="17" y2="11"></line>
        </svg>
      ),
      label: 'Registrarse',
      path: '/signup',
      variant: 'signup'
    }
  ];

  return (
    <>
      {/* Toggle Button - Hamburguesa */}
      <button 
        className={`public-sidebar-toggle glass ${isOpen ? 'open' : ''}`}
        onClick={toggleSidebar}
        aria-label="Toggle navigation menu"
      >
        <span className="bar"></span>
        <span className="bar"></span>
        <span className="bar"></span>
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="public-sidebar-backdrop" 
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`public-sidebar glass-lilac ${isOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="public-sidebar-header">
          <Link to="/" className="public-sidebar-logo-link" onClick={() => setIsOpen(false)}>
            <div className="public-sidebar-logo">
              <img src={LOGO_SRC} alt="Ánima Logo" className="public-sidebar-logo-img" />
            </div>
          </Link>
          <h3 className="public-sidebar-title">Ánima</h3>
        </div>

        {/* Navigation */}
        <nav className="public-sidebar-nav">
          {menuItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={index}
                to={item.path}
                className={`public-sidebar-item glass ${isActive ? 'active' : ''}`}
                onClick={() => setIsOpen(false)}
              >
                <span className="public-sidebar-icon">{item.icon}</span>
                <span className="public-sidebar-label">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Auth Section */}
        <div className="public-sidebar-auth">
          <div className="auth-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 12l2 2 4-4"></path>
              <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"></path>
              <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"></path>
            </svg>
            <span>Autenticación</span>
          </div>
          
          {authItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={index}
                to={item.path}
                className={`public-sidebar-item auth-item glass ${isActive ? 'active' : ''} ${item.variant}`}
                onClick={() => setIsOpen(false)}
              >
                <span className="public-sidebar-icon">{item.icon}</span>
                <span className="public-sidebar-label">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Footer - Theme Toggle */}
        <div className="public-sidebar-footer">
          <button 
            className="public-sidebar-item glass theme-toggle"
            onClick={toggleTheme}
            aria-label={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            title={isDarkMode ? 'Activar modo claro' : 'Activar modo oscuro'}
            role="switch"
            aria-checked={isDarkMode}
          >
            <span className="public-sidebar-icon" aria-hidden="true">
              {isDarkMode ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="4"/>
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
            </span>
            <span className="public-sidebar-label">
              {isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}
            </span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default PublicSidebar;