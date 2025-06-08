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
    <div className="flex items-center gap-3">
      <button
        onClick={prevPage}
        disabled={currentPage === 0}
        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 border-3 border-white shadow-lg transform hover:scale-110 ${
          currentPage === 0 
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
            : 'bg-gradient-to-r from-green-400 to-emerald-400 text-white hover:from-green-500 hover:to-emerald-500'
        }`}
        aria-label="Previous page"
      >
        <ChevronLeft size={24} />
      </button>
      
      <button
        onClick={nextPage}
        disabled={currentPage === totalPages - 1 || isLocked}
        className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 border-3 border-white shadow-lg transform hover:scale-110 ${
          currentPage === totalPages - 1 || isLocked
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-orange-400 to-red-400 text-white hover:from-orange-500 hover:to-red-500'
        }`}
        aria-label="Next page"
      >
        <ChevronRight size={24} />
        {isLocked && (
          <Lock
            size={22}
            className="absolute -top-2 -right-2 text-white bg-red-600 border-2 border-white rounded-full p-1"
          />
        )}
      </button>
    </div>
  );
};

export default PageTurner;