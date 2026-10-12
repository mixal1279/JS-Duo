import React, { useMemo, useState } from 'react';
import { BookOpenCheck, Brain, CalendarClock, CheckCircle2, CircleHelp, RotateCcw, Sparkles, XCircle } from 'lucide-react';
import { ALL_QUESTIONS } from '../data/questionsData';
import { Question, UserStats } from '../types';
import { getDueReviewQuestions, getReviewSummary, gradeReview } from '../services/reviewService';

interface ReviewViewProps {
  userStats: UserStats;
  onEarnXp: (xp: number) => void;
  onReviewChange?: () => void;
}

export const ReviewView: React.FC<ReviewViewProps> = ({ userStats, onEarnXp, onReviewChange }) => {
  const [sessionKey, setSessionKey] = useState(0);
  const [activeQuestions, setActiveQuestions] = useState<Question[]>(() => getDueReviewQuestions(ALL_QUESTIONS, 10));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [earnedXp, setEarnedXp] = useState(0);
  const summary = useMemo(() => getReviewSummary(), [sessionKey, finished]);
  const question = activeQuestions[currentIndex];

  const startSession = (includeFuture: boolean) => {
    const next = getDueReviewQuestions(ALL_QUESTIONS, 10, includeFuture);
    setActiveQuestions(next);
    setCurrentIndex(0);
    setSelectedIndex(null);
    setChecked(false);
    setCorrectCount(0);
    setEarnedXp(0);
    setFinished(false);
    setSessionKey((value) => value + 1);
  };

  const checkAnswer = () => {
    if (selectedIndex === null || !question || checked) return;
    const correct = selectedIndex === question.correctIndex;
    gradeReview(question.id, correct ? 4 : 1);
    onReviewChange?.();
    setChecked(true);
    if (correct) {
      setCorrectCount((value) => value + 1);
      setEarnedXp((value) => value + 3);
    }
  };

  const nextQuestion = () => {
    if (currentIndex + 1 >= activeQuestions.length) {
      const xp = earnedXp;
      if (xp > 0) onEarnXp(xp);
      setFinished(true);
      setSessionKey((value) => value + 1);
      return;
    }
    setCurrentIndex((value) => value + 1);
    setSelectedIndex(null);
    setChecked(false);
  };

  const startPractice = () => startSession(true);

  return (
    <div className="space-y-5 pb-6">
      <header className="rounded-3xl border border-[#2A373F] bg-gradient-to-br from-[#1B3038] to-[#131F24] p-5 sm:p-7">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-duo-blue/15 p-3 text-duo-blue"><Brain size={30} /></div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-duo-blue">Pamięć długotrwała</p>
            <h1 className="mt-1 text-2xl font-black sm:text-3xl">Powtórki inteligentne</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-gray-300">Wracaj do pytań w odpowiednich odstępach. Błędy wracają szybciej, a dobrze opanowany materiał pojawia się rzadziej.</p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2">
          <Stat label="Do powtórki" value={summary.due} color="text-duo-yellow" />
          <Stat label="W harmonogramie" value={summary.scheduled} color="text-duo-blue" />
          <Stat label="Opanowane" value={summary.mastered} color="text-duo-green" />
        </div>
      </header>

      {finished ? (
        <section className="rounded-3xl border-2 border-duo-green/40 bg-[#172127] p-6 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-duo-green/15 text-duo-green"><CheckCircle2 size={34} /></div>
          <h2 className="text-2xl font-black">Powtórka zakończona</h2>
          <p className="mt-2 text-gray-300">Poprawne odpowiedzi: <strong>{correctCount}/{activeQuestions.length}</strong></p>
          <p className="mt-1 text-sm text-duo-green">Zdobyte XP: +{earnedXp}</p>
          <button onClick={() => startSession(false)} className="mt-5 rounded-2xl bg-duo-green px-5 py-3 font-black text-black shadow-[0_4px_0_#46a302]">Sprawdź kolejne powtórki</button>
          <button onClick={startPractice} className="ml-2 mt-5 rounded-2xl border border-[#3A4A52] px-5 py-3 font-bold text-gray-200">Ćwicz ponownie</button>
        </section>
      ) : question ? (
        <section className="rounded-3xl border-2 border-[#2A373F] bg-[#172127] p-4 sm:p-6">
          <div className="mb-5 flex items-center justify-between text-xs font-bold text-gray-400">
            <span>POWTÓRKA {currentIndex + 1} / {activeQuestions.length}</span>
            <span className="flex items-center gap-1 text-duo-yellow"><Sparkles size={14} /> +3 XP za poprawną odpowiedź</span>
          </div>
          <div className="mb-5 h-2 overflow-hidden rounded-full bg-[#0E171C]"><div className="h-full rounded-full bg-duo-blue transition-all" style={{ width: `${((currentIndex + 1) / activeQuestions.length) * 100}%` }} /></div>
          <h2 className="text-lg font-extrabold leading-7 sm:text-xl">{question.question}</h2>
          {question.codeSnippet && <pre className="my-4 overflow-x-auto rounded-2xl border border-[#2A373F] bg-[#0D1418] p-4 font-mono text-sm leading-6 text-[#B8E994]"><code>{question.codeSnippet}</code></pre>}
          <div className="mt-5 space-y-3">
            {question.options.map((option, index) => {
              const isSelected = selectedIndex === index;
              const isCorrect = checked && index === question.correctIndex;
              const isWrong = checked && isSelected && !isCorrect;
              return <button key={`${question.id}-${index}`} disabled={checked} onClick={() => setSelectedIndex(index)} className={`flex w-full items-center gap-3 rounded-2xl border-2 p-3 text-left text-sm font-bold transition-colors ${isCorrect ? 'border-duo-green bg-duo-green/10 text-white' : isWrong ? 'border-duo-red bg-duo-red/10 text-white' : isSelected ? 'border-duo-blue bg-duo-blue/10 text-white' : 'border-[#34444D] bg-[#131F24] text-gray-200 hover:border-[#657780]'}`}>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-current/30 text-xs">{String.fromCharCode(65 + index)}</span><span>{option}</span>
                {isCorrect && <CheckCircle2 className="ml-auto shrink-0 text-duo-green" size={18} />}{isWrong && <XCircle className="ml-auto shrink-0 text-duo-red" size={18} />}
              </button>;
            })}
          </div>
          {checked && <div className={`mt-4 rounded-2xl border p-4 ${selectedIndex === question.correctIndex ? 'border-duo-green/40 bg-duo-green/10' : 'border-duo-red/40 bg-duo-red/10'}`}><p className="font-extrabold">{selectedIndex === question.correctIndex ? 'Dobrze!' : 'Jeszcze nie.'}</p><p className="mt-1 text-sm leading-6 text-gray-300">{question.explanation}</p></div>}
          <div className="mt-5 flex gap-3">
            {!checked ? <button disabled={selectedIndex === null} onClick={checkAnswer} className="flex-1 rounded-2xl bg-duo-blue py-3 font-black text-white disabled:cursor-not-allowed disabled:opacity-40">Sprawdź</button> : <button onClick={nextQuestion} className="flex-1 rounded-2xl bg-duo-green py-3 font-black text-black">{currentIndex + 1 === activeQuestions.length ? 'Zakończ powtórkę' : 'Dalej'}</button>}
          </div>
        </section>
      ) : (
        <section className="rounded-3xl border-2 border-[#2A373F] bg-[#172127] p-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-duo-green/10 text-duo-green"><BookOpenCheck size={28} /></div>
          <h2 className="text-xl font-black">Na dziś wszystko powtórzone</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-gray-400">Po ukończeniu lekcji pytania trafiają do harmonogramu. Wróć jutro albo uruchom krótką sesję utrwalającą już poznany materiał.</p>
          <button onClick={startPractice} disabled={summary.scheduled === 0} className="mt-5 rounded-2xl bg-duo-green px-5 py-3 font-black text-black disabled:opacity-40"><RotateCcw className="mr-2 inline" size={16} />Ćwicz poznany materiał</button>
        </section>
      )}

      <div className="flex items-start gap-3 rounded-2xl border border-[#2A373F] bg-[#131F24] p-4 text-sm text-gray-400">
        <CalendarClock size={20} className="mt-0.5 shrink-0 text-duo-blue" />
        <p>Po pierwszym powtórzeniu pytanie wraca po 1 dniu, po drugim po 3 dniach. Pomyłka skraca odstęp i resetuje serię opanowania. Postęp jest zapisywany lokalnie na tym urządzeniu.</p>
      </div>
    </div>
  );
};

const Stat: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div className="rounded-2xl border border-[#2A373F] bg-[#131F24]/70 p-3">
    <div className={`text-xl font-black ${color}`}>{value}</div>
    <div className="mt-1 text-[10px] font-bold uppercase tracking-wide text-gray-400">{label}</div>
  </div>
);
