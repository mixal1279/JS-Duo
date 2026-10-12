import React, { useMemo, useState } from 'react';
import { Award, CheckCircle2, ChevronLeft, ChevronRight, CirclePlay, Code2, Lightbulb, RotateCcw, Terminal, Trophy, XCircle } from 'lucide-react';
import { runJavaScriptInWorker, RunnerLog } from '../services/codeRunner';

interface CodingProject {
  id: string;
  title: string;
  level: string;
  objective: string;
  instructions: string[];
  starterCode: string;
  expectedOutput: string;
  hint: string;
  xp: number;
}

const PROJECTS: CodingProject[] = [
  {
    id: 'hello',
    title: 'Pierwszy program',
    level: 'Początkujący',
    objective: 'Wypisz dokładnie tekst: Cześć, programisto!',
    instructions: ['Użyj console.log(...).', 'Tekst musi być zapisany w cudzysłowie.', 'Uruchom kod i sprawdź wynik.'],
    starterCode: "console.log('Witaj!');",
    expectedOutput: 'Cześć, programisto!',
    hint: "Zmień tekst przekazany do console.log na 'Cześć, programisto!'.",
    xp: 15,
  },
  {
    id: 'variables',
    title: 'Kalkulator ceny',
    level: 'Początkujący',
    objective: 'Oblicz łączną cenę 5 przedmiotów po 12 zł każdy. Wynik powinien wynosić 60.',
    instructions: ['Zachowaj zmienne cena i ilosc.', 'Oblicz sumę, a nie różnicę ani iloczyn jednej sztuki.', 'Wypisz sam wynik.'],
    starterCode: 'const cena = 12;\nconst ilosc = 5;\nconsole.log(cena + ilosc);',
    expectedOutput: '60',
    hint: 'Łączna cena to cena jednego przedmiotu pomnożona przez liczbę sztuk.',
    xp: 20,
  },
  {
    id: 'function',
    title: 'Napraw funkcję',
    level: 'Początkujący',
    objective: 'Funkcja dodaj(a, b) powinna zwracać sumę. Dla 7 i 5 wynikiem jest 12.',
    instructions: ['Napraw ciało funkcji dodaj.', 'Nie wpisuj na sztywno wyniku 12.', 'Zachowaj wywołanie funkcji na końcu programu.'],
    starterCode: 'function dodaj(a, b) {\n  return a - b;\n}\n\nconsole.log(dodaj(7, 5));',
    expectedOutput: '12',
    hint: 'Operator odejmowania nie spełnia wymagania. Zmień działanie na dodawanie.',
    xp: 25,
  },
  {
    id: 'arrays',
    title: 'Filtrowanie listy',
    level: 'Średniozaawansowany',
    objective: 'Wypisz nazwy produktów tańszych niż 20 zł. Na liście jest książka za 15 zł i monitor za 700 zł.',
    instructions: ['Użyj metody filter.', 'Nie usuwaj danych z tablicy ręcznie.', 'Wynik ma zawierać nazwę Książka, ale nie Monitor.'],
    starterCode: "const produkty = [\n  { nazwa: 'Książka', cena: 15 },\n  { nazwa: 'Monitor', cena: 700 }\n];\nconst tanie = produkty.filter((produkt) => produkt.cena > 20);\nconsole.log(tanie.map((produkt) => produkt.nazwa));",
    expectedOutput: 'Książka',
    hint: 'Warunek powinien wybierać ceny mniejsze niż 20. Znak > wybiera teraz droższe produkty.',
    xp: 30,
  },
  {
    id: 'objects',
    title: 'Dane użytkownika',
    level: 'Średniozaawansowany',
    objective: 'Odczytaj właściwość name z obiektu user i wypisz Ada Lovelace.',
    instructions: ['Obiekt zawiera właściwość name.', 'Odczytaj właściwość przez kropkę.', 'Nie wpisuj wyniku bezpośrednio w console.log.'],
    starterCode: "const user = {\n  name: 'Ada Lovelace',\n  role: 'programistka'\n};\nconsole.log(user.role);",
    expectedOutput: 'Ada Lovelace',
    hint: 'Właściwość role zawiera inny tekst niż imię i nazwisko. Odczytaj user.name.',
    xp: 35,
  },
];

const COMPLETED_KEY = 'js_duo_completed_projects_v1';

export const clearProjectProgress = (): void => {
  try { localStorage.removeItem(COMPLETED_KEY); } catch { /* no-op */ }
};
const readCompleted = (): string[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem(COMPLETED_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch { return []; }
};

interface ProjectLabViewProps { onEarnXp: (xp: number) => void; }

export const ProjectLabView: React.FC<ProjectLabViewProps> = ({ onEarnXp }) => {
  const [projectIndex, setProjectIndex] = useState(0);
  const [code, setCode] = useState(PROJECTS[0].starterCode);
  const [logs, setLogs] = useState<RunnerLog[]>([]);
  const [running, setRunning] = useState(false);
  const [passed, setPassed] = useState(false);
  const [completed, setCompleted] = useState<string[]>(readCompleted);
  const [showHint, setShowHint] = useState(false);
  const [runCount, setRunCount] = useState(0);
  const project = PROJECTS[projectIndex];
  const isCompleted = completed.includes(project.id);
  const completedCount = useMemo(() => completed.length, [completed]);

  const selectProject = (index: number) => {
    const next = PROJECTS[index];
    setProjectIndex(index);
    setCode(next.starterCode);
    setLogs([]);
    setPassed(false);
    setShowHint(false);
    setRunCount(0);
  };

  const runProject = async () => {
    setRunning(true);
    setPassed(false);
    setRunCount((value) => value + 1);
    try {
      const result = await runJavaScriptInWorker(code, 3000);
      setLogs(result.logs);
      const output = result.logs.filter((log) => log.type !== 'error').map((log) => log.text).join('\n');
      const numericExpected = /^-?\d+(\.\d+)?$/.test(project.expectedOutput);
      const matchesOutput = numericExpected
        ? output.trim().split(/\r?\n/).some((line) => line.trim() === project.expectedOutput)
        : output.includes(project.expectedOutput);
      const success = !result.timedOut && !result.logs.some((log) => log.type === 'error') && matchesOutput;
      setPassed(success);
      if (success && !completed.includes(project.id)) {
        const next = [...completed, project.id];
        setCompleted(next);
        try { localStorage.setItem(COMPLETED_KEY, JSON.stringify(next)); } catch { /* local progress may be unavailable */ }
        onEarnXp(project.xp);
      }
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5 pb-6">
      <header className="rounded-3xl border border-[#2A373F] bg-gradient-to-br from-[#20333B] to-[#131F24] p-5 sm:p-7">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-duo-green/15 p-3 text-duo-green"><Code2 size={30} /></div>
          <div className="flex-1">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-duo-green">Nauka przez praktykę</p>
            <h1 className="mt-1 text-2xl font-black sm:text-3xl">Projekty programistyczne</h1>
            <p className="mt-2 text-sm leading-6 text-gray-300">Naprawiaj działający kod, realizuj konkretne wymagania i sprawdzaj wynik. Każdy projekt ma kryterium zaliczenia oraz podpowiedź.</p>
          </div>
          <div className="rounded-2xl border border-[#3A4B52] bg-[#10191E] px-3 py-2 text-center">
            <Trophy className="mx-auto text-duo-yellow" size={20} />
            <div className="mt-1 text-lg font-black">{completedCount}/{PROJECTS.length}</div>
            <div className="text-[10px] font-bold text-gray-400">UKOŃCZONE</div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
        <aside className="space-y-2 sm:col-span-2">
          {PROJECTS.map((item, index) => {
            const done = completed.includes(item.id);
            return <button key={item.id} onClick={() => selectProject(index)} className={`flex w-full items-center gap-3 rounded-2xl border-2 p-3 text-left transition-colors ${index === projectIndex ? 'border-duo-green bg-duo-green/10' : 'border-[#2A373F] bg-[#172127] hover:border-[#52656F]'}`}>
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${done ? 'bg-duo-green/15 text-duo-green' : 'bg-[#26343B] text-gray-300'}`}>{done ? <CheckCircle2 size={20} /> : <span className="font-black">{index + 1}</span>}</span>
              <span className="min-w-0 flex-1"><span className="block text-sm font-extrabold">{item.title}</span><span className="mt-0.5 block text-[10px] font-bold uppercase text-gray-400">{item.level} · {item.xp} XP</span></span>
              {done && <Award size={16} className="text-duo-green" />}
            </button>;
          })}
        </aside>

        <section className="min-w-0 space-y-4 sm:col-span-3">
          <div className="rounded-3xl border-2 border-[#2A373F] bg-[#172127] p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div><p className="text-xs font-black uppercase tracking-wider text-duo-blue">Projekt {projectIndex + 1} · {project.level}</p><h2 className="mt-1 text-xl font-black">{project.title}</h2></div>
              {isCompleted && <span className="flex items-center gap-1 rounded-full bg-duo-green/10 px-2.5 py-1 text-xs font-black text-duo-green"><CheckCircle2 size={14} />Zaliczone</span>}
            </div>
            <p className="mt-3 text-sm leading-6 text-gray-300">{project.objective}</p>
            <ul className="mt-3 space-y-2">{project.instructions.map((instruction) => <li key={instruction} className="flex gap-2 text-sm text-gray-400"><span className="text-duo-green">•</span>{instruction}</li>)}</ul>
          </div>

          <div className="overflow-hidden rounded-3xl border-2 border-[#2A373F] bg-[#0D1418]">
            <div className="flex items-center justify-between border-b border-[#2A373F] bg-[#1C262C] px-4 py-3"><span className="flex items-center gap-2 text-xs font-black text-gray-200"><Terminal size={15} className="text-duo-blue" />project.js</span><span className="text-[10px] font-bold text-gray-500">AUTOSAVE NIEAKTYWNY</span></div>
            <textarea aria-label="Edytor kodu projektu" value={code} onChange={(event) => setCode(event.target.value)} spellCheck={false} rows={12} className="w-full resize-y bg-transparent p-4 font-mono text-sm leading-6 text-[#D7F7C6] outline-none selection:bg-duo-green/20" />
            <div className="flex flex-wrap items-center gap-2 border-t border-[#2A373F] bg-[#172127] p-3">
              <button onClick={runProject} disabled={running} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-duo-green px-4 py-3 text-sm font-black text-black disabled:opacity-50"><CirclePlay size={18} />{running ? 'Uruchamianie…' : 'Uruchom i sprawdź'}</button>
              <button onClick={() => { setCode(project.starterCode); setLogs([]); setPassed(false); }} className="rounded-xl border border-[#3A4A52] p-3 text-gray-300" aria-label="Przywróć kod początkowy"><RotateCcw size={17} /></button>
              <button onClick={() => setShowHint((value) => !value)} className="flex items-center gap-2 rounded-xl border border-[#3A4A52] px-3 py-3 text-sm font-bold text-duo-yellow"><Lightbulb size={17} />Podpowiedź</button>
            </div>
          </div>

          {showHint && <div className="rounded-2xl border border-duo-yellow/30 bg-duo-yellow/10 p-4 text-sm leading-6 text-gray-200"><strong className="text-duo-yellow">Podpowiedź:</strong> {project.hint}</div>}
          {logs.length > 0 && <div className="rounded-2xl border border-[#2A373F] bg-[#10191E] p-4"><h3 className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-gray-400"><Terminal size={15} />Wynik programu</h3>{logs.map((log, index) => <pre key={index} className={`whitespace-pre-wrap break-words py-1 font-mono text-xs ${log.type === 'error' ? 'text-duo-red' : 'text-gray-200'}`}>{log.text}</pre>)}</div>}
          {runCount > 0 && <div className={`flex items-start gap-3 rounded-2xl border p-4 ${passed ? 'border-duo-green/40 bg-duo-green/10' : 'border-duo-red/30 bg-duo-red/5'}`}>{passed ? <CheckCircle2 className="shrink-0 text-duo-green" /> : <XCircle className="shrink-0 text-duo-red" />}<div><p className="font-extrabold">{passed ? (isCompleted ? 'Projekt zaliczony' : 'Świetnie, projekt zaliczony!') : 'Jeszcze nie — spróbuj ponownie'}</p><p className="mt-1 text-sm text-gray-300">{passed ? `Wymaganie spełnione. XP za ten projekt przyznawane jest tylko przy pierwszym zaliczeniu.` : 'Porównaj wynik z wymaganiem, przeczytaj podpowiedź i popraw kod.'}</p></div></div>}

          <div className="flex justify-between gap-3"><button disabled={projectIndex === 0} onClick={() => selectProject(projectIndex - 1)} className="flex items-center gap-1 rounded-xl border border-[#3A4A52] px-4 py-2 text-sm font-bold disabled:opacity-30"><ChevronLeft size={17} />Poprzedni</button><button disabled={projectIndex === PROJECTS.length - 1} onClick={() => selectProject(projectIndex + 1)} className="flex items-center gap-1 rounded-xl border border-[#3A4A52] px-4 py-2 text-sm font-bold disabled:opacity-30">Następny<ChevronRight size={17} /></button></div>
        </section>
      </div>
    </div>
  );
};
