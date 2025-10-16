import { useState, useEffect } from 'react';

/**
 * Custom hook for validating passwords and tracking requirements
 * 
 * @param {Object} options - Configuration options
 * @param {string} [options.password=''] - The password to validate
 * @param {string} [options.confirmPassword=''] - The confirmation password to match against
 * @param {number} [options.minLength=8] - Minimum required password length
 * @param {boolean} [options.requireUppercase=true] - Whether to require uppercase characters
 * @param {boolean} [options.requireLowercase=true] - Whether to require lowercase characters
 * @param {boolean} [options.requireNumber=true] - Whether to require numeric characters
 * @param {boolean} [options.requireSpecialChar=true] - Whether to require special characters
 * @returns {Object} Validation state and helper functions
 */
const usePasswordValidation = ({
  password = '',
  confirmPassword = '',
  minLength = 8,
  requireUppercase = true,
  requireLowercase = true,
  requireNumber = true,
  requireSpecialChar = true,
}) => {
  // State for tracking each validation requirement
  const [validations, setValidations] = useState({
    hasMinLength: false,
    hasUppercase: false,
    hasLowercase: false, 
    hasNumber: false,
    hasSpecialChar: false,
    passwordsMatch: false,
  });
  
  // Overall password validity
  const [isValid, setIsValid] = useState(false);
  
  // Calculate strength (0-100)
  const calculateStrength = () => {
    const checks = [];
    
    if (validations.hasMinLength) checks.push(true);
    if (validations.hasUppercase && requireUppercase) checks.push(true);
    if (validations.hasLowercase && requireLowercase) checks.push(true);
    if (validations.hasNumber && requireNumber) checks.push(true);
    if (validations.hasSpecialChar && requireSpecialChar) checks.push(true);
    
    // Count active requirements
    let requiredCount = 1; // minLength is always required
    if (requireUppercase) requiredCount++;
    if (requireLowercase) requiredCount++;
    if (requireNumber) requiredCount++;
    if (requireSpecialChar) requiredCount++;
    
    return Math.floor((checks.length / requiredCount) * 100);
  };
  
  // Effect to validate password whenever it changes
  useEffect(() => {
    // Check all requirements
    const hasMinLength = password.length >= minLength;
    const hasUppercase = requireUppercase ? /[A-Z]/.test(password) : true;
    const hasLowercase = requireLowercase ? /[a-z]/.test(password) : true;
    const hasNumber = requireNumber ? /\d/.test(password) : true;
    const hasSpecialChar = requireSpecialChar ? /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password) : true;
    const passwordsMatch = confirmPassword === '' || password === confirmPassword;
    
    // Update validations state
    setValidations({
      hasMinLength,
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSpecialChar,
      passwordsMatch,
    });
    
    // Check overall validity
    const passwordValid = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar;
    const confirmValid = !confirmPassword || confirmPassword === password;
    
    setIsValid(passwordValid && confirmValid);
  }, [
    password, 
    confirmPassword, 
    minLength, 
    requireUppercase, 
    requireLowercase, 
    requireNumber, 
    requireSpecialChar
  ]);
  
  return {
    validations,
    isValid,
    strength: calculateStrength(),
  };
};

export default usePasswordValidation;