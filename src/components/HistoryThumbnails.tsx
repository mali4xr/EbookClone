import React from 'react';

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
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 mb-2">
        <span className="font-medium text-gray-700 text-sm">Your Drawings:</span>
      </div>
      <div className="flex overflow-x-auto gap-2 py-1 px-1 bg-white rounded-lg shadow-inner border border-gray-200 flex-1">
        {history.map((item, idx) => (
          <div key={idx} className="flex flex-col items-center">
            <div
              className={`relative flex-shrink-0 rounded-full border-4 cursor-pointer transition-transform duration-150
                ${
                  selectedHistoryIndex === idx
                    ? "border-sky-500"
                    : "border-gray-200 hover:border-purple-400 hover:scale-105"
                }
              `}
              style={{
                width: 40,
                height: 40,
                minWidth: 40,
                minHeight: 40,
                background: "#f9fafb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onClick={() => onSelectHistory(idx)}
              title={item.recognizedImage || "Drawing"}
            >
              <img
                src={"data:image/png;base64," + item.sketch}
                alt="sketch"
                className="w-full h-full object-contain rounded-full"
              />
              <button
                className="absolute top-0 right-0 bg-white rounded-full p-1 shadow hover:bg-red-100"
                style={{ transform: "translate(25%,-25%)" }}
                onClick={(e) => onDeleteHistory(idx, e)}
                aria-label="Delete"
              >
                <svg
                  width="10"
                  height="10"
                  fill="none"
                  stroke="red"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            </div>
            {/* Numbered circle below thumbnail */}
            <div
              className="mt-1 w-4 h-4 flex items-center justify-center rounded-full border-2 border-sky-400 bg-white text-sky-700 font-bold text-xs"
              style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}
            >
              {idx + 1}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryThumbnails;