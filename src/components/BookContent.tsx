import React, { useEffect, useState } from 'react';
import { useBook } from '../context/BookContext';
import PageTurner from './PageTurner';
import Controls from './Controls';
import PageCounter from './PageCounter';
import InteractiveElements from './InteractiveElements';
import QuizModal from './QuizModal';

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

  // Show quiz only when reading stops AND the page is complete
  useEffect(() => {
    console.log('Quiz conditions:', {
      hasStartedReading,
      isReading,
      isPageComplete,
      showQuiz
    });
    
    if (hasStartedReading && !isReading && isPageComplete) {
      console.log('Setting showQuiz to true');
      setShowQuiz(true);
    }
  }, [isReading, hasStartedReading, isPageComplete]);

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
                className="rounded-lg shadow-xl max-h-[300px] md:max-h-[400px] object-contain"
              />
              <InteractiveElements page={currentPage} />
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-4 flex flex-wrap items-center justify-between gap-4 border-t border-gray-200">
        <div className="flex items-center gap-4 mx-auto sm:mx-0">
          <PageCounter current={currentPage + 1} total={totalPages} />
          <PageTurner />
          <Controls />
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