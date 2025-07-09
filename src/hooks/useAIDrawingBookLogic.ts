import { useRef, useEffect, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { GeminiService } from '../services/GeminiService';
import { PollinationsService } from '../services/PollinationsService';
import { resizeBase64Image, blobToBase64, getCanvasPos, hexToRgbA, getPixelColor, setPixelColor, colorsMatch } from '../utils/imageUtils';

// Declare FFmpeg types for the older version
declare global {
  interface Window {
    FFmpeg: {
      createFFmpeg: (options?: any) => any;
      fetchFile: (data: any) => Promise<Uint8Array>;
    };
  }
}

interface HistoryItem {
  sketch: string;
  generated: string;
  recognizedImage: string;
  prompt: string;
  story: string;
  storyImageBase64?: string;
}

export const useAIDrawingBookLogic = () => {
  // Canvas refs
  const sketchCanvasRef = useRef<HTMLCanvasElement>(null);
  const coloringCanvasRef = useRef<HTMLCanvasElement>(null);
  const webcamVideoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [selectedColor, setSelectedColor] = useState<string>("#FF0000");
  const [hasGeneratedContent, setHasGeneratedContent] = useState(false);

  // UI and AI state
  const [currentPrompt, setCurrentPrompt] = useState<string>("");
  const [story, setStory] = useState<string>("");
  const [recognizedImage, setRecognizedImage] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGettingIdea, setIsGettingIdea] = useState(false);
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [showStorySection, setShowStorySection] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReadingStory, setIsReadingStory] = useState(false);
  const [isTypingStory, setIsTypingStory] = useState(false);
  const [displayedStory, setDisplayedStory] = useState<string>("");

  // Story image overlay state
  const [storyImageBase64, setStoryImageBase64] = useState<string | null>(null);
  const [showStoryImage, setShowStoryImage] = useState(false);

  // History state
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedHistoryIndex, setSelectedHistoryIndex] = useState<number | null>(null);

  // Webcam state - Fixed: Better state management
  const [showWebcam, setShowWebcam] = useState(false);
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const [isWebcamReady, setIsWebcamReady] = useState(false);

  // Video generation state
  const [generatedAudioBlob, setGeneratedAudioBlob] = useState<Blob | null>(null);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  const [ffmpegLoading, setFfmpegLoading] = useState(false);

  // Color palette
  const colors = [
    "#FF0000", "#0000FF", "#00FF00", "#FFFF00", "#FF7F00",
    "#BF00BF", "#00FFFF", "#FFC0CB", "#8B4513", "#808080", "#FFFFFF"
  ];

  const ffmpegRef = useRef<any>(null);

  // Confetti celebration function
  const celebrateWithConfetti = () => {
    // Multiple confetti bursts for extra celebration
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff']
    });
    
    // Second burst with different timing
    setTimeout(() => {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#ffd700', '#ff69b4', '#98fb98', '#87ceeb']
      });
    }, 300);
    
    // Third burst for grand finale
    setTimeout(() => {
      confetti({
        particleCount: 75,
        spread: 80,
        origin: { y: 0.5 },
        colors: ['#ff6347', '#40e0d0', '#ee82ee', '#90ee90']
      });
    }, 600);
  };

  // Play win sound function
  const playWinSound = () => {
    try {
      const winAudio = new Audio('https://cdn.pixabay.com/download/audio/2022/01/18/audio_8db1f1b5a5.mp3?filename=snd_fragment_retrievewav-14728.mp3');
      winAudio.volume = 0.5; // Set to 50% volume
      winAudio.play().catch(e => {
        console.log('Win sound play failed:', e);
      });
    } catch (error) {
      console.log('Error playing win sound:', error);
    }
  };

  // Initialize FFmpeg
  const loadFFmpeg = useCallback(async () => {
    if (ffmpegLoaded || ffmpegLoading) return;
    
    setFfmpegLoading(true);
    try {
      // Check if FFmpeg is available globally
      if (!window.FFmpeg) {
        throw new Error('FFmpeg library not loaded. Please refresh the page.');
      }

      const { createFFmpeg } = window.FFmpeg;
      const ffmpeg = createFFmpeg({
        log: true,
        corePath: 'https://unpkg.com/@ffmpeg/core@0.8.5/dist/ffmpeg-core.js',
      });
      
      ffmpegRef.current = ffmpeg;
      
      await ffmpeg.load();
      
      setFfmpegLoaded(true);
      console.log('FFmpeg loaded successfully');
    } catch (error) {
      console.error('Failed to load FFmpeg:', error);
      setError('Failed to initialize video processing. Please refresh the page and try again.');
    } finally {
      setFfmpegLoading(false);
    }
  }, [ffmpegLoaded, ffmpegLoading]);

  // Load FFmpeg on component mount
  useEffect(() => {
    loadFFmpeg().catch(console.error);
  }, [loadFFmpeg]);

  // Typing effect function
  const typeStory = useCallback((fullStory: string) => {
    setIsTypingStory(true);
    setDisplayedStory("");
    
    const words = fullStory.split(' ');
    let currentWordIndex = 0;
    
    const typeInterval = setInterval(() => {
      if (currentWordIndex < words.length) {
        setDisplayedStory(prev => {
          const newText = prev + (prev ? ' ' : '') + words[currentWordIndex];
          return newText;
        });
        currentWordIndex++;
      } else {
        clearInterval(typeInterval);
        setIsTypingStory(false);
        
        // Play win sound and confetti when typing completes
        setTimeout(() => {
          playWinSound();
          celebrateWithConfetti();
        }, 500);
      }
    }, 150); // 150ms delay between words for smooth typing effect
    
    return () => clearInterval(typeInterval);
  }, []);

  // Canvas setup effects
  useEffect(() => {
    const canvas = sketchCanvasRef.current;
    if (!canvas) return;

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
  }, []);

  useEffect(() => {
    const canvas = coloringCanvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  // Fixed: Improved webcam stream management
  useEffect(() => {
    let mounted = true;

    if (showWebcam) {
      setIsWebcamReady(false);
      setError(null);
      
      navigator.mediaDevices
        .getUserMedia({ 
          video: { 
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user'
          } 
        })
        .then((stream) => {
          if (!mounted) {
            // Component unmounted, clean up stream
            stream.getTracks().forEach(track => track.stop());
            return;
          }
          
          setWebcamStream(stream);
          if (webcamVideoRef.current) {
            webcamVideoRef.current.srcObject = stream;
            webcamVideoRef.current.onloadedmetadata = () => {
              if (mounted) {
                setIsWebcamReady(true);
              }
            };
          }
        })
        .catch((err) => {
          if (mounted) {
            console.error('Webcam error:', err);
            setError("Could not access webcam. Please check permissions.");
            setShowWebcam(false);
          }
        });
    } else {
      // Clean up webcam when hiding
      if (webcamStream) {
        webcamStream.getTracks().forEach((track) => track.stop());
        setWebcamStream(null);
      }
      if (webcamVideoRef.current) {
        webcamVideoRef.current.srcObject = null;
      }
      setIsWebcamReady(false);
    }

    return () => {
      mounted = false;
      if (webcamStream) {
        webcamStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [showWebcam]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
      }
      if (webcamStream) {
        webcamStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [webcamStream]);

  // Canvas utility functions
  const resizeColoringCanvas = () => {
    const canvas = coloringCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
  };

  const isSketchCanvasEmpty = useCallback((): boolean => {
    const canvas = sketchCanvasRef.current;
    if (!canvas) return true;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return true;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return imageData.data.every((pixel) => pixel === 0);
  }, []);

  const getSketchCanvasAsBase64 = useCallback((): string => {
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

  // Drawing handlers
  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (showWebcam) return; // Prevent drawing when webcam is active
    
    const canvas = sketchCanvasRef.current;
    if (!canvas) return;

    setIsDrawing(true);
    const pos = getCanvasPos(canvas, e.nativeEvent);
    setLastPos(pos);
    canvas.style.cursor = "crosshair";
  };

  const drawSketch = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing || !sketchCanvasRef.current || showWebcam) return;

    e.preventDefault();
    const canvas = sketchCanvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
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
      sketchCanvasRef.current.style.cursor = "default";
    }
  };

  // Flood fill algorithm for coloring
  const floodFill = useCallback(
    (startX: number, startY: number, fillColor: string) => {
      const canvas = coloringCanvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;
      const width = imageData.width;
      const height = imageData.height;

      const targetColor = getPixelColor(pixels, startX, startY, width);
      const replacementColor = hexToRgbA(fillColor);

      if (colorsMatch(targetColor, replacementColor)) {
        return;
      }

      const stack: [number, number][] = [[startX, startY]];
      let pixelCount = 0;

      while (stack.length > 0 && pixelCount < width * height * 4) {
        const [x, y] = stack.pop()!;

        if (x < 0 || x >= width || y < 0 || y >= height) {
          continue;
        }

        const currentColor = getPixelColor(pixels, x, y, width);

        if (colorsMatch(currentColor, targetColor)) {
          setPixelColor(pixels, x, y, width, replacementColor);
          pixelCount++;

          stack.push([x + 1, y]);
          stack.push([x - 1, y]);
          stack.push([x, y + 1]);
          stack.push([x, y - 1]);
        }
      }
      ctx.putImageData(imageData, 0, 0);
    },
    []
  );

  // Event handlers
  const handleColoringClick = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = coloringCanvasRef.current;
    if (!canvas || !hasGeneratedContent) {
      setError("Please generate a drawing first to color!");
      return;
    }
    setError(null);
    const { x, y } = getCanvasPos(canvas, e.nativeEvent);
    floodFill(x, y, selectedColor);
  };

  const handleColorSelect = (color: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedColor(color);
  };

  const handleClearAll = useCallback(() => {
    const sketchCanvas = sketchCanvasRef.current;
    const coloringCanvas = coloringCanvasRef.current;
    if (sketchCanvas) {
      sketchCanvas
        .getContext("2d")
        ?.clearRect(0, 0, sketchCanvas.width, sketchCanvas.height);
    }
    if (coloringCanvas) {
      coloringCanvas
        .getContext("2d")
        ?.clearRect(0, 0, coloringCanvas.width, coloringCanvas.height);
    }
    setHasGeneratedContent(false);
    setCurrentPrompt("");
    setStory("");
    setRecognizedImage("");
    setShowStorySection(false);
    setError(null);
  }, []);

  // AI functions
  const getDrawingIdea = async () => {
    setIsGettingIdea(true);
    setError(null);

    try {
      const idea = await GeminiService.getDrawingIdea();
      setCurrentPrompt(idea);
    } catch (err: any) {
      console.error("Error getting idea:", err);
      setError(err.message || "Could not get an idea right now. Please try again!");
    } finally {
      setIsGettingIdea(false);
    }
  };

  const enhanceDrawing = async () => {
    if (showWebcam) {
      setError("Please close the camera first!");
      return;
    }

    if (isSketchCanvasEmpty()) {
      setError("Please draw something on the canvas first!");
      const errorSound = new Audio(
        "https://cdn.pixabay.com/download/audio/2023/05/15/audio_59378cd845.mp3?filename=a-nasty-sound-if-you-choose-the-wrong-one-149895.mp3"
      );
      errorSound.play();
      return;
    }

    setIsGenerating(true);
    setError(null);
    setShowStorySection(false);

    try {
      let base64ImageData = getSketchCanvasAsBase64();
      base64ImageData = await resizeBase64Image(base64ImageData, 200);

      // Check if this is a reused drawing
      let historyIdx = selectedHistoryIndex;
      let isReuse = false;
      if (
        historyIdx !== null &&
        history[historyIdx] &&
        history[historyIdx].sketch === base64ImageData
      ) {
        isReuse = true;
      }

      if (isReuse) {
        // Reuse: use previous prompt/description
        const sketchDescription = history[historyIdx!].recognizedImage;
        const imageGenerationPrompt = `${sketchDescription},coloring book style, line art, no fill, No sexual content , child friendly, black lines, white background`;
        const imageBlob = await PollinationsService.generateImage(imageGenerationPrompt);
        const imageUrl = URL.createObjectURL(imageBlob);

        const img = new window.Image();
        img.onload = async () => {
          setHasGeneratedContent(true);
          
          // Trigger confetti and win sound for successful generation
          celebrateWithConfetti();
          playWinSound();
          
          setTimeout(() => {
            const coloringCanvas = coloringCanvasRef.current;
            if (!coloringCanvas) return;
            resizeColoringCanvas();
            const ctx = coloringCanvas.getContext("2d");
            if (ctx) {
              ctx.clearRect(0, 0, coloringCanvas.width, coloringCanvas.height);
              ctx.drawImage(img, 0, 0, coloringCanvas.width, coloringCanvas.height);
            }
          }, 0);
          
          const generatedBase64 = await blobToBase64(imageBlob);
          setHistory((prev) =>
            prev.map((item, i) =>
              i === historyIdx ? { ...item, generated: generatedBase64 } : item
            )
          );
          setShowStorySection(true);
          URL.revokeObjectURL(imageUrl);
        };
        img.onerror = () => {
          setError("Failed to load generated image for coloring.");
          URL.revokeObjectURL(imageUrl);
        };
        img.src = imageUrl;
      } else {
        // New drawing: call Gemini for description, then Pollinations
        const sketchDescription = await GeminiService.recognizeImage(base64ImageData);
        setRecognizedImage(sketchDescription);

        // Generate coloring book image
        const imageGenerationPrompt = `A black connected line drawing of: ${sketchDescription} for children's coloring book with no internal colors, on a plain white background.`;
        const imageBlob = await PollinationsService.generateImage(imageGenerationPrompt);
        const imageUrl = URL.createObjectURL(imageBlob);

        const img = new window.Image();
        img.onload = async () => {
          setHasGeneratedContent(true);
          
          // Trigger confetti and win sound for successful generation
          celebrateWithConfetti();
          playWinSound();
          
          setTimeout(() => {
            const coloringCanvas = coloringCanvasRef.current;
            if (!coloringCanvas) return;
            resizeColoringCanvas();
            const ctx = coloringCanvas.getContext("2d");
            if (ctx) {
              ctx.clearRect(0, 0, coloringCanvas.width, coloringCanvas.height);
              ctx.drawImage(img, 0, 0, coloringCanvas.width, coloringCanvas.height);
            }
          }, 0);
          
          const generatedBase64 = await blobToBase64(imageBlob);
          setHistory((prev) => {
            const newHistory = [
              ...prev,
              {
                sketch: base64ImageData,
                generated: generatedBase64,
                recognizedImage: sketchDescription,
                prompt: currentPrompt,
                story: "",
              },
            ];
            return newHistory.length > 10
              ? newHistory.slice(newHistory.length - 10)
              : newHistory;
          });
          setSelectedHistoryIndex(history.length >= 10 ? 9 : history.length);
          setShowStorySection(true);
          URL.revokeObjectURL(imageUrl);
        };
        img.onerror = () => {
          setError("Failed to load generated image for coloring.");
          URL.revokeObjectURL(imageUrl);
        };
        img.src = imageUrl;
      }
    } catch (err: any) {
      console.error("Error generating image:", err);
      setError(err.message || "Oops! Something went wrong while creating the drawing.");
    } finally {
      setIsGenerating(false);
    }
  };

  const generateStory = async () => {
    // If selectedHistoryIndex is set and story exists in history, reuse it
    if (
      selectedHistoryIndex !== null &&
      history[selectedHistoryIndex] &&
      history[selectedHistoryIndex].story &&
      history[selectedHistoryIndex].story.trim() !== ""
    ) {
      setStory(history[selectedHistoryIndex].story);
      setStoryImageBase64(history[selectedHistoryIndex].storyImageBase64 || null);
      return;
    }

    if (!recognizedImage) {
      setError("Please generate a drawing first!");
      return;
    }

    setIsGeneratingStory(true);
    setError(null);

    try {
      const storyText = await GeminiService.generateStory(recognizedImage);
      setStory(storyText);
      
      // Start typing effect for the story
      typeStory(storyText);

      // Generate Story Image
      const storyImageBlob = await PollinationsService.generateImage("colorful child scene+no+nudit" + storyText);
      const storyImageBase64 = await blobToBase64(storyImageBlob);
      setStoryImageBase64(storyImageBase64);

      // Save story and story image to history if from history
      if (selectedHistoryIndex !== null && history[selectedHistoryIndex]) {
        setHistory((prev) =>
          prev.map((item, idx) =>
            idx === selectedHistoryIndex
              ? { ...item, story: storyText, storyImageBase64 }
              : item
          )
        );
      }
    } catch (err: any) {
      console.error("Error generating story:", err);
      setError(err.message || "The storyteller seems to be napping! Please try again.");
      setStory("");
      setStoryImageBase64(null);
    } finally {
      setIsGeneratingStory(false);
    }
  };

  // FIXED: Enhanced cleanup function to ensure animation stops
  const cleanupStoryAnimation = useCallback(() => {
    console.log('🧹 Cleaning up story animation');
    
    // Clear the fade interval
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
      console.log('⏰ Cleared fade interval');
    }
    
    // Reset animation state
    setShowStoryImage(false);
    setIsReadingStory(false);
    
    console.log('✅ Animation cleanup complete');
  }, []);

  // FIXED: Completely rewritten handleReadStory with proper cleanup
  const handleReadStory = async (storytellerType: 'pollinations' | 'elevenlabs' = 'pollinations') => {
    if (!story) return;
    
    console.log('🎬 Starting handleReadStory');
    console.log('🎭 Using storyteller:', storytellerType);
    console.log('📸 Current storyImageBase64:', !!storyImageBase64);
    console.log('🎨 hasGeneratedContent:', hasGeneratedContent);
    
    // STEP 1: Complete cleanup of any existing state
    cleanupStoryAnimation();
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
      console.log('🔇 Stopped existing audio');
    }
    
    // STEP 2: Force reset animation state
    setShowStoryImage(false);
    setIsReadingStory(true);
    
    // STEP 3: Ensure we have the story image from current context
    let currentStoryImage = storyImageBase64;
    if (!currentStoryImage && selectedHistoryIndex !== null && history[selectedHistoryIndex]) {
      currentStoryImage = history[selectedHistoryIndex].storyImageBase64 || null;
      console.log('📚 Retrieved story image from history:', !!currentStoryImage);
      // Update the state to ensure consistency
      if (currentStoryImage) {
        setStoryImageBase64(currentStoryImage);
      }
    }
    
    console.log('🖼️ Final story image check:', !!currentStoryImage);
    
    try {
      let audioBlob: Blob;
      
      if (storytellerType === 'elevenlabs') {
        // Use ElevenLabs TTS
        const { ElevenLabsService } = await import('../services/ElevenLabsService');
        const storyText = `Tell a 4 year old kid a moral story about ${story}`;
        audioBlob = await ElevenLabsService.generateTTSAudio(storyText);
        console.log('🎤 Generated audio using ElevenLabs TTS');
      } else {
        // Use existing Pollinations AI
        const pollinationsApiKey = import.meta.env.VITE_POLLINATIONS_API_KEY;
        if (!pollinationsApiKey) {
          throw new Error('Pollinations AI API key not configured. Please add VITE_POLLINATIONS_API_KEY to your .env file.');
        }

        const encodedStory = encodeURIComponent(story);
        const voice = "alloy";
        // Add the API key as a query parameter using Bearer token method
        const url = `https://text.pollinations.ai/'tell a 4 year old kid a moral story about '${encodedStory}?model=openai-audio&voice=${voice}&token=${pollinationsApiKey}`;
        const response = await fetch(url);
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to generate audio from Pollinations AI: ${response.status} ${response.statusText} - ${errorText}`);
        }
        audioBlob = await response.blob();
        console.log('🎤 Generated audio using Pollinations AI');
      }
      
      // Store the audio blob for video generation
      setGeneratedAudioBlob(audioBlob);
      
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      // Play background music at a lower volume
      const bgMusicUrl =
        "https://cdn.pixabay.com/download/audio/2025/06/20/audio_f144ebba0c.mp3?filename=babies-piano-45-seconds-362933.mp3";
      const bgAudio = new Audio(bgMusicUrl);
      bgAudio.loop = true;
      bgAudio.volume = 0.1;
      bgAudio.play().catch(() => {});

      // STEP 4: Start animation cycle ONLY if we have both story image and generated content
      if (currentStoryImage && hasGeneratedContent) {
        console.log('🎭 Starting animation cycle');
        
        // Force a small delay to ensure state is updated
        setTimeout(() => {
          setShowStoryImage(true);
          console.log('👁️ Set story image visible');
          
          // Start the alternating cycle after initial display
          setTimeout(() => {
            fadeIntervalRef.current = setInterval(() => {
              setShowStoryImage((prev) => {
                const newValue = !prev;
                console.log('🔄 Toggling story image visibility:', newValue);
                return newValue;
              });
            }, 5000); // 5 seconds for each image
            console.log('⏰ Started fade interval');
          }, 5000); // Show story image for 5 seconds first
        }, 100); // Small delay to ensure state update
      } else {
        console.log('❌ Animation not started - missing requirements:', {
          hasStoryImage: !!currentStoryImage,
          hasGeneratedContent
        });
      }

      audioRef.current = audio;
      audio.play();

      // FIXED: Enhanced audio.onended with proper cleanup
      audio.onended = () => {
        console.log('🎵 Audio ended - starting cleanup');
        
        // Stop background music
        setTimeout(() => {
          bgAudio.pause();
          bgAudio.currentTime = 0;
        }, 2000);
        
        // Clean up animation and state
        cleanupStoryAnimation();
        
        // Clean up audio resources
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
        
        console.log('✅ Audio cleanup complete');
      };
      
      // FIXED: Enhanced audio.onerror with proper cleanup
      audio.onerror = () => {
        console.log('❌ Audio error - starting cleanup');
        
        // Clean up animation and state
        cleanupStoryAnimation();
        
        // Stop background music
        bgAudio.pause();
        bgAudio.currentTime = 0;
        
        // Clean up audio resources
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
        
        setError("Could not play the story audio.");
        console.log('✅ Audio error cleanup complete');
      };
    } catch (err) {
      console.log('💥 Error in handleReadStory:', err);
      setError(`Could not generate audio for the story using ${storytellerType}.`);
      cleanupStoryAnimation();
    }
  };

  // Generate and download video slideshow
const generateAndDownloadVideo = useCallback(async () => {
  if (ffmpegLoading) {
    setError('Video processing is still loading. Please wait a moment and try again.');
    return;
  }

  if (!ffmpegLoaded) {
    setError('Video processing not ready. Initializing...');
    try {
      await loadFFmpeg();
      if (!ffmpegLoaded) {
        setError('Failed to initialize video processing. Please refresh and try again.');
        return;
      }
    } catch (error) {
      setError('Failed to initialize video processing. Please refresh and try again.');
      return;
    }
  }

  if (!ffmpegRef.current || !ffmpegLoaded) {
    setError('Video processing not available. Please refresh and try again.');
    return;
  }

  if (selectedHistoryIndex === null || !history[selectedHistoryIndex]) {
    setError('Please select a drawing from your gallery first.');
    return;
  }

  if (!generatedAudioBlob) {
    setError('Please generate and play the story audio first.');
    return;
  }

  const historyItem = history[selectedHistoryIndex];
  if (!historyItem.sketch || !historyItem.generated) {
    setError('Missing required images for video generation.');
    return;
  }

  setIsGeneratingVideo(true);
  setError(null);

  try {
    const ffmpeg = ffmpegRef.current;
    const { fetchFile } = window.FFmpeg;

    // Convert images to blobs
    const sketchBlob = await fetch(`data:image/png;base64,${historyItem.sketch}`).then(r => r.blob());
    const generatedBlob = await fetch(`data:image/png;base64,${historyItem.generated}`).then(r => r.blob());

    ffmpeg.FS('writeFile', 'sketch.png', await fetchFile(sketchBlob));
    ffmpeg.FS('writeFile', 'generated.png', await fetchFile(generatedBlob));

    let hasStoryImage = false;
    if (historyItem.storyImageBase64) {
      const storyBlob = await fetch(`data:image/png;base64,${historyItem.storyImageBase64}`).then(r => r.blob());
      ffmpeg.FS('writeFile', 'story.png', await fetchFile(storyBlob));
      hasStoryImage = true;
    }

    ffmpeg.FS('writeFile', 'audio.mp3', await fetchFile(generatedAudioBlob));

    // Get audio duration
    const audioDuration = await new Promise<number>((resolve, reject) => {
      const audio = new Audio(URL.createObjectURL(generatedAudioBlob));
      audio.addEventListener('loadedmetadata', () => resolve(audio.duration));
      audio.addEventListener('error', () => reject(new Error('Failed to load audio duration')));
    });

    // Image and transition settings
    const visibleDuration = 3; // seconds each image fully visible
    const transitionDuration = 2; // fade duration
    const totalImageDuration = visibleDuration + transitionDuration;

    // Prepare image list
    const images = ['sketch.png', 'generated.png'];
    if (hasStoryImage) images.push('story.png');

    const numImages = images.length;
    const cycleDuration = numImages * totalImageDuration;
    const numCycles = Math.ceil(audioDuration / cycleDuration);

    // Write ffmpeg input arguments
    const inputArgs: string[] = [];
    images.forEach(img => {
      inputArgs.push('-loop', '1', '-t', `${audioDuration}`, '-i', img);
    });
    inputArgs.push('-i', 'audio.mp3');

    // Build filter graph
    let filterComplexParts: string[] = [];
    let streamTags: string[] = [];

    for (let cycle = 0; cycle < numCycles; cycle++) {
      for (let idx = 0; idx < numImages; idx++) {
        const startTime = cycle * cycleDuration + idx * totalImageDuration;

        filterComplexParts.push(
          `[${idx}:v]format=rgba,fade=t=in:st=${startTime}:d=${transitionDuration}:alpha=1,fade=t=out:st=${startTime + visibleDuration}:d=${transitionDuration}:alpha=1,setpts=PTS-STARTPTS+${startTime}/TB[v${cycle}_${idx}]`
        );

        streamTags.push(`[v${cycle}_${idx}]`);
      }
    }

    const concatFilter = `${streamTags.join('')}` + `concat=n=${numImages * numCycles}:v=1:a=0[outv]`;

    const fullFilter = `${filterComplexParts.join(';')};${concatFilter}`;

    await ffmpeg.run(
      ...inputArgs,
      '-filter_complex',
      fullFilter,
      '-map', '[outv]', '-map', `${numImages}:a`,
      '-c:v', 'libx264', '-c:a', 'aac',
      '-shortest', '-y', 'slideshow.mp4'
    );

    // Read and download video
    const videoData = ffmpeg.FS('readFile', 'slideshow.mp4');
    const videoBlob = new Blob([videoData], { type: 'video/mp4' });

    const url = URL.createObjectURL(videoBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-story-${Date.now()}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    celebrateWithConfetti();
    playWinSound();
  } catch (err: any) {
    console.error('Error generating video:', err);
    setError(err.message || 'Failed to generate video. Please try again.');
  } finally {
    setIsGeneratingVideo(false);
  }
}, [ffmpegLoaded, ffmpegLoading, loadFFmpeg, selectedHistoryIndex, history, generatedAudioBlob, celebrateWithConfetti, playWinSound]);

  // History handlers
  const handleSelectHistory = (idx: number) => {
    console.log('📚 Selecting history item:', idx);
    setSelectedHistoryIndex(idx);
    const item = history[idx];
    setRecognizedImage(item.recognizedImage);
    setCurrentPrompt(item.prompt);
    setStory(item.story || "");
    
    // CRITICAL: Ensure story image is properly set from history
    const historyStoryImage = item.storyImageBase64 || null;
    setStoryImageBase64(historyStoryImage);
    console.log('🖼️ Set story image from history:', !!historyStoryImage);
    
    setHasGeneratedContent(true);

    // Draw sketch to sketchCanvas
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
    sketchImg.src = "data:image/png;base64," + item.sketch;

    // Draw generated to coloringCanvas
    const genImg = new window.Image();
    genImg.onload = () => {
      const canvas = coloringCanvasRef.current;
      if (canvas) {
        resizeColoringCanvas();
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(genImg, 0, 0, canvas.width, canvas.height);
        }
      }
    };
    genImg.src = "data:image/png;base64," + item.generated;

    setShowStorySection(true);
  };

  const handleDeleteHistory = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory((prev) => prev.filter((_, i) => i !== idx));
    if (selectedHistoryIndex === idx) {
      handleClearAll();
      setSelectedHistoryIndex(null);
    } else if (selectedHistoryIndex !== null && idx < selectedHistoryIndex) {
      setSelectedHistoryIndex(selectedHistoryIndex - 1);
    }
  };

  // Fixed: Improved webcam handlers
  const handleWebcamCapture = async () => {
    const video = webcamVideoRef.current;
    if (!video || !isWebcamReady) {
      setError("Camera not ready. Please wait a moment.");
      return;
    }
    
    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setError("Could not process camera image.");
        return;
      }
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/png");
      const base64Image = await resizeBase64Image(dataUrl.split(",")[1], 200);

      // Close webcam first
      setShowWebcam(false);
      
      // Set the captured image into the drawing area
      const sketchCanvas = sketchCanvasRef.current;
      if (sketchCanvas) {
        const sketchCtx = sketchCanvas.getContext("2d");
        if (sketchCtx) {
          sketchCtx.clearRect(0, 0, sketchCanvas.width, sketchCanvas.height);
          const img = new window.Image();
          img.onload = () => {
            sketchCtx.drawImage(img, 0, 0, sketchCanvas.width, sketchCanvas.height);
          };
          img.src = dataUrl;
        }
      }

      setIsGenerating(true);
      setError(null);
      
      const sketchDescription = await GeminiService.recognizePhoto(base64Image);
      setRecognizedImage(sketchDescription);

      const imageGenerationPrompt = `A black connected line drawing of: ${sketchDescription} for children's coloring book with no internal colors, on a plain white background.`;
      const imageBlob = await PollinationsService.generateImage(imageGenerationPrompt);
      const generatedBase64 = await blobToBase64(imageBlob);

      // Draw to coloring canvas
      setHasGeneratedContent(true);
      
      // Trigger confetti celebration for photo processing
      celebrateWithConfetti();
      playWinSound();
      
      setTimeout(() => {
        const coloringCanvas = coloringCanvasRef.current;
        if (!coloringCanvas) return;
        resizeColoringCanvas();
        const ctx = coloringCanvas.getContext("2d");
        if (ctx) {
          const img = new window.Image();
          img.onload = () => {
            ctx.clearRect(0, 0, coloringCanvas.width, coloringCanvas.height);
            ctx.drawImage(img, 0, 0, coloringCanvas.width, coloringCanvas.height);
          };
          img.src = "data:image/png;base64," + generatedBase64;
        }
      }, 0);

      // Add to history
      setHistory((prev) => {
        const newHistory = [
          ...prev,
          {
            sketch: base64Image,
            generated: generatedBase64,
            recognizedImage: sketchDescription,
            prompt: "[Photo]",
            story: "",
          },
        ];
        return newHistory.length > 10
          ? newHistory.slice(newHistory.length - 10)
          : newHistory;
      });
      setSelectedHistoryIndex(history.length >= 10 ? 9 : history.length);
      setShowStorySection(true);
    } catch (err: any) {
      setError(err.message || "Could not process photo.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleWebcamCancel = () => {
    setShowWebcam(false);
    setError(null);
  };

  return {
    // Refs
    sketchCanvasRef,
    coloringCanvasRef,
    webcamVideoRef,
    
    // State
    selectedColor,
    hasGeneratedContent,
    currentPrompt,
    story,
    recognizedImage,
    isGenerating,
    isGettingIdea,
    isGeneratingStory,
    isTypingStory,
    displayedStory,
    showStorySection,
    error,
    isReadingStory,
    storyImageBase64,
    showStoryImage,
    history,
    selectedHistoryIndex,
    showWebcam,
    colors,
    
    // Video generation
    generatedAudioBlob,
    isGeneratingVideo,
    ffmpegLoaded,
    ffmpegLoading,
    generateAndDownloadVideo,
    
    // Drawing handlers
    startDrawing,
    drawSketch,
    stopDrawing,
    handleColoringClick,
    handleColorSelect,
    
    // Action handlers
    handleClearAll,
    getDrawingIdea,
    enhanceDrawing,
    generateStory,
    handleReadStory,
    
    // History handlers
    handleSelectHistory,
    handleDeleteHistory,
    
    // Webcam handlers
    setShowWebcam,
    handleWebcamCapture,
    handleWebcamCancel,
  };
}; 