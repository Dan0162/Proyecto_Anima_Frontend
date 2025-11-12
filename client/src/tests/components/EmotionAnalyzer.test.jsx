import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock child components to control interactions and provide test ids
jest.mock('../../components/emotion/CameraCapture', () => (props) => (
  <div data-testid="mock-camera-capture">
    <button onClick={() => props.onCapture && props.onCapture('data:mock')}>_mock_capture</button>
    <button onClick={() => props.onCancel && props.onCancel()}>_mock_cancel</button>
  </div>
));

jest.mock('../../components/emotion/PhotoUpload', () => (props) => (
  <div data-testid="mock-photo-upload">
    <button onClick={() => props.onUpload && props.onUpload('data:upload')}>_mock_upload</button>
    <button onClick={() => props.onCancel && props.onCancel()}>_mock_cancel</button>
  </div>
));

// Mocks for utilities and hooks
jest.mock('../../utils/enhancedApi', () => ({ analyzeEmotionBase64: jest.fn() }));
jest.mock('../../utils/analyticsApi', () => ({ saveAnalysisResult: jest.fn() }));
jest.mock('../../utils/analysisSaveManager', () => ({ saveAnalysisSafe: jest.fn() }));
jest.mock('../../components/flash/FlashContext', () => ({ useFlash: () => ({ show: jest.fn() }) }));
jest.mock('../../hooks/useAuth', () => ({ useCurrentUser: () => ({ user: { nombre: 'Prueba' } }) }));

import EmotionAnalyzer from '../../components/emotion/EmotionAnalyzer';

describe('EmotionAnalyzer - mode switching', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    // Default fetch mock: spotify status returns connected=true so options are enabled
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ connected: true }) });
    // Simulate existing spotify jwt so the component performs the status check
    localStorage.setItem('spotify_jwt', 'fake-jwt');
  });

  afterEach(() => {
    jest.restoreAllMocks();
    localStorage.removeItem('spotify_jwt');
  });

  test('when spotifyConnected true, clicking upload option renders PhotoUpload', async () => {
    render(
      <MemoryRouter>
        <EmotionAnalyzer />
      </MemoryRouter>
    );

    // Wait for the initial spotify status check to resolve and enable buttons
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    // Ensure the upload option is enabled (aria-disabled=false)
    const uploadButton = screen.getByText(/Sube una foto/i).closest('[role="button"]');
    await waitFor(() => expect(uploadButton).not.toHaveAttribute('aria-disabled', 'true'));

    // Click the upload button to switch to upload mode
    fireEvent.click(uploadButton);

    // PhotoUpload mock should appear
    expect(await screen.findByTestId('mock-photo-upload')).toBeInTheDocument();
  });
});
