import React, { useState } from 'react';
import { X, Edit } from 'lucide-react';
import { useBook } from '../context/BookContext';
import EditPageModal from './EditPageModal';

interface SettingsModalProps {
  onClose: () => void;
}

const SettingsModal = ({ onClose }: SettingsModalProps) => {
  const { 
    availableVoices,
    voiceIndex,
    setVoiceIndex,
    rate,
    setRate,
    pitch,
    setPitch,
    volume,
    setVolume,
    pageContent,
    updatePageContent
  } = useBook();

  const [showEdit, setShowEdit] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">Voice Settings</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Voice Selection */}
          <div className="space-y-2">
            <label htmlFor="voice-select" className="block text-sm font-medium text-gray-700">
              Character Voice
            </label>
            <select
              id="voice-select"
              value={voiceIndex}
              onChange={(e) => setVoiceIndex(Number(e.target.value))}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {availableVoices.map((voice, index) => (
                <option key={index} value={index}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
          </div>
          
          {/* Speed Control */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Reading Speed: {rate.toFixed(1)}x
            </label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className="w-full accent-purple-600"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Slow</span>
              <span>Normal</span>
              <span>Fast</span>
            </div>
          </div>
          
          {/* Pitch Control */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Voice Pitch: {pitch.toFixed(1)}
            </label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={pitch}
              onChange={(e) => setPitch(Number(e.target.value))}
              className="w-full accent-purple-600"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Low</span>
              <span>Normal</span>
              <span>High</span>
            </div>
          </div>
          
          {/* Volume Control */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Volume: {Math.round(volume * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-full accent-purple-600"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Quiet</span>
              <span>Medium</span>
              <span>Loud</span>
            </div>
          </div>

          {/* Edit Page Content */}
          <div className="space-y-2">
            <button
              onClick={() => setShowEdit(true)}
              className="w-full flex items-center justify-center gap-2 p-3 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors"
            >
              <Edit size={20} />
              <span>Edit Current Page</span>
            </button>
          </div>
        </div>
        
        <div className="p-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors shadow-sm"
          >
            Done
          </button>
        </div>

        {showEdit && (
          <EditPageModal
            onClose={() => setShowEdit(false)}
            pageContent={pageContent}
            onSave={updatePageContent}
          />
        )}
      </div>
    </div>
  );
};

export default SettingsModal;