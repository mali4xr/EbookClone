import React, { useEffect, useState } from 'react';
import { Camera, X, RotateCcw } from 'lucide-react';

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
    <div className="absolute inset-0 bg-white rounded-2xl border-4 border-blue-500 shadow-2xl flex flex-col overflow-hidden z-40">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera size={20} />
          <span className="font-bold text-sm">Draw on Paper & Capture</span>
        </div>
        <button
          onClick={onCancel}
          className="p-1 rounded-full hover:bg-white/20 transition-colors"
          aria-label="Close camera"
        >
          <X size={20} />
        </button>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 p-3 border-b border-blue-200">
        <p className="text-blue-800 text-sm font-medium text-center">
          📝 Draw your picture on paper and hold it up to the camera
        </p>
      </div>

      {/* Video Container */}
      <div className="flex-1 flex items-center justify-center p-4 bg-gray-100">
        {error ? (
          <div className="text-center">
            <div className="text-red-500 mb-2">
              <Camera size={48} className="mx-auto" />
            </div>
            <p className="text-red-600 font-medium">{error}</p>
            <button
              onClick={onCancel}
              className="mt-3 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="relative">
            <video
              ref={webcamVideoRef}
              autoPlay
              playsInline
              muted
              className={`rounded-lg border-2 border-gray-300 shadow-lg transition-opacity duration-300 ${
                isVideoReady ? 'opacity-100' : 'opacity-50'
              }`}
              style={{
                width: '100%',
                maxWidth: '400px',
                height: 'auto',
                aspectRatio: '4/3'
              }}
            />
            
            {/* Loading overlay */}
            {!isVideoReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-200 rounded-lg">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                  <p className="text-gray-600 text-sm">Starting camera...</p>
                </div>
              </div>
            )}

            {/* Camera frame overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-2 left-2 w-6 h-6 border-l-4 border-t-4 border-white rounded-tl-lg"></div>
              <div className="absolute top-2 right-2 w-6 h-6 border-r-4 border-t-4 border-white rounded-tr-lg"></div>
              <div className="absolute bottom-2 left-2 w-6 h-6 border-l-4 border-b-4 border-white rounded-bl-lg"></div>
              <div className="absolute bottom-2 right-2 w-6 h-6 border-r-4 border-b-4 border-white rounded-br-lg"></div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-white p-4 border-t border-gray-200">
        <div className="flex gap-3 justify-center">
          <button
            onClick={onCapture}
            disabled={!isVideoReady}
            className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg shadow-md transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <Camera size={20} />
            Capture & Use
          </button>
          <button
            onClick={onCancel}
            className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg shadow-md transform hover:scale-105 transition-all duration-200"
          >
            <X size={20} />
            Cancel
          </button>
        </div>
        
        {/* Tips */}
        <div className="mt-3 text-center">
          <p className="text-gray-600 text-xs">
            💡 Tip: Make sure your drawing is well-lit and fills most of the camera view
          </p>
        </div>
      </div>
    </div>
  );
};

export default WebcamModal;