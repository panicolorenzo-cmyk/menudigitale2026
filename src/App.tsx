import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Lock, Search, ShieldCheck } from 'lucide-react';
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
  const adminPathRestaurant = window.location.pathname.startsWith('/admin/')
    ? window.location.pathname.split('/').filter(Boolean)[1]
    : null;
  const requested = params.get('locale') || params.get('restaurant') || adminPathRestaurant || window.location.hash.replace('#', '');
  const matched = state.restaurants.find((restaurant) => restaurant.id === requested || restaurant.slug === requested);
  return matched?.id ?? null;
};

const isAdminRoute = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  const params = new URLSearchParams(window.location.search);
  return window.location.pathname.startsWith('/admin') || params.get('admin') === '1';
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
  const [adminMode, setAdminMode] = useState(() => isAdminRoute());
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

  useEffect(() => {
    if (!adminMode || !restaurant || adminOpen || pinOpen) {
      return;
    }

    if (adminUnlocked) {
      setAdminOpen(true);
    } else {
      setPinOpen(true);
    }
  }, [adminMode, adminOpen, adminUnlocked, pinOpen, restaurant]);

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

  const exitAdminRoute = () => {
    setAdminOpen(false);
    setPinOpen(false);
    setAdminMode(false);

    if (typeof window !== 'undefined') {
      const suffix = selectedRestaurantId ? `?locale=${selectedRestaurantId}` : '';
      window.history.replaceState({}, '', `/${suffix}`);
    }
  };

  if (!restaurant) {
    return (
      <>
        <Landing
          restaurants={menuState.restaurants}
          language={language}
          adminMode={adminMode}
          onLanguageChange={setLanguage}
          onSelectRestaurant={setSelectedRestaurantId}
        />
      </>
    );
  }

  if (adminMode) {
    return (
      <>
        <AdminGateway
          restaurant={restaurant}
          language={language}
          onChangeRestaurant={() => setSelectedRestaurantId(null)}
          onOpenAdmin={requestAdmin}
        />

        {pinOpen ? (
          <PinModal
            language={language}
            onClose={exitAdminRoute}
            onUnlock={unlockAdmin}
          />
        ) : null}

        {adminOpen ? (
          <AdminPanel
            state={menuState}
            restaurant={restaurant}
            language={language}
            onClose={exitAdminRoute}
            onUpdate={updateMenuState}
          />
        ) : null}
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
  adminMode?: boolean;
  onLanguageChange: (language: LanguageCode) => void;
  onSelectRestaurant: (restaurantId: RestaurantId) => void;
}

function Landing({ restaurants, language, adminMode = false, onLanguageChange, onSelectRestaurant }: LandingProps) {
  const hero = restaurants[0];

  return (
    <main className="relative min-h-[100svh] overflow-hidden bg-ink text-cream">
      <img src={hero?.heroImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-ink/45 to-ink" />
      <div className="absolute inset-x-0 top-0 z-10 flex justify-center px-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] sm:justify-end sm:px-8 sm:pt-5">
        <LanguageSwitcher value={language} onChange={onLanguageChange} compact />
      </div>

      <section className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-6xl flex-col justify-end px-3 pb-5 pt-24 sm:px-8 sm:pb-8 sm:pt-28">
        <div className="max-w-3xl animate-fadeUp">
          <p className="mb-3 text-xs font-semibold uppercase text-gold-soft">
            {adminMode ? txt(language, 'adminArea') : 'Menu Digitale 2026'}
          </p>
          <h1 className="font-display text-[clamp(2.7rem,13vw,5rem)] leading-[0.92] text-cream sm:text-7xl">
            {adminMode ? txt(language, 'admin') : 'Locanda 22 & Adelardi'}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-cream/80 sm:mt-5 sm:text-lg">
            {adminMode ? txt(language, 'chooseAdminVenue') : txt(language, 'chooseVenue')}
          </p>
        </div>

        <div className="mt-5 grid gap-3 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] sm:mt-8 md:grid-cols-2">
          {restaurants.map((restaurant, index) => (
            <button
              key={restaurant.id}
              type="button"
              onClick={() => onSelectRestaurant(restaurant.id)}
              className="group relative min-h-[9.25rem] overflow-hidden rounded-[1.35rem] border border-white/15 bg-taupe text-left shadow-glow transition duration-300 hover:-translate-y-1 hover:border-gold/60 sm:min-h-48 sm:rounded-[1.75rem]"
              style={{ animationDelay: `${index * 90}ms` }}
            >
              <img src={restaurant.heroImage} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
              <div className="relative flex h-full min-h-[9.25rem] flex-col justify-end p-4 sm:min-h-48 sm:p-5">
                <p className="text-xs font-semibold uppercase text-gold-soft">
                  {adminMode ? txt(language, 'manageMenu') : txt(language, 'openMenu')}
                </p>
                <h2 className="mt-1 font-display text-3xl sm:text-4xl">{restaurant.name}</h2>
                <p className="mt-2 max-w-md text-sm leading-5 text-cream/75 sm:mt-3 sm:leading-6">{restaurant.subtitle[language]}</p>
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
}

function MenuExperience({ state, restaurant, language, onLanguageChange, onChangeRestaurant }: MenuExperienceProps) {
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
      <section className="relative flex min-h-[78svh] overflow-hidden sm:min-h-[96svh]">
        <img src={restaurant.heroImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-ink/40 to-coal" />

        <div className="absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-2 px-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] sm:gap-3 sm:px-8 sm:pt-5">
          <button
            type="button"
            onClick={onChangeRestaurant}
            className="inline-flex h-12 shrink-0 items-center gap-2 rounded-full border border-white/15 bg-black/25 px-4 text-xs font-semibold uppercase text-cream backdrop-blur-md transition hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{txt(language, 'changeVenue')}</span>
          </button>
          <LanguageSwitcher value={language} onChange={onLanguageChange} compact />
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col justify-end px-3 pb-7 pt-24 sm:px-8 sm:pb-10 sm:pt-28">
          <div className="max-w-3xl animate-fadeUp">
            <p className="mb-3 text-xs font-semibold uppercase text-gold-soft">Menu Digitale 2026</p>
            <h1 className="font-display text-[clamp(3.2rem,18vw,6rem)] leading-[0.9] sm:text-8xl">{restaurant.name}</h1>
            <p className="mt-4 max-w-2xl text-[0.95rem] leading-6 text-cream/80 sm:mt-5 sm:text-xl sm:leading-8">
              {restaurant.subtitle[language]}
            </p>
            <p className="mt-3 text-sm leading-5 text-cream/60 sm:mt-4">{restaurant.address}</p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3 pb-[calc(env(safe-area-inset-bottom)+0.25rem)] sm:mt-8">
            <a href="#menu" className="rounded-full bg-gold px-6 py-3.5 text-sm font-bold uppercase text-ink shadow-gold transition hover:bg-gold-soft">
              {txt(language, 'menu')}
            </a>
          </div>
        </div>
      </section>

      <section id="menu" className="mx-auto w-full max-w-6xl px-3 py-4 sm:px-8 sm:py-10">
        <div className="sticky top-0 z-30 -mx-3 border-y border-white/10 bg-coal/95 px-3 py-3 backdrop-blur-xl sm:-mx-8 sm:px-8 sm:py-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-[1.125rem] w-[1.125rem] -translate-y-1/2 text-gold sm:h-5 sm:w-5" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full rounded-full border border-white/10 bg-taupe px-11 py-3.5 text-[0.95rem] text-cream outline-none transition placeholder:text-muted/60 focus:border-gold/70 sm:px-12 sm:py-4 sm:text-base"
              placeholder={txt(language, 'search')}
            />
          </div>

          <div className="mobile-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1 sm:mt-4">
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
          <div className="grid gap-4 py-4 sm:grid-cols-2 sm:gap-5 sm:py-6 lg:grid-cols-3">
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

interface AdminGatewayProps {
  restaurant: Restaurant;
  language: LanguageCode;
  onChangeRestaurant: () => void;
  onOpenAdmin: () => void;
}

function AdminGateway({ restaurant, language, onChangeRestaurant, onOpenAdmin }: AdminGatewayProps) {
  return (
    <main className="relative min-h-[100svh] overflow-hidden bg-ink text-cream">
      <img src={restaurant.heroImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-ink/55 to-coal" />
      <div className="absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-2 px-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] sm:px-8 sm:pt-5">
        <button
          type="button"
          onClick={onChangeRestaurant}
          className="inline-flex h-12 shrink-0 items-center gap-2 rounded-full border border-white/15 bg-black/25 px-4 text-xs font-semibold uppercase text-cream backdrop-blur-md transition hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">{txt(language, 'changeVenue')}</span>
        </button>
      </div>

      <section className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-4xl flex-col justify-end px-3 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pt-24 sm:px-8">
        <div className="rounded-[1.5rem] border border-white/10 bg-black/35 p-5 shadow-glow backdrop-blur-md sm:p-7">
          <p className="mb-3 text-xs font-semibold uppercase text-gold-soft">{txt(language, 'adminArea')}</p>
          <h1 className="font-display text-[clamp(3rem,16vw,6rem)] leading-[0.9]">{restaurant.name}</h1>
          <p className="mt-4 text-sm leading-6 text-cream/75 sm:text-base">{txt(language, 'adminSeparateLink')}</p>
          <button
            type="button"
            onClick={onOpenAdmin}
            className="mt-6 w-full rounded-full bg-gold px-6 py-3.5 text-sm font-bold uppercase text-ink shadow-gold transition hover:bg-gold-soft sm:w-auto"
          >
            {txt(language, 'manageMenu')}
          </button>
        </div>
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
