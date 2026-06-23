import { LANGUAGES, type LanguageCode } from '../types';

interface LanguageSwitcherProps {
  value: LanguageCode;
  onChange: (language: LanguageCode) => void;
  compact?: boolean;
}

export function LanguageSwitcher({ value, onChange, compact = false }: LanguageSwitcherProps) {
  return (
    <div className="mobile-scrollbar flex max-w-full items-center justify-start gap-1.5 overflow-x-auto rounded-full border border-white/15 bg-black/25 p-1.5 backdrop-blur-md sm:justify-center sm:gap-2">
      {LANGUAGES.map((language) => (
        <button
          key={language.code}
          type="button"
          onClick={() => onChange(language.code)}
          className={`shrink-0 rounded-full px-3 py-2.5 text-xs font-semibold uppercase text-cream transition duration-200 ${
            value === language.code
              ? 'bg-gold text-ink shadow-gold'
              : 'bg-white/5 text-cream/80 hover:bg-white/15 hover:text-cream'
          } ${compact ? 'min-w-10' : 'min-w-12'}`}
          aria-label={language.label}
        >
          {compact ? language.short : language.label}
        </button>
      ))}
    </div>
  );
}
