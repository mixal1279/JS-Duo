import React, { useState } from 'react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import {
  Award,
  Zap,
  CheckCircle2,
  XCircle,
  Clock,
  PieChart as PieIcon,
  BarChart3,
  ArrowRight,
  Sparkles,
  ChevronDown,
  ChevronUp,
  HelpCircle
} from 'lucide-react';
import { MascotOwl } from './MascotOwl';

export interface QuestionResult {
  questionId: number;
  questionText: string;
  selectedOptionText: string;
  correctOptionText: string;
  isCorrect: boolean;
  explanation: string;
}

export interface LessonSummaryProps {
  unitTitle: string;
  lessonIndex: number;
  earnedXp: number;
  correctCount: number;
  wrongCount: number;
  totalQuestions: number;
  durationSeconds: number;
  results: QuestionResult[];
  onContinue: () => void;
}

export const LessonSummary: React.FC<LessonSummaryProps> = ({
  unitTitle,
  lessonIndex,
  earnedXp,
  correctCount,
  wrongCount,
  totalQuestions,
  durationSeconds,
  results,
  onContinue,
}) => {
  const [chartType, setChartType] = useState<'donut' | 'bar'>('donut');
  const [showReview, setShowReview] = useState(false);

  const totalAnswered = correctCount + wrongCount;
  const accuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 100;

  // Format lesson duration (e.g. 1m 24s)
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs} sek.`;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  // Recharts data sets
  const pieData = [
    { name: 'Poprawne', value: correctCount, color: '#58CC02' },
    { name: 'Błędy', value: wrongCount, color: '#FF4B4B' },
  ].filter((item) => item.value > 0);

  // If no answers at all (edge case fallback)
  const chartPieData = pieData.length > 0 ? pieData : [{ name: 'Poprawne', value: 1, color: '#58CC02' }];

  const barData = [
    { name: 'Poprawne', ilosc: correctCount, fill: '#58CC02' },
    { name: 'Błędy', ilosc: wrongCount, fill: '#FF4B4B' },
  ];

  // Headline message based on performance
  const getHeadline = () => {
    if (wrongCount === 0) return { title: 'Idealna lekcja! 🌟', subtitle: 'Bez ani jednego błędu, czysty kunszt programistyczny!' };
    if (accuracy >= 80) return { title: 'Świetna robota! 🎉', subtitle: 'Wysoka skuteczność! Twój JavaScript rośnie w siłę.' };
    if (accuracy >= 50) return { title: 'Dobra lekcja! 💪', subtitle: 'Widać postępy, przeanalizuj błędy i idź naprzód.' };
    return { title: 'Trening czyni mistrza! 🚀', subtitle: 'Błędy to najszybsza droga do głębokiego zrozumienia JS.' };
  };

  const headline = getHeadline();

  return (
    <div className="max-w-xl w-full mx-auto px-4 py-6 flex-1 flex flex-col justify-center animate-fade-in">
      {/* Header & Owl Mascot */}
      <div className="text-center mb-5">
        <MascotOwl
          mood={wrongCount === 0 ? 'excited' : accuracy >= 60 ? 'happy' : 'thinking'}
          size={100}
          className="mx-auto mb-3 animate-bounce"
        />
        <h2 className="text-2xl sm:text-3xl font-black text-duo-yellow tracking-tight mb-1">
          {headline.title}
        </h2>
        <p className="text-xs sm:text-sm text-gray-400 max-w-md mx-auto">
          {headline.subtitle}
        </p>
        <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-[#1C262C] border border-[#2A373F] text-[11px] font-bold text-duo-blue">
          <span>{unitTitle}</span>
          <span>•</span>
          <span>Lekcja {lessonIndex}</span>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
        {/* Accuracy */}
        <div className="p-3 rounded-2xl bg-[#172227] border-2 border-[#2A373F] flex flex-col items-center text-center shadow-sm">
          <Award size={22} className="text-duo-green mb-1" />
          <span className="text-[10px] font-extrabold uppercase text-gray-400">Skuteczność</span>
          <span className="text-lg font-black text-white">{accuracy}%</span>
        </div>

        {/* Correct Answers */}
        <div className="p-3 rounded-2xl bg-[#172227] border-2 border-[#2A373F] flex flex-col items-center text-center shadow-sm">
          <CheckCircle2 size={22} className="text-duo-green mb-1" />
          <span className="text-[10px] font-extrabold uppercase text-gray-400">Poprawne</span>
          <span className="text-lg font-black text-white">{correctCount}</span>
        </div>

        {/* Errors / Mistakes */}
        <div className="p-3 rounded-2xl bg-[#172227] border-2 border-[#2A373F] flex flex-col items-center text-center shadow-sm">
          <XCircle size={22} className="text-duo-red mb-1" />
          <span className="text-[10px] font-extrabold uppercase text-gray-400">Błędy</span>
          <span className="text-lg font-black text-white">{wrongCount}</span>
        </div>

        {/* Earned XP */}
        <div className="p-3 rounded-2xl bg-[#172227] border-2 border-[#2A373F] flex flex-col items-center text-center shadow-sm">
          <Zap size={22} className="text-duo-yellow fill-duo-yellow mb-1" />
          <span className="text-[10px] font-extrabold uppercase text-gray-400">Punkty XP</span>
          <span className="text-lg font-black text-white">+{earnedXp}</span>
        </div>
      </div>

      {/* Recharts Effectiveness Chart Card */}
      <div className="bg-[#172227] border-2 border-[#2A373F] rounded-3xl p-4 sm:p-5 mb-5 shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-[#2A373F]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-duo-green/20 border border-duo-green/40 flex items-center justify-center text-duo-green">
              {chartType === 'donut' ? <PieIcon size={18} /> : <BarChart3 size={18} />}
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-white">
                Wykres skuteczności
              </h3>
              <p className="text-[11px] text-gray-400">
                Poprawne odpowiedzi vs błędy
              </p>
            </div>
          </div>

          {/* Chart View Toggle */}
          <div className="inline-flex p-0.5 rounded-xl bg-[#131F24] border border-[#2A373F]">
            <button
              onClick={() => setChartType('donut')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider flex items-center gap-1 transition-all ${
                chartType === 'donut'
                  ? 'bg-duo-blue text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <PieIcon size={12} />
              <span>Kołowy</span>
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider flex items-center gap-1 transition-all ${
                chartType === 'bar'
                  ? 'bg-duo-blue text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <BarChart3 size={12} />
              <span>Słupkowy</span>
            </button>
          </div>
        </div>

        {/* Chart Rendering Container */}
        <div className="w-full flex flex-col items-center justify-center pt-2">
          {chartType === 'donut' ? (
            <div className="w-full h-52 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <RechartsPieChart>
                  <Tooltip
                    formatter={(value: any, name: any) => [`${value} pyt.`, name]}
                    contentStyle={{
                      backgroundColor: '#172227',
                      borderColor: '#2A373F',
                      borderRadius: '12px',
                      color: '#FFFFFF',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                    }}
                    itemStyle={{ color: '#FFFFFF' }}
                  />
                  <Pie
                    data={chartPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={chartPieData.length > 1 ? 4 : 0}
                    dataKey="value"
                    stroke="#131F24"
                    strokeWidth={2}
                  >
                    {chartPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </RechartsPieChart>
              </ResponsiveContainer>

              {/* Center Donut Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-black text-white leading-none">{accuracy}%</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">Trafność</span>
              </div>
            </div>
          ) : (
            <div className="w-full h-52">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={barData} margin={{ top: 15, right: 10, left: -15, bottom: 5 }}>
                  <XAxis
                    dataKey="name"
                    stroke="#94A3B8"
                    fontSize={12}
                    fontWeight="bold"
                    tickLine={false}
                    axisLine={{ stroke: '#2A373F' }}
                  />
                  <YAxis
                    allowDecimals={false}
                    stroke="#94A3B8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#2A373F' }}
                  />
                  <Tooltip
                    formatter={(value: any) => [`${value} pytań`, 'Ilość']}
                    contentStyle={{
                      backgroundColor: '#172227',
                      borderColor: '#2A373F',
                      borderRadius: '12px',
                      color: '#FFFFFF',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                    }}
                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                  />
                  <Bar dataKey="ilosc" radius={[8, 8, 0, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Legend and summary label */}
          <div className="flex items-center justify-center gap-6 mt-3 text-xs font-bold">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-duo-green shadow-sm" />
              <span className="text-gray-300">Poprawne: <strong className="text-white">{correctCount}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-duo-red shadow-sm" />
              <span className="text-gray-300">Błędy: <strong className="text-white">{wrongCount}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-400">
              <Clock size={13} />
              <span>{formatDuration(durationSeconds)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Accordion: Questions Review */}
      {results.length > 0 && (
        <div className="mb-5">
          <button
            onClick={() => setShowReview(!showReview)}
            className="w-full p-3 rounded-2xl bg-[#172227] border border-[#2A373F] hover:bg-[#1E2B32] transition-colors flex items-center justify-between text-xs font-bold text-gray-300"
          >
            <div className="flex items-center gap-2">
              <HelpCircle size={16} className="text-duo-blue" />
              <span>Przejrzyj swoje odpowiedzi ({results.length})</span>
            </div>
            {showReview ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showReview && (
            <div className="mt-2 space-y-2 max-h-64 overflow-y-auto pr-1">
              {results.map((res, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-xl border text-xs ${
                    res.isCorrect
                      ? 'bg-green-950/20 border-duo-green/40'
                      : 'bg-red-950/20 border-duo-red/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="font-bold text-white flex-1">{res.questionText}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase shrink-0 ${
                        res.isCorrect ? 'bg-duo-green text-black' : 'bg-duo-red text-white'
                      }`}
                    >
                      {res.isCorrect ? 'Poprawnie' : 'Błąd'}
                    </span>
                  </div>

                  {!res.isCorrect && (
                    <div className="text-[11px] text-gray-300 space-y-0.5">
                      <p className="text-red-300">Twoja odpowiedź: <strong>{res.selectedOptionText}</strong></p>
                      <p className="text-green-300">Prawidłowa: <strong>{res.correctOptionText}</strong></p>
                    </div>
                  )}
                  {res.explanation && (
                    <p className="text-[11px] text-gray-400 mt-1 italic">
                      {res.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Action Button */}
      <button
        onClick={onContinue}
        className="w-full py-4 rounded-2xl bg-duo-green hover:bg-duo-greenDark text-black font-extrabold text-base tracking-wide uppercase shadow-[0_5px_0_#46a302] transition-transform active:translate-y-1 active:shadow-none flex items-center justify-center gap-2 cursor-pointer"
      >
        <span>Kontynuuj naukę</span>
        <ArrowRight size={20} className="stroke-[3]" />
      </button>
    </div>
  );
};
