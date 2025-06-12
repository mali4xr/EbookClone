import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { SupabaseService } from '../services/SupabaseService';
import { storyContent } from '../data/storyData';

interface PageContent {
  text: string;
  image: string;
  video: string;
  background: string;
  quiz?: any;
}

interface BookContextType {
  currentPage: number;
  totalPages: number;
  pageContent: PageContent;
  currentWord: number;
  isReading: boolean;
  hasStartedReading: boolean;
  isMuted: boolean;
  isLoading: boolean;
  error: string | null;
  availableVoices: SpeechSynthesisVoice[];
  voiceIndex: number;
  rate: number;
  pitch: number;
  volume: number;
  nextPage: () => void;
  prevPage: () => void;
  toggleReading: () => void;
  toggleMute: () => void;
  setVoiceIndex: (index: number) => void;
  setRate: (rate: number) => void;
  setPitch: (pitch: number) => void;
  setVolume: (volume: number) => void;
  updatePageContent: (content: Partial<PageContent>) => void;
  refreshStoryData: () => Promise<void>;
}

const BookContext = createContext<BookContextType | undefined>(undefined);

export const BookProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [pages, setPages] = useState<PageContent[]>([]);
  const [currentWord, setCurrentWord] = useState(0);
  const [isReading, setIsReading] = useState(false);
  const [hasStartedReading, setHasStartedReading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Voice settings
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceIndex, setVoiceIndex] = useState(0);
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [volume, setVolume] = useState(1);
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = speechSynthesis.getVoices();
      if (voices.length > 0) {
        setAvailableVoices(voices);
        // Try to find a child-friendly voice
        const childVoice = voices.find(voice => 
          voice.name.toLowerCase().includes('child') || 
          voice.name.toLowerCase().includes('kid') ||
          voice.name.toLowerCase().includes('female')
        );
        if (childVoice) {
          setVoiceIndex(voices.indexOf(childVoice));
        }
      }
    };

    loadVoices();
    speechSynthesis.addEventListener('voiceschanged', loadVoices);
    
    return () => {
      speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, []);

  // Load story data
  useEffect(() => {
    loadStoryData();
  }, []);

  const loadStoryData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Try to load from Supabase first
      const supabaseService = SupabaseService.getInstance();
      const supabasePages = await supabaseService.getAllStoryPages();
      
      if (supabasePages && supabasePages.length > 0) {
        const formattedPages = supabasePages.map(page => ({
          text: page.text,
          image: page.image_url,
          video: page.video_url,
          background: page.background_url,
          quiz: page.quiz_data
        }));
        setPages(formattedPages);
        setTotalPages(formattedPages.length);
      } else {
        // Fallback to local data
        setPages(storyContent);
        setTotalPages(storyContent.length);
      }
    } catch (err) {
      console.warn('Failed to load from Supabase, using local data:', err);
      // Fallback to local data
      setPages(storyContent);
      setTotalPages(storyContent.length);
      setError('Using offline story data. Connect to database for full features.');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshStoryData = async () => {
    await loadStoryData();
  };

  const pageContent = pages[currentPage] || {
    text: '',
    image: '',
    video: '',
    background: '',
    quiz: null
  };

  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(prev => prev + 1);
      setCurrentWord(0);
      stopReading();
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
      setCurrentWord(0);
      stopReading();
    }
  };

  const stopReading = () => {
    if (utteranceRef.current) {
      speechSynthesis.cancel();
      utteranceRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsReading(false);
  };

  const startReading = () => {
    if (!pageContent.text) return;
    
    setHasStartedReading(true);
    setIsReading(true);
    setCurrentWord(0);

    const words = pageContent.text.split(' ');
    const utterance = new SpeechSynthesisUtterance(pageContent.text);
    
    if (availableVoices[voiceIndex]) {
      utterance.voice = availableVoices[voiceIndex];
    }
    
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = isMuted ? 0 : volume;
    
    utteranceRef.current = utterance;

    // Word highlighting
    let wordIndex = 0;
    const wordDuration = (60 / (rate * 150)) * 1000; // Approximate timing
    
    intervalRef.current = setInterval(() => {
      if (wordIndex < words.length) {
        setCurrentWord(wordIndex);
        wordIndex++;
      } else {
        stopReading();
      }
    }, wordDuration);

    utterance.onend = () => {
      stopReading();
    };

    utterance.onerror = () => {
      stopReading();
    };

    speechSynthesis.speak(utterance);
  };

  const toggleReading = () => {
    if (isReading) {
      stopReading();
    } else {
      startReading();
    }
  };

  const toggleMute = () => {
    setIsMuted(prev => !prev);
    if (utteranceRef.current) {
      utteranceRef.current.volume = !isMuted ? 0 : volume;
    }
  };

  const updatePageContent = async (content: Partial<PageContent>) => {
    try {
      const updatedContent = { ...pageContent, ...content };
      
      // Update local state
      const updatedPages = [...pages];
      updatedPages[currentPage] = updatedContent;
      setPages(updatedPages);
      
      // Try to update in Supabase
      const supabaseService = SupabaseService.getInstance();
      await supabaseService.upsertStoryPage(currentPage + 1, {
        text: updatedContent.text,
        image_url: updatedContent.image,
        video_url: updatedContent.video,
        background_url: updatedContent.background,
        quiz_data: updatedContent.quiz
      });
    } catch (err) {
      console.error('Failed to update page content:', err);
      setError('Failed to save changes to database');
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopReading();
    };
  }, []);

  const value: BookContextType = {
    currentPage,
    totalPages,
    pageContent,
    currentWord,
    isReading,
    hasStartedReading,
    isMuted,
    isLoading,
    error,
    availableVoices,
    voiceIndex,
    rate,
    pitch,
    volume,
    nextPage,
    prevPage,
    toggleReading,
    toggleMute,
    setVoiceIndex,
    setRate,
    setPitch,
    setVolume,
    updatePageContent,
    refreshStoryData
  };

  return (
    <BookContext.Provider value={value}>
      {children}
    </BookContext.Provider>
  );
};

export const useBook = () => {
  const context = useContext(BookContext);
  if (context === undefined) {
    throw new Error('useBook must be used within a BookProvider');
  }
  return context;
};