import React, { useEffect, useState } from 'react';
import { useBook } from '../context/BookContext';
import PageTurner from './PageTurner';
import Controls from './Controls';
import PageCounter from './PageCounter';
import InteractiveElements from './InteractiveElements';
import { QuizModal } from './QuizModal';

const BookContent = () => {
  const { 
    currentPage,
    totalPages,
    pageContent,
    currentWord,
    isReading,
    hasStartedReading,
    isAudioPlaying,
    quizScore,
    setVoiceType, // Add voice control function
    voiceType // Add current voice type
  } = useBook();
  
  const [isPageTurning, setIsPageTurning] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [isPageComplete, setIsPageComplete] = useState(false);
  
  useEffect(() => {
    setIsPageTurning(true);
    const timeout = setTimeout(() => setIsPageTurning(false), 500);
    return () => clearTimeout(timeout);
  }, [currentPage]);

  // Track page completion - check if current word has reached the end of the page
  useEffect(() => {
    if (pageContent && pageContent.text) {
      const totalWords = pageContent.text.split(' ').length;
      const isComplete = currentWord >= totalWords - 1;
      setIsPageComplete(isComplete);
    }
  }, [currentWord, pageContent]);

  // Reset page completion when page changes
  useEffect(() => {
    setIsPageComplete(false);
    setShowQuiz(false);
  }, [currentPage]);

  // Show quiz only when reading stops AND the page is complete AND audio is not playing
  useEffect(() => {
    console.log('Quiz conditions:', {
      hasStartedReading,
      isReading,
      isPageComplete,
      isAudioPlaying,
      showQuiz
    });
    
    // Updated condition with audio check
    if (hasStartedReading && !isReading && isPageComplete && !isAudioPlaying) {
      console.log('Setting showQuiz to true');
      setShowQuiz(true);
    }
  }, [isReading, hasStartedReading, isPageComplete, isAudioPlaying]);

  // Alternative implementation if you're using Web Speech API directly
  /*
  useEffect(() => {
    const checkSpeechStatus = () => {
      const isSpeaking = window.speechSynthesis.speaking;
      
      if (hasStartedReading && !isReading && isPageComplete && !isSpeaking) {
        setShowQuiz(true);
      }
    };

    // Check immediately
    checkSpeechStatus();

    // Set up interval to check speech status
    const interval = setInterval(checkSpeechStatus, 100);
    
    return () => clearInterval(interval);
  }, [isReading, hasStartedReading, isPageComplete]);
  */

  // Alternative implementation if you're using HTML5 audio
  /*
  useEffect(() => {
    if (hasStartedReading && !isReading && isPageComplete) {
      // Check if audio element exists and is not playing
      const audioElement = document.querySelector('audio'); // or use a ref
      const isAudioNotPlaying = !audioElement || audioElement.paused || audioElement.ended;
      
      if (isAudioNotPlaying) {
        setShowQuiz(true);
      }
    }
  }, [isReading, hasStartedReading, isPageComplete]);
  */

  const renderHighlightedText = (text: string) => {
    const words = text.split(' ');
    return words.map((word, index) => (
      <span
        key={index}
        className={`inline-block transition-all duration-150 mx-[2px] px-1 rounded ${
          index === currentWord ? 'bg-yellow-300 -skew-x-3 scale-105' : 
          index < currentWord ? 'bg-green-100' : ''
        }`}
      >
        {word}
      </span>
    ));
  };

  return (
    <div className="flex flex-col h-[600px] md:h-[700px]">
      <div 
        className="flex-grow relative overflow-hidden"
        style={{
          backgroundImage: `url(${pageContent.background})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div 
          className={`absolute inset-0 flex flex-col md:flex-row transition-opacity duration-500 ${
            isPageTurning ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col justify-center">
            <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg">
              <p className="text-xl md:text-2xl leading-relaxed text-gray-800 font-medium mb-4">
                {renderHighlightedText(pageContent.text)}
              </p>
              {/* Optional: Show completion indicator */}
              {isPageComplete && (
                <div className="text-sm text-green-600 font-semibold mt-2">
                  ✓ Page completed
                </div>
              )}
            </div>
          </div>
          
          <div className="w-full md:w-1/2 p-6 flex items-center justify-center">
            <div className="relative">
              <img 
                src={pageContent.image} 
                alt={`Illustration for page ${currentPage + 1}`} 
                className="rounded-full shadow-xl w-[300px] h-[300px] md:w-[400px] md:h-[400px] object-cover border-4 border-white"
              />
              <InteractiveElements page={currentPage} />
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-4 flex flex-wrap items-center justify-between gap-4 border-t border-gray-200">
        <div className="flex items-center gap-4 mx-auto sm:mx-0">
          <PageCounter current={currentPage + 1} total={totalPages} />
          <PageTurner isQuizPassed={quizScore === 2} />
          <Controls />
          
          {/* Voice Selection Buttons */}
          <div className="flex items-center gap-2 ml-4">
            <span className="text-sm text-gray-600">Voice:</span>
            <button
              onClick={() => setVoiceType('male')}
              className={`w-10 h-10 rounded-full border-2 transition-all duration-200 flex items-center justify-center text-sm font-bold ${
                voiceType === 'male' 
                  ? 'bg-blue-500 border-blue-600 text-white shadow-lg' 
                  : 'bg-white border-gray-300 text-gray-600 hover:border-blue-400'
              }`}
              title="Dad's Voice (Male)"
            >
              👨
            </button>
            <button
              onClick={() => setVoiceType('female')}
              className={`w-10 h-10 rounded-full border-2 transition-all duration-200 flex items-center justify-center text-sm font-bold ${
                voiceType === 'female' 
                  ? 'bg-pink-500 border-pink-600 text-white shadow-lg' 
                  : 'bg-white border-gray-300 text-gray-600 hover:border-pink-400'
              }`}
              title="Mum's Voice (Female)"
            >
              👩
            </button>
          </div>
        </div>
      </div>

      {showQuiz && (
        <QuizModal
          onClose={() => setShowQuiz(false)}
          pageContent={pageContent}
        />
      )}
    </div>
  );
};

export default BookContent;