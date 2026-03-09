import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { BarChart, LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../constants/theme';
import { useWorkouts } from '../hooks/useWorkouts';
import { calcWorkoutVolume } from '../utils/helpers';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH - SPACING.md * 2;

const CHART_CONFIG = {
  backgroundColor: COLORS.surface,
  backgroundGradientFrom: COLORS.surface,
  backgroundGradientTo: COLORS.surface,
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(233, 69, 96, ${opacity})`,
  labelColor: () => COLORS.textSecondary,
  style: { borderRadius: RADIUS.md },
  propsForDots: {
    r: '4',
    strokeWidth: '2',
    stroke: COLORS.primary,
  },
} as const;

// ─── Component ─────────────────────────────────────────────────────────────────

export const ProgressScreen: React.FC = () => {
  const { workouts, loading, refresh } = useWorkouts();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  // ── Compute last-7-days workout frequency ──────────────────────────────────
  const frequencyData = useMemo(() => {
    const days: { label: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString('en-US', { weekday: 'short' });
      const count = workouts.filter((w) => {
        const wd = new Date(w.date);
        return (
          wd.getFullYear() === d.getFullYear() &&
          wd.getMonth() === d.getMonth() &&
          wd.getDate() === d.getDate()
        );
      }).length;
      days.push({ label, count });
    }
    return days;
  }, [workouts]);

  // ── Compute weekly volume over last 6 weeks ─────────────────────────────────
  const volumeData = useMemo(() => {
    const weeks: { label: string; volume: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const end = new Date();
      end.setDate(end.getDate() - i * 7);
      const start = new Date(end);
      start.setDate(start.getDate() - 6);

      const label = `W${6 - i}`;
      const volume = workouts
        .filter((w) => {
          const d = new Date(w.date);
          return d >= start && d <= end;
        })
        .reduce((sum, w) => sum + calcWorkoutVolume(w.exercises), 0);
      weeks.push({ label, volume: Math.round(volume) });
    }
    return weeks;
  }, [workouts]);

  // ── Summary stats ──────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalWorkouts = workouts.length;
    const totalVolume = workouts.reduce(
      (s, w) => s + calcWorkoutVolume(w.exercises),
      0
    );
    // duration is stored in minutes (not seconds)
    const avgDuration =
      workouts.length > 0
        ? Math.round(
            workouts.reduce((s, w) => s + w.duration, 0) / workouts.length
          )
        : 0;
    const totalSets = workouts.reduce(
      (s, w) =>
        s + w.exercises.reduce((es, ex) => es + ex.sets.length, 0),
      0
    );
    return { totalWorkouts, totalVolume, avgDuration, totalSets };
  }, [workouts]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const hasData = workouts.length > 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={refresh}
          tintColor={COLORS.primary}
        />
      }
    >
      {/* ── Summary Cards ── */}
      <Text style={styles.sectionTitle}>All-Time Summary</Text>
      <View style={styles.statsGrid}>
        <SummaryCard
          icon="barbell-outline"
          value={stats.totalWorkouts}
          label="Workouts"
          color={COLORS.primary}
        />
        <SummaryCard
          icon="layers-outline"
          value={stats.totalSets}
          label="Total Sets"
          color={COLORS.warning}
        />
        <SummaryCard
          icon="timer-outline"
          value={`${stats.avgDuration}m`}
          label="Avg. Duration"
          color={COLORS.secondary}
        />
        <SummaryCard
          icon="trending-up-outline"
          value={
            stats.totalVolume >= 1000
              ? `${(stats.totalVolume / 1000).toFixed(1)}k`
              : stats.totalVolume
          }
          label="Total Vol. (lbs)"
          color={COLORS.danger}
        />
      </View>

      {hasData ? (
        <>
          {/* ── Frequency Bar Chart ── */}
          <Text style={styles.sectionTitle}>Workouts — Last 7 Days</Text>
          <View style={styles.chartCard}>
            <BarChart
              data={{
                labels: frequencyData.map((d) => d.label),
                datasets: [{ data: frequencyData.map((d) => d.count) }],
              }}
              width={CHART_WIDTH - SPACING.md * 2}
              height={180}
              chartConfig={CHART_CONFIG}
              style={styles.chart}
              showValuesOnTopOfBars
              fromZero
              yAxisLabel=""
              yAxisSuffix=""
            />
          </View>

          {/* ── Volume Line Chart ── */}
          <Text style={styles.sectionTitle}>Weekly Volume — Last 6 Weeks</Text>
          <View style={styles.chartCard}>
            <LineChart
              data={{
                labels: volumeData.map((d) => d.label),
                datasets: [{ data: volumeData.map((d) => d.volume || 0) }],
              }}
              width={CHART_WIDTH - SPACING.md * 2}
              height={180}
              chartConfig={CHART_CONFIG}
              style={styles.chart}
              bezier
              fromZero
              yAxisLabel=""
              yAxisSuffix=" lbs"
            />
          </View>
        </>
      ) : (
        <View style={styles.empty}>
          <Ionicons name="stats-chart-outline" size={72} color={COLORS.textMuted} />
          <Text style={styles.emptyTitle}>No data yet</Text>
          <Text style={styles.emptySub}>
            Complete workouts to see your progress charts here.
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

// ─── Sub-component ─────────────────────────────────────────────────────────────

interface SummaryCardProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  value: string | number;
  label: string;
  color: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ icon, value, label, color }) => (
  <View style={styles.summaryCard}>
    <Ionicons name={icon} size={24} color={color} />
    <Text style={[styles.summaryValue, { color }]}>{value}</Text>
    <Text style={styles.summaryLabel}>{label}</Text>
  </View>
);

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    marginTop: SPACING.sm,
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  summaryCard: {
    width: (CHART_WIDTH - SPACING.sm) / 2,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryValue: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '800',
  },
  summaryLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    textAlign: 'center',
  },

  chartCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  chart: { borderRadius: RADIUS.sm },

  empty: {
    alignItems: 'center',
    paddingTop: SPACING.xxl,
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
