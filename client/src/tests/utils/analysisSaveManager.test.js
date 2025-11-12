import analysisSaveManager from '../../utils/analysisSaveManager';

describe('analysisSaveManager', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.restoreAllMocks();
  });

  test('evita guardar duplicados', async () => {
    const analisis = { emotion: 'happy', confidence: 0.9, timestamp: Date.now() };
    let calls = 0;
    const funcionGuardar = async () => { 
      calls += 1; 
      return { ok: true }; 
    };

    // Primera llamada → se guarda correctamente
    await analysisSaveManager.saveAnalysisSafe(analisis, funcionGuardar);
    expect(calls).toBe(1);

    // Segunda llamada inmediata → se omite
    const resultado = await analysisSaveManager.saveAnalysisSafe(analisis, funcionGuardar);
    expect(resultado).toMatchObject({ success: true, message: 'Analysis already saved' });
    expect(calls).toBe(1);
  });

  test('propaga errores al guardar y limpia el estado pendiente', async () => {
    const analisis = { emotion: 'sad', confidence: 0.1, timestamp: Date.now() };
    const funcionGuardar = jest.fn().mockRejectedValue(new Error('fail'));

    await expect(analysisSaveManager.saveAnalysisSafe(analisis, funcionGuardar))
      .rejects.toThrow('fail');

    // Después del error, debería ser posible intentar nuevamente (pendiente limpiado)
    expect(analysisSaveManager.isAlreadySaved(analisis)).toBe(false);
  });
});
