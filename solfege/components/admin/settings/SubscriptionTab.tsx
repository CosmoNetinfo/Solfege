'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Zap, Check, Star, Mail, MessageCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const PLANS = [
  {
    name: 'TRIAL',
    price: '€0',
    period: '30 giorni',
    features: ['Tutto incluso', 'Allievi illimitati', 'Docenti illimitati', 'PDF', 'App doc.'],
    type: 'trial',
    badge: 'PIANO ATTUALE',
    buttonText: 'Attivo',
    disabled: true
  },
  {
    name: 'STARTER',
    price: '€19/mese',
    period: '',
    features: ['50 allievi', '5 docenti', 'Tutte le funzioni', 'PDF ricevute', 'Supporto email'],
    type: 'starter',
    buttonText: 'Contattaci'
  },
  {
    name: 'PRO',
    price: '€39/mese',
    period: '',
    features: ['Illimitato', 'Tutti i moduli', 'PDF ricevute', 'Supporto priorità', 'App doc.'],
    type: 'pro',
    badge: 'Più popolare',
    badgeIcon: Star,
    buttonText: 'Contattaci'
  },
  {
    name: 'WHITE LABEL',
    price: '€99/mese',
    period: '',
    features: ['Illimitato', 'Branding custom', 'Dominio proprio', 'Supporto dedicato', 'Fatturazione'],
    type: 'whitelabel',
    badge: 'ENTERPRISE',
    buttonText: 'Contattaci'
  }
];

export function SubscriptionTab({ school }: { school: any }) {
  const isTrial = school?.plan === 'trial' || !school?.plan;
  const trialEnds = school?.trial_ends_at ? new Date(school.trial_ends_at) : null;
  const daysRemaining = trialEnds ? Math.ceil((trialEnds.getTime() - new Date().getTime()) / (1000 * 3600 * 24)) : 0;

  const [contactDialog, setContactDialog] = useState<{ open: boolean, planName: string, planPrice: string }>({
    open: false,
    planName: '',
    planPrice: ''
  });

  return (
    <div className="space-y-8 max-w-6xl pb-8">
      {/* Current Plan Section */}
      <div>
        <h3 className="text-lg font-medium">Piano e Fatturazione</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Gestisci il tuo abbonamento a Solfège e i metodi di pagamento.
        </p>

        <div className="bg-card border rounded-xl p-6 relative overflow-hidden max-w-2xl">
          {isTrial && (
            <div className="absolute top-0 right-0 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1">
              <Zap className="w-3 h-3 fill-current" /> IN PROVA
            </div>
          )}
          
          <h4 className="text-sm font-medium text-muted-foreground mb-1">Piano Attuale</h4>
          <div className="text-2xl font-bold mb-4 capitalize">{school?.plan || 'trial'}</div>
          
          {isTrial && daysRemaining > 0 && (
            <div className="bg-amber-50 text-amber-800 p-3 rounded-lg text-sm border border-amber-200">
              Ti restano <strong>{daysRemaining} giorni</strong> di prova gratuita. Passa a Pro per non interrompere il servizio.
            </div>
          )}
        </div>
      </div>

      {/* Pricing Plans */}
      <div className="space-y-6">
        <h3 className="text-lg font-medium">Piani disponibili</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
          {PLANS.map((plan) => {
            const isPro = plan.type === 'pro';
            const isWhiteLabel = plan.type === 'whitelabel';
            const isTrialCard = plan.type === 'trial';
            
            return (
              <div 
                key={plan.name} 
                className={`relative bg-card rounded-xl p-6 flex flex-col justify-between
                  ${isPro ? 'border-2 border-orange shadow-md' : 
                    isWhiteLabel ? 'border-2 border-slate-800 shadow-sm' : 
                    isTrialCard ? 'border-2 border-orange/50' : 'border border-border'
                  }`}
              >
                {/* Badges */}
                {plan.badge && (
                  <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-bold uppercase rounded-full flex items-center gap-1 whitespace-nowrap
                    ${isPro ? 'bg-orange text-white' : 
                      isWhiteLabel ? 'bg-slate-800 text-white' : 
                      'bg-orange/10 text-orange border border-orange/20'
                    }`}
                  >
                    {plan.badgeIcon && <plan.badgeIcon className="w-3 h-3 fill-current" />}
                    {plan.badge}
                  </div>
                )}

                <div className="text-center mt-2 mb-6">
                  <h4 className="font-bold text-muted-foreground mb-2">{plan.name}</h4>
                  <div className="text-3xl font-extrabold">{plan.price}</div>
                  {plan.period && <div className="text-sm text-muted-foreground">{plan.period}</div>}
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  variant={isPro ? 'default' : 'outline'}
                  className={`w-full ${isPro ? 'bg-orange text-white hover:bg-orange-dark' : ''} ${isTrialCard ? 'opacity-50 pointer-events-none' : ''}`}
                  disabled={plan.disabled}
                  onClick={() => !plan.disabled && setContactDialog({ open: true, planName: plan.name, planPrice: plan.price })}
                >
                  {plan.buttonText}
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-xs text-muted-foreground text-center p-4 bg-muted/30 rounded-lg max-w-4xl mx-auto">
        L'integrazione pagamenti automatica con Stripe sarà disponibile nella versione 2.0 di Solfège.
      </div>

      <Dialog open={contactDialog.open} onOpenChange={(open) => setContactDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Vuoi attivare il piano {contactDialog.planName}?</DialogTitle>
            <DialogDescription>
              {contactDialog.planPrice}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <p className="text-sm text-foreground">
              Contattaci per attivare il tuo abbonamento:
            </p>
            <div className="flex gap-4">
              <Button 
                className="flex-1 bg-[#25D366] hover:bg-[#128C7E] text-white flex items-center gap-2"
                onClick={() => window.open('https://wa.me/393517064080', '_blank')}
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp →
              </Button>
              <Button 
                variant="outline"
                className="flex-1 flex items-center gap-2 border-border"
                onClick={() => window.location.href = `mailto:admindany@gmail.com?subject=Attivazione piano Solfège ${contactDialog.planName}`}
              >
                <Mail className="w-4 h-4" />
                Email →
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
