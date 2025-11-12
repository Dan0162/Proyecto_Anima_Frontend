import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SignUpForm from '../../components/auth/SignUpForm';
import { ThemeProvider } from '../../contexts/ThemeContext';

// Simula el hook de validación de contraseña para poder controlar el valor de "isValid"
jest.mock('../../hooks/usePasswordValidation', () => {
  return jest.fn(() => ({ validations: {}, isValid: false }));
});

import usePasswordValidation from '../../hooks/usePasswordValidation';

describe('SignUpForm - pruebas negativas y comportamiento del envío', () => {
  const renderizarFormulario = (props = {}) => {
    const propsPorDefecto = { onSubmit: jest.fn(), isLoading: false, formError: '' };
    return render(
      <MemoryRouter>
        <ThemeProvider>
          <SignUpForm {...propsPorDefecto} {...props} />
        </ThemeProvider>
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    // Reinicia el mock a su valor predeterminado
    usePasswordValidation.mockImplementation(() => ({ validations: {}, isValid: false }));
  });

  test('muestra errores de campos requeridos al enviar vacío y no llama a onSubmit', () => {
    const onSubmit = jest.fn();
    const { container } = renderizarFormulario({ onSubmit });

    // El botón está deshabilitado cuando el formulario está incompleto; se envía directamente
    const formulario = container.querySelector('form');
    fireEvent.submit(formulario);

    expect(screen.getByText(/El nombre de usuario es requerido/i)).toBeInTheDocument();
    expect(screen.getByText(/El correo electrónico es requerido/i)).toBeInTheDocument();
    expect(screen.getByText(/La contraseña es requerida/i)).toBeInTheDocument();
    expect(screen.getByText(/Por favor confirma tu contraseña/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test('muestra error por contraseñas diferentes y evita el envío', () => {
    const onSubmit = jest.fn();
    // Se configura el hook para indicar que la contraseña es válida, de modo que el error sea por no coincidencia
    usePasswordValidation.mockImplementation(() => ({ validations: {}, isValid: true }));
    const { container } = renderizarFormulario({ onSubmit });

    fireEvent.change(screen.getByLabelText(/Usuario/i), { target: { value: 'Alice' } });
    fireEvent.change(screen.getByLabelText(/Correo Electrónico/i), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Crea una contraseña segura/i), { target: { value: 'ValidPass1!' } });
    fireEvent.change(screen.getByPlaceholderText(/Repite tu contraseña/i), { target: { value: 'Different1!' } });

    const formulario = container.querySelector('form');
    fireEvent.submit(formulario);

    expect(screen.getByText(/Las contraseñas no coinciden/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test('muestra error de requisitos de contraseña no cumplidos y evita el envío', () => {
    const onSubmit = jest.fn();
    // Se simula que el hook indica que la contraseña NO es válida
    usePasswordValidation.mockImplementation(() => ({ validations: {}, isValid: false }));
    const { container } = renderizarFormulario({ onSubmit });

    fireEvent.change(screen.getByLabelText(/Usuario/i), { target: { value: 'Bob' } });
    fireEvent.change(screen.getByLabelText(/Correo Electrónico/i), { target: { value: 'bob@site.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Crea una contraseña segura/i), { target: { value: 'weak' } });
    fireEvent.change(screen.getByPlaceholderText(/Repite tu contraseña/i), { target: { value: 'weak' } });

    const formulario = container.querySelector('form');
    fireEvent.submit(formulario);

    expect(screen.getByText(/La contraseña no cumple con los requisitos/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test('llama a onSubmit con los datos cuando todos los campos son válidos', () => {
    const onSubmit = jest.fn();
    usePasswordValidation.mockImplementation(() => ({ validations: {}, isValid: true }));
    const { container } = renderizarFormulario({ onSubmit });

    fireEvent.change(screen.getByLabelText(/Usuario/i), { target: { value: 'Charlie' } });
    fireEvent.change(screen.getByLabelText(/Correo Electrónico/i), { target: { value: 'charlie@ok.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Crea una contraseña segura/i), { target: { value: 'StrongPass1!' } });
    fireEvent.change(screen.getByPlaceholderText(/Repite tu contraseña/i), { target: { value: 'StrongPass1!' } });

    const formulario = container.querySelector('form');
    fireEvent.submit(formulario);

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Charlie',
      email: 'charlie@ok.com',
      password: 'StrongPass1!',
    });
  });
});
