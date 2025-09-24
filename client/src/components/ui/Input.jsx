import React, { forwardRef } from 'react';
import './Input.css';

/**
 * Reusable input component for forms
 * 
 * @param {Object} props - Component props
 * @param {string} [props.type='text'] - Input type
 * @param {string} [props.id] - Input ID
 * @param {string} [props.name] - Input name
 * @param {string} [props.value] - Input value
 * @param {function} [props.onChange] - Change handler
 * @param {function} [props.onBlur] - Blur handler
 * @param {string} [props.placeholder] - Input placeholder
 * @param {string} [props.label] - Input label
 * @param {string} [props.error] - Error message
 * @param {boolean} [props.required] - Whether the input is required
 * @param {boolean} [props.disabled] - Whether the input is disabled
 * @param {string} [props.className] - Additional CSS class
 * @param {object} [props.inputProps] - Additional props for the input element
 */
const Input = forwardRef(({
  type = 'text',
  id,
  name,
  value,
  onChange,
  onBlur,
  placeholder,
  label,
  error,
  required = false,
  disabled = false,
  className = '',
  inputProps = {},
  endAdornment = null,
  ...rest
}, ref) => {
  // Generate an id if not provided
  const inputId = id || `input-${name || Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <div className={`input-wrapper ${className}`}>
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
          {required && <span className="input-required">*</span>}
        </label>
      )}

      <div className="input-field">
        <input
          ref={ref}
          id={inputId}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`input ${error ? 'input--error' : ''}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...inputProps}
          {...rest}
        />

        {endAdornment && (
          <div className="end-adornment" aria-hidden>
            {endAdornment}
          </div>
        )}
      </div>

      {error && (
        <div id={`${inputId}-error`} className="input-error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;