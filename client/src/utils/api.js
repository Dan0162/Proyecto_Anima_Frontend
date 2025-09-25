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