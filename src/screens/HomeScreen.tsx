import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../constants/theme';
import { useWorkouts } from '../hooks/useWorkouts';
import { RootTabParamList, QuickStartTemplate, Workout } from '../types';
import { WorkoutCard } from '../components/WorkoutCard';
import { calcWorkoutVolume } from '../utils/helpers';

type HomeNavProp = BottomTabNavigationProp<RootTabParamList, 'Home'>;

const SCREEN_W = Dimensions.get('window').width;
const CARD_W = (SCREEN_W - SPACING.md * 2 - SPACING.sm) / 2;

// ─── Quick-start config ────────────────────────────────────────────────────────

type QuickStartConfig = {
  template: QuickStartTemplate;
  label: string;
  sub: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
};

const QUICK_STARTS: QuickStartConfig[] = [
  { template: 'push',      label: 'Push',      sub: 'Chest · Shoulders · Tris', icon: 'arrow-up-circle',   color: COLORS.primary },
  { template: 'pull',      label: 'Pull',      sub: 'Back · Biceps',            icon: 'arrow-down-circle', color: '#3b82f6' },
  { template: 'legs',      label: 'Legs',      sub: 'Quads · Hams · Glutes',    icon: 'flash',             color: COLORS.secondary },
  { template: 'full_body', label: 'Full Body', sub: 'Compound lifts',            icon: 'fitness',           color: COLORS.warning },
];

// ─── Suggested workout logic ───────────────────────────────────────────────────

type Suggestion = {
  template: QuickStartTemplate;
  label: string;
  reason: string;
  color: string;
};

function getSuggestion(workouts: Workout[]): Suggestion {
  const pushMuscles = new Set(['chest', 'shoulders', 'triceps']);
  const pullMuscles = new Set(['back', 'biceps']);
  const legMuscles  = new Set(['legs', 'glutes', 'calves']);

  if (workouts.length === 0) {
    return { template: 'push', label: 'Push Day', reason: 'Great place to start your training', color: COLORS.primary };
  }

  const recentGroups = workouts.slice(0, 3).flatMap((w) =>
    w.exercises.map((e) => e.exercise.muscleGroup)
  );

  const hasPush = recentGroups.some((m) => pushMuscles.has(m));
  const hasPull = recentGroups.some((m) => pullMuscles.has(m));
  const hasLegs = recentGroups.some((m) => legMuscles.has(m));

  if (!hasLegs && (hasPush || hasPull)) {
    return { template: 'legs', label: 'Leg Day', reason: 'Legs are fully recovered', color: COLORS.secondary };
  }
  if (!hasPull && hasPush) {
    return { template: 'pull', label: 'Pull Day', reason: 'Back & biceps need attention', color: '#3b82f6' };
  }
  if (!hasPush) {
    return { template: 'push', label: 'Push Day', reason: 'Chest & shoulders are ready', color: COLORS.primary };
  }

  const lastMuscles = workouts[0].exercises.map((e) => e.exercise.muscleGroup);
  if (lastMuscles.some((m) => pushMuscles.has(m))) {
    return { template: 'pull', label: 'Pull Day', reason: 'Keep the PPL cycle going', color: '#3b82f6' };
  }
  if (lastMuscles.some((m) => pullMuscles.has(m))) {
    return { template: 'legs', label: 'Leg Day', reason: 'Complete the PPL cycle', color: COLORS.secondary };
  }
  return { template: 'push', label: 'Push Day', reason: 'Rest complete — time to push', color: COLORS.primary };
}

// ─── Component ────────────────────────────────────────────────────────────────

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeNavProp>();
  const { workouts, loading, refresh } = useWorkouts();

  useFocusEffect(
    useCallback(() => { refresh(); }, [refresh])
  );

  const now     = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const weeklyWorkouts = useMemo(
    () => workouts.filter((w) => new Date(w.date) >= weekAgo),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [workouts]
  );

  const weeklyVolume = useMemo(
    () => weeklyWorkouts.reduce((sum, w) => sum + calcWorkoutVolume(w.exercises), 0),
    [weeklyWorkouts]
  );

  const suggestion = useMemo(() => getSuggestion(workouts), [workouts]);
  const lastWorkout = workouts[0];

  const WEEKLY_GOAL = 4;
  const weekProgress = Math.min(weeklyWorkouts.length / WEEKLY_GOAL, 1);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={COLORS.primary} />
      }
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Ready to train?</Text>
          <Text style={styles.dateText}>
            {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
        </View>
        <View style={styles.totalBadge}>
          <Text style={styles.totalNum}>{workouts.length}</Text>
          <Text style={styles.totalLabel}>total</Text>
        </View>
      </View>

      {/* ── Suggested Workout ── */}
      <View style={[styles.suggestCard, { borderLeftColor: suggestion.color }]}>
        <Text style={styles.suggestEyebrow}>TODAY'S PICK</Text>
        <Text style={styles.suggestTitle}>{suggestion.label}</Text>
        <Text style={styles.suggestReason}>{suggestion.reason}</Text>
        <TouchableOpacity
          style={[styles.suggestBtn, { backgroundColor: suggestion.color }]}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Workout', { template: suggestion.template })}
        >
          <Text style={styles.suggestBtnText}>Start {suggestion.label}</Text>
          <Ionicons name="arrow-forward" size={16} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* ── Quick Start Grid ── */}
      <Text style={styles.sectionTitle}>Quick Start</Text>
      <View style={styles.quickGrid}>
        {QUICK_STARTS.map(({ template, label, sub, icon, color }) => (
          <TouchableOpacity
            key={template}
            style={[styles.quickCard, { borderColor: `${color}40` }]}
            activeOpacity={0.75}
            onPress={() => navigation.navigate('Workout', { template })}
          >
            <View style={[styles.quickIcon, { backgroundColor: `${color}22` }]}>
              <Ionicons name={icon} size={24} color={color} />
            </View>
            <Text style={styles.quickLabel}>{label}</Text>
            <Text style={styles.quickSub} numberOfLines={1}>{sub}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Weekly Summary ── */}
      <Text style={styles.sectionTitle}>This Week</Text>
      <View style={styles.weekCard}>
        <View style={styles.weekStats}>
          <View style={styles.weekStat}>
            <Text style={[styles.weekStatNum, { color: COLORS.primary }]}>
              {weeklyWorkouts.length}
            </Text>
            <Text style={styles.weekStatLabel}>Workouts</Text>
          </View>
          <View style={styles.weekDivider} />
          <View style={styles.weekStat}>
            <Text style={[styles.weekStatNum, { color: COLORS.secondary }]}>
              {weeklyVolume >= 1000
                ? `${(weeklyVolume / 1000).toFixed(1)}k`
                : String(Math.round(weeklyVolume))}
            </Text>
            <Text style={styles.weekStatLabel}>Volume (lbs)</Text>
          </View>
          <View style={styles.weekDivider} />
          <View style={styles.weekStat}>
            <Text style={[styles.weekStatNum, { color: COLORS.warning }]}>
              {WEEKLY_GOAL - weeklyWorkouts.length > 0
                ? WEEKLY_GOAL - weeklyWorkouts.length
                : '✓'}
            </Text>
            <Text style={styles.weekStatLabel}>
              {WEEKLY_GOAL - weeklyWorkouts.length > 0 ? 'Sessions left' : 'Goal hit!'}
            </Text>
          </View>
        </View>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${weekProgress * 100}%` as `${number}%`,
                backgroundColor: weekProgress >= 1 ? COLORS.secondary : COLORS.primary,
              },
            ]}
          />
        </View>
        <Text style={styles.progressLabel}>
          {weeklyWorkouts.length}/{WEEKLY_GOAL} sessions completed this week
        </Text>
      </View>

      {/* ── Last Session ── */}
      {lastWorkout && (
        <View>
          <Text style={styles.sectionTitle}>Last Session</Text>
          <WorkoutCard workout={lastWorkout} />
        </View>
      )}

      {/* ── Empty state ── */}
      {workouts.length === 0 && !loading && (
        <View style={styles.empty}>
          <Ionicons name="barbell-outline" size={64} color={COLORS.border} />
          <Text style={styles.emptyTitle}>No workouts yet</Text>
          <Text style={styles.emptySub}>
            Tap a quick-start above or build your own session
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, paddingBottom: SPACING.xxl },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  greeting: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '800',
    color: COLORS.text,
  },
  dateText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  totalBadge: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 56,
  },
  totalNum: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
    color: COLORS.primary,
  },
  totalLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    fontWeight: '600',
  },

  // Suggested workout card
  suggestCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 4,
  },
  suggestEyebrow: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  suggestTitle: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  suggestReason: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginTop: 4,
    marginBottom: SPACING.md,
  },
  suggestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
  },
  suggestBtnText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: '#fff',
  },

  // Quick start grid
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  quickCard: {
    width: CARD_W,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    gap: 4,
  },
  quickIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  quickLabel: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '800',
    color: COLORS.text,
  },
  quickSub: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    fontWeight: '500',
  },

  // Weekly summary
  weekCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  weekStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  weekStat: {
    flex: 1,
    alignItems: 'center',
  },
  weekStatNum: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '800',
  },
  weekStatLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  weekDivider: {
    width: 1,
    height: 32,
    backgroundColor: COLORS.border,
  },
  progressTrack: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: RADIUS.full,
    minWidth: 6,
  },
  progressLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    textAlign: 'center',
    fontWeight: '600',
  },

  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    marginTop: SPACING.xs,
  },

  empty: {
    alignItems: 'center',
    paddingTop: SPACING.lg,
    gap: SPACING.sm,
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
    paddingHorizontal: SPACING.xl,
  },
});
