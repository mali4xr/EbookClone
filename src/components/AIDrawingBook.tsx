import React from "react";
import {
  Palette,
  Sparkles,
  RotateCcw,
  BookOpen,
  Wand2,
  Camera,
  Loader,
  Lightbulb,
  Play,
  Volume2,
  Trash2,
  Plus,
  ArrowLeft,
  ArrowRight,
  Zap,
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md text-center border border-purple-100">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Camera size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            AI Magic Needs Setup
          </h2>
          <p className="text-gray-600 mb-6 leading-relaxed">
            To unlock the full AI drawing experience, please configure your Gemini API key in the environment variables.
          </p>
          <button
            onClick={onBack}
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 font-semibold shadow-lg"
          >
            Back to Library
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-purple-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-3 px-4 py-2 bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 border border-purple-100"
            >
              <ArrowLeft size={20} className="text-purple-600" />
              <span className="text-purple-600 font-semibold hidden sm:inline">Back to Library</span>
            </button>
            
            <div className="text-center flex-1 mx-4">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600">
                ✨ AI Art Studio
              </h1>
              <p className="text-sm sm:text-base text-purple-600 mt-1 font-medium">
                Draw, Create & Tell Stories with AI Magic!
              </p>
            </div>

            <div className="w-20 sm:w-32"></div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-3 space-y-3">
        {/* AI Prompt Display */}
        {currentPrompt && (
          <div className="animate__animated animate__fadeIn">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl p-3 shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <Lightbulb size={16} className="text-yellow-300" />
                </div>
                <span className="font-bold text-lg">Drawing Inspiration:</span>
              </div>
              <p className="text-lg leading-relaxed">{currentPrompt}</p>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="animate__animated animate__fadeIn">
            <div className="bg-red-50 border-2 border-red-200 text-red-800 rounded-2xl p-3 shadow-md">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-red-200 rounded-full flex items-center justify-center">
                  <span className="text-red-600 text-sm">!</span>
                </div>
                <span className="font-semibold">Oops!</span>
              </div>
              <p className="mt-2">{error}</p>
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

        {/* Story Section */}
        {showStorySection && (
          <section className="animate__animated animate__fadeInUp">
            <div className="bg-white rounded-3xl shadow-xl border border-orange-200 overflow-hidden">
              <div className="bg-gradient-to-r from-orange-400 to-pink-500">
                <h4 className="text-white font-bold text-xl flex items-center gap-2">
                  <BookOpen size={20} />
                  Your Story
                </h4>
              </div>
              
              <div className="p-4">
                <div className="flex flex-col sm:flex-row gap-3 items-start">
                  <button
                    onClick={generateStory}
                    disabled={isGeneratingStory || isTypingStory}
                    className="flex items-center gap-2 px-2 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isGeneratingStory || isTypingStory ? (
                      <>
                        <Loader size={20} className="animate-spin" />
                        {isGeneratingStory ? 'Creating...' : 'Writing...'}
                      </>
                    ) : (
                      <>
                        <Zap size={20} />
                        Create Story
                      </>
                    )}
                  </button>

                  {!isTypingStory && story && (
                    <button
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                      onClick={handleReadStory}
                      disabled={isReadingStory}
                    >
                      {isReadingStory ? (
                        <>
                          <Loader size={20} className="animate-spin" />
                          Reading...
                        </>
                      ) : (
                        <>
                          <Volume2 size={20} />
                          Read Aloud
                        </>
                      )}
                    </button>
                  )}
                </div>

                {(story || displayedStory) && (
                  <div className="bg-gradient-to-br from-orange-50 to-pink-50 rounded-2xl p-4 border-2 border-orange-200">
                    <div className="text-lg leading-relaxed text-gray-800">
                      {isTypingStory ? (
                        <span>
                          {displayedStory}
                          <span className="animate-pulse text-orange-500">|</span>
                        </span>
                      ) : (
                        story
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Main Canvas Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Drawing Canvas */}
          <div className="bg-white rounded-3xl shadow-xl border border-purple-200 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-bold text-xl flex items-center gap-2">
                  <Palette size={24} />
                  Draw Here
                </h3>
                <button
                  onClick={() => setShowWebcam(true)}
                  disabled={showWebcam}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Camera size={18} />
                  <span className="hidden sm:inline">Photo</span>
                </button>
              </div>
            </div>
            
            <div className="p-4">
              <div className="relative aspect-square bg-gray-50 rounded-2xl border-2 border-dashed border-purple-300 overflow-hidden">
                <canvas
                  ref={sketchCanvasRef}
                  className={`w-full h-full rounded-2xl cursor-crosshair transition-opacity duration-300 ${
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
                
                {showWebcam && (
                  <WebcamModal
                    showWebcam={showWebcam}
                    webcamVideoRef={webcamVideoRef}
                    onCapture={handleWebcamCapture}
                    onCancel={handleWebcamCancel}
                  />
                )}

                {!showWebcam && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center text-purple-400">
                      <Palette size={48} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm font-medium">Start drawing your masterpiece!</p>
                    </div>
                  </div>
                )}
              </div>

              {recognizedImage && (
                <div className="mt-3 animate__animated animate__fadeIn">
                  <div className="bg-gradient-to-r from-purple-100 to-pink-100 border-2 border-purple-300 text-purple-800 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Wand2 size={20} className="text-purple-600" />
                      <span className="font-bold">AI Vision:</span>
                    </div>
                    <p className="text-lg">{recognizedImage}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* AI Generated Canvas */}
          <div className="bg-white rounded-3xl shadow-xl border border-green-200 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-blue-500 p-3">
              <h3 className="text-white font-bold text-xl flex items-center gap-2">
                <Wand2 size={24} />
                AI Magic Canvas
              </h3>
            </div>
            
            <div className="p-4">
              <div className="relative aspect-square bg-gray-50 rounded-2xl border-2 border-dashed border-green-300 overflow-hidden">
                <MagicWandAnimation isVisible={isGenerating} />

                {storyImageBase64 && (
                  <div
                    className="absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-1000 z-20"
                    style={{ opacity: showStoryImage ? 1 : 0 }}
                  >
                    <img
                      src={`data:image/png;base64,${storyImageBase64}`}
                      alt="Story Illustration"
                      className={`w-full h-full object-contain rounded-2xl ${showStoryImage ? "slow-fade-animation" : ""}`}
                    />
                  </div>
                )}

                <canvas
                  ref={coloringCanvasRef}
                  className={`w-full h-full rounded-2xl transition-opacity duration-1000 ${
                    hasGeneratedContent ? "block cursor-crosshair" : "hidden"
                  }`}
                  style={{
                    opacity: showStoryImage ? 0 : 1,
                    zIndex: 10,
                    position: "relative",
                  }}
                  onClick={handleColoringClick}
                  onTouchStart={handleColoringClick}
                />

                {hasGeneratedContent && (
                  <div className="absolute bottom-4 right-4 z-30">
                    <div
                      className="w-12 h-12 rounded-full border-4 border-white shadow-xl flex items-center justify-center transition-colors duration-200"
                      style={{ backgroundColor: selectedColor }}
                      title={`Current color: ${selectedColor}`}
                    />
                  </div>
                )}

                {!isGenerating && !hasGeneratedContent && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-green-400">
                      <Sparkles size={48} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm font-medium">Your AI artwork will appear here!</p>
                    </div>
                  </div>
                )}
              </div>

              <ColorPalette
                colors={colors}
                selectedColor={selectedColor}
                onColorSelect={handleColorSelect}
                hasGeneratedContent={hasGeneratedContent}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={getDrawingIdea}
            disabled={isGettingIdea}
            className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isGettingIdea ? (
              <>
                <Loader size={24} className="animate-spin" />
                <span className="hidden sm:inline">Thinking...</span>
              </>
            ) : (
              <>
                <Lightbulb size={24} />
                <span>Get Idea</span>
              </>
            )}
          </button>

          <button
            onClick={enhanceDrawing}
            disabled={isGenerating || history.length >= 10 || showWebcam}
            className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-green-500 to-blue-500 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            title={
              history.length >= 10
                ? "Maximum of 10 drawings reached. Delete a thumbnail to create more."
                : showWebcam
                ? "Close camera first"
                : undefined
            }
          >
            {isGenerating ? (
              <>
                <Loader size={24} className="animate-spin" />
                <span className="hidden sm:inline">Creating...</span>
              </>
            ) : (
              <>
                <Wand2 size={24} />
                <span>AI Magic</span>
              </>
            )}
          </button>

          <button
            onClick={handleClearAll}
            className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <RotateCcw size={24} />
            <span>Clear All</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIDrawingBook;