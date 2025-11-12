import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AuthForm from '../../components/AuthForm';

// Prueba que renderiza el formulario de autenticación y lo envía
test('renderiza el formulario de autenticación y envía los datos', () => {
  const manejarEnvio = jest.fn((e) => e.preventDefault());
  const campos = [
    { label: 'Correo electrónico', type: 'email', value: '', onChange: () => {}, name: 'email' }
  ];

  render(<AuthForm title="Prueba" fields={campos} onSubmit={manejarEnvio} submitLabel="Enviar" />);

  expect(screen.getByText('Prueba')).toBeInTheDocument();
  const boton = screen.getByRole('button', { name: /enviar/i });
  fireEvent.click(boton);
  expect(manejarEnvio).toHaveBeenCalled();
});
