import React from 'react';
import { render, screen } from '@testing-library/react';
import SignIn from '../../pages/SignIn';

test('SignIn does not render password requirements or shared toggle', () => {
  const { container } = render(<SignIn />);
  // password requirements block should not be present
  const req = container.querySelector('.password-requirements');
  expect(req).toBeNull();

  // shared toggle should not be present
  const toggle = container.querySelector('.pw-view-btn.shared');
  expect(toggle).toBeNull();
});
