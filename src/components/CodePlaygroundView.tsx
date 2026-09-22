import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  RotateCcw,
  Sparkles,
  Terminal,
  Code2,
  Copy,
  Check,
  Zap,
  Trash2,
  BookOpen,
  HelpCircle,
  Clock,
  AlertTriangle,
  Lightbulb,
  Share2,
} from 'lucide-react';
import { soundService } from '../services/soundService';
import { storageService } from '../services/storageService';

interface ConsoleLogEntry {
  type: 'log' | 'info' | 'warn' | 'error' | 'result';
  text: string;
  time: string;
}

interface PlaygroundSnippet {
  id: string;
  title: string;
  category: string;
  description: string;
  code: string;
}

const SNIPPET_TEMPLATES: PlaygroundSnippet[] = [
  {
    id: 'hello_world',
    title: 'Witaj w JS Sandbox',
    category: 'Podstawy',
    description: 'Proste operacje na tablicach i formatowanie stringów',
    code: `// Witaj w piaskownicy JavaScript!
const jezyki = ['JavaScript', 'TypeScript', 'Node.js'];

console.log('🚀 Dostępne technologie:', jezyki.join(', '));

// Nowoczesne metody tablicowe (ES6+)
const zDuzej = jezyki.map((lang, index) => \`\${index + 1}. \${lang.toUpperCase()}\`);
console.log('Lista:', zDuzej);

// Obliczenie sumy liter
const sumaLiter = jezyki.reduce((acc, curr) => acc + curr.length, 0);
console.log('Łączna liczba liter:', sumaLiter);`,
  },
  {
    id: 'closure_counter',
    title: 'Domknięcie (Closure)',
    category: 'Zaawansowane',
    description: 'Prywatny stan i funkcja fabryczna z licznikiem',
    code: `// Przykład domknięcia (Closure)
function stworzLicznik(nazwa = 'Główny') {
  let licznik = 0; // Zmienna prywatna w leksykalnym zasięgu
  
  return {
    zwieksz() {
      licznik++;
      console.log(\`[\${nazwa}] Wartość: \${licznik}\`);
      return licznik;
    },
    reset() {
      licznik = 0;
      console.warn(\`[\${nazwa}] Zresetowano licznik!\`);
    },
    pobierz: () => licznik
  };
}

const licznikA = stworzLicznik('Licznik A');
licznikA.zwieksz();
licznikA.zwieksz();
licznikA.zwieksz();

console.log('Końcowy stan:', licznikA.pobierz());`,
  },
  {
    id: 'async_promises',
    title: 'Async / Await & Promise',
    category: 'Asynchroniczność',
    description: 'Symulacja pobierania danych i kolejka mikrozadań',
    code: `// Testowanie operacji asynchronicznych
function pobierzUzytkownika(id) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (id <= 0) reject(new Error('Nieprawidłowe ID użytkownika!'));
      else resolve({ id, imie: 'Jan Kowalski', ranga: 'Senior Dev' });
    }, 400);
  });
}

async function wykonajTest() {
  console.log('⏳ Rozpoczynam pobieranie danych...');
  try {
    const user = await pobierzUzytkownika(1);
    console.log('✅ Odebrano dane:', user);
    console.log(\`Powitanie: Cześć, \${user.imie}!\`);
  } catch (err) {
    console.error('Wystąpił błąd:', err.message);
  }
}

wykonajTest();`,
  },
  {
    id: 'destructuring_spread',
    title: 'Destrukturyzacja i Spread',
    category: 'ES6+',
    description: 'Rest, spread operator i domyślne parametry',
    code: `const uzytkownik = {
  nick: 'CodeMaster',
  punkty: 1350,
  osiagniecia: ['Streak 7 dni', 'Mistrz Pętli'],
  statystyki: { wygranePojedynki: 12, liga: 'Diamentowa' }
};

// Destrukturyzacja z przypisaniem domyślnym i aliasem
const { nick, punkty: exp, statystyki: { liga } } = uzytkownik;
console.log(\`Gracz: \${nick}, XP: \${exp}, Liga: \${liga}\`);

// Łączenie tablic za pomocą spread (...)
const noweOsiagniecia = [...uzytkownik.osiagniecia, 'Pogromca Bugów'];
console.log('Wszystkie odznaki:', noweOsiagniecia);`,
  },
  {
    id: 'event_loop_quiz',
    title: 'Event Loop & Kolejność',
    category: 'Architektura JS',
    description: 'Call Stack vs Microtasks (Promise) vs Macrotasks (setTimeout)',
    code: `// Słynna zagadka kolejności wykonywania w V8!
console.log('1: Synchroniczny początek');

setTimeout(() => {
  console.log('2: Macrotask (setTimeout)');
}, 0);

Promise.resolve().then(() => {
  console.log('3: Microtask (Promise)');
});

console.log('4: Synchroniczny koniec');
// Kolejność wywołań w konsoli to: 1, 4, 3, 2!`,
  },
];

const SANDBOX_CODE_STORAGE_KEY = 'js_duo_playground_custom_code_v1';

export const CodePlaygroundView: React.FC = () => {
  const [code, setCode] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(SANDBOX_CODE_STORAGE_KEY);
      if (saved && saved.trim()) return saved;
    } catch {
      // fallback
    }
    return SNIPPET_TEMPLATES[0].code;
  });

  const [logs, setLogs] = useState<ConsoleLogEntry[]>([
    {
      type: 'info',
      text: 'Witaj w piaskownicy JavaScript! Wpisz swój kod i kliknij "Uruchom kod" (Ctrl + Enter).',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    },
  ]);

  const [isRunning, setIsRunning] = useState(false);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedSnippetId, setSelectedSnippetId] = useState<string>(SNIPPET_TEMPLATES[0].id);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const consoleBottomRef = useRef<HTMLDivElement>(null);

  // Auto-save code to local storage
  useEffect(() => {
    try {
      localStorage.setItem(SANDBOX_CODE_STORAGE_KEY, code);
    } catch {
      // ignore
    }
  }, [code]);

  // Scroll console to bottom on new log
  useEffect(() => {
    consoleBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Keyboard shortcut Ctrl+Enter or Cmd+Enter to execute
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      runCode();
    } else if (e.key === 'Tab') {
      // Insert 2 spaces for tab
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const nextCode = code.substring(0, start) + '  ' + code.substring(end);
      setCode(nextCode);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  const formatLogArg = (arg: unknown): string => {
    if (arg === undefined) return 'undefined';
    if (arg === null) return 'null';
    if (typeof arg === 'function') return arg.toString();
    if (arg instanceof Error) return `${arg.name}: ${arg.message}\n${arg.stack || ''}`;
    if (typeof arg === 'object') {
      try {
        return JSON.stringify(arg, null, 2);
      } catch {
        return Object.prototype.toString.call(arg);
      }
    }
    return String(arg);
  };

  const runCode = () => {
    soundService.playClick();
    setIsRunning(true);

    const startTime = performance.now();
    const newLogs: ConsoleLogEntry[] = [];
    const getTime = () =>
      new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Custom console interception
    const customConsole = {
      log: (...args: unknown[]) => {
        const text = args.map(formatLogArg).join(' ');
        newLogs.push({ type: 'log', text, time: getTime() });
      },
      info: (...args: unknown[]) => {
        const text = args.map(formatLogArg).join(' ');
        newLogs.push({ type: 'info', text, time: getTime() });
      },
      warn: (...args: unknown[]) => {
        const text = args.map(formatLogArg).join(' ');
        newLogs.push({ type: 'warn', text, time: getTime() });
      },
      error: (...args: unknown[]) => {
        const text = args.map(formatLogArg).join(' ');
        newLogs.push({ type: 'error', text, time: getTime() });
      },
      table: (...args: unknown[]) => {
        const text = args.map(formatLogArg).join(' ');
        newLogs.push({ type: 'log', text: `[Table]:\n${text}`, time: getTime() });
      },
    };

    try {
      // Safe execution sandbox using Function constructor with custom console
      const sandboxFn = new Function('console', `
        "use strict";
        try {
          ${code}
        } catch (innerErr) {
          console.error(innerErr);
        }
      `);

      sandboxFn(customConsole);

      const endTime = performance.now();
      const elapsed = Math.round((endTime - startTime) * 100) / 100;
      setExecutionTime(elapsed);

      if (newLogs.length === 0) {
        newLogs.push({
          type: 'info',
          text: 'Kod wykonał się pomyślnie (brak wywołań console.log).',
          time: getTime(),
        });
      }

      setLogs((prev) => [...prev, ...newLogs]);
      soundService.playCorrect();
    } catch (err: unknown) {
      const endTime = performance.now();
      setExecutionTime(Math.round((endTime - startTime) * 100) / 100);

      const errMessage = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
      newLogs.push({
        type: 'error',
        text: `Błąd wykonania: ${errMessage}`,
        time: getTime(),
      });
      setLogs((prev) => [...prev, ...newLogs]);
      soundService.playWrong();
    } finally {
      setIsRunning(false);
    }
  };

  const handleClearConsole = () => {
    soundService.playClick();
    setLogs([]);
  };

  const handleResetToDefault = () => {
    soundService.playClick();
    const snippet = SNIPPET_TEMPLATES.find((s) => s.id === selectedSnippetId) || SNIPPET_TEMPLATES[0];
    setCode(snippet.code);
  };

  const handleSelectSnippet = (snippet: PlaygroundSnippet) => {
    soundService.playClick();
    setSelectedSnippetId(snippet.id);
    setCode(snippet.code);
    setLogs([
      {
        type: 'info',
        text: `Załadowano szablon: "${snippet.title}". Kliknij "Uruchom kod", aby przetestować działanie.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      },
    ]);
  };

  const handleCopyCode = () => {
    soundService.playClick();
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lineCount = code.split('\n').length;

  return (
    <div className="space-y-4 max-w-4xl mx-auto select-none">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#172630] via-[#1B2A34] to-[#172127] border-2 border-[#2A373F] rounded-3xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-duo-yellow/20 border border-duo-yellow/40 flex items-center justify-center text-duo-yellow">
                <Code2 size={18} />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <span>Laboratorium JS</span>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-duo-green/20 text-duo-green border border-duo-green/40">
                  Sandbox
                </span>
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-gray-300">
              Pisz, eksperymentuj i testuj kod JavaScript w czasie rzeczywistym z podglądem konsoli!
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              onClick={handleCopyCode}
              className="px-3 py-2 rounded-xl bg-[#232E35] hover:bg-[#2C3B44] text-gray-200 border border-[#2A373F] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Kopiuj cały kod"
            >
              {copied ? <Check size={14} className="text-duo-green" /> : <Copy size={14} />}
              <span>{copied ? 'Skopiowano' : 'Kopiuj'}</span>
            </button>

            <button
              onClick={handleResetToDefault}
              className="px-3 py-2 rounded-xl bg-[#232E35] hover:bg-[#2C3B44] text-gray-200 border border-[#2A373F] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Resetuj do szablonu"
            >
              <RotateCcw size={14} />
              <span>Resetuj</span>
            </button>
          </div>
        </div>
      </div>

      {/* Snippets / Preset Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
            <Sparkles size={14} className="text-duo-yellow" />
            <span>Gotowe szablony do nauki:</span>
          </span>
          <span className="text-[11px] text-gray-500">Wybierz, by załadować</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {SNIPPET_TEMPLATES.map((snippet) => {
            const isSelected = selectedSnippetId === snippet.id;
            return (
              <button
                key={snippet.id}
                onClick={() => handleSelectSnippet(snippet)}
                className={`px-3 py-2 rounded-2xl border text-left shrink-0 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-duo-green/20 border-duo-green text-duo-green font-black shadow-[0_2px_0_#46a302]'
                    : 'bg-[#172127] border-[#2A373F] text-gray-300 hover:text-white hover:border-[#384852]'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-extrabold">{snippet.title}</span>
                  <span
                    className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-black ${
                      isSelected ? 'bg-duo-green/30 text-duo-green' : 'bg-[#232E35] text-gray-400'
                    }`}
                  >
                    {snippet.category}
                  </span>
                </div>
                <div className="text-[10px] text-gray-400 truncate max-w-[200px] mt-0.5">
                  {snippet.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Code Editor and Console Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Code Editor */}
        <div className="bg-[#172127] border-2 border-[#2A373F] rounded-3xl overflow-hidden flex flex-col shadow-xl">
          {/* Editor Header Bar */}
          <div className="bg-[#1C262C] px-4 py-2.5 border-b border-[#2A373F] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block" />
              </div>
              <span className="text-xs font-mono font-bold text-gray-300 ml-2">sandbox.js</span>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-gray-400 font-mono">
              <span>{lineCount} linii</span>
              <span>•</span>
              <span>UTF-8</span>
            </div>
          </div>

          {/* Textarea with Line Numbers layout */}
          <div className="relative flex-1 min-h-[340px] sm:min-h-[400px] bg-[#0E151A] font-mono text-xs sm:text-sm">
            <textarea
              ref={textareaRef}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              className="w-full h-full min-h-[340px] sm:min-h-[400px] p-4 bg-transparent text-[#E6EDF3] resize-y focus:outline-none leading-relaxed font-mono selection:bg-duo-green/30"
              placeholder="// Wpisz tutaj swój kod JavaScript..."
            />
          </div>

          {/* Editor Footer / Run Action */}
          <div className="bg-[#1C262C] p-3 border-t border-[#2A373F] flex items-center justify-between gap-2">
            <div className="text-[11px] text-gray-400 hidden sm:flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded bg-[#232E35] border border-[#2A373F] text-gray-300 font-bold">
                Ctrl + Enter
              </span>
              <span>lub</span>
              <span className="px-1.5 py-0.5 rounded bg-[#232E35] border border-[#2A373F] text-gray-300 font-bold">
                Cmd + Enter
              </span>
              <span>aby uruchomić</span>
            </div>

            <button
              onClick={runCode}
              disabled={isRunning}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-2xl bg-duo-green hover:bg-duo-greenDark text-black font-black text-xs sm:text-sm uppercase tracking-wider shadow-[0_3px_0_#46a302] active:translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Play size={16} className="fill-black" />
              <span>{isRunning ? 'Wykonywanie...' : 'Uruchom kod'}</span>
            </button>
          </div>
        </div>

        {/* Right: Output Console */}
        <div className="bg-[#172127] border-2 border-[#2A373F] rounded-3xl overflow-hidden flex flex-col shadow-xl">
          {/* Console Header */}
          <div className="bg-[#1C262C] px-4 py-2.5 border-b border-[#2A373F] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal size={16} className="text-duo-blue" />
              <span className="text-xs font-mono font-black text-white uppercase tracking-wider">
                Konsola (Output)
              </span>
              {executionTime !== null && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-duo-blue border border-duo-blue/30">
                  {executionTime} ms
                </span>
              )}
            </div>

            <button
              onClick={handleClearConsole}
              className="text-gray-400 hover:text-red-400 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer p-1 rounded-lg"
              title="Wyczyść konsolę"
            >
              <Trash2 size={13} />
              <span>Wyczyść</span>
            </button>
          </div>

          {/* Console Body */}
          <div className="flex-1 min-h-[340px] sm:min-h-[400px] max-h-[500px] overflow-y-auto p-3.5 bg-[#0D1418] font-mono text-xs space-y-2">
            {logs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 py-16 space-y-2">
                <Terminal size={32} className="opacity-40" />
                <p>Konsola jest pusta.</p>
                <p className="text-[11px] text-gray-600">
                  Użyj <span className="text-duo-blue">console.log(...)</span> i kliknij &quot;Uruchom kod&quot;.
                </p>
              </div>
            ) : (
              logs.map((log, idx) => {
                let badgeColor = 'text-gray-400 bg-gray-800';
                let textColor = 'text-gray-200';
                let borderColor = 'border-transparent';

                if (log.type === 'error') {
                  badgeColor = 'text-red-400 bg-red-950/50 border-red-500/40';
                  textColor = 'text-red-300 font-semibold';
                  borderColor = 'border-red-500/30';
                } else if (log.type === 'warn') {
                  badgeColor = 'text-amber-400 bg-amber-950/50 border-amber-500/40';
                  textColor = 'text-amber-200';
                  borderColor = 'border-amber-500/30';
                } else if (log.type === 'info') {
                  badgeColor = 'text-duo-blue bg-blue-950/40 border-duo-blue/30';
                  textColor = 'text-blue-200';
                  borderColor = 'border-duo-blue/20';
                }

                return (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl bg-[#131C21] border ${borderColor} transition-colors`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
                      <span className={`px-1.5 py-0.2 rounded border text-[9px] uppercase font-bold ${badgeColor}`}>
                        {log.type}
                      </span>
                      <span>{log.time}</span>
                    </div>
                    <pre className={`whitespace-pre-wrap break-words leading-relaxed ${textColor}`}>
                      {log.text}
                    </pre>
                  </div>
                );
              })
            )}
            <div ref={consoleBottomRef} />
          </div>

          {/* Console Quick Helpers */}
          <div className="bg-[#162026] p-2.5 border-t border-[#2A373F] flex items-center justify-between text-[11px] text-gray-400">
            <span className="flex items-center gap-1">
              <Lightbulb size={13} className="text-duo-yellow" />
              <span>Działa pełny ES2024, async/await oraz obiekty globalne.</span>
            </span>
            <span className="font-bold text-gray-500">{logs.length} wpisów</span>
          </div>
        </div>
      </div>
    </div>
  );
};
