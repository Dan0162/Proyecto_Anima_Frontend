import React from 'react';
import { render } from '@testing-library/react';

// Mock useNavigate to assert it is called
const mockedNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockedNavigate,
  };
});

import Homepage from '../../pages/homepage';

test('Homepage redirects to /home/analyze on mount', () => {
  render(<Homepage />);
  expect(mockedNavigate).toHaveBeenCalledWith('/home/analyze');
});
