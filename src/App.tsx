import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ShieldCheck, Wine } from 'lucide-react';
import { AdminPanel } from './components/AdminPanel';
import { DishCard } from './components/DishCard';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import locanda22IntroLogoSvg from './generated/locanda22IntroLogo.svg?raw';
import { loadLocalMenu } from './lib/localMenu';
import { getAdminSession, hasSupabaseConfig, loadMenuSnapshot, saveMenuSnapshot, signInAdmin, signOutAdmin } from './lib/supabase';
import { txt } from './lib/text';
import { LANGUAGES, type Category, type Dish, type LanguageCode, type MenuState, type Restaurant, type RestaurantId, type ServiceType } from './types';

const LANDING_INTRO_TOTAL_MS = 13000;

const isLanguageCode = (value: string | null): value is LanguageCode =>
  Boolean(value && LANGUAGES.some((language) => language.code === value));

const isServiceType = (value: string | null): value is ServiceType =>
  value === 'cucina' || value === 'aperitivo';

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

const resolveInitialService = (): ServiceType | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const params = new URLSearchParams(window.location.search);
  const value = params.get('service');
  return isServiceType(value) ? value : null;
};

const isAdminRoute = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  const params = new URLSearchParams(window.location.search);
  return window.location.pathname.startsWith('/admin') || params.get('admin') === '1';
};

const updateUrlRestaurant = (restaurantId: RestaurantId | null, service: ServiceType | null) => {
  if (typeof window === 'undefined') {
    return;
  }

  const url = new URL(window.location.href);
  if (restaurantId) {
    url.searchParams.set('locale', restaurantId);
  } else {
    url.searchParams.delete('locale');
    url.searchParams.delete('service');
    return window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  }

  if (service) {
    url.searchParams.set('service', service);
  } else {
    url.searchParams.delete('service');
  }

  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
};

export default function App() {
  const [menuState, setMenuState] = useState<MenuState>(() => loadLocalMenu());
  const [language, setLanguage] = useState<LanguageCode>(() => getStoredLanguage());
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<RestaurantId | null>(() =>
    resolveInitialRestaurant(loadLocalMenu())
  );
  const [selectedService, setSelectedService] = useState<ServiceType | null>(() => resolveInitialService());
  const [adminMode, setAdminMode] = useState(() => isAdminRoute());
  const [adminOpen, setAdminOpen] = useState(false);
  const [supabaseAuthOpen, setSupabaseAuthOpen] = useState(false);
  const [snapshotLoaded, setSnapshotLoaded] = useState(false);
  const [skipLandingIntro, setSkipLandingIntro] = useState(false);
  const latestMenuStateRef = useRef<MenuState>(menuState);
  latestMenuStateRef.current = menuState;

  useEffect(() => {
    let isActive = true;
    void loadMenuSnapshot().then((loadedState) => {
      if (isActive) {
        setMenuState(loadedState);
        setSnapshotLoaded(true);
      }
    }).catch(() => {
      if (isActive) {
        setSnapshotLoaded(true);
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
    updateUrlRestaurant(selectedRestaurantId, selectedService);
  }, [selectedRestaurantId, selectedService]);

  useEffect(() => {
    if (!snapshotLoaded) {
      return;
    }

    const saveTimer = window.setTimeout(() => {
      void saveMenuSnapshot(menuState);
    }, 300);

    return () => window.clearTimeout(saveTimer);
  }, [menuState, snapshotLoaded]);

  const restaurant = useMemo(
    () => menuState.restaurants.find((item) => item.id === selectedRestaurantId) ?? null,
    [menuState.restaurants, selectedRestaurantId]
  );

  useEffect(() => {
    if (!adminMode || !restaurant || adminOpen || supabaseAuthOpen || !snapshotLoaded) {
      return;
    }

    if (hasSupabaseConfig) {
      void getAdminSession().then((hasSession) => {
        if (hasSession) {
          setAdminOpen(true);
        } else {
          setSupabaseAuthOpen(true);
        }
      });
    } else {
      setAdminOpen(true);
    }
  }, [adminMode, adminOpen, supabaseAuthOpen, restaurant, snapshotLoaded]);

  const updateMenuState = (nextState: MenuState | ((currentState: MenuState) => MenuState)) => {
    setMenuState((currentState) => {
      const resolvedState = typeof nextState === 'function' ? nextState(currentState) : nextState;
      return { ...resolvedState, updatedAt: new Date().toISOString() };
    });
  };

  const requestSave = useCallback((): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      window.setTimeout(() => {
        void saveMenuSnapshot(latestMenuStateRef.current).then(resolve);
      }, 0);
    });
  }, []);

  const requestAdmin = () => {
    if (hasSupabaseConfig) {
      void getAdminSession().then((hasSession) => {
        if (hasSession) {
          setAdminOpen(true);
        } else {
          setSupabaseAuthOpen(true);
        }
      });
    } else {
      setAdminOpen(true);
    }
  };

  const handleSupabaseAuth = () => {
    setSupabaseAuthOpen(false);
    setAdminOpen(true);
  };

  const handleSignOut = () => {
    void signOutAdmin();
    setAdminOpen(false);
  };

  const exitAdminRoute = () => {
    setAdminOpen(false);
    setSupabaseAuthOpen(false);
    setAdminMode(false);

    if (typeof window !== 'undefined') {
      const suffix = selectedRestaurantId ? `?locale=${selectedRestaurantId}` : '';
      window.history.replaceState({}, '', `/${suffix}`);
    }
  };

  const handleSelectRestaurant = (id: RestaurantId) => {
    setSelectedRestaurantId(id);
    setSelectedService(id === 'locanda22' ? 'cucina' : null);
  };

  const handleBackFromMenu = () => {
    setSkipLandingIntro(true);
    setSelectedRestaurantId(null);
    setSelectedService(null);
  };

  if (!restaurant) {
    return (
      <Landing
        restaurants={menuState.restaurants}
        language={language}
        adminMode={adminMode}
        skipIntro={skipLandingIntro}
        onLanguageChange={setLanguage}
        onSelectRestaurant={handleSelectRestaurant}
      />
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

        {supabaseAuthOpen ? (
          <SupabaseAuthModal
            language={language}
            onClose={exitAdminRoute}
            onAuth={handleSupabaseAuth}
          />
        ) : null}

        {adminOpen ? (
          <AdminPanel
            state={menuState}
            restaurant={restaurant}
            language={language}
            dataReady={snapshotLoaded}
            onClose={exitAdminRoute}
            onUpdate={updateMenuState}
            onSave={requestSave}
            onSignOut={handleSignOut}
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
        service={selectedService}
        language={language}
        onLanguageChange={setLanguage}
        onChangeRestaurant={handleBackFromMenu}
      />

      {supabaseAuthOpen ? (
        <SupabaseAuthModal
          language={language}
          onClose={() => setSupabaseAuthOpen(false)}
          onAuth={handleSupabaseAuth}
        />
      ) : null}

      {adminOpen ? (
        <AdminPanel
          state={menuState}
          restaurant={restaurant}
          language={language}
          dataReady={snapshotLoaded}
          onClose={() => setAdminOpen(false)}
          onUpdate={updateMenuState}
          onSave={requestSave}
          onSignOut={handleSignOut}
        />
      ) : null}
    </>
  );
}

interface LandingProps {
  restaurants: Restaurant[];
  language: LanguageCode;
  adminMode?: boolean;
  skipIntro?: boolean;
  onLanguageChange: (language: LanguageCode) => void;
  onSelectRestaurant: (restaurantId: RestaurantId) => void;
}

function Landing({ restaurants, language, adminMode = false, skipIntro = false, onLanguageChange, onSelectRestaurant }: LandingProps) {
  const [introReady, setIntroReady] = useState(() => adminMode || skipIntro);
  const [introEpoch, setIntroEpoch] = useState(0);
  const introReadyRef = useRef(introReady);
  const introEnabled = !adminMode && !skipIntro;
  const sectionClass = adminMode ? 'justify-end' : 'justify-start';
  const headingWrapClass = adminMode
    ? 'max-w-3xl animate-fadeUp'
    : 'mt-[clamp(3.85rem,6.9vh,5.6rem)] max-w-[22rem] sm:mt-[7.1rem] sm:max-w-[30rem]';
  const headingClass = adminMode
    ? 'font-display text-[clamp(2.7rem,13vw,5rem)] leading-[0.92] text-cream sm:text-7xl'
    : 'max-w-[18.75rem] font-display text-[clamp(3.45rem,14.2vw,5.65rem)] leading-[0.9] text-cream sm:max-w-[25rem] sm:text-[clamp(4.7rem,8vw,6.5rem)]';
  const cardsWrapClass = adminMode
    ? 'mt-5 grid gap-3 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] sm:mt-8 md:grid-cols-2'
    : 'mt-8 grid gap-3 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] sm:mt-10 md:grid-cols-2 md:gap-5';
  const languageWrapClass = adminMode
    ? 'absolute inset-x-0 top-0 z-30 flex justify-end px-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] sm:px-8 sm:pt-5'
    : `absolute inset-x-0 top-0 z-30 flex justify-end px-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] sm:px-8 sm:pt-5 landing-language-intro ${introReady ? 'pointer-events-auto' : 'pointer-events-none'}`;
  const publicCardsWrapClass = introEnabled
    ? `${cardsWrapClass} ${introReady ? 'pointer-events-auto' : 'pointer-events-none'}`
    : cardsWrapClass;

  useEffect(() => { introReadyRef.current = introReady; }, [introReady]);

  useEffect(() => {
    if (adminMode || skipIntro || typeof window === 'undefined') {
      setIntroReady(true);
      return;
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIntroReady(true);
      return;
    }

    setIntroReady(false);
    const timer = window.setTimeout(() => {
      setIntroReady(true);
    }, LANDING_INTRO_TOTAL_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [adminMode, skipIntro, introEpoch]);

  useEffect(() => {
    if (adminMode) return;
    const handleVisible = () => {
      if (document.visibilityState === 'visible' && !introReadyRef.current) {
        setIntroEpoch((e) => e + 1);
      }
    };
    document.addEventListener('visibilitychange', handleVisible);
    return () => document.removeEventListener('visibilitychange', handleVisible);
  }, [adminMode]);

  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-black text-cream">
      {adminMode ? <img src={restaurants[0]?.heroImage} alt="" className="absolute inset-0 h-full w-full object-cover" /> : null}
      <div
        className={
          adminMode
            ? 'absolute inset-0 bg-gradient-to-b from-black/70 via-ink/45 to-ink'
            : 'absolute inset-0 bg-[linear-gradient(180deg,#000000_0%,#100d0a_55%,#15110d_100%)]'
        }
      />
      {introEnabled ? <Locanda22IntroLogo key={introEpoch} /> : null}
      <div className={languageWrapClass}>
        <LanguageSwitcher value={language} onChange={onLanguageChange} compact />
      </div>

      <section className={`relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-6xl flex-col px-3 pb-4 pt-[calc(env(safe-area-inset-top)+4.55rem)] sm:px-8 sm:pb-8 sm:pt-28 ${sectionClass}`}>
        <div className={headingWrapClass}>
          {adminMode ? <p className="mb-3 text-xs font-semibold uppercase text-gold-soft">{txt(language, 'adminArea')}</p> : null}
          <h1 className={headingClass}>
            {adminMode ? (
              txt(language, 'admin')
            ) : (
              <>
                <span className="hero-title-line hero-title-line-1 block">{txt(language, 'chooseExperienceLine1')}</span>
                <span className="hero-title-line hero-title-line-2 block">{txt(language, 'chooseExperienceLine2')}</span>
                <span className="hero-title-line hero-title-line-3 block">{txt(language, 'chooseExperienceLine3')}</span>
              </>
            )}
          </h1>
          {adminMode ? (
            <p className="mt-4 max-w-xl text-base leading-7 text-cream/80 sm:mt-5 sm:text-lg">{txt(language, 'chooseAdminVenue')}</p>
          ) : null}
        </div>

        <div className={publicCardsWrapClass}>
          {restaurants.map((restaurant, index) => (
            <LandingCard
              key={restaurant.id}
              restaurant={restaurant}
              language={language}
              adminMode={adminMode}
              index={index}
              onSelect={() => onSelectRestaurant(restaurant.id)}
            />
          ))}
        </div>
      </section>
    </main>
  );
}

function Locanda22IntroLogo() {
  return (
    <div aria-hidden="true" className="landing-intro-logo-shell">
      <div dangerouslySetInnerHTML={{ __html: locanda22IntroLogoSvg }} />
    </div>
  );
}

interface LandingCardProps {
  restaurant: Restaurant;
  language: LanguageCode;
  adminMode: boolean;
  index: number;
  onSelect: () => void;
}

function LandingCard({ restaurant, language, adminMode, index, onSelect }: LandingCardProps) {
  const publicExperience =
    restaurant.id === 'locanda22'
      ? {
          image: '/images/cucina-card.jpg',
          title: txt(language, 'diningTitle'),
          description: txt(language, 'diningDescription')
        }
      : {
          image: restaurant.heroImage,
          title: txt(language, 'aperitivoTitle'),
          description: txt(language, 'aperitivoDescription')
        };
  const eyebrow = adminMode ? null : null;
  const image = adminMode ? restaurant.heroImage : publicExperience.image;
  const adminTitle = restaurant.id === 'locanda22' ? 'Cucina' : 'Cocktail';
  const title = adminMode ? adminTitle : publicExperience.title;
  const description = adminMode ? restaurant.subtitle[language] : publicExperience.description;
  const cardClass = adminMode
    ? 'group relative min-h-[10rem] overflow-hidden rounded-[1.6rem] border border-white/15 bg-taupe text-left shadow-glow transition duration-300 hover:-translate-y-1 hover:border-gold/60 sm:min-h-52 sm:rounded-[1.9rem]'
    : 'group relative h-[11.5rem] overflow-hidden rounded-[1.75rem] border border-white/15 bg-taupe text-left shadow-glow transition duration-300 hover:-translate-y-1 hover:border-gold/60 sm:h-[17rem] sm:rounded-[2rem]';
  const titleClass = adminMode
    ? 'mt-3 font-display text-3xl sm:text-4xl'
    : 'landing-card-title whitespace-nowrap font-display text-[clamp(2.8rem,10vw,4.1rem)] leading-[0.9] text-cream sm:text-[clamp(3.35rem,5.6vw,4.65rem)]';
  const descriptionClass = adminMode
    ? 'mt-2 max-w-md text-sm leading-5 text-cream/75 sm:mt-3 sm:leading-6'
    : 'landing-card-copy mt-3 max-w-[15.5rem] text-[0.92rem] leading-5 text-cream sm:max-w-[18.5rem] sm:text-[0.98rem] sm:leading-6';
  const contentClass = adminMode
    ? 'relative flex h-full flex-col justify-end p-4 sm:min-h-52 sm:p-5'
    : 'relative flex h-full flex-col justify-end p-4 sm:p-5';
  const titleWrapClass = adminMode ? '' : 'min-h-[3.6rem] sm:min-h-[4.35rem]';
  const introClass = adminMode
    ? ''
    : index === 0
      ? 'landing-card-intro landing-card-intro-left'
      : 'landing-card-intro landing-card-intro-right';

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`${cardClass} ${introClass}`}
    >
      <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/24 to-black/92" />
      {!adminMode ? <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0)_24%,rgba(0,0,0,0.16)_48%,rgba(8,6,5,0.72)_78%,rgba(8,6,5,0.94)_100%)]" /> : null}
      <div className={contentClass}>
        {eyebrow ? (
          <div>
            <p className="inline-flex rounded-full border border-white/15 bg-black/25 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-gold-soft backdrop-blur-sm sm:text-xs">
              {eyebrow}
            </p>
          </div>
        ) : null}
        <div>
          <div className={titleWrapClass}>
            <h2 className={titleClass}>{title}</h2>
          </div>
          {!adminMode ? <div className="mt-2 h-px w-10 bg-gold/60" /> : null}
          <p className={descriptionClass}>{description}</p>
        </div>
      </div>
    </button>
  );
}

interface MenuExperienceProps {
  state: MenuState;
  restaurant: Restaurant;
  service: ServiceType | null;
  language: LanguageCode;
  onLanguageChange: (language: LanguageCode) => void;
  onChangeRestaurant: () => void;
}

function MenuExperience({ state, restaurant, service, language, onLanguageChange, onChangeRestaurant }: MenuExperienceProps) {
  const [selectedCategory, setSelectedCategory] = useState('');
  const categoryBarRef = useRef<HTMLDivElement | null>(null);
  const categoryScrollerRef = useRef<HTMLDivElement | null>(null);
  const categoryScrollAnimationRef = useRef<number | null>(null);
  const sectionRefs = useRef(new Map<string, HTMLElement | null>());
  const buttonRefs = useRef(new Map<string, HTMLButtonElement | null>());

  const isLocanda22 = restaurant.id === 'locanda22';
  const showAdelardiFoodLogo = restaurant.id === 'adelardi';
  const showHeroDescription = restaurant.id === 'adelardi';

  const restaurantCategories = useMemo(() => {
    const filtered = state.categories
      .filter((category) => {
        if (category.restaurantId !== restaurant.id) return false;
        if (isLocanda22 && service !== null) return category.serviceType === service;
        return true;
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);
    return filtered;
  }, [restaurant.id, isLocanda22, service, state.categories]);

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

  const categoryById = useMemo(
    () => restaurantCategories.reduce((accumulator, category) => accumulator.set(category.id, category), new Map<string, Category>()),
    [restaurantCategories]
  );

  const activeCategories = useMemo(
    () => restaurantCategories.filter((category) => category.active),
    [restaurantCategories]
  );

  const dishSections = useMemo(
    () =>
      activeCategories.map((category) => ({
        category,
        dishes: dishes.filter((dish) => dish.categoryId === category.id)
      })),
    [activeCategories, dishes]
  );

  const isAperitivoEmpty = isLocanda22 && service === 'aperitivo' && dishSections.length === 0;

  useEffect(() => {
    if (activeCategories.length === 0) {
      if (selectedCategory !== '') {
        setSelectedCategory('');
      }
      return;
    }

    if (!activeCategories.some((category) => category.id === selectedCategory)) {
      setSelectedCategory(activeCategories[0].id);
    }
  }, [activeCategories, selectedCategory]);

  const alignCategoryToLeft = useCallback((categoryId: string, behavior: ScrollBehavior = 'smooth') => {
    if (typeof window === 'undefined') {
      return;
    }

    const scroller = categoryScrollerRef.current;
    const activeButton = buttonRefs.current.get(categoryId);
    const section = sectionRefs.current.get(categoryId);

    if (!scroller || !activeButton) {
      return;
    }

    const scrollerRect = scroller.getBoundingClientRect();
    const firstCard = section?.querySelector('article');
    const cardRect = firstCard?.getBoundingClientRect();
    const cardLeft = cardRect?.left ?? scrollerRect.left;
    const leftInset = Math.max(cardLeft - scrollerRect.left, 0);
    const trailingInset = Math.max(scroller.clientWidth - activeButton.offsetWidth - leftInset + 8, 0);

    scroller.style.paddingLeft = '0px';
    scroller.style.paddingRight = `${trailingInset}px`;

    window.requestAnimationFrame(() => {
      const maxScrollLeft = scroller.scrollWidth - scroller.clientWidth;
      const currentDelta = activeButton.getBoundingClientRect().left - cardLeft;
      const targetScrollLeft = Math.max(
        0,
        Math.min(scroller.scrollLeft + currentDelta, maxScrollLeft)
      );

      if (Math.abs(scroller.scrollLeft - targetScrollLeft) > 2) {
        if (behavior === 'auto') {
          scroller.scrollLeft = targetScrollLeft;
          return;
        }

        if (categoryScrollAnimationRef.current) {
          window.cancelAnimationFrame(categoryScrollAnimationRef.current);
        }

        const startScrollLeft = scroller.scrollLeft;
        const distance = targetScrollLeft - startScrollLeft;
        const duration = window.innerWidth < 640 ? 420 : 320;
        let startTime: number | null = null;

        const animateScroll = (timestamp: number) => {
          if (startTime === null) {
            startTime = timestamp;
          }

          const progress = Math.min((timestamp - startTime) / duration, 1);
          const easedProgress = 1 - Math.pow(1 - progress, 3);
          scroller.scrollLeft = startScrollLeft + distance * easedProgress;

          if (progress < 1) {
            categoryScrollAnimationRef.current = window.requestAnimationFrame(animateScroll);
            return;
          }

          scroller.scrollLeft = targetScrollLeft;
          categoryScrollAnimationRef.current = null;
        };

        categoryScrollAnimationRef.current = window.requestAnimationFrame(animateScroll);
      }
    });
  }, []);

  useEffect(() => {
    if (!selectedCategory) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      alignCategoryToLeft(selectedCategory, 'smooth');
    });

    return () => window.cancelAnimationFrame(frame);
  }, [alignCategoryToLeft, selectedCategory]);

  useEffect(() => {
    if (typeof window === 'undefined' || !selectedCategory) {
      return;
    }

    const refreshAlignment = () => alignCategoryToLeft(selectedCategory, 'auto');
    window.addEventListener('resize', refreshAlignment);

    return () => {
      window.removeEventListener('resize', refreshAlignment);
    };
  }, [alignCategoryToLeft, selectedCategory]);

  useEffect(() => {
    return () => {
      if (categoryScrollAnimationRef.current) {
        window.cancelAnimationFrame(categoryScrollAnimationRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || dishSections.length === 0) {
      return;
    }

    const updateActiveCategory = () => {
      const stickyOffset =
        window.innerWidth < 640
          ? Math.min(Math.max(window.innerHeight * 0.34, 220), 300)
          : (categoryBarRef.current?.offsetHeight ?? 0) + 20;
      const firstSection = sectionRefs.current.get(dishSections[0].category.id);

      if (!firstSection) {
        return;
      }

      const firstSectionTop = firstSection.getBoundingClientRect().top;
      if (firstSectionTop > stickyOffset) {
        const firstCategoryId = dishSections[0].category.id;
        setSelectedCategory((current) => (current === firstCategoryId ? current : firstCategoryId));
        return;
      }

      let nextCategory = dishSections[0].category.id;

      for (const section of dishSections) {
        const element = sectionRefs.current.get(section.category.id);
        if (!element) {
          continue;
        }

        if (element.getBoundingClientRect().top - stickyOffset <= 0) {
          nextCategory = section.category.id;
        } else {
          break;
        }
      }

      setSelectedCategory((current) => (current === nextCategory ? current : nextCategory));
    };

    updateActiveCategory();
    window.addEventListener('scroll', updateActiveCategory, { passive: true });
    window.addEventListener('resize', updateActiveCategory);

    return () => {
      window.removeEventListener('scroll', updateActiveCategory);
      window.removeEventListener('resize', updateActiveCategory);
    };
  }, [dishSections]);

  const scrollToCategory = (categoryId: string) => {
    if (typeof window === 'undefined') {
      return;
    }

    const stickyOffset = window.innerWidth < 640 ? 20 : (categoryBarRef.current?.offsetHeight ?? 0) + 16;
    const target = sectionRefs.current.get(categoryId);

    if (!target) {
      return;
    }

    const top = window.scrollY + target.getBoundingClientRect().top - stickyOffset;
    window.scrollTo({ top, behavior: 'smooth' });
    setSelectedCategory(categoryId);
    alignCategoryToLeft(categoryId);
  };

  return (
    <main className="min-h-[100dvh] bg-coal text-cream">
      <section className="relative flex min-h-[calc(100dvh-6rem)] overflow-hidden sm:min-h-[96dvh]">
        <img src={restaurant.heroImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-ink/40 to-coal" />

        <div className="max-sm:fixed sm:absolute inset-x-0 top-0 z-50 flex items-start justify-between gap-2 px-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] sm:gap-3 sm:px-8 sm:pt-5">
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

        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col justify-start px-3 pb-8 pt-[calc(env(safe-area-inset-top)+4.35rem)] sm:justify-end sm:px-8 sm:pb-10 sm:pt-28">
          <div className={`${showAdelardiFoodLogo || restaurant.logoImage ? 'max-w-[24rem]' : 'max-w-3xl'} animate-fadeUp`}>
            {showAdelardiFoodLogo ? (
              <>
                <img
                  src="/images/adelardi-logo.png"
                  alt="Adelardi Pizza & Food"
                  className="block w-[90%] max-w-[21.75rem] origin-left sm:w-[34rem] sm:max-w-full"
                />
                {showHeroDescription ? (
                  <p className="mt-5 max-w-[22rem] text-[0.95rem] leading-6 text-cream/80 sm:mt-6 sm:max-w-2xl sm:text-xl sm:leading-8">
                    {restaurant.subtitle[language]}
                  </p>
                ) : null}
              </>
            ) : restaurant.logoImage ? (
              <>
                <img
                  src={restaurant.logoImage}
                  alt={restaurant.name}
                  className="block max-h-28 w-auto max-w-[16rem] object-contain drop-shadow-[0_2px_12px_rgba(0,0,0,0.55)] sm:max-h-36 sm:max-w-[22rem]"
                />
                <p className="mt-5 max-w-2xl text-[0.95rem] leading-6 text-cream/80 sm:mt-6 sm:text-xl sm:leading-8">
                  {restaurant.subtitle[language]}
                </p>
              </>
            ) : (
              <>
                <h1 className="font-display text-[clamp(3.2rem,18vw,6rem)] leading-[0.9] sm:text-8xl">{restaurant.name}</h1>
                <p className="mt-4 max-w-2xl text-[0.95rem] leading-6 text-cream/80 sm:mt-5 sm:text-xl sm:leading-8">
                  {restaurant.subtitle[language]}
                </p>
              </>
            )}
            <p className={`${showHeroDescription || restaurant.logoImage ? 'mt-5 sm:mt-6' : showAdelardiFoodLogo ? 'mt-7' : 'mt-3 sm:mt-4'} text-sm leading-5 text-cream/60`}>
              {restaurant.address}
            </p>
          </div>

          <div className="pb-[calc(env(safe-area-inset-bottom)+0.25rem)]" />
        </div>
      </section>

      <section id="menu" className="mx-auto w-full max-w-6xl px-3 py-0 sm:px-8 sm:py-10">
        {isAperitivoEmpty ? (
          <div className="my-16 flex flex-col items-center justify-center gap-5 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-taupe text-gold">
              <Wine className="h-7 w-7" />
            </div>
            <p className="max-w-sm text-base leading-7 text-cream/70">{txt(language, 'aperitivoComingSoon')}</p>
          </div>
        ) : (
          <>
            <div
              ref={categoryBarRef}
              className="fixed inset-x-0 bottom-0 z-40 border-t border-white/8 bg-black px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 shadow-[0_-20px_45px_rgba(0,0,0,0.58)] sm:sticky sm:top-0 sm:bottom-auto sm:z-30 sm:-mx-8 sm:border-y sm:border-white/10 sm:bg-coal/95 sm:px-8 sm:py-4 sm:shadow-none sm:backdrop-blur-xl"
            >
              <div ref={categoryScrollerRef} className="mobile-scrollbar flex gap-2 overflow-x-auto pb-1">
                {activeCategories.map((category) => (
                  <button
                    key={category.id}
                    ref={(element) => {
                      buttonRefs.current.set(category.id, element);
                    }}
                    type="button"
                    onClick={() => scrollToCategory(category.id)}
                    className={`category-chip ${selectedCategory === category.id ? 'category-chip-active' : ''}`}
                  >
                    {category.name[language]}
                  </button>
                ))}
              </div>
            </div>

            {dishSections.length > 0 ? (
              <div className="space-y-4 pb-[calc(env(safe-area-inset-bottom)+6.5rem)] pt-4 sm:space-y-8 sm:py-6">
                {dishSections.map(({ category, dishes: categoryDishes }) => (
                  <section
                    key={category.id}
                    ref={(element) => {
                      sectionRefs.current.set(category.id, element);
                    }}
                    className="scroll-mt-24"
                  >
                    <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
                      {categoryDishes.map((dish) => (
                        <DishCard key={dish.id} dish={dish} category={categoryById.get(dish.categoryId)} language={language} />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <div className="my-10 rounded-3xl border border-white/10 bg-taupe p-8 text-center">
                <p className="font-display text-2xl">{txt(language, 'noResults')}</p>
              </div>
            )}
          </>
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
    <main className="relative min-h-[100dvh] overflow-hidden bg-ink text-cream">
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

      <section className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-4xl flex-col justify-end px-3 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pt-24 sm:px-8">
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

interface SupabaseAuthModalProps {
  language: LanguageCode;
  onClose: () => void;
  onAuth: () => void;
}

function SupabaseAuthModal({ language, onClose, onAuth }: SupabaseAuthModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    void signInAdmin(email, password).then(({ error: authError }) => {
      setLoading(false);
      if (authError) {
        setError(authError);
        return;
      }
      onAuth();
    });
  };

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/75 px-4 text-cream backdrop-blur-md">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-[1.75rem] border border-white/10 bg-taupe p-5 shadow-glow">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-full bg-gold/15 p-3 text-gold">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-gold">{txt(language, 'admin')}</p>
            <h2 className="font-display text-2xl">{txt(language, 'loginTitle')}</h2>
          </div>
        </div>
        <div className="space-y-3">
          <label className="space-y-2">
            <span className="admin-label">{txt(language, 'email')}</span>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              autoFocus
              required
              className="admin-input"
              placeholder="admin@example.com"
            />
          </label>
          <label className="space-y-2">
            <span className="admin-label">{txt(language, 'password')}</span>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              required
              className="admin-input"
            />
          </label>
        </div>
        {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
        <div className="mt-5 flex gap-2">
          <button type="button" onClick={onClose} className="admin-secondary-button flex-1 justify-center">
            {txt(language, 'close')}
          </button>
          <button type="submit" disabled={loading} className="admin-primary-button flex-1 justify-center">
            <ShieldCheck className="h-4 w-4" />
            {loading ? '...' : txt(language, 'unlock')}
          </button>
        </div>
      </form>
    </div>
  );
}
