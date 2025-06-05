import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, Volume2 } from 'lucide-react';
import { useBook } from '../context/BookContext';
import confetti from 'canvas-confetti';
import Webcam from 'react-webcam';
import { createWorker } from 'tesseract.js';

interface QuizModalProps {
  onClose: () => void;
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

const QuizModal = ({ onClose, pageContent }: QuizModalProps) => {
  const { voiceIndex, rate, pitch, volume, availableVoices } = useBook();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showScore, setShowScore] = useState(false);
  const [spellingAnswer, setSpellingAnswer] = useState('');
  const [isReading, setIsReading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedText, setCapturedText] = useState<string | null>(null);
  const webcamRef = useRef<Webcam>(null);

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
      const textToRead = currentQuestion === 0 
        ? quiz.multipleChoice.question 
        : `Please spell the word: ${quiz.spelling.word}. ${quiz.spelling.hint}. You can type your answer or show your written answer to the camera.`;
      readQuestion(textToRead);
    }
  }, [currentQuestion, showScore]);

  const celebrateCorrectAnswer = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    const audio = new Audio('/sounds/correct.mp3');
    audio.volume = volume;
    audio.play().catch(e => console.log('Audio play failed:', e));

    const congratsText = currentQuestion === 0 
      ? "Correct answer!" 
      : "Perfect spelling! Great job!";
    readQuestion(congratsText);
  };

  const handleAnswer = (isCorrect: boolean) => {
    if (isReading) {
      window.speechSynthesis.cancel();
    }
    
    if (isCorrect) {
      celebrateCorrectAnswer();
      setScore(score + 1);
    } else {
      readQuestion("That's not correct. Try again next time!");
    }
    setCurrentQuestion(currentQuestion + 1);
  };

  const captureImage = async () => {
    if (!webcamRef.current) return;
    
    setIsProcessing(true);
    setCapturedText(null);
    const imageSrc = webcamRef.current.getScreenshot();
    
    if (!imageSrc) {
      setIsProcessing(false);
      return;
    }

    try {
      const worker = await createWorker();
      await worker.loadLanguage('eng');
      await worker.initialize('eng');
      
      const { data: { text } } = await worker.recognize(imageSrc);
      await worker.terminate();

      const cleanedText = text.trim().toLowerCase().replace(/[^a-z]/g, '');
      setCapturedText(text.trim());
      const isCorrect = cleanedText.includes(quiz.spelling.word.toLowerCase());

      if (isCorrect) {
        celebrateCorrectAnswer();
        setScore(score + 1);
        setShowScore(true);
      } else {
        readQuestion(`I see the text: "${text.trim()}". This doesn't match the word. Try again or type your answer.`);
      }
      
      setIsProcessing(false);
    } catch (error) {
      console.error('OCR Error:', error);
      readQuestion("Sorry, I couldn't read the text clearly. Please try again or type your answer.");
      setIsProcessing(false);
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
    const textToRead = currentQuestion === 0 
      ? quiz.multipleChoice.question 
      : `Spell : ${quiz.spelling.word}. ${quiz.spelling.hint}`;
    readQuestion(textToRead);
  };

  return (
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
            currentQuestion === 0 ? (
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
                      onClick={() => handleAnswer(option.isCorrect)}
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
                <p className="text-gray-600 italic">{quiz.spelling.hint}</p>
                
                {showCamera ? (
                  <div className="space-y-4">
                    <Webcam
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      className="w-full rounded-lg"
                    />
                    {capturedText && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-700">Captured Text:</p>
                        <p className="text-gray-600">{capturedText}</p>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={captureImage}
                        disabled={isProcessing}
                        className="flex-1 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50"
                      >
                        {isProcessing ? "Reading text..." : "Capture & Check"}
                      </button>
                      <button
                        onClick={() => setShowCamera(false)}
                        className="px-4 py-2 border rounded-md hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      value={spellingAnswer}
                      onChange={(e) => setSpellingAnswer(e.target.value)}
                      className="w-full p-2 border rounded-md"
                      placeholder="Type your answer..."
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSpellingSubmit}
                        className="flex-1 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                      >
                        Submit Answer
                      </button>
                      <button
                        onClick={() => setShowCamera(true)}
                        className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-gray-50"
                      >
                        <Camera size={20} />
                        Use Camera
                      </button>
                    </div>
                  </>
                )}
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
  );
};

export default QuizModal;