// client/src/pages/home/SpotifyConnect.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../../components/layout/GlassCard';
import Sidebar from '../../components/sidebar/Sidebar';
import { useFlash } from '../../components/flash/FlashContext';

const SpotifyConnect = () => {
  const navigate = useNavigate();
  const [connecting, setConnecting] = useState(false);
  const startedRef = useRef(false);
  const processedRef = useRef(false);
  const flash = useFlash();

  const handleConnect = () => {
    setConnecting(true);
    // Generar state aleatorio para seguridad
    const state = Math.random().toString(36).substring(7);
    localStorage.setItem('spotify_state', state);
    
    // Redirigir a backend para OAuth
    window.location.href = `http://127.0.0.1:8000/v1/auth/spotify?state=${state}`;
  };

  // Manejar callback de Spotify
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const state = params.get('state');
    const err = params.get('error');
    const show = flash?.show;

    // If there's an error from backend/Spotify, surface it and do not auto-start
    if (err && !processedRef.current) {
      processedRef.current = true;
      localStorage.removeItem('spotify_state');
      if (show) {
        const msg = err === 'token_exchange_failed' ?
          'No se pudo conectar con Spotify (intercambio de token falló). Intenta de nuevo.' :
          `Error de Spotify: ${err}`;
        show(msg, 'error', 5000);
      }
      // Stay on this page to let user click "Conectar" nuevamente
      setConnecting(false);
      return;
    }

    // Handle successful callback exactly once: exchange state for server-signed JWT
    if (state && !processedRef.current) {
      processedRef.current = true;
      // Remove local marker
      localStorage.removeItem('spotify_state');

      // Exchange on the backend for a signed JWT that contains spotify tokens
      (async () => {
        try {
          const res = await fetch(`http://127.0.0.1:8000/v1/auth/spotify/exchange?state=${encodeURIComponent(state)}`);
          if (!res.ok) {
            throw new Error('No se pudo completar el intercambio de tokens');
          }
          const body = await res.json();
          const token = body?.spotify_jwt;
          if (!token) throw new Error('No se recibió token');

          // Store the jwt for later API calls (frontend will send it as Authorization)
          localStorage.setItem('spotify_jwt', token);

          if (show) {
            show('Conectado a Spotify exitosamente', 'success', 4000);
          }

          // Redirect back to where the flow started (default to analyze)
          let dest = '/home/analyze';
          try {
            const stored = sessionStorage.getItem('return_to');
            if (stored) dest = stored;
          } catch (_) {}
          navigate(dest, { replace: true });

        } catch (err) {
          localStorage.removeItem('spotify_state');
          if (show) {
            show('No se pudo conectar con Spotify (intercambio falló)', 'error', 5000);
          }
          setConnecting(false);
        }
      })();

      return;
    }
  }, [navigate, flash?.show]);

  return (
    <div className="spotify-connect-page gradient-bg">
      <Sidebar />
      
      <div className="spotify-content">
        <GlassCard variant="lilac" className="connect-card">
          <div className="spotify-icon">🎵</div>
          <h1>Conectar con Spotify</h1>
          <p>Para obtener recomendaciones musicales personalizadas</p>
          
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
            <button 
              className="upload-button primary glass-lilac"
              onClick={handleConnect}
              disabled={connecting}
            >
              {connecting ? 'Conectando...' : 'Conectar con Spotify'}
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default SpotifyConnect;