import React from 'react';
import { ClickRecord, GameHistory } from '../types';
import { History, CheckCircle2, XCircle, Clock, Star, TrendingUp } from 'lucide-react';

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
    <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto p-4" id="history-panel">
      {/* Current Round Click Actions Progress Log with massive Contrast (Geometric Balance Theme) */}
      <div className="bg-zinc-900 border-l-8 border-yellow-400 p-6 flex flex-col gap-4 text-white">
        <h3 className="text-2xl font-black text-white uppercase tracking-tighter border-b-4 border-yellow-400 pb-2 flex items-center gap-2">
          <History size={24} strokeWidth={3} className="text-yellow-400" />
          <span>{isChinese ? "本次點擊歷程 (即時)" : "ROUND HISTORY (LIVE)"}</span>
        </h3>

        {currentRoundClicks.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-zinc-950 border-4 border-dashed border-zinc-700">
            <p className="text-lg font-bold text-zinc-400">
              {isChinese ? "尚未點擊任何氣泡" : "No clicks recorded yet"}
            </p>
            <p className="text-xs text-zinc-600 mt-1">
              {isChinese ? "請在點擊階段選取您的目標" : "Your selections will show up here"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 max-h-[220px] overflow-y-auto pr-1">
            {currentRoundClicks.map((click, i) => (
              <div 
                key={i}
                className={`p-4 flex justify-between items-center border border-zinc-700 transition-all ${
                  click.isCorrect 
                    ? 'bg-white text-black' 
                    : 'bg-zinc-800 text-white border-l-8 border-red-500'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black border-2 ${
                    click.isCorrect ? 'bg-black text-white border-black' : 'bg-red-600 text-white border-white'
                  }`}>
                    {currentRoundClicks.length - i}
                  </span>
                  <span className="font-black text-xl uppercase tracking-tight">
                    {isChinese ? "氣泡" : "GRID"} {click.label}
                  </span>
                </div>
                <div>
                  {click.isCorrect ? (
                    <span className="bg-green-600 text-white px-2.5 py-1 text-xs font-black shadow-[2px_2px_0_#000]">
                      {isChinese ? "正確" : "CORRECT"}
                    </span>
                  ) : (
                    <span className="bg-red-600 text-white px-2.5 py-1 text-xs font-black shadow-[2px_2px_0_#FFF]">
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
      <div className="bg-zinc-900 border-l-8 border-white p-6 flex flex-col gap-4 text-white">
        <h3 className="text-2xl font-black text-white uppercase tracking-tighter border-b-4 border-yellow-400 pb-2 flex items-center gap-2">
          <Star size={24} className="text-yellow-400 fill-yellow-400" strokeWidth={2} />
          <span>{isChinese ? "雲端挑戰歷史記錄" : "CLOUD RUN HISTORY"}</span>
        </h3>

        {pastHistory.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-zinc-950 border-4 border-dashed border-zinc-700">
            <TrendingUp size={32} className="text-zinc-600 mb-2" />
            <p className="text-lg font-bold text-zinc-400">
              {isChinese ? "尚無歷史記錄" : "No history has been recorded yet"}
            </p>
            <p className="text-xs text-zinc-650 mt-1">
              {isChinese ? "通關後將自動儲存成績至雲端" : "Completing levels will automatically sync here"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 max-h-[220px] overflow-y-auto pr-1">
            {pastHistory.slice(0, 5).map((history) => {
              const formattedDate = new Date(history.timestamp).toLocaleString(
                isChinese ? 'zh-TW' : 'en-US', 
                { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
              );
              return (
                <div 
                  key={history.id}
                  className="bg-zinc-950 border-4 border-zinc-800 p-4 flex justify-between items-center text-white"
                >
                  <div className="flex flex-col items-start gap-1">
                    <span className="text-lg font-black uppercase tracking-tight">
                      {isChinese ? `成功通過 第 ${history.level} 關` : `PASSED LVEEL ${history.level}`}
                    </span>
                    <span className="text-xs font-bold text-zinc-500 flex items-center gap-1">
                      <Clock size={12} />
                      <span>{formattedDate}</span>
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="bg-yellow-400 text-black px-3 py-1.5 text-xs font-black uppercase tracking-wider">
                      {isChinese ? `得分: ${history.score}` : `SCORE: ${history.score}`}
                    </div>
                    {history.livesRemaining > 0 && (
                      <div className="bg-red-600 text-white px-2 py-1.5 text-xs font-black uppercase tracking-wider border-2 border-white">
                        ❤️ {history.livesRemaining}
                      </div>
                    )}
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
