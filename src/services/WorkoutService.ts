import AsyncStorage from '@react-native-async-storage/async-storage';
import { Workout } from '../types';
import { generateMockWorkouts } from '../data/mockData';

// Bumped to v2 to give a clean slate (old mock data at v1 keys is ignored)
const WORKOUTS_KEY = '@workout_tracker:workouts_v2';
const SEEDED_KEY = '@workout_tracker:seeded_v2';

export const WorkoutService = {
  // ── Read ──────────────────────────────────────────────────────────────────

  /** Load all workouts, newest-first. */
  async getAll(): Promise<Workout[]> {
    const raw = await AsyncStorage.getItem(WORKOUTS_KEY);
    if (!raw) return [];
    const parsed: Workout[] = JSON.parse(raw);
    return parsed.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  },

  /** Load a single workout by id, or null if not found. */
  async getById(id: string): Promise<Workout | null> {
    const all = await this.getAll();
    return all.find((w) => w.id === id) ?? null;
  },

  // ── Write ─────────────────────────────────────────────────────────────────

  /**
   * Persist a workout.
   * If an entry with the same id already exists it is replaced (upsert semantics).
   */
  async save(workout: Workout): Promise<void> {
    const existing = await this.getAll();
    const updated = [workout, ...existing.filter((w) => w.id !== workout.id)];
    await AsyncStorage.setItem(WORKOUTS_KEY, JSON.stringify(updated));
  },

  /** Save multiple workouts in a single write (more efficient than looping save). */
  async saveMany(workouts: Workout[]): Promise<void> {
    const existing = await this.getAll();
    const incomingIds = new Set(workouts.map((w) => w.id));
    const merged = [
      ...workouts,
      ...existing.filter((w) => !incomingIds.has(w.id)),
    ];
    await AsyncStorage.setItem(WORKOUTS_KEY, JSON.stringify(merged));
  },

  // ── Delete ────────────────────────────────────────────────────────────────

  /** Remove a single workout by id. */
  async delete(id: string): Promise<void> {
    const workouts = await this.getAll();
    const filtered = workouts.filter((w) => w.id !== id);
    await AsyncStorage.setItem(WORKOUTS_KEY, JSON.stringify(filtered));
  },

  /** Wipe all workout data from storage. */
  async clearAll(): Promise<void> {
    await AsyncStorage.multiRemove([WORKOUTS_KEY, SEEDED_KEY]);
  },

  // ── Mock Data ─────────────────────────────────────────────────────────────

  /**
   * Overwrite storage with 8 weeks of generated mock workouts.
   * Marks the store as seeded so loadMockDataIfEmpty won't double-seed.
   */
  async seedMockData(): Promise<void> {
    const mocks = generateMockWorkouts();
    await AsyncStorage.setItem(WORKOUTS_KEY, JSON.stringify(mocks));
    await AsyncStorage.setItem(SEEDED_KEY, 'true');
  },

  /**
   * Seeds mock data only if:
   *   - No workouts are stored yet, AND
   *   - The seed flag has never been set.
   *
   * Returns true if seeding happened, false otherwise.
   */
  async loadMockDataIfEmpty(): Promise<boolean> {
    const [raw, seeded] = await AsyncStorage.multiGet([WORKOUTS_KEY, SEEDED_KEY]);
    const hasData = raw[1] && JSON.parse(raw[1]).length > 0;
    const alreadySeeded = !!seeded[1];

    if (hasData || alreadySeeded) return false;

    await this.seedMockData();
    return true;
  },
};
