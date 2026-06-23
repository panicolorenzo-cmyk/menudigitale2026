import { ChangeEvent, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ExternalLink,
  Image as ImageIcon,
  Plus,
  Power,
  QrCode,
  Save,
  Tags,
  Upload,
  Utensils,
  X
} from 'lucide-react';
import { hasSupabaseConfig } from '../lib/supabase';
import { txt } from '../lib/text';
import { LANGUAGES, type Category, type Dish, type LanguageCode, type MenuState, type Restaurant, type TranslatedText } from '../types';
import { QRCodeCanvas } from './QRCodeCanvas';

type AdminTab = 'dishes' | 'categories' | 'qr';

interface AdminPanelProps {
  state: MenuState;
  restaurant: Restaurant;
  language: LanguageCode;
  onClose: () => void;
  onUpdate: (state: MenuState) => void;
}

const emptyTranslatedText = (): TranslatedText => ({
  it: '',
  en: '',
  fr: '',
  de: '',
  es: ''
});

const normalizeText = (value: TranslatedText, fallback = 'Senza nome'): TranslatedText => {
  const firstValue = LANGUAGES.map((language) => value[language.code]).find(Boolean) ?? fallback;

  return LANGUAGES.reduce((accumulator, language) => {
    accumulator[language.code] = value[language.code]?.trim() || firstValue;
    return accumulator;
  }, {} as TranslatedText);
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const makeId = (prefix: string, label: string) => `${prefix}-${slugify(label) || Date.now()}`;

const buildRestaurantLink = (restaurantId: string) => {
  if (typeof window === 'undefined') {
    return `/?locale=${restaurantId}`;
  }

  return `${window.location.origin}/?locale=${restaurantId}`;
};

const buildAdminLink = (restaurantId: string) => {
  if (typeof window === 'undefined') {
    return `/admin?locale=${restaurantId}`;
  }

  return `${window.location.origin}/admin?locale=${restaurantId}`;
};

export function AdminPanel({ state, restaurant, language, onClose, onUpdate }: AdminPanelProps) {
  const [tab, setTab] = useState<AdminTab>('dishes');

  const restaurantCategories = useMemo(
    () =>
      state.categories
        .filter((category) => category.restaurantId === restaurant.id)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [restaurant.id, state.categories]
  );

  const restaurantDishes = useMemo(
    () =>
      state.dishes
        .filter((dish) => dish.restaurantId === restaurant.id)
        .sort((a, b) => {
          const categoryA = restaurantCategories.find((category) => category.id === a.categoryId)?.sortOrder ?? 999;
          const categoryB = restaurantCategories.find((category) => category.id === b.categoryId)?.sortOrder ?? 999;
          return categoryA - categoryB || a.name.it.localeCompare(b.name.it);
        }),
    [restaurant.id, restaurantCategories, state.dishes]
  );

  const blankCategory = (): Category => ({
    id: '',
    restaurantId: restaurant.id,
    name: emptyTranslatedText(),
    active: true,
    sortOrder: restaurantCategories.length * 10 + 10
  });

  const blankDish = (): Dish => ({
    id: '',
    restaurantId: restaurant.id,
    categoryId: restaurantCategories[0]?.id ?? '',
    name: emptyTranslatedText(),
    description: emptyTranslatedText(),
    allergens: [],
    price: 0,
    image: 'https://images.unsplash.com/photo-1543352634-a1c51d9f1fa7?auto=format&fit=crop&w=1100&q=84',
    active: true
  });

  const [categoryDraft, setCategoryDraft] = useState<Category>(() => blankCategory());
  const [dishDraft, setDishDraft] = useState<Dish>(() => blankDish());

  useEffect(() => {
    setCategoryDraft(blankCategory());
    setDishDraft(blankDish());
  }, [restaurant.id]);

  const saveCategory = () => {
    const normalized: Category = {
      ...categoryDraft,
      id: categoryDraft.id || makeId(`${restaurant.id}-category`, categoryDraft.name.it || categoryDraft.name[language] || 'categoria'),
      restaurantId: restaurant.id,
      name: normalizeText(categoryDraft.name, 'Categoria'),
      sortOrder: Number(categoryDraft.sortOrder) || restaurantCategories.length * 10 + 10
    };

    const exists = state.categories.some((category) => category.id === normalized.id);
    const categories = exists
      ? state.categories.map((category) => (category.id === normalized.id ? normalized : category))
      : [...state.categories, normalized];

    onUpdate({ ...state, categories });
    setCategoryDraft(blankCategory());
  };

  const saveDish = () => {
    const normalized: Dish = {
      ...dishDraft,
      id: dishDraft.id || makeId(`${restaurant.id}-dish`, dishDraft.name.it || dishDraft.name[language] || 'piatto'),
      restaurantId: restaurant.id,
      categoryId: dishDraft.categoryId || restaurantCategories[0]?.id || '',
      name: normalizeText(dishDraft.name, 'Piatto'),
      description: normalizeText(dishDraft.description, ''),
      allergens: dishDraft.allergens.map((allergen) => allergen.trim()).filter(Boolean),
      price: Number(dishDraft.price) || 0
    };

    const exists = state.dishes.some((dish) => dish.id === normalized.id);
    const dishes = exists
      ? state.dishes.map((dish) => (dish.id === normalized.id ? normalized : dish))
      : [...state.dishes, normalized];

    onUpdate({ ...state, dishes });
    setDishDraft(blankDish());
  };

  const toggleDish = (dish: Dish) => {
    onUpdate({
      ...state,
      dishes: state.dishes.map((item) => (item.id === dish.id ? { ...item, active: !item.active } : item))
    });
  };

  const toggleCategory = (category: Category) => {
    onUpdate({
      ...state,
      categories: state.categories.map((item) => (item.id === category.id ? { ...item, active: !item.active } : item))
    });
  };

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setDishDraft((current) => ({ ...current, image: String(reader.result) }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-ink/95 text-cream backdrop-blur-xl">
      <div className="mx-auto flex h-full max-w-6xl flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-white/10 px-3 py-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] sm:gap-4 sm:px-6 sm:py-4 sm:pt-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase text-gold">{txt(language, 'admin')}</p>
            <h2 className="truncate font-display text-2xl">{restaurant.name}</h2>
            <p className="mt-1 line-clamp-2 text-xs text-muted">
              {hasSupabaseConfig ? txt(language, 'supabaseReady') : txt(language, 'supabaseLocal')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full border border-white/10 bg-white/5 p-3 text-cream transition hover:bg-white/15"
            aria-label={txt(language, 'close')}
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <nav className="mobile-scrollbar flex gap-2 overflow-x-auto border-b border-white/10 px-3 py-3 sm:px-6">
          <TabButton active={tab === 'dishes'} onClick={() => setTab('dishes')} icon={<Utensils className="h-4 w-4" />}>
            {txt(language, 'dishes')}
          </TabButton>
          <TabButton active={tab === 'categories'} onClick={() => setTab('categories')} icon={<Tags className="h-4 w-4" />}>
            {txt(language, 'categories')}
          </TabButton>
          <TabButton active={tab === 'qr'} onClick={() => setTab('qr')} icon={<QrCode className="h-4 w-4" />}>
            {txt(language, 'qrLinks')}
          </TabButton>
        </nav>

        <main className="flex-1 overflow-y-auto px-3 py-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:px-6 sm:py-5">
          {tab === 'dishes' ? (
            <section className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
              <div className="rounded-[1.35rem] border border-white/10 bg-taupe/70 p-3 sm:rounded-3xl sm:p-4">
                <div className="mb-4 flex items-center gap-2">
                  <Plus className="h-4 w-4 text-gold" />
                  <h3 className="font-display text-xl">{dishDraft.id ? dishDraft.name[language] : txt(language, 'addDish')}</h3>
                </div>
                <div className="space-y-4">
                  <TranslatedInputs
                    title={txt(language, 'name')}
                    value={dishDraft.name}
                    onChange={(name) => setDishDraft((current) => ({ ...current, name }))}
                  />
                  <TranslatedInputs
                    title={txt(language, 'description')}
                    value={dishDraft.description}
                    multiline
                    onChange={(description) => setDishDraft((current) => ({ ...current, description }))}
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-2">
                      <span className="admin-label">{txt(language, 'category')}</span>
                      <select
                        value={dishDraft.categoryId}
                        onChange={(event) => setDishDraft((current) => ({ ...current, categoryId: event.target.value }))}
                        className="admin-input"
                      >
                        {restaurantCategories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name[language]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-2">
                      <span className="admin-label">{txt(language, 'price')}</span>
                      <input
                        type="number"
                        step="0.5"
                        value={dishDraft.price}
                        onChange={(event) => setDishDraft((current) => ({ ...current, price: Number(event.target.value) }))}
                        className="admin-input"
                      />
                    </label>
                  </div>
                  <label className="space-y-2">
                    <span className="admin-label">{txt(language, 'allergens')}</span>
                    <input
                      value={dishDraft.allergens.join(', ')}
                      onChange={(event) =>
                        setDishDraft((current) => ({
                          ...current,
                          allergens: event.target.value.split(',').map((allergen) => allergen.trim())
                        }))
                      }
                      className="admin-input"
                      placeholder="gluten, milk, nuts"
                    />
                  </label>
                  <div className="space-y-3 rounded-2xl border border-white/10 bg-black/15 p-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gold">
                      <ImageIcon className="h-4 w-4" />
                      {txt(language, 'photo')}
                    </div>
                    <input
                      value={dishDraft.image}
                      onChange={(event) => setDishDraft((current) => ({ ...current, image: event.target.value }))}
                      className="admin-input"
                      placeholder="https://..."
                    />
                    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-gold/40 bg-gold/10 px-4 py-3.5 text-sm font-semibold text-gold transition hover:bg-gold/15">
                      <Upload className="h-4 w-4" />
                      Carica foto dal dispositivo
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                    {dishDraft.image ? (
                      <img src={dishDraft.image} alt="" className="aspect-[4/3] w-full rounded-2xl object-cover" />
                    ) : null}
                  </div>
                  <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                    <span className="text-sm font-semibold text-cream">{dishDraft.active ? txt(language, 'active') : txt(language, 'inactive')}</span>
                    <input
                      type="checkbox"
                      checked={dishDraft.active}
                      onChange={(event) => setDishDraft((current) => ({ ...current, active: event.target.checked }))}
                      className="h-5 w-5 accent-gold"
                    />
                  </label>
                  <button type="button" onClick={saveDish} className="admin-primary-button w-full justify-center sm:w-auto">
                    <Save className="h-4 w-4" />
                    {txt(language, 'save')}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {restaurantDishes.map((dish) => {
                  const category = restaurantCategories.find((item) => item.id === dish.categoryId);
                  return (
                    <div key={dish.id} className="rounded-[1.35rem] border border-white/10 bg-taupe/70 p-3 sm:rounded-3xl">
                      <div className="flex gap-3">
                        <img src={dish.image} alt="" className="h-20 w-20 shrink-0 rounded-2xl object-cover sm:h-24 sm:w-24" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold uppercase text-gold/80">{category?.name[language]}</p>
                          <h4 className="line-clamp-2 font-display text-lg leading-tight sm:text-xl">{dish.name[language]}</h4>
                          <p className="mt-1 text-sm text-muted">€ {dish.price.toFixed(2)}</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button type="button" onClick={() => setDishDraft(dish)} className="admin-secondary-button">
                              Modifica
                            </button>
                            <button type="button" onClick={() => toggleDish(dish)} className="admin-secondary-button">
                              <Power className="h-3.5 w-3.5" />
                              {dish.active ? txt(language, 'inactive') : txt(language, 'active')}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}

          {tab === 'categories' ? (
            <section className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
              <div className="rounded-[1.35rem] border border-white/10 bg-taupe/70 p-3 sm:rounded-3xl sm:p-4">
                <div className="mb-4 flex items-center gap-2">
                  <Plus className="h-4 w-4 text-gold" />
                  <h3 className="font-display text-xl">
                    {categoryDraft.id ? categoryDraft.name[language] : txt(language, 'addCategory')}
                  </h3>
                </div>
                <div className="space-y-4">
                  <TranslatedInputs
                    title={txt(language, 'name')}
                    value={categoryDraft.name}
                    onChange={(name) => setCategoryDraft((current) => ({ ...current, name }))}
                  />
                  <label className="space-y-2">
                    <span className="admin-label">Ordine</span>
                    <input
                      type="number"
                      value={categoryDraft.sortOrder}
                      onChange={(event) => setCategoryDraft((current) => ({ ...current, sortOrder: Number(event.target.value) }))}
                      className="admin-input"
                    />
                  </label>
                  <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                    <span className="text-sm font-semibold text-cream">{categoryDraft.active ? txt(language, 'active') : txt(language, 'inactive')}</span>
                    <input
                      type="checkbox"
                      checked={categoryDraft.active}
                      onChange={(event) => setCategoryDraft((current) => ({ ...current, active: event.target.checked }))}
                      className="h-5 w-5 accent-gold"
                    />
                  </label>
                  <button type="button" onClick={saveCategory} className="admin-primary-button w-full justify-center sm:w-auto">
                    <Save className="h-4 w-4" />
                    {txt(language, 'save')}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {restaurantCategories.map((category) => (
                  <div key={category.id} className="rounded-[1.35rem] border border-white/10 bg-taupe/70 p-3 sm:rounded-3xl sm:p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase text-gold/80">#{category.sortOrder}</p>
                        <h4 className="font-display text-xl">{category.name[language]}</h4>
                        <p className="mt-1 text-sm text-muted">
                          {restaurantDishes.filter((dish) => dish.categoryId === category.id).length} piatti
                        </p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${category.active ? 'bg-gold text-ink' : 'bg-white/10 text-muted'}`}>
                        {category.active ? txt(language, 'active') : txt(language, 'inactive')}
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button type="button" onClick={() => setCategoryDraft(category)} className="admin-secondary-button">
                        Modifica
                      </button>
                      <button type="button" onClick={() => toggleCategory(category)} className="admin-secondary-button">
                        <Power className="h-3.5 w-3.5" />
                        {category.active ? txt(language, 'inactive') : txt(language, 'active')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {tab === 'qr' ? (
            <section className="grid gap-5 md:grid-cols-2">
              {state.restaurants.map((item) => {
                const link = buildRestaurantLink(item.id);
                return (
                  <div key={item.id} className="rounded-[1.35rem] border border-white/10 bg-taupe/70 p-3 sm:rounded-3xl sm:p-4">
                    <div className="mb-4 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase text-gold">QR</p>
                        <h3 className="font-display text-2xl">{item.name}</h3>
                      </div>
                      <a
                        href={link}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-white/10 bg-white/5 p-3 text-cream transition hover:bg-white/15"
                        aria-label={txt(language, 'openMenu')}
                      >
                        <ExternalLink className="h-5 w-5" />
                      </a>
                    </div>
                    <QRCodeCanvas value={link} label={`QR ${item.name}`} />
                    <div className="mt-4 rounded-2xl border border-white/10 bg-black/15 p-3">
                      <p className="text-xs font-semibold uppercase text-gold">{txt(language, 'adminArea')}</p>
                      <p className="mt-1 break-all text-xs leading-5 text-muted">{buildAdminLink(item.id)}</p>
                    </div>
                  </div>
                );
              })}
            </section>
          ) : null}
        </main>
      </div>
    </div>
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  children: ReactNode;
}

function TabButton({ active, onClick, icon, children }: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
        active ? 'bg-gold text-ink shadow-gold' : 'bg-white/5 text-muted hover:bg-white/10 hover:text-cream'
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

interface TranslatedInputsProps {
  title: string;
  value: TranslatedText;
  onChange: (value: TranslatedText) => void;
  multiline?: boolean;
}

function TranslatedInputs({ title, value, onChange, multiline = false }: TranslatedInputsProps) {
  return (
    <fieldset className="space-y-2">
      <legend className="admin-label">{title}</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {LANGUAGES.map((language) => (
          <label key={language.code} className="grid gap-1">
            <span className="text-[0.68rem] font-semibold uppercase text-muted/70">{language.short}</span>
            {multiline ? (
              <textarea
                value={value[language.code]}
                onChange={(event) => onChange({ ...value, [language.code]: event.target.value })}
                className="admin-input min-h-20 resize-y"
              />
            ) : (
              <input
                value={value[language.code]}
                onChange={(event) => onChange({ ...value, [language.code]: event.target.value })}
                className="admin-input"
              />
            )}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
