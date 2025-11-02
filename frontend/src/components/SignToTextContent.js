import React, { useState, useRef, useEffect } from 'react';
import { Type, VideoOff, StopCircle } from 'lucide-react';
import PrimaryButton from './PrimaryButton';
import TitleIconContainer from './TitleIconContainer';

const SignToTextContent = () => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [detectedText, setDetectedText] = useState('Sign language interpretation will appear here...');
  const [cameraError, setCameraError] = useState(null);
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);

  const signs = ["HELLO", "WORLD", "HOW ARE YOU", "I AM GOOD", "THANK YOU"];
  let signIndex = 0;

  const startSimulation = () => {
    setDetectedText('');
    signIndex = 0;
    intervalRef.current = setInterval(() => {
      const nextSign = signs[signIndex % signs.length];
      setDetectedText(prev => (prev + ' ' + nextSign).trim());
      console.log(`Simulated Sign Detected: ${nextSign}`);
      signIndex++;
    }, 3000);
  };

  const handleStartCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Your browser does not support camera access.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCameraActive(true);
        startSimulation();
      }
    } catch (err) {
      console.error('Camera access denied or failed:', err);
      setCameraError(err.message || 'Camera access denied or failed. Please check permissions.');
      setIsCameraActive(false);
    }
  };

  const handleStopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (intervalRef.current) {
        clearInterval(intervalRef.current);
    }
    setIsCameraActive(false);
    setDetectedText('Camera stopped. Ready to start new session.');
  };

  useEffect(() => {
    return () => {
      handleStopCamera();
    };
  }, []);

  return (
    <div className="p-8">
      <TitleIconContainer icon={Type} colorClass="text-blue-600" title="Sign Language to Text" />

      <div className="bg-gray-800 p-2 h-96 rounded-xl shadow-inner mb-8 flex flex-col items-center justify-center relative overflow-hidden">
        <video 
          ref={videoRef} 
          className={`w-full h-full object-cover rounded-lg transform scale-x-[-1] transition-opacity duration-500 
            ${isCameraActive ? 'opacity-100' : 'opacity-0 absolute'}`}
          autoPlay 
          playsInline 
          muted 
        />

        {!isCameraActive && (
            <div className={`absolute inset-0 flex flex-col items-center justify-center p-4 rounded-xl text-center bg-gray-100 ${isCameraActive ? 'hidden' : ''}`}>
                <VideoOff className="w-12 h-12 text-gray-400 mb-4" />
                {cameraError ? (
                    <p className="text-red-500 font-medium">{cameraError}</p>
                ) : (
                    <p className="text-gray-600">Click 'Start Camera' to enable live sign language detection.</p>
                )}
            </div>
        )}
      </div>

      <div className="flex justify-center space-x-4 mb-8">
          {!isCameraActive ? (
              <PrimaryButton onClick={handleStartCamera} icon={Type} className="w-48">
                Start Camera
              </PrimaryButton>
          ) : (
              <PrimaryButton onClick={handleStopCamera} icon={StopCircle} className="w-48 bg-red-600 hover:bg-red-700">
                Stop Camera
              </PrimaryButton>
          )}
      </div>

      <h2 className="text-lg font-semibold text-gray-700 mb-3">Live Transcription:</h2>
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-inner">
        <p className="w-full h-32 bg-transparent resize-none overflow-y-auto text-gray-800 p-1">
            {detectedText}
        </p>
      </div>
    </div>
  );
};

export default SignToTextContent;
