import React from 'react';
import { Wand2, Sparkles } from 'lucide-react';

interface MagicWandAnimationProps {
  isVisible: boolean;
}

const MagicWandAnimation: React.FC<MagicWandAnimationProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center">
      {/* Magic Wand with floating animation */}
      <div className="relative animate-bounce">
        <div className="magic-wand-container">
          <Wand2 
            size={48} 
            className="text-purple-600 animate-pulse transform rotate-45" 
          />
          
          {/* Sparkles around the wand */}
          <div className="absolute -top-2 -left-2 animate-ping">
            <Sparkles size={16} className="text-yellow-400" />
          </div>
          <div className="absolute -bottom-2 -right-2 animate-ping" style={{ animationDelay: '0.5s' }}>
            <Sparkles size={12} className="text-pink-400" />
          </div>
          <div className="absolute top-0 -right-3 animate-ping" style={{ animationDelay: '1s' }}>
            <Sparkles size={14} className="text-blue-400" />
          </div>
          <div className="absolute -bottom-1 -left-3 animate-ping" style={{ animationDelay: '1.5s' }}>
            <Sparkles size={10} className="text-green-400" />
          </div>
          
          {/* Floating sparkle trail */}
          <div className="absolute inset-0">
            <div className="sparkle-trail sparkle-1">✨</div>
            <div className="sparkle-trail sparkle-2">⭐</div>
            <div className="sparkle-trail sparkle-3">💫</div>
            <div className="sparkle-trail sparkle-4">🌟</div>
          </div>
        </div>
      </div>
      
      {/* Magic text */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
        <div className="bg-purple-600 text-white px-4 py-2 rounded-full text-sm font-bold animate-pulse">
          ✨ Creating Magic... ✨
        </div>
      </div>
    </div>
  );
};

export default MagicWandAnimation;