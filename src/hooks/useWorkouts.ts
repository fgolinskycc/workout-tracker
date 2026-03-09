import { useState, useEffect, useCallback } from 'react';
import { Workout } from '../types';
import { WorkoutService } from '../services/WorkoutService';

export const useWorkouts = () => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWorkouts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await WorkoutService.getAll();
      setWorkouts(data);
    } catch (e) {
      setError('Failed to load workouts.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWorkouts();
  }, [loadWorkouts]);

  const saveWorkout = useCallback(
    async (workout: Workout) => {
      await WorkoutService.save(workout);
      await loadWorkouts();
    },
    [loadWorkouts]
  );

  const deleteWorkout = useCallback(
    async (id: string) => {
      await WorkoutService.delete(id);
      await loadWorkouts();
    },
    [loadWorkouts]
  );

  /** Wipe everything and re-seed mock data (useful for dev / testing). */
  const resetToMockData = useCallback(async () => {
    await WorkoutService.clearAll();
    await WorkoutService.seedMockData();
    await loadWorkouts();
  }, [loadWorkouts]);

  return {
    workouts,
    loading,
    error,
    saveWorkout,
    deleteWorkout,
    resetToMockData,
    refresh: loadWorkouts,
  };
};
