import { useState, useEffect, createContext, useContext } from 'react';
import { getCurrentUserApi } from '../utils/api';

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
      const token = localStorage.getItem('access_token');
      if (!token) {
        setLoading(false);
        return;
      }

      const userData = await getCurrentUserApi();
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error cargando usuario:', error);
      // Si hay error, limpiar token y estado
      localStorage.removeItem('access_token');
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  // Función para hacer login
  const login = (userData, token) => {
    localStorage.setItem('access_token', token);
    setUser(userData);
    setIsAuthenticated(true);
  };

  // Función para hacer logout
  const logout = () => {
    localStorage.removeItem('access_token');
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
        const token = localStorage.getItem('access_token');
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
        if (err.message.includes('Sesión expirada')) {
          localStorage.removeItem('access_token');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  return { user, loading, error };
};