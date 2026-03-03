import { useState } from 'react';

/**
 * Custom hook for ruler functionality
 */
export const useRuler = () => {
  const [showRuler, setShowRuler] = useState(false); // Disabled for performance
  const rulerSize = { width: 15, height: 15 };

  return {
    showRuler,
    rulerSize,
    setShowRuler,
  };
};
