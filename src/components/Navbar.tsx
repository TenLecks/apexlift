import React from 'react';
import { WeightUnit, UserFitnessProfile } from '../types/workout';
import {
  Dumbbell,
  Calendar,
  Flame,
  Award,
  BarChart3,
  Sliders,
  PlusCircle,
  HelpCircle,
  RotateCcw,
  Sparkles,
  Cloud,
} from 'lucide-react';

interface NavbarProps {
  currentTab: 'roadmap' | 'workout' | 'bonus' | 'targets' | 'analytics' | 'badges';
  setCurrentTab: (tab: 'roadmap' | 'workout' | 'bonus' | 'targets' | 'analytics' | 'badges') => void;
  profile: UserFitnessProfile;
  selectedWeek: number;
  setSelectedWeek: (week: number) => void;
  onToggleUnit: () => void;
  onOpenRirGuide: () => void;
  onOpenAdaptiveBonus: () => void;
  onOpenBackup: () => void;
  onLoadDemoData: () => void;
  onResetData: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  profile,
  selectedWeek,
  setSelectedWeek,
  onToggleUnit,
  onOpenRirGuide,
  onOpenAdaptiveBonus,
  onOpenBackup,
  onLoadDemoData,
  onResetData,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800 text-zinc-100">
      {/* Top Utility Bar */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
        {/* Brand & Program Indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-black tracking-tight text-lg text-emerald-400">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Dumbbell className="w-5 h-5" />
            </div>
            <span>ApexLift</span>
          </div>
          <span className="hidden md:inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
            12-Week Science-Based Hypertrophy
          </span>
        </div>

        {/* Center / Right Stats & Controls */}
        <div className="flex items-center flex-wrap gap-2.5 sm:gap-4">
          {/* Week Selector */}
          <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-700/80 rounded-lg px-2.5 py-1">
            <span className="text-zinc-400 text-xs font-semibold uppercase">Week:</span>
            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(Number(e.target.value))}
              className="bg-transparent font-bold text-emerald-400 focus:outline-none cursor-pointer"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((w) => (
                <option key={w} value={w} className="bg-zinc-900 text-zinc-100">
                  Week {w} {w === 5 || w === 12 ? '(Deload)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Weekly Consistency Streak */}
          <div
            title="Weekly Consistency Streak: Earned by completing both anchor workouts (A & B) each week"
            className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-lg px-2.5 py-1 text-amber-300 font-bold"
          >
            <Flame className="w-4 h-4 text-orange-400 fill-orange-400 animate-pulse" />
            <span>{profile.streakWeeks} Wk Streak</span>
          </div>

          {/* Level / XP */}
          <div
            title={`Total XP: ${profile.totalXp} XP. Earn XP from sets, workouts, and badges!`}
            className="hidden sm:flex items-center gap-1.5 bg-zinc-900 border border-indigo-500/30 rounded-lg px-2.5 py-1 text-indigo-300 font-semibold"
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Lvl {profile.level}</span>
            <span className="text-xs text-zinc-400">({profile.totalXp} XP)</span>
          </div>

          {/* Unit Toggle Button */}
          <button
            onClick={onToggleUnit}
            className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 font-mono text-xs transition"
            title="Toggle between kg and lbs"
          >
            {profile.weightUnit.toUpperCase()}
          </button>

          {/* RIR / RPE Scale Guide Modal Button */}
          <button
            onClick={onOpenRirGuide}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-xs transition"
            title="Open Scientific RPE & RIR Guide"
          >
            <HelpCircle className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">RIR Guide</span>
          </button>

          {/* Squeeze Extra Session Quick Button */}
          <button
            onClick={onOpenAdaptiveBonus}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-zinc-950 font-bold text-xs shadow-sm transition active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+1 Extra Workout</span>
          </button>

          {/* Cloud / Backup Button */}
          <button
            onClick={onOpenBackup}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-sky-300 text-xs transition"
            title="Export / Restore Backup, save to GitHub or file"
          >
            <Cloud className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Backup & Sync</span>
          </button>

          {/* Demo Data Quick Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={onLoadDemoData}
              className="px-2 py-1 text-xs rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition"
              title="Load sample progression data to test charts, badges & analytics"
            >
              Load Demo
            </button>
            <button
              onClick={onResetData}
              className="p-1 text-zinc-500 hover:text-red-400 transition"
              title="Reset all logs and targets"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <nav className="max-w-7xl mx-auto px-4 flex space-x-1 sm:space-x-2 overflow-x-auto border-t border-zinc-900 py-1.5 scrollbar-none">
        <button
          onClick={() => setCurrentTab('roadmap')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition ${
            currentTab === 'roadmap'
              ? 'bg-zinc-800 text-emerald-400 border border-zinc-700'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>12-Week Roadmap</span>
        </button>

        <button
          onClick={() => setCurrentTab('workout')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition ${
            currentTab === 'workout'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <Dumbbell className="w-4 h-4" />
          <span>Workout Logger</span>
        </button>

        <button
          onClick={() => setCurrentTab('bonus')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition ${
            currentTab === 'bonus'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Adaptive +1 Engine</span>
        </button>

        <button
          onClick={() => setCurrentTab('targets')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition ${
            currentTab === 'targets'
              ? 'bg-zinc-800 text-amber-400 border border-zinc-700'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Weekly Targets</span>
        </button>

        <button
          onClick={() => setCurrentTab('analytics')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition ${
            currentTab === 'analytics'
              ? 'bg-zinc-800 text-sky-400 border border-zinc-700'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>1RM & Volume Analytics</span>
        </button>

        <button
          onClick={() => setCurrentTab('badges')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition ${
            currentTab === 'badges'
              ? 'bg-zinc-800 text-yellow-400 border border-zinc-700'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Badges & Trophies</span>
        </button>
      </nav>
    </header>
  );
};
