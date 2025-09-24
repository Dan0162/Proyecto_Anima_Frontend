import './homepage.css';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useFlash } from '../components/flash/FlashContext';

function Homepage() {
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
    <div className="homepage">
      <h1>Bienvenido a la Homepage</h1>
      <p>Esta es la pagina principal de la aplicación.</p>
    </div>
  );
}

export default Homepage;