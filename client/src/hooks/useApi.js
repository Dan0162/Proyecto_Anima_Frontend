import { useState, useCallback } from 'react';

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const callApi = useCallback(async (apiFunc) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFunc();
      return response;
    } catch (err) {
      setError(err.message || 'Ha ocurrido un error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, callApi };
};