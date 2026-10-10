import React from 'react';
import { X, Flame, Check } from 'lucide-react';
import { calculateWarmupPyramid, formatWeight } from '../utils/progression';
import { WeightUnit } from '../types/workout';

interface WarmupPyramidModalProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseName: string;
  workingWeight: number;
  warmupSetsCount: number;
  unit: WeightUnit;
}

export const WarmupPyramidModal: React.FC<WarmupPyramidModalProps> = ({
  isOpen,
  onClose,
  exerciseName,
  workingWeight,
  warmupSetsCount,
  unit,
}) => {
  if (!isOpen) return null;

  const pyramid = calculateWarmupPyramid(workingWeight, warmupSetsCount || 2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-6 text-zinc-100">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Warm-Up Pyramid Calculator</h2>
              <p className="text-xs text-zinc-400">{exerciseName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-medium">Target Working Weight:</span>
            <span className="font-mono text-base font-bold text-emerald-400">
              {formatWeight(workingWeight, unit)}
            </span>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed">
            Science-based warmup protocols prime motor unit recruitment without generating metabolic fatigue.
            Rest 30–60 seconds between warm-up sets.
          </p>

          <div className="space-y-2.5">
            {pyramid.map((set) => (
              <div
                key={set.setNumber}
                className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/80 border border-zinc-700/60"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-zinc-700 text-zinc-200 font-mono text-xs font-bold flex items-center justify-center">
                    W{set.setNumber}
                  </span>
                  <div>
                    <div className="font-semibold text-sm text-zinc-100">
                      {formatWeight(set.suggestedWeight, unit)}{' '}
                      <span className="text-xs text-amber-400 font-mono">({set.percentage}%)</span>
                    </div>
                    <div className="text-xs text-zinc-400">{set.suggestedReps}</div>
                  </div>
                </div>
                <div className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  Easy Effort
                </div>
              </div>
            ))}

            {pyramid.length === 0 && (
              <div className="text-center py-6 text-zinc-500 text-sm">
                Enter a working weight greater than 0 to calculate warm-up pyramid sets.
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition"
          >
            <Check className="w-4 h-4" />
            <span>Ready for Working Sets</span>
          </button>
        </div>
      </div>
    </div>
  );
};
