import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  memo,
} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../constants/theme';
import { Set, WorkoutExercise, Workout, Exercise, RootTabParamList, QuickStartTemplate } from '../types';
import { WorkoutService } from '../services/WorkoutService';
import { ExercisePickerModal } from '../components/ExercisePickerModal';
import { generateId } from '../utils/helpers';
import { EXERCISE_CATALOG } from '../data/exerciseCatalog';

type WorkoutNavProp = BottomTabNavigationProp<RootTabParamList, 'Workout'>;
type WorkoutRouteProp = RouteProp<RootTabParamList, 'Workout'>;

// ─── Constants ────────────────────────────────────────────────────────────────

const HIT = { top: 12, bottom: 12, left: 12, right: 12 };

const TEMPLATE_DATA: Record<QuickStartTemplate, { title: string; exerciseIds: string[] }> = {
  push:      { title: 'Push Day',  exerciseIds: ['bench-press', 'ohp', 'incline-db-bench', 'tricep-pushdown', 'lateral-raise'] },
  pull:      { title: 'Pull Day',  exerciseIds: ['pull-up', 'barbell-row', 'face-pull', 'barbell-curl', 'hammer-curl'] },
  legs:      { title: 'Leg Day',   exerciseIds: ['back-squat', 'rdl', 'leg-press', 'leg-curl', 'walking-lunge'] },
  full_body: { title: 'Full Body', exerciseIds: ['deadlift', 'bench-press', 'barbell-row', 'ohp'] },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatTimer = (secs: number): string => {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
};

const buildSet = (prev?: Set): Set => ({
  id: generateId(),
  weight: prev?.weight ?? 0,
  reps: prev?.reps ?? 0,
  unit: prev?.unit ?? 'lbs',
  completed: false,
});

// ─── Set Row (animated + haptic) ──────────────────────────────────────────────

interface SetRowProps {
  index: number;
  set: Set;
  onWeightChange: (val: string) => void;
  onRepsChange: (val: string) => void;
  onToggle: () => void;
}

const SetRow = memo<SetRowProps>(({ index, set, onWeightChange, onRepsChange, onToggle }) => {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        damping: 18,
        stiffness: 220,
        useNativeDriver: true,
      }),
    ]).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggle = async () => {
    if (!set.completed) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onToggle();
  };

  return (
    <Animated.View
      style={[
        styles.setRow,
        set.completed && styles.setRowDone,
        { opacity, transform: [{ translateY }] },
      ]}
    >
      {/* Set number */}
      <View style={styles.setNumBox}>
        <Text style={styles.setNum}>{index + 1}</Text>
      </View>

      {/* Weight */}
      <TextInput
        style={[styles.setInput, set.completed && styles.setInputDone]}
        keyboardType="decimal-pad"
        placeholder="—"
        placeholderTextColor={COLORS.textMuted}
        value={set.weight > 0 ? String(set.weight) : ''}
        onChangeText={onWeightChange}
        selectTextOnFocus
        returnKeyType="next"
        editable={!set.completed}
      />

      {/* Reps */}
      <TextInput
        style={[styles.setInput, set.completed && styles.setInputDone]}
        keyboardType="number-pad"
        placeholder="—"
        placeholderTextColor={COLORS.textMuted}
        value={set.reps > 0 ? String(set.reps) : ''}
        onChangeText={onRepsChange}
        selectTextOnFocus
        returnKeyType="done"
        editable={!set.completed}
      />

      {/* Checkmark */}
      <TouchableOpacity
        style={[styles.checkBtn, set.completed && styles.checkBtnDone]}
        onPress={handleToggle}
        hitSlop={HIT}
        activeOpacity={0.7}
      >
        <Ionicons
          name="checkmark"
          size={22}
          color={set.completed ? '#fff' : COLORS.textMuted}
        />
      </TouchableOpacity>
    </Animated.View>
  );
});

// ─── Exercise Card ────────────────────────────────────────────────────────────

interface ExerciseCardProps {
  we: WorkoutExercise;
  exIdx: number;
  onRemoveExercise: (idx: number) => void;
  onAddSet: (idx: number) => void;
  onRemoveLastSet: (idx: number) => void;
  onUpdateSet: (exIdx: number, setId: string, field: 'weight' | 'reps', val: string) => void;
  onToggleSet: (exIdx: number, setId: string) => void;
}

const ExerciseCard = memo<ExerciseCardProps>(({
  we, exIdx,
  onRemoveExercise, onAddSet, onRemoveLastSet,
  onUpdateSet, onToggleSet,
}) => {
  const completedCount = we.sets.filter((s) => s.completed).length;
  const allDone = completedCount === we.sets.length && we.sets.length > 0;

  return (
    <View style={[styles.card, allDone && styles.cardDone]}>
      {/* Card header */}
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          {allDone && (
            <Ionicons
              name="checkmark-circle"
              size={18}
              color={COLORS.secondary}
              style={{ marginRight: 6 }}
            />
          )}
          <Text style={styles.cardTitle} numberOfLines={1}>
            {we.exercise.name}
          </Text>
        </View>
        <View style={styles.cardHeaderRight}>
          <Text style={[styles.setProgress, allDone && styles.setProgressDone]}>
            {completedCount}/{we.sets.length}
          </Text>
          <TouchableOpacity
            onPress={() => onRemoveExercise(exIdx)}
            hitSlop={HIT}
            style={styles.removeExBtn}
          >
            <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Column labels */}
      <View style={styles.colLabels}>
        <Text style={[styles.colLabel, styles.colSet]}>SET</Text>
        <Text style={[styles.colLabel, styles.colInput, { textAlign: 'center' }]}>LBS</Text>
        <Text style={[styles.colLabel, styles.colInput, { textAlign: 'center' }]}>REPS</Text>
        <Text style={[styles.colLabel, styles.colCheck, { textAlign: 'center' }]}>✓</Text>
      </View>

      {/* Sets */}
      {we.sets.map((set, setIdx) => (
        <SetRow
          key={set.id}
          index={setIdx}
          set={set}
          onWeightChange={(v) => onUpdateSet(exIdx, set.id, 'weight', v)}
          onRepsChange={(v) => onUpdateSet(exIdx, set.id, 'reps', v)}
          onToggle={() => onToggleSet(exIdx, set.id)}
        />
      ))}

      {/* Set actions */}
      <View style={styles.setActions}>
        <TouchableOpacity
          style={styles.addSetBtn}
          onPress={() => onAddSet(exIdx)}
          activeOpacity={0.7}
        >
          <Ionicons name="add-circle-outline" size={20} color={COLORS.primary} />
          <Text style={styles.addSetLabel}>Add Set</Text>
        </TouchableOpacity>

        {we.sets.length > 1 && (
          <TouchableOpacity onPress={() => onRemoveLastSet(exIdx)} hitSlop={HIT}>
            <Text style={styles.removeSetLabel}>Remove Last</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export const WorkoutScreen: React.FC = () => {
  const navigation = useNavigation<WorkoutNavProp>();
  const route      = useRoute<WorkoutRouteProp>();

  const [title, setTitle]       = useState('');
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [elapsed, setElapsed]   = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const scrollRef          = useRef<ScrollView>(null);
  const timerRef           = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevLen            = useRef(0);
  const exercisesRef       = useRef(exercises);
  const appliedTemplateRef = useRef<string | null>(null);
  exercisesRef.current = exercises;

  // ── Timer ────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRunning]);

  useEffect(() => {
    if (exercises.length > 0 && !isRunning) setIsRunning(true);
    if (exercises.length > prevLen.current) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
    }
    prevLen.current = exercises.length;
  }, [exercises.length, isRunning]);

  // ── Template ─────────────────────────────────────────────────────────────────

  const applyTemplate = useCallback((template: QuickStartTemplate) => {
    const data = TEMPLATE_DATA[template];
    const templateExercises: WorkoutExercise[] = data.exerciseIds
      .map((id) => EXERCISE_CATALOG.find((e) => e.id === id))
      .filter((ex): ex is Exercise => ex !== undefined)
      .map((exercise) => ({
        exercise,
        sets: [buildSet(), buildSet(), buildSet()],
      }));
    setTitle(data.title);
    setExercises(templateExercises);
  }, []);

  useFocusEffect(
    useCallback(() => {
      const template = route.params?.template;
      if (
        template &&
        template !== appliedTemplateRef.current &&
        exercisesRef.current.length === 0
      ) {
        appliedTemplateRef.current = template;
        applyTemplate(template);
      }
    }, [route.params?.template, applyTemplate])
  );

  // ── Exercise mutations ───────────────────────────────────────────────────────

  const handleAddExercise = useCallback((exercise: Exercise) => {
    setExercises((prev) => [...prev, { exercise, sets: [buildSet()] }]);
  }, []);

  const removeExercise = useCallback((idx: number) => {
    Alert.alert('Remove Exercise', 'Remove this exercise and all its sets?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => setExercises((prev) => prev.filter((_, i) => i !== idx)),
      },
    ]);
  }, []);

  const addSet = useCallback((exIdx: number) => {
    setExercises((prev) =>
      prev.map((we, i) => {
        if (i !== exIdx) return we;
        const lastSet = we.sets[we.sets.length - 1];
        return { ...we, sets: [...we.sets, buildSet(lastSet)] };
      })
    );
  }, []);

  const removeLastSet = useCallback((exIdx: number) => {
    setExercises((prev) =>
      prev.map((we, i) =>
        i === exIdx ? { ...we, sets: we.sets.slice(0, -1) } : we
      )
    );
  }, []);

  const updateSet = useCallback(
    (exIdx: number, setId: string, field: 'weight' | 'reps', val: string) => {
      const num = parseFloat(val) || 0;
      setExercises((prev) =>
        prev.map((we, i) =>
          i === exIdx
            ? { ...we, sets: we.sets.map((s) => (s.id === setId ? { ...s, [field]: num } : s)) }
            : we
        )
      );
    },
    []
  );

  const toggleSet = useCallback((exIdx: number, setId: string) => {
    setExercises((prev) =>
      prev.map((we, i) =>
        i === exIdx
          ? { ...we, sets: we.sets.map((s) => (s.id === setId ? { ...s, completed: !s.completed } : s)) }
          : we
      )
    );
  }, []);

  // ── Save / Discard ───────────────────────────────────────────────────────────

  const reset = useCallback(() => {
    setIsRunning(false);
    setElapsed(0);
    setTitle('');
    setExercises([]);
    setSaving(false);
    prevLen.current = 0;
    appliedTemplateRef.current = null;
  }, []);

  const confirmDiscard = useCallback(() => {
    Alert.alert('Discard Workout?', 'All progress will be lost.', [
      { text: 'Keep Going', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: reset },
    ]);
  }, [reset]);

  const finishWorkout = async () => {
    if (exercises.length === 0) {
      Alert.alert('No exercises', 'Add at least one exercise first.');
      return;
    }

    const workout: Workout = {
      id: generateId(),
      title: title.trim() || 'Workout',
      date: new Date().toISOString(),
      duration: Math.max(1, Math.round(elapsed / 60)),
      exercises,
    };

    setSaving(true);
    setIsRunning(false);

    try {
      await WorkoutService.save(workout);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Saved!',
        `"${workout.title}" — ${workout.exercises.length} exercises, ${workout.duration} min`,
        [
          { text: 'View History', onPress: () => { reset(); navigation.navigate('History'); } },
          { text: 'New Workout',  onPress: reset },
        ]
      );
    } catch {
      setSaving(false);
      setIsRunning(true);
      Alert.alert('Error', 'Failed to save. Please try again.');
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  const hasExercises = exercises.length > 0;

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      {/* ── Timer Bar ── */}
      <View style={[styles.timerBar, isRunning && styles.timerBarActive]}>
        <View style={styles.timerLeft}>
          <View style={[styles.dot, isRunning && styles.dotActive]} />
          <Text style={[styles.timerText, isRunning && styles.timerTextActive]}>
            {formatTimer(elapsed)}
          </Text>
        </View>
        {hasExercises ? (
          <TouchableOpacity style={styles.discardBtn} onPress={confirmDiscard} hitSlop={HIT}>
            <Ionicons name="close-circle-outline" size={20} color={COLORS.danger} />
            <Text style={styles.discardLabel}>Discard</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.timerHint}>Start adding exercises</Text>
        )}
      </View>

      {/* ── Scrollable body ── */}
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          hasExercises && styles.scrollContentWithFooter,
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TextInput
          style={styles.titleInput}
          placeholder={`Workout — ${new Date().toLocaleDateString('en-US', { weekday: 'long' })}`}
          placeholderTextColor={COLORS.textMuted}
          value={title}
          onChangeText={setTitle}
          returnKeyType="done"
          maxLength={60}
        />

        {exercises.map((we, idx) => (
          <ExerciseCard
            key={`${we.exercise.id}-${idx}`}
            we={we}
            exIdx={idx}
            onRemoveExercise={removeExercise}
            onAddSet={addSet}
            onRemoveLastSet={removeLastSet}
            onUpdateSet={updateSet}
            onToggleSet={toggleSet}
          />
        ))}

        {!hasExercises && (
          <View style={styles.emptyState}>
            <Ionicons name="barbell-outline" size={64} color={COLORS.border} />
            <Text style={styles.emptyTitle}>Ready to train?</Text>
            <Text style={styles.emptyHint}>Tap below to add your first exercise</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.addExBtn}
          onPress={() => setShowPicker(true)}
          activeOpacity={0.75}
        >
          <Ionicons name="add-circle" size={26} color={COLORS.primary} />
          <Text style={styles.addExLabel}>Add Exercise</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Finish bar ── */}
      {hasExercises && (
        <View style={styles.finishBar}>
          <TouchableOpacity
            style={[styles.finishBtn, saving && styles.finishBtnDisabled]}
            onPress={finishWorkout}
            disabled={saving}
            activeOpacity={0.85}
          >
            <Ionicons
              name={saving ? 'hourglass-outline' : 'checkmark-done'}
              size={24}
              color="#fff"
            />
            <Text style={styles.finishLabel}>
              {saving ? 'Saving…' : 'Finish Workout'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <ExercisePickerModal
        visible={showPicker}
        onClose={() => setShowPicker(false)}
        onSelect={handleAddExercise}
      />
    </KeyboardAvoidingView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // ── Timer bar ──────────────────────────────────────────────────────────────
  timerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: Platform.OS === 'ios' ? 56 : SPACING.md,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  timerBarActive: {
    borderBottomColor: `${COLORS.secondary}50`,
  },
  timerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.border,
  },
  dotActive: {
    backgroundColor: COLORS.secondary,
  },
  timerText: {
    fontSize: 38,
    fontWeight: '700',
    color: COLORS.textMuted,
    fontVariant: ['tabular-nums'],
    letterSpacing: 1,
  },
  timerTextActive: {
    color: COLORS.secondary,
  },
  timerHint: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  discardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
  },
  discardLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.danger,
    fontWeight: '600',
  },

  // ── Scroll area ──────────────────────────────────────────────────────────
  scroll: { flex: 1 },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  scrollContentWithFooter: {
    paddingBottom: 100,
  },

  // ── Title input ──────────────────────────────────────────────────────────
  titleInput: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 16,
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  // ── Exercise card ────────────────────────────────────────────────────────
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardDone: {
    borderColor: `${COLORS.secondary}60`,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  cardTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
    color: COLORS.text,
    flex: 1,
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  setProgress: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  setProgressDone: {
    color: COLORS.secondary,
  },
  removeExBtn: { padding: 4 },

  // ── Column labels ────────────────────────────────────────────────────────
  colLabels: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: SPACING.sm,
  },
  colLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  colSet:   { flex: 0.15, textAlign: 'center' },
  colInput: { flex: 0.35 },
  colCheck: { flex: 0.15, textAlign: 'center' },

  // ── Set row ──────────────────────────────────────────────────────────────
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
    borderRadius: RADIUS.sm,
    padding: 4,
  },
  setRowDone: {
    backgroundColor: `${COLORS.secondary}12`,
    borderRadius: RADIUS.sm,
  },
  setNumBox: {
    flex: 0.15,
    alignItems: 'center',
  },
  setNum: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  setInput: {
    flex: 0.35,
    height: 56,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  setInputDone: {
    backgroundColor: `${COLORS.secondary}18`,
    borderColor: `${COLORS.secondary}40`,
    color: COLORS.textSecondary,
  },
  checkBtn: {
    flex: 0.15,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  checkBtnDone: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
  },

  // ── Set actions ──────────────────────────────────────────────────────────
  setActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  addSetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
  },
  addSetLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.primary,
  },
  removeSetLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.danger,
    fontWeight: '600',
  },

  // ── Empty state ──────────────────────────────────────────────────────────
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    gap: SPACING.sm,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  emptyHint: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },

  // ── Add exercise button ──────────────────────────────────────────────────
  addExBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: 22,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: `${COLORS.primary}60`,
    borderStyle: 'dashed',
    marginTop: SPACING.sm,
  },
  addExLabel: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.primary,
  },

  // ── Finish bar ───────────────────────────────────────────────────────────
  finishBar: {
    paddingHorizontal: SPACING.md,
    paddingBottom: Platform.OS === 'ios' ? 28 : SPACING.md,
    paddingTop: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  finishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 5,
  },
  finishBtnDisabled: {
    opacity: 0.55,
  },
  finishLabel: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.3,
  },
});
