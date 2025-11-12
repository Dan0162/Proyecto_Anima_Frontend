import React from 'react';
import { render, screen } from '@testing-library/react';
import SignIn from '../../pages/SignIn';

test('El contenedor de SignIn renderiza el título del formulario de inicio de sesión', () => {
  render(<SignIn />);

  // La página contiene varias apariciones del texto; se apunta específicamente al encabezado
  expect(screen.getByRole('heading', { name: /Iniciar Sesión/i })).toBeInTheDocument();
});
