import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// We'll mock react-router's useNavigate to capture navigation calls
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock flash context
const mockShow = jest.fn();
jest.mock('../../components/flash/FlashContext', () => ({
  useFlash: () => ({ show: mockShow })
}));

import SpotifyCallback from '../../pages/home/SpotifyCallback';

describe('SpotifyCallback', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    localStorage.removeItem('spotify_jwt');
    sessionStorage.removeItem('return_to');
  });

  test('handles successful state param by exchanging token and navigating', async () => {
    // Simulate URL with state param
    const originalLocation = window.location;
    // Replace location with minimal shape used by the component
    delete window.location;
    window.location = { search: '?state=mockstate' };

    // Mock fetch exchange endpoint
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ spotify_jwt: 'jwt-token' }) });

    render(
      <MemoryRouter initialEntries={[`/spotify-callback?state=mockstate`]}>
        <SpotifyCallback />
      </MemoryRouter>
    );

  await waitFor(() => expect(global.fetch).toHaveBeenCalled());

  // Should store to localStorage the jwt
  await waitFor(() => expect(localStorage.getItem('spotify_jwt')).toBe('jwt-token'));

  // Should navigate back (called at least once) - navigation happens after a small timeout in the component
  await waitFor(() => expect(mockNavigate).toHaveBeenCalled());

    // restore location
    window.location = originalLocation;
  });
});
