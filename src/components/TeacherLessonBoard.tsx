import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Code2, Lightbulb, Pause, Play, Volume2 } from 'lucide-react';
import { CodeBlock } from './CodeBlock';
import { MascotOwl } from './MascotOwl';

type SpeechStatus = 'idle' | 'loading' | 'speaking' | 'error';

interface TeacherLessonBoardProps {
  topic: string;
  description: string;
  code: string;
  codeExplanation: string;
  isReview: boolean;
  lessonIndex: number;
  speechStatus: SpeechStatus;
  speechError: string;
  onSpeak: (text: string) => void;
  onContinue: () => void;
}

export const TeacherLessonBoard: React.FC<TeacherLessonBoardProps> = ({
  topic,
  description,
  code,
  codeExplanation,
  isReview,
  lessonIndex,
  speechStatus,
  speechError,
  onSpeak,
  onContinue,
}) => {
  const [step, setStep] = useState(0);
  const lessonSteps = [
    {
      label: 'Wprowadzenie',
      title: 'Poznajmy temat',
      narration: `${topic}. ${description}`,
      icon: BookOpen,
    },
    {
      label: 'Kod na tablicy',
      title: 'Przeanalizuj przykład',
      narration: `Przyjrzyjmy się kodowi. ${codeExplanation}`,
      icon: Code2,
    },
    {
      label: 'Podsumowanie',
      title: 'Co warto zapamiętać?',
      narration: `Najważniejsze informacje. ${codeExplanation}`,
      icon: Lightbulb,
    },
  ];
  const currentStep = lessonSteps[step];
  const StepIcon = currentStep.icon;

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className="overflow-hidden rounded-3xl border border-[#33465A] bg-[#111B2A] shadow-[0_18px_55px_rgba(4,10,25,0.35)]"
      aria-label="Lekcja z nauczycielem"
    >
      <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-gradient-to-r from-[#192B43] to-[#201C3B] px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
            <BookOpen size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-cyan-200">Codexa Classroom</p>
            <p className="truncate text-xs font-semibold text-slate-300">Lekcja {lessonIndex} · {isReview ? 'Powtórka' : 'Nauka'}</p>
          </div>
        </div>
        <span className="shrink-0 rounded-full border border-violet-300/20 bg-violet-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-violet-200">
          {step + 1} / {lessonSteps.length}
        </span>
      </div>

      <div className="grid gap-4 p-4 sm:p-5 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <div className="flex min-w-0 flex-col">
          <div className="relative flex min-h-[170px] items-center justify-center overflow-hidden rounded-2xl border border-cyan-300/15 bg-[radial-gradient(ellipse_at_50%_75%,rgba(69,90,190,0.28),transparent_65%),linear-gradient(145deg,#17263B,#111827)] px-4 py-3">
            <div className="absolute left-4 top-4 h-16 w-16 rounded-full bg-cyan-400/10 blur-2xl" />
            <div className="absolute bottom-3 h-3 w-28 rounded-full bg-cyan-300/10 blur-md" />
            <motion.div
              className="relative z-10"
              animate={speechStatus === 'speaking'
                ? { y: [0, -5, 0], rotate: [0, -1.5, 1.5, 0], scale: [1, 1.025, 1] }
                : { y: [0, -3, 0], rotate: [0, 1, 0] }}
              transition={{ duration: speechStatus === 'speaking' ? 0.85 : 2.8, repeat: Infinity, ease: 'easeInOut' }}
            >
              <MascotOwl mood={step === 2 ? 'happy' : step === 1 ? 'thinking' : 'excited'} size={138} className="drop-shadow-[0_0_22px_rgba(75,214,255,0.25)]" />
            </motion.div>
            <motion.div
              className="absolute right-4 top-5 rounded-full border border-cyan-200/20 bg-[#101B2B]/90 p-2 text-cyan-200"
              animate={{ opacity: [0.55, 1, 0.55], scale: [0.96, 1.04, 0.96] }}
              transition={{ duration: 2.2, repeat: Infinity }}
              aria-hidden="true"
            >
              <StepIcon size={17} />
            </motion.div>
            <div className="absolute bottom-3 left-3 right-3 rounded-xl border border-white/10 bg-[#0B1321]/85 px-3 py-2 backdrop-blur-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-200">Nauczyciel</p>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-200">
                {step === 0 ? 'Zaczynamy od podstaw. Posłuchaj krótkiego wprowadzenia.' : step === 1 ? 'Spójrz na tablicę — omówimy przykład krok po kroku.' : 'Podsumujmy najważniejszą zasadę przed praktyką.'}
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => onSpeak(currentStep.narration)}
              disabled={speechStatus === 'loading'}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-cyan-300/25 bg-cyan-300/10 px-3 py-2 text-sm font-bold text-cyan-100 transition hover:bg-cyan-300/15 disabled:cursor-wait disabled:opacity-60"
              aria-label={speechStatus === 'speaking' ? 'Zatrzymaj czytanie teorii' : 'Odsłuchaj wyjaśnienie'}
            >
              {speechStatus === 'speaking' ? <Pause size={17} /> : speechStatus === 'loading' ? <Volume2 size={17} className="animate-pulse" /> : <Play size={17} />}
              {speechStatus === 'loading' ? 'Przygotowuję głos…' : speechStatus === 'speaking' ? 'Zatrzymaj głos' : 'Posłuchaj nauczyciela'}
            </button>
          </div>
          {speechStatus === 'error' && speechError && (
            <p role="alert" className="mt-2 text-xs leading-relaxed text-red-300">{speechError}</p>
          )}
          <p className="mt-2 text-[11px] leading-relaxed text-slate-500">Tekst jest dostępny także bez dźwięku. Głos możesz odtworzyć ponownie.</p>
        </div>

        <div className="min-w-0">
          <div className="mb-3 grid grid-cols-3 gap-1.5 rounded-xl border border-white/10 bg-black/15 p-1.5">
            {lessonSteps.map((item, index) => (
              <button
                type="button"
                key={item.label}
                onClick={() => setStep(index)}
                className={`min-h-10 rounded-lg px-2 py-2 text-[10px] font-extrabold transition sm:text-xs ${step === index ? 'bg-cyan-300/15 text-cyan-100 ring-1 ring-cyan-200/25' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
                aria-current={step === index ? 'step' : undefined}
              >
                {index + 1}. {item.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.18 }}
            >
              <p className="mb-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-violet-300">{currentStep.label}</p>
              <h2 className="mb-2 text-xl font-black leading-tight text-white sm:text-2xl">{step === 0 ? topic : currentStep.title}</h2>
              <p className="mb-4 text-sm leading-relaxed text-slate-300">{step === 0 ? description : step === 1 ? codeExplanation : `Najpierw zrozum, co robi każda część przykładu. W praktyce wykorzystasz tę samą zasadę w samodzielnym zadaniu.`}</p>

              {step === 1 && code ? (
                <div className="rounded-2xl border border-cyan-300/15 bg-[#0A111C] p-3 sm:p-4">
                  <div className="mb-2 flex items-center gap-2 text-xs font-bold text-cyan-200"><Code2 size={15} /> Tablica kodu</div>
                  <CodeBlock code={code} />
                  <p className="mt-3 rounded-xl border border-violet-300/15 bg-violet-300/5 p-3 text-xs leading-relaxed text-slate-300">{codeExplanation}</p>
                </div>
              ) : step === 1 ? (
                <div className="rounded-2xl border border-amber-200/15 bg-amber-200/5 p-4 text-sm text-amber-100">W tej powtórce skupiamy się na wyjaśnieniu poprzedniej odpowiedzi.</div>
              ) : step === 2 ? (
                <div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/5 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-extrabold text-emerald-200"><CheckCircle2 size={17} /> Do zapamiętania</div>
                  <p className="text-sm leading-relaxed text-slate-200">{codeExplanation}</p>
                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Cel tej części</p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-200">Zrozum ideę, zobacz przykład i dopiero potem przejdź do samodzielnego rozwiązania.</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-white/10 bg-black/10 px-4 py-3 sm:px-5">
        <button
          type="button"
          onClick={() => setStep((current) => Math.max(0, current - 1))}
          disabled={step === 0}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold text-slate-300 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ArrowLeft size={16} /> Wstecz
        </button>
        <button
          type="button"
          onClick={() => step < lessonSteps.length - 1 ? setStep((current) => current + 1) : onContinue()}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-300 to-emerald-300 px-4 py-2.5 text-sm font-black text-slate-950 shadow-[0_5px_18px_rgba(66,232,212,0.12)] transition hover:brightness-105 active:scale-[0.98]"
        >
          {step < lessonSteps.length - 1 ? <>Dalej <ArrowRight size={17} /></> : <>Przejdź do praktyki <ArrowRight size={17} /></>}
        </button>
      </div>
    </motion.section>
  );
};
