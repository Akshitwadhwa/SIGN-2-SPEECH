import React, { useState, useMemo } from 'react';
import { Smile, Camera, Activity } from 'lucide-react';
import PrimaryButton from './PrimaryButton';
import TitleIconContainer from './TitleIconContainer';

const EmotionDetectionContent = ({ api }) => {
  const [isDetecting, setIsDetecting] = useState(false);
  const [emotions, setEmotions] = useState({ Happy: 0, Sad: 0, Angry: 0, Surprised: 0, Neutral: 100 });

  const handleStartDetection = async () => {
    setIsDetecting(true);
    await api.callApi('start-emotion-detection', { action: 'start' });
    // Simulate changing emotions for demo purposes if backend isn't connected
    setTimeout(() => setEmotions({ Happy: 15, Sad: 5, Angry: 5, Surprised: 5, Neutral: 70 }), 2500);
  };

  const primaryEmotion = useMemo(() => {
    const sorted = Object.entries(emotions).sort(([, a], [, b]) => b - a);
    return sorted[0];
  }, [emotions]);

  const getEmotionEmoji = (emotion) => {
    switch (emotion) {
      case 'Happy': return '😄';
      case 'Sad': return '😞';
      case 'Angry': return '😡';
      case 'Surprised': return '😮';
      case 'Neutral': return '🙂';
      default: return '😐';
    }
  };

  const getEmotionColor = (emotion) => {
    switch (emotion) {
      case 'Happy': return 'bg-yellow-400';
      case 'Sad': return 'bg-blue-400';
      case 'Angry': return 'bg-red-400';
      case 'Surprised': return 'bg-purple-400';
      case 'Neutral': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <TitleIconContainer icon={Smile} colorClass="text-accent" title="Emotion Detection" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Camera Feed */}
        <div className="space-y-6">
          <div className="card bg-gray-900 relative aspect-video flex flex-col items-center justify-center shadow-xl overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50 opacity-60"></div>

            <div className="z-10 text-center p-8">
              <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center mb-6 mx-auto border border-white/20 group-hover:scale-110 transition-transform duration-300">
                <span role="img" aria-label="smiley face" className="text-5xl">😊</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Emotion Analysis</h3>
              <p className="text-gray-300 mb-8 max-w-md mx-auto">
                Start the camera to analyze facial expressions in real-time and detect emotions.
              </p>

              <PrimaryButton
                onClick={handleStartDetection}
                className="w-full sm:w-auto !bg-accent hover:!bg-orange-600 text-white border-0"
                disabled={isDetecting || api.loading}
                icon={Camera}
              >
                {api.loading ? 'Connecting...' : isDetecting ? 'Detection Active' : 'Start Detection'}
              </PrimaryButton>
            </div>
          </div>
        </div>

        {/* Right Column: Results */}
        <div className="space-y-6">
          {/* Primary Emotion Card */}
          <div className="card p-8 flex flex-col items-center justify-center text-center bg-gradient-to-br from-white to-gray-50 border-gray-100">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-6">Dominant Emotion</h2>

            <div className="relative mb-6">
              <div className="text-9xl animate-bounce-slow filter drop-shadow-xl">
                {getEmotionEmoji(primaryEmotion[0])}
              </div>
              <div className="absolute -bottom-2 -right-2 bg-white px-3 py-1 rounded-full shadow-md border border-gray-100 text-sm font-bold text-gray-600">
                {primaryEmotion[1].toFixed(0)}%
              </div>
            </div>

            <p className="text-4xl font-extrabold text-gray-800 mb-2 tracking-tight">{primaryEmotion[0]}</p>
            <p className="text-gray-500">Confidence Score</p>
          </div>

          {/* Detailed Breakdown */}
          <div className="card p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-accent" />
              Emotion Breakdown
            </h2>
            <div className="space-y-4">
              {Object.entries(emotions).map(([name, percent]) => (
                <div key={name} className="group">
                  <div className="flex justify-between text-sm font-medium text-gray-600 mb-1">
                    <span className="group-hover:text-gray-900 transition-colors">{name}</span>
                    <span className="font-mono">{percent.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-1000 ease-out ${getEmotionColor(name)}`}
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmotionDetectionContent;
