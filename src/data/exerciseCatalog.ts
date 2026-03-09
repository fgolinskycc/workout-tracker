import { Exercise, MuscleGroup, EquipmentType } from '../types';

const e = (
  id: string,
  name: string,
  muscleGroup: MuscleGroup,
  equipment: EquipmentType
): Exercise => ({ id, name, muscleGroup, equipment });

// ─── Full Catalog ─────────────────────────────────────────────────────────────

export const EXERCISE_CATALOG: Exercise[] = [
  // ── Chest ──────────────────────────────────────────────────────────────────
  e('bench-press',       'Barbell Bench Press',      'chest',     'barbell'),
  e('incline-bench',     'Incline Barbell Press',    'chest',     'barbell'),
  e('decline-bench',     'Decline Barbell Press',    'chest',     'barbell'),
  e('db-bench',          'Dumbbell Bench Press',     'chest',     'dumbbell'),
  e('incline-db-bench',  'Incline Dumbbell Press',   'chest',     'dumbbell'),
  e('decline-db-bench',  'Decline Dumbbell Press',   'chest',     'dumbbell'),
  e('cable-fly',         'Cable Fly',                'chest',     'cable'),
  e('pec-deck',          'Pec Deck',                 'chest',     'machine'),
  e('push-up',           'Push-up',                  'chest',     'bodyweight'),
  e('chest-dip',         'Chest Dip',                'chest',     'bodyweight'),

  // ── Back ───────────────────────────────────────────────────────────────────
  e('deadlift',          'Deadlift',                 'back',      'barbell'),
  e('barbell-row',       'Barbell Row',              'back',      'barbell'),
  e('t-bar-row',         'T-Bar Row',                'back',      'barbell'),
  e('pull-up',           'Pull-up',                  'back',      'bodyweight'),
  e('chin-up',           'Chin-up',                  'back',      'bodyweight'),
  e('lat-pulldown',      'Lat Pulldown',             'back',      'machine'),
  e('seated-cable-row',  'Seated Cable Row',         'back',      'cable'),
  e('single-arm-row',    'Single-Arm DB Row',        'back',      'dumbbell'),
  e('face-pull',         'Face Pull',                'back',      'cable'),
  e('hyperextension',    'Hyperextension',           'back',      'bodyweight'),

  // ── Shoulders ──────────────────────────────────────────────────────────────
  e('ohp',               'Overhead Press',           'shoulders', 'barbell'),
  e('db-shoulder-press', 'Dumbbell Shoulder Press',  'shoulders', 'dumbbell'),
  e('arnold-press',      'Arnold Press',             'shoulders', 'dumbbell'),
  e('lateral-raise',     'Lateral Raise',            'shoulders', 'dumbbell'),
  e('cable-lateral',     'Cable Lateral Raise',      'shoulders', 'cable'),
  e('front-raise',       'Front Raise',              'shoulders', 'dumbbell'),
  e('rear-delt-fly',     'Rear Delt Fly',            'shoulders', 'dumbbell'),
  e('upright-row',       'Upright Row',              'shoulders', 'barbell'),

  // ── Biceps ─────────────────────────────────────────────────────────────────
  e('barbell-curl',      'Barbell Curl',             'biceps',    'barbell'),
  e('ez-bar-curl',       'EZ-Bar Curl',              'biceps',    'barbell'),
  e('db-curl',           'Dumbbell Curl',            'biceps',    'dumbbell'),
  e('hammer-curl',       'Hammer Curl',              'biceps',    'dumbbell'),
  e('incline-db-curl',   'Incline Dumbbell Curl',    'biceps',    'dumbbell'),
  e('cable-curl',        'Cable Curl',               'biceps',    'cable'),
  e('preacher-curl',     'Preacher Curl',            'biceps',    'machine'),
  e('concentration-curl','Concentration Curl',       'biceps',    'dumbbell'),

  // ── Triceps ────────────────────────────────────────────────────────────────
  e('tricep-pushdown',   'Tricep Pushdown',          'triceps',   'cable'),
  e('rope-pushdown',     'Rope Pushdown',            'triceps',   'cable'),
  e('skull-crusher',     'Skull Crusher',            'triceps',   'barbell'),
  e('close-grip-bench',  'Close-Grip Bench Press',   'triceps',   'barbell'),
  e('overhead-tri-ext',  'Overhead Tricep Extension','triceps',   'dumbbell'),
  e('cable-overhead-ext','Cable Overhead Extension', 'triceps',   'cable'),
  e('tricep-dip',        'Tricep Dip',               'triceps',   'bodyweight'),

  // ── Legs ───────────────────────────────────────────────────────────────────
  e('back-squat',        'Back Squat',               'legs',      'barbell'),
  e('front-squat',       'Front Squat',              'legs',      'barbell'),
  e('rdl',               'Romanian Deadlift',        'legs',      'barbell'),
  e('leg-press',         'Leg Press',                'legs',      'machine'),
  e('leg-extension',     'Leg Extension',            'legs',      'machine'),
  e('leg-curl',          'Lying Leg Curl',           'legs',      'machine'),
  e('seated-leg-curl',   'Seated Leg Curl',          'legs',      'machine'),
  e('hack-squat',        'Hack Squat',               'legs',      'machine'),
  e('bulgarian-split',   'Bulgarian Split Squat',    'legs',      'dumbbell'),
  e('walking-lunge',     'Walking Lunge',            'legs',      'dumbbell'),

  // ── Glutes ─────────────────────────────────────────────────────────────────
  e('hip-thrust',        'Hip Thrust',               'glutes',    'barbell'),
  e('sumo-deadlift',     'Sumo Deadlift',            'glutes',    'barbell'),
  e('glute-bridge',      'Glute Bridge',             'glutes',    'bodyweight'),
  e('glute-kickback',    'Cable Glute Kickback',     'glutes',    'cable'),
  e('cable-pull-through','Cable Pull-Through',       'glutes',    'cable'),

  // ── Core ───────────────────────────────────────────────────────────────────
  e('plank',             'Plank',                    'core',      'bodyweight'),
  e('ab-wheel',          'Ab Wheel Rollout',         'core',      'other'),
  e('cable-crunch',      'Cable Crunch',             'core',      'cable'),
  e('hanging-leg-raise', 'Hanging Leg Raise',        'core',      'bodyweight'),
  e('russian-twist',     'Russian Twist',            'core',      'bodyweight'),
  e('decline-sit-up',    'Decline Sit-up',           'core',      'bodyweight'),
  e('dragon-flag',       'Dragon Flag',              'core',      'bodyweight'),

  // ── Calves ─────────────────────────────────────────────────────────────────
  e('standing-calf',     'Standing Calf Raise',      'calves',    'machine'),
  e('seated-calf',       'Seated Calf Raise',        'calves',    'machine'),
  e('calf-press',        'Calf Press on Leg Press',  'calves',    'machine'),

  // ── Forearms ───────────────────────────────────────────────────────────────
  e('wrist-curl',        'Wrist Curl',               'forearms',  'barbell'),
  e('reverse-wrist-curl','Reverse Wrist Curl',       'forearms',  'barbell'),
  e('farmers-walk',      "Farmer's Walk",            'forearms',  'dumbbell'),

  // ── Full Body ──────────────────────────────────────────────────────────────
  e('barbell-clean',     'Barbell Clean',            'full_body', 'barbell'),
  e('kettlebell-swing',  'Kettlebell Swing',         'full_body', 'kettlebell'),
  e('thruster',          'Thruster',                 'full_body', 'barbell'),
  e('burpee',            'Burpee',                   'full_body', 'bodyweight'),

  // ── Cardio ─────────────────────────────────────────────────────────────────
  e('treadmill',         'Treadmill',                'cardio',    'machine'),
  e('stationary-bike',   'Stationary Bike',          'cardio',    'machine'),
  e('rowing-machine',    'Rowing Machine',           'cardio',    'machine'),
  e('elliptical',        'Elliptical',               'cardio',    'machine'),
  e('jump-rope',         'Jump Rope',                'cardio',    'other'),
];

// ─── Display Labels ───────────────────────────────────────────────────────────

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  chest:     'Chest',
  back:      'Back',
  shoulders: 'Shoulders',
  biceps:    'Biceps',
  triceps:   'Triceps',
  legs:      'Legs',
  glutes:    'Glutes',
  core:      'Core',
  calves:    'Calves',
  forearms:  'Forearms',
  full_body: 'Full Body',
  cardio:    'Cardio',
};

export const EQUIPMENT_LABELS: Record<EquipmentType, string> = {
  barbell:         'Barbell',
  dumbbell:        'Dumbbell',
  machine:         'Machine',
  cable:           'Cable',
  bodyweight:      'Bodyweight',
  kettlebell:      'Kettlebell',
  resistance_band: 'Band',
  other:           'Other',
};

// ─── Ordered for display ──────────────────────────────────────────────────────

export const ORDERED_MUSCLE_GROUPS: MuscleGroup[] = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps',
  'legs', 'glutes', 'core', 'calves', 'forearms',
  'full_body', 'cardio',
];
