import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Lock, Search, Settings, ShieldCheck } from 'lucide-react';
import { AdminPanel } from './components/AdminPanel';
import { DishCard } from './components/DishCard';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { loadLocalMenu } from './lib/localMenu';
import { loadMenuSnapshot, saveMenuSnapshot } from './lib/supabase';
import { allergenText, txt } from './lib/text';
import { LANGUAGES, type Category, type Dish, type LanguageCode, type MenuState, type Restaurant, type RestaurantId } from './types';

const PIN_DEMO = '2222';

const isLanguageCode = (value: string | null): value is LanguageCode =>
  Boolean(value && LANGUAGES.some((language) => language.code === value));

const getStoredLanguage = (): LanguageCode => {
  if (typeof window === 'undefined') {
    return 'it';
  }

  const stored = window.localStorage.getItem('menu-digitale-2026-language');
  return isLanguageCode(stored) ? stored : 'it';
};

const resolveInitialRestaurant = (state: MenuState): RestaurantId | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const params = new URLSearchParams(window.location.search);
  const requested = params.get('locale') || params.get('restaurant') || window.location.hash.replace('#', '');
  const matched = state.restaurants.find((restaurant) => restaurant.id === requested || restaurant.slug === requested);
  return matched?.id ?? null;
};

const updateUrlRestaurant = (restaurantId: RestaurantId | null) => {
  if (typeof window === 'undefined') {
    return;
  }

  const url = new URL(window.location.href);
  if (restaurantId) {
    url.searchParams.set('locale', restaurantId);
  } else {
    url.searchParams.delete('locale');
  }
  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
};

export default function App() {
  const [menuState, setMenuState] = useState<MenuState>(() => loadLocalMenu());
  const [language, setLanguage] = useState<LanguageCode>(() => getStoredLanguage());
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<RestaurantId | null>(() =>
    resolveInitialRestaurant(loadLocalMenu())
  );
  const [adminOpen, setAdminOpen] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [adminUnlocked, setAdminUnlocked] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.sessionStorage.getItem('menu-digitale-2026-admin') === 'unlocked';
  });

  useEffect(() => {
    let isActive = true;
    void loadMenuSnapshot().then((loadedState) => {
      if (isActive) {
        setMenuState(loadedState);
      }
    });

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('menu-digitale-2026-language', language);
    }
  }, [language]);

  useEffect(() => {
    updateUrlRestaurant(selectedRestaurantId);
  }, [selectedRestaurantId]);

  useEffect(() => {
    const saveTimer = window.setTimeout(() => {
      void saveMenuSnapshot(menuState);
    }, 300);

    return () => window.clearTimeout(saveTimer);
  }, [menuState]);

  const restaurant = useMemo(
    () => menuState.restaurants.find((item) => item.id === selectedRestaurantId) ?? null,
    [menuState.restaurants, selectedRestaurantId]
  );

  const updateMenuState = (nextState: MenuState) => {
    setMenuState({ ...nextState, updatedAt: new Date().toISOString() });
  };

  const requestAdmin = () => {
    if (adminUnlocked) {
      setAdminOpen(true);
      return;
    }

    setPinOpen(true);
  };

  const unlockAdmin = () => {
    setAdminUnlocked(true);
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('menu-digitale-2026-admin', 'unlocked');
    }
    setPinOpen(false);
    setAdminOpen(true);
  };

  if (!restaurant) {
    return (
      <>
        <Landing
          restaurants={menuState.restaurants}
          language={language}
          onLanguageChange={setLanguage}
          onSelectRestaurant={setSelectedRestaurantId}
        />
      </>
    );
  }

  return (
    <>
      <MenuExperience
        state={menuState}
        restaurant={restaurant}
        language={language}
        onLanguageChange={setLanguage}
        onChangeRestaurant={() => setSelectedRestaurantId(null)}
        onAdmin={requestAdmin}
      />

      {pinOpen ? (
        <PinModal
          language={language}
          onClose={() => setPinOpen(false)}
          onUnlock={unlockAdmin}
        />
      ) : null}

      {adminOpen ? (
        <AdminPanel
          state={menuState}
          restaurant={restaurant}
          language={language}
          onClose={() => setAdminOpen(false)}
          onUpdate={updateMenuState}
        />
      ) : null}
    </>
  );
}

interface LandingProps {
  restaurants: Restaurant[];
  language: LanguageCode;
  onLanguageChange: (language: LanguageCode) => void;
  onSelectRestaurant: (restaurantId: RestaurantId) => void;
}

function Landing({ restaurants, language, onLanguageChange, onSelectRestaurant }: LandingProps) {
  const hero = restaurants[0];

  return (
    <main className="relative min-h-[100svh] overflow-hidden bg-ink text-cream">
      <img src={hero?.heroImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-ink/45 to-ink" />
      <div className="absolute inset-x-0 top-0 z-10 flex justify-center px-4 pt-5 sm:justify-end sm:px-8">
        <LanguageSwitcher value={language} onChange={onLanguageChange} compact />
      </div>

      <section className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-6xl flex-col justify-end px-4 pb-8 pt-28 sm:px-8">
        <div className="max-w-3xl animate-fadeUp">
          <p className="mb-3 text-xs font-semibold uppercase text-gold-soft">Menu Digitale 2026</p>
          <h1 className="font-display text-5xl leading-none text-cream sm:text-7xl">Locanda 22 & Adelardi</h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-cream/80 sm:text-lg">
            {txt(language, 'chooseVenue')}
          </p>
        </div>

        <div className="mt-8 grid gap-3 pb-[env(safe-area-inset-bottom)] md:grid-cols-2">
          {restaurants.map((restaurant, index) => (
            <button
              key={restaurant.id}
              type="button"
              onClick={() => onSelectRestaurant(restaurant.id)}
              className="group relative min-h-48 overflow-hidden rounded-[1.75rem] border border-white/15 bg-taupe text-left shadow-glow transition duration-300 hover:-translate-y-1 hover:border-gold/60"
              style={{ animationDelay: `${index * 90}ms` }}
            >
              <img src={restaurant.heroImage} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
              <div className="relative flex h-full min-h-48 flex-col justify-end p-5">
                <p className="text-xs font-semibold uppercase text-gold-soft">{txt(language, 'openMenu')}</p>
                <h2 className="mt-1 font-display text-4xl">{restaurant.name}</h2>
                <p className="mt-3 max-w-md text-sm leading-6 text-cream/75">{restaurant.subtitle[language]}</p>
              </div>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}

interface MenuExperienceProps {
  state: MenuState;
  restaurant: Restaurant;
  language: LanguageCode;
  onLanguageChange: (language: LanguageCode) => void;
  onChangeRestaurant: () => void;
  onAdmin: () => void;
}

function MenuExperience({ state, restaurant, language, onLanguageChange, onChangeRestaurant, onAdmin }: MenuExperienceProps) {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const restaurantCategories = useMemo(
    () =>
      state.categories
        .filter((category) => category.restaurantId === restaurant.id)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [restaurant.id, state.categories]
  );

  const activeCategoryIds = useMemo(
    () => new Set(restaurantCategories.filter((category) => category.active).map((category) => category.id)),
    [restaurantCategories]
  );

  const dishes = useMemo(
    () =>
      state.dishes.filter(
        (dish) => dish.restaurantId === restaurant.id && dish.active && activeCategoryIds.has(dish.categoryId)
      ),
    [activeCategoryIds, restaurant.id, state.dishes]
  );

  const visibleDishes = useMemo(() => {
    const search = query.trim().toLowerCase();

    return dishes.filter((dish) => {
      const inCategory = selectedCategory === 'all' || dish.categoryId === selectedCategory;
      if (!inCategory) {
        return false;
      }

      if (!search) {
        return true;
      }

      const haystack = [
        dish.name[language],
        dish.description[language],
        ...dish.allergens.map((allergen) => allergenText(allergen, language))
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(search);
    });
  }, [dishes, language, query, selectedCategory]);

  const categoryById = useMemo(
    () => restaurantCategories.reduce((accumulator, category) => accumulator.set(category.id, category), new Map<string, Category>()),
    [restaurantCategories]
  );

  const categoriesWithDishes = restaurantCategories.filter((category) =>
    category.active && dishes.some((dish) => dish.categoryId === category.id)
  );

  useEffect(() => {
    if (selectedCategory !== 'all' && !categoriesWithDishes.some((category) => category.id === selectedCategory)) {
      setSelectedCategory('all');
    }
  }, [categoriesWithDishes, selectedCategory]);

  return (
    <main className="min-h-screen bg-coal text-cream">
      <section className="relative flex min-h-[96svh] overflow-hidden">
        <img src={restaurant.heroImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-ink/40 to-coal" />

        <div className="absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 px-4 pt-5 sm:px-8">
          <button
            type="button"
            onClick={onChangeRestaurant}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/25 px-4 py-3 text-xs font-semibold uppercase text-cream backdrop-blur-md transition hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{txt(language, 'changeVenue')}</span>
          </button>
          <LanguageSwitcher value={language} onChange={onLanguageChange} compact />
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col justify-end px-4 pb-10 pt-28 sm:px-8">
          <div className="max-w-3xl animate-fadeUp">
            <p className="mb-3 text-xs font-semibold uppercase text-gold-soft">Menu Digitale 2026</p>
            <h1 className="font-display text-6xl leading-none sm:text-8xl">{restaurant.name}</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-cream/80 sm:text-xl">{restaurant.subtitle[language]}</p>
            <p className="mt-4 text-sm text-cream/60">{restaurant.address}</p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3 pb-[env(safe-area-inset-bottom)]">
            <a href="#menu" className="rounded-full bg-gold px-6 py-3 text-sm font-bold uppercase text-ink shadow-gold transition hover:bg-gold-soft">
              {txt(language, 'menu')}
            </a>
            <button
              type="button"
              onClick={onAdmin}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/25 px-5 py-3 text-sm font-semibold uppercase text-cream backdrop-blur-md transition hover:bg-white/10"
            >
              <Settings className="h-4 w-4" />
              {txt(language, 'admin')}
            </button>
          </div>
        </div>
      </section>

      <section id="menu" className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
        <div className="sticky top-0 z-30 -mx-4 border-y border-white/10 bg-coal/92 px-4 py-4 backdrop-blur-xl sm:-mx-8 sm:px-8">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gold" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full rounded-full border border-white/10 bg-taupe px-12 py-4 text-base text-cream outline-none transition placeholder:text-muted/60 focus:border-gold/70"
              placeholder={txt(language, 'search')}
            />
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`category-chip ${selectedCategory === 'all' ? 'category-chip-active' : ''}`}
            >
              {txt(language, 'all')}
            </button>
            {categoriesWithDishes.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setSelectedCategory(category.id)}
                className={`category-chip ${selectedCategory === category.id ? 'category-chip-active' : ''}`}
              >
                {category.name[language]}
              </button>
            ))}
          </div>
        </div>

        {visibleDishes.length > 0 ? (
          <div className="grid gap-5 py-6 sm:grid-cols-2 lg:grid-cols-3">
            {visibleDishes.map((dish) => (
              <DishCard key={dish.id} dish={dish} category={categoryById.get(dish.categoryId)} language={language} />
            ))}
          </div>
        ) : (
          <div className="my-10 rounded-3xl border border-white/10 bg-taupe p-8 text-center">
            <p className="font-display text-2xl">{txt(language, 'noResults')}</p>
          </div>
        )}
      </section>
    </main>
  );
}

interface PinModalProps {
  language: LanguageCode;
  onClose: () => void;
  onUnlock: () => void;
}

function PinModal({ language, onClose, onUnlock }: PinModalProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (pin === PIN_DEMO) {
      onUnlock();
      return;
    }

    setError(txt(language, 'wrongPin'));
  };

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/75 px-4 text-cream backdrop-blur-md">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-[1.75rem] border border-white/10 bg-taupe p-5 shadow-glow">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-full bg-gold/15 p-3 text-gold">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-gold">{txt(language, 'admin')}</p>
            <h2 className="font-display text-2xl">{txt(language, 'pin')}</h2>
          </div>
        </div>
        <label className="space-y-2">
          <span className="admin-label">{txt(language, 'enterPin')}</span>
          <input
            value={pin}
            onChange={(event) => setPin(event.target.value)}
            inputMode="numeric"
            type="password"
            autoFocus
            className="admin-input text-center text-2xl tracking-[0.35em]"
            placeholder="2222"
          />
        </label>
        {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
        <div className="mt-5 flex gap-2">
          <button type="button" onClick={onClose} className="admin-secondary-button flex-1 justify-center">
            {txt(language, 'close')}
          </button>
          <button type="submit" className="admin-primary-button flex-1 justify-center">
            <ShieldCheck className="h-4 w-4" />
            {txt(language, 'unlock')}
          </button>
        </div>
      </form>
    </div>
  );
}
