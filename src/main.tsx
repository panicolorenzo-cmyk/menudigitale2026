import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

import { badgeLabels, categories as seedCategories, formatPrice, languages, products as seedProducts, supabase, venues as seedVenues } from './lib';
import type { Badge, Category, Language, Product, Venue } from './types';
import './styles.css';

function App() {
  const [lang, setLang] = useState<Language>('it');
  const [venues, setVenues] = useState(seedVenues);
  const [categories, setCategories] = useState(seedCategories);
  const [products, setProducts] = useState(seedProducts);
  const [venueId, setVenueId] = useState(seedVenues[0].id);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [admin, setAdmin] = useState(false);
  const venue = venues.find((v) => v.id === venueId) ?? venues[0];
  const visibleCategories = categories.filter((c) => c.venueId === venue.id && c.active).sort((a, b) => a.order - b.order);
  const visibleProducts = products.filter((p) => p.venueId === venue.id && p.active && (category === 'all' || p.categoryId === category) && (p.name[lang] + p.description[lang]).toLowerCase().includes(query.toLowerCase()));

  return <main className="min-h-screen bg-ink text-ivory">
    <Hero venue={venue} lang={lang} setLang={setLang} venues={venues.filter(v => v.active)} setVenueId={setVenueId} openAdmin={() => setAdmin(true)} />
    <section className="mx-auto max-w-6xl px-4 pb-24 pt-8">
      <div className="sticky top-0 z-20 -mx-4 border-y border-gold/10 bg-ink/85 px-4 py-4 backdrop-blur-xl">
        <label className="flex items-center gap-3 rounded-full border border-taupe/30 bg-white/5 px-4 py-3 shadow-lux"><span>⌕</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Cerca prodotti" className="w-full bg-transparent text-sm outline-none placeholder:text-taupe"/></label>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1"><Filter active={category==='all'} onClick={()=>setCategory('all')}>Tutto</Filter>{visibleCategories.map(c=><Filter key={c.id} active={category===c.id} onClick={()=>setCategory(c.id)}>{c.name[lang]}</Filter>)}</div>
      </div>
      <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{visibleProducts.map(p => <ProductCard key={p.id} product={p} lang={lang} />)}</div>
    </section>
    {admin && <Admin venues={venues} categories={categories} products={products} setVenues={setVenues} setCategories={setCategories} setProducts={setProducts} close={()=>setAdmin(false)} />}
  </main>;
}

function Hero({ venue, lang, setLang, venues, setVenueId, openAdmin }: { venue: Venue; lang: Language; setLang: (l: Language)=>void; venues: Venue[]; setVenueId: (id:string)=>void; openAdmin: ()=>void }) {
  return <header className="relative flex min-h-[92vh] flex-col justify-between overflow-hidden p-5"><img src={venue.heroImage} className="absolute inset-0 h-full w-full object-cover"/><div className="absolute inset-0 bg-gradient-to-b from-black/35 via-ink/25 to-ink"/><div className="relative z-10 flex items-start justify-between gap-4"><div className="flex gap-2">{languages.map(l=><button key={l.code} onClick={()=>setLang(l.code)} className={`rounded-full border px-3 py-2 text-xs backdrop-blur ${lang===l.code?'border-gold bg-gold/20':'border-white/25 bg-black/20'}`}>{l.code.toUpperCase()}</button>)}</div><button onClick={openAdmin} className="rounded-full border border-white/20 bg-black/20 p-3 backdrop-blur"><span>⚙</span></button></div><div className="relative z-10 mx-auto max-w-3xl text-center"><div className="mx-auto mb-6 grid h-28 w-28 place-items-center rounded-full border border-gold/60 bg-ink/70 font-serif text-4xl text-gold shadow-lux backdrop-blur">{venue.logo}</div><p className="mb-3 text-xs uppercase tracking-[0.45em] text-gold">Menu digitale premium</p><h1 className="font-serif text-5xl italic md:text-7xl">{venue.name}</h1><p className="mx-auto mt-5 max-w-xl text-balance text-taupe-light">Esperienza mobile first, multilingua e installabile, pensata per consultare il menu con eleganza e rapidità.</p><div className="mt-8 flex justify-center gap-3">{venues.map(v=><button key={v.id} onClick={()=>setVenueId(v.id)} className={`rounded-full px-5 py-3 text-sm ${v.id===venue.id?'bg-gold text-ink':'border border-white/20 bg-white/10'}`}>{v.name}</button>)}</div></div><div className="relative z-10 text-center text-xs uppercase tracking-[0.35em] text-white/60">Scorri il menu</div></header>;
}
function Filter(p: React.PropsWithChildren<{active:boolean; onClick:()=>void}>) { return <button onClick={p.onClick} className={`shrink-0 rounded-full px-4 py-2 text-sm ${p.active?'bg-gold text-ink':'border border-taupe/30 bg-white/5 text-taupe-light'}`}>{p.children}</button>; }
function ProductCard({ product, lang }: { product: Product; lang: Language }) { return <article className="overflow-hidden rounded-[2rem] border border-gold/10 bg-stone shadow-lux"><img src={product.image} className="h-60 w-full object-cover"/><div className="p-5"><div className="mb-3 flex flex-wrap gap-2">{product.badges.map(b=><span key={b} className="rounded-full bg-gold/15 px-3 py-1 text-[11px] uppercase tracking-wider text-gold">{badgeLabels[b][lang]}</span>)}</div><div className="flex items-start justify-between gap-4"><h3 className="font-serif text-2xl">{product.name[lang]}</h3><strong className="text-gold">{formatPrice(product.price)}</strong></div><p className="mt-3 text-sm leading-6 text-taupe-light">{product.description[lang]}</p></div></article>; }

function Admin({ venues, categories, products, setVenues, setCategories, setProducts, close }: { venues: Venue[]; categories: Category[]; products: Product[]; setVenues: (v: Venue[])=>void; setCategories: (c: Category[])=>void; setProducts: (p: Product[])=>void; close:()=>void }) {
  const [pin, setPin] = useState(''); const [ok, setOk] = useState(false); const [qr, setQr] = useState<Record<string,string>>({});
  const adminPin = import.meta.env.VITE_ADMIN_PIN || '2222';
  const makeQr = (v: Venue) => setQr({...qr, [v.id]: `${location.origin}/?locale=${v.slug}`});
  if (!ok) return <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4 backdrop-blur"><form onSubmit={e=>{e.preventDefault(); if(pin===adminPin)setOk(true)}} className="w-full max-w-sm rounded-[2rem] border border-gold/20 bg-ink p-8 shadow-lux"><div className="mb-4 text-3xl text-gold">🔒</div><h2 className="font-serif text-3xl">Area Admin</h2><input value={pin} onChange={e=>setPin(e.target.value)} className="mt-6 w-full rounded-2xl border border-taupe/30 bg-white/5 p-4 outline-none" placeholder="PIN" type="password"/><button className="mt-4 w-full rounded-2xl bg-gold p-4 font-bold text-ink">Accedi</button><button type="button" onClick={close} className="mt-4 w-full text-taupe">Chiudi</button></form></div>;
  return <div className="fixed inset-0 z-50 overflow-y-auto bg-ink p-4"><div className="mx-auto max-w-6xl"><div className="mb-6 flex items-center justify-between"><h2 className="font-serif text-4xl">Console admin</h2><button onClick={close} className="rounded-full border border-white/20 px-4 py-2">Chiudi</button></div><p className="mb-6 text-taupe">Supabase: {supabase ? 'configurato' : 'modalità demo locale'}. I locali si creano, modificano e disattivano: nessuna eliminazione locale.</p><section className="grid gap-4 lg:grid-cols-2">{venues.map(v=><div key={v.id} className="rounded-[2rem] border border-gold/10 bg-stone p-5"><input value={v.name} onChange={e=>setVenues(venues.map(x=>x.id===v.id?{...x,name:e.target.value}:x))} className="w-full bg-transparent font-serif text-2xl outline-none"/><input value={v.heroImage} onChange={e=>setVenues(venues.map(x=>x.id===v.id?{...x,heroImage:e.target.value}:x))} className="mt-3 w-full rounded-xl bg-white/5 p-3 text-sm outline-none"/><button onClick={()=>setVenues(venues.map(x=>x.id===v.id?{...x,active:!x.active}:x))} className="mt-3 mr-2 rounded-full bg-white/10 px-4 py-2">{v.active?'Visibile':'Nascosto'}</button><button onClick={()=>makeQr(v)} className="mt-3 rounded-full bg-gold px-4 py-2 text-ink">▦ QR</button>{qr[v.id] && <div className="mt-4 grid h-32 w-32 place-items-center rounded-xl bg-white p-2 text-center text-[10px] text-ink">QR<br/>{qr[v.id]}</div>}</div>)}</section><AdminLists categories={categories} products={products} setCategories={setCategories} setProducts={setProducts}/></div></div>;
}
function AdminLists({ categories, products, setCategories, setProducts }: { categories: Category[]; products: Product[]; setCategories:(c:Category[])=>void; setProducts:(p:Product[])=>void }) {
  const addCategory=()=>setCategories([...categories,{id:crypto.randomUUID(),venueId:'locanda-22',name:{it:'Nuova categoria',en:'New category',fr:'Nouvelle catégorie',de:'Neue Kategorie',es:'Nueva categoría'},order:99,active:true}]);
  const addProduct=()=>setProducts([...products,{id:crypto.randomUUID(),venueId:'locanda-22',categoryId:categories[0]?.id||'',name:{it:'Nuovo piatto',en:'New dish',fr:'Nouveau plat',de:'Neues Gericht',es:'Nuevo plato'},description:{it:'Descrizione',en:'Description',fr:'Description',de:'Beschreibung',es:'Descripción'},price:10,image:'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80',badges:['recommended'] as Badge[],active:true}]);
  return <section className="mt-6 grid gap-4 lg:grid-cols-2"><div className="rounded-[2rem] border border-gold/10 bg-stone p-5"><button onClick={addCategory} className="mb-4 rounded-full bg-gold px-4 py-2 text-ink">＋ Categoria</button>{categories.map(c=><input key={c.id} value={c.name.it} onChange={e=>setCategories(categories.map(x=>x.id===c.id?{...x,name:{...x.name,it:e.target.value}}:x))} className="mb-2 w-full rounded-xl bg-white/5 p-3 outline-none"/>)}</div><div className="rounded-[2rem] border border-gold/10 bg-stone p-5"><button onClick={addProduct} className="mb-4 rounded-full bg-gold px-4 py-2 text-ink">▧ Prodotto</button>{products.map(p=><div key={p.id} className="mb-3 grid grid-cols-[1fr_90px_45px] gap-2"><input value={p.name.it} onChange={e=>setProducts(products.map(x=>x.id===p.id?{...x,name:{...x.name,it:e.target.value}}:x))} className="rounded-xl bg-white/5 p-3 outline-none"/><input type="number" value={p.price} onChange={e=>setProducts(products.map(x=>x.id===p.id?{...x,price:Number(e.target.value)}:x))} className="rounded-xl bg-white/5 p-3 outline-none"/><button onClick={()=>setProducts(products.map(x=>x.id===p.id?{...x,active:!x.active}:x))} className="rounded-xl bg-white/10">{p.active?'●':'○'}</button></div>)}</div></section>;
}

createRoot(document.getElementById('root')!).render(<App />);

if ('serviceWorker' in navigator) { window.addEventListener('load', () => navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`)); }
