import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../constants/theme';
import { scheduleRestNotif, cancelNotif } from '../utils/notifications';

// ─── Ring geometry ─────────────────────────────────────────────────────────────

const RING_SIZE = 220;
const RING_R    = 96;
const RING_C    = 2 * Math.PI * RING_R;

// ─── Preset options ────────────────────────────────────────────────────────────

const PRESETS = [
  { label: '30s', value: 30 },
  { label: '1m',  value: 60 },
  { label: '90s', value: 90 },
  { label: '2m',  value: 120 },
  { label: '3m',  value: 180 },
  { label: '5m',  value: 300 },
];

// ─── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  /** Current preferred rest duration in seconds (persisted by parent). */
  preferredDuration: number;
  onDurationChange: (seconds: number) => void;
  onDismiss: () => void;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export const RestTimerModal: React.FC<Props> = ({
  visible,
  preferredDuration,
  onDurationChange,
  onDismiss,
}) => {
  const [duration,  setDuration]  = useState(preferredDuration);
  const [remaining, setRemaining] = useState(preferredDuration);

  const intervalRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const endTimeRef     = useRef(0);
  const notifIdRef     = useRef<string | null>(null);
  const onDismissRef   = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  // ── Helpers ────────────────────────────────────────────────────────────────

  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const tick = useCallback(() => {
    const left = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
    setRemaining(left);
    if (left <= 0) {
      stopInterval();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // notif already fired from the system; nothing to cancel
      notifIdRef.current = null;
      setTimeout(() => onDismissRef.current(), 600);
    }
  }, [stopInterval]);

  // ── Open / close ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (visible) {
      const dur = preferredDuration;
      setDuration(dur);
      setRemaining(dur);
      endTimeRef.current = Date.now() + dur * 1000;
      scheduleRestNotif(dur).then((id) => { notifIdRef.current = id; });
      intervalRef.current = setInterval(tick, 500);
    } else {
      stopInterval();
      cancelNotif(notifIdRef.current);
      notifIdRef.current = null;
    }
    return stopInterval;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const handlePreset = useCallback((value: number) => {
    cancelNotif(notifIdRef.current);
    setDuration(value);
    setRemaining(value);
    onDurationChange(value);
    endTimeRef.current = Date.now() + value * 1000;
    scheduleRestNotif(value).then((id) => { notifIdRef.current = id; });
  }, [onDurationChange]);

  const handleAdjust = useCallback((delta: number) => {
    const newEnd = Math.max(Date.now() + 5000, endTimeRef.current + delta * 1000);
    endTimeRef.current = newEnd;
    const newRemaining = Math.max(5, Math.ceil((newEnd - Date.now()) / 1000));
    setRemaining(newRemaining);
    cancelNotif(notifIdRef.current);
    scheduleRestNotif(Math.ceil((newEnd - Date.now()) / 1000))
      .then((id) => { notifIdRef.current = id; });
  }, []);

  const handleSkip = useCallback(() => {
    stopInterval();
    cancelNotif(notifIdRef.current);
    notifIdRef.current = null;
    onDismissRef.current();
  }, [stopInterval]);

  // ── Derived display values ─────────────────────────────────────────────────

  const progress    = duration > 0 ? remaining / duration : 0;
  const strokeOffset = RING_C * (1 - progress);
  const ringColor   = remaining === 0 ? COLORS.secondary : COLORS.primary;

  const mins    = Math.floor(remaining / 60);
  const secs    = remaining % 60;
  const timeStr = `${mins}:${String(secs).padStart(2, '0')}`;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={handleSkip}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          {/* ── Header ── */}
          <View style={styles.handle} />
          <Text style={styles.headerTitle}>REST</Text>

          {/* ── Duration presets ── */}
          <View style={styles.presets}>
            {PRESETS.map(({ label, value }) => {
              const active = duration === value;
              return (
                <TouchableOpacity
                  key={value}
                  style={[styles.preset, active && styles.presetActive]}
                  onPress={() => handlePreset(value)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.presetLabel, active && styles.presetLabelActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Progress ring + countdown ── */}
          <View style={styles.ringWrapper}>
            <Svg width={RING_SIZE} height={RING_SIZE}>
              {/* Track circle */}
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_R}
                stroke={COLORS.border}
                strokeWidth={12}
                fill="none"
              />
              {/* Progress arc */}
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_R}
                stroke={ringColor}
                strokeWidth={12}
                fill="none"
                strokeDasharray={RING_C.toString()}
                strokeDashoffset={strokeOffset}
                strokeLinecap="round"
                transform={`rotate(-90, ${RING_SIZE / 2}, ${RING_SIZE / 2})`}
              />
            </Svg>

            {/* Countdown text overlaid in ring center */}
            <View style={styles.ringCenter}>
              <Text style={[styles.countdown, { color: ringColor }]}>{timeStr}</Text>
              <Text style={styles.countdownSub}>remaining</Text>
            </View>
          </View>

          {/* ── Adjust row ── */}
          <View style={styles.adjustRow}>
            <TouchableOpacity
              style={styles.adjustBtn}
              onPress={() => handleAdjust(-15)}
              activeOpacity={0.7}
            >
              <Ionicons name="remove-circle-outline" size={22} color={COLORS.textSecondary} />
              <Text style={styles.adjustLabel}>−15s</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.adjustBtn}
              onPress={() => handleAdjust(15)}
              activeOpacity={0.7}
            >
              <Ionicons name="add-circle-outline" size={22} color={COLORS.textSecondary} />
              <Text style={styles.adjustLabel}>+15s</Text>
            </TouchableOpacity>
          </View>

          {/* ── Skip button ── */}
          <TouchableOpacity style={styles.skipBtn} onPress={handleSkip} activeOpacity={0.8}>
            <Ionicons name="play-skip-forward" size={20} color={COLORS.primary} />
            <Text style={styles.skipLabel}>Skip Rest</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: SPACING.lg,
    paddingBottom: Platform.OS === 'ios' ? 40 : SPACING.xl,
    paddingTop: SPACING.sm,
    alignItems: 'center',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: COLORS.border,
  },

  handle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.md,
  },

  headerTitle: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: SPACING.md,
  },

  // Preset chips
  presets: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginBottom: SPACING.lg,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  preset: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  presetActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  presetLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  presetLabelActive: {
    color: '#fff',
  },

  // Ring
  ringWrapper: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  ringCenter: {
    position: 'absolute',
    alignItems: 'center',
  },
  countdown: {
    fontSize: 56,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
  },
  countdownSub: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginTop: 2,
  },

  // Adjust
  adjustRow: {
    flexDirection: 'row',
    gap: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  adjustBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  adjustLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },

  // Skip
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: 16,
    paddingHorizontal: SPACING.xxl,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: `${COLORS.primary}60`,
  },
  skipLabel: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.primary,
  },
});
