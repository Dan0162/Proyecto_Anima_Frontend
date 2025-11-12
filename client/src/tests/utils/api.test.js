import { handleApiError, getBaseUrl, loginApi } from '../../utils/api';

describe('api utils', () => {
  const OLD_ENV = process.env;
  const originalLocation = window.location;

  beforeEach(() => {
    jest.resetModules(); // limpia la caché del módulo
    process.env = { ...OLD_ENV };
  });

  afterEach(() => {
    process.env = OLD_ENV;
    // restaura la ubicación original
    window.location = originalLocation;
    jest.restoreAllMocks();
  });

  test('handleApiError reconoce AbortError', () => {
    const err = new Error('aborted');
    err.name = 'AbortError';
    const res = handleApiError(err);
    expect(res.userMessage).toMatch(/tard[oó] demasiado tiempo/i);
    expect(res.technicalMessage).toBe('Request timeout');
  });

  test('handleApiError reconoce "Failed to fetch"', () => {
    const err = new Error('Failed to fetch');
    const res = handleApiError(err);
    expect(res.userMessage).toMatch(/No se puede conectar/i);
    expect(res.technicalMessage).toBe('Network error');
  });

  test('handleApiError reconoce la subcadena "NetworkError"', () => {
    const err = new Error('Some NetworkError occurred');
    const res = handleApiError(err);
    expect(res.userMessage).toMatch(/Error de red/i);
  });

  test('getBaseUrl usa REACT_APP_API_URL cuando está definida', () => {
    process.env.REACT_APP_API_URL = 'https://example.com';
    const base = getBaseUrl();
    expect(base).toBe('https://example.com');
  });

  test('loginApi llama a fetch usando la base de REACT_APP_API_URL', async () => {
    process.env.REACT_APP_API_URL = 'https://example.com';
    // Ensure any specialized login URL from the environment does not override the test
    delete process.env.REACT_APP_LOGIN_URL;

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
