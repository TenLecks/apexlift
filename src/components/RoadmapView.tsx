import React from 'react';
import { PROGRAM_WEEKS } from '../data/programData';
import { UserFitnessProfile } from '../types/workout';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Dumbbell,
  ArrowRight,
  Flame,
  Award,
  Sparkles,
  Zap,
} from 'lucide-react';

interface RoadmapViewProps {
  profile: UserFitnessProfile;
  selectedWeek: number;
  onSelectWeek: (week: number) => void;
  onStartWorkout: (week: number, dayType: 'Full Body A' | 'Full Body B') => void;
  onOpenAdaptiveBonus: (week: number) => void;
}

export const RoadmapView: React.FC<RoadmapViewProps> = ({
  profile,
  selectedWeek,
  onSelectWeek,
  onStartWorkout,
  onOpenAdaptiveBonus,
}) => {
  // Compute overall program completion
  const totalRequiredWorkouts = 24; // 12 weeks * 2 anchor days
  const completedAnchorCount = profile.completedWorkouts.filter(
    (w) => w.dayType === 'Full Body A' || w.dayType === 'Full Body B'
  ).length;
  const progressPct = Math.min(100, Math.round((completedAnchorCount / totalRequiredWorkouts) * 100));

  // Blocks
  const blocks = [
    {
      blockNumber: 1,
      title: 'Phase 1: Hypertrophic Foundation',
      weeks: PROGRAM_WEEKS.slice(0, 4),
      focus: 'Motor pattern mastery, RPE 7-8 to 8-9 adaptation, double progression baseline.',
    },
    {
      blockNumber: 2,
      title: 'Phase 2: Novelty & Overload Progression',
      weeks: PROGRAM_WEEKS.slice(4, 8),
      focus: 'Exercise variation to avoid plateaus, unilateral leg work, and RPE 9-10 ceiling.',
    },
    {
      blockNumber: 3,
      title: 'Phase 3: Peak Intensity & Density Specialization',
      weeks: PROGRAM_WEEKS.slice(8, 12),
      focus: 'Peak strength density, dropsets, lengthened partials, and final 12-week test.',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Overview Card */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                12-Week Science Program
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-300">
                2x/Week Core Anchor + Adaptive Bonus
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              The Essentials Periodization Roadmap
            </h1>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Evidence-based progressive overload and high-intensity hypertrophy. Focus on beating the logbook with
              1–2 top sets to failure, auto-regulated rest intervals, and dynamic adaptation whenever you can
              train extra.
            </p>
          </div>

          {/* Program Progress Stats */}
          <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-5 min-w-[260px] space-y-4">
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-400 font-medium">Program Completion:</span>
              <span className="font-mono font-bold text-emerald-400 text-sm">{progressPct}%</span>
            </div>
            <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="grid grid-cols-2 gap-2 text-center text-xs pt-1">
              <div className="bg-zinc-900 p-2 rounded-xl border border-zinc-800/80">
                <div className="text-white font-mono font-bold text-base">{completedAnchorCount}/24</div>
                <div className="text-[11px] text-zinc-400">Anchor Workouts</div>
              </div>
              <div className="bg-zinc-900 p-2 rounded-xl border border-zinc-800/80">
                <div className="text-amber-400 font-mono font-bold text-base">{profile.bonusSessions.length}</div>
                <div className="text-[11px] text-zinc-400">Bonus Sessions</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Blocks Display */}
      <div className="space-y-8">
        {blocks.map((block) => (
          <div key={block.blockNumber} className="space-y-4">
            {/* Block Header */}
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 border-b border-zinc-800/80 pb-2">
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Block {block.blockNumber} • Weeks {(block.blockNumber - 1) * 4 + 1}–{block.blockNumber * 4}
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white">{block.title}</h2>
              </div>
              <p className="text-xs text-zinc-400 max-w-md sm:text-right">{block.focus}</p>
            </div>

            {/* Week Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {block.weeks.map((week) => {
                const isSelected = selectedWeek === week.weekNumber;
                const completedSessions = profile.completedWorkouts.filter(
                  (w) => w.weekNumber === week.weekNumber
                );
                const hasA = completedSessions.some((w) => w.dayType === 'Full Body A');
                const hasB = completedSessions.some((w) => w.dayType === 'Full Body B');
                const isFullyComplete = hasA && hasB;
                const bonusCount = profile.bonusSessions.filter(
                  (b) => b.weekNumber === week.weekNumber
                ).length;

                return (
                  <div
                    key={week.weekNumber}
                    onClick={() => onSelectWeek(week.weekNumber)}
                    className={`rounded-2xl p-5 border transition cursor-pointer flex flex-col justify-between space-y-4 ${
                      isSelected
                        ? 'bg-zinc-900 border-emerald-500 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/50'
                        : isFullyComplete
                        ? 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                        : 'bg-zinc-950 border-zinc-800/80 hover:border-zinc-700'
                    }`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between pb-2">
                        <span className="font-mono text-sm font-black text-white">
                          Week {week.weekNumber}
                        </span>
                        {week.isDeload ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Deload
                          </span>
                        ) : isFullyComplete ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Done
                          </span>
                        ) : (
                          <span className="text-[11px] text-zinc-500 font-mono">
                            {hasA || hasB ? '1/2 Done' : 'Pending'}
                          </span>
                        )}
                      </div>

                      {/* Workouts Status Checklist */}
                      <div className="space-y-2 mt-2">
                        {/* Day A */}
                        <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-900 border border-zinc-800/80 text-xs">
                          <span className="font-medium text-zinc-200">Full Body A</span>
                          {hasA ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onStartWorkout(week.weekNumber, 'Full Body A');
                              }}
                              className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-emerald-500 hover:text-zinc-950 text-zinc-300 text-[11px] font-semibold transition"
                            >
                              Log A
                            </button>
                          )}
                        </div>

                        {/* Day B */}
                        <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-900 border border-zinc-800/80 text-xs">
                          <span className="font-medium text-zinc-200">Full Body B</span>
                          {hasB ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onStartWorkout(week.weekNumber, 'Full Body B');
                              }}
                              className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-emerald-500 hover:text-zinc-950 text-zinc-300 text-[11px] font-semibold transition"
                            >
                              Log B
                            </button>
                          )}
                        </div>

                        {/* Bonus indicator if completed */}
                        {bonusCount > 0 && (
                          <div className="flex items-center justify-between px-2 py-1 rounded-lg bg-teal-500/10 border border-teal-500/20 text-[11px] text-teal-300 font-medium">
                            <span>+{bonusCount} Extra Workout</span>
                            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Action */}
                    <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-xs">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenAdaptiveBonus(week.weekNumber);
                        }}
                        className="text-teal-400 hover:text-teal-300 text-[11px] font-semibold flex items-center gap-1 transition"
                      >
                        <span>+ Squeeze Extra</span>
                      </button>

                      <span className="text-zinc-500 flex items-center gap-0.5 group-hover:text-zinc-300">
                        <span>Details</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
