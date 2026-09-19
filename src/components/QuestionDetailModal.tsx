import React, { useState, useEffect } from 'react';
import { X, Search, BookOpen, CheckCircle2, ChevronDown, Filter, HelpCircle, MessageSquareShare } from 'lucide-react';
import { Question } from '../types';
import { ALL_QUESTIONS } from '../data/questionsData';
import { UNITS } from '../data/units';
import { CodeBlock } from './CodeBlock';

interface QuestionDetailModalProps {
  initialQuestionId?: number | null;
  onClose: () => void;
  onAskCommunity: (question: Question) => void;
}

export const QuestionDetailModal: React.FC<QuestionDetailModalProps> = ({
  initialQuestionId,
  onClose,
  onAskCommunity,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<number>(0); // 0 = all
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [expandedQuestionId, setExpandedQuestionId] = useState<number | null>(initialQuestionId || null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Filter questions
  const filteredQuestions = ALL_QUESTIONS.filter((q) => {
    if (selectedUnit !== 0 && q.unitId !== selectedUnit) return false;
    if (selectedDifficulty !== 'all' && q.difficulty !== selectedDifficulty) return false;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const inQ = q.question.toLowerCase().includes(query);
      const inCode = q.codeSnippet?.toLowerCase().includes(query) || false;
      const inExp = q.explanation.toLowerCase().includes(query);
      return inQ || inCode || inExp;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-[#172127] border-2 border-[#2A373F] rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#2A373F] flex items-center justify-between bg-[#1C262C] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-duo-yellow/20 border border-duo-yellow/40 flex items-center justify-center text-duo-yellow">
              <BookOpen size={20} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white">
                Baza 500 Pytań JavaScript
              </h2>
              <p className="text-xs text-gray-400">
                Wszystkie pytania z pełnymi technicznymi wyjaśnieniami
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={22} />
          </button>
        </div>

        {/* Search & Filters Controls */}
        <div className="p-3 sm:p-4 bg-[#141B20] border-b border-[#243038] space-y-2 shrink-0">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Szukaj pojęć (np. closure, Promise, Event Loop, this, typeof)..."
              className="w-full bg-[#1C262C] border border-[#2A373F] rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-duo-green"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto py-1">
            {/* Unit filter */}
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(Number(e.target.value))}
              className="bg-[#1C262C] border border-[#2A373F] text-gray-300 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none"
            >
              <option value={0}>Wszystkie Rozdziały (1-10)</option>
              {UNITS.map((u) => (
                <option key={u.id} value={u.id}>
                  Rozdział {u.id}: {u.title}
                </option>
              ))}
            </select>

            {/* Difficulty filter */}
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="bg-[#1C262C] border border-[#2A373F] text-gray-300 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none"
            >
              <option value="all">Wszystkie trudności</option>
              <option value="easy">Łatwe</option>
              <option value="medium">Średnie</option>
              <option value="hard">Trudne</option>
            </select>

            <span className="text-xs font-bold text-duo-green ml-auto shrink-0">
              Wyniki: {filteredQuestions.length} / 500
            </span>
          </div>
        </div>

        {/* Questions List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
          {filteredQuestions.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <p className="text-sm">Nie znaleziono pytań dla podanych kryteriów wyszukiwania.</p>
            </div>
          ) : (
            filteredQuestions.slice(0, 100).map((q) => {
              const isExpanded = expandedQuestionId === q.id;

              return (
                <div
                  key={q.id}
                  className="rounded-2xl bg-[#1C262C] border border-[#2A373F] overflow-hidden transition-all"
                >
                  <div
                    onClick={() => setExpandedQuestionId(isExpanded ? null : q.id)}
                    className="p-3.5 flex items-start justify-between gap-3 cursor-pointer hover:bg-[#223038] transition-colors"
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="text-xs font-black bg-black/40 text-gray-300 px-2 py-0.5 rounded-lg shrink-0 mt-0.5">
                        #{q.id}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400 mb-1">
                          <span className="text-duo-blue">{q.unitTitle}</span>
                          <span>•</span>
                          <span
                            className={
                              q.difficulty === 'easy'
                                ? 'text-green-400'
                                : q.difficulty === 'medium'
                                ? 'text-yellow-400'
                                : 'text-red-400'
                            }
                          >
                            {q.difficulty}
                          </span>
                        </div>
                        <h4 className="text-sm font-extrabold text-white leading-snug">
                          {q.question}
                        </h4>
                      </div>
                    </div>
                    <ChevronDown
                      size={18}
                      className={`text-gray-400 shrink-0 transition-transform duration-200 mt-1 ${
                        isExpanded ? 'rotate-180 text-white' : ''
                      }`}
                    />
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="p-4 border-t border-[#2A373F] bg-[#141E24] space-y-3">
                      {q.codeSnippet && <CodeBlock code={q.codeSnippet} />}

                      {/* Options */}
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-black uppercase text-gray-400">
                          Odpowiedzi:
                        </span>
                        {q.options.map((opt, oIdx) => {
                          const isCorrect = oIdx === q.correctIndex;
                          return (
                            <div
                              key={oIdx}
                              className={`p-2 rounded-xl text-xs flex items-center justify-between border ${
                                isCorrect
                                  ? 'bg-green-950/40 border-duo-green text-green-300 font-bold'
                                  : 'bg-[#1C262C] border-[#2A373F] text-gray-400'
                              }`}
                            >
                              <span>{opt}</span>
                              {isCorrect && (
                                <span className="flex items-center gap-1 text-duo-green text-[10px] font-black uppercase">
                                  <CheckCircle2 size={12} /> Poprawna
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Technical Explanation */}
                      <div className="p-3.5 rounded-xl bg-[#1C2C35] border border-duo-blue/30 text-xs text-gray-200">
                        <div className="flex items-center gap-1.5 text-duo-blue font-black mb-1">
                          <HelpCircle size={15} />
                          <span>Wyjaśnienie techniczne:</span>
                        </div>
                        <p className="leading-relaxed text-gray-300">{q.explanation}</p>
                      </div>

                      {/* Ask Community Button */}
                      <div className="flex justify-end pt-1">
                        <button
                          onClick={() => onAskCommunity(q)}
                          className="px-3 py-1.5 rounded-xl bg-[#232E35] hover:bg-[#2C3B44] text-xs font-bold text-gray-200 border border-[#2A373F] flex items-center gap-1.5 transition-colors"
                        >
                          <MessageSquareShare size={14} className="text-duo-yellow" />
                          <span>Udostępnij to pytanie na czacie</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
