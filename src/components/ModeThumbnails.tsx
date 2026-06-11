import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';

interface ModeThumbnailsProps {
  currentMode: 'numbers' | 'letters' | 'emojis';
  onSelectMode?: (mode: 'numbers' | 'letters' | 'emojis') => void;
  isInteractable?: boolean;
  lang: 'big5' | 'en';
}

export const ModeThumbnails: React.FC<ModeThumbnailsProps> = ({
  currentMode,
  onSelectMode,
  isInteractable = false,
  lang
}) => {
  const isChinese = lang === 'big5';

  const modes = [
    {
      id: 'numbers' as const,
      em: '🔢',
      titleZh: '數字序列模式',
      titleEn: 'NUMBERS MODE',
      descZh: '經典序列記憶，適合常規大腦邏輯儲備鍛鍊。',
      descEn: 'Classic sequential recall, perfect for general numerical training.',
    },
    {
      id: 'letters' as const,
      em: '🔤',
      titleZh: '英文字母模式',
      titleEn: 'LETTERS MODE',
      descZh: '字母拼讀空間排序，強化語言認知交互作用。',
      descEn: 'Alphabetical placement, great for language and spatial grasp.',
    },
    {
      id: 'emojis' as const,
      em: '🍇',
      titleZh: '水果認知模式',
      titleEn: 'EMOJIS MODE',
      descZh: '高色彩鮮豔圖形關聯，最親民無壓力記憶挑戰。',
      descEn: 'Vibrant fruit associations, friendly and visually stimulating.',
    }
  ];

  const currentIndex = modes.findIndex((m) => m.id === currentMode);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isInteractable || !onSelectMode) return;
    const prevIndex = (currentIndex - 1 + modes.length) % modes.length;
    onSelectMode(modes[prevIndex].id);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isInteractable || !onSelectMode) return;
    const nextIndex = (currentIndex + 1) % modes.length;
    onSelectMode(modes[nextIndex].id);
  };

  const activeMode = modes[currentIndex];

  return (
    <div className="w-full flex flex-col items-center gap-1.5" id="mode-flipper-container">
      <div className="flex items-center justify-between w-full gap-2 bg-black border-4 border-zinc-800 p-1.5 sm:p-2 rounded-none">
        
        {/* Left Arrow */}
        <button
          onClick={handlePrev}
          disabled={!isInteractable}
          className={`p-2 bg-zinc-900 border-2 border-white text-white rounded-none flex items-center justify-center transition-all ${
            isInteractable 
              ? 'hover:bg-yellow-400 hover:text-black cursor-pointer active:scale-95' 
              : 'opacity-50 cursor-not-allowed'
          }`}
          title="Previous Mode"
        >
          <ChevronLeft size={24} strokeWidth={3} />
        </button>

        {/* Centered Active Mode Display with subtle flip motion */}
        <div className="flex-grow overflow-hidden relative min-h-[70px] flex items-center justify-center px-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeMode.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.15 }}
              className="w-full flex items-center gap-3 sm:gap-4 justify-start text-left"
            >
              <div className="text-4xl sm:text-5xl shrink-0 select-none bg-zinc-900 border-2 border-zinc-700 p-1.5 flex items-center justify-center">
                {activeMode.em}
              </div>
              <div className="flex-grow">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm sm:text-base font-black text-yellow-450 uppercase tracking-tight">
                    {isChinese ? activeMode.titleZh : activeMode.titleEn}
                  </h4>
                  {isInteractable && (
                    <span className="bg-green-500 text-black px-1.5 py-0.5 text-[10px] font-black uppercase flex items-center gap-1">
                      <CheckCircle2 size={10} strokeWidth={3.5} />
                      <span>{isChinese ? '已啟用' : 'ACTIVE'}</span>
                    </span>
                  )}
                </div>
                <p className="text-[11px] sm:text-xs text-zinc-350 font-medium leading-tight mt-0.5 line-clamp-1">
                  {isChinese ? activeMode.descZh : activeMode.descEn}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right Arrow */}
        <button
          onClick={handleNext}
          disabled={!isInteractable}
          className={`p-2 bg-zinc-900 border-2 border-white text-white rounded-none flex items-center justify-center transition-all ${
            isInteractable 
              ? 'hover:bg-yellow-400 hover:text-black cursor-pointer active:scale-95' 
              : 'opacity-50 cursor-not-allowed'
          }`}
          title="Next Mode"
        >
          <ChevronRight size={24} strokeWidth={3} />
        </button>

      </div>

      {/* Dotted Page Indicators */}
      <div className="flex gap-1.5 items-center justify-center">
        {modes.map((m, idx) => (
          <button
            key={m.id}
            onClick={() => isInteractable && onSelectMode && onSelectMode(m.id)}
            className={`w-2.5 h-2.5 transition-all rounded-full ${
              currentIndex === idx 
                ? 'bg-yellow-400 scale-110 border border-white' 
                : 'bg-zinc-700 hover:bg-zinc-650'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
