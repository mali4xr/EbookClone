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
import MagicWandAnimation from "./MagicWandAnimation";
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
      className="h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 p-2 overflow-hidden flex flex-col"
      style={{ fontFamily: "Kalam, cursive, sans-serif" }}
    >
      <div className="max-w-7xl mx-auto flex-1 flex flex-col min-h-0">
        {/* Header */}
        <header className="text-center mb-1 flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={onBack}
              className="flex items-center gap-1 px-2 py-1 bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              <BookOpen size={16} className="text-purple-600" />
              <span className="text-purple-600 font-semibold text-sm">
                Back to Library
              </span>
            </button>
            <div className="text-center flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-sky-600">
                Sketch-A-Magic AI
              </h1>
              <p className="text-sm text-orange-500 mt-1">
                Draw, get ideas, and create stories with AI!
              </p>
            </div>
            <div className="w-20"></div>
          </div>
        </header>

        {/* AI Prompt Display */}
        {currentPrompt && (
          <div className="text-center mb-1 animate__animated animate__fadeIn flex-shrink-0">
            <div className="bg-sky-100 border-2 border-sky-300 text-sky-800 rounded-lg p-2 text-sm shadow-md max-w-2xl mx-auto">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Sparkles size={16} className="text-sky-600" />
                <span className="font-semibold">Drawing Idea:</span>
              </div>
              {currentPrompt}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="text-center mb-1 animate__animated animate__fadeIn flex-shrink-0">
            <div className="bg-red-100 border-2 border-red-300 text-red-800 rounded-lg p-2 text-sm shadow-md max-w-2xl mx-auto">
              {error}
            </div>
          </div>
        )}

        {/* History Thumbnails - Fixed height to prevent layout shift */}
        {history.length > 0 && (
          <div className="mb-1 flex-shrink-0" style={{ height: '60px' }}>
            <HistoryThumbnails
              history={history}
              selectedHistoryIndex={selectedHistoryIndex}
              onSelectHistory={handleSelectHistory}
              onDeleteHistory={handleDeleteHistory}
            />
          </div>
        )}

        {/* Story Section - Moved here, below history */}
        {showStorySection && (
          <section className="w-full mx-auto animate__animated animate__fadeInUp mb-1 flex-shrink-0">
            <div className="flex items-start gap-3"> 
            {/* Vertical Button Stack */}
            <div className="flex flex-col gap-2">
              <button
                onClick={generateStory}
                disabled={isGeneratingStory || isTypingStory}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg text-sm shadow-md transform hover:scale-105 transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none min-w-[100px]"
              >
                {isGeneratingStory || isTypingStory ? (
                  <span className="flex items-center  gap-2">
                    <Loader size={16} className="animate-spin" />
                    {isGeneratingStory ? 'Creating...' : 'Writing...'}
                  </span>
                ) : (
                  <div > Create Story </div>
                )}
              </button>
              
              {/* Read button - only show when story is fully typed and not currently typing */}
              {!isTypingStory && story && (
                <button
                  className="px-4 py-2 bg-sky-500 text-white rounded-lg font-bold shadow hover:bg-sky-600 transition animate__animated animate__bounceIn text-sm min-w-[100px]"
                  onClick={handleReadStory}
                  disabled={isReadingStory}
                >
                  {isReadingStory ? (
                    <span className="flex items-center gap-2">
                      <Loader size={14} className="animate-spin" />
                      Reading...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <BookOpen size={14} />
                      Read
                    </span>
                  )}
                </button>
              )}
            </div>

            {(story || displayedStory) && (
              <div className="bg-orange-100 border-2 border-orange-300 text-orange-900 rounded-lg p-3 text-sm shadow-inner animate__animated animate__fadeIn flex-1">
                <div className="leading-relaxed">
                  {isTypingStory ? (
                    <span>
                      {displayedStory}
                      <span className="animate-pulse">|</span>
                    </span>
                  ) : (
                    story
                  )}
                </div>
              </div>
            )}
            </div>
          </section>
        )}

        {/* Main Content */}
        <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-2 bg-white p-2 rounded-2xl shadow-lg border-4 border-dashed border-blue-600 min-h-0 ">
          {/* Drawing Canvas Section */}
          <div className="flex flex-col items-center min-h-0">
            <h2 className="text-base font-bold mb-1 text-gray-700 flex items-center gap-2 flex-shrink-0">
              <Palette size={16} className="text-purple-600" />
              1. Draw Here
              <button
                onClick={() => setShowWebcam(true)}
                disabled={showWebcam}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-2 rounded-full text-xs shadow-md transform hover:scale-105 transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ml-2"
              >
                <span className="flex items-center gap-2">
                  <Camera size={12} />
                  <span className="hidden sm:inline">Draw on Paper</span>
                  <span className="sm:hidden">Photo</span>
                </span>
              </button>
            </h2>
            
            {/* Canvas Container with Webcam Integration */}
            <div className="relative w-full flex-1 bg-white rounded-xl shadow-inner border-2 border-gray-200 overflow-hidden min-h-0">
              {/* Drawing Canvas */}
              <canvas
                ref={sketchCanvasRef}
                className={`w-full h-full rounded-xl cursor-default transition-opacity duration-300 ${
                  showWebcam ? 'opacity-0 pointer-events-none' : 'opacity-100'
                }`}
                onMouseDown={startDrawing}
                onMouseMove={drawSketch}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={drawSketch}
                onTouchEnd={stopDrawing}
              />
              
              {/* Webcam Modal - Integrated into canvas area */}
              {showWebcam && (
                <WebcamModal
                  showWebcam={showWebcam}
                  webcamVideoRef={webcamVideoRef}
                  onCapture={handleWebcamCapture}
                  onCancel={handleWebcamCancel}
                />
              )}
              
              {/* Recognized Image Label - Top Right */}
              {recognizedImage && (
                <div className="absolute top-1 right-1 animate__animated animate__fadeIn">
                  <div className="bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-white rounded text-xs font-bold shadow-lg transform hover:scale-105 transition-transform duration-200 px-1 py-0.5">
                    <div className="flex items-center gap-1">
                      <Wand2 size={10} className="text-yellow-200" />
                      <span>{recognizedImage}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* AI Generated Image & Coloring Section with Vertical Color Palette */}
          <div className="flex flex-col items-center min-h-0">
            <h2 className="text-base font-bold text-gray-700 flex items-center gap-2 mb-1 flex-shrink-0">
              <Wand2 size={16} className="text-pink-600" />
              2. See & Color the Secret Drawing
            </h2>
            
            <div className="flex gap-1 flex-1 w-full min-h-0">
              {/* Main Canvas Area */}
              <div className="relative flex-1 bg-gray-100 rounded-xl shadow-inner border-2 border-gray-200 flex items-center justify-center overflow-hidden min-h-0">
                {/* Magic Wand Animation - shows during generation */}
                <MagicWandAnimation isVisible={isGenerating} />

                {/* Story Image Overlay with slower transition */}
                {storyImageBase64 && (
                  <div
                    className="absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-1000"
                    style={{
                      opacity: showStoryImage ? 1 : 0,
                      zIndex: 20,
                    }}
                  >
                    <img
                      src={`data:image/png;base64,${storyImageBase64}`}
                      alt="Story Illustration"
                      className={`w-full h-full object-contain ${showStoryImage ? "slow-fade-animation" : ""}`}
                    />
                  </div>
                )}

                {/* Coloring Canvas */}
                <canvas
                  ref={coloringCanvasRef}
                  className={`w-full h-full rounded-xl ${
                    hasGeneratedContent ? "block cursor-crosshair" : "hidden"
                  } transition-opacity duration-1000`}
                  style={{
                    opacity: showStoryImage ? 0 : 1,
                    zIndex: 10,
                    position: "relative",
                  }}
                  onClick={handleColoringClick}
                  onTouchStart={handleColoringClick}
                ></canvas>

                {/* Placeholder text */}
                {!isGenerating && !hasGeneratedContent && (
                  <div className="text-center text-gray-500 p-2">
                    <Sparkles size={24} className="mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">
                      Your magical drawing will appear here!
                    </p>
                  </div>
                )}
              </div>

              {/* Vertical Color Palette */}
              {hasGeneratedContent && (
                <div className="flex flex-col gap-1 p-1 bg-white rounded-lg shadow-md border border-gray-200 flex-shrink-0">
                  {colors.map((color, index) => (
                    <div
                      key={index}
                      className={`w-6 h-6 rounded-full border-2 cursor-pointer shadow-sm transform hover:scale-110 transition-transform duration-150 ${
                        selectedColor === color
                          ? "border-sky-500 border-3"
                          : "border-gray-300"
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={(e) => handleColorSelect(color, e)}
                      title={`Color: ${color}`}
                    ></div>
                  ))}
                  
                  {/* Current Color Indicator */}
                  <div className="mt-1 pt-1 border-t border-gray-200">
                    <div
                      className="w-6 h-6 rounded-full border-2 border-white shadow-md mx-auto"
                      style={{
                        backgroundColor: selectedColor,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                      }}
                      title={`Selected: ${selectedColor}`}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Controls Section */}
        <div className="mt-1 flex flex-wrap justify-center items-center gap-2 flex-shrink-0">
          <button
            onClick={handleClearAll}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded-full text-xs shadow-md transform hover:scale-105 transition-all duration-200 ease-in-out"
          >
            <span className="flex items-center gap-2">
              <RotateCcw size={14} />
              <span className="hidden sm:inline">Clear</span>
            </span>
          </button>

          <button
            onClick={getDrawingIdea}
            disabled={isGettingIdea}
            className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-1 px-3 rounded-full text-xs shadow-md transform hover:scale-105 transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isGettingIdea ? (
              <span className="flex items-center gap-2">
                <Loader size={14} className="animate-spin" />
                <span className="hidden sm:inline">Thinking...</span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles size={14} />
                <span className="hidden sm:inline">Idea</span>
              </span>
            )}
          </button>

          <button
            onClick={enhanceDrawing}
            disabled={isGenerating || history.length >= 10 || showWebcam}
            className={`bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-3 rounded-full text-xs shadow-md transform hover:scale-105 transition-all duration-200 ease-in-out
              disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
              ${history.length >= 10 ? "opacity-50 cursor-not-allowed" : ""}`}
            title={
              history.length >= 10
                ? "Maximum of 10 drawings reached. Delete a thumbnail to create more."
                : showWebcam
                ? "Close camera first"
                : undefined
            }
          >
            {isGenerating ? (
              <span className="flex items-center gap-2">
                <Loader size={14} className="animate-spin" />
                <span className="hidden sm:inline">Creating...</span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Wand2 size={14} />
                <span className="hidden sm:inline">Surprise Drawing</span>
                <span className="sm:hidden">Draw</span>
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIDrawingBook;