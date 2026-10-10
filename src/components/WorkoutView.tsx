import React, { useState, useEffect } from 'react';
import {
  DayWorkoutTemplate,
  ExerciseDefinition,
  LoggedExercise,
  LoggedSet,
  UserFitnessProfile,
  CompletedWorkoutSession,
  WeightUnit,
} from '../types/workout';
import { PROGRAM_WEEKS } from '../data/programData';
import { WarmupPyramidModal } from './WarmupPyramidModal';
import { RestTimer } from './RestTimer';
import { generateSmartTarget, formatWeight, calculateWarmupPyramid } from '../utils/progression';
import { sounds } from '../utils/audio';
import confetti from 'canvas-confetti';
import {
  Dumbbell,
  Check,
  RotateCcw,
  Sparkles,
  Flame,
  Info,
  Layers,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
  Smartphone,
  Maximize2,
  Table,
  Plus,
  Minus,
  ChevronLeft,
  ChevronRight,
  Calculator,
  ArrowRightLeft,
} from 'lucide-react';

interface WorkoutViewProps {
  profile: UserFitnessProfile;
  selectedWeek: number;
  onFinishWorkout: (session: CompletedWorkoutSession) => void;
  onOpenRirGuide: () => void;
}

export type MobileLayoutMode = 'stepper' | 'focus' | 'table';

export const WorkoutView: React.FC<WorkoutViewProps> = ({
  profile,
  selectedWeek,
  onFinishWorkout,
  onOpenRirGuide,
}) => {
  const currentWeekPlan = PROGRAM_WEEKS.find((w) => w.weekNumber === selectedWeek) || PROGRAM_WEEKS[0];
  const [selectedDayType, setSelectedDayType] = useState<'Full Body A' | 'Full Body B'>('Full Body A');

  const activeTemplate: DayWorkoutTemplate =
    selectedDayType === 'Full Body A' ? currentWeekPlan.workouts.dayA : currentWeekPlan.workouts.dayB;

  // Mobile layout mode: 'stepper' (Touch cards & steppers), 'focus' (One exercise at a time), 'table' (Compact matrix)
  const [layoutMode, setLayoutMode] = useState<MobileLayoutMode>('stepper');
  const [focusExerciseIndex, setFocusExerciseIndex] = useState<number>(0);

  // Active workout state
  const [exerciseLogs, setExerciseLogs] = useState<Record<string, LoggedExercise>>({});
  // Base working weight map per exercise for auto-calculating warm-ups
  const [baseWorkingWeights, setBaseWorkingWeights] = useState<Record<string, number>>({});
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});

  // Warmup pyramid modal state
  const [warmupModalExercise, setWarmupModalExercise] = useState<{
    name: string;
    weight: number;
    warmupCount: number;
  } | null>(null);

  // Active Rest Timer state
  const [restTimerSeconds, setRestTimerSeconds] = useState<number>(120);
  const [isRestTimerActive, setIsRestTimerActive] = useState<boolean>(false);
  const [restExerciseName, setRestExerciseName] = useState<string>('');

  // Check if this workout is already completed in history
  const existingCompletedSession = profile.completedWorkouts.find(
    (w) => w.weekNumber === selectedWeek && w.dayType === selectedDayType
  );

  // Helper to determine if an exercise is dumbbell-based
  const checkIsDumbbell = (name: string) => {
    const n = name.toLowerCase();
    return n.includes('db') || n.includes('dumbbell');
  };

  // Helper to get step size for an exercise:
  // Dumbbells in kg: 2kg increments (as requested by user!)
  // Dumbbells in lbs: 5 lbs
  // Barbell/Machine in kg: 2.5kg
  // Barbell/Machine in lbs: 5 lbs
  const getWeightStep = (isDumbbell: boolean) => {
    if (profile.weightUnit === 'kg') {
      return isDumbbell ? 2 : 2.5;
    }
    return 5;
  };

  // Round weight to gym increments (multiples of 2kg for dumbbells, 2.5kg for barbells/machines)
  const roundGymWeight = (val: number, isDumbbell: boolean) => {
    const step = getWeightStep(isDumbbell);
    return Math.max(0, Math.round(val / step) * step);
  };

  // Helper to auto-calculate warm-up sets based on working weight
  const computeWarmupSetsForWeight = (
    ex: ExerciseDefinition,
    workingWeight: number
  ): LoggedSet[] => {
    if (ex.warmupSetsCount <= 0 || workingWeight <= 0) return [];
    const isDb = checkIsDumbbell(ex.name);
    const pyramid = calculateWarmupPyramid(workingWeight, ex.warmupSetsCount);

    return pyramid.map((item, idx) => ({
      id: `${ex.id}-w${idx + 1}`,
      setNumber: idx + 1,
      isWarmup: true,
      weight: roundGymWeight(item.suggestedWeight, isDb),
      reps: idx === 0 ? 8 : idx === 1 ? 5 : 3,
      rpe: idx === 0 ? 5 : idx === 1 ? 6.5 : 7.5,
      rir: idx === 0 ? 5 : idx === 1 ? 3 : 2,
      completed: false,
    }));
  };

  // Initialize exercise logs & auto-calculate working + warm-up weights
  useEffect(() => {
    if (existingCompletedSession) {
      const initialLogs: Record<string, LoggedExercise> = {};
      const initialBaseWeights: Record<string, number> = {};
      existingCompletedSession.exercises.forEach((ex) => {
        initialLogs[ex.exerciseId] = ex;
        const firstWorking = ex.sets.find((s) => !s.isWarmup && s.weight > 0);
        if (firstWorking) {
          initialBaseWeights[ex.exerciseId] = firstWorking.weight;
        }
      });
      setExerciseLogs(initialLogs);
      setBaseWorkingWeights(initialBaseWeights);
      return;
    }

    const initialLogs: Record<string, LoggedExercise> = {};
    const initialBaseWeights: Record<string, number> = {};

    activeTemplate.exercises.forEach((ex) => {
      const targetKey = `${selectedWeek}_${ex.id}`;
      const userTarget = profile.weeklyTargets[targetKey];
      const smartTarget = generateSmartTarget(ex, selectedWeek, profile.completedWorkouts, profile.weightUnit);

      const isDb = checkIsDumbbell(ex.name);
      const rawWeight = userTarget?.targetWeight || smartTarget.suggestedWeight;
      const workingWeight = roundGymWeight(rawWeight, isDb);
      initialBaseWeights[ex.id] = workingWeight;

      const warmupSets = computeWarmupSetsForWeight(ex, workingWeight);

      const workingSets: LoggedSet[] = Array.from({ length: ex.workingSetsCount }, (_, idx) => ({
        id: `${ex.id}-s${idx + 1}`,
        setNumber: idx + 1,
        isWarmup: false,
        weight: workingWeight,
        reps: userTarget?.targetRepsMin || smartTarget.suggestedRepsMin,
        rpe: userTarget?.targetRpe || smartTarget.targetRpe,
        rir: ex.targetRir.includes('0') ? 0 : 1,
        completed: false,
        intensityTechniqueApplied: ex.lastSetTechnique,
      }));

      initialLogs[ex.id] = {
        exerciseId: ex.id,
        exerciseName: ex.name,
        sets: [...warmupSets, ...workingSets],
      };
    });

    setExerciseLogs(initialLogs);
    setBaseWorkingWeights(initialBaseWeights);
    setStartTime(Date.now());
    setFocusExerciseIndex(0);
  }, [selectedWeek, selectedDayType, existingCompletedSession]);

  // Handle changing base working weight for an exercise
  const handleBaseWeightChange = (exercise: ExerciseDefinition, newWeight: number) => {
    const isDb = checkIsDumbbell(exercise.name);
    const validWeight = Math.max(0, Math.round(newWeight * 10) / 10);
    setBaseWorkingWeights((prev) => ({ ...prev, [exercise.id]: validWeight }));

    setExerciseLogs((prev) => {
      const ex = prev[exercise.id];
      if (!ex) return prev;

      const newWarmups = computeWarmupSetsForWeight(exercise, validWeight);

      const updatedSets = ex.sets.map((s) => {
        if (s.isWarmup) {
          const match = newWarmups.find((nw) => nw.setNumber === s.setNumber);
          return match ? { ...s, weight: match.weight } : s;
        } else {
          return s.completed ? s : { ...s, weight: validWeight };
        }
      });

      return {
        ...prev,
        [exercise.id]: { ...ex, sets: updatedSets },
      };
    });
  };

  const handleUpdateSet = (exerciseId: string, setId: string, updates: Partial<LoggedSet>) => {
    setExerciseLogs((prev) => {
      const ex = prev[exerciseId];
      if (!ex) return prev;
      const updatedSets = ex.sets.map((s) => (s.id === setId ? { ...s, ...updates } : s));
      return {
        ...prev,
        [exerciseId]: { ...ex, sets: updatedSets },
      };
    });
  };

  const handleAdjustWeightStepper = (exerciseId: string, setId: string, currentWeight: number, delta: number) => {
    const updated = Math.max(0, Math.round((currentWeight + delta) * 10) / 10);
    handleUpdateSet(exerciseId, setId, { weight: updated });
  };

  const handleAdjustRepsStepper = (exerciseId: string, setId: string, currentReps: number, delta: number) => {
    const updated = Math.max(1, currentReps + delta);
    handleUpdateSet(exerciseId, setId, { reps: updated });
  };

  const handleToggleComplete = (exercise: ExerciseDefinition, set: LoggedSet) => {
    const newCompleted = !set.completed;
    handleUpdateSet(exercise.id, set.id, { completed: newCompleted });

    if (newCompleted) {
      sounds.playTick();
      setRestTimerSeconds(exercise.restTimeSeconds || 120);
      setRestExerciseName(exercise.name);
      setIsRestTimerActive(true);
    }
  };

  const handleSwapSubstitution = (exerciseId: string, newName: string) => {
    setExerciseLogs((prev) => {
      const ex = prev[exerciseId];
      if (!ex) return prev;
      return {
        ...prev,
        [exerciseId]: {
          ...ex,
          exerciseName: newName,
          chosenSubstitution: newName,
        },
      };
    });
  };

  const handleFinish = () => {
    const durationMins = Math.max(1, Math.round((Date.now() - startTime) / 60000));
    const session: CompletedWorkoutSession = {
      id: `w${selectedWeek}-${selectedDayType.replace(/\s+/g, '')}-${Date.now()}`,
      weekNumber: selectedWeek,
      dayType: selectedDayType,
      dateCompleted: new Date().toISOString(),
      durationMinutes: durationMins,
      exercises: Object.values(exerciseLogs),
      notes: `Week ${selectedWeek} ${selectedDayType} completed in ${durationMins} minutes.`,
    };

    onFinishWorkout(session);
    sounds.playVictoryFanfare();
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
  };

  const completedCount = Object.values(exerciseLogs).reduce(
    (acc, ex) => acc + ex.sets.filter((s) => !s.isWarmup && s.completed).length,
    0
  );
  const totalCount = activeTemplate.exercises.reduce((acc, ex) => acc + ex.workingSetsCount, 0);

  return (
    <div className="space-y-5 pb-24 max-w-full overflow-hidden">
      {/* Session Title & Day Switcher */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Week {selectedWeek} • {currentWeekPlan.blockTitle}
              </span>
              {currentWeekPlan.isDeload && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Deload
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white mt-1.5 flex items-center gap-2 flex-wrap">
              <span>{activeTemplate.title}</span>
              {existingCompletedSession && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Logged
                </span>
              )}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl leading-relaxed">
              {activeTemplate.description}
            </p>
          </div>

          {/* Toggle Full Body A vs Full Body B */}
          <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-2xl border border-zinc-800 self-stretch sm:self-center">
            <button
              onClick={() => {
                setSelectedDayType('Full Body A');
                setFocusExerciseIndex(0);
              }}
              className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition text-center ${
                selectedDayType === 'Full Body A'
                  ? 'bg-emerald-500 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Full Body A
            </button>
            <button
              onClick={() => {
                setSelectedDayType('Full Body B');
                setFocusExerciseIndex(0);
              }}
              className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition text-center ${
                selectedDayType === 'Full Body B'
                  ? 'bg-emerald-500 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Full Body B
            </button>
          </div>
        </div>

        {/* Mobile View Mode Switcher Options */}
        <div className="mt-4 pt-3 border-t border-zinc-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <span className="text-zinc-400 font-semibold uppercase tracking-wider text-[11px] flex items-center gap-1.5 shrink-0">
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Android Mode:</span>
            </span>
            <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 w-full sm:w-auto overflow-x-auto">
              <button
                onClick={() => setLayoutMode('stepper')}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg font-bold text-xs transition text-center whitespace-nowrap ${
                  layoutMode === 'stepper'
                    ? 'bg-emerald-500 text-zinc-950 shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Touch Steppers
              </button>

              <button
                onClick={() => setLayoutMode('focus')}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition whitespace-nowrap ${
                  layoutMode === 'focus'
                    ? 'bg-emerald-500 text-zinc-950 shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Maximize2 className="w-3 h-3" />
                <span>Focus Station</span>
              </button>

              <button
                onClick={() => setLayoutMode('table')}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition whitespace-nowrap ${
                  layoutMode === 'table'
                    ? 'bg-emerald-500 text-zinc-950 shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Table className="w-3 h-3" />
                <span>Table</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 text-zinc-400 pt-1 md:pt-0">
            <span>
              Done: <strong className="text-white font-mono">{completedCount}/{totalCount}</strong> sets
            </span>
            <span>•</span>
            <button
              onClick={onOpenRirGuide}
              className="text-emerald-400 hover:underline flex items-center gap-1 font-medium"
            >
              <Info className="w-3.5 h-3.5" />
              <span>RIR Scale</span>
            </button>
          </div>
        </div>
      </div>

      {/* Auto-Calculation Notification Banner */}
      <div className="px-3.5 py-2.5 rounded-2xl bg-zinc-900/90 border border-emerald-500/30 text-xs text-zinc-300 flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="leading-snug">
            <strong className="text-emerald-300 font-semibold">Automatic Calculations:</strong> Working weights and warmups (50%, 70%, 85%) are pre-set. Dumbbells use <strong>2kg increments</strong>.
          </span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODE 2: GYM FOCUS STATION (1 Exercise at a Time)
          ───────────────────────────────────────────────────────────── */}
      {layoutMode === 'focus' && (
        <div className="space-y-4">
          {/* Station Stepper Banner */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-2.5 flex items-center justify-between text-xs">
            <button
              disabled={focusExerciseIndex === 0}
              onClick={() => setFocusExerciseIndex((idx) => Math.max(0, idx - 1))}
              className={`flex items-center gap-1 px-3 py-2 rounded-xl font-bold transition min-h-[44px] ${
                focusExerciseIndex === 0
                  ? 'text-zinc-600 cursor-not-allowed'
                  : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700 active:scale-95'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Prev</span>
            </button>

            <span className="font-bold text-zinc-300 font-mono text-xs sm:text-sm text-center">
              Station {focusExerciseIndex + 1} of {activeTemplate.exercises.length}
            </span>

            <button
              disabled={focusExerciseIndex >= activeTemplate.exercises.length - 1}
              onClick={() =>
                setFocusExerciseIndex((idx) =>
                  Math.min(activeTemplate.exercises.length - 1, idx + 1)
                )
              }
              className={`flex items-center gap-1 px-3 py-2 rounded-xl font-bold transition min-h-[44px] ${
                focusExerciseIndex >= activeTemplate.exercises.length - 1
                  ? 'text-zinc-600 cursor-not-allowed'
                  : 'bg-emerald-500 text-zinc-950 hover:bg-emerald-400 active:scale-95'
              }`}
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Active Single Exercise Display */}
          {(() => {
            const exercise = activeTemplate.exercises[focusExerciseIndex];
            const loggedEx = exerciseLogs[exercise.id] || {
              exerciseId: exercise.id,
              exerciseName: exercise.name,
              sets: [],
            };
            const isDb = checkIsDumbbell(exercise.name);
            const stepDelta = getWeightStep(isDb);
            const currentBase = baseWorkingWeights[exercise.id] || 0;
            const isNotesOpen = expandedNotes[exercise.id] || false;

            return (
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-4">
                {/* Header */}
                <div className="space-y-2.5 pb-3 border-b border-zinc-800">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                        {focusExerciseIndex + 1}
                      </span>
                      <h2 className="text-lg sm:text-xl font-black text-white leading-tight">
                        {loggedEx.exerciseName}
                      </h2>
                    </div>

                    <button
                      onClick={() =>
                        setExpandedNotes((prev) => ({
                          ...prev,
                          [exercise.id]: !prev[exercise.id],
                        }))
                      }
                      className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition shrink-0"
                      title="Form cues"
                    >
                      {isNotesOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Target details */}
                  <div className="flex items-center flex-wrap gap-2 text-xs text-zinc-400">
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                      Reps: <strong className="text-white">{exercise.repRange}</strong>
                    </span>
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-amber-300 font-mono">
                      Target: {exercise.targetRpe} RPE ({exercise.targetRir} RIR)
                    </span>
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {exercise.restTimeMinutes}m rest
                    </span>
                    {isDb && (
                      <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[10px]">
                        2kg Dumbbell Step
                      </span>
                    )}
                  </div>

                  {/* Substitutions Dropdown */}
                  <div className="pt-1">
                    <select
                      value={loggedEx.exerciseName}
                      onChange={(e) => handleSwapSubstitution(exercise.id, e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-300 focus:outline-none cursor-pointer"
                    >
                      <option value={exercise.name}>Original: {exercise.name}</option>
                      <option value={exercise.substitution1}>Sub 1: {exercise.substitution1}</option>
                      <option value={exercise.substitution2}>Sub 2: {exercise.substitution2}</option>
                    </select>
                  </div>
                </div>

                {/* Form Cues if expanded */}
                {isNotesOpen && (
                  <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 space-y-1.5 leading-relaxed">
                    <div className="font-bold text-emerald-400">Master Technique Cues:</div>
                    <p>{exercise.coachingNotes}</p>
                    {exercise.techniqueNote && (
                      <p className="text-amber-400 font-medium pt-1">
                        ⚠️ Protocol: {exercise.techniqueNote}
                      </p>
                    )}
                  </div>
                )}

                {/* Base Working Weight Master Input with Instant Warmup Recalculator */}
                <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                      <Calculator className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Target Working Weight:</span>
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      Step: ±{stepDelta} {profile.weightUnit}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleBaseWeightChange(exercise, currentBase - stepDelta)}
                      className="min-h-[44px] min-w-[48px] rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-sm flex items-center justify-center transition active:scale-95 shrink-0"
                    >
                      -{stepDelta}
                    </button>

                    <div className="flex-1 flex items-center justify-center bg-zinc-900 min-h-[44px] px-3 rounded-xl border border-zinc-700 font-mono font-black text-emerald-400 text-lg">
                      <input
                        type="number"
                        step={stepDelta}
                        value={currentBase || ''}
                        onChange={(e) =>
                          handleBaseWeightChange(exercise, parseFloat(e.target.value) || 0)
                        }
                        className="w-20 bg-transparent text-center focus:outline-none"
                      />
                      <span className="text-xs text-zinc-400 font-mono ml-1">{profile.weightUnit}</span>
                    </div>

                    <button
                      onClick={() => handleBaseWeightChange(exercise, currentBase + stepDelta)}
                      className="min-h-[44px] min-w-[48px] rounded-xl bg-zinc-800 hover:bg-zinc-700 text-emerald-400 font-bold text-sm flex items-center justify-center transition active:scale-95 shrink-0"
                    >
                      +{stepDelta}
                    </button>
                  </div>
                </div>

                {/* Set Cards in Focus Mode */}
                <div className="space-y-3">
                  {loggedEx.sets.map((set) => (
                    <div
                      key={set.id}
                      className={`p-3.5 rounded-2xl border transition space-y-3 ${
                        set.completed
                          ? 'bg-emerald-500/10 border-emerald-500/40'
                          : set.isWarmup
                          ? 'bg-zinc-950/70 border-zinc-800/80'
                          : 'bg-zinc-950 border-zinc-800'
                      }`}
                    >
                      {/* Top row of card */}
                      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-zinc-900">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                              set.isWarmup
                                ? 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            {set.isWarmup ? `Warm-Up ${set.setNumber}` : `Working Set ${set.setNumber}`}
                          </span>
                          {set.intensityTechniqueApplied && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300">
                              {set.intensityTechniqueApplied}
                            </span>
                          )}
                        </div>

                        {/* Complete button */}
                        <button
                          onClick={() => handleToggleComplete(exercise, set)}
                          className={`min-h-[44px] px-4 rounded-xl font-black text-xs flex items-center gap-1.5 transition active:scale-95 shrink-0 ${
                            set.completed
                              ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                              : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700 border border-zinc-700'
                          }`}
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>{set.completed ? 'Done' : 'Mark Done'}</span>
                        </button>
                      </div>

                      {/* Weight Stepper Row */}
                      <div className="space-y-1">
                        <span className="text-[11px] font-medium text-zinc-400 flex justify-between">
                          <span>Weight ({profile.weightUnit})</span>
                          {set.isWarmup && (
                            <span className="text-amber-400 text-[10px]">
                              Auto Warmup ({set.setNumber === 1 ? '50%' : set.setNumber === 2 ? '70%' : '85%'})
                            </span>
                          )}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() =>
                              handleAdjustWeightStepper(exercise.id, set.id, set.weight, -stepDelta)
                            }
                            className="min-h-[44px] w-12 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-200 font-bold text-sm flex items-center justify-center transition active:scale-95 shrink-0"
                          >
                            -{stepDelta}
                          </button>
                          <input
                            type="number"
                            step={stepDelta}
                            value={set.weight || ''}
                            onChange={(e) =>
                              handleUpdateSet(exercise.id, set.id, {
                                weight: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="flex-1 min-w-0 min-h-[44px] bg-zinc-900 border border-zinc-700 rounded-xl text-center font-mono font-black text-white text-base focus:border-emerald-400 focus:outline-none"
                          />
                          <button
                            onClick={() =>
                              handleAdjustWeightStepper(exercise.id, set.id, set.weight, stepDelta)
                            }
                            className="min-h-[44px] w-12 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-emerald-400 font-bold text-sm flex items-center justify-center transition active:scale-95 shrink-0"
                          >
                            +{stepDelta}
                          </button>
                        </div>
                      </div>

                      {/* Reps Stepper Row */}
                      <div className="space-y-1">
                        <span className="text-[11px] font-medium text-zinc-400">Reps Completed</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleAdjustRepsStepper(exercise.id, set.id, set.reps, -1)}
                            className="min-h-[44px] w-12 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-200 font-bold text-base flex items-center justify-center transition active:scale-95 shrink-0"
                          >
                            -1
                          </button>
                          <input
                            type="number"
                            value={set.reps || ''}
                            onChange={(e) =>
                              handleUpdateSet(exercise.id, set.id, {
                                reps: parseInt(e.target.value, 10) || 0,
                              })
                            }
                            className="flex-1 min-w-0 min-h-[44px] bg-zinc-900 border border-zinc-700 rounded-xl text-center font-mono font-black text-white text-base focus:border-emerald-400 focus:outline-none"
                          />
                          <button
                            onClick={() => handleAdjustRepsStepper(exercise.id, set.id, set.reps, 1)}
                            className="min-h-[44px] w-12 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-emerald-400 font-bold text-base flex items-center justify-center transition active:scale-95 shrink-0"
                          >
                            +1
                          </button>
                        </div>
                      </div>

                      {/* Effort Selector */}
                      <div className="pt-2 border-t border-zinc-900 flex items-center justify-between text-xs">
                        <span className="text-zinc-400 text-[11px]">RPE Rating:</span>
                        <select
                          value={set.rpe}
                          onChange={(e) => {
                            const newRpe = parseFloat(e.target.value);
                            const derivedRir = Math.max(0, 10 - newRpe);
                            handleUpdateSet(exercise.id, set.id, {
                              rpe: newRpe,
                              rir: derivedRir,
                            });
                          }}
                          className="bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-700 text-amber-300 font-mono text-xs focus:outline-none cursor-pointer max-w-[200px]"
                        >
                          <option value="10">RPE 10 (0 RIR)</option>
                          <option value="9.5">RPE 9.5</option>
                          <option value="9">RPE 9 (1 RIR)</option>
                          <option value="8.5">RPE 8.5</option>
                          <option value="8">RPE 8 (2 RIR)</option>
                          <option value="7">RPE 7 (3 RIR)</option>
                          <option value="6">RPE 6 (Warmup)</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODE 1: TOUCH STEPPERS & CARDS (Default Mobile Mode)
          ───────────────────────────────────────────────────────────── */}
      {layoutMode === 'stepper' && (
        <div className="space-y-4">
          {activeTemplate.exercises.map((exercise, exIndex) => {
            const loggedEx = exerciseLogs[exercise.id] || {
              exerciseId: exercise.id,
              exerciseName: exercise.name,
              sets: [],
            };
            const isDb = checkIsDumbbell(exercise.name);
            const stepDelta = getWeightStep(isDb);
            const currentBase = baseWorkingWeights[exercise.id] || 0;
            const isNotesOpen = expandedNotes[exercise.id] || false;

            return (
              <div
                key={exercise.id}
                className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-lg space-y-3.5"
              >
                {/* Exercise Header */}
                <div className="space-y-2 pb-2.5 border-b border-zinc-800">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-zinc-800 text-zinc-300 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                        {exIndex + 1}
                      </span>
                      <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                        {loggedEx.exerciseName}
                      </h3>
                    </div>

                    <button
                      onClick={() =>
                        setExpandedNotes((prev) => ({
                          ...prev,
                          [exercise.id]: !prev[exercise.id],
                        }))
                      }
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition shrink-0"
                      title="Form cues"
                    >
                      {isNotesOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="flex items-center flex-wrap gap-2 text-xs text-zinc-400">
                    <span className="px-2 py-0.5 rounded bg-zinc-950 text-zinc-300">
                      Reps: <strong className="text-white">{exercise.repRange}</strong>
                    </span>
                    <span className="px-2 py-0.5 rounded bg-zinc-950 text-amber-300 font-mono">
                      {exercise.targetRpe} RPE ({exercise.targetRir} RIR)
                    </span>
                    <span className="px-2 py-0.5 rounded bg-zinc-950 text-zinc-300">
                      {exercise.restTimeMinutes}m rest
                    </span>
                    {isDb && (
                      <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[10px]">
                        ±2kg step
                      </span>
                    )}
                  </div>

                  {/* Substitution Dropdown */}
                  <div className="pt-0.5">
                    <select
                      value={loggedEx.exerciseName}
                      onChange={(e) => handleSwapSubstitution(exercise.id, e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-300 focus:outline-none cursor-pointer"
                    >
                      <option value={exercise.name}>Original: {exercise.name}</option>
                      <option value={exercise.substitution1}>Sub 1: {exercise.substitution1}</option>
                      <option value={exercise.substitution2}>Sub 2: {exercise.substitution2}</option>
                    </select>
                  </div>
                </div>

                {/* Form cues if open */}
                {isNotesOpen && (
                  <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 space-y-1">
                    <div className="font-semibold text-emerald-400">Master Technique Cues:</div>
                    <p>{exercise.coachingNotes}</p>
                    {exercise.techniqueNote && (
                      <p className="text-amber-400 font-medium pt-1">⚠️ {exercise.techniqueNote}</p>
                    )}
                  </div>
                )}

                {/* Base Working Weight Master Bar for Auto-Recalculation */}
                <div className="p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-zinc-300 shrink-0">
                    <Calculator className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Working Load:</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleBaseWeightChange(exercise, currentBase - stepDelta)}
                      className="min-h-[40px] w-9 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center justify-center transition active:scale-95 shrink-0"
                    >
                      -{stepDelta}
                    </button>
                    <div className="flex items-center bg-zinc-900 px-2.5 min-h-[40px] rounded-lg border border-zinc-700 font-mono font-bold text-emerald-400">
                      <input
                        type="number"
                        step={stepDelta}
                        value={currentBase || ''}
                        onChange={(e) =>
                          handleBaseWeightChange(exercise, parseFloat(e.target.value) || 0)
                        }
                        className="w-12 bg-transparent text-center focus:outline-none text-sm"
                      />
                      <span className="text-[10px] text-zinc-400 ml-0.5">{profile.weightUnit}</span>
                    </div>
                    <button
                      onClick={() => handleBaseWeightChange(exercise, currentBase + stepDelta)}
                      className="min-h-[40px] w-9 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-emerald-400 font-bold text-xs flex items-center justify-center transition active:scale-95 shrink-0"
                    >
                      +{stepDelta}
                    </button>
                  </div>
                </div>

                {/* Touch Stepper Set Cards */}
                <div className="space-y-2.5">
                  {loggedEx.sets.map((set) => (
                    <div
                      key={set.id}
                      className={`p-3 rounded-2xl border transition space-y-2.5 ${
                        set.completed
                          ? 'bg-emerald-500/10 border-emerald-500/40'
                          : set.isWarmup
                          ? 'bg-zinc-950/60 border-zinc-800/80'
                          : 'bg-zinc-950 border-zinc-800'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 pb-2 border-b border-zinc-900">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                            set.isWarmup
                              ? 'bg-zinc-800 text-zinc-400'
                              : 'bg-emerald-500/20 text-emerald-400'
                          }`}
                        >
                          {set.isWarmup ? `Warmup ${set.setNumber}` : `Set ${set.setNumber}`}
                        </span>

                        <button
                          onClick={() => handleToggleComplete(exercise, set)}
                          className={`min-h-[44px] px-4 rounded-xl font-black text-xs flex items-center gap-1.5 transition active:scale-95 shrink-0 ${
                            set.completed
                              ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                              : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700'
                          }`}
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>{set.completed ? 'Done' : 'Check'}</span>
                        </button>
                      </div>

                      {/* Weight Stepper Row */}
                      <div className="space-y-1">
                        <span className="text-[10px] text-zinc-400 font-medium block">
                          Weight ({profile.weightUnit})
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() =>
                              handleAdjustWeightStepper(exercise.id, set.id, set.weight, -stepDelta)
                            }
                            className="min-h-[44px] w-12 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 font-bold text-xs flex items-center justify-center active:scale-95 shrink-0"
                          >
                            -{stepDelta}
                          </button>
                          <input
                            type="number"
                            step={stepDelta}
                            value={set.weight || ''}
                            onChange={(e) =>
                              handleUpdateSet(exercise.id, set.id, {
                                weight: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="flex-1 min-w-0 min-h-[44px] bg-zinc-900 border border-zinc-700 rounded-xl text-center font-mono font-bold text-white text-base focus:outline-none"
                          />
                          <button
                            onClick={() =>
                              handleAdjustWeightStepper(exercise.id, set.id, set.weight, stepDelta)
                            }
                            className="min-h-[44px] w-12 rounded-xl bg-zinc-900 border border-zinc-800 text-emerald-400 font-bold text-xs flex items-center justify-center active:scale-95 shrink-0"
                          >
                            +{stepDelta}
                          </button>
                        </div>
                      </div>

                      {/* Reps Stepper Row */}
                      <div className="space-y-1">
                        <span className="text-[10px] text-zinc-400 font-medium block">Reps</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleAdjustRepsStepper(exercise.id, set.id, set.reps, -1)}
                            className="min-h-[44px] w-12 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 font-bold text-base flex items-center justify-center active:scale-95 shrink-0"
                          >
                            -1
                          </button>
                          <input
                            type="number"
                            value={set.reps || ''}
                            onChange={(e) =>
                              handleUpdateSet(exercise.id, set.id, {
                                reps: parseInt(e.target.value, 10) || 0,
                              })
                            }
                            className="flex-1 min-w-0 min-h-[44px] bg-zinc-900 border border-zinc-700 rounded-xl text-center font-mono font-bold text-white text-base focus:outline-none"
                          />
                          <button
                            onClick={() => handleAdjustRepsStepper(exercise.id, set.id, set.reps, 1)}
                            className="min-h-[44px] w-12 rounded-xl bg-zinc-900 border border-zinc-800 text-emerald-400 font-bold text-base flex items-center justify-center active:scale-95 shrink-0"
                          >
                            +1
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODE 3: COMPACT TABLE MATRIX
          ───────────────────────────────────────────────────────────── */}
      {layoutMode === 'table' && (
        <div className="space-y-4">
          {activeTemplate.exercises.map((exercise, exIndex) => {
            const loggedEx = exerciseLogs[exercise.id] || {
              exerciseId: exercise.id,
              exerciseName: exercise.name,
              sets: [],
            };
            const isDb = checkIsDumbbell(exercise.name);
            const stepDelta = getWeightStep(isDb);
            const currentBase = baseWorkingWeights[exercise.id] || 0;

            return (
              <div
                key={exercise.id}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 sm:p-4 shadow-md space-y-3"
              >
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-zinc-800">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-xs text-zinc-500 font-bold shrink-0">#{exIndex + 1}</span>
                    <h4 className="font-bold text-sm text-white truncate">{loggedEx.exerciseName}</h4>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 text-xs">
                    <button
                      onClick={() => handleBaseWeightChange(exercise, currentBase - stepDelta)}
                      className="px-2 py-1 rounded bg-zinc-800 text-zinc-300 font-bold text-[11px]"
                    >
                      -{stepDelta}
                    </button>
                    <span className="font-mono font-bold text-emerald-400 text-xs">
                      {currentBase} {profile.weightUnit}
                    </span>
                    <button
                      onClick={() => handleBaseWeightChange(exercise, currentBase + stepDelta)}
                      className="px-2 py-1 rounded bg-zinc-800 text-emerald-400 font-bold text-[11px]"
                    >
                      +{stepDelta}
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto -mx-1 px-1">
                  <table className="w-full text-left text-xs font-mono min-w-[280px]">
                    <thead>
                      <tr className="text-[10px] text-zinc-400 uppercase border-b border-zinc-800">
                        <th className="py-1 px-1 w-12">Set</th>
                        <th className="py-1 px-1">Load</th>
                        <th className="py-1 px-1">Reps</th>
                        <th className="py-1 px-1">RPE</th>
                        <th className="py-1 px-1 text-right">Done</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/80">
                      {loggedEx.sets.map((set) => (
                        <tr key={set.id} className={set.completed ? 'bg-emerald-500/10' : ''}>
                          <td className="py-2.5 px-1 font-bold text-zinc-300">
                            {set.isWarmup ? `W${set.setNumber}` : `S${set.setNumber}`}
                          </td>
                          <td className="py-2.5 px-1">
                            <input
                              type="number"
                              step={stepDelta}
                              value={set.weight || ''}
                              onChange={(e) =>
                                handleUpdateSet(exercise.id, set.id, {
                                  weight: parseFloat(e.target.value) || 0,
                                })
                              }
                              className="w-16 min-h-[36px] px-2 rounded-lg bg-zinc-950 border border-zinc-700 text-white font-bold text-center"
                            />
                          </td>
                          <td className="py-2.5 px-1">
                            <input
                              type="number"
                              value={set.reps || ''}
                              onChange={(e) =>
                                handleUpdateSet(exercise.id, set.id, {
                                  reps: parseInt(e.target.value, 10) || 0,
                                })
                              }
                              className="w-12 min-h-[36px] px-2 rounded-lg bg-zinc-950 border border-zinc-700 text-white font-bold text-center"
                            />
                          </td>
                          <td className="py-2.5 px-1 text-amber-300 font-bold">{set.rpe}</td>
                          <td className="py-2.5 px-1 text-right">
                            <button
                              onClick={() => handleToggleComplete(exercise, set)}
                              className={`min-h-[38px] px-3 rounded-lg font-bold transition active:scale-95 ${
                                set.completed ? 'bg-emerald-500 text-zinc-950' : 'bg-zinc-800 text-zinc-400'
                              }`}
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sticky Bottom Bar on Mobile */}
      <div className="fixed bottom-0 inset-x-0 z-30 bg-zinc-950/95 border-t border-zinc-800 p-3 sm:p-4 backdrop-blur-md shadow-2xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div>
            <div className="font-bold text-white text-xs sm:text-sm">
              Session: {completedCount} / {totalCount} working sets
            </div>
            <div className="text-[11px] text-zinc-400">
              {completedCount === totalCount ? 'All working sets complete!' : 'Tap checkmark to log set'}
            </div>
          </div>

          <button
            onClick={handleFinish}
            disabled={completedCount === 0}
            className={`min-h-[48px] px-5 sm:px-6 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-xl ${
              completedCount > 0
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 active:scale-95'
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
            }`}
          >
            <Sparkles className="w-4 h-4 fill-current" />
            <span>Finish & Claim XP</span>
          </button>
        </div>
      </div>

      {/* Floating Rest Timer */}
      <RestTimer
        initialSeconds={restTimerSeconds}
        isActive={isRestTimerActive}
        onClose={() => setIsRestTimerActive(false)}
        exerciseName={restExerciseName}
      />

      {/* Warmup Pyramid Modal */}
      {warmupModalExercise && (
        <WarmupPyramidModal
          isOpen={!!warmupModalExercise}
          onClose={() => setWarmupModalExercise(null)}
          exerciseName={warmupModalExercise.name}
          workingWeight={warmupModalExercise.weight}
          warmupSetsCount={warmupModalExercise.warmupCount}
          unit={profile.weightUnit}
        />
      )}
    </div>
  );
};
