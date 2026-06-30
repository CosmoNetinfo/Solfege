'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  HardDrive, 
  Wifi, 
  RefreshCw, 
  Shield, 
  Download, 
  Database, 
  Users, 
  GraduationCap, 
  Calendar as CalendarIcon, 
  FileText, 
  CheckSquare, 
  BarChart3,
  Check,
  X,
  ArrowRight,
  ShieldCheck,
  MessageSquare
} from 'lucide-react';
import './landing.css';

export default function LandingPage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  return (
    <div className="landing-body">
      {/* NAV */}
      <nav className="landing-nav">
        <Link href="/" className="nav-logo flex items-center gap-2">
          <Image src="/logo.png" alt="Solfège Logo" width={120} height={40} className="h-8 w-auto" />
        </Link>
        <ul className="nav-links">
          <li><a href="#features">Funzioni</a></li>
          <li><a href="#pricing">Prezzi</a></li>
          <li><a href="#confronto">Confronto</a></li>
          <li><Link href="/login" className="btn-outline">Accedi</Link></li>
          <li><a href="#pricing" className="btn-primary bg-[#E8621A] hover:bg-[#C94E0E] text-white">Acquista — €249</a></li>
        </ul>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-badge">Nuovo — App desktop nativa per Windows e Mac</div>
        <h1>Il gestionale per la tua<br /><span>scuola di musica</span></h1>
        <p>Allievi, docenti, pagamenti, presenze e calendario in un'unica app desktop. Nessun abbonamento. Nessun cloud. I tuoi dati restano nel tuo PC.</p>
        <div className="hero-actions">
          <a href="https://wa.me/393517064080" target="_blank" rel="noopener noreferrer" className="btn-primary bg-[#E8621A] hover:bg-[#C94E0E] text-white">
            Acquista ora — €249 una tantum
          </a>
          <a href="https://wa.me/393517064080" target="_blank" rel="noopener noreferrer" className="btn-outline">
            Prova gratis 15 giorni
          </a>
        </div>
        <p className="hero-note">Licenza a vita · Aggiornamenti inclusi · Supporto WhatsApp diretto</p>
      </section>

      {/* MOCKUP */}
      <section className="mockup-section">
        <div className="mockup-browser animate-in zoom-in-95 duration-1000">
          <div className="mockup-bar">
            <div className="mockup-dot red"></div>
            <div className="mockup-dot yellow"></div>
            <div className="mockup-dot green"></div>
            <div className="mockup-url">Solfège Desktop App</div>
          </div>
          <div className="relative overflow-hidden bg-white">
            <Image 
              src="/screenshots/01_Login.png" 
              alt="Login Solfège" 
              width={1600}
              height={1000}
              className="w-full h-auto hover:scale-[1.01] transition-transform duration-700 cursor-pointer"
              onClick={() => setSelectedImage('/screenshots/01_Login.png')}
              priority
            />
          </div>
        </div>
      </section>

      {/* VANTAGGI DESKTOP */}
      <section className="section bg-stone-50/50">
        <div className="section-label">Architettura</div>
        <h2 className="section-title">Perché un'app desktop?</h2>
        <p className="section-sub">Il cloud non sempre è la scelta migliore. Solfège unisce la fluidità di un'app moderna alla sicurezza del locale.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mt-12">
          <div className="flex gap-4 p-6 bg-white rounded-xl border border-stone-200 shadow-sm">
            <div className="p-3 bg-orange/10 rounded-lg h-fit text-[#E8621A]">
              <HardDrive className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-stone-900 text-lg">I tuoi dati restano nel tuo PC</h4>
              <p className="text-sm text-stone-500 mt-2">Nessun cloud, nessun server esterno. Privacy totale per te e i tuoi allievi, zero costi di gestione server.</p>
            </div>
          </div>

          <div className="flex gap-4 p-6 bg-white rounded-xl border border-stone-200 shadow-sm">
            <div className="p-3 bg-orange/10 rounded-lg h-fit text-[#E8621A]">
              <Wifi className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-stone-900 text-lg">Funziona anche offline</h4>
              <p className="text-sm text-stone-500 mt-2">Nessuna connessione internet richiesta per l'operatività quotidiana. L'app risponde all'istante, sempre.</p>
            </div>
          </div>

          <div className="flex gap-4 p-6 bg-white rounded-xl border border-stone-200 shadow-sm">
            <div className="p-3 bg-orange/10 rounded-lg h-fit text-[#E8621A]">
              <RefreshCw className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-stone-900 text-lg">Aggiornamenti automatici</h4>
              <p className="text-sm text-stone-500 mt-2">Nuove funzionalità e correzioni vengono scaricate automaticamente. Sei sempre aggiornato senza interventi tecnici.</p>
            </div>
          </div>

          <div className="flex gap-4 p-6 bg-white rounded-xl border border-stone-200 shadow-sm">
            <div className="p-3 bg-orange/10 rounded-lg h-fit text-[#E8621A]">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-stone-900 text-lg">Un solo pagamento, per sempre</h4>
              <p className="text-sm text-stone-500 mt-2">€249 una tantum. Nessun canone mensile, nessun rinnovo a sorpresa. Licenza a vita inclusa.</p>
            </div>
          </div>
        </div>
      </section>

      {/* GALLERIA INTERFACCE */}
      <section className="section">
        <div className="section-label">Galleria Interfacce</div>
        <h2 className="section-title">Esperienza Reale.<br />Zero Sorprese.</h2>
        <p className="section-sub">Guarda come Solfège semplifica ogni aspetto della tua giornata. Interfacce pulite, veloci e pensate per chi lavora.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-6xl mx-auto">
          <div 
            className="group border rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all cursor-zoom-in"
            onClick={() => setSelectedImage('/screenshots/09_Finanze.png')}
          >
            <div className="relative aspect-video">
              <Image src="/screenshots/09_Finanze.png" alt="Gestione Finanze" fill className="object-cover object-top group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <div className="bg-white/90 p-2 rounded-full opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all">
                  <Download className="w-5 h-5 text-stone-900" />
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
                  <Download className="w-5 h-5 text-stone-900" />
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
                  <Download className="w-5 h-5 text-stone-900" />
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
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* FEATURES */}
      <section className="section bg-stone-50/50" id="features">
        <div className="section-label">Funzionalità</div>
        <h2 className="section-title">Tutto quello che serve.<br />Niente di superfluo.</h2>
        <p className="section-sub">Solfège è progettato per chi gestisce una scuola di musica. Semplice da usare, potente dove conta.</p>

        <div className="features-grid max-w-6xl mx-auto">
          <div className="feature-card">
            <div className="feature-icon text-[#E8621A]"><Users className="h-6 w-6" /></div>
            <h3>Gestione Allievi</h3>
            <p>Anagrafica completa, schede dettagliate, storico iscrizioni e pagamenti. Gestione contatti genitori per allievi minorenni.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon text-[#E8621A]"><GraduationCap className="h-6 w-6" /></div>
            <h3>Gestione Docenti</h3>
            <p>Griglia disponibilità settimanale, specializzazioni, tariffe orarie individuali e calcolo compensi docenti automatizzato.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon text-[#E8621A]"><CalendarIcon className="h-6 w-6" /></div>
            <h3>Calendario Interattivo</h3>
            <p>Vista mensile, settimanale e giornaliera. Lezioni colorate per corso. Gestione dei recuperi e assenze in un click.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon text-[#E8621A]"><FileText className="h-6 w-6" /></div>
            <h3>Pagamenti e Ricevute</h3>
            <p>Scadenzario automatico, badge di stato colorati, generazione e condivisione ricevute PDF in formato professionale.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon text-[#E8621A]"><CheckSquare className="h-6 w-6" /></div>
            <h3>Registro Presenze</h3>
            <p>Compilazione registro rapido in 30 secondi. Rilevazione presenze/assenze integrata con calcolo compensi all'istante.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon text-[#E8621A]"><BarChart3 className="h-6 w-6" /></div>
            <h3>Statistiche Avanzate</h3>
            <p>Report incassi mensili, allievi attivi per strumento, tassi di presenza e monitoraggio andamento economico.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon text-[#E8621A]"><Download className="h-6 w-6" /></div>
            <h3>Installazione semplice</h3>
            <p>Scarica, installa, inserisci la tua licenza e sei operativo in 5 minuti. Disponibile come app nativa per Windows e macOS.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon text-[#E8621A]"><Database className="h-6 w-6" /></div>
            <h3>Database locale SQLite</h3>
            <p>Tutti i dati salvati interamente in locale sul tuo hard disk. Export, backup manuali o copie di sicurezza immediate.</p>
          </div>
        </div>
      </section>

      {/* COME FUNZIONA */}
      <section className="section">
        <div className="section-label">Processo</div>
        <h2 className="section-title">Operativo in 5 minuti</h2>
        <p className="section-sub">Dall'acquisto all'operatività in 3 semplici passi.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mt-12 text-center">
          <div className="space-y-4">
            <div className="w-12 h-12 bg-orange/10 text-[#E8621A] font-bold rounded-full flex items-center justify-center mx-auto text-xl font-serif">1</div>
            <h4 className="font-bold text-stone-900 text-lg">Acquista</h4>
            <p className="text-sm text-stone-500">Contattaci su WhatsApp o via e-mail. Ti inviamo il link e ricevi la licenza in pochi minuti.</p>
          </div>

          <div className="space-y-4">
            <div className="w-12 h-12 bg-orange/10 text-[#E8621A] font-bold rounded-full flex items-center justify-center mx-auto text-xl font-serif">2</div>
            <h4 className="font-bold text-stone-900 text-lg">Installa</h4>
            <p className="text-sm text-stone-500">Scarica il file installatore .exe per Windows o .dmg per macOS e lancialo sul tuo PC.</p>
          </div>

          <div className="space-y-4">
            <div className="w-12 h-12 bg-orange/10 text-[#E8621A] font-bold rounded-full flex items-center justify-center mx-auto text-xl font-serif">3</div>
            <h4 className="font-bold text-stone-900 text-lg">Inizia</h4>
            <p className="text-sm text-stone-500">Apri Solfège, inserisci la chiave di licenza, configura la scuola e sei pronto a partire.</p>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="section bg-stone-50/50" id="pricing">
        <div className="section-label">Prezzi</div>
        <h2 className="section-title">Un prezzo. Tutto incluso.</h2>
        <p className="section-sub">Nessun abbonamento mensile. Nessun cloud. Paghi una volta, usi per sempre.</p>

        <div className="max-w-md mx-auto mt-12 bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-md">
          <div className="bg-[#1A1714] text-white p-8 text-center space-y-2">
            <h3 className="text-2xl font-serif font-bold tracking-wide">Solfège Desktop</h3>
            <div className="py-4">
              <span className="text-5xl font-bold font-serif text-[#E8621A]">€249</span>
              <span className="text-xs text-stone-400 block mt-1">una tantum</span>
            </div>
          </div>
          <div className="p-8 space-y-6">
            <ul className="space-y-4 text-sm text-stone-600">
              <li className="flex items-center gap-3"><Check className="h-5 w-5 text-green-600 shrink-0" /> Licenza a vita per sempre</li>
              <li className="flex items-center gap-3"><Check className="h-5 w-5 text-green-600 shrink-0" /> Aggiornamenti gratuiti inclusi</li>
              <li className="flex items-center gap-3"><Check className="h-5 w-5 text-green-600 shrink-0" /> Supporto WhatsApp diretto con Daniele</li>
              <li className="flex items-center gap-3"><Check className="h-5 w-5 text-green-600 shrink-0" /> Allievi e docenti illimitati</li>
              <li className="flex items-center gap-3"><Check className="h-5 w-5 text-green-600 shrink-0" /> Database locale SQLite (privacy totale)</li>
              <li className="flex items-center gap-3"><Check className="h-5 w-5 text-green-600 shrink-0" /> Funzionamento 100% offline</li>
              <li className="flex items-center gap-3"><Check className="h-5 w-5 text-green-600 shrink-0" /> Windows + macOS</li>
              <li className="flex items-center gap-3"><Check className="h-5 w-5 text-green-600 shrink-0" /> Trial di 15 giorni senza carta</li>
            </ul>

            <div className="space-y-3">
              <a 
                href="https://wa.me/393517064080" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-full flex items-center justify-center gap-2 bg-[#E8621A] hover:bg-[#C94E0E] text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-sm"
              >
                <MessageSquare className="h-5 w-5" /> Acquista via WhatsApp
              </a>
              <div className="text-center text-xs text-stone-400">
                oppure scrivi a <a href="mailto:admindany@gmail.com" className="hover:text-[#E8621A] underline">admindany@gmail.com</a>
              </div>
            </div>
          </div>
        </div>
        
        <p className="text-center text-xs text-stone-500 max-w-md mx-auto mt-6 italic">
          Come funziona: ci scrivi su WhatsApp → ti mandiamo il link di pagamento sicuro → ricevi la chiave di licenza → scarichi l'app e installi.
        </p>
      </section>

      {/* CONFRONTO */}
      <section className="section" id="confronto">
        <div className="section-label">Comparazione</div>
        <h2 className="section-title">Perché Solfège?</h2>
        <p className="section-sub">Il confronto diretto tra l'approccio locale one-time di Solfège e i sistemi cloud in abbonamento.</p>

        <div className="max-w-5xl mx-auto mt-12 border border-stone-200 rounded-2xl bg-white shadow-sm overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 font-bold text-stone-800">
                <th className="p-4">Funzione</th>
                <th className="p-4 text-[#E8621A]">Solfège Desktop</th>
                <th className="p-4 font-normal text-stone-500">Mooking</th>
                <th className="p-4 font-normal text-stone-500">Asso360</th>
                <th className="p-4 font-normal text-stone-500">Academy Mgr</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-150">
              <tr>
                <td className="p-4 font-medium">Prezzi pubblici</td>
                <td className="p-4 text-green-700 font-bold">✓ Sì</td>
                <td className="p-4 text-red-600">✗ "Contattaci"</td>
                <td className="p-4 text-red-600">✗ "Contattaci"</td>
                <td className="p-4 text-red-600">✗ "Contattaci"</td>
              </tr>
              <tr>
                <td className="p-4 font-medium">App desktop nativa</td>
                <td className="p-4 text-green-700 font-bold">✓ Windows + Mac</td>
                <td className="p-4 text-red-600">✗ Solo web</td>
                <td className="p-4 text-red-600">✗ Solo web</td>
                <td className="p-4 text-amber-600">✓ Parziale</td>
              </tr>
              <tr>
                <td className="p-4 font-medium">Dati in locale</td>
                <td className="p-4 text-green-700 font-bold">✓ Privacy totale</td>
                <td className="p-4 text-red-600">✗ Cloud obbligatorio</td>
                <td className="p-4 text-red-600">✗ Cloud obbligatorio</td>
                <td className="p-4 text-green-700">✓ Sì</td>
              </tr>
              <tr>
                <td className="p-4 font-medium">Funziona offline</td>
                <td className="p-4 text-green-700 font-bold">✓ Sì</td>
                <td className="p-4 text-red-600">✗ No</td>
                <td className="p-4 text-red-600">✗ No</td>
                <td className="p-4 text-amber-600">✓ Parziale</td>
              </tr>
              <tr>
                <td className="p-4 font-medium">Acquisto una tantum</td>
                <td className="p-4 text-green-700 font-bold">✓ €249 vita</td>
                <td className="p-4 text-red-600">✗ ~€60-80/mese</td>
                <td className="p-4 text-red-600">✗ ~€25-40/mese</td>
                <td className="p-4 text-red-600">✗ ~€50+/mese</td>
              </tr>
              <tr>
                <td className="p-4 font-medium">Aggiornamenti inclusi</td>
                <td className="p-4 text-green-700 font-bold">✓ A vita</td>
                <td className="p-4 text-green-700">✓ Inclusi</td>
                <td className="p-4 text-green-700">✓ Inclusi</td>
                <td className="p-4 text-green-700">✓ Inclusi</td>
              </tr>
              <tr>
                <td className="p-4 font-medium">Supporto italiano</td>
                <td className="p-4 text-green-700 font-bold">✓ WhatsApp diretto</td>
                <td className="p-4 text-green-700">✓ Sì</td>
                <td className="p-4 text-green-700">✓ Sì</td>
                <td className="p-4 text-green-700">✓ Sì</td>
              </tr>
              <tr>
                <td className="p-4 font-medium">Trial senza carta</td>
                <td className="p-4 text-green-700 font-bold">✓ 15 giorni</td>
                <td className="p-4 text-red-600">✗ Demo obbligatoria</td>
                <td className="p-4 text-green-700">✓ 14 giorni</td>
                <td className="p-4 text-red-600">✗ No</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* RECENSIONI */}
      <section className="section bg-stone-50/50">
        <div className="section-label">Opinioni</div>
        <h2 className="section-title">Cosa dicono i direttori</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-12 text-left">
          <div className="bg-white p-6 rounded-xl border border-stone-250/50 shadow-sm flex flex-col justify-between">
            <p className="text-sm text-stone-600 italic leading-relaxed">
              "Finalmente un gestionale che capisce come funziona una scuola di musica. Setup in 5 minuti e i miei dati restano nel mio PC. Zero pensieri."
            </p>
            <div className="mt-6 border-t pt-4">
              <h5 className="font-bold text-stone-900 text-sm">Marco R.</h5>
              <p className="text-xs text-stone-400">Direttore Accademia Musicale, Milano</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-stone-250/50 shadow-sm flex flex-col justify-between">
            <p className="text-sm text-stone-600 italic leading-relaxed">
              "Prima usavamo Excel per tutto. Con Solfège i pagamenti scaduti li vedo subito e le ricevute PDF le mando su WhatsApp in un secondo."
            </p>
            <div className="mt-6 border-t pt-4">
              <h5 className="font-bold text-stone-900 text-sm">Elena B.</h5>
              <p className="text-xs text-stone-400">Segreteria Scuola di Musica, Roma</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-stone-250/50 shadow-sm flex flex-col justify-between">
            <p className="text-sm text-stone-600 italic leading-relaxed">
              "Paghi una volta e non ci pensi più. Nessun abbonamento da ricordare, nessuna sorpresa. E quando ho avuto un problema il supporto ha risposto in meno di un'ora."
            </p>
            <div className="mt-6 border-t pt-4">
              <h5 className="font-bold text-stone-900 text-sm">Luca V.</h5>
              <p className="text-xs text-stone-400">Insegnante e co-fondatore, Napoli</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINALE */}
      <section className="section bg-[#1A1714] text-white">
        <h2 className="section-title text-white">Pronto a portare ordine nella tua scuola?</h2>
        <p className="section-sub text-stone-400">15 giorni di prova completa. Poi €249 una tantum, per sempre.</p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
          <a href="https://wa.me/393517064080" target="_blank" rel="noopener noreferrer" className="btn-primary bg-[#E8621A] hover:bg-[#C94E0E] text-white py-3 px-6 rounded-xl font-bold uppercase tracking-wider text-sm flex items-center gap-2">
            Acquista ora — €249
          </a>
          <a href="https://wa.me/393517064080" target="_blank" rel="noopener noreferrer" className="btn-outline border-white hover:bg-white/10 py-3 px-6 rounded-xl font-bold uppercase tracking-wider text-sm" style={{ color: '#ffffff', borderColor: '#ffffff' }}>
            Scrivici su WhatsApp
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="landing-footer p-12 text-center text-xs text-stone-400 space-y-6 max-w-5xl mx-auto border-t border-stone-200">
        <div className="flex justify-center gap-6 font-bold uppercase tracking-wider">
          <a href="#pricing" className="hover:text-stone-600 transition-colors">Acquista</a>
          <span>·</span>
          <a href="https://wa.me/393517064080" target="_blank" rel="noopener noreferrer" className="hover:text-stone-600 transition-colors">Supporto WhatsApp</a>
          <span>·</span>
          <a href="mailto:admindany@gmail.com" className="hover:text-stone-600 transition-colors">Email</a>
        </div>
        <p>
          © 2026 Solfège — App Desktop per Scuole di Musica · Made in Italy · Sviluppato da CosmoNet.info
        </p>
      </footer>
    </div>
  );
}
