import Storage from 'expo-sqlite/kv-store';
import { useSyncExternalStore } from 'react';

import { PRACTICE, QUIZZES, type BadgeId, type QuizId } from './content';

/** Academy progress stays on this phone. */
export type Progress = {
  points: number;
  /** Practice messages answered correctly at least once (points are given only once each). */
  practiceMastered: string[];
  /** Best score per quiz. */
  quizBest: Partial<Record<QuizId, number>>;
  streak: { lastDay: string; days: number };
  badges: BadgeId[];
};

const KEY = 'academy.progress';
const EMPTY: Progress = {
  points: 0,
  practiceMastered: [],
  quizBest: {},
  streak: { lastDay: '', days: 0 },
  badges: [],
};

export const POINTS_PER_ANSWER = 10;
const PERFECT_QUIZ_BONUS = 20;

/** Points needed for each level. The most you can earn is 280. */
export const LEVELS = [
  { id: 'learner', min: 0 },
  { id: 'spotter', min: 60 },
  { id: 'defender', min: 140 },
  { id: 'buster', min: 220 },
] as const;
export type LevelId = (typeof LEVELS)[number]['id'];

export function levelFor(points: number) {
  let index = 0;
  LEVELS.forEach((l, i) => {
    if (points >= l.min) index = i;
  });
  const current = LEVELS[index]!;
  const next = LEVELS[index + 1] ?? null;
  return { current, next, toNext: next ? next.min - points : 0 };
}

// --- Store (one in-memory copy, saved to the phone on every change) ---

let progress: Progress = load();
const listeners = new Set<() => void>();

function load(): Progress {
  try {
    const raw = Storage.getItemSync(KEY);
    return raw ? { ...EMPTY, ...(JSON.parse(raw) as Progress) } : EMPTY;
  } catch {
    return EMPTY;
  }
}

function save(next: Progress): void {
  progress = next;
  Storage.setItemSync(KEY, JSON.stringify(next));
  listeners.forEach((l) => l());
}

export function useProgress(): Progress {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => progress,
  );
}

// --- Updates. Each returns what changed, so screens can show it. ---

export type Earned = { points: number; badges: BadgeId[] };

/** "YYYY-MM-DD" in local time. */
const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function withStreak(p: Progress, now: Date): Progress {
  const today = dayKey(now);
  if (p.streak.lastDay === today) return p;
  const yesterday = dayKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
  const days = p.streak.lastDay === yesterday ? p.streak.days + 1 : 1;
  return { ...p, streak: { lastDay: today, days } };
}

function withBadges(p: Progress): { next: Progress; added: BadgeId[] } {
  const earned = new Set(p.badges);
  const added: BadgeId[] = [];
  const give = (id: BadgeId, when: boolean) => {
    if (when && !earned.has(id)) {
      earned.add(id);
      added.push(id);
    }
  };
  const scamIds = PRACTICE.filter((i) => i.isScam).map((i) => i.id);
  give(
    'first_catch',
    p.practiceMastered.some((id) => scamIds.includes(id)),
  );
  give(
    'sharp_eye',
    PRACTICE.every((i) => p.practiceMastered.includes(i.id)),
  );
  for (const quiz of QUIZZES) give(quiz.badge, p.quizBest[quiz.id] === quiz.questions.length);
  give('streak_3', p.streak.days >= 3);
  return { next: { ...p, badges: [...earned] }, added };
}

/** One practice answer. Points only the first time a message is answered correctly. */
export function recordPractice(itemId: string, correct: boolean, now = new Date()): Earned {
  let next = withStreak(progress, now);
  let points = 0;
  if (correct && !next.practiceMastered.includes(itemId)) {
    points = POINTS_PER_ANSWER;
    next = {
      ...next,
      points: next.points + points,
      practiceMastered: [...next.practiceMastered, itemId],
    };
  }
  const { next: withNew, added } = withBadges(next);
  save(withNew);
  return { points, badges: added };
}

/** A finished quiz. Points only for beating your best score, plus a bonus the first time it is perfect. */
export function recordQuiz(quizId: QuizId, score: number, now = new Date()): Earned {
  const quiz = QUIZZES.find((q) => q.id === quizId)!;
  let next = withStreak(progress, now);
  const best = next.quizBest[quizId] ?? 0;
  let points = 0;
  if (score > best) {
    points = (score - best) * POINTS_PER_ANSWER;
    if (score === quiz.questions.length) points += PERFECT_QUIZ_BONUS;
    next = {
      ...next,
      points: next.points + points,
      quizBest: { ...next.quizBest, [quizId]: score },
    };
  }
  const { next: withNew, added } = withBadges(next);
  save(withNew);
  return { points, badges: added };
}

/** A streak only counts while it is not broken (practised today or yesterday). */
export function activeStreak(p: Progress, now = new Date()): number {
  const today = dayKey(now);
  const yesterday = dayKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
  return p.streak.lastDay === today || p.streak.lastDay === yesterday ? p.streak.days : 0;
}

/** Pick `count` practice messages, mixing scams and genuine ones, in random order. */
export function practiceSession(count = 5): typeof PRACTICE {
  const shuffle = <T>(a: T[]) => {
    const out = [...a];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j]!, out[i]!];
    }
    return out;
  };
  const scams = shuffle(PRACTICE.filter((i) => i.isScam));
  const real = shuffle(PRACTICE.filter((i) => !i.isScam));
  // About one in three is genuine, so "everything is a scam" does not win.
  const realCount = Math.max(1, Math.round(count / 3));
  return shuffle([...real.slice(0, realCount), ...scams.slice(0, count - realCount)]);
}
