import { ChevronDown } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { LANGUAGES, type LanguageCode } from '../types';

interface LanguageSwitcherProps {
  value: LanguageCode;
  onChange: (language: LanguageCode) => void;
  compact?: boolean;
}

export function LanguageSwitcher({ value, onChange, compact = false }: LanguageSwitcherProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const activeLanguage = useMemo(() => LANGUAGES.find((language) => language.code === value) ?? LANGUAGES[0], [value]);
  const otherLanguages = useMemo(() => LANGUAGES.filter((language) => language.code !== value), [value]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const triggerClass = compact
    ? 'min-w-[6.5rem] px-3.5 py-2.5 text-sm'
    : 'min-w-[8rem] px-4 py-3 text-sm';
  const itemClass = compact ? 'px-3 py-2.5' : 'px-3 py-3';

  return (
    <div ref={rootRef} className="relative flex justify-end">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`inline-flex items-center justify-between gap-3 rounded-full border border-white/15 bg-black/35 text-left font-semibold uppercase text-cream backdrop-blur-md transition duration-200 hover:border-gold/40 hover:bg-black/45 ${triggerClass}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Selected language ${activeLanguage.label}`}
      >
        <span className="rounded-full bg-gold px-3 py-1 text-xs font-bold tracking-[0.18em] text-ink shadow-gold">
          {activeLanguage.short}
        </span>
        <ChevronDown className={`h-4 w-4 text-cream/80 transition duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-40 mt-2 w-max overflow-hidden rounded-[1.35rem] border border-white/12 bg-[#16120f]/96 p-1.5 backdrop-blur-xl">
          {otherLanguages.map((language) => (
            <button
              key={language.code}
              type="button"
              onClick={() => {
                onChange(language.code);
                setOpen(false);
              }}
              className={`flex w-full items-center whitespace-nowrap rounded-[1rem] text-left text-sm font-semibold text-cream/88 transition hover:bg-white/8 hover:text-cream ${itemClass}`}
              aria-label={language.label}
            >
              <span>{language.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
