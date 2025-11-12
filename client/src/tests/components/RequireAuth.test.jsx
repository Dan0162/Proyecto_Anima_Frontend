import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import RequireAuth from '../../components/RequireAuth';

jest.mock('../../utils/tokenManager', () => ({
  isAuthenticated: jest.fn(),
  getValidAccessToken: jest.fn()
}));

import tokenManager from '../../utils/tokenManager';

describe('RequireAuth', () => {
  afterEach(() => {
    jest.clearAllMocks();
    // reset location.search
    try { window.history.replaceState({}, '', '/'); } catch (e) {}
  });

  test('renders children when authenticated and token validated', async () => {
    tokenManager.isAuthenticated.mockReturnValue(true);
    tokenManager.getValidAccessToken.mockResolvedValue('access-token');

    render(
      <MemoryRouter initialEntries={["/protected"]}>
        <Routes>
          <Route path="/protected" element={<RequireAuth><div>Protected Content</div></RequireAuth>} />
        </Routes>
      </MemoryRouter>
    );

    // wait for protected content to appear
    const node = await screen.findByText('Protected Content');
    expect(node).toBeInTheDocument();
    expect(tokenManager.isAuthenticated).toHaveBeenCalled();
    expect(tokenManager.getValidAccessToken).toHaveBeenCalled();
  });

  test('redirects to signin when not authenticated', async () => {
    tokenManager.isAuthenticated.mockReturnValue(false);

    render(
      <MemoryRouter initialEntries={["/protected"]}>
        <Routes>
          <Route path="/protected" element={<RequireAuth><div>Protected</div></RequireAuth>} />
          <Route path="/signin" element={<div>Sign In Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    // The component does an async check; wait for the redirect target
    const signin = await screen.findByText('Sign In Page');
    expect(signin).toBeInTheDocument();
    expect(tokenManager.isAuthenticated).toHaveBeenCalled();
  });

  test('allows through on spotify-callback route even if no token', async () => {
    tokenManager.isAuthenticated.mockReturnValue(false);
    // simulate window location search containing state
    Object.defineProperty(window, 'location', {
      value: { search: '?state=abc' },
      writable: true
    });

    render(
      <MemoryRouter initialEntries={["/spotify-callback?state=abc"]}>
        <Routes>
          <Route path="/spotify-callback" element={<RequireAuth><div>Spotify Callback</div></RequireAuth>} />
        </Routes>
      </MemoryRouter>
    );

    const node = await screen.findByText('Spotify Callback');
    expect(node).toBeInTheDocument();
    // getValidAccessToken should NOT be called in this path
    expect(tokenManager.getValidAccessToken).not.toHaveBeenCalled();
  });

  test('redirects to signin when token validation fails', async () => {
    tokenManager.isAuthenticated.mockReturnValue(true);
    tokenManager.getValidAccessToken.mockRejectedValue(new Error('expired'));

    render(
      <MemoryRouter initialEntries={["/protected"]}>
        <Routes>
          <Route path="/protected" element={<RequireAuth><div>Protected</div></RequireAuth>} />
          <Route path="/signin" element={<div>Sign In Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    const signin = await screen.findByText('Sign In Page');
    expect(signin).toBeInTheDocument();
    expect(tokenManager.isAuthenticated).toHaveBeenCalled();
    expect(tokenManager.getValidAccessToken).toHaveBeenCalled();
  });
});
