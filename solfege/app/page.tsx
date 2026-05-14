'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import './landing.css';

export default function LandingPage() {
  const [pricingMode, setPricingMode] = useState<'mensile' | 'annuale'>('mensile');
  const [contactModal, setContactModal] = useState<{ isOpen: boolean; plan: string; price: string }>({
    isOpen: false,
    plan: '',
    price: ''
  });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const prices = {
    mensile: { 
      starter: '€14', 
      pro: '€29', 
      wl: '€79', 
      starterDesc: '€129/anno — ideale per piccole scuole', 
      proDesc: '€249/anno — per scuole in crescita', 
      wlDesc: '€790/anno — per franchising e catene' 
    },
    annuale: { 
      starter: '€10.75', 
      pro: '€20.75', 
      wl: '€65.83', 
      starterDesc: '€129/anno — risparmi €39 vs mensile', 
      proDesc: '€249/anno — risparmi €99 vs mensile', 
      wlDesc: '€790/anno — risparmi €158 vs mensile' 
    }
  };

  const currentPrices = prices[pricingMode];

  const openContact = (plan: string, price: string) => {
    setContactModal({ isOpen: true, plan, price });
  };

  const closeContact = () => {
    setContactModal({ ...contactModal, isOpen: false });
  };

  return (
    <div className="landing-body">
      {/* NAV */}
      <nav className="landing-nav">
        <Link href="/" className="nav-logo">Solfège</Link>
        <ul className="nav-links">
          <li><a href="#features">Funzioni</a></li>
          <li><a href="#pricing">Prezzi</a></li>
          <li><a href="#confronto">Confronto</a></li>
          <li><Link href="/login" className="btn-outline">Accedi</Link></li>
          <li><Link href="/register" className="btn-primary">Inizia gratis</Link></li>
        </ul>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-badge">Nuovo — Prezzi trasparenti, nessuna demo obbligatoria</div>
        <h1>Il gestionale per la tua<br /><span>scuola di musica</span></h1>
        <p>Allievi, docenti, pagamenti, presenze e calendario in un'unica piattaforma. Semplice, moderno, italiano. Inizia gratis in 2 minuti.</p>
        <div className="hero-actions">
          <Link href="/register" className="btn-primary">Inizia gratis — €0</Link>
          <a href="#features" className="btn-outline">Scopri le funzioni</a>
        </div>
        <p className="hero-note">Nessuna carta di credito richiesta · 30 giorni di prova completa · Setup in 2 minuti</p>
      </section>

      {/* MOCKUP */}
      <section className="mockup-section">
        <div className="mockup-browser animate-in zoom-in-95 duration-1000">
          <div className="mockup-bar">
            <div className="mockup-dot red"></div>
            <div className="mockup-dot yellow"></div>
            <div className="mockup-dot green"></div>
            <div className="mockup-url">solfege-five.vercel.app/login</div>
          </div>
          <div className="relative aspect-[16/10] overflow-hidden bg-white">
            <Image 
              src="/screenshots/01_Login.png" 
              alt="Login Solfège" 
              fill 
              className="object-contain object-top hover:scale-[1.02] transition-transform duration-700 cursor-pointer"
              priority
            />
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <div className="social-proof">
        <p>Già scelto dalle prime scuole di musica in Italia</p>
        <div className="proof-badges">
          <div className="proof-badge"><div className="proof-icon">✓</div> Setup in 2 minuti</div>
          <div className="proof-badge"><div className="proof-icon">✓</div> Dati sicuri su server EU</div>
          <div className="proof-badge"><div className="proof-icon">✓</div> Supporto in italiano</div>
          <div className="proof-badge"><div className="proof-icon">✓</div> Aggiornamenti continui</div>
        </div>
      </div>

      {/* GALLERIA REALE */}
      <section className="section bg-stone-50/50">
        <div className="section-label">Galleria Interfacce</div>
        <h2 className="section-title">Esperienza Reale.<br />Zero Sorprese.</h2>
        <p className="section-sub">Guarda come Solfège semplifica ogni aspetto della tua giornata. Interfacce pulite, veloci e pensate per chi lavora.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div 
            className="group border rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all cursor-zoom-in"
            onClick={() => setSelectedImage('/screenshots/09_Finanze.png')}
          >
            <div className="relative aspect-video">
              <Image src="/screenshots/09_Finanze.png" alt="Gestione Finanze" fill className="object-cover object-top group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <div className="bg-white/90 p-2 rounded-full opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all">
                  <svg className="w-5 h-5 text-stone-900" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                </div>
              </div>
            </div>
            <div className="p-4">
              <h4 className="font-bold text-stone-900">Gestione Finanze</h4>
              <p className="text-xs text-stone-500 mt-1">Monitora incassi, ritardi e genera ricevute PDF in un click.</p>
            </div>
          </div>
          <div 
            className="group border rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all cursor-zoom-in"
            onClick={() => setSelectedImage('/screenshots/04_Studenti_CRUD.png')}
          >
            <div className="relative aspect-video">
              <Image src="/screenshots/04_Studenti_CRUD.png" alt="Anagrafica Allievi" fill className="object-cover object-top group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <div className="bg-white/90 p-2 rounded-full opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all">
                  <svg className="w-5 h-5 text-stone-900" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                </div>
              </div>
            </div>
            <div className="p-4">
              <h4 className="font-bold text-stone-900">Anagrafica Allievi</h4>
              <p className="text-xs text-stone-500 mt-1">Gestisci ogni dettaglio degli iscritti, dai dati dei genitori allo storico lezioni.</p>
            </div>
          </div>
          <div 
            className="group border rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all cursor-zoom-in"
            onClick={() => setSelectedImage('/screenshots/Calendario.png')}
          >
            <div className="relative aspect-video">
              <Image src="/screenshots/Calendario.png" alt="Calendario" fill className="object-cover object-top group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <div className="bg-white/90 p-2 rounded-full opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all">
                  <svg className="w-5 h-5 text-stone-900" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                </div>
              </div>
            </div>
            <div className="p-4">
              <h4 className="font-bold text-stone-900">Calendario Dinamico</h4>
              <p className="text-xs text-stone-500 mt-1">Gestisci aule e docenti con una vista drag-and-drop intuitiva.</p>
            </div>
          </div>
        </div>
      </section>

      {/* LIGHTBOX */}
      {selectedImage && (
        <div className="lightbox-overlay" onClick={() => setSelectedImage(null)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <Image 
              src={selectedImage} 
              alt="Screenshot ingrandito" 
              width={1600} 
              height={1000} 
              className="w-full h-auto"
            />
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/80 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      )}

      {/* FEATURES */}
      <section className="section" id="features">
        <div className="section-label">Funzionalità</div>
        <h2 className="section-title">Tutto quello che serve.<br />Niente di superfluo.</h2>
        <p className="section-sub">Solfège è progettato per chi gestisce una scuola di musica, non per un commercialista. Semplice da usare, potente dove conta.</p>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
            </div>
            <h3>Gestione Allievi</h3>
            <p>Anagrafica completa, schede con 5 tab, storico iscrizioni e pagamenti. Supporto per minorenni con dati genitori automatici.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>
            </div>
            <h3>Gestione Docenti</h3>
            <p>Griglia disponibilità settimanale, specializzazioni, tariffe orarie individuali e collettive. Portale mobile dedicato per ogni insegnante.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
            </div>
            <h3>Calendario Interattivo</h3>
            <p>Vista mensile, settimanale e giornaliera. Ogni lezione colorata per corso. Gestione recuperi e cancellazioni con un click.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
            </div>
            <h3>Pagamenti e Ricevute</h3>
            <p>Scadenzario automatico, badge status colorati, ricevute PDF scaricabili e condivisibili via WhatsApp in un tap.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24"><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
            </div>
            <h3>Registro Presenze</h3>
            <p>Il docente segna le presenze dal telefono in 30 secondi. L'admin vede tutto in tempo reale nel calendario.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
            </div>
            <h3>Statistiche Avanzate</h3>
            <p>Incassi mensili, allievi per strumento, presenze medie, compensi docenti calcolati automaticamente.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
            </div>
            <h3>Sicurezza Multi-Tenant</h3>
            <p>Ogni scuola è completamente isolata. RLS Supabase garantisce che i tuoi dati non siano mai visibili ad altri.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24"><rect x="5" y="2" width="14" height="20" rx="2" ry="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></svg>
            </div>
            <h3>App Docente Mobile</h3>
            <p>Interfaccia ottimizzata per telefono. I docenti gestiscono presenze, allievi e compensi dal proprio smartphone.</p>
          </div>
        </div>
      </section>

      {/* DUE INTERFACCE */}
      <section style={{ padding: '0 2rem 5rem', maxWidth: '1100px', margin: '0 auto' }}>
        <div className="section-label">Due interfacce</div>
        <h2 className="section-title">Admin e Docente.<br />Ognuno vede solo ciò che serve.</h2>
        <p className="section-sub" style={{ marginBottom: '2.5rem' }}>Una sola app, due esperienze ottimizzate. Il direttore gestisce tutto da desktop, i docenti operano da mobile.</p>

        <div className="interfaces-grid">
          <div className="interface-card">
            <div className="interface-header">
              <h3>Interfaccia Admin</h3>
              <p>Gestionale completo per desktop — direttore e segreteria</p>
            </div>
            <div className="interface-body">
              <div className="interface-feature"><div className="if-dot"></div><p>Dashboard con KPI in tempo reale e grafici incassi</p></div>
              <div className="interface-feature"><div className="if-dot"></div><p>CRUD completo allievi, insegnanti, corsi, aule</p></div>
              <div className="interface-feature"><div className="if-dot"></div><p>Scadenzario pagamenti con solleciti e PDF ricevuta</p></div>
              <div className="interface-feature"><div className="if-dot"></div><p>Calendario con filtri per docente, aula, strumento</p></div>
              <div className="interface-feature"><div className="if-dot"></div><p>Compensi docenti calcolati automaticamente</p></div>
              <div className="interface-feature"><div className="if-dot"></div><p>Impostazioni scuola personalizzabili</p></div>
            </div>
          </div>

          <div className="interface-card">
            <div className="interface-header" style={{ background: 'var(--orange)' }}>
              <h3 style={{ color: '#fff' }}>App Docente</h3>
              <p style={{ color: 'rgba(255,255,255,.7)' }}>Mobile-first per smartphone — insegnanti</p>
            </div>
            <div className="interface-body">
              <div className="interface-feature"><div className="if-dot"></div><p>Lezioni di oggi con orario, aula e nome allievo</p></div>
              <div className="interface-feature"><div className="if-dot"></div><p>Toggle presenze a 3 stati con un tap</p></div>
              <div className="interface-feature"><div className="if-dot"></div><p>Lista propri allievi con dettaglio e note corso</p></div>
              <div className="interface-feature"><div className="if-dot"></div><p>Compenso mese corrente con ore lavorate</p></div>
              <div className="interface-feature"><div className="if-dot"></div><p>Accesso con invito email — nessuna registrazione manuale</p></div>
              <div className="interface-feature"><div className="if-dot"></div><p>Isolato: vede solo i propri dati, mai quelli degli altri</p></div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="pricing-section" id="pricing">
        <div className="pricing-inner">
          <div className="pricing-header">
            <div className="section-label" style={{ textAlign: 'center' }}>Prezzi</div>
            <h2 className="section-title">Trasparenti. Sempre.</h2>
            <p style={{ color: 'var(--muted)', maxWidth: '500px', margin: '0 auto' }}>Nessun "contattaci per un preventivo". Sai esattamente cosa paghi prima di iniziare.</p>
            <div className="pricing-toggle">
              <button 
                className={pricingMode === 'mensile' ? 'active' : ''} 
                onClick={() => setPricingMode('mensile')}
              >
                Mensile
              </button>
              <button 
                className={pricingMode === 'annuale' ? 'active' : ''} 
                onClick={() => setPricingMode('annuale')}
              >
                Annuale — risparmia 28%
              </button>
            </div>
          </div>

          <div className="pricing-grid">
            {/* FREE */}
            <div className="pricing-card">
              <div className="pricing-plan">Free</div>
              <div className="pricing-price">
                <span className="amount">€0</span>
                <span className="period">/mese</span>
              </div>
              <p className="pricing-desc">Per sempre. Perfetto per iniziare.</p>
              <hr className="pricing-divider" />
              <div className="pricing-feature"><span className="check">✓</span><span>Max 20 allievi</span></div>
              <div className="pricing-feature"><span className="check">✓</span><span>Max 2 docenti</span></div>
              <div className="pricing-feature"><span className="check">✓</span><span>Calendario lezioni</span></div>
              <div className="pricing-feature"><span className="check">✓</span><span>Registro presenze</span></div>
              <div className="pricing-feature"><span className="check">✓</span><span>Pagamenti base</span></div>
              <div className="pricing-feature"><span className="cross">✗</span><span className="dim">PDF ricevute</span></div>
              <div className="pricing-feature"><span className="cross">✗</span><span className="dim">App docenti mobile</span></div>
              <div className="pricing-feature"><span className="cross">✗</span><span className="dim">Statistiche avanzate</span></div>
              <Link href="/register" className="btn-primary pricing-cta outline">Inizia gratis</Link>
            </div>

            {/* STARTER */}
            <div className="pricing-card">
              <div className="pricing-plan">Starter</div>
              <div className="pricing-price">
                <span className="amount">{currentPrices.starter}</span>
                <span className="period">/mese</span>
              </div>
              <p className="pricing-desc">{currentPrices.starterDesc}</p>
              <hr className="pricing-divider" />
              <div className="pricing-feature"><span className="check">✓</span><span>Max 50 allievi</span></div>
              <div className="pricing-feature"><span className="check">✓</span><span>Max 5 docenti</span></div>
              <div className="pricing-feature"><span className="check">✓</span><span>Tutto il piano Free</span></div>
              <div className="pricing-feature"><span className="check">✓</span><span>PDF ricevute</span></div>
              <div className="pricing-feature"><span className="check">✓</span><span>App docenti mobile</span></div>
              <div className="pricing-feature"><span className="check">✓</span><span>Supporto email</span></div>
              <div className="pricing-feature"><span className="cross">✗</span><span className="dim">Statistiche avanzate</span></div>
              <div className="pricing-feature"><span className="cross">✗</span><span className="dim">Export CSV</span></div>
              <button className="pricing-cta orange" onClick={() => openContact('Starter', currentPrices.starter + '/mese')}>Attiva Starter</button>
            </div>

            {/* PRO */}
            <div className="pricing-card featured">
              <div className="pricing-badge">Più Popolare</div>
              <div className="pricing-plan">Pro</div>
              <div className="pricing-price">
                <span className="amount">{currentPrices.pro}</span>
                <span className="period">/mese</span>
              </div>
              <p className="pricing-desc">{currentPrices.proDesc}</p>
              <hr className="pricing-divider" />
              <div className="pricing-feature"><span className="check">✓</span><span>Allievi illimitati</span></div>
              <div className="pricing-feature"><span className="check">✓</span><span>Docenti illimitati</span></div>
              <div className="pricing-feature"><span className="check">✓</span><span>Tutto il piano Starter</span></div>
              <div className="pricing-feature"><span className="check">✓</span><span>Statistiche avanzate</span></div>
              <div className="pricing-feature"><span className="check">✓</span><span>Export CSV</span></div>
              <div className="pricing-feature"><span className="check">✓</span><span>Solleciti automatici</span></div>
              <div className="pricing-feature"><span className="check">✓</span><span>Supporto prioritario</span></div>
              <div className="pricing-feature"><span className="check">✓</span><span>Backup giornaliero</span></div>
              <button className="pricing-cta orange" onClick={() => openContact('Pro', currentPrices.pro + '/mese')}>Attiva Pro</button>
            </div>

            {/* WHITE LABEL */}
            <div className="pricing-card enterprise">
              <div className="pricing-badge ent">Enterprise</div>
              <div className="pricing-plan">White Label</div>
              <div className="pricing-price">
                <span className="amount">{currentPrices.wl}</span>
                <span className="period">/mese</span>
              </div>
              <p className="pricing-desc">{currentPrices.wlDesc}</p>
              <hr className="pricing-divider" />
              <div className="pricing-feature"><span className="check">✓</span><span>Tutto il piano Pro</span></div>
              <div className="pricing-feature"><span className="check">✓</span><span>Logo e branding custom</span></div>
              <div className="pricing-feature"><span className="check">✓</span><span>Dominio personalizzato</span></div>
              <div className="pricing-feature"><span className="check">✓</span><span>Multi-sede</span></div>
              <div className="pricing-feature"><span className="check">✓</span><span>Supporto dedicato</span></div>
              <div className="pricing-feature"><span className="check">✓</span><span>Onboarding assistito</span></div>
              <div className="pricing-feature"><span className="check">✓</span><span>SLA garantito</span></div>
              <button className="pricing-cta dark" onClick={() => openContact('White Label', currentPrices.wl + '/mese')}>Contattaci</button>
            </div>
          </div>
        </div>
      </section>

      {/* CONFRONTO COMPETITOR */}
      <section className="compare-section" id="confronto">
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div className="section-label" style={{ textAlign: 'center' }}>Confronto</div>
          <h2 className="section-title">Perché Solfège?</h2>
          <p style={{ color: 'var(--muted)' }}>Confronto onesto con i principali competitor del mercato italiano.</p>
        </div>
        <table className="compare-table">
          <thead>
            <tr>
              <th>Funzione</th>
              <th className="highlight">Solfège</th>
              <th>Mooking</th>
              <th>Asso360</th>
              <th>Academy Mgr</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Prezzi pubblici</td>
              <td><span className="check-orange">✓ Sì</span></td>
              <td><span className="check-red">✗ "Contattaci"</span></td>
              <td><span className="check-red">✗ "Contattaci"</span></td>
              <td><span className="check-red">✗ "Contattaci"</span></td>
            </tr>
            <tr>
              <td>Trial senza carta</td>
              <td><span className="check-orange">✓ 30 giorni</span></td>
              <td><span className="check-red">✗ Demo obbligatoria</span></td>
              <td><span className="check-green">✓ 14 giorni</span></td>
              <td><span className="check-red">✗ No</span></td>
            </tr>
            <tr>
              <td>App docenti mobile</td>
              <td><span className="check-orange">✓ Nativa</span></td>
              <td><span className="check-green">✓ Sì</span></td>
              <td><span className="check-red">✗ No</span></td>
              <td><span className="check-red">✗ No</span></td>
            </tr>
            <tr>
              <td>Setup autonomo</td>
              <td><span className="check-orange">✓ 2 minuti</span></td>
              <td><span className="check-red">✗ Demo obbligatoria</span></td>
              <td><span className="check-green">✓ Sì</span></td>
              <td><span className="check-red">✗ Installazione</span></td>
            </tr>
            <tr>
              <td>UI moderna</td>
              <td><span className="check-orange">✓ Premium</span></td>
              <td><span className="check-red">✗ Datata</span></td>
              <td><span className="check-red">✗ Datata</span></td>
              <td><span className="check-red">✗ Datata</span></td>
            </tr>
            <tr>
              <td>Multi-tenant SaaS</td>
              <td><span className="check-orange">✓ Nativo</span></td>
              <td><span className="check-green">✓ Sì</span></td>
              <td><span className="check-green">✓ Sì</span></td>
              <td><span className="check-red">✗ No</span></td>
            </tr>
            <tr>
              <td>Prezzo base mensile</td>
              <td><span className="check-orange">€14/mese</span></td>
              <td><span className="check-red">~€60-80+</span></td>
              <td><span className="check-red">~€25-40</span></td>
              <td><span className="check-red">~€50+</span></td>
            </tr>
            <tr>
              <td>Supporto italiano</td>
              <td><span className="check-orange">✓ Sì</span></td>
              <td><span className="check-green">✓ Sì</span></td>
              <td><span className="check-green">✓ Sì</span></td>
              <td><span className="check-green">✓ Sì</span></td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* TESTIMONIALS */}
      <section className="testimonials">
        <div className="testimonials-inner">
          <div style={{ textAlign: 'center' }}>
            <div className="section-label" style={{ textAlign: 'center' }}>Recensioni</div>
            <h2 className="section-title">Le prime scuole ci hanno scelto</h2>
          </div>
          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="testimonial-stars">★★★★★</div>
              <p className="testimonial-text">"Finalmente un gestionale che capisce come funziona una scuola di musica. Setup in 10 minuti e i docenti usano l'app dal telefono senza problemi."</p>
              <div className="testimonial-author">Marco R. — Direttore Accademia Musicale, Milano</div>
            </div>
            <div className="testimonial-card">
              <div className="testimonial-stars">★★★★★</div>
              <p className="testimonial-text">"Prima usavamo Excel per tutto. Con Solfège i pagamenti scaduti li vedo subito e le ricevute PDF le mando su WhatsApp in un secondo."</p>
              <div className="testimonial-author">Elena B. — Segreteria Scuola Musica, Roma</div>
            </div>
            <div className="testimonial-card">
              <div className="testimonial-stars">★★★★★</div>
              <p className="testimonial-text">"I prezzi sono chiari, il sistema funziona e quando ho avuto un problema il supporto ha risposto in meno di un'ora. Cosa chiedere di più?"</p>
              <div className="testimonial-author">Luca V. — Insegnante e co-fondatore, Napoli</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINALE */}
      <section className="cta-section">
        <h2>Inizia oggi.<br /><span>È gratis.</span></h2>
        <p>30 giorni di prova completa. Nessuna carta di credito. Setup in 2 minuti.</p>
        <Link href="/register" className="btn-primary">Crea il tuo account gratis</Link>
        <p className="cta-note">Hai già un account? <Link href="/login" style={{ color: 'var(--orange)', textDecoration: 'none' }}>Accedi</Link></p>
      </section>

      {/* FOOTER */}
      <footer className="landing-footer">
        <div className="footer-logo">Solfège</div>
        <p>Il gestionale SaaS per scuole di musica · Made in Italy</p>
        <p style={{ marginTop: '.5rem' }}>
          <Link href="/register">Registrati</Link> ·
          <a href="https://wa.me/393517064080">Supporto WhatsApp</a> ·
          <a href="mailto:admindany@gmail.com">Email</a>
        </p>
        <p style={{ marginTop: '1rem', fontSize: '.75rem' }}>© 2026 Solfège. Tutti i diritti riservati.</p>
      </footer>

      {/* DIALOG CONTATTO */}
      {contactModal.isOpen && (
        <div className="contact-dialog-overlay" onClick={closeContact}>
          <div className="contact-dialog-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '1.5rem', marginBottom: '.5rem' }}>
              Attiva Piano {contactModal.plan}
            </h3>
            <p style={{ color: 'var(--muted)', fontSize: '.9rem', marginBottom: '1.5rem' }}>
              {contactModal.price} · Integrazione Stripe disponibile in v2.0
            </p>
            <p style={{ color: 'var(--text)', fontSize: '.9rem', marginBottom: '1.5rem' }}>
              Contattaci per attivare il tuo abbonamento:
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href="https://wa.me/393517064080" target="_blank" className="btn-primary">WhatsApp</a>
              <a href={`mailto:admindany@gmail.com?subject=Attivazione piano Solfège ${contactModal.plan}`} className="btn-outline">
                Email
              </a>
            </div>
            <p style={{ color: 'var(--muted)', fontSize: '.78rem', marginTop: '1rem' }}>Rispondiamo entro 24 ore</p>
            <button onClick={closeContact} style={{ marginTop: '1rem', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '.85rem' }}>
              Chiudi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
