import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/sidebar/Sidebar';
import EmotionAnalyzer from '../../components/emotion/EmotionAnalyzer';
import './AnalyzePage.css';

const AnalyzePage = () => {
  const [userName, setUserName] = useState('Usuario');

  // TODO: Obtener nombre del usuario desde el backend/localStorage
  useEffect(() => {
    // Ejemplo de cómo obtener el nombre del usuario
    const storedName = localStorage.getItem('user_name');
    if (storedName) {
      setUserName(storedName);
    }
  }, []);

  return (
    <div className="analyze-page gradient-bg">
      {/* Sidebar con menú desplegable */}
      <Sidebar userName={userName} />

      {/* Contenido principal */}
      <div className="analyze-content">
        <EmotionAnalyzer userName={userName} />
      </div>
    </div>
  );
};

export default AnalyzePage;