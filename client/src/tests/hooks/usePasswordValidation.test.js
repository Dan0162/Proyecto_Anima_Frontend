import React from 'react';
import { render, screen } from '@testing-library/react';
import usePasswordValidation from '../../hooks/usePasswordValidation';

// Helper component to expose hook values for assertions
const HookConsumer = ({ password, confirm }) => {
  const { validations, isValid, strength } = usePasswordValidation({ password, confirmPassword: confirm });
  return (
    <div>
      <div data-testid="isValid">{isValid ? 'true' : 'false'}</div>
      <div data-testid="strength">{strength}</div>
      <div data-testid="min">{validations.hasMinLength ? '1' : '0'}</div>
      <div data-testid="upper">{validations.hasUppercase ? '1' : '0'}</div>
      <div data-testid="lower">{validations.hasLowercase ? '1' : '0'}</div>
      <div data-testid="num">{validations.hasNumber ? '1' : '0'}</div>
      <div data-testid="special">{validations.hasSpecialChar ? '1' : '0'}</div>
    </div>
  );
};

describe('usePasswordValidation hook', () => {
  test('validates a strong password and computes strength', () => {
    render(<HookConsumer password="Abcdef1!" confirm="Abcdef1!" />);

    expect(screen.getByTestId('isValid')).toHaveTextContent('true');
    // Strength should be > 0
    expect(Number(screen.getByTestId('strength').textContent)).toBeGreaterThan(0);
    expect(screen.getByTestId('min')).toHaveTextContent('1');
    expect(screen.getByTestId('upper')).toHaveTextContent('1');
    expect(screen.getByTestId('lower')).toHaveTextContent('1');
    expect(screen.getByTestId('num')).toHaveTextContent('1');
    expect(screen.getByTestId('special')).toHaveTextContent('1');
  });

  test('marks invalid when too short or missing rules', () => {
    render(<HookConsumer password="abc" confirm="abc" />);
    expect(screen.getByTestId('isValid')).toHaveTextContent('false');
    expect(screen.getByTestId('min')).toHaveTextContent('0');
  });
});
