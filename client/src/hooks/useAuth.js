import { useState, useEffect, createContext, useContext } from 'react';
import { getCurrentUserApi, clearCurrentUserCache, logoutApi } from '../utils/enhancedApi';
import tokenManager from '../utils/tokenManager';

// Crear contexto de autenticación
const AuthContext = createContext();

// Hook para usar el contexto de autenticación
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

// Proveedor de autenticación
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Función para cargar el usuario actual
  const loadUser = async () => {
    try {
      const token = tokenManager.getAccessToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const userData = await getCurrentUserApi();
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error cargando usuario:', error);
      // Si hay error, limpiar tokens y estado
      // Preserva spotify_jwt para no forzar reconexión de Spotify
      tokenManager.clearAllTokens(true);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  // Función para hacer login
  const login = (userData, token) => {
    tokenManager.setAccessToken(token);
    clearCurrentUserCache();
    setUser(userData);
    setIsAuthenticated(true);
  };

  // Función para hacer logout
  const logout = async () => {
    try {
      await logoutApi();
    } catch (error) {
      console.error('Error during logout:', error);
    }
    clearCurrentUserCache();
    setUser(null);
    setIsAuthenticated(false);
  };

  // Cargar usuario al montar el componente
  useEffect(() => {
    loadUser();
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    loadUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook simple para obtener solo el nombre del usuario
export const useCurrentUser = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = tokenManager.getAccessToken();
        if (!token) {
          setLoading(false);
          return;
        }

        const userData = await getCurrentUserApi();
        setUser(userData);
      } catch (err) {
        console.error('Error obteniendo usuario:', err);
        setError(err.message);
        // Si el token es inválido, limpiarlo
        if (err.message.includes('Sesión expirada') || err.message.includes('NO_TOKEN')) {
          tokenManager.clearAllTokens(true);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  return { user, loading, error };
};