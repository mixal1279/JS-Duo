import { Question } from '../types';

const STORAGE_KEY = 'js_duo_spaced_repetition_v1';

export interface ReviewRecord {
  questionId: number;
  dueAt: number;
  intervalDays: number;
  repetitions: number;
  easeFactor: number;
  lastReviewedAt?: number;
  lastQuality?: number;
}

function readRecords(): ReviewRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is ReviewRecord =>
      item && typeof item.questionId === 'number' &&
      typeof item.dueAt === 'number' &&
      typeof item.intervalDays === 'number' &&
      typeof item.repetitions === 'number' &&
      typeof item.easeFactor === 'number'
    );
  } catch {
    return [];
  }
}

function writeRecords(records: ReviewRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    // Storage may be unavailable in private browsing; review still works for this session.
  }
}

/** Add newly learned questions to the review queue without resetting existing scheduling. */
export function enqueueQuestionsForReview(questionIds: number[]): void {
  const records = readRecords();
  const known = new Set(records.map((record) => record.questionId));
  const now = Date.now();
  for (const questionId of questionIds) {
    if (!Number.isFinite(questionId) || known.has(questionId)) continue;
    records.push({
      questionId,
      dueAt: now,
      intervalDays: 0,
      repetitions: 0,
      easeFactor: 2.5,
    });
    known.add(questionId);
  }
  writeRecords(records);
}

export function getReviewRecords(): ReviewRecord[] {
  return readRecords();
}

export function getDueReviewQuestions(allQuestions: Question[], limit = 10, includeFuture = false): Question[] {
  const now = Date.now();
  const byId = new Map(allQuestions.map((question) => [question.id, question]));
  return readRecords()
    .filter((record) => includeFuture || record.dueAt <= now)
    .sort((a, b) => a.dueAt - b.dueAt)
    .map((record) => byId.get(record.questionId))
    .filter((question): question is Question => Boolean(question))
    .slice(0, limit);
}

/** SM-2-inspired scheduling. Quality 0–2 means failed; 3–5 means recalled successfully. */
export function gradeReview(questionId: number, quality: number): void {
  const boundedQuality = Math.max(0, Math.min(5, Math.round(quality)));
  const records = readRecords();
  const index = records.findIndex((record) => record.questionId === questionId);
  if (index < 0) {
    records.push({
      questionId,
      dueAt: Date.now() + 24 * 60 * 60 * 1000,
      intervalDays: 1,
      repetitions: boundedQuality >= 3 ? 1 : 0,
      easeFactor: 2.5,
      lastReviewedAt: Date.now(),
      lastQuality: boundedQuality,
    });
    writeRecords(records);
    return;
  }

  const current = records[index];
  let intervalDays = current.intervalDays;
  let repetitions = current.repetitions;
  if (boundedQuality < 3) {
    repetitions = 0;
    intervalDays = 1;
  } else {
    repetitions += 1;
    if (repetitions === 1) intervalDays = 1;
    else if (repetitions === 2) intervalDays = 3;
    else intervalDays = Math.max(1, Math.round(Math.max(1, intervalDays) * current.easeFactor));
  }

  const easeFactor = Math.max(
    1.3,
    current.easeFactor + (0.1 - (5 - boundedQuality) * (0.08 + (5 - boundedQuality) * 0.02))
  );
  records[index] = {
    ...current,
    intervalDays,
    repetitions,
    easeFactor,
    dueAt: Date.now() + intervalDays * 24 * 60 * 60 * 1000,
    lastReviewedAt: Date.now(),
    lastQuality: boundedQuality,
  };
  writeRecords(records);
}

export function getReviewSummary(): { due: number; scheduled: number; mastered: number } {
  const records = readRecords();
  const now = Date.now();
  return {
    due: records.filter((record) => record.dueAt <= now).length,
    scheduled: records.length,
    mastered: records.filter((record) => record.repetitions >= 3).length,
  };
}

export function clearReviewSchedule(): void {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* no-op */ }
}
