import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../constants/theme';
import { Workout, WorkoutExercise, RootStackParamList } from '../types';
import { WorkoutService } from '../services/WorkoutService';
import { formatDate, formatDurationMins, calcWorkoutVolume } from '../utils/helpers';

type DetailRouteProp = RouteProp<RootStackParamList, 'WorkoutDetail'>;
type DetailNavProp = NativeStackNavigationProp<RootStackParamList, 'WorkoutDetail'>;

interface ExerciseBlockProps {
  we: WorkoutExercise;
  index: number;
}

const ExerciseBlock: React.FC<ExerciseBlockProps> = ({ we, index }) => {
  const completedSets = we.sets.filter(s => s.completed);
  const setsToShow = completedSets.length > 0 ? completedSets : we.sets;

  return (
    <View style={styles.exerciseBlock}>
      <View style={styles.exerciseHeader}>
        <View style={styles.exerciseIndexBadge}>
          <Text style={styles.exerciseIndexText}>{index + 1}</Text>
        </View>
        <View style={styles.exerciseTitleGroup}>
          <Text style={styles.exerciseName}>{we.exercise.name}</Text>
          <Text style={styles.exerciseMeta}>
            {we.exercise.muscleGroup.replace('_', ' ')}
          </Text>
        </View>
      </View>

      {setsToShow.length > 0 && (
        <View style={styles.setsTable}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, styles.tableHeaderText, styles.cellSet]}>SET</Text>
            <Text style={[styles.tableCell, styles.tableHeaderText, styles.cellWeight]}>WEIGHT</Text>
            <Text style={[styles.tableCell, styles.tableHeaderText, styles.cellReps]}>REPS</Text>
          </View>
          {setsToShow.map((set, si) => (
            <View key={set.id} style={[styles.tableRow, si % 2 === 1 && styles.tableRowAlt]}>
              <Text style={[styles.tableCell, styles.cellSet, styles.tableValue]}>{si + 1}</Text>
              <Text style={[styles.tableCell, styles.cellWeight, styles.tableValue]}>
                {set.weight > 0 ? `${set.weight} ${set.unit}` : '—'}
              </Text>
              <Text style={[styles.tableCell, styles.cellReps, styles.tableValue]}>{set.reps}</Text>
            </View>
          ))}
        </View>
      )}

      {we.notes ? (
        <Text style={styles.exerciseNotes}>{we.notes}</Text>
      ) : null}
    </View>
  );
};

export const WorkoutDetailScreen: React.FC = () => {
  const route = useRoute<DetailRouteProp>();
  const navigation = useNavigation<DetailNavProp>();
  const { workoutId } = route.params;

  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    WorkoutService.getById(workoutId).then((w) => {
      setWorkout(w);
      setLoading(false);
    });
  }, [workoutId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!workout) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color={COLORS.textMuted} />
        <Text style={styles.errorText}>Workout not found</Text>
      </View>
    );
  }

  const volume = calcWorkoutVolume(workout.exercises);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{workout.title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.banner}>
          <Text style={styles.bannerDate}>{formatDate(workout.date)}</Text>
          <View style={styles.bannerChips}>
            <View style={styles.chip}>
              <Ionicons name="time-outline" size={14} color={COLORS.primary} />
              <Text style={styles.chipText}>{formatDurationMins(workout.duration)}</Text>
            </View>
            <View style={styles.chip}>
              <Ionicons name="barbell-outline" size={14} color={COLORS.primary} />
              <Text style={styles.chipText}>
                {workout.exercises.length} exercise{workout.exercises.length !== 1 ? 's' : ''}
              </Text>
            </View>
            {volume > 0 && (
              <View style={styles.chip}>
                <Ionicons name="trending-up-outline" size={14} color={COLORS.primary} />
                <Text style={styles.chipText}>
                  {volume >= 1000 ? `${(volume / 1000).toFixed(1)}k lbs` : `${Math.round(volume)} lbs`}
                </Text>
              </View>
            )}
          </View>
        </View>

        <Text style={styles.sectionLabel}>
          EXERCISES · {workout.exercises.length}
        </Text>

        {workout.exercises.map((we, i) => (
          <ExerciseBlock key={`${we.exercise.id}-${i}`} we={we} index={i} />
        ))}

        {workout.notes ? (
          <View style={styles.notesCard}>
            <Text style={styles.notesLabel}>NOTES</Text>
            <Text style={styles.notesText}>{workout.notes}</Text>
          </View>
        ) : null}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  errorText: { fontSize: FONT_SIZES.md, color: COLORS.textMuted },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 40, height: 40,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.background,
  },
  headerTitle: {
    flex: 1,
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  scroll: { flex: 1 },
  scrollContent: { padding: SPACING.md },
  banner: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  bannerDate: {
    fontSize: FONT_SIZES.md, fontWeight: '600',
    color: COLORS.text, marginBottom: SPACING.sm,
  },
  bannerChips: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: `${COLORS.primary}18`,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm, paddingVertical: 4,
  },
  chipText: { fontSize: FONT_SIZES.xs, color: COLORS.primary, fontWeight: '600' },
  sectionLabel: {
    fontSize: FONT_SIZES.xs, fontWeight: '700',
    color: COLORS.textMuted, letterSpacing: 1.2,
    marginBottom: SPACING.sm, marginTop: SPACING.xs,
  },
  exerciseBlock: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border,
    marginBottom: SPACING.sm, overflow: 'hidden',
  },
  exerciseHeader: {
    flexDirection: 'row', alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    gap: SPACING.sm,
  },
  exerciseIndexBadge: {
    width: 28, height: 28,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  exerciseIndexText: { fontSize: FONT_SIZES.xs, fontWeight: '700', color: '#fff' },
  exerciseTitleGroup: { flex: 1 },
  exerciseName: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.text },
  exerciseMeta: {
    fontSize: FONT_SIZES.xs, color: COLORS.textMuted,
    textTransform: 'capitalize', marginTop: 2,
  },
  setsTable: {},
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs,
    backgroundColor: COLORS.background,
  },
  tableHeaderText: {
    fontSize: FONT_SIZES.xs, fontWeight: '700',
    color: COLORS.textMuted, letterSpacing: 0.8,
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md, paddingVertical: 10,
  },
  tableRowAlt: { backgroundColor: `${COLORS.primary}08` },
  tableCell: { fontSize: FONT_SIZES.sm, color: COLORS.text },
  cellSet: { width: 40, textAlign: 'center' },
  cellWeight: { flex: 1, textAlign: 'center' },
  cellReps: { width: 50, textAlign: 'center' },
  tableValue: { fontWeight: '500', color: COLORS.text },
  exerciseNotes: {
    fontSize: FONT_SIZES.sm, color: COLORS.textSecondary,
    fontStyle: 'italic', padding: SPACING.md, paddingTop: 0,
  },
  notesCard: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.md, marginTop: SPACING.sm,
  },
  notesLabel: {
    fontSize: FONT_SIZES.xs, fontWeight: '700',
    color: COLORS.textMuted, letterSpacing: 1.2, marginBottom: SPACING.xs,
  },
  notesText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
});
