import React, { useEffect, useState } from 'react';
import { useBook } from '../context/BookContext';
import PageTurner from './PageTurner';
import Controls from './Controls';
import PageCounter from './PageCounter';
import InteractiveElements from './InteractiveElements';
import { QuizModal } from './QuizModal';
import { Users } from 'lucide-react';

const BookContent = () => {
  const { 
    currentPage,
    totalPages,
    pageContent,
    currentWord,
    isReading,
    hasStartedReading,
    isAudioPlaying,
    setVoiceIndex,
    availableVoices
  } = useBook();
  
  const [isPageTurning, setIsPageTurning] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [isPageComplete, setIsPageComplete] = useState(false);
  
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
    if (hasStartedReading && !isReading && isPageComplete && !isAudioPlaying) {
      setShowQuiz(true);
    }
  }, [isReading, hasStartedReading, isPageComplete, isAudioPlaying]);

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

  const handleVoiceChange = (type: 'dad' | 'mom' | 'child') => {
    const voice = availableVoices.findIndex(v => {
      const name = v.name.toLowerCase();
      switch(type) {
        case 'dad':
          return name.includes('male') || name.includes('man');
        case 'mom':
          return name.includes('female') || name.includes('woman');
        case 'child':
          return name.includes('child') || name.includes('kid');
        default:
          return false;
      }
    });
    if (voice !== -1) setVoiceIndex(voice);
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
          
          <div className="w-full md:w-1/2 p-6 flex items-center justify-center">
            <div className="relative">
              <img 
                src={pageContent.image} 
                alt={`Illustration for page ${currentPage + 1}`} 
                className="rounded-full shadow-xl max-h-[300px] md:max-h-[400px] object-cover aspect-square"
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
          
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={() => handleVoiceChange('dad')}
              className="w-10 h-10 rounded-full bg-blue-100 hover:bg-blue-200 flex items-center justify-center text-blue-600"
              title="Dad's voice"
            >
              <Users size={20} />
            </button>
            <button
              onClick={() => handleVoiceChange('mom')}
              className="w-10 h-10 rounded-full bg-pink-100 hover:bg-pink-200 flex items-center justify-center text-pink-600"
              title="Mom's voice"
            >
              <Users size={20} />
            </button>
            <button
              onClick={() => handleVoiceChange('child')}
              className="w-10 h-10 rounded-full bg-green-100 hover:bg-green-200 flex items-center justify-center text-green-600"
              title="Child's voice"
            >
              <Users size={20} />
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