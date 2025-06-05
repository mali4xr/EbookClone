import React, { useEffect, useRef } from 'react';
import { Tavus } from '@tavus/js';

interface TavusNarratorProps {
  text: string;
  onComplete?: () => void;
}

const TavusNarrator = ({ text, onComplete }: TavusNarratorProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const tavusRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const initTavus = async () => {
      try {
        tavusRef.current = new Tavus({
          apiKey: import.meta.env.VITE_TAVUS_API_KEY,
          container: containerRef.current,
        });

        await tavusRef.current.speak(text);
        onComplete?.();
      } catch (error) {
        console.error('Error initializing Tavus:', error);
      }
    };

    initTavus();

    return () => {
      if (tavusRef.current) {
        tavusRef.current.destroy();
      }
    };
  }, [text, onComplete]);

  return (
    <div 
      ref={containerRef} 
      className="w-48 h-48 rounded-full overflow-hidden shadow-lg"
    />
  );
};

export default TavusNarrator;