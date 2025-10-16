import React from 'react';
import './GlassCard.css';

/**
 * GlassCard - Componente reutilizable con efecto liquid glass
 * 
 * @param {string} variant - Color variant (lilac, pink, blue, salmon)
 * @param {string} className - Clases CSS adicionales
 * @param {boolean} floating - Activar animación flotante
 * @param {boolean} glow - Activar efecto glow pulsante
 * @param {React.ReactNode} children - Contenido del card
 */
const GlassCard = ({ 
  variant = 'default', 
  className = '', 
  floating = false,
  glow = false,
  onClick,
  style = {},
  children,
  ...rest 
}) => {
  const variantClass = variant !== 'default' ? `glass-${variant}` : '';
  const floatingClass = floating ? 'floating' : '';
  const glowClass = glow ? 'pulse-glow' : '';
  
  const classes = [
    'glass-card',
    variantClass,
    floatingClass,
    glowClass,
    className
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={classes} 
      onClick={onClick}
      style={style}
      {...rest}
    >
      {children}
    </div>
  );
};

export default GlassCard;

