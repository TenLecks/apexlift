import React, { useState } from 'react';
import { UserFitnessProfile, Badge } from '../types/workout';
import {
  Award,
  Flame,
  Zap,
  Trophy,
  ShieldCheck,
  CalendarCheck,
  TrendingUp,
  Activity,
  Dumbbell,
  Sparkles,
  HeartHandshake,
  HeartPulse,
  Target,
  Feather,
  BookOpen,
  Lock,
  CheckCircle2,
} from 'lucide-react';

interface BadgesViewProps {
  profile: UserFitnessProfile;
}

export const BadgesView: React.FC<BadgesViewProps> = ({ profile }) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const badgesList = Object.values(profile.badges);
  const unlockedCount = badgesList.filter((b) => !!b.unlockedAt).length;

  const filteredBadges =
    activeCategory === 'all'
      ? badgesList
      : badgesList.filter((b) => b.category === activeCategory);

  // Render icon based on badge iconName
  const renderBadgeIcon = (iconName: string, isUnlocked: boolean) => {
    const baseClass = `w-7 h-7 ${isUnlocked ? 'text-amber-400' : 'text-zinc-600'}`;
    switch (iconName) {
      case 'Flame':
        return <Flame className={baseClass} />;
      case 'CalendarCheck':
        return <CalendarCheck className={baseClass} />;
      case 'ShieldCheck':
        return <ShieldCheck className={baseClass} />;
      case 'Zap':
        return <Zap className={baseClass} />;
      case 'Trophy':
        return <Trophy className={baseClass} />;
      case 'TrendingUp':
        return <TrendingUp className={baseClass} />;
      case 'Activity':
        return <Activity className={baseClass} />;
      case 'Dumbbell':
        return <Dumbbell className={baseClass} />;
      case 'Sparkles':
        return <Sparkles className={baseClass} />;
      case 'HeartHandshake':
        return <HeartHandshake className={baseClass} />;
      case 'HeartPulse':
        return <HeartPulse className={baseClass} />;
      case 'Target':
        return <Target className={baseClass} />;
      case 'Feather':
        return <Feather className={baseClass} />;
      case 'BookOpen':
        return <BookOpen className={baseClass} />;
      default:
        return <Award className={baseClass} />;
    }
  };

  const getTierBadgeColor = (tier?: string) => {
    switch (tier) {
      case 'platinum':
        return 'border-purple-400/40 bg-purple-500/10 text-purple-300';
      case 'gold':
        return 'border-amber-400/40 bg-amber-500/10 text-amber-300';
      case 'silver':
        return 'border-slate-300/40 bg-slate-400/10 text-slate-300';
      default:
        return 'border-amber-700/40 bg-amber-800/10 text-amber-500';
    }
  };

  return (
    <div className="space-y-8">
      {/* Gamification Status Card */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Trophy & Gamification Room
              </span>
            </div>
            <h1 className="text-3xl font-black text-white">Your Achievements & Mastery</h1>
            <p className="text-sm text-zinc-400 max-w-xl leading-relaxed">
              Unlock scientific badges through honest RIR effort, weekly consistency streaks, adaptive bonus sessions,
              and beating the logbook.
            </p>
          </div>

          {/* User Level & Streak Highlights */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 min-w-[280px] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <span>Level {profile.level} Athlete</span>
              </div>
              <span className="font-mono text-xs font-bold text-amber-400">
                {profile.totalXp} Total XP
              </span>
            </div>

            {/* Level XP Bar */}
            <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${(profile.totalXp % 200) / 2}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-900">
              <span className="text-zinc-400">
                Weekly Streak: <strong className="text-orange-400">{profile.streakWeeks} Wks</strong>
              </span>
              <span className="text-zinc-400">
                Badges: <strong className="text-emerald-400">{unlockedCount} / {badgesList.length}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs font-semibold">
        {[
          { id: 'all', label: 'All Badges' },
          { id: 'strength', label: 'Strength & Overload' },
          { id: 'consistency', label: 'Consistency Streaks' },
          { id: 'recovery', label: 'Recovery & Bonus' },
          { id: 'program', label: '12-Week Milestones' },
          { id: 'mastery', label: 'Volume & Mastery' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveCategory(tab.id)}
            className={`px-3.5 py-2 rounded-xl transition whitespace-nowrap border ${
              activeCategory === tab.id
                ? 'bg-zinc-800 text-amber-400 border-zinc-700 shadow-sm'
                : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBadges.map((badge) => {
          const isUnlocked = !!badge.unlockedAt;

          return (
            <div
              key={badge.id}
              className={`rounded-2xl p-5 border transition relative flex flex-col justify-between space-y-4 ${
                isUnlocked
                  ? 'bg-zinc-900 border-zinc-700/80 shadow-md hover:border-zinc-600'
                  : 'bg-zinc-950/70 border-zinc-800/80 opacity-80 hover:opacity-100'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={`p-3 rounded-2xl border transition ${
                      isUnlocked
                        ? 'bg-amber-500/10 border-amber-500/30'
                        : 'bg-zinc-900 border-zinc-800'
                    }`}
                  >
                    {renderBadgeIcon(badge.iconName, isUnlocked)}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {badge.tier && (
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getTierBadgeColor(
                          badge.tier
                        )}`}
                      >
                        {badge.tier}
                      </span>
                    )}

                    {isUnlocked ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Lock className="w-4 h-4 text-zinc-600" />
                    )}
                  </div>
                </div>

                <div className="mt-3">
                  <h3
                    className={`text-base font-bold ${
                      isUnlocked ? 'text-white' : 'text-zinc-400'
                    }`}
                  >
                    {badge.title}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    {badge.description}
                  </p>
                </div>
              </div>

              {/* Progress / Status Bottom */}
              <div className="pt-3 border-t border-zinc-800/80 text-xs">
                {isUnlocked ? (
                  <div className="flex items-center justify-between text-emerald-400 font-medium">
                    <span>Unlocked</span>
                    <span className="font-mono text-[11px] text-zinc-400">
                      {new Date(badge.unlockedAt!).toLocaleDateString()}
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] text-zinc-400">
                      <span>Progress</span>
                      <span className="font-mono">{badge.progress}%</span>
                    </div>
                    <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${badge.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
