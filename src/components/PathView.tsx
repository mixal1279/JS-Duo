import React, { useState } from 'react';
import { Check, Lock, Star, Gift, ChevronRight, BookCheck } from 'lucide-react';
import { Unit, UserStats, Question } from '../types';
import { UNITS } from '../data/units';
import { MascotOwl } from './MascotOwl';
import { soundService } from '../services/soundService';

interface PathViewProps {
  userStats: UserStats;
  onStartLesson: (unitId: number, lessonIndex: number) => void;
  onOpenExplorer: () => void;
  onClaimChest: (gems: number) => void;
}

export const PathView: React.FC<PathViewProps> = ({
  userStats,
  onStartLesson,
  onOpenExplorer,
  onClaimChest,
}) => {
  const [selectedUnitId, setSelectedUnitId] = useState<number>(userStats.unlockedUnit || 1);
  const currentUnit = UNITS.find((u) => u.id === selectedUnitId) || UNITS[0];

  // Each unit has 10 lessons (5 questions each = 50 questions per unit)
  const totalLessons = 10;

  // Estimate progress based on completed questions in this unit
  const questionsInUnitRangeStart = (currentUnit.id - 1) * 50 + 1;
  const questionsInUnitRangeEnd = currentUnit.id * 50;
  const completedInUnit = userStats.completedQuestionIds.filter(
    (id) => id >= questionsInUnitRangeStart && id <= questionsInUnitRangeEnd
  ).length;

  // Helper to verify if a lesson is completed
  const isLessonCompleted = (unitId: number, lessonIdx: number): boolean => {
    if (userStats.completedLessonKeys?.includes(`${unitId}-${lessonIdx}`)) {
      return true;
    }
    return completedInUnit >= lessonIdx * 5;
  };

  // Find the first uncompleted lesson in this unit (1..10)
  let currentLessonIndex = 1;
  for (let l = 1; l <= totalLessons; l++) {
    if (!isLessonCompleted(currentUnit.id, l)) {
      currentLessonIndex = l;
      break;
    }
    if (l === totalLessons) {
      currentLessonIndex = totalLessons;
    }
  }

  const completedLessonsInUnit = Array.from({ length: totalLessons }).filter((_, i) =>
    isLessonCompleted(currentUnit.id, i + 1)
  ).length;
  const unitProgressPercent = Math.min(100, Math.round((completedLessonsInUnit / totalLessons) * 100));

  // Horizontal S-curve offsets for Duolingo serpentine path
  const getOffsetClass = (index: number) => {
    const offsets = [
      'translate-x-0',
      '-translate-x-6 sm:-translate-x-8',
      '-translate-x-8 sm:-translate-x-12',
      '-translate-x-4 sm:-translate-x-6',
      'translate-x-3 sm:translate-x-4',
      'translate-x-8 sm:translate-x-10',
      'translate-x-4 sm:translate-x-6',
      '-translate-x-3 sm:-translate-x-4',
      '-translate-x-7 sm:-translate-x-10',
      'translate-x-0',
    ];
    return offsets[index % offsets.length];
  };

  const handleNodeClick = (lessonIdx: number) => {
    const isCompleted = isLessonCompleted(currentUnit.id, lessonIdx);
    if (!isCompleted && lessonIdx > currentLessonIndex && selectedUnitId >= userStats.unlockedUnit) {
      // Locked
      soundService.playWrong();
      return;
    }
    soundService.playClick();
    onStartLesson(currentUnit.id, lessonIdx);
  };

  return (
    <div className="max-w-xl mx-auto px-2 sm:px-4 py-2 sm:py-4 pb-8 select-none">
      {/* Unit Header Card */}
      <div
        className="rounded-2xl sm:rounded-3xl p-4 sm:p-5 mb-6 sm:mb-8 border-2 shadow-lg relative overflow-hidden transition-all"
        style={{
          backgroundColor: '#1B262C',
          borderColor: currentUnit.color,
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-black/40 text-white border border-white/10">
            Rozdział {currentUnit.id} z 10
          </span>
          <div className="flex items-center gap-1 text-xs font-bold text-gray-300">
            <BookCheck size={15} style={{ color: currentUnit.color }} />
            <span>{completedInUnit} / 50 pytań</span>
          </div>
        </div>

        <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight mb-1">
          {currentUnit.title}
        </h1>
        <p className="text-xs sm:text-sm text-gray-300 mb-3 sm:mb-4 leading-relaxed">
          {currentUnit.description}
        </p>

        {/* Progress Bar */}
        <div className="w-full bg-black/40 rounded-full h-2.5 sm:h-3 p-0.5 border border-white/10">
          <div
            className="h-full rounded-full transition-all duration-500 relative"
            style={{
              width: `${unitProgressPercent}%`,
              backgroundColor: currentUnit.color,
            }}
          >
            <div className="absolute inset-0 bg-white/20 rounded-full h-1"></div>
          </div>
        </div>

        {/* Unit Selector Strip */}
        <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-white/10 flex items-center justify-between gap-2">
          <span className="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase shrink-0">Rozdział:</span>
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-[280px] sm:max-w-none scrollbar-none touch-pan-x">
            {UNITS.map((u) => {
              const isSelected = u.id === selectedUnitId;
              const isLocked = u.id > userStats.unlockedUnit;
              return (
                <button
                  key={u.id}
                  onClick={() => {
                    setSelectedUnitId(u.id);
                    soundService.playClick();
                  }}
                  className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-white text-black scale-110 shadow'
                      : isLocked
                      ? 'bg-gray-800 text-gray-500 opacity-60'
                      : 'bg-[#2A373F] text-gray-200 hover:bg-[#394953]'
                  }`}
                  title={u.title}
                >
                  {isLocked ? <Lock size={11} /> : u.id}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mascot encouragement banner */}
      <div className="flex items-center gap-4 bg-[#1E2930] border border-[#2A373F] p-3.5 rounded-2xl mb-8 shadow-sm">
        <MascotOwl mood="happy" size={54} className="shrink-0" />
        <div className="flex-1">
          <h4 className="text-xs font-bold text-duo-green uppercase tracking-wide">
            Wskazówka od Sowy JS
          </h4>
          <p className="text-xs text-gray-200 leading-snug mt-0.5">
            Każda lekcja to 5 pytań z precyzyjnymi wyjaśnieniami. Regularna nauka zwiększa Twój streak i daje awans w lidze!
          </p>
        </div>
      </div>

      {/* Serpentine Lessons Path */}
      <div className="flex flex-col items-center space-y-7 relative py-4">
        {Array.from({ length: totalLessons }).map((_, idx) => {
          const lessonIdx = idx + 1;
          const isCompleted = isLessonCompleted(currentUnit.id, lessonIdx);
          const isCurrent = lessonIdx === currentLessonIndex && !isCompleted;
          const isLocked = !isCompleted && lessonIdx > currentLessonIndex;
          const isChest = lessonIdx === 5; // mid-unit treasure chest

          const offsetClass = getOffsetClass(idx);

          return (
            <div key={idx} className={`relative flex flex-col items-center ${offsetClass}`}>
              {/* Stepping stone button */}
              {isChest ? (
                /* Mid-Unit Gift Chest */
                <button
                  onClick={() => {
                    if (!isLocked) {
                      onClaimChest(25);
                      soundService.playLevelUp();
                    } else {
                      soundService.playWrong();
                    }
                  }}
                  className={`relative w-16 h-16 rounded-3xl flex items-center justify-center transition-transform active:scale-95 shadow-[0_6px_0_#996515] ${
                    !isLocked
                      ? 'bg-[#FFD700] hover:bg-[#FFC000] animate-bounce cursor-pointer'
                      : 'bg-[#2A373F] opacity-50 cursor-not-allowed shadow-[0_6px_0_#1E272C]'
                  }`}
                  title="Skrzynia z nagrodą: 25 kryształów!"
                >
                  <Gift size={28} className={!isLocked ? 'text-black' : 'text-gray-400'} />
                  {!isLocked && (
                    <span className="absolute -top-2 -right-1 bg-duo-red text-[10px] font-black text-white px-1.5 py-0.5 rounded-full border border-white">
                      +25
                    </span>
                  )}
                </button>
              ) : (
                /* Standard Lesson Node */
                <button
                  onClick={() => handleNodeClick(lessonIdx)}
                  className={`group relative w-16 h-16 rounded-full flex items-center justify-center font-black text-lg transition-all active:translate-y-1 ${
                    isCompleted
                      ? 'bg-duo-green hover:bg-duo-greenDark text-black shadow-[0_6px_0_#46a302] active:shadow-none'
                      : isCurrent
                      ? 'bg-duo-blue hover:bg-duo-blueDark text-white ring-4 ring-duo-blue/30 shadow-[0_6px_0_#1899d6] animate-pulse active:shadow-none'
                      : 'bg-[#2A373F] text-gray-500 shadow-[0_6px_0_#1C262C] cursor-not-allowed opacity-60'
                  }`}
                >
                  {isCompleted ? (
                    <Check size={26} strokeWidth={3.5} />
                  ) : isCurrent ? (
                    <Star size={24} className="fill-white" />
                  ) : (
                    <Lock size={20} />
                  )}

                  {/* Lesson Number floating tag */}
                  <span className="absolute -bottom-5 text-[11px] font-extrabold text-gray-400 group-hover:text-white transition-colors">
                    Lekcja {lessonIdx}
                  </span>
                </button>
              )}
            </div>
          );
        })}

        {/* Final Unit Checkpoint Badge */}
        <div className="pt-6 flex flex-col items-center">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-yellow-600 to-yellow-400 flex items-center justify-center shadow-[0_6px_0_#996515] border-2 border-white/20">
            <Star size={36} className="fill-black text-black" />
          </div>
          <span className="text-xs font-black uppercase text-duo-yellow mt-2 tracking-wider">
            Test Rozdziału {currentUnit.id}
          </span>
        </div>
      </div>

      {/* Floating Action: Quick Jump to 500 Questions Bank */}
      <div className="mt-8 text-center">
        <button
          onClick={onOpenExplorer}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#232E35] hover:bg-[#2F3D46] border border-[#2A373F] text-xs font-bold text-gray-200 transition-colors"
        >
          <span>Otwórz Bazę Wszystkich 500 Pytań z Wyjaśnieniami</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};
