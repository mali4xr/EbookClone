import React, { useState } from 'react';

interface InteractiveElementsProps {
  page: number;
}

const InteractiveElements = ({ page }: InteractiveElementsProps) => {
  const [activeElements, setActiveElements] = useState<Set<string>>(new Set());
  
  // Different interactive elements for different pages
  const getInteractiveElementsForPage = (pageNumber: number) => {
    switch(pageNumber) {
      case 0:
        return [
          { id: 'star', top: '10%', left: '10%', type: 'sparkle' },
          { id: 'sun', top: '15%', right: '20%', type: 'grow' },
        ];
      case 1:
        return [
          { id: 'bird1', top: '20%', left: '30%', type: 'move' },
          { id: 'bird2', top: '40%', right: '25%', type: 'move' },
        ];
      case 2:
        return [
          { id: 'butterfly', bottom: '30%', right: '20%', type: 'float' },
          { id: 'flower', bottom: '15%', left: '25%', type: 'bloom' },
        ];
      // Add more cases for additional pages
      default:
        return [];
    }
  };
  
  const elements = getInteractiveElementsForPage(page);
  
  const handleElementClick = (id: string) => {
    setActiveElements(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
    
    // Play a sound when element is clicked
    const audio = new Audio(`/sounds/${id}.mp3`);
    audio.volume = 0.3;
    audio.play().catch(e => console.log('Audio play failed:', e));
  };

  return (
    <>
      {elements.map(element => {
        const isActive = activeElements.has(element.id);
        
        let animationClass = '';
        switch(element.type) {
          case 'sparkle':
            animationClass = isActive ? 'animate-sparkle' : '';
            break;
          case 'grow':
            animationClass = isActive ? 'animate-grow' : '';
            break;
          case 'move':
            animationClass = isActive ? 'animate-float-horizontal' : '';
            break;
          case 'float':
            animationClass = isActive ? 'animate-float' : '';
            break;
          case 'bloom':
            animationClass = isActive ? 'animate-bloom' : '';
            break;
        }
        
        return (
          <button
            key={element.id}
            onClick={() => handleElementClick(element.id)}
            className={`absolute w-12 h-12 bg-yellow-400/20 hover:bg-yellow-400/40 rounded-full cursor-pointer transition-all ${animationClass}`}
            style={{
              top: element.top,
              left: element.left,
              right: element.right,
              bottom: element.bottom
            }}
            aria-label={`Interactive ${element.id}`}
          >
            <div className="absolute inset-0 rounded-full bg-yellow-200/50 animate-ping opacity-75" />
          </button>
        );
      })}
    </>
  );
};

export default InteractiveElements;