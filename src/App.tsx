import React, { useState, useEffect } from 'react';
import {
  UserFitnessProfile,
  CompletedWorkoutSession,
  BonusSessionLog,
  WeeklyExerciseTarget,
  Badge,
} from './types/workout';
import {
  loadUserProfile,
  saveUserProfile,
  updateStreakAndBadges,
  seedSampleDemoData,
  getDefaultProfile,
} from './utils/storage';
import { Navbar } from './components/Navbar';
import { RoadmapView } from './components/RoadmapView';
import { WorkoutView } from './components/WorkoutView';
import { WeeklyTargetsView } from './components/WeeklyTargetsView';
import { ProgressVisualizationView } from './components/ProgressVisualizationView';
import { BadgesView } from './components/BadgesView';
import { AdaptiveBonusModal } from './components/AdaptiveBonusModal';
import { RirGuideModal } from './components/RirGuideModal';
import { CloudBackupModal } from './components/CloudBackupModal';
import { Award, CheckCircle2, Dumbbell, Flame, Sparkles, X } from 'lucide-react';

export default function App() {
  const [profile, setProfile] = useState<UserFitnessProfile>(() => loadUserProfile());
  const [selectedWeek, setSelectedWeek] = useState<number>(profile.currentWeek || 1);
  const [currentTab, setCurrentTab] = useState<
    'roadmap' | 'workout' | 'bonus' | 'targets' | 'analytics' | 'badges'
  >('roadmap');

  // Modals state
  const [isRirGuideOpen, setIsRirGuideOpen] = useState<boolean>(false);
  const [isAdaptiveBonusOpen, setIsAdaptiveBonusOpen] = useState<boolean>(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState<boolean>(false);
  const [adaptiveBonusWeek, setAdaptiveBonusWeek] = useState<number>(selectedWeek);

  // Unlocked badge alert toast
  const [badgeToast, setBadgeToast] = useState<Badge | null>(null);

  useEffect(() => {
    saveUserProfile(profile);
  }, [profile]);

  const handleToggleUnit = () => {
    setProfile((prev) => {
      const nextUnit = prev.weightUnit === 'kg' ? 'lbs' : 'kg';
      const updated = { ...prev, weightUnit: nextUnit as 'kg' | 'lbs' };
      saveUserProfile(updated);
      return updated;
    });
  };

  const handleFinishWorkout = (session: CompletedWorkoutSession) => {
    const nextCompleted = [
      ...profile.completedWorkouts.filter(
        (w) => !(w.weekNumber === session.weekNumber && w.dayType === session.dayType)
      ),
      session,
    ];

    const updatedProfile: UserFitnessProfile = {
      ...profile,
      completedWorkouts: nextCompleted,
    };

    const { profile: evaluated, newlyUnlockedBadges } = updateStreakAndBadges(updatedProfile);
    setProfile(evaluated);

    if (newlyUnlockedBadges.length > 0) {
      setBadgeToast(newlyUnlockedBadges[0]);
    }
  };

  const handleSaveBonusSession = (session: BonusSessionLog) => {
    const nextBonus = [...profile.bonusSessions, session];
    const updatedProfile: UserFitnessProfile = {
      ...profile,
      bonusSessions: nextBonus,
    };

    const { profile: evaluated, newlyUnlockedBadges } = updateStreakAndBadges(updatedProfile);
    setProfile(evaluated);

    if (newlyUnlockedBadges.length > 0) {
      setBadgeToast(newlyUnlockedBadges[0]);
    }
  };

  const handleSaveTargets = (targets: Record<string, WeeklyExerciseTarget>) => {
    setProfile((prev) => {
      const updated = { ...prev, weeklyTargets: targets };
      saveUserProfile(updated);
      return updated;
    });
  };

  const handleLoadDemoData = () => {
    const demo = seedSampleDemoData();
    setProfile(demo);
    setSelectedWeek(demo.currentWeek);
  };

  const handleResetData = () => {
    if (window.confirm('Reset all logged workouts and achievements to start fresh?')) {
      const reset = getDefaultProfile();
      setProfile(reset);
      setSelectedWeek(1);
      saveUserProfile(reset);
    }
  };

  const handleStartWorkout = (week: number, dayType: 'Full Body A' | 'Full Body B') => {
    setSelectedWeek(week);
    setCurrentTab('workout');
  };

  const handleOpenBonusFromRoadmap = (week: number) => {
    setAdaptiveBonusWeek(week);
    setIsAdaptiveBonusOpen(true);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-zinc-950">
      {/* Navigation Header */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        profile={profile}
        selectedWeek={selectedWeek}
        setSelectedWeek={setSelectedWeek}
        onToggleUnit={handleToggleUnit}
        onOpenRirGuide={() => setIsRirGuideOpen(true)}
        onOpenAdaptiveBonus={() => {
          setAdaptiveBonusWeek(selectedWeek);
          setIsAdaptiveBonusOpen(true);
        }}
        onOpenBackup={() => setIsBackupModalOpen(true)}
        onLoadDemoData={handleLoadDemoData}
        onResetData={handleResetData}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 sm:py-8">
        {currentTab === 'roadmap' && (
          <RoadmapView
            profile={profile}
            selectedWeek={selectedWeek}
            onSelectWeek={setSelectedWeek}
            onStartWorkout={handleStartWorkout}
            onOpenAdaptiveBonus={handleOpenBonusFromRoadmap}
          />
        )}

        {currentTab === 'workout' && (
          <WorkoutView
            profile={profile}
            selectedWeek={selectedWeek}
            onFinishWorkout={handleFinishWorkout}
            onOpenRirGuide={() => setIsRirGuideOpen(true)}
          />
        )}

        {currentTab === 'bonus' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-teal-950/60 to-emerald-950/60 border border-teal-500/30 rounded-3xl p-6 sm:p-8 shadow-xl">
              <div className="max-w-2xl space-y-3">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  Adaptive +1 Scheduler Engine
                </span>
                <h1 className="text-3xl font-black text-white">
                  Dynamic Schedule Adaptation
                </h1>
                <p className="text-sm text-zinc-300 leading-relaxed">
                  Your baseline schedule is 2x/week (Full Body A & B). When your calendar opens up to squeeze
                  an extra workout, launch the test below. The engine detects your systemic fatigue & DOMS to
                  seamlessly prescribe Yoga, Zone 2 Cardio, or Weak-Point Hypertrophy—and credits the volume directly to
                  your weekly muscle group targets!
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setAdaptiveBonusWeek(selectedWeek);
                      setIsAdaptiveBonusOpen(true);
                    }}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-zinc-950 font-bold text-sm shadow-md transition active:scale-95 flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Run 30-Second Autoregulation Test</span>
                  </button>
                </div>
              </div>
            </div>

            {/* List of previously logged bonus sessions */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-md space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Flame className="w-5 h-5 text-teal-400" />
                <span>Logged Bonus Workouts ({profile.bonusSessions.length})</span>
              </h2>

              {profile.bonusSessions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {profile.bonusSessions.map((b) => (
                    <div
                      key={b.id}
                      className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-teal-400">
                            Week {b.weekNumber}
                          </span>
                          <h3 className="font-bold text-sm text-white">{b.title}</h3>
                        </div>
                        <p className="text-xs text-zinc-400">
                          {b.durationMinutes} mins • Added sets to:{' '}
                          {b.addedVolumeMuscles.map((m) => `${m.muscle} (+${m.sets})`).join(', ')}
                        </p>
                        <span className="text-[11px] text-zinc-500 font-mono">
                          {new Date(b.date).toLocaleDateString()}
                        </span>
                      </div>
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-teal-500/10 text-teal-300 border border-teal-500/20">
                        {b.type.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-zinc-500 text-sm">
                  No bonus sessions logged yet. Squeeze an extra session whenever you have time!
                </div>
              )}
            </div>
          </div>
        )}

        {currentTab === 'targets' && (
          <WeeklyTargetsView
            profile={profile}
            selectedWeek={selectedWeek}
            onSaveTargets={handleSaveTargets}
          />
        )}

        {currentTab === 'analytics' && (
          <ProgressVisualizationView profile={profile} selectedWeek={selectedWeek} />
        )}

        {currentTab === 'badges' && <BadgesView profile={profile} />}
      </main>

      {/* RIR Guide Modal */}
      <RirGuideModal isOpen={isRirGuideOpen} onClose={() => setIsRirGuideOpen(false)} />

      {/* Adaptive Bonus Modal */}
      <AdaptiveBonusModal
        isOpen={isAdaptiveBonusOpen}
        onClose={() => setIsAdaptiveBonusOpen(false)}
        weekNumber={adaptiveBonusWeek}
        onSaveBonusSession={handleSaveBonusSession}
      />

      {/* Cloud & Backup Hub Modal */}
      <CloudBackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        profile={profile}
        onRestoreProfile={(restored) => {
          setProfile(restored);
          setSelectedWeek(restored.currentWeek || 1);
        }}
      />

      {/* Badge Unlock Toast Notification */}
      {badgeToast && (
        <div className="fixed top-20 right-4 z-50 max-w-sm bg-gradient-to-r from-amber-500 to-yellow-600 text-zinc-950 p-4 rounded-2xl shadow-2xl flex items-start gap-3 animate-bounce">
          <div className="p-2 rounded-xl bg-black/10">
            <Award className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div className="flex-1">
            <span className="text-[11px] font-black uppercase tracking-wider block opacity-80">
              Badge Unlocked! (+100 XP)
            </span>
            <div className="font-black text-sm">{badgeToast.title}</div>
            <p className="text-xs mt-0.5 opacity-90">{badgeToast.description}</p>
          </div>
          <button
            onClick={() => setBadgeToast(null)}
            className="p-1 rounded-lg hover:bg-black/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950/80 py-6 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-emerald-500" />
            <span className="text-zinc-400 font-semibold">ApexLift</span>
            <span>— Evidence-Based Hypertrophy & Progressive Overload Architecture</span>
          </div>
          <div>Weekly Consistency Streak & Scientific Autoregulation Engine</div>
        </div>
      </footer>
    </div>
  );
}
