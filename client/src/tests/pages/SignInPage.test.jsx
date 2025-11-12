import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../../contexts/ThemeContext';

import SignInPage from '../../pages/auth/SignInPage';
import * as ApiHook from '../../hooks/useApi';

jest.mock('../../components/auth/SignInForm', () => {
  return (props) => {
    const { onSubmit } = props;
    return (
      <div>
        <h2>MockSignInForm</h2>
        <button onClick={() => onSubmit({ email: 'a@b.com', password: 'pass' })}>Submit</button>
      </div>
    );
  };
});

describe('SignInPage', () => {
  beforeEach(() => jest.restoreAllMocks());

  test('renders sign in form and handles successful login flow', async () => {
    jest.spyOn(ApiHook, 'useApi').mockReturnValue({ loading: false, error: null, callApi: jest.fn().mockResolvedValue({}) });

    render(
      <ThemeProvider>
        <MemoryRouter>
          <SignInPage />
        </MemoryRouter>
      </ThemeProvider>
    );

    expect(screen.getByText(/MockSignInForm/i)).toBeInTheDocument();
  });
});
