'use client';

import { Button } from '@/components/ui/button';
import { CreditCard, CheckCircle2, Zap } from 'lucide-react';

export function SubscriptionTab({ school }: { school: any }) {
  const isTrial = school?.plan === 'trial';
  const trialEnds = school?.trial_ends_at ? new Date(school.trial_ends_at) : null;
  const daysRemaining = trialEnds ? Math.ceil((trialEnds.getTime() - new Date().getTime()) / (1000 * 3600 * 24)) : 0;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h3 className="text-lg font-medium">Piano e Fatturazione</h3>
        <p className="text-sm text-muted-foreground">
          Gestisci il tuo abbonamento a Solfège e i metodi di pagamento.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Piano Corrente */}
        <div className="bg-card border rounded-xl p-6 relative overflow-hidden">
          {isTrial && (
            <div className="absolute top-0 right-0 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1">
              <Zap className="w-3 h-3 fill-current" /> IN PROVA
            </div>
          )}
          
          <h4 className="text-sm font-medium text-muted-foreground mb-1">Piano Attuale</h4>
          <div className="text-2xl font-bold mb-4 capitalize">{school?.plan || 'Free'}</div>
          
          {isTrial && daysRemaining > 0 && (
            <div className="mb-6 bg-amber-50 text-amber-800 p-3 rounded-lg text-sm border border-amber-200">
              Ti restano <strong>{daysRemaining} giorni</strong> di prova gratuita. Passa a Pro per non interrompere il servizio.
            </div>
          )}

          <ul className="space-y-2 mb-6 text-sm">
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Allievi illimitati</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Corsi e lezioni illimitate</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> App Docenti inclusa</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Generazione PDF ricevute</li>
          </ul>

          <Button className="w-full bg-[#E8621A] text-white hover:bg-[#E8621A]/90">
            {isTrial ? 'Passa a PRO' : 'Gestisci Abbonamento'}
          </Button>
        </div>

        {/* Metodo di pagamento */}
        <div className="bg-card border rounded-xl p-6 flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-4">Metodo di Pagamento</h4>
            <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/30">
              <div className="w-12 h-8 bg-slate-200 rounded flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-slate-500" />
              </div>
              <div>
                <div className="font-medium">Nessuna carta aggiunta</div>
                <div className="text-sm text-muted-foreground">Aggiungi una carta per i rinnovi</div>
              </div>
            </div>
          </div>
          <Button variant="outline" className="w-full mt-6">
            Aggiungi Metodo
          </Button>
        </div>
      </div>
      
      <div className="text-xs text-muted-foreground mt-8 p-4 bg-muted/50 rounded-lg">
        L'integrazione completa con Stripe per la gestione autonoma degli abbonamenti e delle fatture elettroniche arriverà con la versione 2.0 di Solfège. Nel frattempo, per modifiche contrattuali contatta il supporto.
      </div>
    </div>
  );
}
