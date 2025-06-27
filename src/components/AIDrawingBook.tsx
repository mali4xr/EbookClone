import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  createContext,
  useContext,
} from "react";
import {
  Palette,
  Sparkles,
  RotateCcw,
  BookOpen,
  Wand2,
  Camera,
  Loader,
} from "lucide-react";

// --- Constants ---
const POLLINATIONS_API_ENDPOINT = "https://image.pollinations.ai/prompt/";

const geminiSafetySettings = [
  { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_LOW_AND_ABOVE" },
  { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_LOW_AND_ABOVE" },
  {
    category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
    threshold: "BLOCK_LOW_AND_ABOVE",
  },
  {
    category: "HARM_CATEGORY_DANGEROUS_CONTENT",
    threshold: "BLOCK_LOW_AND_ABOVE",
  },
];

// --- AI Service ---
// Centralized place for all AI API calls
const AIService = {
  call: async (payload, model) => {
    let endpoint = "";
    let options = {};

    if (model === "gemini") {
        const fullPayload = {
            ...payload,
            safetySettings: geminiSafetySettings,
        };
        // Use the environment's Gemini API
        if (window.ai) {
             const result = await window.ai.gemini.generateContent(fullPayload);
             return result;
        } else {
            throw new Error("Gemini API not available in this environment.");
        }
    } else if (model === "pollinations") {
      endpoint = `${POLLINATIONS_API_ENDPOINT}${encodeURIComponent(
        payload
      )}?width=600&height=800&seed=42&nologo=True`;
      options = { method: "GET" };
       const response = await fetch(endpoint, options);
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API Error (${model}): ${errorText}`);
        }
        return response.blob();
    } else {
      throw new Error("Unsupported AI model.");
    }
  },

  generateStoryImage: async (storyText) => {
    const prompt = `colorful child scene+no+nudity+${storyText}`;
    const blob = await AIService.call(prompt, "pollinations");
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  },

  readStoryAloud: async (story) => {
      const encodedStory = encodeURIComponent(story);
      const voice = "alloy";
      const url = `https://text.pollinations.ai/'tell a 4 year old kid story about '${encodedStory}?model=openai-audio&voice=${voice}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to generate audio.");
      const blob = await response.blob();
      return URL.createObjectURL(blob);
  }
};

// --- State Management (React Context) ---
const DrawingBookContext = createContext(null);

const DrawingBookProvider = ({ children }) => {
  const sketchCanvasRef = useRef(null);
  const coloringCanvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [selectedColor, setSelectedColor] = useState("#FF0000");
  const [hasGeneratedContent, setHasGeneratedContent] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState("");
  const [story, setStory] = useState("");
  const [recognizedImage, setRecognizedImage] = useState("");
  const [loadingStates, setLoadingStates] = useState({
    generating: false,
    idea: false,
    story: false,
    reading: false
  });
  const [error, setError] = useState(null);
  const [showStorySection, setShowStorySection] = useState(false);
  const [storyImageBase64, setStoryImageBase64] = useState(null);
  const [history, setHistory] = useState([]);
  const [selectedHistoryIndex, setSelectedHistoryIndex] = useState(null);
  const [showWebcam, setShowWebcam] = useState(false);

  const getSketchCanvasAsBase64 = useCallback(() => {
    const canvas = sketchCanvasRef.current;
    if (!canvas) return "";
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext("2d");
    if (tempCtx) {
      tempCtx.fillStyle = "#FFFFFF";
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      tempCtx.drawImage(canvas, 0, 0);
    }
    return tempCanvas.toDataURL("image/png").split(",")[1];
  }, []);

  const isSketchCanvasEmpty = useCallback(() => {
    const canvas = sketchCanvasRef.current;
    if (!canvas) return true;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return true;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return imageData.data.every((pixel) => pixel === 0);
  }, []);

  const handleClearAll = useCallback(() => {
    const sketchCanvas = sketchCanvasRef.current;
    if (sketchCanvas) {
      sketchCanvas.getContext("2d")?.clearRect(0, 0, sketchCanvas.width, sketchCanvas.height);
    }
    const coloringCanvas = coloringCanvasRef.current;
    if (coloringCanvas) {
      coloringCanvas.getContext("2d")?.clearRect(0, 0, coloringCanvas.width, coloringCanvas.height);
    }
    setHasGeneratedContent(false);
    setCurrentPrompt("");
    setStory("");
    setRecognizedImage("");
    setShowStorySection(false);
    setError(null);
    setSelectedHistoryIndex(null);
  }, []);

  const getDrawingIdea = async () => {
    setLoadingStates(s => ({ ...s, idea: true }));
    setError(null);
    try {
      const prompt = "fun, creative drawing idea for a child. one sentence only. like: 'A friendly robot drinking a milkshake'.";
      const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
      const result = await AIService.call(payload, "gemini");
      const idea = result.candidates[0].content.parts[0].text;
      setCurrentPrompt(idea.trim());
    } catch (err) {
      setError(err.message || "Could not get an idea.");
    } finally {
      setLoadingStates(s => ({ ...s, idea: false }));
    }
  };

  const enhanceDrawing = async () => {
    if (isSketchCanvasEmpty()) {
      setError("Please draw something first!");
      return;
    }
    setLoadingStates(s => ({ ...s, generating: true }));
    setError(null);
    setShowStorySection(false);

    try {
        const base64ImageData = getSketchCanvasAsBase64();

        const descriptionPrompt = "Keywords only:subject. No colors. No introductions, child safe. E.g. smiling sun, house with tree, cat chasing ball";
        const descriptionPayload = {
            contents: [{ parts: [{ text: descriptionPrompt }, { inlineData: { mimeType: "image/png", data: base64ImageData } }] }],
        };
        const descriptionResult = await AIService.call(descriptionPayload, "gemini");
        const sketchDescription = descriptionResult.candidates[0].content.parts[0].text.trim();
        setRecognizedImage(sketchDescription);

        const imageGenerationPrompt = `A black connected line drawing of: ${sketchDescription} for children's coloring book with no internal colors, on a plain white background.`;
        const imageBlob = await AIService.call(imageGenerationPrompt, "pollinations");
        
        const generatedBase64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(",")[1]);
            reader.onerror = reject;
            reader.readAsDataURL(imageBlob);
        });

        const img = new window.Image();
        img.onload = () => {
            setHasGeneratedContent(true);
            setTimeout(() => {
                const canvas = coloringCanvasRef.current;
                if (!canvas) return;
                const rect = canvas.getBoundingClientRect();
                canvas.width = rect.width;
                canvas.height = rect.height;
                const ctx = canvas.getContext("2d");
                if (ctx) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                }
            }, 0);
        };
        img.src = `data:image/png;base64,${generatedBase64}`;

        setHistory(prev => {
            const newHistory = [...prev, { sketch: base64ImageData, generated: generatedBase64, recognizedImage: sketchDescription, prompt: currentPrompt, story: "" }];
            return newHistory.length > 10 ? newHistory.slice(newHistory.length - 10) : newHistory;
        });
        setSelectedHistoryIndex(history.length >= 10 ? 9 : history.length);
        setShowStorySection(true);

    } catch (err) {
        setError(err.message || "Failed to enhance drawing.");
    } finally {
        setLoadingStates(s => ({ ...s, generating: false }));
    }
  };

  const generateStory = async () => {
    if (selectedHistoryIndex !== null && history[selectedHistoryIndex]?.story) {
        setStory(history[selectedHistoryIndex].story);
        setStoryImageBase64(history[selectedHistoryIndex].storyImageBase64 || null);
        return;
    }
    if (!recognizedImage) {
        setError("Please enhance a drawing first!");
        return;
    }
    setLoadingStates(s => ({ ...s, story: true }));
    setError(null);
    try {
        const prompt = `Write a very short (2-3 sentences), happy, and simple story for a young child (3-5 years old) about this: "${recognizedImage}"`;
        const payload = { contents: [{ parts: [{ text: prompt }] }] };
        const result = await AIService.call(payload, "gemini");
        const storyText = result.candidates[0].content.parts[0].text.trim();
        setStory(storyText);

        const imageBase64 = await AIService.generateStoryImage(storyText);
        setStoryImageBase64(imageBase64);
        
        if (selectedHistoryIndex !== null) {
            setHistory(prev => prev.map((item, idx) =>
                idx === selectedHistoryIndex ? { ...item, story: storyText, storyImageBase64: imageBase64 } : item
            ));
        }
    } catch (err) {
        setError(err.message || "The storyteller is napping!");
    } finally {
        setLoadingStates(s => ({ ...s, story: false }));
    }
  };
  
    const value = {
        sketchCanvasRef,
        coloringCanvasRef,
        isDrawing, setIsDrawing,
        lastPos, setLastPos,
        selectedColor, setSelectedColor,
        hasGeneratedContent, setHasGeneratedContent,
        currentPrompt, setCurrentPrompt,
        story, setStory,
        recognizedImage, setRecognizedImage,
        loadingStates, setLoadingStates,
        error, setError,
        showStorySection, setShowStorySection,
        storyImageBase64, setStoryImageBase64,
        history, setHistory,
        selectedHistoryIndex, setSelectedHistoryIndex,
        showWebcam, setShowWebcam,
        handleClearAll,
        getDrawingIdea,
        enhanceDrawing,
        generateStory,
        getSketchCanvasAsBase64,
    };

  return <DrawingBookContext.Provider value={value}>{children}</DrawingBookContext.Provider>;
};

const useDrawingBook = () => {
  const context = useContext(DrawingBookContext);
  if (!context) {
    throw new Error("useDrawingBook must be used within a DrawingBookProvider");
  }
  return context;
};

// --- Components ---

const Header = ({ onBack }) => (
  <header className="text-center mb-6">
    <div className="flex items-center justify-between mb-4">
      <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105">
        <BookOpen size={20} className="text-purple-600" />
        <span className="text-purple-600 font-semibold">Back to Library</span>
      </button>
      <div className="text-center flex-1">
        <h1 className="text-4xl md:text-5xl font-bold text-sky-600">Sketch-A-Magic AI</h1>
        <p className="text-lg text-orange-500 mt-2">Draw, get ideas, and create stories with AI!</p>
      </div>
      <div className="w-32"></div>
    </div>
  </header>
);

const PromptDisplay = () => {
    const { currentPrompt } = useDrawingBook();
    if (!currentPrompt) return null;
    return (
        <div className="text-center mb-6">
            <div className="bg-sky-100 border-2 border-sky-300 text-sky-800 rounded-lg p-4 text-lg shadow-md max-w-2xl mx-auto">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <Sparkles size={20} className="text-sky-600" />
                    <span className="font-semibold">Drawing Idea:</span>
                </div>
                {currentPrompt}
            </div>
        </div>
    );
};

const ErrorDisplay = () => {
    const { error } = useDrawingBook();
    if (!error) return null;
    return (
        <div className="text-center mb-6">
            <div className="bg-red-100 border-2 border-red-300 text-red-800 rounded-lg p-4 text-lg shadow-md max-w-2xl mx-auto">
                {error}
            </div>
        </div>
    );
};

const HistoryThumbnails = () => {
    const { history, setHistory, selectedHistoryIndex, setSelectedHistoryIndex, handleClearAll, setRecognizedImage, setCurrentPrompt, setStory, setHasGeneratedContent, sketchCanvasRef, coloringCanvasRef } = useDrawingBook();

    if (history.length === 0) return null;
    
    const handleSelectHistory = (idx) => {
        const item = history[idx];
        setSelectedHistoryIndex(idx);
        setRecognizedImage(item.recognizedImage);
        setCurrentPrompt(item.prompt);
        setStory(item.story || "");
        setHasGeneratedContent(true);

        const sketchImg = new window.Image();
        sketchImg.onload = () => {
            const canvas = sketchCanvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext("2d");
                if (ctx) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(sketchImg, 0, 0, canvas.width, canvas.height);
                }
            }
        };
        sketchImg.src = `data:image/png;base64,${item.sketch}`;

        const genImg = new window.Image();
        genImg.onload = () => {
            const canvas = coloringCanvasRef.current;
            if (canvas) {
                const rect = canvas.getBoundingClientRect();
                canvas.width = rect.width;
                canvas.height = rect.height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(genImg, 0, 0, canvas.width, canvas.height);
                }
            }
        };
        genImg.src = `data:image/png;base64,${item.generated}`;
    };

    return (
        <div className="mb-6">
            <h3 className="font-semibold text-gray-700 mb-2">Your Drawings:</h3>
            <div className="flex overflow-x-auto gap-4 p-2 bg-white rounded-xl shadow-inner">
                {history.map((item, idx) => (
                    <div key={idx} className="flex-shrink-0 text-center">
                        <div
                            onClick={() => handleSelectHistory(idx)}
                            className={`w-16 h-16 rounded-full border-4 cursor-pointer transition-transform duration-150 ${selectedHistoryIndex === idx ? 'border-sky-500 scale-110' : 'border-gray-200 hover:border-purple-400'}`}
                            title={item.recognizedImage || "Drawing"}
                        >
                            <img src={`data:image/png;base64,${item.sketch}`} alt="sketch" className="w-full h-full object-contain rounded-full bg-gray-50"/>
                        </div>
                        <div className="mt-1 text-sm font-semibold text-gray-600">{idx + 1}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const SketchCanvas = () => {
    const { sketchCanvasRef, isDrawing, setIsDrawing, lastPos, setLastPos, setShowWebcam } = useDrawingBook();

    useEffect(() => {
        const canvas = sketchCanvasRef.current;
        const resizeCanvas = () => {
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;
            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.lineCap = "round";
                ctx.lineJoin = "round";
                ctx.strokeStyle = "#000000";
                ctx.lineWidth = 4;
            }
        };
        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);
        return () => window.removeEventListener("resize", resizeCanvas);
    }, [sketchCanvasRef]);

    const getCanvasPos = (e) => {
        const canvas = sketchCanvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: Math.floor((clientX - rect.left) * scaleX),
            y: Math.floor((clientY - rect.top) * scaleY),
        };
    };

    const startDrawing = (e) => {
        setIsDrawing(true);
        setLastPos(getCanvasPos(e.nativeEvent));
    };

    const draw = (e) => {
        if (!isDrawing) return;
        e.preventDefault();
        const ctx = sketchCanvasRef.current.getContext("2d");
        const currentPos = getCanvasPos(e.nativeEvent);
        ctx.beginPath();
        ctx.moveTo(lastPos.x, lastPos.y);
        ctx.lineTo(currentPos.x, currentPos.y);
        ctx.stroke();
        setLastPos(currentPos);
    };

    const stopDrawing = () => setIsDrawing(false);

    return (
        <div className="flex flex-col items-center">
            <h2 className="text-2xl font-bold mb-2 text-gray-700 flex items-center gap-2">
                <Palette size={24} className="text-purple-600" />
                1. Draw Here
                <button onClick={() => setShowWebcam(true)} className="text-sm bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-3 rounded-full shadow-md">
                    <Camera size={16} />
                </button>
            </h2>
            <div className="w-full aspect-square bg-white rounded-2xl shadow-inner border-2 border-gray-200 overflow-hidden">
                <canvas
                    ref={sketchCanvasRef}
                    className="w-full h-full cursor-crosshair"
                    onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}
                />
            </div>
        </div>
    );
};

const ColoringCanvas = () => {
    const { coloringCanvasRef, hasGeneratedContent, loadingStates, selectedColor, storyImageBase64 } = useDrawingBook();
    const [showStoryImage, setShowStoryImage] = useState(false);
    
    const hexToRgbA = (hex) => {
        let c = hex.substring(1).split('');
        if (c.length === 3) { c = [c[0], c[0], c[1], c[1], c[2], c[2]]; }
        c = '0x' + c.join('');
        return [(c >> 16) & 255, (c >> 8) & 255, c & 255, 255];
    };

    const floodFill = useCallback((startX, startY, fillColor) => {
        const canvas = coloringCanvasRef.current;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const { data, width, height } = imageData;
        
        const getPixel = (x, y) => {
            const index = (y * width + x) * 4;
            return [data[index], data[index + 1], data[index + 2], data[index + 3]];
        };
        
        const setPixel = (x, y, color) => {
            const index = (y * width + x) * 4;
            data[index] = color[0];
            data[index+1] = color[1];
            data[index+2] = color[2];
            data[index+3] = color[3];
        };

        const targetColor = getPixel(startX, startY);
        const replacementColor = hexToRgbA(fillColor);

        if (JSON.stringify(targetColor) === JSON.stringify(replacementColor)) return;

        const stack = [[startX, startY]];
        while(stack.length > 0) {
            const [x, y] = stack.pop();
            if (x < 0 || x >= width || y < 0 || y >= height) continue;
            
            const currentColor = getPixel(x, y);
            if(JSON.stringify(currentColor) === JSON.stringify(targetColor)) {
                setPixel(x, y, replacementColor);
                stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
            }
        }
        ctx.putImageData(imageData, 0, 0);
    }, [coloringCanvasRef]);

    const handleColoringClick = (e) => {
        const canvas = coloringCanvasRef.current;
        if (!canvas || !hasGeneratedContent) return;
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const x = Math.floor((clientX - rect.left) * (canvas.width / rect.width));
        const y = Math.floor((clientY - rect.top) * (canvas.height / rect.height));
        floodFill(x, y, selectedColor);
    };
    
    return (
        <div className="flex flex-col items-center">
            <h2 className="text-2xl font-bold mb-4 text-gray-700 flex items-center gap-2">
                <Wand2 size={24} className="text-pink-600" />
                2. See & Color the Magic
            </h2>
            <div className="relative w-full aspect-square bg-gray-100 rounded-2xl shadow-inner border-2 border-gray-200 flex items-center justify-center overflow-hidden">
                {storyImageBase64 && (
                    <div className={`absolute inset-0 w-full h-full transition-opacity duration-300 z-20 ${showStoryImage ? 'opacity-100' : 'opacity-0'}`}>
                        <img src={`data:image/png;base64,${storyImageBase64}`} alt="Story" className="w-full h-full object-contain" />
                    </div>
                )}
                <canvas
                    ref={coloringCanvasRef}
                    className={`w-full h-full rounded-2xl ${hasGeneratedContent ? "block cursor-crosshair" : "hidden"} transition-opacity duration-700 z-10`}
                    onClick={handleColoringClick} onTouchStart={handleColoringClick}
                ></canvas>
                {!loadingStates.generating && !hasGeneratedContent && (
                    <div className="text-center text-gray-500 p-8">
                        <Sparkles size={48} className="mx-auto mb-4 text-gray-400" />
                        <p className="text-lg">Your magical drawing will appear here!</p>
                    </div>
                )}
            </div>
            <ColorPalette />
        </div>
    );
};

const ColorPalette = () => {
    const { hasGeneratedContent, selectedColor, setSelectedColor } = useDrawingBook();
    const colors = ["#FF0000", "#0000FF", "#00FF00", "#FFFF00", "#FF7F00", "#BF00BF", "#00FFFF", "#FFC0CB", "#8B4513", "#808080", "#FFFFFF"];
    
    if (!hasGeneratedContent) return null;

    return (
        <div className="mt-4 flex flex-wrap justify-center gap-2 p-2 bg-white rounded-xl shadow-md border">
            {colors.map((color) => (
                <div key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-8 h-8 rounded-full border-2 cursor-pointer shadow-sm transform hover:scale-110 transition-transform ${selectedColor === color ? 'border-sky-500 border-4' : 'border-gray-300'}`}
                    style={{ backgroundColor: color }}
                ></div>
            ))}
        </div>
    );
};

const ActionButtons = () => {
    const { loadingStates, handleClearAll, getDrawingIdea, enhanceDrawing, history } = useDrawingBook();
    return (
        <div className="mt-6 flex flex-wrap justify-center items-center gap-4">
            <button onClick={handleClearAll} className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-full text-lg shadow-md transform hover:scale-105 transition-all">
                <span className="flex items-center gap-2"><RotateCcw size={20}/>Clear</span>
            </button>
            <button onClick={getDrawingIdea} disabled={loadingStates.idea} className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-6 rounded-full text-lg shadow-md transform hover:scale-105 transition-all disabled:opacity-50">
                {loadingStates.idea ? <span className="flex items-center gap-2"><Loader size={20} className="animate-spin"/>Thinking...</span> : <span className="flex items-center gap-2"><Sparkles size={20}/>Idea</span>}
            </button>
            <button onClick={enhanceDrawing} disabled={loadingStates.generating || history.length >= 10} className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full text-lg shadow-md transform hover:scale-105 transition-all disabled:opacity-50">
                {loadingStates.generating ? <span className="flex items-center gap-2"><Loader size={20} className="animate-spin"/>Creating...</span> : <span className="flex items-center gap-2"><Wand2 size={20}/>Enhance</span>}
            </button>
        </div>
    );
};

const StorySection = () => {
    const { showStorySection, story, loadingStates, generateStory, setLoadingStates, setError } = useDrawingBook();
    const audioRef = useRef(null);

    const handleReadStory = async () => {
        if (!story) return;
        setLoadingStates(s => ({ ...s, reading: true }));
        try {
            const audioUrl = await AIService.readStoryAloud(story);
            if (audioRef.current) {
                audioRef.current.pause();
            }
            const audio = new Audio(audioUrl);
            audioRef.current = audio;
            audio.play();
            audio.onended = () => {
                setLoadingStates(s => ({ ...s, reading: false }));
                URL.revokeObjectURL(audioUrl);
            };
        } catch(err) {
            setError("Could not play the story audio.");
            setLoadingStates(s => ({ ...s, reading: false }));
        }
    };
    
    useEffect(() => {
        return () => {
            if(audioRef.current) {
                audioRef.current.pause();
            }
        }
    }, [])

    if (!showStorySection) return null;

    return (
        <section className="mt-8 w-full max-w-4xl mx-auto">
            <div className="text-center mb-4">
                <button onClick={generateStory} disabled={loadingStates.story} className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-full text-xl shadow-md transform hover:scale-105 transition-all disabled:opacity-50">
                    {loadingStates.story ? <span className="flex items-center gap-2"><Loader size={20} className="animate-spin"/>Writing...</span> : <span className="flex items-center gap-2"><BookOpen size={20}/>Tell me a Story</span>}
                </button>
            </div>
            {story && (
                <div className="bg-orange-100 border-2 border-orange-300 text-orange-900 rounded-lg p-6 text-lg shadow-inner">
                    <p className="leading-relaxed">{story}</p>
                    <button onClick={handleReadStory} disabled={loadingStates.reading} className="mt-4 px-6 py-2 bg-sky-500 text-white rounded-lg font-bold shadow hover:bg-sky-600 transition disabled:opacity-50">
                        {loadingStates.reading ? <span className="flex items-center gap-2"><Loader size={20} className="animate-spin"/>Reading...</span> : <span className="flex items-center gap-2"><BookOpen size={20}/>Read Aloud</span>}
                    </button>
                </div>
            )}
        </section>
    );
};

const WebcamModal = () => {
    const { showWebcam, setShowWebcam, enhanceDrawing, getSketchCanvasAsBase64, sketchCanvasRef } = useDrawingBook();
    const videoRef = useRef(null);
    const [stream, setStream] = useState(null);

    useEffect(() => {
        if (showWebcam) {
            navigator.mediaDevices.getUserMedia({ video: true })
                .then(stream => {
                    setStream(stream);
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                    }
                })
                .catch(() => console.error("Could not access webcam."));
        } else if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    }, [showWebcam]);

    const captureAndUse = () => {
        const video = videoRef.current;
        if (!video) return;
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/png");
        
        const sketchCanvas = sketchCanvasRef.current;
        const sketchCtx = sketchCanvas.getContext('2d');
        const img = new window.Image();
        img.onload = () => {
            sketchCtx.clearRect(0,0,sketchCanvas.width, sketchCanvas.height);
            sketchCtx.drawImage(img, 0,0, sketchCanvas.width, sketchCanvas.height);
            setShowWebcam(false);
            enhanceDrawing();
        }
        img.src = dataUrl;
    };

    if (!showWebcam) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 shadow-2xl flex flex-col items-center">
                <video ref={videoRef} autoPlay playsInline className="rounded-lg border mb-4 w-80" />
                <div className="flex gap-4">
                    <button onClick={captureAndUse} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-lg">Capture & Use</button>
                    <button onClick={() => setShowWebcam(false)} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg">Cancel</button>
                </div>
            </div>
        </div>
    );
};

// --- Main App Component ---
const AIDrawingBook = ({ onBack }) => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 p-4" style={{ fontFamily: "'Kalam', cursive" }}>
            <div className="max-w-6xl mx-auto">
                <Header onBack={onBack} />
                <PromptDisplay />
                <ErrorDisplay />
                <HistoryThumbnails />

                <main className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-white p-4 rounded-3xl shadow-lg border-4 border-dashed border-blue-600">
                    <SketchCanvas />
                    <ColoringCanvas />
                </main>

                <ActionButtons />
                <StorySection />
                <WebcamModal />
            </div>
        </div>
    );
};

const App = () => {
    // This is a placeholder for the onBack function.
    // In a real application, this would likely be handled by a router.
    const handleBack = () => {
        alert("Going back to the library!");
    };

    return (
        <DrawingBookProvider>
            <AIDrawingBook onBack={handleBack} />
        </DrawingBookProvider>
    );
};

export default App;
