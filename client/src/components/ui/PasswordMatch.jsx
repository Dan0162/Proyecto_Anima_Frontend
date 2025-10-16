import React from 'react';
import './PasswordMatch.css';

/**
 * Password match validation component that shows whether passwords match
 * Only displays after user has finished typing (blur events)
 * 
 * @param {Object} props - Component props
 * @param {string} props.password - The primary password
 * @param {string} props.confirmPassword - The confirmation password
 * @param {boolean} props.showValidation - Whether to show the validation message
 * @param {boolean} props.wasBlurred - Whether the confirm password field was blurred
 */
const PasswordMatch = ({ 
  password, 
  confirmPassword, 
  showValidation = false,
  wasBlurred = false
}) => {
  // Only show validation if explicitly requested and the field was blurred
  if (!showValidation || !wasBlurred || !confirmPassword) {
    return null;
  }
  
  const passwordsMatch = password === confirmPassword;
  
  return (
    <div className={`password-match ${passwordsMatch ? 'match-valid' : 'match-invalid'}`}>
      {passwordsMatch ? (
        <div className="match-message match-success">
          <span className="match-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
            </svg>
          </span>
          <span>Passwords match</span>
        </div>
      ) : (
        <div className="match-message match-error">
          <span className="match-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </span>
          <span>Passwords don't match</span>
        </div>
      )}
    </div>
  );
};

export default PasswordMatch;