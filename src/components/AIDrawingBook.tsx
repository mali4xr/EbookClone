import React, { useRef, useEffect, useState } from 'react';
import { Palette, Sparkles, RotateCcw, BookOpen, Wand2, Camera, Loader, Edit3 } from 'lucide-react';
import { GeminiService } from '../services/GeminiService';
import confetti from 'canvas-confetti';

interface AIDrawingBookProps {
  onBack: () => void;
}

const AIDrawingBook: React.FC<AIDrawingBookProps> = ({ onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const webcamRef = useRef<HTMLVideoElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState<string>('');
  const [story, setStory] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGettingIdea, setIsGettingIdea] = useState(false);
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [showStorySection, setShowStorySection] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<'photo' | 'drawing'>('photo');
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [recognizedContent, setRecognizedContent] = useState<string>('');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      
      // Set up canvas context
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  const getMousePos = (canvas: HTMLCanvasElement, e: MouseEvent | TouchEvent): { x: number; y: number } => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (inputMode !== 'drawing') return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsDrawing(true);
    const pos = getMousePos(canvas, e.nativeEvent);
    setLastPos(pos);
    canvas.style.cursor = 'crosshair';
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current || inputMode !== 'drawing') return;
    
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentPos = getMousePos(canvas, e.nativeEvent);
    
    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(currentPos.x, currentPos.y);
    ctx.stroke();
    
    setLastPos(currentPos);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (canvasRef.current) {
      canvasRef.current.style.cursor = 'default';
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    setGeneratedImage(null);
    setStory('');
    setCurrentPrompt('');
    setShowStorySection(false);
    setError(null);
    setCapturedPhoto(null);
    setRecognizedContent('');
  };

  const isCanvasEmpty = (): boolean => {
    const canvas = canvasRef.current;
    if (!canvas) return true;

    const ctx = canvas.getContext('2d');
    if (!ctx) return true;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return imageData.data.every(pixel => pixel === 0);
  };

  const getCanvasAsBase64 = (): string => {
    const canvas = canvasRef.current;
    if (!canvas) return '';

    // Create a temporary canvas with white background
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    
    if (tempCtx) {
      // Fill with white background
      tempCtx.fillStyle = '#FFFFFF';
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      
      // Draw the original canvas on top
      tempCtx.drawImage(canvas, 0, 0);
    }
    
    return tempCanvas.toDataURL('image/png').split(',')[1];
  };

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'environment' // Use back camera if available
        } 
      });
      
      if (webcamRef.current) {
        webcamRef.current.srcObject = stream;
        setIsWebcamActive(true);
      }
    } catch (error) {
      console.error('Error accessing webcam:', error);
      setError('Could not access camera. Please check permissions.');
    }
  };

  const stopWebcam = () => {
    if (webcamRef.current && webcamRef.current.srcObject) {
      const stream = webcamRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      webcamRef.current.srcObject = null;
      setIsWebcamActive(false);
    }
  };

  const capturePhoto = () => {
    if (!webcamRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = webcamRef.current.videoWidth;
    canvas.height = webcamRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(webcamRef.current, 0, 0);
      const photoDataUrl = canvas.toDataURL('image/png');
      setCapturedPhoto(photoDataUrl);
      stopWebcam();
    }
  };

  const recognizeImage = async (imageData: string): Promise<string> => {
    try {
      const prompt = "Look at this image and describe what you see in simple terms. Focus on the main objects, shapes, animals, or things that could be turned into a coloring book page. Be descriptive but concise.";
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GeminiService.getApiKey()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inlineData: { mimeType: "image/png", data: imageData } }
            ]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return result.candidates[0].content.parts[0].text.trim();
    } catch (error) {
      console.error('Error recognizing image:', error);
      throw error;
    }
  };

  const getDrawingIdea = async () => {
    setIsGettingIdea(true);
    setError(null);
    
    try {
      const prompt = "Give me a simple, fun, and creative drawing idea for a child. Be concise, one sentence only. For example: 'A friendly robot drinking a milkshake' or 'A snail with a birthday cake for a shell'.";
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GeminiService.getApiKey()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }]
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      const idea = result.candidates[0].content.parts[0].text;
      setCurrentPrompt(idea.trim());
    } catch (error) {
      console.error('Error getting idea:', error);
      setError('Could not get an idea right now. Please try again!');
    } finally {
      setIsGettingIdea(false);
    }
  };

  const triggerConfetti = () => {
    // Create confetti effect over the generated image area
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      // Left side confetti
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.5, 0.7), y: Math.random() - 0.2 }
      });
      
      // Right side confetti
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);
  };

  const enhanceDrawing = async () => {
    if (inputMode === 'drawing' && isCanvasEmpty()) {
      setError('Please draw something on the canvas first!');
      return;
    }

    if (inputMode === 'photo' && !capturedPhoto) {
      setError('Please capture a photo first!');
      return;
    }

    setIsGenerating(true);
    setError(null);
    
    try {
      let imageData: string;
      let recognizedDescription: string;

      if (inputMode === 'drawing') {
        imageData = getCanvasAsBase64();
      } else {
        imageData = capturedPhoto!.split(',')[1]; // Remove data:image/png;base64, prefix
      }

      // Step 1: Use Gemini to recognize what's in the image
      console.log('Recognizing image content with Gemini...');
      recognizedDescription = await recognizeImage(imageData);
      setRecognizedContent(recognizedDescription);
      
      console.log('Gemini recognized:', recognizedDescription);

      // Step 2: Create a coloring book prompt based on the recognition
      const coloringBookPrompt = `${recognizedDescription}, black and white line art, coloring book style, simple outlines, no shading, clean lines, suitable for children to color, white background`;
      
      // Step 3: Generate coloring book image using Pollinations AI
      const seed = Math.floor(Math.random() * 1000000);
      const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(coloringBookPrompt)}?width=512&height=512&seed=${seed}&model=flux`;
      
      console.log('Generating coloring book with Pollinations AI:', pollinationsUrl);
      
      // Set the generated image directly from the URL
      setGeneratedImage(pollinationsUrl);
      setShowStorySection(true);
      
    } catch (error) {
      console.error('Error generating image:', error);
      setError('Oops! Something went wrong while creating the coloring book page.');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateStory = async () => {
    if (!recognizedContent && !currentPrompt) {
      setError('Please create an image first!');
      return;
    }

    setIsGeneratingStory(true);
    setError(null);
    
    try {
      // Use the recognized content or current prompt for story generation
      const storyPrompt = recognizedContent 
        ? `Write a very short (2-3 sentences), happy, and simple story for a young child (3-5 years old) about: ${recognizedContent}. Make it magical and fun!`
        : `Write a very short (2-3 sentences), happy, and simple story for a young child (3-5 years old) about: ${currentPrompt}. Make it magical and encouraging!`;
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GeminiService.getApiKey()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: storyPrompt }] }]
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      const storyText = result.candidates[0].content.parts[0].text;
      setStory(storyText.trim());
    } catch (error) {
      console.error('Error generating story:', error);
      setError('The storyteller seems to be napping! Please try again.');
    } finally {
      setIsGeneratingStory(false);
    }
  };

  const setPhotoMode = () => {
    setInputMode('photo');
    clearCanvas();
    setGeneratedImage(null);
    setRecognizedContent('');
    setError(null);
    startWebcam();
  };

  const setDrawingMode = () => {
    setInputMode('drawing');
    stopWebcam();
    setCapturedPhoto(null);
    setGeneratedImage(null);
    setRecognizedContent('');
    setError(null);
  };

  // Cleanup webcam on unmount
  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, []);

  // Start webcam when component mounts (default photo mode)
  useEffect(() => {
    if (inputMode === 'photo') {
      startWebcam();
    }
  }, []);

  if (!GeminiService.getApiKey()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md text-center">
          <div className="text-red-500 mb-4">
            <Camera size={48} className="mx-auto" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-4">API Key Required</h2>
          <p className="text-gray-600 mb-6">
            Please configure your Gemini API key in the environment variables to use the AI features.
          </p>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Back to Library
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 p-4" style={{ fontFamily: 'Kalam, cursive, sans-serif' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="text-center mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              <BookOpen size={20} className="text-purple-600" />
              <span className="text-purple-600 font-semibold">Back to Library</span>
            </button>
            <div className="text-center flex-1">
              <h1 className="text-4xl md:text-5xl font-bold text-sky-600">AI Coloring Book Creator</h1>
              <p className="text-lg text-orange-500 mt-2">Draw or take a photo, and AI creates a coloring book!</p>
            </div>
            <div className="w-32"></div> {/* Spacer for centering */}
          </div>
        </header>

        {/* Get an Idea Button - Top Center */}
        <div className="text-center mb-6">
          <button
            onClick={getDrawingIdea}
            disabled={isGettingIdea}
            className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-8 rounded-full text-xl shadow-md transform hover:scale-105 transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isGettingIdea ? (
              <span className="flex items-center gap-2">
                <Loader size={20} className="animate-spin" />
                Thinking...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles size={20} />
                Get an Idea
              </span>
            )}
          </button>
        </div>

        {/* Mode Selection Buttons */}
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={setPhotoMode}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-lg transition-all duration-300 transform hover:scale-105 ${
              inputMode === 'photo' 
                ? 'bg-blue-500 text-white shadow-lg' 
                : 'bg-white text-blue-500 border-2 border-blue-500 hover:bg-blue-50'
            }`}
          >
            <Camera size={20} />
            Photo Mode
          </button>
          <button
            onClick={setDrawingMode}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-lg transition-all duration-300 transform hover:scale-105 ${
              inputMode === 'drawing' 
                ? 'bg-green-500 text-white shadow-lg' 
                : 'bg-white text-green-500 border-2 border-green-500 hover:bg-green-50'
            }`}
          >
            <Edit3 size={20} />
            Drawing Mode
          </button>
        </div>

        {/* AI Prompt Display */}
        {currentPrompt && (
          <div className="text-center mb-6 animate__animated animate__fadeIn">
            <div className="bg-sky-100 border-2 border-sky-300 text-sky-800 rounded-lg p-4 text-lg shadow-md max-w-2xl mx-auto">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles size={20} className="text-sky-600" />
                <span className="font-semibold">Drawing Idea:</span>
              </div>
              {currentPrompt}
            </div>
          </div>
        )}

        {/* Recognized Content Display */}
        {recognizedContent && (
          <div className="text-center mb-6 animate__animated animate__fadeIn">
            <div className="bg-green-100 border-2 border-green-300 text-green-800 rounded-lg p-4 text-lg shadow-md max-w-2xl mx-auto">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Wand2 size={20} className="text-green-600" />
                <span className="font-semibold">AI Recognized:</span>
              </div>
              {recognizedContent}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="text-center mb-6 animate__animated animate__fadeIn">
            <div className="bg-red-100 border-2 border-red-300 text-red-800 rounded-lg p-4 text-lg shadow-md max-w-2xl mx-auto">
              {error}
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 bg-white p-6 rounded-3xl shadow-lg border-4 border-dashed border-blue-300">
          {/* Drawing/Photo Canvas Section */}
          <div className="flex flex-col items-center relative">
            <h2 className="text-2xl font-bold mb-4 text-gray-700 flex items-center gap-2">
              <Palette size={24} className="text-purple-600" />
              1. {inputMode === 'photo' ? 'Take Photo' : 'Draw Here'}
            </h2>
            
            <div className="w-full aspect-square bg-white rounded-2xl shadow-inner border-2 border-gray-200 overflow-hidden relative">
              {inputMode === 'drawing' ? (
                <canvas
                  ref={canvasRef}
                  className="w-full h-full rounded-2xl cursor-crosshair"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
              ) : (
                <div className="w-full h-full relative">
                  {capturedPhoto ? (
                    <img
                      src={capturedPhoto}
                      alt="Captured"
                      className="w-full h-full object-cover rounded-2xl"
                    />
                  ) : isWebcamActive ? (
                    <>
                      <video
                        ref={webcamRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover rounded-2xl"
                      />
                      <button
                        onClick={capturePhoto}
                        className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105"
                      >
                        <span className="flex items-center gap-2">
                          <Camera size={20} />
                          Capture Photo
                        </span>
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full bg-gray-100 rounded-2xl">
                      <div className="text-center">
                        <Camera size={48} className="mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-600">Starting camera...</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Clear Button - Bottom Left */}
            <button
              onClick={clearCanvas}
              className="absolute bottom-0 left-0 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transform hover:scale-105 transition-all duration-200 ease-in-out"
            >
              <span className="flex items-center gap-2">
                <RotateCcw size={16} />
                Clear
              </span>
            </button>
          </div>

          {/* AI Generated Image Section */}
          <div className="flex flex-col items-center relative">
            <h2 className="text-2xl font-bold mb-4 text-gray-700 flex items-center gap-2">
              <Wand2 size={24} className="text-pink-600" />
              2. Coloring Book Page
            </h2>
            
            <div className="relative w-full aspect-square bg-gray-100 rounded-2xl shadow-inner border-2 border-gray-200 flex items-center justify-center overflow-hidden">
              {isGenerating && (
                <div className="absolute z-10 flex flex-col items-center">
                  <Loader size={48} className="animate-spin text-pink-500 mb-4" />
                  <p className="text-gray-600 font-semibold">Creating coloring book...</p>
                </div>
              )}
              
              {generatedImage ? (
                <img
                  src={generatedImage}
                  alt="AI generated coloring book page"
                  className="w-full h-full object-contain animate__animated animate__fadeIn"
                  key={generatedImage}
                  onLoad={() => {
                    // Trigger confetti when image actually loads
                    if (!isGenerating) {
                      setTimeout(() => {
                        triggerConfetti();
                      }, 100);
                    }
                  }}
                />
              ) : (
                <div className="text-center text-gray-500 p-8">
                  <Sparkles size={48} className="mx-auto mb-4 text-gray-400" />
                  <p className="text-lg">Your coloring book page will appear here!</p>
                </div>
              )}
            </div>

            {/* Create Magic Button - Bottom Right */}
            <button
              onClick={enhanceDrawing}
              disabled={isGenerating}
              className="absolute bottom-0 right-0 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transform hover:scale-105 transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isGenerating ? (
                <span className="flex items-center gap-2">
                  <Loader size={16} className="animate-spin" />
                  Creating...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Wand2 size={16} />
                  Create Coloring Book
                </span>
              )}
            </button>
          </div>
        </main>

        {/* Story Section */}
        {showStorySection && (
          <section className="mt-8 w-full max-w-4xl mx-auto animate__animated animate__fadeInUp">
            <div className="text-center mb-4">
              <button
                onClick={generateStory}
                disabled={isGeneratingStory}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-full text-xl shadow-md transform hover:scale-105 transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isGeneratingStory ? (
                  <span className="flex items-center gap-2">
                    <Loader size={20} className="animate-spin" />
                    Writing...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <BookOpen size={20} />
                    Tell me a Story
                  </span>
                )}
              </button>
            </div>
            
            {story && (
              <div className="bg-orange-100 border-2 border-orange-300 text-orange-900 rounded-lg p-6 text-lg shadow-inner animate__animated animate__fadeIn">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen size={24} className="text-orange-600" />
                  <span className="font-bold text-orange-800">Your Story:</span>
                </div>
                <p className="leading-relaxed">{story}</p>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
};

export default AIDrawingBook;