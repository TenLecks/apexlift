export type WeightUnit = 'kg' | 'lbs';

export type MuscleGroup =
  | 'Chest'
  | 'Back / Lats'
  | 'Quads'
  | 'Hamstrings'
  | 'Glutes'
  | 'Shoulders / Delts'
  | 'Biceps'
  | 'Triceps'
  | 'Calves'
  | 'Abs / Core'
  | 'Forearms';

export type IntensityTechnique =
  | 'none'
  | 'dropset'
  | 'long_length_partials'
  | 'myo_reps'
  | 'static_stretch'
  | 'weighted_static_hold'
  | 'mechanical_dropset';

export interface ExerciseDefinition {
  id: string;
  name: string;
  targetMuscles: MuscleGroup[];
  primaryMuscle: MuscleGroup;
  warmupSetsCount: number;
  workingSetsCount: number;
  repRange: string;
  minReps: number;
  maxReps: number;
  targetRpe: string;
  targetRir: string;
  restTimeMinutes: number;
  restTimeSeconds: number;
  lastSetTechnique?: IntensityTechnique;
  techniqueNote?: string;
  substitution1: string;
  substitution2: string;
  coachingNotes: string;
  isHeavyOrBackoff?: 'heavy' | 'backoff' | 'standard';
}

export interface DayWorkoutTemplate {
  id: string;
  dayType: 'Full Body A' | 'Full Body B';
  title: string;
  description: string;
  exercises: ExerciseDefinition[];
}

export interface WeekPlan {
  weekNumber: number;
  blockNumber: number; // 1, 2, or 3
  blockTitle: string; // "Build Phase", "Novelty Phase", "Peak / Specialization"
  isDeload: boolean;
  notes: string;
  workouts: {
    dayA: DayWorkoutTemplate;
    dayB: DayWorkoutTemplate;
  };
}

export interface LoggedSet {
  id: string;
  setNumber: number;
  isWarmup: boolean;
  weight: number; // in current active unit or converted
  reps: number;
  rpe: number; // 1 to 10
  rir: number; // 0 to 4
  completed: boolean;
  intensityTechniqueApplied?: IntensityTechnique;
}

export interface LoggedExercise {
  exerciseId: string;
  exerciseName: string;
  chosenSubstitution?: string; // name if substituted
  notes?: string;
  sets: LoggedSet[];
}

export type BonusType = 'yoga' | 'cardio' | 'weak_point_strength';

export interface BonusSessionLog {
  id: string;
  date: string;
  weekNumber: number;
  type: BonusType;
  title: string;
  durationMinutes: number;
  fatigueScore: number; // 1-5
  sorenessScore: number; // 1-5
  perceivedEffort: number; // 1-10
  exercisesLogged?: LoggedExercise[];
  notes?: string;
  addedVolumeMuscles: { muscle: MuscleGroup; sets: number }[];
}

export interface CompletedWorkoutSession {
  id: string;
  weekNumber: number;
  dayType: 'Full Body A' | 'Full Body B' | 'Adaptive Bonus';
  dateCompleted: string; // ISO format
  durationMinutes: number;
  exercises: LoggedExercise[];
  overallRpe?: number;
  notes?: string;
}

export interface WeeklyExerciseTarget {
  exerciseId: string;
  weekNumber: number;
  targetWeight: number;
  targetRepsMin: number;
  targetRepsMax: number;
  targetRpe: number;
  isCustomOverride: boolean;
  notes?: string;
}

export interface Badge {
  id: string;
  title: string;
  category: 'strength' | 'consistency' | 'recovery' | 'program' | 'mastery';
  description: string;
  iconName: string;
  unlockedAt?: string; // ISO date or undefined
  progress: number; // 0 to 100
  tier?: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export interface UserFitnessProfile {
  name: string;
  weightUnit: WeightUnit;
  currentWeek: number;
  streakWeeks: number;
  bestStreakWeeks: number;
  totalXp: number;
  level: number;
  completedWorkouts: CompletedWorkoutSession[];
  bonusSessions: BonusSessionLog[];
  weeklyTargets: Record<string, WeeklyExerciseTarget>; // key: `${weekNumber}_${exerciseId}`
  badges: Record<string, Badge>;
  activeWorkoutDraft?: {
    weekNumber: number;
    dayType: 'Full Body A' | 'Full Body B';
    startedAt: string;
    exercises: LoggedExercise[];
  } | null;
}

export interface ReadinessScore {
  soreness: number; // 1 to 5
  energy: number; // 1 to 5
  timeAvailable: 20 | 30 | 45; // minutes
  preferredFocus?: MuscleGroup;
}
