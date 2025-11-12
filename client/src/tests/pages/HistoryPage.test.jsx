import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../../contexts/ThemeContext';

// Mock the analytics API used by the HistoryPage
import * as AnalyticsApi from '../../utils/analyticsApi';
import HistoryPage from '../../pages/home/HistoryPage';

describe('HistoryPage', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  test('renders history items when API returns analyses', async () => {
    const fakeAnalyses = [
      {
        id: 'a1',
        emotion: 'happy',
        confidence: 0.92,
        date: new Date().toISOString(),
        recommendations: []
      }
    ];

    jest.spyOn(AnalyticsApi, 'getUserHistory').mockResolvedValue({ analyses: fakeAnalyses });

    render(
      <ThemeProvider>
        <MemoryRouter>
          <HistoryPage />
        </MemoryRouter>
      </ThemeProvider>
    );

    // The page title should render
    expect(screen.getByText(/Tu Historial/i)).toBeInTheDocument();

    // Wait for the mocked data to be processed and the details button to appear
    await waitFor(() => expect(screen.getByText(/Ver Detalles/i)).toBeInTheDocument());
  });
});
