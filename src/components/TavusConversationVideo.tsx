import React, { useState, useEffect, useRef } from 'react';
import { X, Video, VideoOff, Loader, AlertTriangle, Maximize2, Minimize2 } from 'lucide-react';
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
  const [iframeLoaded, setIframeLoaded] = useState(false);
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
        .then(() => {
          setConversation(null);
          setIframeLoaded(false);
        })
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
    setIframeLoaded(false);

    try {
      const conversationRequest = {
        replica_id: TavusService.getReplicaId(),
        persona_id: TavusService.getPersonaId() || undefined,
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

      console.log('Creating Tavus conversation with:', conversationRequest);
      const newConversation = await TavusService.createConversation(conversationRequest);
      console.log('Tavus conversation created:', newConversation);
      
      setConversation(newConversation);
      setIsLoading(true);

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
        setIframeLoaded(false);
        setIsMinimized(true);
      } catch (err) {
        console.error('Error ending conversation:', err);
      }
    }
  };

  const handleIframeLoad = () => {
    console.log('Tavus iframe loaded successfully');
    setIframeLoaded(true);
    setIsLoading(false);
  };

  const handleIframeError = () => {
    console.error('Tavus iframe failed to load');
    setError('Failed to load conversation video. Please check your network connection.');
    setIsLoading(false);
  };

  if (!TavusService.isConfigured()) {
    return (
      <div className="bg-orange-100 border border-orange-300 rounded-lg p-2 max-w-xs">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-orange-600" />
          <div>
            <p className="text-orange-700 text-xs font-medium">Tavus not configured</p>
            <p className="text-orange-600 text-xs">Add VITE_TAVUS_API_KEY and VITE_TAVUS_REPLICA_ID to .env</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-xl border-2 border-purple-300 transition-all duration-300 ${
      isMinimized ? 'w-16 h-16' : 'w-96 h-72'
    }`}>
      {isMinimized ? (
        <button
          onClick={handleExpand}
          disabled={isCreatingConversation}
          className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
        >
          <div className="text-center">
            {isCreatingConversation ? (
              <Loader size={16} className="animate-spin mx-auto" />
            ) : (
              <>
                <Video size={16} className="mx-auto mb-1" />
                <div className="text-xs font-bold">Story Chat</div>
              </>
            )}
          </div>
        </button>
      ) : (
        <div className="relative w-full h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
            <div className="flex items-center gap-2">
              <Video size={16} />
              <span className="text-sm font-bold">Story Chat</span>
              {conversation && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs">Live</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              {conversation && (
                <button
                  onClick={handleEndConversation}
                  className="text-white hover:text-gray-200 transition-colors p-1 rounded"
                  title="End conversation"
                >
                  <VideoOff size={14} />
                </button>
              )}
              <button
                onClick={handleMinimize}
                className="text-white hover:text-gray-200 transition-colors p-1 rounded"
                title="Minimize"
              >
                <Minimize2 size={14} />
              </button>
            </div>
          </div>
          
          {/* Video Content */}
          <div className="h-60 bg-gray-900 rounded-b-lg overflow-hidden relative">
            {error ? (
              <div className="flex items-center justify-center h-full p-4">
                <div className="text-center">
                  <AlertTriangle size={24} className="text-red-500 mx-auto mb-2" />
                  <p className="text-red-600 text-sm mb-2">{error}</p>
                  <button
                    onClick={() => {
                      setError(null);
                      createConversation();
                    }}
                    className="px-3 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : isCreatingConversation ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-white">
                  <Loader size={32} className="animate-spin mx-auto mb-3 text-purple-400" />
                  <p className="text-sm">Creating conversation...</p>
                  <p className="text-xs text-gray-300 mt-1">Setting up your story chat</p>
                </div>
              </div>
            ) : conversation ? (
              <>
                {/* Loading overlay */}
                {(isLoading || !iframeLoaded) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
                    <div className="text-center text-white">
                      <Loader size={32} className="animate-spin mx-auto mb-3 text-purple-400" />
                      <p className="text-sm">Loading conversation...</p>
                      <p className="text-xs text-gray-300 mt-1">Connecting to your story companion</p>
                    </div>
                  </div>
                )}
                
                {/* Tavus iframe with proper permissions */}
                <iframe
                  ref={iframeRef}
                  src={conversation.conversation_url}
                  className="w-full h-full"
                  allow="camera; microphone; autoplay; encrypted-media; fullscreen; display-capture"
                  allowFullScreen
                  style={{ 
                    border: 'none',
                    backgroundColor: '#1a1a1a'
                  }}
                  onLoad={handleIframeLoad}
                  onError={handleIframeError}
                  title="Tavus Conversation"
                />
              </>
            ) : (
              <div className="flex items-center justify-center h-full p-4">
                <div className="text-center text-white">
                  <Video size={32} className="text-purple-400 mx-auto mb-3" />
                  <p className="text-sm mb-2">Start a conversation about this story!</p>
                  <p className="text-xs text-gray-300 mb-3">Chat with an AI companion about {pageContent.title}</p>
                  <button
                    onClick={createConversation}
                    className="px-4 py-2 bg-purple-500 text-white text-sm rounded-lg hover:bg-purple-600 transition-colors"
                  >
                    Start Story Chat
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Status indicator */}
          {conversation && (
            <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
              {conversation.status === 'active' ? 'Active' : 'Ended'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TavusConversationVideo;