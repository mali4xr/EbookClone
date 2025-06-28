import { useRef, useEffect, useState, useCallback } from 'react';
import { GeminiService } from '../services/GeminiService';
import { PollinationsService } from '../services/PollinationsService';
import { resizeBase64Image, blobToBase64, getCanvasPos, hexToRgbA, getPixelColor, setPixelColor, colorsMatch } from '../utils/imageUtils';

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

  // Story image overlay state
  const [storyImageBase64, setStoryImageBase64] = useState<string | null>(null);
  const [showStoryImage, setShowStoryImage] = useState(false);

  // History state
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedHistoryIndex, setSelectedHistoryIndex] = useState<number | null>(null);

  // Webcam state
  const [showWebcam, setShowWebcam] = useState(false);
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);

  // Color palette
  const colors = [
    "#FF0000", "#0000FF", "#00FF00", "#FFFF00", "#FF7F00",
    "#BF00BF", "#00FFFF", "#FFC0CB", "#8B4513", "#808080", "#FFFFFF"
  ];

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

  // Webcam stream management
  useEffect(() => {
    if (showWebcam) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          setWebcamStream(stream);
          if (webcamVideoRef.current) {
            webcamVideoRef.current.srcObject = stream;
          }
        })
        .catch(() => setError("Could not access webcam."));
    } else if (webcamStream) {
      webcamStream.getTracks().forEach((track) => track.stop());
      setWebcamStream(null);
    }
  }, [showWebcam, webcamStream]);

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
    };
  }, []);

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
    if (!isDrawing || !sketchCanvasRef.current) return;

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

  const handleReadStory = async () => {
    if (!story) return;
    setIsReadingStory(true);
    try {
      const encodedStory = encodeURIComponent(story);
      const voice = "alloy";
      const url = `https://text.pollinations.ai/'tell a 4 year old kid story about '${encodedStory}?model=openai-audio&voice=${voice}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to generate audio.");
      const blob = await response.blob();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);

      // Play background music at a lower volume
      const bgMusicUrl =
        "https://cdn.pixabay.com/download/audio/2025/06/20/audio_f144ebba0c.mp3?filename=babies-piano-45-seconds-362933.mp3";
      const bgAudio = new Audio(bgMusicUrl);
      bgAudio.loop = true;
      bgAudio.volume = 0.1;
      bgAudio.play().catch(() => {});

      // Fade Animation: alternate coloring and story image
      if (storyImageBase64 && hasGeneratedContent) {
        setShowStoryImage(true);
        let showingStory = true;
        fadeIntervalRef.current = setInterval(() => {
          setShowStoryImage((prev) => !prev);
          showingStory = !showingStory;
        }, 2000);
      }

      audioRef.current = audio;
      audio.play();

      audio.onended = () => {
        setTimeout(() => {
          bgAudio.pause();
          bgAudio.currentTime = 0;
        }, 2000);
        setIsReadingStory(false);
        setShowStoryImage(false);
        if (fadeIntervalRef.current) {
          clearInterval(fadeIntervalRef.current);
        }
        URL.revokeObjectURL(audioUrl);
      };
      audio.onerror = () => {
        setIsReadingStory(false);
        setShowStoryImage(false);
        if (fadeIntervalRef.current) {
          clearInterval(fadeIntervalRef.current);
        }
        setError("Could not play the story audio.");
        bgAudio.pause();
        bgAudio.currentTime = 0;
        URL.revokeObjectURL(audioUrl);
      };
    } catch (err) {
      setError("Could not generate audio for the story.");
      setIsReadingStory(false);
      setShowStoryImage(false);
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
      }
    }
  };

  // History handlers
  const handleSelectHistory = (idx: number) => {
    setSelectedHistoryIndex(idx);
    const item = history[idx];
    setRecognizedImage(item.recognizedImage);
    setCurrentPrompt(item.prompt);
    setStory(item.story || "");
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

  // Webcam handlers
  const handleWebcamCapture = async () => {
    const video = webcamVideoRef.current;
    if (!video) return;
    
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/png");
    const base64Image = await resizeBase64Image(dataUrl.split(",")[1], 200);

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
    setShowWebcam(false);
    setError(null);
    
    try {
      const sketchDescription = await GeminiService.recognizePhoto(base64Image);
      setRecognizedImage(sketchDescription);

      const imageGenerationPrompt = `A black connected line drawing of: ${sketchDescription} for children's coloring book with no internal colors, on a plain white background.`;
      const imageBlob = await PollinationsService.generateImage(imageGenerationPrompt);
      const generatedBase64 = await blobToBase64(imageBlob);

      // Draw to coloring canvas
      setHasGeneratedContent(true);
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
    if (webcamStream) {
      webcamStream.getTracks().forEach((track) => track.stop());
      setWebcamStream(null);
    }
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
    showStorySection,
    error,
    isReadingStory,
    storyImageBase64,
    showStoryImage,
    history,
    selectedHistoryIndex,
    showWebcam,
    colors,
    
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