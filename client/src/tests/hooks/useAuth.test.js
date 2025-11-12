import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth, useCurrentUser } from '../../hooks/useAuth';

// Helper component to inspect provider values
const AuthConsumer = () => {
  const auth = useAuth();
  const current = useCurrentUser();
  return (
    <div>
      <div data-testid="isAuthenticated">{auth.isAuthenticated ? '1' : '0'}</div>
      <div data-testid="loading">{auth.loading ? '1' : '0'}</div>
      <div data-testid="currentUser">{current.user ? current.user.nombre : 'null'}</div>
    </div>
  );
};

describe('AuthProvider and hooks', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    localStorage.clear();
  });

  test('when no token, provider sets not authenticated and current user hook returns null', async () => {
    // Ensure tokenManager.getAccessToken returns falsy by not setting tokens
    const { getByTestId } = render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    // isAuthenticated should be false and loading should eventually be false
    await waitFor(() => expect(getByTestId('isAuthenticated').textContent).toBe('0'));
    await waitFor(() => expect(getByTestId('loading').textContent).toBe('0'));
    expect(getByTestId('currentUser').textContent).toBe('null');
  });
});
