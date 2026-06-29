import type { Category, Dish, MenuState, Restaurant, TranslatedText } from '../types';

const t = (it: string, en: string, fr: string, de: string, es: string, ru?: string): TranslatedText => ({
  it,
  en,
  fr,
  de,
  es,
  ru: ru ?? en
});

export const demoRestaurants: Restaurant[] = [
  {
    id: 'locanda22',
    slug: 'locanda-22',
    name: 'Locanda 22',
    subtitle: t(
      'Cucina italiana contemporanea, cantina curata e servizio caldo.',
      'Contemporary Italian cuisine, curated cellar and warm service.',
      'Cuisine italienne contemporaine, cave soignée et service chaleureux.',
      'Zeitgenössische italienische Küche, kuratierter Keller und warmer Service.',
      'Cocina italiana contemporánea, bodega cuidada y servicio cálido.'
    ),
    address: 'Via del Gusto 22, Centro Storico',
    phone: '+39 000 222 222',
    heroImage: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c?auto=format&fit=crop&w=1800&q=86',
    accent: '#c5a46a',
    logoImage: '/images/locanda22-original-cream.png'
  },
  {
    id: 'adelardi',
    slug: 'adelardi',
    name: 'Adelardi',
    subtitle: t(
      'Materia prima essenziale, brace elegante e cocktail da aperitivo.',
      'Pure ingredients, elegant grill and aperitivo cocktails.',
      'Produits essentiels, grill élégant et cocktails d’apéritif.',
      'Klare Zutaten, eleganter Grill und Aperitivo-Cocktails.',
      'Producto esencial, brasa elegante y cócteles de aperitivo.'
    ),
    address: 'Piazza Adelardi 8, Borgo',
    phone: '+39 000 888 888',
    heroImage: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1800&q=86',
    accent: '#d0aa62'
  }
];

export const demoCategories: Category[] = [
  // Locanda 22 – Ristorante / Cucina
  { id: 'l22-antipasti',      restaurantId: 'locanda22', serviceType: 'cucina', name: t('ANTIPASTI', 'Starters', 'Entrées', 'Vorspeisen', 'Entrantes'), active: true, sortOrder: 10 },
  { id: 'l22-primi',          restaurantId: 'locanda22', serviceType: 'cucina', name: t('PRIMI PIATTI', 'Pasta & Risotto', 'Pâtes et risotto', 'Pasta und Risotto', 'Pastas y risotto'), active: true, sortOrder: 20 },
  { id: 'l22-secondi',        restaurantId: 'locanda22', serviceType: 'cucina', name: t('SECONDI', 'Mains', 'Plats', 'Hauptgerichte', 'Principales'), active: true, sortOrder: 30 },
  { id: 'l22-contorni',       restaurantId: 'locanda22', serviceType: 'cucina', name: t('CONTORNI', 'Sides', 'Accompagnements', 'Beilagen', 'Guarniciones'), active: true, sortOrder: 40 },
  { id: 'l22-pizze',          restaurantId: 'locanda22', serviceType: 'cucina', name: t('PIZZE', 'Pizzas', 'Pizzas', 'Pizzen', 'Pizzas'), active: true, sortOrder: 50 },
  { id: 'l22-pizze-speciali', restaurantId: 'locanda22', serviceType: 'cucina', name: t('PIZZE SPECIALI', 'Special pizzas', 'Pizzas spéciales', 'Spezialitätenpizzen', 'Pizzas especiales'), active: true, sortOrder: 60 },
  { id: 'l22-hamburger',      restaurantId: 'locanda22', serviceType: 'cucina', name: t('HAMBURGER', 'Burgers', 'Hamburgers', 'Burger', 'Hamburguesas'), active: true, sortOrder: 70 },
  { id: 'l22-birre',          restaurantId: 'locanda22', serviceType: 'cucina', name: t('BIRRE ALLA SPINA', 'Draft beers', 'Bières pression', 'Fassbier', 'Cervezas de barril'), active: true, sortOrder: 80 },
  { id: 'l22-bibite',         restaurantId: 'locanda22', serviceType: 'cucina', name: t('BIBITE', 'Soft drinks', 'Boissons', 'Getränke', 'Bebidas'), active: true, sortOrder: 90 },
  { id: 'l22-vini-rossi',     restaurantId: 'locanda22', serviceType: 'cucina', name: t('CARTA VINI ROSSI', 'Red wine list', 'Carte des vins rouges', 'Rotweinkarte', 'Carta vinos tintos'), active: true, sortOrder: 100 },
  { id: 'l22-vini-bianchi',   restaurantId: 'locanda22', serviceType: 'cucina', name: t('CARTA VINI BIANCHI', 'White wine list', 'Carte des vins blancs', 'Weißweinkarte', 'Carta vinos blancos'), active: true, sortOrder: 110 },
  { id: 'l22-vini-spumanti',  restaurantId: 'locanda22', serviceType: 'cucina', name: t('VINI SPUMANTI', 'Sparkling wines', 'Vins pétillants', 'Schaumweine', 'Vinos espumosos'), active: true, sortOrder: 120 },
  { id: 'l22-vini-dessert',   restaurantId: 'locanda22', serviceType: 'cucina', name: t('VINI DA DESSERT', 'Dessert wines', 'Vins de dessert', 'Dessertweine', 'Vinos de postre'), active: true, sortOrder: 130 },
  { id: 'l22-amari',          restaurantId: 'locanda22', serviceType: 'cucina', name: t('AMARI E CAFFETTERIA', 'Digestifs & coffee', 'Digestifs et café', 'Digestifs und Kaffee', 'Digestivos y cafetería'), active: true, sortOrder: 140 },
  { id: 'l22-dolci',          restaurantId: 'locanda22', serviceType: 'cucina', name: t('DOLCI', 'Desserts', 'Desserts', 'Desserts', 'Postres'), active: true, sortOrder: 150 },
  // Adelardi
  { id: 'ad-crudi', restaurantId: 'adelardi', serviceType: 'cucina', name: t('Crudi e piccoli piatti', 'Raw bar & small plates', 'Crus et petites assiettes', 'Rohbar und kleine Teller', 'Crudos y platillos'), active: true, sortOrder: 10 },
  { id: 'ad-brace', restaurantId: 'adelardi', serviceType: 'cucina', name: t('Dalla brace', 'From the grill', 'Au grill', 'Vom Grill', 'De la brasa'), active: true, sortOrder: 20 },
  { id: 'ad-pasta', restaurantId: 'adelardi', serviceType: 'cucina', name: t('Pasta e stagione', 'Pasta & season', 'Pâtes et saison', 'Pasta und Saison', 'Pasta y temporada'), active: true, sortOrder: 30 },
  { id: 'ad-drink', restaurantId: 'adelardi', serviceType: 'cucina', name: t('Cocktail e dessert', 'Cocktails & desserts', 'Cocktails et desserts', 'Cocktails und Desserts', 'Cócteles y postres'), active: true, sortOrder: 40 }
];

export const demoDishes: Dish[] = [
  {
    id: 'l22-veal',
    restaurantId: 'locanda22',
    categoryId: 'l22-antipasti',
    name: t('Battuta di vitello, nocciola e tartufo', 'Veal tartare, hazelnut and truffle', 'Tartare de veau, noisette et truffe', 'Kalbstatar, Haselnuss und Trüffel', 'Tartar de ternera, avellana y trufa'),
    description: t(
      'Taglio fresco al coltello, crema di nocciola tostata, olio al tartufo nero.',
      'Hand-cut fresh veal, toasted hazelnut cream and black truffle oil.',
      'Veau frais coupé au couteau, crème de noisette torréfiée et huile de truffe noire.',
      'Frisch geschnittenes Kalb, geröstete Haselnusscreme und schwarzes Trüffelöl.',
      'Ternera fresca cortada a cuchillo, crema de avellana tostada y aceite de trufa negra.'
    ),
    allergens: ['nuts'],
    price: 18,
    image: 'https://images.unsplash.com/photo-1625944230945-1b7dd3b949ab?auto=format&fit=crop&w=1100&q=84',
    active: true,
    featured: true
  },
  {
    id: 'l22-caprese',
    restaurantId: 'locanda22',
    categoryId: 'l22-antipasti',
    name: t('Burrata, pomodoro confit e basilico', 'Burrata, confit tomato and basil', 'Burrata, tomate confite et basilic', 'Burrata, confierte Tomate und Basilikum', 'Burrata, tomate confitado y albahaca'),
    description: t(
      'Burrata pugliese, pomodori cotti lentamente, basilico fresco e pane croccante.',
      'Puglian burrata, slow-cooked tomatoes, fresh basil and crisp bread.',
      'Burrata des Pouilles, tomates confites, basilic frais et pain croustillant.',
      'Burrata aus Apulien, langsam gegarte Tomaten, frisches Basilikum und knuspriges Brot.',
      'Burrata pugliese, tomates confitados, albahaca fresca y pan crujiente.'
    ),
    allergens: ['milk', 'gluten'],
    price: 15,
    image: 'https://images.unsplash.com/photo-1559561853-08451507cbe7?auto=format&fit=crop&w=1100&q=84',
    active: true
  },
  {
    id: 'l22-risotto',
    restaurantId: 'locanda22',
    categoryId: 'l22-primi',
    name: t('Risotto allo zafferano e midollo', 'Saffron risotto with bone marrow', 'Risotto au safran et moelle', 'Safranrisotto mit Mark', 'Risotto de azafrán y tuétano'),
    description: t(
      'Riso Carnaroli mantecato, zafferano, fondo bruno e midollo arrostito.',
      'Creamed Carnaroli rice, saffron, brown jus and roasted bone marrow.',
      'Riz Carnaroli crémeux, safran, jus brun et moelle rôtie.',
      'Cremiger Carnaroli-Reis, Safran, Jus und geröstetes Mark.',
      'Arroz Carnaroli mantecoso, azafrán, jugo oscuro y tuétano asado.'
    ),
    allergens: ['milk', 'celery'],
    price: 20,
    image: 'https://images.unsplash.com/photo-1633964913295-ceb43826e7c8?auto=format&fit=crop&w=1100&q=84',
    active: true,
    featured: true
  },
  {
    id: 'l22-tortelli',
    restaurantId: 'locanda22',
    categoryId: 'l22-primi',
    name: t('Tortelli di ricotta, limone e maggiorana', 'Ricotta tortelli, lemon and marjoram', 'Tortelli ricotta, citron et marjolaine', 'Ricotta-Tortelli, Zitrone und Majoran', 'Tortelli de ricotta, limón y mejorana'),
    description: t(
      'Pasta fresca ripiena, burro montato al limone e foglie di maggiorana.',
      'Fresh filled pasta, lemon whipped butter and marjoram leaves.',
      'Pâtes fraîches farcies, beurre fouetté au citron et marjolaine.',
      'Frische gefüllte Pasta, Zitronenbutter und Majoran.',
      'Pasta fresca rellena, mantequilla de limón y mejorana.'
    ),
    allergens: ['gluten', 'eggs', 'milk'],
    price: 17,
    image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=1100&q=84',
    active: true
  },
  {
    id: 'l22-duck',
    restaurantId: 'locanda22',
    categoryId: 'l22-secondi',
    name: t('Anatra laccata, prugna e radicchio', 'Glazed duck, plum and radicchio', 'Canard laqué, prune et radicchio', 'Lackierte Ente, Pflaume und Radicchio', 'Pato lacado, ciruela y radicchio'),
    description: t(
      'Petto rosato, salsa alla prugna, radicchio tardivo alla brace.',
      'Pink duck breast, plum sauce and grilled late radicchio.',
      'Magret rosé, sauce prune et radicchio tardif grillé.',
      'Rosa Entenbrust, Pflaumensauce und gegrillter Radicchio.',
      'Pechuga rosada, salsa de ciruela y radicchio a la brasa.'
    ),
    allergens: ['sulfites'],
    price: 26,
    image: 'https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?auto=format&fit=crop&w=1100&q=84',
    active: true
  },
  {
    id: 'l22-tiramisu',
    restaurantId: 'locanda22',
    categoryId: 'l22-dolci',
    name: t('Tiramisù espresso 22', 'Espresso tiramisu 22', 'Tiramisù espresso 22', 'Espresso-Tiramisu 22', 'Tiramisú espresso 22'),
    description: t(
      'Crema al mascarpone, savoiardo al caffè e cacao amaro.',
      'Mascarpone cream, coffee ladyfinger and bitter cocoa.',
      'Crème mascarpone, biscuit au café et cacao amer.',
      'Mascarponecreme, Kaffee-Biskuit und herber Kakao.',
      'Crema de mascarpone, bizcocho al café y cacao amargo.'
    ),
    allergens: ['gluten', 'eggs', 'milk'],
    price: 9,
    image: 'https://images.unsplash.com/photo-1631206753348-db44968fd440?auto=format&fit=crop&w=1100&q=84',
    active: true
  },
  {
    id: 'ad-oyster',
    restaurantId: 'adelardi',
    categoryId: 'ad-crudi',
    name: t('Ostriche, mela verde e gin', 'Oysters, green apple and gin', 'Huîtres, pomme verte et gin', 'Austern, grüner Apfel und Gin', 'Ostras, manzana verde y gin'),
    description: t(
      'Ostriche selezionate con vinaigrette di mela verde, lime e gin dry.',
      'Selected oysters with green apple, lime and dry gin vinaigrette.',
      'Huîtres sélectionnées, vinaigrette pomme verte, citron vert et gin dry.',
      'Ausgewählte Austern mit grünem Apfel, Limette und Dry-Gin-Vinaigrette.',
      'Ostras seleccionadas con vinagreta de manzana verde, lima y gin dry.'
    ),
    allergens: ['molluscs', 'sulfites'],
    price: 24,
    image: 'https://images.unsplash.com/photo-1604259597308-532ffbdd536b?auto=format&fit=crop&w=1100&q=84',
    active: true,
    featured: true
  },
  {
    id: 'ad-tuna',
    restaurantId: 'adelardi',
    categoryId: 'ad-crudi',
    name: t('Tonno rosso, sesamo e ponzu', 'Bluefin tuna, sesame and ponzu', 'Thon rouge, sésame et ponzu', 'Blauflossen-Thunfisch, Sesam und Ponzu', 'Atún rojo, sésamo y ponzu'),
    description: t(
      'Fette sottili di tonno, salsa ponzu agrumata, olio al sesamo.',
      'Thin slices of tuna, citrus ponzu sauce and sesame oil.',
      'Fines tranches de thon, sauce ponzu aux agrumes et huile de sésame.',
      'Dünne Thunfischscheiben, Zitrus-Ponzu und Sesamöl.',
      'Láminas finas de atún, salsa ponzu cítrica y aceite de sésamo.'
    ),
    allergens: ['fish', 'sesame', 'soy'],
    price: 21,
    image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?auto=format&fit=crop&w=1100&q=84',
    active: true
  },
  {
    id: 'ad-steak',
    restaurantId: 'adelardi',
    categoryId: 'ad-brace',
    name: t('Costata dry aged, sale affumicato', 'Dry-aged rib steak, smoked salt', 'Côte dry aged, sel fumé', 'Dry-aged Rib Steak, Rauchsalz', 'Chuletón dry aged, sal ahumada'),
    description: t(
      'Carne frollata 35 giorni, brace viva, sale affumicato e jus ristretto.',
      '35-day dry-aged beef, live fire, smoked salt and reduced jus.',
      'Boeuf affiné 35 jours, braise vive, sel fumé et jus réduit.',
      '35 Tage gereiftes Rind, offenes Feuer, Rauchsalz und reduzierter Jus.',
      'Carne madurada 35 días, brasa viva, sal ahumada y jugo reducido.'
    ),
    allergens: ['celery'],
    price: 34,
    image: 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=1100&q=84',
    active: true,
    featured: true
  },
  {
    id: 'ad-cauliflower',
    restaurantId: 'adelardi',
    categoryId: 'ad-brace',
    name: t('Cavolfiore alla brace e salsa tahina', 'Grilled cauliflower with tahini sauce', 'Chou-fleur grillé sauce tahini', 'Gegrillter Blumenkohl mit Tahini', 'Coliflor a la brasa con tahini'),
    description: t(
      'Cavolfiore dorato, salsa tahina al limone, erbe fresche e mandorla.',
      'Golden cauliflower, lemon tahini sauce, fresh herbs and almond.',
      'Chou-fleur doré, tahini citronné, herbes fraîches et amande.',
      'Goldener Blumenkohl, Zitronen-Tahini, frische Kräuter und Mandel.',
      'Coliflor dorada, tahini al limón, hierbas frescas y almendra.'
    ),
    allergens: ['sesame', 'nuts'],
    price: 16,
    image: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&w=1100&q=84',
    active: true
  },
  {
    id: 'ad-ravioli',
    restaurantId: 'adelardi',
    categoryId: 'ad-pasta',
    name: t('Ravioli di zucca, salvia e amaretto', 'Pumpkin ravioli, sage and amaretti', 'Ravioli potiron, sauge et amaretti', 'Kürbisravioli, Salbei und Amaretti', 'Ravioli de calabaza, salvia y amaretti'),
    description: t(
      'Pasta all’uovo, ripieno di zucca, burro alla salvia e crumble amaretto.',
      'Egg pasta, pumpkin filling, sage butter and amaretti crumble.',
      'Pâtes aux œufs, farce potiron, beurre de sauge et crumble amaretti.',
      'Eierpasta, Kürbisfüllung, Salbeibutter und Amaretti-Crumble.',
      'Pasta al huevo, relleno de calabaza, mantequilla de salvia y crumble de amaretti.'
    ),
    allergens: ['gluten', 'eggs', 'milk', 'nuts'],
    price: 18,
    image: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=1100&q=84',
    active: true
  },
  {
    id: 'ad-negroni',
    restaurantId: 'adelardi',
    categoryId: 'ad-drink',
    name: t('Negroni Adelardi', 'Adelardi Negroni', 'Negroni Adelardi', 'Negroni Adelardi', 'Negroni Adelardi'),
    description: t(
      'Gin aromatico, bitter, vermouth rosso e scorza d’arancia bruciata.',
      'Aromatic gin, bitter, red vermouth and burnt orange peel.',
      'Gin aromatique, bitter, vermouth rouge et zeste d’orange brûlé.',
      'Aromatischer Gin, Bitter, roter Wermut und geröstete Orangenzeste.',
      'Gin aromático, bitter, vermut rojo y piel de naranja quemada.'
    ),
    allergens: ['sulfites'],
    price: 12,
    image: 'https://images.unsplash.com/photo-1551751299-1b51cab2694c?auto=format&fit=crop&w=1100&q=84',
    active: true
  }
];

export const demoMenu: MenuState = {
  restaurants: demoRestaurants,
  categories: demoCategories,
  dishes: demoDishes,
  updatedAt: '2025-01-01T00:00:00.000Z'
};
