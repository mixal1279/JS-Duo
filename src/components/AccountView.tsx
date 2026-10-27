import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Cloud, CloudOff, KeyRound, LoaderCircle, LogIn, LogOut, Mail, RefreshCw, ShieldCheck, UserPlus } from 'lucide-react';
import { AuthSession, cloudSyncService } from '../services/cloudSyncService';

type SyncState = 'idle' | 'loading' | 'synced' | 'error' | 'offline';
interface AccountViewProps {
  session: AuthSession | null;
  onSessionChange: (session: AuthSession | null) => void;
  syncState: SyncState;
  syncMessage?: string;
  onSyncNow: () => Promise<void>;
}

export const AccountView: React.FC<AccountViewProps> = ({ session, onSessionChange, syncState, syncMessage, onSyncNow }) => {
const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [recoverySession, setRecoverySession] = useState<AuthSession | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const configured = cloudSyncService.configured();

  useEffect(() => {
    let active = true;
    cloudSyncService.consumeRecoverySessionFromUrl().then((recoverySession) => {
      if (!active || !recoverySession) return;
      setRecoveryMode(true);
      setRecoverySession(recoverySession);
      setMode('reset');
      setNotice('Link został zweryfikowany. Ustaw nowe hasło.');
    }).catch((cause) => {
      if (active) setError(cause instanceof Error ? cause.message : 'Link resetowania hasła jest nieprawidłowy.');
    });
    return () => { active = false; };
  }, [onSessionChange]);

  const handlePasswordUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(''); setNotice('');
    if (!recoverySession) { setError('Sesja resetowania wygasła. Poproś o nowy link resetujący.'); return; }
    if (password.length < 8) { setError('Hasło musi mieć co najmniej 8 znaków.'); return; }
    setBusy(true);
    try {
      await cloudSyncService.updatePassword(recoverySession, password);
      cloudSyncService.saveSession(null);
      setRecoveryMode(false); setRecoverySession(null); setPassword(''); setMode('login');
      setNotice('Hasło zostało zmienione. Zaloguj się nowym hasłem.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Nie udało się zmienić hasła.'); }
    finally { setBusy(false); }
  };

  const handleAuth = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(''); setNotice('');
    if (!configured) { setError('Brak konfiguracji Supabase. Ustaw VITE_SUPABASE_URL i VITE_SUPABASE_ANON_KEY w środowisku wdrożenia.'); return; }
    if (mode !== 'reset' && password.length < 8) { setError('Hasło musi mieć co najmniej 8 znaków.'); return; }
    setBusy(true);
    try {
      if (mode === 'reset') {
        await cloudSyncService.requestPasswordReset(email);
        setNotice('Jeśli konto z tym adresem istnieje, otrzymasz wiadomość z linkiem do ustawienia nowego hasła.');
      } else if (mode === 'signup') {
        const next = await cloudSyncService.signUp(email, password);
        if (next) { onSessionChange(next); setNotice('Konto utworzone. Trwa synchronizacja postępów.'); }
        else { setNotice('Konto utworzone. Sprawdź skrzynkę e-mail i potwierdź adres, a następnie zaloguj się.'); setMode('login'); setPassword(''); }
      } else {
        onSessionChange(await cloudSyncService.signIn(email, password));
        setNotice('Zalogowano. Trwa synchronizacja postępów.');
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Nie udało się wykonać operacji.'); }
    finally { setBusy(false); }
  };

  const handleSignOut = async () => {
    setBusy(true); setError('');
    try { if (session) await cloudSyncService.signOut(session); onSessionChange(null); setNotice('Wylogowano. Postęp lokalny pozostał na tym urządzeniu.'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Nie udało się wylogować.'); }
    finally { setBusy(false); }
  };

  const StateIcon = syncState === 'synced' ? CheckCircle2 : syncState === 'error' ? AlertCircle : syncState === 'offline' ? CloudOff : Cloud;

  return <div className="mx-auto max-w-3xl space-y-5 pb-8">
    <header className="rounded-3xl border border-[#2A373F] bg-gradient-to-br from-[#20333B] to-[#131F24] p-5 sm:p-7">
      <div className="flex items-start gap-4"><div className="rounded-2xl bg-duo-blue/15 p-3 text-duo-blue"><Cloud size={30}/></div><div className="flex-1"><p className="text-xs font-black uppercase tracking-[0.18em] text-duo-blue">Konto i synchronizacja</p><h1 className="mt-1 text-2xl font-black sm:text-3xl">Twoja nauka, na każdym urządzeniu</h1><p className="mt-2 text-sm leading-6 text-gray-300">Zaloguj się, aby zapisywać XP, ukończone pytania i dzienne wyzwania w chmurze. Nauka lokalna działa również bez konta.</p></div></div>
    </header>
    <section className="rounded-3xl border-2 border-[#2A373F] bg-[#172127] p-5 sm:p-7">
      {recoverySession && recoveryMode ? <div className="space-y-5">
        <div className="flex items-center gap-3"><div className="rounded-2xl bg-duo-blue/15 p-3 text-duo-blue"><KeyRound size={24}/></div><div><h2 className="text-lg font-black">Ustaw nowe hasło</h2><p className="text-sm text-gray-400">{recoverySession.user.email || 'Zweryfikowany link resetujący'}</p></div></div>
        <form onSubmit={handlePasswordUpdate} className="space-y-4">
          <label className="block"><span className="mb-2 block text-sm font-bold text-gray-300">Nowe hasło</span><span className="flex items-center gap-2 rounded-xl border border-[#34444D] bg-[#10191E] px-3"><KeyRound size={17} className="text-gray-500"/><input type="password" autoComplete="new-password" minLength={8} required value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimum 8 znaków" className="w-full bg-transparent py-3.5 text-sm text-white outline-none"/></span></label>
          <button type="submit" disabled={busy || !configured} className="flex w-full items-center justify-center gap-2 rounded-xl bg-duo-green px-4 py-3.5 font-black text-black disabled:cursor-not-allowed disabled:opacity-50">{busy ? <LoaderCircle size={18} className="animate-spin"/> : <KeyRound size={18}/>}{busy ? 'Zapisywanie…' : 'Zapisz nowe hasło'}</button>
        </form>
      </div> : session ? <div className="space-y-5">
        <div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-duo-green/15 text-duo-green"><ShieldCheck size={25}/></div><div className="min-w-0 flex-1"><h2 className="text-lg font-black">Jesteś zalogowany</h2><p className="truncate text-sm text-gray-400">{session.user.email || session.user.id}</p></div><span className="rounded-full border border-duo-green/30 bg-duo-green/10 px-2.5 py-1 text-xs font-bold text-duo-green">Konto aktywne</span></div>
        <div className="rounded-2xl border border-[#34444D] bg-[#10191E] p-4"><div className="flex items-center gap-3"><StateIcon size={22} className={`shrink-0 ${syncState === 'error' ? 'text-duo-red' : syncState === 'synced' ? 'text-duo-green' : 'text-duo-blue'} ${syncState === 'loading' ? 'animate-spin' : ''}`}/><div className="min-w-0 flex-1"><p className="font-extrabold">{syncState === 'synced' ? 'Postęp zsynchronizowany' : syncState === 'loading' ? 'Synchronizacja w toku' : syncState === 'error' ? 'Synchronizacja nie powiodła się' : syncState === 'offline' ? 'Brak połączenia' : 'Synchronizacja gotowa'}</p><p className="mt-1 text-sm leading-5 text-gray-400">{syncMessage || 'Postęp jest zapisywany lokalnie, a po połączeniu z internetem może zostać wysłany do chmury.'}</p></div></div><button onClick={() => void onSyncNow()} disabled={syncState === 'loading' || !configured} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-duo-blue px-4 py-3 font-black text-white disabled:opacity-50"><RefreshCw size={17}/>Synchronizuj teraz</button></div>
        <button onClick={() => void handleSignOut()} disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#3A4A52] px-4 py-3 font-bold text-gray-200 disabled:opacity-50"><LogOut size={17}/>{busy ? 'Wylogowywanie…' : 'Wyloguj'}</button>
      </div> : <>
        <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl bg-[#10191E] p-1"><button onClick={() => {setMode('login');setError('');setNotice('');}} className={`rounded-lg px-3 py-2.5 text-sm font-black ${mode === 'login' ? 'bg-duo-blue text-white' : 'text-gray-400'}`}><LogIn size={16} className="mr-2 inline"/>Logowanie</button><button onClick={() => {setMode('signup');setError('');setNotice('');}} className={`rounded-lg px-3 py-2.5 text-sm font-black ${mode === 'signup' ? 'bg-duo-blue text-white' : 'text-gray-400'}`}><UserPlus size={16} className="mr-2 inline"/>Rejestracja</button></div>
        <form onSubmit={handleAuth} className="space-y-4">
          <label className="block"><span className="mb-2 block text-sm font-bold text-gray-300">Adres e-mail</span><span className="flex items-center gap-2 rounded-xl border border-[#34444D] bg-[#10191E] px-3"><Mail size={17} className="text-gray-500"/><input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="ty@example.com" className="w-full bg-transparent py-3.5 text-sm text-white outline-none"/></span></label>
          {mode !== 'reset' && (
          <label className="block"><span className="mb-2 block text-sm font-bold text-gray-300">Hasło</span><span className="flex items-center gap-2 rounded-xl border border-[#34444D] bg-[#10191E] px-3"><KeyRound size={17} className="text-gray-500"/><input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={8} required value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimum 8 znaków" className="w-full bg-transparent py-3.5 text-sm text-white outline-none"/></span></label>
          )}
          <button type="submit" disabled={busy || !configured} className="flex w-full items-center justify-center gap-2 rounded-xl bg-duo-green px-4 py-3.5 font-black text-black disabled:cursor-not-allowed disabled:opacity-50">{busy ? <LoaderCircle size={18} className="animate-spin"/> : mode === 'reset' ? <Mail size={18}/> : mode === 'login' ? <LogIn size={18}/> : <UserPlus size={18}/>}{busy ? 'Przetwarzanie…' : mode === 'reset' ? 'Wyślij link resetujący' : mode === 'login' ? 'Zaloguj się' : 'Utwórz konto'}</button>
        </form>
        {mode === 'login' && <button type="button" onClick={() => {setMode('reset');setError('');setNotice('');}} className="mt-3 w-full text-sm font-bold text-duo-blue hover:underline">Nie pamiętasz hasła?</button>}
        {mode === 'reset' && <button type="button" onClick={() => {setMode('login');setError('');setNotice('');}} className="mt-3 w-full text-sm font-bold text-gray-400 hover:underline">Wróć do logowania</button>}
        {!configured && <div className="mt-4 rounded-xl border border-duo-yellow/30 bg-duo-yellow/10 p-3 text-sm leading-5 text-gray-300"><strong className="text-duo-yellow">Wymagana konfiguracja:</strong> dodaj VITE_SUPABASE_URL i VITE_SUPABASE_ANON_KEY oraz uruchom migrację z katalogu supabase/migrations.</div>}
      </>}
      {error && <div role="alert" className="mt-4 flex gap-2 rounded-xl border border-duo-red/30 bg-duo-red/10 p-3 text-sm leading-5 text-red-200"><AlertCircle size={18} className="mt-0.5 shrink-0"/>{error}</div>}
      {notice && <div role="status" className="mt-4 flex gap-2 rounded-xl border border-duo-green/30 bg-duo-green/10 p-3 text-sm leading-5 text-green-200"><CheckCircle2 size={18} className="mt-0.5 shrink-0"/>{notice}</div>}
    </section>
    <section className="rounded-2xl border border-[#2A373F] bg-[#131F24] p-4 text-sm leading-6 text-gray-400"><h2 className="mb-2 font-black text-gray-200">Prywatność i bezpieczeństwo</h2><ul className="list-disc space-y-1 pl-5"><li>Hasło jest wysyłane do Supabase Auth przez HTTPS i nie jest zapisywane lokalnie.</li><li>W aplikacji używany jest wyłącznie klucz publiczny, nigdy klucz service-role.</li><li>Dostęp do rekordów postępu ograniczają polityki Row Level Security w bazie.</li><li>Postęp offline pozostaje na tym urządzeniu. Synchronizacja wymaga konfiguracji Supabase.</li></ul></section>
  </div>;
};
