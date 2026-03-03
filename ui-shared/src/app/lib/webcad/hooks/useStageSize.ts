import { useState, useEffect } from 'react';

export function useStageSize() {
  const [stageSize, setStageSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setStageSize({
        width: window.innerWidth - 320, // Subtract sidebar width
        height: window.innerHeight - 120, // Subtract header and footer
      });
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return stageSize;
}
