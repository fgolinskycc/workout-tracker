import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, SPACING, FONT_SIZES } from '../constants/theme';
import { useWorkouts } from '../hooks/useWorkouts';
import { WorkoutCard } from '../components/WorkoutCard';
import { Workout } from '../types';

export const HistoryScreen: React.FC = () => {
  const { workouts, loading, deleteWorkout, refresh } = useWorkouts();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const handleDelete = (id: string) => {
    const target = workouts.find((w) => w.id === id);
    Alert.alert(
      'Delete Workout',
      `Remove "${target?.title ?? 'this workout'}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteWorkout(id),
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const renderItem = ({ item }: { item: Workout }) => (
    <WorkoutCard workout={item} onDelete={handleDelete} />
  );

  return (
    <FlatList
      data={workouts}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={[
        styles.content,
        workouts.length === 0 && styles.contentEmpty,
      ]}
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={refresh}
          tintColor={COLORS.primary}
        />
      }
      ListHeaderComponent={
        workouts.length > 0 ? (
          <Text style={styles.header}>
            {workouts.length} workout{workouts.length !== 1 ? 's' : ''} logged
          </Text>
        ) : null
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Ionicons name="time-outline" size={72} color={COLORS.textMuted} />
          <Text style={styles.emptyTitle}>No history yet</Text>
          <Text style={styles.emptySub}>
            Finish a workout and it will appear here.
          </Text>
        </View>
      }
    />
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  contentEmpty: { flex: 1 },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginBottom: SPACING.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.xl,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  emptySub: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});
