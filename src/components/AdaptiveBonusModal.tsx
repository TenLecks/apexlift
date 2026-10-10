import React, { useState } from 'react';
import {
  X,
  Sliders,
  Sparkles,
  HeartPulse,
  HeartHandshake,
  Dumbbell,
  Clock,
  Play,
  CheckCircle2,
  Flame,
  ChevronRight,
  Info,
} from 'lucide-react';
import {
  ADAPTIVE_BONUS_PRESETS,
  AdaptiveBonusOption,
} from '../data/programData';
import { BonusSessionLog, MuscleGroup } from '../types/workout';
import { sounds } from '../utils/audio';
import confetti from 'canvas-confetti';

interface AdaptiveBonusModalProps {
  isOpen: boolean;
  onClose: () => void;
  weekNumber: number;
  onSaveBonusSession: (session: BonusSessionLog) => void;
}

export const AdaptiveBonusModal: React.FC<AdaptiveBonusModalProps> = ({
  isOpen,
  onClose,
  weekNumber,
  onSaveBonusSession,
}) => {
  const [soreness, setSoreness] = useState<number>(3);
  const [energy, setEnergy] = useState<number>(3);
  const [timeAvailable, setTimeAvailable] = useState<20 | 30 | 45>(30);

  // Active workout state
  const [activePresetKey, setActivePresetKey] = useState<string | null>(null);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [stepTimerSeconds, setStepTimerSeconds] = useState<number>(0);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [isSessionComplete, setIsSessionComplete] = useState<boolean>(false);

  if (!isOpen) return null;

  // Adaptive Algorithm Decision Logic (Option A):
  let recommendedKey = 'cardio_zone2_30';
  if (soreness >= 4 || energy <= 2) {
    // High fatigue or soreness -> Yoga / Mobility
    recommendedKey = timeAvailable <= 20 ? 'yoga_mobility_20' : 'yoga_mobility_30';
  } else if (soreness <= 2 && energy >= 4) {
    // Low fatigue, high energy -> Strength Weak Point Booster
    recommendedKey = 'strength_weak_arms_delts';
  } else {
    // Moderate fatigue -> Zone 2 Cardio (PDF protocol)
    recommendedKey = timeAvailable <= 20 ? 'cardio_zone2_20' : 'cardio_zone2_30';
  }

  const currentPreset: AdaptiveBonusOption =
    ADAPTIVE_BONUS_PRESETS[activePresetKey || recommendedKey];

  const handleStartPreset = (key: string) => {
    setActivePresetKey(key);
    setActiveStepIndex(0);
    const firstStep = ADAPTIVE_BONUS_PRESETS[key].steps[0];
    setStepTimerSeconds(firstStep.durationSeconds || 120);
    setTimerRunning(false);
  };

  const handleNextStep = () => {
    if (activeStepIndex + 1 < currentPreset.steps.length) {
      const nextIdx = activeStepIndex + 1;
      setActiveStepIndex(nextIdx);
      const nextStep = currentPreset.steps[nextIdx];
      setStepTimerSeconds(nextStep.durationSeconds || 120);
      setTimerRunning(false);
    } else {
      handleCompleteSession();
    }
  };

  const handleCompleteSession = () => {
    const bonusLog: BonusSessionLog = {
      id: `bonus-${Date.now()}`,
      date: new Date().toISOString(),
      weekNumber,
      type: currentPreset.type,
      title: currentPreset.title,
      durationMinutes: currentPreset.durationMinutes,
      fatigueScore: 6 - energy,
      sorenessScore: soreness,
      perceivedEffort: currentPreset.type === 'weak_point_strength' ? 8 : 4,
      addedVolumeMuscles: currentPreset.addedVolumeMuscles,
      notes: `Adaptive bonus: ${currentPreset.intensityDescription}`,
    };

    onSaveBonusSession(bonusLog);
    setIsSessionComplete(true);
    sounds.playVictoryFanfare();
    confetti({ particleCount: 75, spread: 60, origin: { y: 0.6 } });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl p-6 text-zinc-100 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>Adaptive +1 Bonus Workout</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-mono">
                  Week {weekNumber}
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Self-adjusting bonus session designed to adapt to your weekly schedule & recovery state.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* If session just completed */}
        {isSessionComplete ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-white">Bonus Workout Logged!</h3>
            <p className="text-sm text-zinc-300 max-w-md mx-auto">
              Your weekly muscle volume targets have been updated with this session's working sets.
              Excellent autoregulation!
            </p>
            <div className="pt-4 flex justify-center">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold transition"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        ) : !activePresetKey ? (
          /* Step 1: Readiness Questionnaire */
          <div className="mt-5 space-y-6">
            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
                <Sliders className="w-4 h-4 text-teal-400" />
                <span>30-Second Autoregulation Check-In</span>
              </div>

              {/* Slider 1: Muscle Soreness */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400 font-medium">Muscular Soreness (DOMS)</span>
                  <span className="font-mono font-bold text-amber-400">
                    {soreness === 1 && '1 (Completely Fresh)'}
                    {soreness === 2 && '2 (Mild Sensation)'}
                    {soreness === 3 && '3 (Moderate Soreness)'}
                    {soreness === 4 && '4 (Noticeably Stiff)'}
                    {soreness === 5 && '5 (Severe Muscle DOMS)'}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={soreness}
                  onChange={(e) => setSoreness(Number(e.target.value))}
                  className="w-full accent-teal-400 h-2 bg-zinc-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Slider 2: Energy & Sleep */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400 font-medium">Energy & Central Readiness</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {energy === 1 && '1 (Drained / Low Sleep)'}
                    {energy === 2 && '2 (Sluggish)'}
                    {energy === 3 && '3 (Baseline Normal)'}
                    {energy === 4 && '4 (High Energy)'}
                    {energy === 5 && '5 (Explosive Peak)'}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={energy}
                  onChange={(e) => setEnergy(Number(e.target.value))}
                  className="w-full accent-emerald-400 h-2 bg-zinc-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Time Available Pill Buttons */}
              <div className="space-y-1.5">
                <span className="text-xs text-zinc-400 font-medium block">Time Available Today:</span>
                <div className="grid grid-cols-3 gap-2">
                  {[20, 30, 45].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTimeAvailable(t as any)}
                      className={`py-2 rounded-xl text-xs font-semibold border transition ${
                        timeAvailable === t
                          ? 'bg-teal-500/20 text-teal-300 border-teal-500/50'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800'
                      }`}
                    >
                      {t} Minutes
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Smart Recommendation Banner */}
            <div className="bg-gradient-to-r from-teal-950/60 to-emerald-950/60 border border-teal-500/40 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-teal-500/30 text-teal-300 border border-teal-400/30">
                    Recommended For You
                  </span>
                </div>
                <span className="text-xs text-zinc-400 font-mono flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {currentPreset.durationMinutes} mins
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white">{currentPreset.title}</h3>
                <p className="text-xs text-teal-300 font-medium mt-0.5">{currentPreset.intensityDescription}</p>
                <p className="text-xs text-zinc-300 mt-2 leading-relaxed">
                  {currentPreset.recommendedWhen}
                </p>
              </div>

              {/* Added Volume Pill */}
              <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="text-zinc-400 text-[11px]">Adds to Weekly Targets:</span>
                {currentPreset.addedVolumeMuscles.map((v, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-md bg-zinc-800 text-emerald-300 font-mono text-[11px] border border-zinc-700"
                  >
                    +{v.sets} sets {v.muscle}
                  </span>
                ))}
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  onClick={() => handleStartPreset(recommendedKey)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-zinc-950 font-bold text-sm shadow-md transition active:scale-95"
                >
                  <Play className="w-4 h-4 fill-zinc-950" />
                  <span>Start Recommended Session</span>
                </button>
              </div>
            </div>

            {/* Alternative Presets Selector */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
                Or Choose Any Alternate Routine:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {Object.entries(ADAPTIVE_BONUS_PRESETS).map(([key, opt]) => (
                  <button
                    key={key}
                    onClick={() => handleStartPreset(key)}
                    className="text-left p-3 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 transition space-y-1.5"
                  >
                    <div className="flex items-center gap-2">
                      {opt.type === 'yoga' && <HeartHandshake className="w-4 h-4 text-purple-400" />}
                      {opt.type === 'cardio' && <HeartPulse className="w-4 h-4 text-red-400" />}
                      {opt.type === 'weak_point_strength' && <Dumbbell className="w-4 h-4 text-amber-400" />}
                      <span className="text-xs font-bold text-zinc-200 truncate">{opt.title}</span>
                    </div>
                    <div className="text-[11px] text-zinc-400">{opt.durationMinutes} min • {opt.targetFocus}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Step 2: Active Guided Bonus Session Runner */
          <div className="mt-5 space-y-5">
            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-teal-400 font-semibold uppercase tracking-wider">
                  Step {activeStepIndex + 1} of {currentPreset.steps.length}
                </span>
                <h3 className="text-base font-bold text-white">
                  {currentPreset.steps[activeStepIndex].name}
                </h3>
              </div>
              {currentPreset.steps[activeStepIndex].reps && (
                <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 font-mono text-xs font-bold border border-amber-500/20">
                  {currentPreset.steps[activeStepIndex].reps}
                </span>
              )}
            </div>

            {/* Instruction box */}
            <div className="bg-zinc-800/60 p-4 rounded-xl border border-zinc-700/60 text-sm leading-relaxed text-zinc-200">
              {currentPreset.steps[activeStepIndex].instructions}
            </div>

            {/* Timer if duration-based */}
            {currentPreset.steps[activeStepIndex].durationSeconds && (
              <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-800 text-center space-y-3">
                <div className="text-4xl font-black font-mono text-teal-400">
                  {Math.floor(stepTimerSeconds / 60)}:
                  {stepTimerSeconds % 60 < 10 ? '0' : ''}
                  {stepTimerSeconds % 60}
                </div>
                <div className="flex justify-center gap-2">
                  <button
                    onClick={() => setTimerRunning(!timerRunning)}
                    className="px-4 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold text-xs transition"
                  >
                    {timerRunning ? 'Pause Timer' : 'Start Timer'}
                  </button>
                  <button
                    onClick={() => {
                      setStepTimerSeconds(currentPreset.steps[activeStepIndex].durationSeconds || 120);
                      setTimerRunning(false);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition"
                  >
                    Reset
                  </button>
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="pt-2 flex justify-between gap-3">
              <button
                onClick={() => setActivePresetKey(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition"
              >
                Back to Selection
              </button>
              <button
                onClick={handleNextStep}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-zinc-950 font-bold text-sm transition"
              >
                <span>
                  {activeStepIndex + 1 === currentPreset.steps.length
                    ? 'Finish & Log Volume'
                    : 'Next Step'}
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
