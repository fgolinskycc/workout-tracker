import React, { useState, useMemo, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ListRenderItemInfo,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Exercise, MuscleGroup } from '../types';
import {
  EXERCISE_CATALOG,
  MUSCLE_GROUP_LABELS,
  EQUIPMENT_LABELS,
  ORDERED_MUSCLE_GROUPS,
} from '../data/exerciseCatalog';
import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

type MuscleFilter = MuscleGroup | 'all';

type ListItem =
  | { type: 'header'; key: string; title: string; count: number }
  | { type: 'exercise'; key: string; exercise: Exercise };

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const ExercisePickerModal: React.FC<Props> = ({ visible, onClose, onSelect }) => {
  const [search, setSearch] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleFilter>('all');

  const resetFilters = useCallback(() => {
    setSearch('');
    setSelectedMuscle('all');
  }, []);

  // Build the flat list data (includes section headers when showing all)
  const listData = useMemo((): ListItem[] => {
    const q = search.trim().toLowerCase();

    const filtered = EXERCISE_CATALOG.filter((ex) => {
      const matchMuscle = selectedMuscle === 'all' || ex.muscleGroup === selectedMuscle;
      const matchSearch =
        !q ||
        ex.name.toLowerCase().includes(q) ||
        MUSCLE_GROUP_LABELS[ex.muscleGroup].toLowerCase().includes(q) ||
        EQUIPMENT_LABELS[ex.equipment].toLowerCase().includes(q);
      return matchMuscle && matchSearch;
    });

    // When a specific group is chosen or user is searching, show flat list
    if (selectedMuscle !== 'all' || q) {
      return filtered.map((ex) => ({ type: 'exercise', key: ex.id, exercise: ex }));
    }

    // Default: group by muscle with section headers
    const items: ListItem[] = [];
    for (const muscle of ORDERED_MUSCLE_GROUPS) {
      const group = filtered.filter((ex) => ex.muscleGroup === muscle);
      if (group.length === 0) continue;
      items.push({
        type: 'header',
        key: `header-${muscle}`,
        title: MUSCLE_GROUP_LABELS[muscle],
        count: group.length,
      });
      group.forEach((ex) =>
        items.push({ type: 'exercise', key: ex.id, exercise: ex })
      );
    }
    return items;
  }, [search, selectedMuscle]);

  const handleSelect = useCallback(
    (exercise: Exercise) => {
      onSelect(exercise);
      onClose();
    },
    [onSelect, onClose]
  );

  const renderItem = ({ item }: ListRenderItemInfo<ListItem>) => {
    if (item.type === 'header') {
      return (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{item.title}</Text>
          <Text style={styles.sectionCount}>{item.count}</Text>
        </View>
      );
    }

    const { exercise } = item;
    return (
      <TouchableOpacity
        style={styles.exerciseRow}
        onPress={() => handleSelect(exercise)}
        activeOpacity={0.6}
      >
        <View style={styles.exerciseInfo}>
          <Text style={styles.exerciseName}>{exercise.name}</Text>
          <View style={styles.tagRow}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>
                {MUSCLE_GROUP_LABELS[exercise.muscleGroup]}
              </Text>
            </View>
            <View style={[styles.tag, styles.tagEquip]}>
              <Text style={[styles.tagText, styles.tagEquipText]}>
                {EQUIPMENT_LABELS[exercise.equipment]}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.addIcon}>
          <Ionicons name="add" size={22} color={COLORS.primary} />
        </View>
      </TouchableOpacity>
    );
  };

  const FILTER_CHIPS: { key: MuscleFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    ...ORDERED_MUSCLE_GROUPS.map((m) => ({ key: m, label: MUSCLE_GROUP_LABELS[m] })),
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onShow={resetFilters}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          {/* ── Header ── */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Choose Exercise</Text>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={26} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          {/* ── Search bar ── */}
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color={COLORS.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search exercises…"
              placeholderTextColor={COLORS.textMuted}
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
              returnKeyType="search"
            />
          </View>

          {/* ── Muscle group chips ── */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {FILTER_CHIPS.map(({ key, label }) => {
              const active = selectedMuscle === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setSelectedMuscle(key)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* ── Divider ── */}
          <View style={styles.divider} />

          {/* ── Exercise list ── */}
          <FlatList
            data={listData}
            keyExtractor={(item) => item.key}
            renderItem={renderItem}
            keyboardShouldPersistTaps="handled"
            initialNumToRender={25}
            maxToRenderPerBatch={20}
            windowSize={5}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="search-outline" size={48} color={COLORS.textMuted} />
                <Text style={styles.emptyText}>No exercises found</Text>
                <Text style={styles.emptyHint}>Try a different name or filter</Text>
              </View>
            }
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.text,
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.full,
  },

  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    margin: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZES.lg,
    color: COLORS.text,
    padding: 0,
  },

  // Filter chips
  chipsRow: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    gap: SPACING.sm,
    flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  chipLabelActive: {
    color: '#fff',
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.border,
  },

  // List
  listContent: {
    paddingBottom: SPACING.xxl,
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xs,
    backgroundColor: COLORS.background,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  sectionCount: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    fontWeight: '600',
  },

  // Exercise row — 72px tall minimum for gym use
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 18,
    backgroundColor: COLORS.surface,
    minHeight: 72,
  },
  exerciseInfo: {
    flex: 1,
    gap: 6,
  },
  exerciseName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  tagRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: `${COLORS.primary}18`,
    borderRadius: RADIUS.full,
  },
  tagText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.primary,
  },
  tagEquip: {
    backgroundColor: COLORS.background,
  },
  tagEquipText: {
    color: COLORS.textMuted,
  },
  addIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: `${COLORS.primary}18`,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.sm,
  },

  separator: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: SPACING.md,
  },

  // Empty state
  empty: {
    alignItems: 'center',
    paddingTop: SPACING.xxl * 2,
    gap: SPACING.sm,
  },
  emptyText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  emptyHint: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
  },
});
