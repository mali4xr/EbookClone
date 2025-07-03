import React, { useEffect, useState } from 'react';
import { Camera, X, RotateCcw, Zap } from 'lucide-react';

interface WebcamModalProps {
  showWebcam: boolean;
  webcamVideoRef: React.RefObject<HTMLVideoElement>;
  onCapture: () => void;
  onCancel: () => void;
}

const WebcamModal: React.FC<WebcamModalProps> = ({
  showWebcam,
  webcamVideoRef,
  onCapture,
  onCancel
}) => {
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (showWebcam && webcamVideoRef.current) {
      const video = webcamVideoRef.current;
      
      const handleLoadedMetadata = () => {
        setIsVideoReady(true);
        setError(null);
      };
      
      const handleError = () => {
        setError('Failed to load camera');
        setIsVideoReady(false);
      };

      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('error', handleError);

      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('error', handleError);
      };
    } else {
      setIsVideoReady(false);
      setError(null);
    }
  }, [showWebcam, webcamVideoRef]);

  if (!showWebcam) return null;

  return (
    <div className="absolute inset-0 bg-white rounded-2xl border-4 border-blue-500 shadow-2xl flex flex-col overflow-hidden z-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Camera size={20} />
          </div>
          <div>
            <h3 className="font-bold text-lg">Photo Capture</h3>
            <p className="text-sm opacity-90">Draw on paper & capture</p>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
          aria-label="Close camera"
        >
          <X size={20} />
        </button>
      </div>

      {/* Instructions */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 border-b border-blue-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">✏️</span>
          </div>
          <p className="text-blue-800 font-medium">
            Draw your picture on paper and hold it up to the camera
          </p>
        </div>
      </div>

      {/* Video Container */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
        {error ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Camera size={32} className="text-red-500" />
            </div>
            <h4 className="text-lg font-bold text-red-600 mb-2">Camera Error</h4>
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={onCancel}
              className="px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-semibold"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="relative max-w-md w-full">
            <video
              ref={webcamVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full rounded-2xl border-4 border-white shadow-2xl transition-opacity duration-300 ${
                isVideoReady ? 'opacity-100' : 'opacity-50'
              }`}
              style={{ aspectRatio: '4/3' }}
            />
            
            {!isVideoReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-200 rounded-2xl">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500 mx-auto mb-3"></div>
                  <p className="text-gray-600 font-medium">Starting camera...</p>
                </div>
              </div>
            )}

            {/* Camera frame overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-3 left-3 w-8 h-8 border-l-4 border-t-4 border-white rounded-tl-xl"></div>
              <div className="absolute top-3 right-3 w-8 h-8 border-r-4 border-t-4 border-white rounded-tr-xl"></div>
              <div className="absolute bottom-3 left-3 w-8 h-8 border-l-4 border-b-4 border-white rounded-bl-xl"></div>
              <div className="absolute bottom-3 right-3 w-8 h-8 border-r-4 border-b-4 border-white rounded-br-xl"></div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-white p-6 border-t border-gray-200">
        <div className="flex gap-4 justify-center">
          <button
            onClick={onCapture}
            disabled={!isVideoReady}
            className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <Zap size={24} />
            <span>Capture & Use AI</span>
          </button>
          
          <button
            onClick={onCancel}
            className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-bold rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            <X size={24} />
            <span>Cancel</span>
          </button>
        </div>
        
        {/* Tips */}
        <div className="mt-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-xl">
            <span className="text-yellow-600">💡</span>
            <p className="text-yellow-800 text-sm font-medium">
              Make sure your drawing is well-lit and fills most of the camera view
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebcamModal;