import { handleApiError, getBaseUrl, loginApi } from '../../utils/api';

describe('api utils', () => {
  const OLD_ENV = process.env;
  const originalLocation = window.location;

  beforeEach(() => {
    jest.resetModules(); // clear module cache
    process.env = { ...OLD_ENV };
  });

  afterEach(() => {
    process.env = OLD_ENV;
    // restore location
    window.location = originalLocation;
    jest.restoreAllMocks();
  });

  test('handleApiError recognizes AbortError', () => {
    const err = new Error('aborted');
    err.name = 'AbortError';
    const res = handleApiError(err);
    expect(res.userMessage).toMatch(/tard[oó] demasiado tiempo/i);
    expect(res.technicalMessage).toBe('Request timeout');
  });

  test('handleApiError recognizes Failed to fetch', () => {
    const err = new Error('Failed to fetch');
    const res = handleApiError(err);
    expect(res.userMessage).toMatch(/No se puede conectar/i);
    expect(res.technicalMessage).toBe('Network error');
  });

  test('handleApiError recognizes NetworkError substring', () => {
    const err = new Error('Some NetworkError occurred');
    const res = handleApiError(err);
    expect(res.userMessage).toMatch(/Error de red/i);
  });

  test('getBaseUrl uses REACT_APP_API_URL when set', () => {
    process.env.REACT_APP_API_URL = 'https://example.com';
    const base = getBaseUrl();
    expect(base).toBe('https://example.com');
  });

  test('getBaseUrl falls back to 127.0.0.1 in dev when hostname is localhost', () => {
    // unset env
    delete process.env.REACT_APP_API_URL;
    // ensure NODE_ENV is not production
    process.env.NODE_ENV = 'development';
    // mock window.location.hostname
    delete window.location;
    window.location = { hostname: 'localhost' };

    const base = getBaseUrl();
    expect(base).toBe('http://127.0.0.1:8000');
  });

  test('loginApi calls fetch with REACT_APP_API_URL base', async () => {
    process.env.REACT_APP_API_URL = 'https://example.com';

    const fakeResponse = {
      ok: true,
      json: async () => ({ token: 'x' })
    };

    global.fetch = jest.fn(() => Promise.resolve(fakeResponse));

    const payload = { username: 'u', password: 'p' };
    const res = await loginApi(payload);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const calledUrl = global.fetch.mock.calls[0][0];
    const calledOptions = global.fetch.mock.calls[0][1];
    expect(calledUrl).toBe('https://example.com/v1/auth/login');
    expect(calledOptions.method).toBe('POST');
    expect(calledOptions.headers['Content-Type']).toBe('application/json');
    expect(res).toEqual({ token: 'x' });
  });
});
