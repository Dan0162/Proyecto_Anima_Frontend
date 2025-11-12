import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../../contexts/ThemeContext';

// The page uses useFlash to show an informational message when Spotify is not
// connected. We'll spy on that hook and assert it's called when no token is
// present in localStorage.
import RecommendationsPage from '../../pages/home/RecommendationsPage';

import * as FlashModule from '../../components/flash/FlashContext';

describe('RecommendationsPage', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    localStorage.clear();
  });

  test('renders heading and shows flash when no spotify token', async () => {
    const mockShow = jest.fn();
    jest.spyOn(FlashModule, 'useFlash').mockReturnValue({ show: mockShow });

    render(
      <ThemeProvider>
        <MemoryRouter>
          <RecommendationsPage />
        </MemoryRouter>
      </ThemeProvider>
    );

    // Page title is rendered
    expect(screen.getByText(/Explora Música/i)).toBeInTheDocument();

    // The hook should be invoked to notify the user to connect Spotify
    await waitFor(() => expect(mockShow).toHaveBeenCalled());

    // With no recommendations (no token), the no-results UI should be shown
    expect(screen.getByText(/No se pudieron cargar recomendaciones/i)).toBeInTheDocument();
  });
});
