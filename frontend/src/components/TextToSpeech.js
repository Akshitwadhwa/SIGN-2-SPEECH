import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, RefreshCcw, Volume2, Mic, Settings2, Globe } from 'lucide-react';

// --- Sub-Component: Audio Wave Visualizer ---
const AudioVisualizer = ({ isPlaying }) => {
  return (
    <div className="flex items-end justify-center h-8 gap-1 mb-6">
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className={`w-1.5 rounded-full bg-indigo-500 transition-all duration-300 ease-in-out ${
            isPlaying ? 'animate-pulse' : 'h-1.5 opacity-30'
          }`}
          style={{
            height: isPlaying ? `${Math.random() * 100}%` : '6px',
            animationDelay: `${i * 0.1}s`,
            animationDuration: '0.6s'
          }}
        />
      ))}
    </div>
  );
};

// --- Sub-Component: Slider Control ---
const ControlSlider = ({ label, value, onChange, min, max, step, formatVal }) => (
  <div className="flex flex-col gap-2 w-full">
    <div className="flex justify-between text-xs font-medium text-slate-500 uppercase tracking-wider">
      <span>{label}</span>
      <span className="text-indigo-600">{formatVal ? formatVal(value) : value}x</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
    />
  </div>
);

// --- Sub-Component: Voice Selector (Updated for Real Data) ---
const VoiceSelector = ({ voices, selectedVoice, onVoiceChange }) => (
  <div className="relative group w-full">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-indigo-500">
      <Globe size={18} />
    </div>
    
    <select
      value={selectedVoice}
      onChange={(e) => onVoiceChange(e.target.value)}
      disabled={voices.length === 0}
      className="block w-full pl-10 pr-10 py-3 text-sm text-slate-700 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all shadow-sm hover:border-indigo-300 appearance-none disabled:bg-slate-100 disabled:text-slate-400 truncate"
    >
      {voices.length === 0 ? (
        <option>Loading voices...</option>
      ) : (
        voices.map((voice, idx) => (
          <option key={`${voice.name}-${idx}`} value={voice.name}>
             {voice.name} ({voice.lang})
          </option>
        ))
      )}
    </select>
    
    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
      <Settings2 size={16} />
    </div>
  </div>
);

// --- Main Component ---
const TextToSpeech = () => {
  // State
  const [text, setText] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [rate, setRate] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);
  const [voices, setVoices] = useState([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState("");
  
  // Refs (for managing speech instance)
  const synthRef = useRef(window.speechSynthesis);

  // 1. Fetch Real Browser Voices
  useEffect(() => {
    const updateVoices = () => {
      const availableVoices = synthRef.current.getVoices();
      if (availableVoices.length > 0) {
        setVoices(availableVoices);
        // Set default voice if none selected
        if (!selectedVoiceName) {
           // Try to find a default English voice, or just take the first one
           const defaultVoice = availableVoices.find(v => v.default) || availableVoices[0];
           setSelectedVoiceName(defaultVoice.name);
        }
      }
    };

    updateVoices();

    // Chrome/Safari load voices asynchronously, so we must listen for this event
    if (synthRef.current.onvoiceschanged !== undefined) {
      synthRef.current.onvoiceschanged = updateVoices;
    }
  }, [selectedVoiceName]);

  // 2. Handle Speak Logic
  const handleSpeak = () => {
    if (!text) return;

    // Cancel any current speech
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Find the actual voice object based on the name
    const voiceObj = voices.find(v => v.name === selectedVoiceName);
    if (voiceObj) utterance.voice = voiceObj;

    utterance.rate = rate;
    utterance.pitch = pitch;

    // Events to toggle "Playing" state for the visualizer
    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    synthRef.current.speak(utterance);
  };

  const handleStop = () => {
    synthRef.current.cancel();
    setIsPlaying(false);
  };

  const handleReset = () => {
    handleStop();
    setRate(1.0);
    setPitch(1.0);
    setText("");
  };

  return (
    <div className="flex items-center justify-center min-h-[600px] bg-slate-50 p-6 font-sans">
      
      {/* Main Card */}
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-white/50 overflow-hidden relative backdrop-blur-xl">
        
        {/* Decorative Blobs */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-60 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-purple-50 rounded-full blur-3xl opacity-60 pointer-events-none"></div>

        {/* Header */}
        <div className="relative px-8 pt-8 pb-4 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-lg shadow-indigo-200">
              <Volume2 size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Neural Speech</h2>
              <p className="text-xs text-slate-400 font-medium tracking-wide">AI GENERATOR</p>
            </div>
          </div>
          <div className="hidden sm:block">
             <AudioVisualizer isPlaying={isPlaying} />
          </div>
        </div>

        {/* Body */}
        <div className="relative p-8 space-y-8">
          
          {/* Text Input */}
          <div className="relative group">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type something amazing here..."
              className="w-full h-40 p-5 bg-slate-50 rounded-2xl border-2 border-transparent text-slate-700 placeholder-slate-400 resize-none focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 ease-out shadow-inner text-lg leading-relaxed outline-none"
            />
            <div className="absolute bottom-4 right-4 text-xs font-semibold text-slate-300 bg-white px-2 py-1 rounded-md shadow-sm">
              {text.length} chars
            </div>
          </div>

          {/* Controls Area */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            
            {/* Left: Voice Selection */}
            <div className="space-y-4">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
                Select AI Voice ({voices.length})
              </label>
              <VoiceSelector 
                voices={voices} 
                selectedVoice={selectedVoiceName} 
                onVoiceChange={setSelectedVoiceName} 
              />
              <p className="text-xs text-slate-400 ml-1">
                * Voices are provided by your browser/OS.
              </p>
            </div>

            {/* Right: Fine Tuning */}
            <div className="space-y-6 bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <ControlSlider 
                label="Speaking Rate" 
                value={rate} 
                onChange={setRate} 
                min={0.5} max={2} step={0.1} 
              />
              <ControlSlider 
                label="Pitch / Tone" 
                value={pitch} 
                onChange={setPitch} 
                min={0.5} max={2} step={0.1} 
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="relative px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex flex-wrap gap-4 justify-between items-center">
          
          <button 
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
          >
            <RefreshCcw size={16} />
            <span>Reset</span>
          </button>

          <div className="flex gap-3 w-full sm:w-auto">
            {isPlaying ? (
              <button
                onClick={handleStop}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3 bg-white border-2 border-red-100 text-red-500 font-bold rounded-xl hover:bg-red-50 hover:border-red-200 transition-all shadow-sm active:scale-95"
              >
                <Square size={18} fill="currentColor" />
                <span>Stop Speaking</span>
              </button>
            ) : (
              <button
                onClick={handleSpeak}
                disabled={!text}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3 font-bold text-white rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 ${
                  !text 
                    ? 'bg-slate-300 cursor-not-allowed shadow-none' 
                    : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:shadow-indigo-300 hover:-translate-y-0.5'
                }`}
              >
                <Play size={20} fill="currentColor" />
                <span>Play Audio</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextToSpeech;