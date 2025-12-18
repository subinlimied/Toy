
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ttsService } from './services/ttsService';
import { GamePhase } from './types';
import { Play, Pause, RotateCcw, MessageSquare, Vote, AlertCircle, Volume2, FastForward } from 'lucide-react';

const App: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes default
  const [initialTime, setInitialTime] = useState(600);
  const [isRunning, setIsRunning] = useState(false);
  const [customText, setCustomText] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.2); // Default to slightly faster (1.2x)
  
  // Changed NodeJS.Timeout to any to avoid "Cannot find namespace 'NodeJS'" error in browser environment
  const timerRef = useRef<any>(null);
  const lastAlertedMinute = useRef<number | null>(null);

  // Auto-alert at 1 minute
  useEffect(() => {
    if (timeLeft === 60 && lastAlertedMinute.current !== 60) {
      handleSpeak("마지막 1분 남았습니다. 서둘러 결론을 내주세요.");
      lastAlertedMinute.current = 60;
    }
    if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      handleSpeak("시간이 모두 종료되었습니다. 게임을 멈춰주세요.");
    }
  }, [timeLeft, isRunning]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, timeLeft]);

  const toggleTimer = () => setIsRunning(!isRunning);

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(initialTime);
    lastAlertedMinute.current = null;
  };

  const handleTimeChange = (seconds: number) => {
    setIsRunning(false);
    setInitialTime(seconds);
    setTimeLeft(seconds);
    lastAlertedMinute.current = null;
  };

  const handleSpeak = async (text: string) => {
    if (!text || isSpeaking) return;
    setIsSpeaking(true);
    try {
      await ttsService.speak(text, playbackSpeed);
    } catch (e) {
      alert("TTS 재생 중 오류가 발생했습니다.");
    } finally {
      setIsSpeaking(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 bg-[#0a0a0a] text-[#e5e5e5]">
      {/* Header */}
      <div className="mb-12 text-center">
        <h1 className="text-5xl sm:text-7xl font-bold mystery-font tracking-widest text-red-700 drop-shadow-[0_0_15px_rgba(185,28,28,0.5)]">
          MURDER MYSTERY
        </h1>
        <p className="mt-4 text-gray-500 uppercase tracking-widest text-sm font-light">Game Master Control System</p>
      </div>

      {/* Main Timer Display */}
      <div className="relative group mb-12">
        <div className="absolute -inset-1 bg-gradient-to-r from-red-900 to-black rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
        <div className="relative bg-black border-4 border-red-900/30 rounded-full w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center shadow-2xl">
          <span className="text-6xl sm:text-8xl font-mono font-bold tracking-tighter text-white">
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      {/* Timer Controls */}
      <div className="flex space-x-6 mb-12">
        <button
          onClick={resetTimer}
          className="p-4 rounded-full bg-gray-900 hover:bg-gray-800 border border-gray-700 transition-all text-gray-400"
          title="Reset"
        >
          <RotateCcw size={32} />
        </button>
        <button
          onClick={toggleTimer}
          className={`p-6 rounded-full transition-all transform hover:scale-105 shadow-lg ${
            isRunning 
              ? "bg-red-900 hover:bg-red-800 text-white" 
              : "bg-green-800 hover:bg-green-700 text-white"
          }`}
        >
          {isRunning ? <Pause size={48} /> : <Play size={48} fill="currentColor" />}
        </button>
      </div>

      {/* Preset Times */}
      <div className="flex flex-wrap justify-center gap-3 mb-12 max-w-lg">
        {[300, 600, 900, 1200, 1800, 2400].map((sec) => (
          <button
            key={sec}
            onClick={() => handleTimeChange(sec)}
            className={`px-6 py-2 rounded-md border text-sm font-medium transition-all ${
              initialTime === sec 
                ? "bg-red-900 border-red-700 text-white" 
                : "bg-transparent border-gray-700 text-gray-400 hover:border-gray-500"
            }`}
          >
            {sec / 60} min
          </button>
        ))}
        {/* Custom Input */}
        <div className="flex items-center space-x-2 px-3 py-1 bg-gray-900 rounded-md border border-gray-700">
           <input 
            type="number" 
            placeholder="Custom (min)" 
            className="w-20 bg-transparent text-sm focus:outline-none text-center"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const val = parseInt((e.target as HTMLInputElement).value);
                if (!isNaN(val)) handleTimeChange(val * 60);
              }
            }}
           />
           <span className="text-xs text-gray-600">Enter</span>
        </div>
      </div>

      {/* Phase Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl mb-12">
        <button
          onClick={() => handleSpeak("지금은 공개 토론 시간입니다. 자유롭게 의견을 나누고 단서를 조합해 보세요.")}
          disabled={isSpeaking}
          className="flex items-center justify-between p-6 bg-gray-900/50 border border-red-900/20 rounded-xl hover:bg-gray-900 hover:border-red-700 transition-all group"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-red-900/20 p-3 rounded-lg group-hover:bg-red-900/40">
              <MessageSquare className="text-red-500" />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-lg">공개 토론 시작</h3>
              <p className="text-xs text-gray-500 italic">"지금은 공개 토론 시간입니다..."</p>
            </div>
          </div>
          <Volume2 className="text-gray-600 group-hover:text-red-500" />
        </button>

        <button
          onClick={() => handleSpeak("마지막 최종 정리 및 투표 시간입니다. 최후의 변론을 준비하고 투표를 시작해 주세요.")}
          disabled={isSpeaking}
          className="flex items-center justify-between p-6 bg-gray-900/50 border border-red-900/20 rounded-xl hover:bg-gray-900 hover:border-red-700 transition-all group"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-red-900/20 p-3 rounded-lg group-hover:bg-red-900/40">
              <Vote className="text-red-500" />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-lg">최종 투표 안내</h3>
              <p className="text-xs text-gray-500 italic">"최종 정리 및 투표 시간입니다..."</p>
            </div>
          </div>
          <Volume2 className="text-gray-600 group-hover:text-red-500" />
        </button>
      </div>

      {/* Manual TTS Interface */}
      <div className="w-full max-w-2xl bg-gray-900/30 border border-gray-800 p-6 rounded-2xl shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="text-gray-500" size={18} />
            <h2 className="text-xl font-semibold mystery-font">Custom Announcement (TTS)</h2>
          </div>
          
          {/* Playback Speed Controller */}
          <div className="flex items-center space-x-3 bg-black/40 px-3 py-1.5 rounded-full border border-gray-700/50">
            <FastForward size={14} className="text-red-600" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Speed</span>
            <input 
              type="range" 
              min="0.5" 
              max="2.0" 
              step="0.1" 
              value={playbackSpeed}
              onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
              className="w-16 accent-red-700 h-1 cursor-pointer"
            />
            <span className="text-xs font-mono text-red-500 w-8">{playbackSpeed.toFixed(1)}x</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <textarea
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="안내할 메시지를 입력하세요... (예: 범인이 발견되었습니다!)"
            className="flex-grow bg-black/50 border border-gray-700 rounded-lg p-4 text-sm focus:ring-1 focus:ring-red-900 focus:border-red-900 outline-none resize-none h-24 transition-all"
          />
          <button
            onClick={() => handleSpeak(customText)}
            disabled={!customText || isSpeaking}
            className={`sm:w-32 flex flex-col items-center justify-center p-4 rounded-lg transition-all ${
              !customText || isSpeaking
                ? "bg-gray-800 text-gray-600 cursor-not-allowed"
                : "bg-red-900 hover:bg-red-700 text-white shadow-lg active:scale-95"
            }`}
          >
            {isSpeaking ? (
              <div className="animate-pulse flex flex-col items-center">
                <Volume2 size={24} className="mb-2" />
                <span className="text-[10px] uppercase font-bold">Speaking</span>
              </div>
            ) : (
              <>
                <Volume2 size={24} className="mb-2" />
                <span className="text-xs font-bold uppercase tracking-wider">Broadcast</span>
              </>
            )}
          </button>
        </div>
        <div className="mt-4 flex justify-between items-center text-[10px] text-gray-600 uppercase tracking-tighter">
          <span>AI Voice: Kore (Mysterious Mode)</span>
          <span>Powered by Gemini API</span>
        </div>
      </div>

      {/* Audio Context Note */}
      <p className="mt-8 text-[10px] text-gray-700 text-center max-w-md">
        Note: TTS playback requires a user gesture. Ensure you have clicked play or reset at least once to enable automated alerts.
      </p>
    </div>
  );
};

export default App;
