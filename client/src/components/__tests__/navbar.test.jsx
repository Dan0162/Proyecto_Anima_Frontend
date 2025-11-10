import { render, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navbar from '../navbar';
import { ThemeProvider } from '../../contexts/ThemeContext';

// Mock LOGO_SRC to avoid missing import during test
jest.mock('../../constants/assets', () => ({ LOGO_SRC: '/logo.png' }));

const renderWithProviders = (ui, { route = '/' } = {}) => {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <ThemeProvider>
        {ui}
      </ThemeProvider>
    </MemoryRouter>
  );
};

// Polyfill matchMedia for ThemeProvider
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

describe('Navbar mobile interactions', () => {
  test('clicking backdrop closes menu', () => {
  const { container, getByLabelText } = renderWithProviders(<Navbar />);
    const burger = getByLabelText(/toggle navigation/i);

    // open menu
    fireEvent.click(burger);
    const backdrop = container.querySelector('.mobile-backdrop');
    expect(backdrop.classList.contains('open')).toBe(true);

    // click backdrop
    fireEvent.click(backdrop);
    expect(backdrop.classList.contains('open')).toBe(false);
  });

  test('pressing Escape closes menu', () => {
  const { container, getByLabelText } = renderWithProviders(<Navbar />);
    const burger = getByLabelText(/toggle navigation/i);

    // open menu
    fireEvent.click(burger);
    const dropdown = container.querySelector('.mobile-dropdown');
    expect(dropdown.classList.contains('open')).toBe(true);

    // press Escape
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
    expect(dropdown.classList.contains('open')).toBe(false);
  });
});
