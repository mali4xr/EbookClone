import React, { useState } from 'react';
import { useBook } from '../context/BookContext';
import { QuizModal } from './QuizModal';
import Controls from './Controls';
import PageTurner from './PageTurner';
import PageCounter from './PageCounter';
import InteractiveElements from './InteractiveElements';

const BookContent = () => {
  const { currentPage, totalPages, pageContent } = useBook();
  const [showQuiz, setShowQuiz] = useState(false);
  
  if (!pageContent) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading book content...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Book Content */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {pageContent.image && (
            <img 
              src={pageContent.image} 
              alt="Page illustration"
              className="w-full h-64 object-cover rounded-lg mb-6"
            />
          )}
          
          <div className="prose max-w-none">
            <p className="text-lg leading-relaxed text-gray-800">
              {pageContent.text}
            </p>
          </div>

          {/* Interactive Elements */}
          <div className="mt-8">
            <InteractiveElements page={currentPage} />
          </div>

          {/* Quiz Button */}
          <button
            onClick={() => setShowQuiz(true)}
            className="mt-6 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Take Quiz
          </button>
        </div>

        {/* Navigation Controls */}
        <div className="mt-8">
          <Controls />
          <div className="flex justify-between items-center mt-4">
            <PageTurner />
            <PageCounter current={currentPage + 1} total={totalPages} />
          </div>
        </div>
      </div>

      {/* Quiz Modal */}
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