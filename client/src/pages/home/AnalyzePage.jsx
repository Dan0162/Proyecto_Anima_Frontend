import React from 'react';
import Sidebar from '../../components/sidebar/Sidebar';
import EmotionAnalyzer from '../../components/emotion/EmotionAnalyzer';
import './AnalyzePage.css';

const AnalyzePage = () => {
  return (
    <div className="analyze-page gradient-bg">
      {/* Sidebar con menú desplegable */}
      <Sidebar />

      {/* Contenido principal */}
      <div className="analyze-content">
        <EmotionAnalyzer />
      </div>
    </div>
  );
};

export default AnalyzePage;