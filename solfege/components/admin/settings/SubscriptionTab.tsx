"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, X, MessageCircle, Mail, Star } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';

// Custom Switch component to avoid dependency issues
const Switch = ({ checked, onCheckedChange }: { checked: boolean, onCheckedChange: (v: boolean) => void }) => (
    <button 
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onCheckedChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 ${checked ? 'bg-orange' : 'bg-stone-200'}`}
    >
        <span className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
);

export function SubscriptionTab({ school }: { school: any }) {
  const [isAnnual, setIsAnnual] = useState(false);
  const [contactDialog, setContactDialog] = useState<{ open: boolean, planName: string, planPrice: string, isWhiteLabel?: boolean }>({
    open: false,
    planName: '',
    planPrice: ''
  });

  const currentPlan = school?.plan || 'free';

  const PLANS = [
    {
      id: 'free',
      name: 'Free',
      subtitle: 'Perfetto per iniziare',
      monthlyPrice: 0,
      annualPrice: 0,
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
      buttonText: currentPlan === 'free' ? 'Piano Attuale' : 'Downgrade',
      disabled: currentPlan === 'free'
    },
    {
      id: 'starter',
      name: 'Starter',
      subtitle: 'Ideale fino a 50 allievi',
      monthlyPrice: 14,
      annualPrice: 129,
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
      buttonText: currentPlan === 'starter' ? 'Piano Attuale' : 'Attiva Starter',
      disabled: currentPlan === 'starter'
    },
    {
      id: 'pro',
      name: 'Pro',
      subtitle: 'Tutto illimitato',
      monthlyPrice: 29,
      annualPrice: 249,
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
      buttonText: currentPlan === 'pro' ? 'Piano Attuale' : 'Attiva Pro',
      disabled: currentPlan === 'pro'
    },
    {
      id: 'white_label',
      name: 'White Label',
      subtitle: 'Per franchising e catene',
      monthlyPrice: 79,
      annualPrice: 790,
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
      buttonText: currentPlan === 'white_label' ? 'Piano Attuale' : 'Contattaci',
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

        <div className="flex items-center gap-4 bg-muted/50 p-2 rounded-lg border border-border/50">
          <Label className={`text-sm font-medium ${!isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>Mensile</Label>
          <Switch 
            checked={isAnnual} 
            onCheckedChange={setIsAnnual} 
          />
          <Label className={`text-sm font-medium ${isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
            Annuale <Badge variant="secondary" className="ml-1 bg-green-100 text-green-700 hover:bg-green-100 border-none">Risparmia fino al 28%</Badge>
          </Label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {PLANS.map((plan) => {
          const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;
          const displayPrice = `€${price}`;
          const periodLabel = isAnnual ? '/anno' : '/mese';
          const isPro = plan.id === 'pro';
          const isWhite = plan.id === 'white_label';

          return (
            <div 
              key={plan.id}
              className={`relative flex flex-col rounded-2xl p-8 transition-all duration-300
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
                <h3 className="text-xl font-bold text-foreground mb-1">{plan.name}</h3>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-4">{plan.description}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-foreground">{displayPrice}</span>
                  <span className="text-muted-foreground text-sm font-medium">{periodLabel}</span>
                </div>
                {isAnnual && plan.monthlyPrice > 0 && (
                    <p className="text-[10px] text-green-600 font-bold mt-1 italic">
                        Circa €{Math.round(plan.annualPrice / 12)}/mese
                    </p>
                )}
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
                variant={isPro ? 'default' : 'outline'}
                className={`w-full py-6 text-sm font-bold uppercase tracking-wider transition-all
                  ${isPro ? 'bg-orange hover:bg-orange-dark text-white' : 
                    isWhite ? 'border-2 border-[#1A1714] hover:bg-[#1A1714] hover:text-white' : 
                    'hover:bg-orange/5 hover:border-orange/30'
                  }
                  ${plan.disabled ? 'bg-stone-100 text-stone-400 border-stone-200 shadow-none' : ''}
                `}
                disabled={plan.disabled}
                onClick={() => setContactDialog({ 
                    open: true, 
                    planName: plan.name, 
                    planPrice: `${displayPrice}${periodLabel}`,
                    isWhiteLabel: plan.isWhiteLabel
                })}
              >
                {plan.buttonText}
              </Button>
            </div>
          );
        })}
      </div>

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

      <div className="bg-stone-100/80 p-6 rounded-2xl border border-border/40 text-center max-w-2xl mx-auto">
        <p className="text-xs text-muted-foreground leading-relaxed">
          L'integrazione pagamenti automatica con Stripe (addebito mensile, fatture automatiche, cancellazione autonoma) 
          sarà disponibile nella versione 2.0 di Solfège — prevista per fine 2026.<br />
          Per attivare un piano ora contatta il supporto via WhatsApp o email.
        </p>
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
