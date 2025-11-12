import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../../contexts/ThemeContext';

import DashboardPage from '../../pages/home/DashboardPage';
import * as AuthHook from '../../hooks/useAuth';
import * as AnalyticsApi from '../../utils/analyticsApi';

describe('DashboardPage', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  test('renders dashboard with user greeting and stats', async () => {
    jest.spyOn(AuthHook, 'useCurrentUser').mockReturnValue({ user: { nombre: 'Dana' } });

    const fakeStats = {
      total_analyses: 5,
      most_frequent_emotion: 'happy',
      average_confidence: 0.87,
      streak: 4,
      emotions_distribution: [],
      weekly_activity: [],
      hourly_activity: new Array(24).fill(0),
      weekly_emotions: [],
      positive_negative_balance: { positive: 3, negative: 1 }
    };

    jest.spyOn(AnalyticsApi, 'getUserStats').mockResolvedValue(fakeStats);

    render(
      <ThemeProvider>
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      </ThemeProvider>
    );

    // Title should render immediately
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();

    // Wait for stats to load and appear
    await waitFor(() => expect(screen.getByText(/Análisis Totales/i)).toBeInTheDocument());
    expect(screen.getByText('5')).toBeInTheDocument();
  });
});
