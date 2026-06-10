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
    <div className="w-full bg-zinc-900 border-b-4 border-yellow-400 px-4 py-3 sm:px-6 sm:py-4 sticky top-0 z-50 text-white" id="game-stats-header">
      <div className="max-w-6xl mx-auto flex flex-row flex-wrap items-center justify-between gap-4">
        
        {/* Play information & mode toggle */}
        <div className="flex items-center gap-3">
          <h1 className="hidden md:block text-xl sm:text-2xl font-black text-white uppercase tracking-tighter leading-none">
            {isChinese ? "快照閃電戰" : "Snapshot Blitz"}
          </h1>
          <button
            onClick={onToggleElderly}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-none border-2 sm:border-4 font-black text-xs sm:text-sm flex items-center gap-1.5 active:scale-95 transition-all outline-none ${
              isElderly 
                ? 'bg-yellow-400 text-black border-white shadow-[0_2px_0_#FFF] sm:shadow-[0_3px_0_#FFF]' 
                : 'bg-black text-yellow-400 border-yellow-400 hover:bg-neutral-900'
            }`}
          >
            <span>👵👴</span>
            <span>{isChinese ? `長者輔助：${isElderly ? '開啟' : '關閉'}` : `Senior: ${isElderly ? 'ON' : 'OFF'}`}</span>
          </button>
        </div>

        {/* Stats indicators (white stats boxes, font-black) */}
        <div className="flex items-center justify-center gap-2 sm:gap-3">
          {/* Level Info */}
          <div className="bg-white text-black px-2 py-1 sm:px-4 sm:py-1.5 text-center border-2 sm:border-4 border-yellow-400 min-w-[65px] sm:min-w-[85px] rounded-none">
            <span className="block text-zinc-600 text-[9px] sm:text-[10px] font-black uppercase tracking-wider leading-none mb-0.5">{isChinese ? "關卡" : "LVL"}</span>
            <span className="text-base sm:text-xl font-black text-black leading-none">{level}</span>
          </div>

          {/* Time Limit Panel */}
          <div className="bg-white text-black px-2 py-1 sm:px-4 sm:py-1.5 text-center border-2 sm:border-4 border-yellow-400 min-w-[75px] sm:min-w-[95px] rounded-none">
            <span className="block text-zinc-600 text-[9px] sm:text-[10px] font-black uppercase tracking-wider leading-none mb-0.5">{isChinese ? "時間" : "TIME"}</span>
            {isElderly ? (
              <span className="text-base sm:text-xl font-black text-green-600 leading-none">∞</span>
            ) : (
              <span className={`text-base sm:text-xl font-black leading-none ${timeRemaining <= 3 ? 'text-red-600 animate-pulse' : 'text-black'}`}>
                {timeRemaining.toFixed(1)}s
              </span>
            )}
          </div>

          {/* Score Counter */}
          <div className="bg-white text-black px-2.5 py-1 sm:px-5 sm:py-1.5 text-center border-2 sm:border-4 border-yellow-400 min-w-[75px] sm:min-w-[95px] rounded-none">
            <span className="block text-zinc-600 text-[9px] sm:text-[10px] font-black uppercase tracking-wider leading-none mb-0.5">{isChinese ? "得分" : "SCORE"}</span>
            <span className="text-base sm:text-xl font-black text-black leading-none">{score}</span>
          </div>
        </div>

        {/* Mistake prevention: Health Remaining block from Geometric Balance spec */}
        <div className="flex items-center gap-2 sm:gap-3 select-none bg-black border-2 sm:border-4 border-white px-2.5 py-1 sm:px-4 sm:py-2">
          <span className="text-zinc-400 text-[9px] sm:text-[11px] font-bold uppercase tracking-wider">
            {isChinese ? "剩餘嘗試" : "LIVES"}
          </span>
          <div className="flex gap-1.5 sm:gap-2.5" id="heart-container">
            {Array.from({ length: maxLives }).map((_, i) => {
              const hasLife = i < lives;
              return (
                <div 
                  key={i}
                  className={`w-5 h-5 sm:w-7 sm:h-7 border-2 sm:border-3 rounded-full transition-colors ${
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
        <div className="w-full h-2 bg-zinc-800 rounded-none overflow-hidden mt-2 max-w-6xl mx-auto border-2 border-white">
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
