import sha256Hex from '../../utils/hash';

describe('sha256Hex', () => {
  const originalCrypto = global.crypto;

  afterEach(() => {
    // restore original crypto
    global.crypto = originalCrypto;
    jest.restoreAllMocks();
  });

  test('returns hex for provided ArrayBuffer from subtle.digest', async () => {
    // Fake digest to return a predictable byte array [1,2,3,4]
    const fakeBytes = new Uint8Array([1, 2, 3, 4]);
    const fakeSubtle = {
      digest: jest.fn(() => Promise.resolve(fakeBytes.buffer))
    };

    global.crypto = { subtle: fakeSubtle };

    const hex = await sha256Hex('anything');

    expect(fakeSubtle.digest).toHaveBeenCalledWith('SHA-256', expect.any(Uint8Array));
    expect(hex).toBe('01020304');
  });
});
