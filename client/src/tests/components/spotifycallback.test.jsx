import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SpotifyCallback from '../../pages/home/SpotifyCallback';

test('SpotifyCallback handles token storage', () => {
  // create a dummy state with token
  const state = encodeURIComponent(JSON.stringify({ access_token: 'abc123' }));
  render(
    <MemoryRouter initialEntries={[`/spotify-callback?state=${state}`]}>
      <SpotifyCallback />
    </MemoryRouter>
  );
});
