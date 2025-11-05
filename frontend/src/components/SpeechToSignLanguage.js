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

  const startRecording = () => {
    if (recognitionRef.current) {
      setTranscript('');
      setSignLetters([]);
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
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
    <div className="p-8">
      <TitleIconContainer icon={Volume2} colorClass="text-purple-600" title="Speech to Sign Language" />

      {/* Instructions */}
      <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <p className="text-purple-800 text-sm">
          <strong>How it works:</strong> Click "Start Recording", speak into your microphone, 
          and watch your words transform into sign language letters!
        </p>
      </div>

      {/* Recording Controls */}
      <div className="flex justify-center space-x-4 mb-6">
        {!isRecording ? (
          <PrimaryButton 
            onClick={startRecording} 
            icon={Mic}
            className="bg-purple-600 hover:bg-purple-700 focus:ring-purple-300"
          >
            Start Recording
          </PrimaryButton>
        ) : (
          <PrimaryButton 
            onClick={stopRecording} 
            icon={StopCircle}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-300"
          >
            Stop Recording
          </PrimaryButton>
        )}
        
        <PrimaryButton 
          onClick={clearAll} 
          icon={RotateCcw}
          className="bg-gray-600 hover:bg-gray-700 focus:ring-gray-300"
          disabled={!transcript && signLetters.length === 0}
        >
          Clear
        </PrimaryButton>
      </div>

      {/* Recording Status */}
      {isRecording && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-center">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse mr-3"></div>
            <span className="text-red-800 font-medium">Recording... Speak now!</span>
          </div>
        </div>
      )}

      {/* Transcript Display */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-3">What you said:</h2>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-inner min-h-[80px]">
          {transcript ? (
            <p className="text-gray-800 text-lg">{transcript}</p>
          ) : (
            <p className="text-gray-400 italic">Your speech will appear here...</p>
          )}
        </div>
      </div>

      {/* Sign Language Grid */}
      <div>
        <h2 className="text-lg font-semibold text-gray-700 mb-3">
          Sign Language Letters ({signLetters.length} letters):
        </h2>
        
        {signLetters.length > 0 ? (
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-4">
              {signLetters.map((letter, index) => (
                <div 
                  key={index} 
                  className="flex flex-col items-center animate-fadeIn"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="relative group">
                    <img
                      src={`/sign-images/${letter}.jpg`}
                      alt={`Sign for ${letter}`}
                      className="w-full aspect-square object-cover rounded-lg border-2 border-purple-300 shadow-md hover:shadow-xl hover:scale-105 transition-all duration-200"
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="40"%3E' + letter + '%3C/text%3E%3C/svg%3E';
                      }}
                    />
                    {/* Letter overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 rounded-lg transition-all duration-200 flex items-center justify-center">
                      <span className="text-white font-bold text-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        {letter}
                      </span>
                    </div>
                  </div>
                  {/* Letter label */}
                  <span className="mt-2 text-purple-800 font-semibold text-lg">
                    {letter}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 p-12 rounded-xl border-2 border-dashed border-gray-300 text-center">
            <Volume2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              Start speaking to see sign language letters appear here
            </p>
          </div>
        )}
      </div>

      {/* Add fadeIn animation */}
      <style jsx="true">{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default SpeechToSignLanguage;
