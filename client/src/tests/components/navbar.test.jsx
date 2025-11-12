import { render, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navbar from '../../components/navbar';
import { ThemeProvider } from '../../contexts/ThemeContext';

// Se simula LOGO_SRC para evitar error de importación durante la prueba
jest.mock('../../constants/assets', () => ({ LOGO_SRC: '/logo.png' }));

// Función auxiliar para renderizar el componente con los proveedores necesarios
const renderConProveedores = (ui, { route = '/' } = {}) => {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <ThemeProvider>
        {ui}
      </ThemeProvider>
    </MemoryRouter>
  );
};

describe('Interacciones móviles del Navbar', () => {
  test('al hacer clic en el fondo se cierra el menú', () => {
  const { container, getByLabelText } = renderConProveedores(<Navbar />);
  // Acepta tanto el aria-label en español como en inglés (robusto a través de locales)
  const botonMenu = getByLabelText(/alternar navegaci|toggle navigation/i);

    // abrir menú
    fireEvent.click(botonMenu);
    const fondo = container.querySelector('.mobile-backdrop');
    expect(fondo.classList.contains('open')).toBe(true);

    // hacer clic en el fondo
    fireEvent.click(fondo);
    expect(fondo.classList.contains('open')).toBe(false);
  });

  test('al presionar Escape se cierra el menú', () => {
  const { container, getByLabelText } = renderConProveedores(<Navbar />);
  // Acepta tanto el aria-label en español como en inglés (robusto a través de locales)
  const botonMenu = getByLabelText(/alternar navegaci|toggle navigation/i);

    // abrir menú
    fireEvent.click(botonMenu);
    const desplegable = container.querySelector('.mobile-dropdown');
    expect(desplegable.classList.contains('open')).toBe(true);

    // presionar Escape
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
    expect(desplegable.classList.contains('open')).toBe(false);
  });
});
