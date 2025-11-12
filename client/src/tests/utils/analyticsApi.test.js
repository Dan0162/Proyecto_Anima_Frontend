import { saveAnalysisResult } from '../../utils/analyticsApi';
import { authenticatedFetch } from '../../utils/enhancedApi';

// Simula (mock) el helper de la API mejorada para que las pruebas se ejecuten sin conexión y de forma determinista.
jest.mock('../../utils/enhancedApi', () => ({
  authenticatedFetch: jest.fn()
}));

describe('analyticsApi', () => {
  // Restablece/recupera los mocks antes de cada prueba para evitar contaminación entre pruebas.
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  test('saveAnalysisResult llama a authenticatedFetch y maneja el éxito', async () => {
    // Preparación: hace que el mock de authenticatedFetch se resuelva con una respuesta
    // “exitosa”, con una forma similar al objeto Response real del fetch.
    authenticatedFetch.mockResolvedValue({ ok: true, json: async () => ({ id: 1 }) });

    // Acción: llama a la función que se está probando. Aquí pasamos un payload vacío,
    // ya que lo importante es que la función delegue en authenticatedFetch
    // y devuelva la respuesta ya procesada.
    const res = await saveAnalysisResult({});

    // Verificación: la función devolvió un resultado definido y usó el helper.
    expect(res).toBeDefined();
    expect(authenticatedFetch).toHaveBeenCalled();
  });
});
