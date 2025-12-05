import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';
import { Smile, Frown, Meh, AlertCircle, Zap, Heart, Activity, Loader2 } from 'lucide-react';

const EmotionCam = () => {
  const videoRef = useRef();
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [debugStatus, setDebugStatus] = useState("Initializing...");
  const [dominantEmotion, setDominantEmotion] = useState('neutral');
  const [emotionData, setEmotionData] = useState({
    neutral: 1, happy: 0, sad: 0, angry: 0, fearful: 0, disgusted: 0, surprised: 0
  });

  // 1. Load Models with Error Handling
  useEffect(() => {
    const loadModels = async () => {
      setDebugStatus("Loading AI Models...");
      const MODEL_URL = process.env.PUBLIC_URL + '/models';
      
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
        ]);
        setDebugStatus("Models Loaded. Starting Camera...");
        setIsModelLoaded(true);
        startVideo();
      } catch (error) {
        console.error("Model Load Error:", error);
        setDebugStatus(`Error loading models: ${error.message}. Check public/models folder.`);
      }
    };
    loadModels();
  }, []);

  const startVideo = () => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => { 
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((err) => setDebugStatus(`Camera Error: ${err.message}`));
  };

  // 2. The Detection Loop (Using Recursive Timeout for Stability)
  const runDetection = async () => {
    if (!videoRef.current || videoRef.current.paused || videoRef.current.ended || !isModelLoaded) {
      setTimeout(runDetection, 1000);
      return;
    }

    // Options: Lower threshold to detect faces easier (good for glasses/low light)
    const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.5 });

    try {
      const result = await faceapi.detectSingleFace(videoRef.current, options).withFaceExpressions();

      if (result) {
        const expressions = result.expressions;
        setEmotionData(expressions);

        // Find dominant emotion
        const maxEmotion = Object.keys(expressions).reduce((a, b) => 
          expressions[a] > expressions[b] ? a : b
        );
        
        setDominantEmotion(maxEmotion);
        setDebugStatus(`Tracking Face: ${maxEmotion.toUpperCase()}`);
      } else {
        setDebugStatus("Scanning... No face detected. (Try moving closer or better light)");
      }
    } catch (err) {
      // Don't clutter UI with frame errors, just log
      console.warn("Detection Frame Error", err);
    }

    // Loop again in 100ms
    setTimeout(runDetection, 100);
  };

  // Trigger loop once video starts playing
  const onVideoPlay = () => {
    setDebugStatus("Video Playing. Starting AI...");
    runDetection();
  };

  // Helper: Styles
  const getEmotionStyle = (emo) => {
    const styles = {
      happy:     { color: 'bg-green-500',  text: 'text-green-600',  icon: <Smile /> },
      sad:       { color: 'bg-blue-500',   text: 'text-blue-600',   icon: <Frown /> },
      angry:     { color: 'bg-red-500',    text: 'text-red-600',    icon: <AlertCircle /> },
      surprised: { color: 'bg-yellow-400', text: 'text-yellow-600', icon: <Zap /> },
      fearful:   { color: 'bg-purple-500', text: 'text-purple-600', icon: <Activity /> },
      disgusted: { color: 'bg-orange-500', text: 'text-orange-600', icon: <AlertCircle /> },
      neutral:   { color: 'bg-gray-400',   text: 'text-gray-600',   icon: <Meh /> },
    };
    return styles[emo] || styles.neutral;
  };

  const currentStyle = getEmotionStyle(dominantEmotion);

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center">
      
      {/* Header */}
      <div className="w-full max-w-4xl mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="text-indigo-600" /> Real-time Emotion AI
        </h2>
      </div>

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Camera Feed */}
        <div className="md:col-span-2 relative bg-black rounded-2xl overflow-hidden shadow-lg aspect-video">
            <video 
                ref={videoRef} 
                autoPlay 
                muted 
                onPlay={onVideoPlay}
                className="w-full h-full object-cover transform scale-x-[-1]" 
            />
            
            {/* Status Debug Bar (Bottom) */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm text-white text-xs py-1 px-3 flex items-center gap-2">
                 <Loader2 size={12} className="animate-spin" />
                 {debugStatus}
            </div>

            {/* Emotion Badge (Top Right) */}
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-4 py-2 rounded-full flex items-center gap-2 shadow-lg transition-all duration-300">
                <span className={`${currentStyle.text}`}>{currentStyle.icon}</span>
                <span className={`font-bold capitalize ${currentStyle.text}`}>{dominantEmotion}</span>
            </div>
        </div>

        {/* Live Metrics Sidebar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 h-full">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Live Analysis</h3>
            <div className="space-y-4">
                {Object.keys(emotionData).map((emo) => {
                    const val = Math.round(emotionData[emo] * 100);
                    const style = getEmotionStyle(emo);
                    if (val < 1 && emo !== 'neutral') return null; // Hide 0% stats

                    return (
                        <div key={emo}>
                            <div className="flex justify-between text-xs font-semibold mb-1">
                                <span className="capitalize text-gray-700">{emo}</span>
                                <span className="text-gray-400">{val}%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                <div 
                                    className={`h-full transition-all duration-300 ${style.color}`} 
                                    style={{ width: `${val}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
      </div>
    </div>
  );
};

export default EmotionCam;