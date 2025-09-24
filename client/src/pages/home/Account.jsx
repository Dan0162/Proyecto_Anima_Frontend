import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useFlash } from '../../components/flash/FlashContext';

export default function Account() {
  const location = useLocation();
  const flash = useFlash();

  useEffect(() => {
    try {
      if (location && location.state && location.state.flash && flash && flash.show) {
        flash.show(location.state.flash, 'success', 4000);
      }
    } catch (e) {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="account-page" style={{padding: '2rem'}}>
      <h1>Perfil</h1>
      <p>En este apartado se mostrará la información correspondiente al usuario.</p>
    </div>
  );
}
