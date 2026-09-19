import { Achievement, UserStats } from '../types';

export const ACHIEVEMENTS_STORAGE_KEY = 'js_duo_achievements_v1';

export function calculateAchievements(stats: UserStats): Achievement[] {
  const completedSet = new Set(stats.completedQuestionIds);

  // Pytania dotyczące pętli i iteracji (for, while, for..of, for..in, map, filter, reduce) z sekcji 1, 2 i 3
  const loopQuestionIds = [
    11, 12, 13, 14, 15, 26, 27, 28, 29, 30, // pętle i iteratory z unit 1
    101, 102, 103, 104, 105, 106, 107, 108, 109, 110, // tablice i iteracje unit 3
    111, 112, 113, 114, 115, 121, 122, 123, 124, 125,
  ];
  const completedLoopQuestionsCount = loopQuestionIds.filter(id => completedSet.has(id)).length;

  // Pytania asynchroniczne (Sekcja 5: 201-250)
  const asyncCompletedCount = stats.completedQuestionIds.filter(id => id >= 201 && id <= 250).length;

  // Pytania TypeScript (Sekcja 8: 351-400)
  const tsCompletedCount = stats.completedQuestionIds.filter(id => id >= 351 && id <= 400).length;

  const totalQuestionsCompleted = stats.completedQuestionIds.length;

  return [
    {
      id: 'streak_100',
      title: '100 dni passy',
      description: 'Utrzymuj nieprzerwaną passę nauki przez 100 kolejnych dni',
      icon: '🔥',
      category: 'streak',
      tier: 3,
      target: 100,
      current: Math.min(100, stats.streak),
      unit: 'dni',
      isUnlocked: stats.streak >= 100,
      rewardGems: 250,
      rewardXp: 500,
    },
    {
      id: 'loop_master',
      title: 'Mistrz Pętli',
      description: 'Rozwiąż 10 zaawansowanych wyzwań związanych z pętlami for, while, map i reduce',
      icon: '🔁',
      category: 'skills',
      tier: 2,
      target: 10,
      current: Math.min(10, Math.max(completedLoopQuestionsCount, Math.min(stats.completedQuestionIds.length, 10))),
      unit: 'wyzwań',
      isUnlocked: completedLoopQuestionsCount >= 10 || stats.completedQuestionIds.length >= 10,
      rewardGems: 100,
      rewardXp: 200,
    },
    {
      id: 'async_expert',
      title: 'Ekspert Asynchroniczności',
      description: 'Opanuj Promises, async/await oraz mechanikę Event Loop (Unit 5)',
      icon: '⚡',
      category: 'skills',
      tier: 3,
      target: 15,
      current: Math.min(15, asyncCompletedCount),
      unit: 'pytań',
      isUnlocked: asyncCompletedCount >= 15,
      rewardGems: 150,
      rewardXp: 300,
    },
    {
      id: 'diamond_league',
      title: 'Diamentowy Czempion',
      description: 'Awansuj do elitarnej Diamentowej Ligi i walcz z najlepszymi',
      icon: '💎',
      category: 'mastery',
      tier: 3,
      target: 1,
      current: stats.league === 'Diamentowa' ? 1 : 0,
      unit: 'liga',
      isUnlocked: stats.league === 'Diamentowa',
      rewardGems: 300,
      rewardXp: 600,
    },
    {
      id: 'duel_warrior',
      title: 'Gladiator Pojedynków',
      description: 'Zwycięż w 10 bezpośrednich pojedynkach 1v1 na żywo',
      icon: '⚔️',
      category: 'duels',
      tier: 2,
      target: 10,
      current: Math.min(10, stats.duelWins),
      unit: 'wygranych',
      isUnlocked: stats.duelWins >= 10,
      rewardGems: 120,
      rewardXp: 250,
    },
    {
      id: 'typescript_sage',
      title: 'Władca TypeScriptu',
      description: 'Rozwiąż przynajmniej 10 pytań z typowania statycznego i generyków (Unit 8)',
      icon: '🛡️',
      category: 'skills',
      tier: 2,
      target: 10,
      current: Math.min(10, tsCompletedCount),
      unit: 'zadań',
      isUnlocked: tsCompletedCount >= 10,
      rewardGems: 100,
      rewardXp: 200,
    },
    {
      id: 'centurion',
      title: 'Kolekcjoner Wiedzy',
      description: 'Rozwiąż co najmniej 50 unikalnych pytań z pełnej bazy 500 zagadnień',
      icon: '📚',
      category: 'mastery',
      tier: 2,
      target: 50,
      current: Math.min(50, totalQuestionsCompleted),
      unit: 'pytań',
      isUnlocked: totalQuestionsCompleted >= 50,
      rewardGems: 150,
      rewardXp: 300,
    },
    {
      id: 'gem_hoarder',
      title: 'Skarbnik Duolingo',
      description: 'Zgromadź 300 błyszczących kryształów w swoim portfelu',
      icon: '✨',
      category: 'mastery',
      tier: 1,
      target: 300,
      current: Math.min(300, stats.gems),
      unit: 'kryształów',
      isUnlocked: stats.gems >= 300,
      rewardGems: 80,
      rewardXp: 150,
    },
    {
      id: 'first_steps',
      title: 'Pierwszy Krok',
      description: 'Ukończ swoją pierwszą lekcję i rozpocznij podróż ku mistrzostwu JS',
      icon: '🌱',
      category: 'mastery',
      tier: 1,
      target: 1,
      current: Math.min(1, totalQuestionsCompleted > 0 ? 1 : 0),
      unit: 'lekcja',
      isUnlocked: totalQuestionsCompleted > 0,
      rewardGems: 30,
      rewardXp: 50,
    },
    {
      id: 'streak_7',
      title: 'Tydzień Żelaznej Woli',
      description: 'Ucz się codziennie przez 7 dni z rzędu bez opuszczenia ani jednego dnia',
      icon: '🎯',
      category: 'streak',
      tier: 1,
      target: 7,
      current: Math.min(7, stats.streak),
      unit: 'dni',
      isUnlocked: stats.streak >= 7,
      rewardGems: 50,
      rewardXp: 100,
    },
  ];
}
