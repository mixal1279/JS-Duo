import { Question } from '../types';
import { UNIT_1_QUESTIONS } from './unitsData/unit1Questions';
import { UNIT_2_QUESTIONS } from './unitsData/unit2Questions';
import { UNIT_3_QUESTIONS } from './unitsData/unit3Questions';
import { UNIT_4_QUESTIONS } from './unitsData/unit4Questions';
import { UNIT_5_QUESTIONS } from './unitsData/unit5Questions';
import { UNIT_6_QUESTIONS } from './unitsData/unit6Questions';
import { UNIT_7_QUESTIONS } from './unitsData/unit7Questions';
import { UNIT_8_QUESTIONS } from './unitsData/unit8Questions';
import { UNIT_9_QUESTIONS } from './unitsData/unit9Questions';
import { UNIT_10_QUESTIONS } from './unitsData/unit10Questions';

// Pełna baza 500 unikalnych, ręcznie przygotowanych pytań dla 10 sekcji (Units 1 - 10)
export const ALL_QUESTIONS: Question[] = [
  ...UNIT_1_QUESTIONS,
  ...UNIT_2_QUESTIONS,
  ...UNIT_3_QUESTIONS,
  ...UNIT_4_QUESTIONS,
  ...UNIT_5_QUESTIONS,
  ...UNIT_6_QUESTIONS,
  ...UNIT_7_QUESTIONS,
  ...UNIT_8_QUESTIONS,
  ...UNIT_9_QUESTIONS,
  ...UNIT_10_QUESTIONS,
];

// Funkcje pomocnicze
export function getQuestionsByUnit(unitId: number): Question[] {
  return ALL_QUESTIONS.filter(q => q.unitId === unitId);
}

export function getQuestionsByLesson(unitId: number, lessonIndex: number): Question[] {
  return ALL_QUESTIONS.filter(q => q.unitId === unitId && q.lessonIndex === lessonIndex);
}

export function getQuestionById(id: number): Question | undefined {
  return ALL_QUESTIONS.find(q => q.id === id);
}

export function searchQuestions(query: string): Question[] {
  const q = query.toLowerCase().trim();
  if (!q) return ALL_QUESTIONS.slice(0, 50);
  return ALL_QUESTIONS.filter(item =>
    item.question.toLowerCase().includes(q) ||
    (item.codeSnippet && item.codeSnippet.toLowerCase().includes(q)) ||
    item.explanation.toLowerCase().includes(q) ||
    item.unitTitle.toLowerCase().includes(q)
  );
}
