import React from 'react';
import { render, screen } from '@testing-library/react';
import SignIn from '../../pages/SignIn';

test('SignIn wrapper renders sign in form title', () => {
  render(<SignIn />);

  // The page contains several occurrences of the text; target the heading specifically
  expect(screen.getByRole('heading', { name: /Iniciar Sesión/i })).toBeInTheDocument();
});
