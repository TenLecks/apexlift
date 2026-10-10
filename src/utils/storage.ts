import { UserFitnessProfile, Badge } from '../types/workout';
import { INITIAL_BADGES } from '../data/badgesData';
import { calculate1RM } from './progression';

const STORAGE_KEY = 'apexlift_fitness_profile_v1';

export function getDefaultProfile(): UserFitnessProfile {
  return {
    name: 'Athlete',
    weightUnit: 'kg',
    currentWeek: 1,
    streakWeeks: 0,
    bestStreakWeeks: 0,
    totalXp: 120,
    level: 1,
    completedWorkouts: [],
    bonusSessions: [],
    weeklyTargets: {},
    badges: { ...INITIAL_BADGES },
    activeWorkoutDraft: null,
  };
}

export function loadUserProfile(): UserFitnessProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const defaultState = getDefaultProfile();
      saveUserProfile(defaultState);
      return defaultState;
    }
    const parsed = JSON.parse(raw) as UserFitnessProfile;
    // Ensure all badges exist in case new ones were added
    const mergedBadges: Record<string, Badge> = { ...INITIAL_BADGES };
    if (parsed.badges) {
      Object.keys(parsed.badges).forEach((k) => {
        mergedBadges[k] = { ...mergedBadges[k], ...parsed.badges[k] };
      });
    }
    parsed.badges = mergedBadges;
    return parsed;
  } catch (e) {
    console.error('Failed to load fitness profile from localStorage:', e);
    return getDefaultProfile();
  }
}

export function saveUserProfile(profile: UserFitnessProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed to save fitness profile to localStorage:', e);
  }
}

// Calculate weekly consistency streak
// Rule: Every calendar week that had both required anchor workouts (Full Body A and Full Body B)
// contributes +1 to the continuous active streak.
export function updateStreakAndBadges(profile: UserFitnessProfile): {
  profile: UserFitnessProfile;
  newlyUnlockedBadges: Badge[];
} {
  const updated: UserFitnessProfile = JSON.parse(JSON.stringify(profile));
  const newlyUnlocked: Badge[] = [];

  // Group workouts by week number
  const weekMap = new Map<number, Set<string>>();
  updated.completedWorkouts.forEach((w) => {
    if (!weekMap.has(w.weekNumber)) {
      weekMap.set(w.weekNumber, new Set());
    }
    weekMap.get(w.weekNumber)!.add(w.dayType);
  });

  // Count consecutive complete weeks
  let currentStreak = 0;
  for (let w = 1; w <= 12; w++) {
    const days = weekMap.get(w);
    const hasA = days?.has('Full Body A');
    const hasB = days?.has('Full Body B');
    if (hasA && hasB) {
      currentStreak++;
    } else if (w < updated.currentWeek) {
      // In a past week, if missed both, reset streak
      currentStreak = 0;
    }
  }

  updated.streakWeeks = currentStreak;
  if (currentStreak > updated.bestStreakWeeks) {
    updated.bestStreakWeeks = currentStreak;
  }

  // Count total completed hard working sets
  let totalWorkingSets = 0;
  let hasRirZero = false;
  let hasDropsetApplied = false;

  updated.completedWorkouts.forEach((w) => {
    w.exercises.forEach((ex) => {
      ex.sets.forEach((s) => {
        if (!s.isWarmup && s.completed) {
          totalWorkingSets++;
          if (s.rir === 0 || s.rpe >= 10) {
            hasRirZero = true;
          }
          if (s.intensityTechniqueApplied && s.intensityTechniqueApplied !== 'none') {
            hasDropsetApplied = true;
          }
        }
      });
    });
  });

  // Calculate XP and level
  // 50 XP per workout, 15 XP per hard set, 40 XP per bonus session, 100 XP per badge
  const baseWorkoutXp = updated.completedWorkouts.length * 50;
  const setsXp = totalWorkingSets * 15;
  const bonusXp = updated.bonusSessions.length * 40;
  const unlockedBadgesCount = Object.values(updated.badges).filter((b) => !!b.unlockedAt).length;
  const badgesXp = unlockedBadgesCount * 100;
  
  updated.totalXp = baseWorkoutXp + setsXp + bonusXp + badgesXp;
  updated.level = Math.max(1, Math.floor(Math.sqrt(updated.totalXp / 100)) + 1);

  // Badge Unlock Evaluator
  const checkUnlock = (badgeId: string, condition: boolean, progressPct: number) => {
    const badge = updated.badges[badgeId];
    if (!badge) return;
    badge.progress = Math.min(100, Math.round(progressPct));
    if (condition && !badge.unlockedAt) {
      badge.unlockedAt = new Date().toISOString();
      badge.progress = 100;
      newlyUnlocked.push(badge);
    }
  };

  // 1. First step
  checkUnlock('first_step', updated.completedWorkouts.length >= 1, (updated.completedWorkouts.length / 1) * 100);

  // 2. Iron consistency 2-week
  checkUnlock('iron_consistency_2', currentStreak >= 2, (currentStreak / 2) * 100);

  // 3. Iron consistency 4-week
  checkUnlock('iron_consistency_4', currentStreak >= 4, (currentStreak / 4) * 100);

  // 4. Iron consistency 8-week
  checkUnlock('iron_consistency_8', currentStreak >= 8, (currentStreak / 8) * 100);

  // 5. 12-week Ascendance
  checkUnlock('ascendance_12', currentStreak >= 12, (currentStreak / 12) * 100);

  // 6. RIR Zero Club
  checkUnlock('rir_zero_club', hasRirZero, hasRirZero ? 100 : 0);

  // 7. Dropset / Intensity warrior
  checkUnlock('dropset_warrior', hasDropsetApplied, hasDropsetApplied ? 100 : 0);

  // 8. Century club (100 sets)
  checkUnlock('century_club', totalWorkingSets >= 100, (totalWorkingSets / 100) * 100);

  // 9. Adaptive Bonus sessions
  const hasYoga = updated.bonusSessions.some((b) => b.type === 'yoga');
  checkUnlock('zen_master', hasYoga, hasYoga ? 100 : 0);

  const hasCardio = updated.bonusSessions.some((b) => b.type === 'cardio');
  checkUnlock('zone2_engine', hasCardio, hasCardio ? 100 : 0);

  const hasWeakPoint = updated.bonusSessions.some((b) => b.type === 'weak_point_strength');
  checkUnlock('weak_point_specialist', hasWeakPoint, hasWeakPoint ? 100 : 0);

  // 10. Deload disciplined
  const week5Done = weekMap.get(5)?.has('Full Body A') && weekMap.get(5)?.has('Full Body B');
  checkUnlock('deload_disciplined', Boolean(week5Done), week5Done ? 100 : 0);

  saveUserProfile(updated);
  return { profile: updated, newlyUnlockedBadges: newlyUnlocked };
}

// Seed Demo Data for effortless exploration
export function seedSampleDemoData(): UserFitnessProfile {
  const profile = getDefaultProfile();
  profile.currentWeek = 3;
  profile.streakWeeks = 2;
  profile.bestStreakWeeks = 2;

  // Week 1 Day A
  profile.completedWorkouts.push({
    id: 'demo-w1-a',
    weekNumber: 1,
    dayType: 'Full Body A',
    dateCompleted: new Date(Date.now() - 14 * 86400000).toISOString(),
    durationMinutes: 44,
    overallRpe: 9,
    exercises: [
      {
        exerciseId: 'b1-a1',
        exerciseName: 'Flat DB Press (Heavy)',
        sets: [
          { id: 's1', setNumber: 1, isWarmup: true, weight: 18, reps: 8, rpe: 6, rir: 4, completed: true },
          { id: 's2', setNumber: 2, isWarmup: true, weight: 24, reps: 5, rpe: 7, rir: 3, completed: true },
          { id: 's3', setNumber: 3, isWarmup: false, weight: 32, reps: 6, rpe: 9, rir: 1, completed: true },
        ],
      },
      {
        exerciseId: 'b1-a2',
        exerciseName: 'Flat DB Press (Back off)',
        sets: [
          { id: 's4', setNumber: 1, isWarmup: false, weight: 26, reps: 10, rpe: 10, rir: 0, completed: true },
        ],
      },
      {
        exerciseId: 'b1-a3',
        exerciseName: 'Romanian Deadlift',
        sets: [
          { id: 's5', setNumber: 1, isWarmup: false, weight: 80, reps: 10, rpe: 8, rir: 2, completed: true },
          { id: 's6', setNumber: 2, isWarmup: false, weight: 80, reps: 9, rpe: 9, rir: 1, completed: true },
        ],
      },
      {
        exerciseId: 'b1-a4',
        exerciseName: '2-Grip Lat Pulldown',
        sets: [
          { id: 's7', setNumber: 1, isWarmup: false, weight: 55, reps: 12, rpe: 9, rir: 1, completed: true },
          { id: 's8', setNumber: 2, isWarmup: false, weight: 55, reps: 11, rpe: 10, rir: 0, completed: true },
        ],
      },
    ],
  });

  // Week 1 Day B
  profile.completedWorkouts.push({
    id: 'demo-w1-b',
    weekNumber: 1,
    dayType: 'Full Body B',
    dateCompleted: new Date(Date.now() - 11 * 86400000).toISOString(),
    durationMinutes: 42,
    overallRpe: 9,
    exercises: [
      {
        exerciseId: 'b1-b1',
        exerciseName: 'Hack Squat (Heavy)',
        sets: [
          { id: 's9', setNumber: 1, isWarmup: true, weight: 60, reps: 8, rpe: 6, rir: 4, completed: true },
          { id: 's10', setNumber: 2, isWarmup: false, weight: 110, reps: 6, rpe: 9, rir: 1, completed: true },
        ],
      },
      {
        exerciseId: 'b1-b2',
        exerciseName: 'Hack Squat (Back off)',
        sets: [
          { id: 's11', setNumber: 1, isWarmup: false, weight: 90, reps: 10, rpe: 9, rir: 1, completed: true },
        ],
      },
      {
        exerciseId: 'b1-b3',
        exerciseName: 'Incline DB Press',
        sets: [
          { id: 's12', setNumber: 1, isWarmup: false, weight: 26, reps: 10, rpe: 9, rir: 1, completed: true },
          { id: 's13', setNumber: 2, isWarmup: false, weight: 26, reps: 9, rpe: 9.5, rir: 0.5, completed: true },
        ],
      },
      {
        exerciseId: 'b1-b5',
        exerciseName: 'T-Bar Row',
        sets: [
          { id: 's14', setNumber: 1, isWarmup: false, weight: 50, reps: 12, rpe: 9, rir: 1, completed: true },
          { id: 's15', setNumber: 2, isWarmup: false, weight: 50, reps: 10, rpe: 10, rir: 0, completed: true },
        ],
      },
    ],
  });

  // Week 1 Bonus Yoga
  profile.bonusSessions.push({
    id: 'demo-bonus-1',
    date: new Date(Date.now() - 9 * 86400000).toISOString(),
    weekNumber: 1,
    type: 'yoga',
    title: 'Flow & Decompress: 20-Min Deep Mobility',
    durationMinutes: 20,
    fatigueScore: 4,
    sorenessScore: 4,
    perceivedEffort: 4,
    addedVolumeMuscles: [{ muscle: 'Abs / Core', sets: 1 }],
  });

  // Week 2 Day A
  profile.completedWorkouts.push({
    id: 'demo-w2-a',
    weekNumber: 2,
    dayType: 'Full Body A',
    dateCompleted: new Date(Date.now() - 6 * 86400000).toISOString(),
    durationMinutes: 45,
    overallRpe: 9.5,
    exercises: [
      {
        exerciseId: 'b1-a1',
        exerciseName: 'Flat DB Press (Heavy)',
        sets: [
          { id: 's16', setNumber: 1, isWarmup: true, weight: 20, reps: 8, rpe: 6, rir: 4, completed: true },
          { id: 's17', setNumber: 2, isWarmup: false, weight: 34, reps: 5, rpe: 9.5, rir: 0.5, completed: true },
        ],
      },
      {
        exerciseId: 'b1-a2',
        exerciseName: 'Flat DB Press (Back off)',
        sets: [
          { id: 's18', setNumber: 1, isWarmup: false, weight: 28, reps: 9, rpe: 10, rir: 0, completed: true },
        ],
      },
      {
        exerciseId: 'b1-a3',
        exerciseName: 'Romanian Deadlift',
        sets: [
          { id: 's19', setNumber: 1, isWarmup: false, weight: 82.5, reps: 10, rpe: 8.5, rir: 1.5, completed: true },
          { id: 's20', setNumber: 2, isWarmup: false, weight: 82.5, reps: 9, rpe: 9, rir: 1, completed: true },
        ],
      },
    ],
  });

  // Week 2 Day B
  profile.completedWorkouts.push({
    id: 'demo-w2-b',
    weekNumber: 2,
    dayType: 'Full Body B',
    dateCompleted: new Date(Date.now() - 3 * 86400000).toISOString(),
    durationMinutes: 46,
    overallRpe: 9,
    exercises: [
      {
        exerciseId: 'b1-b1',
        exerciseName: 'Hack Squat (Heavy)',
        sets: [
          { id: 's21', setNumber: 1, isWarmup: false, weight: 115, reps: 6, rpe: 9.5, rir: 0.5, completed: true },
        ],
      },
      {
        exerciseId: 'b1-b2',
        exerciseName: 'Hack Squat (Back off)',
        sets: [
          { id: 's22', setNumber: 1, isWarmup: false, weight: 95, reps: 10, rpe: 10, rir: 0, completed: true },
        ],
      },
    ],
  });

  // Week 2 Bonus Zone 2
  profile.bonusSessions.push({
    id: 'demo-bonus-2',
    date: new Date(Date.now() - 2 * 86400000).toISOString(),
    weekNumber: 2,
    type: 'cardio',
    title: 'Zone 2 Aerobic Base: 20-Min Incline Walk',
    durationMinutes: 20,
    fatigueScore: 2,
    sorenessScore: 2,
    perceivedEffort: 5,
    addedVolumeMuscles: [{ muscle: 'Calves', sets: 1 }, { muscle: 'Quads', sets: 1 }],
  });

  // Unlock appropriate badges
  const { profile: updated } = updateStreakAndBadges(profile);
  saveUserProfile(updated);
  return updated;
}
