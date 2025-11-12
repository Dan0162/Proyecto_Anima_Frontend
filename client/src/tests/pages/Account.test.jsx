import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../../contexts/ThemeContext';

import Account from '../../pages/home/Account';
import * as AuthHook from '../../hooks/useAuth';
import * as AnalyticsApi from '../../utils/analyticsApi';

describe('Account page', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    localStorage.clear();
    // Avoid network calls from the Spotify status check
    global.fetch = jest.fn().mockResolvedValue({ ok: false });
  });

  test('renders user info and spotify connect button', async () => {
    jest.spyOn(AuthHook, 'useCurrentUser').mockReturnValue({ user: { nombre: 'Test User', email: 't@example.com' }, loading: false });
    jest.spyOn(AnalyticsApi, 'getUserProfileStats').mockResolvedValue({ totalAnalyses: 3, streak: 2, mostFrequentEmotion: 'happy' });

    render(
      <ThemeProvider>
        <MemoryRouter>
          <Account />
        </MemoryRouter>
      </ThemeProvider>
    );

  // Header + user info
  expect(screen.getByText(/Mi Perfil/i)).toBeInTheDocument();
  // The username appears in more than one place (sidebar and profile card).
  const nameMatches = screen.getAllByText(/Test User/i);
  expect(nameMatches.length).toBeGreaterThanOrEqual(1);
  expect(screen.getByText(/t@example.com/i)).toBeInTheDocument();

  // Wait for async profile stats / spotify status effects to settle and then
  // assert the connect button is shown when Spotify is not connected.
  await waitFor(() => expect(screen.getByText(/Conectar con Spotify/i)).toBeInTheDocument());
  });
});
