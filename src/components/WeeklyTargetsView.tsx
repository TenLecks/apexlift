import React, { useState } from 'react';
import {
  UserFitnessProfile,
  WeeklyExerciseTarget,
  WeightUnit,
} from '../types/workout';
import { PROGRAM_WEEKS } from '../data/programData';
import { generateSmartTarget, formatWeight } from '../utils/progression';
import {
  Sliders,
  Sparkles,
  Save,
  RotateCcw,
  CheckCircle2,
  Dumbbell,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';

interface WeeklyTargetsViewProps {
  profile: UserFitnessProfile;
  selectedWeek: number;
  onSaveTargets: (targets: Record<string, WeeklyExerciseTarget>) => void;
}

export const WeeklyTargetsView: React.FC<WeeklyTargetsViewProps> = ({
  profile,
  selectedWeek,
  onSaveTargets,
}) => {
  const currentWeekPlan =
    PROGRAM_WEEKS.find((w) => w.weekNumber === selectedWeek) || PROGRAM_WEEKS[0];

  const allExercises = [
    ...currentWeekPlan.workouts.dayA.exercises,
    ...currentWeekPlan.workouts.dayB.exercises,
  ];

  // Local state for targets
  const [localTargets, setLocalTargets] = useState<Record<string, WeeklyExerciseTarget>>(() => {
    const map: Record<string, WeeklyExerciseTarget> = {};
    allExercises.forEach((ex) => {
      const key = `${selectedWeek}_${ex.id}`;
      if (profile.weeklyTargets[key]) {
        map[ex.id] = { ...profile.weeklyTargets[key] };
      } else {
        const smart = generateSmartTarget(
          ex,
          selectedWeek,
          profile.completedWorkouts,
          profile.weightUnit
        );
        map[ex.id] = {
          exerciseId: ex.id,
          weekNumber: selectedWeek,
          targetWeight: smart.suggestedWeight,
          targetRepsMin: smart.suggestedRepsMin,
          targetRepsMax: smart.suggestedRepsMax,
          targetRpe: smart.targetRpe,
          isCustomOverride: false,
        };
      }
    });
    return map;
  });

  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleUpdate = (exerciseId: string, updates: Partial<WeeklyExerciseTarget>) => {
    setLocalTargets((prev) => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        ...updates,
        isCustomOverride: true,
      },
    }));
    setSavedSuccess(false);
  };

  const handleAutoCalculateAll = () => {
    const updated: Record<string, WeeklyExerciseTarget> = {};
    allExercises.forEach((ex) => {
      const smart = generateSmartTarget(
        ex,
        selectedWeek,
        profile.completedWorkouts,
        profile.weightUnit
      );
      updated[ex.id] = {
        exerciseId: ex.id,
        weekNumber: selectedWeek,
        targetWeight: smart.suggestedWeight,
        targetRepsMin: smart.suggestedRepsMin,
        targetRepsMax: smart.suggestedRepsMax,
        targetRpe: smart.targetRpe,
        isCustomOverride: false,
      };
    });
    setLocalTargets(updated);
    setSavedSuccess(false);
  };

  const handleSaveAll = () => {
    const fullMap: Record<string, WeeklyExerciseTarget> = { ...profile.weeklyTargets };
    Object.values(localTargets).forEach((t) => {
      const key = `${selectedWeek}_${t.exerciseId}`;
      fullMap[key] = t;
    });
    onSaveTargets(fullMap);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
              Week {selectedWeek} Target Customizer
            </span>
            <span className="text-xs text-zinc-400">Unit: {profile.weightUnit.toUpperCase()}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1.5 flex items-center gap-3">
            <span>Weekly Weight & Intensity Targets</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl leading-relaxed">
            Customize target loads and rep targets for each lift or use the automatic{' '}
            <strong className="text-emerald-400">"Beat the Logbook"</strong> progression engine
            derived from your previous week's logged performance.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2.5 self-start md:self-center">
          <button
            onClick={handleAutoCalculateAll}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition"
            title="Auto-calculate progression from last week's logged sets"
          >
            <Sparkles className="w-4 h-4" />
            <span>Auto Beat Logbook</span>
          </button>
          <button
            onClick={handleSaveAll}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 text-xs font-bold shadow-md transition active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Save Targets</span>
          </button>
        </div>
      </div>

      {/* Success banner */}
      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Targets successfully saved for Week {selectedWeek}! They will appear as your goals in the Workout Logger.</span>
        </div>
      )}

      {/* Day A Targets Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-md space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-emerald-400" />
            <span>Full Body A Targets</span>
          </h2>
          <span className="text-xs text-zinc-400">Day 1 Focus</span>
        </div>

        <div className="space-y-3">
          {currentWeekPlan.workouts.dayA.exercises.map((ex) => {
            const target = localTargets[ex.id] || {
              exerciseId: ex.id,
              weekNumber: selectedWeek,
              targetWeight: 0,
              targetRepsMin: ex.minReps,
              targetRepsMax: ex.maxReps,
              targetRpe: 9,
              isCustomOverride: false,
            };

            const smart = generateSmartTarget(
              ex,
              selectedWeek,
              profile.completedWorkouts,
              profile.weightUnit
            );

            return (
              <div
                key={ex.id}
                className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-zinc-100">{ex.name}</span>
                    {target.isCustomOverride && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Custom
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-zinc-400 flex items-center gap-2">
                    <span>Baseline Range: {ex.repRange}</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-medium">Suggestion: {smart.reason}</span>
                  </div>
                </div>

                {/* Target Inputs */}
                <div className="flex items-center flex-wrap gap-2.5 text-xs">
                  {/* Weight input */}
                  <div className="flex items-center gap-1.5 bg-zinc-900 px-2.5 py-1.5 rounded-lg border border-zinc-700">
                    <span className="text-zinc-400 font-medium">Weight:</span>
                    <input
                      type="number"
                      step="0.5"
                      value={target.targetWeight || ''}
                      onChange={(e) =>
                        handleUpdate(ex.id, {
                          targetWeight: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-16 bg-transparent font-mono font-bold text-emerald-400 focus:outline-none"
                    />
                    <span className="text-zinc-400 text-[10px]">{profile.weightUnit}</span>
                  </div>

                  {/* Rep Range input */}
                  <div className="flex items-center gap-1 bg-zinc-900 px-2.5 py-1.5 rounded-lg border border-zinc-700">
                    <span className="text-zinc-400 font-medium">Reps:</span>
                    <input
                      type="number"
                      value={target.targetRepsMin || ''}
                      onChange={(e) =>
                        handleUpdate(ex.id, {
                          targetRepsMin: parseInt(e.target.value, 10) || 0,
                        })
                      }
                      className="w-10 bg-transparent font-mono font-bold text-white text-center focus:outline-none"
                    />
                    <span className="text-zinc-500">-</span>
                    <input
                      type="number"
                      value={target.targetRepsMax || ''}
                      onChange={(e) =>
                        handleUpdate(ex.id, {
                          targetRepsMax: parseInt(e.target.value, 10) || 0,
                        })
                      }
                      className="w-10 bg-transparent font-mono font-bold text-white text-center focus:outline-none"
                    />
                  </div>

                  {/* Target RPE */}
                  <div className="flex items-center gap-1.5 bg-zinc-900 px-2.5 py-1.5 rounded-lg border border-zinc-700">
                    <span className="text-zinc-400 font-medium">RPE:</span>
                    <select
                      value={target.targetRpe}
                      onChange={(e) =>
                        handleUpdate(ex.id, {
                          targetRpe: parseFloat(e.target.value) || 9,
                        })
                      }
                      className="bg-transparent font-mono font-bold text-amber-300 focus:outline-none cursor-pointer"
                    >
                      <option value="10" className="bg-zinc-900">10 (0 RIR)</option>
                      <option value="9.5" className="bg-zinc-900">9.5</option>
                      <option value="9" className="bg-zinc-900">9 (1 RIR)</option>
                      <option value="8.5" className="bg-zinc-900">8.5</option>
                      <option value="8" className="bg-zinc-900">8 (2 RIR)</option>
                      <option value="7.5" className="bg-zinc-900">7.5</option>
                      <option value="7" className="bg-zinc-900">7 (3 RIR)</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Day B Targets Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-md space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-emerald-400" />
            <span>Full Body B Targets</span>
          </h2>
          <span className="text-xs text-zinc-400">Day 2 Focus</span>
        </div>

        <div className="space-y-3">
          {currentWeekPlan.workouts.dayB.exercises.map((ex) => {
            const target = localTargets[ex.id] || {
              exerciseId: ex.id,
              weekNumber: selectedWeek,
              targetWeight: 0,
              targetRepsMin: ex.minReps,
              targetRepsMax: ex.maxReps,
              targetRpe: 9,
              isCustomOverride: false,
            };

            const smart = generateSmartTarget(
              ex,
              selectedWeek,
              profile.completedWorkouts,
              profile.weightUnit
            );

            return (
              <div
                key={ex.id}
                className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-zinc-100">{ex.name}</span>
                    {target.isCustomOverride && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Custom
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-zinc-400 flex items-center gap-2">
                    <span>Baseline Range: {ex.repRange}</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-medium">Suggestion: {smart.reason}</span>
                  </div>
                </div>

                {/* Target Inputs */}
                <div className="flex items-center flex-wrap gap-2.5 text-xs">
                  {/* Weight input */}
                  <div className="flex items-center gap-1.5 bg-zinc-900 px-2.5 py-1.5 rounded-lg border border-zinc-700">
                    <span className="text-zinc-400 font-medium">Weight:</span>
                    <input
                      type="number"
                      step="0.5"
                      value={target.targetWeight || ''}
                      onChange={(e) =>
                        handleUpdate(ex.id, {
                          targetWeight: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-16 bg-transparent font-mono font-bold text-emerald-400 focus:outline-none"
                    />
                    <span className="text-zinc-400 text-[10px]">{profile.weightUnit}</span>
                  </div>

                  {/* Rep Range input */}
                  <div className="flex items-center gap-1 bg-zinc-900 px-2.5 py-1.5 rounded-lg border border-zinc-700">
                    <span className="text-zinc-400 font-medium">Reps:</span>
                    <input
                      type="number"
                      value={target.targetRepsMin || ''}
                      onChange={(e) =>
                        handleUpdate(ex.id, {
                          targetRepsMin: parseInt(e.target.value, 10) || 0,
                        })
                      }
                      className="w-10 bg-transparent font-mono font-bold text-white text-center focus:outline-none"
                    />
                    <span className="text-zinc-500">-</span>
                    <input
                      type="number"
                      value={target.targetRepsMax || ''}
                      onChange={(e) =>
                        handleUpdate(ex.id, {
                          targetRepsMax: parseInt(e.target.value, 10) || 0,
                        })
                      }
                      className="w-10 bg-transparent font-mono font-bold text-white text-center focus:outline-none"
                    />
                  </div>

                  {/* Target RPE */}
                  <div className="flex items-center gap-1.5 bg-zinc-900 px-2.5 py-1.5 rounded-lg border border-zinc-700">
                    <span className="text-zinc-400 font-medium">RPE:</span>
                    <select
                      value={target.targetRpe}
                      onChange={(e) =>
                        handleUpdate(ex.id, {
                          targetRpe: parseFloat(e.target.value) || 9,
                        })
                      }
                      className="bg-transparent font-mono font-bold text-amber-300 focus:outline-none cursor-pointer"
                    >
                      <option value="10" className="bg-zinc-900">10 (0 RIR)</option>
                      <option value="9.5" className="bg-zinc-900">9.5</option>
                      <option value="9" className="bg-zinc-900">9 (1 RIR)</option>
                      <option value="8.5" className="bg-zinc-900">8.5</option>
                      <option value="8" className="bg-zinc-900">8 (2 RIR)</option>
                      <option value="7.5" className="bg-zinc-900">7.5</option>
                      <option value="7" className="bg-zinc-900">7 (3 RIR)</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
