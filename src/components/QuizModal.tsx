import React, { useState, useEffect } from 'react';
import { X, CheckCircle, XCircle } from 'lucide-react';

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  questions: Array<{
    question: string;
    options: string[];
    correctAnswer: number;
  }>;
}

export const QuizModal: React.FC<QuizModalProps> = ({
  isOpen,
  onClose,
  onContinue,
  questions
}) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);

  useEffect(() => {
    if (isOpen) {
      setCurrentQuestion(0);
      setSelectedAnswer(null);
      setShowResult(false);
      setScore(0);
      setAnswers([]);
    }
  }, [isOpen]);

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
  };

  const handleNextQuestion = () => {
    if (selectedAnswer === null) return;

    const newAnswers = [...answers, selectedAnswer];
    setAnswers(newAnswers);

    if (selectedAnswer === questions[currentQuestion].correctAnswer) {
      setScore(score + 1);
    }

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
    } else {
      setShowResult(true);
    }
  };

  const handleContinue = () => {
    if (score === questions.length) {
      onContinue();
      onClose();
    } else {
      // Reset quiz to try again
      setCurrentQuestion(0);
      setSelectedAnswer(null);
      setShowResult(false);
      setScore(0);
      setAnswers([]);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                {showResult ? 'Quiz Results' : `Question ${currentQuestion + 1} of ${questions.length}`}
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {!showResult ? (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-6 rounded-xl">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">
                    {questions[currentQuestion]?.question}
                  </h3>
                </div>

                <div className="space-y-3">
                  {questions[currentQuestion]?.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(index)}
                      className={`w-full p-4 text-left rounded-xl border-2 transition-all duration-300 ${
                        selectedAnswer === index
                          ? 'border-purple-500 bg-purple-50 shadow-md'
                          : 'border-gray-200 hover:border-purple-300 hover:bg-purple-25'
                      }`}
                    >
                      <span className="font-medium">{String.fromCharCode(65 + index)}.</span> {option}
                    </button>
                  ))}
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleNextQuestion}
                    disabled={selectedAnswer === null}
                    className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                      selectedAnswer === null
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-purple-600 text-white hover:bg-purple-700 transform hover:scale-105'
                    }`}
                  >
                    {currentQuestion < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  {score === questions.length ? (
                    <CheckCircle className="w-20 h-20 text-green-500" />
                  ) : (
                    <XCircle className="w-20 h-20 text-red-500" />
                  )}
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    {score === questions.length ? 'Excellent!' : 'Keep Learning!'}
                  </h3>
                  <p className="text-lg text-gray-600">
                    You scored {score} out of {questions.length}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl">
                  <h4 className="font-semibold text-gray-800 mb-3">Review:</h4>
                  <div className="space-y-2">
                    {questions.map((question, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span>Question {index + 1}</span>
                        <span className={`font-medium ${
                          answers[index] === question.correctAnswer ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {answers[index] === question.correctAnswer ? '✓ Correct' : '✗ Incorrect'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleContinue}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-300 font-medium transform hover:scale-105"
                >
                  {score === questions.length ? "Continue to Next Page →" : "Try Again"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};