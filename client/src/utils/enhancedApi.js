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
const getBaseUrl = () => {
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

    // If we get 401, token might have expired between check and request
    if (response.status === 401 && retries > 0) {
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
    tokenManager.clearAllTokens();
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
export const analyzeEmotionBase64 = async (imageBase64) => {
  try {
    const url = `${getBaseUrl()}/v1/analysis/analyze-base64`;
    const response = await authenticatedFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageBase64 })
    }, true, 1); // Requires auth, 1 retry

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

/**
 * Analyze emotion from file
 */
export const analyzeEmotionFile = async (imageFile) => {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);

    const url = `${getBaseUrl()}/v1/analysis/analyze`;
    const response = await authenticatedFetch(url, {
      method: 'POST',
      body: formData
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
