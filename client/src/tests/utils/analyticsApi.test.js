import { saveAnalysisResult } from '../../utils/analyticsApi';
import { authenticatedFetch } from '../../utils/enhancedApi';

jest.mock('../../utils/enhancedApi', () => ({
  authenticatedFetch: jest.fn()
}));

describe('analyticsApi', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  test('saveAnalysisResult calls authenticatedFetch and handles success', async () => {
    authenticatedFetch.mockResolvedValue({ ok: true, json: async () => ({ id: 1 }) });
    const res = await saveAnalysisResult({});
    expect(res).toBeDefined();
    expect(authenticatedFetch).toHaveBeenCalled();
  });
});
