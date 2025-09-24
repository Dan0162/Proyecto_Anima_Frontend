import React, { useState, useEffect } from 'react';
import './navbar.css';
import Button from './Button';
import { LOGO_SRC } from '../constants/assets';
import { Link, useLocation, useNavigate } from 'react-router-dom';

function Navbar() {
  const [open, setOpen] = useState(false);

  const toggle = () => setOpen((s) => !s);

  const location = useLocation();
  const navigate = useNavigate();

  const isAuthenticatedArea = location && location.pathname && location.pathname.startsWith('/home');

  const handleLogoff = () => {
    // remove token and redirect to signin
    localStorage.removeItem('access_token');
    navigate('/signin');
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <nav className="navbar" aria-label="Main navigation">
      <div className="navdiv">
        <div className="left-group">
          <div className="logo">
            <Button className="logo-btn" aria-label="Anima home" to="/">
              <img src={LOGO_SRC} alt="Anima logo" />
            </Button>
          </div>
          <ul className="navlist">
            <li><Link to="/home">Inicio</Link></li>
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
            {isAuthenticatedArea ? (
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
      {/* Mobile full-width dropdown (contains nav + actions) */}
      {/* Backdrop - only present when mobile menu open */}
      <div
        className={`mobile-backdrop ${open ? 'open' : ''}`}
        onClick={() => setOpen(false)}
        aria-hidden={!open}
      />

      <div className={`mobile-dropdown ${open ? 'open' : ''}`} aria-hidden={!open}>
        <ul className="mobile-nav">
          <li><Link to="/" onClick={() => setOpen(false)}>Home</Link></li>
          <li><Link to="/about" onClick={() => setOpen(false)}>About</Link></li>
          <li><Link to="/contact" onClick={() => setOpen(false)}>Contact</Link></li>
        </ul>
        <div className="mobile-actions">
          {isAuthenticatedArea ? (
            <>
              <Button to="/home/account" className="account" onClick={() => setOpen(false)}>Account</Button>
              <button className="btn logoff" onClick={() => { setOpen(false); handleLogoff(); }}>Log off</button>
            </>
          ) : (
            <>
              <Button to="/signin" className="signin" onClick={() => setOpen(false)}>Sign In</Button>
              <Button to="/signup" className="signup" onClick={() => setOpen(false)}>Sign Up</Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;