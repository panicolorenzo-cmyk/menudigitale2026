import { Euro, Sparkles } from 'lucide-react';
import type { Category, Dish, LanguageCode } from '../types';
import { allergenText, txt } from '../lib/text';

const localeMap: Record<LanguageCode, string> = {
  it: 'it-IT',
  en: 'en-US',
  fr: 'fr-FR',
  de: 'de-DE',
  es: 'es-ES',
  ru: 'ru-RU'
};

interface DishCardProps {
  dish: Dish;
  category?: Category;
  language: LanguageCode;
}

export function DishCard({ dish, category, language }: DishCardProps) {
  const formattedPrice = new Intl.NumberFormat(localeMap[language], {
    style: 'currency',
    currency: 'EUR'
  }).format(dish.price);

  return (
    <article className="group max-sm:snap-start overflow-hidden rounded-[1.35rem] border border-white/10 bg-taupe shadow-glow transition duration-300 hover:-translate-y-1 hover:border-gold/50 sm:rounded-[1.65rem]">
      <div className="relative aspect-[4/3] overflow-hidden bg-coal">
        <img
          src={dish.image}
          alt={dish.name[language]}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/5 to-transparent" />
        {dish.featured ? (
          <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full border border-gold/40 bg-black/40 px-2.5 py-1 text-[0.68rem] font-semibold uppercase text-gold-soft backdrop-blur-md sm:left-4 sm:top-4 sm:px-3 sm:text-xs">
            <Sparkles className="h-3.5 w-3.5" />
            {txt(language, 'featured')}
          </div>
        ) : null}
        <div className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-gold px-3 py-1.5 text-sm font-bold text-ink shadow-gold sm:bottom-4 sm:right-4">
          <Euro className="h-4 w-4" />
          {formattedPrice.replace('€', '').trim()}
        </div>
      </div>
      <div className="space-y-3 p-4 sm:space-y-4 sm:p-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase text-gold/85">{category?.name[language]}</p>
          </div>
          <h3 className="font-display text-[1.55rem] leading-tight text-cream sm:text-2xl">{dish.name[language]}</h3>
          <p className="text-sm leading-6 text-muted sm:text-[0.95rem]">{dish.description[language]}</p>
        </div>
        {dish.allergens.length > 0 ? (
          <div className="space-y-2">
            <p className="text-[0.68rem] font-semibold uppercase text-cream/55">{txt(language, 'allergens')}</p>
            <div className="flex flex-wrap gap-2">
              {dish.allergens.map((allergen) => (
                <span
                  key={allergen}
                  className="rounded-full border border-white/10 bg-white/[0.045] px-2.5 py-1 text-[0.72rem] text-muted sm:px-3 sm:text-xs"
                >
                  {allergenText(allergen, language)}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </article>
  );
}
