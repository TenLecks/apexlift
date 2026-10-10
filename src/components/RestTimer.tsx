import React, { useState, useEffect } from 'react';
import { Timer, Play, Pause, RotateCcw, X, Plus, Minus } from 'lucide-react';
import { sounds } from '../utils/audio';

interface RestTimerProps {
  initialSeconds: number;
  isActive: boolean;
  onClose: () => void;
  exerciseName?: string;
}

export const RestTimer: React.FC<RestTimerProps> = ({
  initialSeconds,
  isActive,
  onClose,
  exerciseName,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(isActive);

  useEffect(() => {
    setSecondsLeft(initialSeconds);
    setIsRunning(true);
  }, [initialSeconds]);

  useEffect(() => {
    let interval: any = null;
    if (isRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 4 && prev > 1) {
            sounds.playTick();
          }
          if (prev === 1) {
            sounds.playTimerComplete();
            setIsRunning(false);
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, secondsLeft]);

  if (!isActive) return null;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  const pct = Math.max(0, Math.min(100, ((initialSeconds - secondsLeft) / (initialSeconds || 1)) * 100));

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-sm w-full bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl p-4 text-zinc-100 backdrop-blur-md">
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
        <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
          <Timer className="w-4 h-4 animate-spin text-emerald-400" />
          <span>Rest Interval {exerciseName ? `• ${exerciseName}` : ''}</span>
        </div>
        <button
          onClick={onClose}
          className="text-zinc-500 hover:text-zinc-300 p-1 rounded-md transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="py-3 flex items-center justify-between">
        <div>
          <div className="text-3xl font-black font-mono tracking-tight text-white">
            {formattedTime}
          </div>
          <div className="text-[11px] text-zinc-400 mt-0.5">
            {secondsLeft === 0 ? 'Rest complete! Crush your next set.' : 'Recover ATP & nervous system'}
          </div>
        </div>

        {/* Quick adjustments */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSecondsLeft((s) => Math.max(0, s - 30))}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
            title="-30s"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold transition shadow-sm"
          >
            {isRunning ? <Pause className="w-4 h-4 fill-zinc-950" /> : <Play className="w-4 h-4 fill-zinc-950" />}
          </button>
          <button
            onClick={() => setSecondsLeft((s) => s + 30)}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
            title="+30s"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              setSecondsLeft(initialSeconds);
              setIsRunning(true);
            }}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition"
            title="Reset timer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-1000 ease-linear"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};
