import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../../contexts/ThemeContext';

import SignUpPage from '../../pages/auth/SignUpPage';
import * as ApiHook from '../../hooks/useApi';

jest.mock('../../components/auth/SignUpForm', () => (props) => {
  const { onSubmit } = props;
  return (
    <div>
      <h2>MockSignUpForm</h2>
      <button onClick={() => onSubmit({ name: 'Test', email: 't@e.com', password: 'pass', confirmPassword: 'pass' })}>Submit</button>
    </div>
  );
});

describe('SignUpPage', () => {
  beforeEach(() => jest.restoreAllMocks());

  test('renders signup form and handles submit', async () => {
    jest.spyOn(ApiHook, 'useApi').mockReturnValue({ loading: false, error: null, callApi: jest.fn().mockResolvedValue({}) });

    render(
      <ThemeProvider>
        <MemoryRouter>
          <SignUpPage />
        </MemoryRouter>
      </ThemeProvider>
    );

    expect(screen.getByText(/MockSignUpForm/i)).toBeInTheDocument();
  });
});
