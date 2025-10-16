import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AuthForm from '../AuthForm';

test('renders auth form and submits', () => {
  const handle = jest.fn((e) => e.preventDefault());
  const fields = [
    { label: 'Email', type: 'email', value: '', onChange: () => {}, name: 'email' }
  ];

  render(<AuthForm title="Test" fields={fields} onSubmit={handle} submitLabel="Go" />);

  expect(screen.getByText('Test')).toBeInTheDocument();
  const btn = screen.getByRole('button', { name: /go/i });
  fireEvent.click(btn);
  expect(handle).toHaveBeenCalled();
});
