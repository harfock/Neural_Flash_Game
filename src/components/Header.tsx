import React from 'react';
import { Heart, Trophy, Timer, Flame, CheckCircle, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HeaderProps {
  level: number;
  score: number;
  lives: number;
  maxLives: number;
  timeRemaining: number;
  gameStatus: 'idle' | 'mem' | 'play' | 'win' | 'fail';
  isElderly: boolean;
  onToggleElderly: () => void;
  lang: 'big5' | 'en';
}

export const Header: React.FC<HeaderProps> = ({
  level,
  score,
  lives,
  maxLives,
  timeRemaining,
  gameStatus,
  isElderly,
  onToggleElderly,
  lang,
}) => {
  const isChinese = lang === 'big5';

  return (
    <div className="w-full bg-zinc-900 border-b-8 border-yellow-400 px-6 py-6 sm:px-10 sm:py-8 sticky top-0 z-50 text-white" id="game-stats-header">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        
        {/* Play information & mode toggle */}
        <div className="flex flex-col items-center md:items-start gap-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white uppercase tracking-tighter">
            {isChinese ? "快照閃電戰" : "Snapshot Blitz"}
          </h1>
          <button
            onClick={onToggleElderly}
            className={`px-5 py-2 rounded-none border-4 font-black text-lg flex items-center gap-2 active:scale-95 transition-all outline-none ${
              isElderly 
                ? 'bg-yellow-400 text-black border-white shadow-[0_4px_0_#FFF]' 
                : 'bg-black text-yellow-400 border-yellow-400 hover:bg-neutral-900'
            }`}
          >
            <span>👵👴</span>
            <span>{isChinese ? `長者輔助：${isElderly ? '開啟' : '關閉'}` : `Senior Mode: ${isElderly ? 'ON' : 'OFF'}`}</span>
          </button>
        </div>

        {/* Stats indicators from Geometric Balance (white stats boxes, font-black) */}
        <div className="flex flex-wrap items-center justify-center gap-4 w-full md:w-auto">
          {/* Level Info */}
          <div className="bg-white text-black px-6 py-2.5 text-center border-4 border-yellow-400 min-w-[90px] rounded-none">
            <span className="block text-zinc-600 text-xs font-black uppercase tracking-widest">{isChinese ? "關卡" : "LVL"}</span>
            <span className="text-3xl font-black text-black">{level}</span>
          </div>

          {/* Time Limit Panel */}
          <div className="bg-white text-black px-6 py-2.5 text-center border-4 border-yellow-400 min-w-[110px] rounded-none">
            <span className="block text-zinc-600 text-xs font-black uppercase tracking-widest">{isChinese ? "時間" : "TIME"}</span>
            {isElderly ? (
              <span className="text-3xl font-black text-green-600">∞</span>
            ) : (
              <span className={`text-3xl font-black ${timeRemaining <= 3 ? 'text-red-600 animate-pulse' : 'text-black'}`}>
                {timeRemaining.toFixed(1)}s
              </span>
            )}
          </div>

          {/* Score Counter */}
          <div className="bg-white text-black px-8 py-2.5 text-center border-4 border-yellow-400 min-w-[100px] rounded-none">
            <span className="block text-zinc-600 text-xs font-black uppercase tracking-widest">{isChinese ? "累積得分" : "TOTAL SCORE"}</span>
            <span className="text-3xl font-black text-black">{score}</span>
          </div>
        </div>

        {/* Mistake prevention: Health Remaining block from Geometric Balance spec */}
        <div className="flex flex-col items-center gap-1.5 select-none bg-black border-4 border-white p-3.5 min-w-[160px]">
          <span className="text-zinc-400 text-xs font-bold uppercase tracking-widest">
            {isChinese ? "剩餘嘗試次數" : "ATTEMPTS REMAINING"}
          </span>
          <div className="flex gap-3" id="heart-container">
            {Array.from({ length: maxLives }).map((_, i) => {
              const hasLife = i < lives;
              return (
                <div 
                  key={i}
                  className={`w-9 h-9 border-4 rounded-full transition-colors ${
                    hasLife 
                      ? 'bg-red-600 border-white' 
                      : 'bg-zinc-700 border-zinc-600'
                  }`}
                  title={hasLife ? "Active Life" : "Lost Life"}
                />
              );
            })}
          </div>
        </div>

      </div>

      {/* Progress visual countdown list */}
      {!isElderly && gameStatus === 'play' && (
        <div className="w-full h-3 bg-zinc-800 rounded-none overflow-hidden mt-4 max-w-6xl mx-auto border-2 border-white">
          <motion.div 
            className="h-full bg-yellow-400"
            initial={{ width: "100%" }}
            animate={{ width: `${(timeRemaining / (3.0 + level * 1.5)) * 100}%` }}
            transition={{ duration: 0.1, ease: "linear" }}
          />
        </div>
      )}
    </div>
  );
};
