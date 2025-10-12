import React, { useState, useRef, useEffect } from 'react';
import GlassCard from '../layout/GlassCard';
import './CameraCapture.css';

const CameraCapture = ({ onCapture, onCancel }) => {
  const [stream, setStream] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Iniciar cámara al montar
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      setIsLoading(true);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError(null);
      setIsLoading(false);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('No se pudo acceder a la cámara. Por favor, verifica los permisos.');
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw current video frame to canvas
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Get image data
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedPhoto(imageData);
    
    // Stop camera after capture
    stopCamera();
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
    startCamera();
  };

  const confirmPhoto = () => {
    if (capturedPhoto) {
      onCapture(capturedPhoto);
    }
  };

  const handleCancel = () => {
    stopCamera();
    onCancel();
  };

  return (
    <div className="camera-capture">
      <GlassCard variant="lilac" className="camera-container">
        
        {/* Header */}
        <div className="camera-header">
          <h2 className="camera-title">
            {capturedPhoto ? 'Vista previa' : 'Captura tu foto'}
          </h2>
          <button 
            className="camera-close glass"
            onClick={handleCancel}
            aria-label="Cerrar cámara"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Camera/Photo View */}
        <div className="camera-view">
          {error ? (
            <div className="camera-error glass">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <p>{error}</p>
              <button className="retry-button glass" onClick={startCamera}>
                Reintentar
              </button>
            </div>
          ) : isLoading ? (
            <div className="camera-loading glass">
              <div className="loading-spinner"></div>
              <p>Iniciando cámara...</p>
            </div>
          ) : capturedPhoto ? (
            <img 
              src={capturedPhoto} 
              alt="Foto capturada" 
              className="captured-image"
            />
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="camera-video"
              />
              <div className="camera-overlay">
                <div className="face-guide"></div>
              </div>
            </>
          )}
          
          {/* Hidden canvas for capture */}
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>

        {/* Instructions */}
        {!capturedPhoto && !error && !isLoading && (
          <p className="camera-instructions">
            Centra tu rostro en el óvalo y presiona capturar
          </p>
        )}

        {/* Controls */}
        <div className="camera-controls">
          {capturedPhoto ? (
            <>
              <button 
                className="camera-button secondary glass"
                onClick={retakePhoto}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="1 4 1 10 7 10"></polyline>
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                </svg>
                Tomar otra
              </button>
              <button 
                className="camera-button primary glass-blue"
                onClick={confirmPhoto}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Continuar
              </button>
            </>
          ) : (
            !error && !isLoading && (
              <button 
                className="camera-button capture glass-pink"
                onClick={capturePhoto}
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="10"></circle>
                </svg>
                Capturar
              </button>
            )
          )}
        </div>
      </GlassCard>
    </div>
  );
};

export default CameraCapture;