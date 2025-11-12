import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PhotoUpload from '../../components/emotion/PhotoUpload';

describe('PhotoUpload component', () => {
  beforeEach(() => {
    // Mock FileReader globally so tests can simulate loading
    class MockFileReader {
      constructor() {
        this.onloadend = null;
        this.result = null;
      }
      readAsDataURL(file) {
        // simulate async load
        this.result = 'data:image/png;base64,dummydata';
        setTimeout(() => {
          if (this.onloadend) this.onloadend();
        }, 0);
      }
    }

    // @ts-ignore
    global.FileReader = MockFileReader;
  });

  test('renders dropzone and allows file selection -> shows preview and calls onUpload', async () => {
    const onUpload = jest.fn();
    const onCancel = jest.fn();

    const { container } = render(
      <PhotoUpload onUpload={onUpload} onCancel={onCancel} spotifyConnected={true} />
    );

    // Dropzone visible
    expect(screen.getByText(/Arrastra tu foto aquí/i)).toBeInTheDocument();

    // Find hidden file input and simulate a file selection
    const input = container.querySelector('input[type="file"]');
    expect(input).toBeTruthy();

    const file = new File(['abc'], 'photo.png', { type: 'image/png' });

    // Fire change event
    fireEvent.change(input, { target: { files: [file] } });

    // Wait for the FileReader mock to call onloadend and component to update
    await waitFor(() => expect(screen.getByAltText(/Foto seleccionada/i)).toBeInTheDocument());

    // 'Continuar' button should be present after preview
    const continuar = screen.getByRole('button', { name: /Continuar/i });
    expect(continuar).toBeInTheDocument();

    // Click continuar should call onUpload with the preview data URL
    fireEvent.click(continuar);
    await waitFor(() => expect(onUpload).toHaveBeenCalledWith('data:image/png;base64,dummydata'));
  });
});
