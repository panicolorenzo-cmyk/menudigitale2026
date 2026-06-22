import type { Badge, Category, Language, Product, Venue } from './types';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = url && key ? { url, key, mode: 'rest-ready' as const } : null;

const t = (it: string, en: string, fr: string, de: string, es: string): Record<Language, string> => ({ it, en, fr, de, es });

export const languages: Array<{ code: Language; label: string }> = [
  { code: 'it', label: 'Italiano' }, { code: 'en', label: 'English' }, { code: 'fr', label: 'Français' }, { code: 'de', label: 'Deutsch' }, { code: 'es', label: 'Español' },
];

export const badgeLabels: Record<Badge, Record<Language, string>> = {
  recommended: t('Consigliato', 'Recommended', 'Recommandé', 'Empfohlen', 'Recomendado'),
  vegetarian: t('Vegetariano', 'Vegetarian', 'Végétarien', 'Vegetarisch', 'Vegetariano'),
  glutenFree: t('Gluten Free', 'Gluten Free', 'Sans gluten', 'Glutenfrei', 'Sin gluten'),
  spicy: t('Piccante', 'Spicy', 'Épicé', 'Scharf', 'Picante'),
};

export const venues: Venue[] = [
  { id: 'locanda-22', name: 'Locanda 22', slug: 'locanda-22', logo: 'L22', heroImage: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1600&q=85', active: true },
  { id: 'adelardi', name: 'Adelardi', slug: 'adelardi', logo: 'A', heroImage: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1600&q=85', active: true },
];

export const categories: Category[] = [
  { id: 'antipasti-l22', venueId: 'locanda-22', name: t('Antipasti', 'Starters', 'Entrées', 'Vorspeisen', 'Entrantes'), order: 1, active: true },
  { id: 'primi-l22', venueId: 'locanda-22', name: t('Primi', 'Pasta & Risotto', 'Pâtes & Risotto', 'Pasta & Risotto', 'Pasta y Risotto'), order: 2, active: true },
  { id: 'secondi-l22', venueId: 'locanda-22', name: t('Secondi', 'Mains', 'Plats', 'Hauptgerichte', 'Principales'), order: 3, active: true },
  { id: 'signature-ade', venueId: 'adelardi', name: t('Signature', 'Signature', 'Signature', 'Signature', 'Signature'), order: 1, active: true },
  { id: 'mare-ade', venueId: 'adelardi', name: t('Mare', 'Sea', 'Mer', 'Meer', 'Mar'), order: 2, active: true },
  { id: 'dolci-ade', venueId: 'adelardi', name: t('Dolci', 'Desserts', 'Desserts', 'Desserts', 'Postres'), order: 3, active: true },
];

export const products: Product[] = [
  { id: 'p1', venueId: 'locanda-22', categoryId: 'antipasti-l22', name: t('Battuta di Fassona', 'Fassona tartare', 'Tartare de Fassona', 'Fassona-Tatar', 'Tartar de Fassona'), description: t('Nocciole, senape antica e croccante al Parmigiano.', 'Hazelnuts, old mustard and Parmigiano crisp.', 'Noisettes, moutarde ancienne et tuile au Parmigiano.', 'Haselnüsse, alte Senfsaat und Parmigiano-Chip.', 'Avellanas, mostaza antigua y crujiente de Parmigiano.'), price: 18, image: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=900&q=80', badges: ['recommended', 'glutenFree'], active: true },
  { id: 'p2', venueId: 'locanda-22', categoryId: 'primi-l22', name: t('Risotto oro e zafferano', 'Gold saffron risotto', 'Risotto or et safran', 'Gold-Safran-Risotto', 'Risotto oro y azafrán'), description: t('Riserva Carnaroli, midollo vegetale, riduzione al Franciacorta.', 'Carnaroli reserve, vegetal marrow, Franciacorta reduction.', 'Carnaroli réserve, moelle végétale, réduction de Franciacorta.', 'Carnaroli Riserva, Gemüsemark, Franciacorta-Reduktion.', 'Carnaroli reserva, tuétano vegetal, reducción de Franciacorta.'), price: 22, image: 'https://images.unsplash.com/photo-1633964913295-ceb43826e7c7?auto=format&fit=crop&w=900&q=80', badges: ['vegetarian', 'recommended'], active: true },
  { id: 'p3', venueId: 'locanda-22', categoryId: 'secondi-l22', name: t('Guancia brasata', 'Braised beef cheek', 'Joue braisée', 'Geschmorte Backe', 'Carrillera braseada'), description: t('Purea affumicata, fondo bruno e radici glassate.', 'Smoked purée, jus and glazed roots.', 'Purée fumée, jus brun et racines glacées.', 'Rauchpüree, Jus und glasierte Wurzeln.', 'Puré ahumado, jugo y raíces glaseadas.'), price: 27, image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80', badges: ['glutenFree'], active: true },
  { id: 'p4', venueId: 'adelardi', categoryId: 'signature-ade', name: t('Uovo Adelardi', 'Adelardi egg', 'Œuf Adelardi', 'Adelardi Ei', 'Huevo Adelardi'), description: t('Crema di patate, tartufo nero e spuma al burro nocciola.', 'Potato cream, black truffle and brown butter foam.', 'Crème de pomme de terre, truffe noire et mousse beurre noisette.', 'Kartoffelcreme, schwarzer Trüffel und Nussbutterschaum.', 'Crema de patata, trufa negra y espuma de mantequilla avellana.'), price: 19, image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=900&q=80', badges: ['recommended', 'vegetarian'], active: true },
  { id: 'p5', venueId: 'adelardi', categoryId: 'mare-ade', name: t('Rombo, agrumi e finocchio', 'Turbot, citrus and fennel', 'Turbot, agrumes et fenouil', 'Steinbutt, Zitrus und Fenchel', 'Rodaballo, cítricos e hinojo'), description: t('Cottura delicata, salsa champagne e olio all’aneto.', 'Gentle cooking, champagne sauce and dill oil.', 'Cuisson douce, sauce champagne et huile d’aneth.', 'Sanft gegart, Champagnersauce und Dillöl.', 'Cocción suave, salsa champagne y aceite de eneldo.'), price: 31, image: 'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=900&q=80', badges: ['glutenFree'], active: true },
  { id: 'p6', venueId: 'adelardi', categoryId: 'dolci-ade', name: t('Cioccolato e peperoncino', 'Chocolate and chili', 'Chocolat et piment', 'Schokolade und Chili', 'Chocolate y chile'), description: t('Fondente 72%, sale Maldon, gelato alla vaniglia.', '72% dark chocolate, Maldon salt, vanilla gelato.', 'Chocolat noir 72%, sel Maldon, glace vanille.', '72% Zartbitter, Maldon-Salz, Vanillegelato.', 'Chocolate 72%, sal Maldon, helado de vainilla.'), price: 12, image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=900&q=80', badges: ['spicy', 'vegetarian'], active: true },
];

export const formatPrice = (price: number) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(price);
