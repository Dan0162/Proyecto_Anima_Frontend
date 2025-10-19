import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LOGO_SRC } from '../../constants/assets';
import './HomeNavbar.css';

const HomeNavbar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    navigate('/signin', {
      state: {
        flash: 'Sesión cerrada correctamente',
        flashType: 'success'
      }
    });
  };

  const navItems = [
    {
      path: '/home/analyze',
      label: 'Analizar',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
          <circle cx="12" cy="13" r="4"></circle>
        </svg>
      )
    },
    {
      path: '/home/account',
      label: 'Perfil',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      )
    },
    {
      path: '/home/history',
      label: 'Historial',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
      )
    },
    {
      path: '/home/recommendations',
      label: 'Recomendaciones',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 18V5l12-2v13"></path>
          <circle cx="6" cy="18" r="3"></circle>
          <circle cx="18" cy="16" r="3"></circle>
        </svg>
      )
    },
    {
      path: '/home/dashboard',
      label: 'Dashboard',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
        </svg>
      )
    }
  ];

  return (
    <nav className="home-navbar glass-lilac">
      <div className="home-navbar-content">
        {/* Logo */}
        <Link to="/home" className="home-navbar-logo">
          <img src={LOGO_SRC} alt="Ánima" />
        </Link>

        {/* Navigation Items */}
        <div className="home-navbar-items">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`home-navbar-item ${isActive ? 'active' : ''}`}
              >
                <span className="navbar-item-icon">{item.icon}</span>
                <span className="navbar-item-label">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Logout Button */}
        <button className="home-navbar-logout glass" onClick={handleLogout}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          <span>Cerrar sesión</span>
        </button>
      </div>
    </nav>
  );
};

export default HomeNavbar;