/**
 * Centralized JWT Token Management System
 * Handles token storage, refresh, and validation
 */

class TokenManager {
  constructor() {
    this.ACCESS_TOKEN_KEY = 'access_token';
    this.REFRESH_TOKEN_KEY = 'refresh_token';
    this.SPOTIFY_TOKEN_KEY = 'spotify_jwt';
    this.TOKEN_EXPIRY_KEY = 'token_expiry';
    
    // Refresh token 5 minutes before expiry
    this.REFRESH_BUFFER_MS = 5 * 60 * 1000;
    
    // Lock to prevent concurrent refresh attempts
    this.refreshPromise = null;
    
    // Base URL for API calls
    this.baseUrl = this.getBaseUrl();
  }

  getBaseUrl() {
    const base = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';
    return base;
  }

  /**
   * Store access token with expiry information
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
   * Get current access token
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
   * Store refresh token (if your backend supports it)
   */
  setRefreshToken(token) {
    try {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
    } catch (error) {
      console.error('❌ Error storing refresh token:', error);
    }
  }

  /**
   * Get refresh token
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
   * Store Spotify JWT separately
   */
  setSpotifyToken(token) {
    try {
      localStorage.setItem(this.SPOTIFY_TOKEN_KEY, token);
    } catch (error) {
      console.error('❌ Error storing Spotify token:', error);
    }
  }

  /**
   * Get Spotify JWT
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
   * Check if access token is expired or about to expire
   */
  isTokenExpired() {
    try {
      const expiryStr = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
      if (!expiryStr) return true;
      
      const expiry = parseInt(expiryStr, 10);
      const now = Date.now();
      
      // Consider token expired if it's within the refresh buffer
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
   * Refresh the access token using refresh token
   */
  async refreshAccessToken() {
    // If there's already a refresh in progress, wait for it
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
            // Refresh token is invalid, user needs to log in again
            this.clearAllTokens();
            throw new Error('REFRESH_TOKEN_EXPIRED');
          }
          throw new Error(`Token refresh failed: ${response.status}`);
        }

        const data = await response.json();
        
        // Store new tokens
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
          // Clear tokens and redirect to login
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
   * Get valid access token (refresh if needed)
   */
  async getValidAccessToken() {
    const token = this.getAccessToken();
    
    if (!token) {
      throw new Error('NO_TOKEN');
    }

    // If token is expired or about to expire, refresh it
    if (this.isTokenExpired()) {
      console.log('⚠️ Token expired or expiring soon, refreshing...');
      return await this.refreshAccessToken();
    }

    return token;
  }

  /**
   * Clear all authentication tokens
   */
  clearAllTokens() {
    try {
      localStorage.removeItem(this.ACCESS_TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      localStorage.removeItem(this.SPOTIFY_TOKEN_KEY);
      localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
      console.log('🧹 All tokens cleared');
    } catch (error) {
      console.error('❌ Error clearing tokens:', error);
    }
  }

  /**
   * Decode JWT token (client-side, for information only - never trust for security)
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
   * Get token expiry from JWT payload
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
