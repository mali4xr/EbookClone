import React from 'react';
import { Play, Star, Heart, Sparkles } from 'lucide-react';

interface LandingPageProps {
  onStartStory: () => void;
}

const LandingPage = ({ onStartStory }: LandingPageProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-200 via-purple-200 to-blue-200 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Floating decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <Star className="absolute top-10 left-10 text-yellow-400 w-6 h-6 animate-pulse" />
        <Heart className="absolute top-20 right-20 text-pink-400 w-5 h-5 animate-bounce" />
        <Sparkles className="absolute bottom-20 left-20 text-purple-400 w-6 h-6 animate-spin" />
        <Star className="absolute bottom-10 right-10 text-blue-400 w-4 h-4 animate-pulse" />
        <Heart className="absolute top-1/2 left-5 text-red-400 w-4 h-4 animate-bounce" />
        <Sparkles className="absolute top-1/3 right-5 text-green-400 w-5 h-5 animate-spin" />
      </div>

      {/* Main content container with proper spacing */}
      <div className="text-center space-y-4 md:space-y-6 animate__animated animate__fadeIn max-w-4xl w-full flex flex-col items-center justify-center min-h-screen py-8">
        {/* Title */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 animate__animated animate__bounceIn" 
            style={{ 
              fontFamily: 'Comic Sans MS, Chalkboard SE, Arial, sans-serif',
              textShadow: '3px 3px 0px rgba(255,255,255,0.8)'
            }}>
          Story Time
        </h1>
        
        {/* Subtitle */}
        <p className="text-lg sm:text-xl md:text-2xl text-purple-700 font-bold animate__animated animate__fadeInUp animate__delay-1s"
           style={{ fontFamily: 'Comic Sans MS, Chalkboard SE, Arial, sans-serif' }}>
          🌟 Magical Adventures Await! 🌟
        </p>

        {/* Circular image - responsive sizing */}
        <div className="relative animate__animated animate__zoomIn animate__delay-2s">
          <div className="w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 mx-auto rounded-full overflow-hidden border-4 sm:border-6 md:border-8 border-white shadow-2xl bg-gradient-to-br from-yellow-200 to-orange-200 p-2 sm:p-3 md:p-4">
            <img
              src="https://images.pexels.com/photos/326012/pexels-photo-326012.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
              alt="Hoppy the Rabbit"
              className="w-full h-full object-cover rounded-full animate-pulse"
            />
          </div>
          
          {/* Floating elements around the image - responsive positioning */}
          <div className="absolute -top-2 -left-2 sm:-top-3 sm:-left-3 w-8 h-8 sm:w-10 sm:h-10 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
            <span className="text-lg sm:text-xl">🐰</span>
          </div>
          <div className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 w-8 h-8 sm:w-10 sm:h-10 bg-pink-400 rounded-full flex items-center justify-center animate-bounce" style={{ animationDelay: '0.5s' }}>
            <span className="text-lg sm:text-xl">🌸</span>
          </div>
          <div className="absolute -bottom-2 -left-2 sm:-bottom-3 sm:-left-3 w-8 h-8 sm:w-10 sm:h-10 bg-blue-400 rounded-full flex items-center justify-center animate-bounce" style={{ animationDelay: '1s' }}>
            <span className="text-lg sm:text-xl">🦋</span>
          </div>
          <div className="absolute -bottom-2 -right-2 sm:-bottom-3 sm:-right-3 w-8 h-8 sm:w-10 sm:h-10 bg-green-400 rounded-full flex items-center justify-center animate-bounce" style={{ animationDelay: '1.5s' }}>
            <span className="text-lg sm:text-xl">🌳</span>
          </div>
        </div>

        {/* Description - more compact */}
        <p className="text-sm sm:text-base md:text-lg text-gray-700 max-w-xl mx-auto leading-relaxed animate__animated animate__fadeInUp animate__delay-3s px-4"
           style={{ fontFamily: 'Comic Sans MS, Chalkboard SE, Arial, sans-serif' }}>
          Join Hoppy the Rabbit on an amazing adventure through the magical Whisperwood Forest! 
          Read along, answer fun questions, and discover the joy of helping friends! 📚✨
        </p>

        {/* Start button */}
        <button
          onClick={onStartStory}
          className="group relative px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-white text-lg sm:text-xl md:text-2xl font-bold rounded-full shadow-2xl transform transition-all duration-300 hover:scale-110 hover:shadow-3xl animate__animated animate__pulse animate__infinite animate__delay-4s"
          style={{ fontFamily: 'Comic Sans MS, Chalkboard SE, Arial, sans-serif' }}
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <Play size={20} className="sm:w-6 sm:h-6 md:w-8 md:h-8 group-hover:animate-bounce" />
            <span>Start Adventure!</span>
            <span className="text-xl sm:text-2xl md:text-3xl">🚀</span>
          </div>
          
          {/* Button glow effect */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 opacity-0 group-hover:opacity-50 transition-opacity duration-300 blur-xl"></div>
        </button>

        {/* Fun facts - more compact grid */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-2 max-w-2xl mx-auto animate__animated animate__fadeInUp animate__delay-5s">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-2 sm:p-3 shadow-lg border-2 sm:border-4 border-yellow-300">
            <div className="text-xl sm:text-2xl mb-1">📖</div>
            <p className="text-purple-700 font-bold text-xs sm:text-sm" style={{ fontFamily: 'Comic Sans MS, Chalkboard SE, Arial, sans-serif' }}>
              Interactive Reading
            </p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-2 sm:p-3 shadow-lg border-2 sm:border-4 border-pink-300">
            <div className="text-xl sm:text-2xl mb-1">🎯</div>
            <p className="text-purple-700 font-bold text-xs sm:text-sm" style={{ fontFamily: 'Comic Sans MS, Chalkboard SE, Arial, sans-serif' }}>
              Fun Quizzes
            </p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-2 sm:p-3 shadow-lg border-2 sm:border-4 border-blue-300">
            <div className="text-xl sm:text-2xl mb-1">🤖</div>
            <p className="text-purple-700 font-bold text-xs sm:text-sm" style={{ fontFamily: 'Comic Sans MS, Chalkboard SE, Arial, sans-serif' }}>
              AI Helper
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;