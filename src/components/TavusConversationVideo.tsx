import React, { useState, useEffect, useRef } from 'react';
import { X, Video, VideoOff, Loader, AlertTriangle } from 'lucide-react';
import { TavusService, TavusConversation } from '../services/TavusService';

interface TavusConversationVideoProps {
  pageContent: any;
  currentPage: number;
  totalPages: number;
}

const TavusConversationVideo = ({ pageContent, currentPage, totalPages }: TavusConversationVideoProps) => {
  const [isMinimized, setIsMinimized] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversation, setConversation] = useState<TavusConversation | null>(null);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Clean up conversation when component unmounts or page changes
  useEffect(() => {
    return () => {
      if (conversation) {
        TavusService.endConversation(conversation.conversation_id).catch(console.error);
      }
    };
  }, [conversation]);

  // End previous conversation when page changes
  useEffect(() => {
    if (conversation) {
      TavusService.endConversation(conversation.conversation_id)
        .then(() => setConversation(null))
        .catch(console.error);
    }
  }, [currentPage]);

  const createConversation = async () => {
    if (!TavusService.isConfigured()) {
      setError('Tavus not configured. Please check your environment variables.');
      return;
    }

    setIsCreatingConversation(true);
    setError(null);

    try {
      const conversationRequest = {
        replica_id: TavusService.getReplicaId(),
        persona_id: TavusService.getPersonaId(),
        conversation_name: `Story Chat - ${pageContent.title || `Page ${currentPage + 1}`}`,
        conversational_context: TavusService.createStoryContext(pageContent, currentPage, totalPages),
        custom_greeting: TavusService.createCustomGreeting(pageContent, currentPage),
        properties: {
          max_call_duration: 1800, // 30 minutes
          participant_left_timeout: 60,
          participant_absent_timeout: 300,
          enable_recording: false,
          enable_closed_captions: true,
          apply_greenscreen: false,
          language: 'english'
        }
      };

      const newConversation = await TavusService.createConversation(conversationRequest);
      setConversation(newConversation);
      setIsLoading(true);

      // Give the conversation a moment to initialize
      setTimeout(() => {
        setIsLoading(false);
      }, 3000);

    } catch (err: any) {
      setError(err.message || 'Failed to create conversation');
      console.error('Error creating Tavus conversation:', err);
    } finally {
      setIsCreatingConversation(false);
    }
  };

  const handleExpand = () => {
    setIsMinimized(false);
    if (!conversation && !isCreatingConversation) {
      createConversation();
    }
  };

  const handleMinimize = () => {
    setIsMinimized(true);
  };

  const handleEndConversation = async () => {
    if (conversation) {
      try {
        await TavusService.endConversation(conversation.conversation_id);
        setConversation(null);
        setIsMinimized(true);
      } catch (err) {
        console.error('Error ending conversation:', err);
      }
    }
  };

  if (!TavusService.isConfigured()) {
    return (
      <div className="bg-orange-100 border border-orange-300 rounded-lg p-2 max-w-xs">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-orange-600" />
          <p className="text-orange-700 text-xs">Tavus not configured</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-xl border-2 border-purple-300 transition-all duration-300 ${
      isMinimized ? 'w-16 h-16' : 'w-80 h-60'
    }`}>
      {isMinimized ? (
        <button
          onClick={handleExpand}
          disabled={isCreatingConversation}
          className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
        >
          <div className="text-center">
            {isCreatingConversation ? (
              <Loader size={20} className="animate-spin mx-auto" />
            ) : (
              <>
                <Video size={20} className="mx-auto mb-1" />
                <div className="text-xs font-bold">Story Chat</div>
              </>
            )}
          </div>
        </button>
      ) : (
        <div className="relative w-full h-full">
          <div className="flex items-center justify-between p-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
            <span className="text-sm font-bold">Story Chat</span>
            <div className="flex items-center gap-1">
              {conversation && (
                <button
                  onClick={handleEndConversation}
                  className="text-white hover:text-gray-200 transition-colors p-1"
                  title="End conversation"
                >
                  <VideoOff size={14} />
                </button>
              )}
              <button
                onClick={handleMinimize}
                className="text-white hover:text-gray-200 transition-colors p-1"
                title="Minimize"
              >
                <X size={14} />
              </button>
            </div>
          </div>
          
          <div className="h-48 bg-gray-50 rounded-b-lg overflow-hidden">
            {error ? (
              <div className="flex items-center justify-center h-full p-4">
                <div className="text-center">
                  <AlertTriangle size={24} className="text-red-500 mx-auto mb-2" />
                  <p className="text-red-600 text-sm">{error}</p>
                  <button
                    onClick={createConversation}
                    className="mt-2 px-3 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : isCreatingConversation ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Loader size={24} className="animate-spin mx-auto mb-2 text-purple-600" />
                  <p className="text-sm text-gray-600">Creating conversation...</p>
                  <p className="text-xs text-gray-500 mt-1">This may take a moment</p>
                </div>
              </div>
            ) : isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Loader size={24} className="animate-spin mx-auto mb-2 text-purple-600" />
                  <p className="text-sm text-gray-600">Loading conversation...</p>
                </div>
              </div>
            ) : conversation ? (
              <iframe
                ref={iframeRef}
                src={conversation.conversation_url}
                className="w-full h-full"
                allow="camera; microphone; autoplay; encrypted-media; fullscreen"
                style={{ border: 'none' }}
                onLoad={() => setIsLoading(false)}
                onError={() => {
                  setError('Failed to load conversation video');
                  setIsLoading(false);
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full p-4">
                <div className="text-center">
                  <Video size={24} className="text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 text-sm">Click to start story chat</p>
                  <button
                    onClick={createConversation}
                    className="mt-2 px-3 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600 transition-colors"
                  >
                    Start Chat
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TavusConversationVideo;