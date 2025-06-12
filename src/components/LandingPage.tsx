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
        <Star className="absolute top-10 left-10 text-yellow-400 w-8 h-8 animate-pulse" />
        <Heart className="absolute top-20 right-20 text-pink-400 w-6 h-6 animate-bounce" />
        <Sparkles className="absolute bottom-20 left-20 text-purple-400 w-7 h-7 animate-spin" />
        <Star className="absolute bottom-10 right-10 text-blue-400 w-5 h-5 animate-pulse" />
        <Heart className="absolute top-1/2 left-5 text-red-400 w-4 h-4 animate-bounce" />
        <Sparkles className="absolute top-1/3 right-5 text-green-400 w-6 h-6 animate-spin" />
      </div>

      {/* Main content */}
      <div className="text-center space-y-8 animate__animated animate__fadeIn">
        {/* Title */}
        <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 animate__animated animate__bounceIn" 
            style={{ 
              fontFamily: 'Comic Sans MS, Chalkboard SE, Arial, sans-serif',
              textShadow: '3px 3px 0px rgba(255,255,255,0.8)'
            }}>
          Story Time
        </h1>
        
        {/* Subtitle */}
        <p className="text-2xl md:text-3xl text-purple-700 font-bold animate__animated animate__fadeInUp animate__delay-1s"
           style={{ fontFamily: 'Comic Sans MS, Chalkboard SE, Arial, sans-serif' }}>
          🌟 Magical Adventures Await! 🌟
        </p>

        {/* Circular image */}
        <div className="relative animate__animated animate__zoomIn animate__delay-2s">
          <div className="w-64 h-64 md:w-80 md:h-80 mx-auto rounded-full overflow-hidden border-8 border-white shadow-2xl bg-gradient-to-br from-yellow-200 to-orange-200 p-4">
            <img
              src="https://images.pexels.com/photos/326012/pexels-photo-326012.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
              alt="Hoppy the Rabbit"
              className="w-full h-full object-cover rounded-full animate-pulse"
            />
          </div>
          
          {/* Floating elements around the image */}
          <div className="absolute -top-4 -left-4 w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
            <span className="text-2xl">🐰</span>
          </div>
          <div className="absolute -top-4 -right-4 w-12 h-12 bg-pink-400 rounded-full flex items-center justify-center animate-bounce" style={{ animationDelay: '0.5s' }}>
            <span className="text-2xl">🌸</span>
          </div>
          <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-blue-400 rounded-full flex items-center justify-center animate-bounce" style={{ animationDelay: '1s' }}>
            <span className="text-2xl">🦋</span>
          </div>
          <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-green-400 rounded-full flex items-center justify-center animate-bounce" style={{ animationDelay: '1.5s' }}>
            <span className="text-2xl">🌳</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-lg md:text-xl text-gray-700 max-w-2xl mx-auto leading-relaxed animate__animated animate__fadeInUp animate__delay-3s"
           style={{ fontFamily: 'Comic Sans MS, Chalkboard SE, Arial, sans-serif' }}>
          Join Hoppy the Rabbit on an amazing adventure through the magical Whisperwood Forest! 
          Read along, answer fun questions, and discover the joy of helping friends! 📚✨
        </p>

        {/* Start button */}
        <button
          onClick={onStartStory}
          className="group relative px-12 py-6 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-white text-2xl md:text-3xl font-bold rounded-full shadow-2xl transform transition-all duration-300 hover:scale-110 hover:shadow-3xl animate__animated animate__pulse animate__infinite animate__delay-4s"
          style={{ fontFamily: 'Comic Sans MS, Chalkboard SE, Arial, sans-serif' }}
        >
          <div className="flex items-center gap-4">
            <Play size={32} className="group-hover:animate-bounce" />
            <span>Start Adventure!</span>
            <span className="text-3xl">🚀</span>
          </div>
          
          {/* Button glow effect */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 opacity-0 group-hover:opacity-50 transition-opacity duration-300 blur-xl"></div>
        </button>

        {/* Fun facts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12 max-w-4xl mx-auto animate__animated animate__fadeInUp animate__delay-5s">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border-4 border-yellow-300">
            <div className="text-3xl mb-2">📖</div>
            <p className="text-purple-700 font-bold" style={{ fontFamily: 'Comic Sans MS, Chalkboard SE, Arial, sans-serif' }}>
              Interactive Reading
            </p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border-4 border-pink-300">
            <div className="text-3xl mb-2">🎯</div>
            <p className="text-purple-700 font-bold" style={{ fontFamily: 'Comic Sans MS, Chalkboard SE, Arial, sans-serif' }}>
              Fun Quizzes
            </p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border-4 border-blue-300">
            <div className="text-3xl mb-2">🤖</div>
            <p className="text-purple-700 font-bold" style={{ fontFamily: 'Comic Sans MS, Chalkboard SE, Arial, sans-serif' }}>
              AI Helper
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;