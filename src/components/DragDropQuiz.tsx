import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Volume2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useBook } from '../context/BookContext';

interface DragDropQuizProps {
  dragItems: { id: string; image: string; label: string }[];
  dropZones: { id: string; image: string; label: string; acceptsId: string }[];
  onComplete: () => void;
}

const DragDropQuiz = ({ dragItems, dropZones, onComplete }: DragDropQuizProps) => {
  const { voiceIndex, rate, pitch, volume, availableVoices } = useBook();
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [completedPairs, setCompletedPairs] = useState<Set<string>>(new Set());
  const [incorrectAttempts, setIncorrectAttempts] = useState<Set<string>>(new Set());
  const [selectedItemIndex, setSelectedItemIndex] = useState(0);
  const [selectedZoneIndex, setSelectedZoneIndex] = useState(0);
  const [isKeyboardMode, setIsKeyboardMode] = useState(false);
  const [hasReadInstructions, setHasReadInstructions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Read instructions when component mounts
  useEffect(() => {
    if (!hasReadInstructions) {
      readInstructions();
      setHasReadInstructions(true);
    }
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isKeyboardMode) {
        setIsKeyboardMode(true);
      }

      const availableItems = dragItems.filter(item => !completedPairs.has(item.id));
      
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          if (e.shiftKey) {
            // Navigate drop zones
            setSelectedZoneIndex(prev => Math.max(0, prev - 1));
          } else {
            // Navigate drag items
            setSelectedItemIndex(prev => Math.max(0, prev - 1));
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (e.shiftKey) {
            // Navigate drop zones
            setSelectedZoneIndex(prev => Math.min(dropZones.length - 1, prev + 1));
          } else {
            // Navigate drag items
            setSelectedItemIndex(prev => Math.min(availableItems.length - 1, prev + 1));
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setSelectedItemIndex(prev => Math.max(0, prev - 1));
          break;
        case 'ArrowRight':
          e.preventDefault();
          setSelectedZoneIndex(prev => Math.min(dropZones.length - 1, prev + 1));
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (availableItems[selectedItemIndex] && dropZones[selectedZoneIndex]) {
            handleKeyboardDrop(availableItems[selectedItemIndex].id, dropZones[selectedZoneIndex].id);
          }
          break;
      }
    };

    if (containerRef.current) {
      containerRef.current.addEventListener('keydown', handleKeyDown);
      containerRef.current.focus();
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [selectedItemIndex, selectedZoneIndex, isKeyboardMode, dragItems, dropZones, completedPairs]);

  const readInstructions = () => {
    const instructionText = `Welcome to the drag and drop activity! Match the items on the left to their correct places on the right. You can drag with your mouse or use arrow keys to navigate and press Enter to drop. Use Shift plus arrow keys to move between drop zones.`;
    
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(instructionText);
    if (availableVoices.length > 0) {
      utterance.voice = availableVoices[voiceIndex];
    }
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    window.speechSynthesis.speak(utterance);
  };

  const playWinSound = () => {
    const audio = new Audio('/sounds/correct.mp3');
    audio.volume = volume;
    audio.play().catch(e => console.log('Audio play failed:', e));
  };

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItem(itemId);
    e.dataTransfer.effectAllowed = 'move';
    setIsKeyboardMode(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropZoneId: string) => {
    e.preventDefault();
    
    if (!draggedItem) return;

    processMatch(draggedItem, dropZoneId);
    setDraggedItem(null);
  };

  const handleKeyboardDrop = (itemId: string, dropZoneId: string) => {
    processMatch(itemId, dropZoneId);
  };

  const processMatch = (itemId: string, dropZoneId: string) => {
    const dropZone = dropZones.find(zone => zone.id === dropZoneId);
    
    if (dropZone && dropZone.acceptsId === itemId) {
      // Correct match
      setCompletedPairs(prev => new Set([...prev, itemId]));
      
      // Celebrate with confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      // Play success sound
      playWinSound();

      // Read success message
      const successText = `Excellent! You correctly matched ${dragItems.find(item => item.id === itemId)?.label} to ${dropZone.label}!`;
      const utterance = new SpeechSynthesisUtterance(successText);
      if (availableVoices.length > 0) {
        utterance.voice = availableVoices[voiceIndex];
      }
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;
      window.speechSynthesis.speak(utterance);

      // Check if all items are completed
      if (completedPairs.size + 1 === dragItems.length) {
        setTimeout(() => {
          onComplete();
        }, 1000);
      }
    } else {
      // Incorrect match
      setIncorrectAttempts(prev => new Set([...prev, `${itemId}-${dropZoneId}`]));
      
      // Read incorrect message
      const incorrectText = `That's not quite right. Try again!`;
      const utterance = new SpeechSynthesisUtterance(incorrectText);
      if (availableVoices.length > 0) {
        utterance.voice = availableVoices[voiceIndex];
      }
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;
      window.speechSynthesis.speak(utterance);
      
      // Remove incorrect attempt after animation
      setTimeout(() => {
        setIncorrectAttempts(prev => {
          const newSet = new Set(prev);
          newSet.delete(`${itemId}-${dropZoneId}`);
          return newSet;
        });
      }, 1000);
    }
  };

  const isItemCompleted = (itemId: string) => completedPairs.has(itemId);
  const isDropZoneCompleted = (dropZoneId: string) => {
    const dropZone = dropZones.find(zone => zone.id === dropZoneId);
    return dropZone && completedPairs.has(dropZone.acceptsId);
  };

  const availableItems = dragItems.filter(item => !completedPairs.has(item.id));

  return (
    <div 
      ref={containerRef}
      tabIndex={0}
      className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-800 animate__animated animate__fadeInDown">
          Drag and Drop Challenge!
        </h3>
        <button
          onClick={readInstructions}
          className="p-2 rounded-full hover:bg-purple-100 text-purple-600 animate__animated animate__pulse animate__infinite"
          aria-label="Listen to instructions again"
        >
          <Volume2 size={20} />
        </button>
      </div>

      {/* Keyboard Instructions */}
      <div className="mb-4 p-3 bg-blue-100 rounded-lg text-sm text-blue-800 animate__animated animate__fadeInDown">
        <p className="font-medium mb-1">Keyboard Controls:</p>
        <div className="flex flex-wrap gap-4 text-xs">
          <span><ArrowLeft className="inline w-3 h-3" /><ArrowRight className="inline w-3 h-3" /> Navigate items/zones</span>
          <span><ArrowUp className="inline w-3 h-3" /><ArrowDown className="inline w-3 h-3" /> Navigate items</span>
          <span>Shift + <ArrowUp className="inline w-3 h-3" /><ArrowDown className="inline w-3 h-3" /> Navigate zones</span>
          <span>Enter/Space: Drop item</span>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-8 items-start justify-center">
        {/* Draggable Items - Left Side */}
        <div className="flex-1">
          <h4 className="text-lg font-semibold mb-4 text-center text-blue-700">
            Drag These Items
          </h4>
          <div className="grid grid-cols-2 gap-4">
            {dragItems.map((item, index) => {
              const isCompleted = isItemCompleted(item.id);
              const isSelected = isKeyboardMode && !isCompleted && availableItems.findIndex(ai => ai.id === item.id) === selectedItemIndex;
              
              return (
                <div
                  key={item.id}
                  draggable={!isCompleted}
                  onDragStart={(e) => handleDragStart(e, item.id)}
                  className={`relative p-4 rounded-xl border-3 transition-all duration-300 cursor-move transform hover:scale-105 ${
                    isCompleted
                      ? 'bg-green-100 border-green-400 opacity-50 cursor-not-allowed'
                      : isSelected
                      ? 'bg-yellow-100 border-yellow-500 shadow-lg ring-2 ring-yellow-400'
                      : 'bg-white border-blue-300 hover:border-blue-500 shadow-lg hover:shadow-xl'
                  } animate__animated animate__fadeInLeft`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <img
                    src={item.image}
                    alt={item.label}
                    className="w-full h-20 object-cover rounded-lg mb-2"
                  />
                  <p className="text-sm font-medium text-center text-gray-700">
                    {item.label}
                  </p>
                  {isCompleted && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle size={24} className="text-green-500 animate__animated animate__bounceIn" />
                    </div>
                  )}
                  {isSelected && (
                    <div className="absolute -top-1 -left-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Drop Zones - Right Side */}
        <div className="flex-1">
          <h4 className="text-lg font-semibold mb-4 text-center text-purple-700">
            Drop Here
          </h4>
          <div className="grid grid-cols-2 gap-4">
            {dropZones.map((zone, index) => {
              const isCompleted = isDropZoneCompleted(zone.id);
              const isSelected = isKeyboardMode && selectedZoneIndex === index;
              
              return (
                <div
                  key={zone.id}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, zone.id)}
                  className={`relative p-4 rounded-xl border-3 border-dashed transition-all duration-300 min-h-[120px] flex flex-col items-center justify-center ${
                    isCompleted
                      ? 'bg-green-100 border-green-400'
                      : incorrectAttempts.has(`${draggedItem}-${zone.id}`)
                      ? 'bg-red-100 border-red-400 animate__animated animate__shakeX'
                      : isSelected
                      ? 'bg-yellow-100 border-yellow-500 shadow-lg ring-2 ring-yellow-400'
                      : 'bg-purple-50 border-purple-300 hover:border-purple-500 hover:bg-purple-100'
                  } animate__animated animate__fadeInRight`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <img
                    src={zone.image}
                    alt={zone.label}
                    className="w-full h-16 object-cover rounded-lg mb-2 opacity-70"
                  />
                  <p className="text-sm font-medium text-center text-gray-600">
                    {zone.label}
                  </p>
                  {isCompleted && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle size={24} className="text-green-500 animate__animated animate__bounceIn" />
                    </div>
                  )}
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="mt-6 text-center">
        <div className="flex justify-center gap-2 mb-2">
          {dragItems.map((_, index) => (
            <div
              key={index}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index < completedPairs.size ? 'bg-green-500' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
        <p className="text-sm text-gray-600">
          {completedPairs.size} of {dragItems.length} completed
        </p>
      </div>
    </div>
  );
};

export default DragDropQuiz;