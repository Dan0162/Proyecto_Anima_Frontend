import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../../contexts/ThemeContext';

import SpotifyCallback from '../../pages/home/SpotifyCallback';

describe('SpotifyCallback (callback handler)', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  test('displays connecting message and handles missing params by redirect', async () => {
    // Use a location with no params — the component should redirect but also
    // render the connecting text while processing. We mock navigate by using
    // MemoryRouter and checking the connecting text is present.
    render(
      <ThemeProvider>
        <MemoryRouter>
          <SpotifyCallback />
        </MemoryRouter>
      </ThemeProvider>
    );

    expect(screen.getByText(/Conectando con Spotify/i)).toBeInTheDocument();
  });
});
