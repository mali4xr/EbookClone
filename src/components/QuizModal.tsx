import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, Volume2, Keyboard, AlertCircle, CheckCircle, XCircle, RotateCcw, RefreshCw } from 'lucide-react';
import { useBook } from '../context/BookContext';
import confetti from 'canvas-confetti';
import Webcam from 'react-webcam';
import { createWorker } from 'tesseract.js';
import { GeminiService } from '../services/GeminiService';
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
        instructions?: string;
      };
    };
  };
}

interface OCRResult {
  text: string;
  confidence: number;
  method: 'tesseract' | 'gemini';
}

export const QuizModal = ({ onClose, pageContent, onScoreUpdate }: QuizModalProps) => {
  const { voiceIndex, rate, pitch, volume, availableVoices, geminiApiKey, geminiModel } = useBook();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showScore, setShowScore] = useState(false);
  const [spellingAnswer, setSpellingAnswer] = useState('');
  const [isReading, setIsReading] = useState(false);
  const [inputMode, setInputMode] = useState<'text' | 'camera'>('camera');
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrResults, setOcrResults] = useState<OCRResult[]>([]);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [showLivePreview, setShowLivePreview] = useState(true);
  const [showDragDrop, setShowDragDrop] = useState(true);
  const [showMultipleChoice, setShowMultipleChoice] = useState(false);
  const [showSpelling, setShowSpelling] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [aiMessages, setAiMessages] = useState<any[]>([]);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const [hasReadQuestion, setHasReadQuestion] = useState(false);
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
      ],
      instructions: "Use arrow keys to move items around, then press Enter to drop them in the right place!"
    }
  };

  // Get available cameras on component mount
  useEffect(() => {
    const getCameras = async () => {
      try {
        // Request permission first
        await navigator.mediaDevices.getUserMedia({ video: true });
        
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setAvailableCameras(videoDevices);
        console.log('Available cameras:', videoDevices);
      } catch (error) {
        console.error('Error getting cameras:', error);
      }
    };

    getCameras();
  }, []);

  // Auto-read questions when they appear
  useEffect(() => {
    if (!hasReadQuestion) {
      let textToRead = '';
      
      if (showDragDrop) {
        textToRead = quiz.dragDrop?.instructions || "Complete the drag and drop activity by matching the items to their correct places.";
      } else if (showMultipleChoice) {
        textToRead = quiz.multipleChoice.question;
      } else if (showSpelling) {
        textToRead = `Spell the word: ${quiz.spelling.word}`;
      }
      
      if (textToRead) {
        setTimeout(() => {
          readQuestion(textToRead);
          setHasReadQuestion(true);
        }, 500); // Small delay to let the UI settle
      }
    }
  }, [showDragDrop, showMultipleChoice, showSpelling, hasReadQuestion]);

  // Reset hasReadQuestion when transitioning between quiz types
  useEffect(() => {
    setHasReadQuestion(false);
  }, [showDragDrop, showMultipleChoice, showSpelling]);

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

  const playCorrectSound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2);
    oscillator.frequency.setValueAtTime(1046.50, audioContext.currentTime + 0.3);
    
    gainNode.gain.setValueAtTime(volume * 0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.6);
  };

  const celebrateCorrectAnswer = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    playCorrectSound();

    let congratsText = "Correct answer!";
    if (showSpelling) congratsText = "Perfect spelling! Great job!";
    if (showDragDrop) congratsText = "Excellent matching! Well done!";
    
    readQuestion(congratsText);
  };

  const handleDragDropComplete = () => {
    celebrateCorrectAnswer();
    setScore(score + 1);
    
    setIsTransitioning(true);
    setTimeout(() => {
      setShowDragDrop(false);
      setShowMultipleChoice(true);
      setIsTransitioning(false);
    }, 2000);
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
      setShowMultipleChoice(false);
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
    
    setShowScore(true);
  };

  const processWithTesseract = async (imageSrc: string): Promise<OCRResult> => {
    const worker = await createWorker();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    
    const { data: { text, confidence } } = await worker.recognize(imageSrc);
    await worker.terminate();

    return {
      text: text.trim(),
      confidence: confidence / 100,
      method: 'tesseract'
    };
  };

  const processWithGemini = async (imageSrc: string): Promise<OCRResult> => {
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    const result = await GeminiService.recognizeText(imageSrc, geminiApiKey, geminiModel);
    return {
      text: result.text,
      confidence: result.confidence,
      method: 'gemini'
    };
  };

  const switchCamera = async () => {
    if (availableCameras.length <= 1) {
      console.log('Only one camera available');
      return;
    }

    const nextIndex = (currentCameraIndex + 1) % availableCameras.length;
    setCurrentCameraIndex(nextIndex);
    
    // Reset captured image when switching cameras
    setCapturedImage(null);
    setShowLivePreview(true);
    setOcrResults([]);
    setIsProcessing(false);
    
    console.log(`Switching to camera ${nextIndex + 1}/${availableCameras.length}:`, availableCameras[nextIndex]);
  };

  const getCurrentCameraConstraints = () => {
    if (availableCameras.length > 0 && availableCameras[currentCameraIndex]) {
      return {
        width: 320,
        height: 240,
        deviceId: { exact: availableCameras[currentCameraIndex].deviceId }
      };
    }
    
    // Fallback to facingMode if no specific cameras available
    return {
      width: 320,
      height: 240,
      facingMode: 'user'
    };
  };

  const captureImage = async () => {
    if (!webcamRef.current) return;
    
    setIsProcessing(true);
    setOcrResults([]);
    const imageSrc = webcamRef.current.getScreenshot();
    
    if (!imageSrc) {
      setIsProcessing(false);
      return;
    }

    // Stop live preview and show captured image
    setShowLivePreview(false);
    setCapturedImage(imageSrc);

    const results: OCRResult[] = [];
    let finalResult: OCRResult | null = null;

    try {
      // First try Tesseract.js
      console.log('Trying Tesseract.js...');
      const tesseractResult = await processWithTesseract(imageSrc);
      results.push(tesseractResult);
      
      const cleanedTesseractText = tesseractResult.text.toLowerCase().replace(/[^a-z]/g, '');
      const targetWord = quiz.spelling.word.toLowerCase();
      
      if (cleanedTesseractText.includes(targetWord)) {
        finalResult = tesseractResult;
        console.log('Tesseract succeeded!');
      } else {
        console.log('Tesseract failed, trying Gemini...');
        
        // Try Gemini as fallback
        if (geminiApiKey) {
          try {
            const geminiResult = await processWithGemini(imageSrc);
            results.push(geminiResult);
            
            const cleanedGeminiText = geminiResult.text.toLowerCase().replace(/[^a-z]/g, '');
            if (cleanedGeminiText.includes(targetWord)) {
              finalResult = geminiResult;
              console.log('Gemini succeeded!');
            }
          } catch (geminiError) {
            console.error('Gemini failed:', geminiError);
            results.push({
              text: 'Gemini API Error',
              confidence: 0,
              method: 'gemini'
            });
          }
        } else {
          results.push({
            text: 'Gemini API key not configured',
            confidence: 0,
            method: 'gemini'
          });
        }
      }

      setOcrResults(results);

      if (finalResult) {
        celebrateCorrectAnswer();
        setScore(score + 1);
        setShowScore(true);
        readQuestion(`Great job! Now let's continue the story`);
      } else {
        readQuestion(`You tried but your spelling is not correct. The word was "${quiz.spelling.word}". Please, read the story and try again.`);
        setShowScore(true);
      }
      
    } catch (error) {
      console.error('OCR Error:', error);
      readQuestion("Sorry, I couldn't read your spelling clearly. Please try again or type your answer.");
      setOcrResults([{
        text: 'Processing Error',
        confidence: 0,
        method: 'tesseract'
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleListenAgain = () => {
    let textToRead = '';
    if (showDragDrop) {
      textToRead = quiz.dragDrop?.instructions || "Complete the drag and drop activity by matching the items to their correct places.";
    } else if (showMultipleChoice) {
      textToRead = quiz.multipleChoice.question;
    } else if (showSpelling) {
      textToRead = `Spell the word: ${quiz.spelling.word}`;
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
      
      if (text.includes('answer') && showMultipleChoice) {
        console.log('AI quiz assistance:', message.message);
      }
    }
  };

  const getAIContext = () => {
    let context = `You are helping a child with a reading quiz. 
    Current story text: "${pageContent.text}"`;
    
    if (showDragDrop) {
      context += `
       Drag and drop activity: The child needs to match items to their correct places.
       Please encourage them and provide hints about the story connections.`;
    } else if (showMultipleChoice) {
      context += `
       Current question: "${quiz.multipleChoice.question}"
       Available options: ${quiz.multipleChoice.options.map(opt => opt.text).join(', ')}
       Please help the child understand the question and guide them to the correct answer.`;
    } else if (showSpelling) {
      context += `
       Spelling challenge: The child needs to spell the word "${quiz.spelling.word}"
       Hint: ${quiz.spelling.hint}
       Please help them with pronunciation, letter sounds, or spelling strategies.`;
    }
    
    context += `
    Be encouraging, patient, and educational. Use simple language appropriate for children.`;
    
    return context;
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setShowLivePreview(true);
    setOcrResults([]);
    setIsProcessing(false);
  };

  const getOCRStatusIcon = (result: OCRResult) => {
    const targetWord = quiz.spelling.word.toLowerCase();
    const cleanedText = result.text.toLowerCase().replace(/[^a-z]/g, '');
    const isCorrect = cleanedText.includes(targetWord);
    
    if (result.text === 'Processing Error' || result.text === 'Gemini API Error') {
      return <XCircle size={16} className="text-red-500" />;
    }
    
    return isCorrect ? 
      <CheckCircle size={16} className="text-green-500" /> : 
      <XCircle size={16} className="text-red-500" />;
  };

  const getCameraButtonText = () => {
    if (availableCameras.length > 1) {
      return `Camera ${currentCameraIndex + 1}/${availableCameras.length}`;
    }
    return 'Switch Camera';
  };

  const handleContinue = () => {
    if (isReading) {
      window.speechSynthesis.cancel();
    }
    
    // If all quiz answers are correct, navigate to next page
    if (score === 3) {
      const { nextPage } = useBook();
      nextPage();
    }
    
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate__animated animate__fadeIn">
        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate__animated animate__bounceIn">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-xl font-bold text-gray-800 animate__animated animate__fadeInLeft">
              Quiz Time! ({score}/3) 🎯
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
              showDragDrop ? (
                <div className="animate__animated animate__slideInUp">
                  <DragDropQuiz
                    dragItems={quiz.dragDrop?.dragItems || []}
                    dropZones={quiz.dragDrop?.dropZones || []}
                    instructions={quiz.dragDrop?.instructions}
                    onComplete={handleDragDropComplete}
                  />
                </div>
              ) : showMultipleChoice ? (
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
              ) : showSpelling ? (
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
                  <p className="text-gray-600 italic animate__animated animate__fadeIn animate__delay-1s">
                    Hint: {quiz.spelling.hint}
                  </p>
                  
                  <div className="flex items-center justify-center space-x-4 animate__animated animate__fadeInUp animate__delay-1s">
                    <button
                      onClick={() => setInputMode('camera')}
                      className={`flex items-center gap-2 p-2 rounded transition-all duration-300 transform hover:scale-110 ${
                        inputMode === 'camera' ? 'bg-purple-100 text-purple-600' : 'text-gray-500'
                      }`}
                    >
                      <Camera size={20} />
                      <span>Camera</span>
                    </button>
                    <button
                      onClick={() => setInputMode('text')}
                      className={`flex items-center gap-2 p-2 rounded transition-all duration-300 transform hover:scale-110 ${
                        inputMode === 'text' ? 'bg-purple-100 text-purple-600' : 'text-gray-500'
                      }`}
                    >
                      <Keyboard size={20} />
                      <span>Type</span>
                    </button>
                  </div>

                  {inputMode === 'camera' ? (
                    <div className="space-y-4 animate__animated animate__fadeIn">
                      {/* Only show camera controls during spelling quiz */}
                      {showSpelling && (
                        <>
                          <div className="text-center p-3 bg-blue-50 rounded-lg animate__animated animate__fadeInDown">
                            <p className="text-sm text-blue-700">Write your answer on paper and show it to the camera</p>
                            <p className="text-xs text-blue-600 mt-1">
                              We'll try Tesseract first, then Gemini AI if needed
                            </p>
                          </div>
                          
                          {/* Camera Controls */}
                          <div className="flex justify-center gap-2 mb-4">
                            <button
                              onClick={switchCamera}
                              className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-all duration-300 transform hover:scale-105"
                              disabled={isProcessing || availableCameras.length <= 1}
                            >
                              <Camera size={16} />
                              <RotateCcw size={16} />
                              <span className="text-sm">{getCameraButtonText()}</span>
                            </button>
                            
                            {capturedImage && (
                              <button
                                onClick={retakePhoto}
                                className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-all duration-300 transform hover:scale-105"
                                disabled={isProcessing}
                              >
                                <RefreshCw size={16} />
                                <span className="text-sm">Retake</span>
                              </button>
                            )}
                          </div>

                          {/* Camera Preview and Captured Image Side by Side */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Live Preview */}
                            <div className="space-y-2">
                              <h4 className="text-sm font-medium text-gray-700 text-center">
                                {showLivePreview ? 'Live Preview' : 'Camera Off'}
                              </h4>
                              {showLivePreview ? (
                                <Webcam
                                  ref={webcamRef}
                                  screenshotFormat="image/jpeg"
                                  className="w-full h-32 md:h-40 rounded-lg border animate__animated animate__zoomIn object-cover"
                                  videoConstraints={getCurrentCameraConstraints()}
                                  onUserMediaError={(error) => {
                                    console.error('Camera error:', error);
                                    setShowLivePreview(false);
                                  }}
                                />
                              ) : (
                                <div className="w-full h-32 md:h-40 rounded-lg border bg-gray-100 flex items-center justify-center">
                                  <Camera size={32} className="text-gray-400" />
                                </div>
                              )}
                            </div>

                            {/* Captured Image */}
                            <div className="space-y-2">
                              <h4 className="text-sm font-medium text-gray-700 text-center">
                                Captured Image
                              </h4>
                              {capturedImage ? (
                                <img
                                  src={capturedImage}
                                  alt="Captured handwriting"
                                  className="w-full h-32 md:h-40 rounded-lg border object-cover animate__animated animate__zoomIn"
                                />
                              ) : (
                                <div className="w-full h-32 md:h-40 rounded-lg border bg-gray-50 flex items-center justify-center">
                                  <div className="text-center text-gray-400">
                                    <Camera size={24} className="mx-auto mb-1" />
                                    <p className="text-xs">No image captured</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* OCR Results Display */}
                          {ocrResults.length > 0 && (
                            <div className="space-y-2 animate__animated animate__fadeInUp">
                              <h4 className="font-medium text-gray-700">Recognition Results:</h4>
                              {ocrResults.map((result, index) => (
                                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                                  {getOCRStatusIcon(result)}
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium capitalize">{result.method}:</span>
                                      <span className="text-sm">{result.text || 'No text detected'}</span>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      Confidence: {Math.round(result.confidence * 100)}%
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          <button
                            onClick={captureImage}
                            disabled={isProcessing || !showLivePreview}
                            className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-300 disabled:opacity-50 font-medium transform hover:scale-105"
                          >
                            {isProcessing ? (
                              <span className="animate__animated animate__flash animate__infinite">
                                Processing with AI...
                              </span>
                            ) : (
                              "📸 Capture & Check with AI"
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
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
                  )}
                </div>
              ) : null
            ) : (
              <div className="text-center space-y-4 animate__animated animate__bounceIn">
                <h3 className="text-2xl font-bold animate__animated animate__rubberBand">
                  You scored {score} out of 3! 🎉
                </h3>
                <p className="text-gray-600 animate__animated animate__fadeInUp animate__delay-1s">
                  {score === 3 ? "Perfect score! Amazing work! 🌟" :
                   score === 2 ? "Great job! Almost perfect! 👍" :
                   score === 1 ? "Good try! Keep practicing! 💪" :
                   "Don't worry, keep learning! 📚"}
                </p>
                
                {/* OCR Summary */}
                {ocrResults.length > 0 && (
                  <div className="p-3 bg-gray-50 rounded-lg animate__animated animate__fadeInUp animate__delay-2s">
                    <p className="text-sm text-gray-700 font-medium">Spelling Recognition Summary:</p>
                    <div className="text-xs text-gray-600 mt-1 space-y-1">
                      {ocrResults.map((result, index) => (
                        <div key={index} className="flex items-center gap-2">
                          {getOCRStatusIcon(result)}
                          {/* <span className="capitalize">{result.method}:</span> */}
                          <span className="capitalize"> Status</span>
                          <span>"{result.text}" ({Math.round(result.confidence * 100)}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {aiMessages.length > 0 && (
                  <div className="p-3 bg-blue-50 rounded-lg animate__animated animate__fadeInUp animate__delay-3s">
                    <p className="text-sm text-blue-700 font-medium">AI Feedback:</p>
                    <p className="text-blue-600 text-sm mt-1">
                      {aiMessages[aiMessages.length - 1]?.message || "Great conversation!"}
                    </p>
                  </div>
                )}
                
                <button
                  onClick={handleContinue}
                  className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-all duration-300 transform hover:scale-110 animate__animated animate__pulse animate__infinite"
                >
                  {score === 3 ? 'Next Page' : 'Continue Reading'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};