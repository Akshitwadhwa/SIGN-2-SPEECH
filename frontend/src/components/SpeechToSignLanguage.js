import React, { useState, useRef, useEffect } from 'react';
import { Mic, StopCircle, RotateCcw, Volume2 } from 'lucide-react';
import TitleIconContainer from './TitleIconContainer';
import PrimaryButton from './PrimaryButton';

const SpeechToSignLanguage = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [signLetters, setSignLetters] = useState([]);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPiece = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcriptPiece + ' ';
          } else {
            interimTranscript += transcriptPiece;
          }
        }

        const fullTranscript = finalTranscript || interimTranscript;
        setTranscript(fullTranscript);

        // Convert transcript to sign letters (only alphabetic characters)
        const letters = fullTranscript
          .toUpperCase()
          .replace(/[^A-Z]/g, '')
          .split('');
        setSignLetters(letters);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        // Only stop if explicitly requested, otherwise try to restart for continuous listening
        // But for this UI, we might want it to stop when the user toggles it.
        // Let's keep it simple: if it ends, it ends.
        setIsRecording(false);
      };
    } else {
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        setIsRecording(false);
      }
    } else {
      if (recognitionRef.current) {
        setTranscript('');
        setSignLetters([]);
        recognitionRef.current.start();
        setIsRecording(true);
      }
    }
  };

  const clearAll = () => {
    setTranscript('');
    setSignLetters([]);
  };

  if (!isSupported) {
    return (
      <div className="p-8">
        <TitleIconContainer icon={Volume2} colorClass="text-purple-600" title="Speech to Sign Language" />
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800 font-medium mb-2">Speech Recognition Not Supported</p>
          <p className="text-red-600 text-sm">
            Your browser doesn't support speech recognition. Please use Chrome, Edge, or Safari.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <TitleIconContainer icon={Volume2} colorClass="text-purple-600" title="Speech to Sign Language" />
        <p className="text-gray-500 mt-2">
          Speak clearly into your microphone to translate voice into sign language in real-time.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Controls & Transcript */}
        <div className="lg:col-span-4 space-y-6">

          {/* Microphone Card */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center h-64">
            <button
              onClick={toggleRecording}
              className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${isRecording
                  ? 'bg-red-500 shadow-lg shadow-red-200 scale-110'
                  : 'bg-purple-600 shadow-lg shadow-purple-200 hover:scale-105'
                }`}
            >
              {isRecording ? (
                <div className="w-8 h-8 bg-white rounded-md" />
              ) : (
                <Mic className="w-10 h-10 text-white" />
              )}
              {isRecording && (
                <span className="absolute w-full h-full rounded-full bg-red-500 opacity-20 animate-ping" />
              )}
            </button>

            <h3 className="mt-6 text-lg font-semibold text-gray-900">
              {isRecording ? 'Listening...' : 'Tap to Speak'}
            </h3>
            <p className={`mt-2 text-sm ${isRecording ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
              {isRecording ? 'Microphone active' : 'Microphone ready'}
            </p>
          </div>

          {/* Transcript Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-64 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Transcript</h3>
              {transcript && (
                <button
                  onClick={clearAll}
                  className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" /> Clear
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {transcript ? (
                <p className="text-gray-700 text-lg leading-relaxed">{transcript}</p>
              ) : (
                <p className="text-gray-300 italic">Your speech will appear here text...</p>
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Sign Translation */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-full min-h-[530px] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Sign Translation</h3>
              <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-500">
                {signLetters.length} characters
              </span>
            </div>

            <div className="flex-1 bg-gray-50 rounded-xl border border-dashed border-gray-200 p-6 relative overflow-hidden">
              {signLetters.length > 0 ? (
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-4 overflow-y-auto max-h-[450px] custom-scrollbar pr-2">
                  {signLetters.map((letter, index) => (
                    <div
                      key={index}
                      className="flex flex-col items-center animate-fadeIn group"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className="relative w-full aspect-square bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                        <img
                          src={`/sign-images/${letter}.jpg`}
                          alt={`Sign for ${letter}`}
                          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-300"
                          onError={(e) => {
                            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f3f4f6" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="40"%3E' + letter + '%3C/text%3E%3C/svg%3E';
                          }}
                        />
                      </div>
                      <span className="mt-2 text-sm font-medium text-gray-500">{letter}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300">
                  <div className="w-20 h-20 mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
                    </svg>
                  </div>
                  <p className="text-lg font-medium">Start speaking to see signs appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx="true">{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #e5e7eb;
          border-radius: 20px;
        }
      `}</style>
    </div>
  );
};

export default SpeechToSignLanguage;
