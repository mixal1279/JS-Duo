export interface LessonStudyUnit {
  description: string;
  topics: string[];
  example: string;
  exampleExplanation: string;
}

export const LESSON_STUDY_UNITS: Record<number, LessonStudyUnit> = {
  1: {
    description: 'Poznaj zmienne, typy wartości i operatory, z których buduje się logikę programu.',
    topics: ['Zmienne let, const i var', 'Typy proste i typeof', 'Porównania i konwersja typów', 'Operatory logiczne i ??', 'Template literals i stringi', 'Liczby, Math i parsowanie', 'Operator trójargumentowy i przypisania', 'BigInt i Symbol', 'Warunki i pętle', 'Pułapki typów i konwersji'],
    example: 'const imie = "Ada";\nconst punkty = 12;\nconst aktywny = punkty >= 10;\nconsole.log(`${imie}: ${aktywny}`);',
    exampleExplanation: 'const chroni przypisanie zmiennej przed ponownym przypisaniem, a template literal wstawia wartości przez `${...}`. Operator >= porównuje liczby.',
  },
  2: {
    description: 'Funkcje pozwalają wydzielać logikę, przekazywać dane i kontrolować zasięg zmiennych.',
    topics: ['Deklaracje funkcji', 'Arrow functions', 'Parametry domyślne i rest', 'IIFE i scope', 'Closures i fabryki funkcji', 'Funkcje wyższego rzędu i currying', 'Rekurencja i Call Stack', 'call, apply i bind', 'Wzorce funkcyjne', 'Funkcje i TDZ'],
    example: 'const pomnoz = (a, b = 2) => a * b;\nconsole.log(pomnoz(5)); // 10',
    exampleExplanation: 'Funkcja strzałkowa może mieć parametr domyślny. Jeśli drugi argument nie zostanie przekazany, b przyjmie wartość 2.',
  },
  3: {
    description: 'Metody tablicowe pomagają przekształcać, filtrować i agregować kolekcje danych.',
    topics: ['Tablice, map i forEach', 'filter, find, some i every', 'reduce', 'sort i niemutujące sortowanie', 'slice i splice', 'flat i flatMap', 'Array.from, iteratory', 'Destrukturyzacja i spread', 'Metody mutujące i niemutujące', 'TypedArrays i optymalizacje'],
    example: 'const ceny = [10, 20, 30];\nconst zVat = ceny.map(cena => cena * 1.23);\nconsole.log(zVat);',
    exampleExplanation: 'map tworzy nową tablicę z wyników funkcji dla każdego elementu; nie zmienia tablicy źródłowej.',
  },
  4: {
    description: 'Obiekty przechowują dane i zachowanie; prototypy oraz klasy pozwalają modelować relacje między nimi.',
    topics: ['Właściwości obiektów', 'freeze i seal', 'Deskryptory właściwości', 'Wiązanie this', 'Łańcuch prototypów', 'Klasy i dziedziczenie', 'Pola statyczne i prywatne', 'new i konstruktory', 'Klonowanie i niemutowalność', 'Proxy i zaawansowane obiekty'],
    example: 'const user = { imie: "Ada" };\nObject.freeze(user);\n// user.imie = "Ola" nie zmieni zamrożonej właściwości',
    exampleExplanation: 'Object.freeze blokuje zmianę istniejących właściwości i dodawanie nowych na danym obiekcie. Nie zamraża automatycznie zagnieżdżonych obiektów.',
  },
  5: {
    description: 'Asynchroniczność pozwala obsługiwać timery, sieć i długie operacje bez blokowania głównego przepływu.',
    topics: ['Asynchroniczność i Call Stack', 'Timery i macrotaski', 'Microtask Queue i Macrotask Queue', 'Promise i łańcuchy', 'Kombinatory Promise', 'async/await i błędy', 'Fetch, Response i AbortController', 'Generatory asynchroniczne', 'Web Workers', 'Zaawansowany Event Loop'],
    example: 'async function pobierz() {\n  try {\n    const response = await fetch("/api/data");\n    if (!response.ok) throw new Error("HTTP error");\n    return await response.json();\n  } catch (error) {\n    console.error(error);\n  }\n}',
    exampleExplanation: 'await czeka na rozstrzygnięcie Promise wewnątrz funkcji async. Sprawdzaj response.ok, ponieważ błędy HTTP nie odrzucają automatycznie Promise zwróconego przez fetch.',
  },
  6: {
    description: 'DOM i Web API łączą kod JavaScript z interfejsem strony, formularzami i zdarzeniami przeglądarki.',
    topics: ['Wyszukiwanie elementów DOM', 'Manipulacja DOM i bezpieczeństwo', 'Klasy, atrybuty i dataset', 'Fazy zdarzeń', 'Delegacja zdarzeń', 'Formularze i preventDefault', 'Reflow i repaint', 'Obserwatory przeglądarki', 'Storage, cookies i IndexedDB', 'Cykl życia strony i Web API'],
    example: 'const button = document.querySelector("button");\nbutton?.addEventListener("click", () => {\n  document.querySelector("#status")?.textContent = "Gotowe";\n});',
    exampleExplanation: 'querySelector zwraca element albo null, dlatego opcjonalne sprawdzenie chroni przed wywołaniem metody na nieistniejącym elemencie.',
  },
  7: {
    description: 'Nowoczesny JavaScript oferuje krótszą składnię, bezpieczniejszy dostęp do danych i wyspecjalizowane kolekcje.',
    topics: ['Moduły ES', 'Optional chaining i nullish coalescing', 'Map i Set', 'WeakMap, WeakSet i GC', 'Generatory i iteracja', 'Symbol', 'BigInt', 'Wyrażenia regularne', 'Intl', 'Nowości ES2023 i ES2024'],
    example: 'const nazwa = user?.profile?.name ?? "Gość";\nconst unikalne = [...new Set([1, 1, 2, 3])];',
    exampleExplanation: '?. przerywa odczyt, gdy wcześniejsza wartość jest null lub undefined. ?? używa wartości domyślnej tylko dla null i undefined, a Set przechowuje unikalne wartości.',
  },
  8: {
    description: 'Ta część utrwala zachowanie języka w nietypowych przypadkach i uczy rozpoznawać pułapki konwersji.',
    topics: ['Konfiguracja TypeScript i podstawy', 'any, unknown i never', 'interface i type', 'Unie, przecięcia i zawężanie', 'Generyki', 'Utility types', 'Typy warunkowe i infer', 'Mapped i template literal types', 'as const i satisfies', 'Zaawansowany TypeScript i dekoratory'],
    example: 'function identity<T>(value: T): T {\n  return value;\n}\nconst wynik = identity<number>(42);',
    exampleExplanation: 'Generyk T pozwala zachować informację o typie przekazanej wartości bez uciekania się do any.',
  },
  9: {
    description: 'Wzorce projektowe, testy i zasady bezpieczeństwa pomagają budować łatwiejsze w utrzymaniu aplikacje.',
    topics: ['Wzorce kreacyjne', 'Observer, PubSub i Facade', 'SOLID i Clean Code', 'Piramida testów i TDD', 'Mocki, spy i Vitest/Jest', 'XSS, CSRF i CORS', 'Architektura frontendowa', 'Refaktoryzacja i code smells', 'Testy E2E i dostępność', 'CI/CD'],
    example: 'function renderName(name) {\n  const node = document.querySelector("#name");\n  if (node) node.textContent = name;\n}',
    exampleExplanation: 'Wstawiaj niezaufany tekst przez textContent, a nie innerHTML. To ogranicza ryzyko interpretowania danych użytkownika jako HTML.',
  },
  10: {
    description: 'Zaawansowane techniki obejmują analizę wydajności, zarządzanie pamięcią, bezpieczeństwo i architekturę.',
    topics: ['V8 JIT i hidden classes', 'Wycieki pamięci i profilowanie', 'Web Workers', 'Service Workers i PWA', 'WebAssembly', 'Bundlery i tree shaking', 'Core Web Vitals', 'Animacje, Canvas i WebGL', 'SRI, CSP i Trusted Types', 'Zaawansowane techniki JavaScript'],
    example: 'const handler = () => console.log("resize");\nwindow.addEventListener("resize", handler);\n// Gdy listener nie jest już potrzebny:\nwindow.removeEventListener("resize", handler);',
    exampleExplanation: 'Długowieczne listenery mogą utrzymywać referencje do obiektów. Usuń je, gdy komponent lub widok przestaje być używany.',
  },
};

export function getLessonStudyContent(unitId: number, lessonIndex: number) {
  const unit = LESSON_STUDY_UNITS[unitId] ?? LESSON_STUDY_UNITS[1];
  return {
    ...unit,
    topic: unit.topics[Math.max(0, Math.min(unit.topics.length - 1, lessonIndex - 1))],
  };
}
