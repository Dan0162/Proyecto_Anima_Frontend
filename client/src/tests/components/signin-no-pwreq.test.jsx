import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../../contexts/ThemeContext';
import SignIn from '../../pages/auth/SignInPage';

// Prueba que el componente SignIn no renderiza los requisitos de contraseña ni el interruptor compartido
test('SignIn no muestra los requisitos de contraseña ni el conmutador compartido', () => {
  const { container } = render(
    <MemoryRouter>
      <ThemeProvider>
        <SignIn />
      </ThemeProvider>
    </MemoryRouter>
  );

  // El bloque de requisitos de contraseña no debería estar presente
  const requisitos = container.querySelector('.password-requirements');
  expect(requisitos).toBeNull();
});
