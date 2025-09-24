import React from 'react';
import { Link } from 'react-router-dom';
import './Button.css';

/**
 * Button component with support for regular buttons and link buttons.
 * 
 * @param {Object} props - Component props
 * @param {string} [props.variant='default'] - Button style variant (default, primary, signin, signup)
 * @param {string} [props.size='medium'] - Button size (small, medium, large)
 * @param {string} [props.type='button'] - Button HTML type (button, submit, reset)
 * @param {string} [props.to] - If provided, renders as a React Router Link
 * @param {function} [props.onClick] - Click handler
 * @param {boolean} [props.disabled] - Whether the button is disabled
 * @param {React.ReactNode} props.children - Button content
 * @param {string} [props.className] - Additional CSS class names
 */
const Button = ({
  variant = 'default',
  size = 'medium',
  type = 'button',
  to,
  onClick,
  disabled,
  children,
  className = '',
  ...rest
}) => {
  const baseClass = 'btn';
  const classes = [
    baseClass,
    `${baseClass}--${variant}`,
    `${baseClass}--${size}`,
    className
  ].filter(Boolean).join(' ');

  // If 'to' prop is provided, render as a Link
  if (to) {
    return (
      <Link 
        to={to} 
        className={classes} 
        onClick={onClick} 
        {...rest}
      >
        {children}
      </Link>
    );
  }

  // Otherwise render as a button
  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled}
      aria-disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
};

export default Button;