import React, { useState, useEffect, useRef } from 'react';
import { X, Video, VideoOff, Loader, AlertTriangle, Maximize2, Minimize2, ExternalLink, Mic, MicOff, Volume2, VolumeX, Phone, PhoneOff } from 'lucide-react';
import { TavusService, TavusConversation } from '../services/TavusService';

// Declare Daily types for TypeScript
declare global {
  interface Window {
    Daily: any;
  }
}

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
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVolumeOn, setIsVolumeOn] = useState(true);
  const [replicaConnected, setReplicaConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('Ready to start');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const callObjectRef = useRef<any>(null);
  const conversationIdRef = useRef<string | null>(null);
  const apiKeyRef = useRef<string | null>(null);

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
      if (conversationIdRef.current && apiKeyRef.current) {
        await terminateConversationAPI(conversationIdRef.current, apiKeyRef.current);
      }

      // Reset all state
      setConversation(null);
      setIsConnected(false);
      setReplicaConnected(false);
      setConnectionStatus('Ready to start');
      conversationIdRef.current = null;
      apiKeyRef.current = null;
      
      // Clear video
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  };

  const createAndJoinConversation = async () => {
    if (!TavusService.isConfigured()) {
      setError('Tavus not configured. Please check your environment variables.');
      return;
    }

    setIsCreatingConversation(true);
    setError(null);
    setConnectionStatus('Creating conversation...');

    try {
      // Get API key from TavusService
      const apiKey = import.meta.env.VITE_TAVUS_API_KEY;
      if (!apiKey) {
        throw new Error('Tavus API key not found in environment variables');
      }

      const conversationRequest = {
        replica_id: TavusService.getReplicaId(),
        persona_id: TavusService.getPersonaId() || undefined,
        conversation_name: `Story Chat - ${pageContent.title || `Page ${currentPage + 1}`}`,
        conversational_context: TavusService.createStoryContext(pageContent, currentPage, totalPages),
        custom_greeting: TavusService.createCustomGreeting(pageContent, currentPage),
        properties: {
          max_call_duration: 120, // 2 minutes
          participant_left_timeout: 60,
          participant_absent_timeout: 60,
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
      conversationIdRef.current = newConversation.conversation_id;
      apiKeyRef.current = apiKey;
      
      setConnectionStatus('Conversation created! Joining...');
      
      // Auto-join the conversation
      await joinConversation(newConversation.conversation_url);

    } catch (err: any) {
      setError(err.message || 'Failed to create conversation');
      setConnectionStatus('Failed to create conversation');
      console.error('Error creating Tavus conversation:', err);
    } finally {
      setIsCreatingConversation(false);
    }
  };

  const joinConversation = async (conversationUrl: string) => {
    if (!window.Daily) {
      throw new Error('Daily.co library not loaded');
    }

    try {
      setIsLoading(true);
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
      setConnectionStatus('Connected - waiting for replica...');

    } catch (error) {
      console.error('Failed to join conversation:', error);
      setError(`Failed to join: ${error}`);
      setConnectionStatus('Failed to join conversation');
      setIsLoading(false);
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
      setConnectionStatus('Connected - waiting for replica...');
      setIsLoading(false);
    });

    callObjectRef.current.on('participant-left', (event: any) => {
      console.log('Participant left:', event);
      if (event.participant.user_name !== 'User') {
        setConnectionStatus('Replica disconnected');
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
          setConnectionStatus('Teacher connected - conversation active!');
          setIsLoading(false);
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
      setConnectionStatus('Connected - waiting for replica media...');
    }
  };

  const displayReplicaVideo = (videoTrack: MediaStreamTrack) => {
    if (videoRef.current) {
      const stream = new MediaStream([videoTrack]);
      videoRef.current.srcObject = stream;
      videoRef.current.muted = !audioActivated; // Only unmute if audio was activated by user
      
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
    if (callObjectRef.current) {
      try {
        await callObjectRef.current.leave();
        callObjectRef.current.destroy();
        callObjectRef.current = null;
        setIsConnected(false);
        setReplicaConnected(false);
        
        // Clear video display
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
        
        setConnectionStatus('Left conversation');
      } catch (error) {
        console.error('Error leaving conversation:', error);
        setError('Error leaving conversation');
      }
    }
  };

  const terminateConversationAPI = async (conversationId: string, apiKey: string) => {
    try {
      const response = await fetch(`https://tavusapi.com/v2/conversations/${conversationId}/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Termination failed: ${response.status} - ${errorData.message || 'Unknown error'}`);
      }

      console.log('Conversation terminated successfully');
      return true;
    } catch (error) {
      console.error('Error terminating conversation:', error);
      throw error;
    }
  };

  const terminateConversation = async () => {
    if (!conversationIdRef.current || !apiKeyRef.current) {
      setError('No conversation to terminate');
      return;
    }

    try {
      setConnectionStatus('Terminating conversation...');

      // First, leave the call gracefully
      if (callObjectRef.current) {
        await callObjectRef.current.leave();
        callObjectRef.current.destroy();
        callObjectRef.current = null;
      }

      // Then terminate the conversation via API
      await terminateConversationAPI(conversationIdRef.current, apiKeyRef.current);

      // Clean up local state
      setIsConnected(false);
      setReplicaConnected(false);
      setConversation(null);
      conversationIdRef.current = null;
      apiKeyRef.current = null;
      
      // Clear video display
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      
      setConnectionStatus('🔴 Conversation terminated');
      
      // Auto-minimize after termination
      setTimeout(() => {
        setIsMinimized(true);
      }, 2000);

    } catch (error) {
      console.error('Error terminating conversation:', error);
      setError(`Termination error: ${error}`);
    }
  };

  const handleExpand = () => {
    setIsMinimized(false);
    if (!conversation && !isCreatingConversation && !isConnected) {
      createAndJoinConversation();
    }
  };

  const handleMinimize = () => {
    setIsMinimized(true);
  };

  const [audioActivated, setAudioActivated] = useState(false);

  const activateAudio = () => {
    if (videoRef.current) {
      videoRef.current.muted = false;
      videoRef.current.play().then(() => {
        console.log('Audio activated successfully');
        setConnectionStatus('🎉 Audio activated - conversation active!');
        setAudioActivated(true);
      }).catch(e => {
        console.log('Could not activate audio:', e);
      });
    }
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
    <div className={`bg-white rounded-lg shadow-xl border-4 border-purple-300 transition-all duration-300 ${isMinimized ? 'w-16 h-16' : 'w-96 h-80'}`}>
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
                <div className="text-xs font-bold">Chat</div>
              </>
            )}
          </div>
        </button>
      ) : (
        <div className="relative w-full h-full">
          <div className="flex items-center justify-between p-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
            <div className="flex items-center gap-2">
              <Video size={16} />
              <span className="text-sm font-bold">Chat</span>
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
                  <button onClick={leaveConversation} className="text-white hover:text-gray-200 transition-colors p-1 rounded-full" title="Leave conversation">
                    <Phone size={14} />
                  </button>
                  <button onClick={terminateConversation} className="text-white hover:text-red-300 transition-colors p-1 rounded-full" title="Terminate conversation">
                    <PhoneOff size={14} />
                  </button>
                </>
              )}
              <button onClick={handleMinimize} className="text-white hover:text-gray-200 transition-colors p-1 rounded-full" title="Minimize">
                <Minimize2 size={14} />
              </button>
            </div>
          </div>
          
          {/* Video Content */}
          <div className="h-60 bg-gray-600 rounded-b-lg overflow-hidden relative">
            {error ? (
              <div className="flex items-center justify-center h-full p-8">
                <div className="text-center">
                  <AlertTriangle size={24} className="text-red-500 mx-auto mb-2" />
                  <p className="text-red-600 text-sm mb-3">{error}</p>
                  <button
                    onClick={() => {
                      setError(null);
                      createAndJoinConversation();
                    }}
                    className="px-3 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : isCreatingConversation || isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-white">
                  <Loader size={32} className="animate-spin mx-auto mb-3 text-purple-400" />
                  <p className="text-sm">{connectionStatus}</p>
                  <p className="text-xs text-gray-300 mt-1">Setting up your story chat</p>
                </div>
              </div>
            ) : isConnected ? (
              <>
                <video 
                  ref={videoRef}
                  className="w-full h-full object-cover cursor-pointer"
                  autoPlay
                  playsInline
                  controls={false}
                  onClick={activateAudio}
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
                
                {/* Audio activation hint */}
                {replicaConnected && !audioActivated && (
                  <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    Click to ensure audio is active
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full p-4">
                <div className="text-center text-white">
                  <Video size={32} className="text-purple-400 mx-auto mb-3" />
                  <p className="text-sm mb-2">Start a conversation about this story!</p>
                  <p className="text-xs text-gray-300 mb-3">Chat with an AI companion about {pageContent.title}</p>
                  <button
                    onClick={createAndJoinConversation}
                    className="px-4 py-2 bg-purple-500 text-white text-sm rounded-lg hover:bg-purple-600 transition-colors"
                  >
                    Start Story Chat
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
  );
};

export default TavusConversationVideo;