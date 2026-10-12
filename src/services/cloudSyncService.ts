import { DailyQuest, UserStats, LeaderboardUser } from '../types';
import { ReviewRecord } from './reviewService';

const SESSION_KEY = 'js_duo_auth_session_v1';
const API_URL = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_at?: number;
  user: { id: string; email?: string; user_metadata?: Record<string, unknown> };
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

const authRequest = async (path: string, body?: unknown, token?: string) => {
  if (!isCloudConfigured()) {
    throw new CloudSyncError('Synchronizacja nie jest skonfigurowana. Ustaw VITE_SUPABASE_URL i VITE_SUPABASE_ANON_KEY.');
  }
  const response = await fetch(`${API_URL}/auth/v1/${path}`, {
    method: body === undefined ? 'GET' : 'POST',
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
    const result = await authRequest('signup', { email: email.trim().toLowerCase(), password }) as { access_token?: string; refresh_token?: string; token_type?: string; expires_in?: number; user?: AuthSession['user'] };
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

  async signOut(session: AuthSession): Promise<void> {
    try { await authRequest('logout', {}, session.access_token); }
    finally { this.saveSession(null); }
  },

  async refreshSession(session: AuthSession): Promise<AuthSession> {
    // Supabase rotates refresh tokens; always prefer the newest locally persisted session.
    const latest = this.getSession() || session;
    if (!latest.expires_at || latest.expires_at > Math.floor(Date.now() / 1000) + 60) return latest;
    const result = await authRequest('token?grant_type=refresh_token', { refresh_token: latest.refresh_token }) as AuthSession & { expires_in?: number };
    if (!result?.access_token || !result.refresh_token || !result.user) {
      this.saveSession(null);
      throw new CloudSyncError('Sesja wygasła. Zaloguj się ponownie.');
    }
    const next = { ...result, expires_at: result.expires_at || Math.floor(Date.now() / 1000) + (result.expires_in || 3600) };
    this.saveSession(next);
    return next;
  },

  async loadProgress(session: AuthSession): Promise<CloudProgress | null> {
    const validSession = await this.refreshSession(session);
    const rows = await restRequest('user_progress?select=user_id,stats,quests,review_schedule,completed_projects,updated_at&limit=1', validSession) as CloudProgress[] | null;
    return Array.isArray(rows) && rows.length ? rows[0] : null;
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

  async saveProgress(session: AuthSession, stats: UserStats, quests: DailyQuest[], reviewSchedule: ReviewRecord[] = [], completedProjects: string[] = []): Promise<void> {
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
