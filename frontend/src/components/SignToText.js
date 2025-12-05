import React, { useState, useRef, useEffect } from 'react';
import { Type, StopCircle, VideoOff, AlertCircle, Loader, Volume2, VolumeX } from 'lucide-react';
import PrimaryButton from './PrimaryButton';
import TitleIconContainer from './TitleIconContainer';
import signLanguageModel from '../utils/signLanguageModel';

const SignToSpeech = () => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [detectedText, setDetectedText] = useState('Sign language interpretation will appear here...');
  const [cameraError, setCameraError] = useState(null);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [currentSign, setCurrentSign] = useState(null);
  const [confidence, setConfidence] = useState(0);
  const [debugMode, setDebugMode] = useState(false);
  const [debugImage, setDebugImage] = useState(null);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [wordBuffer, setWordBuffer] = useState('');
  const [completedWords, setCompletedWords] = useState([]);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const predictionIntervalRef = useRef(null);
  const canvasRef = useRef(null);
  const lastDetectedSignRef = useRef(null);
  const signStabilityCounterRef = useRef(0);
  const cooldownCounterRef = useRef(0);
  const lastAddedSignRef = useRef(null);

  // Load model on component mount
  useEffect(() => {
    loadModel();
    return () => {
      // Cleanup on unmount
      if (signLanguageModel.isModelLoaded()) {
        signLanguageModel.dispose();
      }
      handleStopCamera();
      window.speechSynthesis.cancel(); // Stop any ongoing speech
    };
  }, []);

  const loadModel = async () => {
    setIsModelLoading(true);
    try {
      const result = await signLanguageModel.loadModel();
      if (result.success) {
        setModelLoaded(true);
        console.log('Model loaded with classes:', result.classNames);
      } else {
        setCameraError(`Failed to load model: ${result.error}`);
      }
    } catch (error) {
      console.error('Model loading error:', error);
      setCameraError('Failed to load sign language model. Please ensure the model files are in /public/models/');
    } finally {
      setIsModelLoading(false);
    }
  };

  const speakText = (text) => {
    if (!text || text === 'Sign language interpretation will appear here...') return;

    window.speechSynthesis.cancel(); // Stop previous
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  // Speak completed words automatically
  const speakWord = (word) => {
    if (!word || !autoSpeak) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.rate = 0.8; // Slower for individual words
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  // Update grayscale preview box
  const updateGrayscalePreview = () => {
    if (!videoRef.current || !canvasRef.current || !isCameraActive) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const video = videoRef.current;

    // Draw current frame from video
    ctx.save();
    // Mirror horizontally to match the video display
    ctx.scale(-1, 1);
    ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    ctx.restore();

    // Get image data and convert to grayscale
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      data[i] = avg;     // R
      data[i + 1] = avg; // G
      data[i + 2] = avg; // B
    }

    ctx.putImageData(imageData, 0, 0);
  };

  const startRealTimeDetection = () => {
    if (!modelLoaded || !videoRef.current) return;

    setDetectedText('');
    setWordBuffer('');
    setCompletedWords([]);
    lastDetectedSignRef.current = null;
    signStabilityCounterRef.current = 0;
    cooldownCounterRef.current = 0;
    lastAddedSignRef.current = null;

    // Run predictions every 500ms
    predictionIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) {
        return;
      }

      try {
        // Update the grayscale preview box
        updateGrayscalePreview();

        // Make prediction on current frame with higher threshold
        const prediction = await signLanguageModel.predict(videoRef.current, 0.75, debugMode);

        if (prediction) {
          const { sign, confidence: conf, debugImage: dbgImg } = prediction;

          setDebugImage(dbgImg);

          // Check if we're in cooldown period
          if (cooldownCounterRef.current > 0) {
            cooldownCounterRef.current -= 1;
            setCurrentSign(null);
            setConfidence(0);
            return;
          }

          // Only process if sign is not null and has good confidence
          if (sign && sign !== null && conf >= 0.75) {
            setCurrentSign(sign);
            setConfidence(conf);

            // Sign stabilization: only add to text if same sign detected multiple times
            if (sign === lastDetectedSignRef.current) {
              signStabilityCounterRef.current += 1;

              // Require 5 consecutive detections (2.5 seconds) for better stability
              if (signStabilityCounterRef.current >= 5) {
                // Prevent adding the same letter twice in a row
                if (sign !== lastAddedSignRef.current) {
                  // Handle special case for space (sign '0' or null means space/word boundary)
                  if (sign === '0' || sign === 'SPACE') {
                    // Complete current word
                    setWordBuffer(prev => {
                      if (prev.length > 0) {
                        const completedWord = prev;
                        setCompletedWords(words => [...words, completedWord]);
                        setDetectedText(text => (text + ' ' + completedWord).trim());
                        speakWord(completedWord); // Speak the completed word
                        lastAddedSignRef.current = sign;
                        return ''; // Clear buffer
                      }
                      return prev;
                    });
                  } else {
                    // Add letter to current word buffer
                    setWordBuffer(prev => {
                      const newBuffer = prev + sign;
                      setDetectedText(text => {
                        // Update display: show completed words + current buffer
                        const completed = completedWords.join(' ');
                        return completed ? `${completed} ${newBuffer}` : newBuffer;
                      });
                      lastAddedSignRef.current = sign;
                      return newBuffer;
                    });

                    // Optional: speak individual letters if enabled
                    if (autoSpeak) {
                      const utterance = new SpeechSynthesisUtterance(sign);
                      utterance.rate = 1.2; // Faster for individual letters
                      utterance.volume = 0.6; // Quieter for letters
                      window.speechSynthesis.speak(utterance);
                    }
                  }
                  
                  // Set cooldown: wait 6 intervals (3 seconds) before detecting next sign
                  cooldownCounterRef.current = 6;
                  signStabilityCounterRef.current = 0;
                  lastDetectedSignRef.current = null;
                }
              }
            } else {
              // New sign detected, reset counter
              lastDetectedSignRef.current = sign;
              signStabilityCounterRef.current = 1;
            }
          } else {
            // Confidence too low or no sign detected
            setCurrentSign(null);
            setConfidence(0);
            // Don't reset counters immediately - allow for brief fluctuations
            if (signStabilityCounterRef.current > 0) {
              signStabilityCounterRef.current = Math.max(0, signStabilityCounterRef.current - 1);
            }
          }
        } else {
          // No confident prediction
          setCurrentSign(null);
          setConfidence(0);
          // Don't reset counters immediately
          if (signStabilityCounterRef.current > 0) {
            signStabilityCounterRef.current = Math.max(0, signStabilityCounterRef.current - 1);
          }
        }
      } catch (error) {
        console.error('Prediction error:', error);
      }
    }, 500);
  };

  const handleStartCamera = async () => {
    if (!modelLoaded) {
      setCameraError('Please wait for the model to load before starting the camera.');
      return;
    }

    setCameraError(null);
    try {
      // Check for MediaStream support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Your browser does not support camera access.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCameraActive(true);

        // Start real-time detection
        startRealTimeDetection();
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
    if (predictionIntervalRef.current) {
      clearInterval(predictionIntervalRef.current);
      predictionIntervalRef.current = null;
    }

    // Complete any remaining word in buffer
    if (wordBuffer.length > 0) {
      const finalText = [...completedWords, wordBuffer].join(' ');
      setDetectedText(finalText);
      if (autoSpeak && finalText) {
        speakWord(wordBuffer);
      }
    }

    setIsCameraActive(false);
    setCurrentSign(null);
    setConfidence(0);
    window.speechSynthesis.cancel(); // Stop any ongoing speech
  };

  const handleClearText = () => {
    setDetectedText('');
    setWordBuffer('');
    setCompletedWords([]);
    window.speechSynthesis.cancel();
  };

  const handleSpeakFullText = () => {
    const fullText = detectedText || [...completedWords, wordBuffer].filter(w => w).join(' ');
    if (fullText && fullText !== 'Sign language interpretation will appear here...') {
      speakText(fullText);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <TitleIconContainer icon={Volume2} colorClass="text-primary" title="Sign Language to Speech" />

      {/* Model Loading Status */}
      {isModelLoading && (
        <div className="card p-4 flex items-center bg-blue-50 border-blue-100">
          <Loader className="w-5 h-5 text-primary mr-3 animate-spin" />
          <span className="text-primary font-medium">Loading AI model...</span>
        </div>
      )}

      {/* Model Error */}
      {!isModelLoading && !modelLoaded && (
        <div className="card p-4 bg-red-50 border-red-100 flex items-center">
          <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
          <div className="text-red-800">
            <p className="font-medium">Model not loaded</p>
            <p className="text-sm">Please train and deploy the model first. See model-training/README.md</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Camera Feed */}
        <div className="space-y-6">
          <div className="card overflow-hidden bg-gray-900 relative aspect-video flex items-center justify-center shadow-xl">
            {/* Video Element */}
            <video
              ref={videoRef}
              className={`w-full h-full object-cover transform scale-x-[-1] transition-opacity duration-500 
                ${isCameraActive ? 'opacity-100' : 'opacity-0 absolute'}`}
              autoPlay
              playsInline
              muted
            />

            {/* Hidden canvas */}
            <canvas ref={canvasRef} width="192" height="192" className="hidden" />

            {/* Current Detection Overlay */}
            {isCameraActive && currentSign && (
              <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm text-white px-4 py-2 rounded-xl border border-white/10">
                <p className="text-3xl font-bold">{currentSign}</p>
                <p className="text-xs text-gray-300">{(confidence * 100).toFixed(0)}% sure</p>
              </div>
            )}

            {/* Placeholder / Error */}
            {!isCameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-gray-100/10 backdrop-blur-sm text-white">
                <VideoOff className="w-16 h-16 mb-4 opacity-50" />
                {cameraError ? (
                  <p className="text-red-400 font-medium">{cameraError}</p>
                ) : (
                  <p className="text-gray-300 text-lg">Start the camera to begin sign detection</p>
                )}
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              {/* Debug Toggle */}
              <label className="flex items-center cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={debugMode}
                    onChange={() => setDebugMode(!debugMode)}
                  />
                  <div className={`block w-12 h-7 rounded-full transition-colors ${debugMode ? 'bg-primary' : 'bg-gray-300'}`}></div>
                  <div className={`absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform ${debugMode ? 'translate-x-5' : ''}`}></div>
                </div>
                <span className="ml-3 text-sm font-medium text-gray-600 group-hover:text-primary transition-colors">Debug View</span>
              </label>

              {/* Auto Speak Toggle */}
              <label className="flex items-center cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={autoSpeak}
                    onChange={() => setAutoSpeak(!autoSpeak)}
                  />
                  <div className={`block w-12 h-7 rounded-full transition-colors ${autoSpeak ? 'bg-secondary' : 'bg-gray-300'}`}></div>
                  <div className={`absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform ${autoSpeak ? 'translate-x-5' : ''}`}></div>
                </div>
                <span className="ml-3 text-sm font-medium text-gray-600 group-hover:text-secondary transition-colors">Auto Speak</span>
              </label>
            </div>

            {/* Camera Buttons */}
            {!isCameraActive ? (
              <PrimaryButton
                onClick={handleStartCamera}
                icon={Type}
                disabled={!modelLoaded || isModelLoading}
                className="w-full sm:w-auto"
              >
                Start Camera
              </PrimaryButton>
            ) : (
              <PrimaryButton
                onClick={handleStopCamera}
                icon={StopCircle}
                className="w-full sm:w-auto !bg-red-600 hover:!bg-red-700"
              >
                Stop Camera
              </PrimaryButton>
            )}
          </div>
        </div>

        {/* Right Column: Results & Debug */}
        <div className="space-y-6">
          {/* Detected Text Area */}
          <div className="card p-6 h-full flex flex-col min-h-[400px]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span className="w-2 h-8 bg-primary rounded-full"></span>
                Live Transcription
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={handleClearText}
                  className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-red-500 transition-colors"
                  title="Clear Text"
                  disabled={!detectedText || detectedText === 'Sign language interpretation will appear here...'}
                >
                  <StopCircle className="w-5 h-5" />
                </button>
                <button
                  onClick={handleSpeakFullText}
                  className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${isSpeaking ? 'text-primary animate-pulse' : 'text-gray-500 hover:text-primary'}`}
                  title="Speak Full Text"
                  disabled={!detectedText || detectedText === 'Sign language interpretation will appear here...'}
                >
                  <Volume2 className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-gray-50 rounded-xl p-4 border border-gray-100 overflow-y-auto mb-4 shadow-inner">
              {detectedText === 'Sign language interpretation will appear here...' ? (
                <p className="text-gray-400 italic text-center mt-10">
                  Waiting for sign language input...
                </p>
              ) : (
                <p className="text-lg text-gray-800 leading-relaxed font-medium">
                  {detectedText}
                </p>
              )}
            </div>

            {/* Current Word Buffer */}
            <div className="space-y-2">
              {wordBuffer && (
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100 animate-in fade-in slide-in-from-bottom-2">
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Typing</span>
                  <span className="text-xl font-mono text-blue-900">{wordBuffer}</span>
                </div>
              )}

              {completedWords.length > 0 && (
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
                  <span className="text-xs font-bold text-green-600 uppercase tracking-wider">Latest</span>
                  <span className="text-sm font-mono text-green-800 truncate">
                    {completedWords.slice(-3).join(' ')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Debug View Panel */}
          {debugMode && debugImage && (
            <div className="card p-4 flex flex-col items-center animate-in fade-in slide-in-from-top-4">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Model Input (128x128)</h3>
              <div className="relative w-32 h-32 bg-black rounded-lg overflow-hidden border-2 border-primary shadow-md">
                <img src={debugImage} alt="Debug View" className="w-full h-full object-cover" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tips Section */}
      <div className="card p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-primary" />
          Tips for Best Results
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Camera Setup</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary"></div>Ensure good lighting on your hands</li>
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary"></div>Keep your hand centered in the frame</li>
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary"></div>Hold each sign steady for 2-3 seconds</li>
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary"></div>Move your hand away between signs</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Interactions</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-secondary"></div>Enable "Auto Speak" to hear letters</li>
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-secondary"></div>Use sign '0' or pause to complete a word</li>
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-secondary"></div>Click speaker icon to replay full text</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignToSpeech;
