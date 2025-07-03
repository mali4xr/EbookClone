import React from 'react';
import { Wand2, Sparkles, Zap } from 'lucide-react';

interface MagicWandAnimationProps {
  isVisible: boolean;
}

const MagicWandAnimation: React.FC<MagicWandAnimationProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center bg-gradient-to-br from-purple-50/90 to-pink-50/90 rounded-2xl">
      {/* Main Magic Wand */}
      <div className="relative animate-bounce">
        <div className="magic-wand-container">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-2xl">
            <Wand2 size={32} className="text-white animate-pulse transform rotate-45" />
          </div>
          
          {/* Floating Sparkles */}
          <div className="absolute -top-4 -left-4 animate-ping">
            <Sparkles size={20} className="text-yellow-400" />
          </div>
          <div className="absolute -bottom-4 -right-4 animate-ping" style={{ animationDelay: '0.5s' }}>
            <Sparkles size={16} className="text-pink-400" />
          </div>
          <div className="absolute top-0 -right-6 animate-ping" style={{ animationDelay: '1s' }}>
            <Zap size={18} className="text-blue-400" />
          </div>
          <div className="absolute -bottom-2 -left-6 animate-ping" style={{ animationDelay: '1.5s' }}>
            <Sparkles size={14} className="text-green-400" />
          </div>
          
          {/* Magic Trail */}
          <div className="absolute inset-0">
            <div className="sparkle-trail sparkle-1">✨</div>
            <div className="sparkle-trail sparkle-2">⭐</div>
            <div className="sparkle-trail sparkle-3">💫</div>
            <div className="sparkle-trail sparkle-4">🌟</div>
          </div>
        </div>
      </div>
      
      {/* Magic Text */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-2xl font-bold animate-pulse shadow-xl border-2 border-white">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="animate-spin" />
            <span className="text-lg">Creating AI Magic...</span>
            <Sparkles size={20} className="animate-spin" style={{ animationDirection: 'reverse' }} />
          </div>
        </div>
      </div>

      {/* Background Magic Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-ping"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          >
            <div className={`w-2 h-2 rounded-full ${
              i % 4 === 0 ? 'bg-yellow-400' :
              i % 4 === 1 ? 'bg-pink-400' :
              i % 4 === 2 ? 'bg-blue-400' : 'bg-green-400'
            }`} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default MagicWandAnimation;