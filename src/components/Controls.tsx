import React from 'react';
import { Volume2, VolumeX, Play, Pause, Settings } from 'lucide-react';
import { useBook } from '../context/BookContext';

const Controls = () => {
  const { 
    isReading, 
    toggleReading, 
    isMuted,
    toggleMute
  } = useBook();

  return (
    <div className="flex items-center gap-4">
      <button 
        onClick={toggleReading}
        className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-md"
        aria-label={isReading ? "Pause reading" : "Start reading"}
      >
        {isReading ? (
          <Pause size={24} />
        ) : (
          <Play size={24} />
        )}
      </button>
      
      <button 
        onClick={toggleMute}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
        aria-label={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted ? (
          <VolumeX size={20} />
        ) : (
          <Volume2 size={20} />
        )}
      </button>
    </div>
  );
};

export default Controls;