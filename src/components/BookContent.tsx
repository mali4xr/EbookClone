import React, { useEffect, useState } from 'react';
import { useBook } from '../context/BookContext';
import PageTurner from './PageTurner';
import Controls from './Controls';
import PageCounter from './PageCounter';
import InteractiveElements from './InteractiveElements';
import ConversationalAIButton from './ConversationalAIButton';
import { QuizModal } from './QuizModal';
import ProgressIndicator from './ProgressIndicator';

const BookContent = () => {
  const { 
    toggleReading,
    currentPage,
    totalPages,
    pageContent,
    currentWord,
    isReading,
    hasStartedReading,
    setIsQuizOpen
  } = useBook();
  
  const [isPageTurning, setIsPageTurning] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [isPageComplete, setIsPageComplete] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [aiMessages, setAiMessages] = useState<any[]>([]);
  const [hasAutoStarted, setHasAutoStarted] = useState(false);
  
  useEffect(() => {
    setIsPageTurning(true);
    setHasAutoStarted(false);
    const timeout = setTimeout(() => setIsPageTurning(false), 500);
    
    return () => clearTimeout(timeout);
  }, [currentPage]);

  // Auto-start reading only once per page after page turn animation
  useEffect(() => {
    if (!isPageTurning && !hasAutoStarted && !isReading && !showQuiz) {
      const timer = setTimeout(() => {
        toggleReading();
        setHasAutoStarted(true);
      }, 800);
      
      return () => clearTimeout(timer);
    }
  }, [isPageTurning, hasAutoStarted, isReading, showQuiz, toggleReading]);

  // Check if page is complete based on reading progress
  useEffect(() => {
    if (pageContent && pageContent.text) {
      const totalWords = pageContent.text.split(' ').length;
      const isComplete = currentWord >= totalWords - 1;
      setIsPageComplete(isComplete);
      
      // Show quiz when reading is complete
      if (isComplete && hasStartedReading && !isReading && !showQuiz) {
        console.log('Page complete, showing quiz...');
        const timer = setTimeout(() => {
          setShowQuiz(true);
          setIsQuizOpen(true);
        }, 1500); // Give a bit more time for reading to fully stop
        
        return () => clearTimeout(timer);
      }
    }
  }, [currentWord, pageContent, hasStartedReading, isReading, showQuiz, setIsQuizOpen]);

  // Reset states when page changes
  useEffect(() => {
    setIsPageComplete(false);
    setShowQuiz(false);
    setQuizScore(0);
    setHasAutoStarted(false);
    setIsQuizOpen(false);
  }, [currentPage, setIsQuizOpen]);

  const renderHighlightedText = (text: string) => {
    const words = text.split(' ');
    return words.map((word, index) => (
      <span
        key={index}
        className={`inline-block transition-all duration-150 mx-[2px] px-1 rounded ${
          index === currentWord ? 'bg-yellow-300 -skew-x-3 scale-105 animate__animated animate__pulse' : 
          index < currentWord ? 'bg-green-100' : ''
        }`}
      >
        {word}
      </span>
    ));
  };

  const handleAIMessage = (message: any) => {
    setAiMessages(prev => [...prev, message]);
    console.log('Reading AI Message:', message);
  };

  const getReadingAIContext = () => {
    return `You are helping a child read a story. 
    Current page: ${currentPage + 1} of ${totalPages}
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

  const handleQuizClose = () => {
    setShowQuiz(false);
    setIsQuizOpen(false);
  };

  const handleQuizContinue = () => {
    setQuizScore(3); // Mark as completed
    setShowQuiz(false);
    setIsQuizOpen(false);
  };

  return (
    <div className="flex flex-col h-[600px] md:h-[700px]">
      {/* Progress Indicator */}
      <ProgressIndicator 
        currentPage={currentPage} 
        totalPages={totalPages}
        isPageComplete={isPageComplete}
        quizScore={quizScore}
      />
      
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
            <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg animate__animated animate__slideInLeft">
              <p className="text-xl md:text-2xl leading-relaxed text-gray-800 font-medium mb-4">
                {renderHighlightedText(pageContent.text)}
              </p>
              {isPageComplete && (
                <div className="text-sm text-green-600 font-semibold mt-2 animate__animated animate__bounceIn">
                  ✓ Page completed - Quiz coming up!
                </div>
              )}
            </div>
          </div>
          
          <div className="w-full md:w-1/2 relative">
            {/* Video Circle - Fixed positioning and styling */}
            <div className="absolute top-4 right-4 z-10">
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
            
            {/* AI Assistant for Reading */}
            <div className="absolute top-4 left-4">
              <ConversationalAIButton
                context={getReadingAIContext()}
                onMessage={handleAIMessage}
                className="animate__animated animate__fadeInLeft animate__delay-1s"
              />
            </div>
            
            <InteractiveElements page={currentPage} />
          </div>
        </div>

        {/* Play/Read Button - Bottom Right */}
        <div className="absolute bottom-4 right-4">
          <Controls />
        </div>
      </div>
      
      <div className="bg-white p-4 flex flex-wrap items-center justify-between gap-4 border-t border-gray-200 animate__animated animate__slideInUp">
        <div className="flex items-center gap-4 mx-auto sm:mx-0">
          <PageCounter current={currentPage + 1} total={totalPages} />
          <PageTurner isLocked={quizScore < 3} />
        </div>
        
        {/* AI Messages Display */}
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

      {/* Quiz Modal */}
      {showQuiz && pageContent.quiz && (
        <QuizModal
          isOpen={showQuiz}
          onClose={handleQuizClose}
          onContinue={handleQuizContinue}
          questions={[
            {
              question: pageContent.quiz.multipleChoice.question,
              options: pageContent.quiz.multipleChoice.options.map(opt => opt.text),
              correctAnswer: pageContent.quiz.multipleChoice.options.findIndex(opt => opt.isCorrect)
            }
          ]}
        />
      )}
    </div>
  );
};

export default BookContent;