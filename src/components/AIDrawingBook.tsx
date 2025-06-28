import React from "react";
import {
  Palette,
  Sparkles,
  RotateCcw,
  BookOpen,
  Wand2,
  Camera,
  Loader,
} from "lucide-react";
import { GeminiService } from "../services/GeminiService";
import { useAIDrawingBookLogic } from "../hooks/useAIDrawingBookLogic";
import ColorPalette from "./ColorPalette";
import HistoryThumbnails from "./HistoryThumbnails";
import WebcamModal from "./WebcamModal";
import "../index.css";

interface AIDrawingBookProps {
  onBack: () => void;
}

const AIDrawingBook: React.FC<AIDrawingBookProps> = ({ onBack }) => {
  const {
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
  } = useAIDrawingBookLogic();

  // API Key Check UI
  if (!GeminiService.getApiKey()) {
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
            <div className="w-32"></div>
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
        <HistoryThumbnails
          history={history}
          selectedHistoryIndex={selectedHistoryIndex}
          onSelectHistory={handleSelectHistory}
          onDeleteHistory={handleDeleteHistory}
        />

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
              {/* Story Image Overlay */}
              {storyImageBase64 && (
                <div
                  className="absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-300"
                  style={{
                    opacity: showStoryImage ? 1 : 0,
                    zIndex: 20,
                  }}
                >
                  <img
                    src={`data:image/png;base64,${storyImageBase64}`}
                    alt="Story Illustration"
                    className={`w-full h-full object-contain${showStoryImage ? " fade-in-image" : ""}`}
                  />
                </div>
              )}

              {/* Coloring Canvas */}
              <canvas
                ref={coloringCanvasRef}
                className={`w-full h-full rounded-2xl ${
                  hasGeneratedContent ? "block cursor-crosshair" : "hidden"
                } transition-opacity duration-700`}
                style={{
                  opacity: showStoryImage ? 0 : 1,
                  zIndex: 10,
                  position: "relative",
                }}
                onClick={handleColoringClick}
                onTouchStart={handleColoringClick}
              ></canvas>

              {/* Color Indicator Circle */}
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

              {/* Placeholder text */}
              {!isGenerating && !hasGeneratedContent && (
                <div className="text-center text-gray-500 p-8">
                  <Sparkles size={48} className="mx-auto mb-4 text-gray-400" />
                  <p className="text-lg">
                    Your magical drawing will appear here!
                  </p>
                </div>
              )}
            </div>

            {/* Color Palette */}
            <ColorPalette
              colors={colors}
              selectedColor={selectedColor}
              onColorSelect={handleColorSelect}
              hasGeneratedContent={hasGeneratedContent}
            />
          </div>
        </main>

        {/* Controls Section */}
        <div className="mt-6 flex flex-wrap justify-center items-center gap-40">
          <button
            onClick={handleClearAll}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-8 rounded-full text-xl shadow-md transform hover:scale-105 transition-all duration-200 ease-in-out"
          >
            <span className="flex items-center gap-2">
              <RotateCcw size={20} />
              Clear
            </span>
          </button>

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
                Idea
              </span>
            )}
          </button>

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
                Surprise Drawing
              </span>
            )}
          </button>
        </div>

        {/* Webcam Modal */}
        <WebcamModal
          showWebcam={showWebcam}
          webcamVideoRef={webcamVideoRef}
          onCapture={handleWebcamCapture}
          onCancel={handleWebcamCancel}
        />

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