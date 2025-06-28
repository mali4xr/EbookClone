import React from 'react';
import { Camera } from 'lucide-react';

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
  if (!showWebcam) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 shadow-2xl flex flex-col">
        <video
          ref={webcamVideoRef}
          autoPlay
          playsInline
          width={320}
          height={240}
          className="rounded-lg border mb-4"
        />
        <div className="flex gap-4">
          <button
            onClick={onCapture}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-lg"
          >
            Capture & Use
          </button>
          <button
            onClick={onCancel}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default WebcamModal;