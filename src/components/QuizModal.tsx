import React, { useState, useEffect } from 'react';
import { useBook } from '../context/BookContext';

const QuizModal = ({ onClose, pageContent }) => {
  const { setQuizScore } = useBook();
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  // Sample quiz questions - you can customize these based on your page content
  const quizQuestions = [
    {
      id: 1,
      question: `What was the main topic of this page?`,
      options: [
        'The weather',
        pageContent.topic || 'The story content', // Use actual page content
        'Mathematics',
        'Sports'
      ],
      correctAnswer: 1 // Index of correct answer
    },
    {
      id: 2,
      question: 'How many characters were mentioned in this page?',
      options: [
        '1',
        '2',
        '3',
        '4'
      ],
      correctAnswer: pageContent.characterCount || 1 // You can determine this from content
    }
  ];

  const handleAnswerSelect = (questionId, answerIndex) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));
  };

  const handleSubmit = () => {
    let correctCount = 0;
    
    quizQuestions.forEach(question => {
      if (selectedAnswers[question.id] === question.correctAnswer) {
        correctCount++;
      }
    });
    
    setScore(correctCount);
    setQuizScore(correctCount); // Update context with score
    setShowResults(true);
  };

  const handleClose = () => {
    if (showResults && score < 2) {
      // Reset if they didn't get perfect score
      setSelectedAnswers({});
      setShowResults(false);
      setScore(0);
      setQuizScore(0);
    } else {
      onClose();
    }
  };

  const canSubmit = Object.keys(selectedAnswers).length === quizQuestions.length;
  const isPerfectScore = score === 2;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {showResults ? 'Quiz Results' : 'Page Quiz'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          {!showResults ? (
            <>
              <p className="text-gray-600 mb-6">
                Answer these questions about what you just read to continue to the next page!
              </p>

              <div className="space-y-6">
                {quizQuestions.map((question, qIndex) => (
                  <div key={question.id} className="border-b border-gray-200 pb-4">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">
                      {qIndex + 1}. {question.question}
                    </h3>
                    <div className="space-y-2">
                      {question.options.map((option, oIndex) => (
                        <button
                          key={oIndex}
                          onClick={() => handleAnswerSelect(question.id, oIndex)}
                          className={`w-full text-left p-3 rounded-lg border-2 transition-all duration-200 ${
                            selectedAnswers[question.id] === oIndex
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 hover:border-gray-300 text-gray-700'
                          }`}
                        >
                          <span className="font-medium mr-2">
                            {['A', 'B', 'C', 'D'][oIndex]}.
                          </span>
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                    canSubmit
                      ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Submit Quiz
                </button>
              </div>
            </>
          ) : (
            <div className="text-center">
              <div className={`text-6xl mb-4 ${isPerfectScore ? 'text-green-500' : 'text-orange-500'}`}>
                {isPerfectScore ? '🎉' : '📚'}
              </div>
              
              <h3 className={`text-2xl font-bold mb-4 ${
                isPerfectScore ? 'text-green-600' : 'text-orange-600'
              }`}>
                {isPerfectScore ? 'Perfect Score!' : 'Keep Learning!'}
              </h3>
              
              <p className="text-xl mb-4">
                You scored <span className="font-bold text-blue-600">{score} out of 2</span>
              </p>
              
              {isPerfectScore ? (
                <div>
                  <p className="text-green-600 mb-6">
                    Excellent! You can now move to the next page.
                  </p>
                  <button
                    onClick={onClose}
                    className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    Continue Reading
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-orange-600 mb-6">
                    You need to get all answers correct to proceed. Try reading the page again!
                  </p>
                  <div className="space-x-4">
                    <button
                      onClick={handleClose}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={onClose}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizModal;