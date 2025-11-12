import React from 'react';
import { render } from '@testing-library/react';

// Simular useNavigate para verificar que haya sido llamado
const mockedNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockedNavigate,
  };
});

import Homepage from '../../pages/homepage';

test('Homepage redirige a /home/analyze al montarse', () => {
  render(<Homepage />);
  expect(mockedNavigate).toHaveBeenCalledWith('/home/analyze');
});
