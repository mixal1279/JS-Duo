import { Unit } from '../types';

export const UNITS: Unit[] = [
  {
    id: 1,
    title: 'Podstawy: Zmienne, Typy i Operatory',
    description: 'Opanuj let, const, var, prymitywy, operatory logiczne i arytmetyczne w JS.',
    color: '#58cc02', // Duo Green
    totalQuestions: 50,
    icon: 'Terminal',
  },
  {
    id: 2,
    title: 'Funkcje, Zasięg i Domknięcia (Closures)',
    description: 'Funkcje strzałkowe, hoisting, zasięg leksykalny i potęga closures.',
    color: '#1cb0f6', // Duo Blue
    totalQuestions: 50,
    icon: 'Code2',
  },
  {
    id: 3,
    title: 'Tablice i Metody Funkcyjne',
    description: 'Mistrzostwo w map(), filter(), reduce(), find(), sort() i niemutowalności.',
    color: '#ff9600', // Duo Orange
    totalQuestions: 50,
    icon: 'Layers',
  },
  {
    id: 4,
    title: 'Obiekty, Słowo "this" i Klasy ES6',
    description: 'Prototypy, wiązanie kontekstu this (bind/call/apply) oraz dziedziczenie.',
    color: '#ce82ff', // Duo Purple
    totalQuestions: 50,
    icon: 'Boxes',
  },
  {
    id: 5,
    title: 'Asynchroniczność i Event Loop',
    description: 'Promisy, async/await, Microtasks vs Macrotasks oraz kolejka zdarzeń.',
    color: '#00cd9c', // Duo Teal
    totalQuestions: 50,
    icon: 'Timer',
  },
  {
    id: 6,
    title: 'DOM, Zdarzenia i Web API',
    description: 'Manipulacja drzewem DOM, Event Bubbling, Delegacja zdarzeń i LocalStorage.',
    color: '#ff4b4b', // Duo Red
    totalQuestions: 50,
    icon: 'Globe',
  },
  {
    id: 7,
    title: 'ES6+ Nowości i Nowoczesny JS',
    description: 'Destrukturyzacja, Spread/Rest, Map, Set, Symbol, Nullish Coalescing (??).',
    color: '#ffc800', // Duo Yellow
    totalQuestions: 50,
    icon: 'Sparkles',
  },
  {
    id: 8,
    title: 'Dziwactwa i Pułapki JavaScriptu',
    description: 'Niejawna konwersja typów (coercion), == vs ===, typeof NaN, [] + {}.',
    color: '#2b70c9', // Duo Dark Blue
    totalQuestions: 50,
    icon: 'AlertTriangle',
  },
  {
    id: 9,
    title: 'TypeScript & Wzorce Projektowe',
    description: 'Interfejsy, generyki, unie, wzorce Singleton, Factory, Obserwator w JS.',
    color: '#3178c6', // TS Blue
    totalQuestions: 50,
    icon: 'ShieldCheck',
  },
  {
    id: 10,
    title: 'Algorytmy, Wydajność i Bezpieczeństwo',
    description: 'Debounce/Throttle, wycieki pamięci, XSS, CSRF i optymalizacja V8.',
    color: '#e5a500', // Gold
    totalQuestions: 50,
    icon: 'Zap',
  },
];
