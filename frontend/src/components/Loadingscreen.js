import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hand, Volume2, Sparkles } from 'lucide-react';

// --- 1. The Loading Screen Component ---
const LoadingScreen = ({ onLoadingComplete }) => {
  const [loadingText, setLoadingText] = useState("Initializing...");

  // Simulate loading steps text
  useEffect(() => {
    const texts = [
      "Loading AI Models...",
      "Connecting to Camera...",
      "Setting up Audio...",
      "Ready!"
    ];
    
    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step < texts.length) {
        setLoadingText(texts[step]);
      }
    }, 800); // Change text every 800ms

    // Trigger completion after 3.5 seconds
    const timer = setTimeout(() => {
      onLoadingComplete();
    }, 3500);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [onLoadingComplete]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-50">
      <div className="relative flex items-center justify-center mb-8">
        
        {/* Pulsing Background Circle */}
        <motion.div
          className="absolute w-32 h-32 bg-indigo-100 rounded-full"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Main Icons Animation */}
        <div className="relative z-10 flex items-center space-x-4">
          {/* Hand Icon */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Hand size={48} className="text-indigo-600" />
          </motion.div>

          {/* Connecting Dots */}
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-indigo-400 rounded-full"
                animate={{ opacity: [0, 1, 0] }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>

          {/* Speaker Icon */}
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Volume2 size={48} className="text-indigo-600" />
          </motion.div>
        </div>
      </div>

      {/* App Title */}
      <motion.h1 
        className="text-3xl font-bold text-indigo-600 mb-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        Sign2Speech
      </motion.h1>

      {/* Dynamic Loading Text */}
      <motion.p 
        key={loadingText} // Re-animates when text changes
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="text-gray-500 font-medium min-h-[24px]"
      >
        {loadingText}
      </motion.p>

      {/* Progress Bar */}
      <div className="mt-8 w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-indigo-500"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 3.2, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
};

export default LoadingScreen;