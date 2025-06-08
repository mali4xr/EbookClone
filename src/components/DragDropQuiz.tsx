import React, { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface DragDropQuizProps {
  dragItems: { id: string; image: string; label: string }[];
  dropZones: { id: string; image: string; label: string; acceptsId: string }[];
  onComplete: () => void;
}

const DragDropQuiz = ({ dragItems, dropZones, onComplete }: DragDropQuizProps) => {
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [completedPairs, setCompletedPairs] = useState<Set<string>>(new Set());
  const [incorrectAttempts, setIncorrectAttempts] = useState<Set<string>>(new Set());

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItem(itemId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropZoneId: string) => {
    e.preventDefault();
    
    if (!draggedItem) return;

    const dropZone = dropZones.find(zone => zone.id === dropZoneId);
    
    if (dropZone && dropZone.acceptsId === draggedItem) {
      // Correct match
      setCompletedPairs(prev => new Set([...prev, draggedItem]));
      
      // Celebrate with confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      // Play success sound
      const audio = new Audio('/sounds/correct.mp3');
      audio.volume = 0.5;
      audio.play().catch(e => console.log('Audio play failed:', e));

      // Check if all items are completed
      if (completedPairs.size + 1 === dragItems.length) {
        setTimeout(() => {
          onComplete();
        }, 1000);
      }
    } else {
      // Incorrect match
      setIncorrectAttempts(prev => new Set([...prev, `${draggedItem}-${dropZoneId}`]));
      
      // Remove incorrect attempt after animation
      setTimeout(() => {
        setIncorrectAttempts(prev => {
          const newSet = new Set(prev);
          newSet.delete(`${draggedItem}-${dropZoneId}`);
          return newSet;
        });
      }, 1000);
    }
    
    setDraggedItem(null);
  };

  const isItemCompleted = (itemId: string) => completedPairs.has(itemId);
  const isDropZoneCompleted = (dropZoneId: string) => {
    const dropZone = dropZones.find(zone => zone.id === dropZoneId);
    return dropZone && completedPairs.has(dropZone.acceptsId);
  };

  return (
    <div className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl">
      <h3 className="text-xl font-bold text-center mb-6 text-gray-800 animate__animated animate__fadeInDown">
        Drag and Drop Challenge!
      </h3>
      
      <div className="flex flex-col md:flex-row gap-8 items-start justify-center">
        {/* Draggable Items - Left Side */}
        <div className="flex-1">
          <h4 className="text-lg font-semibold mb-4 text-center text-blue-700">
            Drag These Items
          </h4>
          <div className="grid grid-cols-2 gap-4">
            {dragItems.map((item) => (
              <div
                key={item.id}
                draggable={!isItemCompleted(item.id)}
                onDragStart={(e) => handleDragStart(e, item.id)}
                className={`relative p-4 rounded-xl border-3 transition-all duration-300 cursor-move transform hover:scale-105 ${
                  isItemCompleted(item.id)
                    ? 'bg-green-100 border-green-400 opacity-50 cursor-not-allowed'
                    : 'bg-white border-blue-300 hover:border-blue-500 shadow-lg hover:shadow-xl'
                } animate__animated animate__fadeInLeft`}
                style={{ animationDelay: `${dragItems.indexOf(item) * 0.1}s` }}
              >
                <img
                  src={item.image}
                  alt={item.label}
                  className="w-full h-20 object-cover rounded-lg mb-2"
                />
                <p className="text-sm font-medium text-center text-gray-700">
                  {item.label}
                </p>
                {isItemCompleted(item.id) && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle size={24} className="text-green-500 animate__animated animate__bounceIn" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Drop Zones - Right Side */}
        <div className="flex-1">
          <h4 className="text-lg font-semibold mb-4 text-center text-purple-700">
            Drop Here
          </h4>
          <div className="grid grid-cols-2 gap-4">
            {dropZones.map((zone) => (
              <div
                key={zone.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, zone.id)}
                className={`relative p-4 rounded-xl border-3 border-dashed transition-all duration-300 min-h-[120px] flex flex-col items-center justify-center ${
                  isDropZoneCompleted(zone.id)
                    ? 'bg-green-100 border-green-400'
                    : incorrectAttempts.has(`${draggedItem}-${zone.id}`)
                    ? 'bg-red-100 border-red-400 animate__animated animate__shakeX'
                    : 'bg-purple-50 border-purple-300 hover:border-purple-500 hover:bg-purple-100'
                } animate__animated animate__fadeInRight`}
                style={{ animationDelay: `${dropZones.indexOf(zone) * 0.1}s` }}
              >
                <img
                  src={zone.image}
                  alt={zone.label}
                  className="w-full h-16 object-cover rounded-lg mb-2 opacity-70"
                />
                <p className="text-sm font-medium text-center text-gray-600">
                  {zone.label}
                </p>
                {isDropZoneCompleted(zone.id) && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle size={24} className="text-green-500 animate__animated animate__bounceIn" />
                  </div>
                )}
              </div>
            ))}
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