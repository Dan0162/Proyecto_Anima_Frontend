import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../layout/GlassCard';
import './PhotoUpload.css';

const PhotoUpload = ({ onUpload, onCancel }) => {
  const navigate = useNavigate();
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);
  
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    // Validar tipo de archivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Por favor, sube una imagen válida (JPG, PNG o WebP)');
      return false;
    }

    // Validar tamaño (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('La imagen es demasiado grande. Máximo 5MB.');
      return false;
    }

    setError(null);
    return true;
  };

  const handleFileSelect = (file) => {
    if (!validateFile(file)) return;

    setSelectedPhoto(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const clearSelection = () => {
    setSelectedPhoto(null);
    setPreviewUrl(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const confirmUpload = async () => {
    if (!previewUrl) return;
    try {
      // Check Spotify connection status using server-issued JWT
      const jwt = localStorage.getItem('spotify_jwt');
      let connected = false;
      if (!jwt) {
        // Not connected
        connected = false;
      } else {
        const res = await fetch('http://127.0.0.1:8000/v1/auth/spotify/status', {
          headers: {
            'Authorization': `Bearer ${jwt}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          connected = !!data.connected;
        }
      }
      if (!connected) {
        // Persist pending analyze data and send user to connect prompt
        try {
          sessionStorage.setItem('pending_analyze_photo', previewUrl);
          sessionStorage.setItem('return_to', '/home/analyze');
          sessionStorage.setItem('connect_reason', 'analyze');
        } catch (_) {}
        navigate('/home/spotify-connect');
        return;
      }
      // If connected, proceed with upload/analyze
      onUpload(previewUrl);
    } catch (e) {
      // Fail safe: continue upload
      onUpload(previewUrl);
    }
  };

  return (
    <div className="photo-upload">
      <GlassCard variant="blue" className="upload-container">
        
        {/* Header */}
        <div className="upload-header">
          <h2 className="upload-title">
            {previewUrl ? 'Vista previa' : 'Sube tu foto'}
          </h2>
          <button 
            className="upload-close glass"
            onClick={onCancel}
            aria-label="Cerrar"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Upload Area */}
        <div className="upload-view">
          {previewUrl ? (
            // Preview
            <div className="upload-preview">
              <img 
                src={previewUrl} 
                alt="Foto seleccionada" 
                className="preview-image"
              />
            </div>
          ) : (
            // Drop Zone
            <div
              className={`upload-dropzone glass ${isDragging ? 'dragging' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={openFileDialog}
            >
              <div className="dropzone-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
              </div>
              
              <h3 className="dropzone-title">
                {isDragging ? '¡Suelta la imagen aquí!' : 'Arrastra tu foto aquí'}
              </h3>
              
              <p className="dropzone-subtitle">
                o haz clic para seleccionar
              </p>
              
              <p className="dropzone-hint">
                JPG, PNG o WebP • Máx. 5MB
              </p>
            </div>
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileInput}
            style={{ display: 'none' }}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="upload-error glass">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <p>{error}</p>
          </div>
        )}

        {/* File Info */}
        {selectedPhoto && !error && (
          <div className="upload-info glass">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
              <polyline points="13 2 13 9 20 9"></polyline>
            </svg>
            <div className="file-details">
              <p className="file-name">{selectedPhoto.name}</p>
              <p className="file-size">
                {(selectedPhoto.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="upload-controls">
          {previewUrl ? (
            <>
              <button 
                className="upload-button secondary glass"
                onClick={clearSelection}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="1 4 1 10 7 10"></polyline>
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                </svg>
                Cambiar foto
              </button>
              <button 
                className="upload-button primary glass-lilac"
                onClick={confirmUpload}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Continuar
              </button>
            </>
          ) : (
            <button 
              className="upload-button browse glass-pink"
              onClick={openFileDialog}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Seleccionar archivo
            </button>
          )}
        </div>
      </GlassCard>
    </div>
  );
};

export default PhotoUpload;




