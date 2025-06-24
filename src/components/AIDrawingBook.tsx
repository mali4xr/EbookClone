
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Palette, Sparkles, RotateCcw, BookOpen, Wand2, Camera, Loader } from 'lucide-react';
import { GeminiService as GeminiServiceAPI } from '../services/GeminiService';
// Assuming GeminiService handles API key retrieval.
// For this standalone example, I will define a placeholder for GeminiService.
// In a real project, ensure you have this service properly set up.
const GeminiService = async (payload: any) => {
  const apiKey = await GeminiServiceAPI.getApiKey();
  if (!apiKey) {
    throw new Error('Gemini API key is not configured. Please check your environment variables.');
  }
};

const GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const POLLINATIONS_API_ENDPOINT = 'https://image.pollinations.ai/prompt/';

interface AIDrawingBookProps {
  onBack: () => void;
}

const AIDrawingBook: React.FC<AIDrawingBookProps> = ({ onBack }) => {
  // --- Canvas and Drawing State (Sketch Canvas) ---
  const sketchCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });

  // --- Coloring Canvas State ---
  const coloringCanvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedColor, setSelectedColor] = useState<string>('#FF0000'); // Default to Red
  const [hasGeneratedContent, setHasGeneratedContent] = useState(false); // Track if we have generated content
  const colors = [
    '#FF0000', '#0000FF', '#00FF00', '#FFFF00', '#FF7F00', '#BF00BF', '#00FFFF', '#FFC0CB', '#8B4513', '#808080', '#FFFFFF'
  ]; // Red, Blue, Green, Yellow, Orange, Purple, Cyan, Pink, Brown, Gray, White

  // --- UI and AI Interaction State ---
  const [currentPrompt, setCurrentPrompt] = useState<string>('');
  const [story, setStory] = useState<string>('');
  const [recognizedImage, setRecognizedImage] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false); // For generating drawing
  const [isGettingIdea, setIsGettingIdea] = useState(false);
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [showStorySection, setShowStorySection] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Canvas Utility Functions ---

  // Sets up canvas dimensions and drawing styles for the sketch canvas
  useEffect(() => {
    const canvas = sketchCanvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;

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

  // Sets up canvas dimensions for the coloring canvas
  useEffect(() => {
    const canvas = coloringCanvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  // Gets mouse or touch position relative to a canvas element
  const getCanvasPos = (canvas: HTMLCanvasElement, e: MouseEvent | TouchEvent): { x: number; y: number } => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    return {
      x: Math.floor((clientX - rect.left) * scaleX),
      y: Math.floor((clientY - rect.top) * scaleY)
    };
  };

  // Checks if the sketch canvas is empty (all pixels are transparent black)
  const isSketchCanvasEmpty = useCallback((): boolean => {
    const canvas = sketchCanvasRef.current;
    if (!canvas) return true;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return true;

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    // Check if all pixel data is 0 (transparent black, i.e., empty)
    return imageData.data.every(pixel => pixel === 0);
  }, []);

  // Converts the sketch canvas content to a Base64 PNG image
  const getSketchCanvasAsBase64 = useCallback((): string => {
    const canvas = sketchCanvasRef.current;
    if (!canvas) return '';

    // Create a temporary canvas to ensure white background for the image data
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');

    if (tempCtx) {
      tempCtx.fillStyle = '#FFFFFF'; // Fill with white background
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      tempCtx.drawImage(canvas, 0, 0); // Draw existing sketch
    }

    return tempCanvas.toDataURL('image/png').split(',')[1]; // Get base64 data part
  }, []);


  // --- Drawing Handlers (Sketch Canvas) ---

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = sketchCanvasRef.current;
    if (!canvas) return;

    setIsDrawing(true);
    const pos = getCanvasPos(canvas, e.nativeEvent);
    setLastPos(pos);
    canvas.style.cursor = 'crosshair'; // Change cursor for drawing
  };

  const drawSketch = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !sketchCanvasRef.current) return;

    e.preventDefault(); // Prevent scrolling on touch devices
    const canvas = sketchCanvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

    const currentPos = getCanvasPos(canvas, e.nativeEvent);

    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(currentPos.x, currentPos.y);
    ctx.stroke();

    setLastPos(currentPos);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (sketchCanvasRef.current) {
      sketchCanvasRef.current.style.cursor = 'default'; // Restore default cursor
    }
  };

  // --- Coloring Functions (Coloring Canvas) ---

  // Converts a hex color string to an RGBA array [R, G, B, A]
  const hexToRgbA = (hex: string): [number, number, number, number] => {
    let c;
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
      c = hex.substring(1).split('');
      if (c.length === 3) {
        c = [c[0], c[0], c[1], c[1], c[2], c[2]];
      }
      c = '0x' + c.join('');
      return [Number(c >> 16) & 255, Number(c >> 8) & 255, Number(c) & 255, 255]; // Alpha channel is always 255 (fully opaque)
    }
    throw new Error('Invalid Hex color format');
  };

  // Gets the RGBA color of a pixel at (x, y) from an ImageData array
  const getPixelColor = (pixels: Uint8ClampedArray, x: number, y: number, width: number): [number, number, number, number] => {
    const index = (y * width + x) * 4;
    return [pixels[index], pixels[index + 1], pixels[index + 2], pixels[index + 3]];
  };

  // Sets the RGBA color of a pixel at (x, y) in an ImageData array
  const setPixelColor = (pixels: Uint8ClampedArray, x: number, y: number, width: number, color: [number, number, number, number]) => {
    const index = (y * width + x) * 4;
    pixels[index] = color[0];
    pixels[index + 1] = color[1];
    pixels[index + 2] = color[2];
    pixels[index + 3] = color[3]; // Alpha
  };

  // Compares two RGBA colors with a given tolerance
  const colorsMatch = (color1: [number, number, number, number], color2: [number, number, number, number], tolerance = 10): boolean => {
    return Math.abs(color1[0] - color2[0]) <= tolerance &&
           Math.abs(color1[1] - color2[1]) <= tolerance &&
           Math.abs(color1[2] - color2[2]) <= tolerance &&
           Math.abs(color1[3] - color2[3]) <= tolerance;
  };

  // Flood fill algorithm for coloring
  const floodFill = useCallback((startX: number, startY: number, fillColor: string) => {
    const canvas = coloringCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    const targetColor = getPixelColor(pixels, startX, startY, width);
    const replacementColor = hexToRgbA(fillColor);

    // If target color is already the replacement color, do nothing
    if (colorsMatch(targetColor, replacementColor)) {
      return;
    }

    const stack: [number, number][] = [[startX, startY]];
    let pixelCount = 0; // Guard against infinite loops

    while (stack.length > 0 && pixelCount < width * height * 4) { // Limit iterations to avoid performance issues
      const [x, y] = stack.pop()!; // '!' asserts that pop() won't be undefined

      // Check boundaries
      if (x < 0 || x >= width || y < 0 || y >= height) {
        continue;
      }

      const currentColor = getPixelColor(pixels, x, y, width);

      // If the current pixel matches the target color, fill it and add neighbors to stack
      if (colorsMatch(currentColor, targetColor)) {
        setPixelColor(pixels, x, y, width, replacementColor);
        pixelCount++;

        // Add neighbors to the stack
        stack.push([x + 1, y]);
        stack.push([x - 1, y]);
        stack.push([x, y + 1]);
        stack.push([x, y - 1]);
      }
    }
    ctx.putImageData(imageData, 0, 0); // Apply changes to canvas
  }, []); // Dependencies: none, as it uses internal canvas ref and utility functions

  // Event handler for coloring canvas click/touch
  const handleColoringClick = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = coloringCanvasRef.current;
    if (!canvas || !hasGeneratedContent) {
      setError("Please generate a drawing first to color!");
      return;
    }
    setError(null); // Clear previous error
    const { x, y } = getCanvasPos(canvas, e.nativeEvent);
    floodFill(x, y, selectedColor);
  };

  // Handle color palette selection - prevent event bubbling
  const handleColorSelect = (color: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event from bubbling up
    setSelectedColor(color);
  };

  // --- Main Action Handlers ---

  const handleClearAll = useCallback(() => {
    const sketchCanvas = sketchCanvasRef.current;
    const coloringCanvas = coloringCanvasRef.current;
    if (sketchCanvas) {
      sketchCanvas.getContext('2d')?.clearRect(0, 0, sketchCanvas.width, sketchCanvas.height);
    }
    if (coloringCanvas) {
      coloringCanvas.getContext('2d')?.clearRect(0, 0, coloringCanvas.width, coloringCanvas.height);
    }
    setHasGeneratedContent(false); // Reset content flag
    setCurrentPrompt('');
    setStory('');
    setRecognizedImage('');
    setShowStorySection(false);
    setError(null);
  }, []); // Dependencies: none, as it only clears canvases and resets state

  // Generic AI API caller
  const callAI = async (payload: any, model: 'gemini' | 'pollinations') => {
    const apiKey = await GeminiServiceAPI.getApiKey();
    if (!apiKey) {
      throw new Error('API key is not configured.');
    }

    let endpoint = '';
    let method = 'POST';
    let headers: HeadersInit = { 'Content-Type': 'application/json' };
    let body: BodyInit | null = JSON.stringify(payload);

    if (model === 'gemini') {
      endpoint = `${GEMINI_API_ENDPOINT}?key=${apiKey}`;
    } else if (model === 'pollinations') {
      // Pollinations.ai uses a GET request for simple prompts
      // The payload will just be the prompt string
      endpoint = `${POLLINATIONS_API_ENDPOINT}${encodeURIComponent(payload)}`;
      method = 'GET';
      headers = {}; // No content-type for GET image request
      body = null;
    } else {
      throw new Error('Unsupported AI model.');
    }

    const response = await fetch(endpoint, { method, headers, body });

    if (!response.ok) {
      let errorMsg = `API Error (${response.status}): ${response.statusText}`;
      try {
        if (model === 'gemini') {
          const errorData = await response.json();
          errorMsg = `API Error: ${errorData.error?.message || JSON.stringify(errorData)}`;
        } else {
          errorMsg = `Image Generation Error: ${await response.text()}`;
        }
      } catch (jsonError) {
        console.error("Could not parse error response as JSON", jsonError);
      }
      throw new Error(errorMsg);
    }

    if (model === 'pollinations') {
      // For Pollinations, we expect an image response directly, not JSON
      return response.blob(); // Return as Blob
    }
    return response.json();
  };

  const getDrawingIdea = async () => {
    setIsGettingIdea(true);
    setError(null);

    try {
      const prompt = "Give me a simple, fun, and creative drawing idea for a child. Be concise, one sentence only. For example: 'A friendly robot drinking a milkshake' or 'A snail with a birthday cake for a shell'.";
      const payload = { contents: [{ role: 'user', parts: [{ text: prompt }] }] };

      const result = await callAI(payload, 'gemini');
      const idea = result.candidates[0].content.parts[0].text;
      setCurrentPrompt(idea.trim());
    } catch (err: any) {
      console.error('Error getting idea:', err);
      setError(err.message || 'Could not get an idea right now. Please try again!');
    } finally {
      setIsGettingIdea(false);
    }
  };

  const enhanceDrawing = async () => {
    if (isSketchCanvasEmpty()) {
      setError('Please draw something on the canvas first!');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setShowStorySection(false); // Hide story section when regenerating

    try {
      // Step 1: Get description of the sketch using Gemini (visual input)
      const base64ImageData = getSketchCanvasAsBase64();
      const descriptionPrompt = "Describe this simple sketch in a few keywords for an AI image generator. Focus on the main subject. For example, 'a smiling sun', 'a house with a tree', 'a cat chasing a ball'.";
      const descriptionPayload = {
        contents: [{
          parts: [
            { text: descriptionPrompt },
            { inlineData: { mimeType: "image/png", data: base64ImageData } }
          ]
        }]
      };

      const descriptionResult = await callAI(descriptionPayload, 'gemini');
      const sketchDescription = descriptionResult.candidates[0].content.parts[0].text.trim();
      setRecognizedImage(sketchDescription);

      // Step 2: Generate coloring book style image using Pollinations.ai
      // Requesting a black and white outline drawing explicitly
      const imageGenerationPrompt = `A black connected line drawing of: ${sketchDescription}.for children's coloring book with thickblines and no internal colors, on a plain white background.`;

      // Call Pollinations.ai (returns a Blob directly)
      const imageBlob = await callAI(imageGenerationPrompt, 'pollinations');
      const imageUrl = URL.createObjectURL(imageBlob);

      // Load the generated image onto the coloring canvas
      const img = new Image();
      img.onload = () => {
        const coloringCanvas = coloringCanvasRef.current;
        if (!coloringCanvas) return;
        const ctx = coloringCanvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, coloringCanvas.width, coloringCanvas.height); // Clear existing content
          ctx.drawImage(img, 0, 0, coloringCanvas.width, coloringCanvas.height); // Draw new image
          setHasGeneratedContent(true); // Mark that we have content
        }
        URL.revokeObjectURL(imageUrl); // Clean up the object URL
        setShowStorySection(true); // Show story section after image is generated
      };
      img.onerror = () => {
        setError('Failed to load generated image for coloring.');
        URL.revokeObjectURL(imageUrl); // Clean up on error too
      };
      img.src = imageUrl;

    } catch (err: any) {
      console.error('Error generating image:', err);
      setError(err.message || 'Oops! Something went wrong while creating the drawing.');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateStory = async () => {
    if (isSketchCanvasEmpty()) {
      setError('Please draw something first!');
      return;
    }

    setIsGeneratingStory(true);
    setError(null);

    try {
      // Use the original sketch for story generation as it's the user's direct input
      const base64ImageData = getSketchCanvasAsBase64();

      const prompt = "Look at this child's sketch. Write a very short (2-3 sentences), happy, and simple story for a young child (3-5 years old) about what is happening in the drawing. Speak as if you are telling the story to the child who drew it.";

      const payload = {
        contents: [{
          parts: [
            { text: prompt },
            { inlineData: { mimeType: "image/png", data: base64ImageData } }
          ]
        }]
      };

      const result = await callAI(payload, 'gemini');
      const storyText = result.candidates[0].content.parts[0].text;
      setStory(storyText.trim());
    } catch (err: any) {
      console.error('Error generating story:', err);
      setError(err.message || 'The storyteller seems to be napping! Please try again.');
      setStory(''); // Clear story on error
    } finally {
      setIsGeneratingStory(false);
    }
  };

  // --- API Key Check UI ---
  if (!GeminiServiceAPI.getApiKey()) {
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

  // --- Main Application UI ---
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

        {/* Recognized Image Label */}
        {recognizedImage && (
          <div className="text-center mb-6 animate__animated animate__fadeIn">
            <div className="bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-white rounded-lg p-4 text-lg font-bold shadow-lg max-w-2xl mx-auto transform hover:scale-105 transition-transform duration-200">
              <div className="flex items-center justify-center gap-2">
                <Wand2 size={24} className="text-yellow-200" />
                <span>Magic Eye sees: {recognizedImage}</span>
              </div>
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
                ref={sketchCanvasRef}
                className="w-full h-full rounded-2xl cursor-default"
                onMouseDown={startDrawing}
                onMouseMove={drawSketch}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={drawSketch}
                onTouchEnd={stopDrawing}
              />
            </div>

            {/* Recognized Image Label */}
        {recognizedImage && (
          <div className="text-center mb-2 animate__animated animate__fadeIn">
            <div className="bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-white rounded-lg p-4 text-lg font-bold shadow-lg max-w-2xl mx-auto transform hover:scale-105 transition-transform duration-200">
              <div className="flex items-center justify-center gap-2">
                <Wand2 size={24} className="text-yellow-200" />
                <span>Magic Eye sees: {recognizedImage}</span>
              </div>
            </div>
          </div>
        )}
            
          </div>

          {/* AI Generated Image & Coloring Section */}
          <div className="flex flex-col items-center">
            <h2 className="text-2xl font-bold mb-4 text-gray-700 flex items-center gap-2">
              <Wand2 size={24} className="text-pink-600" />
              2. See & Color The Magic
            </h2>
            <div className="relative w-full aspect-square bg-gray-100 rounded-2xl shadow-inner border-2 border-gray-200 flex items-center justify-center overflow-hidden">
              {isGenerating && (
                <div className="absolute z-10 flex flex-col items-center">
                  <Loader size={48} className="animate-spin text-pink-500 mb-4" />
                  <p className="text-gray-600 font-semibold">Creating magic...</p>
                </div>
              )}

              {/* Coloring Canvas */}
              <canvas
                ref={coloringCanvasRef}
                className={`w-full h-full rounded-2xl ${hasGeneratedContent ? 'block cursor-crosshair' : 'hidden'}`}
                onClick={handleColoringClick}
                onTouchStart={handleColoringClick}
              ></canvas>

              {/* Placeholder text when no image is generated and not loading */}
              {!isGenerating && !hasGeneratedContent && (
                <div className="text-center text-gray-500 p-8">
                  <Sparkles size={48} className="mx-auto mb-4 text-gray-400" />
                  <p className="text-lg">Your magical drawing will appear here!</p>
                </div>
              )}
            </div>

            {/* Color Palette Section */}
            {hasGeneratedContent && ( // Only show palette if content exists
              <div className="mt-4 flex flex-wrap justify-center gap-2 p-2 bg-white rounded-xl shadow-md border border-gray-200">
                {colors.map((color, index) => (
                  <div
                    key={index}
                    className={`w-8 h-8 rounded-full border-2 cursor-pointer shadow-md transform hover:scale-110 transition-transform duration-150
                      ${selectedColor === color ? 'border-sky-500 border-4' : 'border-gray-300'}`}
                    style={{ backgroundColor: color }}
                    onClick={(e) => handleColorSelect(color, e)}
                  ></div>
                ))}
              </div>
            )}
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
            onClick={handleClearAll}
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
