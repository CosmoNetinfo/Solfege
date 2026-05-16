"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, X, MessageCircle, Mail, Star, Zap } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';

type BillingCycle = 'monthly' | 'annual' | 'lifetime';

export function SubscriptionTab({ school }: { school: any }) {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('annual');
  const [contactDialog, setContactDialog] = useState<{ open: boolean, planName: string, planPrice: string, isWhiteLabel?: boolean }>({
    open: false,
    planName: '',
    planPrice: ''
  });

  const currentPlan = school?.plan || 'free';
  const isLifetime = billingCycle === 'lifetime';

  const PLANS = [
    {
      id: 'free',
      name: 'Free',
      subtitle: isLifetime ? 'Sempre gratis' : 'Perfetto per iniziare',
      monthlyPrice: 0,
      annualPrice: 0,
      lifetimePrice: 0,
      foundersPrice: 0,
      description: 'Per sempre',
      features: [
        { label: 'Fino a 20 allievi', included: true },
        { label: 'Fino a 2 docenti', included: true },
        { label: 'Calendario lezioni', included: true },
        { label: 'Registro presenze', included: true },
        { label: 'Pagamenti base', included: true },
        { label: 'PDF ricevute', included: false },
        { label: 'Statistiche avanzate', included: false },
        { label: 'App docenti mobile', included: false },
        { label: 'Supporto prioritario', included: false },
      ],
      buttonText: currentPlan === 'free' ? 'Piano Attuale' : (isLifetime ? 'Inizia gratis' : 'Downgrade'),
      disabled: currentPlan === 'free'
    },
    {
      id: 'starter',
      name: 'Starter',
      subtitle: isLifetime ? 'Una volta · per sempre' : 'Ideale fino a 50 allievi',
      monthlyPrice: 14,
      annualPrice: 129,
      lifetimePrice: 249,
      foundersPrice: 159,
      savingsLabel: 'Equivale a 1.9 anni di Starter annuale',
      description: 'Per piccole scuole',
      features: [
        { label: 'Fino a 50 allievi', included: true },
        { label: 'Fino a 5 docenti', included: true },
        { label: 'Tutto il piano Free', included: true },
        { label: 'PDF ricevute', included: true },
        { label: 'App docenti mobile', included: true },
        { label: 'Statistiche base', included: true },
        { label: 'Supporto email', included: true },
        { label: 'Statistiche avanzate', included: false },
        { label: 'Export CSV', included: false },
        { label: 'White label', included: false },
      ],
      buttonText: currentPlan === 'starter' ? 'Piano Attuale' : (isLifetime ? 'Acquista Lifetime' : 'Attiva Starter'),
      disabled: currentPlan === 'starter'
    },
    {
      id: 'pro',
      name: 'Pro',
      subtitle: isLifetime ? 'Una volta · per sempre' : 'Tutto illimitato',
      monthlyPrice: 29,
      annualPrice: 249,
      lifetimePrice: 449,
      foundersPrice: 289,
      savingsLabel: 'Equivale a 1.8 anni di Pro annuale',
      description: 'Per scuole in crescita',
      badge: 'Più Popolare',
      features: [
        { label: 'Allievi illimitati', included: true },
        { label: 'Docenti illimitati', included: true },
        { label: 'Tutto Starter', included: true },
        { label: 'Statistiche avanzate', included: true },
        { label: 'Export CSV', included: true },
        { label: 'Solleciti automatici', included: true },
        { label: 'Supporto prioritario', included: true },
        { label: 'Backup giornaliero', included: true },
        { label: 'Branding custom', included: false },
        { label: 'Dominio proprio', included: false },
      ],
      buttonText: currentPlan === 'pro' ? 'Piano Attuale' : (isLifetime ? 'Acquista Lifetime' : 'Attiva Pro'),
      disabled: currentPlan === 'pro'
    },
    {
      id: 'white_label',
      name: 'White Label',
      subtitle: isLifetime ? 'Una volta · per sempre' : 'Per franchising e catene',
      monthlyPrice: 79,
      annualPrice: 790,
      lifetimePrice: 1290,
      foundersPrice: 849,
      savingsLabel: 'Equivale a 1.6 anni di White Label annuale',
      description: 'Personalizzazione totale',
      badge: 'ENTERPRISE',
      isWhiteLabel: true,
      features: [
        { label: 'Tutto il piano Pro', included: true },
        { label: 'Logo e branding', included: true },
        { label: 'Dominio custom', included: true },
        { label: 'Multi-sede', included: true },
        { label: 'Supporto dedicato', included: true },
        { label: 'Onboarding assistito', included: true },
        { label: 'SLA garantito', included: true },
        { label: 'Fatturazione elettr.', included: true },
      ],
      buttonText: currentPlan === 'white_label' ? 'Piano Attuale' : (isLifetime ? 'Contattaci' : 'Contattaci'),
      disabled: currentPlan === 'white_label'
    }
  ];

  return (
    <div className="space-y-12 max-w-7xl mx-auto pb-20 px-4">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-serif font-bold text-foreground">Piano e Fatturazione</h2>
          <p className="text-muted-foreground mt-2">Prezzi trasparenti. Nessuna chiamata di vendita. Cambia piano quando vuoi.</p>
        </div>

        <div className="flex p-1 bg-muted/50 rounded-xl border border-border/50 self-start md:self-auto">
          {(['monthly', 'annual', 'lifetime'] as BillingCycle[]).map((cycle) => (
            <button
              key={cycle}
              onClick={() => setBillingCycle(cycle)}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
                billingCycle === cycle 
                  ? 'bg-white text-orange shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {cycle === 'monthly' && 'Mensile'}
              {cycle === 'annual' && (
                <span className="flex items-center gap-1.5">
                  Annuale
                  <Badge className="bg-green-100 text-green-700 border-none px-1.5 text-[10px]"> -28% </Badge>
                </span>
              )}
              {cycle === 'lifetime' && (
                <span className="flex items-center gap-1.5">
                  Lifetime
                  <Badge className="bg-orange/10 text-orange border-none px-1.5 text-[10px]"> PAGHI UNA VOLTA </Badge>
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {isLifetime && (
        <div className="bg-[#FDF0E8] border border-orange/30 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-orange text-white p-3 rounded-xl shadow-lg shadow-orange/20">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-orange-950 flex items-center gap-2">
                Founders Deal — Solo per i primi 30 acquirenti
              </h3>
              <p className="text-orange-800 font-medium">Sconto 35% sul prezzo lifetime. 12 posti rimasti.</p>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-4 text-sm font-bold text-orange-900 bg-white/50 px-6 py-3 rounded-xl border border-orange/10">
            <div className="flex flex-col items-center">
              <span className="text-[10px] opacity-60 uppercase">Starter</span>
              <span>€159</span>
            </div>
            <div className="w-px h-8 bg-orange/20" />
            <div className="flex flex-col items-center">
              <span className="text-[10px] opacity-60 uppercase">Pro</span>
              <span>€289</span>
            </div>
            <div className="w-px h-8 bg-orange/20" />
            <div className="flex flex-col items-center">
              <span className="text-[10px] opacity-60 uppercase">White Label</span>
              <span>€849</span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
        {PLANS.map((plan) => {
          let price = billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;
          if (isLifetime) price = plan.lifetimePrice;
          
          const displayPrice = `€${isLifetime && plan.foundersPrice > 0 ? plan.foundersPrice : price}`;
          const periodLabel = billingCycle === 'monthly' ? '/mese' : (billingCycle === 'annual' ? '/anno' : '');
          const isPro = plan.id === 'pro';
          const isWhite = plan.id === 'white_label';

          return (
            <div 
              key={plan.id}
              className={`relative flex flex-col justify-between rounded-2xl p-8 transition-all duration-300
                ${isPro ? 'border-2 border-orange bg-orange/5 shadow-xl scale-105 z-10' : 
                  isWhite ? 'border-2 border-[#1A1714] bg-stone-50 shadow-md' : 
                  'border border-border bg-card shadow-sm hover:shadow-md'
                }`}
            >
              {plan.badge && (
                <div className={`absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full text-white shadow-lg
                  ${isPro ? 'bg-orange' : 'bg-[#1A1714]'}`}
                >
                  {plan.badge}
                </div>
              )}

              <div className="mb-8">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                  {isLifetime && plan.lifetimePrice > 0 && (
                    <Badge className="bg-orange/10 text-orange border-none text-[9px] font-black uppercase tracking-tighter h-5">
                      LIFETIME
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-4">{plan.description}</p>
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-foreground">{displayPrice}</span>
                    <span className="text-muted-foreground text-sm font-medium">{periodLabel}</span>
                    {isLifetime && plan.lifetimePrice > 0 && (
                      <span className="text-muted-foreground text-sm line-through opacity-50 ml-1">€{plan.lifetimePrice}</span>
                    )}
                  </div>
                  {isLifetime && plan.savingsLabel && (
                    <p className="text-[10px] text-orange-600 font-bold mt-1 uppercase tracking-tight">
                      {plan.savingsLabel}
                    </p>
                  )}
                  {billingCycle === 'annual' && plan.monthlyPrice > 0 && (
                    <p className="text-[10px] text-green-600 font-bold mt-1 italic">
                      Circa €{Math.round(plan.annualPrice / 12)}/mese
                    </p>
                  )}
                </div>
                <p className="text-sm text-foreground/80 mt-4 font-medium">{plan.subtitle}</p>
              </div>

              <ul className="space-y-3.5 mb-10 flex-1">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    {feature.included ? (
                      <Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-muted mt-0.5 shrink-0" />
                    )}
                    <span className={`text-sm ${feature.included ? 'text-foreground/90' : 'text-muted-foreground'}`}>
                      {feature.label}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                variant={isPro ? 'default' : (isLifetime && !isWhite && !plan.disabled ? 'default' : 'outline')}
                className={`w-full py-6 text-sm font-bold uppercase tracking-wider transition-all
                  ${isPro || (isLifetime && !isWhite && !plan.disabled) ? 'bg-orange hover:bg-orange-dark text-white' : 
                    isWhite ? 'border-2 border-[#1A1714] hover:bg-[#1A1714] hover:text-white' : 
                    'hover:bg-orange/5 hover:border-orange/30'
                  }
                  ${plan.disabled ? 'bg-stone-100 text-stone-400 border-stone-200 shadow-none' : ''}
                `}
                disabled={plan.disabled}
                onClick={() => setContactDialog({ 
                    open: true, 
                    planName: isLifetime ? `${plan.name} Lifetime` : plan.name, 
                    planPrice: isLifetime ? `Pagamento unico: ${displayPrice}` : `${displayPrice}${periodLabel}`,
                    isWhiteLabel: plan.isWhiteLabel
                })}
              >
                {plan.buttonText}
              </Button>
            </div>
          );
        })}
      </div>

      {isLifetime && (
        <div className="bg-stone-50 border border-stone-200 p-6 rounded-2xl text-center max-w-3xl mx-auto shadow-sm">
          <p className="text-sm text-stone-600 leading-relaxed font-medium">
            Il Lifetime Deal include tutti gli aggiornamenti futuri (v1.5, v2.0), 
            migrazione dati assistita, 1 ora di onboarding e supporto prioritario WhatsApp.<br />
            <span className="text-orange font-bold">Pagamento via WhatsApp o email — Stripe disponibile in v2.0.</span>
          </p>
        </div>
      )}

      {!isLifetime && (
        <div className="bg-stone-100/80 p-6 rounded-2xl border border-border/40 text-center max-w-2xl mx-auto">
          <p className="text-xs text-muted-foreground leading-relaxed">
            L'integrazione pagamenti automatica con Stripe (addebito mensile, fatture automatiche, cancellazione autonoma) 
            sarà disponibile nella versione 2.0 di Solfège — prevista per fine 2026.<br />
            Per attivare un piano ora contatta il supporto via WhatsApp o email.
          </p>
        </div>
      )}

      <div className="pt-12 space-y-8">
        <h3 className="text-2xl font-serif font-bold text-center">Perché Solfège?</h3>
        <div className="border border-border/60 rounded-2xl overflow-hidden shadow-sm max-w-4xl mx-auto bg-white">
          <Table>
            <TableHeader className="bg-orange/5">
              <TableRow>
                <TableHead className="w-[300px] font-bold text-foreground">Funzione</TableHead>
                <TableHead className="font-bold text-orange text-center">Solfège</TableHead>
                <TableHead className="font-bold text-muted-foreground text-center">Competitor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                { label: 'Prezzi pubblici', solfege: 'Sì', comp: '"Contattaci"' },
                { label: 'Trial senza carta', solfege: 'Sì', comp: 'No' },
                { label: 'App mobile docenti', solfege: 'Sì', comp: 'No' },
                { label: 'Setup autonomo', solfege: 'Sì', comp: 'Demo obbligatoria' },
                { label: 'UI moderna', solfege: 'Sì', comp: 'No' },
                { label: 'Multi-tenant', solfege: 'Sì', comp: 'No' },
                { label: 'Prezzo mensile', solfege: '€14 / €29', comp: '€30 - €80+' },
              ].map((row, i) => (
                <TableRow key={i} className="hover:bg-muted/30">
                  <TableCell className="font-medium">{row.label}</TableCell>
                  <TableCell className="text-orange font-bold text-center">
                    <div className="flex items-center justify-center gap-2">
                        <Check className="h-4 w-4" /> {row.solfege}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-center">{row.comp}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={contactDialog.open} onOpenChange={(o) => setContactDialog(p => ({ ...p, open: o }))}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-orange p-6 text-white text-center">
            <h2 className="text-2xl font-serif font-bold mb-1">
                {contactDialog.isWhiteLabel ? 'Richiedi una Demo' : `Attiva Piano ${contactDialog.planName}`}
            </h2>
            <p className="opacity-90 font-medium">{contactDialog.planPrice}</p>
          </div>
          
          <div className="p-8 space-y-6">
            <div className="text-sm text-foreground leading-relaxed space-y-4">
              <p>
                {contactDialog.isWhiteLabel ? (
                    "Parla con noi per una demo personalizzata e scopri come Solfège può adattarsi al tuo brand e alla tua rete di scuole."
                ) : (
                    "L'integrazione pagamenti Stripe sarà disponibile nella v2.0. Per attivare subito il tuo piano contattaci:"
                )}
              </p>
              <div className="font-bold text-center py-2 bg-orange/5 rounded-lg border border-orange/10">
                  Ti risponeremo entro 24 ore.
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button 
                className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white h-14 text-lg font-bold"
                onClick={() => window.open('https://wa.me/393517064080', '_blank')}
              >
                <MessageCircle className="mr-2 h-6 w-6" />
                WhatsApp →
              </Button>
              <Button 
                variant="outline"
                className="w-full h-14 text-lg border-border font-bold"
                onClick={() => window.location.href = `mailto:admindany@gmail.com?subject=${contactDialog.isWhiteLabel ? 'Richiesta Demo White Label' : `Attivazione piano Solfège ${contactDialog.planName}`}`}
              >
                <Mail className="mr-2 h-5 w-5" />
                Email →
              </Button>
            </div>
            
            <p className="text-center">
                <button 
                    onClick={() => setContactDialog(p => ({ ...p, open: false }))}
                    className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
                >
                    Chiudi
                </button>
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

