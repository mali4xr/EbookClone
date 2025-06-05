import React from 'react';
import { useBook } from '../context/BookContext';

const PageTurner = ({ isQuizPassed = false }) => {
  const { 
    currentPage, 
    totalPages, 
    nextPage, 
    prevPage,
    hasStartedReading,
    quizScore 
  } = useBook();

  const canGoNext = () => {
    // Can go to next page if:
    // 1. Not on the last page
    // 2. Either haven't started reading yet, or have passed the quiz (scored 2/2)
    return currentPage < totalPages - 1 && (!hasStartedReading || quizScore === 2);
  };

  const canGoPrev = () => {
    return currentPage > 0;
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={prevPage}
        disabled={!canGoPrev()}
        className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 ${
          canGoPrev()
            ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
        title={!canGoPrev() ? 'Already on first page' : 'Go to previous page'}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Previous
      </button>

      <button
        onClick={nextPage}
        disabled={!canGoNext()}
        className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 relative ${
          canGoNext()
            ? 'bg-green-500 hover:bg-green-600 text-white shadow-md hover:shadow-lg'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
        title={
          !canGoNext() && currentPage === totalPages - 1
            ? 'Already on last page'
            : !canGoNext() && hasStartedReading && quizScore !== 2
            ? 'Complete the quiz with perfect score to continue'
            : 'Go to next page'
        }
      >
        Next
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        
        {/* Show lock icon when quiz hasn't been passed */}
        {hasStartedReading && quizScore !== 2 && currentPage < totalPages - 1 && (
          <div className="absolute -top-1 -right-1 bg-red-500 rounded-full p-1">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </button>
    </div>
  );
};

export default PageTurner;