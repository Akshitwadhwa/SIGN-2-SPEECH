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

    // Run predictions every 500ms
    predictionIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) {
        return;
      }

      try {
        // Update the grayscale preview box
        updateGrayscalePreview();

        // Make prediction on current frame
        const prediction = await signLanguageModel.predict(videoRef.current, 0.6, debugMode);

        if (prediction) {
          const { sign, confidence: conf, debugImage: dbgImg } = prediction;

          setDebugImage(dbgImg);
          
          // Only process if sign is not null
          if (sign && sign !== null) {
            setCurrentSign(sign);
            setConfidence(conf);

            // Sign stabilization: only add to text if same sign detected multiple times
            if (sign === lastDetectedSignRef.current) {
              signStabilityCounterRef.current += 1;

              // Add to text after 3 consecutive detections (1.5 seconds)
              if (signStabilityCounterRef.current === 3) {
                // Handle special case for space (sign '0' or null means space/word boundary)
                if (sign === '0' || sign === 'SPACE') {
                  // Complete current word
                  setWordBuffer(prev => {
                    if (prev.length > 0) {
                      const completedWord = prev;
                      setCompletedWords(words => [...words, completedWord]);
                      setDetectedText(text => (text + ' ' + completedWord).trim());
                      speakWord(completedWord); // Speak the completed word
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
                signStabilityCounterRef.current = 0;
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
            signStabilityCounterRef.current = 0;
            lastDetectedSignRef.current = null;
          }
        } else {
          // No confident prediction
          setCurrentSign(null);
          setConfidence(0);
          signStabilityCounterRef.current = 0;
          lastDetectedSignRef.current = null;
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
    <div className="p-8">
      <TitleIconContainer icon={Volume2} colorClass="text-blue-600" title="Sign Language to Speech Conversion" />

      {/* Model Loading Status */}
      {isModelLoading && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center">
          <Loader className="w-5 h-5 text-blue-600 mr-3 animate-spin" />
          <span className="text-blue-800 font-medium">Loading AI model...</span>
        </div>
      )}

      {/* Model Error */}
      {!isModelLoading && !modelLoaded && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
          <div className="text-red-800">
            <p className="font-medium">Model not loaded</p>
            <p className="text-sm">Please train and deploy the model first. See model-training/README.md</p>
          </div>
        </div>
      )}

      {/* Camera Feed Area */}
      <div className="bg-gray-800 p-2 h-96 rounded-xl shadow-inner mb-4 flex flex-col items-center justify-center relative overflow-hidden">

        {/* Video Element (mirrored to feel natural) */}
        <video
          ref={videoRef}
          className={`w-full h-full object-cover rounded-lg transform scale-x-[-1] transition-opacity duration-500 
            ${isCameraActive ? 'opacity-100' : 'opacity-0 absolute'}`}
          autoPlay
          playsInline
          muted
        />

        {/* Hidden canvas for image processing */}
        <canvas
          ref={canvasRef}
          width="192"
          height="192"
          className="hidden"
        />

        {/* Current Detection Overlay */}
        {isCameraActive && currentSign && (
          <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg">
            <p className="text-2xl font-bold">{currentSign}</p>
            <p className="text-xs text-gray-300">Confidence: {(confidence * 100).toFixed(1)}%</p>
          </div>
        )}

        {/* Placeholder / Error Message */}
        {!isCameraActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 rounded-xl text-center bg-gray-100">
            <VideoOff className="w-12 h-12 text-gray-400 mb-4" />
            {cameraError ? (
              <p className="text-red-500 font-medium">{cameraError}</p>
            ) : (
              <p className="text-gray-600">Click 'Start Camera' to enable live sign language detection.</p>
            )}
          </div>
        )}

      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">

        {/* Debug Toggle */}
        <label className="flex items-center cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              className="sr-only"
              checked={debugMode}
              onChange={() => setDebugMode(!debugMode)}
            />
            <div className={`block w-14 h-8 rounded-full ${debugMode ? 'bg-blue-600' : 'bg-gray-400'}`}></div>
            <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition ${debugMode ? 'transform translate-x-6' : ''}`}></div>
          </div>
          <div className="ml-3 text-gray-700 font-medium">
            Debug View
          </div>
        </label>

        {/* Auto Speak Toggle */}
        <label className="flex items-center cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              className="sr-only"
              checked={autoSpeak}
              onChange={() => setAutoSpeak(!autoSpeak)}
            />
            <div className={`block w-14 h-8 rounded-full ${autoSpeak ? 'bg-green-600' : 'bg-gray-400'}`}></div>
            <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition ${autoSpeak ? 'transform translate-x-6' : ''}`}></div>
          </div>
          <div className="ml-3 text-gray-700 font-medium">
            Auto Speak
          </div>
        </label>

        {/* Camera Buttons */}
        <div className="flex space-x-4">
          {!isCameraActive ? (
            <PrimaryButton
              onClick={handleStartCamera}
              icon={Type}
              className="w-40"
              disabled={!modelLoaded || isModelLoading}
            >
              Start Camera
            </PrimaryButton>
          ) : (
            <PrimaryButton onClick={handleStopCamera} icon={StopCircle} className="w-40 bg-red-600 hover:bg-red-700">
              Stop Camera
            </PrimaryButton>
          )}
        </div>
      </div>

      {/* Debug View Panel */}
      {debugMode && debugImage && (
        <div className="mb-6 p-4 bg-gray-100 rounded-xl border border-gray-300 flex flex-col items-center">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">AI Input View (128x128)</h3>
          <div className="relative w-32 h-32 bg-black rounded-lg overflow-hidden border-2 border-blue-500">
            <img src={debugImage} alt="Debug View" className="w-full h-full object-cover" />
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center max-w-xs">
            This is the exact image sent to the model. Ensure the hand is clearly visible and centered.
          </p>
        </div>
      )}

      {/* Detected Text Area */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-inner">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold text-gray-700">Live Transcription:</h2>
          <div className="flex space-x-2">
            <button
              onClick={handleClearText}
              className="p-2 rounded-full hover:bg-gray-100 transition text-gray-600"
              title="Clear Text"
              disabled={!detectedText || detectedText === 'Sign language interpretation will appear here...'}
            >
              <StopCircle className="w-5 h-5" />
            </button>
            <button
              onClick={handleSpeakFullText}
              className={`p-2 rounded-full hover:bg-gray-100 transition ${isSpeaking ? 'text-green-600' : 'text-gray-600'}`}
              title="Speak Full Text"
              disabled={!detectedText || detectedText === 'Sign language interpretation will appear here...'}
            >
              {isSpeaking ? <Volume2 className="w-6 h-6 animate-pulse" /> : <Volume2 className="w-6 h-6" />}
            </button>
          </div>
        </div>
        
        {/* Current word being typed */}
        {wordBuffer && (
          <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
            <span className="text-xs text-blue-600 font-semibold">Current Word: </span>
            <span className="text-blue-800 font-mono text-lg">{wordBuffer}</span>
          </div>
        )}
        
        {/* Completed words */}
        {completedWords.length > 0 && (
          <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded-lg">
            <span className="text-xs text-green-600 font-semibold">Completed: </span>
            <span className="text-green-800 font-mono">{completedWords.join(' ')}</span>
          </div>
        )}
        
        <div className="w-full min-h-32 bg-gray-50 rounded-lg p-3 overflow-y-auto text-gray-800 text-lg font-mono">
          {detectedText || 'Detected signs will appear here...'}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2 text-blue-600" />
          Tips for Best Results:
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-gray-700 mb-2 text-sm">Camera Setup:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Ensure good lighting on your hands</li>
              <li>• Keep your hand centered in the frame</li>
              <li>• Hold each sign steady for 1.5 seconds</li>
              <li>• Avoid rapid hand movements</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-2 text-sm">Speech Features:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Enable "Auto Speak" to hear letters as detected</li>
              <li>• Use sign '0' or pause to complete a word</li>
              <li>• Completed words will be spoken automatically</li>
              <li>• Click speaker icon to replay full text</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignToSpeech;
