import React, { useEffect, useState, useRef } from 'react';
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
    hasStartedReading
  } = useBook();
  
  const [isPageTurning, setIsPageTurning] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [isPageComplete, setIsPageComplete] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [showAvatar, setShowAvatar] = useState(false);
  const [avatarText, setAvatarText] = useState('');
  const avatarRef = useRef(null);
  
  // Tavus Avatar configuration
  const TAVUS_API_KEY = '22dd0f54ba6c443ba15f03990f302a1b'; // Replace with your actual API key
  const AVATAR_ID = 'r9fa0878977a'; // Replace with your avatar ID
  
  useEffect(() => {
    setIsPageTurning(true);
    const timeout = setTimeout(() => setIsPageTurning(false), 500);
    return () => clearTimeout(timeout);
  }, [currentPage]);

  useEffect(() => {
    if (pageContent && pageContent.text) {
      const totalWords = pageContent.text.split(' ').length;
      const isComplete = currentWord >= totalWords - 1;
      setIsPageComplete(isComplete);
    }
  }, [currentWord, pageContent]);

  useEffect(() => {
    setIsPageComplete(false);
    setShowQuiz(false);
  }, [currentPage]);

  useEffect(() => {
    if (hasStartedReading && !isReading && isPageComplete) {
      setShowQuiz(true);
    }
  }, [isReading, hasStartedReading, isPageComplete]);

  // Initialize Tavus Avatar when component mounts
  useEffect(() => {
    const loadTavusSDK = async () => {
      if (!window.TavusSDK) {
        const script = document.createElement('script');
        script.src = 'https://cdn.tavus.io/sdk/v1/tavus-sdk.js';
        script.onload = () => {
          initializeTavusAvatar();
        };
        document.head.appendChild(script);
      } else {
        initializeTavusAvatar();
      }
    };

    loadTavusSDK();
  }, []);

  const initializeTavusAvatar = () => {
    if (avatarRef.current && window.TavusSDK) {
      window.TavusSDK.init({
        apiKey: TAVUS_API_KEY,
        container: avatarRef.current,
        avatarId: AVATAR_ID,
        onReady: () => {
          console.log('Tavus Avatar is ready');
        },
        onError: (error) => {
          console.error('Tavus Avatar error:', error);
        }
      });
    }
  };

  const speakWithAvatar = (text) => {
    if (window.TavusSDK && text) {
      setAvatarText(text);
      setShowAvatar(true);
      
      window.TavusSDK.speak({
        text: text,
        onStart: () => {
          console.log('Avatar started speaking');
        },
        onComplete: () => {
          console.log('Avatar finished speaking');
          // Optionally hide avatar after speaking
          // setTimeout(() => setShowAvatar(false), 2000);
        }
      });
    }
  };

  // Trigger avatar to speak when page is complete
  useEffect(() => {
    if (isPageComplete && pageContent) {
      const congratsMessage = `Great job! You've completed page ${currentPage + 1}. ${pageContent.summary || 'Ready for the next page?'}`;
      speakWithAvatar(congratsMessage);
    }
  }, [isPageComplete, currentPage, pageContent]);

  const renderHighlightedText = (text) => {
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

  const handleAvatarToggle = () => {
    setShowAvatar(!showAvatar);
  };

  const handleReadPage = () => {
    if (pageContent && pageContent.text) {
      speakWithAvatar(pageContent.text);
    }
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
              {isPageComplete && (
                <div className="text-sm text-green-600 font-semibold mt-2">
                  ✓ Page completed
                </div>
              )}
            </div>
          </div>
          
          <div className="w-full md:w-1/2 relative">
            <div className="absolute top-4 right-4">
              <img 
                src={pageContent.image} 
                alt={`Illustration for page ${currentPage + 1}`} 
                className="w-32 h-32 md:w-48 md:h-48 rounded-full object-cover border-4 border-white shadow-xl"
              />
            </div>
            <InteractiveElements page={currentPage} />
          </div>
        </div>

        {/* Tavus Avatar Container */}
        {showAvatar && (
          <div className="absolute bottom-4 left-4 z-50">
            <div className="bg-white rounded-lg p-2 shadow-xl border-2 border-blue-300">
              <div 
                ref={avatarRef}
                className="w-48 h-36 rounded-lg overflow-hidden bg-gray-100"
                style={{ minHeight: '144px' }}
              />
              <div className="mt-2 text-xs text-gray-600 max-w-48">
                {avatarText && (
                  <p className="bg-blue-50 p-2 rounded text-center">
                    "{avatarText.substring(0, 60)}..."
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="bg-white p-4 flex flex-wrap items-center justify-between gap-4 border-t border-gray-200">
        <div className="flex items-center gap-4 mx-auto sm:mx-0">
          <PageCounter current={currentPage + 1} total={totalPages} />
          <PageTurner isLocked={quizScore < 2} />
          <Controls />
          
          {/* Avatar Controls */}
          <div className="flex gap-2">
            <button
              onClick={handleAvatarToggle}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                showAvatar 
                  ? 'bg-blue-500 text-white hover:bg-blue-600' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {showAvatar ? 'Hide Avatar' : 'Show Avatar'}
            </button>
            <button
              onClick={handleReadPage}
              className="px-3 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
              disabled={!pageContent}
            >
              Read Page
            </button>
          </div>
        </div>
      </div>

      {showQuiz && (
        <QuizModal
          onClose={() => setShowQuiz(false)}
          pageContent={pageContent}
          onScoreUpdate={setQuizScore}
        />
      )}
    </div>
  );
};

export default BookContent;