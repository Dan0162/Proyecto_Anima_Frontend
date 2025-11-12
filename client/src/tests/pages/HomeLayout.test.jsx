import React from 'react';
import { render, screen } from '@testing-library/react';
import HomeLayout from '../../pages/home/HomeLayout';

// Mock child components to keep the test focused and fast
jest.mock('../../components/navbar/HomeNavbar', () => () => <div>HomeNavbarMock</div>);
jest.mock('../../components/sidebar/Sidebar', () => () => <div>SidebarMock</div>);

describe('HomeLayout', () => {
  test('renders navbar and sidebar placeholders', () => {
    render(<HomeLayout />);

    expect(screen.getByText(/HomeNavbarMock/i)).toBeInTheDocument();
    expect(screen.getByText(/SidebarMock/i)).toBeInTheDocument();
  });
});
