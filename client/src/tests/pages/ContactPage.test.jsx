import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../../contexts/ThemeContext';
import FlashContext, { FlashProvider } from '../../components/flash/FlashContext';
import ContactPage from '../../pages/ContactPage';

test('ContactPage renders hero and form and validates inputs', async () => {
  render(
    <MemoryRouter>
      <ThemeProvider>
        <FlashProvider>
          <ContactPage />
        </FlashProvider>
      </ThemeProvider>
    </MemoryRouter>
  );

  expect(screen.getByText(/Contáctanos/i)).toBeInTheDocument();

  // Find form inputs
  const nameInput = screen.getByPlaceholderText(/Tu nombre completo/i);
  const emailInput = screen.getByPlaceholderText(/tu@ejemplo.com/i);
  const subjectInput = screen.getByPlaceholderText(/¿En qué podemos ayudarte\?/i);
  const messageInput = screen.getByPlaceholderText(/Escribe tu mensaje aquí/i);

  // Submit empty form to trigger validations
  const submit = screen.getByRole('button', { name: /Enviar Mensaje/i });
  fireEvent.click(submit);

  // Expect validation errors to appear for required fields
  expect(await screen.findByText(/El nombre es requerido/i)).toBeInTheDocument();
  expect(await screen.findByText(/El correo es requerido/i)).toBeInTheDocument();
});

test('ContactPage successful submit shows flash and clears form', async () => {
  // Mock global.fetch to simulate successful POST
  const fakeResponse = { message: 'Enviado con éxito' };
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => fakeResponse
  });

  // Provide a test flash context with a mocked `show` function so we can assert it was called
  const mockShow = jest.fn();
  const TestFlashProvider = ({ children }) => (
    <FlashContext.Provider value={{ flash: null, show: mockShow, hide: jest.fn() }}>
      {children}
    </FlashContext.Provider>
  );

  render(
    <MemoryRouter>
      <ThemeProvider>
        <TestFlashProvider>
          <ContactPage />
        </TestFlashProvider>
      </ThemeProvider>
    </MemoryRouter>
  );

  // Fill form
  fireEvent.change(screen.getByPlaceholderText(/Tu nombre completo/i), { target: { name: 'name', value: 'Ishai' } });
  fireEvent.change(screen.getByPlaceholderText(/tu@ejemplo.com/i), { target: { name: 'email', value: 'ishai@example.com' } });
  fireEvent.change(screen.getByPlaceholderText(/¿En qué podemos ayudarte\?/i), { target: { name: 'subject', value: 'Consulta' } });
  fireEvent.change(screen.getByPlaceholderText(/Escribe tu mensaje aquí/i), { target: { name: 'message', value: 'Este es un mensaje de prueba con más de diez caracteres.' } });

  const submit = screen.getByRole('button', { name: /Enviar Mensaje/i });
  fireEvent.click(submit);

  // Wait for the mocked flash.show to be called with the server message
  await screen.findByRole('button', { name: /Enviar Mensaje/i }); // ensure form processed
  expect(mockShow).toHaveBeenCalledWith(fakeResponse.message, 'success', 4000);

  // Form should be cleared: inputs should have empty values
  expect(screen.getByPlaceholderText(/Tu nombre completo/i).value).toBe('');
  expect(screen.getByPlaceholderText(/tu@ejemplo.com/i).value).toBe('');

  // Clean up mock
  global.fetch.mockRestore && global.fetch.mockRestore();
});
