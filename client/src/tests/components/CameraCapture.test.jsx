import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CameraCapture from '../../components/emotion/CameraCapture';

// Mock play since JSDOM doesn't implement it
beforeAll(() => {
  HTMLMediaElement.prototype.play = jest.fn().mockResolvedValue();
});

describe('CameraCapture', () => {
  let originalGetUserMedia;

  beforeEach(() => {
    jest.clearAllMocks();
    originalGetUserMedia = navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
  });

  afterEach(() => {
    // restore
    if (originalGetUserMedia) {
      navigator.mediaDevices.getUserMedia = originalGetUserMedia;
    }
  });

  test('captures a photo and calls onCapture', async () => {
    const mockStream = {
      getTracks: () => [{ kind: 'video', stop: jest.fn() }]
    };

    navigator.mediaDevices = {
      getUserMedia: jest.fn().mockResolvedValue(mockStream)
    };

    // Mock canvas context and toDataURL and provide a mutable video element
    const getContext = jest.fn(() => ({ drawImage: jest.fn() }));
    const toDataURL = jest.fn(() => 'data:image/jpeg;base64,mock');

    const originalCreateElement = document.createElement.bind(document);
    const createSpy = jest.spyOn(document, 'createElement').mockImplementation((tagName) => {
      const el = originalCreateElement(tagName);
      if (tagName === 'canvas') {
        el.getContext = getContext;
        el.toDataURL = toDataURL;
      }
      if (tagName === 'video') {
        // try to make readyState configurable so tests can set it
        try {
          Object.defineProperty(el, 'readyState', { value: 0, configurable: true });
        } catch (e) {
          // ignore if not allowed
        }
        if (!el.play) el.play = HTMLMediaElement.prototype.play || jest.fn().mockResolvedValue();
      }
      return el;
    });

    const onCapture = jest.fn();
    const onCancel = jest.fn();

    try {
      const { container } = render(<CameraCapture onCapture={onCapture} onCancel={onCancel} />);

      // Wait for camera to start (isLoading -> false)
      await waitFor(() => expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled());

      // Ensure capture button appears
      const captureBtn = await screen.findByRole('button', { name: /Capturar/i });

      // Set video readyState and size to simulate ready frame by defining getters
      const video = await waitFor(() => container.querySelector('video'));
      try {
        Object.defineProperty(video, 'readyState', { get: () => 4, configurable: true });
        Object.defineProperty(video, 'videoWidth', { get: () => 640, configurable: true });
        Object.defineProperty(video, 'videoHeight', { get: () => 480, configurable: true });
      } catch (e) {
        // ignore if not allowed; tests may still proceed
      }

      // Click capture
      fireEvent.click(captureBtn);

      // Wait for onCapture to be called after confirm flow
      const continueBtn = await screen.findByRole('button', { name: /Continuar/i });
      fireEvent.click(continueBtn);

      await waitFor(() => expect(onCapture).toHaveBeenCalled());
      expect(onCapture.mock.calls[0][0]).toMatch(/^data:image\/jpeg;base64,/);
    } finally {
      // restore createElement spy to avoid affecting other tests
      if (createSpy && createSpy.mockRestore) createSpy.mockRestore();
    }
  });

  test('shows error and allows retry when getUserMedia fails', async () => {
    // First call rejects, second resolves
    const mockStream = { getTracks: () => [{ kind: 'video', stop: jest.fn() }] };
    const getUserMediaMock = jest.fn()
      .mockRejectedValueOnce(new Error('permission denied'))
      .mockResolvedValueOnce(mockStream);

    navigator.mediaDevices = { getUserMedia: getUserMediaMock };

    const onCapture = jest.fn();
    const onCancel = jest.fn();

    const { container } = render(<CameraCapture onCapture={onCapture} onCancel={onCancel} />);

    // Wait for error UI
    const retry = await screen.findByRole('button', { name: /Reintentar/i });
    expect(retry).toBeInTheDocument();

    // Click retry, should call getUserMedia again and resolve
    fireEvent.click(retry);
    await waitFor(() => expect(getUserMediaMock).toHaveBeenCalledTimes(2));

  // After retry, ensure capture button appears (video presence validated through UI)
  const captureBtn = await screen.findByRole('button', { name: /Capturar/i });
  expect(captureBtn).toBeInTheDocument();
  });
});
// (Duplicate block removed.) The tests above cover capture and retry flows.
