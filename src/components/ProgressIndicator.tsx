import React from 'react';
import { CheckCircle, Circle, Clock } from 'lucide-react';

interface ProgressIndicatorProps {
  currentPage: number;
  totalPages: number;
  isPageComplete: boolean;
  quizScore: number;
}

const ProgressIndicator = ({ currentPage, totalPages, isPageComplete, quizScore }: ProgressIndicatorProps) => {
  const getPageStatus = (pageIndex: number) => {
    if (pageIndex < currentPage) {
      return 'completed';
    } else if (pageIndex === currentPage) {
      if (isPageComplete && quizScore >= 3) {
        return 'completed';
      } else if (isPageComplete) {
        return 'quiz-pending';
      } else {
        return 'reading';
      }
    } else {
      return 'locked';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-500';
      case 'quiz-pending':
        return 'text-yellow-500';
      case 'reading':
        return 'text-blue-500';
      case 'locked':
        return 'text-red-500';
      default:
        return 'text-gray-300';
    }
  };

  const getStatusIcon = (status: string, pageIndex: number) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={20} className="text-green-500" />;
      case 'quiz-pending':
        return <Clock size={20} className="text-yellow-500" />;
      case 'reading':
        return <Circle size={20} className="text-blue-500 animate-pulse" />;
      case 'locked':
        return <Circle size={20} className="text-gray-300" />;
      default:
        return <Circle size={20} className="text-gray-300" />;
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-center gap-2 md:gap-4">
          {Array.from({ length: totalPages }, (_, index) => {
            const status = getPageStatus(index);
            return (
              <div key={index} className="flex items-center">
                <div className="flex flex-col items-center">
                  {getStatusIcon(status, index)}
                  <span className={`text-xs mt-1 font-medium ${getStatusColor(status)}`}>
                    {index + 1}
                  </span>
                </div>
                {index < totalPages - 1 && (
                  <div className={`w-8 md:w-12 h-0.5 mx-2 ${
                    index < currentPage ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
        
        {/* Status Legend */}
        <div className="flex justify-center gap-4 mt-3 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <CheckCircle size={14} className="text-green-500" />
            <span>Complete</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={14} className="text-yellow-500" />
            <span>Quiz Pending</span>
          </div>
          <div className="flex items-center gap-1">
            <Circle size={14} className="text-blue-500" />
            <span>Reading</span>
          </div>
          <div className="flex items-center gap-1">
            <Circle size={14} className="text-gray-300" />
            <span>Locked</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressIndicator;