import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, Volume2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useBook } from '../context/BookContext';

interface DragDropQuizProps {
  dragItems: { id: string; image: string; label: string }[];
  dropZones: { id: string; image: string; label: string; acceptsId: string }[];
  instructions?: string;
  onComplete: () => void;
}

const DragDropQuiz = ({ dragItems, dropZones, instructions, onComplete }: DragDropQuizProps) => {
  const { voiceIndex, rate, pitch, volume, availableVoices } = useBook();
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [completedPairs, setCompletedPairs] = useState<Set<string>>(new Set());
  const [incorrectAttempts, setIncorrectAttempts] = useState<Set<string>>(new Set());
  const [selectedItemIndex, setSelectedItemIndex] = useState(0);
  const [isKeyboardMode, setIsKeyboardMode] = useState(false);
  const [hasReadInstructions, setHasReadInstructions] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragItemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const dropZoneRefs = useRef<(HTMLDivElement | null)[]>([]);

  const defaultInstructions = "Use arrow keys to move items around, then press Enter to drop them in the right place!";

  // Read instructions when component mounts
  useEffect(() => {
    if (!hasReadInstructions) {
      readInstructions();
      setHasReadInstructions(true);
    }
  }, []);

  // Simple keyboard navigation - only arrow keys and Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isKeyboardMode) {
        setIsKeyboardMode(true);
      }

      const availableItems = dragItems.filter(item => !completedPairs.has(item.id));
      
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          setSelectedItemIndex(prev => Math.max(0, prev - 1));
          moveSelectedItem('up');
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedItemIndex(prev => Math.min(availableItems.length - 1, prev + 1));
          moveSelectedItem('down');
          break;
        case 'ArrowLeft':
          e.preventDefault();
          moveSelectedItem('left');
          break;
        case 'ArrowRight':
          e.preventDefault();
          moveSelectedItem('right');
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (availableItems[selectedItemIndex]) {
            handleKeyboardDrop(availableItems[selectedItemIndex].id);
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
  }, [selectedItemIndex, isKeyboardMode, dragItems, completedPairs]);

  const moveSelectedItem = (direction: 'up' | 'down' | 'left' | 'right') => {
    const availableItems = dragItems.filter(item => !completedPairs.has(item.id));
    const currentItem = availableItems[selectedItemIndex];
    if (!currentItem) return;

    const currentElement = dragItemRefs.current[dragItems.findIndex(item => item.id === currentItem.id)];
    if (!currentElement) return;

    const moveDistance = 20;
    const currentPos = dragPosition;

    let newX = currentPos.x;
    let newY = currentPos.y;

    switch (direction) {
      case 'up':
        newY = Math.max(-100, currentPos.y - moveDistance);
        break;
      case 'down':
        newY = Math.min(100, currentPos.y + moveDistance);
        break;
      case 'left':
        newX = Math.max(-100, currentPos.x - moveDistance);
        break;
      case 'right':
        newX = Math.min(200, currentPos.x + moveDistance);
        break;
    }

    setDragPosition({ x: newX, y: newY });
    setIsDragging(true);

    // Reset dragging state after animation
    setTimeout(() => setIsDragging(false), 200);
  };

  const readInstructions = () => {
    const instructionText = instructions || defaultInstructions;
    
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

  const playCorrectSound = () => {
    // Create a simple success sound using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
    oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
    oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
    
    gainNode.gain.setValueAtTime(volume * 0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const playIncorrectSound = () => {
    // Create a gentle "try again" sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(220, audioContext.currentTime); // A3
    oscillator.frequency.setValueAtTime(196, audioContext.currentTime + 0.2); // G3
    
    gainNode.gain.setValueAtTime(volume * 0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.4);
  };

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItem(itemId);
    e.dataTransfer.effectAllowed = 'move';
    setIsKeyboardMode(false);
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDragPosition({ x: 0, y: 0 });
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
    setIsDragging(false);
    setDragPosition({ x: 0, y: 0 });
  };

  const handleKeyboardDrop = (itemId: string) => {
    // Find the closest drop zone based on current position
    const dropZone = findClosestDropZone();
    if (dropZone) {
      processMatch(itemId, dropZone.id);
      setDragPosition({ x: 0, y: 0 });
      setIsDragging(false);
    }
  };

  const findClosestDropZone = () => {
    // Simple logic: if moved significantly right, assume they want to drop
    if (dragPosition.x > 50) {
      return dropZones[0]; // Return first available drop zone for simplicity
    }
    return null;
  };

  const processMatch = (itemId: string, dropZoneId: string) => {
    const dropZone = dropZones.find(zone => zone.id === dropZoneId);
    const dragItem = dragItems.find(item => item.id === itemId);
    
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
      playCorrectSound();

      // Read success message
      const successText = `Excellent! You correctly matched ${dragItem?.label} to ${dropZone.label}!`;
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
      
      // Play gentle incorrect sound
      playIncorrectSound();
      
      // Read encouraging message
      const incorrectText = `That's not quite right. Try again! You can do it!`;
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
          Match the Items! 🎯
        </h3>
        <button
          onClick={readInstructions}
          className="p-3 rounded-full bg-purple-100 hover:bg-purple-200 text-purple-600 transition-all duration-300 transform hover:scale-110 animate__animated animate__pulse animate__infinite"
          aria-label="Listen to instructions again"
        >
          <Volume2 size={24} />
        </button>
      </div>

      {/* Simple Instructions */}
      <div className="mb-6 p-4 bg-blue-100 rounded-xl text-center animate__animated animate__fadeInDown">
        <p className="text-lg font-medium text-blue-800 mb-2">How to Play:</p>
        <div className="text-blue-700">
          <p className="text-base">🖱️ <strong>Mouse:</strong> Drag items to the right side</p>
          <p className="text-base">⌨️ <strong>Keyboard:</strong> Use arrow keys to move, Enter to drop</p>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-8 items-start justify-center">
        {/* Draggable Items - Left Side */}
        <div className="flex-1" rounded-xl>
          <h4 className="text-xl font-semibold mb-6 text-center text-blue-700 animate__animated animate__fadeInLeft">
            🎪 Items to Match
          </h4>
          <div className="grid grid-cols-1 gap-6">
            {dragItems.map((item, index) => {
              const isCompleted = isItemCompleted(item.id);
              const isSelected = isKeyboardMode && !isCompleted && availableItems.findIndex(ai => ai.id === item.id) === selectedItemIndex;
              const itemIndex = dragItems.findIndex(i => i.id === item.id);
              
              return (
                <div
                  key={item.id}
                  ref={el => dragItemRefs.current[itemIndex] = el}
                  draggable={!isCompleted}
                  onDragStart={(e) => handleDragStart(e, item.id)}
                  onDragEnd={handleDragEnd}
                  className={`relative p-6 rounded-2xl border-4 transition-all duration-300 cursor-move transform ${
                    isCompleted
                      ? 'bg-green-100 border-green-400 opacity-75 cursor-not-allowed scale-95'
                      : isSelected
                      ? 'bg-yellow-100 border-yellow-500 shadow-2xl ring-4 ring-yellow-400 scale-110'
                      : isDragging && draggedItem === item.id
                      ? 'bg-blue-100 border-blue-500 shadow-2xl scale-105 rotate-3'
                      : 'bg-white border-purple-300 hover:border-purple-500 shadow-xl hover:shadow-2xl hover:scale-105'
                  } animate__animated animate__fadeInLeft`}
                  style={{ 
                    animationDelay: `${index * 0.2}s`,
                    transform: isSelected ? `translate(${dragPosition.x}px, ${dragPosition.y}px) scale(1.1)` : undefined,
                    transition: 'all 0.3s ease-out'
                  }}
                >
                  <img
                    src={item.image}
                    alt={item.label}
                    className="w-full h-32 object-cover rounded-xl mb-4 border-2 border-white shadow-md"
                  />
                  <p className="text-lg font-bold text-center text-gray-700">
                    {item.label}
                  </p>
                  {isCompleted && (
                    <div className="absolute -top-2 -right-2">
                      <CheckCircle size={32} className="text-green-500 bg-white rounded-full animate__animated animate__bounceIn" />
                    </div>
                  )}
                  {isSelected && (
                    <div className="absolute -top-2 -left-2 w-6 h-6 bg-yellow-400 rounded-full animate-ping" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Drop Zones - Right Side */}
        <div className="flex-1">
          <h4 className="text-xl font-semibold mb-6 text-center text-purple-700 animate__animated animate__fadeInRight">
            🎯 Drop Here
          </h4>
          <div className="grid grid-cols-1 gap-6">
            {dropZones.map((zone, index) => {
              const isCompleted = isDropZoneCompleted(zone.id);
              
              return (
                <div
                  key={zone.id}
                  ref={el => dropZoneRefs.current[index] = el}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, zone.id)}
                  className={`relative p-6 rounded-2xl border-4 border-dashed transition-all duration-300 min-h-[180px] flex flex-col items-center justify-center ${
                    isCompleted
                      ? 'bg-green-100 border-green-400 scale-105'
                      : incorrectAttempts.has(`${draggedItem}-${zone.id}`)
                      ? 'bg-red-100 border-red-400 animate__animated animate__shakeX'
                      : 'bg-purple-50 border-purple-300 hover:border-purple-500 hover:bg-purple-100 hover:scale-105'
                  } animate__animated animate__fadeInRight`}
                  style={{ animationDelay: `${index * 0.2}s` }}
                >
                  <img
                    src={zone.image}
                    alt={zone.label}
                    className="w-full h-24 object-cover rounded-xl mb-4 opacity-70 border-2 border-white shadow-md"
                  />
                  <p className="text-lg font-bold text-center text-gray-600">
                    {zone.label}
                  </p>
                  {isCompleted && (
                    <div className="absolute -top-2 -right-2">
                      <CheckCircle size={32} className="text-green-500 bg-white rounded-full animate__animated animate__bounceIn" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="mt-8 text-center">
        <div className="flex justify-center gap-3 mb-4">
          {dragItems.map((_, index) => (
            <div
              key={index}
              className={`w-4 h-4 rounded-full transition-all duration-500 ${
                index < completedPairs.size ? 'bg-green-500 scale-125' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
        <p className="text-lg font-medium text-gray-600">
          {completedPairs.size} of {dragItems.length} completed! 
          {completedPairs.size === dragItems.length ? ' 🎉 Amazing job!' : ' Keep going! 💪'}
        </p>
      </div>
    </div>
  );
};

export default DragDropQuiz;