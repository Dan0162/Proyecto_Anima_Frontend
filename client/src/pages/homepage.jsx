import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Homepage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirigir automáticamente a la página de análisis
    navigate('/home/analyze');
  }, [navigate]);

  return null;
}

export default Homepage;