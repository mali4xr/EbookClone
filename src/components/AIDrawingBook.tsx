import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  Palette,
  Sparkles,
  RotateCcw,
  BookOpen,
  Wand2,
  Camera,
  Loader,
} from "lucide-react";
import { GeminiService as GeminiServiceAPI } from "../services/GeminiService";

// Assuming GeminiService handles API key retrieval.
// For this standalone example, I will define a placeholder for GeminiService.
// In a real project, ensure you have this service properly set up.
const GeminiService = async (payload: any) => {
  const apiKey = await GeminiServiceAPI.getApiKey();
  if (!apiKey) {
    throw new Error(
      "Gemini API key is not configured. Please check your environment variables."
    );
  }
};

const GEMINI_API_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const POLLINATIONS_API_ENDPOINT = "https://image.pollinations.ai/prompt/";

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
  const [selectedColor, setSelectedColor] = useState<string>("#FF0000"); // Default to Red
  const [hasGeneratedContent, setHasGeneratedContent] = useState(false); // Track if we have generated content
  const colors = [
    "#FF0000",
    "#0000FF",
    "#00FF00",
    "#FFFF00",
    "#FF7F00",
    "#BF00BF",
    "#00FFFF",
    "#FFC0CB",
    "#8B4513",
    "#808080",
    "#FFFFFF",
  ]; // Red, Blue, Green, Yellow, Orange, Purple, Cyan, Pink, Brown, Gray, White

  // --- UI and AI Interaction State ---
  const [currentPrompt, setCurrentPrompt] = useState<string>("");
  const [story, setStory] = useState<string>("");
  const [recognizedImage, setRecognizedImage] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false); // For generating drawing
  const [isGettingIdea, setIsGettingIdea] = useState(false);
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [showStorySection, setShowStorySection] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReadingStory, setIsReadingStory] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // --- History State ---
  const [history, setHistory] = useState<
    {
      sketch: string;
      generated: string;
      recognizedImage: string;
      prompt: string;
      story: string;
    }[]
  >([]); // <-- Fix: was '}(})', should be '([])'
  const [selectedHistoryIndex, setSelectedHistoryIndex] = useState<
    number | null
  >(null);

  // --- Webcam Stream State ---
  const [showWebcam, setShowWebcam] = useState(false);
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const webcamVideoRef = useRef<HTMLVideoElement | null>(null);

  // --- Gemini Safety Settings ---
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
    {
      category: "HARM_CATEGORY_CIVIC_INTEGRITY",
      threshold: "BLOCK_LOW_AND_ABOVE",
    },
  ];

  // --- Canvas Utility Functions ---

  // Sets up canvas dimensions and drawing styles for the sketch canvas
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

  // Helper function to resize the coloring canvas to match its displayed size
  const resizeColoringCanvas = () => {
    const canvas = coloringCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
  };

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
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  // Gets mouse or touch position relative to a canvas element
  const getCanvasPos = (
    canvas: HTMLCanvasElement,
    e: MouseEvent | TouchEvent
  ): { x: number; y: number } => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    return {
      x: Math.floor((clientX - rect.left) * scaleX),
      y: Math.floor((clientY - rect.top) * scaleY),
    };
  };

  // Checks if the sketch canvas is empty (all pixels are transparent black)
  const isSketchCanvasEmpty = useCallback((): boolean => {
    const canvas = sketchCanvasRef.current;
    if (!canvas) return true;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return true;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    // Check if all pixel data is 0 (transparent black, i.e., empty)
    return imageData.data.every((pixel) => pixel === 0);
  }, []);

  // Converts the sketch canvas content to a Base64 PNG image
  const getSketchCanvasAsBase64 = useCallback((): string => {
    const canvas = sketchCanvasRef.current;
    if (!canvas) return "";

    // Create a temporary canvas to ensure white background for the image data
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext("2d");

    if (tempCtx) {
      tempCtx.fillStyle = "#FFFFFF"; // Fill with white background
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      tempCtx.drawImage(canvas, 0, 0); // Draw existing sketch
    }

    return tempCanvas.toDataURL("image/png").split(",")[1]; // Get base64 data part
  }, []);

  // --- Drawing Handlers (Sketch Canvas) ---

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = sketchCanvasRef.current;
    if (!canvas) return;

    setIsDrawing(true);
    const pos = getCanvasPos(canvas, e.nativeEvent);
    setLastPos(pos);
    canvas.style.cursor = "crosshair"; // Change cursor for drawing
  };

  const drawSketch = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing || !sketchCanvasRef.current) return;

    e.preventDefault(); // Prevent scrolling on touch devices
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
      sketchCanvasRef.current.style.cursor = "default"; // Restore default cursor
    }
  };

  // --- Coloring Functions (Coloring Canvas) ---

  // Converts a hex color string to an RGBA array [R, G, B, A]
  const hexToRgbA = (hex: string): [number, number, number, number] => {
    let c;
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
      c = hex.substring(1).split("");
      if (c.length === 3) {
        c = [c[0], c[0], c[1], c[1], c[2], c[2]];
      }
      c = "0x" + c.join("");
      return [
        Number(c >> 16) & 255,
        Number(c >> 8) & 255,
        Number(c) & 255,
        255,
      ]; // Alpha channel is always 255 (fully opaque)
    }
    throw new Error("Invalid Hex color format");
  };

  // Gets the RGBA color of a pixel at (x, y) from an ImageData array
  const getPixelColor = (
    pixels: Uint8ClampedArray,
    x: number,
    y: number,
    width: number
  ): [number, number, number, number] => {
    const index = (y * width + x) * 4;
    return [
      pixels[index],
      pixels[index + 1],
      pixels[index + 2],
      pixels[index + 3],
    ];
  };

  // Sets the RGBA color of a pixel at (x, y) in an ImageData array
  const setPixelColor = (
    pixels: Uint8ClampedArray,
    x: number,
    y: number,
    width: number,
    color: [number, number, number, number]
  ) => {
    const index = (y * width + x) * 4;
    pixels[index] = color[0];
    pixels[index + 1] = color[1];
    pixels[index + 2] = color[2];
    pixels[index + 3] = color[3]; // Alpha
  };

  // Compares two RGBA colors with a given tolerance
  const colorsMatch = (
    color1: [number, number, number, number],
    color2: [number, number, number, number],
    tolerance = 10
  ): boolean => {
    return (
      Math.abs(color1[0] - color2[0]) <= tolerance &&
      Math.abs(color1[1] - color2[1]) <= tolerance &&
      Math.abs(color1[2] - color2[2]) <= tolerance &&
      Math.abs(color1[3] - color2[3]) <= tolerance
    );
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

      // If target color is already the replacement color, do nothing
      if (colorsMatch(targetColor, replacementColor)) {
        return;
      }

      const stack: [number, number][] = [[startX, startY]];
      let pixelCount = 0; // Guard against infinite loops

      while (stack.length > 0 && pixelCount < width * height * 4) {
        // Limit iterations to avoid performance issues
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
    },
    []
  ); // Dependencies: none, as it uses internal canvas ref and utility functions

  // Event handler for coloring canvas click/touch
  const handleColoringClick = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
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
      sketchCanvas
        .getContext("2d")
        ?.clearRect(0, 0, sketchCanvas.width, sketchCanvas.height);
    }
    if (coloringCanvas) {
      coloringCanvas
        .getContext("2d")
        ?.clearRect(0, 0, coloringCanvas.width, coloringCanvas.height);
    }
    setHasGeneratedContent(false); // Reset content flag
    setCurrentPrompt("");
    setStory("");
    setRecognizedImage("");
    setShowStorySection(false);
    setError(null);
  }, []); // Dependencies: none, as it only clears canvases and resets state

  // Generic AI API caller
  const callAI = async (payload: any, model: "gemini" | "pollinations") => {
    const apiKey = await GeminiServiceAPI.getApiKey();
    if (!apiKey) {
      throw new Error("API key is not configured.");
    }

    let endpoint = "";
    let method = "POST";
    let headers: HeadersInit = { "Content-Type": "application/json" };
    let body: BodyInit | null = JSON.stringify(payload);

    if (model === "gemini") {
      // Inject safety settings for Gemini
      const payloadWithSafety = {
        ...payload,
        safetySettings: geminiSafetySettings,
      };
      endpoint = `${GEMINI_API_ENDPOINT}?key=${apiKey}`;
      body = JSON.stringify(payloadWithSafety);
    } else if (model === "pollinations") {
      // Pollinations.ai uses a GET request for simple prompts
      // The payload will just be the prompt string
      // Add width, height, seed, nologo params
      endpoint = `${POLLINATIONS_API_ENDPOINT}${encodeURIComponent(
        payload
      )}?width=600&height=800&seed=42&nologo=True`;
      method = "GET";
      headers = {}; // No content-type for GET image request
      body = null;
    } else {
      throw new Error("Unsupported AI model.");
    }

    const response = await fetch(endpoint, { method, headers, body });

    if (!response.ok) {
      let errorMsg = `API Error (${response.status}): ${response.statusText}`;
      try {
        if (model === "gemini") {
          const errorData = await response.json();
          errorMsg = `API Error: ${
            errorData.error?.message || JSON.stringify(errorData)
          }`;
        } else {
          errorMsg = `Image Generation Error: ${await response.text()}`;
        }
      } catch (jsonError) {
        console.error("Could not parse error response as JSON", jsonError);
      }
      throw new Error(errorMsg);
    }

    if (model === "pollinations") {
      // For Pollinations, we expect an image response directly, not JSON
      return response.blob(); // Return as Blob
    }
    return response.json();
  };

  // --- Gemini Token Counting Helper ---
  const logGeminiTokenInfo = (
    label: string,
    tokenInfo: any,
    usageMetadata?: any
  ) => {
    // usageMetadata is from generateContent, tokenInfo is from countTokens
    const promptTokens =
      usageMetadata?.promptTokenCount ?? tokenInfo?.promptTokenCount ?? "-";
    const candidateTokens =
      usageMetadata?.candidatesTokenCount ??
      usageMetadata?.candidatesTokensCount ??
      tokenInfo?.candidatesTokenCount ??
      "-";
    const totalTokens =
      usageMetadata?.totalTokenCount ?? tokenInfo?.totalTokens ?? "-";
    console.log(
      `[${label}] Gemini Token Usage:\n` +
        `  prompt tokens: ${promptTokens}\n` +
        `  candidate tokens: ${candidateTokens}\n` +
        `  total: ${totalTokens}`
    );
  };

  const countGeminiTokens = async (payload: any) => {
    try {
      const apiKey = await GeminiServiceAPI.getApiKey();
      if (!apiKey) throw new Error("API key is not configured.");
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:countTokens?key=${apiKey}`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Token count error");
      }
      return await response.json();
    } catch (err) {
      console.error("Token count error:", err);
      return null;
    }
  };

  const getDrawingIdea = async () => {
    setIsGettingIdea(true);
    setError(null);

    try {
      const prompt =
        "Give me a simple, fun, and creative drawing idea for a child. Be concise, one sentence only. For example: 'A friendly robot drinking a milkshake' or 'A snail with a birthday cake for a shell'.";
      const payload = {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      };

      // Token count before sending
      const tokenInfo = await countGeminiTokens(payload);
      logGeminiTokenInfo("Get Idea (countTokens)", tokenInfo);

      const result = await callAI(payload, "gemini");
      logGeminiTokenInfo(
        "Get Idea (generateContent)",
        null,
        result.usageMetadata
      );

      const idea = result.candidates[0].content.parts[0].text;
      setCurrentPrompt(idea.trim());
    } catch (err: any) {
      console.error("Error getting idea:", err);
      setError(
        err.message || "Could not get an idea right now. Please try again!"
      );
    } finally {
      setIsGettingIdea(false);
    }
  };

  // Utility: Resize a base64 PNG image to 380x380 and return new base64 string
  const resizeBase64Image = async (
    base64: string,
    size = 200
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject("No canvas context");
        ctx.fillStyle = "#FFF";
        ctx.fillRect(0, 0, size, size);
        // Draw image centered and scaled to fit
        let sx = 0,
          sy = 0,
          sw = img.width,
          sh = img.height;
        if (img.width > img.height) {
          sx = (img.width - img.height) / 2;
          sw = sh = img.height;
        } else if (img.height > img.width) {
          sy = (img.height - img.width) / 2;
          sw = sh = img.width;
        }
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, size, size);
        const resizedBase64 = canvas.toDataURL("image/png").split(",")[1];
        resolve(resizedBase64);
      };
      img.onerror = reject;
      img.src = "data:image/png;base64," + base64;
    });
  };

  const enhanceDrawing = async () => {
    if (isSketchCanvasEmpty()) {
      setError("Please draw something on the canvas first!");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setShowStorySection(false);

    try {
      let base64ImageData = getSketchCanvasAsBase64();
      // --- Resize to 380x380 before sending to Gemini ---
      base64ImageData = await resizeBase64Image(base64ImageData, 200);

      // Helper to convert blob to base64
      const blobToBase64 = (blob: Blob): Promise<string> =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () =>
            resolve((reader.result as string).split(",")[1]);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

      // Check if this is a reused drawing (selected from history)
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
        const imageBlob = await callAI(imageGenerationPrompt, "pollinations");
        const imageUrl = URL.createObjectURL(imageBlob);

        // Show alert with the image URL sent to Pollinations
        // alert(`Pollinations image prompt:\n${imageGenerationPrompt}`);

        const img = new window.Image();
        img.onload = async () => {
          setHasGeneratedContent(true); // 1. Make canvas visible
          // Wait for the canvas to be visible in the DOM
          setTimeout(() => {
            const coloringCanvas = coloringCanvasRef.current;
            if (!coloringCanvas) return;
            resizeColoringCanvas(); // 2. Ensure correct size
            const ctx = coloringCanvas.getContext("2d");
            if (ctx) {
              ctx.clearRect(0, 0, coloringCanvas.width, coloringCanvas.height);
              ctx.drawImage(
                img,
                0,
                0,
                coloringCanvas.width,
                coloringCanvas.height
              );
            }
          }, 0);
          // Update generated image in history
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
        // New drawing: call Gemini for description, then Pollinations, then add to history
        const descriptionPrompt =
          "Keywords only:subject. No colors. No intoductions, child sensitive, child safe. E.g. smiling sun, house with tree, cat chasing ball";
        const descriptionPayload = {
          contents: [
            {
              parts: [
                { text: descriptionPrompt },
                {
                  inlineData: { mimeType: "image/png", data: base64ImageData },
                },
              ],
            },
          ],
        };

        // Token count for recognized drawing
        const tokenInfo = await countGeminiTokens(descriptionPayload);
        logGeminiTokenInfo("Recognized Drawing (countTokens)", tokenInfo);

        const descriptionResult = await callAI(descriptionPayload, "gemini");
        logGeminiTokenInfo(
          "Recognized Drawing (generateContent)",
          null,
          descriptionResult.usageMetadata
        );

        const sketchDescription =
          descriptionResult.candidates[0].content.parts[0].text.trim();
        setRecognizedImage(sketchDescription);

        // Generate coloring book image
        const imageGenerationPrompt = `A black connected line drawing of: ${sketchDescription} for children's coloring book with no internal colors, on a plain white background.`;
        // No token count for pollinations (image) API

        const imageBlob = await callAI(imageGenerationPrompt, "pollinations");
        const imageUrl = URL.createObjectURL(imageBlob);

        // Show alert with the image URL sent to Pollinations
        // alert(`Pollinations image prompt:\n${imageGenerationPrompt}`);

        const img = new window.Image();
        img.onload = async () => {
          setHasGeneratedContent(true); // 1. Make canvas visible
          // Wait for the canvas to be visible in the DOM
          setTimeout(() => {
            const coloringCanvas = coloringCanvasRef.current;
            if (!coloringCanvas) return;
            resizeColoringCanvas(); // 2. Ensure correct size
            const ctx = coloringCanvas.getContext("2d");
            if (ctx) {
              ctx.clearRect(0, 0, coloringCanvas.width, coloringCanvas.height);
              ctx.drawImage(
                img,
                0,
                0,
                coloringCanvas.width,
                coloringCanvas.height
              );
            }
          }, 0);
          // Save to history as new
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
            // Limit to last 10 items
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
      setError(
        err.message || "Oops! Something went wrong while creating the drawing."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const generateStory = async () => {
    if (!recognizedImage) {
      setError("Please generate a drawing first!");
      return;
    }

    setIsGeneratingStory(true);
    setError(null);

    try {
      // Use the recognized image label as the story context
      const prompt = `Write a very short (2-3 sentences), happy, and simple story for a young child (3-5 years old) about this: "${recognizedImage}"`;

      const payload = {
        contents: [{ parts: [{ text: prompt }] }],
      };

      // Token count for story
      const tokenInfo = await countGeminiTokens(payload);
      logGeminiTokenInfo("Create Story (countTokens)", tokenInfo);

      const result = await callAI(payload, "gemini");
      logGeminiTokenInfo(
        "Create Story (generateContent)",
        null,
        result.usageMetadata
      );

      const storyText = result.candidates[0].content.parts[0].text;
      setStory(storyText.trim());
    } catch (err: any) {
      console.error("Error generating story:", err);
      setError(
        err.message || "The storyteller seems to be napping! Please try again."
      );
      setStory(""); // Clear story on error
    } finally {
      setIsGeneratingStory(false);
    }
  };

  // --- Audio: Read Story Handler ---
  const handleReadStory = async () => {
    if (!story) return;
    setIsReadingStory(true);
    try {
      const encodedStory = encodeURIComponent(story);
      // Log the story being sent to the TTS service
      console.log("[Read Story] Text sent to TTS:", story);

      // You can change the voice: alloy, echo, fable, onyx, nova, shimmer
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

      // --- Play background music at a lower volume ---
      const bgMusicUrl =
        "https://cdn.pixabay.com/download/audio/2025/06/20/audio_f144ebba0c.mp3?filename=babies-piano-45-seconds-362933.mp3";
      const bgAudio = new Audio(bgMusicUrl);
      bgAudio.loop = true;
      bgAudio.volume = 0.1; // Lower volume (0.0 - 1.0)
      bgAudio.play().catch(() => {});

      audioRef.current = audio;
      audio.play();

      audio.onended = () => {
        setTimeout(() => {
          bgAudio.pause();
          bgAudio.currentTime = 0;
        }, 2000); // Stop background music 2 seconds after story ends
        setIsReadingStory(false);
        URL.revokeObjectURL(audioUrl);
      };
      audio.onerror = () => {
        setIsReadingStory(false);
        setError("Could not play the story audio.");
        bgAudio.pause();
        bgAudio.currentTime = 0;
        URL.revokeObjectURL(audioUrl);
      };
    } catch (err) {
      setError("Could not generate audio for the story.");
      setIsReadingStory(false);
    }
  };

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
    };
  }, []);

  // --- Webcam Stream Management ---
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
    // eslint-disable-next-line
  }, [showWebcam]);

  // --- API Key Check UI ---
  if (!GeminiServiceAPI.getApiKey()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md text-center">
          <div className="text-red-500 mb-4">
            <Camera size={48} className="mx-auto" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            API Key Required
          </h2>
          <p className="text-gray-600 mb-6">
            Please configure your Gemini API key in the environment variables to
            use the AI drawing features.
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
    <div
      className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 p-4"
      style={{ fontFamily: "Kalam, cursive, sans-serif" }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="text-center mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              <BookOpen size={20} className="text-purple-600" />
              <span className="text-purple-600 font-semibold">
                Back to Library
              </span>
            </button>
            <div className="text-center flex-1">
              <h1 className="text-4xl md:text-5xl font-bold text-sky-600">
                Sketch-A-Magic AI
              </h1>
              <p className="text-lg text-orange-500 mt-2">
                Draw, get ideas, and create stories with AI!
              </p>
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

        {/* History Thumbnails */}
        {history.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold text-gray-700">
                Your Drawings:
              </span>
            </div>
            <div className="flex overflow-x-auto gap-6 py-2 px-1 bg-white rounded-xl shadow-inner border border-gray-200">
              {history.map((item, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <div
                    className={`relative flex-shrink-0 rounded-full border-4 cursor-pointer transition-transform duration-150
                      ${
                        selectedHistoryIndex === idx
                          ? "border-sky-500 scale-110"
                          : "border-gray-200 hover:border-purple-400 hover:scale-105"
                      }
                    `}
                    style={{
                      width: 64,
                      height: 64,
                      minWidth: 64,
                      minHeight: 64,
                      background: "#f9fafb",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    onClick={() => {
                      setSelectedHistoryIndex(idx);
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
                            ctx.drawImage(
                              sketchImg,
                              0,
                              0,
                              canvas.width,
                              canvas.height
                            );
                          }
                        }
                      };
                      sketchImg.src = "data:image/png;base64," + item.sketch;

                      // Draw generated to coloringCanvas
                      const genImg = new window.Image();
                      genImg.onload = () => {
                        const canvas = coloringCanvasRef.current;
                        if (canvas) {
                          resizeColoringCanvas(); // <-- Add this line
                          const ctx = canvas.getContext("2d");
                          if (ctx) {
                            ctx.clearRect(0, 0, canvas.width, canvas.height);
                            ctx.drawImage(
                              genImg,
                              0,
                              0,
                              canvas.width,
                              canvas.height
                            );
                          }
                        }
                      };
                      genImg.src = "data:image/png;base64," + item.generated;
                    }}
                    title={item.recognizedImage || "Drawing"}
                  >
                    <img
                      src={"data:image/png;base64," + item.sketch}
                      alt="sketch"
                      className="w-full h-full object-contain rounded-full"
                    />
                    <button
                      className="absolute top-0 right-0 bg-white rounded-full p-1 shadow hover:bg-red-100"
                      style={{ transform: "translate(40%,-40%)" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setHistory((prev) => prev.filter((_, i) => i !== idx));
                        if (selectedHistoryIndex === idx) {
                          handleClearAll();
                          setSelectedHistoryIndex(null);
                        } else if (
                          selectedHistoryIndex !== null &&
                          idx < selectedHistoryIndex
                        ) {
                          setSelectedHistoryIndex(selectedHistoryIndex - 1);
                        }
                      }}
                      aria-label="Delete"
                    >
                      <svg
                        width="16"
                        height="16"
                        fill="none"
                        stroke="red"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                  {/* Numbered circle below thumbnail */}
                  <div
                    className="mt-2 w-6 h-6 flex items-center justify-center rounded-full border-2 border-sky-400 bg-white text-sky-700 font-bold text-sm"
                    style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}
                  >
                    {idx + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 bg-white p-4 rounded-3xl shadow-lg border-4 border-dashed border-blue-600">
          {/* Drawing Canvas Section */}

          <div className="flex flex-col items-center">
            <h2 className="text-2xl font-bold mb-2 text-gray-700 flex items-center gap-2">
              <Palette size={24} className="text-purple-600" />
              1. Draw Here
              <button
                onClick={() => setShowWebcam(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full text-xl shadow-md transform hover:scale-105 transition-all duration-200 ease-in-out"
              >
                <span className="flex items-center gap-2">
                  <Camera size={20} />
                  Draw on Paper
                </span>
              </button>
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
              <div className="text-center animate__animated animate__fadeIn">
                <div className="mt-2 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-white rounded-lg p-4 text-lg font-bold shadow-lg max-w-2xl mx-auto transform hover:scale-105 transition-transform duration-200">
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
              2. See & Color the Secret Drawing
            </h2>
            <div className="relative w-full aspect-square bg-gray-100 rounded-2xl shadow-inner border-2 border-gray-200 flex items-center justify-center overflow-hidden">
              {isGenerating && (
                <div className="absolute z-10 flex flex-col items-center">
                  <Loader
                    size={48}
                    className="animate-spin text-pink-500 mb-4"
                  />
                  <p className="text-gray-600 font-semibold">
                    Creating magic...
                  </p>
                </div>
              )}

              {/* Coloring Canvas */}
              <canvas
                ref={coloringCanvasRef}
                className={`w-full h-full rounded-2xl ${
                  hasGeneratedContent ? "block cursor-crosshair" : "hidden"
                }`}
                onClick={handleColoringClick}
                onTouchStart={handleColoringClick}
              ></canvas>

              {/* Color Indicator Circle (bottom right) */}
              {hasGeneratedContent && (
                <div
                  className="absolute"
                  style={{
                    right: 24,
                    bottom: 24,
                    zIndex: 10,
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-full border-4 border-white shadow-lg flex items-center justify-center transition-colors duration-200"
                    style={{
                      backgroundColor: selectedColor,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    }}
                    title={`Current color: ${selectedColor}`}
                  />
                </div>
              )}

              {/* Placeholder text when no image is generated and not loading */}
              {!isGenerating && !hasGeneratedContent && (
                <div className="text-center text-gray-500 p-8">
                  <Sparkles size={48} className="mx-auto mb-4 text-gray-400" />
                  <p className="text-lg">
                    Your magical drawing will appear here!
                  </p>
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
                      ${
                        selectedColor === color
                          ? "border-sky-500 border-4"
                          : "border-gray-300"
                      }`}
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
          {/* clear button */}
          <button
            onClick={handleClearAll}
            className=" bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-8 rounded-full text-xl shadow-md transform hover:scale-105 transition-all duration-200 ease-in-out"
          >
            <span className="flex items-center gap-2">
              <RotateCcw size={20} />
              Clear
            </span>
          </button>

          {/* <button
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
          </button> */}

          <button
            onClick={enhanceDrawing}
            disabled={isGenerating || history.length >= 10}
            className={`bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-full text-xl shadow-md transform hover:scale-105 transition-all duration-200 ease-in-out
              disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
              ${history.length >= 10 ? "opacity-50 cursor-not-allowed" : ""}`}
            title={
              history.length >= 10
                ? "Maximum of 10 drawings reached. Delete a thumbnail to create more."
                : undefined
            }
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

          {/* Webcam Button */}
        </div>

        {/* Webcam Modal */}
        {showWebcam && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 shadow-2xl flex flex-col ">
              <video
                ref={webcamVideoRef}
                autoPlay
                playsInline
                width={320}
                height={240}
                className="rounded-lg border mb-4 "
              />
              <div className="flex gap-4">
                <button
                  onClick={async () => {
                    // Capture image from video
                    const video = webcamVideoRef.current;
                    if (!video) return;
                    const canvas = document.createElement("canvas");
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    const ctx = canvas.getContext("2d");
                    if (!ctx) return;
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const dataUrl = canvas.toDataURL("image/png");
                    // --- Resize to 380x380 before sending to Gemini ---
                    const base64Image = await resizeBase64Image(
                      dataUrl.split(",")[1],
                      200
                    );

                    // Immediately set the captured image into the drawing area (sketch canvas)
                    const sketchCanvas = sketchCanvasRef.current;
                    if (sketchCanvas) {
                      const sketchCtx = sketchCanvas.getContext("2d");
                      if (sketchCtx) {
                        // Clear and draw the captured image, scaling to fit the canvas
                        sketchCtx.clearRect(
                          0,
                          0,
                          sketchCanvas.width,
                          sketchCanvas.height
                        );
                        const img = new window.Image();
                        img.onload = () => {
                          sketchCtx.drawImage(
                            img,
                            0,
                            0,
                            sketchCanvas.width,
                            sketchCanvas.height
                          );
                        };
                        img.src = dataUrl;
                      }
                    }

                    // Call Gemini for recognition
                    setIsGenerating(true);
                    setShowWebcam(false);
                    setError(null);
                    try {
                      const descriptionPrompt =
                        "Describe this simple photo in a few detailed keywords related to the subject for an AI image generator. Focus on the main subject and one key feature. For example, 'a smiling sun', 'a round roof house with a tree', 'a cat chasing a ball'. Do not use any introduction, just give the keywords directly. Do not mention any colors.";
                      const descriptionPayload = {
                        contents: [
                          {
                            parts: [
                              { text: descriptionPrompt },
                              {
                                inlineData: {
                                  mimeType: "image/png",
                                  data: base64Image,
                                },
                              },
                            ],
                          },
                        ],
                      };

                      // --- Gemini Token Counting Integration ---
                      const tokenInfo = await countGeminiTokens(
                        descriptionPayload
                      );
                      logGeminiTokenInfo(
                        "Recognized Photo (countTokens)",
                        tokenInfo
                      );

                      const descriptionResult = await callAI(
                        descriptionPayload,
                        "gemini"
                      );
                      logGeminiTokenInfo(
                        "Recognized Photo (generateContent)",
                        null,
                        descriptionResult.usageMetadata
                      );

                      const sketchDescription =
                        descriptionResult.candidates[0].content.parts[0].text.trim();
                      setRecognizedImage(sketchDescription);

                      // Generate coloring book image
                      const imageGenerationPrompt = `A black connected line drawing of: ${sketchDescription} for children's coloring book with no internal colors, on a plain white background.`;
                      // No token count for pollinations (image) API

                      const imageBlob = await callAI(
                        imageGenerationPrompt,
                        "pollinations"
                      );
                      const generatedBase64 = await new Promise<string>(
                        (resolve, reject) => {
                          const reader = new FileReader();
                          reader.onloadend = () =>
                            resolve((reader.result as string).split(",")[1]);
                          reader.onerror = reject;
                          reader.readAsDataURL(imageBlob);
                        }
                      );

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
                            ctx.clearRect(
                              0,
                              0,
                              coloringCanvas.width,
                              coloringCanvas.height
                            );
                            ctx.drawImage(
                              img,
                              0,
                              0,
                              coloringCanvas.width,
                              coloringCanvas.height
                            );
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
                      setSelectedHistoryIndex(
                        history.length >= 10 ? 9 : history.length
                      );
                      setShowStorySection(true);
                    } catch (err: any) {
                      setError(err.message || "Could not process photo.");
                    } finally {
                      setIsGenerating(false);
                    }
                  }}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-lg"
                >
                  Capture & Use
                </button>
                <button
                  onClick={() => {
                    setShowWebcam(false);
                    if (webcamStream) {
                      webcamStream.getTracks().forEach((track) => track.stop());
                      setWebcamStream(null);
                    }
                  }}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

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
                <button
                  className="mt-4 px-6 py-3 bg-sky-500 text-white rounded-lg font-bold shadow hover:bg-sky-600 transition"
                  onClick={handleReadStory}
                  disabled={isReadingStory}
                >
                  {isReadingStory ? (
                    <span className="flex items-center gap-2">
                      <Loader size={20} className="animate-spin" />
                      Reading...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <BookOpen size={20} />
                      Read Story
                    </span>
                  )}
                </button>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
};

export default AIDrawingBook;

// // Example usage of GoogleGenAI (ai) client for Gemini API
// async function main() {
//   const prompt = "Tell me about this image";
//   const media = "./media"; // Your media folder path

//   // Initialize the GoogleGenAI client with your API key
//   const apiKey = await GeminiServiceAPI.getApiKey();
//   if (!apiKey) {
//     throw new Error('Gemini API key is not configured.');
//   }
//   const ai = new GoogleGenAI({ apiKey });

//   // Upload image (this is pseudocode, adjust as needed for your SDK)
//   const organ = await ai.files.upload({
//     file: path.join(media, "organ.jpg"),
//     config: { mimeType: "image/jpeg" },
//   });

//   // Count tokens BEFORE sending
//   const countTokensResponse = await ai.models.countTokens({
//     model: "gemini-2.0-flash",
//     contents: [
//       { role: "user", parts: [
//         { text: prompt },
//         { inlineData: { mimeType: "image/jpeg", data: organ.fileData } }
//       ]}
//     ],
//   });
//   console.log("Tokens before sending:", countTokensResponse.totalTokens);

//   // Generate content
//   const generateResponse = await ai.models.generateContent({
//     model: "gemini-2.0-flash",
//     contents: [
//       { role: "user", parts: [
//         { text: prompt },
//         { inlineData: { mimeType: "image/jpeg", data: organ.data } }
//       ]}
//     ],
//   });
//   // Usage metadata includes tokens used for prompt and response
//   console.log("Usage after response:", generateResponse.usageMetadata);
// }

// main();
