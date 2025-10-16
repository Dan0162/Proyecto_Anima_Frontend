import React from 'react';
import { Link } from 'react-router-dom';

// A lightweight shared Button component that mirrors the navbar button look
// Props: children, className, to (for internal nav), onClick, type
export default function Button({ children, className = '', to, onClick, type = 'button', ...rest }) {
  const classes = `btn ${className}`.trim();
  if (to) {
    return (
      <Link to={to} className={classes} onClick={onClick} {...rest}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} onClick={onClick} {...rest}>
      {children}
    </button>
  );
}
