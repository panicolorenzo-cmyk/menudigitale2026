import { ChangeEvent, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ExternalLink,
  Image as ImageIcon,
  LogOut,
  Plus,
  Power,
  QrCode,
  Save,
  Tags,
  Trash2,
  Upload,
  Utensils,
  X
} from 'lucide-react';
import { hasSupabaseConfig, uploadMenuImage } from '../lib/supabase';
import { txt } from '../lib/text';
import { translateFromItalian } from '../lib/translate';
import { LANGUAGES, type Category, type Dish, type LanguageCode, type MenuState, type Restaurant, type ServiceType, type TranslatedText } from '../types';
import { QRCodeCanvas } from './QRCodeCanvas';

type AdminTab = 'dishes' | 'categories' | 'qr';

interface AdminPanelProps {
  state: MenuState;
  restaurant: Restaurant;
  language: LanguageCode;
  dataReady?: boolean;
  onClose: () => void;
  onUpdate: (state: MenuState | ((currentState: MenuState) => MenuState)) => void;
  onSave: () => Promise<boolean>;
  onSignOut?: () => void;
}

const DEFAULT_DISH_IMAGE = 'https://images.unsplash.com/photo-1543352634-a1c51d9f1fa7?auto=format&fit=crop&w=1100&q=84';

const emptyTranslatedText = (): TranslatedText =>
  LANGUAGES.reduce((accumulator, language) => {
    accumulator[language.code] = '';
    return accumulator;
  }, {} as TranslatedText);

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

const makeId = (prefix: string, label: string) => `${prefix}-${slugify(label) || 'item'}-${Date.now().toString(36)}`;

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

export function AdminPanel({ state, restaurant, language, dataReady = true, onClose, onUpdate, onSave, onSignOut }: AdminPanelProps) {
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
    serviceType: 'cucina',
    name: emptyTranslatedText(),
    active: true,
    sortOrder: restaurantCategories.length * 10 + 10
  });

  const getValidCategoryId = (categoryId?: string) =>
    restaurantCategories.some((category) => category.id === categoryId) ? categoryId ?? '' : restaurantCategories[0]?.id ?? '';

  const cloneDishForDraft = (dish: Dish): Dish => ({
    ...dish,
    name: { ...dish.name },
    description: { ...dish.description },
    allergens: [...dish.allergens]
  });

  const blankDish = (categoryId?: string): Dish => ({
    id: '',
    restaurantId: restaurant.id,
    categoryId: getValidCategoryId(categoryId),
    name: emptyTranslatedText(),
    description: emptyTranslatedText(),
    allergens: [],
    price: 0,
    image: DEFAULT_DISH_IMAGE,
    active: true
  });

  const [categoryDraft, setCategoryDraft] = useState<Category>(() => blankCategory());
  const [dishDraft, setDishDraft] = useState<Dish>(() => blankDish());
  const [saveDishStatus, setSaveDishStatus] = useState<null | 'saving' | 'saved' | 'error'>(null);
  const [saveCategoryStatus, setSaveCategoryStatus] = useState<null | 'saving' | 'saved' | 'error'>(null);

  useEffect(() => {
    setCategoryDraft(blankCategory());
    setDishDraft(blankDish());
  }, [restaurant.id]);

  // Fix: only reset categoryId when restaurant changes, not when categories list changes
  useEffect(() => {
    setDishDraft((current) => ({
      ...current,
      restaurantId: restaurant.id,
      categoryId: getValidCategoryId(current.categoryId)
    }));
  }, [restaurant.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveCategory = () => {
    const normalized: Category = {
      ...categoryDraft,
      id: categoryDraft.id || makeId(`${restaurant.id}-category`, categoryDraft.name.it || categoryDraft.name[language] || 'categoria'),
      restaurantId: restaurant.id,
      serviceType: categoryDraft.serviceType ?? 'cucina',
      name: normalizeText(categoryDraft.name, 'Categoria'),
      sortOrder: Number(categoryDraft.sortOrder) || restaurantCategories.length * 10 + 10
    };

    const nextState = (currentState: MenuState): MenuState => {
      const exists = currentState.categories.some((c) => c.id === normalized.id && c.restaurantId === restaurant.id);
      const categories = exists
        ? currentState.categories.map((c) =>
            c.id === normalized.id && c.restaurantId === restaurant.id ? normalized : c
          )
        : [...currentState.categories, normalized];
      return { ...currentState, categories };
    };

    onUpdate(nextState);
    setCategoryDraft(blankCategory());

    setSaveCategoryStatus('saving');
    void onSave().then((ok) => {
      setSaveCategoryStatus(ok ? 'saved' : 'error');
      if (ok) window.setTimeout(() => setSaveCategoryStatus(null), 2000);
    });
  };

  const deleteCategory = (category: Category) => {
    const hasDishes = restaurantDishes.some((dish) => dish.categoryId === category.id);
    if (hasDishes) {
      alert(`Impossibile eliminare: la categoria "${category.name[language]}" contiene ancora dei piatti. Sposta o elimina i piatti prima.`);
      return;
    }

    onUpdate((currentState) => ({
      ...currentState,
      categories: currentState.categories.filter(
        (item) => !(item.id === category.id && item.restaurantId === restaurant.id)
      )
    }));

    if (categoryDraft.id === category.id) {
      setCategoryDraft(blankCategory());
    }

    void onSave();
  };

  const saveDish = async () => {
    setSaveDishStatus('saving');

    const [translatedName, translatedDescription] = await Promise.all([
      translateFromItalian(dishDraft.name.it || ''),
      translateFromItalian(dishDraft.description.it || '')
    ]);

    const draftToSave = { ...dishDraft, name: translatedName, description: translatedDescription };

    const existingDish = draftToSave.id
      ? state.dishes.find((dish) => dish.id === draftToSave.id && dish.restaurantId === restaurant.id)
      : undefined;
    const categoryId = getValidCategoryId(draftToSave.categoryId);
    const image = draftToSave.image.trim() || existingDish?.image || DEFAULT_DISH_IMAGE;
    const normalized: Dish = {
      ...existingDish,
      ...draftToSave,
      id: draftToSave.id || makeId(`${restaurant.id}-dish`, draftToSave.name.it || 'piatto'),
      restaurantId: restaurant.id,
      categoryId,
      name: normalizeText(draftToSave.name, 'Piatto'),
      description: normalizeText(draftToSave.description, ''),
      allergens: draftToSave.allergens.map((allergen) => allergen.trim()).filter(Boolean),
      price: Number(draftToSave.price) || 0,
      image
    };

    const nextState = (currentState: MenuState): MenuState => {
      const exists = currentState.dishes.some((d) => d.id === normalized.id && d.restaurantId === restaurant.id);
      const dishes = exists
        ? currentState.dishes.map((d) =>
            d.id === normalized.id && d.restaurantId === restaurant.id ? { ...d, ...normalized } : d
          )
        : [...currentState.dishes, normalized];
      return { ...currentState, dishes };
    };

    onUpdate(nextState);
    setDishDraft(blankDish(normalized.categoryId));

    void onSave().then((ok) => {
      setSaveDishStatus(ok ? 'saved' : 'error');
      if (ok) window.setTimeout(() => setSaveDishStatus(null), 2000);
    });
  };

  const toggleDish = (dish: Dish) => {
    onUpdate((currentState) => {
      const dishes = currentState.dishes.map((item) =>
        item.id === dish.id && item.restaurantId === restaurant.id ? { ...item, active: !item.active } : item
      );

      return { ...currentState, dishes };
    });

    void onSave();
  };

  const deleteDish = (dish: Dish) => {
    if (!window.confirm(`Eliminare "${dish.name[language]}"?`)) return;

    const nextState = (currentState: MenuState): MenuState => ({
      ...currentState,
      dishes: currentState.dishes.filter((d) => !(d.id === dish.id && d.restaurantId === restaurant.id))
    });

    onUpdate(nextState);

    if (dishDraft.id === dish.id) {
      setDishDraft(blankDish(dish.categoryId));
    }

    void onSave();
  };

  const toggleCategory = (category: Category) => {
    onUpdate((currentState) => {
      const categories = currentState.categories.map((item) =>
        item.id === category.id && item.restaurantId === restaurant.id ? { ...item, active: !item.active } : item
      );

      return { ...currentState, categories };
    });

    void onSave();
  };

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (hasSupabaseConfig) {
      void uploadMenuImage(file).then((url) => {
        if (url) {
          setDishDraft((current) => ({ ...current, image: url }));
          return;
        }
        readAsDataUrl(file);
      });
      return;
    }

    readAsDataUrl(file);
  };

  const readAsDataUrl = (file: File) => {
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
          <div className="flex shrink-0 items-center gap-2">
            {hasSupabaseConfig && onSignOut ? (
              <button
                type="button"
                onClick={onSignOut}
                className="rounded-full border border-white/10 bg-white/5 p-3 text-muted transition hover:bg-white/15 hover:text-cream"
                aria-label={txt(language, 'logout')}
                title={txt(language, 'logout')}
              >
                <LogOut className="h-5 w-5" />
              </button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/10 bg-white/5 p-3 text-cream transition hover:bg-white/15"
              aria-label={txt(language, 'close')}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
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
          {!dataReady ? (
            <div className="flex h-full min-h-[12rem] items-center justify-center">
              <div className="space-y-3 text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
                <p className="text-sm text-muted">Caricamento dati…</p>
              </div>
            </div>
          ) : null}
          {dataReady && tab === 'dishes' ? (
            <section className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
              <div className="rounded-[1.35rem] border border-white/10 bg-taupe/70 p-3 sm:rounded-3xl sm:p-4">
                <div className="mb-4 flex items-center gap-2">
                  <Plus className="h-4 w-4 text-gold" />
                  <h3 className="font-display text-xl">{dishDraft.id ? dishDraft.name[language] : txt(language, 'addDish')}</h3>
                </div>
                <div className="space-y-4">
                  <label className="space-y-2">
                    <span className="admin-label">{txt(language, 'name')}</span>
                    <input
                      value={dishDraft.name.it}
                      onChange={(e) => setDishDraft((current) => ({ ...current, name: { ...current.name, it: e.target.value } }))}
                      className="admin-input"
                      placeholder="Nome del piatto"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="admin-label">{txt(language, 'description')}</span>
                    <textarea
                      value={dishDraft.description.it}
                      onChange={(e) => setDishDraft((current) => ({ ...current, description: { ...current.description, it: e.target.value } }))}
                      className="admin-input min-h-20 resize-y"
                      placeholder="Descrizione del piatto"
                    />
                    <p className="text-[0.65rem] text-muted/60">Le altre lingue vengono tradotte automaticamente al salvataggio.</p>
                  </label>
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
                  <button type="button" onClick={() => { void saveDish(); }} disabled={saveDishStatus === 'saving'} className="admin-primary-button w-full justify-center sm:w-auto">
                    <Save className="h-4 w-4" />
                    {saveDishStatus === 'saving' ? 'Traduzione e salvataggio...' : txt(language, 'save')}
                  </button>
                  {saveDishStatus === 'saved' && <p className="text-xs text-green-400">Salvato su Supabase</p>}
                  {saveDishStatus === 'error' && <p className="text-xs text-red-400">Errore salvataggio Supabase — verifica connessione</p>}
                </div>
              </div>

              <div className="space-y-2">
                {restaurantDishes.map((dish) => {
                  const category = restaurantCategories.find((item) => item.id === dish.categoryId);
                  return (
                    <div key={dish.id} className="rounded-[1.35rem] border border-white/10 bg-taupe/70 p-2.5 sm:rounded-2xl">
                      <div className="flex gap-2.5">
                        <img src={dish.image} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover sm:h-16 sm:w-16" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[0.65rem] font-semibold uppercase leading-none text-gold/80">{category?.name[language]}</p>
                          <h4 className="mt-0.5 line-clamp-2 font-display text-[1rem] leading-tight sm:text-[1.05rem]">{dish.name[language]}</h4>
                          <p className="mt-0.5 text-xs font-medium text-muted">€ {dish.price.toFixed(2)}</p>
                          <div className="mt-2 grid grid-cols-3 gap-1.5">
                            <button type="button" onClick={() => setDishDraft(cloneDishForDraft(dish))} className="admin-compact-button">
                              Modifica
                            </button>
                            <button type="button" onClick={() => toggleDish(dish)} className="admin-compact-button">
                              <Power className="h-3 w-3" />
                              {dish.active ? txt(language, 'inactive') : txt(language, 'active')}
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteDish(dish)}
                              className="admin-compact-button text-red-400 hover:border-red-400/40 hover:bg-red-400/10 hover:text-red-300"
                            >
                              <Trash2 className="h-3 w-3" />
                              Elimina
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

          {dataReady && tab === 'categories' ? (
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
                  {restaurant.id === 'locanda22' ? (
                    <label className="space-y-2">
                      <span className="admin-label">{txt(language, 'serviceTypeLabel')}</span>
                      <select
                        value={categoryDraft.serviceType ?? 'cucina'}
                        onChange={(event) => setCategoryDraft((current) => ({ ...current, serviceType: event.target.value as ServiceType }))}
                        className="admin-input"
                      >
                        <option value="cucina">{txt(language, 'serviceCucina')}</option>
                        <option value="aperitivo">{txt(language, 'serviceAperitivo')}</option>
                      </select>
                    </label>
                  ) : null}
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
                  <button type="button" onClick={saveCategory} disabled={saveCategoryStatus === 'saving'} className="admin-primary-button w-full justify-center sm:w-auto">
                    <Save className="h-4 w-4" />
                    {saveCategoryStatus === 'saving' ? 'Salvataggio...' : txt(language, 'save')}
                  </button>
                  {saveCategoryStatus === 'saved' && <p className="text-xs text-green-400">Salvato su Supabase</p>}
                  {saveCategoryStatus === 'error' && <p className="text-xs text-red-400">Errore salvataggio Supabase — verifica connessione</p>}
                </div>
              </div>

              <div className="space-y-2">
                {restaurantCategories.map((category) => (
                  <div key={category.id} className="rounded-[1.35rem] border border-white/10 bg-taupe/70 p-2.5 sm:rounded-2xl sm:p-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="font-display text-lg">{category.name[language]}</h4>
                        <p className="mt-0.5 text-xs text-muted">
                          {restaurantDishes.filter((dish) => dish.categoryId === category.id).length} piatti
                          {restaurant.id === 'locanda22' ? (
                            <span className="ml-2 rounded-full bg-white/8 px-2 py-0.5 text-[0.65rem] font-semibold uppercase">
                              {category.serviceType === 'aperitivo' ? txt(language, 'serviceAperitivo') : txt(language, 'serviceCucina')}
                            </span>
                          ) : null}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${category.active ? 'bg-gold text-ink' : 'bg-white/10 text-muted'}`}>
                        {category.active ? txt(language, 'active') : txt(language, 'inactive')}
                      </span>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-1.5">
                      <button type="button" onClick={() => setCategoryDraft(category)} className="admin-compact-button">
                        Modifica
                      </button>
                      <button type="button" onClick={() => toggleCategory(category)} className="admin-compact-button">
                        <Power className="h-3 w-3" />
                        {category.active ? txt(language, 'inactive') : txt(language, 'active')}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteCategory(category)}
                        className="admin-compact-button text-red-400 hover:border-red-400/40 hover:bg-red-400/10 hover:text-red-300"
                      >
                        <Trash2 className="h-3 w-3" />
                        Elimina
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {dataReady && tab === 'qr' ? (
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
