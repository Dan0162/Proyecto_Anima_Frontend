import React from 'react';
import './PasswordRequirements.css';

/**
 * Password requirements component that displays password validation rules with visual feedback
 * 
 * @param {Object} props - Component props
 * @param {Object} props.validations - Object containing validation states for each requirement
 * @param {boolean} props.validations.hasMinLength - Password meets minimum length requirement
 * @param {boolean} props.validations.hasUppercase - Password contains an uppercase character
 * @param {boolean} props.validations.hasLowercase - Password contains a lowercase character
 * @param {boolean} props.validations.hasNumber - Password contains a number
 * @param {boolean} props.validations.hasSpecialChar - Password contains a special character
 * @param {boolean} [props.visible=true] - Whether to show the requirements
 * @param {number} [props.minLength=8] - Minimum password length
 */
const PasswordRequirements = ({ 
  validations, 
  visible = true, 
  minLength = 8 
}) => {
  if (!visible) return null;

  // Calculate strength based on passed validations
  const { hasMinLength, hasUppercase, hasLowercase, hasNumber, hasSpecialChar } = validations;
  
  // Count valid requirements (excluding passwordsMatch)
  const validCount = [hasMinLength, hasUppercase, hasLowercase, hasNumber, hasSpecialChar].filter(Boolean).length;
  const totalRequirements = 5; // Total number of requirements excluding match
  
  // Calculate percentage (0-100)
  const strengthPercentage = Math.floor((validCount / totalRequirements) * 100);
  
  // Determine strength level
  let strengthLevel = 'weak';
  if (strengthPercentage >= 80) {
    strengthLevel = 'strong';
  } else if (strengthPercentage >= 50) {
    strengthLevel = 'medium';
  }

  // Helper function to render requirement item
  const renderRequirement = (isValid, text) => {
    const status = isValid ? 'valid' : 'invalid';
    
    return (
      <li className={`requirement-item ${status}`}>
        <span className="requirement-icon">
          {isValid ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          )}
        </span>
        <span className="requirement-text">{text}</span>
      </li>
    );
  };

  return (
    <div className="password-requirements">
     
      <ul className="password-requirements-list">
        {renderRequirement(hasMinLength, `Por lo menos ${minLength} caracteres`)}
        {renderRequirement(hasUppercase, 'Por lo menos 1 letra mayúscula')}
        {renderRequirement(hasLowercase, 'Por lo menos 1 letra minúscula')}
        {renderRequirement(hasNumber, 'Por lo menos 1 número')}
        {renderRequirement(hasSpecialChar, 'Por lo menos un carácter especial')}
      </ul>
      
      <div className="password-strength-bar">
        <div 
          className={`strength-progress strength-${strengthLevel}`} 
          style={{ width: `${strengthPercentage}%` }}
        />
      </div>
    </div>
  );
};

export default PasswordRequirements;