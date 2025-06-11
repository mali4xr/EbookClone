import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, Volume2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useBook } from '../context/BookContext';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface DragDropQuizProps {
  dragItems: { id: string; image: string; label: string }[];
  dropZones: { id: string; image: string; label: string; acceptsId: string }[];
  instructions?: string;
  onComplete: () => void;
}

interface DraggableItemProps {
  id: string;
  image: string;
  label: string;
  isCompleted: boolean;
  isSelected: boolean;
}

interface DroppableZoneProps {
  id: string;
  image: string;
  label: string;
  isCompleted: boolean;
  isIncorrect: boolean;
}

const DraggableItem = ({ id, image, label, isCompleted, isSelected }: DraggableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`relative w-32 h-32 rounded-full border-4 transition-all duration-300 cursor-move transform ${
        isCompleted
          ? 'bg-green-100 border-green-400 opacity-75 cursor-not-allowed scale-95'
          : isSelected
          ? 'bg-yellow-100 border-yellow-500 shadow-2xl ring-4 ring-yellow-400 scale-110'
          : isDragging
          ? 'bg-blue-100 border-blue-500 shadow-2xl scale-105 rotate-3'
          : 'bg-white border-purple-300 hover:border-purple-500 shadow-xl hover:shadow-2xl hover:scale-105'
      } animate__animated animate__fadeInLeft flex flex-col items-center justify-center p-2`}
    >
      <img
        src={image}
        alt={label}
        className="w-20 h-20 object-cover rounded-full mb-2 border-2 border-white shadow-md"
      />
      <p className="text-sm font-bold text-center text-gray-700 leading-tight">
        {label}
      </p>
      {isCompleted && (
        <div className="absolute -top-2 -right-2">
          <CheckCircle size={24} className="text-green-500 bg-white rounded-full animate__animated animate__bounceIn" />
        </div>
      )}
      {isSelected && (
        <div className="absolute -top-2 -left-2 w-4 h-4 bg-yellow-400 rounded-full animate-ping" />
      )}
    </div>
  );
};

const DroppableZone = ({ id, image, label, isCompleted, isIncorrect }: DroppableZoneProps) => {
  const { setNodeRef } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`relative w-32 h-32 rounded-full border-4 border-dashed transition-all duration-300 ${
        isCompleted
          ? 'bg-green-100 border-green-400 scale-105'
          : isIncorrect
          ? 'bg-red-100 border-red-400 animate__animated animate__shakeX'
          : 'bg-purple-50 border-purple-300 hover:border-purple-500 hover:bg-purple-100 hover:scale-105'
      } animate__animated animate__fadeInRight flex flex-col items-center justify-center p-2`}
    >
      <img
        src={image}
        alt={label}
        className="w-16 h-16 object-cover rounded-full mb-2 opacity-70 border-2 border-white shadow-md"
      />
      <p className="text-sm font-bold text-center text-gray-600 leading-tight">
        {label}
      </p>
      {isCompleted && (
        <div className="absolute -top-2 -right-2">
          <CheckCircle size={24} className="text-green-500 bg-white rounded-full animate__animated animate__bounceIn" />
        </div>
      )}
    </div>
  );
};

const DragDropQuiz = ({ dragItems, dropZones, instructions, onComplete }: DragDropQuizProps) => {
  const { voiceIndex, rate, pitch, volume, availableVoices } = useBook();
  const [completedPairs, setCompletedPairs] = useState<Set<string>>(new Set());
  const [incorrectAttempts, setIncorrectAttempts] = useState<Set<string>>(new Set());
  const [selectedItemIndex, setSelectedItemIndex] = useState(0);
  const [hasReadInstructions, setHasReadInstructions] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const defaultInstructions = "Use arrow keys to move between items, then drag them to the matching circles!";

  // Custom keyboard sensor for simplified navigation
  const keyboardSensor = useSensor(KeyboardSensor, {
    coordinateGetter: (event, { context: { active, droppableRects, droppableContainers, collisionRect } }) => {
      if (!active || !collisionRect) return;

      const availableItems = dragItems.filter(item => !completedPairs.has(item.id));
      const currentIndex = availableItems.findIndex(item => item.id === active.id);
      
      switch (event.code) {
        case 'ArrowUp':
          event.preventDefault();
          const prevIndex = Math.max(0, currentIndex - 1);
          setSelectedItemIndex(prevIndex);
          break;
        case 'ArrowDown':
          event.preventDefault();
          const nextIndex = Math.min(availableItems.length - 1, currentIndex + 1);
          setSelectedItemIndex(nextIndex);
          break;
        case 'ArrowRight':
          // Move towards drop zone
          if (dropZones.length > 0) {
            const targetZone = dropZones[0];
            const zoneRect = droppableRects.get(targetZone.id);
            if (zoneRect) {
              return {
                x: zoneRect.left + zoneRect.width / 2,
                y: zoneRect.top + zoneRect.height / 2,
              };
            }
          }
          break;
        case 'Enter':
        case 'Space':
          event.preventDefault();
          // Auto-drop on first available zone for simplicity
          if (dropZones.length > 0) {
            handleDrop(active.id as string, dropZones[0].id);
          }
          break;
      }
      
      return collisionRect;
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    keyboardSensor
  );

  // Read instructions when component mounts
  useEffect(() => {
    if (!hasReadInstructions) {
      readInstructions();
      setHasReadInstructions(true);
    }
  }, []);

  // Focus container for keyboard navigation
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.focus();
    }
  }, []);

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

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      handleDrop(active.id as string, over.id as string);
    }
    
    setActiveId(null);
  };

  const handleDrop = (itemId: string, dropZoneId: string) => {
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
  const allItems = [...dragItems, ...dropZones];

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
          <p className="text-base">🖱️ <strong>Mouse:</strong> Drag circles to match them</p>
          <p className="text-base">⌨️ <strong>Keyboard:</strong> Arrow keys to select, Enter to match</p>
        </div>
      </div>
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-col md:flex-row gap-8 items-center justify-center">
          {/* Draggable Items - Left Side */}
          <div className="flex-1">
            <h4 className="text-xl font-semibold mb-6 text-center text-blue-700 animate__animated animate__fadeInLeft">
              🎪 Items to Match
            </h4>
            <SortableContext items={dragItems.map(item => item.id)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-wrap gap-6 justify-center">
                {dragItems.map((item, index) => {
                  const isCompleted = isItemCompleted(item.id);
                  const isSelected = !isCompleted && availableItems.findIndex(ai => ai.id === item.id) === selectedItemIndex;
                  
                  return (
                    <DraggableItem
                      key={item.id}
                      id={item.id}
                      image={item.image}
                      label={item.label}
                      isCompleted={isCompleted}
                      isSelected={isSelected}
                    />
                  );
                })}
              </div>
            </SortableContext>
          </div>

          {/* Drop Zones - Right Side */}
          <div className="flex-1">
            <h4 className="text-xl font-semibold mb-6 text-center text-purple-700 animate__animated animate__fadeInRight">
              🎯 Drop Here
            </h4>
            <SortableContext items={dropZones.map(zone => zone.id)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-wrap gap-6 justify-center">
                {dropZones.map((zone, index) => {
                  const isCompleted = isDropZoneCompleted(zone.id);
                  const isIncorrect = incorrectAttempts.has(`${activeId}-${zone.id}`);
                  
                  return (
                    <DroppableZone
                      key={zone.id}
                      id={zone.id}
                      image={zone.image}
                      label={zone.label}
                      isCompleted={isCompleted}
                      isIncorrect={isIncorrect}
                    />
                  );
                })}
              </div>
            </SortableContext>
          </div>
        </div>

        <DragOverlay>
          {activeId ? (
            <div className="w-32 h-32 rounded-full bg-blue-100 border-4 border-blue-500 shadow-2xl scale-105 rotate-3 flex flex-col items-center justify-center p-2">
              {(() => {
                const item = dragItems.find(item => item.id === activeId);
                return item ? (
                  <>
                    <img
                      src={item.image}
                      alt={item.label}
                      className="w-20 h-20 object-cover rounded-full mb-2 border-2 border-white shadow-md"
                    />
                    <p className="text-sm font-bold text-center text-gray-700 leading-tight">
                      {item.label}
                    </p>
                  </>
                ) : null;
              })()}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

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