import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, BookOpen, ChevronRight, X, Sparkles, AlertCircle, Check, HelpCircle } from 'lucide-react';

interface InteractiveDemoProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'big5' | 'en';
  playPulseSound: (frequency: number, type?: 'sine' | 'square' | 'triangle' | 'sawtooth', duration?: number) => void;
}

export const InteractiveDemo: React.FC<InteractiveDemoProps> = ({
  isOpen,
  onClose,
  lang,
  playPulseSound
}) => {
  const [step, setStep] = useState<number>(0);
  const [clickedCellId, setClickedCellId] = useState<number | null>(null);
  const [demoMessage, setDemoMessage] = useState<string>('');
  const [failedAttempts, setFailedAttempts] = useState<number>(0);

  const isChinese = lang === 'big5';

  if (!isOpen) return null;

  // Mock grid 3x3 cells for step-by-step visual training
  const mockCells = Array.from({ length: 9 }).map((_, idx) => ({
    id: idx,
    label: String(idx + 1),
    isTarget: idx === 4, // Center is the target
  }));

  const handleCellClick = (id: number) => {
    if (step !== 2) return; // Only clickable in step 2 (find target)
    
    setClickedCellId(id);
    if (id === 4) {
      playPulseSound(784, 'sine', 0.2); // Success tone
      setDemoMessage(isChinese 
        ? "太棒了！您點中了正確的目標！看到綠色的 ✔ 勾號了吧！請點擊下方的「下一頁」！"
        : "EXCELLENT! You clicked the correct target! Notice the green checkmark ✔. Click 'NEXT' below!"
      );
      setFailedAttempts(0);
    } else {
      playPulseSound(220, 'sawtooth', 0.3); // Wrong tone
      setFailedAttempts(prev => prev + 1);
      setDemoMessage(isChinese 
        ? `點錯囉！沒關係，這會顯示紅色的 ✖ 叉號。生命安全機制能保護您！再試試看點擊中間那個格子！`
        : `Ouch, that's wrong! No worries, it displays a red ✖ cross. Attempt safety protects you! Try clicking the center cell!`
      );
    }
  };

  const nextStep = () => {
    playPulseSound(440, 'triangle', 0.1);
    setClickedCellId(null);
    setDemoMessage('');
    setFailedAttempts(0);
    setStep(prev => prev + 1);
  };

  const prevStep = () => {
    playPulseSound(349.23, 'triangle', 0.1);
    setClickedCellId(null);
    setDemoMessage('');
    setFailedAttempts(0);
    setStep(prev => Math.max(0, prev - 1));
  };

  const resetDemo = () => {
    setStep(0);
    setClickedCellId(null);
    setDemoMessage('');
    setFailedAttempts(0);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-zinc-900 border-8 border-yellow-400 w-full max-w-2xl p-6 sm:p-8 rounded-none shadow-[10px_10px_0_#FFF] flex flex-col gap-6 text-white text-left relative"
        >
          {/* Close Header */}
          <button 
            onClick={() => {
              playPulseSound(293.66, 'sine', 0.1);
              onClose();
            }}
            className="absolute top-4 right-4 p-2 bg-yellow-400 hover:bg-yellow-500 text-black border-4 border-black rounded-none active:scale-90 transition-all font-black"
            title="Close Demo"
          >
            <X size={24} />
          </button>

          {/* Heading */}
          <div className="border-b-4 border-zinc-800 pb-4">
            <span className="text-sm font-black text-yellow-400 uppercase tracking-widest block mb-1">
              {isChinese ? "【快照閃電戰】新型互動新手示範" : "SNAPSHOT BLITZ INTERACTIVE DEMO"}
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tighter flex items-center gap-2">
              <Sparkles className="text-yellow-400 fill-yellow-400" size={32} />
              <span>{isChinese ? "輕鬆學會如何遊玩" : "HOW TO PLAY DEMO"}</span>
            </h2>
          </div>

          {/* Step Progression Bar */}
          <div className="w-full bg-zinc-850 h-6 border-4 border-black flex overflow-hidden">
            <div 
              className="bg-yellow-400 h-full transition-all duration-300"
              style={{ width: `${((step + 1) / 4) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-xs font-black text-zinc-400 uppercase tracking-widest -mt-3">
            <span>{isChinese ? `進度：${step + 1} / 4 階段` : `STEP ${step + 1} OF 4`}</span>
            <span>{step === 3 ? "COMPLETED" : "IN PROGRESS"}</span>
          </div>

          {/* Demo Body Content */}
          <div className="min-h-[280px] flex flex-col justify-between gap-6 py-2">
            
            {/* Step 0: Welcome Introduction */}
            {step === 0 && (
              <div className="space-y-4">
                <p className="text-xl font-bold text-yellow-400 leading-relaxed">
                  {isChinese 
                    ? "「快照閃電戰」是一款專門幫助強化視覺注意力和空間記憶的趣味挑戰！" 
                    : "Snapshot Blitz is an ultra-high contrast game designed to exercise your visual memory!"
                  }
                </p>
                <div className="space-y-3 bg-zinc-950 p-4 border-l-4 border-white">
                  <p className="text-base font-medium text-zinc-300">
                    {isChinese
                      ? "● 在每一關開始時，畫面中會有隨機幾個氣泡亮起明黃色，持續幾秒鐘。"
                      : "● At the start of a level, several bubbles will glow bright golden-yellow for a few seconds."}
                  </p>
                  <p className="text-base font-medium text-zinc-300">
                    {isChinese
                      ? "● 您需要利用視覺「快照」牢牢記住它們的位置。"
                      : "● Capture a visual 'snapshot' to memorize where they stand."}
                  </p>
                  <p className="text-base font-medium text-zinc-300">
                    {isChinese
                      ? "● 其餘氣泡會隱藏，接著需要您把它們一個個點選找出來！"
                      : "● Then, uncover them step-by-step from memory while ignoring wrong traps."}
                  </p>
                </div>
                <p className="text-base text-zinc-400 italic">
                  {isChinese 
                    ? "下面讓我們用 3 個極簡動作，跟著指示親手模擬試試看吧！" 
                    : "Let's perform 3 easy physical clicks to simulate it real-time. Tap NEXT below."
                  }
                </p>
              </div>
            )}

            {/* Step 1: Memorization Flash Simulator */}
            {step === 1 && (
              <div className="grid sm:grid-cols-2 gap-6 items-center">
                <div className="space-y-3 text-left">
                  <span className="p-1 px-2.5 bg-yellow-400 text-black text-xs font-black uppercase">
                    {isChinese ? "記憶階段練習" : "STAGE 1: FLASH FLASH"}
                  </span>
                  <h4 className="text-2xl font-black text-white">
                    {isChinese ? "1. 記住發光目标！" : "1. Watch the golden beacon!"}
                  </h4>
                  <p className="text-base font-semibold text-zinc-300 leading-relaxed">
                    {isChinese
                      ? "規則在於：記住亮黃色的氣泡位置。在此模擬中，【正中間那格】是我們唯一的黃色目標格！"
                      : "Your task starts here. Memorize the glowing yellow targets. In this preview, the [center-center block] is our yellow target!"}
                  </p>
                  <p className="text-sm text-zinc-400 italic">
                    {isChinese 
                      ? "看清楚它是中間那格，把它牢牢刻在您腦中！準備好就點擊「下一步」體驗配對階段。"
                      : "Memorize the center spot! Click \"NEXT\" once your mental snapshot is ready."
                    }
                  </p>
                </div>

                {/* 3x3 Mock Grid showing target flash */}
                <div className="flex justify-center">
                  <div className="grid grid-cols-3 gap-3 w-48 aspect-square bg-zinc-950 border-4 border-white p-3 shadow-md">
                    {mockCells.map((cell) => (
                      <div
                        key={cell.id}
                        className={`font-black flex items-center justify-center rounded-lg transition-all ${
                          cell.isTarget
                            ? 'bg-yellow-400 text-black border-4 border-white ring-4 ring-yellow-400 scale-105 animate-pulse'
                            : 'bg-zinc-900 border-2 border-zinc-800 text-zinc-700 opacity-20'
                        }`}
                      >
                        <svg viewBox="0 0 100 100" className="w-[70%] h-[70%] flex items-center justify-center pointer-events-none">
                          <text 
                            x="50" 
                            y="50" 
                            dominantBaseline="central" 
                            textAnchor="middle" 
                            className="font-black select-none"
                            fill="currentColor"
                            fontSize="75"
                            style={{ fontFamily: 'inherit' }}
                          >
                            {cell.label}
                          </text>
                        </svg>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Interactive Try clicking */}
            {step === 2 && (
              <div className="grid sm:grid-cols-2 gap-6 items-center">
                <div className="space-y-3 text-left">
                  <span className="p-1 px-2.5 bg-green-500 text-black text-xs font-black uppercase">
                    {isChinese ? "點擊互動練習" : "STAGE 2: INTERACTIVE CLICKS"}
                  </span>
                  <h4 className="text-2xl font-black text-white">
                    {isChinese ? "2. 憑記憶點擊它！" : "2. Click based on memory!"}
                  </h4>
                  <p className="text-base font-semibold text-zinc-300 leading-relaxed">
                    {isChinese
                      ? "現在，黃色已經退去。請親自點擊剛才記住的【正中間那格】氣泡試試看！"
                      : "Alright! The highlighting has vanished. Go ahead and click the center cell you memorized!"}
                  </p>
                  
                  {demoMessage ? (
                    <div className={`p-3 border-4 font-black text-base text-center ${
                      clickedCellId === 4 ? 'bg-green-950 text-green-300 border-green-500' : 'bg-red-950 text-red-300 border-red-500'
                    }`}>
                      {demoMessage}
                    </div>
                  ) : (
                    <p className="text-sm font-black text-yellow-400 animate-pulse">
                      {isChinese ? "👉 請動手點選右側網格中的中間格子吧！" : "👉 Grab your mouse or finger and tap the center cell!"}
                    </p>
                  )}
                </div>

                {/* 3x3 Interactive Play Grid */}
                <div className="flex justify-center">
                  <div className="grid grid-cols-3 gap-3 w-48 aspect-square bg-zinc-950 border-4 border-white p-3 shadow-md">
                    {mockCells.map((cell) => {
                      let btnStyle = "bg-zinc-900 hover:bg-zinc-800 text-white border-4 border-zinc-800";
                      let symbol = cell.label;

                      if (clickedCellId !== null) {
                        if (cell.id === clickedCellId) {
                          if (cell.isTarget) {
                            btnStyle = "bg-green-500 text-black border-4 border-black font-black scale-95";
                            symbol = "✔";
                          } else {
                            btnStyle = "bg-red-600 text-white border-4 border-white font-black scale-95";
                            symbol = "✖";
                          }
                        }
                      }

                      return (
                        <button
                          key={cell.id}
                          onClick={() => handleCellClick(cell.id)}
                          className={`font-black aspect-square flex items-center justify-center rounded-lg transition-all ${btnStyle}`}
                        >
                          <svg viewBox="0 0 100 100" className="w-[70%] h-[70%] flex items-center justify-center pointer-events-none">
                            <text 
                              x="50" 
                              y="50" 
                              dominantBaseline="central" 
                              textAnchor="middle" 
                              className="font-black select-none"
                              fill="currentColor"
                              fontSize={symbol === '✔' || symbol === '✖' ? "65" : "75"}
                              style={{ fontFamily: 'inherit' }}
                            >
                              {symbol}
                            </text>
                          </svg>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Game Victory explanation and safety */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="flex flex-col items-center text-center p-4 bg-zinc-950 border-l-8 border-green-500">
                  <span className="text-4xl mb-2">🎉</span>
                  <h4 className="text-2xl font-black text-green-400 uppercase tracking-tighter">
                    {isChinese ? "太強了！示範大成功！" : "DEMO CONGRATULATIONS!"}
                  </h4>
                  <p className="text-base text-zinc-300 font-bold max-w-lg mt-1">
                    {isChinese
                      ? "您已經掌握了「快照閃電戰」的全部核心玩法：【先記位置，再點配對】！"
                      : "You've successfully mastered the core concept: [Flash memorization, Click matching]!"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm font-bold m-2">
                  <div className="bg-zinc-850 p-4 border-2 border-zinc-700">
                    <h5 className="text-yellow-400 font-black text-base uppercase mb-1">
                      {isChinese ? "❤️ 三段容錯保護" : "❤️ 3 Lives System"}
                    </h5>
                    <p className="text-xs text-zinc-300">
                      {isChinese 
                        ? "每關享有3次嘗試生命！就算長輩因顫抖、恍神點錯了也不要緊，可以安心發揮。" 
                        : "You get 3 tries before a gameover! Shake and misclicks are protected built-in!"}
                    </p>
                  </div>
                  <div className="bg-zinc-850 p-4 border-2 border-zinc-700">
                    <h5 className="text-yellow-400 font-black text-base uppercase mb-1">
                      {isChinese ? "💡 長者友善開關" : "💡 Senior Mode Focus"}
                    </h5>
                    <p className="text-xs text-zinc-300">
                      {isChinese 
                        ? "在最上方可以切換「長者友善」，自動解鎖無限倒數時間、更低的對比雜音與更粗大提示字體！" 
                        : "Toggle 'ELDERLY MODE' on top to disable game timer limits and maximize typography!"}
                    </p>
                  </div>
                </div>

                <p className="text-sm text-zinc-400 text-center italic">
                  {isChinese 
                    ? "恭喜！您現在可以關閉示範、點選「挑戰」按鈕來進行真正的世界挑戰排行榜了！" 
                    : "Glorious job! Press 'CLOSE DEMO' below and start real levels!"}
                </p>
              </div>
            )}

            {/* Interactive Control Buttons at footer */}
            <div className="flex justify-between items-center border-t-4 border-zinc-800 pt-5 mt-3">
              {step > 0 ? (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-black text-base border-4 border-white rounded-none active:scale-95 transition-all uppercase shadow-[3px_3px_0_#005]"
                >
                  {isChinese ? "⬅ 上一步" : "⬅ BACK"}
                </button>
              ) : (
                <div />
              )}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={step === 2 && clickedCellId !== 4} // Block advancing on step 2 unless clicked correct
                  className={`px-8 py-3 font-black text-lg border-4 border-black rounded-none active:scale-95 transition-all uppercase flex items-center gap-1 shadow-[4px_4px_0_#FFF] ${
                    step === 2 && clickedCellId !== 4
                      ? 'bg-zinc-700 text-zinc-500 border-zinc-600 cursor-not-allowed opacity-50'
                      : 'bg-yellow-400 hover:bg-yellow-500 text-black'
                  }`}
                >
                  <span>{isChinese ? "繼續下一步 ➡" : "NEXT ➡"}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    playPulseSound(987.77, 'sine', 0.25);
                    onClose();
                  }}
                  className="px-8 py-3 bg-green-500 hover:bg-green-600 text-black font-black text-lg border-4 border-black rounded-none active:scale-95 transition-all uppercase shadow-[4px_4px_0_#FFF]"
                >
                  {isChinese ? "學會了！關閉示範" : "TRY GAME NOW!"}
                </button>
              )}
            </div>

          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
