import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { SupabaseService } from '../services/SupabaseService';
import { storyContent } from '../data/storyData';

interface PageContent {
  title: string;
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
  updatePageContent: (content: Partial<PageContent>) => Promise<void>;
  refreshStoryData: () => Promise<void>;
  addNewPage: () => Promise<void>;
  deletePage: (pageNumber: number) => Promise<void>;
  readText: (text: string) => void;
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
  const wordsRef = useRef<string[]>([]);
  const startTimeRef = useRef<number>(0);
  const wordIndexRef = useRef<number>(0);
  const isReadingStoryRef = useRef<boolean>(false);

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
          title: page.title || '',
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

  const addNewPage = async () => {
    try {
      const newPageNumber = totalPages + 1;
      const newPageData = {
        page_number: newPageNumber,
        title: `Chapter ${newPageNumber}`,
        text: "Once upon a time, there was a new adventure waiting to be written...",
        image_url: "https://images.pexels.com/photos/326012/pexels-photo-326012.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
        video_url: "https://videos.pexels.com/video-files/3045163/3045163-uhd_2560_1440_25fps.mp4",
        background_url: "https://images.pexels.com/photos/1287075/pexels-photo-1287075.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
        quiz_data: {
          multipleChoice: {
            question: "What is this new adventure about?",
            options: [
              { text: "A magical journey", isCorrect: true },
              { text: "A scary story", isCorrect: false },
              { text: "A cooking lesson", isCorrect: false }
            ]
          },
          spelling: {
            word: "adventure",
            hint: "An exciting journey or experience"
          }
        }
      };

      const supabaseService = SupabaseService.getInstance();
      await supabaseService.createStoryPage(newPageData);
    } catch (error) {
      console.error('Failed to add new page:', error);
      throw error;
    }
  };

  const deletePage = async (pageNumber: number) => {
    try {
      const supabaseService = SupabaseService.getInstance();
      await supabaseService.deleteStoryPage(pageNumber);
      
      // If we deleted the current page and it was the last page, go to previous page
      if (pageNumber === currentPage + 1 && currentPage >= totalPages - 1) {
        setCurrentPage(Math.max(0, currentPage - 1));
      }
    } catch (error) {
      console.error('Failed to delete page:', error);
      throw error;
    }
  };

  const pageContent = pages[currentPage] || {
    title: '',
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
      setHasStartedReading(false);
      stopReading();
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
      setCurrentWord(0);
      setHasStartedReading(false);
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
    isReadingStoryRef.current = false;
    wordIndexRef.current = 0;
  };

  // Generic text reading function for quiz questions and other text
  const readText = (text: string) => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    
    if (availableVoices[voiceIndex]) {
      utterance.voice = availableVoices[voiceIndex];
    }
    
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = isMuted ? 0 : volume;
    
    utterance.onend = () => {
      // Don't change reading state for quiz text
    };

    utterance.onerror = (event) => {
      // Only log actual errors, not interruptions which are expected
      if (event.error !== 'interrupted') {
        console.error('Speech synthesis error:', event);
      }
    };

    speechSynthesis.speak(utterance);
  };

  const startReading = () => {
    if (!pageContent.text) return;
    
    setHasStartedReading(true);
    setIsReading(true);
    setCurrentWord(0);
    wordIndexRef.current = 0;
    isReadingStoryRef.current = true;

    const words = pageContent.text.split(/\s+/);
    wordsRef.current = words;
    
    const utterance = new SpeechSynthesisUtterance(pageContent.text);
    
    if (availableVoices[voiceIndex]) {
      utterance.voice = availableVoices[voiceIndex];
    }
    
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = isMuted ? 0 : volume;
    
    utteranceRef.current = utterance;
    startTimeRef.current = Date.now();

    // Enhanced word tracking with onboundary event
    utterance.onboundary = (event) => {
      if (event.name === 'word' && isReadingStoryRef.current) {
        // Use the character offset to determine word position more accurately
        const text = pageContent.text;
        const beforeChar = text.substring(0, event.charIndex);
        
        // Count words more precisely by splitting on whitespace
        const wordsBefore = beforeChar.trim() === '' ? 0 : beforeChar.trim().split(/\s+/).length;
        
        if (wordsBefore >= 0 && wordsBefore < words.length) {
          wordIndexRef.current = wordsBefore;
          setCurrentWord(wordsBefore);
        }
      }
    };

    utterance.onstart = () => {
      startTimeRef.current = Date.now();
      setIsReading(true);
      isReadingStoryRef.current = true;
    };

    utterance.onend = () => {
      // Ensure completion is properly marked
      if (isReadingStoryRef.current) {
        setCurrentWord(words.length);
        setIsReading(false);
        isReadingStoryRef.current = false;
        wordIndexRef.current = words.length;
      }
    };

    utterance.onerror = (event) => {
      // Only log actual errors, not interruptions which are expected
      if (event.error !== 'interrupted') {
        console.error('Speech synthesis error:', event);
      }
      stopReading();
    };

    // Improved fallback timing mechanism
    const estimatedDuration = (pageContent.text.length / (rate * 15)) * 1000; // More accurate timing
    const wordDuration = estimatedDuration / words.length;
    
    intervalRef.current = setInterval(() => {
      if (isReadingStoryRef.current && wordIndexRef.current < words.length) {
        const currentTime = Date.now();
        const elapsedTime = currentTime - startTimeRef.current;
        const expectedWordIndex = Math.floor(elapsedTime / wordDuration);
        
        // Only update if we haven't received a more recent onboundary event
        if (expectedWordIndex > wordIndexRef.current && expectedWordIndex < words.length) {
          wordIndexRef.current = expectedWordIndex;
          setCurrentWord(expectedWordIndex);
        }
      }
    }, Math.max(wordDuration / 6, 50)); // Check more frequently for smoother highlighting

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
        title: updatedContent.title,
        text: updatedContent.text,
        image_url: updatedContent.image,
        video_url: updatedContent.video,
        background_url: updatedContent.background,
        quiz_data: updatedContent.quiz
      });

      // Refresh the story data to ensure consistency
      await refreshStoryData();
    } catch (err) {
      console.error('Failed to update page content:', err);
      setError('Failed to save changes to database');
      throw err;
    }
  };

  // Reset word tracking when page changes
  useEffect(() => {
    setCurrentWord(0);
    setHasStartedReading(false);
    wordIndexRef.current = 0;
    isReadingStoryRef.current = false;
    stopReading();
  }, [currentPage]);

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
    refreshStoryData,
    addNewPage,
    deletePage,
    readText
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