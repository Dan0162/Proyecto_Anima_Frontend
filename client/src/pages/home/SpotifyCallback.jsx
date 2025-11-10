// client/src/pages/home/SpotifyCallback.jsx
import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFlash } from '../../components/flash/FlashContext';

/**
 * Invisible component that handles Spotify OAuth callback
 * Redirects immediately after processing the callback
 */
const SpotifyCallback = () => {
  const navigate = useNavigate();
  const processedRef = useRef(false);
  const flash = useFlash();

  // Manejar callback de Spotify
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const state = params.get('state');
    const err = params.get('error');
    const show = flash?.show;

    // If there's an error from backend/Spotify, surface it and redirect
    if (err && !processedRef.current) {
      processedRef.current = true;
      localStorage.removeItem('spotify_state');
      if (show) {
        const msg = err === 'token_exchange_failed' ?
          'No se pudo conectar con Spotify (intercambio de token falló). Intenta de nuevo.' :
          `Error de Spotify: ${err}`;
        show(msg, 'error', 5000);
      }
      
      // Redirect to account page
      const dest = sessionStorage.getItem('return_to') || '/home/account';
      sessionStorage.removeItem('return_to');
      navigate(dest, { replace: true });
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
            show('✅ Conectado a Spotify exitosamente', 'success', 4000);
          }

          // Redirect back to where the flow started (default to account)
          let dest = '/home/account';
          try {
            const stored = sessionStorage.getItem('return_to');
            if (stored) {
              dest = stored;
              // Clean up the stored path
              sessionStorage.removeItem('return_to');
            }
          } catch (_) {}
          
          // Navigate immediately
          navigate(dest, { replace: true });

        } catch (err) {
          localStorage.removeItem('spotify_state');
          if (show) {
            show('No se pudo conectar con Spotify (intercambio falló)', 'error', 5000);
          }
          
          // Redirect to account page on error
          const dest = sessionStorage.getItem('return_to') || '/home/account';
          sessionStorage.removeItem('return_to');
          navigate(dest, { replace: true });
        }
      })();

      return;
    }

    // If no state/error params, just redirect to account
    if (!state && !err && !processedRef.current) {
      processedRef.current = true;
      const dest = sessionStorage.getItem('return_to') || '/home/account';
      sessionStorage.removeItem('return_to');
      navigate(dest, { replace: true });
    }
  }, [navigate, flash]);

  // Show minimal loading state while processing
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      flexDirection: 'column',
      gap: '1rem'
    }}>
      <div style={{
        width: '50px',
        height: '50px',
        border: '4px solid rgba(195, 196, 250, 0.3)',
        borderTopColor: '#a1a2e6',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }}></div>
      <p style={{ color: '#4a5568', fontWeight: 500 }}>Conectando con Spotify...</p>
    </div>
  );
};

export default SpotifyCallback;