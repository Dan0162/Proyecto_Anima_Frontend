import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../../contexts/ThemeContext';

import ForgotPasswordPage from '../../pages/auth/ForgotPasswordPage';

// Avoid real network calls; mock fetch
beforeEach(() => {
  jest.restoreAllMocks();
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
});

describe('ForgotPasswordPage', () => {
  test('renders email step and shows validation when submitting empty', async () => {
    render(
      <ThemeProvider>
        <MemoryRouter>
          <ForgotPasswordPage />
        </MemoryRouter>
      </ThemeProvider>
    );

    // Title should be present
    expect(screen.getByText(/¿Olvidaste tu contraseña\?/i)).toBeInTheDocument();

    // Click submit with no email to trigger inline validation
  // trigger blur so the input is considered 'touched' and will show errors
  const emailInput = screen.getByPlaceholderText(/tu@ejemplo.com/i);
  fireEvent.blur(emailInput);

  const submit = screen.getByRole('button', { name: /Enviar código/i });
  fireEvent.click(submit);

    await waitFor(() => expect(screen.getByText(/Por favor ingresa un correo válido/i)).toBeInTheDocument());
  });
});
