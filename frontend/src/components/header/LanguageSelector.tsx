import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check } from 'lucide-react';
import { useTranslation, SUPPORTED_LANGUAGES, type SupportedLanguage } from '../../i18n/index.ts';

interface LanguageSelectorProps {
  isDark: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ isDark }) => {
  const { language, setLanguage, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const currentMeta = SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition select-none shadow-sm ${
          isDark
            ? 'bg-[#18181b] hover:bg-[#232328] text-zinc-100 border-[#2e2e34]'
            : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
        }`}
        title={t.nav.languageSelect}
      >
        <Globe className={`w-3.5 h-3.5 ${isDark ? 'text-yellow-400' : 'text-rose-600'}`} />
        <span className="font-mono text-xs font-black uppercase tracking-wider">{currentMeta.code}</span>
      </button>

      {isOpen && (
        <div
          className={`absolute right-0 top-full mt-2 w-44 rounded-xl border shadow-2xl py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150 select-none ${
            isDark
              ? 'bg-[#18181b] border-[#2e2e34] text-zinc-200 divide-y divide-[#26262b]'
              : 'bg-white border-slate-200 text-slate-800 divide-y divide-slate-100 shadow-slate-200'
          }`}
        >
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider opacity-60">
            {t.nav.languageSelect}
          </div>
          <div className="py-1 max-h-72 overflow-y-auto">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = lang.code === language;
              return (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between transition ${
                    isSelected
                      ? isDark
                        ? 'bg-yellow-400/15 text-yellow-400 font-bold'
                        : 'bg-rose-50 text-rose-600 font-bold'
                      : isDark
                      ? 'hover:bg-[#24242a] text-zinc-300'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        isSelected
                          ? isDark
                            ? 'bg-yellow-400/25 text-yellow-300'
                            : 'bg-rose-100 text-rose-700'
                          : isDark
                          ? 'bg-zinc-800 text-zinc-400'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {lang.code}
                    </span>
                    <span className="font-medium text-xs">{lang.nativeName}</span>
                  </div>
                  {isSelected && (
                    <Check
                      className={`w-3.5 h-3.5 ${isDark ? 'text-yellow-400' : 'text-rose-600'}`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
