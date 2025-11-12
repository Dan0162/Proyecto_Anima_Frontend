import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import { ThemeProvider } from '../contexts/ThemeContext';

// Prueba que verifica que se renderiza el título principal en la página de inicio
test('renderiza el título principal de la página de inicio', () => {
  render(
    <MemoryRouter>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </MemoryRouter>
  );

  const titulo = screen.getByText(/Descubre tus emociones/i);
  expect(titulo).toBeInTheDocument();
});
