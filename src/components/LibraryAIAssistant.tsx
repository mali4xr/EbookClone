import React, { useEffect, useRef, useState } from 'react';
import { MessageCircle, X, Mic, MicOff, Video, VideoOff, Loader, AlertTriangle, Minimize2, Maximize2, Volume2, VolumeX } from 'lucide-react';
import { Book as BookType } from '../types/Book';
import { TavusService, TavusConversation } from '../services/TavusService';

// Declare Daily types for TypeScript
declare global {
  interface Window {
    Daily: any;
  }
}

interface LibraryAIAssistantProps {
  books: BookType[];
  onFilterChange: (filters: {
    searchTerm?: string;
    selectedSubject?: string;
    selectedDifficulty?: string;
    ageRange?: { min: number; max: number };
  }) => void;
  onBookRecommendation: (books: BookType[]) => void;
}

const LibraryAIAssistant: React.FC<LibraryAIAssistantProps> = ({ 
  books, 
  onFilterChange, 
  onBookRecommendation 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [conversation, setConversation] = useState<TavusConversation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVolumeOn, setIsVolumeOn] = useState(true);
  const [replicaConnected, setReplicaConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('Ready to start');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const callObjectRef = useRef<any>(null);
  const conversationIdRef = useRef<string | null>(null);

  // Load Daily.co script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@daily-co/daily-js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Clean up conversation when component unmounts
  useEffect(() => {
    return () => {
      cleanupConversation();
    };
  }, []);

  const cleanupConversation = async () => {
    try {
      // First, leave the call gracefully
      if (callObjectRef.current) {
        await callObjectRef.current.leave();
        callObjectRef.current.destroy();
        callObjectRef.current = null;
      }

      // Then terminate the conversation if we have the ID
      if (conversationIdRef.current) {
        await TavusService.endConversation(conversationIdRef.current);
      }

      // Reset all state
      setConversation(null);
      setIsConnected(false);
      setReplicaConnected(false);
      setConnectionStatus('Ready to start');
      conversationIdRef.current = null;
      
      // Clear video
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  };

  const initializeAIAssistant = async () => {
    if (!TavusService.isConfigured()) {
      setError('Tavus not configured. Please check your environment variables.');
      return;
    }

    setIsConnecting(true);
    setError(null);
    setConnectionStatus('Creating conversation...');

    try {
      console.log('Creating Tavus library conversation...');
      const newConversation = await TavusService.createLibraryConversation();
      console.log('Tavus conversation created:', newConversation);
      
      setConversation(newConversation);
      conversationIdRef.current = newConversation.conversation_id;
      
      setConnectionStatus('Conversation created! Joining...');
      
      // Auto-join the conversation
      await joinConversation(newConversation.conversation_url);

    } catch (err: any) {
      setError(err.message || 'Failed to create conversation');
      setConnectionStatus('Failed to create conversation');
      console.error('Error creating Tavus conversation:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  const joinConversation = async (conversationUrl: string) => {
    if (!window.Daily) {
      throw new Error('Daily.co library not loaded');
    }

    try {
      setConnectionStatus('Joining conversation...');

      // Create Daily call object
      callObjectRef.current = window.Daily.createCallObject();

      // Set up event listeners
      setupEventListeners();

      // Join with user camera OFF and audio ON
      await callObjectRef.current.join({
        url: conversationUrl,
        userName: 'User',
        videoSource: false,  // Turn off user camera
        audioSource: true    // Keep audio for conversation
      });

      // Ensure user video stays off
      await callObjectRef.current.setLocalVideo(false);
      
      setIsConnected(true);
      setConnectionStatus('Connected - waiting for assistant...');

    } catch (error) {
      console.error('Failed to join conversation:', error);
      setError(`Failed to join: ${error}`);
      setConnectionStatus('Failed to join conversation');
      throw error;
    }
  };

  const setupEventListeners = () => {
    if (!callObjectRef.current) return;

    callObjectRef.current.on('participant-joined', (event: any) => {
      console.log('Participant joined:', event);
      updateReplicaVideo();
    });

    callObjectRef.current.on('participant-updated', (event: any) => {
      console.log('Participant updated:', event);
      updateReplicaVideo();
    });

    callObjectRef.current.on('joined-meeting', (event: any) => {
      console.log('Successfully joined conversation');
      setConnectionStatus('Connected - waiting for assistant...');
    });

    callObjectRef.current.on('participant-left', (event: any) => {
      console.log('Participant left:', event);
      if (event.participant.user_name !== 'User') {
        setConnectionStatus('Assistant disconnected');
        setReplicaConnected(false);
      }
    });

    callObjectRef.current.on('error', (event: any) => {
      console.error('Conversation error:', event);
      setError('Connection error occurred');
      setConnectionStatus('Connection error');
    });

    callObjectRef.current.on('left-meeting', () => {
      console.log('Left the meeting');
      setConnectionStatus('Left conversation');
      setIsConnected(false);
      setReplicaConnected(false);
    });

    // Listen for AI tool calls
    callObjectRef.current.on('app-message', (event: any) => {
      handleAIToolCall(event);
    });
  };

  const updateReplicaVideo = () => {
    if (!callObjectRef.current) return;

    const participants = callObjectRef.current.participants();
    let hasWorkingAudioVideo = false;
    
    // Find replica participant (not local user)
    Object.entries(participants).forEach(([id, participant]: [string, any]) => {
      if (id !== 'local') {
        // Check if both video and audio are playable
        const videoPlayable = participant.tracks.video?.state === 'playable';
        const audioPlayable = participant.tracks.audio?.state === 'playable';
        
        if (videoPlayable && audioPlayable) {
          hasWorkingAudioVideo = true;
          setReplicaConnected(true);
          setConnectionStatus('Library assistant connected!');
          setIsConnecting(false);
        }

        // Handle video track
        if (videoPlayable) {
          const videoTrack = participant.tracks.video.persistentTrack;
          if (videoTrack) {
            displayReplicaVideo(videoTrack);
          }
        }
        
        // Handle audio track
        if (audioPlayable) {
          const audioTrack = participant.tracks.audio.persistentTrack;
          if (audioTrack) {
            handleReplicaAudio(audioTrack);
          }
        }
      }
    });

    if (!hasWorkingAudioVideo) {
      setReplicaConnected(false);
      setConnectionStatus('Connected - waiting for assistant media...');
    }
  };

  const displayReplicaVideo = (videoTrack: MediaStreamTrack) => {
    if (videoRef.current) {
      const stream = new MediaStream([videoTrack]);
      videoRef.current.srcObject = stream;
      videoRef.current.muted = !isVolumeOn;
      
      // Ensure video plays
      videoRef.current.play().catch(e => {
        console.log('Video playback prevented:', e);
      });
    }
  };

  const handleReplicaAudio = (audioTrack: MediaStreamTrack) => {
    if (videoRef.current && videoRef.current.srcObject) {
      const currentStream = videoRef.current.srcObject as MediaStream;
      const newStream = new MediaStream();
      
      // Add video tracks
      currentStream.getVideoTracks().forEach(track => {
        newStream.addTrack(track);
      });
      
      // Add audio track
      newStream.addTrack(audioTrack);
      
      videoRef.current.srcObject = newStream;
      videoRef.current.muted = !isVolumeOn;
      
      // Force play
      videoRef.current.play().catch(e => {
        console.log('Audio play prevented:', e);
      });
    }
  };

  const handleAIToolCall = (event: any) => {
    console.log('AI Tool Call Event:', event);
    
    if (event.data?.message_type === 'conversation' && 
        event.data?.event_type === 'conversation.toolcall') {
      
      const { function_name, arguments: args } = event.data.properties;
      console.log('Tool called:', function_name, 'with args:', args);

      switch (function_name) {
        case 'filter_books_by_subject':
          onFilterChange({ selectedSubject: args.subject });
          break;
          
        case 'filter_books_by_difficulty':
          onFilterChange({ selectedDifficulty: args.difficulty });
          break;
          
        case 'search_books':
          onFilterChange({ searchTerm: args.searchTerm });
          break;
          
        case 'filter_books_by_age':
          onFilterChange({ 
            ageRange: { min: args.minAge, max: args.maxAge } 
          });
          break;
          
        case 'recommend_books':
          const recommendedBooks = getRecommendedBooks(args.preferences);
          onBookRecommendation(recommendedBooks);
          break;
      }
    }
  };

  const getRecommendedBooks = (preferences: string): BookType[] => {
    const lowerPrefs = preferences.toLowerCase();
    
    return books.filter(book => {
      return book.title.toLowerCase().includes(lowerPrefs) ||
             book.description?.toLowerCase().includes(lowerPrefs) ||
             book.subject.toLowerCase().includes(lowerPrefs) ||
             book.author.toLowerCase().includes(lowerPrefs);
    }).slice(0, 6);
  };

  const toggleMute = async () => {
    if (callObjectRef.current && isConnected) {
      try {
        const newMutedState = !isMuted;
        await callObjectRef.current.setLocalAudio(!newMutedState);
        setIsMuted(newMutedState);
      } catch (error) {
        console.error('Error toggling mute:', error);
        setError('Error toggling mute');
      }
    }
  };

  const toggleVolume = () => {
    const newVolumeState = !isVolumeOn;
    setIsVolumeOn(newVolumeState);
    if (videoRef.current) {
      videoRef.current.muted = !newVolumeState;
    }
  };

  const leaveConversation = async () => {
    await cleanupConversation();
    setIsOpen(false);
  };

  const handleOpen = () => {
    setIsOpen(true);
    if (!conversation && !isConnecting && !isConnected) {
      initializeAIAssistant();
    }
  };

  if (!TavusService.isConfigured()) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <div className="bg-orange-100 border border-orange-300 rounded-lg p-3 max-w-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-orange-600" />
            <div>
              <p className="text-orange-700 text-xs font-medium">AI Assistant not configured</p>
              <p className="text-orange-600 text-xs">Add Tavus environment variables</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* AI Assistant Toggle Button */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isOpen ? (
          <button
            onClick={handleOpen}
            disabled={isConnecting}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 disabled:opacity-50 group"
            aria-label="Open AI Library Assistant"
          >
            <div className="relative">
              {isConnecting ? (
                <Loader size={24} className="animate-spin" />
              ) : (
                <Video size={24} />
              )}
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            </div>
          </button>
        ) : (
          <div className={`bg-white rounded-xl shadow-2xl border-4 border-purple-300 transition-all duration-300 ${
            isMinimized ? 'w-16 h-16' : 'w-96 h-80'
          }`}>
            {isMinimized ? (
              <button
                onClick={() => setIsMinimized(false)}
                className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105"
              >
                <Video size={16} />
              </button>
            ) : (
              <div className="relative w-full h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-xl">
                  <div className="flex items-center gap-2">
                    <Video size={16} />
                    <span className="text-sm font-bold">Library Assistant</span>
                    {isConnected && (
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full animate-pulse ${replicaConnected ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                        <span className="text-xs">{replicaConnected ? 'Live' : 'Connecting'}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {isConnected && (
                      <>
                        <button onClick={toggleMute} className="text-white hover:text-gray-200 transition-colors p-1 rounded-full" title={isMuted ? 'Unmute' : 'Mute'}>
                          {isMuted ? <MicOff size={14} /> : <Mic size={14} />}
                        </button>
                        <button onClick={toggleVolume} className="text-white hover:text-gray-200 transition-colors p-1 rounded-full" title={isVolumeOn ? 'Mute Volume' : 'Unmute Volume'}>
                          {isVolumeOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
                        </button>
                      </>
                    )}
                    <button onClick={() => setIsMinimized(true)} className="text-white hover:text-gray-200 transition-colors p-1 rounded-full" title="Minimize">
                      <Minimize2 size={14} />
                    </button>
                    <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-200 transition-colors p-1 rounded-full" title="Close">
                      <X size={14} />
                    </button>
                  </div>
                </div>
                
                {/* Video Content */}
                <div className="h-60 bg-gray-600 rounded-b-xl overflow-hidden relative">
                  {error ? (
                    <div className="flex items-center justify-center h-full p-4">
                      <div className="text-center">
                        <AlertTriangle size={24} className="text-red-500 mx-auto mb-2" />
                        <p className="text-red-600 text-sm mb-3">{error}</p>
                        <button
                          onClick={() => {
                            setError(null);
                            initializeAIAssistant();
                          }}
                          className="px-3 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600 transition-colors"
                        >
                          Retry
                        </button>
                      </div>
                    </div>
                  ) : isConnecting ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center text-white">
                        <Loader size={32} className="animate-spin mx-auto mb-3 text-purple-400" />
                        <p className="text-sm">{connectionStatus}</p>
                        <p className="text-xs text-gray-300 mt-1">Setting up your library assistant</p>
                      </div>
                    </div>
                  ) : isConnected ? (
                    <>
                      <video 
                        ref={videoRef}
                        className="w-full h-full object-cover"
                        autoPlay
                        playsInline
                        controls={false}
                        style={{ backgroundColor: '#1a1a1a' }}
                      />
                      
                      {/* Connection status overlay */}
                      {!replicaConnected && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                          <div className="text-center text-white">
                            <Loader size={32} className="animate-spin mx-auto mb-3 text-purple-400" />
                            <p className="text-sm">{connectionStatus}</p>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full p-4">
                      <div className="text-center text-white">
                        <Video size={32} className="text-purple-400 mx-auto mb-3" />
                        <p className="text-sm mb-2">Start a conversation with your library assistant!</p>
                        <p className="text-xs text-gray-300 mb-3">Ask for book recommendations or help finding specific topics</p>
                        <button
                          onClick={initializeAIAssistant}
                          className="px-4 py-2 bg-purple-500 text-white text-sm rounded-lg hover:bg-purple-600 transition-colors"
                        >
                          Start Assistant
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Status indicator */}
                <div className="absolute top-12 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                  {connectionStatus}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Accessibility Instructions */}
      {isOpen && replicaConnected && (
        <div className="fixed bottom-6 left-6 bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-sm z-40">
          <h4 className="font-semibold text-blue-800 mb-2">🎯 Accessibility Features</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Say "Show me science books" to filter by subject</li>
            <li>• Ask "Find books for 8-year-olds" to filter by age</li>
            <li>• Say "I want beginner level books" for difficulty</li>
            <li>• Ask "Recommend adventure stories" for suggestions</li>
          </ul>
        </div>
      )}
    </>
  );
};

export default LibraryAIAssistant;