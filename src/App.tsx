import React, { useState, useEffect } from 'react';
import { Flame, Gem, Heart, Sparkles, BookOpen, Bell } from 'lucide-react';
import { UserStats, DailyQuest, LeaderboardUser, Friend, ChatMessage, NotificationConfig, Question } from './types';
import { storageService } from './services/storageService';
import { notificationService } from './services/notificationService';
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

export const App: React.FC = () => {
  // Application State
  const [stats, setStats] = useState<UserStats>(() => storageService.getStats());
  const [quests, setQuests] = useState<DailyQuest[]>(() => storageService.getQuests());
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>(() => storageService.getLeaderboard());
  const [friends, setFriends] = useState<Friend[]>(() => storageService.getFriends());
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => storageService.getChatMessages());
  const [notifConfig, setNotifConfig] = useState<NotificationConfig>(() => storageService.getNotificationConfig());

  // Navigation State
  const [currentTab, setCurrentTab] = useState<TabType>('path');

  // Modal States
  const [activeLesson, setActiveLesson] = useState<{
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

  // Initial welcome reminder setup
  useEffect(() => {
    if (notifConfig.enabled && notificationService.checkPermission()) {
      // Simulate periodic notification schedule check
      const timer = setTimeout(() => {
        // Can remind if needed
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [notifConfig]);

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
      else if (e.key === '2') setCurrentTab('quests');
      else if (e.key === '3') setCurrentTab('leaderboard');
      else if (e.key === '4') setCurrentTab('duels');
      else if (e.key === '5') setCurrentTab('chat');
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
  }) => {
    setActiveLesson(null);

    // Update Stats
    const newXp = stats.xp + results.earnedXp;
    const newGems = stats.gems + (results.perfect ? 15 : 10);
    const newCompleted = Array.from(new Set([...stats.completedQuestionIds, ...results.completedQuestionIds]));
    const newLevel = storageService.calculateLevel(newXp).level;

    // Check if next unit is unlocked (every 50 questions = new unit)
    const highestQuestion = Math.max(0, ...newCompleted);
    const newUnlockedUnit = Math.max(stats.unlockedUnit, Math.min(10, Math.floor(highestQuestion / 50) + 1));

    const updatedStats: UserStats = {
      ...stats,
      xp: newXp,
      level: newLevel,
      gems: newGems,
      completedQuestionIds: newCompleted,
      unlockedUnit: newUnlockedUnit,
    };
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
      prev.map((u) => (u.isCurrentUser ? { ...u, xp: newXp, level: newLevel } : u))
    );
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
      setStats((prev) => ({
        ...prev,
        gems: prev.gems - cost,
        hearts: prev.maxHearts,
      }));
      setShowHeartRefill(false);
    } else if (type === 'freeze') {
      setStats((prev) => ({
        ...prev,
        gems: prev.gems - cost,
      }));
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
    };

    setChatMessages((prev) => [...prev, newMsg]);
  };

  // Reaction on chat message
  const handleReactToMessage = (messageId: string, emoji: string) => {
    setChatMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m;
        const currentCount = m.reactions[emoji] || 0;
        return {
          ...m,
          reactions: {
            ...m.reactions,
            [emoji]: currentCount + 1,
          },
        };
      })
    );
  };

  // Open explorer at specific question
  const handleOpenExplorerAt = (questionId: number) => {
    setExplorerQuestionId(questionId);
    setShowExplorer(true);
  };

  return (
    <div className="min-h-screen bg-[#131F24] text-white flex font-sans selection:bg-duo-green selection:text-black">
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
          />
        </div>

        {/* Medium Screen Top Stats Header (visible on md:flex lg:hidden) */}
        <div className="hidden md:flex lg:hidden items-center justify-between px-6 py-3 border-b border-[#2A373F] bg-[#131F24]/95 sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm text-white">Poziom {stats.level}</span>
            <span className="text-xs text-gray-400 font-mono">({stats.xp} XP)</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#232E35] border border-[#2A373F] text-[#FF9600] font-bold text-xs">
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
          <main className="flex-1 w-full max-w-2xl px-2 sm:px-4 py-4 md:py-6 overflow-y-auto">
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
          />
        </div>

        {/* Bottom Navigation (mobile only) */}
        <BottomNavigation currentTab={currentTab} onSelectTab={setCurrentTab} />
      </div>

      {/* Quiz Lesson Modal */}
      {activeLesson && (
        <QuizModal
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
    </div>
  );
};
