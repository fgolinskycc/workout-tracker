import { Exercise, Set, WorkoutExercise, Workout, MuscleGroup, EquipmentType } from '../types';

// ─── Exercise Catalog ─────────────────────────────────────────────────────────

const ex = (
  id: string,
  name: string,
  muscleGroup: MuscleGroup,
  equipment: EquipmentType
): Exercise => ({ id, name, muscleGroup, equipment });

const CATALOG = {
  // Push
  benchPress:     ex('bench-press',     'Bench Press',           'chest',     'barbell'),
  inclineDbPress: ex('incline-db',      'Incline DB Press',      'chest',     'dumbbell'),
  ohp:            ex('ohp',             'Overhead Press',        'shoulders', 'barbell'),
  lateralRaise:   ex('lateral-raise',   'Lateral Raise',         'shoulders', 'dumbbell'),
  tricepPushdown: ex('tricep-pushdown', 'Tricep Pushdown',       'triceps',   'cable'),
  skullCrusher:   ex('skull-crusher',   'Skull Crusher',         'triceps',   'barbell'),
  // Pull
  deadlift:       ex('deadlift',        'Deadlift',              'back',      'barbell'),
  pullUp:         ex('pull-up',         'Pull-ups',              'back',      'bodyweight'),
  barbellRow:     ex('barbell-row',     'Barbell Row',           'back',      'barbell'),
  cableRow:       ex('cable-row',       'Seated Cable Row',      'back',      'cable'),
  facePull:       ex('face-pull',       'Face Pull',             'shoulders', 'cable'),
  barbellCurl:    ex('barbell-curl',    'Barbell Curl',          'biceps',    'barbell'),
  hammerCurl:     ex('hammer-curl',     'Hammer Curl',           'biceps',    'dumbbell'),
  // Legs
  squat:          ex('squat',           'Back Squat',            'legs',      'barbell'),
  rdl:            ex('rdl',             'Romanian Deadlift',     'legs',      'barbell'),
  legPress:       ex('leg-press',       'Leg Press',             'legs',      'machine'),
  legCurl:        ex('leg-curl',        'Leg Curl',              'legs',      'machine'),
  hipThrust:      ex('hip-thrust',      'Hip Thrust',            'glutes',    'barbell'),
  calfRaise:      ex('calf-raise',      'Calf Raise',            'calves',    'machine'),
} as const;

// ─── Set Builder ──────────────────────────────────────────────────────────────

let _idCounter = 0;
const uid = () => `mock-${++_idCounter}`;

const s = (weight: number, reps: number): Set => ({
  id: uid(),
  weight,
  reps,
  unit: 'lbs',
  completed: true,
});

const makeWE = (
  exercise: Exercise,
  sets: Set[],
  notes?: string
): WorkoutExercise => ({ exercise, sets, notes });

// ─── Progressive Overload Tables ──────────────────────────────────────────────
// Index = week number (0 = oldest, 7 = most recent)

const W = {
  bench:      [135, 140, 145, 150, 155, 160, 165, 170],
  ohp:        [95,  97.5, 100, 102.5, 105, 107.5, 110, 112.5],
  inclineDb:  [55,  55,   60,  60,    65,  65,    65,  70],
  lateral:    [20,  20,   22.5, 22.5, 25,  25,    27.5, 27.5],
  tricepPD:   [42.5, 42.5, 45, 45,   47.5, 47.5,  50,  50],
  skull:      [55,  57.5, 57.5, 60,  60,   62.5,  62.5, 65],
  deadlift:   [225, 230, 235, 240, 245, 250, 255, 260],
  pullUpReps: [5,   5,   6,   6,   7,   7,   8,   8],
  row:        [115, 115, 120, 120, 125, 130, 130, 135],
  cableRow:   [100, 100, 105, 105, 110, 110, 115, 120],
  facePull:   [40,  40,  42.5, 42.5, 45, 45,  47.5, 47.5],
  curl:       [65,  65,  67.5, 70,  70,  72.5, 75,  77.5],
  hammer:     [30,  30,  32.5, 32.5, 35, 35,  37.5, 37.5],
  squat:      [155, 160, 165, 170, 175, 180, 185, 190],
  rdl:        [135, 135, 140, 145, 150, 155, 160, 165],
  legPress:   [270, 275, 280, 285, 290, 295, 300, 305],
  legCurl:    [70,  72.5, 72.5, 75, 75,  77.5, 80, 80],
  hipThrust:  [135, 145, 155, 165, 175, 185, 190, 195],
  calf:       [90,  90,  95,  95, 100, 100, 105, 105],
};

// ─── Workout Builders ─────────────────────────────────────────────────────────

function buildPush(w: number, wid: string, daysAgo: number): Workout {
  const b = W.bench[w], o = W.ohp[w], i = W.inclineDb[w];
  const lr = W.lateral[w], tp = W.tricepPD[w], sk = W.skull[w];

  return {
    id: wid,
    title: 'Push Day',
    date: daysAgoISO(daysAgo),
    duration: 55 + w,
    exercises: [
      makeWE(CATALOG.benchPress,     [s(b, 5), s(b, 5), s(b, 5), s(b-5, 5)]),
      makeWE(CATALOG.ohp,            [s(o, 5), s(o, 5), s(o, 5)]),
      makeWE(CATALOG.inclineDbPress, [s(i, 8), s(i, 8), s(i, 8)]),
      makeWE(CATALOG.lateralRaise,   [s(lr, 12), s(lr, 12), s(lr, 15)]),
      makeWE(CATALOG.tricepPushdown, [s(tp, 10), s(tp, 10), s(tp, 12)]),
      makeWE(CATALOG.skullCrusher,   [s(sk, 8), s(sk, 8), s(sk, 8)]),
    ],
  };
}

function buildPull(w: number, wid: string, daysAgo: number): Workout {
  const dl = W.deadlift[w], pu = W.pullUpReps[w], row = W.row[w];
  const cr = W.cableRow[w], fp = W.facePull[w], c = W.curl[w], hc = W.hammer[w];

  return {
    id: wid,
    title: 'Pull Day',
    date: daysAgoISO(daysAgo),
    duration: 50 + w,
    exercises: [
      makeWE(CATALOG.deadlift,    [s(dl, 5), s(dl+10, 3), s(dl+20, 1)]),
      makeWE(CATALOG.pullUp,      [s(0, pu), s(0, pu), s(0, pu-1)]),
      makeWE(CATALOG.barbellRow,  [s(row, 8), s(row, 8), s(row, 8)]),
      makeWE(CATALOG.cableRow,    [s(cr, 10), s(cr, 10), s(cr, 12)]),
      makeWE(CATALOG.facePull,    [s(fp, 15), s(fp, 15), s(fp, 15)]),
      makeWE(CATALOG.barbellCurl, [s(c, 10), s(c, 10), s(c, 10)]),
      makeWE(CATALOG.hammerCurl,  [s(hc, 12), s(hc, 12), s(hc, 12)]),
    ],
  };
}

function buildLegs(w: number, wid: string, daysAgo: number): Workout {
  const sq = W.squat[w], r = W.rdl[w], lp = W.legPress[w];
  const lc = W.legCurl[w], ht = W.hipThrust[w], ca = W.calf[w];

  return {
    id: wid,
    title: 'Leg Day',
    date: daysAgoISO(daysAgo),
    duration: 62 + w,
    exercises: [
      makeWE(CATALOG.squat,    [s(sq, 5), s(sq, 5), s(sq, 5), s(sq+10, 3)]),
      makeWE(CATALOG.rdl,      [s(r, 8), s(r, 8), s(r, 8)]),
      makeWE(CATALOG.legPress, [s(lp, 10), s(lp, 10), s(lp, 12)]),
      makeWE(CATALOG.legCurl,  [s(lc, 12), s(lc, 12), s(lc, 15)]),
      makeWE(CATALOG.hipThrust,[s(ht, 10), s(ht, 10), s(ht, 10)]),
      makeWE(CATALOG.calfRaise,[s(ca, 15), s(ca, 15), s(ca, 20)]),
    ],
  };
}

// ─── Date Helper ──────────────────────────────────────────────────────────────

function daysAgoISO(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(7 + (n % 4), 30, 0, 0); // stagger start times (7:30–10:30 AM)
  return d.toISOString();
}

// ─── Generator ────────────────────────────────────────────────────────────────

/**
 * Returns 24 workouts spread across 8 weeks (Push / Pull / Legs × 8 cycles).
 * Weights increase each week to simulate real progressive overload.
 */
export function generateMockWorkouts(): Workout[] {
  _idCounter = 0; // reset so IDs are deterministic

  // 24 day offsets, 3 workouts/week, newest last (reversed at the end)
  // Pattern: Push on Mon, Pull on Wed, Legs on Fri
  const schedule: Array<{ type: 'push' | 'pull' | 'legs'; daysAgo: number }> = [
    { type: 'push', daysAgo: 56 }, { type: 'pull', daysAgo: 54 }, { type: 'legs', daysAgo: 52 },
    { type: 'push', daysAgo: 49 }, { type: 'pull', daysAgo: 47 }, { type: 'legs', daysAgo: 45 },
    { type: 'push', daysAgo: 42 }, { type: 'pull', daysAgo: 40 }, { type: 'legs', daysAgo: 38 },
    { type: 'push', daysAgo: 35 }, { type: 'pull', daysAgo: 33 }, { type: 'legs', daysAgo: 31 },
    { type: 'push', daysAgo: 28 }, { type: 'pull', daysAgo: 26 }, { type: 'legs', daysAgo: 24 },
    { type: 'push', daysAgo: 21 }, { type: 'pull', daysAgo: 19 }, { type: 'legs', daysAgo: 17 },
    { type: 'push', daysAgo: 14 }, { type: 'pull', daysAgo: 12 }, { type: 'legs', daysAgo: 10 },
    { type: 'push', daysAgo: 7  }, { type: 'pull', daysAgo: 5  }, { type: 'legs', daysAgo: 2  },
  ];

  return schedule.map(({ type, daysAgo }, idx) => {
    const weekIdx = Math.floor(idx / 3); // 0–7
    const wid = `mock-${type}-w${weekIdx}`;

    switch (type) {
      case 'push': return buildPush(weekIdx, wid, daysAgo);
      case 'pull': return buildPull(weekIdx, wid, daysAgo);
      case 'legs': return buildLegs(weekIdx, wid, daysAgo);
    }
  });
}
