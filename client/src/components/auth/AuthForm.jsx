import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../ui/Button';
import './AuthForm.css';

/**
 * Base authentication form component that serves as a wrapper for sign in and sign up forms
 * 
 * @param {Object} props - Component props
 * @param {string} props.title - Form title
 * @param {string} [props.subtitle] - Optional subtitle
 * @param {ReactNode} props.children - Form content
 * @param {function} props.onSubmit - Form submission handler
 * @param {boolean} [props.isLoading=false] - Loading state
 * @param {string} [props.formError] - Form-level error message
 * @param {string} [props.submitLabel='Submit'] - Submit button label
 * @param {string} [props.alternateText] - Text for the alternate action link
 * @param {string} [props.alternateLinkTo] - Path for the alternate action link
 * @param {string} [props.alternateLinkText] - Text for the alternate action link
 */
const AuthForm = ({
  title,
  subtitle,
  children,
  onSubmit,
  isLoading = false,
  formError,
  submitLabel = 'Submit',
  submitDisabled = false,
  alternateText,
  alternateLinkTo,
  alternateLinkText,
  className = '',
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <form className={`auth-form ${className}`} onSubmit={handleSubmit}>
      <div className="auth-header">
        <h1 className="auth-title">{title}</h1>
        {subtitle && <p className="auth-subtitle">{subtitle}</p>}
      </div>

      <div className="auth-form-content">
        {children}
      </div>

      {formError && (
        <div className="form-error">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-7v2h2v-2h-2zm0-8v6h2V7h-2z" />
          </svg>
          {formError}
        </div>
      )}

      <div className="auth-actions">
        <Button 
          type="submit" 
          disabled={isLoading || submitDisabled} 
          className="auth-submit-button"
        >
          {isLoading ? 'Loading...' : submitLabel}
        </Button>
        
        {alternateText && alternateLinkTo && alternateLinkText && (
          <div className="auth-alternate">
            {alternateText}
            <Link to={alternateLinkTo}>{alternateLinkText}</Link>
          </div>
        )}
      </div>
    </form>
  );
};

export default AuthForm;