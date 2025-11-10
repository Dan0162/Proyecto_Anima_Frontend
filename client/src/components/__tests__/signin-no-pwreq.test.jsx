import React from 'react';
import { render, screen } from '@testing-library/react';
import SignIn from '../../pages/SignIn';

// Polyfill matchMedia for ThemeProvider used within SignIn
beforeAll(() => {
  if (!window.matchMedia) {
    window.matchMedia = (query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    });
  }
});

test('SignIn does not render password requirements or shared toggle', () => {
  const { container } = render(<SignIn />);
  // password requirements block should not be present
  const req = container.querySelector('.password-requirements');
  expect(req).toBeNull();

  // shared toggle should not be present
  const toggle = container.querySelector('.pw-view-btn.shared');
  expect(toggle).toBeNull();
});
