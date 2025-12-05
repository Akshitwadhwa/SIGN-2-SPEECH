import React, { useState } from 'react';
import { Type, Volume2, Mic, Smile, LayoutGrid } from 'lucide-react';

// Make sure these file names match exactly what is in your folder (Case Sensitive!)
import useBackendIntegration from './hooks/useBackendIntegration';
import SignToText from './components/SignToText';
import TextToSpeech from './components/TextToSpeech';
import SpeechToSignLanguage from './components/SpeechToSignLanguage';
import EmotionCam from './components/Emotioncam'; // Fixed capitalization
import LoadingScreen from './components/Loadingscreen'; // Fixed capitalization

const tabs = [
  { id: 'sign_to_text', name: 'Sign to Text', icon: Type },
  { id: 'text_to_speech', name: 'Text to Speech', icon: Volume2 },
  { id: 'speech_to_sign', name: 'Speech to Sign', icon: Mic },
  { id: 'emotion_detection', name: 'Emotion Detection', icon: Smile },
];

const App = () => {
  const [isLoading, setIsLoading] = useState(true); // App-wide loading screen
  const [activeTab, setActiveTab] = useState(tabs[0].id);
  
  // Assuming this hook handles your Python backend communication
  const { callApi, loading: apiLoading } = useBackendIntegration();

  // Show the "Splash Screen" first
  if (isLoading) {
    return <LoadingScreen onLoadingComplete={() => setIsLoading(false)} />;
  }

  // Render the specific feature
  const renderContent = () => {
    // We pass API props down, in case the components need to talk to Flask
    const apiProps = { callApi, apiLoading };

    switch (activeTab) {
      case 'sign_to_text':
        return <SignToText {...apiProps} />;
      case 'text_to_speech':
        return <TextToSpeech {...apiProps} />;
      case 'speech_to_sign':
        return <SpeechToSignLanguage {...apiProps} />;
      case 'emotion_detection':
        return <EmotionCam {...apiProps} />;
      default:
        return <div className="p-8 text-center text-gray-500">Component not found</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      
      {/* --- Navigation Bar --- */}
      <nav className="bg-white shadow-sm sticky top-0 z-40 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                 <LayoutGrid className="text-white w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-gray-900 tracking-tight">
                Sign2<span className="text-indigo-600">Speech</span>
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="flex space-x-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap
                      ${isActive
                        ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 shadow-sm'
                        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                      }
                    `}
                  >
                    <Icon className={`w-4 h-4 mr-2 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
                    {tab.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </nav>

      {/* --- Main Content --- */}
      {/* Removed the 'bg-white shadow' wrapper so components fit naturally */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="animate-fade-in-up">
           {renderContent()}
        </div>
      </main>

      {/* --- Backend API Loading Overlay --- */}
      {apiLoading && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white px-8 py-6 rounded-2xl shadow-2xl flex flex-col items-center animate-bounce-in">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
            <span className="text-gray-800 font-semibold">Processing...</span>
            <span className="text-gray-500 text-xs mt-1">Talking to AI Model</span>
          </div>
        </div>
      )}
    </div>
  );
};

const OldEmotionCamComponent = () => {
  const videoRef = useRef();
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  
  // State for Control (Start/Stop)
  const [isScanning, setIsScanning] = useState(true);
  const isScanningRef = useRef(true); // Ref to access state inside the loop instantly

  const [dominantEmotion, setDominantEmotion] = useState('neutral');
  const [emotionData, setEmotionData] = useState({
    neutral: 1, happy: 0, sad: 0, angry: 0, fearful: 0, disgusted: 0, surprised: 0
  });

  // --- 1. Logic ---
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = process.env.PUBLIC_URL + '/models';
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
        ]);
        setIsModelLoaded(true);
        startVideo();
      } catch (error) {
        console.error("Error loading models:", error);
      }
    };
    loadModels();
    
    // Cleanup on unmount
    return () => {
      stopVideo();
    };
  }, []);

  const startVideo = () => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => { 
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
        }
      })
      .catch((err) => console.error("Camera error:", err));
  };

  const stopVideo = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
  };

  // Toggle Button Handler
  const toggleScanning = () => {
    const newState = !isScanning;
    setIsScanning(newState);
    isScanningRef.current = newState;

    if (videoRef.current) {
        if (newState) {
            videoRef.current.play();
            runDetection(); // Restart the AI loop
        } else {
            videoRef.current.pause(); // Freeze the video
        }
    }
  };

  const runDetection = async () => {
    // STOP CONDITION: If paused or video issue, stop the recursive loop
    if (!isScanningRef.current || !videoRef.current || videoRef.current.paused || videoRef.current.ended || !isModelLoaded) {
      return; 
    }

    const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.5 });
    
    try {
      const result = await faceapi.detectSingleFace(videoRef.current, options).withFaceExpressions();
      if (result) {
        setEmotionData(result.expressions);
        const maxEmotion = Object.keys(result.expressions).reduce((a, b) => 
            result.expressions[a] > result.expressions[b] ? a : b
        );
        setDominantEmotion(maxEmotion);
      }
    } catch (err) {
        // Ignored
    }

    // Recursive call
    if (isScanningRef.current) {
        setTimeout(runDetection, 100);
    }
  };

  // Trigger detection when video starts playing
  const onVideoPlay = () => {
      isScanningRef.current = true;
      setIsScanning(true);
      runDetection();
  };

  // --- 2. Styling Helpers ---
  const getEmotionStyle = (emo) => {
    const styles = {
      happy:     { color: 'bg-green-500',  text: 'text-green-600',  border: 'border-green-200', icon: <Smile className="w-5 h-5"/> },
      sad:       { color: 'bg-blue-500',   text: 'text-blue-600',   border: 'border-blue-200',  icon: <Frown className="w-5 h-5"/> },
      angry:     { color: 'bg-red-500',    text: 'text-red-600',    border: 'border-red-200',   icon: <AlertCircle className="w-5 h-5"/> },
      surprised: { color: 'bg-yellow-400', text: 'text-yellow-600', border: 'border-yellow-200', icon: <Zap className="w-5 h-5"/> },
      fearful:   { color: 'bg-purple-500', text: 'text-purple-600', border: 'border-purple-200', icon: <Activity className="w-5 h-5"/> },
      disgusted: { color: 'bg-orange-500', text: 'text-orange-600', border: 'border-orange-200', icon: <AlertCircle className="w-5 h-5"/> },
      neutral:   { color: 'bg-gray-400',   text: 'text-gray-600',   border: 'border-gray-200',   icon: <Meh className="w-5 h-5"/> },
    };
    return styles[emo] || styles.neutral;
  };

  const currentStyle = getEmotionStyle(dominantEmotion);

  return (
    <div className="min-h-full bg-gradient-to-br from-gray-50 to-indigo-50/30 p-6 md:p-8">
      
      {/* Header Section */}
      <div className="max-w-6xl mx-auto mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
             Emotion Analysis
             {isScanning ? (
                 <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                 </span>
             ) : (
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
             )}
          </h2>
          <p className="text-gray-500 mt-1">AI-powered facial expression recognition engine</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* --- Left Column: The Scanner (Video) --- */}
        <div className="lg:col-span-8">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border-[4px] border-white bg-black aspect-video group">
                
                {/* 1. The Video Feed */}
                <video 
                    ref={videoRef} 
                    autoPlay 
                    muted 
                    onPlay={onVideoPlay}
                    className={`w-full h-full object-cover transform scale-x-[-1] transition-opacity duration-500 ${isScanning ? 'opacity-100' : 'opacity-60'}`}
                />

                {/* 2. Loading State Overlay */}
                {!isModelLoaded && (
                    <div className="absolute inset-0 bg-gray-900 flex flex-col items-center justify-center text-white z-30">
                        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="font-medium tracking-wide">Initializing Neural Networks...</p>
                    </div>
                )}

                {/* 3. The "Scanning" Laser Effect (Only when active) */}
                {isModelLoaded && isScanning && (
                  <motion.div 
                    className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-indigo-400 to-transparent opacity-50 z-10"
                    animate={{ top: ["0%", "100%", "0%"] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  />
                )}

                {/* 4. Status Badge (Active vs Paused) */}
                <div className="absolute top-6 left-6 z-20">
                    <div className={`flex items-center gap-2 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full transition-colors duration-300 ${isScanning ? 'bg-black/40 text-white' : 'bg-yellow-500/90 text-black'}`}>
                        <ScanFace className="w-4 h-4" />
                        <span className="text-xs font-bold tracking-wide">
                            {isScanning ? "TRACKING ACTIVE" : "PAUSED"}
                        </span>
                    </div>
                </div>

                {/* 5. Detected Emotion Badge */}
                <div className="absolute top-6 right-6 z-20">
                    <AnimatePresence>
                        {isScanning && (
                            <motion.div 
                                key={dominantEmotion}
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="px-5 py-2.5 rounded-2xl bg-white/90 backdrop-blur-md shadow-lg flex items-center gap-3"
                            >
                                <div className={`p-1.5 rounded-full bg-opacity-10 ${currentStyle.color.replace('bg-', 'bg-opacity-20 ')}`}>
                                    {currentStyle.icon}
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider leading-none mb-1">Detected</p>
                                    <p className={`text-lg font-bold capitalize leading-none ${currentStyle.text}`}>
                                        {dominantEmotion}
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* 6. Bottom Controls */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 to-transparent p-6 pt-12 flex items-center justify-between z-20">
                    <p className="text-white/80 text-sm font-medium flex items-center gap-2">
                        <Sparkles size={14} className="text-yellow-400" />
                        {isScanning ? "Align face within frame" : "Detection paused"}
                    </p>
                    
                    {/* START / STOP BUTTON */}
                    <button 
                        onClick={toggleScanning}
                        className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold shadow-lg transition-all transform hover:scale-105 active:scale-95 ${
                            isScanning 
                            ? 'bg-white text-red-500 hover:bg-gray-100' 
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}
                    >
                        {isScanning ? (
                            <>
                                <Pause size={18} fill="currentColor" /> Stop
                            </>
                        ) : (
                            <>
                                <Play size={18} fill="currentColor" /> Start
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>

        {/* --- Right Column: Live Data Metrics --- */}
        <div className="lg:col-span-4 flex flex-col h-full">
            <div className={`bg-white rounded-3xl shadow-lg border border-gray-100 p-6 flex-1 transition-opacity duration-300 ${isScanning ? 'opacity-100' : 'opacity-60'}`}>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                        <Activity className="text-indigo-600" size={20}/>
                        Confidence Metrics
                    </h3>
                </div>
                
                <div className="space-y-5">
                    {Object.keys(emotionData).map((emo) => {
                        const val = Math.round(emotionData[emo] * 100);
                        const style = getEmotionStyle(emo);
                        const isDominant = emo === dominantEmotion;
                        
                        if (val < 2 && !isDominant) return null;

                        return (
                            <div key={emo} className={`transition-all duration-300 ${isDominant ? 'opacity-100' : 'opacity-60'}`}>
                                <div className="flex justify-between items-end mb-1.5">
                                    <span className={`text-sm font-bold capitalize flex items-center gap-2 ${isDominant ? 'text-gray-800' : 'text-gray-500'}`}>
                                        {style.icon} {emo}
                                    </span>
                                    <span className="text-xs font-mono font-medium text-gray-400">{val}%</span>
                                </div>
                                <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <motion.div 
                                        className={`h-full ${style.color}`} 
                                        initial={{ width: 0 }}
                                        animate={{ width: isScanning ? `${val}%` : `${val}%` }} // Keep last value when paused
                                        transition={{ duration: 0.5 }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
                
                {!isScanning && (
                    <div className="mt-8 p-4 bg-yellow-50 text-yellow-700 rounded-xl text-sm font-medium text-center border border-yellow-100">
                        Detection paused. Click "Start" to resume.
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default EmotionCam;