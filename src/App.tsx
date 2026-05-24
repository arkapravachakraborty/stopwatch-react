import { useState, useRef, useEffect } from 'react';
import './App.css';

interface Lap {
  id: number;
  lapTime: number;       // Cumulative time when lap was recorded
  splitTime: number;     // Duration of this specific lap
}

function App() {
  const [time, setTime] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [laps, setLaps] = useState<Lap[]>([]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showShortcuts, setShowShortcuts] = useState<boolean>(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const timeRef = useRef<number>(0);
  const isRunningRef = useRef<boolean>(false);
  const lapsRef = useRef<Lap[]>([]);
  const soundEnabledRef = useRef<boolean>(true);

  // Sync state values with refs to completely eliminate stale closures in high-frequency event loops
  useEffect(() => { timeRef.current = time; }, [time]);
  useEffect(() => { isRunningRef.current = isRunning; }, [isRunning]);
  useEffect(() => { lapsRef.current = laps; }, [laps]);
  useEffect(() => { soundEnabledRef.current = soundEnabled; }, [soundEnabled]);

  // Synthesize digital stopwatch sound effects using Web Audio API
  const playBeep = (type: 'start' | 'stop' | 'lap' | 'reset') => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      
      const ctx = new AudioContextClass();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === 'start') {
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        gain.gain.setValueAtTime(0.03, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.08);
      } else if (type === 'stop') {
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        gain.gain.setValueAtTime(0.03, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.12);
      } else if (type === 'lap') {
        osc.frequency.setValueAtTime(950, ctx.currentTime);
        gain.gain.setValueAtTime(0.025, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.06);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.06);
      } else if (type === 'reset') {
        osc.frequency.setValueAtTime(450, ctx.currentTime);
        gain.gain.setValueAtTime(0.03, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.15);
      }
    } catch (error) {
      console.warn('Audio Context interaction error:', error);
    }
  };

  const handleStart = () => {
    if (isRunningRef.current) return;

    setIsRunning(true);
    if (soundEnabledRef.current) playBeep('start');

    startTimeRef.current = Date.now() - timeRef.current;

    intervalRef.current = setInterval(() => {
      setTime(Date.now() - startTimeRef.current);
    }, 10);
  };

  const handlePause = () => {
    if (!isRunningRef.current) return;

    setIsRunning(false);
    if (soundEnabledRef.current) playBeep('stop');

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    if (soundEnabledRef.current) playBeep('reset');

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setTime(0);
    setLaps([]);
  };

  const handleLap = () => {
    if (!isRunningRef.current) return;
    
    if (soundEnabledRef.current) playBeep('lap');
    
    const currentLatestTime = timeRef.current;
    
    setLaps((prevLaps) => {
      const prevLapTime = prevLaps.length > 0 ? prevLaps[prevLaps.length - 1].lapTime : 0;
      const splitTime = currentLatestTime - prevLapTime;
      const newLap: Lap = {
        id: prevLaps.length + 1,
        lapTime: currentLatestTime,
        splitTime: splitTime
      };
      return [...prevLaps, newLap];
    });
  };

  const handleDeleteLap = (idToDelete: number) => {
    if (soundEnabledRef.current) playBeep('stop');
    setLaps((prevLaps) => {
      const filteredLaps = prevLaps.filter((lap) => lap.id !== idToDelete);
      return filteredLaps.map((lap, index) => ({
        ...lap,
        id: index + 1,
        splitTime: index === 0 ? lap.lapTime : lap.lapTime - filteredLaps[index - 1].lapTime
      }));
    });
  };

  const handleClearAllLaps = () => {
    if (soundEnabledRef.current) playBeep('reset');
    setLaps([]);
  };

  const handleToggleStartPause = () => {
    if (isRunningRef.current) {
      handlePause();
    } else {
      handleStart();
    }
  };

  // Set up global keyboard shortcuts - bound once for optimum performance and zero closure lag
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }
      
      switch (e.code) {
        case 'Space':
          e.preventDefault(); // Stop page scroll
          if (isRunningRef.current) {
            handlePause();
          } else {
            handleStart();
          }
          break;
        case 'KeyL':
          e.preventDefault();
          if (isRunningRef.current) {
            handleLap();
          }
          break;
        case 'KeyR':
          e.preventDefault();
          handleReset();
          break;
        case 'Escape':
        case 'KeyC':
          e.preventDefault();
          handleClearAllLaps();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Clean up timer interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Time formatter helper
  const formatTimeComponents = (ms: number) => {
    const totalMs = Math.floor(ms);
    const centiseconds = Math.floor((totalMs % 1000) / 10);
    const totalSeconds = Math.floor(totalMs / 1000);
    const seconds = totalSeconds % 60;
    const totalMinutes = Math.floor(totalSeconds / 60);
    const minutes = totalMinutes % 60;
    const hours = Math.floor(totalMinutes / 60);

    return {
      hours: hours.toString().padStart(2, '0'),
      minutes: minutes.toString().padStart(2, '0'),
      seconds: seconds.toString().padStart(2, '0'),
      centiseconds: centiseconds.toString().padStart(2, '0'),
      hasHours: hours > 0
    };
  };

  const formatLapTime = (ms: number): string => {
    const { hours, minutes, seconds, centiseconds, hasHours } = formatTimeComponents(ms);
    if (hasHours) {
      return `${hours}:${minutes}:${seconds}.${centiseconds}`;
    }
    return `${minutes}:${seconds}.${centiseconds}`;
  };

  // Lap statistics calculations
  const getLapStats = () => {
    if (laps.length === 0) return { fastestId: -1, slowestId: -1, average: 0 };
    
    let fastestId = laps[0].id;
    let slowestId = laps[0].id;
    let minSplit = laps[0].splitTime;
    let maxSplit = laps[0].splitTime;
    let totalSplit = 0;

    laps.forEach((lap) => {
      totalSplit += lap.splitTime;
      if (laps.length >= 2) {
        if (lap.splitTime < minSplit) {
          minSplit = lap.splitTime;
          fastestId = lap.id;
        }
        if (lap.splitTime > maxSplit) {
          maxSplit = lap.splitTime;
          slowestId = lap.id;
        }
      }
    });

    // If only 1 lap exists, we don't highlight fastest/slowest as it's the same
    const finalFastest = laps.length >= 2 ? fastestId : -1;
    const finalSlowest = laps.length >= 2 ? slowestId : -1;

    return {
      fastestId: finalFastest,
      slowestId: finalSlowest,
      average: totalSplit / laps.length
    };
  };

  const { fastestId, slowestId, average } = getLapStats();

  // Mechanical Dial Calculations
  const secondsRotation = ((time % 60000) / 60000) * 360;
  
  // Compute dial tick lines
  const renderDialTicks = () => {
    const ticks = [];
    for (let i = 0; i < 60; i++) {
      const angle = i * 6; // 360 / 60 = 6 degrees
      const isMajor = i % 5 === 0;
      ticks.push(
        <line
          key={i}
          x1="100"
          y1={isMajor ? "8" : "11"}
          x2="100"
          y2="15"
          transform={`rotate(${angle} 100 100)`}
          stroke={isMajor ? "#18181b" : "#e4e4e7"}
          strokeWidth={isMajor ? 1.5 : 1}
        />
      );
    }
    return ticks;
  };

  // Determine indicator position coordinates on dial
  const theta = (secondsRotation - 90) * (Math.PI / 180);
  const dotX = 100 + 86 * Math.cos(theta);
  const dotY = 100 + 86 * Math.sin(theta);

  const { hours, minutes, seconds, centiseconds, hasHours } = formatTimeComponents(time);

  return (
    <>
      {/* Background decoration grid */}
      <div className="dot-grid"></div>

      <div className="w-full max-w-4xl stopwatch-card overflow-hidden">
        {/* Card Header & Custom Controls */}
        <div className="flex items-center justify-between px-4 py-4 sm:px-8 sm:py-5 border-b border-zinc-100 bg-white/70 backdrop-blur-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ff4500]"></div>
            <span className="font-sans text-[11px] tracking-[0.3em] font-bold text-zinc-900 uppercase">
              CHRONOS
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Keyboard Shortcuts Trigger */}
            <button
              onClick={() => setShowShortcuts(!showShortcuts)}
              className={`p-2 rounded-xl border transition-all duration-200 cursor-pointer ${
                showShortcuts
                  ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
                  : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100 hover:text-zinc-900'
              }`}
              title="Keyboard Shortcuts"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M7 16h10" strokeLinecap="round" />
              </svg>
            </button>

            {/* Sound Effects Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl border transition-all duration-200 cursor-pointer ${
                soundEnabled
                  ? 'bg-zinc-100 text-zinc-900 border-zinc-200 hover:bg-zinc-200'
                  : 'bg-zinc-50/50 text-zinc-400 border-zinc-200/60 line-through'
              }`}
              title={soundEnabled ? "Mute Sounds" : "Unmute Sounds"}
            >
              {soundEnabled ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6L4.5 12m0 0l-1.5 1.5M4.5 12l-1.5-1.5M4.5 12l1.5 1.5m.75-1.5h2.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H6.75V10.5z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Shortcuts Slide-down Panel */}
        {showShortcuts && (
          <div className="px-8 py-4 bg-zinc-50 border-b border-zinc-100 flex flex-wrap gap-4 text-xs text-zinc-600 justify-between items-center transition-all duration-300">
            <span className="font-semibold text-zinc-800">Quick Keyboard Controls:</span>
            <div className="flex flex-wrap gap-4">
              <span className="flex items-center gap-1.5">
                <kbd className="px-2 py-0.5 bg-white border border-zinc-200 rounded text-[10px] font-mono shadow-xs text-zinc-800">Space</kbd> Start / Pause
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="px-2 py-0.5 bg-white border border-zinc-200 rounded text-[10px] font-mono shadow-xs text-zinc-800">L</kbd> Record Lap
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="px-2 py-0.5 bg-white border border-zinc-200 rounded text-[10px] font-mono shadow-xs text-zinc-800">R</kbd> Reset Watch
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="px-2 py-0.5 bg-white border border-zinc-200 rounded text-[10px] font-mono shadow-xs text-zinc-800">Esc</kbd> Clear Laps
              </span>
            </div>
            <button
              onClick={() => setShowShortcuts(false)}
              className="text-zinc-400 hover:text-zinc-600 text-xs font-semibold cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Core Layout Split Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 bg-white">
          
          {/* LEFT PANEL: Dial & Main Actions */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center p-4 py-8 sm:p-8 md:p-12 border-b lg:border-b-0 lg:border-r border-zinc-100">
            
            {/* Visual Watch Face */}
            <div className="relative flex items-center justify-center w-[230px] h-[230px] min-[370px]:w-64 min-[370px]:h-64 sm:w-72 sm:h-72 mb-10">
              
              {/* Outer dial ring shadow */}
              <div className="absolute inset-0 rounded-full border border-zinc-100/80 shadow-md bg-zinc-50/10"></div>
              
              {/* Sweeping progress glow ring */}
              <div className="absolute inset-4 rounded-full bg-white shadow-xl shadow-zinc-100"></div>

              {/* Watch SVG Dial */}
              <svg className="absolute inset-0 w-full h-full p-2" viewBox="0 0 200 200">
                {/* Dial Tracks */}
                <circle cx="100" cy="100" r="92" fill="none" stroke="#f4f4f5" strokeWidth="1" />
                <circle cx="100" cy="100" r="86" fill="none" stroke="#eae8e2" strokeWidth="0.5" strokeDasharray="2 3" />
                
                {/* Colorful Sweeping Track (Seconds Loop) */}
                <circle
                  cx="100"
                  cy="100"
                  r="86"
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="2"
                  strokeDasharray={2 * Math.PI * 86}
                  strokeDashoffset={2 * Math.PI * 86 - (2 * Math.PI * 86 * (time % 60000)) / 60000}
                  strokeLinecap="round"
                  transform="rotate(-90 100 100)"
                  className="opacity-15"
                />

                {/* Dial Ticks */}
                {renderDialTicks()}

                {/* 15s intervals text marks */}
                <text x="100" y="27" textAnchor="middle" fontSize="8" fontWeight="700" fill="#18181b" className="font-sans tracking-wide">60</text>
                <text x="175" y="103" textAnchor="middle" fontSize="8" fontWeight="700" fill="#18181b" className="font-sans tracking-wide">15</text>
                <text x="100" y="179" textAnchor="middle" fontSize="8" fontWeight="700" fill="#18181b" className="font-sans tracking-wide">30</text>
                <text x="26" y="103" textAnchor="middle" fontSize="8" fontWeight="700" fill="#18181b" className="font-sans tracking-wide">45</text>

                {/* Sweeping Needle Dial indicator */}
                <g transform={`rotate(${secondsRotation} 100 100)`}>
                  <line x1="100" y1="100" x2="100" y2="114" stroke="var(--accent)" strokeWidth="1.25" strokeLinecap="round" className="opacity-80" />
                  <line x1="100" y1="100" x2="100" y2="22" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx="100" cy="100" r="3.5" fill="var(--accent)" />
                  <circle cx="100" cy="100" r="1.2" fill="#ffffff" />
                </g>

                {/* Sweeping outer track tip dot */}
                <circle cx={dotX} cy={dotY} r="3" fill="var(--accent)" className="shadow-xs" />
              </svg>

              {/* Digital Readout absolute centerpiece */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
                <span className={`text-[10px] tracking-[0.25em] font-bold transition-all duration-300 ${
                  isRunning ? 'text-[#ff4500] animate-pulse' : 'text-zinc-400'
                }`}>
                  {isRunning ? 'RUNNING' : time > 0 ? 'PAUSED' : 'READY'}
                </span>
                
                <div className="flex items-baseline font-time mt-1.5">
                  {hasHours && (
                    <>
                      <span className="text-2xl min-[370px]:text-3xl font-semibold text-zinc-900 leading-none">{hours}</span>
                      <span className="text-xl min-[370px]:text-2xl font-semibold text-zinc-300 mx-0.5 leading-none">:</span>
                    </>
                  )}
                  <span className="text-3xl min-[370px]:text-4xl sm:text-5xl font-semibold text-zinc-900 leading-none">{minutes}</span>
                  <span className="text-2xl min-[370px]:text-3xl sm:text-4xl font-semibold text-zinc-300 mx-0.5 leading-none">:</span>
                  <span className="text-3xl min-[370px]:text-4xl sm:text-5xl font-semibold text-zinc-900 leading-none">{seconds}</span>
                  <span className="text-xl min-[370px]:text-2xl sm:text-3xl font-semibold text-zinc-300 leading-none">.</span>
                  <span className="text-xl min-[370px]:text-2xl sm:text-3xl font-bold text-[#ff4500] leading-none">{centiseconds}</span>
                </div>

                <span className="text-[10px] text-zinc-400 font-semibold mt-2 tracking-wider uppercase font-sans">
                  {laps.length} {laps.length === 1 ? 'Lap' : 'Laps'}
                </span>
              </div>
            </div>

            {/* Premium Button Action Controls */}
            <div className="w-full max-w-sm flex items-center justify-between gap-2 sm:gap-4">
              
              {/* Reset Button */}
              <button
                onClick={handleReset}
                disabled={time === 0}
                className={`flex-1 py-3 px-3 sm:px-4 rounded-2xl font-sans text-sm font-semibold flex items-center justify-center gap-1.5 sm:gap-2 border shadow-sm transition-all duration-200 cursor-pointer ${
                  time > 0
                    ? 'bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-700 active:scale-95'
                    : 'bg-zinc-50/50 text-zinc-300 border-zinc-100 cursor-not-allowed'
                }`}
              >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                <span className="hidden sm:inline">Reset</span>
              </button>

              {/* Start / Pause Button */}
              <button
                onClick={handleToggleStartPause}
                className={`flex-[1.5] py-3 px-4 sm:px-6 rounded-2xl font-sans text-sm font-bold flex items-center justify-center gap-1.5 sm:gap-2.5 transition-all duration-200 shadow-md cursor-pointer hover:shadow-lg active:scale-95 ${
                  isRunning
                    ? 'bg-[#ff4500] hover:bg-[#e03d00] text-white hover:shadow-orange-100'
                    : 'bg-zinc-950 hover:bg-zinc-900 text-white hover:shadow-zinc-200'
                }`}
              >
                {isRunning ? (
                  <>
                    <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <rect x="6" y="4" width="4" height="16" rx="1" />
                      <rect x="14" y="4" width="4" height="16" rx="1" />
                    </svg>
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 fill-white shrink-0" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    <span>Start</span>
                  </>
                )}
              </button>

              {/* Lap Button */}
              <button
                onClick={handleLap}
                disabled={!isRunning}
                className={`flex-1 py-3 px-3 sm:px-4 rounded-2xl font-sans text-sm font-semibold flex items-center justify-center gap-1.5 sm:gap-2 border shadow-sm transition-all duration-200 cursor-pointer ${
                  isRunning
                    ? 'bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-700 active:scale-95'
                    : 'bg-zinc-50/50 text-zinc-300 border-zinc-100 cursor-not-allowed'
                }`}
              >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-6.005-12.283A48.474 48.474 0 006 4.5H3.5A2.5 2.5 0 001 7v5a2.5 2.5 0 002.5 2.5H3" />
                </svg>
                <span className="hidden sm:inline">Lap</span>
              </button>

            </div>
          </div>

          {/* RIGHT PANEL: Lap lists & statistics */}
          <div className="lg:col-span-5 flex flex-col bg-zinc-50/40 p-4 sm:p-6 md:p-8 justify-between">
            
            {/* Laps List Header with Statistics */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Lap Records
                </h3>
                {laps.length > 0 && (
                  <button
                    onClick={handleClearAllLaps}
                    className="text-xs font-semibold text-zinc-400 hover:text-red-500 cursor-pointer transition-colors duration-200 flex items-center gap-1"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Clear All</span>
                  </button>
                )}
              </div>

              {/* Stats Bar */}
              {laps.length >= 2 ? (
                <div className="grid grid-cols-3 gap-2.5 mb-6">
                  {/* Fastest lap stat */}
                  <div className="bg-white/80 border border-zinc-100 rounded-xl p-3 shadow-xs">
                    <span className="block text-[9px] uppercase tracking-wider font-bold text-emerald-500 mb-1">
                      Fastest
                    </span>
                    <span className="font-time text-xs font-bold text-zinc-800">
                      {formatLapTime(laps.find(l => l.id === fastestId)?.splitTime || 0)}
                    </span>
                  </div>
                  {/* Slowest lap stat */}
                  <div className="bg-white/80 border border-zinc-100 rounded-xl p-3 shadow-xs">
                    <span className="block text-[9px] uppercase tracking-wider font-bold text-rose-500 mb-1">
                      Slowest
                    </span>
                    <span className="font-time text-xs font-bold text-zinc-800">
                      {formatLapTime(laps.find(l => l.id === slowestId)?.splitTime || 0)}
                    </span>
                  </div>
                  {/* Average split stat */}
                  <div className="bg-white/80 border border-zinc-100 rounded-xl p-3 shadow-xs">
                    <span className="block text-[9px] uppercase tracking-wider font-bold text-zinc-400 mb-1">
                      Average
                    </span>
                    <span className="font-time text-xs font-bold text-zinc-800">
                      {formatLapTime(average)}
                    </span>
                  </div>
                </div>
              ) : null}

              {/* Laps List */}
              {laps.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-10 h-10 rounded-full border border-dashed border-zinc-200 flex items-center justify-center text-zinc-300 mb-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-xs font-medium text-zinc-400">No laps recorded yet</p>
                  <p className="text-[10px] text-zinc-300 mt-1">Press LAP while stopwatch is running</p>
                </div>
              ) : (
                <div className="max-h-[300px] lg:max-h-[350px] overflow-y-auto pr-1 flex flex-col gap-2">
                  {[...laps].reverse().map((lap) => {
                    const isFastest = lap.id === fastestId;
                    const isSlowest = lap.id === slowestId;

                    return (
                      <div
                        key={lap.id}
                        className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-300 bg-white group ${
                          isFastest
                            ? 'border-emerald-100 bg-emerald-50/15'
                            : isSlowest
                            ? 'border-rose-100 bg-rose-50/15'
                            : 'border-zinc-100 hover:border-zinc-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Lap sequence index number */}
                          <span className="font-sans text-xs font-bold text-zinc-400">
                            #{lap.id.toString().padStart(2, '0')}
                          </span>

                          <div className="flex flex-col">
                            {/* Lap split duration */}
                            <span className="font-time text-sm font-semibold text-zinc-800 leading-tight">
                              {formatLapTime(lap.splitTime)}
                            </span>
                            {/* Cumulative overall time */}
                            <span className="font-time text-[10px] font-medium text-zinc-400">
                              Cum. {formatLapTime(lap.lapTime)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Beautiful dynamic badge pill for Fastest / Slowest */}
                          {isFastest && (
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center gap-0.5">
                              <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                              </svg>
                              <span>FASTEST</span>
                            </span>
                          )}
                          {isSlowest && (
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-rose-50 border border-rose-100 text-rose-600 flex items-center gap-0.5">
                              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>SLOWEST</span>
                            </span>
                          )}

                          {/* Delete individual lap action */}
                          <button
                            onClick={() => handleDeleteLap(lap.id)}
                            className="p-1.5 rounded-lg text-zinc-300 hover:text-red-500 hover:bg-red-50 transition-all duration-200 cursor-pointer lg:opacity-0 lg:group-hover:opacity-100"
                            title="Delete Lap"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Decorative Quote or Minimalistic Subtitle at Bottom */}
            {laps.length > 0 && (
              <div className="mt-6 border-t border-zinc-100 pt-4 text-center">
                <span className="text-[10px] italic font-medium text-zinc-400">
                  Precision is the soul of performance.
                </span>
              </div>
            )}

          </div>

        </div>
      </div>
    </>
  );
}

export default App;
