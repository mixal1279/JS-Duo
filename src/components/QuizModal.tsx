import React, { useState, useEffect } from 'react';
import { X, Heart, CheckCircle2, XCircle, HelpCircle, MessageSquareShare, ArrowRight, Award, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Question, UserStats } from '../types';
import { CodeBlock } from './CodeBlock';
import { MascotOwl } from './MascotOwl';
import { LessonSummary, QuestionResult } from './LessonSummary';
import { soundService } from '../services/soundService';

interface QuizModalProps {
  questions: Question[];
  unitTitle: string;
  lessonIndex: number;
  userStats: UserStats;
  onClose: () => void;
  onComplete: (results: {
    earnedXp: number;
    perfect: boolean;
    completedQuestionIds: number[];
  }) => void;
  onAskCommunity: (question: Question) => void;
}

export const QuizModal: React.FC<QuizModalProps> = ({
  questions,
  unitTitle,
  lessonIndex,
  userStats,
  onClose,
  onComplete,
  onAskCommunity,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [hearts, setHearts] = useState(userStats.hearts);
  const [earnedXp, setEarnedXp] = useState(0);
  const [perfectLesson, setPerfectLesson] = useState(true);
  const [solvedIds, setSolvedIds] = useState<number[]>([]);
  const [isLessonFinished, setIsLessonFinished] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [startTime] = useState<number>(() => Date.now());
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [results, setResults] = useState<QuestionResult[]>([]);

  const [combo, setCombo] = useState(0);
  const [heartShaking, setHeartShaking] = useState(false);
  const [outOfHeartsModal, setOutOfHeartsModal] = useState(false);
  const [currentGems, setCurrentGems] = useState(userStats.gems);

  const currentQ = questions[currentIndex];
  const progressPercent = ((currentIndex) / questions.length) * 100;

  // Handle Keyboard shortcuts 1, 2, 3, 4, Enter and Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isLessonFinished) {
          handleFinish();
        } else {
          onClose();
        }
        return;
      }

      if (isLessonFinished) {
        if (e.key === 'Enter' || e.key === ' ') {
          handleFinish();
        }
        return;
      }

      if (outOfHeartsModal) return;

      if (!isAnswerChecked) {
        if (['1', '2', '3', '4'].includes(e.key)) {
          const idx = parseInt(e.key, 10) - 1;
          if (currentQ && idx < currentQ.options.length) {
            setSelectedOption(idx);
            soundService.playClick();
          }
        }
        if (e.key === 'Enter' && selectedOption !== null) {
          handleCheck();
        }
      } else {
        if (e.key === 'Enter' || e.key === ' ') {
          handleContinue();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, selectedOption, isAnswerChecked, isLessonFinished, earnedXp, perfectLesson, solvedIds, outOfHeartsModal]);

  const handleSelect = (idx: number) => {
    if (isAnswerChecked) return;
    setSelectedOption(idx);
    soundService.playClick();
  };

  const handleCheck = () => {
    if (selectedOption === null || isAnswerChecked) return;

    const correct = selectedOption === currentQ.correctIndex;
    setIsCorrect(correct);
    setIsAnswerChecked(true);

    setResults((prev) => [
      ...prev,
      {
        questionId: currentQ.id,
        questionText: currentQ.question,
        selectedOptionText: currentQ.options[selectedOption],
        correctOptionText: currentQ.options[currentQ.correctIndex],
        isCorrect: correct,
        explanation: currentQ.explanation,
      },
    ]);

    if (correct) {
      const nextCombo = combo + 1;
      setCombo(nextCombo);
      if (nextCombo >= 2) {
        soundService.playCombo();
      } else {
        soundService.playCorrect();
      }
      setEarnedXp((prev) => prev + currentQ.points);
      setSolvedIds((prev) => [...prev, currentQ.id]);
    } else {
      setCombo(0);
      soundService.playHeartLoss();
      setPerfectLesson(false);
      setHeartShaking(true);
      setTimeout(() => setHeartShaking(false), 800);

      const nextHearts = Math.max(0, hearts - 1);
      setHearts(nextHearts);
    }
  };

  const handleContinue = () => {
    if (hearts <= 0) {
      setOutOfHeartsModal(true);
      return;
    }

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerChecked(false);
      setShowExplanation(false);
    } else {
      // Finished
      setIsLessonFinished(true);
      setDurationSeconds(Math.max(1, Math.round((Date.now() - startTime) / 1000)));
      soundService.playLevelUp();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  const handleFreeHeartRefill = () => {
    setHearts(1);
    setOutOfHeartsModal(false);
    soundService.playClick();
  };

  const handleGemHeartRefill = () => {
    if (currentGems >= 50) {
      setCurrentGems((g) => g - 50);
      setHearts(5);
      setOutOfHeartsModal(false);
      soundService.playLevelUp();
    }
  };

  const handleFinish = () => {
    onComplete({
      earnedXp,
      perfect: perfectLesson && hearts > 0,
      completedQuestionIds: solvedIds,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#131F24] flex flex-col justify-between overflow-y-auto select-none safe-area-pad">
      {/* Top Bar */}
      {!isLessonFinished ? (
        <div className="max-w-2xl w-full mx-auto pt-[calc(0.75rem+env(safe-area-inset-top,0px))] px-3 sm:px-4 pb-2 sm:pb-3 flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-[#232E35] transition-colors cursor-pointer active:scale-95 shrink-0"
            title="Zamknij lekcję"
          >
            <X size={22} />
          </button>

          {/* Progress bar */}
          <div className="flex-1 h-3 sm:h-3.5 bg-[#232E35] rounded-full overflow-hidden p-0.5 border border-[#2A373F]">
            <div
              className="h-full bg-duo-green rounded-full transition-all duration-300 relative"
              style={{ width: `${progressPercent}%` }}
            >
              <div className="absolute inset-0 bg-white/20 rounded-full h-1"></div>
            </div>
          </div>

          {/* Combo Badge */}
          {combo >= 2 && (
            <div className="flex items-center gap-1 font-black text-xs px-2.5 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/40 animate-pulse shrink-0">
              <span>🔥</span>
              <span>x{combo}</span>
            </div>
          )}

          {/* Hearts */}
          <div className={`flex items-center gap-1 font-extrabold text-duo-red shrink-0 ${heartShaking ? 'animate-bounce' : ''}`}>
            <Heart size={20} className={`fill-duo-red ${heartShaking ? 'scale-125 text-red-400' : ''} transition-transform`} />
            <span className="text-sm sm:text-base">{hearts}</span>
          </div>
        </div>
      ) : (
        <div className="max-w-xl w-full mx-auto pt-[calc(0.75rem+env(safe-area-inset-top,0px))] px-4 pb-2 flex items-center justify-end shrink-0">
          <button
            onClick={handleFinish}
            className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-[#232E35] transition-colors cursor-pointer active:scale-95"
            title="Zamknij podsumowanie"
          >
            <X size={22} />
          </button>
        </div>
      )}

      {/* Main Content Area */}
      {!isLessonFinished ? (
        <div className="max-w-2xl w-full mx-auto px-3 sm:px-4 py-2 flex-1 flex flex-col justify-center">
          {/* Question Meta & Prompt */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
              <span className="font-semibold uppercase tracking-wider text-duo-blue">
                {unitTitle} • Lekcja {lessonIndex}
              </span>
              <span className="font-bold bg-[#232E35] px-2 py-0.5 rounded text-gray-300">
                Pytanie {currentIndex + 1} z {questions.length} (+{currentQ.points} XP)
              </span>
            </div>

            <div className="flex items-start gap-3">
              <MascotOwl
                mood={isAnswerChecked ? (isCorrect ? 'excited' : 'sad') : combo >= 3 ? 'excited' : 'thinking'}
                size={58}
                className="shrink-0"
              />
              <div className="flex-1">
                {/* Duo Speech Bubble */}
                <div className="relative bg-[#1C2830] border-2 border-[#2C3B45] rounded-2xl p-2.5 sm:p-3 mb-2 shadow-md">
                  <div className="text-xs font-black text-duo-green flex items-center gap-1 mb-0.5">
                    <span>Sowa Duo:</span>
                    {combo >= 2 && isCorrect && <span className="text-orange-400">🔥 Combo x{combo}!</span>}
                  </div>
                  <p className="text-xs text-gray-300 font-medium">
                    {!isAnswerChecked
                      ? 'Wskaż prawidłowy kod lub odpowiedź w JavaScript:'
                      : isCorrect
                      ? (combo >= 3 ? 'Niesamowicie! Kod płynie w Twoich żyłach! 🚀' : 'Świetnie! Czysta logika programisty!')
                      : 'Ojej! Tracisz serce 💔, ale przeanalizuj błąd i czytaj wyjaśnienie.'}
                  </p>
                </div>
                <h2 className="text-base sm:text-lg font-extrabold text-white leading-snug">
                  {currentQ.question}
                </h2>
              </div>
            </div>
          </div>

          {/* Code Snippet Box (if present) */}
          {currentQ.codeSnippet && (
            <div className="mb-5">
              <CodeBlock code={currentQ.codeSnippet} />
            </div>
          )}

          {/* Options List */}
          <div className="space-y-2.5 mb-6">
            {currentQ.options.map((option, idx) => {
              const isSelected = selectedOption === idx;
              let optionStyle = 'bg-[#202F36] border-[#2A373F] text-gray-200 hover:bg-[#253942]';

              if (isSelected && !isAnswerChecked) {
                optionStyle = 'bg-[#1C3545] border-duo-blue text-duo-blue shadow-[0_4px_0_#1899d6] -translate-y-0.5';
              }

              if (isAnswerChecked) {
                if (idx === currentQ.correctIndex) {
                  optionStyle = 'bg-green-950/40 border-duo-green text-green-300 shadow-[0_4px_0_#46a302]';
                } else if (isSelected && !isCorrect) {
                  optionStyle = 'bg-red-950/40 border-duo-red text-red-300 shadow-[0_4px_0_#ea2b2b]';
                } else {
                  optionStyle = 'bg-[#202F36] opacity-40 border-[#2A373F] text-gray-400';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(idx)}
                  disabled={isAnswerChecked}
                  className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border-2 transition-all flex items-center justify-between font-bold text-sm sm:text-base cursor-pointer ${optionStyle}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-black/30 border border-white/10 flex items-center justify-center text-xs font-mono font-bold text-gray-300">
                      {idx + 1}
                    </span>
                    <span className="leading-snug">{option}</span>
                  </div>

                  {isAnswerChecked && idx === currentQ.correctIndex && (
                    <CheckCircle2 size={20} className="text-duo-green shrink-0 ml-2" />
                  )}
                  {isAnswerChecked && isSelected && !isCorrect && (
                    <XCircle size={20} className="text-duo-red shrink-0 ml-2" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Collapsible Detailed Explanation */}
          {isAnswerChecked && showExplanation && (
            <div className="p-4 rounded-2xl bg-[#1C2C35] border border-duo-blue/40 text-sm text-gray-200 mb-6 animate-bounce-short">
              <div className="flex items-center gap-2 text-duo-blue font-bold mb-1">
                <HelpCircle size={18} />
                <span>Dokładne wytłumaczenie techniczne:</span>
              </div>
              <p className="leading-relaxed text-gray-300 text-sm">{currentQ.explanation}</p>
            </div>
          )}
        </div>
      ) : (
        /* Lesson Finished Summary Screen with Recharts Accuracy Chart */
        <LessonSummary
          unitTitle={unitTitle}
          lessonIndex={lessonIndex}
          earnedXp={earnedXp}
          correctCount={results.filter((r) => r.isCorrect).length}
          wrongCount={results.filter((r) => !r.isCorrect).length}
          totalQuestions={questions.length}
          durationSeconds={durationSeconds}
          results={results}
          streak={userStats.streak === 0 ? 1 : userStats.streak}
          onContinue={handleFinish}
        />
      )}

      {/* Out of Hearts Modal (Duolingo Style) */}
      {outOfHeartsModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#172127] border-2 border-red-500/50 rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl space-y-4 animate-scale-up">
            <div className="w-16 h-16 rounded-3xl bg-red-500/20 border-2 border-red-500 mx-auto flex items-center justify-center">
              <Heart size={36} className="text-duo-red fill-duo-red animate-pulse" />
            </div>

            <h3 className="text-xl font-black text-white">
              Skończyły Ci się serca!
            </h3>
            <p className="text-xs text-gray-300">
              Aby kontynuować tę lekcję kodu, potrzebujesz przynajmniej jednego serca.
            </p>

            <div className="space-y-2.5 pt-2">
              <button
                onClick={handleFreeHeartRefill}
                className="w-full py-3 px-4 rounded-2xl bg-duo-green hover:bg-duo-greenDark text-black font-extrabold text-sm uppercase tracking-wider shadow-[0_4px_0_#46a302] active:translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Darmowy restart (+1 ❤️)</span>
              </button>

              {currentGems >= 50 && (
                <button
                  onClick={handleGemHeartRefill}
                  className="w-full py-3 px-4 rounded-2xl bg-[#202F36] hover:bg-[#2A3F49] text-duo-blue font-extrabold text-sm uppercase tracking-wider border-2 border-duo-blue/40 active:translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Odnów wszystkie (50 💎)</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="w-full py-2.5 text-xs font-bold text-gray-400 hover:text-white transition-colors"
              >
                Zakończ lekcję i wróć do ścieżki
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Action Footer */}
      {!isLessonFinished && (
        <div
          className={`sticky bottom-0 z-30 border-t pt-3 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] px-3 sm:px-5 transition-colors ${
            !isAnswerChecked
              ? 'bg-[#131F24]/95 backdrop-blur border-[#2A373F]'
              : isCorrect
              ? 'bg-[#1A3324] border-duo-green'
              : 'bg-[#331B1E] border-duo-red'
          }`}
        >
          <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
            {/* Status Message */}
            <div className="w-full sm:w-auto">
              {!isAnswerChecked ? (
                <p className="text-xs text-gray-400 hidden sm:block">
                  Wybierz opcję (1-4) i kliknij Sprawdź lub naciśnij Enter
                </p>
              ) : (
                <div className="flex items-center gap-2">
                  {isCorrect ? (
                    <div className="flex items-center gap-2 text-duo-green font-black text-base sm:text-xl">
                      <CheckCircle2 size={22} className="shrink-0" />
                      <span>Świetnie! Poprawna odpowiedź!</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-duo-red font-black text-sm sm:text-base leading-snug">
                      <XCircle size={22} className="shrink-0" />
                      <span>Niestety błąd! Prawidłowa: {currentQ.options[currentQ.correctIndex]}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {isAnswerChecked && (
                <>
                  <button
                    onClick={() => setShowExplanation(!showExplanation)}
                    className="px-3 py-3 rounded-xl bg-[#232E35] hover:bg-[#2C3B44] text-xs font-bold text-gray-200 border border-[#2A373F] flex items-center justify-center gap-1.5 transition-colors active:scale-95 shrink-0"
                  >
                    <HelpCircle size={16} className="text-duo-blue" />
                    <span>{showExplanation ? 'Ukryj' : 'Wyjaśnienie'}</span>
                  </button>

                  <button
                    onClick={() => onAskCommunity(currentQ)}
                    className="p-3 rounded-xl bg-[#232E35] hover:bg-[#2C3B44] text-xs font-bold text-gray-200 border border-[#2A373F] flex items-center justify-center gap-1.5 transition-colors active:scale-95 shrink-0 sm:px-3"
                    title="Skonsultuj to pytanie na czacie społeczności"
                  >
                    <MessageSquareShare size={16} className="text-duo-yellow" />
                    <span className="hidden sm:inline">Zapytaj na czacie</span>
                  </button>
                </>
              )}

              {!isAnswerChecked ? (
                <button
                  onClick={handleCheck}
                  disabled={selectedOption === null}
                  className={`flex-1 sm:flex-none sm:w-auto px-8 py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider transition-all min-h-[48px] ${
                    selectedOption !== null
                      ? 'bg-duo-green hover:bg-duo-greenDark text-black shadow-[0_4px_0_#46a302] active:translate-y-0.5 active:shadow-none'
                      : 'bg-[#2A373F] text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Sprawdź
                </button>
              ) : (
                <button
                  onClick={handleContinue}
                  className={`flex-1 sm:flex-none sm:w-auto px-8 py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 min-h-[48px] ${
                    isCorrect
                      ? 'bg-duo-green hover:bg-duo-greenDark text-black shadow-[0_4px_0_#46a302] active:translate-y-0.5 active:shadow-none'
                      : 'bg-duo-red hover:bg-duo-redDark text-white shadow-[0_4px_0_#ea2b2b] active:translate-y-0.5 active:shadow-none'
                  }`}
                >
                  <span>Dalej</span>
                  <ArrowRight size={18} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
