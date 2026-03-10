import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Workout } from '../types';
import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../constants/theme';
import { formatDate, formatDurationMins, calcWorkoutVolume } from '../utils/helpers';

interface Props {
  workout: Workout;
  onDelete?: (id: string) => void;
  onPress?: () => void;
}

export const WorkoutCard: React.FC<Props> = ({ workout, onDelete, onPress }) => {
  const volume = calcWorkoutVolume(workout.exercises);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      <View style={styles.accentBar} />
      <View style={styles.body}>
        <View style={styles.row}>
          <View style={styles.info}>
            <Text style={styles.name}>{workout.title}</Text>
            <Text style={styles.date}>{formatDate(workout.date)}</Text>
          </View>
          {onDelete && (
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => onDelete(workout.id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.metaRow}>
          <View style={styles.chip}>
            <Ionicons name="time-outline" size={13} color={COLORS.primary} />
            <Text style={styles.chipText}>{formatDurationMins(workout.duration)}</Text>
          </View>
          <View style={styles.chip}>
            <Ionicons name="barbell-outline" size={13} color={COLORS.primary} />
            <Text style={styles.chipText}>
              {workout.exercises.length} exercise{workout.exercises.length !== 1 ? 's' : ''}
            </Text>
          </View>
          {volume > 0 && (
            <View style={styles.chip}>
              <Ionicons name="trending-up-outline" size={13} color={COLORS.primary} />
              <Text style={styles.chipText}>
                {volume >= 1000
                  ? `${(volume / 1000).toFixed(1)}k lbs`
                  : `${Math.round(volume)} lbs`}
              </Text>
            </View>
          )}
        </View>

        {workout.exercises.length > 0 && (
          <View style={styles.exerciseList}>
            {workout.exercises.slice(0, 4).map((we, i) => (
              <Text key={`${we.exercise.id}-${i}`} style={styles.exerciseLine} numberOfLines={1}>
                · {we.exercise.name}
                {we.sets.length > 0 ? `  ×${we.sets.length} sets` : ''}
              </Text>
            ))}
            {workout.exercises.length > 4 && (
              <Text style={styles.more}>
                +{workout.exercises.length - 4} more…
              </Text>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  accentBar: {
    width: 4,
    backgroundColor: COLORS.primary,
  },
  body: {
    flex: 1,
    padding: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  info: { flex: 1 },
  name: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  date: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  deleteBtn: { padding: 2 },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${COLORS.primary}18`,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  chipText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    fontWeight: '600',
  },
  exerciseList: { marginTop: SPACING.sm },
  exerciseLine: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  more: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
});
