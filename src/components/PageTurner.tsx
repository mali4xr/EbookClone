import React from 'react';
import { ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import { useBook } from '../context/BookContext';

interface PageTurnerProps {
  isLocked: boolean;
}

const PageTurner = ({ isLocked }: PageTurnerProps) => {
  const { 
    currentPage, 
    totalPages, 
    nextPage, 
    prevPage 
  } = useBook();

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={prevPage}
        disabled={currentPage === 0}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
          currentPage === 0 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
            : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
        }`}
        aria-label="Previous page"
      >
        <ChevronLeft size={24} />
      </button>
      
      <button
        onClick={nextPage}
        disabled={currentPage === totalPages - 1 || isLocked}
        className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all ${
          currentPage === totalPages - 1 || isLocked
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
        }`}
        aria-label="Next page"
      >
        <ChevronRight size={24} />
        {isLocked && (
          <Lock size={14} className="absolute -top-1 -right-1 text-gray-500" />
        )}
      </button>
    </div>
  );
};

export default PageTurner;