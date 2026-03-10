// ─── Enumerations ─────────────────────────────────────────────────────────────

export type WeightUnit = 'lbs' | 'kg';

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'legs'
  | 'glutes'
  | 'core'
  | 'calves'
  | 'forearms'
  | 'full_body'
  | 'cardio';

export type EquipmentType =
  | 'barbell'
  | 'dumbbell'
  | 'machine'
  | 'cable'
  | 'bodyweight'
  | 'kettlebell'
  | 'resistance_band'
  | 'other';

// ─── Core Models ──────────────────────────────────────────────────────────────

/** A reusable exercise definition (catalog entry). */
export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  equipment: EquipmentType;
}

/** A single logged set within a workout. */
export interface Set {
  id: string;
  reps: number;
  weight: number;
  unit: WeightUnit;
  completed: boolean;
}

/** An exercise as performed during a specific workout (exercise ref + sets + notes). */
export interface WorkoutExercise {
  exercise: Exercise;
  sets: Set[];
  notes?: string;
}

/** A complete workout session. */
export interface Workout {
  id: string;
  title: string;
  date: string;       // ISO 8601
  duration: number;   // minutes
  exercises: WorkoutExercise[];
  notes?: string;
}

// ─── Backward-compat alias (keeps old WorkoutSet references compiling) ─────────
/** @deprecated Use Set instead */
export type WorkoutSet = Set;

// ─── Navigation ────────────────────────────────────────────────────────────────

export type QuickStartTemplate = 'push' | 'pull' | 'legs' | 'full_body';

export type RootTabParamList = {
  Home: undefined;
  Workout: { template?: QuickStartTemplate };
  History: undefined;
  Progress: undefined;
};

/** Root stack — sits above the tab navigator so detail screens push on top. */
export type RootStackParamList = {
  Tabs: undefined;
  WorkoutDetail: { workoutId: string };
};
