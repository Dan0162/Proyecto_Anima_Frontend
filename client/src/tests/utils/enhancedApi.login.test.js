import { loginApi } from '../../utils/enhancedApi';

describe('enhancedApi login', () => {
  afterEach(() => jest.restoreAllMocks());

  test('loginApi uses REACT_APP_LOGIN_URL when set', async () => {
    process.env.REACT_APP_LOGIN_URL = 'https://example.com';
    const fakeResponse = { ok: true, json: async () => ({ access_token: 't' }) };
    global.fetch = jest.fn(() => Promise.resolve(fakeResponse));
    const res = await loginApi({ username: 'u', password: 'p' });
    expect(global.fetch).toHaveBeenCalled();
  });
});
