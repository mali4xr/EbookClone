import React from 'react';
import { Home, Trophy, Star, Heart, Sparkles, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';

interface QuizAnswer {
  pageTitle: string;
  multipleChoiceQuestion: string;
  multipleChoiceAnswer: string;
  spellingWord: string;
  spellingAnswer: string;
  isCorrect: boolean;
}

interface EndPageProps {
  onReturnToLanding: () => void;
  quizAnswers: QuizAnswer[];
  totalScore: number;
  maxScore: number;
}

const EndPage = ({ onReturnToLanding, quizAnswers, totalScore, maxScore }: EndPageProps) => {
  React.useEffect(() => {
    // Celebrate completion with confetti
    const timer = setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const getScoreMessage = () => {
    const percentage = (totalScore / maxScore) * 100;
    if (percentage === 100) return "Perfect! You're a reading superstar! 🌟";
    if (percentage >= 80) return "Excellent work! You did amazing! 🎉";
    if (percentage >= 60) return "Great job! Keep practicing! 💪";
    return "Good try! Every adventure teaches us something! 📚";
  };

  const getScoreColor = () => {
    const percentage = (totalScore / maxScore) * 100;
    if (percentage === 100) return "from-yellow-400 to-orange-400";
    if (percentage >= 80) return "from-green-400 to-blue-400";
    if (percentage >= 60) return "from-blue-400 to-purple-400";
    return "from-purple-400 to-pink-400";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-200 via-blue-200 to-purple-200 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Floating decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <Trophy className="absolute top-10 left-10 text-yellow-500 w-12 h-12 animate-bounce" />
        <Star className="absolute top-20 right-20 text-yellow-400 w-8 h-8 animate-pulse" />
        <Heart className="absolute bottom-20 left-20 text-pink-400 w-10 h-10 animate-bounce" />
        <Sparkles className="absolute bottom-10 right-10 text-purple-400 w-9 h-9 animate-spin" />
        <Star className="absolute top-1/2 left-5 text-blue-400 w-6 h-6 animate-pulse" />
        <Heart className="absolute top-1/3 right-5 text-red-400 w-7 h-7 animate-bounce" />
      </div>

      <div className="max-w-6xl mx-auto text-center space-y-8 animate__animated animate__fadeIn">
        {/* THE END Title */}
        <div className="space-y-4">
          <h1 className="text-7xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 animate__animated animate__bounceIn"
              style={{ 
                fontFamily: 'Comic Sans MS, Chalkboard SE, Arial, sans-serif',
                textShadow: '3px 3px 0px rgba(255,255,255,0.8)'
              }}>
            THE END
          </h1>
          
          <div className="text-4xl md:text-6xl animate__animated animate__zoomIn animate__delay-1s">
            🎉 🌟 🎊
          </div>
        </div>

        {/* Score Summary */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border-4 border-yellow-300 animate__animated animate__slideInUp animate__delay-2s">
          <div className={`text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${getScoreColor()} mb-4`}
               style={{ fontFamily: 'Comic Sans MS, Chalkboard SE, Arial, sans-serif' }}>
            Your Final Score: {totalScore}/{maxScore}
          </div>
          <p className="text-2xl md:text-3xl text-purple-700 font-bold"
             style={{ fontFamily: 'Comic Sans MS, Chalkboard SE, Arial, sans-serif' }}>
            {getScoreMessage()}
          </p>
        </div>

        {/* Quiz Summary */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border-4 border-blue-300 animate__animated animate__slideInUp animate__delay-3s">
          <h2 className="text-3xl md:text-4xl font-bold text-purple-700 mb-6"
              style={{ fontFamily: 'Comic Sans MS, Chalkboard SE, Arial, sans-serif' }}>
            📝 Your Adventure Summary
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-96 overflow-y-auto">
            {quizAnswers.map((answer, index) => (
              <div key={index} className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl p-6 border-2 border-purple-200 shadow-lg">
                <h3 className="text-xl font-bold text-purple-800 mb-4 flex items-center gap-2"
                    style={{ fontFamily: 'Comic Sans MS, Chalkboard SE, Arial, sans-serif' }}>
                  📖 {answer.pageTitle}
                  {answer.isCorrect ? (
                    <span className="text-green-500 text-2xl">✅</span>
                  ) : (
                    <span className="text-orange-500 text-2xl">⭐</span>
                  )}
                </h3>
                
                <div className="space-y-3 text-left">
                  <div className="bg-white/70 rounded-lg p-3">
                    <p className="text-sm font-semibold text-purple-600">Multiple Choice:</p>
                    <p className="text-sm text-gray-700">{answer.multipleChoiceQuestion}</p>
                    <p className="text-sm font-medium text-purple-800">Your answer: {answer.multipleChoiceAnswer}</p>
                  </div>
                  
                  <div className="bg-white/70 rounded-lg p-3">
                    <p className="text-sm font-semibold text-purple-600">Spelling Challenge:</p>
                    <p className="text-sm text-gray-700">Word: "{answer.spellingWord}"</p>
                    <p className="text-sm font-medium text-purple-800">Your spelling: {answer.spellingAnswer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Congratulations Message */}
        <div className="bg-gradient-to-r from-yellow-200 via-pink-200 to-purple-200 rounded-3xl p-8 shadow-2xl border-4 border-rainbow animate__animated animate__slideInUp animate__delay-4s">
          <div className="text-6xl mb-4">🏆</div>
          <h3 className="text-3xl md:text-4xl font-bold text-purple-700 mb-4"
              style={{ fontFamily: 'Comic Sans MS, Chalkboard SE, Arial, sans-serif' }}>
            Congratulations, Reading Hero!
          </h3>
          <p className="text-xl md:text-2xl text-purple-600 leading-relaxed"
             style={{ fontFamily: 'Comic Sans MS, Chalkboard SE, Arial, sans-serif' }}>
            You've completed Hoppy's amazing adventure! You learned about friendship, 
            helping others, and had fun with reading. You're ready for more adventures! 🌟
          </p>
        </div>

        {/* Return to Landing Button */}
        <button
          onClick={onReturnToLanding}
          className="group relative px-12 py-6 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 text-white text-2xl md:text-3xl font-bold rounded-full shadow-2xl transform transition-all duration-300 hover:scale-110 hover:shadow-3xl animate__animated animate__pulse animate__infinite animate__delay-5s"
          style={{ fontFamily: 'Comic Sans MS, Chalkboard SE, Arial, sans-serif' }}
        >
          <div className="flex items-center gap-4">
            <Home size={32} className="group-hover:animate-bounce" />
            <span>New Adventure!</span>
            <RotateCcw size={28} className="group-hover:animate-spin" />
          </div>
          
          {/* Button glow effect */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 opacity-0 group-hover:opacity-50 transition-opacity duration-300 blur-xl"></div>
        </button>

        {/* Fun achievement badges */}
        <div className="flex flex-wrap justify-center gap-4 animate__animated animate__fadeInUp animate__delay-6s">
          <div className="bg-yellow-400 text-yellow-900 px-4 py-2 rounded-full font-bold text-lg shadow-lg">
            🏅 Story Completed
          </div>
          <div className="bg-pink-400 text-pink-900 px-4 py-2 rounded-full font-bold text-lg shadow-lg">
            🧠 Quiz Master
          </div>
          <div className="bg-blue-400 text-blue-900 px-4 py-2 rounded-full font-bold text-lg shadow-lg">
            📚 Reading Champion
          </div>
          <div className="bg-green-400 text-green-900 px-4 py-2 rounded-full font-bold text-lg shadow-lg">
            ⭐ Adventure Hero
          </div>
        </div>
      </div>
    </div>
  );
};

export default EndPage;