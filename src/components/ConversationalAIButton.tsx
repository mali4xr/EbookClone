import React, { useState } from 'react';
import { Mic, MicOff, MessageCircle, X, Settings } from 'lucide-react';
import { useConversationalAI } from '../hooks/useConversationalAI';

interface ConversationalAIButtonProps {
  agentId?: string;
  context?: string;
  onMessage?: (message: any) => void;
  className?: string;
}

const ConversationalAIButton = ({ 
  agentId = 'your-agent-id',
  context = '',
  onMessage,
  className = ''
}: ConversationalAIButtonProps) => {
  const [showConfig, setShowConfig] = useState(false);
  const [customAgentId, setCustomAgentId] = useState(agentId);
  const [useSignedUrl, setUseSignedUrl] = useState(false);
  const [signedUrlEndpoint, setSignedUrlEndpoint] = useState('/signed-url');
  const [apiKey, setApiKey] = useState('');

  const {
    isConnected,
    isConnecting,
    currentMode,
    messages,
    error,
    startConversation,
    endConversation,
    setVolume
  } = useConversationalAI();

  const handleStartConversation = async () => {
    try {
      let options: any = {};

      if (useSignedUrl) {
        const response = await fetch(signedUrlEndpoint, {
          headers: {
            ...(apiKey ? { 'xi-api-key': apiKey } : {}),
          }
        });
        if (!response.ok) {
          throw new Error('Failed to get signed URL');
        }
        const signedUrl = await response.text();
        options.signedUrl = signedUrl;
      } else {
        options.agentId = customAgentId;
      }

      if (context) {
        options.context = context;
      }

      options.onMessage = (message: any) => {
        console.log('AI Message:', message);
        onMessage?.(message);
      };

      await startConversation(options);
    } catch (err: any) {
      console.error('Failed to start conversation:', err);
    }
  };

  const handleEndConversation = async () => {
    await endConversation();
  };

  const getButtonIcon = () => {
    if (isConnecting) {
      return <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />;
    }
    if (isConnected) {
      return currentMode === 'speaking' ? <MicOff size={20} /> : <Mic size={20} />;
    }
    return <MessageCircle size={20} />;
  };

  const getButtonColor = () => {
    if (isConnected) {
      return currentMode === 'speaking' 
        ? 'bg-red-500 hover:bg-red-600' 
        : 'bg-green-500 hover:bg-green-600';
    }
    return 'bg-blue-500 hover:bg-blue-600';
  };

  const getButtonText = () => {
    if (isConnecting) return 'Connecting...';
    if (isConnected) {
      return currentMode === 'speaking' ? 'AI Speaking' : 'Listening';
    }
    return 'Talk to AI';
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center gap-2">
        <button
          onClick={isConnected ? handleEndConversation : handleStartConversation}
          disabled={isConnecting}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-all duration-300 transform hover:scale-105 disabled:opacity-50 ${getButtonColor()}`}
        >
          {getButtonIcon()}
          <span className="hidden sm:inline">{getButtonText()}</span>
        </button>

        <button
          onClick={() => setShowConfig(!showConfig)}
          className="p-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors"
          aria-label="AI Settings"
        >
          <Settings size={16} />
        </button>
      </div>

      {error && (
        <div className="absolute top-full left-0 mt-2 p-2 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm max-w-xs animate__animated animate__fadeIn">
          {error}
        </div>
      )}

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
              <>
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 mt-2">
                    ElevenLabs API Key (optional)
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    placeholder="sk-..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Only required if your signed URL endpoint expects it.
                    <br /><strong>Do not expose real keys in production.</strong>
                  </p>
                </div>
              </>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Agent ID
                </label>
                <input
                  type="text"
                  value={customAgentId}
                  onChange={(e) => setCustomAgentId(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  placeholder="your-agent-id"
                />
              </div>
            )}

            <div className="text-xs text-gray-500">
              <p>• For public agents, use Agent ID directly</p>
              <p>• For private agents, set up a signed URL endpoint</p>
              <p>• Get your Agent ID from ElevenLabs dashboard</p>
            </div>
          </div>
        </div>
      )}

      {isConnected && messages.length > 0 && (
        <div className="absolute top-full left-0 mt-2 p-3 bg-white border border-gray-300 rounded-lg shadow-lg w-96 max-h-96 overflow-y-auto space-y-2 animate__animated animate__fadeInUp">
          <h4 className="font-medium text-gray-900 mb-2">Live Chat</h4>
          <div className="space-y-2">
            {messages.slice(-10).map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.source === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`rounded-lg px-3 py-2 text-sm max-w-[75%] shadow ${
                    msg.source === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-900'
                  }`}
                >
                  <p>{msg.message || msg.text || '[Audio]'}</p>
                  <div className="text-[10px] mt-1 text-right opacity-60">
                    {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ConversationalAIButton;