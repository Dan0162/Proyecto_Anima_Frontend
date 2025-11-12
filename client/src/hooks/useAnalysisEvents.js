import { useState, useEffect } from 'react';

// Hook para exponer el último marcador de análisis.
// Escucha un evento `storage` en localStorage (útil entre pestañas)
// y un evento DOM personalizado `analysis:created` para notificaciones en la misma pestaña.
// La aplicación que crea un análisis debe establecer `localStorage.lastAnalysis`
// o despachar `window.dispatchEvent(new CustomEvent('analysis:created', { detail: value }))`.
export const useAnalysisEvents = () => {
  const readInitial = () => {
    try {
      return localStorage.getItem('lastAnalysis') || null;
    } catch (e) {
      return null;
    }
  };

  const [lastAnalysis, setLastAnalysis] = useState(readInitial);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'lastAnalysis') {
        setLastAnalysis(e.newValue);
      }
    };

    const onCustom = (e) => {
      const val = e?.detail ?? String(Date.now());
      setLastAnalysis(val);
      try { localStorage.setItem('lastAnalysis', val); } catch (err) {}
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener('analysis:created', onCustom);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('analysis:created', onCustom);
    };
  }, []);

  return { lastAnalysis };
};

export default useAnalysisEvents;
