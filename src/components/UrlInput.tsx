'use client';

import { useState, useRef, useEffect } from 'react';
import { ShortcutManager } from '@/lib/shortcuts';

interface UrlInputProps {
  onAnalyze: (text: string) => void;
  disabled: boolean;
  shouldClear?: boolean;
}

export default function UrlInput({ onAnalyze, disabled }: UrlInputProps) {
  const [text, setText] = useState<string>('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ショートカット機能の初期化
  useEffect(() => {
    ShortcutManager.registerInputRef(textareaRef.current);
    ShortcutManager.setupWebShortcuts();

    return () => {
      ShortcutManager.cleanup();
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    const inputText = text.trim();
    setText(''); // Clear input field after summarize button is pressed
    onAnalyze(inputText);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your chat content here"
          className="w-full h-32 px-4 py-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 text-sm text-gray-900 placeholder:text-gray-500 placeholder:font-normal"
          disabled={disabled}
        />
      </div>
      
      <button
        type="submit"
        disabled={disabled || !text.trim()}
        className="w-full px-6 py-3 bg-black text-white font-normal rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm"
      >
        {disabled ? 'Summarizing...' : 'Summarize'}
      </button>
    </form>
  );
}