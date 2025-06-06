import React, { useState, useEffect } from 'react';
import { X, Camera, Volume2, Keyboard } from 'lucide-react';
import { useBook } from '../context/BookContext';
import confetti from 'canvas-confetti';

interface QuizModalProps {
  onClose: () => void;
  onScoreUpdate: (score: number) => void;
  pageContent: {
    text: string;
    quiz?: {
      multipleChoice: {
        question: string;
        options: { text: string; isCorrect: boolean; }[];
      };
      spelling: {
        word: string;
        hint: string;
      };
    };
  };
}

export const QuizModal = ({ onClose, pageContent, onScoreUpdate }: QuizModalProps) => {
  const { voiceIndex, rate, pitch, volume, availableVoices } = useBook();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showScore, setShowScore] = useState(false);
  const [spellingAnswer, setSpellingAnswer] = useState('');
  const [isReading, setIsReading] = useState(false);
  const [inputMode, setInputMode] = useState<'text' | 'camera'>('text');
  const [showSpelling, setShowSpelling] = useState(false);

  const quiz = pageContent.quiz || {
    multipleChoice: {
      question: "What happened in this part of the story?",
      options: [
        { text: pageContent.text.substring(0, 50) + "...", isCorrect: true },
        { text: "Something completely different happened...", isCorrect: false }
      ]
    },
    spelling: {
      word: pageContent.text.split(' ').find(word => word.length > 4) || "story",
      hint: "Try spelling this word from the story"
    }
  };

  useEffect(() => {
    onScoreUpdate(score);
  }, [score, onScoreUpdate]);

  const readQuestion = (text: string) => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    if (availableVoices.length > 0) {
      utterance.voice = availableVoices[voiceIndex];
    }
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    setIsReading(true);
    utterance.onend = () => setIsReading(false);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (!showScore && !isReading) {
      const textToRead = !showSpelling 
        ? quiz.multipleChoice.question 
        : `Please spell the word: ${quiz.spelling.word}`;
      readQuestion(textToRead);
    }
  }, [currentQuestion, showScore, showSpelling]);

  const celebrateCorrectAnswer = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    const audio = new Audio('/sounds/correct.mp3');
    audio.volume = volume;
    audio.play().catch(e => console.log('Audio play failed:', e));

    const congratsText = !showSpelling 
      ? "Correct answer!" 
      : "Perfect spelling! Great job!";
    readQuestion(congratsText);
  };

  const handleMultipleChoiceAnswer = (isCorrect: boolean) => {
    if (isReading) {
      window.speechSynthesis.cancel();
    }
    
    if (isCorrect) {
      celebrateCorrectAnswer();
      setScore(score + 1);
      setTimeout(() => {
        setShowSpelling(true);
        readQuestion(`Please spell the word: ${quiz.spelling.word}`);
      }, 2000);
    } else {
      readQuestion("That's not correct. Try again next time!");
      setShowSpelling(true);
    }
  };

  const handleSpellingSubmit = () => {
    if (isReading) {
      window.speechSynthesis.cancel();
    }

    const isCorrect = spellingAnswer.toLowerCase() === quiz.spelling.word.toLowerCase();
    if (isCorrect) {
      celebrateCorrectAnswer();
      setScore(score + 1);
    } else {
      readQuestion(`Not quite right. The correct spelling was ${quiz.spelling.word}`);
    }
    setShowScore(true);
  };

  const handleListenAgain = () => {
    const textToRead = !showSpelling 
      ? quiz.multipleChoice.question 
      : `Please spell the word: ${quiz.spelling.word}`;
    readQuestion(textToRead);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-xl font-bold text-gray-800">Quick Quiz!</h2>
            <button 
              onClick={() => {
                if (isReading) {
                  window.speechSynthesis.cancel();
                }
                onClose();
              }}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <X size={24} />
            </button>
          </div>
          
          <div className="p-6">
            {!showScore ? (
              !showSpelling ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-medium">{quiz.multipleChoice.question}</p>
                    <button
                      onClick={handleListenAgain}
                      className="p-2 rounded-full hover:bg-purple-100 text-purple-600"
                      aria-label="Listen again"
                    >
                      <Volume2 size={20} />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {quiz.multipleChoice.options.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => handleMultipleChoiceAnswer(option.isCorrect)}
                        className="w-full p-3 text-left border rounded-lg hover:bg-purple-50 transition-colors"
                      >
                        {option.text}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-medium">Spell the word you hear:</p>
                    <button
                      onClick={handleListenAgain}
                      className="p-2 rounded-full hover:bg-purple-100 text-purple-600"
                      aria-label="Listen again"
                    >
                      <Volume2 size={20} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-center space-x-4">
                    <button
                      onClick={() => setInputMode('text')}
                      className={`flex items-center gap-2 p-2 rounded ${
                        inputMode === 'text' ? 'bg-purple-100 text-purple-600' : 'text-gray-500'
                      }`}
                    >
                      <Keyboard size={20} />
                      <span>Type</span>
                    </button>
                  </div>

                  <input
                    type="text"
                    value={spellingAnswer}
                    onChange={(e) => setSpellingAnswer(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Type your answer..."
                  />
                  <button
                    onClick={handleSpellingSubmit}
                    className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                  >
                    Submit Answer
                  </button>
                </div>
              )
            ) : (
              <div className="text-center space-y-4">
                <h3 className="text-2xl font-bold">
                  You scored {score} out of 2!
                </h3>
                <p className="text-gray-600">
                  {score === 2 ? "Perfect score! Great job! 🎉" :
                   score === 1 ? "Good try! Keep practicing! 👍" :
                   "Don't worry, keep learning! 💪"}
                </p>
                <button
                  onClick={() => {
                    if (isReading) {
                      window.speechSynthesis.cancel();
                    }
                    onClose();
                  }}
                  className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                >
                  Continue Reading
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};