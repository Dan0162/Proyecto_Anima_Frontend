import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../../contexts/ThemeContext';

import ResultsPage from '../../pages/home/ResultsPage';

describe('ResultsPage', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    localStorage.clear();
  });

  test('renders analysis results and recommendations when state provided', async () => {
    const result = {
      emotion: 'happy',
      confidence: 0.95,
      emotions_detected: { happy: 0.95 }
    };

    const photo = 'data:image/png;base64,AAA';
    const recommendations = [{ uri: 'spotify:track:1', name: 'Song 1' }];

    render(
      <ThemeProvider>
        <MemoryRouter initialEntries={[{ pathname: '/home/results', state: { result, photo, recommendations } }]}>
          <ResultsPage />
        </MemoryRouter>
      </ThemeProvider>
    );

    // Header and photo should render
    expect(screen.getByText(/Resultados del Análisis/i)).toBeInTheDocument();
    const img = screen.getByAltText(/Tu foto/i);
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', photo);

    // Recommendations section should be present
    expect(screen.getByText(/Recomendaciones Musicales/i)).toBeInTheDocument();
    // Because recommendations were provided, the save button should be rendered
    expect(screen.getByText(/Guardar en Spotify/i)).toBeInTheDocument();
  });
});
