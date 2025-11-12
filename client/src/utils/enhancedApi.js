/**
 * Enhanced API utility with automatic token refresh and retry logic
 */

import tokenManager from './tokenManager';

// Fetch with timeout
export const fetchWithTimeout = async (url, options = {}, timeout = 20000) => {
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

// Get base URL
export const getBaseUrl = () => {
  return tokenManager.getBaseUrl();
};

/**
 * Enhanced fetch with automatic token refresh
 * @param {string} url - API endpoint URL
 * @param {Object} options - Fetch options
 * @param {boolean} requiresAuth - Whether this endpoint requires authentication
 * @param {number} retries - Number of retry attempts for token refresh
 */
export const authenticatedFetch = async (url, options = {}, requiresAuth = true, retries = 1, timeout = 20000) => {
  if (!requiresAuth) {
    return fetchWithTimeout(url, options, timeout);
  }

  try {
    // Get valid token (will refresh if needed)
    const token = await tokenManager.getValidAccessToken();
    
    // Add authorization header
    const authOptions = {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`
      }
    };

  const response = await fetchWithTimeout(url, authOptions, timeout);

    // If we get 401, it may be either (A) token expiry or (B) a business-level
    // rejection (e.g. "Contraseña actual incorrecta"). Attempt to inspect the
    // response body to decide. If it's clearly a business rejection, return the
    // response so the caller can handle it (avoid forcing a redirect). Otherwise
    // treat as token expiry and try to refresh.
    if (response.status === 401 && retries > 0) {
      let body = null;
      try {
        body = await response.clone().json();
      } catch (e) {
        // ignore parse errors
      }
      const detail = (body && (body.detail || body.message || '')) || '';
      const low = String(detail).toLowerCase();

      // If the detail message exists and doesn't look like a token/session issue,
      // assume this is a business rejection (e.g. incorrect password) and return
      // the response so callers can display inline errors instead of redirecting.
      if (detail && !(low.includes('sesión') || low.includes('session') || low.includes('token') || low.includes('expir'))) {
        return response;
      }

      console.log('⚠️ Got 401, attempting token refresh and retry...');

      // Force token refresh
      try {
        await tokenManager.refreshAccessToken();
        // Retry the request with new token
        return authenticatedFetch(url, options, requiresAuth, retries - 1);
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);

        // Clear tokens and redirect to login
        tokenManager.clearAllTokens();
        window.location.href = '/signin';
        throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
      }
    }

    return response;
    
  } catch (error) {
    if (error.message === 'NO_TOKEN') {
      window.location.href = '/signin';
      throw new Error('No estás autenticado. Por favor, inicia sesión.');
    }
    throw error;
  }
};

/**
 * Handle API errors consistently
 */
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

// ========================================
// AUTHENTICATION APIs
// ========================================

/**
 * Login and store tokens
 */

export const loginApi = async (formData) => {
  try {
  // Prefer a dedicated login URL when provided, otherwise use localhost (useful for local dev)
  // Keep REACT_APP_LOGIN_URL if set so CI / deployed envs can override.
  const loginBase = 'http://localhost:8000';
    const url = `${loginBase}/v1/auth/login`;
    // Use fetchWithTimeout to avoid hanging requests; choose a reasonable timeout for login
    const LOGIN_TIMEOUT_MS = 10000; // 10 seconds
    const t0 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    const response = await fetchWithTimeout(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    }, LOGIN_TIMEOUT_MS);
    const t1 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    try {
      // Log client-side timing for the login request to help diagnose latency
      console.log(`[loginApi] fetch duration: ${(t1 - t0).toFixed(1)} ms, status: ${response.status}`);
    } catch (e) {}

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Store tokens using token manager
    if (data.access_token) {
      tokenManager.setAccessToken(data.access_token, data.expires_in || 3600);
    }
    if (data.refresh_token) {
      tokenManager.setRefreshToken(data.refresh_token);
    }

    // Store session_id and user_name in localStorage for later use
    if (data.session_id) {
      localStorage.setItem('session_id', data.session_id);
    }
    if (data.user_name) {
      localStorage.setItem('user_name', data.user_name);
    }

    return data;
  } catch (error) {
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      throw new Error('No se puede conectar con el servidor.');
    }
    throw error;
  }
};

/**
 * Register new user
 */
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
 * Logout user
 */

export const logoutApi = async () => {
  try {
    // Get session_id from localStorage
    const session_id = localStorage.getItem('session_id');
    if (session_id) {
      const url = `${getBaseUrl()}/v1/auth/logout`;
      await authenticatedFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: Number(session_id) })
      });
    }
  } catch (error) {
    console.error('Logout API call failed:', error);
    // Continue with local logout even if API call fails
  } finally {
    // Clear all tokens and session_id
    // Preserve Spotify token so user doesn't need to reconnect after a normal logout/login
    tokenManager.clearAllTokens(true);
    localStorage.removeItem('session_id');
  }
};

// ========================================
// USER APIs
// ========================================

// Cache for current user
let __currentUserCache = null;
let __currentUserCacheTs = 0;
const __USER_TTL_MS = 5000;

export const clearCurrentUserCache = () => {
  __currentUserCache = null;
  __currentUserCacheTs = 0;
};

/**
 * Get current user information
 */
export const getCurrentUserApi = async () => {
  try {
    // Return cached data if fresh
    if (__currentUserCache && (Date.now() - __currentUserCacheTs) < __USER_TTL_MS) {
      return __currentUserCache;
    }

    const url = `${getBaseUrl()}/v1/auth/me`;
    const response = await authenticatedFetch(url, { method: 'GET' });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    __currentUserCache = data;
    __currentUserCacheTs = Date.now();
    
    return data;
  } catch (error) {
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      throw new Error('No se puede conectar con el servidor.');
    }
    throw error;
  }
};

/**
 * Update user profile
 */
export const updateUserProfileApi = async (userData) => {
  try {
    const url = `${getBaseUrl()}/v1/user/profile`;
    const response = await authenticatedFetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
    }

    // Clear cache after update
    clearCurrentUserCache();
    
    return response.json();
  } catch (error) {
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      throw new Error('No se puede conectar con el servidor.');
    }
    throw error;
  }
};

/**
 * Change user password
 */
export const changePasswordApi = async (passwordData) => {
  // Client-side guard: prevent sending request if new and current passwords match
  try {
    if (passwordData.new_password && passwordData.current_password && passwordData.new_password === passwordData.current_password) {
      throw new Error('La nueva contraseña no puede ser igual a la actual');
    }
  } catch (e) {
    // Re-throw to be handled by caller
    throw e;
  }
  try {
    const url = `${getBaseUrl()}/v1/user/change-password`;
    const response = await authenticatedFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(passwordData)
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

// ========================================
// EMOTION ANALYSIS APIs
// ========================================

/**
 * Analyze emotion from base64 image
 */
export const analyzeEmotionBase64 = async (imageBase64, timezone = null) => {
  try {
    // Obtener ambos tokens
    const accessToken = localStorage.getItem('access_token');
    const spotifyJwt = localStorage.getItem('spotify_jwt');
    
    console.log('🔐 Tokens disponibles para análisis:');
    console.log(`   - Access token: ${accessToken ? 'Disponible' : 'No disponible'}`);
    console.log(`   - Spotify JWT: ${spotifyJwt ? 'Disponible' : 'No disponible'}`);
    
    if (!accessToken) {
      throw new Error('Token de autenticación no encontrado');
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    };
    
    // 🆕 Agregar JWT de Spotify como header adicional si está disponible
    if (spotifyJwt) {
      headers['X-Spotify-Token'] = `Bearer ${spotifyJwt}`;
      console.log('✅ JWT de Spotify agregado a headers');
    } else {
      console.log('⚠️ JWT de Spotify no disponible - recomendaciones no se obtendrán');
    }

    if (timezone) {
      headers['X-Client-Timezone'] = timezone;
    }

    const response = await fetch(`${getBaseUrl()}/v1/analysis/analyze-base64`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        image: imageBase64,
        timezone: timezone
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      
      if (response.status === 401) {
        throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
      }
      
      throw new Error(errorData.detail || 'Error en el análisis de emoción');
    }

    const result = await response.json();
    console.log('📊 Resultado del análisis recibido:', result);
    console.log(`🎵 Recomendaciones en resultado: ${result.recommendations?.length || 0}`);
    
    return result;
  } catch (error) {
    console.error('❌ Error en analyzeEmotionBase64:', error);
    throw error;
  }
};

/**
 * Analyze emotion from file
 */
export const analyzeEmotionFile = async (imageFile) => {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);

    const url = `${getBaseUrl()}/v1/analysis/analyze`;
    // Include client's timezone as header so server can localize timestamps if needed
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || null;
    const response = await authenticatedFetch(url, {
      method: 'POST',
      body: formData,
      headers: tz ? { 'X-Client-Timezone': tz } : {}
    }, true, 1);

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

// Export token manager for direct access if needed
export { tokenManager };
