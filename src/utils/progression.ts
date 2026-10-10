import {
  CompletedWorkoutSession,
  BonusSessionLog,
  ExerciseDefinition,
  MuscleGroup,
  WeightUnit,
} from '../types/workout';

// Epley Formula for 1RM estimate
export function calculate1RM(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return weight;
  // Epley formula: 1RM = weight * (1 + reps / 30)
  const est = weight * (1 + reps / 30);
  return Math.round(est * 10) / 10;
}

// Convert weight between kg and lbs
export function convertWeight(val: number, from: WeightUnit, to: WeightUnit): number {
  if (from === to) return val;
  if (to === 'lbs') {
    return Math.round(val * 2.20462 * 2) / 2; // nearest 0.5 lb
  }
  return Math.round((val / 2.20462) * 2) / 2; // nearest 0.5 kg
}

// Format weight display with unit
export function formatWeight(val: number, unit: WeightUnit): string {
  return `${val.toLocaleString()} ${unit}`;
}

// Calculate warm-up pyramid based on evidence-based hypertrophy protocols:
// 1 set: ~60% of planned working weight for 6-10 reps
// 2 sets: Set 1 = ~50% for 6-10 reps; Set 2 = ~70% for 4-6 reps
// 3 sets: Set 1 = ~45% for 6-10 reps; Set 2 = ~65% for 4-6 reps; Set 3 = ~85% for 3-4 reps
// 4 sets: Set 1 = ~45% (6-10), Set 2 = ~60% (4-6), Set 3 = ~75% (3-5), Set 4 = ~85% (2-4)
export interface WarmupSetGuide {
  setNumber: number;
  percentage: number;
  suggestedWeight: number;
  suggestedReps: string;
}

export function calculateWarmupPyramid(workingWeight: number, warmupSetsCount: number): WarmupSetGuide[] {
  if (!workingWeight || workingWeight <= 0) return [];
  const rounded = (pct: number) => Math.round((workingWeight * pct) / 2.5) * 2.5;

  if (warmupSetsCount === 1) {
    return [
      {
        setNumber: 1,
        percentage: 60,
        suggestedWeight: rounded(0.6),
        suggestedReps: '6-10 reps (feel warm & loose)',
      },
    ];
  } else if (warmupSetsCount === 2) {
    return [
      {
        setNumber: 1,
        percentage: 50,
        suggestedWeight: rounded(0.5),
        suggestedReps: '6-10 reps',
      },
      {
        setNumber: 2,
        percentage: 70,
        suggestedWeight: rounded(0.7),
        suggestedReps: '4-6 reps',
      },
    ];
  } else if (warmupSetsCount === 3) {
    return [
      {
        setNumber: 1,
        percentage: 45,
        suggestedWeight: rounded(0.45),
        suggestedReps: '6-10 reps',
      },
      {
        setNumber: 2,
        percentage: 65,
        suggestedWeight: rounded(0.65),
        suggestedReps: '4-6 reps',
      },
      {
        setNumber: 3,
        percentage: 85,
        suggestedWeight: rounded(0.85),
        suggestedReps: '3-4 reps',
      },
    ];
  } else if (warmupSetsCount >= 4) {
    return [
      {
        setNumber: 1,
        percentage: 45,
        suggestedWeight: rounded(0.45),
        suggestedReps: '6-10 reps',
      },
      {
        setNumber: 2,
        percentage: 60,
        suggestedWeight: rounded(0.6),
        suggestedReps: '4-6 reps',
      },
      {
        setNumber: 3,
        percentage: 75,
        suggestedWeight: rounded(0.75),
        suggestedReps: '3-5 reps',
      },
      {
        setNumber: 4,
        percentage: 85,
        suggestedWeight: rounded(0.85),
        suggestedReps: '2-4 reps',
      },
    ];
  }

  return [];
}

// "Beat the Logbook" Smart Target Generator
export interface TargetSuggestion {
  suggestedWeight: number;
  suggestedRepsMin: number;
  suggestedRepsMax: number;
  targetRpe: number;
  reason: string;
  previousBestWeight?: number;
  previousBestReps?: number;
}

export function generateSmartTarget(
  exercise: ExerciseDefinition,
  weekNumber: number,
  allWorkouts: CompletedWorkoutSession[],
  unit: WeightUnit
): TargetSuggestion {
  // Find the most recent session containing this exercise or same primary movement
  let lastLoggedSets: { weight: number; reps: number; rpe: number; rir: number }[] = [];

  for (let w = weekNumber - 1; w >= 1; w--) {
    const session = allWorkouts.find(
      (s) => s.weekNumber === w && s.exercises.some((e) => e.exerciseId === exercise.id)
    );
    if (session) {
      const match = session.exercises.find((e) => e.exerciseId === exercise.id);
      if (match && match.sets.length > 0) {
        const completedWorkingSets = match.sets.filter((s) => !s.isWarmup && s.completed && s.weight > 0);
        if (completedWorkingSets.length > 0) {
          lastLoggedSets = completedWorkingSets;
          break;
        }
      }
    }
  }

  const defaultRpe = parseFloat(exercise.targetRpe.split('-')[0]) || 9;

  if (lastLoggedSets.length === 0) {
    // Baseline defaults for initial week
    const baseWeight = exercise.isHeavyOrBackoff === 'heavy' ? (unit === 'kg' ? 30 : 65) : (unit === 'kg' ? 22.5 : 50);
    return {
      suggestedWeight: baseWeight,
      suggestedRepsMin: exercise.minReps,
      suggestedRepsMax: exercise.maxReps,
      targetRpe: defaultRpe,
      reason: 'Initial baseline for Week 1. Log warmups to calibrate your true working weight.',
    };
  }

  // Top set from last time
  const bestSet = lastLoggedSets.reduce((prev, curr) =>
    curr.weight * curr.reps > prev.weight * prev.reps ? curr : prev
  );

  const increment = unit === 'kg' ? (exercise.isHeavyOrBackoff === 'heavy' ? 2.5 : 1.25) : (exercise.isHeavyOrBackoff === 'heavy' ? 5 : 2.5);

  // Double progression logic:
  // If top of rep range was hit: increase weight!
  if (bestSet.reps >= exercise.maxReps) {
    return {
      suggestedWeight: Math.round((bestSet.weight + increment) * 10) / 10,
      suggestedRepsMin: exercise.minReps,
      suggestedRepsMax: exercise.maxReps,
      targetRpe: defaultRpe,
      previousBestWeight: bestSet.weight,
      previousBestReps: bestSet.reps,
      reason: `Hit top of rep range (${bestSet.reps} reps @ ${bestSet.weight}${unit}). Overload with +${increment}${unit}!`,
    };
  }

  // If inside the rep range: aim to add 1 more rep with current weight
  return {
    suggestedWeight: bestSet.weight,
    suggestedRepsMin: Math.min(bestSet.reps + 1, exercise.maxReps),
    suggestedRepsMax: exercise.maxReps,
    targetRpe: defaultRpe,
    previousBestWeight: bestSet.weight,
    previousBestReps: bestSet.reps,
    reason: `Maintain ${bestSet.weight}${unit} and aim for ${bestSet.reps + 1} reps (Beat the Logbook).`,
  };
}

// Calculate weekly volume distribution across all muscle groups
export interface MuscleVolumeStats {
  muscle: MuscleGroup;
  completedSets: number;
  targetSetsMin: number;
  targetSetsMax: number;
  status: 'optimal' | 'moderate' | 'surplus' | 'low';
}

// Science-based weekly set volume targets:
// Chest: 6-10 sets
// Shoulders/Delts: 8-12 sets
// Back / Lats: 6-10 sets
// Quads: 6-10 sets
// Hamstrings: 4-6 sets
// Glutes: 6-10 sets
// Biceps: 4-8 sets
// Triceps: 4-8 sets
// Calves: 3-5 sets
// Abs / Core: 3-5 sets
// Forearms: 2-4 sets
export const MUSCLE_VOLUME_TARGETS: Record<MuscleGroup, { min: number; max: number }> = {
  Chest: { min: 6, max: 10 },
  'Shoulders / Delts': { min: 6, max: 10 },
  'Back / Lats': { min: 6, max: 10 },
  Quads: { min: 6, max: 10 },
  Hamstrings: { min: 4, max: 6 },
  Glutes: { min: 6, max: 10 },
  Biceps: { min: 4, max: 8 },
  Triceps: { min: 4, max: 8 },
  Calves: { min: 3, max: 5 },
  'Abs / Core': { min: 3, max: 5 },
  Forearms: { min: 2, max: 4 },
};

export function calculateWeeklyMuscleVolume(
  weekNumber: number,
  allWorkouts: CompletedWorkoutSession[],
  bonusWorkouts: BonusSessionLog[]
): MuscleVolumeStats[] {
  const muscleCounts: Record<MuscleGroup, number> = {
    Chest: 0,
    'Back / Lats': 0,
    Quads: 0,
    Hamstrings: 0,
    Glutes: 0,
    'Shoulders / Delts': 0,
    Biceps: 0,
    Triceps: 0,
    Calves: 0,
    'Abs / Core': 0,
    Forearms: 0,
  };

  // Tally sets from standard completed sessions in this week
  const weekSessions = allWorkouts.filter((w) => w.weekNumber === weekNumber);
  weekSessions.forEach((session) => {
    session.exercises.forEach((ex) => {
      const workingSets = ex.sets.filter((s) => !s.isWarmup && s.completed).length;
      if (workingSets > 0) {
        // Map exercise target muscles
        const targetMuscles = getExerciseMusclesByName(ex.exerciseName);
        targetMuscles.forEach((muscle) => {
          muscleCounts[muscle] = (muscleCounts[muscle] || 0) + workingSets;
        });
      }
    });
  });

  // Tally sets from bonus sessions in this week
  const weekBonus = bonusWorkouts.filter((b) => b.weekNumber === weekNumber);
  weekBonus.forEach((bonus) => {
    bonus.addedVolumeMuscles.forEach((vol) => {
      if (vol.muscle in muscleCounts) {
        muscleCounts[vol.muscle] = (muscleCounts[vol.muscle] || 0) + vol.sets;
      }
    });
  });

  const allMuscles = Object.keys(MUSCLE_VOLUME_TARGETS) as MuscleGroup[];
  return allMuscles.map((muscle) => {
    const completed = muscleCounts[muscle] || 0;
    const target = MUSCLE_VOLUME_TARGETS[muscle];
    let status: 'optimal' | 'moderate' | 'surplus' | 'low' = 'low';

    if (completed >= target.min && completed <= target.max) {
      status = 'optimal';
    } else if (completed > target.max) {
      status = 'surplus';
    } else if (completed > 0) {
      status = 'moderate';
    }

    return {
      muscle,
      completedSets: completed,
      targetSetsMin: target.min,
      targetSetsMax: target.max,
      status,
    };
  });
}

function getExerciseMusclesByName(name: string): MuscleGroup[] {
  const n = name.toLowerCase();
  if (n.includes('press') && (n.includes('db') || n.includes('bench') || n.includes('machine chest') || n.includes('dip'))) {
    return ['Chest', 'Triceps'];
  }
  if (n.includes('squat') || n.includes('lunge') || n.includes('step up')) {
    return ['Quads', 'Glutes'];
  }
  if (n.includes('deadlift') || n.includes('rdl') || n.includes('hamstring') || n.includes('curl') && n.includes('leg')) {
    return ['Hamstrings', 'Glutes'];
  }
  if (n.includes('pulldown') || n.includes('pull-up') || n.includes('row')) {
    return ['Back / Lats', 'Biceps'];
  }
  if (n.includes('lateral raise') || n.includes('arnold press') || n.includes('shoulder')) {
    return ['Shoulders / Delts'];
  }
  if (n.includes('bicep') || (n.includes('curl') && !n.includes('leg'))) {
    return ['Biceps'];
  }
  if (n.includes('tricep') || n.includes('skull crusher')) {
    return ['Triceps'];
  }
  if (n.includes('calf') || n.includes('toe press')) {
    return ['Calves'];
  }
  if (n.includes('crunch') || n.includes('leg raise') || n.includes('core')) {
    return ['Abs / Core'];
  }
  return ['Chest'];
}
