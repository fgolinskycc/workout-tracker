import { WorkoutExercise } from '../types';

/** Generate a short unique id without any external library. */
export const generateId = (): string =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

// ─── Duration formatting ───────────────────────────────────────────────────────

/** Format elapsed seconds → "mm:ss"  (used by the live workout timer). */
export const formatDuration = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

/** Format stored duration in **minutes** → "Xh Ym" or "Y min". */
export const formatDurationMins = (minutes: number): string => {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
};

// ─── Date formatting ───────────────────────────────────────────────────────────

const DAYS   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Format ISO date string → "Mon, Jan 6"
 *  Uses local-timezone getDay/getMonth/getDate to avoid Hermes Intl bugs.
 */
export const formatDate = (iso: string): string => {
  const d = new Date(iso);
  return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
};

// ─── Volume calculation ────────────────────────────────────────────────────────

/**
 * Total volume lifted across all completed sets of a workout,
 * normalised to **lbs** (kg sets are converted at 1 kg = 2.205 lbs).
 */
export const calcWorkoutVolume = (exercises: WorkoutExercise[]): number =>
  exercises.reduce((total, we) => {
    const exVolume = we.sets
      .filter((s) => s.completed)
      .reduce((sum, s) => {
        const weightLbs = s.unit === 'kg' ? s.weight * 2.205 : s.weight;
        return sum + weightLbs * s.reps;
      }, 0);
    return total + exVolume;
  }, 0);
