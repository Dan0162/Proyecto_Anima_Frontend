/**
 * Sistema de gestión de tokens de autenticación
 * - Almacena tokens en localStorage
 * - Verifica expiración y renueva tokens automáticamente
 * Maneja almacenamiento, renovación y validación de tokens
 */

class TokenManager {
  constructor() {
    this.ACCESS_TOKEN_KEY = 'access_token';
    this.REFRESH_TOKEN_KEY = 'refresh_token';
    this.SPOTIFY_TOKEN_KEY = 'spotify_jwt';
    this.TOKEN_EXPIRY_KEY = 'token_expiry';
    
    // Renovar token 5 minutos antes de que expire
    this.REFRESH_BUFFER_MS = 5 * 60 * 1000;
    
    // Bloqueo para evitar intentos concurrentes de renovación
    this.refreshPromise = null;
    
    // URL base para llamadas a la API
    this.baseUrl = this.getBaseUrl();
  }

  getBaseUrl() {
    const base = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';
    return base;
  }

  /**
   * Almacena token de acceso con información de expiración
   */
  setAccessToken(token, expiresIn = 3600) {
    try {
      localStorage.setItem(this.ACCESS_TOKEN_KEY, token);
      
      // Calculate expiry timestamp (in seconds, convert expiresIn to ms)
      const expiryTime = Date.now() + (expiresIn * 1000);
      localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString());
      
      console.log('✅ Access token stored, expires in:', expiresIn, 'seconds');
    } catch (error) {
      console.error('❌ Error storing access token:', error);
    }
  }

  /**
   * Obtiene token de acceso actual
   */
  getAccessToken() {
    try {
      return localStorage.getItem(this.ACCESS_TOKEN_KEY);
    } catch (error) {
      console.error('❌ Error getting access token:', error);
      return null;
    }
  }

  /**
   * Almacena el token de refresh 
   */
  setRefreshToken(token) {
    try {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
    } catch (error) {
      console.error('❌ Error storing refresh token:', error);
    }
  }

  /**
   * Obtiene el token para refrescar el acceso
   */
  getRefreshToken() {
    try {
      return localStorage.getItem(this.REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('❌ Error getting refresh token:', error);
      return null;
    }
  }

  /**
   * Almacena JWT de Spotify por separado
   */
  setSpotifyToken(token) {
    try {
      localStorage.setItem(this.SPOTIFY_TOKEN_KEY, token);
    } catch (error) {
      console.error('❌ Error storing Spotify token:', error);
    }
  }

  /**
   * Obtiene JWT de Spotify
   */
  getSpotifyToken() {
    try {
      return localStorage.getItem(this.SPOTIFY_TOKEN_KEY);
    } catch (error) {
      console.error('❌ Error getting Spotify token:', error);
      return null;
    }
  }

  /**
   * Verifica si el token de acceso ha expirado o está a punto de expirar
   */
  isTokenExpired() {
    try {
      const expiryStr = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
      if (!expiryStr) return true;
      
      const expiry = parseInt(expiryStr, 10);
      const now = Date.now();
      
      // Considera el token expirado si está dentro del buffer de renovación
      return now >= (expiry - this.REFRESH_BUFFER_MS);
    } catch (error) {
      console.error('❌ Error checking token expiry:', error);
      return true;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    const token = this.getAccessToken();
    return token !== null && !this.isTokenExpired();
  }

  /**
   * Refresca el token de acceso usando el token de refresh
   */
  async refreshAccessToken() {
    // Si ya hay una actualización en progreso, espera a que termine
    if (this.refreshPromise) {
      console.log('⏳ Waiting for existing token refresh...');
      return this.refreshPromise;
    }

    console.log('🔄 Starting token refresh...');

    this.refreshPromise = (async () => {
      try {
        const refreshToken = this.getRefreshToken();
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await fetch(`${this.baseUrl}/v1/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refresh_token: refreshToken })
        });

        if (!response.ok) {
          if (response.status === 401) {
            // El token de refresh no es válido, el usuario debe iniciar sesión nuevamente
            this.clearAllTokens();
            throw new Error('REFRESH_TOKEN_EXPIRED');
          }
          throw new Error(`Token refresh failed: ${response.status}`);
        }

        const data = await response.json();
        
        // Almacena nuevos tokens
        if (data.access_token) {
          this.setAccessToken(data.access_token, data.expires_in || 3600);
        }
        
        if (data.refresh_token) {
          this.setRefreshToken(data.refresh_token);
        }

        console.log('✅ Token refreshed successfully');
        return data.access_token;
        
      } catch (error) {
        console.error('❌ Token refresh failed:', error);
        
        if (error.message === 'REFRESH_TOKEN_EXPIRED') {
          // Limpia los tokens y redirige al inicio de sesión
          this.clearAllTokens();
          window.location.href = '/signin';
        }
        
        throw error;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  /**
   * Obtiene token de acceso válido (refresca si es necesario)
   */
  async getValidAccessToken() {
    const token = this.getAccessToken();
    
    if (!token) {
      throw new Error('NO_TOKEN');
    }

   // Si el token ha expirado o está a punto de expirar, refrescarlo
    if (this.isTokenExpired()) {
      console.log('⚠️ Token expired or expiring soon, refreshing...');
      return await this.refreshAccessToken();
    }

    return token;
  }

  /**
   * Limpia todos los tokens de autenticación almacenados
   * @param {boolean} preserveSpotify - si es true, mantiene el token de Spotify en el almacenamiento (por defecto: false)
   */
  clearAllTokens(preserveSpotify = false) {
    try {
      // Siempre elimina los tokens de acceso/refresco y la expiración
      localStorage.removeItem(this.ACCESS_TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      localStorage.removeItem(this.TOKEN_EXPIRY_KEY);

      if (!preserveSpotify) {
        // Elimina el token de Spotify solo cuando no se está preservando
        localStorage.removeItem(this.SPOTIFY_TOKEN_KEY);
      }

      console.log('🧹 Authentication tokens cleared', preserveSpotify ? '(spotify preserved)' : '');
    } catch (error) {
      console.error('❌ Error clearing tokens:', error);
    }
  }

  /**
   * Decodifica token JWT (lado cliente, solo para información - nunca confiar para seguridad)
   */
  decodeToken(token) {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }
      
      const payload = parts[1];
      const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
      return decoded;
    } catch (error) {
      console.error('❌ Error decoding token:', error);
      return null;
    }
  }

  /**
   * Obtiene la expiración del token desde el payload JWT
   */
  getTokenExpiry(token) {
    const decoded = this.decodeToken(token);
    if (decoded && decoded.exp) {
      return decoded.exp * 1000; // Convert to milliseconds
    }
    return null;
  }
}

// Export singleton instance
const tokenManager = new TokenManager();
export default tokenManager;
