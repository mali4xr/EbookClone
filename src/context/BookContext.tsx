import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { storyContent as initialStoryContent } from '../data/storyData';
import { TavusClient } from 'tavus-js';

const tavus = new TavusClient('22dd0f54ba6c443ba15f03990f302a1b');

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
    };
  };
  updatePageContent: (content: { 
    text: string; 
    image: string; 
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
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

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
      if (audioElement) {
        audioElement.pause();
      }
    };
  }, []);

  useEffect(() => {
    if (isReading && !isMuted) {
      setHasStartedReading(true);
      readCurrentPage();
    } else if (!isReading && audioElement) {
      audioElement.pause();
      setCurrentWord(-1);
    }
    
    return () => {
      if (audioElement) {
        audioElement.pause();
        setCurrentWord(-1);
      }
    };
  }, [isReading, isMuted, currentPage]);

  const readCurrentPage = async () => {
    if (audioElement) {
      audioElement.pause();
    }
    
    setCurrentWord(-1);
    const text = pageContent.text;

    try {
      // Generate audio using Tavus AI
      const response = await tavus.generateAudio({
        text,
        voiceId: 'default', // Use your preferred Tavus voice ID
      });

      const audio = new Audio(response.audioUrl);
      audio.volume = volume;
      
      audio.onplay = () => {
        // Start word highlighting
        const words = text.split(' ');
        let wordIndex = 0;
        const wordDuration = audio.duration / words.length;
        
        const highlightInterval = setInterval(() => {
          setCurrentWord(wordIndex);
          wordIndex++;
          
          if (wordIndex >= words.length) {
            clearInterval(highlightInterval);
            setCurrentWord(-1);
            setIsReading(false);
          }
        }, wordDuration * 1000);

        audio.onended = () => {
          clearInterval(highlightInterval);
          setCurrentWord(-1);
          setIsReading(false);
        };
      };

      setAudioElement(audio);
      audio.play();
    } catch (error) {
      console.error('Error generating Tavus audio:', error);
      setIsReading(false);
    }
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
    if (!isMuted && audioElement) {
      audioElement.pause();
      setCurrentWord(-1);
    }
  };

  const updatePageContent = (content: {
    text: string;
    image: string;
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