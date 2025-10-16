import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

test('renders homepage heading', () => {
  render(<MemoryRouter><App /></MemoryRouter>);
  const heading = screen.getByText(/welcome to the landing page/i);
  expect(heading).toBeInTheDocument();
});
