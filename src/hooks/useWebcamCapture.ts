import { useRef, useState, useEffect, useCallback } from 'react';

export const useWebcamCapture = () => {
  const webcamRef = useRef<HTMLVideoElement>(null);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);

  useEffect(() => {
    const getCameras = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setAvailableCameras(videoDevices);
        console.log('Available cameras:', videoDevices);
      } catch (error) {
        console.error('Error getting cameras:', error);
      }
    };

    getCameras();
  }, []);

  const startWebcam = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'environment'
        } 
      });
      
      if (webcamRef.current) {
        webcamRef.current.srcObject = stream;
        setIsWebcamActive(true);
      }
    } catch (error) {
      console.error('Error accessing webcam:', error);
      throw new Error('Could not access camera. Please check permissions.');
    }
  }, []);

  const stopWebcam = useCallback(() => {
    if (webcamRef.current && webcamRef.current.srcObject) {
      const stream = webcamRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      webcamRef.current.srcObject = null;
      setIsWebcamActive(false);
    }
  }, []);

  const capturePhoto = useCallback(() => {
    if (!webcamRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = webcamRef.current.videoWidth;
    canvas.height = webcamRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(webcamRef.current, 0, 0);
      const photoDataUrl = canvas.toDataURL('image/png');
      setCapturedPhoto(photoDataUrl);
      stopWebcam();
    }
  }, [stopWebcam]);

  const switchCamera = useCallback(async () => {
    if (availableCameras.length <= 1) {
      console.log('Only one camera available');
      return;
    }

    const nextIndex = (currentCameraIndex + 1) % availableCameras.length;
    setCurrentCameraIndex(nextIndex);
    
    setCapturedPhoto(null);
    
    console.log(`Switching to camera ${nextIndex + 1}/${availableCameras.length}:`, availableCameras[nextIndex]);
  }, [availableCameras, currentCameraIndex]);

  const getCurrentCameraConstraints = useCallback(() => {
    if (availableCameras.length > 0 && availableCameras[currentCameraIndex]) {
      return {
        width: 320,
        height: 240,
        deviceId: { exact: availableCameras[currentCameraIndex].deviceId }
      };
    }
    
    return {
      width: 320,
      height: 240,
      facingMode: 'user'
    };
  }, [availableCameras, currentCameraIndex]);

  const retakePhoto = useCallback(() => {
    setCapturedPhoto(null);
    startWebcam();
  }, [startWebcam]);

  return {
    webcamRef,
    isWebcamActive,
    capturedPhoto,
    availableCameras,
    currentCameraIndex,
    startWebcam,
    stopWebcam,
    capturePhoto,
    switchCamera,
    getCurrentCameraConstraints,
    retakePhoto,
    setCapturedPhoto
  };
};