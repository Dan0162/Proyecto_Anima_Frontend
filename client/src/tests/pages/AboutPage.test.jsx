import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../../contexts/ThemeContext';
import AboutPage from '../../pages/AboutPage';

test('AboutPage renders hero title and subtitle', () => {
  render(
    <MemoryRouter>
      <ThemeProvider>
        <AboutPage />
      </ThemeProvider>
    </MemoryRouter>
  );

  // The hero heading should be present (use heading query to avoid duplicate matches)
  expect(screen.getByRole('heading', { level: 1, name: /Sobre/i })).toBeInTheDocument();
  expect(screen.getByText(/Conectando emociones con música/i)).toBeInTheDocument();
});
