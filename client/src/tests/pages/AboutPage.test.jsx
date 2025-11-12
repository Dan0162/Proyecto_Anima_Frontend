import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../../contexts/ThemeContext';
import AboutPage from '../../pages/AboutPage';

test('AboutPage renderiza el título y subtítulo del héroe', () => {
  render(
    <MemoryRouter>
      <ThemeProvider>
        <AboutPage />
      </ThemeProvider>
    </MemoryRouter>
  );

  // El encabezado principal (héroe) debe estar presente (usa la consulta de encabezado para evitar coincidencias duplicadas)
  expect(screen.getByRole('heading', { level: 1, name: /Sobre/i })).toBeInTheDocument();
  expect(screen.getByText(/Conectando emociones con música/i)).toBeInTheDocument();
});
