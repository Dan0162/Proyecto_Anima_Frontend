import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../../contexts/ThemeContext';
import FlashContext, { FlashProvider } from '../../components/flash/FlashContext';
import ContactPage from '../../pages/ContactPage';

test('ContactPage renderiza el héroe y el formulario, y valida las entradas', async () => {
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

  // Buscar los campos del formulario
  const nameInput = screen.getByPlaceholderText(/Tu nombre completo/i);
  const emailInput = screen.getByPlaceholderText(/tu@ejemplo.com/i);
  const subjectInput = screen.getByPlaceholderText(/¿En qué podemos ayudarte\?/i);
  const messageInput = screen.getByPlaceholderText(/Escribe tu mensaje aquí/i);

  // Enviar el formulario vacío para activar las validaciones
  const submit = screen.getByRole('button', { name: /Enviar Mensaje/i });
  fireEvent.click(submit);

  // Esperar que aparezcan los mensajes de error de validación para los campos requeridos
  expect(await screen.findByText(/El nombre es requerido/i)).toBeInTheDocument();
  expect(await screen.findByText(/El correo es requerido/i)).toBeInTheDocument();
});

test('ContactPage con envío exitoso muestra un mensaje flash y limpia el formulario', async () => {
  // Simular una llamada fetch exitosa de tipo POST
  const fakeResponse = { message: 'Enviado con éxito' };
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => fakeResponse
  });

  // Proveer un contexto flash de prueba con una función `show` simulada para verificar su invocación
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

  // Llenar el formulario
  fireEvent.change(screen.getByPlaceholderText(/Tu nombre completo/i), { target: { name: 'name', value: 'Ishai' } });
  fireEvent.change(screen.getByPlaceholderText(/tu@ejemplo.com/i), { target: { name: 'email', value: 'ishai@example.com' } });
  fireEvent.change(screen.getByPlaceholderText(/¿En qué podemos ayudarte\?/i), { target: { name: 'subject', value: 'Consulta' } });
  fireEvent.change(screen.getByPlaceholderText(/Escribe tu mensaje aquí/i), { target: { name: 'message', value: 'Este es un mensaje de prueba con más de diez caracteres.' } });

  const submit = screen.getByRole('button', { name: /Enviar Mensaje/i });
  fireEvent.click(submit);

  // Esperar a que la función flash.show sea llamada con el mensaje del servidor simulado
  await screen.findByRole('button', { name: /Enviar Mensaje/i }); // asegura que el formulario haya sido procesado
  expect(mockShow).toHaveBeenCalledWith(fakeResponse.message, 'success', 4000);

  // El formulario debe haberse limpiado: los campos deben estar vacíos
  expect(screen.getByPlaceholderText(/Tu nombre completo/i).value).toBe('');
  expect(screen.getByPlaceholderText(/tu@ejemplo.com/i).value).toBe('');

  // Restaurar el mock
  global.fetch.mockRestore && global.fetch.mockRestore();
});
