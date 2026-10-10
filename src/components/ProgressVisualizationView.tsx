import React, { useState } from 'react';
import { UserFitnessProfile, MuscleGroup } from '../types/workout';
import {
  calculate1RM,
  calculateWeeklyMuscleVolume,
  formatWeight,
  MUSCLE_VOLUME_TARGETS,
} from '../utils/progression';
import {
  TrendingUp,
  BarChart3,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Info,
  Calendar,
  Layers,
} from 'lucide-react';

interface ProgressVisualizationViewProps {
  profile: UserFitnessProfile;
  selectedWeek: number;
}

export const ProgressVisualizationView: React.FC<ProgressVisualizationViewProps> = ({
  profile,
  selectedWeek,
}) => {
  const [selectedExerciseName, setSelectedExerciseName] = useState<string>('Flat DB Press');

  // Key tracked exercises for 1RM
  const compoundLifts = [
    'Flat DB Press',
    'Hack Squat',
    'Romanian Deadlift',
    'Lat Pulldown',
    'T-Bar Row',
    'Incline DB Press',
    'Leg Press',
  ];

  // Compute 1RM points across all 12 weeks for selected exercise
  const oneRmHistory: { week: number; best1RM: number; weight: number; reps: number; date: string }[] = [];

  for (let w = 1; w <= 12; w++) {
    const sessions = profile.completedWorkouts.filter((s) => s.weekNumber === w);
    let weekBest1RM = 0;
    let weekBestWeight = 0;
    let weekBestReps = 0;
    let logDate = '';

    sessions.forEach((s) => {
      s.exercises.forEach((ex) => {
        if (ex.exerciseName.toLowerCase().includes(selectedExerciseName.toLowerCase())) {
          ex.sets.forEach((set) => {
            if (!set.isWarmup && set.completed && set.weight > 0 && set.reps > 0) {
              const est = calculate1RM(set.weight, set.reps);
              if (est > weekBest1RM) {
                weekBest1RM = est;
                weekBestWeight = set.weight;
                weekBestReps = set.reps;
                logDate = s.dateCompleted;
              }
            }
          });
        }
      });
    });

    if (weekBest1RM > 0) {
      oneRmHistory.push({
        week: w,
        best1RM: weekBest1RM,
        weight: weekBestWeight,
        reps: weekBestReps,
        date: logDate,
      });
    }
  }

  // Calculate stats
  const baseline1RM = oneRmHistory.length > 0 ? oneRmHistory[0].best1RM : 0;
  const currentBest1RM = oneRmHistory.length > 0 ? Math.max(...oneRmHistory.map((p) => p.best1RM)) : 0;
  const netGainPct =
    baseline1RM > 0 ? Math.round(((currentBest1RM - baseline1RM) / baseline1RM) * 1000) / 10 : 0;

  // Weekly muscle volume stats for the current selected week
  const weeklyVolumeStats = calculateWeeklyMuscleVolume(
    selectedWeek,
    profile.completedWorkouts,
    profile.bonusSessions
  );

  return (
    <div className="space-y-8">
      {/* Top Header Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/30">
                Visual Analytics & Metrics
              </span>
              <span className="text-xs text-zinc-400">Week {selectedWeek} Active View</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-1.5">
              Estimated 1RM & Effective Muscle Volume
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl leading-relaxed">
              Track progressive overload via Epley formula 1RM calculations, and monitor weekly set volume
              per muscle group against peer-reviewed science-based hypertrophy targets.
            </p>
          </div>

          {/* Quick Stat Pill */}
          <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 flex items-center gap-4">
            <div>
              <div className="text-xs text-zinc-400">Total Anchor Sessions</div>
              <div className="text-xl font-bold font-mono text-emerald-400">
                {profile.completedWorkouts.length}
              </div>
            </div>
            <div className="h-8 w-px bg-zinc-800" />
            <div>
              <div className="text-xs text-zinc-400">Adaptive Bonus Done</div>
              <div className="text-xl font-bold font-mono text-teal-400">
                {profile.bonusSessions.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: ESTIMATED 1RM PROGRESSION */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-md space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/30">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Estimated 1RM Strength Curve</h2>
              <p className="text-xs text-zinc-400">Formula: Weight × (1 + Reps ÷ 30)</p>
            </div>
          </div>

          {/* Exercise Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400 font-semibold">Lift:</span>
            <select
              value={selectedExerciseName}
              onChange={(e) => setSelectedExerciseName(e.target.value)}
              className="bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs font-bold text-sky-300 focus:outline-none cursor-pointer"
            >
              {compoundLifts.map((lift) => (
                <option key={lift} value={lift}>
                  {lift}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 1RM Stat Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
            <span className="text-xs text-zinc-400 font-medium">Starting Baseline</span>
            <div className="text-2xl font-black font-mono text-zinc-200 mt-1">
              {baseline1RM > 0 ? formatWeight(baseline1RM, profile.weightUnit) : '—'}
            </div>
            <div className="text-[11px] text-zinc-500">First logged session</div>
          </div>

          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
            <span className="text-xs text-zinc-400 font-medium">Current Peak 1RM</span>
            <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
              {currentBest1RM > 0 ? formatWeight(currentBest1RM, profile.weightUnit) : '—'}
            </div>
            <div className="text-[11px] text-zinc-500">Top set to failure</div>
          </div>

          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
            <span className="text-xs text-zinc-400 font-medium">Strength Improvement</span>
            <div className="text-2xl font-black font-mono text-sky-400 mt-1">
              {netGainPct >= 0 ? `+${netGainPct}%` : `${netGainPct}%`}
            </div>
            <div className="text-[11px] text-zinc-500">Relative overload delta</div>
          </div>
        </div>

        {/* SVG Curve Chart */}
        <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-800">
          {oneRmHistory.length > 0 ? (
            <div className="space-y-4">
              <div className="h-56 w-full flex items-end gap-2 pt-6 pb-2 px-4 relative">
                {/* Horizontal guide lines */}
                <div className="absolute inset-x-0 top-6 border-b border-zinc-800/60" />
                <div className="absolute inset-x-0 top-1/2 border-b border-zinc-800/40" />
                <div className="absolute inset-x-0 bottom-8 border-b border-zinc-800" />

                {oneRmHistory.map((pt, idx) => {
                  const maxVal = Math.max(...oneRmHistory.map((p) => p.best1RM)) * 1.15;
                  const minVal = Math.min(...oneRmHistory.map((p) => p.best1RM)) * 0.85;
                  const range = Math.max(1, maxVal - minVal);
                  const heightPct = Math.min(100, Math.max(15, ((pt.best1RM - minVal) / range) * 100));

                  return (
                    <div
                      key={pt.week}
                      className="flex-1 flex flex-col items-center h-full justify-end group relative z-10"
                    >
                      {/* Tooltip on hover */}
                      <div className="opacity-0 group-hover:opacity-100 transition absolute -top-12 bg-zinc-800 border border-zinc-700 text-white text-[11px] font-mono px-2 py-1 rounded shadow-lg pointer-events-none whitespace-nowrap z-20">
                        {formatWeight(pt.best1RM, profile.weightUnit)} (Logged: {pt.weight}
                        {profile.weightUnit} x {pt.reps})
                      </div>

                      <div
                        className="w-full max-w-[36px] bg-gradient-to-t from-sky-600 to-sky-400 rounded-t-lg transition-all duration-300 group-hover:from-emerald-500 group-hover:to-teal-400"
                        style={{ height: `${heightPct}%` }}
                      />
                      <span className="text-[11px] font-mono font-semibold text-zinc-400 mt-2">
                        W{pt.week}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-xs text-zinc-400 px-2 pt-2 border-t border-zinc-800">
                <span>Week 1 (Start)</span>
                <span className="text-zinc-500">1RM Strength Trajectory Across 12 Weeks</span>
                <span>Week {oneRmHistory[oneRmHistory.length - 1].week} (Latest)</span>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-zinc-500 space-y-2">
              <Info className="w-8 h-8 mx-auto text-zinc-600" />
              <p className="text-sm font-medium">No sets logged yet for "{selectedExerciseName}".</p>
              <p className="text-xs text-zinc-500">
                Log a workout in the Workout Logger or click "Load Demo" in the top bar to preview sample curves.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: WEEKLY EFFECTIVE VOLUME PER MUSCLE GROUP */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-md space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Weekly Effective Volume Target Adherence
              </h2>
              <p className="text-xs text-zinc-400">
                Comparing logged working sets (Anchor A + B + Adaptive Bonus) vs evidence-based guidelines
              </p>
            </div>
          </div>
          <span className="text-xs font-mono px-3 py-1 rounded-full bg-zinc-800 text-emerald-400 border border-zinc-700">
            Selected Week: {selectedWeek}
          </span>
        </div>

        {/* Volume Bars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {weeklyVolumeStats.map((item) => {
            const optimalMax = item.targetSetsMax;
            const pct = Math.min(100, (item.completedSets / optimalMax) * 100);

            return (
              <div
                key={item.muscle}
                className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-zinc-200">{item.muscle}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-white">
                      {item.completedSets}{' '}
                      <span className="text-zinc-500 text-[11px]">
                        / target {item.targetSetsMin}-{item.targetSetsMax} sets
                      </span>
                    </span>

                    {item.status === 'optimal' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Optimal
                      </span>
                    )}
                    {item.status === 'moderate' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        In Progress
                      </span>
                    )}
                    {item.status === 'surplus' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        High Stimulus
                      </span>
                    )}
                    {item.status === 'low' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
                        Untrained
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      item.status === 'optimal'
                        ? 'bg-emerald-500'
                        : item.status === 'surplus'
                        ? 'bg-purple-500'
                        : item.status === 'moderate'
                        ? 'bg-amber-400'
                        : 'bg-zinc-700'
                    }`}
                    style={{ width: `${Math.max(5, pct)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Note on Bonus Session addition */}
        <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 flex items-center gap-2 text-xs text-zinc-400">
          <Info className="w-4 h-4 text-teal-400 shrink-0" />
          <span>
            Whenever you log an <strong className="text-teal-300">Adaptive Bonus (+1)</strong> workout
            (whether Yoga Core, Zone 2 Cardio, or Weak-Point Booster), the relevant sets automatically feed
            into these weekly effective totals!
          </span>
        </div>
      </div>
    </div>
  );
};
