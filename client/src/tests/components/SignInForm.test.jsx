import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SignInForm from '../../components/auth/SignInForm';
import { ThemeProvider } from '../../contexts/ThemeContext';

describe('SignInForm - validations and submit', () => {
  const renderForm = (props = {}) => {
    const defaultProps = { onSubmit: jest.fn(), isLoading: false, formError: '' };
    return render(
      <MemoryRouter>
        <ThemeProvider>
          <SignInForm {...defaultProps} {...props} />
        </ThemeProvider>
      </MemoryRouter>
    );
  };

  test('shows required field errors when submitting empty form and does not call onSubmit', () => {
    const onSubmit = jest.fn();
    renderForm({ onSubmit });

  // submit the form directly (button is disabled when form incomplete)
  const { container } = renderForm({ onSubmit });
  const form = container.querySelector('form');
  fireEvent.submit(form);

    expect(screen.getByText(/El correo electrónico es requerido/i)).toBeInTheDocument();
    expect(screen.getByText(/La contraseña es requerida/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test('shows invalid email error and prevents submit', () => {
    const onSubmit = jest.fn();
    renderForm({ onSubmit });

    const email = screen.getByLabelText(/Correo Electrónico/i);
    const password = screen.getByLabelText(/Contraseña/i);
    fireEvent.change(email, { target: { value: 'bad-email' } });
    fireEvent.change(password, { target: { value: 'validpass' } });

    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
    fireEvent.click(submitButton);

    expect(screen.getByText(/Por favor ingresa un correo electrónico válido/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test('shows short password error and prevents submit', () => {
    const onSubmit = jest.fn();
    renderForm({ onSubmit });

    const email = screen.getByLabelText(/Correo Electrónico/i);
    const password = screen.getByLabelText(/Contraseña/i);
    fireEvent.change(email, { target: { value: 'user@example.com' } });
    fireEvent.change(password, { target: { value: '123' } });

    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
    fireEvent.click(submitButton);

    expect(screen.getByText(/La contraseña debe tener al menos 6 caracteres/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test('calls onSubmit with form data when valid', () => {
    const onSubmit = jest.fn();
    renderForm({ onSubmit });

    const email = screen.getByLabelText(/Correo Electrónico/i);
    const password = screen.getByLabelText(/Contraseña/i);
    fireEvent.change(email, { target: { value: 'user@example.com' } });
    fireEvent.change(password, { target: { value: 'mypassword' } });

    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
    fireEvent.click(submitButton);

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({ email: 'user@example.com', password: 'mypassword' });
  });
});
