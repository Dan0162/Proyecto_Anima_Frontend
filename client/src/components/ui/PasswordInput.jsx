import React, { useState } from 'react';
import Input from './Input';
import './PasswordInput.css';

/**
 * Password input component with show/hide toggle
 * 
 * @param {Object} props - Component props
 * @param {string} [props.id] - Input ID
 * @param {string} [props.name] - Input name
 * @param {string} [props.value] - Input value
 * @param {function} [props.onChange] - Change handler
 * @param {string} [props.label] - Input label
 * @param {string} [props.error] - Error message
 * @param {boolean} [props.showToggle=true] - Whether to show the password toggle
 * @param {boolean} [props.visible] - Whether password is visible (for controlled usage)
 * @param {function} [props.onVisibilityChange] - Called when visibility changes (for controlled usage)
 * @param {boolean} [props.disallowedCharsCheck=false] - Check for SQL injection chars
 */
const PasswordInput = ({
  id,
  name,
  value = '',
  onChange,
  label = 'Password',
  error,
  showToggle = true,
  visible: controlledVisible,
  onVisibilityChange,
  disallowedCharsCheck = false,
  showingRequirements = false,
  ...rest
}) => {
  // For uncontrolled usage
  const [internalVisible, setInternalVisible] = useState(false);
  
  // Use controlled or uncontrolled visibility
  const isVisible = controlledVisible !== undefined ? controlledVisible : internalVisible;
  
  // Disallowed chars: single quote, double quote, semicolon, or double dash
  const disallowedRegex = /['";]|--/;
  const hasDisallowed = disallowedCharsCheck && typeof value === 'string' && disallowedRegex.test(value);
  
  const toggleVisibility = () => {
    const newState = !isVisible;
    if (onVisibilityChange) {
      onVisibilityChange(newState);
    } else {
      setInternalVisible(newState);
    }
  };
  
  // If we're showing requirements, don't show "Password does not meet requirements" error
  let displayError = error;
  
  // Don't show "Password does not meet requirements" if we're already showing requirements
  if (showingRequirements && error === 'Password does not meet requirements') {
    displayError = null;
  }
  
  // Combine provided error with disallowed characters error
  const combinedError = hasDisallowed 
    ? `Password contains disallowed characters (', ", ;, or --)${displayError ? ` · ${displayError}` : ''}`
    : displayError;
  
  return (
    <div className="password-input-wrapper">
      <div className="password-input-container">
        <Input
          id={id}
          type={isVisible ? 'text' : 'password'}
          name={name}
          value={value}
          onChange={onChange}
          label={label}
          error={combinedError}
          className="password-input"
          endAdornment={showToggle ? (
            <button
              type="button"
              onClick={toggleVisibility}
              className="password-toggle"
              aria-label={isVisible ? 'Hide password' : 'Show password'}
              aria-pressed={isVisible}
            >
              <span className="sr-only">{isVisible ? 'Hide password' : 'Show password'}</span>
              {isVisible ? (
                <svg className="password-icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                </svg>
              ) : (
                <svg className="password-icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
                </svg>
              )}
            </button>
          ) : null}
          {...rest}
        />
      </div>
    </div>
  );
};

export default PasswordInput;