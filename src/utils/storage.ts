import AsyncStorage from '@react-native-async-storage/async-storage';
import { Workout } from '../types';

const WORKOUTS_KEY = '@workout_tracker:workouts';

export const StorageService = {
  /**
   * Persist a workout. If an entry with the same id already exists it is replaced.
   */
  async saveWorkout(workout: Workout): Promise<void> {
    const existing = await this.getWorkouts();
    const updated = [workout, ...existing.filter((w) => w.id !== workout.id)];
    await AsyncStorage.setItem(WORKOUTS_KEY, JSON.stringify(updated));
  },

  /**
   * Load all workouts sorted newest-first.
   */
  async getWorkouts(): Promise<Workout[]> {
    const raw = await AsyncStorage.getItem(WORKOUTS_KEY);
    if (!raw) return [];
    const parsed: Workout[] = JSON.parse(raw);
    return parsed.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  },

  /**
   * Remove a single workout by id.
   */
  async deleteWorkout(id: string): Promise<void> {
    const workouts = await this.getWorkouts();
    const filtered = workouts.filter((w) => w.id !== id);
    await AsyncStorage.setItem(WORKOUTS_KEY, JSON.stringify(filtered));
  },

  /**
   * Wipe all stored data (useful for dev/testing).
   */
  async clearAll(): Promise<void> {
    await AsyncStorage.removeItem(WORKOUTS_KEY);
  },
};
