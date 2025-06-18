import React from 'react';
import { Volume2, VolumeX, Play, Pause } from 'lucide-react';
import { useBook } from '../context/BookContext';

const Controls = () => {
  const { 
    isReading, 
    toggleReading, 
    isMuted,
    toggleMute
  } = useBook();

  console.log('Controls render - isReading:', isReading);

  return (
    <div className="flex items-center gap-3">
      <button 
        onClick={() => {
          console.log('Play/Pause button clicked, current isReading:', isReading);
          toggleReading();
        }}
        className={`flex items-center justify-center w-14 h-14 rounded-full text-white hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg border-4 border-white transform hover:scale-110 ${
          isReading 
            ? 'bg-gradient-to-r from-red-500 to-orange-500 animate-pulse' 
            : 'bg-gradient-to-r from-purple-500 to-pink-500'
        }`}
        aria-label={isReading ? "Pause reading" : "Start reading"}
      >
        {isReading ? (
          <Pause size={28} />
        ) : (
          <Play size={28} />
        )}
      </button>
      
      <button 
        onClick={toggleMute}
        className={`flex items-center justify-center w-12 h-12 rounded-full text-white transition-all duration-300 shadow-lg border-3 border-white transform hover:scale-110 ${
          isMuted 
            ? 'bg-gradient-to-r from-gray-400 to-gray-500' 
            : 'bg-gradient-to-r from-blue-400 to-cyan-400 hover:from-blue-500 hover:to-cyan-500'
        }`}
        aria-label={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted ? (
          <VolumeX size={22} />
        ) : (
          <Volume2 size={22} />
        )}
      </button>
    </div>
  );
};

export default Controls;