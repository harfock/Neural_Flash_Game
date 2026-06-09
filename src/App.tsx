import { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  RotateCcw, 
  ChevronRight, 
  Settings, 
  Volume2, 
  VolumeX, 
  Star, 
  Info,
  Layers,
  Award,
  BookOpen,
  ArrowRight,
  Flame,
  HelpCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Profile, GameStatus, Cell, ClickRecord, GameHistory } from './types';
import { ProfileSelector } from './components/ProfileSelector';
import { Header } from './components/Header';
import { HistoryPanel } from './components/HistoryPanel';
import { assignAlternatingColors, EMOJIS, getLetterLabel } from './utils';
import { updateProfileLevel, saveGameHistory, fetchProfileHistory } from './firebaseUtils';

export default function App() {
  // Locale State
  const [lang, setLang] = useState<'big5' | 'en'>('big5');
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [isGoogleSynced, setIsGoogleSynced] = useState<boolean>(false);
  const [pastHistory, setPastHistory] = useState<GameHistory[]>([]);

  // Symbol Category Mode: 'numbers' | 'letters' | 'emojis'
  const [labelMode, setLabelMode] = useState<'numbers' | 'letters' | 'emojis'>('numbers');

  // Active Game State
  const [gameStatus, setGameStatus] = useState<GameStatus>('idle');
  const [level, setLevel] = useState<number>(1);
  const [score, setScore] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);
  const maxLives = 3;

  // Timers and helpers
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [memRemaining, setMemRemaining] = useState<number>(0);
  const [isElderly, setIsElderly] = useState<boolean>(false);

  // Interaction logs
  const [cells, setCells] = useState<Cell[]>([]);
  const [targetCount, setTargetCount] = useState<number>(0);
  const [foundCount, setFoundCount] = useState<number>(0);
  const [currentRoundClicks, setCurrentRoundClicks] = useState<ClickRecord[]>([]);

  // Sound selection indicator helper
  const [isSoundOn, setIsSoundOn] = useState<boolean>(true);

  // Layout structure refs and game interval
  const timerRef = useRef<any>(null);
  const msgRef = useRef<any>(null);

  const isChinese = lang === 'big5';

  // Play a simple low/high frequency audio tone using browser synthesizer!
  // Completely offline, no dependencies needed, perfect accessibility!
  const playPulseSound = (frequency: number, type: 'sine' | 'square' | 'triangle' | 'sawtooth' = 'sine', duration = 0.15) => {
    if (!isSoundOn) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
      
      gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + duration);
    } catch (e) {
      console.warn("Audio Context is blocked/not available:", e);
    }
  };

  // Switch active profile
  const handleProfileSelect = (p: Profile | null, isGoogleUser: boolean) => {
    setActiveProfile(p);
    setIsGoogleSynced(isGoogleUser);
    if (p) {
      setLevel(p.maxLvl);
      setScore((p.maxLvl - 1) * 100);
      setGameStatus('idle');
      // Load selected profile's history
      loadProfileHistory(p.id, isGoogleUser);
    } else {
      setPastHistory([]);
    }
  };

  const loadProfileHistory = async (profileId: string, isGoogleUser: boolean) => {
    if (isGoogleUser) {
      try {
        const list = await fetchProfileHistory(profileId, 'active');
        setPastHistory(list);
      } catch (err) {
        console.error("Failed to load history:", err);
      }
    } else {
      // Local Guest history loading
      const cached = localStorage.getItem(`blitz_history_${profileId}`);
      if (cached) {
        setPastHistory(JSON.parse(cached));
      } else {
        setPastHistory([]);
      }
    }
  };

  // Safe save game progress (supports both cloud of Firebase and Guest local fallback)
  const saveLevelCleared = async (clearedLevel: number, nextLevel: number, finalRoundScore: number, finalLives: number, clicks: string[]) => {
    if (!activeProfile) return;

    const clickStatements = clicks;

    if (isGoogleSynced) {
      try {
        // 1. Sync max achieved level to firestore
        await updateProfileLevel(activeProfile.id, nextLevel);
        // 2. Add history record to game_history
        await saveGameHistory(activeProfile.id, clearedLevel, finalRoundScore, finalLives, clickStatements, 'active');
      } catch (err) {
        console.error("Could not sync to cloud profile:", err);
      }
      // Re-load history list to refresh displays
      loadProfileHistory(activeProfile.id, true);
    } else {
      // Keep state locally for Guest
      const localSaves = localStorage.getItem('blitz_guests_v2');
      if (localSaves) {
        const parsed = JSON.parse(localSaves) as Profile[];
        const index = parsed.findIndex(p => p.id === activeProfile.id);
        if (index > -1) {
          if (nextLevel > parsed[index].maxLvl) {
            parsed[index].maxLvl = nextLevel;
            parsed[index].updatedAt = new Date().toISOString();
            localStorage.setItem('blitz_guests_v2', JSON.stringify(parsed));
            setActiveProfile(parsed[index]);
          }
        }
      }

      // Guest Round history logger
      const historyKey = `blitz_history_${activeProfile.id}`;
      const existingHistoryJson = localStorage.getItem(historyKey) || '[]';
      const existingHistory = JSON.parse(existingHistoryJson) as GameHistory[];
      
      const newHistoryItem: GameHistory = {
        id: 'hist_' + Date.now(),
        profileId: activeProfile.id,
        level: clearedLevel,
        score: finalRoundScore,
        livesRemaining: finalLives,
        clicks: clickStatements,
        timestamp: new Date().toISOString(),
        ownerId: 'guest'
      };
      
      const updatedHistory = [newHistoryItem, ...existingHistory];
      localStorage.setItem(historyKey, JSON.stringify(updatedHistory));
      setPastHistory(updatedHistory);
    }
  };

  // Launch the memory round
  const startRound = (startLvl: number) => {
    clearInterval(timerRef.current);
    
    // Grid calculations based on level (highly intuitive, spacious, perfect sizes)
    let cols = 3;
    let rows = 3;
    if (startLvl <= 4) {
      cols = 3; rows = 3; // 3x3 Grid
    } else if (startLvl <= 8) {
      cols = 4; rows = 4; // 4x4 Grid
    } else if (startLvl <= 12) {
      cols = 5; rows = 5; // 5x5 Grid
    } else {
      cols = 6; rows = 6; // 6x6 max Grid
    }

    const cellCount = cols * rows;
    
    // Determine number of flashes targets (bounded clearly for accessibility)
    const targetsNeeded = Math.min(Math.max(2 + Math.floor(startLvl / 3), 2), 10);
    
    setTargetCount(targetsNeeded);
    setFoundCount(0);
    setLives(maxLives);
    setCurrentRoundClicks([]);

    // Generate label pool
    let labelPool: string[] = [];
    if (labelMode === 'emojis') {
      const shuffledEmojis = [...EMOJIS].sort(() => 0.5 - Math.random());
      labelPool = shuffledEmojis.slice(0, cellCount);
    } else {
      for (let i = 0; i < cellCount; i++) {
        labelPool.push(labelMode === 'numbers' ? String(i + 1) : getLetterLabel(i));
      }
    }

    // Set up unique alternating colors for guaranteed difference (no adjacent matches!)
    const colorPool = assignAlternatingColors(cellCount, cols);

    // Pick target indexes random
    const targetIndices: number[] = [];
    while (targetIndices.length < targetsNeeded) {
      const randIdx = Math.floor(Math.random() * cellCount);
      if (!targetIndices.includes(randIdx)) {
        targetIndices.push(randIdx);
      }
    }

    // Build rich cell objects
    const initialCells: Cell[] = Array.from({ length: cellCount }).map((_, idx) => ({
      id: idx,
      label: labelPool[idx],
      color: colorPool[idx],
      isTarget: targetIndices.includes(idx),
      status: 'none'
    }));

    setCells(initialCells);
    setLevel(startLvl);
    setGameStatus('mem');

    // Reset play phase countdown (so it won't display stale previous value during memory phase)
    const initialPlaytime = 3.0 + targetsNeeded * 1.5;
    setTimeRemaining(initialPlaytime);

    // Run custom memory presentation timer
    const memDuration = Math.max(3, 2 + targetsNeeded * 0.8);
    setMemRemaining(memDuration);

    playPulseSound(587.33, 'triangle', 0.4); // Intro bright chime

    const intervalId = setInterval(() => {
      setMemRemaining(prev => {
        if (prev <= 1) {
          clearInterval(intervalId);
          startPlayPhase(initialCells, targetsNeeded, startLvl);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    timerRef.current = intervalId;
  };

  const startPlayPhase = (activeCells: Cell[], totalTargets: number, roundLevel: number) => {
    setGameStatus('play');
    playPulseSound(880, 'sine', 0.25); // GO sound

    // Dynamic timer duration based on difficulty
    const playtime = 3.0 + totalTargets * 1.5;
    setTimeRemaining(playtime);
  };

  // Handle cell clicking
  const handleCellClick = (cellIndex: number) => {
    if (gameStatus !== 'play') return;
    
    const targetCell = cells[cellIndex];
    if (targetCell.status !== 'none') return; // Cannot repeat clicks on already processed cells

    // Clone list
    const updatedCells = [...cells];
    const newRecord: ClickRecord = {
      timestamp: Date.now(),
      cellId: targetCell.id,
      label: targetCell.label,
      isCorrect: targetCell.isTarget,
      livesAfter: lives
    };

    if (targetCell.isTarget) {
      // SUCCESS matched target
      updatedCells[cellIndex].status = 'correct';
      setCells(updatedCells);
      const nextFound = foundCount + 1;
      setFoundCount(nextFound);

      // Log click history action
      setCurrentRoundClicks(prev => [newRecord, ...prev]);
      
      playPulseSound(784, 'sine', 0.15); // Clear high tone

      // Check level win
      if (nextFound === targetCount) {
        triggerLevelWin();
      }
    } else {
      // WRONG mismatch selection
      updatedCells[cellIndex].status = 'wrong';
      setCells(updatedCells);
      
      // Multi-Life system: penalize by decreasing state lives
      const nextLives = lives - 1;
      setLives(nextLives);

      newRecord.livesAfter = nextLives;
      setCurrentRoundClicks(prev => [newRecord, ...prev]);

      playPulseSound(220, 'sawtooth', 0.4); // Buzz sound feedback

      if (nextLives <= 0) {
        triggerGameOver();
      }
    }
  };

  const triggerLevelWin = () => {
    clearInterval(timerRef.current);
    setGameStatus('win');
    
    playPulseSound(1046.50, 'sine', 0.5); // Majestic triumph chord

    // Add round scoring
    const finalLivesCount = lives;
    const addedScore = level * 100 + (isElderly ? 50 : Math.floor(timeRemaining * 10));
    setScore(prev => prev + addedScore);

    // Get arrays of all click descriptions
    const clickLogs = [...currentRoundClicks].reverse().map((click, index) => 
      `${index + 1}. 氣泡 [${click.label}] -> ${click.isCorrect ? '正確 ✔' : '錯誤 ✖'}`
    );

    // Save progress triggers
    saveLevelCleared(level, level + 1, score + addedScore, finalLivesCount, clickLogs);
  };

  const triggerGameOver = () => {
    clearInterval(timerRef.current);
    setGameStatus('fail');
    
    playPulseSound(146.83, 'sawtooth', 0.6); // Deep failure sound
  };

  // Robust play-phase countdown timer linked to gameStatus and Senior Mode toggles
  useEffect(() => {
    if (gameStatus !== 'play' || isElderly) {
      return;
    }

    const playInterval = setInterval(() => {
      setTimeRemaining(curr => {
        if (curr <= 0.1) {
          triggerGameOver();
          return 0;
        }
        return curr - 0.1;
      });
    }, 100);

    return () => {
      clearInterval(playInterval);
    };
  }, [gameStatus, isElderly]);

  // Restart settings
  const handleNextLevel = () => {
    startRound(level + 1);
  };

  const handleRetry = () => {
    startRound(level);
  };

  const handleStartOver = () => {
    startRound(1);
  };

  const handleExitGame = () => {
    clearInterval(timerRef.current);
    setGameStatus('idle');
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col justify-between" id="applet-root">
      
      {/* Top Banner Control Switch */}
      <div className="bg-zinc-900 border-b-4 border-zinc-800 px-6 py-4 flex justify-between items-center text-sm font-black uppercase tracking-wider">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-yellow-400 fill-yellow-400" />
          <span className="text-white text-lg font-black tracking-tighter">SNAPSHOT BLITZ</span>
          <span className="text-black bg-yellow-400 px-2 py-0.5 border border-black rounded-none mx-2 text-xs font-black">
            PRO ACCESSIBLE
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Sound Toggle */}
          <button
            onClick={() => setIsSoundOn(!isSoundOn)}
            className="p-2 bg-black hover:bg-zinc-850 text-white border-4 border-yellow-400 rounded-none flex items-center gap-1.5 text-xs font-black tracking-wide shadow-[2px_2px_0_#FFF]"
            title="Toggle Sound"
          >
            {isSoundOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
            <span>{isSoundOn ? (isChinese ? "聲音開" : "SOUND ON") : (isChinese ? "聲音關" : "SOUND OFF")}</span>
          </button>

          {/* Lang Toggle */}
          <button
            onClick={() => setLang(lang === 'big5' ? 'en' : 'big5')}
            className="p-2 bg-yellow-400 hover:bg-yellow-500 text-black border-4 border-black rounded-none text-xs font-black tracking-wide shadow-[2px_2px_0_#FFF]"
          >
            🌐 {isChinese ? "English" : "繁體中文"}
          </button>
        </div>
      </div>

      {/* Main Container Area */}
      <div className="flex-grow flex flex-col justify-center py-4">
        
        {activeProfile === null ? (
          /* Profile Selector / Setup Lobby Screen (Geometric Balance Style) */
          <div className="w-full max-w-2xl mx-auto px-4 py-8">
            <div className="text-center mb-10 flex flex-col items-center">
              <div className="w-24 h-24 bg-yellow-400 text-black border-4 border-white flex items-center justify-center text-5xl font-black mb-4 rounded-none shadow-[4px_4px_0_#000]">
                ⏳
              </div>
              <h1 className="text-4xl sm:text-5xl font-black text-white uppercase tracking-tighter mb-1">
                {isChinese ? "快照閃電戰：精準記憶" : "SNAPSHOT BLITZ"}
              </h1>
              <p className="text-lg sm:text-xl text-yellow-400 font-bold uppercase tracking-widest max-w-lg">
                {isChinese 
                  ? "專為長者設計的超高對比高彩、三段生命容錯挑戰遊戲" 
                  : "TRAINING SESSION 04 • HIGH CONTRAST MEMORY CHALLENGE"}
              </p>
            </div>

            <ProfileSelector 
              onProfileSelect={handleProfileSelect} 
              activeProfile={activeProfile}
            />

            {/* Accessible Tutorial (Geometric Balance Style) */}
            <div className="max-w-xl mx-auto mt-10 bg-zinc-900 border-l-8 border-yellow-400 p-8 rounded-none text-left shadow-[5px_5px_0_#FFF]">
              <h3 className="text-2xl font-black text-white mb-6 uppercase border-b-4 border-white pb-2 flex items-center gap-2">
                <BookOpen size={24} className="text-yellow-400" />
                <span>{isChinese ? "規則說明 / GAME RULES" : "TRAINING PROTOCOL"}</span>
              </h3>
              <ul className="space-y-4 text-base font-bold text-zinc-300">
                <li className="flex gap-2">
                  <span className="text-yellow-400 font-extrabold text-lg">01 //</span>
                  <span>{isChinese ? "記憶階段：黃色高亮氣泡為目標，請在規定時間內快速記住位置。" : "FLASH PHASE: Targets flash bright. Memorize their position."}</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-yellow-400 font-extrabold text-lg">02 //</span>
                  <span>{isChinese ? "點擊階段：憑藉剛才的記憶點選目標氣泡。所有號碼將會被隱藏。" : "SELECTION PHASE: Find and click correct grid buttons based on your memory."}</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-yellow-400 font-extrabold text-lg">03 //</span>
                  <span>{isChinese ? "容錯設計：一局包含 3 次嘗試機會！失誤點錯將扣減生命次數。" : "ERROR SYSTEM: Enjoy 3 lives protection. Misclicks cost attempts."}</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-yellow-400 font-extrabold text-lg">04 //</span>
                  <span>{isChinese ? "即時提示：我們提供即時點擊歷程記錄，方便在右側/底部查看歷史點擊結果。" : "MONITOR PROTOCOL: Realtime click history track is displayed for high readability."}</span>
                </li>
              </ul>
            </div>
          </div>
        ) : (
          /* Main active game loop stage */
          <div className="w-full flex flex-col justify-start">
            
            {/* Header statistics and controls widget */}
            <Header
              level={level}
              score={score}
              lives={lives}
              maxLives={maxLives}
              timeRemaining={timeRemaining}
              gameStatus={gameStatus}
              isElderly={isElderly}
              onToggleElderly={() => setIsElderly(!isElderly)}
              lang={lang}
            />

            {/* Standard Dashboard view when in IDLE lobby state */}
            {gameStatus === 'idle' && (
              <div className="w-full max-w-xl mx-auto p-4 py-8 flex flex-col gap-6 text-center">
                <div className="bg-zinc-900 border-l-8 border-yellow-400 p-8 text-white rounded-none shadow-[6px_6px_0_#FFF] flex flex-col items-center">
                  <h2 className="text-3xl font-black text-white mb-1 uppercase tracking-tighter">
                    {isChinese ? `你好，${activeProfile.name}！` : `HELLO, ${activeProfile.name}!`}
                  </h2>
                  <p className="text-xl font-bold text-yellow-400 mb-8 uppercase tracking-widest border-b-2 border-zinc-800 pb-3 w-full">
                    {isChinese ? `當前解鎖關卡：第 ${activeProfile.maxLvl} 關` : `UNLOCKED LEVEL: Level ${activeProfile.maxLvl}`}
                  </p>

                  {/* Grid Symbol Selection Mode for senior customization */}
                  <div className="w-full bg-black border-4 border-white p-5 rounded-none text-left mb-8">
                    <span className="block text-base font-black text-yellow-400 mb-3 flex items-center gap-1.5 uppercase tracking-wider">
                      <Layers size={18} />
                      <span>{isChinese ? "選擇氣泡符號類別 / SYMBOL STYLE" : "SELECT SYMBOL STYLE:"}</span>
                    </span>
                    <div className="grid grid-cols-3 gap-3 text-sm font-black text-white">
                      <button
                        onClick={() => setLabelMode('numbers')}
                        className={`p-3 rounded-none border-4 active:scale-95 transition-all flex flex-col items-center uppercase ${
                          labelMode === 'numbers' ? 'bg-yellow-400 text-black border-white shadow-[3px_3px_0_#000]' : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-850 text-zinc-400'
                        }`}
                      >
                        <span className="text-2xl mb-1">🔢</span>
                        <span>{isChinese ? "數字 (1..)" : "NUMBERS"}</span>
                      </button>
                      <button
                        onClick={() => setLabelMode('letters')}
                        className={`p-3 rounded-none border-4 active:scale-95 transition-all flex flex-col items-center uppercase ${
                          labelMode === 'letters' ? 'bg-yellow-400 text-black border-white shadow-[3px_3px_0_#000]' : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-850 text-zinc-400'
                        }`}
                      >
                        <span className="text-2xl mb-1">🔤</span>
                        <span>{isChinese ? "字母 (A..)" : "LETTERS"}</span>
                      </button>
                      <button
                        onClick={() => setLabelMode('emojis')}
                        className={`p-3 rounded-none border-4 active:scale-95 transition-all flex flex-col items-center uppercase ${
                          labelMode === 'emojis' ? 'bg-yellow-400 text-black border-white shadow-[3px_3px_0_#000]' : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-850 text-zinc-400'
                        }`}
                      >
                        <span className="text-2xl mb-1">🍇</span>
                        <span>{isChinese ? "圖示 EMO" : "EMOJIS"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Big clear chunky actions */}
                  <div className="w-full flex flex-col gap-4">
                    <button
                      onClick={() => startRound(level)}
                      className="w-full py-5 bg-green-500 hover:bg-green-600 text-black font-black text-3xl rounded-none border-4 border-black shadow-[4px_4px_0_#FFF] flex items-center justify-center gap-2 active:scale-95 transition-all uppercase tracking-tight"
                    >
                      <Play size={32} fill="currentColor" strokeWidth={0} />
                      <span>{isChinese ? "開始記憶挑戰！" : "START CHALLENGE!"}</span>
                    </button>

                    {level > 1 && (
                      <button
                        onClick={handleStartOver}
                        className="w-full py-4 bg-zinc-900 hover:bg-zinc-850 text-white font-black text-xl rounded-none border-4 border-white flex items-center justify-center gap-2 active:scale-95 transition-all uppercase tracking-tight shadow-[4px_4px_0_#000]"
                      >
                        <RotateCcw size={20} />
                        <span>{isChinese ? "從第 1 關重新開始 / RESET" : "RESET TO LVL 1"}</span>
                      </button>
                    )}

                    <button
                      onClick={handleExitGame}
                      className="w-full py-3 bg-red-600 hover:bg-red-705 text-white font-black text-lg border-4 border-white rounded-none active:scale-95 transition-all uppercase tracking-wider"
                    >
                      {isChinese ? "返回檔案選擇 / SWITCH PROFILE" : "SWITCH PROFILE"}
                    </button>
                  </div>
                </div>

                <HistoryPanel 
                  currentRoundClicks={currentRoundClicks}
                  pastHistory={pastHistory}
                  lang={lang}
                />
              </div>
            )}

            {/* Round Active Display */}
            {(gameStatus === 'mem' || gameStatus === 'play') && (
              <div className="w-full max-w-5xl mx-auto p-4 flex flex-col gap-6 items-center">
                
                {/* Live Status Board with extremely high-contrast yellow outline (Geometric Balance) */}
                <div className="w-full bg-zinc-900 border-l-8 border-yellow-400 p-6 rounded-none text-center flex flex-col justify-center items-center select-none shadow-[4px_4px_0_#FFF]">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-red-600 border-2 border-white animate-pulse" />
                    <span className="text-2xl font-black text-white uppercase tracking-tight">
                      {gameStatus === 'mem' 
                        ? (isChinese ? `第一階段：請記住亮黃色目標位置 [還剩: ${memRemaining}秒]` : `MEMORIZE PROTOCOL... [REMAINING: ${memRemaining}S]`)
                        : (isChinese ? `第二階段：選出剛才亮起的氣泡，還有 [ ${targetCount - foundCount} ] 個！` : `FIND TARGETS: [${targetCount - foundCount} LEFT]`)
                      }
                    </span>
                  </div>

                  {/* Multi-life status help */}
                  {gameStatus === 'play' && (
                    <p className="text-lg font-black text-yellow-400 mt-2 uppercase tracking-wide">
                      {isChinese 
                        ? `生命提示：您可以再點錯 ${lives - 1} 次！` 
                        : `LIFE PROTECTION: ${lives} OF ${maxLives} ATTEMPTS REMAINING`
                      }
                    </p>
                  )}
                </div>

                {/* Elderly Helper hint floating box */}
                {isElderly && gameStatus === 'play' && (
                  <div className="w-full max-w-xl bg-yellow-400 border-4 border-black p-4 rounded-none text-black font-black text-2xl text-center shadow-[4px_4px_0_#FFF] uppercase tracking-wide">
                    <span>💡 【長者提示】已找到 </span>
                    <span className="underline decoration-wavy font-black">{foundCount}</span>
                    <span> 個 / 剩餘：</span>
                    <span className="text-red-700 font-black">{targetCount - foundCount}</span>
                    <span> 個</span>
                  </div>
                )}

                {/* THE MEMORY GRID (Highly accessible Geometric Balance: rounded-2xl, border-8!) */}
                <div className="w-full flex justify-center items-center py-2">
                  <div 
                    className="grid gap-6 w-full max-w-md aspect-square bg-zinc-950 border-8 border-white p-6 rounded-none justify-center items-stretch justify-items-stretch shadow-[6px_6px_0_#000]"
                    style={{
                      gridTemplateColumns: `repeat(${level <= 4 ? 3 : level <= 8 ? 4 : level <= 12 ? 5 : 6}, minmax(0, 1fr))`,
                    }}
                  >
                    {cells.map((cell) => {
                      // High-contrast coloring logic based on current stage
                      let cellStyleState = "bg-zinc-900 border-zinc-700 text-white";
                      let renderSymbol = cell.label;
                      
                      if (gameStatus === 'mem') {
                        if (cell.isTarget) {
                          // Target is extremely vibrant, glowing yellow/cyan during memory stage
                          cellStyleState = "bg-yellow-400 text-black border-white font-black scale-105 shadow-2xl ring-4 ring-yellow-400";
                        } else {
                          // Unselected blocks stay extremely low-profile to emphasize target
                          cellStyleState = "bg-zinc-950 text-zinc-900 border-zinc-900 opacity-10";
                        }
                      } else if (gameStatus === 'play') {
                        if (cell.status === 'correct') {
                          // Correct clicked cells become bold high-contrast Lime Green
                          cellStyleState = "bg-green-500 text-black border-black font-black scale-95 duration-200 border-8";
                          renderSymbol = "✔";
                        } else if (cell.status === 'wrong') {
                          // Wrong clicked cells become chunky bold Red
                          cellStyleState = "bg-red-650 text-white border-white font-black scale-95 duration-200 border-8 border-double ring-4 ring-yellow-400";
                          renderSymbol = "✖";
                        } else {
                          // Normal selectable grids have high contrast borders and large legible identifiers
                          cellStyleState = "bg-zinc-900 hover:bg-zinc-800 text-white border-8 border-zinc-800";
                        }
                      }

                      return (
                        <motion.button
                          key={cell.id}
                          onClick={() => handleCellClick(cell.id)}
                          whileHover={cell.status === 'none' ? { scale: 1.05 } : {}}
                          whileTap={cell.status === 'none' ? { scale: 0.92 } : {}}
                          className={`rounded-2xl aspect-square text-3xl sm:text-4xl font-black flex items-center justify-center cursor-pointer transition-all ${cellStyleState}`}
                          style={{
                            // Border color is customized with our alternating colors preventing similar nearest
                            borderColor: cell.status === 'none' ? cell.color : undefined,
                            borderWidth: cell.status === 'none' ? '8px' : undefined
                          }}
                        >
                          {renderSymbol}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Instant Actions Track */}
                <HistoryPanel 
                  currentRoundClicks={currentRoundClicks}
                  pastHistory={pastHistory}
                  lang={lang}
                />
              </div>
            )}

            {/* Level Clear Win Screen (Geometric Balance) */}
            {gameStatus === 'win' && (
              <div className="w-full max-w-xl mx-auto p-4 py-8">
                <div className="bg-zinc-900 border-l-8 border-green-500 p-8 rounded-none text-center shadow-[6px_6px_0_#FFF] flex flex-col items-center">
                  <div className="w-20 h-20 bg-green-500 text-black border-4 border-white flex items-center justify-center text-4xl font-black mb-4 rounded-none shadow-[3px_3px_0_#000]">
                    ✔
                  </div>
                  <h1 className="text-4xl sm:text-5xl font-black text-green-450 mb-1 uppercase tracking-tighter">
                    {isChinese ? "大成功！關卡完成" : "LEVEL PASSED!"}
                  </h1>
                  <p className="text-2xl font-bold text-yellow-400 mb-6 uppercase tracking-widest">
                    {isChinese ? `成功通過 第 ${level} 關` : `PASSED STAGE ${level}`}
                  </p>

                  <div className="w-full bg-black border-4 border-white p-5 rounded-none text-left mb-6 font-bold uppercase tracking-wider space-y-3 text-base">
                    <p className="flex justify-between border-b-2 border-zinc-900 pb-1.5 text-zinc-450">
                      <span>{isChinese ? "目標氣泡總數" : "Total Targets"}:</span>
                      <span className="text-white font-black text-xl">{targetCount}</span>
                    </p>
                    <p className="flex justify-between border-b-2 border-zinc-900 pb-1.5 text-zinc-450">
                      <span>{isChinese ? "剩餘生命次數" : "Lives Remaining"}:</span>
                      <span className="text-red-500 font-black text-xl">❤️ {lives} / {maxLives}</span>
                    </p>
                    <p className="flex justify-between text-yellow-400">
                      <span>{isChinese ? "當前累積得分" : "Total Score"}:</span>
                      <span className="font-black text-2xl">{score}</span>
                    </p>
                  </div>

                  <div className="w-full flex flex-col gap-4">
                    <button
                      onClick={handleNextLevel}
                      className="w-full py-5 bg-green-500 hover:bg-green-600 text-black font-black text-3xl rounded-none border-4 border-black shadow-[4px_4px_0_#FFF] flex items-center justify-center gap-2 active:scale-95 transition-all uppercase tracking-tight"
                    >
                      <span>{isChinese ? "進入下一關" : "NEXT LEVEL"}</span>
                      <ChevronRight size={32} strokeWidth={3} />
                    </button>
                    <button
                      onClick={handleExitGame}
                      className="w-full py-3 bg-zinc-900 hover:bg-zinc-850 border-4 border-white text-white font-black text-xl rounded-none active:scale-95 transition-all uppercase tracking-wider shadow-[4px_4px_0_#000]"
                    >
                      {isChinese ? "返回主選單" : "MAIN LOBBY"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Level Fail Screen (Geometric Balance) */}
            {gameStatus === 'fail' && (
              <div className="w-full max-w-xl mx-auto p-4 py-8">
                <div className="bg-zinc-900 border-l-8 border-red-500 p-8 rounded-none text-center shadow-[6px_6px_0_#FFF] flex flex-col items-center">
                  <div className="w-20 h-20 bg-red-600 text-white border-4 border-white flex items-center justify-center text-4xl font-black mb-4 rounded-none shadow-[3px_3px_0_#000]">
                    ✕
                  </div>
                  <h1 className="text-4xl sm:text-5xl font-black text-red-500 mb-1 uppercase tracking-tighter">
                    {isChinese ? "挑戰結束" : "GAME OVER"}
                  </h1>
                  <p className="text-xl font-bold text-zinc-300 mb-6 uppercase tracking-wider">
                    {isChinese ? `生命已用盡。別氣餒，再試一次吧！` : `No lives left at Level ${level}.`}
                  </p>

                  <div className="w-full bg-black border-4 border-white p-5 rounded-none text-left mb-6 font-bold uppercase tracking-wider space-y-3 text-base">
                    <p className="flex justify-between border-b-2 border-zinc-900 pb-1.5 text-zinc-450">
                      <span>{isChinese ? "挑戰關卡" : "Reached Level"}:</span>
                      <span className="text-white font-black text-xl">{level}</span>
                    </p>
                    <p className="flex justify-between border-b-2 border-zinc-900 pb-1.5 text-zinc-450">
                      <span>{isChinese ? "已找目標" : "Targets Cleared"}:</span>
                      <span className="text-green-400 font-extrabold text-xl">{foundCount} / {targetCount}</span>
                    </p>
                    <p className="flex justify-between text-yellow-400">
                      <span>{isChinese ? "當前累積得分" : "Total Score"}:</span>
                      <span className="font-black text-2xl">{score}</span>
                    </p>
                  </div>

                  <div className="w-full flex flex-col gap-4">
                    <button
                      onClick={handleRetry}
                      className="w-full py-5 bg-yellow-400 hover:bg-yellow-500 text-black font-black text-3xl rounded-none border-4 border-black shadow-[4px_4px_0_#FFF] flex items-center justify-center gap-2 active:scale-95 transition-all uppercase tracking-tight"
                    >
                      <RotateCcw size={28} strokeWidth={3} />
                      <span>{isChinese ? "再挑戰本關" : "RETRY LEVEL"}</span>
                    </button>
                    <button
                      onClick={handleExitGame}
                      className="w-full py-3 bg-zinc-900 hover:bg-zinc-850 border-4 border-white text-white font-black text-xl rounded-none active:scale-95 transition-all uppercase tracking-wider shadow-[4px_4px_0_#000]"
                    >
                      {isChinese ? "返回主選單" : "MAIN LOBBY"}
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

      </div>

      {/* Modern High-contrast System Bar Footer (Geometric Balance) */}
      <div className="bg-white text-black px-6 py-4 flex flex-col sm:flex-row justify-between items-center text-xs font-black uppercase tracking-widest gap-2">
        <span>DEVICE: BLITZ_TACTICAL_V4</span>
        <span className="text-zinc-600">© 2026 SNAPSHOT BLITZ HIGH CONTRAST</span>
        <span>SECURITY: PROTOCOL ACTIVE</span>
      </div>

    </div>
  );
}
