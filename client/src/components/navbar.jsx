import React, { useState, useEffect } from 'react';
import './navbar.css';
import Button from './Button';
import { LOGO_SRC } from '../constants/assets';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useFlash } from './flash/FlashContext'; // Importar useFlash
import { useTheme } from '../contexts/ThemeContext';
import tokenManager from '../utils/tokenManager';

function Navbar() {
  const [open, setOpen] = useState(false);
  // Initialize auth state immediately from localStorage to prevent flash
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const token = tokenManager.getAccessToken();
    const isExpired = tokenManager.isTokenExpired();
    // Only consider authenticated if token exists AND is not expired
    return !!(token && !isExpired);
  });
  const { isDarkMode, toggleTheme } = useTheme();

  const toggle = () => setOpen((s) => !s);

  const location = useLocation();
  const navigate = useNavigate();
  const flash = useFlash(); // Inicializar flash

  // Verificar autenticación basada en el token
  useEffect(() => {
    const checkAuth = () => {
      const token = tokenManager.getAccessToken();
      const isExpired = tokenManager.isTokenExpired();
      
      // If token exists but is expired, clear it
      if (token && isExpired) {
        console.log('🔒 Token expired, clearing authentication');
        tokenManager.clearAllTokens();
        setIsAuthenticated(false);
      } else {
        setIsAuthenticated(!!token);
      }
    };
    
    // Initial check
    checkAuth();
    
    // Escuchar cambios en el localStorage (por si se cierra sesión en otra pestaña)
    const handleStorageChange = () => {
      checkAuth();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleLogoff = () => {
    // Clear all tokens using tokenManager
    // Preserve the user's connected Spotify token so they don't need to reconnect on next login
    tokenManager.clearAllTokens(true);
    setIsAuthenticated(false);
    navigate('/', { 
      state: { 
        flash: 'Sesión cerrada correctamente.',
        flashType: 'success'
      } 
    });
  };

  // Función para manejar el clic en "Inicio"
  const handleHomeClick = (e) => {
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) {
      return; 
    }
    e.preventDefault();
    
    if (isAuthenticated) {
      navigate('/home');
    } else {
      navigate('/');
    }
    setOpen(false);
  };

  const getHomePath = () => {
    return isAuthenticated ? '/home' : '/';
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  // 👇 Lógica duplicada de SignInPage para mostrar flash
  useEffect(() => {
    try {
      if (location && location.state && location.state.flash && flash && flash.show) {
        const flashType = location.state.flashType || 'success';
        flash.show(location.state.flash, flashType, 4000);

        // Limpiar estado para que no se repita el mensaje
        const cleanState = { ...location.state };
        delete cleanState.flash;
        delete cleanState.flashType;
        navigate(location.pathname, { state: cleanState, replace: true });
      }
    } catch (e) {
      console.error('Error showing flash message:', e);
    }
  }, [location, flash, navigate]);

  return (
    <nav className="navbar" aria-label="Main navigation">
      <div className="navdiv">
        <div className="left-group">
          <div className="logo">
            <Button className="logo-btn" aria-label="Anima home" to={getHomePath()}>
              <img src={LOGO_SRC} alt="Anima logo" />
            </Button>
          </div>
          <ul className="navlist">
            <li>
              <Link 
                to={getHomePath()} 
                onClick={handleHomeClick}
                title={isAuthenticated ? "Ir al inicio" : "Ir a la página principal"}
              >
                Inicio
              </Link>
            </li>
            <li><Link to="/about">Sobre Nosotros</Link></li>
            <li><Link to="/contact">Contacto</Link></li>
          </ul>
        </div>

        <div className="right-group">
          <button
            className={`hamburger ${open ? 'open' : ''}`}
            aria-label="Toggle navigation"
            aria-expanded={open}
            onClick={toggle}
          >
            <span className="bar" />
            <span className="bar" />
            <span className="bar" />
          </button>
          <ul className="navlist actions">
            {isAuthenticated ? (
              <>
                <li><Button to="/home/account" className="account">Perfil</Button></li>
                <li>
                  <button 
                    className="btn theme-toggle-btn"
                    onClick={toggleTheme}
                    aria-label={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                    title={isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}
                    role="switch"
                    aria-checked={isDarkMode}
                  >
                    {isDarkMode ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="4"/>
                        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                      </svg>
                    )}
                  </button>
                </li>
                <li><button className="btn logoff" onClick={handleLogoff}>Cerrar sesión</button></li>
              </>
            ) : (
              <>
                <li><Button to="/signin" className="signin">Iniciar Sesión</Button></li>
                <li><Button to="/signup" className="signup">Registrarse</Button></li>
                <li>
                  <button 
                    className="btn theme-toggle-btn"
                    onClick={toggleTheme}
                    aria-label={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                    role="switch"
                    aria-checked={isDarkMode}
                  >
                    {isDarkMode ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="4"/>
                        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                      </svg>
                    )}
                  </button>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
      
      <div
        className={`mobile-backdrop ${open ? 'open' : ''}`}
        onClick={() => setOpen(false)}
        aria-hidden={!open}
      />

      <div className={`mobile-dropdown ${open ? 'open' : ''}`} aria-hidden={!open}>
        <ul className="mobile-nav">
          <li>
            <Link 
              to={getHomePath()} 
              onClick={(e) => {
                handleHomeClick(e);
                setOpen(false);
              }}
            >
              Inicio
            </Link>
          </li>
          <li><Link to="/about" onClick={() => setOpen(false)}>Sobre Nosotros</Link></li>
          <li><Link to="/contact" onClick={() => setOpen(false)}>Contacto</Link></li>
        </ul>
        <div className="mobile-actions">
          {isAuthenticated ? (
            <>
              <Button to="/home/account" className="account" onClick={() => setOpen(false)}>Perfil</Button>
              <button 
                className="btn theme-toggle-mobile"
                onClick={() => { toggleTheme(); setOpen(false); }}
                aria-label={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                role="switch"
                aria-checked={isDarkMode}
              >
                {isDarkMode ? (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width: '18px', height: '18px', marginRight: '8px'}}>
                      <circle cx="12" cy="12" r="4"/>
                      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
                    </svg>
                    Modo Claro
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width: '18px', height: '18px', marginRight: '8px'}}>
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                    </svg>
                    Modo Oscuro
                  </>
                )}
              </button>
              <button className="btn logoff" onClick={() => { setOpen(false); handleLogoff(); }}>Cerrar sesión</button>
            </>
          ) : (
            <>
              <Button to="/signin" className="signin" onClick={() => setOpen(false)}>Iniciar Sesión</Button>
              <Button to="/signup" className="signup" onClick={() => setOpen(false)}>Registrarse</Button>
              <button 
                className="btn theme-toggle-mobile"
                onClick={() => { toggleTheme(); setOpen(false); }}
                aria-label={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                role="switch"
                aria-checked={isDarkMode}
              >
                {isDarkMode ? (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width: '18px', height: '18px', marginRight: '8px'}}>
                      <circle cx="12" cy="12" r="4"/>
                      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
                    </svg>
                    Modo Claro
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width: '18px', height: '18px', marginRight: '8px'}}>
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                    </svg>
                    Modo Oscuro
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
