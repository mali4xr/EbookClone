import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { storyContent as initialStoryContent } from '../data/storyData';

interface BookContextType {
  currentPage: number;
  totalPages: number;
  isReading: boolean;
  isMuted: boolean;
  voiceIndex: number;
  rate: number;
  pitch: number;
  volume: number;
  currentWord: number;
  hasStartedReading: boolean;
  availableVoices: SpeechSynthesisVoice[];
  nextPage: () => void;
  prevPage: () => void;
  toggleReading: () => void;
  toggleMute: () => void;
  setVoiceIndex: (index: number) => void;
  setRate: (rate: number) => void;
  setPitch: (pitch: number) => void;
  setVolume: (volume: number) => void;
  goToPage: (page: number) => void;
  pageContent: {
    text: string;
    image: string;
    video: string;
    background: string;
    quiz?: {
      multipleChoice: {
        question: string;
        options: { text: string; isCorrect: boolean; }[];
      };
      spelling: {
        word: string;
        hint: string;
      };
      dragDrop?: {
        dragItems: { id: string; image: string; label: string }[];
        dropZones: { id: string; image: string; label: string; acceptsId: string }[];
      };
    };
  };
  updatePageContent: (content: { 
    text: string; 
    image: string; 
    video: string;
    background: string;
    quiz?: {
      multipleChoice: {
        question: string;
        options: { text: string; isCorrect: boolean; }[];
      };
      spelling: {
        word: string;
        hint: string;
      };
      dragDrop?: {
        dragItems: { id: string; image: string; label: string }[];
        dropZones: { id: string; image: string; label: string; acceptsId: string }[];
      };
    };
  }) => void;
}

const BookContext = createContext<BookContextType | undefined>(undefined);

export const useBook = () => {
  const context = useContext(BookContext);
  if (context === undefined) {
    throw new Error('useBook must be used within a BookProvider');
  }
  return context;
};

interface BookProviderProps {
  children: ReactNode;
}

export const BookProvider = ({ children }: BookProviderProps) => {
  const [storyContent, setStoryContent] = useState(initialStoryContent);
  const [currentPage, setCurrentPage] = useState(0);
  const [isReading, setIsReading] = useState(false);
  const [hasStartedReading, setHasStartedReading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [voiceIndex, setVoiceIndex] = useState(0);
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [volume, setVolume] = useState(1);
  const [currentWord, setCurrentWord] = useState(-1);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [utterance, setUtterance] = useState<SpeechSynthesisUtterance | null>(null);

  const totalPages = storyContent.length;
  const pageContent = storyContent[currentPage];

  useEffect(() => {
    const synth = window.speechSynthesis;
    const updateVoices = () => {
      const voices = synth.getVoices();
      setAvailableVoices(voices);
    };

    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = updateVoices;
    }
    
    updateVoices();

    return () => {
      if (synth.speaking) {
        synth.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (isReading && !isMuted) {
      setHasStartedReading(true);
      readCurrentPage();
    } else if (!isReading && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setCurrentWord(-1);
    }
    
    return () => {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        setCurrentWord(-1);
      }
    };
  }, [isReading, isMuted, currentPage, voiceIndex, rate, pitch, volume]);

  const readCurrentPage = () => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    
    setCurrentWord(-1);
    const text = pageContent.text;
    const utterance = new SpeechSynthesisUtterance(text);
    
    if (availableVoices.length > 0) {
      utterance.voice = availableVoices[voiceIndex];
    }
    
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;
    
    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        const textUpToChar = text.slice(0, event.charIndex);
        const wordIndex = textUpToChar.split(' ').length - 1;
        setCurrentWord(wordIndex);
      }
    };
    
    utterance.onend = () => {
      setCurrentWord(-1);
      setIsReading(false);
    };
    
    setUtterance(utterance);
    window.speechSynthesis.speak(utterance);
  };

  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const goToPage = (page: number) => {
    if (page >= 0 && page < totalPages) {
      setCurrentPage(page);
    }
  };

  const toggleReading = () => {
    setIsReading(!isReading);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (!isMuted && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setCurrentWord(-1);
    }
  };

  const updatePageContent = (content: {
    text: string;
    image: string;
    video: string;
    background: string;
    quiz?: {
      multipleChoice: {
        question: string;
        options: { text: string; isCorrect: boolean; }[];
      };
      spelling: {
        word: string;
        hint: string;
      };
      dragDrop?: {
        dragItems: { id: string; image: string; label: string }[];
        dropZones: { id: string; image: string; label: string; acceptsId: string }[];
      };
    };
  }) => {
    const newContent = [...storyContent];
    newContent[currentPage] = content;
    setStoryContent(newContent);
  };

  const value = {
    currentPage,
    totalPages,
    isReading,
    isMuted,
    voiceIndex,
    rate,
    pitch,
    volume,
    currentWord,
    hasStartedReading,
    availableVoices,
    nextPage,
    prevPage,
    toggleReading,
    toggleMute,
    setVoiceIndex,
    setRate,
    setPitch,
    setVolume,
    goToPage,
    pageContent,
    updatePageContent
  };

  return <BookContext.Provider value={value}>{children}</BookContext.Provider>;
};