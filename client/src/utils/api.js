// utils/fetchWithTimeout.js
export const fetchWithTimeout = async (url, options = {}, timeout = 8000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error('La solicitud tardó demasiado tiempo. Por favor intenta de nuevo.');
    }
    throw error;
  }
};

// utils/api.js
export const handleApiError = (error) => {
  console.error('API Error:', error);
  
  if (error.name === 'AbortError') {
    return {
      userMessage: 'La solicitud tardó demasiado tiempo. Verifica tu conexión e intenta de nuevo.',
      technicalMessage: 'Request timeout'
    };
  }
  
  if (error.message.includes('Failed to fetch')) {
    return {
      userMessage: 'No se puede conectar con el servidor. Verifica tu conexión a internet.',
      technicalMessage: 'Network error'
    };
  }
  
  if (error.message.includes('NetworkError')) {
    return {
      userMessage: 'Error de red. Por favor verifica tu conexión.',
      technicalMessage: 'Network error'
    };
  }
  
  return {
    userMessage: 'Ha ocurrido un error inesperado. Por favor intenta de nuevo.',
    technicalMessage: error.message
  };
};

export const getBaseUrl = () => {
  let base = process.env.REACT_APP_API_URL || '';
  try {
    if (!base && typeof window !== 'undefined' && window.location.hostname.includes('localhost')) {
      base = 'http://127.0.0.1:8000';
    }
  } catch (e) {
    console.error('Error getting base URL:', e);
  }
  return base;
};

export const loginApi = async (formData) => {
  try {
    const url = `${getBaseUrl()}/v1/auth/login`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      throw new Error('No se puede conectar con el servidor.');
    }
    throw error;
  }
};

export const registerApi = async (formData) => {
  try {
    const url = `${getBaseUrl()}/v1/auth/register`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      throw new Error('No se puede conectar con el servidor. Por favor, intenta más tarde.');    
    }
    throw error;
  }
};

/**
 * Obtener información del usuario autenticado actual
 * @returns {Promise} Datos del usuario (id, nombre, email)
 */
// In-flight request and cache for current user to avoid duplicate calls
let __currentUserInFlight = null;
let __currentUserCache = null;
let __currentUserCacheTs = 0;
const __USER_TTL_MS = 5000; // 5s cache window

export const clearCurrentUserCache = () => {
  __currentUserInFlight = null;
  __currentUserCache = null;
  __currentUserCacheTs = 0;
};

export const getCurrentUserApi = async () => {
  try {
    const url = `${getBaseUrl()}/v1/auth/me`;
    // Serve from cache if fresh
    if (__currentUserCache && (Date.now() - __currentUserCacheTs) < __USER_TTL_MS) {
      return __currentUserCache;
    }
    // Share in-flight request to dedupe concurrent calls
    if (__currentUserInFlight) {
      return await __currentUserInFlight;
    }

    __currentUserInFlight = (async () => {
      const response = await fetchWithTimeout(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('access_token');
          throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      __currentUserCache = data;
      __currentUserCacheTs = Date.now();
      return data;
    })();

    const result = await __currentUserInFlight;
    __currentUserInFlight = null;
    return result;
  } catch (error) {
    if (error.message.includes('Sesión expirada')) {
      throw error;
    }
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      throw new Error('No se puede conectar con el servidor.');
    }
    __currentUserInFlight = null;
    throw error;
  }
};

// ========================================
// 🆕 NUEVAS FUNCIONES PARA ANÁLISIS DE IMAGEN
// ========================================

// Obtener token JWT del localStorage
const getAuthToken = () => {
  return localStorage.getItem('access_token');
};

// Crear headers con autenticación
const getAuthHeaders = () => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No hay token de autenticación. Por favor, inicia sesión nuevamente.');
  }
  return {
    'Authorization': `Bearer ${token}`
  };
};

/**
 * Enviar imagen en Base64 para análisis de emoción
 * @param {string} imageBase64 - Imagen en formato Base64 (data:image/jpeg;base64,...)
 * @returns {Promise} Resultado del análisis
 */
export const analyzeEmotionBase64 = async (imageBase64) => {
  try {
    const url = `${getBaseUrl()}/v1/analysis/analyze-base64`;
    const response = await fetchWithTimeout(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ image: imageBase64 })
    }, 15000); // 15 segundos de timeout para análisis

    if (!response.ok) {
      // Manejar token expirado
      if (response.status === 401) {
        localStorage.removeItem('access_token');
        throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
      }
      
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    if (error.message.includes('Sesión expirada')) {
      throw error;
    }
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      throw new Error('No se puede conectar con el servidor.');
    }
    throw error;
  }
};

/**
 * Enviar imagen como archivo (File/Blob) para análisis de emoción
 * @param {File|Blob} imageFile - Archivo de imagen
 * @returns {Promise} Resultado del análisis
 */
export const analyzeEmotionFile = async (imageFile) => {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);

    const url = `${getBaseUrl()}/v1/analysis/analyze`;
    const response = await fetchWithTimeout(url, {
      method: 'POST',
      headers: {
        ...getAuthHeaders()
        // No incluir Content-Type; fetch lo establece automáticamente para FormData
      },
      body: formData
    }, 15000);

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('access_token');
        throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
      }
      
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    if (error.message.includes('Sesión expirada')) {
      throw error;
    }
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      throw new Error('No se puede conectar con el servidor.');
    }
    throw error;
  }
};