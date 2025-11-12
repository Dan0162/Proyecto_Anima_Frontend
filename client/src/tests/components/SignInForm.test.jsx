import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SignInForm from '../../components/auth/SignInForm';
import { ThemeProvider } from '../../contexts/ThemeContext';

describe('SignInForm - validaciones y envío del formulario', () => {
  const renderizarFormulario = (props = {}) => {
    const propsPorDefecto = { onSubmit: jest.fn(), isLoading: false, formError: '' };
    return render(
      <MemoryRouter>
        <ThemeProvider>
          <SignInForm {...propsPorDefecto} {...props} />
        </ThemeProvider>
      </MemoryRouter>
    );
  };

  test('muestra errores de campos requeridos al enviar el formulario vacío y no llama a onSubmit', () => {
    const onSubmit = jest.fn();
    renderizarFormulario({ onSubmit });

    // Envía el formulario directamente (el botón está deshabilitado cuando el formulario está incompleto)
    const { container } = renderizarFormulario({ onSubmit });
    const formulario = container.querySelector('form');
    fireEvent.submit(formulario);

    expect(screen.getByText(/El correo electrónico es requerido/i)).toBeInTheDocument();
    expect(screen.getByText(/La contraseña es requerida/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test('muestra error por correo electrónico inválido y evita el envío', () => {
    const onSubmit = jest.fn();
    renderizarFormulario({ onSubmit });

    const correo = screen.getByLabelText(/Correo Electrónico/i);
    const contraseña = screen.getByLabelText(/Contraseña/i);
    fireEvent.change(correo, { target: { value: 'correo-no-valido' } });
    fireEvent.change(contraseña, { target: { value: 'validpass' } });

    const botonEnviar = screen.getByRole('button', { name: /iniciar sesión/i });
    fireEvent.click(botonEnviar);

    expect(screen.getByText(/Por favor ingresa un correo electrónico válido/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test('muestra error por contraseña demasiado corta y evita el envío', () => {
    const onSubmit = jest.fn();
    renderizarFormulario({ onSubmit });

    const correo = screen.getByLabelText(/Correo Electrónico/i);
    const contraseña = screen.getByLabelText(/Contraseña/i);
    fireEvent.change(correo, { target: { value: 'usuario@ejemplo.com' } });
    fireEvent.change(contraseña, { target: { value: '123' } });

    const botonEnviar = screen.getByRole('button', { name: /iniciar sesión/i });
    fireEvent.click(botonEnviar);

    expect(screen.getByText(/La contraseña debe tener al menos 6 caracteres/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test('llama a onSubmit con los datos del formulario cuando son válidos', () => {
    const onSubmit = jest.fn();
    renderizarFormulario({ onSubmit });

    const correo = screen.getByLabelText(/Correo Electrónico/i);
    const contraseña = screen.getByLabelText(/Contraseña/i);
    fireEvent.change(correo, { target: { value: 'usuario@ejemplo.com' } });
    fireEvent.change(contraseña, { target: { value: 'miclave123' } });

    const botonEnviar = screen.getByRole('button', { name: /iniciar sesión/i });
    fireEvent.click(botonEnviar);

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      email: 'usuario@ejemplo.com',
      password: 'miclave123',
    });
  });
});
