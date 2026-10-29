import { ChatMessage, DailyQuest, LeaderboardUser, UserStats } from '../types';
import { ReviewRecord } from './reviewService';

const SESSION_KEY = 'js_duo_auth_session_v1';
const PENDING_LEARNING_ANSWERS_KEY = 'js_duo_pending_learning_answers_v1';
const PENDING_LESSONS_KEY = 'js_duo_pending_lessons_v1';
const API_URL = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const AUTH_REDIRECT_URL_RAW = import.meta.env.VITE_APP_URL || 'https://mixal1279.github.io/JS-Duo/';
const AUTH_REDIRECT_URL = AUTH_REDIRECT_URL_RAW.endsWith('/') ? AUTH_REDIRECT_URL_RAW : `${AUTH_REDIRECT_URL_RAW}/`;

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_at?: number;
  user: { id: string; email?: string; user_metadata?: Record<string, unknown> };
}

export interface CloudProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_emoji: string | null;
}

export interface DuelPlayer {
  id: string;
  username: string;
  display_name: string | null;
  avatar_emoji: string | null;
}

export interface DuelSummary {
  id: string;
  challenger_id: string;
  opponent_id: string;
  status: 'pending' | 'active' | 'completed' | 'declined' | 'cancelled';
  created_at: string;
  completed_at?: string | null;
  winner_id?: string | null;
}

export interface OnlineDuelQuestion {
  id: number;
  unit_id: number;
  unit_title: string;
  question: string;
  code_snippet?: string | null;
  type: 'single-choice' | 'output-predict' | 'fill-gap' | 'code-order';
  options: string[];
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
}

export interface OnlineDuelState {
  id: string;
  status: DuelSummary['status'];
  challenger_id: string;
  opponent_id: string;
  challenger_score: number;
  opponent_score: number;
  winner_id: string | null;
  current_round: number;
  round_count: number;
  round_started_at: string | null;
  completed_at: string | null;
  question: OnlineDuelQuestion | null;
  my_answer: { answer_index: number; correct: boolean; answered_at: string } | null;
  opponent_answered: boolean;
  my_rewards?: { xp: number; gems: number; duel_wins: number; duel_losses: number } | null;
}


export interface CloudProgress {
  user_id: string;
  stats: UserStats;
  quests: DailyQuest[];
  review_schedule: ReviewRecord[];
  completed_projects: string[];
  updated_at: string;
}

export class CloudSyncError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'CloudSyncError';
  }
}

export const isCloudConfigured = (): boolean => Boolean(API_URL && ANON_KEY);

const parseError = async (response: Response): Promise<never> => {
  let message = `Błąd usługi online (${response.status}).`;
  let code: string | undefined;
  try {
    const body = await response.json() as { msg?: string; message?: string; error_description?: string; error?: string; code?: string };
    message = body.msg || body.message || body.error_description || body.error || message;
    code = body.code;
  } catch { /* response may not contain JSON */ }
  throw new CloudSyncError(message, code);
};

const authRequest = async (path: string, body?: unknown, token?: string, method?: 'GET' | 'POST' | 'PUT') => {
  if (!isCloudConfigured()) {
    throw new CloudSyncError('Synchronizacja nie jest skonfigurowana. Ustaw VITE_SUPABASE_URL i VITE_SUPABASE_ANON_KEY.');
  }
  const response = await fetch(`${API_URL}/auth/v1/${path}`, {
    method: method || (body === undefined ? 'GET' : 'POST'),
    headers: {
      apikey: ANON_KEY,
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  if (!response.ok) return parseError(response);
  return response.status === 204 ? null : response.json();
};

const restRequest = async (path: string, session: AuthSession, init: RequestInit = {}) => {
  if (!isCloudConfigured()) throw new CloudSyncError('Supabase nie jest skonfigurowany.');
  const response = await fetch(`${API_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  if (!response.ok) return parseError(response);
  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
};

export const cloudSyncService = {
  configured: isCloudConfigured,

  getSession(): AuthSession | null {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const session = JSON.parse(raw) as AuthSession;
      if (!session.access_token || !session.refresh_token || !session.user?.id) return null;
      return session;
    } catch { return null; }
  },

  saveSession(session: AuthSession | null): void {
    try {
      if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      else localStorage.removeItem(SESSION_KEY);
    } catch {
      throw new CloudSyncError('Nie można zapisać sesji. Sprawdź pamięć przeglądarki.');
    }
  },

  async signUp(email: string, password: string): Promise<AuthSession | null> {
    const result = await authRequest(`signup?redirect_to=${encodeURIComponent(AUTH_REDIRECT_URL)}`, { email: email.trim().toLowerCase(), password }) as { access_token?: string; refresh_token?: string; token_type?: string; expires_in?: number; user?: AuthSession['user'] };
    if (!result?.access_token || !result.refresh_token || !result.user) return null;
    const session: AuthSession = {
      access_token: result.access_token,
      refresh_token: result.refresh_token,
      token_type: result.token_type || 'bearer',
      expires_at: Math.floor(Date.now() / 1000) + (result.expires_in || 3600),
      user: result.user,
    };
    this.saveSession(session);
    return session;
  },

  async signIn(email: string, password: string): Promise<AuthSession> {
    const result = await authRequest('token?grant_type=password', { email: email.trim().toLowerCase(), password }) as AuthSession & { expires_in?: number };
    if (!result?.access_token || !result.refresh_token || !result.user) {
      throw new CloudSyncError('Logowanie nie zwróciło poprawnej sesji.');
    }
    const session = { ...result, expires_at: result.expires_at || Math.floor(Date.now() / 1000) + (result.expires_in || 3600) };
    this.saveSession(session);
    return session;
  },

  // Supabase sends the recovery link to the hosted web app, including its recovery token in the URL hash.
  async requestPasswordReset(email: string): Promise<void> {
    await authRequest(`recover?redirect_to=${encodeURIComponent(AUTH_REDIRECT_URL)}`, {
      email: email.trim().toLowerCase(),
    });
  },

  async consumeRecoverySessionFromUrl(): Promise<AuthSession | null> {
    if (typeof window === 'undefined' || !window.location.hash) return null;
    const params = new URLSearchParams(window.location.hash.slice(1));
    if (params.get('type') !== 'recovery') return null;
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    if (!accessToken || !refreshToken) {
      throw new CloudSyncError('Link resetowania hasła jest niekompletny. Poproś o nowy link.');
    }
    const user = await authRequest('user', undefined, accessToken) as AuthSession['user'];
    if (!user?.id) throw new CloudSyncError('Nie udało się zweryfikować linku resetowania hasła.');
    const expiresIn = Number(params.get('expires_in')) || 3600;
    const session: AuthSession = {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: params.get('token_type') || 'bearer',
      expires_at: Math.floor(Date.now() / 1000) + expiresIn,
      user,
    };
    this.saveSession(session);
    window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
    return session;
  },

  // Password changes require the recovery session returned by Supabase Auth.
  async updatePassword(session: AuthSession, password: string): Promise<void> {
    if (password.length < 8) throw new CloudSyncError('Hasło musi mieć co najmniej 8 znaków.');
    const validSession = await this.refreshSession(session);
    await authRequest('user', { password }, validSession.access_token, 'PUT');
  },

  async signOut(session: AuthSession): Promise<void> {
    try { await authRequest('logout', {}, session.access_token); }
    finally { this.saveSession(null); }
  },

  async refreshSession(session: AuthSession): Promise<AuthSession> {
    // Supabase rotates refresh tokens; always prefer the newest locally persisted session.
    const latest = this.getSession() || session;
    const now = Math.floor(Date.now() / 1000);
    // Older app builds may have persisted a session without expires_at. Decode exp when
    // possible; otherwise attempt refresh rather than trusting an unknown token lifetime.
    let expiresAt = Number(latest.expires_at) || 0;
    if (!expiresAt && latest.access_token) {
      try {
        const payload = latest.access_token.split('.')[1];
        if (payload) {
          const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
          const decoded = JSON.parse(atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')));
          expiresAt = Number(decoded.exp) || 0;
        }
      } catch { /* An opaque or malformed token must be refreshed, not trusted. */ }
    }
    if (expiresAt && expiresAt > now + 60) return latest;

    try {
      const result = await authRequest('token?grant_type=refresh_token', { refresh_token: latest.refresh_token }) as AuthSession & { expires_in?: number };
      if (!result?.access_token || !result.refresh_token || !result.user) {
        this.saveSession(null);
        throw new CloudSyncError('Sesja wygasła. Zaloguj się ponownie.', 'session_expired');
      }
      const next = { ...result, expires_at: result.expires_at || now + (result.expires_in || 3600) };
      this.saveSession(next);
      return next;
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : '';
      const code = cause instanceof CloudSyncError ? cause.code || '' : '';
      // Do not keep retrying a refresh token that Supabase has explicitly rejected.
      if (/refresh.?token|session.?expired|invalid.?jwt|token is expired/i.test(`${code} ${message}`)) {
        this.saveSession(null);
        throw new CloudSyncError('Sesja wygasła lub jest nieprawidłowa. Zaloguj się ponownie, aby wznowić synchronizację.', 'session_expired');
      }
      throw cause;
    }
  },

  async loadChatMessages(session: AuthSession): Promise<ChatMessage[]> {
    const validSession = await this.refreshSession(session);
    const rows = await restRequest(
      'chat_messages?select=id,channel_id,sender_id,body,code_snippet,linked_question_id,reactions,created_at&order=created_at.desc&limit=100',
      validSession
    ) as Array<{ id: string; channel_id: string; sender_id: string; body: string; code_snippet?: string | null; linked_question_id?: number | null; reactions?: Record<string, number>; created_at: string }> | null;
    if (!Array.isArray(rows) || rows.length === 0) return [];
    const senderIds = [...new Set(rows.map((row) => row.sender_id))];
    const profileRows = await restRequest(
      `profiles?select=id,username,display_name,avatar_emoji&id=in.(${senderIds.join(',')})`,
      validSession
    ) as Array<{ id: string; username: string; display_name: string; avatar_emoji: string }> | null;
    const profiles = new Map((profileRows || []).map((profile) => [profile.id, profile]));
    return rows.reverse().map((row) => {
      const profile = profiles.get(row.sender_id);
      return {
        id: row.id,
        channelId: row.channel_id,
        senderName: profile?.display_name || profile?.username || 'Programista',
        senderAvatar: profile?.avatar_emoji || '🦉',
        isCurrentUser: row.sender_id === validSession.user.id,
        text: row.body,
        codeSnippet: row.code_snippet || undefined,
        linkedQuestionId: row.linked_question_id || undefined,
        timestamp: new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        reactions: row.reactions || {},
        userReactions: [],
      };
    });
  },

  async sendChatMessage(
    session: AuthSession,
    message: { channelId: string; text: string; codeSnippet?: string; linkedQuestionId?: number }
  ): Promise<void> {
    const validSession = await this.refreshSession(session);
    const body = message.text.trim();
    const code = message.codeSnippet?.trim();
    if (!body && !code) throw new CloudSyncError('Wiadomość nie może być pusta.');
    if (body.length > 1500) throw new CloudSyncError('Wiadomość może mieć maksymalnie 1500 znaków.');
    if (code && code.length > 10000) throw new CloudSyncError('Fragment kodu może mieć maksymalnie 10 000 znaków.');
    if (!['help', 'general', 'duels'].includes(message.channelId)) throw new CloudSyncError('Nieprawidłowy kanał czatu.');
    await restRequest('chat_messages', validSession, {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        channel_id: message.channelId,
        sender_id: validSession.user.id,
        body: body || '[Fragment kodu]',
        code_snippet: code || null,
        linked_question_id: message.linkedQuestionId ?? null,
      }),
    });
  },


  async synthesizeSpeech(text: string): Promise<Blob> {
    const trimmedText = text.trim();
    if (!trimmedText) throw new CloudSyncError('Nie ma tekstu do odczytania.');
    if (trimmedText.length > 2000) throw new CloudSyncError('Tekst do odczytania może mieć maksymalnie 2000 znaków.');
    const session = this.getSession();
    if (!session) throw new CloudSyncError('Zaloguj się, aby skorzystać z głosu nauczyciela.');
    const validSession = await this.refreshSession(session);
    const response = await fetch(`${API_URL}/functions/v1/speech-tts`, {
      method: 'POST',
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${validSession.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: trimmedText }),
    });
    if (!response.ok) {
      let message = 'Nie udało się wygenerować głosu nauczyciela.';
      try {
        const body = await response.json() as { error?: string };
        if (body.error === 'Speech service is not configured') message = 'Usługa Azure Speech nie jest skonfigurowana.';
        else if (response.status === 401 || response.status === 403) message = 'Sesja wygasła. Zaloguj się ponownie.';
        else if (response.status === 429) message = 'Limit usługi mowy został osiągnięty. Spróbuj później.';
      } catch { /* Keep a safe generic message. */ }
      throw new CloudSyncError(message);
    }
    return await response.blob();
  },

  async submitLearningAnswer(questionId: number, answerIndex: number): Promise<void> {
    const session = this.getSession();
    // Learning remains available offline. Queue only for an already signed-in account
    // so answers cannot silently be transferred to a different account later.
    if (!session || !Number.isInteger(questionId) || questionId < 1 || !Number.isInteger(answerIndex) || answerIndex < 0) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      try {
        const raw = localStorage.getItem(PENDING_LEARNING_ANSWERS_KEY);
        const pending = raw ? JSON.parse(raw) as Array<{ userId: string; questionId: number; answerIndex: number }> : [];
        if (!pending.some((item) => item.userId === session.user.id && item.questionId === questionId)) {
          pending.push({ userId: session.user.id, questionId, answerIndex });
          localStorage.setItem(PENDING_LEARNING_ANSWERS_KEY, JSON.stringify(pending));
        }
      } catch { /* Offline queue failures must not interrupt the lesson. */ }
      return;
    }
    const validSession = await this.refreshSession(session);
    try {
      await restRequest('rpc/submit_learning_answer', validSession, {
        method: 'POST',
        body: JSON.stringify({ p_question_id: questionId, p_answer_index: answerIndex }),
      });
    } catch (cause) {
      // Retrying is safe because the server uses (user_id, question_id) as an idempotency key.
      try {
        const raw = localStorage.getItem(PENDING_LEARNING_ANSWERS_KEY);
        const pending = raw ? JSON.parse(raw) as Array<{ userId: string; questionId: number; answerIndex: number }> : [];
        if (!pending.some((item) => item.userId === validSession.user.id && item.questionId === questionId)) {
          pending.push({ userId: validSession.user.id, questionId, answerIndex });
          localStorage.setItem(PENDING_LEARNING_ANSWERS_KEY, JSON.stringify(pending));
        }
      } catch { /* Keep the local lesson playable if storage is unavailable. */ }
      throw cause;
    }
  },


  async completeLearningLesson(lessonKey: string, questionIds: number[]): Promise<void> {
    const session = this.getSession();
    if (!session || !lessonKey || questionIds.length < 5) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      try {
        const raw = localStorage.getItem(PENDING_LESSONS_KEY);
        const pending = raw ? JSON.parse(raw) as Array<{ userId: string; lessonKey: string; questionIds: number[] }> : [];
        if (!pending.some((item) => item.userId === session.user.id && item.lessonKey === lessonKey)) {
          pending.push({ userId: session.user.id, lessonKey, questionIds });
          localStorage.setItem(PENDING_LESSONS_KEY, JSON.stringify(pending));
        }
      } catch { /* Preserve offline lesson flow if queue storage is unavailable. */ }
      return;
    }
    const validSession = await this.refreshSession(session);
    try {
      await restRequest('rpc/complete_learning_lesson', validSession, {
        method: 'POST',
        body: JSON.stringify({ p_lesson_key: lessonKey, p_question_ids: questionIds }),
      });
    } catch (cause) {
      try {
        const raw = localStorage.getItem(PENDING_LESSONS_KEY);
        const pending = raw ? JSON.parse(raw) as Array<{ userId: string; lessonKey: string; questionIds: number[] }> : [];
        if (!pending.some((item) => item.userId === validSession.user.id && item.lessonKey === lessonKey)) {
          pending.push({ userId: validSession.user.id, lessonKey, questionIds });
          localStorage.setItem(PENDING_LESSONS_KEY, JSON.stringify(pending));
        }
      } catch { /* Keep local lesson completion independent from queue storage. */ }
      throw cause;
    }
  },

  async claimDailyQuest(questId: string): Promise<{ claimed: boolean; duplicate: boolean }> {
    const session = this.getSession();
    if (!session || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      return { claimed: false, duplicate: false };
    }
    const validSession = await this.refreshSession(session);
    const result = await restRequest('rpc/claim_daily_quest', validSession, {
      method: 'POST',
      body: JSON.stringify({ p_quest_id: questId }),
    }) as { claimed?: boolean; duplicate?: boolean } | null;
    return { claimed: Boolean(result?.claimed), duplicate: Boolean(result?.duplicate) };
  },

  async flushPendingLearningAnswers(session: AuthSession): Promise<void> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;
    let pending: Array<{ userId: string; questionId: number; answerIndex: number }>;
    try {
      const raw = localStorage.getItem(PENDING_LEARNING_ANSWERS_KEY);
      pending = raw ? JSON.parse(raw) as Array<{ userId: string; questionId: number; answerIndex: number }> : [];
    } catch {
      return;
    }
    if (!Array.isArray(pending)) pending = [];
    const remaining: typeof pending = [];
    const validSession = await this.refreshSession(session);
    for (const item of pending) {
      if (item.userId !== validSession.user.id) {
        remaining.push(item);
        continue;
      }
      try {
        await restRequest('rpc/submit_learning_answer', validSession, {
          method: 'POST',
          body: JSON.stringify({ p_question_id: item.questionId, p_answer_index: item.answerIndex }),
        });
      } catch {
        remaining.push(item);
      }
    }
    try {
      if (remaining.length) localStorage.setItem(PENDING_LEARNING_ANSWERS_KEY, JSON.stringify(remaining));
      else localStorage.removeItem(PENDING_LEARNING_ANSWERS_KEY);
    } catch { /* Do not fail cloud sync because the local retry queue cannot be saved. */ }

    // Complete lessons only after their queued answers have been submitted.
    let lessons: Array<{ userId: string; lessonKey: string; questionIds: number[] }> = [];
    try {
      const rawLessons = localStorage.getItem(PENDING_LESSONS_KEY);
      lessons = rawLessons ? JSON.parse(rawLessons) as typeof lessons : [];
    } catch { lessons = []; }
    const remainingLessons: typeof lessons = [];
    for (const lesson of lessons) {
      if (lesson.userId !== validSession.user.id) { remainingLessons.push(lesson); continue; }
      try {
        await restRequest('rpc/complete_learning_lesson', validSession, {
          method: 'POST',
          body: JSON.stringify({ p_lesson_key: lesson.lessonKey, p_question_ids: lesson.questionIds }),
        });
      } catch { remainingLessons.push(lesson); }
    }
    try {
      if (remainingLessons.length) localStorage.setItem(PENDING_LESSONS_KEY, JSON.stringify(remainingLessons));
      else localStorage.removeItem(PENDING_LESSONS_KEY);
    } catch { /* Local retry queue is best-effort. */ }
  },

  async loadProgress(session: AuthSession): Promise<CloudProgress | null> {
    await this.flushPendingLearningAnswers(session);
    const validSession = await this.refreshSession(session);
    const rows = await restRequest('user_progress?select=user_id,stats,quests,review_schedule,completed_projects,updated_at&limit=1', validSession) as CloudProgress[] | null;
    return Array.isArray(rows) && rows.length ? rows[0] : null;
  },

  async loadProfile(session: AuthSession): Promise<CloudProfile | null> {
    const validSession = await this.refreshSession(session);
    const rows = await restRequest(
      `profiles?select=id,username,display_name,avatar_emoji&id=eq.${encodeURIComponent(validSession.user.id)}&limit=1`,
      validSession
    ) as CloudProfile[] | null;
    return Array.isArray(rows) && rows.length ? rows[0] : null;
  },

  async updateProfile(
    session: AuthSession,
    changes: { display_name: string; avatar_emoji: string }
  ): Promise<CloudProfile> {
    const validSession = await this.refreshSession(session);
    const displayName = changes.display_name.trim();
    if (!displayName || displayName.length > 24) {
      throw new CloudSyncError('Nazwa wyświetlana musi mieć od 1 do 24 znaków.');
    }
    const allowedAvatars = ['💠', '🧙‍♂️', '🤖', '🐱', '🦊', '🚀'];
    if (!allowedAvatars.includes(changes.avatar_emoji)) {
      throw new CloudSyncError('Wybrany awatar jest nieprawidłowy.');
    }
    const rows = await restRequest(
      `profiles?id=eq.${encodeURIComponent(validSession.user.id)}&select=id,username,display_name,avatar_emoji`,
      validSession,
      {
        method: 'PATCH',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify({ display_name: displayName, avatar_emoji: changes.avatar_emoji }),
      }
    ) as CloudProfile[] | null;
    if (!Array.isArray(rows) || !rows.length) {
      throw new CloudSyncError('Nie udało się zapisać profilu. Sprawdź polityki RLS tabeli profiles.');
    }
    return rows[0];
  },

  async loadLeaderboard(session: AuthSession): Promise<LeaderboardUser[]> {
    const validSession = await this.refreshSession(session);
    const rows = await restRequest(
      'leaderboard_public?select=id,username,display_name,avatar_emoji,xp,level,streak&order=xp.desc&limit=100',
      validSession
    ) as Array<{ id: string; username: string; display_name: string; avatar_emoji: string; xp: number; level: number; streak: number }> | null;
    if (!Array.isArray(rows)) return [];
    return rows.map((row) => ({
      id: row.id,
      name: row.display_name || row.username || 'Programista',
      avatar: row.avatar_emoji || '🦉',
      xp: Math.max(0, Number(row.xp) || 0),
      level: Math.max(1, Number(row.level) || 1),
      streak: Math.max(0, Number(row.streak) || 0),
      isCurrentUser: row.id === validSession.user.id,
    }));
  },

  async loadDuelPlayers(session: AuthSession): Promise<DuelPlayer[]> {
    const validSession = await this.refreshSession(session);
    const rows = await restRequest(
      `profiles?select=id,username,display_name,avatar_emoji&order=username.asc&limit=100`,
      validSession
    ) as DuelPlayer[] | null;
    return Array.isArray(rows) ? rows.filter((player) => player.id !== validSession.user.id) : [];
  },

  async loadMyDuels(session: AuthSession): Promise<DuelSummary[]> {
    const validSession = await this.refreshSession(session);
    const userId = encodeURIComponent(validSession.user.id);
    const rows = await restRequest(
      `duels?select=id,challenger_id,opponent_id,status,created_at,completed_at,winner_id&or=(challenger_id.eq.${userId},opponent_id.eq.${userId})&order=created_at.desc&limit=30`,
      validSession
    ) as DuelSummary[] | null;
    return Array.isArray(rows) ? rows : [];
  },

  async createDuel(session: AuthSession, opponentId: string): Promise<string> {
    const validSession = await this.refreshSession(session);
    const id = await restRequest('rpc/create_duel', validSession, {
      method: 'POST',
      body: JSON.stringify({ p_opponent_id: opponentId }),
    });
    if (typeof id !== 'string') throw new CloudSyncError('Nie udało się utworzyć wyzwania.');
    return id;
  },

  async respondToDuel(session: AuthSession, duelId: string, accept: boolean): Promise<OnlineDuelState | null> {
    const validSession = await this.refreshSession(session);
    const result = await restRequest('rpc/respond_to_duel', validSession, {
      method: 'POST',
      body: JSON.stringify({ p_duel_id: duelId, p_accept: accept }),
    });
    return result && typeof result === 'object' ? result as OnlineDuelState : null;
  },

  async getDuelState(session: AuthSession, duelId: string): Promise<OnlineDuelState> {
    const validSession = await this.refreshSession(session);
    return await restRequest('rpc/get_duel_state', validSession, {
      method: 'POST',
      body: JSON.stringify({ p_duel_id: duelId }),
    }) as OnlineDuelState;
  },

  async submitDuelAnswer(session: AuthSession, duelId: string, answerIndex: number): Promise<OnlineDuelState> {
    const validSession = await this.refreshSession(session);
    return await restRequest('rpc/submit_duel_answer', validSession, {
      method: 'POST',
      body: JSON.stringify({ p_duel_id: duelId, p_answer_index: answerIndex }),
    }) as OnlineDuelState;
  },

  async advanceDuelTimeout(session: AuthSession, duelId: string): Promise<OnlineDuelState> {
    const validSession = await this.refreshSession(session);
    return await restRequest('rpc/advance_duel_timeout', validSession, {
      method: 'POST',
      body: JSON.stringify({ p_duel_id: duelId }),
    }) as OnlineDuelState;
  },


  async saveProgress(session: AuthSession, stats: UserStats, quests: DailyQuest[], reviewSchedule: ReviewRecord[] = [], completedProjects: string[] = []): Promise<void> {
    await this.flushPendingLearningAnswers(session);
    const validSession = await this.refreshSession(session);
    await restRequest('user_progress?on_conflict=user_id', validSession, {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({
        user_id: validSession.user.id,
        stats,
        quests,
        review_schedule: reviewSchedule,
        completed_projects: completedProjects,
        updated_at: new Date().toISOString(),
      }),
    });
  },
};
