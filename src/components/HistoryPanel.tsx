import React from 'react';
import { ClickRecord, GameHistory } from '../types';
import { History, Star } from 'lucide-react';

interface HistoryPanelProps {
  currentRoundClicks: ClickRecord[];
  pastHistory: GameHistory[];
  lang: 'big5' | 'en';
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  currentRoundClicks,
  pastHistory,
  lang,
}) => {
  const isChinese = lang === 'big5';

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl mx-auto p-2" id="history-panel">
      {/* Current Round Click Actions Progress Log with massive Contrast (Geometric Balance Theme) */}
      <div className="bg-zinc-900 border-l-4 border-yellow-400 p-4 flex flex-col gap-2 text-white">
        <h3 className="text-sm font-black text-white uppercase tracking-tighter border-b-2 border-yellow-400 pb-1.5 flex items-center gap-1.5">
          <History size={16} strokeWidth={3} className="text-yellow-400" />
          <span>{isChinese ? "本次點擊歷程 (即時)" : "ROUND HISTORY (LIVE)"}</span>
        </h3>

        {currentRoundClicks.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-3 bg-zinc-950 border-2 border-dashed border-zinc-700 min-h-[60px]">
            <p className="text-xs font-bold text-zinc-400">
              {isChinese ? "尚未點擊任何氣泡" : "No clicks recorded yet"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 max-h-[140px] overflow-y-auto pr-1">
            {currentRoundClicks.map((click, i) => (
              <div 
                key={i}
                className={`p-2 flex justify-between items-center border border-zinc-700 transition-all ${
                  click.isCorrect 
                    ? 'bg-white text-black' 
                    : 'bg-zinc-800 text-white border-l-4 border-red-500'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border ${
                    click.isCorrect ? 'bg-black text-white border-black' : 'bg-red-600 text-white border-white'
                  }`}>
                    {currentRoundClicks.length - i}
                  </span>
                  <span className="font-black text-sm uppercase tracking-tight">
                    {isChinese ? "氣泡" : "GRID"} {click.label}
                  </span>
                </div>
                <div>
                  {click.isCorrect ? (
                    <span className="bg-green-600 text-white px-1.5 py-0.5 text-[9px] font-black">
                      {isChinese ? "正確" : "CORRECT"}
                    </span>
                  ) : (
                    <span className="bg-red-600 text-white px-1.5 py-0.5 text-[9px] font-black">
                      {isChinese ? "錯誤" : "ERROR"}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cloud-synced Profile Historical Achievements */}
      <div className="bg-zinc-900 border-l-4 border-white p-4 flex flex-col gap-2 text-white">
        <h3 className="text-sm font-black text-white uppercase tracking-tighter border-b-2 border-yellow-400 pb-1.5 flex items-center gap-1.5">
          <Star size={16} className="text-yellow-400 fill-yellow-400" strokeWidth={2} />
          <span>{isChinese ? "歷史記功名冊" : "CHALLENGE RECORDS"}</span>
        </h3>

        {pastHistory.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-3 bg-zinc-950 border-2 border-dashed border-zinc-700 min-h-[60px]">
            <p className="text-xs font-bold text-zinc-400">
              {isChinese ? "尚無歷史記錄" : "No history recorded yet"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 max-h-[140px] overflow-y-auto pr-1">
            {pastHistory.slice(0, 3).map((history) => {
              const formattedDate = new Date(history.timestamp).toLocaleString(
                isChinese ? 'zh-TW' : 'en-US', 
                { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
              );
              return (
                <div 
                  key={history.id}
                  className="bg-zinc-950 border-2 border-zinc-800 p-2 flex justify-between items-center text-white"
                >
                  <div className="flex flex-col items-start gap-0.5">
                    <span className="text-xs font-black uppercase tracking-tight">
                      {isChinese ? `成功通過第 ${history.level} 關` : `PASSED LVL ${history.level}`}
                    </span>
                    <span className="text-[10px] font-bold text-zinc-500">
                      {formattedDate}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    <div className="bg-yellow-400 text-black px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider">
                      {isChinese ? `得分: ${history.score}` : `SCORE: ${history.score}`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
