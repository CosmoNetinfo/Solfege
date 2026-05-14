import Link from "next/link";
import { Music, ArrowLeft, ShieldCheck, Lock, Eye, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans">
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Music className="h-6 w-6 text-orange" />
            <span className="text-xl font-serif font-bold tracking-tight">Solfège</span>
          </Link>
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-stone-500">
              <ArrowLeft className="mr-2 h-4 w-4" /> Torna al Login
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12 md:py-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="space-y-4 mb-12 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-stone-900 leading-tight">
            Informativa sulla Privacy
          </h1>
          <p className="text-stone-500 text-lg">Ultimo aggiornamento: 14 Maggio 2026</p>
        </div>

        <div className="grid gap-12">
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-orange">
              <ShieldCheck className="h-6 w-6" />
              <h2 className="text-xl font-bold uppercase tracking-wider">Premessa</h2>
            </div>
            <p className="leading-relaxed text-stone-700">
              La presente Informativa sulla privacy descrive come <strong>Solfège</strong> raccoglie, utilizza e protegge i dati personali degli utenti (allievi, genitori, docenti e amministratori) che utilizzano la nostra piattaforma gestionale per scuole di musica.
              La protezione dei tuoi dati è per noi una priorità assoluta.
            </p>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3 text-orange">
              <FileText className="h-6 w-6" />
              <h2 className="text-xl font-bold uppercase tracking-wider">Dati Raccolti</h2>
            </div>
            <p className="leading-relaxed text-stone-700">
              Raccogliamo esclusivamente i dati necessari per la gestione dell'attività didattica e amministrativa della tua scuola di musica:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-stone-700">
              <li><strong>Dati Anagrafici:</strong> Nome, cognome, data di nascita degli allievi e dei genitori (per i minorenni).</li>
              <li><strong>Dati di Contatto:</strong> Indirizzo email, numero di telefono, indirizzo di residenza.</li>
              <li><strong>Dati Didattici:</strong> Strumento musicale di interesse, presenze alle lezioni, argomenti trattati e compiti assegnati.</li>
              <li><strong>Dati Amministrativi:</strong> Storico dei pagamenti e delle scadenze (Solfège non memorizza i dati delle tue carte di credito).</li>
            </ul>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3 text-orange">
              <Lock className="h-6 w-6" />
              <h2 className="text-xl font-bold uppercase tracking-wider">Finalità del Trattamento</h2>
            </div>
            <p className="leading-relaxed text-stone-700">
              I dati vengono trattati per le seguenti finalità:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-stone-700">
              <li>Gestione del calendario delle lezioni e delle aule.</li>
              <li>Comunicazione tra scuola, docenti e allievi.</li>
              <li>Emissione di ricevute di pagamento.</li>
              <li>Invio di promemoria per scadenze amministrative e lezioni.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3 text-orange">
              <Eye className="h-6 w-6" />
              <h2 className="text-xl font-bold uppercase tracking-wider">Condivisione dei Dati</h2>
            </div>
            <p className="leading-relaxed text-stone-700">
              I dati personali non vengono mai venduti a terzi. Sono accessibili solo al personale autorizzato della tua scuola di musica (amministrazione e docenti assegnati) per lo svolgimento delle attività istituzionali.
            </p>
          </section>

          <section className="bg-orange/5 border border-orange/10 p-8 rounded-2xl space-y-4">
            <h2 className="text-lg font-bold text-stone-900">I tuoi diritti</h2>
            <p className="text-sm text-stone-600 leading-relaxed">
              In conformità con il GDPR (Regolamento UE 2016/679), hai il diritto di accedere ai tuoi dati, chiederne la rettifica, la cancellazione o la limitazione del trattamento in qualsiasi momento. Per esercitare questi diritti, puoi contattare direttamente la segreteria della tua scuola di musica o scrivere al nostro supporto tecnico.
            </p>
          </section>
        </div>

        <footer className="mt-20 pt-12 border-t border-stone-200 text-center text-stone-400 text-sm">
          <p>© 2026 Solfège — Tutti i diritti riservati.</p>
        </footer>
      </main>
    </div>
  );
}
