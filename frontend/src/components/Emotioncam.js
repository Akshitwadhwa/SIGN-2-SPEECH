import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';

const EmotionCam = () => {
  const videoRef = useRef();
  const canvasRef = useRef();
  const intervalRef = useRef();
  const [emotion, setEmotion] = useState('neutral');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    const loadModels = async () => {
      try {
        const MODEL_URL = '/models';
        console.log('Loading models from:', MODEL_URL);
        console.log('Full URL:', window.location.origin + MODEL_URL);
        
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        console.log('TinyFaceDetector loaded');
        
        await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
        console.log('FaceExpressionNet loaded');
        
        if (mounted) {
          console.log('Models loaded successfully');
          setIsLoading(false);
          startVideo();
        }
      } catch (err) {
        console.error('Error loading models:', err);
        console.error('Error details:', err.message);
        if (mounted) {
          setError(`Failed to load AI models: ${err.message}. Please ensure the server is running and refresh the page.`);
          setIsLoading(false);
        }
      }
    };
    
    // Add a small delay to ensure the dev server is ready
    setTimeout(() => {
      loadModels();
    }, 500);

    // Cleanup interval on unmount
    return () => {
      mounted = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      // Stop video stream
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startVideo = () => {
    navigator.mediaDevices.getUserMedia({ video: { width: 720, height: 560 } })
      .then((stream) => { 
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          console.log('Video stream started');
        }
      })
      .catch((err) => {
        console.error('Camera error:', err);
        setError('Failed to access camera. Please allow camera permissions.');
      });
  };

  const handleVideoOnPlay = () => {
    console.log('Video playing, starting detection...');
    setIsDetecting(true);
    
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(async () => {
      if (videoRef.current && videoRef.current.readyState === 4) {
        try {
          const detections = await faceapi
            .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
            .withFaceExpressions();

          if (detections.length > 0) {
            const expressions = detections[0].expressions;
            console.log('Expressions:', expressions);
            
            const maxEmotion = Object.keys(expressions).reduce((a, b) => 
              expressions[a] > expressions[b] ? a : b
            );
            
            console.log('Detected emotion:', maxEmotion);
            setEmotion(maxEmotion);
          } else {
            console.log('No face detected');
          }
        } catch (err) {
          console.error('Detection error:', err);
        }
      }
    }, 500);
  };

  // Helper to map emotion string to Emoji
  const getEmoji = (emo) => {
    const map = {
      happy: '😊', sad: '😢', angry: '😠', 
      surprised: '😲', fearful: '😨', disgusted: '🤢', neutral: '😐'
    };
    return map[emo] || '😐';
  };

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <p className="text-red-600 font-semibold mb-2">⚠️ Error</p>
          <p className="text-gray-700">{error}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6 max-w-md mx-auto">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-indigo-900 font-semibold">Loading AI Models...</p>
          <p className="text-gray-600 text-sm mt-2">Please wait while we prepare emotion detection</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="relative w-full max-w-2xl mx-auto rounded-2xl overflow-hidden shadow-2xl bg-black">
        <video 
          ref={videoRef} 
          autoPlay 
          muted 
          onPlay={handleVideoOnPlay}
          width="720"
          height="560"
          className="w-full h-auto"
        />
        {/* Emotion Overlay Badge */}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
          <span className="text-2xl">{getEmoji(emotion)}</span>
          <span className="font-bold text-indigo-900 capitalize">{emotion}</span>
        </div>
        
        {/* Detection Status */}
        <div className="absolute top-4 left-4 bg-green-500/90 backdrop-blur px-3 py-1 rounded-full">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-white text-xs font-semibold">
              {isDetecting ? 'Detecting' : 'Starting...'}
            </span>
          </div>
        </div>
        
        {/* Instructions */}
        <div className="absolute bottom-4 left-4 right-4 bg-black/50 backdrop-blur px-4 py-2 rounded-lg">
          <p className="text-white text-sm text-center">
            Position your face in the camera frame for emotion detection
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmotionCam;