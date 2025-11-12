import { authenticatedFetch } from './enhancedApi';
import tokenManager from './tokenManager';
const API_BASE_URL = tokenManager.getBaseUrl();

/**
 * Guarda el resultado de un análisis de emoción en la base de datos
 * @param {Object} analysisData - Datos del análisis
 * @returns {Promise<Object>} - Resultado del guardado
 */
export const saveAnalysisResult = async (analysisData) => {
  try {
    // Delegate to authenticatedFetch so callers/tests can mock authenticatedFetch
    console.log('📡 Enviando análisis a guardar (delegando a authenticatedFetch):', {
      emotion: analysisData.emotion,
      confidence: analysisData.confidence,
      recommendationsCount: analysisData.recommendations?.length || 0
    });

    const response = await authenticatedFetch(`${API_BASE_URL}/v1/analytics/save-analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(analysisData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      if (response.status === 401) {
        throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
      }
      throw new Error(errorData.detail || 'Error al guardar el análisis');
    }

    const result = await response.json();
    console.log('✅ Análisis guardado correctamente:', result);
    return result;
  } catch (error) {
    console.error('❌ Error en saveAnalysisResult:', error);
    throw error;
  }
};

/**
 * Obtiene el historial de análisis del usuario
 * @param {string} emotionFilter - Filtro por emoción (opcional)
 * @returns {Promise<Object>} - Historial de análisis
 */
export const getUserHistory = async (emotionFilter = null) => {
  try {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      throw new Error('Token de autenticación no encontrado');
    }

    let url = `${API_BASE_URL}/v1/analytics/history`;
    
    if (emotionFilter && emotionFilter !== 'all') {
      url += `?emotion_filter=${encodeURIComponent(emotionFilter)}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Client-Timezone': Intl.DateTimeFormat().resolvedOptions().timeZone
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      
      if (response.status === 401) {
        throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
      }
      
      throw new Error(errorData.detail || 'Error al obtener el historial');
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Error en getUserHistory:', error);
    throw error;
  }
};

/**
 * Obtiene las estadísticas del usuario para el dashboard
 * @returns {Promise<Object>} - Estadísticas del usuario
 */
export const getUserStats = async () => {
  try {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      throw new Error('Token de autenticación no encontrado');
    }

    const response = await fetch(`${API_BASE_URL}/v1/analytics/stats`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Client-Timezone': Intl.DateTimeFormat().resolvedOptions().timeZone
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      
      if (response.status === 401) {
        throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
      }
      
      throw new Error(errorData.detail || 'Error al obtener estadísticas');
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Error en getUserStats:', error);
    throw error;
  }
};

/**
 * Obtiene los detalles de un análisis específico
 * @param {string} analysisId - ID del análisis
 * @returns {Promise<Object>} - Detalles del análisis
 */
export const getAnalysisDetails = async (analysisId) => {
  try {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      throw new Error('Token de autenticación no encontrado');
    }

    const response = await fetch(`${API_BASE_URL}/v1/analytics/analysis/${analysisId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      
      if (response.status === 401) {
        throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
      }
      
      if (response.status === 404) {
        throw new Error('Análisis no encontrado');
      }
      
      throw new Error(errorData.detail || 'Error al obtener detalles del análisis');
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Error en getAnalysisDetails:', error);
    throw error;
  }
};

// Backwards-compatible alias: older components import getUserProfileStats
// but the canonical name is getUserStats. Export an alias to avoid breaking
// imports across the codebase.
export const getUserProfileStats = getUserStats;