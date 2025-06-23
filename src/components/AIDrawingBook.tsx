import React, { useRef, useEffect, useState } from 'react';
import { Palette, Sparkles, RotateCcw, BookOpen, Wand2, Camera, Loader } from 'lucide-react';
import { GeminiService } from '../services/GeminiService';

interface AIDrawingBookProps {
  onBack: () => void;
}

const AIDrawingBook: React.FC<AIDrawingBookProps> = ({ onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
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
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsDrawing(true);
    const pos = getMousePos(canvas, e.nativeEvent);
    setLastPos(pos);
    canvas.style.cursor = 'crosshair';
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    
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

  const enhanceDrawing = async () => {
    if (isCanvasEmpty()) {
      setError('Please draw something on the canvas first!');
      return;
    }

    setIsGenerating(true);
    setError(null);
    
    try {
      const base64ImageData = getCanvasAsBase64();
      
      const prompt = "Transform this simple sketch into a colorful and charming child's crayon drawing. The style should be naive and playful, with thick, wobbly lines like a kid drew it. Use a bright, happy primary color palette. The background must be solid white.";
      
      const payload = {
        instances: [{
          prompt: prompt,
          image: { bytesBase64Encoded: base64ImageData }
        }],
        parameters: { sampleCount: 1 }
      };

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${GeminiService.getApiKey()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.predictions && result.predictions[0]?.bytesBase64Encoded) {
        setGeneratedImage(`data:image/png;base64,${result.predictions[0].bytesBase64Encoded}`);
        setShowStorySection(true);
      } else {
        throw new Error('No image was generated.');
      }
    } catch (error) {
      console.error('Error generating image:', error);
      setError('Oops! Something went wrong while creating the drawing.');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateStory = async () => {
    if (isCanvasEmpty()) {
      setError('Please draw something first!');
      return;
    }

    setIsGeneratingStory(true);
    setError(null);
    
    try {
      const base64ImageData = getCanvasAsBase64();
      
      const prompt = "Look at this child's sketch. Write a very short (2-3 sentences), happy, and simple story for a young child (3-5 years old) about what is happening in the drawing. Speak as if you are telling the story to the child who drew it.";
      
      const payload = {
        contents: [{
          parts: [
            { text: prompt },
            { inlineData: { mimeType: "image/png", data: base64ImageData } }
          ]
        }]
      };

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GeminiService.getApiKey()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
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

  if (!GeminiService.getApiKey()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md text-center">
          <div className="text-red-500 mb-4">
            <Camera size={48} className="mx-auto" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-4">API Key Required</h2>
          <p className="text-gray-600 mb-6">
            Please configure your Gemini API key in the environment variables to use the AI drawing features.
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
              <h1 className="text-4xl md:text-5xl font-bold text-sky-600">Sketch-A-Magic AI</h1>
              <p className="text-lg text-orange-500 mt-2">Draw, get ideas, and create stories with AI!</p>
            </div>
            <div className="w-32"></div> {/* Spacer for centering */}
          </div>
        </header>

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
          {/* Drawing Canvas Section */}
          <div className="flex flex-col items-center">
            <h2 className="text-2xl font-bold mb-4 text-gray-700 flex items-center gap-2">
              <Palette size={24} className="text-purple-600" />
              1. Draw Here
            </h2>
            <div className="w-full aspect-square bg-white rounded-2xl shadow-inner border-2 border-gray-200 overflow-hidden">
              <canvas
                ref={canvasRef}
                className="w-full h-full rounded-2xl cursor-default"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            </div>
          </div>

          {/* AI Generated Image Section */}
          <div className="flex flex-col items-center">
            <h2 className="text-2xl font-bold mb-4 text-gray-700 flex items-center gap-2">
              <Wand2 size={24} className="text-pink-600" />
              2. See The Magic
            </h2>
            <div className="relative w-full aspect-square bg-gray-100 rounded-2xl shadow-inner border-2 border-gray-200 flex items-center justify-center overflow-hidden">
              {isGenerating && (
                <div className="absolute z-10 flex flex-col items-center">
                  <Loader size={48} className="animate-spin text-pink-500 mb-4" />
                  <p className="text-gray-600 font-semibold">Creating magic...</p>
                </div>
              )}
              
              {generatedImage ? (
                <img
                  src={generatedImage}
                  alt="AI enhanced drawing"
                  className="w-full h-full object-contain animate__animated animate__fadeIn"
                />
              ) : (
                <div className="text-center text-gray-500 p-8">
                  <Sparkles size={48} className="mx-auto mb-4 text-gray-400" />
                  <p className="text-lg">Your magical drawing will appear here!</p>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Controls Section */}
        <div className="mt-6 flex flex-wrap justify-center items-center gap-4">
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

          <button
            onClick={enhanceDrawing}
            disabled={isGenerating}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-full text-xl shadow-md transform hover:scale-105 transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isGenerating ? (
              <span className="flex items-center gap-2">
                <Loader size={20} className="animate-spin" />
                Creating...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Wand2 size={20} />
                Create Magic
              </span>
            )}
          </button>

          <button
            onClick={clearCanvas}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-8 rounded-full text-xl shadow-md transform hover:scale-105 transition-all duration-200 ease-in-out"
          >
            <span className="flex items-center gap-2">
              <RotateCcw size={20} />
              Clear
            </span>
          </button>
        </div>

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