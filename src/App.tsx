import React, { useState, useEffect } from 'react';
import { Flame, Gem, Heart, Sparkles, BookOpen, Bell } from 'lucide-react';
import { UserStats, DailyQuest, LeaderboardUser, Friend, ChatMessage, NotificationConfig, Question, AppTheme } from './types';
import { storageService, DEFAULT_DAILY_QUESTS, getLocalDateString, getDaysDifference } from './services/storageService';
import { notificationService } from './services/notificationService';
import { soundService } from './services/soundService';
import { INITIAL_LEADERBOARD } from './data/mockUsers';
import { ALL_QUESTIONS, getQuestionsByLesson } from './data/questionsData';
import { UNITS } from './data/units';
import { Navbar } from './components/Navbar';
import { BottomNavigation, TabType } from './components/BottomNavigation';
import { DesktopSidebar } from './components/DesktopSidebar';
import { DesktopRightPanel } from './components/DesktopRightPanel';
import { PathView } from './components/PathView';
import { LeaderboardView } from './components/LeaderboardView';
import { DailyQuestsView } from './components/DailyQuestsView';
import { DuelView } from './components/DuelView';
import { CommunityChatView } from './components/CommunityChatView';
import { QuizModal } from './components/QuizModal';
import { QuestionDetailModal } from './components/QuestionDetailModal';
import { NotificationSettingsModal } from './components/NotificationSettingsModal';
import { HeartRefillModal } from './components/HeartRefillModal';
import { ProfileView } from './components/ProfileView';
import { CodePlaygroundView } from './components/CodePlaygroundView';
import { StreakToast } from './components/StreakToast';
import { NotificationBanner } from './components/NotificationBanner';
import { InAppNotificationToast } from './components/InAppNotificationToast';
import { syncWidgetStats } from './services/widgetBridge';

export const App: React.FC = () => {
  // Application State
  const [stats, setStats] = useState<UserStats>(() => storageService.getStats());
  const [quests, setQuests] = useState<DailyQuest[]>(() => storageService.getQuests());
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>(() => storageService.getLeaderboard());
  const [friends, setFriends] = useState<Friend[]>(() => storageService.getFriends());
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => storageService.getChatMessages());
  const [notifConfig, setNotifConfig] = useState<NotificationConfig>(() => storageService.getNotificationConfig());
  const [theme, setTheme] = useState<AppTheme>(() => storageService.getTheme());

  // Navigation State
  const [currentTab, setCurrentTab] = useState<TabType>('path');

  // Modal & Toast States
  const [showStreakToast, setShowStreakToast] = useState(false);
  const [activeLesson, setActiveLesson] = useState<{
    unitId: number;
    questions: Question[];
    unitTitle: string;
    lessonIndex: number;
  } | null>(null);

  const [showExplorer, setShowExplorer] = useState(false);
  const [explorerQuestionId, setExplorerQuestionId] = useState<number | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHeartRefill, setShowHeartRefill] = useState(false);

  // Sync to LocalStorage on changes
  useEffect(() => {
    storageService.saveStats(stats);
    syncWidgetStats(stats);
  }, [stats]);

  useEffect(() => {
    storageService.saveQuests(quests);
  }, [quests]);

  useEffect(() => {
    storageService.saveLeaderboard(leaderboard);
  }, [leaderboard]);

  useEffect(() => {
    storageService.saveFriends(friends);
  }, [friends]);

  useEffect(() => {
    storageService.saveChatMessages(chatMessages);
  }, [chatMessages]);

  useEffect(() => {
    storageService.saveNotificationConfig(notifConfig);
  }, [notifConfig]);

  // Synchronize App Theme (Deep Night vs Light Mode)
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('theme-light');
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.classList.remove('theme-light');
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'deep-night');
    }
    storageService.saveTheme(theme);
  }, [theme]);

  // Push Notification & Unified Daily/Inactivity Monitoring
  useEffect(() => {
    // Record login/activity session
    notificationService.recordActivity();

    // Start unified background monitor (Daily reminder + 24h absence + Hearts restoration)
    const cleanupMonitor = notificationService.startUnifiedMonitor({
      getStreak: () => stats.streak,
      getTone: () => notifConfig.tone,
      getEnabled: () => notifConfig.enabled,
      getTime: () => notifConfig.time,
      getLastActiveDate: () => stats.lastActiveDate,
      getHearts: () => stats.hearts,
      getMaxHearts: () => stats.maxHearts,
      onPracticeRequested: () => {
        setCurrentTab('path');
        window.focus();
      },
    });

    return () => {
      cleanupMonitor();
    };
  }, [stats.streak, stats.lastActiveDate, stats.hearts, stats.maxHearts, notifConfig.tone, notifConfig.enabled, notifConfig.time]);

  // Automatyczne sprawdzanie i synchronizacja passy (reset, jeśli ominięto choć jeden dzień)
  useEffect(() => {
    const checkStreak = () => {
      setStats((prev) => {
        const { stats: updatedStats, wasReset, freezeUsed } = storageService.validateAndSyncStreak(prev);
        if (wasReset && prev.streak > 0) {
          notificationService.triggerNotification(
            '⚠️ Twoja passa wygasła!',
            `Ominięto dzień bez lekcji w JS Duo. Passa (${prev.streak} dni) została zresetowana. Ukończ lekcję dzisiaj, aby zacząć od nowa!`
          );
        } else if (freezeUsed) {
          notificationService.triggerNotification(
            '🛡️ Zamrożenie passy aktywne!',
            'Twoje zamrożenie uratowało Twój streak przed resetem! Wykonaj dzisiejszą lekcję, by kontynuować naukę.'
          );
        }
        return updatedStats;
      });
    };

    checkStreak();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkStreak();
      }
    };

    window.addEventListener('focus', checkStreak);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('focus', checkStreak);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Toast informujący o passie (streak) tuż po zalogowaniu / uruchomieniu aplikacji (gdy passa > 0)
  useEffect(() => {
    if (stats.streak > 0) {
      const toastTimer = setTimeout(() => {
        setShowStreakToast(true);
      }, 600);
      return () => clearTimeout(toastTimer);
    }
  }, []);

  // Desktop keyboard shortcuts (when no modal is open and user isn't typing in an input)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      if (activeLesson || showExplorer || showNotifications || showHeartRefill) {
        return;
      }

      if (e.key === '1') setCurrentTab('path');
      else if (e.key === '2') setCurrentTab('playground');
      else if (e.key === '3') setCurrentTab('quests');
      else if (e.key === '4') setCurrentTab('leaderboard');
      else if (e.key === '5') setCurrentTab('duels');
      else if (e.key === '6') setCurrentTab('chat');
      else if (e.key === '7') setCurrentTab('profile');
      else if (e.key === 'q' || e.key === 'Q') {
        setExplorerQuestionId(null);
        setShowExplorer(true);
      }
      else if (e.key === 'h' || e.key === 'H') {
        setShowHeartRefill(true);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [activeLesson, showExplorer, showNotifications, showHeartRefill]);

  // Start a lesson from the path
  const handleStartLesson = (unitId: number, lessonIndex: number) => {
    const unit = UNITS.find((u) => u.id === unitId) || UNITS[0];

    // Get the exact 5 questions prepared for this unit and lesson
    const directQuestions = getQuestionsByLesson(unitId, lessonIndex);
    const fallbackSlice = ALL_QUESTIONS.slice((unitId - 1) * 50 + (lessonIndex - 1) * 5, (unitId - 1) * 50 + lessonIndex * 5);
    const lessonQuestions = directQuestions.length > 0 ? directQuestions : fallbackSlice;

    if (lessonQuestions.length > 0) {
      setActiveLesson({
        unitId,
        questions: lessonQuestions,
        unitTitle: unit.title,
        lessonIndex,
      });
    }
  };

  // Lesson completed handler
  const handleCompleteLesson = (results: {
    earnedXp: number;
    perfect: boolean;
    completedQuestionIds: number[];
    unitId: number;
    lessonIndex: number;
  }) => {
    setActiveLesson(null);
    notificationService.recordActivity();

    // Update Stats
    const newXp = stats.xp + results.earnedXp;
    const newGems = stats.gems + (results.perfect ? 15 : 10);
    const newCompleted = Array.from(new Set([...stats.completedQuestionIds, ...results.completedQuestionIds]));
    const newLevel = storageService.calculateLevel(newXp).level;

    // Track completed lesson key (e.g. "1-1")
    const lessonKey = `${results.unitId}-${results.lessonIndex}`;
    const prevLessons = stats.completedLessonKeys || [];
    const newCompletedLessons = Array.from(new Set([...prevLessons, lessonKey]));

    // Duolingo Streak Logic (używamy lokalnej daty)
    const today = getLocalDateString();
    let newStreak = stats.streak;
    let streakIncreased = false;

    if (!stats.lastActiveDate || stats.streak === 0) {
      newStreak = 1;
      streakIncreased = true;
    } else if (stats.lastActiveDate === today) {
      newStreak = Math.max(1, stats.streak);
    } else {
      const diffDays = getDaysDifference(stats.lastActiveDate, today);

      if (diffDays === 1) {
        // Kontynuacja passy z wczoraj
        newStreak = stats.streak + 1;
        streakIncreased = true;
      } else {
        // Ominięto dzień lub więcej - passa została przerwana i rozpoczyna się od nowa (1)
        newStreak = 1;
        streakIncreased = true;
      }
    }

    if (streakIncreased) {
      setTimeout(() => setShowStreakToast(true), 600);
    }

    // Check if next unit is unlocked (every 50 questions = new unit)
    const highestQuestion = Math.max(0, ...newCompleted);
    const newUnlockedUnit = Math.max(stats.unlockedUnit, Math.min(10, Math.floor(highestQuestion / 50) + 1));

    const updatedStats: UserStats = {
      ...stats,
      xp: newXp,
      level: newLevel,
      streak: newStreak,
      lastActiveDate: today,
      gems: newGems,
      completedQuestionIds: newCompleted,
      completedLessonKeys: newCompletedLessons,
      unlockedUnit: newUnlockedUnit,
    };
    storageService.saveStats(updatedStats);
    setStats(updatedStats);

    // Update Quests progress
    setQuests((prev) =>
      prev.map((q) => {
        let current = q.current;
        if (q.type === 'xp') current = Math.min(q.target, current + results.earnedXp);
        if (q.type === 'lessons') current = Math.min(q.target, current + 1);
        if (q.type === 'perfect' && results.perfect) current = Math.min(q.target, current + results.completedQuestionIds.length);
        return { ...q, current };
      })
    );

    // Update Leaderboard
    setLeaderboard((prev) =>
      prev.map((u) => (u.isCurrentUser ? { ...u, xp: newXp, level: newLevel, streak: newStreak } : u))
    );
  };

  // Reset progress and stats to clean 0
  const handleResetProgress = () => {
    const cleanStats = storageService.resetAllProgress();
    setStats(cleanStats);
    setQuests(DEFAULT_DAILY_QUESTS);
    setLeaderboard(INITIAL_LEADERBOARD);
    soundService.playLevelUp();
  };

  // Claim Daily Quest
  const handleClaimQuest = (questId: string) => {
    const quest = quests.find((q) => q.id === questId);
    if (!quest) return;

    setQuests((prev) =>
      prev.map((q) => (q.id === questId ? { ...q, claimed: true } : q))
    );

    const newXp = stats.xp + quest.xpReward;
    const newGems = stats.gems + quest.gemsReward;
    const newLevel = storageService.calculateLevel(newXp).level;

    setStats((prev) => ({
      ...prev,
      xp: newXp,
      gems: newGems,
      level: newLevel,
    }));
  };

  // Free practice to recover heart
  const handleFreePractice = () => {
    setShowHeartRefill(false);
    // Pick 1 random question for practice
    const randomQ = ALL_QUESTIONS[Math.floor(Math.random() * ALL_QUESTIONS.length)];
    setActiveLesson({
      unitId: 1,
      questions: [randomQ],
      unitTitle: 'Darmowy Trening Serc',
      lessonIndex: 0,
    });
    setStats((prev) => ({
      ...prev,
      hearts: Math.min(prev.maxHearts, prev.hearts + 1),
    }));
  };

  // Buy Item in Shop / Refill
  const handleBuyItem = (type: 'hearts' | 'freeze', cost: number) => {
    if (stats.gems < cost) return;

    if (type === 'hearts') {
      const updated: UserStats = {
        ...stats,
        gems: stats.gems - cost,
        hearts: stats.maxHearts,
      };
      setStats(updated);
      storageService.saveStats(updated);
      setShowHeartRefill(false);
      soundService.playLevelUp();
    } else if (type === 'freeze') {
      const currentFreezes = stats.streakFreeze || 0;
      const updated: UserStats = {
        ...stats,
        gems: stats.gems - cost,
        streakFreeze: currentFreezes + 1,
      };
      setStats(updated);
      storageService.saveStats(updated);
      soundService.playLevelUp();
    }
  };

  // Claim Chest on Path
  const handleClaimChest = (gemsAmount: number) => {
    setStats((prev) => ({
      ...prev,
      gems: prev.gems + gemsAmount,
      xp: prev.xp + 20,
    }));
  };

  // Ask community about a question
  const handleAskCommunity = (q: Question) => {
    setActiveLesson(null);
    setShowExplorer(false);
    setCurrentTab('chat');

    const newMsg: ChatMessage = {
      id: `m_${Date.now()}`,
      channelId: 'help',
      senderName: 'Michał (Ty)',
      senderAvatar: '🦉',
      senderBadge: '🚀 Uczeń JS',
      isCurrentUser: true,
      text: `Hej, czy ktoś mógłby mi dokładniej wyjaśnić to pytanie? Mam wątpliwość co do wyniku: "${q.question}"`,
      codeSnippet: q.codeSnippet,
      linkedQuestionId: q.id,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      reactions: {},
    };

    setChatMessages((prev) => [...prev, newMsg]);

    // Simulate JS Mentor Bot helpful reply after 1.5 seconds
    setTimeout(() => {
      const botReply: ChatMessage = {
        id: `m_bot_${Date.now()}`,
        channelId: 'help',
        senderName: 'JS_Mentor_Bot',
        senderAvatar: '🦉',
        senderBadge: '🤖 Asystent JS',
        isCurrentUser: false,
        text: `Cześć! Chętnie pomogę przy pytaniu #${q.id}. Klucz do zrozumienia: ${q.explanation}`,
        linkedQuestionId: q.id,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        reactions: { '💡': 3, '🙌': 2 },
      };
      setChatMessages((prev) => [...prev, botReply]);
    }, 1500);
  };

  // Send message in Chat
  const handleSendMessage = (msg: {
    channelId: string;
    text: string;
    codeSnippet?: string;
    linkedQuestionId?: number;
  }) => {
    const newMsg: ChatMessage = {
      id: `m_${Date.now()}`,
      channelId: msg.channelId,
      senderName: 'Michał (Ty)',
      senderAvatar: '🦉',
      senderBadge: '🚀 Uczeń JS',
      isCurrentUser: true,
      text: msg.text,
      codeSnippet: msg.codeSnippet,
      linkedQuestionId: msg.linkedQuestionId,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      reactions: {},
      userReactions: [],
    };

    setChatMessages((prev) => {
      const updated = [...prev, newMsg];
      storageService.saveChatMessages(updated);
      return updated;
    });
  };

  // Wyczyść wszystkie wiadomości w czacie
  const handleClearChat = () => {
    setChatMessages([]);
    storageService.saveChatMessages([]);
  };

  // Reakcja na wiadomość w czacie - ponowne kliknięcie usuwa reakcję
  const handleReactToMessage = (messageId: string, emoji: string) => {
    soundService.playClick();
    setChatMessages((prev) => {
      const updated = prev.map((m) => {
        if (m.id !== messageId) return m;

        const userReactions = m.userReactions || [];
        const hasReacted = userReactions.includes(emoji);

        const currentCount = m.reactions[emoji] || 0;
        let newCount: number;
        let newUserReactions: string[];

        if (hasReacted) {
          // Ponowne kliknięcie: usuwamy reakcję
          newCount = Math.max(0, currentCount - 1);
          newUserReactions = userReactions.filter((e) => e !== emoji);
        } else {
          // Dodanie reakcji
          newCount = currentCount + 1;
          newUserReactions = [...userReactions, emoji];
        }

        const newReactions = { ...m.reactions };
        if (newCount <= 0) {
          delete newReactions[emoji];
        } else {
          newReactions[emoji] = newCount;
        }

        return {
          ...m,
          reactions: newReactions,
          userReactions: newUserReactions,
        };
      });

      storageService.saveChatMessages(updated);
      return updated;
    });
  };

  // Open explorer at specific question
  const handleOpenExplorerAt = (questionId: number) => {
    setExplorerQuestionId(questionId);
    setShowExplorer(true);
  };

  return (
    <div className={`min-h-screen ${theme === 'light' ? 'bg-[#F7F9FA] text-[#0F172A]' : 'bg-[#131F24] text-white'} flex font-sans selection:bg-duo-green selection:text-black transition-colors duration-200`}>
      {/* Desktop Left Sidebar (visible on md and up) */}
      <DesktopSidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        stats={stats}
        unreadChatCount={0}
        onOpenExplorer={() => {
          setExplorerQuestionId(null);
          setShowExplorer(true);
        }}
        onOpenNotifications={() => setShowNotifications(true)}
        onRefillHearts={() => setShowHeartRefill(true)}
      />

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Mobile Top Navigation (hidden on md and up) */}
        <div className="md:hidden">
          <Navbar
            stats={stats}
            onOpenExplorer={() => {
              setExplorerQuestionId(null);
              setShowExplorer(true);
            }}
            onOpenNotifications={() => setShowNotifications(true)}
            onRefillHearts={() => setShowHeartRefill(true)}
            onOpenProfile={() => setCurrentTab('profile')}
            onShowStreakToast={() => setShowStreakToast(true)}
          />
        </div>

        {/* Medium Screen Top Stats Header (visible on md:flex lg:hidden) */}
        <div className="hidden md:flex lg:hidden items-center justify-between px-6 py-3 border-b border-[#2A373F] bg-[#131F24]/95 sticky top-0 z-20">
          <div
            onClick={() => setCurrentTab('profile')}
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            title="Kliknij, aby otworzyć Profil i Osiągnięcia"
          >
            <span className="font-extrabold text-sm text-white">Poziom {stats.level}</span>
            <span className="text-xs text-gray-400 font-mono">({stats.xp} XP)</span>
          </div>

          <div className="flex items-center gap-4">
            <div
              onClick={() => setShowStreakToast(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#232E35] border border-[#2A373F] hover:border-[#FF9600] text-[#FF9600] font-bold text-xs cursor-pointer transition-colors active:scale-95"
              title="Kliknij, aby wyświetlić komunikat o passie"
            >
              <Flame size={16} className="fill-[#FF9600]" />
              <span>{stats.streak}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#232E35] border border-[#2A373F] text-[#1CB0F6] font-bold text-xs">
              <Gem size={16} className="fill-[#1CB0F6]" />
              <span>{stats.gems}</span>
            </div>
            <button
              onClick={() => setShowHeartRefill(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#232E35] border border-[#2A373F] text-[#FF4B4B] font-bold text-xs cursor-pointer"
            >
              <Heart size={16} className="fill-[#FF4B4B]" />
              <span>{stats.hearts}/{stats.maxHearts}</span>
            </button>
          </div>
        </div>

        {/* Central Learning Content & Desktop Right Panel */}
        <div className="flex-1 flex justify-center w-full">
          <main className="flex-1 w-full max-w-2xl px-2.5 sm:px-4 pt-2 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:py-6 overflow-y-auto">
            {/* Global Notification Permission Banner */}
            <NotificationBanner
              streak={stats.streak}
              onOpenSettings={() => setShowNotifications(true)}
            />

            {currentTab === 'path' && (
              <PathView
                userStats={stats}
                onStartLesson={handleStartLesson}
                onOpenExplorer={() => {
                  setExplorerQuestionId(null);
                  setShowExplorer(true);
                }}
                onClaimChest={handleClaimChest}
              />
            )}

            {currentTab === 'playground' && (
              <CodePlaygroundView />
            )}

            {currentTab === 'quests' && (
              <DailyQuestsView
                quests={quests}
                userStats={stats}
                onClaimQuest={handleClaimQuest}
                onBuyItem={handleBuyItem}
              />
            )}

            {currentTab === 'leaderboard' && (
              <LeaderboardView userStats={stats} users={leaderboard} />
            )}

            {currentTab === 'duels' && (
              <DuelView
                friends={friends}
                userStats={stats}
                onUpdateStats={(newSt) => {
                  setStats((prev) => ({ ...prev, ...newSt }));
                  if (newSt.duelWins) {
                    // Update duel quest progress
                    setQuests((prev) =>
                      prev.map((q) =>
                        q.type === 'duel' ? { ...q, current: Math.min(q.target, q.current + 1) } : q
                      )
                    );
                  }
                }}
              />
            )}

            {currentTab === 'chat' && (
              <CommunityChatView
                messages={chatMessages}
                onSendMessage={handleSendMessage}
                onReact={handleReactToMessage}
                onSelectQuestion={handleOpenExplorerAt}
                onClearChat={handleClearChat}
              />
            )}

            {currentTab === 'profile' && (
              <ProfileView
                userStats={stats}
                onUpdateStats={(newSt) => setStats((prev) => ({ ...prev, ...newSt }))}
                onOpenExplorer={() => {
                  setExplorerQuestionId(null);
                  setShowExplorer(true);
                }}
                onOpenLeaderboard={() => setCurrentTab('leaderboard')}
                currentTheme={theme}
                onToggleTheme={setTheme}
                onResetProgress={handleResetProgress}
              />
            )}
          </main>

          {/* Desktop Right Panel (visible on lg and up) */}
          <DesktopRightPanel
            stats={stats}
            quests={quests}
            onRefillHearts={() => setShowHeartRefill(true)}
            onOpenLeaderboard={() => setCurrentTab('leaderboard')}
            onOpenQuests={() => setCurrentTab('quests')}
            onOpenProfile={() => setCurrentTab('profile')}
          />
        </div>

        {/* Bottom Navigation (mobile only) */}
        <BottomNavigation currentTab={currentTab} onSelectTab={setCurrentTab} />
      </div>

      {/* Quiz Lesson Modal */}
      {activeLesson && (
        <QuizModal
          unitId={activeLesson.unitId}
          questions={activeLesson.questions}
          unitTitle={activeLesson.unitTitle}
          lessonIndex={activeLesson.lessonIndex}
          userStats={stats}
          onClose={() => setActiveLesson(null)}
          onComplete={handleCompleteLesson}
          onAskCommunity={handleAskCommunity}
        />
      )}

      {/* 500 Questions Bank Explorer Modal */}
      {showExplorer && (
        <QuestionDetailModal
          initialQuestionId={explorerQuestionId}
          onClose={() => {
            setShowExplorer(false);
            setExplorerQuestionId(null);
          }}
          onAskCommunity={handleAskCommunity}
        />
      )}

      {/* Push Notification Settings Modal */}
      {showNotifications && (
        <NotificationSettingsModal
          config={notifConfig}
          streak={stats.streak}
          onClose={() => setShowNotifications(false)}
          onSave={setNotifConfig}
        />
      )}

      {/* Hearts Refill Modal */}
      {showHeartRefill && (
        <HeartRefillModal
          currentHearts={stats.hearts}
          maxHearts={stats.maxHearts}
          currentGems={stats.gems}
          onClose={() => setShowHeartRefill(false)}
          onRefillWithGems={() => handleBuyItem('hearts', 50)}
          onFreePractice={handleFreePractice}
        />
      )}

      {/* Toast powitalny z liczbą dni passy (Streak) po zalogowaniu */}
      {showStreakToast && (
        <StreakToast
          streak={stats.streak}
          onClose={() => setShowStreakToast(false)}
          onOpenProfile={() => {
            setCurrentTab('profile');
            setShowStreakToast(false);
          }}
        />
      )}

      {/* Global In-App Floating Notification Banner */}
      <InAppNotificationToast />
    </div>
  );
};
