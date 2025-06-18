import React, { useEffect, useRef, useState } from 'react';
import { useBook } from '../context/BookContext';
import PageTurner from './PageTurner';
import Controls from './Controls';
import PageCounter from './PageCounter';
import InteractiveElements from './InteractiveElements';
import ConversationalAIButton from './ConversationalAIButton';
import { QuizModal } from './QuizModal';
import ProgressIndicator from './ProgressIndicator';
import TavusConversationVideo from './TavusConversationVideo';

interface QuizAnswer {
  pageTitle: string;
  multipleChoiceQuestion: string;
  multipleChoiceAnswer: string;
  spellingWord: string;
  spellingAnswer: string;
  isCorrect: boolean;
}

interface BookContentProps {
  onStoryComplete?: (answers: QuizAnswer[], totalScore: number) => void;
}

const BookContent = ({ onStoryComplete }: BookContentProps) => {
  const { 
    currentPage,
    totalPages,
    pageContent,
    currentWord,
    isReading,
    hasStartedReading,
    isLoading,
    error,
    readingComplete
  } = useBook();

  const [isPageTurning, setIsPageTurning] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [isPageComplete, setIsPageComplete] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [aiMessages, setAiMessages] = useState<any[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const [backgroundMusicEnabled, setBackgroundMusicEnabled] = useState(false);
  const [backgroundMusicVolume, setBackgroundMusicVolume] = useState(0.3);
  
  const textContainerRef = useRef<HTMLDivElement>(null);
  const backgroundAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setIsPageTurning(true);
    const timeout = setTimeout(() => setIsPageTurning(false), 500);

    return () => {
      clearTimeout(timeout);
    };
  }, [currentPage]);

  // Enhanced page completion detection with better logging
  useEffect(() => {
    console.log('Page completion check:', {
      readingComplete,
      hasStartedReading,
      isReading,
      currentWord,
      totalWords: pageContent?.text ? pageContent.text.split(/\s+/).length : 0
    });

    if (pageContent && pageContent.text) {
      const words = pageContent.text.split(/\s+/).filter(word => word.length > 0);
      const totalWords = words.length;
      const isComplete = readingComplete || currentWord >= totalWords;
      
      console.log('Setting page complete:', isComplete);
      setIsPageComplete(isComplete);
      
      // Show quiz when reading is complete and user has started reading
      if (isComplete && hasStartedReading && !isReading) {
        console.log('Conditions met for quiz, setting timeout...');
        setTimeout(() => {
          console.log('Showing quiz now');
          setShowQuiz(true);
        }, 1000); // Reduced delay for better responsiveness
      }
    }
  }, [currentWord, pageContent, hasStartedReading, isReading, readingComplete]);

  // Auto-scroll functionality
  useEffect(() => {
    if (autoScroll && isReading && textContainerRef.current) {
      const container = textContainerRef.current;
      const words = container.querySelectorAll('.word-highlight');
      const currentWordElement = words[currentWord];
      
      if (currentWordElement) {
        const containerRect = container.getBoundingClientRect();
        const wordRect = currentWordElement.getBoundingClientRect();
        
        // Check if word is outside visible area
        if (wordRect.bottom > containerRect.bottom || wordRect.top < containerRect.top) {
          currentWordElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          });
        }
      }
    }
  }, [currentWord, isReading, autoScroll]);

  // Background music management
  useEffect(() => {
    if (backgroundMusicEnabled && pageContent.backgroundMusic) {
      if (!backgroundAudioRef.current) {
        backgroundAudioRef.current = new Audio(pageContent.backgroundMusic);
        backgroundAudioRef.current.loop = true;
        backgroundAudioRef.current.volume = backgroundMusicVolume;
      }
      
      backgroundAudioRef.current.play().catch(e => {
        console.log('Background music autoplay prevented:', e);
      });
    } else if (backgroundAudioRef.current) {
      backgroundAudioRef.current.pause();
    }

    return () => {
      if (backgroundAudioRef.current) {
        backgroundAudioRef.current.pause();
        backgroundAudioRef.current = null;
      }
    };
  }, [backgroundMusicEnabled, pageContent.backgroundMusic, currentPage]);

  // Update background music volume
  useEffect(() => {
    if (backgroundAudioRef.current) {
      backgroundAudioRef.current.volume = backgroundMusicVolume;
    }
  }, [backgroundMusicVolume]);

  // Reset states when page changes
  useEffect(() => {
    setIsPageComplete(false);
    setShowQuiz(false);
    setQuizScore(0);
  }, [currentPage]);

  const renderHighlightedText = (text: string) => {
    const words = text.split(/\s+/).filter(word => word.length > 0);
    console.log('Rendering highlighted text:', { currentWord, totalWords: words.length });
    
    return (
      <div className="leading-relaxed">
        {words.map((word, index) => (
          <span
            key={index}
            className={`word-highlight inline-block transition-all duration-300 mx-1 px-1 py-0.5 rounded ${
              index === currentWord ? 'bg-yellow-300 shadow-md transform scale-110 animate-pulse font-bold text-purple-800' : 
              index < currentWord ? 'bg-green-100 text-green-800' : 'text-gray-800'
            }`}
          >
            {word}
          </span>
        ))}
      </div>
    );
  };

  const handleAIMessage = (message: any) => {
    setAiMessages(prev => [...prev, message]);
    console.log('Reading AI Message:', message);
  };

  const getReadingAIContext = () => {
    return `You are helping a child read a story. 
    Current page: ${currentPage + 1} of ${totalPages}
    Page title: "${pageContent.title}"
    Story text: "${pageContent.text}"
    
    You can help with:
    - Explaining difficult words
    - Discussing what's happening in the story
    - Answering questions about characters and events
    - Encouraging reading comprehension
    - Making the story more engaging
    
    Be encouraging, patient, and use simple language appropriate for children.
    Current reading progress: ${isReading ? 'Currently reading aloud' : 'Not reading'}
    Page completion: ${isPageComplete ? 'Page completed' : 'Still reading'}`;
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex flex-col h-[600px] md:h-[700px] items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
        <p className="mt-4 text-lg text-gray-600">Loading story from database...</p>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex flex-col h-[600px] md:h-[700px] items-center justify-center">
        <div className="text-center p-6 bg-red-50 rounded-lg border border-red-200">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Story</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show empty state if no pages
  if (totalPages === 0) {
    return (
      <div className="flex flex-col h-[600px] md:h-[700px] items-center justify-center">
        <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No Story Pages Found</h3>
          <p className="text-gray-600 mb-4">Please check your database connection or add some story pages.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[600px] md:h-[700px]">
      {/* Progress Indicator */}
      <ProgressIndicator 
        currentPage={currentPage} 
        totalPages={totalPages}
        isPageComplete={isPageComplete}
        quizScore={quizScore}
      />
      
      {/* Page Settings Bar */}
      <div className="bg-white border-b border-gray-200 p-2">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            {/* Auto Scroll Toggle */}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-gray-700">Auto Scroll</span>
            </label>

            {/* Background Music Controls */}
            {pageContent.backgroundMusic && (
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={backgroundMusicEnabled}
                    onChange={(e) => setBackgroundMusicEnabled(e.target.checked)}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-gray-700">🎵 Background Music</span>
                </label>
                
                {backgroundMusicEnabled && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Volume:</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={backgroundMusicVolume}
                      onChange={(e) => setBackgroundMusicVolume(Number(e.target.value))}
                      className="w-16 accent-purple-600"
                    />
                    <span className="text-xs text-gray-500 w-8">{Math.round(backgroundMusicVolume * 100)}%</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Reading Status */}
          <div className="text-sm text-gray-600">
            {isReading && (
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Reading... ({currentWord + 1} of {pageContent.text.split(/\s+/).filter(w => w.length > 0).length} words)
              </span>
            )}
            {isPageComplete && (
              <span className="text-green-600 font-semibold">
                ✓ Page completed - Quiz available!
              </span>
            )}
          </div>
        </div>
      </div>
      
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
            isPageTurning ? 'opacity-0' : 'opacity-100 animate__animated animate__fadeIn'
          }`}
        >
          <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col justify-center">
            <div className="bg-white/95 backdrop-blur-sm p-6 rounded-xl shadow-lg animate__animated animate__slideInLeft max-h-full overflow-hidden">
              {/* Page Title */}
              {pageContent.title && (
                <h2 className="text-2xl md:text-3xl font-bold text-purple-700 mb-4 animate__animated animate__fadeInDown">
                  {pageContent.title}
                </h2>
              )}
              
              {/* Scrollable Text Container */}
              <div 
                ref={textContainerRef}
                className="text-xl md:text-2xl leading-relaxed text-gray-800 font-medium mb-4 overflow-y-auto max-h-80 pr-2"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#8B5CF6 #E5E7EB'
                }}
              >
                <style jsx>{`
                  div::-webkit-scrollbar {
                    width: 8px;
                  }
                  div::-webkit-scrollbar-track {
                    background: #F3F4F6;
                    border-radius: 10px;
                  }
                  div::-webkit-scrollbar-thumb {
                    background: linear-gradient(45deg, #8B5CF6, #EC4899);
                    border-radius: 10px;
                    border: 2px solid #F3F4F6;
                  }
                  div::-webkit-scrollbar-thumb:hover {
                    background: linear-gradient(45deg, #7C3AED, #DB2777);
                  }
                `}</style>
                {renderHighlightedText(pageContent.text)}
              </div>
              
              {isPageComplete && (
                <div className="text-sm text-green-600 font-semibold mt-2 animate__animated animate__bounceIn">
                  ✓ Page completed - Quiz will appear shortly!
                </div>
              )}
            </div>
          </div>
          
          <div className="w-full md:w-1/2 relative">
            {/* Video Circle */}
            <div className="absolute right-20 z-10">
              <div className="w-32 h-32 md:w-48 md:h-48 rounded-full overflow-hidden border-4 border-white shadow-xl animate__animated animate__slideInRight">
                <video 
                  src={pageContent.video} 
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                  style={{ objectFit: 'cover' }}
                  onError={(e) => {
                    console.log('Video failed to load, falling back to image');
                    const target = e.target as HTMLVideoElement;
                    const img = document.createElement('img');
                    img.src = pageContent.image;
                    img.className = 'w-full h-full object-cover';
                    img.alt = `Illustration for page ${currentPage + 1}`;
                    img.style.objectFit = 'cover';
                    target.parentNode?.replaceChild(img, target);
                  }}
                />
              </div>
            </div>
            
            {/* Interactive Elements */}
            <InteractiveElements page={currentPage} />
          </div>
        </div>

        {/* Tavus Conversation Video - Bottom Left */}
        <div className="absolute bottom-4 right-2 z-20">
          <TavusConversationVideo 
            pageContent={pageContent} 
            currentPage={currentPage}
            totalPages={totalPages}
          />
        </div>

        {/* Read Button */}
        <div className="absolute bottom-4 left-4">
          <Controls />
        </div>
      </div>
      
      <div className="bg-white p-4 flex flex-wrap items-center justify-between gap-4 border-t border-gray-200 animate__animated animate__slideInUp">
        <div className="flex items-center gap-4 mx-auto sm:mx-0">
          <PageCounter current={currentPage + 1} total={totalPages} />
          <PageTurner isLocked={quizScore < 2} />
        </div>
        
        {/* AI Messages */}
        {aiMessages.length > 0 && (
          <div className="hidden lg:block max-w-xs">
            <div className="p-2 bg-blue-50 rounded-lg text-xs">
              <p className="font-medium text-blue-700">AI Helper:</p>
              <p className="text-blue-600 truncate">
                {aiMessages[aiMessages.length - 1]?.message || "Ready to help!"}
              </p>
            </div>
          </div>
        )}
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