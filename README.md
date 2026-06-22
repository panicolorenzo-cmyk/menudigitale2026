# Menu Digitale 2026

Web app professionale React + TypeScript + Vite + Tailwind CSS per Locanda 22 e Adelardi, PWA installabile e pronta per Supabase.

## Avvio

```bash
npm install
cp .env.example .env
npm run dev
```

## Build

```bash
npm run build
```

## Supabase

Creare tabelle coerenti con i tipi in `src/lib/supabase.ts`: `venues`, `categories`, `products`. Se le variabili Supabase non sono configurate, l'app usa dati demo locali.

## Admin

PIN configurabile con `VITE_ADMIN_PIN` (default demo: `2222`). Non è presente nessuna funzione per eliminare locali: i locali possono essere creati, modificati e disattivati.
