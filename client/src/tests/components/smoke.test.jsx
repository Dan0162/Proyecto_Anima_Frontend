import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../../App';
import { ThemeProvider } from '../../contexts/ThemeContext';

// Prueba básica (smoke test) - Verifica que el componente App se renderiza sin errores
test('prueba básica - App se renderiza correctamente', () => {
  render(
    <MemoryRouter>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </MemoryRouter>
  );
});
