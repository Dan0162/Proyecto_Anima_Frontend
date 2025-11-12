import analysisSaveManager from '../../utils/analysisSaveManager';

describe('analysisSaveManager', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.restoreAllMocks();
  });

  test('prevents duplicate saves', async () => {
    const analysis = { emotion: 'happy', confidence: 0.9, timestamp: Date.now() };
    let calls = 0;
    const saveFn = async () => { calls += 1; return { ok: true }; };
    // First call -> saved
    await analysisSaveManager.saveAnalysisSafe(analysis, saveFn);
    expect(calls).toBe(1);
    // Second immediate call -> skipped
    const res = await analysisSaveManager.saveAnalysisSafe(analysis, saveFn);
    expect(res).toMatchObject({ success: true, message: 'Analysis already saved' });
    expect(calls).toBe(1);
  });

  test('propagates save errors and clears pending', async () => {
    const analysis = { emotion: 'sad', confidence: 0.1, timestamp: Date.now() };
    const saveFn = jest.fn().mockRejectedValue(new Error('fail'));
    await expect(analysisSaveManager.saveAnalysisSafe(analysis, saveFn)).rejects.toThrow('fail');
    // After error, we should be able to try again (pending cleared)
    expect(analysisSaveManager.isAlreadySaved(analysis)).toBe(false);
  });
});
