import React from 'react';
import { Trash2 } from 'lucide-react';

interface HistoryItem {
  sketch: string;
  generated: string;
  recognizedImage: string;
  prompt: string;
  story: string;
  storyImageBase64?: string;
}

interface HistoryThumbnailsProps {
  history: HistoryItem[];
  selectedHistoryIndex: number | null;
  onSelectHistory: (index: number) => void;
  onDeleteHistory: (index: number, e: React.MouseEvent) => void;
}

const HistoryThumbnails: React.FC<HistoryThumbnailsProps> = ({
  history,
  selectedHistoryIndex,
  onSelectHistory,
  onDeleteHistory
}) => {
  if (history.length === 0) return null;

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-purple-200 overflow-hidden">
      <div className="bg-gradient-to-r from-purple-500 to-pink-500">
        <h3 className="text-white font-bold text-xl flex items-center gap-2">
          🎨 Your Art Gallery ({history.length}/10)
        </h3>
      </div>
      
      <div>
        <div className="flex overflow-x-auto gap-2 pb-1">
          {history.map((item, idx) => (
            <div key={idx} className="flex flex-col items-center flex-shrink-0">
              <div
                className={`relative rounded-2xl border-4 cursor-pointer transition-all duration-300 transform hover:scale-90 ${
                  selectedHistoryIndex === idx
                    ? "border-purple-500 scale-90 shadow-xl"
                    : "border-gray-200 hover:border-purple-300 shadow-lg"
                }`}
                style={{
                  width: 70,
                  height: 70,
                  minWidth: 70,
                  minHeight: 70,
                }}
                onClick={() => onSelectHistory(idx)}
                title={item.recognizedImage || "Drawing"}
              >
                <img
                  src={"data:image/png;base64," + item.sketch}
                  alt="sketch"
                  className="w-full h-full object-cover rounded-xl"
                />
                
                <button
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200 transform hover:scale-110"
                  onClick={(e) => onDeleteHistory(idx, e)}
                  aria-label="Delete"
                >
                  <Trash2 size={12} />
                </button>

                <div className="translate-y+1
  w-6 h-6 flex items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold text-sm shadow-lg">
                {idx + 1}
              </div>
                
              </div>
              
              
              
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HistoryThumbnails;