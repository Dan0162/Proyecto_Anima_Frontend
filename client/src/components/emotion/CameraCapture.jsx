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

  // 🔧 CORRECCIÓN: Actualizar videoRef cuando el stream cambia
  useEffect(() => {
    if (stream && videoRef.current && !capturedPhoto) {
      videoRef.current.srcObject = stream;
      // Asegurar que el video se reproduzca
      videoRef.current.play().catch(err => {
        console.error('Error playing video:', err);
      });
    } else if (capturedPhoto && videoRef.current) {
      // Asegurar que el video se detenga completamente cuando hay foto capturada
      videoRef.current.srcObject = null;
    }
  }, [stream, capturedPhoto]);

  const startCamera = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Detener stream anterior si existe
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      
      console.log('✅ Cámara iniciada correctamente');
      setStream(mediaStream);
      setIsLoading(false);
    } catch (err) {
      console.error('❌ Error accessing camera:', err);
      setError('No se pudo acceder a la cámara. Por favor, verifica los permisos.');
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    console.log('🛑 Deteniendo cámara');
    
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
        console.log(`Track detenido: ${track.kind}`);
      });
      setStream(null);
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.pause();
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      console.error('❌ Referencias no disponibles');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Verificar que el video esté listo
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      setError('El video aún no está listo. Intenta de nuevo.');
      return;
    }
    
    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw current video frame to canvas
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Get image data
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    
    console.log('📸 Foto capturada');
    
    // IMPORTANTE: Primero detener la cámara, LUEGO actualizar el estado
    stopCamera();
    
    // Pequeño delay para asegurar que los tracks se detengan antes de actualizar estado
    setTimeout(() => {
      setCapturedPhoto(imageData);
    }, 50);
  };

  const retakePhoto = () => {
    console.log('🔄 Retomando foto');
    setCapturedPhoto(null);
    // Pequeño delay para asegurar que el estado se actualice
    setTimeout(() => {
      startCamera();
    }, 100);
  };

  const confirmPhoto = () => {
    if (capturedPhoto) {
      console.log('✅ Foto confirmada');
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