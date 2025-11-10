import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SpotifyCallback from '../../pages/home/SpotifyCallback';

// Mock FlashContext
const mockShow = jest.fn();
jest.mock('../../components/flash/FlashContext', () => ({
  useFlash: () => ({ show: mockShow })
}));

// Mock useNavigate (avoid referencing out-of-scope vars inside factory)
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Helper to set window.location.search
const setSearch = (search) => {
  delete window.location;
  window.location = { ...window.location, search };
};

describe('SpotifyCallback', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    localStorage.clear();
    sessionStorage.clear();
  });

  test('exchanges state and navigates with flash state', async () => {
    // Prepare location & return path
    sessionStorage.setItem('return_to', '/home/account');
    const state = 'abc123';
    localStorage.setItem('spotify_state', state);
    setSearch(`?state=${state}`);

    // Mock fetch for exchange
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ spotify_jwt: 'SPOTIFY_TEST_JWT' })
    });

    render(
      <MemoryRouter initialEntries={[`/spotify-callback?state=${state}`]}>
        <SpotifyCallback />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(localStorage.getItem('spotify_jwt')).toBe('SPOTIFY_TEST_JWT');
      expect(mockNavigate).toHaveBeenCalled();
    });

    const lastCallArgs = mockNavigate.mock.calls.at(-1);
    expect(lastCallArgs[0]).toBe('/home/account');
    expect(lastCallArgs[1]).toMatchObject({ replace: true, state: expect.objectContaining({ flashType: 'success', spotifyConnected: true }) });
  });

  test('handles backend error and redirects', async () => {
    sessionStorage.setItem('return_to', '/home/account');
    const state = 'xyz999';
    localStorage.setItem('spotify_state', state);
    setSearch(`?state=${state}`);

    global.fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({}) });

    render(
      <MemoryRouter initialEntries={[`/spotify-callback?state=${state}`]}>
        <SpotifyCallback />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalled();
    });

    const lastCallArgs = mockNavigate.mock.calls.at(-1);
    expect(lastCallArgs[0]).toBe('/home/account');
  });
});
