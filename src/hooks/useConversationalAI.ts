import { useState, useRef, useCallback } from 'react';

interface ConversationOptions {
  agentId?: string;
  signedUrl?: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onMessage?: (message: any) => void;
  onError?: (error: any) => void;
  onStatusChange?: (status: 'connected' | 'connecting' | 'disconnected') => void;
  onModeChange?: (mode: 'speaking' | 'listening') => void;
}

interface ConversationInstance {
  endSession: () => Promise<void>;
  getId: () => string;
  setVolume: (options: { volume: number }) => Promise<void>;
  getInputVolume: () => Promise<number>;
  getOutputVolume: () => Promise<number>;
}

export const useConversationalAI = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [currentMode, setCurrentMode] = useState<'speaking' | 'listening'>('listening');
  const [messages, setMessages] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const conversationRef = useRef<ConversationInstance | null>(null);

  const startConversation = useCallback(async (options: ConversationOptions) => {
    try {
      setIsConnecting(true);
      setError(null);

      // Request microphone access first
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Dynamically import the Conversation class
      const { Conversation } = await import('@elevenlabs/client');

      const conversation = await Conversation.startSession({
        ...options,
        onConnect: () => {
          setIsConnected(true);
          setIsConnecting(false);
          options.onConnect?.();
        },
        onDisconnect: () => {
          setIsConnected(false);
          setIsConnecting(false);
          conversationRef.current = null;
          options.onDisconnect?.();
        },
        onMessage: (message) => {
          setMessages(prev => [...prev, message]);
          options.onMessage?.(message);
        },
        onError: (err) => {
          setError(err.message || 'An error occurred');
          setIsConnecting(false);
          options.onError?.(err);
        },
        onStatusChange: (status) => {
          if (status === 'connected') {
            setIsConnected(true);
            setIsConnecting(false);
          } else if (status === 'connecting') {
            setIsConnecting(true);
          } else {
            setIsConnected(false);
            setIsConnecting(false);
          }
          options.onStatusChange?.(status);
        },
        onModeChange: (mode) => {
          setCurrentMode(mode);
          options.onModeChange?.(mode);
        }
      });

      conversationRef.current = conversation;
      return conversation;
    } catch (err: any) {
      setError(err.message || 'Failed to start conversation');
      setIsConnecting(false);
      throw err;
    }
  }, []);

  const endConversation = useCallback(async () => {
    if (conversationRef.current) {
      try {
        await conversationRef.current.endSession();
      } catch (err) {
        console.error('Error ending conversation:', err);
      }
      conversationRef.current = null;
      setIsConnected(false);
      setMessages([]);
    }
  }, []);

  const setVolume = useCallback(async (volume: number) => {
    if (conversationRef.current) {
      await conversationRef.current.setVolume({ volume });
    }
  }, []);

  const getInputVolume = useCallback(async () => {
    if (conversationRef.current) {
      return await conversationRef.current.getInputVolume();
    }
    return 0;
  }, []);

  const getOutputVolume = useCallback(async () => {
    if (conversationRef.current) {
      return await conversationRef.current.getOutputVolume();
    }
    return 0;
  }, []);

  return {
    isConnected,
    isConnecting,
    currentMode,
    messages,
    error,
    startConversation,
    endConversation,
    setVolume,
    getInputVolume,
    getOutputVolume,
    conversation: conversationRef.current
  };
};