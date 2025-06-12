import React, { useState, useEffect } from 'react';
import { Mic, MicOff, MessageCircle, X, Send, Wifi, WifiOff, Volume2, User, Bot, Loader, AlertTriangle } from 'lucide-react';
import { useConversationalAI } from '../hooks/useConversationalAI';
import { ElevenLabsService } from '../services/ElevenLabsService';

interface ConversationalAIButtonProps {
  context?: string;
  onMessage?: (message: any) => void;
  className?: string;
  initialShowChat?: boolean;
}

const ConversationalAIButton = ({ 
  context = '',
  onMessage,
  className = '',
  initialShowChat = false
}: ConversationalAIButtonProps) => {
  const [showChat, setShowChat] = useState(initialShowChat);
  const [inputMessage, setInputMessage] = useState('');
  const [inputVolumeLevel, setInputVolumeLevel] = useState(0);

  const {
    isConnected,
    isConnecting,
    currentMode,
    messages,
    error,
    startConversation,
    endConversation,
    setVolume,
    getInputVolume
  } = useConversationalAI();

  useEffect(() => {
    let volumeInterval: any;
    if (isConnected) {
      volumeInterval = setInterval(async () => {
        const vol = await getInputVolume();
        setInputVolumeLevel(vol);
      }, 100);
    }
    return () => clearInterval(volumeInterval);
  }, [isConnected, getInputVolume]);

  const handleStartConversation = async () => {
    try {
      if (!ElevenLabsService.isConfigured()) {
        console.error('ElevenLabs not configured. Please check your environment variables.');
        return;
      }
      const options = ElevenLabsService.getConnectionOptions(context, (message: any) => {
        console.log('AI Message:', message);
        onMessage?.(message);
      });

      if (ElevenLabsService.useSignedUrl()) {
        const response = await fetch(ElevenLabsService.getSignedUrlEndpoint());
        if (!response.ok) {
          throw new Error('Failed to get signed URL');
        }
        const signedUrl = await response.text();
        options.signedUrl = signedUrl;
      }

      await startConversation(options);
    } catch (err: any) {
      console.error('Failed to start conversation:', err);
    }
  };

  const handleEndConversation = async () => {
    try {
      await endConversation();
      setInputVolumeLevel(0); // Reset volume level when disconnected
    } catch (err: any) {
      console.error('Failed to end conversation:', err);
    }
  };

  const handleSendMessage = async () => {
    if (inputMessage.trim()) {
      await startConversation({ userMessage: inputMessage });
      setInputMessage('');
    }
  };

  const getStatusIcon = () => {
    if (isConnecting) {
      return <Loader size={14} className="animate-spin text-yellow-600" />;
    }
    if (isConnected) {
      return <Wifi size={14} className="text-green-600" />;
    }
    return <WifiOff size={14} className="text-red-600" />;
  };

  const getStatusText = () => {
    if (isConnecting) return 'Connecting...';
    if (isConnected) return 'Connected';
    return 'Disconnected';
  };

  const getModeIcon = () => {
    if (isConnecting) {
      return <Loader size={20} className="animate-spin" />;
    }
    if (isConnected) {
      return currentMode === 'speaking' ? <Volume2 size={20} /> : <Mic size={20} />;
    }
    return <MessageCircle size={20} />;
  };

  const getButtonColor = () => {
    if (!ElevenLabsService.isConfigured()) {
      return 'bg-orange-500 hover:bg-orange-600';
    }
    if (isConnected) {
      return currentMode === 'speaking' 
        ? 'bg-red-500 hover:bg-red-600' 
        : 'bg-green-500 hover:bg-green-600';
    }
    return 'bg-blue-500 hover:bg-blue-600';
  };

  const getModeText = () => {
    if (!ElevenLabsService.isConfigured()) return 'Setup Required';
    if (isConnecting) return 'Connecting...';
    if (isConnected) {
      return currentMode === 'speaking' ? 'AI Speaking' : 'Listening';
    }
    return 'Start Chat';
  };

  return (
    <div className={`relative ${className}`}>
      {/* Main AI Button */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowChat(!showChat)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-all duration-300 transform hover:scale-105 ${getButtonColor()}`}
        >
          {!ElevenLabsService.isConfigured() ? (
            <AlertTriangle size={20} />
          ) : (
            getModeIcon()
          )}
          <span className="hidden sm:inline">AI Helper</span>
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="absolute top-full left-0 mt-2 p-2 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm max-w-xs animate__animated animate__fadeIn z-50">
          {error}
        </div>
      )}

      {/* Enhanced Chat Panel */}
      {showChat && (
        <div className={`${className?.includes('h-full') ? 'h-full' : 'fixed inset-4 md:absolute md:top-full md:left-0 md:mt-2 md:inset-auto md:w-96 md:h-[500px]'} bg-white ${className?.includes('h-full') ? '' : 'border border-gray-300 rounded-xl shadow-2xl z-50'} flex flex-col animate__animated animate__fadeInUp`}>
          {/* Header */}
          <div className={`flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-500 to-purple-600 text-white ${className?.includes('h-full') ? '' : 'rounded-t-xl'}`}>
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-2 py-1 rounded-full ${
                isConnecting 
                  ? 'bg-yellow-500/20' 
                  : isConnected 
                    ? 'bg-green-500/20' 
                    : 'bg-red-500/20'
              }`}>
                {isConnecting && <Loader size={16} className="animate-spin text-yellow-200" />}
                {!isConnecting && isConnected && <Wifi size={16} className="text-green-200" />}
                {!isConnecting && !isConnected && <WifiOff size={16} className="text-red-200" />}
                <span className="font-medium text-sm">{getStatusText()}</span>
              </div>
              {isConnected && (
                <div className="flex items-center gap-1 text-sm opacity-90">
                  {currentMode === 'speaking' ? <Volume2 size={16} /> : <Mic size={16} />}
                  <span>{getModeText()}</span>
                </div>
              )}
            </div>
            <button
              onClick={() => setShowChat(false)}
              className={`p-1 rounded-full hover:bg-white/20 transition-colors ${className?.includes('h-full') ? 'hidden' : ''}`}
            >
              <X size={20} />
            </button>
          </div>

          {/* Setup Warning in Chat */}
          {!ElevenLabsService.isConfigured() && (
            <div className="p-3 bg-orange-50 border-b border-orange-200">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-orange-800">Setup Required</p>
                  <p className="text-orange-700 text-xs mt-1">
                    Configure your ElevenLabs settings in environment variables to start chatting.
                  </p>
                  <p className="text-orange-600 text-xs mt-1">
                    Check your .env file for VITE_ELEVENLABS_AGENT_ID
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Connection Controls */}
          <div className="p-3 border-b bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleStartConversation}
                  disabled={isConnecting || isConnected || !ElevenLabsService.isConfigured()}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-md text-white font-medium text-sm transition-all duration-300 disabled:opacity-50 bg-green-500 hover:bg-green-600 disabled:cursor-not-allowed"
                >
                  <Wifi size={14} />
                  Connect
                </button>
                
                <button
                  onClick={handleEndConversation}
                  disabled={isConnecting || !isConnected}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-md text-white font-medium text-sm transition-all duration-300 disabled:opacity-50 bg-red-500 hover:bg-red-600 disabled:cursor-not-allowed"
                >
                  <WifiOff size={14} />
                  Disconnect
                </button>
              </div>

              {/* Connection Status Badge */}
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                isConnecting 
                  ? 'bg-yellow-100 text-yellow-800' 
                  : isConnected 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
              }`}>
                {getStatusIcon()}
                <span>{getStatusText()}</span>
              </div>
            </div>

            {/* Mode and Volume Indicator */}
            {isConnected && (
              <div className="flex items-center justify-between">
                <div className={`flex items-center gap-2 px-2 py-1 rounded-md text-xs font-medium ${
                  currentMode === 'speaking' 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {getModeIcon()}
                  <span>{getModeText()}</span>
                </div>

                {/* Mic Volume Indicator */}
                <div className="flex items-center gap-2">
                  <Mic size={14} className="text-gray-600" />
                  <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-150"
                      style={{ width: `${Math.min(inputVolumeLevel * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600 w-6 text-right">
                    {Math.round(inputVolumeLevel * 100)}%
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-100">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p>No messages yet. Start a conversation!</p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 animate__animated animate__fadeInUp`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.source === 'user' ? 'bg-blue-500' : 'bg-purple-500'
                  }`}>
                    {message.source === 'user' ? (
                      <User size={16} className="text-white" />
                    ) : (
                      <Bot size={16} className="text-white" />
                    )}
                  </div>
                  <div className={`flex-1 p-3 rounded-lg ${
                    message.source === 'user' 
                      ? 'bg-blue-100 text-blue-900' 
                      : 'bg-white border shadow-sm'
                  }`}>
                    <div className="text-sm">
                      {message.message || message.text || (
                        <div className="flex items-center gap-2 text-gray-500">
                          <Volume2 size={14} />
                          <span>Audio message</span>
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date().toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Input Area */}
          <div className={`p-4 border-t bg-white ${className?.includes('h-full') ? '' : 'rounded-b-xl'}`}>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={
                  !ElevenLabsService.isConfigured()
                    ? "Configure environment variables first..." 
                    : "Type your message..."
                }
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                disabled={!isConnected || !ElevenLabsService.isConfigured()}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || !isConnected || !ElevenLabsService.isConfigured()}
                className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
              >
                <Send size={16} />
              </button>
            </div>
            <div className="text-xs text-gray-500 mt-2 text-center">
              {!ElevenLabsService.isConfigured()
                ? 'Setup required - Configure environment variables'
                : isConnected 
                  ? 'Connected - You can type or speak' 
                  : 'Connect to start chatting'
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConversationalAIButton;