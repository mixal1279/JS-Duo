import React, { useState } from 'react';
import { Send, Code, MessageSquare, Hash, Sparkles, HelpCircle, Heart, Flame, ThumbsUp, Lightbulb } from 'lucide-react';
import { ChatMessage, Question } from '../types';
import { CodeBlock } from './CodeBlock';
import { soundService } from '../services/soundService';

interface CommunityChatViewProps {
  messages: ChatMessage[];
  onSendMessage: (msg: {
    channelId: string;
    text: string;
    codeSnippet?: string;
    linkedQuestionId?: number;
  }) => void;
  onReact: (messageId: string, emoji: string) => void;
  onSelectQuestion?: (questionId: number) => void;
}

export const CommunityChatView: React.FC<CommunityChatViewProps> = ({
  messages,
  onSendMessage,
  onReact,
  onSelectQuestion,
}) => {
  const [activeChannel, setActiveChannel] = useState<string>('help');
  const [inputText, setInputText] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [inputCode, setInputCode] = useState('');

  const channels = [
    { id: 'help', name: 'pomoc-w-zadaniach', icon: HelpCircle, desc: 'Wspólne rozwiązywanie trudnych pytań z JS' },
    { id: 'general', name: 'ogólny', icon: Hash, desc: 'Rozmowy o JavaScript i web devie' },
    { id: 'duels', name: 'pojedynki', icon: Flame, desc: 'Szukanie sparingpartnerów do gry' },
  ];

  const currentChannelInfo = channels.find((c) => c.id === activeChannel) || channels[0];
  const channelMessages = messages.filter((m) => m.channelId === activeChannel);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !inputCode.trim()) return;

    soundService.playClick();
    onSendMessage({
      channelId: activeChannel,
      text: inputText.trim(),
      codeSnippet: inputCode.trim() ? inputCode.trim() : undefined,
    });

    setInputText('');
    setInputCode('');
    setShowCodeInput(false);
  };

  const availableEmojis = ['👍', '🔥', '💡', '❤️'];

  return (
    <div className="max-w-xl mx-auto px-2 sm:px-4 py-2 pb-2 flex flex-col h-[calc(100dvh-160px)] md:h-[calc(100vh-130px)]">
      {/* Channels Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 mb-2 bg-[#1C262C] p-1.5 rounded-2xl border border-[#2A373F] shrink-0">
        {channels.map((ch) => {
          const isActive = ch.id === activeChannel;
          return (
            <button
              key={ch.id}
              onClick={() => {
                setActiveChannel(ch.id);
                soundService.playClick();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                isActive
                  ? 'bg-duo-green text-black shadow font-black'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-[#25343D]'
              }`}
            >
              <span>#</span>
              <span>{ch.name}</span>
            </button>
          );
        })}
      </div>

      {/* Channel Header */}
      <div className="px-3 py-2 bg-[#172127] rounded-xl border border-[#243038] mb-2 flex items-center justify-between shrink-0">
        <div>
          <span className="text-xs font-black text-white">#{currentChannelInfo.name}</span>
          <p className="text-[11px] text-gray-400">{currentChannelInfo.desc}</p>
        </div>
        <span className="text-[10px] font-bold text-duo-blue bg-duo-blue/10 px-2 py-0.5 rounded-full border border-duo-blue/30">
          Wspólne debugowanie
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-2">
        {channelMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.isCurrentUser ? 'items-end' : 'items-start'
            }`}
          >
            <div
              className={`max-w-[90%] sm:max-w-[85%] rounded-2xl p-3.5 border text-sm ${
                msg.isCurrentUser
                  ? 'bg-[#1C3545] border-duo-blue text-white rounded-br-sm'
                  : 'bg-[#1C262C] border-[#2A373F] text-gray-200 rounded-bl-sm'
              }`}
            >
              {/* Sender Header */}
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">{msg.senderAvatar}</span>
                  <span
                    className={`font-black text-xs ${
                      msg.isCurrentUser ? 'text-duo-blue' : 'text-gray-200'
                    }`}
                  >
                    {msg.senderName}
                  </span>
                  {msg.senderBadge && (
                    <span className="text-[10px] bg-white/10 text-gray-300 px-1 rounded font-bold">
                      {msg.senderBadge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-gray-400">{msg.timestamp}</span>
              </div>

              {/* Linked Question Badge */}
              {msg.linkedQuestionId && (
                <div
                  onClick={() => onSelectQuestion && onSelectQuestion(msg.linkedQuestionId!)}
                  className="mb-2 px-2.5 py-1 rounded-lg bg-black/40 border border-yellow-500/40 text-[11px] font-bold text-yellow-300 flex items-center gap-1.5 cursor-pointer hover:bg-black/60 transition-colors"
                >
                  <HelpCircle size={13} />
                  <span>Dotyczy pytania #{msg.linkedQuestionId} (Kliknij, aby otworzyć)</span>
                </div>
              )}

              {/* Message Text */}
              <p className="leading-relaxed whitespace-pre-wrap text-xs sm:text-sm">
                {msg.text}
              </p>

              {/* Formatted Code Snippet */}
              {msg.codeSnippet && (
                <div className="mt-2.5">
                  <CodeBlock code={msg.codeSnippet} />
                </div>
              )}

              {/* Reactions Bar */}
              <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-white/5">
                {availableEmojis.map((emoji) => {
                  const count = msg.reactions[emoji] || 0;
                  return (
                    <button
                      key={emoji}
                      onClick={() => onReact(msg.id, emoji)}
                      className={`text-[11px] px-2 py-0.5 rounded-full border transition-transform active:scale-90 flex items-center gap-1 ${
                        count > 0
                          ? 'bg-white/10 border-white/20 text-white'
                          : 'bg-black/20 border-transparent text-gray-400 hover:text-white'
                      }`}
                    >
                      <span>{emoji}</span>
                      {count > 0 && <span className="font-bold">{count}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Code Input Box (Collapsible) */}
      {showCodeInput && (
        <div className="mb-2 p-2.5 bg-[#141B20] border border-[#2A373F] rounded-2xl shrink-0">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5 font-bold">
            <span className="flex items-center gap-1 text-duo-green">
              <Code size={14} />
              <span>Wklej fragment kodu JavaScript do wiadomości:</span>
            </span>
            <button
              onClick={() => setShowCodeInput(false)}
              className="text-gray-400 hover:text-white"
            >
              Anuluj
            </button>
          </div>
          <textarea
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            rows={4}
            placeholder="// np. const arr = [1, 2, 3];\n// arr.map(x => x * 2);"
            className="w-full bg-[#0D1117] border border-[#30363D] rounded-xl p-2 font-mono text-xs text-white placeholder-gray-500 focus:outline-none focus:border-duo-green resize-none"
          />
        </div>
      )}

      {/* Send Input Bar */}
      <form onSubmit={handleSend} className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => setShowCodeInput(!showCodeInput)}
          className={`p-3 rounded-2xl border transition-colors ${
            showCodeInput
              ? 'bg-duo-green text-black border-duo-green font-bold'
              : 'bg-[#1C262C] border-[#2A373F] text-gray-400 hover:text-white'
          }`}
          title="Wstaw blok kodu JavaScript"
        >
          <Code size={18} />
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Napisz na #${currentChannelInfo.name}...`}
          className="flex-1 bg-[#1C262C] border border-[#2A373F] rounded-2xl px-4 py-3 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-duo-green"
        />

        <button
          type="submit"
          disabled={!inputText.trim() && !inputCode.trim()}
          className={`p-3 rounded-2xl font-bold transition-all ${
            inputText.trim() || inputCode.trim()
              ? 'bg-duo-green text-black shadow active:scale-95'
              : 'bg-[#2A373F] text-gray-500 cursor-not-allowed'
          }`}
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};
