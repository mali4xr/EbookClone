import React, { useState } from 'react';
import { X, Edit, MessageCircle, Info } from 'lucide-react';
import { useBook } from '../context/BookContext';
import EditPageModal from './EditPageModal';
import ConversationalAIButton from './ConversationalAIButton';
import { ElevenLabsService } from '../services/ElevenLabsService';
import { GeminiService } from '../services/GeminiService';

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

  const handleAIMessage = (message: any) => {
    console.log('Settings AI Message:', message);
  };

  const getSettingsAIContext = () => {
    return `You are helping configure settings for a children's reading app. 
    Current voice settings:
    - Voice: ${availableVoices[voiceIndex]?.name || 'Default'}
    - Speed: ${rate}x
    - Pitch: ${pitch}
    - Volume: ${Math.round(volume * 100)}%
    
    AI Configuration Status:
    - ElevenLabs: ${ElevenLabsService.isConfigured() ? 'Configured' : 'Not configured'}
    - Gemini API: ${GeminiService.getApiKey() ? 'Configured' : 'Not configured'}
    
    You can help with:
    - Explaining what each setting does
    - Recommending optimal settings for children
    - Troubleshooting voice or audio issues
    - Suggesting accessibility improvements
    - Explaining OCR and Gemini integration
    
    Be helpful and explain technical concepts in simple terms.`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 animate__animated animate__fadeIn">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate__animated animate__slideInDown relative z-[101]">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800 animate__animated animate__fadeInLeft">Settings</h2>
          <div className="flex items-center gap-2">
            <button 
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-100 animate__animated animate__fadeInRight"
            >
              <X size={24} />
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          {/* AI Assistant Section */}
          <div className="space-y-4 animate__animated animate__fadeInUp">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <MessageCircle size={20} className="text-purple-600" />
              AI Assistant
            </h3>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-purple-700 mb-3">
                Get help with reading, understanding the story, and quiz questions from our AI assistant.
              </p>
              <div className="relative z-[102]">
                <ConversationalAIButton
                  context={getSettingsAIContext()}
                  onMessage={handleAIMessage}
                  className="animate__animated animate__fadeInDown"
                />
              </div>
            </div>
          </div>

          {/* Voice Selection */}
          <div className="space-y-2 animate__animated animate__fadeInUp animate__delay-2s">
            <label htmlFor="voice-select" className="block text-sm font-medium text-gray-700">
              Character Voice
            </label>
            <select
              id="voice-select"
              value={voiceIndex}
              onChange={(e) => setVoiceIndex(Number(e.target.value))}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
            >
              {availableVoices.map((voice, index) => (
                <option key={index} value={index}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
          </div>
          
          {/* Speed Control */}
          <div className="space-y-2 animate__animated animate__fadeInUp animate__delay-3s">
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
          <div className="space-y-2 animate__animated animate__fadeInUp animate__delay-4s">
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
          <div className="space-y-2 animate__animated animate__fadeInUp animate__delay-5s">
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
          <div className="space-y-2 animate__animated animate__fadeInUp animate__delay-6s">
            <button
              onClick={() => setShowEdit(true)}
              className="w-full flex items-center justify-center gap-2 p-3 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-all duration-300 transform hover:scale-105"
            >
              <Edit size={20} />
              <span>Edit Current Page</span>
            </button>
          </div>
        </div>
        
        <div className="p-4 border-t flex justify-end animate__animated animate__fadeInUp animate__delay-7s">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-all duration-300 shadow-sm transform hover:scale-105"
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