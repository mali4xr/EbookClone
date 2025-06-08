import React, { useState, useEffect } from 'react';
import { X, Camera, Volume2, Keyboard } from 'lucide-react';
import { useBook } from '../context/BookContext';
import confetti from 'canvas-confetti';
import Webcam from 'react-webcam';
import { createWorker } from 'tesseract.js';
import ConversationalAIButton from './ConversationalAIButton';
import DragDropQuiz from './DragDropQuiz';

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
      dragDrop?: {
        dragItems: { id: string; image: string; label: string }[];
        dropZones: { id: string; image: string; label: string; acceptsId: string }[];
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedText, setCapturedText] = useState<string | null>(null);
  const [showSpelling, setShowSpelling] = useState(false);
  const [showDragDrop, setShowDragDrop] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [aiMessages, setAiMessages] = useState<any[]>([]);
  const webcamRef = React.useRef<Webcam>(null);

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
    },
    dragDrop: {
      dragItems: [
        { id: 'item1', image: 'https://images.pexels.com/photos/326012/pexels-photo-326012.jpeg?auto=compress&cs=tinysrgb&w=200', label: 'Rabbit' },
        { id: 'item2', image: 'https://images.pexels.com/photos/416179/pexels-photo-416179.jpeg?auto=compress&cs=tinysrgb&w=200', label: 'Bird' }
      ],
      dropZones: [
        { id: 'zone1', image: 'https://images.pexels.com/photos/1287075/pexels-photo-1287075.jpeg?auto=compress&cs=tinysrgb&w=200', label: 'Forest Home', acceptsId: 'item1' },
        { id: 'zone2', image: 'https://images.pexels.com/photos/531321/pexels-photo-531321.jpeg?auto=compress&cs=tinysrgb&w=200', label: 'Tree Nest', acceptsId: 'item2' }
      ]
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
    if (!showScore && !isReading && !isTransitioning) {
      let textToRead = '';
      if (currentQuestion === 0) {
        textToRead = quiz.multipleChoice.question;
      } else if (showSpelling) {
        textToRead = `Please spell the word: ${quiz.spelling.word}. ${quiz.spelling.hint}`;
      } else if (showDragDrop) {
        textToRead = "Complete the drag and drop activity by matching the items to their correct places.";
      }
      if (textToRead) {
        readQuestion(textToRead);
      }
    }
  }, [currentQuestion, showScore, showSpelling, showDragDrop, isTransitioning]);

  const celebrateCorrectAnswer = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    const audio = new Audio('/sounds/correct.mp3');
    audio.volume = volume;
    audio.play().catch(e => console.log('Audio play failed:', e));

    let congratsText = "Correct answer!";
    if (showSpelling) congratsText = "Perfect spelling! Great job!";
    if (showDragDrop) congratsText = "Excellent matching! Well done!";
    
    readQuestion(congratsText);
  };

  const handleMultipleChoiceAnswer = (isCorrect: boolean) => {
    if (isReading) {
      window.speechSynthesis.cancel();
    }
    
    if (isCorrect) {
      celebrateCorrectAnswer();
      setScore(score + 1);
    } else {
      readQuestion("That's not correct. Try again next time!");
    }
    
    setIsTransitioning(true);
    setTimeout(() => {
      setShowSpelling(true);
      setIsTransitioning(false);
    }, 2000);
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
    
    setIsTransitioning(true);
    setTimeout(() => {
      setShowDragDrop(true);
      setIsTransitioning(false);
    }, 2000);
  };

  const handleDragDropComplete = () => {
    celebrateCorrectAnswer();
    setScore(score + 1);
    setShowScore(true);
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
        setIsTransitioning(true);
        setTimeout(() => {
          setShowDragDrop(true);
          setIsTransitioning(false);
        }, 2000);
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

  const handleListenAgain = () => {
    let textToRead = '';
    if (!showSpelling && !showDragDrop) {
      textToRead = quiz.multipleChoice.question;
    } else if (showSpelling) {
      textToRead = `Spell: ${quiz.spelling.word}. ${quiz.spelling.hint}`;
    } else if (showDragDrop) {
      textToRead = "Complete the drag and drop activity.";
    }
    readQuestion(textToRead);
  };

  const handleAIMessage = (message: any) => {
    setAiMessages(prev => [...prev, message]);
    
    if (message.message && typeof message.message === 'string') {
      const text = message.message.toLowerCase();
      
      if (text.includes('spell') && showSpelling) {
        console.log('AI spelling assistance:', message.message);
      }
      
      if (text.includes('answer') && !showSpelling && !showDragDrop) {
        console.log('AI quiz assistance:', message.message);
      }
    }
  };

  const getAIContext = () => {
    let context = `You are helping a child with a reading quiz. 
    Current story text: "${pageContent.text}"`;
    
    if (!showSpelling && !showDragDrop) {
      context += `
       Current question: "${quiz.multipleChoice.question}"
       Available options: ${quiz.multipleChoice.options.map(opt => opt.text).join(', ')}
       Please help the child understand the question and guide them to the correct answer.`;
    } else if (showSpelling) {
      context += `
       Spelling challenge: The child needs to spell the word "${quiz.spelling.word}"
       Hint: ${quiz.spelling.hint}
       Please help them with pronunciation, letter sounds, or spelling strategies.`;
    } else if (showDragDrop) {
      context += `
       Drag and drop activity: The child needs to match items to their correct places.
       Please encourage them and provide hints about the story connections.`;
    }
    
    context += `
    Be encouraging, patient, and educational. Use simple language appropriate for children.`;
    
    return context;
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate__animated animate__fadeIn">
        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate__animated animate__bounceIn">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-xl font-bold text-gray-800 animate__animated animate__fadeInLeft">
              Quiz Time! ({score}/3)
            </h2>
            <div className="flex items-center gap-2">
              <ConversationalAIButton
                context={getAIContext()}
                onMessage={handleAIMessage}
                className="animate__animated animate__fadeInDown"
              />
              <button 
                onClick={() => {
                  if (isReading) {
                    window.speechSynthesis.cancel();
                  }
                  onClose();
                }}
                className="p-1 rounded-full hover:bg-gray-100 animate__animated animate__fadeInRight"
              >
                <X size={24} />
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {!showScore ? (
              !showSpelling && !showDragDrop ? (
                <div className="space-y-4 animate__animated animate__fadeInUp">
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-medium">{quiz.multipleChoice.question}</p>
                    <button
                      onClick={handleListenAgain}
                      className="p-2 rounded-full hover:bg-purple-100 text-purple-600 animate__animated animate__pulse animate__infinite"
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
                        className="w-full p-3 text-left border rounded-lg hover:bg-purple-50 transition-all duration-300 transform hover:scale-105 animate__animated animate__fadeInUp"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        {option.text}
                      </button>
                    ))}
                  </div>
                </div>
              ) : showSpelling && !showDragDrop ? (
                <div className="space-y-4 animate__animated animate__slideInRight">
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-medium">Spell the word you hear:</p>
                    <button
                      onClick={handleListenAgain}
                      className="p-2 rounded-full hover:bg-purple-100 text-purple-600 animate__animated animate__pulse animate__infinite"
                      aria-label="Listen again"
                    >
                      <Volume2 size={20} />
                    </button>
                  </div>
                  <p className="text-gray-600 italic animate__animated animate__fadeIn animate__delay-1s">{quiz.spelling.hint}</p>
                  
                  <div className="flex items-center justify-center space-x-4 animate__animated animate__fadeInUp animate__delay-1s">
                    <button
                      onClick={() => setInputMode('text')}
                      className={`flex items-center gap-2 p-2 rounded transition-all duration-300 transform hover:scale-110 ${
                        inputMode === 'text' ? 'bg-purple-100 text-purple-600' : 'text-gray-500'
                      }`}
                    >
                      <Keyboard size={20} />
                      <span>Type</span>
                    </button>
                    <button
                      onClick={() => setInputMode('camera')}
                      className={`flex items-center gap-2 p-2 rounded transition-all duration-300 transform hover:scale-110 ${
                        inputMode === 'camera' ? 'bg-purple-100 text-purple-600' : 'text-gray-500'
                      }`}
                    >
                      <Camera size={20} />
                      <span>Camera</span>
                    </button>
                  </div>

                  {inputMode === 'text' ? (
                    <div className="animate__animated animate__fadeIn">
                      <input
                        type="text"
                        value={spellingAnswer}
                        onChange={(e) => setSpellingAnswer(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                        placeholder="Type your answer..."
                      />
                      <button
                        onClick={handleSpellingSubmit}
                        className="w-full mt-3 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-300 font-medium transform hover:scale-105 animate__animated animate__pulse animate__infinite"
                      >
                        Submit Answer
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 animate__animated animate__fadeIn">
                      <div className="text-center p-3 bg-blue-50 rounded-lg animate__animated animate__fadeInDown">
                        <p className="text-sm text-blue-700">Write your answer on paper and show it to the camera</p>
                      </div>
                      
                      <Webcam
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        className="w-full rounded-lg border animate__animated animate__zoomIn"
                        videoConstraints={{
                          width: 320,
                          height: 240,
                          facingMode: "user"
                        }}
                      />
                      
                      {capturedText && (
                        <div className="p-3 bg-gray-50 rounded-lg animate__animated animate__fadeInUp">
                          <p className="text-sm font-medium text-gray-700">Captured Text:</p>
                          <p className="text-gray-600">{capturedText}</p>
                        </div>
                      )}
                      
                      <button
                        onClick={captureImage}
                        disabled={isProcessing}
                        className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-300 disabled:opacity-50 font-medium transform hover:scale-105"
                      >
                        {isProcessing ? (
                          <span className="animate__animated animate__flash animate__infinite">Reading text...</span>
                        ) : (
                          "📸 Capture & Check"
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="animate__animated animate__slideInUp">
                  <DragDropQuiz
                    dragItems={quiz.dragDrop?.dragItems || []}
                    dropZones={quiz.dragDrop?.dropZones || []}
                    onComplete={handleDragDropComplete}
                  />
                </div>
              )
            ) : (
              <div className="text-center space-y-4 animate__animated animate__bounceIn">
                <h3 className="text-2xl font-bold animate__animated animate__rubberBand">
                  You scored {score} out of 3!
                </h3>
                <p className="text-gray-600 animate__animated animate__fadeInUp animate__delay-1s">
                  {score === 3 ? "Perfect score! Amazing work! 🎉" :
                   score === 2 ? "Great job! Almost perfect! 👍" :
                   score === 1 ? "Good try! Keep practicing! 💪" :
                   "Don't worry, keep learning! 📚"}
                </p>
                
                {aiMessages.length > 0 && (
                  <div className="p-3 bg-blue-50 rounded-lg animate__animated animate__fadeInUp animate__delay-2s">
                    <p className="text-sm text-blue-700 font-medium">AI Feedback:</p>
                    <p className="text-blue-600 text-sm mt-1">
                      {aiMessages[aiMessages.length - 1]?.message || "Great conversation!"}
                    </p>
                  </div>
                )}
                
                <button
                  onClick={() => {
                    if (isReading) {
                      window.speechSynthesis.cancel();
                    }
                    onClose();
                  }}
                  className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-all duration-300 transform hover:scale-110 animate__animated animate__pulse animate__infinite"
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