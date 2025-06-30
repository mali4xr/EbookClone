import React from "react";
import {
  Palette,
  Sparkles,
  RotateCcw,
  BookOpen,
  Wand2,
  Camera,
  Loader,
  MessageCircle,
  Settings,
  X,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
} from "lucide-react";
import { GeminiService } from "../services/GeminiService";
import { ElevenLabsService } from "../services/ElevenLabsService";
import { useConversationalAI } from "../hooks/useConversationalAI";
import { useAIDrawingBookLogic } from "../hooks/useAIDrawingBookLogic";
import ColorPalette from "./ColorPalette";
import HistoryThumbnails from "./HistoryThumbnails";
import WebcamModal from "./WebcamModal";
import MagicWandAnimation from "./MagicWandAnimation";
import ConversationalAIButton from "./ConversationalAIButton";
import "../index.css";

interface AIDrawingBookProps {
  onBack: () => void;
}

const AIDrawingBook: React.FC<AIDrawingBookProps> = ({ onBack }) => {
  // AI Chat and Settings State
  const [showAIChat, setShowAIChat] = React.useState(false);
  const [showSettings, setShowSettings] = React.useState(false);
  const [storytellerType, setStorytellerType] = React.useState<'pollinations' | 'elevenlabs'>('pollinations');
  const [conversationStarted, setConversationStarted] = React.useState(false);
  const [lastIdeaShared, setLastIdeaShared] = React.useState<string>('');

  // ElevenLabs Conversational AI
  const {
    isConnected,
    isConnecting,
    currentMode,
    error: aiError,
    startConversation,
    endConversation,
    conversation
  } = useConversationalAI();
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

  // Start AI conversation with initial context
  const handleStartAIChat = async () => {
    if (!ElevenLabsService.isConfigured()) {
      console.error('ElevenLabs not configured');
      return;
    }

    try {
      await startConversation({
        agentId: ElevenLabsService.getAgentId(),
        onConnect: () => {
          console.log('AI Drawing Assistant connected');
          setConversationStarted(true);
          // Send initial context message (won't appear in UI)
          sendContextMessage();
        },
        onDisconnect: () => {
          console.log('AI Drawing Assistant disconnected');
          setConversationStarted(false);
        },
        onMessage: (message) => {
          console.log('AI Drawing Message:', message);
          // Messages are handled by the AI but don't appear in our UI
        },
        onError: (error) => {
          console.error('AI Drawing Error:', error);
        }
      });
      setShowAIChat(true);
    } catch (error) {
      console.error('Failed to start AI conversation:', error);
    }
  };

  // Send context message to AI (invisible to user)
  const sendContextMessage = () => {
    if (!conversation) return;

    const contextMessage = `You are a creative AI assistant helping children with drawing and storytelling in the Sketch-A-Magic AI app. 

Current State:
- Has drawing: ${hasGeneratedContent ? 'Yes' : 'No'}
- Current prompt: "${currentPrompt || 'None'}"
- Recognized image: "${recognizedImage || 'None'}"
- Story created: ${story ? 'Yes' : 'No'}
- History items: ${history.length}

Your Role:
- Help with drawing ideas and creative inspiration
- Explain what the AI recognized in their drawings
- Suggest improvements or variations for their artwork
- Help with storytelling and creative writing
- Encourage creativity and artistic expression
- Answer questions about colors, shapes, and art techniques
- Make the drawing experience fun and educational

Be encouraging, creative, and use simple language appropriate for children.
Focus on fostering creativity and imagination.

Please start by giving a fun drawing idea for a child.`;

    // This message provides context but won't appear in the chat UI
    console.log('Sending context to AI:', contextMessage);
  };

  // Handle Get Idea button click - share idea with AI
  const handleGetIdeaWithAI = async () => {
    await getDrawingIdea();
    
    // If AI is connected and we have a new idea, share it
    if (isConnected && currentPrompt && currentPrompt !== lastIdeaShared) {
      setLastIdeaShared(currentPrompt);
      console.log('Sharing drawing idea with AI:', currentPrompt);
      // The AI will receive this context and can elaborate on the idea
    }
  };

  // Disconnect from AI
  const handleDisconnectAI = async () => {
    try {
      if (conversation) {
        await conversation.endSession();
      }
      await endConversation();
      setShowAIChat(false);
      setConversationStarted(false);
    } catch (error) {
      console.error('Error disconnecting AI:', error);
    }
  };

  const handleReadStoryWithSettings = () => {
    handleReadStory(storytellerType);
  };

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
    <>
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
            <div className="flex items-center gap-2">
              {/* Settings Button */}
              <button
                onClick={() => setShowSettings(true)}
                className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                title="Settings"
              >
                <Settings size={20} className="text-gray-600" />
              </button>
              
              {/* AI Chat Button */}
              <button
                onClick={() => setShowAIChat(!showAIChat)}
                className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                title="AI Assistant"
              >
                <MessageCircle size={20} />
                <span className="hidden sm:inline">AI Helper</span>
              </button>
            </div>
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

        {/* Story Section - Moved here, below history */}
        {showStorySection && (
          <section className="w-full mx-auto animate__animated animate__fadeInUp mb-6">
            <div className="flex items-center gap-2"> 
            <div className="text-center ">
              <button
                onClick={generateStory}
                disabled={isGeneratingStory || isTypingStory}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-full text-xl shadow-md transform hover:scale-105 transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isGeneratingStory || isTypingStory ? (
                  <span className="flex items-center  gap-2">
                    <Loader size={20} className="animate-spin" />
                    {isGeneratingStory ? 'Creating...' : 'Writing...'}
                  </span>
                ) : (
                  <div > Create Story </div>
                )}
              </button>
            </div>

            {(story || displayedStory) && (
              <div className="bg-orange-100 border-2 border-orange-300 text-orange-900 rounded-lg p-2 text-lg shadow-inner animate__animated animate__fadeIn">
                
                <div className="flex items-center gap-2"> 
                {/* Only show read button when story is fully typed and not currently typing */}
                {!isTypingStory && story && (
                  <button
                    className="px-2 py-2 bg-sky-500 text-white rounded-lg font-bold shadow hover:bg-sky-600 transition animate__animated animate__bounceIn"
                    onClick={handleReadStoryWithSettings}
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
                        Read
                      </span>
                    )}
                  </button>
                )}
                  
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
                
              </div>
            
            )}
               </div>
          </section>
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
                disabled={showWebcam}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full text-xl shadow-md transform hover:scale-105 transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <span className="flex items-center gap-2">
                  <Camera size={20} />
                  Draw on Paper 
                </span>
              </button>
            </h2>
            
            {/* Canvas Container with Webcam Integration */}
            <div className="relative w-full aspect-square bg-white rounded-2xl shadow-inner border-2 border-gray-200 overflow-hidden">
              {/* Drawing Canvas */}
              <canvas
                ref={sketchCanvasRef}
                className={`w-full h-full rounded-2xl cursor-default transition-opacity duration-300 ${
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
            </div>

            {/* Recognized Image Label */}
            {recognizedImage && (
              <div className="text-center animate__animated animate__fadeIn mt-4">
                <div className="bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-white rounded-lg p-4 text-lg font-bold shadow-lg mx-auto transform hover:scale-105 transition-transform duration-200">
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
            <h2 className="text-2xl font-bold text-gray-700 flex items-center gap-2 mb-2">
              <Wand2 size={24} className="text-pink-600" />
              2. See & Color the Secret Drawing
            </h2>
            <div className="relative w-full aspect-square bg-gray-100 rounded-2xl shadow-inner border-2 border-gray-200 flex items-center justify-center overflow-hidden">
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
                className={`w-full h-full rounded-2xl ${
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
            disabled={isGenerating || history.length >= 10 || showWebcam}
            className={`bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-full text-xl shadow-md transform hover:scale-105 transition-all duration-200 ease-in-out
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
      </div>
    </div>

      {/* AI Chat Panel */}
      {showAIChat && (
        <div className="fixed bottom-4 right-4 w-80 h-96 bg-white rounded-xl shadow-2xl border-4 border-purple-300 z-50 flex flex-col animate__animated animate__slideInRight">
          <div className="flex items-center justify-between p-3 border-b bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-xl">
            <div className="flex items-center gap-2">
              <MessageCircle size={16} />
              <span className="font-bold text-sm">AI Drawing Assistant</span>
            </div>
            <button
              onClick={() => setShowAIChat(false)}
              className="p-1 rounded-full hover:bg-white/20 transition-colors"
              title="Close AI assistant"
            >
              <X size={16} />
            </button>
          </div>
          
          <div className="flex-1 min-h-0">
            <ConversationalAIButton
              context={getAIDrawingAIContext()}
              onMessage={handleAIMessage}
              initialShowChat={true}
              className="h-full"
            />
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed bottom-4 left-4 w-80 h-96 bg-white rounded-xl shadow-2xl border-4 border-gray-300 z-50 flex flex-col animate__animated animate__slideInLeft">
          <div className="flex items-center justify-between p-3 border-b bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-t-xl">
            <h2 className="text-sm font-bold text-gray-800">Drawing Settings</h2>
            <button 
              onClick={() => setShowSettings(false)}
              className="p-1 rounded-full hover:bg-white/20 transition-colors"
              title="Close settings"
            >
              <X size={16} />
            </button>
          </div>
            
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Storyteller Selection */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <BookOpen size={16} className="text-purple-600" />
                  Story Narrator
                </h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 p-2 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="storyteller"
                      value="pollinations"
                      checked={storytellerType === 'pollinations'}
                      onChange={(e) => setStorytellerType(e.target.value as 'pollinations' | 'elevenlabs')}
                      className="w-3 h-3 text-purple-600"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-800">Pollinations AI</div>
                      <div className="text-xs text-gray-600">Default storyteller</div>
                    </div>
                  </label>
                  
                  <label className="flex items-center gap-2 p-2 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="storyteller"
                      value="elevenlabs"
                      checked={storytellerType === 'elevenlabs'}
                      onChange={(e) => setStorytellerType(e.target.value as 'pollinations' | 'elevenlabs')}
                      className="w-3 h-3 text-purple-600"
                      disabled={!ElevenLabsService.getApiKey()}
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-800">ElevenLabs AI</div>
                      <div className="text-xs text-gray-600">
                        {ElevenLabsService.getApiKey() 
                          ? 'High-quality voice' 
                          : 'Requires API key configuration'
                        }
                      </div>
                    </div>
                  </label>
                </div>
                
                {!ElevenLabsService.getApiKey() && (
                  <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-amber-800 text-xs">
                      <strong>Note:</strong> To use ElevenLabs AI storyteller, configure your API key in the environment variables.
                    </p>
                  </div>
                )}
              </div>

              {/* AI Assistant Info */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <MessageCircle size={16} className="text-purple-600" />
                  AI Assistant
                </h3>
                <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-800 text-xs">
                    The AI assistant can help with drawing ideas, explain recognized images, 
                    suggest improvements, and provide creative inspiration throughout your artistic journey.
                  </p>
                </div>
                {aiMessages.length > 0 && (
                  <div className="p-2 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-800 text-xs font-medium">
                      Recent AI messages: {aiMessages.length}
                    </p>
                  </div>
                )}
              </div>
          </div>
            
          <div className="p-3 border-t flex justify-end">
              <button
                onClick={() => setShowSettings(false)}
                className="px-3 py-1 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 transition-colors"
              >
                Done
              </button>
            </div>
        </div>
      )}
    </>
  );
};

export default AIDrawingBook;