import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { SupabaseService } from '../services/SupabaseService';
import { BookService } from '../services/BookService';
import { Book, UserSettings } from '../types/Book';
import { storyContent } from '../data/storyData';

interface QuizAnswer {
  pageTitle: string;
  multipleChoiceQuestion: string;
  multipleChoiceAnswer: string;
  spellingWord: string;
  spellingAnswer: string;
  isCorrect: boolean;
}

interface PageContent {
  title: string;
  text: string;
  image: string;
  video: string;
  background: string;
  backgroundMusic?: string;
  quiz?: any;
}

interface BookContextType {
  currentBook: Book | null;
  currentPage: number;
  totalPages: number;
  pageContent: PageContent;
  currentWord: number;
  isReading: boolean;
  hasStartedReading: boolean;
  readingComplete: boolean;
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
  quizAnswers: QuizAnswer[];
  addQuizAnswer: (answer: QuizAnswer) => void;
  resetQuizAnswers: () => void;
  setCurrentBook: (book: Book) => void;
  loadBookSettings: () => Promise<void>;
  saveBookSettings: () => Promise<void>;
}

export const BookContext = createContext<BookContextType | undefined>(undefined);

interface BookProviderProps {
  children: React.ReactNode;
  onStoryComplete?: (answers: QuizAnswer[], totalScore: number) => void;
}

export const BookProvider: React.FC<BookProviderProps> = ({ children, onStoryComplete }) => {
  const [currentBook, setCurrentBookState] = useState<Book | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [pages, setPages] = useState<PageContent[]>([]);
  const [currentWord, setCurrentWord] = useState(0);
  const [isReading, setIsReading] = useState(false);
  const [hasStartedReading, setHasStartedReading] = useState(false);
  const [readingComplete, setReadingComplete] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Quiz tracking
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswer[]>([]);
  
  // Voice settings - now book-specific
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceIndex, setVoiceIndex] = useState(0);
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [volume, setVolume] = useState(1);
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const wordsRef = useRef<string[]>([]);
  const isReadingStoryRef = useRef<boolean>(false);
  const backgroundAudioRef = useRef<HTMLAudioElement | null>(null);

  // Check if story is complete
  useEffect(() => {
    if (quizAnswers.length === totalPages && totalPages > 0 && onStoryComplete) {
      const totalScore = quizAnswers.reduce((sum, answer) => sum + (answer.isCorrect ? 2 : 0), 0);
      onStoryComplete(quizAnswers, totalScore);
    }
  }, [quizAnswers, totalPages, onStoryComplete]);

  // Load voices and set Zira as default
  useEffect(() => {
    const loadVoices = () => {
      const voices = speechSynthesis.getVoices();
      if (voices.length > 0) {
        setAvailableVoices(voices);
        
        // Try to find Zira voice first
        const ziraVoice = voices.find(voice => 
          voice.name.toLowerCase().includes('zira') ||
          voice.name.toLowerCase().includes('microsoft zira')
        );
        
        if (ziraVoice) {
          setVoiceIndex(voices.indexOf(ziraVoice));
          console.log('Zira voice found and set as default:', ziraVoice.name);
        } else {
          // Fallback to other child-friendly voices
          const childVoice = voices.find(voice => 
            voice.name.toLowerCase().includes('child') || 
            voice.name.toLowerCase().includes('kid') ||
            voice.name.toLowerCase().includes('female')
          );
          if (childVoice) {
            setVoiceIndex(voices.indexOf(childVoice));
            console.log('Child-friendly voice found:', childVoice.name);
          } else {
            console.log('No Zira or child-friendly voice found, using default');
          }
        }
      }
    };

    loadVoices();
    speechSynthesis.addEventListener('voiceschanged', loadVoices);
    
    return () => {
      speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, []);

  // Load book settings when book changes
  useEffect(() => {
    if (currentBook) {
      loadBookSettings();
      loadStoryData();
    }
  }, [currentBook]);

  const setCurrentBook = (book: Book) => {
    setCurrentBookState(book);
    setCurrentPage(0);
    setQuizAnswers([]);
    setHasStartedReading(false);
    setReadingComplete(false);
    stopReading();
  };

  const loadBookSettings = async () => {
    if (!currentBook) return;

    try {
      const bookService = BookService.getInstance();
      const settings = await bookService.getUserSettings(currentBook.id);
      
      if (settings) {
        setVoiceIndex(settings.voice_index);
        setRate(settings.rate);
        setPitch(settings.pitch);
        setVolume(settings.volume);
      }
    } catch (error) {
      console.warn('Failed to load book settings:', error);
    }
  };

  const saveBookSettings = async () => {
    if (!currentBook) return;

    try {
      const bookService = BookService.getInstance();
      await bookService.saveUserSettings({
        book_id: currentBook.id,
        voice_index: voiceIndex,
        rate,
        pitch,
        volume,
        settings_data: {}
      });
    } catch (error) {
      console.warn('Failed to save book settings:', error);
    }
  };

  // Auto-save settings when they change
  useEffect(() => {
    if (currentBook) {
      const timeoutId = setTimeout(() => {
        saveBookSettings();
      }, 1000); // Debounce saves

      return () => clearTimeout(timeoutId);
    }
  }, [voiceIndex, rate, pitch, volume, currentBook]);

  const loadStoryData = async () => {
    if (!currentBook) return;

    setIsLoading(true);
    setError(null);
    
    try {
      // Try to load from Supabase first
      const supabaseService = SupabaseService.getInstance();
      const supabasePages = await supabaseService.getAllStoryPages(currentBook.id);
      
      if (supabasePages && supabasePages.length > 0) {
        const formattedPages = supabasePages.map(page => ({
          title: page.title || '',
          text: page.text,
          image: page.image_url,
          video: page.video_url,
          background: page.background_url,
          backgroundMusic: page.background_music_url,
          quiz: page.quiz_data
        }));
        setPages(formattedPages);
        setTotalPages(formattedPages.length);
      } else {
        // Fallback to local data only for story books
        if (currentBook.subject === 'STORY') {
          const enhancedStoryContent = storyContent.map(page => ({
            ...page,
            backgroundMusic: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav' // Default background music
          }));
          setPages(enhancedStoryContent);
          setTotalPages(enhancedStoryContent.length);
        } else {
          // For other subjects, show empty state
          setPages([]);
          setTotalPages(0);
          setError(`No content available for ${currentBook.subject} books yet. Coming soon!`);
        }
      }
    } catch (err) {
      console.warn('Failed to load from Supabase:', err);
      // Fallback to local data only for story books
      if (currentBook.subject === 'STORY') {
        const enhancedStoryContent = storyContent.map(page => ({
          ...page,
          backgroundMusic: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav'
        }));
        setPages(enhancedStoryContent);
        setTotalPages(enhancedStoryContent.length);
        setError('Using offline story data. Connect to database for full features.');
      } else {
        setPages([]);
        setTotalPages(0);
        setError(`Failed to load ${currentBook.subject} content. Please check your connection.`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const refreshStoryData = async () => {
    await loadStoryData();
  };

  const addNewPage = async () => {
    if (!currentBook) return;

    try {
      const newPageNumber = totalPages + 1;
      const newPageData = {
        page_number: newPageNumber,
        title: `Chapter ${newPageNumber}`,
        text: "Once upon a time, there was a new adventure waiting to be written...",
        image_url: "https://images.pexels.com/photos/326012/pexels-photo-326012.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
        video_url: "https://videos.pexels.com/video-files/3045163/3045163-uhd_2560_1440_25fps.mp4",
        background_url: "https://images.pexels.com/photos/1287075/pexels-photo-1287075.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
        background_music_url: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
        book_id: currentBook.id,
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
    if (!currentBook) return;

    try {
      const supabaseService = SupabaseService.getInstance();
      await supabaseService.deleteStoryPage(pageNumber, currentBook.id);
      
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
    backgroundMusic: '',
    quiz: null
  };

  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(prev => prev + 1);
      resetPageState();
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
      resetPageState();
    }
  };

  const resetPageState = () => {
    setCurrentWord(0);
    setHasStartedReading(false);
    setReadingComplete(false);
    isReadingStoryRef.current = false;
    stopReading();
  };

  const stopReading = () => {
    if (utteranceRef.current) {
      speechSynthesis.cancel();
      utteranceRef.current = null;
    }
    
    // Stop background music when reading stops
    if (backgroundAudioRef.current) {
      backgroundAudioRef.current.pause();
      backgroundAudioRef.current.currentTime = 0;
    }
    
    setIsReading(false);
    isReadingStoryRef.current = false;
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
    
    console.log('Starting reading...');
    setHasStartedReading(true);
    setIsReading(true);
    setCurrentWord(0);
    setReadingComplete(false);
    isReadingStoryRef.current = true;

    // Start background music if available
    if (pageContent.backgroundMusic) {
      if (!backgroundAudioRef.current) {
        backgroundAudioRef.current = new Audio(pageContent.backgroundMusic);
        backgroundAudioRef.current.loop = true;
        backgroundAudioRef.current.volume = 0.3; // Lower volume for background music
      }
      
      backgroundAudioRef.current.play().catch(e => {
        console.log('Background music autoplay prevented:', e);
      });
    }

    const words = pageContent.text.split(/\s+/).filter(word => word.length > 0);
    wordsRef.current = words;
    console.log('Total words:', words.length);
    
    const utterance = new SpeechSynthesisUtterance(pageContent.text);
    
    if (availableVoices[voiceIndex]) {
      utterance.voice = availableVoices[voiceIndex];
      console.log('Using voice:', availableVoices[voiceIndex].name);
    }
    
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = isMuted ? 0 : volume;
    
    utteranceRef.current = utterance;

    // Word highlighting using Web Speech API boundary events
    utterance.onboundary = (event) => {
      if (event.name === 'word' && isReadingStoryRef.current) {
        const text = pageContent.text;
        const beforeChar = text.substring(0, event.charIndex);
        
        // Count words more precisely by splitting the text before the current character
        const wordsBefore = beforeChar.trim() === '' ? 0 : beforeChar.trim().split(/\s+/).length;
        
        if (wordsBefore >= 0 && wordsBefore < words.length) {
          setCurrentWord(wordsBefore);
          console.log(`Word boundary: ${wordsBefore}/${words.length} - "${words[wordsBefore]}"`);
        }
      }
    };

    utterance.onstart = () => {
      console.log('Speech started');
      setIsReading(true);
      isReadingStoryRef.current = true;
    };

    utterance.onend = () => {
      console.log('Speech ended');
      if (isReadingStoryRef.current) {
        setCurrentWord(words.length);
        setIsReading(false);
        setReadingComplete(true);
        isReadingStoryRef.current = false;
        
        // Stop background music when reading ends
        if (backgroundAudioRef.current) {
          backgroundAudioRef.current.pause();
          backgroundAudioRef.current.currentTime = 0;
        }
        
        console.log('Reading completed - quiz should appear');
      }
    };

    utterance.onerror = (event) => {
      // Only log actual errors, not interruptions which are expected
      if (event.error !== 'interrupted') {
        console.error('Speech synthesis error:', event);
        stopReading();
      }
    };

    speechSynthesis.speak(utterance);
  };

  const toggleReading = () => {
    console.log('Toggle reading, current state:', isReading);
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
    if (!currentBook) return;

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
        background_music_url: updatedContent.backgroundMusic,
        quiz_data: updatedContent.quiz,
        book_id: currentBook.id
      });

      // Refresh the story data to ensure consistency
      await refreshStoryData();
    } catch (err) {
      console.error('Failed to update page content:', err);
      setError('Failed to save changes to database');
      throw err;
    }
  };

  const addQuizAnswer = (answer: QuizAnswer) => {
    setQuizAnswers(prev => {
      // Remove any existing answer for this page and add the new one
      const filtered = prev.filter(a => a.pageTitle !== answer.pageTitle);
      return [...filtered, answer];
    });
  };

  const resetQuizAnswers = () => {
    setQuizAnswers([]);
  };

  // Reset word tracking when page changes
  useEffect(() => {
    resetPageState();
  }, [currentPage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopReading();
      if (backgroundAudioRef.current) {
        backgroundAudioRef.current.pause();
        backgroundAudioRef.current = null;
      }
    };
  }, []);

  const value: BookContextType = {
    currentBook,
    currentPage,
    totalPages,
    pageContent,
    currentWord,
    isReading,
    hasStartedReading,
    readingComplete,
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
    readText,
    quizAnswers,
    addQuizAnswer,
    resetQuizAnswers,
    setCurrentBook,
    loadBookSettings,
    saveBookSettings
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