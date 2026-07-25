import { ChangeEvent, FormEvent, useMemo, useRef, useState } from 'react';
import { Bell, CalendarDays, ChevronRight, CirclePlus, Clock3, Home, Package, Pill, Plus, Search, Settings, ShieldCheck, X } from 'lucide-react';

type Tab = 'oggi' | 'farmaci' | 'scorte' | 'storico';
type DoseState = 'Da prendere' | 'Presa' | 'Presa in ritardo' | 'Saltata' | 'In programma';

interface Medicine {
  id: string;
  name: string;
  stock: number;
  dose: number;
  times: string[];
  notes: string;
  threshold: number;
  color: string;
  active: boolean;
}

interface DoseRecord { id: string; medicineId: string; time: string; state: DoseState; takenAt?: string }

const initialMedicines: Medicine[] = [
  { id: 'cardio', name: 'Cardioaspirina', stock: 26, dose: 1, times: ['08:00'], notes: 'Dopo colazione', threshold: 5, color: '#e86f51', active: true },
  { id: 'vitd', name: 'Vitamina D', stock: 8, dose: 1, times: ['13:00'], notes: 'Durante il pasto', threshold: 5, color: '#e8aa43', active: true },
  { id: 'press', name: 'Pressione Plus', stock: 4, dose: 1, times: ['20:00'], notes: 'Dopo cena', threshold: 5, color: '#7d8cc4', active: true },
];

const initialDoses: DoseRecord[] = [
  { id: 'cardio-0800', medicineId: 'cardio', time: '08:00', state: 'Presa', takenAt: '08:05' },
  { id: 'vitd-1300', medicineId: 'vitd', time: '13:00', state: 'Da prendere' },
  { id: 'press-2000', medicineId: 'press', time: '20:00', state: 'In programma' },
];

const statusClass = (state: DoseState) => state === 'Presa' ? 'green' : state === 'Saltata' ? 'red' : state === 'In programma' ? 'gray' : 'orange';

export default function App() {
  const [tab, setTab] = useState<Tab>('oggi');
  const [medicines, setMedicines] = useState(initialMedicines);
  const [doses, setDoses] = useState(initialDoses);
  const [showAdd, setShowAdd] = useState(false);
  const [toast, setToast] = useState('');
  const [search, setSearch] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const taken = doses.filter((dose) => dose.state === 'Presa' || dose.state === 'Presa in ritardo').length;
  const remaining = doses.filter((dose) => dose.state === 'Da prendere' || dose.state === 'In programma').length;
  const medById = (id: string) => medicines.find((medicine) => medicine.id === id)!;

  const markDose = (id: string, state: DoseState) => {
    const dose = doses.find((item) => item.id === id);
    if (!dose || dose.state === 'Presa') return;
    setDoses((items) => items.map((item) => item.id === id ? { ...item, state, takenAt: state === 'Presa' ? new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) : undefined } : item));
    if (state === 'Presa') setMedicines((items) => items.map((item) => item.id === dose.medicineId ? { ...item, stock: Math.max(0, item.stock - item.dose) } : item));
    setToast(state === 'Presa' ? 'Dose registrata correttamente' : state === 'Saltata' ? 'Dose segnata come saltata' : 'Promemoria impostato tra 20 minuti');
    window.setTimeout(() => setToast(''), 2600);
  };

  const addMedicine = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get('name') || '').trim();
    if (!name) return;
    const time = String(data.get('time') || '08:00');
    const medicine: Medicine = { id: crypto.randomUUID(), name, stock: Number(data.get('stock')) || 0, dose: Number(data.get('dose')) || 1, times: [time], notes: String(data.get('notes') || ''), threshold: Number(data.get('threshold')) || 5, color: '#4f8f76', active: true };
    setMedicines((items) => [...items, medicine]);
    setDoses((items) => [...items, { id: `${medicine.id}-${time}`, medicineId: medicine.id, time, state: 'In programma' }]);
    setShowAdd(false); setToast('Farmaco aggiunto alla terapia');
    window.setTimeout(() => setToast(''), 2600);
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark"><Pill size={22} /></span><span>La mia terapia</span></div>
        <nav>
          <NavItem icon={<Home />} label="Oggi" active={tab === 'oggi'} onClick={() => setTab('oggi')} />
          <NavItem icon={<Pill />} label="Farmaci" active={tab === 'farmaci'} onClick={() => setTab('farmaci')} />
          <NavItem icon={<Package />} label="Scorte" active={tab === 'scorte'} onClick={() => setTab('scorte')} badge="1" />
          <NavItem icon={<CalendarDays />} label="Storico" active={tab === 'storico'} onClick={() => setTab('storico')} />
        </nav>
        <div className="sidebar-bottom"><button><Settings /> Impostazioni</button><div className="safety-mini"><ShieldCheck /><p>I tuoi dati restano protetti e privati.</p></div></div>
      </aside>

      <main>
        <header className="topbar">
          <div className="mobile-brand"><span className="brand-mark"><Pill size={19} /></span><b>La mia terapia</b></div>
          <div className="header-actions"><button className="icon-button" aria-label="Cerca" onClick={() => setSearch(search ? '' : ' ')}><Search /></button><button className="icon-button notification" aria-label="Notifiche" onClick={() => setShowNotifications(!showNotifications)}><Bell /><i /></button><div className="avatar">MR</div><div className="profile"><b>Maria Rossi</b><span>Profilo personale</span></div></div>
          {showNotifications && <div className="notification-pop"><b>Notifiche</b><p>La scorta di Pressione Plus è quasi terminata.</p><span>Oggi, 09:12</span></div>}
        </header>

        {tab === 'oggi' && <TodayView doses={doses} medById={medById} taken={taken} remaining={remaining} onMark={markDose} />}
        {tab === 'farmaci' && <MedicinesView medicines={medicines} search={search} setSearch={setSearch} onAdd={() => setShowAdd(true)} onToggle={(id) => setMedicines((ms) => ms.map((m) => m.id === id ? { ...m, active: !m.active } : m))} />}
        {tab === 'scorte' && <StockView medicines={medicines} onAdd={(id) => setMedicines((ms) => ms.map((m) => m.id === id ? { ...m, stock: m.stock + 30 } : m))} />}
        {tab === 'storico' && <HistoryView doses={doses} medById={medById} />}
      </main>

      <nav className="bottom-nav">
        <NavItem icon={<Home />} label="Oggi" active={tab === 'oggi'} onClick={() => setTab('oggi')} />
        <NavItem icon={<Pill />} label="Farmaci" active={tab === 'farmaci'} onClick={() => setTab('farmaci')} />
        <NavItem icon={<Package />} label="Scorte" active={tab === 'scorte'} onClick={() => setTab('scorte')} badge="1" />
        <NavItem icon={<CalendarDays />} label="Storico" active={tab === 'storico'} onClick={() => setTab('storico')} />
      </nav>

      {showAdd && <MedicineModal onClose={() => setShowAdd(false)} onSubmit={addMedicine} fileRef={fileRef} />}
      {toast && <div className="toast"><span>✓</span>{toast}</div>}
    </div>
  );
}

function NavItem({ icon, label, active, onClick, badge }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void; badge?: string }) { return <button className={active ? 'nav-item active' : 'nav-item'} onClick={onClick}>{icon}<span>{label}</span>{badge && <em>{badge}</em>}</button>; }

function TodayView({ doses, medById, taken, remaining, onMark }: { doses: DoseRecord[]; medById: (id: string) => Medicine; taken: number; remaining: number; onMark: (id: string, state: DoseState) => void }) {
  return <div className="content"><section className="welcome"><div><p className="eyebrow">SABATO 25 LUGLIO</p><h1>Buongiorno, Maria <span>👋</span></h1><p>Ecco il programma della tua terapia per oggi.</p></div><div className="date-tile"><b>25</b><span>LUG</span></div></section>
    <section className="stats-grid"><Stat label="Dosi previste" value={doses.length} icon={<Pill />} tone="blue" /><Stat label="Dosi prese" value={taken} icon="✓" tone="green" /><Stat label="Da prendere" value={remaining} icon={<Clock3 />} tone="orange" /><Stat label="Scorte basse" value={1} icon={<Package />} tone="yellow" /></section>
    <section className="section-head"><div><h2>Le dosi di oggi</h2><p>{taken} di {doses.length} dosi completate</p></div><span className="progress"><i style={{ width: `${taken / doses.length * 100}%` }} /></span></section>
    <div className="timeline">{doses.map((dose, index) => { const med = medById(dose.medicineId); return <article className={`dose-card ${dose.state === 'Presa' ? 'completed' : ''}`} key={dose.id}><div className="time-col"><b>{dose.time}</b><span>{index === 0 ? 'Mattina' : index === 1 ? 'Pranzo' : 'Sera'}</span></div><div className="timeline-dot" style={{ borderColor: med.color }} /><div className="medicine-icon" style={{ background: `${med.color}18`, color: med.color }}><Pill /></div><div className="dose-info"><div className="dose-title"><h3>{med.name}</h3><span className={`status ${statusClass(dose.state)}`}>{dose.state === 'Presa' && '✓ '}{dose.state}</span></div><p><b>{med.dose} {med.dose === 1 ? 'compressa' : 'compresse'}</b> · {med.notes}</p>{dose.takenAt && <small>Assunta alle {dose.takenAt}</small>}</div>{dose.state !== 'Presa' && <div className="dose-actions"><button className="take" onClick={() => onMark(dose.id, 'Presa')}>✓ <span>Presa</span></button><button onClick={() => onMark(dose.id, 'Da prendere')}><Clock3 /><span>Ricordamelo</span></button><button onClick={() => onMark(dose.id, 'Saltata')}><X /><span>Saltata</span></button></div>}</article>})}</div>
    <div className="safety-note"><ShieldCheck /><p><b>La tua sicurezza prima di tutto</b><br />Questa applicazione è un promemoria personale e non sostituisce le indicazioni del medico o del farmacista. Non modificare dosaggi o terapie attraverso l’app.</p></div>
  </div>;
}

function Stat({ label, value, icon, tone }: { label: string; value: number; icon: React.ReactNode; tone: string }) { return <article className="stat"><span className={`stat-icon ${tone}`}>{icon}</span><div><b>{value}</b><p>{label}</p></div></article>; }

function MedicinesView({ medicines, search, setSearch, onAdd, onToggle }: { medicines: Medicine[]; search: string; setSearch: (s: string) => void; onAdd: () => void; onToggle: (id: string) => void }) { const filtered = medicines.filter((m) => m.name.toLowerCase().includes(search.trim().toLowerCase())); return <div className="content page"><div className="page-title"><div><p className="eyebrow">LA TUA TERAPIA</p><h1>Farmaci</h1><p>Gestisci farmaci, orari e dosaggi.</p></div><button className="primary" onClick={onAdd}><Plus /> Aggiungi farmaco</button></div><label className="search"><Search /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cerca un farmaco" /></label><div className="medicine-grid">{filtered.map((m) => <article className="medicine-card" key={m.id}><div className="medicine-card-top"><span className="medicine-icon" style={{ background: `${m.color}18`, color: m.color }}><Pill /></span><span className={`status ${m.active ? 'green' : 'gray'}`}>{m.active ? 'Attivo' : 'Sospeso'}</span></div><h3>{m.name}</h3><p>{m.dose} compressa · {m.times.join(', ')}</p><div className="stock-line"><span>Scorta</span><b className={m.stock <= m.threshold ? 'low-text' : ''}>{m.stock} compresse</b></div><div className="card-buttons"><button onClick={() => onToggle(m.id)}>{m.active ? 'Sospendi' : 'Riattiva'}</button><button>Modifica <ChevronRight /></button></div></article>)}</div></div>; }

function StockView({ medicines, onAdd }: { medicines: Medicine[]; onAdd: (id: string) => void }) { return <div className="content page"><div className="page-title"><div><p className="eyebrow">MAGAZZINO</p><h1>Scorte</h1><p>Controlla l’autonomia dei tuoi farmaci.</p></div></div><div className="stock-list">{medicines.map((m) => { const days = Math.floor(m.stock / (m.dose * m.times.length)); const low = m.stock <= m.threshold; return <article key={m.id} className={low ? 'stock-card low' : 'stock-card'}><span className="medicine-icon" style={{ background: `${m.color}18`, color: m.color }}><Package /></span><div className="stock-main"><h3>{m.name}</h3><p>{low ? `Scorta quasi terminata. Restano ${m.stock} pillole.` : `Autonomia stimata: ${days} giorni`}</p><div className="stock-bar"><i style={{ width: `${Math.min(100, m.stock / 30 * 100)}%` }} /></div></div><div className="stock-number"><b>{m.stock}</b><span>rimanenti</span></div><button className="outline" onClick={() => onAdd(m.id)}><CirclePlus /> Aggiungi confezione</button></article>})}</div></div>; }

function HistoryView({ doses, medById }: { doses: DoseRecord[]; medById: (id: string) => Medicine }) { return <div className="content page"><div className="page-title"><div><p className="eyebrow">REGISTRO ASSUNZIONI</p><h1>Storico</h1><p>Consulta e verifica le dosi registrate.</p></div></div><div className="calendar-strip">{[21,22,23,24,25,26,27].map((d) => <button className={d === 25 ? 'selected' : ''} key={d}><span>{['MAR','MER','GIO','VEN','SAB','DOM','LUN'][d-21]}</span><b>{d}</b></button>)}</div><section className="history-panel"><h2>Sabato 25 luglio</h2>{doses.map((d) => <div className="history-row" key={d.id}><span className={`history-dot ${statusClass(d.state)}`} /><b>{d.time}</b><div><h3>{medById(d.medicineId).name}</h3><p>{medById(d.medicineId).dose} compressa · {d.takenAt ? `Registrata alle ${d.takenAt}` : 'In attesa di registrazione'}</p></div><span className={`status ${statusClass(d.state)}`}>{d.state}</span></div>)}</section></div>; }

function MedicineModal({ onClose, onSubmit, fileRef }: { onClose: () => void; onSubmit: (e: FormEvent<HTMLFormElement>) => void; fileRef: React.RefObject<HTMLInputElement> }) { const [photo, setPhoto] = useState(''); const upload = (e: ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) setPhoto(file.name); }; return <div className="modal-backdrop" onMouseDown={onClose}><div className="modal" onMouseDown={(e) => e.stopPropagation()}><div className="modal-head"><div><p className="eyebrow">NUOVA TERAPIA</p><h2>Aggiungi farmaco</h2></div><button className="icon-button" onClick={onClose}><X /></button></div><form onSubmit={onSubmit}><label>Nome del farmaco<input name="name" placeholder="Es. Cardioaspirina" required /></label><div className="form-row"><label>Quantità iniziale<input name="stock" type="number" min="0" defaultValue="30" /></label><label>Quantità per dose<input name="dose" type="number" min="0.5" step="0.5" defaultValue="1" /></label></div><div className="form-row"><label>Orario di assunzione<input name="time" type="time" defaultValue="08:00" /></label><label>Soglia minima<input name="threshold" type="number" min="0" defaultValue="5" /></label></div><label>Data di inizio<input name="start" type="date" defaultValue="2026-07-25" /></label><label>Istruzioni o note<textarea name="notes" placeholder="Es. Dopo cena" /></label><button type="button" className="upload" onClick={() => fileRef.current?.click()}><Plus /> {photo || 'Aggiungi foto della confezione'}</button><input ref={fileRef} onChange={upload} type="file" accept="image/*" hidden /><div className="modal-actions"><button type="button" onClick={onClose}>Annulla</button><button className="primary" type="submit">Salva farmaco</button></div></form></div></div>; }
