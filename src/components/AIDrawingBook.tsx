import React, { useState } from "react";
import {
  Palette,
  Sparkles,
  RotateCcw,
  BookOpen,
  Wand2,
  Camera,
  Loader,
  Lightbulb,
  Volume2,
  ArrowLeft,
  Zap,
  Edit3,
  Image,
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
  const [activeTab, setActiveTab] = useState<'sketch' | 'magic'>('sketch');
  
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
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600">
                ✨ AI Art Studio
              </h1>
              <p className="text-sm text-purple-600 mt-1 font-medium">
                Draw, Create & Tell Stories with AI Magic!
              </p>
            </div>

            <div className="w-20 sm:w-32"></div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4">
        {/* Error Display */}
        {error && (
          <div className="mb-4 animate__animated animate__fadeIn">
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

        {/* Main Layout */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Left Sidebar - Tools Panel */}
          <div className="lg:w-80 space-y-4">
            {/* Drawing Inspiration */}
            {currentPrompt && (
              <div className="bg-white rounded-2xl shadow-xl border border-blue-200 overflow-hidden animate__animated animate__fadeIn">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3">
                  <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    <Lightbulb size={20} />
                    Drawing Inspiration
                  </h3>
                </div>
                <div className="p-4">
                  <p className="text-gray-700 leading-relaxed">{currentPrompt}</p>
                </div>
              </div>
            )}

            {/* Tools Panel */}
            <div className="bg-white rounded-2xl shadow-xl border border-purple-200 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3">
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                  <Palette size={20} />
                  Tools
                </h3>
              </div>
              
              <div className="p-4 space-y-4">
                {/* Color Palette */}
                <div>
                  <h4 className="text-sm font-bold text-gray-700 mb-3">Colors</h4>
                  <div className="grid grid-cols-6 gap-2">
                    {colors.map((color, index) => (
                      <button
                        key={index}
                        className={`w-8 h-8 rounded-full border-4 shadow-lg transform hover:scale-110 transition-all duration-200 ${
                          selectedColor === color
                            ? "border-gray-800 scale-110"
                            : "border-white hover:border-gray-300"
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={(e) => handleColorSelect(color, e)}
                        title={`Color: ${color}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={getDrawingIdea}
                    disabled={isGettingIdea}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGettingIdea ? (
                      <>
                        <Loader size={20} className="animate-spin" />
                        <span>Thinking...</span>
                      </>
                    ) : (
                      <>
                        <Lightbulb size={20} />
                        <span>Get Idea</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={enhanceDrawing}
                    disabled={isGenerating || history.length >= 10 || showWebcam}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
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
                        <Loader size={20} className="animate-spin" />
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 size={20} />
                        <span>AI Magic</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleClearAll}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  >
                    <RotateCcw size={20} />
                    <span>Clear All</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Main Content Area */}
          <div className="flex-1 space-y-4">
            {/* History Thumbnails */}
            <HistoryThumbnails
              history={history}
              selectedHistoryIndex={selectedHistoryIndex}
              onSelectHistory={handleSelectHistory}
              onDeleteHistory={handleDeleteHistory}
            />

            {/* Tabbed Canvas Interface */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              {/* Tab Navigation */}
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('sketch')}
                  className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-semibold transition-all duration-300 ${
                    activeTab === 'sketch'
                      ? 'bg-purple-500 text-white border-b-2 border-purple-600'
                      : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                  }`}
                >
                  <Edit3 size={20} />
                  <span>Your Sketch</span>
                </button>
                <button
                  onClick={() => setActiveTab('magic')}
                  className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-semibold transition-all duration-300 ${
                    activeTab === 'magic'
                      ? 'bg-green-500 text-white border-b-2 border-green-600'
                      : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                  }`}
                >
                  <Image size={20} />
                  <span>Magic Drawing</span>
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'sketch' && (
                  <div className="space-y-4">
                    {/* Canvas Controls */}
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-gray-800">Draw Your Masterpiece</h3>
                      <button
                        onClick={() => setShowWebcam(true)}
                        disabled={showWebcam}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Camera size={18} />
                        <span className="hidden sm:inline">Take Photo</span>
                      </button>
                    </div>

                    {/* Drawing Canvas */}
                    <div className="relative w-full bg-gray-50 rounded-2xl border-2 border-dashed border-purple-300 overflow-hidden" style={{ aspectRatio: '4/3' }}>
                      <canvas
                        ref={sketchCanvasRef}
                        className={`w-full h-full rounded-2xl cursor-crosshair transition-opacity duration-300 ${
                          showWebcam ? 'opacity-0 pointer-events-none' : 'opacity-100'
                        }`}
                        style={{ 
                          width: '100%', 
                          height: '100%'
                        }}
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
                      <div className="animate__animated animate__fadeIn">
                        <div className="bg-gradient-to-r from-purple-100 to-pink-100 border-2 border-purple-300 text-purple-800 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Wand2 size={20} className="text-purple-600" />
                            <span className="font-bold">AI Vision:</span>
                          </div>
                          <p className="text-lg">{recognizedImage}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'magic' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-gray-800">AI Magic Canvas</h3>
                      {hasGeneratedContent && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">Selected color:</span>
                          <div
                            className="w-8 h-8 rounded-full border-4 border-white shadow-lg"
                            style={{ backgroundColor: selectedColor }}
                          />
                        </div>
                      )}
                    </div>

                    {/* AI Generated Canvas */}
                    <div className="relative w-full bg-gray-50 rounded-2xl border-2 border-dashed border-green-300 overflow-hidden" style={{ aspectRatio: '4/3' }}>
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
                          width: '100%',
                          height: '100%'
                        }}
                        onClick={handleColoringClick}
                        onTouchStart={handleColoringClick}
                      />

                      {!isGenerating && !hasGeneratedContent && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center text-green-400">
                            <Sparkles size={48} className="mx-auto mb-2 opacity-50" />
                            <p className="text-sm font-medium">Your AI artwork will appear here!</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Story Section */}
            {showStorySection && (
              <div className="bg-white rounded-2xl shadow-xl border border-orange-200 overflow-hidden animate__animated animate__fadeInUp">
                <div className="bg-gradient-to-r from-orange-400 to-pink-500 p-4">
                  <h3 className="text-white font-bold text-xl flex items-center gap-2">
                    <BookOpen size={24} />
                    Your Story
                  </h3>
                </div>
                
                <div className="p-6">
                  <div className="flex flex-col sm:flex-row gap-4 items-start mb-4">
                    <button
                      onClick={generateStory}
                      disabled={isGeneratingStory || isTypingStory}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    <div className="bg-gradient-to-br from-orange-50 to-pink-50 rounded-2xl p-6 border-2 border-orange-200">
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIDrawingBook;