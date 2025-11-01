import React, { useState, useEffect } from 'react';
import './navbar.css';
import Button from './Button';
import { LOGO_SRC } from '../constants/assets';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useFlash } from './flash/FlashContext'; // Importar useFlash

function Navbar() {
  const [open, setOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const toggle = () => setOpen((s) => !s);

  const location = useLocation();
  const navigate = useNavigate();
  const flash = useFlash(); // Inicializar flash

  // Verificar autenticación basada en el token
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    setIsAuthenticated(!!token);
    
    // Escuchar cambios en el localStorage (por si se cierra sesión en otra pestaña)
    const handleStorageChange = () => {
      const newToken = localStorage.getItem('access_token');
      setIsAuthenticated(!!newToken);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const isAuthenticatedArea = location && location.pathname && location.pathname.startsWith('/home');

  const handleLogoff = () => {
    // remove token and redirect to signin
    localStorage.removeItem('access_token');
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
                <li><button className="btn logoff" onClick={handleLogoff}>Cerrar sesión</button></li>
              </>
            ) : (
              <>
                <li><Button to="/signin" className="signin">Iniciar Sesión</Button></li>
                <li><Button to="/signup" className="signup">Registrarse</Button></li>
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
              <button className="btn logoff" onClick={() => { setOpen(false); handleLogoff(); }}>Cerrar sesión</button>
            </>
          ) : (
            <>
              <Button to="/signin" className="signin" onClick={() => setOpen(false)}>Iniciar Sesión</Button>
              <Button to="/signup" className="signup" onClick={() => setOpen(false)}>Registrarse</Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
