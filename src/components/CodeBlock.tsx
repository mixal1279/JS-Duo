import React from 'react';
import { Copy, Check } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  className?: string;
  allowCopy?: boolean;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  className = '',
  allowCopy = true,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Syntax highlighting simulation for JS keywords, strings, comments, numbers
  const highlightCode = (rawCode: string) => {
    const lines = rawCode.split('\n');
    return lines.map((line, lIdx) => {
      // Basic token recognition
      const parts = line.split(/(\/\/.*$|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`[^`]*`|\b(?:const|let|var|function|return|if|else|async|await|class|extends|new|this|typeof|try|catch|import|export|from|default)\b|\b(?:true|false|null|undefined|NaN|Infinity)\b|\b\d+\b)/g);

      return (
        <div key={lIdx} className="table-row">
          <span className="table-cell select-none pr-3 text-right text-gray-500 text-xs opacity-60">
            {lIdx + 1}
          </span>
          <span className="table-cell whitespace-pre">
            {parts.map((part, pIdx) => {
              if (!part) return null;
              if (part.startsWith('//')) {
                return <span key={pIdx} className="text-gray-400 italic">{part}</span>;
              }
              if (part.startsWith('"') || part.startsWith("'") || part.startsWith('`')) {
                return <span key={pIdx} className="text-[#A5D6A7]">{part}</span>;
              }
              if (/^(const|let|var|function|return|if|else|async|await|class|extends|new|this|typeof|try|catch|import|export|from|default)$/.test(part)) {
                return <span key={pIdx} className="text-[#FF7B72] font-semibold">{part}</span>;
              }
              if (/^(true|false|null|undefined|NaN|Infinity)$/.test(part)) {
                return <span key={pIdx} className="text-[#79C0FF] font-semibold">{part}</span>;
              }
              if (/^\d+$/.test(part)) {
                return <span key={pIdx} className="text-[#FFA657]">{part}</span>;
              }
              return <span key={pIdx} className="text-[#E6EDF3]">{part}</span>;
            })}
          </span>
        </div>
      );
    });
  };

  return (
    <div className={`relative rounded-xl bg-[#0D1117] border border-[#30363D] overflow-hidden text-sm font-mono shadow-inner ${className}`}>
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#161B22] border-b border-[#30363D]">
        <div className="flex items-center space-x-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F]"></div>
          <span className="ml-2 text-xs text-gray-400 font-sans font-medium">JavaScript</span>
        </div>
        {allowCopy && (
          <button
            onClick={handleCopy}
            className="text-gray-400 hover:text-white p-1 rounded transition-colors text-xs flex items-center gap-1"
            title="Kopiuj kod"
          >
            {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
            <span className="text-[11px] font-sans">{copied ? 'Skopiowano!' : 'Kopiuj'}</span>
          </button>
        )}
      </div>
      <div className="p-3 overflow-x-auto text-xs sm:text-sm font-mono leading-relaxed">
        <div className="table w-full">
          {highlightCode(code)}
        </div>
      </div>
    </div>
  );
};
