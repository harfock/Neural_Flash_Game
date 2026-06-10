import React from 'react';
import { motion } from 'motion/react';
import { Layers, CheckCircle2 } from 'lucide-react';

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
      items: ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
      highlightIdx: [2, 4], // Sparkles simulation
      accentColor: 'border-yellow-400 bg-yellow-400 text-black',
    },
    {
      id: 'letters' as const,
      em: '🔤',
      titleZh: '英文字母模式',
      titleEn: 'LETTERS MODE',
      descZh: '字母拼讀空間排序，強化語言認知交互作用。',
      descEn: 'Alphabetical placement, great for language and spatial grasp.',
      items: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'],
      highlightIdx: [0, 6],
      accentColor: 'border-green-400 bg-green-400 text-black',
    },
    {
      id: 'emojis' as const,
      em: '🍇',
      titleZh: '水果認知模式',
      titleEn: 'EMOJIS MODE',
      descZh: '高色彩鮮豔圖形關聯，最親民無壓力記憶挑戰。',
      descEn: 'Vibrant fruit associations, friendly and visually stimulating.',
      items: ['🍎', '🍒', '🍋', '🍇', '🍉', '🍍', '🥝', '🥑', '🍌'],
      highlightIdx: [3, 7],
      accentColor: 'border-cyan-400 bg-cyan-400 text-black',
    }
  ];

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {modes.map((mode) => {
          const isSelected = currentMode === mode.id;
          
          return (
            <motion.div
              key={mode.id}
              onClick={() => {
                if (isInteractable && onSelectMode) {
                  onSelectMode(mode.id);
                }
              }}
              whileHover={{ scale: isInteractable ? 1.02 : 1 }}
              whileTap={{ scale: isInteractable ? 0.98 : 1 }}
              className={`border-4 text-left p-4 rounded-none transition-all flex flex-col justify-between ${
                isInteractable ? 'cursor-pointer' : ''
              } ${
                isSelected 
                  ? 'bg-zinc-900 border-yellow-400 shadow-[4px_4px_0_#FFF]' 
                  : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              {/* Highlight selector if select mode */}
              <div className="flex justify-between items-center mb-3">
                <span className="text-3xl">{mode.em}</span>
                {isInteractable && isSelected && (
                  <span className="bg-yellow-400 text-black px-2 py-0.5 text-xs font-black uppercase flex items-center gap-1 border border-black">
                    <CheckCircle2 size={12} strokeWidth={3} />
                    <span>{isChinese ? '已選定' : 'SELECTED'}</span>
                  </span>
                )}
                {!isInteractable && (
                  <span className="text-zinc-500 text-xs font-black">
                    MODE
                  </span>
                )}
              </div>

              {/* Title descriptions */}
              <h4 className="text-lg font-black text-white uppercase tracking-tight">
                {isChinese ? mode.titleZh : mode.titleEn}
              </h4>
              <p className="text-xs text-zinc-400 font-medium my-2 line-clamp-2 leading-relaxed">
                {isChinese ? mode.descZh : mode.descEn}
              </p>

              {/* Mini CSS Grid Preview inside thumbnail */}
              <div className="w-full bg-black p-2 border-2 border-zinc-900 mt-2 block">
                <div className="grid grid-cols-3 gap-1.5 aspect-video w-full justify-center">
                  {mode.items.map((item, idx) => {
                    const isMockTarget = mode.highlightIdx.includes(idx);
                    return (
                      <div
                        key={idx}
                        className={`font-black flex items-center justify-center p-1 rounded transition-all ${
                          isMockTarget
                            ? 'bg-yellow-400 text-black border-2 border-white font-extrabold animate-pulse'
                            : 'bg-zinc-900 text-zinc-600 border border-zinc-800 opacity-60'
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
                            {item}
                          </text>
                        </svg>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
