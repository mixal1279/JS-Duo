import { LeaderboardUser, Friend, ChatMessage } from '../types';

export const INITIAL_LEADERBOARD: LeaderboardUser[] = [
  { id: 'u1', name: 'KamilDev', avatar: '🦊', xp: 60, level: 1, streak: 2, badge: '🔥 Aktywny' },
  { id: 'u2', name: 'Zosia_React', avatar: '🐱', xp: 45, level: 1, streak: 1, badge: '⚡ Szybki start' },
  { id: 'u3', name: 'Piotr_Koder', avatar: '🐼', xp: 30, level: 1, streak: 1 },
  { id: 'u4', name: 'Michał (Ty)', avatar: '🦉', xp: 0, level: 1, streak: 0, isCurrentUser: true, badge: '🌱 Nowicjusz' },
  { id: 'u5', name: 'Ola_Frontend', avatar: '🦄', xp: 0, level: 1, streak: 0 },
  { id: 'u6', name: 'Bartek_V8', avatar: '🦁', xp: 0, level: 1, streak: 0 },
  { id: 'u7', name: 'Natalia_TS', avatar: '🐨', xp: 0, level: 1, streak: 0 },
  { id: 'u8', name: 'Tomek_Node', avatar: '🐸', xp: 0, level: 1, streak: 0 },
  { id: 'u9', name: 'Karol_Stack', avatar: '🐯', xp: 0, level: 1, streak: 0 },
  { id: 'u10', name: 'Ania_Codes', avatar: '🐰', xp: 0, level: 1, streak: 0 },
];

export const INITIAL_FRIENDS: Friend[] = [
  { id: 'f1', name: 'KamilDev', avatar: '🦊', level: 14, status: 'online', duelWins: 8, lastActive: 'teraz' },
  { id: 'f2', name: 'Zosia_React', avatar: '🐱', level: 12, status: 'online', duelWins: 5, lastActive: '5 min temu' },
  { id: 'f3', name: 'Piotr_Koder', avatar: '🐼', level: 11, status: 'w grze', duelWins: 12, lastActive: 'w trakcie gry' },
  { id: 'f4', name: 'Ola_Frontend', avatar: '🦄', level: 9, status: 'online', duelWins: 3, lastActive: 'teraz' },
  { id: 'f5', name: 'Bartek_V8', avatar: '🦁', level: 8, status: 'offline', duelWins: 6, lastActive: '2 godz. temu' },
];

export const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'm1',
    channelId: 'general',
    senderName: 'Ola_Frontend',
    senderAvatar: '🦄',
    senderBadge: '🎨 CSS Guru',
    isCurrentUser: false,
    text: 'Cześć wszystkim! Rozwiązałem dzisiaj 20 pytań z metody reduce() i wreszcie rozumiem akumulatory! Ktoś chętny na sparing?',
    timestamp: '12:30',
    reactions: { '🔥': 4, '👍': 6 },
  },
  {
    id: 'm2',
    channelId: 'general',
    senderName: 'KamilDev',
    senderAvatar: '🦊',
    senderBadge: '🔥 Mistrz JS',
    isCurrentUser: false,
    text: 'Gratulacje! Najważniejsze w reduce to zawsze pamiętać o drugim parametrze (initialValue), bo bez niego akumulatorem staje się arr[0] i można trafić na niezły bug z pustą tablicą.',
    timestamp: '12:34',
    reactions: { '💡': 5, '❤️': 3 },
  },
  {
    id: 'm3',
    channelId: 'help',
    senderName: 'Piotr_Koder',
    senderAvatar: '🐼',
    senderBadge: '💎 ES6 Pro',
    isCurrentUser: false,
    text: 'Hej, czy ktoś mógłby mi wyjaśnić pytanie #21 z Event Loopa? Dlaczego Promise.then wykonuje się przed setTimeout(..., 0)?',
    codeSnippet: 'console.log("Start");\nsetTimeout(() => console.log("Timeout"), 0);\nPromise.resolve().then(() => console.log("Promise"));\nconsole.log("Koniec");',
    linkedQuestionId: 201,
    timestamp: '13:02',
    reactions: { '👀': 2 },
  },
  {
    id: 'm4',
    channelId: 'help',
    senderName: 'JS_Mentor_Bot',
    senderAvatar: '🦉',
    senderBadge: '🤖 Asystent JS',
    isCurrentUser: false,
    text: 'Świetne pytanie! Wynika to z podziału na Microtasks i Macrotasks w specyfikacji HTML/ECMAScript. Promisy trafiają do kolejki mikrozadań (Microtask Queue), którą silnik JavaScript (np. V8) ZAWSZE opróżnia natychmiast po obecnym stosie wywołań, ZANIM pobierze kolejne makrozadanie (Macrotask) z setTimeout!',
    timestamp: '13:05',
    reactions: { '🎉': 7, '🙌': 4 },
  },
  {
    id: 'm5',
    channelId: 'duels',
    senderName: 'Zosia_React',
    senderAvatar: '🐱',
    senderBadge: '⚡ Async Ninja',
    isCurrentUser: false,
    text: 'Kto podejmuje rękawicę w szybkim pojedynku 1v1? 5 rund, pytania z ES6 i Asynchroniczności!',
    timestamp: '13:15',
    reactions: { '⚔️': 8 },
  }
];
