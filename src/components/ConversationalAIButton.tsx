import React, { useState, useEffect } from 'react';
import { Mic, MicOff, MessageCircle, X, Settings, Send, Wifi, WifiOff, Volume2, User, Bot, Loader, AlertTriangle } from 'lucide-react';
import { useConversationalAI } from '../hooks/useConversationalAI';

interface ConversationalAIButtonProps {
  agentId?: string;
  context?: string;
  onMessage?: (message: any) => void;
  className?: string;
  initialShowChat?: boolean;
  hideSettings?: boolean;
}

const ConversationalAIButton = ({ 
  agentId = '',
  context = '',
  onMessage,
  className = '',
  initialShowChat = false,
  hideSettings = false
}: ConversationalAIButtonProps) => {
  const [showChat, setShowChat] = useState(initialShowChat);
  const [showConfig, setShowConfig] = useState(false);
  const [customAgentId, setCustomAgentId] = useState(agentId);
  const [useSignedUrl, setUseSignedUrl] = useState(false);
  const [signedUrlEndpoint, setSignedUrlEndpoint] = useState('/signed-url');
  const [apiKey, setApiKey] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  const [inputVolumeLevel, setInputVolumeLevel] = useState(0);
  const [showSetupWarning, setShowSetupWarning] = useState(false);

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

  const isValidAgentId = (id: string) => {
    return id && id.trim() !== '' && id !== 'your-agent-id';
  };

  const handleStartConversation = async () => {
    try {
      let options: any = {};

      if (useSignedUrl) {
        const response = await fetch(signedUrlEndpoint);
        if (!response.ok) {
          throw new Error('Failed to get signed URL');
        }
        const signedUrl = await response.text();
        options.signedUrl = signedUrl;
      } else {
        if (!isValidAgentId(customAgentId)) {
          setShowSetupWarning(true);
          return;
        }
        options.agentId = customAgentId;
        if (apiKey) {
          options.apiKey = apiKey;
        }
      }

      if (context) {
        options.context = context;
      }

      options.onMessage = (message: any) => {
        console.log('AI Message:', message);
        onMessage?.(message);
      };

      await startConversation(options);
      setShowSetupWarning(false);
    } catch (err: any) {
      console.error('Failed to start conversation:', err);
      
      // Check if it's an agent not found error
      if (err.message && err.message.includes('does not exist')) {
        setShowSetupWarning(true);
      }
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
    if (!isValidAgentId(customAgentId) && !useSignedUrl) {
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
    if (!isValidAgentId(customAgentId) && !useSignedUrl) return 'Setup Required';
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
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-all duration-300 transform hover:scale-105 disabled:opacity-50 ${getButtonColor()}`}
        >
          {!isValidAgentId(customAgentId) && !useSignedUrl ? (
            <AlertTriangle size={20} />
          ) : (
            getModeIcon()
          )}
          <span className="hidden sm:inline">AI Helper</span>
        </button>

        {!hideSettings && (
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="p-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors"
            aria-label="AI Settings"
          >
            <Settings size={16} />
          </button>
        )}
      </div>

      {/* Setup Warning */}
      {showSetupWarning && (
        <div className="absolute top-full left-0 mt-2 p-3 bg-orange-100 border border-orange-300 rounded-lg text-orange-800 text-sm max-w-xs animate__animated animate__fadeIn z-50">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="text-orange-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Setup Required</p>
              <p className="text-xs mt-1">Please configure your ElevenLabs Agent ID in settings to use the AI helper.</p>
              <button
                onClick={() => {
                  setShowSetupWarning(false);
                  setShowConfig(true);
                }}
                className="text-orange-700 underline text-xs mt-1 hover:text-orange-900"
              >
                Open Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && !showSetupWarning && (
        <div className="absolute top-full left-0 mt-2 p-2 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm max-w-xs animate__animated animate__fadeIn z-50">
          {error}
        </div>
      )}

      {/* Configuration Panel */}
      {showConfig && (
        <div className="absolute top-full right-0 mt-2 p-4 bg-white border border-gray-300 rounded-lg shadow-lg z-50 min-w-80 animate__animated animate__fadeInDown">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">AI Configuration</h3>
            <button
              onClick={() => setShowConfig(false)}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <X size={16} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={useSignedUrl}
                  onChange={(e) => setUseSignedUrl(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Use Signed URL (for private agents)</span>
              </label>
            </div>

            {useSignedUrl ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Signed URL Endpoint
                </label>
                <input
                  type="text"
                  value={signedUrlEndpoint}
                  onChange={(e) => setSignedUrlEndpoint(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  placeholder="/signed-url"
                />
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Agent ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={customAgentId}
                    onChange={(e) => setCustomAgentId(e.target.value)}
                    className={`w-full p-2 border rounded-md text-sm transition-colors ${
                      !isValidAgentId(customAgentId) 
                        ? 'border-orange-300 bg-orange-50' 
                        : 'border-gray-300'
                    }`}
                    placeholder="Enter your ElevenLabs Agent ID"
                  />
                  {!isValidAgentId(customAgentId) && (
                    <p className="text-xs text-orange-600 mt-1">
                      Please enter a valid Agent ID from your ElevenLabs dashboard
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    API Key (optional)
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    placeholder="Your ElevenLabs API Key"
                  />
                </div>
              </>
            )}

            <div className="text-xs text-gray-500 space-y-1">
              <p><strong>Setup Instructions:</strong></p>
              <p>1. Go to <a href="https://elevenlabs.io/app/conversational-ai" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">ElevenLabs Conversational AI</a></p>
              <p>2. Create or select an AI agent</p>
              <p>3. Copy the Agent ID from your dashboard</p>
              <p>4. Paste it in the Agent ID field above</p>
              <p>• For public agents, use Agent ID directly</p>
              <p>• For private agents, set up a signed URL endpoint</p>
            </div>
          </div>
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
          {!isValidAgentId(customAgentId) && !useSignedUrl && (
            <div className="p-3 bg-orange-50 border-b border-orange-200">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-orange-800">Setup Required</p>
                  <p className="text-orange-700 text-xs mt-1">
                    Configure your ElevenLabs Agent ID to start chatting.
                  </p>
                  <button
                    onClick={() => setShowConfig(true)}
                    className="text-orange-700 underline text-xs mt-1 hover:text-orange-900"
                  >
                    Open Settings
                  </button>
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
                  disabled={isConnecting || isConnected || (!isValidAgentId(customAgentId) && !useSignedUrl)}
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
                <Bot size={48} className="mx-auto mb-3 text-gray-400" />
                <p className="text-sm">
                  {!isValidAgentId(customAgentId) && !useSignedUrl 
                    ? "Configure your Agent ID to start chatting!" 
                    : "Start a conversation with the AI helper!"
                  }
                </p>
                <p className="text-xs mt-1">
                  {!isValidAgentId(customAgentId) && !useSignedUrl 
                    ? "Click the settings button to add your ElevenLabs Agent ID." 
                    : "I can help explain the story, answer questions, and assist with quizzes."
                  }
                </p>
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
                  !isValidAgentId(customAgentId) && !useSignedUrl 
                    ? "Configure Agent ID first..." 
                    : "Type your message..."
                }
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                disabled={!isConnected || (!isValidAgentId(customAgentId) && !useSignedUrl)}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || !isConnected || (!isValidAgentId(customAgentId) && !useSignedUrl)}
                className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
              >
                <Send size={16} />
              </button>
            </div>
            <div className="text-xs text-gray-500 mt-2 text-center">
              {!isValidAgentId(customAgentId) && !useSignedUrl 
                ? 'Setup required - Configure your ElevenLabs Agent ID'
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