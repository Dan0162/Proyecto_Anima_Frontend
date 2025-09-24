import React, { createContext, useContext, useState, useCallback } from 'react';

const FlashContext = createContext(null);

export const useFlash = () => useContext(FlashContext);

export const FlashProvider = ({ children }) => {
  const [flash, setFlash] = useState(null);

  const show = useCallback((message, type = 'success', ttl = 4000) => {
    setFlash({ message, type });
    if (ttl > 0) {
      setTimeout(() => setFlash(null), ttl);
    }
  }, []);

  const hide = useCallback(() => setFlash(null), []);

  return (
    <FlashContext.Provider value={{ flash, show, hide }}>
      {children}
    </FlashContext.Provider>
  );
};

export default FlashContext;
